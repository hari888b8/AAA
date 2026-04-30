'use strict';

const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const config = require('../lib/config');
const logger = require('../lib/logger');
const { AuthenticationError } = require('../lib/errors');

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'No token provided' } });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const result = await query('SELECT id, phone, name, role, district_id, state_code FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows.length) return res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'User not found' } });

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });
    return res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Invalid token' } });
  }
}

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  authMiddleware(req, res, next);
}

/**
 * Role-based access control middleware.
 * Usage: requireRole('admin') or requireRole('admin', 'fpo')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'Authentication required' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}

module.exports = { authMiddleware, optionalAuth, requireRole };
