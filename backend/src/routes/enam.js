'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// eNAM + NABARD + SFAC GOVERNMENT INTEGRATION LAYER
// Connects AgriHub to national agricultural infrastructure
// ═══════════════════════════════════════════════════════════════

// ─── eNAM (Electronic National Agriculture Market) ────────────

// GET /api/enam/mandis — List connected eNAM mandis
router.get('/mandis', auth, async (req, res) => {
  try {
    const { state, district } = req.query;
    let query = 'SELECT * FROM enam_mandis WHERE is_active = true';
    const params = [];

    if (state) { params.push(state); query += ` AND state = $${params.length}`; }
    if (district) { params.push(district); query += ` AND district = $${params.length}`; }
    query += ' ORDER BY mandi_name LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ mandis: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/enam/prices — Live eNAM mandi prices
router.get('/prices', auth, async (req, res) => {
  try {
    const { crop_id, mandi_id, date } = req.query;
    let query = 'SELECT * FROM enam_prices WHERE 1=1';
    const params = [];

    if (crop_id) { params.push(crop_id); query += ` AND crop_id = $${params.length}`; }
    if (mandi_id) { params.push(mandi_id); query += ` AND mandi_id = $${params.length}`; }
    if (date) { params.push(date); query += ` AND price_date = $${params.length}`; }
    else { query += ' AND price_date = CURRENT_DATE'; }
    query += ' ORDER BY price_date DESC, crop_id LIMIT 200';

    const result = await pool.query(query, params);
    res.json({ prices: result.rows, source: 'eNAM', updated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enam/trade — Create trade lot on eNAM
router.post('/trade', auth, async (req, res) => {
  try {
    const { mandi_id, crop_id, quantity_quintals, expected_price, lot_quality_grade } = req.body;
    if (!mandi_id || !crop_id || !quantity_quintals) {
      return res.status(400).json({ error: 'mandi_id, crop_id, quantity_quintals required' });
    }

    const result = await pool.query(`
      INSERT INTO enam_trade_lots (farmer_id, mandi_id, crop_id, quantity_quintals,
        expected_price, lot_quality_grade, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending_approval', NOW())
      RETURNING *
    `, [req.user.id, mandi_id, crop_id, quantity_quintals, expected_price, lot_quality_grade || 'FAQ']);

    res.status(201).json({ trade_lot: result.rows[0], message: 'Lot submitted to eNAM for approval' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/enam/trades — My eNAM trade lots
router.get('/trades', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM enam_trade_lots WHERE farmer_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ trade_lots: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NABARD Integration ──────────────────────────────────────

// GET /api/enam/nabard/schemes — NABARD scheme eligibility
router.get('/nabard/schemes', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM nabard_schemes WHERE is_active = true 
       ORDER BY priority_score DESC LIMIT 50`
    );

    // Check user eligibility for each scheme
    const userProfile = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userProfile.rows[0] || {};

    const schemesWithEligibility = result.rows.map(scheme => ({
      ...scheme,
      eligible: checkNABARDEligibility(user, scheme),
    }));

    res.json({ schemes: schemesWithEligibility, source: 'NABARD' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enam/nabard/apply — Apply for NABARD scheme
router.post('/nabard/apply', auth, async (req, res) => {
  try {
    const { scheme_id, application_data } = req.body;
    if (!scheme_id) return res.status(400).json({ error: 'scheme_id required' });

    const result = await pool.query(`
      INSERT INTO nabard_applications (user_id, scheme_id, application_data, status, applied_at)
      VALUES ($1, $2, $3, 'submitted', NOW())
      RETURNING *
    `, [req.user.id, scheme_id, JSON.stringify(application_data || {})]);

    res.status(201).json({ application: result.rows[0], message: 'Application submitted to NABARD' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/enam/nabard/applications — My NABARD applications
router.get('/nabard/applications', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM nabard_applications WHERE user_id = $1 ORDER BY applied_at DESC',
      [req.user.id]
    );
    res.json({ applications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SFAC (Small Farmers' Agri-Business Consortium) ──────────

// GET /api/enam/sfac/fpo-schemes — SFAC FPO support schemes
router.get('/sfac/fpo-schemes', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sfac_schemes WHERE is_active = true ORDER BY scheme_name'
    );
    res.json({ schemes: result.rows, source: 'SFAC' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enam/sfac/apply — Apply for SFAC support
router.post('/sfac/apply', auth, async (req, res) => {
  try {
    const { scheme_id, fpo_id, project_details, requested_amount } = req.body;
    if (!scheme_id) return res.status(400).json({ error: 'scheme_id required' });

    const result = await pool.query(`
      INSERT INTO sfac_applications (user_id, fpo_id, scheme_id, project_details, requested_amount, status, applied_at)
      VALUES ($1, $2, $3, $4, $5, 'submitted', NOW())
      RETURNING *
    `, [req.user.id, fpo_id, scheme_id, JSON.stringify(project_details || {}), requested_amount]);

    res.status(201).json({ application: result.rows[0], message: 'SFAC application submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/enam/sfac/applications — My SFAC applications
router.get('/sfac/applications', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sfac_applications WHERE user_id = $1 ORDER BY applied_at DESC',
      [req.user.id]
    );
    res.json({ applications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PM-KISAN Direct Benefit Transfer Status ─────────────────

// GET /api/enam/pm-kisan/status — Check PM-KISAN beneficiary status
router.get('/pm-kisan/status', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pm_kisan_beneficiaries WHERE user_id = $1',
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.json({
        registered: false,
        message: 'Not registered for PM-KISAN. Register with Aadhaar to receive ₹6000/year.',
      });
    }

    res.json({ beneficiary: result.rows[0], registered: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enam/pm-kisan/register — Register for PM-KISAN
router.post('/pm-kisan/register', auth, async (req, res) => {
  try {
    const { aadhaar_linked, bank_account_linked, land_record_id } = req.body;

    const result = await pool.query(`
      INSERT INTO pm_kisan_beneficiaries (user_id, aadhaar_linked, bank_account_linked, land_record_id, status, registered_at)
      VALUES ($1, $2, $3, $4, 'verification_pending', NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        aadhaar_linked = $2, bank_account_linked = $3, updated_at = NOW()
      RETURNING *
    `, [req.user.id, aadhaar_linked || false, bank_account_linked || false, land_record_id]);

    res.status(201).json({ beneficiary: result.rows[0], message: 'PM-KISAN registration submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utility
function checkNABARDEligibility(user, scheme) {
  // Basic eligibility check based on user type and scheme criteria
  if (scheme.target_user_type && user.user_type !== scheme.target_user_type) return false;
  return true;
}

module.exports = router;
