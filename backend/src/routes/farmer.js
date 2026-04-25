const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── Farmer Profile ───────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT fp.*, d.name as district_name, d.state_name
       FROM farmer_profiles fp
       LEFT JOIN districts d ON fp.district_id = d.id
       WHERE fp.user_id = $1`,
      [req.user.id]
    );
    res.json({ profile: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const { state, district_id, mandal, village, pincode, total_land_acres,
            land_unit, irrigation_type, farming_method, soil_type,
            organic_certified, primary_crops, contact_consent } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO farmer_profiles (user_id, state, district_id, mandal, village, pincode,
        total_land_acres, land_unit, irrigation_type, farming_method, soil_type,
        organic_certified, primary_crops, contact_consent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (user_id) DO UPDATE SET
        state=$2, district_id=$3, mandal=$4, village=$5, pincode=$6,
        total_land_acres=$7, land_unit=$8, irrigation_type=$9, farming_method=$10,
        soil_type=$11, organic_certified=$12, primary_crops=$13, contact_consent=$14
       RETURNING *`,
      [req.user.id, state, district_id, mandal, village, pincode,
       total_land_acres, land_unit || 'acres', irrigation_type || [],
       farming_method || 'conventional', soil_type || [],
       organic_certified || false, primary_crops || [], contact_consent || 'fpo_only']
    );
    // Mark onboarding completed
    await pool.query('UPDATE users SET onboarding_completed = true WHERE id = $1', [req.user.id]);
    res.json({ profile: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Harvest Calendar ─────────────────────────────────────────
router.get('/harvest-calendar', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, c.name as crop_name, c.icon_emoji,
              EXTRACT(DAY FROM d.expected_harvest_date - CURRENT_DATE) as days_to_harvest
       FROM declarations d
       JOIN crop_catalog c ON d.crop_id = c.id
       WHERE d.farmer_id = $1
       ORDER BY d.expected_harvest_date ASC`,
      [req.user.id]
    );
    res.json({ calendar: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── My Listings (availability postings) ──────────────────────
router.get('/my-listings', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sl.*, c.name as crop_name, d.name as district_name
       FROM supply_listings sl
       LEFT JOIN crop_catalog c ON sl.crop_id = c.id
       LEFT JOIN districts d ON sl.district_id = d.id
       WHERE sl.fpo_id = $1
       ORDER BY sl.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── My Inquiries ─────────────────────────────────────────────
router.get('/my-inquiries', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.name as crop_name, u.name as buyer_name
       FROM inquiries i
       LEFT JOIN crop_catalog c ON i.crop_id = c.id
       LEFT JOIN users u ON i.buyer_id = u.id
       WHERE i.seller_id = $1
       ORDER BY i.created_at DESC
       LIMIT $2`,
      [req.user.id, req.query.limit || 20]
    );
    res.json({ inquiries: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Farmer Stats ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const declResult = await pool.query('SELECT COUNT(*) as count FROM declarations WHERE farmer_id = $1', [req.user.id]);
    const listResult = await pool.query("SELECT COUNT(*) as count FROM supply_listings WHERE fpo_id = $1 AND status = 'active'", [req.user.id]);
    const inqResult = await pool.query('SELECT COUNT(*) as count FROM inquiries WHERE seller_id = $1', [req.user.id]);
    const profile = await pool.query('SELECT total_land_acres FROM farmer_profiles WHERE user_id = $1', [req.user.id]);
    res.json({
      stats: {
        total_declarations: parseInt(declResult.rows[0].count),
        active_listings: parseInt(listResult.rows[0].count),
        total_inquiries: parseInt(inqResult.rows[0].count),
        land_acres: profile.rows[0]?.total_land_acres || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
