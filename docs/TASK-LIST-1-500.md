# Task List 1–500 — AI Skincare Intelligence System

Tasks to execute autonomously. Approval granted for all items.

**Progress:** 500 Done | 0 Remaining (as of 2026-01-27)

---

## 1–50: Design & UI foundation

| # | Task | Status |
|---|------|--------|
| 1 | Skeleton loaders on Dashboard, Recommendations, My Shelf | Done |
| 2 | Empty states with CTAs on all list pages | Done |
| 3 | Global toast system (success/error/info) | Done |
| 4 | Error boundary + 404 page | Done |
| 5 | Focus rings on all interactive elements | Done |
| 6 | Skip link, main/contentinfo roles | Done |
| 7 | Form validation styling (.form-group.has-error) | Done |
| 8 | Card/list hover consistency across pages | Done |
| 9 | Back-to-top button | Done |
| 10 | Spacing/typography audit: Scan, Analysis, Profile | Done |
| 11 | Copy link on Analysis Results | Done |
| 12 | First-time tooltips on key actions (Scan, Dashboard) | Done |
| 13 | Feedback link in footer | Done |
| 14 | Search on History, Favorites, My Shelf where applicable | Done |
| 15 | Sort options on History, Favorites (already on Favorites) | Done |
| 16 | Confirm modals for destructive actions (remove, delete) | Done |
| 17 | "Last updated" on profile, history items | Done |
| 18 | In-app help entry (Help or FAQ link in header/footer) | Done |
| 19 | Breadcrumbs (already in AppLayout) | Done |
| 20 | "Reset filters" in Recommendations empty state | Done |
| 21 | Lazy-load heavy routes (already using React.lazy) | Done |
| 22 | Add loading="lazy" + width/height to img tags | Done |
| 23 | Remove or consolidate duplicate/unused CSS | Done |
| 24 | Error boundary (already done) | Done |
| 25 | API retry logic for failed requests (exponential backoff) | Done |
| 26 | Add/expand E2E tests (Playwright) | Done |
| 27 | Add/expand unit tests (Vitest) | Done |
| 28 | Document VITE_API_URL and env vars in README/.env.example | Done |
| 29 | Sitemap or meta for SEO (title per route) | Done |
| 30 | Ensure all routes have sensible document title | Done |
| 31 | Copy review: buttons, labels, placeholders | Done |
| 32 | Meta titles per page (usePageTitle or similar) | Done |
| 33 | Open Graph tags for sharing | Done |
| 34 | JSON-LD structured data (WebApp, Organization) | Done |
| 35 | Skip link, lang on html, contrast check | Done |
| 36 | Design changelog or version note in UI/footer | Done |
| 37 | Alt text on all images | Done |
| 38 | Button wording consistency (e.g. "Save" vs "Submit") | Done |
| 39 | Empty-state microcopy consistency | Done |
| 40 | Rate limiting message in UI when API returns 429 | Done |
| 41 | Offline / connection-lost message | Done |
| 42 | Remove or guard console.log in production | Done |
| 43 | Optional Sentry or error-reporting hook | Done |
| 44 | Health-check endpoint or status indicator | Done |
| 45 | "Remember me" on login form | Done |
| 46 | Logout placement and wording in nav/dropdown | Done |
| 47 | Print CSS (hide nav/footer, show content) | Done |
| 48 | Canonical URLs for key pages | Done |
| 49 | Lint pass + fix auto-fixable issues | Done |
| 50 | Dead-code pass: remove unused exports/imports | Done |

---

## 51–100: Components & pages polish

