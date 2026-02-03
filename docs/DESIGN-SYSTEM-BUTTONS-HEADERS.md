# Design System: Buttons & Headers

Short reference so buttons and page headers stay consistent across the app.

---

## Buttons

**Base class:** `btn` (inline-flex, min-height 48px, gap, radius). Always combine with a variant.

| Variant | Classes | Use when |
|--------|---------|----------|
| **Primary** | `btn btn-primary` | One main action per screen (e.g. Take your first scan, Submit, Try again) |
| **Primary hero** | `btn btn-primary btn-primary--hero` | Marketing / landing CTAs (larger, more shadow) |
| **Primary small** | `btn btn-primary btn-primary--small` | Tight layouts, inline actions |
| **Secondary** | `btn btn-secondary` | Secondary actions (Continue onboarding, Scan Now in reminder) |
| **Ghost** | `btn btn-ghost` | Tertiary or link-like actions (See Sample Report, Take a scan) |
| **Outline** | `btn btn-outline` | Alternative to secondary when you want a border emphasis |

**Rule:** Only one primary button per screen (or per clear section). Use secondary/ghost for everything else.

**Sizes:** `btn-sm`, `btn-md`, `btn-lg`, `btn-xl` can be added alongside variant when needed.

---

## Page headers

Three patterns. Use one per page for the top-level header.

| Pattern | Markup | Use when |
|---------|--------|----------|
| **Standard card** | `<header class="app-header-card">` + `<h1>` + `<p class="app-header-subtitle">` | Most app pages (Dashboard, History, Recommendations, Product Scanner, etc.) |
| **Hero** | Custom hero block (e.g. `.hero` with `.hero-title`, `.hero-subtitle`) | Home, My Shelf, or any page where the header is the main visual |
| **Minimal** | `<header class="app-header-card">` with smaller logo/title only, or no card | Deep flows (e.g. scan step, product result) where chrome is minimal |

**Standard card** is the default. Use the same structure everywhere:

- One `<h1>` (only one per page).
- One `<p class="app-header-subtitle">` for short context.
- Optional back link or refresh in the same row (see Dashboard, History).

**Error/empty states:** Use `app-header-card` with a clear H1 and subtitle (e.g. "We couldn't load your timeline") and one primary recovery action in the content below.

---

## Where it’s defined

- **Buttons:** `frontend/src/index.css` (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-primary--hero`, `.btn-primary--small`).
- **Header card:** `frontend/src/styles/app-style.css` / global (`.app-header-card`, `.app-header-subtitle`).
- **Hero:** Page-specific (e.g. HomePage.css, MyShelfPage.css).

---

## Cards and lists

**Cards:** Use `.app-card` for any white elevated block (radius `var(--radius-lg)`, light shadow, border). One card style across the app.

**List rows:** Use `.app-list-group` as the container and `.app-list-item` for each row. Pattern:
- `.app-list-icon` (optional, with `.blue` / `.purple` / `.green` / `.orange` for color)
- `.app-list-label` (main text)
- `.app-list-value` (optional, muted secondary text)
- `.app-list-arrow` (optional chevron)

Use this pattern for Dashboard quick actions, Settings groups, and any list of tappable items. For history feeds with thumbnails (e.g. History page), a custom row layout is acceptable but keep spacing and tap targets consistent.

---

Use this doc when adding or changing a page so buttons, headers, cards, and lists stay unified.
