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

module.exports = router;
