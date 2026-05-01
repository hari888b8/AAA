'use strict';

/**
 * Translation API Route
 * Provides text translation for the frontend UI and chat messages
 */

const express = require('express');
const router = express.Router();
const { translate, batchTranslate } = require('../services/translate');
const { optionalAuth } = require('../middleware/auth');

// POST /api/translate — Translate single text
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { text, target, source = 'auto' } = req.body;
    if (!text || !target) return res.status(400).json({ error: 'text and target language required' });

    const supportedLangs = ['en', 'te', 'hi', 'kn', 'ta', 'ml', 'mr', 'bn', 'gu', 'pa'];
    if (!supportedLangs.includes(target)) {
      return res.status(400).json({ error: `Unsupported target language. Supported: ${supportedLangs.join(', ')}` });
    }

    const result = await translate(text, target, source);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/translate/batch — Translate multiple texts at once
router.post('/batch', optionalAuth, async (req, res) => {
  try {
    const { texts, target, source = 'auto' } = req.body;
    if (!texts || !Array.isArray(texts) || !target) {
      return res.status(400).json({ error: 'texts array and target language required' });
    }
    if (texts.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 texts per batch' });
    }

    const results = await batchTranslate(texts, target, source);
    res.json({ translations: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/translate/languages — List supported languages
router.get('/languages', (req, res) => {
  res.json({
    languages: [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు' },
      { code: 'hi', name: 'Hindi', native: 'हिंदी' },
      { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
      { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
      { code: 'mr', name: 'Marathi', native: 'मराठी' },
      { code: 'bn', name: 'Bengali', native: 'বাংলা' },
      { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    ],
  });
});

module.exports = router;
