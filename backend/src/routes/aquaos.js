const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/aquaos/ponds
router.get('/ponds', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, 
             EXTRACT(EPOCH FROM (NOW() - stocking_date))/86400 AS doc_computed
      FROM ponds p
      WHERE p.farmer_id = $1
      ORDER BY p.pond_code
    `, [req.user.id]);
    res.json({ ponds: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aquaos/ponds
router.post('/ponds', authMiddleware, async (req, res) => {
  try {
    const { pond_code, species, area_acres, stocked_count, stocking_date,
            ph_level, temperature_c, dissolved_o2, notes } = req.body;
    if (!pond_code || !species) return res.status(400).json({ error: 'pond_code and species required' });

    const result = await query(`
      INSERT INTO ponds (id, farmer_id, pond_code, species, area_acres, stocked_count,
        stocking_date, ph_level, temperature_c, dissolved_o2, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, pond_code, species, area_acres, stocked_count,
        stocking_date, ph_level, temperature_c, dissolved_o2, notes]);

    res.status(201).json({ pond: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/aquaos/ponds/:id
router.patch('/ponds/:id', authMiddleware, async (req, res) => {
  try {
    const { survival_pct, avg_weight_g, ph_level, temperature_c, dissolved_o2, status, notes } = req.body;
    const result = await query(`
      UPDATE ponds SET
        survival_pct = COALESCE($1, survival_pct),
        avg_weight_g = COALESCE($2, avg_weight_g),
        ph_level     = COALESCE($3, ph_level),
        temperature_c= COALESCE($4, temperature_c),
        dissolved_o2 = COALESCE($5, dissolved_o2),
        status       = COALESCE($6, status),
        notes        = COALESCE($7, notes)
      WHERE id = $8 AND farmer_id = $9 RETURNING *
    `, [survival_pct, avg_weight_g, ph_level, temperature_c, dissolved_o2, status, notes, req.params.id, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Pond not found' });
    res.json({ pond: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aquaos/ponds/:id/water-log
router.post('/ponds/:id/water-log', authMiddleware, async (req, res) => {
  try {
    const { ph_level, temperature_c, dissolved_o2, salinity_ppt, ammonia_ppm, notes } = req.body;

    // Verify ownership
    const pond = await query(`SELECT id FROM ponds WHERE id = $1 AND farmer_id = $2`, [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });

    const result = await query(`
      INSERT INTO water_quality_logs (id, pond_id, ph_level, temperature_c, dissolved_o2, salinity_ppt, ammonia_ppm, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.params.id, ph_level, temperature_c, dissolved_o2, salinity_ppt, ammonia_ppm, notes]);

    // Update pond's latest readings
    await query(`UPDATE ponds SET ph_level=$1, temperature_c=$2, dissolved_o2=$3 WHERE id=$4`,
      [ph_level, temperature_c, dissolved_o2, req.params.id]);

    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aquaos/ponds/:id/water-logs
router.get('/ponds/:id/water-logs', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM water_quality_logs WHERE pond_id = $1 ORDER BY logged_at DESC LIMIT 30
    `, [req.params.id]);
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aquaos/advisories
router.get('/advisories', async (req, res) => {
  try {
    const { severity, district_id } = req.query;
    let conditions = [`is_active = true`];
    let params = [];
    let i = 1;
    if (severity) { conditions.push(`severity = $${i++}`); params.push(severity); }
    if (district_id) { conditions.push(`(district_id = $${i++} OR district_id IS NULL)`); params.push(district_id); }

    const result = await query(`
      SELECT a.*, d.name AS district_name FROM advisories a
      LEFT JOIN districts d ON d.id = a.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
               a.created_at DESC
    `, params);
    res.json({ advisories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aquaos/stats — farm summary
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active')   AS active_ponds,
        COUNT(*) FILTER (WHERE status = 'harvested') AS harvested_ponds,
        ROUND(SUM(area_acres)::numeric, 2)           AS total_area,
        ROUND(AVG(survival_pct)::numeric, 1)         AS avg_survival,
        ROUND(AVG(ph_level)::numeric, 2)             AS avg_ph,
        ROUND(AVG(temperature_c)::numeric, 1)         AS avg_temp
      FROM ponds WHERE farmer_id = $1
    `, [req.user.id]);
    res.json({ stats: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
