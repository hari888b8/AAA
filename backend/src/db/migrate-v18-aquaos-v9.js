// ═══════════════════════════════════════════════════════════════════
// Migration V18 — AquaOS V9: Privacy Controls + Admin Analytics +
// Real-time Negotiation + Production Insights + Security Monitoring
// ═══════════════════════════════════════════════════════════════════
const { query } = require('./pool');

async function migrateV18AquaOSV9() {
  await query(`
    -- ══════════════════════════════════════════════════════════════
    -- 1. PRIVACY CONTROLS — Farmers control visibility of data
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_privacy_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      show_farm_location BOOLEAN DEFAULT true,
      show_production_volumes BOOLEAN DEFAULT true,
      show_contact_phone BOOLEAN DEFAULT false,
      show_contact_email BOOLEAN DEFAULT true,
      show_pond_details BOOLEAN DEFAULT true,
      show_feed_brand BOOLEAN DEFAULT false,
      show_survival_rate BOOLEAN DEFAULT false,
      allow_buyer_contact BOOLEAN DEFAULT true,
      allow_supplier_contact BOOLEAN DEFAULT true,
      allow_expert_contact BOOLEAN DEFAULT true,
      anonymous_community_posts BOOLEAN DEFAULT false,
      data_sharing_consent BOOLEAN DEFAULT true,
      analytics_opt_in BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- ══════════════════════════════════════════════════════════════
    -- 2. REAL-TIME NEGOTIATION ROOMS
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_negotiation_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      crop_post_id UUID,
      harvest_listing_id UUID,
      farmer_id UUID NOT NULL,
      buyer_id UUID NOT NULL,
      status VARCHAR(30) DEFAULT 'active',
      initial_asking_price DECIMAL(12,2),
      current_offer DECIMAL(12,2),
      counter_offer DECIMAL(12,2),
      agreed_price DECIMAL(12,2),
      agreed_quantity_kg DECIMAL(12,2),
      species VARCHAR(100),
      negotiation_round INTEGER DEFAULT 0,
      last_action_by VARCHAR(20),
      expires_at TIMESTAMPTZ,
      closed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS aqua_negotiation_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES aqua_negotiation_rooms(id),
      sender_id UUID NOT NULL,
      sender_role VARCHAR(20) NOT NULL,
      message_type VARCHAR(30) DEFAULT 'text',
      content TEXT,
      price_offered DECIMAL(12,2),
      quantity_kg DECIMAL(12,2),
      metadata JSONB DEFAULT '{}',
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_neg_messages_room ON aqua_negotiation_messages(room_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_neg_rooms_farmer ON aqua_negotiation_rooms(farmer_id, status);
    CREATE INDEX IF NOT EXISTS idx_neg_rooms_buyer ON aqua_negotiation_rooms(buyer_id, status);

    -- ══════════════════════════════════════════════════════════════
    -- 3. ADMIN AUDIT LOG
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_admin_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id UUID,
      details JSONB DEFAULT '{}',
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON aqua_admin_audit_log(action, created_at);

    -- ══════════════════════════════════════════════════════════════
    -- 4. PLATFORM ANALYTICS SNAPSHOTS
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_platform_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
      total_farmers INTEGER DEFAULT 0,
      total_buyers INTEGER DEFAULT 0,
      total_suppliers INTEGER DEFAULT 0,
      active_crop_posts INTEGER DEFAULT 0,
      total_harvest_volume_kg DECIMAL(14,2) DEFAULT 0,
      total_trade_value_inr DECIMAL(14,2) DEFAULT 0,
      avg_deal_price_per_kg DECIMAL(10,2) DEFAULT 0,
      total_negotiations INTEGER DEFAULT 0,
      successful_deals INTEGER DEFAULT 0,
      avg_negotiation_rounds DECIMAL(4,1) DEFAULT 0,
      top_species JSONB DEFAULT '[]',
      top_districts JSONB DEFAULT '[]',
      revenue_commission_inr DECIMAL(14,2) DEFAULT 0,
      revenue_subscription_inr DECIMAL(14,2) DEFAULT 0,
      revenue_leads_inr DECIMAL(14,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(snapshot_date)
    );

    -- ══════════════════════════════════════════════════════════════
    -- 5. PRODUCTION DATA INSIGHTS (Hidden Asset)
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_production_insights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      insight_type VARCHAR(50) NOT NULL,
      species VARCHAR(100),
      district VARCHAR(100),
      state VARCHAR(50) DEFAULT 'Andhra Pradesh',
      metric_name VARCHAR(100) NOT NULL,
      metric_value DECIMAL(12,4),
      metric_unit VARCHAR(30),
      sample_size INTEGER DEFAULT 0,
      confidence_level DECIMAL(5,2),
      period_start DATE,
      period_end DATE,
      metadata JSONB DEFAULT '{}',
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prod_insights_type ON aqua_production_insights(insight_type, species);

    -- ══════════════════════════════════════════════════════════════
    -- 6. NOTIFICATION CHANNEL PREFERENCES
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_notification_prefs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      channel_push BOOLEAN DEFAULT true,
      channel_sms BOOLEAN DEFAULT true,
      channel_email BOOLEAN DEFAULT true,
      channel_whatsapp BOOLEAN DEFAULT false,
      alert_advisory BOOLEAN DEFAULT true,
      alert_buyer_offers BOOLEAN DEFAULT true,
      alert_supplier_promos BOOLEAN DEFAULT false,
      alert_community_replies BOOLEAN DEFAULT true,
      alert_price_changes BOOLEAN DEFAULT true,
      alert_harvest_reminders BOOLEAN DEFAULT true,
      alert_disease_outbreaks BOOLEAN DEFAULT true,
      quiet_hours_start TIME DEFAULT '22:00',
      quiet_hours_end TIME DEFAULT '06:00',
      language VARCHAR(5) DEFAULT 'en',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );

    -- ══════════════════════════════════════════════════════════════
    -- 7. SECURITY — Fraud Alerts + Rate Limit Tracking
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_fraud_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      alert_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) DEFAULT 'medium',
      description TEXT,
      evidence JSONB DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'open',
      reviewed_by UUID,
      reviewed_at TIMESTAMPTZ,
      action_taken VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS aqua_rate_limit_violations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      ip_address VARCHAR(45),
      endpoint VARCHAR(200),
      violation_count INTEGER DEFAULT 1,
      window_start TIMESTAMPTZ DEFAULT NOW(),
      blocked_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON aqua_fraud_alerts(status, severity);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON aqua_rate_limit_violations(ip_address, window_start);

    -- ══════════════════════════════════════════════════════════════
    -- 8. ADMIN DASHBOARD WIDGETS
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_admin_widgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL,
      widget_type VARCHAR(50) NOT NULL,
      position INTEGER DEFAULT 0,
      config JSONB DEFAULT '{}',
      is_visible BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ══════════════════════════════════════════════════════════════
    -- 9. SUPPLIER VERIFICATION QUEUE
    -- ══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_verification_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      user_role VARCHAR(20) NOT NULL,
      verification_type VARCHAR(50) NOT NULL,
      documents JSONB DEFAULT '[]',
      status VARCHAR(20) DEFAULT 'pending',
      reviewer_id UUID,
      reviewer_notes TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_verif_queue_status ON aqua_verification_queue(status, submitted_at);
  `);

  // ══════════════════════════════════════════════════════════════
  // SEED: Production Insights (The Hidden Asset)
  // ══════════════════════════════════════════════════════════════
  const insights = [
    ['survival_rate', 'Vannamei Shrimp', 'Nellore', 'Average Survival Rate', 72.5, '%', 245, 85.0, '2026-01-01', '2026-04-30'],
    ['survival_rate', 'Vannamei Shrimp', 'West Godavari', 'Average Survival Rate', 68.3, '%', 180, 82.0, '2026-01-01', '2026-04-30'],
    ['survival_rate', 'Vannamei Shrimp', 'East Godavari', 'Average Survival Rate', 74.1, '%', 156, 88.0, '2026-01-01', '2026-04-30'],
    ['growth_rate', 'Vannamei Shrimp', 'Nellore', 'Avg Daily Growth (g/day)', 0.28, 'g/day', 245, 90.0, '2026-01-01', '2026-04-30'],
    ['growth_rate', 'Vannamei Shrimp', 'West Godavari', 'Avg Daily Growth (g/day)', 0.31, 'g/day', 180, 87.0, '2026-01-01', '2026-04-30'],
    ['fcr', 'Vannamei Shrimp', 'Nellore', 'Feed Conversion Ratio', 1.42, 'ratio', 200, 80.0, '2026-01-01', '2026-04-30'],
    ['fcr', 'Vannamei Shrimp', 'West Godavari', 'Feed Conversion Ratio', 1.38, 'ratio', 165, 82.0, '2026-01-01', '2026-04-30'],
    ['best_harvest_period', 'Vannamei Shrimp', 'Andhra Pradesh', 'Best Harvest Month', 3, 'month', 500, 75.0, '2025-01-01', '2026-04-30'],
    ['disease_outbreak', 'Vannamei Shrimp', 'Nellore', 'WSSV Outbreak Frequency', 12.5, '%', 245, 70.0, '2026-01-01', '2026-04-30'],
    ['disease_outbreak', 'Vannamei Shrimp', 'East Godavari', 'EHP Outbreak Frequency', 8.2, '%', 156, 72.0, '2026-01-01', '2026-04-30'],
    ['feed_performance', 'Vannamei Shrimp', 'Nellore', 'Top Feed Brand Growth Rate (CP)', 0.32, 'g/day', 120, 85.0, '2026-01-01', '2026-04-30'],
    ['feed_performance', 'Vannamei Shrimp', 'Nellore', 'Top Feed Brand Growth Rate (Avanti)', 0.29, 'g/day', 95, 82.0, '2026-01-01', '2026-04-30'],
    ['yield_per_acre', 'Vannamei Shrimp', 'Nellore', 'Avg Yield Per Acre', 4200, 'kg/acre', 245, 80.0, '2026-01-01', '2026-04-30'],
    ['yield_per_acre', 'Vannamei Shrimp', 'West Godavari', 'Avg Yield Per Acre', 3800, 'kg/acre', 180, 78.0, '2026-01-01', '2026-04-30'],
    ['yield_per_acre', 'Rohu', 'Krishna', 'Avg Yield Per Acre', 2800, 'kg/acre', 90, 75.0, '2026-01-01', '2026-04-30'],
    ['market_price_trend', 'Vannamei Shrimp', 'Nellore', 'Avg Price 30ct (Apr)', 420, '₹/kg', 500, 95.0, '2026-04-01', '2026-04-30'],
    ['market_price_trend', 'Vannamei Shrimp', 'Bhimavaram', 'Avg Price 30ct (Apr)', 430, '₹/kg', 400, 92.0, '2026-04-01', '2026-04-30'],
    ['stocking_density', 'Vannamei Shrimp', 'Nellore', 'Optimal Stocking Density', 35, 'pcs/sqm', 200, 85.0, '2026-01-01', '2026-04-30'],
    ['culture_period', 'Vannamei Shrimp', 'Andhra Pradesh', 'Avg Culture Days to 30ct', 105, 'days', 400, 88.0, '2026-01-01', '2026-04-30'],
    ['culture_period', 'Rohu', 'Andhra Pradesh', 'Avg Culture Days to 800g', 240, 'days', 120, 75.0, '2026-01-01', '2026-04-30'],
  ];

  for (const [type, species, district, metric, value, unit, sample, confidence, start, end] of insights) {
    await query(`
      INSERT INTO aqua_production_insights (insight_type, species, district, metric_name, metric_value, metric_unit, sample_size, confidence_level, period_start, period_end, is_published)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) ON CONFLICT DO NOTHING
    `, [type, species, district, metric, value, unit, sample, confidence, start, end]);
  }

  // Seed platform analytics snapshot
  await query(`
    INSERT INTO aqua_platform_analytics (snapshot_date, total_farmers, total_buyers, total_suppliers,
      active_crop_posts, total_harvest_volume_kg, total_trade_value_inr, avg_deal_price_per_kg,
      total_negotiations, successful_deals, avg_negotiation_rounds, top_species, top_districts,
      revenue_commission_inr, revenue_subscription_inr, revenue_leads_inr)
    VALUES (CURRENT_DATE, 1250, 85, 42, 340, 2850000, 98500000, 345.50, 890, 567, 2.3,
      '[{"species":"Vannamei Shrimp","pct":72},{"species":"Rohu","pct":12},{"species":"Pangasius","pct":8}]',
      '[{"district":"Nellore","pct":35},{"district":"West Godavari","pct":22},{"district":"East Godavari","pct":18}]',
      4925000, 2125000, 840000)
    ON CONFLICT (snapshot_date) DO NOTHING
  `);

  console.log('✅ Migration V18 — AquaOS V9 complete (Privacy + Admin + Negotiation + Insights + Security)');
}

module.exports = { migrateV18AquaOSV9 };
