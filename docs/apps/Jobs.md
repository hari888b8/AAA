# 💼 Jobs — Agricultural Job Board

> Connecting farm labour, operators, and skilled workers with agricultural job opportunities.

---

## Overview

The Jobs module is an agricultural employment marketplace. It connects farmers who need workers (harvesters, machine operators, sprayers) with skilled agricultural labor seeking opportunities. Supports both short-term gig work and longer-term employment.

---

## Key Features

### For Job Seekers
- **Browse Jobs** — Find work by category, location, pay rate
- **Quick Apply** — One-tap application for listed jobs
- **Job Alerts** — Notifications for matching opportunities
- **Skills Profile** — Showcase abilities and experience

### For Employers (Farmers/FPOs)
- **Post Jobs** — Create job listings with requirements
- **Applicant Management** — Review and select workers
- **Worker Ratings** — Rate completed work
- **Repeat Hire** — Easily rehire trusted workers

---

## Job Categories

| Category | Icon | Examples |
|----------|------|----------|
| Farm Labour | 👷 | Planting, weeding, manual work |
| Machinery Op. | 🚜 | Tractor, harvester operators |
| Crop Spraying | 🔬 | Drone/manual spraying specialists |
| Harvesting | 🌾 | Seasonal harvest workers |
| Tractor Driver | 🚗 | Licensed tractor operators |
| Farm Manager | 📋 | Supervisors, estate managers |
| Tech / Advisory | 🧑‍💼 | Agri consultants, tech support |
| Transport | 🚚 | Commodity transport drivers |

---

## Tabs

| Tab | Description |
|-----|-------------|
| Browse | Search and filter available jobs |
| My Jobs | Posted jobs (employer) or applications (seeker) |
| Alerts | Job notifications and recommendations |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs/listings` | List available jobs |
| POST | `/jobs/listings` | Post a new job |
| GET | `/jobs/listings/:id` | Get job details |
| POST | `/jobs/listings/:id/apply` | Apply for a job |
| GET | `/jobs/applications` | List my applications |
| PUT | `/jobs/applications/:id` | Update application status |
| GET | `/jobs/my-posts` | Get employer's posted jobs |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/JobsScreen.js` | Frontend screen component |
| `backend/src/routes/jobs.js` | API route handlers |

---

## Wage Transparency

- All listings show clear pay rate (per day/hour/task)
- No hidden deductions
- Platform facilitates direct payment via Wallet
- Rating system builds worker reputation over time
