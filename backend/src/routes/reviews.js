const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');

// ─── POST /reviews — Submit a review ───────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { target_type, target_id, rating, title, body, photos } = req.body;
    if (!target_type || !target_id || !rating) {
      return res.status(400).json({ error: 'target_type, target_id, rating required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    // Check if user already reviewed this target
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
      [req.user.id, target_type, target_id]
    );
    if (existing.rows.length > 0) {
      // Update existing review
      const r = await pool.query(
        `UPDATE reviews SET rating = $1, title = $2, body = $3, photos = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [rating, title || '', body || '', JSON.stringify(photos || []), existing.rows[0].id]
      );
      return res.json({ review: r.rows[0], updated: true });
    }

    const r = await pool.query(
      `INSERT INTO reviews (user_id, target_type, target_id, rating, title, body, photos)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, target_type, target_id, rating, title || '', body || '', JSON.stringify(photos || [])]
    );
    res.status(201).json({ review: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /reviews/:type/:id — Reviews for a target ────────────────────────
router.get('/:type/:id', optionalAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const reviews = await pool.query(
      `SELECT r.*, u.name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.target_type = $1 AND r.target_id = $2
       ORDER BY r.created_at DESC LIMIT 50`,
      [type, id]
    );

    // Aggregate stats
    const stats = await pool.query(
      `SELECT COUNT(*) AS total, ROUND(AVG(rating)::numeric, 1) AS avg_rating,
              COUNT(*) FILTER (WHERE rating = 5) AS five,
              COUNT(*) FILTER (WHERE rating = 4) AS four,
              COUNT(*) FILTER (WHERE rating = 3) AS three,
              COUNT(*) FILTER (WHERE rating = 2) AS two,
              COUNT(*) FILTER (WHERE rating = 1) AS one
       FROM reviews WHERE target_type = $1 AND target_id = $2`,
      [type, id]
    );

    res.json({
      reviews: reviews.rows,
      stats: stats.rows[0] || { total: 0, avg_rating: 0 }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /reviews/my — User's own reviews ──────────────────────────────────
router.get('/my/all', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ reviews: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── DELETE /reviews/:id — Delete own review ───────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /reviews/:id/helpful — Mark review helpful ──────────────────────
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING helpful_count',
      [req.params.id]
    );
    res.json({ helpful_count: r.rows[0]?.helpful_count || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
