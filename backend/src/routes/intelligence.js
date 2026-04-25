const express = require('express');
const { query } = require('../db/pool');
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

    // Simulate demand (in production: comes from inquiry aggregates)
    const withDemand = result.rows.map(r => {
      const supply = parseFloat(r.supply_tonnes) || 0;
      const demand = supply * (0.7 + Math.random() * 0.6); // simulated demand
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

module.exports = router;
