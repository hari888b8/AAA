const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── FPO Profile ──────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT fp.*, d.name as district_name, d.state_name 
       FROM fpo_profiles fp
       LEFT JOIN districts d ON fp.district_id = d.id
       WHERE fp.user_id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.json({ profile: null });
    res.json({ profile: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const { fpo_name, fpo_type, registration_number, state, district_id, block, 
            office_address, ceo_name, whatsapp_number, primary_crops, year_established } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO fpo_profiles (user_id, fpo_name, fpo_type, registration_number, state, district_id, 
        block, office_address, ceo_name, whatsapp_number, primary_crops, year_established)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id) DO UPDATE SET
        fpo_name=$2, fpo_type=$3, registration_number=$4, state=$5, district_id=$6,
        block=$7, office_address=$8, ceo_name=$9, whatsapp_number=$10, primary_crops=$11, year_established=$12
       RETURNING *`,
      [req.user.id, fpo_name, fpo_type || 'FPO', registration_number, state, district_id,
       block, office_address, ceo_name, whatsapp_number, primary_crops || [], year_established]
    );
    res.json({ profile: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Members ──────────────────────────────────────────────────
router.get('/members', async (req, res) => {
  try {
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.json({ members: [] });
    const fpoId = fpo.rows[0].id;
    const { rows } = await pool.query(
      `SELECT fm.*, u.name as farmer_name, u.phone as farmer_phone, 
              fp.village, fp.total_land_acres, fp.primary_crops as farmer_crops
       FROM fpo_memberships fm
       JOIN users u ON fm.farmer_id = u.id
       LEFT JOIN farmer_profiles fp ON fp.user_id = u.id
       WHERE fm.fpo_id = $1 AND fm.status = 'active'
       ORDER BY fm.joined_at DESC`,
      [fpoId]
    );
    res.json({ members: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/members', async (req, res) => {
  try {
    const { farmer_phone } = req.body;
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.status(400).json({ error: 'FPO profile not found' });
    const farmer = await pool.query('SELECT id FROM users WHERE phone = $1', [farmer_phone]);
    if (farmer.rows.length === 0) return res.status(404).json({ error: 'Farmer not found' });
    await pool.query(
      'INSERT INTO fpo_memberships (fpo_id, farmer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [fpo.rows[0].id, farmer.rows[0].id]
    );
    await pool.query(
      'UPDATE fpo_profiles SET member_count = member_count + 1, active_member_count = active_member_count + 1 WHERE id = $1',
      [fpo.rows[0].id]
    );
    res.json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Procurement ──────────────────────────────────────────────
router.get('/procurement', async (req, res) => {
  try {
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.json({ records: [] });
    const { rows } = await pool.query(
      `SELECT pr.*, u.name as farmer_name, c.name as crop_name
       FROM procurement_records pr
       JOIN users u ON pr.farmer_id = u.id
       LEFT JOIN crop_catalog c ON pr.crop_id = c.id
       WHERE pr.fpo_id = $1
       ORDER BY pr.procurement_date DESC
       LIMIT $2 OFFSET $3`,
      [fpo.rows[0].id, req.query.limit || 20, req.query.offset || 0]
    );
    res.json({ records: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/procurement', async (req, res) => {
  try {
    const { farmer_id, farmer_phone, farmer_name, crop_id, quantity_kg, quality_grade,
            moisture_content, price_per_kg, deduction_transport, deduction_other,
            collection_center, notes } = req.body;
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.status(400).json({ error: 'FPO profile not found' });

    // Resolve farmer_id from phone if not provided
    let resolvedFarmerId = farmer_id;
    if (!resolvedFarmerId && farmer_phone) {
      const fu = await pool.query('SELECT id FROM users WHERE phone = $1', [farmer_phone]);
      resolvedFarmerId = fu.rows[0]?.id || null;
    }

    const gross = (quantity_kg || 0) * (price_per_kg || 0);
    const net = gross - (deduction_transport || 0) - (deduction_other || 0);
    const { rows } = await pool.query(
      `INSERT INTO procurement_records (fpo_id, farmer_id, crop_id, quantity_kg, quality_grade,
        moisture_content, price_per_kg, gross_amount, deduction_transport, deduction_other,
        net_payable, collection_center, notes, farmer_name_fallback)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [fpo.rows[0].id, resolvedFarmerId, crop_id, quantity_kg, quality_grade || 'A',
       moisture_content, price_per_kg, gross, deduction_transport || 0, deduction_other || 0,
       net, collection_center, notes, farmer_name || null]
    );
    res.json({ record: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /fpo/procurement/:id — update payment or grade
router.patch('/procurement/:id', async (req, res) => {
  try {
    const { payment_status, notes } = req.body;
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.status(400).json({ error: 'FPO profile not found' });
    const allowed = ['pending', 'paid', 'partial'];
    if (payment_status && !allowed.includes(payment_status))
      return res.status(400).json({ error: `payment_status must be one of: ${allowed.join(', ')}` });
    const updates = [];
    const params = [];
    let i = 1;
    if (payment_status) { updates.push(`payment_status = $${i++}`); params.push(payment_status); }
    if (notes !== undefined) { updates.push(`notes = $${i++}`); params.push(notes); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id, fpo.rows[0].id);
    const { rows } = await pool.query(
      `UPDATE procurement_records SET ${updates.join(', ')} WHERE id = $${i++} AND fpo_id = $${i++} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Record not found' });
    res.json({ record: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /fpo/procurement/summary — crop-wise aggregation
router.get('/procurement/summary', async (req, res) => {
  try {
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.json({ summary: [] });
    const { rows } = await pool.query(
      `SELECT c.name as crop_name, 
              COUNT(*) as record_count,
              COALESCE(SUM(pr.quantity_kg),0) as total_kg,
              COALESCE(SUM(pr.gross_amount),0) as total_value,
              COALESCE(SUM(CASE WHEN pr.payment_status='paid' THEN pr.net_payable ELSE 0 END),0) as paid_amount,
              COALESCE(SUM(CASE WHEN pr.payment_status!='paid' THEN pr.net_payable ELSE 0 END),0) as pending_amount,
              ROUND(AVG(pr.price_per_kg),2) as avg_price_per_kg
       FROM procurement_records pr
       LEFT JOIN crop_catalog c ON pr.crop_id = c.id
       WHERE pr.fpo_id = $1
       GROUP BY c.name ORDER BY total_kg DESC`,
      [fpo.rows[0].id]
    );
    res.json({ summary: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Inventory ────────────────────────────────────────────────
router.get('/inventory', async (req, res) => {
  try {
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.json({ inventory: [] });
    const { rows } = await pool.query(
      `SELECT fi.*, c.name as crop_name
       FROM fpo_inventory fi
       LEFT JOIN crop_catalog c ON fi.crop_id = c.id
       WHERE fi.fpo_id = $1
       ORDER BY fi.entry_date DESC`,
      [fpo.rows[0].id]
    );
    res.json({ inventory: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const { crop_id, storage_location, storage_type, quantity_kg, quality_grade, notes } = req.body;
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.status(400).json({ error: 'FPO profile not found' });
    const { rows } = await pool.query(
      `INSERT INTO fpo_inventory (fpo_id, crop_id, storage_location, storage_type, quantity_kg, quality_grade, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [fpo.rows[0].id, crop_id, storage_location, storage_type, quantity_kg, quality_grade || 'ungraded', notes]
    );
    res.json({ item: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FPO Supply Listings ──────────────────────────────────────
router.get('/supply-listings', async (req, res) => {
  try {
    const { crop_id, status, limit = 20 } = req.query;
    let query = `SELECT fl.*, c.name as crop_name, fp.fpo_name, d.name as district_name
                 FROM fpo_supply_listings fl
                 JOIN fpo_profiles fp ON fl.fpo_id = fp.id
                 LEFT JOIN crop_catalog c ON fl.crop_id = c.id
                 LEFT JOIN districts d ON fp.district_id = d.id
                 WHERE 1=1`;
    const params = [];
    if (crop_id) { params.push(crop_id); query += ` AND fl.crop_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND fl.status = $${params.length}`; }
    else { query += ` AND fl.status = 'active'`; }
    params.push(limit);
    query += ` ORDER BY fl.created_at DESC LIMIT $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json({ listings: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/supply-listings', async (req, res) => {
  try {
    const { crop_id, quantity_available, quality_grade, harvest_from_date, harvest_to_date,
            price_per_kg, min_order_kg, packaging, certifications, storage_location, special_notes } = req.body;
    const fpo = await pool.query('SELECT id FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.status(400).json({ error: 'FPO profile not found' });
    const { rows } = await pool.query(
      `INSERT INTO fpo_supply_listings (fpo_id, crop_id, quantity_available, quality_grade,
        harvest_from_date, harvest_to_date, price_per_kg, min_order_kg, packaging,
        certifications, storage_location, special_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [fpo.rows[0].id, crop_id, quantity_available, quality_grade || 'A',
       harvest_from_date, harvest_to_date, price_per_kg, min_order_kg,
       packaging || [], certifications || [], storage_location, special_notes]
    );
    res.json({ listing: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FPO Stats ────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const fpo = await pool.query('SELECT id, member_count, active_member_count FROM fpo_profiles WHERE user_id = $1', [req.user.id]);
    if (fpo.rows.length === 0) return res.json({ stats: { member_count: 0, procurement_total: 0, inventory_total: 0, active_listings: 0, pending_payments: 0 } });
    const fpoId = fpo.rows[0].id;
    const procResult = await pool.query('SELECT COALESCE(SUM(gross_amount), 0) as total FROM procurement_records WHERE fpo_id = $1', [fpoId]);
    const invResult = await pool.query('SELECT COALESCE(SUM(quantity_kg), 0) as total FROM fpo_inventory WHERE fpo_id = $1', [fpoId]);
    const listResult = await pool.query("SELECT COUNT(*) as count FROM fpo_supply_listings WHERE fpo_id = $1 AND status = 'active'", [fpoId]);
    const pendResult = await pool.query("SELECT COALESCE(SUM(net_payable), 0) as total FROM procurement_records WHERE fpo_id = $1 AND payment_status = 'pending'", [fpoId]);
    res.json({
      stats: {
        member_count: fpo.rows[0].member_count || 0,
        active_members: fpo.rows[0].active_member_count || 0,
        procurement_total: parseFloat(procResult.rows[0].total),
        inventory_kg: parseFloat(invResult.rows[0].total),
        active_listings: parseInt(listResult.rows[0].count),
        pending_payments: parseFloat(pendResult.rows[0].total),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
