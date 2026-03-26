# Pellicura — Complete Feature Catalog

**Total: 234 features** (106 existing, 87 new, 41 architecture/devops)

---

## 1. AUTHENTICATION & USER MANAGEMENT

### Existing Features
| # | Feature | Status | Backend | Frontend |
|---|---------|--------|---------|----------|
| 1 | Email/password registration | Live | `POST /auth/register` | AuthPage |
| 2 | Email verification (token-based) | Live | `POST /auth/verify-email` | EmailVerificationPage |
| 3 | Login with JWT (30-min tokens) | Live | `POST /auth/login` | AuthPage |
| 4 | Google OAuth 2.0 sign-in | Live | `POST /auth/google-oauth` | GoogleCallbackPage |
| 5 | Password reset (email link) | Live | `POST /auth/password-reset` | PasswordResetPage |
| 6 | Get current user | Live | `GET /auth/me` | AuthContext |
| 7 | Resend verification email | Live | `POST /auth/send-verification` | EmailVerificationPage |

### Planned Improvements
| # | Feature | Sprint | Backend | Frontend |
|---|---------|--------|---------|----------|
| 107 | Token refresh rotation | 2 | `POST /auth/refresh` | Auto-refresh in API client |
| 108 | Server-side logout (token blacklist) | 2 | `POST /auth/logout` | Logout button |
| 109 | Account lockout after 5 failed attempts | 2 | `failed_login_count` column | Error message |
| 110 | GDPR soft delete (30-day grace) | 2 | `DELETE /auth/account` | ProfileSettings |
| 111 | Device fingerprint + new device alerts | 4 | IP/device tracking | Email alert |

---

## 2. SKIN ANALYSIS (CORE)

### Existing Features
| # | Feature | Status | Backend | Frontend |
|---|---------|--------|---------|----------|
| 10 | Face scan with camera | Live | — | ScanPage + Camera.tsx |
| 11 | Image upload + compression | Live | `POST /scan/{id}/upload` | ScanPage |
| 12 | AI skin analysis (GPT-4V) | Live | OpenAIVisionClient | AnalysisResults |
| 13 | Overall skin score (0-100) | Live | `overall_score` in response | Score circle display |
| 14 | Zone-by-zone analysis | Live | `zone_analysis` array | FaceHeatmap.tsx |
| 15 | Concern severity (mild/moderate/severe) | Live | `concerns_detail` array | Severity bars |
| 16 | Skin type detection | Live | `skin_type` enum | Profile auto-fill |
| 17 | Fitzpatrick scale (1-6) | Live | `fitzpatrick_scale` int | SkinAnalysis model |
| 18 | Confidence scoring | Live | `confidence_score` (0-1) | Confidence bar |
| 19 | Face heatmap visualization | Live | Zone data | FaceHeatmap.tsx |
| 20 | Scan history (filter by days) | Live | `GET /scan/history` | HistoryPage |
| 21 | Scan comparison (before/after) | Live | `POST /ai/compare` | ComparisonPage |
| 22 | Scan deletion | Live | `DELETE /scan/{id}` | HistoryPage |

### 10 Analysis Signals
Acne, redness, pigmentation, dehydration, sensitivity, wrinkles, pores, dark circles, texture, oiliness

### Planned Improvements
| # | Feature | Sprint |
|---|---------|--------|
| 112 | Deduplicate two scan routers into one | 2 |
| 113 | Cursor-based pagination on history | 2 |
| 114 | WebSocket real-time scan progress | 4 |
| 115 | Pre-upload image quality validation | 3 |
| 116 | Background task queue for analysis | 3 |
| 117 | Move images from BYTEA to R2 | 2 |
| 118 | Per-user rate limit (5 scans/hour) | 2 |
| 119 | Multi-angle scan (front + left + right) | 5 |

---

## 3. PRODUCT MANAGEMENT

