const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ─── GET / — List user's watchlists ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT w.*, c.name AS crop_name, d.name AS district_name
       FROM user_watchlists w
       LEFT JOIN crop_catalog c ON w.crop_id = c.id
       LEFT JOIN districts d ON w.district_id = d.id
       WHERE w.user_id = $1 AND w.is_active = TRUE
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ watchlists: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST / — Create a watchlist alert ───────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { watch_type, crop_id, district_id, conditions } = req.body;
    if (!watch_type) return res.status(400).json({ error: 'watch_type is required' });

    const validTypes = ['crop_price', 'supply', 'listing', 'equipment', 'weather'];
    if (!validTypes.includes(watch_type)) {
      return res.status(400).json({ error: `watch_type must be one of: ${validTypes.join(', ')}` });
    }

    const { rows } = await pool.query(
      `INSERT INTO user_watchlists (user_id, watch_type, crop_id, district_id, conditions)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, watch_type, crop_id || null, district_id || null, JSON.stringify(conditions || {})]
    );
    res.status(201).json({ watchlist: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /:id — Update watchlist conditions ────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    const { conditions, is_active } = req.body;
    const sets = [];
    const params = [req.params.id, req.user.id];
    let i = 3;

    if (conditions !== undefined) { sets.push(`conditions = $${i++}`); params.push(JSON.stringify(conditions)); }
    if (is_active !== undefined) { sets.push(`is_active = $${i++}`); params.push(is_active); }

    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    const { rows } = await pool.query(
      `UPDATE user_watchlists SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Watchlist not found' });
    res.json({ watchlist: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /:id — Remove watchlist ──────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM user_watchlists WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Watchlist not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /alerts — Get triggered alerts ──────────────────────────────────────
router.get('/alerts', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT w.*, c.name AS crop_name, d.name AS district_name
       FROM user_watchlists w
       LEFT JOIN crop_catalog c ON w.crop_id = c.id
       LEFT JOIN districts d ON w.district_id = d.id
       WHERE w.user_id = $1 AND w.is_active = TRUE AND w.last_triggered IS NOT NULL
       ORDER BY w.last_triggered DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ alerts: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
