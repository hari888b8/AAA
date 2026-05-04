/**
 * Migration V17 — AquaOS V8: Role-Based Ecosystem Platform
 * 
 * Implements the dual-marketplace architecture with strict data visibility:
 * - Crop Posts (farmers post harvest availability, only buyers see)
 * - Community Discussions (disease outbreaks, feed performance, growth results)
 * - Supply Forecast (aggregate harvest predictions for buyers)
 * - Supplier Promotions & Campaigns
 * - Sales Leads (when farmers click supplier products)
 * - Data Visibility Rules (role-based access control)
 * - Expert Advisory Directory
 * - Platform Workflow Tracking (7-step lifecycle)
 */

const { query } = require('./pool');

async function migrateV17AquaOSV8() {
  await query(`

    -- ═══════════════════════════════════════════════════════════════
    -- CROP POSTS — Farmers post harvest availability (buyers only see)
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_crop_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      farmer_id UUID NOT NULL,
      species VARCHAR(100) NOT NULL,
      size_grade VARCHAR(50),
      expected_quantity_kg NUMERIC(10,2) NOT NULL,
      harvest_date DATE NOT NULL,
      location_district VARCHAR(100) NOT NULL,
      location_state VARCHAR(50) DEFAULT 'Andhra Pradesh',
      latitude NUMERIC(10,7),
      longitude NUMERIC(10,7),
      asking_price_per_kg NUMERIC(10,2),
      quality_grade VARCHAR(20) DEFAULT 'standard',
      pond_area_acres NUMERIC(6,2),
      culture_days INTEGER,
      feed_brand VARCHAR(100),
      survival_rate NUMERIC(5,2),
      notes TEXT,
      photos TEXT[] DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'available',
      visibility VARCHAR(20) DEFAULT 'buyers_only',
      views_count INTEGER DEFAULT 0,
      offers_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_crop_posts_status ON aqua_crop_posts(status);
    CREATE INDEX IF NOT EXISTS idx_crop_posts_species ON aqua_crop_posts(species);
    CREATE INDEX IF NOT EXISTS idx_crop_posts_district ON aqua_crop_posts(location_district);
    CREATE INDEX IF NOT EXISTS idx_crop_posts_harvest ON aqua_crop_posts(harvest_date);

    -- ═══════════════════════════════════════════════════════════════
    -- BUYER OFFERS ON CROP POSTS
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_crop_offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      crop_post_id UUID NOT NULL REFERENCES aqua_crop_posts(id),
      buyer_id UUID NOT NULL,
      offered_price_per_kg NUMERIC(10,2) NOT NULL,
      quantity_wanted_kg NUMERIC(10,2),
      message TEXT,
      pickup_preference VARCHAR(50) DEFAULT 'farm_gate',
      payment_terms VARCHAR(50) DEFAULT 'immediate',
      status VARCHAR(20) DEFAULT 'pending',
      farmer_response TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      responded_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_crop_offers_post ON aqua_crop_offers(crop_post_id);
    CREATE INDEX IF NOT EXISTS idx_crop_offers_buyer ON aqua_crop_offers(buyer_id);

    -- ═══════════════════════════════════════════════════════════════
    -- COMMUNITY DISCUSSIONS (valuable real-world data)
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_community_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id UUID NOT NULL,
      author_role VARCHAR(20) DEFAULT 'farmer',
      category VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      species_tag VARCHAR(50),
      district_tag VARCHAR(100),
      images TEXT[] DEFAULT '{}',
      upvotes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      is_pinned BOOLEAN DEFAULT false,
      is_expert_verified BOOLEAN DEFAULT false,
      visibility VARCHAR(20) DEFAULT 'all_farmers',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_community_category ON aqua_community_posts(category);

    CREATE TABLE IF NOT EXISTS aqua_community_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES aqua_community_posts(id),
      author_id UUID NOT NULL,
      author_role VARCHAR(20) DEFAULT 'farmer',
      content TEXT NOT NULL,
      is_expert_answer BOOLEAN DEFAULT false,
      upvotes INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- SUPPLY FORECAST (aggregate data for buyers)
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_supply_forecast (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      species VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      forecast_period_start DATE NOT NULL,
      forecast_period_end DATE NOT NULL,
      estimated_quantity_tons NUMERIC(10,2),
      confidence_level VARCHAR(20) DEFAULT 'medium',
      num_farms_reporting INTEGER DEFAULT 0,
      avg_size_grade VARCHAR(50),
      price_trend VARCHAR(20) DEFAULT 'stable',
      calculated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_supply_forecast_period ON aqua_supply_forecast(forecast_period_start);

    -- ═══════════════════════════════════════════════════════════════
    -- SUPPLIER PROMOTIONS & CAMPAIGNS
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_supplier_promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      promotion_type VARCHAR(50) DEFAULT 'discount',
      discount_percent NUMERIC(5,2),
      product_category VARCHAR(50),
      target_species VARCHAR(100),
      target_district VARCHAR(100),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      banner_image TEXT,
      clicks INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      budget_inr NUMERIC(10,2),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_supplier_promos_active ON aqua_supplier_promotions(status, end_date);

    -- ═══════════════════════════════════════════════════════════════
    -- SALES LEADS (farmer clicks on supplier product)
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_sales_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL,
      farmer_id UUID NOT NULL,
      product_id UUID,
      promotion_id UUID,
      source VARCHAR(50) DEFAULT 'product_click',
      farmer_district VARCHAR(100),
      farmer_pond_acres NUMERIC(6,2),
      farmer_species VARCHAR(100),
      status VARCHAR(20) DEFAULT 'new',
      contacted_at TIMESTAMPTZ,
      converted BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_supplier ON aqua_sales_leads(supplier_id, status);

    -- ═══════════════════════════════════════════════════════════════
    -- EXPERT ADVISORY DIRECTORY
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_experts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      name VARCHAR(150) NOT NULL,
      specialization VARCHAR(100) NOT NULL,
      qualification VARCHAR(200),
      experience_years INTEGER DEFAULT 0,
      languages TEXT[] DEFAULT '{en}',
      districts_served TEXT[] DEFAULT '{}',
      species_expertise TEXT[] DEFAULT '{}',
      hourly_rate_inr NUMERIC(8,2),
      rating NUMERIC(3,2) DEFAULT 0,
      total_consultations INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      availability VARCHAR(20) DEFAULT 'available',
      bio TEXT,
      photo_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- MARKET PRICES (multi-market daily aggregation)
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_market_prices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      species VARCHAR(100) NOT NULL,
      size_grade VARCHAR(50) NOT NULL,
      market_name VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      price_per_kg NUMERIC(10,2) NOT NULL,
      price_change NUMERIC(10,2) DEFAULT 0,
      volume_tons NUMERIC(10,2),
      price_date DATE DEFAULT CURRENT_DATE,
      source VARCHAR(50) DEFAULT 'market_report',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_market_prices_date ON aqua_market_prices(price_date, species);

    -- ═══════════════════════════════════════════════════════════════
    -- DATA VISIBILITY RULES
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_visibility_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_type VARCHAR(50) NOT NULL,
      viewer_role VARCHAR(20) NOT NULL,
      can_view BOOLEAN DEFAULT false,
      can_list BOOLEAN DEFAULT false,
      can_contact BOOLEAN DEFAULT false,
      fields_visible TEXT[] DEFAULT '{}',
      fields_hidden TEXT[] DEFAULT '{}',
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ═══════════════════════════════════════════════════════════════
    -- PLATFORM WORKFLOW TRACKING
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS aqua_workflow_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      user_role VARCHAR(20) NOT NULL,
      workflow_step INTEGER NOT NULL,
      step_name VARCHAR(100) NOT NULL,
      metadata JSONB DEFAULT '{}',
      completed_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_workflow_user ON aqua_workflow_events(user_id, workflow_step);

  `);

  // ═══════════════════════════════════════════════════════════════
  // SEED DATA
  // ═══════════════════════════════════════════════════════════════

  // Seed visibility rules
  const visRules = [
    ['crop_posts', 'farmer', false, false, false, '{}', '{}', 'Farmers cannot see other farmers crop posts'],
    ['crop_posts', 'buyer', true, true, true, '{species,quantity,harvest_date,location,size_grade,price}', '{farmer_phone,exact_location}', 'Buyers can see crop listings but not personal details until deal'],
    ['crop_posts', 'supplier', false, false, false, '{}', '{}', 'Suppliers cannot see crop posts'],
    ['farmer_data', 'farmer', false, false, false, '{}', '{}', 'Farmers cannot see other farmer data'],
    ['farmer_data', 'buyer', true, false, false, '{district,species,quantity}', '{phone,address,pond_details}', 'Buyers see limited farmer info'],
    ['farmer_data', 'supplier', false, false, false, '{}', '{}', 'Suppliers cannot see farmer data'],
    ['supply_forecast', 'buyer', true, true, false, '{species,quantity,period,district}', '{}', 'Buyers can access supply forecast'],
    ['supply_forecast', 'supplier', false, false, false, '{}', '{}', 'Suppliers cannot see supply data'],
    ['supplier_products', 'farmer', true, true, false, '{name,price,category,brand}', '{margins,cost}', 'Farmers can browse supplier products'],
    ['supplier_products', 'buyer', false, false, false, '{}', '{}', 'Buyers dont need supplier products'],
  ];
  for (const r of visRules) {
    await query(`INSERT INTO aqua_visibility_rules (id, resource_type, viewer_role, can_view, can_list, can_contact, fields_visible, fields_hidden, description)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
      [require('uuid').v4(), r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]]);
  }

  // Seed market prices
  const prices = [
    ['Vannamei Shrimp', '30 count', 'Nellore Mkt', 'Nellore', 420, 12],
    ['Vannamei Shrimp', '30 count', 'Bhimavaram Mkt', 'West Godavari', 430, 8],
    ['Vannamei Shrimp', '30 count', 'Kakinada Mkt', 'East Godavari', 425, 5],
    ['Vannamei Shrimp', '40 count', 'Nellore Mkt', 'Nellore', 350, -5],
    ['Vannamei Shrimp', '40 count', 'Ongole Mkt', 'Prakasam', 345, -3],
    ['Vannamei Shrimp', '50 count', 'Bhimavaram Mkt', 'West Godavari', 290, 8],
    ['Black Tiger Shrimp', '20 count', 'Kakinada Mkt', 'East Godavari', 650, 25],
    ['Black Tiger Shrimp', '30 count', 'Nellore Mkt', 'Nellore', 520, 15],
    ['Rohu', '800g-1kg', 'Eluru Mkt', 'West Godavari', 160, 3],
    ['Rohu', '1-1.5kg', 'Vijayawada Mkt', 'Krishna', 180, 5],
    ['Pangasius', '1-1.5kg', 'Vijayawada Mkt', 'Krishna', 95, -2],
    ['Pangasius', '1.5-2kg', 'Eluru Mkt', 'West Godavari', 105, 0],
    ['Mud Crab', '500g+', 'Kakinada Mkt', 'East Godavari', 1200, 50],
    ['Seabass', '500g-1kg', 'Visakhapatnam Mkt', 'Visakhapatnam', 450, 10],
  ];
  for (const p of prices) {
    await query(`INSERT INTO aqua_market_prices (id, species, size_grade, market_name, district, price_per_kg, price_change)
      VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [require('uuid').v4(), p[0], p[1], p[2], p[3], p[4], p[5]]);
  }

  // Seed experts
  const experts = [
    ['Dr. Ramesh Kumar', 'Shrimp Disease Management', 'PhD Aquatic Pathology, CIFE Mumbai', 15, '{en,te}', '{Nellore,West Godavari,East Godavari}', '{Vannamei Shrimp,Black Tiger}', 1500, 4.8],
    ['Dr. Lakshmi Narayana', 'Feed Optimization & Nutrition', 'MSc Fisheries, ANGRAU', 12, '{en,te,hi}', '{Krishna,Guntur,Prakasam}', '{Vannamei Shrimp,Pangasius,Rohu}', 1200, 4.6],
    ['Prof. Suresh Babu', 'Biofloc & RAS Technology', 'PhD Aquaculture Engineering, ICAR-CIFA', 20, '{en,te}', '{West Godavari,East Godavari,Krishna}', '{Vannamei Shrimp,Tilapia}', 2000, 4.9],
    ['Dr. Anitha Devi', 'Water Quality Management', 'MSc Limnology, Andhra University', 8, '{en,te,ta}', '{Nellore,Prakasam,Chittoor}', '{Vannamei Shrimp,Seabass}', 1000, 4.5],
    ['Venkat Rao', 'Farm Economics & Marketing', 'MBA Agribusiness, MANAGE', 10, '{en,te,hi}', '{All AP Districts}', '{All Species}', 800, 4.3],
  ];
  for (const e of experts) {
    await query(`INSERT INTO aqua_experts (id, name, specialization, qualification, experience_years, languages, districts_served, species_expertise, hourly_rate_inr, rating, is_verified)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) ON CONFLICT DO NOTHING`,
      [require('uuid').v4(), e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]);
  }

  // Seed supply forecast
  const forecasts = [
    ['Vannamei Shrimp', 'Nellore', 1200, 'high', 85, '30 count'],
    ['Vannamei Shrimp', 'West Godavari', 950, 'high', 62, '30-40 count'],
    ['Vannamei Shrimp', 'East Godavari', 780, 'medium', 45, '40 count'],
    ['Rohu', 'Krishna', 450, 'medium', 30, '800g-1kg'],
    ['Pangasius', 'West Godavari', 680, 'high', 22, '1-1.5kg'],
    ['Black Tiger Shrimp', 'East Godavari', 180, 'low', 12, '20 count'],
    ['Mud Crab', 'East Godavari', 45, 'low', 8, '500g+'],
  ];
  for (const f of forecasts) {
    await query(`INSERT INTO aqua_supply_forecast (id, species, district, forecast_period_start, forecast_period_end, estimated_quantity_tons, confidence_level, num_farms_reporting, avg_size_grade)
      VALUES ($1,$2,$3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [require('uuid').v4(), f[0], f[1], f[2], f[3], f[4], f[5]]);
  }

  // Seed community posts
  const commPosts = [
    ['disease_outbreak', 'White Spot Virus Alert in Nellore District', 'Seeing WSSV symptoms in multiple ponds near Muthukur. Water temperature has been above 32°C for 5 days. Recommending emergency harvest for ponds above 60 DOC.', 'Vannamei Shrimp', 'Nellore', 24, 8],
    ['feed_performance', 'CP 35P vs Avanti Gold comparison after 60 days', 'Ran both feeds in adjacent ponds same stocking. CP showed 0.3g/day better ADG but Avanti had better FCR (1.35 vs 1.42). Overall cost per kg production similar.', 'Vannamei Shrimp', 'West Godavari', 45, 12],
    ['growth_results', 'Achieved 35g in 95 DOC - Biofloc system', 'Using 40/acre stocking density with biofloc supplement. Growth: 0.37g/day average. Key was maintaining C:N ratio at 15:1 and floc volume at 12-15ml/L.', 'Vannamei Shrimp', 'East Godavari', 67, 15],
    ['market_info', 'Export demand picking up for China - 30ct premium', 'Chinese importers actively buying 30 count at $5.2/kg. Premium of ₹80/kg over domestic. Need MPEDA registration and CAA compliance.', 'Vannamei Shrimp', 'Nellore', 38, 6],
    ['water_quality', 'Alkalinity crash solution that worked for me', 'Had alkalinity drop to 60ppm. Applied dolomite at 100kg/acre + sodium bicarbonate at 10kg/acre. Recovered to 140ppm in 48 hours. Monitor pH closely during correction.', 'Vannamei Shrimp', 'Krishna', 52, 9],
  ];
  for (const c of commPosts) {
    await query(`INSERT INTO aqua_community_posts (id, category, title, content, species_tag, district_tag, upvotes, comments_count, author_id, author_role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'farmer') ON CONFLICT DO NOTHING`,
      [require('uuid').v4(), c[0], c[1], c[2], c[3], c[4], c[5], c[6], '00000000-0000-0000-0000-000000000001']);
  }

  console.log('✅ Migration V17 — AquaOS V8 Role-Based Ecosystem completed');
}

module.exports = { migrateV17AquaOSV8 };
