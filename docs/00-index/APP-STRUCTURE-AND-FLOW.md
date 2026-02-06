# Web App Structure & Flow – Website, Tablet, Mobile

**Single reference for layout and navigation by viewport.**

**Last updated:** February 2026

---

## 1. Viewport breakpoints

The app uses **three viewports** (same as `frontend/src/constants/viewport.ts` and CSS):

| Viewport | Width | Use case |
|----------|--------|----------|
| **Mobile** | ≤ 768px | Phones, narrow viewports |
| **Tablet** | 769px – 1024px | Tablets, small laptops |
| **Desktop** | ≥ 1025px | Laptops, desktops |

The root layout gets `data-viewport="mobile" | "tablet" | "desktop"` so CSS and components can adapt.

---

## 2. Overall layout structure (all viewports)

Every page is wrapped in **AppLayout**, which always has this order:

```
┌─────────────────────────────────────────────────────────┐
│  Skip link (keyboard: "Skip to main content")           │
│  OfflineBanner / AddToHomeScreenPrompt / RouteLoadingBar │
├─────────────────────────────────────────────────────────┤
│  HEADER (sticky)                                         │
│  · Logo (→ /)                                            │
│  · Navigation (desktop: horizontal nav | tablet/mobile:  │
│                hamburger → slide-out menu)                │
│  · User / Sign In / CTA                                  │
├─────────────────────────────────────────────────────────┤
│  BREADCRUMBS (if not on / and not mobile app-shell)      │
├─────────────────────────────────────────────────────────┤
│  MAIN (id="main-content")                                │
│  · Page content (children)                               │
├─────────────────────────────────────────────────────────┤
│  BOTTOM NAV (mobile only, ≤768px)                        │
├─────────────────────────────────────────────────────────┤
│  FOOTER (newsletter, links, legal, copyright)            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Desktop structure (≥ 1025px) – “Website”

**Header:** Full-width bar, sticky.

- **Left:** Logo “SkinCareAI” (link to `/`).
- **Center:** Horizontal nav links:
  - Home → `/`
  - Scan → `/scan`
  - Dashboard → `/dashboard`
  - Digital Twin → `/digital-twin`
  - About → `/about`
  - Admin → `/admin` (only if user is admin)
- **Right:**
  - If **logged in:** User avatar + name → dropdown (Profile, Settings, Sign Out).
  - If **logged out:** “Sign In”, “Get Started”.
  - “Free Scan” or “Dashboard” CTA (depending on auth and current page).

**Main:** Full-width content area; max-width and padding from CSS. Breadcrumbs shown above main when not on `/`.

**Bottom nav:** **Hidden** (CSS: `display: none`).

**Footer:** Full footer: newsletter, Product / Features / Company / Legal columns, copyright, disclaimer.

**Root `/`:** Renders **HomePage** (marketing landing).

**Flow:** User moves via header links, in-page links, and footer. No bottom bar; everything from top nav and content.

```
DESKTOP (≥1025px)
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]   Home  Scan  Dashboard  Digital Twin  About  [Admin]     │
│                    [User ▼] or [Sign In] [Get Started]  [Free Scan] │
├──────────────────────────────────────────────────────────────────┤
│ Home › Scan › Analysis                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                        PAGE CONTENT                               │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ [Newsletter]  Product | Features | Company | Legal  © SkinCareAI  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Tablet structure (769px – 1024px)

**Header:** Same sticky bar, but **horizontal nav is hidden** (CSS: `.app-nav-desktop { display: none }` at `max-width: 1024px`).

- **Left:** Logo.
- **Right:** Notification bell (if logged in), **hamburger button** (opens slide-out menu). No inline “Home / Scan / Dashboard…” links.

**Slide-out menu (when hamburger is open):**

- Same links as desktop, but in a vertical list:
  - Home, Scan, Dashboard, Digital Twin, About, Admin (if admin).
- **Features** (expandable): My Shelf, Favorites, Routine Builder, Product Scanner, Recommendations, History.
- **Learn** (expandable): Ingredient Dictionary, Skin Type Guide, Video Tutorials.
- Legal: About, Contact, Privacy, Terms.
- User block: avatar, name, email; Profile, Settings, Data Export, Notifications, Sign Out (or Sign In / Get Started if not logged in).
- CTAs: “Start Free Skin Scan” or “Dashboard” at bottom of menu.

**Main:** Content with tablet padding (e.g. `padding: var(--spacing-xl) var(--spacing-lg)`).

**Bottom nav:** **Hidden** (only shown at `max-width: 768px`).

**Footer:** Full footer (same as desktop; at 1024px and below, footer grid can stack to one column).

**Root `/`:** Renders **HomePage** (marketing), same as desktop.

**Flow:** User opens hamburger → picks a link from the slide-out menu. No bottom bar; primary navigation is the hamburger menu.

