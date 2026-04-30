'use strict';

const logger = require('../lib/logger');
const { AppError } = require('../lib/errors');

/**
 * Production-grade global error handler.
 * - Logs structured errors
 * - Returns consistent error response format
 * - Never leaks stack traces in production
 */
function errorHandler(err, req, res, _next) {
  // Determine if it's a known operational error
  const isOperational = err instanceof AppError || err.isOperational;
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Log the error
  const logPayload = {
    err: {
      message: err.message,
      code,
      statusCode,
      stack: err.stack,
    },
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  };

  if (statusCode >= 500) {
    logger.error(logPayload, `[${code}] ${err.message}`);
  } else {
    logger.warn(logPayload, `[${code}] ${err.message}`);
  }

  // Response
  const response = {
    error: {
      code,
      message: isOperational ? err.message : 'An unexpected error occurred',
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
    requestId: req.id,
  };

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unmatched routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    requestId: req.id,
  });
}

module.exports = { errorHandler, notFoundHandler };