### Existing Features
| # | Feature | Status | Backend | Frontend |
|---|---------|--------|---------|----------|
| 23 | Product search (name, brand, category) | Live | `GET /products` | Recommendations |
| 24 | Barcode lookup (EAN-8 to EAN-14) | Live | `GET /products/{barcode}` | ProductScannerPage |
| 25 | Product detail view | Live | `GET /catalog/product/{id}` | ProductDetailsPage |
| 26 | Ingredient safety analysis | Live | `POST /products/analyze` | Safety report |
| 27 | Product reviews (read + submit) | Live | `GET/POST /products/{id}/reviews` | ProductDetailsPage |
| 28 | AI product recommendations | Live | `POST /ai/recommendations` | Recommendations |
| 29 | Product barcode scanning (camera) | Live | `POST /products/scan-barcode` | ProductScannerPage |
| 30 | AI product identification from image | Live | `POST /products/identify-from-image` | ProductScannerPage |

### Product Catalog (Separate Database)
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 31 | Full-text catalog search | Live | `GET /catalog/search` |
| 32 | Category/brand/ingredient browsing | Live | `GET /catalog/categories`, `/brands`, `/ingredients` |
| 33 | Products safe for skin type | Live | `GET /catalog/products/safe-for/{skin_type}` |
| 34 | Pregnancy-safe products | Live | `GET /catalog/products/pregnancy-safe` |
| 35 | Vegan products | Live | `GET /catalog/products/vegan` |
| 36 | Catalog CRUD (admin) | Live | `POST/PUT/DELETE /catalog/product` |

### Planned Improvements
| # | Feature | Sprint |
|---|---------|--------|
| 129 | Pagination envelope on all endpoints | 2 |
| 130 | Sort by price/rating/name/newest | 2 |
| 131 | Price range filter | 2 |
| 132 | Multi-select skin type/concern filters | 2 |
| 133 | PostgreSQL full-text search (replace ILIKE) | 3 |
| 134 | ETag caching for product details | 3 |

---

## 4. MY SHELF (Product Inventory)

### Existing Features
| # | Feature | Status | Backend | Frontend |
|---|---------|--------|---------|----------|
| 37 | Add/edit/remove products | Live | CRUD `/shelf` | MyShelfPage |
| 38 | Status tracking (active/finished/discontinued/wishlist) | Live | `status` column | Status badges |
| 39 | Routine assignment (AM/PM/both) | Live | `routine_type` column | Routine filter |
| 40 | Rating + notes per product | Live | `rating`, `notes` columns | Edit modal |
| 41 | Ingredient snapshot preservation | Live | `ingredients_json` JSONB | Detail view |
| 42 | Repurchase tracking | Live | `times_repurchased` column | Counter |

### Planned Improvements
| # | Feature | Sprint |
|---|---------|--------|
| 135 | Batch add multiple products | 3 |
| 136 | Expiring-soon products endpoint | 3 |
| 137 | Shelf statistics (by category/status) | 3 |
| 138 | Product reorder within routines | 3 |
| 139 | Period After Opening (PAO) tracking | 3 |

---

## 5. FAVORITES

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 43 | Add/remove favorites | Live | `POST/DELETE /favorites` |
| 44 | Check if favorited | Live | `GET /favorites/check/{id}` |
| 45 | Internal + external product support | Live | Both UUID and string IDs |

---

## 6. ROUTINES

### Existing Features
| # | Feature | Status | Frontend |
|---|---------|--------|----------|
| 46 | AM/PM routine builder | Live | RoutineBuilderPage |
| 47 | Drag-to-reorder steps | Live | Drag interaction |
| 48 | Category-based suggestions | Live | Template system |
| 49 | Reminder settings | Live | Day + time picker |
| 50 | Persistence (localStorage + backend) | Live | SavedRoutine model |

---

## 7. SKIN GOALS

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 51 | Create/edit/delete goals | Live | CRUD `/goals` |
| 52 | Goal types (anti-aging, hydration, etc.) | Live | `GET /goals/types` |
| 53 | Progress tracking + milestones | Live | `POST /goals/{id}/progress` |
| 54 | Target dates + completion | Live | `target_date`, `is_completed` |

---

## 8. DIGITAL TWIN

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 55 | Skin state snapshots from scans | Live | `POST /digital-twin/snapshot` |
| 56 | Region-level analysis | Live | SkinRegionState model |
| 57 | Timeline view | Live | `GET /digital-twin/timeline` |
| 58 | Scenario simulation | Live | `POST /digital-twin/simulate` |
| 59 | Before/after comparison | Live | BeforeAfterCircle component |

---

## 9. AI INTELLIGENCE ENGINE

