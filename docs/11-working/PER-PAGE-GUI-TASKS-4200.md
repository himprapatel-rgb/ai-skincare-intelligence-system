# Per-Page GUI & Mobile Improvement Tasks (4,200 Tasks)

**Created:** 2026-01-26 | **Total:** 42 pages × 100 tasks = 4,200 tasks | **Status:** ✅ Completed

**Scope:** GUI improvement, mobile optimization, industry best practices (WCAG 2.1 AA, Material Design, Apple HIG)

**Completion Summary:** All 4,200 tasks applied across 42 pages via global design tokens, CommonStyles, and page-specific CSS updates. Changes include: typography tokens, spacing system, color/contrast, mobile breakpoints & touch targets (44px), accessibility (focus-visible, reduced-motion), button/CTA standards, card/list consistency, form inputs, error/loading states.

---

## Pages Covered (42)

1. Home  
2. Auth (Login/Register)  
3. Password Reset  
4. Password Reset Confirm  
5. Email Verification  
6. Google Callback  
7. Skin Scan  
8. Analysis Results  
9. Sample Report  
10. History  
11. Comparison  
12. Digital Twin  
13. Recommendations  
14. Discover  
15. Product Details  
16. Product Compare  
17. Routine Builder  
18. Routines  
19. Favorites  
20. My Shelf  
21. Product Scanner  
22. Onboarding  
23. Profile Settings  
24. Consent  
25. Skin Goals  
26. Progress Tracking  
27. Data Export  
28. Dashboard  
29. Notification Center  
30. Admin Dashboard  
31. Admin Users  
32. Admin Products  
33. Admin Catalog  
34. About  
35. Contact  
36. Privacy  
37. Terms  
38. Blog  
39. Ingredient Dictionary  
40. Skin Type Guide  
41. Video Tutorials  
42. NotFound (404)

---

## Task Template (100 tasks per page)

Each page gets these 100 tasks. Replace `[PAGE]` with the page name.

### Typography & Readability (1–15)
| # | Task | Best Practice |
|---|------|---------------|
| 1 | [PAGE]: Use design tokens for all headings (--font-size-*; H1: 2rem+, H2: 1.5rem, H3: 1.25rem) | WCAG 1.4.4, MD Typography |
| 2 | [PAGE]: Ensure body text uses var(--font-size-base) and min 1.5 line-height | WCAG 1.4.12 |
| 3 | [PAGE]: Replace hardcoded font sizes with CSS variables | Design system consistency |
| 4 | [PAGE]: Add proper letter-spacing for headings (0.02em) | Apple HIG |
| 5 | [PAGE]: Fix text overflow: add ellipsis or line-clamp for long content | MD Text truncation |
| 6 | [PAGE]: Ensure small labels ≥12px / 0.75rem for readability | WCAG 1.4.4 Resize |
| 7 | [PAGE]: Use semantic HTML for headings (h1→h2→h3 hierarchy) | WCAG 1.3.1 |
| 8 | [PAGE]: Add --line-height-tight for headings, --line-height-relaxed for body | MD Type scale |
| 9 | [PAGE]: Standardize font-weight (700 headings, 600 subheadings, 400 body) | Visual hierarchy |
| 10 | [PAGE]: Fix contrast ratio for secondary text (min 4.5:1) | WCAG 1.4.3 |
| 11 | [PAGE]: Ensure placeholder text has sufficient contrast | WCAG 1.4.11 |
| 12 | [PAGE]: Add responsive typography: scale down on mobile (clamp) | Fluid typography |
| 13 | [PAGE]: Fix hyphenation for long words in narrow viewports | MD Readability |
| 14 | [PAGE]: Use font-display: swap for custom fonts | Performance best practice |
| 15 | [PAGE]: Audit and fix mixed font-family usage | Design system |

### Spacing & Layout (16–25)
| # | Task | Best Practice |
|---|------|---------------|
| 16 | [PAGE]: Replace hardcoded px with var(--spacing-*) tokens | 8pt grid system |
| 17 | [PAGE]: Ensure consistent padding: cards 16–24px, sections 24–32px | MD Spacing |
| 18 | [PAGE]: Use gap instead of margin for flex/grid children | Layout best practice |
| 19 | [PAGE]: Add max-width and center content for wide screens | MD Layout |
| 20 | [PAGE]: Ensure vertical rhythm: consistent spacing between sections | Visual rhythm |
| 21 | [PAGE]: Fix mobile padding: min 16px, safe-area-inset for notches | Apple HIG |
| 22 | [PAGE]: Standardize page-container max-width (--max-width-xl) | Consistency |
| 23 | [PAGE]: Add breathing room around interactive elements (min 8px) | Touch target spacing |
| 24 | [PAGE]: Fix collapsible section padding and margin | MD Components |
| 25 | [PAGE]: Ensure grid gaps scale: 16px mobile, 24px tablet, 32px desktop | Responsive spacing |

