const { pool } = require('../db/pool');

/**
 * Unified Matching Engine for KisanConnect 2.0
 * Intelligent matching for logistics, delivery, and gig workers
 * based on distance, rating, price, and availability.
 */

const DISTANCE_FORMULA = `
  SQRT(POW(69.1 * (location_lat - $1), 2) + POW(69.1 * (location_lng - $2) * COS(location_lat / 57.3), 2)) * 1.60934
`;

async function findNearbyDrivers({ lat, lng, radiusKm = 20, vehicleType, minRating = 0, limit = 10 }) {
  try {
    const distanceExpr = DISTANCE_FORMULA.trim();
    let paramIndex = 3;
    const params = [lat, lng];
    const conditions = [
      `availability_status = 'available'`,
      `(${distanceExpr}) <= $${paramIndex++}`,
      `rating >= $${paramIndex++}`
    ];
    params.push(radiusKm, minRating);

    if (vehicleType) {
      conditions.push(`vehicle_type = $${paramIndex++}`);
      params.push(vehicleType);
    }

    params.push(limit);

    const query = `
      SELECT
        vehicle_id,
        owner_id,
        vehicle_type,
        (${distanceExpr}) AS distance_km,
        rating,
        pricing_per_km,
        capacity_kg
      FROM vehicles
      WHERE ${conditions.join(' AND ')}
      ORDER BY distance_km ASC, rating DESC, total_trips DESC
      LIMIT $${paramIndex}
    `;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('findNearbyDrivers error:', error);
    throw error;
  }
}

async function findNearbyWorkers({ lat, lng, radiusKm = 15, workerType, minRating = 0, limit = 10 }) {
  try {
    const distanceExpr = DISTANCE_FORMULA.trim();
    let paramIndex = 3;
    const params = [lat, lng];
    const conditions = [
      `is_available = true`,
      `(${distanceExpr}) <= $${paramIndex++}`,
      `rating >= $${paramIndex++}`
    ];
    params.push(radiusKm, minRating);

    if (workerType) {
      conditions.push(`worker_type = $${paramIndex++}`);
      params.push(workerType);
    }

    params.push(limit);

    const query = `
      SELECT
        worker_id,
        user_id,
        worker_type,
        (${distanceExpr}) AS distance_km,
        rating,
        hourly_rate,
        daily_rate
      FROM gig_workers
      WHERE ${conditions.join(' AND ')}
      ORDER BY distance_km ASC, rating DESC, total_jobs DESC
      LIMIT $${paramIndex}
    `;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('findNearbyWorkers error:', error);
    throw error;
  }
}

async function matchLogisticsRequest(requestId) {
  try {
    const reqResult = await pool.query(
      'SELECT * FROM logistics_requests WHERE request_id = $1',
      [requestId]
    );
    const request = reqResult.rows[0];
    if (!request) throw new Error(`Logistics request ${requestId} not found`);

    const drivers = await findNearbyDrivers({
      lat: request.pickup_lat,
      lng: request.pickup_lng,
      vehicleType: request.vehicle_type_needed,
      limit: 5
    });

    const matches = [];
    for (const driver of drivers) {
      const offeredPrice = driver.distance_km * (driver.pricing_per_km || 15);
      const matchResult = await pool.query(
        `INSERT INTO logistics_matches (request_id, vehicle_id, driver_id, status, offered_price, distance_km)
         VALUES ($1, $2, $3, 'offered', $4, $5)
         RETURNING *`,
        [requestId, driver.vehicle_id, driver.owner_id, offeredPrice, driver.distance_km]
      );
      matches.push(matchResult.rows[0]);
    }

    await pool.query(
      `UPDATE logistics_requests SET status = 'matching' WHERE request_id = $1`,
      [requestId]
    );

    return matches;
  } catch (error) {
    console.error('matchLogisticsRequest error:', error);
    throw error;
  }
}

async function matchDeliveryOrder(orderId) {
  try {
    const orderResult = await pool.query(
      'SELECT * FROM delivery_orders WHERE order_id = $1',
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) throw new Error(`Delivery order ${orderId} not found`);

    const drivers = await findNearbyDrivers({
      lat: order.pickup_lat,
      lng: order.pickup_lng,
      vehicleType: 'bike',
      limit: 5
    });

    if (drivers.length < 5) {
      const moreDrivers = await findNearbyDrivers({
        lat: order.pickup_lat,
        lng: order.pickup_lng,
        vehicleType: 'three_wheeler',
        limit: 5 - drivers.length
      });
      drivers.push(...moreDrivers);
    }

    return drivers.slice(0, 5);
  } catch (error) {
    console.error('matchDeliveryOrder error:', error);
    throw error;
  }
}

async function matchGigBooking({ lat, lng, workerType, bookingType }) {
  try {
    const workers = await findNearbyWorkers({
      lat,
      lng,
      workerType,
      limit: 10
    });

    return workers.sort((a, b) => {
      const scoreA = (1 / (a.distance_km || 1)) * a.rating;
      const scoreB = (1 / (b.distance_km || 1)) * b.rating;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('matchGigBooking error:', error);
    throw error;
  }
}

async function acceptMatch(matchId, driverId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const matchResult = await client.query(
      `UPDATE logistics_matches SET status = 'accepted' WHERE match_id = $1 AND driver_id = $2 RETURNING *`,
      [matchId, driverId]
    );
    const match = matchResult.rows[0];
    if (!match) throw new Error(`Match ${matchId} not found or not assigned to driver ${driverId}`);

    await client.query(
      `UPDATE logistics_requests SET status = 'matched', matched_vehicle_id = $1, matched_driver_id = $2
       WHERE request_id = $3`,
      [match.vehicle_id, driverId, match.request_id]
    );

    await client.query(
      `UPDATE logistics_matches SET status = 'expired'
       WHERE request_id = $1 AND match_id != $2`,
      [match.request_id, matchId]
    );

    await client.query(
      `UPDATE vehicles SET availability_status = 'busy' WHERE vehicle_id = $1`,
      [match.vehicle_id]
    );

    await client.query('COMMIT');
    return match;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('acceptMatch error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function completeTrip(requestId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqResult = await client.query(
      `UPDATE logistics_requests SET status = 'completed' WHERE request_id = $1 RETURNING *`,
      [requestId]
    );
    const request = reqResult.rows[0];
    if (!request) throw new Error(`Logistics request ${requestId} not found`);

    if (request.matched_vehicle_id) {
      await client.query(
        `UPDATE vehicles SET availability_status = 'available', total_trips = total_trips + 1
         WHERE vehicle_id = $1`,
        [request.matched_vehicle_id]
      );
    }

    await client.query('COMMIT');
    return request;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('completeTrip error:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  findNearbyDrivers,
  findNearbyWorkers,
  matchLogisticsRequest,
  matchDeliveryOrder,
  matchGigBooking,
  acceptMatch,
  completeTrip
};
