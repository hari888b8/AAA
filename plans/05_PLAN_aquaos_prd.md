# 🐟 Plan: AquaOS PRD + Gap Analysis Implementation

**Source Documents:**  
- `AquaOS_PRD_v1.0.docx` (Core aquaculture management system)  
- `AquaOS_GapAnalysis_v1.1.docx` (Gap analysis identifying 18 missing features)  
**Current Rating:** 6/10 (best of all documents — extensive V2-V11 extensions built)  
**Target:** 10/10

---

## 🔍 What Exists (Impressive Foundation)

### Backend Routes (11 files!)
| File | Features |
|------|----------|
| `aquaos.js` | Core: ponds, water logs, harvest listings, advisories, stats |
| `aquaos-v2.js` | Financial tracking, disease reports, PMMSY, cold chain, training, auctions |
| `aquaos-v3.js` | RFQ system, escrow payments, yield forecasting (Von Bertalanffy) |
| `aquaos-v4.js` | Culture units, production cycles, harvest optimizer, IoT, trust verification |
| `aquaos-v5.js` | KPI engine (SGR/ADG/FCR), predictive growth, alert engine, B2B marketplace |
| `aquaos-v6.js` | Fish marketplace, buyer profiles, quality grading, traceability, PMMSY DPR |
| `aquaos-v7.js` | Reviews, logistics, ODR disputes, trade credit, training, VMS |
| `aquaos-v8.js` | Role-based ecosystem, crop posts, community, market prices, workflows |
| `aquaos-v9.js` | Privacy controls, negotiation rooms, notifications, admin panel, fraud |
| `aquaos-v10.js` | Analytics, full-text search, Razorpay, pricing intelligence, chat, AI, IoT |
| `aquaos-v11.js` | Contracts, labor, insurance, export compliance, multi-farm, supply chain |

### Frontend
- `AquaOSScreen.js` — Multi-tab screen (AI Predict, Payments, Growth, etc.)
- `AquaGalaxyScreen.js` — Extended galaxy view
- `AquaPortfolioScreen.js` — Portfolio management

### Database
- 12 migration files for AquaOS (migrate-v11 through migrate-v23)
- 100+ AquaOS tables covering all V2-V11 features

---

## 🔴 Remaining Gaps (From Gap Analysis v1.1)

| # | Feature | PRD Section | Current State | What's Needed |
|---|---------|-------------|---------------|---------------|
| 1 | **Farm creation wizard (3-step + GPS)** | PRD 3.1 | Single-page form | Multi-step with map pin |
| 2 | **Crop cycle management** | PRD 3.2 | Pond exists, no cycle entity | Stocking events, templates, cycle tracking |
| 3 | **Feed logging** | Gap #4 | 🔴 No tables or UI | `feed_logs` table + daily input form + FCR calc |
| 4 | **Mortality logging** | Gap #5 | Only `survival_pct` field | `mortality_logs` table + symptom checklist + photos |
| 5 | **Growth sampling** | Gap #6 | `avg_weight_g` exists | `growth_samples` table + periodic weight + growth curve |
| 6 | **Advisory engine (automated)** | Gap #7 | Static advisories | Rule engine: if pH < 7 → alert; species-specific thresholds |
| 7 | **Water quality threshold alerts** | Gap #8 | Logging only, no alerts | Alert triggers when pH/DO/temp out of range |
| 8 | **Input Marketplace (core)** | PRD 4.0 | V5 has B2B marketplace | Needs supplier catalog, product browse, inquiry for inputs |
| 9 | **Offer/negotiation on harvest** | PRD 5.0 | View-only listings | Bid/offer mechanism on harvest listings |
| 10 | **Chat/messaging** | Gap #15 | V10 has chat rooms | Wire to harvest listing buyer-seller flow |
| 11 | **Community (aqua-specific)** | Gap #17 | Global community exists | Aqua-specific categories, species tags |
| 12 | **Price intelligence (aqua)** | Gap #20 | No aqua price feeds | Species-wise price scraping (shrimp, fish daily rates) |
| 13 | **KYC verification flow** | Gap #22 | No KYC UI | Multi-step KYC with doc upload |
| 14 | **Buyer subscription tiers** | Gap #25 | No subscription | Tiered access for buyer intelligence |
| 15 | **Disease identification (AI)** | Gap #30 | No AI vision | Photo → disease classification model |
| 16 | **Pond map view** | Gap #10 | No GPS/map | Map with pond pins, health color-coded |
| 17 | **Export/report generation** | Gap #35 | No export | PDF/CSV export of pond data |
| 18 | **BioPro score** | Gap #9 | No composite metric | Multi-factor: water + growth + mortality + feed → score |

