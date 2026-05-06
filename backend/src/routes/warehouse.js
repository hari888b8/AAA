/**
 * Warehouse & Cold Storage Management Routes
 * Features:
 *   1. Warehouse Registration & Directory
 *   2. Storage Space Booking (cold/ambient/frozen)
 *   3. Warehouse Receipt System (negotiable instruments)
 *   4. Quality Grading at Warehouse Entry
 *   5. Inventory Tracking (lot-based)
 *   6. Temperature Monitoring (cold chain)
 *   7. Storage Cost Calculator & Billing
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  1. WAREHOUSE REGISTRATION & DIRECTORY
// ═══════════════════════════════════════════════════════════════════

// Register warehouse
router.post('/register', async (req, res) => {
  try {
    const {
      owner_id, name, warehouse_type, capacity_tonnes, available_tonnes,
      district, address, lat, lng, amenities, certifications,
      temperature_range, humidity_range, rate_per_tonne_day, contact_phone
    } = req.body;

    if (!owner_id || !name || !warehouse_type || !capacity_tonnes) {
      return res.status(400).json({ error: 'owner_id, name, warehouse_type, capacity_tonnes required' });
    }

    const result = await pool.query(`
      INSERT INTO warehouses (
        owner_id, name, warehouse_type, capacity_tonnes, available_tonnes,
        district, address, lat, lng, amenities, certifications,
        temperature_range, humidity_range, rate_per_tonne_day, contact_phone
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [
      owner_id, name, warehouse_type, capacity_tonnes, available_tonnes || capacity_tonnes,
      district, address, lat, lng, JSON.stringify(amenities || []),
      JSON.stringify(certifications || []), JSON.stringify(temperature_range || {}),
      JSON.stringify(humidity_range || {}), rate_per_tonne_day, contact_phone
    ]);

    res.status(201).json({ warehouse: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List warehouses (directory)
router.get('/list', async (req, res) => {
  try {
    const { district, type, available, min_capacity } = req.query;
    let query = 'SELECT * FROM warehouses WHERE is_active = true';
    const params = [];

    if (district) { params.push(district); query += ` AND district = $${params.length}`; }
    if (type) { params.push(type); query += ` AND warehouse_type = $${params.length}`; }
    if (available === 'true') { query += ' AND available_tonnes > 0'; }
    if (min_capacity) { params.push(min_capacity); query += ` AND available_tonnes >= $${params.length}`; }
    query += ' ORDER BY rating DESC, name LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ warehouses: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Warehouse detail
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. STORAGE SPACE BOOKING
// ═══════════════════════════════════════════════════════════════════

// Book storage space
router.post('/bookings', async (req, res) => {
  try {
    const {
      warehouse_id, farmer_id, crop_id, quantity_tonnes,
      storage_type, start_date, expected_end_date, notes
    } = req.body;

    if (!warehouse_id || !farmer_id || !quantity_tonnes) {
      return res.status(400).json({ error: 'warehouse_id, farmer_id, quantity_tonnes required' });
    }

    // Check availability
    const wh = await pool.query('SELECT available_tonnes, rate_per_tonne_day FROM warehouses WHERE id = $1', [warehouse_id]);
    if (!wh.rows.length) return res.status(404).json({ error: 'Warehouse not found' });
    if (wh.rows[0].available_tonnes < quantity_tonnes) {
      return res.status(400).json({ error: 'Insufficient warehouse capacity' });
    }

    const result = await pool.query(`
      INSERT INTO warehouse_bookings (
        warehouse_id, farmer_id, crop_id, quantity_tonnes,
        storage_type, start_date, expected_end_date, rate_per_tonne_day, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [
      warehouse_id, farmer_id, crop_id, quantity_tonnes,
      storage_type || 'ambient', start_date || new Date().toISOString().split('T')[0],
      expected_end_date, wh.rows[0].rate_per_tonne_day, notes
    ]);

    // Update available capacity
    await pool.query(
      'UPDATE warehouses SET available_tonnes = available_tonnes - $1, updated_at = NOW() WHERE id = $2',
      [quantity_tonnes, warehouse_id]
    );

    res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List bookings
router.get('/bookings', async (req, res) => {
  try {
    const { farmer_id, warehouse_id, status } = req.query;
    let query = 'SELECT b.*, w.name as warehouse_name FROM warehouse_bookings b JOIN warehouses w ON w.id = b.warehouse_id WHERE 1=1';
    const params = [];

    if (farmer_id) { params.push(farmer_id); query += ` AND b.farmer_id = $${params.length}`; }
    if (warehouse_id) { params.push(warehouse_id); query += ` AND b.warehouse_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND b.status = $${params.length}`; }
    query += ' ORDER BY b.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. WAREHOUSE RECEIPT SYSTEM — Negotiable instruments
// ═══════════════════════════════════════════════════════════════════

// Issue warehouse receipt
router.post('/receipts', async (req, res) => {
  try {
    const { booking_id, grade, moisture_pct, quality_params, photos } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    // Get booking details
    const booking = await pool.query('SELECT * FROM warehouse_bookings WHERE id = $1', [booking_id]);
    if (!booking.rows.length) return res.status(404).json({ error: 'Booking not found' });

    const b = booking.rows[0];
    const receiptNumber = `WHR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const result = await pool.query(`
      INSERT INTO warehouse_receipts (
        booking_id, receipt_number, warehouse_id, farmer_id, crop_id,
        quantity_tonnes, grade, moisture_pct, quality_params, photos,
        current_value, is_pledged
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false) RETURNING *
    `, [
      booking_id, receiptNumber, b.warehouse_id, b.farmer_id, b.crop_id,
      b.quantity_tonnes, grade || 'A', moisture_pct,
      JSON.stringify(quality_params || {}), JSON.stringify(photos || []),
      0 // Value computed separately based on market price
    ]);

    // Update booking status
    await pool.query('UPDATE warehouse_bookings SET status = $1, updated_at = NOW() WHERE id = $2', ['receipt_issued', booking_id]);

    res.status(201).json({ receipt: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List receipts
router.get('/receipts', async (req, res) => {
  try {
    const { farmer_id, warehouse_id, is_pledged } = req.query;
    let query = 'SELECT r.*, w.name as warehouse_name FROM warehouse_receipts r JOIN warehouses w ON w.id = r.warehouse_id WHERE 1=1';
    const params = [];

    if (farmer_id) { params.push(farmer_id); query += ` AND r.farmer_id = $${params.length}`; }
    if (warehouse_id) { params.push(warehouse_id); query += ` AND r.warehouse_id = $${params.length}`; }
    if (is_pledged !== undefined) { params.push(is_pledged === 'true'); query += ` AND r.is_pledged = $${params.length}`; }
    query += ' ORDER BY r.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ receipts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pledge receipt (for bank loan)
router.patch('/receipts/:id/pledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, loan_amount, pledge_date } = req.body;

    const result = await pool.query(`
      UPDATE warehouse_receipts SET
        is_pledged = true, pledged_to = $1, pledge_amount = $2, pledged_at = $3, updated_at = NOW()
      WHERE id = $4 RETURNING *
    `, [bank_name, loan_amount, pledge_date || new Date().toISOString(), id]);

    res.json({ receipt: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. QUALITY GRADING AT ENTRY
// ═══════════════════════════════════════════════════════════════════

// Record quality inspection
router.post('/quality/inspect', async (req, res) => {
  try {
    const {
      booking_id, inspector_name, grade, parameters,
      moisture_pct, foreign_matter_pct, damaged_pct, photos, notes
    } = req.body;

    if (!booking_id || !grade) return res.status(400).json({ error: 'booking_id, grade required' });

    const result = await pool.query(`
      INSERT INTO warehouse_quality_inspections (
        booking_id, inspector_name, grade, parameters,
        moisture_pct, foreign_matter_pct, damaged_pct, photos, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [booking_id, inspector_name, grade, JSON.stringify(parameters || {}), moisture_pct, foreign_matter_pct, damaged_pct, JSON.stringify(photos || []), notes]);

    res.status(201).json({ inspection: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. INVENTORY TRACKING (LOT-BASED)
// ═══════════════════════════════════════════════════════════════════

// Get warehouse inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.id as booking_id, b.crop_id, b.quantity_tonnes, b.storage_type,
             b.start_date, b.status, r.receipt_number, r.grade,
             qi.moisture_pct, qi.grade as inspected_grade
      FROM warehouse_bookings b
      LEFT JOIN warehouse_receipts r ON r.booking_id = b.id
      LEFT JOIN warehouse_quality_inspections qi ON qi.booking_id = b.id
      WHERE b.warehouse_id = $1 AND b.status IN ('active', 'receipt_issued')
      ORDER BY b.start_date DESC
    `, [id]);

    res.json({ inventory: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. TEMPERATURE MONITORING (COLD CHAIN)
// ═══════════════════════════════════════════════════════════════════

// Log temperature reading
router.post('/temperature/log', async (req, res) => {
  try {
    const { warehouse_id, zone_id, temperature, humidity, sensor_id } = req.body;
    if (!warehouse_id || temperature === undefined) {
      return res.status(400).json({ error: 'warehouse_id and temperature required' });
    }

    const result = await pool.query(`
      INSERT INTO warehouse_temperature_logs (warehouse_id, zone_id, temperature, humidity, sensor_id)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [warehouse_id, zone_id, temperature, humidity, sensor_id]);

    // Check thresholds
    const wh = await pool.query('SELECT temperature_range FROM warehouses WHERE id = $1', [warehouse_id]);
    if (wh.rows[0]?.temperature_range) {
      const range = wh.rows[0].temperature_range;
      if (range.min !== undefined && temperature < range.min || range.max !== undefined && temperature > range.max) {
        await pool.query(`
          INSERT INTO warehouse_alerts (warehouse_id, alert_type, severity, message, value, threshold)
          VALUES ($1, 'temperature_breach', 'critical', $2, $3, $4)
        `, [warehouse_id, `Temperature ${temperature}°C outside range ${range.min}-${range.max}°C`, temperature, JSON.stringify(range)]);
      }
    }

    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get temperature history
router.get('/:id/temperature', async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    const result = await pool.query(`
      SELECT * FROM warehouse_temperature_logs
      WHERE warehouse_id = $1 AND recorded_at > NOW() - INTERVAL '${parseInt(hours)} hours'
      ORDER BY recorded_at DESC
    `, [id]);

    res.json({ readings: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts
router.get('/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM warehouse_alerts WHERE warehouse_id = $1 ORDER BY created_at DESC LIMIT 50',
      [id]
    );
    res.json({ alerts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  7. STORAGE COST CALCULATOR & BILLING
// ═══════════════════════════════════════════════════════════════════

// Calculate storage cost
router.get('/cost/calculate', async (req, res) => {
  try {
    const { warehouse_id, quantity_tonnes, days } = req.query;
    if (!warehouse_id || !quantity_tonnes || !days) {
      return res.status(400).json({ error: 'warehouse_id, quantity_tonnes, days required' });
    }

    const wh = await pool.query('SELECT rate_per_tonne_day, name FROM warehouses WHERE id = $1', [warehouse_id]);
    if (!wh.rows.length) return res.status(404).json({ error: 'Warehouse not found' });

    const rate = parseFloat(wh.rows[0].rate_per_tonne_day);
    const qty = parseFloat(quantity_tonnes);
    const numDays = parseInt(days);
    const totalCost = rate * qty * numDays;
    const gst = totalCost * 0.18;

    res.json({
      warehouse: wh.rows[0].name,
      quantity_tonnes: qty,
      days: numDays,
      rate_per_tonne_day: rate,
      subtotal: totalCost,
      gst,
      total: totalCost + gst,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate bill
router.post('/billing/generate', async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    const booking = await pool.query(`
      SELECT b.*, w.rate_per_tonne_day, w.name as warehouse_name
      FROM warehouse_bookings b JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.id = $1
    `, [booking_id]);

    if (!booking.rows.length) return res.status(404).json({ error: 'Booking not found' });
    const b = booking.rows[0];

    const startDate = new Date(b.start_date);
    const endDate = b.actual_end_date ? new Date(b.actual_end_date) : new Date();
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const subtotal = parseFloat(b.rate_per_tonne_day) * parseFloat(b.quantity_tonnes) * days;
    const gst = subtotal * 0.18;

    const result = await pool.query(`
      INSERT INTO warehouse_bills (booking_id, warehouse_id, farmer_id, days_stored, subtotal, gst, total_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [booking_id, b.warehouse_id, b.farmer_id, days, subtotal, gst, subtotal + gst]);

    res.status(201).json({ bill: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
