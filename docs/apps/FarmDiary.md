# 📓 FarmDiary — Field Activity Log

> Complete field activity logging, crop lifecycle tracking, and expense management.

---

## Overview

FarmDiary is a digital field notebook for farmers. It enables logging of all farming activities (planting, irrigation, fertilization, pesticide application, harvesting), tracks crop lifecycles from sowing to harvest, and manages farm expenses and income.

---

## Key Features

### Activity Logging
- **Quick Log** — Fast entry for daily farming activities
- **Activity Types** — Categorized logging (planting, irrigation, fertilizer, etc.)
- **Photo Attachment** — Document activities with images
- **Field Association** — Link activities to specific fields/plots
- **Weather Tagging** — Automatically tag weather conditions

### Crop Lifecycle
- **Sowing to Harvest** — Track complete crop journey
- **Growth Stages** — Record stage transitions
- **Input Tracking** — All inputs applied to each crop
- **Yield Recording** — Final harvest and yield data

### Financial Tracking
- **Expense Logging** — Record all farming costs
- **Income Tracking** — Record sales and income
- **Cost Analysis** — Per-crop cost breakdown
- **Profit/Loss** — Net profitability per crop cycle

---

## Activity Types

| Type | Icon | Description |
|------|------|-------------|
| Planting | 🌱 | Sowing and transplanting |
| Irrigation | 💧 | Watering activities |
| Fertilizer | 🧪 | Fertilizer application |
| Pesticide | 🔬 | Pest/disease treatment |
| Harvesting | 🌾 | Crop harvesting |
| Observation | 👁️ | Field observations |
| Expense | 💰 | Cost recording |
| Income | 📈 | Revenue recording |
| Soil Test | 🧱 | Soil testing activities |

---

## Tabs

| Tab | Description |
|-----|-------------|
| Log | Activity timeline and quick entry |
| Crops | Active crop cycles and lifecycle |
| Expenses | Financial tracking and analysis |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/farmdiary/activities` | List activities |
| POST | `/farmdiary/activities` | Log a new activity |
| GET | `/farmdiary/crops` | List active crops |
| POST | `/farmdiary/crops` | Register a new crop cycle |
| GET | `/farmdiary/expenses` | Get expense summary |
| POST | `/farmdiary/expenses` | Log an expense |
| GET | `/farmdiary/yield/:cropId` | Get yield data for a crop |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/FarmDiaryScreen.js` | Frontend screen component |
| `backend/src/routes/farmdiary.js` | API route handlers |

---

## Benefits

- **Digital Records** — Replace paper-based notebooks
- **Loan Applications** — Use farming history as collateral data
- **Insurance Claims** — Documented activity proves cultivation
- **Yield Optimization** — Analyze what works best over seasons
- **Government Compliance** — Maintain records for subsidy eligibility
