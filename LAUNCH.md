# 🚀 AgriHub — Launch Guide

## Status: ✅ Application is Built & Verified
> Android bundle compiled: **1,255 modules, 0 errors** (3.67 MB)

---

## 🌐 Live Deployment Links

AgriHub is configured to deploy on **multiple platforms** automatically:

| Platform | URL | How It Deploys |
|---|---|---|
| 🔺 **Vercel** | [agrihub on Vercel](https://aaa-hari888b8s-projects.vercel.app) | Auto-deploys on push to `main` via CI workflow (`ci.yml`). Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets. |
| 📄 **GitHub Pages** | [https://hari888b8.github.io/AAA/](https://hari888b8.github.io/AAA/) | Auto-deploys on push to `main` via `deploy-pages.yml`. Enable Pages in repo Settings → Pages → Source: GitHub Actions. |
| 🟢 **Netlify** | Deploy via [Netlify Import](https://app.netlify.com/start/deploy?repository=https://github.com/hari888b8/AAA) | Connect repo at netlify.com → auto-builds using `netlify.toml`. |

### Quick Setup Checklist

1. **Vercel** — Add these secrets in GitHub repo → Settings → Secrets:
   - `VERCEL_TOKEN` — Get from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` — From Vercel project settings
   - `VERCEL_PROJECT_ID` — From Vercel project settings

2. **GitHub Pages** — Go to repo Settings → Pages → Source → select **GitHub Actions**. The workflow will auto-deploy on next push to `main`.

3. **Netlify** — Click the Netlify link above, or go to [app.netlify.com](https://app.netlify.com), click "Add new site" → "Import an existing project" → select this repo. It uses `netlify.toml` automatically.

---

## Step 1 — Set Up the Database

Open **pgAdmin** or the **SQL Shell (psql)** that came with PostgreSQL 17.

Run this SQL to create the AgriHub database user:

```sql
CREATE USER "Agrihub" WITH PASSWORD 'postgres' CREATEDB;
CREATE DATABASE "Agrihub" OWNER "Agrihub" ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE "Agrihub" TO "Agrihub";
```

**OR** — open a PowerShell window **as Administrator** and run:
```powershell
cd C:\Users\laksh\GITHUB\AAA\backend
node setup-db.js <your-postgres-password>
```

> Your PostgreSQL 17 superuser password is whatever you set during installation.
> Find it in pgAdmin → right-click server → Properties → Connection.

---

## Step 2 — Start the Backend

```powershell
cd C:\Users\laksh\GITHUB\AAA\backend
npm start
```

**Expected output:**
```
✅ PostgreSQL connected
🔧 Running AgriHub database migration...
✅ Schema created successfully
🌱 Seeding AgriHub database...
✅ Seed data inserted

🌾 AgriHub API Server running on port 4000
   REST API:  http://localhost:4000/api
   WebSocket: ws://localhost:4000/ws
   Health:    http://localhost:4000/health
```

Verify it works:
```powershell
Invoke-WebRequest http://localhost:4000/health | Select-Object -ExpandProperty Content
```

---

## Step 3 — Start the Android App

**Using Android Emulator (AVD):**
```powershell
cd C:\Users\laksh\GITHUB\AAA\mobile
npm start
# Then press 'a' in the terminal to open Android emulator
```

**Using physical Android device:**
1. Enable Developer Mode + USB Debugging on your phone
2. Connect via USB
3. Find your PC's local IP: `ipconfig` → look for IPv4 (e.g., `192.168.1.105`)
4. Set the API URL: create `mobile/.env` with:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.105:4000
   ```
5. Run: `npm start` → press `a`

---

## What You'll See in the App

### Auth Flow
- Enter your **10-digit mobile number**
- The OTP will appear on screen (dev mode) — enter it
- Choose your role: Farmer / FPO / Buyer

### Home Dashboard
- **Live metrics** pulled from PostgreSQL (total farmers, listings, ponds)
- **Real-time price ticker** scrolls every 5 seconds via WebSocket
- **Platform cards** — tap any to go to that sub-app
- **Activity feed** — real database events, live

### All 5 Platform Apps
| App | What you can do |
|---|---|
| 🌿 AgriFlow | Browse live supply listings, send inquiries (written to DB), view buyer inquiries |
| 🐟 AquaOS | View pond status, water quality bars, log new readings (written to DB), advisory alerts |
| 🏠 FarmerConnect | Browse properties, filter by type (Apartment / Agri Land / PG), contact owner |
| 🚜 KisanConnect | Book equipment (written to DB), browse and apply to jobs |
| 🧠 Intelligence | Supply vs demand bar charts, live market prices (WS), district heatmap |

---

## Demo Login (pre-seeded data)

Any phone: **9000000001** through **9000000005**  
OTP shown on screen in dev mode

| Phone | Name | Role |
|---|---|---|
| 9000000001 | Raju Reddy | Farmer |
| 9000000002 | Krishnamurthy FPO | FPO |
| 9000000003 | Vikram Traders | Buyer |
| 9000000004 | Sudha Aqua Farm | Farmer (Aqua) |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `password authentication failed` | Run SQL above in pgAdmin as postgres superuser |
| `Network Error` in app | Backend not running, or wrong API URL for physical device |
| `Metro bundler: port in use` | `npx kill-port 8081` |
| Drawer doesn't open | Swipe from left edge, or tap ⚙️ on home screen |
| Emulator not launching | Open Android Studio → AVD Manager → launch a device first |
