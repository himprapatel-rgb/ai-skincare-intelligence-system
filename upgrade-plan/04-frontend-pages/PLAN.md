# Frontend Pages — Per-Page Upgrade Plan

**Sprint:** 3-5 (Weeks 5-10)
**Team Size:** 60 engineers
**Dependencies:** Component library (FC1), Backend API upgrades (Sprint 2)

---

## Priority Tiers

### Tier 1 — Core User Flow (Sprint 3)
Pages every user touches. Redesign first.

### Tier 2 — Feature Pages (Sprint 4)
Important but not in primary flow.

### Tier 3 — Secondary Pages (Sprint 4-5)
Educational, legal, admin pages.

---

## TIER 1: CORE USER FLOW

### 1. HomePage (`HomePage.tsx`, 510 lines, `HomePage.css`)
**Route:** `/home`

| Area | Current | Upgrade |
|------|---------|---------|
| Hero | Static text + illustration | Add hero video/animation showing scan flow; "Try Demo Scan" CTA |
| Social proof | Trust badges grid | Add animated user count, scan count, rating |
| Features | Feature cards | Interactive feature cards with hover animations |
| Testimonials | Static cards | Swipeable carousel with photos + star ratings |
| FAQ | Accordion | Keep, improve animation smoothness |
| CTA | Link button | Gradient full-width button, mobile-optimized |
| **Responsive** | Mobile sections hidden | All sections visible at all breakpoints |
| **Dark mode** | Untested | Verify hero gradient, card backgrounds, text contrast |
| **A11y** | Missing landmarks | Add section headings, ARIA labels, alt text |
| **Animation** | FadeInSection exists | Add parallax hero, counter animation, scroll-triggered reveals |
| **Performance** | All loads at once | Lazy load below-fold sections, preload hero image |

### 2. AuthPage (`AuthPage.tsx`, `AuthPage.css`)
**Route:** `/auth`

| Area | Current | Upgrade |
|------|---------|---------|
| Layout | Single form card | Split: illustration left, form right (desktop) |
| Login | Email/password + Google | Add password strength meter, "Remember me" |
| Register | Email/password + Google + consent | Add progress steps, name field validation |
| OAuth | Google only | Add Apple Sign-In (future) |
| **Responsive** | Works but basic | Full-screen form on mobile, split on desktop |
| **Dark mode** | Verify inputs | Ensure form inputs visible on dark bg |
| **A11y** | Basic | Focus management on tab switch, error announcements |
| **Animation** | None | Smooth tab transition login↔register |
| **Error** | Inline text | Rate limit feedback ("Too many attempts, try in X min") |

### 3. ScanPage (`ScanPage.tsx`, 1201 lines)
**Route:** `/scan`

| Area | Current | Upgrade |
|------|---------|---------|
| Camera | Live with MediaPipe | Add quality meter (lighting, angle, distance) |
| Upload | Photo upload + compress | Save to gallery before uploading |
| Progress | Status polling | WebSocket real-time progress bar |
| Multi-photo | Single shot | Add front + left + right capture (3-photo scan) |
| Product mode | `?mode=product` | Tab between face scan and product barcode scan |
| **Responsive** | Full-screen mobile | Maintain full-screen camera at all sizes |
| **A11y** | Camera permission prompt | Announce scan progress, keyboard alternative (file upload) |
| **Animation** | Pulsing overlay | Smooth transitions: capture → processing → complete |
| **Error** | Basic messages | Camera denied, no camera, upload too large, network failure |
| **Refactor** | 1201 lines | Extract: CameraView, ScanProgress, ScanResults sub-components |

### 4. AnalysisResults (`AnalysisResults.tsx`, 823 lines)
**Route:** `/analysis/:analysisId`

| Area | Current | Upgrade |
|------|---------|---------|
| Score display | Score cards | Dashboard-style: large score circle + trend sparkline |
| Heatmap | FaceHeatmap component | Make clickable: tap zone → concern detail |
| Concerns | List with severity | Expandable cards with "What this means" explainer |
| Recommendations | Product list | Inline with concerns: "For your dryness, try..." |
| Compare | Link to comparison | Inline mini-comparison with previous scan |
| Export | PDF/image/derm report | Keep all, improve PDF layout |
| Share | X + native share | Add copy link, generate shareable image |
| **Responsive** | Needs work | 2-col on tablet (score+heatmap | concerns), 3-col desktop |
| **Dark mode** | Charts issue | Dark-aware Recharts config |
| **A11y** | Missing chart alt | Screen reader description of scores, concern list semantics |
| **Animation** | None | Score counter animate up, concern cards slide in |

### 5. DashboardPage (`DashboardPage.tsx`, 573 lines)
**Route:** `/dashboard`

