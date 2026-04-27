const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');

// ─── GET /listings — Browse land listings ───────────────────────
router.get('/listings', optionalAuth, async (req, res) => {
  try {
    const { type, mode, district, min_price, max_price, min_area, max_area, water_source, soil_type, search, limit = 20, offset = 0 } = req.query;
    let query = `SELECT l.*, u.name as owner_name, d.name as district_name
                 FROM bhoomios_listings l
                 LEFT JOIN users u ON l.owner_id = u.id
                 LEFT JOIN districts d ON l.district_id = d.id
                 WHERE l.is_available = true`;
    const params = [];
    let idx = 1;

    if (type) { query += ` AND l.land_type = $${idx++}`; params.push(type); }
    if (mode) { query += ` AND l.listing_mode = $${idx++}`; params.push(mode); }
    if (district) { query += ` AND l.district_id = $${idx++}`; params.push(Number(district)); }
    if (min_price) { query += ` AND l.price >= $${idx++}`; params.push(Number(min_price)); }
    if (max_price) { query += ` AND l.price <= $${idx++}`; params.push(Number(max_price)); }
    if (min_area) { query += ` AND l.area_acres >= $${idx++}`; params.push(Number(min_area)); }
    if (max_area) { query += ` AND l.area_acres <= $${idx++}`; params.push(Number(max_area)); }
    if (water_source) { query += ` AND $${idx++} = ANY(l.water_sources)`; params.push(water_source); }
    if (soil_type) { query += ` AND $${idx++} = ANY(l.soil_types)`; params.push(soil_type); }
    if (search) { query += ` AND (l.title ILIKE $${idx++} OR l.location_label ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    query += ` ORDER BY l.is_verified DESC, l.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);
    res.json({ listings: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /listings/:id — Single listing detail ──────────────────
router.get('/listings/:id', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name, u.phone as owner_phone, d.name as district_name
       FROM bhoomios_listings l
       LEFT JOIN users u ON l.owner_id = u.id
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE l.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /listings — Create a land listing ─────────────────────
router.post('/listings', auth, async (req, res) => {
  try {
    const { title, land_type, listing_mode, area_acres, price, price_unit, district_id, location_label,
            water_sources, soil_types, crops_grown, road_access, fencing, description, images, lat, lng } = req.body;
    if (!title || !land_type || !listing_mode || !area_acres) {
      return res.status(400).json({ error: 'title, land_type, listing_mode, area_acres required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bhoomios_listings (owner_id, title, land_type, listing_mode, area_acres, price, price_unit,
        district_id, location_label, water_sources, soil_types, crops_grown, road_access, fencing, description, images, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.user.id, title, land_type, listing_mode, area_acres, price, price_unit || 'total',
       district_id, location_label, water_sources || [], soil_types || [], crops_grown || [],
       road_access || false, fencing || false, description, images || [], lat, lng]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /listings/:id — Update listing ───────────────────────
router.patch('/listings/:id', auth, async (req, res) => {
  try {
    const { title, price, description, is_available, images } = req.body;
    const { rows } = await pool.query(
      `UPDATE bhoomios_listings SET
        title = COALESCE($2, title), price = COALESCE($3, price),
        description = COALESCE($4, description), is_available = COALESCE($5, is_available),
        images = COALESCE($6, images), updated_at = NOW()
       WHERE id = $1 AND owner_id = $7 RETURNING *`,
      [req.params.id, title, price, description, is_available, images, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Listing not found or not yours' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /listings/:id ────────────────────────────────────────
router.delete('/listings/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM bhoomios_listings WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Listing not found' });
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /my-listings — Seller's own listings ───────────────────
router.get('/my-listings', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, d.name as district_name FROM bhoomios_listings l
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE l.owner_id = $1 ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /inquiries — Buyer sends inquiry on listing ───────────
router.post('/inquiries', auth, async (req, res) => {
  try {
    const { listing_id, message, offered_price, contact_phone } = req.body;
    if (!listing_id) return res.status(400).json({ error: 'listing_id required' });

    const listing = await pool.query('SELECT * FROM bhoomios_listings WHERE id=$1', [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });

    const { rows } = await pool.query(
      `INSERT INTO bhoomios_inquiries (listing_id, buyer_id, seller_id, message, offered_price, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [listing_id, req.user.id, listing.rows[0].owner_id, message, offered_price, contact_phone]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /inquiries — Get inquiries for user ────────────────────
router.get('/inquiries', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, l.title as listing_title, l.land_type, l.area_acres, l.price,
              u.name as buyer_name
       FROM bhoomios_inquiries i
       LEFT JOIN bhoomios_listings l ON i.listing_id = l.id
       LEFT JOIN users u ON i.buyer_id = u.id
       WHERE i.seller_id = $1 OR i.buyer_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json({ inquiries: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /saved — Save a listing ──────────────────────────────
router.post('/saved', auth, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO bhoomios_saved (user_id, listing_id) VALUES ($1,$2)
       ON CONFLICT(user_id, listing_id) DO NOTHING RETURNING *`,
      [req.user.id, listing_id]
    );
    res.status(201).json({ saved: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /saved — My saved listings ─────────────────────────────
router.get('/saved', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, d.name as district_name FROM bhoomios_saved s
       JOIN bhoomios_listings l ON s.listing_id = l.id
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /saved/:listing_id — Un-save ────────────────────────
router.delete('/saved/:listing_id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM bhoomios_saved WHERE user_id=$1 AND listing_id=$2', [req.user.id, req.params.listing_id]);
    res.json({ removed: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /stats — BhoomiOS platform stats ───────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [listings, sale, rent] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM bhoomios_listings WHERE is_available=true'),
      pool.query(`SELECT COUNT(*) FROM bhoomios_listings WHERE listing_mode='sale' AND is_available=true`),
      pool.query(`SELECT COUNT(*) FROM bhoomios_listings WHERE listing_mode='rent' AND is_available=true`),
    ]);
    res.json({
      total_listings: parseInt(listings.rows[0].count),
      for_sale: parseInt(sale.rows[0].count),
      for_rent: parseInt(rent.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
