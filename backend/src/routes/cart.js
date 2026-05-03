const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /cart — get all cart items for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT ci.*,
             sl.crop_id, cc.name AS listing_name, sl.price_per_kg,
             sl.photos, sl.grade, sl.quantity_kg AS available_qty,
             u.name AS seller_name
      FROM cart_items ci
      LEFT JOIN supply_listings sl ON ci.listing_id = sl.id AND ci.listing_type = 'supply'
      LEFT JOIN crop_catalog cc ON sl.crop_id = cc.id
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [req.user.id]);

    const items = result.rows;
    const total_items = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const total_amount = items.reduce((sum, i) => sum + (i.quantity * i.price_per_unit), 0);

    res.json({ items, summary: { total_items, total_amount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cart/count — quick count of cart items
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM cart_items WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cart/add — add item to cart (upsert)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { listing_id, listing_type, quantity, price_per_unit, notes } = req.body;
    if (!listing_id || !quantity || !price_per_unit) {
      return res.status(400).json({ error: 'listing_id, quantity, and price_per_unit required' });
    }

    const result = await query(`
      INSERT INTO cart_items (id, user_id, listing_id, listing_type, quantity, price_per_unit, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, listing_id, listing_type)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                    price_per_unit = EXCLUDED.price_per_unit,
                    notes = COALESCE(EXCLUDED.notes, cart_items.notes),
                    updated_at = NOW()
      RETURNING *
    `, [uuidv4(), req.user.id, listing_id, listing_type || 'supply', quantity, price_per_unit, notes]);

    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /cart/:id — update quantity
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) return res.status(400).json({ error: 'quantity required' });

    if (quantity <= 0) {
      await query(`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
      return res.json({ message: 'Item removed from cart' });
    }

    const result = await query(`
      UPDATE cart_items SET quantity = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3 RETURNING *
    `, [quantity, req.params.id, req.user.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cart/:id — remove specific item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cart — clear all cart items
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /cart/checkout — create orders from cart items
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { delivery_address, delivery_type = 'self_pickup', payment_method, notes } = req.body;
    if (!delivery_address) return res.status(400).json({ error: 'delivery_address required' });

    const cartResult = await query(
      `SELECT * FROM cart_items WHERE user_id = $1`,
      [req.user.id]
    );

    if (!cartResult.rows.length) return res.status(400).json({ error: 'Cart is empty' });

    const orderIds = [];
    let totalAmount = 0;

    for (const item of cartResult.rows) {
      const orderId = uuidv4();
      const itemTotal = item.quantity * item.price_per_unit;
      totalAmount += itemTotal;

      await query(`
        INSERT INTO orders (id, buyer_id, listing_id, listing_type, quantity, price_per_unit, total_amount, delivery_address, delivery_type, payment_method, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `, [orderId, req.user.id, item.listing_id, item.listing_type, item.quantity, item.price_per_unit, itemTotal, delivery_address, delivery_type, payment_method, notes || item.notes]);

      orderIds.push(orderId);
    }

    await query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);

    res.status(201).json({ order_ids: orderIds, total_amount: totalAmount, message: 'Checkout successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
