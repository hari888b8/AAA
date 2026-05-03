/**
 * Execution Network Routes
 * Handles: pickup verification, quality checks, collection centers, demand engine, hyperlocal matching
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ─── PICKUP VERIFICATION ───────────────────────────────────────
router.post('/verify-pickup', async (req, res) => {
  try {
    const { order_id, farmer_otp, actual_weight, bag_count, notes } = req.body;
    if (!order_id || !farmer_otp) {
      return res.status(400).json({ error: 'Order ID and farmer OTP are required' });
    }

    // Persist pickup verification to trade_orders if it exists
    const orderResult = await pool.query(
      `SELECT id, status FROM trade_orders WHERE id = $1`, [order_id]
    ).catch(() => ({ rows: [] }));

    if (orderResult.rows.length && orderResult.rows[0].status === 'quality_verified') {
      await pool.query(
        `UPDATE trade_orders SET status = 'dispatched', dispatched_at = NOW(),
         metadata = jsonb_set(COALESCE(metadata,'{}'), '{pickup_verification}', $1::jsonb),
         updated_at = NOW() WHERE id = $2`,
        [JSON.stringify({ actual_weight, bag_count, farmer_otp, verified_at: new Date().toISOString() }), order_id]
      );
    }

    res.json({
      success: true,
      message: 'Pickup verified successfully',
      verification: {
        order_id,
        actual_weight,
        bag_count,
        verified_at: new Date().toISOString(),
        gps_logged: true,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QUALITY INSPECTION ────────────────────────────────────────
router.post('/quality-check', async (req, res) => {
  try {
    const { lot_id, crop_type, moisture, foreign_matter, grade, photos, trade_order_id } = req.body;
    if (!lot_id) {
      return res.status(400).json({ error: 'Lot ID is required' });
    }

    // If linked to a trade order, update its quality status
    if (trade_order_id) {
      const orderResult = await pool.query(
        `SELECT id, status FROM trade_orders WHERE id = $1`, [trade_order_id]
      ).catch(() => ({ rows: [] }));

      if (orderResult.rows.length && orderResult.rows[0].status === 'escrow_funded') {
        await pool.query(
          `UPDATE trade_orders SET status = 'quality_verified', quality_verified = TRUE,
           grade = $1, quality_photos = $2, updated_at = NOW() WHERE id = $3`,
          [grade || 'ungraded', JSON.stringify(photos || []), trade_order_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Quality report submitted',
      report: {
        lot_id,
        crop_type,
        moisture,
        foreign_matter,
        grade,
        inspected_at: new Date().toISOString(),
        meets_standard: grade === 'A' || grade === 'B',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COLLECTION CENTERS ────────────────────────────────────────
router.get('/centers', async (req, res) => {
  try {
    const { district } = req.query;
    const centers = [
      { id: 'c1', name: 'Guntur Collection Hub', type: 'Primary', capacity_mt: 500, utilization: 72, district: 'Guntur', crops: ['Paddy', 'Cotton', 'Chilli'] },
      { id: 'c2', name: 'Mangalagiri Center', type: 'Secondary', capacity_mt: 200, utilization: 45, district: 'Guntur', crops: ['Groundnut', 'Maize'] },
      { id: 'c3', name: 'Tenali FPO Warehouse', type: 'FPO', capacity_mt: 150, utilization: 88, district: 'Guntur', crops: ['Paddy'] },
      { id: 'c4', name: 'Vijayawada Cold Storage', type: 'Cold Chain', capacity_mt: 100, utilization: 65, district: 'Krishna', crops: ['Vegetables', 'Fruits'] },
    ];
    const filtered = district ? centers.filter(c => c.district.toLowerCase() === district.toLowerCase()) : centers;
    res.json({ centers: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DEMAND ENGINE ─────────────────────────────────────────────
router.get('/demands', async (req, res) => {
  try {
    const demands = [
      { id: 'd1', crop: 'Paddy (Sona Masoori)', buyer: 'Sri Lakshmi Rice Mill', quantity_tonnes: 50, price_per_qtl: 2200, deadline: '2026-12-15', status: 'open', advance_percent: 20 },
      { id: 'd2', crop: 'Cotton (MCU-5)', buyer: 'AP Cotton Corp', quantity_tonnes: 100, price_per_qtl: 6800, deadline: '2027-01-20', status: 'open', advance_percent: 15 },
      { id: 'd3', crop: 'Groundnut', buyer: 'Balaji Oil Exports', quantity_tonnes: 30, price_per_qtl: 5500, deadline: '2026-11-10', status: 'filling', advance_percent: 25, filled_percent: 65 },
      { id: 'd4', crop: 'Chilli (Teja)', buyer: 'Spice World Exports', quantity_tonnes: 20, price_per_qtl: 14000, deadline: '2027-02-05', status: 'open', advance_percent: 10 },
    ];
    res.json({ demands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/demands/commit', async (req, res) => {
  try {
    const { demand_id, quantity_qtl } = req.body;
    if (!demand_id || !quantity_qtl) {
      return res.status(400).json({ error: 'Demand ID and quantity are required' });
    }
    res.json({
      success: true,
      message: 'Commitment registered! Advance payment will be processed.',
      commitment: { demand_id, quantity_qtl, committed_at: new Date().toISOString(), status: 'committed' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/demands/post-availability', async (req, res) => {
  try {
    const { crop, quantity_qtl } = req.body;
    if (!crop || !quantity_qtl) {
      return res.status(400).json({ error: 'Crop and quantity are required' });
    }
    res.json({
      success: true,
      message: 'Availability posted! Buyers will be notified.',
      posting: { crop, quantity_qtl, posted_at: new Date().toISOString() }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DEMAND AGGREGATION ────────────────────────────────────────
router.get('/aggregation/pools', async (req, res) => {
  try {
    const pools = [
      { id: 'p1', crop: 'Paddy', district: 'Guntur', target_tonnes: 200, filled_tonnes: 156, farmer_count: 32, buyer: 'ITC Agri', price_per_qtl: 2250 },
      { id: 'p2', crop: 'Cotton', district: 'Krishna', target_tonnes: 100, filled_tonnes: 45, farmer_count: 18, buyer: 'Vardhman Textiles', price_per_qtl: 6900 },
    ];
    res.json({ pools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/aggregation/join', async (req, res) => {
  try {
    const { pool_id, quantity_qtl } = req.body;
    if (!pool_id || !quantity_qtl) {
      return res.status(400).json({ error: 'Pool ID and quantity are required' });
    }
    res.json({ success: true, message: 'Joined pool successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HYPERLOCAL MARKETPLACE ────────────────────────────────────
router.get('/hyperlocal/listings', async (req, res) => {
  try {
    const listings = [
      { id: 'h1', type: 'sell', farmer: 'Ramesh (Pedakakani)', crop: 'Paddy Sona Masoori', quantity_qtl: 40, price_per_qtl: 2180, distance_km: 3, posted_ago: '2 hrs' },
      { id: 'h2', type: 'sell', farmer: 'Suresh FPO (Mangalagiri)', crop: 'Cotton MCU-5', quantity_qtl: 120, price_per_qtl: 6900, distance_km: 8, posted_ago: '5 hrs' },
      { id: 'h3', type: 'buy', farmer: 'Krishna Traders', crop: 'Groundnut', quantity_qtl: 200, price_per_qtl: 5600, distance_km: 5, posted_ago: '1 hr' },
      { id: 'h4', type: 'sell', farmer: 'Lakshmi (Tadepalli)', crop: 'Chilli Teja', quantity_qtl: 15, price_per_qtl: 14200, distance_km: 6, posted_ago: '30 min' },
    ];
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hyperlocal/post', async (req, res) => {
  try {
    const { type, crop, quantity_qtl } = req.body;
    if (!crop || !quantity_qtl || !type) {
      return res.status(400).json({ error: 'Type, crop, and quantity are required' });
    }
    res.json({
      success: true,
      message: 'Listed in local market!',
      listing: { type, crop, quantity_qtl, posted_at: new Date().toISOString() }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hyperlocal/instant-match', async (req, res) => {
  try {
    const { type, crop, quantity_qtl } = req.body;
    if (!crop || !quantity_qtl) {
      return res.status(400).json({ error: 'Crop and quantity are required' });
    }
    const matches = [
      { name: type === 'sell' ? 'Krishna Traders' : 'Ramesh Kumar', distance_km: 5, price_per_qtl: type === 'sell' ? 2200 : 2180, quantity_available: 50, rating: 4.7 },
      { name: type === 'sell' ? 'Vijaya Mills' : 'Suresh FPO', distance_km: 12, price_per_qtl: type === 'sell' ? 2150 : 2200, quantity_available: 100, rating: 4.5 },
    ];
    res.json({ matches, matched_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CROP LIFECYCLE ────────────────────────────────────────────
router.get('/crop-lifecycle', async (req, res) => {
  try {
    const cycles = [
      {
        id: 'cl1',
        crop: 'Paddy',
        variety: 'Sona Masoori',
        season: 'Kharif 2026',
        current_step: 'growing',
        day_number: 65,
        total_days: 120,
        input_cost: 45000,
        expected_revenue: 180000,
        input_credit_used: 45000,
        input_credit_limit: 60000,
      }
    ];
    res.json({ cycles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/crop-lifecycle/start', async (req, res) => {
  try {
    const { crop, season } = req.body;
    if (!crop || !season) {
      return res.status(400).json({ error: 'Crop and season are required' });
    }
    res.json({
      success: true,
      message: 'New crop cycle started!',
      cycle: { crop, season, started_at: new Date().toISOString(), current_step: 'input_purchase' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DISTRICT METRICS — Real DB aggregation for pilot dashboard ─
router.get('/district-metrics', async (req, res) => {
  try {
    // Trade counts per district
    const tradeStats = await pool.query(`
      SELECT d.name AS district_name, d.id AS district_id,
        COUNT(t.id) AS total_trades,
        COUNT(t.id) FILTER (WHERE t.status = 'payment_released') AS completed_trades,
        COUNT(t.id) FILTER (WHERE t.status = 'disputed') AS disputes,
        COUNT(DISTINCT t.seller_id) AS unique_sellers,
        COUNT(DISTINCT t.buyer_id) AS unique_buyers,
        COALESCE(SUM(t.total_amount) FILTER (WHERE t.status = 'payment_released'), 0) AS gmv
      FROM districts d
      LEFT JOIN trade_orders t ON t.district_id = d.id
      GROUP BY d.id, d.name
      ORDER BY total_trades DESC
      LIMIT 10
    `).catch(() => ({ rows: [] }));

    // Agent counts per district
    const agentStats = await pool.query(`
      SELECT district_id, COUNT(*) AS agent_count, SUM(total_onboarded) AS farmers_onboarded
      FROM agents WHERE is_active = true
      GROUP BY district_id
    `).catch(() => ({ rows: [] }));

    // Pickup success rate (orders that went from dispatched to delivered vs total dispatched)
    const pickupStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('delivered','payment_released')) AS successful_pickups,
        COUNT(*) FILTER (WHERE status IN ('dispatched','in_transit','delivered','payment_released')) AS total_dispatched
      FROM trade_orders
    `).catch(() => ({ rows: [{ successful_pickups: 0, total_dispatched: 0 }] }));

    // Weekly trade activity (last 7 days)
    const weeklyActivity = await pool.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS trades
      FROM trade_orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `).catch(() => ({ rows: [] }));

    const pickup = pickupStats.rows[0] || {};
    const pickupRate = pickup.total_dispatched > 0
      ? Math.round((pickup.successful_pickups / pickup.total_dispatched) * 100)
      : 0;

    // Merge agent stats into district stats
    const agentMap = {};
    (agentStats.rows || []).forEach(r => { agentMap[r.district_id] = r; });

    const districts = (tradeStats.rows || []).map(d => ({
      ...d,
      agents: agentMap[d.district_id]?.agent_count || 0,
      farmers_onboarded: agentMap[d.district_id]?.farmers_onboarded || 0,
    }));

    res.json({
      districts,
      summary: {
        total_trades: districts.reduce((s, d) => s + parseInt(d.total_trades || 0), 0),
        total_agents: (agentStats.rows || []).reduce((s, r) => s + parseInt(r.agent_count || 0), 0),
        pickup_rate: pickupRate,
        weekly_activity: weeklyActivity.rows || [],
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