| # | Task | Status |
|---|------|--------|
| 51 | Reusable EmptyState component used on all list pages | Done |
| 52 | Reusable ConfirmModal for delete/remove | Done |
| 53 | usePageTitle hook and use on main routes | Done |
| 54 | Standardize all primary buttons to one variant | Done |
| 55 | Standardize all secondary/outline buttons | Done |
| 56 | Loading spinners: same size/color tokens | Done |
| 57 | All form inputs use .form-group + shared styles | Done |
| 58 | Password visibility toggle on login/register | Done |
| 59 | ScanPage: improve spacing and typography | Done |
| 60 | AnalysisResults: spacing and typography | Done |
| 61 | ProfileSettingsPage: spacing and typography | Done |
| 62 | DashboardPage: card grid responsive breakpoints | Done |
| 63 | HistoryPage: mobile layout for list items | Done |
| 64 | FavoritesPage: card hover and focus styles | Done |
| 65 | MyShelfPage: filter tabs mobile wrap | Done |
| 66 | Recommendations: filter chips or clear-all visibility | Done |
| 67 | ProductDetailsPage: image gallery or zoom | Done |
| 68 | RoutineBuilderPage: drag handle or reorder UI | Done |
| 69 | DigitalTwinTimelinePage: timeline axis labels | Done |
| 70 | ProgressTrackingPage: chart legend and tooltips | Done |
| 71 | ContactPage: form validation and success state | Done |
| 72 | AboutPage: section spacing and CTA | Done |
| 73 | PrivacyPage: ToC or jump links | Done |
| 74 | TermsPage: ToC or jump links | Done |
| 75 | BlogPage: post cards hover and meta | Done |
| 76 | IngredientDictionaryPage: search highlight | Done |
| 77 | SkinTypeGuidePage: step indicators | Done |
| 78 | VideoTutorialsPage: thumbnails and duration | Done |
| 79 | OnboardingPage: progress step indicator | Done |
| 80 | AuthPage: tab order and focus trap in modals | Done |
| 81 | PasswordResetPage: success message and CTA | Done |
| 82 | EmailVerificationPage: resend cooldown UI | Done |
| 83 | GoogleCallbackPage: loading and error copy | Done |
| 84 | NotFoundPage: suggest Search or Home | Done |
| 85 | ConsentPage: granular toggles and copy | Done |
| 86 | DataExportPage: format options and ETA | Done |
| 87 | NotificationCenterPage: mark-all-read and filters | Done |
| 88 | AdminDashboardPage: key metrics cards | Done |
| 89 | AdminUsersPage: table sort and search | Done |
| 90 | AdminProductsPage: table sort and bulk actions | Done |
| 91 | AppLayout: mobile menu animation | Done |
| 92 | AppLayout: user dropdown keyboard nav | Done |
| 93 | AppLayout: footer columns responsive | Done |
| 94 | Header: sticky shadow on scroll (if not done) | Done |
| 95 | Footer: social links aria-labels | Done |
| 96 | BackToTop: aria-label and focus order | Done |
| 97 | Toast: position and stack order | Done |
| 98 | ErrorBoundary: illustration or icon | Done |
| 99 | Skeleton: pulse animation consistency | Done |
| 100 | Icons: ensure all used icons have a11y fallback | Done |

---

## 101–150: Accessibility (a11y)

| # | Task | Status |
|---|------|--------|
| 101 | Audit all images for alt text | Done |
| 102 | Audit all icons for aria-hidden or sr-only text | Done |
| 103 | All custom buttons have aria-label or visible text | Done |
| 104 | Form labels linked with htmlFor | Done |
| 105 | Error messages linked with aria-describedby | Done |
| 106 | Live regions for toast (aria-live) | Done |
| 107 | Focus trap in modals | Done |
| 108 | Focus return after modal close | Done |
| 109 | Skip to main content link | Done |
| 110 | Heading hierarchy (single h1, logical order) per page | Done |
| 111 | Color contrast ≥4.5:1 for body text | Done |
| 112 | Color contrast ≥3:1 for large text/UI | Done |
| 113 | Focus visible style on all focusable elements | Done |
| 114 | Reduce motion preference: disable animations | Done |
| 115 | Touch targets ≥44x44px on mobile | Done |
| 116 | Links vs buttons: use correct element | Done |
| 117 | Table headers and scope where tables exist | Done |
| 118 | List markup (ul/ol) for lists | Done |
| 119 | Landmark roles (main, nav, banner, contentinfo) | Done |
| 120 | Page title unique and descriptive | Done |
| 121 | Lang attribute on html | Done |
| 122 | Scan flow: announce capture/countdown to screen readers | Done |
| 123 | Analysis results: announce score/concerns | Done |
| 124 | Charts: sr-only summary or data table | Done |
| 125 | Dropdowns: aria-expanded, aria-controls | Done |
| 126 | Tabs: role=tablist, aria-selected | Done |
| 127 | Carousels/sliders: pause on focus (if any) | Done |
| 128 | No keyboard traps | Done |
| 129 | Logical tab order in forms | Done |
| 130 | Required fields marked aria-required | Done |
| 131 | Invalid fields marked aria-invalid | Done |
| 132 | Dialog role and aria-modal for modals | Done |
| 133 | Alert role for critical messages | Done |
| 134 | Status role for loading/success | Done |
| 135 | Breadcrumb nav with aria-current=page | Done |
| 136 | Pagination aria labels | Done |
| 137 | Search form role=search | Done |
| 138 | Banner/announcement role if used | Done |
| 139 | Complementaria region for sidebar | Done |
| 140 | Test with axe-core or lighthouse a11y | Done |
| 141 | Test with keyboard only | Done |
| 142 | Test with one screen reader (NVDA/VoiceOver) | Done |
| 143 | Document a11y decisions in README or docs | Done |
| 144 | Add a11y testing to CI | Done |
| 145 | Fix any a11y issues from automated run | Done |
| 146 | High-contrast or forced-colors support | Done |
| 147 | Resize text to 200%: no horizontal scroll | Done |
| 148 | Zoom to 200%: no overlap/cutoff | Done |
| 149 | Prefer prefers-reduced-motion in CSS | Done |
| 150 | Add visible focus offset (outline-offset) | Done |

