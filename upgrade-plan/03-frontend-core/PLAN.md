# Frontend Core — Design System, Components, Accessibility

**Sprint:** 1-3 (Weeks 1-6)
**Team Size:** 25 engineers
**Dependencies:** Architecture foundation (tokens, TanStack Query)

---

## FC1. Component Library (`frontend/src/ui/`)

Extract and standardize all reusable components into a dedicated `ui/` directory. Each component gets: TypeScript props, CSS Module, Storybook story, unit test.

### Primitives to Extract

| Component | Source | Props | Variants |
|-----------|--------|-------|----------|
| **Button** | `MobileButton.tsx` | size, variant, loading, disabled, icon, fullWidth | primary, secondary, outline, ghost, danger |
| **Input** | `MobileInput.tsx` | type, label, error, helper, icon, clearable | text, email, password, search, number |
| **Select** | inline in pages | options, value, onChange, label, error | default, searchable |
| **Textarea** | inline in pages | rows, maxLength, label, error | default, auto-resize |
| **Card** | `MobileCard.tsx` | variant, padding, pressable, onClick | elevated, outlined, filled, flat |
| **Modal** | `ConfirmModal.tsx` | open, onClose, title, actions | default, danger, info |
| **Sheet** | `MobileBottomSheet.tsx` | open, onClose, snapPoints | bottom, side |
| **Badge** | inline CSS | variant, size | default, success, warning, error, info |
| **Avatar** | inline in pages | src, fallback, size | xs, sm, md, lg, xl |
| **Spinner** | `LoadingSpinner.tsx` | size, color | default |
| **Skeleton** | `Skeleton.tsx` | variant, width, height | text, circle, card, stat, avatar |
| **Toast** | `Toast.tsx` | type, message, action | success, error, info, warning |
| **Tooltip** | new | content, placement | top, bottom, left, right |
| **Tabs** | inline in pages | items, activeKey, onChange | underline, pills, segmented |
| **Accordion** | FAQ in HomePage | items, allowMultiple | default |
| **DropdownMenu** | AppLayout menus | items, trigger | default |
| **Dialog** | new (modal variant) | open, onClose, title | default, fullscreen |
| **Switch** | inline in ProfileSettings | checked, onChange, label | default |
| **Checkbox** | inline in pages | checked, onChange, label | default |
| **RadioGroup** | inline in OnboardingPage | options, value, onChange | default, card |
| **Progress** | inline in pages | value, max, variant | bar, ring, steps |
| **Alert** | inline in pages | type, title, message, dismissible | info, success, warning, error |
| **EmptyState** | `EmptyState.tsx` | icon, title, description, action | compact, default, large |
| **ErrorCard** | `ErrorCard.tsx` | title, message, retry | default |

### Directory Structure
```
frontend/src/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.css
│   ├── Button.stories.tsx
│   └── Button.test.tsx
├── Input/
│   ├── Input.tsx
│   ├── Input.module.css
│   └── ...
├── Card/
├── Modal/
├── Sheet/
├── ... (24 components)
└── index.ts          — barrel export
```

### Storybook Setup
- Install Storybook 8: `npx storybook@latest init`
- Configure for Vite + React + TypeScript
- Add stories for every `ui/` component
- Add a11y addon (`@storybook/addon-a11y`)
- Deploy to Chromatic or Cloudflare Pages

---

## FC2. Accessibility (WCAG 2.1 AA)

### Global Requirements (Apply to Every Page)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Skip navigation | `<a href="#main" class="skip-link">Skip to content</a>` in AppLayout | Exists, verify |
| Page landmarks | `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>` | Audit all pages |
| Single `<h1>` per page | Audit: ensure proper heading hierarchy h1→h2→h3 | Fix violations |
| Form labels | Every `<input>` has `<label>` or `aria-label` | Audit all forms |
| Error messages | `aria-describedby` linking input → error message | Add to all forms |
| Focus visible | `:focus-visible` outline on all interactive elements | Already in base CSS |
| Focus trap | Modals/sheets trap focus, Escape closes | Verify all modals |
| Live regions | `aria-live="polite"` for toasts, notifications, scan status | Add where missing |
| Color contrast | >= 4.5:1 normal text, >= 3:1 large text | Audit with axe |
| Alt text | All `<img>` have descriptive alt (or `alt=""` + `aria-hidden` if decorative) | Audit all images |
| Keyboard nav | All interactive elements reachable via Tab, activated via Enter/Space | Test all pages |
| Reduced motion | `prefers-reduced-motion` disables animations | Partially done, complete |
| Screen reader route changes | Announce page title on navigation | Add to router |
| Touch targets | Minimum 44x44px on mobile | Already enforced |

### Per-Component Accessibility