| Area | Current | Upgrade |
|------|---------|---------|
| Greeting | Text | Personalized: "Good morning, {name}" with weather |
| Stats | Cards | Widget-based: score trend, scan consistency, goal progress, shelf count |
| Activity | Recent list | Timeline with icons for each activity type |
| Reminders | Scan reminder | Add routine reminder, product expiry alert, UV alert |
| Quick actions | CTAs | Prominent scan button, log routine, check ingredient |
| **Responsive** | Single column | 2-col tablet, 3-col desktop widget grid |
| **Dark mode** | Verify | Test all stat cards and charts |
| **A11y** | Basic | Dashboard landmark, widget titles as headings |
| **Performance** | Sequential loads | Parallel API calls + skeleton loading per widget |

### 6. MePage (`MePage.tsx`)
**Route:** `/me`

| Area | Current | Upgrade |
|------|---------|---------|
| Profile card | Avatar + name | Add stats: total scans, avg score, shelf count |
| Quick links | List | Cards with icons: shelf, favorites, settings, goals |
| Clinical summary | None | Last scan score + top concern + next scan reminder |
| Completion | None | Profile completion progress bar |
| **Responsive** | Single column | 2-col on tablet |
| **Dark mode** | Verify | Avatar border, card backgrounds |

### 7. Recommendations (`Recommendations.tsx`, 615 lines)
**Route:** `/recommendations`

| Area | Current | Upgrade |
|------|---------|---------|
| Product grid | Cards | Add "Why recommended" tag per product |
| Filters | Category, price, concern | Add skin type, brand, rating, vegan/cruelty-free |
| Sort | Basic | Price, rating, name, match score, newest |
| Actions | Favorite, compare | Quick add to shelf, "Safe for me?" check |
| Compare | Select up to 4 | Side-by-side modal comparison |
| **Responsive** | Grid works | 1-col mobile, 2-col tablet, 3-col desktop |
| **Performance** | Load all | Infinite scroll with TanStack Query |

### 8. MyShelfPage (`MyShelfPage.tsx`, 483 lines)
**Route:** `/myshelf`

| Area | Current | Upgrade |
|------|---------|---------|
| View | Grid | Grid/list toggle |
| Status | Badges | Color-coded: active (green), wishlist (blue), finished (gray) |
| Expiry | None visible | Expiry countdown badge, "Expiring soon" alert |
| Repurchase | None visible | Repurchase counter, "Buy again" button |
| Actions | Edit, remove | Bulk actions: delete, change status |
| Categories | Filter | Tab-based category filter |
| **Responsive** | Grid works | 1/2/3 column responsive |
| **Empty state** | Basic | Illustration + "Add your first product" CTA |

---

## TIER 2: FEATURE PAGES

### 9. RoutineBuilderPage (`RoutineBuilderPage.tsx`, 556 lines)
**Route:** `/routine-builder`

| Upgrade | Details |
|---------|---------|
| AI suggestion | "Generate routine for me" button → AI builds AM/PM from profile |
| Drag-reorder | Already exists, polish touch interactions |
| Product search | Add inline product search when adding step |
| Check-in | "I completed this routine" button → logs to goals |
| Share | Generate shareable routine link |
| **A11y** | Keyboard alternative for drag-reorder |

### 10. ProductDetailsPage (`ProductDetailsPage.tsx`, 1230 lines)
**Route:** `/product/:id`

| Upgrade | Details |
|---------|---------|
| Hero | Large product image with gallery |
| Safety | Personalized ingredient warnings based on profile allergies |
| "Safe for me?" | Check button → analyzes against user allergies/skin type |
| Reviews | Review section with submit form, ratings breakdown |
| Where to buy | Store links, Amazon affiliate |
| Similar | "You might also like" product carousel |
| **Refactor** | 1230 lines → extract: IngredientList, ReviewSection, SafetyReport |

### 11. HistoryPage (`HistoryPage.tsx`, 300 lines)
**Route:** `/history`

| Upgrade | Details |
|---------|---------|
| View | Timeline view with calendar heatmap showing scan frequency |
| Pagination | Infinite scroll / cursor-based |
| Filters | Date range, score range, concerns |
| Compare | Select any 2 scans to compare |
| Export | Download history as CSV |
| **Performance** | Virtual list, thumbnail-only loading |

### 12. ComparisonPage (`ComparisonPage.tsx`, 412 lines)
**Route:** `/comparison`

| Upgrade | Details |
|---------|---------|
| Slider | Side-by-side with ComparisonSlider (exists) |
| Metrics | Diff table highlighting improved/worsened |
| AI narrative | AI-generated comparison summary |
| Selection | Pick any 2 scans from history |

### 13. DigitalTwinTimelinePage (`DigitalTwinTimelinePage.tsx`, 472 lines)
**Route:** `/digital-twin`

| Upgrade | Details |
|---------|---------|
| 3D model | Interactive Three.js face with concern overlay |
| Timeline | Scrubber with snapshot thumbnails |
| Simulation | "What if I use X product?" simulation panel |
| Before/after | Toggle with BeforeAfterCircle (exists) |
| Environment | Show correlation with weather/humidity |
| **Performance** | WebGL context management, 2D fallback for low-power |

### 14. ProgressTrackingPage (`ProgressTrackingPage.tsx`, 337 lines)
**Route:** `/progress`

