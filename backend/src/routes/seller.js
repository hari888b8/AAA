const express = require('express');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ── GET /seller/suggested-price — AI pricing suggestion ──────
router.get('/suggested-price', async (req, res) => {
  try {
    const { crop_id, district_id, quantity_kg } = req.query;
    if (!crop_id) return res.status(400).json({ error: 'crop_id is required' });

    const days = 7;
    let conditions = [`crop_id = $1`, `recorded_at >= NOW() - INTERVAL '${days} days'`];
    let params = [crop_id];
    let i = 2;

    if (district_id) {
      conditions.push(`district_id = $${i++}`);
      params.push(district_id);
    }

    const priceResult = await query(
      `SELECT price, recorded_at FROM price_feeds
       WHERE ${conditions.join(' AND ')}
       ORDER BY recorded_at DESC`,
      params
    );

    const prices = priceResult.rows.map(r => parseFloat(r.price));
    if (!prices.length) {
      return res.json({
        suggested_price: null,
        market_avg: null,
        price_range: { min: null, max: null },
        confidence: 0,
        data_points: 0,
        last_updated: null
      });
    }

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Bulk discount: 2% off for 1000+ kg, 5% for 5000+ kg, 8% for 10000+ kg
    let bulkFactor = 1.0;
    const qty = parseFloat(quantity_kg) || 0;
    if (qty >= 10000) bulkFactor = 0.92;
    else if (qty >= 5000) bulkFactor = 0.95;
    else if (qty >= 1000) bulkFactor = 0.98;

    const suggestedPrice = Math.round(avg * bulkFactor * 100) / 100;

    // Confidence based on data points
    const confidence = Math.min(prices.length / 10, 1.0);

    res.json({
      suggested_price: suggestedPrice,
      market_avg: Math.round(avg * 100) / 100,
      price_range: { min, max },
      confidence: Math.round(confidence * 100) / 100,
      data_points: prices.length,
      last_updated: priceResult.rows[0]?.recorded_at || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /seller/analytics — Seller dashboard stats ───────────
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;

    const [listingsRes, ordersRes, revenueRes, ratingsRes, inquiriesRes, recentOrdersRes] = await Promise.all([
      query(`SELECT COUNT(*) as total_listings FROM supply_listings WHERE farmer_id = $1`, [userId]),
      query(
        `SELECT COUNT(*) as total_orders FROM orders o
         JOIN supply_listings sl ON o.listing_id = sl.id
         WHERE sl.farmer_id = $1`, [userId]
      ),
      query(
        `SELECT COALESCE(SUM(o.total_amount), 0) as total_revenue FROM orders o
         JOIN supply_listings sl ON o.listing_id = sl.id
         WHERE sl.farmer_id = $1 AND o.status != 'cancelled'`, [userId]
      ),
      query(
        `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count
         FROM reviews WHERE target_type = 'user' AND target_id = $1`, [userId]
      ),
      query(
        `SELECT COUNT(*) as total_inquiries FROM buyer_inquiries bi
         JOIN supply_listings sl ON bi.listing_id = sl.id
         WHERE sl.farmer_id = $1`, [userId]
      ).catch(() => ({ rows: [{ total_inquiries: 0 }] })),
      query(
        `SELECT o.id, o.status, o.total_amount, o.created_at, c.name as crop_name, u.name as buyer_name
         FROM orders o
         JOIN supply_listings sl ON o.listing_id = sl.id
         LEFT JOIN crop_catalog c ON sl.crop_id = c.id
         LEFT JOIN users u ON o.buyer_id = u.id
         WHERE sl.farmer_id = $1
         ORDER BY o.created_at DESC LIMIT 5`, [userId]
      )
    ]);

    const totalListings = parseInt(listingsRes.rows[0]?.total_listings || 0);
    const totalOrders = parseInt(ordersRes.rows[0]?.total_orders || 0);
    const totalRevenue = parseFloat(revenueRes.rows[0]?.total_revenue || 0);
    const avgRating = parseFloat(ratingsRes.rows[0]?.avg_rating || 0);
    const totalInquiries = parseInt(inquiriesRes.rows[0]?.total_inquiries || 0);

    // Estimate views as 10x listings if no analytics table
    let totalViews = totalListings * 10;
    try {
      const viewsRes = await query(
        `SELECT COALESCE(SUM(views), 0) as total_views FROM seller_analytics WHERE user_id = $1`, [userId]
      );
      if (viewsRes.rows[0]?.total_views > 0) totalViews = parseInt(viewsRes.rows[0].total_views);
    } catch (_) { /* table may not exist */ }

    const conversionRate = totalInquiries > 0
      ? Math.round((totalOrders / totalInquiries) * 10000) / 100
      : 0;

    res.json({
      total_listings: totalListings,
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      total_views: totalViews,
      avg_rating: Math.round(avgRating * 10) / 10,
      conversion_rate: conversionRate,
      recent_orders: recentOrdersRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /seller/nudges — Sell-faster nudges ──────────────────
router.get('/nudges', async (req, res) => {
  try {
    const userId = req.user.id;
    const nudges = [];
    let nudgeId = 1;

    // 1. Buyer demand for user's crop types
    try {
      const demandRes = await query(
        `SELECT c.name as crop_name, COUNT(*) as buyer_count
         FROM buyer_inquiries bi
         JOIN crop_catalog c ON bi.crop_id = c.id
         WHERE bi.crop_id IN (SELECT DISTINCT crop_id FROM supply_listings WHERE farmer_id = $1)
           AND bi.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY c.name
         ORDER BY buyer_count DESC LIMIT 3`,
        [userId]
      );
      for (const row of demandRes.rows) {
        nudges.push({
          id: nudgeId++,
          type: 'demand',
          title: `${row.buyer_count} buyers looking for ${row.crop_name}`,
          subtitle: 'List now to connect with active buyers',
          icon: 'trending-up',
          action_route: '/seller/demand-matches',
          priority: 1
        });
      }
    } catch (_) { /* buyer_inquiries may not exist */ }

    // 2. Price trends — market price higher than listing price
    try {
      const priceAlertRes = await query(
        `SELECT sl.id as listing_id, c.name as crop_name, sl.price_per_kg as listing_price,
                AVG(pf.price) as market_price
         FROM supply_listings sl
         JOIN crop_catalog c ON sl.crop_id = c.id
         JOIN price_feeds pf ON pf.crop_id = sl.crop_id
           AND pf.recorded_at >= NOW() - INTERVAL '3 days'
         WHERE sl.farmer_id = $1 AND sl.status = 'active'
         GROUP BY sl.id, c.name, sl.price_per_kg
         HAVING AVG(pf.price) > sl.price_per_kg * 1.05`,
        [userId]
      );
      for (const row of priceAlertRes.rows) {
        nudges.push({
          id: nudgeId++,
          type: 'price_opportunity',
          title: `Market price up for ${row.crop_name}`,
          subtitle: 'Consider relisting at a higher price',
          icon: 'arrow-up-circle',
          action_route: `/seller/price-trends/${row.listing_id}`,
          priority: 2
        });
      }
    } catch (_) { /* tables may not exist */ }

    // 3. Unresponded inquiries
    try {
      const unreadRes = await query(
        `SELECT COUNT(*) as unread_count FROM buyer_inquiries bi
         JOIN supply_listings sl ON bi.listing_id = sl.id
         WHERE sl.farmer_id = $1 AND bi.status = 'pending'`,
        [userId]
      );
      const unreadCount = parseInt(unreadRes.rows[0]?.unread_count || 0);
      if (unreadCount > 0) {
        nudges.push({
          id: nudgeId++,
          type: 'unread_inquiries',
          title: `You have ${unreadCount} unread inquiries`,
          subtitle: 'Respond quickly to increase your conversion rate',
          icon: 'mail',
          action_route: '/seller/inquiries',
          priority: 1
        });
      }
    } catch (_) { /* table may not exist */ }

    // Sort by priority (lower = higher priority)
    nudges.sort((a, b) => a.priority - b.priority);

    res.json({ nudges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /seller/demand-matches — Match seller listings to buyer inquiries ──
router.get('/demand-matches', async (req, res) => {
  try {
    const userId = req.user.id;

    const matchesRes = await query(
      `SELECT bi.id as inquiry_id, u.name as buyer_name, c.name as crop_name,
              bi.quantity_kg as quantity_needed,
              COALESCE(
                ROUND(
                  (6371 * acos(
                    cos(radians(d1.latitude)) * cos(radians(d2.latitude)) *
                    cos(radians(d2.longitude) - radians(d1.longitude)) +
                    sin(radians(d1.latitude)) * sin(radians(d2.latitude))
                  ))::numeric, 1
                ), 0
              ) as distance_km
       FROM buyer_inquiries bi
       JOIN users u ON bi.buyer_id = u.id
       JOIN crop_catalog c ON bi.crop_id = c.id
       LEFT JOIN districts d1 ON bi.district_id = d1.id
       LEFT JOIN districts d2 ON d2.id = (
         SELECT district_id FROM supply_listings
         WHERE farmer_id = $1 AND crop_id = bi.crop_id AND status = 'active'
         LIMIT 1
       )
       WHERE bi.crop_id IN (SELECT DISTINCT crop_id FROM supply_listings WHERE farmer_id = $1 AND status = 'active')
         AND bi.status = 'active'
       ORDER BY distance_km ASC
       LIMIT 10`,
      [userId]
    );

    res.json({ matches: matchesRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /seller/price-trends/:cropId — Price history for a crop ──
router.get('/price-trends/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;

    const trendsRes = await query(
      `SELECT DATE(recorded_at) as date,
              ROUND(AVG(price)::numeric, 2) as avg_price,
              ROUND(MIN(price)::numeric, 2) as min_price,
              ROUND(MAX(price)::numeric, 2) as max_price
       FROM price_feeds
       WHERE crop_id = $1 AND recorded_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(recorded_at)
       ORDER BY date ASC`,
      [cropId]
    );

    // Determine trend direction from first half vs second half averages
    let trend = 'stable';
    const rows = trendsRes.rows;
    if (rows.length >= 4) {
      const mid = Math.floor(rows.length / 2);
      const firstHalf = rows.slice(0, mid);
      const secondHalf = rows.slice(mid);
      const avgFirst = firstHalf.reduce((s, r) => s + parseFloat(r.avg_price), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, r) => s + parseFloat(r.avg_price), 0) / secondHalf.length;
      const change = (avgSecond - avgFirst) / avgFirst;
      if (change > 0.03) trend = 'up';
      else if (change < -0.03) trend = 'down';
    }

    res.json({
      crop_id: cropId,
      days: 30,
      trend,
      prices: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
