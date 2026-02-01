# Mobile Responsive & App-Like Experience – Master Plan

**Goal:** Make the mobile experience match desktop feature parity, fix visibility issues, and deliver a native-app feel when users open the site on mobile.

**Status:** ✅ Phase 1–4 complete | **Pages:** 42 | **Estimated tasks:** ~600–800

---

## Executive Summary

| Problem | Impact | Fix |
|---------|--------|-----|
| Mobile nav missing key links | Users can't reach My Shelf, Favorites, Routine Builder, etc. | Expand mobile nav with collapsible sections or bottom tab bar |
| Content hidden on mobile | "We can't see everything" | Audit `display:none` – show equivalent or condensed content |
| Layout doesn't match desktop | Feels like a different product | Standardize breakpoints, ensure feature parity per page |
| No app-like feel | Feels like a website, not an app | PWA manifest, bottom nav, safe-area, splash screen |

---

## Phase 1: Navigation & Discovery (Priority: Critical)

### 1.1 Mobile Navigation Overhaul

**Current state:** Mobile nav (hamburger) shows: Home, Skin Analysis, Dashboard, Digital Twin, About, Admin. Profile/Notifications/Sign Out are below.

**Missing on mobile:**
- My Shelf  
- Favorites  
- Routine Builder  
- Product Scanner  
- Recommendations  
- History  
- Ingredient Dictionary  
- Skin Type Guide  
- Video Tutorials  
- Settings (Profile tab)  
- Data Export  

**Tasks:**

| # | Task | Details |
|---|------|---------|
| 1.1.1 | Add "More" / "Features" expandable section in mobile nav | Group: My Shelf, Favorites, Routine Builder, Product Scanner, Recommendations, History |
| 1.1.2 | Add "Learn" section | Ingredient Dictionary, Skin Type Guide, Video Tutorials |
| 1.1.3 | Add Settings and Data Export to user dropdown area | Under Profile in mobile user block |
| 1.1.4 | Ensure all footer links are reachable from mobile nav or footer | No dead ends |
| 1.1.5 | Add sticky "Free Scan" CTA at bottom of mobile nav | Matches desktop CTA |
| 1.1.6 | Improve mobile nav scroll | `max-height` + `overflow-y: auto` so long list doesn't cut off |
| 1.1.7 | Add search or quick-jump for logged-in users (optional) | Future enhancement |

### 1.2 Bottom Navigation Bar (App-Like)

**Option A – Bottom nav (5 items):**  
Home | Scan | Dashboard | My Shelf | Profile

**Option B – Sticky bottom CTA only:**  
Keep hamburger, add floating "Start Scan" button.

**Tasks:**

| # | Task | Details |
|---|------|---------|
| 1.2.1 | Add optional bottom tab bar for core flows | Home, Scan, Dashboard, Shelf, Profile – show on mobile only |
| 1.2.2 | Style bottom nav with safe-area-inset-bottom | Works on notched iPhones |
| 1.2.3 | Highlight active tab | Match current route |
| 1.2.4 | Ensure bottom nav doesn't cover content | Add `padding-bottom` to `main` when bottom nav visible |
| 1.2.5 | Make bottom nav dismissible or configurable (optional) | User preference |

---

## Phase 2: Content Visibility & Layout Parity

### 2.1 Audit Hidden Content

**Pages with `display: none` on mobile (examples from grep):**

| Page | Element | Action |
|------|---------|--------|
| HomePage | Sample card, hero visuals | Show condensed or carousel on mobile |
| AuthPage | Left brand panel | Show compact header instead of full hide |
| ProductScannerPage | Sidebar/tips | Show as expandable accordion |
| ProfileSettingsPage | Tabs or columns | Ensure tabs work; stack columns |
| HistoryPage | Filter chips | Wrap, don't hide |
| Recommendations | Filters | Collapsible filter sheet |
| Admin* | Table columns | Horizontal scroll or card view |
| Digital Twin | Timeline layout | Vertical stack, scroll |
| ScanPage | Upload area | Full width, larger tap target |
| HomePage | `.mobile-sticky-cta` | Ensure visible; add when appropriate |

