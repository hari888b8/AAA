const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Courses ──────────────────────────────────────────────────────────────────

router.get('/courses', async (req, res) => {
  const { category } = req.query;
  // Training content is mostly static — no DB needed yet
  // Return the static course catalog; enriched with user progress if logged in
  const COURSES = [
    { id:'c1', title:'Modern Paddy Cultivation', category:'crops', icon:'🌾', learners:8240, rating:4.8, duration:'4h 30m', modules:['Variety selection','Land preparation','Transplanting','Fertilizer scheduling','Pest & disease','Harvesting & storage'] },
    { id:'c2', title:'Drip Irrigation Setup & Management', category:'irrigation', icon:'💧', learners:5100, rating:4.7, duration:'3h 15m', modules:['Types of drip systems','Cost & subsidy calculator','Installation guide','Maintenance tips','Govt. schemes'] },
    { id:'c3', title:'Organic Farming Certification', category:'organic', icon:'🌱', learners:3800, rating:4.9, duration:'6h 00m', modules:['Principles of organic farming','Composting & vermicompost','Biofertilizers','Pest management','Certification process (PGS/NOP)'] },
    { id:'c4', title:'Vannamei Shrimp Farming A-Z', category:'aquaculture', icon:'🐟', learners:2900, rating:4.8, duration:'5h 00m', modules:['Pond preparation','Seed selection','Water quality management','Feed management','Disease prevention','Harvesting'] },
    { id:'c5', title:'FPO Management & Governance', category:'fpo', icon:'🏢', learners:1560, rating:4.6, duration:'4h 00m', modules:['FPO registration','Board governance','Financial management','Marketing linkages','Government schemes','Success cases'] },
    { id:'c6', title:'Farm Machinery Operation & Safety', category:'machinery', icon:'🚜', learners:4200, rating:4.5, duration:'3h 00m', modules:['Tractor operations','PTO safety','Maintenance schedule','Custom hiring economics','Operator licensing'] },
    { id:'c7', title:'Crop Insurance & Government Schemes', category:'finance', icon:'🛡️', learners:6800, rating:4.7, duration:'2h 30m', modules:['PMFBY enrollment','KCC application','PM-KISAN registration','RKVY schemes','Document checklist'] },
    { id:'c8', title:'Soil Health & Nutrient Management', category:'soil', icon:'🌍', learners:3400, rating:4.8, duration:'3h 45m', modules:['Soil testing interpretation','NPK requirements','Micronutrient deficiency','Organic matter','Lime & pH management'] },
    { id:'c9', title:'Post-Harvest Management', category:'postharvest', icon:'📦', learners:2200, rating:4.6, duration:'3h 00m', modules:['Cleaning & grading','Storage technologies','Cold chain basics','Value addition','Market linkages'] },
    { id:'c10', title:'Digital Farming Tools', category:'digital', icon:'📱', learners:4900, rating:4.5, duration:'2h 00m', modules:['Using AgriHub apps','Mandi price tracking','Weather alerts','E-marketplace selling','Record keeping'] },
  ];

  const filtered = category ? COURSES.filter(c => c.category === category) : COURSES;
  res.json(filtered);
});

router.get('/tips', async (req, res) => {
  const TIPS = [
    { id:'t1', date: new Date().toISOString(), title:'Use neem oil for early pest control', body:'Mix 5ml neem oil per litre of water and spray in the morning when pests are less active. Effective against aphids, mites, whitefly.', category:'pest_control', icon:'🍃' },
    { id:'t2', date: new Date().toISOString(), title:'Soil moisture test — squeeze method', body:'Squeeze a handful of soil tightly. If it crumbles when released, irrigation is needed. If it stays in a ball but breaks with finger pressure, moisture is adequate.', category:'irrigation', icon:'💧' },
    { id:'t3', date: new Date().toISOString(), title:'Intercrop for better returns', body:'Consider intercropping cotton with soybean at 1:3 ratio. Soybean fixes nitrogen and reduces fertilizer cost while generating additional income.', category:'cropping', icon:'🌿' },
    { id:'t4', date: new Date().toISOString(), title:'Maintain farm records for KCC/loan benefits', body:'Banks prefer farmers with documented records. Use Farm Diary to log crop, input costs, and yield. This helps get better KCC credit limits.', category:'finance', icon:'📓' },
  ];
  res.json(TIPS);
});

// ── Expert Questions ──────────────────────────────────────────────────────────

router.post('/questions', authMiddleware, async (req, res) => {
  const { expert_id, question, category } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'Question cannot be empty' });
  try {
    const result = await query(
      `INSERT INTO training_questions (user_id, expert_id, question, category, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [req.user.id, expert_id, question.trim(), category]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT q.*, u.name AS expert_name FROM training_questions q
       LEFT JOIN users u ON q.expert_id = u.id
       WHERE q.user_id = $1 ORDER BY q.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

module.exports = router;
