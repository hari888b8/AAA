'use strict';

/**
 * Migration V4 — Job Queue + System Tables
 * Adds infrastructure for retry queue, monitoring, and dead letter handling.
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V4 = `
-- ═══ JOB QUEUE: Retry/dead-letter system for failed operations ═══
CREATE TABLE IF NOT EXISTS job_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(50) NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority        VARCHAR(10) NOT NULL DEFAULT 'normal',
  max_retries     INTEGER DEFAULT 5,
  attempt         INTEGER DEFAULT 0,
  last_error      TEXT,
  result          JSONB,
  next_run_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_next_run ON job_queue(next_run_at) WHERE status IN ('pending', 'retry_scheduled');

-- ═══ SYSTEM EVENTS: Audit log for critical operations ═══
CREATE TABLE IF NOT EXISTS system_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      VARCHAR(50) NOT NULL,
  severity        VARCHAR(10) DEFAULT 'info',
  actor_id        UUID,
  target_type     VARCHAR(30),
  target_id       UUID,
  description     TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity) WHERE severity IN ('error', 'critical');

-- ═══ DELIVERY TRACKING (Enhanced) ═══
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_order_id  UUID REFERENCES trade_orders(id),
  driver_name     VARCHAR(100),
  driver_phone    VARCHAR(15),
  vehicle_number  VARCHAR(20),
  vehicle_type    VARCHAR(20),
  current_lat     DECIMAL(10,7),
  current_lng     DECIMAL(10,7),
  pickup_lat      DECIMAL(10,7),
  pickup_lng      DECIMAL(10,7),
  dropoff_lat     DECIMAL(10,7),
  dropoff_lng     DECIMAL(10,7),
  status          VARCHAR(20) DEFAULT 'assigned',
  assigned_at     TIMESTAMPTZ DEFAULT NOW(),
  picked_up_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  proof_photo_url TEXT,
  otp_code        VARCHAR(6),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(trade_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);

-- ═══ PAYMENT LEDGER: Complete financial audit trail ═══
CREATE TABLE IF NOT EXISTS payment_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_order_id  UUID,
  user_id         UUID NOT NULL,
  type            VARCHAR(20) NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'INR',
  gateway_id      VARCHAR(100),
  gateway_order_id VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'pending',
  description     TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_user ON payment_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_order ON payment_ledger(trade_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_status ON payment_ledger(status);

-- ═══ UPLOADED FILES: Track all media with cloud storage keys ═══
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS storage_type VARCHAR(10) DEFAULT 'local';
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS content_type VARCHAR(50);

-- ═══ CLEANUP: Auto-expire old OTPs ═══
CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at) WHERE used = false;

-- ═══ TERMS ACCEPTANCE ═══
CREATE TABLE IF NOT EXISTS terms_acceptance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  version         VARCHAR(10) NOT NULL DEFAULT '1.0',
  accepted_at     TIMESTAMPTZ DEFAULT NOW(),
  ip_address      VARCHAR(45),
  UNIQUE(user_id, version)
);
`;

async function migrateV4() {
  try {
    await pool.query(MIGRATION_V4);
    console.log('✅ Migration V4 (infrastructure) applied successfully');
  } catch (err) {
    // Ignore errors for already-existing objects
    if (err.message.includes('already exists')) {
      console.log('✅ Migration V4 (infrastructure) — already up to date');
    } else {
      console.error('⚠️  Migration V4 partial:', err.message);
    }
  }
}

module.exports = { migrateV4 };

if (require.main === module) {
  migrateV4().then(() => process.exit(0)).catch(() => process.exit(1));
}