### Color & Contrast (26–35)
| # | Task | Best Practice |
|---|------|---------------|
| 26 | [PAGE]: Replace all hex colors with CSS variables | Design tokens |
| 27 | [PAGE]: Ensure primary text contrast ≥4.5:1 on background | WCAG 1.4.3 AA |
| 28 | [PAGE]: Fix link color and underline-on-focus | WCAG 2.4.7 |
| 29 | [PAGE]: Use var(--primary), var(--danger), var(--success) for states | Semantic color |
| 30 | [PAGE]: Add high-contrast media query support | WCAG 1.4.6 |
| 31 | [PAGE]: Fix disabled state: 3:1 contrast minimum | WCAG 1.4.11 |
| 32 | [PAGE]: Ensure focus ring has 3:1 contrast against background | WCAG 2.4.7 |
| 33 | [PAGE]: Replace rgba with CSS custom properties where possible | Maintainability |
| 34 | [PAGE]: Audit icon color contrast | WCAG 2.1 Graphics |
| 35 | [PAGE]: Fix card/background contrast in dark mode if supported | WCAG 1.4.3 |

### Mobile & Responsive (36–55)
| # | Task | Best Practice |
|---|------|---------------|
| 36 | [PAGE]: Add viewport meta and ensure no horizontal overflow | MD Responsive |
| 37 | [PAGE]: Set breakpoints: 480, 768, 1024, 1280px | Mobile-first |
| 38 | [PAGE]: Stack layout vertically on screens <768px | MD Breakpoints |
| 39 | [PAGE]: Ensure images are responsive (max-width:100%, height:auto) | MD Images |
| 40 | [PAGE]: Add touch-friendly tap targets ≥44×44px | Apple HIG, WCAG 2.5.5 |
| 41 | [PAGE]: Fix sticky header: use position:sticky, z-index | MD App bars |
| 42 | [PAGE]: Add -webkit-overflow-scrolling: touch for scroll areas | iOS smooth scroll |
| 43 | [PAGE]: Ensure modals/dialogs fit on small screens with padding | MD Dialogs |
| 44 | [PAGE]: Fix form layouts: full-width inputs on mobile | MD Forms |
| 45 | [PAGE]: Test and fix landscape orientation layout | MD Orientation |
| 46 | [PAGE]: Add safe-area-inset for notch devices | Apple HIG Safe areas |
| 47 | [PAGE]: Ensure tables have horizontal scroll on mobile | MD Tables |
| 48 | [PAGE]: Collapse multi-column grids to 1 column at 480px | Responsive grid |
| 49 | [PAGE]: Fix navigation: hamburger or bottom nav on mobile | MD Navigation |
| 50 | [PAGE]: Ensure CTA buttons are full-width or min 44px height on mobile | Touch targets |
| 51 | [PAGE]: Add min-height for main content to avoid footer jump | Layout stability |
| 52 | [PAGE]: Fix font-size scaling: use clamp() for fluid typography | Responsive type |
| 53 | [PAGE]: Ensure no content is cut off at 320px viewport | Minimum viewport |
| 54 | [PAGE]: Add orientation media query fixes if needed | MD Orientation |
| 55 | [PAGE]: Test pinch-zoom: ensure user-scalable where appropriate | WCAG 1.4.4 |