**Tasks (per-page):**

| # | Task | Details |
|---|------|---------|
| 2.1.1 | Create per-page audit checklist | For each of 42 pages: what's hidden, what's different |
| 2.1.2 | Replace "hide on mobile" with "condense/stack" | Show equivalent info in mobile-friendly format |
| 2.1.3 | Ensure primary CTA is visible above fold on mobile | No scrolling to find main action |
| 2.1.4 | Fix hero sections | Scale title, description; keep CTA buttons |
| 2.1.5 | Fix multi-column layouts | 2–3 cols → 1 col on &lt;768px |
| 2.1.6 | Fix tables | Horizontal scroll + sticky first column, or card layout |

### 2.2 Breakpoint Standardization

**Current:** Mixed 480, 600, 768, 900, 1024, 1280px.

**Proposed standard:**
- `xs`: 0–479px (small phones)
- `sm`: 480–767px (phones)
- `md`: 768–1023px (tablets)
- `lg`: 1024–1279px (small desktop)
- `xl`: 1280px+ (desktop)

**Tasks:**

| # | Task | Details |
|---|------|---------|
| 2.2.1 | Define CSS custom properties for breakpoints | `--bp-sm: 480px`, `--bp-md: 768px`, etc. |
| 2.2.2 | Update all media queries to use standard breakpoints | Gradual migration |
| 2.2.3 | Add mobile-first min-width where appropriate | `min-width: 768px` for desktop-only |

---

## Phase 3: Touch & Layout Fixes

### 3.1 Touch Targets

| # | Task | Details |
|---|------|---------|
| 3.1.1 | Audit all buttons, links, icons | Min 44×44px tap target |
| 3.1.2 | Add padding to small icon buttons | Increase hit area without changing visual size |
| 3.1.3 | Fix filter chips, tabs | Min height 44px, adequate spacing |
| 3.1.4 | Fix close buttons on modals | 44×44px, top-right with safe-area |
| 3.1.5 | Fix breadcrumb links | Adequate spacing, truncate long path on mobile |

### 3.2 Overflow & Scrolling

| # | Task | Details |
|---|------|---------|
| 3.2.1 | Ensure no horizontal scroll on any page | `overflow-x: hidden` on body; fix wide elements |
| 3.2.2 | Add `-webkit-overflow-scrolling: touch` to scroll areas | Smooth scroll on iOS |
| 3.2.3 | Fix tables | `overflow-x: auto` wrapper, min-width on table |
| 3.2.4 | Fix long URLs, long words | `word-break` or `overflow-wrap` |
| 3.2.5 | Fix modals | Full-screen on small viewports, scrollable content |

### 3.3 Safe Area & Notches

| # | Task | Details |
|---|------|---------|
| 3.3.1 | Apply `padding-bottom: env(safe-area-inset-bottom)` to main | Content above home indicator |
| 3.3.2 | Apply safe-area to fixed/sticky elements | Header, bottom nav, footer |
| 3.3.3 | Test on notched devices | iPhone X+, Android with gesture nav |
| 3.3.4 | Ensure `viewport-fit=cover` in meta | Already present; verify |

---

## Phase 4: App-Like Experience (PWA Lite)

### 4.1 Web App Manifest

| # | Task | Details |
|---|------|---------|
| 4.1.1 | Create `manifest.json` | name, short_name, start_url, icons (192, 512), display: standalone, theme_color, background_color |
| 4.1.2 | Add manifest link in `index.html` | `<link rel="manifest" href="/manifest.json">` |
| 4.1.3 | Add apple-touch-icon | 180×180 for Add to Home Screen |
| 4.1.4 | Add meta `apple-mobile-web-app-capable` | `content="yes"` |
| 4.1.5 | Add meta `apple-mobile-web-app-status-bar-style` | `content="default"` or `black-translucent` |

