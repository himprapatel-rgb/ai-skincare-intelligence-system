# Backend API Reference

**Base URL**: `/api/v1`
**Auth**: JWT Bearer token (`Authorization: Bearer <token>`)
**Format**: JSON request/response

---

## Authentication — `/api/v1/auth`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | No | Register with email/password |
| POST | `/auth/login` | No | Login, returns JWT |
| POST | `/auth/verify-email` | No | Confirm email verification token |
| POST | `/auth/send-verification` | No | Resend verification email |
| POST | `/auth/password-reset` | No | Initiate password reset |
| POST | `/auth/refresh-token` | Yes | Refresh JWT |
| POST | `/auth/google-oauth` | No | Google OAuth callback |
| GET | `/auth/me` | Yes | Get current user |

---

## Face Scan — `/api/v1/scan`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/scan/init` | Optional | Create scan session |
| GET | `/scan/actions` | No | List analysis signals |
| POST | `/scan/{id}/upload` | Optional | Upload face image (JPEG/PNG/WebP, ≤5MB) |
| GET | `/scan/{id}/status` | Optional | Get scan processing status |
| GET | `/scan/{id}/result` | Optional | Get completed analysis result |
| GET | `/scan/history` | Yes | List user's scan history |
| DELETE | `/scan/{id}` | Yes | Delete scan |

### Scan Upload Validation
- Types: image/jpeg, image/png, image/webp
- Max size: 5MB
- Max dimension: 4096px
- Magic byte verification

### Analysis Response Schema
```json
{
  "summary": {
    "overall_score": 78,
    "scores": {
      "acne": 85, "redness": 70, "pigmentation": 65,
      "dehydration": 72, "sensitivity": 80, "wrinkles": 90,
      "pores": 75, "dark_circles": 68, "texture": 82, "oiliness": 77
    },
    "concerns": ["mild acne", "moderate pigmentation"]
  },
  "skin_type": "combination",
  "fitzpatrick_scale": 3,
  "confidence_score": 0.92,
  "concerns_detail": [
    {
      "concern_type": "acne",
      "severity": "mild",
      "confidence": 0.88,
      "affected_areas": ["forehead", "chin"]
    }
  ],
  "zone_analysis": [
    {
      "zone": "forehead",
      "concerns": [
        {"type": "acne", "severity": "mild", "confidence": 0.85}
      ]
    }
  ],
  "recommendations": ["Use salicylic acid cleanser", "Add niacinamide serum"]
}
```

---

## AI Intelligence — `/api/v1/ai`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/ai/recommendations` | Yes | AI-ranked product recommendations |
| POST | `/ai/routine` | Yes | Generate personalized AM/PM routine |
| POST | `/ai/ingredients` | Yes | Analyze ingredient list safety |
| GET | `/ai/notifications/smart` | Yes | AI-generated notifications |
| GET | `/ai/content/curated` | Yes | Curated content for user |
| POST | `/ai/predict` | Yes | Predict skin future state |
| POST | `/ai/compare` | Yes | Before/after scan comparison |
| POST | `/ai/trends` | Yes | Seasonal skin trends |

---

## Products — `/api/v1/products`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/products` | Yes | Search products |
| GET | `/products/{barcode}` | Yes | Lookup by barcode |
| GET | `/products/{id}/recommendations` | Yes | Similar products |
| POST | `/products/analyze` | Yes | Ingredient safety analysis |
| GET | `/products/{id}/reviews` | Yes | Product reviews (paginated) |
| POST | `/products/{id}/reviews` | Yes | Submit review |
| POST | `/products/scan-barcode` | Yes | Barcode scan identification |
| POST | `/products/identify-from-image` | Yes | AI image identification |

---

## Product Catalog — `/api/v1/catalog`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/catalog/barcode/{barcode}` | No | Barcode lookup |
| GET | `/catalog/lookup` | No | Fuzzy name/brand lookup |
| GET | `/catalog/search` | No | Full-text search |
| GET | `/catalog/product/{id}` | No | Product details |
| GET | `/catalog/stats` | No | Catalog statistics |
| GET | `/catalog/categories` | No | List categories |
| GET | `/catalog/brands` | No | List brands |
| GET | `/catalog/ingredients` | No | List ingredients |
| GET | `/catalog/products/safe-for/{skin_type}` | No | Skin-type safe products |
| GET | `/catalog/products/pregnancy-safe` | No | Pregnancy-safe products |
| GET | `/catalog/products/vegan` | No | Vegan products |
| POST | `/catalog/products` | Admin | Add product |
| PUT | `/catalog/product/{id}` | Admin | Update product |
| DELETE | `/catalog/product/{id}` | Admin | Delete product |
| POST | `/catalog/product/{id}/verify` | Admin | Verify product |
| GET | `/catalog/duplicates` | Admin | Find duplicates |
| GET | `/catalog/data-quality` | Admin | Data quality report |
| GET | `/catalog/export` | Admin | Export catalog |
| GET | `/catalog/products/by-ingredient/{name}` | No | Products by ingredient |
| GET | `/catalog/products/fragrance-free` | No | Fragrance-free products |

