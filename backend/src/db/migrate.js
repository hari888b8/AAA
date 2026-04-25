require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION = `
-- ============================================================
-- AgriHub Foundation — Standard PostgreSQL (no PostGIS)
-- ============================================================

-- ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('farmer','fpo','buyer','admin','service_provider');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE crop_season AS ENUM ('kharif','rabi','zaid','perennial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE quality_grade AS ENUM ('A+','A','B','C','ungraded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('draft','active','sold','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE inquiry_status AS ENUM ('pending','responded','accepted','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE equipment_status AS ENUM ('available','booked','maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE pond_status AS ENUM ('active','harvested','fallow','preparation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(15) NOT NULL UNIQUE,
  name          VARCHAR(100),
  role          user_role NOT NULL DEFAULT 'farmer',
  language      VARCHAR(5) NOT NULL DEFAULT 'en',
  district_id   INTEGER,
  state_code    VARCHAR(5),
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  avatar_url    TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- TABLE: otps (OTP verification)
CREATE TABLE IF NOT EXISTS otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(15) NOT NULL,
  code       VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

-- TABLE: refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: crop_catalog
CREATE TABLE IF NOT EXISTS crop_catalog (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  name_te             VARCHAR(100),
  name_hi             VARCHAR(100),
  variety             VARCHAR(100),
  category            VARCHAR(50) NOT NULL,
  season              crop_season,
  avg_yield_per_acre  DECIMAL(10,2),
  min_price_reference DECIMAL(10,2),
  growing_days        INTEGER,
  is_organic_eligible BOOLEAN DEFAULT TRUE,
  icon_emoji          VARCHAR(10),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: districts
CREATE TABLE IF NOT EXISTS districts (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  name_local    VARCHAR(100),
  state_code    VARCHAR(5) NOT NULL,
  state_name    VARCHAR(50) NOT NULL,
  total_farmers INTEGER DEFAULT 0,
  primary_crops TEXT[],
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: declarations (farmer crop declarations — core intelligence input)
CREATE TABLE IF NOT EXISTS declarations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_id               INTEGER NOT NULL REFERENCES crop_catalog(id),
  district_id           INTEGER REFERENCES districts(id),
  area_acres            DECIMAL(10,2) NOT NULL CHECK (area_acres > 0),
  expected_yield        DECIMAL(10,2),
  sow_date              DATE NOT NULL,
  expected_harvest_date DATE NOT NULL,
  actual_harvest_date   DATE,
  quality_grade         quality_grade DEFAULT 'ungraded',
  is_organic            BOOLEAN DEFAULT FALSE,
  quality_score         DECIMAL(5,2) DEFAULT 50.00,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_declarations_farmer   ON declarations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_declarations_crop     ON declarations(crop_id);
CREATE INDEX IF NOT EXISTS idx_declarations_district ON declarations(district_id);
CREATE INDEX IF NOT EXISTS idx_declarations_harvest  ON declarations(expected_harvest_date);

-- TABLE: supply_listings (FPO published supply)
CREATE TABLE IF NOT EXISTS supply_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id            UUID NOT NULL REFERENCES users(id),
  crop_id           INTEGER NOT NULL REFERENCES crop_catalog(id),
  district_id       INTEGER REFERENCES districts(id),
  quantity_kg       DECIMAL(12,2) NOT NULL CHECK (quantity_kg > 0),
  grade             quality_grade DEFAULT 'ungraded',
  is_organic        BOOLEAN DEFAULT FALSE,
  price_per_kg      DECIMAL(10,2),
  min_order_kg      DECIMAL(10,2),
  collection_center VARCHAR(200),
  logistic_support  BOOLEAN DEFAULT FALSE,
  status            listing_status DEFAULT 'active',
  description       TEXT,
  farmer_name       VARCHAR(100),
  location_label    VARCHAR(200),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supply_crop   ON supply_listings(crop_id);
CREATE INDEX IF NOT EXISTS idx_supply_fpo    ON supply_listings(fpo_id);
CREATE INDEX IF NOT EXISTS idx_supply_status ON supply_listings(status);

-- TABLE: inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID NOT NULL REFERENCES users(id),
  listing_id       UUID REFERENCES supply_listings(id),
  seller_id        UUID NOT NULL REFERENCES users(id),
  crop_id          INTEGER REFERENCES crop_catalog(id),
  quantity_needed  DECIMAL(12,2),
  timeline         VARCHAR(100),
  message          TEXT,
  status           inquiry_status DEFAULT 'pending',
  response_message TEXT,
  responded_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer   ON inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_seller  ON inquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status  ON inquiries(status);

-- TABLE: price_feeds
CREATE TABLE IF NOT EXISTS price_feeds (
  id                  SERIAL PRIMARY KEY,
  crop_id             INTEGER NOT NULL REFERENCES crop_catalog(id),
  market_name         VARCHAR(100),
  district_id         INTEGER REFERENCES districts(id),
  price_per_quintal   DECIMAL(10,2) NOT NULL,
  min_price           DECIMAL(10,2),
  max_price           DECIMAL(10,2),
  source              VARCHAR(30) NOT NULL DEFAULT 'platform',
  recorded_at         TIMESTAMPTZ DEFAULT NOW(),
  arrival_qty_tonnes  DECIMAL(10,2)
);
CREATE INDEX IF NOT EXISTS idx_prices_crop ON price_feeds(crop_id);
CREATE INDEX IF NOT EXISTS idx_prices_date ON price_feeds(recorded_at);

-- TABLE: ponds (AquaOS)
CREATE TABLE IF NOT EXISTS ponds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_code       VARCHAR(20) NOT NULL,
  species         VARCHAR(100),
  area_acres      DECIMAL(8,2),
  stocked_count   INTEGER,
  stocking_date   DATE,
  survival_pct    DECIMAL(5,2),
  avg_weight_g    DECIMAL(8,2),
  ph_level        DECIMAL(4,2),
  temperature_c   DECIMAL(5,2),
  dissolved_o2    DECIMAL(5,2),
  status          pond_status DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ponds_farmer ON ponds(farmer_id);

-- TABLE: water_quality_logs
CREATE TABLE IF NOT EXISTS water_quality_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id       UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  ph_level      DECIMAL(4,2),
  temperature_c DECIMAL(5,2),
  dissolved_o2  DECIMAL(5,2),
  salinity_ppt  DECIMAL(5,2),
  ammonia_ppm   DECIMAL(6,3),
  notes         TEXT,
  logged_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wql_pond ON water_quality_logs(pond_id);
CREATE INDEX IF NOT EXISTS idx_wql_date ON water_quality_logs(logged_at);

-- TABLE: advisories (AquaOS disease/weather alerts)
CREATE TABLE IF NOT EXISTS advisories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity    VARCHAR(20) NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  district_id INTEGER REFERENCES districts(id),
  species     VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: properties (FarmerConnect)
CREATE TABLE IF NOT EXISTS properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(300) NOT NULL,
  property_type   VARCHAR(50) NOT NULL,
  location_label  VARCHAR(200),
  district_id     INTEGER REFERENCES districts(id),
  area            VARCHAR(100),
  rent_amount     DECIMAL(12,2),
  rent_period     VARCHAR(20) DEFAULT 'month',
  furnishing      VARCHAR(50),
  floor_info      VARCHAR(100),
  is_verified     BOOLEAN DEFAULT FALSE,
  is_available    BOOLEAN DEFAULT TRUE,
  description     TEXT,
  images          TEXT[],
  amenities       TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_properties_owner    ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_type     ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district_id);

-- TABLE: equipment (KisanConnect)
CREATE TABLE IF NOT EXISTS equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(200) NOT NULL,
  equipment_type  VARCHAR(100) NOT NULL,
  hourly_rate     DECIMAL(10,2),
  daily_rate      DECIMAL(10,2),
  operator_included BOOLEAN DEFAULT FALSE,
  location_label  VARCHAR(200),
  district_id     INTEGER REFERENCES districts(id),
  rating          DECIMAL(3,2) DEFAULT 0,
  total_bookings  INTEGER DEFAULT 0,
  status          equipment_status DEFAULT 'available',
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equipment_type   ON equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);

-- TABLE: equipment_bookings
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  renter_id    UUID NOT NULL REFERENCES users(id),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days         INTEGER,
  total_amount DECIMAL(12,2),
  status       VARCHAR(30) DEFAULT 'confirmed',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: jobs (KisanConnect)
CREATE TABLE IF NOT EXISTS jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id    UUID NOT NULL REFERENCES users(id),
  title          VARCHAR(300) NOT NULL,
  employer_name  VARCHAR(200),
  job_type       VARCHAR(50),
  salary_min     DECIMAL(10,2),
  salary_max     DECIMAL(10,2),
  salary_period  VARCHAR(20) DEFAULT 'month',
  location_label VARCHAR(200),
  district_id    INTEGER REFERENCES districts(id),
  vacancies      INTEGER DEFAULT 1,
  description    TEXT,
  skills         TEXT[],
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active   ON jobs(is_active);

-- TABLE: harvest_listings (AquaOS marketplace)
CREATE TABLE IF NOT EXISTS harvest_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id         UUID REFERENCES ponds(id),
  species         VARCHAR(100) NOT NULL,
  quantity_kg     DECIMAL(10,2) NOT NULL,
  avg_size_g      DECIMAL(8,2),
  price_per_kg    DECIMAL(10,2),
  district_id     INTEGER REFERENCES districts(id),
  location_label  VARCHAR(200),
  status          VARCHAR(30) DEFAULT 'available',
  description     TEXT,
  harvest_date    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_harvest_farmer ON harvest_listings(farmer_id);

-- TABLE: community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300),
  content     TEXT NOT NULL,
  category    VARCHAR(50) DEFAULT 'general',
  app_context VARCHAR(30) DEFAULT 'agriflow',
  district_id INTEGER REFERENCES districts(id),
  tags        JSONB,
  likes       INTEGER DEFAULT 0,
  replies     INTEGER DEFAULT 0,
  views       INTEGER DEFAULT 0,
  pinned      BOOLEAN DEFAULT FALSE,
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_app ON community_posts(app_context);
CREATE INDEX IF NOT EXISTS idx_community_status ON community_posts(status);

-- TABLE: orders
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  listing_id      UUID,
  listing_type    VARCHAR(30) DEFAULT 'supply',
  quantity        DECIMAL(12,2),
  price_per_unit  DECIMAL(12,2),
  total_amount    DECIMAL(12,2),
  status          VARCHAR(30) DEFAULT 'pending',
  payment_status  VARCHAR(30) DEFAULT 'unpaid',
  delivery_address TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);

-- TABLE: activity_feed (real-time events)
CREATE TABLE IF NOT EXISTS activity_feed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(50) NOT NULL,
  actor_name  VARCHAR(100),
  description TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  body            TEXT NOT NULL,
  type            VARCHAR(50),
  data            JSONB DEFAULT '{}',
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- AUTO-UPDATED updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_declarations_upd BEFORE UPDATE ON declarations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_supply_upd BEFORE UPDATE ON supply_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_ponds_upd BEFORE UPDATE ON ponds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_properties_upd BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_equipment_upd BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

async function migrate() {
  console.log('🔧 Running AgriHub database migration...');
  try {
    await pool.query(MIGRATION);
    console.log('✅ Schema created successfully');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then(() => { console.log('✅ Migration complete'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
