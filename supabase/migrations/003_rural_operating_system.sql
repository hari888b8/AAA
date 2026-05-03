-- ============================================================
-- KisanConnect 2.0 — Rural Operating System (ROS) Migration
-- Vehicles, Logistics, Delivery, Tracking, Gig Workers
-- ============================================================

-- ============================================================
-- VEHICLES — Transport asset registry
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type        VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('tractor', 'mini_truck', 'pickup', 'bike', 'truck', 'three_wheeler')),
  registration_number VARCHAR(20),
  capacity_kg         DECIMAL(10,2),
  pricing_per_km      DECIMAL(8,2),
  pricing_per_hour    DECIMAL(8,2),
  pricing_model       VARCHAR(20) DEFAULT 'per_km' CHECK (pricing_model IN ('per_km', 'per_hour', 'flat')),
  location_lat        DECIMAL(10,7),
  location_lng        DECIMAL(10,7),
  location_label      VARCHAR(200),
  availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline', 'maintenance')),
  rating              DECIMAL(3,2) DEFAULT 0,
  total_trips         INTEGER DEFAULT 0,
  is_verified         BOOLEAN DEFAULT false,
  documents           JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type_status ON vehicles(vehicle_type, availability_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_lat, location_lng);

-- ============================================================
-- LOGISTICS REQUESTS — Transport booking requests
-- ============================================================
CREATE TABLE IF NOT EXISTS logistics_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_lat            DECIMAL(10,7),
  pickup_lng            DECIMAL(10,7),
  pickup_location       TEXT,
  drop_lat              DECIMAL(10,7),
  drop_lng              DECIMAL(10,7),
  drop_location         TEXT,
  load_type             VARCHAR(30) CHECK (load_type IN ('grain', 'fertilizer', 'equipment', 'produce', 'general')),
  weight_kg             DECIMAL(10,2),
  vehicle_type_needed   VARCHAR(30),
  urgency               VARCHAR(20) DEFAULT 'flexible' CHECK (urgency IN ('immediate', 'scheduled', 'flexible')),
  scheduled_at          TIMESTAMPTZ,
  estimated_distance_km DECIMAL(8,2),
  estimated_cost        DECIMAL(10,2),
  status                VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matching', 'matched', 'in_progress', 'completed', 'cancelled')),
  matched_vehicle_id    UUID REFERENCES vehicles(id),
  matched_driver_id     UUID REFERENCES users(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_req_user ON logistics_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_logistics_req_status ON logistics_requests(status);
CREATE INDEX IF NOT EXISTS idx_logistics_req_driver ON logistics_requests(matched_driver_id);

-- ============================================================
-- LOGISTICS MATCHES — Driver-request matching
-- ============================================================
CREATE TABLE IF NOT EXISTS logistics_matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            UUID NOT NULL REFERENCES logistics_requests(id) ON DELETE CASCADE,
  driver_id             UUID NOT NULL REFERENCES users(id),
  vehicle_id            UUID REFERENCES vehicles(id),
  offered_price         DECIMAL(10,2),
  distance_to_pickup_km DECIMAL(8,2),
  driver_rating         DECIMAL(3,2),
  status                VARCHAR(20) DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'rejected', 'expired', 'cancelled')),
  offered_at            TIMESTAMPTZ DEFAULT NOW(),
  responded_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_match_request ON logistics_matches(request_id);
CREATE INDEX IF NOT EXISTS idx_logistics_match_driver ON logistics_matches(driver_id, status);

-- ============================================================
-- DELIVERY ORDERS — Shop-to-farmer delivery
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID NOT NULL REFERENCES users(id),
  customer_id         UUID NOT NULL REFERENCES users(id),
  pickup_lat          DECIMAL(10,7),
  pickup_lng          DECIMAL(10,7),
  pickup_address      TEXT,
  drop_lat            DECIMAL(10,7),
  drop_lng            DECIMAL(10,7),
  drop_address        TEXT,
  package_type        VARCHAR(30) CHECK (package_type IN ('fertilizer', 'seeds', 'pesticide', 'grocery', 'medicine', 'general')),
  package_description TEXT,
  weight_kg           DECIMAL(8,2),
  delivery_fee        DECIMAL(8,2),
  platform_commission DECIMAL(8,2),
  status              VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_driver_id  UUID REFERENCES users(id),
  assigned_vehicle_id UUID REFERENCES vehicles(id),
  pickup_otp          VARCHAR(6),
  delivery_otp        VARCHAR(6),
  picked_up_at        TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  rating_by_customer  INTEGER CHECK (rating_by_customer BETWEEN 1 AND 5),
  rating_by_shop      INTEGER CHECK (rating_by_shop BETWEEN 1 AND 5),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_shop ON delivery_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer ON delivery_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_driver ON delivery_orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);

-- ============================================================
-- TRACKING LOGS — Real-time GPS tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS tracking_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL REFERENCES users(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  request_id      UUID,
  order_id        UUID,
  lat             DECIMAL(10,7) NOT NULL,
  lng             DECIMAL(10,7) NOT NULL,
  speed_kmh       DECIMAL(6,2),
  heading         DECIMAL(5,2),
  accuracy_m      DECIMAL(6,2),
  battery_percent INTEGER,
  timestamp       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_driver_time ON tracking_logs(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_request ON tracking_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_tracking_order ON tracking_logs(order_id);

-- ============================================================
-- GIG WORKERS — Task-based worker profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS gig_workers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  worker_type           VARCHAR(30) NOT NULL CHECK (worker_type IN ('tractor_operator', 'harvester_operator', 'sprayer', 'plumber', 'electrician', 'farm_labor', 'driver', 'mechanic')),
  skills                JSONB DEFAULT '[]',
  hourly_rate           DECIMAL(8,2),
  daily_rate            DECIMAL(8,2),
  experience_years      INTEGER,
  is_available          BOOLEAN DEFAULT true,
  availability_schedule JSONB,
  current_lat           DECIMAL(10,7),
  current_lng           DECIMAL(10,7),
  location_label        VARCHAR(200),
  rating                DECIMAL(3,2) DEFAULT 0,
  total_jobs            INTEGER DEFAULT 0,
  is_verified           BOOLEAN DEFAULT false,
  documents             JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gig_workers_type_avail ON gig_workers(worker_type, is_available);
CREATE INDEX IF NOT EXISTS idx_gig_workers_user ON gig_workers(user_id);

-- ============================================================
-- GIG BOOKINGS — Worker engagement records
-- ============================================================
CREATE TABLE IF NOT EXISTS gig_bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id           UUID NOT NULL REFERENCES gig_workers(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES users(id),
  booking_type        VARCHAR(20) CHECK (booking_type IN ('hourly', 'daily', 'task')),
  task_description    TEXT,
  scheduled_start     TIMESTAMPTZ,
  scheduled_end       TIMESTAMPTZ,
  actual_start        TIMESTAMPTZ,
  actual_end          TIMESTAMPTZ,
  agreed_rate         DECIMAL(8,2),
  total_amount        DECIMAL(10,2),
  platform_commission DECIMAL(8,2),
  status              VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  rating_by_customer  INTEGER CHECK (rating_by_customer BETWEEN 1 AND 5),
  rating_by_worker    INTEGER CHECK (rating_by_worker BETWEEN 1 AND 5),
  review_text         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gig_bookings_worker ON gig_bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_gig_bookings_customer ON gig_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_gig_bookings_status ON gig_bookings(status);
