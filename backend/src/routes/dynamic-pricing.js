/**
 * Dynamic Commodity Pricing Engine
 * Features:
 *   1. Commodity Catalog with Real-time Prices
 *   2. Price Details with Contributing Factors
 *   3. Price History (Daily/Weekly/Monthly)
 *   4. AI Price Forecasting (Deterministic Seasonal)
 *   5. Price Alerts Management
 *   6. Live Mandi Prices
 *   7. Cross-Mandi Comparison
 *   8. AI Negotiation Suggestions
 *   9. Seasonal Price Index
 *  10. Supply-Demand Indicators
 *  11. Export Parity Pricing
 *  12. Market Trends Analytics
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  SEED / FALLBACK DATA
// ═══════════════════════════════════════════════════════════════════

const MANDIS = [
  { id: 'mandi-1', name: 'Azadpur Mandi', city: 'New Delhi', state: 'Delhi', type: 'APMC', daily_arrivals_mt: 12000, traders: 2500 },
  { id: 'mandi-2', name: 'Vashi Mandi (APMC)', city: 'Navi Mumbai', state: 'Maharashtra', type: 'APMC', daily_arrivals_mt: 8500, traders: 1800 },
  { id: 'mandi-3', name: 'Koyambedu Market', city: 'Chennai', state: 'Tamil Nadu', type: 'APMC', daily_arrivals_mt: 6000, traders: 1200 },
  { id: 'mandi-4', name: 'Yeshwanthpur APMC', city: 'Bengaluru', state: 'Karnataka', type: 'APMC', daily_arrivals_mt: 5500, traders: 1100 },
  { id: 'mandi-5', name: 'Gultekdi Market', city: 'Pune', state: 'Maharashtra', type: 'APMC', daily_arrivals_mt: 4000, traders: 900 },
  { id: 'mandi-6', name: 'Bowenpally Market', city: 'Hyderabad', state: 'Telangana', type: 'APMC', daily_arrivals_mt: 5000, traders: 1000 },
  { id: 'mandi-7', name: 'Lasalgaon Mandi', city: 'Nashik', state: 'Maharashtra', type: 'APMC', daily_arrivals_mt: 7000, traders: 600 },
  { id: 'mandi-8', name: 'Jalandhar Mandi', city: 'Jalandhar', state: 'Punjab', type: 'APMC', daily_arrivals_mt: 3500, traders: 700 }
];

const SEED_COMMODITIES = [
  { id: 'com-1', name: 'Tomato', hindi_name: 'टमाटर', category: 'vegetables', unit: 'quintal', current_price_inr: 2500, min_price_inr: 800, max_price_inr: 8000, msp_inr: null, season: 'rabi', grade: 'A' },
  { id: 'com-2', name: 'Onion', hindi_name: 'प्याज', category: 'vegetables', unit: 'quintal', current_price_inr: 1800, min_price_inr: 500, max_price_inr: 6000, msp_inr: null, season: 'kharif', grade: 'A' },
  { id: 'com-3', name: 'Potato', hindi_name: 'आलू', category: 'vegetables', unit: 'quintal', current_price_inr: 1200, min_price_inr: 400, max_price_inr: 3500, msp_inr: null, season: 'rabi', grade: 'A' },
  { id: 'com-4', name: 'Wheat', hindi_name: 'गेहूं', category: 'cereals', unit: 'quintal', current_price_inr: 2275, min_price_inr: 1800, max_price_inr: 2800, msp_inr: 2275, season: 'rabi', grade: 'FAQ' },
  { id: 'com-5', name: 'Rice (Paddy)', hindi_name: 'धान', category: 'cereals', unit: 'quintal', current_price_inr: 2203, min_price_inr: 1600, max_price_inr: 2800, msp_inr: 2203, season: 'kharif', grade: 'A' },
  { id: 'com-6', name: 'Soybean', hindi_name: 'सोयाबीन', category: 'oilseeds', unit: 'quintal', current_price_inr: 4600, min_price_inr: 3200, max_price_inr: 6500, msp_inr: 4600, season: 'kharif', grade: 'A' },
  { id: 'com-7', name: 'Cotton', hindi_name: 'कपास', category: 'fibers', unit: 'quintal', current_price_inr: 6620, min_price_inr: 5000, max_price_inr: 9500, msp_inr: 6620, season: 'kharif', grade: 'Medium Staple' },
  { id: 'com-8', name: 'Mustard', hindi_name: 'सरसों', category: 'oilseeds', unit: 'quintal', current_price_inr: 5650, min_price_inr: 4000, max_price_inr: 7200, msp_inr: 5650, season: 'rabi', grade: 'A' },
  { id: 'com-9', name: 'Chana (Gram)', hindi_name: 'चना', category: 'pulses', unit: 'quintal', current_price_inr: 5440, min_price_inr: 4000, max_price_inr: 7000, msp_inr: 5440, season: 'rabi', grade: 'A' },
  { id: 'com-10', name: 'Cauliflower', hindi_name: 'फूलगोभी', category: 'vegetables', unit: 'quintal', current_price_inr: 1500, min_price_inr: 300, max_price_inr: 4000, msp_inr: null, season: 'rabi', grade: 'A' },
  { id: 'com-11', name: 'Green Chilli', hindi_name: 'हरी मिर्च', category: 'vegetables', unit: 'quintal', current_price_inr: 3200, min_price_inr: 800, max_price_inr: 12000, msp_inr: null, season: 'all_season', grade: 'A' },
  { id: 'com-12', name: 'Banana', hindi_name: 'केला', category: 'fruits', unit: 'quintal', current_price_inr: 1100, min_price_inr: 400, max_price_inr: 2500, msp_inr: null, season: 'all_season', grade: 'A' },
  { id: 'com-13', name: 'Maize', hindi_name: 'मक्का', category: 'cereals', unit: 'quintal', current_price_inr: 2090, min_price_inr: 1500, max_price_inr: 2800, msp_inr: 2090, season: 'kharif', grade: 'A' },
  { id: 'com-14', name: 'Groundnut', hindi_name: 'मूंगफली', category: 'oilseeds', unit: 'quintal', current_price_inr: 6377, min_price_inr: 4500, max_price_inr: 8500, msp_inr: 6377, season: 'kharif', grade: 'A' },
  { id: 'com-15', name: 'Turmeric', hindi_name: 'हल्दी', category: 'spices', unit: 'quintal', current_price_inr: 15000, min_price_inr: 7000, max_price_inr: 25000, msp_inr: null, season: 'rabi', grade: 'Finger' }
];

const SEED_MANDI_PRICES = [];
for (const mandi of MANDIS) {
  for (const com of SEED_COMMODITIES.slice(0, 8)) {
    const variation = 0.85 + Math.random() * 0.3;
    SEED_MANDI_PRICES.push({
      mandi_id: mandi.id,
      mandi_name: mandi.name,
      commodity_id: com.id,
      commodity_name: com.name,
      price_inr: Math.round(com.current_price_inr * variation),
      min_price_inr: Math.round(com.current_price_inr * variation * 0.9),
      max_price_inr: Math.round(com.current_price_inr * variation * 1.1),
      unit: com.unit,
      arrivals_mt: Math.round(50 + Math.random() * 500),
      updated_at: new Date().toISOString()
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
//  1. ALL COMMODITIES WITH CURRENT PRICES
// ═══════════════════════════════════════════════════════════════════

router.get('/commodities', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM pricing_commodities WHERE 1=1';
    const params = [];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json({ commodities: result.rows });
  } catch (err) {
    let data = SEED_COMMODITIES;
    if (req.query.category) data = data.filter(c => c.category === req.query.category);
    res.json({ commodities: data, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. CURRENT PRICE WITH FACTORS
// ═══════════════════════════════════════════════════════════════════

router.get('/commodities/:id/price', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pricing_commodities WHERE id = $1', [req.params.id]
    );
    if (result.rows.length) {
      return res.json({ commodity: result.rows[0] });
    }
    throw new Error('fallback');
  } catch (err) {
    const com = SEED_COMMODITIES.find(c => c.id === req.params.id);
    if (!com) return res.status(404).json({ error: 'Commodity not found' });

    const factors = {
      mandi_arrival: { level: 'medium', impact: 'neutral', description: 'Normal arrivals at major mandis' },
      demand: { level: 'high', impact: 'positive', description: 'Strong demand from retail and wholesale' },
      supply: { level: 'adequate', impact: 'neutral', description: 'Current supply meets demand' },
      season: { level: com.season, impact: 'positive', description: `Peak ${com.season} season` },
      quality: { grade: com.grade, impact: 'positive', description: `Grade ${com.grade} quality` },
      weather: { condition: 'favorable', impact: 'neutral', description: 'No adverse weather events' },
      export_demand: { level: 'moderate', impact: 'positive', description: 'Steady export demand' }
    };

    res.json({
      commodity: com,
      price_inr: com.current_price_inr,
      msp_inr: com.msp_inr,
      price_vs_msp_pct: com.msp_inr ? Math.round(((com.current_price_inr - com.msp_inr) / com.msp_inr) * 100) : null,
      factors,
      last_updated: new Date().toISOString(),
      _seed: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. PRICE HISTORY
// ═══════════════════════════════════════════════════════════════════

router.get('/commodities/:id/history', async (req, res) => {
  try {
    const { period } = req.query;
    const days = period === 'monthly' ? 365 : period === 'weekly' ? 90 : 30;

    const result = await pool.query(
      'SELECT * FROM pricing_history WHERE commodity_id = $1 AND recorded_at > NOW() - $2::interval ORDER BY recorded_at',
      [req.params.id, `${days} days`]
    );
    if (result.rows.length) return res.json({ history: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const com = SEED_COMMODITIES.find(c => c.id === req.params.id);
    if (!com) return res.status(404).json({ error: 'Commodity not found' });

    const period = req.query.period || 'daily';
    const entries = period === 'monthly' ? 12 : period === 'weekly' ? 12 : 30;
    const history = [];
    const now = new Date();

    for (let i = entries - 1; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'monthly') date.setMonth(date.getMonth() - i);
      else if (period === 'weekly') date.setDate(date.getDate() - i * 7);
      else date.setDate(date.getDate() - i);

      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
      const seasonalFactor = 1 + 0.15 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
      const price = Math.round(com.current_price_inr * seasonalFactor);

      history.push({
        date: date.toISOString().split('T')[0],
        price_inr: price,
        min_price_inr: Math.round(price * 0.92),
        max_price_inr: Math.round(price * 1.08),
        volume_mt: Math.round(200 + Math.abs(Math.sin(dayOfYear) * 500)),
        num_mandis_reporting: Math.round(15 + Math.abs(Math.sin(dayOfYear) * 10))
      });
    }

    res.json({ commodity: com.name, period, history, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. AI PRICE FORECAST (DETERMINISTIC SEASONAL)
// ═══════════════════════════════════════════════════════════════════

router.get('/commodities/:id/forecast', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pricing_forecasts WHERE commodity_id = $1 ORDER BY forecast_date',
      [req.params.id]
    );
    if (result.rows.length) return res.json({ forecast: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const com = SEED_COMMODITIES.find(c => c.id === req.params.id);
    if (!com) return res.status(404).json({ error: 'Commodity not found' });

    const days = parseInt(req.query.days) || 30;
    const forecastDays = Math.min(days, 90);
    const forecast = [];
    const now = new Date();

    for (let i = 1; i <= forecastDays; i += (forecastDays <= 14 ? 1 : 7)) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
      const seasonalFactor = 1 + 0.12 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
      const trendFactor = 1 + 0.001 * i;
      const predicted = Math.round(com.current_price_inr * seasonalFactor * trendFactor);
      const confidence = Math.max(50, 95 - i);

      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_price_inr: predicted,
        lower_bound_inr: Math.round(predicted * (1 - (100 - confidence) / 200)),
        upper_bound_inr: Math.round(predicted * (1 + (100 - confidence) / 200)),
        confidence_pct: confidence,
        trend: predicted > com.current_price_inr ? 'bullish' : 'bearish'
      });
    }

    res.json({
      commodity: com.name,
      current_price_inr: com.current_price_inr,
      forecast_days: forecastDays,
      model: 'seasonal_deterministic_v2',
      forecast,
      _seed: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. PRICE ALERTS
// ═══════════════════════════════════════════════════════════════════

router.post('/commodities/:id/alert', async (req, res) => {
  try {
    const { user_id, threshold, direction } = req.body;
    if (!user_id || !threshold || !direction) {
      return res.status(400).json({ error: 'user_id, threshold, direction (above/below) required' });
    }
    if (!['above', 'below'].includes(direction)) {
      return res.status(400).json({ error: 'direction must be above or below' });
    }

    const result = await pool.query(`
      INSERT INTO pricing_alerts (commodity_id, user_id, threshold_price, direction, is_active)
      VALUES ($1,$2,$3,$4,true) RETURNING *
    `, [req.params.id, user_id, threshold, direction]);

    res.status(201).json({ alert: result.rows[0] });
  } catch (err) {
    res.json({
      alert: {
        id: `alert-${Date.now()}`, commodity_id: req.params.id,
        user_id: req.body.user_id, threshold_price: req.body.threshold,
        direction: req.body.direction, is_active: true,
        created_at: new Date().toISOString()
      },
      _seed: true
    });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT a.*, c.name as commodity_name FROM pricing_alerts a JOIN pricing_commodities c ON c.id = a.commodity_id WHERE a.is_active = true';
    const params = [];
    if (user_id) { params.push(user_id); query += ` AND a.user_id = $${params.length}`; }
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ alerts: result.rows });
  } catch (err) {
    res.json({
      alerts: [
        { id: 'alert-1', commodity_id: 'com-1', commodity_name: 'Tomato', user_id: req.query.user_id || 'u1', threshold_price: 3000, direction: 'above', is_active: true },
        { id: 'alert-2', commodity_id: 'com-2', commodity_name: 'Onion', user_id: req.query.user_id || 'u1', threshold_price: 1500, direction: 'below', is_active: true },
        { id: 'alert-3', commodity_id: 'com-4', commodity_name: 'Wheat', user_id: req.query.user_id || 'u1', threshold_price: 2400, direction: 'above', is_active: true }
      ],
      _seed: true
    });
  }
});

router.delete('/alerts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE pricing_alerts SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json({ deleted: true, alert: result.rows[0] });
  } catch (err) {
    res.json({ deleted: true, alert_id: req.params.id, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. LIVE MANDI PRICES
// ═══════════════════════════════════════════════════════════════════

router.get('/mandi-prices', async (req, res) => {
  try {
    const { commodity, state } = req.query;
    let query = 'SELECT * FROM mandi_live_prices WHERE 1=1';
    const params = [];
    if (commodity) { params.push(`%${commodity}%`); query += ` AND commodity_name ILIKE $${params.length}`; }
    if (state) { params.push(state); query += ` AND state = $${params.length}`; }
    query += ' ORDER BY updated_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ mandi_prices: result.rows, mandis: MANDIS });
  } catch (err) {
    let data = SEED_MANDI_PRICES;
    if (req.query.commodity) {
      data = data.filter(p => p.commodity_name.toLowerCase().includes(req.query.commodity.toLowerCase()));
    }
    res.json({ mandi_prices: data, mandis: MANDIS, _seed: true });
  }
});

router.get('/mandi-prices/:mandiId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mandi_live_prices WHERE mandi_id = $1 ORDER BY commodity_name',
      [req.params.mandiId]
    );
    if (result.rows.length) return res.json({ prices: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const mandi = MANDIS.find(m => m.id === req.params.mandiId);
    if (!mandi) return res.status(404).json({ error: 'Mandi not found' });
    const prices = SEED_MANDI_PRICES.filter(p => p.mandi_id === req.params.mandiId);
    res.json({ mandi, prices, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  7. CROSS-MANDI COMPARISON
// ═══════════════════════════════════════════════════════════════════

router.get('/comparison', async (req, res) => {
  try {
    const { commodity } = req.query;
    if (!commodity) return res.status(400).json({ error: 'commodity query parameter required' });

    const result = await pool.query(
      'SELECT * FROM mandi_live_prices WHERE commodity_name ILIKE $1 ORDER BY price_inr DESC',
      [`%${commodity}%`]
    );
    if (result.rows.length) {
      const prices = result.rows;
      const best = prices[0];
      const worst = prices[prices.length - 1];
      return res.json({
        commodity,
        comparison: prices,
        best_price: { mandi: best.mandi_name, price_inr: best.price_inr },
        lowest_price: { mandi: worst.mandi_name, price_inr: worst.price_inr },
        spread_inr: best.price_inr - worst.price_inr,
        spread_pct: Math.round(((best.price_inr - worst.price_inr) / worst.price_inr) * 100)
      });
    }
    throw new Error('fallback');
  } catch (err) {
    const commodity = req.query.commodity || 'Tomato';
    const prices = SEED_MANDI_PRICES
      .filter(p => p.commodity_name.toLowerCase().includes(commodity.toLowerCase()))
      .sort((a, b) => b.price_inr - a.price_inr);

    if (!prices.length) return res.status(404).json({ error: 'Commodity not found' });

    const best = prices[0];
    const worst = prices[prices.length - 1];

    res.json({
      commodity,
      comparison: prices,
      best_price: { mandi: best.mandi_name, price_inr: best.price_inr },
      lowest_price: { mandi: worst.mandi_name, price_inr: worst.price_inr },
      spread_inr: best.price_inr - worst.price_inr,
      spread_pct: worst.price_inr > 0 ? Math.round(((best.price_inr - worst.price_inr) / worst.price_inr) * 100) : 0,
      recommendation: best.price_inr - worst.price_inr > worst.price_inr * 0.15
        ? `Consider selling at ${best.mandi_name} for best returns`
        : 'Prices are similar across mandis, sell at nearest mandi to save transport cost',
      _seed: true
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  8. AI NEGOTIATION SUGGESTION
// ═══════════════════════════════════════════════════════════════════

router.post('/negotiate/suggest', async (req, res) => {
  try {
    const { commodity, quantity, buyer_offer, user_id } = req.body;
    if (!commodity || !buyer_offer) return res.status(400).json({ error: 'commodity, buyer_offer required' });

    const com = SEED_COMMODITIES.find(c => c.name.toLowerCase() === commodity.toLowerCase());
    const marketPrice = com ? com.current_price_inr : buyer_offer * 1.1;
    const offer = parseFloat(buyer_offer);
    const qty = parseFloat(quantity) || 10;

    let strategy = 'accept';
    let counterOffer = offer;
    const reasoning = [];

    if (offer < marketPrice * 0.9) {
      strategy = 'counter_high';
      counterOffer = Math.round(marketPrice * 1.05);
      reasoning.push(`Buyer offer ₹${offer}/q is ${Math.round(((marketPrice - offer) / marketPrice) * 100)}% below market rate ₹${marketPrice}/q`);
      reasoning.push('Recommend countering above market rate as demand is strong');
    } else if (offer < marketPrice) {
      strategy = 'counter_moderate';
      counterOffer = Math.round((offer + marketPrice) / 2 * 1.02);
      reasoning.push(`Buyer offer ₹${offer}/q is close to market rate ₹${marketPrice}/q`);
      reasoning.push('Recommend splitting the difference with slight premium');
    } else {
      strategy = 'accept';
      counterOffer = offer;
      reasoning.push(`Buyer offer ₹${offer}/q meets or exceeds market rate ₹${marketPrice}/q`);
      reasoning.push('Recommend accepting this offer');
    }

    if (qty > 50) {
      counterOffer = Math.round(counterOffer * 0.98);
      reasoning.push(`Bulk order of ${qty}q: Applied 2% volume discount`);
    }

    res.json({
      commodity,
      quantity_quintals: qty,
      buyer_offer_inr: offer,
      market_price_inr: marketPrice,
      counter_offer_inr: counterOffer,
      strategy,
      reasoning,
      total_value_inr: counterOffer * qty,
      savings_vs_accept_inr: (counterOffer - offer) * qty,
      msp_inr: com ? com.msp_inr : null,
      advice: strategy === 'accept'
        ? 'Good offer — accept and close the deal'
        : `Counter at ₹${counterOffer}/q and highlight quality grade and timely delivery`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  9. SEASONAL PRICE INDEX
// ═══════════════════════════════════════════════════════════════════

router.get('/seasonal-index', async (req, res) => {
  try {
    const { commodity } = req.query;
    let query = 'SELECT * FROM pricing_seasonal_index WHERE 1=1';
    const params = [];
    if (commodity) { params.push(`%${commodity}%`); query += ` AND commodity ILIKE $${params.length}`; }

    const result = await pool.query(query, params);
    if (result.rows.length) return res.json({ seasonal_index: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const target = req.query.commodity
      ? SEED_COMMODITIES.filter(c => c.name.toLowerCase().includes(req.query.commodity.toLowerCase()))
      : SEED_COMMODITIES.slice(0, 5);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const seasonal = target.map(com => {
      const index = months.map((month, i) => {
        const factor = 1 + 0.2 * Math.sin(((i + (com.season === 'rabi' ? 3 : 0)) / 12) * 2 * Math.PI);
        return {
          month,
          index: Math.round(factor * 100),
          typical_price_inr: Math.round(com.current_price_inr * factor),
          recommendation: factor > 1.1 ? 'sell' : factor < 0.9 ? 'hold' : 'neutral'
        };
      });
      return { commodity: com.name, season: com.season, monthly_index: index };
    });

    res.json({ seasonal_index: seasonal, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  10. SUPPLY-DEMAND INDICATOR
// ═══════════════════════════════════════════════════════════════════

router.get('/supply-demand', async (req, res) => {
  try {
    const { commodity } = req.query;
    let query = 'SELECT * FROM pricing_supply_demand WHERE 1=1';
    const params = [];
    if (commodity) { params.push(`%${commodity}%`); query += ` AND commodity ILIKE $${params.length}`; }

    const result = await pool.query(query, params);
    if (result.rows.length) return res.json({ indicators: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const target = req.query.commodity
      ? SEED_COMMODITIES.filter(c => c.name.toLowerCase().includes(req.query.commodity.toLowerCase()))
      : SEED_COMMODITIES.slice(0, 8);

    const indicators = target.map(com => {
      const supplyScore = 40 + Math.round(Math.random() * 40);
      const demandScore = 40 + Math.round(Math.random() * 40);
      const balance = supplyScore - demandScore;

      return {
        commodity: com.name,
        supply_score: supplyScore,
        demand_score: demandScore,
        balance: balance > 10 ? 'surplus' : balance < -10 ? 'deficit' : 'balanced',
        trend: balance > 10 ? 'prices_likely_to_fall' : balance < -10 ? 'prices_likely_to_rise' : 'prices_stable',
        arrivals_trend: supplyScore > 60 ? 'increasing' : 'decreasing',
        consumption_trend: demandScore > 60 ? 'increasing' : 'stable',
        price_pressure: balance > 10 ? 'downward' : balance < -10 ? 'upward' : 'neutral'
      };
    });

    res.json({ indicators, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  11. EXPORT PARITY PRICE
// ═══════════════════════════════════════════════════════════════════

router.get('/export-parity', async (req, res) => {
  try {
    const { commodity } = req.query;
    let query = 'SELECT * FROM pricing_export_parity WHERE 1=1';
    const params = [];
    if (commodity) { params.push(`%${commodity}%`); query += ` AND commodity ILIKE $${params.length}`; }

    const result = await pool.query(query, params);
    if (result.rows.length) return res.json({ export_parity: result.rows });
    throw new Error('fallback');
  } catch (err) {
    const exchangeRate = 83.5;
    const exportCommodities = [
      { name: 'Basmati Rice', domestic_inr: 4500, fob_usd: 1150, freight_usd: 45, insurance_usd: 12 },
      { name: 'Onion', domestic_inr: 1800, fob_usd: 350, freight_usd: 30, insurance_usd: 8 },
      { name: 'Turmeric', domestic_inr: 15000, fob_usd: 2800, freight_usd: 50, insurance_usd: 15 },
      { name: 'Cotton', domestic_inr: 6620, fob_usd: 1950, freight_usd: 60, insurance_usd: 20 },
      { name: 'Soybean', domestic_inr: 4600, fob_usd: 580, freight_usd: 35, insurance_usd: 10 }
    ];

    const filtered = req.query.commodity
      ? exportCommodities.filter(c => c.name.toLowerCase().includes(req.query.commodity.toLowerCase()))
      : exportCommodities;

    const parity = filtered.map(c => {
      const exportRealization = (c.fob_usd - c.freight_usd - c.insurance_usd) * exchangeRate;
      const premium = exportRealization - c.domestic_inr;
      return {
        commodity: c.name,
        domestic_price_inr: c.domestic_inr,
        fob_price_usd: c.fob_usd,
        freight_usd: c.freight_usd,
        insurance_usd: c.insurance_usd,
        exchange_rate: exchangeRate,
        export_realization_inr: Math.round(exportRealization),
        premium_inr: Math.round(premium),
        premium_pct: Math.round((premium / c.domestic_inr) * 100),
        recommendation: premium > 0 ? 'export_attractive' : 'domestic_better',
        unit: 'per_quintal'
      };
    });

    res.json({ export_parity: parity, exchange_rate_usd_inr: exchangeRate, _seed: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  12. MARKET TRENDS ANALYTICS
// ═══════════════════════════════════════════════════════════════════

router.get('/analytics/trends', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pricing_market_trends ORDER BY updated_at DESC LIMIT 1');
    if (result.rows.length) return res.json({ trends: result.rows[0] });
    throw new Error('fallback');
  } catch (err) {
    res.json({
      trends: {
        period: 'last_30_days',
        overall_direction: 'mixed',
        top_gainers: [
          { commodity: 'Green Chilli', change_pct: 22.5, current_price_inr: 3200, reason: 'Supply shortage due to unseasonal rain' },
          { commodity: 'Tomato', change_pct: 15.3, current_price_inr: 2500, reason: 'Increased demand, lower arrivals' },
          { commodity: 'Turmeric', change_pct: 8.7, current_price_inr: 15000, reason: 'Export demand surge' }
        ],
        top_losers: [
          { commodity: 'Potato', change_pct: -12.1, current_price_inr: 1200, reason: 'Cold storage releases, surplus supply' },
          { commodity: 'Cauliflower', change_pct: -8.4, current_price_inr: 1500, reason: 'Peak harvest season glut' },
          { commodity: 'Banana', change_pct: -5.2, current_price_inr: 1100, reason: 'Steady supply, stable demand' }
        ],
        key_events: [
          { event: 'MSP increase announced for Rabi 2025', impact: 'Wheat and Mustard floor prices raised by 5-7%', date: '2025-01-10' },
          { event: 'Export ban on onion partially lifted', impact: 'Onion prices stabilizing, export shipments resuming', date: '2025-01-05' },
          { event: 'Cold wave in North India', impact: 'Vegetable supply disrupted in Delhi, UP, Punjab mandis', date: '2025-01-12' }
        ],
        mandi_summary: {
          total_mandis_reporting: 45,
          total_arrivals_mt: 185000,
          highest_trade_mandi: 'Azadpur Mandi, Delhi',
          avg_price_change_pct: 2.3
        }
      },
      _seed: true
    });
  }
});

module.exports = router;
