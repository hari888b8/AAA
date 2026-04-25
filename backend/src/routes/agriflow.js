const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/agriflow/listings — public supply marketplace
router.get('/listings', optionalAuth, async (req, res) => {
  try {
    const { crop_id, district_id, is_organic, grade, limit = 20, offset = 0 } = req.query;
    let conditions = [`sl.status = 'active'`];
    let params = [];
    let i = 1;

    if (crop_id)    { conditions.push(`sl.crop_id = $${i++}`);    params.push(crop_id); }
    if (district_id){ conditions.push(`sl.district_id = $${i++}`);params.push(district_id); }
    if (is_organic !== undefined) { conditions.push(`sl.is_organic = $${i++}`); params.push(is_organic === 'true'); }
    if (grade)      { conditions.push(`sl.grade = $${i++}`);      params.push(grade); }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT sl.*, cc.name AS crop_name, cc.icon_emoji, cc.category,
             d.name AS district_name, d.state_name
      FROM supply_listings sl
      JOIN crop_catalog cc ON cc.id = sl.crop_id
      LEFT JOIN districts d ON d.id = sl.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sl.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) FROM supply_listings sl WHERE ${conditions.join(' AND ')}
    `, params.slice(0, -2));

    res.json({ listings: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agriflow/listings — FPO create listing
router.post('/listings', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, quantity_kg, grade = 'ungraded', is_organic = false,
            price_per_kg, min_order_kg, collection_center, description, farmer_name, location_label } = req.body;

    if (!crop_id || !quantity_kg) return res.status(400).json({ error: 'crop_id and quantity_kg required' });

    const result = await query(`
      INSERT INTO supply_listings (id, fpo_id, crop_id, district_id, quantity_kg, grade, is_organic,
        price_per_kg, min_order_kg, collection_center, description, farmer_name, location_label)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, crop_id, district_id, quantity_kg, grade, is_organic,
        price_per_kg, min_order_kg, collection_center, description, farmer_name, location_label]);

    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/listings/:id
router.get('/listings/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT sl.*, cc.name AS crop_name, cc.icon_emoji, cc.category, cc.growing_days,
             d.name AS district_name, d.state_name
      FROM supply_listings sl
      JOIN crop_catalog cc ON cc.id = sl.crop_id
      LEFT JOIN districts d ON d.id = sl.district_id
      WHERE sl.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agriflow/inquiries — buyer sends inquiry
router.post('/inquiries', authMiddleware, async (req, res) => {
  try {
    const { listing_id, quantity_needed, timeline, message } = req.body;

    const listing = await query(`SELECT fpo_id, crop_id FROM supply_listings WHERE id = $1`, [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });

    const result = await query(`
      INSERT INTO inquiries (id, buyer_id, listing_id, seller_id, crop_id, quantity_needed, timeline, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.user.id, listing_id, listing.rows[0].fpo_id,
        listing.rows[0].crop_id, quantity_needed, timeline, message]);

    res.status(201).json({ inquiry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/inquiries — get inquiries for logged-in user
router.get('/inquiries', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT i.*, cc.name AS crop_name, cc.icon_emoji,
             bu.name AS buyer_name, bu.phone AS buyer_phone,
             su.name AS seller_name
      FROM inquiries i
      JOIN crop_catalog cc ON cc.id = i.crop_id
      JOIN users bu ON bu.id = i.buyer_id
      JOIN users su ON su.id = i.seller_id
      WHERE i.buyer_id = $1 OR i.seller_id = $1
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json({ inquiries: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/declarations — farmer's declarations
router.get('/declarations', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*, cc.name AS crop_name, cc.icon_emoji, dist.name AS district_name
      FROM declarations d
      JOIN crop_catalog cc ON cc.id = d.crop_id
      LEFT JOIN districts dist ON dist.id = d.district_id
      WHERE d.farmer_id = $1
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    res.json({ declarations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agriflow/declarations
router.post('/declarations', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, area_acres, expected_yield, sow_date,
            expected_harvest_date, quality_grade = 'ungraded', is_organic = false, notes } = req.body;

    if (!crop_id || !area_acres || !sow_date || !expected_harvest_date) {
      return res.status(400).json({ error: 'crop_id, area_acres, sow_date, expected_harvest_date required' });
    }

    const result = await query(`
      INSERT INTO declarations (id, farmer_id, crop_id, district_id, area_acres, expected_yield,
        sow_date, expected_harvest_date, quality_grade, is_organic, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, crop_id, district_id, area_acres, expected_yield,
        sow_date, expected_harvest_date, quality_grade, is_organic, notes]);

    res.status(201).json({ declaration: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/crops — crop catalog
router.get('/crops', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM crop_catalog ORDER BY name`);
    res.json({ crops: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agriflow/districts
router.get('/districts', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM districts ORDER BY state_code, name`);
    res.json({ districts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
