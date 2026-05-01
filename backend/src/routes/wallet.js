'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { createNotification } = require('./pushnotifications');

// ═══════════════════════════════════════════════════════════════
// UNIFIED WALLET & CREDIT SYSTEM
// Platform-wide wallet (AgriHub Credits) that works across all apps
// ═══════════════════════════════════════════════════════════════

// Credit earning rules
const CREDIT_RULES = {
  declaration_submit: { credits: 10, description: 'Submitted crop declaration' },
  listing_create: { credits: 15, description: 'Created supply listing' },
  referral_signup: { credits: 50, description: 'Referral signup bonus' },
  referral_first_transaction: { credits: 100, description: 'Referral first transaction bonus' },
  community_post: { credits: 5, description: 'Community contribution' },
  profile_complete: { credits: 25, description: 'Profile completion bonus' },
  first_order: { credits: 30, description: 'First order bonus' },
  daily_login: { credits: 2, description: 'Daily login reward' },
  kyc_verified: { credits: 50, description: 'KYC verification reward' },
  training_complete: { credits: 20, description: 'Training module completed' },
};

// Credit spending options
const SPEND_OPTIONS = [
  { id: 'contact_unlock', credits: 20, description: 'Unlock seller contact (FarmerConnect)' },
  { id: 'equipment_deposit', credits: 50, description: 'Equipment booking deposit (KisanConnect)' },
  { id: 'subscription_discount', credits: 100, description: '₹100 off subscription upgrade' },
  { id: 'priority_listing', credits: 30, description: 'Priority listing for 7 days' },
  { id: 'expert_consultation', credits: 75, description: '15-min expert consultation' },
];

