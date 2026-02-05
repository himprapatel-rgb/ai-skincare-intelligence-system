# Best-in-Class Mobile Design Reference

**Author:** GUI design lens (15-year reference: world-leading apps)  
**Purpose:** Map patterns from top apps to Pellicura mobile; implement where relevant.  
**Scope:** Mobile (viewport ≤768px), PWA / app-shell.

---

## 1. Reference Apps & What We Borrow

| App | Category | Patterns we adopt |
|-----|----------|--------------------|
| **Headspace / Calm** | Wellness, routines | Soft gradients; one primary CTA per screen; progress clarity; minimal chrome; card hierarchy (title → supporting line → action). |
| **Glossier / Sephora** | Beauty, products | Product cards: image-first, then name/brand, then quick actions (heart, add); shelf/wishlist as first-class; “Shop” vs “You” mental model. |
| **Apple Health** | Health, data | Summary cards with clear number + label; trust via “Data stays on device” messaging; consistent 12–16px radius; no visual clutter. |
| **Spotify** | Music, discovery | Bottom nav 4–5 items in thumb zone; active = bold + color; center action (e.g. Play) raised; Home = “what’s next.” |
| **Instagram** | Social, media | Tap feedback: slight scale (0.96) or opacity on buttons; story-style progress for multi-step flows; clear iconography. |
| **Linear / Notion** | Productivity | Typography hierarchy (one clear H1); subtle shadows; single radius token (8–12px); “escape” (Home/back) always available. |
| **Apple HIG** | System | 44pt minimum touch targets; safe areas; feedback on every tap; avoid double submission. |
| **Material Design 3** | System | FAB for primary action; surface elevation; state layers (hover/pressed); clear disabled states. |

---

## 2. Patterns Applied to Pellicura

### 2.1 Navigation (Spotify, Apple)

- **Bottom nav:** Keep 3 items (Today, Scan, Me); center Scan as primary (raised pill) — already done. Optional: 4th tab “Shelf” in thumb zone if metrics support it.
- **Active state:** Bold + primary color (not just underline); 3–4px or filled pill where tabs exist — applied to filter-tabs.
- **Back / Home:** Persistent Back on detail pages; “Home” or logo tap returns to root — BackButton on Analysis/Product; logo = Home.

### 2.2 Tap feedback (Instagram, Apple HIG)

- **Every tappable control:** Visible feedback (scale 0.97–0.98 or opacity 0.9) on `:active` so user sees immediate response.
- **Primary buttons:** Slight scale down on press (e.g. `transform: scale(0.98)`).
- **Cards that are links:** Same active feedback so list items feel responsive.

### 2.3 Hero & first screen (Headspace, Calm)

- **One clear H1**, one supporting line, one primary CTA. Secondary CTA (e.g. “See Sample Report”) visually lighter.
- **Trust line:** Short, under CTA (e.g. “Takes ~30 sec · No signup · Delete anytime”).
- **No competing visuals:** Decorative blobs/gradients support, don’t dominate.

### 2.4 Cards & lists (Glossier, Apple Health)

- **Product / content cards:** Single radius token (e.g. 12px); image or placeholder first; title + meta (brand/category); actions (heart, add) with 44px hit area.
- **Summary cards:** Number/label hierarchy; consistent padding; subtle border or shadow, not both heavy.

### 2.5 Forms & inputs (Apple HIG, Material)

- **16px minimum font** on inputs (prevents iOS zoom) — done.
- **Labels above** or floating; clear error state and `aria-describedby`.
- **Primary submit:** Full-width on mobile when single CTA; disabled + “Sending…” during submit — done.

### 2.6 Loading & status (NN/g, best apps)

- **Skeleton matching layout** (not single spinner) for lists and dashboard — done for Favorites, History, Dashboard.
- **Progress for multi-step:** Step labels (“Step 1: Uploading”, “Step 2: Analyzing”) + progress bar + short hint — done for Scan.
- **Offline:** Global banner above header; message + “retry” in error states — done.

### 2.7 Thumb zone (Spotify, Android)

- **Primary actions** in bottom half of screen or in fixed bottom nav.
- **Center FAB/pill** for main action (Scan) — done.
- **Avoid critical actions** only at top corners on large phones.

---

## 3. Implementation Checklist

| # | Pattern | Source | Status |
|---|---------|--------|--------|
| 1 | 44pt touch targets | Apple HIG | ✅ app-mobile-global |
| 2 | Tap feedback (active scale/opacity) | Instagram, HIG | ✅ best-apps-mobile.css |
| 3 | Single card radius token | Linear, Health | ✅ --card-radius |
| 4 | Hero: one H1, one CTA, trust line | Headspace | ✅ Current hero |
| 5 | Bottom nav raised center | Spotify | ✅ BottomNav |
| 6 | Skeleton loading | NN/g | ✅ Favorites, History, Dashboard |
| 7 | Progress steps + hint | Calm | ✅ Scan |
| 8 | Offline banner above header | Best practice | ✅ OfflineBanner |
| 9 | Back on detail pages | HIG | ✅ Analysis, Product |
| 10 | Form submit disabled + Sending | HIG | ✅ Auth, Contact |
| 11 | Product Details: image/tabs card polish + tap feedback | Glossier | ✅ best-apps-mobile.css |
| 12 | Today: card radius + tap feedback on CTAs/routine | Apple Health, Headspace | ✅ best-apps-mobile.css |

---

### Recently applied (Feb 2026)

- **Tap feedback** extended to Product Details (image zoom, Compare, tabs, links) and Today (skin CTAs, routine steps, product/top-pick buys, for-you tiles, routine tabs, card links). All respect `prefers-reduced-motion`.
- **Card polish**: Product Details image/tabs and Today cards use `--card-radius` (12px) and light shadow; Product Details active tab uses a pill style.
- **Checklist** updated: tap feedback and Product Details + Today patterns marked done.

---

## 4. References (official)

- [Apple Human Interface Guidelines – iOS](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3 – Touch targets](https://m3.material.io/foundations/accessible-design/accessibility-basics)
- [NN/g Mobile Usability](https://www.nngroup.com/reports/mobile-website-and-application-usability/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

*Doc created February 2026; updated with Product Details + Today polish Feb 2026.*
