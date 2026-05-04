const express = require('express');
const crypto = require('crypto');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Haversine formula — returns distance in km between two lat/lng points
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ════════════════════════════════════════════════════════════════
// BUYER PROFILES
// ════════════════════════════════════════════════════════════════

// POST /buyer-profile — create/update buyer profile (upsert)
router.post('/buyer-profile', authMiddleware, async (req, res) => {
  try {
    const { business_name, gst_number, fssai_license, mpeda_registration,
      business_address, city, state, pin_code, annual_volume_kg,
      preferred_species, preferred_sizes, credit_terms, notes } = req.body;
    if (!business_name) return res.status(400).json({ error: 'business_name required' });

    let segment = 'retail';
    if (annual_volume_kg >= 100000) segment = 'export';
    else if (annual_volume_kg >= 10000) segment = 'wholesale';
    else if (annual_volume_kg >= 1000) segment = 'institutional';

    const result = await query(`
      INSERT INTO aqua_buyer_profiles (id, user_id, business_name, segment, gst_number, fssai_license,
        mpeda_registration, business_address, city, state, pin_code, annual_volume_kg,
        preferred_species, preferred_sizes, credit_terms, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (user_id) DO UPDATE SET
        business_name=EXCLUDED.business_name, segment=EXCLUDED.segment, gst_number=EXCLUDED.gst_number,
        fssai_license=EXCLUDED.fssai_license, mpeda_registration=EXCLUDED.mpeda_registration,
        business_address=EXCLUDED.business_address, city=EXCLUDED.city, state=EXCLUDED.state,
        pin_code=EXCLUDED.pin_code, annual_volume_kg=EXCLUDED.annual_volume_kg,
        preferred_species=EXCLUDED.preferred_species, preferred_sizes=EXCLUDED.preferred_sizes,
        credit_terms=EXCLUDED.credit_terms, notes=EXCLUDED.notes, updated_at=NOW()
      RETURNING *
    `, [uuidv4(), req.user.id, business_name, segment, gst_number, fssai_license,
      mpeda_registration, business_address, city, state, pin_code, annual_volume_kg,
      preferred_species, preferred_sizes, credit_terms, notes]);
    res.status(201).json({ profile: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /buyer-profile — get current user's buyer profile
router.get('/buyer-profile', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_buyer_profiles WHERE user_id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Buyer profile not found' });
    res.json({ profile: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /buyer-profiles — list verified buyer profiles
router.get('/buyer-profiles', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, business_name, segment, city, state, annual_volume_kg, preferred_species, rating
      FROM aqua_buyer_profiles WHERE verified = true ORDER BY business_name
    `);
    res.json({ profiles: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// FISH MARKETPLACE LISTINGS
// ════════════════════════════════════════════════════════════════

// POST /listings — create fish listing
router.post('/listings', authMiddleware, async (req, res) => {
  try {
    const { species, variety, quantity_kg, size_category, quality_grade, listing_type,
      price_per_kg, min_bid_price, auction_end_time, harvest_date, harvest_pond_id,
      location, district, state, description, images, cold_chain_required } = req.body;
    if (!species || !quantity_kg || !price_per_kg) {
      return res.status(400).json({ error: 'species, quantity_kg, and price_per_kg required' });
    }
    const batch_code = `AQ-${Date.now().toString(36).toUpperCase()}`;
    const result = await query(`
      INSERT INTO aqua_fish_listings (id, farmer_id, species, variety, quantity_kg, available_quantity_kg,
        size_category, quality_grade, listing_type, price_per_kg, min_bid_price, auction_end_time,
        harvest_date, harvest_pond_id, location, district, state, description, images, status,
        batch_code, cold_chain_required)
      VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'active',$19,$20)
      RETURNING *
    `, [uuidv4(), req.user.id, species, variety, quantity_kg, size_category, quality_grade,
      listing_type || 'fixed', price_per_kg, min_bid_price, auction_end_time, harvest_date,
      harvest_pond_id, location, district, state, description, images, batch_code,
      cold_chain_required || false]);
    res.status(201).json({ listing: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /listings — list active listings with filters and pagination
router.get('/listings', authMiddleware, async (req, res) => {
  try {
    const { species, district, listing_type, quality_grade, min_price, max_price,
      page = 1, limit = 20 } = req.query;
    const conditions = ['l.status = \'active\''];
    const params = [];
    let idx = 1;

    if (species) { conditions.push(`l.species ILIKE $${idx}`); params.push(`%${species}%`); idx++; }
    if (district) { conditions.push(`l.district ILIKE $${idx}`); params.push(`%${district}%`); idx++; }
    if (listing_type) { conditions.push(`l.listing_type = $${idx}`); params.push(listing_type); idx++; }
    if (quality_grade) { conditions.push(`l.quality_grade = $${idx}`); params.push(quality_grade); idx++; }
    if (min_price) { conditions.push(`l.price_per_kg >= $${idx}`); params.push(min_price); idx++; }
    if (max_price) { conditions.push(`l.price_per_kg <= $${idx}`); params.push(max_price); idx++; }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); const limitIdx = idx; idx++;
    params.push(offset); const offsetIdx = idx;

    const countResult = await query(
      `SELECT COUNT(*) FROM aqua_fish_listings l WHERE ${conditions.join(' AND ')}`,
      params.slice(0, -2)
    );

    const result = await query(`
      SELECT l.*, u.name AS farmer_name
      FROM aqua_fish_listings l
      LEFT JOIN users u ON u.id = l.farmer_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({
      listings: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /listings/:id — get single listing with quality grades
router.get('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await query('SELECT * FROM aqua_fish_listings WHERE id = $1', [req.params.id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    const grades = await query(
      'SELECT * FROM aqua_quality_grades WHERE listing_id = $1 ORDER BY graded_at DESC',
      [req.params.id]
    );
    res.json({ listing: listing.rows[0], quality_grades: grades.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /listings/:id — update own listing
router.put('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const { species, variety, quantity_kg, available_quantity_kg, size_category, quality_grade,
      price_per_kg, min_bid_price, description, images, cold_chain_required } = req.body;
    const result = await query(`
      UPDATE aqua_fish_listings SET
        species=COALESCE($1,species), variety=COALESCE($2,variety),
        quantity_kg=COALESCE($3,quantity_kg), available_quantity_kg=COALESCE($4,available_quantity_kg),
        size_category=COALESCE($5,size_category), quality_grade=COALESCE($6,quality_grade),
        price_per_kg=COALESCE($7,price_per_kg), min_bid_price=COALESCE($8,min_bid_price),
        description=COALESCE($9,description), images=COALESCE($10,images),
        cold_chain_required=COALESCE($11,cold_chain_required), updated_at=NOW()
      WHERE id=$12 AND farmer_id=$13 RETURNING *
    `, [species, variety, quantity_kg, available_quantity_kg, size_category, quality_grade,
      price_per_kg, min_bid_price, description, images, cold_chain_required,
      req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found or not owned by you' });
    res.json({ listing: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /listings/:id — soft delete (cancel) own listing
router.delete('/listings/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE aqua_fish_listings SET status='cancelled', updated_at=NOW()
      WHERE id=$1 AND farmer_id=$2 RETURNING *
    `, [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found or not owned by you' });
    res.json({ message: 'Listing cancelled', listing: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// BIDDING
// ════════════════════════════════════════════════════════════════

// POST /listings/:id/bid — place bid on listing
router.post('/listings/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { bid_price_per_kg, quantity_kg, bid_type, notes, expires_at } = req.body;
    if (!bid_price_per_kg || !quantity_kg) {
      return res.status(400).json({ error: 'bid_price_per_kg and quantity_kg required' });
    }
    const listing = await query(
      'SELECT * FROM aqua_fish_listings WHERE id=$1 AND status=\'active\'', [req.params.id]
    );
    if (!listing.rows.length) return res.status(400).json({ error: 'Listing not active or not found' });

    const total_amount = parseFloat(bid_price_per_kg) * parseFloat(quantity_kg);
    const result = await query(`
      INSERT INTO aqua_fish_bids (id, listing_id, buyer_id, bid_price_per_kg, quantity_kg,
        total_amount, bid_type, status, notes, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, bid_price_per_kg, quantity_kg,
      total_amount, bid_type || 'standard', notes, expires_at]);
    res.status(201).json({ bid: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /listings/:id/bids — get bids for a listing (owner only)
router.get('/listings/:id/bids', authMiddleware, async (req, res) => {
  try {
    const listing = await query(
      'SELECT id FROM aqua_fish_listings WHERE id=$1 AND farmer_id=$2', [req.params.id, req.user.id]
    );
    if (!listing.rows.length) return res.status(403).json({ error: 'Not your listing' });

    const result = await query(`
      SELECT b.*, bp.business_name AS buyer_business
      FROM aqua_fish_bids b
      LEFT JOIN aqua_buyer_profiles bp ON bp.user_id = b.buyer_id
      WHERE b.listing_id = $1
      ORDER BY b.bid_price_per_kg DESC, b.created_at ASC
    `, [req.params.id]);
    res.json({ bids: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /bids/:id/accept — accept a bid
router.post('/bids/:id/accept', authMiddleware, async (req, res) => {
  try {
    const bid = await query('SELECT * FROM aqua_fish_bids WHERE id = $1', [req.params.id]);
    if (!bid.rows.length) return res.status(404).json({ error: 'Bid not found' });

    const listing = await query(
      'SELECT * FROM aqua_fish_listings WHERE id=$1 AND farmer_id=$2',
      [bid.rows[0].listing_id, req.user.id]
    );
    if (!listing.rows.length) return res.status(403).json({ error: 'Not your listing' });

    await query('UPDATE aqua_fish_bids SET status=\'accepted\' WHERE id=$1', [req.params.id]);
    await query(
      'UPDATE aqua_fish_bids SET status=\'rejected\' WHERE listing_id=$1 AND id!=$2 AND status=\'pending\'',
      [bid.rows[0].listing_id, req.params.id]
    );

    const newAvailable = Math.max(0, parseFloat(listing.rows[0].available_quantity_kg) - parseFloat(bid.rows[0].quantity_kg));
    await query(
      'UPDATE aqua_fish_listings SET available_quantity_kg=$1, updated_at=NOW() WHERE id=$2',
      [newAvailable, bid.rows[0].listing_id]
    );

    const updated = await query('SELECT * FROM aqua_fish_bids WHERE id=$1', [req.params.id]);
    res.json({ message: 'Bid accepted', bid: updated.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /bids/:id/reject — reject a bid
router.post('/bids/:id/reject', authMiddleware, async (req, res) => {
  try {
    const bid = await query('SELECT * FROM aqua_fish_bids WHERE id=$1', [req.params.id]);
    if (!bid.rows.length) return res.status(404).json({ error: 'Bid not found' });

    const listing = await query(
      'SELECT id FROM aqua_fish_listings WHERE id=$1 AND farmer_id=$2',
      [bid.rows[0].listing_id, req.user.id]
    );
    if (!listing.rows.length) return res.status(403).json({ error: 'Not your listing' });

    const result = await query(
      'UPDATE aqua_fish_bids SET status=\'rejected\' WHERE id=$1 RETURNING *', [req.params.id]
    );
    res.json({ message: 'Bid rejected', bid: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// QUALITY GRADING
// ════════════════════════════════════════════════════════════════

// POST /quality-grade — create quality grade for listing
router.post('/quality-grade', authMiddleware, async (req, res) => {
  try {
    const { listing_id, freshness_score, size_uniformity_score, appearance_score,
      odor_score, texture_score, temperature_c, moisture_pct, notes } = req.body;
    if (!listing_id) return res.status(400).json({ error: 'listing_id required' });

    const scores = [freshness_score, size_uniformity_score, appearance_score, odor_score, texture_score]
      .map(Number).filter(s => !isNaN(s));
    const overall_score = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

    let grade = 'C';
    if (overall_score >= 9) grade = 'A+';
    else if (overall_score >= 7) grade = 'A';
    else if (overall_score >= 5) grade = 'B';

    const bis_standard = 'IS 4303:2024 Fish and Fishery Products';
    const result = await query(`
      INSERT INTO aqua_quality_grades (id, listing_id, graded_by, grade, freshness_score,
        size_uniformity_score, appearance_score, odor_score, texture_score, temperature_c,
        moisture_pct, overall_score, bis_standard, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
    `, [uuidv4(), listing_id, req.user.id, grade, freshness_score, size_uniformity_score,
      appearance_score, odor_score, texture_score, temperature_c, moisture_pct,
      overall_score, bis_standard, notes]);

    await query('UPDATE aqua_fish_listings SET quality_grade=$1, updated_at=NOW() WHERE id=$2',
      [grade, listing_id]);

    res.status(201).json({ quality_grade: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /quality-grades/:listingId — get grades for a listing
router.get('/quality-grades/:listingId', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_quality_grades WHERE listing_id = $1 ORDER BY graded_at DESC',
      [req.params.listingId]
    );
    res.json({ grades: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// COLD CHAIN LOGISTICS
// ════════════════════════════════════════════════════════════════

// GET /logistics/providers — list active logistics providers
router.get('/logistics/providers', authMiddleware, async (req, res) => {
  try {
    const { state } = req.query;
    let sql = 'SELECT * FROM aqua_logistics_providers WHERE active = true';
    const params = [];
    if (state) { sql += ' AND state ILIKE $1'; params.push(`%${state}%`); }
    sql += ' ORDER BY rating DESC NULLS LAST, total_deliveries DESC';
    const result = await query(sql, params);
    res.json({ providers: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /logistics/book — book logistics
router.post('/logistics/book', authMiddleware, async (req, res) => {
  try {
    const { listing_id, provider_id, pickup_location, pickup_lat, pickup_lng,
      delivery_location, delivery_lat, delivery_lng, vehicle_type,
      temperature_required_c, pickup_time, notes } = req.body;
    if (!provider_id || !pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng) {
      return res.status(400).json({ error: 'provider_id, pickup and delivery coordinates required' });
    }

    const distance_km = +(haversineDistance(
      parseFloat(pickup_lat), parseFloat(pickup_lng),
      parseFloat(delivery_lat), parseFloat(delivery_lng)
    ).toFixed(2));
    const estimated_cost = +(distance_km * 15).toFixed(2);

    const result = await query(`
      INSERT INTO aqua_logistics_bookings (id, listing_id, provider_id, booked_by,
        pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng,
        distance_km, estimated_cost, vehicle_type, temperature_required_c, status, pickup_time, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'requested',$15,$16) RETURNING *
    `, [uuidv4(), listing_id, provider_id, req.user.id, pickup_location,
      pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng,
      distance_km, estimated_cost, vehicle_type, temperature_required_c, pickup_time, notes]);
    res.status(201).json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /logistics/bookings — get user's logistics bookings
router.get('/logistics/bookings', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*, p.name AS provider_name, p.phone AS provider_phone
      FROM aqua_logistics_bookings b
      LEFT JOIN aqua_logistics_providers p ON p.id = b.provider_id
      WHERE b.booked_by = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /logistics/bookings/:id/status — update booking status
router.put('/logistics/bookings/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const updates = ['status=$1', 'updated_at=NOW()'];
    const params = [status];
    if (status === 'delivered') { updates.push(`actual_delivery_time=NOW()`); }
    params.push(req.params.id);

    const result = await query(
      `UPDATE aqua_logistics_bookings SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /logistics/temperature — log temperature reading
router.post('/logistics/temperature', authMiddleware, async (req, res) => {
  try {
    const { booking_id, temperature_c, humidity_pct, location_lat, location_lng } = req.body;
    if (!booking_id || temperature_c === undefined) {
      return res.status(400).json({ error: 'booking_id and temperature_c required' });
    }
    const alert_triggered = parseFloat(temperature_c) > 4.0;
    const result = await query(`
      INSERT INTO aqua_temperature_logs (id, booking_id, temperature_c, humidity_pct,
        location_lat, location_lng, alert_triggered)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), booking_id, temperature_c, humidity_pct, location_lat, location_lng, alert_triggered]);
    res.status(201).json({ log: result.rows[0], alert_triggered });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// TRACEABILITY
// ════════════════════════════════════════════════════════════════

// POST /trace/batch — create trace batch
router.post('/trace/batch', authMiddleware, async (req, res) => {
  try {
    const { listing_id, species, variety, quantity_kg, harvest_date, harvest_location,
      pond_id, culture_unit_id, feed_used, medicines_used, water_quality_at_harvest,
      nfdp_compliant } = req.body;
    if (!species || !harvest_date) return res.status(400).json({ error: 'species and harvest_date required' });

    const batch_code = `TR-${Date.now().toString(36).toUpperCase()}`;
    const created_at = new Date();
    const blockchain_hash = crypto.createHash('sha256')
      .update(JSON.stringify({ farmer_id: req.user.id, species, harvest_date, created_at }))
      .digest('hex');
    const qr_code_url = `https://aquaos.in/trace/${batch_code}`;

    const result = await query(`
      INSERT INTO aqua_trace_batches (id, batch_code, farmer_id, listing_id, species, variety,
        quantity_kg, harvest_date, harvest_location, pond_id, culture_unit_id, feed_used,
        medicines_used, water_quality_at_harvest, qr_code_url, blockchain_hash, nfdp_compliant)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *
    `, [uuidv4(), batch_code, req.user.id, listing_id, species, variety, quantity_kg,
      harvest_date, harvest_location, pond_id, culture_unit_id, feed_used, medicines_used,
      water_quality_at_harvest, qr_code_url, blockchain_hash, nfdp_compliant || false]);
    res.status(201).json({ batch: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /trace/event — add Critical Tracking Event to a batch
router.post('/trace/event', authMiddleware, async (req, res) => {
  try {
    const { batch_id, event_type, event_description, location, temperature_c,
      key_data_elements, documents } = req.body;
    if (!batch_id || !event_type) return res.status(400).json({ error: 'batch_id and event_type required' });

    const result = await query(`
      INSERT INTO aqua_trace_events (id, batch_id, event_type, event_description, location,
        performed_by, temperature_c, key_data_elements, documents)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [uuidv4(), batch_id, event_type, event_description, location,
      req.user.id, temperature_c, key_data_elements, documents]);
    res.status(201).json({ event: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /trace/public/:batchCode — PUBLIC (no auth) — get batch + events by batch_code
router.get('/trace/public/:batchCode', async (req, res) => {
  try {
    const batch = await query(
      'SELECT * FROM aqua_trace_batches WHERE batch_code = $1', [req.params.batchCode]
    );
    if (!batch.rows.length) return res.status(404).json({ error: 'Batch not found' });

    const events = await query(
      'SELECT * FROM aqua_trace_events WHERE batch_id = $1 ORDER BY timestamp ASC',
      [batch.rows[0].id]
    );
    res.json({ batch: batch.rows[0], events: events.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PMMSY DPR BUILDER
// ════════════════════════════════════════════════════════════════

// POST /pmmsy/application — create PMMSY DPR application
router.post('/pmmsy/application', authMiddleware, async (req, res) => {
  try {
    const { project_type, beneficiary_category, total_project_cost, own_contribution,
      project_location, district, state, land_area_acres, expected_production_kg,
      revenue_projection, capital_cost_breakdown, operating_cost_annual } = req.body;
    if (!project_type || !total_project_cost) {
      return res.status(400).json({ error: 'project_type and total_project_cost required' });
    }

    const cost = parseFloat(total_project_cost);
    const subsidy_pct = beneficiary_category === 'general' ? 40 : 60;
    const subsidy_amount = +(cost * subsidy_pct / 100).toFixed(2);
    const loan_amount = +(cost - subsidy_amount - (parseFloat(own_contribution) || 0)).toFixed(2);

    let bcr = 1.5;
    if (revenue_projection && operating_cost_annual) {
      bcr = +(parseFloat(revenue_projection) / parseFloat(operating_cost_annual)).toFixed(2);
    }

    const result = await query(`
      INSERT INTO aqua_pmmsy_applications (id, farmer_id, project_type, beneficiary_category,
        total_project_cost, subsidy_pct, subsidy_amount, loan_amount, own_contribution, bcr,
        project_location, district, state, land_area_acres, expected_production_kg,
        revenue_projection, capital_cost_breakdown, operating_cost_annual, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'draft') RETURNING *
    `, [uuidv4(), req.user.id, project_type, beneficiary_category || 'general',
      cost, subsidy_pct, subsidy_amount, loan_amount, own_contribution || 0, bcr,
      project_location, district, state, land_area_acres, expected_production_kg,
      revenue_projection, capital_cost_breakdown, operating_cost_annual]);
    res.status(201).json({ application: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /pmmsy/applications — get user's PMMSY applications
router.get('/pmmsy/applications', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_pmmsy_applications WHERE farmer_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ applications: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /pmmsy/documents — upload document for PMMSY application
router.post('/pmmsy/documents', authMiddleware, async (req, res) => {
  try {
    const { application_id, doc_type, file_url, file_name } = req.body;
    if (!application_id || !doc_type || !file_url) {
      return res.status(400).json({ error: 'application_id, doc_type, and file_url required' });
    }

    const app = await query(
      'SELECT id FROM aqua_pmmsy_applications WHERE id=$1 AND farmer_id=$2',
      [application_id, req.user.id]
    );
    if (!app.rows.length) return res.status(403).json({ error: 'Application not found or not owned by you' });

    const result = await query(`
      INSERT INTO aqua_pmmsy_documents (id, application_id, doc_type, file_url, file_name)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), application_id, doc_type, file_url, file_name]);
    res.status(201).json({ document: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /pmmsy/applications/:id/submit — submit application
router.post('/pmmsy/applications/:id/submit', authMiddleware, async (req, res) => {
  try {
    const app = await query(
      'SELECT * FROM aqua_pmmsy_applications WHERE id=$1 AND farmer_id=$2',
      [req.params.id, req.user.id]
    );
    if (!app.rows.length) return res.status(404).json({ error: 'Application not found' });
    if (app.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Only draft applications can be submitted' });
    }

    const docs = await query(
      'SELECT DISTINCT doc_type FROM aqua_pmmsy_documents WHERE application_id = $1',
      [req.params.id]
    );
    const docTypes = docs.rows.map(d => d.doc_type);
    const required = ['aadhaar', 'pan', 'bank_passbook'];
    const missing = required.filter(r => !docTypes.includes(r));
    if (missing.length) {
      return res.status(400).json({ error: `Missing required documents: ${missing.join(', ')}` });
    }

    const result = await query(`
      UPDATE aqua_pmmsy_applications SET status='submitted', submitted_at=NOW(), updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id]);
    res.json({ message: 'Application submitted', application: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// NATIONAL SUPPLIER DIRECTORY
// ════════════════════════════════════════════════════════════════

// GET /suppliers — list suppliers with filters and pagination
router.get('/suppliers', authMiddleware, async (req, res) => {
  try {
    const { category, state, verified, featured, search, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (category) { conditions.push(`category = $${idx}`); params.push(category); idx++; }
    if (state) { conditions.push(`state ILIKE $${idx}`); params.push(`%${state}%`); idx++; }
    if (verified !== undefined) { conditions.push(`verified = $${idx}`); params.push(verified === 'true'); idx++; }
    if (featured !== undefined) { conditions.push(`featured = $${idx}`); params.push(featured === 'true'); idx++; }
    if (search) { conditions.push(`name ILIKE $${idx}`); params.push(`%${search}%`); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); const limitIdx = idx; idx++;
    params.push(offset); const offsetIdx = idx;

    const countResult = await query(
      `SELECT COUNT(*) FROM aqua_national_suppliers ${where}`,
      params.slice(0, -2)
    );

    const result = await query(`
      SELECT * FROM aqua_national_suppliers ${where}
      ORDER BY featured DESC, rating DESC NULLS LAST, name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({
      suppliers: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /suppliers/:id — get single supplier details
router.get('/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_national_suppliers WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ supplier: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
