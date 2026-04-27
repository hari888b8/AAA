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

module.exports = router;
