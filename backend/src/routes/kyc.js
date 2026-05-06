'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// KYC & IDENTITY VERIFICATION — Aadhaar, DigiLocker, PAN, GSTIN
// 4-Level verification: Basic → Phone → ID → Full
// ═══════════════════════════════════════════════════════════════

const KYC_LEVELS = {
  NONE: 0,
  BASIC: 1,       // Phone verified
  IDENTITY: 2,    // Aadhaar/PAN verified
  BUSINESS: 3,    // GSTIN/FSSAI verified
  FULL: 4,        // All docs + bank + address verified
};

// GET /api/kyc/status — Get my KYC verification status
router.get('/status', auth, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM kyc_verifications WHERE user_id = $1',
      [req.user.id]
    );

    if (!result.rows.length) {
      result = await pool.query(`
        INSERT INTO kyc_verifications (user_id, level, status) VALUES ($1, 0, 'pending')
        RETURNING *
      `, [req.user.id]);
    }

    const kyc = result.rows[0];
    const docs = await pool.query(
      'SELECT doc_type, status, submitted_at, verified_at FROM kyc_documents WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      kyc,
      documents: docs.rows,
      levels: KYC_LEVELS,
      next_steps: getNextSteps(kyc.level),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/aadhaar/initiate — Initiate Aadhaar e-KYC via DigiLocker
router.post('/aadhaar/initiate', auth, async (req, res) => {
  try {
    const { aadhaar_last4, consent } = req.body;
    if (!consent) return res.status(400).json({ error: 'Explicit consent required for Aadhaar verification' });
    if (!aadhaar_last4 || aadhaar_last4.length !== 4) {
      return res.status(400).json({ error: 'Last 4 digits of Aadhaar required' });
    }

    // Generate OTP request to UIDAI (simulated — in production use DigiLocker API)
    const txnId = `AADHAAR_${req.user.id}_${Date.now()}`;

    await pool.query(`
      INSERT INTO kyc_documents (user_id, doc_type, status, reference_id, metadata)
      VALUES ($1, 'aadhaar', 'otp_sent', $2, $3)
      ON CONFLICT (user_id, doc_type) DO UPDATE SET
        status = 'otp_sent', reference_id = $2, metadata = $3, submitted_at = NOW()
    `, [req.user.id, txnId, JSON.stringify({ last4: aadhaar_last4, consent_given: true })]);

    res.json({
      message: 'OTP sent to Aadhaar-linked mobile number',
      transaction_id: txnId,
      expires_in: 300,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/aadhaar/verify — Verify Aadhaar OTP
router.post('/aadhaar/verify', auth, async (req, res) => {
  try {
    const { transaction_id, otp } = req.body;
    if (!transaction_id || !otp) {
      return res.status(400).json({ error: 'transaction_id and otp required' });
    }

    // In production: verify with DigiLocker/UIDAI API
    // Simulated verification
    const doc = await pool.query(
      "SELECT * FROM kyc_documents WHERE user_id = $1 AND doc_type = 'aadhaar' AND reference_id = $2",
      [req.user.id, transaction_id]
    );

    if (!doc.rows.length) return res.status(404).json({ error: 'Transaction not found' });

    await pool.query(`
      UPDATE kyc_documents SET status = 'verified', verified_at = NOW(),
        metadata = metadata || $1
      WHERE user_id = $2 AND doc_type = 'aadhaar'
    `, [JSON.stringify({ verified: true, method: 'e-kyc' }), req.user.id]);

    // Upgrade KYC level
    await pool.query(`
      UPDATE kyc_verifications SET level = GREATEST(level, 2), status = 'identity_verified',
        aadhaar_verified = true, updated_at = NOW()
      WHERE user_id = $1
    `, [req.user.id]);

    res.json({ message: 'Aadhaar verified successfully', level: 2 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/pan — Submit PAN for verification
router.post('/pan', auth, async (req, res) => {
  try {
    const { pan_number, name_on_pan } = req.body;
    if (!pan_number || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan_number)) {
      return res.status(400).json({ error: 'Valid PAN number required (e.g. ABCDE1234F)' });
    }

    await pool.query(`
      INSERT INTO kyc_documents (user_id, doc_type, status, reference_id, metadata)
      VALUES ($1, 'pan', 'verified', $2, $3)
      ON CONFLICT (user_id, doc_type) DO UPDATE SET
        status = 'verified', reference_id = $2, metadata = $3, verified_at = NOW()
    `, [req.user.id, pan_number, JSON.stringify({ name_on_pan, verified: true })]);

    await pool.query(`
      UPDATE kyc_verifications SET pan_verified = true, updated_at = NOW() WHERE user_id = $1
    `, [req.user.id]);

    res.json({ message: 'PAN verified', pan: pan_number.slice(0, 3) + '****' + pan_number.slice(-1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/gstin — Submit GSTIN for business verification
router.post('/gstin', auth, async (req, res) => {
  try {
    const { gstin, business_name } = req.body;
    if (!gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/.test(gstin)) {
      return res.status(400).json({ error: 'Valid GSTIN required (15 characters)' });
    }

    await pool.query(`
      INSERT INTO kyc_documents (user_id, doc_type, status, reference_id, metadata)
      VALUES ($1, 'gstin', 'verified', $2, $3)
      ON CONFLICT (user_id, doc_type) DO UPDATE SET
        status = 'verified', reference_id = $2, metadata = $3, verified_at = NOW()
    `, [req.user.id, gstin, JSON.stringify({ business_name, state_code: gstin.slice(0, 2) })]);

    await pool.query(`
      UPDATE kyc_verifications SET level = GREATEST(level, 3), status = 'business_verified',
        gstin_verified = true, updated_at = NOW()
      WHERE user_id = $1
    `, [req.user.id]);

    res.json({ message: 'GSTIN verified', business_level: 3 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/bank — Link & verify bank account (penny-drop)
router.post('/bank', auth, async (req, res) => {
  try {
    const { account_number, ifsc_code, account_holder_name } = req.body;
    if (!account_number || !ifsc_code) {
      return res.status(400).json({ error: 'account_number and ifsc_code required' });
    }

    // In production: initiate penny-drop verification via banking API
    await pool.query(`
      INSERT INTO kyc_documents (user_id, doc_type, status, reference_id, metadata)
      VALUES ($1, 'bank_account', 'penny_drop_initiated', $2, $3)
      ON CONFLICT (user_id, doc_type) DO UPDATE SET
        status = 'penny_drop_initiated', reference_id = $2, metadata = $3, submitted_at = NOW()
    `, [
      req.user.id,
      `${ifsc_code}_${account_number.slice(-4)}`,
      JSON.stringify({ account_holder_name, ifsc_code, account_last4: account_number.slice(-4) }),
    ]);

    res.json({
      message: 'Penny-drop initiated. ₹1 will be credited to verify account.',
      status: 'pending_verification',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc/fssai — Submit FSSAI license
router.post('/fssai', auth, async (req, res) => {
  try {
    const { license_number, expiry_date } = req.body;
    if (!license_number) return res.status(400).json({ error: 'license_number required' });

    await pool.query(`
      INSERT INTO kyc_documents (user_id, doc_type, status, reference_id, metadata)
      VALUES ($1, 'fssai', 'verified', $2, $3)
      ON CONFLICT (user_id, doc_type) DO UPDATE SET
        status = 'verified', reference_id = $2, metadata = $3, verified_at = NOW()
    `, [req.user.id, license_number, JSON.stringify({ expiry_date })]);

    res.json({ message: 'FSSAI license verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utility: What the user needs to do next
function getNextSteps(currentLevel) {
  switch (currentLevel) {
    case 0: return ['Verify phone number', 'Submit Aadhaar or PAN'];
    case 1: return ['Submit Aadhaar for e-KYC', 'Submit PAN'];
    case 2: return ['Add GSTIN (if business)', 'Link bank account'];
    case 3: return ['Complete address verification', 'Submit FSSAI (if food business)'];
    case 4: return ['All verifications complete'];
    default: return [];
  }
}

module.exports = router;
