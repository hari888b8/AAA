'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════
// OPEN API & INTEGRATION LAYER — API Keys, Webhooks, Docs
// ═══════════════════════════════════════════════════════════════

// POST /api/openapi/keys — Create API key
router.post('/keys', auth, async (req, res) => {
  try {
    const { name, permissions, rate_limit, expires_at } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const rawKey = 'agrihub_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const result = await pool.query(`
      INSERT INTO api_keys (partner_id, key_hash, name, permissions, rate_limit, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, permissions, rate_limit, is_active, expires_at, created_at
    `, [req.user.id, keyHash, name, JSON.stringify(permissions || ['read']),
        rate_limit || 1000, expires_at]);

    res.status(201).json({ apiKey: { ...result.rows[0], key: rawKey } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/openapi/keys — List my API keys
router.get('/keys', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, permissions, rate_limit, is_active, last_used_at, expires_at, created_at FROM api_keys WHERE partner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ apiKeys: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/openapi/keys/:id — Revoke API key
router.delete('/keys/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND partner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Key not found' });
    res.json({ message: 'API key revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/openapi/webhooks — Register webhook
router.post('/webhooks', auth, async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const secret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const result = await pool.query(`
      INSERT INTO webhooks (partner_id, url, events, secret_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, url, events, is_active, created_at
    `, [req.user.id, url, JSON.stringify(events || []), secretHash]);

    res.status(201).json({ webhook: { ...result.rows[0], secret } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/openapi/webhooks — List my webhooks
router.get('/webhooks', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, url, events, is_active, failure_count, created_at FROM webhooks WHERE partner_id = $1',
      [req.user.id]
    );
    res.json({ webhooks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/openapi/webhooks/:id — Remove webhook
router.delete('/webhooks/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM webhooks WHERE id = $1 AND partner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ message: 'Webhook removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/openapi/docs — API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: { title: 'AgriHub Open API', version: '1.0.0', description: 'Agriculture OS Platform API' },
    servers: [{ url: '/api' }],
    paths: {
      '/contracts': { get: { summary: 'List contracts' }, post: { summary: 'Create contract' } },
      '/finance/loans': { get: { summary: 'List loans' }, post: { summary: 'Apply for loan' } },
      '/exporter/orders': { get: { summary: 'List export orders' }, post: { summary: 'Create export order' } },
      '/satellite/fields': { get: { summary: 'Get field monitoring data' } },
      '/trustscore/me': { get: { summary: 'Get trust score' } },
    },
  });
});

module.exports = router;
