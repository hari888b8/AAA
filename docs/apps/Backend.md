# 🖥️ Backend — REST API & WebSocket Server

> Node.js + Express backend powering the entire AgriHub platform with 50+ API route modules.

---

## Overview

The AgriHub backend is a comprehensive REST API and WebSocket server built with Node.js, Express, PostgreSQL, and Redis. It serves all platform apps with a unified authentication system, role-based access control, and real-time capabilities.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.x | HTTP framework |
| PostgreSQL | 15+ | Primary database |
| Redis | 7.x | Caching & sessions |
| WebSocket (ws) | 8.x | Real-time communication |
| JWT | - | Authentication tokens |
| Pino | 10.x | Structured logging |
| Docker | - | Containerization |

---

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Server entry point
│   ├── scheduler.js          # Background job scheduler
│   ├── db/
│   │   ├── migrate.js        # Database migrations v1
│   │   ├── migrate-v2.js     # Migrations v2
│   │   ├── migrate-v3-trade.js  # Trade module migrations
│   │   ├── migrate-v4-infrastructure.js
│   │   ├── migrate-v5-platform.js
│   │   └── seed.js           # Database seeding
│   ├── routes/               # 50+ route modules
│   │   ├── auth.js           # Authentication
│   │   ├── agriflow.js       # AgriFlow routes
│   │   ├── aquaos.js         # AquaOS routes
│   │   ├── agrigalaxy.js     # AgriGalaxy routes
│   │   ├── kisanconnect.js   # KisanConnect routes
│   │   ├── farmerconnect.js  # FarmerConnect routes
│   │   ├── bhoomios.js       # BhoomiOS routes
│   │   ├── cropdoctor.js     # CropDoctor routes
│   │   ├── intelligence.js   # Intelligence routes
│   │   ├── weather.js        # Weather routes
│   │   ├── satellite.js      # Satellite routes
│   │   ├── farmdiary.js      # FarmDiary routes
│   │   ├── finance.js        # Finance routes
│   │   ├── wallet.js         # Wallet routes
│   │   ├── escrow.js         # Escrow routes
│   │   ├── trustscore.js     # TrustScore routes
│   │   ├── community.js      # Community routes
│   │   ├── training.js       # Training routes
│   │   ├── jobs.js           # Jobs routes
│   │   ├── logistics.js      # Logistics routes
│   │   ├── contracts.js      # Contracts routes
│   │   ├── schemediscovery.js# Scheme routes
│   │   ├── trade.js          # Trade flow
│   │   ├── payments.js       # Payment processing
│   │   ├── chat.js           # Messaging
│   │   └── ...               # Many more
│   ├── services/             # Business logic
│   │   ├── cache.js          # Redis caching
│   │   ├── payments.js       # Payment service
│   │   ├── push.js           # Push notifications
│   │   ├── queue.js          # Job queue
│   │   ├── sms.js            # SMS service
│   │   ├── storage.js        # File storage
│   │   ├── translate.js      # Translation
│   │   ├── weather.js        # Weather data
│   │   ├── websocket.js      # WebSocket service
│   │   ├── apmc.js           # APMC market data
│   │   └── audit.js          # Audit logging
│   ├── middleware/           # Express middleware
│   └── lib/                  # Shared utilities
├── tests/                    # API tests
├── Dockerfile                # Container config
├── package.json              # Dependencies
└── setup-db.js               # DB initialization
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run setup-db

# Run migrations
npm run migrate

# Seed sample data
npm run seed

# Start server
npm start

# Development mode (auto-restart)
npm run dev
```

---

## Environment Variables

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/agrihub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-key
```

---

## Security

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT tokens |
| Rate Limiting | express-rate-limit |
| Input Validation | express-validator |
| CORS | cors middleware |
| Helmet | Security headers |
| HPP | HTTP parameter pollution protection |
| Compression | gzip response compression |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with auto-reload |
| `npm run migrate` | Run all migrations |
| `npm run seed` | Seed sample data |
| `npm run test` | Run test suite |
| `npm run test:trade` | Run trade flow tests |
| `npm run setup-db` | Initialize database |

---

## API Documentation

The backend includes an OpenAPI spec generator at `routes/openapi.js`. All routes follow RESTful conventions with consistent error responses.

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```

### Error Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```
