# 🌾 Plan: AgriFlow India PRD Full Implementation

**Source Document:** `AgriFlow_India_PRD_v1.md.pdf` (600+ page comprehensive PRD)  
**Current Rating:** 4/10  
**Target:** 10/10  
**Sections in PRD:** 26 major sections with 2588+ sub-headings

---

## 🔍 What Exists vs. Full PRD Requirements

### ✅ Implemented (Contribution: 4/10)

| PRD Section | What Exists | Quality |
|-------------|-------------|---------|
| Section 6: Farmer App | Listings, Declarations, Inquiries screens | ⚠️ Basic CRUD only |
| Section 14: Database Schema | 100+ tables across 24 migrations | ✅ Good coverage |
| Section 15: API Design | REST API with Express routes | ⚠️ Missing validations |
| Section 5: Platform Architecture | Monolithic Express app (not microservices) | ⚠️ Basic |
| Section 13: Tech Stack | Node.js + PostgreSQL + React + Android Kotlin | ✅ Matches |

### 🔴 Critical Gaps (27 Missing Features from GAP_ANALYSIS)

#### Section 6: Farmer App — 13 Missing Features

| # | Feature | Implementation Task |
|---|---------|-------------------|
| 1 | **Farmer onboarding wizard** (village, GPS, land, irrigation, soil, crops) | Multi-step form: `OnboardingWizardScreen.js`, backend `POST /api/onboarding/complete` |
| 2 | **GPS location capture** on farm/listing | React Native location API + backend geo column |
| 3 | **Harvest Calendar view** | Calendar component showing expected harvests by date |
| 4 | **Availability Posting** (auto T-15 days) | Cron job + scheduler enhancement |
| 5 | **Photo upload** on listings | File upload service (Cloudflare R2/S3) + UI |
| 6 | **Voice input** for text fields | Web Speech API / React Native Voice |
| 7 | **Vernacular language** (Telugu, Hindi, Kannada) | i18n system exists; wire to all screens |
| 8 | **Crop selector with photos/icons** | Crop catalog with icon_emoji rendering |
| 9 | **Weather widget** on dashboard | Weather API integration (OpenWeatherMap/IMD) |
| 10 | **Crop health advisory** on dashboard | Advisory engine from weather + crop data |
| 11 | **Privacy/consent settings** per declaration | UI toggle for consent_level field |
| 12 | **Listing quality scoring** | Algorithm: completeness + photos + GPS = score |
| 13 | **Offline declaration submission** | SQLite queue + background sync |

#### Section 7: FPO Management — 7 Missing Features (ENTIRE PLATFORM)

| # | Feature | Implementation Task |
|---|---------|-------------------|
| 14 | **FPO Management Platform** | Dedicated FPO dashboard with tabs |
| 15 | **FPO member management** | Add/remove farmers, membership status |
| 16 | **FPO procurement dashboard** | Aggregate farmer harvests with analytics |
| 17 | **FPO inventory management** | Warehouse stock tracking |
| 18 | **FPO supply listing** with quality aggregation | Combined quality grades from members |
| 19 | **FPO payment management** | Farmer payout tracking |
| 20 | **FPO analytics** | Member performance, volume trends |

> **Note:** Backend routes for FPO exist (`/api/fpo/`) but Android screens are MISSING.

#### Section 8: Buyer Intelligence App — 7 Missing Features

| # | Feature | Implementation Task |
|---|---------|-------------------|
| 21 | **Buyer supply search** with 25+ filters | Advanced search API + UI |
| 22 | **Buyer watchlists** | Crop + region alert subscriptions |
| 23 | **Intelligence reports** | PDF/dashboard supply forecasts |
| 24 | **Supply heatmaps** (MapBox choropleth) | Map component + PostGIS data |
| 25 | **30/60/90-day harvest forecasts** | Forecast computation + API + UI |
| 26 | **FPO directory** for buyer sourcing | Searchable FPO catalog |
| 27 | **Negotiation/offer system** | Structured offer/counter-offer flow |

---

## 🎯 Sprint Plan for 10/10

### Sprint 1: Farmer App Core (2 weeks)

| Task | Priority | Effort |
|------|----------|--------|
| Farmer onboarding wizard (multi-step form) | 🔴 Critical | 3 days |
| GPS location capture | 🔴 Critical | 2 days |
| Photo upload service | 🔴 Critical | 3 days |
| Crop selector with icons | 🟡 Medium | 1 day |
| Harvest calendar view | 🟡 Medium | 2 days |
| Privacy/consent toggle | 🟡 Medium | 1 day |
| Listing quality scoring algorithm | 🟢 Low | 1 day |

### Sprint 2: FPO Platform (2 weeks)

| Task | Priority | Effort |
|------|----------|--------|
| FPO Dashboard screen | 🔴 Critical | 2 days |
| Member management UI | 🔴 Critical | 2 days |
| Procurement dashboard | 🔴 Critical | 3 days |
| Inventory management | 🔴 Critical | 2 days |
| Payment tracking | 🟡 Medium | 2 days |
| Analytics dashboard | 🟢 Low | 2 days |

### Sprint 3: Buyer Intelligence (2 weeks)

| Task | Priority | Effort |
|------|----------|--------|
| Advanced search (25+ filters) | 🔴 Critical | 3 days |
| MapBox heatmap integration | 🔴 Critical | 3 days |
| Harvest forecast API + UI | 🟡 Medium | 3 days |
| Watchlists + alerts | 🟡 Medium | 2 days |
| Negotiation system | 🟡 Medium | 2 days |
| FPO directory | 🟢 Low | 1 day |

### Sprint 4: Voice/Offline/i18n (2 weeks)

| Task | Priority | Effort |
|------|----------|--------|
| Voice input integration | 🟡 Medium | 3 days |
| Vernacular wiring (all screens) | 🟡 Medium | 3 days |
| Offline sync queue | 🟡 Medium | 4 days |
| Weather widget | 🟢 Low | 1 day |
| Auto availability posting (cron) | 🟡 Medium | 1 day |

### Sprint 5: PRD Sections 9-26 (4 weeks)

| Section | Task |
|---------|------|
| 9. Central Data Engine | Aggregation pipeline, materialized views |
| 10. Data Privacy | Role-based response filtering middleware |
| 11. User Journey Maps | Ensure all flows work end-to-end |
| 12. Deal & Inquiry Logic | State machine for inquiry→negotiation→deal |
| 16. Security Architecture | Input sanitization, rate limiting, CORS hardening |
| 17. UI/UX Design System | Component library, consistent styling |
| 18. Analytics & Intelligence | BI dashboards, admin reporting |
| 19. Third-Party Integrations | Agmarknet, MSG91, MapBox, eNAM |
| 20. Non-Functional Requirements | Performance (< 2s response), uptime (99.5%) |
| 22. Developer Execution Plan | CI/CD, staging environments |
| 24. Risk Register | Error handling, edge cases |

---

## 📋 Acceptance Criteria for 10/10

- [ ] 3-step farmer onboarding wizard with GPS, land, crops collection
- [ ] Photo upload works on listings (at least 3 photos)
- [ ] Voice input available on all text fields
- [ ] Telugu/Hindi language fully functional
- [ ] FPO Platform fully operational (6 screens minimum)
- [ ] Buyer can search with 15+ filter parameters
- [ ] MapBox choropleth heatmap renders district-level supply
- [ ] 30-day harvest forecast API returns real predictions
- [ ] Offline mode: farmer can create declaration without internet
- [ ] Negotiation flow: inquiry → offer → counter → accept → deal
- [ ] All 26 PRD sections have corresponding running code
