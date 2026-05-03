# 🚀 AgriHub — Agriculture Operating System (India)

## End-to-End Implementation Plan

**Date:** May 2026  
**Vision:** India's first unified Agriculture Operating System — connecting 145M+ farmers, 10,000+ FPOs, traders, exporters, input suppliers, banks, and logistics providers on one digital platform  
**Scope:** Platform evolution from "Selling Platform" → "Farmer Intelligence + Execution Platform" → "Complete Agriculture Operating System"  
**Approach:** Phased implementation leveraging existing infrastructure

---

## 🌍 The Opportunity

### India's Agriculture Ecosystem (Fragmented Today)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE: FRAGMENTED                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  145M+ Farmers → use 5-6 disconnected apps                             │
│  10,000+ FPOs → manage on spreadsheets/paper                           │
│  Traders/Exporters → rely on broker network                            │
│  Input Suppliers → offline dealer networks only                        │
│  Banks/NBFCs → no farm-level credit data                               │
│  Logistics → unorganized local transport                               │
│                                                                         │
│  Apps exist for: Mandi prices | Weather | Fertilizer | Crop advisory   │
│  But NONE connect these stakeholders end-to-end                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### What We're Building: The Unified Agriculture OS

```
┌─────────────────────────────────────────────────────────────────────────┐
│               AGRIHUB: AGRICULTURE OPERATING SYSTEM                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🧑‍🌾 FARMERS ←→ 🏢 FPOs ←→ 🏪 TRADERS ←→ 🚢 EXPORTERS               │
│       ↕              ↕           ↕              ↕                      │
│  🌱 INPUT SUPPLIERS ←→ 🚚 LOGISTICS ←→ 🏦 BANKS/FINANCE               │
│       ↕              ↕           ↕              ↕                      │
│  📊 INTELLIGENCE ENGINE (Prices, Demand, Weather, Crop Health)         │
│                                                                         │
│  All connected through ONE platform, ONE login, ONE data layer         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Platform Users & Their Needs

| User Type | Count (India) | Primary Need | AgriHub Module |
|-----------|---------------|--------------|----------------|
| **Farmers** | 145M+ | Grow profitably, sell at best price | Farmer OS, Marketplace, Intelligence |
| **FPOs** | 10,000+ | Aggregate, procure, sell collectively | FPO Hub, Procurement, Contracts |
| **Traders** | 500K+ | Discover supply, buy at competitive rates | Buyer Discovery, Trade Engine |
| **Exporters** | 50K+ | Quality assurance, bulk procurement | Contract Farming, Quality Tracking |
| **Input Suppliers** | 200K+ | Reach farmers directly, digital sales | Input Marketplace, Credit |
| **Banks/NBFCs** | 1000+ | Farm-level credit data, loan management | Finance Module, Credit Scoring |
| **Logistics Providers** | 100K+ | Get bookings, optimize routes | Logistics Module, Batch Planning |
| **Government/NABARD/SFAC** | — | Scheme disbursement, farmer data | Scheme Discovery, Analytics |

### 7 Core Modules of the Agriculture OS

```
MODULE 1: 🧑‍🌾 Farmer Profile & Identity System
MODULE 2: 📋 Crop Planning & Farm Management (Farmer OS)
MODULE 3: 🛒 Multi-Sided Marketplace (Produce + Inputs + Equipment)
MODULE 4: 📊 Market Intelligence & Demand Engine
MODULE 5: 🚚 Logistics & Supply Chain
MODULE 6: 💰 Financial Ecosystem (Credit + Insurance + Payments)
MODULE 7: 🌐 Community, Advisory & Agent Network
```

---

## 📊 Current State Assessment

### ✅ What Already Exists (Solid Foundation)

| Component | Status | Existing Implementation |
|-----------|--------|------------------------|
| **Marketplace (AgriFlow)** | ✅ Built | Listings, inquiries, declarations, crop catalog |
| **Farm Diary** | ✅ Built | Activity logging, crop lifecycle, expense tracking, yield tracking |
| **Intelligence Engine** | ✅ Partial | Supply-demand analysis, district heatmap, price feeds, forecasts |
| **Wallet & Payments** | ✅ Built | Wallet balance, history, referral system |
| **Trade Engine** | ✅ Built | Full escrow trade flow with GPS, photos, voice, quality verification |
| **Community** | ✅ Built | Posts, Q&A, expert consultation, polls, knowledge sharing |
| **Equipment Marketplace** | ✅ Built | KisanConnect: rent/buy/sell, operators, machine requests |
| **Farmer Profile** | ✅ Built | Onboarding with village, district, land, irrigation, soil, crops |
| **Training** | ✅ Built | Courses, modules, multi-language (Telugu/Hindi) |
| **Scheme Discovery** | ✅ Built | Auto-match schemes to farmer profile |
| **FPO Management** | ✅ Built | Members, procurement, inventory |
| **Weather** | ✅ Built | Forecasts, alerts |
| **i18n (Telugu/Hindi)** | ✅ Built | Full translation system |
| **Subscriptions** | ✅ Built | Tiered plans for farmers/buyers/FPOs |
| **Order Tracking** | ✅ Built | Status tracking with history |
| **Chat** | ✅ Built | Real-time messaging |
| **Reviews & Ratings** | ✅ Built | User reviews system |

### 🔴 Gaps to Fill for Full Agriculture OS

| # | OS Module | Current State | Gap to Fill |
|---|-----------|---------------|-------------|
| 1 | Farmer OS (crop planning, yield, expenses) | **FarmDiary covers 80%** — has crop lifecycle, expenses, yield tracking | Automated crop planning recommendations, season-over-season comparison, satellite monitoring |
| 2 | Demand Intelligence Engine | **Partially built** — supply-demand, prices, heatmap exist | Price prediction ML, crop demand forecasting, personalized recommendations, APMC live data |
| 3 | Logistics System | **Basic tracking exists** — order_tracking table + trade dispatching | Pickup scheduling, delivery partner network, route optimization, order batching |
| 4 | Input + Services Marketplace | **Equipment exists (KisanConnect)** | Seeds, fertilizers, pesticides, labor hiring marketplace with seller network |
| 5 | Financial Ecosystem | **Wallet + schemes exist** | Credit scoring from farm data, micro-loans, crop insurance, bank API integration |
| 6 | Farmer Trust & Identity | **Reviews + farmer profile + KYC exist** | Reliability score algorithm, transaction history scoring, verified badges, Aadhaar-linked |
| 7 | Contract Farming / Subscriptions | **Subscriptions exist** | Contract farming agreements, recurring purchase orders, forward contracts |
| 8 | Community + Advisory | **Community fully built** — Q&A, experts, polls | Voice-based support, farmer groups (WhatsApp-style), expert video calls |
| 9 | Agent Network | **Offline mode planned** (user_preferences.offline_mode) | Agent dashboard, assisted onboarding, order facilitation, commission system |
| 10 | Farmer-Friendly UX | **Telugu/Hindi i18n built**, voice notes in trade | Voice commands navigation, WhatsApp-like simplified flows, full offline mode |
| 11 | Multi-stakeholder Onboarding | **Only farmer + buyer roles exist** | Exporter onboarding, input supplier dashboard, bank partner portal, logistics partner app |
| 12 | Government/Institutional Integration | **Scheme discovery exists** | NABARD/SFAC data feeds, PM-KISAN integration, eNAM linkage, soil health card data |

---

## 🎯 Implementation Priority Stack — Agriculture OS Roadmap

### Phased OS Build Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 1 (Weeks 1-6): CORE OS FOUNDATION                              │
│  "Make the existing platform work end-to-end for farmers"              │
├─────────────────────────────────────────────────────────────────────────┤
│  1A. Logistics System (farm pickup → buyer delivery)                   │
│  1B. Input Marketplace (seeds, fertilizers, pesticides)                │
│  1C. Farmer OS Enhancement (AI crop planning + season P&L)            │
│  1D. Multi-Role Onboarding (exporter, input supplier, logistics)       │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 2 (Weeks 7-12): INTELLIGENCE + TRUST LAYER                     │
│  "Make the platform smart — predict, recommend, verify"                │
├─────────────────────────────────────────────────────────────────────────┤
│  2A. Demand Intelligence ML (price prediction + market signals)        │
│  2B. Contract Farming & Forward Contracts                              │
│  2C. Trust Score & Verified Identity System                            │
│  2D. Satellite + Weather Crop Monitoring Integration                   │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 3 (Weeks 13-18): FINANCIAL + SCALE LAYERS                      │
│  "Add money layer — credit, insurance, banking APIs"                   │
├─────────────────────────────────────────────────────────────────────────┤
│  3A. Financial Ecosystem (credit scoring, micro-loans, insurance)      │
│  3B. Agent Network (village agents, assisted onboarding, commissions)  │
│  3C. Voice-First UX (voice commands, simplified flows, offline)        │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 4 (Weeks 19-24): ECOSYSTEM EXPANSION                           │
│  "Open platform for institutional partners"                            │
├─────────────────────────────────────────────────────────────────────────┤
│  4A. Bank/NBFC Partner Portal (loan disbursement API)                  │
│  4B. Government Integration (NABARD/SFAC/PM-KISAN/eNAM)               │
│  4C. Exporter Dashboard (bulk procurement, quality certificates)       │
│  4D. Open API Layer (third-party integrations)                         │
│  4E. Analytics & Reporting (district-level dashboards)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### How Modules Map to OS Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                           │
│  Telugu-first │ Voice commands │ Offline mode │ Agent-assisted   │
├──────────────────────────────────────────────────────────────────┤
│                    APPLICATION MODULES                            │
│  Farmer OS │ Marketplace │ Intelligence │ Logistics │ Finance   │
├──────────────────────────────────────────────────────────────────┤
│                    PLATFORM SERVICES                              │
│  Auth │ Payments │ Notifications │ Chat │ Cache │ Storage       │
├──────────────────────────────────────────────────────────────────┤
│                    DATA + INTELLIGENCE                            │
│  PostgreSQL │ ML Models │ Price Feeds │ Weather │ Satellite     │
├──────────────────────────────────────────────────────────────────┤
│                    INTEGRATION LAYER                              │
│  APMC/eNAM │ Banks │ NABARD │ Insurance │ Logistics Partners   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📋 PHASE 1: Core OS Foundation (Weeks 1–6)

> **Goal:** Make the platform work end-to-end — a farmer can plan crops, buy inputs, sell produce, and get it delivered.

### 1A. Logistics System 🚚

**Why Critical:** Without logistics, marketplace transactions die after "order placed."

#### Database Schema

```sql
-- Migration V6: Logistics System
CREATE TABLE IF NOT EXISTS logistics_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  partner_type    VARCHAR(50) NOT NULL DEFAULT 'individual',
  -- Types: individual_driver, fleet_owner, three_wheeler, auto, tempo, truck
  vehicle_type    VARCHAR(50) NOT NULL,
  vehicle_number  VARCHAR(20),
  phone           VARCHAR(15) NOT NULL,
  district_id     UUID REFERENCES districts(id),
  mandal          VARCHAR(100),
  village         VARCHAR(100),
  is_verified     BOOLEAN DEFAULT false,
  is_available    BOOLEAN DEFAULT true,
  rating          DECIMAL(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  max_capacity_kg DECIMAL(10,2),
  coverage_radius_km INTEGER DEFAULT 25,
  commission_rate DECIMAL(4,3) DEFAULT 0.05,
  bank_account    JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL,
  order_type      VARCHAR(50) NOT NULL DEFAULT 'trade',
  -- Pickup details
  pickup_lat      DECIMAL(10,7),
  pickup_lng      DECIMAL(10,7),
  pickup_address  TEXT,
  pickup_contact  VARCHAR(15),
  pickup_name     VARCHAR(200),
  pickup_slot     TIMESTAMPTZ,
  -- Delivery details
  delivery_lat    DECIMAL(10,7),
  delivery_lng    DECIMAL(10,7),
  delivery_address TEXT,
  delivery_contact VARCHAR(15),
  delivery_name   VARCHAR(200),
  delivery_slot   TIMESTAMPTZ,
  -- Cargo details
  weight_kg       DECIMAL(10,2),
  cargo_type      VARCHAR(100),
  requires_cold   BOOLEAN DEFAULT false,
  special_notes   TEXT,
  -- Assignment
  partner_id      UUID REFERENCES logistics_partners(id),
  status          VARCHAR(50) DEFAULT 'pending',
  -- Status: pending → assigned → pickup_enroute → picked_up → in_transit → delivered → completed
  distance_km     DECIMAL(8,2),
  estimated_cost  DECIMAL(10,2),
  actual_cost     DECIMAL(10,2),
  otp_pickup      VARCHAR(6),
  otp_delivery    VARCHAR(6),
  -- Timestamps
  assigned_at     TIMESTAMPTZ,
  picked_up_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID REFERENCES logistics_partners(id),
  route_name      VARCHAR(200),
  batch_date      DATE NOT NULL,
  status          VARCHAR(50) DEFAULT 'planning',
  total_orders    INTEGER DEFAULT 0,
  total_weight_kg DECIMAL(10,2) DEFAULT 0,
  total_distance_km DECIMAL(8,2) DEFAULT 0,
  optimized_route JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_batch_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID REFERENCES delivery_batches(id) ON DELETE CASCADE,
  delivery_id     UUID REFERENCES delivery_requests(id),
  sequence_order  INTEGER NOT NULL,
  pickup_or_drop  VARCHAR(10) NOT NULL DEFAULT 'pickup'
);

