require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V2 = `
-- ============================================================
-- AgriHub V2 Migration — Advanced Features (Phase 1-4)
-- ============================================================

-- ═══ AGRIFLOW: Auctions ═══
CREATE TABLE IF NOT EXISTS auctions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL,
  seller_id       UUID NOT NULL REFERENCES users(id),
  base_price      DECIMAL(10,2) NOT NULL,
  min_increment   DECIMAL(10,2) DEFAULT 0.50,
  end_time        TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) DEFAULT 'active',
  winning_bid_id  UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_seller ON auctions(seller_id);

CREATE TABLE IF NOT EXISTS auction_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id      UUID NOT NULL REFERENCES auctions(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  price           DECIMAL(10,2) NOT NULL,
  quantity_kg     DECIMAL(10,2),
  notes           TEXT,
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON auction_bids(auction_id);

-- ═══ AGRIFLOW: Quality Grading ═══
CREATE TABLE IF NOT EXISTS quality_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID,
  user_id         UUID NOT NULL REFERENCES users(id),
  crop_id         INTEGER,
  photos          JSONB,
  grade           VARCHAR(5),
  score           INTEGER,
  notes           TEXT,
  assessed_by     VARCHAR(20) DEFAULT 'ai',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ AGRIFLOW: Contract Farming ═══
CREATE TABLE IF NOT EXISTS farming_contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id          UUID NOT NULL REFERENCES users(id),
  crop_id           INTEGER,
  district_id       INTEGER,
  quantity_kg       DECIMAL(12,2) NOT NULL,
  price_per_kg      DECIMAL(10,2) NOT NULL,
  quality_required  VARCHAR(5) DEFAULT 'B',
  delivery_start    DATE,
  delivery_end      DATE NOT NULL,
  advance_pct       DECIMAL(5,2) DEFAULT 0,
  terms             TEXT,
  status            VARCHAR(20) DEFAULT 'open',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON farming_contracts(status);

CREATE TABLE IF NOT EXISTS contract_acceptances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES farming_contracts(id),
  farmer_id       UUID NOT NULL REFERENCES users(id),
  quantity_kg     DECIMAL(12,2),
  notes           TEXT,
  status          VARCHAR(30) DEFAULT 'pending_approval',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ AGRIFLOW: Warehouse Receipts ═══
CREATE TABLE IF NOT EXISTS warehouse_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number  VARCHAR(50) NOT NULL UNIQUE,
  farmer_id       UUID NOT NULL REFERENCES users(id),
  warehouse_id    UUID,
  crop_id         INTEGER,
  quantity_kg     DECIMAL(12,2) NOT NULL,
  grade           VARCHAR(10) DEFAULT 'ungraded',
  moisture_pct    DECIMAL(5,2),
  expected_price  DECIMAL(10,2),
  traded_price    DECIMAL(10,2),
  status          VARCHAR(20) DEFAULT 'stored',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_warehouse_farmer ON warehouse_receipts(farmer_id);

-- ═══ AGRIFLOW: Aggregation Pools ═══
CREATE TABLE IF NOT EXISTS aggregation_pools (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id              UUID NOT NULL REFERENCES users(id),
  crop_id             INTEGER,
  target_quantity_kg  DECIMAL(12,2) NOT NULL,
  current_quantity_kg DECIMAL(12,2) DEFAULT 0,
  grade_required      VARCHAR(5) DEFAULT 'B',
  collection_center   TEXT,
  deadline            DATE,
  status              VARCHAR(20) DEFAULT 'active',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aggregation_contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id         UUID NOT NULL REFERENCES aggregation_pools(id),
  farmer_id       UUID NOT NULL REFERENCES users(id),
  quantity_kg     DECIMAL(12,2) NOT NULL,
  grade           VARCHAR(5) DEFAULT 'ungraded',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ CHAT: Groups ═══
CREATE TABLE IF NOT EXISTS chat_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  created_by      UUID NOT NULL REFERENCES users(id),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id        UUID NOT NULL REFERENCES chat_groups(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  role            VARCHAR(20) DEFAULT 'member',
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Add metadata and read_at to messages if not exists
DO $$ BEGIN
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ═══ TRAINING: Progress & Quizzes ═══
CREATE TABLE IF NOT EXISTS training_progress (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  course_id       VARCHAR(20) NOT NULL,
  module_index    INTEGER DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, module_index)
);
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);

CREATE TABLE IF NOT EXISTS quiz_results (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  course_id       VARCHAR(20) NOT NULL,
  score           INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  percentage      INTEGER NOT NULL,
  passed          BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_registrations (
  user_id         UUID NOT NULL REFERENCES users(id),
  session_id      VARCHAR(20) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

-- ═══ COMMUNITY: Enhanced ═══
DO $$ BEGIN
  ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'text';
  ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS metadata JSONB;
  ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_answered BOOLEAN DEFAULT FALSE;
  ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS is_best_answer BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ═══ FARM DIARY: Tasks, Photos, Chemical Usage ═══
CREATE TABLE IF NOT EXISTS farm_tasks (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  worker_name     VARCHAR(100) NOT NULL,
  worker_phone    VARCHAR(15),
  task_type       VARCHAR(50) NOT NULL,
  description     TEXT,
  field           VARCHAR(100),
  crop            VARCHAR(100),
  due_date        DATE,
  status          VARCHAR(20) DEFAULT 'assigned',
  completion_photo TEXT,
  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_user ON farm_tasks(user_id);

CREATE TABLE IF NOT EXISTS farm_photos (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  photo_url       TEXT NOT NULL,
  crop_id         INTEGER,
  field           VARCHAR(100),
  notes           TEXT,
  growth_stage    VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_farm_photos_user ON farm_photos(user_id);

CREATE TABLE IF NOT EXISTS chemical_usage (
  id                  SERIAL PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES users(id),
  product_name        VARCHAR(200) NOT NULL,
  active_ingredient   VARCHAR(200),
  dosage              VARCHAR(100) NOT NULL,
  area_acres          DECIMAL(6,2),
  crop                VARCHAR(100),
  field               VARCHAR(100),
  target_pest         VARCHAR(200),
  safety_period_days  INTEGER,
  applied_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chemical_usage_user ON chemical_usage(user_id);

-- ═══ WALLET: Credit Score, Trade Finance, Disputes ═══
CREATE TABLE IF NOT EXISTS trade_finance_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  order_id        UUID,
  amount_requested DECIMAL(12,2) NOT NULL,
  purpose         VARCHAR(50) DEFAULT 'working_capital',
  status          VARCHAR(20) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS split_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID,
  total_amount    DECIMAL(12,2) NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS split_payment_parts (
  id              SERIAL PRIMARY KEY,
  split_id        UUID NOT NULL REFERENCES split_payments(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  amount          DECIMAL(12,2) NOT NULL,
  quantity_kg     DECIMAL(12,2),
  status          VARCHAR(20) DEFAULT 'pending',
  paid_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payment_disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  transaction_id  UUID,
  reason          VARCHAR(200) NOT NULL,
  description     TEXT,
  evidence_urls   JSONB,
  status          VARCHAR(20) DEFAULT 'open',
  resolution      TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_savings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id          UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES users(id),
  amount          DECIMAL(12,2) NOT NULL,
  purpose         VARCHAR(100) DEFAULT 'bulk_purchase',
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INTELLIGENCE: Price Alerts ═══
CREATE TABLE IF NOT EXISTS price_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  crop_id         INTEGER NOT NULL,
  district_id     INTEGER,
  condition       VARCHAR(10) NOT NULL,
  threshold_price DECIMAL(10,2) NOT NULL,
  alert_type      VARCHAR(20) DEFAULT 'push',
  is_active       BOOLEAN DEFAULT TRUE,
  last_triggered  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);

-- ═══ CROPDOCTOR: Assessments & Consultations ═══
CREATE TABLE IF NOT EXISTS disease_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  disease_id      VARCHAR(50),
  severity_score  INTEGER,
  spread_risk     VARCHAR(20),
  affected_area_pct DECIMAL(5,2),
  plant_stage     VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expert_consultations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  crop            VARCHAR(100) NOT NULL,
  photos          JSONB,
  description     TEXT,
  urgency         VARCHAR(20) DEFAULT 'normal',
  fee             DECIMAL(10,2),
  status          VARCHAR(20) DEFAULT 'pending',
  expert_id       UUID,
  response        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ KISANCONNECT: Maintenance Logs ═══
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id      UUID NOT NULL,
  service_type      VARCHAR(100) NOT NULL,
  description       TEXT,
  cost              DECIMAL(10,2),
  next_service_date DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_equip ON maintenance_logs(equipment_id);

-- Add discount_pct to equipment_bookings if not exists
DO $$ BEGIN
  ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS discount_pct DECIMAL(5,2) DEFAULT 0;
  ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
  ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS hours DECIMAL(6,2);
  ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);
  ALTER TABLE equipment_bookings ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ═══ Add revenue column to farm_crops ═══
DO $$ BEGIN
  ALTER TABLE farm_crops ADD COLUMN IF NOT EXISTS revenue DECIMAL(12,2);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
`;

async function migrateV2() {
  console.log('🔧 Running AgriHub V2 migration (Advanced Features)...');
  try {
    await pool.query(MIGRATION_V2);
    console.log('✅ V2 schema created successfully');
  } catch (err) {
    console.error('❌ V2 Migration error:', err.message);
    throw err;
  }
}

module.exports = { migrateV2 };

if (require.main === module) {
  migrateV2()
    .then(() => { console.log('✅ V2 Migration complete'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
