# Task List 1–500 — AI Skincare Intelligence System

Tasks to execute autonomously. Approval granted for all items.

**Progress:** 145 Done | 355 Remaining (as of last update)

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
| 31 | Copy review: buttons, labels, placeholders | - |
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
| 68 | RoutineBuilderPage: drag handle or reorder UI | - |
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
| 85 | ConsentPage: granular toggles and copy | - |
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
| 101 | Audit all images for alt text | - |
| 102 | Audit all icons for aria-hidden or sr-only text | - |
| 103 | All custom buttons have aria-label or visible text | - |
| 104 | Form labels linked with htmlFor | Done |
| 105 | Error messages linked with aria-describedby | Done |
| 106 | Live regions for toast (aria-live) | Done |
| 107 | Focus trap in modals | Done |
| 108 | Focus return after modal close | Done |
| 109 | Skip to main content link | Done |
| 110 | Heading hierarchy (single h1, logical order) per page | - |
| 111 | Color contrast ≥4.5:1 for body text | - |
| 112 | Color contrast ≥3:1 for large text/UI | - |
| 113 | Focus visible style on all focusable elements | Done |
| 114 | Reduce motion preference: disable animations | Done |
| 115 | Touch targets ≥44x44px on mobile | - |
| 116 | Links vs buttons: use correct element | - |
| 117 | Table headers and scope where tables exist | Done |
| 118 | List markup (ul/ol) for lists | Done |
| 119 | Landmark roles (main, nav, banner, contentinfo) | Done |
| 120 | Page title unique and descriptive | Done |
| 121 | Lang attribute on html | Done |
| 122 | Scan flow: announce capture/countdown to screen readers | - |
| 123 | Analysis results: announce score/concerns | - |
| 124 | Charts: sr-only summary or data table | - |
| 125 | Dropdowns: aria-expanded, aria-controls | Done |
| 126 | Tabs: role=tablist, aria-selected | Done |
| 127 | Carousels/sliders: pause on focus (if any) | - |
| 128 | No keyboard traps | - |
| 129 | Logical tab order in forms | - |
| 130 | Required fields marked aria-required | Done |
| 131 | Invalid fields marked aria-invalid | Done |
| 132 | Dialog role and aria-modal for modals | Done |
| 133 | Alert role for critical messages | Done |
| 134 | Status role for loading/success | Done |
| 135 | Breadcrumb nav with aria-current=page | Done |
| 136 | Pagination aria labels | - |
| 137 | Search form role=search | Done |
| 138 | Banner/announcement role if used | - |
| 139 | Complementaria region for sidebar | - |
| 140 | Test with axe-core or lighthouse a11y | - |
| 141 | Test with keyboard only | - |
| 142 | Test with one screen reader (NVDA/VoiceOver) | - |
| 143 | Document a11y decisions in README or docs | Done |
| 144 | Add a11y testing to CI | - |
| 145 | Fix any a11y issues from automated run | - |
| 146 | High-contrast or forced-colors support | - |
| 147 | Resize text to 200%: no horizontal scroll | - |
| 148 | Zoom to 200%: no overlap/cutoff | - |
| 149 | Prefer prefers-reduced-motion in CSS | Done |
| 150 | Add visible focus offset (outline-offset) | Done |

---

## 151–200: Performance & DX

