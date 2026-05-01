-- ============================================================
-- AgriHub Complete Platform Migration — 002
-- All missing tables for full PRD coverage
-- ============================================================

-- ============================================================
-- ADDITIONAL ENUM TYPES
-- ============================================================

CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'paid', 'failed', 'refunded');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE agreement_status AS ENUM ('draft', 'sent', 'signed', 'active', 'expired', 'terminated');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
CREATE TYPE service_category AS ENUM ('plumber', 'electrician', 'veterinary', 'soil_testing', 'drone_spray', 'transport', 'cold_storage', 'other');
CREATE TYPE pond_cycle_status AS ENUM ('active', 'harvested', 'fallow', 'preparing');
CREATE TYPE kyc_level AS ENUM ('level_0', 'level_1', 'level_2', 'level_3', 'level_4');

-- ============================================================
-- PAYMENT ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    order_number    VARCHAR(50) UNIQUE NOT NULL,
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'INR',
    commission      DECIMAL(12,2) DEFAULT 0,
    order_type      VARCHAR(30),           -- 'equipment_booking', 'crop_order', 'subscription', 'rent'
    reference_id    UUID,                  -- FK to relevant entity
    description     TEXT,
    status          payment_status DEFAULT 'created',
    gateway_response JSONB,
    paid_at         TIMESTAMPTZ,
    refunded_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_ref ON payment_orders(reference_id);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id        UUID NOT NULL REFERENCES users(id),
    user2_id        UUID NOT NULL REFERENCES users(id),
    context_type    VARCHAR(30),           -- 'listing', 'property', 'equipment', 'order'
    context_id      UUID,
    last_message    TEXT,
    last_at         TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE UNIQUE INDEX idx_conversations_pair ON conversations(LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) DEFAULT 'text',  -- 'text', 'image', 'file', 'location', 'offer'
    metadata        JSONB,
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, sender_id) WHERE is_read = FALSE;

-- ============================================================
-- SUBSCRIPTIONS & PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    tier            subscription_tier NOT NULL,
    target_role     VARCHAR(30),           -- NULL = all roles
    price_monthly   DECIMAL(10,2) NOT NULL,
    price_yearly    DECIMAL(10,2),
    features        JSONB NOT NULL DEFAULT '[]',
    limits          JSONB,                 -- {"listings_per_month": 50, "contacts_per_day": 10}
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    plan_id         INTEGER NOT NULL REFERENCES subscription_plans(id),
    status          VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, paused
    payment_order_id UUID REFERENCES payment_orders(id),
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    auto_renew      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subs_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subs_active ON user_subscriptions(user_id, status) WHERE status = 'active';

-- ============================================================
-- AGREEMENTS (Rental/Lease)
-- ============================================================

CREATE TABLE IF NOT EXISTS agreements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by      UUID NOT NULL REFERENCES users(id),
    counterparty_id UUID NOT NULL REFERENCES users(id),
    agreement_type  VARCHAR(30) NOT NULL,  -- 'rental', 'lease', 'sale', 'service'
    reference_type  VARCHAR(30),           -- 'property', 'equipment', 'land'
    reference_id    UUID,
    title           TEXT NOT NULL,
    terms           JSONB NOT NULL,        -- {duration_months, rent, deposit, clauses:[]}
    document_url    TEXT,
    status          agreement_status DEFAULT 'draft',
    signed_by_creator BOOLEAN DEFAULT FALSE,
    signed_by_counter BOOLEAN DEFAULT FALSE,
    signed_at       TIMESTAMPTZ,
    valid_from      DATE,
    valid_until     DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agreements_creator ON agreements(created_by);
CREATE INDEX idx_agreements_counter ON agreements(counterparty_id);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    assigned_to     UUID REFERENCES users(id),
    category        VARCHAR(30) NOT NULL,  -- 'payment', 'listing', 'account', 'technical', 'other'
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    priority        VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent
    status          ticket_status DEFAULT 'open',
    attachments     JSONB DEFAULT '[]',
    resolution      TEXT,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    is_internal     BOOLEAN DEFAULT FALSE, -- internal notes
    attachments     JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

