# 🎓 Training — Farmer Learning Center

> Comprehensive agricultural training with courses, videos, and certifications.

---

## Overview

The Training module is a learning management system (LMS) designed for farmers. It provides structured courses on crop management, pest control, organic farming, technology, market access, water management, finance, and FPO management — all in local languages.

---

## Key Features

### Course Catalog
- **Structured Courses** — Multi-module learning paths
- **Video Lessons** — Visual learning content
- **Progress Tracking** — Resume where you left off
- **Certifications** — Earn certificates upon completion

### Categories

| Category | Icon | Topics |
|----------|------|--------|
| Crop Management | 🌿 | Varieties, spacing, rotation, intercropping |
| Pest & Disease | 🔬 | IPM, identification, treatment protocols |
| Organic Farming | 🌱 | Compost, bio-inputs, certification |
| Technology | 💻 | Drones, sensors, precision agriculture |
| Market & Pricing | 📈 | Pricing strategies, market access |
| Water Management | 💧 | Drip, sprinkler, rainwater harvesting |
| Finance & Loans | 💰 | KCC, loan application, savings |
| FPO Management | 🏢 | Governance, compliance, collective marketing |

### Learning Features
- **Search** — Find courses by keyword
- **Category Filter** — Browse by topic area
- **Difficulty Levels** — Beginner, Intermediate, Advanced
- **Offline Access** — Download lessons for offline viewing
- **Quizzes** — Test knowledge after each module

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/training/courses` | List available courses |
| GET | `/training/courses/:id` | Get course details |
| POST | `/training/courses/:id/enroll` | Enroll in a course |
| GET | `/training/progress` | Get learning progress |
| POST | `/training/progress/:id` | Update progress |
| GET | `/training/certificates` | Get earned certificates |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/TrainingScreen.js` | Frontend screen component |
| `backend/src/routes/training.js` | API route handlers |

---

## Content Partners

- KVK (Krishi Vigyan Kendra) — Agricultural extension
- ICAR — Indian Council of Agricultural Research
- State Agriculture Universities
- NABARD — Financial literacy content
- Private agritech companies — Technology courses
