<div align="center">

<!-- Header Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=300&section=header&text=%F0%9F%8C%BE%20AgriHub&fontSize=90&fontColor=fff&animation=fadeIn&fontAlignY=38&desc=India%27s%20Agriculture%20Operating%20System&descAlignY=55&descAlign=50&descSize=24" width="100%"/>

<br/>

<!-- Badges Row 1 -->
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

<br/>

<!-- Badges Row 2 -->
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Android](https://img.shields.io/badge/Android-Kotlin-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)

<br/><br/>

> **A unified Agriculture Operating System connecting 145M+ farmers, 10,000+ FPOs, traders, exporters, input suppliers, banks, and logistics providers on ONE digital platform.**

<br/>

<!-- Hero Stats -->
<table>
<tr>
<td align="center"><strong>145M+</strong><br/><sub>Target Farmers</sub></td>
<td align="center"><strong>10,000+</strong><br/><sub>FPOs</sub></td>
<td align="center"><strong>73+</strong><br/><sub>Feature Screens</sub></td>
<td align="center"><strong>76+</strong><br/><sub>API Routes</sub></td>
<td align="center"><strong>3</strong><br/><sub>Languages</sub></td>
<td align="center"><strong>6</strong><br/><sub>User Roles</sub></td>
</tr>
</table>

</div>

---

<details>
<summary><h2>Table of Contents</h2></summary>

- [Overview](#-agrihub--overview)
- [Vision & Mission](#-vision--mission)
- [System Architecture](#-system-architecture)
- [Platform Modules](#-platform-modules)
- [Frontend — Progressive Web App](#-frontend--progressive-web-app)
- [Backend — REST API & WebSocket](#-backend--rest-api--websocket)
- [Trade Engine — State Machine](#-trade-engine--state-machine)
- [KisanConnect 2.0 — Rural Operating System](#-kisanconnect-20--rural-operating-system)
- [AquaOS V11 — Contract & Supply Chain](#-aquaos-v11--contract--supply-chain)
- [Warehouse Management System](#-warehouse-management-system)
- [Galaxy Discovery Module](#-galaxy-discovery-module)
- [Platform Readiness — Compliance & KYC](#-platform-readiness--compliance--kyc)
- [Database Architecture](#-database-architecture)
- [Native Android App](#-native-android-app)
- [Role-Based Access Control](#-role-based-access-control)
- [Internationalization (i18n)](#-internationalization-i18n)
- [Security & Authentication](#-security--authentication)
- [Payments & Finance](#-payments--finance)
- [Integrations & Third-Party Services](#-integrations--third-party-services)
- [Testing Strategy](#-testing-strategy)
- [Docker & DevOps](#-docker--devops)
- [Deployment](#-deployment)
- [Quick Start Guide](#-quick-start-guide)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [API Documentation](#-api-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

</details>

---

## Overview

<div align="center">

```
+-------------------------------------------------------------------------+
|                                                                         |
|                    AGRIHUB - AGRICULTURE OPERATING SYSTEM                |
|                                                                         |
|    +-----------+  +-----------+  +-----------+  +-----------+           |
|    | AgriFlow  |  |  AquaOS   |  |   Kisan   |  | BhoomiOS  |          |
|    | Trade &   |  | Aquacul-  |  |  Connect  |  | Land &    |          |
|    | Commerce  |  |  ture     |  |  Rural    |  | Assets    |          |
|    +-----------+  +-----------+  +-----------+  +-----------+           |
|          |              |             |              |                   |
|    ------+--------------+-------------+--------------+------            |
|                                |                                        |
|              +----------------+----------------+                        |
|              |    Intelligence Engine (AI/ML)   |                        |
|              +---------------------------------+                         |
|                                                                         |
+-------------------------------------------------------------------------+
```

</div>

**AgriHub** is a **full-stack, multi-platform Agriculture Super-App** designed to revolutionize India's agriculture ecosystem. It consolidates **5 major sub-platforms** into one unified experience, serving every stakeholder in the agricultural value chain.

### The Problem We Solve

| Challenge | Impact | AgriHub Solution |
|-----------|--------|-----------------|
| **Fragmentation** | Farmers use 5-6 disconnected apps | Single unified platform |
| **Information Asymmetry** | 40% post-harvest loss | Real-time price intelligence |
| **Financial Exclusion** | 47% farmers lack formal credit | In-app credit scoring & finance |
| **Supply Chain Gaps** | 25-40% produce wasted in transit | Integrated logistics tracking |
| **Digital Divide** | Low tech literacy in rural areas | Multi-language, voice-first UX |
| **Scheme Unawareness** | Rs.2L cr govt schemes unclaimed | AI-powered scheme discovery |

---

## Vision & Mission

<div align="center">

| | |
|:---:|:---|
| **Vision** | India's de-facto Agriculture Operating System where every agricultural transaction, decision, and relationship flows through a single intelligent platform |
| **Mission** | Empower 145M+ Indian farmers with technology that increases income by 3x, reduces waste by 60%, and creates a transparent agricultural ecosystem |
| **Strategy** | Platform evolution: **Selling Platform** -> **Intelligence + Execution** -> **Complete Agriculture OS** |

</div>

### Key Differentiators

- First unified platform connecting ALL agricultural stakeholders
- AI-powered intelligence (crop planning, price forecasting, demand analysis)
- Escrow-based trust system for secure transactions
- Satellite + IoT integration for precision farming
- Embedded finance (credit, insurance, digital wallet)
- Multi-language voice-first rural UX
- Offline-first Progressive Web App
- Role-based ecosystem (6 roles, one platform)

---

## System Architecture

### High-Level Architecture

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                                |
+-------------------------------------------------------------------------+
|                                                                         |
|  +------------------+   +------------------+   +------------------+     |
|  |   PWA (Vite)     |   |  Android (Kt)    |   |  Admin Panel     |    |
|  |  Vanilla JS      |   |  Jetpack Compose  |   |  (Web Dashboard) |   |
|  |  Mobile-First    |   |  Material3        |   |  Analytics View  |   |
|  +--------+---------+   +--------+---------+   +--------+---------+    |
|           |                      |                      |               |
+-----------+----------------------+----------------------+---------------+
            |                      |                      |
            v                      v                      v
+-------------------------------------------------------------------------+
|                              API GATEWAY                                 |
+-------------------------------------------------------------------------+
|  Express.js 4.x | Rate Limiting | Helmet | CORS | JWT Auth | Sanitize  |
+-------------------------------------------------------------------------+
            |
            v
+-------------------------------------------------------------------------+
|                           SERVICE LAYER                                  |
+-------------------------------------------------------------------------+
|                                                                         |
|  +----------+ +----------+ +----------+ +----------+ +----------+      |
|  |   Auth   | |  Trading | |  Intel   | | Finance  | | Logistics|      |
|  | Service  | |  Engine  | |  Engine  | |  Engine  | | Tracking |      |
|  +----------+ +----------+ +----------+ +----------+ +----------+      |
|                                                                         |
|  +----------+ +----------+ +----------+ +----------+ +----------+      |
|  | Weather  | |Community | |   Chat   | |   APMC   | |  Schemes |      |
|  | Service  | | & Social | | WebSocket| | Mandi API| | Discovery|      |
|  +----------+ +----------+ +----------+ +----------+ +----------+      |
|                                                                         |
+-------------------------------------------------------------------------+
            |                         |                         |
            v                         v                         v
+-------------------+   +------------------+   +---------------------------+
|  PostgreSQL 15    |   |  Redis 7         |   |  External Services        |
|  (Primary DB)     |   |  (Cache/Queue)   |   |  Supabase / Razorpay     |
|  9 Migration Sets |   |  Session Store   |   |  MSG91 / Mapbox          |
|  Full ACID        |   |  Rate Limiting   |   |  Firebase / OpenWeather  |
+-------------------+   +------------------+   |  Sentry / CloudflareR2   |
                                                +---------------------------+
```

### Communication Patterns

| Pattern | Technology | Use Case |
|---------|-----------|----------|
| **REST API** | Express.js + JSON | Primary client-server communication |
| **WebSocket** | `ws` library | Real-time chat, live price updates, notifications |
| **Event Queue** | Redis Pub/Sub | Background jobs, notification dispatch |
| **Scheduled Tasks** | Node.js Scheduler | Price sync, weather updates, scheme matching |

---

## Platform Modules

AgriHub is composed of **5 major sub-platforms** plus cross-cutting services:

### AgriFlow — Agricultural Trade & Commerce

```
+----------------------------------------------------------------------+
|                        AGRIFLOW                                        |
|              Agricultural Trade & Commerce Engine                      |
+----------------------------------------------------------------------+
|                                                                      |
|  Supply Listings      |  Create, browse, trade crop listings         |
|  Farmer Declarations  |  Declare harvest (yield, grade, dates)       |
|  Buyer Inquiries      |  Buyer demand matching                       |
|  APMC Mandi Prices    |  Real-time market price integration          |
|  Contracts            |  Digital contract farming agreements          |
|  Escrow               |  Secure payment holding until delivery       |
|  Logistics            |  Transport booking & tracking                |
|  Price Discovery      |  AI-driven price recommendations             |
|                                                                      |
+----------------------------------------------------------------------+
```

### AquaOS — Complete Aquaculture Operating System (V1–V11)

```
+══════════════════════════════════════════════════════════════════════════+
║                            AQUA OS                                      ║
║          India's First Complete Aquaculture Digital Ecosystem            ║
║                        11 Versions • 130+ Tables • 400+ API Endpoints   ║
+══════════════════════════════════════════════════════════════════════════+
```

AquaOS is a **standalone aquaculture operating system** covering the entire value chain — from pond setup to harvest sale, input procurement to AI-powered advisory, financial tracking to cold chain logistics.

---

#### 🐟 V1 — Farm OS Core (`/api/aquaos`)

| Module | Features |
|--------|----------|
| **Pond Management** | Register/manage ponds with area, depth, water source, GPS location |
| **Species Catalog** | Multi-species tracking (Vannamei Shrimp, Rohu, Pangasius, Tiger Shrimp, Catla, Tilapia) |
| **Feed Tracking** | Daily feed logs, brand tracking, FCR calculation |
| **Water Quality** | pH, DO, temperature, ammonia, salinity logging |
| **Harvest Recording** | Harvest weight, size, price, buyer assignment |
| **Market Prices** | Live prices for Nellore, Bhimavaram, Kakinada, Ongole markets |
| **Advisory** | Species-specific stocking density, feed schedules, water parameters |
| **Dashboard** | Real-time farm KPIs — stocking, mortality, growth rates |

---

#### 💰 V2 — Financial & Operations Layer (`/api/aquaos-v2`)

| Module | Features |
|--------|----------|
| **Financial Tracking** | Income/expense logs, pond-level P&L, ROI calculation |
| **Disease Reports** | Disease logging with symptoms, diagnosis, treatment, mortality |
| **PMMSY Schemes** | Pradhan Mantri Matsya Sampada Yojana scheme discovery & eligibility |
| **Cold Chain Logistics** | Temperature-monitored transport with IoT tracking |
| **Training Hub** | Video courses, certifications for aquaculture best practices |
| **Live Auctions** | Real-time bidding system for harvests |
| **Benchmarks** | Compare farm performance against regional averages |
| **Bulk Orders** | Aggregated input procurement with volume discounts |
| **KPI Engine** | SGR (Specific Growth Rate), ADG, FCR, survival rate computation |

---

#### 📋 V3 — RFQ & Marketplace (`/api/aquaos-v3`)

| Module | Features |
|--------|----------|
| **RFQ System** | Request for Quotation — buyers post requirements, farmers respond |
| **Escrow Payments** | Secure payment holding until delivery confirmation |
| **Yield Forecasting** | Von Bertalanffy growth model predicting harvest dates & weights |
| **Aqua Community** | Farmer-to-farmer knowledge posts, Q&A, expert answers |
| **Farmer Onboarding** | Step-by-step onboarding wizard with document verification |
| **Regional Analytics** | District-level production volumes, price trends, disease patterns |

---

#### 🏗️ V4 — Infrastructure & Optimization (`/api/aquaos-v4`)

| Module | Features |
|--------|----------|
| **Culture Units** | Pond / RAS / Cage / Biofloc / Hatchery unit management |
| **Production Cycles** | Full lifecycle tracking: stocking → growth → harvest |
| **Multi-Species Config** | Polyculture support with species-specific parameters |
| **Harvest Optimizer** | Price-size optimization — when to harvest for max profit |
| **IoT Device Management** | Water sensors, aerators, auto-feeders with threshold alerts |
| **Trust Verification** | GST / FSSAI / MPEDA registration verification |
| **Per-Acre Analytics** | Productivity per acre, input cost per acre, yield per acre |
| **Farm KPIs** | Comprehensive dashboard with all key metrics |

---

#### 📊 V5 — Predictive Intelligence (`/api/aquaos-v5`)

| Module | Features |
|--------|----------|
| **Advanced KPI Engine** | Interval-based SGR/ADG/FCR with temporal trends |
| **Von Bertalanffy Model** | Predictive growth curves with bio-economic optimization |
| **Rule-Based Alert Engine** | Configurable thresholds: water quality / growth / mortality / feed |
| **B2B Supply Marketplace** | Supplier directory, product catalog, order placement, reviews |

---

#### 🐠 V6 — Fish Marketplace & Compliance (`/api/aquaos-v6`)

| Module | Features |
|--------|----------|
| **Fish Marketplace** | Auction / RFQ / Fixed-price listing modes |
| **Buyer Profiles** | Wholesaler / Restaurant / Exporter / Processor categorization |
| **Quality Grading** | BIS (Bureau of Indian Standards) grading system |
| **Cold Chain+ Logistics** | Real-time temperature monitoring with IoT sensors |
| **Farm-to-Fork Traceability** | QR code / Blockchain / Critical Tracking Events (CTEs) |
| **PMMSY DPR Builder** | Auto-generate Detailed Project Report with subsidy calculation |
| **National Supplier Directory** | 27+ seeded input suppliers with product catalogs |

---

#### ⭐ V7 — Trust, Logistics & Training (`/api/aquaos-v7`)

| Module | Features |
|--------|----------|
| **Verified Seller Reviews** | Star ratings + performance badges (Gold/Silver/Bronze) |
| **Logistics+ Directory** | 10+ logistics providers with booking, route optimization |
| **IoT Temperature Monitoring** | Real-time cold chain temperature during transit |
| **Online Dispute Resolution** | 3-tier escalation: P2P → Mediator → Platform arbitration |
| **Trade Credit** | Net-30/Net-60 invoicing with credit scoring |
| **Training Curriculum** | 14+ modules from ICAR-CIFA/ASCI in EN/TE/HI/TA languages |
| **Vessel Monitoring (VMS)** | IUU compliance tracking for fishing boats |

---

#### 🌐 V8 — Role-Based Ecosystem (`/api/aquaos-v8`)

| Module | Features |
|--------|----------|
| **Role Guard Middleware** | `roleGuard('farmer','buyer','supplier','admin')` access control |
| **Crop Posts** | Farmers post upcoming harvests visible ONLY to buyers |
| **Crop Offers** | Buyers place offers on crop posts with counter-negotiation |
| **Community Discussions** | Categorized forums: Disease / Feed / Market / Tech / General |
| **Market Prices Multi-District** | 14 species across Nellore/Bhimavaram/Kakinada/Ongole/Vijayawada |
| **Supply Forecast** | Buyer-facing supply predictions by species/district/week |
| **Supplier Promotions** | Campaign system for input suppliers (discounts, bundles) |
| **Sales Leads Tracking** | CRM-style lead pipeline for buyers |
| **Expert Advisory Directory** | 5+ aquaculture experts with specializations |
| **7-Step Workflow** | Site Selection → Pond Prep → Stocking → Feed Mgmt → Water Mgmt → Harvest → Market |
| **Platform Analytics** | User counts, listing volumes, transaction metrics |

---

#### 🔒 V9 — Privacy, Negotiation & Admin (`/api/aquaos-v9`)

| Module | Features |
|--------|----------|
| **Privacy Controls** | Per-field visibility toggles (location, price, phone, yield data) |
| **Negotiation Rooms** | Real-time counter-offers with accept/reject/counter workflow |
| **Notification Preferences** | Channel selection (SMS/Push/WhatsApp/Email) with quiet hours |
| **Production Insights** | Hidden asset: survival rates, growth, FCR, disease, yield stats |
| **Admin Panel** | Analytics + User Management + Harvest Monitoring |
| **Verification Queue** | Document review workflow for KYC/FSSAI/MPEDA |
| **Fraud Alerts** | Suspicious activity detection and flagging |
| **Audit Log** | Complete action trail for compliance |
| **Security** | Fraud reporting endpoint + Rate limit tracking |

---

#### 🤖 V10 — AI, Payments & Scale (`/api/aquaos-v10`)

| Module | Features |
|--------|----------|
| **Analytics Layer** | Avg survival rates, feed efficiency, regional disease outbreaks |
| **Full-Text Search** | PostgreSQL GIN indexes for products, listings, community posts |
| **Payment System (Razorpay)** | Supplier payments, buyer subscriptions, marketplace commissions |
| **Pricing Intelligence** | Daily market prices for 14+ species in Andhra Pradesh |
| **Price Alerts** | Configurable threshold alerts (above/below target price) |
| **Chat/Messaging** | Text messaging, image sharing, offer negotiation |
| **AI Prediction Engine** | Disease prediction, yield forecasting, feed optimization |
| **Growth Metrics** | 4 target districts: West Godavari, East Godavari, Krishna, Nellore |
| **IoT Sensor Ingestion** | Water quality readings with automatic threshold alerting |
| **Monetization Config** | Buyer subscriptions, supplier listings, transaction commissions |
| **System Health Monitoring** | Service uptime, response times, error tracking |

---

#### 📦 V11 — Contract Aquaculture & Supply Chain (`/api/aquaos-v11`)

| Module | Features |
|--------|----------|
| **Contract Aquaculture** | Digital contracts between farmers & buyers with sign/status tracking |
| **Labor Management** | Worker attendance tracking, daily cost calculation, payroll |
| **Insurance Products** | 5 aquaculture insurance products (crop, equipment, weather, health, liability) |
| **Insurance Policies** | Policy creation, premium calculation, coverage management |
| **Insurance Claims** | Claim filing, documentation, approval workflow |
| **Export Compliance** | MPEDA / EU / FDA compliance tracking with 12 export requirements |
| **Lab Results** | Water/product quality lab test results with certification |
| **Multi-Farm Portfolio** | Portfolio view across multiple farms with financials |
| **Aqua Input Supply Chain** | Input procurement with 8 seeded AP suppliers |
| **Harvest Planning** | Harvest scheduling with date/weight/price optimization |

---

#### 🏭 Warehouse Management System (`/api/warehouse`)

| Module | Features |
|--------|----------|
| **Warehouse Directory** | 8 seeded AP cold storage warehouses with capacity/location |
| **Booking System** | Space booking with date range, quantity, temperature requirements |
| **Receipt Management** | Warehouse receipts for stored produce (negotiable instrument) |
| **Quality Inspection** | Inbound quality grading and certification |
| **Temperature Monitoring** | Real-time cold chain temperature logging and alerts |
| **Billing & Invoicing** | Storage fee calculation, billing cycles, payment tracking |
| **Capacity Management** | Real-time available capacity across warehouse network |

---

#### 📐 AquaOS Database Schema (130+ Tables)

| Migration | Tables Created | Key Data |
|-----------|---------------|----------|
| `migrate-v11-aquaos.js` | Ponds, species, feed logs, water quality, harvests, financials, disease, auctions, training | Core farm data |
| `migrate-v12-aquaos-rfq.js` | RFQ, escrow, yield forecasts, community, onboarding | Marketplace foundations |
| `migrate-v13-aquaos-v4.js` | Culture units, production cycles, IoT devices, trust verification | Infrastructure |
| `migrate-v14-aquaos-v5.js` | KPI intervals, predictions, alerts, B2B suppliers/products/orders | Intelligence layer |
| `migrate-v15-aquaos-v6.js` | Fish marketplace, buyer profiles, quality grades, cold chain, traceability, DPR, suppliers | 12 tables |
| `migrate-v16-aquaos-v7.js` | Reviews, logistics providers, disputes, trade credit, training curriculum, VMS | 12 tables, 10 providers, 14 modules |
| `migrate-v17-aquaos-v8.js` | Crop posts, offers, community, market prices, supply forecasts, promotions, leads, experts, workflows, visibility rules | 12 tables, 14 price seeds |
| `migrate-v18-aquaos-v9.js` | Privacy settings, negotiation rooms, notification prefs, production insights, admin actions, fraud reports, audit log | 9 tables, 20 insights |
| `migrate-v19-aquaos-v10.js` | Analytics, search index, payments, pricing intelligence, chat, AI predictions, growth, IoT readings, monetization, system health | 12 tables |
| `migrate-v23-aquaos-v11.js` | Contracts, labor records, insurance products/policies/claims, export compliance, lab results, multi-farm portfolios, input supply chain, harvest schedules | 15 tables, 5 insurance products, 12 export requirements, 8 suppliers |
| `migrate-v24-warehouse.js` | Warehouse directory, bookings, receipts, quality inspections, temperature logs, billing, capacity | 7 tables, 8 AP warehouses |

---

#### 🎯 AquaOS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AquaOS PLATFORM LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Farm OS │  │ Market-  │  │  Input   │  │ Advisory │        │
│  │  (V1-V4) │  │  place   │  │  Market  │  │  Engine  │        │
│  │          │  │  (V3-V8) │  │  (V5-V6) │  │ (V5-V10) │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │              │              │              │               │
│  ─────┴──────────────┴──────────────┴──────────────┴─────         │
│                           │                                       │
│  ┌───────────────────────────────────────────────────────┐       │
│  │              INTELLIGENCE ENGINE (V5-V10)              │       │
│  │  AI Predictions │ KPI Engine │ Alert System │ Analytics│       │
│  └───────────────────────────────────────────────────────┘       │
│                           │                                       │
│  ┌───────────────────────────────────────────────────────┐       │
│  │              INFRASTRUCTURE (V4-V10)                    │       │
│  │  IoT │ Payments │ Chat │ Search │ Cache │ Monitoring   │       │
│  └───────────────────────────────────────────────────────┘       │
│                           │                                       │
│  ┌───────────────────────────────────────────────────────┐       │
│  │              TRUST & COMPLIANCE (V6-V9)                │       │
│  │  Traceability │ Reviews │ Disputes │ Privacy │ Admin   │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 🚀 AquaOS Launch Strategy

| Phase | Module | Status |
|-------|--------|--------|
| **Phase 1** | Farm OS + Harvest Marketplace | ✅ Complete (V1-V4) |
| **Phase 2** | Input Marketplace + B2B Supply | ✅ Complete (V5-V6) |
| **Phase 3** | Advisory Engine + AI Predictions | ✅ Complete (V7-V10) |
| **Phase 4** | Community + Full Ecosystem | ✅ Complete (V8-V10) |
| **Phase 5** | Contract Aquaculture + Supply Chain + Warehouse | ✅ Complete (V11) |

---

#### 📈 AquaOS Scale Targets

| Metric | Target | Focus Districts |
|--------|--------|-----------------|
| Farmers | 100,000 | West Godavari, East Godavari, Krishna, Nellore |
| Buyers | 10,000 | Wholesalers, restaurants, exporters, processors |
| Suppliers | 2,000 | Feed, supplements, equipment, services |

---

#### 💵 AquaOS Monetization

| Revenue Stream | Description | Who Pays |
|---------------|-------------|----------|
| **Buyer Subscriptions** | Premium access to crop posts, supply forecasts, leads | Buyers |
| **Supplier Listings** | Featured product placements, promotion campaigns | Suppliers |
| **Transaction Commissions** | 1-3% on marketplace transactions | Both parties |
| **Advertising** | Banner ads, sponsored listings | Suppliers |
| **Farmers** | **Always FREE** — no charges for any farmer features | — |

---

#### 🌏 Market Opportunity

- **India Aquaculture**: $16B+ market, 10%+ YoY growth
- **AP State**: 40% of India's shrimp production from target districts
- **Export Demand**: Vietnam, Thailand, USA, Japan — growing 15% annually
- **Digital Gap**: <5% of farmers use any aquaculture technology

---

#### 🔮 Future Technology (Planned)

| Technology | Application |
|-----------|-------------|
| **IoT Water Sensors** | Continuous DO, pH, temperature, ammonia monitoring |
| **Satellite Pond Monitoring** | NDVI for algal bloom detection, water level estimation |
| **Automated Feeding Systems** | IoT-connected auto-feeders with AI-optimized schedules |
| **Computer Vision** | Shrimp/fish size estimation from underwater cameras |
| **Blockchain** | Full farm-to-fork traceability with immutable records |

---

#### 🏆 Platform Positioning

AquaOS transforms into a **three-in-one platform**:

1. **Aquaculture Operating System** — Complete farm management from pond to plate
2. **Marketplace** — Connecting farmers, buyers, and suppliers in one ecosystem
3. **Knowledge Network** — Training, community, expert advisory, and AI insights

### KisanConnect — Rural Super-App

```
+----------------------------------------------------------------------+
|                      KISANCONNECT                                      |
|               Rural India Super-App for Every Need                     |
+----------------------------------------------------------------------+
|                                                                      |
|  Agri Inputs          |  Seeds, fertilizers, pesticides marketplace  |
|  Equipment Rental     |  Tractor, drone, harvester booking           |
|  Agri Jobs            |  Labor marketplace (seasonal/permanent)      |
|  Training & Upskill   |  Video courses, certifications              |
|  Government Schemes   |  PM-KISAN, crop insurance discovery         |
|  Rural Finance        |  Micro-loans, KCC, savings                  |
|  Crop Doctor          |  AI photo-based disease diagnosis            |
|  Weather Advisory     |  Hyperlocal 7-day forecast + alerts         |
|                                                                      |
+----------------------------------------------------------------------+
```

### BhoomiOS — Land & Asset Management

```
+----------------------------------------------------------------------+
|                       BHOOMI OS                                        |
|                Land & Agricultural Asset Platform                      |
+----------------------------------------------------------------------+
|                                                                      |
|  Land Registry        |  Digital plot management & records           |
|  Satellite Imagery    |  NDVI, crop health from space                |
|  Farm Diary           |  Daily activity logging & analytics          |
|  Crop Planning AI     |  ML-based crop recommendations              |
|  Soil Health          |  Soil testing & nutrient tracking            |
|  Irrigation           |  Smart water management                      |
|  Yield Analytics      |  Historical yield + predictions              |
|  Asset Management     |  Equipment, livestock, storage tracking      |
|                                                                      |
+----------------------------------------------------------------------+
```

### AgriGalaxy — Ecosystem Marketplace

```
+----------------------------------------------------------------------+
|                      AGRIGALAXY                                        |
|              Unified Agricultural Marketplace Ecosystem                |
+----------------------------------------------------------------------+
|                                                                      |
|  Multi-vendor Market  |  Unified marketplace for all agri goods      |
|  Export Hub           |  International trade & compliance            |
|  FPO Dashboard        |  Collective management & reporting           |
|  Agent Network        |  Field agent commission management           |
|  Trust Scores         |  Reputation system for all participants      |
|  Analytics            |  Business intelligence dashboard             |
|  Subscription Plans   |  Tiered access for enterprises              |
|  Smart Alerts         |  Price, weather, demand notifications        |
|                                                                      |
+----------------------------------------------------------------------+
```

---

## Frontend — Progressive Web App

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build Tool** | Vite 6.x | Lightning-fast HMR & optimized builds |
| **Language** | Vanilla JavaScript (ES Modules) | Zero-framework, maximum performance |
| **Styling** | Custom CSS with Design Tokens | Themeable, consistent design system |
| **State** | Custom Store (Pub/Sub) | Lightweight reactive state management |
| **Routing** | Custom SPA Router | Hash-based, role-aware navigation |
| **Offline** | Service Worker + Cache API | Full offline capability |
| **PWA** | Web App Manifest | Installable native-like experience |

### Screen Architecture (73+ Screens)

<details>
<summary><strong>Click to see all screens</strong></summary>

#### Core Navigation (Bottom Nav)
| Screen | Module | Description |
|--------|--------|-------------|
| `HomeScreen` | Core | Dashboard with role-based widgets & quick actions |
| `AgriGalaxyScreen` | AgriGalaxy | Ecosystem marketplace hub |
| `AquaOSScreen` | AquaOS | Aquaculture dashboard |
| `AgriHubScreen` | Agri | Agriculture umbrella (AgriFlow + Intel) |
| `KisanConnectScreen` | Kisan | Rural services hub |
| `BhoomiOSScreen` | BhoomiOS | Land management |
| `ProfileScreen` | Core | User settings, preferences, account |
| `CommunityScreen` | Social | Forums, discussions, peer support |

#### Intelligence & Analytics
| Screen | Module | Description |
|--------|--------|-------------|
| `IntelligenceScreen` | AI/ML | Price forecasts, demand analysis |
| `AnalyticsScreen` | Admin | Business metrics & reporting |
| `WeatherScreen` | Advisory | Hyperlocal weather + crop advisories |
| `SatelliteScreen` | Remote Sensing | NDVI, vegetation health maps |
| `CropPlanningScreen` | AI | ML-powered crop recommendations |
| `CropDoctorScreen` | AI | Photo-based disease diagnosis |

#### Commerce & Finance
| Screen | Module | Description |
|--------|--------|-------------|
| `AgriFlowScreen` | Trade | Marketplace listings & trade |
| `OrdersScreen` | Commerce | Order management & history |
| `WalletScreen` | Finance | Digital wallet & transactions |
| `EscrowScreen` | Trust | Secure payment holding |
| `FinanceScreen` | Banking | Loans, credit, insurance |
| `ContractScreen` | Legal | Contract farming agreements |
| `SubscriptionsScreen` | Monetization | Plan management |

#### Stakeholder Dashboards
| Screen | Module | Description |
|--------|--------|-------------|
| `FPODashboardScreen` | FPO | Collective management hub |
| `AgentDashboardScreen` | Agents | Field agent operations |
| `ExporterScreen` | Export | International trade tools |
| `AdminScreen` | Admin | Platform administration |

#### Services & Tools
| Screen | Module | Description |
|--------|--------|-------------|
| `FarmDiaryScreen` | Records | Daily farming activity log |
| `InputsScreen` | Commerce | Seeds, fertilizers marketplace |
| `LogisticsScreen` | Supply Chain | Transport booking & tracking |
| `SchemesScreen` | Government | Govt scheme browser |
| `SchemeDiscoveryScreen` | AI | AI-matched scheme recommendations |
| `JobsScreen` | Employment | Agricultural job marketplace |
| `TrainingScreen` | Education | Courses & certifications |
| `ChatScreen` | Communication | Real-time messaging |
| `NotificationsScreen` | Alerts | Push notification center |
| `TrustScoreScreen` | Reputation | Trust & rating system |
| `FavoritesScreen` | Personal | Saved items & bookmarks |
| `WatchlistsScreen` | Alerts | Price & product watchlists |
| `TicketsScreen` | Support | Customer support tickets |

</details>

### Design System

```css
/* Core Design Tokens */
:root {
  /* Colors — Agriculture-inspired palette */
  --primary:        #1B5E20;     /* Deep Green */
  --primary-light:  #4CAF50;     /* Fresh Green */
  --secondary:      #1a237e;     /* Deep Indigo */
  --accent:         #FF6F00;     /* Amber */

  /* Typography — Inter Font Family */
  --font-family:    'Inter', system-ui, sans-serif;

  /* Spacing Scale (4px base) */
  --space-xs: 4px;  --space-sm: 8px;  --space-md: 16px;
  --space-lg: 24px; --space-xl: 32px;

  /* Elevation System */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.12);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg:  0 10px 25px rgba(0,0,0,0.15);
}
```

### Frontend Features

- **Mobile-First Responsive Design** — Optimized for rural smartphone screens
- **Dark/Light Theme Support** — User-configurable with CSS custom properties
- **Pull-to-Refresh** — Native-like content refresh gesture
- **Lazy Image Loading** — Performance-optimized rendering
- **Error Boundary** — Graceful error handling with recovery UI
- **Service Worker** — Full offline capability with cache strategies
- **Accessibility** — ARIA labels, skip navigation, keyboard support
- **Animations** — Smooth CSS transitions and micro-interactions
- **Toast Notifications** — Non-intrusive feedback system
- **Modal System** — Bottom sheet modals with focus trapping

---

## Backend — REST API & WebSocket

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express.js | 4.21 |
| **Database** | PostgreSQL | 15+ |
| **Cache** | Redis | 7.x |
| **Auth** | JWT + bcrypt | - |
| **Validation** | express-validator | 7.x |
| **Security** | Helmet + HPP + Rate Limit | - |
| **Logging** | Pino + pino-http | 10.x |
| **WebSocket** | ws | 8.x |
| **Process** | Compression + Morgan | - |

### API Route Architecture (76+ Route Files, 400+ Endpoints)

<details>
<summary><strong>Click to see all API routes</strong></summary>

#### Authentication & User Management
```
POST   /api/auth/register          # Phone + OTP registration
POST   /api/auth/login             # OTP-based login
POST   /api/auth/verify-otp        # OTP verification
POST   /api/auth/refresh           # Token refresh
GET    /api/auth/me                # Current user profile
PUT    /api/auth/profile           # Update profile
```

#### AgriFlow — Trade & Commerce
```
GET    /api/agriflow/listings      # Browse supply listings
POST   /api/agriflow/listings      # Create listing
GET    /api/agriflow/listings/:id  # Listing detail
GET    /api/agriflow/inquiries     # Buyer inquiries
POST   /api/agriflow/inquiries     # Create inquiry
GET    /api/agriflow/declarations  # Farmer declarations
POST   /api/agriflow/declarations  # Create declaration
GET    /api/agriflow/crops         # Crop catalog
GET    /api/agriflow/districts     # District list
```

#### AquaOS — Complete Aquaculture API (300+ Endpoints)

**V1 Core Farm OS** (`/api/aquaos`)
```
GET    /api/aquaos/ponds                    # List all ponds
POST   /api/aquaos/ponds                    # Register new pond
GET    /api/aquaos/ponds/:id                # Pond details with water quality
PUT    /api/aquaos/ponds/:id                # Update pond parameters
GET    /api/aquaos/species                  # Species catalog
POST   /api/aquaos/feed-log                 # Record daily feed
GET    /api/aquaos/water-quality/:pondId    # Water quality history
POST   /api/aquaos/harvest                  # Record harvest
GET    /api/aquaos/market-prices            # Live market prices
GET    /api/aquaos/dashboard                # Farm KPIs summary
GET    /api/aquaos/advisory                 # Species-specific advisory
```

**V2 Financial & Operations** (`/api/aquaos-v2`)
```
POST   /api/aquaos-v2/finance/transaction   # Record income/expense
GET    /api/aquaos-v2/finance/pnl/:pondId   # Pond-level P&L
POST   /api/aquaos-v2/disease/report        # Log disease event
GET    /api/aquaos-v2/schemes/pmmsy         # PMMSY scheme list
POST   /api/aquaos-v2/cold-chain/shipment   # Create cold chain shipment
GET    /api/aquaos-v2/training/courses       # Training catalog
POST   /api/aquaos-v2/auctions/create       # Start live auction
POST   /api/aquaos-v2/auctions/:id/bid      # Place bid
GET    /api/aquaos-v2/benchmarks/:district  # District benchmarks
POST   /api/aquaos-v2/bulk-orders           # Aggregated input order
GET    /api/aquaos-v2/kpi/:pondId           # Pond KPI engine
```

**V3 RFQ & Escrow** (`/api/aquaos-v3`)
```
POST   /api/aquaos-v3/rfq                   # Create RFQ (buyer)
GET    /api/aquaos-v3/rfq                    # List RFQs
POST   /api/aquaos-v3/rfq/:id/respond       # Farmer responds to RFQ
POST   /api/aquaos-v3/escrow/create         # Initialize escrow payment
POST   /api/aquaos-v3/escrow/:id/release    # Release escrow on delivery
GET    /api/aquaos-v3/forecast/:pondId      # Yield forecast (Von Bertalanffy)
POST   /api/aquaos-v3/community/post        # Community knowledge post
GET    /api/aquaos-v3/analytics/regional    # District-level analytics
POST   /api/aquaos-v3/onboarding/start      # Start farmer onboarding
```

**V4 Infrastructure** (`/api/aquaos-v4`)
```
POST   /api/aquaos-v4/units                 # Create culture unit (pond/RAS/cage/biofloc)
GET    /api/aquaos-v4/units                 # List culture units
POST   /api/aquaos-v4/cycles                # Start production cycle
GET    /api/aquaos-v4/harvest-optimizer     # Price-size optimization
POST   /api/aquaos-v4/iot/devices           # Register IoT device
GET    /api/aquaos-v4/iot/alerts            # IoT threshold alerts
POST   /api/aquaos-v4/trust/verify          # GST/FSSAI/MPEDA verification
GET    /api/aquaos-v4/analytics/per-acre    # Per-acre productivity stats
GET    /api/aquaos-v4/kpi/farm              # Farm-level KPIs
```

**V5 Predictive Intelligence** (`/api/aquaos-v5`)
```
GET    /api/aquaos-v5/kpi/advanced/:pondId  # Interval SGR/ADG/FCR
GET    /api/aquaos-v5/predict/growth        # Von Bertalanffy prediction
GET    /api/aquaos-v5/predict/profit        # Bio-economic optimization
GET    /api/aquaos-v5/alerts                # Active alert rules
POST   /api/aquaos-v5/alerts/rules          # Configure alert thresholds
GET    /api/aquaos-v5/supply/products       # B2B product catalog
POST   /api/aquaos-v5/supply/orders         # Place supply order
POST   /api/aquaos-v5/supply/reviews        # Review supplier
```

**V6 Fish Marketplace & Compliance** (`/api/aquaos-v6`)
```
POST   /api/aquaos-v6/marketplace/listing   # Create fish listing (auction/RFQ/fixed)
GET    /api/aquaos-v6/marketplace/listings  # Browse marketplace
POST   /api/aquaos-v6/marketplace/:id/bid   # Bid on auction
POST   /api/aquaos-v6/buyer/profile         # Create buyer profile
GET    /api/aquaos-v6/quality/grades        # BIS quality grades
POST   /api/aquaos-v6/cold-chain/monitor    # Cold chain temperature log
GET    /api/aquaos-v6/traceability/:lotId   # Full traceability chain
POST   /api/aquaos-v6/pmmsy/dpr            # Generate PMMSY DPR
GET    /api/aquaos-v6/suppliers/directory   # National supplier directory
```

**V7 Trust & Logistics** (`/api/aquaos-v7`)
```
POST   /api/aquaos-v7/reviews               # Submit seller review
GET    /api/aquaos-v7/reviews/:sellerId     # Seller reviews + badges
GET    /api/aquaos-v7/logistics/providers   # Logistics directory
POST   /api/aquaos-v7/logistics/book        # Book logistics
GET    /api/aquaos-v7/logistics/:id/track   # Temperature + location tracking
POST   /api/aquaos-v7/disputes/open         # Open dispute
PUT    /api/aquaos-v7/disputes/:id/escalate # Escalate dispute
POST   /api/aquaos-v7/credit/apply          # Apply for trade credit
GET    /api/aquaos-v7/training/curriculum   # Multi-language training modules
GET    /api/aquaos-v7/vms/vessels           # Vessel monitoring
```

**V8 Role-Based Ecosystem** (`/api/aquaos-v8`)
```
POST   /api/aquaos-v8/crop-posts            # Create crop post (farmer)
GET    /api/aquaos-v8/crop-posts            # List crop posts (buyers only)
POST   /api/aquaos-v8/crop-posts/:id/offer  # Make offer on crop post
GET    /api/aquaos-v8/community/discussions # Community discussions by category
GET    /api/aquaos-v8/market-prices         # Multi-district prices (14 species)
GET    /api/aquaos-v8/supply-forecast       # Supply forecast by species/district
POST   /api/aquaos-v8/promotions            # Supplier promotion campaign
GET    /api/aquaos-v8/leads                  # Sales leads for buyers
GET    /api/aquaos-v8/experts                # Expert advisory directory
GET    /api/aquaos-v8/workflow/:farmId      # 7-step workflow progress
GET    /api/aquaos-v8/platform/analytics    # Platform-wide stats
```

**V9 Privacy & Admin** (`/api/aquaos-v9`)
```
GET    /api/aquaos-v9/privacy/settings      # Get privacy settings
PUT    /api/aquaos-v9/privacy/settings      # Update visibility toggles
POST   /api/aquaos-v9/negotiate/room        # Create negotiation room
POST   /api/aquaos-v9/negotiate/:id/offer   # Send counter-offer
PUT    /api/aquaos-v9/negotiate/:id/accept  # Accept offer
PUT    /api/aquaos-v9/notifications/prefs   # Update notification channels
GET    /api/aquaos-v9/insights/production   # Production data insights
GET    /api/aquaos-v9/admin/dashboard       # Admin analytics
GET    /api/aquaos-v9/admin/users           # User management
GET    /api/aquaos-v9/admin/harvests        # Harvest monitoring
GET    /api/aquaos-v9/admin/verification    # Verification queue
GET    /api/aquaos-v9/admin/fraud-alerts    # Fraud alert dashboard
POST   /api/aquaos-v9/security/report-fraud # Report fraud
```

**V10 AI, Payments & Scale** (`/api/aquaos-v10`)
```
GET    /api/aquaos-v10/analytics/overview    # Platform-wide analytics insights
GET    /api/aquaos-v10/analytics/survival    # Survival rate analytics
GET    /api/aquaos-v10/analytics/feed        # Feed efficiency metrics
GET    /api/aquaos-v10/analytics/disease     # Regional disease outbreaks
GET    /api/aquaos-v10/search?q=             # Full-text search (products/listings/posts)
POST   /api/aquaos-v10/payments/create-order # Razorpay payment order
POST   /api/aquaos-v10/payments/verify       # Verify payment signature
GET    /api/aquaos-v10/payments/history      # Payment history
POST   /api/aquaos-v10/payments/refund       # Initiate refund
GET    /api/aquaos-v10/subscriptions/plans   # Subscription plans
POST   /api/aquaos-v10/subscriptions/subscribe # Start subscription
GET    /api/aquaos-v10/prices                # Daily market prices (14+ species, AP markets)
GET    /api/aquaos-v10/prices/forecast       # Price forecasting
POST   /api/aquaos-v10/prices/alerts         # Set price alert
POST   /api/aquaos-v10/chat/rooms            # Create chat room
POST   /api/aquaos-v10/chat/messages         # Send message (text/image/offer)
GET    /api/aquaos-v10/chat/messages/:roomId # Get chat messages
GET    /api/aquaos-v10/ai/predictions        # AI predictions list
POST   /api/aquaos-v10/ai/predict            # Request AI prediction
GET    /api/aquaos-v10/growth/dashboard      # Growth metrics dashboard
POST   /api/aquaos-v10/iot/readings          # Ingest IoT sensor data
GET    /api/aquaos-v10/iot/readings/:pondId  # Pond sensor history
GET    /api/aquaos-v10/system/health         # System health status
GET    /api/aquaos-v10/platform/info         # Platform positioning & capabilities
```

**V11 Contract & Supply Chain** (`/api/aquaos-v11`)
```
POST   /api/aquaos-v11/contracts              # Create farming contract
POST   /api/aquaos-v11/contracts/:id/sign     # Sign contract
GET    /api/aquaos-v11/contracts/:id/status   # Contract status
POST   /api/aquaos-v11/labor/attendance       # Record worker attendance
GET    /api/aquaos-v11/labor/costs            # Labor cost summary
GET    /api/aquaos-v11/insurance/products     # Insurance product catalog
POST   /api/aquaos-v11/insurance/policies     # Create insurance policy
POST   /api/aquaos-v11/insurance/claims       # File insurance claim
GET    /api/aquaos-v11/export/requirements    # Export compliance checklist
POST   /api/aquaos-v11/export/lab-results     # Submit lab results
GET    /api/aquaos-v11/portfolio              # Multi-farm portfolio
GET    /api/aquaos-v11/portfolio/financials   # Cross-farm P&L
GET    /api/aquaos-v11/inputs/suppliers       # Input supplier directory
POST   /api/aquaos-v11/harvest/schedule       # Harvest scheduling
```

**Warehouse Management** (`/api/warehouse`)
```
GET    /api/warehouse/directory               # Warehouse directory (8 AP)
POST   /api/warehouse/booking                 # Book storage space
POST   /api/warehouse/receipts                # Issue warehouse receipt
POST   /api/warehouse/quality/inspect         # Quality inspection
POST   /api/warehouse/temperature/log         # Temperature reading
GET    /api/warehouse/temperature/alerts      # Temperature alerts
GET    /api/warehouse/billing/:bookingId      # Billing details
```

#### KisanConnect & ROS
```
GET    /api/kisanconnect/services  # Available services
POST   /api/kisanconnect/book      # Book service
GET    /api/kisanconnect/equipment # Equipment listings

# Rural Operating System (ROS)
GET    /api/vehicles               # List vehicles
POST   /api/vehicles               # Register vehicle
GET    /api/vehicles/nearby        # Find by proximity
POST   /api/transport/book         # Book transport
GET    /api/transport/active       # Active bookings
POST   /api/delivery/create        # Create delivery
GET    /api/delivery/:id/track     # Track delivery
GET    /api/gigworkers             # Gig worker directory
POST   /api/gigworkers/register    # Register as gig worker
POST   /api/gigworkers/:id/assign  # Assign task
```

#### BhoomiOS
```
GET    /api/bhoomios/plots         # User land plots
POST   /api/bhoomios/plots         # Register plot
GET    /api/bhoomios/satellite/:id # Satellite imagery
```

#### Intelligence & Analytics
```
GET    /api/intelligence/prices    # Price intelligence
GET    /api/intelligence/demand    # Demand analytics
GET    /api/intelligence/forecast  # Price forecasts
GET    /api/intelligence/advisory  # Crop advisories
```

#### Payments & Finance
```
POST   /api/payments/create-order  # Razorpay order
POST   /api/payments/verify        # Payment verification
GET    /api/wallet/balance         # Wallet balance
POST   /api/wallet/transfer        # Fund transfer
GET    /api/escrow/:id             # Escrow details
POST   /api/escrow/create          # Create escrow
POST   /api/finance/apply-loan     # Loan application
```

#### FPO & Enterprise
```
GET    /api/fpo/dashboard          # FPO metrics
GET    /api/fpo/members            # Member management
POST   /api/fpo/aggregate          # Aggregate orders
GET    /api/exporter/opportunities # Export opportunities
POST   /api/exporter/shipment      # Create shipment
```

#### Platform Services
```
GET    /api/weather/:location      # Weather data
GET    /api/schemes                # Government schemes
POST   /api/schemediscovery/match  # AI scheme matching
POST   /api/cropdoctor/diagnose    # Disease diagnosis
GET    /api/jobs                   # Job listings
GET    /api/training/courses       # Training courses
POST   /api/chat/send              # Send message
GET    /api/community/posts        # Community feed
POST   /api/tickets/create         # Support ticket
GET    /api/tracking/:id           # Shipment tracking
POST   /api/translate              # Text translation
```

#### Administration
```
GET    /api/admin/users            # User management
GET    /api/admin/analytics        # Platform analytics
POST   /api/admin/moderate         # Content moderation
GET    /api/government/reports     # Government reporting
GET    /api/bankportal/overview    # Bank lending overview
```

#### Galaxy Discovery
```
GET    /api/galaxy/discover        # Unified discovery feed
GET    /api/galaxy/farmers         # Farmer directory
GET    /api/galaxy/aqua            # Aquaculture marketplace
GET    /api/galaxy/inputs          # Inputs marketplace
GET    /api/galaxy/livestock       # Livestock galaxy
GET    /api/galaxy/mandis          # Mandi price discovery
GET    /api/galaxy/schemes         # Government schemes
```

#### Platform Readiness (Compliance, KYC, AI, National Integration)
```
# Compliance & DPDP
GET    /api/compliance/status      # DPDP compliance status
POST   /api/compliance/consent     # Record user consent
DELETE /api/compliance/data/:userId # Right to erasure

# KYC Verification
POST   /api/kyc/aadhaar            # Aadhaar verification
POST   /api/kyc/pan                # PAN verification
POST   /api/kyc/bank-account       # Bank account verification
POST   /api/kyc/documents          # Document upload

# AI Predictions
POST   /api/ai-predictions/disease # Disease risk prediction
POST   /api/ai-predictions/yield   # Yield forecast
POST   /api/ai-predictions/price   # Price prediction
POST   /api/ai-predictions/demand  # Demand forecast

# National Integration (eNAM/NABARD/SFAC)
GET    /api/enam/markets           # eNAM market listings
GET    /api/enam/prices            # eNAM live prices
POST   /api/enam/trade             # Place eNAM trade
```

#### Trade Engine
```
POST   /api/trade/orders                    # Create trade order
GET    /api/trade/orders                    # List orders
GET    /api/trade/orders/:id               # Order detail + timeline
POST   /api/trade/orders/:id/bid           # Place bid
POST   /api/trade/orders/:id/accept-bid    # Accept bid
POST   /api/trade/orders/:id/fund-escrow   # Fund escrow
POST   /api/trade/orders/:id/verify-quality # Quality verification
POST   /api/trade/orders/:id/dispatch      # Mark dispatched
POST   /api/trade/orders/:id/in-transit    # Transit update
POST   /api/trade/orders/:id/deliver       # Confirm delivery
POST   /api/trade/orders/:id/release-payment # Release payment
GET    /api/trade/orders/:id/timeline      # Audit trail
```

</details>

### Middleware Pipeline

```
Request -> RequestID -> Sanitize -> RateLimit -> Helmet -> HPP -> CORS
        -> Auth (JWT) -> Validation -> Route Handler -> Error Handler -> Response
```

| Middleware | Purpose |
|-----------|---------|
| `requestId` | Unique request tracing (UUID per request) |
| `sanitize` | Input sanitization against XSS/injection |
| `rateLimit` | DDoS protection (configurable per route) |
| `rateLimiters` | Per-route rate limits (marketplace, auction, payment, IoT) |
| `helmet` | HTTP security headers |
| `hpp` | HTTP Parameter Pollution protection |
| `auth` | JWT token verification & role extraction |
| `validate` | express-validator schema enforcement |
| `errorHandler` | Centralized error formatting & logging |
| `auditMiddleware` | Audit trail for sensitive operations |
| `dpdp` | DPDP Act 2023 compliance enforcement |

### Service Layer

| Service | Responsibility |
|---------|---------------|
| `payments.js` | Razorpay integration, order management |
| `sms.js` | MSG91 + Fast2SMS OTP delivery |
| `push.js` | Firebase Cloud Messaging |
| `weather.js` | OpenWeatherMap API integration |
| `cache.js` | Redis caching strategies |
| `queue.js` | Background job processing |
| `storage.js` | Cloudflare R2 file storage |
| `translate.js` | Google Translate / LibreTranslate |
| `websocket.js` | Real-time bidirectional messaging |
| `apmc.js` | data.gov.in APMC market data |
| `audit.js` | Compliance audit logging |
| `fraudDetection.js` | Suspicious activity detection & blocking |
| `matching.js` | Vehicle-delivery matching for KisanConnect ROS |
| `eventBus.js` | Internal event-driven messaging bus |

---

## Trade Engine — State Machine

AgriHub includes a **full trade lifecycle engine** with escrow-protected transactions and comprehensive status tracking.

### Trade Order State Machine

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ CREATED  │────>│BID PLACED│────>│  BID     │────>│  ESCROW  │
│          │     │          │     │ ACCEPTED │     │  FUNDED  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
┌──────────┐     ┌──────────┐     ┌──────────┐         │
│ PAYMENT  │<────│DELIVERED │<────│IN TRANSIT│<────┐    │
│ RELEASED │     │          │     │          │     │    │
└──────────┘     └──────────┘     └──────────┘     │    │
                                                    │    v
                                              ┌──────────┐     ┌──────────┐
                                              │DISPATCHED│<────│ QUALITY  │
                                              │          │     │ VERIFIED │
                                              └──────────┘     └──────────┘
```

### Trade API Endpoints

```
POST   /api/trade/orders                    # Create trade order
GET    /api/trade/orders                    # List orders (role-filtered)
GET    /api/trade/orders/:id               # Order detail + timeline
POST   /api/trade/orders/:id/bid           # Place bid on order
POST   /api/trade/orders/:id/accept-bid    # Accept a bid (seller)
POST   /api/trade/orders/:id/fund-escrow   # Fund escrow (buyer)
POST   /api/trade/orders/:id/verify-quality # Quality check passed
POST   /api/trade/orders/:id/dispatch      # Mark dispatched
POST   /api/trade/orders/:id/in-transit    # Update transit status
POST   /api/trade/orders/:id/deliver       # Confirm delivery
POST   /api/trade/orders/:id/release-payment # Release escrow to seller
GET    /api/trade/orders/:id/timeline      # Full audit trail
```

### Trade Database Tables

| Table | Purpose |
|-------|---------|
| `trade_orders` | Order records with state, amounts, parties |
| `trade_bids` | Bids with price, quantity, validity |
| `trade_timeline` | Full event log for each order transition |
| `escrow_transactions` | Escrow holds, releases, refunds |

---

## KisanConnect 2.0 — Rural Operating System

KisanConnect evolved from a rural services hub into a **full Rural Operating System (ROS)** with vehicle fleet management, last-mile delivery, and gig worker marketplace.

### ROS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 KISANCONNECT 2.0 — RURAL OPERATING SYSTEM         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Vehicle    │  │  Transport   │  │   Delivery   │           │
│  │   Fleet      │  │  Matching    │  │   Tracking   │           │
│  │  Management  │  │   Engine     │  │   System     │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                  │                    │
│  ───────┴──────────────────┴──────────────────┴───────            │
│                            │                                      │
│  ┌─────────────────────────────────────────────────────┐         │
│  │            GIG WORKER MARKETPLACE                     │         │
│  │  Drivers │ Loaders │ Cold Chain Ops │ Last-Mile Agents│         │
│  └─────────────────────────────────────────────────────┘         │
│                            │                                      │
│  ┌─────────────────────────────────────────────────────┐         │
│  │            MATCHING SERVICE (matching.js)             │         │
│  │  Proximity │ Availability │ Vehicle Type │ Load Match │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### ROS API Endpoints

```
# Vehicle Fleet Management (/api/vehicles)
GET    /api/vehicles                  # List available vehicles
POST   /api/vehicles                  # Register vehicle
GET    /api/vehicles/:id              # Vehicle details + status
PUT    /api/vehicles/:id/status       # Update availability
GET    /api/vehicles/nearby           # Find vehicles by proximity

# Transport Booking (/api/transport)
POST   /api/transport/book            # Book transport
GET    /api/transport/active          # Active transport bookings
PUT    /api/transport/:id/status      # Update transport status
GET    /api/transport/rates           # Transport rate calculator

# Delivery Tracking (/api/delivery)
POST   /api/delivery/create           # Create delivery task
GET    /api/delivery/:id/track        # Real-time delivery tracking
PUT    /api/delivery/:id/status       # Update delivery status
GET    /api/delivery/history          # Delivery history

# Gig Workers (/api/gigworkers)
GET    /api/gigworkers                # Available gig workers
POST   /api/gigworkers/register       # Register as gig worker
PUT    /api/gigworkers/:id/available  # Toggle availability
GET    /api/gigworkers/:id/earnings   # Earnings dashboard
POST   /api/gigworkers/:id/assign     # Assign task to worker
```

### Frontend Screens

| Screen | Description |
|--------|-------------|
| `KisanConnectScreen` | ROS hub with all services |
| `VehiclesScreen` | Vehicle fleet browser & booking |
| `DeliveryScreen` | Delivery tracking with live map |
| `GigWorkersScreen` | Worker marketplace & task assignment |

---

## AquaOS V11 — Contract & Supply Chain

The latest AquaOS evolution adds **enterprise-grade contract aquaculture**, labor management, insurance, export compliance, and multi-farm portfolio management.

### V11 API Endpoints

```
# Contract Aquaculture (/api/aquaos-v11/contracts)
POST   /api/aquaos-v11/contracts              # Create farming contract
GET    /api/aquaos-v11/contracts              # List contracts
POST   /api/aquaos-v11/contracts/:id/sign     # Sign contract
GET    /api/aquaos-v11/contracts/:id/status   # Contract status

# Labor Management (/api/aquaos-v11/labor)
POST   /api/aquaos-v11/labor/attendance       # Record attendance
GET    /api/aquaos-v11/labor/costs            # Labor cost summary
GET    /api/aquaos-v11/labor/workers          # Worker directory

# Insurance (/api/aquaos-v11/insurance)
GET    /api/aquaos-v11/insurance/products     # 5 insurance products
POST   /api/aquaos-v11/insurance/policies     # Create policy
POST   /api/aquaos-v11/insurance/claims       # File claim
GET    /api/aquaos-v11/insurance/claims/:id   # Claim status

# Export Compliance (/api/aquaos-v11/export)
GET    /api/aquaos-v11/export/requirements    # 12 export requirements (MPEDA/EU/FDA)
POST   /api/aquaos-v11/export/lab-results     # Submit lab results
GET    /api/aquaos-v11/export/compliance/:id  # Compliance status

# Multi-Farm Portfolio (/api/aquaos-v11/portfolio)
GET    /api/aquaos-v11/portfolio              # All farms overview
GET    /api/aquaos-v11/portfolio/financials   # Cross-farm P&L

# Supply Chain (/api/aquaos-v11/inputs)
GET    /api/aquaos-v11/inputs/suppliers       # 8 AP input suppliers
POST   /api/aquaos-v11/inputs/orders          # Place input order

# Harvest Planning (/api/aquaos-v11/harvest)
POST   /api/aquaos-v11/harvest/schedule       # Create harvest schedule
GET    /api/aquaos-v11/harvest/calendar       # Harvest calendar view
```

---

## Warehouse Management System

A dedicated warehouse management module for aquaculture cold storage and general agricultural warehousing across Andhra Pradesh.

### Warehouse API Endpoints

```
# Warehouse Directory (/api/warehouse)
GET    /api/warehouse/directory               # 8 seeded AP warehouses
GET    /api/warehouse/:id                     # Warehouse details + capacity

# Booking (/api/warehouse/booking)
POST   /api/warehouse/booking                 # Book storage space
GET    /api/warehouse/booking/:id             # Booking details
PUT    /api/warehouse/booking/:id/cancel      # Cancel booking

# Receipts (/api/warehouse/receipts)
POST   /api/warehouse/receipts                # Issue warehouse receipt
GET    /api/warehouse/receipts/:id            # Receipt details (negotiable)

# Quality (/api/warehouse/quality)
POST   /api/warehouse/quality/inspect         # Quality inspection on receipt
GET    /api/warehouse/quality/:receiptId      # Inspection results

# Temperature (/api/warehouse/temperature)
POST   /api/warehouse/temperature/log         # Log temperature reading
GET    /api/warehouse/temperature/:warehouseId # Temperature history
GET    /api/warehouse/temperature/alerts      # Active temperature alerts

# Billing (/api/warehouse/billing)
GET    /api/warehouse/billing/:bookingId      # Billing details
POST   /api/warehouse/billing/generate        # Generate invoice
```

---

## Galaxy Discovery Module

The Galaxy module provides a **unified discovery experience** across all agricultural verticals, enabling users to explore farmers, aquaculture, inputs, livestock, contracts, exporters, mandis, training, schemes, and KisanConnect services.

### Galaxy API Endpoints

```
GET    /api/galaxy/discover           # Unified discovery feed
GET    /api/galaxy/farmers            # Farmer galaxy directory
GET    /api/galaxy/aqua               # Aquaculture galaxy
GET    /api/galaxy/inputs             # Inputs marketplace galaxy
GET    /api/galaxy/livestock          # Livestock galaxy
GET    /api/galaxy/contracts          # Contracts galaxy
GET    /api/galaxy/exporters          # Exporter galaxy
GET    /api/galaxy/mandis             # Mandi/market galaxy
GET    /api/galaxy/training           # Training galaxy
GET    /api/galaxy/schemes            # Schemes galaxy
GET    /api/galaxy/kisan              # KisanConnect galaxy
```

### Galaxy Frontend Screens

| Screen | Description |
|--------|-------------|
| `AgriGalaxyScreen` | Main galaxy hub with cross-vertical discovery |
| `FarmerGalaxyScreen` | Farmer directory with profiles & portfolios |
| `FarmerPortfolioScreen` | Individual farmer portfolio view |
| `AquaGalaxyScreen` | Aquaculture discovery marketplace |
| `AquaPortfolioScreen` | Aqua farm portfolio viewer |
| `InputsGalaxyScreen` | Agricultural inputs marketplace |
| `InputsPortfolioScreen` | Supplier product catalog |
| `LivestockGalaxyScreen` | Livestock marketplace |
| `LivestockPortfolioScreen` | Livestock farm details |
| `ContractsGalaxyScreen` | Contract farming opportunities |
| `ExporterGalaxyScreen` | Export opportunities & compliance |
| `MandiGalaxyScreen` | Mandi price discovery |
| `MandiPortfolioScreen` | Market-specific price history |
| `TrainingGalaxyScreen` | Training course discovery |
| `SchemesGalaxyScreen` | Government scheme discovery |
| `KisanGalaxyScreen` | Rural services discovery |
| `FPOGalaxyScreen` | FPO collective marketplace |
| `FPOPortfolioScreen` | FPO details & offerings |

---

## Platform Readiness — Compliance & KYC

Platform readiness modules ensure regulatory compliance, identity verification, AI-powered intelligence, and integration with national agricultural infrastructure.

### DPDP Compliance (`/api/compliance`)

| Feature | Description |
|---------|-------------|
| **Data Classification** | Personal data categorization per DPDP Act 2023 |
| **Consent Management** | Granular consent collection & withdrawal |
| **Data Retention** | Configurable retention policies with auto-purge |
| **Right to Erasure** | User data deletion workflows |
| **Audit Trail** | Complete data access logging |

### KYC Verification (`/api/kyc`)

| Feature | Description |
|---------|-------------|
| **Aadhaar Verification** | UIDAI integration for identity |
| **PAN Verification** | Income tax PAN validation |
| **Bank Account** | Account verification via penny drop |
| **FSSAI License** | Food safety license verification |
| **MPEDA Registration** | Marine products export license |
| **Document Upload** | Secure document storage & review |

### AI Predictions (`/api/ai-predictions`)

| Model | Description |
|-------|-------------|
| **Disease Prediction** | Species-specific disease risk scoring |
| **Yield Forecast** | ML-based harvest weight prediction |
| **Price Forecast** | Time-series price prediction (7/14/30 day) |
| **Demand Forecast** | Regional demand prediction by species |
| **Feed Optimization** | AI-optimized feeding schedules |

### National Infrastructure Integration (`/api/enam`)

| System | Integration |
|--------|-------------|
| **eNAM** | National Agriculture Market electronic trading |
| **NABARD** | Agricultural financing & refinancing |
| **SFAC** | Small Farmers' Agribusiness Consortium |
| **APEDA** | Agricultural and Processed Food Products Export |

---

## Database Architecture

### Migration Strategy (24 Versioned Migrations)

```
+---------------------------------------------------------------------+
|  Migration History                                                    |
+---------------------------------------------------------------------+
|                                                                      |
|  v1  | migrate.js               | Foundation tables (users, auth)    |
|  v2  | migrate-v2.js            | Extended user profiles, roles      |
|  v3  | migrate-v3-trade.js      | Trading engine (listings, orders)  |
|  v4  | migrate-v4-infrastructure | Infrastructure (cache, queues)     |
|  v5  | migrate-v5-platform.js   | Platform services (support, etc)   |
|  v6a | migrate-v6-agrios.js     | AgriOS features (diary, inputs)    |
|  v6b | migrate-v6-farmerson.js  | FarmersOn (cart, livestock, trust)  |
|  v7  | migrate-v7-intelligence  | Intelligence engine tables          |
|  v8  | migrate-v8-finance.js    | Finance (wallet, loans, escrow)    |
|  v9  | migrate-v9-ecosystem.js  | Full ecosystem (agents, exports)   |
|  v10 | migrate-v10-ros.js       | KisanConnect ROS (vehicles, gig)   |
|  v11 | migrate-v11-aquaos.js    | AquaOS V1 (ponds, species, feed)   |
|  v12 | migrate-v12-aquaos-rfq   | AquaOS V3 (RFQ, escrow, forecast)  |
|  v13 | migrate-v13-aquaos-v4    | AquaOS V4 (units, IoT, trust)      |
|  v14 | migrate-v14-aquaos-v5    | AquaOS V5 (KPIs, predictions)      |
|  v15 | migrate-v15-aquaos-v6    | AquaOS V6 (marketplace, tracing)   |
|  v16 | migrate-v16-aquaos-v7    | AquaOS V7 (reviews, logistics)     |
|  v17 | migrate-v17-aquaos-v8    | AquaOS V8 (roles, community)       |
|  v18 | migrate-v18-aquaos-v9    | AquaOS V9 (privacy, admin)         |
|  v19 | migrate-v19-aquaos-v10   | AquaOS V10 (AI, payments, chat)    |
|  v20 | migrate-v20-indexes      | Performance indexes (GIN, B-tree)  |
|  v21 | migrate-v21-galaxy       | Galaxy discovery tables             |
|  v22 | migrate-v22-platform     | Platform readiness (KYC, DPDP)     |
|  v23 | migrate-v23-aquaos-v11   | AquaOS V11 (contracts, insurance)  |
|  v24 | migrate-v24-warehouse    | Warehouse management (7 tables)    |
|                                                                      |
|  + Supabase Migrations:                                              |
|  001_foundation.sql             | Core schema in Supabase            |
|  002_complete_platform.sql      | Full platform schema               |
|                                                                      |
+---------------------------------------------------------------------+
```

### Database Features

- **Connection Pooling** — `pg` pool with configurable limits
- **Transaction Support** — ACID-compliant multi-step operations
- **Seeding** — Development data seeding scripts
- **Health Checks** — Docker healthcheck with `pg_isready`
- **Retry Logic** — Automatic reconnection on network failures

---

## Native Android App

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Language** | Kotlin |
| **Build** | Gradle (Kotlin DSL) |
| **Architecture** | MVVM + Clean Architecture |
| **UI** | Jetpack Compose + Material 3 |
| **Networking** | Retrofit + OkHttp |
| **DI** | Hilt |

### Android Features
- Native Android experience with Material 3 design
- Offline data sync with Room database
- Push notifications via Firebase Cloud Messaging
- Camera integration for Crop Doctor AI
- GPS integration for field mapping
- Biometric authentication support

---

## Role-Based Access Control

AgriHub serves **6 distinct user roles**, each with tailored navigation, features, and data access:

```
+-------------------------------------------------------------------------+
|                    ROLE-BASED NAVIGATION                                 |
+-------------------------------------------------------------------------+
|                                                                         |
|  FARMER (Default)                                                       |
|  +-- Home | AgriGalaxy | Agri | Kisan | Bhoomi                         |
|  +-- Access: Full platform, farming tools, marketplace                  |
|                                                                         |
|  FPO (Farmer Producer Organization)                                     |
|  +-- Home | Agri | Kisan | Bhoomi | Community                          |
|  +-- Access: Collective management, aggregation, reporting              |
|                                                                         |
|  BUYER (Traders, Wholesalers)                                           |
|  +-- Home | AquaOS | Agri | Kisan | Profile                            |
|  +-- Access: Marketplace, inquiries, orders, logistics                  |
|                                                                         |
|  INPUT SUPPLIER (Seeds, Fertilizers, Equipment)                         |
|  +-- Home | AgriGalaxy | AquaOS | Community | Profile                   |
|  +-- Access: Product listings, order fulfillment, analytics             |
|                                                                         |
|  SERVICE PROVIDER (Logistics, Spraying, Lab Testing)                    |
|  +-- Home | Agri | Kisan | Community | Profile                          |
|  +-- Access: Service bookings, calendar, reviews                        |
|                                                                         |
|  AGENT (Field Representatives)                                          |
|  +-- Agent Dashboard with commission tracking                           |
|  +-- Access: Farmer onboarding, transaction facilitation                |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## Internationalization (i18n)

AgriHub supports **3 languages** with full UI translation:

| Language | Code | Native Name | Coverage |
|----------|------|-------------|----------|
| English | `en` | English | 100% |
| Telugu | `te` | తెలుగు | 100% |
| Hindi | `hi` | हिंदी | 100% |

### i18n Features
- Runtime language switching (persisted to localStorage)
- Language picker component in profile/settings
- Server-side translation API (Google Translate / LibreTranslate)
- RTL-ready architecture for future Arabic/Urdu support
- Voice-first UI labels for low-literacy users

---

## Security & Authentication

### Authentication Flow

```
+-----------+     +-----------+     +-----------+     +-----------+
|   User    |     |  Client   |     |  Server   |     |    SMS    |
|   Phone   |---->|   App     |---->|   Auth    |---->|  Gateway  |
+-----------+     +-----------+     +-----------+     +-----------+
                                         |                  |
                                         |     OTP Sent     |
                                         |<-----------------+
                                         |
                                    Verify OTP
                                         |
                                   +-----v-----+
                                   |  JWT +     |
                                   |  Refresh   |
                                   |  Token     |
                                   +-----------+
```

### Security Measures

| Layer | Implementation | Description |
|-------|---------------|-------------|
| **Transport** | HTTPS/TLS | End-to-end encryption |
| **Auth** | JWT + Refresh Tokens | Stateless authentication |
| **Password** | bcryptjs (cost=12) | Salted hash storage |
| **Headers** | Helmet.js | 11+ security headers |
| **Rate Limit** | express-rate-limit | Brute force protection |
| **Input** | express-validator + sanitize | Injection prevention |
| **CSRF** | SameSite cookies + origin check | Cross-site forgery |
| **XSS** | Content-Security-Policy | Script injection prevention |
| **HPP** | hpp middleware | Parameter pollution |
| **Audit** | Audit middleware | Compliance logging |
| **Secrets** | Environment variables | No hardcoded credentials |

### Token Configuration
```
JWT_EXPIRY = 3600           # 1 hour access token
REFRESH_TOKEN_EXPIRY = 604800  # 7 day refresh token
```

---

## Payments & Finance

### Payment Infrastructure

```
+---------------------------------------------------------------------+
|                    PAYMENT ECOSYSTEM                                  |
+---------------------------------------------------------------------+
|                                                                      |
|  +--------------+   +--------------+   +--------------+             |
|  |  Razorpay    |   |   Escrow     |   |   Wallet     |            |
|  |  Gateway     |   |   System     |   |   Engine     |            |
|  |              |   |              |   |              |             |
|  |  - UPI       |   |  - Hold      |   |  - Balance   |            |
|  |  - Cards     |   |  - Release   |   |  - Transfer  |            |
|  |  - NetBanking|   |  - Dispute   |   |  - History   |            |
|  |  - Wallets   |   |  - Refund    |   |  - Top-up    |            |
|  +--------------+   +--------------+   +--------------+             |
|                                                                      |
|  Platform Commission Rate: 3% (configurable)                         |
|                                                                      |
|  +----------------------------------------------------------+       |
|  |  EMBEDDED FINANCE                                          |      |
|  |  - Micro-loans (KCC integration)                           |      |
|  |  - Crop Insurance                                          |      |
|  |  - Credit Scoring (farm data-based)                        |      |
|  |  - Savings Products                                        |      |
|  +----------------------------------------------------------+       |
|                                                                      |
+---------------------------------------------------------------------+
```

---

## Integrations & Third-Party Services

| Category | Service | Purpose |
|----------|---------|---------|
| **Auth/BaaS** | Supabase | Database, Auth, Realtime |
| **SMS/OTP** | MSG91 + Fast2SMS | OTP delivery (primary + fallback) |
| **Payments** | Razorpay | Payment processing |
| **Email** | Resend | Transactional emails |
| **Push** | Firebase Cloud Messaging | Mobile/web push notifications |
| **WhatsApp** | Meta WABA | Business messaging |
| **Search** | Meilisearch | Full-text search engine |
| **Storage** | Cloudflare R2 | Media & document storage |
| **Weather** | OpenWeatherMap | Weather data & forecasts |
| **Maps** | Mapbox | Geolocation & mapping |
| **Market Data** | data.gov.in + eNAM | APMC mandi prices |
| **Feature Flags** | GrowthBook | Gradual feature rollout |
| **Monitoring** | Sentry | Error tracking & performance |
| **Translation** | Google Translate / LibreTranslate | Multi-language support |

---

## Testing Strategy

### Test Architecture

```
tests/
+-- errors.test.js        # Error handling & boundary tests
+-- perf.test.js          # Performance utility tests
+-- ui.test.js            # UI component tests
+-- (backend/)
    +-- tests/
        +-- *.test.js     # API endpoint tests
        +-- trade-flow.test.js  # Integration tests
```

### Running Tests

```bash
# Frontend tests (Vitest)
npm run test              # Single run
npm run test:watch        # Watch mode

# Backend tests (Node.js built-in test runner)
cd backend
npm test                  # All tests
npm run test:trade        # Trade flow integration tests
```

### Test Coverage Goals

| Area | Target | Tools |
|------|--------|-------|
| Unit Tests | 80%+ | Vitest (frontend), Node test runner (backend) |
| Integration | Critical paths | Trade flow, auth flow |
| E2E | Core journeys | Manual + CI screenshots |
| Performance | Load testing | Custom perf utilities |

---

## Docker & DevOps

### Docker Compose Architecture

```
+-----------------------------------------------+
|  services:                                     |
+-----------------------------------------------+
|  postgres     | PostgreSQL 15-Alpine           |
|               | Port: 5455 -> 5432             |
|               | Health: pg_isready             |
+---------------+--------------------------------+
|  redis        | Redis 7-Alpine                 |
|               | Port: 6399 -> 6379             |
|               | Health: redis-cli ping          |
+---------------+--------------------------------+
|  backend      | Node.js API Server             |
|               | Port: 4000                     |
|               | Depends: postgres, redis       |
+---------------+--------------------------------+
```

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Reset database
docker-compose down -v
docker-compose up -d
```

---

## Deployment

### Multi-Platform Deployment

| Platform | Type | Auto-Deploy | Configuration |
|----------|------|-------------|---------------|
| **Vercel** | Frontend | On push to `main` | `vercel.json` |
| **Netlify** | Frontend | On push to `main` | `netlify.toml` |
| **GitHub Pages** | Frontend | Via Actions | `.github/workflows/` |
| **Docker** | Full Stack | Manual | `docker-compose.yml` |

### Live URLs

| Environment | URL |
|-------------|-----|
| Vercel | [aaa-hari888b8s-projects.vercel.app](https://aaa-hari888b8s-projects.vercel.app) |
| GitHub Pages | [hari888b8.github.io/AAA](https://hari888b8.github.io/AAA/) |

### Build Configuration

```bash
# Vercel / Netlify
Build Command:    npm run build
Output Directory: dist
Node Version:     18
Install Command:  npm ci

# SPA Routing: All paths rewrite to /index.html (200)
```

---

## Quick Start Guide

### Prerequisites

| Tool | Version | Required For |
|------|---------|------|
| Node.js | 18+ | All development |
| npm | 9+ | Package management |
| PostgreSQL | 15+ | Backend database |
| Redis | 7+ | Caching & queues |
| Docker | 24+ | Container deployment (optional) |

### Option 1: Quick Development Start

```bash
# 1. Clone the repository
git clone https://github.com/hari888b8/AAA.git
cd AAA

# 2. Install frontend dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start frontend dev server
npm run dev
# Opens at http://localhost:5173

# 5. Install & start backend
cd backend
npm install
npm run migrate       # Run all database migrations
npm run seed          # Seed development data
npm start             # Start API server at :4000
```

### Option 2: Docker (Full Stack)

```bash
# 1. Clone & configure
git clone https://github.com/hari888b8/AAA.git
cd AAA
cp .env.example .env

# 2. Start everything
docker-compose up -d

# 3. Run migrations
docker exec agrihub-api npm run migrate
docker exec agrihub-api npm run seed

# Services running:
# Frontend: http://localhost:5173 (run npm run dev separately)
# Backend:  http://localhost:4000
# Postgres: localhost:5455
# Redis:    localhost:6399
```

### Database Setup (Manual)

```sql
-- In psql or pgAdmin:
CREATE USER "Agrihub" WITH PASSWORD 'postgres' CREATEDB;
CREATE DATABASE "Agrihub" OWNER "Agrihub" ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE "Agrihub" TO "Agrihub";
```

---

## Project Structure

```
AAA/
+-- index.html                    # PWA entry point
+-- package.json                  # Frontend dependencies & scripts
+-- vite.config.js                # Vite build configuration
+-- vercel.json                   # Vercel deployment config
+-- netlify.toml                  # Netlify deployment config
+-- docker-compose.yml            # Container orchestration
+-- .env.example                  # Environment template (35+ vars)
|
+-- src/                          # --- FRONTEND SOURCE ---
|   +-- main.js                   # App entry, routing, init
|   +-- app-shell.js              # Shell: toast, modal, navigation
|   +-- api.js                    # HTTP client (fetch wrapper)
|   +-- store.js                  # Reactive state (pub/sub)
|   +-- i18n.js                   # Internationalization (en/te/hi)
|   +-- payments.js               # Razorpay client integration
|   +-- reviews.js                # Rating & review system
|   +-- tracking.js               # Shipment tracking client
|   |
|   +-- screens/                  # --- 40+ SCREEN MODULES ---
|   |   +-- HomeScreen.js         # Role-based dashboard
|   |   +-- LoginScreen.js        # Phone + OTP authentication
|   |   +-- AgriFlowScreen.js     # Trade marketplace
|   |   +-- AquaOSScreen.js       # Aquaculture dashboard
|   |   +-- KisanConnectScreen.js # Rural services hub
|   |   +-- BhoomiOSScreen.js     # Land management
|   |   +-- AgriGalaxyScreen.js   # Ecosystem marketplace
|   |   +-- IntelligenceScreen.js # AI analytics
|   |   +-- WeatherScreen.js      # Weather advisory
|   |   +-- CropDoctorScreen.js   # AI disease diagnosis
|   |   +-- CropPlanningScreen.js # ML crop recommendations
|   |   +-- SatelliteScreen.js    # NDVI imagery
|   |   +-- FPODashboardScreen.js # FPO management
|   |   +-- WalletScreen.js       # Digital wallet
|   |   +-- EscrowScreen.js       # Secure payments
|   |   +-- FinanceScreen.js      # Loans & insurance
|   |   +-- ... (25+ more)
|   |   +-- AnalyticsScreen.js    # Business intelligence
|   |
|   +-- components/               # --- SHARED UI ---
|   |   +-- ui.js                 # Card, button, list components
|   |   +-- LanguagePicker.js     # i18n language selector
|   |
|   +-- integrations/             # --- EXTERNAL APIS ---
|   |   +-- maps.js               # Mapbox integration
|   |   +-- payments.js           # Razorpay SDK wrapper
|   |
|   +-- styles/                   # --- DESIGN SYSTEM ---
|   |   +-- variables.css         # Design tokens
|   |   +-- base.css              # Reset & typography
|   |   +-- components.css        # Component styles
|   |   +-- pages.css             # Page-specific styles
|   |   +-- animations.css        # Transitions & keyframes
|   |   +-- functional.css        # Utility classes
|   |   +-- switcher.css          # Theme switching
|   |   +-- app.css               # Main stylesheet (imports all)
|   |
|   +-- utils/                    # --- UTILITIES ---
|       +-- errors.js             # Error boundary & reporting
|       +-- perf.js               # Performance (lazy load, etc)
|       +-- offline.js            # Offline detection & sync
|       +-- pullRefresh.js        # Pull-to-refresh gesture
|
+-- backend/                      # --- BACKEND SERVER ---
|   +-- package.json              # Server dependencies
|   +-- Dockerfile                # Container image
|   +-- setup-db.js               # Database bootstrapping
|   |
|   +-- src/
|   |   +-- index.js              # Express server entry
|   |   +-- scheduler.js          # Cron job scheduler
|   |   |
|   |   +-- routes/               # --- 76 API ROUTE FILES ---
|   |   |   +-- auth.js           # Authentication
|   |   |   +-- agriflow.js       # Trade operations
|   |   |   +-- aquaos.js         # Aquaculture V1
|   |   |   +-- aquaos-v2.js      # Aquaculture V2
|   |   |   +-- ...               # aquaos-v3 through v11
|   |   |   +-- aquaos-v11.js     # Contract aquaculture
|   |   |   +-- warehouse.js      # Warehouse management
|   |   |   +-- trade.js          # Trade state machine
|   |   |   +-- vehicles.js       # Vehicle fleet (ROS)
|   |   |   +-- delivery.js       # Delivery tracking (ROS)
|   |   |   +-- gigworkers.js     # Gig marketplace (ROS)
|   |   |   +-- transport.js      # Transport booking (ROS)
|   |   |   +-- galaxy.js         # Galaxy discovery
|   |   |   +-- compliance.js     # DPDP compliance
|   |   |   +-- kyc.js            # KYC verification
|   |   |   +-- ai-predictions.js # AI prediction engine
|   |   |   +-- enam.js           # eNAM/NABARD/SFAC
|   |   |   +-- kisanconnect.js   # Rural services
|   |   |   +-- bhoomios.js       # Land management
|   |   |   +-- intelligence.js   # AI/Analytics
|   |   |   +-- payments.js       # Payment processing
|   |   |   +-- wallet.js         # Wallet operations
|   |   |   +-- escrow.js         # Escrow management
|   |   |   +-- ... (50+ more)
|   |   |   +-- openapi.js        # API documentation
|   |   |
|   |   +-- services/             # --- BUSINESS LOGIC ---
|   |   |   +-- payments.js       # Razorpay service
|   |   |   +-- sms.js            # OTP delivery
|   |   |   +-- push.js           # Push notifications
|   |   |   +-- weather.js        # Weather data
|   |   |   +-- cache.js          # Redis caching
|   |   |   +-- queue.js          # Job queue
|   |   |   +-- storage.js        # File storage (R2)
|   |   |   +-- translate.js      # Translation service
|   |   |   +-- websocket.js      # Real-time messaging
|   |   |   +-- apmc.js           # Market data
|   |   |   +-- audit.js          # Audit logging
|   |   |   +-- fraudDetection.js # Fraud detection engine
|   |   |   +-- matching.js       # Vehicle-delivery matching
|   |   |   +-- eventBus.js       # Internal event bus
|   |   |
|   |   +-- middleware/            # --- REQUEST PIPELINE ---
|   |   |   +-- auth.js           # JWT verification
|   |   |   +-- errorHandler.js   # Error formatting
|   |   |   +-- requestId.js      # Request tracing
|   |   |   +-- sanitize.js       # Input cleaning
|   |   |   +-- validate.js       # Schema validation
|   |   |   +-- rateLimiters.js   # Per-route rate limits
|   |   |   +-- dpdp.js           # DPDP data protection
|   |   |
|   |   +-- db/                   # --- DATABASE ---
|   |   |   +-- pool.js           # Connection pool
|   |   |   +-- transaction.js    # Transaction helper
|   |   |   +-- migrate.js -> v24 # 24 migration files
|   |   |   +-- seed.js           # Development data
|   |   |
|   |   +-- lib/                  # --- SHARED LIBS ---
|   |       +-- logger.js         # Pino logger config
|   |       +-- config.js         # Centralized config
|   |
|   +-- tests/                    # Backend test suites
|
+-- android/                      # --- NATIVE ANDROID ---
|   +-- build.gradle.kts          # Gradle build config
|   +-- settings.gradle.kts       # Module settings
|   +-- app/                      # Application module
|       +-- src/                  # Kotlin source + resources
|
+-- supabase/                     # --- SUPABASE MIGRATIONS ---
|   +-- migrations/
|       +-- 001_foundation.sql    # Core schema
|       +-- 002_complete_platform.sql  # Full platform
|
+-- tests/                        # --- FRONTEND TESTS ---
|   +-- errors.test.js
|   +-- perf.test.js
|   +-- ui.test.js
|
+-- screenshots/                  # --- APP SCREENSHOTS (35+) ---
+-- public/                       # Static assets (PWA manifest, sw.js)
+-- .github/                      # CI/CD workflows
```

---

## Environment Configuration

AgriHub uses **35+ environment variables** for full configuration. All documented in `.env.example`:

<details>
<summary><strong>Click to see all environment variables</strong></summary>

### Authentication & BaaS
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side service role |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `JWT_EXPIRY` | Default | Access token TTL (default: 3600s) |
| `REFRESH_TOKEN_EXPIRY` | Default | Refresh token TTL (default: 604800s) |

### SMS & OTP
| Variable | Required | Description |
|----------|----------|-------------|
| `MSG91_AUTH_KEY` | Yes | MSG91 authentication key |
| `MSG91_TEMPLATE_ID` | Yes | OTP template ID |
| `MSG91_SENDER_ID` | Default | Sender ID (default: AGRIHB) |
| `FAST2SMS_API_KEY` | Optional | Fallback SMS provider |

### Payments
| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Webhook verification |
| `PLATFORM_COMMISSION_RATE` | Default | Commission (default: 0.03) |

### Database & Cache
| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_HOST` | Yes | PostgreSQL host |
| `POSTGRES_PORT` | Default | Port (default: 5432) |
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `REDIS_HOST` | Yes | Redis host |
| `REDIS_PORT` | Default | Redis port (default: 6379) |

### External Services
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENWEATHERMAP_API_KEY` | Optional | Weather data |
| `MAPBOX_ACCESS_TOKEN` | Optional | Maps & geolocation |
| `FIREBASE_PROJECT_ID` | Optional | Push notifications |
| `RESEND_API_KEY` | Optional | Email delivery |
| `WHATSAPP_ACCESS_TOKEN` | Optional | WhatsApp messaging |
| `MEILISEARCH_HOST` | Optional | Search engine |
| `R2_ACCESS_KEY_ID` | Optional | File storage |
| `SENTRY_DSN` | Optional | Error monitoring |
| `GROWTHBOOK_CLIENT_KEY` | Optional | Feature flags |
| `DATA_GOV_API_KEY` | Optional | APMC market data |

</details>

---

## API Documentation

### OpenAPI / Swagger

The backend exposes an OpenAPI specification via the `/api/docs` route (defined in `routes/openapi.js`).

### Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "requestId": "uuid-v4"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": [
      { "field": "phone", "message": "Must be 10-digit Indian mobile number" }
    ]
  },
  "meta": {
    "requestId": "uuid-v4"
  }
}
```

### WebSocket Events

```javascript
// Connection
ws://localhost:4000/ws?token=<jwt>

// Events
{ type: "chat:message",     data: { from, to, text, timestamp } }
{ type: "price:update",     data: { commodity, mandi, price } }
{ type: "order:status",     data: { orderId, status, timestamp } }
{ type: "notification:new", data: { title, body, action } }
```

---

## Roadmap

### Phase 1: Foundation (Completed)
- [x] Multi-platform Super-App architecture
- [x] Authentication (Phone + OTP)
- [x] Role-based access control (6 roles)
- [x] AgriFlow trade marketplace
- [x] AquaOS aquaculture module
- [x] KisanConnect rural services
- [x] Community & social features
- [x] Multi-language support (en/te/hi)
- [x] PWA with offline support
- [x] Docker containerization

### Phase 2: Intelligence Engine (Completed)
- [x] Price intelligence & forecasting
- [x] Demand analytics
- [x] Crop planning AI
- [x] Weather integration
- [x] Satellite imagery (NDVI)
- [x] Crop Doctor (disease diagnosis)
- [x] Scheme discovery AI

### Phase 3: Finance & Trust (Completed)
- [x] Razorpay payment integration
- [x] Digital wallet system
- [x] Escrow-based transactions
- [x] Trust score & reputation
- [x] Subscription plans
- [x] Contract farming module

### Phase 4: Ecosystem Expansion (Completed)
- [x] BhoomiOS land management
- [x] AgriGalaxy marketplace
- [x] FPO dashboard
- [x] Agent network
- [x] Export hub
- [x] Logistics tracking
- [x] Farm diary
- [x] Analytics dashboard

### Phase 5: KisanConnect 2.0 Rural Operating System (Completed)
- [x] Vehicle fleet management
- [x] Transport booking & matching engine
- [x] Last-mile delivery tracking
- [x] Gig worker marketplace
- [x] Matching service (proximity, availability, load)

### Phase 6: AquaOS V2-V10 Full Ecosystem (Completed)
- [x] AquaOS V2: Financial tracking, disease, PMMSY, cold chain, training, auctions
- [x] AquaOS V3: RFQ system, escrow, yield forecasting (Von Bertalanffy)
- [x] AquaOS V4: Culture units, harvest optimizer, IoT, trust verification
- [x] AquaOS V5: Advanced KPI engine, predictive models, B2B marketplace
- [x] AquaOS V6: Fish marketplace, traceability, PMMSY DPR, supplier directory
- [x] AquaOS V7: Reviews, logistics+, training curriculum, ODR, trade credit
- [x] AquaOS V8: Role-based ecosystem, crop posts, community, platform analytics
- [x] AquaOS V9: Privacy controls, negotiation rooms, admin panel, security
- [x] AquaOS V10: AI predictions, Razorpay payments, pricing intelligence, chat, IoT

### Phase 7: Galaxy Discovery & Platform Readiness (Completed)
- [x] Galaxy discovery module (cross-vertical marketplace)
- [x] 18 galaxy/portfolio screens for all verticals
- [x] Performance indexes (GIN, B-tree) for full-text search
- [x] DPDP compliance module
- [x] KYC verification workflows
- [x] AI prediction engine (disease, yield, price, demand, feed)
- [x] eNAM / NABARD / SFAC national integrations

### Phase 8: AquaOS V11 & Warehouse (Completed)
- [x] Contract aquaculture with digital signing
- [x] Labor management & attendance tracking
- [x] Insurance products/policies/claims (5 products)
- [x] Export compliance (MPEDA/EU/FDA) with lab results
- [x] Multi-farm portfolio with cross-farm financials
- [x] Aqua input supply chain (8 AP suppliers)
- [x] Harvest planning & scheduling
- [x] Warehouse management system (8 AP cold storages)

### Phase 9: Scale & Advanced AI (Upcoming)
- [ ] Voice-first interface (regional languages)
- [ ] Computer vision (shrimp/fish size estimation)
- [ ] Automated IoT feeding systems
- [ ] Satellite pond monitoring (NDVI algal bloom)
- [ ] Blockchain immutable traceability
- [ ] International expansion beyond India
- [ ] Advanced credit scoring from farm data
- [ ] Drone imagery integration

---

## Performance & Optimization

| Metric | Target | Implementation |
|--------|--------|---------------|
| **First Paint** | < 1.5s | Vite code splitting, preload hints |
| **TTI** | < 3s | Deferred hydration, lazy images |
| **Bundle Size** | < 200KB gzipped | Tree shaking, no framework overhead |
| **API Response** | < 200ms p95 | Redis caching, connection pooling |
| **Offline** | Full PWA | Service worker with cache-first strategy |
| **Images** | Lazy loaded | Intersection Observer API |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| No React/Vue | Vanilla JS | Minimal bundle, max performance, rural networks |
| PostgreSQL | Over MongoDB | ACID compliance, complex joins for trade engine |
| Redis | Cache + Queue | Sub-ms reads, pub/sub for real-time features |
| Vite | Over Webpack | 10x faster builds, native ESM support |
| JWT | Over sessions | Stateless auth, mobile-friendly |
| Supabase | BaaS layer | Real-time, auth fallback, quick prototyping |
| Monorepo | Single repo | Shared config, atomic deploys, unified CI |

---

## Contributing

We welcome contributions! Here is how to get started:

### Development Workflow

```bash
# 1. Fork & clone
git clone https://github.com/your-username/AAA.git
cd AAA

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Install dependencies
npm install
cd backend && npm install && cd ..

# 4. Make changes & test
npm run test
cd backend && npm test && cd ..

# 5. Commit with conventional commits
git commit -m "feat: add voice input for crop doctor"

# 6. Push & create PR
git push origin feature/your-feature-name
```

### Commit Convention

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting (no logic change) |
| `refactor:` | Code restructuring |
| `test:` | Adding tests |
| `chore:` | Maintenance |
| `perf:` | Performance improvement |

### Architecture Guidelines

- **Screens** are self-contained modules (single export function)
- **Services** encapsulate all third-party API calls
- **Middleware** handles cross-cutting concerns
- **Store** uses pub/sub pattern (no framework dependency)
- **CSS** follows BEM-inspired naming with design tokens
- **i18n** keys use snake_case matching route names

---

## Tech Stack Summary

```
+-------------------------------------------------------------------------+
|                         TECHNOLOGY ECOSYSTEM                             |
+-------------------------------------------------------------------------+
|                                                                         |
|  FRONTEND          |  BACKEND           |  DATA              | DEVOPS   |
|  ---------         |  -------           |  ----              | ------   |
|  Vite 6            |  Node.js 18+       |  PostgreSQL 15     | Docker   |
|  Vanilla JS (ES6+) |  Express 4.21      |  Redis 7           | GitHub CI|
|  CSS Custom Props  |  JWT + bcrypt      |  Supabase          | Vercel   |
|  Service Worker    |  WebSocket (ws)    |  Meilisearch       | Netlify  |
|  Web APIs          |  Pino logging      |  Cloudflare R2     | GH Pages |
|  Inter Font        |  express-validator |  24 migrations     | Sentry   |
|  73+ Screens       |  Helmet + HPP      |  130+ tables       | GrowthBk |
|                    |  76 route files    |                    |          |
|  ANDROID           |  INTEGRATIONS      |  AI/ML             | COMMS    |
|  -------           |  ------------      |  ----              | -----    |
|  Kotlin            |  Razorpay          |  Price Forecast    | MSG91    |
|  Jetpack Compose   |  Mapbox            |  Crop Planning     | Fast2SMS |
|  Material 3        |  OpenWeatherMap    |  Disease Detect    | Firebase |
|  Gradle KTS        |  data.gov.in       |  Scheme Match      | WhatsApp |
|  Hilt DI           |  Google Translate  |  Demand Analysis   | Resend   |
|                    |  eNAM / NABARD     |  Yield Forecast    |          |
|                    |  MPEDA / APEDA     |  Feed Optimization |          |
|                    |                    |                    |          |
+-------------------------------------------------------------------------+
```

---

## License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with love for Indian Agriculture**

*Empowering 145M+ farmers through technology*

---

**AgriHub** — India's Agriculture Operating System

[Report Bug](https://github.com/hari888b8/AAA/issues) | [Request Feature](https://github.com/hari888b8/AAA/issues)

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer" width="100%"/>

</div>

---

---

<div align="center">

# 📋 PROJECT MASTER AUDIT DOCUMENT

**Complete Platform Analysis & Audit Report — v1.0 (May 2026)**

</div>

---

# 1. PROJECT OVERVIEW

## App / Platform Name
**AgriHub** — India's Agriculture Operating System

## Tagline
A unified Agriculture Operating System connecting 145M+ farmers, 10,000+ FPOs, traders, exporters, input suppliers, banks, and logistics providers on ONE digital platform.

## Problem Statement
India's agricultural ecosystem is fragmented — farmers lack access to fair markets, real-time intelligence, financial services, and modern logistics. Multiple disconnected apps serve individual needs (mandis, weather, schemes) but no unified platform connects all stakeholders (farmers, FPOs, buyers, exporters, logistics, banks) end-to-end. AgriHub solves this by creating a single operating system for the entire agriculture value chain.

## Industry / Domain
- **Primary:** Agriculture / AgriTech
- **Sub-domains:** Aquaculture, Logistics, Marketplace, Fintech, PropTech, SaaS
- **Cross-cutting:** AI/ML, IoT, Government Integration, Supply Chain

## Business Type
- **B2B2C** (Farmers ↔ FPOs ↔ Buyers/Exporters)
- **Marketplace** (AgriFlow trade engine)
- **SaaS** (AquaOS for aquaculture farmers)
- **Commission model** (Trade escrow, payments)
- **Subscription** (Premium features, analytics)

## Target Users

| User Type | Description | Count (India) |
|-----------|-------------|---------------|
| **Farmers** | Smallholder & commercial farmers | 145M+ |
| **FPOs** | Farmer Producer Organizations | 10,000+ |
| **Aquaculture Farmers** | Shrimp/fish farmers (Andhra Pradesh focus) | 1M+ |
| **Buyers/Traders** | Wholesale buyers, commission agents | 500K+ |
| **Exporters** | Agricultural commodity exporters | 50K+ |
| **Input Suppliers** | Seeds, feed, fertilizer sellers | 200K+ |
| **Logistics Providers** | Cold chain, transport operators | 100K+ |
| **Banks/NBFCs** | Agricultural lenders | 500+ |
| **Government** | NABARD, SFAC, eNAM officials | — |
| **Gig Workers** | Delivery partners, field agents | 50K+ |
| **Admins** | Platform administrators | — |

## Countries / Regions Targeted
- **Current:** India (Andhra Pradesh — pilot state)
- **Phase 2:** All Indian coastal states (aquaculture)
- **Phase 3:** Pan-India (all agriculture)
- **Future:** South-East Asia, Africa (emerging markets)

## Current Project Status
**MVP → Beta** — Feature-complete platform with 76+ API routes, 72+ screens, native Android app, 25 database migrations, 130+ tables. Ready for pilot deployment.

## Main Business Goals
1. Become India's default agriculture operating system
2. Digitize 10,000+ FPOs in Year 1
3. Enable ₹10,000 Cr+ GMV through trade engine
4. Reduce post-harvest losses by 30% through intelligence
5. Achieve 1M+ active farmers in pilot state
6. Government scheme delivery through digital rails

## Main Revenue Model
| Revenue Stream | Model | Target |
|---------------|-------|--------|
| Trade commission | 1-2% per transaction | ₹100 Cr/year at scale |
| SaaS subscriptions | ₹99-999/month | Aquaculture, FPO tools |
| Financial services | Lead gen + commission | Insurance, credit |
| Data/Intelligence | Enterprise API access | Exporters, FMCG |
| Input marketplace | Seller commission | Seeds, feed, chemicals |
| Warehouse fees | Storage + quality testing | Per-quintal charges |
| Premium features | Freemium upgrade | Advanced analytics |

## Core USP (Unique Selling Point)
1. **Only unified platform** connecting ALL agriculture stakeholders end-to-end
2. **AquaOS** — World's most comprehensive aquaculture management system (11 versions)
3. **Full trade state machine** — escrow-protected B2B commerce
4. **AI/ML intelligence** — Price forecasting, disease detection, yield prediction
5. **Government integration** — eNAM, NABARD, MPEDA, PMMSY built-in
6. **Multi-language** — Telugu, Hindi, English (12 planned)
7. **Offline-first** — Works in rural areas with poor connectivity

---

# 2. COMPLETE FEATURE LIST

## Existing Features

### User/Farmer Features
- Phone OTP signup/login with role selection
- Multi-language interface (Telugu, Hindi, English)
- Farm diary with activity logging, expense tracking, yield recording
- Crop lifecycle management and planning
- Weather forecasts with alerts
- Government scheme discovery with auto-eligibility matching
- Marketplace listings (create, browse, negotiate)
- Wallet with transactions history
- Order tracking with status updates
- Community posts, Q&A, knowledge sharing
- Voice assistant (planned)
- Satellite-based crop monitoring
- Training modules and certifications
- Trust score system
- Favorites and watchlists
- Push notifications
- Referral system

### Vendor/Seller/Buyer Features
- Buyer discovery and advanced search
- Trade order flow (bid → accept → escrow → verify → deliver → pay)
- Quality verification with photo/GPS evidence
- Watchlists for crops/regions
- Demand posting and price alerts
- Exporter compliance dashboard
- Contract farming agreements
- Bulk order management
- Cold chain logistics booking

### FPO Features
- Member management
- Collective procurement
- Inventory management
- Financial tracking
- Compliance dashboard
- Training management
- Market intelligence dashboard
- Portfolio analytics

### AquaOS (Aquaculture) Features
- Pond/farm management (culture units: pond, RAS, cage, biofloc, hatchery)
- Water quality monitoring with IoT integration
- Feed management with FCR calculation
- Harvest optimization with price-size models
- Disease detection and reporting
- Financial tracking per-pond
- PMMSY scheme integration
- Fish marketplace (auction, RFQ, fixed-price)
- Cold chain logistics with temperature monitoring
- Farm-to-fork traceability (QR + blockchain CTEs)
- Supplier directory (27+ national suppliers)
- B2B supply marketplace
- Von Bertalanffy growth predictions
- Advanced KPI engine (SGR, ADG, FCR)
- Alert engine (water/growth/mortality/feed thresholds)
- Verified seller reviews with badges
- Logistics providers with IoT temp monitoring
- Online dispute resolution (3-tier)
- Trade credit with net terms
- Training library (multi-language, ICAR-CIFA/ASCI)
- Vessel monitoring (VMS for IUU compliance)
- Role-based ecosystem (farmer, buyer, agent)
- Community discussions
- Market prices (multi-district)
- Supply forecasting
- Expert advisory directory
- 7-step workflow tracking
- Privacy controls (per-field visibility)
- Real-time negotiation rooms
- Production data insights
- Admin panel with full analytics
- Razorpay payment integration
- Pricing intelligence (14 AP markets)
- Chat rooms/messaging
- AI prediction engine (disease, yield, feed, price)
- Growth metrics targeting 4 districts
- IoT sensor data ingestion
- Monetization configuration
- Contract aquaculture (sign/status)
- Labor management (attendance/costs)
- Insurance products/policies/claims
- Export compliance (MPEDA/EU/FDA)
- Multi-farm portfolio management
- Aqua input supply chain
- Harvest planning/scheduling

### KisanConnect (Rural OS) Features
- Vehicle marketplace (rent/buy/sell)
- Transport booking and tracking
- Delivery management
- Gig worker marketplace
- Equipment matching service
- Rural services hub

### FarmerConnect (PropTech) Features
- Agricultural land marketplace
- Property listings with geo-tagging
- Buyer-seller matching
- Land lease management

### Admin Features
- User management
- Verification queue
- Fraud detection and alerts
- Platform analytics dashboard
- Content moderation
- Scheme management
- Rate limiting controls
- Audit logging
- System health monitoring
- Revenue analytics

### AI/ML Features
- Price prediction (ARIMA-based)
- Disease detection (crop + aqua)
- Yield forecasting
- Demand analysis
- Feed optimization (aquaculture)
- Scheme matching engine
- Smart notifications
- Satellite imagery analysis (NDVI)
- Supply-demand forecasting
- Crop planning recommendations

### Delivery/Agent Features
- Gig worker profiles
- Job matching algorithm
- Route optimization
- Delivery status tracking
- Earnings dashboard
- Rating system

---

## Feature Status

| Feature | Status | Platform | Notes |
|---------|--------|----------|-------|
| Phone OTP Login | Working | All | JWT + bcrypt auth |
| User Onboarding | Working | All | Role-based flow |
| Farm Diary | Working | Web + Android | Full CRUD |
| Crop Planning | Working | Web | AI-assisted |
| Weather | Working | All | OpenWeatherMap API |
| Scheme Discovery | Working | Web | Auto-eligibility |
| AgriFlow Marketplace | Working | Web | Full trade FSM |
| Trade Escrow | Working | Backend | 8-state machine |
| Wallet | Working | Web | Full transaction history |
| Order Tracking | Working | Web + Android | Real-time status |
| Community | Working | Web | Posts, Q&A |
| AquaOS Core | Working | Web + Android | V1-V11 complete |
| AquaOS Payments | Working | Backend | Razorpay integrated |
| AquaOS AI Predictions | Working | Backend | 4 models |
| Fish Marketplace | Working | Web | Auction + RFQ |
| Cold Chain Monitoring | Working | Backend | IoT + alerts |
| KisanConnect | Working | Web | Vehicles + transport |
| FarmerConnect | Working | Web | Land marketplace |
| Notifications | Working | Backend | FCM + SMS |
| Admin Panel | Working | Web | Full dashboard |
| Satellite Monitoring | Working | Backend | NDVI analysis |
| Warehouse Management | Working | Backend | Booking + quality |
| Export Compliance | Working | Backend | MPEDA/EU/FDA |
| Voice Assistant | Planned | — | Telugu/Hindi STT |
| Offline Mode | Partial | Android | Room DB caching |
| Video Consultations | Planned | — | Expert advisory |
| WhatsApp Commerce | Planned | — | Bot integration |
| Multi-language | Partial | Web | EN/TE/HI done, 9 more planned |
| Payment Gateway (User) | Working | Backend | Razorpay |
| Insurance Claims | Working | Backend | AquaOS V11 |
| Blockchain Traceability | Partial | Backend | CTE structure ready |
| Analytics Dashboard | Working | Web + Backend | Multiple views |
| CI/CD Pipeline | Working | GitHub Actions | Auto-deploy |

---

# 3. COMPLETE USER FLOW

## Farmer Journey

```
User opens app (PWA or Android)
→ Language selection (Telugu/Hindi/English)
→ Phone number entry
→ OTP verification (MSG91/Fast2SMS)
→ Role selection (Farmer/Buyer/FPO/Agent)
→ Profile setup (name, village, district, land details)
→ Crop selection & farm mapping
→ Homepage (personalized dashboard)
  → Weather widget (7-day forecast + alerts)
  → Market prices (nearby mandis)
  → Scheme recommendations
  → Community feed
→ Farm Diary (log activities, expenses, yields)
→ Crop Planning (AI recommendations based on soil, weather, market)
→ Marketplace
  → Create listing (crop, quantity, quality, price, photos)
  → Receive inquiries from buyers
  → Negotiate (counter-offer)
  → Accept trade order
  → Escrow funded by buyer
  → Quality verification (photos + GPS)
  → Dispatch & delivery
  → Payment released to wallet
→ Wallet → Bank withdrawal
→ Training modules
→ Scheme applications
→ Community engagement
→ Trust score improves over time
```

## Buyer/Trader Journey

```
Buyer registration → Phone OTP → Role: Buyer
→ KYC verification (GST, FSSAI, trade license)
→ Homepage (supply intelligence dashboard)
→ Search/Browse listings
  → Filter by crop, district, quantity, quality
  → View farmer trust scores
→ Express interest / Place bid
→ Negotiate (real-time room)
→ Create trade order
→ Fund escrow
→ Await quality verification
→ Confirm receipt
→ Payment auto-released
→ Rate farmer
→ Watchlists for future procurement
→ Demand posting (what they need)
→ Analytics (price trends, supply forecasts)
```

## FPO Journey

```
FPO admin registration → Verification (SFAC/NABARD)
→ Organization setup (members, villages, crops)
→ Member management (add/remove farmers)
→ Collective procurement planning
→ Aggregate supply from members
→ Create bulk listings
→ Negotiate with multiple buyers
→ Contract farming agreements
→ Financial management (member payouts)
→ Compliance reporting
→ Training coordination
→ Scheme facilitation
→ Portfolio analytics
```

## Aquaculture Farmer Journey

```
Registration → Role: Aqua Farmer
→ Farm setup (location, water source, area)
→ Pond/Unit creation (pond, RAS, cage, biofloc)
→ Production cycle start
  → Species selection + stocking
  → Daily feed logging
  → Water quality recording (DO, pH, ammonia, temp)
  → Growth sampling
→ IoT sensor integration (auto-logging)
→ AI alerts (disease risk, water quality issues)
→ Harvest planning (optimal size-price timing)
→ Create marketplace listing
→ Receive buyer offers
→ Quality grading (BIS standards)
→ Cold chain booking
→ Traceability QR generation
→ Export compliance (if applicable)
→ Payment + financial tracking
→ Insurance claims (if loss)
→ PMMSY DPR submission (subsidy)
```

## Admin Workflow

```
Admin login → Dashboard (KPIs overview)
→ User management (approve, suspend, verify)
→ Verification queue (documents, KYC)
→ Content moderation (flagged posts)
→ Fraud detection alerts
→ Platform analytics (users, trades, revenue)
→ Scheme management (create, update)
→ Rate limit monitoring
→ System health checks
→ Revenue tracking
→ Support ticket management
→ Audit log review
```

## Delivery/Gig Worker Journey

```
Registration → Role: Gig Worker
→ Profile setup (vehicle type, service area)
→ Job matching (algorithm assigns nearby jobs)
→ Accept delivery request
→ Navigate to pickup (GPS)
→ Confirm pickup (photo + signature)
→ Transit tracking (live location)
→ Deliver to buyer
→ Confirm delivery (OTP + photo)
→ Payment credited
→ Rating received
```

---

# 4. APP PLATFORMS

## Available Platforms

| Platform | Status | Technology | Notes |
|----------|--------|-----------|-------|
| **Web (PWA)** | ✅ Production | Vite 6 + Vanilla JS | Offline-capable, installable |
| **Android** | ✅ Production | Kotlin + Jetpack Compose | Native Material 3 |
| **iOS** | 🔄 Planned | — | Will share Kotlin Multiplatform |
| **Desktop** | ✅ Via PWA | Same as Web | Installable PWA |

## Android App Details
- **Type:** Native Android (Kotlin)
- **UI:** Jetpack Compose + Material 3
- **Architecture:** MVVM + Clean Architecture
- **DI:** Hilt
- **Local DB:** Room (offline support)
- **Networking:** Retrofit + OkHttp
- **Navigation:** Compose Navigation

## Web App Details
- **Type:** Progressive Web App (PWA)
- **Build Tool:** Vite 6.3
- **Language:** Vanilla JavaScript (ES6+)
- **Styling:** CSS Custom Properties
- **State:** URL-based routing, module-scoped
- **Offline:** Service Worker + IndexedDB

---

# 5. COMPLETE TECH STACK

## Frontend (Web)
- **Framework:** Vanilla JavaScript (ES6 modules) — No React/Vue dependency
- **Build:** Vite 6.3+ with HMR
- **Styling:** CSS Custom Properties (design tokens), no framework
- **Fonts:** Inter (Google Fonts)
- **PWA:** Service Worker, Web App Manifest
- **APIs:** Fetch API, Web APIs
- **Screens:** 72+ feature screens

## Frontend (Android)
- **Language:** Kotlin
- **UI:** Jetpack Compose
- **Design:** Material 3 / Material You
- **DI:** Hilt (Dagger)
- **Architecture:** MVVM
- **Local DB:** Room
- **Build:** Gradle KTS

## Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.21
- **Language:** JavaScript (CommonJS)
- **Auth:** JWT + bcryptjs
- **Validation:** express-validator
- **Logging:** Pino + pino-http + Morgan
- **Security:** Helmet, HPP, express-rate-limit, CORS
- **WebSocket:** ws (native WebSocket)
- **API Docs:** OpenAPI/Swagger
- **Process:** Single process (Docker)

## Database
- **Primary:** PostgreSQL 15+ (Supabase hosted)
- **Cache:** Redis 7.x (session, rate limiting, pub/sub)
- **Search:** PostgreSQL GIN indexes (full-text)
- **Migrations:** 25 versioned migration files
- **Tables:** 130+ tables
- **ORM:** Raw SQL (pg driver) — no ORM overhead

## Authentication
- **Method:** Phone OTP (SMS) → JWT token
- **Token:** JWT with role claims
- **Password:** bcryptjs hashed (fallback)
- **Sessions:** Stateless (JWT) + Redis for revocation
- **Roles:** farmer, buyer, fpo, admin, agent, gig_worker, exporter

## Hosting / Infrastructure
| Component | Provider | Notes |
|-----------|----------|-------|
| Frontend | Vercel + Netlify | CDN, auto-deploy from GitHub |
| Backend | Docker / Railway | Containerized Express |
| Database | Supabase (PostgreSQL) | Managed, auto-backups |
| Cache | Redis (Upstash/Railway) | Serverless Redis |
| Storage | Cloudflare R2 | S3-compatible, zero egress |
| CDN | Vercel Edge | Global distribution |
| DNS | Cloudflare | DDoS protection |
| CI/CD | GitHub Actions | Auto-build + deploy |
| Monitoring | Sentry + custom | Error tracking |
| Analytics | Firebase + custom | User analytics |

## Storage
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Images:** Cloudflare R2 + CDN
- **Documents:** Cloudflare R2 (KYC, agreements)
- **Backups:** Supabase automated daily

## APIs & External Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Razorpay** | Payment processing | ✅ Integrated |
| **Mapbox** | Maps, geocoding, routing | ✅ Integrated |
| **OpenWeatherMap** | Weather forecasts | ✅ Integrated |
| **MSG91** | SMS OTP delivery | ✅ Integrated |
| **Fast2SMS** | Backup SMS provider | ✅ Integrated |
| **Firebase** | Push notifications, analytics | ✅ Integrated |
| **Google Translate** | Multi-language translation | ✅ Integrated |
| **data.gov.in** | Government data APIs | ✅ Integrated |
| **eNAM** | National agriculture market | ✅ Integrated |
| **NABARD** | Financial scheme data | ✅ Integrated |
| **MPEDA** | Export compliance | ✅ Integrated |
| **APEDA** | Export certification | ✅ Integrated |
| **Supabase** | Auth + Database + Storage | ✅ Integrated |
| **Sentry** | Error monitoring | ✅ Integrated |
| **Resend** | Transactional emails | ✅ Integrated |
| **WhatsApp API** | Notifications (planned) | 🔄 Planned |
| **OpenAI** | AI features (planned) | 🔄 Planned |

---

# 6. PROJECT STRUCTURE

```
AAA/
├── backend/                     # Express.js API server
│   ├── src/
│   │   ├── index.js            # App entry point + middleware
│   │   ├── routes/             # 76 route files
│   │   │   ├── auth.js         # Authentication
│   │   │   ├── agriflow.js     # Core marketplace
│   │   │   ├── trade.js        # Trade state machine
│   │   │   ├── aquaos.js       # AquaOS V1
│   │   │   ├── aquaos-v2.js    # ... through V11
│   │   │   ├── aquaos-v11.js   # Contract + Enterprise
│   │   │   ├── warehouse.js    # Warehouse management
│   │   │   ├── intelligence.js # AI/ML endpoints
│   │   │   ├── satellite.js    # Remote sensing
│   │   │   ├── payments.js     # Razorpay integration
│   │   │   └── ... (76 total)
│   │   ├── services/           # Business logic services
│   │   │   ├── payments.js     # Payment processing
│   │   │   ├── fraudDetection.js # Fraud AI
│   │   │   ├── matching.js     # Gig worker matching
│   │   │   ├── weather.js      # Weather aggregation
│   │   │   ├── eventBus.js     # Event-driven comms
│   │   │   ├── push.js         # Push notifications
│   │   │   ├── sms.js          # SMS service
│   │   │   ├── cache.js        # Redis caching
│   │   │   ├── queue.js        # Job queue
│   │   │   ├── translate.js    # Translation service
│   │   │   ├── websocket.js    # Real-time comms
│   │   │   └── audit.js        # Audit logging
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── rateLimiters.js # Rate limiting
│   │   │   ├── dpdp.js         # Data privacy (India DPDP)
│   │   │   ├── sanitize.js     # Input sanitization
│   │   │   ├── validate.js     # Request validation
│   │   │   └── errorHandler.js # Global error handling
│   │   ├── db/                 # Database layer
│   │   │   ├── pool.js         # Connection pool
│   │   │   ├── migrate.js      # V1 migration
│   │   │   ├── migrate-v2.js   # ... through V24
│   │   │   └── seed.js         # Seed data
│   │   └── lib/                # Shared utilities
│   ├── Dockerfile
│   └── package.json
├── src/                        # Frontend PWA
│   ├── main.js                 # Router + app shell
│   ├── screens/                # 72+ screen modules
│   ├── components/             # Reusable UI components
│   ├── integrations/           # API clients
│   ├── utils/                  # Utilities
│   └── styles/                 # CSS modules
├── android/                    # Native Android app
│   ├── app/src/main/java/com/agrihub/app/
│   │   ├── MainActivity.kt
│   │   ├── ui/                 # Compose screens
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── agriflow/
│   │   │   ├── aquaos/
│   │   │   ├── farmer/
│   │   │   ├── buyer/
│   │   │   ├── fpo/
│   │   │   ├── intelligence/
│   │   │   ├── kisanconnect/
│   │   │   ├── farmerconnect/
│   │   │   ├── navigation/
│   │   │   └── components/
│   │   └── data/               # Room DB + API
│   └── build.gradle.kts
├── tests/                      # Frontend tests (Vitest)
├── docs/                       # Documentation
├── plans/                      # Implementation plans
├── supabase/                   # Supabase config
├── docker-compose.yml          # Full stack Docker
├── vite.config.js              # Vite configuration
├── index.html                  # SPA entry point
├── vercel.json                 # Vercel deployment
├── netlify.toml                # Netlify deployment
└── package.json                # Frontend dependencies
```

## Architecture Pattern
- **Backend:** Modular Monolith (route-based modules, shared DB)
- **Frontend (Web):** Component-based SPA (vanilla JS modules)
- **Frontend (Android):** Clean Architecture + MVVM
- **Communication:** REST API + WebSocket (real-time)
- **Events:** Internal Event Bus (pub/sub)
- **Data:** Repository pattern (services → DB pool)

## State Management
- **Web:** URL-based routing + module-scoped state (no global store)
- **Android:** ViewModel + StateFlow (Compose state)
- **Backend:** Stateless (JWT) + Redis for ephemeral state
- **Real-time:** WebSocket rooms for live data

---

# 7. DATABASE STRUCTURE

## Database Design
- **Type:** Relational (PostgreSQL 15+)
- **Migrations:** 25 versioned files (incremental schema evolution)
- **Approach:** Raw SQL migrations (no ORM)
- **Extensions:** pg_trgm (fuzzy search), PostGIS (geo), uuid-ossp

## Important Tables (130+ total)

### Core Tables
| Table | Purpose |
|-------|---------|
| users | All user accounts with roles |
| user_profiles | Extended profile data |
| farms | Farm registrations |
| crops | Crop catalog |
| listings | Marketplace listings |
| trade_orders | Trade state machine |
| trade_bids | Bid tracking |
| escrow_transactions | Payment escrow |
| wallets | User wallets |
| notifications | Push notification log |
| audit_log | All platform actions |

### AquaOS Tables (80+)
| Category | Tables |
|----------|--------|
| Core | aqua_farms, aqua_ponds, aqua_species, production_cycles |
| Water | water_quality_logs, water_alerts, iot_sensors |
| Feed | feed_logs, feed_inventory, fcr_calculations |
| Health | disease_reports, mortality_logs, treatments |
| Finance | aqua_expenses, aqua_revenue, aqua_loans |
| Market | fish_listings, fish_auctions, rfq_requests |
| Trade | aqua_orders, aqua_escrow, quality_grades |
| Logistics | cold_chain_shipments, temperature_logs |
| Compliance | export_certifications, lab_results |
| Insurance | insurance_products, policies, claims |
| Labor | labor_records, attendance_logs |
| Analytics | aqua_kpis, production_insights, predictions |

### Trade Tables
| Table | Purpose |
|-------|---------|
| trade_orders | Order state machine |
| trade_bids | Bid management |
| trade_timeline | Status history |
| escrow_transactions | Fund holding |
| quality_verifications | Proof records |

### Infrastructure Tables
| Table | Purpose |
|-------|---------|
| sessions | Active sessions |
| rate_limits | API rate tracking |
| webhooks | Callback registry |
| jobs_queue | Async job processing |
| file_uploads | Media metadata |

## Current Database Strengths
- ✅ Well-normalized schema
- ✅ Proper foreign keys and constraints
- ✅ GIN indexes for full-text search
- ✅ UUID primary keys (distributed-ready)
- ✅ Timestamp tracking (created_at, updated_at)
- ✅ Soft deletes where appropriate
- ✅ Proper ENUM types for statuses

## Current Database Concerns
- ⚠️ No read replicas configured yet
- ⚠️ Some large tables lack partitioning (will need at scale)
- ⚠️ Missing composite indexes on some query patterns
- ⚠️ No database-level audit triggers (app-level only)
- ⚠️ Connection pooling needs tuning for production load

---

# 8. API STRUCTURE

## API Architecture
- **Style:** RESTful (resource-oriented)
- **Auth:** Bearer JWT in Authorization header
- **Format:** JSON request/response
- **Errors:** Standardized error envelope `{ success, error, message }`
- **Pagination:** Offset-based (`?page=1&limit=20`)
- **Versioning:** Route-based (implicit via module)
- **Docs:** OpenAPI 3.0 spec at `/api/docs`
- **Real-time:** WebSocket at `/ws` for live updates

## Major API Categories (76 route files)

### Authentication & Users
```
POST   /api/auth/register          # Phone + OTP registration
POST   /api/auth/login             # Login with JWT
POST   /api/auth/verify-otp        # OTP verification
GET    /api/auth/profile           # Current user profile
PUT    /api/auth/profile           # Update profile
POST   /api/auth/refresh           # Token refresh
```

### AgriFlow Marketplace
```
GET    /api/agriflow/listings      # Browse listings
POST   /api/agriflow/listings      # Create listing
GET    /api/agriflow/listings/:id  # Listing detail
POST   /api/agriflow/inquiries     # Express interest
```

### Trade Engine (State Machine)
```
POST   /api/trade/orders                    # Create order
POST   /api/trade/orders/:id/place-bid      # Place bid
POST   /api/trade/orders/:id/accept-bid     # Accept bid
POST   /api/trade/orders/:id/fund-escrow    # Fund escrow
POST   /api/trade/orders/:id/verify-quality # Quality check
POST   /api/trade/orders/:id/dispatch       # Mark dispatched
POST   /api/trade/orders/:id/in-transit     # In transit
POST   /api/trade/orders/:id/deliver        # Mark delivered
POST   /api/trade/orders/:id/release-payment # Release funds
```

### AquaOS (V1-V11)
```
GET    /api/aquaos/farms           # List farms
POST   /api/aquaos/ponds           # Create pond
POST   /api/aquaos/water-quality   # Log water data
GET    /api/aquaos/analytics       # Farm analytics
POST   /api/aquaos/harvest         # Record harvest
GET    /api/aquaos/market-prices   # Price intelligence
POST   /api/aquaos/predictions     # AI predictions
POST   /api/aquaos/payments        # Process payment
GET    /api/aquaos/compliance      # Export compliance
... (200+ aquaos endpoints across V1-V11)
```

### Intelligence & AI
```
GET    /api/intelligence/prices        # Price analytics
GET    /api/intelligence/demand        # Demand forecast
GET    /api/intelligence/supply        # Supply analysis
POST   /api/ai-predictions/disease     # Disease detection
POST   /api/ai-predictions/yield       # Yield forecast
POST   /api/ai-predictions/price       # Price prediction
GET    /api/satellite/ndvi/:farmId     # NDVI analysis
```

### Finance & Payments
```
POST   /api/payments/create-order      # Razorpay order
POST   /api/payments/verify            # Verify payment
GET    /api/wallet/balance             # Wallet balance
POST   /api/wallet/withdraw            # Bank transfer
GET    /api/subscriptions/plans        # Available plans
POST   /api/subscriptions/subscribe    # Subscribe
```

## API Performance Characteristics
- ✅ Rate limiting on all routes (configurable per-role)
- ✅ Input sanitization middleware
- ✅ Request validation with express-validator
- ✅ Structured logging (Pino) for all requests
- ✅ Error boundary with standardized responses
- ⚠️ Some complex queries need optimization at scale
- ⚠️ No API response caching layer yet (Redis planned)
- ⚠️ No request deduplication

---

# 9. AUTHENTICATION & SECURITY

## Authentication Flow

```
1. User enters phone number
2. Backend sends OTP via MSG91/Fast2SMS
3. User enters OTP
4. Backend verifies OTP
5. If new user → create account + issue JWT
6. If existing → issue JWT
7. JWT contains: { userId, role, iat, exp }
8. Token expires in 7 days
9. Refresh token flow available
10. All API calls require Bearer token
```

## Security Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| JWT Authentication | jsonwebtoken library | ✅ Active |
| Password Hashing | bcryptjs (12 rounds) | ✅ Active |
| Rate Limiting | express-rate-limit | ✅ Active |
| Input Sanitization | Custom middleware | ✅ Active |
| Request Validation | express-validator | ✅ Active |
| CORS Protection | cors middleware | ✅ Active |
| Helmet Headers | helmet middleware | ✅ Active |
| HPP Protection | hpp middleware | ✅ Active |
| SQL Injection | Parameterized queries | ✅ Active |
| XSS Prevention | Input sanitization | ✅ Active |
| DPDP Compliance | Custom middleware | ✅ Active |
| Audit Logging | All mutations logged | ✅ Active |
| Fraud Detection | AI-based service | ✅ Active |
| Role-Based Access | Middleware guards | ✅ Active |
| Request ID Tracking | UUID per request | ✅ Active |
| Error Masking | No stack traces in production | ✅ Active |

## Current Security Strengths
- Multi-layered middleware security chain
- India DPDP (Data Protection) compliance built-in
- Comprehensive audit trail
- Role-based access on every route
- Parameterized SQL (no injection possible)

## Areas for Hardening
- ⚠️ Implement CAPTCHA for high-risk endpoints
- ⚠️ Add WAF rules (Cloudflare)
- ⚠️ Implement API key rotation
- ⚠️ Add device fingerprinting for fraud
- ⚠️ Penetration testing needed
- ⚠️ SOC2/ISO27001 compliance (future)

---

# 10. UI/UX ANALYSIS

## Current UI Strengths
- ✅ Clean, modern design with CSS custom properties
- ✅ Consistent color system (design tokens)
- ✅ Inter font family (professional, readable)
- ✅ Mobile-first responsive layout
- ✅ Tab-based navigation for complex modules
- ✅ Card-based content presentation
- ✅ Status indicators with color coding
- ✅ Empty state handling

## Current UI Areas for Improvement
- ⚠️ Onboarding flow could be more guided
- ⚠️ Some screens have dense information
- ⚠️ Data visualization needs chart library
- ⚠️ Loading states inconsistent across screens
- ⚠️ Dark mode not implemented
- ⚠️ Accessibility (a11y) needs audit
- ⚠️ Animation/micro-interactions minimal

## UX Observations
- ⚠️ Some multi-step flows lack progress indicators
- ⚠️ Search results could have better filtering UX
- ⚠️ Notification center needs categorization
- ⚠️ Complex forms need better validation feedback
- ⚠️ First-time user guidance (tooltips/coach marks) missing

## Pages Needing Enhancement
1. Analytics Dashboard — needs charts (Chart.js/D3)
2. AquaOS Feed Management — dense data, needs better visualization
3. Trade Order Flow — needs visual pipeline/kanban
4. FPO Member Management — needs bulk actions
5. Notification Center — needs priority/categories
6. Settings — needs better organization

## UI Inspiration
- **Swiggy** — Smooth onboarding, micro-interactions
- **PhonePe** — Financial dashboard clarity
- **Zerodha** — Data-heavy but clean
- **Ninjacart** — B2B agriculture UX
- **Freshworks** — SaaS dashboard patterns

---

# 11. ANDROID APP ANALYSIS

## Current Android Strengths
- ✅ Native Kotlin (not WebView)
- ✅ Modern Jetpack Compose UI
- ✅ Material 3 design system
- ✅ Proper navigation architecture
- ✅ Room DB for offline capability
- ✅ SharedViewModel for cross-screen state
- ✅ Hilt dependency injection
- ✅ Multiple feature screens implemented

## Android Screens Implemented
- Auth (Login, OTP, Registration)
- Home Dashboard
- AgriFlow Marketplace
- AquaOS Management
- Farmer Tools
- Buyer Interface
- FPO Dashboard
- Intelligence/Analytics
- KisanConnect
- FarmerConnect
- Weather
- Orders
- Profile
- Notifications
- Onboarding

## Known Android Issues
- ⚠️ Offline-to-online sync needs improvement
- ⚠️ Image caching strategy needs optimization
- ⚠️ Deep linking not fully configured
- ⚠️ Push notification channels need refinement
- ⚠️ Large list performance (need LazyColumn optimization)
- ⚠️ ProGuard rules need review for release builds
- ⚠️ Crash reporting (Firebase Crashlytics) integration pending

## Android Performance
- ⚠️ Cold start time needs optimization (Baseline Profiles)
- ⚠️ APK size needs reduction (R8 + resource shrinking)
- ⚠️ Memory usage in image-heavy screens
- ⚠️ Network retry strategy needs improvement

## Play Store Status
- **Status:** Internal Testing
- **Target:** Open Beta → Production
- **Package:** com.agrihub.app

---

# 12. PERFORMANCE ANALYSIS

## Current Performance Profile

| Area | Status | Details |
|------|--------|---------|
| Frontend Load | Good | Vite bundle splitting, <2s FCP |
| API Response (simple) | Good | <100ms for basic CRUD |
| API Response (complex) | Fair | 200-500ms for analytics queries |
| Database Queries | Good | Indexed queries <50ms |
| WebSocket | Good | <50ms message delivery |
| Image Loading | Fair | CDN helps, but no lazy loading yet |
| Android Launch | Fair | ~2s cold start |

## Performance Bottlenecks
- ⚠️ Complex analytics queries (multi-join) can be slow
- ⚠️ No query result caching (Redis planned)
- ⚠️ Large listing searches need Elasticsearch/Meilisearch
- ⚠️ Image optimization pipeline missing
- ⚠️ Frontend bundle could be further split

## Caching Strategy
- **Current:** Redis for sessions, rate limiting
- **Planned:** Redis for API response caching, query caching
- **CDN:** Vercel Edge for static assets
- **Browser:** Service Worker cache for offline

## Offline Support
- **Web:** Service Worker + IndexedDB (basic)
- **Android:** Room DB for local data, sync queue
- **Status:** Partial — read works offline, write queues for sync

---

# 13. SCALABILITY & FUTURE GROWTH

## Current Capacity
- **Users:** Designed for 100K concurrent
- **Database:** Single instance (Supabase Pro)
- **API:** Single container (can horizontal scale)
- **WebSocket:** Single node (Redis pub/sub ready for multi-node)

## Expected Growth

| Timeline | Users | Transactions/day | Data |
|----------|-------|-------------------|------|
| Month 1-3 | 10K | 1K | 10GB |
| Month 3-6 | 100K | 10K | 100GB |
| Month 6-12 | 1M | 100K | 1TB |
| Year 2 | 10M | 1M | 10TB |

## Expansion Plans
1. **Phase 1:** Andhra Pradesh (aquaculture focus)
2. **Phase 2:** All coastal states (Tamil Nadu, Kerala, Odisha, West Bengal)
3. **Phase 3:** Pan-India (all agriculture)
4. **Phase 4:** South-East Asia (Vietnam, Thailand, Indonesia)

## Scaling Architecture (Planned)

```
                    ┌─── CDN (Cloudflare) ───┐
                    │                         │
Users ──→ Load Balancer ──→ API Cluster (K8s)
                    │              │
                    ├── Redis Cluster (Cache + Queue)
                    │              │
                    └── PostgreSQL (Primary + Read Replicas)
                                   │
                              Supabase Realtime
```

## Scaling Concerns
- ⚠️ Single DB instance → Need read replicas at 100K+ users
- ⚠️ WebSocket → Need Redis adapter for multi-node
- ⚠️ File uploads → Need queue + worker separation
- ⚠️ Search → Need dedicated search engine at scale
- ⚠️ Analytics → Need data warehouse (ClickHouse/BigQuery)
- ⚠️ Notifications → Need dedicated notification service

---

# 14. KNOWN BUGS & BLOCKERS

| Issue | Severity | Platform | Status | Notes |
|-------|----------|----------|--------|-------|
| Offline sync conflict resolution | Medium | Android | In Progress | Need conflict merge strategy |
| Large image upload on slow network | Low | Web | Known | Need chunked upload |
| WebSocket reconnection | Low | Web | Known | Auto-reconnect exists but can lag |
| Complex filter combinations | Low | Backend | Known | Some filter combos return empty |
| Notification delivery on Xiaomi/Oppo | Medium | Android | Known | OEM battery optimization kills FCM |
| Date timezone display | Low | Web | Known | UTC vs local inconsistency |

**Critical blockers: NONE** — Platform is functional end-to-end.

---

# 15. BUSINESS LOGIC

## Pricing Logic
- **Listings:** Farmer sets base price per unit (kg/quintal/ton)
- **Negotiation:** Counter-offers allowed, minimum 5% below base
- **Market reference:** Live mandi prices shown during pricing
- **Auction:** Time-bound, highest bidder wins
- **RFQ:** Buyer posts need, farmers quote

## Commission Logic
- **Trade platform fee:** 1-2% of transaction value
- **Split:** 60% platform, 40% for ecosystem development
- **Aqua marketplace:** 1.5% buyer side, 0.5% seller side
- **Input marketplace:** 5-10% seller commission
- **Financial services:** Lead-gen fee to partners

## Vendor Approval Logic
```
Registration → Document Upload (GST/FSSAI/Trade License)
→ Auto-verification (API check)
→ If failed → Manual review queue
→ Admin approves/rejects
→ Trust score initialized at 50/100
→ Score improves with successful transactions
```

## Subscription Logic
- **Free tier:** Basic listing, limited analytics, 5 listings/month
- **Pro (₹499/mo):** Unlimited listings, advanced analytics, priority support
- **Enterprise (₹2999/mo):** API access, white-label, dedicated support
- **FPO plans:** Custom pricing based on member count

## Refund Logic
- **Before escrow funded:** Instant cancellation, no charge
- **After escrow funded, before dispatch:** 100% refund, small processing fee
- **After dispatch:** Quality dispute → ODR → partial/full refund based on evidence
- **Auto-refund:** If seller doesn't dispatch within 48 hours

## Payout Logic
- **Escrow release:** Funds held until buyer confirms delivery
- **Settlement:** T+1 to wallet, T+2 to bank account
- **Commission deducted:** Before payout to seller
- **Minimum payout:** ₹100 to bank account

---

# 16. PAYMENT SYSTEM

## Payment Providers
| Provider | Purpose | Status |
|----------|---------|--------|
| **Razorpay** | Primary payment gateway | ✅ Integrated |
| **UPI** | Via Razorpay | ✅ Supported |
| **Net Banking** | Via Razorpay | ✅ Supported |
| **Cards** | Via Razorpay | ✅ Supported |
| **Wallet** | Internal platform wallet | ✅ Built |

## Payment Flow
```
1. Buyer selects trade → Creates order
2. System calculates amount + commission
3. Razorpay order created (backend)
4. Buyer completes payment (frontend)
5. Webhook confirms payment
6. Funds held in escrow
7. Quality verification + delivery
8. Buyer confirms receipt
9. Platform deducts commission
10. Seller wallet credited
11. Seller requests bank payout
12. T+2 bank settlement
```

## Current Payment Status
- ✅ Razorpay integration complete
- ✅ Escrow logic implemented
- ✅ Commission calculation working
- ✅ Wallet system functional
- ⚠️ Reconciliation dashboard needed
- ⚠️ Auto-retry for failed webhooks needed
- ⚠️ Multi-currency support (future)

---

# 17. NOTIFICATIONS & COMMUNICATION

## Push Notifications
- **Service:** Firebase Cloud Messaging (FCM)
- **Platforms:** Android (native) + Web (Service Worker)
- **Types:** Transactional, promotional, alerts

## SMS
- **Primary:** MSG91
- **Backup:** Fast2SMS
- **Use:** OTP, order updates, price alerts

## Email
- **Provider:** Resend
- **Use:** Receipts, reports, marketing (future)

## Real-time
- **WebSocket:** Native ws library
- **Use:** Chat, live prices, order updates, notifications

## Notification Categories
| Type | Channel | Priority |
|------|---------|----------|
| OTP | SMS | Critical |
| Order updates | Push + SMS | High |
| Price alerts | Push | Medium |
| Community | Push | Low |
| Weather alerts | Push | High |
| Scheme deadlines | Push + SMS | Medium |

## Known Issues
- ⚠️ OEM battery optimization kills background FCM (Xiaomi, Oppo, Vivo)
- ⚠️ Web push permission UX needs improvement
- ⚠️ SMS cost optimization needed (batch + priority)
- ⚠️ WhatsApp Business API integration pending

---

# 18. ADMIN PANEL ANALYSIS

## Current Admin Features
- ✅ User management (list, search, suspend, verify)
- ✅ Verification queue (document review)
- ✅ Platform analytics (users, trades, revenue)
- ✅ Content moderation (flagged items)
- ✅ Fraud detection alerts
- ✅ System health monitoring
- ✅ Audit log viewer
- ✅ Rate limit monitoring
- ✅ Scheme management
- ✅ Support tickets

## Missing Admin Features
- ❌ Bulk operations (mass approve, mass notify)
- ❌ Advanced reporting (custom date ranges, exports)
- ❌ Revenue analytics dashboard
- ❌ A/B testing configuration
- ❌ Feature flags management
- ❌ CMS for content (training, guides)
- ❌ Push notification composer
- ❌ API health dashboard with alerting
- ❌ User journey funnel analytics

## Admin Pain Points
- Manual verification is time-consuming (need AI-assisted)
- No bulk export to CSV/Excel
- Dashboard refresh is manual (needs real-time)
- No role-based admin access (all admins see everything)

---

# 19. ANALYTICS & TRACKING

## Analytics Tools
| Tool | Purpose | Status |
|------|---------|--------|
| Firebase Analytics | User events, screens | ✅ Active |
| Custom Analytics | Platform-specific metrics | ✅ Active |
| Pino Logging | Server-side event tracking | ✅ Active |
| Sentry | Error tracking | ✅ Active |
| PostgreSQL | Business metrics (raw data) | ✅ Active |

## Metrics Currently Tracked
- User registrations (daily/weekly/monthly)
- Active users (DAU/WAU/MAU)
- Trade volume (count + value)
- Listing creation rate
- OTP success/failure rate
- API response times
- Error rates by endpoint
- WebSocket connection stats
- Revenue (commissions collected)

## Missing Analytics
- ❌ User journey funnels (drop-off points)
- ❌ Cohort analysis (retention)
- ❌ Feature usage heatmaps
- ❌ A/B test results
- ❌ Revenue per user (ARPU)
- ❌ Customer acquisition cost (CAC)
- ❌ Lifetime value (LTV)
- ❌ Geographic distribution maps
- ❌ Real-time dashboard (currently batch)
- ❌ Predictive churn analytics

---

# 20. DEVOPS & DEPLOYMENT

## Deployment Process
```
Developer pushes to GitHub
→ GitHub Actions CI triggered
→ Lint + test + build
→ If main branch → auto-deploy
  → Frontend → Vercel (automatic)
  → Backend → Docker build → Railway/Cloud
→ Database migrations run separately
→ Slack/Discord notification on deploy
```

## CI/CD
- **Platform:** GitHub Actions
- **Frontend:** Auto-deploy to Vercel on push
- **Backend:** Docker build + deploy
- **Tests:** Vitest (16 frontend tests), Node.js test runner (backend)
- **Lint:** ESLint (configured but minimal rules)

## Backup Strategy
- **Database:** Supabase automatic daily backups + point-in-time recovery
- **Files:** Cloudflare R2 (inherently durable, 11 nines)
- **Code:** Git (GitHub, multiple contributors have access)
- **Config:** Environment variables in deployment platform

## Monitoring
| Tool | Monitors | Status |
|------|----------|--------|
| Sentry | Errors, crashes | ✅ Active |
| Supabase Dashboard | DB metrics | ✅ Active |
| Vercel Analytics | Frontend performance | ✅ Active |
| Custom Health Check | API uptime | ✅ Active |
| UptimeRobot (planned) | Endpoint monitoring | 🔄 Planned |
| Grafana (planned) | Custom dashboards | 🔄 Planned |

## Current Deployment Concerns
- ⚠️ No staging environment (deploy directly to production)
- ⚠️ Database migrations need automated rollback
- ⚠️ No blue/green or canary deployments
- ⚠️ Secrets rotation not automated
- ⚠️ No load testing before deploy

---

# 21. LEGAL & COMPLIANCE

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Privacy Policy** | ✅ Required | Draft needed |
| **Terms & Conditions** | ✅ Required | Draft needed |
| **India DPDP Act** | ✅ Built-in | DPDP middleware active |
| **GST Invoicing** | 🔄 Planned | Auto-generate on transactions |
| **User Consent** | ✅ Active | OTP = implicit consent |
| **Data Deletion** | ✅ Built | User can request deletion |
| **FSSAI Compliance** | ✅ Verified | Buyer KYC checks |
| **MPEDA Compliance** | ✅ Built | Export module |
| **NABARD Guidelines** | ✅ Followed | Scheme disbursement |
| **SEBI (if payments)** | 🔄 Review | Escrow may need PA license |
| **RBI Guidelines** | 🔄 Review | Wallet may need PPI license |
| **Play Store Policies** | ✅ Followed | Standard compliance |
| **Apple App Store** | 🔄 Future | Will comply when building iOS |

---

# 22. AI FEATURES & AUTOMATION

## Existing AI Features
| Feature | Model/Approach | Status |
|---------|---------------|--------|
| Price Prediction | ARIMA + seasonal decomposition | ✅ Active |
| Disease Detection | Rule-based + pattern matching | ✅ Active |
| Yield Forecasting | Von Bertalanffy growth model | ✅ Active |
| Demand Analysis | Historical trend analysis | ✅ Active |
| Feed Optimization | FCR-based recommendations | ✅ Active |
| Scheme Matching | Rule-based eligibility engine | ✅ Active |
| Fraud Detection | Anomaly scoring | ✅ Active |
| Crop Planning | Soil + weather + market analysis | ✅ Active |
| Satellite NDVI | Remote sensing analysis | ✅ Active |
| Gig Worker Matching | Location + rating algorithm | ✅ Active |

## Planned AI Features
| Feature | Technology | Priority |
|---------|-----------|----------|
| AI Chatbot | OpenAI GPT / custom LLM | High |
| Voice Assistant | Whisper + custom NLU (Telugu/Hindi) | High |
| Image Recognition | Crop disease from photos | Medium |
| Smart Notifications | ML-based timing optimization | Medium |
| Price Negotiation AI | RL-based counter-offer suggestions | Low |
| Crop Recommendation | Multi-factor ML model | Medium |
| Supply Chain Optimization | Graph-based routing | Low |
| Credit Scoring | Alternative data ML model | Medium |
| Quality Grading (Auto) | Computer vision | Medium |
| Market Trend Analysis | LLM summarization | Low |
| Document OCR | Government doc processing | Medium |
| Satellite Pest Detection | Deep learning on imagery | Low |

---

# 23. SIMILAR PLATFORMS / COMPETITOR ANALYSIS

## Direct Competitors

| Platform | Focus | Strengths | Weaknesses |
|----------|-------|-----------|------------|
| **Ninjacart** | B2B produce | Large network, funding | Only fresh produce, no farmer tools |
| **DeHaat** | Full stack agri | Input + advisory + market | Limited aquaculture |
| **AgroStar** | Input marketplace | Strong brand, advisory | No trade/marketplace |
| **BigHaat** | Agri inputs | Good content, advisory | No output marketplace |
| **FreshToHome** | Fish marketplace | Consumer brand, cold chain | Only B2C, no farmer tools |
| **Aquaconnect** | Aquaculture | Farm management, market | Limited to aqua only |
| **Arya.ag** | Post-harvest | Warehouse, finance | No farm management |
| **Bijak** | Agri trading | Large trader network | Only trading, no farmer tools |
| **eNAM** | Government mandi | Nationwide, govt backed | Poor UX, limited features |
| **ONDC** | Open commerce | Open network | Generic, not agri-focused |

## Features We Have That Competitors Don't
1. **Unified platform** — No one else connects ALL stakeholders
2. **AquaOS (V1-V11)** — Most comprehensive aqua platform globally
3. **Trade state machine** — Full escrow-protected commerce
4. **Government integration** — eNAM, NABARD, PMMSY built-in
5. **Multi-role ecosystem** — Farmer + Buyer + FPO + Agent + Gig in one app
6. **Satellite monitoring** — NDVI analysis built-in
7. **Export compliance** — MPEDA/EU/FDA in platform

## Features Missing (vs Best Competitors)
- ❌ Consumer-facing app (B2C like FreshToHome)
- ❌ Input credit line (like DeHaat)
- ❌ Video consultations (like Krishify)
- ❌ Hardware/IoT devices (like CropIn)
- ❌ Drone services integration
- ❌ Carbon credit marketplace
- ❌ International commodity trading

## Competitor Weaknesses We Exploit
- **Most are single-purpose** — We're comprehensive
- **Most ignore aquaculture** — We dominate it
- **Most lack escrow** — We have secure trade
- **Most are B2C only** — We're B2B2C
- **Government apps have poor UX** — We modernize access

---

# 24. FUTURE FEATURE WISHLIST

### Priority 1 (Next 3 months)
- [ ] AI chatbot (multilingual)
- [ ] Voice assistant (Telugu, Hindi)
- [ ] WhatsApp commerce integration
- [ ] Enhanced offline mode
- [ ] iOS app launch
- [ ] Video consultations with experts
- [ ] Crop insurance integration
- [ ] Advanced analytics dashboard with charts

### Priority 2 (3-6 months)
- [ ] Carbon credit marketplace
- [ ] Drone services marketplace
- [ ] Input credit line (BNPL for farmers)
- [ ] Automated quality grading (CV)
- [ ] Social features (farmer stories, reels)
- [ ] B2C module (consumer ordering)
- [ ] Multi-tenant white-label
- [ ] Hardware IoT device partnerships

### Priority 3 (6-12 months)
- [ ] International expansion (SE Asia)
- [ ] Commodity futures integration
- [ ] Blockchain provenance
- [ ] AR/VR farm planning
- [ ] Agricultural insurance underwriting
- [ ] Open API marketplace
- [ ] Developer SDK
- [ ] Data marketplace (anonymized insights)

---

# 25. SCREENSHOTS & RECORDINGS

Screenshots are available in the repository:
- `screenshots/` — App UI screenshots
- `screen_01_boot.png` — Boot screen
- `screenshot_1_home.png` — Home screen
- `screenshot_home.png` — Dashboard view

For video recordings and live demo, contact the team.

---

# 26. ACCESS DETAILS

## Demo Access
- **Web PWA:** Deployed on Vercel (URL in repo settings)
- **API:** Backend on Railway/Docker
- **Admin:** Admin role credentials available on request

## Testing
- **Frontend tests:** `npm run test` (Vitest, 16 tests)
- **Backend check:** `cd backend && node --check src/index.js`
- **Docker:** `docker-compose up` for full stack

---

# 27. MAIN EXPECTATIONS FROM ANALYSIS

This platform seeks:

1. **Architecture improvement** — Microservices readiness, event-driven
2. **Scalability planning** — 10M user architecture
3. **Android optimization** — Performance, Play Store readiness
4. **UI/UX redesign** — Modern, accessible, delightful
5. **Feature roadmap** — Prioritized execution plan
6. **AI integration** — LLM chatbot, voice, computer vision
7. **Performance optimization** — Sub-100ms APIs at scale
8. **Production readiness** — Monitoring, alerting, DR
9. **DevOps maturity** — GitOps, staging, canary deploys
10. **Monetization strategy** — Revenue optimization
11. **Competitor differentiation** — Unique features roadmap
12. **Security hardening** — Pen-test ready
13. **Go-to-market strategy** — Pilot state launch
14. **Team structure** — Engineering team scaling

---

# 28. SPECIAL NOTES

1. **Andhra Pradesh pilot focus** — India's largest aquaculture state, natural starting point
2. **Government relationships** — NABARD, SFAC, MPEDA partnerships in progress
3. **FPO aggregation** — Key distribution strategy (1 FPO = 500+ farmers)
4. **Offline-first critical** — Rural India has 2G/3G in many areas
5. **Multi-language essential** — Telugu first, then Hindi/English
6. **Trust is everything** — Escrow + verification builds farmer confidence
7. **Data is moat** — Farm-level data becomes strategic asset over time
8. **Platform play** — Not transactional; building ecosystem network effects
9. **Existing PRD documents** — Multiple detailed PRDs available (AgriFlow, AquaOS, KisanConnect, FarmerConnect, Architecture Blueprint, Intelligence Report)
10. **Implementation plans created** — Detailed sprint execution plans in `/plans` directory

---

# 29. FINAL ANALYSIS REQUEST

This platform represents India's most ambitious Agriculture Operating System. Analyze comprehensively for:

1. ✅ Complete architecture review (modular monolith → microservices path)
2. ✅ UI/UX audit (72+ screens, design system consistency)
3. ✅ Android app audit (Kotlin + Compose, performance)
4. ✅ Security audit (OWASP Top 10, India DPDP)
5. ✅ Performance audit (API latency, DB query optimization)
6. ✅ Scalability audit (10M user readiness)
7. ✅ Feature gap analysis (vs DeHaat, Ninjacart, Aquaconnect)
8. ✅ Missing features roadmap (priority + timeline)
9. ✅ Production readiness checklist
10. ✅ Cost optimization (hosting, SMS, storage)
11. ✅ Future-proof architecture (event-driven, CQRS ready)
12. ✅ Database optimization (partitioning, indexes, read replicas)
13. ✅ API optimization (caching, pagination, GraphQL consideration)
14. ✅ Monetization improvements (subscription tiers, value-add)
15. ✅ AI feature opportunities (LLM, CV, voice)
16. ✅ User retention strategies (engagement loops, gamification)
17. ✅ DevOps maturity (GitOps, observability, chaos engineering)
18. ✅ Play Store optimization (ASO, rating strategy)
19. ✅ Complete execution strategy (next 12 months)
20. ✅ Team hiring plan (engineering + product + ops)

---

**END OF AUDIT DOCUMENT**