CREATE INDEX IF NOT EXISTS idx_delivery_req_status ON delivery_requests(status, district_id);
CREATE INDEX IF NOT EXISTS idx_logistics_available ON logistics_partners(district_id, is_available) WHERE is_available = true;
```

#### Backend Routes (`backend/src/routes/logistics.js`)

```
POST   /api/logistics/partners          — Register as logistics partner
GET    /api/logistics/partners           — List available partners (by district)
PATCH  /api/logistics/partners/:id       — Update partner profile/availability

POST   /api/logistics/request            — Create delivery request (from order)
GET    /api/logistics/requests           — My delivery requests
PATCH  /api/logistics/requests/:id       — Update delivery status (OTP verified)

POST   /api/logistics/assign             — Assign partner to delivery (auto or manual)
GET    /api/logistics/estimate           — Get cost/time estimate (pickup → delivery)

POST   /api/logistics/batch              — Create delivery batch
GET    /api/logistics/batch/:id          — Get batch with optimized route
POST   /api/logistics/batch/:id/optimize — Compute optimal route ordering

GET    /api/logistics/partner/dashboard  — Partner earnings, pending pickups
```

#### Frontend Screen (`src/screens/LogisticsScreen.js`)

**Tabs:**
- **Track Delivery** — real-time map/status for buyer/farmer
- **Schedule Pickup** — farmer requests pickup with time slot
- **Partner Dashboard** — for delivery partners: earnings, pending tasks
- **Batch Planner** — FPO/admin view to batch multiple pickups

#### Integration Points

- Auto-creates delivery request when trade order reaches `dispatched` status
- Sends push notification to nearby partners
- OTP verification at pickup and delivery
- Auto-releases escrow payment on delivery confirmation

---

### 1B. Input Marketplace (Seeds, Fertilizers, Pesticides) 🌱

**Why Critical:** Farmers currently go to offline dealers. This is a high-frequency use case.

#### Database Schema

```sql
-- Migration V6: Inputs Marketplace
CREATE TABLE IF NOT EXISTS input_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  name_te         VARCHAR(100),
  name_hi         VARCHAR(100),
  icon_emoji      VARCHAR(10),
  parent_id       UUID REFERENCES input_categories(id),
  sort_order      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS input_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES input_categories(id),
  name            VARCHAR(200) NOT NULL,
  name_te         VARCHAR(200),
  name_hi         VARCHAR(200),
  brand           VARCHAR(100),
  manufacturer    VARCHAR(200),
  description     TEXT,
  -- Specific fields
  crop_suitable   UUID[] DEFAULT '{}',  -- crop_catalog IDs
  application_method TEXT,
  dosage_info     TEXT,
  -- Pricing
  mrp             DECIMAL(10,2),
  discount_pct    DECIMAL(5,2) DEFAULT 0,
  unit            VARCHAR(20) DEFAULT 'kg',
  pack_sizes      JSONB DEFAULT '[]',  -- [{size: "5kg", price: 450}, ...]
  -- Media
  images          TEXT[] DEFAULT '{}',
  -- Metadata
  organic_certified BOOLEAN DEFAULT false,
  government_approved BOOLEAN DEFAULT false,
  license_number  VARCHAR(100),
  expiry_months   INTEGER,
  rating          DECIMAL(3,2) DEFAULT 0,
  total_orders    INTEGER DEFAULT 0,
  in_stock        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS input_sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  shop_name       VARCHAR(200) NOT NULL,
  license_number  VARCHAR(100),
  district_id     UUID REFERENCES districts(id),
  address         TEXT,
  phone           VARCHAR(15),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  delivery_available BOOLEAN DEFAULT true,
  delivery_radius_km INTEGER DEFAULT 15,
  rating          DECIMAL(3,2) DEFAULT 0,
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS input_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID REFERENCES input_sellers(id),
  product_id      UUID REFERENCES input_products(id),
  price           DECIMAL(10,2) NOT NULL,
  stock_quantity  INTEGER DEFAULT 0,
  pack_size       VARCHAR(50),
  is_available    BOOLEAN DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, product_id, pack_size)
);

