# 🏛️ SchemeDiscovery — Government Scheme Matching

> Automatic matching of farmer profiles to eligible government schemes with guided applications.

---

## Overview

SchemeDiscovery automatically matches farmer profiles to eligible government agricultural schemes. It simplifies the complex process of finding and applying for subsidies, grants, and welfare programs by using profile data to identify relevant schemes.

---

## Key Features

### Auto-Matching
- **Profile-Based Matching** — Automatically find schemes you're eligible for
- **Eligibility Score** — See how well you match each scheme
- **Missing Documents** — Know what's needed before applying
- **Priority Ranking** — Most beneficial schemes shown first

### Application Management
- **Guided Application** — Step-by-step application process
- **Document Checklist** — Know exactly what to submit
- **Application Tracking** — Monitor status after submission
- **Deadline Alerts** — Never miss application deadlines

### Categories
- **Crop Subsidies** — Input subsidies, MSP benefits
- **Equipment Grants** — Machinery and tool subsidies
- **Irrigation** — Drip/sprinkler subsidy programs
- **Insurance** — PMFBY, weather-based insurance
- **Land Development** — Soil health, leveling subsidies
- **Storage** — Cold storage, warehouse construction
- **Marketing** — Market linkage and FPO formation

### Deadline Calendar
- **Upcoming Deadlines** — Time-sensitive scheme applications
- **Seasonal Schemes** — Schemes that open seasonally
- **Reminders** — Push notifications for approaching deadlines

---

## Tabs

| Tab | Description |
|-----|-------------|
| Matched | Schemes matching your profile |
| Applications | Track submitted applications |
| Categories | Browse schemes by category |
| Deadlines | Upcoming application deadlines |

---

## Example Schemes

| Scheme | Type | Benefit |
|--------|------|---------|
| PM-KISAN | Direct Benefit | ₹6,000/year |
| PMFBY | Insurance | Subsidized premium |
| Micro Irrigation | Subsidy | 55-90% cost subsidy |
| KCC | Credit | Subsidized interest rate |
| Soil Health Card | Free Service | Free soil testing |
| e-NAM | Market Access | National market listing |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schemes/discover` | Get matched schemes |
| GET | `/schemes/categories` | List scheme categories |
| GET | `/schemes/:id` | Get scheme details |
| POST | `/schemes/:id/apply` | Start application |
| GET | `/schemes/applications` | List my applications |
| GET | `/schemes/deadlines` | Get upcoming deadlines |
| GET | `/schemes/eligibility/:id` | Check eligibility for a scheme |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/SchemeDiscoveryScreen.js` | Frontend screen component |
| `backend/src/routes/schemediscovery.js` | API route handlers |

---

## How Matching Works

1. **Profile Analysis** — Read farmer's land size, crops, location, income
2. **Scheme Database** — Match against eligibility criteria of all schemes
3. **Score & Rank** — Calculate match percentage for each scheme
4. **Document Gap** — Identify missing documents needed
5. **Guided Application** — Provide step-by-step application assistance
