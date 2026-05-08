/**
 * Migration V25 — Next-Level Platform
 * Tables: FPO Storefront, Farm Digital Twin, Export Intelligence,
 *         WhatsApp, Rural CRM, Credit Graph, Dynamic Pricing, Voice AI
 */
'use strict';

const { pool } = require('./pool');

async function migrateV25NextLevel() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ═══════════════════════════════════════════════════════════
    //  FPO Storefront
    // ═══════════════════════════════════════════════════════════

    // ─── Storefronts ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS fpo_storefronts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        fpo_id UUID,
        slug VARCHAR(100) UNIQUE,
        store_name VARCHAR(200),
        description TEXT,
        seo_title VARCHAR(200),
        seo_description TEXT,
        seo_keywords TEXT,
        og_image TEXT,
        banner_url TEXT,
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#2e7d32',
        layout_style VARCHAR(20) DEFAULT 'modern',
        is_published BOOLEAN DEFAULT false,
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Storefront Products ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS fpo_storefront_products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        storefront_id UUID REFERENCES fpo_storefronts(id),
        name VARCHAR(200),
        category VARCHAR(50),
        description TEXT,
        price DECIMAL(12,2),
        unit VARCHAR(20),
        min_order_qty INTEGER DEFAULT 1,
        images TEXT[],
        availability VARCHAR(20) DEFAULT 'in_stock',
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Storefront Inquiries ────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS fpo_storefront_inquiries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        storefront_id UUID REFERENCES fpo_storefronts(id),
        product_id UUID,
        buyer_name VARCHAR(100),
        buyer_email VARCHAR(100),
        buyer_phone VARCHAR(15),
        message TEXT,
        status VARCHAR(20) DEFAULT 'new',
        response_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        responded_at TIMESTAMPTZ
      )
    `);

    // ─── FPO Certifications ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS fpo_certifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        fpo_id UUID,
        cert_type VARCHAR(50),
        cert_number VARCHAR(100),
        valid_from DATE,
        valid_until DATE,
        document_url TEXT,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Farm Digital Twin
    // ═══════════════════════════════════════════════════════════

    // ─── Digital Twin Farms ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twin_farms (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        farm_name VARCHAR(200),
        location_district VARCHAR(100),
        location_state VARCHAR(50),
        total_area_acres DECIMAL(10,2),
        soil_type VARCHAR(50),
        irrigation_type VARCHAR(50),
        geo_lat DECIMAL(10,6),
        geo_lng DECIMAL(10,6),
        health_score INTEGER DEFAULT 50,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Digital Twin Plots ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twin_plots (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farm_id UUID REFERENCES digital_twin_farms(id),
        plot_name VARCHAR(100),
        area_acres DECIMAL(10,2),
        soil_type VARCHAR(50),
        current_crop VARCHAR(50),
        planting_date DATE,
        expected_harvest DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Digital Twin Sensors ────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twin_sensors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farm_id UUID REFERENCES digital_twin_farms(id),
        plot_id UUID,
        sensor_type VARCHAR(30),
        sensor_name VARCHAR(100),
        location_description TEXT,
        last_value DECIMAL(10,2),
        last_reading_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Digital Twin Sensor Data ────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twin_sensor_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sensor_id UUID REFERENCES digital_twin_sensors(id),
        value DECIMAL(10,2),
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Digital Twin Alerts ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twin_alerts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farm_id UUID REFERENCES digital_twin_farms(id),
        alert_type VARCHAR(30),
        severity VARCHAR(10),
        title VARCHAR(200),
        message TEXT,
        is_dismissed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Digital Twin Simulations ────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS digital_twin_simulations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        farm_id UUID REFERENCES digital_twin_farms(id),
        simulation_type VARCHAR(30),
        input_params JSONB,
        results JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Export Intelligence
    // ═══════════════════════════════════════════════════════════

    // ─── Export Shipments ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS export_shipments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        product_name VARCHAR(200),
        hs_code VARCHAR(10),
        quantity DECIMAL(12,2),
        unit VARCHAR(20),
        destination_country VARCHAR(3),
        buyer_name VARCHAR(200),
        incoterm VARCHAR(3),
        container_type VARCHAR(20),
        status VARCHAR(30) DEFAULT 'draft',
        total_value_usd DECIMAL(12,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Export Buyer Connections ─────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS export_buyer_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        buyer_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  WhatsApp
    // ═══════════════════════════════════════════════════════════

    // ─── WhatsApp Conversations ──────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        phone VARCHAR(15),
        direction VARCHAR(10),
        last_message TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── WhatsApp Messages ───────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID REFERENCES whatsapp_conversations(id),
        direction VARCHAR(10),
        message_type VARCHAR(20),
        content TEXT,
        template_name VARCHAR(50),
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── WhatsApp Templates ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(50) UNIQUE,
        category VARCHAR(30),
        language VARCHAR(5) DEFAULT 'en',
        body_text TEXT,
        variables TEXT[],
        status VARCHAR(20) DEFAULT 'approved',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Rural CRM
    // ═══════════════════════════════════════════════════════════

    // ─── CRM Contacts ────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_id UUID,
        name VARCHAR(100),
        phone VARCHAR(15),
        email VARCHAR(100),
        role VARCHAR(20),
        location_district VARCHAR(100),
        location_state VARCHAR(50),
        crops TEXT[],
        tags TEXT[],
        notes TEXT,
        total_interactions INTEGER DEFAULT 0,
        last_interaction_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── CRM Interactions ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_interactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        contact_id UUID REFERENCES crm_contacts(id),
        owner_id UUID,
        interaction_type VARCHAR(20),
        notes TEXT,
        outcome VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── CRM Pipeline Deals ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_pipeline_deals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_id UUID,
        contact_id UUID REFERENCES crm_contacts(id),
        product VARCHAR(100),
        quantity DECIMAL(12,2),
        unit VARCHAR(20),
        value DECIMAL(12,2),
        stage VARCHAR(20) DEFAULT 'lead',
        expected_close_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── CRM Tasks ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_id UUID,
        contact_id UUID,
        task_type VARCHAR(20),
        title VARCHAR(200),
        notes TEXT,
        due_date DATE,
        priority VARCHAR(10) DEFAULT 'medium',
        is_completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── CRM Campaigns ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_campaigns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_id UUID,
        name VARCHAR(200),
        segment VARCHAR(50),
        channel VARCHAR(20),
        template TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        sent_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        response_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Credit Graph
    // ═══════════════════════════════════════════════════════════

    // ─── Credit Scores ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_scores (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID UNIQUE,
        score INTEGER DEFAULT 300,
        trade_history_score INTEGER DEFAULT 0,
        repayment_score INTEGER DEFAULT 0,
        asset_score INTEGER DEFAULT 0,
        social_score INTEGER DEFAULT 0,
        digital_activity_score INTEGER DEFAULT 0,
        calculated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Credit Applications ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        product_type VARCHAR(30),
        amount DECIMAL(12,2),
        tenure_months INTEGER,
        purpose TEXT,
        collateral_type VARCHAR(30),
        status VARCHAR(20) DEFAULT 'submitted',
        lender_id VARCHAR(50),
        interest_rate DECIMAL(5,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Credit Repayments ───────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_repayments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        application_id UUID REFERENCES credit_applications(id),
        amount DECIMAL(12,2),
        due_date DATE,
        paid_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── User Assets ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_assets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        asset_type VARCHAR(30),
        name VARCHAR(200),
        value DECIMAL(12,2),
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Insurance Policies ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_policies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        product_type VARCHAR(30),
        provider VARCHAR(50),
        policy_number VARCHAR(30),
        premium DECIMAL(10,2),
        sum_insured DECIMAL(12,2),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Insurance Claims ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        policy_id UUID REFERENCES insurance_policies(id),
        user_id UUID,
        claim_type VARCHAR(30),
        description TEXT,
        amount DECIMAL(12,2),
        status VARCHAR(20) DEFAULT 'filed',
        filed_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Dynamic Pricing
    // ═══════════════════════════════════════════════════════════

    // ─── Commodity Prices ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS commodity_prices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        commodity VARCHAR(50),
        mandi VARCHAR(50),
        state VARCHAR(30),
        price_per_quintal DECIMAL(10,2),
        min_price DECIMAL(10,2),
        max_price DECIMAL(10,2),
        arrival_qty_tonnes DECIMAL(10,2),
        recorded_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Price Alerts ────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        commodity VARCHAR(50),
        mandi VARCHAR(50),
        threshold_price DECIMAL(10,2),
        direction VARCHAR(10),
        is_triggered BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Voice AI
    // ═══════════════════════════════════════════════════════════

    // ─── Voice Commands ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS voice_commands (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        command_text TEXT,
        language VARCHAR(5),
        action_type VARCHAR(30),
        response TEXT,
        audio_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ═══════════════════════════════════════════════════════════
    //  Indexes
    // ═══════════════════════════════════════════════════════════

    // FPO Storefront
    await client.query('CREATE INDEX IF NOT EXISTS idx_fpo_storefronts_fpo_id ON fpo_storefronts(fpo_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fpo_storefronts_slug ON fpo_storefronts(slug)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fpo_storefront_products_storefront ON fpo_storefront_products(storefront_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fpo_storefront_inquiries_storefront ON fpo_storefront_inquiries(storefront_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fpo_certifications_fpo_id ON fpo_certifications(fpo_id)');

    // Farm Digital Twin
    await client.query('CREATE INDEX IF NOT EXISTS idx_digital_twin_farms_user ON digital_twin_farms(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_digital_twin_plots_farm ON digital_twin_plots(farm_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_digital_twin_sensors_farm ON digital_twin_sensors(farm_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_digital_twin_sensor_data_sensor ON digital_twin_sensor_data(sensor_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_digital_twin_alerts_farm ON digital_twin_alerts(farm_id)');

    // Export Intelligence
    await client.query('CREATE INDEX IF NOT EXISTS idx_export_shipments_user ON export_shipments(user_id)');

    // WhatsApp
    await client.query('CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user ON whatsapp_conversations(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id)');

    // Rural CRM
    await client.query('CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner ON crm_contacts(owner_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_crm_interactions_contact ON crm_interactions(contact_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_crm_pipeline_deals_owner ON crm_pipeline_deals(owner_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_crm_tasks_owner ON crm_tasks(owner_id)');

    // Credit Graph
    await client.query('CREATE INDEX IF NOT EXISTS idx_credit_scores_user ON credit_scores(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_credit_applications_user ON credit_applications(user_id)');

    // Dynamic Pricing
    await client.query('CREATE INDEX IF NOT EXISTS idx_commodity_prices_commodity_mandi ON commodity_prices(commodity, mandi)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id)');

    // Voice AI
    await client.query('CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id)');

    // ═══════════════════════════════════════════════════════════
    //  Seed Data
    // ═══════════════════════════════════════════════════════════

    // ─── WhatsApp Templates ──────────────────────────────────
    await client.query(`
      INSERT INTO whatsapp_templates (name, category, language, body_text, variables)
      VALUES
        ('order_update', 'utility', 'en',
         'Hi {{1}}, your order #{{2}} status has been updated to {{3}}. Track at {{4}}.',
         ARRAY['buyer_name', 'order_id', 'status', 'tracking_url']),
        ('price_alert', 'utility', 'en',
         'Price Alert: {{1}} at {{2}} is now ₹{{3}}/quintal ({{4}} from yesterday). Check latest prices on AgroTrade.',
         ARRAY['commodity', 'mandi', 'price', 'change_direction']),
        ('weather_alert', 'utility', 'en',
         '⚠️ Weather Alert for {{1}}: {{2}} expected in next {{3}} hours. Advisory: {{4}}.',
         ARRAY['district', 'weather_event', 'hours', 'advisory']),
        ('scheme_notification', 'marketing', 'en',
         'Good news {{1}}! You may be eligible for {{2}}. Benefits: {{3}}. Apply before {{4}}. Details: {{5}}.',
         ARRAY['farmer_name', 'scheme_name', 'benefits', 'deadline', 'link']),
        ('harvest_reminder', 'utility', 'en',
         'Hi {{1}}, your {{2}} crop in {{3}} is estimated to be ready for harvest around {{4}}. Plan your logistics now!',
         ARRAY['farmer_name', 'crop', 'plot_name', 'harvest_date'])
      ON CONFLICT DO NOTHING
    `);

    // ─── Commodity Prices ────────────────────────────────────
    await client.query(`
      INSERT INTO commodity_prices (commodity, mandi, state, price_per_quintal, min_price, max_price, arrival_qty_tonnes)
      VALUES
        ('Tomato',    'Azadpur',     'Delhi',          2500, 2000, 3000, 450),
        ('Onion',     'Vashi',       'Maharashtra',    1800, 1500, 2200, 820),
        ('Potato',    'Agra',        'Uttar Pradesh',  1200, 1000, 1500, 600),
        ('Rice',      'Kakinada',    'Andhra Pradesh', 3200, 3000, 3500, 350),
        ('Wheat',     'Indore',      'Madhya Pradesh', 2400, 2200, 2600, 700),
        ('Chilli',    'Guntur',      'Andhra Pradesh', 12000, 10000, 14000, 200),
        ('Turmeric',  'Erode',       'Tamil Nadu',     8500, 7500, 9500, 150),
        ('Cotton',    'Rajkot',      'Gujarat',        6200, 5800, 6500, 320),
        ('Soybean',   'Latur',       'Maharashtra',    4500, 4200, 4800, 280),
        ('Groundnut', 'Anantapur',   'Andhra Pradesh', 5800, 5500, 6200, 180)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ V25 Next-Level Platform migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ V25 migration error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV25NextLevel };
