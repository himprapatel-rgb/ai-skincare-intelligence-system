# GUI Issues Audit — 50 Expert Findings

**Scope:** Frontend (React/TSX, CSS).  
**Focus:** Accessibility, consistency, UX, layout, forms, and visual polish.  
**Date:** 2026-02.

---

## Remediation status (summary)

**Fixed (session 1 + 2):**  
1 (focus outline / :focus-visible), 2 & 10 (image alt, footer icon), 3, 31, 40 (modals + product zoom: focus trap, Escape), 4 (History keyboard — was already OK), 7 (disabled title on Consent Accept), 8 (toast aria-live assertive for errors), 9 (Today: header → section, no duplicate banner), 11 (button types, newsletter reset), 12–15 (forms: Contact/Login already had labels and aria; History filters type + aria-pressed), 16 (History uses EmptyState), 17 (Admin loading "Loading…", newsletter "Subscribing…"), 38 (My Shelf tabs aria-label), 49 (breadcrumb labelMap: comparison, device-context, admin), 50 (newsletter: setNewsletterSubmitting(false) after toast).  
**LazyImage:** Error state has role="img" and aria-label; container/error use CSS vars.  
**Design-system:** .ds-input:focus-visible already present.

**Deferred / minor:**  
5–6 (icon audit — most already have aria-label), 18–20 (prefer ErrorCard/skeleton/btn consistency in new code), 21–25 (overflow/z-index/safe areas — partial; mobile-product-ux uses overflow-x), 26–30 (replace hardcoded colors incrementally), 32–37, 39 (BackButton, BackToTop, AddToHomeScreen, NotificationBell, filter chips — no code change or already OK), 41–48 (copy and performance — apply as needed).

---

## Accessibility (A11y)

1. **Focus outline removed globally** — `index.css` and many page/component CSS files use `outline: none` on buttons and inputs without a visible `:focus-visible` replacement. Keyboard users can lose the focus indicator. **Files:** `index.css` (557, 581, 675, 962, 1156), `AuthPage.css`, `Recommendations.css`, `ProfileSettingsPage.css`, `digital-twin.css`, `MyShelfPage.css`, `ContactPage.css`, `RoutineBuilderPage.css`, `ProductScannerPage.css`, `ProductDetailsPage.css`, `OnboardingPage.css`, `FavoritesPage.css`, `HistoryPage.css`, `ComparisonPage.css`, `CommonStyles.css`, `design-system.css`, `premium-polish.css`, `GoogleSignInButton.css`. **Fix:** Add `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }` (or use design-system focus ring) and remove bare `outline: none` where it hides focus.

2. **Images with empty or decorative `alt=""`** — Several images use `alt=""` where content is meaningful: `TodayPage.tsx` (product image in grid), `ProfileSettingsPage.tsx` (profile photo avatar and modal photo), `AdminImageUpload.tsx` (preview). Screen readers get no context. **Fix:** Use descriptive alt (e.g. product name, "Profile photo") or `role="presentation"` only when purely decorative.

3. **Clickable `<div>` without keyboard support** — `ProfileSettingsPage.tsx`: modal overlay uses `<div className="profile-modal" onClick={(e) => e.stopPropagation()}>`. If the modal is focusable or contains focus, ensure Escape closes it and focus is trapped/returned. **Audit:** Confirm modal has `role="dialog"`, `aria-modal="true"`, focus trap, and Escape handler.

4. **History list item as `role="button"`** — `HistoryPage.tsx`: list items use `role="button"` and `tabIndex={0}`. Verify `onKeyDown` handles Enter and Space to activate; otherwise keyboard users cannot trigger the action.

5. **Icon-only buttons** — Many icon-only controls (e.g. refresh, close, menu) rely on `aria-label`. Audit all icon buttons for a visible label or `aria-label`; ensure no generic "button" or missing name.

6. **Placeholder as only label** — Some inputs may use only `placeholder` without a visible or associated `<label>` or `aria-label`. Check auth forms, search inputs, and admin forms for proper labeling.

7. **Disabled controls without explanation** — Buttons/inputs with `disabled` often lack `aria-disabled` or a `title`/tooltip explaining why (e.g. "Sign in to enable"). Add short explanations for disabled states.

8. **Toast dismiss focus** — Toast dismiss button has `aria-label="Dismiss"`. Verify focus order when toasts appear so keyboard users can reach and dismiss without tabbing through entire page.

