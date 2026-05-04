// ═══════════════════════════════════════════════════════════════════
// Migration V19 — AquaOS V10: Analytics Layer + Search + Payments +
// Pricing Intelligence + Messaging + AI Advisory + Growth + Monetization
// Blueprint Sections 18-35 — Final Platform Completion
// ═══════════════════════════════════════════════════════════════════
const { query } = require('./pool');

async function migrateV19AquaOSV10() {
  await query(`
    -- ══════════════════════════════════════════════════════════════
    -- 1. ANALYTICS LAYER — System-wide insights (Section 18)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_analytics_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      snapshot_type VARCHAR(50) NOT NULL,
      metric_name VARCHAR(100) NOT NULL,
      metric_value DECIMAL(12,4),
      dimension VARCHAR(100),
      district VARCHAR(100),
      species VARCHAR(100),
      period_start DATE,
      period_end DATE,
      sample_size INTEGER DEFAULT 0,
      confidence_pct DECIMAL(5,2),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON aqua_analytics_snapshots(snapshot_type, metric_name);
    CREATE INDEX IF NOT EXISTS idx_analytics_district ON aqua_analytics_snapshots(district, species);

    -- ══════════════════════════════════════════════════════════════
    -- 2. SEARCH SYSTEM — ElasticSearch-backed full-text (Section 19)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_search_index (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      title VARCHAR(300),
      body TEXT,
      tags TEXT[] DEFAULT '{}',
      district VARCHAR(100),
      species VARCHAR(100),
      category VARCHAR(100),
      price_range NUMRANGE,
      geo_lat DECIMAL(9,6),
      geo_lng DECIMAL(9,6),
      relevance_score DECIMAL(5,2) DEFAULT 1.0,
      is_active BOOLEAN DEFAULT true,
      indexed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(entity_type, entity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_search_entity ON aqua_search_index(entity_type, is_active);
    CREATE INDEX IF NOT EXISTS idx_search_text ON aqua_search_index USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')));
    CREATE INDEX IF NOT EXISTS idx_search_tags ON aqua_search_index USING gin(tags);

    -- ══════════════════════════════════════════════════════════════
    -- 3. PAYMENT SYSTEM — Gateway integration (Section 20)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_payment_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payer_id UUID NOT NULL,
      payee_id UUID,
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'INR',
      payment_type VARCHAR(50) NOT NULL,
      payment_method VARCHAR(50),
      gateway VARCHAR(30) DEFAULT 'razorpay',
      gateway_order_id VARCHAR(200),
      gateway_payment_id VARCHAR(200),
      gateway_signature VARCHAR(500),
      status VARCHAR(30) DEFAULT 'initiated',
      description TEXT,
      metadata JSONB DEFAULT '{}',
      commission_pct DECIMAL(5,2) DEFAULT 0,
      commission_amount DECIMAL(12,2) DEFAULT 0,
      gst_amount DECIMAL(12,2) DEFAULT 0,
      net_amount DECIMAL(12,2),
      refund_id VARCHAR(200),
      refunded_at TIMESTAMPTZ,
      settled_at TIMESTAMPTZ,
      failed_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_payments_payer ON aqua_payment_transactions(payer_id, status);
    CREATE INDEX IF NOT EXISTS idx_payments_gateway ON aqua_payment_transactions(gateway_order_id);

    CREATE TABLE IF NOT EXISTS aqua_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      plan_type VARCHAR(50) NOT NULL,
      plan_name VARCHAR(100),
      amount_monthly DECIMAL(10,2),
      features JSONB DEFAULT '[]',
      status VARCHAR(30) DEFAULT 'active',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      auto_renew BOOLEAN DEFAULT true,
      gateway_sub_id VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ══════════════════════════════════════════════════════════════
    -- 4. PRICING INTELLIGENCE — Daily market prices (Section 21)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_price_intelligence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      species VARCHAR(100) NOT NULL,
      size_grade VARCHAR(50),
      market_name VARCHAR(100) NOT NULL,
      district VARCHAR(100),
      state VARCHAR(50) DEFAULT 'Andhra Pradesh',
      price_per_kg DECIMAL(10,2) NOT NULL,
      price_change DECIMAL(10,2) DEFAULT 0,
      change_pct DECIMAL(5,2) DEFAULT 0,
      volume_tons DECIMAL(10,2),
      demand_level VARCHAR(20) DEFAULT 'moderate',
      trend VARCHAR(20) DEFAULT 'stable',
      source VARCHAR(100),
      forecast_7d DECIMAL(10,2),
      forecast_30d DECIMAL(10,2),
      recorded_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_prices_species ON aqua_price_intelligence(species, market_name, recorded_date);

    CREATE TABLE IF NOT EXISTS aqua_price_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      species VARCHAR(100) NOT NULL,
      market_name VARCHAR(100),
      alert_type VARCHAR(30) DEFAULT 'above',
      threshold_price DECIMAL(10,2),
      is_active BOOLEAN DEFAULT true,
      last_triggered TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ══════════════════════════════════════════════════════════════
    -- 5. MESSAGING SYSTEM — Full chat architecture (Section 22)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_chat_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_type VARCHAR(30) DEFAULT 'direct',
      participant_ids UUID[] NOT NULL,
      related_entity_type VARCHAR(50),
      related_entity_id UUID,
      title VARCHAR(200),
      last_message TEXT,
      last_message_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chat_rooms_parts ON aqua_chat_rooms USING gin(participant_ids);

    CREATE TABLE IF NOT EXISTS aqua_chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES aqua_chat_rooms(id),
      sender_id UUID NOT NULL,
      message_type VARCHAR(20) DEFAULT 'text',
      content TEXT,
      image_url VARCHAR(500),
      offer_amount DECIMAL(12,2),
      offer_status VARCHAR(20),
      metadata JSONB DEFAULT '{}',
      read_by UUID[] DEFAULT '{}',
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chat_msgs_room ON aqua_chat_messages(room_id, created_at);

    -- ══════════════════════════════════════════════════════════════
    -- 6. AI ADVISORY ENGINE — Predictive intelligence (Section 28)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_ai_predictions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      farm_id UUID,
      pond_id UUID,
      prediction_type VARCHAR(50) NOT NULL,
      model_name VARCHAR(100),
      model_version VARCHAR(20) DEFAULT '1.0',
      input_features JSONB DEFAULT '{}',
      predicted_value DECIMAL(12,4),
      predicted_label VARCHAR(100),
      confidence_score DECIMAL(5,4),
      risk_level VARCHAR(20),
      recommendation TEXT,
      actual_value DECIMAL(12,4),
      accuracy_pct DECIMAL(5,2),
      valid_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_pred_farm ON aqua_ai_predictions(farm_id, prediction_type);

    -- ══════════════════════════════════════════════════════════════
    -- 7. MONETIZATION & SUBSCRIPTIONS (Section 32)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_monetization_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stream_type VARCHAR(50) NOT NULL,
      stream_name VARCHAR(100) NOT NULL,
      target_role VARCHAR(30),
      price_inr DECIMAL(10,2),
      billing_cycle VARCHAR(20) DEFAULT 'monthly',
      commission_pct DECIMAL(5,2) DEFAULT 0,
      features JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ══════════════════════════════════════════════════════════════
    -- 8. GROWTH & LAUNCH TRACKING (Sections 29, 31, 33)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_growth_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      metric_type VARCHAR(50) NOT NULL,
      metric_name VARCHAR(100) NOT NULL,
      value DECIMAL(12,2),
      district VARCHAR(100),
      target_value DECIMAL(12,2),
      achievement_pct DECIMAL(5,2),
      phase VARCHAR(20),
      period VARCHAR(30),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ══════════════════════════════════════════════════════════════
    -- 9. IoT & FUTURE TECH INTEGRATION (Section 34)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_iot_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id UUID,
      pond_id UUID,
      farm_id UUID,
      sensor_type VARCHAR(50) NOT NULL,
      reading_value DECIMAL(10,4),
      unit VARCHAR(20),
      alert_triggered BOOLEAN DEFAULT false,
      alert_message TEXT,
      battery_pct INTEGER,
      signal_strength INTEGER,
      raw_payload JSONB DEFAULT '{}',
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_iot_pond ON aqua_iot_readings(pond_id, sensor_type, recorded_at);

    -- ══════════════════════════════════════════════════════════════
    -- 10. DEVOPS & MONITORING (Sections 25, 26, 27)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_system_health (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_name VARCHAR(100) NOT NULL,
      health_status VARCHAR(20) DEFAULT 'healthy',
      response_time_ms INTEGER,
      error_rate_pct DECIMAL(5,2) DEFAULT 0,
      cpu_pct DECIMAL(5,2),
      memory_mb INTEGER,
      active_connections INTEGER,
      last_backup TIMESTAMPTZ,
      backup_size_mb INTEGER,
      uptime_pct DECIMAL(6,3) DEFAULT 99.9,
      alerts JSONB DEFAULT '[]',
      checked_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ══════════════════════════════════════════════════════════════
  // SEED: Pricing Intelligence — AP Markets
  // ══════════════════════════════════════════════════════════════
  const priceSeeds = [
    ['Vannamei Shrimp', '30 count', 'Nellore Market', 'Nellore', 380, 12, 3.26, 45.2, 'high', 'rising', 392, 405],
    ['Vannamei Shrimp', '40 count', 'Ongole Market', 'Prakasam', 340, -5, -1.45, 32.1, 'moderate', 'stable', 338, 345],
    ['Vannamei Shrimp', '50 count', 'Bhimavaram Market', 'West Godavari', 290, 8, 2.84, 28.5, 'moderate', 'rising', 298, 310],
    ['Vannamei Shrimp', '60 count', 'Amalapuram Market', 'East Godavari', 250, -3, -1.19, 22.0, 'low', 'falling', 245, 240],
    ['Black Tiger Shrimp', '20 count', 'Kakinada Market', 'East Godavari', 650, 25, 4.0, 8.5, 'high', 'rising', 670, 700],
    ['Black Tiger Shrimp', '30 count', 'Nellore Market', 'Nellore', 480, 10, 2.13, 5.2, 'moderate', 'stable', 485, 490],
    ['Rohu', '800g-1kg', 'Eluru Market', 'West Godavari', 160, 3, 1.91, 55.0, 'high', 'stable', 162, 165],
    ['Rohu', '500-800g', 'Vijayawada Market', 'Krishna', 130, -2, -1.52, 40.0, 'moderate', 'stable', 128, 130],
    ['Pangasius', '1-1.5kg', 'Vijayawada Market', 'Krishna', 95, -2, -2.06, 85.0, 'high', 'falling', 92, 88],
    ['Katla', '1-2kg', 'Eluru Market', 'West Godavari', 180, 5, 2.86, 25.0, 'moderate', 'rising', 185, 192],
    ['Mud Crab', '500g+', 'Kakinada Market', 'East Godavari', 1200, 50, 4.35, 3.2, 'high', 'rising', 1250, 1320],
    ['Seabass', '500g-1kg', 'Nellore Market', 'Nellore', 450, 15, 3.45, 6.0, 'moderate', 'rising', 460, 480],
    ['Tilapia', '300-500g', 'Guntur Market', 'Guntur', 120, -5, -4.0, 35.0, 'low', 'falling', 115, 110],
    ['Scampi', '30-40 count', 'Bhimavaram Market', 'West Godavari', 520, 20, 4.0, 4.5, 'moderate', 'rising', 535, 560],
  ];
  for (const [species, size, market, district, price, change, changePct, vol, demand, trend, f7, f30] of priceSeeds) {
    await query(`INSERT INTO aqua_price_intelligence (species, size_grade, market_name, district, price_per_kg, price_change, change_pct, volume_tons, demand_level, trend, source, forecast_7d, forecast_30d)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'AquaOS Market Intelligence',$11,$12) ON CONFLICT DO NOTHING`,
      [species, size, market, district, price, change, changePct, vol, demand, trend, f7, f30]);
  }

  // SEED: Analytics Snapshots
  const analyticSeeds = [
    ['survival_rate', 'avg_survival_vannamei', 72.5, 'district', 'West Godavari', 'Vannamei Shrimp', 245],
    ['survival_rate', 'avg_survival_vannamei', 68.2, 'district', 'East Godavari', 'Vannamei Shrimp', 189],
    ['survival_rate', 'avg_survival_vannamei', 75.1, 'district', 'Nellore', 'Vannamei Shrimp', 312],
    ['survival_rate', 'avg_survival_rohu', 85.3, 'district', 'Krishna', 'Rohu', 156],
    ['feed_efficiency', 'avg_fcr_vannamei', 1.42, 'district', 'West Godavari', 'Vannamei Shrimp', 200],
    ['feed_efficiency', 'avg_fcr_vannamei', 1.55, 'district', 'Nellore', 'Vannamei Shrimp', 280],
    ['disease_outbreak', 'wssv_incidence_rate', 8.5, 'district', 'East Godavari', 'Vannamei Shrimp', 189],
    ['disease_outbreak', 'ehp_incidence_rate', 12.3, 'district', 'West Godavari', 'Vannamei Shrimp', 245],
    ['yield', 'avg_yield_per_acre', 3200, 'district', 'Nellore', 'Vannamei Shrimp', 312],
    ['yield', 'avg_yield_per_acre', 2800, 'district', 'West Godavari', 'Vannamei Shrimp', 245],
    ['market', 'total_harvest_listed_tons', 4500, 'state', 'Andhra Pradesh', null, 0],
    ['market', 'avg_days_to_sell', 3.2, 'state', 'Andhra Pradesh', null, 0],
  ];
  for (const [type, name, value, dim, dist, sp, samples] of analyticSeeds) {
    await query(`INSERT INTO aqua_analytics_snapshots (snapshot_type, metric_name, metric_value, dimension, district, species, sample_size, period_start, period_end)
      VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE) ON CONFLICT DO NOTHING`,
      [type, name, value, dim, dist, sp, samples]);
  }

  // SEED: Monetization Config
  const monetizationSeeds = [
    ['subscription', 'Buyer Basic', 'buyer', 999, 'monthly', 0, '["Search listings","5 offers/month","Basic filters"]'],
    ['subscription', 'Buyer Pro', 'buyer', 4999, 'monthly', 0, '["Unlimited offers","Priority alerts","Advanced filters","Direct farmer chat","Price forecasts"]'],
    ['subscription', 'Buyer Enterprise', 'buyer', 14999, 'monthly', 0, '["Bulk buying","API access","Dedicated account manager","Cold chain booking","Credit terms"]'],
    ['listing_fee', 'Supplier Standard', 'supplier', 499, 'monthly', 0, '["10 product listings","Lead notifications","Basic analytics"]'],
    ['listing_fee', 'Supplier Premium', 'supplier', 2999, 'monthly', 0, '["Unlimited listings","Featured placement","Campaign tools","Sales leads","Analytics dashboard"]'],
    ['commission', 'Transaction Fee', 'platform', 0, 'per_transaction', 2.5, '["Applied on successful harvest sales"]'],
    ['commission', 'Input Marketplace Fee', 'platform', 0, 'per_transaction', 3.0, '["Applied on input orders"]'],
    ['advertising', 'Banner Ad', 'supplier', 5000, 'weekly', 0, '["Homepage banner","Targeted to district","Click analytics"]'],
    ['advertising', 'Featured Product', 'supplier', 1500, 'weekly', 0, '["Top of search","Highlighted listing","Priority in alerts"]'],
    ['free', 'Farmer Basic', 'farmer', 0, 'forever', 0, '["Full Farm OS","Advisory","Community","List harvest","Buy inputs","Chat"]'],
  ];
  for (const [type, name, role, price, cycle, comm, features] of monetizationSeeds) {
    await query(`INSERT INTO aqua_monetization_config (stream_type, stream_name, target_role, price_inr, billing_cycle, commission_pct, features)
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) ON CONFLICT DO NOTHING`,
      [type, name, role, price, cycle, comm, features]);
  }

  // SEED: Growth Metrics — Target districts
  const growthSeeds = [
    ['farmer_registrations', 'Registered Farmers', 8500, 'West Godavari', 25000, 34.0, 'phase1'],
    ['farmer_registrations', 'Registered Farmers', 6200, 'East Godavari', 20000, 31.0, 'phase1'],
    ['farmer_registrations', 'Registered Farmers', 12100, 'Krishna', 30000, 40.3, 'phase1'],
    ['farmer_registrations', 'Registered Farmers', 15800, 'Nellore', 35000, 45.1, 'phase1'],
    ['harvest_listings', 'Active Listings', 340, 'West Godavari', 2000, 17.0, 'phase1'],
    ['harvest_listings', 'Active Listings', 280, 'Nellore', 2500, 11.2, 'phase1'],
    ['buyer_offers', 'Total Offers', 1250, null, 10000, 12.5, 'phase1'],
    ['transactions', 'Completed Deals', 890, null, 5000, 17.8, 'phase1'],
    ['gmv', 'Gross Merchandise Value (Lakhs)', 425, null, 5000, 8.5, 'phase1'],
  ];
  for (const [type, name, val, dist, target, ach, phase] of growthSeeds) {
    await query(`INSERT INTO aqua_growth_metrics (metric_type, metric_name, value, district, target_value, achievement_pct, phase, period)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'2026-Q2') ON CONFLICT DO NOTHING`,
      [type, name, val, dist, target, ach, phase]);
  }

  // SEED: AI Predictions
  const aiSeeds = [
    ['disease_prediction', 'WSSV Risk Model', '{"water_temp":31,"salinity":18,"doc":45,"stocking_density":50}', null, 'high_risk', 0.82, 'high', 'Reduce stocking density. Monitor for white spots. Prepare emergency harvest plan.'],
    ['yield_prediction', 'Yield Estimator v1', '{"species":"vannamei","doc":90,"fcr":1.4,"survival":75,"area_acres":2.5}', 3150, null, 0.88, 'low', 'Expected yield 3,150 kg. Harvest at DOC 110 for optimal size-price.'],
    ['feed_optimization', 'Feed Optimizer v1', '{"abw":18,"doc":65,"water_temp":28.5,"target_growth":0.35}', 42.5, null, 0.91, 'low', 'Recommend 42.5 kg/day. Reduce by 10% if poor weather. Switch to finisher feed at DOC 80.'],
    ['price_prediction', 'Price Forecast v1', '{"species":"vannamei","size":"30ct","market":"nellore","season":"summer"}', 395, null, 0.78, 'medium', 'Price expected to rise to ₹395/kg. Consider holding harvest 7 days for better price.'],
    ['mortality_risk', 'Mortality Alert v1', '{"dissolved_oxygen":3.8,"ammonia":0.5,"doc":55,"recent_mortality":2.1}', null, 'elevated', 0.75, 'medium', 'Oxygen levels critical. Activate aerators immediately. Reduce feeding by 30%.'],
  ];
  for (const [type, model, features, predVal, predLabel, conf, risk, rec] of aiSeeds) {
    await query(`INSERT INTO aqua_ai_predictions (prediction_type, model_name, input_features, predicted_value, predicted_label, confidence_score, risk_level, recommendation)
      VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
      [type, model, features, predVal, predLabel, conf, risk, rec]);
  }

  // SEED: System Health
  await query(`INSERT INTO aqua_system_health (service_name, health_status, response_time_ms, error_rate_pct, cpu_pct, memory_mb, active_connections, uptime_pct)
    VALUES ('api-gateway','healthy',45,0.02,22.5,512,1250,99.97),
           ('farm-service','healthy',38,0.01,18.2,384,890,99.99),
           ('marketplace-service','healthy',52,0.03,28.1,640,2100,99.95),
           ('chat-service','healthy',15,0.0,12.0,256,450,99.99),
           ('analytics-service','healthy',120,0.05,35.0,1024,320,99.92),
           ('payment-service','healthy',85,0.01,15.5,384,180,99.99)
    ON CONFLICT DO NOTHING`);

  console.log('✅ Migration V19 complete — AquaOS V10: Analytics + Search + Payments + Pricing + Chat + AI + Growth + Monetization');
}

module.exports = { migrateV19AquaOSV10 };