CREATE TABLE IF NOT EXISTS input_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID REFERENCES users(id),
  seller_id       UUID REFERENCES input_sellers(id),
  items           JSONB NOT NULL DEFAULT '[]',
  total_amount    DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  delivery_lat    DECIMAL(10,7),
  delivery_lng    DECIMAL(10,7),
  status          VARCHAR(50) DEFAULT 'placed',
  payment_status  VARCHAR(50) DEFAULT 'pending',
  delivery_id     UUID REFERENCES delivery_requests(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-seed categories
INSERT INTO input_categories (name, name_te, name_hi, icon_emoji, sort_order) VALUES
('Seeds', 'విత్తనాలు', 'बीज', '🌱', 1),
('Fertilizers', 'ఎరువులు', 'उर्वरक', '🧪', 2),
('Pesticides', 'పురుగుమందులు', 'कीटनाशक', '🔬', 3),
('Growth Promoters', 'వృద్ధి ప్రోత్సాహకాలు', 'वृद्धि प्रवर्तक', '🌿', 4),
('Tools & Accessories', 'పరికరాలు', 'उपकरण', '🔧', 5),
('Organic Inputs', 'సేంద్రీయ ఇన్పుట్‌లు', 'जैविक इनपुट', '♻️', 6)
ON CONFLICT DO NOTHING;
```

#### Backend Routes (`backend/src/routes/inputs.js`)

```
GET    /api/inputs/categories            — List input categories
GET    /api/inputs/products              — Browse products (filter by category, crop, organic)
GET    /api/inputs/products/:id          — Product detail with seller inventory
GET    /api/inputs/sellers               — Nearby sellers (by district/GPS)
POST   /api/inputs/orders                — Place input order
GET    /api/inputs/orders                — My orders
PATCH  /api/inputs/orders/:id/status     — Update order status
GET    /api/inputs/recommendations       — AI: recommend inputs based on crop + season + soil
```

#### Frontend Screen (`src/screens/InputsScreen.js`)

**Tabs:**
- **Browse** — Categories grid → product listings → detail with "Add to Cart"
- **My Orders** — Input order history with delivery status
- **Nearby Dealers** — Map view of verified input sellers
- **Recommendations** — AI-suggested inputs based on farmer profile + season

---

### 1C. Farmer OS Enhancement (Crop Planning AI) 🧠

**Why:** FarmDiary already tracks activities. Now add **prescriptive intelligence**.

#### Database Schema

```sql
-- Migration V6: Crop Planning Intelligence
CREATE TABLE IF NOT EXISTS crop_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  season          VARCHAR(20) NOT NULL,  -- kharif, rabi, zaid
  year            INTEGER NOT NULL,
  field_name      VARCHAR(100),
  area_acres      DECIMAL(6,2),
  -- Plan details
  recommended_crop UUID REFERENCES crop_catalog(id),
  selected_crop   UUID REFERENCES crop_catalog(id),
  variety         VARCHAR(100),
  reason          TEXT,  -- Why this crop recommended
  -- Financial projection
  estimated_cost_per_acre DECIMAL(10,2),
  estimated_yield_per_acre DECIMAL(10,2),
  estimated_price  DECIMAL(10,2),
  projected_profit DECIMAL(12,2),
  -- Comparison
  last_season_crop UUID REFERENCES crop_catalog(id),
  last_season_yield DECIMAL(10,2),
  last_season_profit DECIMAL(12,2),
  -- Status
  status          VARCHAR(30) DEFAULT 'suggested',
  -- suggested → accepted → in_progress → completed → evaluated
  actual_yield    DECIMAL(10,2),
  actual_profit   DECIMAL(12,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_plan_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID REFERENCES crop_plans(id) ON DELETE CASCADE,
  task_type       VARCHAR(50) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  title_te        VARCHAR(200),
  description     TEXT,
  due_date        DATE,
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  sequence_order  INTEGER NOT NULL,
  input_needed    JSONB DEFAULT '[]',
  -- [{product_category: "Seeds", quantity: "20kg", estimated_cost: 4800}]
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  season          VARCHAR(20) NOT NULL,
  year            INTEGER NOT NULL,
  total_area_acres DECIMAL(8,2),
  total_investment DECIMAL(12,2),
  total_revenue   DECIMAL(12,2),
  net_profit      DECIMAL(12,2),
  crops_data      JSONB DEFAULT '[]',
  -- [{crop, area, cost, yield, revenue, profit}]
  comparison_prev_season JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farmer_id, season, year)
);
```

#### Backend Routes (`backend/src/routes/cropplanning.js`)

```
GET    /api/cropplan/recommend           — AI crop recommendations (based on soil, history, market)
POST   /api/cropplan/plans               — Create/accept a crop plan
GET    /api/cropplan/plans               — My plans (current + history)
GET    /api/cropplan/plans/:id           — Plan detail with tasks timeline
PATCH  /api/cropplan/plans/:id           — Update plan (mark tasks complete)

