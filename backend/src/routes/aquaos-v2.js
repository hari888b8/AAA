const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ════════════════════════════════════════════════════════════════
// FINANCIAL TRACKING — Expenses & Revenue per pond/cycle
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v2/expenses
router.post('/expenses', authMiddleware, async (req, res) => {
  try {
    const { pond_id, crop_cycle_id, category, subcategory, amount, quantity, unit, description, expense_date } = req.body;
    if (!category || !amount) return res.status(400).json({ error: 'category and amount required' });
    const validCategories = ['feed', 'seed', 'medicine', 'labor', 'equipment', 'electricity', 'fuel', 'lime', 'probiotics', 'maintenance', 'other'];
    if (!validCategories.includes(category)) return res.status(400).json({ error: `Invalid category. Valid: ${validCategories.join(', ')}` });
    const result = await query(`
      INSERT INTO aqua_expenses (id, farmer_id, pond_id, crop_cycle_id, category, subcategory, amount, quantity, unit, description, expense_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, pond_id || null, crop_cycle_id || null, category, subcategory, amount, quantity, unit, description, expense_date || new Date().toISOString().split('T')[0]]);
    // Update crop cycle total expenses
    if (crop_cycle_id) {
      await query(`UPDATE crop_cycles SET total_expenses = COALESCE(total_expenses, 0) + $1 WHERE id = $2`, [amount, crop_cycle_id]);
    }
    res.status(201).json({ expense: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/expenses
router.get('/expenses', authMiddleware, async (req, res) => {
  try {
    const { pond_id, crop_cycle_id, category, from_date, to_date, limit = 50 } = req.query;
    let conditions = ['e.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (pond_id) { conditions.push(`e.pond_id = $${i++}`); params.push(pond_id); }
    if (crop_cycle_id) { conditions.push(`e.crop_cycle_id = $${i++}`); params.push(crop_cycle_id); }
    if (category) { conditions.push(`e.category = $${i++}`); params.push(category); }
    if (from_date) { conditions.push(`e.expense_date >= $${i++}`); params.push(from_date); }
    if (to_date) { conditions.push(`e.expense_date <= $${i++}`); params.push(to_date); }
    params.push(parseInt(limit));
    const result = await query(`
      SELECT e.*, p.pond_code FROM aqua_expenses e
      LEFT JOIN ponds p ON p.id = e.pond_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.expense_date DESC LIMIT $${i}
    `, params);
    res.json({ expenses: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v2/revenue
router.post('/revenue', authMiddleware, async (req, res) => {
  try {
    const { pond_id, crop_cycle_id, source, amount, quantity_kg, price_per_kg, buyer_name, description, revenue_date } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });
    const result = await query(`
      INSERT INTO aqua_revenue (id, farmer_id, pond_id, crop_cycle_id, source, amount, quantity_kg, price_per_kg, buyer_name, description, revenue_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, pond_id || null, crop_cycle_id || null, source || 'harvest_sale', amount, quantity_kg, price_per_kg, buyer_name, description, revenue_date || new Date().toISOString().split('T')[0]]);
    if (crop_cycle_id) {
      await query(`UPDATE crop_cycles SET total_revenue = COALESCE(total_revenue, 0) + $1 WHERE id = $2`, [amount, crop_cycle_id]);
    }
    res.status(201).json({ revenue: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/revenue
router.get('/revenue', authMiddleware, async (req, res) => {
  try {
    const { pond_id, crop_cycle_id, from_date, to_date, limit = 50 } = req.query;
    let conditions = ['r.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (pond_id) { conditions.push(`r.pond_id = $${i++}`); params.push(pond_id); }
    if (crop_cycle_id) { conditions.push(`r.crop_cycle_id = $${i++}`); params.push(crop_cycle_id); }
    if (from_date) { conditions.push(`r.revenue_date >= $${i++}`); params.push(from_date); }
    if (to_date) { conditions.push(`r.revenue_date <= $${i++}`); params.push(to_date); }
    params.push(parseInt(limit));
    const result = await query(`
      SELECT r.*, p.pond_code FROM aqua_revenue r
      LEFT JOIN ponds p ON p.id = r.pond_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.revenue_date DESC LIMIT $${i}
    `, params);
    res.json({ revenue: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/profit-summary — P&L per pond / per acre
router.get('/profit-summary', authMiddleware, async (req, res) => {
  try {
    const { pond_id, crop_cycle_id } = req.query;

    // Overall summary
    const expenses = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total,
             category, COUNT(*) AS count
      FROM aqua_expenses WHERE farmer_id = $1
      ${pond_id ? 'AND pond_id = $2' : ''}
      GROUP BY category ORDER BY total DESC
    `, pond_id ? [req.user.id, pond_id] : [req.user.id]);

    const revenue = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total,
             COALESCE(SUM(quantity_kg), 0) AS total_kg
      FROM aqua_revenue WHERE farmer_id = $1
      ${pond_id ? 'AND pond_id = $2' : ''}
    `, pond_id ? [req.user.id, pond_id] : [req.user.id]);

    const totalExpenses = expenses.rows.reduce((sum, r) => sum + parseFloat(r.total), 0);
    const totalRevenue = parseFloat(revenue.rows[0]?.total || 0);
    const totalKg = parseFloat(revenue.rows[0]?.total_kg || 0);

    // Per-pond breakdown
    const pondBreakdown = await query(`
      SELECT p.id, p.pond_code, p.area_acres, p.species,
             COALESCE((SELECT SUM(amount) FROM aqua_expenses WHERE pond_id = p.id), 0) AS expenses,
             COALESCE((SELECT SUM(amount) FROM aqua_revenue WHERE pond_id = p.id), 0) AS revenue
      FROM ponds p WHERE p.farmer_id = $1
    `, [req.user.id]);

    const pondProfits = pondBreakdown.rows.map(p => ({
      ...p,
      profit: parseFloat(p.revenue) - parseFloat(p.expenses),
      profit_per_acre: p.area_acres > 0
        ? ((parseFloat(p.revenue) - parseFloat(p.expenses)) / parseFloat(p.area_acres)).toFixed(0)
        : 0
    }));

    res.json({
      summary: {
        total_expenses: totalExpenses,
        total_revenue: totalRevenue,
        net_profit: totalRevenue - totalExpenses,
        total_harvest_kg: totalKg,
        cost_per_kg: totalKg > 0 ? (totalExpenses / totalKg).toFixed(2) : null,
        expense_breakdown: expenses.rows
      },
      pond_profits: pondProfits
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// DISEASE REPORTING
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v2/disease-reports
router.post('/disease-reports', authMiddleware, async (req, res) => {
  try {
    const { pond_id, crop_cycle_id, disease_name, symptoms, severity, affected_count, mortality_count, images, videos, notes } = req.body;
    if (!pond_id) return res.status(400).json({ error: 'pond_id required' });
    const pond = await query('SELECT id FROM ponds WHERE id=$1 AND farmer_id=$2', [pond_id, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const result = await query(`
      INSERT INTO aqua_disease_reports (id, farmer_id, pond_id, crop_cycle_id, disease_name, symptoms, severity, affected_count, mortality_count, images, videos, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [uuidv4(), req.user.id, pond_id, crop_cycle_id || null, disease_name, symptoms || [], severity || 'moderate', affected_count, mortality_count || 0, images || [], videos || [], notes]);
    res.status(201).json({ report: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/disease-reports
router.get('/disease-reports', authMiddleware, async (req, res) => {
  try {
    const { pond_id, status } = req.query;
    let conditions = ['dr.farmer_id = $1'];
    let params = [req.user.id];
    let i = 2;
    if (pond_id) { conditions.push(`dr.pond_id = $${i++}`); params.push(pond_id); }
    if (status) { conditions.push(`dr.status = $${i++}`); params.push(status); }
    const result = await query(`
      SELECT dr.*, p.pond_code, p.species FROM aqua_disease_reports dr
      JOIN ponds p ON p.id = dr.pond_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY dr.reported_at DESC
    `, params);
    res.json({ reports: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/disease-alerts — regional disease outbreaks
router.get('/disease-alerts', async (req, res) => {
  try {
    const { district_id, species } = req.query;
    const result = await query(`
      SELECT dr.disease_name, dr.severity, COUNT(*) AS report_count,
             d.name AS district_name, p.species,
             MAX(dr.reported_at) AS latest_report
      FROM aqua_disease_reports dr
      JOIN ponds p ON p.id = dr.pond_id
      LEFT JOIN aqua_farms f ON f.farmer_id = dr.farmer_id
      LEFT JOIN districts d ON d.id = f.district_id
      WHERE dr.reported_at > NOW() - INTERVAL '30 days'
        AND dr.status != 'resolved'
      GROUP BY dr.disease_name, dr.severity, d.name, p.species
      HAVING COUNT(*) >= 2
      ORDER BY report_count DESC
    `);
    res.json({ alerts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// GOVERNMENT SCHEMES (PMMSY)
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v2/schemes — available schemes info
router.get('/schemes', async (req, res) => {
  try {
    const schemes = [
      {
        id: 'pmmsy', name: 'Pradhan Mantri Matsya Sampada Yojana (PMMSY)',
        description: 'Central sector scheme for sustainable development of fisheries sector',
        subsidy_general: 40, subsidy_sc_st_women: 60,
        components: [
          { code: 'pond_construction', name: 'New Pond Construction', max_cost: 700000 },
          { code: 'pond_renovation', name: 'Pond Renovation', max_cost: 300000 },
          { code: 'hatchery', name: 'Fish/Shrimp Hatchery', max_cost: 5000000 },
          { code: 'feed_mill', name: 'Fish Feed Mill', max_cost: 2500000 },
          { code: 'cold_storage', name: 'Cold Storage Unit', max_cost: 4000000 },
          { code: 'reefer_vehicle', name: 'Refrigerated Vehicle', max_cost: 2500000 },
          { code: 'aerator', name: 'Aerators & Equipment', max_cost: 500000 },
          { code: 'biofloc', name: 'Biofloc Unit', max_cost: 800000 },
          { code: 'ras', name: 'RAS Unit', max_cost: 5000000 },
          { code: 'cage_culture', name: 'Cage Culture', max_cost: 3000000 },
          { code: 'ornamental_fish', name: 'Ornamental Fish Breeding', max_cost: 500000 },
          { code: 'seaweed_culture', name: 'Seaweed Cultivation', max_cost: 200000 },
        ],
        documents_required: ['aadhaar', 'pan', 'bank_passbook', 'land_document', 'photos', 'quotations', 'caste_certificate'],
        eligibility: 'Individual fish farmers, SHGs, FPOs, companies, SC/ST/Women get higher subsidy',
        deadline: '2025-2026 (Extended)',
      },
      {
        id: 'fidf', name: 'Fisheries and Aquaculture Infrastructure Development Fund (FIDF)',
        description: 'Concessional finance for fisheries infrastructure',
        subsidy_general: 0, interest_subvention: 3,
        components: [
          { code: 'fishing_harbour', name: 'Fishing Harbour', max_cost: 100000000 },
          { code: 'cold_chain', name: 'Cold Chain Infrastructure', max_cost: 50000000 },
          { code: 'aquaculture_park', name: 'Aquaculture Park', max_cost: 200000000 },
        ],
        documents_required: ['gst', 'company_registration', 'dpr', 'land_document'],
        eligibility: 'State governments, cooperatives, companies, entrepreneurs',
      },
    ];
    res.json({ schemes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v2/scheme-applications — create/save DPR
router.post('/scheme-applications', authMiddleware, async (req, res) => {
  try {
    const { scheme_name, scheme_component, project_title, project_cost, category, dpr_data, district_id } = req.body;
    if (!scheme_name || !project_title) return res.status(400).json({ error: 'scheme_name and project_title required' });
    const subsidyPct = category === 'sc_st_women' ? 60 : 40;
    const subsidyAmount = project_cost ? (project_cost * subsidyPct / 100) : null;
    const result = await query(`
      INSERT INTO aqua_scheme_applications (id, farmer_id, scheme_name, scheme_component, project_title, project_cost, subsidy_pct, subsidy_amount, category, dpr_data, district_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, scheme_name, scheme_component, project_title, project_cost, subsidyPct, subsidyAmount, category || 'general', JSON.stringify(dpr_data || {}), district_id]);
    res.status(201).json({ application: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/scheme-applications
router.get('/scheme-applications', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT sa.*, d.name AS district_name FROM aqua_scheme_applications sa
      LEFT JOIN districts d ON d.id = sa.district_id
      WHERE sa.farmer_id = $1 ORDER BY sa.created_at DESC
    `, [req.user.id]);
    res.json({ applications: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v2/scheme-applications/:id — update DPR / submit
router.patch('/scheme-applications/:id', authMiddleware, async (req, res) => {
  try {
    const { status, dpr_data, documents, project_cost, category } = req.body;
    const updates = ['updated_at = NOW()'];
    const values = [];
    let i = 1;
    if (status) { updates.push(`status = $${i++}`); values.push(status); }
    if (dpr_data) { updates.push(`dpr_data = $${i++}`); values.push(JSON.stringify(dpr_data)); }
    if (documents) { updates.push(`documents = $${i++}`); values.push(JSON.stringify(documents)); }
    if (project_cost) {
      updates.push(`project_cost = $${i++}`); values.push(project_cost);
      const pct = category === 'sc_st_women' ? 60 : 40;
      updates.push(`subsidy_amount = $${i++}`); values.push(project_cost * pct / 100);
    }
    if (status === 'submitted') { updates.push(`submitted_at = NOW()`); }
    values.push(req.params.id, req.user.id);
    const result = await query(`
      UPDATE aqua_scheme_applications SET ${updates.join(', ')} WHERE id = $${i++} AND farmer_id = $${i++} RETURNING *
    `, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// COLD CHAIN & LOGISTICS
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v2/logistics-providers
router.get('/logistics-providers', async (req, res) => {
  try {
    const { provider_type, district_id } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;
    if (provider_type) { conditions.push(`provider_type = $${i++}`); params.push(provider_type); }
    if (district_id) { conditions.push(`$${i++} = ANY(coverage_districts)`); params.push(parseInt(district_id)); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM aqua_logistics_providers ${where} ORDER BY rating DESC`, params);
    res.json({ providers: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v2/logistics-bookings
router.post('/logistics-bookings', authMiddleware, async (req, res) => {
  try {
    const { provider_id, listing_id, booking_type, pickup_location, delivery_location, pickup_date, quantity_kg, species, requires_cold_chain, temperature_required, notes } = req.body;
    if (!pickup_location || !delivery_location) return res.status(400).json({ error: 'pickup_location and delivery_location required' });
    const result = await query(`
      INSERT INTO aqua_logistics_bookings (id, farmer_id, provider_id, listing_id, booking_type, pickup_location, delivery_location, pickup_date, quantity_kg, species, requires_cold_chain, temperature_required, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, provider_id || null, listing_id || null, booking_type || 'transport', pickup_location, delivery_location, pickup_date, quantity_kg, species, requires_cold_chain !== false, temperature_required || 2, notes]);
    res.status(201).json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/logistics-bookings
router.get('/logistics-bookings', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT lb.*, lp.name AS provider_name FROM aqua_logistics_bookings lb
      LEFT JOIN aqua_logistics_providers lp ON lp.id = lb.provider_id
      WHERE lb.farmer_id = $1 OR lb.buyer_id = $1
      ORDER BY lb.created_at DESC
    `, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v2/logistics-bookings/:id — update status/tracking
router.patch('/logistics-bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { status, tracking_id, gps_lat, gps_long, temperature_log, price_final } = req.body;
    const updates = ['updated_at = NOW()'];
    const values = [];
    let i = 1;
    if (status) { updates.push(`status = $${i++}`); values.push(status); }
    if (tracking_id) { updates.push(`tracking_id = $${i++}`); values.push(tracking_id); }
    if (gps_lat) { updates.push(`gps_lat = $${i++}`); values.push(gps_lat); }
    if (gps_long) { updates.push(`gps_long = $${i++}`); values.push(gps_long); }
    if (temperature_log) { updates.push(`temperature_log = $${i++}`); values.push(JSON.stringify(temperature_log)); }
    if (price_final) { updates.push(`price_final = $${i++}`); values.push(price_final); }
    values.push(req.params.id);
    const result = await query(`UPDATE aqua_logistics_bookings SET ${updates.join(', ')} WHERE id = $${i++} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// TRAINING & KNOWLEDGE HUB
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v2/training
router.get('/training', async (req, res) => {
  try {
    const { category, species, difficulty } = req.query;
    let conditions = ['is_published = true'];
    let params = [];
    let i = 1;
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    if (species) { conditions.push(`$${i++} = ANY(species_tags)`); params.push(species); }
    if (difficulty) { conditions.push(`difficulty = $${i++}`); params.push(difficulty); }
    const result = await query(`
      SELECT * FROM aqua_training_modules WHERE ${conditions.join(' AND ')} ORDER BY view_count DESC, created_at DESC
    `, params);
    res.json({ modules: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/training/:id
router.get('/training/:id', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_training_modules WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Module not found' });
    await query(`UPDATE aqua_training_modules SET view_count = view_count + 1 WHERE id = $1`, [req.params.id]);
    res.json({ module: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v2/training/:id/progress — mark progress
router.post('/training/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { status, score } = req.body;
    const result = await query(`
      INSERT INTO aqua_training_progress (id, user_id, module_id, status, score, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, module_id) DO UPDATE SET status = $4, score = COALESCE($5, aqua_training_progress.score),
        completed_at = CASE WHEN $4 = 'completed' THEN NOW() ELSE aqua_training_progress.completed_at END
      RETURNING *
    `, [uuidv4(), req.user.id, req.params.id, status || 'started', score || null, status === 'completed' ? new Date() : null]);
    res.json({ progress: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/my-training — user's training progress
router.get('/my-training', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT tp.*, tm.title, tm.category, tm.difficulty, tm.duration_mins
      FROM aqua_training_progress tp
      JOIN aqua_training_modules tm ON tm.id = tp.module_id
      WHERE tp.user_id = $1
      ORDER BY tp.created_at DESC
    `, [req.user.id]);
    res.json({ progress: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// AUCTION SYSTEM
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v2/auctions — farmer creates auction
router.post('/auctions', authMiddleware, async (req, res) => {
  try {
    const { pond_id, species, quantity_kg, avg_size_g, size_count, base_price, auction_type, district_id, location_label, description, harvest_date, duration_hours } = req.body;
    if (!species || !quantity_kg || !base_price) return res.status(400).json({ error: 'species, quantity_kg, base_price required' });
    const endTime = new Date(Date.now() + (duration_hours || 24) * 3600000);
    const result = await query(`
      INSERT INTO aqua_auctions (id, farmer_id, pond_id, species, quantity_kg, avg_size_g, size_count, base_price, current_bid, auction_type, district_id, location_label, description, harvest_date, end_time)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [uuidv4(), req.user.id, pond_id || null, species, quantity_kg, avg_size_g, size_count, base_price, base_price, auction_type || 'ascending', district_id, location_label, description, harvest_date, endTime]);
    res.status(201).json({ auction: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/auctions — list active auctions
router.get('/auctions', async (req, res) => {
  try {
    const { species, district_id, status = 'active' } = req.query;
    let conditions = [`a.status = $1`, `a.end_time > NOW()`];
    let params = [status];
    let i = 2;
    if (species) { conditions.push(`a.species ILIKE $${i++}`); params.push(`%${species}%`); }
    if (district_id) { conditions.push(`a.district_id = $${i++}`); params.push(district_id); }
    const result = await query(`
      SELECT a.*, u.name AS farmer_name, d.name AS district_name,
             EXTRACT(EPOCH FROM (a.end_time - NOW())) AS seconds_remaining
      FROM aqua_auctions a
      JOIN users u ON u.id = a.farmer_id
      LEFT JOIN districts d ON d.id = a.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.end_time ASC
    `, params);
    res.json({ auctions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v2/auctions/:id/bid — place bid
router.post('/auctions/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { bid_amount, message } = req.body;
    if (!bid_amount) return res.status(400).json({ error: 'bid_amount required' });
    const auction = await query(`SELECT * FROM aqua_auctions WHERE id = $1 AND status = 'active' AND end_time > NOW()`, [req.params.id]);
    if (!auction.rows.length) return res.status(404).json({ error: 'Auction not found or ended' });
    const a = auction.rows[0];
    if (a.farmer_id === req.user.id) return res.status(400).json({ error: 'Cannot bid on own auction' });
    if (a.auction_type === 'ascending' && bid_amount <= parseFloat(a.current_bid)) {
      return res.status(400).json({ error: `Bid must be higher than current bid ₹${a.current_bid}` });
    }
    const bid = await query(`
      INSERT INTO aqua_auction_bids (id, auction_id, bidder_id, bid_amount, message)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, bid_amount, message]);
    // Update auction current bid
    await query(`UPDATE aqua_auctions SET current_bid = $1, bid_count = bid_count + 1 WHERE id = $2`, [bid_amount, req.params.id]);
    res.status(201).json({ bid: bid.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/auctions/:id/bids
router.get('/auctions/:id/bids', async (req, res) => {
  try {
    const result = await query(`
      SELECT ab.*, u.name AS bidder_name FROM aqua_auction_bids ab
      JOIN users u ON u.id = ab.bidder_id
      WHERE ab.auction_id = $1
      ORDER BY ab.bid_amount DESC
    `, [req.params.id]);
    res.json({ bids: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v2/auctions/:id — end auction / accept winner
router.patch('/auctions/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const auction = await query(`SELECT * FROM aqua_auctions WHERE id = $1 AND farmer_id = $2`, [req.params.id, req.user.id]);
    if (!auction.rows.length) return res.status(404).json({ error: 'Auction not found' });
    if (status === 'completed') {
      // Find highest bidder
      const topBid = await query(`SELECT * FROM aqua_auction_bids WHERE auction_id = $1 ORDER BY bid_amount DESC LIMIT 1`, [req.params.id]);
      const winnerId = topBid.rows[0]?.bidder_id || null;
      const winningBid = topBid.rows[0]?.bid_amount || null;
      await query(`UPDATE aqua_auctions SET status = 'completed', winner_id = $1, winning_bid = $2 WHERE id = $3`, [winnerId, winningBid, req.params.id]);
      return res.json({ auction: { ...auction.rows[0], status: 'completed', winner_id: winnerId, winning_bid: winningBid } });
    }
    await query(`UPDATE aqua_auctions SET status = $1 WHERE id = $2`, [status, req.params.id]);
    res.json({ auction: { ...auction.rows[0], status } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FARM BENCHMARKING
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v2/benchmarks
router.get('/benchmarks', async (req, res) => {
  try {
    const { species } = req.query;
    let conditions = [];
    let params = [];
    if (species) { conditions.push(`species ILIKE $1`); params.push(`%${species}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM aqua_benchmarks ${where} ORDER BY species, metric`, params);
    res.json({ benchmarks: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/my-benchmarks — compare farmer's farm to regional averages
router.get('/my-benchmarks', authMiddleware, async (req, res) => {
  try {
    const ponds = await query(`
      SELECT p.species, p.survival_pct, p.area_acres,
             cc.total_feed_kg, cc.seed_count,
             EXTRACT(EPOCH FROM (NOW() - cc.stocking_date))/86400 AS doc,
             p.avg_weight_g
      FROM ponds p
      LEFT JOIN crop_cycles cc ON cc.pond_id = p.id AND cc.status = 'active'
      WHERE p.farmer_id = $1 AND p.status = 'active'
    `, [req.user.id]);

    const comparisons = [];
    for (const p of ponds.rows) {
      if (!p.species) continue;
      const benchmarks = await query(`SELECT metric, avg_value, top_quartile FROM aqua_benchmarks WHERE species ILIKE $1`, [`%${p.species.split(' ')[0]}%`]);
      const myFcr = p.total_feed_kg > 0 && p.avg_weight_g > 0 && p.seed_count > 0
        ? (p.total_feed_kg / ((p.seed_count * (p.survival_pct || 80) / 100 * p.avg_weight_g) / 1000))
        : null;
      const comparison = {
        species: p.species,
        my_metrics: { fcr: myFcr ? parseFloat(myFcr.toFixed(2)) : null, survival_rate: p.survival_pct },
        regional_benchmarks: benchmarks.rows.reduce((acc, b) => { acc[b.metric] = { avg: parseFloat(b.avg_value), top_quartile: parseFloat(b.top_quartile) }; return acc; }, {})
      };
      comparisons.push(comparison);
    }
    res.json({ comparisons });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// BULK ORDERS (Input Marketplace)
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v2/bulk-orders
router.post('/bulk-orders', authMiddleware, async (req, res) => {
  try {
    const { product_id, product_name, supplier_id, quantity, unit, requested_price, delivery_date, delivery_address, notes } = req.body;
    if (!quantity) return res.status(400).json({ error: 'quantity required' });
    const result = await query(`
      INSERT INTO aqua_bulk_orders (id, buyer_id, supplier_id, product_id, product_name, quantity, unit, requested_price, delivery_date, delivery_address, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, supplier_id || null, product_id || null, product_name, quantity, unit || 'kg', requested_price, delivery_date, delivery_address, notes]);
    res.status(201).json({ order: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v2/bulk-orders
router.get('/bulk-orders', authMiddleware, async (req, res) => {
  try {
    const { role = 'buyer' } = req.query;
    const condition = role === 'supplier' ? 'bo.supplier_id = $1' : 'bo.buyer_id = $1';
    const result = await query(`
      SELECT bo.*, u.name AS supplier_name, ap.name AS product_display_name
      FROM aqua_bulk_orders bo
      LEFT JOIN users u ON u.id = bo.supplier_id
      LEFT JOIN aqua_products ap ON ap.id = bo.product_id
      WHERE ${condition}
      ORDER BY bo.created_at DESC
    `, [req.user.id]);
    res.json({ orders: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v2/bulk-orders/:id — supplier responds
router.patch('/bulk-orders/:id', authMiddleware, async (req, res) => {
  try {
    const { status, quoted_price, delivery_date, notes } = req.body;
    const updates = ['updated_at = NOW()'];
    const values = [];
    let i = 1;
    if (status) { updates.push(`status = $${i++}`); values.push(status); }
    if (quoted_price) { updates.push(`quoted_price = $${i++}`); values.push(quoted_price); }
    if (delivery_date) { updates.push(`delivery_date = $${i++}`); values.push(delivery_date); }
    if (notes) { updates.push(`notes = $${i++}`); values.push(notes); }
    values.push(req.params.id);
    const result = await query(`UPDATE aqua_bulk_orders SET ${updates.join(', ')} WHERE id = $${i++} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// KPI ENGINE — Advanced calculations
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v2/kpi/:pondId — detailed KPIs for a pond
router.get('/kpi/:pondId', authMiddleware, async (req, res) => {
  try {
    const pond = await query('SELECT * FROM ponds WHERE id = $1 AND farmer_id = $2', [req.params.pondId, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const p = pond.rows[0];

    const cycle = await query(`SELECT * FROM crop_cycles WHERE pond_id = $1 AND status = 'active' LIMIT 1`, [req.params.pondId]);
    const c = cycle.rows[0];

    const samples = await query(`SELECT * FROM growth_samples WHERE pond_id = $1 ORDER BY sampled_at ASC`, [req.params.pondId]);
    const feedLogs = await query(`SELECT SUM(quantity_kg) AS total_feed, SUM(cost) AS total_feed_cost FROM feed_logs WHERE pond_id = $1`, [req.params.pondId]);

    const doc = p.stocking_date ? Math.floor((Date.now() - new Date(p.stocking_date).getTime()) / 86400000) : 0;
    const seedCount = c?.seed_count || p.stocked_count || 0;
    const survivalPct = p.survival_pct || 80;
    const currentWeight = p.avg_weight_g || 0;
    const totalFeed = parseFloat(feedLogs.rows[0]?.total_feed || 0);
    const currentBiomassKg = (seedCount * survivalPct / 100 * currentWeight) / 1000;

    // FCR
    const initialWeight = samples.rows.length > 0 ? parseFloat(samples.rows[0].avg_weight_g || 0) : 0;
    const weightGainKg = currentBiomassKg - (seedCount * survivalPct / 100 * initialWeight / 1000);
    const fcr = weightGainKg > 0 ? (totalFeed / weightGainKg) : null;

    // SGR (most recent sampling interval)
    let sgr = null;
    if (samples.rows.length >= 2) {
      const latest = samples.rows[samples.rows.length - 1];
      const prev = samples.rows[samples.rows.length - 2];
      const days = (new Date(latest.sampled_at) - new Date(prev.sampled_at)) / 86400000;
      if (days > 0 && latest.avg_weight_g > 0 && prev.avg_weight_g > 0) {
        sgr = ((Math.log(latest.avg_weight_g) - Math.log(prev.avg_weight_g)) / days) * 100;
      }
    }

    // ADG
    const adg = doc > 0 ? ((currentWeight - initialWeight) / doc) : 0;

    // Survival Rate
    const survivalRate = seedCount > 0 ? survivalPct : null;

    // Production per acre
    const productionPerAcre = p.area_acres > 0 ? (currentBiomassKg / parseFloat(p.area_acres)) : null;

    // Cost per kg
    const totalFeedCost = parseFloat(feedLogs.rows[0]?.total_feed_cost || 0);
    const totalExpenses = c?.total_expenses || totalFeedCost;
    const costPerKg = currentBiomassKg > 0 ? (totalExpenses / currentBiomassKg) : null;

    res.json({
      kpi: {
        pond_code: p.pond_code, species: p.species, doc,
        seed_count: seedCount, current_weight_g: currentWeight,
        current_biomass_kg: Math.round(currentBiomassKg),
        fcr: fcr ? parseFloat(fcr.toFixed(2)) : null,
        sgr: sgr ? parseFloat(sgr.toFixed(3)) : null,
        adg: parseFloat(adg.toFixed(2)),
        survival_rate: survivalRate,
        production_per_acre_kg: productionPerAcre ? Math.round(productionPerAcre) : null,
        total_feed_kg: totalFeed,
        total_feed_cost: totalFeedCost,
        cost_per_kg: costPerKg ? parseFloat(costPerKg.toFixed(2)) : null,
        growth_history: samples.rows.map(s => ({ date: s.sampled_at, weight_g: s.avg_weight_g }))
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
