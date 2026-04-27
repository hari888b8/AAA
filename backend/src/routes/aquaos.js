const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ════════════════════════════════════════════════════════════════
// FARM MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/farms — list farmer's farms
router.get('/farms', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT f.*, d.name AS district_name,
             (SELECT COUNT(*) FROM ponds p WHERE p.farm_id = f.id) AS pond_count_live
      FROM aqua_farms f
      LEFT JOIN districts d ON d.id = f.district_id
      WHERE f.farmer_id = $1
      ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json({ farms: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos/farms — create farm
router.post('/farms', authMiddleware, async (req, res) => {
  try {
    const { farm_name, location, district_id, state, gps_lat, gps_long, total_area_acres } = req.body;
    if (!farm_name) return res.status(400).json({ error: 'farm_name required' });
    const result = await query(`
      INSERT INTO aqua_farms (id, farmer_id, farm_name, location, district_id, state, gps_lat, gps_long, total_area_acres)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [uuidv4(), req.user.id, farm_name, location, district_id, state || 'Andhra Pradesh', gps_lat, gps_long, total_area_acres]);
    res.status(201).json({ farm: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos/farms/:id
router.patch('/farms/:id', authMiddleware, async (req, res) => {
  try {
    const { farm_name, location, total_area_acres } = req.body;
    const result = await query(`
      UPDATE aqua_farms SET farm_name=COALESCE($1,farm_name), location=COALESCE($2,location),
        total_area_acres=COALESCE($3,total_area_acres), updated_at=NOW()
      WHERE id=$4 AND farmer_id=$5 RETURNING *
    `, [farm_name, location, total_area_acres, req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Farm not found' });
    res.json({ farm: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// POND MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/ponds
router.get('/ponds', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*,
             EXTRACT(EPOCH FROM (NOW() - p.stocking_date))/86400 AS doc_computed,
             f.farm_name
      FROM ponds p
      LEFT JOIN aqua_farms f ON f.id = p.farm_id
      WHERE p.farmer_id = $1
      ORDER BY p.status DESC, p.pond_code
    `, [req.user.id]);
    res.json({ ponds: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos/ponds
router.post('/ponds', authMiddleware, async (req, res) => {
  try {
    const { pond_code, species, area_acres, stocked_count, stocking_date,
            ph_level, temperature_c, dissolved_o2, notes, farm_id, water_source, depth_m, location_label } = req.body;
    if (!pond_code || !species) return res.status(400).json({ error: 'pond_code and species required' });
    const result = await query(`
      INSERT INTO ponds (id, farmer_id, farm_id, pond_code, species, area_acres, stocked_count,
        stocking_date, ph_level, temperature_c, dissolved_o2, notes, water_source, depth_m, location_label)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [uuidv4(), req.user.id, farm_id || null, pond_code, species, area_acres, stocked_count,
        stocking_date, ph_level, temperature_c, dissolved_o2, notes, water_source, depth_m, location_label]);
    res.status(201).json({ pond: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos/ponds/:id
router.patch('/ponds/:id', authMiddleware, async (req, res) => {
  try {
    const { survival_pct, avg_weight_g, ph_level, temperature_c, dissolved_o2, status, notes, species, area_acres } = req.body;
    const result = await query(`
      UPDATE ponds SET
        survival_pct = COALESCE($1, survival_pct),
        avg_weight_g = COALESCE($2, avg_weight_g),
        ph_level     = COALESCE($3, ph_level),
        temperature_c= COALESCE($4, temperature_c),
        dissolved_o2 = COALESCE($5, dissolved_o2),
        status       = COALESCE($6, status),
        notes        = COALESCE($7, notes),
        species      = COALESCE($8, species),
        area_acres   = COALESCE($9, area_acres)
      WHERE id = $10 AND farmer_id = $11 RETURNING *
    `, [survival_pct, avg_weight_g, ph_level, temperature_c, dissolved_o2, status, notes, species, area_acres, req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Pond not found' });
    res.json({ pond: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/aquaos/ponds/:id
router.delete('/ponds/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM ponds WHERE id = $1 AND farmer_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Pond not found' });
    await query('DELETE FROM feed_logs WHERE pond_id = $1', [req.params.id]);
    await query('DELETE FROM growth_samples WHERE pond_id = $1', [req.params.id]);
    await query('DELETE FROM mortality_logs WHERE pond_id = $1', [req.params.id]);
    await query('DELETE FROM water_quality_logs WHERE pond_id = $1', [req.params.id]);
    await query('DELETE FROM crop_cycles WHERE pond_id = $1', [req.params.id]);
    await query('DELETE FROM ponds WHERE id = $1', [req.params.id]);
    res.json({ message: 'Pond deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// CROP CYCLES
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/ponds/:id/crop-cycles
router.get('/ponds/:id/crop-cycles', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM crop_cycles WHERE pond_id = $1 ORDER BY stocking_date DESC
    `, [req.params.id]);
    res.json({ cycles: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos/ponds/:id/crop-cycles — start crop cycle
router.post('/ponds/:id/crop-cycles', authMiddleware, async (req, res) => {
  try {
    const { species, stocking_date, seed_count, seed_supplier, expected_harvest_date, notes } = req.body;
    const pond = await query('SELECT id FROM ponds WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    // Update pond species/stocking
    await query('UPDATE ponds SET species=$1, stocked_count=$2, stocking_date=$3, status=$4 WHERE id=$5',
      [species, seed_count, stocking_date, 'active', req.params.id]);
    const result = await query(`
      INSERT INTO crop_cycles (id, pond_id, species, stocking_date, seed_count, seed_supplier, expected_harvest_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.params.id, species, stocking_date, seed_count, seed_supplier, expected_harvest_date, notes]);
    res.status(201).json({ cycle: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos/crop-cycles/:id — complete harvest
router.patch('/crop-cycles/:id', authMiddleware, async (req, res) => {
  try {
    const { status, harvest_quantity_kg, avg_weight_at_harvest, actual_harvest_date, notes } = req.body;
    const result = await query(`
      UPDATE crop_cycles SET status=COALESCE($1,status), harvest_quantity_kg=COALESCE($2,harvest_quantity_kg),
        avg_weight_at_harvest=COALESCE($3,avg_weight_at_harvest), actual_harvest_date=COALESCE($4,actual_harvest_date),
        notes=COALESCE($5,notes), updated_at=NOW()
      WHERE id=$6 RETURNING *
    `, [status, harvest_quantity_kg, avg_weight_at_harvest, actual_harvest_date, notes, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    if (status === 'harvested') {
      await query('UPDATE ponds SET status=$1 WHERE id=$2', ['harvested', result.rows[0].pond_id]);
    }
    res.json({ cycle: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// WATER QUALITY
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos/ponds/:id/water-log
router.post('/ponds/:id/water-log', authMiddleware, async (req, res) => {
  try {
    const { ph_level, temperature_c, dissolved_o2, salinity_ppt, ammonia_ppm, notes } = req.body;
    const pond = await query(`SELECT id FROM ponds WHERE id = $1 AND farmer_id = $2`, [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const result = await query(`
      INSERT INTO water_quality_logs (id, pond_id, ph_level, temperature_c, dissolved_o2, salinity_ppt, ammonia_ppm, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.params.id, ph_level, temperature_c, dissolved_o2, salinity_ppt, ammonia_ppm, notes]);
    await query(`UPDATE ponds SET ph_level=$1, temperature_c=$2, dissolved_o2=$3 WHERE id=$4`,
      [ph_level, temperature_c, dissolved_o2, req.params.id]);
    res.status(201).json({ log: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/ponds/:id/water-logs
router.get('/ponds/:id/water-logs', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM water_quality_logs WHERE pond_id = $1 ORDER BY logged_at DESC LIMIT 50`, [req.params.id]);
    res.json({ logs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FEED LOGS
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos/ponds/:id/feed-logs
router.post('/ponds/:id/feed-logs', authMiddleware, async (req, res) => {
  try {
    const { feed_type, quantity_kg, cost, brand, notes } = req.body;
    const pond = await query('SELECT id FROM ponds WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const result = await query(`
      INSERT INTO feed_logs (id, pond_id, feed_type, quantity_kg, cost, brand, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.params.id, feed_type, quantity_kg, cost, brand, notes]);
    // Update crop cycle total feed
    await query(`UPDATE crop_cycles SET total_feed_kg = total_feed_kg + $1 WHERE pond_id=$2 AND status='active'`, [quantity_kg || 0, req.params.id]);
    res.status(201).json({ feed_log: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/ponds/:id/feed-logs
router.get('/ponds/:id/feed-logs', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM feed_logs WHERE pond_id=$1 ORDER BY logged_at DESC LIMIT 50`, [req.params.id]);
    res.json({ feed_logs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// MORTALITY LOGS
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos/ponds/:id/mortality
router.post('/ponds/:id/mortality', authMiddleware, async (req, res) => {
  try {
    const { mortality_count, reason, symptoms, severity } = req.body;
    if (!mortality_count) return res.status(400).json({ error: 'mortality_count required' });
    const pond = await query('SELECT id FROM ponds WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    // Get active crop cycle
    const cycle = await query(`SELECT id FROM crop_cycles WHERE pond_id=$1 AND status='active' LIMIT 1`, [req.params.id]);
    const result = await query(`
      INSERT INTO mortality_logs (id, pond_id, crop_cycle_id, mortality_count, reason, symptoms, severity)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.params.id, cycle.rows[0]?.id || null, mortality_count, reason, symptoms || [], severity || 'normal']);
    // Update crop cycle total mortality
    if (cycle.rows[0]) {
      await query(`UPDATE crop_cycles SET total_mortality = total_mortality + $1 WHERE id=$2`, [mortality_count, cycle.rows[0].id]);
    }
    res.status(201).json({ log: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/ponds/:id/mortality
router.get('/ponds/:id/mortality', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM mortality_logs WHERE pond_id=$1 ORDER BY logged_at DESC LIMIT 50`, [req.params.id]);
    res.json({ logs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// GROWTH SAMPLES
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos/ponds/:id/growth-samples
router.post('/ponds/:id/growth-samples', authMiddleware, async (req, res) => {
  try {
    const { avg_weight_g, sample_count, survival_pct, notes } = req.body;
    const pond = await query('SELECT id FROM ponds WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const result = await query(`
      INSERT INTO growth_samples (id, pond_id, avg_weight_g, sample_count, survival_pct, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.params.id, avg_weight_g, sample_count || 10, survival_pct, notes]);
    await query('UPDATE ponds SET avg_weight_g=$1, survival_pct=COALESCE($2,survival_pct) WHERE id=$3',
      [avg_weight_g, survival_pct, req.params.id]);
    res.status(201).json({ sample: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/ponds/:id/growth-samples
router.get('/ponds/:id/growth-samples', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM growth_samples WHERE pond_id=$1 ORDER BY sampled_at ASC`, [req.params.id]);
    res.json({ samples: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FARMER DASHBOARD (computed metrics)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/dashboard — comprehensive farm dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Ponds summary
    const pondStats = await query(`
      SELECT
        COUNT(*) AS total_ponds,
        COUNT(*) FILTER (WHERE status='active') AS active_ponds,
        COUNT(*) FILTER (WHERE status='harvested') AS harvested_ponds,
        ROUND(SUM(area_acres)::numeric, 2) AS total_area,
        ROUND(AVG(survival_pct) FILTER (WHERE status='active')::numeric, 1) AS avg_survival,
        ROUND(AVG(avg_weight_g) FILTER (WHERE status='active')::numeric, 1) AS avg_weight,
        ROUND(AVG(ph_level) FILTER (WHERE status='active' AND ph_level IS NOT NULL)::numeric, 2) AS avg_ph,
        ROUND(AVG(temperature_c) FILTER (WHERE status='active' AND temperature_c IS NOT NULL)::numeric, 1) AS avg_temp,
        ROUND(AVG(dissolved_o2) FILTER (WHERE status='active' AND dissolved_o2 IS NOT NULL)::numeric, 1) AS avg_do
      FROM ponds WHERE farmer_id = $1
    `, [req.user.id]);

    // Active crop cycles
    const activeCrops = await query(`
      SELECT cc.*, p.pond_code, p.area_acres, p.avg_weight_g, p.survival_pct,
             EXTRACT(EPOCH FROM (NOW() - cc.stocking_date))/86400 AS crop_age_days
      FROM crop_cycles cc
      JOIN ponds p ON p.id = cc.pond_id
      WHERE p.farmer_id = $1 AND cc.status = 'active'
      ORDER BY cc.stocking_date
    `, [req.user.id]);

    // Feed summary (last 30 days)
    const feedSummary = await query(`
      SELECT ROUND(SUM(quantity_kg)::numeric, 1) AS total_feed_30d,
             ROUND(SUM(cost)::numeric, 0) AS total_feed_cost_30d,
             COUNT(*) AS feed_entries
      FROM feed_logs fl
      JOIN ponds p ON p.id = fl.pond_id
      WHERE p.farmer_id = $1 AND fl.logged_at > NOW() - INTERVAL '30 days'
    `, [req.user.id]);

    // Mortality summary (last 30 days)
    const mortSummary = await query(`
      SELECT COALESCE(SUM(mortality_count), 0) AS total_mortality_30d
      FROM mortality_logs ml
      JOIN ponds p ON p.id = ml.pond_id
      WHERE p.farmer_id = $1 AND ml.logged_at > NOW() - INTERVAL '30 days'
    `, [req.user.id]);

    // Expected harvest
    const harvestEstimates = activeCrops.rows.map(c => {
      const targetDoc = c.species?.toLowerCase().includes('vannamei') ? 120 : 180;
      const doc = Number(c.crop_age_days) || 0;
      const daysRemaining = Math.max(0, targetDoc - doc);
      const targetWeight = c.species?.toLowerCase().includes('vannamei') ? 30 : 500;
      const survival = Number(c.survival_pct || c.survival_pct || 80);
      const estimatedYieldKg = (c.seed_count * survival / 100 * targetWeight / 1000);
      const fcr = c.total_feed_kg > 0 && c.avg_weight_g > 0
        ? (c.total_feed_kg / ((c.seed_count * survival / 100 * c.avg_weight_g) / 1000))
        : null;
      return {
        pond_code: c.pond_code, species: c.species, crop_age_days: Math.round(doc),
        seed_count: c.seed_count, survival_pct: survival,
        current_weight_g: Number(c.avg_weight_g || 0), target_weight_g: targetWeight,
        days_to_harvest: daysRemaining, estimated_yield_kg: Math.round(estimatedYieldKg),
        fcr: fcr ? Number(fcr.toFixed(2)) : null,
        total_feed_kg: Number(c.total_feed_kg || 0),
        harvest_date: new Date(Date.now() + daysRemaining * 86400000).toISOString().split('T')[0]
      };
    });

    res.json({
      dashboard: {
        ponds: pondStats.rows[0],
        active_crops: harvestEstimates,
        feed_30d: feedSummary.rows[0],
        mortality_30d: mortSummary.rows[0],
        total_expected_yield_kg: harvestEstimates.reduce((s, h) => s + h.estimated_yield_kg, 0)
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ADVISORY ENGINE
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/advisory — smart AI-driven recommendations
router.get('/advisory', authMiddleware, async (req, res) => {
  try {
    const advisories = [];

    // Get active ponds with crop data
    const ponds = await query(`
      SELECT p.*, cc.total_feed_kg, cc.seed_count AS cc_seed_count, cc.total_mortality,
             EXTRACT(EPOCH FROM (NOW() - p.stocking_date))/86400 AS doc
      FROM ponds p
      LEFT JOIN crop_cycles cc ON cc.pond_id = p.id AND cc.status = 'active'
      WHERE p.farmer_id = $1 AND p.status = 'active'
    `, [req.user.id]);

    for (const p of ponds.rows) {
      const doc = Math.round(Number(p.doc) || 0);
      const species = (p.species || '').toLowerCase();
      const isVannamei = species.includes('vannamei') || species.includes('shrimp');
      const targetDoc = isVannamei ? 120 : 180;

      // Feed advisory
      if (p.total_feed_kg > 0 && p.cc_seed_count > 0) {
        const expectedFeedPerDay = isVannamei
          ? (doc < 30 ? 3 : doc < 60 ? 8 : doc < 90 ? 12 : 15) * (p.area_acres || 1)
          : (doc < 60 ? 5 : 10) * (p.area_acres || 1);
        const actualFeedPerDay = p.total_feed_kg / Math.max(doc, 1);
        if (actualFeedPerDay > expectedFeedPerDay * 1.3) {
          advisories.push({
            type: 'feed', severity: 'high', pond_code: p.pond_code,
            title: `⚠️ Feed overuse — ${p.pond_code}`,
            description: `Feed consumption is ${Math.round((actualFeedPerDay / expectedFeedPerDay - 1) * 100)}% above recommended levels for ${doc}-day ${p.species}. Consider reducing by ${Math.round((actualFeedPerDay - expectedFeedPerDay))} kg/day to avoid water quality issues.`,
            action: 'Reduce feed by 15-20% and monitor check-tray consumption'
          });
        }
      }

      // Water quality advisory
      if (p.ph_level && (p.ph_level < 7.0 || p.ph_level > 9.0)) {
        advisories.push({
          type: 'water', severity: p.ph_level < 6.5 || p.ph_level > 9.5 ? 'critical' : 'high', pond_code: p.pond_code,
          title: `⚠️ pH out of range — ${p.pond_code}`,
          description: `pH level ${p.ph_level} is ${p.ph_level < 7.0 ? 'below' : 'above'} optimal range (7.5-8.5). This can cause stress and mortality.`,
          action: p.ph_level < 7.0 ? 'Apply agricultural lime (50-100 kg/acre)' : 'Reduce fertilizer and improve water exchange'
        });
      }
      if (p.dissolved_o2 && p.dissolved_o2 < 4.0) {
        advisories.push({
          type: 'water', severity: p.dissolved_o2 < 3.0 ? 'critical' : 'high', pond_code: p.pond_code,
          title: `🚨 Low Dissolved Oxygen — ${p.pond_code}`,
          description: `DO level ${p.dissolved_o2} mg/L is dangerously low (min 4 mg/L for ${p.species}). Immediate aeration needed.`,
          action: 'Run all aerators 24/7. Emergency: add DO booster tablets. Check if organic load is high.'
        });
      }
      if (p.temperature_c && (p.temperature_c > 33 || p.temperature_c < 24)) {
        advisories.push({
          type: 'weather', severity: 'medium', pond_code: p.pond_code,
          title: `🌡️ Temperature ${p.temperature_c > 33 ? 'too high' : 'too low'} — ${p.pond_code}`,
          description: `Water temperature ${p.temperature_c}°C is ${p.temperature_c > 33 ? 'above' : 'below'} optimal range (26-32°C).`,
          action: p.temperature_c > 33 ? 'Increase water depth, run aerators for cooling' : 'Reduce water exchange, add shallow areas for sun exposure'
        });
      }

      // Growth advisory
      if (p.avg_weight_g && doc > 30) {
        const expectedWeight = isVannamei ? doc * 0.25 : doc * 3;
        if (p.avg_weight_g < expectedWeight * 0.7) {
          advisories.push({
            type: 'growth', severity: 'medium', pond_code: p.pond_code,
            title: `📉 Growth below expected — ${p.pond_code}`,
            description: `Current weight ${p.avg_weight_g}g vs expected ${expectedWeight.toFixed(0)}g at ${doc} days. Growth is ${Math.round((1 - p.avg_weight_g / expectedWeight) * 100)}% behind.`,
            action: 'Check feed quality, stocking density, and water parameters. Consider sampling.'
          });
        }
      }

      // Mortality advisory
      if (p.total_mortality > 0 && p.cc_seed_count > 0) {
        const mortPct = (p.total_mortality / p.cc_seed_count) * 100;
        if (mortPct > 25) {
          advisories.push({
            type: 'disease', severity: 'critical', pond_code: p.pond_code,
            title: `🚨 High mortality alert — ${p.pond_code}`,
            description: `Cumulative mortality ${mortPct.toFixed(1)}% exceeds 25% threshold. Possible disease outbreak.`,
            action: 'Reduce feed immediately. Test for White Spot Virus. Isolate pond. Contact veterinarian.'
          });
        }
      }

      // Harvest readiness
      if (doc >= targetDoc - 7 && doc <= targetDoc + 14) {
        advisories.push({
          type: 'harvest', severity: 'info', pond_code: p.pond_code,
          title: `🎣 Harvest ready — ${p.pond_code}`,
          description: `${p.species} at ${doc} days is approaching target harvest (${targetDoc} days). Current weight: ${p.avg_weight_g || 'unknown'}g.`,
          action: 'Stop feeding 2-3 days before harvest. Check market prices. List on marketplace.'
        });
      }
    }

    // If no advisories, add default good practices
    if (advisories.length === 0 && ponds.rows.length > 0) {
      advisories.push({
        type: 'info', severity: 'info', pond_code: 'All',
        title: '✅ All ponds healthy',
        description: 'No critical issues detected. Continue regular monitoring.',
        action: 'Log water quality daily, feed as per schedule, monitor growth weekly.'
      });
    }

    // Also fetch system-wide advisories
    const sysAdvisories = await query(`
      SELECT * FROM advisories WHERE is_active = true ORDER BY
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END LIMIT 5
    `);

    res.json({
      recommendations: advisories,
      system_advisories: sysAdvisories.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/advisories — system advisory list (kept for backward compat)
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
      ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, a.created_at DESC
    `, params);
    res.json({ advisories: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/stats — farm summary
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active_ponds,
        COUNT(*) FILTER (WHERE status = 'harvested') AS harvested_ponds,
        COUNT(*) AS total_ponds,
        ROUND(SUM(area_acres)::numeric, 2) AS total_area,
        ROUND(AVG(survival_pct) FILTER (WHERE status = 'active')::numeric, 1) AS avg_survival,
        ROUND(AVG(ph_level) FILTER (WHERE status = 'active' AND ph_level IS NOT NULL)::numeric, 2) AS avg_ph,
        ROUND(AVG(temperature_c) FILTER (WHERE status = 'active' AND temperature_c IS NOT NULL)::numeric, 1) AS avg_temp,
        ROUND(AVG(dissolved_o2) FILTER (WHERE status = 'active' AND dissolved_o2 IS NOT NULL)::numeric, 1) AS avg_do
      FROM ponds WHERE farmer_id = $1
    `, [req.user.id]);
    res.json({ stats: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// HARVEST MARKETPLACE
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos/harvest-listings
router.post('/harvest-listings', authMiddleware, async (req, res) => {
  try {
    const { pond_id, species, quantity_kg, avg_size_g, price_per_kg, district_id, location_label, description, harvest_date } = req.body;
    if (!species || !quantity_kg) return res.status(400).json({ error: 'species and quantity_kg required' });
    const result = await query(`
      INSERT INTO harvest_listings (id, farmer_id, pond_id, species, quantity_kg, avg_size_g, price_per_kg, district_id, location_label, description, harvest_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, pond_id, species, quantity_kg, avg_size_g, price_per_kg, district_id, location_label, description, harvest_date]);
    res.status(201).json({ listing: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/harvest-listings
router.get('/harvest-listings', async (req, res) => {
  try {
    const { species, district_id, min_size, max_price, limit = 20, offset = 0 } = req.query;
    let conditions = [`hl.status = 'available'`];
    let params = [];
    let i = 1;
    if (species) { conditions.push(`hl.species ILIKE $${i++}`); params.push(`%${species}%`); }
    if (district_id) { conditions.push(`hl.district_id = $${i++}`); params.push(district_id); }
    if (min_size) { conditions.push(`hl.avg_size_g >= $${i++}`); params.push(min_size); }
    if (max_price) { conditions.push(`hl.price_per_kg <= $${i++}`); params.push(max_price); }
    params.push(parseInt(limit), parseInt(offset));
    const result = await query(`
      SELECT hl.*, d.name AS district_name, u.name AS farmer_name
      FROM harvest_listings hl
      LEFT JOIN districts d ON d.id = hl.district_id
      JOIN users u ON u.id = hl.farmer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY hl.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);
    res.json({ listings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/my-listings — farmer's own listings
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT hl.*, d.name AS district_name,
             (SELECT COUNT(*) FROM aqua_offers ao WHERE ao.listing_id = hl.id) AS offer_count
      FROM harvest_listings hl
      LEFT JOIN districts d ON d.id = hl.district_id
      WHERE hl.farmer_id = $1
      ORDER BY hl.created_at DESC
    `, [req.user.id]);
    res.json({ listings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// OFFERS (Buyer → Farmer negotiation)
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos/offers — buyer makes offer
router.post('/offers', authMiddleware, async (req, res) => {
  try {
    const { listing_id, offer_price, quantity_kg, message } = req.body;
    if (!listing_id || !offer_price) return res.status(400).json({ error: 'listing_id and offer_price required' });
    const listing = await query('SELECT * FROM harvest_listings WHERE id=$1', [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    const result = await query(`
      INSERT INTO aqua_offers (id, buyer_id, listing_id, offer_price, quantity_kg, message)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.user.id, listing_id, offer_price, quantity_kg, message]);
    res.status(201).json({ offer: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/offers — get offers for farmer's listings or buyer's sent offers
router.get('/offers', authMiddleware, async (req, res) => {
  try {
    const role = req.query.role || 'farmer';
    let result;
    if (role === 'buyer') {
      result = await query(`
        SELECT ao.*, hl.species, hl.quantity_kg AS listing_qty, hl.price_per_kg AS listing_price,
               hl.farmer_id, u.name AS farmer_name, hl.location_label
        FROM aqua_offers ao
        JOIN harvest_listings hl ON hl.id = ao.listing_id
        JOIN users u ON u.id = hl.farmer_id
        WHERE ao.buyer_id = $1
        ORDER BY ao.created_at DESC
      `, [req.user.id]);
    } else {
      result = await query(`
        SELECT ao.*, hl.species, hl.quantity_kg AS listing_qty, hl.price_per_kg AS listing_price,
               u.name AS buyer_name, hl.pond_id, hl.location_label
        FROM aqua_offers ao
        JOIN harvest_listings hl ON hl.id = ao.listing_id
        JOIN users u ON u.id = ao.buyer_id
        WHERE hl.farmer_id = $1
        ORDER BY ao.created_at DESC
      `, [req.user.id]);
    }
    res.json({ offers: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos/offers/:id — farmer responds to offer
router.patch('/offers/:id', authMiddleware, async (req, res) => {
  try {
    const { status, farmer_response } = req.body;
    const result = await query(`
      UPDATE aqua_offers SET status=$1, farmer_response=$2, updated_at=NOW() WHERE id=$3 RETURNING *
    `, [status, farmer_response, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Offer not found' });
    res.json({ offer: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PRICE INTELLIGENCE
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/prices
router.get('/prices', async (req, res) => {
  try {
    const { species } = req.query;
    let conditions = [`price_date >= CURRENT_DATE - INTERVAL '7 days'`];
    let params = [];
    if (species) { conditions.push(`species ILIKE $1`); params.push(`%${species}%`); }
    const result = await query(`
      SELECT * FROM aqua_price_intelligence
      WHERE ${conditions.join(' AND ')}
      ORDER BY price_date DESC, species, market_name
    `, params);
    res.json({ prices: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// INPUT MARKETPLACE (Products)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/products
router.get('/products', async (req, res) => {
  try {
    const { category, species } = req.query;
    let conditions = ['in_stock = true'];
    let params = [];
    let i = 1;
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    if (species) { conditions.push(`$${i++} = ANY(species_tags)`); params.push(species); }
    const result = await query(`
      SELECT * FROM aqua_products WHERE ${conditions.join(' AND ')} ORDER BY category, name
    `, params);
    res.json({ products: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// HARVEST PLAN
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/ponds/:id/harvest-plan
router.get('/ponds/:id/harvest-plan', authMiddleware, async (req, res) => {
  try {
    const pond = await query('SELECT * FROM ponds WHERE id = $1 AND farmer_id = $2', [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const p = pond.rows[0];
    const doc = p.stocking_date ? Math.floor((Date.now() - new Date(p.stocking_date).getTime()) / 86400000) : 0;
    const isVannamei = (p.species || '').toLowerCase().includes('vannamei');
    const targetDoc = isVannamei ? 120 : 180;
    const daysRemaining = Math.max(0, targetDoc - doc);
    const targetWeight = isVannamei ? 30 : 500;
    const survival = p.survival_pct || 80;
    const harvestDate = new Date(Date.now() + daysRemaining * 86400000).toISOString().split('T')[0];
    const estimatedYield = ((p.stocked_count || 0) * survival / 100 * (targetWeight / 1000)).toFixed(0);
    // Best/average/worst case
    const bestCase = Math.round(estimatedYield * 1.15);
    const worstCase = Math.round(estimatedYield * 0.7);
    res.json({
      plan: {
        current_doc: doc, target_doc: targetDoc, days_remaining: daysRemaining,
        current_weight_g: p.avg_weight_g || 0, target_weight_g: targetWeight,
        estimated_harvest_date: harvestDate,
        estimated_yield_kg: parseFloat(estimatedYield),
        best_case_kg: bestCase, worst_case_kg: worstCase,
        survival_pct: survival,
        recommendation: daysRemaining > 30
          ? `Continue feeding. ${daysRemaining} days to target harvest.`
          : daysRemaining > 0
          ? `Prepare for harvest. Reduce feed 3 days before. Check market prices.`
          : `Ready to harvest! Weight: ${p.avg_weight_g || 0}g. List on marketplace for best price.`
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// MESSAGING (farmer ↔ buyer negotiation chat)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/messages?listing_id=&with_user=
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const { listing_id, with_user } = req.query;
    if (!listing_id || !with_user) return res.status(400).json({ error: 'listing_id and with_user required' });
    const result = await query(`
      SELECT m.*, u.name AS sender_name
      FROM aqua_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.listing_id = $1
        AND ((m.sender_id = $2 AND m.receiver_id = $3) OR (m.sender_id = $3 AND m.receiver_id = $2))
      ORDER BY m.created_at ASC
    `, [listing_id, req.user.id, with_user]);
    // mark received messages as read
    await query(`UPDATE aqua_messages SET is_read = true WHERE listing_id = $1 AND receiver_id = $2 AND is_read = false`, [listing_id, req.user.id]);
    res.json({ messages: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos/messages
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { receiver_id, listing_id, content } = req.body;
    if (!receiver_id || !content) return res.status(400).json({ error: 'receiver_id and content required' });
    const result = await query(`
      INSERT INTO aqua_messages (id, sender_id, receiver_id, listing_id, content)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.user.id, receiver_id, listing_id || null, content]);
    res.status(201).json({ message: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos/conversations — list chat threads for current user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT ON (thread_key)
        m.listing_id,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
        u.name AS other_user_name,
        hl.species, hl.price_per_kg,
        m.content AS last_message, m.created_at AS last_at,
        (SELECT COUNT(*) FROM aqua_messages m2 WHERE m2.listing_id = m.listing_id AND m2.receiver_id = $1 AND m2.is_read = false) AS unread_count,
        CASE WHEN m.sender_id < m.receiver_id
             THEN m.sender_id::text || '_' || m.receiver_id::text || '_' || COALESCE(m.listing_id::text, '')
             ELSE m.receiver_id::text || '_' || m.sender_id::text || '_' || COALESCE(m.listing_id::text, '')
        END AS thread_key
      FROM aqua_messages m
      LEFT JOIN harvest_listings hl ON hl.id = m.listing_id
      JOIN users u ON u.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY thread_key, m.created_at DESC
    `, [req.user.id]);
    res.json({ conversations: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SUPPLIER PRODUCT MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/my-products — supplier's own products
router.get('/my-products', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_products WHERE supplier_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json({ products: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos/products — supplier creates product
router.post('/products', authMiddleware, async (req, res) => {
  try {
    const { name, category, brand, description, price, unit, species_tags, image_url } = req.body;
    if (!name || !category || !price) return res.status(400).json({ error: 'name, category, price required' });
    const result = await query(`
      INSERT INTO aqua_products (id, supplier_id, name, category, brand, description, price, unit, species_tags, image_url, in_stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING *
    `, [uuidv4(), req.user.id, name, category, brand || null, description || null, price, unit || 'kg', species_tags || [], image_url || null]);
    res.status(201).json({ product: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos/products/:id — update product
router.patch('/products/:id', authMiddleware, async (req, res) => {
  try {
    const fields = ['name','category','brand','description','price','unit','species_tags','image_url','in_stock'];
    const updates = [], values = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); values.push(req.body[f]); }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id, req.user.id);
    const result = await query(`UPDATE aqua_products SET ${updates.join(', ')} WHERE id = $${i++} AND supplier_id = $${i++} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found or unauthorized' });
    res.json({ product: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/aquaos/products/:id
router.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(`DELETE FROM aqua_products WHERE id = $1 AND supplier_id = $2 RETURNING id`, [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found or unauthorized' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SUPPLY FORECAST (for buyers)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos/supply-forecast
router.get('/supply-forecast', async (req, res) => {
  try {
    const result = await query(`
      SELECT species, COUNT(*) AS pond_count,
             ROUND(SUM(COALESCE(stocked_count,0) * COALESCE(survival_pct,80) / 100 *
               CASE WHEN species ILIKE '%vannamei%' THEN 0.03 ELSE 0.5 END)::numeric, 0) AS estimated_total_kg,
             COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (NOW()-stocking_date))/86400 > 90) AS near_harvest_count
      FROM ponds WHERE status = 'active'
      GROUP BY species
    `);
    res.json({ forecast: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// KYC VERIFICATION FLOW
// ════════════════════════════════════════════════════════════════

router.get('/kyc', authMiddleware, async (req, res) => {
  try {
    const docs = await query(`SELECT * FROM aqua_kyc_documents WHERE user_id = $1 ORDER BY submitted_at DESC`, [req.user.id]);
    const user = await query(`SELECT is_verified FROM users WHERE id = $1`, [req.user.id]);
    const overall_status = docs.rows.length === 0 ? 'not_submitted'
      : docs.rows.every(d => d.status === 'verified') ? 'verified'
      : docs.rows.some(d => d.status === 'rejected') ? 'rejected' : 'pending';
    res.json({ documents: docs.rows, is_verified: user.rows[0]?.is_verified || false, overall_status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/kyc', authMiddleware, async (req, res) => {
  try {
    const { doc_type, doc_url } = req.body;
    if (!doc_type) return res.status(400).json({ error: 'doc_type required' });
    const valid_types = ['aadhaar', 'pan', 'gstin_cert', 'farm_reg', 'fisheries_license'];
    if (!valid_types.includes(doc_type)) return res.status(400).json({ error: 'Invalid doc_type' });
    await query(`DELETE FROM aqua_kyc_documents WHERE user_id = $1 AND doc_type = $2`, [req.user.id, doc_type]);
    const result = await query(`INSERT INTO aqua_kyc_documents (id, user_id, doc_type, doc_url, status) VALUES (gen_random_uuid(), $1, $2, $3, 'pending') RETURNING *`, [req.user.id, doc_type, doc_url || null]);
    res.status(201).json({ document: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PRICE ALERTS
// ════════════════════════════════════════════════════════════════

router.get('/price-alerts', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_price_alerts WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json({ alerts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/price-alerts', authMiddleware, async (req, res) => {
  try {
    const { species, target_price, direction } = req.body;
    if (!species || !target_price) return res.status(400).json({ error: 'species and target_price required' });
    const count = await query(`SELECT COUNT(*) FROM aqua_price_alerts WHERE user_id = $1 AND is_active = true`, [req.user.id]);
    if (parseInt(count.rows[0].count) >= 5) return res.status(400).json({ error: 'Max 5 active price alerts' });
    const result = await query(`INSERT INTO aqua_price_alerts (id, user_id, species, target_price, direction) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`, [req.user.id, species, target_price, direction || 'above']);
    res.status(201).json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/price-alerts/:id', authMiddleware, async (req, res) => {
  try {
    await query(`DELETE FROM aqua_price_alerts WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SAVED SEARCHES (Buyer)
// ════════════════════════════════════════════════════════════════

router.get('/saved-searches', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_saved_searches WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json({ searches: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/saved-searches', authMiddleware, async (req, res) => {
  try {
    const { name, filters, is_alert_on } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await query(`INSERT INTO aqua_saved_searches (id, user_id, name, filters, is_alert_on) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`, [req.user.id, name, JSON.stringify(filters || {}), is_alert_on || false]);
    res.status(201).json({ search: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/saved-searches/:id', authMiddleware, async (req, res) => {
  try {
    await query(`DELETE FROM aqua_saved_searches WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// REFERRAL PROGRAM
// ════════════════════════════════════════════════════════════════

router.get('/referral', authMiddleware, async (req, res) => {
  try {
    const user = (await query(`SELECT id, name, referral_code FROM users WHERE id = $1`, [req.user.id])).rows[0];
    let code = user.referral_code;
    if (!code) {
      const base = (user.name || 'AQUA').replace(/\s+/g, '').toUpperCase().slice(0, 4);
      code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
      await query(`UPDATE users SET referral_code = $1 WHERE id = $2`, [code, req.user.id]);
    }
    const referred = await query(`SELECT COUNT(*) FROM users WHERE referred_by = $1`, [req.user.id]);
    res.json({
      code, total_referrals: parseInt(referred.rows[0].count) || 0,
      reward_per_referral: '3 months premium advisory',
      link: `https://aquaos.in/join?ref=${code}`
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos/referral/apply — new user applies referral code
router.post('/referral/apply', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });
    const referrer = await query(`SELECT id FROM users WHERE referral_code = $1`, [code]);
    if (!referrer.rows.length) return res.status(404).json({ error: 'Invalid referral code' });
    if (referrer.rows[0].id === req.user.id) return res.status(400).json({ error: 'Cannot use own referral code' });
    // Check not already referred
    const existing = await query(`SELECT referred_by FROM users WHERE id = $1`, [req.user.id]);
    if (existing.rows[0]?.referred_by) return res.status(400).json({ error: 'Referral already applied' });
    await query(`UPDATE users SET referred_by = $1 WHERE id = $2`, [referrer.rows[0].id, req.user.id]);
    res.json({ success: true, message: 'Referral applied!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// BUYER SUBSCRIPTION
// ════════════════════════════════════════════════════════════════

router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_DATE) ORDER BY created_at DESC LIMIT 1`, [req.user.id]);
    const sub = result.rows[0];
    const tiers = {
      'Basic':      { offers_per_month: 20, saved_searches: 3,  price_history_days: 30,  early_alerts: false, api_access: false, price: 8000 },
      'Pro':        { offers_per_month: 100, saved_searches: 10, price_history_days: 180, early_alerts: true,  api_access: false, price: 15000 },
      'Enterprise': { offers_per_month: -1,  saved_searches: -1, price_history_days: 365, early_alerts: true,  api_access: true,  price: 25000 },
    };
    res.json({ subscription: sub || null, tier: sub?.plan_name || 'Free', features: tiers[sub?.plan_name] || { offers_per_month: 5, saved_searches: 1, price_history_days: 7, early_alerts: false, api_access: false, price: 0 }, tiers });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/subscription/upgrade', authMiddleware, async (req, res) => {
  try {
    const { tier, razorpay_payment_id, demo_mode } = req.body;
    const prices = { 'Basic': 8000, 'Pro': 15000, 'Enterprise': 25000 };
    if (!prices[tier]) return res.status(400).json({ error: 'Invalid tier' });
    // Require payment ID unless in demo mode
    if (!razorpay_payment_id && !demo_mode) return res.status(400).json({ error: 'Payment required' });
    await query(`UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`, [req.user.id]);
    const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 1);
    const result = await query(`INSERT INTO subscriptions (id, user_id, plan_name, plan_type, price, status, expires_at) VALUES (gen_random_uuid(), $1, $2, 'monthly', $3, 'active', $4) RETURNING *`, [req.user.id, tier, prices[tier], expiresAt.toISOString().split('T')[0]]);
    res.status(201).json({ subscription: result.rows[0], message: `Upgraded to ${tier}!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ════════════════════════════════════════════════════════════════

router.get('/notification-prefs', authMiddleware, async (req, res) => {
  try {
    let r = await query(`SELECT * FROM aqua_notification_prefs WHERE user_id = $1`, [req.user.id]);
    if (!r.rows.length) r = await query(`INSERT INTO aqua_notification_prefs (id, user_id) VALUES (gen_random_uuid(), $1) RETURNING *`, [req.user.id]);
    res.json({ prefs: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/notification-prefs', authMiddleware, async (req, res) => {
  try {
    const fields = ['feed_reminder','advisory_alerts','offer_notifs','community_replies','daily_prices','listing_expiry','supplier_promos','quiet_from','quiet_to'];
    const updates = ['updated_at = NOW()'], values = []; let i = 1;
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); values.push(req.body[f]); } }
    values.push(req.user.id);
    await query(`INSERT INTO aqua_notification_prefs (id, user_id) VALUES (gen_random_uuid(), $${i}) ON CONFLICT (user_id) DO NOTHING`, [req.user.id]);
    const r = await query(`UPDATE aqua_notification_prefs SET ${updates.join(', ')} WHERE user_id = $${i} RETURNING *`, values);
    res.json({ prefs: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PRIVACY SETTINGS (DPDP Act 2023)
// ════════════════════════════════════════════════════════════════

router.get('/privacy-settings', authMiddleware, async (req, res) => {
  try {
    let r = await query(`SELECT * FROM aqua_privacy_settings WHERE user_id = $1`, [req.user.id]);
    if (!r.rows.length) r = await query(`INSERT INTO aqua_privacy_settings (id, user_id) VALUES (gen_random_uuid(), $1) RETURNING *`, [req.user.id]);
    res.json({ settings: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/privacy-settings', authMiddleware, async (req, res) => {
  try {
    const fields = ['location_visibility','hide_volume','contact_after_offer','allow_analytics','anonymous_community'];
    const updates = ['updated_at = NOW()'], values = []; let i = 1;
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); values.push(req.body[f]); } }
    values.push(req.user.id);
    await query(`INSERT INTO aqua_privacy_settings (id, user_id) VALUES (gen_random_uuid(), $${i}) ON CONFLICT (user_id) DO NOTHING`, [req.user.id]);
    const r = await query(`UPDATE aqua_privacy_settings SET ${updates.join(', ')} WHERE user_id = $${i} RETURNING *`, values);
    res.json({ settings: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// DATA EXPORT (DPDP Act — Right to Access)
// ════════════════════════════════════════════════════════════════

router.get('/data-export', authMiddleware, async (req, res) => {
  try {
    const [user, farms, ponds, feeds, mortalities, waters, harvests, offers, alerts, posts] = await Promise.all([
      query(`SELECT id, phone, name, role, language, is_verified, created_at FROM users WHERE id = $1`, [req.user.id]),
      query(`SELECT * FROM aqua_farms WHERE farmer_id = $1`, [req.user.id]),
      query(`SELECT id, pond_code, species, area_acres, status, stocked_count, survival_pct, avg_weight_g, created_at FROM ponds WHERE farmer_id = $1`, [req.user.id]),
      query(`SELECT fl.* FROM feed_logs fl JOIN ponds p ON p.id = fl.pond_id WHERE p.farmer_id = $1 ORDER BY fl.logged_at DESC LIMIT 500`, [req.user.id]),
      query(`SELECT ml.* FROM mortality_logs ml JOIN ponds p ON p.id = ml.pond_id WHERE p.farmer_id = $1 ORDER BY ml.logged_at DESC LIMIT 500`, [req.user.id]),
      query(`SELECT wl.* FROM water_quality_logs wl JOIN ponds p ON p.id = wl.pond_id WHERE p.farmer_id = $1 ORDER BY wl.logged_at DESC LIMIT 500`, [req.user.id]),
      query(`SELECT id, species, quantity_kg, price_per_kg, status, created_at FROM harvest_listings WHERE farmer_id = $1`, [req.user.id]),
      query(`SELECT id, listing_id, offer_price, quantity_kg, status, created_at FROM aqua_offers WHERE buyer_id = $1`, [req.user.id]),
      query(`SELECT * FROM aqua_price_alerts WHERE user_id = $1`, [req.user.id]),
      query(`SELECT id, content, category, created_at FROM community_posts WHERE user_id = $1`, [req.user.id]),
    ]);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="aquaos-export-${Date.now()}.json"`);
    res.json({ exported_at: new Date().toISOString(), notice: 'Your AquaOS data export (DPDP Act 2023)', user: user.rows[0], farms: farms.rows, ponds: ponds.rows, feed_logs: feeds.rows, mortality_logs: mortalities.rows, water_logs: waters.rows, harvest_listings: harvests.rows, offers: offers.rows, price_alerts: alerts.rows, community_posts: posts.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// IoT SENSOR READINGS
// ════════════════════════════════════════════════════════════════

router.get('/ponds/:id/iot-readings', authMiddleware, async (req, res) => {
  try {
    const pond = await query(`SELECT id FROM ponds WHERE id = $1 AND farmer_id = $2`, [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const r = await query(`SELECT DISTINCT ON (sensor_type) * FROM aqua_iot_readings WHERE pond_id = $1 ORDER BY sensor_type, read_at DESC`, [req.params.id]);
    res.json({ readings: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ponds/:id/iot-readings', authMiddleware, async (req, res) => {
  try {
    const pond = await query(`SELECT id FROM ponds WHERE id = $1 AND farmer_id = $2`, [req.params.id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const { readings } = req.body;
    if (!Array.isArray(readings)) return res.status(400).json({ error: 'readings array required' });
    const inserted = [];
    for (const r of readings) {
      if (r.sensor_type && r.value !== undefined) {
        const row = await query(`INSERT INTO aqua_iot_readings (id, pond_id, sensor_type, value, unit) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`, [req.params.id, r.sensor_type, r.value, r.unit || null]);
        inserted.push(row.rows[0]);
        // Also update pond water quality values
        if (r.sensor_type === 'ph') await query(`UPDATE ponds SET ph_level = $1 WHERE id = $2`, [r.value, req.params.id]);
        if (r.sensor_type === 'do') await query(`UPDATE ponds SET dissolved_o2 = $1 WHERE id = $2`, [r.value, req.params.id]);
        if (r.sensor_type === 'temp') await query(`UPDATE ponds SET temperature_c = $1 WHERE id = $2`, [r.value, req.params.id]);
      }
    }
    res.status(201).json({ readings: inserted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
