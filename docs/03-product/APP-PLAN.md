# SkinCareAI – Solid App Plan

**Purpose:** Single reference for what the app is, who it’s for, how it’s built, and what we’re aiming for. Use this to align features, platforms, and priorities before diving into work.

**Last updated:** February 2026

---

## 1. Vision & product purpose

**SkinCareAI** is a clinical-grade, AI-powered skincare platform that:

- Lets users **scan their skin** (selfie or product) and get **personalized analysis and recommendations**.
- Tracks skin over time via a **Digital Twin** (snapshots, timeline, insights).
- Supports **routines** (AM/PM), **favorites**, **product scanner**, and **recommendations** tied to concerns.
- Serves **web** (desktop, tablet, mobile) as a single codebase, with a consistent design and color scheme. Mobile users get a first-class experience via responsive layout and PWA (install from browser).

**In one sentence:** *One app for skin analysis, tracking, and personalized skincare—on web, with a pro web-based mobile experience.*

---

## 2. Target users & platforms

| User type        | Primary need                          | Primary platform   |
|------------------|----------------------------------------|--------------------|
| Consumer         | Scan skin, get tips, build routine     | Mobile web         |
| Returning user   | Check today, routine, history, twin     | Mobile web         |
| Power user      | Digital Twin, comparisons, export       | Desktop, tablet     |
| Admin            | Users, content, catalog, analytics     | Desktop             |

| Platform   | Delivery              | Status / note                          |
|-----------|------------------------|----------------------------------------|
| Web       | Responsive (≤768 / 769–1024 / 1025+)  | Live; mobile-first “Today \| Scan \| Me” |
| PWA       | Install from browser                   | Supported (manifest, icons, offline hint)   |

**Principle:** One codebase, one API, one design system. We focus on a **web-based mobile app**: responsive layout, touch targets, safe areas, and “Add to Home Screen” for an app-like experience—no native Android/iOS app.

---

## 3. Current state snapshot

- **Production:** Frontend (e.g. Cloudflare Pages / Railway), Backend (e.g. Railway/Fly.io), PostgreSQL. Core flows are live.
- **Auth:** Email/password, JWT, email verification, password reset. Google OAuth wired; login 401 handling fixed.
- **Scan:** Face scan (upload/camera, ML analysis), product scan (barcode/OpenBeautyFacts). Results and history persisted.
- **Digital Twin:** Timeline from real API data; snapshots from scans.
- **Routines:** AM/PM routines load/save via API; progress tracking uses backend.
- **Admin:** Dashboard, users, products, catalog, content (blogs/videos/news); allowlist + `is_admin`.
- **Mobile (web):** Bottom nav (Today, Scan, Me), mobile redesign CSS, safe areas, shared color scheme. Login and 401-on-login behavior fixed. PWA manifest and icons for “Add to Home Screen.”

**Gaps / in progress:** Some product/recommendation data still mock or partial; admin and content features evolving. Performance and UX polish ongoing.

---

## 4. Architecture principles

1. **Single frontend codebase** – React (Vite, TypeScript). No separate “mobile app” codebase; mobile is viewport + Capacitor.
2. **API-first** – Backend exposes REST API v1; frontend uses shared `api` client and `STORAGE_KEYS` for auth.
3. **Viewport strategy** – Breakpoints 768px (mobile), 1024px (tablet), 1025px+ (desktop). `/` on mobile → Today; desktop → marketing Home. See [PROTOCOL-VIEWPORT-SPLIT.md](../PROTOCOL-VIEWPORT-SPLIT.md).
4. **Design system** – CSS variables in `index.css` (primary, gradient, bg, text). No random per-page overrides; mobile redesign in `mobile-redesign.css`.
5. **Auth** – JWT in `auth_token` (STORAGE_KEYS); AuthContext uses shared `api`; 401 on login shows server message; 401 on other calls = “session expired” and redirect to `/auth`.

---

## 5. Core user flows (what the app does)

