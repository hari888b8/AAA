require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V11_AQUAOS = `
-- ============================================================
-- AquaOS V2 — Full Aquaculture Ecosystem Platform
-- Financial Tracking, Disease Reporting, Govt Schemes,
-- Cold Chain, Training Hub, Auction System
-- ============================================================

-- ─── FINANCIAL TRACKING ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id       UUID REFERENCES ponds(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE SET NULL,
  category      VARCHAR(50) NOT NULL,
  subcategory   VARCHAR(100),
  amount        DECIMAL(12,2) NOT NULL,
  quantity      DECIMAL(10,2),
  unit          VARCHAR(20),
  description   TEXT,
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_expenses_farmer ON aqua_expenses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_aqua_expenses_pond ON aqua_expenses(pond_id);

CREATE TABLE IF NOT EXISTS aqua_revenue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id       UUID REFERENCES ponds(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE SET NULL,
  source        VARCHAR(50) NOT NULL DEFAULT 'harvest_sale',
  amount        DECIMAL(12,2) NOT NULL,
  quantity_kg   DECIMAL(10,2),
  price_per_kg  DECIMAL(10,2),
  buyer_name    VARCHAR(200),
  description   TEXT,
  revenue_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_revenue_farmer ON aqua_revenue(farmer_id);

-- ─── DISEASE REPORTING ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_disease_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id       UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE SET NULL,
  disease_name  VARCHAR(200),
  symptoms      TEXT[],
  severity      VARCHAR(20) DEFAULT 'moderate',
  affected_count INTEGER,
  mortality_count INTEGER DEFAULT 0,
  images        TEXT[],
  videos        TEXT[],
  notes         TEXT,
  status        VARCHAR(30) DEFAULT 'reported',
  expert_response TEXT,
  expert_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_aqua_disease_farmer ON aqua_disease_reports(farmer_id);
CREATE INDEX IF NOT EXISTS idx_aqua_disease_pond ON aqua_disease_reports(pond_id);

-- ─── GOVERNMENT SCHEMES (PMMSY) ─────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_scheme_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheme_name     VARCHAR(200) NOT NULL DEFAULT 'PMMSY',
  scheme_component VARCHAR(200),
  project_title   VARCHAR(500),
  project_cost    DECIMAL(14,2),
  subsidy_pct     DECIMAL(5,2),
  subsidy_amount  DECIMAL(14,2),
  category        VARCHAR(50) DEFAULT 'general',
  status          VARCHAR(30) DEFAULT 'draft',
  dpr_data        JSONB DEFAULT '{}',
  documents       JSONB DEFAULT '[]',
  district_id     INTEGER REFERENCES districts(id),
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_scheme_farmer ON aqua_scheme_applications(farmer_id);

-- ─── COLD CHAIN & LOGISTICS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_logistics_providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  provider_type   VARCHAR(50) NOT NULL,
  services        TEXT[],
  coverage_districts INTEGER[],
  contact_phone   VARCHAR(15),
  contact_email   VARCHAR(200),
  rating          DECIMAL(3,2) DEFAULT 0,
  is_verified     BOOLEAN DEFAULT FALSE,
  vehicle_count   INTEGER DEFAULT 0,
  cold_storage_capacity_tons DECIMAL(10,2),
  price_per_km    DECIMAL(8,2),
  price_per_ton   DECIMAL(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aqua_logistics_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_id     UUID REFERENCES aqua_logistics_providers(id) ON DELETE SET NULL,
  listing_id      UUID REFERENCES harvest_listings(id) ON DELETE SET NULL,
  booking_type    VARCHAR(50) NOT NULL DEFAULT 'transport',
  pickup_location TEXT,
  delivery_location TEXT,
  pickup_date     DATE,
  quantity_kg     DECIMAL(10,2),
  species         VARCHAR(100),
  requires_cold_chain BOOLEAN DEFAULT TRUE,
  temperature_required DECIMAL(5,2),
  status          VARCHAR(30) DEFAULT 'requested',
  price_quoted    DECIMAL(10,2),
  price_final     DECIMAL(10,2),
  tracking_id     VARCHAR(100),
  gps_lat         DECIMAL(10,7),
  gps_long        DECIMAL(10,7),
  temperature_log JSONB DEFAULT '[]',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_logistics_farmer ON aqua_logistics_bookings(farmer_id);

-- ─── TRAINING & KNOWLEDGE HUB ───────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_training_modules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(300) NOT NULL,
  title_te        VARCHAR(300),
  title_hi        VARCHAR(300),
  category        VARCHAR(100) NOT NULL,
  description     TEXT,
  content         TEXT,
  content_type    VARCHAR(30) DEFAULT 'article',
  video_url       TEXT,
  image_url       TEXT,
  duration_mins   INTEGER,
  difficulty      VARCHAR(20) DEFAULT 'beginner',
  species_tags    TEXT[],
  is_published    BOOLEAN DEFAULT TRUE,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aqua_training_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES aqua_training_modules(id) ON DELETE CASCADE,
  status          VARCHAR(20) DEFAULT 'started',
  completed_at    TIMESTAMPTZ,
  score           INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- ─── AUCTION SYSTEM ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_auctions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id         UUID REFERENCES ponds(id) ON DELETE SET NULL,
  species         VARCHAR(100) NOT NULL,
  quantity_kg     DECIMAL(10,2) NOT NULL,
  avg_size_g      DECIMAL(10,2),
  size_count      VARCHAR(50),
  base_price      DECIMAL(10,2) NOT NULL,
  current_bid     DECIMAL(10,2),
  bid_count       INTEGER DEFAULT 0,
  auction_type    VARCHAR(20) DEFAULT 'ascending',
  district_id     INTEGER REFERENCES districts(id),
  location_label  TEXT,
  description     TEXT,
  harvest_date    DATE,
  start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time        TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) DEFAULT 'active',
  winner_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  winning_bid     DECIMAL(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_auctions_status ON aqua_auctions(status);

CREATE TABLE IF NOT EXISTS aqua_auction_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id      UUID NOT NULL REFERENCES aqua_auctions(id) ON DELETE CASCADE,
  bidder_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_amount      DECIMAL(10,2) NOT NULL,
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_bids_auction ON aqua_auction_bids(auction_id);

-- ─── FARM BENCHMARKING ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS aqua_benchmarks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species         VARCHAR(100) NOT NULL,
  district_id     INTEGER REFERENCES districts(id),
  metric          VARCHAR(50) NOT NULL,
  avg_value       DECIMAL(10,3),
  top_quartile    DECIMAL(10,3),
  sample_count    INTEGER DEFAULT 0,
  period          VARCHAR(20) DEFAULT 'monthly',
  calculated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_benchmarks_species ON aqua_benchmarks(species, metric);

-- ─── BULK ORDERS (Input Marketplace) ─────────────────────────

CREATE TABLE IF NOT EXISTS aqua_bulk_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id      UUID REFERENCES aqua_products(id) ON DELETE SET NULL,
  product_name    VARCHAR(200),
  quantity        DECIMAL(10,2) NOT NULL,
  unit            VARCHAR(30),
  requested_price DECIMAL(10,2),
  quoted_price    DECIMAL(10,2),
  status          VARCHAR(30) DEFAULT 'requested',
  delivery_date   DATE,
  delivery_address TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_bulk_orders_buyer ON aqua_bulk_orders(buyer_id);

-- ─── ALTER EXISTING TABLES (add missing columns safely) ──────

DO $$ BEGIN
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS salinity_ppt DECIMAL(6,2);
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS ammonia_ppm DECIMAL(6,3);
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS alkalinity_ppm DECIMAL(8,2);
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS culture_type VARCHAR(50) DEFAULT 'pond';
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS stocking_density_per_acre INTEGER;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS farm_type VARCHAR(50);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS total_farm_acres DECIMAL(10,2);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID;
  ALTER TABLE crop_cycles ADD COLUMN IF NOT EXISTS total_feed_kg DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE crop_cycles ADD COLUMN IF NOT EXISTS total_mortality INTEGER DEFAULT 0;
  ALTER TABLE crop_cycles ADD COLUMN IF NOT EXISTS total_expenses DECIMAL(12,2) DEFAULT 0;
  ALTER TABLE crop_cycles ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12,2) DEFAULT 0;
END $$;

-- ─── SEED TRAINING DATA ──────────────────────────────────────

INSERT INTO aqua_training_modules (id, title, title_te, title_hi, category, description, content_type, difficulty, species_tags, duration_mins) VALUES
  (gen_random_uuid(), 'Pond Preparation for Shrimp Culture', 'రొయ్యల సాగు కోసం చెరువు తయారీ', 'झींगा पालन के लिए तालाब तैयारी', 'pond_preparation', 'Complete guide to preparing ponds for Vannamei shrimp culture including soil treatment, liming, and water filling', 'article', 'beginner', ARRAY['vannamei','shrimp'], 15),
  (gen_random_uuid(), 'Feed Management Best Practices', 'ఆహార నిర్వహణ ఉత్తమ పద్ధతులు', 'चारा प्रबंधन सर्वोत्तम प्रथाएं', 'feed_management', 'Learn optimal feeding strategies including check-tray usage, FCR monitoring, and feed scheduling', 'article', 'intermediate', ARRAY['vannamei','rohu','pangasius'], 20),
  (gen_random_uuid(), 'Water Quality Management', 'నీటి నాణ్యత నిర్వహణ', 'जल गुणवत्ता प्रबंधन', 'water_quality', 'Monitor and maintain optimal water parameters: pH, DO, ammonia, alkalinity for healthy aquaculture', 'article', 'beginner', ARRAY['vannamei','rohu','catla'], 12),
  (gen_random_uuid(), 'White Spot Disease Prevention', 'వైట్ స్పాట్ వ్యాధి నివారణ', 'व्हाइट स्पॉट रोग रोकथाम', 'disease_management', 'Identify early signs of WSSV, biosecurity measures, and emergency response protocols', 'article', 'advanced', ARRAY['vannamei','tiger_shrimp'], 25),
  (gen_random_uuid(), 'Harvest Planning & Market Timing', 'పంట ప్రణాళిక & మార్కెట్ సమయం', 'फसल योजना और बाजार समय', 'harvest', 'Determine optimal harvest timing based on shrimp count size and market demand', 'article', 'intermediate', ARRAY['vannamei','shrimp'], 18),
  (gen_random_uuid(), 'PMMSY Subsidy Application Guide', 'PMMSY సబ్సిడీ దరఖాస్తు గైడ్', 'PMMSY सब्सिडी आवेदन गाइड', 'government_schemes', 'Step-by-step guide to apply for Pradhan Mantri Matsya Sampada Yojana subsidies', 'article', 'beginner', ARRAY['all'], 30),
  (gen_random_uuid(), 'Biofloc Technology for Fish Farming', 'చేపల పెంపకం కోసం బయోఫ్లాక్ టెక్నాలజీ', 'मछली पालन के लिए बायोफ्लॉक तकनीक', 'advanced_systems', 'Introduction to biofloc systems: setup, management, and cost-benefit analysis', 'article', 'advanced', ARRAY['tilapia','pangasius'], 35),
  (gen_random_uuid(), 'RAS Setup and Operations', 'RAS సెటప్ మరియు ఆపరేషన్లు', 'RAS सेटअप और संचालन', 'advanced_systems', 'Recirculating Aquaculture Systems: design, filtration, and management', 'article', 'advanced', ARRAY['all'], 40)
ON CONFLICT DO NOTHING;

-- ─── SEED LOGISTICS PROVIDERS ────────────────────────────────

INSERT INTO aqua_logistics_providers (id, name, provider_type, services, contact_phone, rating, is_verified, price_per_km, price_per_ton) VALUES
  (gen_random_uuid(), 'Snowman Logistics', 'integrated', ARRAY['cold_storage','reefer_transport','ice_supply'], '9876543210', 4.5, true, 45, 3500),
  (gen_random_uuid(), 'ColdEX Logistics', 'cold_chain', ARRAY['reefer_transport','temperature_monitoring','last_mile'], '9876543211', 4.3, true, 38, 3000),
  (gen_random_uuid(), 'Gati Fish Express', 'transport', ARRAY['insulated_transport','ice_supply','door_pickup'], '9876543212', 4.1, true, 32, 2500),
  (gen_random_uuid(), 'AP Aqua Transport', 'regional', ARRAY['pond_pickup','ice_packing','market_delivery'], '9876543213', 4.0, false, 25, 2000),
  (gen_random_uuid(), 'Tessol Cold Solutions', 'technology', ARRAY['solar_cold_storage','reefer_transport','iot_monitoring'], '9876543214', 4.6, true, 50, 4000)
ON CONFLICT DO NOTHING;

-- ─── SEED BENCHMARKS ─────────────────────────────────────────

INSERT INTO aqua_benchmarks (id, species, metric, avg_value, top_quartile, sample_count, period) VALUES
  (gen_random_uuid(), 'Vannamei Shrimp', 'fcr', 1.55, 1.35, 450, 'quarterly'),
  (gen_random_uuid(), 'Vannamei Shrimp', 'survival_rate', 78, 88, 450, 'quarterly'),
  (gen_random_uuid(), 'Vannamei Shrimp', 'production_per_acre_tons', 4.2, 5.8, 450, 'quarterly'),
  (gen_random_uuid(), 'Vannamei Shrimp', 'sgr', 3.2, 4.1, 300, 'quarterly'),
  (gen_random_uuid(), 'Rohu', 'fcr', 1.8, 1.5, 200, 'quarterly'),
  (gen_random_uuid(), 'Rohu', 'survival_rate', 82, 92, 200, 'quarterly'),
  (gen_random_uuid(), 'Pangasius', 'fcr', 1.6, 1.4, 150, 'quarterly'),
  (gen_random_uuid(), 'Pangasius', 'survival_rate', 85, 93, 150, 'quarterly')
ON CONFLICT DO NOTHING;
`;

async function migrateV11AquaOS() {
  const client = await pool.connect();
  try {
    await client.query(MIGRATION_V11_AQUAOS);
    console.log('[migrate-v11-aquaos] ✅ AquaOS V2 tables created');
  } catch (err) {
    console.error('[migrate-v11-aquaos] ❌ Migration failed:', err.message);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateV11AquaOS().then(() => process.exit(0));
}

module.exports = { migrateV11AquaOS };
