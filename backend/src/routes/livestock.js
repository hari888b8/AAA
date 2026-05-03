const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const router = express.Router();

const VALID_ANIMAL_TYPES = ['cattle', 'buffalo', 'goat', 'sheep', 'poultry', 'pig', 'horse', 'other'];

const ANIMAL_CATEGORIES = [
  { type: 'cattle', label: 'Cattle & Cows', icon: '🐄' },
  { type: 'buffalo', label: 'Buffalo', icon: '🐃' },
  { type: 'goat', label: 'Goats', icon: '🐐' },
  { type: 'sheep', label: 'Sheep', icon: '🐑' },
  { type: 'poultry', label: 'Poultry', icon: '🐔' },
  { type: 'pig', label: 'Pigs', icon: '🐷' },
  { type: 'horse', label: 'Horses', icon: '🐴' },
  { type: 'other', label: 'Other', icon: '🐾' }
];

// GET /livestock/categories — public
router.get('/categories', async (req, res) => {
  try {
    const countResult = await query(`
      SELECT animal_type, COUNT(*) AS count
      FROM livestock_listings
      WHERE status = 'active'
      GROUP BY animal_type
    `);
    const countMap = {};
    countResult.rows.forEach(r => { countMap[r.animal_type] = parseInt(r.count); });

    const categories = ANIMAL_CATEGORIES.map(c => ({
      ...c,
      count: countMap[c.type] || 0
    }));

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /livestock/my — authenticated user's own listings
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM livestock_listings
      WHERE seller_id = $1 AND status != 'deleted'
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /livestock — public listing search
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { animal_type, breed, min_age, max_age, min_price, max_price,
            min_weight, max_weight, gender, district_id, radius_km, lat, lng,
            sort_by, limit = 20, offset = 0 } = req.query;

    let conditions = [`ll.status = 'active'`];
    let params = [];
    let i = 1;

    if (animal_type)  { conditions.push(`ll.animal_type = $${i++}`);  params.push(animal_type); }
    if (breed)        { conditions.push(`ll.breed ILIKE $${i++}`);    params.push(`%${breed}%`); }
    if (min_age)      { conditions.push(`ll.age_months >= $${i++}`);  params.push(Number(min_age)); }
    if (max_age)      { conditions.push(`ll.age_months <= $${i++}`);  params.push(Number(max_age)); }
    if (min_price)    { conditions.push(`ll.price >= $${i++}`);       params.push(Number(min_price)); }
    if (max_price)    { conditions.push(`ll.price <= $${i++}`);       params.push(Number(max_price)); }
    if (min_weight)   { conditions.push(`ll.weight_kg >= $${i++}`);   params.push(Number(min_weight)); }
    if (max_weight)   { conditions.push(`ll.weight_kg <= $${i++}`);   params.push(Number(max_weight)); }
    if (gender)       { conditions.push(`ll.gender = $${i++}`);       params.push(gender); }
    if (district_id)  { conditions.push(`ll.district_id = $${i++}`);  params.push(district_id); }

    // Proximity filter using Haversine formula
    let distanceSelect = '';
    let distanceCondition = '';
    if (radius_km && lat && lng) {
      const latNum = Number(lat), lngNum = Number(lng), radiusNum = Number(radius_km);
      distanceSelect = `, ( 6371 * acos( cos(radians($${i})) * cos(radians(ll.lat)) * cos(radians(ll.lng) - radians($${i+1})) + sin(radians($${i})) * sin(radians(ll.lat)) ) ) AS distance_km`;
      distanceCondition = ` AND ( 6371 * acos( cos(radians($${i})) * cos(radians(ll.lat)) * cos(radians(ll.lng) - radians($${i+1})) + sin(radians($${i})) * sin(radians(ll.lat)) ) ) <= $${i+2}`;
      params.push(latNum, lngNum, radiusNum); i += 3;
    }

    // Sort
    let orderClause = 'll.created_at DESC';
    if (sort_by === 'price_asc') orderClause = 'll.price ASC NULLS LAST';
    else if (sort_by === 'price_desc') orderClause = 'll.price DESC NULLS LAST';
    else if (sort_by === 'newest') orderClause = 'll.created_at DESC';
    else if (sort_by === 'nearest' && distanceSelect) orderClause = 'distance_km ASC';

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT ll.*, u.full_name AS seller_name${distanceSelect}
      FROM livestock_listings ll
      LEFT JOIN users u ON u.id = ll.seller_id
      WHERE ${conditions.join(' AND ')}${distanceCondition}
      ORDER BY ${orderClause}
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) FROM livestock_listings ll
      WHERE ${conditions.join(' AND ')}${distanceCondition}
    `, params.slice(0, -2));

    res.json({ listings: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /livestock/:id — single listing detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT ll.*,
             u.full_name AS seller_name, u.phone AS seller_phone,
             u.trust_score, u.verification_status
      FROM livestock_listings ll
      LEFT JOIN users u ON u.id = ll.seller_id
      WHERE ll.id = $1 AND ll.status != 'deleted'
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = result.rows[0];

    // Seller review stats
    const reviewResult = await query(`
      SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews
      FROM reviews
      WHERE reviewed_user_id = $1
    `, [listing.seller_id]);

    listing.seller_reviews = {
      avg_rating: parseFloat(Number(reviewResult.rows[0].avg_rating).toFixed(2)),
      total_reviews: parseInt(reviewResult.rows[0].total_reviews)
    };

    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /livestock — create listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { animal_type, breed, age_months, weight_kg, gender, price,
            vaccinations, health_certificate_url, photos, description,
            location_label, district_id, lat, lng } = req.body;

    if (!animal_type || price === undefined || price === null) {
      return res.status(400).json({ error: 'animal_type and price are required' });
    }
    if (!VALID_ANIMAL_TYPES.includes(animal_type)) {
      return res.status(400).json({ error: `animal_type must be one of: ${VALID_ANIMAL_TYPES.join(', ')}` });
    }

    const id = uuidv4();
    const result = await query(`
      INSERT INTO livestock_listings
        (id, seller_id, animal_type, breed, age_months, weight_kg, gender, price,
         vaccinations, health_certificate_url, photos, description,
         location_label, district_id, lat, lng)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [id, req.user.id, animal_type, breed, age_months, weight_kg, gender, price,
        JSON.stringify(vaccinations || []), health_certificate_url,
        JSON.stringify(photos || []), description, location_label, district_id, lat, lng]);

    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /livestock/:id — update listing
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query(
      `SELECT * FROM livestock_listings WHERE id = $1 AND status != 'deleted'`,
      [req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (existing.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const allowedFields = ['animal_type', 'breed', 'age_months', 'weight_kg', 'gender',
      'price', 'vaccinations', 'health_certificate_url', 'photos', 'description',
      'location_label', 'district_id', 'lat', 'lng'];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        let val = req.body[field];
        if (field === 'vaccinations' || field === 'photos') val = JSON.stringify(val);
        if (field === 'animal_type' && !VALID_ANIMAL_TYPES.includes(val)) {
          return res.status(400).json({ error: `animal_type must be one of: ${VALID_ANIMAL_TYPES.join(', ')}` });
        }
        updates.push(`${field} = $${idx++}`);
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const result = await query(`
      UPDATE livestock_listings SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `, values);

    res.json({ listing: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /livestock/:id — soft delete
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query(
      `SELECT * FROM livestock_listings WHERE id = $1 AND status != 'deleted'`,
      [req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (existing.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await query(
      `UPDATE livestock_listings SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
