'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const VALID_WORKER_TYPES = [
  'tractor_operator', 'harvester_operator', 'sprayer', 'plumber',
  'electrician', 'farm_labor', 'driver', 'mechanic'
];

// POST /api/gigworkers/register — Register as gig worker
router.post('/register', auth, async (req, res) => {
  try {
    const {
      worker_type, skills, hourly_rate, daily_rate, experience_years,
      current_lat, current_lng, location_label, availability_schedule, documents
    } = req.body;

    if (!VALID_WORKER_TYPES.includes(worker_type)) {
      return res.status(400).json({ error: `Invalid worker_type. Must be one of: ${VALID_WORKER_TYPES.join(', ')}` });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO gig_workers (id, user_id, worker_type, skills, hourly_rate, daily_rate,
        experience_years, current_lat, current_lng, location_label, availability_schedule, documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [id, req.user.id, worker_type, JSON.stringify(skills), hourly_rate, daily_rate,
        experience_years, current_lat, current_lng, location_label,
        JSON.stringify(availability_schedule), JSON.stringify(documents)]
    );

    return res.status(201).json({ worker: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/gigworkers — Search/list available workers
router.get('/', auth, async (req, res) => {
  try {
    const {
      worker_type, lat, lng, radius_km = 15,
      min_rating, limit = 20, offset = 0
    } = req.query;

    const params = [];
    const conditions = ['gw.is_available = true'];
    let distanceExpr = null;

    if (lat && lng) {
      params.push(parseFloat(lat), parseFloat(lng));
      distanceExpr = `SQRT(POW(69.1 * (gw.current_lat - $1), 2) + POW(69.1 * (gw.current_lng - $2) * COS(gw.current_lat / 57.3), 2)) * 1.60934`;
      conditions.push(`${distanceExpr} <= $${params.length + 1}`);
      params.push(parseFloat(radius_km));
    }

    if (worker_type) {
      params.push(worker_type);
      conditions.push(`gw.worker_type = $${params.length}`);
    }

    if (min_rating) {
      params.push(parseFloat(min_rating));
      conditions.push(`gw.rating >= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = distanceExpr ? `ORDER BY ${distanceExpr} ASC` : 'ORDER BY gw.rating DESC';

    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(parseInt(offset));
    const offsetIdx = params.length;

    const selectDistance = distanceExpr ? `, ${distanceExpr} AS distance_km` : '';

    const query = `
      SELECT gw.*, u.name AS user_name, u.phone AS user_phone${selectDistance}
      FROM gig_workers gw
      JOIN users u ON u.id = gw.user_id
      ${whereClause}
      ${orderClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM gig_workers gw
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, params.length - 2))
    ]);

    return res.json({ workers: dataResult.rows, total: parseInt(countResult.rows[0].total) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/gigworkers/profile — Get my gig worker profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gig_workers WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gig worker profile not found' });
    }

    return res.json({ worker: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gigworkers/profile — Update my profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const allowedFields = [
      'is_available', 'current_lat', 'current_lng', 'location_label',
      'hourly_rate', 'daily_rate', 'skills', 'availability_schedule'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        values.push(
          (field === 'skills' || field === 'availability_schedule')
            ? JSON.stringify(req.body[field])
            : req.body[field]
        );
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE gig_workers SET ${updates.join(', ')}, updated_at = NOW()
       WHERE user_id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gig worker profile not found' });
    }

    return res.json({ worker: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gigworkers/location — Quick location update
router.patch('/location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    await pool.query(
      'UPDATE gig_workers SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE user_id = $3',
      [lat, lng, req.user.id]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/gigworkers/book — Book a gig worker
router.post('/book', auth, async (req, res) => {
  try {
    const { worker_id, booking_type, task_description, scheduled_start, scheduled_end, agreed_rate } = req.body;

    if (!['hourly', 'daily', 'task'].includes(booking_type)) {
      return res.status(400).json({ error: 'Invalid booking_type. Must be hourly, daily, or task' });
    }

    let total_amount = 0;
    if (booking_type === 'task') {
      total_amount = agreed_rate;
    } else if (booking_type === 'hourly') {
      const hours = (new Date(scheduled_end) - new Date(scheduled_start)) / (1000 * 60 * 60);
      total_amount = hours * agreed_rate;
    } else if (booking_type === 'daily') {
      const days = (new Date(scheduled_end) - new Date(scheduled_start)) / (1000 * 60 * 60 * 24);
      total_amount = Math.ceil(days) * agreed_rate;
    }

    const platform_commission = total_amount * 0.10;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO gig_bookings (id, worker_id, customer_id, booking_type, task_description,
        scheduled_start, scheduled_end, agreed_rate, total_amount, platform_commission, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'requested')
       RETURNING *`,
      [id, worker_id, req.user.id, booking_type, task_description,
        scheduled_start, scheduled_end, agreed_rate, total_amount, platform_commission]
    );

    return res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/gigworkers/bookings — My bookings (as worker or customer)
router.get('/bookings', auth, async (req, res) => {
  try {
    const { role, status, limit = 20 } = req.query;

    const params = [];
    const conditions = [];

    if (role === 'worker') {
      params.push(req.user.id);
      conditions.push(`gw.user_id = $${params.length}`);
    } else {
      params.push(req.user.id);
      conditions.push(`gb.customer_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`gb.status = $${params.length}`);
    }

    params.push(parseInt(limit));
    const limitIdx = params.length;

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT gb.*, u_customer.name AS customer_name, u_worker.name AS worker_name, gw.worker_type
       FROM gig_bookings gb
       JOIN gig_workers gw ON gw.id = gb.worker_id
       JOIN users u_customer ON u_customer.id = gb.customer_id
       JOIN users u_worker ON u_worker.id = gw.user_id
       ${whereClause}
       ORDER BY gb.created_at DESC
       LIMIT $${limitIdx}`,
      params
    );

    return res.json({ bookings: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gigworkers/bookings/:id/accept — Worker accepts booking
router.patch('/bookings/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await pool.query(
      `SELECT gb.* FROM gig_bookings gb
       JOIN gig_workers gw ON gw.id = gb.worker_id
       WHERE gb.id = $1 AND gw.user_id = $2`,
      [id, req.user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized or booking not found' });
    }

    const result = await pool.query(
      `UPDATE gig_bookings SET status = 'accepted', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    await pool.query(
      `UPDATE gig_workers SET is_available = false, updated_at = NOW()
       WHERE id = $1`,
      [booking.rows[0].worker_id]
    );

    return res.json({ booking: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gigworkers/bookings/:id/start — Start work
router.patch('/bookings/:id/start', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE gig_bookings SET status = 'in_progress', actual_start = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ booking: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/gigworkers/bookings/:id/complete — Complete work
router.patch('/bookings/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE gig_bookings SET status = 'completed', actual_end = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await pool.query(
      `UPDATE gig_workers SET is_available = true, total_jobs = total_jobs + 1, updated_at = NOW()
       WHERE id = $1`,
      [result.rows[0].worker_id]
    );

    return res.json({ booking: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/gigworkers/bookings/:id/rate — Rate after completion
router.post('/bookings/:id/rate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text, role } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!['customer', 'worker'].includes(role)) {
      return res.status(400).json({ error: 'Role must be customer or worker' });
    }

    const ratingField = role === 'customer' ? 'rating_by_customer' : 'rating_by_worker';
    const reviewField = role === 'customer' ? 'review_by_customer' : 'review_by_worker';

    const result = await pool.query(
      `UPDATE gig_bookings SET ${ratingField} = $1, ${reviewField} = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [rating, review_text, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (role === 'customer') {
      const workerId = result.rows[0].worker_id;
      await pool.query(
        `UPDATE gig_workers SET rating = (
          SELECT COALESCE(AVG(rating_by_customer), 0)
          FROM gig_bookings WHERE worker_id = $1 AND rating_by_customer IS NOT NULL
        ), updated_at = NOW() WHERE id = $1`,
        [workerId]
      );
    }

    return res.json({ booking: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/gigworkers/types/summary — Worker type counts
router.get('/types/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT worker_type, COUNT(*) AS total, COUNT(*) FILTER (WHERE is_available = true) AS available
       FROM gig_workers GROUP BY worker_type ORDER BY worker_type`
    );

    return res.json({ summary: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
