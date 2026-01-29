# Product Scanner & My Shelf Features

**Version:** 1.0  
**Last Updated:** 2026-01-29  
**Status:** ✅ Complete

---

## Overview

The Product Scanner and My Shelf features allow users to:
1. Scan product barcodes or take photos to identify skincare products
2. Get AI-powered ingredient analysis with safety ratings
3. Track products they own with ratings, expiry dates, and notes
4. Build their skincare routine from their shelf

---

## Product Scanner

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Barcode Scanning** | Scan EAN-13, EAN-8, UPC-A, UPC-E, QR codes | ✅ Complete |
| **Photo Identification** | AI identifies products from photos using GPT-4 Vision | ✅ Complete |
| **Ingredient Extraction** | Extract ingredients with percentages (e.g., "Niacinamide 10%") | ✅ Complete |
| **Safety Analysis** | Flag harmful ingredients with severity levels | ✅ Complete |
| **Clean Product Images** | Fetch professional images from Open Beauty Facts | ✅ Complete |
| **Scan History** | Remember last 5 scanned products (localStorage) | ✅ Complete |
| **Confidence Score** | Visual progress bar showing AI confidence | ✅ Complete |
| **Processing Steps** | Animated progress indicators during scan | ✅ Complete |

### User Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Choose Mode    │────►│ Scan/Upload     │────►│ AI Processing   │
│ Barcode / Photo │     │ Image           │     │ (GPT-4 Vision)  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  View on Shelf  │◄────│ Add to Shelf    │◄────│ View Results    │
│                 │     │                 │     │ + Safety Report │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/products/identify-from-image` | Identify product from photo |
| POST | `/api/v1/products/scan-barcode` | Look up product by barcode |
| GET | `/api/v1/products/search` | Search product database |

### Response Format (identify-from-image)

```json
{
  "found": true,
  "product_name": "Niacinamide 10% + Zinc 1%",
  "brand": "The Ordinary",
  "category": "serum",
  "key_ingredients": [
    {"name": "Niacinamide", "percentage": "10%"},
    {"name": "Zinc PCA", "percentage": "1%"}
  ],
  "ingredients": ["Water", "Niacinamide", "Pentylene Glycol", ...],
  "safety_report": {
    "total_flagged": 1,
    "high_severity_count": 0,
    "moderate_severity_count": 1,
    "low_severity_count": 0,
    "safety_score": 85,
    "flagged_ingredients": [...],
    "recommendations": [...],
    "is_pregnancy_safe": true,
    "is_sensitive_skin_safe": true
  },
  "confidence": 0.92,
  "image_url": "https://images.openbeautyfacts.org/...",
  "image_source": "Open Beauty Facts"
}
```

---

## Ingredient Safety System

### Database Size

- **50+ harmful ingredients** with detailed safety profiles
- Categorized by severity (HIGH, MODERATE, LOW)
- Includes aliases for accurate matching

### Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| **HIGH** | 🔴 Red | Avoid - significant health concerns |
| **MODERATE** | 🟡 Yellow | Use with caution |
| **LOW** | 🟢 Green | Generally safe, may cause issues for some |

### Concern Categories

- `IRRITANT` - Can irritate skin
- `ALLERGEN` - Common allergen
- `CARCINOGEN` - Potential cancer links
- `ENDOCRINE_DISRUPTOR` - Hormone disruption
- `ENVIRONMENTAL_TOXIN` - Environmental harm
- `PREGNANCY_UNSAFE` - Avoid during pregnancy
- `SENSITIZER` - Can cause sensitization over time
- `COMEDOGENIC` - Can clog pores
- `DRYING` - Can dry out skin

### Example Flagged Ingredients

| Ingredient | Severity | Categories |
|------------|----------|------------|
| Formaldehyde | HIGH | Carcinogen, Allergen |
| Parabens | MODERATE | Endocrine Disruptor |
| Fragrance/Parfum | MODERATE | Allergen, Sensitizer |
| Retinol | MODERATE | Pregnancy Unsafe |
| Coconut Oil | LOW | Comedogenic |

---

## My Shelf

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Product Tracking** | Track all products user owns | ✅ Complete |
| **Status Management** | Using / Wishlist / Discontinued | ✅ Complete |
| **Star Rating** | Interactive 1-5 star rating | ✅ Complete |
| **Expiry Tracking** | Track expiration with visual warnings | ✅ Complete |
| **Would Repurchase** | Toggle to mark repurchase intention | ✅ Complete |
| **Notes** | Add personal notes to products | ✅ Complete |
| **Search & Filter** | Search by name/brand, filter by status | ✅ Complete |
| **Product Images** | Clean images or placeholder | ✅ Complete |

### Product Card Display

Each product card shows:
- Product image (from API or placeholder)
- Name and brand
- Category
- Interactive star rating (clickable)
- "Would Repurchase" toggle
- Expiry badge (normal / warning / expired)
- Status dropdown
- Remove button

### Expiry Badge States

| State | Condition | Display |
|-------|-----------|---------|
| Normal | > 30 days to expiry | Gray badge with date |
| Warning | < 30 days to expiry | ⏰ Yellow badge |
| Expired | Past expiry date | ⚠️ Red badge |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shelf` | Get user's shelf products |
| POST | `/api/v1/shelf` | Add product to shelf |
| PATCH | `/api/v1/shelf/{id}` | Update product (rating, status, etc.) |
| DELETE | `/api/v1/shelf/{id}` | Remove from shelf |