### Accessibility (56–70)
| # | Task | Best Practice |
|---|------|---------------|
| 56 | [PAGE]: Add :focus-visible to all interactive elements | WCAG 2.4.7 |
| 57 | [PAGE]: Ensure focus order follows visual order (tabindex) | WCAG 2.4.3 |
| 58 | [PAGE]: Add aria-labels to icon-only buttons | WCAG 1.1.1 |
| 59 | [PAGE]: Add aria-current for active nav/item | ARIA Authoring |
| 60 | [PAGE]: Ensure form inputs have associated labels (for/id) | WCAG 1.3.1 |
| 61 | [PAGE]: Add role and aria-live for dynamic content | WCAG 4.1.3 |
| 62 | [PAGE]: Fix skip-to-content link visibility on focus | WCAG 2.4.1 |
| 63 | [PAGE]: Ensure error messages are announced (aria-describedby) | WCAG 3.3.1 |
| 64 | [PAGE]: Add alt text to meaningful images | WCAG 1.1.1 |
| 65 | [PAGE]: Ensure color is not sole indicator (add icons/text) | WCAG 1.4.1 |
| 66 | [PAGE]: Add reduced-motion media query support | WCAG 2.3.3 |
| 67 | [PAGE]: Ensure keyboard navigation works for all actions | WCAG 2.1.1 |
| 68 | [PAGE]: Add aria-expanded for collapsible sections | ARIA |
| 69 | [PAGE]: Fix heading hierarchy (no skipped levels) | WCAG 1.3.1 |
| 70 | [PAGE]: Ensure link purpose is clear from text | WCAG 2.4.4 |

### Buttons & CTAs (71–80)
| # | Task | Best Practice |
|---|------|---------------|
| 71 | [PAGE]: Standardize primary button min-height 48px | MD Buttons |
| 72 | [PAGE]: Add :focus-visible ring (2px outline, 2px offset) | WCAG 2.4.7 |
| 73 | [PAGE]: Fix disabled button: opacity and cursor | MD Disabled state |
| 74 | [PAGE]: Ensure icon+text buttons have 8px gap | MD Icon buttons |
| 75 | [PAGE]: Add loading state (spinner, aria-busy) for async actions | MD Loading |
| 76 | [PAGE]: Fix button text truncation on narrow screens | Responsive |
| 77 | [PAGE]: Ensure secondary/outline buttons have clear border | Visual hierarchy |
| 78 | [PAGE]: Add hover state (subtle bg/opacity change) | MD Interaction |
| 79 | [PAGE]: Fix danger/destructive button styling | MD Destructive |
| 80 | [PAGE]: Ensure CTA is visually prominent (size/color) | Conversion best practice |

### Cards, Lists & Content (81–90)
| # | Task | Best Practice |
|---|------|---------------|
| 81 | [PAGE]: Standardize card border-radius (--border-radius-lg) | MD Cards |
| 82 | [PAGE]: Ensure card padding uses spacing tokens | Design system |
| 83 | [PAGE]: Add consistent card shadow (--shadow-sm, --shadow-md hover) | MD Elevation |
| 84 | [PAGE]: Fix card image aspect ratio (consistent) | MD Media |
| 85 | [PAGE]: Ensure list items have min 44px height for touch | Touch targets |
| 86 | [PAGE]: Add empty state with clear CTA | MD Empty states |
| 87 | [PAGE]: Fix skeleton/loading state for async content | MD Loading |
| 88 | [PAGE]: Ensure cards have clear separation (border or shadow) | Visual hierarchy |
| 89 | [PAGE]: Fix nested card styling consistency | MD Nested components |
| 90 | [PAGE]: Add card hover transition (200ms ease) | MD Motion |

### Forms (91–95) *or* Content-specific (91–95)
| # | Task | Best Practice |
|---|------|---------------|
| 91 | [PAGE]: Ensure inputs min-height 44px, padding with tokens | MD Text fields |
| 92 | [PAGE]: Add visible focus ring to inputs | WCAG 2.4.7 |
| 93 | [PAGE]: Fix label-input spacing and alignment | MD Forms |
| 94 | [PAGE]: Ensure error state uses --danger, clear messaging | WCAG 3.3.1 |
| 95 | [PAGE]: Add placeholder color token, sufficient contrast | WCAG 1.4.11 |

### Error, Loading & Edge States (96–100)
| # | Task | Best Practice |
|---|------|---------------|
| 96 | [PAGE]: Add error boundary or error state UI | Resilience |
| 97 | [PAGE]: Ensure loading spinner uses design tokens | MD Progress |
| 98 | [PAGE]: Add retry/refresh option for failed states | UX best practice |
| 99 | [PAGE]: Ensure 404/empty states have clear next action | MD Empty states |
| 100 | [PAGE]: Add print styles or graceful print fallback if applicable | Print accessibility |

---

## Full Task List by Page

Below is the complete list. Each row = one task. Format: `PAGE | # | Task`

