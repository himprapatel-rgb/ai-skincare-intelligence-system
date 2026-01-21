# AI Skincare Intelligence System
## Master External API Integration Document
### (Detailed – Implementation Ready)

This document is the **single source of truth** for **all external APIs** used in the AI Skincare Intelligence System.
It explains **what each API does, why it is needed, how it is used, inputs, outputs, storage strategy, costs, and future ML replacement plans**.

This document fully aligns with:
- SRS V5.3
- Product Backlog & Epics
- API-first MVP strategy
- ML-first data collection strategy
- Privacy & safety requirements

---

# 1. Architecture Overview

User → Mobile/Web App  
→ Backend (FastAPI)  
→ OpenAI Vision (Signals + Reasoning)  
→ Database (ML Training Store)  
→ Frontend Output

**Golden Rule**
- APIs give **signals**
- OpenAI gives **decisions + explanations**
- Database stores **learning data**
- Your ML engine replaces APIs later

---

# 2. OpenAI API (Core Intelligence + Vision Layer)

## Purpose
OpenAI is used as the **reasoning engine** and **vision-based signal extractor**, not as a diagnostic tool.

### Responsibilities
- Generate AM/PM skincare routines
- Analyze product suitability per user
- Explain ingredient logic
- Detect conflicts in routines/products
- Adjust routines over time
- Extract **numeric skin signals** from selfies

### NOT used for
- Medical diagnosis
- Disease detection
- Facial recognition

---

## How OpenAI Vision Is Used (Selfie Analysis)

### Inputs
- User selfie (temporary or stored with consent)
- Analysis task config

### Outputs (STRICT JSON)
```json
{
  "summary": {
    "overall_score": 72,
    "scores": {
      "acne": 30,
      "redness": 22,
      "pigmentation": 45,
      "dehydration": 61,
      "sensitivity": 38,
      "wrinkles": 20,
      "pores": 33,
      "dark_circles": 28,
      "texture": 40,
      "oiliness": 25
    },
    "concerns": ["dehydration", "pigmentation", "redness"]
  },
  "skin_type": "combination",
  "fitzpatrick_scale": 3,
  "confidence_score": 0.82,
  "concerns_detail": [
    {
      "concern_type": "pigmentation",
      "severity": "moderate",
      "confidence": 0.84,
      "affected_areas": ["cheeks", "forehead"]
    }
  ],
  "recommendations": [
    "Use a gentle cleanser twice daily",
    "Apply broad-spectrum SPF 30+ every morning"
  ],
  "notes": "Signals are cosmetic estimates only."
}
```

### Storage
- Store full JSON response
- Store model version + inference time
- Link to analysis session

### Cost Control
- JSON-only responses
- Token cap
- Caching by profile hash

### Replacement Plan
- Later replaced by your **Internal CV Model**
- OpenAI retained only for explanation layer

---

# 3. Product Scan & Shelf APIs

## 3.1 Barcode Scanning
### Purpose
Identify product uniquely

### Tools
- ZXing
- ML Kit
- iOS AVFoundation

### Output
```json
{
  "barcode": "3337872411991"
}
```

---

## 3.2 OCR (Ingredient Reading)

### Purpose
Extract ingredient list from product photo

### APIs
- Google Vision OCR
- Azure OCR
- AWS Textract
- Tesseract (open source)

### Output
```json
{
  "ingredients_raw": "Aqua, Glycerin, Niacinamide..."
}
```

---

## 3.3 Ingredient Intelligence

### Data Source
- EU CosIng Database

### Stored Fields
- INCI name
- Function
- Restrictions
- Irritation flags

### Usage
- Rule engine + OpenAI explanation

---

# 4. Product Suitability Analysis (OpenAI)

### Input
- User profile
- Product ingredients
- Current routine

### Output
```json
{
  "is_suitable": true,
  "score": 8.3,
  "reasons": ["Supports barrier repair"],
  "conflicts": []
}
```

### Stored for ML
- Product → user → outcome mapping

---

# 5. Geo Store Locator (FREE STACK)

## 5.1 OpenStreetMap + Overpass API

### Purpose
Find nearby stores

### Query Example
```xml
node["amenity"="pharmacy"](around:2000, LAT, LNG);
```

### Categories
- Pharmacy
- Cosmetics
- Supermarket

---

## 5.2 Nominatim

### Purpose
Geocoding & reverse-geocoding

### Example
Search: "pharmacy near Dublin"

---

## Storage
- Cache store results
- Save user interaction signals

---

# 6. Weather & UV APIs

## Open-Meteo

### Purpose
Climate-aware routines

### Data Used
- Temperature
- Humidity
- UV index

### Output Impact
- Sunscreen advice
- Barrier repair focus

---

# 7. Notifications & Engagement

## Firebase Cloud Messaging

### Usage
- Routine reminders
- Check-in prompts

---

# 8. Payments

## Stripe

### Usage
- Subscription plans
- Premium analysis access

---

# 9. Analytics & Monitoring

- Sentry – error tracking
- PostHog – product analytics
- Token usage tracking

---

# 10. Database Design (ML Ready)

## Core Tables
- users
- profiles
- skin_analyses
- routines
- products
- shelf
- product_ratings
- checkins

## ML Labels
- Weekly improvement scores
- Adherence level

---

# 11. Security & Compliance

- No medical diagnosis
- Consent for images
- GDPR-compliant storage
- API key protection

---

# 12. Roadmap Summary

### MVP
- OpenAI Vision + Product Scan + Free Geo Locator

### V1
- Weather personalization

### V2
- Internal ML engine
- Reduced external API reliance

---

# FINAL NOTE

This architecture:
- Is scalable
- Is legally safe
- Is ML-first
- Is investor-ready
