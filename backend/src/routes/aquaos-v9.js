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
// ROLE GUARD MIDDLEWARE
// ════════════════════════════════════════════════════════════════
function roleGuard(...roles) {
  return (req, res, next) => {
    const role = sanitizeRole(req);
    if (!roles.includes(role) && role !== 'admin') {
      return res.status(403).json({ error: `Access denied. Required: ${roles.join(', ')}` });
    }
    req.userRole = role;
    next();
  };
}

// ════════════════════════════════════════════════════════════════
// 1. PRIVACY CONTROLS — Farmers control data visibility
// ════════════════════════════════════════════════════════════════

// GET /privacy — get user's privacy settings
router.get('/privacy', authMiddleware, async (req, res) => {
  try {
    let result = await query('SELECT * FROM aqua_privacy_settings WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      // Create default settings
      result = await query(`
        INSERT INTO aqua_privacy_settings (user_id) VALUES ($1) RETURNING *
      `, [req.user.id]);
    }
    res.json({ privacy: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /privacy — update privacy settings
router.put('/privacy', authMiddleware, async (req, res) => {
  try {
    const fields = ['show_farm_location', 'show_production_volumes', 'show_contact_phone',
      'show_contact_email', 'show_pond_details', 'show_feed_brand', 'show_survival_rate',
      'allow_buyer_contact', 'allow_supplier_contact', 'allow_expert_contact',
      'anonymous_community_posts', 'data_sharing_consent', 'analytics_opt_in'];
    const updates = [];
    const values = [req.user.id];
    let idx = 2;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx}`);
        values.push(req.body[f]);
        idx++;
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    const result = await query(`
      UPDATE aqua_privacy_settings SET ${updates.join(', ')} WHERE user_id = $1 RETURNING *
    `, values);
    if (result.rows.length === 0) {
      // Create then update
      await query('INSERT INTO aqua_privacy_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [req.user.id]);
      const r2 = await query(`UPDATE aqua_privacy_settings SET ${updates.join(', ')} WHERE user_id = $1 RETURNING *`, values);
      return res.json({ privacy: r2.rows[0] });
    }
    res.json({ privacy: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 2. REAL-TIME NEGOTIATION
// ════════════════════════════════════════════════════════════════

// POST /negotiations — start a negotiation room
router.post('/negotiations', authMiddleware, roleGuard('buyer'), async (req, res) => {
  try {
    const { crop_post_id, harvest_listing_id, farmer_id, initial_offer, quantity_kg, species } = req.body;
    if (!farmer_id) return res.status(400).json({ error: 'farmer_id required' });
    const room = await query(`
      INSERT INTO aqua_negotiation_rooms (id, crop_post_id, harvest_listing_id, farmer_id, buyer_id,
        current_offer, initial_asking_price, species, last_action_by, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'buyer', NOW() + INTERVAL '72 hours') RETURNING *
    `, [uuidv4(), crop_post_id, harvest_listing_id, farmer_id, req.user.id, initial_offer, initial_offer, species]);

    // Create first message
    if (initial_offer) {
      await query(`
        INSERT INTO aqua_negotiation_messages (id, room_id, sender_id, sender_role, message_type, content, price_offered, quantity_kg)
        VALUES ($1,$2,$3,'buyer','offer',$4,$5,$6)
      `, [uuidv4(), room.rows[0].id, req.user.id, `Offer: ₹${initial_offer}/kg`, initial_offer, quantity_kg]);
    }
    res.status(201).json({ room: room.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /negotiations — list my negotiation rooms
router.get('/negotiations', authMiddleware, async (req, res) => {
  try {
    const role = sanitizeRole(req);
    const col = role === 'buyer' ? 'buyer_id' : 'farmer_id';
    const result = await query(`
      SELECT * FROM aqua_negotiation_rooms WHERE ${col} = $1 ORDER BY updated_at DESC LIMIT 50
    `, [req.user.id]);
    res.json({ rooms: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /negotiations/:id/messages — get messages in a room
router.get('/negotiations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_negotiation_messages WHERE room_id = $1 ORDER BY created_at ASC
    `, [req.params.id]);
    res.json({ messages: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /negotiations/:id/messages — send message/counter-offer
router.post('/negotiations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { message_type, content, price_offered, quantity_kg } = req.body;
    const role = sanitizeRole(req);
    const msg = await query(`
      INSERT INTO aqua_negotiation_messages (id, room_id, sender_id, sender_role, message_type, content, price_offered, quantity_kg)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, role, message_type || 'text', content, price_offered, quantity_kg]);

    // Update room with parameterized queries
    const roomParams = [req.params.id, role];
    let roomSql = 'UPDATE aqua_negotiation_rooms SET updated_at = NOW(), last_action_by = $2, negotiation_round = negotiation_round + 1';
    let paramIdx = 3;
    if (price_offered && role === 'buyer') {
      roomSql += `, current_offer = $${paramIdx}`;
      roomParams.push(price_offered);
      paramIdx++;
    }
    if (price_offered && role === 'farmer') {
      roomSql += `, counter_offer = $${paramIdx}`;
      roomParams.push(price_offered);
      paramIdx++;
    }
    roomSql += ' WHERE id = $1';
    await query(roomSql, roomParams);

    res.status(201).json({ message: msg.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /negotiations/:id/accept — accept deal
router.post('/negotiations/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { agreed_price, agreed_quantity_kg } = req.body;
    const result = await query(`
      UPDATE aqua_negotiation_rooms SET status = 'agreed', agreed_price = $1,
        agreed_quantity_kg = $2, closed_at = NOW(), updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [agreed_price, agreed_quantity_kg, req.params.id]);
    res.json({ room: result.rows[0], message: 'Deal agreed! Proceed to escrow/payment.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /negotiations/:id/reject — reject/close
router.post('/negotiations/:id/reject', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      UPDATE aqua_negotiation_rooms SET status = 'rejected', closed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [req.params.id]);
    res.json({ room: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 3. NOTIFICATION PREFERENCES
// ════════════════════════════════════════════════════════════════

// GET /notification-prefs
router.get('/notification-prefs', authMiddleware, async (req, res) => {
  try {
    let result = await query('SELECT * FROM aqua_notification_prefs WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      result = await query('INSERT INTO aqua_notification_prefs (user_id) VALUES ($1) RETURNING *', [req.user.id]);
    }
    res.json({ prefs: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /notification-prefs
router.put('/notification-prefs', authMiddleware, async (req, res) => {
  try {
    const fields = ['channel_push', 'channel_sms', 'channel_email', 'channel_whatsapp',
      'alert_advisory', 'alert_buyer_offers', 'alert_supplier_promos', 'alert_community_replies',
      'alert_price_changes', 'alert_harvest_reminders', 'alert_disease_outbreaks',
      'quiet_hours_start', 'quiet_hours_end', 'language'];
    const updates = [];
    const values = [req.user.id];
    let idx = 2;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx}`);
        values.push(req.body[f]);
        idx++;
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push('updated_at = NOW()');
    await query('INSERT INTO aqua_notification_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [req.user.id]);
    const result = await query(`
      UPDATE aqua_notification_prefs SET ${updates.join(', ')} WHERE user_id = $1 RETURNING *
    `, values);
    res.json({ prefs: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 4. PRODUCTION DATA INSIGHTS (Platform's Hidden Asset)
// ════════════════════════════════════════════════════════════════

// GET /insights — published production insights
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const { species, district, type } = req.query;
    let sql = 'SELECT * FROM aqua_production_insights WHERE is_published = true';
    const params = [];
    let idx = 1;
    if (species) { sql += ` AND species = $${idx}`; params.push(species); idx++; }
    if (district) { sql += ` AND district = $${idx}`; params.push(district); idx++; }
    if (type) { sql += ` AND insight_type = $${idx}`; params.push(type); idx++; }
    sql += ' ORDER BY insight_type, species, district';
    const result = await query(sql, params);
    res.json({ insights: result.rows, total: result.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /insights/summary — aggregated summary
router.get('/insights/summary', authMiddleware, async (req, res) => {
  try {
    const survival = await query(`
      SELECT species, district, AVG(metric_value) as avg_val, SUM(sample_size) as total_samples
      FROM aqua_production_insights WHERE insight_type = 'survival_rate' AND is_published = true
      GROUP BY species, district ORDER BY avg_val DESC
    `);
    const growth = await query(`
      SELECT species, district, AVG(metric_value) as avg_val
      FROM aqua_production_insights WHERE insight_type = 'growth_rate' AND is_published = true
      GROUP BY species, district ORDER BY avg_val DESC
    `);
    const disease = await query(`
      SELECT species, district, metric_name, metric_value
      FROM aqua_production_insights WHERE insight_type = 'disease_outbreak' AND is_published = true
      ORDER BY metric_value DESC
    `);
    res.json({
      survival_rates: survival.rows,
      growth_rates: growth.rows,
      disease_hotspots: disease.rows,
      data_value: 'Production data is the platform\'s biggest hidden asset'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 5. ADMIN PANEL — Analytics + Moderation + Verification
// ════════════════════════════════════════════════════════════════

// GET /admin/analytics — platform-wide analytics
router.get('/admin/analytics', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const latest = await query('SELECT * FROM aqua_platform_analytics ORDER BY snapshot_date DESC LIMIT 1');
    const history = await query('SELECT * FROM aqua_platform_analytics ORDER BY snapshot_date DESC LIMIT 30');
    res.json({ current: latest.rows[0] || {}, history: history.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /admin/users — user management
router.get('/admin/users', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const { role, status, search, page } = req.query;
    const offset = ((parseInt(page) || 1) - 1) * 25;
    let sql = `SELECT id, name, email, phone, role, created_at FROM users WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (role) { sql += ` AND role = $${idx}`; params.push(role); idx++; }
    if (search) { sql += ` AND (name ILIKE $${idx} OR email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    sql += ` ORDER BY created_at DESC LIMIT 25 OFFSET $${idx}`;
    params.push(offset);
    const result = await query(sql, params);
    res.json({ users: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /admin/harvest-monitoring — monitor active listings
router.get('/admin/harvest-monitoring', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const listings = await query(`
      SELECT * FROM aqua_crop_posts WHERE status = 'active' ORDER BY created_at DESC LIMIT 50
    `);
    const deals = await query(`
      SELECT * FROM aqua_negotiation_rooms WHERE status = 'agreed' ORDER BY closed_at DESC LIMIT 20
    `);
    res.json({ active_listings: listings.rows, recent_deals: deals.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /admin/verification-queue — supplier verification
router.get('/admin/verification-queue', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_verification_queue WHERE status = 'pending' ORDER BY submitted_at ASC
    `);
    res.json({ queue: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /admin/verification-queue/:id — approve/reject verification
router.put('/admin/verification-queue/:id', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' });
    }
    const result = await query(`
      UPDATE aqua_verification_queue SET status = $1, reviewer_id = $2, reviewer_notes = $3, reviewed_at = NOW()
      WHERE id = $4 RETURNING *
    `, [status, req.user.id, notes, req.params.id]);

    // Audit log
    await query(`
      INSERT INTO aqua_admin_audit_log (id, admin_id, action, resource_type, resource_id, details)
      VALUES ($1,$2,$3,'verification',$4,$5)
    `, [uuidv4(), req.user.id, `verification_${status}`, req.params.id, JSON.stringify({ notes })]);

    res.json({ verification: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /admin/fraud-alerts — security monitoring
router.get('/admin/fraud-alerts', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const alerts = await query('SELECT * FROM aqua_fraud_alerts WHERE status = $1 ORDER BY created_at DESC LIMIT 50', [req.query.status || 'open']);
    res.json({ alerts: alerts.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /admin/fraud-alerts/:id — resolve fraud alert
router.put('/admin/fraud-alerts/:id', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const { action_taken } = req.body;
    const result = await query(`
      UPDATE aqua_fraud_alerts SET status = 'resolved', reviewed_by = $1, reviewed_at = NOW(), action_taken = $2
      WHERE id = $3 RETURNING *
    `, [req.user.id, action_taken, req.params.id]);
    res.json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /admin/audit-log — admin actions log
router.get('/admin/audit-log', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM aqua_admin_audit_log ORDER BY created_at DESC LIMIT 100');
    res.json({ logs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 6. SECURITY — Report fraud + Rate limit check
// ════════════════════════════════════════════════════════════════

// POST /fraud-report — any user reports suspicious activity
router.post('/fraud-report', authMiddleware, async (req, res) => {
  try {
    const { reported_user_id, alert_type, description, evidence } = req.body;
    if (!alert_type || !description) {
      return res.status(400).json({ error: 'alert_type and description required' });
    }
    const result = await query(`
      INSERT INTO aqua_fraud_alerts (id, user_id, alert_type, description, evidence, severity)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), reported_user_id || req.user.id, alert_type, description, evidence || {}, req.body.severity || 'medium']);
    res.status(201).json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 7. VERIFICATION SUBMISSION (Supplier/Buyer)
// ════════════════════════════════════════════════════════════════

// POST /verification/submit — submit documents for verification
router.post('/verification/submit', authMiddleware, async (req, res) => {
  try {
    const { verification_type, documents } = req.body;
    if (!verification_type) return res.status(400).json({ error: 'verification_type required' });
    const role = sanitizeRole(req);
    const result = await query(`
      INSERT INTO aqua_verification_queue (id, user_id, user_role, verification_type, documents)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.user.id, role, verification_type, documents || []]);
    res.status(201).json({ verification: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /verification/status — check my verification status
router.get('/verification/status', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM aqua_verification_queue WHERE user_id = $1 ORDER BY submitted_at DESC
    `, [req.user.id]);
    res.json({ verifications: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// 8. PLATFORM WORKFLOW — Commission & Revenue tracking
// ════════════════════════════════════════════════════════════════

// GET /revenue-summary — admin sees revenue breakdown
router.get('/revenue-summary', authMiddleware, roleGuard('admin'), async (req, res) => {
  try {
    const latest = await query(`
      SELECT revenue_commission_inr, revenue_subscription_inr, revenue_leads_inr,
        (revenue_commission_inr + revenue_subscription_inr + revenue_leads_inr) as total_revenue
      FROM aqua_platform_analytics ORDER BY snapshot_date DESC LIMIT 1
    `);
    res.json({
      revenue: latest.rows[0] || {},
      model: {
        buyers: ['subscription', 'lead_access', 'transaction_commission'],
        suppliers: ['listing_fee', 'promotion_fee', 'advertising', 'verified_badge'],
        farmers: ['FREE — never pay initially']
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
