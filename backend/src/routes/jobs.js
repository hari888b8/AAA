const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Browse Jobs ──────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { category, district, limit = 30 } = req.query;
  try {
    let sql = `SELECT j.*, u.name AS poster_name FROM jobs j
               LEFT JOIN users u ON j.posted_by = u.id
               WHERE j.status = 'open'`;
    const params = [];
    if (category) { params.push(category); sql += ` AND j.category = $${params.length}`; }
    if (district) { params.push(`%${district}%`); sql += ` AND j.location ILIKE $${params.length}`; }
    params.push(Math.min(Number(limit), 100));
    sql += ` ORDER BY j.created_at DESC LIMIT $${params.length}`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT j.*, COUNT(a.id) AS application_count
       FROM jobs j LEFT JOIN job_applications a ON a.job_id = j.id
       WHERE j.posted_by = $1 GROUP BY j.id ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, category, location, pay_rate, description, slots, urgency } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Title and category required' });
  try {
    const result = await query(
      `INSERT INTO jobs (posted_by, title, category, location, pay_rate, description, slots, urgency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open') RETURNING *`,
      [req.user.id, title, category, location, pay_rate, description, slots || 1, urgency || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

router.patch('/:id/close', authMiddleware, async (req, res) => {
  try {
    await query(
      `UPDATE jobs SET status = 'closed' WHERE id = $1 AND posted_by = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to close job' });
  }
});

// ── Applications ──────────────────────────────────────────────────────────────

router.post('/:id/apply', authMiddleware, async (req, res) => {
  const { cover_note, phone } = req.body;
  try {
    const result = await query(
      `INSERT INTO job_applications (job_id, applicant_id, cover_note, phone, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (job_id, applicant_id) DO NOTHING RETURNING *`,
      [req.params.id, req.user.id, cover_note, phone]
    );
    if (!result.rows.length) return res.status(409).json({ error: 'Already applied' });
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;