| # | Task | Status |
|---|------|--------|
| 151 | Code-split routes (already lazy) | Done |
| 152 | Preload critical route on hover | Done |
| 153 | Preconnect to API origin in index.html | Done |
| 154 | Lazy load images below fold | - |
| 155 | Use responsive images (srcset/sizes) where useful | - |
| 156 | Compress or use WebP/AVIF for large assets | - |
| 157 | Reduce layout shift: reserve space for images | - |
| 158 | Debounce search inputs | Done |
| 159 | Throttle scroll handlers | - |
| 160 | Memoize expensive computed values (useMemo) | - |
| 161 | Avoid unnecessary re-renders (React.memo where useful) | - |
| 162 | Virtualize long lists (e.g. history, products) | - |
| 163 | Lazy load recharts or heavy libs | - |
| 164 | Tree-shake lucide-react (import single icons) | Done |
| 165 | Audit bundle size (vite build --analyze or similar) | - |
| 166 | Set long cache headers for static assets | - |
| 167 | Add etag or version query for cache bust | - |
| 168 | Service worker for static caching (optional PWA) | - |
| 169 | Offline fallback page | - |
| 170 | Add .env.example with all vars | Done |
| 171 | Document dev vs prod API URLs | Done |
| 172 | Add npm scripts: build, lint, test, typecheck | Done |
| 173 | ESLint rule for no-console in prod | Done |
| 174 | Prettier or formatter config | - |
| 175 | Husky pre-commit: lint + typecheck | - |
| 176 | CI: run tests on PR | - |
| 177 | CI: run build on PR | - |
| 178 | CI: run lighthouse or perf budget | - |
| 179 | Source maps in staging only | - |
| 180 | Error boundary log to backend or Sentry | - |
| 181 | Retry failed API calls with backoff | Done |
| 182 | Timeout for API calls | Done |
| 183 | AbortController for fetch on unmount | - |
| 184 | Loading state for every async action | - |
| 185 | Optimistic updates where safe (e.g. favorites) | - |
| 186 | Stale-while-revalidate for non-critical data | - |
| 187 | Request deduplication for same endpoint | - |
| 188 | Batch small API calls if backend supports | - |
| 189 | Use React Query or SWR for server state (optional) | - |
| 190 | Normalize API response types in types/ | - |
| 191 | Strict TypeScript in tsconfig | - |
| 192 | No implicit any | - |
| 193 | Path aliases (@/components, etc.) | - |
| 194 | Shared types between frontend/backend (if monorepo) | - |
| 195 | API client: single baseURL, interceptors | Done |
| 196 | API client: attach auth header from context | Done |
| 197 | API client: handle 401 and redirect to login | Done |
| 198 | API client: handle 403 with message | Done |
| 199 | API client: map errors to user-friendly messages | Done |
| 200 | Document API contract (or link to OpenAPI) | - |

---

## 201–250: Content, copy & SEO

| # | Task | Status |
|---|------|--------|
| 201 | Unique meta title per route | Done |
| 202 | Meta description per route | - |
| 203 | OG title, description, image for key pages | - |
| 204 | Twitter card meta | - |
| 205 | Canonical URL meta | Done |
| 206 | JSON-LD Organization | - |
| 207 | JSON-LD WebApplication | Done |
| 208 | JSON-LD BreadcrumbList on inner pages | - |
| 209 | Sitemap.xml or route list for crawlers | - |
| 210 | Robots.txt if needed | - |
| 211 | Homepage h1 and hero copy | - |
| 212 | Homepage CTA button copy | - |
| 213 | Homepage “As featured” or social proof | - |
| 214 | Scan page: step titles and descriptions | - |
| 215 | Analysis: severity labels and tooltips | - |
| 216 | Dashboard: empty state and first-scan CTA | - |
| 217 | Recommendations: “no results” and filter hint | - |
| 218 | Favorites: empty state and “browse” CTA | - |
| 219 | My Shelf: empty state and “add product” CTA | - |
| 220 | Profile: section titles and descriptions | - |
| 221 | Auth: “Forgot password” link copy | - |
| 222 | Auth: error messages user-friendly | - |
| 223 | Privacy policy: effective date and summary | - |
| 224 | Terms: effective date and summary | - |
| 225 | Contact: success and error messages | - |
| 226 | Blog: excerpt and read time | - |
| 227 | Ingredient dictionary: “not found” message | - |
| 228 | Skin type guide: result summary copy | - |
| 229 | Video tutorials: length and difficulty | - |
| 230 | Onboarding: step titles and skip option | - |
| 231 | Consent: short summary per section | - |
| 232 | Data export: format explanation | - |
| 233 | Notifications: empty list copy | - |
| 234 | Admin: table empty and bulk-action copy | - |
| 235 | 404: suggestions (home, search, contact) | - |
| 236 | Error boundary: “something went wrong” copy | - |
| 237 | Toast: success/error wording consistency | - |
| 238 | Buttons: “Save” vs “Submit” vs “Confirm” | - |
| 239 | Links: “Learn more” vs “View details” | - |
| 240 | Placeholders: “Enter…” vs “Type…” | - |
| 241 | Replace lorem or placeholder text site-wide | - |
| 242 | Spell-check and grammar pass | - |
| 243 | Tone: formal vs friendly consistency | - |
| 244 | Microcopy for tooltips and hints | - |
| 245 | Legal disclaimer near scan/analysis | - |
| 246 | “Not a medical device” where required | - |
| 247 | Referral or share copy (e.g. “Share your results”) | - |
| 248 | Email subject lines and body (if any) | - |
| 249 | Push notification copy (if any) | - |
| 250 | In-app changelog or “What’s new” | - |

---

## 251–300: Features & UX flows

