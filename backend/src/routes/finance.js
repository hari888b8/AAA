'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// FINANCIAL ECOSYSTEM — Credit, Loans, Insurance
// ═══════════════════════════════════════════════════════════════

// GET /api/finance/credit-score — Get my credit score
router.get('/credit-score', auth, async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM credit_scores WHERE user_id = $1', [req.user.id]);

    if (!result.rows.length) {
      result = await pool.query(
        'INSERT INTO credit_scores (user_id) VALUES ($1) RETURNING *',
        [req.user.id]
      );
    }

    res.json({ creditScore: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/credit-score/compute — Recompute credit score
router.post('/credit-score/compute', auth, async (req, res) => {
  try {
    // Simple heuristic: trade volume + repayment history
    const trades = await pool.query(
      "SELECT COUNT(*) as total FROM orders WHERE (seller_id = $1 OR buyer_id = $1) AND status = 'completed'",
      [req.user.id]
    );
    const tradeCount = parseInt(trades.rows[0].total) || 0;

    // Score: base 300, +50 per 5 trades, max 900
    const score = Math.min(900, 300 + Math.floor(tradeCount / 5) * 50);
    const eligibleAmount = score >= 500 ? (score - 400) * 200 : 0;

    const result = await pool.query(`
      INSERT INTO credit_scores (user_id, score, eligible_amount, factors, last_computed)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        score = $2, eligible_amount = $3, factors = $4, last_computed = NOW(), updated_at = NOW()
      RETURNING *
    `, [req.user.id, score, eligibleAmount, JSON.stringify({ trade_count: tradeCount })]);

    res.json({ creditScore: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/loans/apply — Apply for micro loan
router.post('/loans/apply', auth, async (req, res) => {
  try {
    const { amount, tenure_months, purpose, collateral } = req.body;
    if (!amount || !tenure_months) return res.status(400).json({ error: 'amount and tenure_months required' });

    const interestRate = 12;
    const monthlyRate = interestRate / 12 / 100;
    const emiAmount = Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) /
      (Math.pow(1 + monthlyRate, tenure_months) - 1) * 100) / 100;

    const result = await pool.query(`
      INSERT INTO micro_loans (user_id, amount, interest_rate, tenure_months, emi_amount, purpose, collateral)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user.id, amount, interestRate, tenure_months, emiAmount,
        purpose, JSON.stringify(collateral || {})]);

    res.status(201).json({ loan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/loans — List my loans
router.get('/loans', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM micro_loans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ loans: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/finance/loans/:id/disburse — Disburse loan (admin/bank)
router.put('/loans/:id/disburse', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE micro_loans SET status = 'disbursed', disbursed_at = NOW(),
        next_emi_date = CURRENT_DATE + INTERVAL '30 days', updated_at = NOW()
      WHERE id = $1 AND status = 'approved'
      RETURNING *
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Loan not found or not approved' });
    res.json({ loan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/insurance/enroll — Enroll in crop insurance
router.post('/insurance/enroll', auth, async (req, res) => {
  try {
    const { crop_name, season, area_hectares, sum_insured, provider, start_date, end_date } = req.body;
    if (!crop_name || !sum_insured) return res.status(400).json({ error: 'crop_name and sum_insured required' });

    const premiumAmount = Math.round(sum_insured * 0.02 * 100) / 100; // 2% premium

    const result = await pool.query(`
      INSERT INTO crop_insurance (user_id, crop_name, season, area_hectares, sum_insured,
        premium_amount, provider, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.id, crop_name, season, area_hectares, sum_insured,
        premiumAmount, provider || 'PMFBY', start_date, end_date]);

    res.status(201).json({ insurance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/insurance — List my insurance policies
router.get('/insurance', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM crop_insurance WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ policies: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/insurance/:id/claim — File insurance claim
router.post('/insurance/:id/claim', auth, async (req, res) => {
  try {
    const { claim_amount, reason } = req.body;
    const result = await pool.query(`
      UPDATE crop_insurance SET claim_status = 'filed', claim_amount = $2, updated_at = NOW()
      WHERE id = $1 AND user_id = $3 AND status = 'active'
      RETURNING *
    `, [req.params.id, claim_amount, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Policy not found' });
    res.json({ insurance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
