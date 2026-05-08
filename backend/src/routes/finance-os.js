/**
 * FinanceOS Routes
 * Comprehensive financial services for rural agriculture
 * Includes: Credit Scoring, Loan Management, Insurance, Farm Asset Valuation, Subsidy Tracking
 */

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ============================================================================
// SEED/FALLBACK DATA
// ============================================================================

const SEED_CREDIT_SCORES = {
  'user-001': { score: 720, rating: 'Good', maxLoanAmount: 500000 },
  'user-002': { score: 650, rating: 'Fair', maxLoanAmount: 200000 },
  'user-003': { score: 800, rating: 'Excellent', maxLoanAmount: 1000000 },
};

const SEED_CREDIT_FACTORS = {
  'user-001': {
    paymentHistory: { score: 85, weight: 0.35 },
    creditUtilization: { score: 70, weight: 0.30 },
    creditAge: { score: 60, weight: 0.15 },
    creditMix: { score: 75, weight: 0.10 },
    recentInquiries: { score: 90, weight: 0.10 },
  },
};

const SEED_CREDIT_HISTORY = {
  'user-001': [
    { date: '2024-01-15', score: 710, change: +5, reason: 'On-time payment' },
    { date: '2024-02-15', score: 715, change: +5, reason: 'Reduced credit utilization' },
    { date: '2024-03-15', score: 720, change: +5, reason: 'On-time payment' },
  ],
};

const SEED_LOANS = [
  { id: 'loan-001', userId: 'user-001', type: 'crop', amount: 100000, status: 'active', interestRate: 7.5, tenure: 12, disbursedAt: '2024-01-01' },
  { id: 'loan-002', userId: 'user-001', type: 'equipment', amount: 250000, status: 'pending', interestRate: 9.0, tenure: 24 },
  { id: 'loan-003', userId: 'user-002', type: 'land', amount: 500000, status: 'approved', interestRate: 8.5, tenure: 60 },
];

const SEED_REPAYMENTS = {
  'loan-001': [
    { id: 'rep-001', amount: 8750, paidAt: '2024-02-01', principal: 7500, interest: 1250 },
    { id: 'rep-002', amount: 8750, paidAt: '2024-03-01', principal: 7550, interest: 1200 },
  ],
};

const SEED_INSURANCE_POLICIES = [
  { id: 'pol-001', userId: 'user-001', type: 'crop', coverage: 200000, premium: 5000, status: 'active', startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: 'pol-002', userId: 'user-002', type: 'livestock', coverage: 150000, premium: 4000, status: 'active', startDate: '2024-02-01', endDate: '2025-01-31' },
];

const SEED_INSURANCE_CLAIMS = [
  { id: 'claim-001', policyId: 'pol-001', userId: 'user-001', type: 'flood_damage', amount: 50000, status: 'pending', filedAt: '2024-03-15' },
  { id: 'claim-002', policyId: 'pol-002', userId: 'user-002', type: 'disease', amount: 30000, status: 'approved', filedAt: '2024-02-20', assessedAt: '2024-02-25' },
];

const SEED_FARM_ASSETS = {
  'user-001': [
    { id: 'asset-001', type: 'land', description: '5 acres farmland', value: 2500000, acquiredAt: '2020-01-01', lastValuation: '2024-01-01' },
    { id: 'asset-002', type: 'equipment', description: 'Tractor - John Deere', value: 800000, acquiredAt: '2022-06-15', lastValuation: '2024-01-01' },
  ],
  'user-002': [
    { id: 'asset-003', type: 'livestock', description: '20 cattle', value: 600000, acquiredAt: '2021-03-01', lastValuation: '2024-01-01' },
  ],
};

const SEED_SUBSIDIES_AVAILABLE = [
  { id: 'sub-001', name: 'PM-KISAN', description: 'Direct income support', amount: 6000, eligibility: 'Small and marginal farmers', deadline: '2024-06-30' },
  { id: 'sub-002', name: 'Soil Health Card', description: 'Soil testing subsidy', amount: 500, eligibility: 'All farmers', deadline: '2024-12-31' },
  { id: 'sub-003', name: 'Drip Irrigation Subsidy', description: 'Micro-irrigation support', amount: 50000, eligibility: 'Farmers with less than 5 acres', deadline: '2024-09-30' },
];

const SEED_SUBSIDY_APPLICATIONS = [
  { id: 'app-001', subsidyId: 'sub-001', userId: 'user-001', status: 'approved', appliedAt: '2024-01-10', processedAt: '2024-01-20' },
  { id: 'app-002', subsidyId: 'sub-003', userId: 'user-001', status: 'pending', appliedAt: '2024-03-01' },
  { id: 'app-003', subsidyId: 'sub-002', userId: 'user-002', status: 'disbursed', appliedAt: '2024-02-01', processedAt: '2024-02-10', disbursedAt: '2024-02-15' },
];