GET    /api/cropplan/tasks/:planId       — Task checklist for a plan
PATCH  /api/cropplan/tasks/:id/complete  — Mark task done

GET    /api/cropplan/season-report       — Season P&L report
GET    /api/cropplan/comparison          — Season-over-season comparison
```

#### Recommendation Algorithm (Initial Heuristic)

```javascript
function recommendCrops(farmerProfile, marketData, weatherForecast) {
  const { soil_type, irrigation_type, district_id, total_land_acres } = farmerProfile;
  const currentSeason = getCurrentSeason(); // kharif/rabi/zaid

  // 1. Filter crops suitable for soil + irrigation + season
  // 2. Score by: market demand (high demand = higher score)
  // 3. Score by: price trend (rising prices = higher score)
  // 4. Score by: farmer's past success with this crop
  // 5. Score by: district adoption rate (other farmers growing it)
  // 6. Penalize: if farmer grew same crop last 2 seasons (rotation)

  return rankedCrops.slice(0, 5); // Top 5 recommendations with reasons
}
```

---

### 1D. Multi-Stakeholder Onboarding System 🌐

**Why Critical:** The Agriculture OS serves 7+ user types. Each needs a tailored onboarding flow and dashboard.

#### User Roles Architecture

```sql
-- Enhancement to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'farmer';
-- Types: farmer, fpo, trader, exporter, input_supplier, logistics_partner, bank_partner, agent, admin

-- Exporter profiles
CREATE TABLE IF NOT EXISTS exporter_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  company_name    VARCHAR(200) NOT NULL,
  export_license  VARCHAR(100),
  iec_code        VARCHAR(20),  -- Import Export Code
  fssai_license   VARCHAR(50),
  countries_exported TEXT[] DEFAULT '{}',
  crops_interested UUID[] DEFAULT '{}',
  annual_volume_tonnes DECIMAL(10,2),
  quality_certifications TEXT[] DEFAULT '{}',
  -- APEDA, GlobalGAP, Organic, etc.
  warehouse_locations JSONB DEFAULT '[]',
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Input supplier profiles
CREATE TABLE IF NOT EXISTS supplier_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  company_name    VARCHAR(200) NOT NULL,
  supplier_type   VARCHAR(50) NOT NULL,
  -- dealer, manufacturer, distributor, cooperative
  license_number  VARCHAR(100),
  gst_number      VARCHAR(20),
  product_categories UUID[] DEFAULT '{}',
  district_ids    UUID[] DEFAULT '{}',
  delivery_available BOOLEAN DEFAULT true,
  minimum_order   DECIMAL(10,2) DEFAULT 0,
  credit_offered  BOOLEAN DEFAULT false,
  credit_days     INTEGER DEFAULT 0,
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bank/NBFC partner profiles
CREATE TABLE IF NOT EXISTS bank_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  institution_name VARCHAR(200) NOT NULL,
  institution_type VARCHAR(50) NOT NULL,
  -- bank, nbfc, microfinance, cooperative_bank
  license_number  VARCHAR(100),
  districts_served UUID[] DEFAULT '{}',
  products_offered TEXT[] DEFAULT '{}',
  -- kcc, crop_loan, working_capital, equipment_finance, warehouse_receipt
  interest_range  VARCHAR(50),
  max_loan_amount DECIMAL(14,2),
  api_enabled     BOOLEAN DEFAULT false,
  webhook_url     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Onboarding Flows (Per Role)

| Role | Onboarding Steps | Dashboard Features |
|------|------------------|-------------------|
| **Farmer** | Phone → OTP → Name → Village → Land → Crops → Soil | Farm Diary, Marketplace, Intelligence, Inputs |
| **FPO** | Registration → Members → District → Crops → License | Procurement, Members, Inventory, Analytics |
| **Trader** | Phone → GST → Business → Crops → Districts → License | Buy Discovery, Inquiries, Orders, Intelligence |
| **Exporter** | Company → IEC → FSSAI → Crops → Countries → Certs | Supply Search, Contracts, Quality, Logistics |
| **Input Supplier** | Company → License → Products → Districts → Delivery | Inventory, Orders, Analytics, Credit Mgmt |
| **Logistics Partner** | Name → Vehicle → District → Capacity → Bank | Delivery Requests, Route Planner, Earnings |
| **Bank Partner** | Institution → License → Products → Districts → API | Loan Applications, Disbursement, Portfolio |
| **Agent** | Name → District → Villages → Training → Device | Farmer Onboarding, Orders, Commissions |