-- ============================================================
-- SERVICE LISTINGS (Rural Services Marketplace)
-- ============================================================

CREATE TABLE IF NOT EXISTS service_listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id     UUID NOT NULL REFERENCES users(id),
    category        service_category NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    price_type      VARCHAR(20) DEFAULT 'fixed',  -- 'fixed', 'hourly', 'per_acre', 'negotiable'
    price           DECIMAL(10,2),
    currency        VARCHAR(3) DEFAULT 'INR',
    district_id     INTEGER,
    location        GEOGRAPHY(POINT, 4326),
    service_radius_km INTEGER DEFAULT 25,
    availability    JSONB,                -- {days: ['mon','tue'...], hours: {from, to}}
    photos          TEXT[],
    rating_avg      DECIMAL(3,2) DEFAULT 0,
    rating_count    INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES service_listings(id),
    customer_id     UUID NOT NULL REFERENCES users(id),
    provider_id     UUID NOT NULL REFERENCES users(id),
    scheduled_date  DATE NOT NULL,
    scheduled_time  TIME,
    duration_hours  DECIMAL(4,1),
    location_text   TEXT,
    location_point  GEOGRAPHY(POINT, 4326),
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'requested', -- requested, confirmed, in_progress, completed, cancelled
    price_agreed    DECIMAL(10,2),
    payment_order_id UUID REFERENCES payment_orders(id),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_provider ON service_listings(provider_id);
CREATE INDEX idx_services_category ON service_listings(category);
CREATE INDEX idx_services_location ON service_listings USING GIST(location);
CREATE INDEX idx_service_bookings_customer ON service_bookings(customer_id);

-- ============================================================
-- EQUIPMENT AVAILABILITY & PROVIDER ENHANCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS equipment_availability (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id    UUID NOT NULL,
    blocked_date    DATE NOT NULL,
    reason          VARCHAR(30) DEFAULT 'booked', -- 'booked', 'maintenance', 'unavailable'
    booking_id      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_equip_avail_date ON equipment_availability(equipment_id, blocked_date);

-- ============================================================
-- JOB APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS job_applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL,
    applicant_id    UUID NOT NULL REFERENCES users(id),
    cover_note      TEXT,
    experience_years INTEGER,
    skills          TEXT[],
    resume_url      TEXT,
    status          VARCHAR(20) DEFAULT 'applied', -- applied, shortlisted, interviewed, hired, rejected
    employer_notes  TEXT,
    applied_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_apps_job ON job_applications(job_id);
CREATE INDEX idx_job_apps_applicant ON job_applications(applicant_id);
CREATE UNIQUE INDEX idx_job_apps_unique ON job_applications(job_id, applicant_id);

-- ============================================================
-- FPO PROFILES & MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS fpo_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
    fpo_name        VARCHAR(200) NOT NULL,
    fpo_type        VARCHAR(50),           -- 'producer_company', 'cooperative', 'self_help_group'
    registration_number VARCHAR(50),
    state           VARCHAR(50),
    district_id     INTEGER,
    block           VARCHAR(100),
    office_address  TEXT,
    ceo_name        VARCHAR(100),
    whatsapp_number VARCHAR(15),
    primary_crops   TEXT[],
    year_established INTEGER,
    member_count    INTEGER DEFAULT 0,
    total_area_acres DECIMAL(10,2),
    bank_account_enc TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fpo_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fpo_id          UUID NOT NULL REFERENCES fpo_profiles(id) ON DELETE CASCADE,
    farmer_id       UUID NOT NULL REFERENCES users(id),
    role_in_fpo     VARCHAR(30) DEFAULT 'member', -- 'member', 'director', 'ceo', 'secretary'
    joined_at       DATE DEFAULT CURRENT_DATE,
    land_area_acres DECIMAL(10,2),
    crops           TEXT[],
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fpo_members_fpo ON fpo_members(fpo_id);
CREATE INDEX idx_fpo_members_farmer ON fpo_members(farmer_id);
CREATE UNIQUE INDEX idx_fpo_members_unique ON fpo_members(fpo_id, farmer_id);

-- ============================================================
-- BANK ACCOUNTS
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    account_holder  VARCHAR(100) NOT NULL,
    bank_name       VARCHAR(100) NOT NULL,
    account_number_enc TEXT NOT NULL,       -- AES-256 encrypted
    ifsc_code       VARCHAR(11) NOT NULL,
    account_type    VARCHAR(20) DEFAULT 'savings', -- savings, current
    is_primary      BOOLEAN DEFAULT FALSE,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id);

