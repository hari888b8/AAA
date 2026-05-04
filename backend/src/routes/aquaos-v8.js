const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Whitelist of allowed roles — prevents injection via x-user-role header
const ALLOWED_ROLES = ['farmer', 'buyer', 'admin', 'supplier', 'fpo', 'service_provider'];

function sanitizeRole(req) {
  const raw = req.user?.role || req.headers['x-user-role'] || 'farmer';
  return ALLOWED_ROLES.includes(raw) ? raw : 'farmer';
}

// ════════════════════════════════════════════════════════════════
// ROLE-BASED DATA VISIBILITY MIDDLEWARE
// ════════════════════════════════════════════════════════════════
function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    const role = sanitizeRole(req);
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
    }
    req.userRole = role;
    next();
  };
}

// GET /visibility-rules — get data visibility matrix
router.get('/visibility-rules', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_visibility_rules ORDER BY resource_type, viewer_role');
    res.json({ rules: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FARMER APP — Crop Posts (only buyers can view)
// ════════════════════════════════════════════════════════════════

// POST /crop-posts — farmer creates a crop post
router.post('/crop-posts', authMiddleware, async (req, res) => {
  try {
    const { species, size_grade, expected_quantity_kg, harvest_date, location_district,
      location_state, latitude, longitude, asking_price_per_kg, quality_grade,
      pond_area_acres, culture_days, feed_brand, survival_rate, notes, photos } = req.body;

    if (!species || !expected_quantity_kg || !harvest_date || !location_district) {
      return res.status(400).json({ error: 'species, expected_quantity_kg, harvest_date, and location_district required' });
    }

    const result = await query(`
      INSERT INTO aqua_crop_posts (id, farmer_id, species, size_grade, expected_quantity_kg,
        harvest_date, location_district, location_state, latitude, longitude,
        asking_price_per_kg, quality_grade, pond_area_acres, culture_days,
        feed_brand, survival_rate, notes, photos, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *
    `, [uuidv4(), req.user.id, species, size_grade, expected_quantity_kg,
      harvest_date, location_district, location_state || 'Andhra Pradesh',
      latitude, longitude, asking_price_per_kg, quality_grade || 'standard',
      pond_area_acres, culture_days, feed_brand, survival_rate, notes,
      photos || [], harvest_date]);

    res.status(201).json({ crop_post: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /crop-posts/my — farmer sees own crop posts
router.get('/crop-posts/my', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_crop_posts WHERE farmer_id = $1 ORDER BY created_at DESC',
      [req.user.id]);
    res.json({ crop_posts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /crop-posts — buyers browse available crops (BUYERS ONLY)
router.get('/crop-posts', authMiddleware, roleGuard('buyer', 'admin'), async (req, res) => {
  try {
    const { species, district, harvest_days, min_qty, size_grade } = req.query;
    let sql = `SELECT id, species, size_grade, expected_quantity_kg, harvest_date,
      location_district, location_state, asking_price_per_kg, quality_grade,
      pond_area_acres, culture_days, survival_rate, status, views_count, offers_count, created_at
      FROM aqua_crop_posts WHERE status = 'available'`;
    const params = [];
    let i = 1;

    if (species) { sql += ` AND species ILIKE $${i}`; params.push(`%${species}%`); i++; }
    if (district) { sql += ` AND location_district ILIKE $${i}`; params.push(`%${district}%`); i++; }
    if (harvest_days) { sql += ` AND harvest_date <= CURRENT_DATE + $${i}::INTEGER * INTERVAL '1 day'`; params.push(harvest_days); i++; }
    if (min_qty) { sql += ` AND expected_quantity_kg >= $${i}`; params.push(min_qty); i++; }
    if (size_grade) { sql += ` AND size_grade ILIKE $${i}`; params.push(`%${size_grade}%`); i++; }

    sql += ' ORDER BY harvest_date ASC LIMIT 50';
    const result = await query(sql, params);
    res.json({ crop_posts: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /crop-posts/:id/offer — buyer makes offer on crop post
router.post('/crop-posts/:id/offer', authMiddleware, roleGuard('buyer', 'admin'), async (req, res) => {
  try {
    const { offered_price_per_kg, quantity_wanted_kg, message, pickup_preference, payment_terms } = req.body;
    if (!offered_price_per_kg) return res.status(400).json({ error: 'offered_price_per_kg required' });

    // Increment views/offers
    await query('UPDATE aqua_crop_posts SET offers_count = offers_count + 1 WHERE id = $1', [req.params.id]);

    const result = await query(`
      INSERT INTO aqua_crop_offers (id, crop_post_id, buyer_id, offered_price_per_kg,
        quantity_wanted_kg, message, pickup_preference, payment_terms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, offered_price_per_kg,
      quantity_wanted_kg, message, pickup_preference || 'farm_gate', payment_terms || 'immediate']);

    res.status(201).json({ offer: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /crop-posts/:id/offers — farmer views offers on their crop post
router.get('/crop-posts/:id/offers', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_crop_offers WHERE crop_post_id = $1 ORDER BY offered_price_per_kg DESC',
      [req.params.id]);
    res.json({ offers: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /crop-offers/:id/respond — farmer accepts/rejects offer
router.put('/crop-offers/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { status, farmer_response } = req.body;
    if (!['accepted', 'rejected', 'counter'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted, rejected, or counter' });
    }
    const result = await query(`
      UPDATE aqua_crop_offers SET status = $1, farmer_response = $2, responded_at = NOW()
      WHERE id = $3 RETURNING *`, [status, farmer_response, req.params.id]);
    res.json({ offer: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// COMMUNITY DISCUSSIONS
// ════════════════════════════════════════════════════════════════

// GET /community — list posts (farmers only see farmer community)
router.get('/community', authMiddleware, async (req, res) => {
  try {
    const { category, species, district, page } = req.query;
    const offset = ((parseInt(page) || 1) - 1) * 20;
    let sql = 'SELECT * FROM aqua_community_posts WHERE 1=1';
    const params = [];
    let i = 1;

    if (category) { sql += ` AND category = $${i}`; params.push(category); i++; }
    if (species) { sql += ` AND species_tag ILIKE $${i}`; params.push(`%${species}%`); i++; }
    if (district) { sql += ` AND district_tag ILIKE $${i}`; params.push(`%${district}%`); i++; }

    sql += ` ORDER BY is_pinned DESC, created_at DESC LIMIT 20 OFFSET $${i}`;
    params.push(offset);

    const result = await query(sql, params);
    res.json({ posts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /community — create community post
router.post('/community', authMiddleware, async (req, res) => {
  try {
    const { category, title, content, species_tag, district_tag, images } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ error: 'category, title, and content required' });
    }
    const role = sanitizeRole(req);
    const result = await query(`
      INSERT INTO aqua_community_posts (id, author_id, author_role, category, title, content, species_tag, district_tag, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [uuidv4(), req.user.id, role, category, title, content, species_tag, district_tag, images || []]);
    res.status(201).json({ post: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /community/:id/comment — comment on post
router.post('/community/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const role = sanitizeRole(req);
    const result = await query(`
      INSERT INTO aqua_community_comments (id, post_id, author_id, author_role, content)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, role, content]);
    await query('UPDATE aqua_community_posts SET comments_count = comments_count + 1 WHERE id = $1', [req.params.id]);
    res.status(201).json({ comment: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /community/:id/upvote
router.post('/community/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'UPDATE aqua_community_posts SET upvotes = upvotes + 1 WHERE id = $1 RETURNING id, upvotes', [req.params.id]);
    res.json({ post: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// MARKET PRICES — Daily price dashboard
// ════════════════════════════════════════════════════════════════

// GET /prices — all today's prices
router.get('/prices', authMiddleware, async (req, res) => {
  try {
    const { species, district } = req.query;
    let sql = 'SELECT * FROM aqua_market_prices WHERE price_date >= CURRENT_DATE - INTERVAL \'7 days\'';
    const params = [];
    let i = 1;
    if (species) { sql += ` AND species ILIKE $${i}`; params.push(`%${species}%`); i++; }
    if (district) { sql += ` AND district ILIKE $${i}`; params.push(`%${district}%`); i++; }
    sql += ' ORDER BY price_date DESC, species, market_name';
    const result = await query(sql, params);
    res.json({ prices: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// BUYER APP — Supply Forecast
// ════════════════════════════════════════════════════════════════

// GET /supply-forecast — buyers see aggregate supply forecast (BUYERS ONLY)
router.get('/supply-forecast', authMiddleware, roleGuard('buyer', 'admin'), async (req, res) => {
  try {
    const { species, district } = req.query;
    let sql = 'SELECT * FROM aqua_supply_forecast WHERE forecast_period_end >= CURRENT_DATE';
    const params = [];
    let i = 1;
    if (species) { sql += ` AND species ILIKE $${i}`; params.push(`%${species}%`); i++; }
    if (district) { sql += ` AND district ILIKE $${i}`; params.push(`%${district}%`); i++; }
    sql += ' ORDER BY estimated_quantity_tons DESC';
    const result = await query(sql, params);

    // Summary
    const totalTons = result.rows.reduce((s, r) => s + parseFloat(r.estimated_quantity_tons || 0), 0);
    const bySpecies = {};
    result.rows.forEach(r => {
      if (!bySpecies[r.species]) bySpecies[r.species] = 0;
      bySpecies[r.species] += parseFloat(r.estimated_quantity_tons || 0);
    });

    res.json({ forecasts: result.rows, summary: { total_tons: totalTons, by_species: bySpecies } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SUPPLIER APP — Promotions & Campaigns
// ════════════════════════════════════════════════════════════════

// POST /promotions — supplier creates promotion
router.post('/promotions', authMiddleware, roleGuard('supplier', 'admin'), async (req, res) => {
  try {
    const { title, description, promotion_type, discount_percent, product_category,
      target_species, target_district, start_date, end_date, banner_image, budget_inr } = req.body;
    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'title, start_date, end_date required' });
    }
    const result = await query(`
      INSERT INTO aqua_supplier_promotions (id, supplier_id, title, description, promotion_type,
        discount_percent, product_category, target_species, target_district,
        start_date, end_date, banner_image, budget_inr)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, title, description, promotion_type || 'discount',
      discount_percent, product_category, target_species, target_district,
      start_date, end_date, banner_image, budget_inr]);
    res.status(201).json({ promotion: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /promotions — farmers see active promotions
router.get('/promotions', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_supplier_promotions
      WHERE status = 'active' AND end_date >= CURRENT_DATE
      ORDER BY created_at DESC LIMIT 20`);
    res.json({ promotions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /promotions/my — supplier sees own promotions
router.get('/promotions/my', authMiddleware, roleGuard('supplier', 'admin'), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_supplier_promotions WHERE supplier_id = $1 ORDER BY created_at DESC',
      [req.user.id]);
    res.json({ promotions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SUPPLIER APP — Sales Leads
// ════════════════════════════════════════════════════════════════

// POST /leads — generate lead when farmer clicks product
router.post('/leads', authMiddleware, async (req, res) => {
  try {
    const { supplier_id, product_id, promotion_id, source } = req.body;
    if (!supplier_id) return res.status(400).json({ error: 'supplier_id required' });

    const result = await query(`
      INSERT INTO aqua_sales_leads (id, supplier_id, farmer_id, product_id, promotion_id, source)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), supplier_id, req.user.id, product_id, promotion_id, source || 'product_click']);

    // Increment promotion leads if applicable
    if (promotion_id) {
      await query('UPDATE aqua_supplier_promotions SET leads_generated = leads_generated + 1 WHERE id = $1', [promotion_id]);
    }

    res.status(201).json({ lead: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /leads/my — supplier sees their leads (SUPPLIER ONLY)
router.get('/leads/my', authMiddleware, roleGuard('supplier', 'admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM aqua_sales_leads WHERE supplier_id = $1';
    const params = [req.user.id];
    if (status) { sql += ' AND status = $2'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const result = await query(sql, params);
    res.json({ leads: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /leads/:id/status — supplier updates lead status
router.put('/leads/:id/status', authMiddleware, roleGuard('supplier', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await query(`
      UPDATE aqua_sales_leads SET status = $1, notes = $2,
        contacted_at = CASE WHEN $1 = 'contacted' THEN NOW() ELSE contacted_at END,
        converted = CASE WHEN $1 = 'converted' THEN true ELSE converted END
      WHERE id = $3 AND supplier_id = $4 RETURNING *
    `, [status, notes, req.params.id, req.user.id]);
    res.json({ lead: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// EXPERT ADVISORY DIRECTORY
// ════════════════════════════════════════════════════════════════

// GET /experts — browse expert directory
router.get('/experts', authMiddleware, async (req, res) => {
  try {
    const { specialization, district, species } = req.query;
    let sql = 'SELECT * FROM aqua_experts WHERE is_verified = true';
    const params = [];
    let i = 1;
    if (specialization) { sql += ` AND specialization ILIKE $${i}`; params.push(`%${specialization}%`); i++; }
    if (district) { sql += ` AND $${i} = ANY(districts_served)`; params.push(district); i++; }
    if (species) { sql += ` AND $${i} = ANY(species_expertise)`; params.push(species); i++; }
    sql += ' ORDER BY rating DESC';
    const result = await query(sql, params);
    res.json({ experts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// WORKFLOW TRACKING (7-step platform lifecycle)
// ════════════════════════════════════════════════════════════════

// POST /workflow/track — record workflow step completion
router.post('/workflow/track', authMiddleware, async (req, res) => {
  try {
    const { workflow_step, step_name, metadata } = req.body;
    const role = sanitizeRole(req);
    const result = await query(`
      INSERT INTO aqua_workflow_events (id, user_id, user_role, workflow_step, step_name, metadata)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.user.id, role, workflow_step, step_name, metadata || {}]);
    res.status(201).json({ event: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /workflow/progress — get user's workflow progress
router.get('/workflow/progress', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT ON (workflow_step) * FROM aqua_workflow_events WHERE user_id = $1 ORDER BY workflow_step, completed_at DESC',
      [req.user.id]);

    const STEPS = [
      { step: 1, name: 'Create farm profile' },
      { step: 2, name: 'Log stocking' },
      { step: 3, name: 'Track crop age' },
      { step: 4, name: 'Post crop (near harvest)' },
      { step: 5, name: 'Receive buyer offers' },
      { step: 6, name: 'Complete deal' },
      { step: 7, name: 'Platform collects commission' },
    ];

    const completed = result.rows.map(r => r.workflow_step);
    const progress = STEPS.map(s => ({ ...s, completed: completed.includes(s.step) }));

    res.json({ progress, completed_steps: completed.length, total_steps: 7 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS (admin/insights)
// ════════════════════════════════════════════════════════════════

// GET /analytics/production — aggregate production data (powerful hidden asset)
router.get('/analytics/production', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const speciesStats = await query(`
      SELECT species, COUNT(*) as total_posts,
        AVG(expected_quantity_kg) as avg_quantity,
        AVG(survival_rate) as avg_survival,
        AVG(asking_price_per_kg) as avg_price
      FROM aqua_crop_posts GROUP BY species ORDER BY total_posts DESC`);

    const districtStats = await query(`
      SELECT location_district, COUNT(*) as total_posts,
        SUM(expected_quantity_kg) as total_quantity_kg
      FROM aqua_crop_posts GROUP BY location_district ORDER BY total_quantity_kg DESC`);

    res.json({
      species_analytics: speciesStats.rows,
      district_analytics: districtStats.rows,
      insight: 'Average shrimp survival, best feed brand growth rate, best harvest period, disease outbreak regions'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