#### Backend Routes (`backend/src/routes/onboarding.js`)

```
POST   /api/onboarding/exporter          — Register as exporter
POST   /api/onboarding/supplier          — Register as input supplier
POST   /api/onboarding/bank-partner      — Register as bank partner
GET    /api/onboarding/status            — My onboarding completion status
POST   /api/onboarding/verify            — Submit verification documents
```

#### Frontend: Role-Based Home Screens

Each user type sees a different home screen with relevant modules:

```javascript
// src/screens/HomeScreen.js — enhanced routing
function getHomeModules(userType) {
  switch (userType) {
    case 'farmer': return ['farm-diary', 'marketplace', 'intelligence', 'inputs', 'weather', 'community'];
    case 'fpo': return ['procurement', 'members', 'marketplace', 'contracts', 'intelligence', 'finance'];
    case 'trader': return ['buy-discovery', 'inquiries', 'orders', 'intelligence', 'logistics'];
    case 'exporter': return ['supply-search', 'contracts', 'quality', 'logistics', 'intelligence'];
    case 'input_supplier': return ['inventory', 'orders', 'analytics', 'logistics'];
    case 'logistics_partner': return ['deliveries', 'route-planner', 'earnings', 'schedule'];
    case 'bank_partner': return ['loan-applications', 'disbursement', 'portfolio', 'analytics'];
    case 'agent': return ['onboard-farmer', 'assist-orders', 'commissions', 'training'];
  }
}
```

---

## 📋 PHASE 2: Intelligence + Trust Layer (Weeks 7–12)

> **Goal:** Make the platform smart — predict prices, recommend actions, verify users, monitor crops remotely.

### 2A. Demand Intelligence ML Layer 📊

**Enhancement to existing intelligence module.**

#### New Endpoints

```
GET  /api/intelligence/price-prediction/:cropId    — 7/14/30 day price forecast
GET  /api/intelligence/demand-forecast             — What crops will be in demand next season
GET  /api/intelligence/best-sell-time/:cropId      — When to sell for best price
GET  /api/intelligence/farmer-advisory             — Personalized market advisory
POST /api/intelligence/price-alerts/smart          — AI-generated alert suggestions
```

#### Database Additions

