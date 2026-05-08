/**
 * Farm Digital Twin Routes
 * Virtual replica of farms for scenario modeling, predictive simulations,
 * and optimization.
 *
 * Features:
 *   1. Farm CRUD (create/list/get/update digital twin farms)
 *   2. Plot Management (add/update/remove plots within a farm)
 *   3. Sensor / IoT (register sensors, ingest readings, view latest)
 *   4. Simulation Engine (crop, weather-impact, irrigation, fertilizer)
 *   5. Analytics (health-score, timeline, comparison, carbon-footprint)
 *   6. Alerts (active alerts, dismiss)
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────

const CROP_PROFILES = {
  rice:       { yield_q: 45, price_per_q: 2040, cost_per_acre: 18000, water_mm: 1200, season_days: 120, npk: [120, 60, 60]  },
  wheat:      { yield_q: 35, price_per_q: 2125, cost_per_acre: 15000, water_mm: 450,  season_days: 140, npk: [120, 60, 40]  },
  cotton:     { yield_q: 20, price_per_q: 6080, cost_per_acre: 22000, water_mm: 700,  season_days: 180, npk: [150, 75, 75]  },
  sugarcane:  { yield_q: 750,price_per_q: 315,  cost_per_acre: 35000, water_mm: 1500, season_days: 360, npk: [250, 100, 120]},
  maize:      { yield_q: 30, price_per_q: 1870, cost_per_acre: 14000, water_mm: 500,  season_days: 100, npk: [120, 60, 40]  },
  soybean:    { yield_q: 18, price_per_q: 3950, cost_per_acre: 16000, water_mm: 450,  season_days: 100, npk: [30,  60, 40]  },
  groundnut:  { yield_q: 22, price_per_q: 5550, cost_per_acre: 20000, water_mm: 500,  season_days: 120, npk: [25,  50, 45]  },
  potato:     { yield_q: 250,price_per_q: 800,  cost_per_acre: 30000, water_mm: 550,  season_days: 90,  npk: [180, 80, 100] },
  onion:      { yield_q: 200,price_per_q: 1200, cost_per_acre: 28000, water_mm: 400,  season_days: 120, npk: [100, 50, 60]  },
  tomato:     { yield_q: 300,price_per_q: 1000, cost_per_acre: 32000, water_mm: 600,  season_days: 110, npk: [120, 80, 80]  },
};

const SOIL_FACTORS = {
  alluvial: 1.0, black: 0.95, red: 0.85, laterite: 0.80, sandy: 0.70,
  clayey: 0.88, loamy: 0.98, saline: 0.60, peaty: 0.75,
};

const IRRIGATION_FACTORS = {
  drip: 1.10, sprinkler: 1.05, canal: 0.95, rainfed: 0.75, flood: 0.85, borewell: 1.0,
};

function soilFactor(s) { return SOIL_FACTORS[(s || '').toLowerCase()] || 0.85; }
function irrigFactor(i) { return IRRIGATION_FACTORS[(i || '').toLowerCase()] || 0.85; }

function ensureTable(tableName, ddl) {
  return pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${ddl})`);
}

async function ensureSchema() {
  await ensureTable('dt_farms', `
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    farm_name VARCHAR(200) NOT NULL,
    location_district VARCHAR(100),
    location_state VARCHAR(100),
    total_area_acres NUMERIC(10,2) DEFAULT 0,
    soil_type VARCHAR(50),
    irrigation_type VARCHAR(50),
    geo_lat NUMERIC(9,6),
    geo_lng NUMERIC(9,6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await ensureTable('dt_plots', `
    id SERIAL PRIMARY KEY,
    farm_id INT NOT NULL REFERENCES dt_farms(id) ON DELETE CASCADE,
    plot_name VARCHAR(200),
    area_acres NUMERIC(10,2) DEFAULT 0,
    soil_type VARCHAR(50),
    current_crop VARCHAR(100),
    planting_date DATE,
    expected_harvest DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await ensureTable('dt_sensors', `
    id SERIAL PRIMARY KEY,
    farm_id INT NOT NULL REFERENCES dt_farms(id) ON DELETE CASCADE,
    plot_id INT REFERENCES dt_plots(id) ON DELETE SET NULL,
    sensor_type VARCHAR(50) NOT NULL,
    sensor_name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await ensureTable('dt_sensor_data', `
    id SERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES dt_sensors(id) ON DELETE CASCADE,
    value NUMERIC(12,4),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await ensureTable('dt_alerts', `
    id SERIAL PRIMARY KEY,
    farm_id INT NOT NULL REFERENCES dt_farms(id) ON DELETE CASCADE,
    alert_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'medium',
    message TEXT,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

const schemaReady = ensureSchema().catch(() => {});

async function ready() { await schemaReady; }

// ═══════════════════════════════════════════════════════════════════
//  1. FARM CRUD
// ═══════════════════════════════════════════════════════════════════

// POST /farms — Create digital twin farm
router.post('/farms', async (req, res) => {
  try {
    await ready();
    const {
      user_id, farm_name, location_district, location_state,
      total_area_acres, soil_type, irrigation_type, geo_lat, geo_lng
    } = req.body;
    if (!user_id || !farm_name) {
      return res.status(400).json({ error: 'user_id and farm_name are required' });
    }
    const result = await pool.query(`
      INSERT INTO dt_farms (user_id, farm_name, location_district, location_state,
        total_area_acres, soil_type, irrigation_type, geo_lat, geo_lng)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [user_id, farm_name, location_district, location_state,
        total_area_acres || 0, soil_type, irrigation_type, geo_lat, geo_lng]);
    res.status(201).json({ farm: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farms — List user's twin farms
router.get('/farms', async (req, res) => {
  try {
    await ready();
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id query param required' });
    const result = await pool.query(
      'SELECT * FROM dt_farms WHERE user_id = $1 ORDER BY created_at DESC', [user_id]
    );
    res.json({ farms: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farms/:id — Complete twin state
router.get('/farms/:id', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    if (!farmR.rows.length) return res.status(404).json({ error: 'Farm not found' });

    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1 ORDER BY id', [id]);
    const sensorsR = await pool.query(`
      SELECT s.*, d.value AS latest_value, d.recorded_at AS latest_recorded_at
      FROM dt_sensors s
      LEFT JOIN LATERAL (
        SELECT value, recorded_at FROM dt_sensor_data
        WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1
      ) d ON true
      WHERE s.farm_id = $1 ORDER BY s.id
    `, [id]);

    res.json({
      farm: farmR.rows[0],
      plots: plotsR.rows,
      sensors: sensorsR.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /farms/:id — Update farm parameters
router.put('/farms/:id', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const {
      farm_name, location_district, location_state,
      total_area_acres, soil_type, irrigation_type, geo_lat, geo_lng
    } = req.body;
    const result = await pool.query(`
      UPDATE dt_farms SET
        farm_name = COALESCE($1, farm_name),
        location_district = COALESCE($2, location_district),
        location_state = COALESCE($3, location_state),
        total_area_acres = COALESCE($4, total_area_acres),
        soil_type = COALESCE($5, soil_type),
        irrigation_type = COALESCE($6, irrigation_type),
        geo_lat = COALESCE($7, geo_lat),
        geo_lng = COALESCE($8, geo_lng),
        updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [farm_name, location_district, location_state,
        total_area_acres, soil_type, irrigation_type, geo_lat, geo_lng, id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Farm not found' });
    res.json({ farm: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. PLOT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

// POST /farms/:id/plots — Add plot
router.post('/farms/:id/plots', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const { plot_name, area_acres, soil_type, current_crop, planting_date, expected_harvest } = req.body;
    if (!plot_name) return res.status(400).json({ error: 'plot_name is required' });
    const result = await pool.query(`
      INSERT INTO dt_plots (farm_id, plot_name, area_acres, soil_type, current_crop, planting_date, expected_harvest)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [id, plot_name, area_acres || 0, soil_type, current_crop, planting_date, expected_harvest]);
    res.status(201).json({ plot: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /farms/:id/plots/:plotId — Update plot
router.put('/farms/:id/plots/:plotId', async (req, res) => {
  try {
    await ready();
    const { plotId } = req.params;
    const { plot_name, area_acres, soil_type, current_crop, planting_date, expected_harvest } = req.body;
    const result = await pool.query(`
      UPDATE dt_plots SET
        plot_name = COALESCE($1, plot_name),
        area_acres = COALESCE($2, area_acres),
        soil_type = COALESCE($3, soil_type),
        current_crop = COALESCE($4, current_crop),
        planting_date = COALESCE($5, planting_date),
        expected_harvest = COALESCE($6, expected_harvest)
      WHERE id = $7 AND farm_id = $8 RETURNING *
    `, [plot_name, area_acres, soil_type, current_crop, planting_date, expected_harvest, plotId, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Plot not found' });
    res.json({ plot: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /farms/:id/plots/:plotId — Remove plot
router.delete('/farms/:id/plots/:plotId', async (req, res) => {
  try {
    await ready();
    const result = await pool.query(
      'DELETE FROM dt_plots WHERE id = $1 AND farm_id = $2 RETURNING id', [req.params.plotId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plot not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. SENSOR / IoT
// ═══════════════════════════════════════════════════════════════════

// POST /farms/:id/sensors — Register sensor
router.post('/farms/:id/sensors', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const { sensor_type, sensor_name, plot_id } = req.body;
    const validTypes = ['soil_moisture', 'temperature', 'humidity', 'rain_gauge', 'ndvi'];
    if (!sensor_type || !validTypes.includes(sensor_type)) {
      return res.status(400).json({ error: `sensor_type must be one of: ${validTypes.join(', ')}` });
    }
    const result = await pool.query(`
      INSERT INTO dt_sensors (farm_id, plot_id, sensor_type, sensor_name)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [id, plot_id || null, sensor_type, sensor_name || sensor_type]);
    res.status(201).json({ sensor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /farms/:id/sensors/:sensorId/data — Ingest reading
router.post('/farms/:id/sensors/:sensorId/data', async (req, res) => {
  try {
    await ready();
    const { sensorId } = req.params;
    const { value, recorded_at } = req.body;
    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'value is required' });
    }
    const result = await pool.query(`
      INSERT INTO dt_sensor_data (sensor_id, value, recorded_at)
      VALUES ($1,$2, COALESCE($3::timestamptz, NOW())) RETURNING *
    `, [sensorId, value, recorded_at || null]);
    res.status(201).json({ reading: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farms/:id/sensors — All sensors with latest readings
router.get('/farms/:id/sensors', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, d.value AS latest_value, d.recorded_at AS latest_recorded_at
      FROM dt_sensors s
      LEFT JOIN LATERAL (
        SELECT value, recorded_at FROM dt_sensor_data
        WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1
      ) d ON true
      WHERE s.farm_id = $1 ORDER BY s.id
    `, [id]);
    res.json({ sensors: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. SIMULATION ENGINE (deterministic)
// ═══════════════════════════════════════════════════════════════════

// POST /farms/:id/simulate/crop — Crop yield simulation
router.post('/farms/:id/simulate/crop', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const { crop_type, planting_date, area } = req.body;
    const crop = (crop_type || '').toLowerCase();
    const profile = CROP_PROFILES[crop];
    if (!profile) {
      return res.status(400).json({ error: `Unknown crop. Supported: ${Object.keys(CROP_PROFILES).join(', ')}` });
    }

    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    const farm = farmR.rows[0] || { soil_type: 'loamy', irrigation_type: 'canal' };
    const acres = parseFloat(area) || parseFloat(farm.total_area_acres) || 1;

    const sf = soilFactor(farm.soil_type);
    const irf = irrigFactor(farm.irrigation_type);
    const adjustedYield = Math.round(profile.yield_q * sf * irf * 100) / 100;
    const totalYield = Math.round(adjustedYield * acres * 100) / 100;
    const revenue = Math.round(totalYield * profile.price_per_q);
    const cost = Math.round(profile.cost_per_acre * acres);
    const profit = revenue - cost;
    const risk_score = Math.round(Math.max(0, Math.min(100, (1 - sf * irf) * 100)));

    const pDate = planting_date ? new Date(planting_date) : new Date();
    const harvestDate = new Date(pDate.getTime() + profile.season_days * 86400000);

    res.json({
      simulation: 'crop_yield',
      inputs: { crop_type: crop, area_acres: acres, soil_type: farm.soil_type, irrigation_type: farm.irrigation_type },
      results: {
        predicted_yield_quintals: totalYield,
        yield_per_acre: adjustedYield,
        base_yield_per_acre: profile.yield_q,
        revenue_inr: revenue,
        cost_inr: cost,
        profit_inr: profit,
        risk_score,
        timeline: {
          planting: pDate.toISOString().slice(0, 10),
          harvest: harvestDate.toISOString().slice(0, 10),
          season_days: profile.season_days
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /farms/:id/simulate/weather-impact
router.post('/farms/:id/simulate/weather-impact', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const { scenario } = req.body;
    const validScenarios = ['drought', 'flood', 'heatwave'];
    if (!scenario || !validScenarios.includes(scenario)) {
      return res.status(400).json({ error: `scenario must be one of: ${validScenarios.join(', ')}` });
    }

    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    const farm = farmR.rows[0] || {};

    const impactFactors = {
      drought:  { rice: 0.40, wheat: 0.70, cotton: 0.65, sugarcane: 0.35, maize: 0.55, soybean: 0.60, groundnut: 0.55, potato: 0.50, onion: 0.60, tomato: 0.45 },
      flood:    { rice: 0.80, wheat: 0.30, cotton: 0.25, sugarcane: 0.70, maize: 0.35, soybean: 0.30, groundnut: 0.20, potato: 0.25, onion: 0.20, tomato: 0.30 },
      heatwave: { rice: 0.65, wheat: 0.50, cotton: 0.75, sugarcane: 0.60, maize: 0.50, soybean: 0.55, groundnut: 0.60, potato: 0.40, onion: 0.55, tomato: 0.45 },
    };

    const factors = impactFactors[scenario];
    const impacts = Object.entries(CROP_PROFILES).map(([crop, prof]) => {
      const survival = factors[crop] || 0.50;
      const yieldAfter = Math.round(prof.yield_q * survival * 100) / 100;
      const lossPercent = Math.round((1 - survival) * 100);
      return {
        crop,
        base_yield: prof.yield_q,
        projected_yield: yieldAfter,
        yield_loss_percent: lossPercent,
        revenue_impact_per_acre: Math.round((prof.yield_q - yieldAfter) * prof.price_per_q),
        risk_level: lossPercent > 50 ? 'critical' : lossPercent > 30 ? 'high' : lossPercent > 15 ? 'medium' : 'low'
      };
    });

    res.json({
      simulation: 'weather_impact',
      scenario,
      farm_id: parseInt(id),
      farm_soil: farm.soil_type || 'unknown',
      impacts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /farms/:id/simulate/irrigation — Irrigation optimization
router.post('/farms/:id/simulate/irrigation', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    const farm = farmR.rows[0] || {};
    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1', [id]);
    const plots = plotsR.rows.length ? plotsR.rows : [{ plot_name: 'Default', area_acres: farm.total_area_acres || 1, current_crop: 'rice' }];

    const currentType = (farm.irrigation_type || 'flood').toLowerCase();
    const efficiencyMap = { drip: 0.90, sprinkler: 0.75, canal: 0.55, flood: 0.40, rainfed: 0.30, borewell: 0.65 };
    const currentEff = efficiencyMap[currentType] || 0.50;
    const optimalEff = 0.90; // drip

    const schedule = plots.map(p => {
      const crop = (p.current_crop || 'rice').toLowerCase();
      const prof = CROP_PROFILES[crop] || CROP_PROFILES.rice;
      const acres = parseFloat(p.area_acres) || 1;
      const totalWaterNeeded = prof.water_mm * acres;
      const currentUsage = Math.round(totalWaterNeeded / currentEff);
      const optimalUsage = Math.round(totalWaterNeeded / optimalEff);
      const intervalDays = Math.max(1, Math.round(prof.season_days / (totalWaterNeeded / 25)));
      return {
        plot: p.plot_name,
        crop,
        area_acres: acres,
        water_requirement_mm: prof.water_mm,
        current_usage_liters: currentUsage,
        optimal_usage_liters: optimalUsage,
        savings_liters: currentUsage - optimalUsage,
        irrigation_interval_days: intervalDays,
        best_time: '06:00-08:00'
      };
    });

    const totalCurrent = schedule.reduce((s, p) => s + p.current_usage_liters, 0);
    const totalOptimal = schedule.reduce((s, p) => s + p.optimal_usage_liters, 0);
    const savingsPercent = totalCurrent > 0 ? Math.round((1 - totalOptimal / totalCurrent) * 100) : 0;

    res.json({
      simulation: 'irrigation_optimization',
      current_method: currentType,
      recommended_method: 'drip',
      water_savings_percent: savingsPercent,
      schedule
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /farms/:id/simulate/fertilizer — Fertilizer recommendation
router.post('/farms/:id/simulate/fertilizer', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const { soil_data } = req.body;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    const farm = farmR.rows[0] || {};
    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1', [id]);
    const plots = plotsR.rows.length ? plotsR.rows : [{ plot_name: 'Default', area_acres: farm.total_area_acres || 1, current_crop: 'rice', soil_type: farm.soil_type }];

    const soilN = (soil_data && soil_data.nitrogen) || 40;
    const soilP = (soil_data && soil_data.phosphorus) || 20;
    const soilK = (soil_data && soil_data.potassium) || 30;
    const soilPH = (soil_data && soil_data.ph) || 6.5;

    const recommendations = plots.map(p => {
      const crop = (p.current_crop || 'rice').toLowerCase();
      const prof = CROP_PROFILES[crop] || CROP_PROFILES.rice;
      const acres = parseFloat(p.area_acres) || 1;
      const reqN = Math.max(0, prof.npk[0] - soilN);
      const reqP = Math.max(0, prof.npk[1] - soilP);
      const reqK = Math.max(0, prof.npk[2] - soilK);

      const urea_kg = Math.round(reqN / 0.46 * acres);
      const dap_kg = Math.round(reqP / 0.46 * acres);
      const mop_kg = Math.round(reqK / 0.60 * acres);
      const costPerKg = { urea: 6, dap: 27, mop: 17 };
      const totalCost = urea_kg * costPerKg.urea + dap_kg * costPerKg.dap + mop_kg * costPerKg.mop;

      return {
        plot: p.plot_name,
        crop,
        area_acres: acres,
        soil_input: { nitrogen: soilN, phosphorus: soilP, potassium: soilK, ph: soilPH },
        optimal_npk_kg_per_acre: { N: prof.npk[0], P: prof.npk[1], K: prof.npk[2] },
        deficit: { N: reqN, P: reqP, K: reqK },
        fertilizer_plan: {
          urea_kg, dap_kg, mop_kg,
          total_cost_inr: totalCost
        },
        schedule: [
          { stage: 'Basal (at sowing)', urea_pct: 33, dap_pct: 100, mop_pct: 50 },
          { stage: 'First top dress (30 days)', urea_pct: 33, dap_pct: 0, mop_pct: 0 },
          { stage: 'Second top dress (60 days)', urea_pct: 34, dap_pct: 0, mop_pct: 50 }
        ],
        ph_advice: soilPH < 5.5 ? 'Apply lime (2-4 tonnes/acre)' : soilPH > 8.0 ? 'Apply gypsum (1-2 tonnes/acre)' : 'pH is within acceptable range'
      };
    });

    res.json({
      simulation: 'fertilizer_recommendation',
      recommendations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. ANALYTICS
// ═══════════════════════════════════════════════════════════════════

// GET /farms/:id/health-score
router.get('/farms/:id/health-score', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    if (!farmR.rows.length) return res.status(404).json({ error: 'Farm not found' });
    const farm = farmR.rows[0];

    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1', [id]);
    const sensorsR = await pool.query(`
      SELECT s.sensor_type, d.value FROM dt_sensors s
      LEFT JOIN LATERAL (
        SELECT value FROM dt_sensor_data WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1
      ) d ON true
      WHERE s.farm_id = $1
    `, [id]);

    // Soil score (based on soil type rating)
    const soilScore = Math.round(soilFactor(farm.soil_type) * 100);

    // Water score (based on irrigation type)
    const waterScore = Math.round(irrigFactor(farm.irrigation_type) * 100);

    // Crop diversity score
    const crops = [...new Set(plotsR.rows.map(p => p.current_crop).filter(Boolean))];
    const cropScore = Math.min(100, crops.length * 25);

    // Sensor health — use readings if available
    let sensorScore = 50; // default when no sensors
    const readings = sensorsR.rows.filter(s => s.value !== null);
    if (readings.length > 0) {
      const scores = readings.map(r => {
        const v = parseFloat(r.value);
        if (r.sensor_type === 'soil_moisture') return v >= 30 && v <= 70 ? 100 : v >= 20 && v <= 80 ? 70 : 40;
        if (r.sensor_type === 'temperature') return v >= 20 && v <= 35 ? 100 : v >= 15 && v <= 40 ? 70 : 40;
        if (r.sensor_type === 'humidity') return v >= 40 && v <= 80 ? 100 : v >= 30 && v <= 90 ? 70 : 40;
        return 70;
      });
      sensorScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // Pest risk (deterministic from soil + season)
    const month = new Date().getMonth();
    const pestRisk = (month >= 5 && month <= 9) ? 30 : 10; // monsoon = higher risk
    const pestScore = 100 - pestRisk;

    const overall = Math.round(
      soilScore * 0.20 + waterScore * 0.20 + cropScore * 0.20 + sensorScore * 0.20 + pestScore * 0.20
    );

    res.json({
      farm_id: parseInt(id),
      health_score: overall,
      breakdown: { soil: soilScore, water: waterScore, crop_diversity: cropScore, sensor_health: sensorScore, pest_resistance: pestScore },
      grade: overall >= 80 ? 'Excellent' : overall >= 60 ? 'Good' : overall >= 40 ? 'Fair' : 'Needs Attention'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farms/:id/timeline
router.get('/farms/:id/timeline', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    if (!farmR.rows.length) return res.status(404).json({ error: 'Farm not found' });

    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1 ORDER BY planting_date', [id]);
    const alertsR = await pool.query(
      'SELECT * FROM dt_alerts WHERE farm_id = $1 ORDER BY created_at DESC LIMIT 20', [id]
    );

    const events = [];
    events.push({ type: 'farm_created', date: farmR.rows[0].created_at, description: 'Digital twin created' });

    plotsR.rows.forEach(p => {
      if (p.planting_date) {
        events.push({ type: 'planting', date: p.planting_date, description: `Planted ${p.current_crop || 'crop'} on ${p.plot_name}` });
      }
      if (p.expected_harvest) {
        const harvestDate = new Date(p.expected_harvest);
        const now = new Date();
        events.push({
          type: harvestDate > now ? 'predicted_harvest' : 'harvest',
          date: p.expected_harvest,
          description: `${harvestDate > now ? 'Expected' : ''} harvest of ${p.current_crop || 'crop'} from ${p.plot_name}`
        });
      }
    });

    alertsR.rows.forEach(a => {
      events.push({ type: 'alert', date: a.created_at, description: a.message, severity: a.severity });
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ farm_id: parseInt(id), timeline: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farms/:id/comparison — Current vs optimal
router.get('/farms/:id/comparison', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    if (!farmR.rows.length) return res.status(404).json({ error: 'Farm not found' });
    const farm = farmR.rows[0];

    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1', [id]);
    const plots = plotsR.rows.length ? plotsR.rows : [{ plot_name: 'Default', area_acres: farm.total_area_acres || 1, current_crop: 'rice' }];

    const comparisons = plots.map(p => {
      const crop = (p.current_crop || 'rice').toLowerCase();
      const prof = CROP_PROFILES[crop] || CROP_PROFILES.rice;
      const acres = parseFloat(p.area_acres) || 1;
      const sf = soilFactor(p.soil_type || farm.soil_type);
      const irf = irrigFactor(farm.irrigation_type);

      const currentYield = Math.round(prof.yield_q * sf * irf * acres * 100) / 100;
      const optimalYield = Math.round(prof.yield_q * 1.0 * 1.10 * acres * 100) / 100; // best soil + drip
      const gap = Math.round((optimalYield - currentYield) * 100) / 100;
      const gapPercent = Math.round((gap / optimalYield) * 100);

      return {
        plot: p.plot_name,
        crop,
        current: { yield_quintals: currentYield, revenue_inr: Math.round(currentYield * prof.price_per_q) },
        optimal: { yield_quintals: optimalYield, revenue_inr: Math.round(optimalYield * prof.price_per_q) },
        gap_quintals: gap,
        gap_percent: gapPercent,
        recommendations: [
          irf < 1.05 ? 'Upgrade to drip irrigation for +10-15% yield' : null,
          sf < 0.90 ? 'Improve soil health with organic matter and mulching' : null,
          'Apply recommended NPK doses in split applications',
          'Use certified high-yielding variety seeds'
        ].filter(Boolean)
      };
    });

    res.json({ farm_id: parseInt(id), comparisons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /farms/:id/carbon-footprint
router.get('/farms/:id/carbon-footprint', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    if (!farmR.rows.length) return res.status(404).json({ error: 'Farm not found' });
    const farm = farmR.rows[0];

    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1', [id]);
    const plots = plotsR.rows.length ? plotsR.rows : [{ plot_name: 'Default', area_acres: farm.total_area_acres || 1, current_crop: 'rice' }];

    // kg CO2e per acre per season (deterministic)
    const carbonPerAcre = {
      rice: 2500, wheat: 800, cotton: 1200, sugarcane: 1800, maize: 700,
      soybean: 400, groundnut: 500, potato: 900, onion: 600, tomato: 1000
    };
    const irrigCarbonFactor = { drip: 0.70, sprinkler: 0.80, canal: 1.0, flood: 1.30, rainfed: 0.50, borewell: 1.10 };
    const iCF = irrigCarbonFactor[(farm.irrigation_type || '').toLowerCase()] || 1.0;

    let totalEmission = 0;
    const breakdown = plots.map(p => {
      const crop = (p.current_crop || 'rice').toLowerCase();
      const acres = parseFloat(p.area_acres) || 1;
      const base = carbonPerAcre[crop] || 800;
      const emission = Math.round(base * acres * iCF);
      totalEmission += emission;
      return { plot: p.plot_name, crop, area_acres: acres, emission_kg_co2e: emission };
    });

    const tips = [
      'Switch to drip irrigation to reduce water-pumping emissions by ~30%',
      'Practice zero-tillage to sequester 300-500 kg CO2/acre/year',
      'Use neem-coated urea to reduce N2O emissions by 10-15%',
      'Incorporate crop residues instead of burning to avoid 1.5 tonnes CO2/acre',
      'Plant nitrogen-fixing cover crops between seasons'
    ];

    res.json({
      farm_id: parseInt(id),
      total_emission_kg_co2e: totalEmission,
      emission_per_acre: plots.length ? Math.round(totalEmission / plots.reduce((s, p) => s + (parseFloat(p.area_acres) || 1), 0)) : 0,
      breakdown,
      reduction_tips: tips
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. ALERTS
// ═══════════════════════════════════════════════════════════════════

// GET /farms/:id/alerts — Active alerts (generates deterministic alerts)
router.get('/farms/:id/alerts', async (req, res) => {
  try {
    await ready();
    const { id } = req.params;
    const farmR = await pool.query('SELECT * FROM dt_farms WHERE id = $1', [id]);
    if (!farmR.rows.length) return res.status(404).json({ error: 'Farm not found' });
    const farm = farmR.rows[0];

    // Return persisted alerts
    const existing = await pool.query(
      'SELECT * FROM dt_alerts WHERE farm_id = $1 AND is_dismissed = false ORDER BY created_at DESC', [id]
    );

    if (existing.rows.length > 0) {
      return res.json({ farm_id: parseInt(id), alerts: existing.rows });
    }

    // Seed deterministic alerts based on farm state
    const plotsR = await pool.query('SELECT * FROM dt_plots WHERE farm_id = $1', [id]);
    const alerts = [];
    const month = new Date().getMonth();

    if (month >= 5 && month <= 9) {
      alerts.push({ type: 'weather', severity: 'high', message: 'Monsoon season: Heavy rainfall expected. Ensure drainage channels are clear.' });
    }
    if ((farm.irrigation_type || '').toLowerCase() === 'rainfed') {
      alerts.push({ type: 'irrigation', severity: 'medium', message: 'Rainfed farming detected. Consider installing drip irrigation for water security.' });
    }
    if (soilFactor(farm.soil_type) < 0.80) {
      alerts.push({ type: 'soil', severity: 'medium', message: `Soil type (${farm.soil_type}) has lower fertility. Apply organic compost to improve yield.` });
    }

    plotsR.rows.forEach(p => {
      if (p.expected_harvest) {
        const daysToHarvest = Math.round((new Date(p.expected_harvest) - new Date()) / 86400000);
        if (daysToHarvest >= 0 && daysToHarvest <= 14) {
          alerts.push({ type: 'harvest', severity: 'high', message: `Harvest window for ${p.current_crop} on ${p.plot_name} in ${daysToHarvest} days.` });
        }
      }
      if (month >= 6 && month <= 8 && ['rice', 'cotton'].includes((p.current_crop || '').toLowerCase())) {
        alerts.push({ type: 'pest', severity: 'medium', message: `Pest risk for ${p.current_crop} on ${p.plot_name}. Monitor for bollworm/stem borer.` });
      }
    });

    // Persist seeded alerts
    for (const a of alerts) {
      await pool.query(
        'INSERT INTO dt_alerts (farm_id, alert_type, severity, message) VALUES ($1,$2,$3,$4)',
        [id, a.type, a.severity, a.message]
      );
    }

    const finalR = await pool.query(
      'SELECT * FROM dt_alerts WHERE farm_id = $1 AND is_dismissed = false ORDER BY created_at DESC', [id]
    );
    res.json({ farm_id: parseInt(id), alerts: finalR.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /farms/:id/alerts/:alertId/dismiss
router.put('/farms/:id/alerts/:alertId/dismiss', async (req, res) => {
  try {
    await ready();
    const { alertId } = req.params;
    const result = await pool.query(
      'UPDATE dt_alerts SET is_dismissed = true WHERE id = $1 AND farm_id = $2 RETURNING *',
      [alertId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json({ dismissed: true, alert: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
