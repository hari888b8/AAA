# 🔬 CropDoctor — AI Disease Detection

> Camera-based crop disease identification with treatment advice and outbreak tracking.

---

## Overview

CropDoctor is an AI-powered crop disease detection system within AgriHub. Farmers can scan their crops using a camera to get instant disease identification, treatment recommendations, and access historical outbreak data for their region.

---

## Key Features

### Disease Scanning
- **Camera Capture** — Take photos of affected crop parts
- **AI Detection** — Instant disease identification using image recognition
- **Confidence Scoring** — Reliability percentage for each diagnosis
- **Multiple Detections** — Identify multiple issues in a single scan

### Treatment Recommendations
- **Chemical Treatment** — Recommended pesticides/fungicides with dosage
- **Organic Alternatives** — Natural/organic treatment options
- **Prevention Tips** — How to prevent future occurrences
- **Application Instructions** — When and how to apply treatments

### History & Tracking
- **Scan History** — Review all past scans and results
- **Crop-wise Filter** — Filter history by crop type
- **Recovery Tracking** — Monitor if treatments are working

### Outbreak Alerts
- **Regional Outbreaks** — View active disease outbreaks nearby
- **Early Warnings** — Get alerts for emerging threats
- **Community Reports** — See what others are reporting
- **Seasonal Patterns** — Historical outbreak data

### Crop Guide
- **Disease Encyclopedia** — Browse common diseases by crop
- **Symptom Identification** — Visual guide for symptom recognition
- **Crop Calendar** — When diseases are most likely to appear

---

## Tabs

| Tab | Description |
|-----|-------------|
| Scan | Camera-based disease detection |
| History | Past scan results and tracking |
| Outbreaks | Regional outbreak alerts and maps |
| Guide | Disease encyclopedia and crop guides |

---

## Supported Crops

Rice, Cotton, Tomato, Chilli, Groundnut, Maize, Sugarcane, and many more — the system continuously learns new crops and diseases.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/cropdoctor/detect` | Submit image for disease detection |
| GET | `/cropdoctor/history` | Get scan history |
| GET | `/cropdoctor/crops` | List supported crops |
| GET | `/cropdoctor/outbreaks` | Get regional outbreaks |
| GET | `/cropdoctor/guide/:crop` | Get disease guide for a crop |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/screens/CropDoctorScreen.js` | Frontend screen component |
| `backend/src/routes/cropdoctor.js` | API route handlers |

---

## How It Works

1. **Capture** — Farmer takes a photo of the affected plant
2. **Analyze** — AI model processes the image for disease signatures
3. **Diagnose** — Returns disease name, severity, and confidence score
4. **Recommend** — Provides treatment options (chemical + organic)
5. **Track** — Logs the detection for future reference and analytics
