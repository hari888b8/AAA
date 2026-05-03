const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { createNotification } = require('./pushnotifications');
const router = express.Router();

// GET /booking/availability/:providerId — get available slots for a provider in a given month
router.get('/availability/:providerId', authMiddleware, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { year, month, equipment_id, service_type } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    let conditions = ['s.provider_id = $1', 's.date >= $2', 's.date <= $3', 's.is_booked = false'];
    let params = [providerId, startDate, endDateStr];
    let idx = 4;

    if (equipment_id) {
      conditions.push(`s.equipment_id = $${idx}`);
      params.push(equipment_id);
      idx++;
    }
    if (service_type) {
      conditions.push(`s.service_type = $${idx}`);
      params.push(service_type);
      idx++;
    }

    const slotsResult = await query(`
      SELECT s.id, s.date, s.start_time, s.end_time, s.price_per_slot,
             s.equipment_id, s.service_type
      FROM availability_slots s
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.date, s.start_time
    `, params);

    const providerResult = await query(
      'SELECT name FROM users WHERE id = $1', [providerId]
    );
    const providerName = providerResult.rows.length ? providerResult.rows[0].name : null;

    res.json({ slots: slotsResult.rows, provider_name: providerName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /booking/availability — provider sets their availability slots
router.post('/availability', authMiddleware, async (req, res) => {
  try {
    const { equipment_id, service_type, slots } = req.body;
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'slots array is required' });
    }

    let created = 0;
    for (const slot of slots) {
      const { date, start_time, end_time, price_per_slot } = slot;
      if (!date || !start_time || !end_time) continue;

      await query(`
        INSERT INTO availability_slots (id, provider_id, equipment_id, service_type, date, start_time, end_time, price_per_slot, is_booked)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
      `, [uuidv4(), req.user.id, equipment_id || null, service_type || null, date, start_time, end_time, price_per_slot || null]);
      created++;
    }

    res.json({ created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /booking/book — customer books an available slot
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { slot_id, service_type, location_label, lat, lng, notes } = req.body;
    if (!slot_id) return res.status(400).json({ error: 'slot_id is required' });

    // Validate slot exists and is not booked
    const slotResult = await query(
      'SELECT * FROM availability_slots WHERE id = $1', [slot_id]
    );
    if (!slotResult.rows.length) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    const slot = slotResult.rows[0];
    if (slot.is_booked) {
      return res.status(409).json({ error: 'Slot is already booked' });
    }

    const bookingId = uuidv4();
    await query(`
      INSERT INTO service_bookings (id, slot_id, customer_id, provider_id, service_type, location_label, lat, lng, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'requested', NOW())
    `, [bookingId, slot_id, req.user.id, slot.provider_id, service_type || slot.service_type, location_label || null, lat || null, lng || null, notes || null]);

    // Mark slot as booked
    await query('UPDATE availability_slots SET is_booked = true WHERE id = $1', [slot_id]);

    // Notify provider
    await createNotification(
      slot.provider_id,
      'booking_request',
      'New Booking Request',
      `You have a new service booking request.`,
      { booking_id: bookingId }
    );

    const bookingResult = await query('SELECT * FROM service_bookings WHERE id = $1', [bookingId]);
    res.status(201).json(bookingResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /booking/:id/status — provider or customer updates booking status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const bookingResult = await query('SELECT * FROM service_bookings WHERE id = $1', [id]);
    if (!bookingResult.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult.rows[0];

    // Authorization: only provider or customer can update
    const isProvider = req.user.id === booking.provider_id;
    const isCustomer = req.user.id === booking.customer_id;
    if (!isProvider && !isCustomer) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }
    // Customer can only cancel
    if (isCustomer && status !== 'cancelled') {
      return res.status(403).json({ error: 'Customers can only cancel bookings' });
    }

    await query('UPDATE service_bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);

    // If cancelled, mark slot as available again
    if (status === 'cancelled') {
      await query('UPDATE availability_slots SET is_booked = false WHERE id = $1', [booking.slot_id]);
    }

    // Notify the other party
    const notifyUserId = isProvider ? booking.customer_id : booking.provider_id;
    await createNotification(
      notifyUserId,
      'booking_status',
      'Booking Status Updated',
      `Your booking has been updated to: ${status}`,
      { booking_id: id, status }
    );

    const updated = await query('SELECT * FROM service_bookings WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /booking/my — get user's bookings as customer or provider
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { role = 'customer', status } = req.query;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (role === 'provider') {
      conditions.push(`b.provider_id = $${idx}`);
    } else {
      conditions.push(`b.customer_id = $${idx}`);
    }
    params.push(req.user.id);
    idx++;

    if (status) {
      conditions.push(`b.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const result = await query(`
      SELECT b.*,
             s.date AS slot_date, s.start_time AS slot_start_time, s.end_time AS slot_end_time,
             s.price_per_slot, s.equipment_id,
             CASE WHEN $${idx} = 'provider' THEN cu.name ELSE pu.name END AS other_party_name,
             CASE WHEN $${idx} = 'provider' THEN cu.phone ELSE pu.phone END AS other_party_phone
      FROM service_bookings b
      LEFT JOIN availability_slots s ON s.id = b.slot_id
      LEFT JOIN users cu ON cu.id = b.customer_id
      LEFT JOIN users pu ON pu.id = b.provider_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.created_at DESC
    `, [...params, role]);

    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /booking/:id — get single booking with full details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT b.*,
             s.date AS slot_date, s.start_time AS slot_start_time, s.end_time AS slot_end_time,
             s.price_per_slot, s.equipment_id,
             cu.name AS customer_name, cu.phone AS customer_phone,
             pu.name AS provider_name, pu.phone AS provider_phone
      FROM service_bookings b
      LEFT JOIN availability_slots s ON s.id = b.slot_id
      LEFT JOIN users cu ON cu.id = b.customer_id
      LEFT JOIN users pu ON pu.id = b.provider_id
      WHERE b.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];
    if (req.user.id !== booking.customer_id && req.user.id !== booking.provider_id) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /booking/availability/:slotId — provider deletes an unbooked slot
router.delete('/availability/:slotId', authMiddleware, async (req, res) => {
  try {
    const { slotId } = req.params;

    const slotResult = await query(
      'SELECT * FROM availability_slots WHERE id = $1', [slotId]
    );
    if (!slotResult.rows.length) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    const slot = slotResult.rows[0];

    if (slot.provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this slot' });
    }
    if (slot.is_booked) {
      return res.status(409).json({ error: 'Cannot delete a booked slot' });
    }

    await query('DELETE FROM availability_slots WHERE id = $1', [slotId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
