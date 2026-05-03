# 🚜 KisanConnect — Farm Equipment Marketplace

> Simple, focused equipment marketplace — Rent · Buy · Sell farm machinery.

---

## Overview

KisanConnect is the farm equipment marketplace within AgriHub. It provides a clean, focused interface for renting, buying, and selling agricultural machinery and equipment. The app also connects machine operators with farmers who need equipment services.

---

## Key Features

### Equipment Rental
- **Browse Available Equipment** — Find tractors, harvesters, JCBs near you
- **Operator Connect** — Hire machine operators directly
- **Booking System** — Schedule equipment with date/time slots
- **Real-time Availability** — See what's available now in your area

### Equipment Purchase
- **Buy Used/New** — Browse equipment listings for purchase
- **Price Comparison** — Compare prices across sellers
- **Verified Listings** — Trust-scored equipment listings
- **Payment Integration** — Secure purchase flow

### Equipment Sale
- **List Your Equipment** — Sell unused or old machinery
- **Photo Upload** — Multiple photos with condition details
- **Pricing Guidance** — Suggested pricing based on market data
- **Inquiry Management** — Handle buyer questions

### Operator Connect Mode
- **Machine Request Board** — Post requests for equipment needs
- **Operator Dashboard** — Manage availability and bookings
- **Stats & Analytics** — Track completed jobs, earnings

---

## Equipment Types

| Type | Icon | Examples |
|------|------|----------|
| Tractor | 🚜 | Mahindra, Swaraj, John Deere |
| JCB | 🏗️ | Backhoe loaders, excavators |
| Harvester | 🌾 | Combine harvesters, reaper binders |
| Rotavator | ⚙️ | Soil tillers, rotary tillers |
| Excavator | ⛏️ | Earth movers, diggers |
| Crane | 🏗️ | Mobile cranes, hoists |

---

## Modes

| Mode | Description |
|------|-------------|
| Connect | Operator-farmer matching (default) |
| Rent | Browse and rent equipment |
| Buy | Purchase equipment |
| Sell | List equipment for sale |
| Services | Equipment servicing & maintenance |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/kisanconnect/equipment` | List available equipment |
| POST | `/kisanconnect/equipment` | List new equipment |
| GET | `/kisanconnect/operators` | Find operators |
| POST | `/kisanconnect/requests` | Post a machine request |
| GET | `/kisanconnect/bookings` | Get bookings |
| POST | `/kisanconnect/bookings` | Create a booking |
| GET | `/kisanconnect/stats` | Get operator/user stats |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/KisanConnectScreen.js` | Frontend screen component |
| `backend/src/routes/kisanconnect.js` | API route handlers |

---

## Integration Points

- **Payments** — Secure checkout for rentals and purchases
- **Reviews** — Rating system for operators and equipment
- **Trust Score** — Operator reliability scoring
- **Logistics** — Equipment delivery coordination
