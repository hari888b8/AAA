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

// ═══════════════════════════════════════════════════════════════
// PROGRESS TRACKING — Resume where you left, streak system
// ═══════════════════════════════════════════════════════════════

router.post('/progress', authMiddleware, async (req, res) => {
  try {
    const { course_id, module_index, completed, time_spent_seconds } = req.body;
    if (!course_id) return res.status(400).json({ error: 'course_id required' });

    const result = await query(`
      INSERT INTO training_progress (user_id, course_id, module_index, completed, time_spent_seconds)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, course_id, module_index)
      DO UPDATE SET completed = COALESCE($4, training_progress.completed),
                    time_spent_seconds = training_progress.time_spent_seconds + COALESCE($5, 0),
                    updated_at = NOW()
      RETURNING *
    `, [req.user.id, course_id, module_index || 0, completed || false, time_spent_seconds || 0]);

    res.json({ progress: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT tp.*, 
        (SELECT COUNT(*) FROM training_progress WHERE user_id = $1 AND completed = TRUE) AS total_completed,
        (SELECT COUNT(DISTINCT course_id) FROM training_progress WHERE user_id = $1) AS courses_started
      FROM training_progress tp
      WHERE tp.user_id = $1
      ORDER BY tp.updated_at DESC
    `, [req.user.id]);

    // Calculate streak
    const streakResult = await query(`
      SELECT DISTINCT DATE(updated_at) AS active_date
      FROM training_progress WHERE user_id = $1 AND updated_at > NOW() - INTERVAL '30 days'
      ORDER BY active_date DESC
    `, [req.user.id]);

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const dates = streakResult.rows.map(r => r.active_date.toISOString().split('T')[0]);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toISOString().split('T')[0]) streak++;
      else break;
    }

    res.json({ progress: result.rows, streak, stats: result.rows[0] || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// QUIZ & ASSESSMENT — Test understanding, earn points
// ═══════════════════════════════════════════════════════════════

router.get('/quiz/:courseId', async (req, res) => {
  // Return quiz questions for a course module
  const QUIZZES = {
    'c1': [
      { id: 'q1', question: 'What is the ideal spacing for paddy transplanting?', options: ['15x15 cm', '20x15 cm', '25x25 cm', '30x30 cm'], correct: 1 },
      { id: 'q2', question: 'Which nutrient is most important during tillering?', options: ['Phosphorus', 'Nitrogen', 'Potassium', 'Zinc'], correct: 1 },
      { id: 'q3', question: 'What is the recommended seed rate for transplanted paddy?', options: ['20 kg/acre', '8-10 kg/acre', '5 kg/acre', '15 kg/acre'], correct: 1 },
    ],
    'c2': [
      { id: 'q1', question: 'What is the typical water saving with drip irrigation?', options: ['10-20%', '30-40%', '40-60%', '70-80%'], correct: 2 },
      { id: 'q2', question: 'Which subsidy covers drip irrigation in AP?', options: ['PMFBY', 'PMKSY', 'KCC', 'PM-KISAN'], correct: 1 },
    ],
    'c4': [
      { id: 'q1', question: 'What is the ideal DO level for Vannamei shrimp?', options: ['2-3 ppm', '4-6 ppm', '7-8 ppm', '10+ ppm'], correct: 1 },
      { id: 'q2', question: 'What does FCR stand for?', options: ['Feed Conversion Rate', 'Feed Consumption Ratio', 'Food Cost Rating', 'Farm Credit Reserve'], correct: 0 },
      { id: 'q3', question: 'Ideal stocking density for Vannamei?', options: ['10/sqm', '30-40/sqm', '60/sqm', '100/sqm'], correct: 1 },
    ],
  };

  const quiz = QUIZZES[req.params.courseId];
  if (!quiz) return res.status(404).json({ error: 'No quiz available for this course' });

  // Return questions without correct answers
  const questions = quiz.map(q => ({ id: q.id, question: q.question, options: q.options }));
  res.json({ course_id: req.params.courseId, questions, total_questions: questions.length });
});

router.post('/quiz/:courseId/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body; // { q1: 0, q2: 1, ... }
    if (!answers) return res.status(400).json({ error: 'answers required' });

    const QUIZZES = {
      'c1': [{ id: 'q1', correct: 1 }, { id: 'q2', correct: 1 }, { id: 'q3', correct: 1 }],
      'c2': [{ id: 'q1', correct: 2 }, { id: 'q2', correct: 1 }],
      'c4': [{ id: 'q1', correct: 1 }, { id: 'q2', correct: 0 }, { id: 'q3', correct: 1 }],
    };

    const quiz = QUIZZES[req.params.courseId];
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let score = 0;
    const results = quiz.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) score++;
      return { question_id: q.id, correct: isCorrect, your_answer: userAnswer, correct_answer: q.correct };
    });

    const percentage = Math.round((score / quiz.length) * 100);
    const passed = percentage >= 60;

    // Save result
    await query(`
      INSERT INTO quiz_results (user_id, course_id, score, total, percentage, passed)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [req.user.id, req.params.courseId, score, quiz.length, percentage, passed]);

    res.json({ score, total: quiz.length, percentage, passed, results,
      message: passed ? '🎉 Congratulations! You passed!' : '📚 Keep learning and try again!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// CERTIFICATES — Digital completion certificates
// ═══════════════════════════════════════════════════════════════

router.get('/certificates', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT qr.*, u.name AS user_name FROM quiz_results qr
      JOIN users u ON u.id = qr.user_id
      WHERE qr.user_id = $1 AND qr.passed = TRUE
      ORDER BY qr.created_at DESC
    `, [req.user.id]);

    const certificates = result.rows.map(r => ({
      id: `CERT-${r.course_id}-${r.user_id.substring(0, 8)}`,
      course_id: r.course_id,
      user_name: r.user_name,
      score: r.percentage,
      issued_at: r.created_at,
      verification_url: `/verify/cert/${r.course_id}/${r.user_id.substring(0, 8)}`,
    }));

    res.json({ certificates });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// LIVE SESSIONS — Weekly expert sessions
// ═══════════════════════════════════════════════════════════════

router.get('/live-sessions', async (req, res) => {
  const sessions = [
    { id: 'ls1', title: 'Kharif Crop Planning 2025', expert: 'Dr. Rajesh Kumar', org: 'ICAR', date: '2025-06-15T10:00:00Z', duration_mins: 60, registered: 234, topics: ['Paddy', 'Cotton', 'Maize'] },
    { id: 'ls2', title: 'Shrimp Disease Prevention', expert: 'Dr. Lakshmi Narayana', org: 'CIBA', date: '2025-06-18T14:00:00Z', duration_mins: 45, registered: 156, topics: ['Vannamei', 'Disease', 'Water Quality'] },
    { id: 'ls3', title: 'Government Schemes Update', expert: 'Srinivas IAS', org: 'Agriculture Dept', date: '2025-06-20T11:00:00Z', duration_mins: 30, registered: 412, topics: ['PMFBY', 'KCC', 'Subsidies'] },
    { id: 'ls4', title: 'Organic Farming Transition', expert: 'Subhash Palekar', org: 'ZBNF', date: '2025-06-22T10:00:00Z', duration_mins: 90, registered: 189, topics: ['Natural Farming', 'Certification', 'Marketing'] },
  ];
  res.json({ sessions });
});

router.post('/live-sessions/:id/register', authMiddleware, async (req, res) => {
  try {
    await query(`
      INSERT INTO session_registrations (user_id, session_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [req.user.id, req.params.id]);
    res.json({ message: 'Registered for session', session_id: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
