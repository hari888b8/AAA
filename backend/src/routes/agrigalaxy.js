const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');

// ─── GET /stores — List all agri-input stores ───────────────────
router.get('/stores', optionalAuth, async (req, res) => {
  try {
    const { district, category, search, limit = 20, offset = 0 } = req.query;
    let query = `SELECT s.*, u.name as owner_name, u.phone as owner_phone,
                 d.name as district_name
                 FROM agrigalaxy_stores s
                 LEFT JOIN users u ON s.owner_id = u.id
                 LEFT JOIN districts d ON s.district_id = d.id
                 WHERE s.is_active = true`;
    const params = [];
    let idx = 1;

    if (district) { query += ` AND s.district_id = $${idx++}`; params.push(district); }
    if (category) { query += ` AND $${idx++} = ANY(s.categories)`; params.push(category); }
    if (search) { query += ` AND (s.name ILIKE $${idx++} OR s.description ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    query += ` ORDER BY s.rating DESC, s.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);
    res.json({ stores: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /stores — Create a store (supplier role) ──────────────
router.post('/stores', auth, async (req, res) => {
  try {
    const { name, description, district_id, address, categories, gst_number, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Store name required' });

    const { rows } = await pool.query(
      `INSERT INTO agrigalaxy_stores (owner_id, name, description, district_id, address, categories, gst_number, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, name, description, district_id, address, categories || [], gst_number, phone]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /stores/:id — Update a store ─────────────────────────
router.patch('/stores/:id', auth, async (req, res) => {
  try {
    const { name, description, district_id, address, categories, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE agrigalaxy_stores SET
        name = COALESCE($2, name), description = COALESCE($3, description),
        district_id = COALESCE($4, district_id), address = COALESCE($5, address),
        categories = COALESCE($6, categories), is_active = COALESCE($7, is_active),
        updated_at = NOW()
       WHERE id = $1 AND owner_id = $8 RETURNING *`,
      [req.params.id, name, description, district_id, address, categories, is_active, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found or not yours' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /products — Browse agri-input products ─────────────────
router.get('/products', optionalAuth, async (req, res) => {
  try {
    const { store_id, category, search, min_price, max_price, in_stock, limit = 30, offset = 0 } = req.query;
    let query = `SELECT p.*, s.name as store_name, s.district_id, d.name as district_name
                 FROM agrigalaxy_products p
                 LEFT JOIN agrigalaxy_stores s ON p.store_id = s.id
                 LEFT JOIN districts d ON s.district_id = d.id
                 WHERE p.status = 'active'`;
    const params = [];
    let idx = 1;

    if (store_id) { query += ` AND p.store_id = $${idx++}`; params.push(store_id); }
    if (category) { query += ` AND p.category = $${idx++}`; params.push(category); }
    if (search) { query += ` AND (p.name ILIKE $${idx++} OR p.brand ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (min_price) { query += ` AND p.price >= $${idx++}`; params.push(Number(min_price)); }
    if (max_price) { query += ` AND p.price <= $${idx++}`; params.push(Number(max_price)); }
    if (in_stock === 'true') { query += ` AND p.stock > 0`; }

    query += ` ORDER BY p.rating DESC, p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);
    res.json({ products: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /products — Add a product to store ────────────────────
router.post('/products', auth, async (req, res) => {
  try {
    const { store_id, name, category, brand, description, price, unit, stock, image_url, crop_tags } = req.body;
    if (!store_id || !name || !category) return res.status(400).json({ error: 'store_id, name, category required' });

    // Verify store ownership
    const storeCheck = await pool.query('SELECT id FROM agrigalaxy_stores WHERE id=$1 AND owner_id=$2', [store_id, req.user.id]);
    if (!storeCheck.rows.length) return res.status(403).json({ error: 'Not your store' });

    const { rows } = await pool.query(
      `INSERT INTO agrigalaxy_products (store_id, name, category, brand, description, price, unit, stock, image_url, crop_tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [store_id, name, category, brand, description, price, unit || 'piece', stock || 0, image_url, crop_tags || []]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PATCH /products/:id — Update product ───────────────────────
router.patch('/products/:id', auth, async (req, res) => {
  try {
    const { name, category, brand, description, price, unit, stock, image_url, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE agrigalaxy_products SET
        name = COALESCE($2, name), category = COALESCE($3, category),
        brand = COALESCE($4, brand), description = COALESCE($5, description),
        price = COALESCE($6, price), unit = COALESCE($7, unit),
        stock = COALESCE($8, stock), image_url = COALESCE($9, image_url),
        status = COALESCE($10, status), updated_at = NOW()
       WHERE id = $1 AND store_id IN (SELECT id FROM agrigalaxy_stores WHERE owner_id = $11)
       RETURNING *`,
      [req.params.id, name, category, brand, description, price, unit, stock, image_url, status, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /products/:id ────────────────────────────────────────
router.delete('/products/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM agrigalaxy_products WHERE id = $1 AND store_id IN (SELECT id FROM agrigalaxy_stores WHERE owner_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /categories — List product categories ──────────────────
router.get('/categories', async (req, res) => {
  res.json({ categories: [
    { id: 'seeds', name: 'Seeds', icon: '🌱' },
    { id: 'fertilizers', name: 'Fertilizers', icon: '🧪' },
    { id: 'pesticides', name: 'Pesticides', icon: '🧫' },
    { id: 'organic', name: 'Organic Inputs', icon: '🍃' },
    { id: 'irrigation', name: 'Irrigation', icon: '💧' },
    { id: 'tools', name: 'Tools & Equipment', icon: '🔧' },
    { id: 'soil_health', name: 'Soil Health', icon: '🌍' },
    { id: 'growth_promoters', name: 'Growth Promoters', icon: '📈' },
  ]});
});

// ─── GET /my-stores — Supplier's own stores ─────────────────────
router.get('/my-stores', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, (SELECT COUNT(*) FROM agrigalaxy_products WHERE store_id = s.id) as product_count
       FROM agrigalaxy_stores s WHERE s.owner_id = $1 ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ stores: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /orders — Place an order for products ─────────────────
router.post('/orders', auth, async (req, res) => {
  try {
    const { product_id, quantity, delivery_address } = req.body;
    if (!product_id || !quantity) return res.status(400).json({ error: 'product_id and quantity required' });

    const prod = await pool.query('SELECT * FROM agrigalaxy_products WHERE id=$1 AND status=\'active\'', [product_id]);
    if (!prod.rows.length) return res.status(404).json({ error: 'Product not found' });

    const product = prod.rows[0];
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const total = product.price * quantity;
    const { rows } = await pool.query(
      `INSERT INTO orders (buyer_id, listing_id, listing_type, quantity, price_per_unit, total_amount, delivery_address, crop_name, status)
       VALUES ($1,$2,'agrigalaxy',$3,$4,$5,$6,$7,'confirmed') RETURNING *`,
      [req.user.id, product_id, quantity, product.price, total, delivery_address, product.name]
    );

    // Decrement stock
    await pool.query('UPDATE agrigalaxy_products SET stock = stock - $1 WHERE id = $2', [quantity, product_id]);

    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /stats — Platform stats ────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [stores, products, orders] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM agrigalaxy_stores WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM agrigalaxy_products WHERE status=\'active\''),
      pool.query('SELECT COUNT(*) FROM orders WHERE listing_type=\'agrigalaxy\''),
    ]);
    res.json({
      total_stores: parseInt(stores.rows[0].count),
      total_products: parseInt(products.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── In-memory trending cache (1-hour TTL) ───────────────────────
let trendingCache = null;
let trendingCacheAt = 0;

// ─── GET /trending — Trending products and stores ────────────────
router.get('/trending', async (req, res) => {
  try {
    const now = Date.now();
    if (trendingCache && now - trendingCacheAt < 3600000) {
      return res.json(trendingCache);
    }

    const [trendingProducts, trendingStores, topCategories] = await Promise.all([
      pool.query(
        `SELECT p.*, s.name as store_name FROM agrigalaxy_products p
         LEFT JOIN agrigalaxy_stores s ON p.store_id = s.id
         WHERE p.status = 'active'
         ORDER BY p.rating DESC, p.stock DESC LIMIT 8`
      ),
      pool.query(
        `SELECT s.*, COUNT(p.id) as product_count
         FROM agrigalaxy_stores s
         LEFT JOIN agrigalaxy_products p ON p.store_id = s.id AND p.status = 'active'
         WHERE s.is_active = true
         GROUP BY s.id
         ORDER BY s.rating DESC LIMIT 5`
      ),
      pool.query(
        `SELECT category, COUNT(*) as product_count
         FROM agrigalaxy_products WHERE status = 'active'
         GROUP BY category ORDER BY product_count DESC LIMIT 6`
      ),
    ]);

    const month = new Date().getMonth();
    const seasonal_tip = month >= 5 && month <= 8
      ? 'Kharif season: Stock up on paddy seeds, cotton seeds, and soybean inputs.'
      : month >= 9 && month <= 11
      ? 'Rabi season: Wheat seeds, mustard, and chickpea inputs are in high demand.'
      : 'Off-season: Good time to buy fertilizers in bulk at lower prices.';

    trendingCache = {
      trending_products: trendingProducts.rows,
      trending_stores: trendingStores.rows,
      trending_categories: topCategories.rows,
      seasonal_tip,
    };
    trendingCacheAt = now;

    res.json(trendingCache);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /search — Unified search (products + stores) ───────────
router.get('/search', async (req, res) => {
  try {
    const { q, category, district, type = 'all', limit = 10 } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query q must be at least 2 characters' });
    const term = `%${q.trim()}%`;
    const lim = Math.min(parseInt(limit) || 10, 50);

    let stores = [], products = [];

    if (type === 'all' || type === 'stores') {
      let sq = `SELECT s.*, d.name as district_name FROM agrigalaxy_stores s
                LEFT JOIN districts d ON s.district_id = d.id
                WHERE s.is_active = true AND s.name ILIKE $1`;
      const sp = [term];
      let si = 2;
      if (district) { sq += ` AND s.district_id = $${si++}`; sp.push(Number(district)); }
      sq += ` ORDER BY s.rating DESC LIMIT $${si}`;
      sp.push(lim);
      const sr = await pool.query(sq, sp);
      stores = sr.rows;
    }

    if (type === 'all' || type === 'products') {
      let pq = `SELECT p.*, s.name as store_name FROM agrigalaxy_products p
                LEFT JOIN agrigalaxy_stores s ON p.store_id = s.id
                WHERE p.status = 'active' AND (p.name ILIKE $1 OR p.brand ILIKE $1)`;
      const pp = [term];
      let pi = 2;
      if (category) { pq += ` AND p.category = $${pi++}`; pp.push(category); }
      pq += ` ORDER BY p.rating DESC LIMIT $${pi}`;
      pp.push(lim);
      const pr = await pool.query(pq, pp);
      products = pr.rows;
    }

    res.json({ stores, products, total_stores: stores.length, total_products: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /platform-stats — Enhanced platform stats ──────────────
router.get('/platform-stats', async (req, res) => {
  try {
    const [stores, products, orders, farmers, listings, topCat, stories] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM agrigalaxy_stores WHERE is_active=true'),
      pool.query("SELECT COUNT(*) FROM agrigalaxy_products WHERE status='active'"),
      pool.query("SELECT COUNT(*) FROM orders WHERE listing_type='agrigalaxy'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role='farmer'"),
      pool.query("SELECT COUNT(*) FROM supply_listings WHERE status='active'").catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(
        `SELECT category, COUNT(*) as cnt FROM agrigalaxy_products
         WHERE status='active' GROUP BY category ORDER BY cnt DESC LIMIT 1`
      ),
      pool.query('SELECT COUNT(*) FROM platform_success_stories WHERE is_published=true').catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    res.json({
      total_stores: parseInt(stores.rows[0].count),
      total_products: parseInt(products.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
      total_farmers: parseInt(farmers.rows[0].count),
      active_listings: parseInt(listings.rows[0].count),
      top_category: topCat.rows[0] || null,
      success_stories_count: parseInt(stories.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /products/:id/reviews — Add/update product review ─────
router.post('/products/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, review_text, crop_used_for } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });

    const product = await pool.query('SELECT id FROM agrigalaxy_products WHERE id=$1', [req.params.id]);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found' });

    const verified = await pool.query(
      "SELECT id FROM orders WHERE buyer_id=$1 AND listing_id=$2 AND listing_type='agrigalaxy'",
      [req.user.id, req.params.id]
    );

    await pool.query(
      `INSERT INTO agrigalaxy_reviews (product_id, reviewer_id, rating, review_text, crop_used_for, verified_purchase)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (product_id, reviewer_id) DO UPDATE SET
         rating = EXCLUDED.rating, review_text = EXCLUDED.review_text,
         crop_used_for = EXCLUDED.crop_used_for`,
      [req.params.id, req.user.id, rating, review_text, crop_used_for, verified.rows.length > 0]
    );

    const avgResult = await pool.query(
      'SELECT AVG(rating) FROM agrigalaxy_reviews WHERE product_id = $1', [req.params.id]
    );
    const avgRating = parseFloat(avgResult.rows[0].avg || 0).toFixed(2);
    await pool.query('UPDATE agrigalaxy_products SET rating = $1 WHERE id = $2', [avgRating, req.params.id]);

    res.status(201).json({ success: true, new_rating: avgRating });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /products/:id/reviews — Get reviews for a product ──────
router.get('/products/:id/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.crop_used_for, r.verified_purchase, r.created_at,
              CASE
                WHEN STRPOS(u.name, ' ') > 0
                THEN CONCAT(LEFT(u.name, STRPOS(u.name, ' ') - 1), ' ', LEFT(SUBSTRING(u.name FROM STRPOS(u.name, ' ') + 1), 1), '.')
                ELSE u.name
              END as reviewer_display
       FROM agrigalaxy_reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ reviews: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /success-stories — Platform success stories ────────────
router.get('/success-stories', async (req, res) => {
  try {
    const { module: mod, limit = 10, offset = 0 } = req.query;
    let query = `SELECT * FROM platform_success_stories WHERE is_published = true`;
    const params = [];
    let idx = 1;
    if (mod) { query += ` AND module = $${idx++}`; params.push(mod); }
    query += ` ORDER BY is_verified DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await pool.query(query, params);
    res.json({ stories: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /compare — Compare 2-4 products ────────────────────────
router.get('/compare', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'ids query param required (comma-separated)' });

    const idList = ids.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
    if (idList.length < 2) return res.status(400).json({ error: 'Provide 2-4 product IDs' });

    const placeholders = idList.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT p.*, s.name as store_name, s.district_id, d.name as district_name
       FROM agrigalaxy_products p
       LEFT JOIN agrigalaxy_stores s ON p.store_id = s.id
       LEFT JOIN districts d ON s.district_id = d.id
       WHERE p.id IN (${placeholders})`,
      idList
    );
    res.json({ products: rows, count: rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
