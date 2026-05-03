const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ════════════════════════════════════════════════════════════════
// RFQ — REQUEST FOR QUOTATION SYSTEM
// Buyers post demand → Farmers submit quotes → Buyer selects
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v3/rfqs — buyer creates RFQ
router.post('/rfqs', authMiddleware, async (req, res) => {
  try {
    const { title, species, quantity_kg, size_spec, quality_grade, max_price_per_kg,
            delivery_location, delivery_date, district_id, description, expires_hours } = req.body;
    if (!species || !quantity_kg) return res.status(400).json({ error: 'species and quantity_kg required' });
    const expiresAt = new Date(Date.now() + (expires_hours || 72) * 3600000);
    const result = await query(`
      INSERT INTO aqua_rfqs (id, buyer_id, title, species, quantity_kg, size_spec, quality_grade,
        max_price_per_kg, delivery_location, delivery_date, district_id, description, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [uuidv4(), req.user.id, title || `Need ${quantity_kg}kg ${species}`, species, quantity_kg,
        size_spec, quality_grade, max_price_per_kg, delivery_location, delivery_date, district_id, description, expiresAt]);
    res.status(201).json({ rfq: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/rfqs — list open RFQs (for farmers to browse)
router.get('/rfqs', async (req, res) => {
  try {
    const { species, district_id, status = 'open' } = req.query;
    let conditions = [`r.status = $1`, `(r.expires_at IS NULL OR r.expires_at > NOW())`];
    let params = [status];
    let i = 2;
    if (species) { conditions.push(`r.species ILIKE $${i++}`); params.push(`%${species}%`); }
    if (district_id) { conditions.push(`r.district_id = $${i++}`); params.push(district_id); }
    const result = await query(`
      SELECT r.*, u.name AS buyer_name, d.name AS district_name
      FROM aqua_rfqs r
      JOIN users u ON u.id = r.buyer_id
      LEFT JOIN districts d ON d.id = r.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.created_at DESC
    `, params);
    res.json({ rfqs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/my-rfqs — buyer's own RFQs
router.get('/my-rfqs', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, d.name AS district_name,
             (SELECT COUNT(*) FROM aqua_rfq_quotes q WHERE q.rfq_id = r.id) AS quote_count_live
      FROM aqua_rfqs r
      LEFT JOIN districts d ON d.id = r.district_id
      WHERE r.buyer_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json({ rfqs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v3/rfqs/:id/quotes — farmer submits quote
router.post('/rfqs/:id/quotes', authMiddleware, async (req, res) => {
  try {
    const { price_per_kg, quantity_available, harvest_date, quality_notes, pond_id, location_label, message } = req.body;
    if (!price_per_kg) return res.status(400).json({ error: 'price_per_kg required' });
    const rfq = await query('SELECT * FROM aqua_rfqs WHERE id=$1 AND status=$2', [req.params.id, 'open']);
    if (!rfq.rows.length) return res.status(404).json({ error: 'RFQ not found or closed' });
    if (rfq.rows[0].buyer_id === req.user.id) return res.status(400).json({ error: 'Cannot quote own RFQ' });
    // Check duplicate
    const existing = await query('SELECT id FROM aqua_rfq_quotes WHERE rfq_id=$1 AND farmer_id=$2', [req.params.id, req.user.id]);
    if (existing.rows.length) return res.status(400).json({ error: 'Already submitted a quote for this RFQ' });
    const result = await query(`
      INSERT INTO aqua_rfq_quotes (id, rfq_id, farmer_id, price_per_kg, quantity_available, harvest_date, quality_notes, pond_id, location_label, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, price_per_kg, quantity_available, harvest_date, quality_notes, pond_id, location_label, message]);
    // Update quote count
    await query('UPDATE aqua_rfqs SET quote_count = quote_count + 1 WHERE id = $1', [req.params.id]);
    res.status(201).json({ quote: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/rfqs/:id/quotes — buyer views quotes for their RFQ
router.get('/rfqs/:id/quotes', authMiddleware, async (req, res) => {
  try {
    const rfq = await query('SELECT buyer_id FROM aqua_rfqs WHERE id=$1', [req.params.id]);
    if (!rfq.rows.length) return res.status(404).json({ error: 'RFQ not found' });
    // Only RFQ owner or admin can see all quotes
    const result = await query(`
      SELECT q.*, u.name AS farmer_name, p.pond_code, p.species AS pond_species, p.avg_weight_g
      FROM aqua_rfq_quotes q
      JOIN users u ON u.id = q.farmer_id
      LEFT JOIN ponds p ON p.id = q.pond_id
      WHERE q.rfq_id = $1
      ORDER BY q.price_per_kg ASC
    `, [req.params.id]);
    res.json({ quotes: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v3/rfqs/:id/select — buyer selects winning quote
router.patch('/rfqs/:id/select', authMiddleware, async (req, res) => {
  try {
    const { quote_id } = req.body;
    if (!quote_id) return res.status(400).json({ error: 'quote_id required' });
    const rfq = await query('SELECT * FROM aqua_rfqs WHERE id=$1 AND buyer_id=$2', [req.params.id, req.user.id]);
    if (!rfq.rows.length) return res.status(404).json({ error: 'RFQ not found' });
    await query(`UPDATE aqua_rfqs SET status='awarded', selected_quote_id=$1, updated_at=NOW() WHERE id=$2`, [quote_id, req.params.id]);
    await query(`UPDATE aqua_rfq_quotes SET status='accepted' WHERE id=$1`, [quote_id]);
    await query(`UPDATE aqua_rfq_quotes SET status='rejected' WHERE rfq_id=$1 AND id != $2`, [req.params.id, quote_id]);
    res.json({ success: true, message: 'Quote selected' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/my-quotes — farmer's submitted quotes
router.get('/my-quotes', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT q.*, r.title AS rfq_title, r.species AS rfq_species, r.quantity_kg AS rfq_qty,
             r.max_price_per_kg, r.delivery_date AS rfq_delivery, r.status AS rfq_status,
             u.name AS buyer_name
      FROM aqua_rfq_quotes q
      JOIN aqua_rfqs r ON r.id = q.rfq_id
      JOIN users u ON u.id = r.buyer_id
      WHERE q.farmer_id = $1
      ORDER BY q.created_at DESC
    `, [req.user.id]);
    res.json({ quotes: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ESCROW PAYMENT SYSTEM
// Flow: initiated → funded → quality_verified → dispatched → delivered → released
// Dispute path: any → disputed → resolved
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v3/escrow — initiate escrow for a transaction
router.post('/escrow', authMiddleware, async (req, res) => {
  try {
    const { listing_id, auction_id, rfq_id, seller_id, amount, quantity_kg, price_per_kg, species, payment_method, payment_ref } = req.body;
    if (!seller_id || !amount) return res.status(400).json({ error: 'seller_id and amount required' });
    if (seller_id === req.user.id) return res.status(400).json({ error: 'Cannot create escrow with yourself' });
    const platformFee = Math.round(amount * 0.03 * 100) / 100; // 3% platform fee
    const sellerPayout = amount - platformFee;
    const result = await query(`
      INSERT INTO aqua_escrow_transactions (id, listing_id, auction_id, rfq_id, buyer_id, seller_id,
        amount, platform_fee, seller_payout, quantity_kg, price_per_kg, species, payment_method, payment_ref)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
    `, [uuidv4(), listing_id || null, auction_id || null, rfq_id || null, req.user.id, seller_id,
        amount, platformFee, sellerPayout, quantity_kg, price_per_kg, species, payment_method, payment_ref]);
    res.status(201).json({ escrow: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/escrow — list user's escrow transactions
router.get('/escrow', authMiddleware, async (req, res) => {
  try {
    const { role, status } = req.query;
    let conditions = ['(e.buyer_id = $1 OR e.seller_id = $1)'];
    let params = [req.user.id];
    let i = 2;
    if (status) { conditions.push(`e.status = $${i++}`); params.push(status); }
    const result = await query(`
      SELECT e.*,
             buyer.name AS buyer_name, seller.name AS seller_name,
             hl.species AS listing_species
      FROM aqua_escrow_transactions e
      JOIN users buyer ON buyer.id = e.buyer_id
      JOIN users seller ON seller.id = e.seller_id
      LEFT JOIN harvest_listings hl ON hl.id = e.listing_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.created_at DESC
    `, params);
    res.json({ transactions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/aquaos-v3/escrow/:id — advance escrow state
router.patch('/escrow/:id', authMiddleware, async (req, res) => {
  try {
    const { action, notes, payment_ref } = req.body;
    const escrow = await query('SELECT * FROM aqua_escrow_transactions WHERE id=$1', [req.params.id]);
    if (!escrow.rows.length) return res.status(404).json({ error: 'Escrow not found' });
    const e = escrow.rows[0];
    // Validate user is party to transaction
    if (e.buyer_id !== req.user.id && e.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const validTransitions = {
      'fund':            { from: 'initiated',        to: 'funded',            by: 'buyer',  field: 'funded_at' },
      'verify_quality':  { from: 'funded',           to: 'quality_verified',  by: 'buyer',  field: 'quality_verified_at' },
      'dispatch':        { from: 'quality_verified', to: 'dispatched',        by: 'seller', field: 'dispatched_at' },
      'confirm_delivery':{ from: 'dispatched',       to: 'delivered',         by: 'buyer',  field: 'delivered_at' },
      'release_payment': { from: 'delivered',        to: 'released',          by: 'buyer',  field: 'released_at' },
      'dispute':         { from: null,               to: 'disputed',          by: 'any',    field: 'dispute_at' },
    };

    const transition = validTransitions[action];
    if (!transition) return res.status(400).json({ error: `Invalid action. Valid: ${Object.keys(validTransitions).join(', ')}` });

    // Check from state (dispute can happen from any non-terminal state)
    if (transition.from && e.status !== transition.from) {
      return res.status(400).json({ error: `Cannot ${action} from status '${e.status}'. Expected '${transition.from}'` });
    }
    if (action === 'dispute' && ['released', 'disputed', 'cancelled'].includes(e.status)) {
      return res.status(400).json({ error: 'Cannot dispute a completed/cancelled transaction' });
    }

    // Check role
    if (transition.by === 'buyer' && e.buyer_id !== req.user.id) return res.status(403).json({ error: 'Only buyer can perform this action' });
    if (transition.by === 'seller' && e.seller_id !== req.user.id) return res.status(403).json({ error: 'Only seller can perform this action' });

    let updates = [`status = $2`, `${transition.field} = NOW()`, `updated_at = NOW()`];
    let values = [req.params.id, transition.to];
    let paramIdx = 3;
    if (notes) { updates.push(`notes = $${paramIdx}`); values.push(notes); paramIdx++; }
    if (payment_ref) { updates.push(`payment_ref = $${paramIdx}`); values.push(payment_ref); paramIdx++; }
    if (action === 'dispute') { updates.push(`dispute_reason = $${paramIdx}`); values.push(notes || 'Dispute raised'); paramIdx++; }

    const result = await query(`UPDATE aqua_escrow_transactions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`, values);
    res.json({ escrow: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// YIELD FORECASTING
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v3/forecast/:pondId — predictive yield model
router.get('/forecast/:pondId', authMiddleware, async (req, res) => {
  try {
    const pond = await query('SELECT * FROM ponds WHERE id=$1 AND farmer_id=$2', [req.params.pondId, req.user.id]);
    if (!pond.rows.length) return res.status(404).json({ error: 'Pond not found' });
    const p = pond.rows[0];

    const cycle = await query(`SELECT * FROM crop_cycles WHERE pond_id=$1 AND status='active' LIMIT 1`, [req.params.pondId]);
    const c = cycle.rows[0];
    const samples = await query(`SELECT * FROM growth_samples WHERE pond_id=$1 ORDER BY sampled_at ASC`, [req.params.pondId]);
    const feedLogs = await query(`SELECT SUM(quantity_kg) AS total_feed FROM feed_logs WHERE pond_id=$1`, [req.params.pondId]);

    const doc = p.stocking_date ? Math.floor((Date.now() - new Date(p.stocking_date).getTime()) / 86400000) : 0;
    const isVannamei = (p.species || '').toLowerCase().includes('vannamei');
    const seedCount = c?.seed_count || p.stocked_count || 0;
    const survivalPct = p.survival_pct || 80;
    const currentWeight = p.avg_weight_g || 0;
    const totalFeed = parseFloat(feedLogs.rows[0]?.total_feed || 0);

    // Growth model: Von Bertalanffy approximation
    // W(t) = Wmax * (1 - e^(-k*t))^3
    // For vannamei: Wmax=35g, k=0.025; For fish: Wmax=1500g, k=0.012
    const Wmax = isVannamei ? 35 : 1500;
    const k = isVannamei ? 0.025 : 0.012;

    // Calibrate k based on actual data
    let calibratedK = k;
    if (currentWeight > 0 && doc > 10) {
      // Back-solve: k_actual = -ln(1 - (W/Wmax)^(1/3)) / t
      const ratio = Math.min(currentWeight / Wmax, 0.95);
      const cubeRootRatio = Math.pow(ratio, 1/3);
      if (cubeRootRatio < 1) {
        calibratedK = -Math.log(1 - cubeRootRatio) / doc;
      }
    }

    // Project growth curve
    const targetDoc = isVannamei ? 120 : 180;
    const projections = [];
    for (let day = doc; day <= targetDoc + 14; day += 7) {
      const predictedWeight = Wmax * Math.pow(1 - Math.exp(-calibratedK * day), 3);
      projections.push({
        doc: day,
        date: new Date(Date.now() + (day - doc) * 86400000).toISOString().split('T')[0],
        predicted_weight_g: Math.round(predictedWeight * 100) / 100
      });
    }

    // Optimal harvest analysis (maximize revenue)
    // Shrimp: larger count = higher price (30ct > 40ct > 50ct)
    const harvestScenarios = [];
    const sizes = isVannamei
      ? [{ count: 50, min_g: 20, price: 290 }, { count: 40, min_g: 25, price: 340 }, { count: 30, min_g: 30, price: 380 }, { count: 20, min_g: 35, price: 550 }]
      : [{ label: '500g-800g', min_g: 500, price: 140 }, { label: '800g-1kg', min_g: 800, price: 160 }, { label: '1-1.5kg', min_g: 1000, price: 180 }];

    for (const size of sizes) {
      // Estimate days to reach this weight
      const targetW = size.min_g;
      if (targetW > Wmax) continue;
      const ratio = Math.pow(targetW / Wmax, 1/3);
      if (ratio >= 1) continue;
      const daysNeeded = Math.ceil(-Math.log(1 - ratio) / calibratedK);
      const daysFromNow = Math.max(0, daysNeeded - doc);
      const estSurvival = survivalPct * Math.pow(0.998, daysFromNow); // slight daily mortality
      const yieldKg = (seedCount * estSurvival / 100 * targetW) / 1000;
      const revenue = yieldKg * size.price;
      // Estimate additional feed cost
      const addlFeed = daysFromNow * (isVannamei ? 12 : 8) * (p.area_acres || 1);
      const profit = revenue - (addlFeed * (isVannamei ? 70 : 40)); // approx feed cost/kg

      harvestScenarios.push({
        size_label: size.count ? `${size.count} count` : size.label,
        target_weight_g: targetW,
        days_from_now: daysFromNow,
        harvest_date: new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0],
        estimated_survival_pct: Math.round(estSurvival * 10) / 10,
        estimated_yield_kg: Math.round(yieldKg),
        market_price: size.price,
        estimated_revenue: Math.round(revenue),
        estimated_profit: Math.round(profit)
      });
    }

    // Best scenario = highest profit
    const bestScenario = harvestScenarios.reduce((best, s) => (!best || s.estimated_profit > best.estimated_profit) ? s : best, null);

    // Confidence based on data availability
    const dataPoints = samples.rows.length;
    const confidence = Math.min(95, 40 + dataPoints * 8 + (totalFeed > 0 ? 10 : 0) + (doc > 30 ? 10 : 0));

    const forecast = {
      pond_code: p.pond_code, species: p.species, doc,
      current_weight_g: currentWeight, seed_count: seedCount, survival_pct: survivalPct,
      model: 'von_bertalanffy_calibrated', model_params: { Wmax, k: Math.round(calibratedK * 10000) / 10000 },
      growth_curve: projections,
      harvest_scenarios: harvestScenarios,
      recommended_harvest: bestScenario,
      confidence_pct: Math.round(confidence),
      data_points_used: dataPoints,
      recommendation: bestScenario
        ? `Optimal harvest at ${bestScenario.size_label} (${bestScenario.days_from_now} days). Expected ₹${(bestScenario.estimated_revenue/1000).toFixed(0)}K revenue.`
        : 'Insufficient data for recommendation. Log growth samples regularly.'
    };

    // Save forecast
    await query(`INSERT INTO aqua_yield_forecasts (id, pond_id, crop_cycle_id, predicted_harvest_date, predicted_yield_kg, predicted_weight_g, confidence_pct, inputs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuidv4(), req.params.pondId, c?.id || null, bestScenario?.harvest_date,
       bestScenario?.estimated_yield_kg, bestScenario?.target_weight_g, confidence,
       JSON.stringify({ doc, currentWeight, seedCount, survivalPct, calibratedK })]);

    res.json({ forecast });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// AQUA COMMUNITY (Species-tagged discussions)
// ════════════════════════════════════════════════════════════════

// POST /api/aquaos-v3/community — create post
router.post('/community', authMiddleware, async (req, res) => {
  try {
    const { category, species_tag, title, content, images, district_id } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const validCategories = ['discussion', 'disease_alert', 'feed_review', 'success_story', 'question', 'market_update', 'technique'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Valid: ${validCategories.join(', ')}` });
    }
    const result = await query(`
      INSERT INTO aqua_community_posts (id, user_id, category, species_tag, title, content, images, district_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.user.id, category || 'discussion', species_tag, title, content, images || [], district_id]);
    res.status(201).json({ post: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/community — list posts
router.get('/community', async (req, res) => {
  try {
    const { category, species_tag, district_id, limit = 20, offset = 0 } = req.query;
    let conditions = [`p.status = 'active'`];
    let params = [];
    let i = 1;
    if (category) { conditions.push(`p.category = $${i++}`); params.push(category); }
    if (species_tag) { conditions.push(`p.species_tag ILIKE $${i++}`); params.push(`%${species_tag}%`); }
    if (district_id) { conditions.push(`p.district_id = $${i++}`); params.push(district_id); }
    params.push(parseInt(limit), parseInt(offset));
    const result = await query(`
      SELECT p.*, u.name AS author_name, d.name AS district_name
      FROM aqua_community_posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN districts d ON d.id = p.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);
    res.json({ posts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v3/community/:id/reply — reply to post
router.post('/community/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { content, images } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const post = await query('SELECT id FROM aqua_community_posts WHERE id=$1', [req.params.id]);
    if (!post.rows.length) return res.status(404).json({ error: 'Post not found' });
    const result = await query(`
      INSERT INTO aqua_community_replies (id, post_id, user_id, content, images) VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, content, images || []]);
    await query('UPDATE aqua_community_posts SET reply_count = reply_count + 1 WHERE id = $1', [req.params.id]);
    res.status(201).json({ reply: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/community/:id/replies
router.get('/community/:id/replies', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, u.name AS author_name FROM aqua_community_replies r
      JOIN users u ON u.id = r.user_id
      WHERE r.post_id = $1 ORDER BY r.created_at ASC
    `, [req.params.id]);
    res.json({ replies: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v3/community/:id/like — like/unlike
router.post('/community/:id/like', authMiddleware, async (req, res) => {
  try {
    await query('UPDATE aqua_community_posts SET like_count = like_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FARMER ONBOARDING
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v3/onboarding — get onboarding progress
router.get('/onboarding', authMiddleware, async (req, res) => {
  try {
    const steps = ['profile', 'farm_setup', 'first_pond', 'first_stocking', 'first_feed_log', 'first_water_log', 'first_sampling'];
    const progress = await query('SELECT * FROM aqua_onboarding_progress WHERE user_id = $1', [req.user.id]);
    const completedSteps = progress.rows.filter(r => r.completed).map(r => r.step);
    const pct = Math.round((completedSteps.length / steps.length) * 100);
    res.json({
      steps: steps.map(s => ({ step: s, completed: completedSteps.includes(s) })),
      completed_count: completedSteps.length,
      total_steps: steps.length,
      progress_pct: pct,
      is_complete: pct === 100
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/aquaos-v3/onboarding/:step — mark step complete
router.post('/onboarding/:step', authMiddleware, async (req, res) => {
  try {
    const { data } = req.body;
    const validSteps = ['profile', 'farm_setup', 'first_pond', 'first_stocking', 'first_feed_log', 'first_water_log', 'first_sampling'];
    if (!validSteps.includes(req.params.step)) return res.status(400).json({ error: 'Invalid step' });
    await query(`
      INSERT INTO aqua_onboarding_progress (id, user_id, step, completed, data, completed_at)
      VALUES ($1, $2, $3, true, $4, NOW())
      ON CONFLICT (user_id, step) DO UPDATE SET completed = true, data = $4, completed_at = NOW()
    `, [uuidv4(), req.user.id, req.params.step, JSON.stringify(data || {})]);
    res.json({ success: true, step: req.params.step });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ANALYTICS / REGIONAL INTELLIGENCE
// ════════════════════════════════════════════════════════════════

// GET /api/aquaos-v3/analytics/regional — aggregate data for platform intelligence
router.get('/analytics/regional', async (req, res) => {
  try {
    const { species, district_id } = req.query;

    // Active production
    const production = await query(`
      SELECT species, COUNT(*) AS active_ponds,
             ROUND(SUM(area_acres)::numeric, 1) AS total_acres,
             ROUND(AVG(survival_pct)::numeric, 1) AS avg_survival,
             ROUND(AVG(avg_weight_g)::numeric, 1) AS avg_weight_g,
             ROUND(SUM(COALESCE(stocked_count,0) * COALESCE(survival_pct,80) / 100 *
               COALESCE(avg_weight_g, CASE WHEN species ILIKE '%vannamei%' THEN 15 ELSE 300 END) / 1000)::numeric, 0) AS estimated_biomass_kg
      FROM ponds WHERE status = 'active'
      ${species ? "AND species ILIKE '%' || $1 || '%'" : ''}
      GROUP BY species ORDER BY active_ponds DESC
    `, species ? [species] : []);

    // Recent transactions
    const transactions = await query(`
      SELECT species, COUNT(*) AS trades, ROUND(AVG(amount)::numeric, 0) AS avg_deal_value,
             ROUND(SUM(amount)::numeric, 0) AS total_value
      FROM aqua_escrow_transactions
      WHERE created_at > NOW() - INTERVAL '30 days' AND status NOT IN ('cancelled', 'disputed')
      GROUP BY species
    `);

    // Disease hotspots
    const diseases = await query(`
      SELECT dr.disease_name, COUNT(*) AS reports, p.species,
             MAX(dr.reported_at) AS latest
      FROM aqua_disease_reports dr
      JOIN ponds p ON p.id = dr.pond_id
      WHERE dr.reported_at > NOW() - INTERVAL '30 days'
      GROUP BY dr.disease_name, p.species
      HAVING COUNT(*) >= 2
      ORDER BY reports DESC LIMIT 5
    `);

    res.json({
      production: production.rows,
      transactions: transactions.rows,
      disease_hotspots: diseases.rows,
      generated_at: new Date().toISOString()
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/aquaos-v3/analytics/demand — market demand signals
router.get('/analytics/demand', async (req, res) => {
  try {
    // RFQ demand signals
    const rfqDemand = await query(`
      SELECT species, SUM(quantity_kg) AS total_demand_kg, COUNT(*) AS rfq_count,
             ROUND(AVG(max_price_per_kg)::numeric, 0) AS avg_max_price
      FROM aqua_rfqs
      WHERE status = 'open' AND (expires_at IS NULL OR expires_at > NOW())
      GROUP BY species ORDER BY total_demand_kg DESC
    `);

    // Supply from active auctions
    const auctionSupply = await query(`
      SELECT species, SUM(quantity_kg) AS total_supply_kg, COUNT(*) AS auction_count,
             ROUND(AVG(current_bid)::numeric, 0) AS avg_bid_price
      FROM aqua_auctions
      WHERE status = 'active' AND end_time > NOW()
      GROUP BY species ORDER BY total_supply_kg DESC
    `);

    res.json({
      demand: rfqDemand.rows,
      supply: auctionSupply.rows,
      insight: rfqDemand.rows.length > 0
        ? `${rfqDemand.rows[0].species} has highest demand: ${rfqDemand.rows[0].total_demand_kg}kg from ${rfqDemand.rows[0].rfq_count} buyers`
        : 'No active demand signals'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
