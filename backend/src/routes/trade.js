'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./pushnotifications');

// ═══════════════════════════════════════════════════════════════
// TRUSTED TRADE LAYER — "Assured Trade Flow"
// Complete end-to-end trade lifecycle:
//   Farmer → Listing (📸 Photo + 📍 GPS + 🎤 Voice)
//   Buyer  → Bid / Accept
//   Platform → Escrow + Quality Verification
//   Delivery → Status Tracking
//   Payment → Auto Release
// ═══════════════════════════════════════════════════════════════

const COMMISSION_RATE = 0.015; // 1.5% platform commission

// Valid trade state transitions
const VALID_TRANSITIONS = {
  created: ['bid_placed', 'cancelled'],
  bid_placed: ['bid_accepted', 'bid_rejected', 'cancelled'],
  bid_accepted: ['escrow_funded', 'cancelled'],
  escrow_funded: ['quality_verified', 'disputed', 'cancelled'],
  quality_verified: ['dispatched', 'disputed'],
  dispatched: ['in_transit', 'disputed'],
  in_transit: ['delivered', 'disputed'],
  delivered: ['payment_released', 'disputed'],
  payment_released: [],
  disputed: ['resolved_seller', 'resolved_buyer'],
  resolved_seller: [],
  resolved_buyer: [],
  cancelled: [],
  bid_rejected: [],
};

// ═══ LISTINGS WITH MEDIA (Photo + GPS + Voice) ═══════════════════════

