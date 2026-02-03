# How We Can Improve the App

Prioritized, actionable improvements for SkinCareAI — from bugs to UX, performance, and quality.

---

## 1. Bug fixes (do first)

| Priority | Item | Notes |
|----------|------|--------|
| **P0** | **Mobile: Today tab shows wrong content after visiting Scan** | When user taps **Today** in bottom nav from **Scan**, the URL becomes `/` but the main area can still show Scan (e.g. Product scan UI). **Fix applied:** main content wrapper now uses `key={location.pathname + location.key}` so the correct page remounts on every navigation. If it still happens, verify in different browsers/devices. |
| P1 | My Shelf: duplicate product entries | Data/merge bug; dedupe by product id when loading shelf. |
| P1 | Scan: add 12px spacing to instructions checklist | Per audit; improves readability. |

---

## 2. Mobile & bottom nav

- **Touch targets:** Ensure all interactive elements (buttons, links, tabs) are at least **44×44px** on mobile.
- **Safe areas:** Keep testing sticky header/footer and bottom nav with notches/home indicators (`safe-area-inset`).
- **No horizontal scroll:** Verify every page at **375px** width has no horizontal overflow.
- **Bottom nav:** Already has Today | Scan | Me; ensure active state is clear and content always matches the selected tab (see P0 above).

---

## 3. UX quick wins

- **Scan page:** Move disclaimer below the upload area and reduce opacity so it doesn’t compete with the CTA.
- **Empty states:** Add clear CTAs: History → “Start first scan”; Favorites → “Discover products”.
- **404 page:** Add a friendly illustration and a CTA (e.g. “Go home” or “Start a scan”).
- **Auth:** Make the Google OAuth button more prominent (size/contrast).
- **Contact form:** Improve field spacing and show a clear success message after submit.

---

## 4. Design consistency (from backlog)

- Replace remaining hardcoded colors with design tokens (`var(--primary)`, etc.).
- Use `var(--spacing-*)` for spacing instead of raw `px` where possible.
- Align card shadows (`var(--shadow-sm)`, etc.) across Dashboard, Home, and Scan.
- Homepage: nav active state 3–4px underline; one FAQ accordion icon (› or +); “AS FEATURED IN” with real logos or remove.
- Dashboard: align stats card styling; replace “Product Image” placeholder with a proper graphic.

---

## 5. Accessibility

- Add `aria-current="page"` to active nav links (some already have it; audit all).
- Ensure every image has meaningful `alt` text.
- Add `role` and `aria-label` to icon-only buttons.
- Check color contrast (WCAG AA) on text/background pairs.
- Ensure modals trap focus and restore it on close.
- Run an axe-core (or similar) audit and fix reported issues.

---

## 6. Performance

- Lazy-load below-the-fold images and use `loading="lazy"` on `<img>` where appropriate.
- Add skeleton loaders for async sections (dashboard, recommendations, history).
- Debounce search/filter inputs (ingredients, product search).
- Review bundle chunks and consider manual splits for heavy routes (e.g. Scan, Admin).

---

## 7. Code & architecture

- Replace `any` with proper TypeScript types where still used.
- Consolidate duplicate API fetch logic into shared hooks or services.
- Add error boundaries around major sections (Scan, Dashboard, Analysis results).
- Add JSDoc to public functions/components for maintainability.

---

## 8. Already done (reference)

- Auth left-panel text contrast; hero blobs; How It Works illustrations; Scan upload area visibility; footer “API connected” hidden when connected.
- Today page: lastScanDate from scan history; skin score only from completed scans; safe-area and overflow fixes; recommended products grid (3 cards, horizontal scroll).
- Analysis Results: label fixes (e.g. Dark_circles → Dark Circles); disclaimer contrast; score scale clarity; hide failed scans in comparison.
- Product Scanner: barcode→product detail fix; remove black device frame; “Recently Scanned” wrapping.
- Dashboard: empty-state CTAs for 0 Products / 0 Routines.

---

## How to use this

- **Sprint planning:** Pick 1–2 items from §1 (bugs), then a few from §2–3 (mobile/UX).
- **Backlog:** See `docs/12-tasks/IMPROVEMENT-BACKLOG.md` and audit docs under `docs/08-audits/` for more detail.
- **Improvement agent:** Uses the backlog; can also pull from this doc for daily tasks.
