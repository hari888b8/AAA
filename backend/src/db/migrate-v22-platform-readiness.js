'use strict';

const { pool } = require('./pool');

/**
 * Migration V22 — Platform Readiness Layer
 * Tables for: DPDP compliance, KYC, AI predictions, eNAM, NABARD, SFAC, Event Bus
 */
async function migrateV22PlatformReadiness() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── DPDP Act Compliance Tables ──────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_consents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        purpose VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        data_categories JSONB DEFAULT '[]',
        processing_description TEXT,
        granted_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        withdrawn_at TIMESTAMP,
        UNIQUE(user_id, purpose)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS data_access_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        accessor_id INTEGER,
        data_category VARCHAR(50),
        access_type VARCHAR(10),
        ip_address VARCHAR(45),
        endpoint VARCHAR(255),
        accessed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS erasure_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        reason TEXT,
        data_categories JSONB DEFAULT '["all"]',
        status VARCHAR(20) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        processed_by INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS dpdp_grievances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT NOT NULL,
        related_purpose VARCHAR(100),
        status VARCHAR(20) DEFAULT 'open',
        resolution TEXT,
        filed_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS breach_notifications (
        id SERIAL PRIMARY KEY,
        affected_user_id INTEGER,
        breach_type VARCHAR(50),
        description TEXT,
        data_affected JSONB,
        severity VARCHAR(20),
        notified_at TIMESTAMP DEFAULT NOW(),
        remediation TEXT
      )
    `);

    // ─── KYC Verification Tables ─────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS kyc_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        level INTEGER DEFAULT 0,
        status VARCHAR(30) DEFAULT 'pending',
        aadhaar_verified BOOLEAN DEFAULT false,
        pan_verified BOOLEAN DEFAULT false,
        gstin_verified BOOLEAN DEFAULT false,
        bank_verified BOOLEAN DEFAULT false,
        fssai_verified BOOLEAN DEFAULT false,
        address_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS kyc_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        doc_type VARCHAR(30) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        reference_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        submitted_at TIMESTAMP DEFAULT NOW(),
        verified_at TIMESTAMP,
        UNIQUE(user_id, doc_type)
      )
    `);

    // ─── AI Prediction Tables ────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        model_type VARCHAR(50) NOT NULL,
        input_params JSONB,
        predictions JSONB,
        confidence NUMERIC(4,3),
        feedback VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS market_prices (
        id SERIAL PRIMARY KEY,
        crop_id VARCHAR(50),
        market_id VARCHAR(50),
        price_date DATE DEFAULT CURRENT_DATE,
        min_price NUMERIC(10,2),
        max_price NUMERIC(10,2),
        modal_price NUMERIC(10,2),
        volume_tonnes NUMERIC(10,2),
        source VARCHAR(30) DEFAULT 'enam',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── eNAM Integration Tables ─────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS enam_mandis (
        id SERIAL PRIMARY KEY,
        mandi_code VARCHAR(20) UNIQUE,
        mandi_name VARCHAR(100) NOT NULL,
        state VARCHAR(50),
        district VARCHAR(50),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        latitude NUMERIC(10,7),
        longitude NUMERIC(10,7),
        commodities_traded JSONB DEFAULT '[]'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enam_prices (
        id SERIAL PRIMARY KEY,
        crop_id VARCHAR(50),
        mandi_id INTEGER REFERENCES enam_mandis(id),
        price_date DATE DEFAULT CURRENT_DATE,
        min_price NUMERIC(10,2),
        max_price NUMERIC(10,2),
        modal_price NUMERIC(10,2),
        arrivals_tonnes NUMERIC(10,2)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enam_trade_lots (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER NOT NULL,
        mandi_id INTEGER,
        crop_id VARCHAR(50),
        quantity_quintals NUMERIC(10,2),
        expected_price NUMERIC(10,2),
        lot_quality_grade VARCHAR(10) DEFAULT 'FAQ',
        status VARCHAR(30) DEFAULT 'pending_approval',
        enam_lot_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── NABARD Tables ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS nabard_schemes (
        id SERIAL PRIMARY KEY,
        scheme_name VARCHAR(200) NOT NULL,
        scheme_code VARCHAR(50),
        description TEXT,
        target_user_type VARCHAR(30),
        max_amount NUMERIC(12,2),
        interest_rate NUMERIC(5,2),
        eligibility_criteria JSONB DEFAULT '{}',
        documents_required JSONB DEFAULT '[]',
        priority_score INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS nabard_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        scheme_id INTEGER REFERENCES nabard_schemes(id),
        application_data JSONB DEFAULT '{}',
        status VARCHAR(30) DEFAULT 'submitted',
        applied_at TIMESTAMP DEFAULT NOW(),
        approved_at TIMESTAMP,
        disbursed_amount NUMERIC(12,2)
      )
    `);

    // ─── SFAC Tables ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS sfac_schemes (
        id SERIAL PRIMARY KEY,
        scheme_name VARCHAR(200) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        max_grant NUMERIC(12,2),
        eligibility TEXT,
        is_active BOOLEAN DEFAULT true
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sfac_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        fpo_id INTEGER,
        scheme_id INTEGER REFERENCES sfac_schemes(id),
        project_details JSONB DEFAULT '{}',
        requested_amount NUMERIC(12,2),
        status VARCHAR(30) DEFAULT 'submitted',
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── PM-KISAN Table ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS pm_kisan_beneficiaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        aadhaar_linked BOOLEAN DEFAULT false,
        bank_account_linked BOOLEAN DEFAULT false,
        land_record_id VARCHAR(100),
        status VARCHAR(30) DEFAULT 'verification_pending',
        last_installment_date DATE,
        total_received NUMERIC(10,2) DEFAULT 0,
        registered_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Event Store Table ───────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_store (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB,
        metadata JSONB,
        published_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ─── Indexes ─────────────────────────────────────────────
    await client.query('CREATE INDEX IF NOT EXISTS idx_consents_user ON user_consents(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_access_log_user ON data_access_log(user_id, accessed_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_verifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_predictions_user ON ai_predictions(user_id, created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_enam_prices_crop ON enam_prices(crop_id, price_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_event_store_type ON event_store(event_type, published_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_market_prices_crop ON market_prices(crop_id, price_date)');

    // ─── Seed Data ───────────────────────────────────────────

    // Seed eNAM mandis (Andhra Pradesh focus)
    await client.query(`
      INSERT INTO enam_mandis (mandi_code, mandi_name, state, district, is_active, commodities_traded)
      VALUES
        ('AP001', 'Guntur Mandi', 'Andhra Pradesh', 'Guntur', true, '["chilli","cotton","tobacco","turmeric"]'),
        ('AP002', 'Kurnool Mandi', 'Andhra Pradesh', 'Kurnool', true, '["groundnut","sunflower","jowar","cotton"]'),
        ('AP003', 'Ongole Mandi', 'Andhra Pradesh', 'Prakasam', true, '["chilli","cotton","pulses"]'),
        ('AP004', 'Vijayawada Mandi', 'Andhra Pradesh', 'Krishna', true, '["rice","vegetables","fruits"]'),
        ('AP005', 'Anantapur Mandi', 'Andhra Pradesh', 'Anantapur', true, '["groundnut","sunflower","cotton"]'),
        ('TS001', 'Warangal Mandi', 'Telangana', 'Warangal', true, '["rice","turmeric","cotton"]'),
        ('TS002', 'Nizamabad Mandi', 'Telangana', 'Nizamabad', true, '["turmeric","rice","soybean"]'),
        ('TS003', 'Khammam Mandi', 'Telangana', 'Khammam', true, '["chilli","cotton","rice"]'),
        ('KA001', 'Hubli-Dharwad Mandi', 'Karnataka', 'Dharwad', true, '["cotton","groundnut","jowar"]'),
        ('KA002', 'Raichur Mandi', 'Karnataka', 'Raichur', true, '["rice","cotton","pulses"]')
      ON CONFLICT (mandi_code) DO NOTHING
    `);

    // Seed NABARD schemes
    await client.query(`
      INSERT INTO nabard_schemes (scheme_name, scheme_code, description, target_user_type, max_amount, interest_rate, priority_score, is_active)
      VALUES
        ('Kisan Credit Card', 'KCC', 'Short-term credit for crop production, post-harvest, and consumption needs', 'farmer', 300000, 4.0, 95, true),
        ('Rural Infrastructure Development Fund', 'RIDF', 'Infrastructure projects in rural areas including irrigation and roads', 'fpo', 5000000, 6.5, 80, true),
        ('Farm Mechanization Fund', 'FMF', 'Loans for purchasing farm equipment and machinery', 'farmer', 1000000, 7.0, 85, true),
        ('Watershed Development Fund', 'WDF', 'Soil and water conservation projects', 'fpo', 2000000, 5.0, 70, true),
        ('Dairy Entrepreneurship Scheme', 'DES', 'Setting up dairy farms and milk processing units', 'farmer', 700000, 6.0, 75, true),
        ('Agricultural Marketing Infrastructure', 'AMI', 'Storage, grading, sorting, and packing facilities', 'fpo', 10000000, 5.5, 90, true)
      ON CONFLICT DO NOTHING
    `);

    // Seed SFAC schemes
    await client.query(`
      INSERT INTO sfac_schemes (scheme_name, category, description, max_grant, is_active)
      VALUES
        ('FPO Formation & Incubation', 'fpo_support', 'Support for formation and initial operations of new FPOs', 1800000, true),
        ('Equity Grant Scheme', 'financial', 'Matching equity grant to FPOs for working capital', 1500000, true),
        ('Credit Guarantee Scheme', 'financial', 'Credit guarantee coverage for FPO loans from banks', 10000000, true),
        ('Venture Capital Assistance', 'startup', 'Venture capital for agri-business startups and FPOs', 5000000, true),
        ('National Agriculture Market (eNAM) Subsidy', 'digital', 'Subsidy for mandis to integrate with eNAM platform', 7500000, true)
      ON CONFLICT DO NOTHING
    `);

    // Seed sample market prices
    await client.query(`
      INSERT INTO market_prices (crop_id, market_id, price_date, min_price, max_price, modal_price, volume_tonnes)
      VALUES
        ('rice', 'AP004', CURRENT_DATE, 2100, 2400, 2250, 450),
        ('rice', 'AP004', CURRENT_DATE - 1, 2080, 2380, 2230, 480),
        ('rice', 'AP004', CURRENT_DATE - 2, 2050, 2350, 2200, 520),
        ('cotton', 'AP001', CURRENT_DATE, 6500, 7200, 6850, 200),
        ('cotton', 'AP001', CURRENT_DATE - 1, 6400, 7100, 6750, 220),
        ('chilli', 'AP001', CURRENT_DATE, 14000, 18000, 16000, 150),
        ('chilli', 'AP001', CURRENT_DATE - 1, 13500, 17500, 15500, 165),
        ('groundnut', 'AP005', CURRENT_DATE, 5800, 6400, 6100, 180),
        ('turmeric', 'TS002', CURRENT_DATE, 12000, 15000, 13500, 100),
        ('tomato', 'AP004', CURRENT_DATE, 800, 1500, 1100, 300)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V22 (Platform Readiness) completed — DPDP + KYC + AI + eNAM + NABARD + SFAC + EventBus');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V22 failed:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV22PlatformReadiness };
