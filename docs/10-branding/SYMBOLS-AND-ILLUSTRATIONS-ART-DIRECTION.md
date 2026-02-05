# Symbols & Illustrations — Art Direction

**Role:** Artist for website design symbols & illustrations  
**Purpose:** Define how symbols and illustrations should look and where they live across the product.  
**Scope:** Icons (UI), spot illustrations (empty states, hero, steps), and decorative elements.

---

## 1. What I Would Do for This Website

As the visual artist for symbols and illustrations, I would:

1. **Keep one clear visual language** — Clean, geometric, stroke-based. Trust (science + care) without looking cold.
2. **Use icons for actions and navigation** — Consistent weight and size scale so the UI feels like one system.
3. **Use illustrations for emotion and story** — Empty states, hero, “How it works,” success moments. Simple shapes, limited palette.
4. **Fill gaps** — Add missing spot art (e.g. empty shelf, “no results,” 404, scan success) so every key screen has a considered visual.
5. **Respect accessibility** — Decorative illustrations are `aria-hidden`; functional icons have labels or `aria-label`.

---

## 2. Visual Philosophy

| Principle | Meaning for this product |
|----------|---------------------------|
| **Clarity** | Icons and illustrations explain at a glance: scan, routine, shelf, ingredients, results. |
| **Trust** | No gimmicks. Soft gradients and rounded shapes feel approachable; strokes feel precise. |
| **Science + care** | Blue/purple suggests tech and insight; warm accents (amber for AM, soft fills) suggest skin and routine. |
| **Consistency** | One stroke weight family, one radius style, one palette for spot art so the product feels designed, not patched. |

---

## 3. Icon System (UI Symbols)

**Current:** Lucide React (stroke icons). Used for nav, buttons, list actions, status.

**What I would do:**

- **Stroke weight:** Prefer one weight (e.g. `strokeWidth={2}` or `2.5`) for all UI icons at a given size. Use a slightly lighter weight only for very small sizes (e.g. 14–16px).
- **Size scale:** 16 (inline with text), 20 (buttons, list items), 24 (section headers), 32–48 (empty states, feature callouts). Avoid arbitrary sizes so the system stays predictable.
- **Color:** Inherit from text/UI (e.g. `currentColor`) so icons work in primary, secondary, and disabled states without new assets.
- **No mixing with illustration style:** UI icons stay line/stroke; illustrations can use fills and gradients. That keeps “clickable/functional” vs “storytelling” clearly separate.

**Recommendation:** Document the scale (16 / 20 / 24 / 32 / 48) and default `strokeWidth` in the design system and use them consistently in `Icons.tsx` and across pages.

---

## 4. Illustration Style (Spot Art)

**Current:** Custom SVGs in `src/assets/illustrations/` and `public/` — geometric, stroke + light fill, blue (#2563eb) and purple (#7c3aed), viewBox 64×64 or 80×80.

**What I would do:**

- **Style:** Simple shapes, 2–2.5px strokes, rounded joins. Light fills (e.g. #eff6ff, #dbeafe) where needed. No heavy texture or photo.
- **Palette (illustrations):**
  - Primary: `#2563eb` (blue)
  - Secondary: `#7c3aed` (purple)
  - Accent: `#f59e0b` / `#fbbf24` (amber for sun, warmth, routine AM)
  - Neutral: light grays and soft blue tints for backgrounds
- **Composition:** Centered, one main idea per illustration. Enough padding so they sit well in cards and empty states.
- **Export:** SVG, optimized. Use as React components via SVGR where we need to drive color from CSS (e.g. `currentColor` for theming).

**Hero / How it works:** The existing “upload → analysis → results” SVGs in `public/` fit this. I would keep the same style for any new step or hero visuals.

---

## 5. Where Symbols vs Illustrations Go

| Area | Use | Example |
|------|-----|--------|
| **Nav, buttons, forms** | Icons only | Scan, Camera, Heart, Settings, Chevrons |
| **Empty states** | Illustration + short copy + CTA | My Shelf empty → shelf illustration; Favorites empty → heart |
| **Hero / landing** | One strong visual (illustration or photo) | How-it-works steps with current SVGs |
| **Cards (Today, Dashboard)** | Small icon or tiny illustration | Skin score ring, routine sun/moon, ingredient icons |
| **Alerts / errors** | Icon only | AlertTriangle, Info |
| **Success / confirmation** | Optional small illustration or icon | CheckCircle or a short “success” spot |
| **404 / error pages** | One friendly illustration + message | Simple “lost” or “glitch” visual |

---

## 6. Gaps I Would Fill (Concrete Additions)

| Gap | Suggestion |
|-----|------------|
| **My Shelf empty** | “Empty shelf” illustration (shelf + one bottle outline or sparkle) — **added as `empty-shelf.svg`**. |
| **Scan “analyzing” / success** | Optional: subtle animation (e.g. ring pulse) or a “result ready” micro-illustration. |
| **No search results** | Reuse a “search + empty” icon or a small “no results” spot (e.g. magnifier + empty box). |
| **404** | One friendly illustration (e.g. droplet or skin icon “lost” in soft gradient) + “Page not found” copy. |
| **Onboarding / first scan** | Reuse scan-camera or how-it-works-upload; keep copy and CTA primary. |

---

## 7. File and Component Conventions

- **Assets:** `frontend/src/assets/illustrations/` for SVGs used as React components (SVGR).  
- **Public:** `frontend/public/` and `public/illustrations/` for SVGs referenced by URL (e.g. `<img src="/how-it-works-upload.svg">`).  
- **Component:** `Illustrations` in `src/components/Illustrations/index.tsx` — one named export per illustration, `aria-hidden` by default.  
- **Naming:** `kebab-case.svg` (e.g. `empty-shelf.svg`, `routine-sun.svg`).  
- **New illustration:** Add SVG to `assets/illustrations/`, import in `Illustrations/index.tsx`, export in `Illustrations` object.

---

## 8. Summary: What I Delivered

- **This art direction doc** — philosophy, icon vs illustration, style, palette, gaps, conventions.
- **One new illustration:** `empty-shelf.svg` for My Shelf empty state (see assets and `Illustrations.EmptyShelf`).
- **Recommendation:** Use this doc when adding or changing any symbol or illustration so the site stays visually consistent and intentional.

*Written from the perspective of the artist for website design symbols & illustrations. Align with `04-VISUAL-IDENTITY.md` and `03-BRAND-GUIDELINES.md` for brand color names and tone.*
