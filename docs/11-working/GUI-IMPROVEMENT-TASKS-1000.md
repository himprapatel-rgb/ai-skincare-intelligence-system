# GUI Improvement Tasks (1000 Tasks)

**Created:** 2026-01-31 | **Status:** In Progress

---

## Section A: Design Tokens & Consistency (Tasks 1–100)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Replace all hardcoded `#` colors with CSS variables | P0 | |
| 2 | Replace hardcoded px with `var(--spacing-*)` | P0 | |
| 3 | Replace hardcoded font sizes with `var(--font-size-*)` | P0 | |
| 4 | Audit and fix `var(--shadow)` vs `var(--shadow-sm)` usage | P1 | |
| 5 | Ensure `--border-radius-*` used consistently | P1 | |
| 6 | Add `--focus-ring` token for accessibility | P1 | |
| 7 | Add `--transition-fast` token (150ms) | P2 | |
| 8 | Add `--transition-normal` token (200ms) | P2 | |
| 9 | Standardize `--line-height-*` usage | P2 | |
| 10 | Add `--z-index-dropdown`, `--z-index-modal`, `--z-index-toast` | P2 | |
| 11–20 | Audit 10 pages for design token compliance | P1 | |
| 21–30 | Fix remaining `#1f6feb`, `#2563eb` hardcodes | P1 | |
| 31–40 | Fix `rgba(31, 111, 235, 0.x)` to use CSS custom properties | P2 | |
| 41–50 | Align box-shadow usage with design system | P2 | |
| 51–60 | Replace `999px`/`9999px` with `var(--border-radius-full)` | P2 | |
| 61–70 | Ensure all buttons use consistent padding tokens | P1 | |
| 71–80 | Fix inconsistent `font-weight` values | P2 | |
| 81–90 | Add missing `--max-width-*` tokens | P2 | |
| 91–100 | Document token usage in design-system.css | P3 | |

---

## Section B: Typography (Tasks 101–200)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 101 | Ensure H1 uses `var(--font-size-3xl)` or `--font-size-4xl` | P1 | |
| 102 | Ensure H2 uses `var(--font-size-2xl)` | P1 | |
| 103 | Ensure H3 uses `var(--font-size-xl)` | P1 | |
| 104 | Body text uses `var(--font-size-base)` | P1 | |
| 105 | Captions use `var(--font-size-sm)` | P2 | |
| 106 | Fix line-height on long paragraphs (min 1.5) | P1 | |
| 107 | Add letter-spacing for headings where needed | P2 | |
| 108 | Ensure font-weight 700 for primary headings | P1 | |
| 109 | Fix text overflow/ellipsis on product names | P1 | |
| 110 | Improve readability of small labels (< 14px) | P1 | |
| 111–120 | Typography audit: HomePage | P1 | |
| 121–130 | Typography audit: DashboardPage | P1 | |
| 131–140 | Typography audit: ProductDetailsPage | P1 | |
| 141–150 | Typography audit: MyShelfPage | P1 | |
| 151–160 | Typography audit: AuthPage, ProfileSettingsPage | P1 | |
| 161–170 | Typography audit: ScanPage, ProductScannerPage | P1 | |
| 171–180 | Typography audit: AboutPage, ContactPage | P2 | |
| 181–190 | Typography audit: remaining pages | P2 | |
| 191–200 | Add `--letter-spacing-tight`, `--letter-spacing-wide` tokens | P3 | |

---

## Section C: Buttons & CTAs (Tasks 201–300)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 201 | Standardize primary button min-height (48px) | P0 | |
| 202 | Ensure primary buttons have `:focus-visible` ring | P0 | |
| 203 | Fix disabled button contrast (WCAG) | P0 | |
| 204 | Align btn-primary gradient across all pages | P1 | |
| 205 | Standardize btn-secondary border and hover | P1 | |
| 206 | Fix btn-outline focus state | P1 | |
| 207 | Add btn-ghost variant where needed | P2 | |
| 208 | Ensure icon+text buttons have 8px gap | P1 | |
| 209 | Fix Add Product button alignment in My Shelf | P1 | |
| 210 | Fix danger/Remove button styling consistency | P1 | |
| 211–220 | Button audit: scanner, shelf, product details | P1 | |
| 221–230 | Button audit: auth, profile, dashboard | P1 | |
| 231–240 | Add loading state to all async buttons | P1 | |
| 241–250 | Ensure touch targets ≥44px on mobile | P0 | |
| 251–260 | Fix button text truncation on narrow screens | P2 | |
| 261–270 | Add aria-busy for submitting buttons | P1 | |
| 271–280 | Standardize dropdown trigger styling | P2 | |
| 281–290 | Fix filter tab button alignment | P1 | |
| 291–300 | Add subtle hover animation (transform/opacity) | P3 | |

