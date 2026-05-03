require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V13_AQUAOS_V4 = `
-- ============================================================
-- AquaOS V4 — Culture Units, Multi-Species, Harvest Optimizer,
-- IoT Device Management, Trust Verification, Acre-Based Analytics
-- ============================================================

-- ─── CULTURE UNITS (Multi-type: Pond, RAS, Cage, Biofloc, Hatchery) ─
CREATE TABLE IF NOT EXISTS aqua_culture_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id         UUID NOT NULL REFERENCES aqua_farms(id) ON DELETE CASCADE,
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_code       VARCHAR(50) NOT NULL,
  unit_type       VARCHAR(30) NOT NULL DEFAULT 'pond',
  species         VARCHAR(100),
  area_acres      DECIMAL(8,2),
  volume_m3       DECIMAL(10,2),
  depth_m         DECIMAL(5,2),
  tank_count      INTEGER DEFAULT 1,
  cage_count      INTEGER DEFAULT 1,
  water_source    VARCHAR(100),
  salinity_type   VARCHAR(20) DEFAULT 'freshwater',
  status          VARCHAR(20) DEFAULT 'active',
  stocking_density_per_m3 DECIMAL(8,2),
  current_stock_count INTEGER DEFAULT 0,
  stocking_date   DATE,
  expected_harvest DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_unit_type CHECK (unit_type IN ('pond', 'ras_tank', 'cage', 'biofloc', 'hatchery', 'nursery', 'raceway'))
);
CREATE INDEX IF NOT EXISTS idx_culture_units_farm ON aqua_culture_units(farm_id);
CREATE INDEX IF NOT EXISTS idx_culture_units_farmer ON aqua_culture_units(farmer_id);
CREATE INDEX IF NOT EXISTS idx_culture_units_type ON aqua_culture_units(unit_type);

-- ─── SPECIES CONFIGURATION (Growth parameters per species) ───
CREATE TABLE IF NOT EXISTS aqua_species_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_name      VARCHAR(100) NOT NULL UNIQUE,
  species_category  VARCHAR(30) NOT NULL DEFAULT 'fish',
  scientific_name   VARCHAR(200),
  optimal_temp_min  DECIMAL(4,1),
  optimal_temp_max  DECIMAL(4,1),
  optimal_ph_min    DECIMAL(3,1),
  optimal_ph_max    DECIMAL(3,1),
  optimal_do_min    DECIMAL(4,1),
  optimal_salinity_min DECIMAL(5,1),
  optimal_salinity_max DECIMAL(5,1),
  target_fcr        DECIMAL(4,2),
  growth_rate_g_per_day DECIMAL(5,3),
  typical_culture_days INTEGER,
  typical_stocking_density INTEGER,
  harvest_size_min_g DECIMAL(8,2),
  harvest_size_max_g DECIMAL(8,2),
  diseases_common   TEXT[],
  feed_protein_pct  DECIMAL(4,1),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_species_category CHECK (species_category IN ('shrimp', 'fish', 'crab', 'shellfish', 'seaweed', 'other'))
);

-- Seed default species configurations
INSERT INTO aqua_species_config (species_name, species_category, scientific_name, optimal_temp_min, optimal_temp_max, optimal_ph_min, optimal_ph_max, optimal_do_min, optimal_salinity_min, optimal_salinity_max, target_fcr, growth_rate_g_per_day, typical_culture_days, typical_stocking_density, harvest_size_min_g, harvest_size_max_g, diseases_common, feed_protein_pct)
VALUES
  ('Vannamei Shrimp', 'shrimp', 'Litopenaeus vannamei', 26, 33, 7.5, 8.5, 4.0, 5, 35, 1.5, 0.25, 120, 40, 20, 40, ARRAY['White Spot Syndrome', 'EMS', 'White Feces Disease', 'Running Mortality Syndrome'], 35),
  ('Black Tiger Shrimp', 'shrimp', 'Penaeus monodon', 25, 32, 7.8, 8.5, 4.5, 10, 35, 1.8, 0.20, 150, 25, 25, 50, ARRAY['White Spot Syndrome', 'Yellow Head Disease', 'Monodon Baculovirus'], 38),
  ('Rohu', 'fish', 'Labeo rohita', 24, 32, 6.5, 8.5, 4.0, 0, 0, 1.8, 2.5, 365, 8000, 800, 1500, ARRAY['EUS', 'Columnaris', 'Gill Rot'], 28),
  ('Catla', 'fish', 'Catla catla', 24, 32, 6.5, 8.5, 4.0, 0, 0, 2.0, 3.0, 365, 5000, 1000, 2000, ARRAY['EUS', 'Ulcerative Disease'], 25),
  ('Tilapia', 'fish', 'Oreochromis niloticus', 22, 34, 6.5, 8.5, 3.5, 0, 15, 1.6, 2.0, 180, 15000, 300, 800, ARRAY['Streptococcosis', 'Columnaris', 'Aeromonas'], 30),
  ('Pangasius', 'fish', 'Pangasianodon hypophthalmus', 24, 32, 6.5, 7.5, 3.0, 0, 0, 1.4, 4.0, 210, 20000, 1000, 2000, ARRAY['Bacillary Necrosis', 'Red Spot Disease'], 26),
  ('Mud Crab', 'crab', 'Scylla serrata', 25, 32, 7.5, 8.5, 4.0, 15, 30, 3.0, 1.0, 120, 5, 400, 800, ARRAY['Shell Disease', 'Vibriosis'], 40),
  ('Seabass', 'fish', 'Lates calcarifer', 26, 33, 7.0, 8.5, 4.5, 0, 35, 1.5, 3.5, 270, 3000, 500, 3000, ARRAY['Vibriosis', 'Iridovirus'], 42)
ON CONFLICT (species_name) DO NOTHING;

-- ─── HARVEST OPTIMIZER (Price-size optimization data) ────────
CREATE TABLE IF NOT EXISTS aqua_harvest_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species         VARCHAR(100) NOT NULL,
  size_category   VARCHAR(50) NOT NULL,
  size_count      INTEGER,
  min_weight_g    DECIMAL(8,2),
  max_weight_g    DECIMAL(8,2),
  price_per_kg    DECIMAL(10,2) NOT NULL,
  market_name     VARCHAR(100),
  district_id     INTEGER REFERENCES districts(id),
  effective_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  source          VARCHAR(50) DEFAULT 'market_data',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_harvest_prices_species ON aqua_harvest_prices(species, effective_date);

-- Seed sample harvest pricing for shrimp (count-based)
INSERT INTO aqua_harvest_prices (species, size_category, size_count, min_weight_g, max_weight_g, price_per_kg, market_name, effective_date) VALUES
  ('Vannamei Shrimp', '20 count', 20, 45, 55, 550, 'Nellore', CURRENT_DATE),
  ('Vannamei Shrimp', '30 count', 30, 30, 38, 420, 'Nellore', CURRENT_DATE),
  ('Vannamei Shrimp', '40 count', 40, 22, 28, 340, 'Nellore', CURRENT_DATE),
  ('Vannamei Shrimp', '50 count', 50, 18, 22, 290, 'Bhimavaram', CURRENT_DATE),
  ('Vannamei Shrimp', '60 count', 60, 15, 18, 250, 'Ongole', CURRENT_DATE),
  ('Vannamei Shrimp', '70 count', 70, 12, 15, 220, 'Ongole', CURRENT_DATE),
  ('Vannamei Shrimp', '80 count', 80, 10, 13, 200, 'Kakinada', CURRENT_DATE),
  ('Black Tiger Shrimp', '15 count', 15, 60, 75, 750, 'Kakinada', CURRENT_DATE),
  ('Black Tiger Shrimp', '20 count', 20, 45, 55, 650, 'Nellore', CURRENT_DATE),
  ('Black Tiger Shrimp', '30 count', 30, 30, 38, 480, 'Bhimavaram', CURRENT_DATE),
  ('Rohu', '800g-1kg', NULL, 800, 1000, 160, 'Eluru', CURRENT_DATE),
  ('Rohu', '1-1.5kg', NULL, 1000, 1500, 180, 'Vijayawada', CURRENT_DATE),
  ('Pangasius', '1-1.5kg', NULL, 1000, 1500, 95, 'Vijayawada', CURRENT_DATE),
  ('Pangasius', '1.5-2kg', NULL, 1500, 2000, 110, 'Eluru', CURRENT_DATE),
  ('Tilapia', '300-500g', NULL, 300, 500, 140, 'Hyderabad', CURRENT_DATE),
  ('Tilapia', '500-800g', NULL, 500, 800, 165, 'Hyderabad', CURRENT_DATE),
  ('Mud Crab', '400-600g', NULL, 400, 600, 800, 'Kakinada', CURRENT_DATE),
  ('Mud Crab', '600-800g', NULL, 600, 800, 1100, 'Visakhapatnam', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ─── IoT DEVICE MANAGEMENT ──────────────────────────────────
CREATE TABLE IF NOT EXISTS aqua_iot_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id         UUID REFERENCES ponds(id) ON DELETE SET NULL,
  culture_unit_id UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL,
  device_type     VARCHAR(50) NOT NULL,
  device_name     VARCHAR(200),
  device_serial   VARCHAR(100),
  manufacturer    VARCHAR(100),
  parameters      TEXT[],
  status          VARCHAR(20) DEFAULT 'active',
  last_reading_at TIMESTAMPTZ,
  alert_enabled   BOOLEAN DEFAULT TRUE,
  installed_at    DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_device_type CHECK (device_type IN ('ph_sensor', 'do_sensor', 'temperature_sensor', 'salinity_sensor', 'ammonia_sensor', 'multi_parameter', 'aerator_controller', 'feeder', 'camera', 'level_sensor'))
);
CREATE INDEX IF NOT EXISTS idx_iot_devices_farmer ON aqua_iot_devices(farmer_id);

CREATE TABLE IF NOT EXISTS aqua_iot_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES aqua_iot_devices(id) ON DELETE CASCADE,
  farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pond_id         UUID REFERENCES ponds(id) ON DELETE SET NULL,
  alert_type      VARCHAR(50) NOT NULL,
  parameter       VARCHAR(50),
  value           DECIMAL(10,3),
  threshold       DECIMAL(10,3),
  severity        VARCHAR(20) DEFAULT 'warning',
  message         TEXT,
  acknowledged    BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iot_alerts_farmer ON aqua_iot_alerts(farmer_id);

-- ─── TRUST & VERIFICATION LAYER ─────────────────────────────
CREATE TABLE IF NOT EXISTS aqua_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) NOT NULL,
  doc_number      VARCHAR(100),
  doc_name        VARCHAR(200),
  doc_url         TEXT,
  status          VARCHAR(20) DEFAULT 'pending',
  verified_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at      DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_doc_type CHECK (doc_type IN ('gst', 'fssai', 'mpeda', 'pan', 'aadhaar', 'bank_account', 'caa_license', 'iec', 'apeda'))
);
CREATE INDEX IF NOT EXISTS idx_verifications_user ON aqua_verifications(user_id);

-- ─── PRODUCTION CYCLES (per culture unit, tracks full cycle data) ─
CREATE TABLE IF NOT EXISTS aqua_production_cycles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  culture_unit_id   UUID NOT NULL REFERENCES aqua_culture_units(id) ON DELETE CASCADE,
  farmer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species           VARCHAR(100) NOT NULL,
  stocking_date     DATE NOT NULL,
  seed_count        INTEGER NOT NULL,
  seed_supplier     VARCHAR(200),
  seed_cost         DECIMAL(12,2),
  avg_seed_weight_g DECIMAL(8,2),
  status            VARCHAR(20) DEFAULT 'active',
  current_count     INTEGER,
  current_avg_weight_g DECIMAL(8,2),
  total_feed_kg     DECIMAL(10,2) DEFAULT 0,
  total_feed_cost   DECIMAL(12,2) DEFAULT 0,
  total_mortality   INTEGER DEFAULT 0,
  fcr               DECIMAL(5,2),
  sgr               DECIMAL(5,3),
  survival_rate_pct DECIMAL(5,1),
  harvest_date      DATE,
  harvest_qty_kg    DECIMAL(10,2),
  harvest_avg_weight_g DECIMAL(8,2),
  harvest_price_per_kg DECIMAL(10,2),
  total_revenue     DECIMAL(14,2) DEFAULT 0,
  total_expenses    DECIMAL(14,2) DEFAULT 0,
  profit            DECIMAL(14,2) DEFAULT 0,
  profit_per_acre   DECIMAL(12,2) DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_cycle_status CHECK (status IN ('active', 'sampling', 'pre_harvest', 'harvested', 'failed', 'cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_production_cycles_unit ON aqua_production_cycles(culture_unit_id);
CREATE INDEX IF NOT EXISTS idx_production_cycles_farmer ON aqua_production_cycles(farmer_id);

-- Add culture_unit_id to existing tables for backwards compatibility
ALTER TABLE feed_logs ADD COLUMN IF NOT EXISTS culture_unit_id UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL;
ALTER TABLE water_quality_logs ADD COLUMN IF NOT EXISTS culture_unit_id UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL;
ALTER TABLE growth_samples ADD COLUMN IF NOT EXISTS culture_unit_id UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL;
ALTER TABLE mortality_logs ADD COLUMN IF NOT EXISTS culture_unit_id UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL;
ALTER TABLE harvest_listings ADD COLUMN IF NOT EXISTS culture_unit_id UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL;

-- Add unit_type metadata to ponds for legacy data
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS unit_type VARCHAR(30) DEFAULT 'pond';
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS salinity_ppt DECIMAL(5,1);
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS ammonia_ppm DECIMAL(6,3);
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS alkalinity_ppm DECIMAL(6,1);
ALTER TABLE ponds ADD COLUMN IF NOT EXISTS stocking_density_per_m3 DECIMAL(8,2);
`;

async function migrateV13() {
  const client = await pool.connect();
  try {
    console.log('[migrate-v13] Running AquaOS V4 migration...');
    await client.query(MIGRATION_V13_AQUAOS_V4);
    console.log('[migrate-v13] ✅ AquaOS V4 tables created (culture units, species config, harvest optimizer, IoT, verification, production cycles)');
  } catch (err) {
    // Handle duplicate constraint errors gracefully
    if (err.code === '42710' || err.message.includes('already exists')) {
      console.log('[migrate-v13] ⚠️ Some objects already exist, continuing...');
    } else {
      console.error('[migrate-v13] ❌ Migration failed:', err.message);
    }
  } finally {
    client.release();
  }
}

module.exports = { migrateV13 };

if (require.main === module) {
  migrateV13().then(() => process.exit(0));
}
