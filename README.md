# 🌾 AgriHub — India's Agriculture Intelligence Ecosystem

> **Full-stack Android application** · React Native + Node.js/Express + PostgreSQL + Redis + WebSocket

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)](./backend)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-blue)](./backend/src/db)
[![Mobile](https://img.shields.io/badge/Mobile-React%20Native%20%2B%20Expo-purple)](./mobile)
[![Real-time](https://img.shields.io/badge/Realtime-WebSocket%205s-orange)](./backend/src/services/websocket.js)

---

## Architecture

```
AAA/
├── backend/                   Node.js REST API + WebSocket Server
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.js        PostgreSQL connection pool
│   │   │   ├── migrate.js     Schema migration (15 tables, indexes, triggers)
│   │   │   └── seed.js        Demo data (crops, districts, listings, ponds...)
│   │   ├── middleware/
│   │   │   └── auth.js        JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js        POST/send-otp, POST/verify-otp, POST/refresh
│   │   │   ├── agriflow.js    Marketplace, listings, inquiries, declarations
│   │   │   ├── aquaos.js      Ponds, water-logs, advisories
│   │   │   ├── farmerconnect.js  Property listings CRUD
│   │   │   ├── kisanconnect.js   Equipment rental, job board
│   │   │   └── intelligence.js   Supply-demand, heatmap, live prices
│   │   ├── services/
│   │   │   └── websocket.js   WS server: price ticker (5s), activity feed push
│   │   └── index.js           Server entry — auto migrate + seed on boot
│   ├── .env                   PostgreSQL + Redis + JWT config
│   └── Dockerfile
│
├── mobile/                    React Native (Expo) Android App
│   ├── src/
│   │   ├── theme/index.js     Design tokens (dark theme)
│   │   ├── services/api.js    Axios client + auto JWT refresh
│   │   ├── store/index.js     Zustand — auth + WebSocket price store
│   │   ├── components/index.js  MetricCard, AppCard, PriceTickerBar, Button...
│   │   ├── navigation/
│   │   │   └── AppNavigator.js  Drawer navigator + custom sidebar
│   │   └── screens/
│   │       ├── AuthScreen.js      Phone → OTP → Role setup
│   │       ├── HomeScreen.js      Live metrics + price ticker + activity feed
│   │       ├── AgriFlowScreen.js  Marketplace + inquiry modal + declarations
│   │       ├── AquaOSScreen.js    Ponds + water quality bars + advisories
│   │       ├── FarmerConnectScreen.js  Properties + filter chips
│   │       ├── KisanConnectScreen.js   Equipment + booking + jobs
│   │       └── IntelligenceScreen.js   Supply/demand bars + live prices + heatmap
│   └── App.js                 Session restore → Auth gate → Navigator
│
├── supabase/migrations/001_foundation.sql  (reference schema)
├── docker-compose.yml         One-command infra startup
└── src/                       (original static web reference)
```

---

## Database Schema (PostgreSQL 15)

| Table | Purpose |
|---|---|
| `users` | Farmers, FPOs, buyers, admins |
| `otps` | Phone OTP verification |
| `refresh_tokens` | JWT refresh token store |
| `crop_catalog` | 15 seeded crops (Rice, Tomato, Chilli…) |
| `districts` | 12 AP districts with lat/lng |
| `declarations` | Farmer crop planting declarations |
| `supply_listings` | FPO published supply (marketplace) |
| `inquiries` | Buyer → seller inquiry thread |
| `price_feeds` | Multi-source market prices |
| `ponds` | AquaOS pond management |
| `water_quality_logs` | pH, O₂, temperature time-series |
| `advisories` | Disease/weather alerts by severity |
| `properties` | FarmerConnect property listings |
| `equipment` | KisanConnect equipment catalog |
| `equipment_bookings` | Rental bookings with auto cost calc |
| `jobs` | Job board postings |
| `activity_feed` | Real-time event log |
| `notifications` | Per-user notification queue |

---

## Quick Start

### Option A — Docker (Recommended)

```bash
# Start PostgreSQL + Redis + Backend API
docker compose up -d

# Check health
curl http://localhost:4000/health
```

### Option B — Local (PostgreSQL already running)

```bash
# Backend
cd backend
npm install
# Edit .env with your PostgreSQL credentials
npm start   # Auto-migrates + seeds on first run

# Mobile (new terminal)
cd mobile
npm start   # Then press 'a' for Android
```

---

## Environment Variables

**`backend/.env`**
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=Agrihub
POSTGRES_USER=Agrihub
POSTGRES_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=agrihub_super_secret_jwt_2026_key_min_32_chars
JWT_EXPIRY=7d
PORT=4000
```

**`mobile/` — Android Emulator** (`10.0.2.2`) is the default API host.  
For a real device: set `EXPO_PUBLIC_API_URL=http://<your-machine-ip>:4000`

---

## API Reference

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/auth/send-otp` | No |
| `POST` | `/api/auth/verify-otp` | No |
| `POST` | `/api/auth/refresh` | No |
| `GET` | `/api/auth/me` | ✅ JWT |

### AgriFlow
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/api/agriflow/listings` | Optional |
| `POST` | `/api/agriflow/listings` | ✅ JWT |
| `POST` | `/api/agriflow/inquiries` | ✅ JWT |
| `GET` | `/api/agriflow/declarations` | ✅ JWT |
| `POST` | `/api/agriflow/declarations` | ✅ JWT |

### AquaOS
| Method | Endpoint | Auth |
|---|---|---|
| `GET/POST` | `/api/aquaos/ponds` | ✅ JWT |
| `PATCH` | `/api/aquaos/ponds/:id` | ✅ JWT |
| `POST` | `/api/aquaos/ponds/:id/water-log` | ✅ JWT |
| `GET` | `/api/aquaos/advisories` | Public |

### WebSocket (`ws://localhost:4000/ws`)

```js
// Client sends:
{ "type": "auth", "userId": "..." }

// Server broadcasts every 5s:
{ "type": "price_update", "prices": [...] }

// Server broadcasts new activities:
{ "type": "activity", "activities": [...] }
```

---

## Real-time Features

- **Price Ticker** — 8 commodities broadcast every **5 seconds** over WebSocket
- **Activity Feed** — DB events (declarations, listings, inquiries) pushed live
- **Inquiry Notifications** — Buyer inquiry → seller notification via WS
- **Pull-to-Refresh** — All screens support swipe-down refresh

---

## Platform Modules

| Platform | Screens | Features |
|---|---|---|
| 🌿 **AgriFlow** | Marketplace, Inquiries, Declarations | Crop listings, buyer inquiries, supply intel |
| 🐟 **AquaOS** | Ponds, Advisories | DOC tracking, water quality logging, alerts |
| 🏠 **FarmerConnect** | Properties | Agri land, PG, apartment search |
| 🚜 **KisanConnect** | Equipment, Jobs | Tractor/harvester booking, job board |
| 🧠 **Intelligence** | Supply/Demand, Prices, Heatmap | Live market prices, district data |

---

## Build APK

```bash
cd mobile
npx eas build --platform android --local
```

Or for debug APK:
```bash
npx expo run:android
```
