'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware: attach a unique request ID to every request for tracing.
 * Reads X-Request-ID header if present (from load balancer), otherwise generates one.
 */
function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = { requestId };