| Flow            | Entry              | Main steps                                      | Success outcome              |
|-----------------|--------------------|--------------------------------------------------|------------------------------|
| Sign up / in    | `/auth`            | Register or login → verify email if needed → dashboard / today | User authenticated, token stored |
| Today           | `/` (mobile)      | Greeting, skin summary, routine, recommendations | User sees daily hub          |
| Scan (face)     | Bottom “Scan”      | Upload or camera → analysis → results / history  | Analysis saved, in history   |
| Scan (product)  | Scan tab → product | Barcode or search → product details / match      | Product on shelf / compared  |
| Me              | Bottom “Me”        | Profile, stats, Digital Twin, settings, sign out | Profile/settings updated     |
| Digital Twin    | Nav / Me           | Timeline, snapshots, before/after, insights      | User sees evolution          |
| Routine         | Today / nav        | AM/PM steps, check off, edit                     | Routine saved via API        |
| Recommendations | Nav / today       | Browse by concern, product details, compare      | Add to shelf / favorites     |

All of these work on web (desktop, tablet, and mobile viewport) with the same API.

---

## 6. Quality bar (what we care about)

- **Performance:** Fast first load and navigation; login and API calls not blocked by geo/slow `/auth/me`; backend workers and DB pool sized for load.
- **Accessibility:** Skip link, landmarks, form labels, focus and keyboard, `prefers-reduced-motion`. No white screen from hook order or missing error boundary.
- **Security:** HTTPS in production; no secrets in frontend; auth via JWT and secure storage keys; API 401 handling correct for login vs session expiry.
- **Reliability:** Health checks, graceful API errors, retries where appropriate; ErrorBoundary so one crash doesn’t blank the app.
- **Maintainability:** Single storage keys file, shared API client, clear viewport breakpoints, documented Android build.

**Out of scope for “solid app” (for now):** Native iOS/Android apps, offline-first, full white-label.

---

## 7. Roadmap phases (high level)

- **Phase 1 – Stabilize & align (current)**  
  - Solid app plan (this doc), login/401 fixed, mobile redesign and color scheme consistent.  
  - Goal: Everyone agrees what the app is and how to run it on web (including mobile).

- **Phase 2 – Web mobile & polish**  
  - Harden web-based mobile experience (PWA, touch, performance).  
  - Performance and UX polish (e.g. perceived speed, chunking, critical path).  
  - Goal: Reliable, app-like experience on mobile browsers and “Add to Home Screen.”

- **Phase 3 – Growth & depth**  
  - Fill remaining product/recommendation data, refine Digital Twin and comparisons.  
  - Admin and content maturity; optional premium or deeper personalization.  
  - Goal: Feature-complete, scalable product.

Priorities within each phase should come from the [Product Backlog](Product-Backlog-V5.md) and [Active Tasks](../12-tasks/ACTIVE-TASKS.md); this plan doesn’t replace them but gives the frame.

---

## 8. Success criteria (how we know we’re on track)

- **Clarity:** New contributors can read this plan + README and understand product, platforms, and how to run locally.
- **Web:** Core flows (auth, today, scan, me, digital twin, routine) work on desktop and mobile viewports without regressions.
- **Web mobile:** Mobile viewport and PWA provide an app-like experience (bottom nav, touch targets, safe areas).
- **Quality:** No critical a11y or security regressions; login and 401 behavior correct; performance acceptable (e.g. no multi-second freezes on login or first load).

---

## 9. References

| Doc | Use |
|-----|-----|
| [README.md](../../README.md) | Overview, quick start, links |
| [Product-Backlog-V5.md](Product-Backlog-V5.md) | Detailed stories and epics |
| [Current-State.md](../06-operations/Current-State.md) | Implementation status and addenda |
| [PROTOCOL-VIEWPORT-SPLIT.md](../PROTOCOL-VIEWPORT-SPLIT.md) | Mobile vs tablet vs desktop |
| [CODEBASE-LEARNING-GUIDE.md](../11-working/CODEBASE-LEARNING-GUIDE.md) | How the codebase is structured |
| [12-tasks/ACTIVE-TASKS.md](../12-tasks/ACTIVE-TASKS.md) | Current sprint / active work |

---

*Use this plan before starting large changes: align on phase, platform, and quality bar, then break work into tasks and backlog items.*
