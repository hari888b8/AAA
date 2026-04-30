'use strict';

const { Pool } = require('pg');
const logger = require('../lib/logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'Agrihub',
  user: process.env.POSTGRES_USER || 'Agrihub',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    logger.warn({ query: text.slice(0, 100), duration }, 'Slow query detected');
  } else if (process.env.NODE_ENV === 'development') {
    logger.debug({ query: text.slice(0, 60), duration, rows: res.rowCount }, 'query');
  }
  return res;
}

async function getClient() {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  client.release = () => {
    client.release = originalRelease;
    return client.release();
  };
  return client;
}

/**
 * Connect to database with retry logic (exponential backoff).
 * Used during startup to handle transient connection failures.
 */
async function connectWithRetry(maxAttempts = 5, baseDelay = 3000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query('SELECT NOW()');
      logger.info('PostgreSQL connected');
      return;
    } catch (err) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(
        { attempt, maxAttempts, nextRetryMs: delay, error: err.message },
        'Database connection failed, retrying...'
      );
      if (attempt === maxAttempts) {
        throw new Error(`Failed to connect to PostgreSQL after ${maxAttempts} attempts: ${err.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = { query, getClient, pool, connectWithRetry };
