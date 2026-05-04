'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// CALCULATORS — Real-time problem solving for Aquaculture & Agriculture
// Aqua Calculator (AquaOS) + Crop Calculator (Agri)
// ═══════════════════════════════════════════════════════════════

// ─── AQUA CALCULATOR ENDPOINTS ──────────────────────────────

// POST /api/calculators/aqua/pond-economics — Full pond economics analysis
router.post('/aqua/pond-economics', (req, res) => {
  try {
    const {
      pond_area_acres = 1,
      species = 'vannamei',
      stocking_density_per_acre = 60000,
      seed_cost_per_piece = 0.45,
      feed_cost_per_kg = 65,
      fcr = 1.4,
      survival_rate = 80,
      culture_days = 110,
      expected_abw_g = 30,
      selling_price_per_kg = 280,
      electricity_per_month = 8000,
      labor_per_month = 15000,
      probiotics_per_month = 5000,
      pond_preparation_cost = 25000,
      other_costs = 10000,
    } = req.body;

    // Calculations
    const total_stocked = Math.round(pond_area_acres * stocking_density_per_acre);
    const surviving = Math.round(total_stocked * (survival_rate / 100));
    const harvest_weight_kg = Math.round(surviving * expected_abw_g / 1000);
    const total_feed_kg = Math.round(harvest_weight_kg * fcr);
    const culture_months = Math.ceil(culture_days / 30);

    // Revenue
    const gross_revenue = Math.round(harvest_weight_kg * selling_price_per_kg);

    // Costs breakdown
    const seed_cost = Math.round(total_stocked * seed_cost_per_piece);
    const feed_cost = Math.round(total_feed_kg * feed_cost_per_kg);
    const electricity_cost = Math.round(electricity_per_month * culture_months);
    const labor_cost = Math.round(labor_per_month * culture_months);
    const probiotics_cost = Math.round(probiotics_per_month * culture_months);
    const total_cost = seed_cost + feed_cost + electricity_cost + labor_cost + probiotics_cost + pond_preparation_cost + other_costs;

    // Profitability
    const net_profit = gross_revenue - total_cost;
    const roi_percent = total_cost > 0 ? Math.round((net_profit / total_cost) * 100) : 0;
    const cost_per_kg = harvest_weight_kg > 0 ? Math.round(total_cost / harvest_weight_kg) : 0;
    const profit_per_kg = selling_price_per_kg - cost_per_kg;
    const breakeven_price = cost_per_kg;
    const profit_per_acre = Math.round(net_profit / pond_area_acres);

    res.json({
      summary: {
        total_stocked,
        surviving,
        harvest_weight_kg,
        total_feed_kg,
        culture_months,
        gross_revenue,
        total_cost,
        net_profit,
        roi_percent,
        profit_per_acre,
      },
      costs_breakdown: {
        seed_cost,
        feed_cost,
        electricity_cost,
        labor_cost,
        probiotics_cost,
        pond_preparation_cost,
        other_costs,
        total_cost,
      },
      unit_economics: {
        cost_per_kg,
        profit_per_kg,
        breakeven_price,
        selling_price_per_kg,
      },
      recommendation: net_profit > 0
        ? `Profitable! ROI: ${roi_percent}%. Consider ${roi_percent < 30 ? 'optimizing feed costs or improving survival rate' : 'scaling to more ponds'}.`
        : `Loss scenario. Reduce costs or improve survival rate above ${Math.ceil(total_cost / (total_stocked * expected_abw_g / 1000 * selling_price_per_kg) * 100)}% to breakeven.`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/aqua/feed-schedule — Daily/weekly feed schedule generator
router.post('/aqua/feed-schedule', (req, res) => {
  try {
    const {
      species = 'vannamei',
      current_abw_g = 10,
      survival_count = 50000,
      pond_area_acres = 1,
      feed_brand = 'standard',
    } = req.body;

    // Feed percentage by body weight stages
    const feedPctByWeight = [
      { min: 0, max: 3, pct: 12, frequency: 5, label: 'PL to 3g' },
      { min: 3, max: 5, pct: 10, frequency: 4, label: '3g to 5g' },
      { min: 5, max: 10, pct: 7, frequency: 4, label: '5g to 10g' },
      { min: 10, max: 15, pct: 5, frequency: 4, label: '10g to 15g' },
      { min: 15, max: 20, pct: 4, frequency: 3, label: '15g to 20g' },
      { min: 20, max: 25, pct: 3.5, frequency: 3, label: '20g to 25g' },
      { min: 25, max: 30, pct: 3, frequency: 3, label: '25g to 30g' },
      { min: 30, max: 40, pct: 2.5, frequency: 2, label: '30g to 40g' },
      { min: 40, max: 100, pct: 2, frequency: 2, label: '40g+' },
    ];

    const stage = feedPctByWeight.find(s => current_abw_g >= s.min && current_abw_g < s.max) || feedPctByWeight[feedPctByWeight.length - 1];
    const biomass_kg = Math.round(survival_count * current_abw_g / 1000);
    const daily_feed_kg = Math.round(biomass_kg * stage.pct / 100 * 10) / 10;
    const per_feeding = Math.round(daily_feed_kg / stage.frequency * 10) / 10;

    // Weekly schedule
    const week_schedule = Array.from({ length: 7 }, (_, day) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
      total_kg: daily_feed_kg,
      feedings: stage.frequency,
      per_feeding_kg: per_feeding,
      check_tray: day % 2 === 0, // check tray alternate days
    }));

    // Feed times recommendation
    const feed_times = stage.frequency === 5
      ? ['6:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM']
      : stage.frequency === 4
        ? ['6:30 AM', '10:00 AM', '2:00 PM', '6:00 PM']
        : stage.frequency === 3
          ? ['7:00 AM', '12:00 PM', '5:30 PM']
          : ['7:00 AM', '5:00 PM'];

    res.json({
      current_status: {
        biomass_kg,
        abw_g: current_abw_g,
        survival_count,
        stage: stage.label,
        feed_percentage: stage.pct,
      },
      daily_recommendation: {
        total_daily_feed_kg: daily_feed_kg,
        feedings_per_day: stage.frequency,
        per_feeding_kg: per_feeding,
        feed_times,
        monthly_feed_kg: Math.round(daily_feed_kg * 30),
        monthly_cost_estimate: Math.round(daily_feed_kg * 30 * 65),
      },
      week_schedule,
      tips: [
        current_abw_g < 5 ? 'Use starter feed (crumble size 0.5-1mm)' : current_abw_g < 15 ? 'Use grower feed (pellet 1.5-2mm)' : 'Use finisher feed (pellet 2-3mm)',
        'Reduce feed by 30% on days after heavy rain or water change',
        'Always check tray within 2-3 hours. If feed remains, reduce next feeding by 10%',
        'Do not feed if DO < 3 ppm or ammonia > 0.1 ppm',
      ],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/aqua/water-quality — Water quality analysis & recommendations
router.post('/aqua/water-quality', (req, res) => {
  try {
    const {
      ph = 7.5,
      dissolved_oxygen = 5,
      ammonia = 0.05,
      nitrite = 0.01,
      temperature = 28,
      salinity = 15,
      alkalinity = 120,
      hardness = 200,
      transparency_cm = 35,
      species = 'vannamei',
    } = req.body;

    // Optimal ranges by species
    const optimalRanges = {
      vannamei: { ph: [7.5, 8.5], do: [4, 8], ammonia: [0, 0.1], nitrite: [0, 0.25], temp: [26, 32], salinity: [10, 35], alkalinity: [80, 200], hardness: [150, 300], transparency: [25, 45] },
      tiger_prawn: { ph: [7.8, 8.5], do: [4, 7], ammonia: [0, 0.1], nitrite: [0, 0.2], temp: [25, 32], salinity: [15, 35], alkalinity: [80, 180], hardness: [150, 300], transparency: [30, 50] },
      pangasius: { ph: [6.5, 8.5], do: [3, 8], ammonia: [0, 0.5], nitrite: [0, 0.3], temp: [24, 32], salinity: [0, 5], alkalinity: [50, 200], hardness: [100, 300], transparency: [20, 40] },
      tilapia: { ph: [6.5, 9.0], do: [3, 8], ammonia: [0, 0.5], nitrite: [0, 0.5], temp: [22, 32], salinity: [0, 20], alkalinity: [50, 200], hardness: [100, 300], transparency: [20, 40] },
    };

    const optimal = optimalRanges[species] || optimalRanges.vannamei;
    const parameters = [];
    const alerts = [];
    const actions = [];

    // pH analysis
    const phStatus = ph >= optimal.ph[0] && ph <= optimal.ph[1] ? 'normal' : ph < optimal.ph[0] ? 'low' : 'high';
    parameters.push({ name: 'pH', value: ph, unit: '', status: phStatus, optimal: `${optimal.ph[0]}-${optimal.ph[1]}` });
    if (phStatus === 'low') { alerts.push('pH is LOW — stress risk'); actions.push('Apply dolomite lime 50-100 kg/acre to raise pH'); }
    if (phStatus === 'high') { alerts.push('pH is HIGH — ammonia toxicity increases'); actions.push('Apply gypsum 50 kg/acre, reduce feeding'); }

    // DO analysis
    const doStatus = dissolved_oxygen >= optimal.do[0] ? 'normal' : dissolved_oxygen >= 3 ? 'warning' : 'critical';
    parameters.push({ name: 'Dissolved Oxygen', value: dissolved_oxygen, unit: 'ppm', status: doStatus, optimal: `${optimal.do[0]}-${optimal.do[1]} ppm` });
    if (doStatus === 'warning') { alerts.push('DO is LOW — reduce feeding'); actions.push('Run aerators continuously, reduce feed by 30%'); }
    if (doStatus === 'critical') { alerts.push('⚠️ CRITICAL: DO below 3 ppm — mortality risk!'); actions.push('Emergency: Run all aerators, stop feeding, add H2O2 if available'); }

    // Ammonia analysis
    const ammoniaStatus = ammonia <= optimal.ammonia[1] ? 'normal' : ammonia <= 0.5 ? 'warning' : 'critical';
    parameters.push({ name: 'Ammonia (NH3)', value: ammonia, unit: 'ppm', status: ammoniaStatus, optimal: `<${optimal.ammonia[1]} ppm` });
    if (ammoniaStatus === 'warning') { alerts.push('Ammonia elevated — gill damage risk'); actions.push('Water exchange 20-30%, reduce feed, apply probiotics (Bacillus subtilis)'); }
    if (ammoniaStatus === 'critical') { alerts.push('⚠️ CRITICAL: High ammonia — immediate action needed!'); actions.push('Emergency water exchange 40-50%, stop feeding for 24h, apply zeolite 100 kg/acre'); }

    // Nitrite analysis
    const nitriteStatus = nitrite <= optimal.nitrite[1] ? 'normal' : nitrite <= 0.5 ? 'warning' : 'critical';
    parameters.push({ name: 'Nitrite (NO2)', value: nitrite, unit: 'ppm', status: nitriteStatus, optimal: `<${optimal.nitrite[1]} ppm` });
    if (nitriteStatus !== 'normal') { alerts.push('Nitrite elevated — brown blood disease risk'); actions.push('Add salt (NaCl) 100-200 kg/acre to counter nitrite toxicity'); }

    // Temperature analysis
    const tempStatus = temperature >= optimal.temp[0] && temperature <= optimal.temp[1] ? 'normal' : 'warning';
    parameters.push({ name: 'Temperature', value: temperature, unit: '°C', status: tempStatus, optimal: `${optimal.temp[0]}-${optimal.temp[1]}°C` });
    if (tempStatus === 'warning') { actions.push(temperature < optimal.temp[0] ? 'Reduce water depth to warm pond' : 'Increase aeration, add fresh water to cool'); }

    // Salinity
    const salinityStatus = salinity >= optimal.salinity[0] && salinity <= optimal.salinity[1] ? 'normal' : 'warning';
    parameters.push({ name: 'Salinity', value: salinity, unit: 'ppt', status: salinityStatus, optimal: `${optimal.salinity[0]}-${optimal.salinity[1]} ppt` });

    // Alkalinity
    const alkStatus = alkalinity >= optimal.alkalinity[0] && alkalinity <= optimal.alkalinity[1] ? 'normal' : alkalinity < optimal.alkalinity[0] ? 'low' : 'high';
    parameters.push({ name: 'Alkalinity', value: alkalinity, unit: 'ppm', status: alkStatus, optimal: `${optimal.alkalinity[0]}-${optimal.alkalinity[1]} ppm` });
    if (alkStatus === 'low') { actions.push('Apply dolomite 100 kg/acre to boost alkalinity'); }

    // Transparency
    const transStatus = transparency_cm >= optimal.transparency[0] && transparency_cm <= optimal.transparency[1] ? 'normal' : transparency_cm < optimal.transparency[0] ? 'dense_bloom' : 'clear';
    parameters.push({ name: 'Transparency', value: transparency_cm, unit: 'cm', status: transStatus, optimal: `${optimal.transparency[0]}-${optimal.transparency[1]} cm` });
    if (transStatus === 'dense_bloom') { actions.push('Dense algae bloom — risk of DO crash at night. Reduce feed, apply probiotics'); }
    if (transStatus === 'clear') { actions.push('Water too clear — fertilize to promote plankton growth'); }

    // Overall health score
    const criticals = parameters.filter(p => p.status === 'critical').length;
    const warnings = parameters.filter(p => p.status === 'warning' || p.status === 'low' || p.status === 'high' || p.status === 'dense_bloom').length;
    const health_score = Math.max(0, 100 - (criticals * 30) - (warnings * 10));

    res.json({
      health_score,
      overall_status: criticals > 0 ? 'critical' : warnings > 2 ? 'poor' : warnings > 0 ? 'fair' : 'good',
      parameters,
      alerts,
      actions,
      feeding_advice: doStatus === 'critical' ? 'STOP feeding immediately' : ammoniaStatus !== 'normal' ? 'Reduce feed by 50%' : doStatus === 'warning' ? 'Reduce feed by 30%' : 'Normal feeding',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/aqua/stocking — Stocking density calculator with economics
router.post('/aqua/stocking', (req, res) => {
  try {
    const {
      pond_area_acres = 1,
      species = 'vannamei',
      culture_system = 'extensive', // extensive, semi-intensive, intensive, super-intensive
      target_size_g = 30,
      available_budget = 500000,
    } = req.body;

    const densityRanges = {
      vannamei: { extensive: [20000, 40000], 'semi-intensive': [40000, 80000], intensive: [80000, 120000], 'super-intensive': [120000, 200000] },
      tiger_prawn: { extensive: [15000, 30000], 'semi-intensive': [30000, 50000], intensive: [50000, 80000], 'super-intensive': [80000, 100000] },
      pangasius: { extensive: [5000, 10000], 'semi-intensive': [10000, 20000], intensive: [20000, 40000], 'super-intensive': [40000, 60000] },
      tilapia: { extensive: [8000, 15000], 'semi-intensive': [15000, 30000], intensive: [30000, 50000], 'super-intensive': [50000, 80000] },
    };

    const survivalRates = { extensive: 85, 'semi-intensive': 80, intensive: 75, 'super-intensive': 70 };
    const fcrRates = { extensive: 1.2, 'semi-intensive': 1.4, intensive: 1.6, 'super-intensive': 1.8 };

    const range = (densityRanges[species] || densityRanges.vannamei)[culture_system] || [40000, 80000];
    const recommended_density = Math.round((range[0] + range[1]) / 2);
    const total_stock = Math.round(recommended_density * pond_area_acres);
    const survival = survivalRates[culture_system] || 80;
    const fcr = fcrRates[culture_system] || 1.4;
    const harvest_count = Math.round(total_stock * survival / 100);
    const harvest_kg = Math.round(harvest_count * target_size_g / 1000);
    const feed_needed_kg = Math.round(harvest_kg * fcr);

    // Cost estimate
    const seed_cost = Math.round(total_stock * 0.5);
    const feed_cost = Math.round(feed_needed_kg * 65);
    const operational_cost = Math.round(pond_area_acres * 50000 * (culture_system === 'intensive' ? 1.5 : 1));
    const total_estimated_cost = seed_cost + feed_cost + operational_cost;
    const budget_feasible = available_budget >= total_estimated_cost;

    // If budget constrains, suggest lower density
    const budget_adjusted_stock = budget_feasible ? total_stock : Math.round((available_budget / total_estimated_cost) * total_stock);

    res.json({
      recommendation: {
        species,
        culture_system,
        density_range: { min: range[0], max: range[1], unit: 'per acre' },
        recommended_density_per_acre: recommended_density,
        total_stocking: budget_feasible ? total_stock : budget_adjusted_stock,
        pond_area_acres,
      },
      expected_output: {
        survival_rate: survival,
        fcr,
        harvest_count,
        harvest_weight_kg: harvest_kg,
        target_size_g,
        culture_days: species === 'vannamei' ? 110 : species === 'pangasius' ? 180 : 120,
      },
      economics: {
        seed_cost,
        feed_cost,
        operational_cost,
        total_estimated_cost,
        available_budget,
        budget_feasible,
        budget_adjusted_stock: budget_feasible ? null : budget_adjusted_stock,
      },
      requirements: {
        aerators: culture_system === 'extensive' ? Math.ceil(pond_area_acres * 2) : culture_system === 'semi-intensive' ? Math.ceil(pond_area_acres * 4) : Math.ceil(pond_area_acres * 8),
        feed_per_month_kg: Math.round(feed_needed_kg / 4),
        water_exchange_pct: culture_system === 'extensive' ? 10 : culture_system === 'semi-intensive' ? 20 : 30,
        monitoring: culture_system === 'intensive' || culture_system === 'super-intensive' ? 'Daily water testing mandatory' : 'Test water every 3 days',
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/aqua/harvest-timing — Optimal harvest timing calculator
router.post('/aqua/harvest-timing', (req, res) => {
  try {
    const {
      current_abw_g = 20,
      doc = 80, // days of culture
      survival_count = 45000,
      growth_rate_g_per_day = 0.25,
      feed_cost_per_day = 2000,
      current_market_price = 280,
      expected_price_change_per_week = -5, // price drop per week
      target_sizes = [25, 30, 35],
    } = req.body;

    const scenarios = target_sizes.map(target => {
      const days_to_target = Math.ceil((target - current_abw_g) / growth_rate_g_per_day);
      const additional_feed_cost = days_to_target * feed_cost_per_day;
      const additional_mortality = Math.round(survival_count * 0.002 * days_to_target); // 0.2% daily mortality
      const harvest_count = survival_count - additional_mortality;
      const harvest_kg = Math.round(harvest_count * target / 1000);
      const price_at_harvest = current_market_price + (expected_price_change_per_week * days_to_target / 7);
      const revenue = Math.round(harvest_kg * price_at_harvest);
      const marginal_profit = revenue - Math.round(survival_count * current_abw_g / 1000 * current_market_price) - additional_feed_cost;

      return {
        target_size_g: target,
        days_remaining: days_to_target,
        harvest_doc: doc + days_to_target,
        harvest_kg,
        expected_price: Math.round(price_at_harvest),
        revenue,
        additional_feed_cost,
        marginal_profit,
        per_kg_realization: Math.round(price_at_harvest),
        recommendation: marginal_profit > 0 ? 'GROW' : 'HARVEST NOW',
      };
    });

    // Find best scenario
    const best = scenarios.reduce((a, b) => a.marginal_profit > b.marginal_profit ? a : b);

    res.json({
      current_status: { abw_g: current_abw_g, doc, survival_count, biomass_kg: Math.round(survival_count * current_abw_g / 1000) },
      scenarios,
      best_option: {
        target_size_g: best.target_size_g,
        recommendation: best.recommendation,
        reason: best.marginal_profit > 0
          ? `Growing to ${best.target_size_g}g adds ₹${best.marginal_profit.toLocaleString()} marginal profit`
          : `Harvest now at ${current_abw_g}g — further growth costs exceed price realization`,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/aqua/disease-cost — Disease outbreak cost estimator
router.post('/aqua/disease-cost', (req, res) => {
  try {
    const {
      species = 'vannamei',
      disease = 'white_spot', // white_spot, EHP, vibriosis, loose_shell, running_mortality
      current_stock = 50000,
      current_abw_g = 15,
      doc = 60,
      treatment_started = true,
      mortality_percent = 20,
    } = req.body;

    const diseaseInfo = {
      white_spot: { name: 'White Spot Syndrome (WSSV)', severity: 'critical', typical_mortality: 80, treatment_possible: false, action: 'Emergency harvest recommended', recovery_days: 0, treatment_cost_per_acre: 0 },
      EHP: { name: 'Enterocytozoon hepatopenaei', severity: 'high', typical_mortality: 30, treatment_possible: true, action: 'Probiotic treatment + reduce density', recovery_days: 30, treatment_cost_per_acre: 25000 },
      vibriosis: { name: 'Vibriosis (Green/Yellow gills)', severity: 'moderate', typical_mortality: 15, treatment_possible: true, action: 'Antibiotic bath + water exchange', recovery_days: 10, treatment_cost_per_acre: 15000 },
      loose_shell: { name: 'Loose Shell Syndrome', severity: 'moderate', typical_mortality: 10, treatment_possible: true, action: 'Mineral supplementation + salinity adjustment', recovery_days: 14, treatment_cost_per_acre: 10000 },
      running_mortality: { name: 'Running Mortality (Unknown)', severity: 'high', typical_mortality: 40, treatment_possible: false, action: 'Investigate cause, consider partial harvest', recovery_days: 0, treatment_cost_per_acre: 20000 },
    };

    const info = diseaseInfo[disease] || diseaseInfo.running_mortality;
    const expected_mortality_count = Math.round(current_stock * (mortality_percent || info.typical_mortality) / 100);
    const surviving_after = current_stock - expected_mortality_count;
    const biomass_lost_kg = Math.round(expected_mortality_count * current_abw_g / 1000);
    const revenue_lost = Math.round(biomass_lost_kg * 280); // assumed market price

    // If emergency harvest
    const emergency_harvest_kg = Math.round(surviving_after * current_abw_g / 1000);
    const emergency_revenue = Math.round(emergency_harvest_kg * (current_abw_g < 20 ? 180 : 250)); // lower price for small size
    const normal_harvest_revenue = Math.round(surviving_after * 30 / 1000 * 280); // if they could grow to 30g

    const opportunity_loss = normal_harvest_revenue - emergency_revenue;

    res.json({
      disease: info,
      impact: {
        expected_mortality_count,
        surviving_after,
        biomass_lost_kg,
        revenue_lost,
        opportunity_loss,
        total_economic_loss: revenue_lost + opportunity_loss + info.treatment_cost_per_acre,
      },
      options: [
        {
          action: 'Emergency Harvest',
          harvest_kg: emergency_harvest_kg,
          expected_revenue: emergency_revenue,
          risk: 'Low — salvage what you can',
          suitable_when: 'WSSV confirmed, mortality >30%',
        },
        ...(info.treatment_possible ? [{
          action: 'Treat & Continue',
          treatment_cost: info.treatment_cost_per_acre,
          recovery_days: info.recovery_days,
          expected_survival: surviving_after,
          potential_revenue: normal_harvest_revenue,
          risk: 'Medium — may not respond to treatment',
          suitable_when: 'EHP/vibriosis, mortality <20%, ABW <15g',
        }] : []),
        {
          action: 'Partial Harvest + Treat',
          harvest_kg: Math.round(emergency_harvest_kg * 0.5),
          continue_stock: Math.round(surviving_after * 0.5),
          risk: 'Medium — diversifies risk',
          suitable_when: 'Uncertain diagnosis, medium mortality',
        },
      ],
      prevention_cost_for_next_crop: {
        biosecurity_upgrades: 30000,
        probiotics_program: 20000,
        pcr_testing: 5000,
        water_treatment: 15000,
        total: 70000,
        savings_vs_outbreak: revenue_lost + opportunity_loss - 70000,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── CROP CALCULATOR ENDPOINTS ──────────────────────────────

// POST /api/calculators/crop/season-economics — Full season P&L calculator
router.post('/crop/season-economics', (req, res) => {
  try {
    const {
      crop = 'paddy',
      season = 'kharif',
      area_acres = 5,
      irrigation_type = 'canal', // rainfed, canal, borewell, drip
      soil_type = 'black', // black, red, alluvial, sandy, laterite
      seeds_cost = 0,
      fertilizer_cost = 0,
      pesticide_cost = 0,
      labor_cost = 0,
      irrigation_cost = 0,
      land_rent = 0,
      other_costs = 0,
      expected_yield_qtl_per_acre = 0,
      selling_price_per_qtl = 0,
    } = req.body;

    // Default cost/yield data by crop (AP/Telangana reference)
    const cropData = {
      paddy: { yield: { rainfed: 18, canal: 25, borewell: 28, drip: 30 }, price: 2200, costs: { seeds: 2500, fertilizer: 8000, pesticide: 4000, labor: 12000, irrigation: 5000 }, duration_days: 130 },
      cotton: { yield: { rainfed: 6, canal: 10, borewell: 12, drip: 14 }, price: 6500, costs: { seeds: 4000, fertilizer: 6000, pesticide: 8000, labor: 15000, irrigation: 4000 }, duration_days: 180 },
      maize: { yield: { rainfed: 20, canal: 30, borewell: 35, drip: 38 }, price: 1800, costs: { seeds: 3000, fertilizer: 6000, pesticide: 3000, labor: 8000, irrigation: 4000 }, duration_days: 110 },
      groundnut: { yield: { rainfed: 10, canal: 15, borewell: 18, drip: 20 }, price: 5500, costs: { seeds: 8000, fertilizer: 5000, pesticide: 3000, labor: 10000, irrigation: 3000 }, duration_days: 120 },
      chilli: { yield: { rainfed: 8, canal: 15, borewell: 20, drip: 25 }, price: 12000, costs: { seeds: 6000, fertilizer: 10000, pesticide: 12000, labor: 20000, irrigation: 8000 }, duration_days: 150 },
      tomato: { yield: { rainfed: 60, canal: 100, borewell: 120, drip: 150 }, price: 1500, costs: { seeds: 5000, fertilizer: 8000, pesticide: 10000, labor: 25000, irrigation: 8000 }, duration_days: 90 },
      sugarcane: { yield: { rainfed: 250, canal: 350, borewell: 400, drip: 450 }, price: 350, costs: { seeds: 15000, fertilizer: 12000, pesticide: 5000, labor: 20000, irrigation: 15000 }, duration_days: 365 },
      soybean: { yield: { rainfed: 8, canal: 12, borewell: 14, drip: 16 }, price: 4500, costs: { seeds: 4000, fertilizer: 4000, pesticide: 3000, labor: 8000, irrigation: 3000 }, duration_days: 100 },
      turmeric: { yield: { rainfed: 60, canal: 80, borewell: 100, drip: 120 }, price: 8000, costs: { seeds: 40000, fertilizer: 10000, pesticide: 5000, labor: 25000, irrigation: 10000 }, duration_days: 270 },
      onion: { yield: { rainfed: 60, canal: 100, borewell: 120, drip: 140 }, price: 2000, costs: { seeds: 8000, fertilizer: 6000, pesticide: 6000, labor: 15000, irrigation: 6000 }, duration_days: 120 },
    };

    const data = cropData[crop] || cropData.paddy;
    const yield_per_acre = expected_yield_qtl_per_acre || data.yield[irrigation_type] || data.yield.canal;
    const price = selling_price_per_qtl || data.price;

    // Calculate costs (use provided or defaults)
    const costs = {
      seeds: seeds_cost || (data.costs.seeds * area_acres),
      fertilizer: fertilizer_cost || (data.costs.fertilizer * area_acres),
      pesticide: pesticide_cost || (data.costs.pesticide * area_acres),
      labor: labor_cost || (data.costs.labor * area_acres),
      irrigation: irrigation_cost || (data.costs.irrigation * area_acres),
      land_rent: land_rent || 0,
      other: other_costs || (2000 * area_acres),
    };
    const total_cost = Object.values(costs).reduce((a, b) => a + b, 0);

    // Revenue
    const total_yield_qtl = Math.round(yield_per_acre * area_acres);
    const gross_revenue = Math.round(total_yield_qtl * price);
    const net_profit = gross_revenue - total_cost;
    const profit_per_acre = Math.round(net_profit / area_acres);
    const cost_per_qtl = Math.round(total_cost / total_yield_qtl);
    const breakeven_price = cost_per_qtl;
    const roi = total_cost > 0 ? Math.round((net_profit / total_cost) * 100) : 0;

    // MSP comparison
    const msp = { paddy: 2183, cotton: 6620, maize: 2090, groundnut: 6377, soybean: 4600, sugarcane: 315, wheat: 2275 };
    const crop_msp = msp[crop];
    const msp_revenue = crop_msp ? Math.round(total_yield_qtl * crop_msp) : null;

    res.json({
      summary: {
        crop,
        season,
        area_acres,
        irrigation_type,
        duration_days: data.duration_days,
        total_yield_qtl,
        yield_per_acre,
        gross_revenue,
        total_cost,
        net_profit,
        profit_per_acre,
        roi_percent: roi,
      },
      costs_breakdown: costs,
      unit_economics: {
        cost_per_qtl,
        selling_price_per_qtl: price,
        profit_per_qtl: price - cost_per_qtl,
        breakeven_price,
      },
      msp_comparison: crop_msp ? {
        msp_price: crop_msp,
        msp_revenue,
        market_vs_msp: price > crop_msp ? 'Market price ABOVE MSP ✓' : 'Market price below MSP — sell to govt procurement',
        msp_profit: msp_revenue - total_cost,
      } : null,
      risk_analysis: {
        breakeven_yield: Math.ceil(total_cost / price),
        required_yield_pct: Math.round((total_cost / price / (yield_per_acre * area_acres)) * 100),
        price_risk: `Profitable if price stays above ₹${breakeven_price}/qtl`,
        weather_risk: irrigation_type === 'rainfed' ? 'HIGH — fully rain-dependent' : irrigation_type === 'canal' ? 'MEDIUM — canal availability varies' : 'LOW — assured irrigation',
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/crop/fertilizer-dosage — Precise fertilizer dosage calculator
router.post('/crop/fertilizer-dosage', (req, res) => {
  try {
    const {
      crop = 'paddy',
      area_acres = 5,
      soil_type = 'black',
      soil_test_n = 0, // kg/ha available nitrogen
      soil_test_p = 0, // kg/ha available phosphorus
      soil_test_k = 0, // kg/ha available potassium
      organic_carbon_pct = 0.5,
      target_yield_qtl = 25,
    } = req.body;

    // Recommended NPK (kg/ha) by crop
    const cropNPK = {
      paddy: { n: 120, p: 60, k: 40, splits: [{ stage: 'Basal', pct: [50, 100, 50] }, { stage: 'Tillering (21 DAT)', pct: [25, 0, 25] }, { stage: 'Panicle (45 DAT)', pct: [25, 0, 25] }] },
      cotton: { n: 120, p: 60, k: 60, splits: [{ stage: 'Basal', pct: [33, 100, 50] }, { stage: '30 DAS', pct: [33, 0, 25] }, { stage: '60 DAS', pct: [34, 0, 25] }] },
      maize: { n: 150, p: 60, k: 40, splits: [{ stage: 'Basal', pct: [33, 100, 100] }, { stage: 'Knee height', pct: [33, 0, 0] }, { stage: 'Tasseling', pct: [34, 0, 0] }] },
      groundnut: { n: 20, p: 40, k: 40, splits: [{ stage: 'Basal', pct: [100, 100, 100] }] },
      chilli: { n: 120, p: 60, k: 60, splits: [{ stage: 'Basal', pct: [33, 100, 50] }, { stage: '30 DAT', pct: [33, 0, 25] }, { stage: '60 DAT', pct: [34, 0, 25] }] },
      tomato: { n: 180, p: 80, k: 80, splits: [{ stage: 'Basal', pct: [25, 100, 50] }, { stage: '3 weeks', pct: [25, 0, 25] }, { stage: '6 weeks', pct: [25, 0, 25] }, { stage: '9 weeks', pct: [25, 0, 0] }] },
      sugarcane: { n: 250, p: 100, k: 100, splits: [{ stage: 'Basal', pct: [20, 100, 50] }, { stage: '45 days', pct: [30, 0, 25] }, { stage: '90 days', pct: [30, 0, 25] }, { stage: '120 days', pct: [20, 0, 0] }] },
      onion: { n: 100, p: 50, k: 50, splits: [{ stage: 'Basal', pct: [50, 100, 100] }, { stage: '30 DAT', pct: [25, 0, 0] }, { stage: '45 DAT', pct: [25, 0, 0] }] },
    };

    const data = cropNPK[crop] || cropNPK.paddy;
    const ha_per_acre = 0.4047;
    const area_ha = area_acres * ha_per_acre;

    // Adjust for soil test values (subtract available nutrients)
    const adjusted_n = Math.max(0, data.n - (soil_test_n * 0.3)); // 30% efficiency
    const adjusted_p = Math.max(0, data.p - (soil_test_p * 0.5)); // 50% efficiency
    const adjusted_k = Math.max(0, data.k - (soil_test_k * 0.7)); // 70% efficiency

    // Convert to actual fertilizer quantities
    const urea_kg = Math.round(adjusted_n / 0.46 * area_ha); // Urea = 46% N
    const dap_kg = Math.round(adjusted_p / 0.46 * area_ha); // DAP = 46% P2O5
    const mop_kg = Math.round(adjusted_k / 0.60 * area_ha); // MOP = 60% K2O
    const dap_n_contribution = Math.round(dap_kg * 0.18); // DAP also has 18% N
    const adjusted_urea = Math.max(0, urea_kg - Math.round(dap_n_contribution / 0.46));

    // Split-wise schedule
    const schedule = data.splits.map(split => ({
      stage: split.stage,
      urea_kg: Math.round(adjusted_urea * split.pct[0] / 100),
      dap_kg: Math.round(dap_kg * split.pct[1] / 100),
      mop_kg: Math.round(mop_kg * split.pct[2] / 100),
    }));

    // Cost estimate
    const urea_price = 267; // per 45kg bag ≈ ₹6/kg
    const dap_price = 1350; // per 50kg bag ≈ ₹27/kg
    const mop_price = 900; // per 50kg bag ≈ ₹18/kg

    const total_cost = Math.round(adjusted_urea * 6 + dap_kg * 27 + mop_kg * 18);

    // Organic carbon recommendation
    const oc_recommendation = organic_carbon_pct < 0.5
      ? 'Apply FYM 5 tonnes/acre or vermicompost 2 tonnes/acre to improve organic carbon'
      : organic_carbon_pct < 0.75 ? 'Apply FYM 3 tonnes/acre for maintenance' : 'Good organic carbon level';

    res.json({
      crop,
      area_acres,
      nutrient_requirement: {
        nitrogen_kg_per_ha: data.n,
        phosphorus_kg_per_ha: data.p,
        potassium_kg_per_ha: data.k,
        adjusted_n: Math.round(adjusted_n),
        adjusted_p: Math.round(adjusted_p),
        adjusted_k: Math.round(adjusted_k),
      },
      fertilizer_quantity: {
        urea_kg: adjusted_urea,
        dap_kg,
        mop_kg,
        total_bags: { urea: Math.ceil(adjusted_urea / 45), dap: Math.ceil(dap_kg / 50), mop: Math.ceil(mop_kg / 50) },
      },
      application_schedule: schedule,
      estimated_cost: total_cost,
      organic_recommendation: oc_recommendation,
      micronutrients: [
        { nutrient: 'Zinc Sulphate', dose: `${Math.round(10 * area_acres)} kg`, timing: 'Basal', for: 'All crops in zinc-deficient soils' },
        { nutrient: 'Borax', dose: `${Math.round(5 * area_acres)} kg`, timing: 'Basal', for: 'Cotton, Groundnut, Sunflower' },
        ...(soil_type === 'red' ? [{ nutrient: 'Ferrous Sulphate', dose: `${Math.round(25 * area_acres)} kg`, timing: 'Foliar spray', for: 'Iron deficiency in red soils' }] : []),
      ],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/crop/irrigation-schedule — Irrigation water requirement calculator
router.post('/crop/irrigation-schedule', (req, res) => {
  try {
    const {
      crop = 'paddy',
      area_acres = 5,
      growth_stage = 'vegetative', // seedling, vegetative, flowering, grain_filling, maturity
      irrigation_method = 'flood', // flood, furrow, sprinkler, drip
      soil_type = 'black',
      current_temp_c = 32,
      last_rain_days = 5,
    } = req.body;

    // Crop water requirement (mm per day) by growth stage
    const cropWater = {
      paddy: { seedling: 5, vegetative: 8, flowering: 10, grain_filling: 7, maturity: 3 },
      cotton: { seedling: 3, vegetative: 5, flowering: 7, grain_filling: 5, maturity: 2 },
      maize: { seedling: 3, vegetative: 6, flowering: 8, grain_filling: 5, maturity: 2 },
      groundnut: { seedling: 3, vegetative: 4, flowering: 6, grain_filling: 4, maturity: 2 },
      chilli: { seedling: 3, vegetative: 5, flowering: 6, grain_filling: 5, maturity: 3 },
      tomato: { seedling: 3, vegetative: 5, flowering: 7, grain_filling: 5, maturity: 3 },
      sugarcane: { seedling: 4, vegetative: 7, flowering: 8, grain_filling: 6, maturity: 3 },
      onion: { seedling: 3, vegetative: 4, flowering: 5, grain_filling: 4, maturity: 2 },
    };

    const efficiency = { flood: 0.5, furrow: 0.65, sprinkler: 0.75, drip: 0.9 };
    const soilMultiplier = { sandy: 1.3, red: 1.1, black: 0.9, alluvial: 1.0, laterite: 1.2 };

    const data = cropWater[crop] || cropWater.paddy;
    const daily_water_mm = data[growth_stage] || 5;
    const tempFactor = current_temp_c > 35 ? 1.2 : current_temp_c > 30 ? 1.1 : 1.0;
    const adjusted_mm = Math.round(daily_water_mm * tempFactor * (soilMultiplier[soil_type] || 1) * 10) / 10;
    const gross_mm = Math.round(adjusted_mm / (efficiency[irrigation_method] || 0.6) * 10) / 10;

    // Convert to practical units
    const litres_per_acre_per_day = Math.round(gross_mm * 4047); // 1mm over 1 acre = 4047 litres
    const total_litres_daily = litres_per_acre_per_day * area_acres;
    const hours_pump_5hp = Math.round(total_litres_daily / 15000 * 10) / 10; // 5HP pump ~ 15000 L/hr

    // Irrigation interval
    const soil_moisture_days = { sandy: 2, red: 3, black: 5, alluvial: 4, laterite: 3 };
    const interval = soil_moisture_days[soil_type] || 3;
    const needs_irrigation = last_rain_days >= interval;

    // Monthly schedule
    const irrigations_per_month = Math.ceil(30 / interval);
    const monthly_water_litres = total_litres_daily * irrigations_per_month;
    const monthly_electricity_units = Math.round(hours_pump_5hp * irrigations_per_month * 3.73); // 5HP = 3.73 kW

    res.json({
      requirement: {
        crop_water_mm_per_day: daily_water_mm,
        adjusted_mm_per_day: adjusted_mm,
        gross_mm_per_day: gross_mm,
        litres_per_acre_per_day: litres_per_acre_per_day,
        total_daily_litres: total_litres_daily,
        pump_hours_5hp: hours_pump_5hp,
      },
      schedule: {
        irrigation_interval_days: interval,
        irrigations_per_month: irrigations_per_month,
        needs_irrigation_now: needs_irrigation,
        reason: needs_irrigation ? `Last rain ${last_rain_days} days ago, soil needs water` : `Soil still has moisture (irrigate after ${interval - last_rain_days} days)`,
      },
      monthly_estimate: {
        total_water_litres: monthly_water_litres,
        electricity_units: monthly_electricity_units,
        electricity_cost: Math.round(monthly_electricity_units * 7), // ₹7/unit average
        diesel_cost_alternative: Math.round(hours_pump_5hp * irrigations_per_month * 120), // diesel genset
      },
      efficiency_comparison: Object.entries(efficiency).map(([method, eff]) => ({
        method,
        efficiency_pct: Math.round(eff * 100),
        water_saved_vs_flood: method === 'flood' ? '—' : `${Math.round((1 - efficiency.flood / eff) * 100)}% less water`,
        monthly_litres: Math.round(adjusted_mm / eff * 4047 * area_acres * irrigations_per_month),
      })),
      tips: [
        growth_stage === 'flowering' ? '⚠️ Critical stage — do not skip irrigation' : '',
        current_temp_c > 35 ? 'Irrigate in early morning or evening to reduce evaporation' : '',
        irrigation_method === 'flood' ? 'Consider drip irrigation — saves 40-50% water and increases yield 20%' : '',
        soil_type === 'sandy' ? 'Light frequent irrigations better than heavy infrequent' : '',
      ].filter(Boolean),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/crop/break-even — Break-even analysis
router.post('/crop/break-even', (req, res) => {
  try {
    const {
      crop = 'paddy',
      area_acres = 5,
      total_fixed_cost = 0, // land rent, equipment
      total_variable_cost = 0, // seeds, fertilizer, labor per acre
      expected_yield_qtl_per_acre = 25,
      current_market_price = 2200,
    } = req.body;

    // Default costs if not provided
    const defaults = {
      paddy: { fixed: 10000, variable: 30000 },
      cotton: { fixed: 12000, variable: 35000 },
      maize: { fixed: 8000, variable: 25000 },
      groundnut: { fixed: 10000, variable: 30000 },
      chilli: { fixed: 15000, variable: 50000 },
      tomato: { fixed: 15000, variable: 55000 },
    };

    const cropDef = defaults[crop] || defaults.paddy;
    const fixed = total_fixed_cost || (cropDef.fixed * area_acres);
    const variable = total_variable_cost || (cropDef.variable * area_acres);
    const total_cost = fixed + variable;
    const total_yield = expected_yield_qtl_per_acre * area_acres;

    // Break-even price (minimum price needed to cover costs)
    const breakeven_price = total_yield > 0 ? Math.round(total_cost / total_yield) : 0;

    // Break-even yield (minimum yield needed at current price)
    const breakeven_yield = current_market_price > 0 ? Math.round(total_cost / current_market_price) : 0;

    // Margin of safety
    const revenue = total_yield * current_market_price;
    const profit = revenue - total_cost;
    const margin_of_safety_price = Math.round(((current_market_price - breakeven_price) / current_market_price) * 100);
    const margin_of_safety_yield = Math.round(((total_yield - breakeven_yield) / total_yield) * 100);

    // Scenario analysis
    const scenarios = [
      { label: 'Best Case (+20% yield, +10% price)', yield_factor: 1.2, price_factor: 1.1 },
      { label: 'Normal', yield_factor: 1.0, price_factor: 1.0 },
      { label: 'Below Average (-15% yield)', yield_factor: 0.85, price_factor: 1.0 },
      { label: 'Worst Case (-30% yield, -20% price)', yield_factor: 0.7, price_factor: 0.8 },
      { label: 'Drought (-50% yield)', yield_factor: 0.5, price_factor: 1.1 },
    ].map(s => {
      const y = Math.round(total_yield * s.yield_factor);
      const p = Math.round(current_market_price * s.price_factor);
      const r = y * p;
      return { ...s, yield_qtl: y, price: p, revenue: r, profit: r - total_cost, status: r >= total_cost ? '✓ Profit' : '✗ Loss' };
    });

    res.json({
      breakeven: {
        breakeven_price_per_qtl: breakeven_price,
        breakeven_yield_qtl: breakeven_yield,
        current_market_price,
        total_yield_qtl: total_yield,
      },
      profitability: {
        total_cost,
        total_revenue: revenue,
        net_profit: profit,
        margin_of_safety_price_pct: margin_of_safety_price,
        margin_of_safety_yield_pct: margin_of_safety_yield,
        status: profit >= 0 ? 'PROFITABLE' : 'LOSS',
      },
      scenarios,
      advice: profit >= 0
        ? margin_of_safety_price < 15
          ? 'Thin margins — consider crop insurance to protect against price drops'
          : 'Good margins. Consider forward contracts to lock in current prices.'
        : `Need price ≥ ₹${breakeven_price}/qtl or yield ≥ ${Math.ceil(breakeven_yield / area_acres)} qtl/acre to breakeven.`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/crop/spray-schedule — Pesticide/spray schedule generator
router.post('/crop/spray-schedule', (req, res) => {
  try {
    const {
      crop = 'paddy',
      area_acres = 5,
      growth_stage = 'vegetative', // seedling, vegetative, flowering, fruit_setting, maturity
      pest_observed = 'none', // none, stem_borer, leaf_folder, bph, aphids, bollworm, fruit_borer, mites
      disease_observed = 'none', // none, blast, blight, wilt, rust, powdery_mildew
      last_spray_days = 10,
      organic_preference = false,
    } = req.body;

    // Comprehensive spray protocols
    const protocols = {
      paddy: {
        preventive: [
          { day: 20, spray: 'Carbendazim 1g/L', target: 'Blast prevention', phi: 14 },
          { day: 35, spray: 'Chlorantraniliprole 0.3ml/L', target: 'Stem borer', phi: 21 },
          { day: 50, spray: 'Propiconazole 1ml/L', target: 'Sheath blight', phi: 21 },
          { day: 65, spray: 'Thiamethoxam 0.2g/L', target: 'BPH/WBPH', phi: 14 },
          { day: 80, spray: 'Tricyclazole 0.6g/L', target: 'Neck blast', phi: 28 },
        ],
        curative: {
          stem_borer: { spray: 'Chlorantraniliprole 18.5% SC @ 0.3ml/L', dose_per_acre: '60ml in 200L water', repeat: 'After 15 days if infestation continues' },
          leaf_folder: { spray: 'Cartap Hydrochloride 4G @ 10kg/acre', dose_per_acre: '10kg granules', repeat: 'Single application' },
          bph: { spray: 'Pymetrozine 50% WG @ 0.3g/L directed at base', dose_per_acre: '60g in 200L water', repeat: 'After 10 days' },
          blast: { spray: 'Tricyclazole 75% WP @ 0.6g/L', dose_per_acre: '120g in 200L water', repeat: 'After 7-10 days' },
          blight: { spray: 'Hexaconazole 5% EC @ 2ml/L', dose_per_acre: '400ml in 200L water', repeat: 'After 10 days' },
        },
      },
      cotton: {
        preventive: [
          { day: 25, spray: 'Imidacloprid 0.3ml/L', target: 'Sucking pests', phi: 14 },
          { day: 40, spray: 'Emamectin Benzoate 0.4g/L', target: 'Bollworm', phi: 14 },
          { day: 55, spray: 'Profenofos + Cypermethrin 2ml/L', target: 'Bollworm complex', phi: 21 },
          { day: 70, spray: 'Fipronil 2ml/L', target: 'Late season pests', phi: 21 },
        ],
        curative: {
          bollworm: { spray: 'Emamectin Benzoate 5% SG @ 0.4g/L', dose_per_acre: '80g in 200L', repeat: 'After 10 days' },
          aphids: { spray: 'Thiamethoxam 25% WG @ 0.2g/L', dose_per_acre: '40g in 200L', repeat: 'After 7 days' },
          wilt: { spray: 'Carbendazim 2g/L drench', dose_per_acre: '200g in 200L as soil drench', repeat: 'After 15 days' },
        },
      },
      chilli: {
        preventive: [
          { day: 15, spray: 'Imidacloprid 0.3ml/L', target: 'Thrips/Aphids', phi: 14 },
          { day: 30, spray: 'Mancozeb 2.5g/L', target: 'Leaf spot', phi: 14 },
          { day: 45, spray: 'Chlorfenapyr 1ml/L', target: 'Mites', phi: 21 },
          { day: 60, spray: 'Emamectin + Carbendazim', target: 'Fruit borer + Anthracnose', phi: 21 },
        ],
        curative: {
          fruit_borer: { spray: 'Chlorantraniliprole 0.3ml/L', dose_per_acre: '60ml in 200L', repeat: 'After 12 days' },
          mites: { spray: 'Spiromesifen 22.9% SC @ 0.8ml/L', dose_per_acre: '160ml in 200L', repeat: 'After 10 days' },
          powdery_mildew: { spray: 'Dinocap 1ml/L + Sulphur 3g/L', dose_per_acre: '200ml + 600g in 200L', repeat: 'After 10 days' },
        },
      },
    };

    const cropProtocol = protocols[crop] || protocols.paddy;
    let recommendation = {};

    if (pest_observed !== 'none' || disease_observed !== 'none') {
      const issue = pest_observed !== 'none' ? pest_observed : disease_observed;
      recommendation = cropProtocol.curative[issue] || { spray: 'Consult local agriculture officer', dose_per_acre: 'As directed', repeat: 'Based on severity' };
      recommendation.type = 'CURATIVE';
      recommendation.urgency = 'Spray within 24-48 hours';
    } else {
      // Next preventive spray
      const nextSpray = cropProtocol.preventive.find(s => last_spray_days >= 7) || cropProtocol.preventive[0];
      recommendation = { ...nextSpray, type: 'PREVENTIVE', urgency: last_spray_days > 12 ? 'Due for spray' : `Wait ${12 - last_spray_days} more days` };
    }

    // Organic alternatives
    const organicAlts = {
      stem_borer: 'Trichogramma cards (1 lakh eggs/acre) + Neem oil 5ml/L',
      bollworm: 'NPV (Nuclear Polyhedrosis Virus) 500 LE/acre + Pheromone traps',
      aphids: 'Neem oil 5ml/L + Verticillium lecanii 5g/L',
      bph: 'Neem oil 3ml/L + Beauveria bassiana 5g/L',
      mites: 'Sulphur 3g/L + Neem oil 3ml/L',
      blast: 'Pseudomonas fluorescens 10g/L + Trichoderma viride 5g/L',
      blight: 'Copper Oxychloride 3g/L (organic approved)',
      fruit_borer: 'Bt (Bacillus thuringiensis) 1g/L + Neem seed kernel extract 5%',
    };

    res.json({
      recommendation,
      spray_cost_estimate: {
        chemical_cost: Math.round(area_acres * 800),
        labor_cost: Math.round(area_acres * 300),
        total: Math.round(area_acres * 1100),
      },
      organic_alternative: organic_preference || pest_observed !== 'none' ? {
        suggestion: organicAlts[pest_observed] || organicAlts[disease_observed] || 'Neem oil 5ml/L + Pseudomonas 10g/L general spray',
        cost: Math.round(area_acres * 1200),
        effectiveness: '70-85% compared to chemical',
      } : null,
      preventive_calendar: cropProtocol.preventive,
      safety_precautions: [
        'Wear protective gear: mask, gloves, long sleeves',
        'Spray in early morning (6-9 AM) or evening (4-6 PM)',
        'Do not spray against wind direction',
        `PHI (Pre-Harvest Interval): ${recommendation.phi || 14} days — do not harvest before this period`,
        'Triple-rinse empty containers and dispose safely',
      ],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calculators/crop/yield-prediction — Yield prediction based on inputs
router.post('/crop/yield-prediction', (req, res) => {
  try {
    const {
      crop = 'paddy',
      area_acres = 5,
      soil_type = 'black',
      irrigation_type = 'canal',
      fertilizer_applied_pct = 100, // % of recommended dose
      pest_incidence = 'low', // none, low, moderate, severe
      rainfall_status = 'normal', // deficit, normal, excess
      seed_quality = 'certified', // farm_saved, certified, hybrid
      sowing_time = 'optimal', // early, optimal, late
    } = req.body;

    // Base yields (qtl/acre) - AP/Telangana averages
    const baseYields = {
      paddy: 25, cotton: 10, maize: 30, groundnut: 15, chilli: 18, tomato: 100, sugarcane: 350, soybean: 12, onion: 100, turmeric: 80,
    };

    const base = baseYields[crop] || 20;

    // Multiplier factors
    const irrFactor = { rainfed: 0.7, canal: 1.0, borewell: 1.1, drip: 1.2 }[irrigation_type] || 1;
    const soilFactor = { black: 1.05, alluvial: 1.0, red: 0.9, sandy: 0.8, laterite: 0.85 }[soil_type] || 1;
    const fertFactor = fertilizer_applied_pct >= 100 ? 1.0 : fertilizer_applied_pct >= 75 ? 0.9 : fertilizer_applied_pct >= 50 ? 0.75 : 0.6;
    const pestFactor = { none: 1.0, low: 0.95, moderate: 0.8, severe: 0.6 }[pest_incidence] || 1;
    const rainFactor = { deficit: 0.7, normal: 1.0, excess: 0.85 }[rainfall_status] || 1;
    const seedFactor = { farm_saved: 0.85, certified: 1.0, hybrid: 1.15 }[seed_quality] || 1;
    const sowingFactor = { early: 0.9, optimal: 1.0, late: 0.85 }[sowing_time] || 1;

    const predicted = Math.round(base * irrFactor * soilFactor * fertFactor * pestFactor * rainFactor * seedFactor * sowingFactor * 10) / 10;
    const total_predicted = Math.round(predicted * area_acres);

    // Revenue estimate
    const prices = { paddy: 2200, cotton: 6500, maize: 1800, groundnut: 5500, chilli: 12000, tomato: 1500, sugarcane: 350, soybean: 4500, onion: 2000, turmeric: 8000 };
    const price = prices[crop] || 2000;
    const estimated_revenue = total_predicted * price;

    // Confidence range
    const confidence_low = Math.round(predicted * 0.85);
    const confidence_high = Math.round(predicted * 1.15);

    // Limiting factors
    const factors = [
      { factor: 'Irrigation', score: irrFactor, impact: irrFactor < 1 ? 'negative' : irrFactor > 1 ? 'positive' : 'neutral' },
      { factor: 'Soil', score: soilFactor, impact: soilFactor < 1 ? 'negative' : soilFactor > 1 ? 'positive' : 'neutral' },
      { factor: 'Fertilizer', score: fertFactor, impact: fertFactor < 1 ? 'negative' : 'neutral' },
      { factor: 'Pest', score: pestFactor, impact: pestFactor < 1 ? 'negative' : 'neutral' },
      { factor: 'Rainfall', score: rainFactor, impact: rainFactor < 1 ? 'negative' : 'neutral' },
      { factor: 'Seed Quality', score: seedFactor, impact: seedFactor < 1 ? 'negative' : seedFactor > 1 ? 'positive' : 'neutral' },
      { factor: 'Sowing Time', score: sowingFactor, impact: sowingFactor < 1 ? 'negative' : 'neutral' },
    ];

    const limitingFactors = factors.filter(f => f.impact === 'negative').sort((a, b) => a.score - b.score);

    res.json({
      prediction: {
        yield_per_acre: predicted,
        total_yield_qtl: total_predicted,
        confidence_range: { low: confidence_low * area_acres, high: confidence_high * area_acres },
        base_potential: base,
        achieved_pct: Math.round((predicted / base) * 100),
      },
      revenue_estimate: {
        price_per_qtl: price,
        estimated_revenue,
        revenue_range: { low: confidence_low * area_acres * price, high: confidence_high * area_acres * price },
      },
      factors,
      limiting_factors: limitingFactors,
      improvement_suggestions: limitingFactors.map(f => {
        if (f.factor === 'Irrigation') return 'Switch to drip/sprinkler irrigation for 20% yield improvement';
        if (f.factor === 'Fertilizer') return 'Apply full recommended dose of NPK fertilizers';
        if (f.factor === 'Pest') return 'Implement IPM (Integrated Pest Management) with regular scouting';
        if (f.factor === 'Rainfall') return 'Install rain-water harvesting or supplemental irrigation';
        if (f.factor === 'Seed Quality') return 'Use certified/hybrid seeds from authorized dealers';
        if (f.factor === 'Sowing Time') return 'Plan sowing within optimal window for your region';
        if (f.factor === 'Soil') return 'Add organic matter (FYM/compost) to improve soil health';
        return '';
      }),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/calculators/reference-data — Reference data for calculator dropdowns
router.get('/reference-data', (req, res) => {
  res.json({
    aqua_species: [
      { id: 'vannamei', name: 'Vannamei Shrimp', scientific: 'Litopenaeus vannamei' },
      { id: 'tiger_prawn', name: 'Tiger Prawn', scientific: 'Penaeus monodon' },
      { id: 'pangasius', name: 'Pangasius', scientific: 'Pangasianodon hypophthalmus' },
      { id: 'tilapia', name: 'Tilapia', scientific: 'Oreochromis niloticus' },
    ],
    crops: [
      { id: 'paddy', name: 'Paddy/Rice', season: 'kharif,rabi' },
      { id: 'cotton', name: 'Cotton', season: 'kharif' },
      { id: 'maize', name: 'Maize', season: 'kharif,rabi' },
      { id: 'groundnut', name: 'Groundnut', season: 'kharif,rabi' },
      { id: 'chilli', name: 'Chilli', season: 'kharif,rabi' },
      { id: 'tomato', name: 'Tomato', season: 'rabi' },
      { id: 'sugarcane', name: 'Sugarcane', season: 'all' },
      { id: 'soybean', name: 'Soybean', season: 'kharif' },
      { id: 'turmeric', name: 'Turmeric', season: 'kharif' },
      { id: 'onion', name: 'Onion', season: 'rabi' },
    ],
    culture_systems: ['extensive', 'semi-intensive', 'intensive', 'super-intensive'],
    irrigation_types: ['rainfed', 'canal', 'borewell', 'drip'],
    soil_types: ['black', 'red', 'alluvial', 'sandy', 'laterite'],
    growth_stages: ['seedling', 'vegetative', 'flowering', 'grain_filling', 'maturity'],
    diseases_aqua: ['white_spot', 'EHP', 'vibriosis', 'loose_shell', 'running_mortality'],
  });
});

module.exports = router;
