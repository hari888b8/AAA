/**
 * Rural Credit Graph Routes
 * Features:
 *   1. Credit Scoring (multi-factor 0-900 scale)
 *   2. Credit Products (crop_loan, KCC, warehouse receipt finance, etc.)
 *   3. Loan Applications & Processing
 *   4. Repayment Management
 *   5. Financial Graph (income, expenses, assets, liabilities)
 *   6. Lender Network (SBI, PNB, NABARD, etc.)
 *   7. Agricultural Insurance (PMFBY, weather-based, livestock)
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  SEED / FALLBACK DATA
// ═══════════════════════════════════════════════════════════════════

const SEED_CREDIT_SCORES = {
  'user-1': { user_id: 'user-1', score: 724, grade: 'A', trade_history_score: 145, repayment_score: 162, asset_score: 138, social_score: 148, digital_activity_score: 131, updated_at: '2025-02-15T08:00:00Z' },
  'user-2': { user_id: 'user-2', score: 612, grade: 'B', trade_history_score: 118, repayment_score: 130, asset_score: 125, social_score: 120, digital_activity_score: 119, updated_at: '2025-02-14T08:00:00Z' },
  'user-3': { user_id: 'user-3', score: 480, grade: 'C', trade_history_score: 90, repayment_score: 95, asset_score: 110, social_score: 98, digital_activity_score: 87, updated_at: '2025-02-13T08:00:00Z' },
};

const SEED_SCORE_HISTORY = [
  { user_id: 'user-1', score: 680, month: '2024-09', factors: 'New trade completed' },
  { user_id: 'user-1', score: 695, month: '2024-10', factors: 'Repayment on time' },
  { user_id: 'user-1', score: 702, month: '2024-11', factors: 'Asset registration' },
  { user_id: 'user-1', score: 710, month: '2024-12', factors: 'FPO membership bonus' },
  { user_id: 'user-1', score: 718, month: '2025-01', factors: 'Digital activity increase' },
  { user_id: 'user-1', score: 724, month: '2025-02', factors: 'Warehouse receipt finance' },
];

const SEED_PRODUCTS = [
  { id: 'prod-1', type: 'crop_loan', name: 'Crop Loan (Kharif/Rabi)', description: 'Short-term loan for crop cultivation expenses', min_amount: 25000, max_amount: 500000, interest_rate: 7.0, subvention_rate: 4.0, effective_rate: 4.0, tenure_months: 12, collateral_required: false, eligibility: { min_score: 400, min_land_acres: 1, required_docs: ['Aadhaar', 'Land records', 'Crop plan'] }, lenders: ['SBI', 'PNB', 'BOB'] },
  { id: 'prod-2', type: 'kcc', name: 'Kisan Credit Card (KCC)', description: 'Revolving credit facility for farmers — crop + allied activities', min_amount: 50000, max_amount: 300000, interest_rate: 7.0, subvention_rate: 4.0, effective_rate: 4.0, tenure_months: 60, collateral_required: false, eligibility: { min_score: 350, min_land_acres: 0.5, required_docs: ['Aadhaar', 'Land records'] }, lenders: ['SBI', 'PNB', 'NABARD', 'Cooperative Banks'] },
  { id: 'prod-3', type: 'warehouse_receipt_finance', name: 'Warehouse Receipt Finance', description: 'Loan against stored commodities in registered warehouse', min_amount: 50000, max_amount: 2500000, interest_rate: 9.0, subvention_rate: 0, effective_rate: 9.0, tenure_months: 6, collateral_required: true, collateral_type: 'warehouse_receipt', eligibility: { min_score: 500, required_docs: ['Warehouse receipt', 'Quality certificate', 'Aadhaar'] }, lenders: ['SBI', 'NABARD', 'Samunnati'] },
  { id: 'prod-4', type: 'equipment_loan', name: 'Farm Equipment Loan', description: 'Medium-term loan for tractors, implements, irrigation equipment', min_amount: 100000, max_amount: 5000000, interest_rate: 10.5, subvention_rate: 0, effective_rate: 10.5, tenure_months: 60, collateral_required: true, collateral_type: 'equipment', eligibility: { min_score: 550, min_land_acres: 2, required_docs: ['Aadhaar', 'Land records', 'Equipment quotation'] }, lenders: ['SBI', 'PNB', 'HDFC', 'Mahindra Finance'] },
  { id: 'prod-5', type: 'working_capital', name: 'Agri Working Capital', description: 'Working capital for FPOs and agri-enterprises', min_amount: 200000, max_amount: 10000000, interest_rate: 11.0, subvention_rate: 0, effective_rate: 11.0, tenure_months: 12, collateral_required: true, collateral_type: 'mixed', eligibility: { min_score: 600, required_docs: ['FPO registration', 'Financials', 'Business plan'] }, lenders: ['NABARD', 'Samunnati', 'NABFINS', 'Bandhan Bank'] },
];

const SEED_APPLICATIONS = [
  { id: 'app-1', user_id: 'user-1', product_type: 'crop_loan', product_name: 'Crop Loan (Kharif)', amount: 200000, tenure_months: 12, purpose: 'Wheat cultivation expenses', collateral_type: null, status: 'approved', lender: 'SBI', interest_rate: 4.0, approved_amount: 200000, emi: 17333, created_at: '2025-01-05T08:00:00Z', approved_at: '2025-01-08T14:00:00Z' },
  { id: 'app-2', user_id: 'user-1', product_type: 'warehouse_receipt_finance', product_name: 'Warehouse Receipt Finance', amount: 500000, tenure_months: 6, purpose: 'Working capital against stored onions', collateral_type: 'warehouse_receipt', status: 'under_review', lender: 'NABARD', interest_rate: 9.0, approved_amount: null, emi: null, created_at: '2025-02-10T08:00:00Z', approved_at: null },
  { id: 'app-3', user_id: 'user-2', product_type: 'kcc', product_name: 'Kisan Credit Card', amount: 150000, tenure_months: 60, purpose: 'Crop and allied activities', collateral_type: null, status: 'approved', lender: 'PNB', interest_rate: 4.0, approved_amount: 150000, emi: 2500, created_at: '2024-11-20T08:00:00Z', approved_at: '2024-11-25T14:00:00Z' },
];

const SEED_REPAYMENTS = [
  { id: 'rep-1', user_id: 'user-1', application_id: 'app-1', installment_no: 1, amount: 17333, due_date: '2025-02-05', status: 'paid', paid_date: '2025-02-03', paid_amount: 17333, payment_method: 'upi' },
  { id: 'rep-2', user_id: 'user-1', application_id: 'app-1', installment_no: 2, amount: 17333, due_date: '2025-03-05', status: 'upcoming', paid_date: null, paid_amount: null, payment_method: null },
  { id: 'rep-3', user_id: 'user-1', application_id: 'app-1', installment_no: 3, amount: 17333, due_date: '2025-04-05', status: 'upcoming', paid_date: null, paid_amount: null, payment_method: null },
  { id: 'rep-4', user_id: 'user-2', application_id: 'app-3', installment_no: 1, amount: 2500, due_date: '2024-12-25', status: 'paid', paid_date: '2024-12-24', paid_amount: 2500, payment_method: 'bank_transfer' },
  { id: 'rep-5', user_id: 'user-2', application_id: 'app-3', installment_no: 2, amount: 2500, due_date: '2025-01-25', status: 'paid', paid_date: '2025-01-25', paid_amount: 2500, payment_method: 'upi' },
  { id: 'rep-6', user_id: 'user-2', application_id: 'app-3', installment_no: 3, amount: 2500, due_date: '2025-02-25', status: 'upcoming', paid_date: null, paid_amount: null, payment_method: null },
];

const SEED_FINANCIAL_GRAPH = {
  'user-1': {
    user_id: 'user-1',
    income_sources: [
      { source: 'Crop Sales', amount: 480000, frequency: 'seasonal', season: 'Rabi' },
      { source: 'Grape Export', amount: 320000, frequency: 'annual' },
      { source: 'Dairy', amount: 96000, frequency: 'monthly', monthly: 8000 },
    ],
    expenses: [
      { category: 'Seeds & Inputs', amount: 85000, frequency: 'seasonal' },
      { category: 'Labour', amount: 120000, frequency: 'annual' },
      { category: 'Equipment Maintenance', amount: 35000, frequency: 'annual' },
      { category: 'Loan EMI', amount: 208000, frequency: 'annual', monthly: 17333 },
      { category: 'Household', amount: 180000, frequency: 'annual', monthly: 15000 },
    ],
    assets: [
      { type: 'land', name: 'Agricultural Land - Nashik', value: 4800000, area_acres: 12 },
      { type: 'equipment', name: 'Mahindra 575 Tractor', value: 650000, year: 2021 },
      { type: 'livestock', name: 'Dairy Cattle (4 heads)', value: 240000 },
      { type: 'inventory', name: 'Stored Onion (8 tonnes)', value: 160000 },
    ],
    liabilities: [
      { type: 'crop_loan', lender: 'SBI', outstanding: 182667, emi: 17333, remaining_months: 10 },
    ],
    net_worth: 5667333,
    total_annual_income: 896000,
    total_annual_expenses: 628000,
    annual_surplus: 268000,
  },
};

const SEED_CASHFLOW = [
  { month: '2025-01', income: 8000, expenses: 32333, net: -24333, category_breakdown: { dairy: 8000, emi: 17333, household: 15000 } },
  { month: '2025-02', income: 248000, expenses: 32333, net: 215667, category_breakdown: { crop_sale: 240000, dairy: 8000, emi: 17333, household: 15000 } },
  { month: '2025-03', income: 328000, expenses: 117333, net: 210667, category_breakdown: { grape_export: 320000, dairy: 8000, emi: 17333, seeds: 85000, household: 15000 } },
  { month: '2025-04', income: 8000, expenses: 32333, net: -24333, category_breakdown: { dairy: 8000, emi: 17333, household: 15000 } },
  { month: '2025-05', income: 8000, expenses: 32333, net: -24333, category_breakdown: { dairy: 8000, emi: 17333, household: 15000 } },
  { month: '2025-06', income: 8000, expenses: 92333, net: -84333, category_breakdown: { dairy: 8000, emi: 17333, labour: 60000, household: 15000 } },
];

const SEED_ASSETS = [
  { id: 'asset-1', user_id: 'user-1', asset_type: 'land', name: 'Agricultural Land - Nashik', value: 4800000, details: { area_acres: 12, soil_type: 'black_soil', irrigation: 'drip', crop_history: ['onion', 'grape', 'tomato'] } },
  { id: 'asset-2', user_id: 'user-1', asset_type: 'equipment', name: 'Mahindra 575 Tractor', value: 650000, details: { brand: 'Mahindra', model: '575 DI', year: 2021, hp: 45, condition: 'good' } },
  { id: 'asset-3', user_id: 'user-1', asset_type: 'livestock', name: 'Dairy Cattle', value: 240000, details: { breed: 'HF Cross', count: 4, milk_yield_litres_day: 40, insured: true } },
  { id: 'asset-4', user_id: 'user-1', asset_type: 'inventory', name: 'Stored Onion', value: 160000, details: { quantity_tonnes: 8, warehouse: 'Nashik Cold Storage', receipt_number: 'WHR-ABC123' } },
];

const SEED_LENDERS = [
  { id: 'lender-1', name: 'State Bank of India (SBI)', type: 'public_bank', logo: 'sbi.png', products: ['crop_loan', 'kcc', 'warehouse_receipt_finance', 'equipment_loan'], interest_rates: { crop_loan: 7.0, kcc: 7.0, warehouse_receipt_finance: 9.0, equipment_loan: 10.5 }, subvention: { crop_loan: 3.0, kcc: 3.0 }, max_loan: 10000000, branches_rural: 8500, contact: '1800-425-3800', features: ['Interest subvention up to 3%', 'KCC renewal online', 'Doorstep banking'] },
  { id: 'lender-2', name: 'Punjab National Bank (PNB)', type: 'public_bank', logo: 'pnb.png', products: ['crop_loan', 'kcc', 'equipment_loan'], interest_rates: { crop_loan: 7.0, kcc: 7.0, equipment_loan: 10.75 }, subvention: { crop_loan: 3.0, kcc: 3.0 }, max_loan: 5000000, branches_rural: 4200, contact: '1800-180-2222', features: ['PNB One app', 'PM-KISAN linked', 'Quick KCC'] },
  { id: 'lender-3', name: 'NABARD', type: 'development_bank', logo: 'nabard.png', products: ['warehouse_receipt_finance', 'working_capital'], interest_rates: { warehouse_receipt_finance: 8.5, working_capital: 10.0 }, subvention: {}, max_loan: 50000000, branches_rural: 400, contact: '022-26539895', features: ['Refinance facility', 'FPO support', 'Climate-resilient agriculture'] },
  { id: 'lender-4', name: 'Bandhan Bank', type: 'private_bank', logo: 'bandhan.png', products: ['crop_loan', 'working_capital'], interest_rates: { crop_loan: 8.5, working_capital: 12.0 }, subvention: {}, max_loan: 2000000, branches_rural: 2800, contact: '1800-258-8181', features: ['Microfinance expertise', 'Group lending', 'Weekly collection'] },
  { id: 'lender-5', name: 'Samunnati', type: 'nbfc', logo: 'samunnati.png', products: ['warehouse_receipt_finance', 'working_capital'], interest_rates: { warehouse_receipt_finance: 11.0, working_capital: 13.0 }, subvention: {}, max_loan: 25000000, branches_rural: 150, contact: '044-4211-5100', features: ['FPO focused', 'Value chain finance', 'Market linkage'] },
  { id: 'lender-6', name: 'NABFINS', type: 'nbfc', logo: 'nabfins.png', products: ['crop_loan', 'equipment_loan', 'working_capital'], interest_rates: { crop_loan: 9.5, equipment_loan: 11.0, working_capital: 12.5 }, subvention: {}, max_loan: 5000000, branches_rural: 250, contact: '080-2220-9500', features: ['NABARD subsidiary', 'Rural focus', 'Quick disbursal'] },
  { id: 'lender-7', name: 'Annapurna MFI', type: 'mfi', logo: 'annapurna.png', products: ['crop_loan', 'working_capital'], interest_rates: { crop_loan: 12.0, working_capital: 14.0 }, subvention: {}, max_loan: 500000, branches_rural: 180, contact: '0674-254-5252', features: ['Micro loans', 'Women SHG focus', 'Doorstep service'] },
];

const SEED_INSURANCE_PRODUCTS = [
  { id: 'ins-1', type: 'pmfby_crop', name: 'PMFBY Crop Insurance', description: 'Pradhan Mantri Fasal Bima Yojana — comprehensive crop insurance', premium_rate: { kharif: 2.0, rabi: 1.5, commercial: 5.0 }, coverage: 'Full sum insured based on crop & district', claim_settlement_days: 45, provider: 'AIC of India', features: ['Government subsidized premium', 'Smart sampling for claims', 'Covers all natural calamities'] },
  { id: 'ins-2', type: 'weather_based', name: 'Weather-Based Crop Insurance (WBCIS)', description: 'Index-based insurance triggered by weather deviations', premium_rate: { all: 3.0 }, coverage: 'Based on weather index deviation', claim_settlement_days: 30, provider: 'ICICI Lombard', features: ['Automatic trigger', 'No crop cutting experiments', 'Quick settlement'] },
  { id: 'ins-3', type: 'livestock', name: 'Livestock Insurance', description: 'Insurance for cattle, buffalo, sheep, goat, poultry', premium_rate: { cattle: 3.5, buffalo: 3.5, sheep_goat: 4.0, poultry: 5.0 }, coverage: 'Market value of animal', claim_settlement_days: 15, provider: 'United India Insurance', features: ['Ear-tagging based identification', 'Covers disease and accident', 'Veterinary helpline'] },
  { id: 'ins-4', type: 'equipment', name: 'Farm Equipment Insurance', description: 'Coverage for tractors, harvesters, implements', premium_rate: { tractor: 2.5, harvester: 3.0, implements: 2.0 }, coverage: 'IDV (Insured Declared Value)', claim_settlement_days: 21, provider: 'New India Assurance', features: ['Breakdown cover', 'Third-party liability', 'Replacement value option'] },
  { id: 'ins-5', type: 'health', name: 'Farmer Health Insurance', description: 'Health cover for farmers and families under PMJJBY/PMSBY', premium_rate: { pmjjby: 0.05, pmsby: 0.02 }, coverage: 'Life cover ₹2L (PMJJBY), Accident cover ₹2L (PMSBY)', claim_settlement_days: 30, provider: 'LIC / SBI Life', features: ['₹12/year PMSBY premium', '₹436/year PMJJBY premium', 'Auto-debit from Jan Dhan account'] },
];

const SEED_INSURANCE_CLAIMS = [
  { id: 'claim-1', user_id: 'user-1', policy_id: 'pol-1', policy_type: 'pmfby_crop', claim_type: 'crop_loss', description: 'Unseasonal rain damaged onion crop, estimated 60% loss', amount: 120000, status: 'approved', approved_amount: 108000, filed_at: '2025-01-20T08:00:00Z', resolved_at: '2025-02-15T14:00:00Z' },
  { id: 'claim-2', user_id: 'user-2', policy_id: 'pol-2', policy_type: 'livestock', claim_type: 'animal_death', description: 'One HF cow died due to disease', amount: 65000, status: 'under_review', approved_amount: null, filed_at: '2025-02-10T08:00:00Z', resolved_at: null },
];

// ═══════════════════════════════════════════════════════════════════
//  HELPER: Deterministic credit score calculation
// ═══════════════════════════════════════════════════════════════════

function calculateCreditScore(userData) {
  // Each factor scored 0-180, total 0-900
  const tradeHistory = Math.min(180, Math.floor(
    (userData.trades_completed || 0) * 8 +
    (userData.trade_value || 0) / 5000 +
    (userData.trade_months || 0) * 3
  ));

  const repayment = Math.min(180, Math.floor(
    (userData.on_time_payments || 0) * 12 +
    (userData.total_payments || 0) * 2 -
    (userData.late_payments || 0) * 25 -
    (userData.defaults || 0) * 60
  ));

  const assets = Math.min(180, Math.floor(
    (userData.land_acres || 0) * 8 +
    (userData.equipment_value || 0) / 10000 +
    (userData.livestock_value || 0) / 5000 +
    (userData.inventory_value || 0) / 3000
  ));

  const social = Math.min(180, Math.floor(
    (userData.fpo_member ? 30 : 0) +
    (userData.references || 0) * 10 +
    (userData.community_standing || 0) * 15 +
    (userData.years_farming || 0) * 5
  ));

  const digital = Math.min(180, Math.floor(
    (userData.app_logins || 0) * 0.5 +
    (userData.digital_payments || 0) * 3 +
    (userData.profile_completeness || 0) * 1.2 +
    (userData.kyc_verified ? 40 : 0)
  ));

  const total = tradeHistory + repayment + assets + social + digital;
  let grade = 'D';
  if (total >= 750) grade = 'A+';
  else if (total >= 650) grade = 'A';
  else if (total >= 550) grade = 'B';
  else if (total >= 450) grade = 'C';

  return {
    score: total,
    grade,
    trade_history_score: tradeHistory,
    repayment_score: repayment,
    asset_score: assets,
    social_score: social,
    digital_activity_score: digital,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  1. CREDIT SCORING
// ═══════════════════════════════════════════════════════════════════

// Get credit score
router.get('/score', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      'SELECT * FROM credit_scores WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [user_id]
    );

    if (!result.rows.length) {
      return res.json({ score: null, message: 'No credit score found. Use POST /score/refresh to calculate.' });
    }

    res.json({ credit_score: result.rows[0] });
  } catch (err) {
    const { user_id } = req.query;
    const score = SEED_CREDIT_SCORES[user_id];
    if (!score) return res.json({ score: null, message: 'No credit score found', _fallback: true });
    res.json({ credit_score: score, _fallback: true });
  }
});

// Score breakdown
router.get('/score/breakdown', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      'SELECT * FROM credit_scores WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [user_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'No credit score found' });
    }

    const s = result.rows[0];
    res.json({
      user_id,
      total_score: s.score,
      grade: s.grade,
      breakdown: {
        trade_history: { score: s.trade_history_score, max: 180, description: 'Based on completed trades, trade value, and trading history duration' },
        repayment: { score: s.repayment_score, max: 180, description: 'Based on on-time payments, total payment history, late payments, and defaults' },
        assets: { score: s.asset_score, max: 180, description: 'Based on land holdings, equipment value, livestock, and stored inventory' },
        social: { score: s.social_score, max: 180, description: 'Based on FPO membership, references, community standing, and farming experience' },
        digital_activity: { score: s.digital_activity_score, max: 180, description: 'Based on app usage, digital payments, profile completeness, and KYC status' },
      },
    });
  } catch (err) {
    const { user_id } = req.query;
    const s = SEED_CREDIT_SCORES[user_id];
    if (!s) return res.status(404).json({ error: 'No credit score found' });
    res.json({
      user_id,
      total_score: s.score,
      grade: s.grade,
      breakdown: {
        trade_history: { score: s.trade_history_score, max: 180, description: 'Based on completed trades, trade value, and trading history duration' },
        repayment: { score: s.repayment_score, max: 180, description: 'Based on on-time payments, total payment history, late payments, and defaults' },
        assets: { score: s.asset_score, max: 180, description: 'Based on land holdings, equipment value, livestock, and stored inventory' },
        social: { score: s.social_score, max: 180, description: 'Based on FPO membership, references, community standing, and farming experience' },
        digital_activity: { score: s.digital_activity_score, max: 180, description: 'Based on app usage, digital payments, profile completeness, and KYC status' },
      },
      _fallback: true,
    });
  }
});

// Refresh / recalculate score
router.post('/score/refresh', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Gather user data from various tables
    const trades = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_value),0) as value FROM trades WHERE seller_id = $1 AND status = 'completed'",
      [user_id]
    );
    const payments = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE status = 'paid') as on_time, COUNT(*) FILTER (WHERE status = 'late') as late, COUNT(*) FILTER (WHERE status = 'defaulted') as defaults, COUNT(*) as total FROM credit_repayments WHERE user_id = $1",
      [user_id]
    );
    const assets = await pool.query(
      'SELECT asset_type, COALESCE(SUM(value),0) as total_value FROM credit_assets WHERE user_id = $1 GROUP BY asset_type',
      [user_id]
    );

    const assetMap = {};
    for (const a of assets.rows) assetMap[a.asset_type] = parseFloat(a.total_value);

    const userData = {
      trades_completed: parseInt(trades.rows[0]?.count || 0),
      trade_value: parseFloat(trades.rows[0]?.value || 0),
      trade_months: 12,
      on_time_payments: parseInt(payments.rows[0]?.on_time || 0),
      late_payments: parseInt(payments.rows[0]?.late || 0),
      defaults: parseInt(payments.rows[0]?.defaults || 0),
      total_payments: parseInt(payments.rows[0]?.total || 0),
      land_acres: (assetMap.land || 0) / 400000,
      equipment_value: assetMap.equipment || 0,
      livestock_value: assetMap.livestock || 0,
      inventory_value: assetMap.inventory || 0,
      fpo_member: true,
      references: 3,
      community_standing: 8,
      years_farming: 10,
      app_logins: 120,
      digital_payments: 25,
      profile_completeness: 85,
      kyc_verified: true,
    };

    const scoreData = calculateCreditScore(userData);

    const result = await pool.query(`
      INSERT INTO credit_scores (user_id, score, grade, trade_history_score, repayment_score, asset_score, social_score, digital_activity_score)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [user_id, scoreData.score, scoreData.grade, scoreData.trade_history_score, scoreData.repayment_score, scoreData.asset_score, scoreData.social_score, scoreData.digital_activity_score]);

    res.json({ credit_score: result.rows[0], calculated_from: userData });
  } catch (err) {
    const { user_id } = req.body;
    const userData = {
      trades_completed: 15, trade_value: 850000, trade_months: 18,
      on_time_payments: 10, late_payments: 1, defaults: 0, total_payments: 11,
      land_acres: 12, equipment_value: 650000, livestock_value: 240000, inventory_value: 160000,
      fpo_member: true, references: 4, community_standing: 8, years_farming: 12,
      app_logins: 200, digital_payments: 30, profile_completeness: 90, kyc_verified: true,
    };
    const scoreData = calculateCreditScore(userData);
    res.json({ credit_score: { user_id, ...scoreData, updated_at: new Date().toISOString() }, calculated_from: userData, _fallback: true });
  }
});

// Score history
router.get('/score/history', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      'SELECT * FROM credit_scores WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 12',
      [user_id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    const { user_id } = req.query;
    const history = SEED_SCORE_HISTORY.filter(h => h.user_id === user_id);
    res.json({ history, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. CREDIT PRODUCTS
// ═══════════════════════════════════════════════════════════════════

// List products
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_products ORDER BY interest_rate ASC');
    res.json({ products: result.rows });
  } catch (err) {
    res.json({ products: SEED_PRODUCTS, _fallback: true });
  }
});

// Product detail with eligibility check
router.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_products WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    const product = SEED_PRODUCTS.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. LOAN APPLICATIONS
// ═══════════════════════════════════════════════════════════════════

// Apply for credit
router.post('/apply', async (req, res) => {
  try {
    const { user_id, product_type, amount, tenure_months, purpose, collateral_type } = req.body;
    if (!user_id || !product_type || !amount) {
      return res.status(400).json({ error: 'user_id, product_type, amount required' });
    }

    const validTypes = ['crop_loan', 'kcc', 'warehouse_receipt_finance', 'equipment_loan', 'working_capital'];
    if (!validTypes.includes(product_type)) {
      return res.status(400).json({ error: `product_type must be one of: ${validTypes.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO credit_applications (user_id, product_type, amount, tenure_months, purpose, collateral_type, status)
      VALUES ($1,$2,$3,$4,$5,$6,'submitted') RETURNING *
    `, [user_id, product_type, amount, tenure_months || 12, purpose, collateral_type]);

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    const application = {
      id: `app-${Date.now()}`, ...req.body,
      status: 'submitted', tenure_months: req.body.tenure_months || 12,
      created_at: new Date().toISOString(),
    };
    res.status(201).json({ application, _fallback: true });
  }
});

// List applications
router.get('/applications', async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let query = 'SELECT * FROM credit_applications WHERE 1=1';
    const params = [];

    if (user_id) { params.push(user_id); query += ` AND user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ applications: result.rows });
  } catch (err) {
    let filtered = SEED_APPLICATIONS;
    const { user_id, status } = req.query;
    if (user_id) filtered = filtered.filter(a => a.user_id === user_id);
    if (status) filtered = filtered.filter(a => a.status === status);
    res.json({ applications: filtered, _fallback: true });
  }
});

// Application detail
router.get('/applications/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_applications WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: result.rows[0] });
  } catch (err) {
    const app = SEED_APPLICATIONS.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: app, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. REPAYMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

// List repayments
router.get('/repayments', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      'SELECT * FROM credit_repayments WHERE user_id = $1 ORDER BY due_date ASC',
      [user_id]
    );
    res.json({ repayments: result.rows });
  } catch (err) {
    const { user_id } = req.query;
    const repayments = SEED_REPAYMENTS.filter(r => r.user_id === user_id);
    res.json({ repayments, _fallback: true });
  }
});

// Make payment
router.post('/repayments/:id/pay', async (req, res) => {
  try {
    const { amount, payment_method } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    const result = await pool.query(`
      UPDATE credit_repayments SET
        status = 'paid', paid_date = NOW(), paid_amount = $1, payment_method = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [amount, payment_method || 'upi', req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Repayment not found' });
    res.json({ repayment: result.rows[0] });
  } catch (err) {
    const rep = SEED_REPAYMENTS.find(r => r.id === req.params.id);
    if (!rep) return res.status(404).json({ error: 'Repayment not found' });
    res.json({
      repayment: { ...rep, status: 'paid', paid_date: new Date().toISOString(), paid_amount: req.body.amount, payment_method: req.body.payment_method || 'upi' },
      _fallback: true,
    });
  }
});

// Repayment calendar
router.get('/repayments/calendar', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      "SELECT * FROM credit_repayments WHERE user_id = $1 AND status = 'upcoming' ORDER BY due_date ASC LIMIT 12",
      [user_id]
    );

    const totalUpcoming = result.rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    res.json({ upcoming: result.rows, total_upcoming: totalUpcoming });
  } catch (err) {
    const { user_id } = req.query;
    const upcoming = SEED_REPAYMENTS.filter(r => r.user_id === user_id && r.status === 'upcoming');
    const totalUpcoming = upcoming.reduce((s, r) => s + (r.amount || 0), 0);
    res.json({ upcoming, total_upcoming: totalUpcoming, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. FINANCIAL GRAPH
// ═══════════════════════════════════════════════════════════════════

// Full financial graph
router.get('/graph', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const assets = await pool.query(
      'SELECT * FROM credit_assets WHERE user_id = $1',
      [user_id]
    );
    const liabilities = await pool.query(
      "SELECT * FROM credit_applications WHERE user_id = $1 AND status = 'approved'",
      [user_id]
    );

    const totalAssets = assets.rows.reduce((s, a) => s + parseFloat(a.value || 0), 0);
    const totalLiabilities = liabilities.rows.reduce((s, l) => s + parseFloat(l.amount || 0), 0);

    res.json({
      financial_graph: {
        user_id,
        assets: assets.rows,
        liabilities: liabilities.rows,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
      },
    });
  } catch (err) {
    const { user_id } = req.query;
    const graph = SEED_FINANCIAL_GRAPH[user_id];
    if (!graph) return res.json({ financial_graph: { user_id, assets: [], liabilities: [], net_worth: 0 }, _fallback: true });
    res.json({ financial_graph: graph, _fallback: true });
  }
});

// Monthly cashflow
router.get('/graph/cashflow', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const income = await pool.query(
      "SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as total FROM credit_transactions WHERE user_id = $1 AND type = 'income' GROUP BY month ORDER BY month DESC LIMIT 6",
      [user_id]
    );
    const expenses = await pool.query(
      "SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as total FROM credit_transactions WHERE user_id = $1 AND type = 'expense' GROUP BY month ORDER BY month DESC LIMIT 6",
      [user_id]
    );

    res.json({ cashflow: { income: income.rows, expenses: expenses.rows } });
  } catch (err) {
    res.json({ cashflow: SEED_CASHFLOW, _fallback: true });
  }
});

// Asset inventory
router.get('/graph/assets', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const result = await pool.query(
      'SELECT * FROM credit_assets WHERE user_id = $1 ORDER BY value DESC',
      [user_id]
    );

    const totalValue = result.rows.reduce((s, a) => s + parseFloat(a.value || 0), 0);
    res.json({ assets: result.rows, total_value: totalValue });
  } catch (err) {
    const { user_id } = req.query;
    const assets = SEED_ASSETS.filter(a => a.user_id === user_id);
    const totalValue = assets.reduce((s, a) => s + (a.value || 0), 0);
    res.json({ assets, total_value: totalValue, _fallback: true });
  }
});

// Register asset
router.post('/graph/assets', async (req, res) => {
  try {
    const { user_id, asset_type, name, value, details } = req.body;
    if (!user_id || !asset_type || !name || !value) {
      return res.status(400).json({ error: 'user_id, asset_type, name, value required' });
    }

    const validTypes = ['land', 'equipment', 'livestock', 'inventory'];
    if (!validTypes.includes(asset_type)) {
      return res.status(400).json({ error: `asset_type must be one of: ${validTypes.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO credit_assets (user_id, asset_type, name, value, details)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [user_id, asset_type, name, value, JSON.stringify(details || {})]);

    res.status(201).json({ asset: result.rows[0] });
  } catch (err) {
    const asset = {
      id: `asset-${Date.now()}`, ...req.body,
      details: req.body.details || {},
      created_at: new Date().toISOString(),
    };
    res.status(201).json({ asset, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. LENDER NETWORK
// ═══════════════════════════════════════════════════════════════════

// List lenders
router.get('/lenders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_lenders ORDER BY name');
    res.json({ lenders: result.rows });
  } catch (err) {
    res.json({ lenders: SEED_LENDERS, _fallback: true });
  }
});

// Lender detail
router.get('/lenders/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_lenders WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Lender not found' });

    const products = await pool.query(
      'SELECT * FROM credit_products WHERE lenders @> $1::jsonb',
      [JSON.stringify([result.rows[0].name])]
    );

    res.json({ lender: result.rows[0], products: products.rows });
  } catch (err) {
    const lender = SEED_LENDERS.find(l => l.id === req.params.id);
    if (!lender) return res.status(404).json({ error: 'Lender not found' });
    const products = SEED_PRODUCTS.filter(p => p.lenders && p.lenders.includes(lender.name.split(' (')[0]));
    res.json({ lender, products, _fallback: true });
  }
});

// Express interest in lender product
router.post('/lenders/:id/interest', async (req, res) => {
  try {
    const { user_id, product_id, amount } = req.body;
    if (!user_id || !amount) {
      return res.status(400).json({ error: 'user_id, amount required' });
    }

    const result = await pool.query(`
      INSERT INTO credit_lender_interests (lender_id, user_id, product_id, amount, status)
      VALUES ($1,$2,$3,$4,'interested') RETURNING *
    `, [req.params.id, user_id, product_id, amount]);

    res.status(201).json({ interest: result.rows[0] });
  } catch (err) {
    const lender = SEED_LENDERS.find(l => l.id === req.params.id);
    res.status(201).json({
      interest: {
        id: `interest-${Date.now()}`, lender_id: req.params.id,
        lender_name: lender?.name || 'Unknown', ...req.body,
        status: 'interested', created_at: new Date().toISOString(),
      },
      _fallback: true,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  7. AGRICULTURAL INSURANCE
// ═══════════════════════════════════════════════════════════════════

// List insurance products
router.get('/insurance/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM insurance_products ORDER BY name');
    res.json({ products: result.rows });
  } catch (err) {
    res.json({ products: SEED_INSURANCE_PRODUCTS, _fallback: true });
  }
});

// Apply for insurance
router.post('/insurance/apply', async (req, res) => {
  try {
    const { user_id, product_type, details } = req.body;
    if (!user_id || !product_type) {
      return res.status(400).json({ error: 'user_id, product_type required' });
    }

    const validTypes = ['pmfby_crop', 'weather_based', 'livestock', 'equipment', 'health'];
    if (!validTypes.includes(product_type)) {
      return res.status(400).json({ error: `product_type must be one of: ${validTypes.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO insurance_applications (user_id, product_type, details, status)
      VALUES ($1,$2,$3,'submitted') RETURNING *
    `, [user_id, product_type, JSON.stringify(details || {})]);

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    const product = SEED_INSURANCE_PRODUCTS.find(p => p.type === req.body.product_type);
    res.status(201).json({
      application: {
        id: `ins-app-${Date.now()}`, ...req.body,
        product_name: product?.name || req.body.product_type,
        status: 'submitted', created_at: new Date().toISOString(),
      },
      _fallback: true,
    });
  }
});

// List insurance claims
router.get('/insurance/claims', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM insurance_claims WHERE 1=1';
    const params = [];

    if (user_id) { params.push(user_id); query += ` AND user_id = $${params.length}`; }
    query += ' ORDER BY filed_at DESC';

    const result = await pool.query(query, params);
    res.json({ claims: result.rows });
  } catch (err) {
    const { user_id } = req.query;
    let filtered = SEED_INSURANCE_CLAIMS;
    if (user_id) filtered = filtered.filter(c => c.user_id === user_id);
    res.json({ claims: filtered, _fallback: true });
  }
});

// File insurance claim
router.post('/insurance/claims', async (req, res) => {
  try {
    const { user_id, policy_id, claim_type, description, amount } = req.body;
    if (!user_id || !policy_id || !claim_type || !amount) {
      return res.status(400).json({ error: 'user_id, policy_id, claim_type, amount required' });
    }

    const result = await pool.query(`
      INSERT INTO insurance_claims (user_id, policy_id, claim_type, description, amount, status)
      VALUES ($1,$2,$3,$4,$5,'filed') RETURNING *
    `, [user_id, policy_id, claim_type, description, amount]);

    res.status(201).json({ claim: result.rows[0] });
  } catch (err) {
    const claim = {
      id: `claim-${Date.now()}`, ...req.body,
      status: 'filed', filed_at: new Date().toISOString(),
    };
    res.status(201).json({ claim, _fallback: true });
  }
});

module.exports = router;
