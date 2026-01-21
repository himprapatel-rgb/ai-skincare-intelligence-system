
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
→ External APIs (Signals)  
→ OpenAI (Reasoning & Personalization)  
→ Database (ML Training Store)  
→ Frontend Output

**Golden Rule**
- APIs give **signals**
- OpenAI gives **decisions + explanations**
- Database stores **learning data**
- Your ML engine replaces APIs later

---

# 2. OpenAI API (Core Intelligence Layer)

## Purpose
OpenAI is used as the **reasoning engine**, not as a diagnostic tool.

### Responsibilities
- Generate AM/PM skincare routines
- Analyze product suitability per user
- Explain ingredient logic
- Detect conflicts in routines/products
- Adjust routines over time

### NOT used for
- Medical diagnosis
- Disease detection
- Facial recognition
- Raw image processing

---

## How OpenAI Is Used

### Inputs
```json
{
  "user_profile": {
    "skin_type": "dry-sensitive",
    "concerns": ["pigmentation", "dryness"],
    "climate": "cold_humid"
  },
  "skin_signals": {
    "acne_score": 12,
    "redness_score": 40,
    "dryness_score": 78
  },
  "context": "routine_generation"
}
```

### Outputs (STRICT JSON)
```json
{
  "routine_am": [...],
  "routine_pm": [...],
  "ingredients_to_use": [...],
  "ingredients_to_avoid": [...],
  "warnings": ["Patch test required"]
}
```

### Storage
- Save full JSON response
- Store routine version ID
- Link to analysis session

### Cost Control
- JSON-only responses
- Token cap
- Caching by profile hash

### Replacement Plan
- Later replaced by your **Routine Recommendation ML model**
- LLM retained only for explanation layer

---

# 3. Skin Analysis (Selfie) APIs – Signal Providers

## Purpose
Convert face image into **numeric skin signals**.

## Providers (MVP Options)

### Perfect Corp (YouCam)
- Acne score
- Wrinkle score
- Moisture level
- Redness

### Revieve
- Skin type classification
- Concern severity scoring

### Skinive
- Broad signal extraction
- Must avoid medical phrasing

---

## How Used

### Inputs
- User selfie (temporary)
- Analysis task config

### Outputs (Signals Only)
```json
{
  "acne_score": 30,
  "redness_score": 22,
  "moisture_score": 45
}
```

### Storage
- Store signals only
- DO NOT store raw image (default)
- Optional image storage only with consent

### Replacement Plan
- Phase 3: internal CV model

---

# 4. Product Scan & Shelf APIs

## 4.1 Barcode Scanning

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

## 4.2 OCR (Ingredient Reading)

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

## 4.3 Ingredient Intelligence

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

# 5. Product Suitability Analysis (OpenAI)

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

# 6. Geo Store Locator (FREE STACK)

## 6.1 OpenStreetMap + Overpass API

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

## 6.2 Nominatim

### Purpose
Geocoding & reverse-geocoding

### Example
Search: "pharmacy near Dublin"

---

## Storage
- Cache store results
- Save user interaction signals

---

# 7. Weather & UV APIs

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

# 8. Notifications & Engagement

## Firebase Cloud Messaging

### Usage
- Routine reminders
- Check-in prompts

---

# 9. Payments

## Stripe

### Usage
- Subscription plans
- Premium analysis access

---

# 10. Analytics & Monitoring

- Sentry – error tracking
- PostHog – product analytics
- Token usage tracking

---

# 11. Database Design (ML Ready)

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

# 12. Security & Compliance

- No medical diagnosis
- Consent for images
- GDPR-compliant storage
- API key protection

---

# 13. Roadmap Summary

### MVP
- OpenAI + Product Scan + Free Geo Locator

### V1
- Selfie analysis API
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

