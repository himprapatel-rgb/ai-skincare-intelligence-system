# 100 Tasks: Mobile GUI Improvements

GUI improvement tasks for the mobile version of the AI Skincare Intelligence System.  
Target: viewport ≤ 768px; prioritize touch, readability, and app-like feel.

**Status: All 100 tasks implemented.**  
Implementation: `frontend/src/styles/mobile-app-polish.css` (Tasks 1–100 block), `frontend/src/utils/haptic.ts`, `frontend/src/hooks/usePullToRefresh.ts`, and component/page updates (Camera, TodayPage, Recommendations, ProductDetailsPage, Auth/LoginForm, ConfirmModal, Toast, notifications). Font-display note in `index.html`.

---

## 1. Layout & Safe Area (Tasks 1–10)

| # | Task | Description |
|---|------|--------------|
| 1 | Safe area on all pages | Ensure every page uses `padding: max(12px, env(safe-area-inset-*))` for left/right and bottom so content clears notches and home indicators. |
| 2 | Bottom nav clearance | Add consistent `padding-bottom` to main content so the last item clears the bottom nav + safe-area-inset-bottom on all key pages (Today, Me, Scan, etc.). |
| 3 | Top bar safe area | Apply `env(safe-area-inset-top)` to the app header so the logo/title sits below the status bar / Dynamic Island. |
| 4 | Horizontal scroll padding | For horizontal scroll sections (e.g. “Recommended for you”), add right padding so the last card scrolls fully into view. |
| 5 | Max content width on tablets | On 768px–1024px, cap main content width (e.g. 640px) and center for large phones / small tablets. |
| 6 | Sticky headers in long lists | Make section headers (e.g. “Recommended for you”) sticky while scrolling product grids where appropriate. |
| 7 | Full-bleed hero on mobile | Allow hero/cover images to extend edge-to-edge with safe area only on inner content. |
| 8 | Consistent page margins | Audit all pages for a single horizontal margin value (e.g. 12px or 16px) and align. |
| 9 | Keyboard open layout | Prevent main content from being squashed when the virtual keyboard is open on login/search screens. |
| 10 | Orientation change | Ensure layout and bottom nav remain usable on landscape; add min-height or guidance where needed. |

---

## 2. Header & Navigation (Tasks 11–20)

| # | Task | Description |
|---|------|--------------|
| 11 | Header min height | Set a consistent header min-height (e.g. 50–56px) on mobile for tap targets. |
| 12 | Back button size | Ensure back/close buttons are at least 44×44px touch target with visible hit area. |
| 13 | Logo mark scaling | Scale logo/icon and wordmark so they don’t overflow on small screens (e.g. 320px width). |
| 14 | Notification bell size | Make the notification bell icon and its tap target at least 44×44px. |
| 15 | Bottom nav item size | Ensure each bottom nav item has ≥44px touch target and clear label. |
| 16 | Scan pill prominence | Keep the center Scan pill (e.g. 50×50px) visually and touch-wise distinct from other nav items. |
| 17 | Active nav state | Show a clear active state (e.g. color/weight/underline) for the current section in bottom nav. |
| 18 | Nav label truncation | Prevent nav labels from truncating with ellipsis or shorter labels (e.g. “Today”, “Me”). |
| 19 | Header shadow on scroll | Add a subtle header shadow or border when the user scrolls for separation from content. |
| 20 | Skip to main content | Add a “Skip to main content” link for accessibility, visible on focus. |

---

## 3. Typography (Tasks 21–30)

| # | Task | Description |
|---|------|--------------|
| 21 | Minimum body font size | Set minimum body font size to 16px (or 1rem) to avoid iOS zoom on focus and improve readability. |
| 22 | Page title scale | Use a consistent, responsive page title size (e.g. 1.25–1.5rem) on mobile. |
| 23 | Section heading scale | Use a clear hierarchy: section headings one step below page title, sub-sections below that. |
| 24 | Line height for body | Use line-height ≥1.5 for body text on mobile. |
| 25 | Line height for headings | Use line-height 1.2–1.3 for headings to avoid huge gaps. |
| 26 | Contrast for labels | Ensure all labels and secondary text meet WCAG AA contrast (4.5:1 for normal text). |
| 27 | No tiny legal text | Ensure footer/legal/consent text is at least 14px and readable. |
| 28 | Product name wrap | Allow product names to wrap (e.g. 2 lines) with line-clamp where needed to avoid overflow. |
| 29 | Number/stat font | Use tabular figures for stats (match %, dates) so they don’t shift when values change. |
| 30 | Font loading | Prevent FOIT/FOUT: use font-display: swap and preload critical fonts. |

