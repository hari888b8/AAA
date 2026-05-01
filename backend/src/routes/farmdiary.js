const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Activities ───────────────────────────────────────────────────────────────

router.get('/activities', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM farm_activities WHERE user_id = $1 ORDER BY activity_date DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

router.post('/activities', authMiddleware, async (req, res) => {
  const { type, crop, field, notes, activity_date } = req.body;
  if (!type) return res.status(400).json({ error: 'Activity type required' });
  try {
    const result = await query(
      `INSERT INTO farm_activities (user_id, type, crop, field, notes, activity_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, type, crop, field, notes, activity_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// ── Crops ────────────────────────────────────────────────────────────────────

router.get('/crops', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM farm_crops WHERE user_id = $1 ORDER BY sowing_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

router.post('/crops', authMiddleware, async (req, res) => {
  const { crop_name, variety, area_acres, field_name, sowing_date, expected_harvest } = req.body;
  if (!crop_name) return res.status(400).json({ error: 'Crop name required' });
  try {
    const result = await query(
      `INSERT INTO farm_crops (user_id, crop_name, variety, area_acres, field_name, sowing_date, expected_harvest)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, crop_name, variety, area_acres || 1, field_name, sowing_date, expected_harvest]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add crop' });
  }
});

// ── Expenses ─────────────────────────────────────────────────────────────────

router.get('/expenses', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM farm_expenses WHERE user_id = $1 ORDER BY expense_date DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/expenses', authMiddleware, async (req, res) => {
  const { category, description, amount, crop_id, expense_date } = req.body;
  if (!category || !amount) return res.status(400).json({ error: 'Category and amount required' });
  try {
    const result = await query(
      `INSERT INTO farm_expenses (user_id, category, description, amount, crop_id, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, category, description, Number(amount), crop_id, expense_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to log expense' });
  }
});

// ═══════════════════════════════════════════════════════════════
// WORKER TASK ASSIGNMENT — Assign & track field tasks
// ═══════════════════════════════════════════════════════════════

router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { worker_name, worker_phone, task_type, description, field, crop, due_date } = req.body;
    if (!task_type || !worker_name) return res.status(400).json({ error: 'task_type and worker_name required' });

    const result = await query(`
      INSERT INTO farm_tasks (user_id, worker_name, worker_phone, task_type, description, field, crop, due_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'assigned') RETURNING *
    `, [req.user.id, worker_name, worker_phone, task_type, description, field, crop, due_date]);
    res.status(201).json({ task: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT * FROM farm_tasks WHERE user_id = $1`;
    const params = [req.user.id];
    if (status) { q += ` AND status = $2`; params.push(status); }
    q += ` ORDER BY due_date ASC`;
    const result = await query(q, params);
    res.json({ tasks: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { status, completion_photo, notes } = req.body;
    const updates = [];
    const params = [req.params.id, req.user.id];
    let i = 3;
    if (status) { updates.push(`status = $${i++}`); params.push(status); }
    if (completion_photo) { updates.push(`completion_photo = $${i++}`); params.push(completion_photo); }
    if (notes) { updates.push(`notes = $${i++}`); params.push(notes); }
    if (status === 'completed') updates.push(`completed_at = NOW()`);

    if (!updates.length) return res.status(400).json({ error: 'No updates provided' });

    const result = await query(
      `UPDATE farm_tasks SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// PHOTO TIMELINE — Weekly crop progress photos
// ═══════════════════════════════════════════════════════════════

router.post('/photos', authMiddleware, async (req, res) => {
  try {
    const { photo_url, crop_id, field, notes, growth_stage } = req.body;
    if (!photo_url) return res.status(400).json({ error: 'photo_url required' });

    const result = await query(`
      INSERT INTO farm_photos (user_id, photo_url, crop_id, field, notes, growth_stage)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.user.id, photo_url, crop_id, field, notes, growth_stage]);
    res.status(201).json({ photo: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/photos', authMiddleware, async (req, res) => {
  try {
    const { crop_id, field } = req.query;
    let conditions = [`fp.user_id = $1`];
    let params = [req.user.id];
    let i = 2;
    if (crop_id) { conditions.push(`fp.crop_id = $${i++}`); params.push(crop_id); }
    if (field) { conditions.push(`fp.field = $${i++}`); params.push(field); }

    const result = await query(`
      SELECT fp.*, cc.name AS crop_name FROM farm_photos fp
      LEFT JOIN crop_catalog cc ON cc.id = fp.crop_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY fp.created_at DESC
    `, params);
    res.json({ photos: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// PROFITABILITY DASHBOARD — Per-field economics
// ═══════════════════════════════════════════════════════════════

router.get('/profitability', authMiddleware, async (req, res) => {
  try {
    const { crop_id, season } = req.query;

    // Get total expenses by category
    const expenses = await query(`
      SELECT category, SUM(amount) AS total
      FROM farm_expenses WHERE user_id = $1
      ${crop_id ? 'AND crop_id = $2' : ''}
      GROUP BY category
      ORDER BY total DESC
    `, crop_id ? [req.user.id, crop_id] : [req.user.id]);

    // Get total revenue (from sold crops)
    const revenue = await query(`
      SELECT COALESCE(SUM(fc.revenue), 0) AS total_revenue,
             COALESCE(SUM(fc.area_acres), 0) AS total_acres
      FROM farm_crops fc WHERE fc.user_id = $1 AND fc.revenue IS NOT NULL
      ${crop_id ? 'AND fc.crop_name = (SELECT name FROM crop_catalog WHERE id = $2)' : ''}
    `, crop_id ? [req.user.id, crop_id] : [req.user.id]);

    const totalExpenses = expenses.rows.reduce((sum, r) => sum + parseFloat(r.total), 0);
    const totalRevenue = parseFloat(revenue.rows[0]?.total_revenue) || 0;
    const totalAcres = parseFloat(revenue.rows[0]?.total_acres) || 1;

    res.json({
      expenses_by_category: expenses.rows,
      total_expenses: totalExpenses,
      total_revenue: totalRevenue,
      net_profit: totalRevenue - totalExpenses,
      profit_per_acre: (totalRevenue - totalExpenses) / totalAcres,
      roi_percentage: totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses * 100).toFixed(1) : 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// CHEMICAL USAGE REGISTER — Pesticide tracking for compliance
// ═══════════════════════════════════════════════════════════════

router.post('/chemical-usage', authMiddleware, async (req, res) => {
  try {
    const { product_name, active_ingredient, dosage, area_acres, crop, field, target_pest, safety_period_days } = req.body;
    if (!product_name || !dosage) return res.status(400).json({ error: 'product_name and dosage required' });

    const result = await query(`
      INSERT INTO chemical_usage (user_id, product_name, active_ingredient, dosage, area_acres, crop, field, target_pest, safety_period_days, applied_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW()) RETURNING *
    `, [req.user.id, product_name, active_ingredient, dosage, area_acres, crop, field, target_pest, safety_period_days]);
    res.status(201).json({ record: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/chemical-usage', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM chemical_usage WHERE user_id = $1 ORDER BY applied_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ records: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// EXPORT FOR BANK LOANS — Generate farming history report
// ═══════════════════════════════════════════════════════════════

router.get('/export/loan-report', authMiddleware, async (req, res) => {
  try {
    const [crops, expenses, activities] = await Promise.all([
      query(`SELECT * FROM farm_crops WHERE user_id = $1 ORDER BY sowing_date DESC LIMIT 20`, [req.user.id]),
      query(`SELECT category, SUM(amount) AS total FROM farm_expenses WHERE user_id = $1 GROUP BY category`, [req.user.id]),
      query(`SELECT type, COUNT(*) AS count FROM farm_activities WHERE user_id = $1 GROUP BY type`, [req.user.id]),
    ]);

    const totalInvestment = expenses.rows.reduce((s, r) => s + parseFloat(r.total), 0);

    res.json({
      report_type: 'Farming History Report for KCC/Crop Loan',
      generated_at: new Date().toISOString(),
      farmer_id: req.user.id,
      crops_grown: crops.rows,
      investment_summary: expenses.rows,
      total_investment: totalInvestment,
      activity_summary: activities.rows,
      total_activities: activities.rows.reduce((s, r) => s + parseInt(r.count), 0),
      recommendation: 'Based on consistent farming activity and investment records, this farmer demonstrates reliable agricultural operations.',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
