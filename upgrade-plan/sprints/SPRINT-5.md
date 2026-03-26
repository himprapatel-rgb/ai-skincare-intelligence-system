# Sprint 5 — Clinical Intelligence & Admin Analytics

**Weeks:** 9-10
**Dependencies:** Sprint 4 (all pages redesigned, WebSocket, search)
**Goal:** Build clinical-grade features that differentiate Pellicura as a medical platform.

---

## Track A: Clinical Database

### A1. Clinical Tables Migration
- `skin_alerts` table (alert_type, severity, concern, message, recommendation, is_dismissed)
- `derm_reports` table (scan_ids, report_data, share_token, share_expires_at)
- `ingredient_interactions` table (ingredient_a, ingredient_b, interaction_type, severity, description)
- **File**: `backend/alembic/versions/007_clinical_tables.py`

### A2. Clinical Models
- SQLAlchemy models for all 3 tables
- **File**: `backend/app/models/clinical.py`

### A3. Seed Ingredient Interactions
- Populate `ingredient_interactions` with known interactions:
  - Retinol + AHA/BHA = increased sensitivity (caution)
  - Vitamin C + Niacinamide = safe (synergy)
  - Benzoyl Peroxide + Retinol = deactivation (conflict)
  - AHA + BHA = over-exfoliation risk (caution)
  - Vitamin C + SPF = enhanced protection (synergy)
  - ~50 common interactions
- **File**: `backend/alembic/versions/008_seed_interactions.py`

---

## Track B: Clinical Intelligence Service

### B1. Clinical Insights Service
- **File**: `backend/app/services/clinical_insights_service.py`

```python
class ClinicalInsightsService:
    async def generate_derm_report(user_id, scan_ids, db) -> dict
    async def analyze_trends(user_id, days, db) -> TrendAnalysis
    async def check_skin_alerts(user_id, db) -> List[SkinAlert]
    async def check_ingredient_interactions(ingredients, user_profile, db) -> List[Warning]
    async def correlate_environmental(user_id, db) -> CorrelationReport
    async def longitudinal_analysis(user_id, db) -> LongitudinalReport
    async def comparative_benchmark(user_id, db) -> BenchmarkResult
```

### B2. Derm Report Generator
- Gather: scan results, zone analysis, concern history, product shelf, ingredient warnings
- Format as clinical-grade report sections:
  1. Patient skin profile summary
  2. AI analysis with confidence scores
  3. Concern severity timeline (progression over scans)
  4. Zone-by-zone heatmap summary
  5. Product ingredient interaction warnings
  6. Environmental factor correlations
  7. Recommended follow-up areas
- Generate shareable link with expiring token
- **Integration**: jsPDF on frontend for PDF rendering, OR backend PDF generation

### B3. Skin Alert Monitor
- Background task (arq): runs nightly for users with 3+ scans
- Compares last 3 scans for trend changes
- Alert types:
  - `trend_worsening` — concern severity increasing over time
  - `derm_referral` — severity reaches "severe" threshold
  - `ingredient_warning` — new shelf product has concerning ingredient
  - `uv_alert` — high UV at user's location (if geo available)
- Creates `skin_alerts` records
- Sends WebSocket + push notification
- **File**: `backend/app/tasks/skin_monitor.py`

### B4. Ingredient Interaction Checker
- Input: product ingredient list + user profile (allergies, medications, pregnancy_status)
- Checks against: `ingredient_interactions` table + user allergens + pregnancy-unsafe list
- Returns: conflicts, warnings, synergies, personalized flags
- **Integrated into**: `POST /clinical/ingredient-check`

### B5. Longitudinal Analysis
- AI analyzes user's full scan history (up to 20 scans)
- Detects: seasonal patterns, product correlations, routine impact
- Output: narrative + data points for charting
- **Endpoint**: `POST /clinical/longitudinal-analysis`

### B6. Comparative Benchmarking
- Anonymized aggregate queries: "Your hydration is top 30% for age/skin type"
- Opt-in only (check user profile `allow_data_analysis` flag)
- Uses materialized view for aggregate stats
- **Endpoint**: `GET /clinical/benchmark`

---

## Track C: Clinical Router

### C1. Create Clinical Router
- **File**: `backend/app/routers/clinical.py`

```
GET  /clinical/report/{scan_id}        — generate derm report
POST /clinical/share-report            — create shareable link (token, 7-day expiry)
GET  /clinical/trends                  — skin health trends (30/60/90 days)
GET  /clinical/alerts                  — active alerts for user
POST /clinical/alerts/{id}/dismiss     — dismiss alert
GET  /clinical/correlations            — environmental factor correlations
POST /clinical/ingredient-check        — full ingredient safety check
GET  /clinical/benchmark               — comparative benchmarking (opt-in)
POST /clinical/longitudinal-analysis   — AI analysis across scan history
```

### C2. Clinical Schemas
- `DermReportResponse`, `TrendAnalysis`, `SkinAlertResponse`, `IngredientCheckRequest/Response`, `BenchmarkResponse`, `LongitudinalReport`
- **File**: `backend/app/schemas/clinical_schemas.py`

