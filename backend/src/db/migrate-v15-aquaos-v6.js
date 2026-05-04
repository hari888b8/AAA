require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V15_AQUAOS_V6 = `
-- ============================================================
-- AquaOS V6 Migration: Marketplace, Logistics, Traceability, PMMSY
-- ============================================================

-- 1. Buyer Profiles
CREATE TABLE IF NOT EXISTS aqua_buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  segment TEXT CHECK (segment IN ('wholesaler','restaurant','exporter','processor')),
  gst_number TEXT,
  fssai_license TEXT,
  mpeda_registration TEXT,
  business_address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  annual_volume_kg DECIMAL,
  preferred_species TEXT[],
  preferred_sizes TEXT[],
  credit_terms TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Fish Marketplace Listings
CREATE TABLE IF NOT EXISTS aqua_fish_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  species TEXT,
  variety TEXT,
  quantity_kg DECIMAL,
  available_quantity_kg DECIMAL,
  size_category TEXT,
  quality_grade TEXT CHECK (quality_grade IN ('A+','A','B','C')),
  listing_type TEXT CHECK (listing_type IN ('fixed_price','auction','rfq')),
  price_per_kg DECIMAL,
  min_bid_price DECIMAL,
  auction_end_time TIMESTAMP,
  harvest_date DATE,
  harvest_pond_id UUID,
  location TEXT,
  district TEXT,
  state TEXT,
  description TEXT,
  images TEXT[],
  status TEXT CHECK (status IN ('active','sold','expired','cancelled')) DEFAULT 'active',
  batch_code TEXT,
  cold_chain_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Fish Bids
CREATE TABLE IF NOT EXISTS aqua_fish_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES aqua_fish_listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_price_per_kg DECIMAL,
  quantity_kg DECIMAL,
  total_amount DECIMAL,
  bid_type TEXT CHECK (bid_type IN ('incremental','reverse','rfq_response')),
  status TEXT CHECK (status IN ('pending','accepted','rejected','countered','expired')) DEFAULT 'pending',
  notes TEXT,
  counter_price DECIMAL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. BIS Quality Grading Records
CREATE TABLE IF NOT EXISTS aqua_quality_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES aqua_fish_listings(id) ON DELETE CASCADE,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  grade TEXT CHECK (grade IN ('A+','A','B','C')),
  freshness_score INTEGER CHECK (freshness_score BETWEEN 1 AND 10),
  size_uniformity_score INTEGER CHECK (size_uniformity_score BETWEEN 1 AND 10),
  appearance_score INTEGER CHECK (appearance_score BETWEEN 1 AND 10),
  odor_score INTEGER CHECK (odor_score BETWEEN 1 AND 10),
  texture_score INTEGER CHECK (texture_score BETWEEN 1 AND 10),
  temperature_c DECIMAL,
  moisture_pct DECIMAL,
  overall_score DECIMAL,
  bis_standard TEXT,
  notes TEXT,
  graded_at TIMESTAMP DEFAULT NOW()
);

-- 5. Cold Chain Logistics Providers Directory
CREATE TABLE IF NOT EXISTS aqua_logistics_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  company_type TEXT CHECK (company_type IN ('cold_chain','transport','warehouse')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  service_areas TEXT[],
  vehicle_types TEXT[],
  temperature_range TEXT,
  capacity_kg DECIMAL,
  certifications TEXT[],
  rating DECIMAL,
  total_deliveries INTEGER DEFAULT 0,
  city TEXT,
  state TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Cold Chain Booking / Tracking
CREATE TABLE IF NOT EXISTS aqua_logistics_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES aqua_fish_listings(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES aqua_logistics_providers(id) ON DELETE SET NULL,
  booked_by UUID REFERENCES users(id) ON DELETE CASCADE,
  pickup_location TEXT,
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  delivery_location TEXT,
  delivery_lat DECIMAL,
  delivery_lng DECIMAL,
  distance_km DECIMAL,
  estimated_cost DECIMAL,
  vehicle_type TEXT,
  temperature_required_c DECIMAL DEFAULT 4.0,
  status TEXT CHECK (status IN ('requested','confirmed','picked_up','in_transit','delivered','cancelled')) DEFAULT 'requested',
  pickup_time TIMESTAMP,
  delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. IoT Temperature Monitoring Logs
CREATE TABLE IF NOT EXISTS aqua_temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES aqua_logistics_bookings(id) ON DELETE CASCADE,
  temperature_c DECIMAL NOT NULL,
  humidity_pct DECIMAL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  alert_triggered BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 8. Farm-to-Fork Traceability Batches
CREATE TABLE IF NOT EXISTS aqua_trace_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code TEXT UNIQUE NOT NULL,
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES aqua_fish_listings(id) ON DELETE SET NULL,
  species TEXT,
  variety TEXT,
  quantity_kg DECIMAL,
  harvest_date DATE,
  harvest_location TEXT,
  pond_id UUID,
  culture_unit_id UUID,
  feed_used TEXT,
  medicines_used TEXT,
  water_quality_at_harvest JSONB,
  qr_code_url TEXT,
  blockchain_hash TEXT,
  nfdp_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Critical Tracking Events (CTEs)
CREATE TABLE IF NOT EXISTS aqua_trace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES aqua_trace_batches(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('harvest','processing','packaging','cold_storage','transport','delivery','retail')),
  event_description TEXT,
  location TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  temperature_c DECIMAL,
  timestamp TIMESTAMP DEFAULT NOW(),
  key_data_elements JSONB,
  documents TEXT[],
  verified BOOLEAN DEFAULT false
);

-- 10. PMMSY DPR Builder Applications
CREATE TABLE IF NOT EXISTS aqua_pmmsy_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_type TEXT CHECK (project_type IN ('new_pond','ras','cage_culture','biofloc','hatchery','cold_storage','processing_unit')),
  beneficiary_category TEXT CHECK (beneficiary_category IN ('general','sc_st','women')),
  total_project_cost DECIMAL,
  subsidy_pct INTEGER,
  subsidy_amount DECIMAL,
  loan_amount DECIMAL,
  own_contribution DECIMAL,
  bcr DECIMAL,
  irr DECIMAL,
  npv DECIMAL,
  project_location TEXT,
  district TEXT,
  state TEXT,
  land_area_acres DECIMAL,
  expected_production_kg DECIMAL,
  revenue_projection JSONB,
  capital_cost_breakdown JSONB,
  operating_cost_annual JSONB,
  status TEXT CHECK (status IN ('draft','documents_pending','submitted','under_review','approved','rejected')) DEFAULT 'draft',
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. PMMSY Document Uploads
CREATE TABLE IF NOT EXISTS aqua_pmmsy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES aqua_pmmsy_applications(id) ON DELETE CASCADE,
  doc_type TEXT CHECK (doc_type IN ('aadhaar','pan','land_deed','lease_agreement','bank_passbook','caste_certificate','quotations','site_photos','project_report','gst_registration')),
  file_url TEXT,
  file_name TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 12. National Supplier Directory
CREATE TABLE IF NOT EXISTS aqua_national_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  category TEXT CHECK (category IN ('hatchery','feed','equipment','medicine','cold_chain','online_platform')),
  description TEXT,
  specialization TEXT[],
  species_served TEXT[],
  brands TEXT[],
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  pan_india_delivery BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  rating DECIMAL,
  experience_years INTEGER,
  certifications TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Seed Data: National Suppliers (27 entries)
-- ============================================================

INSERT INTO aqua_national_suppliers (name, category, description, specialization, species_served, brands, contact_person, phone, email, website, city, state, pan_india_delivery, verified, featured, rating, experience_years)
VALUES
-- Hatcheries
('Bangla Krishi Khamar', 'hatchery', 'Leading hatchery in West Bengal specializing in IMC, catfish, tilapia and Pangasius seed production', ARRAY['seed production','fingerlings','spawn'], ARRAY['IMC','catfish','tilapia','Pangasius'], ARRAY[]::TEXT[], 'Bangla Krishi Khamar', '', '', '', 'Kolkata', 'West Bengal', false, true, false, 4.2, 10),
('MM Hatcheries', 'hatchery', 'Pioneer in monosex Tilapia and Pangasius seed production in Chhattisgarh with IMC varieties', ARRAY['monosex tilapia','Pangasius seed','IMC seed'], ARRAY['Tilapia','Pangasius','IMC'], ARRAY[]::TEXT[], 'MM Hatcheries', '', '', '', 'Raipur', 'Chhattisgarh', false, true, false, 4.3, 12),
('Anand Krishi Khamar', 'hatchery', 'Reliable hatchery in West Bengal for Pangasius and carp species seeds', ARRAY['Pangasius seed','carp seed','fingerlings'], ARRAY['Pangasius','Rohu','Catla','Mrigal'], ARRAY[]::TEXT[], 'Anand Krishi Khamar', '', '', '', 'Kolkata', 'West Bengal', false, true, false, 4.0, 8),
('Biswas Hatchery', 'hatchery', 'West Bengal hatchery offering variety of seeds and water testing services for aquaculture farms', ARRAY['seed production','water testing','technical support'], ARRAY['IMC','Pangasius','Tilapia','catfish'], ARRAY[]::TEXT[], 'Biswas Hatchery', '', '', '', 'Kolkata', 'West Bengal', false, true, false, 4.1, 9),

-- Feed Manufacturers
('Avanti Feeds Limited', 'feed', 'India''s leading shrimp and fish feed manufacturer with extensive distribution network across Andhra Pradesh', ARRAY['shrimp feed','fish feed','aqua feed'], ARRAY['Vannamei shrimp','fish'], ARRAY['Avanti'], 'Avanti Feeds', '', '', 'https://avantifeeds.com', 'Hyderabad', 'Andhra Pradesh', true, true, true, 4.8, 30),
('CP Aquaculture (India) Pvt Ltd', 'feed', 'Subsidiary of Charoen Pokphand Group providing high-quality aquaculture feed solutions pan-India', ARRAY['shrimp feed','fish feed','hatchery feed'], ARRAY['shrimp','fish'], ARRAY['CP'], 'CP Aquaculture', '', '', 'https://cpindia.com', 'Chennai', 'Tamil Nadu', true, true, true, 4.7, 25),
('Growel Feeds Pvt. Ltd.', 'feed', 'Andhra Pradesh based manufacturer of extruded floating fish feed and shrimp feed', ARRAY['floating fish feed','extruded feed','shrimp feed'], ARRAY['fish','shrimp'], ARRAY['Growel'], 'Growel Feeds', '', '', 'https://growelfeeds.com', 'Vijayawada', 'Andhra Pradesh', true, true, false, 4.5, 20),
('Godrej Agrovet Limited', 'feed', 'Diversified agribusiness company with strong presence in aquafeed manufacturing across India', ARRAY['aquafeed','animal feed','crop protection'], ARRAY['fish','shrimp'], ARRAY['Godrej'], 'Godrej Agrovet', '', '', 'https://godrejagrovet.com', 'Mumbai', 'Maharashtra', true, true, true, 4.6, 35),
('Sreema Group', 'feed', 'West Bengal based premium floating fish feed manufacturer with over 25 years of experience in aquaculture nutrition', ARRAY['floating fish feed','premium feed','aqua nutrition'], ARRAY['IMC','Pangasius','Tilapia'], ARRAY['Sreema'], 'Sreema Group', '', '', '', 'Kolkata', 'West Bengal', true, true, false, 4.4, 25),
('Happy Feeds', 'feed', 'Andhra Pradesh manufacturer of floating pellets for freshwater species with focus on quality nutrition', ARRAY['floating pellets','freshwater feed','fish feed'], ARRAY['freshwater fish','IMC','Pangasius'], ARRAY['Happy Feeds'], 'Happy Feeds', '', '', '', 'Vijayawada', 'Andhra Pradesh', false, true, false, 4.2, 15),

-- Equipment Suppliers
('SRR Aqua Suppliers LLP', 'equipment', 'Hyderabad based supplier of paddle wheel aerators and aquaculture equipment with pan-India delivery', ARRAY['paddle wheel aerators','aquaculture equipment','aeration systems'], ARRAY[]::TEXT[], ARRAY['SRR'], 'SRR Aqua', '', '', '', 'Hyderabad', 'Telangana', true, true, false, 4.3, 10),
('Century Aquaculture Products Pvt. Ltd.', 'equipment', 'Rajkot based manufacturer of submersible and paddle wheel aerators for aquaculture ponds', ARRAY['submersible aerators','paddle wheel aerators','pond equipment'], ARRAY[]::TEXT[], ARRAY['Century'], 'Century Aquaculture', '', '', '', 'Rajkot', 'Gujarat', true, true, false, 4.4, 15),
('Ardis Enviro Solutions', 'equipment', 'Hyderabad based manufacturer and exporter of aerator motors and paddle wheel aerators for aquaculture', ARRAY['aerator motors','paddle wheel aerators','export quality equipment'], ARRAY[]::TEXT[], ARRAY['Ardis'], 'Ardis Enviro', '', '', '', 'Hyderabad', 'Telangana', true, true, false, 4.2, 8),

-- Medicine / Health
('TIL Biosciences', 'medicine', 'Andhra Pradesh based aquaculture healthcare company specializing in probiotics and mineral mixes', ARRAY['probiotics','mineral mixes','aqua healthcare','water treatment'], ARRAY['shrimp','fish'], ARRAY['TIL'], 'TIL Biosciences', '', '', '', 'Vijayawada', 'Andhra Pradesh', true, true, false, 4.3, 12),
('BlueVeta Biolabs', 'medicine', 'Kolkata based provider of farm-ready aquaculture solutions including medicines, probiotics and supplements', ARRAY['medicines','probiotics','supplements','farm solutions'], ARRAY['fish','shrimp'], ARRAY['BlueVeta'], 'BlueVeta Biolabs', '', '', '', 'Kolkata', 'West Bengal', true, true, false, 4.1, 7),
('Keytone Life Sciences', 'medicine', 'Innovative and sustainable aquaculture medicine company offering herbal remedies pan-India', ARRAY['herbal remedies','sustainable medicines','aqua healthcare','organic treatments'], ARRAY['fish','shrimp'], ARRAY['Keytone'], 'Keytone Life Sciences', '', '', '', 'Hyderabad', 'Telangana', true, true, false, 4.2, 10),

-- Online Platforms
('Tradeindia', 'online_platform', 'Leading Indian B2B portal connecting aquaculture suppliers and buyers nationwide', ARRAY['B2B marketplace','supplier directory','trade leads'], ARRAY[]::TEXT[], ARRAY['Tradeindia'], 'Tradeindia', '', '', 'https://tradeindia.com', 'New Delhi', 'Delhi', true, true, true, 4.5, 20),
('Indiamart', 'online_platform', 'India''s largest B2B marketplace for aquaculture products, equipment and services', ARRAY['B2B marketplace','product listings','supplier discovery'], ARRAY[]::TEXT[], ARRAY['Indiamart'], 'Indiamart', '', '', 'https://indiamart.com', 'Noida', 'Uttar Pradesh', true, true, true, 4.6, 25),
('Indohobby', 'online_platform', 'Online platform for aquaculture equipment featuring Resun and Sunsun brands pan-India', ARRAY['online retail','aquaculture equipment','hobby aquaculture'], ARRAY[]::TEXT[], ARRAY['Resun','Sunsun'], 'Indohobby', '', '', 'https://indohobby.com', 'Mumbai', 'Maharashtra', true, true, false, 4.0, 8),
('FeedWale', 'online_platform', 'Online platform for aquaculture medicines and water treatment products with pan-India delivery', ARRAY['medicines','water treatment','online aqua store'], ARRAY['fish','shrimp'], ARRAY['FeedWale'], 'FeedWale', '', '', 'https://feedwale.com', 'Hyderabad', 'Telangana', true, true, false, 4.1, 5),

-- Cold Chain
('Snowman Logistics', 'cold_chain', 'India''s leading cold chain logistics provider with nationwide temperature-controlled warehousing and transport', ARRAY['cold storage','refrigerated transport','warehouse management'], ARRAY[]::TEXT[], ARRAY['Snowman'], 'Snowman Logistics', '', '', 'https://snowman.in', 'Mumbai', 'Maharashtra', true, true, true, 4.7, 20),
('ColdEX Logistics', 'cold_chain', 'Pan-India cold chain solutions provider for perishable goods including seafood and aquaculture products', ARRAY['cold chain transport','temperature monitoring','last mile delivery'], ARRAY[]::TEXT[], ARRAY['ColdEX'], 'ColdEX Logistics', '', '', '', 'Bangalore', 'Karnataka', true, true, false, 4.3, 10),
('Gati KWE', 'cold_chain', 'Express cold chain logistics solutions for seafood and aquaculture products across India', ARRAY['express delivery','cold chain express','supply chain solutions'], ARRAY[]::TEXT[], ARRAY['Gati'], 'Gati KWE', '', '', 'https://gati.com', 'Hyderabad', 'Telangana', true, true, true, 4.5, 30),
('Tessol', 'cold_chain', 'Cold chain technology company providing innovative temperature-controlled transport solutions for aquaculture', ARRAY['cold chain technology','phase change materials','IoT monitoring'], ARRAY[]::TEXT[], ARRAY['Tessol'], 'Tessol', '', '', 'https://tessol.in', 'Mumbai', 'Maharashtra', true, true, false, 4.4, 8),
('Rinac India', 'cold_chain', 'Leading cold chain infrastructure provider offering cold storage and refrigeration solutions for seafood', ARRAY['cold storage infrastructure','refrigeration systems','turnkey solutions'], ARRAY[]::TEXT[], ARRAY['Rinac'], 'Rinac India', '', '', 'https://rinac.com', 'Chennai', 'Tamil Nadu', true, true, false, 4.3, 25),
('Frick India', 'cold_chain', 'Established manufacturer of industrial refrigeration equipment for cold chain and aquaculture storage', ARRAY['refrigeration equipment','industrial cooling','cold storage systems'], ARRAY[]::TEXT[], ARRAY['Frick'], 'Frick India', '', '', 'https://frickindia.com', 'Mumbai', 'Maharashtra', true, true, false, 4.4, 40),
('Blue Star Cold Chain', 'cold_chain', 'Comprehensive cold chain solutions provider with nationwide presence for seafood and aquaculture logistics', ARRAY['cold chain solutions','refrigeration','cold storage','transport'], ARRAY[]::TEXT[], ARRAY['Blue Star'], 'Blue Star Cold Chain', '', '', 'https://bluestarcoldchain.com', 'Mumbai', 'Maharashtra', true, true, true, 4.6, 30)
ON CONFLICT DO NOTHING;
`;

async function migrateV15AquaOSV6() {
  const client = await pool.connect();
  try {
    await client.query(MIGRATION_V15_AQUAOS_V6);
    console.log('[migrate-v15] AquaOS V6 tables applied');
  } catch (err) {
    console.error('[migrate-v15] Error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV15AquaOSV6 };
