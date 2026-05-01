const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/agriflow/listings — public supply marketplace
router.get('/listings', optionalAuth, async (req, res) => {
  try {
    const { crop_id, district_id, is_organic, grade, limit = 20, offset = 0 } = req.query;
    let conditions = [`sl.status = 'active'`];
    let params = [];
    let i = 1;

    if (crop_id)    { conditions.push(`sl.crop_id = $${i++}`);    params.push(crop_id); }
    if (district_id){ conditions.push(`sl.district_id = $${i++}`);params.push(district_id); }
    if (is_organic !== undefined) { conditions.push(`sl.is_organic = $${i++}`); params.push(is_organic === 'true'); }
    if (grade)      { conditions.push(`sl.grade = $${i++}`);      params.push(grade); }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT sl.*, cc.name AS crop_name, cc.icon_emoji, cc.category,
             d.name AS district_name, d.state_name
      FROM supply_listings sl
      JOIN crop_catalog cc ON cc.id = sl.crop_id
      LEFT JOIN districts d ON d.id = sl.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sl.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) FROM supply_listings sl WHERE ${conditions.join(' AND ')}
    `, params.slice(0, -2));

    res.json({ listings: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agriflow/listings — FPO create listing
router.post('/listings', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, quantity_kg, grade = 'ungraded', is_organic = false,
            price_per_kg, min_order_kg, collection_center, description, farmer_name, location_label } = req.body;

    if (!crop_id || !quantity_kg) return res.status(400).json({ error: 'crop_id and quantity_kg required' });

    const result = await query(`
      INSERT INTO supply_listings (id, fpo_id, crop_id, district_id, quantity_kg, grade, is_organic,
        price_per_kg, min_order_kg, collection_center, description, farmer_name, location_label)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, crop_id, district_id, quantity_kg, grade, is_organic,
        price_per_kg, min_order_kg, collection_center, description, farmer_name, location_label]);

    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/listings/:id
