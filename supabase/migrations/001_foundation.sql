-- ============================================================
-- AgriHub Foundation Migration — 001
-- PostgreSQL 15 + PostGIS + pgvector
-- 15 core tables with Row-Level Security (RLS)
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Trigram for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('farmer', 'fpo', 'buyer', 'admin', 'service_provider');
CREATE TYPE user_language AS ENUM ('en', 'te', 'kn', 'hi', 'mr', 'ta', 'pa');
CREATE TYPE kyc_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
CREATE TYPE crop_season AS ENUM ('kharif', 'rabi', 'zaid', 'perennial');
CREATE TYPE quality_grade AS ENUM ('A+', 'A', 'B', 'C', 'ungraded');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'sold', 'expired', 'cancelled');
CREATE TYPE inquiry_status AS ENUM ('pending', 'responded', 'accepted', 'rejected', 'expired');
CREATE TYPE consent_level AS ENUM ('level_0', 'level_1', 'level_2', 'level_3');
CREATE TYPE order_status AS ENUM ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed');
CREATE TYPE escrow_state AS ENUM ('created', 'funded', 'delivery_confirmed', 'released', 'disputed', 'refunded');
CREATE TYPE price_source AS ENUM ('apmc', 'enam', 'agmarknet', 'platform', 'manual');
CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'email', 'whatsapp', 'in_app');

-- ============================================================
-- TABLE 1: USERS
-- Core user table — farmer, FPO, buyer, admin
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(15) NOT NULL UNIQUE,
    name            VARCHAR(100),
    role            user_role NOT NULL DEFAULT 'farmer',
    language        user_language NOT NULL DEFAULT 'en',
    district_id     INTEGER,
    state_code      VARCHAR(5),
    location        GEOGRAPHY(POINT, 4326),  -- PostGIS point
    avatar_url      TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_district ON users(district_id);
CREATE INDEX idx_users_location ON users USING GIST(location);

-- ============================================================
-- TABLE 2: USER PROFILES
-- Extended profile with sensitive data (app-layer encrypted)
-- ============================================================

CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    aadhaar_hash    VARCHAR(64),        -- SHA-256 hash of Aadhaar
    bank_account_enc TEXT,              -- AES-256 encrypted bank details
    pan_number_enc  TEXT,               -- AES-256 encrypted PAN
    gstin           VARCHAR(20),
    kyc_status      kyc_status DEFAULT 'pending',
    kyc_documents   JSONB DEFAULT '[]', -- [{type, url, uploaded_at, status}]
    address_line1   TEXT,
    address_line2   TEXT,
    pincode         VARCHAR(10),
    total_area_acres DECIMAL(10,2),
    farming_experience_years INTEGER,
    crops_grown     TEXT[],             -- Array of crop names
    trust_score     DECIMAL(5,2) DEFAULT 50.00,
    referral_code   VARCHAR(20) UNIQUE,
    referred_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: CROP CATALOG
-- Master reference data for all crops
-- ============================================================

