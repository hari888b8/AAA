'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// SATELLITE CROP MONITORING — NDVI, Soil Health, Alerts
// ═══════════════════════════════════════════════════════════════

// GET /api/satellite/fields — Get field monitoring data
router.get('/fields', auth, async (req, res) => {
  try {
    const { days } = req.query;
    const lookback = parseInt(days) || 30;

    const result = await pool.query(`
      SELECT * FROM crop_monitoring
      WHERE farmer_id = $1 AND ndvi_date >= CURRENT_DATE - $2 * INTERVAL '1 day'
      ORDER BY ndvi_date DESC LIMIT 100
    `, [req.user.id, lookback]);

    res.json({ monitoring: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/satellite/fields/:fieldId — Get specific field NDVI timeline
router.get('/fields/:fieldId', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM crop_monitoring
      WHERE farmer_id = $1 AND field_id = $2
      ORDER BY ndvi_date DESC LIMIT 60
    `, [req.user.id, req.params.fieldId]);

    res.json({ timeline: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/satellite/alerts — Get health alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM crop_monitoring
      WHERE farmer_id = $1 AND alert_type IS NOT NULL
      ORDER BY ndvi_date DESC LIMIT 20
    `, [req.user.id]);

    res.json({ alerts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/satellite/monitoring — Record NDVI data point
router.post('/monitoring', auth, async (req, res) => {
  try {
    const { field_id, ndvi_value, ndvi_date, health_status, alert_type, alert_message, geometry } = req.body;

    if (ndvi_value === undefined || !ndvi_date) {
      return res.status(400).json({ error: 'ndvi_value and ndvi_date are required' });
    }

    const result = await pool.query(`
      INSERT INTO crop_monitoring (farmer_id, field_id, ndvi_value, ndvi_date, health_status, alert_type, alert_message, geometry)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.id, field_id, ndvi_value, ndvi_date, health_status || 'normal',
        alert_type, alert_message, JSON.stringify(geometry || null)]);

    res.status(201).json({ monitoring: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/satellite/soil — Get soil health records
router.get('/soil', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM soil_health_records WHERE farmer_id = $1 ORDER BY test_date DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ soilRecords: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/satellite/soil — Add soil health record
router.post('/soil', auth, async (req, res) => {
  try {
    const { field_id, ph_value, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha,
            organic_carbon, soil_type, test_date, lab_name, card_number, recommendations } = req.body;

    const result = await pool.query(`
      INSERT INTO soil_health_records (farmer_id, field_id, ph_value, nitrogen_kg_ha, phosphorus_kg_ha,
        potassium_kg_ha, organic_carbon, soil_type, test_date, lab_name, card_number, recommendations)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [req.user.id, field_id, ph_value, nitrogen_kg_ha, phosphorus_kg_ha,
        potassium_kg_ha, organic_carbon, soil_type, test_date, lab_name, card_number,
        JSON.stringify(recommendations || [])]);

    res.status(201).json({ soilRecord: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