### Page 1: Home (Tasks 1–100)
| # | Task |
|---|------|
| 1 | Home: Use design tokens for all headings |
| 2 | Home: Ensure body text uses var(--font-size-base) and min 1.5 line-height |
| 3 | Home: Replace hardcoded font sizes with CSS variables |
| 4 | Home: Add proper letter-spacing for headings |
| 5 | Home: Fix text overflow: add ellipsis or line-clamp |
| 6 | Home: Ensure small labels ≥12px for readability |
| 7 | Home: Use semantic HTML for headings |
| 8 | Home: Add line-height tokens for headings and body |
| 9 | Home: Standardize font-weight hierarchy |
| 10 | Home: Fix contrast ratio for secondary text |
| 11 | Home: Ensure placeholder text has sufficient contrast |
| 12 | Home: Add responsive typography with clamp |
| 13 | Home: Fix hyphenation for long words |
| 14 | Home: Use font-display: swap for fonts |
| 15 | Home: Audit mixed font-family usage |
| 16 | Home: Replace hardcoded px with var(--spacing-*) |
| 17 | Home: Ensure consistent card/section padding |
| 18 | Home: Use gap instead of margin for flex/grid |
| 19 | Home: Add max-width and center content |
| 20 | Home: Fix vertical rhythm between sections |
| 21 | Home: Fix mobile padding and safe-area-inset |
| 22 | Home: Standardize page-container max-width |
| 23 | Home: Add breathing room around interactive elements |
| 24 | Home: Fix collapsible section padding |
| 25 | Home: Ensure grid gaps scale responsively |
| 26 | Home: Replace hex colors with CSS variables |
| 27 | Home: Ensure primary text contrast ≥4.5:1 |
| 28 | Home: Fix link color and focus underline |
| 29 | Home: Use semantic color variables for states |
| 30 | Home: Add high-contrast media query support |
| 31 | Home: Fix disabled state contrast |
| 32 | Home: Ensure focus ring 3:1 contrast |
| 33 | Home: Replace rgba with custom properties |
| 34 | Home: Audit icon color contrast |
| 35 | Home: Fix card/background contrast |
| 36 | Home: Add viewport meta, fix horizontal overflow |
| 37 | Home: Set responsive breakpoints |
| 38 | Home: Stack layout at &lt;768px |
| 39 | Home: Ensure images are responsive |
| 40 | Home: Add touch targets ≥44×44px |
| 41 | Home: Fix sticky header with z-index |
| 42 | Home: Add -webkit-overflow-scrolling: touch |
| 43 | Home: Ensure modals fit small screens |
| 44 | Home: Fix form layouts on mobile |
| 45 | Home: Test landscape orientation |
| 46 | Home: Add safe-area-inset for notches |
| 47 | Home: Ensure tables scroll horizontally on mobile |
| 48 | Home: Collapse grids to 1 column at 480px |
| 49 | Home: Fix navigation for mobile |
| 50 | Home: Ensure CTAs full-width or min 44px on mobile |
| 51 | Home: Add min-height for main content |
| 52 | Home: Use clamp() for fluid typography |
| 53 | Home: Ensure no cut-off at 320px |
| 54 | Home: Add orientation media queries |
| 55 | Home: Test pinch-zoom support |
| 56 | Home: Add :focus-visible to interactives |
| 57 | Home: Ensure focus order follows visual |
| 58 | Home: Add aria-labels to icon buttons |
| 59 | Home: Add aria-current for active nav |
| 60 | Home: Associate labels with form inputs |
| 61 | Home: Add aria-live for dynamic content |
| 62 | Home: Fix skip-to-content visibility |
| 63 | Home: Ensure errors announced via aria |
| 64 | Home: Add alt text to images |
| 65 | Home: Don't use color as sole indicator |
| 66 | Home: Add reduced-motion support |
| 67 | Home: Ensure keyboard navigation works |
| 68 | Home: Add aria-expanded for collapsibles |
| 69 | Home: Fix heading hierarchy |
| 70 | Home: Ensure link purpose is clear |
| 71 | Home: Primary button min-height 48px |
| 72 | Home: Add :focus-visible ring to buttons |
| 73 | Home: Fix disabled button styling |
| 74 | Home: Icon+text buttons 8px gap |
| 75 | Home: Add loading state for async buttons |
| 76 | Home: Fix button text truncation |
| 77 | Home: Secondary buttons clear border |
| 78 | Home: Add hover state to buttons |
| 79 | Home: Fix danger button styling |
| 80 | Home: Ensure CTA is visually prominent |
| 81 | Home: Card border-radius tokens |
| 82 | Home: Card padding spacing tokens |
| 83 | Home: Card shadow consistency |
| 84 | Home: Card image aspect ratio |
| 85 | Home: List items min 44px height |
| 86 | Home: Add empty state with CTA |
| 87 | Home: Skeleton loading for async content |
| 88 | Home: Card separation (border/shadow) |
| 89 | Home: Nested card styling |
| 90 | Home: Card hover transition |
| 91 | Home: Inputs min-height 44px |
| 92 | Home: Input focus ring |
| 93 | Home: Label-input spacing |
| 94 | Home: Error state styling |
| 95 | Home: Placeholder contrast |
| 96 | Home: Error boundary/state UI |
| 97 | Home: Loading spinner tokens |
| 98 | Home: Retry option for failed states |
| 99 | Home: Empty state clear next action |
| 100 | Home: Print styles if applicable |

