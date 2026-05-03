# ⛅ Weather — Forecasting & Crop Advisory

> Hyperlocal weather forecasts with agricultural advisories and price watchlists.

---

## Overview

The Weather module provides farmers with hyperlocal weather forecasts, crop-specific advisories, and market price watchlists. It combines meteorological data with agricultural intelligence to provide actionable farming recommendations.

---

## Key Features

### Weather Forecast
- **Current Conditions** — Temperature, humidity, wind, rain chance
- **7-Day Forecast** — Daily outlook with agricultural relevance
- **District-Level** — Hyperlocal forecasts for specific districts
- **Rain Alerts** — Critical alerts for unexpected rainfall

### Crop Advisory
- **Weather-Based Advice** — What to do today based on forecast
- **Irrigation Guidance** — When to irrigate based on soil moisture + weather
- **Spray Windows** — Best times for pesticide/fertilizer application
- **Harvest Timing** — Optimal harvest windows avoiding weather risks

### Price Watchlist
- **Crop Tracking** — Monitor prices for specific crops and markets
- **Price Alerts** — Get notified when prices cross your target
- **Multi-Market** — Compare prices across different mandis
- **Trend Indicators** — Price direction (rising/falling/stable)

### Crop Health Impact
- **Weather Stress Analysis** — How current weather affects crops
- **Disease Risk** — Weather-correlated disease probability
- **Yield Impact** — Estimated yield effect from weather conditions

---

## Tabs

| Tab | Description |
|-----|-------------|
| Forecast | Current weather and 7-day outlook |
| Advisory | Crop-specific weather advisories |
| Watchlist | Price monitoring with alerts |
| Impact | Weather impact on crop health |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weather/forecast` | Get weather forecast |
| GET | `/weather/advisory` | Get crop advisories |
| GET | `/weather/districts` | List available districts |
| GET | `/weather/crop-health` | Crop health impact analysis |
| GET | `/weather/market-outlook` | Market outlook data |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/WeatherScreen.js` | Frontend screen component |
| `backend/src/routes/weather.js` | API route handlers |
| `backend/src/services/weather.js` | Weather data service |

---

## Sample Watchlist Crops

| Crop | Market | Alert Type |
|------|--------|-----------|
| Paddy (Sona Masoori) | Guntur | Price above target |
| Cotton (DCH-32) | Adilabad | Price below target |
| Tomato | Madanapalle | Price above target |
| Chilli (Teja) | Khammam | Price above target |