```sql
CREATE TABLE IF NOT EXISTS price_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id         UUID REFERENCES crop_catalog(id),
  district_id     UUID REFERENCES districts(id),
  prediction_date DATE NOT NULL,
  predicted_price DECIMAL(10,2),
  confidence      DECIMAL(4,2),  -- 0.0 to 1.0
  model_version   VARCHAR(20),
  actual_price    DECIMAL(10,2),  -- Filled in later for accuracy tracking
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(crop_id, district_id, prediction_date)
);

CREATE TABLE IF NOT EXISTS demand_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id         UUID REFERENCES crop_catalog(id),
  district_id     UUID REFERENCES districts(id),
  signal_type     VARCHAR(50) NOT NULL,
  -- Types: buyer_inquiry_surge, price_rising, low_supply, seasonal_demand
  strength        DECIMAL(4,2) DEFAULT 0.5,  -- 0.0 to 1.0
  message         TEXT,
  message_te      TEXT,
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Implementation Approach

**Phase 2A.1:** Rule-based predictions (immediate)
- Moving averages (7-day, 30-day)
- Seasonal patterns from historical data
- Supply-demand ratio signals

**Phase 2A.2:** ML model (later)
- Linear regression on price history
- Feature engineering: season, weather, supply volume, inquiry volume
- Train on APMC mandi historical data

---

### 2B. Contract Farming / Forward Contracts 📝

**Extension of existing trade engine.**

#### Database Schema

```sql
CREATE TABLE IF NOT EXISTS farming_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID REFERENCES users(id),
  farmer_id       UUID REFERENCES users(id),
  fpo_id          UUID REFERENCES users(id),
  -- Contract terms
  crop_id         UUID REFERENCES crop_catalog(id),
  variety         VARCHAR(100),
  quantity_kg     DECIMAL(10,2) NOT NULL,
  price_per_kg    DECIMAL(10,2) NOT NULL,
  quality_grade   VARCHAR(20) DEFAULT 'A',
  delivery_start  DATE NOT NULL,
  delivery_end    DATE NOT NULL,
  delivery_location TEXT,
  -- Financial
  advance_amount  DECIMAL(12,2) DEFAULT 0,
  advance_paid    BOOLEAN DEFAULT false,
  total_value     DECIMAL(14,2),
  -- Status
  status          VARCHAR(50) DEFAULT 'proposed',
  -- proposed → negotiating → agreed → advance_paid → growing → ready_harvest →
  -- quality_check → delivered → payment_complete → completed
  signed_by_buyer BOOLEAN DEFAULT false,
  signed_by_farmer BOOLEAN DEFAULT false,
  signed_at       TIMESTAMPTZ,
  -- Recurring
  is_recurring    BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20),  -- monthly, quarterly, seasonal
  parent_contract_id UUID REFERENCES farming_contracts(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID REFERENCES farming_contracts(id) ON DELETE CASCADE,
  milestone_type  VARCHAR(50) NOT NULL,
  title           VARCHAR(200),
  due_date        DATE,
  status          VARCHAR(30) DEFAULT 'pending',
  notes           TEXT,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Backend Routes (`backend/src/routes/contracts.js`)

```
POST   /api/contracts                    — Create contract proposal
GET    /api/contracts                    — My contracts (as buyer/farmer)
GET    /api/contracts/:id               — Contract detail + milestones
PATCH  /api/contracts/:id/sign          — Sign contract (buyer or farmer)
PATCH  /api/contracts/:id/milestone     — Update milestone status
POST   /api/contracts/:id/renew         — Renew/create recurring instance
GET    /api/contracts/templates          — Standard contract templates
```

---

### 2C. Trust Score System ⭐

**Enhancement to existing reviews + profile system.**

#### Database Schema

```sql
CREATE TABLE IF NOT EXISTS trust_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  -- Component scores (0-100)
  profile_completeness INTEGER DEFAULT 0,
  transaction_history  INTEGER DEFAULT 0,
  review_average       INTEGER DEFAULT 0,
  response_rate        INTEGER DEFAULT 0,
  delivery_reliability INTEGER DEFAULT 0,
  payment_reliability  INTEGER DEFAULT 0,
  community_activity   INTEGER DEFAULT 0,
  verification_level   INTEGER DEFAULT 0,
  -- Composite
  overall_score   INTEGER DEFAULT 0,
  trust_tier      VARCHAR(20) DEFAULT 'new',
  -- new → bronze → silver → gold → platinum
  badges          TEXT[] DEFAULT '{}',
  -- ['verified_farmer', 'top_seller', 'reliable_buyer', 'organic_certified']
  last_computed   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Precompute on schedule (daily cron)
CREATE OR REPLACE FUNCTION compute_trust_score(p_user_id UUID) RETURNS void AS $$
  -- Logic: weighted average of all components
  -- profile_completeness: 15%
  -- transaction_history: 25%
  -- review_average: 20%
  -- response_rate: 10%
  -- delivery_reliability: 15%
  -- payment_reliability: 10%
  -- community_activity: 5%
$$ LANGUAGE plpgsql;
```

#### Backend Routes

```
GET  /api/trust/:userId          — Get user trust score + badges
GET  /api/trust/my               — My own trust details with improvement tips
POST /api/trust/verify           — Submit verification document
GET  /api/trust/leaderboard      — Top trusted users in district
```

---

### 2D. Satellite + Weather Crop Monitoring 🛰️

**Why:** Remote crop health monitoring builds trust with buyers/exporters and enables insurance claims.

#### Database Schema

```sql
CREATE TABLE IF NOT EXISTS crop_monitoring (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  plan_id         UUID REFERENCES crop_plans(id),
  -- Location
  field_boundary  JSONB,  -- GeoJSON polygon of field
  field_lat       DECIMAL(10,7),
  field_lng       DECIMAL(10,7),
  area_acres      DECIMAL(6,2),
  -- Satellite data
  ndvi_score      DECIMAL(4,3),  -- Normalized Difference Vegetation Index (0-1)
  ndvi_trend      VARCHAR(20),   -- improving, stable, declining
  crop_health     VARCHAR(30),   -- excellent, good, moderate, poor, critical
  -- Alerts
  alert_type      VARCHAR(50),
  -- pest_risk, drought_stress, flood_risk, nutrient_deficiency, ready_harvest
  alert_severity  VARCHAR(20) DEFAULT 'info',
  alert_message   TEXT,
  alert_message_te TEXT,
  -- Weather correlation
  rainfall_mm_7d  DECIMAL(6,2),
  temperature_avg DECIMAL(4,1),
  humidity_avg    DECIMAL(4,1),
  -- Timestamp
  observed_date   DATE NOT NULL,
  data_source     VARCHAR(50) DEFAULT 'sentinel-2',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soil_health_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  -- Soil Health Card data (government integration)
  card_number     VARCHAR(50),
  sample_date     DATE,
  -- Nutrients
  nitrogen_level  VARCHAR(20),  -- low, medium, high
  phosphorus_level VARCHAR(20),
  potassium_level VARCHAR(20),
  organic_carbon  DECIMAL(4,2),
  ph_level        DECIMAL(3,1),
  ec_level        DECIMAL(4,2),
  -- Recommendations
  recommended_fertilizers JSONB DEFAULT '[]',
  recommended_crops JSONB DEFAULT '[]',
  -- Source
  data_source     VARCHAR(50) DEFAULT 'manual',
  -- manual, soil_health_card_api, lab_test
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Backend Routes

```
GET    /api/monitoring/crop-health       — Current crop health for my fields
GET    /api/monitoring/alerts            — Active alerts (pest, weather, etc.)
GET    /api/monitoring/ndvi-history      — NDVI trend over time for a field
POST   /api/monitoring/field-boundary    — Save field boundary (GPS polygon)
GET    /api/monitoring/soil-health       — My soil health records
POST   /api/monitoring/soil-health       — Add soil health test result
GET    /api/monitoring/satellite-image   — Latest satellite image for field
```

#### Integration Approach

1. **Sentinel-2 (Free)** — NDVI computation from ESA satellite imagery (10m resolution, 5-day revisit)
2. **Open Weather API** — Temperature, humidity, rainfall correlation
3. **Soil Health Card Portal** — Data scraping/API when available
4. **Custom Alerts** — Rule-based alerts from NDVI decline + weather patterns

---

## 📋 PHASE 3: Financial + Scale Layers (Weeks 13–18)

> **Goal:** Add the money layer — credit, insurance, and agent-assisted execution network.

### 3A. Financial Ecosystem 💰

#### Database Schema

```sql
CREATE TABLE IF NOT EXISTS credit_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  score           INTEGER DEFAULT 300,  -- 300-900 range
  max_credit_limit DECIMAL(12,2) DEFAULT 0,
  factors         JSONB DEFAULT '{}',
  -- {land_ownership, transaction_volume, repayment_history, trust_score}
  last_computed   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS micro_loans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id     UUID REFERENCES users(id),
  loan_type       VARCHAR(50) NOT NULL,
  -- Types: working_capital, input_purchase, equipment_rent, harvest_advance
  amount          DECIMAL(12,2) NOT NULL,
  interest_rate   DECIMAL(5,3) DEFAULT 0.01,  -- Monthly
  tenure_days     INTEGER NOT NULL,
  purpose         TEXT,
  linked_order_id UUID,  -- If loan is for specific order/input purchase
  -- Status
  status          VARCHAR(50) DEFAULT 'applied',
  -- applied → under_review → approved → disbursed → repaying → completed → defaulted
  disbursed_at    TIMESTAMPTZ,
  due_date        DATE,
  repaid_amount   DECIMAL(12,2) DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_insurance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id),
  crop_id         UUID REFERENCES crop_catalog(id),
  season          VARCHAR(20),
  year            INTEGER,
  area_acres      DECIMAL(6,2),
  sum_insured     DECIMAL(12,2),
  premium_amount  DECIMAL(10,2),
  premium_paid    BOOLEAN DEFAULT false,
  -- Claim
  claim_status    VARCHAR(50) DEFAULT 'active',
  claim_reason    TEXT,
  claim_amount    DECIMAL(12,2),
  claim_approved  BOOLEAN DEFAULT false,
  claim_settled   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Backend Routes

```
GET    /api/finance/credit-score         — My credit score
GET    /api/finance/eligibility          — Loan eligibility check
POST   /api/finance/loans/apply          — Apply for micro-loan
GET    /api/finance/loans                — My loans
POST   /api/finance/loans/:id/repay      — Make repayment
GET    /api/finance/insurance/plans      — Available crop insurance plans
POST   /api/finance/insurance/apply      — Apply for crop insurance
POST   /api/finance/insurance/:id/claim  — File insurance claim
```

---

### 3B. Agent Network System 👥

#### Database Schema