| Upgrade | Details |
|---------|---------|
| Charts | Recharts line charts for each metric over time |
| Date range | Week / month / 3-month / 6-month / year selector |
| Milestones | Visual milestone markers on chart |
| Photo timeline | Before/after photos at each data point |
| Export | Download chart as image |

### 15. ProfileSettingsPage (`ProfileSettingsPage.tsx`, 1460 lines)
**Route:** `/profile`

| Upgrade | Details |
|---------|---------|
| **Refactor** | 1460 lines → split into tab sub-components |
| Photo | Upload with crop + preview, store in R2 |
| Skin quiz | Inline guided skin type quiz |
| Appearance | Theme preference (light/dark/system) |
| Language | Language selector (i18n) |
| Connected | Google account linked indicator |
| Delete | Account deletion with confirmation + grace period |
| **Tabs** | Personal, Skin, Lifestyle, Preferences, Notifications, Privacy, Account |

---

## TIER 3: SECONDARY PAGES

### Educational Pages (Sprint 4)

| Page | Route | Key Upgrade |
|------|-------|-------------|
| IngredientDictionaryPage | `/ingredients` | Fuzzy search, A-Z index, safety badges, "Is this safe for me?" |
| SkinTypeGuidePage | `/skin-type-guide` | Interactive quiz that saves result to profile |
| BlogPage | `/blog` | Grid with featured hero, category filters, pagination, reading time |
| VideoTutorialsPage | `/tutorials` | Grid with thumbnails, difficulty badges, duration, category tabs |
| AboutPage | `/about` | Team section, company timeline, mission/values |
| ContactPage | `/contact` | Contact form with validation, FAQ accordion |
| SampleReportPage | `/analysis/demo` | Realistic interactive demo, CTA to sign up |

### Legal Pages (Sprint 4)

| Page | Route | Key Upgrade |
|------|-------|-------------|
| PrivacyPage | `/privacy` | Table of contents, collapsible sections, last-updated date |
| TermsPage | `/terms` | Same as Privacy treatment |
| ConsentPage | `/consent` | Granular consent: marketing, analytics, data sharing |

### Auth Flow Pages (Sprint 3)

| Page | Route | Key Upgrade |
|------|-------|-------------|
| PasswordResetPage | `/password-reset` | Consistent with AuthPage design, countdown timer |
| PasswordResetConfirmPage | `/password-reset/confirm` | Token validation, clear success/failure states |
| EmailVerificationPage | `/verify-email` | Auto-redirect on success, resend link |
| GoogleCallbackPage | `/auth/google/callback` | Error handling for OAuth failures, loading state |
| OnboardingPage | `/onboarding` | Step wizard: skin type → concerns → goals → first scan CTA |

### User Pages (Sprint 4)

| Page | Route | Key Upgrade |
|------|-------|-------------|
| SkinGoalsPage | `/skin-goals` | Card-based goals with progress rings, AI suggestions |
| FavoritesPage | `/favorites` | Grid layout, collection folders, share collection |
| NotificationCenterPage | `/notifications` | Group by date, read/unread visual, filter by type |
| DataExportPage | `/export` | Format options (JSON/CSV/PDF), background export |
| DeviceContextPage | `/device-context` | Hide in production, keep for dev |

### Admin Pages (Sprint 5)

| Page | Route | Key Upgrade |
|------|-------|-------------|
| AdminDashboardPage | `/admin` | KPI cards, user growth chart, scan volume, system health |
| AdminUsersPage | `/admin/users` | Data table: search, sort, filter, pagination, actions |
| AdminProductsPage | `/admin/products` | Data table, bulk import/export, ingredient management |
| AdminCatalogPage | `/admin/catalog` | Catalog management, barcode import, data quality |
| AdminBlogsPage | `/admin/blogs` | WYSIWYG editor (TipTap), draft/publish, SEO metadata |
| AdminVideosPage | `/admin/videos` | Video upload/embed, thumbnail management |
| AdminNewsPage | `/admin/news` | News CRUD, featured toggle, scheduling |
| AdminContentPage | `/admin/content` | Unified content dashboard |

### New Pages (Sprint 3-5)

| Page | Route | Sprint | Description |
|------|-------|--------|-------------|
| **AIChatPage** | `/chat` | 3 | Full conversational AI skincare advisor |
| **ClinicalDashboardPage** | `/clinical` | 5 | Skin health trends, alerts, derm reports, correlations |
| **SearchPage** | `/search` | 4 | Unified search results |

---

## Per-Page Checklist (Apply to Every Page)

- [ ] Responsive: works at 375px, 768px, 1024px, 1440px
- [ ] Dark mode: all elements visible and contrast-compliant
- [ ] Accessibility: landmarks, headings, labels, keyboard nav, screen reader
- [ ] Loading state: skeleton or spinner while data loads
- [ ] Error state: ErrorCard with retry button
- [ ] Empty state: EmptyState with illustration and CTA
- [ ] Animation: entrance animations, micro-interactions (reduced motion respected)
- [ ] Performance: lazy load heavy content, virtual scroll long lists
- [ ] i18n: all strings use translation keys
- [ ] Touch: 44px min targets, hover guards, active feedback
