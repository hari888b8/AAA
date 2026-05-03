'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// TRUST SCORE SYSTEM — Reputation, Verification, Leaderboard
// ═══════════════════════════════════════════════════════════════

// GET /api/trustscore/me — Get my trust score
router.get('/me', auth, async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM trust_scores WHERE user_id = $1', [req.user.id]);

    if (!result.rows.length) {
      // Create initial score
      result = await pool.query(`
        INSERT INTO trust_scores (user_id) VALUES ($1) RETURNING *
      `, [req.user.id]);
    }

    res.json({ trustScore: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trustscore/user/:userId — Get another user's trust score
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trust_scores WHERE user_id = $1', [req.params.userId]);
    if (!result.rows.length) return res.json({ trustScore: { overall_score: 50, verification_level: 'basic' } });
    res.json({ trustScore: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trustscore/leaderboard — Top trust scores
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { district_id, limit } = req.query;
    const maxResults = Math.min(parseInt(limit) || 20, 100);

    let query = `
      SELECT ts.*, u.name, u.phone
      FROM trust_scores ts
      JOIN users u ON u.id = ts.user_id
    `;
    const params = [];

    if (district_id) {
      query += ' WHERE u.district_id = $1';
      params.push(district_id);
    }

    query += ' ORDER BY ts.overall_score DESC LIMIT $' + (params.length + 1);
    params.push(maxResults);

    const result = await pool.query(query, params);
    res.json({ leaderboard: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trustscore/compute — Recompute trust score (internal/admin)
router.post('/compute', auth, async (req, res) => {
  try {
    const userId = req.body.user_id || req.user.id;

    // Compute factors from trade history
    const trades = await pool.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $2) as completed FROM orders WHERE seller_id = $1 OR buyer_id = $1',
      [userId, 'completed']
    );

    const totalTrades = parseInt(trades.rows[0].total) || 0;
    const completedTrades = parseInt(trades.rows[0].completed) || 0;
    const tradeScore = totalTrades > 0 ? Math.min(100, (completedTrades / totalTrades) * 100) : 50;
    const overallScore = Math.round((tradeScore * 0.4 + 50 * 0.6) * 100) / 100;

    const result = await pool.query(`
      INSERT INTO trust_scores (user_id, overall_score, trade_score, total_trades, last_computed)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        overall_score = $2, trade_score = $3, total_trades = $4, last_computed = NOW(), updated_at = NOW()
      RETURNING *
    `, [userId, overallScore, tradeScore, totalTrades]);

    res.json({ trustScore: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
