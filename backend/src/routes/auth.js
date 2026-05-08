'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const config = require('../lib/config');
const logger = require('../lib/logger');

const { sendOTP: sendSMS } = require('../services/sms');

const router = express.Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(userId) {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiry });
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid phone number' } });
    }
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await query(`DELETE FROM otps WHERE phone = $1`, [phone]);
    await query(
      `INSERT INTO otps (id, phone, code, expires_at) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), phone, code, expiresAt]
    );

    // Send OTP via SMS (MSG91 → Fast2SMS fallback)
    const smsResult = await sendSMS(phone, code);
    if (!smsResult.success && config.isProduction) {
      logger.error({ phone: phone.slice(-4), error: smsResult.error }, 'SMS delivery failed');
      return res.status(503).json({ error: { code: 'SMS_FAILED', message: 'Could not send OTP. Please try again.' } });
    }

    logger.info({ phone: phone.slice(-4), provider: smsResult.provider }, 'OTP sent');

    return res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    logger.error({ err }, 'Failed to send OTP');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to send OTP' } });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name, role } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Phone and OTP required' } });

    const otpResult = await query(
      `SELECT * FROM otps WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()`,
      [phone, otp]
    );
    if (!otpResult.rows.length) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid or expired OTP' } });

    // Mark OTP used
    await query(`UPDATE otps SET used = true WHERE id = $1`, [otpResult.rows[0].id]);

    // Upsert user
    let userResult = await query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    let user;
    if (!userResult.rows.length) {
      const insertResult = await query(
        `INSERT INTO users (id, phone, name, role, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING *`,
        [uuidv4(), phone, name || 'AgriHub User', role || 'farmer']
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
      await query(`UPDATE users SET last_active_at = NOW() WHERE id = $1`, [user.id]);
    }

    const token = signToken(user.id);
    const refreshToken = uuidv4();
    const refreshExpiry = new Date(Date.now() + config.jwt.refreshExpiry * 1000);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshToken, refreshExpiry]
    );

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        is_verified: user.is_verified,
        onboarding_completed: user.onboarding_completed,
      },
    });

    // Seed user_roles table on login (async, non-blocking)
    query(`INSERT INTO user_roles (id, user_id, role, is_active) VALUES ($1, $2, $3, true) ON CONFLICT (user_id, role) DO NOTHING`,
      [uuidv4(), user.id, user.role]).catch(() => {});
  } catch (err) {
    logger.error({ err }, 'OTP verification failed');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Verification failed' } });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await query(
      `SELECT rt.*, u.id as user_id FROM refresh_tokens rt 
       JOIN users u ON u.id = rt.user_id 
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid refresh token' });

    const token = signToken(result.rows[0].user_id);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, phone, name, role, is_verified, onboarding_completed, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0] || req.user;

    // Fetch all user roles
    const rolesResult = await query(
      'SELECT role, sub_type, is_active FROM user_roles WHERE user_id = $1 ORDER BY added_at',
      [req.user.id]
    );

    res.json({
      user,
      roles: rolesResult.rows,
      active_role: rolesResult.rows.find(r => r.is_active)?.role || user.role,
    });
  } catch (err) {
    res.json({ user: req.user });
  }
});

// PATCH /api/auth/me — update profile
router.patch('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { name, role } = req.body;
    const result = await query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role) WHERE id = $3 RETURNING id, phone, name, role, is_verified, onboarding_completed, created_at`,
      [name, role, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/auth/notifications
router.get('/notifications', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { limit = 30, offset = 0, unread_only } = req.query;
    let where = `user_id = $1`;
    if (unread_only === 'true') where += ` AND is_read = false`;
    const result = await query(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );
    const countResult = await query(`SELECT COUNT(*) FILTER (WHERE is_read = false) AS unread FROM notifications WHERE user_id = $1`, [req.user.id]);
    res.json({ notifications: result.rows, unread_count: parseInt(countResult.rows[0].unread || 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/notifications/:id/read
router.patch('/notifications/:id/read', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    await query(`UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/notifications/read-all
router.post('/notifications/read-all', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    await query(`UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`, [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
  res.json({ message: 'Logged out' });
});

// ═══════════════════════════════════════════════════════════════
// KYC ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/auth/kyc — Get KYC status & documents
router.get('/kyc', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT kyc_status, kyc_documents FROM (
        SELECT 'pending' as kyc_status, '[]'::jsonb as kyc_documents
      ) defaults
      UNION ALL
      SELECT COALESCE(fp.kyc_status, 'pending'), COALESCE(fp.kyc_documents, '[]'::jsonb)
      FROM farmer_profiles fp WHERE fp.user_id = $1
      LIMIT 1`, [req.user.id]
    );
    // Try farmer_profiles first, fallback to defaults
    let kyc = { status: 'pending', documents: [] };
    const profile = await query(
      `SELECT * FROM farmer_profiles WHERE user_id=$1`, [req.user.id]
    ).catch(() => ({ rows: [] }));
    if (profile.rows.length) {
      kyc.status = profile.rows[0].kyc_status || 'pending';
      kyc.documents = profile.rows[0].kyc_documents || [];
    }
    res.json({ kyc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/kyc/submit — Submit KYC document
router.post('/kyc/submit', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { doc_type, doc_url, doc_number_hash } = req.body;
    if (!doc_type) return res.status(400).json({ error: 'doc_type required' });

    const validTypes = ['aadhaar', 'pan', 'bank_passbook', 'land_pattadar', 'fpo_certificate', 'gst_certificate'];
    if (!validTypes.includes(doc_type)) return res.status(400).json({ error: 'Invalid document type' });

    // Ensure farmer_profiles exists
    await query(
      `INSERT INTO farmer_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [req.user.id]
    );

    // Add document to JSONB array
    const doc = { type: doc_type, url: doc_url || null, number_hash: doc_number_hash || null, status: 'submitted', submitted_at: new Date().toISOString() };
    await query(
      `UPDATE farmer_profiles SET
        kyc_documents = COALESCE(kyc_documents, '[]'::jsonb) || $2::jsonb,
        kyc_status = 'submitted',
        updated_at = NOW()
       WHERE user_id = $1`,
      [req.user.id, JSON.stringify([doc])]
    );

    res.json({ message: 'Document submitted for verification', document: doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/kyc/verify — Admin verifies KYC (simplified auto-verify for demo)
router.post('/kyc/verify', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    // In production this would be admin-only. For demo, auto-verify after docs submitted
    await query(
      `UPDATE farmer_profiles SET kyc_status='verified', updated_at=NOW() WHERE user_id=$1`,
      [req.user.id]
    );
    await query(
      `UPDATE users SET is_verified=true WHERE id=$1`, [req.user.id]
    );
    res.json({ message: 'KYC verified', status: 'verified' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/auth/language — Update language preference
router.patch('/language', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'te', 'hi'].includes(language)) return res.status(400).json({ error: 'Supported: en, te, hi' });
    await query(`UPDATE users SET language=$1, updated_at=NOW() WHERE id=$2`, [language, req.user.id]);
    res.json({ message: 'Language updated', language });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