// ============================================================================
// CREDIT SCORING ENDPOINTS (4)
// ============================================================================

// GET /credit-score/:userId - Get credit score for a user
router.get('/credit-score/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM credit_scores WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }
    const fallback = SEED_CREDIT_SCORES[userId] || { score: 600, rating: 'Fair', maxLoanAmount: 100000 };
    res.json({ userId, ...fallback, source: 'seed' });
  } catch (error) {
    console.error('Error fetching credit score:', error);
    const fallback = SEED_CREDIT_SCORES[req.params.userId] || { score: 600, rating: 'Fair', maxLoanAmount: 100000 };
    res.json({ userId: req.params.userId, ...fallback, source: 'fallback' });
  }
});

// GET /credit-factors/:userId - Get credit score factors breakdown
router.get('/credit-factors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM credit_factors WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }
    const fallback = SEED_CREDIT_FACTORS[userId] || SEED_CREDIT_FACTORS['user-001'];
    res.json({ userId, factors: fallback, source: 'seed' });
  } catch (error) {
    console.error('Error fetching credit factors:', error);
    res.json({ userId: req.params.userId, factors: SEED_CREDIT_FACTORS['user-001'], source: 'fallback' });
  }
});

// POST /credit-refresh/:userId - Refresh/recalculate credit score
router.post('/credit-refresh/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const newScore = Math.floor(Math.random() * 150) + 650;
    const rating = newScore >= 750 ? 'Excellent' : newScore >= 700 ? 'Good' : newScore >= 650 ? 'Fair' : 'Poor';
    const maxLoanAmount = newScore >= 750 ? 1000000 : newScore >= 700 ? 500000 : newScore >= 650 ? 200000 : 50000;
    res.json({
      userId,
      score: newScore,
      rating,
      maxLoanAmount,
      refreshedAt: new Date().toISOString(),
      message: 'Credit score refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing credit score:', error);
    res.status(500).json({ error: 'Failed to refresh credit score' });
  }
});

// GET /credit-history/:userId - Get credit score history
router.get('/credit-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM credit_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12',
      [userId]
    );
    if (result.rows.length > 0) {
      return res.json({ userId, history: result.rows });
    }
    const fallback = SEED_CREDIT_HISTORY[userId] || SEED_CREDIT_HISTORY['user-001'];
    res.json({ userId, history: fallback, source: 'seed' });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.json({ userId: req.params.userId, history: SEED_CREDIT_HISTORY['user-001'], source: 'fallback' });
  }
});

// ============================================================================
// LOAN MANAGEMENT ENDPOINTS (8)
// ============================================================================

// POST /loans/apply - Apply for a new loan
router.post('/loans/apply', async (req, res) => {
  try {
    const { userId, type, amount, tenure, purpose } = req.body;
    if (!userId || !type || !amount || !tenure) {
      return res.status(400).json({ error: 'Missing required fields: userId, type, amount, tenure' });
    }
    const loanId = `loan-${Date.now()}`;
    const interestRate = type === 'crop' ? 7.5 : type === 'equipment' ? 9.0 : type === 'land' ? 8.5 : 10.0;
    const loan = {
      id: loanId,
      userId,
      type,
      amount,
      tenure,
      purpose: purpose || '',
      interestRate,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    res.status(201).json({ message: 'Loan application submitted successfully', loan });
  } catch (error) {
    console.error('Error applying for loan:', error);
    res.status(500).json({ error: 'Failed to submit loan application' });
  }
});

// GET /loans - Get all loans (with optional filters)
router.get('/loans', async (req, res) => {
  try {
    const { userId, status, type } = req.query;
    let loans = [...SEED_LOANS];
    if (userId) loans = loans.filter(l => l.userId === userId);
    if (status) loans = loans.filter(l => l.status === status);
    if (type) loans = loans.filter(l => l.type === type);
    res.json({ loans, total: loans.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.json({ loans: SEED_LOANS, total: SEED_LOANS.length, source: 'fallback' });
  }
});

// GET /loans/:id - Get loan details by ID
router.get('/loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = SEED_LOANS.find(l => l.id === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json({ loan, source: 'seed' });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ error: 'Failed to fetch loan details' });
  }
});

// PUT /loans/:id/approve - Approve a loan application
router.put('/loans/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;
    res.json({
      loanId: id,
      status: 'approved',
      approvedBy: approvedBy || 'system',
      approvedAt: new Date().toISOString(),
      notes: notes || '',
      message: 'Loan approved successfully',
    });
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({ error: 'Failed to approve loan' });
  }
});

