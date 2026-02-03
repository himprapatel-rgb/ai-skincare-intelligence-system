# Mobile App Improvements Roadmap

**Product lens:** Designer · Manager · Developer  
**Scope:** Mobile version of the AI Skincare Intelligence app (viewport ≤768px, PWA/standalone)

---

## Product Designer

### UX & flows
- **Onboarding**: Add step progress (e.g. “Step 2 of 5”) in header; optional swipe between steps; clear “Skip” for optional steps; confirm before “Back” when form is filled.
- **Scan flow**: One-tap “Retry” after failure; short in-flow tips (e.g. “Face the light”); optional haptic/visual “good frame” cue before capture; reduce steps from upload → scan → result where possible.
- **First-time dashboard**: Empty state with a single primary CTA (e.g. “Take your first scan”) and short benefit; avoid multiple competing actions.
- **Profile/Settings**: Group related items (Account, Privacy, Notifications, Appearance); add “Support” or “Help” entry; ensure destructive actions (e.g. Delete account) are separated and require confirmation.
- **Consent & privacy**: Consent screen as a clear modal or full-screen step (not buried); “Manage preferences” reachable from Profile; short summaries per category (location, analytics, marketing).
- **Navigation**: Consider a “Scan” entry in bottom nav that opens camera/upload directly; ensure back from deep routes (e.g. Product → Shelf) feels predictable.
- **Lists (History, Shelf, Favorites)**: Pull-to-refresh; consistent empty states (icon + one line + one CTA); list rows with clear primary action (e.g. “View” / “Open”) and optional secondary (e.g. overflow menu).

### Visual & layout
- **Headers**: Standardize all pages on `app-header-card` + `app-header-subtitle`; one clear H1 per page; no duplicate “title” in both nav and content.
- **Spacing**: Document and use a small set of spacing tokens (e.g. 8, 12, 16, 24) for `app-page-content` and between sections; avoid one-off margins.
- **Cards**: Consistent radius (e.g. 14px), shadow, and padding on mobile; avoid mixing flat blocks and heavy shadows.
- **Typography**: Clear hierarchy (title, subtitle, body, caption); ensure minimum touch-friendly text size (e.g. 14px body, 16px inputs); line-height for readability.
- **Dark mode**: Support end-to-end (all pages and components); test contrast (WCAG AA) for text and controls.
- **Loading**: Prefer skeleton layouts that match final content (e.g. list rows, cards) over generic spinners where possible.
- **Errors**: Inline validation near fields; page-level errors in a clear card with one primary recovery action (e.g. “Retry” or “Go back”).

### Interaction & feedback
- **Touch targets**: Every tappable element ≥44×44px; adequate spacing between targets to avoid mis-taps.
- **Tap feedback**: Consistent `-webkit-tap-highlight-color` or brief scale/opacity change on buttons and list rows.
- **Toasts**: Position above bottom nav; auto-dismiss with optional “Undo” for destructive or critical actions.
- **Modals & sheets**: Use bottom-sheet style on mobile for filters, sort, and single-purpose forms; clear “Done” or “Apply” and “Cancel”.
- **Forms**: Single column; labels above or floating; one primary button per screen; disable submit until valid where appropriate.

### Accessibility
- **Focus**: Visible focus ring (`:focus-visible`) on all interactive elements; no focus trap unless in modal.
- **Screen readers**: `aria-label` on icon-only buttons; `aria-live` for dynamic content (e.g. scan result, toasts); headings in order (e.g. no H1 → H3).
- **Motion**: Respect `prefers-reduced-motion` (disable or shorten animations).
- **Color**: Don’t rely on color alone for status (e.g. add icon or text for success/error).

---

## Product Manager

### Strategy & prioritization
- **North star**: Define a primary mobile metric (e.g. “completed first scan within 7 days” or “weekly active scans”) and align features to it.
- **User segments**: Clarify “new visitor”, “signed-up no scan”, “active scanner”, “power user”; prioritize flows that move users to the next segment.
- **Roadmap**: Order work by impact on core flow (Scan → Results → Recommendations/Shelf) before secondary features (e.g. Digital Twin, Blog).

### Scope & requirements
- **MVP mobile feature set**: Document which features are “mobile-first” (Scan, Dashboard, Shelf, Profile) vs “nice-to-have on mobile” (e.g. Admin, long-form content).
- **Offline**: Define what works offline (e.g. view cached analysis, shelf list) vs what requires network (scan, recommendations); communicate clearly in UI.
- **Data & consent**: Location/device consent already in place; define retention and “delete my data” behavior and expose in Privacy/Profile.
- **Performance**: Set targets (e.g. LCP <2.5s, FID <100ms on 4G) and monitor; defer non-critical JS (e.g. analytics, non-visible sections).

