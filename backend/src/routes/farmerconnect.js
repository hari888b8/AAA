const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/farmerconnect/properties
router.get('/properties', optionalAuth, async (req, res) => {
  try {
    const { type, district_id, min_rent, max_rent, search, limit = 20, offset = 0 } = req.query;
    let conditions = [`p.is_available = true`];
    let params = [];
    let i = 1;

    if (type) { conditions.push(`p.property_type = $${i++}`); params.push(type); }
    if (district_id) { conditions.push(`p.district_id = $${i++}`); params.push(district_id); }
    if (min_rent) { conditions.push(`p.rent_amount >= $${i++}`); params.push(min_rent); }
    if (max_rent) { conditions.push(`p.rent_amount <= $${i++}`); params.push(max_rent); }
    if (search) {
      conditions.push(`(p.title ILIKE $${i} OR p.location_label ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT p.*, d.name AS district_name, d.state_name,
             u.name AS owner_name, u.phone AS owner_phone
      FROM properties p
      LEFT JOIN districts d ON d.id = p.district_id
      JOIN users u ON u.id = p.owner_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.is_verified DESC, p.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    res.json({ properties: result.rows, total: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/farmerconnect/properties
router.post('/properties', authMiddleware, async (req, res) => {
  try {
    const { title, property_type, location_label, district_id, area, rent_amount,
            rent_period = 'month', furnishing, floor_info, description, amenities } = req.body;

    if (!title || !property_type || !rent_amount) {
      return res.status(400).json({ error: 'title, property_type, rent_amount required' });
    }

    const result = await query(`
      INSERT INTO properties (id, owner_id, title, property_type, location_label, district_id,
        area, rent_amount, rent_period, furnishing, floor_info, description, amenities)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, title, property_type, location_label, district_id,
        area, rent_amount, rent_period, furnishing, floor_info, description, amenities]);

    res.status(201).json({ property: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farmerconnect/properties/:id
router.get('/properties/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, d.name AS district_name, u.name AS owner_name
      FROM properties p
      LEFT JOIN districts d ON d.id = p.district_id
      JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Property not found' });
    res.json({ property: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/farmerconnect/stats
router.get('/stats', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) AS total_listings,
        COUNT(*) FILTER (WHERE property_type = 'Apartment') AS apartments,
        COUNT(*) FILTER (WHERE property_type = 'Agricultural Land') AS agri_land,
        COUNT(*) FILTER (WHERE property_type = 'PG') AS pg_listings,
        COUNT(*) FILTER (WHERE is_verified = true) AS verified_listings,
        ROUND(AVG(rent_amount)::numeric, 0) AS avg_rent
      FROM properties WHERE is_available = true
    `);
    res.json({ stats: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/farmerconnect/properties/:id — edit property
router.patch('/properties/:id', authMiddleware, async (req, res) => {
  try {
    const { rent_amount, description, furnishing, amenities, is_available } = req.body;
    const existing = await query('SELECT * FROM properties WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Property not found' });
    const result = await query(`
      UPDATE properties SET rent_amount = COALESCE($1, rent_amount),
        description = COALESCE($2, description), furnishing = COALESCE($3, furnishing),
        amenities = COALESCE($4, amenities), is_available = COALESCE($5, is_available)
      WHERE id = $6 RETURNING *
    `, [rent_amount, description, furnishing, amenities, is_available, req.params.id]);
    res.json({ property: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/farmerconnect/properties/:id
router.delete('/properties/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM properties WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Property not found' });
    await query('DELETE FROM properties WHERE id = $1', [req.params.id]);
    res.json({ message: 'Property deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/inquiries — send property inquiry
router.post('/inquiries', authMiddleware, async (req, res) => {
  try {
    const { property_id, message, move_in_date } = req.body;
    if (!property_id) return res.status(400).json({ error: 'property_id required' });
    const prop = await query('SELECT * FROM properties WHERE id = $1', [property_id]);
    if (!prop.rows.length) return res.status(404).json({ error: 'Property not found' });
    const result = await query(`
      INSERT INTO inquiries (id, buyer_id, quantity_needed, message, status)
      VALUES ($1, $2, 1, $3, 'pending') RETURNING *
    `, [uuidv4(), req.user.id, `[Property Inquiry] ID: ${property_id}. Move-in: ${move_in_date || 'Flexible'}. ${message || ''}`]);
    res.status(201).json({ inquiry: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/inquiries
router.get('/inquiries', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT i.* FROM inquiries i WHERE i.buyer_id = $1 AND i.message LIKE '%Property Inquiry%'
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json({ inquiries: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/saved — save property
router.post('/saved', authMiddleware, async (req, res) => {
  try {
    const { property_id } = req.body;
    if (!property_id) return res.status(400).json({ error: 'property_id required' });
    // Store as a notification-like record or use a dedicated table
    // Using buyer_watchlists with a property context
    const result = await query(`
      INSERT INTO buyer_watchlists (id, buyer_id, crop_id, state, alert_enabled)
      VALUES ($1, $2, NULL, $3, false) RETURNING *
    `, [uuidv4(), req.user.id, `saved_property:${property_id}`]);
    res.status(201).json({ saved: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/saved
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT bw.*, bw.state AS property_ref FROM buyer_watchlists bw
      WHERE bw.buyer_id = $1 AND bw.state LIKE 'saved_property:%'
    `, [req.user.id]);
    const propertyIds = result.rows.map(r => r.state.replace('saved_property:', '')).filter(Boolean);
    let properties = [];
    if (propertyIds.length) {
      const propRes = await query(`SELECT * FROM properties WHERE id = ANY($1::uuid[])`, [propertyIds]);
      properties = propRes.rows;
    }
    res.json({ saved: result.rows, properties });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/farmerconnect/saved/:id
router.delete('/saved/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM buyer_watchlists WHERE id = $1 AND buyer_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