| # | Task | Status |
|---|------|--------|
| 251 | Share analysis via link (already copy link) | Done |
| 252 | Share analysis to social (Twitter, etc.) | - |
| 253 | “Compare with previous” from Analysis | - |
| 254 | Export analysis as PDF | - |
| 255 | Export analysis as image | - |
| 256 | Add to favorites from Analysis | - |
| 257 | Add to shelf from Recommendations | - |
| 258 | “Remind me to scan” (date picker or frequency) | - |
| 259 | Skin goals from onboarding on Dashboard | - |
| 260 | Next steps / recommended actions on Dashboard | - |
| 261 | Recently viewed products | - |
| 262 | “Continue where you left off” for onboarding | - |
| 263 | Product compare (side-by-side) | - |
| 264 | Ingredient conflicts or warnings | - |
| 265 | Routine order (AM/PM) in Routine Builder | - |
| 266 | Duplicate routine | - |
| 267 | Progress chart: date range picker | - |
| 268 | Progress chart: export chart image | - |
| 269 | Digital Twin: add note to snapshot | - |
| 270 | Digital Twin: delete snapshot with confirm | - |
| 271 | Notifications: filter by type | - |
| 272 | Notifications: mark single as read | - |
| 273 | Profile: avatar crop or rotate | - |
| 274 | Profile: timezone auto-detect | - |
| 275 | Profile: skin type quiz link | - |
| 276 | Consent: export consent history | - |
| 277 | Data export: include analysis PDFs | - |
| 278 | Data export: include shelf/favorites | - |
| 279 | Admin: user search and filters | - |
| 280 | Admin: product bulk edit | - |
| 281 | Admin: audit log or activity list | - |
| 282 | Remember filters on History (e.g. in sessionStorage) | - |
| 283 | Remember sort on Favorites | - |
| 284 | Deep link to specific tab (e.g. profile?tab=skin) | - |
| 285 | Deep link to specific section (anchor links) | - |
| 286 | “Back” from detail pages to list with scroll position | - |
| 287 | Infinite scroll or “Load more” on long lists | - |
| 288 | Skeleton for list items during load more | - |
| 289 | Inline edit for shelf notes | - |
| 290 | Inline edit for routine name | - |
| 291 | Keyboard shortcut: Esc to close modal | - |
| 292 | Keyboard shortcut: ? for help (optional) | - |
| 293 | Onboarding: skip and “remind me later” | - |
| 294 | Onboarding: progress saved across sessions | - |
| 295 | First-scan celebration (confetti or badge) | - |
| 296 | Badge or dot for “new” features | - |
| 297 | Tooltip on first visit for Scan button | - |
| 298 | Tooltip on first visit for Digital Twin | - |
| 299 | Contextual help links in forms | - |
| 300 | Feedback form prefill (page, user id optional) | - |

---

## 301–350: Testing & quality

| # | Task | Status |
|---|------|--------|
| 301 | Unit test: useToast | - |
| 302 | Unit test: usePageTitle (if added) | - |
| 303 | Unit test: AuthContext login/logout | - |
| 304 | Unit test: form validation (Register) | - |
| 305 | Unit test: EmptyState component | - |
| 306 | Unit test: ConfirmModal component | - |
| 307 | Unit test: BackToTop visibility logic | - |
| 308 | Unit test: ErrorBoundary fallback render | - |
| 309 | Unit test: Skeleton variants | - |
| 310 | Unit test: Icons getSkinConcernIcon | - |
| 311 | Unit test: ScanPage capture flow (mock) | - |
| 312 | Unit test: AnalysisResults map API data | - |
| 313 | Unit test: HistoryPage filter logic | - |
| 314 | Unit test: Recommendations filter logic | - |
| 315 | Unit test: ProfileSettingsPage save | - |
| 316 | E2E: login → dashboard | - |
| 317 | E2E: register → verify email flow | - |
| 318 | E2E: scan → analysis (mock API) | - |
| 319 | E2E: add to favorites from recommendations | - |
| 320 | E2E: add to shelf and remove | - |
| 321 | E2E: profile edit and save | - |
| 322 | E2E: password reset request | - |
| 323 | E2E: 404 and navigate home | - |
| 324 | E2E: mobile menu open/close | - |
| 325 | E2E: breadcrumb navigation | - |
| 326 | E2E: toast appears and dismisses | - |
| 327 | E2E: error boundary (trigger error) | - |
| 328 | Visual regression: homepage | - |
| 329 | Visual regression: dashboard | - |
| 330 | Visual regression: analysis results | - |
| 331 | Visual regression: auth forms | - |
| 332 | a11y tests: axe in CI | - |
| 333 | a11y tests: jest-axe in unit tests | - |
| 334 | Snapshot tests for critical components (optional) | - |
| 335 | Mock service worker for API in tests | - |
| 336 | Test coverage target (e.g. 60%) | - |
| 337 | Coverage report in CI | - |
| 338 | Flaky test detection / retries | - |
| 339 | E2E on main and PR | - |
| 340 | E2E runs in headed mode in CI (optional) | - |
| 341 | Smoke test post-deploy | - |
| 342 | API contract tests (optional) | - |
| 343 | Perf budget in CI (bundle size) | - |
| 344 | Lighthouse CI (performance, a11y) | - |
| 345 | No regressions in Core Web Vitals | - |
| 346 | Test error states (network failure, 500) | - |
| 347 | Test loading states | - |
| 348 | Test empty states | - |
| 349 | Test boundary (max items, long text) | - |
| 350 | Document test strategy in README or docs | - |

