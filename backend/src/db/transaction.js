'use strict';

const { pool } = require('./pool');
const logger = require('../lib/logger');

/**
 * Execute a function within a database transaction.
 * Automatically commits on success, rolls back on error.
 *
 * @param {Function} fn - async function receiving (client) => result
 * @returns {Promise<*>} result of fn
 *
 * Usage:
 *   const result = await withTransaction(async (client) => {
 *     await client.query('INSERT INTO orders ...');
 *     await client.query('UPDATE inventory ...');
 *     return { orderId };
 *   });
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Transaction rolled back');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
