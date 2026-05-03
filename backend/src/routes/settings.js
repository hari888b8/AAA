'use strict';

/**
 * Feature Flags & User Preferences API
 * Provides feature flag evaluation and user preference management.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware, del } = require('../services/cache');

// GET /api/settings/feature-flags — Get active feature flags for current user
router.get('/feature-flags', authMiddleware, cacheMiddleware(300), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT flag_key, description, rollout_pct, metadata 
       FROM feature_flags 
       WHERE is_enabled = true 
       AND ($1 = ANY(target_roles) OR cardinality(target_roles) = 0)`,
      [req.user.role || 'farmer']
    );

    // Evaluate rollout percentage per user (deterministic hash)
    const flags = {};
    for (const flag of rows) {
      if (flag.rollout_pct >= 100) {
        flags[flag.flag_key] = true;
      } else if (flag.rollout_pct <= 0) {
        flags[flag.flag_key] = false;
      } else {
        // Simple deterministic rollout based on user ID hash
        const hash = simpleHash(req.user.id + flag.flag_key);
        flags[flag.flag_key] = (hash % 100) < flag.rollout_pct;
      }
    }

    res.json({ flags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/preferences — Get user preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );

    if (rows.length === 0) {
      // Return defaults
      return res.json({
        preferences: {
          language: 'en',
          theme: 'light',
          notifications_enabled: true,
          price_alerts_enabled: true,
          weather_alerts_enabled: true,
          voice_input_enabled: false,
          offline_mode: true,
          units_weight: 'kg',
          units_area: 'acres',
        }
      });
    }

    res.json({ preferences: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/preferences — Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const allowed = ['language', 'theme', 'notifications_enabled', 'price_alerts_enabled',
      'weather_alerts_enabled', 'voice_input_enabled', 'offline_mode', 'units_weight', 'units_area'];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`);
    const values = Object.values(updates);

    const { rows } = await pool.query(
      `INSERT INTO user_preferences (user_id, ${Object.keys(updates).join(', ')})
       VALUES ($1, ${values.map((_, i) => `$${i + 2}`).join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET ${setClauses.join(', ')}, updated_at = NOW()
       RETURNING *`,
      [req.user.id, ...values]
    );

    // Invalidate cached feature flags on preference change
    await del(`api:/api/settings/feature-flags:${req.user.id}`);

    res.json({ preferences: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/device-token — Register FCM token for push notifications
router.post('/device-token', authMiddleware, async (req, res) => {
  try {
    const { fcm_token, device_type, device_model, app_version } = req.body;
    if (!fcm_token) return res.status(400).json({ error: 'fcm_token required' });

    await pool.query(
      `INSERT INTO device_tokens (user_id, fcm_token, device_type, device_model, app_version)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, fcm_token) DO UPDATE SET
         active = true, device_model = COALESCE($4, device_tokens.device_model),
         app_version = COALESCE($5, device_tokens.app_version), updated_at = NOW()`,
      [req.user.id, fcm_token, device_type || 'android', device_model, app_version]
    );

    res.json({ message: 'Device token registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/device-token — Deregister FCM token
router.delete('/device-token', authMiddleware, async (req, res) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) return res.status(400).json({ error: 'fcm_token required' });

    await pool.query(
      'UPDATE device_tokens SET active = false WHERE user_id = $1 AND fcm_token = $2',
      [req.user.id, fcm_token]
    );

    res.json({ message: 'Device token deregistered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/price-alerts — Get user's price alerts
router.get('/price-alerts', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pa.*, cc.name as crop_name, d.name as district_name
       FROM price_alerts pa
       LEFT JOIN crop_catalog cc ON pa.crop_id = cc.id
       LEFT JOIN districts d ON pa.district_id = d.id
       WHERE pa.user_id = $1 AND pa.is_active = true
       ORDER BY pa.created_at DESC`,
      [req.user.id]
    );
    res.json({ alerts: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/price-alerts — Create a price alert
router.post('/price-alerts', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, condition, target_price } = req.body;
    if (!crop_id || !target_price) {
      return res.status(400).json({ error: 'crop_id and target_price required' });
    }
    if (!['above', 'below'].includes(condition)) {
      return res.status(400).json({ error: 'condition must be "above" or "below"' });
    }

    const { rows } = await pool.query(
      `INSERT INTO price_alerts (user_id, crop_id, district_id, condition, target_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, crop_id, district_id || null, condition, target_price]
    );
    res.status(201).json({ alert: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/price-alerts/:id — Delete a price alert
router.delete('/price-alerts/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE price_alerts SET is_active = false WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple hash function for deterministic feature flag evaluation
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

module.exports = router;
