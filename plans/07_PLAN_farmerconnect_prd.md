# 🏠 Plan: FarmerConnect PRD Implementation

**Source Document:** `FarmerConnect_PRD_v1.md.pdf` (PropTech + AgriTech Marketplace)  
**Current Rating:** 2/10  
**Target:** 10/10  
**Gap:** 25 missing features (5 Critical, 12 Medium, 8 Low)

---

## 🔍 What Exists (Minimal)

### Backend
- `farmerconnect.js` — Properties list/create/detail, Stats

### Frontend (Android)
- `FarmerConnectHomeScreen` — Stats + property type filter
- `PropertiesScreen` — Property listing
- `AddPropertyScreen` — Basic form

### Database
- `properties` table with: title, type, location, area, rent, furnishing, floor, description, amenities, is_verified

---

## 🔴 What's Missing (Almost Everything)

The PRD defines FarmerConnect as a **full PropTech platform** with:
1. 🔴 Advanced search (25+ filters, AI matching, map view)
2. 🔴 Photo gallery (multi-upload, carousel)
3. 🔴 KYC verification (4 levels)
4. 🔴 Contact system (credits, number masking, calls)
5. 🔴 Chat (real-time encrypted messaging)
6. 🔴 Digital agreements (rental + land lease)
7. 🔴 Payments (rent collection, deposits)
8. 🔴 Society management (maintenance, visitors)
9. 🔴 PG/Co-living module
10. 🔴 Agricultural land module (Dharani API)

---

## 🎯 Sprint Plan for 10/10

### Sprint 1: Core Property Platform (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 1 | **Property detail screen** | 🔴 Critical | 2 days | Full detail view with all fields, gallery, contact button |
| 2 | **Photo upload + gallery** | 🔴 Critical | 3 days | Multi-photo upload (up to 10), swipeable carousel, thumbnails |
| 3 | **Advanced search (25+ filters)** | 🔴 Critical | 3 days | BHK, rent_range, furnishing, floor, pet_friendly, parking, facing, etc. |
| 4 | **Map view** | 🟡 Medium | 2 days | MapBox with property pins, cluster view, area polygon |
| 5 | **Shortlisting/favorites** | 🟡 Medium | 1 day | Save properties, favorites list screen |

### Sprint 2: Trust & Verification (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 6 | **KYC verification (4 levels)** | 🔴 Critical | 3 days | L1: Phone, L2: Email, L3: Aadhaar, L4: Property docs |
| 7 | **Listing verification process** | 🟡 Medium | 2 days | Auto-checks (photos, description quality) + manual review queue |
| 8 | **Contact unlock with credits** | 🟡 Medium | 2 days | Credit system: buy credits → unlock owner phone number |
| 9 | **Number masking** | 🟡 Medium | 2 days | Exotel/virtual number for privacy-safe calls |
| 10 | **Owner dashboard** | 🟢 Low | 2 days | Views count, contacts received, listing analytics |

### Sprint 3: Communication & Deals (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 11 | **Real-time chat** | 🟡 Medium | 3 days | WebSocket-based messaging between seeker and owner |
| 12 | **Visit scheduling** | 🟡 Medium | 2 days | Date picker → request → confirmation → reminder |
| 13 | **Deal confirmation flow** | 🟡 Medium | 2 days | Both parties confirm → triggers agreement |
| 14 | **Digital agreement generation** | 🟡 Medium | 3 days | Template-based rental agreement + e-sign |
| 15 | **Listing expiry & refresh** | 🟢 Low | 1 day | Auto-expire after 60 days, refresh button |

### Sprint 4: Payments (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 16 | **Rent payment processing** | 🟡 Medium | 3 days | UPI/card via Razorpay, recurring setup |
| 17 | **Security deposit handling** | 🟡 Medium | 2 days | Escrow for deposit, refund on exit |
| 18 | **Payment history & receipts** | 🟡 Medium | 1 day | Transaction log with downloadable receipts |
| 19 | **Subscription plans** (seeker/owner) | 🟢 Low | 2 days | Free (limited contacts) vs Premium |

### Sprint 5: Specialized Modules (2 weeks)

| # | Task | Priority | Effort | Details |
|---|------|----------|--------|---------|
| 20 | **PG/Co-living module** | 🟡 Medium | 3 days | PG-specific fields: sharing, meals, rules, booking |
| 21 | **Agricultural land module** | 🟡 Medium | 3 days | Survey number, Dharani API, soil type, water source, lease terms |
| 22 | **Society management** | 🟢 Low | 3 days | Maintenance billing, visitor log, complaints, notices |
| 23 | **Support ticket system** | 🟢 Low | 1 day | Create/view/escalate support tickets |
| 24 | **RM dashboard** | 🟢 Low | 2 days | Relationship manager: assigned properties, follow-ups |
| 25 | **AI smart matching** | 🟢 Low | 2 days | Preference vector → cosine similarity matching |

---

## 📂 Files to Create/Modify

### Backend Routes
- `backend/src/routes/farmerconnect.js` — Enhance with search, filters, photos
- `backend/src/routes/property-verification.js` — KYC + listing verification
- `backend/src/routes/property-chat.js` — Messaging for property inquiries
- `backend/src/routes/agreements.js` — Digital agreement generation
- `backend/src/routes/rent-payments.js` — Rent collection system
- `backend/src/routes/society.js` — Society management

### Database Migration
- `backend/src/db/migrate-v26-farmerconnect-full.js` — Tables: property_photos, property_contacts, property_shortlists, visit_requests, rental_agreements, rent_payments, credit_transactions, society, society_residents, society_maintenance, pg_listings, agri_land_details

### Frontend Screens
- `src/screens/PropertyDetailScreen.js`
- `src/screens/PropertySearchScreen.js`
- `src/screens/PropertyMapScreen.js`
- `src/screens/PropertyChatScreen.js`
- `src/screens/AgreementScreen.js`
- `src/screens/RentPaymentScreen.js`
- `src/screens/SocietyScreen.js`
- `src/screens/PGListingsScreen.js`

---

## 📋 Acceptance Criteria for 10/10

- [ ] Property detail screen shows all info + photo carousel
- [ ] Photo upload works (up to 10 photos per listing)
- [ ] Search with 15+ active filters returns relevant results
- [ ] Map view shows property pins with price labels
- [ ] KYC verification flow (4 levels) works end-to-end
- [ ] Contact unlock requires credits/subscription
- [ ] Chat works real-time between seeker and owner
- [ ] Visit can be scheduled and confirmed
- [ ] Digital rental agreement generated and e-signed
- [ ] Rent payment via UPI/card with receipts
- [ ] PG listings have PG-specific fields (meals, sharing, rules)
- [ ] Agri land listings have survey number and soil data
- [ ] Society management: maintenance billing works
- [ ] AI matching suggests relevant properties to seekers
- [ ] All 25 gap items resolved
