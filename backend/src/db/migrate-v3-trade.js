require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V3 = `
-- ============================================================
-- AgriHub V3 Migration — Trusted Trade Layer
-- "Assured Trade Flow": Farmer → Listing → Buyer Bid → Escrow → Delivery → Payment
-- ============================================================

-- ═══ TRADE ORDERS: The complete end-to-end trade lifecycle ═══
CREATE TABLE IF NOT EXISTS trade_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID REFERENCES supply_listings(id),
  seller_id         UUID NOT NULL REFERENCES users(id),
  buyer_id          UUID REFERENCES users(id),
  crop_id           INTEGER REFERENCES crop_catalog(id),
  district_id       INTEGER REFERENCES districts(id),

  -- Quantity & Pricing
  quantity_kg       DECIMAL(12,2) NOT NULL,
  price_per_kg      DECIMAL(10,2) NOT NULL,
  total_amount      DECIMAL(12,2) NOT NULL,
  platform_fee      DECIMAL(10,2) DEFAULT 0,
  seller_payout     DECIMAL(12,2) DEFAULT 0,

  -- Location (GPS)
  pickup_lat        DECIMAL(10,7),
  pickup_lng        DECIMAL(10,7),
  pickup_address    TEXT,
  delivery_lat      DECIMAL(10,7),
  delivery_lng      DECIMAL(10,7),
  delivery_address  TEXT,

  -- Media
  photos            JSONB DEFAULT '[]',
  voice_note_url    TEXT,

  -- Quality
  grade             VARCHAR(5) DEFAULT 'ungraded',
  quality_verified  BOOLEAN DEFAULT FALSE,
  quality_photos    JSONB DEFAULT '[]',

  -- Trade lifecycle state machine
  -- created → bid_placed → bid_accepted → escrow_funded → quality_verified → 
  -- dispatched → in_transit → delivered → payment_released
  -- Any state → disputed → resolved
  -- created/bid_placed → cancelled
  status            VARCHAR(30) DEFAULT 'created',
  escrow_id         UUID,

  -- Delivery tracking
  transport_mode    VARCHAR(30),
  vehicle_number    VARCHAR(20),
  driver_phone      VARCHAR(15),
  estimated_delivery TIMESTAMPTZ,
  actual_delivery   TIMESTAMPTZ,

  -- Timestamps
  bid_at            TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  funded_at         TIMESTAMPTZ,
  dispatched_at     TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  disputed_at       TIMESTAMPTZ,

  -- Metadata
  cancel_reason     TEXT,
  dispute_reason    TEXT,
  notes             TEXT,
  metadata          JSONB DEFAULT '{}',

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_orders_seller ON trade_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_buyer ON trade_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON trade_orders(status);
CREATE INDEX IF NOT EXISTS idx_trade_orders_listing ON trade_orders(listing_id);

-- ═══ TRADE BIDS: Multiple buyers can bid on a listing ═══
CREATE TABLE IF NOT EXISTS trade_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES supply_listings(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  price_per_kg    DECIMAL(10,2) NOT NULL,
  quantity_kg     DECIMAL(12,2) NOT NULL,
  delivery_address TEXT,
  delivery_lat    DECIMAL(10,7),
  delivery_lng    DECIMAL(10,7),
  notes           TEXT,
  status          VARCHAR(20) DEFAULT 'active',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_bids_listing ON trade_bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_bids_buyer ON trade_bids(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_bids_status ON trade_bids(status);

-- ═══ TRADE TIMELINE: Audit log of every state change ═══
CREATE TABLE IF NOT EXISTS trade_timeline (
  id              SERIAL PRIMARY KEY,
  trade_order_id  UUID NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
  event           VARCHAR(50) NOT NULL,
  actor_id        UUID REFERENCES users(id),
  actor_role      VARCHAR(20),
  description     TEXT,
  location_lat    DECIMAL(10,7),
  location_lng    DECIMAL(10,7),
  photos          JSONB DEFAULT '[]',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_timeline_order ON trade_timeline(trade_order_id);

-- ═══ TRUST SCORES: Reliability scoring for buyers & sellers ═══
CREATE TABLE IF NOT EXISTS trust_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score           INTEGER DEFAULT 50,
  total_trades    INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  on_time_delivery_pct DECIMAL(5,2) DEFAULT 0,
  dispute_rate    DECIMAL(5,2) DEFAULT 0,
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_score ON trust_scores(score DESC);

-- ═══ Add GPS and photo columns to supply_listings if missing ═══
DO $$ BEGIN
  ALTER TABLE supply_listings ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7);
  ALTER TABLE supply_listings ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7);
  ALTER TABLE supply_listings ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
  ALTER TABLE supply_listings ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
  ALTER TABLE supply_listings ADD COLUMN IF NOT EXISTS farmer_id UUID;
END $$;
`;

async function migrateV3Trade() {
  console.log('🔧 Running AgriHub V3 migration (Trusted Trade Layer)...');
  try {
    await pool.query(MIGRATION_V3);
    console.log('✅ V3 Trade schema created successfully');
  } catch (err) {
    console.error('❌ V3 Trade Migration error:', err.message);
    throw err;
  }
}

module.exports = { migrateV3Trade };

if (require.main === module) {
  migrateV3Trade()
    .then(() => { console.log('✅ V3 Trade Migration complete'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
