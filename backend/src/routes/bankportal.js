'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// BANK/NBFC PARTNER PORTAL — Loan forwarding, Disbursement, Analytics
// ═══════════════════════════════════════════════════════════════

// GET /api/bankportal/applications — List loan applications for bank partner
router.get('/applications', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM bank_loan_applications WHERE bank_partner_id = $1';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ applications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bankportal/applications/:id/approve — Approve loan
router.post('/applications/:id/approve', auth, async (req, res) => {
  try {
    const { disbursement_ref, disbursed_amount } = req.body;
    const result = await pool.query(`
      UPDATE bank_loan_applications SET status = 'approved', disbursement_ref = $2,
        disbursed_amount = $3, updated_at = NOW()
      WHERE id = $1 AND bank_partner_id = $4
      RETURNING *
    `, [req.params.id, disbursement_ref, disbursed_amount, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bankportal/applications/:id/reject — Reject loan
router.post('/applications/:id/reject', auth, async (req, res) => {
  try {
    const { bank_remarks } = req.body;
    const result = await pool.query(`
      UPDATE bank_loan_applications SET status = 'rejected', bank_remarks = $2, updated_at = NOW()
      WHERE id = $1 AND bank_partner_id = $3
      RETURNING *
    `, [req.params.id, bank_remarks, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bankportal/analytics — Portfolio analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'forwarded') as pending,
        COALESCE(SUM(disbursed_amount) FILTER (WHERE status = 'approved'), 0) as total_disbursed
      FROM bank_loan_applications
      WHERE bank_partner_id = $1
    `, [req.user.id]);

    res.json({ analytics: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
