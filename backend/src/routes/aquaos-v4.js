const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ════════════════════════════════════════════════════════════════
// CULTURE UNIT MANAGEMENT (Ponds, RAS Tanks, Cages, Biofloc, Hatcheries)
// Farm → Culture Units → Production Cycles
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v4/culture-units — create culture unit
router.post('/culture-units', authMiddleware, async (req, res) => {
  try {
    const { farm_id, unit_code, unit_type, species, area_acres, volume_m3, depth_m,
            tank_count, cage_count, water_source, salinity_type, stocking_density_per_m3, notes } = req.body;
    if (!farm_id || !unit_code || !unit_type) return res.status(400).json({ error: 'farm_id, unit_code, unit_type required' });
    const validTypes = ['pond', 'ras_tank', 'cage', 'biofloc', 'hatchery', 'nursery', 'raceway'];
    if (!validTypes.includes(unit_type)) return res.status(400).json({ error: `Invalid unit_type. Valid: ${validTypes.join(', ')}` });
    // Verify farm ownership
    const farm = await query('SELECT id FROM aqua_farms WHERE id=$1 AND farmer_id=$2', [farm_id, req.user.id]);
    if (!farm.rows.length) return res.status(404).json({ error: 'Farm not found' });
    const result = await query(`
      INSERT INTO aqua_culture_units (id, farm_id, farmer_id, unit_code, unit_type, species, area_acres,
        volume_m3, depth_m, tank_count, cage_count, water_source, salinity_type, stocking_density_per_m3, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [uuidv4(), farm_id, req.user.id, unit_code, unit_type, species, area_acres,
        volume_m3, depth_m, tank_count || 1, cage_count || 1, water_source, salinity_type || 'freshwater', stocking_density_per_m3, notes]);
    res.status(201).json({ unit: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/culture-units — list farmer's culture units
router.get('/culture-units', authMiddleware, async (req, res) => {
  try {
    const { farm_id, unit_type, status } = req.query;
    let conditions = ['cu.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (farm_id) { conditions.push(`cu.farm_id = $${i++}`); params.push(farm_id); }
    if (unit_type) { conditions.push(`cu.unit_type = $${i++}`); params.push(unit_type); }
    if (status) { conditions.push(`cu.status = $${i++}`); params.push(status); }
    const result = await query(`
      SELECT cu.*, f.farm_name,
             (SELECT COUNT(*) FROM aqua_production_cycles pc WHERE pc.culture_unit_id = cu.id AND pc.status = 'active') AS active_cycles
      FROM aqua_culture_units cu
      LEFT JOIN aqua_farms f ON f.id = cu.farm_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY cu.unit_type, cu.unit_code
    `, params);
    res.json({ units: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v4/culture-units/:id — update culture unit
router.patch('/culture-units/:id', authMiddleware, async (req, res) => {
  try {
    const { species, status, current_stock_count, stocking_date, expected_harvest, notes } = req.body;
    const result = await query(`
      UPDATE aqua_culture_units SET
        species = COALESCE($1, species), status = COALESCE($2, status),
        current_stock_count = COALESCE($3, current_stock_count),
        stocking_date = COALESCE($4, stocking_date), expected_harvest = COALESCE($5, expected_harvest),
        notes = COALESCE($6, notes), updated_at = NOW()
      WHERE id = $7 AND farmer_id = $8 RETURNING *
    `, [species, status, current_stock_count, stocking_date, expected_harvest, notes, req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Culture unit not found' });
    res.json({ unit: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/aquaos-v4/culture-units/:id
router.delete('/culture-units/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query('DELETE FROM aqua_culture_units WHERE id=$1 AND farmer_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Culture unit not found' });
    res.json({ message: 'Culture unit deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PRODUCTION CYCLE MANAGEMENT (Full lifecycle tracking per unit)
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v4/production-cycles — start production cycle
router.post('/production-cycles', authMiddleware, async (req, res) => {
  try {
    const { culture_unit_id, species, stocking_date, seed_count, seed_supplier, seed_cost, avg_seed_weight_g, notes } = req.body;
    if (!culture_unit_id || !species || !seed_count) return res.status(400).json({ error: 'culture_unit_id, species, seed_count required' });
    const unit = await query('SELECT id FROM aqua_culture_units WHERE id=$1 AND farmer_id=$2', [culture_unit_id, req.user.id]);
    if (!unit.rows.length) return res.status(404).json({ error: 'Culture unit not found' });
    // Update unit status
    await query('UPDATE aqua_culture_units SET species=$1, stocking_date=$2, current_stock_count=$3, status=$4 WHERE id=$5',
      [species, stocking_date || new Date().toISOString().split('T')[0], seed_count, 'active', culture_unit_id]);
    const result = await query(`
      INSERT INTO aqua_production_cycles (id, culture_unit_id, farmer_id, species, stocking_date, seed_count, seed_supplier, seed_cost, avg_seed_weight_g, current_count, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), culture_unit_id, req.user.id, species, stocking_date || new Date().toISOString().split('T')[0],
        seed_count, seed_supplier, seed_cost, avg_seed_weight_g, seed_count, notes]);
    res.status(201).json({ cycle: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/production-cycles — list cycles
router.get('/production-cycles', authMiddleware, async (req, res) => {
  try {
    const { culture_unit_id, status } = req.query;
    let conditions = ['pc.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (culture_unit_id) { conditions.push(`pc.culture_unit_id = $${i++}`); params.push(culture_unit_id); }
    if (status) { conditions.push(`pc.status = $${i++}`); params.push(status); }
    const result = await query(`
      SELECT pc.*, cu.unit_code, cu.unit_type, cu.area_acres, f.farm_name,
             EXTRACT(EPOCH FROM (NOW() - pc.stocking_date))/86400 AS days_of_culture
      FROM aqua_production_cycles pc
      JOIN aqua_culture_units cu ON cu.id = pc.culture_unit_id
      LEFT JOIN aqua_farms f ON f.id = cu.farm_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY pc.stocking_date DESC
    `, params);
    res.json({ cycles: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v4/production-cycles/:id — update cycle (sampling, harvest)
router.patch('/production-cycles/:id', authMiddleware, async (req, res) => {
  try {
    const { status, current_count, current_avg_weight_g, total_feed_kg, total_feed_cost,
            total_mortality, harvest_date, harvest_qty_kg, harvest_avg_weight_g, harvest_price_per_kg, notes } = req.body;
    const cycle = await query('SELECT * FROM aqua_production_cycles WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (!cycle.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const c = cycle.rows[0];

    // Compute KPIs if we have enough data
    let fcr = c.fcr, sgr = c.sgr, survivalRate = c.survival_rate_pct;
    const avgWeight = current_avg_weight_g || c.current_avg_weight_g;
    const feedKg = total_feed_kg || c.total_feed_kg;
    const seedWeight = c.avg_seed_weight_g || 1;
    const seedCount = c.seed_count;
    const currCount = current_count || c.current_count || seedCount;

    if (avgWeight && seedWeight && feedKg && currCount) {
      const totalWeightGain = (currCount * avgWeight - seedCount * seedWeight) / 1000; // kg
      fcr = totalWeightGain > 0 ? (feedKg / totalWeightGain).toFixed(2) : null;
    }
    if (avgWeight && seedWeight && c.stocking_date) {
      const days = Math.max(1, (Date.now() - new Date(c.stocking_date).getTime()) / 86400000);
      sgr = ((Math.log(avgWeight) - Math.log(seedWeight)) / days * 100).toFixed(3);
    }
    if (currCount && seedCount) {
      survivalRate = ((currCount / seedCount) * 100).toFixed(1);
    }

    // Compute profit metrics
    let totalRevenue = c.total_revenue;
    let totalExpenses = c.total_expenses;
    if (harvest_qty_kg && harvest_price_per_kg) {
      totalRevenue = harvest_qty_kg * harvest_price_per_kg;
    }
    if (total_feed_cost) totalExpenses = parseFloat(total_feed_cost) + (c.seed_cost || 0);
    const profit = totalRevenue - totalExpenses;
    const unit = await query('SELECT area_acres FROM aqua_culture_units WHERE id=$1', [c.culture_unit_id]);
    const profitPerAcre = unit.rows[0]?.area_acres > 0 ? (profit / unit.rows[0].area_acres).toFixed(0) : 0;

    const result = await query(`
      UPDATE aqua_production_cycles SET
        status = COALESCE($1, status), current_count = COALESCE($2, current_count),
        current_avg_weight_g = COALESCE($3, current_avg_weight_g),
        total_feed_kg = COALESCE($4, total_feed_kg), total_feed_cost = COALESCE($5, total_feed_cost),
        total_mortality = COALESCE($6, total_mortality),
        harvest_date = COALESCE($7, harvest_date), harvest_qty_kg = COALESCE($8, harvest_qty_kg),
        harvest_avg_weight_g = COALESCE($9, harvest_avg_weight_g), harvest_price_per_kg = COALESCE($10, harvest_price_per_kg),
        fcr = $11, sgr = $12, survival_rate_pct = $13,
        total_revenue = $14, total_expenses = $15, profit = $16, profit_per_acre = $17,
        notes = COALESCE($18, notes), updated_at = NOW()
      WHERE id = $19 RETURNING *
    `, [status, current_count, current_avg_weight_g, total_feed_kg, total_feed_cost,
        total_mortality, harvest_date, harvest_qty_kg, harvest_avg_weight_g, harvest_price_per_kg,
        fcr, sgr, survivalRate, totalRevenue, totalExpenses, profit, profitPerAcre,
        notes, req.params.id]);
    res.json({ cycle: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// MULTI-SPECIES CONFIGURATION
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v4/species — list all species configs
router.get('/species', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM aqua_species_config';
    let params = [];
    if (category) { sql += ' WHERE species_category = $1'; params.push(category); }
    sql += ' ORDER BY species_category, species_name';
    const result = await query(sql, params);
    res.json({ species: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/species/:name — get species details with optimal parameters
router.get('/species/:name', async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_species_config WHERE species_name ILIKE $1', [`%${req.params.name}%`]);
    if (!result.rows.length) return res.status(404).json({ error: 'Species not found' });
    res.json({ species: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// HARVEST OPTIMIZER — Price-based optimal harvest timing
// "When should I harvest for maximum revenue?"
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v4/harvest-optimizer/:pondId — optimal harvest recommendation
router.get('/harvest-optimizer/:pondId', authMiddleware, async (req, res) => {
  try {
    const pond = await query(`
      SELECT p.*, cc.seed_count, cc.stocking_date AS cycle_start,
             EXTRACT(EPOCH FROM (NOW() - cc.stocking_date))/86400 AS doc
      FROM ponds p
      LEFT JOIN crop_cycles cc ON cc.pond_id = p.id AND cc.status = 'active'
      WHERE p.id = $1 AND p.farmer_id = $2
    `, [req.params.pondId, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const p = pond.rows[0];
    const doc = Math.round(p.doc || 0);
    const avgWeight = p.avg_weight_g || 0;
    const survivalPct = p.survival_pct || 80;
    const currentCount = Math.round((p.seed_count || p.stocked_count || 0) * (survivalPct / 100));

    // Get price tiers for this species
    const prices = await query(`
      SELECT * FROM aqua_harvest_prices
      WHERE species ILIKE $1 AND effective_date <= CURRENT_DATE
      ORDER BY price_per_kg DESC
    `, [`%${p.species}%`]);

    // Get species growth config
    const speciesConfig = await query('SELECT * FROM aqua_species_config WHERE species_name ILIKE $1', [`%${p.species}%`]);
    const config = speciesConfig.rows[0] || { growth_rate_g_per_day: 0.25, typical_culture_days: 120 };
    const growthRate = parseFloat(config.growth_rate_g_per_day) || 0.25;

    // Calculate harvest scenarios
    const scenarios = [];
    for (const tier of prices.rows) {
      const targetWeight = tier.min_weight_g ? parseFloat(tier.min_weight_g) : null;
      if (!targetWeight) continue;
      const daysToTarget = avgWeight > 0 ? Math.max(0, Math.ceil((targetWeight - avgWeight) / growthRate)) : null;
      const harvestDate = daysToTarget !== null ? new Date(Date.now() + daysToTarget * 86400000).toISOString().split('T')[0] : null;
      const estimatedYieldKg = currentCount > 0 ? (currentCount * targetWeight / 1000) : 0;
      const estimatedRevenue = estimatedYieldKg * parseFloat(tier.price_per_kg);
      // Feed cost projection (assume daily feed = 3-5% biomass)
      const dailyFeedPct = 0.04;
      const additionalFeedKg = daysToTarget ? (currentCount * (avgWeight + targetWeight) / 2 / 1000 * dailyFeedPct * daysToTarget) : 0;
      const feedCostPerKg = 60; // Average feed cost ₹60/kg
      const additionalFeedCost = additionalFeedKg * feedCostPerKg;

      scenarios.push({
        size_category: tier.size_category,
        size_count: tier.size_count,
        target_weight_g: targetWeight,
        price_per_kg: parseFloat(tier.price_per_kg),
        days_to_reach: daysToTarget,
        estimated_harvest_date: harvestDate,
        estimated_yield_kg: Math.round(estimatedYieldKg),
        estimated_revenue: Math.round(estimatedRevenue),
        additional_feed_cost: Math.round(additionalFeedCost),
        net_value: Math.round(estimatedRevenue - additionalFeedCost),
        market: tier.market_name
      });
    }

    // Sort by net value (best option first)
    scenarios.sort((a, b) => b.net_value - a.net_value);

    // Optimal recommendation
    const optimal = scenarios[0] || null;

    res.json({
      pond: { id: p.id, pond_code: p.pond_code, species: p.species, area_acres: p.area_acres },
      current_state: { doc, avg_weight_g: avgWeight, survival_pct: survivalPct, current_count: currentCount },
      growth_rate_g_per_day: growthRate,
      scenarios,
      recommendation: optimal ? {
        action: optimal.days_to_reach <= 0 ? 'harvest_now' : optimal.days_to_reach <= 7 ? 'prepare_harvest' : 'continue_growing',
        optimal_size: optimal.size_category,
        days_remaining: optimal.days_to_reach,
        target_date: optimal.estimated_harvest_date,
        expected_revenue: optimal.estimated_revenue,
        message: optimal.days_to_reach <= 0
          ? `Harvest NOW at ${optimal.size_category} for ₹${optimal.price_per_kg}/kg (₹${(optimal.estimated_revenue/100000).toFixed(1)} lakh revenue)`
          : `Wait ${optimal.days_to_reach} more days to reach ${optimal.size_category} at ₹${optimal.price_per_kg}/kg (net ₹${(optimal.net_value/100000).toFixed(1)} lakh)`
      } : null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/harvest-prices — current price tiers
router.get('/harvest-prices', async (req, res) => {
  try {
    const { species } = req.query;
    let conditions = ['effective_date >= CURRENT_DATE - INTERVAL \'7 days\''];
    let params = [];
    if (species) { conditions.push('species ILIKE $1'); params.push(`%${species}%`); }
    const result = await query(`
      SELECT * FROM aqua_harvest_prices WHERE ${conditions.join(' AND ')} ORDER BY species, price_per_kg DESC
    `, params);
    res.json({ prices: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ACRE-BASED ANALYTICS (Production/Feed/Revenue per acre)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v4/analytics/per-acre — comprehensive per-acre metrics
router.get('/analytics/per-acre', authMiddleware, async (req, res) => {
  try {
    // Farm-level aggregation
    const farmMetrics = await query(`
      SELECT f.id, f.farm_name, f.total_area_acres,
             COUNT(p.id) AS pond_count,
             SUM(p.area_acres) AS total_pond_acres,
             AVG(p.survival_pct) AS avg_survival,
             AVG(p.avg_weight_g) AS avg_weight_g
      FROM aqua_farms f
      LEFT JOIN ponds p ON p.farm_id = f.id AND p.status = 'active'
      WHERE f.farmer_id = $1
      GROUP BY f.id
    `, [req.user.id]);

    // Revenue/expense per acre from completed cycles
    const cycleMetrics = await query(`
      SELECT p.farm_id,
             COALESCE(SUM(cc.harvest_quantity_kg), 0) AS total_harvest_kg,
             COALESCE(SUM(p.area_acres), 0) AS total_acres,
             COALESCE(SUM(e.total_exp), 0) AS total_expenses,
             COALESCE(SUM(r.total_rev), 0) AS total_revenue
      FROM ponds p
      LEFT JOIN crop_cycles cc ON cc.pond_id = p.id AND cc.status = 'harvested'
      LEFT JOIN (SELECT pond_id, SUM(amount) AS total_exp FROM aqua_expenses GROUP BY pond_id) e ON e.pond_id = p.id
      LEFT JOIN (SELECT pond_id, SUM(amount) AS total_rev FROM aqua_revenue GROUP BY pond_id) r ON r.pond_id = p.id
      WHERE p.farmer_id = $1
      GROUP BY p.farm_id
    `, [req.user.id]);

    // Feed efficiency metrics
    const feedMetrics = await query(`
      SELECT p.farm_id,
             COALESCE(SUM(fl.quantity_kg), 0) AS total_feed_kg,
             COALESCE(SUM(fl.cost), 0) AS total_feed_cost,
             COALESCE(SUM(p.area_acres), 0) AS total_acres
      FROM ponds p
      LEFT JOIN feed_logs fl ON fl.pond_id = p.id
      WHERE p.farmer_id = $1
      GROUP BY p.farm_id
    `, [req.user.id]);

    const analytics = farmMetrics.rows.map(farm => {
      const cycles = cycleMetrics.rows.find(c => c.farm_id === farm.id) || {};
      const feed = feedMetrics.rows.find(f => f.farm_id === farm.id) || {};
      const acres = parseFloat(farm.total_area_acres) || parseFloat(farm.total_pond_acres) || 1;
      const totalHarvest = parseFloat(cycles.total_harvest_kg) || 0;
      const totalRevenue = parseFloat(cycles.total_revenue) || 0;
      const totalExpenses = parseFloat(cycles.total_expenses) || 0;
      const totalFeed = parseFloat(feed.total_feed_kg) || 0;
      const totalFeedCost = parseFloat(feed.total_feed_cost) || 0;

      return {
        farm_id: farm.id,
        farm_name: farm.farm_name,
        total_area_acres: acres,
        pond_count: parseInt(farm.pond_count),
        metrics: {
          production_per_acre_kg: (totalHarvest / acres).toFixed(0),
          revenue_per_acre: (totalRevenue / acres).toFixed(0),
          expense_per_acre: (totalExpenses / acres).toFixed(0),
          profit_per_acre: ((totalRevenue - totalExpenses) / acres).toFixed(0),
          feed_per_acre_kg: (totalFeed / acres).toFixed(0),
          feed_cost_per_acre: (totalFeedCost / acres).toFixed(0),
          avg_survival_pct: farm.avg_survival ? parseFloat(farm.avg_survival).toFixed(1) : null,
          avg_weight_g: farm.avg_weight_g ? parseFloat(farm.avg_weight_g).toFixed(1) : null
        }
      };
    });

    res.json({ analytics });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/analytics/farm-summary — executive summary (like farmer dashboard)
router.get('/analytics/farm-summary', authMiddleware, async (req, res) => {
  try {
    const summary = await query(`
      SELECT
        (SELECT COUNT(*) FROM aqua_farms WHERE farmer_id = $1) AS total_farms,
        (SELECT SUM(total_area_acres) FROM aqua_farms WHERE farmer_id = $1) AS total_acres,
        (SELECT COUNT(*) FROM ponds WHERE farmer_id = $1 AND status = 'active') AS active_ponds,
        (SELECT COUNT(*) FROM aqua_culture_units WHERE farmer_id = $1 AND status = 'active') AS active_culture_units,
        (SELECT SUM(stocked_count) FROM ponds WHERE farmer_id = $1 AND status = 'active') AS total_stock,
        (SELECT COALESCE(SUM(amount), 0) FROM aqua_expenses WHERE farmer_id = $1 AND expense_date >= CURRENT_DATE - INTERVAL '30 days') AS expenses_30d,
        (SELECT COALESCE(SUM(amount), 0) FROM aqua_revenue WHERE farmer_id = $1 AND revenue_date >= CURRENT_DATE - INTERVAL '30 days') AS revenue_30d,
        (SELECT COUNT(*) FROM crop_cycles cc JOIN ponds p ON p.id = cc.pond_id WHERE p.farmer_id = $1 AND cc.status = 'active' AND cc.expected_harvest_date <= CURRENT_DATE + INTERVAL '14 days') AS upcoming_harvests
    `, [req.user.id]);
    res.json({ summary: summary.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// IoT DEVICE MANAGEMENT & ALERTS
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v4/iot-devices — register IoT device
router.post('/iot-devices', authMiddleware, async (req, res) => {
  try {
    const { pond_id, culture_unit_id, device_type, device_name, device_serial, manufacturer, parameters, installed_at, notes } = req.body;
    if (!device_type) return res.status(400).json({ error: 'device_type required' });
    const validTypes = ['ph_sensor', 'do_sensor', 'temperature_sensor', 'salinity_sensor', 'ammonia_sensor', 'multi_parameter', 'aerator_controller', 'feeder', 'camera', 'level_sensor'];
    if (!validTypes.includes(device_type)) return res.status(400).json({ error: `Invalid device_type. Valid: ${validTypes.join(', ')}` });
    const result = await query(`
      INSERT INTO aqua_iot_devices (id, farmer_id, pond_id, culture_unit_id, device_type, device_name, device_serial, manufacturer, parameters, installed_at, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, pond_id || null, culture_unit_id || null, device_type, device_name, device_serial, manufacturer, parameters || [], installed_at, notes]);
    res.status(201).json({ device: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/iot-devices
router.get('/iot-devices', authMiddleware, async (req, res) => {
  try {
    const { pond_id, device_type } = req.query;
    let conditions = ['d.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (pond_id) { conditions.push(`d.pond_id = $${i++}`); params.push(pond_id); }
    if (device_type) { conditions.push(`d.device_type = $${i++}`); params.push(device_type); }
    const result = await query(`
      SELECT d.*, p.pond_code FROM aqua_iot_devices d
      LEFT JOIN ponds p ON p.id = d.pond_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.device_type, d.device_name
    `, params);
    res.json({ devices: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v4/iot-devices/:id/reading — ingest sensor reading + trigger alerts
router.post('/iot-devices/:id/reading', authMiddleware, async (req, res) => {
  try {
    const { parameter, value } = req.body;
    if (!parameter || value === undefined) return res.status(400).json({ error: 'parameter and value required' });
    const device = await query('SELECT * FROM aqua_iot_devices WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (!device.rows.length) return res.status(404).json({ error: 'Device not found' });
    const d = device.rows[0];

    // Update last reading timestamp
    await query('UPDATE aqua_iot_devices SET last_reading_at=NOW() WHERE id=$1', [req.params.id]);

    // Update pond water quality if applicable
    if (d.pond_id) {
      const paramMap = { 'ph': 'ph_level', 'temperature': 'temperature_c', 'dissolved_oxygen': 'dissolved_o2', 'salinity': 'salinity_ppt', 'ammonia': 'ammonia_ppm' };
      const column = paramMap[parameter];
      if (column) {
        await query(`UPDATE ponds SET ${column}=$1 WHERE id=$2`, [value, d.pond_id]);
      }
      // Log to water quality table
      const insertMap = { 'ph': 'ph_level', 'temperature': 'temperature_c', 'dissolved_oxygen': 'dissolved_o2', 'salinity': 'salinity_ppt', 'ammonia': 'ammonia_ppm' };
      if (insertMap[parameter]) {
        await query(`INSERT INTO water_quality_logs (id, pond_id, ${insertMap[parameter]}, notes) VALUES ($1,$2,$3,$4)`,
          [uuidv4(), d.pond_id, value, `Auto-logged from IoT device: ${d.device_name}`]);
      }
    }

    // Check thresholds and generate alerts
    let alert = null;
    if (d.alert_enabled && d.pond_id) {
      const pond = await query('SELECT species FROM ponds WHERE id=$1', [d.pond_id]);
      const species = pond.rows[0]?.species;
      if (species) {
        const config = await query('SELECT * FROM aqua_species_config WHERE species_name ILIKE $1', [`%${species}%`]);
        const sp = config.rows[0];
        if (sp) {
          let alertMsg = null, severity = 'warning', threshold = null;
          if (parameter === 'ph' && (value < sp.optimal_ph_min || value > sp.optimal_ph_max)) {
            alertMsg = `pH ${value} is outside optimal range (${sp.optimal_ph_min}-${sp.optimal_ph_max}) for ${species}`;
            threshold = value < sp.optimal_ph_min ? sp.optimal_ph_min : sp.optimal_ph_max;
            severity = Math.abs(value - (value < sp.optimal_ph_min ? sp.optimal_ph_min : sp.optimal_ph_max)) > 1 ? 'critical' : 'warning';
          }
          if (parameter === 'dissolved_oxygen' && value < sp.optimal_do_min) {
            alertMsg = `DO ${value} mg/L is below minimum (${sp.optimal_do_min}) for ${species} — activate aerator!`;
            threshold = sp.optimal_do_min;
            severity = value < sp.optimal_do_min - 1 ? 'critical' : 'warning';
          }
          if (parameter === 'temperature' && (value < sp.optimal_temp_min || value > sp.optimal_temp_max)) {
            alertMsg = `Temperature ${value}°C outside range (${sp.optimal_temp_min}-${sp.optimal_temp_max}) for ${species}`;
            threshold = value < sp.optimal_temp_min ? sp.optimal_temp_min : sp.optimal_temp_max;
          }
          if (parameter === 'ammonia' && value > 0.1) {
            alertMsg = `Ammonia ${value} ppm is elevated — potential toxicity risk`;
            threshold = 0.1;
            severity = value > 0.5 ? 'critical' : 'warning';
          }
          if (alertMsg) {
            const alertResult = await query(`
              INSERT INTO aqua_iot_alerts (id, device_id, farmer_id, pond_id, alert_type, parameter, value, threshold, severity, message)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
            `, [uuidv4(), d.id, req.user.id, d.pond_id, 'threshold_breach', parameter, value, threshold, severity, alertMsg]);
            alert = alertResult.rows[0];
          }
        }
      }
    }

    res.json({ status: 'recorded', parameter, value, alert });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/iot-alerts — get recent alerts
router.get('/iot-alerts', authMiddleware, async (req, res) => {
  try {
    const { severity, acknowledged } = req.query;
    let conditions = ['a.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (severity) { conditions.push(`a.severity = $${i++}`); params.push(severity); }
    if (acknowledged !== undefined) { conditions.push(`a.acknowledged = $${i++}`); params.push(acknowledged === 'true'); }
    const result = await query(`
      SELECT a.*, d.device_name, d.device_type, p.pond_code
      FROM aqua_iot_alerts a
      JOIN aqua_iot_devices d ON d.id = a.device_id
      LEFT JOIN ponds p ON p.id = a.pond_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC LIMIT 50
    `, params);
    res.json({ alerts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v4/iot-alerts/:id/acknowledge
router.patch('/iot-alerts/:id/acknowledge', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE aqua_iot_alerts SET acknowledged=TRUE, acknowledged_at=NOW()
      WHERE id=$1 AND farmer_id=$2 RETURNING *
    `, [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// TRUST & VERIFICATION LAYER (GST, FSSAI, MPEDA)
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v4/verifications — submit verification document
router.post('/verifications', authMiddleware, async (req, res) => {
  try {
    const { doc_type, doc_number, doc_name, doc_url, expires_at } = req.body;
    if (!doc_type) return res.status(400).json({ error: 'doc_type required' });
    const validTypes = ['gst', 'fssai', 'mpeda', 'pan', 'aadhaar', 'bank_account', 'caa_license', 'iec', 'apeda'];
    if (!validTypes.includes(doc_type)) return res.status(400).json({ error: `Invalid doc_type. Valid: ${validTypes.join(', ')}` });
    // Check duplicate
    const existing = await query('SELECT id FROM aqua_verifications WHERE user_id=$1 AND doc_type=$2 AND status != $3',
      [req.user.id, doc_type, 'rejected']);
    if (existing.rows.length) return res.status(400).json({ error: `${doc_type} already submitted` });
    const result = await query(`
      INSERT INTO aqua_verifications (id, user_id, doc_type, doc_number, doc_name, doc_url, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.user.id, doc_type, doc_number, doc_name, doc_url, expires_at]);
    res.status(201).json({ verification: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/verifications — user's verification status
router.get('/verifications', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_verifications WHERE user_id = $1 ORDER BY created_at DESC
    `, [req.user.id]);
    const verified = result.rows.filter(v => v.status === 'verified');
    const trustLevel = verified.length >= 3 ? 'premium' : verified.length >= 1 ? 'basic' : 'unverified';
    res.json({ verifications: result.rows, trust_level: trustLevel, verified_count: verified.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v4/verifications/user/:userId — check another user's verification (for buyers/sellers)
router.get('/verifications/user/:userId', async (req, res) => {
  try {
    const result = await query(`
      SELECT doc_type, status, verified_at FROM aqua_verifications
      WHERE user_id = $1 AND status = 'verified'
    `, [req.params.userId]);
    const badges = result.rows.map(v => v.doc_type);
    const trustLevel = badges.length >= 3 ? 'premium' : badges.length >= 1 ? 'basic' : 'unverified';
    res.json({ user_id: req.params.userId, trust_level: trustLevel, badges, verified_docs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FARM PERFORMANCE KPIs (FCR, SGR, Survival Rate per pond)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v4/kpi/farm — overall farm KPIs
router.get('/kpi/farm', authMiddleware, async (req, res) => {
  try {
    const ponds = await query(`
      SELECT p.id, p.pond_code, p.species, p.area_acres, p.stocked_count, p.survival_pct,
             p.avg_weight_g, p.stocking_date,
             EXTRACT(EPOCH FROM (NOW() - p.stocking_date))/86400 AS doc,
             (SELECT COALESCE(SUM(quantity_kg), 0) FROM feed_logs WHERE pond_id = p.id) AS total_feed_kg,
             (SELECT COALESCE(SUM(cost), 0) FROM feed_logs WHERE pond_id = p.id) AS total_feed_cost,
             (SELECT COALESCE(SUM(count), 0) FROM mortality_logs WHERE pond_id = p.id) AS total_mortality,
             (SELECT avg_weight_g FROM growth_samples WHERE pond_id = p.id ORDER BY sampled_at ASC LIMIT 1) AS initial_weight_g
      FROM ponds p
      WHERE p.farmer_id = $1 AND p.status = 'active'
      ORDER BY p.pond_code
    `, [req.user.id]);

    const kpis = ponds.rows.map(p => {
      const currentCount = Math.round((p.stocked_count || 0) * ((p.survival_pct || 80) / 100));
      const avgWeight = parseFloat(p.avg_weight_g) || 0;
      const initialWeight = parseFloat(p.initial_weight_g) || 1;
      const totalFeed = parseFloat(p.total_feed_kg) || 0;
      const doc = Math.round(parseFloat(p.doc) || 0);
      const seedCount = p.stocked_count || 0;

      // FCR = Total Feed / Total Weight Gain
      const totalWeightGainKg = (currentCount * avgWeight - seedCount * initialWeight) / 1000;
      const fcr = totalWeightGainKg > 0 ? (totalFeed / totalWeightGainKg).toFixed(2) : null;

      // SGR = (ln(Wf) - ln(Wi)) / t × 100
      const sgr = doc > 0 && avgWeight > 0 && initialWeight > 0
        ? ((Math.log(avgWeight) - Math.log(initialWeight)) / doc * 100).toFixed(3)
        : null;

      // Survival Rate = (Nf / Ni) × 100
      const survivalRate = seedCount > 0 ? ((currentCount / seedCount) * 100).toFixed(1) : null;

      return {
        pond_id: p.id,
        pond_code: p.pond_code,
        species: p.species,
        area_acres: p.area_acres,
        days_of_culture: doc,
        kpis: {
          fcr: fcr ? parseFloat(fcr) : null,
          sgr: sgr ? parseFloat(sgr) : null,
          survival_rate_pct: survivalRate ? parseFloat(survivalRate) : null,
          total_feed_kg: totalFeed,
          total_feed_cost: parseFloat(p.total_feed_cost),
          current_biomass_kg: (currentCount * avgWeight / 1000).toFixed(1),
          feed_cost_per_kg_fish: avgWeight > 0 && totalFeed > 0 ? (parseFloat(p.total_feed_cost) / (currentCount * avgWeight / 1000)).toFixed(1) : null
        }
      };
    });

    res.json({ pond_kpis: kpis });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
