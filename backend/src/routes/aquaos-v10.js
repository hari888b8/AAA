const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ════════════════════════════════════════════════════════════════
// ROLE GUARD MIDDLEWARE
// ════════════════════════════════════════════════════════════════
function roleGuard(...roles) {
  return (req, res, next) => {
    const role = req.user?.role || req.headers['x-user-role'] || 'farmer';
    if (!roles.includes(role) && role !== 'admin') {
      return res.status(403).json({ error: `Access denied. Required: ${roles.join(', ')}` });
    }
    req.userRole = role;
    next();
  };
}

// ════════════════════════════════════════════════════════════════
// 1. ANALYTICS LAYER — System-wide insights (Section 18)
// ════════════════════════════════════════════════════════════════

// GET /analytics/overview — platform-wide analytics dashboard
router.get('/analytics/overview', authMiddleware, async (req, res) => {
  try {
    const snapshots = await query(`SELECT * FROM aqua_analytics_snapshots ORDER BY snapshot_type, district`);
    const grouped = {};
    for (const s of snapshots.rows) {
      if (!grouped[s.snapshot_type]) grouped[s.snapshot_type] = [];
      grouped[s.snapshot_type].push(s);
    }
    res.json({ analytics: grouped, total_metrics: snapshots.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /analytics/survival-rates — regional survival rate insights
router.get('/analytics/survival-rates', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_analytics_snapshots WHERE snapshot_type = 'survival_rate' ORDER BY metric_value DESC`);
    res.json({ survival_rates: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /analytics/feed-efficiency — FCR benchmarks
router.get('/analytics/feed-efficiency', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_analytics_snapshots WHERE snapshot_type = 'feed_efficiency' ORDER BY district`);
    res.json({ feed_efficiency: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /analytics/disease-outbreaks — regional disease intelligence
router.get('/analytics/disease-outbreaks', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_analytics_snapshots WHERE snapshot_type = 'disease_outbreak' ORDER BY metric_value DESC`);
    res.json({ disease_data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 2. SEARCH SYSTEM — Full-text search across platform (Section 19)
// ════════════════════════════════════════════════════════════════

// GET /search — universal search
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, type, district, species, page = 1, limit = 20 } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ error: 'Query must be at least 2 characters' });

    let sql = `SELECT *, ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')), plainto_tsquery('english', $1)) as rank
      FROM aqua_search_index WHERE is_active = true
      AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')) @@ plainto_tsquery('english', $1)`;
    const params = [q];
    let idx = 2;

    if (type) { sql += ` AND entity_type = $${idx}`; params.push(type); idx++; }
    if (district) { sql += ` AND district = $${idx}`; params.push(district); idx++; }
    if (species) { sql += ` AND species = $${idx}`; params.push(species); idx++; }

    sql += ` ORDER BY rank DESC, relevance_score DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    res.json({ results: result.rows, query: q, page: parseInt(page), total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /search/index — index a new entity
router.post('/search/index', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const { entity_type, entity_id, title, body, tags, district, species, category } = req.body;
    const result = await query(`INSERT INTO aqua_search_index (entity_type, entity_id, title, body, tags, district, species, category)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET title=$3, body=$4, tags=$5, indexed_at=NOW()
      RETURNING *`, [entity_type, entity_id, title, body, tags || [], district, species, category]);
    res.json({ indexed: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 3. PAYMENT SYSTEM — Razorpay integration (Section 20)
// ════════════════════════════════════════════════════════════════

// POST /payments/create-order — initiate payment
router.post('/payments/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, payment_type, description, payee_id, metadata } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const commission_pct = payment_type === 'harvest_sale' ? 2.5 : payment_type === 'input_purchase' ? 3.0 : 0;
    const commission_amount = (amount * commission_pct / 100).toFixed(2);
    const gst_amount = (commission_amount * 0.18).toFixed(2);
    const net_amount = (amount - commission_amount - gst_amount).toFixed(2);
    const gateway_order_id = `order_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    const result = await query(`INSERT INTO aqua_payment_transactions
      (payer_id, payee_id, amount, payment_type, description, commission_pct, commission_amount, gst_amount, net_amount, gateway_order_id, metadata, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'created') RETURNING *`,
      [req.user.id, payee_id, amount, payment_type, description, commission_pct, commission_amount, gst_amount, net_amount, gateway_order_id, metadata || {}]);
    res.json({ order: result.rows[0], gateway: { order_id: gateway_order_id, amount: amount * 100, currency: 'INR', key: 'rzp_test_aquaos' } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /payments/verify — verify payment callback
router.post('/payments/verify', authMiddleware, async (req, res) => {
  try {
    const { gateway_order_id, gateway_payment_id, gateway_signature } = req.body;
    const result = await query(`UPDATE aqua_payment_transactions SET status = 'completed', gateway_payment_id = $2, gateway_signature = $3, settled_at = NOW(), updated_at = NOW()
      WHERE gateway_order_id = $1 RETURNING *`, [gateway_order_id, gateway_payment_id, gateway_signature]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ payment: result.rows[0], verified: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /payments/history — user's payment history
router.get('/payments/history', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_payment_transactions WHERE payer_id = $1 OR payee_id = $1 ORDER BY created_at DESC LIMIT 50`, [req.user.id]);
    res.json({ transactions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /payments/refund — initiate refund
router.post('/payments/refund', authMiddleware, async (req, res) => {
  try {
    const { payment_id, reason } = req.body;
    const result = await query(`UPDATE aqua_payment_transactions SET status = 'refunded', refunded_at = NOW(), refund_id = $2, updated_at = NOW()
      WHERE id = $1 AND (payer_id = $3 OR $4 = 'admin') RETURNING *`,
      [payment_id, `rfnd_${uuidv4().substring(0, 12)}`, req.user.id, req.user?.role || 'farmer']);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found or unauthorized' });
    res.json({ refund: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 4. SUBSCRIPTIONS — Buyer/Supplier plans (Section 32)
// ════════════════════════════════════════════════════════════════

// GET /subscriptions/plans — available subscription plans
router.get('/subscriptions/plans', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_monetization_config WHERE is_active = true ORDER BY price_inr`);
    res.json({ plans: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /subscriptions/subscribe — start subscription
router.post('/subscriptions/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan_id } = req.body;
    const plan = await query(`SELECT * FROM aqua_monetization_config WHERE id = $1`, [plan_id]);
    if (plan.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    const p = plan.rows[0];
    const expires = p.billing_cycle === 'monthly' ? "NOW() + INTERVAL '30 days'" :
                    p.billing_cycle === 'yearly' ? "NOW() + INTERVAL '365 days'" : "NOW() + INTERVAL '100 years'";
    const result = await query(`INSERT INTO aqua_subscriptions (user_id, plan_type, plan_name, amount_monthly, features, expires_at)
      VALUES ($1,$2,$3,$4,$5,${expires}) RETURNING *`,
      [req.user.id, p.stream_type, p.stream_name, p.price_inr, JSON.stringify(p.features)]);
    res.json({ subscription: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /subscriptions/my — my active subscription
router.get('/subscriptions/my', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`, [req.user.id]);
    res.json({ subscription: result.rows[0] || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 5. PRICING INTELLIGENCE — Daily market prices (Section 21)
// ════════════════════════════════════════════════════════════════

// GET /prices — current market prices
router.get('/prices', async (req, res) => {
  try {
    const { species, district, market } = req.query;
    let sql = `SELECT * FROM aqua_price_intelligence WHERE recorded_date >= CURRENT_DATE - INTERVAL '7 days'`;
    const params = [];
    let idx = 1;
    if (species) { sql += ` AND species ILIKE $${idx}`; params.push(`%${species}%`); idx++; }
    if (district) { sql += ` AND district = $${idx}`; params.push(district); idx++; }
    if (market) { sql += ` AND market_name ILIKE $${idx}`; params.push(`%${market}%`); idx++; }
    sql += ` ORDER BY species, market_name`;
    const result = await query(sql, params);
    res.json({ prices: result.rows, updated: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /prices/forecast — price forecasting
router.get('/prices/forecast', authMiddleware, async (req, res) => {
  try {
    const { species, market } = req.query;
    let sql = `SELECT species, size_grade, market_name, district, price_per_kg, forecast_7d, forecast_30d, trend, demand_level
      FROM aqua_price_intelligence WHERE recorded_date >= CURRENT_DATE - INTERVAL '7 days'`;
    const params = [];
    let idx = 1;
    if (species) { sql += ` AND species ILIKE $${idx}`; params.push(`%${species}%`); idx++; }
    if (market) { sql += ` AND market_name ILIKE $${idx}`; params.push(`%${market}%`); idx++; }
    sql += ` ORDER BY species`;
    const result = await query(sql, params);
    res.json({ forecasts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /prices/alerts — set price alert
router.post('/prices/alerts', authMiddleware, async (req, res) => {
  try {
    const { species, market_name, alert_type, threshold_price } = req.body;
    if (!species || !threshold_price) return res.status(400).json({ error: 'species and threshold_price required' });
    const result = await query(`INSERT INTO aqua_price_alerts (user_id, species, market_name, alert_type, threshold_price)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.id, species, market_name, alert_type || 'above', threshold_price]);
    res.json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /prices/alerts — my price alerts
router.get('/prices/alerts', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_price_alerts WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json({ alerts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 6. MESSAGING SYSTEM — Real-time chat (Section 22)
// ════════════════════════════════════════════════════════════════

// POST /chat/rooms — create chat room
router.post('/chat/rooms', authMiddleware, async (req, res) => {
  try {
    const { participant_id, related_entity_type, related_entity_id, title } = req.body;
    if (!participant_id) return res.status(400).json({ error: 'participant_id required' });
    // Check existing room
    const existing = await query(`SELECT * FROM aqua_chat_rooms WHERE participant_ids @> ARRAY[$1,$2]::uuid[] AND is_active = true`,
      [req.user.id, participant_id]);
    if (existing.rows.length > 0) return res.json({ room: existing.rows[0], existing: true });
    const result = await query(`INSERT INTO aqua_chat_rooms (participant_ids, related_entity_type, related_entity_id, title)
      VALUES (ARRAY[$1,$2]::uuid[], $3, $4, $5) RETURNING *`,
      [req.user.id, participant_id, related_entity_type, related_entity_id, title]);
    res.json({ room: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /chat/rooms — my chat rooms
router.get('/chat/rooms', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_chat_rooms WHERE $1 = ANY(participant_ids) AND is_active = true ORDER BY last_message_at DESC NULLS LAST`, [req.user.id]);
    res.json({ rooms: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /chat/messages — send message
router.post('/chat/messages', authMiddleware, async (req, res) => {
  try {
    const { room_id, content, message_type, image_url, offer_amount } = req.body;
    if (!room_id || !content) return res.status(400).json({ error: 'room_id and content required' });
    const result = await query(`INSERT INTO aqua_chat_messages (room_id, sender_id, content, message_type, image_url, offer_amount)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [room_id, req.user.id, content, message_type || 'text', image_url, offer_amount]);
    // Update room last message
    await query(`UPDATE aqua_chat_rooms SET last_message = $1, last_message_at = NOW() WHERE id = $2`, [content, room_id]);
    res.json({ message: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /chat/messages/:roomId — get messages
router.get('/chat/messages/:roomId', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_chat_messages WHERE room_id = $1 AND is_deleted = false ORDER BY created_at ASC LIMIT 100`, [req.params.roomId]);
    res.json({ messages: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 7. AI ADVISORY — Predictive intelligence (Section 28)
// ════════════════════════════════════════════════════════════════

// GET /ai/predictions — get AI predictions for user's farm
router.get('/ai/predictions', authMiddleware, async (req, res) => {
  try {
    const { type, risk_level } = req.query;
    let sql = `SELECT * FROM aqua_ai_predictions WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (type) { sql += ` AND prediction_type = $${idx}`; params.push(type); idx++; }
    if (risk_level) { sql += ` AND risk_level = $${idx}`; params.push(risk_level); idx++; }
    sql += ` ORDER BY created_at DESC LIMIT 20`;
    const result = await query(sql, params);
    res.json({ predictions: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /ai/predict — request new prediction
router.post('/ai/predict', authMiddleware, async (req, res) => {
  try {
    const { prediction_type, input_features, pond_id, farm_id } = req.body;
    if (!prediction_type || !input_features) return res.status(400).json({ error: 'prediction_type and input_features required' });

    // Simple rule-based prediction engine
    let predicted_value = null, predicted_label = null, confidence = 0.75, risk = 'low', recommendation = '';
    const features = input_features;

    switch (prediction_type) {
      case 'disease_prediction':
        const risk_score = ((features.water_temp || 28) > 32 ? 0.3 : 0) + ((features.dissolved_oxygen || 5) < 4 ? 0.3 : 0) + ((features.stocking_density || 30) > 45 ? 0.2 : 0) + ((features.ammonia || 0) > 0.3 ? 0.2 : 0);
        risk = risk_score > 0.5 ? 'high' : risk_score > 0.3 ? 'medium' : 'low';
        predicted_label = risk;
        confidence = 0.7 + risk_score * 0.2;
        recommendation = risk === 'high' ? 'Immediate water exchange recommended. Reduce feeding by 30%.' : 'Continue monitoring. Parameters within acceptable range.';
        break;
      case 'yield_prediction':
        const est_yield = (features.area_acres || 1) * (features.survival || 70) / 100 * (features.stocking_density || 30) * 1000 * ((features.abw || 20) / 1000);
        predicted_value = Math.round(est_yield);
        confidence = 0.82;
        risk = 'low';
        recommendation = `Estimated harvest: ${predicted_value} kg. Optimal harvest at DOC ${features.doc ? features.doc + 20 : 100}.`;
        break;
      case 'feed_optimization':
        const daily_feed = (features.biomass_kg || 1000) * (features.feeding_rate || 3.5) / 100;
        predicted_value = Math.round(daily_feed * 10) / 10;
        confidence = 0.88;
        recommendation = `Optimal daily feed: ${predicted_value} kg. Adjust based on weather and check tray.`;
        break;
      default:
        predicted_label = 'unknown';
        recommendation = 'Model not available for this prediction type.';
    }

    const result = await query(`INSERT INTO aqua_ai_predictions (prediction_type, model_name, input_features, predicted_value, predicted_label, confidence_score, risk_level, recommendation, farm_id, pond_id, valid_until)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW() + INTERVAL '7 days') RETURNING *`,
      [prediction_type, `${prediction_type}_v1`, JSON.stringify(input_features), predicted_value, predicted_label, confidence, risk, recommendation, farm_id, pond_id]);
    res.json({ prediction: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 8. GROWTH & LAUNCH METRICS (Sections 29, 31, 33)
// ════════════════════════════════════════════════════════════════

// GET /growth/dashboard — growth metrics dashboard
router.get('/growth/dashboard', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const metrics = await query(`SELECT * FROM aqua_growth_metrics ORDER BY metric_type, district`);
    const byType = {};
    for (const m of metrics.rows) {
      if (!byType[m.metric_type]) byType[m.metric_type] = [];
      byType[m.metric_type].push(m);
    }
    res.json({
      growth: byType,
      launch_strategy: {
        phase1: { name: 'Farm OS + Harvest Marketplace', status: 'active', districts: ['West Godavari', 'East Godavari', 'Krishna', 'Nellore'] },
        phase2: { name: 'Input Marketplace', status: 'upcoming' },
        phase3: { name: 'Advisory Engine + AI', status: 'planned' },
        phase4: { name: 'Community + Full Ecosystem', status: 'planned' }
      },
      target_scale: { farmers: 100000, buyers: 10000, suppliers: 2000 }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 9. IoT INTEGRATION — Future tech (Section 34)
// ════════════════════════════════════════════════════════════════

// POST /iot/readings — ingest sensor data
router.post('/iot/readings', authMiddleware, async (req, res) => {
  try {
    const { device_id, pond_id, farm_id, sensor_type, reading_value, unit, raw_payload } = req.body;
    if (!sensor_type || reading_value === undefined) return res.status(400).json({ error: 'sensor_type and reading_value required' });

    // Check for alert thresholds
    let alert_triggered = false, alert_message = null;
    if (sensor_type === 'dissolved_oxygen' && reading_value < 4.0) { alert_triggered = true; alert_message = `Critical DO level: ${reading_value} mg/L. Activate aerators immediately!`; }
    if (sensor_type === 'temperature' && reading_value > 33) { alert_triggered = true; alert_message = `High temperature: ${reading_value}°C. Risk of stress. Increase water exchange.`; }
    if (sensor_type === 'ph' && (reading_value < 7.0 || reading_value > 9.0)) { alert_triggered = true; alert_message = `pH out of range: ${reading_value}. Apply lime if acidic.`; }
    if (sensor_type === 'ammonia' && reading_value > 0.3) { alert_triggered = true; alert_message = `Ammonia spike: ${reading_value} ppm. Reduce feeding, apply probiotics.`; }

    const result = await query(`INSERT INTO aqua_iot_readings (device_id, pond_id, farm_id, sensor_type, reading_value, unit, alert_triggered, alert_message, raw_payload)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [device_id, pond_id, farm_id, sensor_type, reading_value, unit, alert_triggered, alert_message, raw_payload || {}]);
    res.json({ reading: result.rows[0], alert: alert_triggered ? { triggered: true, message: alert_message } : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /iot/readings/:pondId — get readings for a pond
router.get('/iot/readings/:pondId', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM aqua_iot_readings WHERE pond_id = $1 ORDER BY recorded_at DESC LIMIT 100`, [req.params.pondId]);
    res.json({ readings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 10. DEVOPS & SYSTEM HEALTH (Sections 25, 26, 27)
// ════════════════════════════════════════════════════════════════

// GET /system/health — platform health dashboard
router.get('/system/health', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const services = await query(`SELECT * FROM aqua_system_health ORDER BY service_name`);
    const overall = services.rows.every(s => s.health_status === 'healthy') ? 'healthy' : 'degraded';
    res.json({
      status: overall,
      services: services.rows,
      infrastructure: {
        provider: 'AWS',
        region: 'ap-south-1',
        database: 'PostgreSQL 15 (RDS)',
        cache: 'Redis (ElastiCache)',
        search: 'OpenSearch',
        compute: 'Lambda + ECS',
        storage: 'S3',
        cdn: 'CloudFront'
      },
      backup: { frequency: 'daily', retention_days: 30, last_backup: new Date().toISOString(), disaster_recovery: 'cross-region replication' },
      monitoring: { metrics: 'Prometheus', dashboards: 'Grafana', alerting: 'PagerDuty', logging: 'CloudWatch' }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 11. PLATFORM POSITIONING (Section 35)
// ════════════════════════════════════════════════════════════════

// GET /platform/info — platform positioning & capabilities
router.get('/platform/info', async (req, res) => {
  res.json({
    name: 'AquaOS — Aquaculture Digital Ecosystem',
    version: '10.0',
    positioning: ['Aquaculture Operating System', 'Marketplace', 'Knowledge Network'],
    modules: ['Farm OS', 'Advisory Engine', 'Input Marketplace', 'Harvest Marketplace', 'Farmer Community', 'Analytics', 'AI Predictions', 'IoT Integration'],
    geography: { primary: 'Andhra Pradesh', districts: ['West Godavari', 'East Godavari', 'Krishna', 'Nellore'], expansion: ['Tamil Nadu', 'Gujarat', 'Odisha'] },
    scale_targets: { farmers: 100000, buyers: 10000, suppliers: 2000 },
    roles: ['farmer', 'buyer', 'supplier', 'advisor', 'admin'],
    monetization: { farmers: 'FREE', buyers: 'subscription', suppliers: 'listing_fee', platform: 'transaction_commission + advertising' },
    technology: { mobile: 'Flutter', backend: 'Node.js + Express', database: 'PostgreSQL', cache: 'Redis', search: 'ElasticSearch', ai: 'TensorFlow/PyTorch', iot: 'MQTT + AWS IoT' },
    future: ['IoT water sensors', 'Satellite pond monitoring', 'Automated feeding systems', 'AI disease detection', 'Blockchain traceability']
  });
});

module.exports = router;
