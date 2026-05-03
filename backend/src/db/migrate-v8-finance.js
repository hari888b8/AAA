'use strict';

/**
 * Migration V8 — Financial Ecosystem + Agent Network
 * Phase 3: Credit Scoring, Micro-Loans, Crop Insurance, Agent Network
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V8 = `
-- ═══════════════════════════════════════════════════════════════
-- MIGRATION V8: FINANCIAL + SCALE — PHASE 3
-- ═══════════════════════════════════════════════════════════════

-- ═══ 3A. FINANCIAL ECOSYSTEM ════════════════════════════════════

CREATE TABLE IF NOT EXISTS credit_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  score           INTEGER DEFAULT 300,
  max_score       INTEGER DEFAULT 900,
  factors         JSONB DEFAULT '{}',
  eligible_amount DECIMAL(12,2) DEFAULT 0,
  last_computed   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS micro_loans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  lender_id       UUID,
  amount          DECIMAL(12,2) NOT NULL,
  interest_rate   DECIMAL(5,2) NOT NULL DEFAULT 12,
  tenure_months   INTEGER NOT NULL DEFAULT 6,
  emi_amount      DECIMAL(12,2),
  purpose         VARCHAR(100),
  status          VARCHAR(30) DEFAULT 'applied',
  disbursed_at    TIMESTAMPTZ,
  next_emi_date   DATE,
  total_paid      DECIMAL(12,2) DEFAULT 0,
  collateral      JSONB DEFAULT '{}',
  documents       JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_insurance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  policy_number   VARCHAR(50),
  crop_name       VARCHAR(100) NOT NULL,
  season          VARCHAR(20),
  area_hectares   DECIMAL(8,2),
  sum_insured     DECIMAL(12,2),
  premium_amount  DECIMAL(12,2),
  premium_paid    BOOLEAN DEFAULT false,
  provider        VARCHAR(100),
  status          VARCHAR(30) DEFAULT 'active',
  claim_id        VARCHAR(50),
  claim_status    VARCHAR(30),
  claim_amount    DECIMAL(12,2),
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 3B. AGENT NETWORK ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  name            VARCHAR(200) NOT NULL,
  phone           VARCHAR(15) NOT NULL,
  district_id     UUID REFERENCES districts(id),
  mandal          VARCHAR(100),
  coverage_villages JSONB DEFAULT '[]',
  is_active       BOOLEAN DEFAULT true,
  is_verified     BOOLEAN DEFAULT false,
  agent_type      VARCHAR(50) DEFAULT 'field',
  training_completed BOOLEAN DEFAULT false,
  total_onboarded INTEGER DEFAULT 0,
  total_commission DECIMAL(12,2) DEFAULT 0,
  bank_account    JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id) ON DELETE CASCADE,
  activity_type   VARCHAR(50) NOT NULL,
  farmer_id       UUID REFERENCES users(id),
  details         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id) ON DELETE CASCADE,
  activity_id     UUID REFERENCES agent_activities(id),
  amount          DECIMAL(10,2) NOT NULL,
  commission_type VARCHAR(50) NOT NULL DEFAULT 'onboarding',
  status          VARCHAR(30) DEFAULT 'pending',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user ON credit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_loans_user ON micro_loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crop_insurance_user ON crop_insurance(user_id, status);
CREATE INDEX IF NOT EXISTS idx_agents_district ON agents(district_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent ON agent_commissions(agent_id, status);
`;

async function migrateV8() {
  try {
    await pool.query(MIGRATION_V8);
    console.log('[migrate-v8] Financial + Agent tables created');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('[migrate-v8] Tables already exist, skipping');
    } else {
      console.error('[migrate-v8] Migration failed:', err.message);
    }
  }
}

module.exports = { migrateV8 };
