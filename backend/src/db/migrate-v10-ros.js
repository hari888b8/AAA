'use strict';
require('dotenv').config();
const { pool } = require('./pool');

const MIGRATION_V10 = `
-- ============================================================================
-- KisanConnect 2.0 Rural Operating System (ROS) - V10 Migration
-- ============================================================================

-- Vehicles table for transportation services
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('tractor', 'mini_truck', 'pickup', 'bike', 'truck', 'three_wheeler')),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  capacity_kg DECIMAL(10, 2),
  pricing_per_km DECIMAL(10, 2),
  pricing_per_hour DECIMAL(10, 2),
  pricing_model VARCHAR(50) CHECK (pricing_model IN ('per_km', 'per_hour', 'flat')),
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  location_label VARCHAR(255),
  availability_status VARCHAR(50) DEFAULT 'offline' CHECK (availability_status IN ('available', 'busy', 'offline', 'maintenance')),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logistics requests for agricultural transport
CREATE TABLE IF NOT EXISTS logistics_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_lat DECIMAL(10, 7) NOT NULL,
  pickup_lng DECIMAL(10, 7) NOT NULL,
  pickup_location TEXT,
  drop_lat DECIMAL(10, 7) NOT NULL,
  drop_lng DECIMAL(10, 7) NOT NULL,
  drop_location TEXT,
  load_type VARCHAR(50) CHECK (load_type IN ('grain', 'fertilizer', 'equipment', 'produce', 'general')),
  weight_kg DECIMAL(12, 2),
  vehicle_type_needed VARCHAR(50),
  urgency VARCHAR(50) CHECK (urgency IN ('immediate', 'scheduled', 'flexible')),
  scheduled_at TIMESTAMPTZ,
  estimated_distance_km DECIMAL(10, 2),
  estimated_cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'matching', 'matched', 'in_progress', 'completed', 'cancelled')),
  matched_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  matched_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logistics matches between drivers and requests
CREATE TABLE IF NOT EXISTS logistics_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES logistics_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  offered_price DECIMAL(10, 2),
  distance_to_pickup_km DECIMAL(10, 2),
  driver_rating DECIMAL(3, 2),
  status VARCHAR(50) DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'rejected', 'expired', 'cancelled')),
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery orders for shop-to-customer delivery
CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_lat DECIMAL(10, 7) NOT NULL,
  pickup_lng DECIMAL(10, 7) NOT NULL,
  pickup_address TEXT,
  drop_lat DECIMAL(10, 7) NOT NULL,
  drop_lng DECIMAL(10, 7) NOT NULL,
  drop_address TEXT,
  package_type VARCHAR(50) CHECK (package_type IN ('fertilizer', 'seeds', 'pesticide', 'grocery', 'medicine', 'general')),
  package_description TEXT,
  weight_kg DECIMAL(10, 2),
  delivery_fee DECIMAL(10, 2),
  platform_commission DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  pickup_otp VARCHAR(6),
  delivery_otp VARCHAR(6),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  rating_by_customer INTEGER,
  rating_by_shop INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking logs for real-time location tracking
CREATE TABLE IF NOT EXISTS tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  request_id UUID REFERENCES logistics_requests(id) ON DELETE SET NULL,
  order_id UUID REFERENCES delivery_orders(id) ON DELETE SET NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  speed_kmh DECIMAL(8, 2),
  heading DECIMAL(6, 2),
  accuracy_m DECIMAL(8, 2),
  battery_percent INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Gig workers for temporary task-based services
CREATE TABLE IF NOT EXISTS gig_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  worker_type VARCHAR(50) CHECK (worker_type IN ('tractor_operator', 'harvester_operator', 'sprayer', 'plumber', 'electrician', 'farm_labor', 'driver', 'mechanic')),
  skills JSONB DEFAULT '[]',
  hourly_rate DECIMAL(10, 2),
  daily_rate DECIMAL(10, 2),
  experience_years INTEGER,
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB,
  current_lat DECIMAL(10, 7),
  current_lng DECIMAL(10, 7),
  location_label VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gig bookings for worker-customer engagements
CREATE TABLE IF NOT EXISTS gig_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES gig_workers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_type VARCHAR(50) CHECK (booking_type IN ('hourly', 'daily', 'task')),
  task_description TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  agreed_rate DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  platform_commission DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  rating_by_customer INTEGER,
  rating_by_worker INTEGER,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type_status ON vehicles(vehicle_type, availability_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_lat, location_lng);

-- Logistics requests indexes
CREATE INDEX IF NOT EXISTS idx_logistics_requests_user_id ON logistics_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_status ON logistics_requests(status);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_matched_driver ON logistics_requests(matched_driver_id);

-- Logistics matches indexes
CREATE INDEX IF NOT EXISTS idx_logistics_matches_request_id ON logistics_matches(request_id);
CREATE INDEX IF NOT EXISTS idx_logistics_matches_driver_status ON logistics_matches(driver_id, status);

-- Delivery orders indexes
CREATE INDEX IF NOT EXISTS idx_delivery_orders_shop_id ON delivery_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer_id ON delivery_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_assigned_driver ON delivery_orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);

-- Tracking logs indexes
CREATE INDEX IF NOT EXISTS idx_tracking_logs_driver_timestamp ON tracking_logs(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_request_id ON tracking_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_tracking_logs_order_id ON tracking_logs(order_id);

-- Gig workers indexes
CREATE INDEX IF NOT EXISTS idx_gig_workers_type_available ON gig_workers(worker_type, is_available);
CREATE INDEX IF NOT EXISTS idx_gig_workers_user_id ON gig_workers(user_id);

-- Gig bookings indexes
CREATE INDEX IF NOT EXISTS idx_gig_bookings_worker_id ON gig_bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_gig_bookings_customer_id ON gig_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_gig_bookings_status ON gig_bookings(status);
`;

async function migrateV10ROS() {
  try {
    console.log('🚀 Running Migration V10: Rural Operating System...');
    await pool.query(MIGRATION_V10);
    console.log('✅ Migration V10 complete');
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️  V10 tables already exist, skipping...');
    } else {
      console.error('❌ Migration V10 failed:', err.message);
      throw err;
    }
  }
}

module.exports = { migrateV10ROS };
