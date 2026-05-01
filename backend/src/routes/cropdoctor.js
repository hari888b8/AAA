'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { createNotification } = require('./pushnotifications');

// ═══════════════════════════════════════════════════════════════
// CROP DISEASE DETECTION (Camera AI)
// AI-powered disease identification with treatment recommendations
// ═══════════════════════════════════════════════════════════════

// Disease knowledge base (simulates ML model output)
const DISEASE_DB = {
  rice: [
    {
      id: 'rice_blast', name: 'Rice Blast', name_te: 'వరి బ్లాస్ట్',
      severity: 'high', confidence_range: [75, 95],
      symptoms: ['Diamond-shaped lesions on leaves', 'Gray-green spots with dark borders', 'Neck rot at panicle base'],
      causes: ['Fungus Magnaporthe oryzae', 'High humidity + moderate temperature (25-28°C)', 'Excessive nitrogen fertilization'],
      treatment: [
        { type: 'chemical', name: 'Tricyclazole 75% WP', dosage: '0.6 g/litre water', timing: 'Spray at boot leaf stage' },
        { type: 'chemical', name: 'Isoprothiolane 40% EC', dosage: '1.5 ml/litre', timing: 'Repeat after 15 days if needed' },
        { type: 'organic', name: 'Pseudomonas fluorescens', dosage: '10 g/litre', timing: 'Preventive spray every 10 days' },
      ],
      prevention: ['Use resistant varieties (Tetep, IR36)', 'Avoid excessive nitrogen', 'Maintain proper spacing', 'Remove crop residues'],
      local_products: ['Tricyclazole (Beam, Baan)', 'Isoprothiolane (Fujione)'],
    },
    {
      id: 'rice_bph', name: 'Brown Plant Hopper (BPH)', name_te: 'బ్రౌన్ ప్లాంట్ హాపర్',
      severity: 'critical', confidence_range: [70, 92],
      symptoms: ['Hopper burn — circular dry patches', 'Yellowing from base upward', 'Sooty mold on honeydew deposits'],
      causes: ['Insect pest Nilaparvata lugens', 'Excessive use of nitrogen', 'Overuse of broad-spectrum insecticides killing natural enemies'],
      treatment: [
        { type: 'chemical', name: 'Pymetrozine 50% WG', dosage: '0.3 g/litre', timing: 'Spray when >5 hoppers/hill' },
        { type: 'chemical', name: 'Dinotefuran 20% SG', dosage: '0.3 g/litre', timing: 'Direct spray at base of plant' },
        { type: 'organic', name: 'Neem oil 5%', dosage: '5 ml/litre', timing: 'Early infestation stage' },
      ],
      prevention: ['Avoid close planting', 'Use BPH-resistant varieties', 'Conserve spider predators', 'Drain water intermittently'],
      local_products: ['Pymetrozine (Chess)', 'Dinotefuran (Starkle)'],
    },
  ],
  tomato: [
    {
      id: 'tomato_blight', name: 'Late Blight', name_te: 'ఆలస్య బ్లైట్',
      severity: 'high', confidence_range: [80, 96],
      symptoms: ['Water-soaked dark lesions on leaves', 'White fungal growth on underside', 'Rapid browning and drying of leaves'],
      causes: ['Oomycete Phytophthora infestans', 'Cool wet weather (15-20°C)', 'Overhead irrigation'],
      treatment: [
        { type: 'chemical', name: 'Mancozeb 75% WP', dosage: '2.5 g/litre', timing: 'Preventive spray every 7-10 days' },
        { type: 'chemical', name: 'Cymoxanil + Mancozeb', dosage: '3 g/litre', timing: 'Curative spray on symptom appearance' },
        { type: 'organic', name: 'Bordeaux mixture 1%', dosage: '10g CuSO4 + 10g lime per litre', timing: 'Every 10 days in wet season' },
      ],
      prevention: ['Use resistant hybrids', 'Avoid overhead watering', 'Remove and destroy infected plants', 'Good air circulation'],
      local_products: ['Mancozeb (Dithane M-45)', 'Cymoxanil+Mancozeb (Curzate)'],
    },
  ],
  cotton: [
    {
      id: 'cotton_bollworm', name: 'American Bollworm', name_te: 'అమెరికన్ బాల్‌వార్మ్',
      severity: 'critical', confidence_range: [72, 90],
      symptoms: ['Bore holes in bolls', 'Frass (excreta) on bolls', 'Damaged squares and flowers'],
      causes: ['Helicoverpa armigera moth', 'Monoculture without crop rotation', 'Late-season planting'],
      treatment: [
        { type: 'chemical', name: 'Emamectin Benzoate 5% SG', dosage: '0.4 g/litre', timing: 'At 50% flowering' },
        { type: 'chemical', name: 'Chlorantraniliprole 18.5% SC', dosage: '0.3 ml/litre', timing: 'At boll formation' },
        { type: 'organic', name: 'HaNPV (Nuclear Polyhedrosis Virus)', dosage: '250 LE/acre', timing: 'Evening spray on young larvae' },
      ],
      prevention: ['Pheromone traps (5/acre)', 'Bird perches (20/acre)', 'Neem seed kernel extract sprays', 'Early planting'],
      local_products: ['Emamectin (Proclaim)', 'Chlorantraniliprole (Coragen)'],
    },
  ],
  chilli: [
    {
      id: 'chilli_thrips', name: 'Chilli Thrips', name_te: 'మిర్చి త్రిప్స్',
      severity: 'medium', confidence_range: [75, 93],
      symptoms: ['Leaf curling upward', 'Silvery sheen on leaves', 'Stunted growth and flower drop'],
      causes: ['Scirtothrips dorsalis', 'Dry hot weather', 'Dense planting'],
      treatment: [
        { type: 'chemical', name: 'Fipronil 5% SC', dosage: '1.5 ml/litre', timing: 'At first appearance of curling' },
        { type: 'chemical', name: 'Spinetoram 11.7% SC', dosage: '0.5 ml/litre', timing: 'Rotate with fipronil' },
        { type: 'organic', name: 'Beauveria bassiana', dosage: '5 g/litre', timing: 'Evening spray, repeat weekly' },
      ],
      prevention: ['Blue sticky traps (25/acre)', 'Intercrop with maize/marigold', 'Avoid water stress', 'Reflective mulch'],
      local_products: ['Fipronil (Regent)', 'Spinetoram (Delegate)'],
    },
  ],
  groundnut: [
    {
      id: 'groundnut_tikka', name: 'Tikka Disease (Leaf Spot)', name_te: 'టిక్కా వ్యాధి',
      severity: 'medium', confidence_range: [78, 94],
      symptoms: ['Circular brown spots on leaves', 'Yellow halo around spots', 'Premature defoliation'],
      causes: ['Fungi Cercospora arachidicola & C. personatum', 'Warm humid conditions', 'Dense planting'],
      treatment: [
        { type: 'chemical', name: 'Carbendazim 50% WP', dosage: '1 g/litre', timing: '30 and 45 days after sowing' },
        { type: 'chemical', name: 'Hexaconazole 5% EC', dosage: '2 ml/litre', timing: 'At first appearance of spots' },
        { type: 'organic', name: 'Trichoderma viride', dosage: '4 g/litre', timing: 'Seed treatment + foliar at 30 DAS' },
      ],
      prevention: ['Use resistant varieties', 'Crop rotation with cereals', 'Remove crop residues', 'Proper spacing (30×10 cm)'],
      local_products: ['Carbendazim (Bavistin)', 'Hexaconazole (Contaf)'],
    },
  ],
};

