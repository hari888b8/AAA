# Comprehensive Gap Analysis: PRDs vs. Existing Implementation

**Date:** Generated from full codebase + PRD review  
**Scope:** 5 PRD documents vs. Android Kotlin app, Node.js backend, PostgreSQL DB  
**Status:** READ-ONLY Research

---

## Table of Contents

- [A. Per-App Missing Screens & Features](#a-per-app-missing-screens--features)
  - [A1. AgriFlow India](#a1-agriflow-india)
  - [A2. AquaOS](#a2-aquaos)
  - [A3. KisanConnect](#a3-kisanconnect)
  - [A4. FarmerConnect](#a4-farmerconnect)
  - [A5. Intelligence](#a5-intelligence)
  - [A6. Cross-Platform (Auth, Home, Profile, Community, Orders, Notifications)](#a6-cross-platform)
- [B. Missing Backend Endpoints](#b-missing-backend-endpoints)
- [C. Missing DB Tables & Columns](#c-missing-db-tables--columns)
- [D. Architectural Gaps](#d-architectural-gaps)
- [E. UI/UX Improvements Needed](#e-uiux-improvements-needed)

---

## A. Per-App Missing Screens & Features

### A1. AgriFlow India

**PRD Source:** AgriFlow India PRD v1.0 (Sections 6–8: Farmer App, FPO Management, Buyer Intelligence)

#### What Exists (Android)
- `AgriFlowHomeScreen` — hub with links to listings, declarations, inquiries
- `ListingsScreen` — list of supply listings with pull-refresh
- `ListingDetailScreen` — single listing view with inline inquiry form
- `CreateListingScreen` — form with crop ID, variety, quantity, price, grade, location, description
- `DeclarationsScreen` — list of farmer declarations
- `CreateDeclarationScreen` — form with crop, yield, sow/harvest dates
- `InquiriesScreen` — list of buyer inquiries

#### What Exists (Backend)
- `GET/POST /api/agriflow/listings` — CRUD supply listings
- `GET /api/agriflow/listings/:id` — detail
- `GET/POST /api/agriflow/inquiries` — inquiry CRUD
- `GET/POST /api/agriflow/declarations` — declaration CRUD
- `GET /api/agriflow/crops` — crop catalog
- `GET /api/agriflow/districts` — district list

#### MISSING — Farmer App (PRD Section 6)

| # | Feature | PRD Section | Priority | Notes |
|---|---------|-------------|----------|-------|
| 1 | **Farmer onboarding wizard** — village, district, land area (acres), irrigation type, soil type, crops grown, GPS location | 6.3 | 🔴 Critical | Auth only collects phone+name. No farm profile data at all |
| 2 | **GPS location capture** on farm/listing | 6.3, 6.5 | 🔴 Critical | No location services integration anywhere in app |
| 3 | **Harvest Calendar view** — visual calendar showing expected harvests | 6.7 | 🟡 Medium | Currently only list view of declarations |
| 4 | **Availability Posting** — separate from listings; auto-triggered T-15 days before harvest | 6.5 | 🟡 Medium | DB has `harvest_availability` table but no Android screen or dedicated endpoint |
| 5 | **Photo upload** on listings | 6.5 | 🔴 Critical | No camera/gallery integration; `supply_listings.images` column exists in DB but unused |
| 6 | **Voice input** for all text fields | 6.4 | 🟡 Medium | Not implemented anywhere |
| 7 | **Vernacular language support** (Telugu, Hindi, Kannada) | 6.4 | 🟡 Medium | App is English-only; DB has `name_te`, `name_hi` columns in `crop_catalog` but unused |
| 8 | **Crop selector with photos/icons** | 6.5 | 🟡 Medium | Currently a raw text field for crop_id; crops have `icon_emoji` but not displayed in selector |
| 9 | **Weather widget** on dashboard | 6.6 | 🟢 Low | No weather API integration |
| 10 | **Crop health advisory** on farmer dashboard | 6.6 | 🟢 Low | Advisories exist in AquaOS only |
| 11 | **Privacy/consent settings** per declaration | 6.9 | 🟡 Medium | DB has `consent_level` on inquiries but no UI for farmer to set privacy level |
| 12 | **Listing quality scoring** | 6.8 | 🟢 Low | `quality_score` column exists on declarations, not computed or displayed |
| 13 | **Offline declaration submission** | 6.4 | 🟡 Medium | `OfflineAction` Room entity exists but not wired to any sync queue |

#### MISSING — FPO Management Platform (PRD Section 7)

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| 14 | **Entire FPO Management Platform** | 🔴 Critical | Zero screens exist |
| 15 | FPO member management (add/remove farmers) | 🔴 Critical | — |
| 16 | FPO procurement dashboard (aggregate farmer harvests) | 🔴 Critical | — |
| 17 | FPO inventory management | 🔴 Critical | — |
| 18 | FPO supply listing with quality aggregation | 🟡 Medium | — |
| 19 | FPO payment management (farmer payouts) | 🟡 Medium | — |
| 20 | FPO analytics (member performance, volume) | 🟢 Low | — |

#### MISSING — Buyer Intelligence App (PRD Section 8)

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| 21 | **Buyer-specific supply search** with 25+ filters | 🔴 Critical | Current search has crop_id and district_id only |
| 22 | **Buyer watchlists** (crop + region alerts) | 🟡 Medium | — |
| 23 | **Intelligence reports** (supply forecasts, price trends) | 🟡 Medium | — |
| 24 | **Supply heatmaps** (MapBox choropleth by district) | 🟡 Medium | Backend has `/district-heatmap` but no map rendering in app |
| 25 | **30/60/90-day harvest forecasts** | 🟡 Medium | `forecasts` table exists in DB, no API or UI |
| 26 | **FPO directory** for buyer sourcing | 🟢 Low | — |
| 27 | **Negotiation/offer system** on listings | 🟡 Medium | Inquiry exists but no structured offer/counter-offer |

**AgriFlow Total: 27 missing features (7 Critical, 12 Medium, 8 Low)**

---

### A2. AquaOS

**PRD Source:** AquaOS PRD v1.0 + AquaOS Gap Analysis v1.1

#### What Exists (Android)
- `AquaOSHomeScreen` — stats dashboard (active ponds, area, survival, pH, temp)
- `PondsScreen` — list of ponds with status chips
- `PondDetailScreen` — pond detail with water logs, inline water log form
- `AddPondScreen` — form for new pond (code, species, area, stocked count, stocking date, pH, temp, DO)
- `HarvestListingsScreen` — aqua harvest marketplace
- `WaterLogScreen` — water quality logging form
- `AdvisoriesScreen` — advisory list with severity badges

#### What Exists (Backend)
- Full pond CRUD (`GET/POST/PATCH /api/aquaos/ponds`)
- Water log CRUD (`POST/GET /api/aquaos/ponds/:id/water-log(s)`)
- Harvest listings CRUD (`GET/POST /api/aquaos/harvest-listings`)
- Advisories (`GET /api/aquaos/advisories`)
- Farm stats (`GET /api/aquaos/stats`)

#### MISSING

| # | Feature | PRD Section | Priority | Notes |
|---|---------|-------------|----------|-------|
| 1 | **Farm creation wizard** — 3-step with GPS | AquaOS PRD 3.1 | 🔴 Critical | Current form is single-page, no GPS |
| 2 | **Crop cycle management** — stocking events, species templates, cycle tracking | 3.2 | 🔴 Critical | Pond exists but no crop cycle entity |
| 3 | **Feed logging** — daily feed input, FCR calculation, feed cost tracking | Gap v1.1 #4 | 🔴 Critical | No feed tables or UI at all |
| 4 | **Mortality logging** — symptom checklist, photo upload, mortality rate calc | Gap v1.1 #5 | 🟡 Medium | Only `survival_pct` field; no mortality log table |
| 5 | **Growth sampling** — periodic weight measurements, growth curve chart | Gap v1.1 #6 | 🟡 Medium | `avg_weight_g` exists but no sampling history |
| 6 | **Advisory engine** — species-specific rules, threshold alerts | Gap v1.1 #7 | 🟡 Medium | Advisories exist but are static; no automated rule engine |
| 7 | **Water quality thresholds & alerts** — auto-alert when pH/DO/temp out of range | Gap v1.1 #8 | 🟡 Medium | Water logging exists but no threshold alerting |
| 8 | **Input Marketplace** — supplier catalog, product browsing, inquiry system | AquaOS PRD 4.0 | 🔴 Critical | Entire module missing |
| 9 | **Offer/negotiation system** on harvest listings | AquaOS PRD 5.0 | 🟡 Medium | Listings are view-only; no offer/bid mechanism |
| 10 | **Chat/messaging** system for buyer-seller communication | Gap v1.1 #15 | 🟡 Medium | No messaging module |
| 11 | **Community module** — posts, comments, likes, knowledge sharing | Gap v1.1 #17 | 🟢 Low | Community exists globally but not aqua-specific |
| 12 | **Price intelligence** — daily species price scraping, price alerts, trend charts | Gap v1.1 #20 | 🟡 Medium | No aqua-specific price feeds |
| 13 | **KYC verification flow** for sellers/buyers | Gap v1.1 #22 | 🟡 Medium | No KYC UI |
| 14 | **Buyer subscription tiers** | Gap v1.1 #25 | 🟢 Low | No subscription system |
| 15 | **Disease identification** from photos (AI) | Gap v1.1 #30 | 🟢 Low | — |
| 16 | **Pond map view** — GPS location per pond on map | Gap v1.1 #10 | 🟡 Medium | — |
| 17 | **Export/report generation** — pond data PDF/CSV export | Gap v1.1 #35 | 🟢 Low | — |
| 18 | **BioPro score** — multi-factor pond health metric | Gap v1.1 #9 | 🟡 Medium | — |

**AquaOS Total: 18 missing features (4 Critical, 9 Medium, 5 Low)**

---

### A3. KisanConnect

**PRD Source:** KisanConnect PRD v1.0 (Rural Super-App)

#### What Exists (Android)
- `KisanHomeScreen` — stats dashboard (total equipment, available, jobs)
- `EquipmentScreen` — equipment list with status
- `BookEquipmentScreen` — booking form (dates, notes)
- `JobsScreen` — jobs list with salary/vacancies
- `PostJobScreen` — job posting form

#### What Exists (Backend)
- Equipment listing + booking (`GET /api/kisanconnect/equipment`, `POST .../equipment/:id/book`)
- Jobs CRUD (`GET/POST /api/kisanconnect/jobs`)
- Stats (`GET /api/kisanconnect/stats`)

#### MISSING

| # | Feature | PRD Section | Priority | Notes |
|---|---------|-------------|----------|-------|
| 1 | **Dual-mode paradigm** — buyer/seller mode toggle | 2.1 | 🔴 Critical | App is single-mode; no seller dashboard for equipment providers |
| 2 | **Crop Marketplace** — complete crop trading module | 8.1 | 🔴 Critical | PRD defines a full crop marketplace separate from AgriFlow; currently overlaps |
| 3 | **Equipment listing creation** by providers | 8.2 | 🔴 Critical | Only browse+book exists; no provider listing creation screen |
| 4 | **Equipment availability calendar** — real-time date blocking | 8.2.1 | 🟡 Medium | No calendar UI; no `equipment_availability_blocks` table |
| 5 | **GPS tracking** for active equipment rentals | 8.2.2 | 🟢 Low | — |
| 6 | **Rural Services Marketplace** — entire module | 8.3 | 🔴 Critical | Zero implementation (plumber, electrician, veterinary, etc.) |
| 7 | **Service booking & appointment flow** | 8.3.1 | 🔴 Critical | — |
| 8 | **Job seeker profile builder** — multi-step (skills, experience, photo) | 8.4.1 | 🟡 Medium | Job seekers can only view jobs; no profile |
| 9 | **One-tap apply** on jobs | 8.4.2 | 🟡 Medium | No application system in front-end or backend |
| 10 | **Escrow system** — full state machine for protected payments | 9.0 | 🔴 Critical | DB has `escrow_transactions` table but no escrow logic in backend routes |
| 11 | **AI crop price prediction** — LSTM model integration | 10.1 | 🟡 Medium | No AI/ML service |
| 12 | **Recommendation engine** — personalized listing feed | 10.2 | 🟡 Medium | — |
| 13 | **AI trust & safety** — fraud detection signals | 10.3 | 🟢 Low | — |
| 14 | **Payment gateway integration** (Razorpay/PhonePe) | 11.0 | 🔴 Critical | No payment code at all |
| 15 | **Payout architecture** for sellers | 11.3 | 🟡 Medium | — |
| 16 | **Review system** — post-transaction ratings | KisanConnect PRD 4.7 Reviews table | 🟡 Medium | DB has `reviews` table, no UI or API |
| 17 | **Subscription plans** for sellers/buyers | 14.0 | 🟢 Low | — |
| 18 | **In-app messaging/chat** | 3.2.4 | 🟡 Medium | No messaging system |
| 19 | **Offline-first architecture** — SQLite caching, sync queue | 7.5 | 🔴 Critical | PRD mandates full offline; only crop/district caching exists |
| 20 | **Voice input on all text fields** | 7.3 | 🟡 Medium | — |
| 21 | **Multi-language support** (12 Indian languages per PRD) | 2.2 | 🟡 Medium | English only |
| 22 | **Equipment security deposit handling** | 4.4 | 🟡 Medium | No deposit logic |
| 23 | **Logistics/delivery tracking** for crop orders | 4.3 | 🟢 Low | — |
| 24 | **Service provider portfolio/photos** | 4.5 | 🟢 Low | — |

**KisanConnect Total: 24 missing features (8 Critical, 11 Medium, 5 Low)**

---

### A4. FarmerConnect

**PRD Source:** FarmerConnect Platform PRD v1.0 (PropTech + AgriTech marketplace)

#### What Exists (Android)
- `FarmerConnectHomeScreen` — stats and property type filter
- `PropertiesScreen` — property listing with type/rent filter
- `AddPropertyScreen` — form (title, type, location, area, rent, furnishing, floor, description, amenities)

#### What Exists (Backend)
- `GET/POST /api/farmerconnect/properties` — list + create
- `GET /api/farmerconnect/properties/:id` — detail
- `GET /api/farmerconnect/stats` — aggregate counts

#### MISSING

| # | Feature | PRD Section | Priority | Notes |
|---|---------|-------------|----------|-------|
| 1 | **Property detail screen** | 3.0 | 🔴 Critical | API exists but no Android detail screen; can't view full listing |
| 2 | **Search system** — text, voice, map, AI matching | 2.1 | 🔴 Critical | Only basic type/rent filtering |
| 3 | **25+ filter taxonomy** — BHK, rent range, furnishing, floor, pet-friendly, etc. for urban; soil type, irrigation, water source for agri land | 2.2 | 🔴 Critical | Only `type` and `min_rent/max_rent` filters |
| 4 | **Map view** — properties as pins on MapBox map | Journey 1 Screen 4 | 🟡 Medium | No map integration |
| 5 | **Photo gallery** — multi-photo upload + swipeable carousel | 3.1 Step 2 | 🔴 Critical | No photos at all (DB column exists: `properties.photos` not in schema) |
| 6 | **KYC verification system** (4 levels) | 15.1 | 🔴 Critical | No KYC flow |
| 7 | **Contact unlock system** with credits | 4.3, 5.5 | 🟡 Medium | Backend has `/properties/:id/contact` but no credit/plan gating |
| 8 | **Number masking / call system** (masked calls via Exotel/Agora) | 4.2 | 🟡 Medium | Phone numbers exposed directly |
| 9 | **Chat system** — real-time encrypted messaging | 4.1 | 🟡 Medium | No chat |
| 10 | **Digital agreement generation** — rental + land lease | 5.0, 6.3 | 🟡 Medium | No agreement system |
| 11 | **Rent payment processing** — UPI/card via Razorpay | Journey 5 | 🟡 Medium | No payment integration |
| 12 | **Society management module** — maintenance billing, visitor management | 8.0 | 🟢 Low | Entire module missing |
| 13 | **PG/Co-living module** — PG listings, booking, reviews | 7.0 | 🟡 Medium | Property type includes PG but no PG-specific fields |
| 14 | **Agricultural land module** — survey number, Dharani API, lease agreement | 6.0 | 🟡 Medium | Property type includes Agri but no land-specific fields |
| 15 | **AI smart matching engine** — preference + vector similarity | 12.3 Feature 1 | 🟢 Low | — |
| 16 | **Fair rent predictor** | 12.3 Feature 2 | 🟢 Low | — |
| 17 | **Listing verification process** — auto-checks + manual review queue | 3.2 | 🟡 Medium | Properties have `is_verified` flag but no verification workflow |
| 18 | **Shortlisting/favorites** | Journey 1 Screen 6 | 🟡 Medium | No shortlist functionality |
| 19 | **Visit scheduling** — date picker + confirmation | Journey 1 Screen 12 | 🟡 Medium | — |
| 20 | **Deal confirmation flow** | 8.0 | 🟡 Medium | — |
| 21 | **Subscription plans** — seeker/owner tiers | 4.1 | 🟢 Low | — |
| 22 | **Listing expiry & refresh** | 3.4 | 🟢 Low | — |
| 23 | **Owner dashboard** — views, contacts, messages analytics | Journey 2 Screen 12 | 🟢 Low | — |
| 24 | **Support ticket system** | 9.0 | 🟢 Low | — |
| 25 | **RM (Relationship Manager) dashboard** | 9.2 | 🟢 Low | — |

**FarmerConnect Total: 25 missing features (5 Critical, 12 Medium, 8 Low)**

---

### A5. Intelligence

**PRD Sources:** AgriFlow PRD Section 8, AquaOS Gap Analysis, KisanConnect PRD Section 10

#### What Exists (Android)
- `IntelligenceHomeScreen` — platform stats (users, listings, volume)
- `PricesScreen` — list of crop prices with trend icons
- `HeatmapScreen` — text-based supply/demand by crop

#### What Exists (Backend)
- `GET /api/intelligence/supply-demand` — crop supply/demand with simulated demand
- `GET /api/intelligence/district-heatmap` — district-level declaration/listing aggregates
- `GET /api/intelligence/prices` — price feeds with simulated fluctuation
- `GET /api/intelligence/platform-stats` — aggregate counts
- `GET /api/intelligence/activity-feed` — recent activity

#### MISSING

| # | Feature | PRD Section | Priority | Notes |
|---|---------|-------------|----------|-------|
| 1 | **Actual map rendering** — choropleth heatmap (MapBox) | AgriFlow 8.1 | 🔴 Critical | Text-only; no map component |
| 2 | **Price trend charts** — historical price graph per crop per mandi | AgriFlow 8.2 | 🔴 Critical | List view only; no charting library |
| 3 | **30/60/90-day harvest forecasts** | AgriFlow 8.3 | 🟡 Medium | `forecasts` table in DB, no API or UI |
| 4 | **Supply forecasting models** | KisanConnect 10.1 | 🟡 Medium | No ML service |
| 5 | **Buyer-specific intelligence reports** | AgriFlow 8.4 | 🟡 Medium | — |
| 6 | **Watchlists & price alerts** | AgriFlow 8.5 | 🟡 Medium | No watchlist entity |
| 7 | **FPO directory** | AgriFlow 8.6 | 🟢 Low | — |
| 8 | **District-level supply intelligence API** (production-quality) | AgriFlow 8.7 | 🟡 Medium | Exists but demand is simulated with `Math.random()` |
| 9 | **AI price prediction** — LSTM model | KisanConnect 10.1 | 🟡 Medium | — |
| 10 | **Real-time government data integration** (Agmarknet API) | KisanConnect 10.1.1 | 🟡 Medium | Price feeds exist but are static seed data, not live |
| 11 | **Satellite imagery integration** (NDVI vegetation index) | KisanConnect 10.1.1 | 🟢 Low | — |
| 12 | **Weather data integration** (IMD API) | KisanConnect 10.1.1 | 🟢 Low | — |

**Intelligence Total: 12 missing features (2 Critical, 7 Medium, 3 Low)**

---

### A6. Cross-Platform

#### Auth System

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| 1 | **Multi-role support** — farmer/buyer/FPO/admin/service_provider switchable | 🔴 Critical | Auth sends role but it's hardcoded "farmer" in Android; no role selection UI |
| 2 | **Onboarding flow** — farm details, GPS, crops, land area | 🔴 Critical | Just phone + name + OTP |
| 3 | **KYC verification** — Aadhaar, PAN, doc upload | 🔴 Critical | `user_profiles` table exists with KYC fields but no UI or API |
| 4 | **Rate limiting on OTP** | 🟡 Medium | Backend does phone regex but no rate-limiting (per PRD: 5 attempts/10min) |
| 5 | **Refresh token rotation** | 🟡 Medium | Backend stores refresh tokens but Android doesn't auto-refresh |

#### Home Screen

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| 6 | **Weather widget** | 🟡 Medium | — |
| 7 | **Personalized feed** based on user role/activity | 🟡 Medium | Static cards for all users |
| 8 | **Quick actions** based on role | 🟢 Low | Same actions for all roles |

#### Profile Screen

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| 9 | **Profile photo upload** | 🟡 Medium | `avatar_url` in DB, no upload UI |
| 10 | **Extended profile editing** — farm details, bank account, KYC | 🔴 Critical | Only name/role editable |
| 11 | **Notification preferences** | 🟢 Low | — |
| 12 | **Language selection** | 🟡 Medium | `language` column in users table, no UI |
| 13 | **Data export / account deletion** (DPDP compliance) | 🟡 Medium | — |

#### Community

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| 14 | **Comments on posts** | 🟡 Medium | Only likes exist |
| 15 | **Post categories UI** | 🟢 Low | Category param exists but no filter chips on screen |
| 16 | **Image attachments on posts** | 🟡 Medium | — |
| 17 | **Expert/verified badge** on posts | 🟢 Low | — |

#### Orders

| # | Gap | Priority | Notes |
|---|-----|----------|-------|
| 18 | **Order detail screen** | 🟡 Medium | API exists (`GET /orders/:id`) but no detail screen in Android |
| 19 | **Order tracking** — delivery status updates | 🟡 Medium | Status updates exist but no tracking UI |
| 20 | **Payment integration** on order placement | 🔴 Critical | Orders can be placed with zero payment |
| 21 | **Escrow integration** — order ↔ escrow state machine | 🔴 Critical | DB table exists, no business logic |

**Cross-Platform Total: 21 missing features (6 Critical, 11 Medium, 4 Low)**

---

## B. Missing Backend Endpoints

### Entirely Missing API Modules

| Module | PRD Source | Missing Endpoints |
|--------|-----------|-------------------|
| **KYC/Verification** | All PRDs | `POST /users/kyc/initiate`, `GET /users/kyc/status`, `POST /users/kyc/upload` |
| **Payments** | FarmerConnect 5.0, KisanConnect 11.0 | `POST /payments/order`, `POST /payments/verify`, `GET /payments/history`, `GET /payments/receipts/:id` |
| **Escrow** | KisanConnect 9.0 | `GET /escrow/:id`, `POST /escrow/:id/action`, `POST /escrow/:id/dispute` |
| **Subscriptions** | FarmerConnect 4.1, KisanConnect 14.0 | `GET /plans`, `POST /subscriptions`, `GET /subscriptions/current` |
| **Agreements** | FarmerConnect 5.0, 6.3 | `POST /agreements`, `GET /agreements/:id`, `POST /agreements/:id/sign`, `GET /agreements/:id/download` |
| **Messaging/Chat** | FarmerConnect 4.1, KisanConnect 3.2.4 | `GET /conversations`, `POST /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages` |
| **Search (advanced)** | FarmerConnect 2.1, KisanConnect 8.1.2 | `GET /search/listings` (vector + geo + filters), `GET /search/suggest`, `GET /search/nearby` |
| **Reviews** | KisanConnect 4.7, FarmerConnect 12.0 | `GET /reviews/:targetId`, `POST /reviews` |
| **Rent Payments** | FarmerConnect 5.2 | `POST /rent-payments/initiate`, `GET /rent-payments/history`, `GET /rent-payments/schedule` |
| **Society** | FarmerConnect 8.0 | Entire society management API |
| **Support Tickets** | FarmerConnect 9.0 | `POST /tickets`, `GET /tickets/:id`, `PATCH /tickets/:id` |
| **AI/ML** | KisanConnect 10.0 | `GET /ai/predictions/price`, recommendation endpoints |
| **Webhooks** | FarmerConnect 13.2, KisanConnect 11.1 | Razorpay, MSG91, Agora, DigiLocker webhook handlers |

### Partially Implemented Endpoints (Missing Features)

| Existing Endpoint | What's Missing |
|-------------------|----------------|
| `POST /api/auth/verify-otp` | No rate limiting; no onboarding data collection |
| `GET /api/agriflow/listings` | Only 4 filters (crop, district, organic, grade); PRD requires 25+ |
| `GET /api/intelligence/supply-demand` | Demand is simulated (`Math.random()`); needs real inquiry-based demand |
| `GET /api/intelligence/prices` | Price fluctuation simulated; needs Agmarknet API integration |
| `POST /api/orders` | No payment/escrow integration; no commission calculation |
| `GET /api/farmerconnect/properties` | No geo search (PostGIS), no AI matching, limited filters |
| `POST /api/agriflow/listings` | No image upload handling; no GPS location |
| `POST /api/kisanconnect/equipment/:id/book` | No escrow/payment; no availability calendar check |

### Missing Backend Infrastructure

| Component | PRD Requirement | Current State |
|-----------|----------------|---------------|
| **WebSocket server** for real-time chat | FarmerConnect 4.1, KisanConnect 3.2.4 | `websocket.js` exists but only for basic notifications |
| **Background job scheduler** | All PRDs (Trigger.dev, cron) | None; no listing expiry, no payment reminders |
| **File upload service** | All PRDs (Cloudflare R2) | No file upload endpoint |
| **Email service** | FarmerConnect 13.0 (Resend) | No email sending |
| **SMS service** (beyond OTP) | All PRDs (MSG91) | OTP only; no transactional SMS |
| **Push notifications** (FCM) | All PRDs | No FCM integration in backend |

---

## C. Missing DB Tables & Columns

### Tables That Exist in PRDs But Not in DB Schema

| Table | PRD Source | Purpose |
|-------|-----------|---------|
| `messages` / `conversations` | FarmerConnect 9.4, KisanConnect 3.2.4 | Chat/messaging between users |
| `payments` | FarmerConnect 9.4, KisanConnect 4.7 | Payment transaction records |
| `subscriptions` / `subscription_plans` | FarmerConnect 4.1, KisanConnect 14.0 | User subscription management |
| `agreements` | FarmerConnect 9.4 | Digital rental/lease agreements |
| `deals` | FarmerConnect 9.4 | Deal confirmation records |
| `support_tickets` | FarmerConnect 9.4 | Customer support tickets |
| `society` / `society_residents` / `society_visitors` | FarmerConnect 8.0 | Society management |
| `listing_shortlists` | FarmerConnect Journey 1 | User shortlisted properties |
| `equipment_availability_blocks` | KisanConnect 8.2.1 | Equipment calendar blocking |
| `service_listings` / `service_requests` | KisanConnect 4.5 | Rural services marketplace |
| `job_applications` | KisanConnect 4.6 | Job seeker applications |
| `seller_profiles` / `buyer_profiles` | KisanConnect 4.2 | Extended marketplace profiles |
| `bank_accounts` | KisanConnect 4.7 | Seller bank details for payouts |
| `feed_logs` | AquaOS Gap v1.1 | Aquaculture feed tracking |
| `mortality_logs` | AquaOS Gap v1.1 | Aquaculture mortality events |
| `growth_samples` | AquaOS Gap v1.1 | Weight sampling for aqua |
| `user_watchlists` | AgriFlow 8.5 | Crop/region watch alerts |

### Missing Columns on Existing Tables

| Table | Missing Column | PRD Requirement |
|-------|---------------|-----------------|
| `users` | `kyc_level` (0-4) | FarmerConnect 15.1 — KYC access rights |
| `users` | `fcm_token` | All PRDs — push notifications |
| `users` | `preferred_language` (BCP-47) | KisanConnect 4.2 — language preference used everywhere |
| `supply_listings` | `farmer_name`, `location_label` | AgriFlow backend uses them but they're not in the migration SQL |
| `properties` | `bhk`, `floor`, `total_floors`, `furnishing`, `facing`, `deposit_amount`, `latitude`, `longitude`, `geo_point`, `photos`, `amenities`, `ai_match_vector` | FarmerConnect 9.4 — complete property schema |
| `orders` | `seller_id` (proper FK) | Current backend query derives seller from listing; KisanConnect PRD stores it directly |
| `orders` | `listing_type`, `price_per_unit` | Backend uses but migration doesn't have them |
| `equipment` | `security_deposit_paisa`, `insurance_info`, `operator_rate_paisa` | KisanConnect 4.4 |
| `ponds` | `feed_type`, `last_feed_date`, `total_feed_kg` | AquaOS Gap v1.1 |

### Schema Mismatch: DB vs Backend

The backend routes reference tables/columns not defined in the migration:

| Backend Reference | Not in Migration |
|-------------------|-----------------|
| `otps` table | Used in `auth.js` but not in `001_foundation.sql` |
| `refresh_tokens` table | Used in `auth.js` |
| `community_posts` table | Used in `community.js` |
| `properties` table | Used in `farmerconnect.js` |
| `equipment` table | Used in `kisanconnect.js` |
| `equipment_bookings` table | Used in `kisanconnect.js` |
| `jobs` table | Used in `kisanconnect.js` |
| `harvest_listings` table | Used in `aquaos.js` (distinct from `harvest_availability`) |
| `advisories` table | Used in `aquaos.js` |
| `water_quality_logs` table | Used in `aquaos.js` |
| `activity_feed` table | Used in `intelligence.js` |

**Note:** The `setup-db.js` / `seed.js` files likely create these tables outside the migration. This is an architectural concern — all tables should be in versioned migrations.

---

## D. Architectural Gaps

### D1. Offline-First Architecture

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Full offline functionality (KisanConnect Law 1) | Room DB caches crops + districts only | 🔴 No offline action queue, no listing cache, no message cache |
| Background sync with conflict resolution | `OfflineAction` Room entity mentioned in code but never used | 🔴 Not implemented |
| SQLite local cache (200 recent listings, draft orders, messages) | Only CropDao + DistrictDao | 🔴 No listing/order/message caching |
| WorkManager sync on connectivity change | None | 🔴 Not implemented |

### D2. Security & Auth

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| JWT refresh token rotation on each use | Backend stores refresh tokens; no rotation | 🟡 Security risk |
| OTP rate limiting (5 attempts/10 min) | No rate limiting on send-otp | 🔴 Abuse vector |
| Row-Level Security (RLS) on all tables | Migration has RLS policies | ✅ Implemented in SQL |
| Aadhaar stored as SHA-256 hash only | `user_profiles.aadhaar_hash` defined | ✅ Schema correct |
| Bank account AES-256 encryption | `bank_account_enc` field exists | ✅ Schema correct (needs app-level encryption) |
| DPDP Act compliance (right to erasure, export) | No delete account or data export API | 🟡 Missing |
| Input validation (Zod schema) | Basic `if (!field)` checks only | 🟡 Weak validation |
| CORS/CSRF protection | Not visible in code | 🟡 Needs review |
| Concurrent session limit (5 devices) | No session management | 🟡 Missing |

### D3. Real-Time Infrastructure

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| WebSocket for chat + notifications | Basic `websocket.js` exists | 🟡 Not connected to chat system |
| Push notifications (FCM) | No FCM integration | 🔴 Not implemented |
| Real-time price updates | Simulated in API response | 🟡 No streaming |

### D4. Payment Infrastructure

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Razorpay integration | Zero payment code | 🔴 Not implemented |
| Escrow state machine | DB table exists, no business logic | 🔴 Not implemented |
| UPI as default payment | — | 🔴 — |
| Commission calculation on orders | DB has `commission_rate` field, no calculation in routes | 🟡 Partially modeled |
| Seller payouts | — | 🔴 — |
| Receipt PDF generation | — | 🟢 Not critical for MVP |

### D5. AI/ML Layer

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Crop price prediction (LSTM model) | No ML service | 🟡 Entire module missing |
| Recommendation engine | No personalization | 🟡 — |
| Fraud detection | No fraud signals | 🟢 — |
| AI listing summaries | No LLM integration | 🟢 — |
| Voice search (Whisper) | No voice input | 🟡 — |
| Vector search (pgvector) | Extension enabled in migration, not used | 🟡 Schema ready, no code |

### D6. File/Media Management

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Image upload to Cloudflare R2 | No upload endpoint or client code | 🔴 Critical for listings |
| Image compression/optimization | — | 🟡 — |
| Camera integration (Android) | No camera permission or library | 🔴 — |
| Video upload | — | 🟢 Phase 2 |
| Document upload (KYC, agreements) | — | 🟡 — |

### D7. Multi-Tenancy / Role System

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| 5+ user roles (farmer, FPO, buyer, admin, service_provider) | DB enum exists; Android hardcodes "farmer" | 🔴 No role switching |
| Role-based navigation | Same nav for all users | 🔴 PRD requires different bottom tabs per role |
| Admin panel | No admin routes or screens | 🟡 Backend has no admin endpoints |
| FPO management mode | No FPO-specific screens | 🔴 — |

### D8. Deployment & DevOps

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Docker containerization | `backend/Dockerfile` exists | ✅ |
| CI/CD pipeline | `docker-compose.yml` exists | 🟡 No GitHub Actions config |
| Database migrations (versioned) | Migration SQL exists but incomplete (see Section C) | 🟡 Many tables missing from migration |
| Monitoring (Sentry, PostHog) | No integration | 🟡 Post-MVP |
| E2E test suite | No tests | 🟡 — |

---

## E. UI/UX Improvements Needed

### E1. Design System Gaps

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| **Design tokens** — specific color system (Forest Green #1B5E20, Harvest Orange #FF6F00) | Custom `AppColor` object with generic green/blue | 🟡 Needs alignment with PRD color tokens |
| **Typography** — Noto Sans/Regional + Inter + Mukta for Telugu | System default fonts | 🟡 No custom font loading |
| **Component library** — standardized atoms, molecules, organisms | `CommonComponents.kt` has basics (GradientHeader, ActionCard, etc.) | 🟡 Needs PropertyCard, ChatBubble, SearchBar atoms |
| **Dark mode** | Not implemented | 🟢 Low priority |
| **Accessibility (WCAG 2.1 AA)** | No `contentDescription` on icons, no contrast checking | 🟡 Needs audit |

### E2. Navigation Architecture

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| **FarmerConnect PRD:** 5 tabs (Home/Search, Shortlist, Messages, Activity, Profile) | 5 tabs (Home, AgriFlow, AquaOS, Kisan, Profile) | 🟡 Different tab structure; no Messages or Activity tabs |
| **KisanConnect PRD:** 5 tabs (Home, Explore, Activity, Messages, Profile) | Same tabs as above | 🟡 Same issue |
| **Role-based navigation** — different tabs per role | Static tabs | 🔴 Not implemented |
| **Side drawer** for admin/RM users | No drawer | 🟡 — |
| **City selector** in top nav | No city/location selection | 🟡 — |
| **Notification bell** with badge count | No notification badge in nav | 🟡 Notification screen exists but no badge |

### E3. Screen-Level Improvements

| Screen | Issue | Priority |
|--------|-------|----------|
| **CreateListingScreen** | Crop ID is raw text field; should be searchable dropdown with emoji/photos | 🔴 |
| **CreateListingScreen** | No photo upload step | 🔴 |
| **CreateDeclarationScreen** | Date fields are plain text; should be date pickers | 🟡 |
| **AddPondScreen** | Single form; should be multi-step wizard per PRD | 🟡 |
| **PricesScreen** | List only; needs sparkline/trend charts per crop | 🟡 |
| **HeatmapScreen** | Text-based; needs actual MapBox choropleth map | 🔴 |
| **PropertiesScreen** | No photos on cards; no map view toggle | 🟡 |
| **EquipmentScreen** | No availability calendar visualization | 🟡 |
| **JobsScreen** | No application mechanism | 🟡 |
| **BookEquipmentScreen** | No calendar date picker; plain text dates | 🟡 |
| **ProfileScreen** | No photo upload; no KYC section; no farm details | 🟡 |
| **All screens** | No skeleton loading; instant jump from loading → content | 🟢 |
| **All screens** | No empty state illustrations (just text) | 🟢 |

### E4. Motion & Animation

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Card enter: fade up 8px (150ms ease-out) | No entry animations | 🟢 |
| Photo gallery: native-feel swipe | No photo gallery | 🟡 |
| OTP input: shake on error | No error animation | 🟢 |
| Loading: skeleton shimmer | `CircularProgressIndicator` only | 🟢 |
| Deal confirmation: confetti burst | — | 🟢 |

---

## Summary Statistics

| Category | Critical | Medium | Low | Total |
|----------|----------|--------|-----|-------|
| A1. AgriFlow | 7 | 12 | 8 | **27** |
| A2. AquaOS | 4 | 9 | 5 | **18** |
| A3. KisanConnect | 8 | 11 | 5 | **24** |
| A4. FarmerConnect | 5 | 12 | 8 | **25** |
| A5. Intelligence | 2 | 7 | 3 | **12** |
| A6. Cross-Platform | 6 | 11 | 4 | **21** |
| **Section A Total** | **32** | **62** | **33** | **127** |
| B. Backend Endpoints | — | — | — | **13 modules + 8 partial** |
| C. DB Tables/Columns | — | — | — | **17 tables + 9 column sets** |
| D. Architectural Gaps | 12 | 10 | 3 | **25** |
| E. UI/UX | 4 | 14 | 7 | **25** |

### Implementation Readiness Score

| Component | PRD Completeness | Estimated % Done |
|-----------|-----------------|------------------|
| AgriFlow Farmer App | Basic CRUD | **~15%** |
| AgriFlow FPO Platform | Nothing | **~0%** |
| AgriFlow Buyer Intelligence | Partial backend | **~8%** |
| AquaOS Farm OS | Pond + water basics | **~25%** |
| AquaOS Marketplace | Harvest listings only | **~10%** |
| KisanConnect Equipment | Browse + book | **~15%** |
| KisanConnect Jobs | Browse + post | **~15%** |
| KisanConnect Services | Nothing | **~0%** |
| KisanConnect Escrow/Payments | DB schema only | **~5%** |
| FarmerConnect PropTech | Basic listing | **~8%** |
| FarmerConnect AgriLand | Nothing specific | **~3%** |
| Intelligence | Basic stats/prices | **~12%** |
| Auth & Onboarding | OTP auth only | **~20%** |
| Payment System | Nothing | **~0%** |
| Chat/Messaging | Nothing | **~0%** |
| Offline Architecture | DB entities only | **~5%** |
| AI/ML | Nothing | **~0%** |

### Recommended Priority for Next Sprint

1. **Auth onboarding + role system** — unblocks all role-specific features
2. **Photo/file upload** — unblocks listings, KYC, profiles
3. **Payment integration** (Razorpay) — unblocks orders, subscriptions
4. **Property detail screen** (FarmerConnect) — basic UX gap
5. **Crop selector improvement** — dropdown with icons instead of raw ID
6. **OTP rate limiting** — security fix
7. **Offline sync queue** — wiring up the existing Room entities
8. **Date pickers** on all date fields — UX quality
