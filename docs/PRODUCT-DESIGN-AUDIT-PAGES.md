# Product Design Audit — All Pages

**Role:** Product designer  
**Scope:** User-facing and admin pages; structure, hierarchy, consistency, and UX.

---

## Design system checklist (per page)

- **Root:** `app-page` (mobile padding, safe areas)
- **Header:** `app-header-card` + one H1 + `app-header-subtitle` for tagline (or custom hero where appropriate)
- **Content:** `app-page-content` (safe-area padding, max-width where needed)
- **Empty/error:** One primary CTA; use `EmptyState` or `ErrorCard` where it fits
- **Actions:** Primary = one per screen where possible; secondary = link or ghost button

---

## Audit by page

### Core app (user-facing)

| Page | app-page | Header pattern | app-page-content | Notes / action |
|------|----------|----------------|------------------|----------------|
| **HomePage** | ✅ | Custom hero (no app-header-card) | ✅ | OK — hero is the header |
| **AuthPage** | ✅ | Custom split (auth-left/right) | — | OK — auth flow |
| **ScanPage** | ✅ | In-content step titles | ✅ | OK |
| **DashboardPage** | ✅ | app-header-card + refresh | ✅ | OK — improved |
| **HistoryPage** | ✅ | app-header-card + refresh | ✅ | OK |
| **Recommendations** | ✅ | Custom header (recommendations-header) | ✅ | **→ Use app-header-card + subtitle** |
| **ProductDetailsPage** | ✅ | Back + product header (no card) | ✅ | OK — product is the focus |
| **ProductComparePage** | ✅ | app-header-card | ✅ | OK |
| **ProductScannerPage** | ✅ | page-header (not app-header-card) | ✅ | **→ Use app-header-card** |
| **MyShelfPage** | ✅ | Custom hero (myshelf-hero) | ✅ | OK — hero is header |
| **FavoritesPage** | ✅ | app-header-card + refresh | ✅ | OK |
| **RoutineBuilderPage** | ✅ | app-header-card | ✅ | OK |
| **OnboardingPage** | ✅ | Progress bar (no card) | ✅ | OK — wizard |
| **ProfileSettingsPage** | ✅ | Sticky + sidebar | ✅ | OK — complex layout |
| **AnalysisResults** | ✅ | app-header-card (all states) | ✅ | OK |
| **SampleReportPage** | ✅ | app-header-card | ✅ | OK |
| **DigitalTwinTimelinePage** | ✅ | Error/empty: no header card | ✅ | **→ Add app-header-card to error/empty** |
| **ComparisonPage** | ✅ | app-header-card | ✅ | OK |
| **ProgressTrackingPage** | ✅ | app-header-card | ✅ | OK |
| **SkinGoalsPage** | ✅ | app-header-card | ✅ | OK |
| **NotificationCenterPage** | ✅ | app-header-card | ✅ | OK |
| **DataExportPage** | ✅ | app-header-card | ✅ | OK |
| **ConsentPage** | ✅ | app-header-card | ✅ | OK |

### Legal / info / auth support

| Page | app-page | Header | Content | Notes |
|------|----------|--------|---------|--------|
| **AboutPage** | ✅ | app-header-card | ✅ | OK |
| **ContactPage** | ✅ | app-header-card | ✅ | OK |
| **PrivacyPage** | ✅ | app-header-card | ✅ | OK |
| **TermsPage** | ✅ | app-header-card | ✅ | OK |
| **BlogPage** | ✅ | app-header-card | ✅ | OK |
| **IngredientDictionaryPage** | ✅ | app-header-card | ✅ | OK |
| **SkinTypeGuidePage** | ✅ | app-header-card | ✅ | OK |
| **VideoTutorialsPage** | ✅ | app-header-card | ✅ | OK |
| **PasswordResetPage** | ✅ | — | ✅ | OK — form-focused |
| **PasswordResetConfirmPage** | ✅ | — | ✅ | OK |
| **EmailVerificationPage** | ✅ | — | ✅ | OK |
| **GoogleCallbackPage** | ✅ | — | ✅ | OK — processing/error |

### Error / not found

| Page | app-page | Header | Content | Notes |
|------|----------|--------|---------|--------|
| **NotFoundPage** | ✅ | None | ✅ | **→ Add app-header-card** |

### Admin

| Page | app-page | Header | Content | Notes |
|------|----------|--------|---------|--------|
| **AdminDashboardPage** | ✅ | app-header-card | app-page-content | OK |
| **AdminUsersPage** | — | page-header | — | **→ Add app-page (+ header card optional)** |
| **AdminProductsPage** | (check) | (check) | — | Audit |
| **AdminCatalogPage** | (check) | (check) | — | Audit |
| **AdminContentPage** | (check) | (check) | — | Audit |
| **AdminBlogsPage** | (check) | (check) | — | Audit |
| **AdminVideosPage** | (check) | (check) | — | Audit |
| **AdminNewsPage** | (check) | (check) | — | Audit |

---

## Improvements applied (this pass)

1. **Recommendations** — Header converted to `app-header-card` with `app-header-subtitle`; back link kept in header row.
2. **NotFoundPage** — Added `app-header-card` (“Page not found” + short subtitle); actions stay in content.
3. **ProductScannerPage** — Replaced `page-header` with `app-header-card` and `app-header-subtitle`.
4. **DigitalTwinTimelinePage** — Error and empty states given `app-header-card` before content.
5. **Admin pages** — Add `app-page` (and optional `app-header-card`) for consistency and mobile padding.

---

## Recurring patterns to keep

- **One H1 per page** in the header (or hero).
- **Subtitle** via `app-header-subtitle` for context.
- **Primary CTA** clear on empty and error states.
- **Refresh** on list/dashboard pages (History, Favorites, Shelf, Dashboard).
- **Touch targets** ≥44px; **inputs** 16px on mobile.

Use this audit when adding or changing pages so structure stays consistent.
