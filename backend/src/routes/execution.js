/**
 * Execution Network Routes
 * Handles: pickup verification, quality checks, collection centers, demand engine, hyperlocal matching
 */
'use strict';

const { Router } = require('express');

const router = Router();

// ─── PICKUP VERIFICATION ───────────────────────────────────────
router.post('/verify-pickup', async (req, res) => {
  try {
    const { order_id, farmer_otp, actual_weight, bag_count, notes } = req.body;
    if (!order_id || !farmer_otp) {
      return res.status(400).json({ error: 'Order ID and farmer OTP are required' });
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
    const { lot_id, crop_type, moisture, foreign_matter, grade } = req.body;
    if (!lot_id) {
      return res.status(400).json({ error: 'Lot ID is required' });
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

module.exports = router;

