'use strict';

/**
 * Migration V22 — BhoomiOS Soil Intelligence & AgriGalaxy Enhancements
 * Adds tables for: soil health cards, field boundaries, soil testing labs,
 * product reviews, and platform success stories.
 */

const { pool } = require('./pool');

async function migrateV22BhoomiOsGalaxy() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── BhoomiOS soil health cards (enhanced) ─────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS bhoomios_soil_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL,
        listing_id UUID REFERENCES bhoomios_listings(id) ON DELETE SET NULL,
        card_photo_url TEXT,
        ocr_raw_text TEXT,
        ph_value DECIMAL(4,2),
        nitrogen_kg_ha DECIMAL(8,2),
        phosphorus_kg_ha DECIMAL(8,2),
        potassium_kg_ha DECIMAL(8,2),
        organic_carbon DECIMAL(5,2),
        ec_dS_m DECIMAL(6,3),
        soil_type VARCHAR(50),
        test_date DATE,
        lab_name VARCHAR(100),
        card_number VARCHAR(50),
        recommendations JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bhoomios_soil_cards_farmer ON bhoomios_soil_cards(farmer_id);
    `);

    // ─── BhoomiOS field boundaries (GPS polygon mapping) ───────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS bhoomios_field_boundaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL,
        listing_id UUID REFERENCES bhoomios_listings(id) ON DELETE SET NULL,
        field_name VARCHAR(100),
        boundary_geojson JSONB NOT NULL,
        area_calculated_acres DECIMAL(10,4),
        perimeter_m DECIMAL(10,2),
        centroid_lat DECIMAL(10,7),
        centroid_lng DECIMAL(10,7),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bhoomios_field_boundaries_farmer ON bhoomios_field_boundaries(farmer_id);
    `);

    // ─── BhoomiOS soil testing labs directory ──────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS bhoomios_soil_labs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        lab_type VARCHAR(50) DEFAULT 'government',
        address TEXT,
        district_id INTEGER REFERENCES districts(id),
        state VARCHAR(50) DEFAULT 'Andhra Pradesh',
        phone VARCHAR(20),
        email VARCHAR(100),
        services TEXT[] DEFAULT '{}',
        tests_offered TEXT[] DEFAULT '{}',
        price_range VARCHAR(50),
        turnaround_days INTEGER DEFAULT 7,
        is_accredited BOOLEAN DEFAULT false,
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bhoomios_soil_labs_district ON bhoomios_soil_labs(district_id);
    `);

    // ─── AgriGalaxy product reviews ────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS agrigalaxy_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES agrigalaxy_products(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        crop_used_for VARCHAR(100),
        verified_purchase BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(product_id, reviewer_id)
      );
      CREATE INDEX IF NOT EXISTS idx_agrigalaxy_reviews_product ON agrigalaxy_reviews(product_id);
    `);

    // ─── Platform success stories ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_success_stories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID,
        farmer_name VARCHAR(100),
        district VARCHAR(100),
        module VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        story TEXT NOT NULL,
        income_before DECIMAL(12,2),
        income_after DECIMAL(12,2),
        photo_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ─── Seed soil labs ────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO bhoomios_soil_labs (name, lab_type, address, state, phone, services, tests_offered, price_range, turnaround_days, is_accredited)
      SELECT * FROM (VALUES
        ('ANGRAU Soil Testing Lab', 'government', 'Lam, Guntur', 'Andhra Pradesh', '0863-2457750', ARRAY['soil_test','water_test'], ARRAY['NPK','pH','EC','Organic Carbon','Micronutrients'], '₹100-500', 7, true),
        ('ICAR-NAARM Soil Lab', 'government', 'Rajendranagar, Hyderabad', 'Telangana', '040-24581000', ARRAY['soil_test','leaf_analysis'], ARRAY['NPK','pH','EC','Organic Carbon','Heavy Metals','Micronutrients'], '₹200-800', 14, true),
        ('ANGRAU Regional Lab Tirupati', 'government', 'Tirupati, Chittoor', 'Andhra Pradesh', '0877-2289600', ARRAY['soil_test'], ARRAY['NPK','pH','EC','Organic Carbon'], '₹100-400', 7, true),
        ('SGS India Agri Lab', 'private', 'Hyderabad', 'Telangana', '040-23434000', ARRAY['soil_test','water_test','leaf_analysis','compost_test'], ARRAY['NPK','pH','EC','Organic Carbon','Micronutrients','Heavy Metals','Pesticide Residue'], '₹500-2000', 5, true),
        ('Eurofins Agro Labs', 'private', 'Visakhapatnam', 'Andhra Pradesh', '0891-6666100', ARRAY['soil_test','leaf_analysis','seed_test'], ARRAY['NPK','pH','EC','Organic Carbon','Micronutrients','Nematodes'], '₹600-3000', 3, true),
        ('KVK Nalgonda Soil Lab', 'government', 'Nalgonda', 'Telangana', '08682-223456', ARRAY['soil_test','water_test'], ARRAY['NPK','pH','EC','Organic Carbon'], '₹50-300', 10, false),
        ('UAS Dharwad Soil Testing', 'government', 'Dharwad', 'Karnataka', '0836-2748000', ARRAY['soil_test','water_test','plant_tissue'], ARRAY['NPK','pH','EC','Organic Carbon','Micronutrients'], '₹150-600', 7, true)
      ) AS v(name, lab_type, address, state, phone, services, tests_offered, price_range, turnaround_days, is_accredited)
      WHERE NOT EXISTS (SELECT 1 FROM bhoomios_soil_labs LIMIT 1);
    `);

    // ─── Seed success stories ──────────────────────────────────────────────
    await client.query(`
      INSERT INTO platform_success_stories (farmer_name, district, module, title, story, income_before, income_after, is_verified, is_published)
      SELECT * FROM (VALUES
        ('Ramprasad Yadav', 'Guntur', 'agriflow', 'From ₹40,000 to ₹1.2 Lakh — Direct buyer connection changed everything', 'I was selling paddy to local traders at ₹1600/quintal. After listing on AgriFlow, a Hyderabad rice mill contacted me directly at ₹2200/quintal. Saved ₹600 per quintal with no middlemen. Last kharif season I earned ₹1.2 lakh, compared to ₹40,000 before.', 40000::numeric, 120000::numeric, true, true),
        ('Lakshmi Devi', 'Krishna', 'kisanconnect', 'Rented tractor through KisanConnect — saved ₹15,000 per season', 'I used to pay ₹800/hour to a local contractor for tractor service. Found a tractor on KisanConnect for ₹400/hour nearby. For 40 hours of ploughing per season, I save ₹16,000. Also found a job for my son through the platform.', 0::numeric, 16000::numeric, true, true),
        ('Venkat Reddy', 'West Godavari', 'aquaos', 'Vannamei yield up 35% after using AquaOS advisory', 'My pond FCR was 1.8, much higher than ideal. AquaOS showed me feed was being overapplied. Reduced feed by 20%, added aerator based on DO alerts. FCR came down to 1.35. Next crop yield was 8.2 tons vs 6.1 tons before. Revenue increased by ₹87,000 per crop.', 250000::numeric, 337000::numeric, true, true),
        ('Suresh Kumar FPO', 'Prakasam', 'agriflow', 'FPO aggregated 200 farmers, got 18% premium over market price', 'As FPO secretary, I used to struggle aggregating produce. With AgriFlow FPO dashboard, we collected 450 tonnes of chilli from 200 members in one season. Got a direct contract with a spice exporter at 18% above market rate. Total benefit: ₹31.5 lakh distributed to members.', 0::numeric, 3150000::numeric, true, true),
        ('Padmavathi', 'Nellore', 'bhoomios', 'Leased 8 acres on BhoomiOS — started shrimp farming', 'Found aqua land on BhoomiOS with existing ponds. The GPS boundary mapping feature helped verify the actual area before lease. Started vannamei culture. First crop: 6.5 tons. Paid for lease in first crop itself.', 0::numeric, 195000::numeric, true, true)
      ) AS v(farmer_name, district, module, title, story, income_before, income_after, is_verified, is_published)
      WHERE NOT EXISTS (SELECT 1 FROM platform_success_stories LIMIT 1);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V22 (BhoomiOS + AgriGalaxy enhancements) complete');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration V22 failed:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { migrateV22BhoomiOsGalaxy };
