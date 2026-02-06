# Pellicura / SkinCareAI – Complete App Overview

**One-place guide:** how we build the app, what tech we use, where we host it, what it does, and how every page connects.

**Last updated:** February 2026

---

## 1. Purpose of the app

**Pellicura** (also called **SkinCareAI** in code and docs) is a **clinical-grade, AI-powered skincare platform** that:

- Lets users **scan their skin** (selfie upload or camera) and get **AI analysis** (concerns, skin type, scores, recommendations).
- Lets users **scan products** (barcode or search) to see ingredients, safety, and how they match their skin.
- Tracks skin over time with a **Digital Twin** (timeline, snapshots, before/after).
- Supports **routines** (AM/PM), **recommendations**, **My Shelf**, **favorites**, **progress tracking**, and **data export**.

**In one sentence:** *One app for skin analysis, tracking, and personalized skincare—on web (desktop, tablet, mobile), with a pro web-based mobile experience.*

---

## 2. How we build it – technologies

### Frontend (what the user sees and interacts with)

| Technology | Purpose |
|------------|--------|
| **React 18** | UI framework (components, state, hooks) |
| **TypeScript** | Type safety and better tooling |
| **Vite** | Build tool (fast dev server, optimized production bundles) |
| **React Router 6** | Client-side routing (URLs → pages) |
| **Axios** | HTTP client for API calls (with retries, interceptors) |
| **Recharts** | Charts and data visualization |
| **Lucide React** | Icons |
| **CSS** | Styling (global + per-component; design tokens in `index.css`) |
| **Zustand** | Optional state (e.g. analysis store) |

**Where the frontend code lives:** `frontend/` (mainly `frontend/src/`: `App.tsx`, `pages/`, `components/`, `services/`, `context/`, `hooks/`, `styles/`).

---

### Backend (API, auth, business logic, database access)

| Technology | Purpose |
|------------|--------|
| **Python 3.11+** | Core language |
| **FastAPI** | Web framework (REST API, validation, docs) |
| **Uvicorn** | ASGI server (runs the FastAPI app) |
| **SQLAlchemy** | ORM (talk to PostgreSQL) |
| **Pydantic** | Request/response validation |
| **JWT (python-jose)** | Access tokens for auth |
| **Argon2** | Password hashing |
| **OpenAI API** | Vision analysis for skin scans (optional) |
| **Pillow** | Image validation (dimensions, format) |
| **Redis** (optional) | Shared rate limiting when `REDIS_URL` is set |

**Where the backend code lives:** `backend/` (mainly `backend/app/`: `main.py`, `api/v1/endpoints/`, `routers/`, `models/`, `schemas/`, `services/`, `core/`, `config.py`, `database.py`).

---

### Database (where we store data)

| Technology | Purpose |
|------------|--------|
| **PostgreSQL** | Primary database (users, scans, routines, shelf, digital twin, admin, etc.) |

- **How we use it:** SQLAlchemy ORM (models in `backend/app/models/`). Connection and pool in `backend/app/database.py` (`DATABASE_URL`).
- **Optional second DB:** Product catalog can use a separate PostgreSQL DB (`PRODUCT_DATABASE_URL`) for products/ingredients.
- **Migrations:** Scripts in `backend/scripts/run_migrations.py` and `backend/migrations/`. Run on deploy (e.g. before uvicorn starts).

---

## 3. Where we host everything

| What | Where it’s hosted | Notes |
|------|-------------------|--------|
| **Frontend** | **Railway** and/or **Cloudflare Pages** | Production URL e.g. **pellicura.com** or pellicura.pages.dev. Single React build (Vite), static assets + SPA. |
| **Backend** | **Railway** | Production URL e.g. **ai-skincare-intelligence-system-production.up.railway.app**. Runs in Docker (see `backend/Dockerfile`); start command runs migrations then uvicorn. |
| **Database** | **Railway PostgreSQL** | Private; only the backend connects. Connection string is `DATABASE_URL` in Railway backend service. |
| **Optional Redis** | Railway Redis (or any Redis) | For shared rate limiting across workers/instances; set `REDIS_URL` on the backend. |

So: **frontend** and **backend** are separate services; **database** is a Railway Postgres instance used only by the backend. Frontend talks to the backend via `VITE_API_URL` (e.g. `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1`).

---

## 4. Main features (what the app can do)

