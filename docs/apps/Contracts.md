# 📝 Contracts — Contract Farming

> Digital contract farming with milestone tracking and fair trade guarantees.

---

## Overview

The Contracts module facilitates contract farming agreements between farmers/FPOs and buyers. It provides digital contract creation, milestone tracking, quality-based pricing, and ensures both parties fulfill their obligations.

---

## Key Features

### Contract Management
- **My Contracts** — View all active and past contracts
- **Contract Details** — Terms, pricing, quality specifications
- **Digital Signing** — Paperless agreement execution
- **Amendment Tracking** — Track any contract modifications

### Contract Creation
- **Template Library** — Pre-built templates for common crops
- **Custom Terms** — Define pricing, quality, delivery terms
- **Quality Parameters** — Specify acceptable quality grades
- **Payment Schedule** — Advance, milestone, or delivery-based

### Milestone Tracking
- **Progress Updates** — Track contract fulfillment stages
- **Photo Evidence** — Document milestone completion
- **Quality Checks** — Record quality test results
- **Deviation Alerts** — Notify when milestones are at risk

---

## Contract Lifecycle

| Stage | Description |
|-------|-------------|
| Draft | Contract being created/negotiated |
| Signed | Both parties have agreed |
| Active | Contract in execution |
| Quality Check | Produce being quality tested |
| Delivered | Goods delivered as per contract |
| Completed | All obligations fulfilled, payment done |
| Disputed | Issue raised by either party |

---

## Tabs

| Tab | Description |
|-----|-------------|
| My Contracts | Active and past contracts |
| Create New | Create a new contract |
| Milestones | Track contract milestones |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contracts` | List contracts |
| POST | `/contracts` | Create a new contract |
| GET | `/contracts/:id` | Get contract details |
| PUT | `/contracts/:id` | Update contract |
| POST | `/contracts/:id/sign` | Sign a contract |
| GET | `/contracts/:id/milestones` | Get milestones |
| POST | `/contracts/:id/milestones` | Add a milestone |
| PUT | `/contracts/:id/milestones/:mid` | Update milestone |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/ContractScreen.js` | Frontend screen component |
| `backend/src/routes/contracts.js` | API route handlers |

---

## Benefits

- **Price Assurance** — Farmers get guaranteed prices before sowing
- **Quality Standards** — Clear specifications prevent disputes
- **Supply Security** — Buyers get assured supply
- **Financial Access** — Contracts serve as collateral for loans
- **Traceability** — Complete trail from contract to delivery
