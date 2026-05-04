'use strict';

/**
 * Migration V20 — Performance Indexes
 * Adds missing indexes on frequently queried columns across AquaOS tables.
 * These indexes improve query performance for marketplace, analytics, and lookup operations.
 */

const { pool } = require('./pool');

async function migrateV20Indexes() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── AquaOS V1 Core Tables ───────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_farms_farmer_id ON aqua_farms(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_ponds_farm_id ON ponds(farm_id);
      CREATE INDEX IF NOT EXISTS idx_ponds_species ON ponds(species);
      CREATE INDEX IF NOT EXISTS idx_water_quality_logs_pond_id ON water_quality_logs(pond_id);
      CREATE INDEX IF NOT EXISTS idx_feed_logs_pond_id ON feed_logs(pond_id);
      CREATE INDEX IF NOT EXISTS idx_harvests_pond_id ON harvests(pond_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_market_prices_district ON aqua_market_prices(district);
      CREATE INDEX IF NOT EXISTS idx_aqua_market_prices_species ON aqua_market_prices(species);
    `);

    // ─── AquaOS V2 Financial/Operations ──────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_financials_farmer_id ON aqua_financials(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_disease_reports_pond_id ON aqua_disease_reports(pond_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_auctions_species ON aqua_auctions(species);
      CREATE INDEX IF NOT EXISTS idx_aqua_auctions_status ON aqua_auctions(status);
    `);

    // ─── AquaOS V3 RFQ/Escrow ────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_rfq_buyer_id ON aqua_rfq(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_rfq_species ON aqua_rfq(species);
      CREATE INDEX IF NOT EXISTS idx_aqua_rfq_status ON aqua_rfq(status);
      CREATE INDEX IF NOT EXISTS idx_aqua_escrow_buyer_id ON aqua_escrow(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_escrow_farmer_id ON aqua_escrow(farmer_id);
    `);

    // ─── AquaOS V4 Culture Units ─────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_culture_units_farm_id ON aqua_culture_units(farm_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_production_cycles_unit_id ON aqua_production_cycles(unit_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_iot_devices_unit_id ON aqua_iot_devices(unit_id);
    `);

    // ─── AquaOS V5 KPI/Marketplace ───────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_kpi_snapshots_farm_id ON aqua_kpi_snapshots(farm_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_supply_products_supplier_id ON aqua_supply_products(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_supply_orders_buyer_id ON aqua_supply_orders(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_alerts_farm_id ON aqua_alerts(farm_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_alerts_status ON aqua_alerts(status);
    `);

    // ─── AquaOS V6 Fish Marketplace ──────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_fish_listings_seller_id ON aqua_fish_listings(seller_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_fish_listings_species ON aqua_fish_listings(species);
      CREATE INDEX IF NOT EXISTS idx_aqua_fish_listings_status ON aqua_fish_listings(status);
      CREATE INDEX IF NOT EXISTS idx_aqua_fish_listings_district ON aqua_fish_listings(district);
      CREATE INDEX IF NOT EXISTS idx_aqua_buyer_profiles_user_id ON aqua_buyer_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_traceability_listing_id ON aqua_traceability(listing_id);
    `);

    // ─── AquaOS V7 Logistics/Training ────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_logistics_bookings_buyer_id ON aqua_logistics_bookings(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_logistics_bookings_status ON aqua_logistics_bookings(status);
      CREATE INDEX IF NOT EXISTS idx_aqua_disputes_buyer_id ON aqua_disputes(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_disputes_seller_id ON aqua_disputes(seller_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_disputes_status ON aqua_disputes(status);
      CREATE INDEX IF NOT EXISTS idx_aqua_trade_credit_buyer_id ON aqua_trade_credit(buyer_id);
    `);

    // ─── AquaOS V8 Role-Based Ecosystem ──────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_crop_posts_farmer_id ON aqua_crop_posts(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_crop_posts_species ON aqua_crop_posts(species);
      CREATE INDEX IF NOT EXISTS idx_aqua_crop_posts_district ON aqua_crop_posts(district);
      CREATE INDEX IF NOT EXISTS idx_aqua_crop_offers_buyer_id ON aqua_crop_offers(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_crop_offers_post_id ON aqua_crop_offers(post_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_community_posts_author_id ON aqua_community_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_sales_leads_buyer_id ON aqua_sales_leads(buyer_id);
    `);

    // ─── AquaOS V9 Negotiation/Privacy ───────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_negotiation_rooms_buyer_id ON aqua_negotiation_rooms(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_negotiation_rooms_farmer_id ON aqua_negotiation_rooms(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_negotiation_rooms_status ON aqua_negotiation_rooms(status);
      CREATE INDEX IF NOT EXISTS idx_aqua_negotiation_messages_room_id ON aqua_negotiation_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_privacy_settings_user_id ON aqua_privacy_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_production_insights_district ON aqua_production_insights(district);
    `);

    // ─── AquaOS V10 Analytics/Payments/Chat ──────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_aqua_payments_buyer_id ON aqua_payments(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_payments_farmer_id ON aqua_payments(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_payments_status ON aqua_payments(status);
      CREATE INDEX IF NOT EXISTS idx_aqua_chat_messages_room_id ON aqua_chat_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_chat_messages_sender_id ON aqua_chat_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_iot_readings_device_id ON aqua_iot_readings(device_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_iot_readings_created_at ON aqua_iot_readings(created_at);
      CREATE INDEX IF NOT EXISTS idx_aqua_predictions_farm_id ON aqua_predictions(farm_id);
      CREATE INDEX IF NOT EXISTS idx_aqua_growth_metrics_district ON aqua_growth_metrics(district);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V20 complete — performance indexes added');
  } catch (err) {
    await client.query('ROLLBACK');
    // Indexes are non-critical — log but don't crash if tables don't exist yet
    if (err.message.includes('does not exist')) {
      console.log('⚠️  Migration V20 skipped (some tables not yet created):', err.message.split('\n')[0]);
    } else {
      console.error('❌ Migration V20 failed:', err.message);
    }
  } finally {
    client.release();
  }
}

module.exports = { migrateV20Indexes };

// Run directly
if (require.main === module) {
  migrateV20Indexes().then(() => process.exit(0)).catch(() => process.exit(1));
}
