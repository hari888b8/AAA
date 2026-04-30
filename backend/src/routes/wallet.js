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

module.exports = router;
