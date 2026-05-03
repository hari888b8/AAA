# 🚀 AgriHub — Critical Components Implementation Plan

**Date:** May 2026  
**Scope:** Platform enhancement from "Selling Platform" → "Farmer Intelligence + Execution Platform"  
**Approach:** Phased implementation leveraging existing infrastructure

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

### 🔴 What's Actually Missing (Gap Analysis vs Problem Statement)

| # | Problem Statement Item | Reality Check | Actual Gap |
|---|------------------------|---------------|------------|
| 1 | Farmer OS (crop planning, yield, expenses) | **FarmDiary already covers 80%** — has crop lifecycle, expenses, yield tracking | Missing: Automated crop planning recommendations, season-over-season comparison |
| 2 | Demand Intelligence Engine | **Partially built** — supply-demand, prices, heatmap exist | Missing: Price prediction ML, crop demand forecasting, personalized recommendations |
| 3 | Logistics System | **Basic tracking exists** — order_tracking table + trade dispatching | Missing: Pickup scheduling, delivery partner network, route optimization, batching |
| 4 | Input Marketplace | **Equipment exists (KisanConnect)** | Missing: Seeds, fertilizers, pesticides, labor hiring marketplace |
| 5 | Financial Ecosystem | **Wallet + schemes exist** | Missing: Credit scoring, micro-loans, crop insurance, settlement automation |
| 6 | Farmer Trust & Identity | **Reviews + farmer profile + KYC exist** | Missing: Reliability score algorithm, transaction history scoring, verified badges |
| 7 | Subscription/Recurring Orders | **Subscriptions exist** | Missing: Contract farming, recurring purchase agreements, forward contracts |
| 8 | Community + Advisory | **Community fully built** — Q&A, experts, polls | Missing: Voice-based support, farmer groups (WhatsApp-style) |
| 9 | Offline + Agent Network | **Offline mode planned** (user_preferences.offline_mode) | Missing: Agent dashboard, assisted onboarding flow, agent commission system |
| 10 | Farmer-Friendly UX | **Telugu/Hindi i18n built**, voice notes in trade | Missing: Voice commands navigation, WhatsApp-like simplified flows |

---

## 🎯 Implementation Priority Stack

Based on gap analysis, here's what **actually needs building** (not rebuilding):

```
PRIORITY 1 (Phase 1 — 4-6 weeks): MUST-HAVE
├── 1A. Logistics System (biggest real gap)
├── 1B. Input Marketplace (seeds, fertilizers, pesticides)
└── 1C. Farmer OS Enhancement (crop planning AI)

PRIORITY 2 (Phase 2 — 4-6 weeks): HIGH IMPACT
├── 2A. Demand Intelligence ML Layer
├── 2B. Contract Farming / Forward Contracts
└── 2C. Trust Score System

PRIORITY 3 (Phase 3 — 4-6 weeks): SCALE LAYERS
├── 3A. Financial Ecosystem (credit + insurance)
├── 3B. Agent Network System
└── 3C. Voice-first UX Enhancement
```

---

## 📋 PHASE 1: Must-Have (Weeks 1–6)

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

## 📋 PHASE 2: High Impact (Weeks 7–12)

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

## 📋 PHASE 3: Scale Layers (Weeks 13–18)

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

### Phase 1 (Weeks 1-6) — MUST BUILD

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

### Phase 2 (Weeks 7-12) — HIGH IMPACT

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

### Phase 3 (Weeks 13-18) — SCALE

- [ ] **Financial Ecosystem**
  - [ ] DB migration (credit_scores, micro_loans, crop_insurance)
  - [ ] Credit scoring algorithm
  - [ ] Loan application workflow
  - [ ] Insurance plans and claim flow
  - [ ] Frontend: FinanceScreen

- [ ] **Agent Network**
  - [ ] DB migration (agents, agent_activities, agent_commissions)
  - [ ] Agent registration + training module
  - [ ] Assisted onboarding flow
  - [ ] Commission calculation system
  - [ ] Frontend: AgentDashboardScreen

- [ ] **Voice-First UX**
  - [ ] Voice command listener (global)
  - [ ] Speech-to-text on all input fields
  - [ ] Telugu/Hindi voice command mapping
  - [ ] Simplified "chat-like" order flow
  - [ ] Large-text / elder-friendly mode

---

## 🔑 Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Add to existing monorepo** | All code follows same Express + PostgreSQL + Vite pattern |
| **New DB migrations (V6)** | Follow existing migrate-v5 pattern, non-breaking |
| **Same route pattern** | Express router with authMiddleware, same error handling |
| **Same frontend pattern** | Vanilla JS screens with api.js calls, same UI components |
| **Leverage existing services** | Push notifications, cache, payments, SMS already work |
| **Scheduler for intelligence** | Extend existing `scheduler.js` for daily score/prediction jobs |

---

## 📈 Success Metrics

| Phase | KPI | Target |
|-------|-----|--------|
| Phase 1 | Orders with delivery completed | 50+ in first month |
| Phase 1 | Input orders placed | 100+ in first month |
| Phase 1 | Farmers using crop planning | 30% of active users |
| Phase 2 | Contract farming agreements | 20+ active contracts |
| Phase 2 | Price prediction accuracy | >75% within 10% error |
| Phase 2 | Users with trust score > 50 | 60% of active users |
| Phase 3 | Micro-loans disbursed | 50+ in first quarter |
| Phase 3 | Active agents | 10+ per district |
| Phase 3 | Voice command usage | 20% of interactions |

---

## 🏗️ One-Line Summary

> **Current:** "Selling platform with marketplace + intelligence + community"  
> **After Phase 1:** "Full-stack agri platform with marketplace + logistics + inputs"  
> **After Phase 2:** "Intelligent farming platform with predictions + contracts + trust"  
> **After Phase 3:** "Complete farmer OS with finance + agents + voice-first UX"