9. **Duplicate `banner` in main** — Today page (and possibly others) use a `<header>`/banner inside main for the "Your skin today" section. Ensure only one main page banner for semantics, or use a different landmark/heading level to avoid confusion.

10. **Social icon in footer** — Footer "X" (Twitter) link contains an `<img>`; ensure that image has `alt="X"` or `aria-hidden="true"` with the link text providing the label so screen readers don’t duplicate or miss context.

---

## Forms & Inputs

11. **Form submit vs button type** — Buttons inside forms should have `type="button"` or `type="submit"` explicitly. Audit all forms (Login, Register, Contact, Password Reset, Consent, etc.) so non-submit actions don’t accidentally submit.

12. **Label/input association** — Not all inputs have an associated `<label htmlFor={id}>`. Scan ContactPage, ProfileSettings, Admin pages, and onboarding for missing or broken label–input pairs.

13. **Search input font size** — Mobile styles set `font-size: 16px` on inputs to avoid iOS zoom. Ensure all single-line text inputs (including search) get at least 16px on mobile so zoom doesn’t trigger on focus.

14. **Textarea min height** — Global `textarea` has `min-height: 88px`. Verify contact and feedback forms don’t look cramped on small screens and that error messages don’t overflow.

15. **Error state on inputs** — Forms (Login, Register, Contact) should show inline errors with `aria-describedby` or `aria-invalid` and ensure errors are announced and visible.

---

## Consistency & Patterns

16. **Empty state implementation** — History page uses inline empty-state markup; other pages use the `EmptyState` component. Unify so all list-style pages use `EmptyState` (or a single pattern) for layout and copy consistency.

17. **Loading copy** — "Loading..." (AdminContentPage, LoadingSpinner), "Uploading..." (AdminImageUpload), "Please wait..." (GoogleCallback, ProductScanner, Login/Register). Standardize loading and waiting messages (e.g. "Loading…" vs "Please wait…") and consider a shared loading component.

18. **Error UI pattern** — Mix of `ErrorCard` component and inline error blocks. Prefer `ErrorCard` (or one pattern) for page/section-level errors so behavior and styling are consistent.

19. **Skeleton vs spinner** — Some pages use skeleton loaders, others use spinners. Define when to use which (e.g. skeleton for lists/cards, spinner for actions) and apply consistently.

20. **Primary button class** — Use a single primary CTA class (e.g. `btn-primary`) across pages so styling and hover/active states match everywhere.

---

## Layout & Responsive

21. **`overflow: hidden` clipping focus** — Many CSS files use `overflow: hidden` on containers. If focus moves inside, the focus ring can be clipped. Prefer `overflow-x: hidden` only where needed, or ensure focusable elements aren’t clipped.

22. **Z-index scale** — Multiple files set raw `z-index` values (e.g. ScanPage, HomePage, AppLayout, MyShelfPage, ProductScannerPage, modals, Toasts). Introduce a small scale (e.g. design-system tokens) to avoid stacking bugs and make layering predictable.

23. **Safe area on fixed elements** — Bottom nav and FABs use `env(safe-area-inset-bottom)`. Verify all fixed/sticky bottom UI (footer CTAs, modals, consent bar) respect safe areas on notched devices.

24. **Max-width and padding** — Some pages set both `max-width` and horizontal padding. Ensure on very narrow viewports (e.g. 320px) content doesn’t touch edges and that tap targets stay ≥44px.

25. **Two-column product grids on narrow phones** — Product grids are 2 columns down to 360px. Confirm card content (image, title, price, CTA) doesn’t overflow or truncate badly on 320–360px widths.

---

## Visual & Typography

26. **Hardcoded hex colors** — Many CSS files use `#xxx` or `rgb()` instead of design-system variables (e.g. `ProfileSettingsPage.css`, `TodayPage.css`, `digital-twin.css`, `HomePage.css`, `AuthPage.css`). Replace with variables for theming and consistency.

27. **Very small type** — Design system has `--text-xs: 12px`. Use sparingly and only for secondary info; ensure contrast meets WCAG AA (e.g. gray-500 on white).

28. **Font loading** — Inter is loaded from Google Fonts. Consider `font-display: swap` (or existing strategy) and a brief fallback so text doesn’t stay invisible; avoid layout shift when font loads.

29. **Inconsistent border radius** — Mix of `--border-radius-sm/md/lg` and ad-hoc values. Standardize card, button, and input radius per component type.

