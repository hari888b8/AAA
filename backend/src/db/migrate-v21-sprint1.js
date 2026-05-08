'use strict';

/**
 * Migration V21 — Sprint 1 New Features
 * Adds tables for: aqua listing offers, service marketplace, contact unlocks,
 * property visits, AgriFlow listing offers, and extended property fields.
 */

const { pool } = require('./pool');

async function migrateV21Sprint1() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── Aqua Listing Offers (bid/offer system on harvest listings) ────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_listing_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id UUID NOT NULL,
        buyer_id UUID NOT NULL,
        offered_price DECIMAL(12,2) NOT NULL,
        quantity_kg DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        message TEXT,
        counter_price DECIMAL(12,2),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_aqua_listing_offers_listing_id ON aqua_listing_offers(listing_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_listing_offers_buyer_id ON aqua_listing_offers(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_listing_offers_status ON aqua_listing_offers(status);
    `);

    // ─── Service Listings (KisanConnect rural services marketplace) ────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        base_rate DECIMAL(10,2),
        rate_unit VARCHAR(30) NOT NULL DEFAULT 'per_day',
        location_label VARCHAR(200),
        district_id INTEGER REFERENCES districts(id),
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        availability TEXT[],
        rating DECIMAL(3,2) NOT NULL DEFAULT 0,
        total_bookings INTEGER NOT NULL DEFAULT 0,
        is_available BOOLEAN NOT NULL DEFAULT true,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        photos TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_service_listings_provider_id ON service_listings(provider_id);
      CREATE INDEX IF NOT EXISTS idx_service_listings_service_type ON service_listings(service_type);
      CREATE INDEX IF NOT EXISTS idx_service_listings_district_id ON service_listings(district_id);
    `);

    // ─── Service Bookings (service booking flow) ───────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID NOT NULL REFERENCES service_listings(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL,
        date DATE NOT NULL,
        time_slot VARCHAR(50),
        address TEXT,
        notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'requested',
        total_amount DECIMAL(12,2),
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        otp_code VARCHAR(10),
        completed_at TIMESTAMPTZ,
        customer_rating DECIMAL(3,2),
        customer_review TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id ON service_bookings(service_id);
      CREATE INDEX IF NOT EXISTS idx_service_bookings_customer_id ON service_bookings(customer_id);
      CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
    `);

    // ─── Contact Unlocks (FarmerConnect contact unlock system) ────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_unlocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        property_id UUID NOT NULL,
        unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, property_id)
      );
      CREATE INDEX IF NOT EXISTS idx_contact_unlocks_user_id ON contact_unlocks(user_id);
      CREATE INDEX IF NOT EXISTS idx_contact_unlocks_property_id ON contact_unlocks(property_id);
    `);

    // ─── Property Visits (FarmerConnect visit scheduling) ─────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS property_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL,
        buyer_id UUID NOT NULL,
        proposed_times JSONB NOT NULL DEFAULT '[]',
        confirmed_time TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'requested',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON property_visits(property_id);
      CREATE INDEX IF NOT EXISTS idx_property_visits_buyer_id ON property_visits(buyer_id);
    `);

    // ─── Listing Offers (AgriFlow negotiation/offer system) ───────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS listing_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id UUID NOT NULL REFERENCES supply_listings(id) ON DELETE CASCADE,
        buyer_id UUID NOT NULL,
        seller_id UUID NOT NULL,
        offered_price DECIMAL(12,2) NOT NULL,
        quantity_kg DECIMAL(10,2) NOT NULL,
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        counter_price DECIMAL(12,2),
        counter_message TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_listing_offers_listing_id ON listing_offers(listing_id);
      CREATE INDEX IF NOT EXISTS idx_listing_offers_buyer_id ON listing_offers(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_listing_offers_status ON listing_offers(status);
    `);

    // ─── Extend properties table with new fields ───────────────────────────
    await client.query(`
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS bhk INTEGER;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12,2);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS facing VARCHAR(10);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_friendly BOOLEAN DEFAULT false;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_available BOOLEAN DEFAULT false;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS survey_number VARCHAR(50);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_acres DECIMAL(8,2);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(50);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_source VARCHAR(100);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS road_frontage_ft INTEGER;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V21 Sprint1 completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration V21 Sprint1 failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { migrateV21Sprint1 };
