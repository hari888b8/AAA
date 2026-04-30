const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { createNotification } = require('./pushnotifications');

// ─── Escrow States ──────────────────────────────────────────────────────────
// created → funded → delivery_confirmed → released
//        → disputed → refunded
//        → cancelled (from created/funded)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  created: ['funded', 'cancelled'],
  funded: ['delivery_confirmed', 'disputed', 'cancelled'],
  delivery_confirmed: ['released', 'disputed'],
  disputed: ['refunded', 'released'],
  released: [],
  refunded: [],
  cancelled: [],
};

// ─── POST /escrow — Create escrow for an order ───────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { order_id, seller_id, amount, currency = 'INR', description, release_conditions } = req.body;
    if (!order_id || !seller_id || !amount) {
      return res.status(400).json({ error: 'order_id, seller_id, and amount are required' });
    }
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    if (seller_id === req.user.id) return res.status(400).json({ error: 'Cannot create escrow with yourself' });

    const commission_rate = 0.03;
    const platform_fee = Math.round(amount * commission_rate * 100) / 100;

    const { rows } = await pool.query(
      `INSERT INTO escrow_transactions 
       (buyer_id, seller_id, order_id, amount, currency, platform_fee, description, release_conditions, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'created') RETURNING *`,
      [req.user.id, seller_id, order_id, amount, currency, platform_fee, description, JSON.stringify(release_conditions || {})]
    );

    await createNotification(seller_id, 'escrow_created', `Escrow of ₹${amount} created for your order`, { escrow_id: rows[0].id });

    res.status(201).json({ escrow: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /escrow/:id — Get escrow details ────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, 
        bu.name AS buyer_name, su.name AS seller_name
       FROM escrow_transactions e
       JOIN users bu ON e.buyer_id = bu.id
       JOIN users su ON e.seller_id = su.id
       WHERE e.id = $1 AND (e.buyer_id = $2 OR e.seller_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });
    res.json({ escrow: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /escrow — List user's escrows ───────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { role, status } = req.query;
    let conditions = ['(e.buyer_id = $1 OR e.seller_id = $1)'];
    let params = [req.user.id];
    let i = 2;

    if (role === 'buyer') { conditions = ['e.buyer_id = $1']; }
    if (role === 'seller') { conditions = ['e.seller_id = $1']; }
    if (status) { conditions.push(`e.state = $${i++}`); params.push(status); }

    const { rows } = await pool.query(
      `SELECT e.*, bu.name AS buyer_name, su.name AS seller_name
       FROM escrow_transactions e
       JOIN users bu ON e.buyer_id = bu.id
       JOIN users su ON e.seller_id = su.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.created_at DESC LIMIT 50`,
      params
    );
    res.json({ escrows: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /escrow/:id/action — Transition escrow state ───────────────────────
router.post('/:id/action', auth, async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });

    const { rows } = await pool.query(
      `SELECT * FROM escrow_transactions WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });

    const escrow = rows[0];
    const validNextStates = VALID_TRANSITIONS[escrow.state] || [];

    // Map action names to states
    const actionToState = {
      fund: 'funded',
      confirm_delivery: 'delivery_confirmed',
      release: 'released',
      dispute: 'disputed',
      refund: 'refunded',
      cancel: 'cancelled',
    };

    const targetState = actionToState[action];
    if (!targetState) return res.status(400).json({ error: `Invalid action: ${action}` });
    if (!validNextStates.includes(targetState)) {
      return res.status(400).json({ error: `Cannot transition from '${escrow.state}' to '${targetState}'` });
    }

    // Permission checks
    const isBuyer = escrow.buyer_id === req.user.id;
    const isSeller = escrow.seller_id === req.user.id;

    if (action === 'fund' && !isBuyer) return res.status(403).json({ error: 'Only buyer can fund' });
    if (action === 'confirm_delivery' && !isBuyer) return res.status(403).json({ error: 'Only buyer can confirm delivery' });
    if (action === 'release' && !isBuyer) return res.status(403).json({ error: 'Only buyer can release funds' });
    if (action === 'cancel' && escrow.state === 'funded' && !isBuyer) return res.status(403).json({ error: 'Only buyer can cancel funded escrow' });

    // Update state
    const updateFields = { state: targetState };
    if (action === 'fund') updateFields.funded_at = new Date();
    if (action === 'release') updateFields.released_at = new Date();
    if (action === 'refund') updateFields.refunded_at = new Date();
    if (action === 'dispute') updateFields.disputed_at = new Date();

    const setClauses = Object.entries(updateFields).map(([k], idx) => `${k} = $${idx + 2}`);
    const setValues = Object.values(updateFields);

    if (reason) {
      setClauses.push(`dispute_reason = $${setClauses.length + 2}`);
      setValues.push(reason);
    }

    const { rows: updated } = await pool.query(
      `UPDATE escrow_transactions SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...setValues]
    );

    // Notify other party
    const notifyUser = isBuyer ? escrow.seller_id : escrow.buyer_id;
    await createNotification(notifyUser, 'escrow_update', `Escrow ${action}: ₹${escrow.amount}`, { escrow_id: escrow.id, action });

    res.json({ escrow: updated[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /escrow/:id/dispute — File dispute with details ────────────────────
router.post('/:id/dispute', auth, async (req, res) => {
  try {
    const { reason, evidence_urls, description } = req.body;
    if (!reason) return res.status(400).json({ error: 'Dispute reason is required' });

    const { rows } = await pool.query(
      `SELECT * FROM escrow_transactions WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });

    const escrow = rows[0];
    if (!['funded', 'delivery_confirmed'].includes(escrow.state)) {
      return res.status(400).json({ error: 'Can only dispute funded or delivery_confirmed escrows' });
    }

    const { rows: updated } = await pool.query(
      `UPDATE escrow_transactions 
       SET state = 'disputed', disputed_at = NOW(), 
           dispute_reason = $2, dispute_evidence = $3, dispute_description = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id, reason, JSON.stringify(evidence_urls || []), description]
    );

    // Notify both parties and admin
    const otherParty = escrow.buyer_id === req.user.id ? escrow.seller_id : escrow.buyer_id;
    await createNotification(otherParty, 'escrow_disputed', `Dispute filed on escrow ₹${escrow.amount}: ${reason}`, { escrow_id: escrow.id });

    res.json({ escrow: updated[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
