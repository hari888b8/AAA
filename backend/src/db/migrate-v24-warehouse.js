/**
 * Migration V24 — Warehouse & Cold Storage Management
 * Tables: warehouses, warehouse_bookings, warehouse_receipts,
 *         warehouse_quality_inspections, warehouse_temperature_logs,
 *         warehouse_alerts, warehouse_bills
 */
'use strict';

const { pool } = require('./pool');

async function migrateV24Warehouse() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── Warehouses ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID,
        name VARCHAR(200) NOT NULL,
        warehouse_type VARCHAR(50) NOT NULL,
        capacity_tonnes DECIMAL(12,2) NOT NULL,
        available_tonnes DECIMAL(12,2),
        district VARCHAR(100),
        address TEXT,
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        amenities JSONB DEFAULT '[]',
        certifications JSONB DEFAULT '[]',
        temperature_range JSONB DEFAULT '{}',
        humidity_range JSONB DEFAULT '{}',
        rate_per_tonne_day DECIMAL(8,2) DEFAULT 5.0,
        contact_phone VARCHAR(15),
        rating DECIMAL(3,2) DEFAULT 0,
        total_bookings INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Bookings ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouse_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID REFERENCES warehouses(id),
        farmer_id UUID,
        crop_id UUID,
        quantity_tonnes DECIMAL(10,2) NOT NULL,
        storage_type VARCHAR(30) DEFAULT 'ambient',
        start_date DATE NOT NULL,
        expected_end_date DATE,
        actual_end_date DATE,
        rate_per_tonne_day DECIMAL(8,2),
        status VARCHAR(30) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Warehouse Receipts ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouse_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES warehouse_bookings(id),
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        warehouse_id UUID REFERENCES warehouses(id),
        farmer_id UUID,
        crop_id UUID,
        quantity_tonnes DECIMAL(10,2) NOT NULL,
        grade VARCHAR(10),
        moisture_pct DECIMAL(5,2),
        quality_params JSONB DEFAULT '{}',
        photos JSONB DEFAULT '[]',
        current_value DECIMAL(14,2) DEFAULT 0,
        is_pledged BOOLEAN DEFAULT false,
        pledged_to VARCHAR(200),
        pledge_amount DECIMAL(14,2),
        pledged_at TIMESTAMPTZ,
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Quality Inspections ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouse_quality_inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES warehouse_bookings(id),
        inspector_name VARCHAR(200),
        grade VARCHAR(10) NOT NULL,
        parameters JSONB DEFAULT '{}',
        moisture_pct DECIMAL(5,2),
        foreign_matter_pct DECIMAL(5,2),
        damaged_pct DECIMAL(5,2),
        photos JSONB DEFAULT '[]',
        notes TEXT,
        inspected_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Temperature Logs ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouse_temperature_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID REFERENCES warehouses(id),
        zone_id VARCHAR(50),
        temperature DECIMAL(5,2) NOT NULL,
        humidity DECIMAL(5,2),
        sensor_id VARCHAR(50),
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Alerts ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouse_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id UUID REFERENCES warehouses(id),
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'warning',
        message TEXT,
        value DECIMAL(10,2),
        threshold JSONB,
        acknowledged BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Bills ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouse_bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES warehouse_bookings(id),
        warehouse_id UUID REFERENCES warehouses(id),
        farmer_id UUID,
        days_stored INTEGER NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        gst DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        payment_status VARCHAR(30) DEFAULT 'pending',
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Indexes ─────────────────────────────────────────────
    await client.query('CREATE INDEX IF NOT EXISTS idx_warehouses_district ON warehouses(district, is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(warehouse_type, available_tonnes)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wh_bookings_farmer ON warehouse_bookings(farmer_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wh_bookings_warehouse ON warehouse_bookings(warehouse_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wh_receipts_farmer ON warehouse_receipts(farmer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wh_temp_logs ON warehouse_temperature_logs(warehouse_id, recorded_at)');

    // ─── Seed Warehouses ─────────────────────────────────────
    await client.query(`
      INSERT INTO warehouses (name, warehouse_type, capacity_tonnes, available_tonnes, district, address, rate_per_tonne_day, is_verified, amenities, certifications, temperature_range)
      VALUES
        ('Krishna Cold Storage', 'cold_storage', 5000, 3200, 'Krishna', 'Vijayawada-Guntur Highway, NH16', 12.0, true,
         '["weighbridge","loading_dock","24x7_security","cctv","fire_safety"]',
         '["FSSAI","WDRA"]', '{"min": -2, "max": 4}'),
        ('Nellore Agri Warehouse', 'ambient', 10000, 7500, 'Nellore', 'Muthukur Road, Nellore', 5.0, true,
         '["weighbridge","fumigation","grading","packaging","loading_dock"]',
         '["WDRA","CWC"]', '{}'),
        ('Guntur Commodity Hub', 'ambient', 15000, 9000, 'Guntur', 'Chilakaluripet Road, Guntur', 4.5, true,
         '["weighbridge","grading","auction_hall","bank_counter","loading_dock"]',
         '["WDRA","APMC"]', '{}'),
        ('Prakasam Frozen Hub', 'frozen', 2000, 1500, 'Prakasam', 'Ongole Industrial Area', 18.0, true,
         '["blast_freezer","weighbridge","loading_dock","generator","cctv"]',
         '["FSSAI","MPEDA","EU_approved"]', '{"min": -25, "max": -18}'),
        ('East Godavari Rice Godown', 'ambient', 8000, 5000, 'East Godavari', 'Kakinada Port Road', 4.0, true,
         '["weighbridge","fumigation","drying_yard","packaging"]',
         '["WDRA","FCI"]', '{}'),
        ('West Godavari Fish Cold Store', 'cold_storage', 3000, 2000, 'West Godavari', 'Bhimavaram Fish Market', 15.0, true,
         '["ice_plant","weighbridge","grading","packaging","generator"]',
         '["FSSAI","MPEDA"]', '{"min": -2, "max": 2}'),
        ('Kurnool Grain Depot', 'ambient', 20000, 14000, 'Kurnool', 'Kurnool-Ongole Highway', 3.5, true,
         '["weighbridge","fumigation","grading","rail_siding","loading_dock"]',
         '["WDRA","CWC","FCI"]', '{}'),
        ('Anantapur Groundnut Store', 'controlled_atmosphere', 5000, 3800, 'Anantapur', 'Anantapur APMC Yard', 8.0, true,
         '["weighbridge","grading","co2_control","humidity_control"]',
         '["WDRA","organic_certified"]', '{"min": 15, "max": 20}')
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V24 (Warehouse & Cold Storage Management) complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V24 failed:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV24Warehouse };
