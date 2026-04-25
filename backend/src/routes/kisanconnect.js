const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
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

    res.status(201).json({ booking: result.rows[0], total_amount });
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

module.exports = router;
