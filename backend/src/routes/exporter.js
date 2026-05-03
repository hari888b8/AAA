'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// EXPORTER DASHBOARD — Bulk Procurement, Quality Certs, Sourcing
// ═══════════════════════════════════════════════════════════════

// POST /api/exporter/orders — Create export order
router.post('/orders', auth, async (req, res) => {
  try {
    const { crop_name, variety, quantity_mt, target_price, quality_grade,
            destination_country, shipping_port, required_certs, ship_by_date } = req.body;

    if (!crop_name || !quantity_mt) {
      return res.status(400).json({ error: 'crop_name and quantity_mt required' });
    }

    const result = await pool.query(`
      INSERT INTO export_orders (exporter_id, crop_name, variety, quantity_mt, target_price,
        quality_grade, destination_country, shipping_port, required_certs, ship_by_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [req.user.id, crop_name, variety, quantity_mt, target_price,
        quality_grade, destination_country, shipping_port,
        JSON.stringify(required_certs || []), ship_by_date]);

    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exporter/orders — List my export orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM export_orders WHERE exporter_id = $1';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exporter/orders/:id — Get order with sourcing details
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const order = await pool.query(
      'SELECT * FROM export_orders WHERE id = $1 AND exporter_id = $2',
      [req.params.id, req.user.id]
    );
    if (!order.rows.length) return res.status(404).json({ error: 'Order not found' });

    const sourcing = await pool.query(
      'SELECT * FROM export_sourcing WHERE export_order_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ order: order.rows[0], sourcing: sourcing.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exporter/orders/:id/source — Add sourcing entry
router.post('/orders/:id/source', auth, async (req, res) => {
  try {
    const { fpo_id, farmer_id, quantity_mt, price_per_kg, quality_report } = req.body;

    const result = await pool.query(`
      INSERT INTO export_sourcing (export_order_id, fpo_id, farmer_id, quantity_mt, price_per_kg, quality_report)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.params.id, fpo_id, farmer_id, quantity_mt, price_per_kg,
        JSON.stringify(quality_report || {})]);

    // Update fulfillment percentage
    const total = await pool.query(
      'SELECT COALESCE(SUM(quantity_mt), 0) as sourced FROM export_sourcing WHERE export_order_id = $1',
      [req.params.id]
    );
    const order = await pool.query('SELECT quantity_mt FROM export_orders WHERE id = $1', [req.params.id]);
    const pct = Math.min(100, (parseFloat(total.rows[0].sourced) / parseFloat(order.rows[0].quantity_mt)) * 100);

    await pool.query(
      'UPDATE export_orders SET fulfillment_pct = $1, updated_at = NOW() WHERE id = $2',
      [pct, req.params.id]
    );

    res.status(201).json({ sourcing: result.rows[0], fulfillment_pct: pct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