```
TABLET (769–1024px)
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]                                    [🔔] [☰ Menu]          │
├──────────────────────────────────────────────────────────────────┤
│ Home › …                                                          │
├──────────────────────────────────────────────────────────────────┤
│                        PAGE CONTENT                               │
├──────────────────────────────────────────────────────────────────┤
│ [Footer: newsletter, links, legal]                                │
└──────────────────────────────────────────────────────────────────┘

When [☰] is open:
┌─────────────────────┬────────────────────────────────────────────┐
│ Home                 │                                            │
│ Scan                 │  (backdrop; tap to close menu)              │
│ Dashboard            │                                            │
│ Digital Twin         │                                            │
│ About                │                                            │
│ ▶ Features           │                                            │
│ ▶ Learn              │                                            │
│ About · Contact · …   │                                            │
│ ─────────────────    │                                            │
│ [Avatar] Name        │                                            │
│ Profile · Settings   │                                            │
│ [Start Free Skin Scan]                                            │
└─────────────────────┴────────────────────────────────────────────┘
```

---

## 5. Mobile structure (≤ 768px) – “App shell”

**Header:** Compact; same as tablet (no horizontal nav, hamburger + optional notification bell).

- On **app routes** (e.g. `/`, `/scan`, `/me`, `/dashboard`, …), layout gets class **`app-shell-mode`**: minimal header, padding for bottom nav and safe areas.

**Slide-out menu:** Same as tablet (hamburger opens the same vertical menu with Features / Learn and user section).

**Main:** Content; in `app-shell-mode` the main area has **bottom padding** for the fixed bottom nav (e.g. `padding-bottom: max(88px, 72px + env(safe-area-inset-bottom))`).

**Bottom nav:** **Visible** (CSS: `display: flex` at `max-width: 768px`). Fixed to bottom, three items:

| Tab    | Route | Label |
|--------|--------|--------|
| Left   | `/`    | **Today** |
| Center | `/scan`| **Scan** (pill style) |
| Right  | `/me`  | **Me** |

**Footer:** In `app-shell-mode`, newsletter and main footer blocks can be **hidden** on some app pages to keep the experience minimal (CSS: `.app-shell-mode .app-footer-newsletter, .app-shell-mode .app-footer-main { display: none }`). Bottom bar (copyright, disclaimer) can still show.

**Root `/`:** Renders **TodayPage** (daily hub), not the marketing Home. So on mobile, “Today” in the bottom nav is the main home.

**Flow:** User switches between **Today**, **Scan**, and **Me** via the bottom nav; deeper pages (Dashboard, Digital Twin, Profile, etc.) via hamburger or in-page links. Back navigation via browser back or in-page back button.

```
MOBILE (≤768px) – App shell
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]                                        [🔔] [☰]           │
├──────────────────────────────────────────────────────────────────┤
│                        PAGE CONTENT                               │
│                  (padding-bottom for nav)                         │
├──────────────────────────────────────────────────────────────────┤
│  [Today]        [  Scan  ]        [Me]                            │
│   (/)            (/scan)          (/me)                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. What counts as an “app route” (mobile app-shell)

On **mobile only**, these paths use **app-shell-mode** (minimal header, bottom nav, reduced footer):

- `/`, `/dashboard`, `/scan`, `/history`, `/recommendations`, `/discover`, `/myshelf`, `/scanner`, `/profile`, `/me`, `/routine-builder`, `/routines`, `/favorites`, `/digital-twin`, `/onboarding`, `/auth`, `/comparison`, `/progress`, `/export`, `/notifications`, `/skin-goals`, `/consent`
- `/analysis/*`, `/product/*`

So: on mobile, when you’re on any of these, you get the app-style shell (Today | Scan | Me at bottom). On desktop and tablet, layout is always the full header + main + full footer, no bottom nav.

---

## 7. Navigation flow summary

| Viewport | Primary navigation | Secondary / rest |
|----------|--------------------|-------------------|
| **Desktop** | Header: Home, Scan, Dashboard, Digital Twin, About, (Admin), User dropdown / Sign In | Footer links, in-page links, breadcrumbs |
| **Tablet** | Hamburger → slide-out menu (same links + Features / Learn + user) | In-page links, footer |
| **Mobile** | Bottom nav: **Today** (/) **Scan** (/scan) **Me** (/me) | Hamburger menu for all other routes, in-page links |

---

## 8. File reference

| What | Where |
|------|--------|
| Breakpoints | `frontend/src/constants/viewport.ts` (768, 1024, 1025) |
| Viewport hook | `frontend/src/hooks/useViewport.ts` |
| Layout + header + nav + footer | `frontend/src/components/AppLayout.tsx` + `AppLayout.css` |
| Bottom nav (3 tabs) | `frontend/src/components/BottomNav.tsx` + `BottomNav.css` |
| Home vs Today at `/` | `frontend/src/components/HomeRoute.tsx` (mobile → TodayPage, else HomePage) |
| Mobile app-shell styles | `frontend/src/styles/mobile-redesign.css`, `AppLayout.css` (e.g. `.app-shell-mode`) |

This is the structure and flow of the website (desktop), tablet, and mobile app shell.
