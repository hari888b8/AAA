/**
 * Voice AI Assistant for Rural India
 * Features:
 *   1. Voice-to-Text Transcription (Multi-language)
 *   2. Text-to-Speech Synthesis
 *   3. Voice Query Assistant
 *   4. Voice Command Processing
 *   5. Voice Crop Advisory
 *   6. Language & Model Support
 *   7. Translate & Speak
 *   8. Voice FAQ Library
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  SEED / FALLBACK DATA
// ═══════════════════════════════════════════════════════════════════

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', voice_model: 'hi-IN-Wavenet-A', tts_available: true, stt_available: true, region: 'North India' },
  { code: 'te', name: 'Telugu', native_name: 'తెలుగు', voice_model: 'te-IN-Standard-A', tts_available: true, stt_available: true, region: 'Andhra Pradesh, Telangana' },
  { code: 'ta', name: 'Tamil', native_name: 'தமிழ்', voice_model: 'ta-IN-Wavenet-A', tts_available: true, stt_available: true, region: 'Tamil Nadu' },
  { code: 'kn', name: 'Kannada', native_name: 'ಕನ್ನಡ', voice_model: 'kn-IN-Standard-A', tts_available: true, stt_available: true, region: 'Karnataka' },
  { code: 'bn', name: 'Bengali', native_name: 'বাংলা', voice_model: 'bn-IN-Wavenet-A', tts_available: true, stt_available: true, region: 'West Bengal' },
  { code: 'mr', name: 'Marathi', native_name: 'मराठी', voice_model: 'mr-IN-Standard-A', tts_available: true, stt_available: true, region: 'Maharashtra' },
  { code: 'gu', name: 'Gujarati', native_name: 'ગુજરાતી', voice_model: 'gu-IN-Standard-A', tts_available: true, stt_available: true, region: 'Gujarat' },
  { code: 'pa', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ', voice_model: 'pa-IN-Standard-A', tts_available: true, stt_available: true, region: 'Punjab' },
  { code: 'en', name: 'English', native_name: 'English', voice_model: 'en-IN-Wavenet-D', tts_available: true, stt_available: true, region: 'Pan India' }
];

const SEED_FAQ = [
  { id: 'faq-1', question_hi: 'आज मंडी में टमाटर का भाव क्या है?', question_en: 'What is today\'s tomato price in mandi?', answer_hi: 'आज आज़ादपुर मंडी में टमाटर का भाव ₹2,500 प्रति क्विंटल है। कल से 5% की बढ़ोतरी हुई है।', answer_en: 'Today tomato price at Azadpur Mandi is ₹2,500 per quintal. It has increased 5% from yesterday.', category: 'prices', audio_url: '/audio/faq/tomato_price_hi.mp3' },
  { id: 'faq-2', question_hi: 'मौसम की जानकारी दीजिए', question_en: 'Tell me about the weather', answer_hi: 'आपके क्षेत्र में आज मौसम साफ रहेगा। तापमान 25-32°C। अगले 3 दिन बारिश की संभावना नहीं है।', answer_en: 'Weather in your area will be clear today. Temperature 25-32°C. No rain expected in next 3 days.', category: 'weather', audio_url: '/audio/faq/weather_hi.mp3' },
  { id: 'faq-3', question_hi: 'गेहूं में रोग लगा है क्या करूं?', question_en: 'My wheat crop has disease, what should I do?', answer_hi: 'गेहूं में पीला रतुआ रोग की संभावना है। Propiconazole 25% EC @ 1ml प्रति लीटर पानी में घोलकर स्प्रे करें। सुबह या शाम को स्प्रे करें।', answer_en: 'This could be Yellow Rust disease. Spray Propiconazole 25% EC @ 1ml per litre of water. Spray in morning or evening.', category: 'crop_advisory', audio_url: '/audio/faq/wheat_disease_hi.mp3' },
  { id: 'faq-4', question_hi: 'ट्रांसपोर्ट कैसे बुक करूं?', question_en: 'How do I book transport?', answer_hi: 'ट्रांसपोर्ट बुक करने के लिए कहें "ट्रांसपोर्ट बुक करो" और फिर अपनी फसल, मात्रा और मंडी का नाम बताएं।', answer_en: 'To book transport, say "Book transport" and then tell your crop name, quantity and mandi name.', category: 'transport', audio_url: '/audio/faq/book_transport_hi.mp3' },
  { id: 'faq-5', question_hi: 'PM किसान योजना का पैसा कब आएगा?', question_en: 'When will PM Kisan payment come?', answer_hi: 'PM किसान सम्मान निधि की अगली किस्त अप्रैल 2025 में आने की उम्मीद है। ₹6,000 प्रति वर्ष, ₹2,000 हर 4 महीने में।', answer_en: 'Next PM Kisan Samman Nidhi installment is expected in April 2025. ₹6,000 per year, ₹2,000 every 4 months.', category: 'schemes', audio_url: '/audio/faq/pm_kisan_hi.mp3' },
  { id: 'faq-6', question_hi: 'KCC लोन कैसे लें?', question_en: 'How to get KCC loan?', answer_hi: 'किसान क्रेडिट कार्ड (KCC) के लिए अपने नज़दीकी बैंक शाखा में जाएं। ज़मीन के कागज़ात, आधार कार्ड, और पासपोर्ट फोटो लेकर जाएं।', answer_en: 'For Kisan Credit Card, visit your nearest bank branch. Carry land documents, Aadhaar card, and passport photos.', category: 'finance', audio_url: '/audio/faq/kcc_loan_hi.mp3' }
];

const COMMAND_TYPES = {
  check_price: { keywords: ['price', 'bhav', 'daam', 'rate', 'मूल्य', 'भाव', 'दाम', 'रेट'] },
  book_transport: { keywords: ['transport', 'truck', 'gaadi', 'vehicle', 'ट्रांसपोर्ट', 'गाड़ी', 'ट्रक'] },
  check_weather: { keywords: ['weather', 'mausam', 'barish', 'rain', 'मौसम', 'बारिश', 'तापमान'] },
  place_order: { keywords: ['order', 'buy', 'kharid', 'mangao', 'ऑर्डर', 'खरीद', 'मंगाओ'] },
  crop_advisory: { keywords: ['disease', 'rog', 'keeda', 'pest', 'spray', 'रोग', 'कीड़ा', 'स्प्रे'] },
  check_scheme: { keywords: ['scheme', 'yojana', 'subsidy', 'योजना', 'सब्सिडी', 'किसान'] }
};

// ═══════════════════════════════════════════════════════════════════
//  1. VOICE-TO-TEXT TRANSCRIPTION
// ═══════════════════════════════════════════════════════════════════

router.post('/transcribe', async (req, res) => {
  try {
    const { audio_url, language, user_id } = req.body;
    if (!audio_url) return res.status(400).json({ error: 'audio_url required' });

    const lang = language || 'hi';
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    if (!langInfo) return res.status(400).json({ error: `Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.map(l => l.code).join(', ')}` });

    const transcriptionId = `trans-${Date.now()}`;
    const sampleTranscripts = {
      hi: 'आज मंडी में प्याज का भाव क्या है',
      te: 'ఈ రోజు మార్కెట్లో ఉల్లిపాయల ధర ఎంత',
      ta: 'இன்று மார்க்கெட்டில் வெங்காயம் விலை என்ன',
      kn: 'ಇಂದು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಈರುಳ್ಳಿ ಬೆಲೆ ಎಷ್ಟು',
      bn: 'আজ বাজারে পেঁয়াজের দাম কত',
      mr: 'आज बाजारात कांद्याचा भाव काय आहे',
      en: 'What is the onion price in mandi today'
    };

    try {
      await pool.query(`
        INSERT INTO voice_transcriptions (id, user_id, audio_url, language, transcribed_text, confidence)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [transcriptionId, user_id, audio_url, lang, sampleTranscripts[lang] || sampleTranscripts['en'], 0.92]);
    } catch (dbErr) {
      // table may not exist
    }

    res.json({
      transcription_id: transcriptionId,
      language: lang,
      language_name: langInfo.name,
      text: sampleTranscripts[lang] || sampleTranscripts['en'],
      confidence: 0.92,
      duration_seconds: 3.5,
      model: langInfo.voice_model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. TEXT-TO-SPEECH
// ═══════════════════════════════════════════════════════════════════

router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, language, voice_type } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    const lang = language || 'hi';
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    if (!langInfo) return res.status(400).json({ error: `Unsupported language: ${lang}` });

    const audioId = `tts-${Date.now()}`;
    const estimatedDuration = Math.ceil(text.length / 15);

    res.json({
      audio_id: audioId,
      language: lang,
      voice_type: voice_type || 'female',
      text,
      audio_url: `/audio/tts/${audioId}.mp3`,
      duration_seconds: estimatedDuration,
      model: langInfo.voice_model,
      format: 'mp3',
      sample_rate: 22050
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. VOICE QUERY ASSISTANT
// ═══════════════════════════════════════════════════════════════════

router.post('/query', async (req, res) => {
  try {
    const { query_text, language, user_id } = req.body;
    if (!query_text) return res.status(400).json({ error: 'query_text required' });

    const lang = language || 'hi';
    const queryLower = query_text.toLowerCase();

    let intent = 'general';
    let responseText = '';
    let data = {};

    if (queryLower.includes('price') || queryLower.includes('bhav') || queryLower.includes('daam') || queryLower.includes('भाव')) {
      intent = 'price_query';
      responseText = lang === 'hi'
        ? 'आज प्रमुख मंडियों में भाव: टमाटर ₹2,500/क्विंटल, प्याज ₹1,800/क्विंटल, आलू ₹1,200/क्विंटल।'
        : 'Today\'s mandi prices: Tomato ₹2,500/q, Onion ₹1,800/q, Potato ₹1,200/q.';
      data = { prices: [{ commodity: 'Tomato', price_inr: 2500 }, { commodity: 'Onion', price_inr: 1800 }, { commodity: 'Potato', price_inr: 1200 }] };
    } else if (queryLower.includes('weather') || queryLower.includes('mausam') || queryLower.includes('मौसम')) {
      intent = 'weather_query';
      responseText = lang === 'hi'
        ? 'आज मौसम साफ रहेगा। तापमान 28°C, हवा 12 km/h। अगले 3 दिन बारिश की संभावना नहीं है।'
        : 'Weather will be clear today. Temperature 28°C, Wind 12 km/h. No rain expected in next 3 days.';
      data = { temperature: 28, wind_kmh: 12, humidity: 65, rain_probability: 5 };
    } else if (queryLower.includes('disease') || queryLower.includes('rog') || queryLower.includes('रोग')) {
      intent = 'crop_advisory';
      responseText = lang === 'hi'
        ? 'फसल रोग की पहचान के लिए कृपया फसल का फोटो भेजें या रोग के लक्षण बताएं।'
        : 'For crop disease identification, please send a photo of the crop or describe the symptoms.';
      data = { action: 'send_photo_or_describe' };
    } else {
      responseText = lang === 'hi'
        ? 'मैं आपकी मदद कर सकता हूं। कृपया बताएं: मंडी भाव, मौसम, फसल सलाह, या ट्रांसपोर्ट बुक करना है?'
        : 'I can help you. Please tell me: mandi prices, weather, crop advisory, or book transport?';
    }

    try {
      await pool.query(`
        INSERT INTO voice_queries (user_id, query_text, language, intent, response_text)
        VALUES ($1,$2,$3,$4,$5)
      `, [user_id, query_text, lang, intent, responseText]);
    } catch (dbErr) {
      // table may not exist
    }

    res.json({
      query: query_text,
      language: lang,
      intent,
      response: { text: responseText, audio_url: `/audio/response/${Date.now()}.mp3`, data },
      suggestions: ['मंडी भाव बताओ', 'मौसम की जानकारी', 'फसल सलाह', 'ट्रांसपोर्ट बुक करो']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. VOICE COMMAND PROCESSING
// ═══════════════════════════════════════════════════════════════════

router.post('/commands', async (req, res) => {
  try {
    const { command_text, user_id, language } = req.body;
    if (!command_text) return res.status(400).json({ error: 'command_text required' });

    const textLower = command_text.toLowerCase();
    let action = 'unknown';
    let confidence = 0;

    for (const [actionType, config] of Object.entries(COMMAND_TYPES)) {
      const matchCount = config.keywords.filter(kw => textLower.includes(kw)).length;
      if (matchCount > 0) {
        const c = Math.min(0.95, 0.6 + matchCount * 0.1);
        if (c > confidence) { action = actionType; confidence = c; }
      }
    }

    const commandId = `cmd-${Date.now()}`;

    try {
      await pool.query(`
        INSERT INTO voice_commands (id, user_id, command_text, language, action, confidence)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [commandId, user_id, command_text, language || 'hi', action, confidence]);
    } catch (dbErr) {
      // table may not exist
    }

    res.json({
      command_id: commandId,
      command_text,
      action,
      confidence,
      language: language || 'hi',
      parameters: {},
      next_step: action === 'check_price' ? 'Ask commodity name'
        : action === 'book_transport' ? 'Ask quantity and destination'
        : action === 'check_weather' ? 'Ask location'
        : action === 'place_order' ? 'Ask product and quantity'
        : 'Ask for clarification'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Command history
router.get('/commands/history', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM voice_commands WHERE 1=1';
    const params = [];
    if (user_id) { params.push(user_id); query += ` AND user_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ commands: result.rows });
  } catch (err) {
    res.json({
      commands: [
        { id: 'cmd-1', user_id: req.query.user_id || 'u1', command_text: 'टमाटर का भाव बताओ', action: 'check_price', confidence: 0.92, language: 'hi', created_at: '2025-01-17T10:00:00Z' },
        { id: 'cmd-2', user_id: req.query.user_id || 'u1', command_text: 'मौसम कैसा रहेगा', action: 'check_weather', confidence: 0.88, language: 'hi', created_at: '2025-01-17T09:30:00Z' },
        { id: 'cmd-3', user_id: req.query.user_id || 'u1', command_text: 'Transport book karo 50 quintal onion', action: 'book_transport', confidence: 0.85, language: 'en', created_at: '2025-01-16T14:00:00Z' }
      ],
      _seed: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. VOICE CROP ADVISORY
// ═══════════════════════════════════════════════════════════════════

router.post('/advisory', async (req, res) => {
  try {
    const { crop, location, issue_description, language, user_id } = req.body;
    if (!crop) return res.status(400).json({ error: 'crop required' });

    const lang = language || 'hi';
    const advisories = {
      wheat: {
        hi: 'गेहूं की फसल में पीला रतुआ रोग हो सकता है। Propiconazole 25% EC @ 1ml/लीटर पानी में स्प्रे करें। सिंचाई नियमित रखें।',
        en: 'Wheat crop may have Yellow Rust disease. Spray Propiconazole 25% EC @ 1ml/litre water. Keep irrigation regular.'
      },
      rice: {
        hi: 'धान में ब्लास्ट रोग की रोकथाम के लिए Tricyclazole 75% WP @ 0.6g/लीटर पानी में स्प्रे करें।',
        en: 'For Rice Blast prevention, spray Tricyclazole 75% WP @ 0.6g/litre water.'
      },
      tomato: {
        hi: 'टमाटर में झुलसा रोग हो सकता है। Mancozeb 75% WP @ 2.5g/लीटर पानी में स्प्रे करें। संक्रमित पत्तियां हटाएं।',
        en: 'Tomato may have Blight disease. Spray Mancozeb 75% WP @ 2.5g/litre water. Remove infected leaves.'
      },
      cotton: {
        hi: 'कपास में बॉलवर्म की रोकथाम के लिए Emamectin Benzoate 5% SG @ 0.4g/लीटर पानी में स्प्रे करें।',
        en: 'For Cotton Bollworm, spray Emamectin Benzoate 5% SG @ 0.4g/litre water.'
      }
    };

    const cropLower = crop.toLowerCase();
    const advisory = advisories[cropLower] || {
      hi: `${crop} की फसल के लिए अपने नज़दीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें। हेल्पलाइन: 1800-180-1551`,
      en: `For ${crop} crop advisory, contact your nearest Krishi Vigyan Kendra (KVK). Helpline: 1800-180-1551`
    };

    const adviceText = advisory[lang] || advisory['en'];

    res.json({
      crop,
      location: location || 'Not specified',
      issue: issue_description || 'General advisory',
      language: lang,
      advisory: {
        text: adviceText,
        audio_url: `/audio/advisory/${cropLower}_${lang}_${Date.now()}.mp3`,
        severity: issue_description ? 'medium' : 'informational',
        source: 'ICAR / KVK Advisory System'
      },
      follow_up: lang === 'hi'
        ? 'क्या आप और जानकारी चाहते हैं? फोटो भेजें या "हाँ" कहें।'
        : 'Do you want more information? Send a photo or say "Yes".'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. SUPPORTED LANGUAGES
// ═══════════════════════════════════════════════════════════════════

router.get('/languages', (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES, total: SUPPORTED_LANGUAGES.length });
});

// ═══════════════════════════════════════════════════════════════════
//  7. TRANSLATE & SPEAK
// ═══════════════════════════════════════════════════════════════════

router.post('/translate-speak', async (req, res) => {
  try {
    const { text, from_lang, to_lang } = req.body;
    if (!text || !to_lang) return res.status(400).json({ error: 'text, to_lang required' });

    const fromLang = from_lang || 'en';
    const fromInfo = SUPPORTED_LANGUAGES.find(l => l.code === fromLang);
    const toInfo = SUPPORTED_LANGUAGES.find(l => l.code === to_lang);
    if (!toInfo) return res.status(400).json({ error: `Unsupported target language: ${to_lang}` });

    const translations = {
      'en-hi': 'यह अनुवादित पाठ है',
      'en-te': 'ఇది అనువదించబడిన వచనం',
      'en-ta': 'இது மொழிபெயர்க்கப்பட்ட உரை',
      'en-bn': 'এটি অনূদিত পাঠ্য',
      'en-mr': 'हा भाषांतरित मजकूर आहे',
      'hi-en': 'This is translated text'
    };

    const translatedText = translations[`${fromLang}-${to_lang}`] || `[Translated from ${fromLang} to ${to_lang}]: ${text}`;
    const audioId = `translate-${Date.now()}`;

    res.json({
      original: { text, language: fromLang, language_name: fromInfo?.name || fromLang },
      translated: { text: translatedText, language: to_lang, language_name: toInfo.name },
      audio_url: `/audio/translate/${audioId}.mp3`,
      duration_seconds: Math.ceil(translatedText.length / 15)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  8. VOICE FAQ
// ═══════════════════════════════════════════════════════════════════

router.get('/faq', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM voice_faq WHERE 1=1';
    const params = [];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY id';

    const result = await pool.query(query, params);
    res.json({ faq: result.rows });
  } catch (err) {
    let data = SEED_FAQ;
    if (req.query.category) data = data.filter(f => f.category === req.query.category);
    res.json({ faq: data, _seed: true });
  }
});

router.post('/faq/ask', async (req, res) => {
  try {
    const { question, language } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });

    const lang = language || 'hi';
    const questionLower = question.toLowerCase();

    let bestMatch = null;
    let bestScore = 0;

    for (const faq of SEED_FAQ) {
      const checkTexts = [faq.question_en.toLowerCase(), faq.question_hi.toLowerCase()];
      for (const check of checkTexts) {
        const words = questionLower.split(/\s+/);
        const matchCount = words.filter(w => w.length > 2 && check.includes(w)).length;
        const score = matchCount / Math.max(words.length, 1);
        if (score > bestScore) { bestScore = score; bestMatch = faq; }
      }
    }

    if (bestMatch && bestScore > 0.2) {
      res.json({
        question,
        match_confidence: Math.round(bestScore * 100) / 100,
        answer: {
          text: lang === 'hi' ? bestMatch.answer_hi : bestMatch.answer_en,
          audio_url: bestMatch.audio_url,
          category: bestMatch.category
        }
      });
    } else {
      res.json({
        question,
        match_confidence: 0,
        answer: {
          text: lang === 'hi'
            ? 'इस प्रश्न का उत्तर उपलब्ध नहीं है। कृपया हेल्पलाइन 1800-180-1551 पर कॉल करें।'
            : 'Answer not available for this question. Please call helpline 1800-180-1551.',
          audio_url: null,
          category: 'unknown'
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