30. **Shadow consistency** — Multiple shadow variables and one-off `box-shadow` values. Use design-system shadow tokens for cards, modals, and dropdowns so elevation is consistent.

---

## Components & UI

31. **Modal focus trap** — ConfirmModal, ConsentModal, and profile modal: ensure focus is trapped inside when open, restored on close, and Escape closes the modal.

32. **BackButton usage** — BackButton exists; ensure all secondary/back actions use it where appropriate so behavior (history vs navigate) and styling are consistent.

33. **BackToTop visibility** — BackToTop should appear only after enough scroll and not cover critical content or bottom nav. Check threshold and positioning on mobile.

34. **AddToHomeScreenPrompt** — Positioning and z-index should sit above app content but below critical modals; ensure it doesn’t block primary CTAs on first load.

35. **NotificationBell dropdown** — When open, dropdown should have correct z-index, not be clipped by `overflow: hidden`, and close on outside click or Escape.

36. **Filter chips on Recommendations** — Filter chips (category, price, concern) should have clear active state and sufficient touch size (≥44px height) on mobile.

37. **History filter buttons** — "All Time", "Last 7 Days", etc.: ensure only one filter is clearly active and that the control is usable with keyboard and screen reader.

38. **My Shelf tabs** — Tabs (All, Using, Wishlist, Done) should have proper `role="tablist"`, `role="tab"`, and `aria-selected`; ensure keyboard navigation (arrows) works or is documented.

39. **Scan page tabs** — Face vs Product tabs: same tab semantics and keyboard behavior as My Shelf.

40. **Product image zoom overlay** — ProductDetailsPage zoom overlay has `role="dialog"`. Add focus trap, Escape to close, and ensure focus returns to trigger when closed.

---

## Copy & Messaging

41. **404 actions** — NotFound page offers "Go Home", "Start Scan", "Browse Products", "Contact Us". Ensure these match actual routes and that the first focusable element is the primary recovery action.

42. **Empty state CTAs** — Empty states (History, Favorites, My Shelf, etc.) should use action labels that match the next step (e.g. "Take Your First Scan" vs "Scan now") and be consistent in tone.

43. **Error messages** — ErrorCard and inline errors: use user-friendly, actionable copy and avoid raw API or technical messages in the UI.

44. **Session/ auth messages** — "Your session expired", "Too many attempts": ensure these appear in toast or inline and are visible to screen readers (`role="alert"` or live region).

---

## Performance & Robustness

45. **Inline styles** — Several components use `style={{ ... }}` for dimensions or spacing (e.g. Skeleton, LazyImage, ProgressChart). Prefer CSS classes or design tokens so overrides and responsive behavior are easier.

46. **LazyImage fallback** — LazyImage should have a clear loading and error state (placeholder or alt) so layout doesn’t jump and broken images are handled.

47. **Large CSS files** — `ProfileSettingsPage.css`, `ProductScannerPage.css`, `ScanPage.css`, `HomePage.css`, `AppLayout.css` are large. Consider splitting by section or component to improve maintainability and load only what’s needed if you add code-splitting per route.

48. **Recharts and layout** — Dashboard and Digital Twin use Recharts. Ensure charts are responsive (container query or width prop) and don’t overflow on small screens; provide a text summary or table for critical data when possible.

---

## Minor / Polish

49. **Breadcrumb route labels** — AppLayout breadcrumb `labelMap` may miss new or renamed routes (e.g. "skin-goals", "progress", "export"). Keep labelMap in sync with route config so breadcrumbs never show raw path segments.

50. **Footer newsletter form** — Newsletter signup in footer: ensure success/error feedback is visible and that the submit button has a clear loading state (e.g. "Subscribing…") to prevent double submit.

---

## Summary by category

| Category              | Count |
|-----------------------|-------|
| Accessibility         | 10    |
| Forms & Inputs        | 5     |
| Consistency & Patterns| 5     |
| Layout & Responsive   | 5     |
| Visual & Typography   | 5     |
| Components & UI       | 10    |
| Copy & Messaging      | 4     |
| Performance           | 3     |
| Polish                | 2     |

**Suggested order to fix:** Start with (1) focus visibility, (2) image alt text, (3) modal focus trap and Escape, (4) form labels and button types, (5) empty/error state consistency. Then tackle layout, z-index, and visual tokens.
