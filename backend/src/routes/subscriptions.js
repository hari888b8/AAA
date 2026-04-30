const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ─── GET /plans — List all available subscription plans ──────────────────────
router.get('/plans', async (req, res) => {
  try {
    const { role } = req.query;
    let query = `SELECT * FROM subscription_plans WHERE is_active = TRUE`;
    const params = [];
    if (role) {
      query += ` AND (target_role = $1 OR target_role IS NULL)`;
      params.push(role);
    }
    query += ` ORDER BY price_monthly ASC`;
    const { rows } = await pool.query(query, params);
    res.json({ plans: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /current — Get user's active subscription ──────────────────────────
router.get('/current', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT us.*, sp.name AS plan_name, sp.tier, sp.features, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > NOW()
       ORDER BY us.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ subscription: null, tier: 'free' });
    }
    res.json({ subscription: rows[0], tier: rows[0].tier });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST / — Subscribe to a plan ───────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { plan_id, billing_period = 'monthly', payment_order_id } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'plan_id is required' });

    // Get plan details
    const planResult = await pool.query(`SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE`, [plan_id]);
    if (planResult.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });

    const plan = planResult.rows[0];

    // Check for existing active subscription
    const existing = await pool.query(
      `SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      // Cancel existing before creating new
      await pool.query(
        `UPDATE user_subscriptions SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [existing.rows[0].id]
      );
    }

    // Calculate expiry
    const starts_at = new Date();
    const expires_at = new Date(starts_at);
    if (billing_period === 'yearly') {
      expires_at.setFullYear(expires_at.getFullYear() + 1);
    } else {
      expires_at.setMonth(expires_at.getMonth() + 1);
    }

    const { rows } = await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, payment_order_id, starts_at, expires_at)
       VALUES ($1, $2, 'active', $3, $4, $5) RETURNING *`,
      [req.user.id, plan_id, payment_order_id || null, starts_at, expires_at]
    );

    res.status(201).json({
      subscription: rows[0],
      plan_name: plan.name,
      tier: plan.tier,
      features: plan.features,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /cancel — Cancel subscription ─────────────────────────────────────
router.post('/cancel', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE user_subscriptions SET status = 'cancelled', auto_renew = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND status = 'active' RETURNING *`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No active subscription' });
    res.json({ subscription: rows[0], message: 'Subscription cancelled. Access continues until expiry.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /history — Subscription history ─────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT us.*, sp.name AS plan_name, sp.tier
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ history: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /check-feature — Check if user has access to feature ───────────────
router.post('/check-feature', auth, async (req, res) => {
  try {
    const { feature } = req.body;
    if (!feature) return res.status(400).json({ error: 'feature is required' });

    const { rows } = await pool.query(
      `SELECT sp.features, sp.limits, sp.tier
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > NOW()
       ORDER BY us.created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ has_access: false, tier: 'free', message: 'Upgrade to access this feature' });
    }

    const features = rows[0].features || [];
    const hasAccess = features.includes(feature) || features.includes('*');
    res.json({ has_access: hasAccess, tier: rows[0].tier, limits: rows[0].limits });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