```sql
CREATE TABLE IF NOT EXISTS agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) UNIQUE,
  agent_type      VARCHAR(50) DEFAULT 'village_agent',
  -- village_agent, mandal_coordinator, district_manager
  district_id     UUID REFERENCES districts(id),
  mandal          VARCHAR(100),
  villages_covered TEXT[] DEFAULT '{}',
  -- Performance
  farmers_onboarded INTEGER DEFAULT 0,
  orders_facilitated INTEGER DEFAULT 0,
  total_commission DECIMAL(12,2) DEFAULT 0,
  monthly_target  INTEGER DEFAULT 20,
  -- Status
  is_active       BOOLEAN DEFAULT true,
  training_completed BOOLEAN DEFAULT false,
  device_type     VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id),
  activity_type   VARCHAR(50) NOT NULL,
  -- onboarding, order_assist, training_session, market_visit, issue_resolved
  farmer_id       UUID REFERENCES users(id),
  description     TEXT,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  photo_proof     TEXT,
  location_lat    DECIMAL(10,7),
  location_lng    DECIMAL(10,7),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id),
  activity_id     UUID REFERENCES agent_activities(id),
  commission_type VARCHAR(50),
  -- onboarding_bonus, order_percentage, monthly_fixed, training_bonus
  amount          DECIMAL(10,2) NOT NULL,
  status          VARCHAR(30) DEFAULT 'pending',
  -- pending → approved → paid
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Backend Routes

```
POST   /api/agents/register              — Register as agent
GET    /api/agents/dashboard             — Agent dashboard (targets, earnings)
POST   /api/agents/onboard-farmer        — Assisted farmer onboarding
POST   /api/agents/assist-order          — Facilitate order for farmer
GET    /api/agents/my-farmers            — Farmers onboarded by agent
GET    /api/agents/commissions           — Commission history
GET    /api/agents/leaderboard           — Top agents in district
```

#### Frontend: Agent Dashboard Screen

- **Daily View** — Today's targets, farmers to visit
- **Onboard** — Step-by-step assisted registration (agent fills form)
- **Assist Order** — Create listing/order on behalf of farmer
- **Earnings** — Commission tracking and payout history
- **Training** — Agent-specific training modules

---

### 3C. Voice-First UX Enhancement 🎤

**Enhancement to existing i18n + trade voice notes.**

#### Implementation

1. **Voice Navigation** — Add global voice command listener
   - "Show my crops" → Navigate to FarmDiary
   - "Today's price of paddy" → Show intelligence price
   - "Create listing" → Open listing form with voice fill
   - "My orders" → Navigate to orders

2. **Voice Form Fill** — Extend existing voice_note capability
   - All text inputs get microphone button
   - Speech-to-text → fills field
   - Confirm with voice: "Yes" / "No"

3. **Simplified Flows** (WhatsApp-like)
   - Reduce form fields to minimum essential
   - Progressive disclosure (ask one thing at a time)
   - Big buttons, large text option for elder farmers
   - Chat-like interface for order placement

#### Technical Approach

```javascript
// Web Speech API (already supported in Android WebView)
const recognition = new webkitSpeechRecognition();
recognition.lang = getState().language === 'te' ? 'te-IN' : 'hi-IN';
recognition.continuous = false;