---

## 4. Touch Targets & Buttons (Tasks 31–40)

| # | Task | Description |
|---|------|--------------|
| 31 | Minimum 44×44px | Ensure all interactive elements (buttons, links, icons) have at least 44×44px tap area. |
| 32 | Primary button height | Use a consistent primary button min-height (e.g. 44–48px) on mobile. |
| 33 | Secondary button style | Differentiate secondary buttons (outline or muted) while keeping the same min-height. |
| 34 | Button padding | Use horizontal padding (e.g. 16–24px) so buttons don’t look cramped. |
| 35 | Icon-only targets | Add padding so icon-only buttons reach 44×44px without shrinking the icon. |
| 36 | List row min height | Use at least 44px min-height for list rows (e.g. settings, Me page items). |
| 37 | Card tap target | Ensure the whole card or a clear CTA is tappable, not a tiny “View” only. |
| 38 | Swipe vs tap | Don’t rely on swipe-only actions; provide a tap alternative (e.g. “Delete” button). |
| 39 | Disabled state | Style disabled buttons so they’re clearly non-interactive (opacity + no pointer). |
| 40 | Loading state on submit | Show loading spinner or disabled state on primary submit to prevent double-tap. |

---

## 5. Cards & Lists (Tasks 41–50)

| # | Task | Description |
|---|------|--------------|
| 41 | Card border radius | Use a consistent card radius (e.g. 10–12px) across Today, Me, and catalog. |
| 42 | Card padding | Use consistent inner padding (e.g. 12–16px) so content doesn’t touch edges. |
| 43 | Card shadow on mobile | Use a light shadow or border so cards don’t blend into the background. |
| 44 | Product card image ratio | Fix product image aspect ratio (e.g. 1:1) so cards align in a grid. |
| 45 | List item divider | Use a subtle divider or spacing between list items for scanability. |
| 46 | List group radius | Apply border-radius to list groups (e.g. 12px) for a cohesive look. |
| 47 | Horizontal card scroll | Make horizontal scroll snap (e.g. scroll-snap-type: x mandatory) for product rows. |
| 48 | Empty state in lists | Provide a clear empty state (icon + short message + optional CTA) for empty lists. |
| 49 | Skeleton for cards | Show skeleton placeholders for product/recommendation cards while loading. |
| 50 | Pull-to-refresh | Add pull-to-refresh on list pages (Today, Shelf, History) where data can be refreshed. |

---

## 6. Forms & Inputs (Tasks 51–60)

| # | Task | Description |
|---|------|--------------|
| 51 | Input height | Use min-height 44–48px for text inputs to avoid zoom on iOS. |
| 52 | Input font size | Use at least 16px for input text to prevent iOS auto-zoom. |
| 53 | Label above input | Place labels above inputs on mobile for clarity and to avoid cramped inline layout. |
| 54 | Error message placement | Show validation errors below the field with sufficient contrast. |
| 55 | Focus visible | Ensure inputs and buttons have a visible focus ring for keyboard/accessibility. |
| 56 | Appropriate input types | Use type="email", type="tel", type="number" and inputmode where relevant. |
| 57 | Hide password toggle | Provide a “show password” toggle (icon button) for password fields. |
| 58 | Checkbox/radio size | Make checkboxes and radio buttons at least 24×24px with a large tap area. |
| 59 | Dropdown on mobile | Prefer native select or a full-width bottom sheet for long dropdowns on mobile. |
| 60 | Reduce typing | Use autocomplete, chips, or preset options where it makes sense to reduce typing. |

---

## 7. Modals & Overlays (Tasks 61–70)

| # | Task | Description |
|---|------|--------------|
| 61 | Modal max height | Cap modal height (e.g. 90vh) so content is scrollable and doesn’t overflow. |
| 62 | Modal safe area | Apply safe-area insets to modal content so it clears notches. |
| 63 | Backdrop tap to close | Allow tapping outside the modal to close where it’s not destructive. |
| 64 | Modal header sticky | Keep modal title and close button fixed at top when content scrolls. |
| 65 | Bottom sheet option | Use a bottom-sheet pattern for filters/sort/options on mobile. |
| 66 | Confirm destructive | Use a clear “Cancel” and “Delete”/“Confirm” for destructive actions. |
| 67 | Loading overlay | Show a full-screen or inline loading overlay with spinner for long actions. |
| 68 | Toast position | Place toasts above the bottom nav (e.g. bottom: 80px) so they’re visible. |
| 69 | One modal at a time | Ensure only one modal/sheet is open at a time and focus is trapped. |
| 70 | Modal animation | Use a short open/close animation (e.g. fade + slide) for modals/sheets. |

