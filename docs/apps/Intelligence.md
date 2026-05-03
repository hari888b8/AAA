# 📊 Intelligence — Market Intelligence & Analytics

> Comprehensive market analytics dashboard for farmers, FPOs, and buyers.

---

## Overview

The Intelligence module provides data-driven insights across the AgriHub platform. It offers role-specific dashboards with market prices, supply-demand analytics, recommendations, and forecasting tools to help all stakeholders make better decisions.

---

## Key Features

### Farmer Dashboard
- **My Farm Profile** — Crop portfolio and production history
- **Price Alerts** — Notifications when crop prices hit targets
- **Harvest Calendar** — Upcoming harvest dates with price forecasts
- **Personalized Recommendations** — AI-driven advice on timing, pricing

### FPO Dashboard
- **Member Overview** — Aggregate view of member farmers' production
- **Procurement Planning** — Plan procurement based on harvest forecasts
- **Inventory Management** — Track collected/available stock
- **Market Positioning** — Optimal pricing based on supply-demand

### Buyer Dashboard
- **Supply Search** — Find available produce by crop, region, timeline
- **Price Intelligence** — Historical pricing trends and forecasts
- **Watchlist** — Track specific crops and regions
- **Inquiry Pipeline** — Manage active procurement inquiries

### Shared Analytics
- **Price Trends** — Historical and real-time commodity prices
- **Supply-Demand Maps** — District-level supply and demand visualization
- **Seasonal Patterns** — Crop-specific seasonal analysis
- **Platform Statistics** — Overall marketplace activity metrics

---

## Role-Based Views

| Role | Default Tab | Focus |
|------|-------------|-------|
| Farmer | Farmer Dashboard | My production, prices, recommendations |
| FPO | FPO Dashboard | Member aggregation, procurement, inventory |
| Buyer | Buyer Search | Supply discovery, pricing, watchlist |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/intelligence/prices` | Get commodity price data |
| GET | `/intelligence/supply-demand` | Supply-demand analytics |
| GET | `/intelligence/recommendations` | Personalized recommendations |
| GET | `/intelligence/platform-stats` | Platform-wide statistics |
| GET | `/intelligence/farmer/profile` | Farmer's intelligence profile |
| GET | `/intelligence/fpo/dashboard` | FPO aggregate dashboard |
| GET | `/intelligence/buyer/search` | Buyer supply search |
| GET | `/intelligence/districts` | District-level data |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/IntelligenceScreen.js` | Frontend screen component |
| `backend/src/routes/intelligence.js` | API route handlers |

---

## Data Sources

- **Mandi Prices** — Real-time market prices from government APIs
- **Platform Data** — Crop declarations, listings, and transactions
- **Weather Integration** — Climate impact on supply forecasts
- **Historical Patterns** — Multi-year seasonal analysis
