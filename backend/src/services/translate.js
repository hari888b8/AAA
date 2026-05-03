'use strict';

/**
 * Translation Service — Multi-provider text translation
 * Supports: Google Translate (free tier), LibreTranslate (self-hosted), or mock fallback
 * Optimized for Indian agricultural terminology
 */

const https = require('https');
const http = require('http');
const logger = require('../lib/logger');

const GOOGLE_TRANSLATE_KEY = process.env.GOOGLE_TRANSLATE_KEY;
const LIBRE_TRANSLATE_URL = process.env.LIBRE_TRANSLATE_URL; // e.g., http://localhost:5000

// Cache translations to avoid repeated API calls
const cache = new Map();
const CACHE_MAX_SIZE = 5000;

/**
 * Translate text using Google Translate API
 */
async function translateViaGoogle(text, sourceLang, targetLang) {
  if (!GOOGLE_TRANSLATE_KEY) return null;

  return new Promise((resolve) => {
    const params = new URLSearchParams({
      q: text,
      source: sourceLang,
      target: targetLang,
      key: GOOGLE_TRANSLATE_KEY,
      format: 'text',
    });

    const req = https.request({
      hostname: 'translation.googleapis.com',
      path: `/language/translate/v2?${params.toString()}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translated = parsed.data?.translations?.[0]?.translatedText;
          if (translated) resolve(translated);
          else resolve(null);
        } catch { resolve(null); }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

/**
 * Translate text using free Google Translate endpoint (no API key required)
 * Note: This uses the unofficial free endpoint — subject to rate limits
 */
async function translateViaFreeGoogle(text, sourceLang, targetLang) {
  return new Promise((resolve) => {
    const encodedText = encodeURIComponent(text);
    const path = `/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

    const req = https.request({
      hostname: 'translate.googleapis.com',
      path,
      method: 'GET',
      headers: { 'User-Agent': 'AgriHub/1.0' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Response format: [[["translated","original",null,null,n]],...]
          const translated = parsed?.[0]?.map(s => s[0]).join('');
          if (translated && translated !== text) resolve(translated);
          else resolve(null);
        } catch { resolve(null); }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

/**
 * Translate text using LibreTranslate (self-hosted)
 */
async function translateViaLibre(text, sourceLang, targetLang) {
  if (!LIBRE_TRANSLATE_URL) return null;

  return new Promise((resolve) => {
    const url = new URL('/translate', LIBRE_TRANSLATE_URL);
    const payload = JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
    });

    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.translatedText || null);
        } catch { resolve(null); }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
}

/**
 * Agricultural terminology dictionary for common terms
 * This ensures farming-specific terms are translated correctly
 */
const AGRI_DICTIONARY = {
  en_te: {
    'paddy': 'వరి', 'rice': 'బియ్యం', 'cotton': 'పత్తి', 'wheat': 'గోధుమ',
    'groundnut': 'వేరుశెనగ', 'chilli': 'మిర్చి', 'tomato': 'టమాటా',
    'onion': 'ఉల్లి', 'potato': 'బంగాళదుంప', 'sugarcane': 'చెరుకు',
    'maize': 'మొక్కజొన్న', 'soybean': 'సోయా', 'turmeric': 'పసుపు',
    'fungicide': 'శిలీంధ్ర నాశని', 'pesticide': 'పురుగు మందు',
    'fertilizer': 'ఎరువు', 'irrigation': 'నీటిపారుదల', 'harvest': 'పంట కోత',
    'sowing': 'విత్తనం', 'nursery': 'నర్సరీ', 'transplanting': 'నాటడం',
    'weeding': 'కలుపు తీయడం', 'spraying': 'పిచికారీ', 'yield': 'దిగుబడి',
    'quintal': 'క్వింటాల్', 'acre': 'ఎకరం', 'mandi': 'మండి',
    'MSP': 'కనీస మద్దతు ధర', 'FPO': 'రైతు ఉత్పత్తిదారుల సంస్థ',
    'crop insurance': 'పంట భీమా', 'soil test': 'నేల పరీక్ష',
    'drip irrigation': 'బిందు సేద్యం', 'organic farming': 'సేంద్రీయ వ్యవసాయం',
  },
  en_hi: {
    'paddy': 'धान', 'rice': 'चावल', 'cotton': 'कपास', 'wheat': 'गेहूं',
    'groundnut': 'मूंगफली', 'chilli': 'मिर्च', 'tomato': 'टमाटर',
    'onion': 'प्याज', 'potato': 'आलू', 'sugarcane': 'गन्ना',
    'maize': 'मक्का', 'soybean': 'सोयाबीन', 'turmeric': 'हल्दी',
    'fungicide': 'फफूंदनाशक', 'pesticide': 'कीटनाशक',
    'fertilizer': 'उर्वरक', 'irrigation': 'सिंचाई', 'harvest': 'कटाई',
    'sowing': 'बुवाई', 'nursery': 'नर्सरी', 'transplanting': 'रोपाई',
    'weeding': 'निराई', 'spraying': 'छिड़काव', 'yield': 'उपज',
    'quintal': 'क्विंटल', 'acre': 'एकड़', 'mandi': 'मंडी',
    'MSP': 'न्यूनतम समर्थन मूल्य', 'FPO': 'किसान उत्पादक संगठन',
    'crop insurance': 'फसल बीमा', 'soil test': 'मिट्टी परीक्षण',
    'drip irrigation': 'ड्रिप सिंचाई', 'organic farming': 'जैविक खेती',
  },
};

/**
 * Apply agricultural dictionary substitution for known terms
 */
function applyAgriDictionary(text, sourceLang, targetLang) {
  const dictKey = `${sourceLang}_${targetLang}`;
  const dict = AGRI_DICTIONARY[dictKey];
  if (!dict) return text;

  let result = text;
  for (const [term, translation] of Object.entries(dict)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    result = result.replace(regex, translation);
  }
  return result;
}

/**
 * Main translation function — tries providers in order
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (te, hi, en, kn, ta, ml)
 * @param {string} [sourceLang='en'] - Source language code
 * @returns {Promise<{translated: string, provider: string, confidence: number}>}
 */
async function translate(text, targetLang, sourceLang = 'auto') {
  if (!text || !targetLang) return { translated: text, provider: 'none', confidence: 0 };
  if (sourceLang === targetLang) return { translated: text, provider: 'identity', confidence: 1.0 };

  // Check cache
  const cacheKey = `${sourceLang}:${targetLang}:${text.slice(0, 200)}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let translated = null;
  let provider = 'none';

  // Try Google Translate (paid API) first
  if (GOOGLE_TRANSLATE_KEY) {
    translated = await translateViaGoogle(text, sourceLang === 'auto' ? '' : sourceLang, targetLang);
    if (translated) provider = 'google';
  }

  // Try free Google endpoint
  if (!translated) {
    translated = await translateViaFreeGoogle(text, sourceLang === 'auto' ? 'auto' : sourceLang, targetLang);
    if (translated) provider = 'google_free';
  }

  // Try LibreTranslate
  if (!translated && LIBRE_TRANSLATE_URL) {
    translated = await translateViaLibre(text, sourceLang === 'auto' ? 'en' : sourceLang, targetLang);
    if (translated) provider = 'libre';
  }

  // Fallback: Apply agricultural dictionary if source is English
  if (!translated && (sourceLang === 'en' || sourceLang === 'auto')) {
    translated = applyAgriDictionary(text, 'en', targetLang);
    if (translated !== text) provider = 'dictionary';
    else translated = null;
  }

  // Final fallback — return original
  if (!translated) {
    return { translated: text, provider: 'fallback', confidence: 0 };
  }

  const result = { translated, provider, confidence: provider === 'google' ? 0.95 : provider === 'google_free' ? 0.90 : 0.75 };

  // Cache the result
  if (cache.size >= CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(cacheKey, result);

  return result;
}

/**
 * Batch translate multiple texts
 * @param {string[]} texts - Array of texts
 * @param {string} targetLang
 * @param {string} [sourceLang='auto']
 */
async function batchTranslate(texts, targetLang, sourceLang = 'auto') {
  return Promise.all(texts.map(text => translate(text, targetLang, sourceLang)));
}

module.exports = { translate, batchTranslate, applyAgriDictionary };
