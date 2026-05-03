'use strict';

/**
 * Migration V6 — Farmerson Integration Tables
 * Adds: user verification, cart/checkout, fraud detection, seller analytics, 
 *       livestock listings, service booking availability, offline sync enhancements
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V6 = `
-- ═══ USER VERIFICATION SYSTEM ═══
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_badge VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS verification_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type   VARCHAR(50) NOT NULL,
  document_url    TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  reviewer_id     UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status) WHERE status = 'pending';

-- ═══ CART & CHECKOUT SYSTEM ═══
CREATE TABLE IF NOT EXISTS cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL,
  listing_type    VARCHAR(30) NOT NULL DEFAULT 'supply',
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
  price_per_unit  DECIMAL(12,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id, listing_type)
);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- ═══ FRAUD DETECTION ═══
CREATE TABLE IF NOT EXISTS fraud_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type     VARCHAR(30) NOT NULL,
  target_id       UUID NOT NULL,
  flag_type       VARCHAR(30) NOT NULL,
  severity        VARCHAR(10) DEFAULT 'medium',
  details         JSONB DEFAULT '{}',
  resolved        BOOLEAN DEFAULT false,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_target ON fraud_flags(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_unresolved ON fraud_flags(resolved) WHERE resolved = false;

-- ═══ SELLER ANALYTICS ═══
CREATE TABLE IF NOT EXISTS seller_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  total_views     INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  total_orders    INTEGER DEFAULT 0,
  total_revenue   DECIMAL(14,2) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  avg_response_time_hrs DECIMAL(6,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- ═══ LIVESTOCK ENHANCED FIELDS ═══
CREATE TABLE IF NOT EXISTS livestock_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  animal_type     VARCHAR(50) NOT NULL,
  breed           VARCHAR(100),
  age_months      INTEGER,
  weight_kg       DECIMAL(8,2),
  gender          VARCHAR(10),
  price           DECIMAL(12,2) NOT NULL,
  vaccinations    JSONB DEFAULT '[]',
  health_certificate_url TEXT,
  photos          JSONB DEFAULT '[]',
  description     TEXT,
  location_label  VARCHAR(200),
  district_id     UUID,
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_livestock_user ON livestock_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_livestock_type ON livestock_listings(animal_type, status);

-- ═══ SERVICE BOOKING AVAILABILITY ═══
CREATE TABLE IF NOT EXISTS availability_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_id    UUID,
  service_type    VARCHAR(50),
  slot_date       DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_booked       BOOLEAN DEFAULT false,
  booked_by       UUID REFERENCES users(id),
  price_per_slot  DECIMAL(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, equipment_id, slot_date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_availability_provider ON availability_slots(provider_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_available ON availability_slots(slot_date, is_booked) WHERE is_booked = false;

CREATE TABLE IF NOT EXISTS service_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         UUID NOT NULL REFERENCES availability_slots(id),
  customer_id     UUID NOT NULL REFERENCES users(id),
  provider_id     UUID NOT NULL REFERENCES users(id),
  service_type    VARCHAR(50) NOT NULL,
  status          VARCHAR(20) DEFAULT 'requested',
  booking_date    DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  location_label  VARCHAR(200),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  total_amount    DECIMAL(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON service_bookings(provider_id);

-- ═══ OFFLINE SYNC QUEUE ENHANCEMENT ═══
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS error_message TEXT;
`;

async function migrateV6() {
  try {
    await pool.query(MIGRATION_V6);
    console.log('✅ Migration V6 (farmerson integration) applied successfully');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ Migration V6 (farmerson integration) — already up to date');
    } else {
      console.error('⚠️  Migration V6 partial:', err.message);
    }
  }
}

module.exports = { migrateV6 };

if (require.main === module) {
  migrateV6().then(() => process.exit(0)).catch(() => process.exit(1));
}