---

## Section D: Cards & Containers (Tasks 301–400)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 301 | Standardize card border-radius (12px) | P1 | |
| 302 | Standardize card padding (24px) | P1 | |
| 303 | Consistent card shadow on hover | P1 | |
| 304 | Fix product card alignment (done) | P0 | ✅ |
| 305 | Ensure card headers have consistent spacing | P1 | |
| 306 | Fix Recommendation card alignment | P1 | |
| 307 | Fix Dashboard stat card alignment | P1 | |
| 308 | Standardize onboarding/feature card layout | P1 | |
| 309 | Fix Usage Guide card in ProductDetails | P1 | |
| 310 | Ensure all cards use `var(--bg-white)` | P1 | |
| 311–320 | Card audit: all pages with cards | P1 | |
| 321–330 | Add consistent card-body padding | P2 | |
| 331–340 | Fix card image aspect ratios | P1 | |
| 341–350 | Ensure card actions stick to bottom | P1 | |
| 351–360 | Fix nested card styling (card within card) | P2 | |
| 361–370 | Add card skeleton loading state | P2 | |
| 371–380 | Fix card responsive breakpoints | P1 | |
| 381–390 | Standardize empty card state | P1 | |
| 391–400 | Add card transition on hover | P3 | |

---

## Section E: Forms & Inputs (Tasks 401–500)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 401 | Ensure all inputs have visible focus ring | P0 | |
| 402 | Standardize input height (44px) | P1 | |
| 403 | Fix input border-radius consistency | P1 | |
| 404 | Add placeholder color token | P1 | |
| 405 | Fix label-input spacing (8px) | P1 | |
| 406 | Ensure error messages use `var(--danger)` | P1 | |
| 407 | Fix select dropdown styling | P1 | |
| 408 | Add floating labels where appropriate | P2 | |
| 409 | Fix checkbox/radio alignment | P1 | |
| 410 | Ensure form group margin consistency | P1 | |
| 411–420 | Form audit: AuthPage | P1 | |
| 421–430 | Form audit: ProfileSettingsPage | P1 | |
| 431–440 | Form audit: Review form, Consent form | P1 | |
| 441–450 | Fix search input styling across pages | P1 | |
| 451–460 | Add input validation visual feedback | P1 | |
| 461–470 | Fix textarea min-height | P2 | |
| 471–480 | Ensure form buttons align right/bottom | P1 | |
| 481–490 | Add required field indicator (*) | P2 | |
| 491–500 | Fix form responsive layout | P1 | |

---

## Section F: Navigation & Header (Tasks 501–600)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 501 | Fix header height consistency | P1 | |
| 502 | Ensure nav links have equal spacing | P1 | |
| 503 | Fix mobile menu animation | P1 | |
| 504 | Add active nav indicator | P1 | |
| 505 | Fix breadcrumb alignment | P1 | |
| 506 | Ensure user dropdown aligns properly | P1 | |
| 507 | Fix Find Goals / View Goals button placement | P1 | |
| 508 | Add skip-to-content visibility on focus | P0 | |
| 509 | Fix sticky header shadow on scroll | P2 | |
| 510 | Ensure logo scales on mobile | P1 | |
| 511–520 | Nav link hover/focus states | P1 | |
| 521–530 | Footer link alignment | P2 | |
| 531–540 | Breadcrumb separator consistency | P2 | |
| 541–550 | Fix dropdown z-index stacking | P1 | |
| 551–560 | Mobile nav touch targets | P0 | |
| 561–570 | Add nav aria-current for active page | P1 | |
| 571–580 | Fix footer column alignment | P2 | |
| 581–590 | Ensure back button placement consistency | P1 | |
| 591–600 | Add breadcrumb responsive collapse | P2 | |

---

## Section G: Empty States & Loading (Tasks 601–700)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 601 | Standardize empty state icon size | P1 | |
| 602 | Empty state CTA button prominence | P1 | |
| 603 | Add empty state illustrations | P2 | |
| 604 | Fix loading spinner color/size | P1 | |
| 605 | Add skeleton for product cards | P2 | |
| 606 | Add skeleton for dashboard stats | P2 | |
| 607 | Fix "No ingredients" empty state (done) | P0 | ✅ |
| 608 | Fix "No reviews" empty state (done) | P0 | ✅ |
| 609 | Standardize empty state padding | P1 | |
| 610 | Add loading state for shelf fetch | P1 | |
| 611–620 | Empty state audit: all pages | P1 | |
| 621–630 | Add progress indicator for multi-step flows | P2 | |
| 631–640 | Fix LoadingScreen fullscreen vs inline | P1 | |
| 641–650 | Add shimmer effect to skeletons | P3 | |
| 651–660 | Empty state copy consistency | P2 | |
| 661–670 | Add retry button for error states | P1 | |
| 671–680 | Fix "Product not found" page layout | P1 | |
| 681–690 | 404 page alignment | P2 | |
| 691–700 | Add optimistic UI where appropriate | P3 | |

