# 🏡 FarmerConnect — Property & Agricultural Land

> Zero-broker agricultural property marketplace powered by AI.

---

## Overview

FarmerConnect is an AI-powered agricultural property and land marketplace within AgriHub. It enables landowners to list properties and seekers to discover agricultural land — all without brokers. The platform facilitates direct connections between property owners and seekers.

---

## Key Features

### For Property Seekers
- **Browse Listings** — Search agricultural land, farmhouses, farm plots
- **Advanced Filters** — Filter by type, district, price range, area
- **Save Favorites** — Bookmark properties for later comparison
- **Direct Inquiry** — Contact owners directly (zero broker fee)
- **AI Matching** — Intelligent recommendations based on preferences

### For Property Owners
- **List Property** — Create detailed listings with photos and descriptions
- **Manage Listings** — Edit, pause, or remove active listings
- **Inquiry Dashboard** — View and respond to seeker inquiries
- **Cooperative Societies** — Connect with agricultural cooperative societies

---

## Property Types

- Agricultural Land
- Farm Plots
- Farmhouses
- Orchards
- Poultry/Dairy Farms
- Fish Ponds / Aqua Farms

---

## User Modes

| Mode | Default For | Tabs |
|------|-------------|------|
| Seeker | Buyers | Browse · Saved · My Inquiries |
| Owner | Farmers | Listings · Inquiries · Societies |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/farmerconnect/properties` | List/search properties |
| POST | `/farmerconnect/properties` | Create a property listing |
| PUT | `/farmerconnect/properties/:id` | Update a listing |
| GET | `/farmerconnect/inquiries` | Get inquiries |
| POST | `/farmerconnect/inquiries` | Send an inquiry |
| GET | `/farmerconnect/saved` | Get saved/favorited listings |
| POST | `/farmerconnect/saved` | Save a listing |
| GET | `/farmerconnect/societies` | List cooperative societies |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/FarmerConnectScreen.js` | Frontend screen component |
| `backend/src/routes/farmerconnect.js` | API route handlers |

---

## Design Principles

- **Zero Broker** — Direct owner-to-seeker connection
- **AI-Powered** — Smart matching and recommendations
- **Trust & Verification** — Document verification for listed properties
- **Localized** — District-level search with local language support
