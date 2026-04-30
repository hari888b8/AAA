const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ─── GET / — List user's favorites/shortlists ───────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let conditions = ['user_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (type) { conditions.push(`listing_type = $${i++}`); params.push(type); }

    const { rows } = await pool.query(
      `SELECT * FROM listing_shortlists WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
      params
    );
    res.json({ favorites: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST / — Add to favorites ──────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { listing_type, listing_id, notes } = req.body;
    if (!listing_type || !listing_id) {
      return res.status(400).json({ error: 'listing_type and listing_id required' });
    }

    const validTypes = ['property', 'supply_listing', 'equipment', 'service', 'harvest_listing', 'job'];
    if (!validTypes.includes(listing_type)) {
      return res.status(400).json({ error: `listing_type must be one of: ${validTypes.join(', ')}` });
    }

    const { rows } = await pool.query(
      `INSERT INTO listing_shortlists (user_id, listing_type, listing_id, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, listing_type, listing_id) DO NOTHING
       RETURNING *`,
      [req.user.id, listing_type, listing_id, notes || null]
    );

    if (rows.length === 0) {
      return res.json({ message: 'Already in favorites', already_exists: true });
    }
    res.status(201).json({ favorite: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /:id — Remove from favorites ─────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM listing_shortlists WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /by-listing/:type/:listingId — Remove by listing reference ───────
router.delete('/by-listing/:type/:listingId', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM listing_shortlists WHERE user_id = $1 AND listing_type = $2 AND listing_id = $3`,
      [req.user.id, req.params.type, req.params.listingId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /check/:type/:listingId — Check if listing is favorited ─────────────
router.get('/check/:type/:listingId', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM listing_shortlists WHERE user_id = $1 AND listing_type = $2 AND listing_id = $3`,
      [req.user.id, req.params.type, req.params.listingId]
    );
    res.json({ is_favorited: rows.length > 0, favorite_id: rows[0]?.id || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
