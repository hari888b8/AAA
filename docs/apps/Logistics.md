# 🚚 Logistics — Farm Pickup & Delivery

> End-to-end logistics management from farm pickup to buyer delivery.

---

## Overview

The Logistics module manages the physical movement of agricultural commodities from farms to buyers. It includes delivery tracking, pickup scheduling, logistics partner management, and batch shipment coordination.

---

## Key Features

### Delivery Tracking
- **Real-time Status** — Track shipments from pickup to delivery
- **GPS Tracking** — Live location of transport vehicles
- **Status Updates** — Pickup, in-transit, delivered notifications
- **Delivery Proof** — Photo/signature confirmation

### Pickup Scheduling
- **Schedule Pickup** — Request farm gate pickup for sold produce
- **Time Slot Selection** — Choose preferred pickup windows
- **Vehicle Assignment** — Appropriate vehicle for cargo type/size
- **Weight Verification** — Weigh bridge integration

### Partner Dashboard (Logistics Providers)
- **Available Requests** — Browse pickup/delivery requests
- **Route Optimization** — Efficient multi-stop routing
- **Earnings Tracking** — Revenue and payment management
- **Fleet Management** — Manage vehicles and drivers

### Batch Shipments
- **Consolidation** — Combine multiple small shipments
- **FPO Collection** — Aggregate member farmers' produce
- **Cold Chain** — Temperature-controlled logistics
- **Documentation** — Bills, challans, and receipts

---

## Tabs

| Tab | Description |
|-----|-------------|
| Track | Monitor active deliveries |
| Schedule | Schedule new pickups |
| Partner | Logistics partner dashboard |
| Batch | Batch shipment management |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/logistics/requests` | List logistics requests |
| POST | `/logistics/requests` | Create a delivery request |
| GET | `/logistics/requests/:id` | Get request details |
| PUT | `/logistics/requests/:id/status` | Update delivery status |
| GET | `/logistics/partners` | List logistics partners |
| POST | `/logistics/partners/register` | Register as partner |
| GET | `/logistics/tracking/:id` | Get real-time tracking |
| POST | `/logistics/batch` | Create batch shipment |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/LogisticsScreen.js` | Frontend screen component |
| `backend/src/routes/logistics.js` | API route handlers |

---

## Vehicle Types

| Type | Use Case |
|------|----------|
| Two-wheeler | Small parcels, documents |
| Three-wheeler | Farm samples, small quantities |
| Mini truck | 1-3 ton deliveries |
| Truck | Bulk commodity transport |
| Refrigerated | Perishable produce, fish, dairy |