// PUT /loans/:id/reject - Reject a loan application
router.put('/loans/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;
    res.json({
      loanId: id,
      status: 'rejected',
      rejectedBy: rejectedBy || 'system',
      rejectedAt: new Date().toISOString(),
      reason: reason || 'Does not meet eligibility criteria',
      message: 'Loan application rejected',
    });
  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({ error: 'Failed to reject loan' });
  }
});

// POST /loans/:id/disburse - Disburse approved loan amount
router.post('/loans/:id/disburse', async (req, res) => {
  try {
    const { id } = req.params;
    const { bankAccount, amount } = req.body;
    res.json({
      loanId: id,
      status: 'disbursed',
      disbursedAmount: amount || 100000,
      bankAccount: bankAccount || 'XXXX-XXXX-1234',
      disbursedAt: new Date().toISOString(),
      transactionId: `TXN-${Date.now()}`,
      message: 'Loan amount disbursed successfully',
    });
  } catch (error) {
    console.error('Error disbursing loan:', error);
    res.status(500).json({ error: 'Failed to disburse loan' });
  }
});

// GET /loans/:id/repayments - Get repayment schedule/history
router.get('/loans/:id/repayments', async (req, res) => {
  try {
    const { id } = req.params;
    const repayments = SEED_REPAYMENTS[id] || [];
    res.json({ loanId: id, repayments, total: repayments.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching repayments:', error);
    res.json({ loanId: req.params.id, repayments: [], source: 'fallback' });
  }
});

// POST /loans/:id/repay - Make a loan repayment
router.post('/loans/:id/repay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    res.json({
      loanId: id,
      repaymentId: `rep-${Date.now()}`,
      amount,
      paymentMethod: paymentMethod || 'bank_transfer',
      paidAt: new Date().toISOString(),
      status: 'completed',
      message: 'Repayment recorded successfully',
    });
  } catch (error) {
    console.error('Error recording repayment:', error);
    res.status(500).json({ error: 'Failed to record repayment' });
  }
});

// ============================================================================
// INSURANCE ENDPOINTS (6)
// ============================================================================

// POST /insurance/enroll - Enroll in insurance policy
router.post('/insurance/enroll', async (req, res) => {
  try {
    const { userId, type, coverage, cropType, landArea } = req.body;
    if (!userId || !type || !coverage) {
      return res.status(400).json({ error: 'Missing required fields: userId, type, coverage' });
    }
    const premium = Math.round(coverage * 0.025);
    const policy = {
      id: `pol-${Date.now()}`,
      userId,
      type,
      coverage,
      premium,
      cropType: cropType || null,
      landArea: landArea || null,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    res.status(201).json({ message: 'Insurance enrollment successful', policy });
  } catch (error) {
    console.error('Error enrolling in insurance:', error);
    res.status(500).json({ error: 'Failed to enroll in insurance' });
  }
});

// GET /insurance/policies - Get all insurance policies
router.get('/insurance/policies', async (req, res) => {
  try {
    const { userId, type, status } = req.query;
    let policies = [...SEED_INSURANCE_POLICIES];
    if (userId) policies = policies.filter(p => p.userId === userId);
    if (type) policies = policies.filter(p => p.type === type);
    if (status) policies = policies.filter(p => p.status === status);
    res.json({ policies, total: policies.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.json({ policies: SEED_INSURANCE_POLICIES, source: 'fallback' });
  }
});

// GET /insurance/policies/:id - Get policy details
router.get('/insurance/policies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const policy = SEED_INSURANCE_POLICIES.find(p => p.id === id);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    res.json({ policy, source: 'seed' });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy details' });
  }
});

// POST /insurance/claims/file - File an insurance claim
router.post('/insurance/claims/file', async (req, res) => {
  try {
    const { policyId, userId, type, amount, description, evidence } = req.body;
    if (!policyId || !userId || !type || !amount) {
      return res.status(400).json({ error: 'Missing required fields: policyId, userId, type, amount' });
    }
    const claim = {
      id: `claim-${Date.now()}`,
      policyId,
      userId,
      type,
      amount,
      description: description || '',
      evidence: evidence || [],
      status: 'pending',
      filedAt: new Date().toISOString(),
    };
    res.status(201).json({ message: 'Claim filed successfully', claim });
  } catch (error) {
    console.error('Error filing claim:', error);
    res.status(500).json({ error: 'Failed to file claim' });
  }
});

// GET /insurance/claims - Get all claims
router.get('/insurance/claims', async (req, res) => {
  try {
    const { userId, policyId, status } = req.query;
    let claims = [...SEED_INSURANCE_CLAIMS];
    if (userId) claims = claims.filter(c => c.userId === userId);
    if (policyId) claims = claims.filter(c => c.policyId === policyId);
    if (status) claims = claims.filter(c => c.status === status);
    res.json({ claims, total: claims.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.json({ claims: SEED_INSURANCE_CLAIMS, source: 'fallback' });
  }
});

// PUT /insurance/claims/:id/assess - Assess/process a claim
router.put('/insurance/claims/:id/assess', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assessedAmount, assessorNotes, assessedBy } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }
    res.json({
      claimId: id,
      status,
      assessedAmount: assessedAmount || 0,
      assessorNotes: assessorNotes || '',
      assessedBy: assessedBy || 'system',
      assessedAt: new Date().toISOString(),
      message: `Claim ${status} successfully`,
    });
  } catch (error) {
    console.error('Error assessing claim:', error);
    res.status(500).json({ error: 'Failed to assess claim' });
  }
});

