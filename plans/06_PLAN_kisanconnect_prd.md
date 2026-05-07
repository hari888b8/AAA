# 🚜 Plan: KisanConnect PRD Implementation

**Source Document:** `KisanConnect_PRD_v1.0.docx` (Rural Super-App)  
**Current Rating:** 3/10  
**Target:** 10/10  
**Gap:** 24 missing features (8 Critical, 11 Medium, 5 Low)

---

## 🔍 What Exists

### Backend
- `kisanconnect.js` — Equipment listing + booking, Jobs CRUD, Stats
- `vehicles.js` — Vehicle management (ROS extension)
- `transport.js` — Transport routes
- `delivery.js` — Delivery tracking
- `gigworkers.js` — Gig worker management
- `matching.js` — Service matching algorithm

### Frontend
- `KisanConnectScreen.js` — Equipment browse + book, Jobs list
- `VehiclesScreen.js` — Vehicle management
- `DeliveryScreen.js` — Delivery tracking
- `GigWorkersScreen.js` — Gig workers

### Database
- `migrate-v10-ros.js` — Vehicles, transport, delivery, gig workers tables

---

## 🔴 Critical Missing Components

The PRD defines KisanConnect as a **Rural Super-App** with 5 major verticals:
1. ✅ Equipment Marketplace (partial — browse/book only)
2. 🔴 Crop Marketplace (completely missing)
3. 🔴 Rural Services Marketplace (completely missing)
4. ⚠️ Jobs/Gig Platform (basic — no applications, no profiles)
5. 🔴 Payment/Escrow System (no implementation)

---

## 🎯 Implementation Plan

### Sprint 1: Dual-Mode & Equipment Enhancement (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 1 | **Dual-mode toggle (Buyer/Seller)** | 🔴 Critical | 2 days | UI toggle + context-based navigation + role state |
| 2 | **Equipment listing creation** (seller mode) | 🔴 Critical | 3 days | Form: name, type, hourly_rate, daily_rate, location, photos, availability |
| 3 | **Equipment availability calendar** | 🟡 Medium | 2 days | Table: `equipment_availability_blocks(equipment_id, date, status)` |
| 4 | **Equipment security deposit** | 🟡 Medium | 1 day | Deposit field + refund logic |
| 5 | **GPS tracking for rentals** | 🟢 Low | 2 days | Real-time location during active rental |

### Sprint 2: Rural Services Marketplace (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 6 | **Service categories setup** | 🔴 Critical | 1 day | Veterinary, Plumber, Electrician, Mechanic, Spraying, Harvesting, Transport |
| 7 | **Service listing creation** | 🔴 Critical | 2 days | Table: `service_listings(provider_id, category, description, rate, location, availability)` |
| 8 | **Service booking flow** | 🔴 Critical | 3 days | Request → Accept → Schedule → Complete → Rate |
| 9 | **Service provider portfolio** | 🟢 Low | 1 day | Photos, certifications, experience |
| 10 | **Provider rating/review** | 🟡 Medium | 1 day | Post-service ratings |

### Sprint 3: Jobs Platform Enhancement (1 week)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 11 | **Job seeker profile** | 🟡 Medium | 2 days | Multi-step: skills, experience, photo, location, availability |
| 12 | **One-tap apply** | 🟡 Medium | 1 day | `job_applications(job_id, seeker_id, status, applied_at)` |
| 13 | **Application management** for employers | 🟡 Medium | 2 days | View applicants, shortlist, hire |

### Sprint 4: Escrow & Payments (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 14 | **Razorpay payment gateway** | 🔴 Critical | 3 days | Order creation → payment page → verification webhook |
| 15 | **Escrow state machine** | 🔴 Critical | 3 days | States: created → funded → released → disputed |
| 16 | **Seller payout architecture** | 🟡 Medium | 2 days | Bank account collection → scheduled payouts |
| 17 | **Commission calculation** | 🟡 Medium | 1 day | Platform fee: 5% equipment, 10% services, 3% crops |
| 18 | **Refund/dispute handling** | 🟡 Medium | 2 days | Dispute → review → partial/full refund |

### Sprint 5: AI, Offline & i18n (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 19 | **Offline-first architecture** | 🔴 Critical | 4 days | SQLite cache all listings + offline booking queue + sync on reconnect |
| 20 | **Voice input** | 🟡 Medium | 2 days | Speech-to-text on search + listing creation |
| 21 | **Multi-language support** (12 languages per PRD) | 🟡 Medium | 3 days | Extend i18n: Telugu, Hindi, Kannada, Tamil, Marathi, etc. |
| 22 | **AI price prediction** | 🟡 Medium | 3 days | Time-series model for equipment rental rates + crop prices |
| 23 | **Recommendation engine** | 🟡 Medium | 2 days | Collaborative filtering for relevant listings |
| 24 | **In-app messaging** | 🟡 Medium | 2 days | Real-time chat between buyer/seller |

### Sprint 6: Crop Marketplace (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 25 | **Crop listing creation** | 🔴 Critical | 2 days | Crop type, quantity, grade, location, price, harvest_date |
| 26 | **Crop search + discovery** | 🔴 Critical | 2 days | Multi-filter search with location radius |
| 27 | **Crop order flow** | 🔴 Critical | 3 days | Browse → Order → Escrow → Delivery → Release |
| 28 | **Logistics/delivery tracking** | 🟢 Low | 2 days | Order → pickup → in-transit → delivered |
| 29 | **Subscription plans** | 🟢 Low | 1 day | Seller premium for featured listings |

---

## 📂 Files to Create

### Backend Routes
- `backend/src/routes/services.js` — Rural services marketplace
- `backend/src/routes/job-applications.js` — Job application system
- `backend/src/routes/crop-marketplace.js` — Crop trading (or extend kisanconnect.js)

### Backend Services
- `backend/src/services/escrow.js` — Escrow state machine
- `backend/src/services/razorpay.js` — Payment gateway integration
- `backend/src/services/payouts.js` — Seller payout scheduling

### Database Migration
- `backend/src/db/migrate-v25-kisanconnect-full.js` — service_listings, service_bookings, job_applications, job_seeker_profiles, equipment_availability_blocks, crop_orders, escrow_enhanced

### Frontend Screens
- `src/screens/ServiceMarketplaceScreen.js`
- `src/screens/ServiceBookingScreen.js`
- `src/screens/JobSeekerProfileScreen.js`
- `src/screens/CropMarketplaceScreen.js`
- `src/screens/EscrowDashboardScreen.js`

---

## 📋 Acceptance Criteria for 10/10

- [ ] Buyer/Seller mode toggle works across all sections
- [ ] Equipment providers can list equipment with availability calendar
- [ ] 7+ service categories browsable and bookable
- [ ] Service booking flow completes end-to-end (request → complete → rate)
- [ ] Job seekers have profiles and can apply with one tap
- [ ] Razorpay payment gateway processes real transactions
- [ ] Escrow holds funds and releases on delivery confirmation
- [ ] Offline mode allows browsing + queued bookings
- [ ] Voice input works on search and forms
- [ ] 12 Indian languages supported
- [ ] Crop marketplace allows listing → order → delivery tracking
- [ ] Chat between buyer and seller works in real-time
- [ ] All 24 gap items resolved
