const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — place order on a supply listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { listing_id, listing_type, quantity, price_per_unit, delivery_address, notes } = req.body;
    if (!listing_id || !quantity) return res.status(400).json({ error: 'listing_id and quantity required' });

    const total_amount = quantity * (price_per_unit || 0);
    const result = await query(`
      INSERT INTO orders (id, buyer_id, listing_id, listing_type, quantity, price_per_unit, total_amount, delivery_address, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [uuidv4(), req.user.id, listing_id, listing_type || 'supply', quantity, price_per_unit, total_amount, delivery_address, notes]);

    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — my orders (buyer or seller)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role = 'buyer', status, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (role === 'seller') {
      // Find orders where I own the listing
      conditions.push(`o.listing_id IN (
        SELECT id FROM supply_listings WHERE farmer_id = $${i++}
        UNION SELECT id FROM harvest_listings WHERE farmer_id = $${i++}
      )`);
      params.push(req.user.id, req.user.id);
    } else {
      conditions.push(`o.buyer_id = $${i++}`);
      params.push(req.user.id);
    }
    if (status) { conditions.push(`o.status = $${i++}`); params.push(status); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT o.*, u.name AS buyer_name
      FROM orders o
      JOIN users u ON u.id = o.buyer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY o.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'in_transit', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });

    const result = await query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, u.name AS buyer_name, u.phone AS buyer_phone
      FROM orders o JOIN users u ON u.id = o.buyer_id
      WHERE o.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
