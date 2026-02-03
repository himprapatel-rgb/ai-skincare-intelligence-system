# SkinCareAI / Pellicura – App Features List

Count: **45+ distinct features** (routes/surfaces). Grouped below.

---

## Core app (mobile hub)

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 1 | **Today (hub)** | `/` (mobile) | Daily hub: skin score, routine progress, For You picks. Desktop/tablet: marketing Home. |
| 2 | **Home (marketing)** | `/`, `/home` | Landing/marketing page (desktop/tablet at `/`). |
| 3 | **Scan (face + product)** | `/scan` | Face scan + product scan toggle; camera/upload, analysis. |
| 4 | **Me (profile hub)** | `/me` | Profile summary, My Skincare, Learn, Settings links. |

---

## Auth & account

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 5 | Sign in / Register | `/auth` | Login, register, auth flows. |
| 6 | Password reset | `/password-reset`, `/password-reset/confirm` | Request and confirm password reset. |
| 7 | Email verification | `/verify-email` | Verify email after signup. |
| 8 | Google OAuth callback | `/auth/google/callback` | Post–Google sign-in handling. |

---

## Skin analysis & results

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 9 | Analysis results | `/analysis/:analysisId` | View result of a face scan. |
| 10 | Sample/demo report | `/analysis/demo` | Demo analysis report. |
| 11 | Scan history | `/history` | List of past scans. |
| 12 | Comparison | `/comparison` | Compare multiple analyses. |
| 13 | Digital Twin | `/digital-twin` | Skin timeline / digital twin view. |
| 14 | Dashboard | `/dashboard` | Overview: stats, skin score, quick actions. |
| 15 | Progress tracking | `/progress` | Progress over time. |

---

## Products & shelf

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 16 | Recommendations / Discover | `/recommendations`, `/discover` | AI/product recommendations. |
| 17 | Product details | `/product/:id` | Single product page. |
| 18 | Product compare | `/product/compare` | Compare two products. |
| 19 | My Shelf | `/myshelf` | User’s product shelf. |
| 20 | Favorites | `/favorites` | Saved/favorite products. |
| 21 | Product scanner | `/scanner` | Barcode/product scanning. |

---

## Routine & goals

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 22 | Routine builder | `/routine-builder`, `/routines` | Build and manage routines. |
| 23 | Skin goals | `/skin-goals` | Set and manage skin goals. |

---

## Onboarding & consent

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 24 | Onboarding | `/onboarding` | Multi-step onboarding (skin type, concerns, routine, first scan). |
| 25 | Consent | `/consent` | Consent management. |

---

## Profile & settings

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 26 | Profile / settings | `/profile` | Profile and settings (tabs: personal, skin, goals, notifications, privacy, etc.). |
| 27 | Data export | `/export` | Export user data. |
| 28 | Notifications | `/notifications` | Notification center + in-app bell. |

---

## Learn & content

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 29 | Ingredient dictionary | `/ingredients` | Look up ingredients. |
| 30 | Skin type guide | `/skin-type-guide` | Guide to skin types. |
| 31 | Video tutorials | `/tutorials` | Video help/tutorials. |
| 32 | Blog | `/blog` | Blog/articles. |
| 33 | About | `/about` | About the app/company. |
| 34 | Contact | `/contact` | Contact / feedback. |
| 35 | Privacy policy | `/privacy` | Privacy policy + delete data. |
| 36 | Terms of service | `/terms` | Terms of service. |

---

## Admin (staff only)

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 37 | Admin dashboard | `/admin` | Admin home. |
| 38 | Admin users | `/admin/users` | User management. |
| 39 | Admin products | `/admin/products` | Product management. |
| 40 | Admin catalog | `/admin/catalog` | Catalog admin. |
| 41 | Admin content | `/admin/content` | Content hub. |
| 42 | Admin blogs | `/admin/blogs` | Blog management. |
| 43 | Admin videos | `/admin/videos` | Video management. |
| 44 | Admin news | `/admin/news` | News management. |

---

## System

| # | Feature | Route | Description |
|---|---------|--------|-------------|
| 45 | 404 Not found | `*` | NotFound page with links. |

---

## Summary by category

| Category | Count |
|----------|--------|
| Core app (Today, Home, Scan, Me) | 4 |
| Auth & account | 4 |
| Skin analysis & results | 7 |
| Products & shelf | 6 |
| Routine & goals | 2 |
| Onboarding & consent | 2 |
| Profile & settings | 3 |
| Learn & content | 8 |
| Admin | 8 |
| System | 1 |
| **Total** | **45** |

---

*Generated from routes and navigation. Protocol: Desktop | Tablet | Mobile are three separate code paths.*
