# 🛰️ Satellite — Field Monitoring

> Satellite-based crop health monitoring, field mapping, and soil analysis.

---

## Overview

The Satellite module provides remote sensing capabilities for farm monitoring. Using satellite imagery, it tracks field health through vegetation indices (NDVI), detects anomalies, monitors soil conditions, and provides early warning alerts — all without requiring physical field visits.

---

## Key Features

### Field Health Monitoring
- **NDVI Mapping** — Vegetation health index visualization
- **Growth Tracking** — Monitor crop growth over time
- **Anomaly Detection** — Identify stressed or damaged areas
- **Field Boundaries** — GPS-based field mapping

### Alert System
- **Stress Alerts** — Notification when vegetation stress is detected
- **Water Stress** — Identify areas needing irrigation
- **Pest/Disease Risk** — Correlate satellite data with pest outbreaks
- **Weather Damage** — Post-event damage assessment

### Soil Health
- **Soil Moisture** — Satellite-derived soil moisture estimates
- **Organic Carbon** — Soil health indicators
- **Erosion Risk** — Identify erosion-prone areas
- **Nutrient Maps** — Soil nutrient distribution

---

## Tabs

| Tab | Description |
|-----|-------------|
| Field Health | NDVI and vegetation monitoring |
| Alerts | Active alerts and notifications |
| Soil Health | Soil condition analysis |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/satellite/fields` | List monitored fields |
| POST | `/satellite/fields` | Register a field for monitoring |
| GET | `/satellite/fields/:id/health` | Get field health data |
| GET | `/satellite/alerts` | Get active alerts |
| GET | `/satellite/soil/:fieldId` | Get soil health data |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/SatelliteScreen.js` | Frontend screen component |
| `backend/src/routes/satellite.js` | API route handlers |

---

## Technology

- Sentinel-2 satellite imagery (10m resolution)
- NDVI, NDWI, and other vegetation indices
- Time-series analysis for growth tracking
- Machine learning for anomaly detection