### 4.2 Visual Polish for "App" Feel

| # | Task | Details |
|---|------|---------|
| 4.2.1 | Splash screen (optional) | Via manifest `background_color` + `icons` |
| 4.2.2 | Hide browser UI when standalone | `display: standalone` in manifest |
| 4.2.3 | Prevent pull-to-refresh on critical pages (optional) | `overscroll-behavior: none` |
| 4.2.4 | Add "Add to Home Screen" prompt (optional) | Detect standalone, show banner for non-PWA users |
| 4.2.5 | Ensure theme-color matches brand | `#2563eb` in meta and manifest |

### 4.3 Service Worker (Optional – Phase 2)

| # | Task | Details |
|---|------|---------|
| 4.3.1 | Add service worker for offline shell | Cache static assets |
| 4.3.2 | Add offline fallback page | "You're offline" with retry |
| 4.3.3 | Cache API responses for key pages | Stale-while-revalidate |

---

## Phase 5: Page-by-Page Mobile Fixes

For each page, apply:

1. **Visibility:** Ensure primary content and CTA visible; nothing critical hidden.
2. **Layout:** Single column, full-width forms, stacked cards.
3. **Touch:** 44px targets, adequate spacing.
4. **Typography:** Responsive font sizes (clamp or media queries).
5. **Tables/Lists:** Card layout or horizontal scroll.
6. **Modals:** Full-screen or near full-screen on mobile.
7. **Footer/Header:** No overlap, safe-area respected.

### Page List (42 pages)

| # | Page | Priority | Notes |
|---|------|----------|-------|
| 1 | HomePage | High | Hero, CTAs, trust badges, mobile-sticky-cta |
| 2 | AuthPage | High | Split layout → stack; brand panel |
| 3 | ScanPage | High | Upload, camera, preview – core flow |
| 4 | AnalysisResults | High | Charts, export, share – scroll, responsive charts |
| 5 | ProductScannerPage | High | Camera, barcode, shelf – full-screen feel |
| 6 | MyShelfPage | High | Grid → 1 col, filters, product cards |
| 7 | ProductDetailsPage | High | Tabs, ingredients, images – stack |
| 8 | DashboardPage | High | Stats, goals, recent scans – cards stack |
| 9 | HistoryPage | High | Filters, list/table – card view on mobile |
| 10 | Recommendations | High | Filters, product grid |
| 11 | RoutineBuilderPage | High | Steps, products – accordion or stepper |
| 12 | FavoritesPage | High | Grid, toolbar |
| 13 | DigitalTwinTimelinePage | High | Timeline → vertical list |
| 14 | ProfileSettingsPage | High | Tabs, forms – full width |
| 15 | NotificationCenterPage | High | List, actions |
| 16 | ProgressTrackingPage | High | Charts, photos |
| 17 | DataExportPage | Medium | Format cards, checkboxes |
| 18 | ComparisonPage | Medium | Inputs, results |
| 19 | ProductComparePage | Medium | Compare grid |
| 20 | ConsentPage | Medium | Checkboxes, buttons |
| 21 | SkinGoalsPage | Medium | Goal cards |
| 22 | OnboardingPage | Medium | Stepper, progress |
| 23 | IngredientDictionaryPage | Medium | Search, grid |
| 24 | SkinTypeGuidePage | Medium | Cards |
| 25 | ContactPage | Medium | Form, info cards |
| 26 | AboutPage | Medium | Sections, team |
| 27 | BlogPage | Medium | Post grid |
| 28 | VideoTutorialsPage | Medium | Video grid |
| 29 | PrivacyPage | Low | Long text, TOC |
| 30 | TermsPage | Low | Long text, TOC |
| 31 | PasswordResetPage | Low | Form |
| 32 | PasswordResetConfirmPage | Low | Form |
| 33 | EmailVerificationPage | Low | Status, form |
| 34 | GoogleCallbackPage | Low | Loading state |
| 35 | SampleReportPage | Medium | Report layout |
| 36 | AdminDashboardPage | Low | Stats, links |
| 37 | AdminUsersPage | Low | Table → cards |
| 38 | AdminProductsPage | Low | Table → cards |
| 39 | AdminCatalogPage | Low | Cards, stats |
| 40 | NotFoundPage | Low | Message, CTA |
| 41 | AppLayout (header, footer, breadcrumbs) | High | Nav, footer, bottom bar |
| 42 | Modals (Confirm, Consent) | High | Full-screen on mobile |