router.get('/listings/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT sl.*, cc.name AS crop_name, cc.icon_emoji, cc.category, cc.growing_days,
             d.name AS district_name, d.state_name
      FROM supply_listings sl
      JOIN crop_catalog cc ON cc.id = sl.crop_id
      LEFT JOIN districts d ON d.id = sl.district_id
      WHERE sl.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agriflow/inquiries — buyer sends inquiry
router.post('/inquiries', authMiddleware, async (req, res) => {
  try {
    const { listing_id, quantity_needed, timeline, message } = req.body;

    const listing = await query(`SELECT fpo_id, crop_id FROM supply_listings WHERE id = $1`, [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });

    const result = await query(`
      INSERT INTO inquiries (id, buyer_id, listing_id, seller_id, crop_id, quantity_needed, timeline, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.user.id, listing_id, listing.rows[0].fpo_id,
        listing.rows[0].crop_id, quantity_needed, timeline, message]);

    res.status(201).json({ inquiry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/inquiries — get inquiries for logged-in user
router.get('/inquiries', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT i.*, cc.name AS crop_name, cc.icon_emoji,
             bu.name AS buyer_name, bu.phone AS buyer_phone,
             su.name AS seller_name
      FROM inquiries i
      JOIN crop_catalog cc ON cc.id = i.crop_id
      JOIN users bu ON bu.id = i.buyer_id
      JOIN users su ON su.id = i.seller_id
      WHERE i.buyer_id = $1 OR i.seller_id = $1
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json({ inquiries: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/declarations — farmer's declarations
router.get('/declarations', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*, cc.name AS crop_name, cc.icon_emoji, dist.name AS district_name
      FROM declarations d
      JOIN crop_catalog cc ON cc.id = d.crop_id
      LEFT JOIN districts dist ON dist.id = d.district_id
      WHERE d.farmer_id = $1
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    res.json({ declarations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agriflow/declarations
router.post('/declarations', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, area_acres, expected_yield, sow_date,
            expected_harvest_date, quality_grade = 'ungraded', is_organic = false, notes } = req.body;

    if (!crop_id || !area_acres || !sow_date || !expected_harvest_date) {
      return res.status(400).json({ error: 'crop_id, area_acres, sow_date, expected_harvest_date required' });
    }

    const result = await query(`
      INSERT INTO declarations (id, farmer_id, crop_id, district_id, area_acres, expected_yield,
        sow_date, expected_harvest_date, quality_grade, is_organic, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, crop_id, district_id, area_acres, expected_yield,
        sow_date, expected_harvest_date, quality_grade, is_organic, notes]);

    res.status(201).json({ declaration: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/crops — crop catalog
router.get('/crops', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM crop_catalog ORDER BY name`);
    res.json({ crops: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/districts
router.get('/districts', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM districts ORDER BY state_code, name`);
    res.json({ districts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/agriflow/listings/:id — edit listing
router.patch('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity_kg, price_per_kg, grade, is_organic, description, status, min_order_kg } = req.body;
    const existing = await query('SELECT * FROM supply_listings WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    if (existing.rows[0].farmer_id !== req.user.id && existing.rows[0].fpo_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });
    const result = await query(`
      UPDATE supply_listings SET
        quantity_kg = COALESCE($1, quantity_kg), price_per_kg = COALESCE($2, price_per_kg),
        grade = COALESCE($3, grade), is_organic = COALESCE($4, is_organic),
        description = COALESCE($5, description), status = COALESCE($6, status),
        min_order_kg = COALESCE($7, min_order_kg)
      WHERE id = $8 RETURNING *
    `, [quantity_kg, price_per_kg, grade, is_organic, description, status, min_order_kg, req.params.id]);
    res.json({ listing: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/agriflow/listings/:id
router.delete('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM supply_listings WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    if (existing.rows[0].farmer_id !== req.user.id && existing.rows[0].fpo_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });
    await query('DELETE FROM supply_listings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Listing deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/agriflow/declarations/:id — edit declaration
router.patch('/declarations/:id', authMiddleware, async (req, res) => {
  try {
    const { area_acres, expected_yield, quality_grade, is_organic, expected_harvest_date, notes } = req.body;
    const existing = await query('SELECT * FROM declarations WHERE id = $1 AND farmer_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Declaration not found' });
    const result = await query(`
      UPDATE declarations SET
        area_acres = COALESCE($1, area_acres), expected_yield = COALESCE($2, expected_yield),
        quality_grade = COALESCE($3, quality_grade), is_organic = COALESCE($4, is_organic),
        expected_harvest_date = COALESCE($5, expected_harvest_date), notes = COALESCE($6, notes)
      WHERE id = $7 RETURNING *
    `, [area_acres, expected_yield, quality_grade, is_organic, expected_harvest_date, notes, req.params.id]);
    res.json({ declaration: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/agriflow/declarations/:id
router.delete('/declarations/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM declarations WHERE id = $1 AND farmer_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Declaration not found' });
    await query('DELETE FROM declarations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Declaration deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/agriflow/inquiries/:id — respond to inquiry (accept/reject/negotiate)
router.patch('/inquiries/:id', authMiddleware, async (req, res) => {
  try {
    const { status, response_message, counter_price } = req.body;
    if (!['accepted', 'rejected', 'negotiating'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const existing = await query(`
      SELECT i.*, sl.farmer_id, sl.fpo_id FROM inquiries i
      JOIN supply_listings sl ON sl.id = i.listing_id
      WHERE i.id = $1
    `, [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Inquiry not found' });
    const inq = existing.rows[0];
    if (inq.farmer_id !== req.user.id && inq.fpo_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });
    const result = await query(`
      UPDATE inquiries SET status = $1, response_message = $2, counter_price = $3, updated_at = NOW()
      WHERE id = $4 RETURNING *
    `, [status, response_message || null, counter_price || null, req.params.id]);
    res.json({ inquiry: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// AUCTION ENGINE — Reverse auction (buyers bid on supply listings)
// ═══════════════════════════════════════════════════════════════

// POST /api/agriflow/auctions — Create auction from a listing
router.post('/auctions', authMiddleware, async (req, res) => {
  try {
    const { listing_id, base_price, min_increment, end_time } = req.body;
    if (!listing_id || !base_price || !end_time) {
      return res.status(400).json({ error: 'listing_id, base_price, end_time required' });
    }
    // Verify listing belongs to user
    const listing = await query(
      `SELECT * FROM supply_listings WHERE id = $1 AND seller_id = $2`,
      [listing_id, req.user.id]
    );
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found or not owned by you' });

    const result = await query(`
      INSERT INTO auctions (id, listing_id, seller_id, base_price, min_increment, end_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING *
    `, [uuidv4(), listing_id, req.user.id, base_price, min_increment || 0.5, end_time]);

    res.status(201).json({ auction: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agriflow/auctions — List active auctions
router.get('/auctions', optionalAuth, async (req, res) => {
  try {
    const { crop_id, district_id, status = 'active', limit = 20, offset = 0 } = req.query;
    let conditions = [`a.status = $1`];
    let params = [status];
    let i = 2;
    if (crop_id) { conditions.push(`sl.crop_id = $${i++}`); params.push(crop_id); }
    if (district_id) { conditions.push(`sl.district_id = $${i++}`); params.push(district_id); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT a.*, sl.quantity_kg, sl.grade, sl.is_organic,
             cc.name AS crop_name, cc.icon_emoji, d.name AS district_name,
             (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.id) AS bid_count,
             (SELECT MAX(ab.price) FROM auction_bids ab WHERE ab.auction_id = a.id) AS highest_bid
      FROM auctions a
      JOIN supply_listings sl ON sl.id = a.listing_id
      JOIN crop_catalog cc ON cc.id = sl.crop_id
      LEFT JOIN districts d ON d.id = sl.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.end_time ASC
      LIMIT $${i++} OFFSET $${i++}
    `, params);
    res.json({ auctions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agriflow/auctions/:id/bid — Place a bid
router.post('/auctions/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { price, quantity_kg, notes } = req.body;
    if (!price) return res.status(400).json({ error: 'price required' });

    const auction = await query(`SELECT * FROM auctions WHERE id = $1 AND status = 'active'`, [req.params.id]);
    if (!auction.rows.length) return res.status(404).json({ error: 'Auction not found or closed' });
    if (auction.rows[0].seller_id === req.user.id) return res.status(400).json({ error: 'Cannot bid on own auction' });
    if (new Date(auction.rows[0].end_time) < new Date()) {
      await query(`UPDATE auctions SET status = 'ended' WHERE id = $1`, [req.params.id]);
      return res.status(400).json({ error: 'Auction has ended' });
    }
    if (price < auction.rows[0].base_price) return res.status(400).json({ error: 'Bid must be >= base price' });

    const result = await query(`
      INSERT INTO auction_bids (id, auction_id, buyer_id, price, quantity_kg, notes)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, price, quantity_kg, notes]);
    res.status(201).json({ bid: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agriflow/auctions/:id/accept — Seller accepts a bid
router.post('/auctions/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { bid_id } = req.body;
    if (!bid_id) return res.status(400).json({ error: 'bid_id required' });

    const auction = await query(`SELECT * FROM auctions WHERE id = $1 AND seller_id = $2`, [req.params.id, req.user.id]);
    if (!auction.rows.length) return res.status(403).json({ error: 'Not your auction' });

    await query(`UPDATE auctions SET status = 'accepted', winning_bid_id = $1 WHERE id = $2`, [bid_id, req.params.id]);
    await query(`UPDATE auction_bids SET status = 'accepted' WHERE id = $1`, [bid_id]);
    await query(`UPDATE auction_bids SET status = 'rejected' WHERE auction_id = $1 AND id != $2`, [req.params.id, bid_id]);

    res.json({ message: 'Bid accepted, auction closed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// QUALITY GRADING — AI-based quality grading with photo proof
// ═══════════════════════════════════════════════════════════════

// POST /api/agriflow/quality-grade — Submit crop photos for grading
router.post('/quality-grade', authMiddleware, async (req, res) => {
  try {
    const { listing_id, photos, crop_id, notes } = req.body;
    if (!photos || photos.length < 2) return res.status(400).json({ error: 'At least 2 photos required' });

    // AI grading simulation (in production: call ML service)
    const randomScore = 50 + Math.floor(Math.random() * 50);
    const assignedGrade = randomScore >= 90 ? 'A+' : randomScore >= 75 ? 'A' : randomScore >= 60 ? 'B' : 'C';

    const result = await query(`
      INSERT INTO quality_assessments (id, listing_id, user_id, crop_id, photos, grade, score, notes, assessed_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ai') RETURNING *
    `, [uuidv4(), listing_id, req.user.id, crop_id, JSON.stringify(photos), assignedGrade, randomScore, notes]);

    // Update listing grade if linked
    if (listing_id) {
      await query(`UPDATE supply_listings SET grade = $1 WHERE id = $2`, [assignedGrade, listing_id]);
    }

    res.status(201).json({
      assessment: result.rows[0],
      grade: assignedGrade,
      score: randomScore,
      recommendations: assignedGrade === 'A+' ? 'Premium quality — list at 10-15% above market price' :
                       assignedGrade === 'A' ? 'Good quality — market price achievable' :
                       assignedGrade === 'B' ? 'Average quality — consider sorting for better grade' :
                       'Below average — best for processing/animal feed'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// CONTRACT FARMING — Advance purchase contracts
// ═══════════════════════════════════════════════════════════════

// POST /api/agriflow/contracts — Buyer posts a contract
router.post('/contracts', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, quantity_kg, price_per_kg, quality_required,
            delivery_start, delivery_end, advance_pct, terms } = req.body;
    if (!crop_id || !quantity_kg || !price_per_kg || !delivery_end) {
      return res.status(400).json({ error: 'crop_id, quantity_kg, price_per_kg, delivery_end required' });
    }
    const result = await query(`
      INSERT INTO farming_contracts (id, buyer_id, crop_id, district_id, quantity_kg, price_per_kg,
        quality_required, delivery_start, delivery_end, advance_pct, terms, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'open') RETURNING *
    `, [uuidv4(), req.user.id, crop_id, district_id, quantity_kg, price_per_kg,
        quality_required || 'B', delivery_start, delivery_end, advance_pct || 0, terms]);
    res.status(201).json({ contract: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agriflow/contracts — List open contracts
router.get('/contracts', optionalAuth, async (req, res) => {
  try {
    const { crop_id, district_id, limit = 20, offset = 0 } = req.query;
    let conditions = [`fc.status = 'open'`];
    let params = [];
    let i = 1;
    if (crop_id) { conditions.push(`fc.crop_id = $${i++}`); params.push(crop_id); }
    if (district_id) { conditions.push(`fc.district_id = $${i++}`); params.push(district_id); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT fc.*, cc.name AS crop_name, cc.icon_emoji, d.name AS district_name,
             u.name AS buyer_name
      FROM farming_contracts fc
      JOIN crop_catalog cc ON cc.id = fc.crop_id
      LEFT JOIN districts d ON d.id = fc.district_id
      JOIN users u ON u.id = fc.buyer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY fc.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);
    res.json({ contracts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agriflow/contracts/:id/accept — Farmer accepts contract
router.post('/contracts/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { quantity_kg, notes } = req.body;
    const contract = await query(`SELECT * FROM farming_contracts WHERE id = $1 AND status = 'open'`, [req.params.id]);
    if (!contract.rows.length) return res.status(404).json({ error: 'Contract not found or closed' });
    if (contract.rows[0].buyer_id === req.user.id) return res.status(400).json({ error: 'Cannot accept own contract' });

    const acceptance = await query(`
      INSERT INTO contract_acceptances (id, contract_id, farmer_id, quantity_kg, notes, status)
      VALUES ($1, $2, $3, $4, $5, 'pending_approval') RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, quantity_kg || contract.rows[0].quantity_kg, notes]);
    res.status(201).json({ acceptance: acceptance.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// WAREHOUSE RECEIPT SYSTEM — Digital warehouse receipts
// ═══════════════════════════════════════════════════════════════

// POST /api/agriflow/warehouse/deposit — Deposit crop at warehouse
router.post('/warehouse/deposit', authMiddleware, async (req, res) => {
  try {
    const { warehouse_id, crop_id, quantity_kg, grade, moisture_pct, expected_price } = req.body;
    if (!warehouse_id || !crop_id || !quantity_kg) {
      return res.status(400).json({ error: 'warehouse_id, crop_id, quantity_kg required' });
    }
    const receipt_number = `WR-${Date.now().toString(36).toUpperCase()}`;
    const result = await query(`
      INSERT INTO warehouse_receipts (id, receipt_number, farmer_id, warehouse_id, crop_id,
        quantity_kg, grade, moisture_pct, expected_price, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'stored') RETURNING *
    `, [uuidv4(), receipt_number, req.user.id, warehouse_id, crop_id,
        quantity_kg, grade || 'ungraded', moisture_pct, expected_price]);
    res.status(201).json({ receipt: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agriflow/warehouse/receipts — My receipts
router.get('/warehouse/receipts', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT wr.*, cc.name AS crop_name, cc.icon_emoji
      FROM warehouse_receipts wr
      JOIN crop_catalog cc ON cc.id = wr.crop_id
      WHERE wr.farmer_id = $1
      ORDER BY wr.created_at DESC
    `, [req.user.id]);
    res.json({ receipts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agriflow/warehouse/receipts/:id/trade — Trade against receipt (financing)
router.post('/warehouse/receipts/:id/trade', authMiddleware, async (req, res) => {
  try {
    const { trade_type, price_per_kg, buyer_id } = req.body;
    const receipt = await query(`SELECT * FROM warehouse_receipts WHERE id = $1 AND farmer_id = $2 AND status = 'stored'`,
      [req.params.id, req.user.id]);
    if (!receipt.rows.length) return res.status(404).json({ error: 'Receipt not found or already traded' });

    await query(`UPDATE warehouse_receipts SET status = 'traded', traded_price = $1 WHERE id = $2`,
      [price_per_kg, req.params.id]);
    res.json({ message: 'Receipt traded successfully', receipt_id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// PRICE DISCOVERY — MSP comparison & market prices
// ═══════════════════════════════════════════════════════════════

// GET /api/agriflow/prices/compare — Compare prices across markets + MSP
router.get('/prices/compare', async (req, res) => {
  try {
    const { crop_id } = req.query;
    if (!crop_id) return res.status(400).json({ error: 'crop_id required' });

    const crop = await query(`SELECT * FROM crop_catalog WHERE id = $1`, [crop_id]);
    if (!crop.rows.length) return res.status(404).json({ error: 'Crop not found' });

    // Generate realistic market prices
    const basePrice = crop.rows[0].min_price_reference || 2000;
    const markets = [
      { market: 'Guntur Mandi', district: 'Guntur', price: basePrice + Math.floor(Math.random() * 400 - 100), arrivals_today: Math.floor(Math.random() * 500 + 100) },
      { market: 'Vijayawada APMC', district: 'Krishna', price: basePrice + Math.floor(Math.random() * 400 - 50), arrivals_today: Math.floor(Math.random() * 300 + 50) },
      { market: 'Ongole Market', district: 'Prakasam', price: basePrice + Math.floor(Math.random() * 300), arrivals_today: Math.floor(Math.random() * 200 + 30) },
    ];

    const msp = basePrice * 1.1; // Simulated MSP
    const costOfProduction = basePrice * 0.7;

    res.json({
      crop: crop.rows[0],
      msp: Math.round(msp),
      cost_of_production: Math.round(costOfProduction),
      market_prices: markets,
      recommendation: markets[0].price > msp
        ? `Market price is above MSP (₹${Math.round(msp)}/q). Good time to sell.`
        : `Market price is below MSP. Consider storing or selling to government procurement.`,
      price_trend: Math.random() > 0.5 ? 'rising' : 'falling',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// FPO AGGREGATION — Pool small lots into large lots
// ═══════════════════════════════════════════════════════════════

// POST /api/agriflow/aggregation — Create aggregation pool
router.post('/aggregation', authMiddleware, async (req, res) => {
  try {
    const { crop_id, target_quantity_kg, grade_required, collection_center, deadline } = req.body;
    if (!crop_id || !target_quantity_kg) return res.status(400).json({ error: 'crop_id and target_quantity_kg required' });

    const result = await query(`
      INSERT INTO aggregation_pools (id, fpo_id, crop_id, target_quantity_kg, grade_required, collection_center, deadline, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *
    `, [uuidv4(), req.user.id, crop_id, target_quantity_kg, grade_required || 'B', collection_center, deadline]);
    res.status(201).json({ pool: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agriflow/aggregation/:id/contribute — Farmer adds to pool
router.post('/aggregation/:id/contribute', authMiddleware, async (req, res) => {
  try {
    const { quantity_kg, grade } = req.body;
    if (!quantity_kg) return res.status(400).json({ error: 'quantity_kg required' });

    const pool = await query(`SELECT * FROM aggregation_pools WHERE id = $1 AND status = 'active'`, [req.params.id]);
    if (!pool.rows.length) return res.status(404).json({ error: 'Pool not found or closed' });

    const result = await query(`
      INSERT INTO aggregation_contributions (id, pool_id, farmer_id, quantity_kg, grade)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, quantity_kg, grade || 'ungraded']);

    // Update pool current quantity
    await query(`
      UPDATE aggregation_pools SET current_quantity_kg = current_quantity_kg + $1 WHERE id = $2
    `, [quantity_kg, req.params.id]);

    res.status(201).json({ contribution: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agriflow/aggregation — List active pools
router.get('/aggregation', optionalAuth, async (req, res) => {
  try {
    const { crop_id, limit = 20, offset = 0 } = req.query;
    let conditions = [`ap.status = 'active'`];
    let params = [];
    let i = 1;
    if (crop_id) { conditions.push(`ap.crop_id = $${i++}`); params.push(crop_id); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT ap.*, cc.name AS crop_name, cc.icon_emoji, u.name AS fpo_name,
        (SELECT COUNT(*) FROM aggregation_contributions ac WHERE ac.pool_id = ap.id) AS contributors
      FROM aggregation_pools ap
      JOIN crop_catalog cc ON cc.id = ap.crop_id
      JOIN users u ON u.id = ap.fpo_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ap.deadline ASC
      LIMIT $${i++} OFFSET $${i++}
    `, params);
    res.json({ pools: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// TRANSPORT MATCHING — Connect deals with transport
// ═══════════════════════════════════════════════════════════════

// GET /api/agriflow/transport/match — Find nearby transport
router.get('/transport/match', authMiddleware, async (req, res) => {
  try {
    const { from_district, to_district, weight_kg } = req.query;
    // In production: query real transport providers
    // For now: return simulated matches
    const vehicles = [
      { id: 'v1', type: 'Mini Truck', capacity_kg: 2000, rate_per_km: 12, available: true, eta_mins: 45, driver: 'Ramesh', phone: '9876543210', rating: 4.5 },
      { id: 'v2', type: 'Tata 407', capacity_kg: 4000, rate_per_km: 18, available: true, eta_mins: 60, driver: 'Suresh', phone: '9876543211', rating: 4.8 },
      { id: 'v3', type: '10-Wheeler', capacity_kg: 15000, rate_per_km: 25, available: true, eta_mins: 90, driver: 'Venkat', phone: '9876543212', rating: 4.3 },
    ].filter(v => !weight_kg || v.capacity_kg >= parseInt(weight_kg));

    res.json({ vehicles, from_district, to_district });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