### Existing Features
| # | Feature | Status | Backend | Model |
|---|---------|--------|---------|-------|
| 60 | AI product recommendations | Live | `POST /ai/recommendations` | GPT-4o-mini |
| 61 | AI routine generation | Live | `POST /ai/routine` | GPT-4o-mini |
| 62 | AI ingredient analysis | Live | `POST /ai/ingredients` | GPT-4o-mini |
| 63 | AI smart notifications | Live | `GET /ai/notifications/smart` | GPT-4o-mini |
| 64 | AI content curation | Live | `GET /ai/content/curated` | GPT-4o-mini |
| 65 | AI skin prediction | Live | `POST /ai/predict` | GPT-4o-mini |
| 66 | AI scan comparison | Live | `POST /ai/compare` | GPT-4o-mini |
| 67 | AI seasonal trends | Live | `POST /ai/trends` | GPT-4o-mini |

### Planned Improvements
| # | Feature | Sprint |
|---|---------|--------|
| 120 | Redis caching (1-hour, invalidate on scan) | 2 |
| 121 | Token usage tracking (cost monitoring) | 2 |
| 122 | Fallback: cached response if OpenAI down | 3 |
| 123 | SSE streaming for long responses | 2 |
| 124 | Explanation per recommendation | 3 |
| 125 | Use shelf products in routine generation | 3 |
| 126 | Personalized ingredient warnings (user allergens) | 3 |
| 127 | Ingredient interaction warnings | 3 |
| 128 | Pregnancy-safety flags | 3 |

---

## 10. NOTIFICATIONS

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 68 | Notification center | Live | `GET /notifications` |
| 69 | Mark read / mark all read | Live | `PATCH /notifications/{id}/read` |
| 70 | Notification settings | Live | `GET/PATCH /notifications/settings` |
| 71 | Quiet hours | Live | `quiet_hours_enabled/start/end` |
| 72 | Routine reminders | Live | `GET /notifications/check-reminders` |

---

## 11. CONTENT

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 73 | Blog articles | Live | `GET /content/blogs` |
| 74 | Video tutorials | Live | `GET /content/videos` |
| 75 | News/updates | Live | `GET /content/news` |

---

## 12. ADMIN

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 76 | Dashboard summary | Live | `GET /admin/summary` |
| 77 | User management | Live | `GET/PATCH /admin/users` |
| 78 | Product management | Live | CRUD `/admin/products` |
| 79 | Blog/video/news CRUD | Live | CRUD endpoints |
| 80 | Image uploads | Live | `POST /admin/upload-image` |
| 81 | Database seeding | Live | `POST /admin/seed-database` |
| 82 | Ingredient population | Live | `POST /admin/populate-ingredients` |
| 83 | SCIN data import | Live | `POST /admin/import-scin` |

---

## 13. GDPR & CONSENT

### Existing Features
| # | Feature | Status | Backend |
|---|---------|--------|---------|
| 8 | GDPR consent management | Live | `POST /consent/accept` |
| 9 | Data export | Live | `GET /profile/export` |
| — | Policy versioning | Live | PolicyVersion model |
| — | Consent withdrawal | Live | `DELETE /consent/withdraw` |

---

## 14. USER PROFILE

### Existing Features
| # | Feature | Status | Fields |
|---|---------|--------|--------|
| 5 | Profile CRUD | Live | Personal, skin, lifestyle, preferences |
| 6 | Profile photo upload | Live | `POST /profile/upload-photo` |
| — | Skin profile | Live | skin_type, skin_tone, texture, pore_size, moisture, oil, sensitivity |
| — | Lifestyle tracking | Live | sun_exposure, water_intake, sleep, diet, stress, exercise, smoking, alcohol |
| — | Preferences | Live | preferred_ingredients, ingredients_to_avoid, texture, fragrance, budget, brands |
| — | Notification settings | Live | email, push, SMS, marketing toggles |
| — | Privacy controls | Live | profile_visibility, share_progress, allow_data_analysis |

---

## 15. FRONTEND INFRASTRUCTURE