### Metrics & learning
- **Analytics**: Track key mobile events (scan started, scan completed, result viewed, product added to shelf, consent given); respect consent (no analytics if rejected).
- **Feedback**: In-app feedback (e.g. “Was this helpful?” on results) or optional survey after first scan; store in backend for prioritization.
- **Quality**: Monitor error rates and failed scans by step; use to improve copy, validation, or API.

### Documentation & alignment
- **Mobile UX principles**: One-pager (e.g. “app-like, one primary action per screen, safe areas, bottom nav”) for design and dev.
- **Acceptance criteria**: Each mobile story includes “works on 375px and 414px”, “touch targets ≥44px”, “no horizontal scroll”.

---

## Product Developer

### Architecture & code quality
- **Design tokens**: Centralize colors, spacing, radii, shadows in CSS variables (or theme object); use in `app-mobile-global.css` and page styles so mobile stays consistent.
- **Component reuse**: Shared `AppPage`, `AppHeaderCard`, `AppPageContent`, `EmptyState`, `ErrorCard`, `BottomSheet` (if added); avoid page-specific one-offs for the same pattern.
- **Route-level code split**: Lazy-load routes (e.g. Admin, Digital Twin, Routine Builder) so mobile bundle stays smaller and first load is faster.
- **State**: Keep global state minimal; use URL and local state for filters, modals, and multi-step flows so back/refresh behaves predictably.

### Performance
- **Images**: Responsive images (`srcset`/sizes) and lazy loading below the fold; consider WebP/AVIF where supported.
- **Scan/camera**: Lazy-load MediaPipe/TensorFlow only on Scan route; release camera when leaving the page.
- **Lists**: Virtualize long lists (History, Shelf, Recommendations) on mobile to reduce DOM and scroll jank.
- **Fonts**: Subset and preload critical font; avoid layout shift (e.g. `font-display: optional` or `swap` with fallback metrics).

### Testing & quality
- **E2E mobile**: Use `e2e:mobile-app` (Playwright) for critical paths: Home → Scan → Result, Dashboard, Shelf add, Profile settings; run in CI.
- **Visual regression**: Optional screenshot tests for key mobile screens (e.g. Dashboard, Scan upload, Result).
- **Device matrix**: Test on at least one iOS Safari and one Android Chrome (real or BrowserStack); check safe areas and bottom nav.
- **Lighthouse**: Run mobile preset in CI or pre-release; track LCP, CLS, FID.

### PWA & installability
- **Manifest**: Correct `name`, `short_name`, `theme_color`, `background_color`, and icons (e.g. 192, 512); `display: standalone` or `minimal-ui`.
- **Service worker**: Cache static assets and optionally cache API responses for offline; version and invalidate on deploy.
- **Install prompt**: “Add to Home Screen” prompt (existing component) shown only when criteria met (e.g. mobile, not installed, engaged); don’t block content.
- **Standalone detection**: Use `data-standalone` or `display-mode` media query so safe-area and chrome adjustments apply when installed.

### Consistency & maintainability
- **Breakpoint**: Standardize on a single mobile breakpoint (e.g. 768px) in CSS and any JS that toggles layout; document in design system.
- **Page structure**: Every mobile page: `app-page` → optional `app-header-card` → `app-page-content`; no content outside that wrapper without a reason.
- **Admin on mobile**: Either full app-page treatment and responsive tables/cards, or “best viewed on desktop” message with minimal usable actions.
- **Errors**: Centralized error boundary for mobile; log to backend or analytics; show a friendly message and “Reload” or “Go home”.

### Security & data
- **Auth**: Tokens in httpOnly cookies or secure storage; no sensitive data in URLs; logout clears local/session storage as needed.
- **Consent**: Persist consent choices and send to backend; respect in analytics and non-essential API calls.
- **Input**: Sanitize and validate on client and server; no `dangerouslySetInnerHTML` with user content.

---

## Summary table

| Area              | Designer focus           | Manager focus              | Developer focus              |
|-------------------|--------------------------|----------------------------|------------------------------|
| **Onboarding**    | Steps, progress, skip     | Conversion, drop-off      | State, validation, API       |
| **Scan**          | Guidance, feedback, retry| Completion rate            | Camera release, lazy ML      |
| **Dashboard**     | Empty state, one CTA     | Activation metric          | Skeleton, data loading       |
| **Lists**         | Pull-refresh, empty state| Engagement                 | Virtualization, caching      |
| **Profile**       | Grouping, destructive    | Retention, consent         | Settings API, consent sync   |
| **Performance**   | Perceived speed          | Targets, monitoring        | Bundle, images, LCP          |
| **Accessibility** | Labels, focus, motion    | Inclusive reach             | ARIA, focus-visible, a11y    |
| **PWA**           | Install flow, standalone | Install rate               | SW, manifest, standalone     |

Use this doc to prioritize backlog, write tickets, and align design/PM/engineering on the mobile app.
