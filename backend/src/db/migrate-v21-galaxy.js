/**
 * Migration V21 — Galaxy Discovery Tables
 * Creates tables for: contract_opportunities, exporters, mandis, training_courses,
 * government_schemes, kisan_vehicles + supporting tables
 */
const { pool } = require('./pool');

async function migrateV21Galaxy() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Contract Opportunities ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS contract_opportunities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID REFERENCES users(id),
        title TEXT NOT NULL,
        crop_name TEXT NOT NULL,
        buyer_company TEXT,
        state TEXT,
        district TEXT,
        quantity_required_mt NUMERIC(10,2),
        price_per_kg NUMERIC(8,2),
        contract_duration_months INTEGER,
        payment_terms TEXT,
        quality_standards TEXT,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contract_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID REFERENCES contract_opportunities(id),
        farmer_id UUID REFERENCES users(id),
        proposed_quantity_mt NUMERIC(10,2),
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Exporters ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS exporters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        company_name TEXT NOT NULL,
        owner_name TEXT,
        state TEXT,
        district TEXT,
        commodities TEXT[] DEFAULT '{}',
        export_countries TEXT[] DEFAULT '{}',
        certifications TEXT[] DEFAULT '{}',
        annual_export_volume_mt NUMERIC(12,2) DEFAULT 0,
        apeda_registered BOOLEAN DEFAULT false,
        iec_code TEXT,
        rating NUMERIC(3,2) DEFAULT 0,
        established_year INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS exporter_demands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exporter_id UUID REFERENCES exporters(id),
        commodity TEXT NOT NULL,
        quantity_mt NUMERIC(10,2),
        target_country TEXT,
        quality_specs TEXT,
        deadline DATE,
        price_range TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Mandis ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS mandis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mandi_name TEXT NOT NULL,
        district TEXT,
        state TEXT,
        address TEXT,
        commodities_traded TEXT[] DEFAULT '{}',
        operating_hours TEXT,
        infrastructure TEXT,
        avg_daily_arrivals_mt NUMERIC(10,2) DEFAULT 0,
        contact_number TEXT,
        license_number TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mandi_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mandi_id UUID REFERENCES mandis(id),
        commodity TEXT NOT NULL,
        variety TEXT,
        min_price NUMERIC(8,2),
        max_price NUMERIC(8,2),
        modal_price NUMERIC(8,2),
        arrival_qty_mt NUMERIC(10,2),
        price_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Training Courses ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        language TEXT DEFAULT 'English',
        duration_hours NUMERIC(6,1),
        instructor_name TEXT,
        institution TEXT,
        certification_offered BOOLEAN DEFAULT false,
        is_free BOOLEAN DEFAULT true,
        fee_amount NUMERIC(8,2) DEFAULT 0,
        rating NUMERIC(3,2) DEFAULT 0,
        enrollment_count INTEGER DEFAULT 0,
        thumbnail_url TEXT,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS training_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES training_courses(id),
        title TEXT NOT NULL,
        content_type TEXT DEFAULT 'video',
        duration_minutes INTEGER,
        sequence_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS training_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES training_courses(id),
        user_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Government Schemes ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS government_schemes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scheme_name TEXT NOT NULL,
        department TEXT,
        category TEXT,
        state_or_central TEXT DEFAULT 'central',
        applicable_states TEXT[] DEFAULT '{}',
        target_beneficiary TEXT,
        benefit_type TEXT,
        max_benefit_amount NUMERIC(12,2) DEFAULT 0,
        eligibility_criteria TEXT,
        documents_required TEXT[] DEFAULT '{}',
        deadline DATE,
        application_count INTEGER DEFAULT 0,
        success_rate NUMERIC(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scheme_faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scheme_id UUID REFERENCES government_schemes(id),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sequence_order INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scheme_success_stories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scheme_id UUID REFERENCES government_schemes(id),
        farmer_name TEXT,
        district TEXT,
        state TEXT,
        benefit_received NUMERIC(10,2),
        story TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Kisan Vehicles ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS kisan_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id),
        vehicle_type TEXT NOT NULL,
        model_name TEXT,
        capacity_tons NUMERIC(6,2),
        rate_per_km NUMERIC(6,2),
        rate_per_hour NUMERIC(8,2),
        district TEXT,
        state TEXT,
        owner_name TEXT,
        is_available BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        rating NUMERIC(3,2) DEFAULT 0,
        total_trips INTEGER DEFAULT 0,
        photos TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES kisan_vehicles(id),
        user_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES kisan_vehicles(id),
        date DATE NOT NULL,
        is_available BOOLEAN DEFAULT true,
        booked_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Input Suppliers ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS input_suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        business_name TEXT NOT NULL,
        owner_name TEXT,
        district TEXT,
        state TEXT,
        categories TEXT[] DEFAULT '{}',
        brands TEXT[] DEFAULT '{}',
        delivery_radius_km INTEGER DEFAULT 25,
        gst_number TEXT,
        license_number TEXT,
        rating NUMERIC(3,2) DEFAULT 0,
        is_verified BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS input_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES input_suppliers(id),
        name TEXT NOT NULL,
        category TEXT,
        brand TEXT,
        price NUMERIC(10,2),
        unit TEXT DEFAULT 'kg',
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS input_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES input_suppliers(id),
        buyer_id UUID REFERENCES users(id),
        total_amount NUMERIC(10,2),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS input_supplier_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES input_suppliers(id),
        user_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Livestock Listings ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS livestock_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID REFERENCES users(id),
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        breed TEXT,
        age_months INTEGER,
        weight_kg NUMERIC(8,2),
        price NUMERIC(10,2),
        district TEXT,
        state TEXT,
        vaccination_status TEXT,
        health_certificate BOOLEAN DEFAULT false,
        photos TEXT[] DEFAULT '{}',
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Aqua Farms (for Galaxy) ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_farms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        farm_name TEXT NOT NULL,
        owner_name TEXT,
        district TEXT,
        state TEXT,
        total_area_acres NUMERIC(10,2) DEFAULT 0,
        culture_type TEXT,
        species TEXT[] DEFAULT '{}',
        annual_production_mt NUMERIC(10,2) DEFAULT 0,
        certifications TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_culture_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID REFERENCES aqua_farms(id),
        unit_type TEXT,
        area_acres NUMERIC(8,2),
        species TEXT,
        stocking_density INTEGER,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_harvests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID REFERENCES aqua_farms(id),
        species TEXT,
        quantity_kg NUMERIC(10,2),
        harvest_date DATE,
        price_per_kg NUMERIC(8,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_water_quality (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID REFERENCES aqua_farms(id),
        ph NUMERIC(4,2),
        dissolved_oxygen NUMERIC(5,2),
        temperature NUMERIC(5,2),
        ammonia NUMERIC(6,3),
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Seed Data ────────────────────────────────────────────────

    // Seed mandis
    await client.query(`
      INSERT INTO mandis (mandi_name, district, state, commodities_traded, avg_daily_arrivals_mt, operating_hours) VALUES
      ('Guntur Mirchi Yard', 'Guntur', 'Andhra Pradesh', ARRAY['Chilli','Cotton','Turmeric'], 450, '6AM-6PM'),
      ('Kurnool Market', 'Kurnool', 'Andhra Pradesh', ARRAY['Groundnut','Sunflower','Paddy'], 320, '6AM-5PM'),
      ('Rajahmundry Mandi', 'East Godavari', 'Andhra Pradesh', ARRAY['Paddy','Coconut','Banana'], 280, '5AM-4PM'),
      ('Vijayawada Market', 'Krishna', 'Andhra Pradesh', ARRAY['Rice','Vegetables','Fruits'], 520, '5AM-7PM'),
      ('Tirupati Mandi', 'Tirupati', 'Andhra Pradesh', ARRAY['Groundnut','Pulses','Vegetables'], 180, '6AM-5PM'),
      ('Ongole Market', 'Prakasam', 'Andhra Pradesh', ARRAY['Chilli','Tobacco','Cotton'], 220, '6AM-6PM'),
      ('Eluru Market', 'West Godavari', 'Andhra Pradesh', ARRAY['Paddy','Oil Palm','Coconut'], 350, '5AM-5PM'),
      ('Karimnagar Mandi', 'Karimnagar', 'Telangana', ARRAY['Rice','Maize','Cotton'], 300, '6AM-6PM'),
      ('Warangal Market', 'Warangal', 'Telangana', ARRAY['Paddy','Turmeric','Maize'], 270, '6AM-5PM'),
      ('Nizamabad Mandi', 'Nizamabad', 'Telangana', ARRAY['Turmeric','Soybean','Paddy'], 310, '5AM-6PM')
      ON CONFLICT DO NOTHING
    `);

    // Seed government schemes
    await client.query(`
      INSERT INTO government_schemes (scheme_name, department, category, state_or_central, target_beneficiary, benefit_type, max_benefit_amount, application_count, success_rate) VALUES
      ('PM-KISAN', 'Agriculture Ministry', 'Income Support', 'central', 'Small & Marginal Farmers', 'Direct Benefit Transfer', 6000, 125000, 92.5),
      ('PMFBY', 'Agriculture Ministry', 'Crop Insurance', 'central', 'All Farmers', 'Insurance Premium Subsidy', 200000, 85000, 78.3),
      ('KCC', 'Banking', 'Credit', 'central', 'All Farmers', 'Low Interest Crop Loan', 300000, 150000, 88.0),
      ('PMMSY', 'Fisheries Dept', 'Aquaculture', 'central', 'Fish Farmers', 'Infrastructure Subsidy', 2500000, 12000, 65.0),
      ('e-NAM', 'Agriculture Ministry', 'Market Access', 'central', 'FPOs & Traders', 'Platform Access', 0, 45000, 95.0),
      ('RKVY', 'Agriculture Ministry', 'Infrastructure', 'central', 'State Governments', 'Project Funding', 5000000, 8000, 70.0),
      ('PM-AASHA', 'Agriculture Ministry', 'Price Support', 'central', 'All Farmers', 'MSP Procurement', 500000, 35000, 82.0),
      ('NMSA', 'Agriculture Ministry', 'Sustainable Agriculture', 'central', 'All Farmers', 'Equipment Subsidy', 100000, 28000, 75.0),
      ('SHC Scheme', 'Agriculture Ministry', 'Soil Health', 'central', 'All Farmers', 'Free Soil Testing', 0, 200000, 98.0),
      ('AP YSR Rythu Bharosa', 'AP Agriculture Dept', 'Income Support', 'state', 'AP Farmers', 'Direct Benefit Transfer', 13500, 55000, 90.0)
      ON CONFLICT DO NOTHING
    `);

    // Seed training courses
    await client.query(`
      INSERT INTO training_courses (title, category, language, duration_hours, instructor_name, institution, certification_offered, is_free, enrollment_count, rating) VALUES
      ('Organic Farming Basics', 'Organic', 'English', 12, 'Dr. Ravi Kumar', 'ICAR-IARI', true, true, 4500, 4.5),
      ('Drip Irrigation Setup', 'Irrigation', 'Telugu', 8, 'Srinivas Reddy', 'ANGRAU', true, true, 3200, 4.3),
      ('Aquaculture Management', 'Aquaculture', 'English', 20, 'Dr. Lakshmi Narayana', 'ICAR-CIFA', true, true, 2800, 4.7),
      ('FPO Formation & Management', 'Business', 'Hindi', 15, 'Amit Sharma', 'NABARD', true, true, 5100, 4.4),
      ('Post-Harvest Technology', 'Processing', 'English', 10, 'Dr. Priya Singh', 'CIPHET', true, true, 2100, 4.2),
      ('Integrated Pest Management', 'Crop Protection', 'Telugu', 6, 'K. Venkatesh', 'MANAGE', false, true, 3800, 4.6),
      ('Dairy Farming Essentials', 'Livestock', 'Hindi', 14, 'Dr. Mohan Das', 'NDRI', true, true, 6200, 4.5),
      ('Mushroom Cultivation', 'Horticulture', 'English', 8, 'Sunitha Rani', 'DMR', true, true, 4100, 4.3),
      ('Vermicomposting', 'Organic', 'Telugu', 4, 'Raju Garu', 'KVK Guntur', false, true, 7500, 4.8),
      ('Export Quality Standards', 'Export', 'English', 16, 'Rajesh Exports', 'APEDA', true, false, 1500, 4.1)
      ON CONFLICT DO NOTHING
    `);

    // Seed exporters
    await client.query(`
      INSERT INTO exporters (company_name, owner_name, state, district, commodities, export_countries, annual_export_volume_mt, apeda_registered, rating, established_year, certifications) VALUES
      ('Coastal Exports Ltd', 'K. Ramesh', 'Andhra Pradesh', 'Visakhapatnam', ARRAY['Shrimp','Fish','Crab'], ARRAY['USA','Japan','EU','China'], 5000, true, 4.5, 2005, ARRAY['BAP','ASC','HACCP']),
      ('AP Agri Exports', 'Venkat Rao', 'Andhra Pradesh', 'Guntur', ARRAY['Chilli','Turmeric','Rice'], ARRAY['Malaysia','Singapore','UAE','UK'], 8000, true, 4.3, 2010, ARRAY['ISO 22000','FSSAI']),
      ('Deccan Fresh Exports', 'Suresh Kumar', 'Telangana', 'Hyderabad', ARRAY['Mango','Grape','Pomegranate'], ARRAY['EU','UK','UAE','Saudi Arabia'], 3500, true, 4.6, 2008, ARRAY['GlobalGAP','Organic']),
      ('Krishna Valley Traders', 'Lakshmi Devi', 'Andhra Pradesh', 'Krishna', ARRAY['Rice','Coconut','Banana'], ARRAY['Middle East','Africa','Southeast Asia'], 12000, true, 4.2, 2000, ARRAY['ISO 9001','BRC']),
      ('Godavari Seafoods', 'Prasad Reddy', 'Andhra Pradesh', 'East Godavari', ARRAY['Shrimp','Prawn','Fish Meal'], ARRAY['Japan','USA','EU','Australia'], 7500, true, 4.7, 2003, ARRAY['BAP','EU Approved','HACCP'])
      ON CONFLICT DO NOTHING
    `);

    // Seed kisan vehicles
    await client.query(`
      INSERT INTO kisan_vehicles (vehicle_type, model_name, capacity_tons, rate_per_km, rate_per_hour, district, state, owner_name, rating, total_trips) VALUES
      ('Tractor', 'Mahindra 575 DI', 2.5, 15, 500, 'Guntur', 'Andhra Pradesh', 'Raju', 4.5, 230),
      ('Tractor', 'Swaraj 744', 3.0, 18, 600, 'Krishna', 'Andhra Pradesh', 'Venkat', 4.3, 180),
      ('Harvester', 'John Deere W70', 8.0, 45, 2500, 'East Godavari', 'Andhra Pradesh', 'Prasad', 4.7, 95),
      ('Transport Truck', 'Tata 407', 4.0, 12, 800, 'Kurnool', 'Andhra Pradesh', 'Suresh', 4.2, 320),
      ('Mini Truck', 'Mahindra Bolero Pickup', 1.5, 10, 400, 'West Godavari', 'Andhra Pradesh', 'Krishna', 4.4, 450),
      ('Rotavator', 'Shaktiman Rotavator', 0, 0, 700, 'Prakasam', 'Andhra Pradesh', 'Ramesh', 4.6, 150),
      ('Sprayer', 'Drone Sprayer DJI T30', 0, 0, 1500, 'Guntur', 'Andhra Pradesh', 'Tech Agri Services', 4.8, 85),
      ('Transport Truck', 'Eicher Pro', 6.0, 14, 1000, 'Warangal', 'Telangana', 'Mahesh', 4.1, 275),
      ('Tractor', 'Sonalika DI-60', 2.8, 16, 550, 'Karimnagar', 'Telangana', 'Naresh', 4.4, 200),
      ('Harvester', 'Preet 987', 7.0, 40, 2200, 'Nizamabad', 'Telangana', 'Gopi', 4.5, 110)
      ON CONFLICT DO NOTHING
    `);

    // Seed aqua farms
    await client.query(`
      INSERT INTO aqua_farms (farm_name, owner_name, district, state, total_area_acres, culture_type, species, annual_production_mt, certifications) VALUES
      ('Coastal Aqua Farm', 'K. Raju', 'East Godavari', 'Andhra Pradesh', 25, 'Pond', ARRAY['Vannamei Shrimp','Tiger Prawn'], 180, ARRAY['BAP','MPEDA']),
      ('Krishna Delta Fish', 'P. Venkat', 'Krishna', 'Andhra Pradesh', 40, 'Pond', ARRAY['Rohu','Catla','Pangasius'], 320, ARRAY['FSSAI']),
      ('Godavari Biofloc', 'S. Lakshmi', 'West Godavari', 'Andhra Pradesh', 10, 'Biofloc', ARRAY['Tilapia','Vannamei Shrimp'], 95, ARRAY['Organic']),
      ('Nellore Prawn Hub', 'M. Prasad', 'Nellore', 'Andhra Pradesh', 50, 'Pond', ARRAY['Vannamei Shrimp'], 450, ARRAY['BAP','ASC','EU Approved']),
      ('AP RAS Center', 'Dr. Rao', 'Visakhapatnam', 'Andhra Pradesh', 5, 'RAS', ARRAY['Seabass','Red Snapper'], 60, ARRAY['MPEDA','HACCP']),
      ('Bhimavaram Aquatics', 'T. Suresh', 'West Godavari', 'Andhra Pradesh', 35, 'Pond', ARRAY['Rohu','Catla','Mrigal'], 280, ARRAY['FSSAI']),
      ('Kakinada Marine Farm', 'N. Prasad', 'East Godavari', 'Andhra Pradesh', 15, 'Cage', ARRAY['Seabass','Cobia'], 120, ARRAY['MPEDA','BAP']),
      ('Guntur Fresh Fish', 'K. Ramesh', 'Guntur', 'Andhra Pradesh', 20, 'Pond', ARRAY['Pangasius','Tilapia'], 200, ARRAY['FSSAI'])
      ON CONFLICT DO NOTHING
    `);

    // Seed contract opportunities
    await client.query(`
      INSERT INTO contract_opportunities (title, crop_name, buyer_company, state, district, quantity_required_mt, price_per_kg, contract_duration_months, payment_terms, status) VALUES
      ('Organic Rice Procurement FY26', 'Rice', 'Nature Fresh Foods Ltd', 'Andhra Pradesh', 'Krishna', 500, 42, 12, 'Monthly advance + settlement', 'open'),
      ('Chilli Supply Contract', 'Chilli', 'Guntur Spices Export', 'Andhra Pradesh', 'Guntur', 200, 180, 6, '50% advance, 50% on delivery', 'open'),
      ('Banana Purchase Agreement', 'Banana', 'Fresh Fruits India', 'Andhra Pradesh', 'East Godavari', 1000, 18, 12, 'Weekly payment', 'open'),
      ('Mango Export Contract', 'Mango', 'Deccan Exports Pvt Ltd', 'Andhra Pradesh', 'Krishna', 300, 85, 4, 'Advance + harvest settlement', 'open'),
      ('Groundnut Procurement', 'Groundnut', 'Kurnool Oil Mills', 'Andhra Pradesh', 'Kurnool', 800, 62, 6, 'Spot payment at delivery', 'open'),
      ('Turmeric Bulk Purchase', 'Turmeric', 'Spice Board Consortium', 'Andhra Pradesh', 'Guntur', 150, 95, 8, 'Escrow payment', 'open'),
      ('Coconut Supply for Oil', 'Coconut', 'AP Coconut Oil Corp', 'Andhra Pradesh', 'West Godavari', 2000, 12, 12, 'Bi-weekly payment', 'open'),
      ('Premium Paddy (1121 Basmati)', 'Paddy', 'India Gate Foods', 'Telangana', 'Nizamabad', 400, 38, 6, 'MSP + premium on quality', 'open')
      ON CONFLICT DO NOTHING
    `);

    // Seed input suppliers
    await client.query(`
      INSERT INTO input_suppliers (business_name, owner_name, district, state, categories, brands, delivery_radius_km, rating) VALUES
      ('KrishiMart Guntur', 'Srinivas', 'Guntur', 'Andhra Pradesh', ARRAY['Seeds','Fertilizers','Pesticides'], ARRAY['Bayer','UPL','Syngenta','IFFCO'], 30, 4.5),
      ('Agri Solutions Krishna', 'Venkat Rao', 'Krishna', 'Andhra Pradesh', ARRAY['Seeds','Bio-fertilizers','Growth Promoters'], ARRAY['Mahyco','Kaveri Seeds','Rallis'], 25, 4.3),
      ('Farm Inputs Hub', 'Prasad Reddy', 'East Godavari', 'Andhra Pradesh', ARRAY['Fertilizers','Pesticides','Drip Systems'], ARRAY['Coromandel','PI Industries','Jain Irrigation'], 40, 4.6),
      ('Seed World Kurnool', 'Raju Garu', 'Kurnool', 'Andhra Pradesh', ARRAY['Seeds','Organic Manure'], ARRAY['Nuziveedu','Advanta','National Seeds'], 35, 4.2),
      ('Green Agri Store', 'Lakshmi', 'West Godavari', 'Andhra Pradesh', ARRAY['Seeds','Fertilizers','Farm Tools'], ARRAY['IFFCO','RCF','Tata Rallis','Dhanuka'], 20, 4.4),
      ('Telangana Agri Mart', 'Ramesh Kumar', 'Warangal', 'Telangana', ARRAY['Seeds','Pesticides','Micro-nutrients'], ARRAY['Crystal','Insecticides India','Sumitomo'], 30, 4.1),
      ('Nizam Seeds & Inputs', 'Ahmed', 'Nizamabad', 'Telangana', ARRAY['Seeds','Fertilizers','Bio-agents'], ARRAY['Zuari','FACT','Bio-Prime'], 25, 4.5)
      ON CONFLICT DO NOTHING
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_contract_opp_status ON contract_opportunities(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_exporters_active ON exporters(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_mandis_active ON mandis(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_mandi_prices_date ON mandi_prices(mandi_id, price_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_training_published ON training_courses(is_published)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_schemes_active ON government_schemes(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_kisan_vehicles_active ON kisan_vehicles(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_input_suppliers_verified ON input_suppliers(is_verified)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_livestock_status ON livestock_listings(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_farms_active ON aqua_farms(is_active)');

    await client.query('COMMIT');
    console.log('✅ Migration V21 (Galaxy tables) completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration V21 failed:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV21Galaxy };
