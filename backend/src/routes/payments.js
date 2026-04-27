const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { createNotification } = require('./pushnotifications');

// Razorpay config (uses test keys in dev, live keys in production)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'demo_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';
const PLATFORM_COMMISSION_RATE = 0.03; // 3% platform commission

// ─── POST /create-order — Create a payment order ────────────────
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, currency = 'INR', order_type, reference_id, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const order_number = 'ORD_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const commission = Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100;

    // In production, this would call Razorpay API:
    // const razorpay = new Razorpay({ key_id, key_secret });
    // const order = await razorpay.orders.create({ amount: amount*100, currency, receipt: order_number });

    // For now, create a platform payment order
    const gateway_order_id = 'order_' + crypto.randomBytes(12).toString('hex');

    const { rows } = await pool.query(
      `INSERT INTO payment_orders (user_id, order_number, gateway_order_id, amount, currency, commission, order_type, reference_id, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'created') RETURNING *`,
      [req.user.id, order_number, gateway_order_id, amount, currency, commission, order_type, reference_id, description]
    );

    res.status(201).json({
      payment_order: rows[0],
      razorpay_order_id: gateway_order_id,
      razorpay_key_id: RAZORPAY_KEY_ID,
      amount_paise: Math.round(amount * 100),
      currency,
      prefill: { name: req.user.name, contact: req.user.phone },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /verify — Verify payment after Razorpay checkout ──────
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_order_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Payment details required' });
    }

    // Verify signature (HMAC SHA256)
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const is_valid = generated_signature === razorpay_signature;

    // In demo mode, accept if payment_id starts with 'pay_demo'
    const demo_mode = razorpay_payment_id.startsWith('pay_demo');
    if (!is_valid && !demo_mode) {
      await pool.query(
        `UPDATE payment_orders SET status='failed', updated_at=NOW() WHERE gateway_order_id=$1`,
        [razorpay_order_id]
      );
      return res.status(400).json({ error: 'Payment verification failed', verified: false });
    }

    // Mark payment as successful
    const { rows } = await pool.query(
      `UPDATE payment_orders SET status='paid', gateway_payment_id=$1, paid_at=NOW(), updated_at=NOW()
       WHERE gateway_order_id=$2 AND user_id=$3 RETURNING *`,
      [razorpay_payment_id, razorpay_order_id, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Payment order not found' });

    const paymentOrder = rows[0];

    // If linked to a platform order, update it
    if (paymentOrder.reference_id) {
      await pool.query(
        `UPDATE orders SET payment_status='paid', status='confirmed', updated_at=NOW() WHERE id=$1`,
        [paymentOrder.reference_id]
      ).catch(() => {});
    }

    // Create transaction record
    await pool.query(
      `INSERT INTO transactions (user_id, payment_order_id, amount, type, status, description)
       VALUES ($1,$2,$3,'payment','completed',$4)`,
      [req.user.id, paymentOrder.id, paymentOrder.amount, paymentOrder.description || 'Payment']
    );

    // Notify user of successful payment
    await createNotification(
      req.user.id, 'payment',
      '✅ Payment Successful',
      `₹${Number(paymentOrder.amount).toLocaleString()} paid successfully. Order #${paymentOrder.order_number}`,
      { payment_order_id: paymentOrder.id, amount: paymentOrder.amount }
    );

    res.json({ verified: true, payment: paymentOrder });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /history — Payment history ─────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM payment_orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, Number(limit), Number(offset)]
    );
    res.json({ payments: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /receipt/:id — Get receipt for a payment ───────────────
router.get('/receipt/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT po.*, u.name, u.phone FROM payment_orders po
       JOIN users u ON po.user_id = u.id
       WHERE po.id=$1 AND po.user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Receipt not found' });
    const p = rows[0];
    res.json({
      receipt: {
        order_number: p.order_number,
        amount: p.amount,
        commission: p.commission,
        currency: p.currency,
        status: p.status,
        paid_at: p.paid_at,
        description: p.description,
        customer: { name: p.name, phone: p.phone },
        gateway_ref: p.gateway_payment_id,
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /wallet — Get wallet balance ───────────────────────────
router.get('/wallet', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END), 0) as balance
       FROM transactions WHERE user_id=$1 AND status='completed'`,
      [req.user.id]
    );
    const { rows: recent } = await pool.query(
      `SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );
    res.json({ balance: parseFloat(rows[0].balance) || 0, recent_transactions: recent });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /wallet/add — Add money to wallet ─────────────────────
router.post('/wallet/add', auth, async (req, res) => {
  try {
    const { amount, razorpay_payment_id } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    await pool.query(
      `INSERT INTO transactions (user_id, amount, type, status, description)
       VALUES ($1,$2,'credit','completed','Wallet top-up')`,
      [req.user.id, amount]
    );
    res.json({ success: true, message: `₹${amount} added to wallet` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /webhook — Razorpay webhook handler ───────────────────
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expected = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (event === 'payment.authorized' || event === 'payment.captured') {
      await pool.query(
        `UPDATE payment_orders SET status='paid', gateway_payment_id=$1, paid_at=NOW(), updated_at=NOW()
         WHERE gateway_order_id=$2`,
        [payment.id, payment.order_id]
      );
    } else if (event === 'payment.failed') {
      await pool.query(
        `UPDATE payment_orders SET status='failed', updated_at=NOW() WHERE gateway_order_id=$1`,
        [payment.order_id]
      );
    }

    res.json({ status: 'ok' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /refund — Request refund for a payment ────────────────
router.post('/refund', auth, async (req, res) => {
  try {
    const { payment_order_id, reason } = req.body;
    if (!payment_order_id || !reason) return res.status(400).json({ error: 'payment_order_id and reason required' });

    const { rows } = await pool.query(
      `SELECT * FROM payment_orders WHERE id=$1 AND user_id=$2`,
      [payment_order_id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Payment order not found' });
    const p = rows[0];
    if (p.status !== 'paid') return res.status(400).json({ error: 'Only paid orders can be refunded' });
    if (p.refund_status === 'refunded') return res.status(400).json({ error: 'Already refunded' });

    await pool.query(
      `UPDATE payment_orders SET refund_status='requested', refund_reason=$1, updated_at=NOW() WHERE id=$2`,
      [reason, payment_order_id]
    );
    // Credit refund to wallet
    await pool.query(
      `INSERT INTO transactions (user_id, payment_order_id, amount, type, status, description)
       VALUES ($1,$2,$3,'credit','completed',$4)`,
      [req.user.id, payment_order_id, p.amount, `Refund: ${reason}`]
    );
    // Mark linked order as refunded
    if (p.reference_id) {
      await pool.query(
        `UPDATE orders SET status='refunded', payment_status='refunded', updated_at=NOW() WHERE id=$1`,
        [p.reference_id]
      ).catch(() => {});
    }
    res.json({ success: true, message: `₹${p.amount} refunded to your wallet`, refunded_amount: p.amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
