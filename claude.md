# 🚀 AgriHub — Complete Implementation Plan (claude.md)

## Master Plan: AquaOS + KisanConnect + AgriFlow + FarmerConnect + Intelligence Platform

**Date:** May 2026  
**Scope:** Full platform implementation plan for each module — from current state to PRD-complete  
**Architecture:** Express.js backend + PostgreSQL + Vite frontend (Vanilla JS) + Android (Kotlin)  
**PRD Sources:** AquaOS PRD v1.0, KisanConnect PRD v1.0, AgriFlow India PRD v1.0, FarmerConnect PRD v1.0, Agriculture Supply Intelligence Platform PRD

---

## 📋 Table of Contents

1. [AquaOS — Aquaculture Operating System](#1-aquaos--aquaculture-operating-system)
2. [KisanConnect — Rural Super-App & Equipment Marketplace](#2-kisanconnect--rural-super-app--equipment-marketplace)
3. [AgriFlow — Supply Chain & Marketplace](#3-agriflow--supply-chain--marketplace)
4. [FarmerConnect — PropTech + AgriLand Marketplace](#4-farmerconnect--proptech--agriland-marketplace)
5. [Intelligence Platform — Market Intelligence & AI Layer](#5-intelligence-platform--market-intelligence--ai-layer)
6. [Cross-Platform Infrastructure](#6-cross-platform-infrastructure)
7. [BhoomiOS & AgriGalaxy — Emerging Modules](#7-bhoomios--agrigalaxy--emerging-modules)
8. [Priority Execution Order](#8-priority-execution-order)

---

## 1. AquaOS — Aquaculture Operating System

### Current State (Already Built: V1-V10)

| Version | Features Implemented |
|---------|---------------------|
| V1 | Pond CRUD, water logging, harvest listings, advisories, farm stats |
| V2 | Financial tracking, disease reports, PMMSY schemes, cold chain, training, auctions, benchmarks, KPI engine |
| V3 | RFQ system, escrow payments, yield forecasting (Von Bertalanffy), community, farmer onboarding, regional analytics |
| V4 | Culture units (pond/RAS/cage/biofloc/hatchery), production cycles, multi-species, harvest optimizer, IoT device management, trust verification |
| V5 | Advanced KPI engine (SGR/ADG/FCR), predictive growth models, bio-economic optimization, rule-based alert engine, B2B supply marketplace |
| V6 | Fish marketplace (auction/RFQ/fixed-price), quality grading BIS, cold chain+ with temp monitoring, farm-to-fork traceability (QR/blockchain), PMMSY DPR builder, national supplier directory |
| V7 | Verified seller reviews, logistics providers + IoT temp monitoring, online dispute resolution (3-tier), trade credit with net terms, training curriculum (ICAR-CIFA/ASCI), vessel monitoring VMS |
| V8 | Role-based ecosystem (roleGuard), crop posts, community discussions, market prices multi-district, supply forecast, supplier promotions, sales leads, expert advisory, 7-step workflow |
| V9 | Privacy controls (per-field), real-time negotiation rooms, notification preferences + quiet hours, production insights, admin panel, fraud reporting |
| V10 | Analytics layer, full-text search (PostgreSQL gin), Razorpay payments, pricing intelligence (14 AP markets), chat rooms, AI prediction engine, growth metrics (4 districts), IoT sensor ingestion |

### Remaining Gaps (Per AquaOS PRD & Gap Analysis v1.1)

#### Phase A: Core Farm Management Enhancements

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 1 | **Farm creation wizard (3-step with GPS)** | 🔴 Critical | Create multi-step form: Step 1 (farm name, type, district), Step 2 (GPS location capture via browser geolocation API), Step 3 (species selection, water source). Backend: `POST /api/aquaos/farms` with lat/lng fields. Android: Add location permission + fused location provider |
| 2 | **Feed logging system** | 🔴 Critical | New table `aqua_feed_logs` (pond_id, feed_type, quantity_kg, cost, fcr_computed, date). Backend: `POST/GET /api/aquaos/ponds/:id/feed-logs`. Auto-compute FCR = total_feed_kg / (harvest_weight - stocking_weight). Frontend: Daily feed entry form with running FCR display |
| 3 | **Mortality logging** | 🟡 Medium | New table `aqua_mortality_logs` (pond_id, count, cause, symptoms[], photo_url, date). Backend: `POST/GET /api/aquaos/ponds/:id/mortality`. Auto-update `survival_pct` on pond. Frontend: Quick-log modal with symptom checklist |
| 4 | **Growth sampling history** | 🟡 Medium | New table `aqua_growth_samples` (pond_id, sample_date, avg_weight_g, sample_size, expected_weight_g). Backend: `POST/GET /api/aquaos/ponds/:id/growth-samples`. Frontend: Growth curve chart (actual vs predicted Von Bertalanffy) |
| 5 | **Water quality threshold alerts** | 🟡 Medium | Add `aqua_alert_rules` table (species_id, parameter, min_value, max_value, severity). On water log submission, check against rules → create alert. Push notification via existing notification system |
| 6 | **BioPro score (pond health metric)** | 🟡 Medium | Composite score: water_quality_score (30%) + survival_rate (25%) + fcr_score (20%) + growth_rate (15%) + stocking_density (10%). Compute on each water log/feed log update. Display as circular gauge on pond detail |

#### Phase B: Marketplace & Trade Enhancements

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 7 | **Offer/bid system on harvest listings** | 🟡 Medium | New table `aqua_listing_offers` (listing_id, buyer_id, offered_price, quantity_kg, status, message). Backend: `POST /api/aquaos/harvest-listings/:id/offers`, `PATCH .../offers/:id/accept`. Integrates with existing V3 escrow |
| 8 | **Aqua-specific price intelligence** | 🟡 Medium | Extend V10 pricing to scrape/ingest species prices from Andhra Pradesh, Tamil Nadu, West Bengal fish markets. Daily cron job. Frontend: Price trend chart per species per market |
| 9 | **Buyer subscription tiers** | 🟢 Low | Leverage existing V10 monetization config. Add aqua-specific plans: Basic (view listings), Pro (contact sellers + price alerts), Enterprise (bulk RFQ + analytics) |
| 10 | **Disease identification from photos (AI)** | 🟢 Low | Integration with image classification API. Upload photo → classify disease (EUS, white spot, gill rot). Return treatment advisory. Phase: Post-MVP |

#### Phase C: Integration & Advanced

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 11 | **Pond map view** | 🟡 Medium | Use Leaflet/MapBox on frontend. Each pond has lat/lng from farm GPS. Cluster markers by farm. Click → pond detail popup |
| 12 | **Export/report generation** | 🟢 Low | Backend: `GET /api/aquaos/ponds/:id/report?format=pdf`. Generate PDF using pdfkit with pond stats, water history, growth chart, feed summary, financial P&L |
| 13 | **CIBA/MPEDA integration** | 🟢 Low | Import species-specific culture protocols from Central Institute of Brackishwater Aquaculture. Advisory engine references CIBA guidelines |

### AquaOS Implementation Priorities (Ordered)

```
1. Feed logging system (daily use, FCR calculation) — 2-3 days
2. Farm creation wizard with GPS — 2 days
3. Water quality threshold alerts — 1-2 days
4. Growth sampling + chart — 2 days
5. Mortality logging — 1 day
6. BioPro score — 1 day
7. Offer/bid on listings — 2-3 days
8. Price intelligence expansion — 2 days
9. Pond map view — 1-2 days
10. Report generation — 2 days
```

---

## 2. KisanConnect — Rural Super-App & Equipment Marketplace

### Current State

**Backend routes:** `kisanconnect.js` (equipment CRUD, booking, jobs, stats) + Phase 5 ROS routes (`vehicles.js`, `delivery.js`, `gigworkers.js`, `transport.js`)  
**Frontend:** `KisanConnectScreen.js` (equipment hub)  
**Android:** KisanHomeScreen, EquipmentScreen, BookEquipmentScreen, JobsScreen, PostJobScreen  
**DB:** `migrate-v10-ros.js` (vehicles, transport_requests, delivery_tracking, gig_workers, gig_assignments)

### Missing Features (Per KisanConnect PRD v1.0)

#### Phase A: Marketplace Foundation

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 1 | **Dual-mode paradigm (buyer/seller toggle)** | 🔴 Critical | Add `mode` state to KisanConnectScreen. Seller mode shows: My Listings, Earnings, Orders Received, Availability Calendar. Buyer mode shows: Browse, Book, My Bookings. Backend: Filter queries by `owner_id` for seller views |
| 2 | **Equipment listing creation by providers** | 🔴 Critical | New form: equipment name, type (tractor/harvester/sprayer/drone), photos, hourly/daily rate, location, availability. Backend: `POST /api/kisanconnect/equipment` with `owner_id`. Add `equipment_photos`, `rate_hourly`, `rate_daily`, `security_deposit` columns |
| 3 | **Equipment availability calendar** | 🟡 Medium | New table `equipment_availability_blocks` (equipment_id, date, status: available/booked/maintenance). Frontend: Calendar component showing blocked dates. Booking validation against calendar |
| 4 | **Rural Services Marketplace** | 🔴 Critical | New tables: `service_listings` (provider_id, service_type, description, rate, location, rating), `service_bookings` (listing_id, customer_id, date, time_slot, status). Service types: plumber, electrician, veterinary, tractor_repair, well_boring, solar_installation. Backend: Full CRUD + booking flow |
| 5 | **Service booking & appointment flow** | 🔴 Critical | State machine: requested → confirmed → in_progress → completed → rated. Notifications at each step. Provider dashboard shows incoming requests |

#### Phase B: Jobs & Gig Economy

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 6 | **Job seeker profile builder** | 🟡 Medium | Multi-step form: personal info → skills (dropdown multi-select) → experience → education → photo → preferred work type (farm_labor/driver/machine_operator/warehouse). New table `job_seeker_profiles` |
| 7 | **One-tap apply on jobs** | 🟡 Medium | New table `job_applications` (job_id, seeker_id, status, applied_at, message). Backend: `POST /api/kisanconnect/jobs/:id/apply`. Status: applied → shortlisted → hired → rejected |
| 8 | **GPS tracking for active rentals** | 🟢 Low | During active booking period, equipment location shared via periodic GPS pings. Table `equipment_location_pings` (booking_id, lat, lng, timestamp). Map view for renter |

#### Phase C: Payments & Trust

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 9 | **Escrow system for equipment rentals** | 🔴 Critical | On booking confirmation, buyer deposits amount into escrow (extends existing `escrow_transactions` table). On rental completion + OTP verification → release to provider. Dispute mechanism for damages |
| 10 | **Payment gateway (Razorpay)** | 🔴 Critical | Integrate Razorpay Orders API. Backend: `POST /api/payments/create-order`, `POST /api/payments/verify`. Webhook handler for payment confirmation. Link to equipment bookings and service orders |
| 11 | **Security deposit handling** | 🟡 Medium | Separate escrow hold for security deposit. Auto-release after 24h post-return if no damage claim. Deduct from deposit if damage reported with photo proof |
| 12 | **Review system post-transaction** | 🟡 Medium | After booking/service completion, prompt both parties to rate (1-5 stars + text). Aggregate rating on provider profile. Backend: extends existing `reviews` table with `review_type: equipment/service` |

#### Phase D: Crop Marketplace within KisanConnect

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 13 | **Crop trading module** | 🔴 Critical | Unified with AgriFlow listings but branded under KisanConnect for rural users. Simplified posting: crop photo → voice description → auto-classify crop → set price. Links to existing `supply_listings` table |
| 14 | **AI crop price prediction** | 🟡 Medium | Use existing Intelligence module's price prediction. Display 7-day forecast on crop listing page. "Best time to sell" indicator |
| 15 | **Recommendation engine** | 🟡 Medium | Based on user's location + past bookings + season, recommend: equipment to rent, services needed, crops trending. Collaborative filtering on similar farmer profiles |

#### Phase E: Offline & Accessibility

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 16 | **Offline-first architecture** | 🔴 Critical | Service Worker for web: cache equipment listings, job postings (200 recent). IndexedDB queue for booking requests made offline → sync on reconnect. Android: Extend Room DB with EquipmentDao, BookingDao, SyncQueue |
| 17 | **Voice input on all text fields** | 🟡 Medium | Global VoiceInput component: microphone icon on every text input. Uses Web Speech API (SpeechRecognition). Supports te-IN, hi-IN, en-IN. Auto-fills field with transcribed text |
| 18 | **Multi-language support (12 languages)** | 🟡 Medium | Extend existing i18n system (currently en/te/hi). Add: ta (Tamil), kn (Kannada), ml (Malayalam), mr (Marathi), bn (Bengali), gu (Gujarati), pa (Punjabi), or (Odia), as (Assamese). Priority: Telugu, Hindi, Tamil, Kannada first |

### KisanConnect Implementation Priorities (Ordered)

```
1. Equipment listing creation (seller mode) — 2 days
2. Dual-mode toggle (buyer/seller) — 1 day
3. Rural Services Marketplace (tables + CRUD) — 3-4 days
4. Payment gateway (Razorpay) — 3 days
5. Escrow for rentals — 2 days
6. Service booking flow — 2 days
7. Job applications — 1-2 days
8. Availability calendar — 2 days
9. Review system — 1-2 days
10. Offline caching — 3-4 days
11. Voice input — 2 days
12. Security deposit handling — 1 day
13. GPS tracking — 2 days
14. AI recommendations — 3 days
```

---

## 3. AgriFlow — Supply Chain & Marketplace

### Current State

**Backend:** `agriflow.js` (listings CRUD, inquiries, declarations, crops, districts)  
**Frontend:** `AgriFlowScreen.js`  
**Android:** AgriFlowHomeScreen, ListingsScreen, ListingDetailScreen, CreateListingScreen, DeclarationsScreen, InquiriesScreen

### Missing Features (Per AgriFlow PRD v1.0)

#### Phase A: Farmer App Enhancements

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 1 | **Farmer onboarding wizard** | 🔴 Critical | Multi-step after OTP: village/district (dropdown) → land area (acres) + irrigation type → soil type + crops grown (multi-select from crop_catalog) → GPS location capture. Saves to `user_profiles` + `farmer_details` table. Backend: `POST /api/onboarding/farmer` (already exists, needs Android integration) |
| 2 | **GPS location on listings** | 🔴 Critical | Add lat/lng capture on CreateListingScreen. Browser geolocation / Android FusedLocationProvider. Store in `supply_listings.pickup_lat/pickup_lng`. Display distance to buyer |
| 3 | **Photo upload on listings** | 🔴 Critical | Multi-photo upload (max 5). Compress client-side → upload to backend `/api/upload` → store URLs in `supply_listings.images[]`. Gallery carousel on listing detail. Camera + gallery picker on Android |
| 4 | **Crop selector with photos/icons** | 🟡 Medium | Replace raw text input with searchable dropdown. Each crop shows `icon_emoji` + `name` + `name_te`. Fuzzy search. Backend: `GET /api/agriflow/crops?q=search_term` already exists |
| 5 | **Harvest Calendar view** | 🟡 Medium | Visual month calendar showing harvest dates from declarations. Color-coded by crop. Tap date → see declarations due. Frontend: Calendar grid component |
| 6 | **Availability Posting (auto T-15)** | 🟡 Medium | Scheduled job: 15 days before harvest_date in declarations → auto-create availability post. Notify farmer to confirm/edit. Backend: Extend `scheduler.js` with daily check |
| 7 | **Voice input for text fields** | 🟡 Medium | Shared component with KisanConnect (see above) |
| 8 | **Vernacular language (Telugu/Hindi/Kannada)** | 🟡 Medium | i18n already built. Needs: language selector in app settings, all AgriFlow strings translated, crop names shown in selected language |

#### Phase B: FPO Management Platform

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 9 | **FPO member management** | 🔴 Critical | Already partially built in `fpo.js` route. Needs Android screens: FPO dashboard → member list → add member (by phone lookup). Backend: `GET/POST /api/fpo/members` exists |
| 10 | **FPO procurement dashboard** | 🔴 Critical | Aggregate declarations from FPO members. Show: total expected harvest by crop, timeline, collection schedule. Backend: `GET /api/fpo/procurement/summary` — aggregate `declarations` WHERE `farmer_id IN (fpo_members)` |
| 11 | **FPO inventory management** | 🔴 Critical | Track post-harvest inventory: received from farmers, in storage, sold, quality graded. New table `fpo_inventory` (fpo_id, crop_id, batch_no, quantity_kg, quality_grade, storage_location, status). Backend: CRUD + batch operations |
| 12 | **FPO supply listing (quality aggregation)** | 🟡 Medium | FPO creates single listing aggregating multiple farmers' produce. Auto-compute average quality from individual lots. Higher trust score for FPO listings |
| 13 | **FPO payment management** | 🟡 Medium | Track payments: buyer → FPO → farmers. Proportional distribution by contribution. Integration with existing wallet system. Payout ledger per member |

#### Phase C: Buyer Intelligence

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 14 | **Advanced supply search (25+ filters)** | 🔴 Critical | Extend `GET /api/agriflow/listings` with: crop_id, district_id, variety, grade (A/B/C), organic, min_price, max_price, min_quantity, max_quantity, harvest_date_from, harvest_date_to, distance_km (PostGIS), fpo_only, verified_only, has_photos, sort_by (price/date/distance/rating). Frontend: Filter sheet with chips |
| 15 | **Buyer watchlists** | 🟡 Medium | Already built in `watchlists.js` route. Needs: auto-alert when new listing matches watchlist criteria. Daily notification digest. Android screen to manage watchlists |
| 16 | **Intelligence reports for buyers** | 🟡 Medium | Weekly auto-generated report: crops available in subscribed districts, price trends, supply forecast. Backend: Extend scheduler with report generation. PDF or in-app view |
| 17 | **Supply heatmaps (MapBox/Leaflet)** | 🟡 Medium | Backend `GET /api/intelligence/district-heatmap` exists. Frontend: Add actual map rendering with Leaflet. Choropleth by supply volume. Click district → drill down to listings |
| 18 | **Negotiation/offer system** | 🟡 Medium | Buyer sends offer on listing: offered_price, quantity, delivery_terms. Farmer accepts/rejects/counters. State: offered → countered → accepted → order_created. Links to existing trade engine |

### AgriFlow Implementation Priorities (Ordered)

```
1. Photo upload on listings — 2-3 days
2. GPS location capture — 1-2 days
3. Crop selector dropdown — 1 day
4. Advanced search filters — 2-3 days
5. FPO procurement dashboard — 2-3 days
6. FPO inventory management — 3 days
7. Negotiation system — 3 days
8. Farmer onboarding wizard (Android) — 2-3 days
9. Harvest calendar view — 2 days
10. Supply heatmap rendering — 2 days
11. Auto-availability posting — 1-2 days
12. FPO payment management — 2-3 days
13. Buyer intelligence reports — 2 days
```

---

## 4. FarmerConnect — PropTech + AgriLand Marketplace

### Current State

**Backend:** `farmerconnect.js` (properties CRUD, stats)  
**Frontend:** `FarmerConnectScreen.js`  
**Android:** FarmerConnectHomeScreen, PropertiesScreen, AddPropertyScreen

### Missing Features (Per FarmerConnect PRD v1.0)

#### Phase A: Core Property Experience

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 1 | **Property detail screen** | 🔴 Critical | API `GET /api/farmerconnect/properties/:id` exists. Build detail screen with: photo gallery, all property fields, owner info (masked phone), location map, similar properties. Android: PropertyDetailScreen with ViewPager for photos |
| 2 | **Photo gallery (multi-upload)** | 🔴 Critical | Add photos to property creation flow (step 2). Max 10 photos. Compress + upload via `/api/upload`. Swipeable carousel on detail screen. Add `photos TEXT[]` to properties migration |
| 3 | **25+ filter taxonomy** | 🔴 Critical | Filters: property_type, bhk (1-5), rent_range (min/max), furnishing (furnished/semi/unfurnished), floor, facing (N/S/E/W), deposit_months, pet_friendly, parking, gym, swimming_pool, for_agri_land: soil_type, irrigation, water_source, road_access, survey_number. Backend: Dynamic WHERE clause builder |
| 4 | **Map view** | 🟡 Medium | Properties displayed as pins on Leaflet map. Lat/lng required on new listings. Cluster pins by area. Click pin → mini property card. Toggle between list and map views |
| 5 | **Search system (text + voice + AI)** | 🔴 Critical | Full-text search using PostgreSQL gin indexes (already used in AquaOS V10). Voice search via Speech API. Natural language: "2BHK near Gachibowli under 15000" → parsed to filters |

#### Phase B: Trust & Verification

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 6 | **KYC verification (4 levels)** | 🔴 Critical | Levels: 0 (unverified), 1 (phone verified - OTP), 2 (email verified), 3 (ID verified - Aadhaar/PAN upload + manual review), 4 (address verified - utility bill). New table `kyc_submissions` (user_id, level, document_type, document_url, status, reviewed_by). Backend: `POST /api/verification/submit`, `GET /api/verification/status` |
| 7 | **Contact unlock with credits** | 🟡 Medium | Viewing owner phone requires credits. Free users get 3 unlocks/month. Premium unlimited. Table `contact_unlocks` (user_id, property_id, unlocked_at). Backend gate on `GET /api/farmerconnect/properties/:id/contact` |
| 8 | **Number masking (Exotel/Agora)** | 🟡 Medium | When buyer calls, route through virtual number. Track call duration for analytics. Third-party integration (Exotel). Fallback: Direct number for verified users |
| 9 | **Listing verification process** | 🟡 Medium | Auto-checks: duplicate detection (similar address), photo EXIF validation, price range check. Manual: admin review queue for flagged listings. Status: pending → auto_verified / flagged → admin_verified / rejected |

#### Phase C: Transactions & Agreements

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 10 | **Chat system (encrypted)** | 🟡 Medium | Leverage existing `chat.js` route. Add property context to conversations: `conversations.context_type = 'property'`, `context_id = property_id`. WebSocket for real-time. E2E encryption: client-side key exchange |
| 11 | **Digital agreement generation** | 🟡 Medium | Templates for: rental agreement, land lease, sale agreement. User fills key terms → auto-generate PDF with all legal clauses. e-Sign via OTP. Table `agreements` (parties[], property_id, type, terms_json, pdf_url, signed_by[], status) |
| 12 | **Rent payment processing** | 🟡 Medium | Monthly recurring payments via Razorpay auto-debit. Owner receives payout minus platform fee. Rent receipt auto-generated. Table `rent_payments` (agreement_id, amount, due_date, paid_at, receipt_url, status) |
| 13 | **Visit scheduling** | 🟡 Medium | Buyer requests visit → owner confirms time → both get calendar event. Table `property_visits` (property_id, buyer_id, proposed_times[], confirmed_time, status). Push notification reminders |

#### Phase D: Agricultural Land Module

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 14 | **Agri land specific fields** | 🟡 Medium | Extend property schema: survey_number, total_acres, cultivable_acres, irrigation_type, water_source, soil_type, crops_grown, road_frontage_ft, fencing, farm_house, bore_wells_count. Dharani (Telangana land records) API integration for verification |
| 15 | **Land lease agreement** | 🟡 Medium | Specific to agricultural lease: crop sharing %, input responsibility, duration (seasons), renewal terms. Auto-compute fair lease rate from regional benchmarks |
| 16 | **Shortlisting/favorites** | 🟡 Medium | Already built in `favorites.js` route. Needs: Add to favorites from property card. Favorites screen with property cards. Badge count on nav |

#### Phase E: Society & PG Modules

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 17 | **Society management** | 🟢 Low | Full module: society registration → resident directory → maintenance billing → visitor management → notice board → complaint tracking. Multiple new tables. Post-MVP priority |
| 18 | **PG/Co-living module** | 🟡 Medium | Extend property type with PG-specific: sharing (single/double/triple), meals_included, common_areas, house_rules, available_beds, gender_preference. Booking + deposit flow |

### FarmerConnect Implementation Priorities (Ordered)

```
1. Property detail screen — 1-2 days
2. Photo gallery upload — 2-3 days
3. Filter taxonomy (25+ filters) — 2-3 days
4. KYC verification flow — 3 days
5. Search system — 2-3 days
6. Map view — 2 days
7. Chat integration — 2 days
8. Contact unlock system — 1-2 days
9. Visit scheduling — 1-2 days
10. Digital agreements — 3-4 days
11. Agri land fields — 2 days
12. Rent payments — 3 days
13. Listing verification — 2 days
14. Shortlisting — 1 day
15. Society management — 5+ days (post-MVP)
```

---

## 5. Intelligence Platform — Market Intelligence & AI Layer

### Current State

**Backend:** `intelligence.js` (supply-demand, district-heatmap, prices, platform-stats, activity-feed)  
**Frontend:** `IntelligenceScreen.js`  
**Android:** IntelligenceHomeScreen, PricesScreen, HeatmapScreen

### Missing Features (Per PRDs)

#### Phase A: Price Intelligence (Critical)

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 1 | **Price trend charts** | 🔴 Critical | Add charting library (Chart.js or lightweight alternative). Historical price graph per crop per mandi. 7-day, 30-day, 90-day views. Backend: `GET /api/intelligence/prices/:cropId/history?days=30` — return daily prices array |
| 2 | **Real APMC data integration** | 🔴 Critical | Replace `Math.random()` price simulation with actual data. Integrate Agmarknet API (government mandi prices) or scrape data.gov.in commodity prices. Daily cron job to fetch + store. Table `mandi_prices` (crop_id, mandi_id, date, modal_price, min_price, max_price) |
| 3 | **Price alerts & watchlists** | 🟡 Medium | User sets: "Alert me when paddy price > ₹2000/quintal in Guntur". Table `price_alerts` (user_id, crop_id, mandi_id, condition, threshold, is_active). Scheduler checks daily + sends push notification |
| 4 | **Best time to sell advisor** | 🟡 Medium | Analyze seasonal patterns + current trend direction. Algorithm: If price is rising and below seasonal peak → "Hold". If above seasonal average → "Sell now". Backend: `GET /api/intelligence/best-sell-time/:cropId` |

#### Phase B: Demand & Supply Forecasting

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 5 | **30/60/90-day harvest forecasts** | 🟡 Medium | Aggregate declarations by crop + district + expected_harvest_date. Group into 30-day windows. Backend: `GET /api/intelligence/forecasts?crop_id=&district_id=&window=30`. Already has `forecasts` table in DB |
| 6 | **Demand signal computation** | 🟡 Medium | Daily job: compute demand_score = (inquiry_count × 3 + watchlist_count × 2 + order_count × 5) per crop/district. Store in `demand_signals` table. Show "High Demand" badges on listings for crops with high signal |
| 7 | **Supply forecasting model** | 🟡 Medium | Phase 1: Rule-based (declarations aggregation). Phase 2: Linear regression on historical supply volumes. Phase 3: Weather-adjusted model (rainfall correlation). Output: expected_supply_tonnes per crop per district per month |

#### Phase C: AI/ML Layer

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 8 | **Price prediction (7/14/30 day)** | 🟡 Medium | Phase 1: Moving average + seasonal decomposition. Phase 2: Linear regression with features (season, rainfall, supply_volume, demand_signals). Backend: `GET /api/intelligence/price-prediction/:cropId?days=7`. Store predictions in `price_predictions` for accuracy tracking |
| 9 | **Personalized market advisory** | 🟡 Medium | Based on farmer's crops + district + harvest timeline: "Your paddy will be ready in 15 days. Current price ₹1850/q, expected to reach ₹2100/q by harvest. Consider holding for 1 week post-harvest." Push notification daily |
| 10 | **NDVI satellite monitoring** | 🟢 Low | Sentinel-2 imagery (free, 10m resolution, 5-day revisit). Compute NDVI for registered field boundaries. Alert on: vegetation stress (NDVI drop >20% in 10 days), waterlogging, ready-to-harvest indicators |
| 11 | **Recommendation engine** | 🟢 Low | Collaborative filtering: "Farmers in your area also grew [X]". Content-based: Match farmer soil/irrigation to crop requirements. Hybrid approach for crop planning recommendations |

#### Phase D: Visualization & Reporting

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 12 | **Interactive map (choropleth)** | 🟡 Medium | Leaflet + GeoJSON district boundaries. Color intensity by supply volume/price/demand. Layers: supply heatmap, price heatmap, demand heatmap. Click district → crop breakdown |
| 13 | **FPO directory on map** | 🟢 Low | Show FPOs as markers on intelligence map. Click → FPO profile with crops, volume, rating. For buyers to discover sourcing partners |
| 14 | **District analytics dashboard** | 🟢 Low | Per-district: top crops, price trends, supply-demand balance, FPO performance, farmer income estimates. For government/institutional users |

### Intelligence Implementation Priorities (Ordered)

```
1. Price trend charts (frontend) — 2 days
2. Real APMC/Agmarknet data integration — 3-4 days
3. Harvest supply forecasts — 2 days
4. Price alerts system — 2 days
5. Demand signal computation — 1-2 days
6. Interactive map rendering — 2-3 days
7. Price prediction (rule-based) — 2-3 days
8. Personalized advisory — 2 days
9. Best time to sell — 1 day
10. NDVI satellite monitoring — 4-5 days (post-MVP)
```

---

## 6. Cross-Platform Infrastructure

### 6A. Authentication & Identity

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 1 | **Multi-role support** | 🔴 Critical | Role selection after OTP: farmer / buyer / FPO / service_provider / logistics. Store in `users.role`. Role-based home screen routing. Backend middleware `roleGuard` (already in AquaOS V8) to restrict endpoints by role |
| 2 | **Full onboarding flow** | 🔴 Critical | Per role: collect farm details (farmer), business details (buyer), registration (FPO). GPS location for all. Progressive: minimum required on signup, rest prompted gradually |
| 3 | **KYC verification** | 🔴 Critical | Aadhaar OCR (upload photo → extract number → verify via DigiLocker API). PAN verification. FSSAI/GST for businesses. Manual review queue for admin. Levels 0-4 unlock platform features |
| 4 | **OTP rate limiting** | 🟡 Medium | Max 5 OTP requests per phone per 10 minutes. Exponential backoff. Backend: Redis counter with TTL. Return 429 on exceeded |
| 5 | **Refresh token rotation** | 🟡 Medium | On each token refresh, invalidate old refresh token + issue new pair. Detect token reuse (compromised) → revoke all tokens for user |

### 6B. Payment Infrastructure

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 6 | **Razorpay integration** | 🔴 Critical | Backend: Create Razorpay order → return order_id to frontend → frontend opens Razorpay checkout → backend verifies signature on callback. Routes: `POST /api/payments/create-order`, `POST /api/payments/verify`, webhook handler. Already partially in AquaOS V10 |
| 7 | **Escrow state machine** | 🔴 Critical | Extend existing trade escrow: fund → hold → release/refund. Auto-release on delivery confirmation (OTP verified). Dispute → admin review → partial/full refund. Timer: Auto-release after 7 days if no dispute |
| 8 | **UPI as default** | 🟡 Medium | Razorpay handles UPI. Preferred method selection. UPI ID storage for sellers (for payouts) |
| 9 | **Seller payouts** | 🟡 Medium | After escrow release, initiate payout to seller bank account. Razorpay Route/Transfer API. Commission deduction (platform fee 2-5%). Table `payouts` (user_id, amount, commission, net_amount, status, utr_number) |
| 10 | **Commission calculation** | 🟡 Medium | Configurable per category: equipment (8%), crop produce (3%), services (10%), inputs (5%). Backend middleware: auto-compute on order completion. Display in seller dashboard |

### 6C. File/Media Management

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 11 | **Image upload service** | 🔴 Critical | Backend: `POST /api/upload` (multipart/form-data). Resize to 3 sizes (thumb 200px, medium 800px, full 1600px). Store on disk/S3/R2. Return URLs array. Client-side: compress before upload (max 2MB). Upload route already exists |
| 12 | **Camera integration (Android)** | 🔴 Critical | CameraX API for photo capture. Gallery picker for existing photos. Crop/rotate before upload. Permissions handling. Used across: listings, KYC, pond photos, property photos |
| 13 | **Document upload (PDF/images)** | 🟡 Medium | For KYC docs, agreements, invoices. Validate file type + size. Virus scan optional. Metadata extraction for PDFs |

### 6D. Real-Time & Notifications

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 14 | **Push notifications (FCM)** | 🔴 Critical | Store FCM token on login. Backend: `sendNotification(userId, title, body, data)`. Triggers: new order, price alert, booking confirmation, chat message, listing match. Already has `pushnotifications.js` route |
| 15 | **WebSocket chat** | 🟡 Medium | Extend existing `websocket.js`. Events: message_sent, message_received, typing_indicator, read_receipt. Rooms by conversation_id. Already has `chat.js` route |
| 16 | **Background job scheduler** | 🟡 Medium | Extend `scheduler.js` with: daily price fetch, demand signal computation, trust score recalculation, listing expiry, payment reminders, harvest availability auto-post. Use node-cron (already in deps) |

### 6E. Offline Architecture

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 17 | **Service Worker (Web)** | 🟡 Medium | Cache: app shell, static assets, recent API responses (listings, prices, equipment). Strategy: network-first for fresh data, cache-fallback for offline. Background sync for pending actions |
| 18 | **Room DB expansion (Android)** | 🟡 Medium | New DAOs: EquipmentDao, ListingDao, OrderDao, PriceDao. Sync strategy: pull on app open, push queue for offline actions. Conflict resolution: server-wins for prices, client-wins for drafts |
| 19 | **Sync queue** | 🟡 Medium | Table `offline_actions` (action_type, payload_json, created_at, synced_at, retry_count). On connectivity: dequeue + POST to relevant API. Retry with exponential backoff. UI indicator: "X actions pending sync" |

### 6F. UI/UX Infrastructure

| # | Feature | Priority | Implementation Plan |
|---|---------|----------|---------------------|
| 20 | **Design token alignment** | 🟡 Medium | Update color palette: Forest Green #1B5E20, Harvest Orange #FF6F00, Earth Brown #4E342E, Sky Blue #0288D1. Typography: Noto Sans for regional scripts. Component audit against PRD specs |
| 21 | **Skeleton loading** | 🟢 Low | Replace `CircularProgressIndicator` with content-shaped skeleton placeholders. Shimmer animation. Perceived performance improvement |
| 22 | **Empty states** | 🟢 Low | Illustrations + helpful text for empty lists: "No equipment near you yet. Try expanding your search radius" with CTA button |
| 23 | **Role-based navigation** | 🔴 Critical | Different bottom tabs per role. Farmer: Home, Farm, Market, Intelligence, Profile. Buyer: Home, Discover, Orders, Intelligence, Profile. FPO: Home, Members, Procurement, Market, Profile |

---

## 7. BhoomiOS & AgriGalaxy — Emerging Modules

### 7A. BhoomiOS (Land & Soil Intelligence)

**Current:** `bhoomios.js` route exists  
**Plan:** Soil health management, land records integration (Dharani API for Telangana), field boundary mapping, soil testing lab directory, fertilizer recommendations based on soil health card data.

| # | Feature | Plan |
|---|---------|------|
| 1 | Soil health card digitization | OCR upload of government soil health card → extract NPK levels, pH, EC → store + recommend |
| 2 | Field boundary GPS mapping | Walk perimeter with phone GPS → polygon saved as GeoJSON → area auto-calculated |
| 3 | Land records verification | Dharani API (Telangana) / Bhulekh (UP) / Bhoomi (Karnataka) integration for ownership verification |
| 4 | Fertilizer recommendation engine | Based on soil test + crop selected + growth stage → specific fertilizer + dosage |
| 5 | Soil testing lab directory | Nearest labs with services, pricing, sample submission process |

### 7B. AgriGalaxy (Ecosystem Discovery)

**Current:** `agrigalaxy.js` route exists  
**Plan:** Platform-wide discovery and exploration hub. Search across all modules. Trending crops, popular equipment, top FPOs, success stories, platform statistics.

| # | Feature | Plan |
|---|---------|------|
| 1 | Unified search | Search across listings + equipment + properties + jobs + services + users |
| 2 | Trending dashboard | Top crops by volume, fastest growing districts, popular equipment, price movers |
| 3 | Success stories | Farmer testimonials, FPO case studies, income growth stories |
| 4 | Platform statistics | Total farmers, transactions, volume traded, districts covered (public dashboard) |

---

## 8. Priority Execution Order

### Sprint 1 (Week 1-2): Foundation Fixes

```
✅ Cross-Platform: Image upload service working end-to-end
✅ Cross-Platform: Razorpay payment integration
✅ Cross-Platform: Multi-role selection + role-based navigation
✅ Cross-Platform: OTP rate limiting
✅ AgriFlow: Photo upload on listings
✅ AgriFlow: GPS location capture
✅ FarmerConnect: Property detail screen
```

### Sprint 2 (Week 3-4): Core Marketplace

```
✅ KisanConnect: Equipment listing creation (seller mode)
✅ KisanConnect: Dual-mode toggle
✅ KisanConnect: Rural Services Marketplace (tables + CRUD + screens)
✅ AgriFlow: Advanced search filters (25+)
✅ AgriFlow: Crop selector dropdown improvement
✅ FarmerConnect: Photo gallery + filter taxonomy
✅ Intelligence: Price trend charts
```

### Sprint 3 (Week 5-6): Transactions & Trust

```
✅ Cross-Platform: Escrow state machine (full implementation)
✅ KisanConnect: Escrow for equipment rentals
✅ KisanConnect: Service booking flow
✅ AgriFlow: Negotiation/offer system
✅ FarmerConnect: KYC verification flow
✅ FarmerConnect: Contact unlock system
✅ Intelligence: Real APMC data integration
```

### Sprint 4 (Week 7-8): AquaOS & Jobs

```
✅ AquaOS: Feed logging system + FCR
✅ AquaOS: Farm creation wizard with GPS
✅ AquaOS: Water quality threshold alerts
✅ AquaOS: Growth sampling + chart
✅ KisanConnect: Job applications
✅ KisanConnect: Availability calendar
✅ Cross-Platform: Push notifications (FCM)
```

### Sprint 5 (Week 9-10): Intelligence & Automation

```
✅ Intelligence: Harvest supply forecasts
✅ Intelligence: Price alerts system
✅ Intelligence: Demand signal computation
✅ Intelligence: Interactive map (choropleth)
✅ AgriFlow: FPO procurement dashboard
✅ AgriFlow: Auto-availability posting (scheduler)
✅ Cross-Platform: Background job scheduler
```

### Sprint 6 (Week 11-12): Advanced Features

```
✅ Intelligence: Price prediction (rule-based)
✅ Intelligence: Personalized advisory
✅ AquaOS: BioPro score + mortality logging
✅ AquaOS: Offer/bid system
✅ FarmerConnect: Chat integration
✅ FarmerConnect: Visit scheduling
✅ Cross-Platform: Offline sync queue
```

### Sprint 7 (Week 13-14): Financial & Compliance

```
✅ Cross-Platform: Seller payouts + commission
✅ FarmerConnect: Digital agreement generation
✅ FarmerConnect: Rent payment processing
✅ AgriFlow: FPO inventory management
✅ AgriFlow: FPO payment management
✅ KisanConnect: Security deposit handling
✅ KisanConnect: Review system
```

### Sprint 8 (Week 15-16): Scale & Polish

```
✅ KisanConnect: Offline caching (Service Worker + Room)
✅ KisanConnect: Voice input on all fields
✅ AquaOS: Pond map view
✅ AquaOS: Export/report generation
✅ Intelligence: NDVI satellite monitoring
✅ Cross-Platform: Design token alignment
✅ Cross-Platform: Skeleton loading + empty states
```

---

## 📊 Module Completion Tracker

| Module | Current % | After Sprint 4 | After Sprint 8 | PRD Complete |
|--------|-----------|-----------------|-----------------|--------------|
| **AquaOS** | ~85% (V1-V10 built) | ~92% | ~98% | ✅ |
| **KisanConnect** | ~30% | ~55% | ~85% | 🟡 |
| **AgriFlow** | ~25% | ~50% | ~75% | 🟡 |
| **FarmerConnect** | ~12% | ~35% | ~65% | 🟡 |
| **Intelligence** | ~20% | ~45% | ~80% | 🟡 |
| **Cross-Platform** | ~40% | ~65% | ~85% | 🟡 |
| **BhoomiOS** | ~10% | ~15% | ~30% | 🟢 Post-MVP |
| **AgriGalaxy** | ~10% | ~15% | ~30% | 🟢 Post-MVP |

---

## 🏗️ Technical Architecture Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                   │
│  Web (Vite + Vanilla JS) │ Android (Kotlin + Jetpack) │ PWA          │
├──────────────────────────────────────────────────────────────────────┤
│                         API GATEWAY                                    │
│  Express.js │ Rate Limiting │ Auth (JWT) │ Role Guard │ Sanitize     │
├──────────────────────────────────────────────────────────────────────┤
│                       APPLICATION LAYER                                │
│  AquaOS │ KisanConnect │ AgriFlow │ FarmerConnect │ Intelligence     │
│  Payments │ Chat │ Notifications │ Upload │ Scheduler │ Admin        │
├──────────────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                                    │
│  Matching │ Fraud Detection │ Trust Score │ Price Prediction          │
│  WebSocket │ Cache (Redis) │ Audit │ Background Jobs                  │
├──────────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                       │
│  PostgreSQL (20+ migrations) │ Redis │ File Storage (S3/R2)          │
│  GIN indexes │ PostGIS │ pgvector │ Full-text search                  │
├──────────────────────────────────────────────────────────────────────┤
│                     EXTERNAL INTEGRATIONS                              │
│  Razorpay │ FCM │ Agmarknet │ Sentinel-2 │ DigiLocker │ IMD         │
│  Exotel │ MSG91 │ Dharani │ eNAM │ OpenWeather                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Key Principles for Implementation

1. **Extend, don't rebuild** — AquaOS V1-V10, trade engine, wallet, community are solid. Build on them.
2. **Same patterns** — Follow existing Express router + authMiddleware + PostgreSQL query pattern.
3. **Migration versioning** — Each feature gets its own `migrate-vXX-*.js` file.
4. **Frontend consistency** — Vanilla JS screens with `api.js` calls, same component library.
5. **Offline-first** — Every write operation should queue offline + sync. Every read should cache.
6. **Telugu-first** — All user-facing strings in `i18n.js`. Crop/category names in te/hi columns.
7. **Mobile-first** — Design for 5-inch screens, touch targets 44px+, large fonts for farmers.
8. **Data-driven** — Every feature should generate data that improves intelligence module.
9. **Incremental value** — Each sprint delivers standalone user value. No "infrastructure-only" sprints.
10. **Security** — Rate limit all write endpoints. Validate all inputs. Sanitize all outputs. Role-guard sensitive routes.

---

*This plan synthesizes all PRDs (AquaOS, KisanConnect, AgriFlow, FarmerConnect, Intelligence), the Gap Analysis, and existing codebase analysis into an actionable implementation roadmap.*
