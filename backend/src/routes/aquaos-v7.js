const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Haversine helper
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
// VERIFIED REVIEWS & PERFORMANCE FEEDBACK
// ════════════════════════════════════════════════════════════════

// POST /reviews — submit review for seller (tied to order)
router.post('/reviews', authMiddleware, async (req, res) => {
  try {
    const { order_id, seller_id, rating, quality_rating, freshness_rating,
      packaging_rating, delivery_rating, review_text, images } = req.body;
    if (!seller_id || !rating) return res.status(400).json({ error: 'seller_id and rating required' });

    const result = await query(`
      INSERT INTO aqua_seller_reviews (id, order_id, seller_id, buyer_id, rating, quality_rating,
        freshness_rating, packaging_rating, delivery_rating, review_text, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), order_id, seller_id, req.user.id, rating, quality_rating,
      freshness_rating, packaging_rating, delivery_rating, review_text, images || []]);

    // Update seller performance
    await query(`
      INSERT INTO aqua_seller_performance (id, seller_id, total_reviews, avg_rating)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (seller_id) DO UPDATE SET
        total_reviews = aqua_seller_performance.total_reviews + 1,
        avg_rating = (aqua_seller_performance.avg_rating * aqua_seller_performance.total_reviews + $3) /
                     (aqua_seller_performance.total_reviews + 1),
        last_calculated_at = NOW()
    `, [uuidv4(), seller_id, rating]);

    res.status(201).json({ review: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /reviews/seller/:id — get reviews for a seller
router.get('/reviews/seller/:id', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await query(`
      SELECT r.*, u.name as buyer_name FROM aqua_seller_reviews r
      LEFT JOIN users u ON r.buyer_id = u.id
      WHERE r.seller_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3
    `, [req.params.id, parseInt(limit), offset]);
    const countResult = await query('SELECT COUNT(*) FROM aqua_seller_reviews WHERE seller_id = $1', [req.params.id]);
    res.json({ reviews: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /performance/:id — get seller performance metrics
router.get('/performance/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_seller_performance WHERE seller_id = $1', [req.params.id]);
    if (!result.rows.length) return res.json({ performance: { seller_id: req.params.id, badge: 'new', avg_rating: 0, total_orders: 0 } });
    res.json({ performance: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /reviews/:id/helpful — mark review as helpful
router.post('/reviews/:id/helpful', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'UPDATE aqua_seller_reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });
    res.json({ review: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /reviews/:id/respond — seller responds to review
router.post('/reviews/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { response_text } = req.body;
    const result = await query(
      'UPDATE aqua_seller_reviews SET response_text = $1, response_at = NOW() WHERE id = $2 AND seller_id = $3 RETURNING *',
      [response_text, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Review not found or unauthorized' });
    res.json({ review: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// LOGISTICS PROVIDERS & BOOKING
// ════════════════════════════════════════════════════════════════

// GET /logistics/providers — list providers with filters
router.get('/logistics/providers', authMiddleware, async (req, res) => {
  try {
    const { type, state, cold_chain, iot_enabled, page = 1, limit = 20 } = req.query;
    const conditions = ['active = true'];
    const params = [];
    let idx = 1;

    if (type) { conditions.push(`provider_type = $${idx}`); params.push(type); idx++; }
    if (state) { conditions.push(`$${idx} = ANY(coverage_states) OR 'All India' = ANY(coverage_states)`); params.push(state); idx++; }
    if (cold_chain === 'true') { conditions.push('cold_chain_certified = true'); }
    if (iot_enabled === 'true') { conditions.push('iot_enabled = true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); const lIdx = idx; idx++;
    params.push(offset); const oIdx = idx;

    const result = await query(
      `SELECT * FROM aqua_logistics_providers ${where} ORDER BY rating DESC NULLS LAST LIMIT $${lIdx} OFFSET $${oIdx}`,
      params
    );
    const countResult = await query(
      `SELECT COUNT(*) FROM aqua_logistics_providers ${where}`,
      params.slice(0, -2)
    );
    res.json({ providers: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /logistics/book — create logistics booking with route optimization
router.post('/logistics/book', authMiddleware, async (req, res) => {
  try {
    const { order_id, listing_id, provider_id, pickup_location, pickup_lat, pickup_lng,
      delivery_location, delivery_lat, delivery_lng, vehicle_type, temperature_required,
      ice_required_kg, cargo_weight_kg, pickup_time, notes } = req.body;
    if (!provider_id || !pickup_location || !delivery_location) {
      return res.status(400).json({ error: 'provider_id, pickup_location, delivery_location required' });
    }

    // Calculate distance & estimate
    let distance_km = 0;
    if (pickup_lat && pickup_lng && delivery_lat && delivery_lng) {
      distance_km = haversineDistance(pickup_lat, pickup_lng, delivery_lat, delivery_lng);
    }
    const provider = await query('SELECT * FROM aqua_logistics_providers WHERE id = $1', [provider_id]);
    const pricePerKm = provider.rows.length ? provider.rows[0].price_per_km || 15 : 15;
    const estimated_cost = distance_km * pricePerKm + (ice_required_kg || 0) * 3;
    const estimated_duration_hours = distance_km / 40; // avg 40 km/h

    const result = await query(`
      INSERT INTO aqua_logistics_bookings (id, order_id, listing_id, provider_id, booked_by,
        pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng,
        distance_km, estimated_duration_hours, vehicle_type, temperature_required,
        ice_required_kg, cargo_weight_kg, estimated_cost, pickup_time, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *
    `, [uuidv4(), order_id, listing_id, provider_id, req.user.id,
      pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng,
      distance_km, estimated_duration_hours, vehicle_type, temperature_required || 0,
      ice_required_kg || 0, cargo_weight_kg, estimated_cost, pickup_time, notes]);

    res.status(201).json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /logistics/bookings — my bookings
router.get('/logistics/bookings', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const conditions = ['booked_by = $1'];
    const params = [req.user.id];
    let idx = 2;
    if (status) { conditions.push(`status = $${idx}`); params.push(status); idx++; }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); const lIdx = idx; idx++;
    params.push(offset); const oIdx = idx;

    const result = await query(`
      SELECT b.*, p.name as provider_name FROM aqua_logistics_bookings b
      LEFT JOIN aqua_logistics_providers p ON b.provider_id = p.id
      WHERE ${conditions.join(' AND ')} ORDER BY b.created_at DESC LIMIT $${lIdx} OFFSET $${oIdx}
    `, params);
    res.json({ bookings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /logistics/bookings/:id/status — update booking status
router.put('/logistics/bookings/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, driver_name, driver_phone, vehicle_number } = req.body;
    const updates = ['status = $1', 'updated_at = NOW()'];
    const params = [status, req.params.id];
    let idx = 3;

    if (driver_name) { updates.push(`driver_name = $${idx}`); params.push(driver_name); idx++; }
    if (driver_phone) { updates.push(`driver_phone = $${idx}`); params.push(driver_phone); idx++; }
    if (vehicle_number) { updates.push(`vehicle_number = $${idx}`); params.push(vehicle_number); idx++; }
    if (status === 'delivered') updates.push('actual_delivery_time = NOW()');
    if (status === 'in_transit') updates.push('pickup_time = COALESCE(pickup_time, NOW())');

    const result = await query(
      `UPDATE aqua_logistics_bookings SET ${updates.join(',')} WHERE id = $2 RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /logistics/temperature — log IoT temperature reading
router.post('/logistics/temperature', authMiddleware, async (req, res) => {
  try {
    const { booking_id, batch_code, sensor_id, temperature_c, humidity_pct,
      location_lat, location_lng } = req.body;
    if (!booking_id || temperature_c === undefined) {
      return res.status(400).json({ error: 'booking_id and temperature_c required' });
    }

    const alert_triggered = temperature_c > 4.0; // Cold chain breach if > 4°C
    const alert_type = alert_triggered ? (temperature_c > 8 ? 'critical' : 'warning') : null;

    const result = await query(`
      INSERT INTO aqua_temp_logs (id, booking_id, batch_code, sensor_id, temperature_c,
        humidity_pct, location_lat, location_lng, alert_triggered, alert_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [uuidv4(), booking_id, batch_code, sensor_id, temperature_c,
      humidity_pct, location_lat, location_lng, alert_triggered, alert_type]);

    res.status(201).json({ log: result.rows[0], alert_triggered, alert_type });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /logistics/temperature/:bookingId — get temp logs for booking
router.get('/logistics/temperature/:bookingId', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_temp_logs WHERE booking_id = $1 ORDER BY recorded_at ASC',
      [req.params.bookingId]
    );
    const alerts = result.rows.filter(r => r.alert_triggered);
    res.json({ logs: result.rows, alerts_count: alerts.length, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ONLINE DISPUTE RESOLUTION (ODR)
// ════════════════════════════════════════════════════════════════

// POST /disputes — file a dispute
router.post('/disputes', authMiddleware, async (req, res) => {
  try {
    const { order_id, listing_id, against_user, dispute_type, severity,
      title, description, evidence_images, evidence_documents } = req.body;
    if (!title || !description || !dispute_type) {
      return res.status(400).json({ error: 'title, description, dispute_type required' });
    }

    const result = await query(`
      INSERT INTO aqua_disputes (id, order_id, listing_id, filed_by, against_user,
        dispute_type, severity, title, description, evidence_images, evidence_documents)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), order_id, listing_id, req.user.id, against_user,
      dispute_type, severity || 'medium', title, description, evidence_images || [], evidence_documents || []]);

    // Auto-create first system message
    await query(`
      INSERT INTO aqua_dispute_messages (id, dispute_id, sender_id, message, is_system_message)
      VALUES ($1, $2, $3, $4, true)
    `, [uuidv4(), result.rows[0].id, req.user.id,
      `Dispute filed: ${title}. Stage: Direct Communication. Both parties are encouraged to resolve amicably within 3 days.`]);

    res.status(201).json({ dispute: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /disputes — list my disputes
router.get('/disputes', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const conditions = ['(filed_by = $1 OR against_user = $1)'];
    const params = [req.user.id];
    let idx = 2;
    if (status) { conditions.push(`resolution_stage = $${idx}`); params.push(status); idx++; }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); const lIdx = idx; idx++;
    params.push(offset); const oIdx = idx;

    const result = await query(`
      SELECT d.*, fu.name as filed_by_name, au.name as against_name
      FROM aqua_disputes d
      LEFT JOIN users fu ON d.filed_by = fu.id
      LEFT JOIN users au ON d.against_user = au.id
      WHERE ${conditions.join(' AND ')} ORDER BY d.created_at DESC LIMIT $${lIdx} OFFSET $${oIdx}
    `, params);
    res.json({ disputes: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /disputes/:id — get dispute details with messages
router.get('/disputes/:id', authMiddleware, async (req, res) => {
  try {
    const dispute = await query('SELECT * FROM aqua_disputes WHERE id = $1', [req.params.id]);
    if (!dispute.rows.length) return res.status(404).json({ error: 'Dispute not found' });
    const messages = await query(
      'SELECT m.*, u.name as sender_name FROM aqua_dispute_messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.dispute_id = $1 ORDER BY m.created_at ASC',
      [req.params.id]
    );
    res.json({ dispute: dispute.rows[0], messages: messages.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /disputes/:id/message — add message to dispute
router.post('/disputes/:id/message', authMiddleware, async (req, res) => {
  try {
    const { message, attachments } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const result = await query(`
      INSERT INTO aqua_dispute_messages (id, dispute_id, sender_id, message, attachments)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, message, attachments || []]);
    res.status(201).json({ message: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /disputes/:id/escalate — escalate dispute to next stage
router.put('/disputes/:id/escalate', authMiddleware, async (req, res) => {
  try {
    const dispute = await query('SELECT * FROM aqua_disputes WHERE id = $1', [req.params.id]);
    if (!dispute.rows.length) return res.status(404).json({ error: 'Dispute not found' });

    const stageOrder = ['direct_communication', 'platform_mediation', 'arbitration'];
    const current = dispute.rows[0].resolution_stage;
    const currentIdx = stageOrder.indexOf(current);
    if (currentIdx >= stageOrder.length - 1) return res.status(400).json({ error: 'Already at final stage' });

    const nextStage = stageOrder[currentIdx + 1];
    const result = await query(
      'UPDATE aqua_disputes SET resolution_stage = $1, escalated_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *',
      [nextStage, req.params.id]
    );

    // System message
    await query(`
      INSERT INTO aqua_dispute_messages (id, dispute_id, sender_id, message, is_system_message)
      VALUES ($1,$2,$3,$4,true)
    `, [uuidv4(), req.params.id, req.user.id, `Dispute escalated to: ${nextStage.replace('_', ' ')}. A platform representative will review within 48 hours.`]);

    res.json({ dispute: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /disputes/:id/resolve — resolve dispute
router.put('/disputes/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { resolution_outcome, resolution_notes, refund_amount } = req.body;
    if (!resolution_outcome) return res.status(400).json({ error: 'resolution_outcome required' });

    const result = await query(`
      UPDATE aqua_disputes SET resolution_stage = 'resolved', resolution_outcome = $1,
        resolution_notes = $2, refund_amount = $3, resolved_by = $4, resolved_at = NOW(), updated_at = NOW()
      WHERE id = $5 RETURNING *
    `, [resolution_outcome, resolution_notes, refund_amount, req.user.id, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Dispute not found' });
    res.json({ dispute: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// TRADE CREDIT & NET TERMS
// ════════════════════════════════════════════════════════════════

// POST /credit/apply — apply for trade credit
router.post('/credit/apply', authMiddleware, async (req, res) => {
  try {
    const { requested_limit, net_terms_days, trade_references } = req.body;

    // Auto credit score based on platform activity
    const ordersResult = await query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status=\'completed\' THEN 1 ELSE 0 END) as completed FROM trade_orders WHERE buyer_id = $1',
      [req.user.id]
    );
    const orders = ordersResult.rows[0];
    const completionRate = orders.total > 0 ? (orders.completed / orders.total) * 100 : 0;
    const credit_score = Math.min(100, 30 + completionRate * 0.5 + Math.min(orders.total * 2, 20));
    const risk_level = credit_score >= 70 ? 'low' : credit_score >= 40 ? 'medium' : 'high';
    const credit_limit = Math.min(requested_limit || 500000, credit_score * 10000);

    const result = await query(`
      INSERT INTO aqua_trade_credit (id, buyer_id, credit_limit, available_credit, net_terms_days,
        credit_score, risk_level, trade_references, status)
      VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (buyer_id) DO UPDATE SET
        credit_limit = EXCLUDED.credit_limit, available_credit = EXCLUDED.available_credit,
        net_terms_days = EXCLUDED.net_terms_days, credit_score = EXCLUDED.credit_score,
        risk_level = EXCLUDED.risk_level, trade_references = EXCLUDED.trade_references,
        updated_at = NOW()
      RETURNING *
    `, [uuidv4(), req.user.id, credit_limit, net_terms_days || 30,
      credit_score, risk_level, trade_references || [], credit_score >= 50 ? 'active' : 'pending']);

    res.status(201).json({ credit: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /credit — get my trade credit
router.get('/credit', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_trade_credit WHERE buyer_id = $1', [req.user.id]);
    if (!result.rows.length) return res.json({ credit: null });
    const invoices = await query(
      'SELECT * FROM aqua_credit_invoices WHERE buyer_id = $1 ORDER BY due_date ASC',
      [req.user.id]
    );
    res.json({ credit: result.rows[0], invoices: invoices.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /credit/invoice — create credit invoice (net terms purchase)
router.post('/credit/invoice', authMiddleware, async (req, res) => {
  try {
    const { order_id, seller_id, amount, net_days } = req.body;
    if (!amount || !seller_id) return res.status(400).json({ error: 'amount and seller_id required' });

    // Check credit availability
    const credit = await query('SELECT * FROM aqua_trade_credit WHERE buyer_id = $1 AND status = $2', [req.user.id, 'active']);
    if (!credit.rows.length) return res.status(400).json({ error: 'No active trade credit' });
    if (credit.rows[0].available_credit < amount) return res.status(400).json({ error: 'Insufficient credit' });

    const days = net_days || credit.rows[0].net_terms_days || 30;
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + days);
    const invoice_number = `INV-${Date.now().toString(36).toUpperCase()}`;

    const result = await query(`
      INSERT INTO aqua_credit_invoices (id, credit_id, order_id, buyer_id, seller_id, invoice_number, amount, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), credit.rows[0].id, order_id, req.user.id, seller_id, invoice_number, amount, due_date.toISOString().split('T')[0]]);

    // Reduce available credit
    await query(
      'UPDATE aqua_trade_credit SET available_credit = available_credit - $1, updated_at = NOW() WHERE buyer_id = $2',
      [amount, req.user.id]
    );

    res.status(201).json({ invoice: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /credit/invoice/:id/pay — mark invoice as paid
router.put('/credit/invoice/:id/pay', authMiddleware, async (req, res) => {
  try {
    const { paid_amount, payment_reference } = req.body;
    const invoice = await query('SELECT * FROM aqua_credit_invoices WHERE id = $1 AND buyer_id = $2', [req.params.id, req.user.id]);
    if (!invoice.rows.length) return res.status(404).json({ error: 'Invoice not found' });

    const newPaid = (invoice.rows[0].paid_amount || 0) + (paid_amount || invoice.rows[0].amount);
    const status = newPaid >= invoice.rows[0].amount ? 'paid' : 'partially_paid';

    const result = await query(`
      UPDATE aqua_credit_invoices SET paid_amount = $1, status = $2, payment_reference = $3, paid_at = NOW()
      WHERE id = $4 RETURNING *
    `, [newPaid, status, payment_reference, req.params.id]);

    // Restore credit if fully paid
    if (status === 'paid') {
      await query(
        'UPDATE aqua_trade_credit SET available_credit = available_credit + $1, updated_at = NOW() WHERE buyer_id = $2',
        [invoice.rows[0].amount, req.user.id]
      );
    }

    res.json({ invoice: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// TRAINING CURRICULUM & KNOWLEDGE HUB
// ════════════════════════════════════════════════════════════════

// GET /training/modules — list training modules with filters
router.get('/training/modules', authMiddleware, async (req, res) => {
  try {
    const { category, difficulty, language, format, search, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (category) { conditions.push(`category = $${idx}`); params.push(category); idx++; }
    if (difficulty) { conditions.push(`difficulty = $${idx}`); params.push(difficulty); idx++; }
    if (language) { conditions.push(`language = $${idx}`); params.push(language); idx++; }
    if (format) { conditions.push(`format = $${idx}`); params.push(format); idx++; }
    if (search) { conditions.push(`(title ILIKE $${idx} OR $${idx} = ANY(tags))`); params.push(`%${search}%`); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); const lIdx = idx; idx++;
    params.push(offset); const oIdx = idx;

    const result = await query(
      `SELECT * FROM aqua_training_modules ${where} ORDER BY views DESC, avg_rating DESC LIMIT $${lIdx} OFFSET $${oIdx}`,
      params
    );
    const countResult = await query(`SELECT COUNT(*) FROM aqua_training_modules ${where}`, params.slice(0, -2));
    res.json({ modules: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /training/modules/:id — get module details with user progress
router.get('/training/modules/:id', authMiddleware, async (req, res) => {
  try {
    const mod = await query('SELECT * FROM aqua_training_modules WHERE id = $1', [req.params.id]);
    if (!mod.rows.length) return res.status(404).json({ error: 'Module not found' });

    // Increment view count
    await query('UPDATE aqua_training_modules SET views = views + 1 WHERE id = $1', [req.params.id]);

    const progress = await query(
      'SELECT * FROM aqua_training_progress WHERE user_id = $1 AND module_id = $2',
      [req.user.id, req.params.id]
    );

    res.json({ module: mod.rows[0], progress: progress.rows[0] || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /training/progress — update training progress
router.post('/training/progress', authMiddleware, async (req, res) => {
  try {
    const { module_id, status, progress_pct, score } = req.body;
    if (!module_id) return res.status(400).json({ error: 'module_id required' });

    const result = await query(`
      INSERT INTO aqua_training_progress (id, user_id, module_id, status, progress_pct, score,
        started_at, last_accessed_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      ON CONFLICT (user_id, module_id) DO UPDATE SET
        status = COALESCE(EXCLUDED.status, aqua_training_progress.status),
        progress_pct = GREATEST(EXCLUDED.progress_pct, aqua_training_progress.progress_pct),
        score = COALESCE(EXCLUDED.score, aqua_training_progress.score),
        completed_at = CASE WHEN EXCLUDED.status = 'completed' THEN NOW() ELSE aqua_training_progress.completed_at END,
        last_accessed_at = NOW()
      RETURNING *
    `, [uuidv4(), req.user.id, module_id, status || 'in_progress', progress_pct || 0, score]);

    res.json({ progress: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /training/my-progress — get all user training progress
router.get('/training/my-progress', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, m.title, m.category, m.difficulty, m.format, m.duration_minutes
      FROM aqua_training_progress p
      JOIN aqua_training_modules m ON p.module_id = m.id
      WHERE p.user_id = $1 ORDER BY p.last_accessed_at DESC
    `, [req.user.id]);

    const completed = result.rows.filter(r => r.status === 'completed').length;
    const in_progress = result.rows.filter(r => r.status === 'in_progress').length;

    res.json({ progress: result.rows, stats: { completed, in_progress, total: result.rows.length } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /training/rate — rate a training module
router.post('/training/rate', authMiddleware, async (req, res) => {
  try {
    const { module_id, rating } = req.body;
    if (!module_id || !rating) return res.status(400).json({ error: 'module_id and rating required' });

    const mod = await query('SELECT avg_rating, total_ratings FROM aqua_training_modules WHERE id = $1', [module_id]);
    if (!mod.rows.length) return res.status(404).json({ error: 'Module not found' });

    const { avg_rating, total_ratings } = mod.rows[0];
    const new_avg = ((avg_rating * total_ratings) + rating) / (total_ratings + 1);

    await query(
      'UPDATE aqua_training_modules SET avg_rating = $1, total_ratings = total_ratings + 1 WHERE id = $2',
      [new_avg, module_id]
    );

    res.json({ avg_rating: new_avg, total_ratings: total_ratings + 1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// VESSEL MONITORING SYSTEM (VMS)
// ════════════════════════════════════════════════════════════════

// POST /vessels — register vessel
router.post('/vessels', authMiddleware, async (req, res) => {
  try {
    const { vessel_name, vessel_registration, vessel_type, home_port, state,
      gps_device_id, license_number, license_expiry } = req.body;
    if (!vessel_name || !vessel_registration) {
      return res.status(400).json({ error: 'vessel_name and vessel_registration required' });
    }

    const result = await query(`
      INSERT INTO aqua_vessel_tracking (id, vessel_name, vessel_registration, owner_id,
        vessel_type, home_port, state, gps_device_id, license_number, license_expiry)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [uuidv4(), vessel_name, vessel_registration, req.user.id,
      vessel_type, home_port, state, gps_device_id, license_number, license_expiry]);

    res.status(201).json({ vessel: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /vessels — list user vessels
router.get('/vessels', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aqua_vessel_tracking WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ vessels: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /vessels/:id/position — update vessel position (GPS ping)
router.put('/vessels/:id/position', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, speed_knots, fishing_zone } = req.body;
    const result = await query(`
      UPDATE aqua_vessel_tracking SET last_lat = $1, last_lng = $2, last_speed_knots = $3,
        fishing_zone = $4, last_ping_at = NOW()
      WHERE id = $5 AND owner_id = $6 RETURNING *
    `, [lat, lng, speed_knots, fishing_zone, req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Vessel not found' });
    res.json({ vessel: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
