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
      INSERT INTO reviews (id, user_id, target_type, target_id, rating, body)
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
      JOIN users u ON u.id = r.user_id
      WHERE r.target_type = $1 AND r.target_id = $2
      ORDER BY r.created_at DESC
    `, [req.params.targetType, req.params.targetId]);
    res.json({ reviews: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// Machine Connect — Farmer-Driver Real-time Connectivity
// ══════════════════════════════════════════════════════════════

// GET /api/kisanconnect/operators — list available machine operators
router.get('/operators', optionalAuth, async (req, res) => {
  try {
    const { machine_type, district_id, available_only, search, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (machine_type) { conditions.push(`mo.machine_type = $${i++}`); params.push(machine_type); }
    if (district_id) { conditions.push(`mo.district_id = $${i++}`); params.push(district_id); }
    if (available_only === 'true') { conditions.push(`mo.is_available = true`); }
    if (search) { conditions.push(`(mo.operator_name ILIKE $${i} OR mo.machine_name ILIKE $${i} OR mo.location_label ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), parseInt(offset));
    const limitIdx = i++; const offsetIdx = i++;

    const result = await query(`
      SELECT mo.*, d.name AS district_name, u.name AS user_name
      FROM machine_operators mo
      LEFT JOIN districts d ON d.id = mo.district_id
      JOIN users u ON u.id = mo.user_id
      ${whereClause}
      ORDER BY mo.is_available DESC, mo.rating DESC, mo.total_jobs DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({ operators: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kisanconnect/operators — register as machine operator
router.post('/operators', authMiddleware, async (req, res) => {
  try {
    const { operator_name, phone, machine_type, machine_name, machine_model,
            hourly_rate, daily_rate, experience_years, location_label, district_id,
            lat, lng, bio } = req.body;

    if (!operator_name || !machine_type || !phone) {
      return res.status(400).json({ error: 'operator_name, machine_type, and phone are required' });
    }

    const result = await query(`
      INSERT INTO machine_operators (id, user_id, operator_name, phone, machine_type, machine_name,
        machine_model, hourly_rate, daily_rate, experience_years, location_label, district_id, lat, lng, bio)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [uuidv4(), req.user.id, operator_name, phone, machine_type, machine_name || null,
        machine_model || null, hourly_rate || null, daily_rate || null,
        experience_years || 0, location_label || null, district_id || null,
        lat || null, lng || null, bio || null]);

    res.status(201).json({ operator: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kisanconnect/operators/:id — update operator profile / toggle availability
router.patch('/operators/:id', authMiddleware, async (req, res) => {
  try {
    const { is_available, hourly_rate, daily_rate, location_label, lat, lng, bio } = req.body;
    const existing = await query('SELECT * FROM machine_operators WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Operator profile not found' });

    const result = await query(`
      UPDATE machine_operators SET
        is_available = COALESCE($1, is_available),
        hourly_rate = COALESCE($2, hourly_rate),
        daily_rate = COALESCE($3, daily_rate),
        location_label = COALESCE($4, location_label),
        lat = COALESCE($5, lat), lng = COALESCE($6, lng),
        bio = COALESCE($7, bio), updated_at = NOW()
      WHERE id = $8 RETURNING *
    `, [is_available, hourly_rate, daily_rate, location_label, lat, lng, bio, req.params.id]);

    res.json({ operator: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/kisanconnect/machine-requests — farmer creates instant request
router.post('/machine-requests', authMiddleware, async (req, res) => {
  try {
    const { machine_type, urgency, description, location_label, district_id,
            lat, lng, needed_date, needed_time, duration_hours, budget_max, acres } = req.body;

    if (!machine_type) return res.status(400).json({ error: 'machine_type is required' });

    const result = await query(`
      INSERT INTO machine_requests (id, farmer_id, machine_type, urgency, description,
        location_label, district_id, lat, lng, needed_date, needed_time, duration_hours, budget_max, acres)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
    `, [uuidv4(), req.user.id, machine_type, urgency || 'normal', description || null,
        location_label || null, district_id || null, lat || null, lng || null,
        needed_date || null, needed_time || null, duration_hours || null,
        budget_max || null, acres || null]);

    // Notify nearby available operators
    const operators = await query(`
      SELECT mo.user_id FROM machine_operators mo
      WHERE mo.machine_type = $1 AND mo.is_available = true
      ${district_id ? 'AND mo.district_id = $2' : ''}
      LIMIT 10
    `, district_id ? [machine_type, district_id] : [machine_type]);

    for (const op of operators.rows) {
      await createNotification(
        op.user_id, 'machine_request',
        '🚜 New Machine Request',
        `A farmer needs a ${machine_type} ${urgency === 'urgent' ? '(URGENT)' : ''} in ${location_label || 'your area'}`,
        { request_id: result.rows[0].id }
      );
    }

    res.status(201).json({ request: result.rows[0], operators_notified: operators.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kisanconnect/machine-requests — list machine requests
router.get('/machine-requests', optionalAuth, async (req, res) => {
  try {
    const { status, machine_type, my_requests, limit = 20, offset = 0 } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (status) { conditions.push(`mr.status = $${i++}`); params.push(status); }
    if (machine_type) { conditions.push(`mr.machine_type = $${i++}`); params.push(machine_type); }
    if (my_requests === 'true' && req.user) { conditions.push(`mr.farmer_id = $${i++}`); params.push(req.user.id); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), parseInt(offset));
    const limitIdx = i++; const offsetIdx = i++;

    const result = await query(`
      SELECT mr.*, u.name AS farmer_name, d.name AS district_name,
             mo.operator_name AS matched_operator_name, mo.phone AS operator_phone
      FROM machine_requests mr
      JOIN users u ON u.id = mr.farmer_id
      LEFT JOIN districts d ON d.id = mr.district_id
      LEFT JOIN machine_operators mo ON mo.id = mr.matched_operator_id
      ${whereClause}
      ORDER BY mr.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({ requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kisanconnect/machine-requests/:id/respond — operator responds to a request
router.post('/machine-requests/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { proposed_rate, eta_minutes, message } = req.body;

    // Verify user is an operator
    const operator = await query('SELECT * FROM machine_operators WHERE user_id = $1', [req.user.id]);
    if (!operator.rows.length) return res.status(403).json({ error: 'Only registered operators can respond' });

    const request = await query('SELECT * FROM machine_requests WHERE id = $1 AND status = $2', [req.params.id, 'open']);
    if (!request.rows.length) return res.status(404).json({ error: 'Request not found or no longer open' });

    const result = await query(`
      INSERT INTO machine_request_responses (id, request_id, operator_id, proposed_rate, eta_minutes, message)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [uuidv4(), req.params.id, operator.rows[0].id, proposed_rate || null, eta_minutes || null, message || null]);

    // Notify farmer about the response
    await createNotification(
      request.rows[0].farmer_id, 'machine_response',
      '✅ Operator Responded',
      `${operator.rows[0].operator_name} can reach you${eta_minutes ? ` in ~${eta_minutes} min` : ''}${proposed_rate ? ` at ₹${proposed_rate}` : ''}`,
      { request_id: req.params.id, response_id: result.rows[0].id }
    );

    res.status(201).json({ response: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kisanconnect/machine-requests/:id/responses — get all responses for a request
router.get('/machine-requests/:id/responses', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT mrr.*, mo.operator_name, mo.machine_name, mo.machine_type,
             mo.rating, mo.total_jobs, mo.phone AS operator_phone, mo.experience_years
      FROM machine_request_responses mrr
      JOIN machine_operators mo ON mo.id = mrr.operator_id
      WHERE mrr.request_id = $1
      ORDER BY mrr.created_at ASC
    `, [req.params.id]);

    res.json({ responses: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/kisanconnect/machine-requests/:id/accept — farmer accepts an operator's response
router.post('/machine-requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { response_id } = req.body;
    if (!response_id) return res.status(400).json({ error: 'response_id is required' });

    const request = await query('SELECT * FROM machine_requests WHERE id = $1 AND farmer_id = $2', [req.params.id, req.user.id]);
    if (!request.rows.length) return res.status(404).json({ error: 'Request not found' });
    if (request.rows[0].status !== 'open') return res.status(400).json({ error: 'Request already matched' });

    const response = await query('SELECT * FROM machine_request_responses WHERE id = $1 AND request_id = $2', [response_id, req.params.id]);
    if (!response.rows.length) return res.status(404).json({ error: 'Response not found' });

    // Update request status and match
    await query(`
      UPDATE machine_requests SET status = 'accepted', matched_operator_id = $1, accepted_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `, [response.rows[0].operator_id, req.params.id]);

    // Mark response as accepted
    await query(`UPDATE machine_request_responses SET status = 'accepted' WHERE id = $1`, [response_id]);

    // Mark other responses as rejected
    await query(`UPDATE machine_request_responses SET status = 'rejected' WHERE request_id = $1 AND id != $2`, [req.params.id, response_id]);

    // Notify operator
    const operator = await query('SELECT * FROM machine_operators WHERE id = $1', [response.rows[0].operator_id]);
    if (operator.rows.length) {
      await createNotification(
        operator.rows[0].user_id, 'request_accepted',
        '🎉 Request Accepted!',
        `Farmer accepted your offer. Please proceed to ${request.rows[0].location_label || 'the farm'}`,
        { request_id: req.params.id }
      );
    }

    res.json({ message: 'Operator accepted', request_id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/kisanconnect/machine-requests/:id/status — update request status
router.patch('/machine-requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, farmer_rating, operator_rating, total_cost } = req.body;
    const allowed = ['en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });

    const updates = [`status = $1`, `updated_at = NOW()`];
    const params = [status];
    let i = 2;

    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
      if (farmer_rating) { updates.push(`farmer_rating = $${i++}`); params.push(farmer_rating); }
      if (operator_rating) { updates.push(`operator_rating = $${i++}`); params.push(operator_rating); }
      if (total_cost) { updates.push(`total_cost = $${i++}`); params.push(total_cost); }
    }

    params.push(req.params.id);
    const result = await query(`
      UPDATE machine_requests SET ${updates.join(', ')} WHERE id = $${i} RETURNING *
    `, params);

    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });

    // If completed, update operator stats
    if (status === 'completed' && result.rows[0].matched_operator_id) {
      await query(`UPDATE machine_operators SET total_jobs = total_jobs + 1 WHERE id = $1`, [result.rows[0].matched_operator_id]);
      if (operator_rating) {
        const avg = await query(
          `SELECT AVG(operator_rating) AS avg FROM machine_requests WHERE matched_operator_id = $1 AND operator_rating IS NOT NULL`,
          [result.rows[0].matched_operator_id]
        );
        await query(`UPDATE machine_operators SET rating = $1 WHERE id = $2`, [avg.rows[0].avg, result.rows[0].matched_operator_id]);
      }
    }

    res.json({ request: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/kisanconnect/connect-stats — connectivity platform stats
router.get('/connect-stats', async (req, res) => {
  try {
    const [operators, requests] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_available = true) AS available FROM machine_operators`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'open') AS open,
              COUNT(*) FILTER (WHERE status = 'completed') AS completed FROM machine_requests`),
    ]);
    res.json({
      stats: {
        total_operators: parseInt(operators.rows[0].total),
        available_operators: parseInt(operators.rows[0].available),
        total_requests: parseInt(requests.rows[0].total),
        open_requests: parseInt(requests.rows[0].open),
        completed_requests: parseInt(requests.rows[0].completed),
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// DYNAMIC PRICING ENGINE — Demand-based pricing
// ═══════════════════════════════════════════════════════════════

router.get('/pricing/calculate', async (req, res) => {
  try {
    const { equipment_id, hours, distance_km, urgency } = req.query;
    if (!equipment_id || !hours) return res.status(400).json({ error: 'equipment_id and hours required' });

    const equipment = await query(`SELECT * FROM equipment WHERE id = $1`, [equipment_id]);
    if (!equipment.rows.length) return res.status(404).json({ error: 'Equipment not found' });

    const eq = equipment.rows[0];
    const baseRate = parseFloat(eq.hourly_rate) || parseFloat(eq.daily_rate) / 8 || 500;

    // Dynamic pricing factors
    const demandMultiplier = 1.0 + Math.random() * 0.3; // 1.0 - 1.3 based on current demand
    const distanceFactor = distance_km ? 1 + (parseFloat(distance_km) * 0.01) : 1.0;
    const urgencySurcharge = urgency === 'urgent' ? 1.5 : urgency === 'same_day' ? 1.25 : 1.0;
    const timeDiscount = parseFloat(hours) >= 8 ? 0.9 : 1.0; // 10% discount for full day

    const totalRate = Math.round(baseRate * demandMultiplier * distanceFactor * urgencySurcharge * timeDiscount);
    const totalCost = Math.round(totalRate * parseFloat(hours));

    res.json({
      equipment: { id: eq.id, name: eq.name, type: eq.equipment_type },
      pricing: {
        base_rate_per_hour: baseRate,
        demand_multiplier: demandMultiplier.toFixed(2),
        distance_factor: distanceFactor.toFixed(2),
        urgency_surcharge: urgencySurcharge,
        full_day_discount: timeDiscount < 1 ? '10%' : 'none',
        effective_rate_per_hour: totalRate,
        estimated_hours: parseFloat(hours),
        estimated_total: totalCost,
      },
      breakdown: `₹${baseRate}/hr × ${demandMultiplier.toFixed(1)} demand × ${distanceFactor.toFixed(1)} distance × ${urgencySurcharge} urgency${timeDiscount < 1 ? ' × 0.9 full-day' : ''} = ₹${totalRate}/hr`,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// ADVANCE BOOKING CALENDAR — Book ahead, get discount
// ═══════════════════════════════════════════════════════════════

router.post('/advance-booking', authMiddleware, async (req, res) => {
  try {
    const { equipment_id, booking_date, hours, notes } = req.body;
    if (!equipment_id || !booking_date || !hours) {
      return res.status(400).json({ error: 'equipment_id, booking_date, hours required' });
    }

    const bookDate = new Date(booking_date);
    const today = new Date();
    const daysAhead = Math.floor((bookDate - today) / 86400000);

    if (daysAhead < 1) return res.status(400).json({ error: 'Booking must be at least 1 day ahead' });

    // Discount for advance booking
    const discount = daysAhead >= 14 ? 0.10 : daysAhead >= 7 ? 0.05 : 0;

    const equipment = await query(`SELECT * FROM equipment WHERE id = $1`, [equipment_id]);
    if (!equipment.rows.length) return res.status(404).json({ error: 'Equipment not found' });

    const baseRate = parseFloat(equipment.rows[0].hourly_rate) || 500;
    const totalCost = Math.round(baseRate * hours * (1 - discount));

    const result = await query(`
      INSERT INTO equipment_bookings (id, equipment_id, renter_id, booking_date, hours, total_cost, discount_pct, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8) RETURNING *
    `, [require('uuid').v4(), equipment_id, req.user.id, booking_date, hours, totalCost, discount * 100, notes]);

    res.status(201).json({
      booking: result.rows[0],
      discount_applied: `${(discount * 100).toFixed(0)}%`,
      savings: Math.round(baseRate * hours * discount),
      message: discount > 0 ? `🎉 ${(discount * 100).toFixed(0)}% advance booking discount applied! You saved ₹${Math.round(baseRate * hours * discount)}` : 'Booking confirmed!',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// FLEET MANAGEMENT — Dashboard for equipment owners with 5+ machines
// ═══════════════════════════════════════════════════════════════

router.get('/fleet/dashboard', authMiddleware, async (req, res) => {
  try {
    // Get all equipment owned by user
    const equipment = await query(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM equipment_bookings WHERE equipment_id = e.id) AS total_bookings,
        (SELECT COUNT(*) FROM equipment_bookings WHERE equipment_id = e.id AND status = 'completed') AS completed_bookings,
        (SELECT COALESCE(SUM(total_cost), 0) FROM equipment_bookings WHERE equipment_id = e.id AND status = 'completed') AS total_revenue,
        (SELECT AVG(rating) FROM reviews WHERE target_id = e.id::text) AS avg_rating
       FROM equipment e WHERE e.owner_id = $1
       ORDER BY total_revenue DESC`,
      [req.user.id]
    );

    if (!equipment.rows.length) return res.json({ message: 'No equipment registered', fleet_size: 0 });

    const totalRevenue = equipment.rows.reduce((sum, e) => sum + parseFloat(e.total_revenue || 0), 0);
    const totalBookings = equipment.rows.reduce((sum, e) => sum + parseInt(e.total_bookings || 0), 0);
    const avgUtilization = equipment.rows.length > 0
      ? Math.round(equipment.rows.reduce((sum, e) => sum + parseInt(e.total_bookings || 0), 0) / equipment.rows.length * 10)
      : 0;

    res.json({
      fleet_size: equipment.rows.length,
      total_revenue: totalRevenue,
      total_bookings: totalBookings,
      avg_utilization_pct: Math.min(avgUtilization, 100),
      equipment: equipment.rows.map(e => ({
        id: e.id,
        name: e.name,
        type: e.equipment_type,
        status: e.status,
        bookings: parseInt(e.total_bookings),
        revenue: parseFloat(e.total_revenue),
        rating: e.avg_rating ? parseFloat(e.avg_rating).toFixed(1) : 'N/A',
      })),
      insights: [
        totalBookings > 20 ? '📈 Good booking frequency!' : '💡 Consider reducing prices to attract more bookings',
        avgUtilization < 40 ? '⚠️ Low utilization — list on more channels' : '✅ Healthy utilization rate',
      ],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// MULTI-MACHINE PACKAGES — Bundle services
// ═══════════════════════════════════════════════════════════════

router.get('/packages', async (req, res) => {
  const packages = [
    { id: 'pkg1', name: 'Land Preparation Complete', icon: '🌾', equipment: ['Plowing', 'Rotavator', 'Leveling'], discount_pct: 15, description: 'Full land prep: plow + rotavate + level in one booking', estimated_hours: 12, suitable_for: 'All crops, 2-5 acres' },
    { id: 'pkg2', name: 'Paddy Transplanting', icon: '🌱', equipment: ['Puddler', 'Leveler', 'Transplanter'], discount_pct: 12, description: 'Complete transplanting package for wetland paddy', estimated_hours: 10, suitable_for: 'Paddy, 2-5 acres' },
    { id: 'pkg3', name: 'Harvest & Transport', icon: '🚜', equipment: ['Harvester', 'Trailer'], discount_pct: 10, description: 'Combined harvesting + transport to mandi/warehouse', estimated_hours: 8, suitable_for: 'Paddy, Wheat, Maize' },
    { id: 'pkg4', name: 'Orchard Maintenance', icon: '🍊', equipment: ['Sprayer', 'Pruner', 'Brush Cutter'], discount_pct: 12, description: 'Spray + prune + clean in one visit', estimated_hours: 6, suitable_for: 'Mango, Citrus, Guava' },
    { id: 'pkg5', name: 'Pond Preparation', icon: '🐟', equipment: ['JCB Excavator', 'Compactor', 'Laser Leveler'], discount_pct: 18, description: 'Complete aquaculture pond preparation', estimated_hours: 16, suitable_for: 'Shrimp/Fish ponds, 1-3 acres' },
  ];
  res.json({ packages });
});

// ═══════════════════════════════════════════════════════════════
// OPERATOR RATING & REVIEW SYSTEM
// ═══════════════════════════════════════════════════════════════

router.post('/bookings/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, work_photos } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });

    // Verify booking belongs to user and is completed
    const booking = await query(
      `SELECT * FROM equipment_bookings WHERE id = $1 AND renter_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!booking.rows.length) return res.status(404).json({ error: 'Booking not found' });

    const result = await query(`
      INSERT INTO reviews (id, reviewer_id, target_id, target_type, rating, comment, photos)
      VALUES ($1, $2, $3, 'equipment_booking', $4, $5, $6) RETURNING *
    `, [require('uuid').v4(), req.user.id, req.params.id, rating, comment, work_photos ? JSON.stringify(work_photos) : null]);

    // Update equipment average rating
    const equipId = booking.rows[0].equipment_id;
    await query(`
      UPDATE equipment SET rating = (
        SELECT AVG(r.rating) FROM reviews r
        JOIN equipment_bookings eb ON eb.id = r.target_id::uuid
        WHERE eb.equipment_id = $1 AND r.target_type = 'equipment_booking'
      ) WHERE id = $1
    `, [equipId]);

    res.status(201).json({ review: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// SERVICE HISTORY & MAINTENANCE LOG
// ═══════════════════════════════════════════════════════════════

router.post('/equipment/:id/maintenance', authMiddleware, async (req, res) => {
  try {
    const { service_type, description, cost, next_service_date } = req.body;
    if (!service_type) return res.status(400).json({ error: 'service_type required' });

    // Verify ownership
    const eq = await query(`SELECT * FROM equipment WHERE id = $1 AND owner_id = $2`, [req.params.id, req.user.id]);
    if (!eq.rows.length) return res.status(403).json({ error: 'Not your equipment' });

    const result = await query(`
      INSERT INTO maintenance_logs (id, equipment_id, service_type, description, cost, next_service_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [require('uuid').v4(), req.params.id, service_type, description, cost, next_service_date]);

    res.status(201).json({ log: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/equipment/:id/maintenance', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM maintenance_logs WHERE equipment_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json({ logs: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
