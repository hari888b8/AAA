# ⭐ TrustScore — Reputation System

> Platform-wide trust and reputation scoring for all participants.

---

## Overview

TrustScore is the reputation system that underpins all transactions on AgriHub. It calculates and displays trust scores for farmers, buyers, suppliers, and FPOs based on their platform activity, transaction history, and peer reviews.

---

## Key Features

### Score Display
- **Overall Trust Score** — Composite score out of 100
- **Score Breakdown** — Category-wise scoring components
- **Score History** — Track score changes over time
- **Badges & Verification** — Visual trust indicators

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Transaction History | 30% | Successful trades completed |
| Payment Reliability | 25% | On-time payments and settlements |
| Peer Reviews | 20% | Ratings from trade partners |
| Profile Completeness | 10% | KYC, documentation, verification |
| Platform Activity | 10% | Regular engagement and usage |
| Dispute Rate | 5% | Low disputes = higher score |

### Trust Levels

| Score Range | Level | Badge |
|-------------|-------|-------|
| 90-100 | Platinum | 💎 |
| 75-89 | Gold | 🥇 |
| 60-74 | Silver | 🥈 |
| 40-59 | Bronze | 🥉 |
| 0-39 | New | 🆕 |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trustscore/me` | Get my trust score |
| GET | `/trustscore/:userId` | Get another user's score |
| GET | `/trustscore/breakdown` | Detailed score breakdown |
| GET | `/trustscore/history` | Score changes over time |
| GET | `/trustscore/leaderboard` | Top-rated users |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/TrustScoreScreen.js` | Frontend screen component |
| `backend/src/routes/trustscore.js` | API route handlers |

---

## How Scores Are Used

- **Marketplace Visibility** — Higher scores get better listing placement
- **Loan Eligibility** — Banks consider trust score for credit decisions
- **Buyer Confidence** — Buyers prefer high-score sellers
- **Dispute Resolution** — Higher-score users get benefit of doubt
- **Platform Privileges** — Access to premium features
