const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── Buyer Profile ────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM buyer_profiles WHERE user_id = $1', [req.user.id]);
    res.json({ profile: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile', async (req, res) => {
  try {
    const { company_name, business_type, gstin, state, city, sourcing_states,
            commodities, monthly_volume_tons, contact_name, contact_email } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO buyer_profiles (user_id, company_name, business_type, gstin, state, city,
        sourcing_states, commodities, monthly_volume_tons, contact_name, contact_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (user_id) DO UPDATE SET
        company_name=$2, business_type=$3, gstin=$4, state=$5, city=$6,
        sourcing_states=$7, commodities=$8, monthly_volume_tons=$9, contact_name=$10, contact_email=$11
       RETURNING *`,
      [req.user.id, company_name, business_type, gstin, state, city,
       sourcing_states || [], commodities || [], monthly_volume_tons, contact_name, contact_email]
    );
    res.json({ profile: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Supply Search (core buyer feature) ───────────────────────
router.get('/supply-search', async (req, res) => {
  try {
    const { crop_id, state, district_id, quality_grade, min_quantity, source_type, limit = 20, offset = 0 } = req.query;
    
    // Search both FPO supply listings and farmer supply listings
    let results = [];

    // FPO listings
    if (!source_type || source_type === 'fpo') {
      let fpoQuery = `SELECT fl.*, c.name as crop_name, fp.fpo_name, fp.member_count, fp.trust_score,
                        d.name as district_name, d.state_name, 'fpo' as source_type
                       FROM fpo_supply_listings fl
                       JOIN fpo_profiles fp ON fl.fpo_id = fp.id
                       LEFT JOIN crop_catalog c ON fl.crop_id = c.id
                       LEFT JOIN districts d ON fp.district_id = d.id
                       WHERE fl.status = 'active'`;
      const params = [];
      if (crop_id) { params.push(crop_id); fpoQuery += ` AND fl.crop_id = $${params.length}`; }
      if (state) { params.push(state); fpoQuery += ` AND d.state_name ILIKE $${params.length}`; }
      if (district_id) { params.push(district_id); fpoQuery += ` AND fp.district_id = $${params.length}`; }
      if (quality_grade) { params.push(quality_grade); fpoQuery += ` AND fl.quality_grade = $${params.length}`; }
      if (min_quantity) { params.push(min_quantity); fpoQuery += ` AND fl.quantity_available >= $${params.length}`; }
      params.push(limit);
      fpoQuery += ` ORDER BY fl.created_at DESC LIMIT $${params.length}`;
      const fpoResult = await pool.query(fpoQuery, params);
      results = results.concat(fpoResult.rows);
    }

    // Farmer individual listings
    if (!source_type || source_type === 'farmer') {
      let farmerQuery = `SELECT sl.*, c.name as crop_name, u.name as farmer_name,
                            d.name as district_name, d.state_name, 'farmer' as source_type
                         FROM supply_listings sl
                         JOIN users u ON sl.fpo_id = u.id
                         LEFT JOIN crop_catalog c ON sl.crop_id = c.id
                         LEFT JOIN districts d ON sl.district_id = d.id
                         WHERE sl.status = 'active'`;
      const params2 = [];
      if (crop_id) { params2.push(crop_id); farmerQuery += ` AND sl.crop_id = $${params2.length}`; }
      if (state) { params2.push(state); farmerQuery += ` AND d.state_name ILIKE $${params2.length}`; }
      if (district_id) { params2.push(district_id); farmerQuery += ` AND sl.district_id = $${params2.length}`; }
      params2.push(limit);
      farmerQuery += ` ORDER BY sl.created_at DESC LIMIT $${params2.length}`;
      const farmerResult = await pool.query(farmerQuery, params2);
      results = results.concat(farmerResult.rows);
    }

    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Buyer Inquiry ────────────────────────────────────────────
router.get('/inquiries', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bi.*, c.name as crop_name, fl.quantity_available, fp.fpo_name
       FROM buyer_inquiries bi
       LEFT JOIN crop_catalog c ON bi.crop_id = c.id
       LEFT JOIN fpo_supply_listings fl ON bi.fpo_listing_id = fl.id
       LEFT JOIN fpo_profiles fp ON fl.fpo_id = fp.id
       WHERE bi.buyer_id = $1
       ORDER BY bi.created_at DESC
       LIMIT $2`,
      [req.user.id, req.query.limit || 20]
    );
    res.json({ inquiries: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inquiries', async (req, res) => {
  try {
    const { fpo_listing_id, crop_id, quantity_needed, required_by_date,
            delivery_location, quality_needed, price_range_min, price_range_max, message } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO buyer_inquiries (buyer_id, fpo_listing_id, crop_id, quantity_needed,
        required_by_date, delivery_location, quality_needed, price_range_min, price_range_max, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, fpo_listing_id, crop_id, quantity_needed, required_by_date,
       delivery_location, quality_needed, price_range_min, price_range_max, message]
    );
    // Increment inquiry count on FPO listing
    if (fpo_listing_id) {
      await pool.query('UPDATE fpo_supply_listings SET inquiry_count = inquiry_count + 1 WHERE id = $1', [fpo_listing_id]);
    }
    res.json({ inquiry: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Watchlist ────────────────────────────────────────────────
router.get('/watchlist', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bw.*, c.name as crop_name, d.name as district_name
       FROM buyer_watchlists bw
       LEFT JOIN crop_catalog c ON bw.crop_id = c.id
       LEFT JOIN districts d ON bw.district_id = d.id
       WHERE bw.buyer_id = $1`,
      [req.user.id]
    );
    res.json({ watchlist: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/watchlist', async (req, res) => {
  try {
    const { crop_id, state, district_id, min_quantity_kg, max_price_per_kg } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO buyer_watchlists (buyer_id, crop_id, state, district_id, min_quantity_kg, max_price_per_kg)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, crop_id, state, district_id, min_quantity_kg, max_price_per_kg]
    );
    res.json({ item: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/watchlist/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM buyer_watchlists WHERE id = $1 AND buyer_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Supply Intelligence ──────────────────────────────────────
router.get('/intelligence', async (req, res) => {
  try {
    const { crop_id, state } = req.query;
    let query = `SELECT si.*, c.name as crop_name, d.name as district_name
                 FROM supply_intelligence si
                 LEFT JOIN crop_catalog c ON si.crop_id = c.id
                 LEFT JOIN districts d ON si.district_id = d.id WHERE 1=1`;
    const params = [];
    if (crop_id) { params.push(crop_id); query += ` AND si.crop_id = $${params.length}`; }
    if (state) { params.push(state); query += ` AND si.state ILIKE $${params.length}`; }
    query += ' ORDER BY si.computed_at DESC LIMIT 50';
    const { rows } = await pool.query(query, params);
    res.json({ intelligence: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Buyer Stats ──────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const inquiryResult = await pool.query('SELECT COUNT(*) as count FROM buyer_inquiries WHERE buyer_id = $1', [req.user.id]);
    const watchResult = await pool.query('SELECT COUNT(*) as count FROM buyer_watchlists WHERE buyer_id = $1', [req.user.id]);
    const activeListings = await pool.query("SELECT COUNT(*) as count FROM fpo_supply_listings WHERE status = 'active'");
    res.json({
      stats: {
        total_inquiries: parseInt(inquiryResult.rows[0].count),
        active_watchlists: parseInt(watchResult.rows[0].count),
        available_listings: parseInt(activeListings.rows[0].count),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