CREATE TABLE crop_catalog (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_te         VARCHAR(100),        -- Telugu name
    name_hi         VARCHAR(100),        -- Hindi name
    variety         VARCHAR(100),
    category        VARCHAR(50) NOT NULL, -- Cereal, Pulse, Oilseed, Vegetable, Fruit, Spice, Fibre
    season          crop_season,
    avg_yield_per_acre DECIMAL(10,2),     -- in quintals
    min_price_reference DECIMAL(10,2),    -- MSP or market reference
    growing_days    INTEGER,
    is_organic_eligible BOOLEAN DEFAULT TRUE,
    icon_emoji      VARCHAR(10),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed essential crops
INSERT INTO crop_catalog (name, name_te, category, season, avg_yield_per_acre, icon_emoji) VALUES
    ('Rice (Paddy)', 'వరి', 'Cereal', 'kharif', 25.0, '🌾'),
    ('Wheat', 'గోధుమ', 'Cereal', 'rabi', 20.0, '🌾'),
    ('Tomato', 'టమాట', 'Vegetable', 'rabi', 100.0, '🍅'),
    ('Onion', 'ఉల్లి', 'Vegetable', 'rabi', 80.0, '🧅'),
    ('Cotton', 'పత్తి', 'Fibre', 'kharif', 8.0, '🏵️'),
    ('Groundnut', 'వేరుశెనగ', 'Oilseed', 'kharif', 10.0, '🥜'),
    ('Chilli (Red)', 'మిర్చి', 'Spice', 'kharif', 12.0, '🌶️'),
    ('Maize (Corn)', 'మొక్కజొన్న', 'Cereal', 'kharif', 30.0, '🌽'),
    ('Soybean', 'సోయాబీన్', 'Oilseed', 'kharif', 10.0, '🫘'),
    ('Sugarcane', 'చెరుకు', 'Cash Crop', 'perennial', 350.0, '🎋'),
    ('Turmeric', 'పసుపు', 'Spice', 'kharif', 25.0, '🟡'),
    ('Banana', 'అరటి', 'Fruit', 'perennial', 150.0, '🍌'),
    ('Mango', 'మామిడి', 'Fruit', 'perennial', 40.0, '🥭'),
    ('Potato', 'బంగాళదుంప', 'Vegetable', 'rabi', 100.0, '🥔'),
    ('Brinjal (Eggplant)', 'వంకాయ', 'Vegetable', 'kharif', 120.0, '🍆');

-- ============================================================
-- TABLE 4: DISTRICTS
-- Indian districts for aggregation and geo-filtering
-- ============================================================

CREATE TABLE districts (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_local      VARCHAR(100),
    state_code      VARCHAR(5) NOT NULL,
    state_name      VARCHAR(50) NOT NULL,
    boundary        GEOGRAPHY(MULTIPOLYGON, 4326), -- PostGIS boundary
    centroid        GEOGRAPHY(POINT, 4326),
    total_farmers   INTEGER DEFAULT 0,
    primary_crops   TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_districts_state ON districts(state_code);
CREATE INDEX idx_districts_boundary ON districts USING GIST(boundary);

-- Seed AP districts (primary market)
INSERT INTO districts (name, state_code, state_name, primary_crops) VALUES
    ('West Godavari', 'AP', 'Andhra Pradesh', ARRAY['Rice', 'Aquaculture', 'Coconut']),
    ('East Godavari', 'AP', 'Andhra Pradesh', ARRAY['Rice', 'Aquaculture', 'Sugarcane']),
    ('Krishna', 'AP', 'Andhra Pradesh', ARRAY['Rice', 'Chilli', 'Cotton']),
    ('Guntur', 'AP', 'Andhra Pradesh', ARRAY['Chilli', 'Cotton', 'Tobacco']),
    ('Kurnool', 'AP', 'Andhra Pradesh', ARRAY['Groundnut', 'Sunflower', 'Jowar']),
    ('Nellore', 'AP', 'Andhra Pradesh', ARRAY['Rice', 'Aquaculture', 'Groundnut']),
    ('Prakasam', 'AP', 'Andhra Pradesh', ARRAY['Tobacco', 'Cotton', 'Chilli']),
    ('Srikakulam', 'AP', 'Andhra Pradesh', ARRAY['Rice', 'Aquaculture', 'Jute']),
    ('Anantapur', 'AP', 'Andhra Pradesh', ARRAY['Groundnut', 'Sunflower', 'Rice']),
    ('Chittoor', 'AP', 'Andhra Pradesh', ARRAY['Mango', 'Groundnut', 'Sugarcane']),
    ('Visakhapatnam', 'AP', 'Andhra Pradesh', ARRAY['Rice', 'Cashew', 'Coffee']),
    ('Kadapa', 'AP', 'Andhra Pradesh', ARRAY['Groundnut', 'Sunflower', 'Pulses']);

-- ============================================================
-- TABLE 5: DECLARATIONS
-- Core intelligence input — what farmers plant
-- ============================================================

CREATE TABLE declarations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
    district_id     INTEGER REFERENCES districts(id),
    area_acres      DECIMAL(10,2) NOT NULL CHECK (area_acres > 0 AND area_acres <= 10000),
    expected_yield  DECIMAL(10,2),       -- in quintals
    sow_date        DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    actual_harvest_date DATE,
    quality_grade   quality_grade DEFAULT 'ungraded',
    is_organic      BOOLEAN DEFAULT FALSE,
    organic_cert_url TEXT,
    farm_location   GEOGRAPHY(POINT, 4326),
    quality_score   DECIMAL(5,2) DEFAULT 50.00, -- 0-100, computed by quality engine
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_harvest CHECK (expected_harvest_date > sow_date)
);

CREATE INDEX idx_declarations_farmer ON declarations(farmer_id);
CREATE INDEX idx_declarations_crop ON declarations(crop_id);
CREATE INDEX idx_declarations_district ON declarations(district_id);
CREATE INDEX idx_declarations_harvest ON declarations(expected_harvest_date);
CREATE INDEX idx_declarations_location ON declarations USING GIST(farm_location);

-- ============================================================
-- TABLE 6: HARVEST AVAILABILITY
-- Auto-triggered T-15 days before harvest
-- ============================================================

CREATE TABLE harvest_availability (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    declaration_id  UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
    farmer_id       UUID NOT NULL REFERENCES users(id),
    crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
    district_id     INTEGER REFERENCES districts(id),
    quantity_kg     DECIMAL(12,2) NOT NULL CHECK (quantity_kg > 0),
    grade           quality_grade DEFAULT 'ungraded',
    is_organic      BOOLEAN DEFAULT FALSE,
    expected_price_per_kg DECIMAL(10,2),
    packaging       VARCHAR(50),         -- 'gunny_bags', 'crates', 'loose'
    status          listing_status DEFAULT 'active',
    available_from  DATE,
    expires_at      DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_harvest_crop ON harvest_availability(crop_id);
CREATE INDEX idx_harvest_district ON harvest_availability(district_id);
CREATE INDEX idx_harvest_status ON harvest_availability(status);
CREATE INDEX idx_harvest_date ON harvest_availability(available_from, expires_at);

-- ============================================================
-- TABLE 7: SUPPLY LISTINGS (FPO Published)
-- ============================================================

CREATE TABLE supply_listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fpo_id          UUID NOT NULL REFERENCES users(id),
    crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
    district_id     INTEGER REFERENCES districts(id),
    quantity_kg     DECIMAL(12,2) NOT NULL CHECK (quantity_kg > 0),
    grade           quality_grade DEFAULT 'ungraded',
    is_organic      BOOLEAN DEFAULT FALSE,
    price_per_kg    DECIMAL(10,2),
    min_order_kg    DECIMAL(10,2),
    location        GEOGRAPHY(POINT, 4326),
    collection_center VARCHAR(200),
    logistic_support BOOLEAN DEFAULT FALSE,
    status          listing_status DEFAULT 'active',
    images          TEXT[],              -- Array of image URLs
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supply_crop ON supply_listings(crop_id);
CREATE INDEX idx_supply_fpo ON supply_listings(fpo_id);
CREATE INDEX idx_supply_status ON supply_listings(status);
CREATE INDEX idx_supply_location ON supply_listings USING GIST(location);

-- ============================================================
-- TABLE 8: INQUIRIES
-- Buyer requests to FPO/farmer with consent tiers
-- ============================================================

CREATE TABLE inquiries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    listing_id      UUID REFERENCES supply_listings(id),
    harvest_id      UUID REFERENCES harvest_availability(id),
    seller_id       UUID NOT NULL REFERENCES users(id),
    crop_id         INTEGER REFERENCES crop_catalog(id),
    quantity_needed DECIMAL(12,2),
    timeline        VARCHAR(100),        -- "Within 15 days", "This month"
    message         TEXT,
    consent_level   consent_level DEFAULT 'level_0',
    status          inquiry_status DEFAULT 'pending',
    response_message TEXT,
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_seller ON inquiries(seller_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);

-- ============================================================
-- TABLE 9: ORDERS
-- Commerce transactions with escrow protection
-- ============================================================

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number    VARCHAR(20) UNIQUE NOT NULL,
    buyer_id        UUID NOT NULL REFERENCES users(id),
    seller_id       UUID NOT NULL REFERENCES users(id),
    listing_id      UUID REFERENCES supply_listings(id),
    inquiry_id      UUID REFERENCES inquiries(id),
    crop_id         INTEGER REFERENCES crop_catalog(id),
    quantity_kg     DECIMAL(12,2) NOT NULL,
    price_per_kg    DECIMAL(10,2) NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    platform_commission DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,4) DEFAULT 0.05, -- 5% default
    escrow_id       UUID,
    status          order_status DEFAULT 'placed',
    delivery_address TEXT,
    delivery_date   DATE,
    notes           TEXT,
    confirmed_at    TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================================
-- TABLE 10: ESCROW TRANSACTIONS
-- State machine for payment safety
-- ============================================================

CREATE TABLE escrow_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    state           escrow_state DEFAULT 'created',
    gateway_ref     VARCHAR(100),       -- Razorpay payment ID
    gateway_order_id VARCHAR(100),      -- Razorpay order ID
    funded_at       TIMESTAMPTZ,
    delivery_confirmed_at TIMESTAMPTZ,
    released_at     TIMESTAMPTZ,
    disputed_at     TIMESTAMPTZ,
    dispute_reason  TEXT,
    dispute_resolved_at TIMESTAMPTZ,
    refunded_at     TIMESTAMPTZ,
    seller_payout_ref VARCHAR(100),
    commission_deducted DECIMAL(10,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escrow_order ON escrow_transactions(order_id);
CREATE INDEX idx_escrow_state ON escrow_transactions(state);

-- ============================================================
-- TABLE 11: REVIEWS
-- Trust-building review system
-- ============================================================

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    target_id       UUID NOT NULL REFERENCES users(id),
    order_id        UUID REFERENCES orders(id),
    rating          DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    images          TEXT[],
    helpful_count   INTEGER DEFAULT 0,
    is_flagged      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_review CHECK (reviewer_id != target_id)
);

CREATE INDEX idx_reviews_target ON reviews(target_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);

-- ============================================================
-- TABLE 12: PRICE FEEDS
-- Multi-source market price aggregation
-- ============================================================

CREATE TABLE price_feeds (
    id              SERIAL PRIMARY KEY,
    crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
    market_name     VARCHAR(100),
    district_id     INTEGER REFERENCES districts(id),
    price_per_quintal DECIMAL(10,2) NOT NULL,
    min_price       DECIMAL(10,2),
    max_price       DECIMAL(10,2),
    source          price_source NOT NULL,
    recorded_at     TIMESTAMPTZ DEFAULT NOW(),
    arrival_qty_tonnes DECIMAL(10,2)
);

CREATE INDEX idx_prices_crop ON price_feeds(crop_id);
CREATE INDEX idx_prices_date ON price_feeds(recorded_at);
CREATE INDEX idx_prices_district ON price_feeds(district_id);

-- ============================================================
-- TABLE 13: SUPPLY AGGREGATES (Materialized View)
-- Pre-computed aggregates for buyer intelligence
-- ============================================================

CREATE TABLE supply_aggregates (
    id              SERIAL PRIMARY KEY,
    crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
    district_id     INTEGER NOT NULL REFERENCES districts(id),
    harvest_window_start DATE NOT NULL,
    harvest_window_end DATE NOT NULL,
    total_supply_kg DECIMAL(14,2),
    farmer_count    INTEGER DEFAULT 0,
    avg_quality_score DECIMAL(5,2),
    avg_price_per_kg DECIMAL(10,2),
    computed_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT min_farmer_threshold CHECK (farmer_count >= 5) -- Privacy: min 5 farmers
);

CREATE INDEX idx_aggregates_crop ON supply_aggregates(crop_id);
CREATE INDEX idx_aggregates_district ON supply_aggregates(district_id);
CREATE INDEX idx_aggregates_window ON supply_aggregates(harvest_window_start, harvest_window_end);

-- ============================================================
-- TABLE 14: FORECASTS
-- Supply forecasting models output
-- ============================================================

CREATE TABLE forecasts (
    id              SERIAL PRIMARY KEY,
    crop_id         INTEGER NOT NULL REFERENCES crop_catalog(id),
    district_id     INTEGER NOT NULL REFERENCES districts(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    predicted_supply_kg DECIMAL(14,2),
    confidence_score DECIMAL(5,2),       -- 0-100
    model_version   VARCHAR(20),
    computed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forecasts_crop ON forecasts(crop_id);
CREATE INDEX idx_forecasts_period ON forecasts(period_start, period_end);

-- ============================================================
-- TABLE 15: NOTIFICATIONS
-- Multi-channel notification log
-- ============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel         notification_channel NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB DEFAULT '{}', -- Payload for deep linking
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Read own profile, admin reads all
CREATE POLICY users_self_read ON users FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY users_self_update ON users FOR UPDATE USING (auth.uid() = id);

-- User Profiles: Strictly self-only
CREATE POLICY profiles_self_only ON user_profiles FOR ALL USING (
    user_id = auth.uid()
);

-- Declarations: Farmer sees own, FPO sees members
CREATE POLICY declarations_farmer_read ON declarations FOR SELECT USING (
    farmer_id = auth.uid()
);
CREATE POLICY declarations_farmer_write ON declarations FOR INSERT WITH CHECK (
    farmer_id = auth.uid()
);
CREATE POLICY declarations_farmer_update ON declarations FOR UPDATE USING (
    farmer_id = auth.uid()
);

-- Supply Listings: Public read, FPO write
CREATE POLICY supply_public_read ON supply_listings FOR SELECT USING (
    status = 'active'
);
CREATE POLICY supply_fpo_write ON supply_listings FOR INSERT WITH CHECK (
    fpo_id = auth.uid()
);

-- Inquiries: Buyer and seller can see their own
CREATE POLICY inquiries_owner_read ON inquiries FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
);
CREATE POLICY inquiries_buyer_create ON inquiries FOR INSERT WITH CHECK (
    buyer_id = auth.uid()
);

-- Orders: Buyer and seller access
CREATE POLICY orders_parties_read ON orders FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
);

-- Notifications: Self only
CREATE POLICY notifications_self ON notifications FOR ALL USING (
    user_id = auth.uid()
);

-- Public tables (no RLS restrictions)
-- crop_catalog, districts, price_feeds — readable by all authenticated users

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_declarations_updated_at BEFORE UPDATE ON declarations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_harvest_updated_at BEFORE UPDATE ON harvest_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_supply_updated_at BEFORE UPDATE ON supply_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_escrow_updated_at BEFORE UPDATE ON escrow_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'AH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-trigger harvest availability T-15 days before harvest
CREATE OR REPLACE FUNCTION auto_create_harvest_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if harvest date is within 15 days
    IF NEW.expected_harvest_date <= CURRENT_DATE + INTERVAL '15 days' 
       AND NEW.expected_harvest_date > CURRENT_DATE THEN
        INSERT INTO harvest_availability (
            declaration_id, farmer_id, crop_id, district_id,
            quantity_kg, grade, is_organic, available_from, expires_at
        ) VALUES (
            NEW.id, NEW.farmer_id, NEW.crop_id, NEW.district_id,
            NEW.expected_yield * 100, -- quintals to kg
            NEW.quality_grade, NEW.is_organic,
            NEW.expected_harvest_date - INTERVAL '3 days',
            NEW.expected_harvest_date + INTERVAL '15 days'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_harvest AFTER INSERT OR UPDATE ON declarations
    FOR EACH ROW EXECUTE FUNCTION auto_create_harvest_availability();

-- ============================================================
-- COMPUTED VIEWS
-- ============================================================

-- Farmer dashboard summary
CREATE OR REPLACE VIEW farmer_dashboard AS
SELECT 
    u.id AS farmer_id,
    u.name,
    u.district_id,
    COUNT(DISTINCT d.id) AS total_declarations,
    SUM(d.area_acres) AS total_area_acres,
    COUNT(DISTINCT d.crop_id) AS crops_count,
    COUNT(DISTINCT h.id) AS active_harvests,
    AVG(d.quality_score) AS avg_quality_score
FROM users u
LEFT JOIN declarations d ON d.farmer_id = u.id
LEFT JOIN harvest_availability h ON h.farmer_id = u.id AND h.status = 'active'
WHERE u.role = 'farmer'
GROUP BY u.id, u.name, u.district_id;

-- Platform analytics view (admin only)
CREATE OR REPLACE VIEW platform_analytics AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'farmer') AS total_farmers,
    (SELECT COUNT(*) FROM users WHERE role = 'fpo') AS total_fpos,
    (SELECT COUNT(*) FROM users WHERE role = 'buyer') AS total_buyers,
    (SELECT COUNT(*) FROM declarations) AS total_declarations,
    (SELECT COUNT(*) FROM harvest_availability WHERE status = 'active') AS active_harvests,
    (SELECT COUNT(*) FROM supply_listings WHERE status = 'active') AS active_listings,
    (SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled')) AS total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') AS total_gmv,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_7d;
