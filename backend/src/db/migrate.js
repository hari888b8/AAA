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

-- TABLE: farmer_profiles (extended farmer data per PRD)
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state           VARCHAR(100),
  district_id     INTEGER REFERENCES districts(id),
  mandal          VARCHAR(100),
  village         VARCHAR(150),
  pincode         VARCHAR(6),
  total_land_acres DECIMAL(10,3),
  land_unit       VARCHAR(20) DEFAULT 'acres',
  irrigation_type TEXT[],
  farming_method  VARCHAR(50) DEFAULT 'conventional',
  soil_type       TEXT[],
  organic_certified BOOLEAN DEFAULT FALSE,
  primary_crops   TEXT[],
  fpo_id          UUID,
  contact_consent VARCHAR(20) DEFAULT 'fpo_only',
  data_quality_score SMALLINT DEFAULT 50,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user ON farmer_profiles(user_id);

-- TABLE: fpo_profiles (FPO management per PRD Section 7)
CREATE TABLE IF NOT EXISTS fpo_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fpo_name            VARCHAR(200) NOT NULL,
  fpo_type            VARCHAR(50) DEFAULT 'FPO',
  registration_number VARCHAR(100),
  state               VARCHAR(100),
  district_id         INTEGER REFERENCES districts(id),
  block               VARCHAR(100),
  office_address      TEXT,
  ceo_name            VARCHAR(150),
  whatsapp_number     VARCHAR(15),
  member_count        INTEGER DEFAULT 0,
  active_member_count INTEGER DEFAULT 0,
  primary_crops       TEXT[],
  subscription_plan   VARCHAR(50) DEFAULT 'starter',
  verification_status VARCHAR(30) DEFAULT 'pending',
  trust_score         SMALLINT DEFAULT 50,
  response_rate       DECIMAL(5,2) DEFAULT 0,
  year_established    SMALLINT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fpo_profiles_user ON fpo_profiles(user_id);

-- TABLE: fpo_memberships
CREATE TABLE IF NOT EXISTS fpo_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id     UUID NOT NULL REFERENCES fpo_profiles(id) ON DELETE CASCADE,
  farmer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20) DEFAULT 'active',
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fpo_id, farmer_id)
);

-- TABLE: buyer_profiles (Buyer Intelligence per PRD Section 8)
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name      VARCHAR(200),
  business_type     VARCHAR(50),
  gstin             VARCHAR(15),
  state             VARCHAR(100),
  city              VARCHAR(100),
  sourcing_states   TEXT[],
  commodities       TEXT[],
  monthly_volume_tons DECIMAL(10,2),
  subscription_plan VARCHAR(50) DEFAULT 'explorer',
  contact_name      VARCHAR(150),
  contact_email     VARCHAR(255),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user ON buyer_profiles(user_id);

-- TABLE: procurement_records (FPO procurement from farmers)
CREATE TABLE IF NOT EXISTS procurement_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id            UUID NOT NULL REFERENCES fpo_profiles(id),
  farmer_id         UUID NOT NULL REFERENCES users(id),
  crop_id           INTEGER REFERENCES crop_catalog(id),
  quantity_kg       DECIMAL(12,2) NOT NULL,
  quality_grade     quality_grade DEFAULT 'ungraded',
  moisture_content  DECIMAL(5,2),
  price_per_kg      DECIMAL(10,2) NOT NULL,
  gross_amount      DECIMAL(12,2),
  deduction_transport DECIMAL(10,2) DEFAULT 0,
  deduction_other   DECIMAL(10,2) DEFAULT 0,
  net_payable       DECIMAL(12,2),
  payment_status    VARCHAR(30) DEFAULT 'pending',
  payment_mode      VARCHAR(30),
  paid_at           TIMESTAMPTZ,
  collection_center VARCHAR(200),
  procurement_date  TIMESTAMPTZ DEFAULT NOW(),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_procurement_fpo ON procurement_records(fpo_id);
CREATE INDEX IF NOT EXISTS idx_procurement_farmer ON procurement_records(farmer_id);

