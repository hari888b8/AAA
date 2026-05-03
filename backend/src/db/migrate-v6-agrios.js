'use strict';

/**
 * Migration V6 — Agriculture Operating System Core
 * Adds: Logistics, Input Marketplace, Crop Planning AI, Multi-Stakeholder Onboarding
 * Phase 1 of the Agriculture OS implementation
 */

require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V6 = `
-- ═══════════════════════════════════════════════════════════════
-- MIGRATION V6: AGRICULTURE OPERATING SYSTEM — PHASE 1
-- ═══════════════════════════════════════════════════════════════

-- ═══ 1A. LOGISTICS SYSTEM ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS logistics_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  name            VARCHAR(200) NOT NULL,
  partner_type    VARCHAR(50) NOT NULL DEFAULT 'individual',
  vehicle_type    VARCHAR(50) NOT NULL,
  vehicle_number  VARCHAR(20),
  phone           VARCHAR(15) NOT NULL,
  district_id     UUID REFERENCES districts(id),
  mandal          VARCHAR(100),
  village         VARCHAR(100),
  is_verified     BOOLEAN DEFAULT false,
  is_available    BOOLEAN DEFAULT true,
  rating          DECIMAL(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  max_capacity_kg DECIMAL(10,2),
  coverage_radius_km INTEGER DEFAULT 25,
  commission_rate DECIMAL(4,3) DEFAULT 0.05,
  bank_account    JSONB DEFAULT '{}',
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL,
  order_type      VARCHAR(50) NOT NULL DEFAULT 'trade',
  pickup_lat      DECIMAL(10,7),
  pickup_lng      DECIMAL(10,7),
  pickup_address  TEXT,
  pickup_contact  VARCHAR(15),
  pickup_name     VARCHAR(200),
  pickup_slot     TIMESTAMPTZ,
  delivery_lat    DECIMAL(10,7),
  delivery_lng    DECIMAL(10,7),
  delivery_address TEXT,
  delivery_contact VARCHAR(15),
  delivery_name   VARCHAR(200),
  delivery_slot   TIMESTAMPTZ,
  weight_kg       DECIMAL(10,2),
  cargo_type      VARCHAR(100),
  requires_cold   BOOLEAN DEFAULT false,
  special_notes   TEXT,
  partner_id      UUID REFERENCES logistics_partners(id),
  status          VARCHAR(50) DEFAULT 'pending',
  distance_km     DECIMAL(8,2),
  estimated_cost  DECIMAL(10,2),
  actual_cost     DECIMAL(10,2),
  otp_pickup      VARCHAR(6),
  otp_delivery    VARCHAR(6),
  assigned_at     TIMESTAMPTZ,
  picked_up_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID REFERENCES logistics_partners(id),
  route_name      VARCHAR(200),
  batch_date      DATE NOT NULL,
  status          VARCHAR(50) DEFAULT 'planning',
  total_orders    INTEGER DEFAULT 0,
  total_weight_kg DECIMAL(10,2) DEFAULT 0,
  total_distance_km DECIMAL(8,2) DEFAULT 0,
  optimized_route JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_batch_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID REFERENCES delivery_batches(id) ON DELETE CASCADE,
  delivery_id     UUID REFERENCES delivery_requests(id),
  sequence_order  INTEGER NOT NULL,
  pickup_or_drop  VARCHAR(10) NOT NULL DEFAULT 'pickup'
);

CREATE INDEX IF NOT EXISTS idx_delivery_req_status ON delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_logistics_available ON logistics_partners(district_id, is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_delivery_req_partner ON delivery_requests(partner_id, status);

-- ═══ 1B. INPUT MARKETPLACE ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS input_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  name_te         VARCHAR(100),
  name_hi         VARCHAR(100),
  icon_emoji      VARCHAR(10),
  parent_id       UUID REFERENCES input_categories(id),
  sort_order      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS input_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES input_categories(id),
  name            VARCHAR(200) NOT NULL,
  name_te         VARCHAR(200),
  name_hi         VARCHAR(200),
  brand           VARCHAR(100),
  manufacturer    VARCHAR(200),
  description     TEXT,
  crop_suitable   UUID[] DEFAULT '{}',
  application_method TEXT,
  dosage_info     TEXT,
  mrp             DECIMAL(10,2),
  discount_pct    DECIMAL(5,2) DEFAULT 0,
  unit            VARCHAR(20) DEFAULT 'kg',
  pack_sizes      JSONB DEFAULT '[]',
  images          TEXT[] DEFAULT '{}',
  organic_certified BOOLEAN DEFAULT false,
  government_approved BOOLEAN DEFAULT false,
  license_number  VARCHAR(100),
  expiry_months   INTEGER,
  rating          DECIMAL(3,2) DEFAULT 0,
  total_orders    INTEGER DEFAULT 0,
  in_stock        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS input_sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  shop_name       VARCHAR(200) NOT NULL,
  license_number  VARCHAR(100),
  district_id     UUID REFERENCES districts(id),
  address         TEXT,
  phone           VARCHAR(15),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  delivery_available BOOLEAN DEFAULT true,
  delivery_radius_km INTEGER DEFAULT 15,
  rating          DECIMAL(3,2) DEFAULT 0,
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS input_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID REFERENCES input_sellers(id),
  product_id      UUID REFERENCES input_products(id),
  price           DECIMAL(10,2) NOT NULL,
  stock_quantity  INTEGER DEFAULT 0,
  pack_size       VARCHAR(50),
  is_available    BOOLEAN DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, product_id, pack_size)
);

CREATE TABLE IF NOT EXISTS input_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID REFERENCES users(id),
  seller_id       UUID REFERENCES input_sellers(id),
  items           JSONB NOT NULL DEFAULT '[]',
  total_amount    DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  delivery_lat    DECIMAL(10,7),
  delivery_lng    DECIMAL(10,7),
  status          VARCHAR(50) DEFAULT 'placed',
  payment_status  VARCHAR(50) DEFAULT 'pending',
  delivery_id     UUID REFERENCES delivery_requests(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_input_products_category ON input_products(category_id);
CREATE INDEX IF NOT EXISTS idx_input_inventory_seller ON input_inventory(seller_id, is_available);
CREATE INDEX IF NOT EXISTS idx_input_orders_buyer ON input_orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_input_sellers_district ON input_sellers(district_id);

-- ═══ 1C. CROP PLANNING AI ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS crop_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  season          VARCHAR(20) NOT NULL,
  year            INTEGER NOT NULL,
  field_name      VARCHAR(100),
  area_acres      DECIMAL(6,2),
  recommended_crop UUID REFERENCES crop_catalog(id),
  selected_crop   UUID REFERENCES crop_catalog(id),
  variety         VARCHAR(100),
  reason          TEXT,
  estimated_cost_per_acre DECIMAL(10,2),
  estimated_yield_per_acre DECIMAL(10,2),
  estimated_price  DECIMAL(10,2),
  projected_profit DECIMAL(12,2),
  last_season_crop UUID REFERENCES crop_catalog(id),
  last_season_yield DECIMAL(10,2),
  last_season_profit DECIMAL(12,2),
  status          VARCHAR(30) DEFAULT 'suggested',
  actual_yield    DECIMAL(10,2),
  actual_profit   DECIMAL(12,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_plan_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID REFERENCES crop_plans(id) ON DELETE CASCADE,
  task_type       VARCHAR(50) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  title_te        VARCHAR(200),
  title_hi        VARCHAR(200),
  description     TEXT,
  due_date        DATE,
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  sequence_order  INTEGER NOT NULL,
  input_needed    JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  season          VARCHAR(20) NOT NULL,
  year            INTEGER NOT NULL,
  total_area_acres DECIMAL(8,2),
  total_investment DECIMAL(12,2),
  total_revenue   DECIMAL(12,2),
  net_profit      DECIMAL(12,2),
  crops_data      JSONB DEFAULT '[]',
  comparison_prev_season JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farmer_id, season, year)
);

CREATE INDEX IF NOT EXISTS idx_crop_plans_farmer ON crop_plans(farmer_id, season, year);
CREATE INDEX IF NOT EXISTS idx_crop_plan_tasks_plan ON crop_plan_tasks(plan_id, sequence_order);

-- ═══ 1D. MULTI-STAKEHOLDER ONBOARDING ═══════════════════════════

-- Add user_type column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
    ALTER TABLE users ADD COLUMN user_type VARCHAR(50) DEFAULT 'farmer';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS exporter_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  company_name    VARCHAR(200) NOT NULL,
  export_license  VARCHAR(100),
  iec_code        VARCHAR(20),
  fssai_license   VARCHAR(50),
  countries_exported TEXT[] DEFAULT '{}',
  crops_interested UUID[] DEFAULT '{}',
  annual_volume_tonnes DECIMAL(10,2),
  quality_certifications TEXT[] DEFAULT '{}',
  warehouse_locations JSONB DEFAULT '[]',
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  company_name    VARCHAR(200) NOT NULL,
  supplier_type   VARCHAR(50) NOT NULL,
  license_number  VARCHAR(100),
  gst_number      VARCHAR(20),
  product_categories UUID[] DEFAULT '{}',
  district_ids    UUID[] DEFAULT '{}',
  delivery_available BOOLEAN DEFAULT true,
  minimum_order   DECIMAL(10,2) DEFAULT 0,
  credit_offered  BOOLEAN DEFAULT false,
  credit_days     INTEGER DEFAULT 0,
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  institution_name VARCHAR(200) NOT NULL,
  institution_type VARCHAR(50) NOT NULL,
  license_number  VARCHAR(100),
  districts_served UUID[] DEFAULT '{}',
  products_offered TEXT[] DEFAULT '{}',
  interest_range  VARCHAR(50),
  max_loan_amount DECIMAL(14,2),
  api_enabled     BOOLEAN DEFAULT false,
  webhook_url     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ SEED INPUT CATEGORIES ═══════════════════════════════════════

INSERT INTO input_categories (name, name_te, name_hi, icon_emoji, sort_order) VALUES
('Seeds', 'విత్తనాలు', 'बीज', '🌱', 1),
('Fertilizers', 'ఎరువులు', 'उर्वरक', '🧪', 2),
('Pesticides', 'పురుగుమందులు', 'कीटनाशक', '🔬', 3),
('Growth Promoters', 'వృద్ధి ప్రోత్సాహకాలు', 'वृद्धि प्रवर्तक', '🌿', 4),
('Tools & Accessories', 'పరికరాలు', 'उपकरण', '🔧', 5),
('Organic Inputs', 'సేంద్రీయ ఇన్పుట్‌లు', 'जैविक इनपुट', '♻️', 6)
ON CONFLICT DO NOTHING;
`;

async function migrateV6AgriOS() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(MIGRATION_V6);
    await client.query('COMMIT');
    console.log('✅ Migration V6 (Agriculture OS Phase 1) completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration V6 failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { migrateV6AgriOS };

if (require.main === module) {
  migrateV6AgriOS().then(() => process.exit(0)).catch(() => process.exit(1));
}
