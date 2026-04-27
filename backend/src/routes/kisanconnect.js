const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./pushnotifications');
const router = express.Router();

// GET /api/kisanconnect/equipment
router.get('/equipment', optionalAuth, async (req, res) => {
  try {
    const { type, status, district_id, search, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (type) { conditions.push(`e.equipment_type = $${i++}`); params.push(type); }
    if (status) { conditions.push(`e.status = $${i++}`); params.push(status); }
    if (district_id) { conditions.push(`e.district_id = $${i++}`); params.push(district_id); }
    if (search) { conditions.push(`e.name ILIKE $${i++}`); params.push(`%${search}%`); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT e.*, d.name AS district_name, u.name AS owner_name, u.phone AS owner_phone
      FROM equipment e
      LEFT JOIN districts d ON d.id = e.district_id
      JOIN users u ON u.id = e.owner_id
      ${whereClause}
      ORDER BY e.rating DESC, e.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    res.json({ equipment: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kisanconnect/equipment/:id/book
// POST /api/kisanconnect/equipment — create equipment listing
router.post('/equipment', authMiddleware, async (req, res) => {
  try {
    const { name, equipment_type, description, daily_rate, hourly_rate,
            operator_included, district_id, location_label } = req.body;
    if (!name || !equipment_type) return res.status(400).json({ error: 'name and equipment_type required' });

    const result = await query(`
      INSERT INTO equipment (id, owner_id, name, equipment_type, description, daily_rate, hourly_rate,
        operator_included, district_id, location_label, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'available') RETURNING *
    `, [uuidv4(), req.user.id, name, equipment_type, description,
        daily_rate || null, hourly_rate || null,
        operator_included || false, district_id || null, location_label || null]);

    res.status(201).json({ equipment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kisanconnect/equipment/:id/book
router.post('/equipment/:id/book', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, notes } = req.body;
    if (!start_date || !end_date) return res.status(400).json({ error: 'start_date and end_date required' });

    const equip = await query(`SELECT * FROM equipment WHERE id = $1`, [req.params.id]);
    if (!equip.rows.length) return res.status(404).json({ error: 'Equipment not found' });
    if (equip.rows[0].status !== 'available') return res.status(400).json({ error: 'Equipment not available' });

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000) + 1;
    const total_amount = days * equip.rows[0].daily_rate;

    await query(`UPDATE equipment SET status = 'booked', total_bookings = total_bookings + 1 WHERE id = $1`, [req.params.id]);

    const result = await query(`
      INSERT INTO equipment_bookings (id, equipment_id, renter_id, start_date, end_date, total_amount, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, start_date, end_date, total_amount, notes]);

    const booking = result.rows[0];
    const eq = equip.rows[0];
    // Notify renter (confirmation)
    await createNotification(
      req.user.id, 'booking',
      '🚜 Booking Confirmed',
      `${eq.name} booked for ${days} day(s). Total: ₹${total_amount.toLocaleString()}`,
      { booking_id: booking.id, equipment_id: eq.id }
    );
    // Notify owner
    if (eq.owner_id && eq.owner_id !== req.user.id) {
      await createNotification(
        eq.owner_id, 'booking',
        '🚜 Equipment Booking Request',
        `Your ${eq.name} has been booked for ${days} day(s). Earnings: ₹${total_amount.toLocaleString()}`,
        { booking_id: booking.id, equipment_id: eq.id }
      );
    }

    res.status(201).json({ booking, total_amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kisanconnect/jobs
router.get('/jobs', optionalAuth, async (req, res) => {
  try {
    const { type, district_id, search, limit = 20, offset = 0 } = req.query;
    let conditions = [`j.is_active = true`];
    let params = [];
    let i = 1;

    if (type) { conditions.push(`j.job_type = $${i++}`); params.push(type); }
    if (district_id) { conditions.push(`j.district_id = $${i++}`); params.push(district_id); }
    if (search) { conditions.push(`(j.title ILIKE $${i} OR j.employer_name ILIKE $${i})`); params.push(`%${search}%`); i++; }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT j.*, d.name AS district_name, d.state_name,
             EXTRACT(DAYS FROM (j.expires_at - NOW())) AS days_remaining
      FROM jobs j
      LEFT JOIN districts d ON d.id = j.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY j.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    res.json({ jobs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kisanconnect/jobs — post a job
router.post('/jobs', authMiddleware, async (req, res) => {
  try {
    const { title, employer_name, job_type, salary_min, salary_max, salary_period = 'month',
            location_label, district_id, vacancies, description, skills } = req.body;

    if (!title || !job_type) return res.status(400).json({ error: 'title and job_type required' });

    const result = await query(`
      INSERT INTO jobs (id, employer_id, title, employer_name, job_type, salary_min, salary_max,
        salary_period, location_label, district_id, vacancies, description, skills, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW() + INTERVAL '30 days') RETURNING *
    `, [uuidv4(), req.user.id, title, employer_name, job_type, salary_min, salary_max,
        salary_period, location_label, district_id, vacancies, description, skills]);

    res.status(201).json({ job: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kisanconnect/jobs/:id/apply — apply to a job
router.post('/jobs/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { experience, expected_salary, available_from, cover_note } = req.body;
    const job = await query(`SELECT * FROM jobs WHERE id = $1 AND is_active = true`, [req.params.id]);
    if (!job.rows.length) return res.status(404).json({ error: 'Job not found or expired' });

    // Check if already applied
    const existing = await query(
      `SELECT id FROM job_applications WHERE job_id = $1 AND applicant_id = $2`,
      [req.params.id, req.user.id]
    );
    if (existing.rows.length) return res.status(400).json({ error: 'Already applied to this job' });

    const result = await query(`
      INSERT INTO job_applications (id, job_id, applicant_id, experience, expected_salary, available_from, cover_note)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, experience, expected_salary, available_from, cover_note]);

    // Increment application count
    await query(`UPDATE jobs SET applications_count = COALESCE(applications_count,0) + 1 WHERE id = $1`, [req.params.id]);

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kisanconnect/stats
router.get('/stats', async (req, res) => {
  try {
    const [equip, jobs] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='available') AS available FROM equipment`),
      query(`SELECT COUNT(*) AS total, SUM(vacancies) AS total_vacancies FROM jobs WHERE is_active=true`),
    ]);
    res.json({
      stats: {
        total_equipment: equip.rows[0].total,
        available_equipment: equip.rows[0].available,
        active_jobs: jobs.rows[0].total,
        total_vacancies: jobs.rows[0].total_vacancies,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kisanconnect/bookings — user's equipment bookings
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT eb.*, e.name AS equipment_name, e.equipment_type,
             u_owner.name AS owner_name, u_renter.name AS renter_name
      FROM equipment_bookings eb
      JOIN equipment e ON e.id = eb.equipment_id
      JOIN users u_owner ON u_owner.id = e.owner_id
      JOIN users u_renter ON u_renter.id = eb.renter_id
      WHERE eb.renter_id = $1 OR e.owner_id = $1
      ORDER BY eb.created_at DESC
    `, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/kisanconnect/bookings/:id — update booking status
router.patch('/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'rejected', 'completed', 'cancelled'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const result = await query(`
      UPDATE equipment_bookings SET status = $1 WHERE id = $2 RETURNING *
    `, [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    if (status === 'completed' || status === 'cancelled') {
      await query(`UPDATE equipment SET status = 'available' WHERE id = $1`, [result.rows[0].equipment_id]);
    }
    res.json({ booking: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/kisanconnect/equipment/:id/availability — booked date ranges
router.get('/equipment/:id/availability', optionalAuth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear  = parseInt(year)  || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    const firstDay = `${targetYear}-${String(targetMonth).padStart(2,'0')}-01`;
    const lastDay  = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const result = await query(`
      SELECT start_date, end_date, status
      FROM equipment_bookings
      WHERE equipment_id = $1
        AND status IN ('confirmed', 'pending')
        AND start_date <= $2 AND end_date >= $3
      ORDER BY start_date
    `, [req.params.id, lastDay, firstDay]);

    // Build a set of booked dates
    const bookedDates = new Set();
    result.rows.forEach(b => {
      const s = new Date(b.start_date);
      const e = new Date(b.end_date);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        bookedDates.add(d.toISOString().split('T')[0]);
      }
    });

    res.json({
      equipment_id: req.params.id,
      year: targetYear,
      month: targetMonth,
      bookings: result.rows,
      booked_dates: Array.from(bookedDates),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/kisanconnect/applications — user's job applications
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT ja.*, j.title AS job_title, j.employer_name, j.job_type, j.salary_min, j.salary_max
      FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      WHERE ja.applicant_id = $1
      ORDER BY ja.created_at DESC
    `, [req.user.id]);
    res.json({ applications: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/kisanconnect/equipment/:id — edit equipment
router.patch('/equipment/:id', authMiddleware, async (req, res) => {
  try {
    const { name, daily_rate, hourly_rate, operator_included, location_label, description, status } = req.body;
    const existing = await query('SELECT * FROM equipment WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Equipment not found' });
    const result = await query(`
      UPDATE equipment SET name = COALESCE($1, name), daily_rate = COALESCE($2, daily_rate),
        hourly_rate = COALESCE($3, hourly_rate), operator_included = COALESCE($4, operator_included),
        location_label = COALESCE($5, location_label), description = COALESCE($6, description),
        status = COALESCE($7, status) WHERE id = $8 RETURNING *
    `, [name, daily_rate, hourly_rate, operator_included, location_label, description, status, req.params.id]);
    res.json({ equipment: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/kisanconnect/equipment/:id
router.delete('/equipment/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM equipment WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Equipment not found' });
    await query('DELETE FROM equipment_bookings WHERE equipment_id = $1', [req.params.id]);
    await query('DELETE FROM equipment WHERE id = $1', [req.params.id]);
    res.json({ message: 'Equipment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/kisanconnect/jobs/:id — edit/deactivate job
router.patch('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const { title, salary_min, salary_max, description, is_active, vacancies } = req.body;
    const existing = await query('SELECT * FROM jobs WHERE id = $1 AND employer_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Job not found' });
    const result = await query(`
      UPDATE jobs SET title = COALESCE($1, title), salary_min = COALESCE($2, salary_min),
        salary_max = COALESCE($3, salary_max), description = COALESCE($4, description),
        is_active = COALESCE($5, is_active), vacancies = COALESCE($6, vacancies)
      WHERE id = $7 RETURNING *
    `, [title, salary_min, salary_max, description, is_active, vacancies, req.params.id]);
    res.json({ job: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/kisanconnect/jobs/:id
router.delete('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM jobs WHERE id = $1 AND employer_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Job not found' });
    await query('DELETE FROM job_applications WHERE job_id = $1', [req.params.id]);
    await query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Crop Marketplace ──────────────────────────────────
// GET /api/kisanconnect/crops
router.get('/crops', optionalAuth, async (req, res) => {
  try {
    const { search, quality, is_organic, limit = 20, offset = 0 } = req.query;
    let conditions = [`cl.status = 'active'`];
    let params = [];
    let i = 1;
    if (search) { conditions.push(`(cl.crop_name ILIKE $${i} OR cl.variety ILIKE $${i})`); params.push(`%${search}%`); i++; }
    if (quality) { conditions.push(`cl.quality_grade = $${i++}`); params.push(quality); }
    if (is_organic === 'true') { conditions.push(`cl.is_organic = true`); }
    params.push(parseInt(limit), parseInt(offset));
    const result = await query(`
      SELECT cl.*, d.name AS district_name, u.name AS seller_name, u.phone AS seller_phone
      FROM crop_listings cl
      LEFT JOIN districts d ON d.id = cl.district_id
      JOIN users u ON u.id = cl.seller_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY cl.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);
    res.json({ crops: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/kisanconnect/crops
router.post('/crops', authMiddleware, async (req, res) => {
  try {
    const { crop_name, variety, quantity_kg, price_per_kg, quality_grade, is_organic, district_id, location_label, description } = req.body;
    if (!crop_name || !quantity_kg) return res.status(400).json({ error: 'crop_name and quantity_kg required' });
    const result = await query(`
      INSERT INTO crop_listings (id, seller_id, crop_name, variety, quantity_kg, price_per_kg, quality_grade, is_organic, district_id, location_label, description)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [uuidv4(), req.user.id, crop_name, variety, quantity_kg, price_per_kg, quality_grade || 'ungraded', is_organic || false, district_id, location_label, description]);
    res.status(201).json({ crop: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/kisanconnect/crops/:id
router.patch('/crops/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity_kg, price_per_kg, description, status } = req.body;
    const existing = await query('SELECT * FROM crop_listings WHERE id = $1 AND seller_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Crop listing not found' });
    const result = await query(`
      UPDATE crop_listings SET quantity_kg = COALESCE($1, quantity_kg), price_per_kg = COALESCE($2, price_per_kg),
        description = COALESCE($3, description), status = COALESCE($4, status)
      WHERE id = $5 RETURNING *
    `, [quantity_kg, price_per_kg, description, status, req.params.id]);
    res.json({ crop: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/kisanconnect/crops/:id
router.delete('/crops/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM crop_listings WHERE id = $1 AND seller_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Crop listing not found' });
    await query('DELETE FROM crop_listings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Crop listing deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Rural Services ────────────────────────────────────
// GET /api/kisanconnect/services
router.get('/services', async (req, res) => {
  try {
    const { type, district_id } = req.query;
    let conditions = ['sl.is_active = true'];
    let params = [];
    let i = 1;
    if (type) { conditions.push(`sl.service_type = $${i++}`); params.push(type); }
    if (district_id) { conditions.push(`sl.district_id = $${i++}`); params.push(district_id); }
    const result = await query(`
      SELECT sl.*, d.name AS district_name, u.name AS provider_name
      FROM service_listings sl
      LEFT JOIN districts d ON d.id = sl.district_id
      JOIN users u ON u.id = sl.provider_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sl.rating DESC, sl.total_bookings DESC
    `, params);
    res.json({ services: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/kisanconnect/services
router.post('/services', authMiddleware, async (req, res) => {
  try {
    const { service_type, title, description, price, price_unit, district_id, location_label } = req.body;
    if (!service_type || !title) return res.status(400).json({ error: 'service_type and title required' });
    const result = await query(`
      INSERT INTO service_listings (id, provider_id, service_type, title, description, price, price_unit, district_id, location_label)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [uuidv4(), req.user.id, service_type, title, description, price, price_unit || 'per_visit', district_id, location_label]);
    res.status(201).json({ service: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/kisanconnect/services/:id/request
router.post('/services/:id/request', authMiddleware, async (req, res) => {
  try {
    const { preferred_date, notes } = req.body;
    const svc = await query('SELECT * FROM service_listings WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!svc.rows.length) return res.status(404).json({ error: 'Service not found' });
    const result = await query(`
      INSERT INTO service_requests (id, service_id, requester_id, preferred_date, notes)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [uuidv4(), req.params.id, req.user.id, preferred_date, notes]);
    await query('UPDATE service_listings SET total_bookings = total_bookings + 1 WHERE id = $1', [req.params.id]);
    res.status(201).json({ request: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Reviews ───────────────────────────────────────────
// POST /api/kisanconnect/reviews
router.post('/reviews', authMiddleware, async (req, res) => {
  try {
    const { target_type, target_id, rating, comment } = req.body;
    if (!target_type || !target_id || !rating) return res.status(400).json({ error: 'target_type, target_id, rating required' });
    const result = await query(`
      INSERT INTO reviews (id, reviewer_id, target_type, target_id, rating, comment)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.user.id, target_type, target_id, rating, comment]);
    // Update target rating
    if (target_type === 'equipment') {
      const avg = await query('SELECT AVG(rating) AS avg_rating FROM reviews WHERE target_type = $1 AND target_id = $2', [target_type, target_id]);
      await query('UPDATE equipment SET rating = $1 WHERE id = $2', [avg.rows[0].avg_rating, target_id]);
    }
    res.status(201).json({ review: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/kisanconnect/reviews/:targetType/:targetId
router.get('/reviews/:targetType/:targetId', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, u.name AS reviewer_name FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.target_type = $1 AND r.target_id = $2
      ORDER BY r.created_at DESC
    `, [req.params.targetType, req.params.targetId]);
    res.json({ reviews: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
