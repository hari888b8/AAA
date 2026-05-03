# 👥 Community — Farmer Forum & Expert Network

> Farmer-to-farmer knowledge sharing with expert Q&A, polls, and discussions.

---

## Overview

The Community module is a social platform for farmers to connect, share knowledge, ask questions, and learn from agricultural experts. It features discussion threads, polls, expert verification, and topic-based categorization.

---

## Key Features

### Discussions & Posts
- **Ask Questions** — Post farming questions to the community
- **Share Knowledge** — Share tips, techniques, and experiences
- **Photo Posts** — Share field photos for feedback
- **Topic Tags** — Categorize posts by crop, topic, region

### Expert Network
- **Verified Experts** — ICRISAT, ICAR, NABARD specialists
- **Expert Q&A** — Get answers from domain experts
- **Expert Ratings** — See expert credibility scores
- **Speciality Tags** — Find experts by area of expertise

### Community Polls
- **Create Polls** — Survey the farming community
- **Vote & Discuss** — Participate in ongoing polls
- **Results Analytics** — View aggregated poll results
- **Trending Topics** — See what's being discussed

### Search & Discovery
- **Full-Text Search** — Search across all posts and answers
- **Category Filters** — Filter by topic, crop, region
- **Trending** — Most active discussions
- **Bookmarks** — Save posts for later reference

---

## Expert Categories

| Expert | Organization | Specialty |
|--------|-------------|-----------|
| Agri Scientists | ICRISAT | Dryland crops, varieties |
| Soil Specialists | ICAR-CRIDA | Soil health, organic farming |
| Aqua Consultants | CIBA | Shrimp, pond management |
| FPO Advisors | NABARD | Governance, credit |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/community/posts` | List community posts |
| POST | `/community/posts` | Create a new post |
| GET | `/community/posts/:id` | Get post with comments |
| POST | `/community/posts/:id/comments` | Add a comment |
| GET | `/community/experts` | List verified experts |
| GET | `/community/polls` | Get active polls |
| POST | `/community/polls/:id/vote` | Vote in a poll |
| GET | `/community/search` | Search posts |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/CommunityScreen.js` | Frontend screen component |
| `backend/src/routes/community.js` | API route handlers |

---

## Moderation

- AI-powered content moderation
- Expert-verified answers marked prominently
- Community reporting and flagging
- Admin review for reported content
