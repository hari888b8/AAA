# 🐟 AquaOS — Aquaculture Management System

> Complete aquaculture farm operating system with pond management, harvest marketplace, and input shopping.

---

## Overview

AquaOS is a dedicated aquaculture (fish/shrimp farming) management platform within AgriHub. It provides end-to-end pond management, water quality monitoring, feed tracking, harvest marketplace, and input procurement — all tailored for aqua farmers, buyers, and suppliers.

---

## Key Features

### Farm Management (Farmer View)
- **Pond Dashboard** — Real-time overview of all ponds with health indicators
- **Water Quality Monitoring** — pH, dissolved oxygen, temperature, ammonia tracking
- **Feed Management** — Feed schedules, consumption tracking, FCR calculation
- **Stocking & Growth** — Track stocking density, survival rates, and growth curves
- **Days of Culture (DOC)** — Automatic culture day counting per pond

### Harvest Marketplace (Buyer View)
- **Species Search** — Filter by species (Vannamei shrimp, Rohu, Pangasius, etc.)
- **District/Region Filter** — Location-based supply discovery
- **Harvest Timeline** — View produce available within N days
- **Price Discovery** — Real-time aqua product pricing

### Input Marketplace (Supplier View)
- **Product Listings** — List aqua inputs (feed, probiotics, medicines)
- **Lead Management** — Track buyer leads and inquiries
- **Price Updates** — Dynamic pricing management
- **Order Fulfillment** — Process and track supply orders

### Advisory & Analytics
- **Farm Advisory** — AI-powered pond health recommendations
- **Disease Alerts** — Early warning for common aqua diseases
- **Market Analytics** — Price trends, demand forecasting
- **Community Feed** — Connect with other aqua farmers

---

## User Modes

| Role | Mode | Primary Features |
|------|------|-----------------|
| Farmer | Farm OS | Dashboard, Ponds, Feed, Market, Community, Analytics |
| Buyer | Marketplace | Search, Prices, Supply, My Offers, Chats |
| Supplier | My Products | Product listing, Leads, Prices, Orders |

---

## Multilingual Support

AquaOS has built-in support for:
- English (en)
- Telugu (te)
- Hindi (hi)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/aquaos/dashboard` | Get farmer's aqua dashboard |
| GET | `/aquaos/ponds` | List all ponds |
| POST | `/aquaos/ponds` | Create a new pond |
| PUT | `/aquaos/ponds/:id/water-quality` | Update water quality readings |
| GET | `/aquaos/harvest/listings` | Browse harvest marketplace |
| POST | `/aquaos/harvest/listings` | Create a harvest listing |
| GET | `/aquaos/inputs` | Browse aqua inputs |
| GET | `/aquaos/advisory` | Get farming advisories |
| GET | `/aquaos/analytics` | Get farm analytics |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/AquaOSScreen.js` | Frontend screen component |
| `backend/src/routes/aquaos.js` | API route handlers |

---

## Key Metrics Tracked

- **Pond Health Score** — Composite of water quality parameters
- **FCR (Feed Conversion Ratio)** — Feed efficiency measurement
- **Survival Rate** — Percentage of stocked animals surviving
- **DOC (Days of Culture)** — Days since last stocking
- **ABW (Average Body Weight)** — Growth tracking metric
