# Design Audit — External App Designer Perspective

**Document type:** Design audit (written from an external app designer’s point of view)  
**Product:** SkinCareAI  
**Focus:** Visual design, consistency, hierarchy, mobile/super-app UX, and accessibility.  
**Use:** Prioritize design improvements and align internal design/engineering.

---

## Executive summary

SkinCareAI already has a solid foundation: clear information architecture, a defined design system (color, type, spacing), and recent work to make mobile feel like a super-app (bottom nav with center Scan, minimal footer on app routes, floating CTA on home). The main opportunities are **visual consistency** (some pages still feel like separate “sites”), **stronger hierarchy** on busy screens, and **polish** (microcopy, empty states, and a few high-traffic screens). This audit lists what works, what doesn’t, and what to improve first.

---

## 1. What’s working well

- **Core IA and flows**  
  Home → Scan → Analysis → Recommendations/Shelf is clear. Bottom nav (Home, Scan, Dashboard, Shelf, Profile) matches how people actually use the product.

- **Super-app direction**  
  Raised center “Scan” button, minimal header on app routes, and a single primary CTA on home (floating “Start Free Skin Scan” on mobile) align with a Bumble-like, action-first experience.

- **Design system base**  
  Primary blue, purple accents, and Inter give a recognizable, “premium health” look. Tokens for radius, spacing, and safe areas are in place.

- **Mobile-first habits**  
  Touch targets (44px), 16px inputs, safe-area insets, and reduced-motion handling show that mobile and accessibility have been considered.

- **Reusable patterns**  
  `EmptyState`, `ErrorCard`, and `app-header-card` + `app-page-content` give pages a consistent structure where they’re used.

---

## 2. Gaps and inconsistencies

### 2.1 Visual consistency

- **Header styles vary**  
  Some pages use `app-header-card`, others use custom heroes (Home, My Shelf) or no card (Product Details). That’s intentional for some screens, but the *style* of type, spacing, and back/actions is not fully unified. Recommendation: define 2–3 header types (e.g. “hero,” “standard card,” “minimal”) and apply them consistently.

- **Buttons and CTAs**  
  Primary buttons differ in corner radius, padding, and gradient (e.g. hero vs in-app). Secondary/ghost styles also vary. Recommendation: one primary and one secondary component with clear variants (default, hero, small) and use them everywhere.

- **Cards and lists**  
  Card radius and shadow differ by page. List rows (History, Favorites, Shelf) could share one pattern (e.g. icon/thumbnail, title, subtitle, chevron/action) so the product feels like one app.

### 2.2 Hierarchy and “one primary action”

- **Dashboard when signed in**  
  With stats, reminders, recent activity, and quick links, the main action (“Take your first scan” or “Scan again”) can compete with secondary actions. Recommendation: make the primary CTA the only filled button; turn the rest into links or ghost buttons.

- **Recommendations and discovery**  
  Product cards and filters can dominate. Recommendation: one clear primary action per screen (e.g. “See my recommendations” or “Add to routine”) and treat filters/secondary actions as secondary.

- **Profile / Settings**  
  Long lists of items (account, security, support, etc.) are clear but visually flat. Recommendation: group into sections with subtle section headers and, where relevant, one primary action per section (e.g. “Export data”).

### 2.3 Copy and empty states

- **Microcopy**  
  Some labels and errors are generic (“Error,” “Something went wrong”). Recommendation: use short, specific, human copy (e.g. “We couldn’t load your analysis — tap to try again”) and reuse it via `ErrorCard` / `EmptyState`.

- **Empty states**  
  Where `EmptyState` is used with icon + title + one CTA, it works. Where it’s not (e.g. some admin or edge screens), add the same pattern so every empty view feels intentional.

### 2.4 Mobile and super-app polish

- **Home vs in-app**  
  Home is more “marketing” (gradients, trust badges); in-app is cleaner. The transition is okay but could be smoother (e.g. same top bar style as soon as you’re in the app, or a clear “Get started” handoff).