// ─── GET /balance — Get wallet balance & credit summary ────────
router.get('/balance', auth, async (req, res) => {
  try {
    // Get credit balance
    const { rows: balanceRows } = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type='earn' THEN credits ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN type='spend' THEN credits ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN type='earn' THEN credits ELSE -credits END), 0) as balance
       FROM wallet_credits WHERE user_id=$1`,
      [req.user.id]
    );

    // Get cash wallet balance (from transactions table)
    const { rows: cashRows } = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END), 0) as cash_balance
       FROM transactions WHERE user_id=$1 AND status='completed'`,
      [req.user.id]
    );

    // Get recent credit transactions
    const { rows: recent } = await pool.query(
      `SELECT * FROM wallet_credits WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [req.user.id]
    );

    // Get referral stats
    const { rows: referralRows } = await pool.query(
      `SELECT COUNT(*) as referral_count FROM users WHERE referred_by=$1`,
      [req.user.id]
    );

    res.json({
      credits: {
        balance: parseInt(balanceRows[0]?.balance) || 0,
        total_earned: parseInt(balanceRows[0]?.total_earned) || 0,
        total_spent: parseInt(balanceRows[0]?.total_spent) || 0,
      },
      cash_balance: parseFloat(cashRows[0]?.cash_balance) || 0,
      referrals: parseInt(referralRows[0]?.referral_count) || 0,
      recent_activity: recent,
      spend_options: SPEND_OPTIONS,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /earn — Earn credits for an action ──────────────────
router.post('/earn', auth, async (req, res) => {
  try {
    const { action, reference_id } = req.body;
    const rule = CREDIT_RULES[action];
    if (!rule) return res.status(400).json({ error: 'Invalid earning action' });

    // Prevent duplicate earning for same reference
    if (reference_id) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM wallet_credits WHERE user_id=$1 AND action=$2 AND reference_id=$3`,
        [req.user.id, action, reference_id]
      );
      if (existing.length) return res.status(409).json({ error: 'Credits already earned for this action' });
    }

    // Award credits
    const { rows } = await pool.query(
      `INSERT INTO wallet_credits (user_id, credits, type, action, description, reference_id)
       VALUES ($1, $2, 'earn', $3, $4, $5) RETURNING *`,
      [req.user.id, rule.credits, action, rule.description, reference_id]
    );

    // Get new balance
    const { rows: balRows } = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type='earn' THEN credits ELSE -credits END), 0) as balance
       FROM wallet_credits WHERE user_id=$1`,
      [req.user.id]
    );

    await createNotification(
      req.user.id, 'wallet',
      '🎉 Credits Earned!',
      `+${rule.credits} AgriHub Credits for: ${rule.description}`,
      { credits: rule.credits, action }
    );

    res.json({
      earned: rule.credits,
      action,
      new_balance: parseInt(balRows[0]?.balance) || 0,
      transaction: rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /spend — Spend credits on a feature ─────────────────
router.post('/spend', auth, async (req, res) => {
  try {
    const { option_id, reference_id } = req.body;
    const option = SPEND_OPTIONS.find(o => o.id === option_id);
    if (!option) return res.status(400).json({ error: 'Invalid spend option' });

    // Check balance
    const { rows: balRows } = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type='earn' THEN credits ELSE -credits END), 0) as balance
       FROM wallet_credits WHERE user_id=$1`,
      [req.user.id]
    );
    const balance = parseInt(balRows[0]?.balance) || 0;
    if (balance < option.credits) {
      return res.status(400).json({ error: 'Insufficient credits', required: option.credits, available: balance });
    }

    // Deduct credits
    const { rows } = await pool.query(
      `INSERT INTO wallet_credits (user_id, credits, type, action, description, reference_id)
       VALUES ($1, $2, 'spend', $3, $4, $5) RETURNING *`,
      [req.user.id, option.credits, option_id, option.description, reference_id]
    );

    res.json({
      spent: option.credits,
      option: option_id,
      new_balance: balance - option.credits,
      transaction: rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /history — Full credit history ────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 30, offset = 0, type } = req.query;
    let query_str = `SELECT * FROM wallet_credits WHERE user_id=$1`;
    const params = [req.user.id];

    if (type && (type === 'earn' || type === 'spend')) {
      query_str += ` AND type=$${params.length + 1}`;
      params.push(type);
    }
    query_str += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query_str, params);

    // Get total count
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as total FROM wallet_credits WHERE user_id=$1`,
      [req.user.id]
    );

    res.json({ transactions: rows, total: parseInt(countRows[0]?.total) || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /referral — Get referral code and stats ──────────────
router.get('/referral', auth, async (req, res) => {
  try {
    // Generate referral code if not exists
    let { rows } = await pool.query(
      `SELECT referral_code FROM users WHERE id=$1`, [req.user.id]
    );
    let code = rows[0]?.referral_code;
    if (!code) {
      const randomPart = require('crypto').randomBytes(3).toString('hex').toUpperCase();
      code = 'AGRI' + req.user.phone.slice(-4) + randomPart;
      await pool.query(`UPDATE users SET referral_code=$1 WHERE id=$2`, [code, req.user.id]);
    }

    // Get referral stats
    const { rows: referrals } = await pool.query(
      `SELECT u.name, u.created_at, 
        CASE WHEN EXISTS (SELECT 1 FROM orders WHERE buyer_id=u.id) THEN true ELSE false END as has_transacted
       FROM users u WHERE u.referred_by=$1 ORDER BY u.created_at DESC`,
      [req.user.id]
    );

    const total_referrals = referrals.length;
    const active_referrals = referrals.filter(r => r.has_transacted).length;
    const total_credits_earned = (total_referrals * CREDIT_RULES.referral_signup.credits) +
      (active_referrals * CREDIT_RULES.referral_first_transaction.credits);

    res.json({
      referral_code: code,
      share_message: `Join AgriHub and get 50 credits! Use my code: ${code}. Download: https://agrihub.app/r/${code}`,
      stats: { total_referrals, active_referrals, total_credits_earned },
      referrals: referrals.slice(0, 10),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /referral/apply — Apply a referral code ─────────────