| Feature | What it does |
|---------|----------------|
| **Auth** | Register (email/password), login, email verification, password reset, Google OAuth. JWT stored in browser (e.g. localStorage). |
| **Today** | Daily hub (mobile): greeting, skin summary, routine, recommendations. |
| **Face scan** | Upload or camera → validation (magic bytes, size, dimensions) → analysis (OpenAI/ML or mock) → results and history. |
| **Product scan** | Barcode or search → product details, ingredients, safety, add to shelf. |
| **Digital Twin** | Timeline of skin snapshots, before/after, insights. |
| **Routine builder** | AM/PM routines, steps, check-off, reminders. |
| **Recommendations** | Browse by concern, product details, compare, add to shelf/favorites. |
| **My Shelf** | Track products, ratings, expiry, repurchase, scan history. |
| **Favorites** | Saved products and routines. |
| **Profile & settings** | Profile data, skin goals, notifications, device context. |
| **Progress** | Before/after, improvement charts. |
| **Data export** | GDPR-style export and account deletion. |
| **Admin** | Dashboard, users, products, catalog, content (blogs, videos, news). Allowlist + `is_admin`. |
| **Content** | Blog, videos, news, ingredient dictionary, skin-type guide, about, contact, privacy, terms. |

---

## 5. How we navigate – from home to every page

All routes are defined in **`frontend/src/App.tsx`**. The app uses **React Router**: one URL path → one route → one page (or redirect).

### Entry and home

- **`/`** (root)  
  - **Mobile:** Shows **Today** (daily hub).  
  - **Desktop/tablet:** Shows **Home** (marketing).  
  - Implemented by **`HomeRoute`** (uses viewport to pick `TodayPage` vs `HomePage`).

- **`/home`**  
  - Always the **marketing Home** page.

### Auth

- **`/auth`** – Login / register (tabs).
- **`/password-reset`** – Request password reset.
- **`/password-reset/confirm`** – Confirm reset with token.
- **`/verify-email`** – Email verification (link from email).
- **`/auth/google/callback`** – Google OAuth callback (redirect here after Google sign-in).

### Scan and analysis

- **`/scan`** – Scan page (face or product; mode can be in query e.g. `?mode=product`).
- **`/scanner`** – Redirects to **`/scan?mode=product`**.
- **`/analysis/:analysisId`** – Analysis result for a given scan.
- **`/analysis/demo`** – Demo/sample report.
- **`/history`** – Scan history list.
- **`/comparison`** – Compare scans.

### Digital Twin and recommendations

- **`/digital-twin`** – Digital Twin timeline.
- **`/recommendations`** – Recommendations (by concern).
- **`/discover`** – Same as recommendations (alias).
- **`/product/:id`** – Product detail.
- **`/product/compare`** – Product comparison.

### Routine, shelf, favorites

- **`/routine-builder`** – Routine builder.
- **`/routines`** – Same (alias).
- **`/myshelf`** – My Shelf.
- **`/favorites`** – Favorites.

### Me, profile, settings

- **`/me`** – Me page (profile entry, stats, Digital Twin link, settings, sign out).
- **`/profile`** – Profile settings.
- **`/onboarding`** – Onboarding flow.
- **`/consent`** – Consent (terms/privacy).
- **`/skin-goals`** – Skin goals.
- **`/progress`** – Progress tracking.
- **`/export`** – Data export.
- **`/notifications`** – Notification center.

### Dashboard (authenticated)

- **`/dashboard`** – User dashboard.

### Admin (admin only)

- **`/admin`** – Admin dashboard.
- **`/admin/users`** – User management.
- **`/admin/products`** – Products.
- **`/admin/catalog`** – Catalog.
- **`/admin/content`** – Content hub.
- **`/admin/blogs`** – Blogs.
- **`/admin/videos`** – Videos.
- **`/admin/news`** – News.

### Static and content

- **`/about`** – About.
- **`/contact`** – Contact.
- **`/privacy`** – Privacy policy.
- **`/terms`** – Terms of service.
- **`/blog`** – Blog listing.
- **`/ingredients`** – Ingredient dictionary.
- **`/skin-type-guide`** – Skin type guide.
- **`/tutorials`** – Video tutorials.
- **`/device-context`** – Device context (e.g. for support).
- **`/auth-debug`** – Auth debug (dev).

### Fallback

- **`*`** (any other path) – **404** (NotFoundPage).

---

## 6. How users move through the app (typical flows)

1. **Land on `/`**  
   → Mobile: **Today**; Desktop: **Home**.

2. **Sign up / log in**  
   → Go to **`/auth`** → register or login → (if needed) **`/verify-email`** → then **Today** or **Dashboard**.

