const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'agrihub_secret_key';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    // In production: send via MSG91 / Fast2SMS. Dev: return OTP directly.
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await query(`DELETE FROM otps WHERE phone = $1`, [phone]);
    await query(
      `INSERT INTO otps (id, phone, code, expires_at) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), phone, code, expiresAt]
    );

    // Dev: return OTP in response. Production: send SMS, return { message: 'OTP sent' }
    const isDev = process.env.NODE_ENV !== 'production';
    return res.json({
      message: 'OTP sent successfully',
      ...(isDev && { otp: code, note: 'OTP visible in dev mode only' }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name, role } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    const otpResult = await query(
      `SELECT * FROM otps WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()`,
      [phone, otp]
    );
    if (!otpResult.rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

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
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
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
    res.json({ user: result.rows[0] || req.user });
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

module.exports = router;
