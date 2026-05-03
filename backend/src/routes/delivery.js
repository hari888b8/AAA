'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Haversine distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const VALID_PACKAGE_TYPES = ['fertilizer', 'seeds', 'pesticide', 'grocery', 'medicine', 'general'];

// POST /api/delivery/orders — Create delivery order (by shop)
router.post('/orders', auth, async (req, res) => {
  try {
    const {
      customer_id, pickup_lat, pickup_lng, pickup_address,
      drop_lat, drop_lng, drop_address, package_type,
      package_description, weight_kg
    } = req.body;

    if (!customer_id || !pickup_address || !drop_address) {
      return res.status(400).json({ error: 'customer_id, pickup_address, and drop_address are required' });
    }
    if (package_type && !VALID_PACKAGE_TYPES.includes(package_type)) {
      return res.status(400).json({ error: `package_type must be one of: ${VALID_PACKAGE_TYPES.join(', ')}` });
    }

    const pickup_otp = generateOtp();
    const delivery_otp = generateOtp();

    const distance_km = (pickup_lat && pickup_lng && drop_lat && drop_lng)
      ? haversineKm(pickup_lat, pickup_lng, drop_lat, drop_lng)
      : 0;

    const weight = weight_kg || 0;
    const delivery_fee = 30 + (distance_km * 8) + (weight * 1);
    const platform_commission = +(delivery_fee * 0.15).toFixed(2);

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO delivery_orders (
        id, shop_id, customer_id, pickup_lat, pickup_lng, pickup_address,
        drop_lat, drop_lng, drop_address, package_type, package_description,
        weight_kg, distance_km, delivery_fee, platform_commission,
        pickup_otp, delivery_otp, status, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
      RETURNING *`,
      [
        id, req.user.id, customer_id, pickup_lat || null, pickup_lng || null, pickup_address,
        drop_lat || null, drop_lng || null, drop_address, package_type || 'general',
        package_description || null, weight, +distance_km.toFixed(2),
        +delivery_fee.toFixed(2), platform_commission,
        pickup_otp, delivery_otp, 'created'
      ]
    );

    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    console.error('Create delivery order error:', err);
    res.status(500).json({ error: 'Failed to create delivery order' });
  }
});

// GET /api/delivery/orders — List my orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { status, role, limit = 20, offset = 0 } = req.query;
    const params = [];
    let whereClause = '';

    if (role === 'shop') {
      params.push(req.user.id);
      whereClause = `WHERE d.shop_id = $${params.length}`;
    } else {
      params.push(req.user.id);
      whereClause = `WHERE (d.customer_id = $${params.length} OR d.shop_id = $${params.length})`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND d.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM delivery_orders d ${whereClause}`, params
    );

    params.push(+limit, +offset);
    const result = await pool.query(
      `SELECT d.*,
        s.name as shop_name,
        c.name as customer_name,
        dr.name as driver_name
      FROM delivery_orders d
      LEFT JOIN users s ON s.id = d.shop_id
      LEFT JOIN users c ON c.id = d.customer_id
      LEFT JOIN users dr ON dr.id = d.assigned_driver_id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ orders: result.rows, total: +countResult.rows[0].count });
  } catch (err) {
    console.error('List delivery orders error:', err);
    res.status(500).json({ error: 'Failed to list delivery orders' });
  }
});

// GET /api/delivery/orders/:id — Get order details
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*,
        s.name as shop_name, s.phone as shop_phone,
        c.name as customer_name, c.phone as customer_phone,
        dr.name as driver_name, dr.phone as driver_phone
      FROM delivery_orders d
      LEFT JOIN users s ON s.id = d.shop_id
      LEFT JOIN users c ON c.id = d.customer_id
      LEFT JOIN users dr ON dr.id = d.assigned_driver_id
      WHERE d.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('Get delivery order error:', err);
    res.status(500).json({ error: 'Failed to get delivery order' });
  }
});

// POST /api/delivery/orders/:id/assign — Assign driver to order
router.post('/orders/:id/assign', auth, async (req, res) => {
  try {
    const { driver_id, vehicle_id } = req.body;

    const existing = await pool.query(
      'SELECT * FROM delivery_orders WHERE id = $1', [req.params.id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.rows[0].status !== 'created') {
      return res.status(400).json({ error: 'Order can only be assigned when status is created' });
    }

    const result = await pool.query(
      `UPDATE delivery_orders
       SET status = 'assigned', assigned_driver_id = $1, assigned_vehicle_id = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [driver_id, vehicle_id || null, req.params.id]
    );

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('Assign driver error:', err);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

// POST /api/delivery/orders/:id/pickup — Mark order picked up
router.post('/orders/:id/pickup', auth, async (req, res) => {
  try {
    const { otp } = req.body;

    const existing = await pool.query(
      'SELECT * FROM delivery_orders WHERE id = $1', [req.params.id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.rows[0].pickup_otp !== otp) {
      return res.status(400).json({ error: 'Invalid pickup OTP' });
    }

    const result = await pool.query(
      `UPDATE delivery_orders
       SET status = 'picked_up', picked_up_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('Pickup order error:', err);
    res.status(500).json({ error: 'Failed to mark order as picked up' });
  }
});

// POST /api/delivery/orders/:id/deliver — Mark order delivered
router.post('/orders/:id/deliver', auth, async (req, res) => {
  try {
    const { otp } = req.body;

    const existing = await pool.query(
      'SELECT * FROM delivery_orders WHERE id = $1', [req.params.id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (existing.rows[0].delivery_otp !== otp) {
      return res.status(400).json({ error: 'Invalid delivery OTP' });
    }

    const result = await pool.query(
      `UPDATE delivery_orders
       SET status = 'delivered', delivered_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('Deliver order error:', err);
    res.status(500).json({ error: 'Failed to mark order as delivered' });
  }
});

// POST /api/delivery/orders/:id/cancel — Cancel order
router.post('/orders/:id/cancel', auth, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM delivery_orders WHERE id = $1', [req.params.id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!['created', 'assigned'].includes(existing.rows[0].status)) {
      return res.status(400).json({ error: 'Order can only be cancelled when status is created or assigned' });
    }

    const result = await pool.query(
      `UPDATE delivery_orders
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// POST /api/delivery/orders/:id/rate — Rate a delivery
router.post('/orders/:id/rate', auth, async (req, res) => {
  try {
    const { rating, role } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (!['customer', 'shop'].includes(role)) {
      return res.status(400).json({ error: 'Role must be customer or shop' });
    }

    const query = role === 'customer'
      ? `UPDATE delivery_orders SET rating_by_customer = $1, updated_at = NOW() WHERE id = $2 RETURNING *`
      : `UPDATE delivery_orders SET rating_by_shop = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [rating, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('Rate delivery error:', err);
    res.status(500).json({ error: 'Failed to rate delivery' });
  }
});

// GET /api/delivery/dashboard — Driver delivery dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const driverId = req.user.id;

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'assigned') as pending,
        COUNT(*) FILTER (WHERE status = 'picked_up') as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered' AND delivered_at::date = CURRENT_DATE) as completed_today,
        COALESCE(SUM(delivery_fee) FILTER (WHERE status = 'delivered'), 0) as total_earnings
      FROM delivery_orders
      WHERE assigned_driver_id = $1`,
      [driverId]
    );

    const activeResult = await pool.query(
      `SELECT d.*, s.name as shop_name, c.name as customer_name
       FROM delivery_orders d
       LEFT JOIN users s ON s.id = d.shop_id
       LEFT JOIN users c ON c.id = d.customer_id
       WHERE d.assigned_driver_id = $1 AND d.status IN ('assigned', 'picked_up')
       ORDER BY d.created_at DESC`,
      [driverId]
    );

    const recentResult = await pool.query(
      `SELECT d.*, s.name as shop_name, c.name as customer_name
       FROM delivery_orders d
       LEFT JOIN users s ON s.id = d.shop_id
       LEFT JOIN users c ON c.id = d.customer_id
       WHERE d.assigned_driver_id = $1 AND d.status IN ('delivered', 'cancelled')
       ORDER BY d.updated_at DESC
       LIMIT 10`,
      [driverId]
    );

    const stats = statsResult.rows[0];
    res.json({
      stats: {
        pending: +stats.pending,
        in_transit: +stats.in_transit,
        completed_today: +stats.completed_today,
        total_earnings: +stats.total_earnings
      },
      active_orders: activeResult.rows,
      recent_orders: recentResult.rows
    });
  } catch (err) {
    console.error('Driver dashboard error:', err);
    res.status(500).json({ error: 'Failed to load driver dashboard' });
  }
});

// GET /api/delivery/nearby — Find nearby unassigned orders (for drivers)
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius_km = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const result = await pool.query(
      `SELECT d.*, s.name as shop_name, c.name as customer_name,
        (6371 * acos(
          cos(radians($1)) * cos(radians(d.pickup_lat)) *
          cos(radians(d.pickup_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(d.pickup_lat))
        )) as distance_from_driver
      FROM delivery_orders d
      LEFT JOIN users s ON s.id = d.shop_id
      LEFT JOIN users c ON c.id = d.customer_id
      WHERE d.status = 'created'
        AND d.pickup_lat IS NOT NULL
        AND d.pickup_lng IS NOT NULL
        AND (6371 * acos(
          cos(radians($1)) * cos(radians(d.pickup_lat)) *
          cos(radians(d.pickup_lng) - radians($2)) +
          sin(radians($1)) * sin(radians(d.pickup_lat))
        )) <= $3
      ORDER BY distance_from_driver ASC`,
      [+lat, +lng, +radius_km]
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error('Nearby orders error:', err);
    res.status(500).json({ error: 'Failed to find nearby orders' });
  }
});

module.exports = router;