3. **Do a face scan**  
   → **`/scan`** (or bottom nav “Scan” on mobile) → upload/camera → after analysis → **`/analysis/:id`** or history.

4. **Scan a product**  
   → **`/scan`** (product mode) or **`/scanner`** → barcode/search → **`/product/:id`** → can add to **My Shelf** or **Favorites**.

5. **See skin over time**  
   → **`/me`** or nav → **`/digital-twin`** (timeline).

6. **Build a routine**  
   → **`/routine-builder`** or **`/routines`** (or from Today).

7. **Get recommendations**  
   → **`/recommendations`** or **`/discover`** (or from Today) → **`/product/:id`**.

8. **Manage account**  
   → **`/me`** → **`/profile`**, **`/export`**, **`/consent`**, **`/notifications`**, or sign out.

9. **Admin**  
   → **`/admin`** → **`/admin/users`**, **`/admin/products`**, **`/admin/catalog`**, **`/admin/content`**, etc.

Navigation is done by:

- **Links** (`<Link to="...">` or `navigate(...)`).
- **Bottom nav on mobile:** Today, Scan, Me (and sometimes other entry points from there).
- **Header/nav menu** (desktop/tablet): links to main sections.
- **Redirects:** e.g. unauthenticated user hitting a protected route → **`/auth`**; **`/scanner`** → **`/scan?mode=product`**.

---

## 7. One-page “map” (URL → page)

| URL | Page / behavior |
|-----|------------------|
| `/` | Today (mobile) or Home (desktop/tablet) |
| `/home` | Home (marketing) |
| `/auth` | Login / register |
| `/password-reset` | Request password reset |
| `/password-reset/confirm` | Confirm password reset |
| `/verify-email` | Email verification |
| `/auth/google/callback` | Google OAuth callback |
| `/scan` | Scan (face/product) |
| `/scanner` | → `/scan?mode=product` |
| `/analysis/:analysisId` | Analysis result |
| `/analysis/demo` | Demo report |
| `/history` | Scan history |
| `/comparison` | Compare scans |
| `/digital-twin` | Digital Twin timeline |
| `/recommendations` | Recommendations |
| `/discover` | Same as recommendations |
| `/product/:id` | Product detail |
| `/product/compare` | Product comparison |
| `/routine-builder`, `/routines` | Routine builder |
| `/myshelf` | My Shelf |
| `/favorites` | Favorites |
| `/me` | Me (profile hub) |
| `/profile` | Profile settings |
| `/onboarding` | Onboarding |
| `/consent` | Consent |
| `/skin-goals` | Skin goals |
| `/progress` | Progress tracking |
| `/export` | Data export |
| `/dashboard` | User dashboard |
| `/notifications` | Notifications |
| `/admin` | Admin dashboard |
| `/admin/users` | Admin users |
| `/admin/products` | Admin products |
| `/admin/catalog` | Admin catalog |
| `/admin/content` | Admin content |
| `/admin/blogs` | Admin blogs |
| `/admin/videos` | Admin videos |
| `/admin/news` | Admin news |
| `/about` | About |
| `/contact` | Contact |
| `/privacy` | Privacy |
| `/terms` | Terms |
| `/blog` | Blog |
| `/ingredients` | Ingredient dictionary |
| `/skin-type-guide` | Skin type guide |
| `/tutorials` | Video tutorials |
| `/device-context` | Device context |
| `/auth-debug` | Auth debug |
| (anything else) | 404 |

---

## 8. Quick reference – tech and hosting

- **Frontend:** React 18, TypeScript, Vite, React Router, Axios, Recharts, Lucide, CSS.  
  **Hosted:** Railway and/or Cloudflare Pages (e.g. pellicura.com).

- **Backend:** Python 3.11, FastAPI, Uvicorn, SQLAlchemy, Pydantic, JWT, Argon2, OpenAI (optional), Pillow, Redis (optional).  
  **Hosted:** Railway (e.g. ai-skincare-intelligence-system-production.up.railway.app).

- **Database:** PostgreSQL (main app data).  
  **Hosted:** Railway PostgreSQL (private; backend connects via `DATABASE_URL`).

- **Optional:** Redis for shared rate limiting (`REDIS_URL`); second PostgreSQL for product catalog (`PRODUCT_DATABASE_URL`).

This document is the single “Dora” (full picture) of how we build the app, what technologies we use, where we store and host the database, frontend, and backend, what the app is for, what the main features are, and how every page is reached from the home page.
