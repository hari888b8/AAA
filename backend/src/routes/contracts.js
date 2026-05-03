'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// CONTRACT FARMING — Propose, Negotiate, Sign, Track
// ═══════════════════════════════════════════════════════════════

// POST /api/contracts — Propose a new contract
router.post('/', auth, async (req, res) => {
  try {
    const { farmer_id, fpo_id, crop_name, variety, quantity_kg, price_per_kg,
            advance_percent, quality_params, delivery_date, delivery_location, terms_pdf_url } = req.body;

    if (!farmer_id || !crop_name || !quantity_kg || !price_per_kg) {
      return res.status(400).json({ error: 'farmer_id, crop_name, quantity_kg, price_per_kg required' });
    }

    const result = await pool.query(`
      INSERT INTO farming_contracts (buyer_id, farmer_id, fpo_id, crop_name, variety, quantity_kg,
        price_per_kg, advance_percent, quality_params, delivery_date, delivery_location, terms_pdf_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [req.user.id, farmer_id, fpo_id, crop_name, variety, quantity_kg,
        price_per_kg, advance_percent || 0, JSON.stringify(quality_params || {}),
        delivery_date, delivery_location, terms_pdf_url]);

    res.status(201).json({ contract: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contracts — List my contracts
router.get('/', auth, async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = '';
    const params = [];

    if (role === 'farmer') {
      query = 'SELECT * FROM farming_contracts WHERE farmer_id = $1';
      params.push(req.user.id);
    } else {
      query = 'SELECT * FROM farming_contracts WHERE buyer_id = $1';
      params.push(req.user.id);
    }

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ contracts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contracts/:id — Get contract details
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM farming_contracts WHERE id = $1 AND (buyer_id = $2 OR farmer_id = $2)',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Contract not found' });

    const milestones = await pool.query(
      'SELECT * FROM contract_milestones WHERE contract_id = $1 ORDER BY due_date',
      [req.params.id]
    );

    res.json({ contract: result.rows[0], milestones: milestones.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contracts/:id/accept — Farmer accepts contract
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE farming_contracts SET status = 'accepted', signed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND farmer_id = $2 AND status = 'proposed'
      RETURNING *
    `, [req.params.id, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Contract not found or cannot accept' });
    res.json({ contract: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contracts/:id/reject — Reject contract
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await pool.query(`
      UPDATE farming_contracts SET status = 'rejected', cancellation_reason = $3,
        cancelled_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND (farmer_id = $2 OR buyer_id = $2) AND status = 'proposed'
      RETURNING *
    `, [req.params.id, req.user.id, reason]);

    if (!result.rows.length) return res.status(404).json({ error: 'Contract not found' });
    res.json({ contract: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contracts/:id/complete — Mark contract as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE farming_contracts SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND buyer_id = $2 AND status = 'accepted'
      RETURNING *
    `, [req.params.id, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Contract not found' });
    res.json({ contract: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contracts/:id/milestones — Add milestone
router.post('/:id/milestones', auth, async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const result = await pool.query(`
      INSERT INTO contract_milestones (contract_id, title, description, due_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.params.id, title, description, due_date]);

    res.status(201).json({ milestone: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contracts/:contractId/milestones/:milestoneId/complete
router.put('/:contractId/milestones/:milestoneId/complete', auth, async (req, res) => {
  try {
    const { proof_url } = req.body;
    const result = await pool.query(`
      UPDATE contract_milestones SET status = 'completed', completed_at = NOW(), proof_url = $3
      WHERE id = $1 AND contract_id = $2
      RETURNING *
    `, [req.params.milestoneId, req.params.contractId, proof_url]);

    if (!result.rows.length) return res.status(404).json({ error: 'Milestone not found' });
    res.json({ milestone: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contracts/predictions/prices — Price predictions for a crop
router.get('/predictions/prices', auth, async (req, res) => {
  try {
    const { crop_id, district_id, days } = req.query;
    const lookback = parseInt(days) || 30;

    const result = await pool.query(`
      SELECT * FROM price_predictions
      WHERE ($1::uuid IS NULL OR crop_id = $1)
        AND ($2::uuid IS NULL OR district_id = $2)
        AND prediction_date >= CURRENT_DATE - $3 * INTERVAL '1 day'
      ORDER BY prediction_date DESC LIMIT 60
    `, [crop_id || null, district_id || null, lookback]);

    res.json({ predictions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
