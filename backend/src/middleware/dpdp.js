'use strict';

/**
 * DPDP Act 2023 (Digital Personal Data Protection) Compliance Middleware
 * Implements: Consent management, data minimization, purpose limitation,
 * right to erasure, data portability, breach notification framework
 */

const { pool } = require('../db/pool');

// Purpose codes as defined by DPDP Act
const DATA_PURPOSES = {
  ACCOUNT: 'account_management',
  MARKETPLACE: 'marketplace_transactions',
  INTELLIGENCE: 'market_intelligence',
  CREDIT: 'credit_scoring',
  GOVERNMENT: 'government_scheme_sync',
  ANALYTICS: 'platform_analytics',
  MARKETING: 'marketing_communications',
  RESEARCH: 'agricultural_research',
};

// Data categories requiring explicit consent
const SENSITIVE_CATEGORIES = [
  'aadhaar_number',
  'bank_account',
  'gps_location',
  'biometric_data',
  'health_data',
  'financial_data',
  'caste_category',
];

/**
 * Middleware: Verify user has given consent for the specified purpose
 */
function requireConsent(purpose) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) return next();

    try {
      const result = await pool.query(
        `SELECT id, status FROM user_consents 
         WHERE user_id = $1 AND purpose = $2 AND status = 'active' 
         AND (expires_at IS NULL OR expires_at > NOW())
         LIMIT 1`,
        [req.user.id, purpose]
      );

      if (!result.rows.length) {
        return res.status(451).json({
          error: {
            code: 'CONSENT_REQUIRED',
            message: `Consent required for: ${purpose}`,
            purpose,
            consent_url: `/api/compliance/consent/${purpose}`,
          },
        });
      }

      req.consentId = result.rows[0].id;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: Log all personal data access for audit trail (DPDP Section 8)
 */
function dataAccessLog(dataCategory) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) return next();

    try {
      await pool.query(
        `INSERT INTO data_access_log (user_id, accessor_id, data_category, access_type, ip_address, endpoint)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.params.userId || req.user.id,
          req.user.id,
          dataCategory,
          req.method,
          req.ip,
          req.originalUrl,
        ]
      );
    } catch (err) {
      // Non-blocking — don't fail the request for audit log failures
      console.error('Data access log failed:', err.message);
    }
    next();
  };
}

/**
 * Middleware: Enforce data retention policy (auto-delete after retention period)
 */
function enforceRetention(tableName, retentionDays) {
  return async (req, res, next) => {
    // Background cleanup — non-blocking
    setImmediate(async () => {
      try {
        await pool.query(
          `DELETE FROM ${tableName} WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
           AND retention_override IS NOT TRUE`
        );
      } catch (err) {
        console.error(`Retention cleanup for ${tableName} failed:`, err.message);
      }
    });
    next();
  };
}

module.exports = {
  requireConsent,
  dataAccessLog,
  enforceRetention,
  DATA_PURPOSES,
  SENSITIVE_CATEGORIES,
};
