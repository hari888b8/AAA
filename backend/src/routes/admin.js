const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// Admin-only middleware
router.use(authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
});

// GET /api/admin/stats — platform-wide statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      userStats, orderStats, paymentStats,
      equipStats, listingStats, pondStats,
    ] = await Promise.all([
      pool.query(`SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role='farmer') as farmers,
        COUNT(*) FILTER (WHERE role='fpo') as fpos,
        COUNT(*) FILTER (WHERE role='buyer') as buyers,
        COUNT(*) FILTER (WHERE role='supplier') as suppliers,
        COUNT(*) FILTER (WHERE role='service_provider') as service_providers
        FROM users`),
      pool.query(`SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status='confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status='cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE status='pending') as pending_orders,
        COALESCE(AVG(total_amount),0) as avg_order_value
        FROM orders`).catch(() => ({ rows: [{}] })),
      pool.query(`SELECT
        COALESCE(SUM(amount) FILTER (WHERE status='paid'),0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status='paid' AND paid_at >= date_trunc('month', NOW())),0) as this_month_revenue
        FROM payment_orders`).catch(() => ({ rows: [{}] })),
      pool.query(`SELECT COUNT(*) as total_equipment FROM equipment`).catch(() => ({ rows: [{}] })),
      pool.query(`SELECT COUNT(*) as active_listings FROM supply_listings WHERE status='active'`).catch(() => ({ rows: [{}] })),
      pool.query(`SELECT COUNT(*) as active_ponds FROM ponds`).catch(() => ({ rows: [{}] })),
    ]);

    res.json({
      stats: {
        ...userStats.rows[0],
        ...orderStats.rows[0],
        ...paymentStats.rows[0],
        total_equipment: equipStats.rows[0]?.total_equipment || 0,
        active_listings: listingStats.rows[0]?.active_listings || 0,
        active_ponds: pondStats.rows[0]?.active_ponds || 0,
        avg_order_value: Math.round(orderStats.rows[0]?.avg_order_value || 0),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — list users with pagination
router.get('/users', async (req, res) => {
  try {
    const { limit = 20, offset = 0, role, search } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;
    if (role) { conditions.push(`role = $${i++}`); params.push(role); }
    if (search) {
      conditions.push(`(name ILIKE $${i} OR phone ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    params.push(parseInt(limit), parseInt(offset));
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT id, name, phone, role, status, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      params
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/status — suspend/activate user
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'status must be active or suspended' });
    const { rows } = await pool.query(
      `UPDATE users SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, status`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payments — recent payments
router.get('/payments', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await pool.query(
      `SELECT po.*, u.name as user_name, u.phone as user_phone
       FROM payment_orders po JOIN users u ON po.user_id = u.id
       ORDER BY po.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