// ============================================================================
// FARM ASSET VALUATION ENDPOINTS (3)
// ============================================================================

// POST /assets/register - Register a new farm asset
router.post('/assets/register', async (req, res) => {
  try {
    const { userId, type, description, value, acquiredAt } = req.body;
    if (!userId || !type || !value) {
      return res.status(400).json({ error: 'Missing required fields: userId, type, value' });
    }
    const asset = {
      id: `asset-${Date.now()}`,
      userId,
      type,
      description: description || '',
      value,
      acquiredAt: acquiredAt || new Date().toISOString().split('T')[0],
      lastValuation: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    res.status(201).json({ message: 'Asset registered successfully', asset });
  } catch (error) {
    console.error('Error registering asset:', error);
    res.status(500).json({ error: 'Failed to register asset' });
  }
});

// GET /assets/:userId - Get all assets for a user
router.get('/assets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const assets = SEED_FARM_ASSETS[userId] || [];
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    res.json({ userId, assets, totalValue, count: assets.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.json({ userId: req.params.userId, assets: [], totalValue: 0, source: 'fallback' });
  }
});

// PUT /assets/:id/revalue - Update asset valuation
router.put('/assets/:id/revalue', async (req, res) => {
  try {
    const { id } = req.params;
    const { newValue, valuationMethod, valuedBy, notes } = req.body;
    if (!newValue) {
      return res.status(400).json({ error: 'Missing required field: newValue' });
    }
    res.json({
      assetId: id,
      previousValue: 500000,
      newValue,
      valuationMethod: valuationMethod || 'market_comparison',
      valuedBy: valuedBy || 'system',
      notes: notes || '',
      valuedAt: new Date().toISOString(),
      message: 'Asset revaluation completed successfully',
    });
  } catch (error) {
    console.error('Error revaluing asset:', error);
    res.status(500).json({ error: 'Failed to revalue asset' });
  }
});

// ============================================================================
// SUBSIDY TRACKING ENDPOINTS (4)
// ============================================================================

// GET /subsidies/available - Get available subsidies
router.get('/subsidies/available', async (req, res) => {
  try {
    const { category } = req.query;
    let subsidies = [...SEED_SUBSIDIES_AVAILABLE];
    if (category) {
      subsidies = subsidies.filter(s => s.name.toLowerCase().includes(category.toLowerCase()));
    }
    res.json({ subsidies, total: subsidies.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching subsidies:', error);
    res.json({ subsidies: SEED_SUBSIDIES_AVAILABLE, source: 'fallback' });
  }
});

// POST /subsidies/apply - Apply for a subsidy
router.post('/subsidies/apply', async (req, res) => {
  try {
    const { subsidyId, userId, documents, landDetails } = req.body;
    if (!subsidyId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: subsidyId, userId' });
    }
    const application = {
      id: `app-${Date.now()}`,
      subsidyId,
      userId,
      documents: documents || [],
      landDetails: landDetails || {},
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    res.status(201).json({ message: 'Subsidy application submitted successfully', application });
  } catch (error) {
    console.error('Error applying for subsidy:', error);
    res.status(500).json({ error: 'Failed to submit subsidy application' });
  }
});

// GET /subsidies/applications - Get all subsidy applications
router.get('/subsidies/applications', async (req, res) => {
  try {
    const { userId, status } = req.query;
    let applications = [...SEED_SUBSIDY_APPLICATIONS];
    if (userId) applications = applications.filter(a => a.userId === userId);
    if (status) applications = applications.filter(a => a.status === status);
    res.json({ applications, total: applications.length, source: 'seed' });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.json({ applications: SEED_SUBSIDY_APPLICATIONS, source: 'fallback' });
  }
});

// GET /subsidies/:id/status - Get subsidy application status
router.get('/subsidies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const application = SEED_SUBSIDY_APPLICATIONS.find(a => a.id === id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const subsidy = SEED_SUBSIDIES_AVAILABLE.find(s => s.id === application.subsidyId);
    res.json({
      applicationId: id,
      subsidyName: subsidy ? subsidy.name : 'Unknown',
      status: application.status,
      appliedAt: application.appliedAt,
      processedAt: application.processedAt || null,
      disbursedAt: application.disbursedAt || null,
      source: 'seed',
    });
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

module.exports = router;
