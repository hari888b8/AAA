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

module.exports = router;
