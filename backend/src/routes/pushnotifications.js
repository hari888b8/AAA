const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /api/notifications/register-device — save FCM token
router.post('/register-device', authMiddleware, async (req, res) => {
  try {
    const { fcm_token, platform = 'android', app_version } = req.body;
    if (!fcm_token) return res.status(400).json({ error: 'fcm_token required' });

    // Upsert token: one device per user (or multiple if needed)
    await query(`
      INSERT INTO device_tokens (id, user_id, fcm_token, platform, app_version, last_seen)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, fcm_token)
      DO UPDATE SET platform = $4, app_version = $5, last_seen = NOW(), active = true
    `, [uuidv4(), req.user.id, fcm_token, platform, app_version]);

    res.json({ message: 'Device registered for notifications' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/unregister-device
router.post('/unregister-device', authMiddleware, async (req, res) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) return res.status(400).json({ error: 'fcm_token required' });
    await query(`UPDATE device_tokens SET active = false WHERE user_id = $1 AND fcm_token = $2`, [req.user.id, fcm_token]);
    res.json({ message: 'Device unregistered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications — get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 30, offset = 0, unread_only } = req.query;
    let conditions = [`n.user_id = $1`];
    let params = [req.user.id];
    let i = 2;
    if (unread_only === 'true') { conditions.push(`n.read_at IS NULL`); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT n.*
      FROM notifications n
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    const unreadCount = await query(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`, [req.user.id]);

    res.json({ notifications: result.rows, unread_count: parseInt(unreadCount.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await query(`UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const result = await query(`UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL RETURNING id`, [req.user.id]);
    res.json({ message: `Marked ${result.rowCount} notifications as read` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Internal helper: create notification + send push (used by other routes)
const pushService = require('../services/push');

async function createNotification(userId, type, title, message, data = {}) {
  try {
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, data) VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), userId, type, title, message, JSON.stringify(data)]
    );

    // Send real push notification (non-blocking)
    pushService.sendToUser(userId, { title, body: message }, { type, ...data }).catch(() => {});
  } catch (err) {
    console.error('[Notifications] Error creating notification:', err.message);
  }
}

// POST /api/notifications/send — admin/system send notification
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { user_id, type, title, message, data } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'title and message required' });

    const targetUserId = user_id || req.user.id;
    await createNotification(targetUserId, type || 'system', title, message, data || {});

    res.status(201).json({ message: 'Notification created', sent_to: targetUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, createNotification };