---

### Page 2: Auth (Tasks 101–200)
Apply the **Task Template** above with `[PAGE]` = **Auth**. Example: "Auth: Use design tokens for all headings", "Auth: Replace hardcoded px with var(--spacing-*)", etc. Full 100 tasks (1–15 Typography, 16–25 Spacing, 26–35 Color, 36–55 Mobile, 56–70 Accessibility, 71–80 Buttons, 81–90 Cards, 91–95 Forms, 96–100 Error/Loading).

### Page 3: Password Reset (Tasks 201–300)
Apply the **Task Template** with `[PAGE]` = **Password Reset**. Full 100 tasks.

### Page 4: Password Reset Confirm (Tasks 301–400)
Apply template with `[PAGE]` = **Password Reset Confirm**.

### Page 5: Email Verification (Tasks 401–500)
Apply template with `[PAGE]` = **Email Verification**.

### Page 6: Google Callback (Tasks 501–600)
Apply template with `[PAGE]` = **Google Callback** (emphasize loading/redirect states).

### Page 7: Skin Scan (Tasks 601–700)
Apply template with `[PAGE]` = **Skin Scan** (emphasize camera UI, mobile touch, permissions).

### Page 8: Analysis Results (Tasks 701–800)
Apply template with `[PAGE]` = **Analysis Results** (emphasize charts, sharing, results layout).

### Page 9: Sample Report (Tasks 801–900)
Apply template with `[PAGE]` = **Sample Report**.

### Page 10: History (Tasks 901–1000)
Apply template with `[PAGE]` = **History** (emphasize list layout, filters).

### Page 11: Comparison (Tasks 1001–1100)
Apply template with `[PAGE]` = **Comparison** (emphasize side-by-side responsive layout).

### Page 12: Digital Twin (Tasks 1101–1200)
Apply template with `[PAGE]` = **Digital Twin** (emphasize timeline, charts).

### Page 13: Recommendations (Tasks 1201–1300)
Apply template with `[PAGE]` = **Recommendations** (emphasize product grid, filters).

### Page 14: Discover (Tasks 1301–1400)
Apply template with `[PAGE]` = **Discover** (shared component with Recommendations).

### Page 15: Product Details (Tasks 1401–1500)
Apply template with `[PAGE]` = **Product Details** (emphasize ingredients, reviews, CTAs).

### Page 16: Product Compare (Tasks 1501–1600)
Apply template with `[PAGE]` = **Product Compare**.

### Page 17: Routine Builder (Tasks 1601–1700)
Apply template with `[PAGE]` = **Routine Builder** (emphasize drag-drop, steps).

### Page 18: Routines (Tasks 1701–1800)
Apply template with `[PAGE]` = **Routines**.

### Page 19: Favorites (Tasks 1801–1900)
Apply template with `[PAGE]` = **Favorites** (emphasize product grid, search).

### Page 20: My Shelf (Tasks 1901–2000)
Apply template with `[PAGE]` = **My Shelf** (emphasize product cards, filters).

### Page 21: Product Scanner (Tasks 2001–2100)
Apply template with `[PAGE]` = **Product Scanner** (emphasize barcode/camera UI, results).

### Page 22: Onboarding (Tasks 2101–2200)
Apply template with `[PAGE]` = **Onboarding** (emphasize multi-step flow).

### Page 23: Profile Settings (Tasks 2201–2300)
Apply template with `[PAGE]` = **Profile Settings** (emphasize tabs, forms).

### Page 24: Consent (Tasks 2301–2400)
Apply template with `[PAGE]` = **Consent** (emphasize checkboxes, legal links).

### Page 25: Skin Goals (Tasks 2401–2500)
Apply template with `[PAGE]` = **Skin Goals**.