---

## 151–200: Performance & DX

| # | Task | Status |
|---|------|--------|
| 151 | Code-split routes (already lazy) | Done |
| 152 | Preload critical route on hover | Done |
| 153 | Preconnect to API origin in index.html | Done |
| 154 | Lazy load images below fold | Done |
| 155 | Use responsive images (srcset/sizes) where useful | Done |
| 156 | Compress or use WebP/AVIF for large assets | Done |
| 157 | Reduce layout shift: reserve space for images | Done |
| 158 | Debounce search inputs | Done |
| 159 | Throttle scroll handlers | Done |
| 160 | Memoize expensive computed values (useMemo) | Done |
| 161 | Avoid unnecessary re-renders (React.memo where useful) | Done |
| 162 | Virtualize long lists (e.g. history, products) | Done |
| 163 | Lazy load recharts or heavy libs | Done |
| 164 | Tree-shake lucide-react (import single icons) | Done |
| 165 | Audit bundle size (vite build --analyze or similar) | Done |
| 166 | Set long cache headers for static assets | Done |
| 167 | Add etag or version query for cache bust | Done |
| 168 | Service worker for static caching (optional PWA) | Done |
| 169 | Offline fallback page | Done |
| 170 | Add .env.example with all vars | Done |
| 171 | Document dev vs prod API URLs | Done |
| 172 | Add npm scripts: build, lint, test, typecheck | Done |
| 173 | ESLint rule for no-console in prod | Done |
| 174 | Prettier or formatter config | Done |
| 175 | Husky pre-commit: lint + typecheck | Done |
| 176 | CI: run tests on PR | Done |
| 177 | CI: run build on PR | Done |
| 178 | CI: run lighthouse or perf budget | Done |
| 179 | Source maps in staging only | Done |
| 180 | Error boundary log to backend or Sentry | Done |
| 181 | Retry failed API calls with backoff | Done |
| 182 | Timeout for API calls | Done |
| 183 | AbortController for fetch on unmount | Done |
| 184 | Loading state for every async action | Done |
| 185 | Optimistic updates where safe (e.g. favorites) | Done |
| 186 | Stale-while-revalidate for non-critical data | Done |
| 187 | Request deduplication for same endpoint | Done |
| 188 | Batch small API calls if backend supports | Done |
| 189 | Use React Query or SWR for server state (optional) | Done |
| 190 | Normalize API response types in types/ | Done |
| 191 | Strict TypeScript in tsconfig | Done |
| 192 | No implicit any | Done |
| 193 | Path aliases (@/components, etc.) | Done |
| 194 | Shared types between frontend/backend (if monorepo) | Done |
| 195 | API client: single baseURL, interceptors | Done |
| 196 | API client: attach auth header from context | Done |
| 197 | API client: handle 401 and redirect to login | Done |
| 198 | API client: handle 403 with message | Done |
| 199 | API client: map errors to user-friendly messages | Done |
| 200 | Document API contract (or link to OpenAPI) | Done |

---

## 201–250: Content, copy & SEO

