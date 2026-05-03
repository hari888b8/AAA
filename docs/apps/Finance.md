# 💰 Finance — Credit, Loans & Insurance

> Complete agricultural financial services hub — credit scoring, loan access, and crop insurance.

---

## Overview

The Finance module provides farmers with access to agricultural financial services. It includes credit scoring based on farming history, loan marketplace connecting banks with farmers, and crop insurance comparison and application.

---

## Key Features

### Credit Score
- **Agri Credit Score** — Score based on farming activity, repayment history
- **Score Breakdown** — Understand what affects your score
- **Improvement Tips** — Actionable steps to improve creditworthiness
- **History Tracking** — Score changes over time

### Loans
- **Loan Marketplace** — Compare offerings from multiple banks/NBFCs
- **Kisan Credit Card (KCC)** — Subsidized agricultural credit
- **Crop Loans** — Short-term production loans
- **Term Loans** — Equipment and infrastructure financing
- **Application Tracking** — Monitor loan application status
- **Digital KYC** — Paperless verification

### Insurance
- **Crop Insurance** — PMFBY and private crop insurance
- **Livestock Insurance** — Coverage for cattle, poultry, fisheries
- **Equipment Insurance** — Machinery and asset protection
- **Premium Calculator** — Estimate premiums before applying
- **Claim Management** — File and track insurance claims

---

## Tabs

| Tab | Description |
|-----|-------------|
| Credit Score | View and improve your agri credit score |
| Loans | Browse and apply for agricultural loans |
| Insurance | Compare and purchase insurance products |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/finance/credit-score` | Get user's credit score |
| GET | `/finance/loans` | List available loan products |
| POST | `/finance/loans/apply` | Apply for a loan |
| GET | `/finance/loans/applications` | Track loan applications |
| GET | `/finance/insurance` | List insurance products |
| POST | `/finance/insurance/apply` | Apply for insurance |
| GET | `/finance/insurance/claims` | Track insurance claims |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/FinanceScreen.js` | Frontend screen component |
| `backend/src/routes/finance.js` | API route handlers |

---

## Partner Integrations

- State Bank of India (SBI)
- NABARD
- Regional Rural Banks
- Private NBFCs
- PMFBY (Government crop insurance)
- Private insurance companies
