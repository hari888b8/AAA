const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ─── GET /chat/conversations — List user's conversations ───────────────────
router.get('/conversations', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.*,
        CASE WHEN c.user1_id = $1 THEN u2.name ELSE u1.name END AS other_name,
        CASE WHEN c.user1_id = $1 THEN u2.avatar_url ELSE u1.avatar_url END AS other_avatar,
        CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_id,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = FALSE) AS unread
       FROM conversations c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY c.last_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ conversations: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /chat/conversations — Start or find conversation ─────────────────
router.post('/conversations', auth, async (req, res) => {
  try {
    const { other_user_id, context_type, context_id } = req.body;
    if (!other_user_id) return res.status(400).json({ error: 'other_user_id required' });
    if (other_user_id === req.user.id) return res.status(400).json({ error: 'Cannot message yourself' });

    // Check for existing conversation
    const existing = await pool.query(
      `SELECT * FROM conversations
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
       LIMIT 1`,
      [req.user.id, other_user_id]
    );
    if (existing.rows.length > 0) {
      return res.json({ conversation: existing.rows[0], existing: true });
    }

    const r = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, context_type, context_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, other_user_id, context_type || null, context_id || null]
    );
    res.status(201).json({ conversation: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /chat/messages/:conversationId — Get messages ─────────────────────
router.get('/messages/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const offset = parseInt(req.query.offset) || 0;

    // Verify user is part of conversation
    const convo = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [conversationId, req.user.id]
    );
    if (convo.rows.length === 0) return res.status(403).json({ error: 'Not your conversation' });

    const msgs = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT 100 OFFSET $2`,
      [conversationId, offset]
    );

    // Mark as read
    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
      [conversationId, req.user.id]
    );

    res.json({ messages: msgs.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /chat/messages — Send a message ──────────────────────────────────
router.post('/messages', auth, async (req, res) => {
  try {
    const { conversation_id, body, msg_type } = req.body;
    if (!conversation_id || !body) return res.status(400).json({ error: 'conversation_id, body required' });

    // Verify user is part of conversation
    const convo = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [conversation_id, req.user.id]
    );
    if (convo.rows.length === 0) return res.status(403).json({ error: 'Not your conversation' });

    const m = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, msg_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [conversation_id, req.user.id, body, msg_type || 'text']
    );

    // Update conversation last_message
    await pool.query(
      'UPDATE conversations SET last_message = $1, last_at = NOW() WHERE id = $2',
      [body.substring(0, 200), conversation_id]
    );

    res.status(201).json({ message: m.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /chat/unread — Total unread count ─────────────────────────────────
router.get('/unread', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) AS unread FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.user1_id = $1 OR c.user2_id = $1) AND m.sender_id != $1 AND m.is_read = FALSE`,
      [req.user.id]
    );
    res.json({ unread: parseInt(r.rows[0]?.unread || 0) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
