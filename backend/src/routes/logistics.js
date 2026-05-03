'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ═══════════════════════════════════════════════════════════════
// LOGISTICS SYSTEM — Farm Pickup → Buyer Delivery
// Partners register, deliveries are requested, OTP-verified
// ═══════════════════════════════════════════════════════════════

// ═══ PARTNER MANAGEMENT ══════════════════════════════════════════

// POST /api/logistics/partners — Register as logistics partner
router.post('/partners', auth, async (req, res) => {
  try {
    const { name, partner_type, vehicle_type, vehicle_number, phone, district_id,
            mandal, village, max_capacity_kg, coverage_radius_km, bank_account, lat, lng } = req.body;

    if (!name || !vehicle_type || !phone) {
      return res.status(400).json({ error: 'name, vehicle_type, and phone are required' });
    }

    const result = await pool.query(`
      INSERT INTO logistics_partners (user_id, name, partner_type, vehicle_type, vehicle_number,
        phone, district_id, mandal, village, max_capacity_kg, coverage_radius_km, bank_account, lat, lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [req.user.id, name, partner_type || 'individual', vehicle_type, vehicle_number,
        phone, district_id, mandal, village, max_capacity_kg, coverage_radius_km || 25,
        JSON.stringify(bank_account || {}), lat, lng]);

    res.status(201).json({ partner: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logistics/partners — List available partners (by district)
router.get('/partners', auth, async (req, res) => {
  try {
    const { district_id, vehicle_type, available_only = 'true' } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (district_id) { conditions.push(`district_id = $${i++}`); params.push(district_id); }
    if (vehicle_type) { conditions.push(`vehicle_type = $${i++}`); params.push(vehicle_type); }
    if (available_only === 'true') { conditions.push('is_available = true'); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`
      SELECT * FROM logistics_partners ${where} ORDER BY rating DESC, total_deliveries DESC
    `, params);

    res.json({ partners: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/logistics/partners/:id — Update partner profile/availability
router.patch('/partners/:id', auth, async (req, res) => {
  try {
    const { is_available, lat, lng, max_capacity_kg, coverage_radius_km, bank_account } = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    if (is_available !== undefined) { updates.push(`is_available = $${i++}`); params.push(is_available); }
    if (lat !== undefined) { updates.push(`lat = $${i++}`); params.push(lat); }
    if (lng !== undefined) { updates.push(`lng = $${i++}`); params.push(lng); }
    if (max_capacity_kg !== undefined) { updates.push(`max_capacity_kg = $${i++}`); params.push(max_capacity_kg); }
    if (coverage_radius_km !== undefined) { updates.push(`coverage_radius_km = $${i++}`); params.push(coverage_radius_km); }
    if (bank_account) { updates.push(`bank_account = $${i++}`); params.push(JSON.stringify(bank_account)); }

    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const result = await pool.query(`
      UPDATE logistics_partners SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *
    `, [...params, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Partner not found' });
    res.json({ partner: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ DELIVERY REQUESTS ═══════════════════════════════════════════

// POST /api/logistics/request — Create delivery request
router.post('/request', auth, async (req, res) => {
  try {
    const { order_id, order_type, pickup_lat, pickup_lng, pickup_address, pickup_contact,
            pickup_name, pickup_slot, delivery_lat, delivery_lng, delivery_address,
            delivery_contact, delivery_name, delivery_slot, weight_kg, cargo_type,
            requires_cold, special_notes } = req.body;

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });

    // Generate OTPs
    const otp_pickup = String(Math.floor(100000 + Math.random() * 900000));
    const otp_delivery = String(Math.floor(100000 + Math.random() * 900000));

    // Estimate distance (simple Haversine)
    let distance_km = null;
    if (pickup_lat && pickup_lng && delivery_lat && delivery_lng) {
      const R = 6371;
      const dLat = (delivery_lat - pickup_lat) * Math.PI / 180;
      const dLng = (delivery_lng - pickup_lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pickup_lat * Math.PI / 180) * Math.cos(delivery_lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Estimate cost (₹15/km base + ₹2/kg)
    const estimated_cost = distance_km ? Math.round(distance_km * 15 + (weight_kg || 0) * 2) : null;

    const result = await pool.query(`
      INSERT INTO delivery_requests (order_id, order_type, pickup_lat, pickup_lng, pickup_address,
        pickup_contact, pickup_name, pickup_slot, delivery_lat, delivery_lng, delivery_address,
        delivery_contact, delivery_name, delivery_slot, weight_kg, cargo_type,
        requires_cold, special_notes, otp_pickup, otp_delivery, distance_km, estimated_cost)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [order_id, order_type || 'trade', pickup_lat, pickup_lng, pickup_address, pickup_contact,
        pickup_name, pickup_slot, delivery_lat, delivery_lng, delivery_address,
        delivery_contact, delivery_name, delivery_slot, weight_kg, cargo_type,
        requires_cold || false, special_notes, otp_pickup, otp_delivery, distance_km, estimated_cost]);

    res.status(201).json({ delivery: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logistics/requests — My delivery requests
router.get('/requests', auth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let params = [parseInt(limit), parseInt(offset)];

    // Check if user is a logistics partner
    const partner = await pool.query('SELECT id FROM logistics_partners WHERE user_id = $1', [req.user.id]);
    if (partner.rows.length) {
      conditions.push(`(dr.partner_id = '${partner.rows[0].id}')`);
    }

    if (status) { conditions.push(`dr.status = '${status}'`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`
      SELECT dr.*, lp.name as partner_name, lp.phone as partner_phone, lp.vehicle_type
      FROM delivery_requests dr
      LEFT JOIN logistics_partners lp ON dr.partner_id = lp.id
      ${where}
      ORDER BY dr.created_at DESC LIMIT $1 OFFSET $2
    `, params);

    res.json({ deliveries: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/logistics/requests/:id — Update delivery status
router.patch('/requests/:id', auth, async (req, res) => {
  try {
    const { status, otp, actual_cost } = req.body;
    const deliveryId = req.params.id;

    // Validate OTP for pickup/delivery status changes
    if (status === 'picked_up' || status === 'delivered') {
      const delivery = await pool.query('SELECT * FROM delivery_requests WHERE id = $1', [deliveryId]);
      if (!delivery.rows.length) return res.status(404).json({ error: 'Delivery not found' });

      const record = delivery.rows[0];
      if (status === 'picked_up' && otp !== record.otp_pickup) {
        return res.status(400).json({ error: 'Invalid pickup OTP' });
      }
      if (status === 'delivered' && otp !== record.otp_delivery) {
        return res.status(400).json({ error: 'Invalid delivery OTP' });
      }
    }

    const timestamps = {
      'assigned': 'assigned_at = NOW(),',
      'picked_up': 'picked_up_at = NOW(),',
      'delivered': 'delivered_at = NOW(),',
    };
    const ts = timestamps[status] || '';

    let updateQuery = `UPDATE delivery_requests SET status = $1, ${ts} updated_at = NOW()`;
    const params = [status];
    let i = 2;

    if (actual_cost) { updateQuery += `, actual_cost = $${i++}`; params.push(actual_cost); }
    updateQuery += ` WHERE id = $${i} RETURNING *`;
    params.push(deliveryId);

    const result = await pool.query(updateQuery, params);
    if (!result.rows.length) return res.status(404).json({ error: 'Delivery not found' });

    // Update partner stats on completion
    if (status === 'delivered' && result.rows[0].partner_id) {
      await pool.query(`
        UPDATE logistics_partners SET total_deliveries = total_deliveries + 1, updated_at = NOW()
        WHERE id = $1
      `, [result.rows[0].partner_id]);
    }

    res.json({ delivery: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logistics/assign — Assign partner to delivery
router.post('/assign', auth, async (req, res) => {
  try {
    const { delivery_id, partner_id } = req.body;
    if (!delivery_id || !partner_id) {
      return res.status(400).json({ error: 'delivery_id and partner_id are required' });
    }

    const result = await pool.query(`
      UPDATE delivery_requests SET partner_id = $1, status = 'assigned', assigned_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND status = 'pending' RETURNING *
    `, [partner_id, delivery_id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Delivery not found or already assigned' });
    res.json({ delivery: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logistics/estimate — Get cost/time estimate
router.get('/estimate', auth, async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, delivery_lat, delivery_lng, weight_kg } = req.query;
    if (!pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng) {
      return res.status(400).json({ error: 'Pickup and delivery coordinates required' });
    }

    // Haversine distance
    const R = 6371;
    const dLat = (delivery_lat - pickup_lat) * Math.PI / 180;
    const dLng = (delivery_lng - pickup_lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickup_lat * Math.PI / 180) * Math.cos(delivery_lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const estimated_cost = Math.round(distance_km * 15 + (Number(weight_kg) || 0) * 2);
    const estimated_time_hours = Math.max(1, Math.round(distance_km / 30)); // ~30km/h avg

    res.json({
      distance_km: Math.round(distance_km * 10) / 10,
      estimated_cost,
      estimated_time_hours,
      currency: 'INR'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══ BATCH PLANNING ══════════════════════════════════════════════

// POST /api/logistics/batch — Create delivery batch
router.post('/batch', auth, async (req, res) => {
  try {
    const { partner_id, route_name, batch_date, delivery_ids } = req.body;
    if (!partner_id || !batch_date) {
      return res.status(400).json({ error: 'partner_id and batch_date are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const batch = await client.query(`
        INSERT INTO delivery_batches (partner_id, route_name, batch_date, total_orders)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [partner_id, route_name, batch_date, (delivery_ids || []).length]);

      // Add items to batch
      if (delivery_ids && delivery_ids.length) {
        for (let idx = 0; idx < delivery_ids.length; idx++) {
          await client.query(`
            INSERT INTO delivery_batch_items (batch_id, delivery_id, sequence_order, pickup_or_drop)
            VALUES ($1, $2, $3, 'pickup')
          `, [batch.rows[0].id, delivery_ids[idx], idx + 1]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ batch: batch.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logistics/batch/:id — Get batch with items
router.get('/batch/:id', auth, async (req, res) => {
  try {
    const batch = await pool.query('SELECT * FROM delivery_batches WHERE id = $1', [req.params.id]);
    if (!batch.rows.length) return res.status(404).json({ error: 'Batch not found' });

    const items = await pool.query(`
      SELECT dbi.*, dr.pickup_address, dr.delivery_address, dr.weight_kg, dr.cargo_type, dr.status
      FROM delivery_batch_items dbi
      JOIN delivery_requests dr ON dbi.delivery_id = dr.id
      WHERE dbi.batch_id = $1
      ORDER BY dbi.sequence_order
    `, [req.params.id]);

    res.json({ batch: batch.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logistics/partner/dashboard — Partner earnings & tasks
router.get('/partner/dashboard', auth, async (req, res) => {
  try {
    const partner = await pool.query('SELECT * FROM logistics_partners WHERE user_id = $1', [req.user.id]);
    if (!partner.rows.length) return res.status(404).json({ error: 'Not a logistics partner' });

    const partnerId = partner.rows[0].id;

    const pending = await pool.query(
      `SELECT COUNT(*) as count FROM delivery_requests WHERE partner_id = $1 AND status IN ('assigned', 'pickup_enroute')`,
      [partnerId]
    );

    const completed = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(actual_cost), 0) as total_earnings
       FROM delivery_requests WHERE partner_id = $1 AND status = 'delivered'`,
      [partnerId]
    );

    const recent = await pool.query(
      `SELECT * FROM delivery_requests WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [partnerId]
    );

    res.json({
      partner: partner.rows[0],
      stats: {
        pending_deliveries: parseInt(pending.rows[0].count),
        total_completed: parseInt(completed.rows[0].count),
        total_earnings: parseFloat(completed.rows[0].total_earnings),
      },
      recent_deliveries: recent.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
