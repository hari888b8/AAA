'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('./pushnotifications');

// ═══════════════════════════════════════════════════════════════
// SCHEME DISCOVERY & APPLICATION ENGINE
// Auto-match farmer profile to eligible government schemes
// ═══════════════════════════════════════════════════════════════

// Comprehensive scheme database with eligibility rules
const SCHEMES_DB = [
  {
    id: 'pm_kisan', category: 'income_support',
    title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    icon: '💰', benefit: '₹6,000/year (₹2,000 × 3 installments)',
    eligibility_text: 'All landholding farmer families',
    eligibility_rules: { role: ['farmer'], min_land_acres: 0.01 },
    documents: ['Aadhaar Card', 'Land ownership records', 'Bank account details'],
    deadline: 'Ongoing — installments in Apr, Aug, Dec',
    apply_url: 'https://pmkisan.gov.in',
    helpline: '155261', state: 'all',
  },
  {
    id: 'pmfby', category: 'insurance',
    title: 'PM Fasal Bima Yojana (PMFBY)',
    icon: '🛡️', benefit: 'Full insured sum for crop loss; Premium: 1.5-5%',
    eligibility_text: 'All farmers growing notified crops in notified areas',
    eligibility_rules: { role: ['farmer'], has_active_crop: true },
    documents: ['Aadhaar Card', 'Land records/7-12 extract', 'Bank passbook', 'Sowing certificate'],
    deadline: 'Kharif: June-July, Rabi: Nov-Dec',
    apply_url: 'https://pmfby.gov.in',
    helpline: '14447', state: 'all',
  },
  {
    id: 'kcc', category: 'credit',
    title: 'Kisan Credit Card (KCC)',
    icon: '💳', benefit: 'Credit up to ₹3 lakh at 7% (4% with subsidy)',
    eligibility_text: 'All farmers, sharecroppers, tenant farmers',
    eligibility_rules: { role: ['farmer'], min_land_acres: 0 },
    documents: ['Aadhaar Card', 'Land documents', 'Bank account', 'Passport photos'],
    deadline: 'Ongoing',
    apply_url: null, helpline: null, state: 'all',
  },
  {
    id: 'pkvy', category: 'organic',
    title: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    icon: '🌿', benefit: '₹50,000/hectare over 3 years for organic transition',
    eligibility_text: 'Farmer groups (min 50) covering 50 acres for organic farming',
    eligibility_rules: { role: ['farmer', 'fpo'], farming_method: ['organic', 'natural'] },
    documents: ['Aadhaar Card', 'Land records', 'Group formation docs'],
    deadline: 'Seasonal', apply_url: null, helpline: null, state: 'all',
  },
  {
    id: 'soil_health_card', category: 'soil',
    title: 'Soil Health Card Scheme',
    icon: '🧪', benefit: 'Free soil testing + customized fertilizer recommendations',
    eligibility_text: 'All farmers with agricultural land',
    eligibility_rules: { role: ['farmer'], min_land_acres: 0 },
    documents: ['Aadhaar Card', 'Land survey number'],
    deadline: 'Ongoing',
    apply_url: 'https://soilhealth.dac.gov.in',
    helpline: '1800-180-1551', state: 'all',
  },
  {
    id: 'smam', category: 'mechanization',
    title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    icon: '🚜', benefit: '50-80% subsidy on farm machinery purchase',
    eligibility_text: 'All farmers; higher subsidy for SC/ST/small/marginal farmers',
    eligibility_rules: { role: ['farmer'], max_land_acres: 5 },
    documents: ['Aadhaar Card', 'Land records', 'Bank account', 'Category certificate (if SC/ST)'],
    deadline: 'Check state agriculture portal',
    apply_url: 'https://agrimachinery.nic.in',
    helpline: null, state: 'all',
  },
  {
    id: 'pmksy', category: 'irrigation',
    title: 'PM Krishi Sinchayee Yojana (PMKSY)',
    icon: '💧', benefit: '55-75% subsidy on micro-irrigation (drip/sprinkler)',
    eligibility_text: 'All farmers; priority to drought-prone and water-stressed areas',
    eligibility_rules: { role: ['farmer'], irrigation_type: ['rainfed', 'borewell'] },
    documents: ['Aadhaar Card', 'Land records', 'Bank passbook'],
    deadline: 'Ongoing via state portals',
    apply_url: 'https://pmksy.gov.in',
    helpline: null, state: 'all',
  },
  {
    id: 'nfsm', category: 'subsidy',
    title: 'National Food Security Mission (NFSM)',
    icon: '🌾', benefit: '50% subsidy on seeds, INM/IPM inputs, sprayers',
    eligibility_text: 'Farmers in identified districts growing rice/wheat/pulses/maize',
    eligibility_rules: { role: ['farmer'], crops: ['rice', 'wheat', 'pulses', 'maize'] },
    documents: ['Aadhaar Card', 'Land records'],
    deadline: 'Before crop season', apply_url: null, helpline: null, state: 'all',
  },
  {
    id: 'ap_rythu_bharosa', category: 'income_support',
    title: 'YSR Rythu Bharosa (AP)',
    icon: '🌱', benefit: '₹13,500/year per farmer family + PM-KISAN top-up',
    eligibility_text: 'Farmers in Andhra Pradesh with landholding',
    eligibility_rules: { role: ['farmer'], state: ['AP'] },
    documents: ['Aadhaar Card', 'Land documents', 'White Ration Card'],
    deadline: 'Ongoing', apply_url: null, helpline: '1902', state: 'AP',
  },
  {
    id: 'ts_rythu_bandhu', category: 'income_support',
    title: 'Rythu Bandhu (Telangana)',
    icon: '🌻', benefit: '₹10,000/acre/year (₹5,000 × 2 seasons)',
    eligibility_text: 'All farmers in Telangana with pattadar passbook',
    eligibility_rules: { role: ['farmer'], state: ['TS'] },
    documents: ['Aadhaar Card', 'Pattadar Passbook', 'Bank account'],
    deadline: 'Before Kharif & Rabi', apply_url: null, helpline: null, state: 'TS',
  },
  {
    id: 'fisheries_blue_revolution', category: 'aquaculture',
    title: 'PMMSY — Blue Revolution',
    icon: '🐟', benefit: '40-60% subsidy on pond construction & equipment',
    eligibility_text: 'Fish/shrimp farmers, new entrants to aquaculture',
    eligibility_rules: { role: ['farmer'], has_ponds: true },
    documents: ['Aadhaar Card', 'Land/lease documents', 'Bank account', 'Project report'],
    deadline: 'Ongoing via state fisheries dept',
    apply_url: 'https://pmmsy.dof.gov.in',
    helpline: null, state: 'all',
  },
  {
    id: 'agri_infra_fund', category: 'infrastructure',
    title: 'Agriculture Infrastructure Fund (AIF)',
    icon: '🏗️', benefit: '3% interest subvention on loans up to ₹2 crore',
    eligibility_text: 'FPOs, cooperatives, startups for post-harvest infrastructure',
    eligibility_rules: { role: ['fpo'] },
    documents: ['Registration certificate', 'Project DPR', 'Bank account', 'Land documents'],
    deadline: 'Ongoing till 2032-33',
    apply_url: 'https://agriinfra.dac.gov.in',
    helpline: null, state: 'all',
  },
];

