'use strict';

/**
 * Migration V5 — Platform Enhancement Tables
 * Adds: feature_flags, device_tokens, user_preferences, price_alerts, FPO enhancements
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V5 = `
-- ═══ FEATURE FLAGS: Gradual rollout control ═══
CREATE TABLE IF NOT EXISTS feature_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key        VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT,
  is_enabled      BOOLEAN DEFAULT false,
  rollout_pct     INTEGER DEFAULT 0 CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
  target_roles    TEXT[] DEFAULT '{}',
  target_districts UUID[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ DEVICE TOKENS: FCM push notification tokens ═══
CREATE TABLE IF NOT EXISTS device_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token       TEXT NOT NULL,
  device_type     VARCHAR(20) DEFAULT 'android',
  device_model    VARCHAR(100),
  app_version     VARCHAR(20),
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id) WHERE active = true;

-- ═══ USER PREFERENCES: Language, notification, display settings ═══
CREATE TABLE IF NOT EXISTS user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  language        VARCHAR(5) DEFAULT 'en',
  theme           VARCHAR(10) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  price_alerts_enabled  BOOLEAN DEFAULT true,
  weather_alerts_enabled BOOLEAN DEFAULT true,
  voice_input_enabled   BOOLEAN DEFAULT false,
  offline_mode          BOOLEAN DEFAULT true,
  units_weight    VARCHAR(10) DEFAULT 'kg',
  units_area      VARCHAR(10) DEFAULT 'acres',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ PRICE ALERTS: User-defined price triggers ═══
CREATE TABLE IF NOT EXISTS price_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_id         UUID NOT NULL,
  district_id     UUID,
  alert_type      VARCHAR(20) NOT NULL DEFAULT 'threshold',
  condition       VARCHAR(10) NOT NULL DEFAULT 'above',
  target_price    DECIMAL(10,2) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  triggered_at    TIMESTAMPTZ,
  triggered_count INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(crop_id, is_active) WHERE is_active = true;

-- ═══ FPO ENHANCEMENTS ═══
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(11);
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS total_procurement_value DECIMAL(14,2) DEFAULT 0;
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE fpo_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- ═══ FARMER PROFILES: Enhanced with GPS and land details ═══
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(50);
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS has_smartphone BOOLEAN DEFAULT true;
ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- ═══ OFFLINE SYNC TRACKING ═══
CREATE TABLE IF NOT EXISTS sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID,
  payload         JSONB,
  synced          BOOLEAN DEFAULT false,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_unsynced ON sync_log(user_id) WHERE synced = false;

-- ═══ API USAGE TRACKING (for rate limiting and analytics) ═══
CREATE TABLE IF NOT EXISTS api_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  endpoint        VARCHAR(200) NOT NULL,
  method          VARCHAR(10) NOT NULL,
  status_code     INTEGER,
  response_time_ms INTEGER,
  ip_address      VARCHAR(45),
  user_agent      VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint, created_at DESC);

-- ═══ Default feature flags ═══
INSERT INTO feature_flags (flag_key, description, is_enabled, rollout_pct, target_roles) VALUES
  ('offline_mode', 'Enable offline-first mode with background sync', true, 100, '{"farmer","fpo","buyer"}'),
  ('voice_input', 'Voice input for search and data entry', false, 0, '{"farmer"}'),
  ('price_prediction', 'AI price prediction on Intelligence screen', false, 10, '{"farmer","fpo","buyer"}'),
  ('live_auction', 'Real-time auction bidding', false, 25, '{"farmer","fpo","buyer"}'),
  ('multi_language', 'Multi-language support (Telugu/Hindi)', true, 100, '{"farmer","fpo","buyer","supplier","service_provider"}'),
  ('photo_quality_grading', 'AI-based crop quality grading from photos', false, 5, '{"fpo","buyer"}'),
  ('equipment_tracking', 'Live GPS tracking for equipment bookings', false, 20, '{"farmer","service_provider"}'),
  ('fpo_dashboard_v2', 'Enhanced FPO dashboard with analytics', true, 100, '{"fpo"}')
ON CONFLICT (flag_key) DO NOTHING;
`;

async function migrateV5() {
  try {
    await pool.query(MIGRATION_V5);
    console.log('✅ Migration V5 (platform enhancement) applied successfully');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ Migration V5 (platform enhancement) — already up to date');
    } else {
      console.error('⚠️  Migration V5 partial:', err.message);
    }
  }
}

module.exports = { migrateV5 };

if (require.main === module) {
  migrateV5().then(() => process.exit(0)).catch(() => process.exit(1));
}
