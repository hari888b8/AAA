const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// ══════════════════════════════════════════════════════════════════════════════
// GALAXY — Public Discovery Endpoints (No Auth Required)
// Pattern: GET /galaxy/{module}/directory + GET /galaxy/{module}/:id/portfolio
// ══════════════════════════════════════════════════════════════════════════════

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  1. FARMER GALAXY — Discover individual farmers                          │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/farmer/directory', async (req, res) => {
  try {
    const { state, district, crop, search, sort_by = 'land', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT fp.user_id as id, u.name as farmer_name, u.phone,
             fp.state, fp.district_id, fp.mandal, fp.village,
             fp.total_land_acres, fp.irrigation_type, fp.farming_method,
             fp.soil_type, fp.organic_certified, fp.primary_crops,
             d.name as district_name, d.state_name,
             COALESCE(listings.active_count, 0) as active_listings,
             COALESCE(decl.declaration_count, 0) as declarations
      FROM farmer_profiles fp
      JOIN users u ON u.id = fp.user_id
      LEFT JOIN districts d ON fp.district_id = d.id
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as active_count
        FROM supply_listings sl
        WHERE sl.fpo_id = fp.user_id AND sl.status = 'active'
      ) listings ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as declaration_count
        FROM declarations dcl
        WHERE dcl.farmer_id = fp.user_id
      ) decl ON true
      WHERE fp.contact_consent IN ('public', 'fpo_only')`;

    const params = [];
    if (state) { params.push(state); query += ` AND fp.state = $${params.length}`; }
    if (district) { params.push(`%${district}%`); query += ` AND d.name ILIKE $${params.length}`; }
    if (crop) { params.push(`%${crop}%`); query += ` AND array_to_string(fp.primary_crops, ',') ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR d.name ILIKE $${params.length} OR fp.village ILIKE $${params.length} OR array_to_string(fp.primary_crops, ',') ILIKE $${params.length})`;
    }

    const allowedSorts = { land: 'fp.total_land_acres', name: 'u.name', listings: 'active_listings', declarations: 'declarations' };
    const sortCol = allowedSorts[sort_by] || 'fp.total_land_acres';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_farmers,
             COALESCE(SUM(total_land_acres), 0) as total_acres,
             COUNT(CASE WHEN organic_certified THEN 1 END) as organic_farmers
      FROM farmer_profiles WHERE contact_consent IN ('public', 'fpo_only')
    `);

    res.json({
      farmers: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/farmer/:farmerId/portfolio', async (req, res) => {
  try {
    const { farmerId } = req.params;

    const profileResult = await pool.query(
      `SELECT fp.*, u.name as farmer_name, d.name as district_name, d.state_name
       FROM farmer_profiles fp
       JOIN users u ON u.id = fp.user_id
       LEFT JOIN districts d ON fp.district_id = d.id
       WHERE fp.user_id = $1`, [farmerId]
    );
    if (profileResult.rows.length === 0) return res.status(404).json({ error: 'Farmer not found' });
    const profile = profileResult.rows[0];

    const harvestCalendar = await pool.query(
      `SELECT d.*, c.name as crop_name, c.icon_emoji
       FROM declarations d
       JOIN crop_catalog c ON d.crop_id = c.id
       WHERE d.farmer_id = $1 ORDER BY d.expected_harvest_date ASC`, [farmerId]
    );

    const listings = await pool.query(
      `SELECT sl.*, c.name as crop_name FROM supply_listings sl
       LEFT JOIN crop_catalog c ON sl.crop_id = c.id
       WHERE sl.fpo_id = $1 AND sl.status = 'active' ORDER BY sl.created_at DESC`, [farmerId]
    );

    const tradeHistory = await pool.query(
      `SELECT COUNT(*) as total_trades,
              SUM(CASE WHEN status = 'payment_released' THEN 1 ELSE 0 END) as successful_trades
       FROM trade_orders WHERE seller_id = $1`, [farmerId]
    );

    res.json({
      profile: {
        id: profile.user_id, farmer_name: profile.farmer_name,
        state: profile.state, district_name: profile.district_name,
        state_name: profile.state_name, mandal: profile.mandal, village: profile.village,
        total_land_acres: profile.total_land_acres, irrigation_type: profile.irrigation_type,
        farming_method: profile.farming_method, soil_type: profile.soil_type,
        organic_certified: profile.organic_certified, primary_crops: profile.primary_crops,
      },
      harvest_calendar: harvestCalendar.rows,
      active_listings: listings.rows,
      trade_stats: tradeHistory.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  2. AQUAOS GALAXY — Discover aquaculture farms                           │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/aqua/directory', async (req, res) => {
  try {
    const { species, district, search, sort_by = 'capacity', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT af.id, af.farm_name, af.owner_name, af.district, af.state,
             af.total_area_acres, af.culture_type, af.species,
             af.annual_production_mt, af.certifications,
             COALESCE(units.unit_count, 0) as culture_units,
             COALESCE(harvests.recent_harvests, 0) as recent_harvests
      FROM aqua_farms af
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as unit_count FROM aqua_culture_units WHERE farm_id = af.id
      ) units ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as recent_harvests FROM aqua_harvests
        WHERE farm_id = af.id AND harvest_date > NOW() - INTERVAL '180 days'
      ) harvests ON true
      WHERE af.is_active = true`;

    const params = [];
    if (species) { params.push(`%${species}%`); query += ` AND array_to_string(af.species, ',') ILIKE $${params.length}`; }
    if (district) { params.push(`%${district}%`); query += ` AND af.district ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (af.farm_name ILIKE $${params.length} OR af.owner_name ILIKE $${params.length} OR af.district ILIKE $${params.length} OR array_to_string(af.species, ',') ILIKE $${params.length})`;
    }

    const allowedSorts = { capacity: 'af.total_area_acres', production: 'af.annual_production_mt', name: 'af.farm_name', units: 'culture_units' };
    const sortCol = allowedSorts[sort_by] || 'af.total_area_acres';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_farms,
             COALESCE(SUM(total_area_acres), 0) as total_acres,
             COALESCE(SUM(annual_production_mt), 0) as total_production_mt
      FROM aqua_farms WHERE is_active = true
    `);

    res.json({
      farms: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/aqua/:farmId/portfolio', async (req, res) => {
  try {
    const { farmId } = req.params;

    const farmResult = await pool.query('SELECT * FROM aqua_farms WHERE id = $1', [farmId]);
    if (farmResult.rows.length === 0) return res.status(404).json({ error: 'Farm not found' });

    const units = await pool.query(
      'SELECT * FROM aqua_culture_units WHERE farm_id = $1 ORDER BY created_at DESC', [farmId]
    );

    const harvests = await pool.query(
      `SELECT * FROM aqua_harvests WHERE farm_id = $1 ORDER BY harvest_date DESC LIMIT 10`, [farmId]
    );

    const waterQuality = await pool.query(
      `SELECT * FROM aqua_water_quality WHERE farm_id = $1 ORDER BY recorded_at DESC LIMIT 5`, [farmId]
    );

    res.json({
      profile: farmResult.rows[0],
      culture_units: units.rows,
      recent_harvests: harvests.rows,
      water_quality: waterQuality.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  3. INPUTS GALAXY — Discover agri input suppliers                        │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/inputs/directory', async (req, res) => {
  try {
    const { category, district, search, sort_by = 'products', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT s.id, s.business_name, s.owner_name, s.district, s.state,
             s.categories, s.brands, s.delivery_radius_km,
             s.gst_number, s.license_number, s.rating,
             COALESCE(products.product_count, 0) as product_count,
             COALESCE(orders.order_count, 0) as total_orders
      FROM input_suppliers s
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as product_count FROM input_products WHERE supplier_id = s.id AND is_active = true
      ) products ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as order_count FROM input_orders WHERE supplier_id = s.id
      ) orders ON true
      WHERE s.is_verified = true`;

    const params = [];
    if (category) { params.push(`%${category}%`); query += ` AND array_to_string(s.categories, ',') ILIKE $${params.length}`; }
    if (district) { params.push(`%${district}%`); query += ` AND s.district ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (s.business_name ILIKE $${params.length} OR s.district ILIKE $${params.length} OR array_to_string(s.categories, ',') ILIKE $${params.length} OR array_to_string(s.brands, ',') ILIKE $${params.length})`;
    }

    const allowedSorts = { products: 'product_count', rating: 's.rating', orders: 'total_orders', name: 's.business_name' };
    const sortCol = allowedSorts[sort_by] || 'product_count';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_suppliers,
             COALESCE(SUM((SELECT COUNT(*) FROM input_products ip WHERE ip.supplier_id = s.id)), 0) as total_products
      FROM input_suppliers s WHERE s.is_verified = true
    `);

    res.json({
      suppliers: rows,
      stats: statsResult.rows[0] || { total_suppliers: rows.length, total_products: 0 },
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inputs/:supplierId/portfolio', async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplierResult = await pool.query('SELECT * FROM input_suppliers WHERE id = $1', [supplierId]);
    if (supplierResult.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });

    const products = await pool.query(
      'SELECT * FROM input_products WHERE supplier_id = $1 AND is_active = true ORDER BY category, name', [supplierId]
    );

    const reviews = await pool.query(
      `SELECT r.*, u.name as reviewer_name FROM input_supplier_reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.supplier_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [supplierId]
    );

    res.json({
      profile: supplierResult.rows[0],
      products: products.rows,
      reviews: reviews.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  4. LIVESTOCK GALAXY — Discover livestock sellers                         │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/livestock/directory', async (req, res) => {
  try {
    const { breed, category, district, search, sort_by = 'listings', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT l.id, l.title, l.category, l.breed, l.age_months,
             l.weight_kg, l.price, l.district, l.state,
             l.vaccination_status, l.health_certificate, l.photos,
             u.name as seller_name, l.seller_id
      FROM livestock_listings l
      JOIN users u ON u.id = l.seller_id
      WHERE l.status = 'active'`;

    const params = [];
    if (breed) { params.push(`%${breed}%`); query += ` AND l.breed ILIKE $${params.length}`; }
    if (category) { params.push(category); query += ` AND l.category = $${params.length}`; }
    if (district) { params.push(`%${district}%`); query += ` AND l.district ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (l.title ILIKE $${params.length} OR l.breed ILIKE $${params.length} OR l.district ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    const allowedSorts = { listings: 'l.created_at', price: 'l.price', weight: 'l.weight_kg', name: 'l.title' };
    const sortCol = allowedSorts[sort_by] || 'l.created_at';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_listings,
             COUNT(DISTINCT seller_id) as total_sellers,
             COUNT(DISTINCT breed) as total_breeds
      FROM livestock_listings WHERE status = 'active'
    `);

    res.json({
      listings: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/livestock/:sellerId/portfolio', async (req, res) => {
  try {
    const { sellerId } = req.params;

    const sellerResult = await pool.query(
      'SELECT id, name, phone FROM users WHERE id = $1', [sellerId]
    );
    if (sellerResult.rows.length === 0) return res.status(404).json({ error: 'Seller not found' });

    const listings = await pool.query(
      `SELECT * FROM livestock_listings WHERE seller_id = $1 AND status = 'active' ORDER BY created_at DESC`, [sellerId]
    );

    const stats = await pool.query(
      `SELECT COUNT(*) as total_listed,
              COUNT(DISTINCT breed) as breeds_available,
              AVG(price) as avg_price
       FROM livestock_listings WHERE seller_id = $1 AND status = 'active'`, [sellerId]
    );

    res.json({
      seller: sellerResult.rows[0],
      listings: listings.rows,
      stats: stats.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  5. CONTRACTS GALAXY — Discover contract farming opportunities           │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/contracts/directory', async (req, res) => {
  try {
    const { crop, state, search, sort_by = 'created', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT c.id, c.title, c.crop_name, c.buyer_company, c.state, c.district,
             c.quantity_required_mt, c.price_per_kg, c.contract_duration_months,
             c.payment_terms, c.quality_standards, c.status, c.created_at,
             u.name as buyer_name
      FROM contract_opportunities c
      LEFT JOIN users u ON c.buyer_id = u.id
      WHERE c.status = 'open'`;

    const params = [];
    if (crop) { params.push(`%${crop}%`); query += ` AND c.crop_name ILIKE $${params.length}`; }
    if (state) { params.push(state); query += ` AND c.state = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.buyer_company ILIKE $${params.length} OR c.crop_name ILIKE $${params.length} OR c.district ILIKE $${params.length})`;
    }

    const allowedSorts = { created: 'c.created_at', price: 'c.price_per_kg', quantity: 'c.quantity_required_mt', company: 'c.buyer_company' };
    const sortCol = allowedSorts[sort_by] || 'c.created_at';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_contracts,
             COUNT(DISTINCT buyer_company) as total_companies,
             COALESCE(SUM(quantity_required_mt), 0) as total_quantity_mt
      FROM contract_opportunities WHERE status = 'open'
    `);

    res.json({
      contracts: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/contracts/:contractId/detail', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contractResult = await pool.query(
      `SELECT c.*, u.name as buyer_name FROM contract_opportunities c
       LEFT JOIN users u ON c.buyer_id = u.id WHERE c.id = $1`, [contractId]
    );
    if (contractResult.rows.length === 0) return res.status(404).json({ error: 'Contract not found' });

    const applications = await pool.query(
      `SELECT COUNT(*) as total_applications FROM contract_applications WHERE contract_id = $1`, [contractId]
    );

    res.json({
      contract: contractResult.rows[0],
      application_stats: applications.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  6. EXPORTER GALAXY — Discover exporters                                 │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/exporter/directory', async (req, res) => {
  try {
    const { commodity, country, search, sort_by = 'volume', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT e.id, e.company_name, e.owner_name, e.state, e.district,
             e.commodities, e.export_countries, e.certifications,
             e.annual_export_volume_mt, e.apeda_registered, e.iec_code,
             e.rating, e.established_year
      FROM exporters e
      WHERE e.is_active = true`;

    const params = [];
    if (commodity) { params.push(`%${commodity}%`); query += ` AND array_to_string(e.commodities, ',') ILIKE $${params.length}`; }
    if (country) { params.push(`%${country}%`); query += ` AND array_to_string(e.export_countries, ',') ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.company_name ILIKE $${params.length} OR e.district ILIKE $${params.length} OR array_to_string(e.commodities, ',') ILIKE $${params.length})`;
    }

    const allowedSorts = { volume: 'e.annual_export_volume_mt', rating: 'e.rating', name: 'e.company_name', year: 'e.established_year' };
    const sortCol = allowedSorts[sort_by] || 'e.annual_export_volume_mt';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_exporters,
             COALESCE(SUM(annual_export_volume_mt), 0) as total_volume_mt,
             COUNT(DISTINCT unnest) as total_countries
      FROM exporters e, unnest(e.export_countries) WHERE e.is_active = true
    `);

    res.json({
      exporters: rows,
      stats: statsResult.rows[0] || { total_exporters: rows.length, total_volume_mt: 0, total_countries: 0 },
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/exporter/:exporterId/portfolio', async (req, res) => {
  try {
    const { exporterId } = req.params;

    const exporterResult = await pool.query('SELECT * FROM exporters WHERE id = $1', [exporterId]);
    if (exporterResult.rows.length === 0) return res.status(404).json({ error: 'Exporter not found' });

    const demands = await pool.query(
      `SELECT * FROM exporter_demands WHERE exporter_id = $1 AND status = 'active' ORDER BY created_at DESC`, [exporterId]
    );

    res.json({
      profile: exporterResult.rows[0],
      active_demands: demands.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  7. MANDI GALAXY — Discover mandis / local markets                      │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/mandi/directory', async (req, res) => {
  try {
    const { state, district, commodity, search, sort_by = 'arrivals', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT m.id, m.mandi_name, m.district, m.state, m.address,
             m.commodities_traded, m.operating_hours, m.infrastructure,
             m.avg_daily_arrivals_mt, m.contact_number, m.license_number,
             COALESCE(prices.latest_prices, 0) as price_updates_today
      FROM mandis m
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as latest_prices FROM mandi_prices
        WHERE mandi_id = m.id AND price_date = CURRENT_DATE
      ) prices ON true
      WHERE m.is_active = true`;

    const params = [];
    if (state) { params.push(state); query += ` AND m.state = $${params.length}`; }
    if (district) { params.push(`%${district}%`); query += ` AND m.district ILIKE $${params.length}`; }
    if (commodity) { params.push(`%${commodity}%`); query += ` AND array_to_string(m.commodities_traded, ',') ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (m.mandi_name ILIKE $${params.length} OR m.district ILIKE $${params.length} OR array_to_string(m.commodities_traded, ',') ILIKE $${params.length})`;
    }

    const allowedSorts = { arrivals: 'm.avg_daily_arrivals_mt', name: 'm.mandi_name', prices: 'price_updates_today' };
    const sortCol = allowedSorts[sort_by] || 'm.avg_daily_arrivals_mt';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_mandis,
             COALESCE(SUM(avg_daily_arrivals_mt), 0) as total_daily_arrivals_mt
      FROM mandis WHERE is_active = true
    `);

    res.json({
      mandis: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mandi/:mandiId/portfolio', async (req, res) => {
  try {
    const { mandiId } = req.params;

    const mandiResult = await pool.query('SELECT * FROM mandis WHERE id = $1', [mandiId]);
    if (mandiResult.rows.length === 0) return res.status(404).json({ error: 'Mandi not found' });

    const todayPrices = await pool.query(
      `SELECT * FROM mandi_prices WHERE mandi_id = $1 AND price_date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY price_date DESC, commodity`, [mandiId]
    );

    const topCommodities = await pool.query(
      `SELECT commodity, AVG(modal_price) as avg_price, COUNT(*) as days_traded
       FROM mandi_prices WHERE mandi_id = $1 AND price_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY commodity ORDER BY days_traded DESC LIMIT 10`, [mandiId]
    );

    res.json({
      profile: mandiResult.rows[0],
      recent_prices: todayPrices.rows,
      top_commodities: topCommodities.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  8. TRAINING GALAXY — Discover courses & trainers                       │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/training/directory', async (req, res) => {
  try {
    const { category, language, search, sort_by = 'enrollments', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT t.id, t.title, t.description, t.category, t.language,
             t.duration_hours, t.instructor_name, t.institution,
             t.certification_offered, t.is_free, t.fee_amount,
             t.rating, t.enrollment_count, t.thumbnail_url
      FROM training_courses t
      WHERE t.is_published = true`;

    const params = [];
    if (category) { params.push(category); query += ` AND t.category = $${params.length}`; }
    if (language) { params.push(language); query += ` AND t.language = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length} OR t.instructor_name ILIKE $${params.length} OR t.institution ILIKE $${params.length})`;
    }

    const allowedSorts = { enrollments: 't.enrollment_count', rating: 't.rating', name: 't.title', duration: 't.duration_hours' };
    const sortCol = allowedSorts[sort_by] || 't.enrollment_count';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_courses,
             COUNT(DISTINCT instructor_name) as total_instructors,
             COALESCE(SUM(enrollment_count), 0) as total_enrollments
      FROM training_courses WHERE is_published = true
    `);

    res.json({
      courses: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/training/:courseId/detail', async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseResult = await pool.query('SELECT * FROM training_courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

    const modules = await pool.query(
      'SELECT * FROM training_modules WHERE course_id = $1 ORDER BY sequence_order', [courseId]
    );

    const reviews = await pool.query(
      `SELECT r.*, u.name as reviewer_name FROM training_reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.course_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [courseId]
    );

    res.json({
      course: courseResult.rows[0],
      modules: modules.rows,
      reviews: reviews.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  9. SCHEMES GALAXY — Discover government schemes                         │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/schemes/directory', async (req, res) => {
  try {
    const { category, state, search, sort_by = 'applications', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT s.id, s.scheme_name, s.department, s.category, s.state_or_central,
             s.target_beneficiary, s.benefit_type, s.max_benefit_amount,
             s.eligibility_criteria, s.documents_required, s.deadline,
             s.application_count, s.success_rate, s.is_active
      FROM government_schemes s
      WHERE s.is_active = true`;

    const params = [];
    if (category) { params.push(category); query += ` AND s.category = $${params.length}`; }
    if (state) { params.push(state); query += ` AND (s.state_or_central = 'central' OR s.applicable_states @> ARRAY[$${params.length}]::text[])`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (s.scheme_name ILIKE $${params.length} OR s.department ILIKE $${params.length} OR s.category ILIKE $${params.length} OR s.benefit_type ILIKE $${params.length})`;
    }

    const allowedSorts = { applications: 's.application_count', benefit: 's.max_benefit_amount', name: 's.scheme_name', deadline: 's.deadline' };
    const sortCol = allowedSorts[sort_by] || 's.application_count';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_schemes,
             COALESCE(SUM(application_count), 0) as total_applications,
             COALESCE(SUM(max_benefit_amount), 0) as total_benefit_pool
      FROM government_schemes WHERE is_active = true
    `);

    res.json({
      schemes: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/schemes/:schemeId/detail', async (req, res) => {
  try {
    const { schemeId } = req.params;

    const schemeResult = await pool.query('SELECT * FROM government_schemes WHERE id = $1', [schemeId]);
    if (schemeResult.rows.length === 0) return res.status(404).json({ error: 'Scheme not found' });

    const faqs = await pool.query(
      'SELECT * FROM scheme_faqs WHERE scheme_id = $1 ORDER BY sequence_order', [schemeId]
    );

    const successStories = await pool.query(
      'SELECT * FROM scheme_success_stories WHERE scheme_id = $1 ORDER BY created_at DESC LIMIT 10', [schemeId]
    );

    res.json({
      scheme: schemeResult.rows[0],
      faqs: faqs.rows,
      success_stories: successStories.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  10. KISAN GALAXY — Discover vehicles, services, gig workers            │
// └──────────────────────────────────────────────────────────────────────────┘

router.get('/kisan/directory', async (req, res) => {
  try {
    const { type, district, search, sort_by = 'rating', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT v.id, v.vehicle_type, v.model_name, v.capacity_tons,
             v.rate_per_km, v.rate_per_hour, v.district, v.state,
             v.owner_name, v.is_available, v.rating, v.total_trips,
             v.photos
      FROM kisan_vehicles v
      WHERE v.is_active = true`;

    const params = [];
    if (type) { params.push(type); query += ` AND v.vehicle_type = $${params.length}`; }
    if (district) { params.push(`%${district}%`); query += ` AND v.district ILIKE $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (v.model_name ILIKE $${params.length} OR v.owner_name ILIKE $${params.length} OR v.district ILIKE $${params.length} OR v.vehicle_type ILIKE $${params.length})`;
    }

    const allowedSorts = { rating: 'v.rating', trips: 'v.total_trips', rate: 'v.rate_per_km', capacity: 'v.capacity_tons' };
    const sortCol = allowedSorts[sort_by] || 'v.rating';
    query += ` ORDER BY ${sortCol} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT COUNT(*) as total_vehicles,
             COUNT(CASE WHEN is_available THEN 1 END) as available_now,
             COALESCE(SUM(total_trips), 0) as total_trips_completed
      FROM kisan_vehicles WHERE is_active = true
    `);

    res.json({
      vehicles: rows,
      stats: statsResult.rows[0],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), count: rows.length }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kisan/:vehicleId/portfolio', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicleResult = await pool.query('SELECT * FROM kisan_vehicles WHERE id = $1', [vehicleId]);
    if (vehicleResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

    const reviews = await pool.query(
      `SELECT r.*, u.name as reviewer_name FROM vehicle_reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.vehicle_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [vehicleId]
    );

    const availability = await pool.query(
      `SELECT * FROM vehicle_availability WHERE vehicle_id = $1 AND date >= CURRENT_DATE ORDER BY date LIMIT 14`, [vehicleId]
    );

    res.json({
      vehicle: vehicleResult.rows[0],
      reviews: reviews.rows,
      availability: availability.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