---

## Phase 6: Testing & Validation

### 6.1 Device Testing Matrix

| Device | Viewport | Notes |
|--------|----------|-------|
| iPhone SE | 375×667 | Smallest common |
| iPhone 12/13/14 | 390×844 | Notch, safe area |
| iPhone 14 Pro Max | 430×932 | Large phone |
| Samsung Galaxy S21 | 360×800 | Android |
| iPad Mini | 768×1024 | Tablet |
| iPad Pro | 1024×1366 | Large tablet |

### 6.2 Test Scenarios

| # | Scenario | Pass Criteria |
|---|----------|---------------|
| 1 | Navigate to every page from mobile nav | All 42 pages reachable |
| 2 | Complete Scan flow on mobile | Upload/camera → Analysis → Results |
| 3 | Add product to My Shelf from scanner | End-to-end |
| 4 | Log in / Register on mobile | Auth form usable |
| 5 | Open Profile, change settings | Forms work, no overflow |
| 6 | View History, filter, open analysis | List and detail usable |
| 7 | Open Product Details, add to shelf | Full flow |
| 8 | Use Routine Builder | Steps, products manageable |
| 9 | Add to Home Screen, open as PWA | Standalone mode works |
| 10 | Rotate device | Layout adapts, no broken overflow |

### 6.3 Automated Checks

| # | Task | Details |
|---|------|---------|
| 6.3.1 | Add Playwright viewport tests | 375px, 768px for key pages |
| 6.3.2 | Lighthouse mobile audit | Performance, accessibility |
| 6.3.3 | axe-core for accessibility | Touch targets, contrast |

---

## Implementation Order

1. **Week 1 – Navigation & Layout**
   - Phase 1.1: Expand mobile nav (all links)
   - Phase 1.2: Bottom nav (optional, evaluate)
   - Phase 2.2: Breakpoint tokens
   - Phase 3.3: Safe area

2. **Week 2 – Content Visibility**
   - Phase 2.1: Audit and fix hidden content on top 15 pages
   - Phase 3.1–3.2: Touch targets, overflow

3. **Week 3 – PWA & Polish**
   - Phase 4.1–4.2: Manifest, icons, meta
   - Phase 5: Remaining pages (16–42)

4. **Week 4 – Testing**
   - Phase 6: Device testing, E2E, Lighthouse

---

## Success Criteria

- [ ] All features reachable from mobile (no desktop-only flows)
- [ ] No horizontal scroll on any page at 375px width
- [ ] All interactive elements ≥44×44px
- [ ] Primary CTA visible above fold on key pages
- [ ] Add to Home Screen works; standalone mode looks like app
- [ ] Lighthouse mobile score ≥90 (performance, accessibility)
- [ ] User feedback: "Feels like an app" when opened on phone

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `frontend/public/manifest.json` | Create |
| `frontend/index.html` | Add manifest, apple meta |
| `frontend/src/components/AppLayout.tsx` | Expand mobile nav |
| `frontend/src/components/AppLayout.css` | Bottom nav, safe-area |
| `frontend/src/components/BottomNav.tsx` | Create (optional) |
| `frontend/src/index.css` | Breakpoint vars, overflow fixes |
| `frontend/src/pages/*/` | Per-page responsive fixes |
| `frontend/tests/e2e/mobile.spec.ts` | Create |
| `docs/11-working/MOBILE-RESPONSIVE-APP-PLAN.md` | This doc |

---

**Next step:** Review this plan, prioritize phases, then implement Phase 1.1 (expand mobile nav) first.
