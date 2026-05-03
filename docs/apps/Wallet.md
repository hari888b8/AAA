# 👛 Wallet — Unified Wallet & Credit System

> Platform wallet for transactions, referral rewards, and gamified engagement.

---

## Overview

The Wallet module provides a unified digital wallet for all transactions within the AgriHub platform. It includes balance management, transaction history, referral rewards, and a gamified leaderboard system to encourage platform engagement.

---

## Key Features

### Wallet Overview
- **Balance Display** — Current wallet balance and available credit
- **Quick Actions** — Add money, send money, withdraw
- **Recent Transactions** — Quick view of latest activity
- **Pending Settlements** — Track incoming/outgoing settlements

### Transaction History
- **Complete Log** — All wallet transactions with details
- **Category Filters** — Filter by type (purchase, sale, reward, referral)
- **Date Range** — Search transactions by date
- **Export** — Download transaction statements

### Referral Program
- **Referral Code** — Share your unique code to earn rewards
- **Referral Tracking** — See who joined using your code
- **Reward Tiers** — Increasing rewards for more referrals
- **Milestone Bonuses** — Extra rewards at referral milestones

### Leaderboard
- **Platform Rankings** — Top earners and active users
- **Weekly/Monthly** — Time-based leaderboards
- **Category Leaders** — Top in specific activities
- **Badges & Achievements** — Gamification rewards

---

## Tabs

| Tab | Description |
|-----|-------------|
| Overview | Wallet balance and quick actions |
| History | Transaction history and filtering |
| Referral | Referral program and tracking |
| Leaderboard | Platform rankings and achievements |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet/balance` | Get wallet balance |
| POST | `/wallet/add` | Add money to wallet |
| POST | `/wallet/send` | Send money to another user |
| POST | `/wallet/withdraw` | Withdraw to bank account |
| GET | `/wallet/history` | Get transaction history |
| GET | `/wallet/referral` | Get referral info and stats |
| POST | `/wallet/referral/apply` | Apply a referral code |
| GET | `/wallet/leaderboard` | Get leaderboard rankings |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/WalletScreen.js` | Frontend screen component |
| `backend/src/routes/wallet.js` | API route handlers |

---

## Transaction Types

| Type | Description |
|------|-------------|
| Purchase | Payment for marketplace purchases |
| Sale | Income from selling produce/products |
| Reward | Platform reward credits |
| Referral | Referral bonus earnings |
| Transfer | Peer-to-peer transfer |
| Withdrawal | Bank account withdrawal |
| Top-up | Adding funds to wallet |
