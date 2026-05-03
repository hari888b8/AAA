'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { findNearbyDrivers, matchLogisticsRequest, acceptMatch, completeTrip } = require('../services/matching');

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateCost(distanceKm, weightKg) {
  return 100 + (distanceKm * 15) + (weightKg * 2);
}

// POST /api/transport/request — Create transport request
router.post('/request', auth, async (req, res) => {
  try {
    const {
      pickup_lat, pickup_lng, pickup_location,
      drop_lat, drop_lng, drop_location,
      load_type, weight_kg, vehicle_type_needed,
      urgency, scheduled_at, notes
    } = req.body;

    const validLoadTypes = ['grain', 'fertilizer', 'equipment', 'produce', 'general'];
    if (!validLoadTypes.includes(load_type)) {
      return res.status(400).json({ error: 'Invalid load_type. Must be one of: grain, fertilizer, equipment, produce, general' });
    }

    const validUrgency = ['immediate', 'scheduled', 'flexible'];
    if (!validUrgency.includes(urgency)) {
      return res.status(400).json({ error: 'Invalid urgency. Must be one of: immediate, scheduled, flexible' });
    }

    const estimated_distance_km = haversineDistance(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const estimated_cost = calculateCost(estimated_distance_km, weight_kg || 0);

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO logistics_requests 
       (id, user_id, pickup_lat, pickup_lng, pickup_location, drop_lat, drop_lng, drop_location,
        load_type, weight_kg, vehicle_type_needed, urgency, scheduled_at, notes,
        estimated_distance_km, estimated_cost, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending',NOW(),NOW())
       RETURNING *`,
      [id, req.user.id, pickup_lat, pickup_lng, pickup_location, drop_lat, drop_lng, drop_location,
       load_type, weight_kg, vehicle_type_needed, urgency, scheduled_at || null, notes || null,
       estimated_distance_km, estimated_cost]
    );

    const request = result.rows[0];
    let matches = null;

    if (urgency === 'immediate') {
      matches = await matchLogisticsRequest(id);
    }

    return res.status(201).json({ request, matches });
  } catch (err) {
    console.error('Error creating transport request:', err);
    return res.status(500).json({ error: 'Failed to create transport request' });
  }
});

// GET /api/transport/requests — My transport requests
router.get('/requests', auth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    let query = 'SELECT * FROM logistics_requests WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return res.json({ requests: result.rows });
  } catch (err) {
    console.error('Error fetching transport requests:', err);
    return res.status(500).json({ error: 'Failed to fetch transport requests' });
  }
});

// GET /api/transport/requests/:id — Get request details with matches
router.get('/requests/:id', auth, async (req, res) => {
  try {
    const requestResult = await pool.query(
      'SELECT * FROM logistics_requests WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transport request not found' });
    }

    const matchesResult = await pool.query(
      `SELECT lm.*, v.vehicle_type, v.license_plate, u.name as driver_name, u.phone as driver_phone
       FROM logistics_matches lm
       LEFT JOIN vehicles v ON lm.vehicle_id = v.id
       LEFT JOIN users u ON lm.driver_id = u.id
       WHERE lm.request_id = $1
       ORDER BY lm.score DESC`,
      [req.params.id]
    );

    return res.json({ request: requestResult.rows[0], matches: matchesResult.rows });
  } catch (err) {
    console.error('Error fetching transport request details:', err);
    return res.status(500).json({ error: 'Failed to fetch transport request details' });
  }
});

// POST /api/transport/requests/:id/match — Trigger matching for a request
router.post('/requests/:id/match', auth, async (req, res) => {
  try {
    const matches = await matchLogisticsRequest(req.params.id);
    return res.json({ matches });
  } catch (err) {
    console.error('Error triggering match:', err);
    return res.status(500).json({ error: 'Failed to trigger matching' });
  }
});

// POST /api/transport/matches/:id/accept — Driver accepts a match
router.post('/matches/:id/accept', auth, async (req, res) => {
  try {
    const matchResult = await pool.query(
      'SELECT * FROM logistics_matches WHERE id = $1',
      [req.params.id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const matchRow = matchResult.rows[0];
    if (matchRow.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the assigned driver can accept this match' });
    }

    const result = await acceptMatch(req.params.id, req.user.id);

    const requestResult = await pool.query(
      'SELECT * FROM logistics_requests WHERE id = $1',
      [matchRow.request_id]
    );

    return res.json({ match: result, request: requestResult.rows[0] });
  } catch (err) {
    console.error('Error accepting match:', err);
    return res.status(500).json({ error: 'Failed to accept match' });
  }
});

// POST /api/transport/matches/:id/reject — Driver rejects a match
router.post('/matches/:id/reject', auth, async (req, res) => {
  try {
    const matchResult = await pool.query(
      'SELECT * FROM logistics_matches WHERE id = $1 AND driver_id = $2',
      [req.params.id, req.user.id]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await pool.query(
      "UPDATE logistics_matches SET status = 'rejected', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error rejecting match:', err);
    return res.status(500).json({ error: 'Failed to reject match' });
  }
});

// POST /api/transport/requests/:id/start — Start trip (driver)
router.post('/requests/:id/start', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE logistics_requests SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'matched'
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not in matched status' });
    }

    return res.json({ request: result.rows[0] });
  } catch (err) {
    console.error('Error starting trip:', err);
    return res.status(500).json({ error: 'Failed to start trip' });
  }
});

// POST /api/transport/requests/:id/complete — Complete trip
router.post('/requests/:id/complete', auth, async (req, res) => {
  try {
    const result = await completeTrip(req.params.id);

    const requestResult = await pool.query(
      'SELECT * FROM logistics_requests WHERE id = $1',
      [req.params.id]
    );

    return res.json({ request: requestResult.rows[0] });
  } catch (err) {
    console.error('Error completing trip:', err);
    return res.status(500).json({ error: 'Failed to complete trip' });
  }
});

// POST /api/transport/requests/:id/cancel — Cancel request
router.post('/requests/:id/cancel', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE logistics_requests SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'matching')
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Request not found or cannot be cancelled' });
    }

    await pool.query(
      `UPDATE logistics_matches SET status = 'expired', updated_at = NOW()
       WHERE request_id = $1 AND status = 'pending'`,
      [req.params.id]
    );

    return res.json({ request: result.rows[0] });
  } catch (err) {
    console.error('Error cancelling request:', err);
    return res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// POST /api/transport/track — Submit live location
router.post('/track', auth, async (req, res) => {
  try {
    const { lat, lng, speed_kmh, heading, accuracy_m, battery_percent, request_id, order_id } = req.body;

    const vehicleResult = await pool.query(
      'SELECT id FROM vehicles WHERE owner_id = $1 LIMIT 1',
      [req.user.id]
    );
    const vehicle_id = vehicleResult.rows.length > 0 ? vehicleResult.rows[0].id : null;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO tracking_logs
       (id, driver_id, vehicle_id, lat, lng, speed_kmh, heading, accuracy_m, battery_percent, request_id, order_id, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
      [id, req.user.id, vehicle_id, lat, lng, speed_kmh || null, heading || null,
       accuracy_m || null, battery_percent || null, request_id || null, order_id || null]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error submitting tracking:', err);
    return res.status(500).json({ error: 'Failed to submit tracking data' });
  }
});

// GET /api/transport/track/:requestId — Get live tracking for a request
router.get('/track/:requestId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tracking_logs WHERE request_id = $1
       ORDER BY timestamp DESC LIMIT 50`,
      [req.params.requestId]
    );

    const tracking = result.rows;
    const last_location = tracking.length > 0 ? tracking[0] : null;

    return res.json({ tracking, last_location });
  } catch (err) {
    console.error('Error fetching tracking:', err);
    return res.status(500).json({ error: 'Failed to fetch tracking data' });
  }
});

// GET /api/transport/estimate — Get price estimate
router.get('/estimate', auth, async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, weight_kg, vehicle_type } = req.query;

    const distance_km = haversineDistance(
      parseFloat(pickup_lat), parseFloat(pickup_lng),
      parseFloat(drop_lat), parseFloat(drop_lng)
    );

    const weight = parseFloat(weight_kg) || 0;
    const estimated_cost = calculateCost(distance_km, weight);
    const estimated_time_minutes = Math.round((distance_km / 40) * 60);

    const driversResult = await findNearbyDrivers(
      parseFloat(pickup_lat), parseFloat(pickup_lng), 25, vehicle_type || null
    );
    const available_drivers_count = driversResult ? driversResult.length : 0;

    return res.json({ distance_km, estimated_cost, estimated_time_minutes, available_drivers_count });
  } catch (err) {
    console.error('Error calculating estimate:', err);
    return res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

module.exports = router;
