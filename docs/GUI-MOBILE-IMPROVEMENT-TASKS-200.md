# 200 Tasks: Mobile GUI Improvements

GUI improvement tasks for the mobile version of the AI Skincare Intelligence System.  
Target: viewport ≤ 768px; prioritize touch, readability, and app-like feel.

**Tasks 1–100:** Implemented (see `frontend/src/styles/mobile-app-polish.css`, haptic.ts, usePullToRefresh, etc.).  
**Tasks 101–200:** Implemented in `frontend/src/styles/mobile-app-polish.css` (Tasks 101-200 block), plus accessibility in BottomNav (aria-label), ConfirmModal (focus trap), Toast (aria-live), skip link and #main-content in AppLayout.

---

## Part 1: Tasks 1–100 (Summary)

| Range | Category |
|-------|----------|
| 1–10 | Layout & Safe Area |
| 11–20 | Header & Navigation |
| 21–30 | Typography |
| 31–40 | Touch Targets & Buttons |
| 41–50 | Cards & Lists |
| 51–60 | Forms & Inputs |
| 61–70 | Modals & Overlays |
| 71–76 | Today & Home |
| 77–82 | Scan & Camera |
| 83–88 | Me & Profile |
| 89–94 | Digital Twin & Timeline |
| 95–100 | Notifications & Feedback |

Full descriptions for tasks 1–100: see `GUI-MOBILE-IMPROVEMENT-TASKS-100.md`.

---

## Part 2: Tasks 101–200 (New)

### 13. Layout & Spacing (Tasks 101–110)

| # | Task | Description |
|---|------|--------------|
| 101 | Section gutter consistency | Use a single gutter (e.g. 16px) for all section padding on mobile across pages. |
| 102 | Vertical rhythm | Apply consistent vertical spacing scale (e.g. 8, 12, 16, 24, 32px) between blocks. |
| 103 | First/last item padding | Add top padding to first content block and bottom padding to last so content doesn’t touch header/nav. |
| 104 | Inline spacing | Use consistent gap (e.g. 8–12px) between inline elements (icon + label, badge + text). |
| 105 | Two-column mobile | Where two columns are used (e.g. label/value), ensure min column width so text doesn’t squash. |
| 106 | No horizontal overflow | Ensure no page or modal causes horizontal scroll; contain all content in viewport width. |
| 107 | Scrollable regions | When content is in a fixed-height area (e.g. modal body), use overflow-y: auto and -webkit-overflow-scrolling: touch. |
| 108 | Flex wrap on small | For flex rows (e.g. tags, chips), allow wrap and consistent gap so items don’t overflow. |
| 109 | Grid min width | For product/content grids, set min-width on cells or use minmax() so columns don’t get too narrow. |
| 110 | Divider visibility | Use borders or spacing for section dividers that remain visible in both light and dark themes. |

---

### 14. Animations & Transitions (Tasks 111–120)

| # | Task | Description |
|---|------|--------------|
| 111 | Page transition | Use a subtle fade or slide when navigating between main tabs (Today, Scan, Me). |
| 112 | List item feedback | On list row tap, show a brief highlight or scale feedback before navigation. |
| 113 | Button press state | Provide visual feedback (opacity or scale) on button press for primary and secondary actions. |
| 114 | Card hover/press | On mobile, use :active or touch feedback on cards so tap feels responsive. |
| 115 | Modal enter/exit | Animate modal/sheet enter (e.g. slide up) and exit (slide down or fade) with ~200–300ms. |
| 116 | Skeleton pulse | Use a subtle pulse or shimmer on skeleton placeholders so it’s clear content is loading. |
| 117 | Toast in/out | Animate toast appearance (e.g. slide up) and dismissal for polish. |
| 118 | Reduce motion | Respect prefers-reduced-motion: reduce by disabling or shortening non-essential animations. |
| 119 | Loading spinner size | Use a consistent spinner size (e.g. 24–32px) for inline loading states. |
| 120 | Progress indicator | For multi-step flows (e.g. onboarding), show a clear step or progress indicator with simple transition. |

---

### 15. Accessibility (Tasks 121–130)

| # | Task | Description |
|---|------|--------------|
| 121 | Focus order | Ensure tab order follows visual order on key flows (login, scan, profile). |
| 122 | Focus trap in modal | When a modal is open, trap focus inside and return focus to trigger on close. |
| 123 | ARIA labels | Add aria-label to icon-only buttons (back, close, scan, settings) for screen readers. |
| 124 | Live regions | Use aria-live for dynamic content (e.g. scan result, toast) so SR users get updates. |
| 125 | Heading hierarchy | Use a single h1 per page and logical h2/h3 order for sections. |
| 126 | Image alt text | Ensure product images and illustrations have meaningful alt text or role="presentation" where decorative. |
| 127 | Form error association | Associate validation errors with inputs via aria-describedby and aria-invalid. |
| 128 | Minimum touch target | Re-verify all interactive elements meet 44×44px; add padding if needed. |
| 129 | Color not only | Don’t convey meaning by color alone; use icon or text (e.g. success/error). |
| 130 | Skip link target | Ensure “Skip to main content” targets the main content container and is focusable. |

