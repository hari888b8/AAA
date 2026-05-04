const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');

// ─── GET /listings — Browse land listings ───────────────────────
router.get('/listings', optionalAuth, async (req, res) => {
  try {
    const { type, mode, district, min_price, max_price, min_area, max_area, water_source, soil_type, search, limit = 20, offset = 0 } = req.query;
    let query = `SELECT l.*, u.name as owner_name, d.name as district_name
                 FROM bhoomios_listings l
                 LEFT JOIN users u ON l.owner_id = u.id
                 LEFT JOIN districts d ON l.district_id = d.id
                 WHERE l.is_available = true`;
    const params = [];
    let idx = 1;

    if (type) { query += ` AND l.land_type = $${idx++}`; params.push(type); }
    if (mode) { query += ` AND l.listing_mode = $${idx++}`; params.push(mode); }
    if (district) { query += ` AND l.district_id = $${idx++}`; params.push(Number(district)); }
    if (min_price) { query += ` AND l.price >= $${idx++}`; params.push(Number(min_price)); }
    if (max_price) { query += ` AND l.price <= $${idx++}`; params.push(Number(max_price)); }
    if (min_area) { query += ` AND l.area_acres >= $${idx++}`; params.push(Number(min_area)); }
    if (max_area) { query += ` AND l.area_acres <= $${idx++}`; params.push(Number(max_area)); }
    if (water_source) { query += ` AND $${idx++} = ANY(l.water_sources)`; params.push(water_source); }
    if (soil_type) { query += ` AND $${idx++} = ANY(l.soil_types)`; params.push(soil_type); }
    if (search) { query += ` AND (l.title ILIKE $${idx++} OR l.location_label ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    query += ` ORDER BY l.is_verified DESC, l.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);
    res.json({ listings: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /listings/:id — Single listing detail ──────────────────
router.get('/listings/:id', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, u.name as owner_name, u.phone as owner_phone, d.name as district_name
       FROM bhoomios_listings l
       LEFT JOIN users u ON l.owner_id = u.id
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE l.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /listings — Create a land listing ─────────────────────
router.post('/listings', auth, async (req, res) => {
  try {
    const { title, land_type, listing_mode, area_acres, price, price_unit, district_id, location_label,
            water_sources, soil_types, crops_grown, road_access, fencing, description, images, lat, lng } = req.body;
    if (!title || !land_type || !listing_mode || !area_acres) {
      return res.status(400).json({ error: 'title, land_type, listing_mode, area_acres required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bhoomios_listings (owner_id, title, land_type, listing_mode, area_acres, price, price_unit,
        district_id, location_label, water_sources, soil_types, crops_grown, road_access, fencing, description, images, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.user.id, title, land_type, listing_mode, area_acres, price, price_unit || 'total',
       district_id, location_label, water_sources || [], soil_types || [], crops_grown || [],
       road_access || false, fencing || false, description, images || [], lat, lng]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /listings/:id — Update listing ───────────────────────
router.patch('/listings/:id', auth, async (req, res) => {
  try {
    const { title, price, description, is_available, images } = req.body;
    const { rows } = await pool.query(
      `UPDATE bhoomios_listings SET
        title = COALESCE($2, title), price = COALESCE($3, price),
        description = COALESCE($4, description), is_available = COALESCE($5, is_available),
        images = COALESCE($6, images), updated_at = NOW()
       WHERE id = $1 AND owner_id = $7 RETURNING *`,
      [req.params.id, title, price, description, is_available, images, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Listing not found or not yours' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /listings/:id ────────────────────────────────────────
router.delete('/listings/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM bhoomios_listings WHERE id=$1 AND owner_id=$2', [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Listing not found' });
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /my-listings — Seller's own listings ───────────────────
router.get('/my-listings', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, d.name as district_name FROM bhoomios_listings l
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE l.owner_id = $1 ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /inquiries — Buyer sends inquiry on listing ───────────
router.post('/inquiries', auth, async (req, res) => {
  try {
    const { listing_id, message, offered_price, contact_phone } = req.body;
    if (!listing_id) return res.status(400).json({ error: 'listing_id required' });

    const listing = await pool.query('SELECT * FROM bhoomios_listings WHERE id=$1', [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });

    const { rows } = await pool.query(
      `INSERT INTO bhoomios_inquiries (listing_id, buyer_id, seller_id, message, offered_price, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [listing_id, req.user.id, listing.rows[0].owner_id, message, offered_price, contact_phone]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /inquiries — Get inquiries for user ────────────────────
router.get('/inquiries', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, l.title as listing_title, l.land_type, l.area_acres, l.price,
              u.name as buyer_name
       FROM bhoomios_inquiries i
       LEFT JOIN bhoomios_listings l ON i.listing_id = l.id
       LEFT JOIN users u ON i.buyer_id = u.id
       WHERE i.seller_id = $1 OR i.buyer_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json({ inquiries: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /saved — Save a listing ──────────────────────────────
router.post('/saved', auth, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO bhoomios_saved (user_id, listing_id) VALUES ($1,$2)
       ON CONFLICT(user_id, listing_id) DO NOTHING RETURNING *`,
      [req.user.id, listing_id]
    );
    res.status(201).json({ saved: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /saved — My saved listings ─────────────────────────────
router.get('/saved', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, d.name as district_name FROM bhoomios_saved s
       JOIN bhoomios_listings l ON s.listing_id = l.id
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /saved/:listing_id — Un-save ────────────────────────
router.delete('/saved/:listing_id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM bhoomios_saved WHERE user_id=$1 AND listing_id=$2', [req.user.id, req.params.listing_id]);
    res.json({ removed: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /stats — BhoomiOS platform stats ───────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [listings, sale, rent] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM bhoomios_listings WHERE is_available=true'),
      pool.query(`SELECT COUNT(*) FROM bhoomios_listings WHERE listing_mode='sale' AND is_available=true`),
      pool.query(`SELECT COUNT(*) FROM bhoomios_listings WHERE listing_mode='rent' AND is_available=true`),
    ]);
    res.json({
      total_listings: parseInt(listings.rows[0].count),
      for_sale: parseInt(sale.rows[0].count),
      for_rent: parseInt(rent.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Crop nutrient requirements table ───────────────────────────
const CROP_REQUIREMENTS = {
  paddy:     { n: 100, p: 50,  k: 50,  name: 'Paddy' },
  cotton:    { n: 120, p: 60,  k: 60,  name: 'Cotton' },
  maize:     { n: 120, p: 60,  k: 40,  name: 'Maize' },
  groundnut: { n: 25,  p: 50,  k: 75,  name: 'Groundnut' },
  chilli:    { n: 120, p: 60,  k: 60,  name: 'Chilli' },
  tomato:    { n: 150, p: 75,  k: 100, name: 'Tomato' },
  sugarcane: { n: 250, p: 62,  k: 112, name: 'Sugarcane' },
  wheat:     { n: 120, p: 60,  k: 40,  name: 'Wheat' },
  default:   { n: 100, p: 50,  k: 50,  name: 'General Crop' },
};

function generateFertilizerRecommendations(ph, n, p, k, oc) {
  const recs = [];
  if (n != null && n < 280)  recs.push({ input: 'Urea', dose: '50 kg/acre', reason: 'Low nitrogen', timing: 'Basal + Top dressing' });
  if (p != null && p < 25)   recs.push({ input: 'DAP', dose: '50 kg/acre', reason: 'Low phosphorus', timing: 'Basal' });
  if (k != null && k < 280)  recs.push({ input: 'MOP', dose: '25 kg/acre', reason: 'Low potassium', timing: 'Basal + Top dressing' });
  if (ph != null && ph < 6)  recs.push({ input: 'Agricultural Lime', dose: '200 kg/acre', reason: 'Acidic soil (pH < 6)', timing: 'Pre-sowing' });
  if (ph != null && ph > 8.5) recs.push({ input: 'Gypsum', dose: '200 kg/acre', reason: 'Alkaline soil (pH > 8.5)', timing: 'Pre-sowing' });
  if (oc != null && oc < 0.5) recs.push({ input: 'Vermicompost', dose: '2 tonnes/acre', reason: 'Low organic carbon', timing: 'Pre-sowing' });
  return recs;
}

// ─── POST /soil-cards — Upload/create soil health card ──────────
router.post('/soil-cards', auth, async (req, res) => {
  try {
    const { listing_id, card_photo_url, ph_value, nitrogen_kg_ha, phosphorus_kg_ha,
            potassium_kg_ha, organic_carbon, ec_dS_m, soil_type, test_date, lab_name, card_number } = req.body;

    const recommendations = generateFertilizerRecommendations(
      ph_value, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha, organic_carbon
    );

    const { rows } = await pool.query(
      `INSERT INTO bhoomios_soil_cards
        (farmer_id, listing_id, card_photo_url, ph_value, nitrogen_kg_ha, phosphorus_kg_ha,
         potassium_kg_ha, organic_carbon, ec_dS_m, soil_type, test_date, lab_name, card_number, recommendations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.id, listing_id || null, card_photo_url, ph_value, nitrogen_kg_ha,
       phosphorus_kg_ha, potassium_kg_ha, organic_carbon, ec_dS_m, soil_type,
       test_date || null, lab_name, card_number, JSON.stringify(recommendations)]
    );
    res.status(201).json({ ...rows[0], recommendations });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /soil-cards — Get my soil cards ────────────────────────
router.get('/soil-cards', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bhoomios_soil_cards WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ soil_cards: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /soil-cards/:id — Single soil card with recommendations ─
router.get('/soil-cards/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bhoomios_soil_cards WHERE id = $1 AND farmer_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Soil card not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /field-boundaries — Save GPS field boundary ───────────
router.post('/field-boundaries', auth, async (req, res) => {
  try {
    const { listing_id, field_name, boundary_geojson, centroid_lat, centroid_lng, notes } = req.body;
    if (!boundary_geojson || !Array.isArray(boundary_geojson) || boundary_geojson.length < 3) {
      return res.status(400).json({ error: 'boundary_geojson must be an array of at least 3 {lat, lng} points' });
    }

    const area_calculated_acres = calculatePolygonArea(boundary_geojson);
    const perimeter_m = calculatePerimeter(boundary_geojson);

    const { rows } = await pool.query(
      `INSERT INTO bhoomios_field_boundaries
        (farmer_id, listing_id, field_name, boundary_geojson, area_calculated_acres, perimeter_m, centroid_lat, centroid_lng, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, listing_id || null, field_name, JSON.stringify(boundary_geojson),
       area_calculated_acres, perimeter_m, centroid_lat, centroid_lng, notes]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function calculatePolygonArea(points) {
  const R = 6371000;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = points[i].lng * Math.PI / 180;
    const yi = points[i].lat * Math.PI / 180;
    const xj = points[j].lng * Math.PI / 180;
    const yj = points[j].lat * Math.PI / 180;
    area += xi * Math.sin(yj) - xj * Math.sin(yi);
  }
  area = Math.abs(area) * R * R / 2;
  return area / 4047;
}

function calculatePerimeter(points) {
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += haversineDistance(points[i], points[j]);
  }
  return perimeter;
}

function haversineDistance(p1, p2) {
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GET /field-boundaries — Get my field boundaries ────────────
router.get('/field-boundaries', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bhoomios_field_boundaries WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ boundaries: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /fertilizer-recommendations — Fertilizer recommendations ─
router.get('/fertilizer-recommendations', async (req, res) => {
  try {
    const { soil_card_id, ph, n, p, k, organic_carbon, crop } = req.query;

    let ph_value = ph ? parseFloat(ph) : null;
    let n_val    = n  ? parseFloat(n)  : null;
    let p_val    = p  ? parseFloat(p)  : null;
    let k_val    = k  ? parseFloat(k)  : null;
    let oc_val   = organic_carbon ? parseFloat(organic_carbon) : null;

    if (soil_card_id) {
      const { rows } = await pool.query(
        'SELECT * FROM bhoomios_soil_cards WHERE id = $1', [soil_card_id]
      );
      if (rows.length) {
        const card = rows[0];
        ph_value = ph_value ?? card.ph_value;
        n_val    = n_val    ?? card.nitrogen_kg_ha;
        p_val    = p_val    ?? card.phosphorus_kg_ha;
        k_val    = k_val    ?? card.potassium_kg_ha;
        oc_val   = oc_val   ?? card.organic_carbon;
      }
    }

    const cropKey  = (crop || 'default').toLowerCase();
    const cropReq  = CROP_REQUIREMENTS[cropKey] || CROP_REQUIREMENTS.default;
    const basalRecs = generateFertilizerRecommendations(ph_value, n_val, p_val, k_val, oc_val);

    const recommendations = [
      {
        stage: 'Basal (Pre-sowing)',
        inputs: basalRecs.filter(r => r.timing.includes('Basal') || r.timing.includes('Pre-sowing')),
      },
      {
        stage: 'Top Dressing 1 (3-4 weeks after sowing)',
        inputs: n_val != null && n_val < 280
          ? [{ input: 'Urea', dose: '25 kg/acre', reason: 'Nitrogen boost for vegetative growth' }]
          : [],
      },
      {
        stage: 'Top Dressing 2 (6-8 weeks after sowing)',
        inputs: k_val != null && k_val < 280
          ? [{ input: 'MOP', dose: '15 kg/acre', reason: 'Potassium boost for grain/fruit development' }]
          : [],
      },
      {
        stage: 'Organic Inputs',
        inputs: oc_val != null && oc_val < 0.5
          ? [{ input: 'Vermicompost or FYM', dose: '2 tonnes/acre', reason: 'Improve soil organic matter' }]
          : [],
      },
    ];

    const soil_status = {
      ph:      ph_value != null ? { value: ph_value, status: ph_value < 6 ? 'Acidic' : ph_value > 8.5 ? 'Alkaline' : 'Neutral' } : null,
      nitrogen: n_val != null ? { value: n_val, status: n_val < 280 ? 'Low' : n_val < 560 ? 'Medium' : 'High' } : null,
      phosphorus: p_val != null ? { value: p_val, status: p_val < 25 ? 'Low' : p_val < 50 ? 'Medium' : 'High' } : null,
      potassium: k_val != null ? { value: k_val, status: k_val < 280 ? 'Low' : k_val < 560 ? 'Medium' : 'High' } : null,
      organic_carbon: oc_val != null ? { value: oc_val, status: oc_val < 0.5 ? 'Low' : oc_val < 0.75 ? 'Medium' : 'High' } : null,
    };

    const products = [
      { name: 'Urea (46% N)', brand: 'IFFCO', price_range: '₹266/bag', category: 'fertilizers' },
      { name: 'DAP (18:46:0)', brand: 'IFFCO', price_range: '₹1350/bag', category: 'fertilizers' },
      { name: 'MOP (60% K2O)', brand: 'IPL', price_range: '₹900/bag', category: 'fertilizers' },
      { name: 'Agricultural Lime', brand: 'Local', price_range: '₹400/bag', category: 'soil_health' },
      { name: 'Gypsum', brand: 'Local', price_range: '₹300/bag', category: 'soil_health' },
      { name: 'Vermicompost', brand: 'Green Earth', price_range: '₹450/50kg', category: 'organic' },
    ];

    res.json({ crop: cropReq.name, recommendations, soil_status, products });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /labs — Get soil testing labs ──────────────────────────
router.get('/labs', async (req, res) => {
  try {
    const { district, state, search, limit = 20, offset = 0 } = req.query;
    let query = `SELECT l.*, d.name as district_name FROM bhoomios_soil_labs l
                 LEFT JOIN districts d ON l.district_id = d.id
                 WHERE l.is_active = true`;
    const params = [];
    let idx = 1;

    if (district) { query += ` AND l.district_id = $${idx++}`; params.push(Number(district)); }
    if (state)    { query += ` AND l.state ILIKE $${idx++}`; params.push(`%${state}%`); }
    if (search)   { query += ` AND (l.name ILIKE $${idx++} OR l.address ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    query += ` ORDER BY l.is_accredited DESC, l.name ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);
    res.json({ labs: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /labs/:id — Single lab detail ──────────────────────────
router.get('/labs/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, d.name as district_name FROM bhoomios_soil_labs l
       LEFT JOIN districts d ON l.district_id = d.id
       WHERE l.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Lab not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