-- ============================================================
-- AQUAOS: FEED LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS feed_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id         UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    feed_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    feed_type       VARCHAR(50) NOT NULL,   -- 'pellet', 'natural', 'supplementary', 'medicated'
    brand           VARCHAR(100),
    quantity_kg     DECIMAL(8,2) NOT NULL,
    cost_per_kg     DECIMAL(8,2),
    total_cost      DECIMAL(10,2),
    feeding_time    VARCHAR(20),            -- 'morning', 'evening', 'both'
    water_temp_at_feed DECIMAL(4,1),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feed_logs_pond ON feed_logs(pond_id, feed_date DESC);

-- ============================================================
-- AQUAOS: MORTALITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS mortality_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id         UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    mortality_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    count           INTEGER NOT NULL,
    estimated_weight_g DECIMAL(8,2),
    cause           VARCHAR(50),           -- 'disease', 'water_quality', 'predator', 'stress', 'unknown'
    symptoms        TEXT[],
    photo_urls      TEXT[],
    treatment_given TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mortality_logs_pond ON mortality_logs(pond_id, mortality_date DESC);

-- ============================================================
-- AQUAOS: GROWTH SAMPLES
-- ============================================================

CREATE TABLE IF NOT EXISTS growth_samples (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id         UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    sample_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    sample_count    INTEGER NOT NULL,      -- number of specimens sampled
    avg_weight_g    DECIMAL(8,2) NOT NULL,
    min_weight_g    DECIMAL(8,2),
    max_weight_g    DECIMAL(8,2),
    avg_length_cm   DECIMAL(6,2),
    target_weight_g DECIMAL(8,2),          -- expected weight for age
    survival_pct    DECIMAL(5,2),
    days_of_culture INTEGER,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_growth_samples_pond ON growth_samples(pond_id, sample_date DESC);

-- ============================================================
-- AQUAOS: CROP CYCLES
-- ============================================================

CREATE TABLE IF NOT EXISTS pond_cycles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id         UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    species         VARCHAR(100) NOT NULL,
    variety         VARCHAR(100),
    stocking_date   DATE NOT NULL,
    stocking_count  INTEGER NOT NULL,
    stocking_size_g DECIMAL(6,2),
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    harvest_count   INTEGER,
    harvest_weight_kg DECIMAL(10,2),
    survival_pct    DECIMAL(5,2),
    fcr             DECIMAL(5,2),          -- Feed Conversion Ratio
    status          pond_cycle_status DEFAULT 'active',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pond_cycles_pond ON pond_cycles(pond_id);
CREATE INDEX idx_pond_cycles_active ON pond_cycles(pond_id, status) WHERE status = 'active';

-- ============================================================
-- WALLET & CREDITS
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_credits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    credits         INTEGER NOT NULL,
    type            VARCHAR(10) NOT NULL,  -- 'earn' or 'spend'
    action          VARCHAR(50) NOT NULL,  -- 'referral', 'listing', 'purchase', etc.
    description     TEXT,
    reference_id    UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_credits_user ON wallet_credits(user_id, type);
CREATE INDEX idx_wallet_credits_time ON wallet_credits(created_at DESC);

-- ============================================================
-- SCHEME DISCOVERY
-- ============================================================

CREATE TABLE IF NOT EXISTS scheme_applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    scheme_id       VARCHAR(50) NOT NULL,
    status          VARCHAR(30) DEFAULT 'draft', -- draft, documents_pending, submitted, under_review, approved, rejected
    documents_pending JSONB DEFAULT '[]',
    documents_uploaded JSONB DEFAULT '[]',
    eligibility_score INTEGER,
    applied_at      TIMESTAMPTZ,
    last_update     TIMESTAMPTZ DEFAULT NOW(),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheme_apps_user ON scheme_applications(user_id);
CREATE INDEX idx_scheme_apps_scheme ON scheme_applications(scheme_id);

-- ============================================================
-- DISEASE DETECTIONS (Crop Doctor)
-- ============================================================

CREATE TABLE IF NOT EXISTS disease_detections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    crop            VARCHAR(50) NOT NULL,
    disease_id      VARCHAR(100) NOT NULL,
    disease_name    VARCHAR(200),
    confidence      INTEGER,               -- 0-100
    severity        VARCHAR(20),           -- 'low', 'medium', 'high', 'critical'
    symptoms_reported TEXT[],
    treatment_given TEXT,
    photo_url       TEXT,
    location        GEOGRAPHY(POINT, 4326),
    district_id     INTEGER,
    is_outbreak     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disease_detect_user ON disease_detections(user_id);
CREATE INDEX idx_disease_detect_disease ON disease_detections(disease_id, created_at DESC);
CREATE INDEX idx_disease_detect_district ON disease_detections(district_id, created_at DESC);

-- ============================================================
-- USER WATCHLISTS (Price & Supply Alerts)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_watchlists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    watch_type      VARCHAR(20) NOT NULL,  -- 'crop_price', 'supply', 'listing', 'equipment'
    crop_id         INTEGER,
    district_id     INTEGER,
    conditions      JSONB,                 -- {price_below: 2000, price_above: 5000}
    is_active       BOOLEAN DEFAULT TRUE,
    last_triggered  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON user_watchlists(user_id);
CREATE INDEX idx_watchlists_crop ON user_watchlists(crop_id) WHERE is_active = TRUE;

-- ============================================================
-- LISTING SHORTLISTS / FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS listing_shortlists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    listing_type    VARCHAR(30) NOT NULL,  -- 'property', 'supply_listing', 'equipment', 'service', 'harvest_listing'
    listing_id      UUID NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_shortlists_unique ON listing_shortlists(user_id, listing_type, listing_id);
CREATE INDEX idx_shortlists_user ON listing_shortlists(user_id);

-- ============================================================
-- OTP RATE LIMITING & REFRESH TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS otps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(15) NOT NULL,
    otp_hash        VARCHAR(128) NOT NULL,
    attempts        INTEGER DEFAULT 0,
    max_attempts    INTEGER DEFAULT 5,
    expires_at      TIMESTAMPTZ NOT NULL,
    verified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otps_phone ON otps(phone, created_at DESC);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    device_info     JSONB,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================================
-- COMMUNITY POSTS (enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS community_posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    category        VARCHAR(30) DEFAULT 'general', -- general, question, tip, success_story, market_info
    title           VARCHAR(200),
    content         TEXT NOT NULL,
    images          TEXT[],
    tags            TEXT[],
    likes_count     INTEGER DEFAULT 0,
    comments_count  INTEGER DEFAULT 0,
    is_pinned       BOOLEAN DEFAULT FALSE,
    is_expert       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id         UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    parent_id       UUID REFERENCES post_comments(id),
    likes_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id         UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_post_likes_unique ON post_likes(post_id, user_id);
CREATE INDEX idx_posts_category ON community_posts(category, created_at DESC);
CREATE INDEX idx_comments_post ON post_comments(post_id, created_at);

-- ============================================================
-- PROPERTIES (enhanced for FarmerConnect)
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(200) NOT NULL,
    property_type   VARCHAR(30) NOT NULL,  -- 'apartment', 'house', 'villa', 'pg', 'commercial', 'agri_land', 'plot'
    listing_type    VARCHAR(10) DEFAULT 'rent', -- 'rent', 'sale', 'lease'
    bhk             INTEGER,
    floor_number    INTEGER,
    total_floors    INTEGER,
    furnishing      VARCHAR(20),           -- 'furnished', 'semi', 'unfurnished'
    facing          VARCHAR(10),           -- 'north', 'south', 'east', 'west'
    area_sqft       DECIMAL(10,2),
    area_acres      DECIMAL(10,2),         -- for agri_land
    rent            DECIMAL(12,2),
    deposit_amount  DECIMAL(12,2),
    sale_price      DECIMAL(14,2),
    address         TEXT,
    locality        VARCHAR(100),
    city            VARCHAR(100),
    district_id     INTEGER,
    state           VARCHAR(50),
    pincode         VARCHAR(10),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    location        GEOGRAPHY(POINT, 4326),
    photos          TEXT[] DEFAULT '{}',
    amenities       TEXT[] DEFAULT '{}',
    description     TEXT,
    -- Agri land specific
    soil_type       VARCHAR(30),
    irrigation_type VARCHAR(30),
    water_source    VARCHAR(30),
    survey_number   VARCHAR(50),
    -- Status
    is_verified     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    views_count     INTEGER DEFAULT 0,
    contacts_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(property_type, listing_type);
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_rent ON properties(rent) WHERE is_active = TRUE;
CREATE INDEX idx_properties_city ON properties(city, locality);

-- ============================================================
-- EQUIPMENT (enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS equipment (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50) NOT NULL,  -- 'tractor', 'harvester', 'sprayer', 'rotavator', 'drone', 'other'
    brand           VARCHAR(100),
    model           VARCHAR(100),
    year            INTEGER,
    description     TEXT,
    hourly_rate     DECIMAL(10,2),
    daily_rate      DECIMAL(10,2),
    per_acre_rate   DECIMAL(10,2),
    security_deposit DECIMAL(10,2),
    includes_operator BOOLEAN DEFAULT FALSE,
    operator_rate   DECIMAL(10,2),
    photos          TEXT[] DEFAULT '{}',
    district_id     INTEGER,
    location        GEOGRAPHY(POINT, 4326),
    service_radius_km INTEGER DEFAULT 30,
    status          VARCHAR(20) DEFAULT 'available', -- available, booked, maintenance, inactive
    rating_avg      DECIMAL(3,2) DEFAULT 0,
    rating_count    INTEGER DEFAULT 0,
    total_bookings  INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_owner ON equipment(owner_id);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_location ON equipment USING GIST(location);
CREATE INDEX idx_equipment_status ON equipment(status) WHERE is_active = TRUE;

-- ============================================================
-- EQUIPMENT BOOKINGS (enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS equipment_bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id    UUID NOT NULL REFERENCES equipment(id),
    renter_id       UUID NOT NULL REFERENCES users(id),
    owner_id        UUID NOT NULL REFERENCES users(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      INTEGER,
    rate_type       VARCHAR(20),           -- 'hourly', 'daily', 'per_acre'
    rate_amount     DECIMAL(10,2),
    total_amount    DECIMAL(12,2),
    security_deposit DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
    payment_order_id UUID REFERENCES payment_orders(id),
    notes           TEXT,
    rating          INTEGER,
    review_text     TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equip_bookings_equipment ON equipment_bookings(equipment_id);
CREATE INDEX idx_equip_bookings_renter ON equipment_bookings(renter_id);

-- ============================================================
-- JOBS (enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posted_by       UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(50),           -- 'farm_labor', 'driver', 'warehouse', 'sales', 'tech', 'other'
    job_type        VARCHAR(20) DEFAULT 'full_time', -- full_time, part_time, contract, daily_wage
    location_text   VARCHAR(200),
    district_id     INTEGER,
    salary_min      DECIMAL(10,2),
    salary_max      DECIMAL(10,2),
    salary_period   VARCHAR(20) DEFAULT 'monthly', -- daily, weekly, monthly, yearly
    vacancies       INTEGER DEFAULT 1,
    skills_required TEXT[],
    experience_min  INTEGER DEFAULT 0,     -- years
    education_min   VARCHAR(30),
    accommodation   BOOLEAN DEFAULT FALSE,
    food_provided   BOOLEAN DEFAULT FALSE,
    transport       BOOLEAN DEFAULT FALSE,
    applications_count INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active', -- active, filled, expired, closed
    expires_at      DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_category ON jobs(category, status);
CREATE INDEX idx_jobs_district ON jobs(district_id);

-- ============================================================
-- PONDS (reference for AquaOS, if not already existing)
-- ============================================================

CREATE TABLE IF NOT EXISTS ponds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20),
    species         VARCHAR(100),
    area_acres      DECIMAL(8,2),
    depth_m         DECIMAL(4,2),
    stocked_count   INTEGER,
    stocking_date   DATE,
    current_ph      DECIMAL(4,2),
    current_temp    DECIMAL(4,1),
    current_do      DECIMAL(4,2),
    current_ammonia DECIMAL(6,3),
    avg_weight_g    DECIMAL(8,2),
    survival_pct    DECIMAL(5,2) DEFAULT 100,
    feed_type       VARCHAR(50),
    total_feed_kg   DECIMAL(10,2) DEFAULT 0,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    location        GEOGRAPHY(POINT, 4326),
    status          VARCHAR(20) DEFAULT 'active', -- active, harvested, fallow
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ponds_user ON ponds(user_id);

-- ============================================================
-- WATER QUALITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS water_quality_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id         UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    ph              DECIMAL(4,2),
    temperature     DECIMAL(4,1),
    dissolved_oxygen DECIMAL(4,2),
    ammonia         DECIMAL(6,3),
    nitrite         DECIMAL(6,3),
    alkalinity      DECIMAL(6,1),
    hardness        DECIMAL(6,1),
    transparency_cm INTEGER,
    color           VARCHAR(20),
    notes           TEXT,
    logged_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_water_logs_pond ON water_quality_logs(pond_id, logged_at DESC);

-- ============================================================
-- HARVEST LISTINGS (AquaOS marketplace)
-- ============================================================

CREATE TABLE IF NOT EXISTS harvest_listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    pond_id         UUID REFERENCES ponds(id),
    species         VARCHAR(100) NOT NULL,
    variety         VARCHAR(100),
    quantity_kg     DECIMAL(10,2) NOT NULL,
    avg_size_g      DECIMAL(8,2),
    price_per_kg    DECIMAL(10,2) NOT NULL,
    min_order_kg    DECIMAL(8,2),
    harvest_date    DATE,
    location_text   VARCHAR(200),
    district_id     INTEGER,
    photos          TEXT[],
    description     TEXT,
    is_organic      BOOLEAN DEFAULT FALSE,
    certification   VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'active', -- active, sold, expired
    views_count     INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_harvest_listings_user ON harvest_listings(user_id);
CREATE INDEX idx_harvest_listings_species ON harvest_listings(species, status);

-- ============================================================
-- ADVISORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS advisories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    category        VARCHAR(30),           -- 'water_quality', 'disease', 'feed', 'weather', 'market'
    severity        VARCHAR(10) DEFAULT 'info', -- info, warning, critical
    target_species  VARCHAR(100),
    target_district INTEGER,
    conditions      JSONB,                 -- trigger conditions
    is_active       BOOLEAN DEFAULT TRUE,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY FEED
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_feed (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action_type     VARCHAR(30) NOT NULL,  -- 'listing_created', 'order_placed', 'payment_received', etc.
    entity_type     VARCHAR(30),           -- 'listing', 'order', 'payment', 'user'
    entity_id       UUID,
    description     TEXT,
    metadata        JSONB,
    is_public       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_activity_feed_public ON activity_feed(created_at DESC) WHERE is_public = TRUE;

-- ============================================================
-- FARM DIARY ENTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS farm_diary_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    category        VARCHAR(30) NOT NULL,  -- 'sowing', 'irrigation', 'fertilizer', 'pesticide', 'harvest', 'observation', 'expense'
    crop_id         INTEGER,
    title           VARCHAR(200),
    description     TEXT,
    quantity        DECIMAL(10,2),
    unit            VARCHAR(20),
    cost            DECIMAL(10,2),
    photos          TEXT[],
    weather         JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farm_diary_user ON farm_diary_entries(user_id, entry_date DESC);

-- ============================================================
-- TRAINING MODULES
-- ============================================================

CREATE TABLE IF NOT EXISTS training_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(30),           -- 'crop_management', 'aquaculture', 'marketing', 'technology', 'finance'
    difficulty      VARCHAR(20) DEFAULT 'beginner',
    duration_minutes INTEGER,
    video_url       TEXT,
    content         TEXT,
    quiz            JSONB,
    language        VARCHAR(5) DEFAULT 'en',
    is_published    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    module_id       UUID NOT NULL REFERENCES training_modules(id),
    progress_pct    INTEGER DEFAULT 0,
    quiz_score      INTEGER,
    completed_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_training_progress_unique ON training_progress(user_id, module_id);

-- ============================================================
-- RLS POLICIES (all new tables)
-- ============================================================

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE pond_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY payment_orders_user ON payment_orders FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY conversations_user ON conversations FOR ALL USING (user1_id = current_setting('app.current_user_id')::UUID OR user2_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY messages_user ON messages FOR ALL USING (sender_id = current_setting('app.current_user_id')::UUID OR conversation_id IN (SELECT id FROM conversations WHERE user1_id = current_setting('app.current_user_id')::UUID OR user2_id = current_setting('app.current_user_id')::UUID));
CREATE POLICY subscriptions_user ON user_subscriptions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY agreements_user ON agreements FOR ALL USING (created_by = current_setting('app.current_user_id')::UUID OR counterparty_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY tickets_user ON support_tickets FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY wallet_user ON wallet_credits FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY watchlists_user ON user_watchlists FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY shortlists_user ON listing_shortlists FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY farm_diary_user ON farm_diary_entries FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY training_progress_user ON training_progress FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY bank_accounts_user ON bank_accounts FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_level kyc_level DEFAULT 'level_0';
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- Add missing columns to escrow_transactions
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id);
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id);
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS release_conditions JSONB;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS dispute_evidence JSONB;
ALTER TABLE escrow_transactions ADD COLUMN IF NOT EXISTS dispute_description TEXT;
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_transactions(seller_id);

-- Seed subscription plans
INSERT INTO subscription_plans (name, tier, target_role, price_monthly, price_yearly, features, limits) VALUES
  ('Free', 'free', NULL, 0, 0, '["basic_listings", "community_access", "weather"]', '{"listings_per_month": 5, "contacts_per_day": 3}'),
  ('Farmer Pro', 'basic', 'farmer', 199, 1999, '["basic_listings", "community_access", "weather", "crop_doctor", "scheme_discovery", "farm_diary", "priority_support"]', '{"listings_per_month": 20, "contacts_per_day": 10}'),
  ('Buyer Plus', 'basic', 'buyer', 499, 4999, '["supply_search", "watchlists", "price_alerts", "intelligence", "advanced_filters", "contact_unlock"]', '{"contacts_per_day": 50, "watchlists": 20}'),
  ('FPO Enterprise', 'premium', 'fpo', 999, 9999, '["*"]', '{"listings_per_month": 200, "members": 500, "contacts_per_day": 100}'),
  ('Seller Pro', 'basic', 'service_provider', 299, 2999, '["service_listings", "bookings", "reviews", "priority_placement", "analytics"]', '{"listings_per_month": 30, "bookings_per_day": 20}')
ON CONFLICT DO NOTHING;