router.post('/referral/apply', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Referral code required' });

    // Check if user already has a referrer
    const { rows: userRows } = await pool.query(
      `SELECT referred_by FROM users WHERE id=$1`, [req.user.id]
    );
    if (userRows[0]?.referred_by) return res.status(400).json({ error: 'Referral already applied' });

    // Find referrer
    const { rows: referrerRows } = await pool.query(
      `SELECT id FROM users WHERE referral_code=$1`, [code]
    );
    if (!referrerRows.length) return res.status(404).json({ error: 'Invalid referral code' });
    if (referrerRows[0].id === req.user.id) return res.status(400).json({ error: 'Cannot use own code' });

    // Apply referral
    await pool.query(`UPDATE users SET referred_by=$1 WHERE id=$2`, [referrerRows[0].id, req.user.id]);

    // Award credits to referrer
    await pool.query(
      `INSERT INTO wallet_credits (user_id, credits, type, action, description, reference_id)
       VALUES ($1, $2, 'earn', 'referral_signup', $3, $4)`,
      [referrerRows[0].id, CREDIT_RULES.referral_signup.credits, 'New referral signup', req.user.id]
    );

    // Award welcome credits to new user
    await pool.query(
      `INSERT INTO wallet_credits (user_id, credits, type, action, description, reference_id)
       VALUES ($1, 25, 'earn', 'referral_welcome', 'Welcome bonus from referral', $2)`,
      [req.user.id, referrerRows[0].id]
    );

    res.json({ success: true, message: 'Referral applied! You earned 25 welcome credits.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /leaderboard — Top credit earners ────────────────────
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.district_id, d.name as district_name,
        COALESCE(SUM(CASE WHEN wc.type='earn' THEN wc.credits ELSE 0 END), 0) as total_earned,
        COUNT(DISTINCT CASE WHEN wc.action='referral_signup' THEN wc.reference_id END) as referrals
      FROM users u
      LEFT JOIN wallet_credits wc ON u.id = wc.user_id
      LEFT JOIN districts d ON u.district_id = d.id
      GROUP BY u.id, u.name, u.district_id, d.name
      HAVING SUM(CASE WHEN wc.type='earn' THEN wc.credits ELSE 0 END) > 0
      ORDER BY total_earned DESC
      LIMIT 20
    `);
    res.json({ leaderboard: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// AGRI-CREDIT SCORE — Farm-based creditworthiness
// ═══════════════════════════════════════════════════════════════

router.get('/credit-score', auth, async (req, res) => {
  try {
    // Calculate credit score based on farming history
    const [declarations, transactions, activity, profile] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM declarations WHERE user_id = $1`, [req.user.id]),
      pool.query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = $1 AND status = 'completed'`, [req.user.id]),
      pool.query(`SELECT COUNT(*) AS count FROM farm_activities WHERE user_id = $1`, [req.user.id]),
      pool.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]),
    ]);

    const declCount = parseInt(declarations.rows[0]?.count) || 0;
    const txnCount = parseInt(transactions.rows[0]?.count) || 0;
    const txnTotal = parseFloat(transactions.rows[0]?.total) || 0;
    const actCount = parseInt(activity.rows[0]?.count) || 0;
    const isVerified = profile.rows[0]?.is_verified || false;

    // Scoring algorithm (max 900)
    let score = 300; // Base
    score += Math.min(declCount * 20, 100); // Declarations (max +100)
    score += Math.min(txnCount * 10, 150);  // Transactions (max +150)
    score += Math.min(actCount * 5, 100);   // Farm activity (max +100)
    score += isVerified ? 100 : 0;          // Verification (+100)
    score += Math.min(Math.floor(txnTotal / 10000) * 10, 150); // Transaction volume (max +150)

    const rating = score >= 750 ? 'Excellent' : score >= 600 ? 'Good' : score >= 450 ? 'Fair' : 'Building';

    res.json({
      score: Math.min(score, 900),
      max_score: 900,
      rating,
      factors: {
        declarations: { count: declCount, points: Math.min(declCount * 20, 100), max: 100 },
        transactions: { count: txnCount, points: Math.min(txnCount * 10, 150), max: 150 },
        farm_activity: { count: actCount, points: Math.min(actCount * 5, 100), max: 100 },
        verification: { verified: isVerified, points: isVerified ? 100 : 0, max: 100 },
        volume: { total: txnTotal, points: Math.min(Math.floor(txnTotal / 10000) * 10, 150), max: 150 },
      },
      eligible_for: score >= 600 ? ['Trade Financing', 'Input Credit', 'Equipment Lease'] :
                    score >= 450 ? ['Input Credit (limited)'] : ['Build your score by trading & logging activities'],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// TRADE FINANCING — Short-term crop loan against confirmed order
// ═══════════════════════════════════════════════════════════════

router.post('/trade-finance/apply', auth, async (req, res) => {
  try {
    const { order_id, amount_requested, purpose } = req.body;
    if (!amount_requested) return res.status(400).json({ error: 'amount_requested required' });

    // Check credit score eligibility
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS txn_count FROM transactions WHERE user_id = $1 AND status = 'completed'`,
      [req.user.id]
    );
    if (parseInt(rows[0].txn_count) < 3) {
      return res.status(400).json({ error: 'Minimum 3 completed transactions required for trade financing' });
    }

    const result = await pool.query(`
      INSERT INTO trade_finance_applications (id, user_id, order_id, amount_requested, purpose, status)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'pending') RETURNING *
    `, [req.user.id, order_id, amount_requested, purpose || 'working_capital']);

    res.status(201).json({ application: result.rows[0], message: 'Application submitted for review' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/trade-finance', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trade_finance_applications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ applications: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// SPLIT PAYMENTS — Multiple buyers split payment for one lot
// ═══════════════════════════════════════════════════════════════

router.post('/split-payment', auth, async (req, res) => {
  try {
    const { listing_id, splits } = req.body;
    // splits: [{ buyer_id, amount, quantity_kg }]
    if (!listing_id || !splits || splits.length < 2) {
      return res.status(400).json({ error: 'listing_id and at least 2 splits required' });
    }

    const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
    const splitId = require('uuid').v4();

    // Create split payment record
    await pool.query(`
      INSERT INTO split_payments (id, listing_id, total_amount, status, created_by)
      VALUES ($1, $2, $3, 'pending', $4)
    `, [splitId, listing_id, totalAmount, req.user.id]);

    // Create individual split entries
    for (const split of splits) {
      await pool.query(`
        INSERT INTO split_payment_parts (split_id, buyer_id, amount, quantity_kg, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [splitId, split.buyer_id, split.amount, split.quantity_kg]);
    }

    res.status(201).json({ split_id: splitId, total: totalAmount, parts: splits.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// DISPUTE RESOLUTION — Evidence-based mediation
// ═══════════════════════════════════════════════════════════════

router.post('/disputes', auth, async (req, res) => {
  try {
    const { transaction_id, reason, description, evidence_urls } = req.body;
    if (!transaction_id || !reason) return res.status(400).json({ error: 'transaction_id and reason required' });

    const result = await pool.query(`
      INSERT INTO payment_disputes (id, user_id, transaction_id, reason, description, evidence_urls, status)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'open') RETURNING *
    `, [req.user.id, transaction_id, reason, description, evidence_urls ? JSON.stringify(evidence_urls) : null]);

    res.status(201).json({ dispute: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/disputes', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM payment_disputes WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ disputes: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// FPO GROUP SAVINGS — Collective pool for bulk purchases
// ═══════════════════════════════════════════════════════════════

router.post('/group-savings/contribute', auth, async (req, res) => {
  try {
    const { fpo_id, amount, purpose } = req.body;
    if (!fpo_id || !amount) return res.status(400).json({ error: 'fpo_id and amount required' });

    const result = await pool.query(`
      INSERT INTO group_savings (id, fpo_id, user_id, amount, purpose, status)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active') RETURNING *
    `, [fpo_id, req.user.id, amount, purpose || 'bulk_purchase']);

    res.status(201).json({ contribution: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/group-savings/:fpoId', auth, async (req, res) => {
  try {
    const { rows: contributions } = await pool.query(
      `SELECT gs.*, u.name AS contributor_name FROM group_savings gs
       JOIN users u ON u.id = gs.user_id
       WHERE gs.fpo_id = $1 ORDER BY gs.created_at DESC`,
      [req.params.fpoId]
    );
    const total = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    res.json({ contributions, total_pool: total, member_count: new Set(contributions.map(c => c.user_id)).size });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
