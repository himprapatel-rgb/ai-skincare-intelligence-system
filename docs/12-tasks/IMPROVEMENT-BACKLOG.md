# Improvement Backlog

**Design & architecture improvements** – worked on continuously by the Improvement Agent.  
No new features; only polish, consistency, and quality.

---

## Design

- [ ] Replace any remaining hardcoded colors with design tokens (`var(--primary)`, etc.)
- [ ] Replace hardcoded `px` spacing with `var(--spacing-*)` in components
- [ ] Ensure all buttons have consistent `min-height: 44px` for touch targets
- [ ] Add `:focus-visible` styles where missing
- [ ] Audit and align card shadows (`var(--shadow-sm)`, etc.)
- [ ] Ensure hero sections use `var(--spacing-*)` for padding
- [ ] Add `prefers-reduced-motion` where animations exist
- [ ] Ensure form labels are associated (aria-label or htmlFor)
- [ ] Align typography scales (`--font-size-*`, `--line-height-*`) across pages
- [ ] Add skeleton loaders for async content sections

## Accessibility

- [ ] Add `aria-current="page"` to active nav links
- [ ] Ensure images have meaningful `alt` text
- [ ] Add `role` and `aria-label` to icon-only buttons
- [ ] Check color contrast (WCAG AA) on text/background pairs
- [ ] Ensure modals trap focus and restore on close
- [ ] Add skip links where long nav exists
- [ ] Run axe-core audit and fix reported issues

## Performance

- [ ] Lazy-load below-fold images
- [ ] Add `loading="lazy"` to img tags
- [ ] Review and optimize bundle chunks (manual splits)
- [ ] Memoize expensive computations in components
- [ ] Debounce search/filter inputs

## Architecture & Code Quality

- [ ] Extract repeated patterns into shared components
- [ ] Consolidate duplicate API fetch logic
- [ ] Add error boundaries around major sections
- [ ] Replace `any` with proper types in TypeScript
- [ ] Add JSDoc to public functions/components
- [ ] Remove unused imports and dead code

## Mobile / Responsive

- [ ] Verify all pages at 375px have no horizontal scroll
- [ ] Ensure touch targets ≥ 44px on mobile
- [ ] Test sticky headers/footers with `safe-area-inset`
- [ ] Verify bottom nav doesn't overlap content

---

## From UI/UX Audit 2026

*See [UI-UX-Design-Audit-2026.md](../08-audits/UI-UX-Design-Audit-2026.md) | [Detailed Feb](../08-audits/UI-UX-Design-Audit-Detailed-2026.md) | [Product Scanner](../08-audits/Product-Scanner-Audit-2026.md) | [My Shelf](../08-audits/My-Shelf-Audit-2026.md)*

- [ ] Homepage: Fix CTA button hierarchy (secondary = ghost)
- [ ] Homepage: Nav active state 3-4px underline (not 2px)
- [ ] Homepage: Align card shadows across feature + stats cards
- [ ] Homepage: Pick one FAQ accordion icon (› or +)
- [ ] Homepage: Replace "AS FEATURED IN" text with actual brand logos (critical)
- [ ] Homepage: Subheadline contrast WCAG AA (20px or darken)
- [ ] Homepage: Trust badge icons—filled not outlined, card order
- [ ] Scan: Add 12px spacing to instructions checklist
- [ ] Scan: Move disclaimer below upload, reduce opacity
- [ ] Dashboard: Align stats card styling (consistent fill/outline)
- [ ] Dashboard: Fix "Product Image" placeholder—use proper graphic
- [ ] Dashboard: Add empty-state CTAs for 0 Products / 0 Routines
- [ ] Recommendations: Add star icons to ratings
- [ ] My Shelf: Fix duplicate product entries (data bug)
- [ ] My Shelf: Make filter counts badges
- [ ] Product Scanner: Remove redundant "Click Start Camera" text
- [ ] Product Scanner: Strengthen tab active state
- [x] **Product Scanner: Fix scanner→product detail data mismatch** (resolved: barcode link + catalog/products multi-source fetch)
- [ ] Product Scanner: Remove black device frame; center Start Camera
- [ ] Product Scanner: Simplify "EAN-13, UPC..." to "Works with most barcodes"
- [x] Product Scanner: Fix "Recently Scanned" text wrapping bug
- [ ] Homepage: Stats—star icons for rating, animated counters
- [ ] Homepage: How It Works arrows 32px, fix overlap
- [ ] History: Add "Start first scan" empty-state CTA
- [ ] Favorites: Add "Discover products" empty-state CTA
- [ ] Auth: Improve Google OAuth button prominence
- [ ] Profile: Collapsible/accordion for long sections
- [ ] Contact: Form field spacing and success message
- [ ] Privacy/Terms: Sticky TOC, improve scannability
- [ ] Data Export: Clear data scope explanation
- [ ] Admin: Table density, bulk actions
- [ ] Ingredient Dictionary: Search empty state
- [ ] 404: Friendly illustration and CTA

---

**Usage:** Improvement Agent picks one item per day, creates an Issue. Cursor or human implements.
