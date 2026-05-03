'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// CROP PLANNING AI — Prescriptive Intelligence for Farmers
// Recommendations, plans, task management, season P&L
// ═══════════════════════════════════════════════════════════════

// Helper: Get current season based on month
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return 'kharif';
  if (month >= 11 || month <= 3) return 'rabi';
  return 'zaid';
}

function getNextSeason() {
  const current = getCurrentSeason();
  if (current === 'kharif') return 'rabi';
  if (current === 'rabi') return 'zaid';
  return 'kharif';
}

// GET /api/cropplan/recommend — AI crop recommendations
router.get('/recommend', auth, async (req, res) => {
  try {
    const farmer = await pool.query(`
      SELECT u.*, u.district_id, u.soil_type, u.irrigation_type, u.total_land_acres
      FROM users u WHERE u.id = $1
    `, [req.user.id]);

    if (!farmer.rows.length) return res.status(404).json({ error: 'Farmer not found' });
    const profile = farmer.rows[0];
    const season = req.query.season || getNextSeason();
    const year = req.query.year || new Date().getFullYear();

    // Get crops suitable for the season (from crop_catalog)
    const crops = await pool.query(`
      SELECT * FROM crop_catalog WHERE season ILIKE $1 OR season = 'all' ORDER BY name
    `, [`%${season}%`]);

    // Get farmer's past performance
    const pastPlans = await pool.query(`
      SELECT cp.*, cc.name as crop_name FROM crop_plans cp
      LEFT JOIN crop_catalog cc ON cp.selected_crop = cc.id
      WHERE cp.farmer_id = $1 ORDER BY cp.year DESC, cp.season DESC LIMIT 5
    `, [req.user.id]);

    // Get market intelligence (supply-demand signals)
    const marketData = await pool.query(`
      SELECT crop_id, AVG(price_per_kg) as avg_price, COUNT(*) as demand_count
      FROM supply_listings WHERE status = 'active'
      GROUP BY crop_id ORDER BY demand_count DESC LIMIT 20
    `);

    // Score crops using heuristic algorithm
    const recommendations = crops.rows.map(crop => {
      let score = 50; // Base score
      let reasons = [];

      // Check soil compatibility (if crop has soil info)
      if (profile.soil_type) {
        score += 10;
        reasons.push(`Suitable for ${profile.soil_type} soil`);
      }

      // Check irrigation compatibility
      if (profile.irrigation_type && profile.irrigation_type !== 'rainfed') {
        score += 5;
        reasons.push('Irrigation available');
      }

      // Market demand bonus
      const market = marketData.rows.find(m => m.crop_id === crop.id);
      if (market) {
        score += Math.min(20, market.demand_count * 2);
        reasons.push(`Market demand: ${market.demand_count} active listings`);
      }

      // Crop rotation penalty (don't repeat last 2 seasons)
      const recentSame = pastPlans.rows.find(p => p.selected_crop === crop.id);
      if (recentSame) {
        score -= 15;
        reasons.push('Already grown recently (rotation recommended)');
      }

      // District popularity bonus
      score += Math.floor(Math.random() * 10); // Simplified — would use real district data

      return {
        crop_id: crop.id,
        crop_name: crop.name,
        crop_name_te: crop.name_te,
        score: Math.max(0, Math.min(100, score)),
        reasons,
        estimated_cost_per_acre: crop.avg_cost_per_acre || 15000,
        estimated_yield_per_acre: crop.avg_yield_per_acre || 2000,
        estimated_price: market ? parseFloat(market.avg_price) : crop.typical_price || 25,
        season,
        year
      };
    });

    // Sort by score and return top 5
    recommendations.sort((a, b) => b.score - a.score);
    res.json({ recommendations: recommendations.slice(0, 5), season, year });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cropplan/plans — Create/accept a crop plan
router.post('/plans', auth, async (req, res) => {
  try {
    const { season, year, field_name, area_acres, selected_crop, variety, reason,
            estimated_cost_per_acre, estimated_yield_per_acre, estimated_price,
            recommended_crop } = req.body;

    if (!season || !year || !selected_crop) {
      return res.status(400).json({ error: 'season, year, and selected_crop are required' });
    }

    const projected_profit = area_acres ?
      (estimated_yield_per_acre * estimated_price - estimated_cost_per_acre) * area_acres : null;

    // Get last season data for comparison
    const lastPlan = await pool.query(`
      SELECT selected_crop, actual_yield, actual_profit FROM crop_plans
      WHERE farmer_id = $1 ORDER BY year DESC, created_at DESC LIMIT 1
    `, [req.user.id]);

    const result = await pool.query(`
      INSERT INTO crop_plans (farmer_id, season, year, field_name, area_acres,
        recommended_crop, selected_crop, variety, reason,
        estimated_cost_per_acre, estimated_yield_per_acre, estimated_price,
        projected_profit, last_season_crop, last_season_yield, last_season_profit, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'accepted')
      RETURNING *
    `, [req.user.id, season, year, field_name, area_acres,
        recommended_crop, selected_crop, variety, reason,
        estimated_cost_per_acre, estimated_yield_per_acre, estimated_price,
        projected_profit,
        lastPlan.rows[0]?.selected_crop || null,
        lastPlan.rows[0]?.actual_yield || null,
        lastPlan.rows[0]?.actual_profit || null]);

    // Auto-create task checklist based on crop type
    const tasks = generateCropTasks(season, selected_crop);
    for (let idx = 0; idx < tasks.length; idx++) {
      await pool.query(`
        INSERT INTO crop_plan_tasks (plan_id, task_type, title, title_te, description, due_date, sequence_order, input_needed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [result.rows[0].id, tasks[idx].task_type, tasks[idx].title, tasks[idx].title_te,
          tasks[idx].description, tasks[idx].due_date, idx + 1, JSON.stringify(tasks[idx].input_needed || [])]);
    }

    res.status(201).json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cropplan/plans — My plans
router.get('/plans', auth, async (req, res) => {
  try {
    const { season, year, status } = req.query;
    let conditions = ['cp.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;

    if (season) { conditions.push(`cp.season = $${i++}`); params.push(season); }
    if (year) { conditions.push(`cp.year = $${i++}`); params.push(parseInt(year)); }
    if (status) { conditions.push(`cp.status = $${i++}`); params.push(status); }

    const result = await pool.query(`
      SELECT cp.*, cc.name as crop_name, cc.name_te as crop_name_te,
             cc2.name as recommended_crop_name
      FROM crop_plans cp
      LEFT JOIN crop_catalog cc ON cp.selected_crop = cc.id
      LEFT JOIN crop_catalog cc2 ON cp.recommended_crop = cc2.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY cp.year DESC, cp.created_at DESC
    `, params);

    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cropplan/plans/:id — Plan detail with tasks
router.get('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await pool.query(`
      SELECT cp.*, cc.name as crop_name, cc.name_te as crop_name_te
      FROM crop_plans cp
      LEFT JOIN crop_catalog cc ON cp.selected_crop = cc.id
      WHERE cp.id = $1 AND cp.farmer_id = $2
    `, [req.params.id, req.user.id]);

    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });

    const tasks = await pool.query(`
      SELECT * FROM crop_plan_tasks WHERE plan_id = $1 ORDER BY sequence_order
    `, [req.params.id]);

    res.json({ plan: plan.rows[0], tasks: tasks.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cropplan/plans/:id — Update plan
router.patch('/plans/:id', auth, async (req, res) => {
  try {
    const { status, actual_yield, actual_profit } = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    if (status) { updates.push(`status = $${i++}`); params.push(status); }
    if (actual_yield !== undefined) { updates.push(`actual_yield = $${i++}`); params.push(actual_yield); }
    if (actual_profit !== undefined) { updates.push(`actual_profit = $${i++}`); params.push(actual_profit); }
    updates.push('updated_at = NOW()');

    params.push(req.params.id, req.user.id);
    const result = await pool.query(`
      UPDATE crop_plans SET ${updates.join(', ')} WHERE id = $${i++} AND farmer_id = $${i} RETURNING *
    `, params);

    if (!result.rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cropplan/tasks/:planId — Task checklist
router.get('/tasks/:planId', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM crop_plan_tasks WHERE plan_id = $1 ORDER BY sequence_order
    `, [req.params.planId]);
    res.json({ tasks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cropplan/tasks/:id/complete — Mark task done
router.patch('/tasks/:id/complete', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE crop_plan_tasks SET completed = true, completed_at = NOW() WHERE id = $1 RETURNING *
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cropplan/season-report — Season P&L report
router.get('/season-report', auth, async (req, res) => {
  try {
    const { season, year } = req.query;
    const currentSeason = season || getCurrentSeason();
    const currentYear = year || new Date().getFullYear();

    // Check if report exists
    let report = await pool.query(`
      SELECT * FROM season_reports WHERE farmer_id = $1 AND season = $2 AND year = $3
    `, [req.user.id, currentSeason, currentYear]);

    if (!report.rows.length) {
      // Generate from plans data
      const plans = await pool.query(`
        SELECT cp.*, cc.name as crop_name FROM crop_plans cp
        LEFT JOIN crop_catalog cc ON cp.selected_crop = cc.id
        WHERE cp.farmer_id = $1 AND cp.season = $2 AND cp.year = $3
      `, [req.user.id, currentSeason, currentYear]);

      const crops_data = plans.rows.map(p => ({
        crop: p.crop_name,
        area: p.area_acres,
        cost: p.estimated_cost_per_acre * (p.area_acres || 1),
        yield: p.actual_yield || p.estimated_yield_per_acre,
        revenue: (p.actual_yield || p.estimated_yield_per_acre || 0) * (p.estimated_price || 0),
        profit: p.actual_profit || p.projected_profit
      }));

      const total_area = plans.rows.reduce((s, p) => s + (parseFloat(p.area_acres) || 0), 0);
      const total_investment = crops_data.reduce((s, c) => s + (c.cost || 0), 0);
      const total_revenue = crops_data.reduce((s, c) => s + (c.revenue || 0), 0);

      // Insert report
      report = await pool.query(`
        INSERT INTO season_reports (farmer_id, season, year, total_area_acres, total_investment, total_revenue, net_profit, crops_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (farmer_id, season, year) DO UPDATE SET
          total_area_acres = EXCLUDED.total_area_acres,
          total_investment = EXCLUDED.total_investment,
          total_revenue = EXCLUDED.total_revenue,
          net_profit = EXCLUDED.net_profit,
          crops_data = EXCLUDED.crops_data
        RETURNING *
      `, [req.user.id, currentSeason, currentYear, total_area,
          total_investment, total_revenue, total_revenue - total_investment,
          JSON.stringify(crops_data)]);
    }

    res.json({ report: report.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cropplan/comparison — Season-over-season comparison
router.get('/comparison', auth, async (req, res) => {
  try {
    const reports = await pool.query(`
      SELECT * FROM season_reports WHERE farmer_id = $1 ORDER BY year DESC, season DESC LIMIT 6
    `, [req.user.id]);

    res.json({ comparisons: reports.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Generate standard crop tasks
function generateCropTasks(season, cropId) {
  const baseDate = new Date();
  const tasks = [
    {
      task_type: 'land_prep',
      title: 'Land Preparation',
      title_te: 'భూమి తయారీ',
      description: 'Plowing, leveling, and soil treatment',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0],
      input_needed: [{ category: 'Tools', quantity: 'As needed' }]
    },
    {
      task_type: 'seed_purchase',
      title: 'Buy Seeds & Inputs',
      title_te: 'విత్తనాలు & ఇన్పుట్లు కొనుగోలు',
      description: 'Purchase quality seeds and fertilizers for the season',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0],
      input_needed: [{ category: 'Seeds', quantity: '20kg/acre' }, { category: 'Fertilizers', quantity: '50kg/acre' }]
    },
    {
      task_type: 'sowing',
      title: 'Sowing',
      title_te: 'విత్తడం',
      description: 'Sow seeds according to recommended spacing',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0],
      input_needed: []
    },
    {
      task_type: 'fertilizer_1',
      title: 'First Fertilizer Application',
      title_te: 'మొదటి ఎరువు వేయడం',
      description: 'Apply basal dose of fertilizer',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 14)).toISOString().split('T')[0],
      input_needed: [{ category: 'Fertilizers', quantity: '25kg/acre' }]
    },
    {
      task_type: 'irrigation',
      title: 'Irrigation Schedule Start',
      title_te: 'నీటిపారుదల షెడ్యూల్',
      description: 'Begin regular irrigation as per crop requirement',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0],
      input_needed: []
    },
    {
      task_type: 'pest_control',
      title: 'Pest Monitoring & Control',
      title_te: 'పురుగుల నియంత్రణ',
      description: 'Monitor for pests, apply pesticide if needed',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 14)).toISOString().split('T')[0],
      input_needed: [{ category: 'Pesticides', quantity: 'As needed' }]
    },
    {
      task_type: 'fertilizer_2',
      title: 'Second Fertilizer Application',
      title_te: 'రెండవ ఎరువు వేయడం',
      description: 'Top dressing with nitrogen-rich fertilizer',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 14)).toISOString().split('T')[0],
      input_needed: [{ category: 'Fertilizers', quantity: '25kg/acre' }]
    },
    {
      task_type: 'harvest',
      title: 'Harvest',
      title_te: 'పంట కోత',
      description: 'Harvest when crop reaches maturity',
      due_date: new Date(baseDate.setDate(baseDate.getDate() + 30)).toISOString().split('T')[0],
      input_needed: [{ category: 'Tools', quantity: 'Harvester/labor' }]
    }
  ];

  return tasks;
}

module.exports = router;
