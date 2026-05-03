'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// INPUT MARKETPLACE — Seeds, Fertilizers, Pesticides, Tools
// Browse products, order from nearby sellers, get recommendations
// ═══════════════════════════════════════════════════════════════

// GET /api/inputs/categories — List input categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM input_categories ORDER BY sort_order ASC
    `);
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inputs/products — Browse products
router.get('/products', async (req, res) => {
  try {
    const { category_id, crop_id, organic, brand, search, limit = 20, offset = 0 } = req.query;
    let conditions = ['in_stock = true'];
    let params = [];
    let i = 1;

    if (category_id) { conditions.push(`category_id = $${i++}`); params.push(category_id); }
    if (organic === 'true') { conditions.push('organic_certified = true'); }
    if (brand) { conditions.push(`brand ILIKE $${i++}`); params.push(`%${brand}%`); }
    if (search) {
      conditions.push(`(name ILIKE $${i} OR brand ILIKE $${i} OR manufacturer ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    if (crop_id) {
      conditions.push(`$${i++} = ANY(crop_suitable)`);
      params.push(crop_id);
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(`
      SELECT ip.*, ic.name as category_name, ic.icon_emoji
      FROM input_products ip
      LEFT JOIN input_categories ic ON ip.category_id = ic.id
      ${where}
      ORDER BY ip.total_orders DESC, ip.rating DESC
      LIMIT $${i++} OFFSET $${i}
    `, params);

    const countResult = await pool.query(`SELECT COUNT(*) FROM input_products ip ${where}`, params.slice(0, -2));

    res.json({ products: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inputs/products/:id — Product detail with seller inventory
router.get('/products/:id', async (req, res) => {
  try {
    const product = await pool.query('SELECT * FROM input_products WHERE id = $1', [req.params.id]);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found' });

    const sellers = await pool.query(`
      SELECT ii.*, iss.shop_name, iss.address, iss.phone, iss.lat, iss.lng,
             iss.rating as seller_rating, iss.is_verified, iss.delivery_available
      FROM input_inventory ii
      JOIN input_sellers iss ON ii.seller_id = iss.id
      WHERE ii.product_id = $1 AND ii.is_available = true
      ORDER BY ii.price ASC
    `, [req.params.id]);

    res.json({ product: product.rows[0], sellers: sellers.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inputs/sellers — Nearby sellers
router.get('/sellers', async (req, res) => {
  try {
    const { district_id, lat, lng, radius_km = 15 } = req.query;
    let conditions = ['is_verified = true'];
    let params = [];
    let i = 1;

    if (district_id) { conditions.push(`district_id = $${i++}`); params.push(district_id); }

    let distanceSelect = '';
    if (lat && lng) {
      distanceSelect = `, ( 6371 * acos( cos(radians($${i})) * cos(radians(lat)) * cos(radians(lng) - radians($${i+1})) + sin(radians($${i})) * sin(radians(lat)) ) ) AS distance_km`;
      conditions.push(`( 6371 * acos( cos(radians($${i})) * cos(radians(lat)) * cos(radians(lng) - radians($${i+1})) + sin(radians($${i})) * sin(radians(lat)) ) ) <= $${i+2}`);
      params.push(Number(lat), Number(lng), Number(radius_km));
      i += 3;
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    const result = await pool.query(`
      SELECT * ${distanceSelect} FROM input_sellers ${where}
      ORDER BY rating DESC
    `, params);

    res.json({ sellers: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inputs/orders — Place input order
router.post('/orders', auth, async (req, res) => {
  try {
    const { seller_id, items, delivery_address, delivery_lat, delivery_lng, notes } = req.body;
    if (!seller_id || !items || !items.length) {
      return res.status(400).json({ error: 'seller_id and items are required' });
    }

    // Calculate total
    let total_amount = 0;
    for (const item of items) {
      total_amount += (item.price || 0) * (item.quantity || 1);
    }

    const result = await pool.query(`
      INSERT INTO input_orders (buyer_id, seller_id, items, total_amount, delivery_address, delivery_lat, delivery_lng, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.id, seller_id, JSON.stringify(items), total_amount, delivery_address, delivery_lat, delivery_lng, notes]);

    // Update product order counts
    for (const item of items) {
      if (item.product_id) {
        await pool.query('UPDATE input_products SET total_orders = total_orders + 1 WHERE id = $1', [item.product_id]);
      }
    }

    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inputs/orders — My orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    let conditions = ['io.buyer_id = $1'];
    let params = [req.user.id];
    let i = 2;

    if (status) { conditions.push(`io.status = $${i++}`); params.push(status); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(`
      SELECT io.*, iss.shop_name, iss.phone as seller_phone
      FROM input_orders io
      LEFT JOIN input_sellers iss ON io.seller_id = iss.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY io.created_at DESC
      LIMIT $${i++} OFFSET $${i}
    `, params);

    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inputs/orders/:id/status — Update order status
router.patch('/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(`
      UPDATE input_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `, [status, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inputs/recommendations — AI recommendations based on farmer profile
router.get('/recommendations', auth, async (req, res) => {
  try {
    // Get farmer's current crops from farm diary or profile
    const farmerCrops = await pool.query(`
      SELECT DISTINCT crop_id FROM farm_diary_entries WHERE farmer_id = $1 AND crop_id IS NOT NULL
      UNION
      SELECT unnest(crops_grown) FROM users WHERE id = $1
    `, [req.user.id]);

    const cropIds = farmerCrops.rows.map(r => r.crop_id).filter(Boolean);

    let recommendations = [];
    if (cropIds.length > 0) {
      // Find products suitable for farmer's crops
      const result = await pool.query(`
        SELECT ip.*, ic.name as category_name, ic.icon_emoji
        FROM input_products ip
        LEFT JOIN input_categories ic ON ip.category_id = ic.id
        WHERE ip.in_stock = true AND ip.crop_suitable && $1::uuid[]
        ORDER BY ip.rating DESC, ip.total_orders DESC
        LIMIT 10
      `, [cropIds]);
      recommendations = result.rows;
    }

    // If no crop-specific results, return top-rated products
    if (!recommendations.length) {
      const result = await pool.query(`
        SELECT ip.*, ic.name as category_name, ic.icon_emoji
        FROM input_products ip
        LEFT JOIN input_categories ic ON ip.category_id = ic.id
        WHERE ip.in_stock = true
        ORDER BY ip.rating DESC, ip.total_orders DESC
        LIMIT 10
      `);
      recommendations = result.rows;
    }

    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
