'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// GOVERNMENT INTEGRATION — PM-KISAN, eNAM, Soil Health, PMFBY
// ═══════════════════════════════════════════════════════════════

// GET /api/government/schemes — List synced government schemes for user
router.get('/schemes', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM govt_sync_records WHERE user_id = $1 ORDER BY last_synced DESC',
      [req.user.id]
    );
    res.json({ schemes: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/government/sync — Trigger sync for a scheme
router.post('/sync', auth, async (req, res) => {
  try {
    const { scheme_name, scheme_type, external_ref, data_payload } = req.body;
    if (!scheme_name || !scheme_type) {
      return res.status(400).json({ error: 'scheme_name and scheme_type required' });
    }

    const result = await pool.query(`
      INSERT INTO govt_sync_records (user_id, scheme_name, scheme_type, external_ref, data_payload, sync_status, last_synced)
      VALUES ($1, $2, $3, $4, $5, 'synced', NOW())
      RETURNING *
    `, [req.user.id, scheme_name, scheme_type, external_ref,
        JSON.stringify(data_payload || {})]);

    res.status(201).json({ syncRecord: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/pm-kisan — Check PM-KISAN status
router.get('/pm-kisan', auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM govt_sync_records WHERE user_id = $1 AND scheme_type = 'pm_kisan' ORDER BY last_synced DESC LIMIT 1",
      [req.user.id]
    );
    res.json({ pmKisan: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/soil-health — Get soil health card data
router.get('/soil-health', auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM govt_sync_records WHERE user_id = $1 AND scheme_type = 'soil_health_card' ORDER BY last_synced DESC LIMIT 1",
      [req.user.id]
    );
    res.json({ soilHealth: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/government/enam — Get eNAM listing status
router.get('/enam', auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM govt_sync_records WHERE user_id = $1 AND scheme_type = 'enam' ORDER BY last_synced DESC",
      [req.user.id]
    );
    res.json({ enamRecords: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