---

## 8. Today & Home (Tasks 71–76)

| # | Task | Description |
|---|------|--------------|
| 71 | Today greeting | Make the greeting (e.g. “Good morning”) responsive and not truncated. |
| 72 | Recommended grid | Use a responsive grid or horizontal scroll for “Recommended for you” with consistent card size. |
| 73 | Match bar visibility | Ensure the match percentage bar is clearly visible and readable on product cards. |
| 74 | “See all” link | Make “See all” a clear text or button link with adequate tap area. |
| 75 | Today sections spacing | Use consistent vertical spacing between sections on the Today page. |
| 76 | Quick actions | If present, make quick action buttons equal width or clearly grouped. |

---

## 9. Scan & Camera (Tasks 77–82)

| # | Task | Description |
|---|------|--------------|
| 77 | Camera viewport | Ensure the camera/preview fills the screen with safe area for controls. |
| 78 | Capture button size | Make the capture/scan button large (e.g. 64–72px) and easy to tap. |
| 79 | Scan instructions | Keep scan instructions short and visible (or dismissible) without blocking the camera. |
| 80 | Permission messaging | Show clear messaging when camera permission is denied and how to enable it. |
| 81 | Loading after capture | Show a clear loading state after capture before showing results. |
| 82 | Results transition | Animate or fade from scan view to results for a smooth flow. |

---

## 10. Me & Profile (Tasks 83–88)

| # | Task | Description |
|---|------|--------------|
| 83 | Avatar size | Use a consistent avatar size (e.g. 70–80px) that scales down on very small screens. |
| 84 | Profile stats | Display profile stats (e.g. scans, shelf count) in a compact, readable row or grid. |
| 85 | Settings list tap area | Ensure each settings row (e.g. Account, Notifications) has full-width tap and min height 44px. |
| 86 | Section spacing | Use consistent spacing between sections (e.g. Profile, Preferences, Support). |
| 87 | Change photo control | Make “Change photo” or camera overlay on avatar at least 44px and clearly tappable. |
| 88 | Logout placement | Place logout/sign out in a clear but non-prominent position (e.g. bottom of list). |

---

## 11. Digital Twin & Timeline (Tasks 89–94)

| # | Task | Description |
|---|------|--------------|
| 89 | Timeline snapshot grid | Use a 2- or 3-column grid for timeline snapshots with consistent card size. |
| 90 | Snapshot card tap | Make the whole snapshot card or a clear “View” CTA tappable. |
| 91 | “View more” control | Use a single clear control (e.g. “Want to see more (N)”) for expanding timeline. |
| 92 | Stats cards layout | Stack or use a 2×2 grid for stats (hydration, routine, etc.) on small screens. |
| 93 | Chart readability | Ensure charts (e.g. progress) have readable labels and legend on mobile. |
| 94 | Simulation panel | Make the simulation/“what-if” panel usable in a drawer or full-width on mobile. |

---

## 12. Notifications & Feedback (Tasks 95–100)

| # | Task | Description |
|---|------|--------------|
| 95 | Notification dropdown | Keep dropdown width within viewport (e.g. min(280px, 100vw - 32px)) and scrollable. |
| 96 | Notification item height | Use a comfortable min-height for each notification row and clear read/unread state. |
| 97 | Empty notifications | Show a clear empty state in the notification panel with short copy. |
| 98 | Success/error toasts | Use toasts for success and error with sufficient duration and contrast. |
| 99 | Inline validation | Show inline validation on forms without blocking the whole screen. |
| 100 | Haptic feedback | Where supported, trigger light haptic on important actions (e.g. scan capture, add to shelf). |

---

## Implementation Notes

- **Scope**: All tasks target mobile viewports (e.g. `@media (max-width: 768px)` unless noted).
- **Order**: Tackle Layout & Safe Area (1–10) and Touch Targets (31–40) early for maximum impact.
- **Testing**: Verify on real devices (iOS Safari, Android Chrome) and with different font sizes (e.g. 125%).
- **Docs**: Update `frontend/DESIGN-CHANGELOG.md` or a mobile checklist when tasks are completed.
- **Reference**: Implementation in `frontend/src/styles/mobile-app-polish.css` (100 Tasks block), `frontend/src/utils/haptic.ts`, `frontend/src/hooks/usePullToRefresh.ts`, and page/component CSS and TSX as noted above.