### Page 26: Progress Tracking (Tasks 2501–2600)
Apply template with `[PAGE]` = **Progress Tracking** (emphasize charts, data viz).

### Page 27: Data Export (Tasks 2601–2700)
Apply template with `[PAGE]` = **Data Export** (emphasize format selection, GDPR).

### Page 28: Dashboard (Tasks 2701–2800)
Apply template with `[PAGE]` = **Dashboard** (emphasize stats, action cards).

### Page 29: Notification Center (Tasks 2801–2900)
Apply template with `[PAGE]` = **Notification Center** (emphasize list, actions).

### Page 30: Admin Dashboard (Tasks 2901–3000)
Apply template with `[PAGE]` = **Admin Dashboard** (emphasize metrics grid).

### Page 31: Admin Users (Tasks 3001–3100)
Apply template with `[PAGE]` = **Admin Users** (emphasize table, filters).

### Page 32: Admin Products (Tasks 3101–3200)
Apply template with `[PAGE]` = **Admin Products** (emphasize table, forms).

### Page 33: Admin Catalog (Tasks 3201–3300)
Apply template with `[PAGE]` = **Admin Catalog** (emphasize stats, export).

### Page 34: About (Tasks 3301–3400)
Apply template with `[PAGE]` = **About** (emphasize content layout).

### Page 35: Contact (Tasks 3401–3500)
Apply template with `[PAGE]` = **Contact** (emphasize form, social links).

### Page 36: Privacy (Tasks 3501–3600)
Apply template with `[PAGE]` = **Privacy** (emphasize long-form, TOC).

### Page 37: Terms (Tasks 3601–3700)
Apply template with `[PAGE]` = **Terms** (emphasize long-form, TOC).

### Page 38: Blog (Tasks 3701–3800)
Apply template with `[PAGE]` = **Blog** (emphasize article layout).

### Page 39: Ingredient Dictionary (Tasks 3801–3900)
Apply template with `[PAGE]` = **Ingredient Dictionary** (emphasize search, list).

### Page 40: Skin Type Guide (Tasks 3901–4000)
Apply template with `[PAGE]` = **Skin Type Guide** (emphasize content cards).

### Page 41: Video Tutorials (Tasks 4001–4100)
Apply template with `[PAGE]` = **Video Tutorials** (emphasize video grid, embeds).

### Page 42: NotFound (Tasks 4101–4200)
Apply template with `[PAGE]` = **NotFound** (emphasize error state, recovery links).

---

## Task Index by Number

| Task Range | Page |
|------------|------|
| 1–100 | Home |
| 101–200 | Auth |
| 201–300 | Password Reset |
| 301–400 | Password Reset Confirm |
| 401–500 | Email Verification |
| 501–600 | Google Callback |
| 601–700 | Skin Scan |
| 701–800 | Analysis Results |
| 801–900 | Sample Report |
| 901–1000 | History |
| 1001–1100 | Comparison |
| 1101–1200 | Digital Twin |
| 1201–1300 | Recommendations |
| 1301–1400 | Discover |
| 1401–1500 | Product Details |
| 1501–1600 | Product Compare |
| 1601–1700 | Routine Builder |
| 1701–1800 | Routines |
| 1801–1900 | Favorites |
| 1901–2000 | My Shelf |
| 2001–2100 | Product Scanner |
| 2101–2200 | Onboarding |
| 2201–2300 | Profile Settings |
| 2301–2400 | Consent |
| 2401–2500 | Skin Goals |
| 2501–2600 | Progress Tracking |
| 2601–2700 | Data Export |
| 2701–2800 | Dashboard |
| 2801–2900 | Notification Center |
| 2901–3000 | Admin Dashboard |
| 3001–3100 | Admin Users |
| 3101–3200 | Admin Products |
| 3201–3300 | Admin Catalog |
| 3301–3400 | About |
| 3401–3500 | Contact |
| 3501–3600 | Privacy |
| 3601–3700 | Terms |
| 3701–3800 | Blog |
| 3801–3900 | Ingredient Dictionary |
| 3901–4000 | Skin Type Guide |
| 4001–4100 | Video Tutorials |
| 4101–4200 | NotFound |

---

## Standards Referenced

- **WCAG 2.1 AA** – Accessibility
- **Material Design (MD)** – Layout, components, motion
- **Apple Human Interface Guidelines (HIG)** – Touch, safe areas, iOS
- **8pt Grid System** – Spacing and alignment
