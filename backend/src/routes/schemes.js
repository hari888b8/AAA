const express = require('express');
const router = express.Router();

// ── Government Schemes (mostly static reference data) ────────────────────────

const SCHEMES = [
  {
    id: 'pm_kisan', cat: 'income_support', title: 'PM-KISAN (PM Kisan Samman Nidhi)',
    benefit: '₹6,000/year (₹2,000 × 3 installments)',
    eligibility: 'All landholding farmer families',
    how_to: 'Register at pmkisan.gov.in or nearest CSC/Agriculture office with Aadhaar + Land records',
    deadline: 'Ongoing', tag: 'Income Support',
    docs: ['Aadhaar Card', 'Land ownership records', 'Bank account details'],
    helpline: '155261',
    link: 'https://pmkisan.gov.in',
  },
  {
    id: 'pmfby', cat: 'insurance', title: 'PM Fasal Bima Yojana (PMFBY)',
    benefit: 'Full insured sum + no premium for small farmers',
    eligibility: 'All farmers growing notified crops in notified areas',
    how_to: 'Apply via nearest bank, PACS, or CSC during crop season. Premium: 1.5% (Rabi), 2% (Kharif)',
    deadline: 'Before crop sowing', tag: 'Crop Insurance',
    docs: ['Aadhaar Card', 'Land records/7-12 extract', 'Bank passbook', 'Sowing certificate'],
    helpline: '14447',
    link: 'https://pmfby.gov.in',
  },
  {
    id: 'kcc', cat: 'credit', title: 'Kisan Credit Card (KCC)',
    benefit: 'Credit up to ₹3 lakh at 7% interest (4% with subsidy)',
    eligibility: 'All farmers, sharecroppers, tenant farmers with land documents',
    how_to: 'Apply at any nationalised bank, cooperative bank, or regional rural bank',
    deadline: 'Ongoing', tag: 'Credit',
    docs: ['Aadhaar Card', 'Land documents', 'Bank account', 'Passport photo'],
    helpline: null,
    link: null,
  },
  {
    id: 'pkvy', cat: 'organic', title: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    benefit: '₹50,000/hectare over 3 years for organic farming transition',
    eligibility: 'Farmer groups (minimum 50 farmers) in clusters',
    how_to: 'Apply through local Krishi Vigyan Kendra or State Agriculture Department',
    deadline: 'Seasonal', tag: 'Organic Farming',
    docs: ['Aadhaar Card', 'Land records', 'Group formation documents'],
    helpline: null,
    link: null,
  },
  {
    id: 'soil_health_card', cat: 'soil', title: 'Soil Health Card Scheme',
    benefit: 'Free soil testing + customized nutrient recommendations',
    eligibility: 'All farmers with agricultural land',
    how_to: 'Collect soil sample (200g from 0-20cm depth) and submit to nearest Soil Testing Lab',
    deadline: 'Ongoing', tag: 'Soil Health',
    docs: ['Aadhaar Card', 'Land survey number'],
    helpline: '1800-180-1551',
    link: 'https://soilhealth.dac.gov.in',
  },
];

const LOANS = [
  { id:'l1', name:'SBI Agri Term Loan', bank:'State Bank of India', rate:'8.5% p.a.', max:'₹50 lakh', tenure:'7 years', purpose:'Land purchase, irrigation, machinery' },
  { id:'l2', name:'Kisan Credit Card (KCC)', bank:'All nationalised banks', rate:'7% (4% with subsidy)', max:'₹3 lakh', tenure:'1 year (revolving)', purpose:'Crop cultivation, short-term needs' },
  { id:'l3', name:'Agri Gold Loan', bank:'Manappuram / Muthoot / SBI', rate:'9-11% p.a.', max:'₹25 lakh', tenure:'1 year', purpose:'Emergency funds, input purchases' },
  { id:'l4', name:'Drip/Sprinkler Irrigation Loan', bank:'NABARD + partner banks', rate:'8% (subsidised)', max:'₹10 lakh', tenure:'7 years', purpose:'Drip, sprinkler, micro-irrigation' },
];

router.get('/', (req, res) => {
  res.json(SCHEMES);
});

router.get('/:id', (req, res) => {
  const scheme = SCHEMES.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ error: 'Scheme not found' });
  res.json(scheme);
});

router.get('/loans/list', (req, res) => {
  res.json(LOANS);
});

module.exports = router;