-- TABLE: fpo_inventory
CREATE TABLE IF NOT EXISTS fpo_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id            UUID NOT NULL REFERENCES fpo_profiles(id),
  crop_id           INTEGER REFERENCES crop_catalog(id),
  storage_location  VARCHAR(200),
  storage_type      VARCHAR(50),
  quantity_kg       DECIMAL(12,2) NOT NULL,
  quality_grade     quality_grade DEFAULT 'ungraded',
  entry_date        DATE DEFAULT CURRENT_DATE,
  freshness_status  VARCHAR(20) DEFAULT 'fresh',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fpo_inventory ON fpo_inventory(fpo_id);

-- TABLE: fpo_supply_listings (FPO → Buyer marketplace)
CREATE TABLE IF NOT EXISTS fpo_supply_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id            UUID NOT NULL REFERENCES fpo_profiles(id),
  crop_id           INTEGER REFERENCES crop_catalog(id),
  quantity_available DECIMAL(12,2) NOT NULL,
  quality_grade     quality_grade DEFAULT 'A',
  harvest_from_date DATE,
  harvest_to_date   DATE,
  price_per_kg      DECIMAL(10,2),
  min_order_kg      DECIMAL(10,2),
  packaging         TEXT[],
  certifications    TEXT[],
  storage_location  VARCHAR(200),
  special_notes     TEXT,
  status            listing_status DEFAULT 'active',
  view_count        INTEGER DEFAULT 0,
  inquiry_count     INTEGER DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fpo_supply ON fpo_supply_listings(fpo_id);
CREATE INDEX IF NOT EXISTS idx_fpo_supply_crop ON fpo_supply_listings(crop_id);
CREATE INDEX IF NOT EXISTS idx_fpo_supply_status ON fpo_supply_listings(status);

-- TABLE: buyer_inquiries (detailed buyer → FPO inquiry)
CREATE TABLE IF NOT EXISTS buyer_inquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          UUID NOT NULL REFERENCES users(id),
  fpo_listing_id    UUID REFERENCES fpo_supply_listings(id),
  crop_id           INTEGER REFERENCES crop_catalog(id),
  quantity_needed   DECIMAL(12,2),
  required_by_date  DATE,
  delivery_location TEXT,
  quality_needed    quality_grade,
  price_range_min   DECIMAL(10,2),
  price_range_max   DECIMAL(10,2),
  message           TEXT,
  status            inquiry_status DEFAULT 'pending',
  response_message  TEXT,
  contact_shared    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyer_inquiries_buyer ON buyer_inquiries(buyer_id);

-- TABLE: buyer_watchlists
CREATE TABLE IF NOT EXISTS buyer_watchlists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID NOT NULL REFERENCES users(id),
  crop_id          INTEGER REFERENCES crop_catalog(id),
  state            VARCHAR(100),
  district_id      INTEGER REFERENCES districts(id),
  min_quantity_kg  DECIMAL(12,2),
  max_price_per_kg DECIMAL(10,2),
  alert_enabled    BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watchlists_buyer ON buyer_watchlists(buyer_id);

-- TABLE: supply_intelligence (computed aggregates)
CREATE TABLE IF NOT EXISTS supply_intelligence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id           INTEGER REFERENCES crop_catalog(id),
  state             VARCHAR(100),
  district_id       INTEGER REFERENCES districts(id),
  total_declared_area DECIMAL(12,3),
  total_declared_yield DECIMAL(12,3),
  farmer_count      INTEGER,
  forecast_harvest_tons DECIMAL(12,3),
  forecast_confidence DECIMAL(5,2),
  fpo_listed_tons   DECIMAL(12,3),
  active_fpo_count  INTEGER,
  price_trend_7d    DECIMAL(5,2),
  price_trend_30d   DECIMAL(5,2),
  computed_at       TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: device_tokens (FCM push notification registration)
CREATE TABLE IF NOT EXISTS device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token   TEXT NOT NULL,
  platform    VARCHAR(10) DEFAULT 'android',
  app_version VARCHAR(20),
  active      BOOLEAN DEFAULT TRUE,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);

-- TABLE: uploaded_files
CREATE TABLE IF NOT EXISTS uploaded_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  url         TEXT NOT NULL,
  context     VARCHAR(50) DEFAULT 'general',
  size_bytes  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id);

-- TABLE: post_comments
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- Alter notifications table to add read_at if not exist
DO $$ BEGIN
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'system';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

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