### Existing Features
| # | Feature | Status | Component/File |
|---|---------|--------|----------------|
| 84 | Dark mode (light/dark/system) | Live | ThemeContext + dark-mode.css |
| 85 | Responsive (mobile/tablet/desktop) | Live | PageContainer + ResponsiveGrid |
| 86 | PWA manifest + install prompt | Live | manifest.json + AddToHomeScreenPrompt |
| 87 | Offline detection + banner | Live | OfflineBanner + NetworkStatus |
| 88 | Toast notifications | Live | ToastContext + Toast.tsx |
| 89 | Loading skeletons (10+ variants) | Live | Skeleton.tsx |
| 90 | Error boundaries | Live | ErrorBoundary.tsx |
| 91 | Route lazy loading | Live | React.lazy() in App.tsx |
| 92 | Pull-to-refresh | Live | usePullToRefresh hook |
| 93 | Bottom navigation (mobile) | Live | BottomNav.tsx (3 tabs) |
| 94 | Haptic feedback | Live | haptic.ts utility |

---

## 16. BACKEND INFRASTRUCTURE

### Existing Features
| # | Feature | Status |
|---|---------|--------|
| 95 | JWT auth with optional (guest scans) | Live |
| 96 | AES-256 encryption for PII | Live |
| 97 | Rate limiting (per-IP, 10/60s) | Live |
| 98 | CORS + security headers | Live |
| 99 | Request timeout (30s) | Live |
| 100 | Request size limit (5MB) | Live |
| 101 | GZip compression | Live |
| 102 | Request tracing (correlation IDs) | Live |
| 103 | IP geolocation logging | Live |
| 104 | Slow query logging (>500ms) | Live |
| 105 | Health checks (main + product DB + readiness + liveness) | Live |
| 106 | Two-database architecture | Live |

---

## 17. NEW FEATURES (Planned)

### AI Chat Assistant (TOP PRIORITY — Sprint 2-3)
| # | Feature | Backend | Frontend |
|---|---------|---------|----------|
| 149 | Conversational AI skincare advisor | `POST /ai/chat/sessions/{id}/messages` | AIChatPage |
| 150 | Context-aware (scans, profile, shelf, goals) | ai_chat_service.py | — |
| 151 | SSE streaming responses | StreamingResponse | StreamingMessage.tsx |
| 152 | Chat session management | CRUD `/ai/chat/sessions` | ChatSessionList.tsx |
| 153 | Chat history persistence | ai_chat_sessions + messages tables | ChatMessage.tsx |
| 154 | Suggested follow-up questions | GPT-4o-mini generates | ChatSuggestions.tsx |
| 155 | Markdown rendering | — | react-markdown |
| 156 | "Ask about this scan" deep link | Context injection | AnalysisResults link |
| 157 | "Ask about this product" deep link | Context injection | ProductDetails link |
| 158 | Floating chat widget | — | ChatWidget.tsx |
| 159 | Rate limit: 50 msg/hr, 100K tokens/day | Redis tracking | Error message |

### Clinical Intelligence (Sprint 5)
| # | Feature | Backend | Frontend |
|---|---------|---------|----------|
| 160 | Dermatologist report PDF | `GET /clinical/report/{scan_id}` | Export button |
| 161 | Shareable secure report link | `POST /clinical/share-report` | Share dialog |
| 162 | Skin health trend analysis | `GET /clinical/trends` | ClinicalDashboard |
| 163 | AI skin alerts (worsening trends) | `GET /clinical/alerts` | Alert cards |
| 164 | Dermatologist referral flags | Severity-based auto-flag | Warning banner |
| 165 | Environmental correlations | `GET /clinical/correlations` | Correlation chart |
| 166 | Product effectiveness tracking | Score changes post-product | Timeline chart |
| 167 | Drug interaction warnings | `POST /clinical/ingredient-check` | Warning list |
| 168 | Pregnancy safety checks | Automatic with profile flag | Badge/warning |
| 169 | Allergen cross-reactivity | Profile allergies vs ingredients | Warning list |
| 170 | Comedogenic risk scoring | Per-product score | Risk badge |
| 171 | Regulatory display (EU vs FDA) | ingredient_safety data | Compliance badge |
| 172 | Longitudinal AI analysis | `POST /clinical/longitudinal-analysis` | Narrative display |
| 173 | Comparative benchmarking (opt-in) | `GET /clinical/benchmark` | Percentile display |