// ─── POST /analyze — Analyze a crop image for disease ─────────
router.post('/analyze', auth, async (req, res) => {
  try {
    const { image_url, crop_name, symptoms_text, location } = req.body;
    if (!crop_name) return res.status(400).json({ error: 'crop_name is required' });

    const cropKey = crop_name.toLowerCase().replace(/\s+/g, '');
    const diseases = DISEASE_DB[cropKey];
    if (!diseases || !diseases.length) {
      return res.status(400).json({ error: `Crop "${crop_name}" not supported. Available: ${Object.keys(DISEASE_DB).join(', ')}` });
    }

    // Simulate AI analysis — pick most likely disease based on symptoms
    let detected = diseases[0];
    if (symptoms_text) {
      const sympLower = symptoms_text.toLowerCase();
      for (const d of diseases) {
        const matchCount = d.symptoms.filter(s => sympLower.includes(s.toLowerCase().split(' ')[0])).length;
        if (matchCount > 0) { detected = d; break; }
      }
    }

    // Generate confidence score
    const confidence = detected.confidence_range[0] +
      Math.floor(Math.random() * (detected.confidence_range[1] - detected.confidence_range[0]));

    // Store detection result
    const { rows } = await pool.query(
      `INSERT INTO disease_detections (user_id, crop_name, disease_id, disease_name, confidence, severity, image_url, location_label, symptoms_reported)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, crop_name, detected.id, detected.name, confidence, detected.severity, image_url, location, symptoms_text]
    );

    // Check for outbreak (3+ detections in same district within 7 days)
    const { rows: outbreakRows } = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as affected_farmers
       FROM disease_detections
       WHERE disease_id=$1 AND created_at > NOW() - INTERVAL '7 days'
        AND user_id IN (SELECT id FROM users WHERE district_id=$2)`,
      [detected.id, req.user.district_id]
    );
    const isOutbreak = parseInt(outbreakRows[0]?.affected_farmers) >= 3;

    if (isOutbreak) {
      // Create advisory alert
      await pool.query(
        `INSERT INTO advisories (severity, title, description, district_id, species, is_active)
         VALUES ('high', $1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING`,
        [
          `⚠️ ${detected.name} Outbreak Alert`,
          `Multiple farmers in your district have reported ${detected.name}. Take preventive measures immediately.`,
          req.user.district_id,
          crop_name,
        ]
      );
    }

    res.json({
      detection: {
        id: rows[0].id,
        disease: {
          id: detected.id,
          name: detected.name,
          name_te: detected.name_te,
          severity: detected.severity,
          confidence: confidence,
        },
        symptoms: detected.symptoms,
        causes: detected.causes,
        treatment: detected.treatment,
        prevention: detected.prevention,
        local_products: detected.local_products,
        outbreak_alert: isOutbreak ? {
          message: `⚠️ ${detected.name} outbreak detected in your area. ${outbreakRows[0]?.affected_farmers} farmers affected.`,
          severity: 'high',
        } : null,
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /history — User's detection history ──────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM disease_detections WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, Number(limit), Number(offset)]
    );
    res.json({ detections: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /outbreaks — Active disease outbreaks in region ──────
router.get('/outbreaks', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT dd.disease_id, dd.disease_name, dd.crop_name, dd.severity,
        COUNT(DISTINCT dd.user_id) as affected_farmers,
        MAX(dd.created_at) as latest_report,
        d.name as district_name
      FROM disease_detections dd
      JOIN users u ON dd.user_id = u.id
      LEFT JOIN districts d ON u.district_id = d.id
      WHERE dd.created_at > NOW() - INTERVAL '14 days'
      GROUP BY dd.disease_id, dd.disease_name, dd.crop_name, dd.severity, d.name
      HAVING COUNT(DISTINCT dd.user_id) >= 2
      ORDER BY affected_farmers DESC
    `);
    res.json({ outbreaks: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /crops — Available crops for diagnosis ───────────────
router.get('/crops', (req, res) => {
  const crops = Object.keys(DISEASE_DB).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    disease_count: DISEASE_DB[key].length,
  }));
  res.json({ crops });
});

// ─── GET /diseases/:crop — List diseases for a crop ───────────
router.get('/diseases/:crop', (req, res) => {
  const crop = req.params.crop.toLowerCase();
  const diseases = DISEASE_DB[crop];
  if (!diseases) return res.status(404).json({ error: 'Crop not found in database' });

  res.json({
    crop,
    diseases: diseases.map(d => ({
      id: d.id,
      name: d.name,
      name_te: d.name_te,
      severity: d.severity,
      symptoms: d.symptoms,
    })),
  });
});

// ─── GET /treatment/:diseaseId — Detailed treatment info ──────
router.get('/treatment/:diseaseId', (req, res) => {
  const diseaseId = req.params.diseaseId;
  let found = null;

  for (const diseases of Object.values(DISEASE_DB)) {
    found = diseases.find(d => d.id === diseaseId);
    if (found) break;
  }
  if (!found) return res.status(404).json({ error: 'Disease not found' });

  res.json({
    disease: {
      id: found.id,
      name: found.name,
      name_te: found.name_te,
      severity: found.severity,
      symptoms: found.symptoms,
      causes: found.causes,
      treatment: found.treatment,
      prevention: found.prevention,
      local_products: found.local_products,
    },
  });
});

// ─── POST /report — Community disease report ──────────────────
router.post('/report', auth, async (req, res) => {
  try {
    const { crop_name, disease_name, severity, description, location_label } = req.body;
    if (!crop_name || !disease_name) {
      return res.status(400).json({ error: 'crop_name and disease_name required' });
    }

    await pool.query(
      `INSERT INTO disease_detections (user_id, crop_name, disease_name, severity, location_label, symptoms_reported, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, 60)`,
      [req.user.id, crop_name, disease_name, severity || 'medium', location_label, description]
    );

    // Create community alert post
    await pool.query(
      `INSERT INTO community_posts (author_id, title, content, category, app_context, district_id)
       VALUES ($1, $2, $3, 'disease_alert', 'agriflow', $4)`,
      [
        req.user.id,
        `⚠️ ${disease_name} reported on ${crop_name}`,
        `A farmer in your area reported ${disease_name} on ${crop_name}. ${description || 'Check your crops and take preventive measures.'}`,
        req.user.district_id,
      ]
    );

    res.json({ success: true, message: 'Disease report submitted. Community has been alerted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
