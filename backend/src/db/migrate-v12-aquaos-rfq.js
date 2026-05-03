require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V12_AQUAOS_RFQ = `
-- ============================================================
-- AquaOS V3 — RFQ System, Escrow Payments, Yield Forecasting,
-- Aqua Community, Onboarding
-- ============================================================

-- ─── RFQ (Request for Quotation) SYSTEM ─────────────────────

CREATE TABLE IF NOT EXISTS aqua_rfqs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  species         VARCHAR(100) NOT NULL,
  quantity_kg     DECIMAL(10,2) NOT NULL,
  size_spec       VARCHAR(100),
  quality_grade   VARCHAR(50),
  max_price_per_kg DECIMAL(10,2),
  delivery_location TEXT,
  delivery_date   DATE,
  district_id     INTEGER REFERENCES districts(id),
  description     TEXT,
  status          VARCHAR(30) DEFAULT 'open',
  quote_count     INTEGER DEFAULT 0,
  selected_quote_id UUID,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_rfqs_status ON aqua_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_aqua_rfqs_buyer ON aqua_rfqs(buyer_id);

CREATE TABLE IF NOT EXISTS aqua_rfq_quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES aqua_rfqs(id) ON DELETE CASCADE,
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_per_kg    DECIMAL(10,2) NOT NULL,
  quantity_available DECIMAL(10,2),
  harvest_date    DATE,
  quality_notes   TEXT,
  pond_id         UUID REFERENCES ponds(id) ON DELETE SET NULL,
  location_label  TEXT,
  message         TEXT,
  status          VARCHAR(30) DEFAULT 'submitted',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_rfq_quotes_rfq ON aqua_rfq_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_aqua_rfq_quotes_farmer ON aqua_rfq_quotes(farmer_id);

-- ─── ESCROW PAYMENT SYSTEM ──────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_escrow_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID REFERENCES harvest_listings(id) ON DELETE SET NULL,
  auction_id      UUID REFERENCES aqua_auctions(id) ON DELETE SET NULL,
  rfq_id          UUID REFERENCES aqua_rfqs(id) ON DELETE SET NULL,
  buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(14,2) NOT NULL,
  platform_fee    DECIMAL(10,2) DEFAULT 0,
  seller_payout   DECIMAL(14,2),
  quantity_kg     DECIMAL(10,2),
  price_per_kg    DECIMAL(10,2),
  species         VARCHAR(100),
  status          VARCHAR(30) DEFAULT 'initiated',
  payment_method  VARCHAR(50),
  payment_ref     VARCHAR(200),
  funded_at       TIMESTAMPTZ,
  quality_verified_at TIMESTAMPTZ,
  dispatched_at   TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  released_at     TIMESTAMPTZ,
  dispute_reason  TEXT,
  dispute_at      TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_escrow_buyer ON aqua_escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_aqua_escrow_seller ON aqua_escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_aqua_escrow_status ON aqua_escrow_transactions(status);

-- ─── AQUA COMMUNITY ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_community_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category        VARCHAR(50) NOT NULL DEFAULT 'discussion',
  species_tag     VARCHAR(100),
  title           VARCHAR(300),
  content         TEXT NOT NULL,
  images          TEXT[],
  district_id     INTEGER REFERENCES districts(id),
  like_count      INTEGER DEFAULT 0,
  reply_count     INTEGER DEFAULT 0,
  is_pinned       BOOLEAN DEFAULT FALSE,
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_community_user ON aqua_community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_aqua_community_cat ON aqua_community_posts(category);

CREATE TABLE IF NOT EXISTS aqua_community_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES aqua_community_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  images          TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_replies_post ON aqua_community_replies(post_id);

-- ─── YIELD FORECASTING HISTORY ──────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_yield_forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id         UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  crop_cycle_id   UUID REFERENCES crop_cycles(id) ON DELETE SET NULL,
  forecast_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  predicted_harvest_date DATE,
  predicted_yield_kg DECIMAL(10,2),
  predicted_weight_g DECIMAL(8,2),
  confidence_pct  DECIMAL(5,2),
  model_version   VARCHAR(20) DEFAULT 'v1',
  inputs          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_forecast_pond ON aqua_yield_forecasts(pond_id);

-- ─── FARMER ONBOARDING ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_onboarding_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step            VARCHAR(50) NOT NULL,
  completed       BOOLEAN DEFAULT FALSE,
  data            JSONB DEFAULT '{}',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step)
);
`;

async function migrateV12AquaOSRFQ() {
  const client = await pool.connect();
  try {
    await client.query(MIGRATION_V12_AQUAOS_RFQ);
    console.log('[migrate-v12-aquaos-rfq] ✅ AquaOS V3 RFQ + Escrow + Community tables created');
  } catch (err) {
    console.error('[migrate-v12-aquaos-rfq] ❌ Migration failed:', err.message);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateV12AquaOSRFQ().then(() => process.exit(0));
}

module.exports = { migrateV12AquaOSRFQ };
