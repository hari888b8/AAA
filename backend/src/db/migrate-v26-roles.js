'use strict';

const { pool } = require('./pool');
const logger = require('../lib/logger');

const MIGRATION = `
-- ============================================================
-- V26: Multi-Role Support — Unified App Architecture
-- Users can have multiple roles (buyer + farmer, agri + aqua, etc.)
-- One "active_role" at a time for UI, but access to all added roles
-- Note: user_roles.role uses VARCHAR for flexibility (supports custom roles);
--       users.role continues to use the user_role ENUM for backward compat.
-- ============================================================

-- TABLE: user_roles — stores all roles a user has opted into
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(30) NOT NULL,
  sub_type    VARCHAR(50),  -- e.g. 'agri_farmer', 'aqua_farmer', 'both' for farmer; 'trader', 'exporter', 'processor', 'retailer' for buyer
  is_active   BOOLEAN DEFAULT FALSE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = true;

-- TABLE: role_preferences — per-role settings & module visibility
CREATE TABLE IF NOT EXISTS role_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(30) NOT NULL,
  modules     JSONB DEFAULT '[]',        -- enabled modules for this role
  dashboard   JSONB DEFAULT '{}',        -- dashboard layout preferences
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- TABLE: role_switch_log — audit trail for role switches
CREATE TABLE IF NOT EXISTS role_switch_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_role   VARCHAR(30),
  to_role     VARCHAR(30) NOT NULL,
  switched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_role_switch_user ON role_switch_log(user_id);
`;

async function migrateV26Roles() {
  try {
    await pool.query(MIGRATION);
    logger.info('V26 Roles migration applied');
  } catch (err) {
    if (err.message?.includes('already exists')) {
      logger.info('V26 Roles migration already applied');
    } else {
      logger.error({ err }, 'V26 Roles migration failed');
    }
  }
}

module.exports = { migrateV26Roles };