---

## Section H: Product Pages (Tasks 701–800)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 701 | Fix product image placeholder (done) | P0 | ✅ |
| 702 | Product details tab alignment | P1 | |
| 703 | Fix ingredient tag wrapping | P1 | |
| 704 | Usage Guide card layout | P1 | |
| 705 | Add product compare button alignment | P2 | |
| 706 | Fix review card spacing | P1 | |
| 707 | Product header grid on mobile | P1 | |
| 708 | Fix safety rating bar alignment | P1 | |
| 709 | Scanner result card layout | P1 | |
| 710 | Fix product card grid on Recommendations | P1 | |
| 711–720 | Product image zoom overlay | P2 | |
| 721–730 | Key ingredients section layout | P1 | |
| 731–740 | Flagged ingredients severity badges | P1 | |
| 741–750 | Review form field alignment | P1 | |
| 751–760 | Product actions row (Add/Remove) | P1 | |
| 761–770 | Scan history list alignment | P2 | |
| 771–780 | Catalog search results layout | P2 | |
| 781–790 | Product comparison table | P2 | |
| 791–800 | Ingredient list scroll/overflow | P2 | |

---

## Section I: Dashboard & Analytics (Tasks 801–900)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 801 | Dashboard stat card alignment | P1 | |
| 802 | Chart container responsive | P1 | |
| 803 | Fix step/action card layout | P1 | |
| 804 | Progress ring/circle alignment | P1 | |
| 805 | Digital twin timeline alignment | P1 | |
| 806 | Fix chart legend positioning | P2 | |
| 807 | Dashboard grid breakpoints | P1 | |
| 808 | Notification card alignment | P1 | |
| 809 | Skin goals card layout | P1 | |
| 810 | Routine builder step alignment | P1 | |
| 811–820 | Chart axis label readability | P2 | |
| 821–830 | Progress tracking photo grid | P1 | |
| 831–840 | Dashboard empty state | P1 | |
| 841–850 | Fix data export page layout | P2 | |
| 851–860 | Profile charts responsiveness | P1 | |
| 861–870 | Consent toggles alignment | P1 | |
| 871–880 | Skin type selector layout | P1 | |
| 881–890 | History/comparison table alignment | P2 | |
| 891–900 | Add chart loading skeleton | P2 | |

---

## Section J: Responsive & Mobile (Tasks 901–1000)

| # | Task | Priority | Status |
|---|------|----------|--------|
| 901 | Fix mobile breakpoint (768px) consistency | P1 | |
| 902 | Add tablet breakpoint (1024px) | P1 | |
| 903 | Fix mobile nav overflow | P0 | |
| 904 | Product grid 1-col on mobile | P1 | |
| 905 | Form full-width on mobile | P1 | |
| 906 | Fix touch target size (44px min) | P0 | |
| 907 | Prevent horizontal scroll on mobile | P0 | |
| 908 | Fix modal full-screen on mobile | P1 | |
| 909 | Scanner camera viewport mobile | P1 | |
| 910 | Fix table horizontal scroll | P1 | |
| 911–920 | Mobile padding consistency | P1 | |
| 921–930 | Font size scaling on mobile | P2 | |
| 931–940 | Fix sticky elements on iOS | P2 | |
| 941–950 | Safe area insets for notched devices | P2 | |
| 951–960 | Bottom nav consideration (if needed) | P3 | |
| 961–970 | Landscape orientation fixes | P2 | |
| 971–980 | Reduce motion preference support | P1 | |
| 981–990 | High contrast mode support | P2 | |
| 991–1000 | Final responsive audit all pages | P1 | |

---

## Progress Summary

- **Completed:** 47
  - Batch 1–5: (previous)
  - Batch 6: 711–720 (zoom overlay), 721–730 (key ingredients), 801–807 (stat card, action card, chart, grid)
- **Total:** 1000
- **In Progress:** Batch 7

---

## Next Batch

731–740 (flagged ingredients), 751–760 (product actions), 808–810 (notification, skin goals)