-- TABLE: job_applications
CREATE TABLE IF NOT EXISTS job_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience      VARCHAR(200),
  expected_salary DECIMAL(10,2),
  available_from  DATE,
  cover_note      TEXT,
  status          VARCHAR(30) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);
CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_applicant ON job_applications(applicant_id);

-- Add applications_count to jobs if missing
DO $$ BEGIN
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================
-- NEW TABLES — Phase 2 Feature Gap Closure
-- ============================================================

-- TABLE: feed_logs (AquaOS — dedicated feed tracking)
CREATE TABLE IF NOT EXISTS feed_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id     UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  feed_type   VARCHAR(100) NOT NULL,
  quantity_kg DECIMAL(8,2) NOT NULL,
  cost        DECIMAL(10,2),
  brand       VARCHAR(100),
  notes       TEXT,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_logs_pond ON feed_logs(pond_id);
CREATE INDEX IF NOT EXISTS idx_feed_logs_date ON feed_logs(logged_at);

-- TABLE: growth_samples (AquaOS — weight tracking over time)
CREATE TABLE IF NOT EXISTS growth_samples (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id       UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  avg_weight_g  DECIMAL(8,2) NOT NULL,
  sample_count  INTEGER DEFAULT 10,
  survival_pct  DECIMAL(5,2),
  notes         TEXT,
  sampled_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_pond ON growth_samples(pond_id);

-- TABLE: aqua_products (AquaOS Input Marketplace)
CREATE TABLE IF NOT EXISTS aqua_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  category      VARCHAR(50) NOT NULL,
  brand         VARCHAR(100),
  description   TEXT,
  price         DECIMAL(10,2),
  unit          VARCHAR(30) DEFAULT 'kg',
  species_tags  TEXT[],
  in_stock      BOOLEAN DEFAULT TRUE,
  rating        DECIMAL(3,2) DEFAULT 0,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_products_cat ON aqua_products(category);

-- Add supplier_id column for supplier product CRUD
ALTER TABLE aqua_products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_aqua_products_supplier ON aqua_products(supplier_id);

-- TABLE: aqua_farms (AquaOS Farm Management)
CREATE TABLE IF NOT EXISTS aqua_farms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_name       VARCHAR(200) NOT NULL,
  location        VARCHAR(300),
  district_id     INTEGER REFERENCES districts(id),
  state           VARCHAR(100) DEFAULT 'Andhra Pradesh',
  gps_lat         DECIMAL(10,7),
  gps_long        DECIMAL(10,7),
  total_area_acres DECIMAL(10,2),
  pond_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_farms_farmer ON aqua_farms(farmer_id);

-- TABLE: crop_cycles (AquaOS - per-pond crop lifecycle)
CREATE TABLE IF NOT EXISTS crop_cycles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id           UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  species           VARCHAR(100) NOT NULL,
  stocking_date     DATE NOT NULL,
  seed_count        INTEGER NOT NULL,
  seed_supplier     VARCHAR(200),
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  harvest_quantity_kg DECIMAL(12,2),
  avg_weight_at_harvest DECIMAL(8,2),
  survival_pct      DECIMAL(5,2) DEFAULT 80,
  fcr               DECIMAL(5,2),
  total_feed_kg     DECIMAL(12,2) DEFAULT 0,
  total_mortality   INTEGER DEFAULT 0,
  status            VARCHAR(30) DEFAULT 'active',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_pond ON crop_cycles(pond_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_status ON crop_cycles(status);

-- TABLE: mortality_logs (AquaOS - daily mortality tracking)
CREATE TABLE IF NOT EXISTS mortality_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id         UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  crop_cycle_id   UUID REFERENCES crop_cycles(id),
  mortality_count INTEGER NOT NULL,
  reason          TEXT,
  symptoms        TEXT[],
  severity        VARCHAR(20) DEFAULT 'normal',
  logged_at       DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mortality_pond ON mortality_logs(pond_id);

-- TABLE: aqua_offers (AquaOS - buyer offers on harvest)
CREATE TABLE IF NOT EXISTS aqua_offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  listing_id      UUID NOT NULL REFERENCES harvest_listings(id),
  offer_price     DECIMAL(10,2) NOT NULL,
  quantity_kg     DECIMAL(10,2),
  message         TEXT,
  status          VARCHAR(30) DEFAULT 'pending',
  farmer_response TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_offers_listing ON aqua_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_aqua_offers_buyer ON aqua_offers(buyer_id);

-- TABLE: aqua_messages (AquaOS - negotiation chat)
CREATE TABLE IF NOT EXISTS aqua_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES users(id),
  receiver_id     UUID NOT NULL REFERENCES users(id),
  listing_id      UUID REFERENCES harvest_listings(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_messages_parties ON aqua_messages(sender_id, receiver_id);

-- TABLE: aqua_price_intelligence (daily market prices)
CREATE TABLE IF NOT EXISTS aqua_price_intelligence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species         VARCHAR(100) NOT NULL,
  size_count      INTEGER,
  market_name     VARCHAR(100) NOT NULL,
  district_id     INTEGER REFERENCES districts(id),
  price_per_kg    DECIMAL(10,2) NOT NULL,
  price_date      DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_prices_date ON aqua_price_intelligence(price_date DESC);
CREATE INDEX IF NOT EXISTS idx_aqua_prices_species ON aqua_price_intelligence(species);

-- Add farm_id to ponds if not exist
DO $$ BEGIN
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES aqua_farms(id);
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS water_source VARCHAR(50);
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS location_label VARCHAR(200);
  ALTER TABLE ponds ADD COLUMN IF NOT EXISTS depth_m DECIMAL(5,2);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Seed aqua price intelligence
INSERT INTO aqua_price_intelligence (id, species, size_count, market_name, district_id, price_per_kg, price_date)
SELECT gen_random_uuid(), s.species, s.size_count, s.market_name, NULL, s.price, CURRENT_DATE
FROM (VALUES
  ('Vannamei Shrimp', 30, 'Nellore', 420),
  ('Vannamei Shrimp', 30, 'Bhimavaram', 435),
  ('Vannamei Shrimp', 30, 'Kakinada', 428),
  ('Vannamei Shrimp', 40, 'Nellore', 380),
  ('Vannamei Shrimp', 40, 'Bhimavaram', 390),
  ('Vannamei Shrimp', 50, 'Kakinada', 340),
  ('Tiger Prawn', 20, 'Bhimavaram', 580),
  ('Tiger Prawn', 30, 'Nellore', 520),
  ('Rohu', NULL, 'Eluru', 140),
  ('Rohu', NULL, 'Vijayawada', 145),
  ('Catla', NULL, 'Vijayawada', 130),
  ('Pangasius', NULL, 'West Godavari', 85),
  ('Mud Crab', NULL, 'Srikakulam', 850),
  ('Mud Crab', NULL, 'East Godavari', 900)
) AS s(species, size_count, market_name, price)
ON CONFLICT DO NOTHING;

-- TABLE: crop_listings (KisanConnect Crop Marketplace)
CREATE TABLE IF NOT EXISTS crop_listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES users(id),
  crop_name     VARCHAR(100) NOT NULL,
  variety       VARCHAR(100),
  quantity_kg   DECIMAL(12,2) NOT NULL,
  price_per_kg  DECIMAL(10,2),
  quality_grade VARCHAR(20) DEFAULT 'ungraded',
  is_organic    BOOLEAN DEFAULT FALSE,
  district_id   INTEGER REFERENCES districts(id),
  location_label VARCHAR(200),
  description   TEXT,
  images        TEXT[],
  status        VARCHAR(30) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crop_listings_seller ON crop_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_crop_listings_status ON crop_listings(status);

-- TABLE: service_listings (KisanConnect Rural Services)
CREATE TABLE IF NOT EXISTS service_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES users(id),
  service_type    VARCHAR(100) NOT NULL,
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2),
  price_unit      VARCHAR(30) DEFAULT 'per_visit',
  district_id     INTEGER REFERENCES districts(id),
  location_label  VARCHAR(200),
  rating          DECIMAL(3,2) DEFAULT 0,
  total_bookings  INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_listings_type ON service_listings(service_type);

-- TABLE: service_requests (KisanConnect service booking)
CREATE TABLE IF NOT EXISTS service_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      UUID NOT NULL REFERENCES service_listings(id),
  requester_id    UUID NOT NULL REFERENCES users(id),
  preferred_date  DATE,
  notes           TEXT,
  status          VARCHAR(30) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: reviews (cross-platform review system)
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type     VARCHAR(30) NOT NULL,
  target_id       VARCHAR(100) NOT NULL,
  rating          SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           VARCHAR(200),
  body            TEXT,
  photos          JSONB DEFAULT '[]',
  helpful_count   INTEGER DEFAULT 0,
  order_id        UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- TABLE: society_management (FarmerConnect B2B)
CREATE TABLE IF NOT EXISTS societies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id      UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(200) NOT NULL,
  address         TEXT,
  total_units     INTEGER DEFAULT 0,
  district_id     INTEGER REFERENCES districts(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS society_visitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  visitor_name    VARCHAR(100) NOT NULL,
  phone           VARCHAR(15),
  purpose         VARCHAR(100),
  unit_number     VARCHAR(20),
  check_in        TIMESTAMPTZ DEFAULT NOW(),
  check_out       TIMESTAMPTZ,
  status          VARCHAR(20) DEFAULT 'checked_in'
);

CREATE TABLE IF NOT EXISTS maintenance_dues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  unit_number     VARCHAR(20) NOT NULL,
  resident_name   VARCHAR(100),
  amount          DECIMAL(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  status          VARCHAR(20) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS society_complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  unit_number     VARCHAR(20),
  resident_name   VARCHAR(100),
  category        VARCHAR(50) NOT NULL,
  description     TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'open',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS society_notices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id      UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  content         TEXT NOT NULL,
  priority        VARCHAR(20) DEFAULT 'normal',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: rent_agreements (FarmerConnect digital agreements)
CREATE TABLE IF NOT EXISTS rent_agreements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id),
  owner_id        UUID NOT NULL REFERENCES users(id),
  tenant_name     VARCHAR(100) NOT NULL,
  tenant_phone    VARCHAR(15),
  rent_amount     DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  terms           TEXT,
  status          VARCHAR(20) DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: price_history (Intelligence historical tracking)
CREATE TABLE IF NOT EXISTS price_history (
  id              SERIAL PRIMARY KEY,
  crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
  district_id     INTEGER REFERENCES districts(id),
  price_per_quintal DECIMAL(10,2) NOT NULL,
  recorded_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_history_crop ON price_history(crop_id, recorded_date);

-- TABLE: subscriptions (cross-platform monetization)
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  plan_name       VARCHAR(50) NOT NULL,
  plan_type       VARCHAR(30) NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  status          VARCHAR(20) DEFAULT 'active',
  starts_at       DATE DEFAULT CURRENT_DATE,
  expires_at      DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: KYC DOCUMENTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aqua_kyc_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type     VARCHAR(50) NOT NULL,
  doc_url      TEXT,
  status       VARCHAR(20) DEFAULT 'pending',
  admin_note   TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_aqua_kyc_user ON aqua_kyc_documents(user_id);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: PRICE ALERTS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aqua_price_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species      VARCHAR(100) NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  direction    VARCHAR(10) NOT NULL DEFAULT 'above',
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_alerts_user ON aqua_price_alerts(user_id);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: SAVED SEARCHES (Buyer)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aqua_saved_searches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  filters      JSONB NOT NULL DEFAULT '{}',
  is_alert_on  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_searches_user ON aqua_saved_searches(user_id);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: NOTIFICATION PREFERENCES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aqua_notification_prefs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  feed_reminder    BOOLEAN DEFAULT TRUE,
  advisory_alerts  BOOLEAN DEFAULT TRUE,
  offer_notifs     BOOLEAN DEFAULT TRUE,
  community_replies BOOLEAN DEFAULT TRUE,
  daily_prices     BOOLEAN DEFAULT FALSE,
  listing_expiry   BOOLEAN DEFAULT TRUE,
  supplier_promos  BOOLEAN DEFAULT FALSE,
  quiet_from       VARCHAR(5) DEFAULT '22:00',
  quiet_to         VARCHAR(5) DEFAULT '06:00',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: PRIVACY SETTINGS (DPDP Act 2023)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aqua_privacy_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  location_visibility VARCHAR(20) DEFAULT 'district',
  hide_volume         BOOLEAN DEFAULT FALSE,
  contact_after_offer BOOLEAN DEFAULT TRUE,
  allow_analytics     BOOLEAN DEFAULT TRUE,
  anonymous_community BOOLEAN DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: IoT SENSOR READINGS
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aqua_iot_readings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id     UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  sensor_type VARCHAR(50) NOT NULL,
  value       DECIMAL(10,4) NOT NULL,
  unit        VARCHAR(20),
  read_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqua_iot_pond ON aqua_iot_readings(pond_id, read_at DESC);

-- ════════════════════════════════════════════════════════════════
-- AQUAOS: REFERRAL CODE on users
-- ════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- ADD COMPLETED CROP CYCLE COUNT for verified badges
-- ════════════════════════════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_cycles INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add image_url to community_posts if missing
DO $$ BEGIN
  ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add status_history to orders if missing
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS crop_name VARCHAR(100);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add weekly_rate to equipment if missing
DO $$ BEGIN
  ALTER TABLE equipment ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10,2);
  ALTER TABLE equipment ADD COLUMN IF NOT EXISTS insurance_info TEXT;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- AGRIGALAXY: Stores & Products
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agrigalaxy_stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  district_id INTEGER REFERENCES districts(id),
  address     TEXT,
  categories  TEXT[] DEFAULT '{}',
  gst_number  VARCHAR(20),
  phone       VARCHAR(15),
  rating      DECIMAL(3,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agrigalaxy_stores_owner ON agrigalaxy_stores(owner_id);

CREATE TABLE IF NOT EXISTS agrigalaxy_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES agrigalaxy_stores(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(50) NOT NULL,
  brand       VARCHAR(100),
  description TEXT,
  price       DECIMAL(10,2),
  unit        VARCHAR(30) DEFAULT 'piece',
  stock       INTEGER DEFAULT 0,
  rating      DECIMAL(3,2) DEFAULT 0,
  image_url   TEXT,
  crop_tags   TEXT[] DEFAULT '{}',
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agrigalaxy_products_store ON agrigalaxy_products(store_id);
CREATE INDEX IF NOT EXISTS idx_agrigalaxy_products_cat ON agrigalaxy_products(category);

-- ════════════════════════════════════════════════════════════════
-- BHOOMIOS: Land Listings & Inquiries
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bhoomios_listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(300) NOT NULL,
  land_type     VARCHAR(50) NOT NULL,
  listing_mode  VARCHAR(20) NOT NULL DEFAULT 'sale',
  area_acres    DECIMAL(10,2) NOT NULL CHECK (area_acres > 0),
  price         DECIMAL(14,2),
  price_unit    VARCHAR(20) DEFAULT 'total',
  district_id   INTEGER REFERENCES districts(id),
  location_label VARCHAR(200),
  water_sources TEXT[] DEFAULT '{}',
  soil_types    TEXT[] DEFAULT '{}',
  crops_grown   TEXT[] DEFAULT '{}',
  road_access   BOOLEAN DEFAULT FALSE,
  fencing       BOOLEAN DEFAULT FALSE,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_available  BOOLEAN DEFAULT TRUE,
  description   TEXT,
  images        TEXT[] DEFAULT '{}',
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bhoomios_listings_owner ON bhoomios_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bhoomios_listings_type ON bhoomios_listings(land_type);
CREATE INDEX IF NOT EXISTS idx_bhoomios_listings_mode ON bhoomios_listings(listing_mode);
CREATE INDEX IF NOT EXISTS idx_bhoomios_listings_district ON bhoomios_listings(district_id);

CREATE TABLE IF NOT EXISTS bhoomios_inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES bhoomios_listings(id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES users(id),
  seller_id     UUID NOT NULL REFERENCES users(id),
  message       TEXT,
  offered_price DECIMAL(14,2),
  contact_phone VARCHAR(15),
  status        VARCHAR(20) DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bhoomios_inq_listing ON bhoomios_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_bhoomios_inq_seller ON bhoomios_inquiries(seller_id);

CREATE TABLE IF NOT EXISTS bhoomios_saved (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES bhoomios_listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_bhoomios_saved_user ON bhoomios_saved(user_id);

-- ════════════════════════════════════════════════════════════════
-- PAYMENTS: Orders & Transactions
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payment_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number    VARCHAR(50) UNIQUE NOT NULL,
  gateway_order_id VARCHAR(100),
  gateway_payment_id VARCHAR(100),
  amount          DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(5) DEFAULT 'INR',
  commission      DECIMAL(10,2) DEFAULT 0,
  order_type      VARCHAR(30),
  reference_id    UUID,
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'created',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway ON payment_orders(gateway_order_id);

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id),
  amount          DECIMAL(12,2) NOT NULL,
  type            VARCHAR(20) NOT NULL DEFAULT 'payment',
  status          VARCHAR(20) DEFAULT 'completed',
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- Add kyc columns to farmer_profiles if missing
DO $$ BEGIN
  ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending';
  ALTER TABLE farmer_profiles ADD COLUMN IF NOT EXISTS kyc_documents JSONB DEFAULT '[]';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- CHAT / MESSAGING
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context_type VARCHAR(30),
  context_id   VARCHAR(100),
  last_message TEXT,
  last_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  msg_type        VARCHAR(20) DEFAULT 'text',
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ORDER TRACKING
CREATE TABLE IF NOT EXISTS order_tracking (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   VARCHAR(100) NOT NULL,
  order_type VARCHAR(30) NOT NULL,
  status     VARCHAR(40) NOT NULL,
  location   VARCHAR(200),
  notes      TEXT,
  actor_id   UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking(order_id, order_type);

-- NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS notification_prefs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  price_alerts    BOOLEAN DEFAULT TRUE,
  order_updates   BOOLEAN DEFAULT TRUE,
  weather_alerts  BOOLEAN DEFAULT TRUE,
  community_replies BOOLEAN DEFAULT TRUE,
  new_inquiries   BOOLEAN DEFAULT TRUE,
  promotions      BOOLEAN DEFAULT FALSE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_prefs(user_id);

-- ════════════════════════════════════════════════════════════════
-- SPRINT 1: UNIFIED WALLET & CREDIT SYSTEM
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wallet_credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits     INTEGER NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('earn', 'spend')),
  action      VARCHAR(50) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_user ON wallet_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_type ON wallet_credits(user_id, type);

-- ════════════════════════════════════════════════════════════════
-- SPRINT 1: SCHEME DISCOVERY & APPLICATION ENGINE
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scheme_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheme_id           VARCHAR(50) NOT NULL,
  scheme_title        VARCHAR(300) NOT NULL,
  category            VARCHAR(50),
  application_data    JSONB DEFAULT '{}',
  documents_pending   JSONB DEFAULT '[]',
  documents_uploaded  JSONB DEFAULT '[]',
  status              VARCHAR(30) DEFAULT 'submitted',
  notes               TEXT,
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheme_apps_user ON scheme_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheme_apps_scheme ON scheme_applications(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_apps_status ON scheme_applications(status);

-- ════════════════════════════════════════════════════════════════
-- SPRINT 1: CROP DISEASE DETECTION (AI)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS disease_detections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_name       VARCHAR(100) NOT NULL,
  disease_id      VARCHAR(100),
  disease_name    VARCHAR(200),
  confidence      INTEGER,
  severity        VARCHAR(20) DEFAULT 'medium',
  image_url       TEXT,
  location_label  VARCHAR(200),
  symptoms_reported TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_disease_det_user ON disease_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_disease_det_disease ON disease_detections(disease_id);
CREATE INDEX IF NOT EXISTS idx_disease_det_date ON disease_detections(created_at DESC);

-- Seed aqua products
INSERT INTO aqua_products (id, name, category, brand, price, unit, species_tags, description) VALUES
  (gen_random_uuid(), 'Vannamei Starter Feed', 'feed', 'CP Aquaculture', 85, 'kg', ARRAY['vannamei'], 'High-protein starter feed for PL stage'),
  (gen_random_uuid(), 'Vannamei Grower Feed', 'feed', 'CP Aquaculture', 72, 'kg', ARRAY['vannamei'], 'Optimized for 30-60 DOC growth phase'),
  (gen_random_uuid(), 'Vannamei Finisher Feed', 'feed', 'Growel', 68, 'kg', ARRAY['vannamei'], 'Finisher feed for market-size shrimp'),
  (gen_random_uuid(), 'Rohu Floating Feed', 'feed', 'Godrej Agrovet', 45, 'kg', ARRAY['rohu', 'catla'], 'Floating pellets for carp species'),
  (gen_random_uuid(), 'Probiotics - AquaPro', 'medicine', 'Biostadt', 450, 'bottle', ARRAY['vannamei', 'rohu'], 'Pond probiotics for water quality'),
  (gen_random_uuid(), 'Mineral Mix Plus', 'supplement', 'Nourish Aqua', 320, 'kg', ARRAY['vannamei'], 'Essential minerals for healthy growth'),
  (gen_random_uuid(), 'Vannamei PL Seeds - SPF', 'seed', 'BMR Hatchery', 0.35, 'PL', ARRAY['vannamei'], 'SPF certified post-larvae'),
  (gen_random_uuid(), 'Rohu Fingerlings', 'seed', 'State Fisheries', 2.5, 'piece', ARRAY['rohu'], 'Healthy fingerlings 3-5 inch'),
  (gen_random_uuid(), 'Anti-Vibrio Treatment', 'medicine', 'Aquasol', 580, 'bottle', ARRAY['vannamei'], 'Treatment for vibrio infections'),
  (gen_random_uuid(), 'Pond Lime - Agri Grade', 'supplement', 'Tata Chemicals', 12, 'kg', ARRAY['vannamei', 'rohu'], 'pH correction and disinfection'),
  (gen_random_uuid(), 'DO Booster Tablets', 'supplement', 'AquaZyme', 250, 'pack', ARRAY['vannamei', 'rohu'], 'Emergency dissolved oxygen booster'),
  (gen_random_uuid(), 'Biofloc Culture Starter', 'supplement', 'BioFloc India', 1200, 'kit', ARRAY['vannamei'], 'Complete biofloc starter kit')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Machine Connect — Farmer-Driver Connectivity Platform
-- ============================================================

-- Machine operators / drivers who provide services
CREATE TABLE IF NOT EXISTS machine_operators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  operator_name   VARCHAR(100) NOT NULL,
  phone           VARCHAR(15) NOT NULL,
  machine_type    VARCHAR(50) NOT NULL,
  machine_name    VARCHAR(150),
  machine_model   VARCHAR(100),
  hourly_rate     DECIMAL(10,2),
  daily_rate      DECIMAL(10,2),
  experience_years INTEGER DEFAULT 0,
  location_label  VARCHAR(200),
  district_id     INTEGER REFERENCES districts(id),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  is_available    BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE,
  rating          DECIMAL(3,2) DEFAULT 0,
  total_jobs      INTEGER DEFAULT 0,
  bio             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_machine_operators_type ON machine_operators(machine_type);
CREATE INDEX IF NOT EXISTS idx_machine_operators_available ON machine_operators(is_available);
CREATE INDEX IF NOT EXISTS idx_machine_operators_district ON machine_operators(district_id);

-- Instant machine requests from farmers
CREATE TABLE IF NOT EXISTS machine_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id),
  machine_type    VARCHAR(50) NOT NULL,
  urgency         VARCHAR(20) DEFAULT 'normal',
  description     TEXT,
  location_label  VARCHAR(200),
  district_id     INTEGER REFERENCES districts(id),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  needed_date     DATE,
  needed_time     VARCHAR(20),
  duration_hours  INTEGER,
  budget_max      DECIMAL(10,2),
  acres           DECIMAL(6,2),
  status          VARCHAR(30) DEFAULT 'open',
  matched_operator_id UUID REFERENCES machine_operators(id),
  accepted_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  farmer_rating   DECIMAL(3,2),
  operator_rating DECIMAL(3,2),
  total_cost      DECIMAL(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_machine_requests_status ON machine_requests(status);
CREATE INDEX IF NOT EXISTS idx_machine_requests_type ON machine_requests(machine_type);
CREATE INDEX IF NOT EXISTS idx_machine_requests_farmer ON machine_requests(farmer_id);

-- Operator responses to requests
CREATE TABLE IF NOT EXISTS machine_request_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES machine_requests(id),
  operator_id     UUID NOT NULL REFERENCES machine_operators(id),
  proposed_rate   DECIMAL(10,2),
  eta_minutes     INTEGER,
  message         TEXT,
  status          VARCHAR(20) DEFAULT 'offered',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_request_responses_request ON machine_request_responses(request_id);
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