---

## User Profile — `/api/v1/profile`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/profile/upload-photo` | Yes | Upload profile photo |
| POST | `/profile/baseline` | Yes | Create baseline profile |
| GET | `/profile` | Yes | Get profile |
| PATCH | `/profile` | Yes | Update profile |
| GET | `/profile/export` | Yes | GDPR data export |
| DELETE | `/profile` | Yes | Delete account |

---

## Shelf — `/api/v1/shelf`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/shelf` | Yes | List shelf products (filter: status, category, routine) |
| POST | `/shelf` | Yes | Add product to shelf |
| PATCH | `/shelf/{id}` | Yes | Update shelf product |
| DELETE | `/shelf/{id}` | Yes | Remove from shelf |
| GET | `/shelf/routine/{type}` | Yes | Get AM/PM routine products |

---

## Favorites — `/api/v1/favorites`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/favorites` | Yes | List favorites |
| POST | `/favorites` | Yes | Add favorite |
| DELETE | `/favorites/{id}` | Yes | Remove by ID |
| DELETE | `/favorites/product/{id}` | Yes | Remove by product ID |
| GET | `/favorites/check/{id}` | Yes | Check if favorited |

---

## Goals — `/api/v1/goals`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/goals/types` | Yes | Available goal types |
| GET | `/goals` | Yes | List user goals |
| POST | `/goals` | Yes | Create goal |
| GET | `/goals/{id}` | Yes | Get goal detail |
| PATCH | `/goals/{id}` | Yes | Update goal |
| DELETE | `/goals/{id}` | Yes | Delete goal |
| POST | `/goals/{id}/progress` | Yes | Log progress |

---

## Notifications — `/api/v1/notifications`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/notifications` | Yes | List notifications (filter: type, unread) |
| POST | `/notifications` | Yes | Create notification |
| PATCH | `/notifications/{id}/read` | Yes | Mark as read |
| PATCH | `/notifications/read-all` | Yes | Mark all as read |
| DELETE | `/notifications/{id}` | Yes | Delete notification |
| GET | `/notifications/settings` | Yes | Get settings |
| PATCH | `/notifications/settings` | Yes | Update settings |
| GET | `/notifications/check-reminders` | Yes | Check routine reminders |

---

## Digital Twin — `/api/v1/digital-twin`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/digital-twin/snapshot` | Yes | Create snapshot from scan |
| GET | `/digital-twin/query` | Yes | Query snapshots (date range) |
| GET | `/digital-twin/timeline` | Yes | Skin evolution timeline |
| POST | `/digital-twin/simulate` | Yes | Scenario simulation |

---

## Content — `/api/v1/content` (Public)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/content/blogs` | No | List published blogs |
| GET | `/content/blogs/{id}` | No | Get blog |
| GET | `/content/videos` | No | List published videos |
| GET | `/content/news` | No | List published news |

---

## Consent — `/api/v1/consent`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/consent/policies/current` | No | Active policy versions |
| POST | `/consent/accept` | Yes | Accept policies |
| GET | `/consent/status` | Yes | Consent status |
| DELETE | `/consent/withdraw` | Yes | Withdraw consent |

---

## Admin — `/api/v1/admin` (Admin Only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/summary` | User/scan/product counts |
| GET | `/admin/health` | Admin health check |
| GET | `/admin/users` | List users (paginated) |
| PATCH | `/admin/users/{id}` | Update user (active, admin, verified) |
| GET | `/admin/products` | List products |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/{id}` | Update product |
| DELETE | `/admin/products/{id}` | Delete product |
| POST | `/admin/upload-image` | Upload image |
| POST | `/admin/seed-database` | Seed test data |
| POST | `/admin/populate-ingredients` | Bulk ingredient import |
| POST | `/admin/upload-scin-data` | SCIN data upload |
| POST | `/admin/import-scin` | SCIN data import |
| GET/POST/PATCH/DELETE | `/admin/blogs/*` | Blog CRUD |
| GET/POST/PATCH/DELETE | `/admin/videos/*` | Video CRUD |
| GET/POST/PATCH/DELETE | `/admin/news/*` | News CRUD |

---

## Health Checks

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Root health (status=ok) |
| GET | `/api/health` | Detailed health (both DBs + latency) |
| GET | `/api/health/ready` | K8s readiness probe |
| GET | `/api/health/live` | K8s liveness probe |

---

## Error Response Format

```json
{
  "detail": "Resource not found",
  "status_code": 404
}
```

## Rate Limiting
- Global: 10 requests per 60 seconds per IP
- Scan upload: image magic bytes + dimension validation
- Login: brute-force protection (rate limited per email)
