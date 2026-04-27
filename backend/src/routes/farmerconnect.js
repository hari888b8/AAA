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

// ── Society Management ────────────────────────────────
// GET /api/farmerconnect/societies
router.get('/societies', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM societies WHERE manager_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ societies: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/societies
router.post('/societies', authMiddleware, async (req, res) => {
  try {
    const { name, address, total_units, district_id } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await query(`
      INSERT INTO societies (id, manager_id, name, address, total_units, district_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.user.id, name, address, total_units || 0, district_id]);
    res.status(201).json({ society: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/societies/:id/visitors
router.post('/societies/:id/visitors', authMiddleware, async (req, res) => {
  try {
    const { visitor_name, phone, purpose, unit_number } = req.body;
    const result = await query(`
      INSERT INTO society_visitors (id, society_id, visitor_name, phone, purpose, unit_number)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.params.id, visitor_name, phone, purpose, unit_number]);
    res.status(201).json({ visitor: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/societies/:id/visitors
router.get('/societies/:id/visitors', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM society_visitors WHERE society_id = $1 ORDER BY check_in DESC LIMIT 50
    `, [req.params.id]);
    res.json({ visitors: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/farmerconnect/visitors/:id/checkout
router.patch('/visitors/:id/checkout', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE society_visitors SET check_out = NOW(), status = 'checked_out' WHERE id = $1 RETURNING *
    `, [req.params.id]);
    res.json({ visitor: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/societies/:id/maintenance
router.get('/societies/:id/maintenance', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM maintenance_dues WHERE society_id = $1 ORDER BY due_date DESC
    `, [req.params.id]);
    res.json({ dues: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/societies/:id/maintenance
router.post('/societies/:id/maintenance', authMiddleware, async (req, res) => {
  try {
    const { unit_number, resident_name, amount, due_date } = req.body;
    const result = await query(`
      INSERT INTO maintenance_dues (id, society_id, unit_number, resident_name, amount, due_date)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.params.id, unit_number, resident_name, amount, due_date]);
    res.status(201).json({ due: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/farmerconnect/maintenance/:id/pay
router.patch('/maintenance/:id/pay', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE maintenance_dues SET status = 'paid', paid_date = CURRENT_DATE WHERE id = $1 RETURNING *
    `, [req.params.id]);
    res.json({ due: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/societies/:id/complaints
router.get('/societies/:id/complaints', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM society_complaints WHERE society_id = $1 ORDER BY created_at DESC
    `, [req.params.id]);
    res.json({ complaints: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/societies/:id/complaints
router.post('/societies/:id/complaints', authMiddleware, async (req, res) => {
  try {
    const { unit_number, resident_name, category, description } = req.body;
    const result = await query(`
      INSERT INTO society_complaints (id, society_id, unit_number, resident_name, category, description)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.params.id, unit_number, resident_name, category, description]);
    res.status(201).json({ complaint: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/farmerconnect/complaints/:id/resolve
router.patch('/complaints/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE society_complaints SET status = 'resolved', resolved_at = NOW() WHERE id = $1 RETURNING *
    `, [req.params.id]);
    res.json({ complaint: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/societies/:id/notices
router.get('/societies/:id/notices', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM society_notices WHERE society_id = $1 ORDER BY created_at DESC
    `, [req.params.id]);
    res.json({ notices: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/farmerconnect/societies/:id/notices
router.post('/societies/:id/notices', authMiddleware, async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const result = await query(`
      INSERT INTO society_notices (id, society_id, title, content, priority)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, title, content, priority || 'normal']);
    res.status(201).json({ notice: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Rent Agreements ───────────────────────────────────
// POST /api/farmerconnect/agreements
router.post('/agreements', authMiddleware, async (req, res) => {
  try {
    const { property_id, tenant_name, tenant_phone, rent_amount, security_deposit, start_date, end_date, terms } = req.body;
    if (!property_id || !tenant_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'property_id, tenant_name, start_date, end_date required' });
    }
    const prop = await query('SELECT * FROM properties WHERE id = $1 AND owner_id = $2', [property_id, req.user.id]);
    if (!prop.rows.length) return res.status(404).json({ error: 'Property not found or not owned' });
    const result = await query(`
      INSERT INTO rent_agreements (id, property_id, owner_id, tenant_name, tenant_phone, rent_amount, security_deposit, start_date, end_date, terms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [uuidv4(), property_id, req.user.id, tenant_name, tenant_phone, rent_amount, security_deposit, start_date, end_date, terms]);
    res.status(201).json({ agreement: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/farmerconnect/agreements
router.get('/agreements', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT ra.*, p.title AS property_title FROM rent_agreements ra
      JOIN properties p ON p.id = ra.property_id
      WHERE ra.owner_id = $1
      ORDER BY ra.created_at DESC
    `, [req.user.id]);
    res.json({ agreements: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── AI Match Score ────────────────────────────────────
// GET /api/farmerconnect/match-score?property_id=X&budget=Y&type=Z
router.get('/match-score', authMiddleware, async (req, res) => {
  try {
    const { property_id, budget, preferred_type } = req.query;
    const prop = await query('SELECT * FROM properties WHERE id = $1', [property_id]);
    if (!prop.rows.length) return res.status(404).json({ error: 'Property not found' });
    const p = prop.rows[0];
    let score = 50;
    if (budget && p.rent_amount) {
      const budgetNum = parseFloat(budget);
      if (p.rent_amount <= budgetNum) score += 20;
      else if (p.rent_amount <= budgetNum * 1.2) score += 10;
    }
    if (preferred_type && p.property_type === preferred_type) score += 15;
    if (p.is_verified) score += 10;
    if (p.amenities?.length > 3) score += 5;
    score = Math.min(99, score);
    res.json({ match_score: score, property_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
