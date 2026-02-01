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

**Usage:** Improvement Agent picks one item per day, creates an Issue. Cursor or human implements.