// POST /api/trade/listings — Create listing with photos, GPS, voice
router.post('/listings', auth, async (req, res) => {
  try {
    const {
      crop_id, district_id, quantity_kg, grade = 'ungraded', is_organic = false,
      price_per_kg, min_order_kg, collection_center, description,
      // New: GPS, Photos, Voice
      lat, lng, photos = [], voice_note_url,
      farmer_name, location_label
    } = req.body;

    if (!crop_id || !quantity_kg) {
      return res.status(400).json({ error: 'crop_id and quantity_kg required' });
    }
    if (!lat || !lng) {
      return res.status(400).json({ error: 'GPS location (lat, lng) required for trusted listing' });
    }

    const id = uuidv4();
    const result = await pool.query(`
      INSERT INTO supply_listings (
        id, fpo_id, farmer_id, crop_id, district_id, quantity_kg, grade, is_organic,
        price_per_kg, min_order_kg, collection_center, description,
        lat, lng, photos, voice_note_url, farmer_name, location_label
      )
      VALUES ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [id, req.user.id, crop_id, district_id, quantity_kg, grade, is_organic,
        price_per_kg, min_order_kg, collection_center, description,
        lat, lng, JSON.stringify(photos), voice_note_url, farmer_name, location_label]);

    // Log activity
    await pool.query(
      `INSERT INTO activity_feed (event_type, actor_name, description, metadata)
       VALUES ('listing_created', $1, $2, $3)`,
      [req.user.name || 'Farmer', `New listing: ${quantity_kg}kg with photos & GPS`,
       JSON.stringify({ listing_id: id, crop_id, has_photos: photos.length > 0, has_gps: true })]
    ).catch(() => {});

    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ BUYER BIDDING ════════════════════════════════════════════════════

// POST /api/trade/bids — Buyer places a bid on a listing
router.post('/bids', auth, async (req, res) => {
  try {
    const { listing_id, price_per_kg, quantity_kg, delivery_address, delivery_lat, delivery_lng, notes } = req.body;

    if (!listing_id || !price_per_kg || !quantity_kg) {
      return res.status(400).json({ error: 'listing_id, price_per_kg, quantity_kg required' });
    }

    // Verify listing exists and is active
    const listing = await pool.query(
      `SELECT sl.*, cc.name AS crop_name FROM supply_listings sl
       JOIN crop_catalog cc ON cc.id = sl.crop_id
       WHERE sl.id = $1 AND sl.status = 'active'`,
      [listing_id]
    );
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found or not active' });

    const l = listing.rows[0];
    if (l.fpo_id === req.user.id || l.farmer_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot bid on your own listing' });
    }
    if (quantity_kg > l.quantity_kg) {
      return res.status(400).json({ error: `Requested quantity exceeds available (${l.quantity_kg}kg)` });
    }
    if (l.min_order_kg && quantity_kg < parseFloat(l.min_order_kg)) {
      return res.status(400).json({ error: `Minimum order is ${l.min_order_kg}kg` });
    }

    const bidId = uuidv4();
    const result = await pool.query(`
      INSERT INTO trade_bids (id, listing_id, buyer_id, price_per_kg, quantity_kg, delivery_address, delivery_lat, delivery_lng, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [bidId, listing_id, req.user.id, price_per_kg, quantity_kg, delivery_address, delivery_lat, delivery_lng, notes]);

    // Notify seller
    const sellerId = l.fpo_id || l.farmer_id;
    await createNotification(
      sellerId, 'trade_bid',
      `New bid: ₹${price_per_kg}/kg for ${quantity_kg}kg of ${l.crop_name}`,
      { bid_id: bidId, listing_id, price_per_kg, quantity_kg }
    ).catch(() => {});

    res.status(201).json({ bid: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade/bids — Get bids (for seller: on their listings; for buyer: their own bids)
router.get('/bids', auth, async (req, res) => {
  try {
    const { listing_id, role = 'auto' } = req.query;

    let queryStr, params;
    if (listing_id) {
      // Get all bids for a specific listing (seller view)
      queryStr = `
        SELECT tb.*, u.name AS buyer_name, u.phone AS buyer_phone,
               ts.score AS buyer_trust_score
        FROM trade_bids tb
        JOIN users u ON u.id = tb.buyer_id
        LEFT JOIN trust_scores ts ON ts.user_id = tb.buyer_id
        WHERE tb.listing_id = $1 AND tb.status = 'active'
        ORDER BY tb.price_per_kg DESC, tb.created_at ASC`;
      params = [listing_id];
    } else {
      // My bids as buyer
      queryStr = `
        SELECT tb.*, sl.quantity_kg AS listing_qty, cc.name AS crop_name, cc.icon_emoji,
               u.name AS seller_name
        FROM trade_bids tb
        JOIN supply_listings sl ON sl.id = tb.listing_id
        JOIN crop_catalog cc ON cc.id = sl.crop_id
        JOIN users u ON u.id = sl.fpo_id
        WHERE tb.buyer_id = $1
        ORDER BY tb.created_at DESC LIMIT 50`;
      params = [req.user.id];
    }

    const result = await pool.query(queryStr, params);
    res.json({ bids: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ TRADE ORDER CREATION (Seller accepts bid) ══════════════════════

// POST /api/trade/accept-bid — Seller accepts a bid → creates trade order
router.post('/accept-bid', auth, async (req, res) => {
  try {
    const { bid_id } = req.body;
    if (!bid_id) return res.status(400).json({ error: 'bid_id required' });

    // Get bid details
    const bidResult = await pool.query(
      `SELECT tb.*, sl.fpo_id, sl.farmer_id, sl.crop_id, sl.district_id, sl.lat, sl.lng, sl.photos
       FROM trade_bids tb
       JOIN supply_listings sl ON sl.id = tb.listing_id
       WHERE tb.id = $1 AND tb.status = 'active'`,
      [bid_id]
    );
    if (!bidResult.rows.length) return res.status(404).json({ error: 'Bid not found or already processed' });

    const bid = bidResult.rows[0];
    const sellerId = bid.fpo_id || bid.farmer_id;
    if (sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the seller can accept bids' });
    }

    const totalAmount = parseFloat(bid.price_per_kg) * parseFloat(bid.quantity_kg);
    const platformFee = Math.round(totalAmount * COMMISSION_RATE * 100) / 100;
    const sellerPayout = totalAmount - platformFee;
    const tradeId = uuidv4();

    // Create trade order
    const tradeResult = await pool.query(`
      INSERT INTO trade_orders (
        id, listing_id, seller_id, buyer_id, crop_id, district_id,
        quantity_kg, price_per_kg, total_amount, platform_fee, seller_payout,
        pickup_lat, pickup_lng, photos,
        delivery_lat, delivery_lng, delivery_address,
        grade, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'bid_accepted')
      RETURNING *
    `, [tradeId, bid.listing_id, req.user.id, bid.buyer_id, bid.crop_id, bid.district_id,
        bid.quantity_kg, bid.price_per_kg, totalAmount, platformFee, sellerPayout,
        bid.lat, bid.lng, bid.photos || '[]',
        bid.delivery_lat, bid.delivery_lng, bid.delivery_address,
        'ungraded']);

    // Update bid status
    await pool.query(`UPDATE trade_bids SET status = 'accepted' WHERE id = $1`, [bid_id]);
    // Reject other bids on same listing
    await pool.query(
      `UPDATE trade_bids SET status = 'rejected' WHERE listing_id = $1 AND id != $2 AND status = 'active'`,
      [bid.listing_id, bid_id]
    );

    // Log timeline
    await pool.query(
      `INSERT INTO trade_timeline (trade_order_id, event, actor_id, actor_role, description)
       VALUES ($1, 'bid_accepted', $2, 'seller', $3)`,
      [tradeId, req.user.id, `Bid accepted: ₹${bid.price_per_kg}/kg × ${bid.quantity_kg}kg = ₹${totalAmount}`]
    );

    // Notify buyer
    await createNotification(
      bid.buyer_id, 'bid_accepted',
      `Your bid of ₹${bid.price_per_kg}/kg was accepted! Please fund escrow (₹${totalAmount})`,
      { trade_order_id: tradeId, total_amount: totalAmount }
    ).catch(() => {});

    res.status(201).json({
      trade_order: tradeResult.rows[0],
      next_step: 'Buyer must fund escrow via POST /api/trade/orders/:id/fund'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ TRADE ORDER LIFECYCLE ═══════════════════════════════════════════

// GET /api/trade/orders — My trade orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { status, role } = req.query;
    let conditions = ['(t.seller_id = $1 OR t.buyer_id = $1)'];
    let params = [req.user.id];
    let i = 2;

    if (role === 'seller') conditions = ['t.seller_id = $1'];
    if (role === 'buyer') conditions = ['t.buyer_id = $1'];
    if (status) { conditions.push(`t.status = $${i++}`); params.push(status); }

    const result = await pool.query(`
      SELECT t.*, cc.name AS crop_name, cc.icon_emoji,
             su.name AS seller_name, bu.name AS buyer_name,
             d.name AS district_name
      FROM trade_orders t
      JOIN crop_catalog cc ON cc.id = t.crop_id
      JOIN users su ON su.id = t.seller_id
      LEFT JOIN users bu ON bu.id = t.buyer_id
      LEFT JOIN districts d ON d.id = t.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.updated_at DESC LIMIT 50
    `, params);

    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade/orders/:id — Trade order detail with timeline
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const orderResult = await pool.query(`
      SELECT t.*, cc.name AS crop_name, cc.icon_emoji, cc.category,
             su.name AS seller_name, su.phone AS seller_phone,
             bu.name AS buyer_name, bu.phone AS buyer_phone,
             d.name AS district_name,
             ts_seller.score AS seller_trust_score,
             ts_buyer.score AS buyer_trust_score
      FROM trade_orders t
      JOIN crop_catalog cc ON cc.id = t.crop_id
      JOIN users su ON su.id = t.seller_id
      LEFT JOIN users bu ON bu.id = t.buyer_id
      LEFT JOIN districts d ON d.id = t.district_id
      LEFT JOIN trust_scores ts_seller ON ts_seller.user_id = t.seller_id
      LEFT JOIN trust_scores ts_buyer ON ts_buyer.user_id = t.buyer_id
      WHERE t.id = $1 AND (t.seller_id = $2 OR t.buyer_id = $2)
    `, [req.params.id, req.user.id]);

    if (!orderResult.rows.length) return res.status(404).json({ error: 'Trade order not found' });

    // Get timeline
    const timeline = await pool.query(
      `SELECT tt.*, u.name AS actor_name
       FROM trade_timeline tt
       LEFT JOIN users u ON u.id = tt.actor_id
       WHERE tt.trade_order_id = $1
       ORDER BY tt.created_at ASC`,
      [req.params.id]
    );

    res.json({
      order: orderResult.rows[0],
      timeline: timeline.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/fund — Buyer funds escrow
router.post('/orders/:id/fund', auth, async (req, res) => {
  try {
    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });
    if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Only buyer can fund escrow' });
    if (order.status !== 'bid_accepted') {
      return res.status(400).json({ error: `Cannot fund escrow in state '${order.status}'. Must be 'bid_accepted'.` });
    }

    // Create escrow record
    const escrowId = uuidv4();
    await pool.query(
      `INSERT INTO escrow_transactions (id, buyer_id, seller_id, order_id, amount, currency, platform_fee, state, description)
       VALUES ($1, $2, $3, $4, $5, 'INR', $6, 'funded', 'Trade escrow for order')`,
      [escrowId, order.buyer_id, order.seller_id, req.params.id, order.total_amount, order.platform_fee]
    );

    // Update trade order
    await pool.query(
      `UPDATE trade_orders SET status = 'escrow_funded', escrow_id = $1, funded_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [escrowId, req.params.id]
    );

    // Timeline entry
    await addTimelineEvent(req.params.id, 'escrow_funded', req.user.id, 'buyer',
      `Escrow funded: ₹${order.total_amount} secured`);

    // Notify seller
    await createNotification(
      order.seller_id, 'escrow_funded',
      `Buyer has funded ₹${order.total_amount} in escrow. Proceed with quality verification.`,
      { trade_order_id: req.params.id }
    ).catch(() => {});

    res.json({
      message: 'Escrow funded successfully',
      escrow_id: escrowId,
      next_step: 'Seller uploads quality verification photos via POST /api/trade/orders/:id/verify-quality'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/verify-quality — Seller uploads quality photos
router.post('/orders/:id/verify-quality', auth, async (req, res) => {
  try {
    const { photos, grade_self_assessed, notes } = req.body;
    if (!photos || photos.length < 2) {
      return res.status(400).json({ error: 'At least 2 quality verification photos required' });
    }

    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });
    if (order.seller_id !== req.user.id) return res.status(403).json({ error: 'Only seller can verify quality' });
    if (order.status !== 'escrow_funded') {
      return res.status(400).json({ error: `Cannot verify quality in state '${order.status}'. Must be 'escrow_funded'.` });
    }

    await pool.query(
      `UPDATE trade_orders SET status = 'quality_verified', quality_verified = TRUE,
       quality_photos = $1, grade = COALESCE($2, grade), updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(photos), grade_self_assessed, req.params.id]
    );

    await addTimelineEvent(req.params.id, 'quality_verified', req.user.id, 'seller',
      `Quality verified with ${photos.length} photos. Grade: ${grade_self_assessed || 'pending'}`, null, null, photos);

    // Notify buyer
    await createNotification(
      order.buyer_id, 'quality_verified',
      `Seller has uploaded quality photos. Review and confirm dispatch.`,
      { trade_order_id: req.params.id, photos }
    ).catch(() => {});

    res.json({
      message: 'Quality verified',
      next_step: 'Seller dispatches via POST /api/trade/orders/:id/dispatch'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/dispatch — Seller marks as dispatched
router.post('/orders/:id/dispatch', auth, async (req, res) => {
  try {
    const { transport_mode, vehicle_number, driver_phone, estimated_delivery } = req.body;

    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });
    if (order.seller_id !== req.user.id) return res.status(403).json({ error: 'Only seller can dispatch' });
    if (order.status !== 'quality_verified') {
      return res.status(400).json({ error: `Cannot dispatch in state '${order.status}'. Must be 'quality_verified'.` });
    }

    await pool.query(
      `UPDATE trade_orders SET status = 'dispatched', dispatched_at = NOW(),
       transport_mode = $1, vehicle_number = $2, driver_phone = $3,
       estimated_delivery = $4, updated_at = NOW()
       WHERE id = $5`,
      [transport_mode, vehicle_number, driver_phone, estimated_delivery, req.params.id]
    );

    await addTimelineEvent(req.params.id, 'dispatched', req.user.id, 'seller',
      `Dispatched via ${transport_mode || 'transport'}. Vehicle: ${vehicle_number || 'N/A'}`);

    await createNotification(
      order.buyer_id, 'order_dispatched',
      `Order dispatched! Vehicle: ${vehicle_number || 'N/A'}. ETA: ${estimated_delivery || 'TBD'}`,
      { trade_order_id: req.params.id, vehicle_number, driver_phone }
    ).catch(() => {});

    res.json({
      message: 'Order dispatched',
      tracking: { transport_mode, vehicle_number, driver_phone, estimated_delivery },
      next_step: 'Track via POST /api/trade/orders/:id/update-location OR buyer confirms delivery'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/update-location — Live GPS tracking update
router.post('/orders/:id/update-location', auth, async (req, res) => {
  try {
    const { lat, lng, notes } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });

    if (order.status === 'dispatched') {
      await pool.query(`UPDATE trade_orders SET status = 'in_transit', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    }

    await addTimelineEvent(req.params.id, 'location_update', req.user.id, 'transport',
      notes || 'Location updated', lat, lng);

    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/confirm-delivery — Buyer confirms delivery
router.post('/orders/:id/confirm-delivery', auth, async (req, res) => {
  try {
    const { rating, photos, notes } = req.body;

    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });
    if (order.buyer_id !== req.user.id) return res.status(403).json({ error: 'Only buyer can confirm delivery' });
    if (!['dispatched', 'in_transit'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot confirm delivery in state '${order.status}'` });
    }

    await pool.query(
      `UPDATE trade_orders SET status = 'delivered', delivered_at = NOW(), actual_delivery = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    await addTimelineEvent(req.params.id, 'delivered', req.user.id, 'buyer',
      `Delivery confirmed by buyer. ${notes || ''}`, null, null, photos || []);

    // Auto-release payment after delivery confirmation
    await pool.query(
      `UPDATE trade_orders SET status = 'payment_released', released_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    // Update escrow
    if (order.escrow_id) {
      await pool.query(
        `UPDATE escrow_transactions SET state = 'released', released_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [order.escrow_id]
      );
    }

    await addTimelineEvent(req.params.id, 'payment_released', null, 'platform',
      `Payment of ₹${order.seller_payout} released to seller (₹${order.platform_fee} platform fee)`);

    // Update trust scores
    await updateTrustScore(order.seller_id, true);
    await updateTrustScore(order.buyer_id, true);

    // Add review if rating provided
    if (rating) {
      await pool.query(
        `INSERT INTO reviews (user_id, target_type, target_id, rating, body)
         VALUES ($1, 'trade', $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [req.user.id, req.params.id, rating, notes || '']
      ).catch(() => {});
    }

    await createNotification(
      order.seller_id, 'payment_released',
      `Payment of ₹${order.seller_payout} released to your account!`,
      { trade_order_id: req.params.id, amount: order.seller_payout }
    ).catch(() => {});

    res.json({
      message: 'Delivery confirmed & payment released',
      payout: { seller_receives: order.seller_payout, platform_fee: order.platform_fee }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/dispute — Either party raises a dispute
router.post('/orders/:id/dispute', auth, async (req, res) => {
  try {
    const { reason, description, evidence_photos } = req.body;
    if (!reason) return res.status(400).json({ error: 'Dispute reason required' });

    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });

    const disputeableStates = ['escrow_funded', 'quality_verified', 'dispatched', 'in_transit', 'delivered'];
    if (!disputeableStates.includes(order.status)) {
      return res.status(400).json({ error: `Cannot dispute in state '${order.status}'` });
    }

    await pool.query(
      `UPDATE trade_orders SET status = 'disputed', disputed_at = NOW(),
       dispute_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [reason, req.params.id]
    );

    // Update escrow if exists
    if (order.escrow_id) {
      await pool.query(
        `UPDATE escrow_transactions SET state = 'disputed', disputed_at = NOW(), dispute_reason = $1 WHERE id = $2`,
        [reason, order.escrow_id]
      );
    }

    const actorRole = order.seller_id === req.user.id ? 'seller' : 'buyer';
    await addTimelineEvent(req.params.id, 'disputed', req.user.id, actorRole,
      `Dispute raised: ${reason}`, null, null, evidence_photos || []);

    // Notify other party
    const otherParty = order.seller_id === req.user.id ? order.buyer_id : order.seller_id;
    await createNotification(
      otherParty, 'trade_disputed',
      `Dispute raised on trade order: ${reason}`,
      { trade_order_id: req.params.id, reason }
    ).catch(() => {});

    res.json({ message: 'Dispute filed. Platform will review within 48 hours.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/orders/:id/cancel — Cancel trade (only in early states)
router.post('/orders/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await getOrderForUser(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Trade order not found' });

    const cancellableStates = ['created', 'bid_placed', 'bid_accepted'];
    if (!cancellableStates.includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel in state '${order.status}'. Use dispute instead.` });
    }

    await pool.query(
      `UPDATE trade_orders SET status = 'cancelled', cancelled_at = NOW(),
       cancel_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [reason, req.params.id]
    );

    const actorRole = order.seller_id === req.user.id ? 'seller' : 'buyer';
    await addTimelineEvent(req.params.id, 'cancelled', req.user.id, actorRole,
      `Order cancelled: ${reason || 'No reason provided'}`);

    res.json({ message: 'Trade order cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ TRUST SCORES ════════════════════════════════════════════════════

// GET /api/trade/trust-score/:userId — Get user's trust score
router.get('/trust-score/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ts.*, u.name, u.role, u.is_verified
       FROM trust_scores ts
       JOIN users u ON u.id = ts.user_id
       WHERE ts.user_id = $1`,
      [req.params.userId]
    );

    if (!result.rows.length) {
      // Return default score for new users
      return res.json({
        trust_score: { user_id: req.params.userId, score: 50, total_trades: 0, successful_trades: 0 },
        tier: 'New'
      });
    }

    const ts = result.rows[0];
    const tier = ts.score >= 90 ? 'Platinum' : ts.score >= 75 ? 'Gold' : ts.score >= 50 ? 'Silver' : 'Bronze';

    res.json({ trust_score: ts, tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade/stats — Trade platform stats (for dashboard)
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'payment_released') AS completed_trades,
        COUNT(*) FILTER (WHERE status IN ('bid_accepted','escrow_funded','quality_verified','dispatched','in_transit','delivered')) AS active_trades,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'payment_released'), 0) AS total_gmv,
        COALESCE(SUM(platform_fee) FILTER (WHERE status = 'payment_released'), 0) AS total_revenue,
        COUNT(*) FILTER (WHERE status = 'disputed') AS open_disputes,
        COUNT(DISTINCT seller_id) AS unique_sellers,
        COUNT(DISTINCT buyer_id) AS unique_buyers
      FROM trade_orders
    `);

    res.json({ stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ HELPER FUNCTIONS ════════════════════════════════════════════════

async function getOrderForUser(orderId, userId) {
  const result = await pool.query(
    `SELECT * FROM trade_orders WHERE id = $1 AND (seller_id = $2 OR buyer_id = $2)`,
    [orderId, userId]
  );
  return result.rows[0] || null;
}

async function addTimelineEvent(tradeOrderId, event, actorId, actorRole, description, lat, lng, photos) {
  await pool.query(
    `INSERT INTO trade_timeline (trade_order_id, event, actor_id, actor_role, description, location_lat, location_lng, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [tradeOrderId, event, actorId, actorRole, description, lat || null, lng || null, JSON.stringify(photos || [])]
  ).catch(console.error);
}

async function updateTrustScore(userId, wasSuccessful) {
  try {
    // Upsert trust score
    await pool.query(`
      INSERT INTO trust_scores (user_id, score, total_trades, successful_trades, last_updated)
      VALUES ($1, $2, 1, $3, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        total_trades = trust_scores.total_trades + 1,
        successful_trades = trust_scores.successful_trades + $3,
        score = LEAST(100, trust_scores.score + $4),
        last_updated = NOW()
    `, [userId, wasSuccessful ? 55 : 45, wasSuccessful ? 1 : 0, wasSuccessful ? 2 : -5]);
  } catch (e) {
    console.error('Trust score update failed:', e.message);
  }
}

module.exports = router;