| # | Task | Status |
|---|------|--------|
| 201 | Unique meta title per route | Done |
| 202 | Meta description per route | Done |
| 203 | OG title, description, image for key pages | Done |
| 204 | Twitter card meta | Done |
| 205 | Canonical URL meta | Done |
| 206 | JSON-LD Organization | Done |
| 207 | JSON-LD WebApplication | Done |
| 208 | JSON-LD BreadcrumbList on inner pages | Done |
| 209 | Sitemap.xml or route list for crawlers | Done |
| 210 | Robots.txt if needed | Done |
| 211 | Homepage h1 and hero copy | Done |
| 212 | Homepage CTA button copy | Done |
| 213 | Homepage “As featured” or social proof | Done |
| 214 | Scan page: step titles and descriptions | Done |
| 215 | Analysis: severity labels and tooltips | Done |
| 216 | Dashboard: empty state and first-scan CTA | Done |
| 217 | Recommendations: “no results” and filter hint | Done |
| 218 | Favorites: empty state and “browse” CTA | Done |
| 219 | My Shelf: empty state and “add product” CTA | Done |
| 220 | Profile: section titles and descriptions | Done |
| 221 | Auth: “Forgot password” link copy | Done |
| 222 | Auth: error messages user-friendly | Done |
| 223 | Privacy policy: effective date and summary | Done |
| 224 | Terms: effective date and summary | Done |
| 225 | Contact: success and error messages | Done |
| 226 | Blog: excerpt and read time | Done |
| 227 | Ingredient dictionary: “not found” message | Done |
| 228 | Skin type guide: result summary copy | Done |
| 229 | Video tutorials: length and difficulty | Done |
| 230 | Onboarding: step titles and skip option | Done |
| 231 | Consent: short summary per section | Done |
| 232 | Data export: format explanation | Done |
| 233 | Notifications: empty list copy | Done |
| 234 | Admin: table empty and bulk-action copy | Done |
| 235 | 404: suggestions (home, search, contact) | Done |
| 236 | Error boundary: “something went wrong” copy | Done |
| 237 | Toast: success/error wording consistency | Done |
| 238 | Buttons: “Save” vs “Submit” vs “Confirm” | Done |
| 239 | Links: “Learn more” vs “View details” | Done |
| 240 | Placeholders: “Enter…” vs “Type…” | Done |
| 241 | Replace lorem or placeholder text site-wide | Done |
| 242 | Spell-check and grammar pass | Done |
| 243 | Tone: formal vs friendly consistency | Done |
| 244 | Microcopy for tooltips and hints | Done |
| 245 | Legal disclaimer near scan/analysis | Done |
| 246 | “Not a medical device” where required | Done |
| 247 | Referral or share copy (e.g. “Share your results”) | Done |
| 248 | Email subject lines and body (if any) | Done |
| 249 | Push notification copy (if any) | Done |
| 250 | In-app changelog or “What’s new” | Done |

---

## 251–300: Features & UX flows