---

### 16. Product & Catalog (Tasks 131–140)

| # | Task | Description |
|---|------|--------------|
| 131 | Product grid columns | Use 2 columns on narrow mobile (e.g. &lt;360px) and 2–3 on wider for product grids. |
| 132 | Product card CTA | Make “Add to shelf” or primary CTA on product cards full-width or clearly sized (min 44px height). |
| 133 | Price visibility | Ensure price and currency are clearly visible and don’t wrap awkwardly. |
| 134 | Brand line | Show brand name in a consistent position (e.g. above or below product name) with readable size. |
| 135 | Match score on card | If match % is shown, use a compact bar or badge that doesn’t dominate the card. |
| 136 | Product detail images | On product detail page, allow image gallery swipe with indicators and optional zoom. |
| 137 | Ingredient list mobile | Show ingredient list in a readable, scrollable block with optional “Expand” for long lists. |
| 138 | Compare CTA | Make “Compare” or “Add to compare” easy to tap and clearly placed. |
| 139 | Similar products row | Use horizontal scroll with snap for “Similar products” or “You may also like” on detail page. |
| 140 | Out-of-stock state | Clearly style out-of-stock or unavailable products (e.g. muted, badge) and disable add actions. |

---

### 17. History, Favorites & Shelf (Tasks 141–148)

| # | Task | Description |
|---|------|--------------|
| 141 | History list density | Balance list density: enough items visible, but row height comfortable for tap and read. |
| 142 | History date grouping | Group history by date (Today, Yesterday, Older) with sticky or clear section headers. |
| 143 | History item actions | Expose “View” and optional “Delete” or “Share” with adequate tap targets. |
| 144 | Favorites grid | Use the same grid rules as product catalog for favorites (2–3 columns, consistent cards). |
| 145 | Remove from favorites | Make remove/unfavorite action clear (icon or “Remove”) with optional confirm for accidental tap. |
| 146 | My Shelf layout | Use list or grid consistently; ensure “Add product” or empty state is prominent. |
| 147 | Shelf item reorder | If reorder is supported, use grip handle and clear feedback when order changes. |
| 148 | Bulk actions | If bulk delete/export exists, use a clear selection mode and sticky action bar on mobile. |

---

### 18. Auth, Onboarding & Consent (Tasks 149–156)

| # | Task | Description |
|---|------|--------------|
| 149 | Auth form width | Constrain auth form width on mobile (e.g. max 400px) and center for readability. |
| 150 | Social login buttons | Make Google/social buttons full-width or equal width with clear icon and label. |
| 151 | Auth error placement | Show login/register errors near the submit button or at top of form, not only inline. |
| 152 | Onboarding step indicator | Show current step (e.g. 1 of 3) and allow “Back” and “Next” with large tap targets. |
| 153 | Onboarding copy length | Keep onboarding copy short; use bullets or short paragraphs for small screens. |
| 154 | Consent checkboxes | Make consent checkboxes large (min 24px) with label that’s tappable. |
| 155 | Cookie/privacy banner | Place cookie or consent banner above bottom nav; make “Accept” and “Settings” easy to tap. |
| 156 | Password reset flow | On password reset, show clear success state and link back to login with adequate spacing. |

---

### 19. Blog, Ingredients & Static Pages (Tasks 157–164)

| # | Task | Description |
|---|------|--------------|
| 157 | Blog list cards | Use consistent card layout for blog/article list with image, title, and short excerpt. |
| 158 | Article body typography | Use readable font size (16px+), line-height, and margin for article body on mobile. |
| 159 | Article images | Ensure in-article images are responsive and don’t overflow; optional lightbox. |
| 160 | Ingredient search | Make ingredient search input prominent (min 44px height) with clear placeholder. |
| 161 | Ingredient list | Use list or card layout for ingredients with consistent tap target per row. |
| 162 | Ingredient detail | On ingredient detail, keep key info (name, rating, summary) above the fold. |
| 163 | Static page padding | Apply consistent horizontal and vertical padding to About, Privacy, Terms, Contact. |
| 164 | Contact form | Use same form rules (input height, labels, error placement) as auth and other forms. |

---

### 20. Search, Filters & Sort (Tasks 165–172)