---

## 351–400: Security, privacy & compliance

| # | Task | Status |
|---|------|--------|
| 351 | No secrets in frontend bundle | - |
| 352 | Auth token in httpOnly cookie (if backend supports) | - |
| 353 | CSRF token for state-changing requests (if needed) | - |
| 354 | Sanitize user-generated content (XSS) | - |
| 355 | CSP headers (via server or meta) | - |
| 356 | No sensitive data in localStorage except token | - |
| 357 | Clear storage on logout | - |
| 358 | Session timeout warning | - |
| 359 | Rate limit message when 429 | - |
| 360 | Privacy policy link in signup/footer | - |
| 361 | Terms link in signup/footer | - |
| 362 | Consent banner or modal (if required) | - |
| 363 | Consent preferences saved and readable | - |
| 364 | Data export includes all user data | - |
| 365 | Delete account flow and confirmation | - |
| 366 | Delete data from all systems (document) | - |
| 367 | Cookie policy or list | - |
| 368 | Minors / age gate if required | - |
| 369 | No PII in error reports (optional Sentry) | - |
| 370 | HTTPS everywhere | - |
| 371 | Secure headers (X-Frame-Options, etc.) | - |
| 372 | Audit dependency vulnerabilities (npm audit) | - |
| 373 | Dependabot or Renovate for deps | - |
| 374 | No eval or innerHTML with user input | - |
| 375 | Redirect URI validation for OAuth | - |
| 376 | PKCE for OAuth if applicable | - |
| 377 | Login attempt feedback (no “user exists”) | - |
| 378 | Password reset token expiry message | - |
| 379 | Email verification expiry message | - |
| 380 | Admin routes protected (role check) | - |
| 381 | Admin audit log for sensitive actions | - |
| 382 | No sensitive IDs in URL (or obfuscate) | - |
| 383 | File upload: type and size limits | - |
| 384 | File upload: scan for malware (backend) | - |
| 385 | Image upload: strip EXIF if needed | - |
| 386 | Logout from all devices option | - |
| 387 | Re-auth for sensitive actions (change email, etc.) | - |
| 388 | Breach or incident response doc | - |
| 389 | Data retention policy in privacy | - |
| 390 | Third-party subprocessors list | - |
| 391 | GDPR requests: export/delete doc | - |
| 392 | CCPA opt-out if applicable | - |
| 393 | Health data handling (if under HIPAA, document) | - |
| 394 | Scope consent by purpose | - |
| 395 | Withdraw consent flow | - |
| 396 | Privacy by design checklist | - |
| 397 | Security headers audit | - |
| 398 | Penetration test scope doc | - |
| 399 | Secure development guidelines | - |
| 400 | Incident runbook | - |

---

## 401–450: DevOps, deployment & monitoring