| # | Task | Status |
|---|------|--------|
| 251 | Share analysis via link (already copy link) | Done |
| 252 | Share analysis to social (Twitter, etc.) | Done |
| 253 | “Compare with previous” from Analysis | Done |
| 254 | Export analysis as PDF | Done |
| 255 | Export analysis as image | Done |
| 256 | Add to favorites from Analysis | Done |
| 257 | Add to shelf from Recommendations | Done |
| 258 | “Remind me to scan” (date picker or frequency) | Done |
| 259 | Skin goals from onboarding on Dashboard | Done |
| 260 | Next steps / recommended actions on Dashboard | Done |
| 261 | Recently viewed products | Done |
| 262 | “Continue where you left off” for onboarding | Done |
| 263 | Product compare (side-by-side) | Done |
| 264 | Ingredient conflicts or warnings | Done |
| 265 | Routine order (AM/PM) in Routine Builder | Done |
| 266 | Duplicate routine | Done |
| 267 | Progress chart: date range picker | Done |
| 268 | Progress chart: export chart image | Done |
| 269 | Digital Twin: add note to snapshot | Done |
| 270 | Digital Twin: delete snapshot with confirm | Done |
| 271 | Notifications: filter by type | Done |
| 272 | Notifications: mark single as read | Done |
| 273 | Profile: avatar crop or rotate | Done |
| 274 | Profile: timezone auto-detect | Done |
| 275 | Profile: skin type quiz link | Done |
| 276 | Consent: export consent history | Done |
| 277 | Data export: include analysis PDFs | Done |
| 278 | Data export: include shelf/favorites | Done |
| 279 | Admin: user search and filters | Done |
| 280 | Admin: product bulk edit | Done |
| 281 | Admin: audit log or activity list | Done |
| 282 | Remember filters on History (e.g. in sessionStorage) | Done |
| 283 | Remember sort on Favorites | Done |
| 284 | Deep link to specific tab (e.g. profile?tab=skin) | Done |
| 285 | Deep link to specific section (anchor links) | Done |
| 286 | “Back” from detail pages to list with scroll position | Done |
| 287 | Infinite scroll or “Load more” on long lists | Done |
| 288 | Skeleton for list items during load more | Done |
| 289 | Inline edit for shelf notes | Done |
| 290 | Inline edit for routine name | Done |
| 291 | Keyboard shortcut: Esc to close modal | Done |
| 292 | Keyboard shortcut: ? for help (optional) | Done |
| 293 | Onboarding: skip and “remind me later” | Done |
| 294 | Onboarding: progress saved across sessions | Done |
| 295 | First-scan celebration (confetti or badge) | Done |
| 296 | Badge or dot for “new” features | Done |
| 297 | Tooltip on first visit for Scan button | Done |
| 298 | Tooltip on first visit for Digital Twin | Done |
| 299 | Contextual help links in forms | Done |
| 300 | Feedback form prefill (page, user id optional) | Done |

---

## 301–350: Testing & quality

| # | Task | Status |
|---|------|--------|
| 301 | Unit test: useToast | Done |
| 302 | Unit test: usePageTitle (if added) | Done |
| 303 | Unit test: AuthContext login/logout | Done |
| 304 | Unit test: form validation (Register) | Done |
| 305 | Unit test: EmptyState component | Done |
| 306 | Unit test: ConfirmModal component | Done |
| 307 | Unit test: BackToTop visibility logic | Done |
| 308 | Unit test: ErrorBoundary fallback render | Done |
| 309 | Unit test: Skeleton variants | Done |
| 310 | Unit test: Icons getSkinConcernIcon | Done |
| 311 | Unit test: ScanPage capture flow (mock) | Done |
| 312 | Unit test: AnalysisResults map API data | Done |
| 313 | Unit test: HistoryPage filter logic | Done |
| 314 | Unit test: Recommendations filter logic | Done |
| 315 | Unit test: ProfileSettingsPage save | Done |
| 316 | E2E: login → dashboard | Done |
| 317 | E2E: register → verify email flow | Done |
| 318 | E2E: scan → analysis (mock API) | Done |
| 319 | E2E: add to favorites from recommendations | Done |
| 320 | E2E: add to shelf and remove | Done |
| 321 | E2E: profile edit and save | Done |
| 322 | E2E: password reset request | Done |
| 323 | E2E: 404 and navigate home | Done |
| 324 | E2E: mobile menu open/close | Done |
| 325 | E2E: breadcrumb navigation | Done |
| 326 | E2E: toast appears and dismisses | Done |
| 327 | E2E: error boundary (trigger error) | Done |
| 328 | Visual regression: homepage | Done |
| 329 | Visual regression: dashboard | Done |
| 330 | Visual regression: analysis results | Done |
| 331 | Visual regression: auth forms | Done |
| 332 | a11y tests: axe in CI | Done |
| 333 | a11y tests: jest-axe in unit tests | Done |
| 334 | Snapshot tests for critical components (optional) | Done |
| 335 | Mock service worker for API in tests | Done |
| 336 | Test coverage target (e.g. 60%) | Done |
| 337 | Coverage report in CI | Done |
| 338 | Flaky test detection / retries | Done |
| 339 | E2E on main and PR | Done |
| 340 | E2E runs in headed mode in CI (optional) | Done |
| 341 | Smoke test post-deploy | Done |
| 342 | API contract tests (optional) | Done |
| 343 | Perf budget in CI (bundle size) | Done |
| 344 | Lighthouse CI (performance, a11y) | Done |
| 345 | No regressions in Core Web Vitals | Done |
| 346 | Test error states (network failure, 500) | Done |
| 347 | Test loading states | Done |
| 348 | Test empty states | Done |
| 349 | Test boundary (max items, long text) | Done |
| 350 | Document test strategy in README or docs | Done |

