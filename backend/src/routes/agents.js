'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ═══════════════════════════════════════════════════════════════
// AGENT NETWORK — Registration, Assisted Onboarding, Commissions
// ═══════════════════════════════════════════════════════════════

// POST /api/agents/register — Register as field agent
router.post('/register', auth, async (req, res) => {
  try {
    const { name, phone, district_id, mandal, coverage_villages, agent_type, bank_account } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

    const result = await pool.query(`
      INSERT INTO agents (user_id, name, phone, district_id, mandal, coverage_villages, agent_type, bank_account)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.id, name, phone, district_id, mandal,
        JSON.stringify(coverage_villages || []), agent_type || 'field',
        JSON.stringify(bank_account || {})]);

    res.status(201).json({ agent: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already registered as agent' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/me — Get my agent profile
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents WHERE user_id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not registered as agent' });
    res.json({ agent: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/dashboard — Agent dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const agent = await pool.query('SELECT * FROM agents WHERE user_id = $1', [req.user.id]);
    if (!agent.rows.length) return res.status(404).json({ error: 'Not an agent' });

    const agentId = agent.rows[0].id;

    const activities = await pool.query(
      'SELECT COUNT(*) as total, activity_type FROM agent_activities WHERE agent_id = $1 GROUP BY activity_type',
      [agentId]
    );

    const commissions = await pool.query(
      "SELECT SUM(amount) as total_earned, SUM(amount) FILTER (WHERE status = 'pending') as pending FROM agent_commissions WHERE agent_id = $1",
      [agentId]
    );

    const recentActivities = await pool.query(
      'SELECT * FROM agent_activities WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 20',
      [agentId]
    );

    res.json({
      agent: agent.rows[0],
      activitySummary: activities.rows,
      commissions: commissions.rows[0],
      recentActivities: recentActivities.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/onboard-farmer — Assisted farmer onboarding
router.post('/onboard-farmer', auth, async (req, res) => {
  try {
    const agent = await pool.query('SELECT * FROM agents WHERE user_id = $1', [req.user.id]);
    if (!agent.rows.length) return res.status(403).json({ error: 'Not an agent' });

    const { farmer_name, farmer_phone, district_id, mandal, village } = req.body;
    if (!farmer_name || !farmer_phone) {
      return res.status(400).json({ error: 'farmer_name and farmer_phone required' });
    }

    const agentId = agent.rows[0].id;

    // Log activity
    const activity = await pool.query(`
      INSERT INTO agent_activities (agent_id, activity_type, details)
      VALUES ($1, 'onboarding', $2)
      RETURNING *
    `, [agentId, JSON.stringify({ farmer_name, farmer_phone, district_id, mandal, village })]);

    // Create commission
    await pool.query(`
      INSERT INTO agent_commissions (agent_id, activity_id, amount, commission_type)
      VALUES ($1, $2, 50, 'onboarding')
    `, [agentId, activity.rows[0].id]);

    // Update agent onboarded count
    await pool.query(
      'UPDATE agents SET total_onboarded = total_onboarded + 1, updated_at = NOW() WHERE id = $1',
      [agentId]
    );

    res.status(201).json({ activity: activity.rows[0], message: 'Farmer onboarding recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/commissions — Get my commissions
router.get('/commissions', auth, async (req, res) => {
  try {
    const agent = await pool.query('SELECT id FROM agents WHERE user_id = $1', [req.user.id]);
    if (!agent.rows.length) return res.status(404).json({ error: 'Not an agent' });

    const result = await pool.query(
      'SELECT * FROM agent_commissions WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 50',
      [agent.rows[0].id]
    );

    res.json({ commissions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
