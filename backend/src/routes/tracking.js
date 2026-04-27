const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ─── GET /tracking/:type/:id — Get tracking history ────────────────────────
router.get('/:type/:id', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const r = await pool.query(
      `SELECT ot.*, u.name AS actor_name
       FROM order_tracking ot LEFT JOIN users u ON ot.actor_id = u.id
       WHERE ot.order_type = $1 AND ot.order_id = $2
       ORDER BY ot.created_at ASC`,
      [type, id]
    );
    res.json({ tracking: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /tracking — Add tracking event ───────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { order_id, order_type, status, location, notes } = req.body;
    if (!order_id || !order_type || !status) {
      return res.status(400).json({ error: 'order_id, order_type, status required' });
    }

    const r = await pool.query(
      `INSERT INTO order_tracking (order_id, order_type, status, location, notes, actor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [order_id, order_type, status, location || '', notes || '', req.user.id]
    );
    res.status(201).json({ event: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /tracking/my — My orders with latest tracking ─────────────────────
router.get('/my/all', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT ON (ot.order_id, ot.order_type)
              ot.order_id, ot.order_type, ot.status, ot.location, ot.notes, ot.created_at
       FROM order_tracking ot
       WHERE ot.actor_id = $1
       ORDER BY ot.order_id, ot.order_type, ot.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
