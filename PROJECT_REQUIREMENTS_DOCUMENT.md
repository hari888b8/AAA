# AgriHub — End-to-End Project Requirement Document (PRD)

## Comprehensive Platform Specification — Pin-to-Pin Detail

**Version:** 2.0  
**Last Updated:** May 2026  
**Platform:** AgriHub — India's Agriculture Operating System  
**Status:** In Development / Active  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Mission](#2-vision--mission)
3. [Target Market & Users](#3-target-market--users)
4. [User Roles & Personas](#4-user-roles--personas)
5. [Platform Architecture Overview](#5-platform-architecture-overview)
6. [Technology Stack](#6-technology-stack)
7. [System Infrastructure](#7-system-infrastructure)
8. [Authentication & Security](#8-authentication--security)
9. [Database Schema & Design](#9-database-schema--design)
10. [Core Module: AgriFlow — Crop Supply Marketplace](#10-core-module-agriflow--crop-supply-marketplace)
11. [Core Module: AquaOS — Aquaculture Operating System](#11-core-module-aquaos--aquaculture-operating-system)
12. [Core Module: KisanConnect — Rural Operating System](#12-core-module-kisanconnect--rural-operating-system)
13. [Core Module: FarmerConnect — Land & Property](#13-core-module-farmerconnect--land--property)
14. [Core Module: BhoomiOS — Land Management](#14-core-module-bhoomios--land-management)
15. [Trade & Commerce Engine](#15-trade--commerce-engine)
16. [Intelligence & Analytics Module](#16-intelligence--analytics-module)
17. [Financial Services Module](#17-financial-services-module)
18. [Galaxy Discovery Module](#18-galaxy-discovery-module)
19. [Communication & Community](#19-communication--community)
20. [Logistics & Delivery](#20-logistics--delivery)
21. [Government & Compliance](#21-government--compliance)
22. [AI & Prediction Engine](#22-ai--prediction-engine)
23. [Warehouse Management](#23-warehouse-management)
24. [Payments & Wallet](#24-payments--wallet)
25. [Notifications & Alerts](#25-notifications--alerts)
26. [Training & Capacity Building](#26-training--capacity-building)
27. [Support & Ticketing](#27-support--ticketing)
28. [Admin Panel](#28-admin-panel)
29. [Subscription & Monetization](#29-subscription--monetization)
30. [Internationalization (i18n)](#30-internationalization-i18n)
31. [Mobile & PWA](#31-mobile--pwa)
32. [Android Native App](#32-android-native-app)
33. [API Design & Documentation](#33-api-design--documentation)
34. [Third-Party Integrations](#34-third-party-integrations)
35. [Performance & Scalability](#35-performance--scalability)
36. [Security Requirements](#36-security-requirements)
37. [Data Privacy & DPDP Compliance](#37-data-privacy--dpdp-compliance)
38. [Testing Strategy](#38-testing-strategy)
39. [Deployment & DevOps](#39-deployment--devops)
40. [Monitoring & Observability](#40-monitoring--observability)
41. [Offline Support](#41-offline-support)
42. [Voice & Accessibility](#42-voice--accessibility)
43. [District Pilot Strategy](#43-district-pilot-strategy)
44. [Growth & Scaling Plan](#44-growth--scaling-plan)
45. [Risk Matrix](#45-risk-matrix)
46. [Appendix A: Complete API Endpoint Reference](#appendix-a-complete-api-endpoint-reference)
47. [Appendix B: Database Tables Reference](#appendix-b-database-tables-reference)
48. [Appendix C: Frontend Screen Inventory](#appendix-c-frontend-screen-inventory)
49. [Appendix D: Environment Variables](#appendix-d-environment-variables)
50. [Appendix E: Seed Data & Defaults](#appendix-e-seed-data--defaults)

---

## 1. Executive Summary

**AgriHub** is a unified Agriculture Operating System designed to digitize and interconnect India's entire agricultural ecosystem. It serves as a single platform connecting **145M+ farmers**, **10,000+ FPOs (Farmer Producer Organizations)**, buyers, traders, exporters, input suppliers, logistics providers, banks, and government agencies.

### Key Statistics
| Metric | Value |
|--------|-------|
| Target Farmers | 145,000,000+ |
| Target FPOs | 10,000+ |
| Feature Screens | 73+ |
| API Routes/Modules | 76+ |
| Supported Languages | 3 (English, Telugu, Hindi) |
| User Roles | 6 |
| Database Migrations | 24+ |
| Backend Services | 14 |
| Middleware Layers | 7 |

### Core Sub-Platforms
1. **AgriFlow** — Crop supply marketplace with listing, search, proximity-based discovery
2. **AquaOS** (V1–V11) — Complete aquaculture management from pond to export
3. **KisanConnect** — Rural Operating System (equipment, transport, gig workers, delivery)
4. **FarmerConnect** — Land/property leasing marketplace
5. **BhoomiOS** — Land management and records
6. **AgriGalaxy** — Discovery and portfolio engine for all entities
7. **Trade Engine** — Assured end-to-end trade with escrow, quality verification, dispute resolution

---

## 2. Vision & Mission

### Vision
To become India's #1 agriculture digital infrastructure — an Operating System that powers every agricultural transaction, from seed purchase to export, for every farmer, fisherman, trader, and institution across the nation.

### Mission
1. Eliminate middlemen exploitation through direct buyer-farmer connectivity
2. Provide real-time market intelligence and price transparency
3. Enable quality-assured trade with escrow protection
4. Digitize aquaculture operations end-to-end (pond to plate)
5. Integrate government schemes and subsidies with one-click access
6. Provide financial inclusion through digital wallets, trade credit, and micro-loans
7. Build trust through verification, ratings, and transparency
8. Support multilingual/voice-first interfaces for rural accessibility

### Success Metrics (KPIs)
| KPI | Year 1 Target | Year 3 Target |
|-----|---------------|---------------|
| Registered Users | 500,000 | 10,000,000 |
| Monthly Active Users | 100,000 | 3,000,000 |
| Monthly GMV (₹) | 10 Cr | 500 Cr |
| Avg. Trade Size (₹) | 50,000 | 75,000 |
| FPOs Onboarded | 500 | 5,000 |
| Districts Covered | 10 (AP/TS) | 200 (All India) |
| NPS Score | 40+ | 60+ |

---

## 3. Target Market & Users

### Geographic Focus
- **Phase 1 (Year 1):** Andhra Pradesh & Telangana — 4 districts (East Godavari, West Godavari, Krishna, Guntur)
- **Phase 2 (Year 2):** Expand to Tamil Nadu, Karnataka, Odisha, Maharashtra
- **Phase 3 (Year 3):** Pan-India rollout (200+ districts)

### Target Sectors
| Sector | Sub-Categories |
|--------|---------------|
| Agriculture | Rice, Cotton, Chilli, Maize, Groundnut, Pulses, Oilseeds, Vegetables, Fruits |
| Aquaculture | Vannamei Shrimp, Tiger Shrimp, Pangasius, Crab, Fish (Rohu, Catla, Tilapia) |
| Livestock | Cattle, Buffalo, Poultry, Goats, Sheep |
| Horticulture | Mango, Banana, Papaya, Guava, Tomato, Onion |

### Market Size (TAM/SAM/SOM)
| Market | Value |
|--------|-------|
| India Agri Market (TAM) | $600 Billion |
| Digital Agri (SAM) | $24 Billion |
| Addressable Year 1 (SOM) | $50 Million |
| India Aquaculture | $22 Billion |
| AP/TS Aquaculture | $8 Billion |

---

## 4. User Roles & Personas

### 4.1 Farmer (Primary User)
**Database Role:** `farmer`

| Attribute | Detail |
|-----------|--------|
| Profile | Smallholder (2-5 acres), Marginal (<2 acres), Large (5+ acres) |
| Tech Literacy | Low-Medium (feature phone graduating to smartphone) |
| Language | Telugu/Hindi preferred, English secondary |
| Key Needs | Fair prices, market access, scheme benefits, weather info, credit |
| Navigation | Home → AgriGalaxy → Agri → Kisan → Bhoomi |

**Farmer Capabilities:**
- Declare crops (sow date, area, expected yield, organic status)
- Create supply listings with GPS + photos + voice notes
- View mandi prices, compare with platform offers
- Accept bids from buyers with escrow protection
- Track delivery and receive payment
- Access farm diary with satellite-linked field monitoring
- Discover and apply for government schemes
- Hire equipment via KisanConnect
- Manage aqua ponds (if fisherman)
- Get crop doctor AI diagnosis
- View weather forecasts and advisories

### 4.2 Buyer
**Database Role:** `buyer`

| Attribute | Detail |
|-----------|--------|
| Sub-Types | Wholesaler, Restaurant/Hotel, Exporter, Food Processor |
| Profile | Urban-based, tech-savvy, volume purchasers |
| Key Needs | Quality assurance, bulk sourcing, traceability, reliable supply |
| Navigation | Home → AquaOS → Agri → Kisan → Profile |

**Buyer Capabilities:**
- Browse supply listings with advanced filters (crop, location, price, quality, proximity)
- Place bids on listings
- Post RFQ (Request for Quotation) for specific requirements
- Subscribe to crop alerts and price notifications
- Track orders with real-time delivery updates
- Rate and review sellers
- Access traceability (farm-to-fork) data
- Participate in auctions
- Manage purchase history and analytics
- Set up recurring orders

### 4.3 FPO (Farmer Producer Organization)
**Database Role:** `fpo`

| Attribute | Detail |
|-----------|--------|
| Profile | Registered entities aggregating 500-2000+ farmer members |
| Key Needs | Member management, collective bargaining, input procurement, compliance |
| Navigation | Home → Agri → Kisan → Bhoomi → Community |

**FPO Capabilities:**
- Manage farmer members and their declarations
- Aggregate supply for bulk listing
- Negotiate with buyers at scale
- Distribute input supplies to members
- Track financials (receivables, payables, commissions)
- Apply for institutional credit/loans
- Manage collection centers
- Generate PMMSY DPR (Detailed Project Reports)
- View performance analytics and KPIs

### 4.4 Input Supplier
**Database Role:** `supplier`

| Attribute | Detail |
|-----------|--------|
| Profile | Seed companies, fertilizer dealers, feed manufacturers, chemical suppliers |
| Key Needs | Market reach, order management, credit management |
| Navigation | Home → AgriGalaxy → AquaOS → Community → Profile |

**Supplier Capabilities:**
- List products with pricing, specifications, availability
- Manage inventory across warehouses
- Process bulk orders
- Run promotional campaigns
- Manage dealer network
- View demand analytics per region
- Participate in B2B marketplace

### 4.5 Service Provider
**Database Role:** `service_provider`

| Attribute | Detail |
|-----------|--------|
| Sub-Types | Equipment owners, transport providers, gig workers, lab technicians |
| Key Needs | Job discovery, payment, reputation building |
| Navigation | Home → Agri → Kisan → Community → Profile |

**Service Provider Capabilities:**
- List equipment for rent (tractors, harvesters, drones, pump sets)
- Accept bookings and manage availability calendar
- Provide transport/logistics services
- Take up gig work (spraying, harvesting, grading)
- Track earnings and ratings
- View service requests in nearby areas

### 4.6 Admin
**Database Role:** `admin`

| Attribute | Detail |
|-----------|--------|
| Profile | Platform operators, support staff, compliance officers |
| Key Needs | User management, dispute resolution, analytics, fraud detection |

**Admin Capabilities:**
- View platform-wide analytics and dashboards
- Manage user verification queue
- Resolve disputes and handle escalations
- Monitor fraud alerts and suspicious activities
- Manage crop catalog and pricing data
- Configure system settings and feature flags
- View audit logs
- Manage platform commission rates
- Generate reports for government/regulatory compliance

---

## 5. Platform Architecture Overview

### High-Level Architecture
```
┌───────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├───────────────────────────────────────────────────────────────────┤
│  PWA (Vite)  │  Android (Kotlin)  │  Mobile Web  │  Admin Panel   │
└──────┬────────────────┬──────────────────┬────────────────┬───────┘
       │                │                  │                │
       ▼                ▼                  ▼                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / CDN                              │
│              (Vercel / Netlify / Custom Reverse Proxy)              │
└──────────────────────────────┬────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                      APPLICATION LAYER                              │
│                   (Node.js + Express REST API)                      │
├───────────────────────────────────────────────────────────────────┤
│  Auth │ AgriFlow │ AquaOS │ KisanConnect │ Trade │ Galaxy │ ...   │
│       │          │ (V1-V11)│              │       │        │       │
├───────────────────────────────────────────────────────────────────┤
│                      MIDDLEWARE LAYER                               │
│  Auth │ Rate Limit │ Sanitize │ DPDP │ Validate │ Error │ Audit  │
├───────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                                  │
│  SMS │ Push │ Weather │ Cache │ Queue │ WebSocket │ Payments │ AI │
└──────────┬──────────────────┬──────────────────────┬──────────────┘
           │                  │                      │
┌──────────▼──────────┐  ┌───▼──────────┐  ┌───────▼──────────────┐
│  PostgreSQL 16      │  │  Redis 7     │  │  External Services   │
│  (Primary Store)    │  │  (Cache/Pub) │  │  (SMS/Push/Maps/AI)  │
└─────────────────────┘  └──────────────┘  └──────────────────────┘
```

### Module Dependency Map
```
AgriHub Super-App
├── Auth (JWT + OTP)
├── AgriFlow (Crop Marketplace)
│   ├── Listings (GPS + Photos + Voice)
│   ├── Search & Discovery
│   └── Trade Integration
├── AquaOS (Aquaculture OS)
│   ├── V1: Farm/Pond/Sampling/Growth
│   ├── V2: Finance/Disease/Auctions/Training/Schemes
│   ├── V3: RFQ/Escrow/Yield Forecast
│   ├── V4: Culture Units/Harvest Optimizer/IoT/Trust
│   ├── V5: KPI Engine/Predictive Models/Supply Marketplace
│   ├── V6: Fish Marketplace/Cold Chain/Traceability/PMMSY DPR
│   ├── V7: Reviews/Logistics+/Training/ODR/Trade Credit/VMS
│   ├── V8: Role-Based Ecosystem/Crop Posts/Community/Leads
│   ├── V9: Privacy/Admin/Negotiation/Insights/Security
│   ├── V10: Analytics/Search/Payments/Pricing/Chat/AI/IoT
│   └── V11: Contract Aquaculture/Labor/Insurance/Export/Portfolio
├── KisanConnect (Rural OS)
│   ├── Equipment Rental
│   ├── Transport & Delivery
│   ├── Gig Workers
│   └── Vehicle Management
├── FarmerConnect (Land Marketplace)
├── BhoomiOS (Land Management)
├── Trade Engine (Escrow + State Machine)
├── Galaxy (Discovery + Portfolios)
├── Intelligence (Analytics + Insights)
├── Financial Services (Wallet/Credit/Insurance)
├── Warehouse Management
├── Compliance (DPDP/KYC/eNAM)
└── Admin & Monitoring
```

---

## 6. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Vite | 6.3.x | Build tool & dev server |
| Vanilla JS (ES Modules) | ES2022 | UI rendering (no React/Vue) |
| CSS (Custom) | CSS3 | Styling with custom design system |
| PWA | Service Worker | Offline support, installability |
| Supabase Client | 2.x | Real-time subscriptions, auth fallback |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.21.x | HTTP framework |
| PostgreSQL | 16 (Alpine) | Primary database |
| Redis | 7 (Alpine) | Caching, pub/sub, rate limiting |
| WebSocket (ws) | 8.18.x | Real-time communication |
| Pino | 10.x | Structured logging |
| JSON Web Token | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| uuid | 11.x | UUID generation |
| express-rate-limit | 7.5.x | Rate limiting |
| express-validator | 7.2.x | Input validation |
| Helmet | 8.x | Security headers |
| HPP | 0.2.x | HTTP parameter pollution prevention |
| Compression | 1.8.x | Gzip response compression |
| pg | 8.14.x | PostgreSQL client |
| dotenv | 16.x | Environment variable management |

### Android (Native)
| Technology | Purpose |
|-----------|---------|
| Kotlin | Primary language |
| Gradle (Kotlin DSL) | Build system |
| Jetpack Libraries | Android components |
| Material Design 3 | UI system |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Docker + Docker Compose | Containerization |
| Vercel | Frontend hosting |
| Netlify | Alternative frontend hosting |
| Supabase | BaaS (auth, real-time, storage) |
| Cloudflare R2 | Media/file storage |
| Firebase | Push notifications |
| Sentry | Error monitoring |
| GrowthBook | Feature flags |

---

## 7. System Infrastructure

### Docker Compose Services
```yaml
Services:
  1. postgres (PostgreSQL 16 Alpine)
     - Port: 5455:5432
     - Database: Agrihub
     - Healthcheck: pg_isready every 5s
     - Persistent volume: agrihub_pg_data
     
  2. redis (Redis 7 Alpine)
     - Port: 6399:6379
     - Healthcheck: redis-cli ping every 5s
     - Persistent volume: agrihub_redis_data
     
  3. backend (Node.js API)
     - Port: 4000:4000
     - Depends on: postgres (healthy), redis (healthy)
     - Healthcheck: wget /health every 30s
     - Start period: 40s
```

### Database Configuration
| Parameter | Default | Production |
|-----------|---------|-----------|
| Host | localhost | postgres (Docker) |
| Port | 5432 | 5432 |
| Database | Agrihub | Agrihub |
| Max Pool | 20 | Configurable |
| Retry Attempts | 5 | 5 |
| Retry Delay | 3000ms | 3000ms |

### Redis Configuration
| Parameter | Default |
|-----------|---------|
| Host | localhost |
| Port | 6379 |
| Use | Cache, Pub/Sub, Rate Limiting |

---

## 8. Authentication & Security

### Authentication Flow
```
1. User enters phone number (Indian: starts with 6-9, 10 digits)
2. System generates 6-digit OTP
3. OTP sent via MSG91 (primary) → Fast2SMS (fallback)
4. OTP valid for 10 minutes
5. User verifies OTP
6. System issues JWT token (7 day expiry) + Refresh token (30 day)
7. Refresh tokens stored in database
8. Token includes: { userId }
9. All protected routes require Bearer token
```

### Token Management
| Token Type | Expiry | Storage |
|-----------|--------|---------|
| Access (JWT) | 7 days | Client-side |
| Refresh | 30 days | PostgreSQL |
| OTP | 10 minutes | PostgreSQL |

### Security Middleware Stack
1. **Helmet** — Security headers (CSP, XSS protection, HSTS)
2. **CORS** — Restricted origins in production, permissive in dev
3. **HPP** — HTTP parameter pollution prevention
4. **Rate Limiting** — Global: configurable per window, Auth: stricter limits
5. **Request ID** — UUID per request for tracing
6. **Sanitize** — Input sanitization against XSS/injection
7. **Audit** — All requests logged for compliance

### Rate Limiting Configuration
| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| Global (/api/*) | Configurable | Configurable |
| Auth (send-otp, verify-otp) | Stricter | Limited |
| Marketplace Write | Per-route | Limited |
| Auction Bids | Per-route | Limited |
| Negotiations | Per-route | Limited |
| Payments | Per-route | Limited |
| Search | Per-route | Limited |
| IoT Ingestion | Per-route | Limited |

### Role-Based Access Control (RBAC)
```javascript
Roles: farmer | fpo | buyer | admin | service_provider | supplier

Middleware: requireRole(...roles)
- Validates authenticated user exists
- Checks user.role against allowed roles
- Returns 403 if insufficient permissions
```

### Content Security Policy (Production)
```
default-src: 'self'
script-src: 'self', 'unsafe-inline'
style-src: 'self', 'unsafe-inline'
img-src: 'self', data:, https:
connect-src: 'self', wss:, https:
```

---

## 9. Database Schema & Design

### Migration History (24 Versions)
| Migration | Content |
|-----------|---------|
| migrate.js | Foundation tables (users, otps, crops, districts, declarations, listings, inquiries, prices, ponds, equipment) |
| migrate-v2.js | Extended platform (notifications, chat, reviews, favorites, watchlists, tickets) |
| migrate-v3-trade.js | Trade tables (trade_orders, trade_bids, trade_timeline, escrow_transactions) |
| migrate-v4-infrastructure.js | Infrastructure (contracts, trust_scores, satellite_data, logistics) |
| migrate-v5-platform.js | Platform services (wallet, subscriptions, analytics, agents, FPO) |
| migrate-v6-agrios.js | AgriOS extension (crop doctor, farm diary, inputs) |
| migrate-v6-farmerson.js | FarmerSon (verification, cart, seller, livestock, booking, fraud) |
| migrate-v7-intelligence.js | Intelligence layer (market analytics, predictions, recommendations) |
| migrate-v8-finance.js | Financial services (loans, insurance, bank portal) |
| migrate-v9-ecosystem.js | Ecosystem (execution network, demand engine, hyperlocal) |
| migrate-v10-ros.js | KisanConnect ROS (vehicles, transport, delivery, gig workers) |
| migrate-v11-aquaos.js | AquaOS V2 (finance, disease, auctions, cold chain, training, schemes) |
| migrate-v12-aquaos-rfq.js | AquaOS V3 (RFQ, escrow, yield forecasting, community, onboarding) |
| migrate-v13-aquaos-v4.js | AquaOS V4 (culture units, production cycles, harvest optimizer, IoT, trust) |
| migrate-v14-aquaos-v5.js | AquaOS V5 (KPI engine, predictive models, supply marketplace, alert engine) |
| migrate-v15-aquaos-v6.js | AquaOS V6 (fish marketplace, cold chain+, traceability, PMMSY DPR, suppliers) |
| migrate-v16-aquaos-v7.js | AquaOS V7 (reviews, logistics+, training, ODR, trade credit, VMS) |
| migrate-v17-aquaos-v8.js | AquaOS V8 (role-based ecosystem, crop posts, community, supply forecast, leads) |
| migrate-v18-aquaos-v9.js | AquaOS V9 (privacy, admin, negotiation, insights, security) |
| migrate-v19-aquaos-v10.js | AquaOS V10 (analytics, search, payments, pricing, chat, AI, growth, IoT) |
| migrate-v20-indexes.js | Performance indexes |
| migrate-v21-galaxy.js | Galaxy discovery module |
| migrate-v22-platform-readiness.js | Platform readiness (DPDP, KYC, AI, eNAM) |
| migrate-v23-aquaos-v11.js | AquaOS V11 (contract aquaculture, labor, insurance, export, portfolio) |
| migrate-v24-warehouse.js | Warehouse management |

### Core Tables (Foundation — migrate.js)

#### users
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, gen_random_uuid() |
| phone | VARCHAR(15) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | |
| role | user_role ENUM | NOT NULL, DEFAULT 'farmer' |
| language | VARCHAR(5) | NOT NULL, DEFAULT 'en' |
| district_id | INTEGER | FK → districts |
| state_code | VARCHAR(5) | |
| lat | DECIMAL(10,7) | |
| lng | DECIMAL(10,7) | |
| avatar_url | TEXT | |
| is_verified | BOOLEAN | DEFAULT FALSE |
| onboarding_completed | BOOLEAN | DEFAULT FALSE |
| last_active_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes:** idx_users_phone, idx_users_role

#### otps
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| phone | VARCHAR(15) | NOT NULL |
| code | VARCHAR(6) | NOT NULL |
| expires_at | TIMESTAMPTZ | NOT NULL |
| used | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

#### crop_catalog
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| name_te | VARCHAR(100) | Telugu name |
| name_hi | VARCHAR(100) | Hindi name |
| variety | VARCHAR(100) | |
| category | VARCHAR(50) | NOT NULL |
| season | crop_season ENUM | kharif/rabi/zaid/perennial |
| avg_yield_per_acre | DECIMAL(10,2) | |
| min_price_reference | DECIMAL(10,2) | |
| growing_days | INTEGER | |
| is_organic_eligible | BOOLEAN | DEFAULT TRUE |
| icon_emoji | VARCHAR(10) | |

#### districts
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| name_local | VARCHAR(100) | |
| state_code | VARCHAR(5) | NOT NULL |
| state_name | VARCHAR(50) | NOT NULL |
| total_farmers | INTEGER | DEFAULT 0 |
| primary_crops | TEXT[] | Array |
| lat | DECIMAL(10,7) | |
| lng | DECIMAL(10,7) | |

#### declarations (Crop Declarations)
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| farmer_id | UUID | FK → users, CASCADE |
| crop_id | INTEGER | FK → crop_catalog |
| district_id | INTEGER | FK → districts |
| area_acres | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| expected_yield | DECIMAL(10,2) | |
| sow_date | DATE | NOT NULL |
| expected_harvest_date | DATE | NOT NULL |
| actual_harvest_date | DATE | |
| quality_grade | quality_grade ENUM | DEFAULT 'ungraded' |
| is_organic | BOOLEAN | DEFAULT FALSE |
| quality_score | DECIMAL(5,2) | DEFAULT 50.00 |
| notes | TEXT | |

#### supply_listings
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| fpo_id | UUID | FK → users |
| crop_id | INTEGER | FK → crop_catalog |
| district_id | INTEGER | FK → districts |
| quantity_kg | DECIMAL(12,2) | NOT NULL, CHECK > 0 |
| grade | quality_grade | DEFAULT 'ungraded' |
| is_organic | BOOLEAN | DEFAULT FALSE |
| price_per_kg | DECIMAL(10,2) | |
| min_order_kg | DECIMAL(10,2) | |
| collection_center | VARCHAR(200) | |
| logistic_support | BOOLEAN | DEFAULT FALSE |
| status | listing_status ENUM | DEFAULT 'active' |
| description | TEXT | |
| farmer_name | VARCHAR(100) | |
| location_label | VARCHAR(200) | |

#### inquiries
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| buyer_id | UUID | FK → users |
| listing_id | UUID | FK → supply_listings |
| seller_id | UUID | FK → users |
| crop_id | INTEGER | FK → crop_catalog |
| quantity_needed | DECIMAL(12,2) | |
| timeline | VARCHAR(100) | |
| message | TEXT | |
| status | inquiry_status ENUM | DEFAULT 'pending' |
| response_message | TEXT | |

#### price_feeds
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PK |
| crop_id | INTEGER | FK → crop_catalog |
| market_name | VARCHAR(100) | |
| district_id | INTEGER | FK → districts |
| price_per_quintal | DECIMAL(10,2) | NOT NULL |
| min_price | DECIMAL(10,2) | |
| max_price | DECIMAL(10,2) | |
| source | VARCHAR(30) | DEFAULT 'platform' |
| recorded_at | TIMESTAMPTZ | DEFAULT NOW() |
| arrival_qty_tonnes | DECIMAL(10,2) | |

#### ponds (AquaOS Foundation)
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| farmer_id | UUID | FK → users, CASCADE |
| pond_code | VARCHAR(20) | NOT NULL |
| species | VARCHAR(100) | |
| area_acres | DECIMAL(8,2) | |
| stocked_count | INTEGER | |
| stocking_date | DATE | |
| survival_pct | DECIMAL(5,2) | |
| avg_weight_g | DECIMAL(8,2) | |
| ph_level | DECIMAL(4,2) | |
| temperature_c | DECIMAL(5,2) | |
| dissolved_o2 | DECIMAL(5,2) | |
| status | pond_status ENUM | active/harvested/fallow/preparation |

#### equipment (KisanConnect Foundation)
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| owner_id | UUID | FK → users |
| equipment_type | VARCHAR(50) | |
| name | VARCHAR(100) | |
| district_id | INTEGER | FK → districts |
| status | equipment_status ENUM | available/booked/maintenance |
| rating | DECIMAL(3,2) | |
| price_per_hour | DECIMAL(10,2) | |
| price_per_day | DECIMAL(10,2) | |

### ENUM Types
```sql
user_role: farmer, fpo, buyer, admin, service_provider
crop_season: kharif, rabi, zaid, perennial
quality_grade: A+, A, B, C, ungraded
listing_status: draft, active, sold, expired, cancelled
inquiry_status: pending, responded, accepted, rejected, expired
equipment_status: available, booked, maintenance
pond_status: active, harvested, fallow, preparation
```

---

## 10. Core Module: AgriFlow — Crop Supply Marketplace

### Overview
AgriFlow is the primary agricultural supply marketplace connecting farmers/FPOs to buyers. It handles crop listing, search, discovery, and the initial touchpoint before trade execution.

### Features

#### 10.1 Supply Listings
- **Create Listing:** Farmers/FPOs can list their produce with:
  - Crop selection from catalog
  - Quantity (kg)
  - Quality grade (A+, A, B, C, ungraded)
  - Organic certification status
  - Price per kg (optional — can leave for negotiation)
  - Minimum order quantity
  - Collection center location
  - GPS coordinates (mandatory for trusted listings)
  - Photo upload (multiple)
  - Voice note description (for low-literacy users)
  - District and location label
  - Logistic support availability

- **Listing Statuses:** draft → active → sold/expired/cancelled

#### 10.2 Advanced Search & Discovery
- Full-text search across crop name, description, location
- Filter by: crop type, district, organic, grade, price range, quantity range
- **Proximity Search:** Haversine formula for radius-based discovery
  - User provides lat/lng + radius_km
  - System calculates distance and sorts by nearest
- Sort options: newest, price (asc/desc), quantity, distance
- Pagination: limit + offset based

#### 10.3 Inquiry System
- Buyer sends inquiry to seller referencing a listing
- Includes: quantity needed, timeline, message
- Statuses: pending → responded → accepted/rejected/expired
- Notifications sent on status changes

#### 10.4 Price Feeds
- Real-time mandi prices from APMC/eNAM integration
- Per-crop, per-district pricing
- Historical price data for trend analysis
- Min/max/modal prices
- Arrival quantity tracking

### API Endpoints (AgriFlow)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/agriflow/listings | Optional | Browse supply marketplace |
| POST | /api/agriflow/listings | Required | Create new listing |
| GET | /api/agriflow/listings/:id | Optional | Get listing details |
| PATCH | /api/agriflow/listings/:id | Required | Update listing |
| DELETE | /api/agriflow/listings/:id | Required | Remove listing |
| POST | /api/agriflow/inquiries | Required | Send inquiry |
| GET | /api/agriflow/inquiries | Required | List user inquiries |
| PATCH | /api/agriflow/inquiries/:id | Required | Respond to inquiry |
| GET | /api/agriflow/prices | Optional | Get mandi prices |

---

## 11. Core Module: AquaOS — Aquaculture Operating System

### Overview
AquaOS is the most comprehensive sub-platform, covering the complete aquaculture lifecycle from farm registration to international export. It has evolved through 11 major versions, each adding significant capability.

### AquaOS V1 — Farm & Pond Management (Foundation)

#### Farm Management
- Create/update/delete aquaculture farms
- Fields: farm_name, location, district, state, GPS coordinates, total area
- Farms linked to authenticated farmer
- Pond count per farm (live computed)

#### Pond Management
- Create ponds linked to farms
- Track: species, area, stocked count, stocking date
- Water quality parameters: pH, temperature, dissolved oxygen
- Growth tracking: survival %, average weight
- Status management: active/harvested/fallow/preparation

#### Growth Sampling
- Periodic sampling records (every 10 days recommended)
- Record: average weight, sample count, survival rate
- Auto-calculate biomass (count × avg_weight × survival%)
- Growth trend analysis

#### Species & Pricing
- Built-in species price reference:
  - Vannamei: ₹350/kg
  - Shrimp: ₹350/kg
  - Tiger: ₹600/kg
  - Crab: ₹500/kg
  - Pangasius: ₹95/kg
  - Default: ₹160/kg

### AquaOS V2 — Financial & Disease Management

#### Financial Tracking
- Income/expense recording per farm/pond
- Category-wise breakdown
- Profit/loss calculation
- Cash flow analysis

#### Disease Reports
- Log disease incidents with symptoms
- Link to specific ponds
- Treatment tracking
- Disease prevalence analytics

#### PMMSY Schemes
- Pradhan Mantri Matsya Sampada Yojana integration
- Scheme eligibility check
- Application submission
- Status tracking

#### Cold Chain Logistics
- Temperature-controlled transport booking
- Route tracking
- Cold storage facility directory

#### Training Hub
- Aquaculture training modules
- Best practices library
- Video/audio content support
- Multi-language (EN/TE/HI/TA)

#### Auctions
- Live auction system for fresh catch
- Bid management
- Auto-settlement

#### Benchmarks
- Performance comparison across farms
- District/state-level benchmarking
- Species-wise comparison

### AquaOS V3 — RFQ & Forecasting

#### RFQ (Request for Quotation)
- Buyers post requirements (species, quantity, size, delivery date)
- Farmers respond with quotes
- Negotiation workflow
- Auto-matching based on capacity

#### Escrow Payments
- Buyer deposits into escrow
- Released upon quality verification and delivery
- Dispute handling
- Auto-release timers

#### Yield Forecasting
- Von Bertalanffy growth model implementation
- Predict harvest date based on current growth rate
- Estimate final biomass
- Factor in: temperature, feed, survival rate

#### Community
- Aquaculture-specific discussion forum
- Knowledge sharing
- Expert Q&A

### AquaOS V4 — Culture Units & Optimization

#### Culture Unit Types
- **Pond:** Traditional earth ponds
- **RAS (Recirculating Aquaculture System):** Indoor controlled
- **Cage:** Open water cage culture
- **Biofloc:** Biofloc technology systems
- **Hatchery:** Seed/larvae production

#### Production Cycles
- Track complete production cycles per unit
- Stocking → Growth → Harvest
- Multi-species configuration
- Batch management

#### Harvest Optimizer
- Price-size optimization algorithm
- Calculate optimal harvest date based on:
  - Current growth rate
  - Market price curves
  - Feed cost trajectory
  - Survival rate trend
- Maximize profit per cycle

#### IoT Device Management
- Register IoT sensors per pond/unit
- Types: water quality, temperature, DO, pH, ammonia
- Threshold-based alerting
- Historical data visualization

#### Trust Verification
- GST verification
- FSSAI license check
- MPEDA registration validation
- Badge assignment based on verification level

#### Per-Acre Analytics
- Input cost per acre
- Revenue per acre
- Yield per acre
- Profit per acre
- Comparison across units

### AquaOS V5 — Advanced KPI Engine

#### KPI Engine
- **SGR (Specific Growth Rate):** Daily growth percentage
- **ADG (Average Daily Growth):** Grams gained per day
- **FCR (Feed Conversion Ratio):** Feed used / weight gained
- Interval-based calculation (weekly, monthly, cycle)
- Trend visualization

#### Von Bertalanffy Predictive Growth Model
- Mathematical growth curve fitting
- Parameters: L∞ (asymptotic length), K (growth coefficient), t₀
- Bio-economic profit optimization
- Predict: days to market size, revenue at different harvest dates

#### Rule-Based Alert Engine
- Configurable thresholds:
  - **Water Quality:** pH out of range, DO low, temperature spike, ammonia high
  - **Growth:** Below expected ADG, FCR deterioration
  - **Mortality:** Sudden mortality spike
  - **Feed:** Over-feeding detection, feeding pattern anomaly
- Multi-channel alerts (push, SMS, in-app)

#### B2B Supply Marketplace
- Supplier directory (feed, seed, chemicals, equipment)
- Product catalog with specs
- Bulk order system
- Review and rating

### AquaOS V6 — Fish Marketplace & Traceability

#### Fish Marketplace
- **Listing Types:**
  - Fixed Price
  - Auction (time-bound bidding)
  - RFQ (request-based)
- Quality grading (BIS standards)
- Photo + GPS mandatory
- Batch/lot management

#### Buyer Profiles
- **Wholesaler:** Bulk purchase, regular supply
- **Restaurant/Hotel:** Quality-first, smaller quantities
- **Exporter:** Size/grade specific, documentation required
- **Processor:** Raw material sourcing, large volumes

#### Cold Chain+ Logistics
- Temperature monitoring throughout transport
- IoT-enabled transport vehicles
- Compliance logging (time-temperature)
- SLA management

#### Farm-to-Fork Traceability
- QR code generation per batch
- Blockchain-anchored records (via hash)
- Critical Tracking Events (CTEs):
  - Stocking, Feed events, Water quality, Harvest, Transport, Processing, Retail
- Consumer-scannable traceability page

#### PMMSY DPR Builder
- Auto-generate Detailed Project Reports
- Subsidy calculation engine
- Project cost estimation
- Document upload and verification
- Application tracking

#### National Supplier Directory
- 27+ seeded suppliers (Phase 1)
- Categories: Feed, Seed, Equipment, Chemicals, Consultancy
- Search, filter, compare
- Bulk procurement

### AquaOS V7 — Reviews, Training & Dispute Resolution

#### Verified Seller Reviews
- Performance-based badge system
- Delivery speed rating
- Quality accuracy rating
- Communication rating
- Aggregate scoring

#### Logistics Providers Directory
- 10+ seeded providers (Phase 1)
- Service types: refrigerated, dry, live transport
- Booking system
- IoT temperature monitoring en-route
- Route optimization

#### Online Dispute Resolution (ODR)
- 3-tier escalation:
  1. Peer negotiation (72 hours)
  2. Platform mediation (7 days)
  3. External arbitration (30 days)
- Evidence submission (photos, docs, communications)
- Resolution tracking

#### Trade Credit
- Net terms invoicing (Net 15, Net 30, Net 45)
- Credit scoring based on trade history
- Auto-reminders on due dates
- Default management

#### Training Curriculum
- 14+ seeded modules from ICAR-CIFA/ASCI
- Languages: English, Telugu, Hindi, Tamil
- Types: video, audio, text, interactive
- Progress tracking and certificates
- Module categories:
  - Pond preparation
  - Water quality management
  - Disease identification
  - Feed management
  - Harvest techniques
  - Export documentation

#### Vessel Monitoring System (VMS)
- IUU (Illegal, Unreported, Unregulated) fishing compliance
- GPS tracking of fishing vessels
- Geo-fence alerts
- Catch reporting

### AquaOS V8 — Role-Based Ecosystem

#### Role-Based Access
- **roleGuard Middleware:** Route-level access control per role
- Crop posts visible only to buyers
- Supplier-specific views
- Farmer-specific dashboards

#### Crop Posts (Seller → Buyer)
- Farmers post available stock
- Buyers discover based on species, size, quantity
- Direct negotiation initiation

#### Community Discussions
- Category-based forums:
  - Disease Help, Market Trends, Best Practices, Equipment, General
- Upvote/downvote system
- Expert-tagged responses

#### Multi-District Market Prices
- 14 species × multiple markets
- Real-time price updates
- Seeded data for AP districts

#### Supply Forecast (For Buyers)
- Predict upcoming supply based on:
  - Active production cycles
  - Expected harvest dates
  - Historical patterns
- 7-day supply forecast per species/district

#### Supplier Promotions & Campaigns
- Promotional pricing
- Bulk discount campaigns
- Time-limited offers
- Campaign analytics

#### Sales Leads Tracking
- CRM-lite for suppliers
- Lead stages: new → contacted → negotiating → closed
- Follow-up reminders
- Conversion analytics

#### Expert Advisory Directory
- 5+ seeded experts (Phase 1)
- Specializations: disease, water quality, feed, harvest, export
- Booking system for consultations
- Rating and feedback

#### 7-Step Workflow Tracking
- End-to-end trade workflow visualization:
  1. Listing Created
  2. Buyer Matched
  3. Price Agreed
  4. Quality Verified
  5. Payment Secured
  6. Dispatched
  7. Delivered & Rated

#### Platform Analytics
- GMV tracking
- User growth metrics
- Trade completion rates
- Revenue analytics

### AquaOS V9 — Privacy, Admin & Negotiation

#### Privacy Controls
- Per-field visibility toggles
- Control who sees: phone, location, production data
- DPDP-compliant consent management
- Data export/deletion requests

#### Real-Time Negotiation Rooms
- WebSocket-based live chat
- Counter-offer system
- Accept/reject workflows
- Price negotiation history
- Time-bound negotiation windows

#### Notification Preferences
- Channel selection: push, SMS, email, WhatsApp, in-app
- Quiet hours configuration
- Category-based preferences
- Frequency controls

#### Production Data as Hidden Asset
- Production insights (not visible to competitors):
  - Survival rates per species
  - Growth rates (ADG, SGR)
  - FCR benchmarks
  - Disease incidence history
  - Yield per acre trends
- Shared selectively with verified buyers only
- 20 seeded production insight records

#### Admin Panel
- Platform-wide analytics dashboard
- User management (approve, ban, verify)
- Harvest monitoring across all farms
- Verification queue management
- Fraud alert system
- Complete audit log

#### Security & Fraud
- Fraud reporting mechanism
- Rate limiting per user/IP
- Suspicious activity detection
- Account lockout policies

### AquaOS V10 — Analytics, AI & Payments

#### Analytics Layer
- Survival rate analytics per species/district
- FCR comparison across farms
- Disease prevalence mapping
- Yield insights with benchmarking

#### Full-Text Search
- PostgreSQL GIN indexes
- Search across: listings, users, products, species
- Fuzzy matching
- Auto-suggestions

#### Razorpay Payment Integration
- Order creation
- Payment capture
- Webhook handling
- Commission calculation (configurable %)
- Payout to sellers
- Refund management

#### Pricing Intelligence
- 14 AP market prices (seeded)
- Price forecasting model
- Supply-demand correlation
- Seasonal trend analysis
- Price alerts

#### Chat Rooms & Messaging
- Trade-linked chat rooms
- General chat capabilities
- Read receipts
- Media sharing (photos, documents)

#### AI Prediction Engine
- **Disease Prediction:** Based on water quality + season + history
- **Yield Prediction:** Growth model + environmental factors
- **Feed Optimization:** Optimal feeding schedule and quantity
- **Price Prediction:** Market trend analysis + supply factors
- Model confidence scores

#### Growth Metrics (District Pilot)
- Target: 4 districts (East Godavari, West Godavari, Krishna, Guntur)
- Tracked metrics: users, GMV, listings, trades, satisfaction

#### IoT Sensor Ingestion
- Endpoint for sensor data push
- Threshold-based alerting
- Data aggregation (minute → hour → day)
- Visualization support

#### Monetization Configuration
- Commission rates per category
- Subscription tiers
- Feature gating
- Revenue attribution

#### System Health Monitoring
- Service uptime tracking
- Database performance metrics
- API response time monitoring
- Error rate tracking

### AquaOS V11 — Contract Aquaculture & Supply Chain

#### Contract Aquaculture
- Contract creation between farmer and buyer
- Sign/accept workflow
- Terms: species, quantity, size, price, delivery schedule
- Contract status tracking
- Penalty clauses for breach

#### Labor Management
- Worker attendance tracking
- Cost allocation per pond/farm
- Payroll integration
- Skill-based assignment

#### Insurance Products
- 5 seeded insurance products:
  - Crop loss insurance
  - Disease outbreak cover
  - Natural disaster protection
  - Equipment damage
  - Mortality coverage
- Policy management
- Claims processing
- Premium calculation

#### Export Compliance
- **MPEDA:** Marine Products Export Development Authority
- **EU Standards:** Hazard Analysis (HACCP), traceability
- **FDA (US):** Prior notice, facility registration
- Lab result management (12 export requirements seeded)
- Certificate generation
- Compliance checklist

#### Multi-Farm Portfolio
- Consolidated view across all farms
- Financial rollup
- Performance comparison
- Asset valuation

#### Aqua Input Supply Chain
- 8 seeded input suppliers
- Feed, seed, chemicals, probiotics
- Order management
- Delivery tracking
- Quality complaints

#### Harvest Planning & Scheduling
- Calendar-based harvest planning
- Market timing optimization
- Resource allocation (labor, transport, storage)
- Batch scheduling

---

## 12. Core Module: KisanConnect — Rural Operating System

### Overview
KisanConnect is a rural super-app providing agricultural equipment rental, transport logistics, gig worker marketplace, and delivery services to rural India.

### 12.1 Equipment Rental Marketplace
- **List Equipment:** Owners register tractors, harvesters, drones, pump sets, threshers
- **Search & Discovery:** By type, district, availability, rating
- **Booking System:**
  - Select equipment
  - Choose dates/hours
  - Pricing (per hour / per day / per acre)
  - Confirm booking
  - Cancellation policy
- **Rating & Reviews:** Post-service feedback

### 12.2 Vehicle Management
- Register vehicles (trucks, tempos, refrigerated vans)
- Track availability and location
- Maintenance scheduling
- Document management (RC, insurance, permit)

### 12.3 Transport & Logistics
- **Route Planning:** Origin → Destination optimization
- **Load Matching:** Match cargo with available vehicles
- **Pricing:** Per km, per ton, per trip
- **Tracking:** Real-time GPS tracking
- **POD:** Proof of delivery confirmation

### 12.4 Delivery System
- Last-mile delivery management
- Order assignment to delivery agents
- Status tracking (picked → in-transit → delivered)
- OTP-based delivery confirmation
- COD (Cash on Delivery) support

### 12.5 Gig Workers Marketplace
- Worker registration with skills
- Job posting by farmers/FPOs
- Skill categories:
  - Spraying (pesticide/fertilizer)
  - Harvesting (manual/machine-assisted)
  - Grading & sorting
  - Packaging
  - Loading/unloading
  - Pond preparation (aquaculture)
- **Matching Service:** Auto-match workers to jobs based on skills, location, availability
- Payment settlement
- Rating system

### API Endpoints (KisanConnect)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/kisanconnect/equipment | Optional | List equipment |
| POST | /api/kisanconnect/equipment | Required | Register equipment |
| POST | /api/kisanconnect/equipment/:id/book | Required | Book equipment |
| GET | /api/vehicles/ | Required | List vehicles |
| POST | /api/vehicles/ | Required | Register vehicle |
| GET | /api/transport/routes | Required | Available routes |
| POST | /api/transport/book | Required | Book transport |
| GET | /api/delivery/orders | Required | Delivery orders |
| PATCH | /api/delivery/orders/:id | Required | Update delivery status |
| GET | /api/gigworkers/ | Optional | Browse workers |
| POST | /api/gigworkers/register | Required | Register as gig worker |
| POST | /api/gigworkers/jobs | Required | Post a job |
| POST | /api/gigworkers/match | Required | Auto-match worker |

---

## 13. Core Module: FarmerConnect — Land & Property

### Overview
FarmerConnect is a marketplace for agricultural land and property — leasing, renting, and sharing farmland, warehouses, cold storage, and processing facilities.

### Features
- **Property Types:** Farmland, Warehouse, Cold Storage, Processing Unit, Office
- **Property Listing:**
  - Title, description, photos
  - Property type and area
  - Location (district, GPS)
  - Rent amount and terms
  - Availability status
  - Owner verification
- **Search & Filter:** By type, district, rent range, area
- **Verified Listings:** Prioritized in search results
- **Contact Owner:** Direct communication

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/farmerconnect/properties | Optional | Browse properties |
| POST | /api/farmerconnect/properties | Required | List property |
| GET | /api/farmerconnect/properties/:id | Optional | Property details |
| PATCH | /api/farmerconnect/properties/:id | Required | Update listing |

---

## 14. Core Module: BhoomiOS — Land Management

### Overview
BhoomiOS is the land records and farm management module, integrating with government land databases to provide digitized land records, boundary mapping, and soil health data.

### Features
- Digital land record integration
- Field boundary mapping
- Soil health card data
- Land utilization tracking
- Ownership verification
- Revenue record access

---

## 15. Trade & Commerce Engine

### Overview
The Trade Engine handles the complete lifecycle of assured agricultural trade — from listing creation to payment release, with built-in escrow, quality verification, and dispute resolution.

### Trade State Machine
```
created → bid_placed → bid_accepted → escrow_funded → quality_verified 
  → dispatched → in_transit → delivered → payment_released

Alternative paths:
  Any state → cancelled (before escrow)
  escrow_funded onwards → disputed → resolved_seller / resolved_buyer
  bid_placed → bid_rejected
```

### Valid Transitions
| Current State | Possible Next States |
|---------------|---------------------|
| created | bid_placed, cancelled |
| bid_placed | bid_accepted, bid_rejected, cancelled |
| bid_accepted | escrow_funded, cancelled |
| escrow_funded | quality_verified, disputed, cancelled |
| quality_verified | dispatched, disputed |
| dispatched | in_transit, disputed |
| in_transit | delivered, disputed |
| delivered | payment_released, disputed |
| payment_released | (terminal) |
| disputed | resolved_seller, resolved_buyer |

### Trade Features

#### 15.1 Listings with Media
- GPS location (mandatory for trusted listing)
- Multiple photo upload
- Voice note (for non-literate farmers)
- Farmer name and location label
- Quality grade and organic certification

#### 15.2 Bidding
- Buyer places bid on listing
- Bid includes: price, quantity, delivery terms
- Seller can accept/reject
- Counter-offer support
- Time-bound bid validity

#### 15.3 Escrow System
- Platform holds funds after bid acceptance
- Released only upon:
  - Quality verification (at collection point)
  - Delivery confirmation (GPS + OTP)
- Commission: 1.5% platform fee (configurable)
- Refund on dispute resolution

#### 15.4 Quality Verification
- At collection center or buyer location
- Photo evidence of quality
- Grade confirmation
- Weight verification
- Discrepancy handling

#### 15.5 Dispatch & Delivery
- Pickup scheduling
- Transport assignment
- Real-time tracking
- Delivery confirmation (OTP/photo)
- POD (Proof of Delivery)

#### 15.6 Payment Release
- Auto-release after delivery confirmation
- Commission deduction
- Settlement to seller wallet/bank
- Transaction receipt generation

#### 15.7 Dispute Resolution
- File dispute at any stage (post-escrow)
- Evidence submission
- Platform mediation
- Resolution: refund buyer OR release to seller
- Appeal mechanism

### Trade Database Tables
- **trade_orders:** Main order record with full state
- **trade_bids:** All bids for a listing
- **trade_timeline:** Event log for each order
- **escrow_transactions:** Financial escrow records

### API Endpoints (Trade)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/trade/listings | Required | Create listing with media |
| GET | /api/trade/listings | Optional | Browse trade listings |
| POST | /api/trade/orders/:id/bid | Required | Place bid |
| POST | /api/trade/orders/:id/accept-bid | Required | Accept bid |
| POST | /api/trade/orders/:id/fund-escrow | Required | Fund escrow |
| POST | /api/trade/orders/:id/verify-quality | Required | Verify quality |
| POST | /api/trade/orders/:id/dispatch | Required | Mark dispatched |
| POST | /api/trade/orders/:id/in-transit | Required | Mark in transit |
| POST | /api/trade/orders/:id/deliver | Required | Confirm delivery |
| POST | /api/trade/orders/:id/release-payment | Required | Release payment |
| POST | /api/trade/orders/:id/dispute | Required | File dispute |
| GET | /api/trade/orders | Required | User's trade orders |
| GET | /api/trade/orders/:id/timeline | Required | Order timeline |

---

## 16. Intelligence & Analytics Module

### Overview
The Intelligence module provides data-driven insights, market analytics, recommendations, and business intelligence to all user roles.

### Features
- Market price analytics (trend, seasonal, YoY)
- Supply-demand gap analysis per district
- Crop recommendation engine
- Buyer purchase pattern analysis
- Revenue forecasting
- Trade completion rate analytics
- User engagement metrics
- District-level agricultural intelligence

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/intelligence/market-analytics | Required | Market insights |
| GET | /api/intelligence/supply-demand | Required | Gap analysis |
| GET | /api/intelligence/recommendations | Required | AI recommendations |
| GET | /api/intelligence/forecasts | Required | Revenue forecasts |

---

## 17. Financial Services Module

### Overview
Comprehensive financial services including digital wallet, trade credit, insurance, bank portal integration, and scheme-linked financing.

### 17.1 Digital Wallet
- Balance management
- Add money (UPI, bank transfer, card)
- Withdraw to bank account
- Transaction history
- Peer-to-peer transfer
- Auto-settlement from trade

### 17.2 Trade Credit
- Net terms (Net 15/30/45/60)
- Credit scoring based on trade history
- Auto-invoicing
- Payment reminders
- Default management
- Interest calculation

### 17.3 Insurance
- Crop insurance (PMFBY integration)
- Aquaculture mortality coverage
- Equipment insurance
- Transit insurance
- Premium calculator
- Claims processing

### 17.4 Bank Portal
- Partner bank integration
- Loan application
- KCC (Kisan Credit Card) digital application
- Credit history building
- EMI management
- Document upload

### 17.5 Escrow Services
- Trade-linked escrow
- Auto-release conditions
- Dispute-triggered holds
- Commission deduction
- Multi-party settlement

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/wallet/balance | Required | Get balance |
| POST | /api/wallet/deposit | Required | Add money |
| POST | /api/wallet/withdraw | Required | Withdraw |
| GET | /api/wallet/transactions | Required | History |
| GET | /api/finance/credit-score | Required | Credit score |
| POST | /api/finance/loans/apply | Required | Loan application |
| GET | /api/escrow/orders | Required | Escrow orders |
| POST | /api/escrow/fund | Required | Fund escrow |

---

## 18. Galaxy Discovery Module

### Overview
AgriGalaxy is the discovery and portfolio engine — think "LinkedIn/Behance for Agriculture." It enables discovery of farmers, aqua farms, suppliers, mandis, exporters, training content, and government schemes.

### Galaxy Verticals
| Galaxy | Portfolio Type | Content |
|--------|---------------|---------|
| Farmer Galaxy | Farmer Profile | Crops, area, certifications, trade history |
| Aqua Galaxy | Aqua Farm | Species, production, certifications |
| Inputs Galaxy | Supplier | Products, pricing, coverage area |
| Livestock Galaxy | Breeder | Animals, breeds, capacity |
| Contracts Galaxy | Contract | Active contracts, terms |
| Exporter Galaxy | Exporter | Markets, commodities, certifications |
| Mandi Galaxy | Mandi | Location, commodities, prices, arrivals |
| Training Galaxy | Course | Modules, duration, language |
| Schemes Galaxy | Scheme | Eligibility, benefits, deadlines |
| Kisan Galaxy | Vehicle/Service | Equipment, availability |
| FPO Galaxy | FPO | Members, turnover, coverage |

### Features
- Public discovery (no auth required for browsing)
- Rich portfolio profiles
- Search across all galaxies
- Filter by location, type, rating
- Contact/inquiry initiation
- Trending entities
- Recently added

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/galaxy/discover | Public | Discover all entities |
| GET | /api/galaxy/farmers | Public | Farmer directory |
| GET | /api/galaxy/aqua | Public | Aqua farm directory |
| GET | /api/galaxy/suppliers | Public | Supplier directory |
| GET | /api/galaxy/mandis | Public | Mandi directory |
| GET | /api/galaxy/exporters | Public | Exporter directory |
| GET | /api/galaxy/training | Public | Training catalog |
| GET | /api/galaxy/schemes | Public | Scheme catalog |
| GET | /api/galaxy/:type/:id | Public | Portfolio detail |

---

## 19. Communication & Community

### 19.1 Chat System
- One-to-one messaging
- Trade-linked conversations
- Group discussions
- Media sharing (photos, docs)
- Read receipts
- Push notifications for new messages

### 19.2 Community Forum
- Topic-based discussions
- Categories: Market Talk, Tech Help, Disease, Weather, Schemes, General
- Post, comment, upvote
- Expert-tagged responses
- Reported content moderation

### 19.3 Notifications
- Multi-channel: Push (Firebase), SMS (MSG91/Fast2SMS), In-app, Email, WhatsApp
- Event-driven notifications:
  - New bid on listing
  - Bid accepted/rejected
  - Payment received
  - Order status change
  - Weather alert
  - Scheme deadline
  - Price alert
  - New message
- Preference management
- Quiet hours support

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/chat/conversations | Required | List conversations |
| POST | /api/chat/messages | Required | Send message |
| GET | /api/chat/messages/:conversationId | Required | Get messages |
| GET | /api/community/posts | Optional | List posts |
| POST | /api/community/posts | Required | Create post |
| POST | /api/community/posts/:id/comment | Required | Comment |
| GET | /api/notifications | Required | List notifications |
| PATCH | /api/notifications/:id/read | Required | Mark read |

---

## 20. Logistics & Delivery

### Overview
End-to-end logistics management from farm gate to buyer location, with cold chain support.

### Features
- **Route Optimization:** Multiple pickup/delivery points
- **Vehicle Types:** Open truck, refrigerated, tempo, bike (last-mile)
- **Real-time Tracking:** GPS-based live location
- **Cold Chain:**
  - Temperature monitoring (IoT sensors)
  - Alert on threshold breach
  - Compliance logging
  - Time-temperature log for export
- **Proof of Delivery:**
  - OTP verification
  - Photo evidence
  - Digital signature
  - Weight confirmation
- **Booking System:**
  - Instant booking
  - Scheduled booking
  - Recurring routes
- **Pricing:**
  - Distance-based
  - Weight-based
  - Type-based (cold chain premium)
  - Surge pricing (peak season)

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/logistics/providers | Optional | Browse providers |
| POST | /api/logistics/book | Required | Book transport |
| GET | /api/logistics/tracking/:id | Required | Track shipment |
| GET | /api/logistics/routes | Required | Available routes |
| PATCH | /api/logistics/orders/:id | Required | Update status |

---

## 21. Government & Compliance

### 21.1 Scheme Discovery
- AI-powered scheme matching based on farmer profile
- All Central + State schemes indexed
- Key schemes:
  - PM-KISAN
  - PMFBY (Crop Insurance)
  - PMMSY (Fisheries)
  - KCC (Kisan Credit Card)
  - Soil Health Card
  - e-NAM registration
  - State-specific subsidies

### 21.2 Compliance Module
- **DPDP (Digital Personal Data Protection):**
  - Consent management
  - Data access requests
  - Right to erasure
  - Privacy policy enforcement
- **KYC:**
  - Aadhaar verification
  - PAN verification
  - Bank account verification
  - Address proof
  - GST verification
- **eNAM Integration:**
  - Market registration
  - Lot creation
  - Price discovery
  - Payment settlement
- **NABARD Compliance:**
  - Credit reporting
  - Priority sector lending data
- **SFAC:**
  - FPO registration
  - Equity grant applications
  - PMFME scheme integration

### 21.3 Export Compliance (AquaOS)
- MPEDA registration and certificate management
- EU compliance (HACCP, traceability)
- FDA (US) prior notice and facility registration
- Lab result management
- Health certificate generation
- Residue testing records
- 12 seeded export requirements

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/scheme-discovery/match | Required | AI scheme matching |
| GET | /api/schemes | Optional | Browse all schemes |
| POST | /api/schemes/:id/apply | Required | Apply for scheme |
| GET | /api/compliance/status | Required | Compliance status |
| POST | /api/kyc/verify | Required | Submit KYC |
| GET | /api/enam/markets | Optional | eNAM markets |
| POST | /api/enam/lots | Required | Create lot |
| GET | /api/government/reports | Admin | Government reports |

---

## 22. AI & Prediction Engine

### Overview
Machine learning and AI capabilities for agricultural decision-making.

### 22.1 Disease Prediction
- Input: water quality parameters, weather, season, species, history
- Output: disease probability, recommended preventive action
- Models for: EHP, WSSV, Vibriosis, Gill disease, Fungal infections

### 22.2 Yield Prediction
- Input: current growth data, environmental factors, feed regime
- Output: expected yield (kg/acre), optimal harvest date
- Von Bertalanffy growth model
- Bio-economic optimization

### 22.3 Feed Optimization
- Input: species, current weight, density, water temp
- Output: daily feed quantity, frequency, type
- FCR optimization
- Cost-efficiency calculation

### 22.4 Price Prediction
- Input: historical prices, season, supply forecasts, demand signals
- Output: 7/14/30 day price forecast
- Confidence intervals
- Price alerts on predicted movements

### 22.5 Crop Planning AI
- Input: soil type, location, season, water availability, market demand
- Output: recommended crops, expected ROI, risk assessment
- Multi-crop rotation planning
- Intercropping suggestions

### 22.6 Crop Doctor
- Image-based disease identification
- Symptom-based diagnosis
- Treatment recommendations
- Preventive measure suggestions
- Expert referral for complex cases

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/ai/predict/disease | Required | Disease prediction |
| POST | /api/ai/predict/yield | Required | Yield forecast |
| POST | /api/ai/predict/feed | Required | Feed optimization |
| POST | /api/ai/predict/price | Required | Price forecast |
| POST | /api/crop-doctor/diagnose | Required | AI diagnosis |
| GET | /api/cropplan/recommendations | Required | Crop planning AI |

---

## 23. Warehouse Management

### Overview
Complete warehouse management system for agricultural commodities.

### Features
- **Warehouse Directory:** Cold storage, dry storage, processing units
- **Booking System:** Reserve space by commodity, duration, quantity
- **Receipt Management:** Generate warehouse receipts (negotiable instruments)
- **Quality Management:**
  - Inbound quality check
  - Periodic quality monitoring
  - Grade maintenance
  - Fumigation records
- **Temperature Monitoring:**
  - IoT-based continuous monitoring
  - Zone-wise temperature tracking
  - Alert on threshold breach
  - Historical logs
- **Billing:**
  - Storage charges (per MT per day)
  - Handling charges
  - Quality testing fees
  - Insurance premiums
  - Auto-invoicing
- **8 Seeded AP Warehouses** (Phase 1)

### Database Tables (migrate-v24-warehouse.js)
- warehouses (7 tables)
- warehouse_bookings
- warehouse_receipts
- warehouse_quality_checks
- warehouse_temperature_logs
- warehouse_billing
- warehouse_inventory

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/warehouse/directory | Optional | Browse warehouses |
| POST | /api/warehouse/bookings | Required | Book space |
| GET | /api/warehouse/receipts | Required | My receipts |
| POST | /api/warehouse/quality-check | Required | Submit quality check |
| GET | /api/warehouse/temperature/:id | Required | Temperature logs |
| GET | /api/warehouse/billing | Required | Billing history |

---

## 24. Payments & Wallet

### Overview
Complete payment infrastructure supporting multiple payment methods and settlement workflows.

### Payment Methods
- UPI (GPay, PhonePe, Paytm)
- Net Banking
- Debit/Credit Card
- Wallet Balance
- Cash on Delivery (COD)
- Bank Transfer (NEFT/RTGS/IMPS)

### Razorpay Integration
- Order creation
- Payment capture
- Webhook handling (payment.captured, payment.failed, refund.processed)
- Payout to sellers via RazorpayX
- Commission calculation and deduction
- Refund management

### Platform Commission
- Default: 1.5% on trade transactions
- Configurable per category/seller tier
- Commission breakdown in settlement report
- GST on commission

### Settlement Flow
```
Buyer Payment → Platform Escrow → Quality Verified → 
  Delivery Confirmed → Commission Deducted → Seller Settlement (T+1/T+2)
```

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/payments/create-order | Required | Create payment order |
| POST | /api/payments/verify | Required | Verify payment |
| POST | /api/payments/webhook | Public | Razorpay webhook |
| GET | /api/payments/history | Required | Payment history |
| POST | /api/payments/refund | Required | Initiate refund |

---

## 25. Notifications & Alerts

### Channels
| Channel | Provider | Use Case |
|---------|----------|----------|
| Push | Firebase FCM | Real-time alerts |
| SMS | MSG91 / Fast2SMS | OTP, critical alerts |
| Email | Resend | Reports, receipts |
| WhatsApp | Meta WABA | Order updates |
| In-App | Internal | All notifications |

### Notification Categories
- **Trade:** Bid received, accepted, payment, delivery
- **Price:** Market price alerts, threshold triggers
- **Weather:** Severe weather warnings
- **Scheme:** New schemes, deadline reminders
- **System:** Maintenance, feature announcements
- **Chat:** New messages
- **IoT:** Sensor threshold alerts (water quality, temperature)
- **Compliance:** KYC reminders, license expiry

### Quiet Hours
- User-configurable silent period
- Emergency override for critical alerts
- Per-category quiet settings

---

## 26. Training & Capacity Building

### Overview
Digital training platform for farmers, fishermen, and rural entrepreneurs.

### Features
- **Content Types:** Video, Audio, Text, Interactive Quiz
- **Languages:** English, Telugu, Hindi, Tamil
- **Partners:** ICAR-CIFA, ASCI, KVKs, State Agricultural Universities
- **Categories:**
  - Aquaculture best practices
  - Organic farming
  - Post-harvest management
  - Market linkages
  - Financial literacy
  - Digital literacy
  - Government scheme navigation
  - Export documentation
- **Progress Tracking:** Module completion, quiz scores
- **Certificates:** Digital certificates on course completion
- **14+ Seeded Modules** (AquaOS V7)

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/training/modules | Optional | Browse modules |
| GET | /api/training/modules/:id | Optional | Module detail |
| POST | /api/training/enroll | Required | Enroll in course |
| POST | /api/training/progress | Required | Update progress |
| GET | /api/training/certificates | Required | My certificates |

---

## 27. Support & Ticketing

### Overview
Customer support system with ticket management, knowledge base, and escalation.

### Features
- **Create Ticket:** Category, priority, description, attachments
- **Categories:** Order Issue, Payment, Technical, Account, Other
- **Priority Levels:** Low, Medium, High, Critical
- **Status Flow:** open → in_progress → waiting_customer → resolved → closed
- **Auto-assignment:** Based on category and agent availability
- **SLA Tracking:**
  - Critical: 4 hour response, 24 hour resolution
  - High: 8 hour response, 48 hour resolution
  - Medium: 24 hour response, 72 hour resolution
  - Low: 48 hour response, 1 week resolution
- **Knowledge Base:** FAQ and help articles
- **Chat Support:** Real-time agent chat

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/tickets | Required | Create ticket |
| GET | /api/tickets | Required | My tickets |
| GET | /api/tickets/:id | Required | Ticket detail |
| POST | /api/tickets/:id/reply | Required | Add reply |
| PATCH | /api/tickets/:id | Required | Update ticket |

---

## 28. Admin Panel

### Overview
Comprehensive administration interface for platform operators.

### Features
- **Dashboard:** Real-time platform metrics (users, GMV, orders, active listings)
- **User Management:**
  - View all users with filters
  - Approve/reject verification requests
  - Ban/suspend accounts
  - Role management
  - Impersonation (for debugging)
- **Trade Monitoring:**
  - Active trades overview
  - Stuck trade detection
  - Manual intervention capability
  - Settlement management
- **Fraud Detection:**
  - Suspicious activity alerts
  - Pattern detection (rapid listing, bid manipulation)
  - Account investigation tools
  - Blocklist management
- **Content Moderation:**
  - Reported content queue
  - Listing quality checks
  - Review authenticity verification
- **Analytics:**
  - Revenue analytics
  - User growth
  - Geographic distribution
  - Crop-wise trade volumes
  - NPS and satisfaction scores
- **System Config:**
  - Feature flag management
  - Commission rate adjustment
  - Rate limit configuration
  - Notification templates

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/admin/dashboard | Admin | Platform metrics |
| GET | /api/admin/users | Admin | User management |
| PATCH | /api/admin/users/:id | Admin | Update user |
| GET | /api/admin/trades | Admin | Trade monitoring |
| GET | /api/admin/fraud-alerts | Admin | Fraud alerts |
| POST | /api/admin/config | Admin | Update config |
| GET | /api/admin/audit-log | Admin | Audit trail |

---

## 29. Subscription & Monetization

### Overview
Tiered subscription model for value-added services.

### Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | Basic listing, search, 5 trades/month |
| Starter | ₹299/month | Unlimited trades, analytics, priority support |
| Professional | ₹999/month | All Starter + AI predictions, export tools, API access |
| Enterprise | Custom | All Professional + dedicated support, custom integrations |

### Revenue Streams
1. **Transaction Commission:** 1.5% on trade GMV
2. **Subscriptions:** Monthly/Annual plans
3. **Promoted Listings:** Boost visibility (pay-per-impression)
4. **Data Services:** Market intelligence reports
5. **Financial Services:** Loan referral fees, insurance commission
6. **Logistics Commission:** Booking fee on transport
7. **Training Premium:** Advanced courses and certifications
8. **API Access:** Third-party integration fees

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/subscriptions/plans | Optional | List plans |
| POST | /api/subscriptions/subscribe | Required | Subscribe |
| GET | /api/subscriptions/current | Required | Current plan |
| POST | /api/subscriptions/cancel | Required | Cancel plan |

---

## 30. Internationalization (i18n)

### Supported Languages
| Code | Language | Script | Coverage |
|------|----------|--------|----------|
| en | English | Latin | 100% |
| te | Telugu | Telugu script | 100% |
| hi | Hindi | Devanagari | 100% |

### Implementation
- Client-side translation system (no external dependency)
- Translation key-value store
- Automatic language detection from user profile
- Language switcher in UI (LanguagePicker component)
- Backend: crop_catalog has name_te, name_hi columns
- Date/number formatting per locale
- RTL support ready (for future Urdu/Arabic)

### Translation Categories
- App Shell (navigation, common actions)
- Authentication (login, OTP)
- AgriFlow (listings, search, trade)
- AquaOS (farm, pond, species, sampling)
- KisanConnect (equipment, booking)
- Notifications
- Errors and validation messages
- Help and onboarding

---

## 31. Mobile & PWA

### Progressive Web App Features
- **Installable:** Add to home screen
- **Offline:** Service worker with cache strategies
- **Push Notifications:** Firebase FCM integration
- **App Shell:** Instant load with cached shell
- **Responsive:** Mobile-first design
- **Lazy Loading:** Images load on scroll

### Offline Capabilities
- Cached listing data for offline browsing
- Queue actions for sync when online:
  - Create listing (with photos stored locally)
  - Submit declarations
  - Update pond data
- Background sync on reconnection
- Offline-first architecture for low-connectivity rural areas

### Performance Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Score | 90+ |
| Bundle Size (initial) | < 200KB |
| API Response (P95) | < 500ms |

---

## 32. Android Native App

### Technology
- **Language:** Kotlin
- **Build:** Gradle (Kotlin DSL)
- **Min SDK:** 21 (Android 5.0)
- **Target SDK:** 34 (Android 14)
- **Architecture:** MVVM + Clean Architecture

### Features (Planned)
- Native performance
- Camera integration (crop photos, QR scanning)
- GPS location services
- Biometric authentication
- Offline data sync
- Background location for logistics
- Voice input (regional languages)
- Push notifications (FCM)

### Build System
```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle.kts
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradlew
└── gradlew.bat
```

---

## 33. API Design & Documentation

### API Standards
- **Base URL:** `/api/` prefix for all endpoints
- **Versioning:** No URL versioning (evolution via modules)
- **Authentication:** Bearer JWT token in Authorization header
- **Response Format:** JSON
- **Error Format:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```
- **Pagination:** `limit` + `offset` query parameters
- **Filtering:** Query parameters per field
- **Sorting:** `sort_by` query parameter

### Error Codes
| Code | HTTP Status | Meaning |
|------|------------|---------|
| VALIDATION_ERROR | 400 | Invalid input |
| AUTH_ERROR | 401 | Not authenticated |
| TOKEN_EXPIRED | 401 | JWT expired |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SMS_FAILED | 503 | SMS delivery failure |

### Health Check Endpoint
```
GET /health

Response:
{
  "status": "ok" | "degraded",
  "service": "AgriHub API",
  "version": "1.0.0",
  "environment": "development" | "production",
  "uptime": <seconds>,
  "db": { "status": "connected", "latencyMs": <ms> },
  "memory": { "rss": <MB>, "heapUsed": <MB> },
  "timestamp": "<ISO 8601>"
}
```

### OpenAPI Documentation
- Auto-generated OpenAPI/Swagger spec
- Available at `/api/openapi`
- Interactive documentation

---

## 34. Third-Party Integrations

### SMS & Communication
| Service | Purpose | Fallback |
|---------|---------|----------|
| MSG91 | OTP delivery | Fast2SMS |
| Fast2SMS | OTP fallback | — |
| Firebase FCM | Push notifications | — |
| Meta WABA | WhatsApp messaging | — |
| Resend | Email delivery | — |

### Payments
| Service | Purpose |
|---------|---------|
| Razorpay | Payment gateway |
| RazorpayX | Payouts/settlements |

### Maps & Location
| Service | Purpose |
|---------|---------|
| Mapbox | Map rendering, geocoding |
| OpenWeatherMap | Weather data |

### Storage & CDN
| Service | Purpose |
|---------|---------|
| Cloudflare R2 | Media/file storage |
| Supabase Storage | Backup storage |

### Data Sources
| Service | Purpose |
|---------|---------|
| data.gov.in | APMC market prices |
| eNAM | National agri market data |
| IMD | India Meteorological Department weather |

### Analytics & Monitoring
| Service | Purpose |
|---------|---------|
| Sentry | Error tracking |
| GrowthBook | Feature flags |
| Pino | Structured logging |

### Authentication
| Service | Purpose |
|---------|---------|
| Supabase Auth | Secondary auth (real-time) |
| JWT (self-hosted) | Primary auth |

### Search
| Service | Purpose |
|---------|---------|
| Meilisearch | Full-text search (future) |
| PostgreSQL GIN | Current text search |

### Translation
| Service | Purpose |
|---------|---------|
| Google Translate API | Dynamic translation |
| LibreTranslate | Self-hosted fallback |

---

## 35. Performance & Scalability

### Backend Performance
- **Connection Pooling:** pg pool with max 20 connections (configurable)
- **Redis Caching:** Frequently accessed data (prices, catalog, districts)
- **Response Compression:** Gzip via compression middleware
- **Database Indexes:** Comprehensive indexing (migrate-v20-indexes.js)
- **Query Optimization:** Specific indexes per access pattern
- **Rate Limiting:** Protect against abuse
- **Structured Logging:** Pino for high-performance logging

### Frontend Performance
- **Vite Build:** Tree-shaking, code splitting
- **Lazy Loading:** Images and heavy modules
- **Service Worker:** Cache-first for static assets
- **Minimal Bundle:** No framework overhead (vanilla JS)
- **Pull-to-Refresh:** Native-like UX
- **Error Boundary:** Graceful error handling

### Scalability Strategy
- **Horizontal:** Multiple API instances behind load balancer
- **Database:** Read replicas for analytics queries
- **Cache:** Redis cluster for distributed caching
- **Queue:** Event-driven for background tasks
- **CDN:** Static assets on Vercel/Netlify edge
- **Microservices Ready:** Modular route structure allows service extraction

### Database Scaling
- **Phase 1:** Single PostgreSQL instance (handles 100K users)
- **Phase 2:** Read replicas + connection pooling (1M users)
- **Phase 3:** Sharding by region/district (10M+ users)
- **Phase 4:** Event sourcing for trade audit trail

---

## 36. Security Requirements

### Authentication Security
- JWT with strong secret (32+ chars, required in production)
- Short OTP validity (10 minutes)
- Rate-limited auth endpoints
- Token refresh mechanism
- Device fingerprinting (planned)
- Brute force protection

### Input Validation & Sanitization
- express-validator for request validation
- Custom sanitize middleware (XSS prevention)
- HPP (HTTP Parameter Pollution) protection
- JSON body size limit (10MB max)
- File upload restrictions

### Infrastructure Security
- Helmet security headers
- Content Security Policy (production)
- CORS restrictions (production)
- No secrets in code (dotenv)
- Docker container isolation
- Health check monitoring

### Data Security
- Passwords hashed (bcryptjs)
- Sensitive data redacted from logs (authorization, cookies)
- Audit trail for all operations
- UUID for all identifiers (no sequential IDs exposed)
- Database access via parameterized queries (SQL injection prevention)

### Fraud Prevention
- Fraud detection service
- Suspicious activity monitoring
- Rate limiting per user
- Account verification requirements
- Trade amount limits for unverified users
- Geo-anomaly detection

---

## 37. Data Privacy & DPDP Compliance

### Digital Personal Data Protection Act (India) Compliance
- **Consent Management:**
  - Explicit consent collection before data processing
  - Purpose limitation
  - Consent withdrawal mechanism
- **Data Access:**
  - User can view all stored personal data
  - Export in machine-readable format
- **Right to Erasure:**
  - Account deletion request
  - Data anonymization
  - 30-day processing window
- **Data Minimization:**
  - Collect only necessary data
  - Auto-purge expired OTPs
  - Retention policies per data type
- **Privacy Controls (AquaOS V9):**
  - Per-field visibility toggles
  - Control over phone, location, production data visibility
  - Granular sharing preferences

### DPDP Middleware
- Request-level privacy enforcement
- Consent verification before data access
- Automated compliance logging
- Privacy impact assessment for new features

---

## 38. Testing Strategy

### Frontend Tests (Vitest)
- **Framework:** Vitest 2.x
- **Test Count:** 16+ tests
- **Coverage Areas:**
  - UI component rendering
  - Error handling
  - Performance utilities
  - State management
- **Run Command:** `npx vitest run`

### Backend Tests (Node.js Test Runner)
- **Framework:** Node.js built-in test runner
- **Test Files:**
  - `backend/tests/trade-flow.test.js` — Trade lifecycle
  - Additional test files
- **Run Command:** `node --test tests/**/*.test.js`

### Test Categories
| Category | Scope |
|----------|-------|
| Unit Tests | Individual functions, utilities |
| Integration Tests | API endpoints, database interactions |
| Trade Flow Tests | End-to-end trade state machine |
| Security Tests | Auth, rate limiting, input validation |
| Performance Tests | Response times, concurrent loads |

### Quality Gates
- All tests must pass before deployment
- Backend syntax check: `node --check src/index.js`
- Frontend build: `npx vite build` (catches import errors)
- No security vulnerabilities in dependencies

---

## 39. Deployment & DevOps

### Deployment Targets
| Environment | Frontend | Backend |
|-------------|----------|---------|
| Development | localhost:3000 (Vite dev) | localhost:4000 (Node) |
| Staging | Vercel Preview | Docker Compose |
| Production | Vercel / Netlify | Docker Compose / Cloud |

### Frontend Deployment
- **Vercel:** Auto-deploy on push, edge network
  - Config: `vercel.json` (rewrites for SPA)
- **Netlify:** Alternative deployment
  - Config: `netlify.toml`
- **Build:** `npm run build` → dist/ folder

### Backend Deployment
- **Docker:**
  - Multi-stage Dockerfile
  - Docker Compose for full stack
  - Health checks configured
  - Volume persistence for data
- **Environment:**
  - `.env` file (never committed)
  - `.env.example` as template
  - Production requires JWT_SECRET

### CI/CD Pipeline
- GitHub-based repository
- Branch strategy: feature → PR → main
- Automated testing on PR
- Preview deployments
- Production deployment on merge to main

### Database Migrations
- Sequential migration scripts
- Idempotent (CREATE IF NOT EXISTS, DO EXCEPTION blocks)
- Run via: `npm run migrate`
- Version tracking in script names

---

## 40. Monitoring & Observability

### Logging
- **Library:** Pino (high-performance structured JSON logging)
- **HTTP Logging:** pino-http (auto-log requests)
- **Redaction:** Authorization headers and cookies
- **Request ID:** UUID attached to every request for tracing
- **Health endpoint excluded** from auto-logging

### Error Tracking
- **Sentry:** Exception capture with context
- **Custom Error Handler:** Centralized error processing
- **Error Categories:** Validation, Authentication, NotFound, Internal

### Health Monitoring
- `/health` endpoint with:
  - Database connectivity and latency
  - Memory usage (RSS, heap)
  - Uptime
  - Environment info
- Docker healthcheck (wget every 30s)
- Service degradation detection

### Metrics (Planned)
- Request rate per endpoint
- Error rate per endpoint
- Database query performance
- Cache hit/miss ratio
- WebSocket connection count
- Active user sessions

---

## 41. Offline Support

### Strategy
- **Cache-First:** Static assets served from service worker cache
- **Network-First:** API calls with fallback to cached data
- **Queue-and-Sync:** Write operations queued when offline

### Offline Capabilities
| Feature | Offline Support |
|---------|----------------|
| Browse listings | ✅ (cached) |
| View prices | ✅ (last fetched) |
| Create listing | ✅ (queued) |
| Send message | ✅ (queued) |
| View notifications | ✅ (cached) |
| Place bid | ❌ (requires real-time) |
| Payment | ❌ (requires connectivity) |

### Implementation
- `offlineCache.js` — IndexedDB-based local storage
- `offline.js` — Network status detection and sync logic
- Service Worker — Request interception and caching
- Background Sync — Auto-submit queued operations

---

## 42. Voice & Accessibility

### Voice Interface
- Voice input for search (regional languages)
- Voice notes on listings (for low-literacy farmers)
- Voice commands for navigation
- Voice-to-text crop declarations
- Text-to-speech for notifications/alerts

### Accessibility
- WCAG 2.1 AA compliance target
- Screen reader compatible
- High contrast mode
- Large text support
- Touch-friendly buttons (minimum 44px)
- Keyboard navigation support
- Alt text for all images
- Semantic HTML structure

### Low-Literacy Design Principles
- Icon-heavy navigation
- Color-coded status indicators
- Emoji/visual crop identification
- Voice-first interactions
- Minimal text input required
- Photo-based product listing

---

## 43. District Pilot Strategy

### Phase 1 — Proof of Concept (4 Districts)
| District | State | Focus |
|----------|-------|-------|
| East Godavari | Andhra Pradesh | Aquaculture (shrimp) |
| West Godavari | Andhra Pradesh | Rice + Aquaculture |
| Krishna | Andhra Pradesh | Mixed agriculture |
| Guntur | Andhra Pradesh | Chilli + Cotton |

### Pilot Metrics
- User acquisition cost (CAC)
- Monthly active users
- Trade GMV
- Repeat trade rate
- NPS score
- Feature adoption rate
- Time to first trade
- Support ticket volume

### Expansion Criteria
- 10,000+ active users in pilot district
- 70%+ monthly retention
- Positive unit economics
- NPS > 40
- Support SLA consistently met

---

## 44. Growth & Scaling Plan

### Year 1 — Foundation
- Launch in 4 AP districts
- Achieve 500K registered users
- ₹10 Cr monthly GMV
- 500 FPOs onboarded
- Core features stable
- Mobile app launched

### Year 2 — Expansion
- Expand to 5 states (AP, TS, TN, KA, MH)
- 5M registered users
- ₹100 Cr monthly GMV
- 3,000 FPOs
- AI features mature
- Financial services live
- Export module operational

### Year 3 — Scale
- Pan-India presence (200+ districts)
- 15M registered users
- ₹500 Cr monthly GMV
- 10,000 FPOs
- International expansion (Bangladesh, Vietnam)
- Platform marketplace (third-party apps)

### Growth Levers
1. **Network Effects:** More farmers → more buyers → better prices → more farmers
2. **FPO Partnerships:** Bulk onboarding through FPO agreements
3. **Government Integration:** Scheme delivery channel
4. **Agent Network:** Field agents for onboarding and support
5. **Referral Program:** Farmer-to-farmer referrals
6. **Content Marketing:** Agricultural knowledge content

---

## 45. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Low internet in rural areas | High | High | Offline-first, SMS fallback, lightweight UI |
| Farmer smartphone adoption | Medium | High | Voice-first, simple UX, field agent support |
| Buyer trust in quality | Medium | High | Escrow, verification, quality grading |
| Regulatory compliance | Medium | Medium | Legal team, DPDP compliance built-in |
| Competition (Agri-apps) | High | Medium | Superior UX, comprehensive features, network effects |
| Payment fraud | Medium | High | Escrow, KYC, fraud detection |
| Weather/natural disasters | High | Medium | Insurance integration, alerts, diversification |
| Data security breach | Low | Critical | Helmet, sanitization, audit, encryption |
| Scaling bottlenecks | Medium | Medium | Horizontal scaling, caching, query optimization |
| Farmer literacy barrier | High | Medium | Voice, icons, vernacular, video onboarding |

---

## Appendix A: Complete API Endpoint Reference

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/send-otp | Public | Send OTP to phone |
| POST | /api/auth/verify-otp | Public | Verify OTP and get token |
| POST | /api/auth/refresh | Public | Refresh access token |
| POST | /api/auth/logout | Required | Invalidate refresh token |
| GET | /api/auth/me | Required | Get current user profile |

### AgriFlow
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/agriflow/listings | Optional | Browse supply listings |
| POST | /api/agriflow/listings | Required | Create listing |
| GET | /api/agriflow/listings/:id | Optional | Listing detail |
| PATCH | /api/agriflow/listings/:id | Required | Update listing |
| DELETE | /api/agriflow/listings/:id | Required | Delete listing |
| POST | /api/agriflow/inquiries | Required | Send inquiry |
| GET | /api/agriflow/inquiries | Required | List inquiries |
| PATCH | /api/agriflow/inquiries/:id | Required | Respond to inquiry |

### AquaOS (V1)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/aquaos/farms | Required | List farms |
| POST | /api/aquaos/farms | Required | Create farm |
| PATCH | /api/aquaos/farms/:id | Required | Update farm |
| GET | /api/aquaos/ponds | Required | List ponds |
| POST | /api/aquaos/ponds | Required | Create pond |
| PATCH | /api/aquaos/ponds/:id | Required | Update pond |
| POST | /api/aquaos/sampling | Required | Record sampling |
| GET | /api/aquaos/growth/:pondId | Required | Growth data |

### AquaOS V2-V11 (Extended)
| Route Prefix | Module |
|-------------|--------|
| /api/aquaos-v2/* | Finance, Disease, Auctions, Cold Chain, Training, Schemes |
| /api/aquaos-v3/* | RFQ, Escrow, Yield Forecast, Community, Onboarding |
| /api/aquaos-v4/* | Culture Units, Production Cycles, Harvest Optimizer, IoT, Trust |
| /api/aquaos-v5/* | KPIs, Predictions, Supply Marketplace, Alerts |
| /api/aquaos-v6/* | Fish Marketplace, Cold Chain+, Traceability, PMMSY DPR, Suppliers |
| /api/aquaos-v7/* | Reviews, Logistics+, Training, ODR, Trade Credit, VMS |
| /api/aquaos-v8/* | Role-Based, Crop Posts, Community, Supply Forecast, Leads |
| /api/aquaos-v9/* | Privacy, Admin, Negotiation, Insights, Security |
| /api/aquaos-v10/* | Analytics, Search, Payments, Pricing, Chat, AI, IoT |
| /api/aquaos-v11/* | Contracts, Labor, Insurance, Export, Portfolio, Supply Chain |

### KisanConnect
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/kisanconnect/equipment | Optional | List equipment |
| POST | /api/kisanconnect/equipment | Required | Register equipment |
| POST | /api/kisanconnect/equipment/:id/book | Required | Book equipment |
| GET | /api/vehicles/* | Required | Vehicle management |
| POST | /api/transport/* | Required | Transport services |
| GET | /api/delivery/* | Required | Delivery management |
| GET | /api/gigworkers/* | Required | Gig worker marketplace |

### FarmerConnect
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/farmerconnect/properties | Optional | Browse properties |
| POST | /api/farmerconnect/properties | Required | List property |
| GET | /api/farmerconnect/properties/:id | Optional | Property detail |

### Trade
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/trade/listings | Required | Create trade listing |
| GET | /api/trade/listings | Optional | Browse trade listings |
| POST | /api/trade/orders/:id/bid | Required | Place bid |
| POST | /api/trade/orders/:id/accept-bid | Required | Accept bid |
| POST | /api/trade/orders/:id/fund-escrow | Required | Fund escrow |
| POST | /api/trade/orders/:id/verify-quality | Required | Quality verification |
| POST | /api/trade/orders/:id/dispatch | Required | Dispatch |
| POST | /api/trade/orders/:id/in-transit | Required | In transit |
| POST | /api/trade/orders/:id/deliver | Required | Deliver |
| POST | /api/trade/orders/:id/release-payment | Required | Release payment |
| POST | /api/trade/orders/:id/dispute | Required | File dispute |

### Galaxy (Public Discovery)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/galaxy/* | Public | All discovery endpoints |

### Platform Services
| Route Prefix | Module |
|-------------|--------|
| /api/weather/* | Weather data & forecasts |
| /api/intelligence/* | Market analytics |
| /api/community/* | Forum & discussions |
| /api/chat/* | Messaging |
| /api/notifications/* | Push notifications |
| /api/wallet/* | Digital wallet |
| /api/payments/* | Payment processing |
| /api/escrow/* | Escrow management |
| /api/finance/* | Financial services |
| /api/schemes/* | Government schemes |
| /api/scheme-discovery/* | AI scheme matching |
| /api/training/* | Training modules |
| /api/crop-doctor/* | AI crop diagnosis |
| /api/tickets/* | Support tickets |
| /api/subscriptions/* | Subscription plans |
| /api/watchlists/* | Price watchlists |
| /api/favorites/* | User favorites |
| /api/reviews/* | Ratings & reviews |
| /api/upload/* | File upload |
| /api/translate/* | Translation service |
| /api/tracking/* | Order tracking |
| /api/orders/* | Order management |
| /api/admin/* | Admin panel |
| /api/settings/* | User settings |
| /api/verification/* | Identity verification |
| /api/cart/* | Shopping cart |
| /api/seller/* | Seller management |
| /api/livestock/* | Livestock marketplace |
| /api/booking/* | Booking services |
| /api/logistics/* | Logistics management |
| /api/inputs/* | Agri inputs |
| /api/cropplan/* | Crop planning |
| /api/onboarding/* | User onboarding |
| /api/contracts/* | Contract management |
| /api/trustscore/* | Trust scoring |
| /api/satellite/* | Satellite data |
| /api/agents/* | Agent management |
| /api/bankportal/* | Bank integration |
| /api/government/* | Government portal |
| /api/exporter/* | Exporter services |
| /api/execution/* | Execution network |
| /api/farmdiary/* | Farm diary |
| /api/jobs/* | Job marketplace |
| /api/compliance/* | Compliance |
| /api/kyc/* | KYC verification |
| /api/ai/* | AI predictions |
| /api/enam/* | eNAM integration |
| /api/warehouse/* | Warehouse management |
| /api/bhoomios/* | Land management |
| /api/openapi/* | API documentation |
| /api/health/* | Extended health checks |

---

## Appendix B: Database Tables Reference

### Foundation (migrate.js)
- users, otps, refresh_tokens, crop_catalog, districts, declarations, supply_listings, inquiries, price_feeds, ponds, equipment

### V2 (migrate-v2.js)
- notifications, conversations, messages, reviews, favorites, watchlists, tickets, ticket_replies

### V3 Trade (migrate-v3-trade.js)
- trade_orders, trade_bids, trade_timeline, escrow_transactions

### V4 Infrastructure (migrate-v4-infrastructure.js)
- contracts, trust_scores, satellite_data, logistics_routes, logistics_bookings

### V5 Platform (migrate-v5-platform.js)
- wallets, wallet_transactions, subscriptions, subscription_plans, analytics_events, agents, fpo_members, fpo_collections

### V6 AgriOS (migrate-v6-agrios.js)
- crop_doctor_diagnoses, farm_diary_entries, farm_diary_tasks, input_products, input_orders

### V6 FarmerSon (migrate-v6-farmerson.js)
- verifications, cart_items, seller_profiles, livestock_listings, livestock_bookings, fraud_reports

### V7 Intelligence (migrate-v7-intelligence.js)
- market_analytics, demand_signals, recommendations, prediction_models

### V8 Finance (migrate-v8-finance.js)
- loan_applications, insurance_policies, bank_accounts, credit_scores

### V9 Ecosystem (migrate-v9-ecosystem.js)
- execution_orders, demand_engine_signals, hyperlocal_listings, voice_commands

### V10 ROS (migrate-v10-ros.js)
- vehicles, transport_routes, transport_bookings, delivery_orders, gig_workers, gig_jobs, gig_matches

### V11 AquaOS V2 (migrate-v11-aquaos.js)
- aqua_financials, aqua_diseases, aqua_auctions, aqua_cold_chain, aqua_training, aqua_schemes

### V12 AquaOS RFQ (migrate-v12-aquaos-rfq.js)
- aqua_rfqs, aqua_rfq_responses, aqua_escrow, aqua_yield_forecasts, aqua_community_posts, aqua_onboarding

### V13 AquaOS V4 (migrate-v13-aquaos-v4.js)
- culture_units, production_cycles, harvest_plans, iot_devices, iot_readings, trust_verifications, per_acre_analytics

### V14 AquaOS V5 (migrate-v14-aquaos-v5.js)
- kpi_records, growth_predictions, supply_marketplace_products, supply_marketplace_orders, alert_rules, alert_history

### V15 AquaOS V6 (migrate-v15-aquaos-v6.js)
- fish_listings, fish_auctions, fish_bids, buyer_profiles, cold_chain_shipments, traceability_records, pmmsy_dprs, national_suppliers

### V16 AquaOS V7 (migrate-v16-aquaos-v7.js)
- seller_reviews, logistics_providers, logistics_bookings_v7, odr_disputes, trade_credit_accounts, trade_credit_invoices, training_modules, training_progress, vessel_tracking

### V17 AquaOS V8 (migrate-v17-aquaos-v8.js)
- crop_posts, crop_offers, community_discussions, market_prices_v8, supply_forecasts, supplier_promotions, sales_leads, expert_directory, workflow_tracking, platform_analytics, visibility_rules

### V18 AquaOS V9 (migrate-v18-aquaos-v9.js)
- privacy_settings, negotiation_rooms, negotiation_messages, notification_preferences, production_insights, admin_analytics, admin_verifications, fraud_alerts, audit_log

### V19 AquaOS V10 (migrate-v19-aquaos-v10.js)
- analytics_snapshots, search_indexes, payment_orders, payment_settlements, market_prices_v10, price_forecasts, chat_rooms_v10, chat_messages_v10, ai_predictions, growth_metrics, iot_sensors, iot_data, monetization_config

### V20 Indexes (migrate-v20-indexes.js)
- Performance indexes across all tables

### V21 Galaxy (migrate-v21-galaxy.js)
- galaxy_entities, galaxy_portfolios, galaxy_reviews, galaxy_search_index

### V22 Platform Readiness (migrate-v22-platform-readiness.js)
- dpdp_consents, kyc_records, ai_model_versions, enam_registrations, nabard_reports, sfac_applications

### V23 AquaOS V11 (migrate-v23-aquaos-v11.js)
- aqua_contracts, aqua_contract_milestones, labor_records, labor_attendance, insurance_products, insurance_policies, insurance_claims, export_certificates, export_lab_results, farm_portfolios, aqua_input_orders, harvest_schedules (+ 5 insurance products + 12 export requirements + 8 input suppliers seeded)

### V24 Warehouse (migrate-v24-warehouse.js)
- warehouses, warehouse_bookings, warehouse_receipts, warehouse_quality_checks, warehouse_temperature_logs, warehouse_billing, warehouse_inventory (+ 8 AP warehouses seeded)

---

## Appendix C: Frontend Screen Inventory

### Bottom Navigation Screens (Role-Based)
| Screen | Route Key | Icon | Description |
|--------|-----------|------|-------------|
| Home | home | 🏠 | Main dashboard with quick actions |
| AgriGalaxy | agrigalaxy | 🌐 | Discovery portal |
| AquaOS | aquaos | 🐟 | Aquaculture OS |
| Agri | agri | 🌾 | Agriculture umbrella (AgriFlow + Weather + Intelligence) |
| Kisan | kisan | 🚜 | KisanConnect rural OS |
| Bhoomi | bhoomios | 🏡 | Land management |
| Profile | profile | 👤 | User profile & settings |
| Community | community | 💬 | Discussions & forum |

### Sub-Screens (73+ Total)
| Screen | Parent | Function |
|--------|--------|----------|
| LoginScreen | — | Phone OTP authentication |
| HomeScreen | nav | Role-based dashboard |
| AgriFlowScreen | agri | Crop marketplace |
| AquaOSScreen | nav | Aquaculture management (tabbed: all V1-V11 features) |
| KisanConnectScreen | nav | Equipment, transport, delivery |
| FarmerConnectScreen | home | Property marketplace |
| BhoomiOSScreen | nav | Land records |
| IntelligenceScreen | agri | Market analytics |
| WeatherScreen | agri | Weather forecast |
| ProfileScreen | nav | User profile |
| CommunityScreen | nav | Forum |
| NotificationsScreen | profile | Alerts & notifications |
| OrdersScreen | profile | Order history |
| ChatScreen | home | Messaging |
| AdminScreen | profile | Admin panel |
| FarmDiaryScreen | home | Crop diary & tasks |
| SchemesScreen | home | Government schemes |
| JobsScreen | home | Agricultural jobs |
| TrainingScreen | home | Learning modules |
| WalletScreen | profile | Digital wallet |
| SchemeDiscoveryScreen | home | AI scheme matching |
| CropDoctorScreen | home | AI crop diagnosis |
| SubscriptionsScreen | profile | Plans & billing |
| FavoritesScreen | profile | Saved items |
| TicketsScreen | profile | Support tickets |
| EscrowScreen | orders | Escrow details |
| WatchlistsScreen | home | Price watchlists |
| CartScreen | home | Shopping cart |
| LivestockScreen | agriflow | Livestock marketplace |
| LogisticsScreen | home | Logistics & transport |
| InputsScreen | home | Agricultural inputs |
| CropPlanningScreen | farmdiary | AI crop planning |
| ContractScreen | home | Contract management |
| TrustScoreScreen | profile | Trust & verification |
| SatelliteScreen | farmdiary | Satellite monitoring |
| FinanceScreen | home | Financial services |
| AgentDashboardScreen | home | Agent management |
| ExporterScreen | home | Export services |
| AnalyticsScreen | home | Business analytics |
| ExecutionNetworkScreen | home | Trade execution |
| DemandEngineScreen | home | Demand signals |
| HyperlocalScreen | home | Local market |
| VoiceAssistScreen | home | Voice interface |
| CropLifecycleScreen | home | Crop lifecycle tracking |
| ToolsHubScreen | home | Utility tools |
| DistrictPilotScreen | home | District metrics |
| TradeOrdersScreen | agriflow | Trade order management |
| VehiclesScreen | kisan | Vehicle management |
| DeliveryScreen | kisan | Delivery tracking |
| GigWorkersScreen | kisan | Gig worker marketplace |
| FPODashboardScreen | home | FPO management hub |
| ComplianceScreen | profile | Compliance status |
| ArchitectureScreen | home | Platform architecture map |

### Galaxy Screens
| Screen | Portfolio |
|--------|-----------|
| FarmerGalaxyScreen | Farmer directory |
| FarmerPortfolioScreen | Farmer profile detail |
| AquaGalaxyScreen | Aqua farm directory |
| AquaPortfolioScreen | Aqua farm detail |
| InputsGalaxyScreen | Supplier directory |
| InputsPortfolioScreen | Supplier detail |
| LivestockGalaxyScreen | Livestock directory |
| LivestockPortfolioScreen | Breeder detail |
| ContractsGalaxyScreen | Contract directory |
| ExporterGalaxyScreen | Exporter directory |
| MandiGalaxyScreen | Mandi directory |
| MandiPortfolioScreen | Mandi detail |
| TrainingGalaxyScreen | Course catalog |
| SchemesGalaxyScreen | Scheme catalog |
| KisanGalaxyScreen | Service directory |
| FPOGalaxyScreen | FPO directory |
| FPOPortfolioScreen | FPO detail |

---

## Appendix D: Environment Variables

### Required (Production)
| Variable | Description |
|----------|-------------|
| JWT_SECRET | JWT signing secret (32+ chars) |
| POSTGRES_HOST | Database host |
| POSTGRES_PORT | Database port |
| POSTGRES_DB | Database name |
| POSTGRES_USER | Database user |
| POSTGRES_PASSWORD | Database password |
| CORS_ORIGIN | Allowed CORS origins (comma-separated) |

### Optional (All Environments)
| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment |
| PORT | 4000 | API port |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| DB_POOL_MAX | 20 | Max DB connections |
| DB_RETRY_ATTEMPTS | 5 | DB connection retries |
| DB_RETRY_DELAY | 3000 | Retry delay (ms) |
| JWT_EXPIRY | 7d | Token expiry |
| REFRESH_TOKEN_EXPIRY | 2592000 | Refresh token (seconds) |

### Third-Party Services
| Variable | Service |
|----------|---------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon key |
| MSG91_AUTH_KEY | MSG91 SMS |
| MSG91_TEMPLATE_ID | MSG91 template |
| FAST2SMS_API_KEY | Fast2SMS fallback |
| RAZORPAY_KEY_ID | Razorpay payments |
| RAZORPAY_KEY_SECRET | Razorpay secret |
| RAZORPAY_WEBHOOK_SECRET | Webhook verification |
| PLATFORM_COMMISSION_RATE | Commission (default 0.03) |
| RESEND_API_KEY | Email service |
| FIREBASE_PROJECT_ID | Push notifications |
| FIREBASE_SERVER_KEY | FCM server key |
| WHATSAPP_PHONE_NUMBER_ID | WhatsApp WABA |
| WHATSAPP_ACCESS_TOKEN | WhatsApp token |
| MEILISEARCH_HOST | Search engine |
| MEILISEARCH_API_KEY | Search key |
| R2_ACCESS_KEY_ID | Cloudflare R2 storage |
| R2_SECRET_ACCESS_KEY | R2 secret |
| R2_BUCKET_NAME | R2 bucket |
| R2_ENDPOINT | R2 endpoint |
| R2_PUBLIC_URL | Public media URL |
| OPENWEATHERMAP_API_KEY | Weather data |
| MAPBOX_ACCESS_TOKEN | Maps |
| GROWTHBOOK_API_HOST | Feature flags |
| GROWTHBOOK_CLIENT_KEY | Feature flag key |
| SENTRY_DSN | Error monitoring |
| GOOGLE_TRANSLATE_KEY | Translation |
| DATA_GOV_API_KEY | Government data |
| ENAM_API_KEY | eNAM market data |

---

## Appendix E: Seed Data & Defaults

### Seeded Data Summary
| Category | Count | Source |
|----------|-------|--------|
| AP Market Prices (AquaOS V8) | 14 species × markets | migrate-v17 |
| Expert Directory | 5 experts | migrate-v17 |
| Supply Forecasts | 7 forecasts | migrate-v17 |
| Community Posts | 5 posts | migrate-v17 |
| Visibility Rules | 10 rules | migrate-v17 |
| Logistics Providers | 10 providers | migrate-v16 |
| Training Modules | 14 modules (4 languages) | migrate-v16 |
| National Suppliers | 27 suppliers | migrate-v15 |
| Production Insights | 20 records | migrate-v18 |
| Platform Analytics | 1 snapshot | migrate-v18 |
| Insurance Products | 5 products | migrate-v23 |
| Export Requirements | 12 requirements | migrate-v23 |
| Input Suppliers | 8 suppliers | migrate-v23 |
| AP Warehouses | 8 warehouses | migrate-v24 |

### Default Configuration
| Setting | Default |
|---------|---------|
| Platform Commission | 1.5% (trade), 3% (configurable) |
| OTP Validity | 10 minutes |
| JWT Expiry | 7 days |
| Refresh Token | 30 days |
| Global Rate Limit | Configurable |
| Max Upload Size | 10 MB |
| Pagination Default | 20 items |
| Sampling Interval | 10 days |

### Species Price Reference (₹/kg)
| Species | Price |
|---------|-------|
| Vannamei | 350 |
| Shrimp | 350 |
| Tiger | 600 |
| Crab | 500 |
| Pangasius | 95 |
| Default | 160 |

---

## Document End

**Prepared by:** AgriHub Engineering Team  
**Document Status:** Living Document — Updated with each major release  
**Next Review:** Upon completion of Phase 2 expansion  

---

*This document covers the complete end-to-end requirements for the AgriHub platform. Every module, API endpoint, database table, screen, integration, and operational requirement is documented here. For implementation details, refer to the source code and inline documentation.*
