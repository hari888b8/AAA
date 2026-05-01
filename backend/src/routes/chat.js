const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

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

// ═══════════════════════════════════════════════════════════════
// VOICE MESSAGES — Critical for non-literate farmers
// ═══════════════════════════════════════════════════════════════

// POST /chat/voice — Send voice message
router.post('/voice', auth, async (req, res) => {
  try {
    const { conversation_id, audio_url, duration_seconds, language } = req.body;
    if (!conversation_id || !audio_url) return res.status(400).json({ error: 'conversation_id, audio_url required' });

    // Verify membership
    const convo = await pool.query(
      `SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [conversation_id, req.user.id]
    );
    if (!convo.rows.length) {
      // Check group membership
      const group = await pool.query(
        `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [conversation_id, req.user.id]
      );
      if (!group.rows.length) return res.status(403).json({ error: 'Not a member' });
    }

    // In production: speech-to-text transcription via API
    const transcription = `[Voice message - ${duration_seconds || 0}s - ${language || 'te'}]`;

    const m = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, msg_type, metadata)
       VALUES ($1, $2, $3, 'voice', $4) RETURNING *`,
      [conversation_id, req.user.id, transcription,
       JSON.stringify({ audio_url, duration_seconds, language: language || 'te', transcription })]
    );

    await pool.query(`UPDATE conversations SET last_message = $1, last_at = NOW() WHERE id = $2`,
      [`🎤 Voice message (${duration_seconds || 0}s)`, conversation_id]);

    res.status(201).json({ message: m.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// AUTO-TRANSLATE — Telugu ↔ Hindi ↔ English
// ═══════════════════════════════════════════════════════════════

// POST /chat/translate — Translate a message
router.post('/translate', auth, async (req, res) => {
  try {
    const { message_id, target_language } = req.body;
    if (!message_id || !target_language) return res.status(400).json({ error: 'message_id, target_language required' });

    const msg = await pool.query(`SELECT * FROM messages WHERE id = $1`, [message_id]);
    if (!msg.rows.length) return res.status(404).json({ error: 'Message not found' });

    // In production: call Google Translate / Azure Translator API
    // For now: return simulated translation
    const translations = {
      'te': '[Telugu translation placeholder]',
      'hi': '[Hindi translation placeholder]',
      'en': msg.rows[0].body, // English = original
      'kn': '[Kannada translation placeholder]',
    };

    res.json({
      original: msg.rows[0].body,
      translated: translations[target_language] || msg.rows[0].body,
      target_language,
      confidence: 0.92,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// DEAL CLOSURE IN CHAT — Accept deal → auto-create escrow
// ═══════════════════════════════════════════════════════════════

// POST /chat/deal — Propose/accept deal within chat
router.post('/deal', auth, async (req, res) => {
  try {
    const { conversation_id, listing_id, price_per_kg, quantity_kg, action } = req.body;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id required' });

    if (action === 'propose') {
      if (!listing_id || !price_per_kg || !quantity_kg) {
        return res.status(400).json({ error: 'listing_id, price_per_kg, quantity_kg required for proposal' });
      }
      const total = price_per_kg * quantity_kg;
      const dealMsg = `💰 Deal Proposal:\n• Quantity: ${quantity_kg} kg\n• Price: ₹${price_per_kg}/kg\n• Total: ₹${total}\n\nReply "Accept" to confirm.`;

      const m = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, body, msg_type, metadata)
         VALUES ($1, $2, $3, 'deal_proposal', $4) RETURNING *`,
        [conversation_id, req.user.id, dealMsg,
         JSON.stringify({ listing_id, price_per_kg, quantity_kg, total, status: 'proposed' })]
      );
      await pool.query(`UPDATE conversations SET last_message = $1, last_at = NOW() WHERE id = $2`,
        ['💰 Deal Proposal', conversation_id]);
      return res.status(201).json({ message: m.rows[0], deal_status: 'proposed' });
    }

    if (action === 'accept') {
      // Find the latest deal proposal in this conversation
      const proposal = await pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 AND msg_type = 'deal_proposal'
         AND sender_id != $2 ORDER BY created_at DESC LIMIT 1`,
        [conversation_id, req.user.id]
      );
      if (!proposal.rows.length) return res.status(404).json({ error: 'No deal proposal found' });

      const meta = typeof proposal.rows[0].metadata === 'string'
        ? JSON.parse(proposal.rows[0].metadata) : proposal.rows[0].metadata;

      // Create escrow (in production: integrate with payment gateway)
      const escrowId = `ESC-${Date.now().toString(36).toUpperCase()}`;
      const acceptMsg = `✅ Deal Accepted!\n• Amount: ₹${meta.total}\n• Escrow: ${escrowId}\n• Pickup will be scheduled.`;

      const m = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, body, msg_type, metadata)
         VALUES ($1, $2, $3, 'deal_accepted', $4) RETURNING *`,
        [conversation_id, req.user.id, acceptMsg,
         JSON.stringify({ ...meta, status: 'accepted', escrow_id: escrowId })]
      );
      await pool.query(`UPDATE conversations SET last_message = $1, last_at = NOW() WHERE id = $2`,
        ['✅ Deal Accepted', conversation_id]);
      return res.status(201).json({ message: m.rows[0], deal_status: 'accepted', escrow_id: escrowId });
    }

    res.status(400).json({ error: 'action must be "propose" or "accept"' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// GROUP CHATS — FPO groups with 50+ member farmers
// ═══════════════════════════════════════════════════════════════

// POST /chat/groups — Create a group
router.post('/groups', auth, async (req, res) => {
  try {
    const { name, description, member_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name required' });

    const groupId = uuidv4();
    await pool.query(
      `INSERT INTO chat_groups (id, name, description, created_by, avatar_url)
       VALUES ($1, $2, $3, $4, NULL)`,
      [groupId, name, description, req.user.id]
    );

    // Add creator as admin
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [groupId, req.user.id]
    );

    // Add members
    if (member_ids && member_ids.length > 0) {
      for (const uid of member_ids) {
        await pool.query(
          `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
          [groupId, uid]
        );
      }
    }

    res.status(201).json({ group_id: groupId, name, members_added: (member_ids || []).length + 1 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /chat/groups — List my groups
router.get('/groups', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT cg.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = cg.id) AS member_count,
        (SELECT body FROM messages WHERE conversation_id = cg.id ORDER BY created_at DESC LIMIT 1) AS last_message
       FROM chat_groups cg
       JOIN group_members gm ON gm.group_id = cg.id AND gm.user_id = $1
       ORDER BY cg.updated_at DESC`,
      [req.user.id]
    );
    res.json({ groups: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /chat/groups/:id/message — Send message to group
router.post('/groups/:id/message', auth, async (req, res) => {
  try {
    const { body, msg_type } = req.body;
    if (!body) return res.status(400).json({ error: 'body required' });

    // Verify membership
    const member = await pool.query(
      `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ error: 'Not a group member' });

    const m = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, msg_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, body, msg_type || 'text']
    );

    await pool.query(`UPDATE chat_groups SET updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.status(201).json({ message: m.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /chat/groups/:id/announce — Admin announcement
router.post('/groups/:id/announce', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'body required' });

    const member = await pool.query(
      `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin'`,
      [req.params.id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ error: 'Only admins can announce' });

    const m = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, msg_type)
       VALUES ($1, $2, $3, 'announcement') RETURNING *`,
      [req.params.id, req.user.id, body]
    );
    res.status(201).json({ message: m.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// QUICK REPLY TEMPLATES
// ═══════════════════════════════════════════════════════════════

// GET /chat/templates — Get quick reply templates
router.get('/templates', auth, async (req, res) => {
  const templates = [
    { id: 'avail', text: 'Yes, available ✓', category: 'response' },
    { id: 'price', text: 'Price is ₹{price}/quintal', category: 'pricing' },
    { id: 'delivery', text: 'Delivery by {date}', category: 'logistics' },
    { id: 'negotiate', text: 'Can you offer ₹{price}?', category: 'negotiation' },
    { id: 'accept', text: 'Deal accepted! ✅', category: 'deal' },
    { id: 'reject', text: 'Sorry, not available now', category: 'response' },
    { id: 'quality', text: 'Grade {grade}, moisture {pct}%', category: 'quality' },
    { id: 'location', text: 'Collection point: {location}', category: 'logistics' },
    { id: 'payment', text: 'Payment terms: advance {pct}%', category: 'payment' },
    { id: 'thanks', text: 'Thank you! 🙏', category: 'response' },
  ];
  res.json({ templates });
});

// ═══════════════════════════════════════════════════════════════
// PRODUCT/LISTING SHARE — Share listing cards in chat
// ═══════════════════════════════════════════════════════════════

// POST /chat/share-listing — Share a product/listing in chat
router.post('/share-listing', auth, async (req, res) => {
  try {
    const { conversation_id, listing_id, listing_type } = req.body;
    if (!conversation_id || !listing_id) return res.status(400).json({ error: 'conversation_id, listing_id required' });

    // Fetch listing details based on type
    let listingData = {};
    if (listing_type === 'supply') {
      const r = await pool.query(
        `SELECT sl.*, cc.name AS crop_name FROM supply_listings sl JOIN crop_catalog cc ON cc.id = sl.crop_id WHERE sl.id = $1`,
        [listing_id]
      );
      if (r.rows.length) listingData = r.rows[0];
    } else if (listing_type === 'equipment') {
      const r = await pool.query(`SELECT * FROM equipment WHERE id = $1`, [listing_id]);
      if (r.rows.length) listingData = r.rows[0];
    }

    const shareMsg = listing_type === 'supply'
      ? `📦 Shared Listing: ${listingData.crop_name || 'Crop'} — ${listingData.quantity_kg || 0} kg @ ₹${listingData.price_per_kg || 'TBD'}/kg`
      : `🚜 Shared Equipment: ${listingData.name || 'Equipment'} — ₹${listingData.daily_rate || 0}/day`;

    const m = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, msg_type, metadata)
       VALUES ($1, $2, $3, 'listing_share', $4) RETURNING *`,
      [conversation_id, req.user.id, shareMsg,
       JSON.stringify({ listing_id, listing_type, ...listingData })]
    );

    await pool.query(`UPDATE conversations SET last_message = $1, last_at = NOW() WHERE id = $2`,
      [shareMsg.substring(0, 100), conversation_id]);

    res.status(201).json({ message: m.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// READ RECEIPTS — Message delivery/read status
// ═══════════════════════════════════════════════════════════════

// POST /chat/read-receipt — Mark messages as read
router.post('/read-receipt', auth, async (req, res) => {
  try {
    const { conversation_id, last_read_message_id } = req.body;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id required' });

    const updated = await pool.query(
      `UPDATE messages SET is_read = TRUE, read_at = NOW()
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE
       RETURNING id`,
      [conversation_id, req.user.id]
    );

    res.json({ marked_read: updated.rowCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
