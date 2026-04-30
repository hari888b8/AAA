'use strict';

/**
 * Input sanitization middleware.
 * Strips potentially dangerous characters from string inputs.
 * Works alongside express-validator for defence-in-depth.
 */
function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Remove null bytes
      obj[key] = obj[key].replace(/\0/g, '');
      // Trim excessive whitespace
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = { sanitize };
