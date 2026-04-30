/**
 * Background Scheduler
 * Runs periodic tasks: listing expiry, subscription renewal, watchlist alerts, etc.
 * Uses setInterval-based scheduling (production would use Trigger.dev or BullMQ)
 */

const { pool } = require('../db/pool');
const { createNotification } = require('../routes/pushnotifications');

const INTERVALS = {
  LISTING_EXPIRY: 60 * 60 * 1000,          // Every hour
  SUBSCRIPTION_CHECK: 6 * 60 * 60 * 1000,  // Every 6 hours
  WATCHLIST_ALERTS: 30 * 60 * 1000,        // Every 30 minutes
  HARVEST_REMINDERS: 24 * 60 * 60 * 1000,  // Every day
  STALE_CLEANUP: 24 * 60 * 60 * 1000,      // Every day
};

// ─── Expire old listings ─────────────────────────────────────────────────────
async function expireListings() {
  try {
    // Supply listings older than 60 days
    const { rows: expired } = await pool.query(
      `UPDATE supply_listings SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND created_at < NOW() - INTERVAL '60 days'
       RETURNING id, user_id`
    ).catch(() => ({ rows: [] }));

    for (const listing of expired) {
      await createNotification(listing.user_id, 'listing_expired',
        'Your listing has expired. Renew it to keep receiving inquiries.',
        { listing_id: listing.id }).catch(() => {});
    }

    // Expire harvest listings past harvest date + 14 days
    await pool.query(
      `UPDATE harvest_listings SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND harvest_date < NOW() - INTERVAL '14 days'`
    ).catch(() => {});

    // Expire jobs past expiry date
    await pool.query(
      `UPDATE jobs SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND expires_at < CURRENT_DATE`
    ).catch(() => {});

    if (expired.length > 0) {
      console.log(`[Scheduler] Expired ${expired.length} listings`);
    }
  } catch (e) {
    console.error('[Scheduler] expireListings error:', e.message);
  }
}

// ─── Check subscription expiry ───────────────────────────────────────────────
async function checkSubscriptions() {
  try {
    // Expire subscriptions past their expiry date
    const { rows: expiring } = await pool.query(
      `UPDATE user_subscriptions SET status = 'expired'
       WHERE status = 'active' AND expires_at < NOW()
       RETURNING user_id`
    ).catch(() => ({ rows: [] }));

    for (const sub of expiring) {
      await createNotification(sub.user_id, 'subscription_expired',
        'Your subscription has expired. Renew to continue premium access.',
        {}).catch(() => {});
    }

    // Warn users whose subscription expires in 3 days
    const { rows: warning } = await pool.query(
      `SELECT user_id FROM user_subscriptions
       WHERE status = 'active' AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
       AND user_id NOT IN (
         SELECT DISTINCT entity_id::UUID FROM notifications
         WHERE type = 'subscription_expiring' AND created_at > NOW() - INTERVAL '3 days'
       )`
    ).catch(() => ({ rows: [] }));

    for (const sub of warning) {
      await createNotification(sub.user_id, 'subscription_expiring',
        'Your subscription expires in 3 days. Renew now to avoid interruption.',
        {}).catch(() => {});
    }
  } catch (e) {
    console.error('[Scheduler] checkSubscriptions error:', e.message);
  }
}

