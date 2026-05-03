'use strict';

/**
 * Migration V7 — Intelligence + Trust Layer
 * Phase 2: Demand Intelligence, Contract Farming, Trust Score, Satellite Monitoring
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V7 = `
-- ═══════════════════════════════════════════════════════════════
-- MIGRATION V7: INTELLIGENCE + TRUST — PHASE 2
-- ═══════════════════════════════════════════════════════════════

-- ═══ 2A. DEMAND INTELLIGENCE ═══════════════════════════════════

CREATE TABLE IF NOT EXISTS price_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id         UUID,
  district_id     UUID REFERENCES districts(id),
  prediction_date DATE NOT NULL,
  predicted_price DECIMAL(12,2) NOT NULL,
  confidence      DECIMAL(4,3) DEFAULT 0.5,
  model_version   VARCHAR(20) DEFAULT 'v1',
  actual_price    DECIMAL(12,2),
  features        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demand_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name       VARCHAR(100) NOT NULL,
  district_id     UUID REFERENCES districts(id),
  signal_type     VARCHAR(50) NOT NULL DEFAULT 'demand_spike',
  signal_strength DECIMAL(4,3) DEFAULT 0.5,
  source          VARCHAR(100),
  details         JSONB DEFAULT '{}',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 2B. CONTRACT FARMING ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS farming_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID REFERENCES users(id),
  farmer_id       UUID REFERENCES users(id),
  fpo_id          UUID,
  crop_name       VARCHAR(100) NOT NULL,
  variety         VARCHAR(100),
  quantity_kg     DECIMAL(12,2) NOT NULL,
  price_per_kg    DECIMAL(10,2) NOT NULL,
  advance_percent DECIMAL(5,2) DEFAULT 0,
  advance_paid    DECIMAL(12,2) DEFAULT 0,
  quality_params  JSONB DEFAULT '{}',
  delivery_date   DATE,
  delivery_location TEXT,
  status          VARCHAR(30) DEFAULT 'proposed',
  terms_pdf_url   TEXT,
  signed_at       TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID REFERENCES farming_contracts(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  proof_url       TEXT,
  status          VARCHAR(30) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 2C. TRUST SCORE SYSTEM ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS trust_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  overall_score   DECIMAL(5,2) DEFAULT 50,
  trade_score     DECIMAL(5,2) DEFAULT 50,
  payment_score   DECIMAL(5,2) DEFAULT 50,
  delivery_score  DECIMAL(5,2) DEFAULT 50,
  quality_score   DECIMAL(5,2) DEFAULT 50,
  verification_level VARCHAR(30) DEFAULT 'basic',
  badges          JSONB DEFAULT '[]',
  total_trades    INTEGER DEFAULT 0,
  dispute_rate    DECIMAL(4,3) DEFAULT 0,
  last_computed   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 2D. SATELLITE CROP MONITORING ══════════════════════════════

CREATE TABLE IF NOT EXISTS crop_monitoring (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  field_id        UUID,
  ndvi_value      DECIMAL(5,4),
  ndvi_date       DATE NOT NULL,
  health_status   VARCHAR(30) DEFAULT 'normal',
  alert_type      VARCHAR(50),
  alert_message   TEXT,
  satellite_source VARCHAR(50) DEFAULT 'sentinel-2',
  geometry        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soil_health_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  field_id        UUID,
  ph_value        DECIMAL(4,2),
  nitrogen_kg_ha  DECIMAL(8,2),
  phosphorus_kg_ha DECIMAL(8,2),
  potassium_kg_ha DECIMAL(8,2),
  organic_carbon  DECIMAL(5,2),
  soil_type       VARCHAR(50),
  test_date       DATE,
  lab_name        VARCHAR(200),
  card_number     VARCHAR(50),
  recommendations JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_predictions_crop_date ON price_predictions(crop_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_demand_signals_district ON demand_signals(district_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_farming_contracts_buyer ON farming_contracts(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_farming_contracts_farmer ON farming_contracts(farmer_id, status);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_monitoring_farmer ON crop_monitoring(farmer_id, ndvi_date);
CREATE INDEX IF NOT EXISTS idx_soil_health_farmer ON soil_health_records(farmer_id);
`;

async function migrateV7() {
  try {
    await pool.query(MIGRATION_V7);
    console.log('[migrate-v7] Intelligence + Trust tables created');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('[migrate-v7] Tables already exist, skipping');
    } else {
      console.error('[migrate-v7] Migration failed:', err.message);
    }
  }
}

module.exports = { migrateV7 };
