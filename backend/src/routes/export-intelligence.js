/**
 * Export Intelligence Engine for Indian Agriculture Products
 * Features:
 *   1. Global Market Intelligence & Country Analysis
 *   2. Export Commodity Catalog with HS Codes & Pricing
 *   3. Demand Signals from International Markets
 *   4. Compliance & Certification Management
 *   5. Export Documentation & Templates
 *   6. Export Shipment Lifecycle Management
 *   7. International Buyer Directory & Connections
 *   8. Export Analytics, Forecasting & Competitor Analysis
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  SEED / FALLBACK DATA
// ═══════════════════════════════════════════════════════════════════

const SEED_MARKETS = [
  { country: 'UAE', region: 'Middle East', total_trade_usd: 5200000000, top_imports: ['basmati_rice', 'spices', 'fruits', 'vegetables', 'meat'], growth_pct: 8.2, ease_of_trade: 'high', currency: 'AED', port_of_entry: 'Jebel Ali' },
  { country: 'USA', region: 'North America', total_trade_usd: 4800000000, top_imports: ['shrimp', 'spices', 'basmati_rice', 'sesame_seeds', 'cashew'], growth_pct: 5.7, ease_of_trade: 'medium', currency: 'USD', port_of_entry: 'Los Angeles' },
  { country: 'UK', region: 'Europe', total_trade_usd: 2100000000, top_imports: ['basmati_rice', 'tea', 'spices', 'vegetables', 'sesame_seeds'], growth_pct: 4.3, ease_of_trade: 'medium', currency: 'GBP', port_of_entry: 'Felixstowe' },
  { country: 'Bangladesh', region: 'South Asia', total_trade_usd: 1800000000, top_imports: ['onion', 'cotton', 'sugar', 'wheat', 'fruits'], growth_pct: 12.1, ease_of_trade: 'high', currency: 'BDT', port_of_entry: 'Chittagong' },
  { country: 'Saudi Arabia', region: 'Middle East', total_trade_usd: 2600000000, top_imports: ['basmati_rice', 'meat', 'spices', 'fruits', 'vegetables'], growth_pct: 6.8, ease_of_trade: 'high', currency: 'SAR', port_of_entry: 'Jeddah' },
  { country: 'China', region: 'East Asia', total_trade_usd: 3200000000, top_imports: ['cotton', 'pepper', 'sesame_seeds', 'castor_oil', 'shellac'], growth_pct: 3.5, ease_of_trade: 'medium', currency: 'CNY', port_of_entry: 'Shanghai' },
  { country: 'Vietnam', region: 'Southeast Asia', total_trade_usd: 1500000000, top_imports: ['pepper', 'maize', 'cotton', 'sesame_seeds', 'spices'], growth_pct: 9.4, ease_of_trade: 'high', currency: 'VND', port_of_entry: 'Ho Chi Minh City' },
  { country: 'Netherlands', region: 'Europe', total_trade_usd: 1900000000, top_imports: ['shrimp', 'basmati_rice', 'spices', 'sesame_seeds', 'guar_gum'], growth_pct: 5.1, ease_of_trade: 'medium', currency: 'EUR', port_of_entry: 'Rotterdam' },
  { country: 'Malaysia', region: 'Southeast Asia', total_trade_usd: 1300000000, top_imports: ['sugar', 'basmati_rice', 'spices', 'vegetables', 'animal_feed'], growth_pct: 7.2, ease_of_trade: 'high', currency: 'MYR', port_of_entry: 'Port Klang' },
  { country: 'Germany', region: 'Europe', total_trade_usd: 1700000000, top_imports: ['organic_spices', 'tea', 'sesame_seeds', 'basmati_rice', 'cashew'], growth_pct: 4.8, ease_of_trade: 'medium', currency: 'EUR', port_of_entry: 'Hamburg' }
];

const SEED_COMMODITIES = [
  { hs_code: '1006', name: 'Basmati Rice', category: 'cereals', fob_price_usd: 1150, unit: 'MT', annual_volume_mt: 4500000, top_buyers: ['Saudi Arabia', 'Iran', 'Iraq', 'UAE', 'Kuwait'] },
  { hs_code: '0904', name: 'Black Pepper', category: 'spices', fob_price_usd: 5200, unit: 'MT', annual_volume_mt: 28000, top_buyers: ['USA', 'UK', 'Germany', 'Canada', 'Japan'] },
  { hs_code: '0306', name: 'Frozen Shrimp', category: 'seafood', fob_price_usd: 8500, unit: 'MT', annual_volume_mt: 650000, top_buyers: ['USA', 'China', 'Japan', 'EU', 'Vietnam'] },
  { hs_code: '0709', name: 'Fresh Onion', category: 'vegetables', fob_price_usd: 350, unit: 'MT', annual_volume_mt: 2200000, top_buyers: ['Bangladesh', 'Malaysia', 'Sri Lanka', 'UAE', 'Nepal'] },
  { hs_code: '0910', name: 'Turmeric', category: 'spices', fob_price_usd: 2800, unit: 'MT', annual_volume_mt: 155000, top_buyers: ['USA', 'UAE', 'Bangladesh', 'UK', 'Japan'] },
  { hs_code: '0801', name: 'Cashew Kernels', category: 'nuts', fob_price_usd: 9200, unit: 'MT', annual_volume_mt: 85000, top_buyers: ['USA', 'UAE', 'Netherlands', 'Japan', 'Saudi Arabia'] },
  { hs_code: '0902', name: 'Tea', category: 'beverages', fob_price_usd: 3200, unit: 'MT', annual_volume_mt: 256000, top_buyers: ['Russia', 'Iran', 'UK', 'UAE', 'USA'] },
  { hs_code: '1207', name: 'Sesame Seeds', category: 'oilseeds', fob_price_usd: 1800, unit: 'MT', annual_volume_mt: 320000, top_buyers: ['China', 'Vietnam', 'South Korea', 'Japan', 'USA'] },
  { hs_code: '0713', name: 'Dried Lentils', category: 'pulses', fob_price_usd: 950, unit: 'MT', annual_volume_mt: 180000, top_buyers: ['UAE', 'USA', 'UK', 'Algeria', 'Turkey'] },
  { hs_code: '5201', name: 'Raw Cotton', category: 'fibers', fob_price_usd: 1950, unit: 'MT', annual_volume_mt: 950000, top_buyers: ['China', 'Bangladesh', 'Vietnam', 'Indonesia', 'Thailand'] },
  { hs_code: '0803', name: 'Fresh Banana', category: 'fruits', fob_price_usd: 420, unit: 'MT', annual_volume_mt: 190000, top_buyers: ['UAE', 'Saudi Arabia', 'Bahrain', 'Iran', 'Oman'] },
  { hs_code: '1513', name: 'Coconut Oil', category: 'oils', fob_price_usd: 2100, unit: 'MT', annual_volume_mt: 45000, top_buyers: ['USA', 'EU', 'Malaysia', 'China', 'UAE'] }
];

const SEED_DEMAND_SIGNALS = [
  { commodity: 'Basmati Rice', hs_code: '1006', country: 'Saudi Arabia', volume_mt: 25000, urgency: 'high', deadline: '2025-03-15', price_offered_usd: 1250 },
  { commodity: 'Black Pepper', hs_code: '0904', country: 'USA', volume_mt: 500, urgency: 'medium', deadline: '2025-04-01', price_offered_usd: 5500 },
  { commodity: 'Frozen Shrimp', hs_code: '0306', country: 'Japan', volume_mt: 2000, urgency: 'high', deadline: '2025-02-28', price_offered_usd: 9200 },
  { commodity: 'Fresh Onion', hs_code: '0709', country: 'Bangladesh', volume_mt: 50000, urgency: 'critical', deadline: '2025-02-15', price_offered_usd: 400 },
  { commodity: 'Turmeric', hs_code: '0910', country: 'Germany', volume_mt: 300, urgency: 'low', deadline: '2025-06-01', price_offered_usd: 3100 },
  { commodity: 'Cashew Kernels', hs_code: '0801', country: 'Netherlands', volume_mt: 800, urgency: 'medium', deadline: '2025-05-01', price_offered_usd: 9500 },
  { commodity: 'Sesame Seeds', hs_code: '1207', country: 'South Korea', volume_mt: 5000, urgency: 'high', deadline: '2025-03-20', price_offered_usd: 1950 },
  { commodity: 'Tea', hs_code: '0902', country: 'Russia', volume_mt: 8000, urgency: 'medium', deadline: '2025-04-15', price_offered_usd: 3400 }
];

const SEED_CERTIFICATIONS = [
  { id: 'cert-1', name: 'GlobalGAP', issuing_body: 'FoodPLUS GmbH', validity_years: 1, cost_usd: 3500, description: 'Good Agricultural Practices certification for farm production', required_for: ['EU', 'UK', 'Japan'] },
  { id: 'cert-2', name: 'USDA Organic', issuing_body: 'USDA', validity_years: 1, cost_usd: 5000, description: 'US organic certification for agricultural products', required_for: ['USA', 'Canada'] },
  { id: 'cert-3', name: 'India Organic (NPOP)', issuing_body: 'APEDA', validity_years: 1, cost_usd: 800, description: 'National Programme for Organic Production', required_for: ['EU', 'Switzerland', 'USA'] },
  { id: 'cert-4', name: 'HACCP', issuing_body: 'Various accredited bodies', validity_years: 3, cost_usd: 2500, description: 'Hazard Analysis and Critical Control Points for food safety', required_for: ['USA', 'EU', 'Japan', 'Australia'] },
  { id: 'cert-5', name: 'Fair Trade', issuing_body: 'Fairtrade International', validity_years: 3, cost_usd: 4000, description: 'Fair trade and ethical sourcing certification', required_for: ['EU', 'USA', 'UK'] },
  { id: 'cert-6', name: 'ISO 22000', issuing_body: 'ISO', validity_years: 3, cost_usd: 6000, description: 'Food safety management systems standard', required_for: ['EU', 'Japan', 'South Korea'] },
  { id: 'cert-7', name: 'FSSAI Export License', issuing_body: 'FSSAI', validity_years: 5, cost_usd: 150, description: 'Mandatory export license from Food Safety Standards Authority of India', required_for: ['All countries'] },
  { id: 'cert-8', name: 'Phytosanitary Certificate', issuing_body: 'Directorate of Plant Protection', validity_years: 0, cost_usd: 25, description: 'Per-shipment plant health certificate', required_for: ['All countries'] }
];

const SEED_COMPLIANCE = {
  USA: { authority: 'FDA', standards: ['FSMA', 'FSVP', 'FDA Prior Notice'], required_certs: ['HACCP', 'FSSAI Export License', 'Phytosanitary Certificate'], tariff_pct: 4.5, key_regulations: ['Food Safety Modernization Act', 'Bioterrorism Act Prior Notice', 'FDA Food Facility Registration'], banned_items: ['raw milk products without pasteurization'], docs_required: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Phytosanitary Certificate', 'Health Certificate', 'FDA Prior Notice'] },
  EU: { authority: 'EFSA', standards: ['EU Food Safety Regulation', 'MRL Limits', 'Traceability Requirements'], required_certs: ['GlobalGAP', 'HACCP', 'ISO 22000', 'Phytosanitary Certificate'], tariff_pct: 7.2, key_regulations: ['General Food Law EC 178/2002', 'Maximum Residue Levels', 'Novel Food Regulation'], banned_items: ['GM crops without approval'], docs_required: ['EUR.1 Certificate', 'Commercial Invoice', 'Packing List', 'Bill of Lading', 'Phytosanitary Certificate', 'Health Certificate', 'Certificate of Origin'] },
  UAE: { authority: 'ESMA/Municipality', standards: ['UAE.S GSO Standards', 'Halal Certification', 'Shelf Life Standards'], required_certs: ['Halal Certificate', 'FSSAI Export License', 'Phytosanitary Certificate'], tariff_pct: 5.0, key_regulations: ['Federal Law No. 10/2015 Food Safety', 'Halal National Mark'], banned_items: ['pork-derived additives', 'alcohol-based ingredients'], docs_required: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Halal Certificate', 'Health Certificate', 'Certificate of Origin'] },
  UK: { authority: 'FSA', standards: ['UK Food Standards', 'Retained EU Law', 'UKCA Marking'], required_certs: ['GlobalGAP', 'HACCP', 'Phytosanitary Certificate'], tariff_pct: 6.5, key_regulations: ['Food Safety Act 1990', 'UK REACH', 'Retained EU MRL Regulations'], banned_items: [], docs_required: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Phytosanitary Certificate', 'Health Certificate', 'Certificate of Origin', 'UK Import License'] },
  Japan: { authority: 'MAFF/MHLW', standards: ['JAS Standards', 'Food Sanitation Act', 'Plant Protection Act'], required_certs: ['JAS Certification', 'HACCP', 'Phytosanitary Certificate'], tariff_pct: 8.5, key_regulations: ['Food Sanitation Act', 'JAS Law', 'Plant Protection Act'], banned_items: ['certain pesticide residues above Japanese MRL'], docs_required: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Phytosanitary Certificate', 'Health Certificate', 'Import Notification', 'Certificate of Origin'] }
};

const SEED_BUYERS = [
  { id: 'buyer-1', name: 'Al Dahra Agriculture', country: 'UAE', city: 'Abu Dhabi', commodities: ['basmati_rice', 'spices', 'pulses'], annual_volume_mt: 120000, verified: true, rating: 4.8, years_active: 15 },
  { id: 'buyer-2', name: 'Olam International', country: 'Singapore', city: 'Singapore', commodities: ['cashew', 'pepper', 'sesame_seeds', 'cotton'], annual_volume_mt: 350000, verified: true, rating: 4.9, years_active: 30 },
  { id: 'buyer-3', name: 'McCormick & Company', country: 'USA', city: 'Baltimore', commodities: ['pepper', 'turmeric', 'cumin', 'coriander'], annual_volume_mt: 45000, verified: true, rating: 4.7, years_active: 25 },
  { id: 'buyer-4', name: 'Tesco Stores', country: 'UK', city: 'Welwyn Garden City', commodities: ['basmati_rice', 'tea', 'organic_spices'], annual_volume_mt: 28000, verified: true, rating: 4.5, years_active: 20 },
  { id: 'buyer-5', name: 'Meghna Group', country: 'Bangladesh', city: 'Dhaka', commodities: ['onion', 'cotton', 'sugar', 'wheat'], annual_volume_mt: 200000, verified: true, rating: 4.3, years_active: 12 },
  { id: 'buyer-6', name: 'Costco Wholesale', country: 'USA', city: 'Issaquah', commodities: ['shrimp', 'cashew', 'basmati_rice', 'spices'], annual_volume_mt: 60000, verified: true, rating: 4.6, years_active: 18 },
  { id: 'buyer-7', name: 'Metro AG', country: 'Germany', city: 'Düsseldorf', commodities: ['organic_spices', 'tea', 'sesame_seeds', 'basmati_rice'], annual_volume_mt: 35000, verified: true, rating: 4.4, years_active: 22 },
  { id: 'buyer-8', name: 'Lulu Group', country: 'UAE', city: 'Abu Dhabi', commodities: ['fruits', 'vegetables', 'rice', 'spices'], annual_volume_mt: 80000, verified: true, rating: 4.7, years_active: 10 }
];

// ═══════════════════════════════════════════════════════════════════
//  1. GLOBAL MARKET INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

router.get('/markets', async (req, res) => {
  try {
    const { region } = req.query;
    let query = 'SELECT * FROM export_markets WHERE 1=1';
    const params = [];
    if (region) { params.push(region); query += ` AND region = $${params.length}`; }
    query += ' ORDER BY total_trade_usd DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ markets: result.rows });
  } catch (err) {
    let data = SEED_MARKETS;
    if (req.query.region) data = data.filter(m => m.region === req.query.region);
    res.json({ markets: data, _seed: true });
  }
});

// Country analysis
router.get('/markets/:country', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM export_markets WHERE country = $1', [req.params.country]);
    if (result.rows.length) return res.json({ market: result.rows[0] });

    const seed = SEED_MARKETS.find(m => m.country.toLowerCase() === req.params.country.toLowerCase());
    if (!seed) return res.status(404).json({ error: 'Country not found' });
    const compliance = SEED_COMPLIANCE[req.params.country] || null;
    res.json({ market: seed, compliance, _seed: true });
  } catch (err) {
    const seed = SEED_MARKETS.find(m => m.country.toLowerCase() === req.params.country.toLowerCase());
    if (!seed) return res.status(404).json({ error: 'Country not found' });
    const compliance = SEED_COMPLIANCE[req.params.country] || null;
    res.json({ market: seed, compliance, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. EXPORT COMMODITIES
// ═══════════════════════════════════════════════════════════════════

router.get('/commodities', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM export_commodities WHERE 1=1';
    const params = [];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY annual_volume_mt DESC';

    const result = await pool.query(query, params);
    res.json({ commodities: result.rows });
  } catch (err) {
    let data = SEED_COMMODITIES;
    if (req.query.category) data = data.filter(c => c.category === req.query.category);
    res.json({ commodities: data, _seed: true });
  }
});

// Commodity pricing & trends
router.get('/commodities/:hsCode/pricing', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM export_commodity_prices WHERE hs_code = $1 ORDER BY recorded_at DESC LIMIT 24',
      [req.params.hsCode]
    );
    if (result.rows.length) return res.json({ pricing: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const commodity = SEED_COMMODITIES.find(c => c.hs_code === req.params.hsCode);
    if (!commodity) return res.status(404).json({ error: 'Commodity not found for HS code' });

    const basePrice = commodity.fob_price_usd;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const history = months.map((month, i) => {
      const seasonalFactor = 1 + 0.08 * Math.sin((i / 12) * 2 * Math.PI);
      const fob = Math.round(basePrice * seasonalFactor);
      return { month, year: 2024, fob_price_usd: fob, cif_price_usd: Math.round(fob * 1.12), volume_mt: Math.round(commodity.annual_volume_mt / 12 * seasonalFactor) };
    });
    res.json({ hs_code: req.params.hsCode, commodity: commodity.name, pricing: history, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. DEMAND SIGNALS
// ═══════════════════════════════════════════════════════════════════

router.get('/demand-signals', async (req, res) => {
  try {
    const { commodity, country, urgency } = req.query;
    let query = 'SELECT * FROM export_demand_signals WHERE 1=1';
    const params = [];
    if (commodity) { params.push(commodity); query += ` AND commodity ILIKE $${params.length}`; }
    if (country) { params.push(country); query += ` AND country = $${params.length}`; }
    if (urgency) { params.push(urgency); query += ` AND urgency = $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ demand_signals: result.rows });
  } catch (err) {
    let data = SEED_DEMAND_SIGNALS;
    if (req.query.urgency) data = data.filter(d => d.urgency === req.query.urgency);
    if (req.query.country) data = data.filter(d => d.country === req.query.country);
    res.json({ demand_signals: data, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. COMPLIANCE & CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

router.get('/compliance/:country', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM export_compliance WHERE country = $1', [req.params.country]);
    if (result.rows.length) return res.json({ compliance: result.rows[0] });
    throw new Error('fallback');
  } catch (err) {
    const data = SEED_COMPLIANCE[req.params.country];
    if (!data) return res.status(404).json({ error: 'Compliance data not found for this country' });
    res.json({ country: req.params.country, compliance: data, _seed: true });
  }
});

router.get('/certifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM export_certifications ORDER BY name');
    res.json({ certifications: result.rows });
  } catch (err) {
    res.json({ certifications: SEED_CERTIFICATIONS, _seed: true });
  }
});

// Check export readiness
router.post('/compliance/check', async (req, res) => {
  try {
    const { product, hs_code, destination_country } = req.body;
    if (!destination_country) return res.status(400).json({ error: 'destination_country required' });

    const compliance = SEED_COMPLIANCE[destination_country] || SEED_COMPLIANCE['USA'];
    const allCerts = SEED_CERTIFICATIONS;
    const requiredCerts = compliance.required_certs || [];
    const matchedCerts = allCerts.filter(c => requiredCerts.includes(c.name));
    const totalCost = matchedCerts.reduce((sum, c) => sum + c.cost_usd, 0);
    const timelineWeeks = Math.max(...matchedCerts.map(c => c.validity_years > 0 ? 8 : 1), 4);

    res.json({
      product: product || 'General',
      hs_code: hs_code || 'N/A',
      destination: destination_country,
      authority: compliance.authority,
      tariff_pct: compliance.tariff_pct,
      required_certifications: matchedCerts,
      required_documents: compliance.docs_required,
      key_regulations: compliance.key_regulations,
      banned_items: compliance.banned_items,
      estimated_cost_usd: totalCost,
      estimated_timeline_weeks: timelineWeeks,
      readiness_score: requiredCerts.length > 0 ? 45 : 80
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. EXPORT DOCUMENTATION
// ═══════════════════════════════════════════════════════════════════

router.get('/documentation/:country', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM export_documentation WHERE country = $1', [req.params.country]);
    if (result.rows.length) return res.json({ documents: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const compliance = SEED_COMPLIANCE[req.params.country] || SEED_COMPLIANCE['USA'];
    const documents = (compliance.docs_required || []).map((doc, i) => ({
      id: `doc-${i + 1}`,
      name: doc,
      country: req.params.country,
      category: doc.includes('Certificate') ? 'certificate' : 'commercial',
      mandatory: true,
      template_url: `/templates/${doc.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      description: `${doc} required for export to ${req.params.country}`,
      issuing_authority: doc.includes('Phyto') ? 'Directorate of Plant Protection' : 'Exporter / Chamber of Commerce'
    }));
    res.json({ country: req.params.country, documents, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. EXPORT SHIPMENT LIFECYCLE
// ═══════════════════════════════════════════════════════════════════

// Create export shipment
router.post('/shipments', async (req, res) => {
  try {
    const {
      user_id, product_name, hs_code, quantity_mt, destination_country,
      buyer_name, incoterm, container_type, port_of_loading, estimated_departure
    } = req.body;

    if (!user_id || !product_name || !destination_country) {
      return res.status(400).json({ error: 'user_id, product_name, destination_country required' });
    }

    const result = await pool.query(`
      INSERT INTO export_shipments (
        user_id, product_name, hs_code, quantity_mt, destination_country,
        buyer_name, incoterm, container_type, port_of_loading, estimated_departure, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft') RETURNING *
    `, [
      user_id, product_name, hs_code, quantity_mt, destination_country,
      buyer_name, incoterm || 'FOB', container_type || '20ft_reefer',
      port_of_loading || 'JNPT Mumbai', estimated_departure
    ]);

    res.status(201).json({ shipment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List shipments
router.get('/shipments', async (req, res) => {
  try {
    const { user_id, status, destination_country } = req.query;
    let query = 'SELECT * FROM export_shipments WHERE 1=1';
    const params = [];

    if (user_id) { params.push(user_id); query += ` AND user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (destination_country) { params.push(destination_country); query += ` AND destination_country = $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ shipments: result.rows });
  } catch (err) {
    const seedShipments = [
      { id: 'ship-1', user_id: req.query.user_id || 'u1', product_name: 'Basmati Rice', hs_code: '1006', quantity_mt: 500, destination_country: 'UAE', buyer_name: 'Al Dahra Agriculture', incoterm: 'CIF', container_type: '40ft_dry', status: 'in_transit', port_of_loading: 'JNPT Mumbai' },
      { id: 'ship-2', user_id: req.query.user_id || 'u1', product_name: 'Black Pepper', hs_code: '0904', quantity_mt: 25, destination_country: 'USA', buyer_name: 'McCormick & Company', incoterm: 'FOB', container_type: '20ft_reefer', status: 'customs_cleared', port_of_loading: 'Kochi Port' }
    ];
    res.json({ shipments: seedShipments, _seed: true });
  }
});

// Shipment detail
router.get('/shipments/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM export_shipments WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Shipment not found' });

    const timeline = [
      { status: 'draft', timestamp: result.rows[0].created_at, description: 'Shipment created' },
      { status: 'booking', timestamp: null, description: 'Vessel booking confirmed' },
      { status: 'customs_cleared', timestamp: null, description: 'Customs clearance completed' },
      { status: 'shipped', timestamp: null, description: 'Cargo loaded on vessel' },
      { status: 'in_transit', timestamp: null, description: 'In transit to destination' },
      { status: 'delivered', timestamp: null, description: 'Delivered to buyer' }
    ];

    res.json({ shipment: result.rows[0], timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shipment status
router.put('/shipments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'booking', 'customs_cleared', 'shipped', 'in_transit', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE export_shipments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ shipment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shipment documents
router.get('/shipments/:id/documents', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM export_shipment_documents WHERE shipment_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    res.json({ documents: result.rows });
  } catch (err) {
    const docs = [
      { id: 'sdoc-1', shipment_id: req.params.id, name: 'Commercial Invoice', status: 'generated', url: '/docs/commercial_invoice.pdf' },
      { id: 'sdoc-2', shipment_id: req.params.id, name: 'Packing List', status: 'generated', url: '/docs/packing_list.pdf' },
      { id: 'sdoc-3', shipment_id: req.params.id, name: 'Bill of Lading', status: 'pending', url: null },
      { id: 'sdoc-4', shipment_id: req.params.id, name: 'Phytosanitary Certificate', status: 'pending', url: null },
      { id: 'sdoc-5', shipment_id: req.params.id, name: 'Certificate of Origin', status: 'pending', url: null }
    ];
    res.json({ documents: docs, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  7. INTERNATIONAL BUYER DIRECTORY
// ═══════════════════════════════════════════════════════════════════

router.get('/buyers', async (req, res) => {
  try {
    const { country, commodity, verified } = req.query;
    let query = 'SELECT * FROM export_buyers WHERE 1=1';
    const params = [];

    if (country) { params.push(country); query += ` AND country = $${params.length}`; }
    if (commodity) { params.push(`%${commodity}%`); query += ` AND commodities::text ILIKE $${params.length}`; }
    if (verified === 'true') query += ' AND verified = true';
    query += ' ORDER BY rating DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ buyers: result.rows });
  } catch (err) {
    let data = SEED_BUYERS;
    if (req.query.country) data = data.filter(b => b.country === req.query.country);
    if (req.query.verified === 'true') data = data.filter(b => b.verified);
    res.json({ buyers: data, _seed: true });
  }
});

// Connect with buyer
router.post('/buyers/connect', async (req, res) => {
  try {
    const { user_id, buyer_id, message, commodities_of_interest } = req.body;
    if (!user_id || !buyer_id) return res.status(400).json({ error: 'user_id, buyer_id required' });

    const result = await pool.query(`
      INSERT INTO export_buyer_connections (user_id, buyer_id, message, commodities_of_interest, status)
      VALUES ($1,$2,$3,$4,'pending') RETURNING *
    `, [user_id, buyer_id, message, JSON.stringify(commodities_of_interest || [])]);

    res.status(201).json({ connection: result.rows[0] });
  } catch (err) {
    res.json({
      connection: {
        id: `conn-${Date.now()}`, user_id: req.body.user_id, buyer_id: req.body.buyer_id,
        status: 'pending', message: req.body.message, created_at: new Date().toISOString()
      },
      _seed: true
    });
  }
});

// Buyer profile
router.get('/buyers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM export_buyers WHERE id = $1', [req.params.id]);
    if (!result.rows.length) throw new Error('fallback');
    res.json({ buyer: result.rows[0] });
  } catch (err) {
    const buyer = SEED_BUYERS.find(b => b.id === req.params.id);
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
    const tradeHistory = [
      { year: 2024, volume_mt: Math.round(buyer.annual_volume_mt * 0.9), value_usd: Math.round(buyer.annual_volume_mt * 1100 * 0.9) },
      { year: 2023, volume_mt: Math.round(buyer.annual_volume_mt * 0.85), value_usd: Math.round(buyer.annual_volume_mt * 1050 * 0.85) },
      { year: 2022, volume_mt: Math.round(buyer.annual_volume_mt * 0.78), value_usd: Math.round(buyer.annual_volume_mt * 980 * 0.78) }
    ];
    res.json({ buyer, trade_history: tradeHistory, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  8. EXPORT ANALYTICS
// ═══════════════════════════════════════════════════════════════════

router.get('/analytics/overview', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM export_analytics WHERE 1=1';
    const params = [];
    if (user_id) { params.push(user_id); query += ` AND user_id = $${params.length}`; }

    const result = await pool.query(query, params);
    if (result.rows.length) return res.json({ analytics: result.rows[0] });
    throw new Error('fallback');
  } catch (err) {
    res.json({
      analytics: {
        total_revenue_usd: 12500000,
        total_volume_mt: 8500,
        active_markets: 7,
        active_buyers: 12,
        shipments_ytd: 34,
        avg_realization_pct: 96.5,
        growth_yoy_pct: 14.2,
        top_commodity: 'Basmati Rice',
        top_market: 'UAE',
        revenue_by_commodity: [
          { commodity: 'Basmati Rice', revenue_usd: 5750000 },
          { commodity: 'Black Pepper', revenue_usd: 2600000 },
          { commodity: 'Frozen Shrimp', revenue_usd: 2125000 },
          { commodity: 'Cashew Kernels', revenue_usd: 2025000 }
        ],
        revenue_by_market: [
          { country: 'UAE', revenue_usd: 4200000 },
          { country: 'USA', revenue_usd: 3800000 },
          { country: 'UK', revenue_usd: 2100000 },
          { country: 'Japan', revenue_usd: 1500000 },
          { country: 'Germany', revenue_usd: 900000 }
        ]
      },
      _seed: true
    });
  }
});

// Demand forecast
router.get('/analytics/forecast', async (req, res) => {
  try {
    const { commodity } = req.query;
    let query = 'SELECT * FROM export_demand_forecasts WHERE 1=1';
    const params = [];
    if (commodity) { params.push(commodity); query += ` AND commodity ILIKE $${params.length}`; }
    query += ' ORDER BY month ASC LIMIT 12';

    const result = await pool.query(query, params);
    if (result.rows.length) return res.json({ forecasts: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const commodities = req.query.commodity
      ? SEED_COMMODITIES.filter(c => c.name.toLowerCase().includes(req.query.commodity.toLowerCase()))
      : SEED_COMMODITIES.slice(0, 5);

    const forecasts = commodities.map(c => {
      const months = [];
      const now = new Date();
      for (let i = 1; i <= 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const seasonalFactor = 1 + 0.1 * Math.sin(((now.getMonth() + i) / 12) * 2 * Math.PI);
        months.push({
          month: date.toISOString().slice(0, 7),
          predicted_volume_mt: Math.round((c.annual_volume_mt / 12) * seasonalFactor),
          predicted_price_usd: Math.round(c.fob_price_usd * seasonalFactor),
          confidence_pct: Math.round(85 - i * 3)
        });
      }
      return { commodity: c.name, hs_code: c.hs_code, forecast: months };
    });

    res.json({ forecasts, _seed: true });
  }
});

// Competitor analysis
router.get('/analytics/competitors', async (req, res) => {
  try {
    const { commodity } = req.query;
    let query = 'SELECT * FROM export_competitor_analysis WHERE 1=1';
    const params = [];
    if (commodity) { params.push(commodity); query += ` AND commodity ILIKE $${params.length}`; }
    query += ' ORDER BY market_share_pct DESC';

    const result = await pool.query(query, params);
    if (result.rows.length) return res.json({ competitors: result.rows });
    throw new Error('fallback');
  } catch (err) {
    res.json({
      competitors: [
        { country: 'Thailand', commodity: 'Rice', market_share_pct: 25.3, avg_price_usd: 520, strengths: ['Price competitiveness', 'Jasmine variety premium'], weaknesses: ['Limited Basmati'] },
        { country: 'Vietnam', commodity: 'Rice', market_share_pct: 15.8, avg_price_usd: 480, strengths: ['Low cost production', 'Growing volume'], weaknesses: ['Quality perception', 'Limited premium segment'] },
        { country: 'Pakistan', commodity: 'Rice', market_share_pct: 8.5, avg_price_usd: 980, strengths: ['Similar Basmati quality', 'Lower prices'], weaknesses: ['Political instability', 'Quality consistency'] },
        { country: 'Vietnam', commodity: 'Black Pepper', market_share_pct: 38.2, avg_price_usd: 4200, strengths: ['Volume leader', 'Cost advantage'], weaknesses: ['Quality concerns', 'Pesticide residues'] },
        { country: 'Brazil', commodity: 'Black Pepper', market_share_pct: 12.1, avg_price_usd: 4800, strengths: ['Growing production', 'Organic segment'], weaknesses: ['Logistics cost', 'Limited varieties'] },
        { country: 'Indonesia', commodity: 'Shrimp', market_share_pct: 18.5, avg_price_usd: 7800, strengths: ['Sustainable farming', 'Mangrove certification'], weaknesses: ['Higher cost', 'Infrastructure'] },
        { country: 'Ecuador', commodity: 'Shrimp', market_share_pct: 22.3, avg_price_usd: 7200, strengths: ['Volume growth', 'Disease-free reputation'], weaknesses: ['Limited species variety'] }
      ],
      india_position: { overall_rank: 2, agri_export_rank: 9, total_agri_exports_usd: 53000000000 },
      _seed: true
    });
  }
});

module.exports = router;