// ─── Process watchlist alerts ────────────────────────────────────────────────
async function processWatchlists() {
  try {
    // Price watchlists: check if price crossed threshold
    const { rows: priceWatches } = await pool.query(
      `SELECT w.*, c.name AS crop_name 
       FROM user_watchlists w
       JOIN crop_catalog c ON w.crop_id = c.id
       WHERE w.is_active = TRUE AND w.watch_type = 'crop_price'
       AND (w.last_triggered IS NULL OR w.last_triggered < NOW() - INTERVAL '6 hours')`
    ).catch(() => ({ rows: [] }));

    for (const watch of priceWatches) {
      const conditions = watch.conditions || {};
      const { rows: prices } = await pool.query(
        `SELECT price_per_quintal FROM price_feeds 
         WHERE crop_id = $1 ORDER BY fetched_at DESC LIMIT 1`,
        [watch.crop_id]
      ).catch(() => ({ rows: [] }));

      if (prices.length === 0) continue;

      const currentPrice = prices[0].price_per_quintal;
      let triggered = false;

      if (conditions.price_below && currentPrice < conditions.price_below) triggered = true;
      if (conditions.price_above && currentPrice > conditions.price_above) triggered = true;

      if (triggered) {
        await pool.query(
          `UPDATE user_watchlists SET last_triggered = NOW() WHERE id = $1`,
          [watch.id]
        );
        await createNotification(watch.user_id, 'price_alert',
          `${watch.crop_name} price is now ₹${currentPrice}/quintal`,
          { crop_id: watch.crop_id, price: currentPrice }).catch(() => {});
      }
    }

    // Supply watchlists: check for new listings in watched regions
    const { rows: supplyWatches } = await pool.query(
      `SELECT w.* FROM user_watchlists w
       WHERE w.is_active = TRUE AND w.watch_type = 'supply'
       AND (w.last_triggered IS NULL OR w.last_triggered < NOW() - INTERVAL '12 hours')`
    ).catch(() => ({ rows: [] }));

    for (const watch of supplyWatches) {
      let conditions_sql = '1=1';
      const params = [];
      let i = 1;
      if (watch.crop_id) { conditions_sql += ` AND crop_id = $${i++}`; params.push(watch.crop_id); }
      if (watch.district_id) { conditions_sql += ` AND district_id = $${i++}`; params.push(watch.district_id); }

      const { rows: newListings } = await pool.query(
        `SELECT COUNT(*) AS cnt FROM supply_listings 
         WHERE status = 'active' AND ${conditions_sql} 
         AND created_at > $${i}`,
        [...params, watch.last_triggered || new Date(Date.now() - 24 * 60 * 60 * 1000)]
      ).catch(() => ({ rows: [{ cnt: 0 }] }));

      if (parseInt(newListings[0].cnt) > 0) {
        await pool.query(`UPDATE user_watchlists SET last_triggered = NOW() WHERE id = $1`, [watch.id]);
        await createNotification(watch.user_id, 'supply_alert',
          `${newListings[0].cnt} new listings match your watchlist`,
          { watch_id: watch.id }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[Scheduler] processWatchlists error:', e.message);
  }
}

// ─── Harvest reminders (T-15 days) ──────────────────────────────────────────
async function sendHarvestReminders() {
  try {
    const { rows } = await pool.query(
      `SELECT d.user_id, d.crop_id, c.name AS crop_name, d.expected_harvest_date
       FROM declarations d
       JOIN crop_catalog c ON d.crop_id = c.id
       WHERE d.expected_harvest_date BETWEEN CURRENT_DATE + INTERVAL '14 days' AND CURRENT_DATE + INTERVAL '16 days'
       AND d.user_id NOT IN (
         SELECT DISTINCT entity_id::UUID FROM notifications
         WHERE type = 'harvest_reminder' AND created_at > NOW() - INTERVAL '7 days'
       )`
    ).catch(() => ({ rows: [] }));

    for (const decl of rows) {
      await createNotification(decl.user_id, 'harvest_reminder',
        `Your ${decl.crop_name} harvest is expected in ~15 days. Start planning!`,
        { crop_id: decl.crop_id }).catch(() => {});
    }

    if (rows.length > 0) console.log(`[Scheduler] Sent ${rows.length} harvest reminders`);
  } catch (e) {
    console.error('[Scheduler] sendHarvestReminders error:', e.message);
  }
}

// ─── Cleanup stale data ──────────────────────────────────────────────────────
async function cleanupStale() {
  try {
    // Delete expired OTPs
    await pool.query(`DELETE FROM otps WHERE expires_at < NOW() - INTERVAL '1 hour'`).catch(() => {});
    // Delete old read notifications (>90 days)
    await pool.query(`DELETE FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '90 days'`).catch(() => {});
    // Delete expired equipment availability blocks from the past
    await pool.query(`DELETE FROM equipment_availability WHERE blocked_date < CURRENT_DATE - INTERVAL '30 days'`).catch(() => {});
    console.log('[Scheduler] Cleanup complete');
  } catch (e) {
    console.error('[Scheduler] cleanupStale error:', e.message);
  }
}

// ─── Start all scheduled tasks ───────────────────────────────────────────────
function startScheduler() {
  console.log('[Scheduler] Starting background scheduler...');

  // Stagger initial runs to avoid thundering herd
  setTimeout(expireListings, 5000);
  setTimeout(checkSubscriptions, 10000);
  setTimeout(processWatchlists, 15000);
  setTimeout(sendHarvestReminders, 20000);
  setTimeout(cleanupStale, 25000);

  // Set recurring intervals
  setInterval(expireListings, INTERVALS.LISTING_EXPIRY);
  setInterval(checkSubscriptions, INTERVALS.SUBSCRIPTION_CHECK);
  setInterval(processWatchlists, INTERVALS.WATCHLIST_ALERTS);
  setInterval(sendHarvestReminders, INTERVALS.HARVEST_REMINDERS);
  setInterval(cleanupStale, INTERVALS.STALE_CLEANUP);
}

module.exports = { startScheduler };
