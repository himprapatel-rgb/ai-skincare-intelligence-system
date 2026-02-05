# Single API, Two Databases & Feature Parity

**All viewports (desktop, tablet, mobile) use the same API and the same two databases.** Layout and UI differ by viewport; data and behavior do not.

## Single API

- **Config:** `src/config.ts` exports `API_BASE_URL` (and `getUploadFullUrl`). Set `VITE_API_URL` in `.env` for local/staging/production.
- **Usage:** Every API call must use this single base URL:
  - `api` (axios) in `src/services/api.ts` uses `API_BASE_URL`.
  - `scanApi`, `analysisStore`, `MePage`, `devAutoLogin`, and all other modules import `API_BASE_URL` from `config.ts` (or use the `api` client which already uses it).
- **Do not:** Use a different env var (e.g. `VITE_API_BASE_URL`) or hardcode another base URL. Do not switch API by viewport or device.

## Two databases (backend)

The backend uses **two databases**; the frontend has one API and does not choose between them—the backend routes each request to the right DB:

| Database | Env var | Purpose |
|----------|---------|---------|
| **Main DB** | `DATABASE_URL` | Users, auth, scans, profiles, shelf, routines, digital twin, notifications, consent, etc. |
| **Product catalog DB** | `PRODUCT_DATABASE_URL` | Products, ingredients, brands, catalog, barcode lookup, etc. |

- All viewports hit the same API; the API uses the main DB for user/scan/profile data and the product DB for catalog/ingredient data.
- There are no viewport-specific or device-specific databases or replicas in this app.

## Same features on all viewports

- **Feature parity:** Auth, scan, dashboard, digital twin, shelf, product catalog, recommendations, profile, export, notifications, admin, etc. are available on desktop, tablet, and mobile. Layout and navigation differ (e.g. bottom nav on mobile, top nav on desktop/tablet); functionality does not.
- **Viewport usage:** `useViewport()` and `data-viewport` are for **UI only** (e.g. which nav to show, which layout to use). Do not use viewport to:
  - Enable or disable features.
  - Call different APIs or endpoints.
  - Use different env vars or config.

## Checklist for new code

1. **API:** Import `API_BASE_URL` from `src/config` (or use the `api` axios instance from `src/services/api.ts`) for any backend request.
2. **Auth:** Use `auth_token` in `localStorage` and the same login/register flow as the rest of the app.
3. **Features:** Implement so the feature works on all viewports; only adjust layout/CSS by viewport if needed.
