const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const VALID_DOC_TYPES = ['aadhaar', 'pan', 'gst', 'fssai', 'trade_license', 'fpo_certificate'];
const VALID_FLAG_TYPES = ['price_anomaly', 'fake_listing', 'impersonation', 'spam'];

function getBadgeLevel(score) {
  if (score >= 90) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 50) return 'silver';
  if (score >= 20) return 'bronze';
  return 'none';
}

// ─── POST /verification/request — Submit verification request ────────────────
router.post('/request', auth, async (req, res) => {
  try {
    const { document_type, document_url } = req.body;
    if (!document_type || !document_url) {
      return res.status(400).json({ error: 'document_type and document_url required' });
    }
    if (!VALID_DOC_TYPES.includes(document_type)) {
      return res.status(400).json({ error: `Invalid document_type. Must be one of: ${VALID_DOC_TYPES.join(', ')}` });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO verification_requests (id, user_id, document_type, document_url, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [id, req.user.id, document_type, document_url]
    );

    await pool.query(
      `UPDATE users SET verification_status = 'pending' WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /verification/status — Get user's verification status ───────────────
router.get('/status', auth, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT id, verification_status, trust_score FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requests = await pool.query(
      `SELECT * FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      verification_status: user.rows[0].verification_status,
      trust_score: user.rows[0].trust_score,
      requests: requests.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /verification/trust-score/:userId — Public trust score ──────────────
router.get('/trust-score/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await pool.query(
      `SELECT id, verification_status, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.rows[0];

    // Verification status score (40%)
    let verificationScore = 0;
    if (userData.verification_status === 'verified') verificationScore = 100;
    else if (userData.verification_status === 'pending') verificationScore = 30;

    // Average review rating (30%)
    const reviews = await pool.query(
      `SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating FROM reviews WHERE target_id = $1`,
      [userId]
    );
    const avgRating = parseFloat(reviews.rows[0].avg_rating) || 0;
    const reviewScore = (avgRating / 5) * 100;

    // Order completion rate (20%)
    const orders = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'completed') AS completed
       FROM orders WHERE seller_id = $1 OR buyer_id = $1`,
      [userId]
    );
    const totalOrders = parseInt(orders.rows[0].total) || 0;
    const completedOrders = parseInt(orders.rows[0].completed) || 0;
    const completionScore = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Account age (10%)
    const accountAgeDays = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const ageScore = Math.min(accountAgeDays / 365 * 100, 100);

    const trust_score = Math.round(
      verificationScore * 0.4 +
      reviewScore * 0.3 +
      completionScore * 0.2 +
      ageScore * 0.1
    );

    const badge_level = getBadgeLevel(trust_score);

    res.json({
      trust_score,
      breakdown: {
        verification: Math.round(verificationScore * 0.4),
        reviews: Math.round(reviewScore * 0.3),
        order_completion: Math.round(completionScore * 0.2),
        account_age: Math.round(ageScore * 0.1)
      },
      badge_level
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /verification/admin/review — Admin approve/reject ──────────────────
router.post('/admin/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { request_id, action, rejection_reason } = req.body;
    if (!request_id || !action) {
      return res.status(400).json({ error: 'request_id and action required' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve or reject' });
    }

    const vr = await pool.query(
      `SELECT * FROM verification_requests WHERE id = $1`,
      [request_id]
    );
    if (vr.rows.length === 0) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const request = vr.rows[0];

    if (action === 'approve') {
      await pool.query(
        `UPDATE verification_requests SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
        [req.user.id, request_id]
      );
      await pool.query(
        `UPDATE users SET verification_status = 'verified', kyc_verified_at = NOW() WHERE id = $1`,
        [request.user_id]
      );
    } else {
      await pool.query(
        `UPDATE verification_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2 WHERE id = $3`,
        [req.user.id, rejection_reason || '', request_id]
      );
      await pool.query(
        `UPDATE users SET verification_status = 'unverified' WHERE id = $1`,
        [request.user_id]
      );
    }

    const updated = await pool.query(
      `SELECT * FROM verification_requests WHERE id = $1`,
      [request_id]
    );

    res.json({ request: updated.rows[0], action });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /verification/badges/:userId — User badges ──────────────────────────
router.get('/badges/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await pool.query(
      `SELECT id, verification_status, trust_score FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.rows[0];
    const trustScore = userData.trust_score || 0;
    const badges = [];

    if (userData.verification_status === 'verified') {
      badges.push({ type: 'verification', label: 'Verified', icon: 'verified' });
    }

    const badge_level = getBadgeLevel(trustScore);
    if (badge_level !== 'none') {
      badges.push({ type: 'trust_level', label: `${badge_level.charAt(0).toUpperCase() + badge_level.slice(1)} Seller`, level: badge_level });
    }

    res.json({ user_id: userId, badges, trust_score: trustScore, badge_level });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /verification/flag-fraud — Flag fraudulent activity ────────────────
router.post('/flag-fraud', auth, async (req, res) => {
  try {
    const { target_type, target_id, flag_type, details } = req.body;
    if (!target_type || !target_id || !flag_type) {
      return res.status(400).json({ error: 'target_type, target_id, and flag_type required' });
    }
    if (!VALID_FLAG_TYPES.includes(flag_type)) {
      return res.status(400).json({ error: `Invalid flag_type. Must be one of: ${VALID_FLAG_TYPES.join(', ')}` });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO fraud_flags (id, reporter_id, target_type, target_id, flag_type, details, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open') RETURNING *`,
      [id, req.user.id, target_type, target_id, flag_type, details || '']
    );

    res.status(201).json({ flag: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /verification/fraud-flags — Admin list fraud flags ──────────────────
router.get('/fraud-flags', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const flags = await pool.query(
      `SELECT f.*, u.name AS reporter_name
       FROM fraud_flags f JOIN users u ON f.reporter_id = u.id
       WHERE f.status = 'open'
       ORDER BY f.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM fraud_flags WHERE status = 'open'`
    );

    res.json({ flags: flags.rows, total: parseInt(count.rows[0].count), limit, offset });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
