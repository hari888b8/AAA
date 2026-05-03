'use strict';

/**
 * Migration V9 — Ecosystem Expansion
 * Phase 4: Bank/NBFC Portal, Government Integration, Exporter Dashboard, Open API, Analytics
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V9 = `
-- ═══════════════════════════════════════════════════════════════
-- MIGRATION V9: ECOSYSTEM EXPANSION — PHASE 4
-- ═══════════════════════════════════════════════════════════════

-- ═══ 4A. OPEN API & PARTNER MANAGEMENT ══════════════════════════

CREATE TABLE IF NOT EXISTS api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID REFERENCES users(id),
  key_hash        VARCHAR(128) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  permissions     JSONB DEFAULT '["read"]',
  rate_limit      INTEGER DEFAULT 1000,
  is_active       BOOLEAN DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID REFERENCES users(id),
  url             TEXT NOT NULL,
  events          JSONB DEFAULT '[]',
  secret_hash     VARCHAR(128),
  is_active       BOOLEAN DEFAULT true,
  failure_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type      VARCHAR(100) NOT NULL,
  payload         JSONB NOT NULL,
  response_status INTEGER,
  response_body   TEXT,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 4B. BANK/NBFC PORTAL ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS bank_loan_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id         UUID REFERENCES micro_loans(id),
  bank_partner_id UUID REFERENCES users(id),
  application_ref VARCHAR(100),
  farmer_data     JSONB DEFAULT '{}',
  credit_data     JSONB DEFAULT '{}',
  status          VARCHAR(30) DEFAULT 'forwarded',
  bank_remarks    TEXT,
  disbursement_ref VARCHAR(100),
  disbursed_amount DECIMAL(12,2),
  disbursed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 4C. GOVERNMENT INTEGRATION ═════════════════════════════════

CREATE TABLE IF NOT EXISTS govt_sync_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  scheme_name     VARCHAR(200) NOT NULL,
  scheme_type     VARCHAR(50) NOT NULL,
  external_ref    VARCHAR(200),
  sync_status     VARCHAR(30) DEFAULT 'pending',
  data_payload    JSONB DEFAULT '{}',
  last_synced     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 4D. EXPORTER DASHBOARD ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS export_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exporter_id     UUID REFERENCES users(id),
  crop_name       VARCHAR(100) NOT NULL,
  variety         VARCHAR(100),
  quantity_mt     DECIMAL(12,2) NOT NULL,
  target_price    DECIMAL(12,2),
  quality_grade   VARCHAR(30),
  destination_country VARCHAR(100),
  shipping_port   VARCHAR(100),
  required_certs  JSONB DEFAULT '[]',
  status          VARCHAR(30) DEFAULT 'open',
  fulfillment_pct DECIMAL(5,2) DEFAULT 0,
  ship_by_date    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS export_sourcing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_order_id UUID REFERENCES export_orders(id) ON DELETE CASCADE,
  fpo_id          UUID,
  farmer_id       UUID REFERENCES users(id),
  quantity_mt     DECIMAL(12,2),
  price_per_kg    DECIMAL(10,2),
  quality_report  JSONB DEFAULT '{}',
  status          VARCHAR(30) DEFAULT 'sourcing',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 4E. DISTRICT ANALYTICS ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id     UUID REFERENCES districts(id),
  snapshot_date   DATE NOT NULL,
  metric_type     VARCHAR(50) NOT NULL,
  metrics         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_partner ON api_keys(partner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_partner ON webhooks(partner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bank_applications_bank ON bank_loan_applications(bank_partner_id, status);
CREATE INDEX IF NOT EXISTS idx_govt_sync_user ON govt_sync_records(user_id, scheme_type);
CREATE INDEX IF NOT EXISTS idx_export_orders_exporter ON export_orders(exporter_id, status);
CREATE INDEX IF NOT EXISTS idx_export_sourcing_order ON export_sourcing(export_order_id);
CREATE INDEX IF NOT EXISTS idx_analytics_district_date ON analytics_snapshots(district_id, snapshot_date);
`;

async function migrateV9() {
  try {
    await pool.query(MIGRATION_V9);
    console.log('[migrate-v9] Ecosystem Expansion tables created');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('[migrate-v9] Tables already exist, skipping');
    } else {
      console.error('[migrate-v9] Migration failed:', err.message);
    }
  }
}

module.exports = { migrateV9 };