### Shelf Product Fields

```typescript
interface ShelfProduct {
  id: string;
  product_name: string;
  product_brand?: string;
  product_category?: string;
  product_image?: string;
  status: 'active' | 'wishlist' | 'discontinued';
  rating?: number;           // 1-5 stars
  notes?: string;
  expiry_date?: string;      // ISO date
  purchase_date?: string;
  purchase_price?: number;
  would_repurchase?: boolean;
  times_repurchased: number;
  created_at: string;
}
```

---

## Scan History

### Storage

- Stored in browser's **localStorage**
- Key: `pellicura_scan_history`
- Maximum: **5 items** (FIFO)

### History Item Structure

```typescript
interface ScanHistoryItem {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  category?: string;
  scannedAt: string;    // ISO timestamp
  source: 'barcode' | 'image';
}
```

### UI Display

- Shows on Product Scanner page when no scan in progress
- Clickable cards that navigate to product details
- Badge indicates scan source (Barcode/Photo)

---

## Technical Implementation

### Frontend Files

| File | Purpose |
|------|---------|
| `ProductScannerPage.tsx` | Main scanner component |
| `ProductScannerPage.css` | Scanner styling |
| `MyShelfPage.tsx` | Shelf management |
| `MyShelfPage.css` | Shelf styling |
| `ShelfContext.tsx` | Global shelf state |

### Backend Files

| File | Purpose |
|------|---------|
| `routers/products.py` | Product scanner API |
| `routers/shelf.py` | Shelf management API |
| `services/ingredient_safety.py` | Harmful ingredients database |

### External APIs Used

| API | Purpose |
|-----|---------|
| OpenAI GPT-4 Vision | Product identification from photos |
| Open Beauty Facts | Product images and data |
| Open Food Facts | Fallback product data |

---

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Required for AI product identification |

### Setting OpenAI Key (Fly.io)

```bash
fly secrets set OPENAI_API_KEY="sk-..." -a pellicura-api-staging
fly secrets set OPENAI_API_KEY="sk-..." -a pellicura-api
```

---

## Business Model Note

**This platform does NOT sell products.** It is a recommendation and tracking platform:

- ✅ Recommends products from any brand
- ✅ Tracks products users own
- ✅ Analyzes ingredient safety
- ❌ No shopping cart
- ❌ No payments
- ❌ No inventory

---

*Document maintained by AI Skincare Intelligence System Team*
