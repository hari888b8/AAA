'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { DATA_PURPOSES, SENSITIVE_CATEGORIES } = require('../middleware/dpdp');

// ═══════════════════════════════════════════════════════════════
// DPDP ACT 2023 COMPLIANCE — Consent, Erasure, Portability, Grievance
// ═══════════════════════════════════════════════════════════════

// GET /api/compliance/consents — List all my consents
router.get('/consents', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, purpose, status, granted_at, expires_at, data_categories, processing_description
       FROM user_consents WHERE user_id = $1 ORDER BY granted_at DESC`,
      [req.user.id]
    );
    res.json({
      consents: result.rows,
      available_purposes: Object.values(DATA_PURPOSES),
      sensitive_categories: SENSITIVE_CATEGORIES,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/consent/:purpose — Grant consent for a purpose
router.post('/consent/:purpose', auth, async (req, res) => {
  try {
    const { purpose } = req.params;
    const { data_categories, retention_days } = req.body;

    if (!Object.values(DATA_PURPOSES).includes(purpose)) {
      return res.status(400).json({ error: 'Invalid purpose code', valid_purposes: Object.values(DATA_PURPOSES) });
    }

    const expiresAt = retention_days
      ? new Date(Date.now() + retention_days * 86400000).toISOString()
      : null;

    const result = await pool.query(`
      INSERT INTO user_consents (user_id, purpose, status, data_categories, processing_description, expires_at, granted_at)
      VALUES ($1, $2, 'active', $3, $4, $5, NOW())
      ON CONFLICT (user_id, purpose) DO UPDATE SET
        status = 'active', data_categories = $3, expires_at = $5, granted_at = NOW()
      RETURNING *
    `, [
      req.user.id,
      purpose,
      JSON.stringify(data_categories || []),
      `Processing for: ${purpose}`,
      expiresAt,
    ]);

    res.status(201).json({ consent: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/compliance/consent/:purpose — Withdraw consent (DPDP Section 6)
router.delete('/consent/:purpose', auth, async (req, res) => {
  try {
    const { purpose } = req.params;
    await pool.query(
      `UPDATE user_consents SET status = 'withdrawn', withdrawn_at = NOW() 
       WHERE user_id = $1 AND purpose = $2`,
      [req.user.id, purpose]
    );
    res.json({ message: `Consent withdrawn for ${purpose}`, purpose });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/erasure — Right to erasure request (DPDP Section 12)
router.post('/erasure', auth, async (req, res) => {
  try {
    const { reason, data_categories } = req.body;

    const result = await pool.query(`
      INSERT INTO erasure_requests (user_id, reason, data_categories, status, requested_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING *
    `, [req.user.id, reason || 'User requested deletion', JSON.stringify(data_categories || ['all'])]);

    res.status(201).json({
      request: result.rows[0],
      message: 'Erasure request filed. Will be processed within 72 hours as per DPDP Act.',
      timeline: '72 hours',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/erasure — Check erasure request status
router.get('/erasure', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM erasure_requests WHERE user_id = $1 ORDER BY requested_at DESC',
      [req.user.id]
    );
    res.json({ requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/data-export — Data portability (DPDP Section 13)
router.get('/data-export', auth, async (req, res) => {
  try {
    // Collect all user data across tables
    const [profile, orders, wallet, consents, trades] = await Promise.all([
      pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]),
      pool.query('SELECT * FROM orders WHERE seller_id = $1 OR buyer_id = $1 LIMIT 1000', [req.user.id]),
      pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT * FROM user_consents WHERE user_id = $1', [req.user.id]),
      pool.query('SELECT * FROM trade_orders WHERE seller_id = $1 OR buyer_id = $1 LIMIT 500', [req.user.id]),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      format_version: '1.0',
      dpdp_reference: 'Section 13 - Right to Data Portability',
      user_profile: profile.rows[0] || {},
      orders: orders.rows,
      wallet: wallet.rows[0] || {},
      consents: consents.rows,
      trade_orders: trades.rows,
    };

    // Remove sensitive fields from export
    if (exportData.user_profile.password_hash) delete exportData.user_profile.password_hash;

    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/grievance — File a grievance (DPDP Section 14)
router.post('/grievance', auth, async (req, res) => {
  try {
    const { category, description, related_purpose } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    const result = await pool.query(`
      INSERT INTO dpdp_grievances (user_id, category, description, related_purpose, status, filed_at)
      VALUES ($1, $2, $3, $4, 'open', NOW())
      RETURNING *
    `, [req.user.id, category || 'general', description, related_purpose]);

    res.status(201).json({
      grievance: result.rows[0],
      message: 'Grievance filed. DPO will respond within 30 days as per DPDP Act.',
      dpo_email: 'dpo@agrihub.in',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/grievances — List my grievances
router.get('/grievances', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dpdp_grievances WHERE user_id = $1 ORDER BY filed_at DESC',
      [req.user.id]
    );
    res.json({ grievances: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/data-access-log — View who accessed my data
router.get('/data-access-log', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM data_access_log WHERE user_id = $1 ORDER BY accessed_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ access_log: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/breach-notifications — View breach notifications for user
router.get('/breach-notifications', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM breach_notifications WHERE affected_user_id = $1 OR affected_user_id IS NULL 
       ORDER BY notified_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