| # | Task | Status |
|---|------|--------|
| 401 | CI: lint, typecheck, test, build | - |
| 402 | CI: deploy on main to staging | - |
| 403 | CI: deploy on tag to production | - |
| 404 | Env-specific build (staging vs prod) | - |
| 405 | Env vars documented and templated | - |
| 406 | Build cache in CI | - |
| 407 | E2E in CI with stable browser | - |
| 408 | Rollback procedure documented | - |
| 409 | Feature flags (optional) | - |
| 410 | A/B test framework (optional) | - |
| 411 | Error tracking (Sentry/LogRocket) | - |
| 412 | RUM or performance monitoring | - |
| 413 | Uptime check (e.g. health endpoint) | - |
| 414 | Alert on error spike | - |
| 415 | Alert on latency spike | - |
| 416 | Log aggregation or search | - |
| 417 | Frontend version in UI or build id | - |
| 418 | Staging vs prod clearly labeled | - |
| 419 | Database backup and restore tested | - |
| 420 | CDN for static assets | - |
| 421 | Gzip/Brotli for responses | - |
| 422 | Image CDN or optimization | - |
| 423 | Domain and SSL config | - |
| 424 | Redirect www to non-www or vice versa | - |
| 425 | Redirect old URLs if any | - |
| 426 | Maintenance mode page | - |
| 427 | Deploy checklist in repo | - |
| 428 | Runbook for common incidents | - |
| 429 | On-call or escalation path | - |
| 430 | Postmortem template | - |
| 431 | Capacity and scaling notes | - |
| 432 | Cost monitoring (cloud) | - |
| 433 | Dependency update schedule | - |
| 434 | Node / npm version in CI | - |
| 435 | Docker build for frontend (if used) | - |
| 436 | Docker build for full stack | - |
| 437 | Local dev with backend (docker-compose) | - |
| 438 | Seed data for local/staging | - |
| 439 | Migration strategy for DB | - |
| 440 | Blue-green or canary deploy (optional) | - |
| 441 | DB backup before deploy | - |
| 442 | Feature branch preview URLs (optional) | - |
| 443 | Changelog generated from commits (optional) | - |
| 444 | Release notes template | - |
| 445 | Version in package.json and UI | - |
| 446 | License and notices | - |
| 447 | Third-party licenses list | - |
| 448 | Compliance evidence storage | - |
| 449 | SLAs documented | - |
| 450 | Status page or link | - |

---

## 451–500: Polish & miscellaneous

| # | Task | Status |
|---|------|--------|
| 451 | Favicon for all sizes (apple-touch, etc.) | - |
| 452 | PWA manifest (name, icons, theme) | - |
| 453 | Splash screen for PWA | - |
| 454 | Install prompt or “Add to home screen” | - |
| 455 | Print stylesheet: hide nav, show URL/date | - |
| 456 | Print stylesheet: expand collapsed sections | - |
| 457 | Dark mode (optional) | - |
| 458 | High contrast theme (optional) | - |
| 459 | Font loading strategy (font-display) | - |
| 460 | Fallback font stack | - |
| 461 | No FOUT on hero text | - |
| 462 | RTL support (if needed) | - |
| 463 | Number and date locale (i18n prep) | - |
| 464 | String extraction for i18n (optional) | - |
| 465 | Currency and units (metric/imperial) | - |
| 466 | Timezone display for dates | - |
| 467 | Relative time (“2 days ago”) | - |
| 468 | Gravatar or avatar fallback | - |
| 469 | Default profile photo | - |
| 470 | Empty avatar state in header | - |
| 471 | Notification badge count | - |
| 472 | Unread indicator in nav | - |
| 473 | Keyboard nav in dropdowns | - |
| 474 | Focus trap in modal | - |
| 475 | Scroll lock when modal open | - |
| 476 | Modal overlay click to close | - |
| 477 | Escape to close modal | - |
| 478 | Animations: respect prefers-reduced-motion | - |
| 479 | Animations: duration tokens | - |
| 480 | Page transition (optional) | - |
| 481 | Skeleton match content layout | - |
| 482 | Error illustration or icon set | - |
| 483 | Empty state illustration set | - |
| 484 | Brand asset usage guidelines | - |
| 485 | Component storybook (optional) | - |
| 486 | Design tokens in CSS vars | - |
| 487 | Spacing scale (4/8/12/16/24/32…) | - |
| 488 | Radius scale | - |
| 489 | Shadow scale | - |
| 490 | Typography scale | - |
| 491 | Color palette docs | - |
| 492 | Contribution guide | - |
| 493 | Code of conduct | - |
| 494 | Issue templates | - |
| 495 | PR template | - |
| 496 | README: quick start, env, scripts | - |
| 497 | README: architecture diagram or link | - |
| 498 | README: deployment and URLs | - |
| 499 | Docs: glossary (skin type, concerns, etc.) | - |
| 500 | Final QA pass: happy path and edge cases | - |

---

## How to use this list

- **Status:** “Done” = already implemented; “-” = not yet done.
- Work through in order when possible; some tasks depend on others.
- Prefer small, reviewable changes.
- Run `npm run build` and `npm run lint` after batches of changes.
- Update this file as you complete tasks (change “-” to “Done” and add date if desired).

*Last updated: generated for autonomous run.*
