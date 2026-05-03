# 🔐 Escrow — Secure Payment System

> Secure escrow-based transactions with buyer protection and dispute resolution.

---

## Overview

The Escrow module provides secure payment handling for high-value agricultural transactions. Buyer funds are held in escrow until delivery is confirmed, protecting both parties. Built-in dispute resolution ensures fair outcomes.

---

## Key Features

### Escrow Transactions
- **Create Escrow** — Initiate secure payment for a trade
- **Fund Escrow** — Buyer deposits funds into secure escrow
- **Delivery Confirmation** — Seller confirms shipment, buyer confirms receipt
- **Auto-Release** — Funds released upon delivery confirmation
- **Partial Release** — Support for milestone-based payments

### Dispute Resolution
- **Raise Dispute** — Either party can flag an issue
- **Evidence Upload** — Submit photos, documents as proof
- **Mediation** — Platform-assisted resolution process
- **Arbitration** — Final decision for unresolved disputes

### Transaction Tracking
- **Status Updates** — Real-time escrow status
- **Timeline View** — Complete transaction lifecycle
- **Notifications** — Alerts for status changes
- **Document Trail** — Complete audit trail

---

## Escrow States

| State | Description |
|-------|-------------|
| Created | Escrow initiated, awaiting funding |
| Funded | Buyer has deposited funds |
| In Transit | Goods are being shipped |
| Delivered | Delivery confirmed by buyer |
| Released | Funds released to seller |
| Disputed | Issue raised by either party |
| Resolved | Dispute resolved |

---

## Filters

| Filter | Description |
|--------|-------------|
| All | Show all escrow transactions |
| Pending | Awaiting action (created state) |
| Funded | Money deposited, awaiting delivery |
| Disputed | Active disputes needing resolution |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/escrow/transactions` | List escrow transactions |
| POST | `/escrow/create` | Create a new escrow |
| POST | `/escrow/:id/fund` | Fund an escrow |
| POST | `/escrow/:id/confirm-delivery` | Confirm delivery received |
| POST | `/escrow/:id/release` | Release funds to seller |
| POST | `/escrow/:id/dispute` | Raise a dispute |
| POST | `/escrow/:id/resolve` | Resolve a dispute |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/EscrowScreen.js` | Frontend screen component |
| `backend/src/routes/escrow.js` | API route handlers |

---

## Security Features

- Funds held in secure third-party account
- Two-factor confirmation for releases
- Automatic timeout-based releases
- Complete audit trail for compliance
- Dispute resolution with evidence system
