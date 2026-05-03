# 🌾 AgriFlow — Crop Supply Chain

> The core crop marketplace connecting farmers, FPOs, and buyers in a transparent supply chain.

---

## Overview

AgriFlow is the primary crop supply chain module of the AgriHub platform. It enables farmers to declare crops, list produce for sale, and connect with buyers — all through a role-based interface that enforces strict data visibility rules.

---

## Key Features

### For Farmers
- **Crop Declarations** — Register crops with expected harvest dates, quantities, and quality grades
- **Produce Listings** — List harvested crops for sale with pricing and location
- **Inquiry Management** — Receive and respond to buyer inquiries
- **Price Discovery** — View real-time mandi (market) prices for informed decisions

### For FPOs (Farmer Producer Organizations)
- **Member Management** — View and manage member farmers' crop data
- **Procurement** — Aggregate crop supply from member farmers
- **Supply Management** — Create consolidated supply listings
- **Bulk Inquiry Handling** — Manage inquiries at organizational level

### For Buyers
- **Supply Search** — Search all available produce (aggregated, farmer identity hidden)
- **Watchlist** — Track specific crops, regions, or price points
- **Inquiry System** — Send purchase inquiries to FPOs/farmers
- **Market Intelligence** — Price trends, supply forecasting, regional analytics

---

## Data Visibility Rules

| Role | Can See | Cannot See |
|------|---------|------------|
| Farmer | Only their own crops, declarations, listings, inquiries | Other farmers' data |
| FPO | Only their member farmers + their FPO's procurement/supply | Other FPOs' data |
| Buyer | ALL listings (paid access) — aggregated view | Individual farmer identity |

---

## Tab Structure

| Role | Tabs |
|------|------|
| Farmer | My Crops (declarations + listings) · Inquiries · Prices |
| FPO | Members · Procurement · My Supply · Inquiries |
| Buyer | Search Supply · Watchlist · My Inquiries · Intelligence |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agriflow/declarations` | List crop declarations |
| POST | `/agriflow/declarations` | Create a crop declaration |
| GET | `/agriflow/listings` | List produce for sale |
| POST | `/agriflow/listings` | Create a new listing |
| GET | `/agriflow/inquiries` | Get inquiries |
| POST | `/agriflow/inquiries` | Send an inquiry |
| GET | `/agriflow/prices` | Get mandi prices |
| GET | `/agriflow/supply/search` | Search available supply (buyer) |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/AgriFlowScreen.js` | Frontend screen component |
| `backend/src/routes/agriflow.js` | API route handlers |
| `backend/src/routes/trade.js` | Trade flow routes |

---

## Design Philosophy

- Farmers are **data creators** — they declare and list crops
- The marketplace is the **buyer's view** of farmer data
- Mixing these perspectives creates confusion, so they're kept separate
- FPOs act as **aggregation layer** between farmers and buyers
