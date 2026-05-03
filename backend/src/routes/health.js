'use strict';

/**
 * Health & Monitoring Endpoints
 * Provides system health checks, readiness probes, and monitoring data.
 */

const express = require('express');
const { pool } = require('../db/pool');
const { getStats: getQueueStats } = require('../services/queue');
const { IS_PUSH_CONFIGURED } = require('../services/push');
const { IS_CLOUD_CONFIGURED } = require('../services/storage');
const { IS_CONFIGURED: IS_PAYMENT_CONFIGURED, IS_LIVE: IS_PAYMENT_LIVE } = require('../services/payments');

const router = express.Router();

const startTime = Date.now();

// GET /api/health — basic liveness probe
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// GET /api/health/ready — readiness probe (checks all dependencies)
router.get('/ready', async (req, res) => {
  const checks = {};
  let allHealthy = true;

  // Database
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.database = { status: 'healthy', latency_ms: Date.now() - start };
  } catch (err) {
    checks.database = { status: 'unhealthy', error: err.message };
    allHealthy = false;
  }

  // Redis (if configured)
  try {
    const redis = require('redis');
    const client = redis.createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    });
    await client.connect();
    const start = Date.now();
    await client.ping();
    checks.redis = { status: 'healthy', latency_ms: Date.now() - start };
    await client.disconnect();
  } catch {
    checks.redis = { status: 'unavailable', note: 'Redis not connected (non-critical)' };
  }

  // Services status
  checks.services = {
    push_notifications: IS_PUSH_CONFIGURED ? 'configured' : 'mock',
    cloud_storage: IS_CLOUD_CONFIGURED ? 'configured' : 'local',
    payments: IS_PAYMENT_LIVE ? 'live' : (IS_PAYMENT_CONFIGURED ? 'test' : 'mock'),
    sms: process.env.MSG91_AUTH_KEY ? 'configured' : 'mock',
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'ready' : 'degraded',
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// GET /api/health/metrics — basic metrics for monitoring
router.get('/metrics', async (req, res) => {
  try {
    const queueStats = await getQueueStats();

    // Active connections
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };

    // Recent error count (last hour)
    let errorCount = 0;
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*) FROM job_queue WHERE status = 'dead_letter' AND updated_at > NOW() - INTERVAL '1 hour'`
      );
      errorCount = parseInt(rows[0].count);
    } catch {
      // Table might not exist
    }

    res.json({
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      memory: {
        rss_mb: Math.round(process.memoryUsage().rss / 1048576),
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1048576),
        heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1048576),
      },
      db_pool: poolStats,
      queue: queueStats,
      errors_last_hour: errorCount,
      node_version: process.version,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
