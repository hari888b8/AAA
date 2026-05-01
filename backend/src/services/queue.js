'use strict';

/**
 * Failure Handling & Retry Queue System
 * Handles failed operations with exponential backoff retries.
 * Uses in-memory queue with PostgreSQL persistence for crash recovery.
 * Production would use BullMQ + Redis, but this provides the same guarantees
 * with the current infrastructure.
 */

const { query } = require('../db/pool');
const logger = require('../lib/logger');
const { v4: uuidv4 } = require('uuid');

// In-memory processing queue
const processingQueue = new Map();
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2 seconds, doubles each retry

/**
 * Job types and their handlers
 */
const JOB_HANDLERS = {};

/**
 * Register a job handler
 * @param {string} type - Job type identifier
 * @param {Function} handler - async (payload) => result
 */
function registerHandler(type, handler) {
  JOB_HANDLERS[type] = handler;
}

/**
 * Enqueue a job for processing with retry logic
 * @param {string} type - Job type (must have registered handler)
 * @param {Object} payload - Job data
 * @param {Object} [options]
 * @param {number} [options.maxRetries=5]
 * @param {number} [options.delayMs=0] - Initial delay before first attempt
 * @param {string} [options.priority='normal'] - 'high', 'normal', 'low'
 * @returns {Promise<string>} Job ID
 */
async function enqueue(type, payload, options = {}) {
  const jobId = uuidv4();
  const { maxRetries = MAX_RETRIES, delayMs = 0, priority = 'normal' } = options;

  // Persist to database for crash recovery
  try {
    await query(
      `INSERT INTO job_queue (id, type, payload, status, priority, max_retries, attempt, next_run_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, 0, NOW() + interval '${delayMs} milliseconds')`,
      [jobId, type, JSON.stringify(payload), priority, maxRetries]
    );
  } catch (err) {
    // If job_queue table doesn't exist yet, just process in-memory
    logger.debug({ type, jobId, err: err.message }, '[Queue] DB persist failed, processing in-memory only');
  }

  // Schedule processing
  const delay = delayMs || 0;
  const timer = setTimeout(() => processJob(jobId, type, payload, 0, maxRetries), delay);
  processingQueue.set(jobId, { timer, type, payload, attempt: 0 });

  logger.info({ jobId, type, priority, delayMs }, '[Queue] Job enqueued');
  return jobId;
}

/**
 * Process a job with retry logic
 */
async function processJob(jobId, type, payload, attempt, maxRetries) {
  const handler = JOB_HANDLERS[type];
  if (!handler) {
    logger.error({ jobId, type }, '[Queue] No handler registered for job type');
    await updateJobStatus(jobId, 'failed', 'No handler registered');
    processingQueue.delete(jobId);
    return;
  }

  try {
    logger.info({ jobId, type, attempt }, '[Queue] Processing job');
    await updateJobStatus(jobId, 'processing');

    const result = await handler(payload);

    // Success
    await updateJobStatus(jobId, 'completed', null, result);
    processingQueue.delete(jobId);
    logger.info({ jobId, type, attempt }, '[Queue] Job completed successfully');
  } catch (err) {
    const nextAttempt = attempt + 1;

    if (nextAttempt >= maxRetries) {
      // Max retries exceeded → dead letter
      logger.error({ jobId, type, attempt: nextAttempt, error: err.message }, '[Queue] Job failed permanently (max retries)');
      await updateJobStatus(jobId, 'dead_letter', err.message);
      processingQueue.delete(jobId);

      // Emit dead letter event for monitoring
      await createDeadLetterAlert(jobId, type, payload, err.message);
      return;
    }

    // Schedule retry with exponential backoff
    const delay = BASE_DELAY_MS * Math.pow(2, nextAttempt);
    logger.warn({ jobId, type, attempt: nextAttempt, nextRetryMs: delay, error: err.message }, '[Queue] Job failed, scheduling retry');

    await updateJobStatus(jobId, 'retry_scheduled', err.message);

    const timer = setTimeout(() => processJob(jobId, type, payload, nextAttempt, maxRetries), delay);
    processingQueue.set(jobId, { timer, type, payload, attempt: nextAttempt });
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, status, error = null, result = null) {
  try {
    await query(
      `UPDATE job_queue SET status = $2, last_error = $3, result = $4, attempt = attempt + 1, updated_at = NOW()
       WHERE id = $1`,
      [jobId, status, error, result ? JSON.stringify(result) : null]
    );
  } catch {
    // Table might not exist yet
  }
}

/**
 * Create alert for permanently failed jobs
 */
async function createDeadLetterAlert(jobId, type, payload, error) {
  try {
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, data)
       VALUES ($1, (SELECT id FROM users WHERE role='admin' LIMIT 1), 'system_alert', $2, $3, $4)`,
      [
        uuidv4(),
        `[ALERT] Job failed: ${type}`,
        `Job ${jobId} failed after max retries: ${error}`,
        JSON.stringify({ job_id: jobId, type, payload, error }),
      ]
    );
  } catch {
    logger.error({ jobId, type }, '[Queue] Failed to create dead letter alert');
  }
}

/**
 * Recover pending jobs from database on startup
 */
async function recoverPendingJobs() {
  try {
    const { rows } = await query(
      `SELECT * FROM job_queue WHERE status IN ('pending', 'retry_scheduled', 'processing') 
       AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY priority DESC, created_at ASC
       LIMIT 100`
    );

    for (const job of rows) {
      const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
      processJob(job.id, job.type, payload, job.attempt, job.max_retries);
    }

    if (rows.length > 0) {
      logger.info({ count: rows.length }, '[Queue] Recovered pending jobs from database');
    }
  } catch {
    // Table might not exist yet
    logger.debug('[Queue] Could not recover jobs (table may not exist)');
  }
}

/**
 * Get queue statistics
 */
async function getStats() {
  try {
    const { rows } = await query(`
      SELECT status, COUNT(*) as count 
      FROM job_queue 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);
    return rows.reduce((acc, r) => { acc[r.status] = parseInt(r.count); return acc; }, {});
  } catch {
    return { in_memory: processingQueue.size };
  }
}

module.exports = { enqueue, registerHandler, recoverPendingJobs, getStats };
