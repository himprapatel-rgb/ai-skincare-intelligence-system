# Protocol: Three Viewport Code Paths

**Locked-in rule for this project. Do not merge or assume one layout fits all.**

---

## Rule

We maintain **three separate code paths** at all times:

| Viewport | Width        | Purpose                |
|----------|--------------|------------------------|
| **Desktop** | ≥ 1025px  | Full site; we do not touch it for “mobile” work. |
| **Tablet**  | 769px – 1024px | Own layout/rules; not the same as desktop or mobile. |
| **Mobile**  | ≤ 768px   | App-style UI (e.g. TODAY hub, 3-tab nav, app shell). |

- **Desktop** = full homepage, full footer, full nav. No app-shell.
- **Tablet** = full layout by default (like desktop) unless we add tablet-specific behavior.
- **Mobile** = app shell, bottom nav, TODAY at `/`, minimal footer when in app routes.

---

## Implementation

- **Single source of truth:** `useViewport()` in `frontend/src/hooks/useViewport.ts`. Returns `'desktop' | 'tablet' | 'mobile'`.
- **Breakpoints:** Mobile ≤768px, Tablet 769–1024px, Desktop ≥1025px.
- **Layout:** `AppLayout` sets `data-viewport={viewport}` on the root. Use `[data-viewport="desktop"]`, `[data-viewport="tablet"]`, `[data-viewport="mobile"]` in CSS.
- **Home route:** `HomeRoute` at `/`: mobile → TodayPage; tablet & desktop → HomePage.
- **App shell:** Applied only when `viewport === 'mobile'` and path is an app route.

---

## Protocol in practice

1. When adding or changing UI, ask: does this apply to **desktop**, **tablet**, or **mobile** (or more than one)?
2. Do not assume “mobile” and “desktop” only; tablet is a distinct path.
3. Do not remove or blur the three-way split (e.g. by using a single “default” layout for all viewports).
4. Prefer `useViewport()` (or `useIsMobile()` where only mobile vs non-mobile matters) over ad-hoc `window.innerWidth` or single media queries that ignore tablet.

---

*This protocol is the agreed standard for viewport handling in this project.*