// ─── GET /discover — Auto-match schemes to user profile ───────
router.get('/discover', auth, async (req, res) => {
  try {
    // Get user profile data for matching
    const { rows: profileRows } = await pool.query(
      `SELECT fp.*, u.role, u.state_code, u.district_id, d.name as district_name, d.state_name
       FROM users u
       LEFT JOIN farmer_profiles fp ON fp.user_id = u.id
       LEFT JOIN districts d ON u.district_id = d.id
       WHERE u.id=$1`,
      [req.user.id]
    );
    const profile = profileRows[0] || {};

    // Check if user has active crops
    const { rows: declRows } = await pool.query(
      `SELECT COUNT(*) as count FROM declarations WHERE farmer_id=$1 AND expected_harvest_date >= CURRENT_DATE`,
      [req.user.id]
    );
    const hasActiveCrop = parseInt(declRows[0]?.count) > 0;

    // Check if user has ponds
    const { rows: pondRows } = await pool.query(
      `SELECT COUNT(*) as count FROM ponds WHERE farmer_id=$1`,
      [req.user.id]
    );
    const hasPonds = parseInt(pondRows[0]?.count) > 0;

    // Match schemes
    const matched = [];
    const other = [];

    for (const scheme of SCHEMES_DB) {
      const rules = scheme.eligibility_rules;
      let score = 0;
      let reasons = [];

      // Role match
      if (rules.role && rules.role.includes(profile.role || req.user.role)) {
        score += 30;
      } else {
        other.push({ ...scheme, match_score: 0, match_reasons: ['Role mismatch'] });
        continue;
      }

      // State match
      if (scheme.state !== 'all') {
        if (profile.state_code === scheme.state || (profile.state_name && profile.state_name.includes(scheme.state === 'AP' ? 'Andhra' : 'Telangana'))) {
          score += 20;
          reasons.push('Available in your state');
        } else {
          other.push({ ...scheme, match_score: 10, match_reasons: ['Not in your state'] });
          continue;
        }
      } else {
        score += 10;
      }

      // Land check
      if (rules.min_land_acres !== undefined && profile.total_land_acres) {
        if (parseFloat(profile.total_land_acres) >= rules.min_land_acres) {
          score += 15;
          reasons.push('Land eligibility met');
        }
      }

      if (rules.max_land_acres && profile.total_land_acres) {
        if (parseFloat(profile.total_land_acres) <= rules.max_land_acres) {
          score += 10;
          reasons.push('Small/marginal farmer priority');
        }
      }

      // Active crop
      if (rules.has_active_crop && hasActiveCrop) {
        score += 15;
        reasons.push('Active crop declaration found');
      }

      // Pond ownership
      if (rules.has_ponds && hasPonds) {
        score += 20;
        reasons.push('Pond/aquaculture detected');
      }

      // Farming method
      if (rules.farming_method && profile.farming_method) {
        if (rules.farming_method.includes(profile.farming_method)) {
          score += 15;
          reasons.push('Farming method matches');
        }
      }

      // Irrigation type
      if (rules.irrigation_type && profile.irrigation_type) {
        const match = rules.irrigation_type.some(t =>
          (profile.irrigation_type || []).includes(t)
        );
        if (match) {
          score += 10;
          reasons.push('Irrigation type qualifies');
        }
      }

      if (reasons.length === 0) reasons.push('Basic eligibility met');
      matched.push({ ...scheme, match_score: Math.min(score, 100), match_reasons: reasons });
    }

    // Sort by match score
    matched.sort((a, b) => b.match_score - a.match_score);

    // Get user's existing applications
    const { rows: apps } = await pool.query(
      `SELECT scheme_id, status FROM scheme_applications WHERE user_id=$1`,
      [req.user.id]
    );
    const appMap = {};
    apps.forEach(a => { appMap[a.scheme_id] = a.status; });

    // Add application status to matched schemes
    const results = matched.map(s => ({
      ...s,
      application_status: appMap[s.id] || null,
      eligibility_rules: undefined, // Don't send raw rules to client
    }));

    res.json({
      matched_schemes: results,
      match_count: results.length,
      profile_completeness: calculateProfileCompleteness(profile),
      tip: results.length < 5
        ? 'Complete your farm profile to discover more eligible schemes'
        : null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /apply — Submit a scheme application ─────────────────
router.post('/apply', auth, async (req, res) => {
  try {
    const { scheme_id, applicant_data } = req.body;
    if (!scheme_id) return res.status(400).json({ error: 'scheme_id required' });

    const scheme = SCHEMES_DB.find(s => s.id === scheme_id);
    if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

    // Check for existing application
    const { rows: existing } = await pool.query(
      `SELECT id, status FROM scheme_applications WHERE user_id=$1 AND scheme_id=$2`,
      [req.user.id, scheme_id]
    );
    if (existing.length && existing[0].status !== 'rejected') {
      return res.status(409).json({ error: 'Application already exists', status: existing[0].status });
    }

    // Auto-fill from profile
    const { rows: profileRows } = await pool.query(
      `SELECT fp.*, u.name, u.phone, u.district_id, d.name as district_name
       FROM users u
       LEFT JOIN farmer_profiles fp ON fp.user_id = u.id
       LEFT JOIN districts d ON u.district_id = d.id
       WHERE u.id=$1`,
      [req.user.id]
    );
    const profile = profileRows[0] || {};

    const application_data = {
      applicant_name: profile.name || applicant_data?.name,
      phone: profile.phone || applicant_data?.phone,
      district: profile.district_name,
      land_acres: profile.total_land_acres,
      ...applicant_data,
    };

    const { rows } = await pool.query(
      `INSERT INTO scheme_applications (user_id, scheme_id, scheme_title, category, application_data, status, documents_pending)
       VALUES ($1, $2, $3, $4, $5, 'submitted', $6) RETURNING *`,
      [req.user.id, scheme_id, scheme.title, scheme.category, JSON.stringify(application_data), JSON.stringify(scheme.documents)]
    );

    await createNotification(
      req.user.id, 'scheme',
      '📋 Application Submitted',
      `Your application for ${scheme.title} has been submitted. Track status in Schemes.`,
      { scheme_id, application_id: rows[0].id }
    );

    res.status(201).json({
      application: rows[0],
      next_steps: scheme.documents.map(d => `Upload: ${d}`),
      message: 'Application submitted successfully. Upload required documents to complete.',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /applications — Get all user's applications ──────────
router.get('/applications', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT * FROM scheme_applications WHERE user_id=$1`;
    const params = [req.user.id];
    if (status) {
      q += ` AND status=$2`;
      params.push(status);
    }
    q += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(q, params);

    // Add scheme details
    const enriched = rows.map(app => {
      const scheme = SCHEMES_DB.find(s => s.id === app.scheme_id);
      return { ...app, scheme_details: scheme ? { icon: scheme.icon, benefit: scheme.benefit, apply_url: scheme.apply_url, helpline: scheme.helpline } : null };
    });

    res.json({ applications: enriched });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /applications/:id — Update application status ──────
router.patch('/applications/:id', auth, async (req, res) => {
  try {
    const { status, notes, documents_uploaded } = req.body;
    const validStatuses = ['submitted', 'documents_uploaded', 'under_review', 'approved', 'rejected', 'disbursed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = [];
    const params = [req.params.id, req.user.id];
    let paramIdx = 3;

    if (status) { updates.push(`status=$${paramIdx++}`); params.push(status); }
    if (notes) { updates.push(`notes=$${paramIdx++}`); params.push(notes); }
    if (documents_uploaded) { updates.push(`documents_uploaded=$${paramIdx++}`); params.push(JSON.stringify(documents_uploaded)); }
    updates.push(`updated_at=NOW()`);

    const { rows } = await pool.query(
      `UPDATE scheme_applications SET ${updates.join(', ')} WHERE id=$1 AND user_id=$2 RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found' });

    res.json({ application: rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /deadlines — Upcoming scheme deadlines ───────────────
router.get('/deadlines', auth, async (req, res) => {
  try {
    const deadlines = SCHEMES_DB
      .filter(s => s.deadline && s.deadline !== 'Ongoing')
      .map(s => ({
        scheme_id: s.id,
        title: s.title,
        icon: s.icon,
        deadline: s.deadline,
        category: s.category,
      }));

    res.json({ deadlines });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /categories — Scheme categories ──────────────────────
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'income_support', title: 'Income Support', icon: '💰', count: SCHEMES_DB.filter(s => s.category === 'income_support').length },
    { id: 'insurance', title: 'Crop Insurance', icon: '🛡️', count: SCHEMES_DB.filter(s => s.category === 'insurance').length },
    { id: 'credit', title: 'Farm Credit', icon: '💳', count: SCHEMES_DB.filter(s => s.category === 'credit').length },
    { id: 'organic', title: 'Organic Farming', icon: '🌿', count: SCHEMES_DB.filter(s => s.category === 'organic').length },
    { id: 'soil', title: 'Soil Health', icon: '🧪', count: SCHEMES_DB.filter(s => s.category === 'soil').length },
    { id: 'mechanization', title: 'Mechanization', icon: '🚜', count: SCHEMES_DB.filter(s => s.category === 'mechanization').length },
    { id: 'irrigation', title: 'Irrigation', icon: '💧', count: SCHEMES_DB.filter(s => s.category === 'irrigation').length },
    { id: 'subsidy', title: 'Input Subsidy', icon: '🌾', count: SCHEMES_DB.filter(s => s.category === 'subsidy').length },
    { id: 'aquaculture', title: 'Aquaculture', icon: '🐟', count: SCHEMES_DB.filter(s => s.category === 'aquaculture').length },
    { id: 'infrastructure', title: 'Infrastructure', icon: '🏗️', count: SCHEMES_DB.filter(s => s.category === 'infrastructure').length },
  ];
  res.json({ categories });
});

function calculateProfileCompleteness(profile) {
  let filled = 0;
  const fields = ['total_land_acres', 'irrigation_type', 'farming_method', 'soil_type', 'primary_crops', 'state', 'district_id', 'village'];
  fields.forEach(f => { if (profile[f]) filled++; });
  return Math.round((filled / fields.length) * 100);
}

module.exports = router;
