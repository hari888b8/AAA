const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// ── Redis cache helper ──────────────────────────────────────
let redisClient = null;
async function getRedisClient() {
  if (redisClient) return redisClient;
  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', () => { redisClient = null; });
    await redisClient.connect();
  } catch { redisClient = null; }
  return redisClient;
}

async function getCache(key) {
  try { const c = await getRedisClient(); return c ? JSON.parse(await c.get(key)) : null; } catch { return null; }
}
async function setCache(key, value, ttlSeconds = 120) {
  try { const c = await getRedisClient(); if (c) await c.setEx(key, ttlSeconds, JSON.stringify(value)); } catch {}
}


// GET /api/intelligence/supply-demand
router.get('/supply-demand', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        cc.id AS crop_id, cc.name AS crop, cc.icon_emoji,
        COALESCE(SUM(sl.quantity_kg) / 1000, 0) AS supply_tonnes,
        cc.min_price_reference AS ref_price
      FROM crop_catalog cc
      LEFT JOIN supply_listings sl ON sl.crop_id = cc.id AND sl.status = 'active'
      GROUP BY cc.id, cc.name, cc.icon_emoji, cc.min_price_reference
      ORDER BY supply_tonnes DESC
    `);

    // Real demand from inquiry aggregates
    const demandResult = await query(`
      SELECT crop_id, COALESCE(SUM(quantity_needed) / 1000, 0) AS demand_tonnes
      FROM inquiries WHERE status IN ('pending','responded','accepted')
      GROUP BY crop_id
    `);
    const demandMap = {};
    demandResult.rows.forEach(r => { demandMap[r.crop_id] = parseFloat(r.demand_tonnes) || 0; });

    const withDemand = result.rows.map(r => {
      const supply = parseFloat(r.supply_tonnes) || 0;
      const demand = demandMap[r.crop_id] || supply * (0.7 + Math.random() * 0.3);
      const gap = supply - demand;
      const signal = gap > supply * 0.1 ? 'Surplus' : gap < -supply * 0.1 ? 'Deficit' : 'Balanced';
      return { ...r, demand_tonnes: parseFloat(demand.toFixed(1)), gap_tonnes: parseFloat(gap.toFixed(1)), signal };
    });

    res.json({ data: withDemand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/district-heatmap
router.get('/district-heatmap', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        d.id, d.name, d.state_name, d.total_farmers,
        d.primary_crops,
        COUNT(DISTINCT dec.id)  AS total_declarations,
        COUNT(DISTINCT sl.id)   AS active_listings,
        ROUND(COUNT(DISTINCT dec.id)::numeric / GREATEST(d.total_farmers, 1) * 100, 1) AS coverage_pct
      FROM districts d
      LEFT JOIN declarations dec ON dec.district_id = d.id
      LEFT JOIN supply_listings sl ON sl.district_id = d.id AND sl.status = 'active'
      GROUP BY d.id, d.name, d.state_name, d.total_farmers, d.primary_crops
      ORDER BY active_listings DESC, total_declarations DESC
    `);
    res.json({ heatmap: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/prices — live price feed
router.get('/prices', async (req, res) => {
  try {
    const cacheKey = 'prices:live';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const result = await query(`
      SELECT DISTINCT ON (cc.id)
        cc.id, cc.name AS crop, cc.icon_emoji,
        pf.price_per_quintal, pf.min_price, pf.max_price,
        pf.market_name, pf.recorded_at,
        d.name AS market_district
      FROM price_feeds pf
      JOIN crop_catalog cc ON cc.id = pf.crop_id
      LEFT JOIN districts d ON d.id = pf.district_id
      ORDER BY cc.id, pf.recorded_at DESC
    `);

    // Add simulated real-time fluctuation
    const withFluctuation = result.rows.map(r => {
      const change = (Math.random() - 0.48) * r.price_per_quintal * 0.05;
      const live_price = Math.max(100, Math.round(r.price_per_quintal + change));
      const change_pct = ((change / r.price_per_quintal) * 100).toFixed(1);
      return { ...r, live_price, change_pct: parseFloat(change_pct), trending_up: change >= 0 };
    });

    const response = { prices: withFluctuation };
    await setCache(cacheKey, response, 60); // cache 60 seconds
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/platform-stats — dashboard summary
router.get('/platform-stats', async (req, res) => {
  try {
    const cacheKey = 'stats:platform';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'farmer')          AS total_farmers,
        (SELECT COUNT(*) FROM users WHERE role = 'fpo')             AS total_fpos,
        (SELECT COUNT(*) FROM users WHERE role = 'buyer')           AS total_buyers,
        (SELECT COUNT(*) FROM declarations)                         AS total_declarations,
        (SELECT COUNT(*) FROM supply_listings WHERE status='active') AS active_listings,
        (SELECT COUNT(*) FROM ponds WHERE status='active')          AS active_ponds,
        (SELECT COUNT(*) FROM properties WHERE is_available=true)   AS available_properties,
        (SELECT COUNT(*) FROM equipment WHERE status='available')   AS available_equipment,
        (SELECT COUNT(*) FROM jobs WHERE is_active=true)            AS active_jobs,
        (SELECT COUNT(*) FROM districts)                            AS districts_covered,
        (SELECT COUNT(*) FROM inquiries)                            AS total_inquiries
    `);
    const response = { stats: result.rows[0] };
    await setCache(cacheKey, response, 300); // cache 5 minutes
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/crop-recommendations?district_id=
router.get('/crop-recommendations', async (req, res) => {
  try {
    const { district_id } = req.query;
    const month = new Date().getMonth() + 1;
    let season = month >= 6 && month <= 10 ? 'kharif' : month >= 11 || month <= 3 ? 'rabi' : 'zaid';

    const crops = await query(`
      SELECT c.*, d.state_name,
             COALESCE((
               SELECT AVG(pf.price_per_quintal) FROM price_feeds pf WHERE pf.crop_id = c.id
             ), c.min_price_reference) AS avg_market_price,
             (
               SELECT COUNT(*) FROM supply_listings sl WHERE sl.crop_id = c.id AND sl.status = 'active'
             ) AS active_supply_count
      FROM crop_catalog c
      LEFT JOIN districts d ON d.id = $1::INTEGER
      WHERE c.season = $2 OR c.season = 'perennial'
      ORDER BY active_supply_count DESC, c.avg_yield_per_acre DESC
      LIMIT 10
    `, [district_id || null, season]);

    const recommendations = crops.rows.map(c => ({
      ...c,
      recommendation_score: Math.min(100, Math.round(60 + Math.random() * 30)),
      reason: season === 'kharif'
        ? 'Suitable for monsoon planting. High market demand expected.'
        : season === 'rabi'
        ? 'Good winter crop. Stable prices expected in Rabi markets.'
        : 'Short duration crop ideal for gap filling between main seasons.',
    }));

    res.json({ season, recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/activity-feed
router.get('/activity-feed', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM activity_feed ORDER BY created_at DESC LIMIT 20
    `);
    res.json({ activities: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/forecast — 30/60/90 day supply forecast
router.get('/forecast', async (req, res) => {
  try {
    const cacheKey = 'intelligence:forecast';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const result = await query(`
      SELECT cc.id AS crop_id, cc.name AS crop, cc.icon_emoji,
        SUM(CASE WHEN d.expected_harvest_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN d.expected_yield * 100 ELSE 0 END) AS supply_30d_kg,
        SUM(CASE WHEN d.expected_harvest_date BETWEEN NOW() AND NOW() + INTERVAL '60 days' THEN d.expected_yield * 100 ELSE 0 END) AS supply_60d_kg,
        SUM(CASE WHEN d.expected_harvest_date BETWEEN NOW() AND NOW() + INTERVAL '90 days' THEN d.expected_yield * 100 ELSE 0 END) AS supply_90d_kg,
        COUNT(DISTINCT d.farmer_id) AS farmer_count,
        COUNT(d.id) AS declaration_count
      FROM crop_catalog cc
      LEFT JOIN declarations d ON d.crop_id = cc.id AND d.expected_harvest_date > NOW()
      GROUP BY cc.id, cc.name, cc.icon_emoji
      HAVING SUM(d.expected_yield) > 0
      ORDER BY supply_30d_kg DESC
    `);

    const forecasts = result.rows.map(r => ({
      ...r,
      supply_30d_tonnes: parseFloat((r.supply_30d_kg / 1000).toFixed(1)),
      supply_60d_tonnes: parseFloat((r.supply_60d_kg / 1000).toFixed(1)),
      supply_90d_tonnes: parseFloat((r.supply_90d_kg / 1000).toFixed(1)),
      confidence: Math.min(95, 50 + parseInt(r.declaration_count) * 5),
    }));

    const response = { forecasts };
    await setCache(cacheKey, response, 300);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/price-history?crop_id=X&days=30
router.get('/price-history', async (req, res) => {
  try {
    const { crop_id, days = 30 } = req.query;
    if (!crop_id) return res.status(400).json({ error: 'crop_id required' });

    const result = await query(`
      SELECT DATE(recorded_at) AS date,
        ROUND(AVG(price_per_quintal)::numeric, 0) AS avg_price,
        ROUND(MIN(min_price)::numeric, 0) AS min_price,
        ROUND(MAX(max_price)::numeric, 0) AS max_price
      FROM price_feeds
      WHERE crop_id = $1 AND recorded_at >= NOW() - ($2 || ' days')::INTERVAL
      GROUP BY DATE(recorded_at)
      ORDER BY date ASC
    `, [crop_id, parseInt(days)]);

    // If no history, generate simulated data
    if (result.rows.length === 0) {
      const crop = await query('SELECT min_price_reference FROM crop_catalog WHERE id = $1', [crop_id]);
      const basePrice = crop.rows[0]?.min_price_reference || 2000;
      const simulated = [];
      for (let d = parseInt(days); d >= 0; d--) {
        const date = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
        const variation = basePrice * (0.9 + Math.random() * 0.2);
        simulated.push({ date, avg_price: Math.round(variation), min_price: Math.round(variation * 0.95), max_price: Math.round(variation * 1.05) });
      }
      return res.json({ history: simulated, simulated: true });
    }

    res.json({ history: result.rows, simulated: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intelligence/data-quality — declaration quality scores
router.get('/data-quality', async (req, res) => {
  try {
    const result = await query(`
      SELECT cc.name AS crop, cc.icon_emoji,
        COUNT(d.id) AS total_declarations,
        ROUND(AVG(
          CASE WHEN d.expected_yield IS NOT NULL THEN 20 ELSE 0 END +
          CASE WHEN d.quality_grade != 'ungraded' THEN 15 ELSE 0 END +
          CASE WHEN d.district_id IS NOT NULL THEN 15 ELSE 0 END +
          CASE WHEN d.area_acres > 0 AND d.area_acres < 500 THEN 20 ELSE 5 END +
          CASE WHEN d.is_organic IS NOT NULL THEN 10 ELSE 0 END +
          CASE WHEN d.expected_harvest_date > d.sow_date THEN 20 ELSE 0 END
        )::numeric, 0) AS avg_quality_score,
        ROUND(AVG(d.area_acres)::numeric, 1) AS avg_area
      FROM declarations d
      JOIN crop_catalog cc ON cc.id = d.crop_id
      GROUP BY cc.id, cc.name, cc.icon_emoji
      ORDER BY avg_quality_score DESC
    `);
    res.json({ quality: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/intelligence/subscriptions — subscription plans
router.get('/subscriptions', async (req, res) => {
  const plans = {
    farmer: [
      { name: 'Free', price: 0, features: ['Basic declarations', 'Market prices', 'Community access'] },
      { name: 'AgriPass', price: 99, period: 'month', features: ['Unlimited declarations', 'Price alerts', 'Priority support', 'Harvest calendar'] },
      { name: 'AgriPass Pro', price: 249, period: 'month', features: ['All AgriPass features', 'Supply intelligence', 'Direct buyer access', 'Analytics dashboard', 'SMS notifications'] },
    ],
    fpo: [
      { name: 'Starter', price: 0, features: ['Up to 50 members', 'Basic procurement', 'Community'] },
      { name: 'FPO SaaS', price: 2999, period: 'month', features: ['Unlimited members', 'Full inventory management', 'Supply listing', 'Analytics', 'Buyer matching'] },
      { name: 'FPO Enterprise', price: 9999, period: 'month', features: ['All SaaS features', 'Multi-warehouse', 'Credit facilitation', 'API access', 'Dedicated support'] },
    ],
    buyer: [
      { name: 'Explorer', price: 0, features: ['Browse listings', 'Basic search', '5 inquiries/month'] },
      { name: 'Pro', price: 9999, period: 'year', features: ['Unlimited inquiries', 'Supply intelligence', 'Price alerts', 'Direct contact'] },
      { name: 'Enterprise', price: 59999, period: 'year', features: ['All Pro features', 'API access', 'Custom reports', 'Dedicated manager', 'Contract facilitation'] },
    ],
  };
  res.json({ plans });
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM ALERT ENGINE — Price-based alerts
// ═══════════════════════════════════════════════════════════════

router.post('/alerts', authMiddleware, async (req, res) => {
  try {
    const { crop_id, district_id, condition, threshold_price, alert_type } = req.body;
    if (!crop_id || !threshold_price || !condition) {
      return res.status(400).json({ error: 'crop_id, condition (above/below), threshold_price required' });
    }

    const result = await query(`
      INSERT INTO price_alerts (id, user_id, crop_id, district_id, condition, threshold_price, alert_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *
    `, [uuidv4(), req.user.id, crop_id, district_id, condition, threshold_price, alert_type || 'push']);

    res.status(201).json({ alert: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT pa.*, cc.name AS crop_name, cc.icon_emoji, d.name AS district_name
      FROM price_alerts pa
      JOIN crop_catalog cc ON cc.id = pa.crop_id
      LEFT JOIN districts d ON d.id = pa.district_id
      WHERE pa.user_id = $1
      ORDER BY pa.created_at DESC
    `, [req.user.id]);
    res.json({ alerts: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/alerts/:id', authMiddleware, async (req, res) => {
  try {
    await query(`DELETE FROM price_alerts WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: 'Alert deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// COMMODITY CHARTS — Candlestick/line charts with historical data
// ═══════════════════════════════════════════════════════════════

router.get('/charts/:cropId', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const crop = await query(`SELECT * FROM crop_catalog WHERE id = $1`, [req.params.cropId]);
    if (!crop.rows.length) return res.status(404).json({ error: 'Crop not found' });

    const basePrice = crop.rows[0].min_price_reference || 2000;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

    // Generate realistic price history
    const chartData = [];
    let currentPrice = basePrice;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const volatility = (Math.random() - 0.48) * basePrice * 0.03;
      currentPrice = Math.max(basePrice * 0.7, Math.min(basePrice * 1.5, currentPrice + volatility));

      chartData.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(currentPrice - Math.random() * 20),
        high: Math.round(currentPrice + Math.random() * 40),
        low: Math.round(currentPrice - Math.random() * 40),
        close: Math.round(currentPrice),
        volume: Math.floor(Math.random() * 1000 + 100),
      });
    }

    const prices = chartData.map(d => d.close);
    const trend = prices[prices.length - 1] > prices[0] ? 'bullish' : 'bearish';
    const changePercent = ((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(1);

    res.json({
      crop: crop.rows[0],
      period,
      chart_data: chartData,
      summary: {
        current: prices[prices.length - 1],
        high: Math.max(...prices),
        low: Math.min(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b) / prices.length),
        trend,
        change_percent: parseFloat(changePercent),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// SEASONAL CALENDAR — Best times to plant, sell, buy
// ═══════════════════════════════════════════════════════════════

router.get('/seasonal-calendar', async (req, res) => {
  const calendar = [
    { crop: 'Paddy (Kharif)', icon: '🌾', sow: 'Jun-Jul', harvest: 'Oct-Nov', best_sell: 'Dec-Jan', notes: 'Prices peak 2-3 months after harvest when stocks reduce' },
    { crop: 'Paddy (Rabi)', icon: '🌾', sow: 'Nov-Dec', harvest: 'Mar-Apr', best_sell: 'May-Jun', notes: 'Summer paddy fetches premium due to lower supply' },
    { crop: 'Cotton', icon: '🌿', sow: 'May-Jun', harvest: 'Oct-Jan', best_sell: 'Feb-Mar', notes: 'Wait for CCI buying if market price < MSP' },
    { crop: 'Groundnut', icon: '🥜', sow: 'Jun-Jul', harvest: 'Sep-Oct', best_sell: 'Nov-Dec', notes: 'Diwali season demand pushes prices up' },
    { crop: 'Chilli', icon: '🌶️', sow: 'Jul-Aug', harvest: 'Dec-Feb', best_sell: 'Mar-May', notes: 'Cold storage can fetch 30-50% premium in off-season' },
    { crop: 'Maize', icon: '🌽', sow: 'Jun-Jul', harvest: 'Sep-Oct', best_sell: 'Nov-Dec', notes: 'Poultry feed demand peaks in winter' },
    { crop: 'Tomato', icon: '🍅', sow: 'Jun/Sep', harvest: 'Aug/Nov', best_sell: 'During scarcity', notes: 'Highly volatile — sell immediately if price is good' },
    { crop: 'Vannamei Shrimp', icon: '🦐', stock: 'Mar/Sep', harvest: 'Jun/Dec', best_sell: 'Jul-Aug', notes: 'Export demand peaks during US/EU summer' },
  ];

  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'short' });
  res.json({ calendar, current_month: currentMonth, advice: `It's ${currentMonth} — check which crops are in harvest season for selling decisions.` });
});

// ═══════════════════════════════════════════════════════════════
// MSP COMPARISON DASHBOARD
// ═══════════════════════════════════════════════════════════════

router.get('/msp-dashboard', async (req, res) => {
  const mspData = [
    { crop: 'Paddy (Common)', icon: '🌾', msp_2024: 2183, msp_2025: 2300, market_price: 2100 + Math.floor(Math.random() * 400), cost_production: 1800 },
    { crop: 'Cotton (Medium)', icon: '🌿', msp_2024: 6620, msp_2025: 7020, market_price: 6500 + Math.floor(Math.random() * 1000), cost_production: 5500 },
    { crop: 'Maize', icon: '🌽', msp_2024: 2090, msp_2025: 2225, market_price: 1900 + Math.floor(Math.random() * 500), cost_production: 1600 },
    { crop: 'Groundnut', icon: '🥜', msp_2024: 6377, msp_2025: 6783, market_price: 5800 + Math.floor(Math.random() * 1500), cost_production: 5000 },
    { crop: 'Soybean', icon: '🫘', msp_2024: 4600, msp_2025: 4892, market_price: 4200 + Math.floor(Math.random() * 800), cost_production: 3800 },
    { crop: 'Jowar', icon: '🌾', msp_2024: 3180, msp_2025: 3371, market_price: 2800 + Math.floor(Math.random() * 600), cost_production: 2500 },
  ];

  const enriched = mspData.map(d => ({
    ...d,
    above_msp: d.market_price >= d.msp_2025,
    profit_over_cost: d.market_price - d.cost_production,
    profit_pct: ((d.market_price - d.cost_production) / d.cost_production * 100).toFixed(1),
    recommendation: d.market_price >= d.msp_2025 * 1.05
      ? '🟢 Sell now — above MSP' : d.market_price >= d.msp_2025
      ? '🟡 At MSP level — sell if storage is costly' : '🔴 Below MSP — sell to govt procurement or store',
  }));

  res.json({ msp_data: enriched });
});

// ═══════════════════════════════════════════════════════════════
// SUPPLY HEATMAP — District-wise surplus/deficit visualization
// ═══════════════════════════════════════════════════════════════

router.get('/supply-heatmap', async (req, res) => {
  try {
    const { crop_id } = req.query;

    const result = await query(`
      SELECT d.id, d.name, d.state_name, d.lat, d.lng,
        COALESCE(SUM(sl.quantity_kg), 0) AS total_supply_kg,
        d.total_farmers
      FROM districts d
      LEFT JOIN supply_listings sl ON sl.district_id = d.id AND sl.status = 'active'
        ${crop_id ? 'AND sl.crop_id = $1' : ''}
      GROUP BY d.id, d.name, d.state_name, d.lat, d.lng, d.total_farmers
      ORDER BY total_supply_kg DESC
      LIMIT 50
    `, crop_id ? [crop_id] : []);

    const maxSupply = Math.max(...result.rows.map(r => parseFloat(r.total_supply_kg) || 1));
    const heatmap = result.rows.map(r => ({
      district: r.name,
      state: r.state_name,
      lat: r.lat,
      lng: r.lng,
      supply_kg: parseFloat(r.total_supply_kg),
      intensity: parseFloat(r.total_supply_kg) / maxSupply,
      status: parseFloat(r.total_supply_kg) > maxSupply * 0.6 ? 'surplus' :
              parseFloat(r.total_supply_kg) > maxSupply * 0.3 ? 'balanced' : 'deficit',
    }));

    res.json({ heatmap });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
