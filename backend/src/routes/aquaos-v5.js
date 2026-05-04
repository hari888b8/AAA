const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ════════════════════════════════════════════════════════════════
// ADVANCED KPI ENGINE — Interval-Based Growth Metrics
// FCR, SGR (per interval), ADG, Biomass Tracking
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v5/growth-sample — record growth sampling with auto KPI calculation
router.post('/growth-sample', authMiddleware, async (req, res) => {
  try {
    const { cycle_id, culture_unit_id, sample_date, avg_weight_g, sample_count,
            min_weight_g, max_weight_g, current_count, feed_since_last_kg, notes } = req.body;
    if (!cycle_id || !avg_weight_g) return res.status(400).json({ error: 'cycle_id, avg_weight_g required' });

    // Get cycle info
    const cycle = await query('SELECT * FROM aqua_production_cycles WHERE id=$1 AND farmer_id=$2', [cycle_id, req.user.id]);
    if (!cycle.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const c = cycle.rows[0];

    // Calculate days of culture
    const sampleDt = sample_date || new Date().toISOString().split('T')[0];
    const doc = Math.round((new Date(sampleDt) - new Date(c.stocking_date)) / 86400000);

    // Get previous sample for interval calculations
    const prevSample = await query(`
      SELECT * FROM aqua_growth_intervals WHERE cycle_id=$1 ORDER BY sample_date DESC LIMIT 1
    `, [cycle_id]);
    const prev = prevSample.rows[0];

    // Calculate interval number
    const intervalNum = prev ? prev.interval_number + 1 : 1;

    // Calculate SGR for this interval: SGR = (ln(Wf) - ln(Wi)) / t × 100
    let sgrInterval = null;
    let adgInterval = null;
    let fcrInterval = null;
    const prevWeight = prev ? parseFloat(prev.avg_weight_g) : parseFloat(c.avg_seed_weight_g || 1);
    const prevDate = prev ? new Date(prev.sample_date) : new Date(c.stocking_date);
    const daysSinceLast = Math.max(1, Math.round((new Date(sampleDt) - prevDate) / 86400000));

    if (prevWeight > 0 && avg_weight_g > 0) {
      sgrInterval = ((Math.log(avg_weight_g) - Math.log(prevWeight)) / daysSinceLast * 100);
      adgInterval = (avg_weight_g - prevWeight) / daysSinceLast;
    }

    // FCR for this interval
    const feedSinceLast = feed_since_last_kg || 0;
    const curCount = current_count || c.current_count || c.seed_count;
    if (feedSinceLast > 0 && prevWeight > 0) {
      const weightGainKg = (curCount * avg_weight_g - curCount * prevWeight) / 1000;
      if (weightGainKg > 0) fcrInterval = feedSinceLast / weightGainKg;
    }

    // Calculate biomass
    const biomassKg = (curCount * avg_weight_g) / 1000;

    // Standard deviation (rough estimate from min/max if provided)
    const stdDev = (min_weight_g && max_weight_g) ? (max_weight_g - min_weight_g) / 4 : null;

    const result = await query(`
      INSERT INTO aqua_growth_intervals (id, cycle_id, farmer_id, culture_unit_id, interval_number,
        sample_date, avg_weight_g, sample_count, min_weight_g, max_weight_g, std_deviation,
        days_of_culture, biomass_kg, current_count, sgr_interval, adg_g_per_day, fcr_interval,
        feed_since_last_kg, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *
    `, [uuidv4(), cycle_id, req.user.id, culture_unit_id || c.culture_unit_id, intervalNum,
        sampleDt, avg_weight_g, sample_count || 30, min_weight_g, max_weight_g, stdDev,
        doc, biomassKg, curCount, sgrInterval, adgInterval, fcrInterval, feedSinceLast, notes]);

    // Update cycle with latest weight
    await query(`UPDATE aqua_production_cycles SET current_avg_weight_g=$1, current_count=$2, updated_at=NOW() WHERE id=$3`,
      [avg_weight_g, curCount, cycle_id]);

    res.status(201).json({
      sample: result.rows[0],
      metrics: {
        interval_sgr: sgrInterval ? parseFloat(sgrInterval.toFixed(4)) : null,
        interval_adg: adgInterval ? parseFloat(adgInterval.toFixed(4)) : null,
        interval_fcr: fcrInterval ? parseFloat(fcrInterval.toFixed(3)) : null,
        biomass_kg: parseFloat(biomassKg.toFixed(2)),
        days_of_culture: doc
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/growth-history/:cycleId — full growth history with KPIs per interval
router.get('/growth-history/:cycleId', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_growth_intervals
      WHERE cycle_id=$1 AND farmer_id=$2
      ORDER BY sample_date ASC
    `, [req.params.cycleId, req.user.id]);

    // Compute cumulative metrics
    const history = result.rows;
    let cumulativeFeed = 0;
    const enriched = history.map((s, idx) => {
      cumulativeFeed += parseFloat(s.feed_since_last_kg || 0);
      return {
        ...s,
        cumulative_feed_kg: parseFloat(cumulativeFeed.toFixed(2)),
        growth_pct_from_start: idx > 0 && history[0].avg_weight_g > 0
          ? (((s.avg_weight_g - history[0].avg_weight_g) / history[0].avg_weight_g) * 100).toFixed(1)
          : '0'
      };
    });

    res.json({ growth_history: enriched, total_samples: enriched.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/kpi-dashboard/:cycleId — comprehensive KPI dashboard
router.get('/kpi-dashboard/:cycleId', authMiddleware, async (req, res) => {
  try {
    const cycle = await query(`
      SELECT pc.*, cu.unit_code, cu.unit_type, cu.area_acres, f.farm_name
      FROM aqua_production_cycles pc
      LEFT JOIN aqua_culture_units cu ON cu.id = pc.culture_unit_id
      LEFT JOIN aqua_farms f ON f.id = cu.farm_id
      WHERE pc.id=$1 AND pc.farmer_id=$2
    `, [req.params.cycleId, req.user.id]);
    if (!cycle.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const c = cycle.rows[0];

    const doc = Math.round((Date.now() - new Date(c.stocking_date).getTime()) / 86400000);
    const currentCount = c.current_count || c.seed_count;
    const avgWeight = parseFloat(c.current_avg_weight_g || 0);
    const seedWeight = parseFloat(c.avg_seed_weight_g || 1);
    const totalFeed = parseFloat(c.total_feed_kg || 0);

    // Cumulative KPIs
    const totalWeightGainKg = (currentCount * avgWeight - c.seed_count * seedWeight) / 1000;
    const fcr = totalWeightGainKg > 0 ? totalFeed / totalWeightGainKg : null;
    const sgr = doc > 0 && avgWeight > 0 && seedWeight > 0
      ? (Math.log(avgWeight) - Math.log(seedWeight)) / doc * 100 : null;
    const adg = doc > 0 ? (avgWeight - seedWeight) / doc : null;
    const survivalRate = c.seed_count > 0 ? (currentCount / c.seed_count) * 100 : null;
    const currentBiomassKg = currentCount * avgWeight / 1000;

    // Get growth trend (last 5 samples)
    const samples = await query(`
      SELECT sample_date, avg_weight_g, sgr_interval, adg_g_per_day, fcr_interval, biomass_kg
      FROM aqua_growth_intervals WHERE cycle_id=$1
      ORDER BY sample_date DESC LIMIT 5
    `, [req.params.cycleId]);

    // Species benchmark
    const speciesConfig = await query('SELECT * FROM aqua_species_config WHERE species_name ILIKE $1', [`%${c.species}%`]);
    const benchmark = speciesConfig.rows[0];

    // Compute performance vs benchmark
    let performance = {};
    if (benchmark) {
      performance = {
        fcr_vs_target: fcr && benchmark.target_fcr ? ((fcr / parseFloat(benchmark.target_fcr)) * 100).toFixed(0) + '%' : null,
        growth_vs_expected: adg && benchmark.growth_rate_g_per_day ? ((adg / parseFloat(benchmark.growth_rate_g_per_day)) * 100).toFixed(0) + '%' : null,
        days_remaining: benchmark.typical_culture_days ? Math.max(0, benchmark.typical_culture_days - doc) : null
      };
    }

    res.json({
      cycle_info: {
        cycle_id: c.id, species: c.species, unit_code: c.unit_code,
        farm_name: c.farm_name, stocking_date: c.stocking_date,
        days_of_culture: doc, seed_count: c.seed_count, current_count: currentCount
      },
      kpis: {
        fcr: fcr ? parseFloat(fcr.toFixed(3)) : null,
        sgr_pct_per_day: sgr ? parseFloat(sgr.toFixed(4)) : null,
        adg_g_per_day: adg ? parseFloat(adg.toFixed(4)) : null,
        survival_rate_pct: survivalRate ? parseFloat(survivalRate.toFixed(1)) : null,
        current_biomass_kg: parseFloat(currentBiomassKg.toFixed(2)),
        total_feed_kg: totalFeed,
        feed_cost_per_kg_production: totalFeed > 0 && currentBiomassKg > 0
          ? parseFloat((parseFloat(c.total_feed_cost || 0) / currentBiomassKg).toFixed(1)) : null
      },
      growth_trend: samples.rows.reverse(),
      benchmark: benchmark ? {
        target_fcr: parseFloat(benchmark.target_fcr),
        expected_growth_g_per_day: parseFloat(benchmark.growth_rate_g_per_day),
        typical_culture_days: benchmark.typical_culture_days,
        harvest_size_range: `${benchmark.harvest_size_min_g}-${benchmark.harvest_size_max_g}g`
      } : null,
      performance_vs_benchmark: performance
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PREDICTIVE GROWTH MODEL — Von Bertalanffy + Bio-Economic
// Predicts growth trajectory, optimal harvest date, max profit
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v5/predict-growth/:cycleId — predict future growth
router.get('/predict-growth/:cycleId', authMiddleware, async (req, res) => {
  try {
    const cycle = await query(`
      SELECT pc.*, cu.area_acres FROM aqua_production_cycles pc
      LEFT JOIN aqua_culture_units cu ON cu.id = pc.culture_unit_id
      WHERE pc.id=$1 AND pc.farmer_id=$2
    `, [req.params.cycleId, req.user.id]);
    if (!cycle.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const c = cycle.rows[0];

    // Get species configuration for growth parameters
    const speciesConfig = await query('SELECT * FROM aqua_species_config WHERE species_name ILIKE $1', [`%${c.species}%`]);
    const config = speciesConfig.rows[0] || {
      growth_rate_g_per_day: 0.25, typical_culture_days: 120,
      harvest_size_min_g: 20, harvest_size_max_g: 40, target_fcr: 1.5
    };

    // Get growth history for model calibration
    const samples = await query(`
      SELECT avg_weight_g, days_of_culture FROM aqua_growth_intervals
      WHERE cycle_id=$1 ORDER BY days_of_culture ASC
    `, [req.params.cycleId]);

    const doc = Math.round((Date.now() - new Date(c.stocking_date).getTime()) / 86400000);
    const currentWeight = parseFloat(c.current_avg_weight_g || 0);
    const seedWeight = parseFloat(c.avg_seed_weight_g || 1);
    const currentCount = c.current_count || c.seed_count;
    const survivalRate = c.seed_count > 0 ? currentCount / c.seed_count : 0.8;

    // ─── VON BERTALANFFY GROWTH MODEL ───
    // W(t) = W_inf * (1 - b * e^(-K*t))^3
    // Simplified: W(t) = W_inf * (1 - e^(-K*(t-t0)))^n
    const W_inf = parseFloat(config.harvest_size_max_g) * 1.5; // Asymptotic weight
    const K = 0.015; // Growth coefficient (calibrate from data if available)
    const t0 = -5; // Theoretical age at zero weight

    // Calibrate K from actual data if we have samples
    let calibratedK = K;
    if (samples.rows.length >= 2 && currentWeight > seedWeight) {
      // Simple calibration: K = -ln(1 - (W/W_inf)^(1/3)) / (t - t0)
      const ratio = Math.pow(currentWeight / W_inf, 1/3);
      if (ratio < 1) {
        calibratedK = -Math.log(1 - ratio) / (doc - t0);
      }
    }

    // Predict future weights
    const predictions = [];
    const maxPredictDays = parseInt(config.typical_culture_days) + 30;
    for (let day = doc; day <= maxPredictDays; day += 7) {
      const predictedWeight = W_inf * Math.pow(1 - Math.exp(-calibratedK * (day - t0)), 3);
      const projectedCount = Math.round(c.seed_count * survivalRate * Math.pow(0.999, day - doc)); // slight ongoing mortality
      const predictedBiomassKg = projectedCount * predictedWeight / 1000;
      // Confidence interval (±15% for near term, ±30% for far term)
      const uncertaintyPct = 0.15 + (day - doc) * 0.001;
      predictions.push({
        day,
        date: new Date(new Date(c.stocking_date).getTime() + day * 86400000).toISOString().split('T')[0],
        predicted_weight_g: parseFloat(predictedWeight.toFixed(2)),
        predicted_count: projectedCount,
        predicted_biomass_kg: parseFloat(predictedBiomassKg.toFixed(1)),
        confidence_low_kg: parseFloat((predictedBiomassKg * (1 - uncertaintyPct)).toFixed(1)),
        confidence_high_kg: parseFloat((predictedBiomassKg * (1 + uncertaintyPct)).toFixed(1))
      });
    }

    // ─── BIO-ECONOMIC MODEL — Find Optimal Harvest ───
    // Revenue = Biomass × Price(size)
    // Cost = Feed_cost + Other_costs (increasing daily)
    // Profit = Revenue - Total_Cost
    // Find day where marginal revenue = marginal cost
    const prices = await query(`
      SELECT min_weight_g, price_per_kg FROM aqua_harvest_prices
      WHERE species ILIKE $1 ORDER BY min_weight_g ASC
    `, [`%${c.species}%`]);

    const feedCostPerKgPerDay = 60 * 0.04; // ₹60/kg feed, 4% body weight/day
    const otherDailyCost = (parseFloat(c.area_acres || 1)) * 200; // ₹200/acre/day (labor, electricity)
    const totalFixedCost = parseFloat(c.seed_cost || 0) + parseFloat(c.total_feed_cost || 0);

    let maxProfit = -Infinity;
    let optimalDay = doc;
    let optimalWeight = currentWeight;
    const profitCurve = [];

    for (const pred of predictions) {
      // Find price for this weight
      let pricePerKg = 200; // default
      for (const p of prices.rows) {
        if (pred.predicted_weight_g >= parseFloat(p.min_weight_g)) {
          pricePerKg = parseFloat(p.price_per_kg);
        }
      }
      const revenue = pred.predicted_biomass_kg * pricePerKg;
      const additionalFeedCost = feedCostPerKgPerDay * pred.predicted_biomass_kg * (pred.day - doc);
      const additionalOtherCost = otherDailyCost * (pred.day - doc);
      const totalCost = totalFixedCost + additionalFeedCost + additionalOtherCost;
      const profit = revenue - totalCost;

      profitCurve.push({
        day: pred.day,
        date: pred.date,
        weight_g: pred.predicted_weight_g,
        biomass_kg: pred.predicted_biomass_kg,
        price_per_kg: pricePerKg,
        revenue: Math.round(revenue),
        total_cost: Math.round(totalCost),
        profit: Math.round(profit)
      });

      if (profit > maxProfit) {
        maxProfit = profit;
        optimalDay = pred.day;
        optimalWeight = pred.predicted_weight_g;
      }
    }

    // Store prediction
    const optimalDate = new Date(new Date(c.stocking_date).getTime() + optimalDay * 86400000).toISOString().split('T')[0];
    await query(`
      INSERT INTO aqua_growth_predictions (id, cycle_id, farmer_id, model_type, prediction_date,
        predicted_weight_g, predicted_biomass_kg, confidence_low_kg, confidence_high_kg,
        optimal_harvest_date, optimal_harvest_weight_g, max_profit_date, max_profit_amount, model_params)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT DO NOTHING
    `, [uuidv4(), req.params.cycleId, req.user.id, 'von_bertalanffy', optimalDate,
        optimalWeight, predictions[predictions.length - 1]?.predicted_biomass_kg || 0,
        predictions[predictions.length - 1]?.confidence_low_kg || 0,
        predictions[predictions.length - 1]?.confidence_high_kg || 0,
        optimalDate, optimalWeight, optimalDate, maxProfit,
        JSON.stringify({ W_inf, K: calibratedK, t0, survival_rate: survivalRate })]);

    res.json({
      model: 'von_bertalanffy_bio_economic',
      parameters: { W_inf, K: parseFloat(calibratedK.toFixed(5)), t0, survival_rate: parseFloat(survivalRate.toFixed(3)) },
      current_state: {
        day: doc, weight_g: currentWeight, count: currentCount,
        biomass_kg: parseFloat((currentCount * currentWeight / 1000).toFixed(1))
      },
      growth_predictions: predictions,
      profit_optimization: {
        optimal_harvest_day: optimalDay,
        optimal_harvest_date: optimalDate,
        optimal_weight_g: parseFloat(optimalWeight.toFixed(1)),
        max_profit: Math.round(maxProfit),
        profit_curve: profitCurve
      },
      production_range: {
        low_estimate_kg: predictions.length > 0 ? predictions[predictions.length - 1].confidence_low_kg : 0,
        expected_kg: predictions.length > 0 ? predictions[predictions.length - 1].predicted_biomass_kg : 0,
        high_estimate_kg: predictions.length > 0 ? predictions[predictions.length - 1].confidence_high_kg : 0
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// RULE-BASED ALERT ENGINE
// Simple threshold checks — no AI required
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v5/alerts/check — evaluate alerts for a cycle
router.post('/alerts/check', authMiddleware, async (req, res) => {
  try {
    const { cycle_id, water_params, daily_mortality, daily_feed_kg } = req.body;
    if (!cycle_id) return res.status(400).json({ error: 'cycle_id required' });

    const cycle = await query('SELECT * FROM aqua_production_cycles WHERE id=$1 AND farmer_id=$2', [cycle_id, req.user.id]);
    if (!cycle.rows.length) return res.status(404).json({ error: 'Cycle not found' });
    const c = cycle.rows[0];

    // Get applicable rules (system rules + farmer's custom rules)
    const rules = await query(`
      SELECT * FROM aqua_alert_rules
      WHERE is_active = true AND (farmer_id IS NULL OR farmer_id = $1)
        AND (species IS NULL OR species ILIKE $2)
    `, [req.user.id, `%${c.species}%`]);

    const triggeredAlerts = [];

    for (const rule of rules.rows) {
      let actualValue = null;
      let triggered = false;

      // Water quality checks
      if (rule.rule_category === 'water_quality' && water_params) {
        actualValue = water_params[rule.parameter];
        if (actualValue !== undefined && actualValue !== null) {
          triggered = evaluateCondition(actualValue, rule.condition_op, parseFloat(rule.threshold_value));
        }
      }

      // Mortality check
      if (rule.rule_category === 'mortality' && daily_mortality !== undefined) {
        if (rule.parameter === 'daily_mortality_pct') {
          actualValue = c.current_count > 0 ? (daily_mortality / c.current_count * 100) : 0;
          triggered = evaluateCondition(actualValue, rule.condition_op, parseFloat(rule.threshold_value));
        }
      }

      // Feed check
      if (rule.rule_category === 'feed') {
        if (rule.parameter === 'fcr' && c.fcr) {
          actualValue = parseFloat(c.fcr);
          triggered = evaluateCondition(actualValue, rule.condition_op, parseFloat(rule.threshold_value));
        }
      }

      // Growth check
      if (rule.rule_category === 'growth') {
        if (rule.parameter === 'sgr' && c.sgr) {
          actualValue = parseFloat(c.sgr);
          triggered = evaluateCondition(actualValue, rule.condition_op, parseFloat(rule.threshold_value));
        }
      }

      if (triggered && actualValue !== null) {
        const message = (rule.message_template || '').replace('{value}', actualValue.toFixed(2));
        const alertId = uuidv4();
        await query(`
          INSERT INTO aqua_triggered_alerts (id, rule_id, farmer_id, cycle_id, culture_unit_id,
            alert_category, severity, title, message, parameter, actual_value, threshold_value)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `, [alertId, rule.id, req.user.id, cycle_id, c.culture_unit_id,
            rule.rule_category, rule.severity, rule.rule_name, message,
            rule.parameter, actualValue, rule.threshold_value]);
        triggeredAlerts.push({
          id: alertId, rule_name: rule.rule_name, category: rule.rule_category,
          severity: rule.severity, parameter: rule.parameter,
          actual_value: parseFloat(actualValue.toFixed(3)),
          threshold: parseFloat(rule.threshold_value), message
        });
      }
    }

    // Update mortality if provided
    if (daily_mortality > 0) {
      const newCount = Math.max(0, (c.current_count || c.seed_count) - daily_mortality);
      const newMortality = (c.total_mortality || 0) + daily_mortality;
      await query('UPDATE aqua_production_cycles SET current_count=$1, total_mortality=$2, updated_at=NOW() WHERE id=$3',
        [newCount, newMortality, cycle_id]);
    }

    res.json({
      alerts_triggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
      status: triggeredAlerts.some(a => a.severity === 'critical') ? 'critical'
        : triggeredAlerts.length > 0 ? 'warning' : 'normal'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function evaluateCondition(value, op, threshold) {
  switch (op) {
    case '<': return value < threshold;
    case '>': return value > threshold;
    case '<=': return value <= threshold;
    case '>=': return value >= threshold;
    case '=': return value === threshold;
    case '!=': return value !== threshold;
    default: return false;
  }
}

// GET /api/aquaos-v5/alerts — get farmer's alert history
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const { severity, acknowledged, limit } = req.query;
    let conditions = ['farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (severity) { conditions.push(`severity = $${i++}`); params.push(severity); }
    if (acknowledged !== undefined) { conditions.push(`acknowledged = $${i++}`); params.push(acknowledged === 'true'); }
    const result = await query(`
      SELECT * FROM aqua_triggered_alerts
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC LIMIT $${i}
    `, [...params, parseInt(limit) || 50]);
    res.json({ alerts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v5/alerts/:id/acknowledge — acknowledge alert
router.patch('/alerts/:id/acknowledge', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE aqua_triggered_alerts SET acknowledged=true, acknowledged_at=NOW()
      WHERE id=$1 AND farmer_id=$2 RETURNING *
    `, [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v5/alert-rules — create custom alert rule
router.post('/alert-rules', authMiddleware, async (req, res) => {
  try {
    const { rule_name, rule_category, parameter, condition_op, threshold_value, severity, message_template, species } = req.body;
    if (!rule_name || !rule_category || !parameter || !condition_op || threshold_value === undefined) {
      return res.status(400).json({ error: 'rule_name, rule_category, parameter, condition_op, threshold_value required' });
    }
    const result = await query(`
      INSERT INTO aqua_alert_rules (id, farmer_id, rule_name, rule_category, parameter, condition_op,
        threshold_value, severity, message_template, species)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [uuidv4(), req.user.id, rule_name, rule_category, parameter, condition_op,
        threshold_value, severity || 'warning', message_template, species]);
    res.status(201).json({ rule: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/alert-rules — list alert rules
router.get('/alert-rules', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_alert_rules WHERE farmer_id IS NULL OR farmer_id = $1 ORDER BY rule_category, rule_name
    `, [req.user.id]);
    res.json({ rules: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// B2B SUPPLY MARKETPLACE
// Farmers browse & order supplies from verified suppliers
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v5/marketplace/products — browse supply products
router.get('/marketplace/products', async (req, res) => {
  try {
    const { category, species, supplier_id, search, min_price, max_price, sort, page, limit } = req.query;
    let conditions = ["sp.status = 'active'"];
    let params = [];
    let i = 1;
    if (category) { conditions.push(`sp.category = $${i++}`); params.push(category); }
    if (species) { conditions.push(`$${i++} = ANY(sp.species_suitable)`); params.push(species); }
    if (supplier_id) { conditions.push(`sp.supplier_id = $${i++}`); params.push(supplier_id); }
    if (search) { conditions.push(`(sp.product_name ILIKE $${i} OR sp.brand ILIKE $${i} OR sp.description ILIKE $${i})`); params.push(`%${search}%`); i++; }
    if (min_price) { conditions.push(`sp.price_per_unit >= $${i++}`); params.push(min_price); }
    if (max_price) { conditions.push(`sp.price_per_unit <= $${i++}`); params.push(max_price); }

    const orderBy = sort === 'price_asc' ? 'sp.price_per_unit ASC'
      : sort === 'price_desc' ? 'sp.price_per_unit DESC'
      : sort === 'rating' ? 'sp.rating DESC'
      : sort === 'popular' ? 'sp.total_sold DESC'
      : 'sp.created_at DESC';

    const pg = parseInt(page) || 1;
    const lim = Math.min(parseInt(limit) || 20, 100);
    const offset = (pg - 1) * lim;

    const result = await query(`
      SELECT sp.*, s.company_name AS supplier_name, s.verified AS supplier_verified, s.rating AS supplier_rating
      FROM aqua_supply_products sp
      JOIN aqua_suppliers s ON s.id = sp.supplier_id AND s.status = 'active'
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${i++} OFFSET $${i++}
    `, [...params, lim, offset]);

    const countResult = await query(`
      SELECT COUNT(*) FROM aqua_supply_products sp
      JOIN aqua_suppliers s ON s.id = sp.supplier_id AND s.status = 'active'
      WHERE ${conditions.join(' AND ')}
    `, params);

    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: pg,
      total_pages: Math.ceil(parseInt(countResult.rows[0].count) / lim)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/marketplace/products/:id — product details
router.get('/marketplace/products/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT sp.*, s.company_name AS supplier_name, s.verified AS supplier_verified,
             s.rating AS supplier_rating, s.delivery_radius_km, s.min_order_amount
      FROM aqua_supply_products sp
      JOIN aqua_suppliers s ON s.id = sp.supplier_id
      WHERE sp.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });

    // Get reviews
    const reviews = await query(`
      SELECT sr.*, u.name AS reviewer_name FROM aqua_supply_reviews sr
      JOIN users u ON u.id = sr.reviewer_id
      WHERE sr.product_id = $1
      ORDER BY sr.created_at DESC LIMIT 10
    `, [req.params.id]);

    res.json({ product: result.rows[0], reviews: reviews.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/marketplace/suppliers — browse suppliers
router.get('/marketplace/suppliers', async (req, res) => {
  try {
    const { business_type, verified, search } = req.query;
    let conditions = ["status = 'active'"];
    let params = [];
    let i = 1;
    if (business_type) { conditions.push(`business_type = $${i++}`); params.push(business_type); }
    if (verified === 'true') { conditions.push(`verified = true`); }
    if (search) { conditions.push(`(company_name ILIKE $${i} OR description ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const result = await query(`
      SELECT s.*, (SELECT COUNT(*) FROM aqua_supply_products WHERE supplier_id = s.id AND status = 'active') AS product_count
      FROM aqua_suppliers s
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.verified DESC, s.rating DESC
    `, params);
    res.json({ suppliers: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v5/marketplace/orders — place supply order
router.post('/marketplace/orders', authMiddleware, async (req, res) => {
  try {
    const { supplier_id, items, delivery_address, notes } = req.body;
    if (!supplier_id || !items?.length) return res.status(400).json({ error: 'supplier_id and items required' });

    // Validate products and calculate total
    let totalAmount = 0;
    const validatedItems = [];
    for (const item of items) {
      const product = await query('SELECT * FROM aqua_supply_products WHERE id=$1 AND supplier_id=$2', [item.product_id, supplier_id]);
      if (!product.rows.length) return res.status(400).json({ error: `Product ${item.product_id} not found for this supplier` });
      const p = product.rows[0];
      const qty = parseFloat(item.quantity);
      if (qty < parseFloat(p.min_order_qty)) return res.status(400).json({ error: `Min order for ${p.product_name}: ${p.min_order_qty} ${p.unit}` });
      const unitPrice = (p.bulk_price && qty >= parseFloat(p.bulk_min_qty || 0)) ? parseFloat(p.bulk_price) : parseFloat(p.price_per_unit);
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;
      validatedItems.push({ product_id: item.product_id, quantity: qty, unit_price: unitPrice, total_price: lineTotal });
    }

    // Check minimum order amount
    const supplier = await query('SELECT min_order_amount FROM aqua_suppliers WHERE id=$1', [supplier_id]);
    if (supplier.rows[0]?.min_order_amount && totalAmount < parseFloat(supplier.rows[0].min_order_amount)) {
      return res.status(400).json({ error: `Minimum order amount: ₹${supplier.rows[0].min_order_amount}` });
    }

    // Create order
    const orderNumber = `AQ-${Date.now().toString(36).toUpperCase()}`;
    const order = await query(`
      INSERT INTO aqua_supply_orders (id, buyer_id, supplier_id, order_number, total_amount, delivery_address, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.user.id, supplier_id, orderNumber, totalAmount, delivery_address, notes]);

    // Create order items
    for (const item of validatedItems) {
      await query(`
        INSERT INTO aqua_supply_order_items (id, order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [uuidv4(), order.rows[0].id, item.product_id, item.quantity, item.unit_price, item.total_price]);
    }

    // Update supplier order count
    await query('UPDATE aqua_suppliers SET total_orders = total_orders + 1 WHERE id=$1', [supplier_id]);

    res.status(201).json({ order: { ...order.rows[0], items: validatedItems } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/marketplace/orders — buyer's orders
router.get('/marketplace/orders', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let conditions = ['o.buyer_id = $1'];
    let params = [req.user.id];
    if (status) { conditions.push('o.status = $2'); params.push(status); }
    const result = await query(`
      SELECT o.*, s.company_name AS supplier_name,
        (SELECT json_agg(json_build_object('product_name', sp.product_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price))
         FROM aqua_supply_order_items oi JOIN aqua_supply_products sp ON sp.id = oi.product_id WHERE oi.order_id = o.id) AS items
      FROM aqua_supply_orders o
      JOIN aqua_suppliers s ON s.id = o.supplier_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY o.created_at DESC
    `, params);
    res.json({ orders: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v5/marketplace/orders/:id — update order status (supplier)
router.patch('/marketplace/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { status, delivery_date, payment_status } = req.body;
    const result = await query(`
      UPDATE aqua_supply_orders SET
        status = COALESCE($1, status), delivery_date = COALESCE($2, delivery_date),
        payment_status = COALESCE($3, payment_status), updated_at = NOW()
      WHERE id = $4 AND (buyer_id = $5 OR supplier_id IN (SELECT id FROM aqua_suppliers WHERE user_id = $5))
      RETURNING *
    `, [status, delivery_date, payment_status, req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v5/marketplace/reviews — review a supplier/product after order
router.post('/marketplace/reviews', authMiddleware, async (req, res) => {
  try {
    const { order_id, supplier_id, product_id, rating, title, review_text, quality_rating, delivery_rating, value_rating } = req.body;
    if (!order_id || !supplier_id || !rating) return res.status(400).json({ error: 'order_id, supplier_id, rating required' });

    // Verify order belongs to user and is delivered
    const order = await query("SELECT id FROM aqua_supply_orders WHERE id=$1 AND buyer_id=$2 AND status='delivered'", [order_id, req.user.id]);
    if (!order.rows.length) return res.status(400).json({ error: 'Can only review delivered orders' });

    const result = await query(`
      INSERT INTO aqua_supply_reviews (id, order_id, reviewer_id, supplier_id, product_id, rating, title, review_text, quality_rating, delivery_rating, value_rating)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), order_id, req.user.id, supplier_id, product_id, rating, title, review_text, quality_rating, delivery_rating, value_rating]);

    // Update supplier rating
    const avgRating = await query('SELECT AVG(rating) AS avg FROM aqua_supply_reviews WHERE supplier_id=$1', [supplier_id]);
    await query('UPDATE aqua_suppliers SET rating=$1 WHERE id=$2', [parseFloat(avgRating.rows[0].avg).toFixed(2), supplier_id]);

    // Update product rating if applicable
    if (product_id) {
      const prodRating = await query('SELECT AVG(rating) AS avg FROM aqua_supply_reviews WHERE product_id=$1', [product_id]);
      await query('UPDATE aqua_supply_products SET rating=$1 WHERE id=$2', [parseFloat(prodRating.rows[0].avg).toFixed(2), product_id]);
    }

    res.status(201).json({ review: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SUPPLIER MANAGEMENT (for supplier users)
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v5/supplier/register — register as supplier
router.post('/supplier/register', authMiddleware, async (req, res) => {
  try {
    const { company_name, business_type, description, gst_number, contact_phone, contact_email,
            address, state, pin_code, delivery_radius_km, min_order_amount } = req.body;
    if (!company_name || !business_type) return res.status(400).json({ error: 'company_name, business_type required' });
    const existing = await query('SELECT id FROM aqua_suppliers WHERE user_id=$1', [req.user.id]);
    if (existing.rows.length) return res.status(400).json({ error: 'Already registered as supplier' });
    const result = await query(`
      INSERT INTO aqua_suppliers (id, user_id, company_name, business_type, description, gst_number,
        contact_phone, contact_email, address, state, pin_code, delivery_radius_km, min_order_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, company_name, business_type, description, gst_number,
        contact_phone, contact_email, address, state, pin_code, delivery_radius_km, min_order_amount]);
    res.status(201).json({ supplier: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v5/supplier/products — add product (supplier only)
router.post('/supplier/products', authMiddleware, async (req, res) => {
  try {
    const supplier = await query('SELECT id FROM aqua_suppliers WHERE user_id=$1', [req.user.id]);
    if (!supplier.rows.length) return res.status(403).json({ error: 'Not registered as supplier' });
    const { product_name, category, sub_category, brand, description, specifications,
            unit, price_per_unit, bulk_price, bulk_min_qty, stock_available, min_order_qty,
            species_suitable, certifications, delivery_days } = req.body;
    if (!product_name || !category || !price_per_unit) return res.status(400).json({ error: 'product_name, category, price_per_unit required' });
    const result = await query(`
      INSERT INTO aqua_supply_products (id, supplier_id, product_name, category, sub_category, brand,
        description, specifications, unit, price_per_unit, bulk_price, bulk_min_qty, stock_available,
        min_order_qty, species_suitable, certifications, delivery_days)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *
    `, [uuidv4(), supplier.rows[0].id, product_name, category, sub_category, brand,
        description, specifications ? JSON.stringify(specifications) : null,
        unit || 'kg', price_per_unit, bulk_price, bulk_min_qty, stock_available || 0,
        min_order_qty || 1, species_suitable, certifications, delivery_days || 3]);
    res.status(201).json({ product: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v5/supplier/dashboard — supplier's order/product stats
router.get('/supplier/dashboard', authMiddleware, async (req, res) => {
  try {
    const supplier = await query('SELECT * FROM aqua_suppliers WHERE user_id=$1', [req.user.id]);
    if (!supplier.rows.length) return res.status(403).json({ error: 'Not registered as supplier' });
    const sid = supplier.rows[0].id;

    const products = await query('SELECT COUNT(*) AS total, SUM(stock_available) AS total_stock FROM aqua_supply_products WHERE supplier_id=$1', [sid]);
    const orders = await query(`
      SELECT status, COUNT(*) AS count, SUM(total_amount) AS amount
      FROM aqua_supply_orders WHERE supplier_id=$1 GROUP BY status
    `, [sid]);
    const recentOrders = await query(`
      SELECT o.*, u.name AS buyer_name FROM aqua_supply_orders o
      JOIN users u ON u.id = o.buyer_id
      WHERE o.supplier_id=$1 ORDER BY o.created_at DESC LIMIT 10
    `, [sid]);

    res.json({
      supplier: supplier.rows[0],
      stats: {
        total_products: parseInt(products.rows[0].total),
        total_stock: parseFloat(products.rows[0].total_stock || 0),
        orders_by_status: orders.rows,
        total_revenue: orders.rows.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0)
      },
      recent_orders: recentOrders.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