| Component | ARIA Pattern |
|-----------|-------------|
| Button | `role="button"`, disabled → `aria-disabled`, loading → `aria-busy` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap |
| Sheet | Same as Modal, plus `aria-label` for close gesture |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow key nav |
| Accordion | `aria-expanded`, `aria-controls`, Enter/Space toggle |
| Toast | `role="alert"`, `aria-live="assertive"` for errors, `"polite"` for info |
| DropdownMenu | `role="menu"`, `role="menuitem"`, arrow key nav, Escape closes |
| Switch | `role="switch"`, `aria-checked` |
| Progress | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Spinner | `role="status"`, `aria-label="Loading"` |

### Testing
- Add `@axe-core/playwright` to E2E tests
- Run axe audits on every page in CI
- Target: zero critical/serious violations

---

## FC3. Dark Mode Improvements

### Current State
- `dark-mode.css` exists with `[data-theme="dark"]` variable overrides
- ThemeContext provides `theme`, `setTheme()`, `resolvedTheme`
- System preference detection works

### Improvements
1. Audit every page component for dark mode compatibility:

| Page | Issue | Fix |
|------|-------|-----|
| HomePage | Hero gradient may clash | Test + adjust gradient stops |
| AnalysisResults | Charts not dark-aware | Add dark variant to Recharts config |
| ScanPage | Camera overlay visibility | Adjust overlay opacity for dark |
| All forms | Input borders may be invisible | Ensure `--border-color` is visible |
| All cards | Shadow visibility | Switch to lighter shadow on dark bg |
| Images | Product images on dark bg | Add subtle border or bg card |
| Charts (Recharts) | Axis labels, grid lines | Use CSS vars for all chart colors |

2. Add dark mode toggle in multiple places:
   - Header (already exists via DarkModeToggle)
   - Profile settings → Appearance tab
   - Onboarding flow
3. Persist theme to localStorage AND user profile (sync across devices)

---

## FC4. i18n Setup

### Changes
1. Install `react-i18next` + `i18next`
2. Create namespace-based translation files:
```
frontend/src/i18n/
├── config.ts           — i18next config
├── locales/
│   ├── en/
│   │   ├── common.json     — shared strings (nav, buttons, labels)
│   │   ├── auth.json       — login, register, password reset
│   │   ├── scan.json       — scan flow strings
│   │   ├── dashboard.json  — dashboard strings
│   │   ├── products.json   — product-related strings
│   │   └── ... (per-feature)
│   ├── es/                 — Spanish (Sprint 6)
│   ├── fr/                 — French (Sprint 6)
│   └── de/                 — German (Sprint 6)
```
3. Extract ALL hardcoded strings from TSX files to translation keys
4. Add `<I18nextProvider>` to App.tsx
5. Add language selector in ProfileSettingsPage
6. Backend: store user's `language` preference in User model

---

## FC5. Performance Optimizations

| Optimization | Current | Target | How |
|--------------|---------|--------|-----|
| Initial bundle | ~1.2MB (estimate) | <200KB | Remove TF.js if unused, tree-shake |
| Route splitting | React.lazy (done) | Verify all heavy chunks lazy | Audit with bundle visualizer |
| List rendering | Full render | Virtual scroll | `@tanstack/react-virtual` for History, Products, Shelf |
| Image loading | LazyImage exists | Add blur-up placeholder | Generate low-res placeholder on upload |
| Font loading | System fallback | `font-display: swap` | Verify in CSS |
| Prefetching | None | Prefetch likely-next routes | `<link rel="prefetch">` for Scan, Dashboard |
| Web Vitals | Not tracked | Track CLS, LCP, FID | Add `web-vitals` package + analytics |
| TensorFlow.js | 4.22.0 (2.5MB gzipped) | Remove if unused | Audit: does any page import it? |

---

## FC6. CSS Module Migration

### Strategy
- Move from global CSS to CSS Modules for all page/component styles
- Prevents class name collisions
- Enables tree-shaking of unused styles
- Co-locate styles with components

### Migration per page
```
Before: ScanPage.tsx + ScanPage.css (global .scan-page class)
After:  ScanPage.tsx + ScanPage.module.css (scoped styles.scanPage)
```

### Priority: Migrate as pages are redesigned in Sprint 3-4
- Don't migrate everything at once
- Migrate during page redesign work
- Keep global CSS for truly global styles (tokens, resets, utilities)

---

## Deliverables
- [ ] 24 UI components in `src/ui/` with TypeScript, CSS Module, tests
- [ ] Storybook running with all components documented
- [ ] Zero axe accessibility violations on critical pages
- [ ] Dark mode verified on all pages
- [ ] i18n framework set up, English strings extracted
- [ ] Bundle size < 200KB initial JS
- [ ] Web Vitals tracking live
