# 📚 AgriHub Platform — App Documentation

> Complete documentation for every app in the AgriHub Agriculture Operating System.

AgriHub is a unified agriculture ecosystem connecting 145M+ farmers, 10,000+ FPOs, traders, exporters, input suppliers, banks, and logistics providers on one digital platform.

---

## 🏗️ Platform Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend (PWA) | Vanilla JS + Vite | Single-page progressive web app |
| Backend API | Node.js + Express | REST API + WebSocket server |
| Database | PostgreSQL + Redis | Primary storage + caching |
| BaaS | Supabase | Auth, real-time, storage |
| Mobile | Android (Kotlin) | Native Android app |
| Deployment | Docker, Vercel, Netlify | Multi-platform hosting |

---

## 📱 Apps Directory

### Core Marketplace Apps
| App | Description | Docs |
|-----|-------------|------|
| 🌾 AgriFlow | Crop supply chain marketplace | [README](apps/AgriFlow.md) |
| 🐟 AquaOS | Aquaculture farm management & marketplace | [README](apps/AquaOS.md) |
| 🛒 AgriGalaxy | Agricultural input supplier marketplace | [README](apps/AgriGalaxy.md) |
| 🚜 KisanConnect | Farm equipment marketplace (rent/buy/sell) | [README](apps/KisanConnect.md) |
| 🏡 FarmerConnect | Agricultural property & land marketplace | [README](apps/FarmerConnect.md) |
| 🌍 BhoomiOS | Agricultural land buy/sell/rent platform | [README](apps/BhoomiOS.md) |

### Intelligence & Monitoring Apps
| App | Description | Docs |
|-----|-------------|------|
| 🔬 CropDoctor | AI-powered crop disease detection | [README](apps/CropDoctor.md) |
| 📊 Intelligence | Market intelligence & analytics dashboard | [README](apps/Intelligence.md) |
| ⛅ Weather | Weather forecasting & crop advisory | [README](apps/Weather.md) |
| 🛰️ Satellite | Satellite-based field monitoring | [README](apps/Satellite.md) |
| 📓 FarmDiary | Field activity logging & crop lifecycle | [README](apps/FarmDiary.md) |

### Financial & Trust Apps
| App | Description | Docs |
|-----|-------------|------|
| 💰 Finance | Credit scoring, loans & insurance | [README](apps/Finance.md) |
| 👛 Wallet | Unified wallet & credit system | [README](apps/Wallet.md) |
| 🔐 Escrow | Secure escrow payment system | [README](apps/Escrow.md) |
| ⭐ TrustScore | User reputation & trust scoring | [README](apps/TrustScore.md) |

### Community & Services Apps
| App | Description | Docs |
|-----|-------------|------|
| 👥 Community | Farmer community, Q&A & experts | [README](apps/Community.md) |
| 🎓 Training | Farmer learning & training center | [README](apps/Training.md) |
| 💼 Jobs | Agricultural job board | [README](apps/Jobs.md) |
| 🚚 Logistics | Farm pickup & delivery management | [README](apps/Logistics.md) |
| 📝 Contracts | Contract farming management | [README](apps/Contracts.md) |
| 🏛️ SchemeDiscovery | Government scheme matching & application | [README](apps/SchemeDiscovery.md) |

### Platform Infrastructure
| Component | Description | Docs |
|-----------|-------------|------|
| 🖥️ Backend API | Express REST API + WebSocket server | [README](apps/Backend.md) |
| 📱 Android | Native Android (Kotlin) application | [README](apps/Android.md) |

---

## 🔑 User Roles

| Role | Description | Primary Apps |
|------|-------------|-------------|
| Farmer | Individual farmer | AgriFlow, FarmDiary, Weather, CropDoctor, Community |
| FPO | Farmer Producer Organization | AgriFlow, Intelligence, Contracts, Finance |
| Buyer | Agricultural commodity buyer | AgriFlow, AquaOS, Intelligence, Logistics |
| Supplier | Input supplier | AgriGalaxy, Logistics |
| Agent | Field extension agent | Community, Training, Schemes |
| Admin | Platform administrator | All apps (admin view) |

---

## 🌐 Supported Languages

- English (en)
- Hindi (hi)
- Telugu (te)

---

## 🚀 Quick Start

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run migrate
npm start

# Docker (full stack)
docker-compose up
```

---

## 📁 Source Structure

```
src/
├── screens/          # App screen components
├── components/       # Shared UI components
├── integrations/     # Third-party integrations (maps, payments)
├── styles/           # CSS styles
├── api.js            # API client
├── app-shell.js      # Navigation & app shell
├── store.js          # State management
├── i18n.js           # Internationalization
├── payments.js       # Payment processing
└── main.js           # Entry point

backend/
├── src/
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic services
│   ├── middleware/   # Express middleware
│   ├── db/           # Database migrations & seeds
│   └── lib/          # Shared libraries
├── tests/            # API tests
└── Dockerfile        # Container configuration

android/              # Native Android application
supabase/             # Supabase migrations
```