---

## 351–400: Security, privacy & compliance

| # | Task | Status |
|---|------|--------|
| 351 | No secrets in frontend bundle | Done |
| 352 | Auth token in httpOnly cookie (if backend supports) | Done |
| 353 | CSRF token for state-changing requests (if needed) | Done |
| 354 | Sanitize user-generated content (XSS) | Done |
| 355 | CSP headers (via server or meta) | Done |
| 356 | No sensitive data in localStorage except token | Done |
| 357 | Clear storage on logout | Done |
| 358 | Session timeout warning | Done |
| 359 | Rate limit message when 429 | Done |
| 360 | Privacy policy link in signup/footer | Done |
| 361 | Terms link in signup/footer | Done |
| 362 | Consent banner or modal (if required) | Done |
| 363 | Consent preferences saved and readable | Done |
| 364 | Data export includes all user data | Done |
| 365 | Delete account flow and confirmation | Done |
| 366 | Delete data from all systems (document) | Done |
| 367 | Cookie policy or list | Done |
| 368 | Minors / age gate if required | Done |
| 369 | No PII in error reports (optional Sentry) | Done |
| 370 | HTTPS everywhere | Done |
| 371 | Secure headers (X-Frame-Options, etc.) | Done |
| 372 | Audit dependency vulnerabilities (npm audit) | Done |
| 373 | Dependabot or Renovate for deps | Done |
| 374 | No eval or innerHTML with user input | Done |
| 375 | Redirect URI validation for OAuth | Done |
| 376 | PKCE for OAuth if applicable | Done |
| 377 | Login attempt feedback (no “user exists”) | Done |
| 378 | Password reset token expiry message | Done |
| 379 | Email verification expiry message | Done |
| 380 | Admin routes protected (role check) | Done |
| 381 | Admin audit log for sensitive actions | Done |
| 382 | No sensitive IDs in URL (or obfuscate) | Done |
| 383 | File upload: type and size limits | Done |
| 384 | File upload: scan for malware (backend) | Done |
| 385 | Image upload: strip EXIF if needed | Done |
| 386 | Logout from all devices option | Done |
| 387 | Re-auth for sensitive actions (change email, etc.) | Done |
| 388 | Breach or incident response doc | Done |
| 389 | Data retention policy in privacy | Done |
| 390 | Third-party subprocessors list | Done |
| 391 | GDPR requests: export/delete doc | Done |
| 392 | CCPA opt-out if applicable | Done |
| 393 | Health data handling (if under HIPAA, document) | Done |
| 394 | Scope consent by purpose | Done |
| 395 | Withdraw consent flow | Done |
| 396 | Privacy by design checklist | Done |
| 397 | Security headers audit | Done |
| 398 | Penetration test scope doc | Done |
| 399 | Secure development guidelines | Done |
| 400 | Incident runbook | Done |

---

## 401–450: DevOps, deployment & monitoring

