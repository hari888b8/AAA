# 🌍 BhoomiOS — Agricultural Land Marketplace

> Buy · Sell · Rent/Lease farmland with verified listings and transparent pricing.

---

## Overview

BhoomiOS is the dedicated agricultural land marketplace within AgriHub. It focuses specifically on farmland transactions — buying, selling, and leasing agricultural land with verified documentation, transparent pricing, and district-level search capabilities.

---

## Key Features

### Buy Mode
- **Search Farmland** — Find land for purchase by district, type, and price
- **Detailed Listings** — View area, soil type, water source, crop history
- **Document Verification** — Verified ownership and land records
- **Price Analytics** — Market rate comparison for informed decisions

### Sell Mode
- **List Your Land** — Create detailed sale listings
- **Pricing Guidance** — AI-suggested pricing based on location and features
- **Enquiry Management** — Handle buyer questions and offers
- **Document Upload** — Attach land records, pattadar passbook

### Rent/Lease Mode
- **Lease Listings** — Find or list land for lease
- **Lease Terms** — Flexible duration (seasonal, annual, multi-year)
- **Agreement Generation** — Digital lease agreements
- **Payment Tracking** — Lease payment management

---

## Land Types

| Type | Icon | Description |
|------|------|-------------|
| Agricultural | 🌾 | Active farmland for crops |
| Horticultural | 🌳 | Orchards, fruit farms |
| Vacant | 🏜️ | Undeveloped agricultural land |
| Wetland | 💧 | Paddy fields, aquaculture suitable |
| Plantation | 🌴 | Coconut, palm, rubber plantations |
| Mixed Use | 🏡 | Farm + residential |

---

## Filters & Search

- **District** — Location-based search
- **Land Type** — Category filtering
- **Price Range** — Budget-based filtering
- **Area Range** — Size-based filtering (acres)
- **Water Source** — Bore well, canal, river, rain-fed
- **Soil Type** — Black, red, alluvial, laterite

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bhoomios/listings` | Search land listings |
| POST | `/bhoomios/listings` | Create a land listing |
| PUT | `/bhoomios/listings/:id` | Update listing |
| GET | `/bhoomios/my-listings` | Get user's own listings |
| GET | `/bhoomios/enquiries` | Get enquiries |
| POST | `/bhoomios/enquiries` | Send an enquiry |
| GET | `/bhoomios/analytics` | Get price analytics |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/BhoomiOSScreen.js` | Frontend screen component |
| `backend/src/routes/bhoomios.js` | API route handlers |

---

## Verification & Trust

- Land ownership documents verified
- GPS coordinates for accurate location
- Historical crop data for land quality
- Integration with government land records
- Trust score for buyers and sellers