### C3. Register Router
- **File**: `backend/app/main.py`

---

## Track D: Clinical Dashboard Frontend

### D1. ClinicalDashboardPage
- Route: `/clinical`
- Sections:
  1. **Skin Health Score Trend** — Recharts line chart (30/60/90 day selector)
  2. **Active Alerts** — warning cards with dismiss button
  3. **Environmental Correlations** — dual-axis chart (UV/humidity vs skin score)
  4. **Product Effectiveness** — timeline showing score changes after product starts
  5. **Generate Report** button → triggers derm report PDF
- **Files**: `frontend/src/pages/ClinicalDashboardPage.tsx`, `ClinicalDashboardPage.module.css`

### D2. Alert Components
- `SkinAlertCard.tsx` — shows alert with severity badge, recommendation, dismiss
- `AlertBanner.tsx` — prominent banner for critical alerts (derm referral)
- **Files**: `frontend/src/components/clinical/SkinAlertCard.tsx`, `AlertBanner.tsx`

### D3. Derm Report Preview
- In-app preview of report before PDF export
- Share button → generates link → copy to clipboard
- **Files**: `frontend/src/components/clinical/DermReportPreview.tsx`

### D4. Ingredient Interaction Display
- Show on ProductDetailsPage: warnings, conflicts, synergies
- Personalized: "⚠ Contains fragrance — you're allergic"
- **File**: `frontend/src/pages/ProductDetailsPage.tsx` (add section)

### D5. Register Clinical Route
- Add `/clinical` to App.tsx (lazy loaded, auth required)
- Add to navigation (MePage quick links, Dashboard widget)
- **File**: `frontend/src/App.tsx`

---

## Track E: Multi-Scan Analysis

### E1. Multi-angle Capture Flow
- ScanPage upgrade: guided 3-step capture (front → left → right)
- Face rotation guide overlay
- Link 3 images to one scan session
- Backend: analyze each angle, merge results
- **Files**: `frontend/src/pages/ScanPage.tsx`, `backend/app/routers/scan.py`

### E2. Multi-scan Endpoint
- `POST /scan/{id}/analyze-multi` — process 3 images, combine zone analysis
- Merge: forehead from front, left cheek from left profile, right cheek from right
- **File**: `backend/app/routers/scan.py`

---

## Track F: Admin Analytics

### F1. Analytics Router
- `GET /admin/analytics/overview` — DAU, MAU, total scans, AI cost
- `GET /admin/analytics/scans` — scan volume, success rate, processing time
- `GET /admin/analytics/ai-usage` — token consumption, cost per endpoint
- `GET /admin/analytics/users` — registration rate, retention, profile completion
- `GET /admin/analytics/products` — most searched, shelved, reviewed
- `GET /admin/analytics/clinical` — alert frequency, concern distribution
- **File**: `backend/app/routers/admin.py`

### F2. AdminAnalyticsPage
- Route: `/admin/analytics`
- KPI cards: DAU, MAU, total scans, monthly AI cost
- Charts: user growth (line), scan volume (bar), AI cost (area)
- Tables: top products, top concerns, common skin types
- Date range filter
- **Files**: `frontend/src/pages/AdminAnalyticsPage.tsx`, `AdminAnalyticsPage.module.css`

### F3. Register Admin Analytics Route
- **File**: `frontend/src/App.tsx`

---

## Track G: Admin Page Redesigns

### G1. AdminDashboardPage
- KPI cards with trend arrows
- Quick links to all admin sections
- System health status
- **File**: `frontend/src/pages/AdminDashboardPage.tsx`

### G2. AdminUsersPage
- Data table: search, sort, filter, pagination
- User detail modal with actions (activate, deactivate, set admin)
- **File**: `frontend/src/pages/AdminUsersPage.tsx`

### G3. AdminProductsPage
- Data table with bulk import/export
- Ingredient management
- **File**: `frontend/src/pages/AdminProductsPage.tsx`

### G4. AdminBlogsPage / VideosPage / NewsPage
- Basic WYSIWYG improvements
- Draft/publish toggle
- **Files**: `frontend/src/pages/AdminBlogsPage.tsx`, `AdminVideosPage.tsx`, `AdminNewsPage.tsx`

---

## Verification Checklist

```bash
cd backend && python -m pytest tests/ -x -q
cd frontend && npm run build
```

- [ ] Clinical: derm report generates with all sections
- [ ] Clinical: shareable link works (token-based, 7-day expiry)
- [ ] Clinical: skin alerts created by nightly monitor
- [ ] Clinical: ingredient interaction checker returns personalized warnings
- [ ] Clinical: longitudinal analysis narrative generates
- [ ] Clinical: benchmark returns percentile data
- [ ] Clinical dashboard: all 5 sections rendering with real data
- [ ] Multi-angle: 3-photo capture flow works
- [ ] Admin analytics: all 6 endpoints returning data
- [ ] Admin analytics page: KPI cards + charts rendering
- [ ] All admin pages redesigned
- [ ] Build + tests pass