// Integration with existing i18n system
// Voice commands mapped per language
const VOICE_COMMANDS = {
  te: { 'నా పంటలు': '/farm-diary', 'ధరలు': '/intelligence', ... },
  hi: { 'मेरी फसलें': '/farm-diary', 'भाव': '/intelligence', ... },
  en: { 'my crops': '/farm-diary', 'prices': '/intelligence', ... },
};
```

---

## 📋 Implementation Checklist Summary

### Phase 1 (Weeks 1-6) — CORE OS FOUNDATION

- [ ] **Logistics System**
  - [ ] DB migration (logistics_partners, delivery_requests, delivery_batches)
  - [ ] Backend routes (partner CRUD, request lifecycle, batch optimization)
  - [ ] Frontend: LogisticsScreen (track, schedule, partner dashboard)
  - [ ] Integration: Auto-create delivery on trade order dispatch
  - [ ] Push notifications for partner assignment

- [ ] **Input Marketplace**
  - [ ] DB migration (input_categories, input_products, input_sellers, input_orders)
  - [ ] Backend routes (browse, order, recommendations)
  - [ ] Frontend: InputsScreen (categories, products, cart, orders)
  - [ ] Seed initial product catalog (20+ common inputs)
  - [ ] Integration: Link to logistics for delivery

- [ ] **Crop Planning AI**
  - [ ] DB migration (crop_plans, crop_plan_tasks, season_reports)
  - [ ] Backend routes (recommend, create plan, task management)
  - [ ] Frontend: Enhance FarmDiary with "Plan Next Season" tab
  - [ ] Recommendation algorithm (heuristic v1)
  - [ ] Season P&L report generation

- [ ] **Multi-Stakeholder Onboarding**
  - [ ] DB migration (exporter_profiles, supplier_profiles, bank_partners)
  - [ ] Backend routes (role-specific registration)
  - [ ] Frontend: Role selection on signup → tailored onboarding
  - [ ] Role-based home screen routing
  - [ ] Verification document upload for each role

### Phase 2 (Weeks 7-12) — INTELLIGENCE + TRUST

- [ ] **Demand Intelligence ML**
  - [ ] DB migration (price_predictions, demand_signals)
  - [ ] Price prediction service (moving averages + seasonal)
  - [ ] Demand signal computation (cron job)
  - [ ] Frontend: Enhanced Intelligence with prediction charts
  - [ ] Push: Daily personalized market advisory

- [ ] **Contract Farming**
  - [ ] DB migration (farming_contracts, contract_milestones)
  - [ ] Backend routes (propose, negotiate, sign, track)
  - [ ] Frontend: ContractScreen (create, manage, milestones)
  - [ ] Integration with escrow for advance payments

- [ ] **Trust Score System**
  - [ ] DB migration (trust_scores)
  - [ ] Score computation function (daily cron)
  - [ ] Backend routes (view score, leaderboard)
  - [ ] Frontend: Trust badge display on all profiles
  - [ ] Verification document upload flow

- [ ] **Satellite Crop Monitoring**
  - [ ] DB migration (crop_monitoring, soil_health_records)
  - [ ] Sentinel-2 NDVI data pipeline (scheduled fetch)
  - [ ] Alert generation from NDVI + weather correlation
  - [ ] Frontend: Field health view with map + NDVI timeline
  - [ ] Soil health card data entry/import

### Phase 3 (Weeks 13-18) — FINANCIAL + SCALE

- [ ] **Financial Ecosystem**
  - [ ] DB migration (credit_scores, micro_loans, crop_insurance)
  - [ ] Credit scoring algorithm (from farm data + transactions)
  - [ ] Loan application workflow
  - [ ] Insurance plans and claim flow
  - [ ] Frontend: FinanceScreen

- [ ] **Agent Network**
  - [ ] DB migration (agents, agent_activities, agent_commissions)
  - [ ] Agent registration + training module
  - [ ] Assisted onboarding flow (agent fills on behalf)
  - [ ] Commission calculation system
  - [ ] Frontend: AgentDashboardScreen

- [ ] **Voice-First UX**
  - [ ] Voice command listener (global)
  - [ ] Speech-to-text on all input fields
  - [ ] Telugu/Hindi voice command mapping
  - [ ] Simplified "chat-like" order flow
  - [ ] Large-text / elder-friendly mode

### Phase 4 (Weeks 19-24) — ECOSYSTEM EXPANSION

- [ ] **Bank/NBFC Partner Portal**
  - [ ] Partner login with API key
  - [ ] Loan application forwarding API
  - [ ] Disbursement webhook + status tracking
  - [ ] Portfolio analytics dashboard
  - [ ] Automated credit data sharing (with farmer consent)

- [ ] **Government Integration Layer**
  - [ ] PM-KISAN beneficiary data integration
  - [ ] eNAM (National Agriculture Market) listing sync
  - [ ] Soil Health Card portal data fetch
  - [ ] PMFBY crop insurance claim integration
  - [ ] NABARD/SFAC FPO registration data sync

- [ ] **Exporter Dashboard**
  - [ ] Bulk procurement order creation
  - [ ] Quality certificate management (lab reports, phytosanitary)
  - [ ] Container/shipment tracking integration
  - [ ] Multi-FPO sourcing from single crop/district
  - [ ] Export documentation auto-generation

- [ ] **Open API & Integration Layer**
  - [ ] REST API documentation (Swagger/OpenAPI)
  - [ ] API key management for partners
  - [ ] Webhook system for real-time events
  - [ ] Rate limiting + usage analytics
  - [ ] SDK/client libraries (Node.js, Python)

- [ ] **District-Level Analytics Dashboard**
  - [ ] Crop-wise area, production, yield analytics
  - [ ] Price trends and market flow visualization
  - [ ] Farmer income heatmap
  - [ ] FPO performance scorecards
  - [ ] Agent network coverage maps

---

## 🔑 Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Add to existing monorepo** | All code follows same Express + PostgreSQL + Vite pattern |
| **New DB migrations (V6, V7)** | Follow existing migrate-v5 pattern, non-breaking |
| **Same route pattern** | Express router with authMiddleware, same error handling |
| **Same frontend pattern** | Vanilla JS screens with api.js calls, same UI components |
| **Leverage existing services** | Push notifications, cache, payments, SMS already work |
| **Scheduler for intelligence** | Extend existing `scheduler.js` for daily score/prediction jobs |
| **Multi-role architecture** | Single user table with role-specific profile tables |
| **API-first for Phase 4** | Partner integrations via well-documented REST APIs |
| **Event-driven for scaling** | WebSocket + webhooks for real-time partner notifications |

---

## 📈 Success Metrics

| Phase | KPI | Target |
|-------|-----|--------|
| **Phase 1** | Orders with delivery completed | 50+ in first month |
| **Phase 1** | Input orders placed | 100+ in first month |
| **Phase 1** | Farmers using crop planning | 30% of active users |
| **Phase 1** | Multi-role registrations | 20+ non-farmer signups |
| **Phase 2** | Contract farming agreements | 20+ active contracts |
| **Phase 2** | Price prediction accuracy | >75% within 10% error |
| **Phase 2** | Users with trust score > 50 | 60% of active users |
| **Phase 2** | Fields with satellite monitoring | 100+ fields mapped |
| **Phase 3** | Micro-loans disbursed | 50+ in first quarter |
| **Phase 3** | Active agents | 10+ per district |
| **Phase 3** | Voice command usage | 20% of interactions |
| **Phase 4** | Bank partners integrated | 3+ institutions |
| **Phase 4** | API calls from partners | 1000+ per month |
| **Phase 4** | Exporters active on platform | 10+ with orders |

---

## 🏗️ Platform Evolution Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TODAY                                                                   │
│  "Selling platform with marketplace + intelligence + community"         │
├─────────────────────────────────────────────────────────────────────────┤
│  AFTER PHASE 1                                                          │
│  "Full-stack agri platform with logistics + inputs + multi-role"        │
├─────────────────────────────────────────────────────────────────────────┤
│  AFTER PHASE 2                                                          │
│  "Intelligent platform with predictions + contracts + monitoring"       │
├─────────────────────────────────────────────────────────────────────────┤
│  AFTER PHASE 3                                                          │
│  "Farmer OS with finance + agents + voice-first access"                │
├─────────────────────────────────────────────────────────────────────────┤
│  AFTER PHASE 4                                                          │
│  "India's Agriculture Operating System — the unified ecosystem"         │
│                                                                         │
│  Connecting: Farmers ↔ FPOs ↔ Traders ↔ Exporters ↔ Suppliers ↔ Banks  │
│  Powered by: Intelligence + Trust + Finance + Logistics                 │
│  Accessible via: Telugu/Hindi + Voice + Offline + Agent-assisted        │
│  Institutional: NABARD/SFAC/PM-KISAN/eNAM integrated                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧭 Competitive Positioning

| Platform | What They Do | Our Advantage |
|----------|-------------|---------------|
| **AgriStack (Govt)** | Farmer ID + Land records | We add intelligence + marketplace + execution |
| **DeHaat** | Input delivery + advisory | We add buyer discovery + logistics + finance |
| **Ninjacart** | Supply chain for retailers | We add farmer OS + planning + multi-stakeholder |
| **AgroStar** | Input marketplace + advice | We add produce marketplace + contracts + trust |
| **eNAM** | Mandi trading platform | We add pre-harvest contracts + logistics + credit |

**Our Moat:** Only platform that operates as a **full Operating System** across all 7 agriculture value chain participants, with **Telugu-first + voice + offline + agent** access.

---

## 📝 Final Notes

### What Makes This an "Operating System" (Not Just an App)

1. **Multi-stakeholder:** Serves all 7+ participant types in the agri value chain
2. **Data-driven:** Every transaction generates intelligence for better decisions
3. **Self-reinforcing:** More farmers → more data → better predictions → more farmers
4. **Platform effects:** Suppliers compete for farmers, buyers compete for supply
5. **Infrastructure layer:** Banks, government, logistics all plug into the same system
6. **Offline-capable:** Works in low-connectivity rural India via agents + offline mode

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Low internet in villages | Offline mode + agent network + USSD fallback |
| Farmer trust in digital | Start with value (free intelligence) → build trust → enable transactions |
| Regulatory (finance) | Partner with licensed banks/NBFCs, don't hold deposits |
| Cold start (no supply/demand) | Agent-driven onboarding + FPO partnerships for bulk supply |
| Competition from well-funded startups | Depth (full OS) > breadth (single feature apps) |
