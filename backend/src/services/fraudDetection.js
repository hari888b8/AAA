'use strict';

/**
 * Fraud Detection Service
 * Automatically flags listings with abnormal pricing (>2 std deviations from market)
 * and detects other suspicious patterns.
 */

const { query } = require('../db/pool');
const logger = require('../lib/logger');

/**
 * Check if a listing price is anomalous compared to market data.
 * Flags listings where price deviates >2 standard deviations from the market average.
 *
 * @param {string} cropId - The crop catalog ID
 * @param {number} pricePerKg - The listing's price per kg
 * @returns {Object} { isAnomaly, deviation, marketAvg, marketStdDev, severity }
 */
async function checkPriceAnomaly(cropId, pricePerKg) {
  try {
    const result = await query(`
      SELECT
        AVG(price_per_quintal / 100.0) AS avg_price_kg,
        STDDEV(price_per_quintal / 100.0) AS stddev_price_kg,
        COUNT(*) AS data_points
      FROM price_feeds
      WHERE crop_id = $1
        AND recorded_at > NOW() - INTERVAL '30 days'
    `, [cropId]);

    const stats = result.rows[0];
    if (!stats || !stats.avg_price_kg || stats.data_points < 3) {
      return { isAnomaly: false, reason: 'insufficient_data' };
    }

    const avg = parseFloat(stats.avg_price_kg);
    const stddev = parseFloat(stats.stddev_price_kg) || avg * 0.1;
    const deviation = Math.abs(pricePerKg - avg) / stddev;

    let severity = 'none';
    if (deviation > 3) severity = 'high';
    else if (deviation > 2) severity = 'medium';

    return {
      isAnomaly: deviation > 2,
      deviation: Math.round(deviation * 100) / 100,
      marketAvg: Math.round(avg * 100) / 100,
      marketStdDev: Math.round(stddev * 100) / 100,
      severity,
      direction: pricePerKg > avg ? 'above' : 'below',
    };
  } catch (err) {
    logger.error({ err, cropId }, 'Price anomaly check failed');
    return { isAnomaly: false, error: err.message };
  }
}

/**
 * Auto-flag a listing if price is anomalous.
 * Inserts into fraud_flags table.
 */
async function autoFlagListing(listingId, listingType, cropId, pricePerKg) {
  const result = await checkPriceAnomaly(cropId, pricePerKg);

  if (result.isAnomaly) {
    try {
      await query(`
        INSERT INTO fraud_flags (target_type, target_id, flag_type, severity, details)
        VALUES ($1, $2, 'price_anomaly', $3, $4)
        ON CONFLICT DO NOTHING
      `, [
        listingType,
        listingId,
        result.severity,
        JSON.stringify({
          price_listed: pricePerKg,
          market_avg: result.marketAvg,
          deviation: result.deviation,
          direction: result.direction,
        }),
      ]);

      logger.warn({
        listingId,
        severity: result.severity,
        deviation: result.deviation,
      }, 'Listing auto-flagged for price anomaly');
    } catch (err) {
      logger.error({ err }, 'Failed to insert fraud flag');
    }
  }

  return result;
}

/**
 * Check for duplicate listings (same user, same crop, similar details within 24h)
 */
async function checkDuplicateListing(userId, cropId, quantityKg) {
  try {
    const result = await query(`
      SELECT COUNT(*) AS count FROM supply_listings
      WHERE farmer_id = $1 AND crop_id = $2
        AND ABS(quantity_kg - $3) < $3 * 0.1
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status = 'active'
    `, [userId, cropId, quantityKg]);

    return { isDuplicate: parseInt(result.rows[0].count) > 0 };
  } catch (err) {
    return { isDuplicate: false };
  }
}

/**
 * Calculate user risk score based on flagging history
 */
async function getUserRiskScore(userId) {
  try {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE resolved = false) AS unresolved_flags,
        COUNT(*) FILTER (WHERE severity = 'high') AS high_severity,
        COUNT(*) AS total_flags
      FROM fraud_flags
      WHERE target_type = 'user' AND target_id = $1
    `, [userId]);

    const stats = result.rows[0];
    const score = Math.min(100,
      (parseInt(stats.unresolved_flags) || 0) * 20 +
      (parseInt(stats.high_severity) || 0) * 30 +
      (parseInt(stats.total_flags) || 0) * 5
    );

    return { riskScore: score, ...stats };
  } catch (err) {
    return { riskScore: 0 };
  }
}

module.exports = {
  checkPriceAnomaly,
  autoFlagListing,
  checkDuplicateListing,
  getUserRiskScore,
};
