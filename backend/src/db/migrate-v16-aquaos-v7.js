require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V16_AQUAOS_V7 = `
-- ============================================================
-- AquaOS V7 Migration: Enhanced Logistics, Training, ODR,
-- Verified Reviews, Trade Credit, Route Optimization
-- ============================================================

-- 1. Verified Reviews & Performance Feedback
CREATE TABLE IF NOT EXISTS aqua_seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  freshness_rating INTEGER CHECK (freshness_rating BETWEEN 1 AND 5),
  packaging_rating INTEGER CHECK (packaging_rating BETWEEN 1 AND 5),
  delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
  review_text TEXT,
  images TEXT[],
  verified_purchase BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  response_text TEXT,
  response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Seller Performance Metrics
CREATE TABLE IF NOT EXISTS aqua_seller_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  on_time_delivery_pct DECIMAL DEFAULT 100.0,
  order_accuracy_pct DECIMAL DEFAULT 100.0,
  avg_rating DECIMAL DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  quality_score DECIMAL DEFAULT 0.0,
  response_time_hours DECIMAL,
  repeat_buyer_pct DECIMAL DEFAULT 0.0,
  total_volume_kg DECIMAL DEFAULT 0.0,
  badge TEXT CHECK (badge IN ('new','bronze','silver','gold','platinum')) DEFAULT 'new',
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Logistics Providers Directory
CREATE TABLE IF NOT EXISTS aqua_logistics_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT CHECK (provider_type IN ('integrated','ice_supplier','reefer_transport','cold_storage','last_mile','pickup_service')),
  description TEXT,
  services TEXT[],
  vehicle_types TEXT[],
  coverage_states TEXT[],
  coverage_districts TEXT[],
  min_order_kg DECIMAL,
  max_capacity_kg DECIMAL,
  price_per_km DECIMAL,
  price_per_kg DECIMAL,
  cold_chain_certified BOOLEAN DEFAULT false,
  temperature_range TEXT,
  iot_enabled BOOLEAN DEFAULT false,
  gps_tracking BOOLEAN DEFAULT true,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  rating DECIMAL,
  total_deliveries INTEGER DEFAULT 0,
  on_time_pct DECIMAL DEFAULT 100.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Logistics Bookings
CREATE TABLE IF NOT EXISTS aqua_logistics_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  listing_id UUID,
  provider_id UUID REFERENCES aqua_logistics_providers(id),
  booked_by UUID REFERENCES users(id),
  pickup_location TEXT,
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  delivery_location TEXT,
  delivery_lat DECIMAL,
  delivery_lng DECIMAL,
  distance_km DECIMAL,
  estimated_duration_hours DECIMAL,
  optimized_route JSONB,
  vehicle_type TEXT,
  temperature_required DECIMAL DEFAULT 0,
  ice_required_kg DECIMAL DEFAULT 0,
  cargo_weight_kg DECIMAL,
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  status TEXT CHECK (status IN ('requested','confirmed','pickup_scheduled','in_transit','delivered','cancelled','failed')) DEFAULT 'requested',
  pickup_time TIMESTAMP,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  temperature_logs JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. IoT Temperature Monitoring
CREATE TABLE IF NOT EXISTS aqua_temp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES aqua_logistics_bookings(id) ON DELETE CASCADE,
  batch_code TEXT,
  sensor_id TEXT,
  temperature_c DECIMAL NOT NULL,
  humidity_pct DECIMAL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  alert_triggered BOOLEAN DEFAULT false,
  alert_type TEXT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 6. Online Dispute Resolution (ODR)
CREATE TABLE IF NOT EXISTS aqua_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  listing_id UUID,
  filed_by UUID REFERENCES users(id),
  against_user UUID REFERENCES users(id),
  dispute_type TEXT CHECK (dispute_type IN ('quality','quantity','delivery_delay','payment','fraud','damaged','wrong_item','other')),
  severity TEXT CHECK (severity IN ('low','medium','high','critical')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_images TEXT[],
  evidence_documents TEXT[],
  resolution_stage TEXT CHECK (resolution_stage IN ('direct_communication','platform_mediation','arbitration','resolved','closed')) DEFAULT 'direct_communication',
  resolution_notes TEXT,
  resolved_by UUID,
  resolution_outcome TEXT CHECK (resolution_outcome IN ('refund_full','refund_partial','replacement','credit_note','dismissed','mutual_agreement')),
  refund_amount DECIMAL,
  escalated_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Dispute Messages (ODR Communication)
CREATE TABLE IF NOT EXISTS aqua_dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES aqua_disputes(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  attachments TEXT[],
  is_system_message BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Trade Credit & Net Terms
CREATE TABLE IF NOT EXISTS aqua_trade_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_limit DECIMAL DEFAULT 0,
  available_credit DECIMAL DEFAULT 0,
  net_terms_days INTEGER DEFAULT 30,
  credit_score DECIMAL,
  risk_level TEXT CHECK (risk_level IN ('low','medium','high')) DEFAULT 'medium',
  kyc_verified BOOLEAN DEFAULT false,
  gst_verified BOOLEAN DEFAULT false,
  bank_verified BOOLEAN DEFAULT false,
  trade_references TEXT[],
  approved_by UUID,
  approved_at TIMESTAMP,
  status TEXT CHECK (status IN ('pending','active','suspended','revoked')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Credit Invoices (Net Terms Tracking)
CREATE TABLE IF NOT EXISTS aqua_credit_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID REFERENCES aqua_trade_credit(id),
  order_id UUID,
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  invoice_number TEXT UNIQUE,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  paid_amount DECIMAL DEFAULT 0,
  status TEXT CHECK (status IN ('pending','partially_paid','paid','overdue','written_off')) DEFAULT 'pending',
  payment_reference TEXT,
  paid_at TIMESTAMP,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Training Curriculum Library
CREATE TABLE IF NOT EXISTS aqua_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('pond_preparation','seed_selection','feed_management','water_quality','health_biosecurity','harvest_handling','business_planning','government_schemes','technology','marketing')),
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
  format TEXT CHECK (format IN ('video','article','infographic','quiz','guide','interactive')) DEFAULT 'article',
  language TEXT DEFAULT 'en',
  duration_minutes INTEGER,
  content_url TEXT,
  thumbnail_url TEXT,
  content_body TEXT,
  key_learnings TEXT[],
  prerequisites TEXT[],
  institution TEXT,
  instructor TEXT,
  offline_available BOOLEAN DEFAULT true,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  avg_rating DECIMAL DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Training Progress
CREATE TABLE IF NOT EXISTS aqua_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES aqua_training_modules(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started','in_progress','completed')) DEFAULT 'not_started',
  progress_pct INTEGER DEFAULT 0,
  score INTEGER,
  certificate_url TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 12. VMS (Vessel Monitoring) & Fish Origin Tracking
CREATE TABLE IF NOT EXISTS aqua_vessel_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_name TEXT,
  vessel_registration TEXT UNIQUE,
  owner_id UUID REFERENCES users(id),
  vessel_type TEXT CHECK (vessel_type IN ('trawler','gill_netter','seiner','liner','country_craft')),
  home_port TEXT,
  state TEXT,
  gps_device_id TEXT,
  last_lat DECIMAL,
  last_lng DECIMAL,
  last_speed_knots DECIMAL,
  fishing_zone TEXT,
  iuu_compliant BOOLEAN DEFAULT true,
  license_number TEXT,
  license_expiry DATE,
  active BOOLEAN DEFAULT true,
  last_ping_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Seed Data: Logistics Providers
-- ============================================================
INSERT INTO aqua_logistics_providers (name, provider_type, description, services, vehicle_types, coverage_states, min_order_kg, price_per_km, cold_chain_certified, iot_enabled, city, state, rating, active)
VALUES
('Snowman Logistics Ltd.', 'integrated', 'India''s leading cold chain logistics with nationwide temperature-controlled warehousing and last-mile delivery', ARRAY['cold storage','reefer transport','last mile','warehouse'], ARRAY['reefer truck','insulated van','cold container'], ARRAY['All India'], 100, 18.5, true, true, 'Mumbai', 'Maharashtra', 4.7, true),
('ColdEX Logistics Pvt. Ltd.', 'integrated', 'Pan-India cold chain solutions for perishable seafood and aquaculture products', ARRAY['cold chain transport','temp monitoring','pickup service'], ARRAY['reefer truck','insulated van'], ARRAY['All India'], 50, 16.0, true, true, 'Bangalore', 'Karnataka', 4.3, true),
('Gati Ltd.', 'integrated', 'Express cold chain logistics for seafood with real-time GPS tracking', ARRAY['express delivery','cold chain','GPS tracking','door-to-door'], ARRAY['reefer truck','express van','mini truck'], ARRAY['All India'], 25, 15.0, true, true, 'Hyderabad', 'Telangana', 4.5, true),
('Aegis Logistics Ltd.', 'cold_storage', 'Large-scale cold storage and distribution for seafood at major port cities', ARRAY['cold storage','distribution','port handling'], ARRAY['container','reefer truck'], ARRAY['Maharashtra','Gujarat','Tamil Nadu','Andhra Pradesh'], 500, 20.0, true, true, 'Mumbai', 'Maharashtra', 4.4, true),
('Rinac India Limited', 'cold_storage', 'Specializes in building fisheries cold chain infrastructure including IQF and blast freezers', ARRAY['cold storage construction','IQF systems','blast freezers','turnkey projects'], ARRAY[]::TEXT[], ARRAY['All India'], 1000, 0, true, false, 'Chennai', 'Tamil Nadu', 4.3, true),
('Frick India', 'cold_storage', 'Industrial refrigeration solutions for cold storage and aquaculture processing facilities', ARRAY['refrigeration systems','ammonia plants','cold rooms','compressors'], ARRAY[]::TEXT[], ARRAY['All India'], 500, 0, true, false, 'Mumbai', 'Maharashtra', 4.4, true),
('Tessol', 'reefer_transport', 'Innovative cold chain shipping using phase-change materials and IoT monitoring for seafood', ARRAY['PCM containers','IoT temperature monitoring','sustainable cold chain'], ARRAY['insulated container','PCM box','mini reefer'], ARRAY['Maharashtra','Karnataka','Tamil Nadu','Andhra Pradesh','Telangana'], 10, 12.0, true, true, 'Mumbai', 'Maharashtra', 4.4, true),
('AquaCool Ice Suppliers', 'ice_supplier', 'Commercial ice manufacturing and supply for seafood handling and transport in coastal AP and Telangana', ARRAY['block ice','flake ice','slurry ice','ice delivery'], ARRAY['ice truck','insulated pickup'], ARRAY['Andhra Pradesh','Telangana'], 50, 8.0, false, false, 'Visakhapatnam', 'Andhra Pradesh', 4.0, true),
('FreshCatch Logistics', 'pickup_service', 'Farm-gate fish pickup and first-mile cold chain service for aquaculture farmers in AP', ARRAY['farm pickup','first mile delivery','icing service','sorting'], ARRAY['insulated pickup','mini truck'], ARRAY['Andhra Pradesh','Telangana','Tamil Nadu'], 20, 10.0, true, false, 'Vijayawada', 'Andhra Pradesh', 4.1, true),
('SeaLink Cold Chain', 'last_mile', 'Last-mile cold chain delivery for seafood to restaurants, retailers and processing units', ARRAY['last mile delivery','restaurant supply','retail distribution'], ARRAY['insulated van','two-wheeler box'], ARRAY['Andhra Pradesh','Telangana','Karnataka','Tamil Nadu'], 5, 14.0, true, true, 'Hyderabad', 'Telangana', 4.2, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed Data: Training Modules
-- ============================================================
INSERT INTO aqua_training_modules (title, category, difficulty, format, language, duration_minutes, content_body, key_learnings, institution, offline_available, tags)
VALUES
('Pond Site Selection & Design', 'pond_preparation', 'beginner', 'guide', 'en', 45, 'Comprehensive guide to selecting and designing aquaculture ponds including soil testing, water source evaluation, pond layout and embankment construction.', ARRAY['Site assessment criteria','Soil suitability testing','Pond dimensions and depth','Water inlet/outlet design','Embankment construction'], 'ICAR-CIFA', true, ARRAY['pond','construction','beginner','site selection']),
('Water Quality Management Essentials', 'water_quality', 'beginner', 'video', 'en', 30, 'Learn to monitor and manage critical water parameters including pH, dissolved oxygen, ammonia, alkalinity and their impact on fish health and growth.', ARRAY['pH management','Dissolved oxygen monitoring','Ammonia control','Alkalinity maintenance','Testing equipment usage'], 'ICAR-CIFA', true, ARRAY['water quality','pH','dissolved oxygen','monitoring']),
('Seed Selection & Stocking Practices', 'seed_selection', 'beginner', 'guide', 'en', 35, 'Guide to selecting quality fish seed, determining stocking density, acclimatization procedures and nursery management for common species.', ARRAY['Seed quality indicators','Stocking density calculation','Acclimatization techniques','Species-specific practices','Nursery management'], 'ASCI', true, ARRAY['seed','stocking','nursery','fingerlings']),
('Feed Management & FCR Optimization', 'feed_management', 'intermediate', 'video', 'en', 40, 'Advanced techniques for feed management including feeding schedules, check tray usage, FCR calculation and cost optimization strategies.', ARRAY['Feeding schedule design','Check tray monitoring','FCR calculation','Feed cost optimization','Supplementary feeding'], 'ICAR-CIFA', true, ARRAY['feed','FCR','nutrition','cost optimization']),
('Fish Disease Prevention & Biosecurity', 'health_biosecurity', 'intermediate', 'guide', 'en', 50, 'Comprehensive disease prevention protocols including biosecurity measures, common disease identification, treatment options and responsible antibiotic use.', ARRAY['Biosecurity protocols','Common disease symptoms','Treatment options','Responsible medicine use','Quarantine procedures'], 'ICAR-CIFA', true, ARRAY['disease','biosecurity','health','prevention']),
('Harvesting Techniques & Post-Harvest Handling', 'harvest_handling', 'beginner', 'video', 'en', 35, 'Best practices for efficient harvesting, sorting, grading and immediate chilling to maintain fish quality for market.', ARRAY['Harvest planning','Netting techniques','Sorting and grading','Immediate chilling methods','Quality preservation'], 'ASCI', true, ARRAY['harvest','post-harvest','quality','handling']),
('PMMSY Scheme Application Guide', 'government_schemes', 'beginner', 'guide', 'en', 25, 'Step-by-step guide to applying for PMMSY subsidies including eligibility criteria, DPR preparation, document requirements and application tracking.', ARRAY['Eligibility criteria','DPR preparation','Document checklist','Application process','Subsidy calculation'], 'DoF India', true, ARRAY['PMMSY','subsidy','government','scheme']),
('Biofloc Technology for Beginners', 'technology', 'intermediate', 'video', 'en', 55, 'Introduction to biofloc technology including system setup, microbial management, carbon-nitrogen ratio maintenance and water recycling.', ARRAY['Biofloc principles','C:N ratio management','Microbial community','System setup','Water recycling'], 'ICAR-CIFA', true, ARRAY['biofloc','technology','intensive','sustainable']),
('Market Linkage & Direct Selling', 'marketing', 'intermediate', 'guide', 'en', 30, 'Strategies for direct market access including buyer identification, pricing strategies, quality presentation and building long-term buyer relationships.', ARRAY['Buyer identification','Pricing strategies','Quality presentation','Relationship building','Platform usage'], 'ASCI', true, ARRAY['marketing','selling','pricing','market linkage']),
('RAS Design & Operations', 'technology', 'advanced', 'video', 'en', 60, 'Complete guide to Recirculating Aquaculture Systems including design principles, filtration systems, monitoring and operational best practices.', ARRAY['RAS design principles','Biofilter management','Mechanical filtration','Water monitoring automation','Stocking in RAS'], 'ICAR-CIFA', true, ARRAY['RAS','recirculating','technology','advanced']),
('Good Aquaculture Practices (GAqP)', 'health_biosecurity', 'beginner', 'guide', 'en', 40, 'Overview of Good Aquaculture Practices aligned with NACA and FAO guidelines for sustainable and responsible fish farming.', ARRAY['GAqP principles','Record keeping','Environmental responsibility','Food safety','Traceability requirements'], 'NACA/FAO', true, ARRAY['GAqP','BMPs','sustainability','standards']),
('మత్స్య సంపద: చెరువు నిర్వహణ', 'pond_preparation', 'beginner', 'video', 'te', 30, 'తెలుగులో చెరువు నిర్వహణ మార్గదర్శకం - నీటి నాణ్యత, ఆహారం, వ్యాధి నివారణ', ARRAY['చెరువు తయారీ','నీటి నాణ్యత','ఆహార నిర్వహణ','వ్యాధి నివారణ'], 'ICAR-CIFA', true, ARRAY['pond','telugu','beginner']),
('मत्स्य पालन: तालाब प्रबंधन', 'pond_preparation', 'beginner', 'video', 'hi', 30, 'हिंदी में तालाब प्रबंधन गाइड - पानी की गुणवत्ता, आहार, रोग निवारण', ARRAY['तालाब तैयारी','पानी की गुणवत्ता','आहार प्रबंधन','रोग निवारण'], 'ICAR-CIFA', true, ARRAY['pond','hindi','beginner']),
('குளம் மேலாண்மை அடிப்படைகள்', 'pond_preparation', 'beginner', 'video', 'ta', 30, 'தமிழில் குளம் மேலாண்மை வழிகாட்டி - நீர் தரம், தீவனம், நோய் தடுப்பு', ARRAY['குளம் தயாரிப்பு','நீர் தரம்','தீவன மேலாண்மை','நோய் தடுப்பு'], 'ICAR-CIFA', true, ARRAY['pond','tamil','beginner'])
ON CONFLICT DO NOTHING;
`;

async function migrateV16AquaOSV7() {
  const client = await pool.connect();
  try {
    await client.query(MIGRATION_V16_AQUAOS_V7);
    console.log('[migrate-v16] AquaOS V7 tables applied');
  } catch (err) {
    console.error('[migrate-v16] Error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV16AquaOSV7 };