- **Scan flow**  
  Camera and permissions are critical. Recommendation: ensure one clear instruction per step, obvious “Allow”/“Next” and a visible way to exit or get help.

- **Bottom nav**  
  Center Scan reads as primary; the other four tabs are a bit text-heavy on small screens. Recommendation: consider icon-only with tooltip/label on focus, or shorten labels (e.g. “Shelf” not “My Shelf”) if space is tight.

### 2.5 Accessibility

- **Focus and keyboard**  
  Focus order and visible focus rings are in place in many areas; worth checking modals, dropdowns, and the scan flow so nothing is trapped or invisible.

- **Color and status**  
  Success/error/warning should not rely on color alone. Recommendation: audit all status messages and ensure icon + text (or pattern) everywhere.

- **Motion**  
  `prefers-reduced-motion` is respected; keep applying it to any new animations.

---

## 3. Prioritized recommendations

### P0 — High impact, do first

| # | Recommendation | Rationale |
|---|----------------|-----------|
| 1 | **Unify primary/secondary button components** | Reduces visual noise and makes the “one primary action” rule obvious. Use one primary and one secondary style with size/variant options. |
| 2 | **Define 2–3 header patterns and apply consistently** | Standard card, hero, minimal — and use them everywhere so the app feels like one product, not a patchwork of pages. |
| 3 | **Dashboard: single primary CTA, rest secondary** | On dashboard, one clear “Scan” (or “Take your first scan”) as the only filled button; convert other actions to links or ghost buttons. |
| 4 | **Tighten error and empty-state copy** | Replace generic messages with short, specific, actionable copy and use `ErrorCard`/`EmptyState` everywhere. |

### P1 — Medium impact, next

| # | Recommendation | Rationale |
|---|----------------|-----------|
| 5 | **Card and list design system** | One card style (radius, shadow, padding) and one list-row pattern for History, Favorites, Shelf, Recommendations so lists feel consistent. |
| 6 | **Recommendations / Product Scanner headers** | Use `app-header-card` + subtitle (as in audit) so these screens match Dashboard, History, Favorites. |
| 7 | **Profile/Settings grouping** | Group items with section headers and one primary action per section to improve scannability. |
| 8 | **Scan flow: one instruction per step** | Clear copy and one main button per step; visible “Back” or “Cancel” so users never feel stuck. |

### P2 — Polish and longer term

| # | Recommendation | Rationale |
|---|----------------|-----------|
| 9 | **Bottom nav: icon weight and labels** | Ensure icons are consistent weight; consider shorter labels or icon-only with aria-label for very small viewports. |
| 10 | **Home → app transition** | Align top bar and tone so the jump from “marketing” to “app” feels intentional (e.g. same header style after first interaction). |
| 11 | **Status feedback (success/error)** | Audit all success/error/warning and add icon + text (and optional subtle animation) so status is never color-only. |
| 12 | **Digital Twin and edge screens** | Add `app-header-card` to error/empty states (as in product audit) and use shared empty/error components. |

---

## 4. How to use this audit

- **Product / Design:** Use the P0 list as the next design sprint; P1 as backlog.
- **Engineering:** Button and header work may need a small design spec or component API; card/list can be done incrementally per page.
- **External reviewer:** Send them `EXTERNAL-DESIGN-REVIEW-BRIEF.md` and, if useful, this document as “current state and internal audit” so they can validate or extend it and add fresh eyes (e.g. competitor references, visual mockups).

---

## 5. References

- **Design principles:** `docs/MOBILE-UX-PRINCIPLES.md`  
- **Page-level audit:** `docs/PRODUCT-DESIGN-AUDIT-PAGES.md`  
- **Super-app (bottom nav, clearance):** Same audit, “Super-app (Bumble-style) audit” section  
- **Color and tokens:** `frontend/src/styles/COLOR_SCHEME.md`, `frontend/src/index.css` (CSS variables)

*This audit is written from an external app designer’s perspective for internal use. For a formal review, engage a designer and share the External Design Review Brief.*