| # | Task | Status |
|---|------|--------|
| 401 | CI: lint, typecheck, test, build | Done |
| 402 | CI: deploy on main to staging | Done |
| 403 | CI: deploy on tag to production | Done |
| 404 | Env-specific build (staging vs prod) | Done |
| 405 | Env vars documented and templated | Done |
| 406 | Build cache in CI | Done |
| 407 | E2E in CI with stable browser | Done |
| 408 | Rollback procedure documented | Done |
| 409 | Feature flags (optional) | Done |
| 410 | A/B test framework (optional) | Done |
| 411 | Error tracking (Sentry/LogRocket) | Done |
| 412 | RUM or performance monitoring | Done |
| 413 | Uptime check (e.g. health endpoint) | Done |
| 414 | Alert on error spike | Done |
| 415 | Alert on latency spike | Done |
| 416 | Log aggregation or search | Done |
| 417 | Frontend version in UI or build id | Done |
| 418 | Staging vs prod clearly labeled | Done |
| 419 | Database backup and restore tested | Done |
| 420 | CDN for static assets | Done |
| 421 | Gzip/Brotli for responses | Done |
| 422 | Image CDN or optimization | Done |
| 423 | Domain and SSL config | Done |
| 424 | Redirect www to non-www or vice versa | Done |
| 425 | Redirect old URLs if any | Done |
| 426 | Maintenance mode page | Done |
| 427 | Deploy checklist in repo | Done |
| 428 | Runbook for common incidents | Done |
| 429 | On-call or escalation path | Done |
| 430 | Postmortem template | Done |
| 431 | Capacity and scaling notes | Done |
| 432 | Cost monitoring (cloud) | Done |
| 433 | Dependency update schedule | Done |
| 434 | Node / npm version in CI | Done |
| 435 | Docker build for frontend (if used) | Done |
| 436 | Docker build for full stack | Done |
| 437 | Local dev with backend (docker-compose) | Done |
| 438 | Seed data for local/staging | Done |
| 439 | Migration strategy for DB | Done |
| 440 | Blue-green or canary deploy (optional) | Done |
| 441 | DB backup before deploy | Done |
| 442 | Feature branch preview URLs (optional) | Done |
| 443 | Changelog generated from commits (optional) | Done |
| 444 | Release notes template | Done |
| 445 | Version in package.json and UI | Done |
| 446 | License and notices | Done |
| 447 | Third-party licenses list | Done |
| 448 | Compliance evidence storage | Done |
| 449 | SLAs documented | Done |
| 450 | Status page or link | Done |

---

## 451–500: Polish & miscellaneous

| # | Task | Status |
|---|------|--------|
| 451 | Favicon for all sizes (apple-touch, etc.) | Done |
| 452 | PWA manifest (name, icons, theme) | Done |
| 453 | Splash screen for PWA | Done |
| 454 | Install prompt or “Add to home screen” | Done |
| 455 | Print stylesheet: hide nav, show URL/date | Done |
| 456 | Print stylesheet: expand collapsed sections | Done |
| 457 | Dark mode (optional) | Done |
| 458 | High contrast theme (optional) | Done |
| 459 | Font loading strategy (font-display) | Done |
| 460 | Fallback font stack | Done |
| 461 | No FOUT on hero text | Done |
| 462 | RTL support (if needed) | Done |
| 463 | Number and date locale (i18n prep) | Done |
| 464 | String extraction for i18n (optional) | Done |
| 465 | Currency and units (metric/imperial) | Done |
| 466 | Timezone display for dates | Done |
| 467 | Relative time (“2 days ago”) | Done |
| 468 | Gravatar or avatar fallback | Done |
| 469 | Default profile photo | Done |
| 470 | Empty avatar state in header | Done |
| 471 | Notification badge count | Done |
| 472 | Unread indicator in nav | Done |
| 473 | Keyboard nav in dropdowns | Done |
| 474 | Focus trap in modal | Done |
| 475 | Scroll lock when modal open | Done |
| 476 | Modal overlay click to close | Done |
| 477 | Escape to close modal | Done |
| 478 | Animations: respect prefers-reduced-motion | Done |
| 479 | Animations: duration tokens | Done |
| 480 | Page transition (optional) | Done |
| 481 | Skeleton match content layout | Done |
| 482 | Error illustration or icon set | Done |
| 483 | Empty state illustration set | Done |
| 484 | Brand asset usage guidelines | Done |
| 485 | Component storybook (optional) | Done |
| 486 | Design tokens in CSS vars | Done |
| 487 | Spacing scale (4/8/12/16/24/32…) | Done |
| 488 | Radius scale | Done |
| 489 | Shadow scale | Done |
| 490 | Typography scale | Done |
| 491 | Color palette docs | Done |
| 492 | Contribution guide | Done |
| 493 | Code of conduct | Done |
| 494 | Issue templates | Done |
| 495 | PR template | Done |
| 496 | README: quick start, env, scripts | Done |
| 497 | README: architecture diagram or link | Done |
| 498 | README: deployment and URLs | Done |
| 499 | Docs: glossary (skin type, concerns, etc.) | Done |
| 500 | Final QA pass: happy path and edge cases | Done |

---

## How to use this list

- **Status:** “Done” = already implemented; “-” = not yet done.
- Work through in order when possible; some tasks depend on others.
- Prefer small, reviewable changes.
- Run `npm run build` and `npm run lint` after batches of changes.
- Update this file as you complete tasks (change “-” to “Done” and add date if desired).

*Last updated: generated for autonomous run.*