### Real-time Notifications (Sprint 4)
| # | Feature | Backend | Frontend |
|---|---------|---------|----------|
| 174 | WebSocket live connection | `WS /notifications/live` | useWebSocket hook |
| 175 | Scan complete (instant) | WebSocket event | Toast notification |
| 176 | Routine reminder push | Scheduled event | Push notification |
| 177 | Product expiry alert | Daily background check | Badge + toast |
| 178 | Skin alert notification | AI monitoring trigger | Alert card |
| 179 | UV index alert | Geo-based weather check | Weather tip |
| 180 | Ingredient recall alert | Admin-triggered | Warning banner |
| 181 | Goal milestone notification | Progress threshold | Celebration toast |
| 182 | Web Push API (background) | Push subscription | Service worker |
| 183 | Reconnect with backoff | — | Exponential backoff |

### Unified Search (Sprint 4)
| # | Feature | Backend | Frontend |
|---|---------|---------|----------|
| 184 | Cross-entity search | `GET /search` | SearchPage |
| 185 | Typeahead suggestions | `GET /search/suggestions` | Search overlay |
| 186 | Search analytics | search_queries table | Admin dashboard |
| 187 | Global search in header | — | Header search icon |

### PWA Upgrades (Sprint 4)
| # | Feature |
|---|---------|
| 188 | Workbox service worker (replace no-op) |
| 189 | Precache app shell |
| 190 | Runtime cache for API (StaleWhileRevalidate) |
| 191 | Image caching (7-day CacheFirst) |
| 192 | Offline fallback with cached data |
| 193 | Background sync (queue offline actions) |
| 194 | Push notifications via service worker |
| 195 | Manifest shortcuts (Scan, Shelf, Chat) |

### New AI Endpoints (Sprint 3-4)
| # | Feature | Backend |
|---|---------|---------|
| 202 | AI Daily Brief | `GET /ai/daily-brief` |
| 203 | AI Ingredient Conflicts | `POST /ai/ingredient-conflicts` |
| 204 | AI Product Review Summary | `POST /ai/product-review-summary` |

### Admin Analytics (Sprint 5)
| # | Feature | Backend |
|---|---------|---------|
| 196 | DAU/MAU dashboard | `GET /admin/analytics/overview` |
| 197 | Scan success rate | `GET /admin/analytics/scans` |
| 198 | AI token/cost tracking | `GET /admin/analytics/ai-usage` |
| 199 | User growth/retention | `GET /admin/analytics/users` |
| 200 | Top products | `GET /admin/analytics/products` |
| 201 | Clinical alert stats | `GET /admin/analytics/clinical` |

### Multi-Scan Analysis (Sprint 5)
| # | Feature |
|---|---------|
| — | Multi-angle capture (front + left + right) |
| — | Longitudinal analysis across scan history |
| — | Comparative benchmarking (anonymized, opt-in) |

---

## 18. ARCHITECTURE & DEVOPS (Planned)

| # | Feature | Sprint |
|---|---------|--------|
| 205 | Alembic database migrations | 1 |
| 206 | OpenAPI → TypeScript codegen (orval) | 1 |
| 207 | TanStack Query for server state | 1 |
| 208 | Design token JSON → CSS pipeline | 1 |
| 209 | Cloudflare R2 image storage | 1 |
| 210 | Background task queue (arq) | 2 |
| 211 | WebSocket manager + Redis Pub/Sub | 4 |
| 212 | Standardized error format | 2 |
| 213 | 24-component UI library + Storybook | 1-2 |
| 214 | Backend 80% test coverage | 1-6 |
| 215 | Frontend 60% component coverage | 3-6 |
| 216 | Playwright E2E all core flows | 4-6 |
| 217 | axe accessibility audits in CI | 4 |
| 218 | Visual regression screenshots | 5 |
| 219 | Dark mode E2E tests | 5 |
| 220 | PR pipeline (lint + test + build) | 1 |
| 221 | Staging auto-deploy | 2 |
| 222 | Production deploy + smoke tests | 3 |
| 223 | Dependabot vulnerability scanning | 1 |
| 224 | Branch protection rules | 1 |
| 225 | Sentry error tracking | 2 |
| 226 | Structured JSON logging | 2 |
| 227 | Prometheus metrics | 4 |
| 228 | Uptime monitoring | 3 |
| 229 | Alert on error/latency spikes | 4 |
| 230 | CSRF protection | 6 |
| 231 | Per-endpoint rate limiting | 6 |
| 232 | Dependency audit in CI | 1 |
| 233 | Secrets scanning | 2 |
| 234 | Input validation (max-length) | 2 |
