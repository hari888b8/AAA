require('dotenv').config();
const { pool } = require('./pool');

async function seed() {
  console.log('🌱 Seeding AgriHub database...');

  // Crop Catalog
  await pool.query(`
    INSERT INTO crop_catalog (name, name_te, name_hi, category, season, avg_yield_per_acre, min_price_reference, icon_emoji, growing_days) VALUES
    ('Rice (Paddy)',       'వరి',          'धान',        'Cereal',    'kharif',   25.0,  2200, '🌾', 120),
    ('Wheat',             'గోధుమ',         'गेहूं',       'Cereal',    'rabi',     20.0,  2100, '🌾', 110),
    ('Tomato',            'టమాట',          'टमाटर',      'Vegetable', 'rabi',    100.0,  1800, '🍅', 70),
    ('Onion',             'ఉల్లి',          'प्याज',       'Vegetable', 'rabi',     80.0,  1600, '🧅', 90),
    ('Cotton',            'పత్తి',          'कपास',       'Fibre',     'kharif',    8.0,  6200, '🏵️', 180),
    ('Groundnut',         'వేరుశెనగ',      'मूंगफली',     'Oilseed',   'kharif',   10.0,  5500, '🥜', 120),
    ('Chilli (Red)',      'మిర్చి',         'मिर्च',       'Spice',     'kharif',   12.0,  8500, '🌶️', 150),
    ('Maize (Corn)',      'మొక్కజొన్న',    'मक्का',       'Cereal',    'kharif',   30.0,  1700, '🌽', 90),
    ('Soybean',           'సోయాబీన్',      'सोयाबीन',    'Oilseed',   'kharif',   10.0,  3800, '🫘', 100),
    ('Sugarcane',         'చెరుకు',        'गन्ना',       'Cash Crop', 'perennial',350.0, 2850, '🎋', 365),
    ('Turmeric',          'పసుపు',         'हल्दी',       'Spice',     'kharif',   25.0,  7000, '🟡', 240),
    ('Banana',            'అరటి',          'केला',        'Fruit',     'perennial',150.0, 1500, '🍌', 330),
    ('Mango',             'మామిడి',        'आम',          'Fruit',     'perennial', 40.0, 4000, '🥭', 365),
    ('Potato',            'బంగాళదుంప',    'आलू',        'Vegetable', 'rabi',     100.0,  1400, '🥔', 90),
    ('Brinjal',           'వంకాయ',        'बैंगन',       'Vegetable', 'kharif',   120.0, 1200, '🍆', 75)
    ON CONFLICT DO NOTHING
  `);

  // Districts
  await pool.query(`
    INSERT INTO districts (name, name_local, state_code, state_name, primary_crops, lat, lng) VALUES
    ('West Godavari',  'పశ్చిమ గోదావరి', 'AP', 'Andhra Pradesh', ARRAY['Rice','Aquaculture','Coconut'],   16.9174, 81.3392),
    ('East Godavari',  'తూర్పు గోదావరి', 'AP', 'Andhra Pradesh', ARRAY['Rice','Aquaculture','Sugarcane'], 17.3850, 82.0060),
    ('Krishna',        'కృష్ణ',           'AP', 'Andhra Pradesh', ARRAY['Rice','Chilli','Cotton'],         16.6100, 80.7214),
    ('Guntur',         'గుంటూరు',         'AP', 'Andhra Pradesh', ARRAY['Chilli','Cotton','Tobacco'],      16.3067, 80.4365),
    ('Kurnool',        'కర్నూలు',         'AP', 'Andhra Pradesh', ARRAY['Groundnut','Sunflower','Jowar'],  15.8281, 78.0373),
    ('Nellore',        'నెల్లూరు',        'AP', 'Andhra Pradesh', ARRAY['Rice','Aquaculture','Groundnut'], 14.4426, 79.9865),
    ('Prakasam',       'ప్రకాశం',         'AP', 'Andhra Pradesh', ARRAY['Tobacco','Cotton','Chilli'],      15.3560, 79.5680),
    ('Srikakulam',     'శ్రీకాకుళం',      'AP', 'Andhra Pradesh', ARRAY['Rice','Aquaculture','Jute'],      18.2949, 83.8972),
    ('Anantapur',      'అనంతపురం',       'AP', 'Andhra Pradesh', ARRAY['Groundnut','Sunflower','Rice'],   14.6819, 77.6006),
    ('Chittoor',       'చిత్తూరు',        'AP', 'Andhra Pradesh', ARRAY['Mango','Groundnut','Sugarcane'],  13.2172, 79.1003),
    ('Visakhapatnam',  'విశాఖపట్నం',     'AP', 'Andhra Pradesh', ARRAY['Rice','Cashew','Coffee'],          17.6868, 83.2185),
    ('Kadapa',         'కడప',             'AP', 'Andhra Pradesh', ARRAY['Groundnut','Sunflower','Pulses'], 14.4673, 78.8242)
    ON CONFLICT DO NOTHING
  `);

  // Seed demo users
  await pool.query(`
    INSERT INTO users (id, phone, name, role, district_id, state_code, is_verified, onboarding_completed) VALUES
    ('00000000-0000-0000-0000-000000000001', '9000000001', 'Raju Reddy',           'farmer',           3, 'AP', true, true),
    ('00000000-0000-0000-0000-000000000002', '9000000002', 'Krishnamurthy FPO',    'fpo',              1, 'AP', true, true),
    ('00000000-0000-0000-0000-000000000003', '9000000003', 'Vikram Traders',       'buyer',            NULL, 'MH', true, true),
    ('00000000-0000-0000-0000-000000000004', '9000000004', 'Sudha Aqua Farm',      'farmer',           6, 'AP', true, true),
    ('00000000-0000-0000-0000-000000000005', '9000000005', 'Admin AgriHub',        'admin',            NULL, '', true, true)
    ON CONFLICT (phone) DO NOTHING
  `);

  // Supply Listings
  await pool.query(`
    INSERT INTO supply_listings (fpo_id, crop_id, district_id, quantity_kg, grade, is_organic, price_per_kg, min_order_kg, collection_center, status, farmer_name, location_label, description) VALUES
    ('00000000-0000-0000-0000-000000000002', 3,  3, 12000,  'A',         false, 22.00, 500,  'Krishna Cold Storage',      'active', 'Raju Reddy',       'Krishna, AP',      'Fresh harvest — NS 585 hybrid variety'),
    ('00000000-0000-0000-0000-000000000002', 4,  NULL, 85000, 'A+',      false, 18.00, 1000, 'Nashik FPC Godown',         'active', 'Nashik Farmers FPC','Nashik, MH',      'Premium grade Nasik Red onion'),
    ('00000000-0000-0000-0000-000000000002', 7,  4,  5000,  'A',         true,  85.00, 100,  'Guntur Spice Centre',       'active', 'Lakshmi Devi',     'Guntur, AP',       'Certified organic Guntur Sannam'),
    ('00000000-0000-0000-0000-000000000002', 6,  5,  30000, 'B',         false, 52.00, 500,  'Kurnool Oilseeds Hub',      'active', 'Kurnool Rythu FPC','Kurnool, AP',      'TMV-2 groundnut, post-harvest'),
    ('00000000-0000-0000-0000-000000000002', 1,  2,  200000,'A+',        true,  32.00, 5000, 'East Godavari Rice Mills',  'active', 'Godavari Coop',    'East Godavari, AP','Sona Masoori premium grade'),
    ('00000000-0000-0000-0000-000000000002', 5,  NULL, 45000,'A',        false, 68.00, 1000, 'Adilabad Agri Warehouse',   'active', 'Pradeep Kumar',    'Adilabad, TS',     'BT Hybrid cotton, new season')
    ON CONFLICT DO NOTHING
  `);

  // Ponds (AquaOS)
  await pool.query(`
    INSERT INTO ponds (farmer_id, pond_code, species, area_acres, stocked_count, stocking_date, survival_pct, avg_weight_g, ph_level, temperature_c, dissolved_o2, status) VALUES
    ('00000000-0000-0000-0000-000000000004', 'P-001', 'Whiteleg Shrimp (L. vannamei)', 1.5, 250000, CURRENT_DATE - 45, 87.0, 18.2, 7.8, 28.5, 6.2, 'active'),
    ('00000000-0000-0000-0000-000000000004', 'P-002', 'Whiteleg Shrimp (L. vannamei)', 2.0, 320000, CURRENT_DATE - 62, 82.0, 24.5, 8.1, 29.1, 5.8, 'active'),
    ('00000000-0000-0000-0000-000000000004', 'P-003', 'Tiger Prawn (P. monodon)',      1.0,  80000, CURRENT_DATE - 78, 91.0, 32.8, 7.6, 27.8, 6.5, 'harvested'),
    ('00000000-0000-0000-0000-000000000004', 'P-004', 'Whiteleg Shrimp (L. vannamei)', 1.8, 280000, CURRENT_DATE - 30, 93.0, 12.1, 7.9, 28.2, 6.3, 'active')
    ON CONFLICT DO NOTHING
  `);

  // Advisories
  await pool.query(`
    INSERT INTO advisories (severity, title, description, species, is_active) VALUES
    ('critical', 'White Spot Disease Alert — West Godavari', 'Report of WSSV in ponds within 5km. Immediately check shrimp for red discoloration and reduce feeding by 30%.', 'Whiteleg Shrimp', true),
    ('high',     'Water Temperature Rising — Expected 31°C', 'Afternoon temperatures expected to exceed safe range. Increase aeration and reduce stocking density if possible.', NULL, true),
    ('medium',   'pH Level Advisory — Check Pond P-002',     'pH approaching upper safe limit (8.3). Consider lime application to stabilize levels.', NULL, true),
    ('low',      'Pond P-003 Ready for Harvest',             'Average weight 32.8g at DOC 78. Market price ₹380/kg. Estimated yield: 2.6 tons. Harvest window: 5 days.', 'Tiger Prawn', true)
    ON CONFLICT DO NOTHING
  `);

  // Properties (FarmerConnect)
  await pool.query(`
    INSERT INTO properties (owner_id, title, property_type, location_label, area, rent_amount, rent_period, furnishing, is_verified, description) VALUES
    ('00000000-0000-0000-0000-000000000001', '2 BHK Semi-Furnished in Gachibowli',    'Apartment',        'Gachibowli, Hyderabad',   '1100 sq ft',   18000, 'month', 'Semi-Furnished',   true, 'Well maintained apartment, near IT corridor'),
    ('00000000-0000-0000-0000-000000000001', '8 Acres Irrigated Farm Land — Krishna', 'Agricultural Land','Vijayawada, AP',           '8 acres',      45000, 'year',  'Bore well',        true, 'Canal water available, bore well, 8 acres contiguous'),
    ('00000000-0000-0000-0000-000000000001', 'Women PG near Hitech City — AC/Meals', 'PG',               'Madhapur, Hyderabad',      'Single sharing', 8500,'month', 'Fully Furnished',  true, 'AC room, meals included, ladies only'),
    ('00000000-0000-0000-0000-000000000001', '3 BHK Independent Villa — Kompally',   'Villa',            'Kompally, Hyderabad',      '2200 sq ft',   35000, 'month', 'Unfurnished',      false,'Ground plus first floor, independent villa'),
    ('00000000-0000-0000-0000-000000000001', '15 Acres Drip-Irrigated Land for Lease','Agricultural Land','Kurnool, AP',              '15 acres',     35000, 'year',  'Drip + Tank',      true, 'Drip irrigation system installed, soil tested')
    ON CONFLICT DO NOTHING
  `);

  // Equipment (KisanConnect)
  await pool.query(`
    INSERT INTO equipment (owner_id, name, equipment_type, hourly_rate, daily_rate, operator_included, location_label, rating, status) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Mahindra 265 DI Tractor',   'Tractor',  350, 2800, true,  'Guntur, AP',   4.6, 'available'),
    ('00000000-0000-0000-0000-000000000001', 'Kubota PRO-68 Harvester',   'Harvester',800, 6500, true,  'Krishna, AP',  4.8, 'available'),
    ('00000000-0000-0000-0000-000000000001', 'Power Spray Pump (16L)',     'Sprayer',   50,  400, false, 'Kurnool, AP',  4.2, 'available'),
    ('00000000-0000-0000-0000-000000000001', 'Rotavator — 5ft Heavy',     'Rotavator',450, 3200, true,  'Nellore, AP',  4.5, 'booked')
    ON CONFLICT DO NOTHING
  `);

  // Jobs (KisanConnect)
  await pool.query(`
    INSERT INTO jobs (employer_id, title, employer_name, job_type, salary_min, salary_max, salary_period, location_label, vacancies) VALUES
    ('00000000-0000-0000-0000-000000000003', 'Farm Supervisor — Paddy Cultivation',  'Godavari Farms',         'Full-time', 18000, 22000, 'month', 'East Godavari, AP', 3),
    ('00000000-0000-0000-0000-000000000003', 'Harvest Labourers — Cotton Picking',   'Adilabad Cotton Co-op',  'Seasonal',    500,   650, 'day',   'Adilabad, TS',      25),
    ('00000000-0000-0000-0000-000000000003', 'Drip Irrigation Technician',           'Jain Irrigation',        'Contract',  15000, 20000, 'month', 'Multiple Locations', 8),
    ('00000000-0000-0000-0000-000000000003', 'Soil Testing Lab Assistant',           'AP Agri Department',     'Part-time', 12000, 12000, 'month', 'Guntur, AP',         2),
    ('00000000-0000-0000-0000-000000000003', 'Veterinary Assistant — Cattle Farm',   'Nandyal Dairy',          'Full-time', 16000, 20000, 'month', 'Nandyal, AP',        1)
    ON CONFLICT DO NOTHING
  `);

  // Price feeds (initial data)
  await pool.query(`
    INSERT INTO price_feeds (crop_id, market_name, district_id, price_per_quintal, min_price, max_price, source) VALUES
    (3, 'Vijayawada APMC',    3, 2200, 1900, 2600, 'apmc'),
    (4, 'Kurnool Mandi',      5, 1800, 1500, 2100, 'apmc'),
    (7, 'Guntur Spice Market',4, 8500, 7500, 9200, 'apmc'),
    (1, 'Rajahmundry APMC',   2, 3200, 2900, 3500, 'apmc'),
    (2, 'Warangal Mandi',     NULL, 2800, 2600, 3000, 'apmc'),
    (14,'Agra Mandi',         NULL, 1400, 1200, 1600, 'apmc'),
    (6, 'Kurnool Oilseeds',   5, 5200, 4800, 5600, 'apmc'),
    (5, 'Adilabad Cotton',    NULL, 6800, 6400, 7200, 'apmc')
    ON CONFLICT DO NOTHING
  `);

  // Activity feed (initial events)
  await pool.query(`
    INSERT INTO activity_feed (event_type, actor_name, description, metadata) VALUES
    ('declaration', 'Raju Reddy',            'declared 2.5 acres of Tomato in Krishna, AP',    '{"crop":"Tomato","acres":2.5}'),
    ('listing',     'Rayalaseema FPC',        'listed 80 Tons of Onion — Grade A',              '{"crop":"Onion","qty_tonnes":80}'),
    ('inquiry',     'Vikram Traders',         'sent inquiry for 50T Tomato in AP',               '{"crop":"Tomato","qty_tonnes":50}'),
    ('water_log',   'Sudha Aqua Farm',        'logged water quality — pH 7.8, Pond #3',         '{"ph":7.8,"pond":"P-003"}'),
    ('property',    'Ramaiah',                'listed 8 acres for lease in Krishna district',    '{"acres":8,"type":"AgriLand"}'),
    ('booking',     'Mahesh Farm',            'booked Mahindra 265 DI Tractor for 3 days',       '{"equipment":"Tractor","days":3}'),
    ('payment',     'Chittoor Rythu FPC',     'received buyer payment of ₹4,45,000',            '{"amount":445000}'),
    ('intelligence','Intelligence Engine',    'Tomato surplus predicted in AP — harvest up 23%','{"crop":"Tomato","surplus_pct":23}')
    ON CONFLICT DO NOTHING
  `);

  console.log('✅ Seed data inserted');
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => { console.log('✅ Seeding complete'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
