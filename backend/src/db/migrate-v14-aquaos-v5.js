require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V14_AQUAOS_V5 = `
-- ============================================================
-- AquaOS V5 — Advanced KPI Engine, Predictive Growth Models,
-- Rule-Based Alert Engine, B2B Supply Marketplace
-- ============================================================

-- ─── GROWTH SAMPLES WITH INTERVAL TRACKING ───────────────────
-- Enables SGR calculation at regular intervals (every 10-15 days)
CREATE TABLE IF NOT EXISTS aqua_growth_intervals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id          UUID NOT NULL REFERENCES aqua_production_cycles(id) ON DELETE CASCADE,
  farmer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  culture_unit_id   UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL,
  interval_number   INTEGER NOT NULL,
  sample_date       DATE NOT NULL,
  avg_weight_g      DECIMAL(10,3) NOT NULL,
  sample_count      INTEGER DEFAULT 30,
  min_weight_g      DECIMAL(10,3),
  max_weight_g      DECIMAL(10,3),
  std_deviation     DECIMAL(8,3),
  days_of_culture   INTEGER NOT NULL,
  biomass_kg        DECIMAL(12,2),
  current_count     INTEGER,
  sgr_interval      DECIMAL(6,4),
  adg_g_per_day     DECIMAL(8,4),
  fcr_interval      DECIMAL(5,3),
  feed_since_last_kg DECIMAL(10,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_intervals_cycle ON aqua_growth_intervals(cycle_id);
CREATE INDEX IF NOT EXISTS idx_growth_intervals_farmer ON aqua_growth_intervals(farmer_id);
CREATE INDEX IF NOT EXISTS idx_growth_intervals_date ON aqua_growth_intervals(sample_date);

-- ─── KPI SNAPSHOTS (daily/weekly snapshots for trending) ─────
CREATE TABLE IF NOT EXISTS aqua_kpi_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id          UUID NOT NULL REFERENCES aqua_production_cycles(id) ON DELETE CASCADE,
  farmer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date     DATE NOT NULL,
  days_of_culture   INTEGER NOT NULL,
  fcr               DECIMAL(5,3),
  sgr               DECIMAL(6,4),
  adg_g_per_day     DECIMAL(8,4),
  survival_rate_pct DECIMAL(5,2),
  current_biomass_kg DECIMAL(12,2),
  feed_total_kg     DECIMAL(10,2),
  feed_cost_total   DECIMAL(12,2),
  mortality_total   INTEGER DEFAULT 0,
  avg_weight_g      DECIMAL(10,3),
  estimated_harvest_kg DECIMAL(12,2),
  estimated_harvest_date DATE,
  estimated_revenue DECIMAL(14,2),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_cycle ON aqua_kpi_snapshots(cycle_id, snapshot_date);

-- ─── GROWTH PREDICTIONS (model outputs) ─────────────────────
CREATE TABLE IF NOT EXISTS aqua_growth_predictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id          UUID NOT NULL REFERENCES aqua_production_cycles(id) ON DELETE CASCADE,
  farmer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_type        VARCHAR(50) NOT NULL DEFAULT 'von_bertalanffy',
  predicted_at      TIMESTAMPTZ DEFAULT NOW(),
  prediction_date   DATE NOT NULL,
  predicted_weight_g DECIMAL(10,3),
  predicted_biomass_kg DECIMAL(12,2),
  confidence_low_kg DECIMAL(12,2),
  confidence_high_kg DECIMAL(12,2),
  optimal_harvest_date DATE,
  optimal_harvest_weight_g DECIMAL(10,3),
  max_profit_date   DATE,
  max_profit_amount DECIMAL(14,2),
  model_params      JSONB,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_predictions_cycle ON aqua_growth_predictions(cycle_id);

-- ─── ALERT RULES ENGINE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS aqua_alert_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  rule_name         VARCHAR(200) NOT NULL,
  rule_category     VARCHAR(50) NOT NULL,
  parameter         VARCHAR(50) NOT NULL,
  condition_op      VARCHAR(10) NOT NULL,
  threshold_value   DECIMAL(10,3) NOT NULL,
  severity          VARCHAR(20) DEFAULT 'warning',
  message_template  TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  is_system         BOOLEAN DEFAULT FALSE,
  species           VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_alert_category CHECK (rule_category IN ('water_quality', 'growth', 'mortality', 'feed', 'harvest', 'financial')),
  CONSTRAINT valid_condition_op CHECK (condition_op IN ('<', '>', '<=', '>=', '=', '!=', 'spike', 'drop'))
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_farmer ON aqua_alert_rules(farmer_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_category ON aqua_alert_rules(rule_category);

-- ─── TRIGGERED ALERTS (history of fired alerts) ──────────────
CREATE TABLE IF NOT EXISTS aqua_triggered_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id           UUID REFERENCES aqua_alert_rules(id) ON DELETE SET NULL,
  farmer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id          UUID REFERENCES aqua_production_cycles(id) ON DELETE SET NULL,
  culture_unit_id   UUID REFERENCES aqua_culture_units(id) ON DELETE SET NULL,
  alert_category    VARCHAR(50) NOT NULL,
  severity          VARCHAR(20) NOT NULL DEFAULT 'warning',
  title             TEXT NOT NULL,
  message           TEXT,
  parameter         VARCHAR(50),
  actual_value      DECIMAL(10,3),
  threshold_value   DECIMAL(10,3),
  acknowledged      BOOLEAN DEFAULT FALSE,
  acknowledged_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_triggered_alerts_farmer ON aqua_triggered_alerts(farmer_id, created_at DESC);

-- Seed default system alert rules
INSERT INTO aqua_alert_rules (rule_name, rule_category, parameter, condition_op, threshold_value, severity, message_template, is_system, species) VALUES
  ('Low pH Alert', 'water_quality', 'ph', '<', 6.5, 'critical', 'pH dropped below 6.5 ({value}). Immediate attention needed.', true, NULL),
  ('High pH Alert', 'water_quality', 'ph', '>', 9.0, 'warning', 'pH exceeds 9.0 ({value}). Monitor closely.', true, NULL),
  ('Low Dissolved Oxygen', 'water_quality', 'dissolved_oxygen', '<', 4.0, 'critical', 'DO below 4 mg/L ({value}). Risk of fish stress/mortality.', true, NULL),
  ('High Ammonia', 'water_quality', 'ammonia', '>', 0.5, 'warning', 'Ammonia above 0.5 ppm ({value}). Consider water exchange.', true, NULL),
  ('Critical Ammonia', 'water_quality', 'ammonia', '>', 1.5, 'critical', 'Ammonia at toxic level ({value}). Emergency water exchange required.', true, NULL),
  ('High Temperature', 'water_quality', 'temperature', '>', 33, 'warning', 'Water temperature too high ({value}°C). Consider aeration.', true, NULL),
  ('Low Temperature', 'water_quality', 'temperature', '<', 22, 'warning', 'Water temperature too low ({value}°C). Growth may slow.', true, NULL),
  ('Growth Slowdown', 'growth', 'sgr', '<', 1.0, 'warning', 'Growth rate slowing (SGR: {value}%/day). Check feed quality and water.', true, 'Vannamei Shrimp'),
  ('Mortality Spike', 'mortality', 'daily_mortality_pct', '>', 1.0, 'critical', 'Mortality spike detected ({value}%). Possible disease outbreak.', true, NULL),
  ('High FCR', 'feed', 'fcr', '>', 2.5, 'warning', 'Feed conversion ratio high ({value}). Feed may be wasted.', true, NULL),
  ('Feed Without Growth', 'feed', 'feed_efficiency_drop', '>', 20, 'warning', 'Feed usage increased but growth stalled. Check feed quality.', true, NULL),
  ('Harvest Ready', 'harvest', 'days_to_harvest', '<', 7, 'info', 'Estimated harvest in {value} days. Start planning logistics.', true, NULL)
ON CONFLICT DO NOTHING;

-- ─── B2B SUPPLY MARKETPLACE ──────────────────────────────────

-- Supplier profiles
CREATE TABLE IF NOT EXISTS aqua_suppliers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name      VARCHAR(300) NOT NULL,
  business_type     VARCHAR(50) NOT NULL,
  description       TEXT,
  gst_number        VARCHAR(50),
  contact_phone     VARCHAR(20),
  contact_email     VARCHAR(200),
  address           TEXT,
  district_id       INTEGER REFERENCES districts(id),
  state             VARCHAR(100),
  pin_code          VARCHAR(10),
  rating            DECIMAL(3,2) DEFAULT 0,
  total_orders      INTEGER DEFAULT 0,
  verified          BOOLEAN DEFAULT FALSE,
  logo_url          TEXT,
  established_year  INTEGER,
  delivery_radius_km INTEGER,
  min_order_amount  DECIMAL(12,2),
  status            VARCHAR(20) DEFAULT 'active',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_business_type CHECK (business_type IN ('seed_supplier', 'feed_manufacturer', 'feed_dealer', 'equipment_supplier', 'medicine_supplier', 'testing_lab', 'consultant', 'multi_category'))
);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON aqua_suppliers(business_type, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_district ON aqua_suppliers(district_id);

-- Supply products catalog
CREATE TABLE IF NOT EXISTS aqua_supply_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id       UUID NOT NULL REFERENCES aqua_suppliers(id) ON DELETE CASCADE,
  product_name      VARCHAR(300) NOT NULL,
  category          VARCHAR(50) NOT NULL,
  sub_category      VARCHAR(100),
  brand             VARCHAR(200),
  description       TEXT,
  specifications    JSONB,
  unit              VARCHAR(30) NOT NULL DEFAULT 'kg',
  price_per_unit    DECIMAL(12,2) NOT NULL,
  bulk_price        DECIMAL(12,2),
  bulk_min_qty      DECIMAL(10,2),
  stock_available   DECIMAL(12,2) DEFAULT 0,
  min_order_qty     DECIMAL(10,2) DEFAULT 1,
  images            TEXT[],
  species_suitable  TEXT[],
  certifications    TEXT[],
  delivery_days     INTEGER DEFAULT 3,
  status            VARCHAR(20) DEFAULT 'active',
  rating            DECIMAL(3,2) DEFAULT 0,
  total_sold        DECIMAL(12,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_product_category CHECK (category IN ('seed', 'feed', 'medicine', 'probiotic', 'equipment', 'aerator', 'net', 'pond_liner', 'testing_kit', 'water_treatment', 'packaging', 'other'))
);
CREATE INDEX IF NOT EXISTS idx_supply_products_supplier ON aqua_supply_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supply_products_category ON aqua_supply_products(category, status);
CREATE INDEX IF NOT EXISTS idx_supply_products_species ON aqua_supply_products USING GIN(species_suitable);

-- Supply orders (B2B transactions)
CREATE TABLE IF NOT EXISTS aqua_supply_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id       UUID NOT NULL REFERENCES aqua_suppliers(id) ON DELETE CASCADE,
  order_number      VARCHAR(50) UNIQUE,
  status            VARCHAR(30) DEFAULT 'pending',
  total_amount      DECIMAL(14,2) NOT NULL,
  delivery_address  TEXT,
  delivery_date     DATE,
  payment_status    VARCHAR(20) DEFAULT 'pending',
  payment_method    VARCHAR(30),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_order_status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed'))
);
CREATE INDEX IF NOT EXISTS idx_supply_orders_buyer ON aqua_supply_orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_supply_orders_supplier ON aqua_supply_orders(supplier_id, status);

-- Order line items
CREATE TABLE IF NOT EXISTS aqua_supply_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES aqua_supply_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES aqua_supply_products(id) ON DELETE CASCADE,
  quantity          DECIMAL(10,2) NOT NULL,
  unit_price        DECIMAL(12,2) NOT NULL,
  total_price       DECIMAL(14,2) NOT NULL,
  notes             TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON aqua_supply_order_items(order_id);

-- Supplier reviews
CREATE TABLE IF NOT EXISTS aqua_supply_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES aqua_supply_orders(id) ON DELETE CASCADE,
  reviewer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id       UUID NOT NULL REFERENCES aqua_suppliers(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES aqua_supply_products(id) ON DELETE SET NULL,
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title             VARCHAR(200),
  review_text       TEXT,
  quality_rating    INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  delivery_rating   INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  value_rating      INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  images            TEXT[],
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_supply_reviews_supplier ON aqua_supply_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supply_reviews_product ON aqua_supply_reviews(product_id);

-- ─── Seed sample supply data ─────────────────────────────────
INSERT INTO aqua_suppliers (id, user_id, company_name, business_type, description, state, verified, delivery_radius_km) VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000001', 'Avanti Feeds Ltd', 'feed_manufacturer', 'Leading aquaculture feed manufacturer in India. Premium shrimp and fish feeds.', 'Andhra Pradesh', true, 500),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000001', 'CP Aquaculture India', 'feed_manufacturer', 'World-class shrimp feed with integrated farm solutions.', 'Andhra Pradesh', true, 1000),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000001', 'BMR Aqua Seeds', 'seed_supplier', 'SPF Vannamei PL and Black Tiger seed supplier. MPEDA registered hatchery.', 'Andhra Pradesh', true, 300),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000001', 'AquaTech Equipment', 'equipment_supplier', 'Aerators, paddle wheels, auto-feeders, and pond lining solutions.', 'Tamil Nadu', true, 800)
ON CONFLICT DO NOTHING;

INSERT INTO aqua_supply_products (supplier_id, product_name, category, brand, description, unit, price_per_unit, bulk_price, bulk_min_qty, stock_available, species_suitable, delivery_days) VALUES
  ('00000000-0000-0000-0000-000000000501', 'Avanti Supreme Shrimp Feed 35P', 'feed', 'Avanti Feeds', '35% protein premium grower feed for Vannamei shrimp. 2mm pellet.', 'kg', 85, 78, 500, 50000, ARRAY['Vannamei Shrimp', 'Black Tiger Shrimp'], 2),
  ('00000000-0000-0000-0000-000000000501', 'Avanti Gold Fish Feed 28P', 'feed', 'Avanti Feeds', '28% protein floating feed for freshwater fish. 3mm pellet.', 'kg', 55, 48, 1000, 30000, ARRAY['Rohu', 'Catla', 'Tilapia', 'Pangasius'], 2),
  ('00000000-0000-0000-0000-000000000502', 'CP Supreme 9951 Shrimp Feed', 'feed', 'CP Aquaculture', 'Premium nursery to grower feed. High digestibility.', 'kg', 92, 85, 500, 25000, ARRAY['Vannamei Shrimp'], 3),
  ('00000000-0000-0000-0000-000000000503', 'SPF Vannamei PL-10 Seeds', 'seed', 'BMR Aqua', 'SPF certified Vannamei PL10. PCR tested negative for WSSV, EHP, EMS.', 'thousand', 350, 320, 100, 5000, ARRAY['Vannamei Shrimp'], 1),
  ('00000000-0000-0000-0000-000000000503', 'Black Tiger PL-15 Seeds', 'seed', 'BMR Aqua', 'Healthy Black Tiger prawn seeds, PL15 stage.', 'thousand', 500, 450, 50, 2000, ARRAY['Black Tiger Shrimp'], 1),
  ('00000000-0000-0000-0000-000000000504', '2HP Paddle Wheel Aerator', 'aerator', 'AquaTech', '2HP paddle wheel aerator. 6 paddles, FRP construction. Covers 1.5 acres.', 'piece', 28000, 25000, 5, 200, ARRAY['Vannamei Shrimp', 'Black Tiger Shrimp', 'Rohu'], 5),
  ('00000000-0000-0000-0000-000000000504', 'HDPE Pond Liner 500 micron', 'pond_liner', 'AquaTech', 'UV-stabilized HDPE pond liner. 500 micron thickness. 10-year warranty.', 'sqm', 65, 55, 5000, 100000, NULL, 7),
  ('00000000-0000-0000-0000-000000000504', 'Automatic Shrimp Feeder 50kg', 'equipment', 'AquaTech', 'Programmable automatic feeder with 50kg hopper. Solar + battery backup.', 'piece', 45000, 40000, 3, 50, ARRAY['Vannamei Shrimp', 'Black Tiger Shrimp'], 7),
  ('00000000-0000-0000-0000-000000000501', 'ProBio Aqua Probiotic', 'probiotic', 'Avanti Feeds', 'Multi-strain probiotic for pond water treatment. Reduces ammonia.', 'kg', 650, 580, 20, 5000, NULL, 2),
  ('00000000-0000-0000-0000-000000000502', 'OxyTab DO Booster', 'water_treatment', 'CP Aquaculture', 'Emergency dissolved oxygen booster tablets. Quick-release formula.', 'kg', 380, 340, 50, 10000, NULL, 2)
ON CONFLICT DO NOTHING;
`;

async function runMigration() {
  try {
    await pool.query(MIGRATION_V14_AQUAOS_V5);
    console.log('✅ Migration V14 AquaOS V5 completed successfully');
  } catch (err) {
    console.error('Migration V14 failed:', err.message);
  }
}

if (require.main === module) {
  runMigration().then(() => process.exit(0));
}

module.exports = { runMigration, MIGRATION_V14_AQUAOS_V5 };