---

## 🎯 Sprint Plan for 10/10

### Sprint 1: Core Farm Management Gaps (2 weeks)

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| Feed logging system | 🔴 Critical | 3 days | Table: `aqua_feed_logs(pond_id, date, feed_type, quantity_kg, brand, cost)`, FCR = total_feed / biomass_gain |
| Mortality logging | 🟡 Medium | 2 days | Table: `aqua_mortality_logs(pond_id, date, count, symptoms, cause, photo_url)` |
| Growth sampling | 🟡 Medium | 2 days | Table: `aqua_growth_samples(pond_id, date, sample_count, avg_weight_g, min_weight, max_weight)` |
| Farm wizard (3-step + GPS) | 🔴 Critical | 2 days | Step 1: Farm details + GPS, Step 2: Ponds, Step 3: Species config |
| BioPro score algorithm | 🟡 Medium | 1 day | Composite: 0.3×water + 0.25×growth + 0.25×survival + 0.2×FCR |

### Sprint 2: Alerts & Intelligence (2 weeks)

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| Water quality threshold alerts | 🟡 Medium | 2 days | Config per species: pH range, DO min, temp range → push alert |
| Automated advisory engine | 🟡 Medium | 3 days | Rule engine: species_thresholds → triggered advisories |
| Aqua price intelligence | 🟡 Medium | 3 days | Daily price scraping for Vannamei, Rohu, Pangasius by region |
| Pond map view | 🟡 Medium | 2 days | GPS per pond + MapBox display |

### Sprint 3: Marketplace & Social (2 weeks)

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| Offer/bid on harvest listings | 🟡 Medium | 3 days | Bid amount + quantity + collection_date |
| Chat wiring for buyer-seller | 🟡 Medium | 2 days | Connect V10 chat to harvest listing context |
| Input marketplace core | 🔴 Critical | 3 days | Supplier catalog + product listing + inquiry |
| Aqua community categories | 🟢 Low | 1 day | Filter posts by species/topic |
| KYC verification flow | 🟡 Medium | 2 days | Doc upload + verification queue |

### Sprint 4: Advanced Features (1 week)

| Task | Priority | Effort | Details |
|------|----------|--------|---------|
| Buyer subscription tiers | 🟢 Low | 2 days | Free (limited) vs Premium (full search + alerts) |
| Export/report generation | 🟢 Low | 2 days | PDF summary of pond performance + CSV data export |
| Disease identification (AI) | 🟢 Low | 3 days | TensorFlow.js model or API call for photo classification |

---

## 📋 Acceptance Criteria for 10/10

- [ ] Feed logs recorded daily with FCR auto-calculated
- [ ] Mortality events logged with symptoms and cause
- [ ] Growth sampling creates growth curve chart
- [ ] Water quality alerts fire when thresholds breached
- [ ] BioPro score visible on pond dashboard (0-100)
- [ ] Farm creation is 3-step wizard with GPS pin
- [ ] Aqua-specific prices displayed (daily rates by species)
- [ ] Buyer can bid on harvest listings
- [ ] Chat works between harvest listing buyer and seller
- [ ] Pond map shows all ponds with health color coding
- [ ] KYC flow allows document upload and admin verification
- [ ] PDF report downloadable for any pond
- [ ] All 18 gap items resolved with working code
