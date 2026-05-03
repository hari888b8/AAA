'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ═══════════════════════════════════════════════════════════════
// VEHICLES API — KisanConnect 2.0 ROS
// Register, search, manage vehicles for farm logistics
// ═══════════════════════════════════════════════════════════════

const VALID_VEHICLE_TYPES = ['tractor', 'mini_truck', 'pickup', 'bike', 'truck', 'three_wheeler'];

// ═══ VEHICLE REGISTRATION & MANAGEMENT ════════════════════════════

// POST /api/vehicles — Register a vehicle
router.post('/', auth, async (req, res) => {
  try {
    const { vehicle_type, registration_number, capacity_kg, pricing_per_km,
            pricing_per_hour, pricing_model, location_lat, location_lng,
            location_label, documents } = req.body;

    if (!vehicle_type) {
      return res.status(400).json({ error: 'vehicle_type is required' });
    }
    if (!VALID_VEHICLE_TYPES.includes(vehicle_type)) {
      return res.status(400).json({ error: `vehicle_type must be one of: ${VALID_VEHICLE_TYPES.join(', ')}` });
    }

    const id = uuidv4();
    const result = await pool.query(`
      INSERT INTO vehicles (id, owner_id, vehicle_type, registration_number, capacity_kg,
        pricing_per_km, pricing_per_hour, pricing_model, location_lat, location_lng,
        location_label, documents)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [id, req.user.id, vehicle_type, registration_number, capacity_kg,
        pricing_per_km, pricing_per_hour, pricing_model || 'per_km',
        location_lat, location_lng, location_label, JSON.stringify(documents || {})]);

    res.status(201).json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/types/summary — Get vehicle type counts by availability
router.get('/types/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vehicle_type, availability_status, COUNT(*)::int as count
      FROM vehicles
      GROUP BY vehicle_type, availability_status
      ORDER BY vehicle_type, availability_status
    `);

    res.json({ summary: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/my — My vehicles
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ vehicles: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles — List/search vehicles
router.get('/', auth, async (req, res) => {
  try {
    const { vehicle_type, availability_status, lat, lng, radius_km = 20, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;
    let orderBy = 'rating DESC';
    let selectExtra = '';

    if (lat && lng) {
      selectExtra = `, SQRT(POW(69.1 * (location_lat - $${i}), 2) + POW(69.1 * (location_lng - $${i + 1}) * COS(location_lat / 57.3), 2)) * 1.60934 AS distance_km`;
      params.push(parseFloat(lat), parseFloat(lng));
      conditions.push(`SQRT(POW(69.1 * (location_lat - $${i}), 2) + POW(69.1 * (location_lng - $${i + 1}) * COS(location_lat / 57.3), 2)) * 1.60934 <= $${i + 2}`);
      params.push(parseFloat(radius_km));
      i += 3;
      orderBy = 'distance_km ASC';
    }

    if (vehicle_type) {
      conditions.push(`vehicle_type = $${i++}`);
      params.push(vehicle_type);
    }

    const statusFilter = availability_status || 'available';
    conditions.push(`availability_status = $${i++}`);
    params.push(statusFilter);

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM vehicles ${where}`,
      params
    );

    params.push(Math.min(parseInt(limit) || 20, 100));
    params.push(parseInt(offset) || 0);

    const result = await pool.query(`
      SELECT *${selectExtra} FROM vehicles ${where}
      ORDER BY ${orderBy} LIMIT $${i++} OFFSET $${i}
    `, params);

    res.json({ vehicles: result.rows, total: parseInt(countResult.rows[0].total) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/:id — Get vehicle details
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.name as owner_name, u.phone as owner_phone
      FROM vehicles v
      JOIN users u ON v.owner_id = u.id
      WHERE v.id = $1
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vehicles/:id — Update vehicle
router.patch('/:id', auth, async (req, res) => {
  try {
    const { availability_status, location_lat, location_lng, location_label,
            pricing_per_km, pricing_per_hour, capacity_kg } = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    if (availability_status !== undefined) { updates.push(`availability_status = $${i++}`); params.push(availability_status); }
    if (location_lat !== undefined) { updates.push(`location_lat = $${i++}`); params.push(location_lat); }
    if (location_lng !== undefined) { updates.push(`location_lng = $${i++}`); params.push(location_lng); }
    if (location_label !== undefined) { updates.push(`location_label = $${i++}`); params.push(location_label); }
    if (pricing_per_km !== undefined) { updates.push(`pricing_per_km = $${i++}`); params.push(pricing_per_km); }
    if (pricing_per_hour !== undefined) { updates.push(`pricing_per_hour = $${i++}`); params.push(pricing_per_hour); }
    if (capacity_kg !== undefined) { updates.push(`capacity_kg = $${i++}`); params.push(capacity_kg); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = NOW()');
    params.push(req.params.id, req.user.id);

    const result = await pool.query(`
      UPDATE vehicles SET ${updates.join(', ')} WHERE id = $${i} AND owner_id = $${i + 1} RETURNING *
    `, params);

    if (!result.rows.length) return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vehicles/:id/location — Quick location update
router.patch('/:id/location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const result = await pool.query(`
      UPDATE vehicles SET location_lat = $1, location_lng = $2, updated_at = NOW()
      WHERE id = $3 AND owner_id = $4 RETURNING id
    `, [lat, lng, req.params.id, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vehicles/:id — Remove vehicle
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM vehicles WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
