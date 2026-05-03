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
<td align="center"><strong>40+</strong><br/><sub>Feature Screens</sub></td>
<td align="center"><strong>50+</strong><br/><sub>API Routes</sub></td>
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

### AquaOS — Aquaculture Management

```
+----------------------------------------------------------------------+
|                        AQUAOS                                          |
|              Standalone Aquaculture Operating System                   |
+----------------------------------------------------------------------+
|                                                                      |
|  Pond Management      |  Monitor water quality, feed schedules       |
|  Species Tracking     |  Growth tracking, health monitoring          |
|  Harvest Planning     |  Yield estimation, market timing             |
|  Input Procurement    |  Feed, supplements, equipment                |
|  Market Prices        |  Live aqua commodity prices                  |
|  IoT Integration      |  Water sensors, dissolved oxygen             |
|  Disease Management   |  AI-powered disease detection                |
|  Compliance           |  Regulatory documentation & tracing          |
|                                                                      |
+----------------------------------------------------------------------+
```

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

### Screen Architecture (40+ Screens)

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

### API Route Architecture (50+ Endpoints)

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

#### AquaOS — Aquaculture
```
GET    /api/aquaos/ponds           # Pond listing
POST   /api/aquaos/ponds           # Register pond
GET    /api/aquaos/species         # Species catalog
POST   /api/aquaos/harvest         # Record harvest
GET    /api/aquaos/market-prices   # Aqua commodity prices
```

#### KisanConnect
```
GET    /api/kisanconnect/services  # Available services
POST   /api/kisanconnect/book      # Book service
GET    /api/kisanconnect/equipment # Equipment listings
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
| `helmet` | HTTP security headers |
| `hpp` | HTTP Parameter Pollution protection |
| `auth` | JWT token verification & role extraction |
| `validate` | express-validator schema enforcement |
| `errorHandler` | Centralized error formatting & logging |
| `auditMiddleware` | Audit trail for sensitive operations |

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

---

## Database Architecture

### Migration Strategy (9 Versioned Migrations)

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
|  v6  | migrate-v6-agrios.js     | AgriOS features (diary, inputs)    |
|  v7  | migrate-v7-intelligence  | Intelligence engine tables          |
|  v8  | migrate-v8-finance.js    | Finance (wallet, loans, escrow)    |
|  v9  | migrate-v9-ecosystem.js  | Full ecosystem (agents, exports)   |
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
|   |   +-- routes/               # --- 50 API ROUTE FILES ---
|   |   |   +-- auth.js           # Authentication
|   |   |   +-- agriflow.js       # Trade operations
|   |   |   +-- aquaos.js         # Aquaculture APIs
|   |   |   +-- kisanconnect.js   # Rural services
|   |   |   +-- bhoomios.js       # Land management
|   |   |   +-- intelligence.js   # AI/Analytics
|   |   |   +-- payments.js       # Payment processing
|   |   |   +-- wallet.js         # Wallet operations
|   |   |   +-- escrow.js         # Escrow management
|   |   |   +-- ... (40+ more)
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
|   |   |
|   |   +-- middleware/            # --- REQUEST PIPELINE ---
|   |   |   +-- auth.js           # JWT verification
|   |   |   +-- errorHandler.js   # Error formatting
|   |   |   +-- requestId.js      # Request tracing
|   |   |   +-- sanitize.js       # Input cleaning
|   |   |   +-- validate.js       # Schema validation
|   |   |
|   |   +-- db/                   # --- DATABASE ---
|   |   |   +-- pool.js           # Connection pool
|   |   |   +-- transaction.js    # Transaction helper
|   |   |   +-- migrate.js -> v9  # 9 migration files
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

### Phase 5: Scale & AI (Upcoming)
- [ ] Voice-first interface (regional languages)
- [ ] Computer vision (crop health from photos)
- [ ] Predictive yield modeling
- [ ] Credit scoring from farm data
- [ ] IoT sensor integration (soil, water)
- [ ] Drone imagery integration
- [ ] Blockchain traceability
- [ ] International expansion

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
|  Inter Font        |  express-validator |  9 migrations      | Sentry   |
|                    |  Helmet + HPP      |                    | GrowthBk |
|                    |                    |                    |          |
|  ANDROID           |  INTEGRATIONS      |  AI/ML             | COMMS    |
|  -------           |  ------------      |  ----              | -----    |
|  Kotlin            |  Razorpay          |  Price Forecast    | MSG91    |
|  Jetpack Compose   |  Mapbox            |  Crop Planning     | Fast2SMS |
|  Material 3        |  OpenWeatherMap    |  Disease Detect    | Firebase |
|  Gradle KTS        |  data.gov.in       |  Scheme Match      | WhatsApp |
|  Hilt DI           |  Google Translate  |  Demand Analysis   | Resend   |
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
