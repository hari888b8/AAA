const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ─── POST / — Create a support ticket ───────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { category, subject, description, priority = 'medium', attachments } = req.body;
    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'category, subject, and description are required' });
    }

    const validCategories = ['payment', 'listing', 'account', 'technical', 'order', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
    }

    const { rows } = await pool.query(
      `INSERT INTO support_tickets (user_id, category, subject, description, priority, attachments)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, category, subject, description, priority, JSON.stringify(attachments || [])]
    );
    res.status(201).json({ ticket: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET / — List user's tickets ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT * FROM support_tickets WHERE user_id = $1`;
    const params = [req.user.id];
    if (status) { query += ` AND status = $2`; params.push(status); }
    query += ` ORDER BY created_at DESC LIMIT 50`;

    const { rows } = await pool.query(query, params);
    res.json({ tickets: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /:id — Get ticket details with messages ─────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows: tickets } = await pool.query(
      `SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const { rows: messages } = await pool.query(
      `SELECT tm.*, u.name AS sender_name
       FROM ticket_messages tm
       JOIN users u ON tm.sender_id = u.id
       WHERE tm.ticket_id = $1 AND tm.is_internal = FALSE
       ORDER BY tm.created_at ASC`,
      [req.params.id]
    );

    res.json({ ticket: tickets[0], messages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /:id/messages — Add message to ticket ──────────────────────────────
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content is required' });

    // Verify ticket belongs to user
    const { rows: tickets } = await pool.query(
      `SELECT id, status FROM support_tickets WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (tickets.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const { rows } = await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, content, attachments)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, content, JSON.stringify(attachments || [])]
    );

    // Reopen if it was waiting for customer
    if (tickets[0].status === 'waiting_customer') {
      await pool.query(
        `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
    }

    res.status(201).json({ message: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /:id — Close ticket ───────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'closed') return res.status(400).json({ error: 'Users can only close tickets' });

    const { rows } = await pool.query(
      `UPDATE support_tickets SET status = 'closed', updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ticket: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