| # | Task | Description |
|---|------|--------------|
| 165 | Search bar placement | Place search bar in header or below; min height 44px and clear cancel/clear control. |
| 166 | Search results layout | Show results in same grid/list pattern as catalog with clear “No results” state. |
| 167 | Filter sheet | Use bottom sheet or full-screen overlay for filters with “Apply” and “Reset” at bottom. |
| 168 | Filter chips | Show active filters as dismissible chips above results with “Clear all” option. |
| 169 | Sort dropdown | Use native select or bottom sheet for sort options; show current sort value clearly. |
| 170 | Search suggestions | If suggestions exist, make each item at least 44px height and tappable. |
| 171 | Recent searches | If recent searches are shown, allow clear-all and individual remove with adequate targets. |
| 172 | Filter count badge | Show number of active filters on filter button when applicable (e.g. “Filters (2)”). |

---

### 21. Loading, Errors & Empty States (Tasks 173–180)

| # | Task | Description |
|---|------|--------------|
| 173 | Full-page loader | Use a single full-page loading pattern (spinner or skeleton) that’s centered and branded. |
| 174 | Inline loader | For button or card-level loading, use spinner or disabled state without blocking whole screen. |
| 175 | Error page layout | On 404 or generic error, show icon, short message, and primary CTA (e.g. “Go home”). |
| 176 | API error message | Show user-friendly message for API failures with optional “Retry” button. |
| 177 | Empty search | For empty search results, suggest clearing filters or trying different terms. |
| 178 | Empty list illustration | Use a consistent empty-state illustration or icon across lists (shelf, history, favorites). |
| 179 | Empty state CTA | Every empty state should have one clear primary action (e.g. “Add your first product”). |
| 180 | Offline message | When offline, show a clear banner or message and disable actions that require network. |

---

### 22. PWA & Install (Tasks 181–186)

| # | Task | Description |
|---|------|--------------|
| 181 | Install prompt placement | If “Add to Home Screen” is shown, place it non-intrusively (e.g. bottom banner) with dismiss. |
| 182 | Install CTA copy | Use short, clear copy for install (e.g. “Install app”) and optional “Not now”. |
| 183 | Standalone mode | When running as installed PWA, adjust any browser-chrome assumptions (e.g. safe areas). |
| 184 | Splash/loading | Provide a simple splash or loading screen on launch that matches app branding. |
| 185 | Update prompt | When a new version is available, notify user with option to reload (e.g. toast or small banner). |
| 186 | Offline fallback | For key routes (e.g. Today, Me), show cached content or a clear “You’re offline” view. |

---

### 23. Dark Mode & Theming (Tasks 187–192)

| # | Task | Description |
|---|------|--------------|
| 187 | Dark mode contrast | Ensure all text and UI in dark mode meet contrast requirements (e.g. WCAG AA). |
| 188 | Card in dark mode | Use subtle borders or elevated background for cards in dark theme so they don’t blend. |
| 189 | Image in dark mode | Avoid pure white image backgrounds in dark mode; use neutral or rounded container. |
| 190 | Theme toggle | Place theme (light/dark/system) toggle in an obvious location (e.g. profile/settings) with clear labels. |
| 191 | System preference | Respect prefers-color-scheme when “System” is selected and apply without flash. |
| 192 | Focus ring in dark | Ensure focus rings are visible in both light and dark themes. |

---

### 24. Performance & Perceived Performance (Tasks 193–200)

| # | Task | Description |
|---|------|--------------|
| 193 | Above-the-fold priority | Load and render critical content (header, first section) first; defer below-fold. |
| 194 | Image lazy load | Lazy-load images below the fold with placeholder or skeleton to avoid layout shift. |
| 195 | List virtualization | For very long lists (e.g. 100+ items), consider virtualizing or pagination for smooth scroll. |
| 196 | Tap response time | Ensure first feedback (e.g. highlight, spinner) appears within ~100ms of tap. |
| 197 | Route prefetch | Where possible, prefetch next likely route (e.g. product detail) on hover or idle. |
| 198 | Reduce layout shift | Reserve space for images and dynamic content (aspect-ratio, min-height) to limit CLS. |
| 199 | Font loading | Load only required font weights and use font-display: swap to avoid blocking render. |
| 200 | Critical CSS | Inline or early-load critical above-the-fold CSS so first paint is fast on mobile. |

---

## Implementation Notes

- **Scope**: All tasks target mobile viewports (e.g. `@media (max-width: 768px)` unless noted).
- **Order**: After tasks 1–100, tackle Layout & Spacing (101–110), Touch/Animations (111–120), and Accessibility (121–130) for high impact.
- **Testing**: Verify on real devices (iOS Safari, Android Chrome) and with different font sizes and reduced motion.
- **Docs**: Update `frontend/DESIGN-CHANGELOG.md` or this file when tasks are completed.
- **Reference**: Tasks 1–100 implementation in `frontend/src/styles/mobile-app-polish.css`, `frontend/src/utils/haptic.ts`, `frontend/src/hooks/usePullToRefresh.ts`, and related components.
