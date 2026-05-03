'use strict';

/**
 * Audit Logging Service
 * Records all critical operations for compliance, debugging, and security.
 * Stores to system_events table with async write (non-blocking).
 */

const { query } = require('../db/pool');
const logger = require('../lib/logger');
const { v4: uuidv4 } = require('uuid');

// Buffer events and flush in batches for performance
const eventBuffer = [];
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 50;

/**
 * Log a system event
 * @param {Object} event
 * @param {string} event.type - Event type (e.g., 'user.login', 'trade.created', 'payment.completed')
 * @param {string} [event.severity='info'] - Severity: 'info', 'warn', 'error', 'critical'
 * @param {string} [event.actorId] - User who performed the action
 * @param {string} [event.targetType] - Type of target entity (user, listing, order, etc.)
 * @param {string} [event.targetId] - ID of the target entity
 * @param {string} [event.description] - Human-readable description
 * @param {Object} [event.metadata={}] - Additional structured data
 */
function logEvent({ type, severity = 'info', actorId, targetType, targetId, description, metadata = {} }) {
  const event = {
    id: uuidv4(),
    event_type: type,
    severity,
    actor_id: actorId || null,
    target_type: targetType || null,
    target_id: targetId || null,
    description: description || null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  eventBuffer.push(event);

  // Flush immediately for critical/error events
  if (severity === 'critical' || severity === 'error' || eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  }

  // Also log to structured logger for real-time monitoring
  if (severity === 'error' || severity === 'critical') {
    logger.error({ audit: event }, `[Audit] ${type}: ${description || ''}`);
  } else {
    logger.debug({ audit: event }, `[Audit] ${type}`);
  }
}

/**
 * Flush buffered events to database
 */
async function flushEvents() {
  if (eventBuffer.length === 0) return;

  const batch = eventBuffer.splice(0, eventBuffer.length);

  try {
    // Batch insert for efficiency
    const values = batch.map((e, i) => {
      const offset = i * 7;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
    }).join(', ');

    const params = batch.flatMap(e => [
      e.id, e.event_type, e.severity, e.actor_id,
      e.target_type, e.target_id, JSON.stringify(e.metadata),
    ]);

    await query(
      `INSERT INTO system_events (id, event_type, severity, actor_id, target_type, target_id, metadata)
       VALUES ${values}`,
      params
    );
  } catch (err) {
    // Don't fail the application due to audit logging issues
    logger.warn({ err: err.message, count: batch.length }, '[Audit] Failed to persist events');
  }
}

/**
 * Express middleware that logs all mutating requests
 */
function auditMiddleware(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalEnd = res.end;

    res.end = function (...args) {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;

      logEvent({
        type: `api.${req.method.toLowerCase()}.${success ? 'success' : 'failure'}`,
        severity: statusCode >= 500 ? 'error' : 'info',
        actorId: req.user?.id,
        targetType: 'endpoint',
        description: `${req.method} ${req.originalUrl} → ${statusCode}`,
        metadata: {
          method: req.method,
          path: req.originalUrl,
          status: statusCode,
          ip: req.ip,
          user_agent: req.get('user-agent')?.slice(0, 100),
        },
      });

      originalEnd.apply(this, args);
    };
  }

  next();
}

// Pre-defined event types for convenience
const EVENTS = {
  // Auth
  USER_LOGIN: 'auth.login',
  USER_LOGOUT: 'auth.logout',
  USER_REGISTER: 'auth.register',
  OTP_SENT: 'auth.otp_sent',
  OTP_FAILED: 'auth.otp_failed',
  TOKEN_REFRESHED: 'auth.token_refreshed',

  // Trade
  LISTING_CREATED: 'trade.listing_created',
  LISTING_UPDATED: 'trade.listing_updated',
  ORDER_PLACED: 'trade.order_placed',
  ORDER_CONFIRMED: 'trade.order_confirmed',
  ORDER_CANCELLED: 'trade.order_cancelled',
  ORDER_DELIVERED: 'trade.order_delivered',

  // Payment
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  REFUND_INITIATED: 'payment.refund_initiated',
  REFUND_COMPLETED: 'payment.refund_completed',

  // FPO
  FPO_MEMBER_ADDED: 'fpo.member_added',
  FPO_PROCUREMENT: 'fpo.procurement_recorded',
  FPO_LISTING_CREATED: 'fpo.listing_created',

  // Admin
  ADMIN_ACTION: 'admin.action',
  USER_SUSPENDED: 'admin.user_suspended',
  CONTENT_MODERATED: 'admin.content_moderated',

  // Security
  SUSPICIOUS_ACTIVITY: 'security.suspicious',
  RATE_LIMIT_HIT: 'security.rate_limit',
  INVALID_TOKEN: 'security.invalid_token',
};

/**
 * Query audit logs with filters
 * @param {Object} filters
 * @param {string} [filters.type] - Event type filter
 * @param {string} [filters.severity] - Min severity
 * @param {string} [filters.actorId] - Actor UUID
 * @param {string} [filters.since] - ISO timestamp
 * @param {number} [filters.limit=50]
 */
async function queryLogs({ type, severity, actorId, since, limit = 50 } = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (type) { conditions.push(`event_type LIKE $${i++}`); params.push(`${type}%`); }
  if (severity) { conditions.push(`severity = $${i++}`); params.push(severity); }
  if (actorId) { conditions.push(`actor_id = $${i++}`); params.push(actorId); }
  if (since) { conditions.push(`created_at > $${i++}`); params.push(since); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Math.min(limit, 200));

  const { rows } = await query(
    `SELECT * FROM system_events ${where} ORDER BY created_at DESC LIMIT $${i}`,
    params
  );
  return rows;
}

// Start periodic flush
setInterval(flushEvents, FLUSH_INTERVAL_MS);

// Flush on process exit
process.on('beforeExit', flushEvents);

module.exports = { logEvent, auditMiddleware, queryLogs, flushEvents, EVENTS };
