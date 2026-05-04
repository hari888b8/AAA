# 🌾 AgriHub — Complete Platform Documentation (Pin-to-Pin)

> **Full Architecture Reference** for every app, every feature, every API endpoint, and every screen in the AgriHub Agriculture Operating System.

---

## 📋 Table of Contents

- [Platform Overview](#platform-overview)
- [Architecture Summary](#architecture-summary)
- [Technology Stack](#technology-stack)
- [App 1: AgriFlow — Supply Chain & Trade](#app-1-agriflow--supply-chain--trade)
- [App 2: AquaOS — Aquaculture Management](#app-2-aquaos--aquaculture-management)
- [App 3: KisanConnect — Equipment & Rural Services](#app-3-kisanconnect--equipment--rural-services)
- [App 4: AgriGalaxy — Input Marketplace](#app-4-agrigalaxy--input-marketplace)
- [App 5: BhoomiOS — Land Marketplace](#app-5-bhoomios--land-marketplace)
- [App 6: FarmerConnect — Rural Property & Housing](#app-6-farmerconnect--rural-property--housing)
- [Feature: Intelligence Engine](#feature-intelligence-engine)
- [Feature: Trade Execution Layer](#feature-trade-execution-layer)
- [Feature: Finance & Credit](#feature-finance--credit)
- [Feature: Agent Network](#feature-agent-network)
- [Feature: Contract Farming](#feature-contract-farming)
- [Feature: Satellite Monitoring](#feature-satellite-monitoring)
- [Feature: Crop Doctor (AI Diagnosis)](#feature-crop-doctor-ai-diagnosis)
- [Feature: Crop Planning AI](#feature-crop-planning-ai)
- [Feature: Weather Intelligence](#feature-weather-intelligence)
- [Feature: Farm Diary](#feature-farm-diary)
- [Feature: Logistics & Transport](#feature-logistics--transport)
- [Feature: Wallet & Payments](#feature-wallet--payments)
- [Feature: Escrow Payments](#feature-escrow-payments)
- [Feature: Government Schemes & Discovery](#feature-government-schemes--discovery)
- [Feature: Training & Learning](#feature-training--learning)
- [Feature: Jobs Board](#feature-jobs-board)
- [Feature: Community & Social](#feature-community--social)
- [Feature: Chat & Messaging](#feature-chat--messaging)
- [Feature: FPO Dashboard](#feature-fpo-dashboard)
- [Feature: Trust Score](#feature-trust-score)
- [Feature: Admin Panel](#feature-admin-panel)
- [Feature: Subscriptions & Plans](#feature-subscriptions--plans)
- [Feature: Watchlists & Alerts](#feature-watchlists--alerts)
- [Feature: Favorites](#feature-favorites)
- [Feature: Support Tickets](#feature-support-tickets)
- [Feature: Reviews & Ratings](#feature-reviews--ratings)
- [Feature: Push Notifications](#feature-push-notifications)
- [Feature: Bank Portal](#feature-bank-portal)
- [Feature: Exporter Portal](#feature-exporter-portal)
- [Feature: Government Portal](#feature-government-portal)
- [Feature: Onboarding Flow](#feature-onboarding-flow)
- [Feature: Settings](#feature-settings)
- [Feature: Upload & Media](#feature-upload--media)
- [Feature: Translation (i18n)](#feature-translation-i18n)
- [Feature: Analytics Dashboard](#feature-analytics-dashboard)
- [Platform Infrastructure](#platform-infrastructure)
- [Database Schema (Migrations)](#database-schema-migrations)
- [Background Scheduler](#background-scheduler)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [API Reference (All Endpoints)](#api-reference-all-endpoints)
- [Frontend Architecture](#frontend-architecture)
- [Role-Based Access](#role-based-access)
- [Build & Development](#build--development)
- [Testing](#testing)

---

## Platform Overview

AgriHub is India's **Agriculture Operating System** — a unified super-app platform that connects **145M+ farmers**, **10,000+ FPOs**, traders, exporters, input suppliers, banks, and logistics providers on one digital platform.

### Core Stats

| Metric | Value |
|--------|-------|
| Backend Routes | 50 files (13,403 lines) |
| Frontend Screens | 41 files (14,945 lines) |
| Backend Services | 11 services |
| Database Migrations | 9 versions |
| API Endpoints | 200+ REST endpoints |
| User Roles | 6 (Farmer, FPO, Buyer, Supplier, Service Provider, Admin) |
| Languages | 3 (English, Telugu, Hindi) |
| Platforms | Web PWA, Android (Kotlin), Responsive Mobile |

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Vite 6 + Vanilla JS)             │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ AgriFlow │ │  AquaOS  │ │  Kisan   │ │ AgriGlxy │           │
│  │  Screen  │ │  Screen  │ │ Connect  │ │  Screen  │  + 37 more│
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  App Shell → Router → 41 Screens → API Layer → State Store      │
│  i18n (3 lang) │ Offline Cache │ Pull-to-Refresh │ Error Guard  │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS / WebSocket
┌───────────────────────────────┴──────────────────────────────────┐
│                       BACKEND (Express 4 + Node.js 18)           │
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │  Auth   │  │  Trade  │  │ Finance  │  │  Intelligence   │   │
│  │(OTP/JWT)│  │ (State  │  │ (Credit, │  │ (Supply-Demand, │   │
│  │         │  │ Machine)│  │  Loans)  │  │  Predictions)   │   │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────────┘   │
│                                                                  │
│  50 Route Files │ 11 Services │ Middleware Chain │ Scheduler     │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────┴──────────────────────────────────┐
│                       DATA LAYER                                  │
│                                                                  │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │ PostgreSQL 15│  │  Redis 7    │  │ Supabase (Auth/Storage)│  │
│  │ (Primary DB) │  │ (Cache/Pub) │  │                        │  │
│  └──────────────┘  └─────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Vite 6.4 | Build tool, dev server, HMR |
| Vanilla JS (ES Modules) | Zero-framework SPA for 2G performance |
| CSS Custom Properties | Theming (dark/light) |
| PWA (Service Worker) | Offline-first architecture |
| Supabase JS SDK | Auth & storage client |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js 18+ | Runtime |
| Express 4 | HTTP framework |
| PostgreSQL 15 | Primary relational database |
| Redis 7 | Caching, pub/sub, session |
| Pino | Structured JSON logging |
| Helmet + HPP + CORS | Security middleware |
| UUID v4 | ID generation |
| WebSocket (ws) | Real-time chat & notifications |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker Compose | Local dev orchestration |
| Vercel | Frontend deployment |
| Netlify | Alternative frontend deployment |
| Android (Kotlin + Gradle) | Native mobile app |
| BullMQ / Queue service | Background job processing |

---

## App 1: AgriFlow — Supply Chain & Trade

> **The core agricultural marketplace — connecting farmers directly to buyers with verified supply listings.**

### Backend: `backend/src/routes/agriflow.js` (663 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agriflow/listings` | GET | Optional | Browse supply marketplace with filters |
| `/api/agriflow/listings/:id` | GET | Optional | Get single listing detail |
| `/api/agriflow/listings` | POST | Required | Create new supply listing |
| `/api/agriflow/listings/:id` | PATCH | Required | Update listing |
| `/api/agriflow/listings/:id` | DELETE | Required | Soft-delete listing |
| `/api/agriflow/listings/:id/inquiries` | POST | Required | Send inquiry to seller |
| `/api/agriflow/inquiries` | GET | Required | Get my inquiries |
| `/api/agriflow/inquiries/:id/respond` | POST | Required | Respond to an inquiry |
| `/api/agriflow/harvest` | GET | Optional | Browse harvest calendar listings |
| `/api/agriflow/harvest` | POST | Required | Add harvest schedule |
| `/api/agriflow/my-listings` | GET | Required | Farmer's own listings |
| `/api/agriflow/crops` | GET | Public | Crop catalog (names, icons, reference prices) |
| `/api/agriflow/districts` | GET | Public | District master data |

### Key Features
- **Proximity Search**: Haversine formula for radius-based filtering (`radius_km`, `lat`, `lng`)
- **Advanced Filters**: Crop, district, organic status, grade, price range, quantity range
- **Sort Options**: Price (asc/desc), newest, quantity, distance
- **Harvest Calendar**: Future availability scheduling
- **Inquiry System**: Buyer→Farmer communication with response tracking
- **Crop Catalog**: Master data with icons, reference prices

### Frontend: `src/screens/AgriFlowScreen.js` (794 lines)
- Supply listing cards with crop images, prices, grades
- Filter panel (crop, district, organic, price range)
- Create listing form with photo upload
- Inquiry management (sent/received)
- Harvest calendar view
- Real-time price indicators

### Database Tables
- `supply_listings` — Main marketplace listings
- `inquiries` — Buyer-to-seller inquiries
- `harvest_listings` — Future harvest availability
- `crop_catalog` — Master crop reference data
- `districts` — Geographic master data

---

## App 2: AquaOS — Aquaculture Management

> **Complete aquaculture platform — from pond management to species tracking, water quality, feed, and harvest.**

### Backend: `backend/src/routes/aquaos.js` (1,129 lines — largest route file)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/aquaos/farms` | GET | Required | List farmer's aqua farms |
| `/api/aquaos/farms` | POST | Required | Create aqua farm |
| `/api/aquaos/farms/:id` | PATCH | Required | Update farm |
| `/api/aquaos/farms/:id/ponds` | GET | Required | List ponds in a farm |
| `/api/aquaos/farms/:id/ponds` | POST | Required | Add pond to farm |
| `/api/aquaos/ponds/:id` | PATCH | Required | Update pond details |
| `/api/aquaos/ponds/:id/stock` | POST | Required | Stock species into pond |
| `/api/aquaos/ponds/:id/stock` | GET | Required | Get stocking history |
| `/api/aquaos/ponds/:id/feed` | POST | Required | Log feed event |
| `/api/aquaos/ponds/:id/feed` | GET | Required | Feed history for pond |
| `/api/aquaos/ponds/:id/water-quality` | POST | Required | Log water quality reading |
| `/api/aquaos/ponds/:id/water-quality` | GET | Required | Water quality history |
| `/api/aquaos/ponds/:id/health` | POST | Required | Log health observation |
| `/api/aquaos/ponds/:id/health` | GET | Required | Health event history |
| `/api/aquaos/ponds/:id/harvest` | POST | Required | Record harvest event |
| `/api/aquaos/ponds/:id/harvest` | GET | Required | Harvest history |
| `/api/aquaos/ponds/:id/mortality` | POST | Required | Record mortality event |
| `/api/aquaos/species` | GET | Optional | Species catalog |
| `/api/aquaos/feed-types` | GET | Optional | Feed type catalog |
| `/api/aquaos/dashboard` | GET | Required | Aggregate dashboard stats |
| `/api/aquaos/marketplace` | GET | Optional | Aqua marketplace listings |
| `/api/aquaos/marketplace` | POST | Required | Create marketplace listing |

### Key Features
- **Farm Management**: Multi-farm support with GPS, district, area tracking
- **Pond Lifecycle**: Create → Stock → Feed → Monitor → Harvest
- **Water Quality Monitoring**: pH, dissolved oxygen, temperature, ammonia, turbidity
- **Species Tracking**: Stocking density, growth rates, survival rates
- **Feed Management**: Daily feed logs, FCR (Feed Conversion Ratio) tracking
- **Health Events**: Disease detection, treatment records
- **Mortality Tracking**: Death events with causes
- **Harvest Recording**: Weight, grade, buyer info, price
- **Dashboard Analytics**: Total ponds, active stock, recent harvests, water alerts
- **Aqua Marketplace**: Buy/sell aqua produce

### Frontend: `src/screens/AquaOSScreen.js` (1,632 lines — largest screen)
- Farm selector with pond grid
- Pond detail view (species, water quality graphs, feed log)
- Water quality dashboard with alerts (critical pH, low DO₂)
- Stocking wizard (species, count, avg weight)
- Feed calculator and log
- Harvest recording with photo + weight
- Aqua marketplace browser

### Database Tables
- `aqua_farms` — Farm profiles
- `ponds` — Individual pond records
- `pond_stockings` — Species stocking events
- `pond_feed_logs` — Daily feed records
- `pond_water_quality` — Water readings (pH, DO, temp, ammonia)
- `pond_health_events` — Disease/treatment records
- `pond_harvests` — Harvest events
- `pond_mortality` — Mortality tracking
- `aqua_species_catalog` — Species master data
- `aqua_feed_types` — Feed type master data
- `aqua_marketplace` — Buy/sell listings

---

## App 3: KisanConnect — Equipment & Rural Services

> **Rural super-app — equipment rental marketplace + booking system + labor services.**

### Backend: `backend/src/routes/kisanconnect.js` (1,083 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/kisanconnect/equipment` | GET | Optional | Browse equipment listings |
| `/api/kisanconnect/equipment` | POST | Required | Create equipment listing |
| `/api/kisanconnect/equipment/:id` | PATCH | Required | Update listing |
| `/api/kisanconnect/equipment/:id/book` | POST | Required | Book equipment |
| `/api/kisanconnect/bookings` | GET | Required | Get my bookings |
| `/api/kisanconnect/bookings/:id/status` | PATCH | Required | Update booking status |
| `/api/kisanconnect/bookings/:id/cancel` | POST | Required | Cancel booking |
| `/api/kisanconnect/bookings/:id/rate` | POST | Required | Rate after completion |
| `/api/kisanconnect/services` | GET | Optional | Browse service providers |
| `/api/kisanconnect/services` | POST | Required | Register as service provider |
| `/api/kisanconnect/services/:id/hire` | POST | Required | Hire a service provider |
| `/api/kisanconnect/labor` | GET | Optional | Browse labor availability |
| `/api/kisanconnect/labor` | POST | Required | Post labor availability |
| `/api/kisanconnect/labor/:id/hire` | POST | Required | Hire labor |
| `/api/kisanconnect/my-equipment` | GET | Required | Owner's equipment listings |
| `/api/kisanconnect/earnings` | GET | Required | Owner's rental earnings |
| `/api/kisanconnect/dashboard` | GET | Required | Equipment owner dashboard |

### Key Features
- **Equipment Rental**: Tractors, harvesters, drones, irrigation — daily/hourly rates
- **Booking System**: Request → Confirm → In-Use → Complete → Rate
- **Service Provider Registry**: Skilled workers (spray operators, soil testers)
- **Labor Marketplace**: Daily wage workers, seasonal workers
- **Rating System**: Post-service ratings with comments
- **Earnings Dashboard**: For equipment owners
- **Operator Included Option**: Equipment with/without operator
- **Proximity Search**: District-based filtering

### Frontend: `src/screens/KisanConnectScreen.js` (955 lines)
- Equipment gallery with type filters
- Booking calendar (date picker)
- Service provider profiles
- My Bookings tracker (upcoming/past)
- Equipment owner dashboard (earnings, utilization)
- Labor hiring flow

### Database Tables
- `equipment` — Equipment listings (type, rates, availability)
- `equipment_bookings` — Booking records (dates, status, payment)
- `service_providers` — Skilled worker profiles
- `labor_postings` — Labor availability
- `equipment_reviews` — Ratings & reviews

---

## App 4: AgriGalaxy — Input Marketplace

> **Agricultural inputs e-commerce — seeds, fertilizers, pesticides, tools from verified stores.**

### Backend: `backend/src/routes/agrigalaxy.js` (210 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agrigalaxy/stores` | GET | Optional | List agri-input stores |
| `/api/agrigalaxy/stores` | POST | Required | Create store (supplier) |
| `/api/agrigalaxy/stores/:id` | PATCH | Required | Update store |
| `/api/agrigalaxy/stores/:id/products` | GET | Optional | List products in store |
| `/api/agrigalaxy/stores/:id/products` | POST | Required | Add product to store |
| `/api/agrigalaxy/products/:id` | PATCH | Required | Update product |
| `/api/agrigalaxy/products` | GET | Optional | Search all products |
| `/api/agrigalaxy/orders` | POST | Required | Place order |
| `/api/agrigalaxy/orders` | GET | Required | My orders |

### Key Features
- **Store Management**: Suppliers create verified stores with categories
- **Product Catalog**: Seeds, fertilizers, pesticides, tools with pricing
- **Search**: Cross-store product search
- **Order Flow**: Cart → Order → Track → Deliver
- **Category Filtering**: Type-based browsing
- **GST Integration**: Store GST number tracking

### Frontend: `src/screens/AgriGalaxyScreen.js` (840 lines)
- Store browser with category filter
- Product grid with images, prices, ratings
- Product detail with add-to-cart
- Order history and tracking
- Supplier dashboard (orders, inventory)

### Database Tables
- `agrigalaxy_stores` — Store profiles
- `agrigalaxy_products` — Product listings
- `agrigalaxy_orders` — Purchase orders

---

## App 5: BhoomiOS — Land Marketplace

> **Land sale/lease/rent marketplace for agricultural land with soil and water data.**

### Backend: `backend/src/routes/bhoomios.js` (200 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/bhoomios/listings` | GET | Optional | Browse land listings |
| `/api/bhoomios/listings/:id` | GET | Optional | Single listing detail |
| `/api/bhoomios/listings` | POST | Required | Create land listing |
| `/api/bhoomios/listings/:id` | PATCH | Required | Update listing |
| `/api/bhoomios/listings/:id/inquire` | POST | Required | Send inquiry |
| `/api/bhoomios/my-listings` | GET | Required | My land listings |

### Key Features
- **Land Types**: Agricultural, barren, orchard, wetland
- **Listing Modes**: Sale, lease, rent
- **Filters**: Price range, area range, district, water source, soil type
- **Water Source Data**: Borewell, canal, river, rain-fed
- **Soil Type Data**: Black, red, alluvial, laterite
- **Verification Badge**: Verified land documents flag
- **Inquiry System**: Buyer→Owner communication

### Frontend: `src/screens/BhoomiOSScreen.js` (636 lines)
- Land listing cards with area, price, type badges
- Map view with land markers
- Filter panel (type, mode, price, area, water, soil)
- Listing creation form
- Inquiry management

### Database Tables
- `bhoomios_listings` — Land listings (type, mode, price, area, GPS, water_sources, soil_types)

---

## App 6: FarmerConnect — Rural Property & Housing

> **Rural property rental and housing platform for farmers and agricultural workers.**

### Backend: `backend/src/routes/farmerconnect.js` (386 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/farmerconnect/properties` | GET | Optional | Browse properties |
| `/api/farmerconnect/properties` | POST | Required | Create property listing |
| `/api/farmerconnect/properties/:id` | GET | Optional | Property detail |
| `/api/farmerconnect/properties/:id` | PATCH | Required | Update property |
| `/api/farmerconnect/properties/:id/inquire` | POST | Required | Send inquiry |
| `/api/farmerconnect/my-properties` | GET | Required | My listings |
| `/api/farmerconnect/services` | GET | Optional | Browse local services |
| `/api/farmerconnect/services` | POST | Required | Register service |
| `/api/farmerconnect/events` | GET | Optional | Community events |
| `/api/farmerconnect/events` | POST | Required | Create event |

### Key Features
- **Property Types**: House, room, godown (warehouse), shop, farm stay
- **Rental System**: Monthly/weekly/daily rates
- **Verification**: Verified property badge
- **Local Services**: Electricians, plumbers, mechanics, etc.
- **Community Events**: Local agricultural events and meetings
- **Amenity Tracking**: Water, electricity, road access, etc.

### Frontend: `src/screens/FarmerConnectScreen.js` (703 lines)
- Property cards with images, rent, type
- Service provider directory
- Event calendar
- Create listing with amenity picker

### Database Tables
- `properties` — Property listings
- `property_inquiries` — Inquiry records
- `local_services` — Service provider directory
- `community_events` — Local events

---

## Feature: Intelligence Engine

> **AI-powered supply-demand analysis, price predictions, and market intelligence.**

### Backend: `backend/src/routes/intelligence.js` (485 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/intelligence/supply-demand` | GET | Public | Supply-demand gap analysis |
| `/api/intelligence/predictions` | GET | Public | Price predictions by crop |
| `/api/intelligence/trends` | GET | Public | Market trend analysis |
| `/api/intelligence/apmc-prices` | GET | Public | APMC mandi prices (real-time) |
| `/api/intelligence/crop-advisory` | GET | Required | AI crop advisory |
| `/api/intelligence/district-report` | GET | Public | District-level intelligence |
| `/api/intelligence/seasonal-forecast` | GET | Public | Seasonal production forecast |
| `/api/intelligence/price-alerts` | POST | Required | Set price alert |
| `/api/intelligence/price-alerts` | GET | Required | My price alerts |

### Key Features
- **Supply-Demand Gap**: Real-time surplus/deficit/balanced signals per crop
- **Price Predictions**: Historical trend extrapolation
- **APMC Integration**: Live mandi prices from government APMCs
- **Crop Advisory**: AI-generated planting/harvesting advice
- **District Reports**: Region-specific market intelligence
- **Price Alerts**: Configurable notifications when target price reached
- **Redis Caching**: 2-minute TTL for expensive queries

### Frontend: `src/screens/IntelligenceScreen.js` (926 lines)
- Supply-demand heatmap cards
- Price trend charts (30/60/90 day)
- APMC price ticker
- Crop advisory cards with action items
- Price alert management

### Database Tables (via `migrate-v7-intelligence.js`)
- `apmc_prices` — Daily APMC mandi prices
- `price_predictions` — ML-generated forecasts
- `price_alerts` — User-configured alerts

---

## Feature: Trade Execution Layer

> **End-to-end trusted trade with state machine, escrow, quality verification, and GPS tracking.**

### Backend: `backend/src/routes/trade.js` (706 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/trade/listings` | POST | Required | Create trade listing (GPS + Photo + Voice) |
| `/api/trade/listings` | GET | Optional | Browse trade listings |
| `/api/trade/orders` | POST | Required | Create trade order from listing |
| `/api/trade/orders` | GET | Required | My trade orders |
| `/api/trade/orders/:id` | GET | Required | Order detail with timeline |
| `/api/trade/orders/:id/bid` | POST | Required | Place bid on order |
| `/api/trade/orders/:id/accept-bid` | POST | Required | Accept a bid |
| `/api/trade/orders/:id/fund-escrow` | POST | Required | Fund escrow account |
| `/api/trade/orders/:id/verify-quality` | POST | Required | Mark quality verified |
| `/api/trade/orders/:id/dispatch` | POST | Required | Mark dispatched |
| `/api/trade/orders/:id/in-transit` | POST | Required | Mark in transit |
| `/api/trade/orders/:id/deliver` | POST | Required | Mark delivered |
| `/api/trade/orders/:id/release-payment` | POST | Required | Release payment from escrow |
| `/api/trade/orders/:id/dispute` | POST | Required | Raise dispute |
| `/api/trade/orders/:id/cancel` | POST | Required | Cancel order |
| `/api/trade/orders/:id/timeline` | GET | Required | Full state timeline |

### State Machine

```
created → bid_placed → bid_accepted → escrow_funded → quality_verified
    → dispatched → in_transit → delivered → payment_released

At any point: → disputed → resolved_seller | resolved_buyer
Before escrow: → cancelled
```

### Key Features
- **Trusted Listings**: Require GPS coordinates + photos + optional voice note
- **Bidding System**: Buyers compete with bids on listings
- **Escrow Protection**: Platform holds funds until delivery confirmed
- **Quality Verification**: Third-party or buyer verification step
- **Full Traceability**: Every state transition logged with timestamp, actor, notes
- **Commission**: 1.5% platform commission on successful trades
- **Dispute Resolution**: Formal dispute process with resolution

### Database Tables (via `migrate-v3-trade.js`)
- `trade_orders` — Order records with state machine status
- `trade_bids` — Bid records per order
- `trade_timeline` — State transition audit log
- `escrow_transactions` — Escrow fund/release records

---

## Feature: Finance & Credit

> **Agricultural credit scoring, loan applications, and insurance products.**

### Backend: `backend/src/routes/finance.js` (164 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/finance/credit-score` | GET | Required | Get my credit score |
| `/api/finance/credit-score/compute` | POST | Required | Recompute credit score |
| `/api/finance/loans` | GET | Required | My loan applications |
| `/api/finance/loans/apply` | POST | Required | Apply for loan |
| `/api/finance/insurance` | GET | Required | My insurance policies |
| `/api/finance/insurance/apply` | POST | Required | Apply for crop insurance |

### Key Features
- **Credit Scoring**: Based on trade history (base 300, max 900)
- **Loan Eligibility**: Auto-calculated from credit score
- **Loan Application**: Digital application with documentation
- **Crop Insurance**: PMFBY-style crop insurance enrollment
- **Score Factors**: Trade count, repayment history, platform activity

### Frontend: `src/screens/FinanceScreen.js`
- Credit score gauge (circular progress)
- Loan application wizard
- Insurance product cards
- EMI calculator

### Database Tables (via `migrate-v8-finance.js`)
- `credit_scores` — User credit scores with factors
- `loan_applications` — Loan requests and status
- `insurance_policies` — Crop insurance enrollments

---

## Feature: Agent Network

> **Field agent registration, assisted farmer onboarding, and commission tracking.**

### Backend: `backend/src/routes/agents.js` (134 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agents/register` | POST | Required | Register as field agent |
| `/api/agents/me` | GET | Required | Get agent profile |
| `/api/agents/dashboard` | GET | Required | Agent stats dashboard |
| `/api/agents/onboard` | POST | Required | Onboard a farmer (assisted) |
| `/api/agents/farmers` | GET | Required | Farmers onboarded by me |
| `/api/agents/commissions` | GET | Required | My commission history |

### Key Features
- **Agent Registration**: Name, phone, district, mandal, coverage villages
- **Assisted Onboarding**: Agent helps farmer create account (earns commission)
- **Commission Tracking**: Per-onboarding and per-transaction commissions
- **Coverage Mapping**: Villages assigned to each agent
- **Performance Dashboard**: Onboarded count, earnings, active farmers

### Frontend: `src/screens/AgentDashboardScreen.js`
- Agent profile and stats
- Onboarding form (on behalf of farmer)
- Commission earnings table
- Coverage village map

### Database Tables (via `migrate-v9-ecosystem.js`)
- `agents` — Agent profiles
- `agent_commissions` — Commission records
- `agent_onboardings` — Farmer onboarding records

---

## Feature: Contract Farming

> **Propose, negotiate, sign, and track forward contracts between buyers and farmers.**

### Backend: `backend/src/routes/contracts.js` (190 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/contracts` | POST | Required | Propose new contract |
| `/api/contracts` | GET | Required | List my contracts |
| `/api/contracts/:id` | GET | Required | Contract detail |
| `/api/contracts/:id/accept` | POST | Required | Farmer accepts contract |
| `/api/contracts/:id/reject` | POST | Required | Reject contract |
| `/api/contracts/:id/complete` | POST | Required | Mark contract completed |
| `/api/contracts/:id/advance` | POST | Required | Release advance payment |

### Key Features
- **Contract Lifecycle**: Proposed → Accepted → Active → Completed
- **Quality Parameters**: JSON-defined quality specs
- **Advance Payment**: Configurable advance percentage
- **Delivery Terms**: Date, location, logistics responsibility
- **FPO Involvement**: Contracts can route through FPO
- **Terms PDF**: Uploadable legal terms document

### Frontend: `src/screens/ContractScreen.js`
- Contract cards with status badges
- Proposal form with crop/quantity/price
- Acceptance/rejection flow
- Milestone tracker

### Database Tables (via `migrate-v7-intelligence.js`)
- `farming_contracts` — Contract records (buyer, farmer, FPO, terms)

---

## Feature: Satellite Monitoring

> **NDVI vegetation index, soil health data, and crop health alerts from satellite imagery.**

### Backend: `backend/src/routes/satellite.js` (116 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/satellite/fields` | GET | Required | Get monitored fields |
| `/api/satellite/fields/:fieldId` | GET | Required | NDVI timeline for field |
| `/api/satellite/alerts` | GET | Required | Active crop health alerts |
| `/api/satellite/reports` | GET | Required | Historical reports |

### Key Features
- **NDVI Tracking**: Normalized Difference Vegetation Index over time
- **Alert System**: Automatic alerts for crop stress (low NDVI, disease risk)
- **Field Mapping**: GPS-linked field boundaries
- **Temporal Analysis**: 60-day NDVI timeline per field
- **Soil Health Integration**: Soil moisture, organic carbon, pH from remote sensing

### Frontend: `src/screens/SatelliteScreen.js`
- Field grid with NDVI color indicators
- NDVI trend chart (green/yellow/red zones)
- Active alerts panel
- Field detail map

### Database Tables
- `crop_monitoring` — NDVI readings, alert flags per farmer per field

---

## Feature: Crop Doctor (AI Diagnosis)

> **AI-powered crop disease diagnosis from photos — snap, identify, get treatment.**

### Backend: `backend/src/routes/cropdoctor.js` (506 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/crop-doctor/diagnose` | POST | Required | Submit photo for diagnosis |
| `/api/crop-doctor/history` | GET | Required | My diagnosis history |
| `/api/crop-doctor/diseases` | GET | Public | Disease encyclopedia |
| `/api/crop-doctor/diseases/:id` | GET | Public | Disease detail + treatment |
| `/api/crop-doctor/remedies` | GET | Public | Organic remedy catalog |
| `/api/crop-doctor/community` | GET | Optional | Community Q&A on diseases |
| `/api/crop-doctor/community` | POST | Required | Ask disease question |

### Key Features
- **Photo Diagnosis**: Upload leaf/plant photo for AI classification
- **Disease Database**: Comprehensive disease encyclopedia with photos
- **Treatment Plans**: Chemical and organic treatment recommendations
- **Remedy Catalog**: Natural/organic remedy alternatives
- **Community Q&A**: Peer help for unidentified issues
- **History Tracking**: Past diagnoses for reference

### Frontend: `src/screens/CropDoctorScreen.js` (309 lines)
- Camera capture / upload flow
- Diagnosis result with confidence score
- Disease info card (symptoms, treatment, prevention)
- Treatment product links (AgriGalaxy integration)

---

## Feature: Crop Planning AI

> **AI-assisted crop selection based on soil, climate, market demand, and historical data.**

### Backend: `backend/src/routes/cropplanning.js` (415 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cropplan/recommend` | GET | Required | Get AI crop recommendations |
| `/api/cropplan/my-plan` | GET | Required | Get my current crop plan |
| `/api/cropplan/my-plan` | POST | Required | Save crop plan |
| `/api/cropplan/history` | GET | Required | Past seasons' plans |
| `/api/cropplan/soil-report` | GET | Required | Soil analysis data |
| `/api/cropplan/soil-report` | POST | Required | Submit soil report |
| `/api/cropplan/market-fit` | GET | Required | Market demand alignment |
| `/api/cropplan/calendar` | GET | Required | Seasonal calendar |

### Key Features
- **AI Recommendations**: Crop suggestions based on soil, location, season
- **Market Demand Matching**: Align planting with buyer demand
- **Soil Report Integration**: Use actual soil data for recommendations
- **Seasonal Calendar**: Optimal sowing/harvesting windows
- **Historical Analysis**: Compare past season performance
- **Multi-crop Planning**: Inter-cropping and rotation suggestions

### Frontend: `src/screens/CropPlanningScreen.js`
- Recommendation cards with confidence scores
- Season planner (calendar view)
- Soil report upload/view
- Market fit score indicator

---

## Feature: Weather Intelligence

> **Hyper-local weather forecasts, rainfall predictions, and farming-specific alerts.**

### Backend: `backend/src/routes/weather.js` (486 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/weather/current` | GET | Optional | Current weather for location |
| `/api/weather/forecast` | GET | Optional | 7-day forecast |
| `/api/weather/rainfall` | GET | Optional | Rainfall data/history |
| `/api/weather/alerts` | GET | Optional | Active weather warnings |
| `/api/weather/advisory` | GET | Required | Farm-specific weather advisory |
| `/api/weather/history` | GET | Optional | Historical weather data |

### Key Features
- **Real-time Weather**: Temperature, humidity, wind, UV index
- **7-Day Forecast**: Daily high/low, precipitation probability
- **Rainfall Tracking**: Daily, weekly, monsoon cumulative
- **Weather Alerts**: Cyclone, heavy rain, frost, heatwave warnings
- **Farm Advisory**: "Don't spray today", "Good day for sowing" type alerts
- **Historical Data**: Past season weather for planning

### Frontend: `src/screens/WeatherScreen.js` (444 lines)
- Current conditions card (temp, humidity, wind)
- 7-day forecast strip
- Rainfall graph
- Alert banners (red/orange/yellow severity)
- Farm advisory section

### Service: `backend/src/services/weather.js`
- External weather API integration
- Response caching (Redis, 30-min TTL)
- Location-based data fetch

---

## Feature: Farm Diary

> **Daily farming activity logger — sowing, spraying, irrigation, expenses, notes.**

### Backend: `backend/src/routes/farmdiary.js` (282 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/farmdiary/entries` | GET | Required | Get diary entries |
| `/api/farmdiary/entries` | POST | Required | Create diary entry |
| `/api/farmdiary/entries/:id` | PATCH | Required | Update entry |
| `/api/farmdiary/entries/:id` | DELETE | Required | Delete entry |
| `/api/farmdiary/summary` | GET | Required | Season summary stats |
| `/api/farmdiary/expenses` | GET | Required | Expense breakdown |
| `/api/farmdiary/fields` | GET | Required | My fields |
| `/api/farmdiary/fields` | POST | Required | Add field |

### Key Features
- **Activity Types**: Sowing, irrigation, spraying, weeding, fertilizing, harvesting
- **Expense Tracking**: Per-activity cost logging
- **Photo Attachments**: Document activities with photos
- **Field Management**: Link activities to specific fields
- **Season Summary**: Total expenses, activities, yield per season
- **Timeline View**: Chronological activity log

### Frontend: `src/screens/FarmDiaryScreen.js` (550 lines)
- Calendar view with activity markers
- Quick-add activity buttons
- Expense pie chart
- Field selector
- Season summary dashboard

---

## Feature: Logistics & Transport

> **Agricultural logistics — truck booking, route optimization, load matching.**

### Backend: `backend/src/routes/logistics.js` (386 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/logistics/vehicles` | GET | Optional | Available vehicles |
| `/api/logistics/vehicles` | POST | Required | Register vehicle |
| `/api/logistics/trips` | POST | Required | Create trip request |
| `/api/logistics/trips` | GET | Required | My trips |
| `/api/logistics/trips/:id` | GET | Required | Trip detail |
| `/api/logistics/trips/:id/accept` | POST | Required | Accept trip (driver) |
| `/api/logistics/trips/:id/status` | PATCH | Required | Update trip status |
| `/api/logistics/rates` | GET | Public | Rate calculator |
| `/api/logistics/tracking/:id` | GET | Required | Live tracking |

### Key Features
- **Vehicle Registry**: Trucks, pickups, tempos with capacity info
- **Trip Booking**: Origin, destination, load type, weight
- **Driver Assignment**: Drivers accept available trips
- **Live Tracking**: GPS-based trip tracking
- **Rate Calculator**: Distance-based pricing
- **Load Types**: Agriculture produce, inputs, machinery

### Frontend: `src/screens/LogisticsScreen.js`
- Vehicle browser with availability
- Trip booking form
- Active trip tracker with map
- Trip history

---

## Feature: Wallet & Payments

> **Digital wallet with UPI integration, transaction history, and peer transfers.**

### Backend: `backend/src/routes/wallet.js` (460 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/wallet/balance` | GET | Required | Get wallet balance |
| `/api/wallet/transactions` | GET | Required | Transaction history |
| `/api/wallet/add-money` | POST | Required | Add money to wallet |
| `/api/wallet/send` | POST | Required | Send money to user |
| `/api/wallet/withdraw` | POST | Required | Withdraw to bank |
| `/api/wallet/upi/link` | POST | Required | Link UPI ID |
| `/api/wallet/upi/pay` | POST | Required | Pay via UPI |
| `/api/wallet/statement` | GET | Required | Monthly statement |

### Key Features
- **Balance Management**: Add, send, withdraw
- **Transaction History**: Full ledger with types (credit/debit)
- **UPI Integration**: Link UPI, make payments
- **Peer Transfer**: Send money to any platform user
- **Bank Withdrawal**: Transfer wallet balance to bank account
- **Monthly Statements**: Downloadable transaction statements

### Frontend: `src/screens/WalletScreen.js`
- Balance display (large hero card)
- Quick action buttons (Add, Send, Withdraw)
- Transaction list with filters
- UPI linking flow

### Database Tables
- `wallets` — User wallet with balance
- `wallet_transactions` — Transaction ledger

---

## Feature: Escrow Payments

> **Secure escrow system for trade protection — hold funds until conditions met.**

### Backend: `backend/src/routes/escrow.js` (192 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/escrow/create` | POST | Required | Create escrow |
| `/api/escrow/fund` | POST | Required | Fund escrow |
| `/api/escrow/release` | POST | Required | Release to seller |
| `/api/escrow/refund` | POST | Required | Refund to buyer |
| `/api/escrow/status/:id` | GET | Required | Escrow status |
| `/api/escrow/my-escrows` | GET | Required | My escrow accounts |

### Key Features
- **Escrow Creation**: Linked to trade orders
- **Fund Locking**: Buyer deposits, platform holds
- **Conditional Release**: Released only after delivery + verification
- **Refund Flow**: Full/partial refund on disputes
- **Status Tracking**: pending → funded → released / refunded

### Frontend: `src/screens/EscrowScreen.js`
- Active escrow cards with amounts
- Fund/Release/Refund actions
- Status timeline

---

## Feature: Government Schemes & Discovery

> **AI-powered government scheme discovery — match farmer profile to eligible schemes.**

### Backend: `backend/src/routes/schemes.js` (80 lines) + `backend/src/routes/schemediscovery.js` (429 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/schemes` | GET | Public | List all schemes |
| `/api/schemes/:id` | GET | Public | Scheme detail |
| `/api/scheme-discovery/eligible` | GET | Required | AI-matched eligible schemes |
| `/api/scheme-discovery/profile` | GET | Required | My eligibility profile |
| `/api/scheme-discovery/profile` | POST | Required | Update eligibility data |
| `/api/scheme-discovery/apply/:id` | POST | Required | Apply for scheme |
| `/api/scheme-discovery/applications` | GET | Required | My applications |
| `/api/scheme-discovery/track/:id` | GET | Required | Track application status |

### Key Features
- **Scheme Database**: PM-KISAN, PMFBY, KCC, state schemes
- **AI Matching**: Match farmer's land, crop, income to eligible schemes
- **Eligibility Profile**: Farmer provides data once, matched repeatedly
- **Digital Application**: Apply to schemes from within app
- **Application Tracking**: Status updates on pending applications
- **Document Upload**: Aadhar, land records, bank details

### Frontend: `src/screens/SchemesScreen.js` (304 lines) + `src/screens/SchemeDiscoveryScreen.js`
- Scheme cards with eligibility badge (eligible/not eligible)
- Profile completion wizard
- Application form with document upload
- Application tracker

---

## Feature: Training & Learning

> **Agricultural training content — video courses, certifications, expert sessions.**

### Backend: `backend/src/routes/training.js` (245 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/training/courses` | GET | Optional | Browse courses |
| `/api/training/courses/:id` | GET | Optional | Course detail |
| `/api/training/courses/:id/enroll` | POST | Required | Enroll in course |
| `/api/training/my-courses` | GET | Required | My enrolled courses |
| `/api/training/progress/:courseId` | POST | Required | Update progress |
| `/api/training/certificates` | GET | Required | My certificates |

### Key Features
- **Course Catalog**: Organic farming, pest management, technology use
- **Video Content**: Multi-module courses with video lessons
- **Progress Tracking**: Module-by-module completion
- **Certification**: Issue certificates on course completion
- **Multi-language**: Content in Telugu, Hindi, English
- **Expert Sessions**: Live/recorded expert talks

### Frontend: `src/screens/TrainingScreen.js`
- Course grid with thumbnails
- Course detail with module list
- Video player
- Progress bar
- Certificate viewer

---

## Feature: Jobs Board

> **Agricultural jobs and employment opportunities for farm workers and professionals.**

### Backend: `backend/src/routes/jobs.js` (91 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/jobs` | GET | Optional | Browse jobs |
| `/api/jobs` | POST | Required | Post a job |
| `/api/jobs/:id/apply` | POST | Required | Apply to job |
| `/api/jobs/my-applications` | GET | Required | My applications |

### Key Features
- **Job Categories**: Farm labor, technician, supervisor, driver, warehouse
- **Location-based**: District-level job matching
- **Application Flow**: Browse → Apply → Track status
- **Expiry**: Auto-expire past-date jobs

### Frontend: `src/screens/JobsScreen.js`
- Job listing cards (title, location, salary, type)
- Apply button with resume upload
- My applications tracker

---

## Feature: Community & Social

> **Farmer community — posts, comments, groups, knowledge sharing.**

### Backend: `backend/src/routes/community.js` (245 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/community/posts` | GET | Optional | Browse community posts |
| `/api/community/posts` | POST | Required | Create post |
| `/api/community/posts/:id/comments` | GET | Optional | Get comments |
| `/api/community/posts/:id/comments` | POST | Required | Add comment |
| `/api/community/posts/:id/like` | POST | Required | Like/unlike post |
| `/api/community/groups` | GET | Optional | Browse groups |
| `/api/community/groups/:id/join` | POST | Required | Join group |

### Key Features
- **Posts**: Text + image posts with likes and comments
- **Groups**: Topic-based groups (e.g., "Organic Farmers AP")
- **Knowledge Sharing**: Farming tips, success stories
- **Moderation**: Report and flag system
- **Local Groups**: District-level farmer groups

### Frontend: `src/screens/CommunityScreen.js` (290 lines)
- Post feed with images
- Comment thread
- Like/share buttons
- Group browser and membership

---

## Feature: Chat & Messaging

> **Real-time P2P messaging between buyers and sellers with WebSocket.**

### Backend: `backend/src/routes/chat.js` (446 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chat/conversations` | GET | Required | My conversations |
| `/api/chat/conversations/:id/messages` | GET | Required | Messages in conversation |
| `/api/chat/conversations/:id/messages` | POST | Required | Send message |
| `/api/chat/conversations` | POST | Required | Start new conversation |
| `/api/chat/conversations/:id/read` | POST | Required | Mark as read |
| `/api/chat/unread-count` | GET | Required | Unread message count |

### Key Features
- **Real-time**: WebSocket-powered instant delivery
- **Conversations**: 1:1 between buyer and seller
- **Message Types**: Text, image, location, voice note
- **Read Receipts**: Seen/delivered status
- **Unread Count**: Badge count for notifications
- **Message History**: Paginated message loading

### Service: `backend/src/services/websocket.js`
- WebSocket server setup
- Connection management
- Real-time message broadcast

### Frontend: `src/screens/ChatScreen.js` (301 lines)
- Conversation list with last message preview
- Chat view with message bubbles
- Send box with attachment options
- Typing indicator

---

## Feature: FPO Dashboard

> **Farmer Producer Organization management — members, collections, aggregation, finance.**

### Backend: `backend/src/routes/fpo.js` (299 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/fpo/profile` | GET | Required | FPO profile |
| `/api/fpo/members` | GET | Required | List members |
| `/api/fpo/members/add` | POST | Required | Add member |
| `/api/fpo/collections` | GET | Required | Aggregated collections |
| `/api/fpo/collections` | POST | Required | Create collection drive |
| `/api/fpo/finance` | GET | Required | FPO financial summary |
| `/api/fpo/orders` | GET | Required | Bulk orders |
| `/api/fpo/analytics` | GET | Required | FPO analytics |

### Key Features
- **Member Management**: Add/remove farmers from FPO
- **Collection Drives**: Aggregate produce from members
- **Bulk Ordering**: Negotiate bulk input purchases
- **Financial Summary**: Revenue, expenses, member payouts
- **Analytics**: Performance metrics, member activity

### Frontend: `src/screens/FPODashboardScreen.js` (721 lines)
- Member roster with stats
- Collection tracker
- Financial charts
- Bulk order management

---

## Feature: Trust Score

> **Platform-wide reputation score based on trade history, reviews, and behavior.**

### Backend: `backend/src/routes/trustscore.js` (99 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/trustscore/my-score` | GET | Required | Get my trust score |
| `/api/trustscore/user/:id` | GET | Optional | Get user's public trust score |
| `/api/trustscore/compute` | POST | Required | Recompute trust score |
| `/api/trustscore/factors` | GET | Required | Score factor breakdown |

### Key Features
- **Multi-factor Score**: Trade completion, reviews, response rate, disputes
- **Public Badge**: Visible on profiles and listings
- **Score Tiers**: Bronze, Silver, Gold, Platinum
- **Incentives**: Higher trust = priority in search results

### Frontend: `src/screens/TrustScoreScreen.js`
- Score gauge with tier badge
- Factor breakdown (bar chart)
- Tips to improve score

---

## Feature: Admin Panel

> **Platform administration — user management, moderation, analytics, system health.**

### Backend: `backend/src/routes/admin.js` (182 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | GET | Admin | List all users |
| `/api/admin/users/:id` | GET | Admin | User detail |
| `/api/admin/users/:id/ban` | POST | Admin | Ban user |
| `/api/admin/stats` | GET | Admin | Platform statistics |
| `/api/admin/moderation` | GET | Admin | Moderation queue |
| `/api/admin/moderation/:id/action` | POST | Admin | Take moderation action |

### Frontend: `src/screens/AdminScreen.js` (323 lines)
- User management table
- Platform stats dashboard
- Moderation queue
- System health monitor

---

## Feature: Subscriptions & Plans

> **Tiered subscription plans for premium features — buyer/seller/FPO plans.**

### Backend: `backend/src/routes/subscriptions.js` (142 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/subscriptions/plans` | GET | Public | Available plans |
| `/api/subscriptions/current` | GET | Required | My current subscription |
| `/api/subscriptions/subscribe` | POST | Required | Subscribe to plan |
| `/api/subscriptions/cancel` | POST | Required | Cancel subscription |
| `/api/subscriptions/history` | GET | Required | Subscription history |

### Frontend: `src/screens/SubscriptionsScreen.js`
- Plan comparison cards
- Current plan status
- Upgrade/downgrade flow

---

## Feature: Watchlists & Alerts

> **Track specific crops, regions, or sellers with custom alerts.**

### Backend: `backend/src/routes/watchlists.js` (92 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/watchlists` | GET | Required | My watchlists |
| `/api/watchlists` | POST | Required | Create watchlist item |
| `/api/watchlists/:id` | DELETE | Required | Remove watchlist item |
| `/api/watchlists/alerts` | GET | Required | Triggered alerts |

### Frontend: `src/screens/WatchlistsScreen.js`
- Watchlist items with alert counts
- Add crop/region/seller to watch
- Alert feed

---

## Feature: Favorites

> **Save and quickly access favorite listings, stores, or users.**

### Backend: `backend/src/routes/favorites.js` (86 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/favorites` | GET | Required | My favorites |
| `/api/favorites` | POST | Required | Add favorite |
| `/api/favorites/:id` | DELETE | Required | Remove favorite |

### Frontend: `src/screens/FavoritesScreen.js`
- Favorited listing/store/user cards
- Quick-remove button

---

## Feature: Support Tickets

> **Customer support ticket system with priority levels and resolution tracking.**

### Backend: `backend/src/routes/tickets.js` (111 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/tickets` | GET | Required | My tickets |
| `/api/tickets` | POST | Required | Create ticket |
| `/api/tickets/:id` | GET | Required | Ticket detail |
| `/api/tickets/:id/reply` | POST | Required | Add reply |
| `/api/tickets/:id/close` | POST | Required | Close ticket |

### Frontend: `src/screens/TicketsScreen.js`
- Ticket list with status badges
- Create ticket form (category, priority, description)
- Ticket conversation thread

---

## Feature: Reviews & Ratings

> **Universal review system — rate sellers, buyers, equipment, products.**

### Backend: `backend/src/routes/reviews.js` (112 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/reviews` | GET | Optional | Reviews for entity |
| `/api/reviews` | POST | Required | Submit review |
| `/api/reviews/:id` | PATCH | Required | Update review |
| `/api/reviews/:id` | DELETE | Required | Delete review |
| `/api/reviews/my-reviews` | GET | Required | My submitted reviews |

---

## Feature: Push Notifications

> **Real-time push notifications for orders, messages, alerts, and reminders.**

### Backend: `backend/src/routes/pushnotifications.js` (118 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/notifications` | GET | Required | My notifications |
| `/api/notifications/unread-count` | GET | Required | Unread count |
| `/api/notifications/:id/read` | POST | Required | Mark as read |
| `/api/notifications/read-all` | POST | Required | Mark all read |

### Service: `backend/src/services/push.js`
- FCM (Firebase Cloud Messaging) integration
- Notification creation and delivery
- Used internally by all features (trade updates, chat, alerts)

### Frontend: `src/screens/NotificationsScreen.js`
- Notification list with type icons
- Tap to navigate to relevant screen
- Unread badge

---

## Feature: Bank Portal

> **Bank integration for agricultural lending — view farmer portfolios, approve loans.**

### Backend: `backend/src/routes/bankportal.js` (87 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/bankportal/farmers` | GET | Required | Browse farmer profiles (bank view) |
| `/api/bankportal/farmers/:id/portfolio` | GET | Required | Farmer's trade + credit portfolio |
| `/api/bankportal/loans` | GET | Required | Pending loan applications |
| `/api/bankportal/loans/:id/approve` | POST | Required | Approve loan |
| `/api/bankportal/loans/:id/reject` | POST | Required | Reject loan |

---

## Feature: Exporter Portal

> **Export compliance, documentation, and shipment tracking for international trade.**

### Backend: `backend/src/routes/exporter.js` (108 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/exporter/products` | GET | Required | Products available for export |
| `/api/exporter/orders` | GET | Required | Export orders |
| `/api/exporter/orders` | POST | Required | Create export order |
| `/api/exporter/shipments` | GET | Required | Shipment tracking |
| `/api/exporter/compliance` | GET | Required | Compliance documents |

### Frontend: `src/screens/ExporterScreen.js`
- Export-ready product catalog
- Order management
- Shipment tracker
- Document checklist

---

## Feature: Government Portal

> **Government dashboard for scheme disbursement, farmer data, and agricultural statistics.**

### Backend: `backend/src/routes/government.js` (85 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/government/dashboard` | GET | Required | Aggregate stats |
| `/api/government/farmers` | GET | Required | Farmer registry |
| `/api/government/schemes/:id/disbursements` | GET | Required | Disbursement data |
| `/api/government/reports` | GET | Required | Generated reports |

---

## Feature: Onboarding Flow

> **Progressive onboarding wizard — role selection, profile completion, feature discovery.**

### Backend: `backend/src/routes/onboarding.js` (200 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/onboarding/status` | GET | Required | Onboarding progress |
| `/api/onboarding/step` | POST | Required | Complete onboarding step |
| `/api/onboarding/skip` | POST | Required | Skip optional step |
| `/api/onboarding/profile` | POST | Required | Complete profile |

---

## Feature: Settings

> **User preferences — language, notifications, privacy, theme.**

### Backend: `backend/src/routes/settings.js` (210 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/settings` | GET | Required | Get all settings |
| `/api/settings` | PATCH | Required | Update settings |
| `/api/settings/language` | PATCH | Required | Change language |
| `/api/settings/notifications` | PATCH | Required | Notification preferences |
| `/api/settings/privacy` | PATCH | Required | Privacy settings |
| `/api/settings/delete-account` | POST | Required | Delete account |

---

## Feature: Upload & Media

> **File upload system for photos, documents, voice notes.**

### Backend: `backend/src/routes/upload.js` (150 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/upload/image` | POST | Required | Upload image |
| `/api/upload/document` | POST | Required | Upload document |
| `/api/upload/voice` | POST | Required | Upload voice note |

### Service: `backend/src/services/storage.js`
- Local file storage (dev) / cloud storage (prod)
- Image compression and thumbnails
- File type validation

---

## Feature: Translation (i18n)

> **Real-time text translation between English, Telugu, and Hindi.**

### Backend: `backend/src/routes/translate.js` (67 lines)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/translate` | POST | Required | Translate text |
| `/api/translate/languages` | GET | Public | Supported languages |

### Frontend: `src/i18n.js`
- 3 languages: English, Telugu (తెలుగు), Hindi (हिंदी)
- All UI strings localized
- Component: `src/components/LanguagePicker.js`

---

## Feature: Analytics Dashboard

> **Platform-wide analytics — user growth, trade volume, revenue metrics.**

### Frontend: `src/screens/AnalyticsScreen.js`
- User registration trends
- Trade volume charts
- Revenue breakdown
- Active user metrics
- Geographic distribution

---

## Platform Infrastructure

### Backend Services (`backend/src/services/`)

| Service | File | Purpose |
|---------|------|---------|
| APMC | `apmc.js` | Government APMC mandi price feeds |
| Audit | `audit.js` | Request audit logging |
| Cache | `cache.js` | Redis cache (get/set/del with TTL) |
| Payments | `payments.js` | Payment gateway integration |
| Push | `push.js` | Push notification delivery (FCM) |
| Queue | `queue.js` | Background job queue (BullMQ) |
| SMS | `sms.js` | SMS delivery for OTP |
| Storage | `storage.js` | File storage (local/cloud) |
| Translate | `translate.js` | Translation API integration |
| Weather | `weather.js` | External weather API |
| WebSocket | `websocket.js` | Real-time communication layer |

### Middleware Stack (`backend/src/middleware/`)

| Middleware | File | Purpose |
|-----------|------|---------|
| Auth | `auth.js` | JWT verification, optional auth |
| Error Handler | `errorHandler.js` | Centralized error response |
| Request ID | `requestId.js` | UUID per request (tracing) |
| Sanitize | `sanitize.js` | Input sanitization (XSS prevention) |
| Validate | `validate.js` | Request body validation |

### Library (`backend/src/lib/`)

| File | Purpose |
|------|---------|
| `config.js` | Environment config (DB, Redis, JWT, CORS, rate limits) |
| `errors.js` | Custom error classes |
| `logger.js` | Pino structured logger |

---

## Database Schema (Migrations)

### Migration History

| Version | File | Tables Created |
|---------|------|---------------|
| V1 | `migrate.js` (1,514 lines) | users, supply_listings, inquiries, crop_catalog, districts, orders, harvest_listings, community_posts, notifications, chat_messages, conversations, equipment, bookings, settings, reviews |
| V2 | `migrate-v2.js` (366 lines) | properties, jobs, training_courses, enrollments, wallets, wallet_transactions, subscription_plans, user_subscriptions, favorites, watchlists, support_tickets |
| V3 | `migrate-v3-trade.js` (160 lines) | trade_orders, trade_bids, trade_timeline, escrow_transactions |
| V4 | `migrate-v4-infrastructure.js` (131 lines) | push_tokens, audit_logs, rate_limit_overrides, feature_flags |
| V5 | `migrate-v5-platform.js` (150 lines) | logistics_vehicles, logistics_trips, input_stores, input_products, input_orders, crop_plans, soil_reports |
| V6 | `migrate-v6-agrios.js` (344 lines) | aqua_farms, ponds, pond_stockings, pond_feed_logs, pond_water_quality, pond_health_events, pond_harvests, aqua_species_catalog, aqua_feed_types, agrigalaxy_stores, agrigalaxy_products, bhoomios_listings |
| V7 | `migrate-v7-intelligence.js` (155 lines) | apmc_prices, price_predictions, crop_monitoring, farming_contracts, scheme_applications |
| V8 | `migrate-v8-finance.js` (132 lines) | credit_scores, loan_applications, insurance_policies |
| V9 | `migrate-v9-ecosystem.js` (150 lines) | agents, agent_commissions, exporter_shipments, government_schemes, bank_loan_reviews |

### Total Tables: 60+

---

## Background Scheduler

**File**: `backend/src/scheduler.js`

| Task | Interval | Description |
|------|----------|-------------|
| Listing Expiry | 1 hour | Expire listings older than 60 days |
| Subscription Check | 6 hours | Expire/renew subscriptions |
| Watchlist Alerts | 30 min | Check watchlist conditions, send alerts |
| Harvest Reminders | 24 hours | Remind upcoming harvest dates |
| Stale Cleanup | 24 hours | Clean up stale records |

---

## Security Architecture

### Authentication
- **OTP-based login** (no password): Phone → OTP → JWT
- **JWT tokens**: Access token (short-lived) + Refresh token
- **Role-based access**: Farmer, FPO, Buyer, Supplier, Service Provider, Admin

### Security Middleware Stack (applied in order)
1. **Helmet** — Security headers (CSP, XSS, frame, MIME sniffing)
2. **CORS** — Restricted origins in production
3. **HPP** — HTTP Parameter Pollution prevention
4. **Rate Limiting** — Global: configurable window/max; Auth: stricter limits
5. **Sanitize** — Input sanitization (XSS prevention)
6. **Request ID** — UUID per request for tracing
7. **Audit** — All requests logged

### Rate Limits
- Global API: Configurable (default 100 req/15min)
- Auth endpoints: Stricter (default 5 req/15min)

---

## Deployment Architecture

### Docker Compose (Local Development)

```yaml
services:
  postgres:    # PostgreSQL 15 Alpine (port 5455)
  redis:       # Redis 7 Alpine (port 6399)
  backend:     # Node.js API (port 4000)
```

### Production Deployment

| Component | Platform | Details |
|-----------|----------|---------|
| Frontend | Vercel / Netlify | Static site (Vite build output) |
| Backend | Docker / Cloud Run | Express API container |
| Database | Managed PostgreSQL | Supabase or RDS |
| Cache | Managed Redis | Upstash or ElastiCache |
| Storage | Supabase Storage | File uploads |
| CDN | Vercel Edge | Static assets |

### Configuration Files
- `vercel.json` — Vercel deployment config
- `netlify.toml` — Netlify deployment config
- `docker-compose.yml` — Local dev orchestration
- `.env.example` — Environment variables template

---

## API Reference (All Endpoints)

### Complete Route Mount Points

```
/api/auth              — Authentication (OTP, JWT)
/api/agriflow          — Supply chain marketplace
/api/aquaos            — Aquaculture management
/api/farmerconnect     — Rural property
/api/kisanconnect      — Equipment rental
/api/intelligence      — Market intelligence
/api/community         — Social features
/api/orders            — Order management
/api/fpo               — FPO management
/api/buyer             — Buyer features
/api/farmer            — Farmer profile features
/api/weather           — Weather data
/api/upload            — File uploads
/api/notifications     — Push notifications
/api/agrigalaxy        — Input marketplace
/api/bhoomios          — Land marketplace
/api/payments          — Payment processing
/api/reviews           — Ratings & reviews
/api/chat              — Messaging
/api/tracking          — GPS tracking
/api/admin             — Admin panel
/api/farmdiary         — Farm activity diary
/api/jobs              — Jobs board
/api/training          — Learning & courses
/api/schemes           — Government schemes
/api/wallet            — Digital wallet
/api/scheme-discovery  — AI scheme matching
/api/crop-doctor       — Crop disease AI
/api/escrow            — Escrow payments
/api/subscriptions     — Plans & billing
/api/watchlists        — Watchlists & alerts
/api/favorites         — Saved items
/api/tickets           — Support tickets
/api/trade             — Trade execution
/api/health            — System health check
/api/translate         — Translation
/api/settings          — User settings
/api/logistics         — Transport & logistics
/api/inputs            — Agri inputs
/api/cropplan          — Crop planning AI
/api/onboarding        — Onboarding wizard
/api/contracts         — Contract farming
/api/trustscore        — Trust reputation
/api/satellite         — Satellite monitoring
/api/finance           — Credit & loans
/api/agents            — Agent network
/api/bankportal        — Bank integration
/api/government        — Gov portal
/api/exporter          — Export trade
/api/openapi           — API documentation (Swagger)
```

### OpenAPI / Swagger
The `/api/openapi` endpoint serves auto-generated OpenAPI 3.0 specification.

---

## Frontend Architecture

### App Shell Pattern
```
index.html → main.js (entry) → App Shell → Router → Screen Renderer
```

### State Management
- `src/store.js` — Simple pub/sub state store (no framework)
- State: `{ isLoggedIn, user, settings, theme }`

### API Client
- `src/api.js` — HTTP client with JWT auth, retry, error handling

### Routing
- `src/main.js` — Hash-based SPA router with 44 routes
- Bottom nav (5 tabs, role-dependent)
- Side menu (hamburger) with all routes

### Role-Based Navigation

| Role | Bottom Tabs |
|------|------------|
| Farmer | Home, AgriGalaxy, Agri, Kisan, Bhoomi |
| FPO | Home, Agri, Kisan, Bhoomi, Community |
| Buyer | Home, AquaOS, Agri, Kisan, Profile |
| Supplier | Home, AgriGalaxy, AquaOS, Community, Profile |
| Service Provider | Home, Agri, Kisan, Community, Profile |

### Utilities
| File | Purpose |
|------|---------|
| `src/utils/perf.js` | Lazy image loading, performance budgets |
| `src/utils/offline.js` | Offline-first data caching |
| `src/utils/pullRefresh.js` | Pull-to-refresh gesture |
| `src/utils/errors.js` | Global error boundary |

### Components
| File | Purpose |
|------|---------|
| `src/components/ui.js` | Shared UI components |
| `src/components/LanguagePicker.js` | Language switcher |

### Integrations
| File | Purpose |
|------|---------|
| `src/integrations/maps.js` | Google Maps integration |
| `src/integrations/payments.js` | Payment gateway (Razorpay/UPI) |

---

## Role-Based Access

| Role | Key Permissions |
|------|----------------|
| **Farmer** | Create listings, manage farms, view intelligence, book equipment, apply for schemes |
| **FPO** | Manage members, aggregate produce, bulk orders, FPO finance |
| **Buyer** | Browse & bid on listings, place orders, rate sellers |
| **Supplier** | Create stores, list products, manage AgriGalaxy store |
| **Service Provider** | Register services, accept KisanConnect hires |
| **Admin** | Full platform access, moderation, user management, analytics |

---

## Build & Development

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for local dev)

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/hari888b8/AAA.git
cd AAA
npm install
cd backend && npm install && cd ..

# 2. Start infrastructure
docker compose up -d

# 3. Copy environment
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, etc.)

# 4. Start backend
cd backend && node src/index.js

# 5. Start frontend (separate terminal)
npm run dev
```

### Build Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `npm run dev` | Root | Start Vite dev server (HMR) |
| `npm run build` | Root | Production frontend build |
| `npm run preview` | Root | Preview production build |
| `npx vitest run` | Root | Run all tests (16 tests) |
| `node --check src/index.js` | backend/ | Syntax validation |
| `node src/index.js` | backend/ | Start API server |
| `docker compose up -d` | Root | Start PostgreSQL + Redis |

### Environment Variables

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5455
POSTGRES_DB=Agrihub
POSTGRES_USER=Agrihub
POSTGRES_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6399

# Auth
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# External Services
WEATHER_API_KEY=
SMS_API_KEY=
FCM_SERVER_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

## Testing

### Test Suite

| File | Tests | Coverage |
|------|-------|----------|
| `tests/ui.test.js` | 7 | Frontend rendering, navigation, state |
| `tests/perf.test.js` | 6 | Bundle size budgets, load times |
| `tests/errors.test.js` | 3 | Error boundary, uncaught handler |
| `backend/tests/trade-flow.test.js` | Integration | Full trade lifecycle (requires live backend) |

### Running Tests

```bash
# Unit tests (Vitest)
npx vitest run

# Integration tests (Node.js native test runner, requires running backend)
cd backend && node --test tests/trade-flow.test.js
```

---

## File Structure Summary

```
AAA/
├── backend/
│   └── src/
│       ├── index.js              # Express app entry (319 lines)
│       ├── scheduler.js          # Background jobs
│       ├── routes/               # 50 route files (13,403 lines)
│       ├── services/             # 11 service files
│       ├── middleware/           # 5 middleware files
│       ├── lib/                  # 3 lib files (config, errors, logger)
│       └── db/
│           ├── pool.js           # PostgreSQL connection pool
│           ├── transaction.js    # Transaction helper
│           ├── seed.js           # Seed data
│           └── migrate*.js       # 9 migration files (3,102 lines)
├── src/
│   ├── main.js                   # Frontend entry + router (333 lines)
│   ├── api.js                    # HTTP client
│   ├── store.js                  # State management
│   ├── i18n.js                   # Internationalization
│   ├── app-shell.js              # Shell utilities
│   ├── screens/                  # 41 screen files (14,945 lines)
│   ├── components/               # Shared UI components
│   ├── integrations/             # External service integrations
│   ├── utils/                    # Utilities (perf, offline, errors)
│   └── styles/                   # CSS styles
├── tests/                        # Test files
├── android/                      # Android native app (Kotlin)
├── supabase/                     # Supabase migrations
├── public/                       # Static assets
├── docker-compose.yml            # Dev infrastructure
├── vite.config.js                # Vite configuration
├── package.json                  # Frontend dependencies
├── vercel.json                   # Vercel deployment
├── netlify.toml                  # Netlify deployment
└── *.md / *.docx / *.pdf        # PRD & documentation
```

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| Total Backend Code | ~16,500 lines |
| Total Frontend Code | ~15,300 lines |
| Total Migration Code | ~3,100 lines |
| Total Tests | 16 unit + integration |
| API Endpoints | 200+ |
| Database Tables | 60+ |
| Frontend Screens | 41 |
| Backend Routes | 50 |
| Services | 11 |
| User Roles | 6 |
| Languages | 3 |
| Apps | 6 (AgriFlow, AquaOS, KisanConnect, AgriGalaxy, BhoomiOS, FarmerConnect) |
| Features | 30+ distinct feature modules |

---

> **Last updated**: 2026-05-03  
> **Version**: 1.0.0  
> **Repository**: [github.com/hari888b8/AAA](https://github.com/hari888b8/AAA)
