# CLAUDE.md — Pellicura AI Skincare Intelligence System

## Project Overview
Pellicura is a clinical-grade AI-powered skincare analysis platform targeting 1M+ users.
Monorepo: React 18 frontend (PWA) + FastAPI backend + PostgreSQL (two-database architecture).
Mobile-first design with Capacitor planned for iOS/Android App Store deployment.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, deployed on Cloudflare Pages
- **Backend**: FastAPI + Python 3.11, deployed on Railway (16 workers)
- **Databases**: PostgreSQL 15 (main DB for users/scans + separate product catalog DB via PRODUCT_DATABASE_URL)
- **AI**: OpenAI GPT-4V for skin analysis, GPT-4o-mini for text features, MediaPipe/TensorFlow.js on frontend
- **Auth**: JWT access tokens + httpOnly cookie refresh tokens + Google OAuth
- **CDN**: Cloudflare Pages (frontend), Railway (API)

## Key Directories
```
backend/
  app/main.py          — FastAPI app, middleware stack, router registration
  app/config.py        — Pydantic settings (all env vars)
  app/routers/         — 15 API routers (auth, scan, profile, shelf, ai, etc.)
  app/services/        — Business logic (openai_vision, ai_intelligence, ingredient_safety, etc.)
  app/models/          — SQLAlchemy models (22 files)
  app/schemas/         — Pydantic request/response schemas
  app/core/            — Security, rate limiting, caching, audit
  app/api/v1/endpoints/— Additional endpoints (auth, scan with upload validation)
frontend/
  src/pages/           — 55 React page components (lazy-loaded)
  src/components/      — Reusable UI components + mobile/ subfolder
  src/context/         — React Context providers (Auth, Theme, Shelf, Toast, Notification)
  src/services/        — API clients (api.ts, scanApi.ts, aiService.ts)
  src/styles/          — Global CSS design system
  src/hooks/           — Custom hooks (useIsMobile, usePageTitle, etc.)
  src/stores/          — Zustand state stores
  public/              — PWA manifest, service worker, icons
```

## Development Commands
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev

# Tests
cd backend && python -m pytest tests/ -x -q
cd frontend && npm test
cd frontend && npx playwright test

# Build
cd frontend && npm run build

# Type check
cd frontend && npx tsc --noEmit
```

## Environment Variables
Backend requires: `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`
Optional: `PRODUCT_DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`
See `backend/.env.example` for full list.

**CRITICAL**: SECRET_KEY will crash on startup if set to default in production/staging.

## API Endpoints
All under `/api/v1/`. Key prefixes:
- `/auth` — Registration, login, OAuth, password reset, refresh tokens
- `/scan` — Face scan upload and analysis (magic-byte validation on uploads)
- `/ai` — AI Intelligence Engine (recommendations, routines, ingredients, predictions)
- `/products` — Product search, barcode lookup, reviews (price column is `price_usd`)
- `/profile` — User profile CRUD
- `/shelf` — Product inventory management
- `/digital-twin` — Skin state snapshots and simulation
- `/reports` — Weekly summary aggregation
- `/routines` — Routine check-in, adherence, streak tracking

## Conventions
- Settings: `from app.config import settings`
- DB sessions: `get_db()` dependency injection
- Auth: `get_current_user` / `get_current_user_optional` dependencies
- CSS: Design tokens in `index.css`, page CSS co-located with components
- Commits: conventional commits (feat/fix/perf/docs prefix)
- All `dangerouslySetInnerHTML` must use DOMPurify: `DOMPurify.sanitize(content)`

## Important Gotchas
- **Two databases**: Main DB (users/scans) and Product catalog DB (PRODUCT_DATABASE_URL). Never mix connections.
- **Product model**: Price column is `price_usd`, NOT `price`. Using `Product.price` will crash.
- **Blog model**: The model is `Blog` in `app.models.content`, NOT `BlogPost` in `content_models`.
- **SkinGoal model**: Use `SkinGoal.is_active` (Boolean), NOT `SkinGoal.status` (doesn't exist).
- **File uploads**: Validated via magic bytes (not just Content-Type). Filenames are UUID-based.
- **Refresh tokens**: Stored as httpOnly cookies, NOT in response body only. Set via `_set_refresh_cookie()`.
- **CORS**: Methods restricted to GET/POST/PUT/PATCH/DELETE/OPTIONS. Headers restricted to Auth/Content-Type/Accept.
- **Frontend XSS**: All HTML rendering uses DOMPurify. Never use raw `dangerouslySetInnerHTML`.
- **SECRET_KEY**: Fails fast in production/staging if using default value.

## Design System
- Border radius: `var(--radius-sm/md/lg/xl/full)` — never hardcode px values
- Shadows: `var(--shadow-sm/md/lg/xl/primary/card/card-hover)` — never hardcode rgba()
- Colors: Use semantic tokens `var(--text-primary/secondary/muted)`, `var(--bg-primary/secondary/tertiary)`
- Z-index: `var(--z-dropdown/sticky/overlay/modal/toast/nav/banner)`
- Max content width: 1120px
- Card padding: 24px
- Section padding: 56px vertical
- Standard gaps: 12px, 20px, 24px

## Testing Strategy
- Backend: pytest with 50% coverage threshold (target: 70%+)
- Frontend: Vitest + React Testing Library (8 test files, expanding)
- E2E: Playwright (10 test suites)
- Always run tests before committing: `cd backend && python -m pytest tests/ -x`
- TypeScript must compile clean: `npx tsc --noEmit`
- Build must succeed: `npm run build`

## Performance Notes
- TensorFlow.js chunk is 1.9MB — lazy-load only on scan page
- React.memo on Camera and LazyImage components (prevent re-renders)
- Service worker: cache-first for static assets, stale-while-revalidate for API
- Database pool: 10 connections main, 5 connections product catalog
- API caching: catalog endpoints cached 300s, user endpoints 120s

## Mobile / iOS / Android
- PWA fully configured (manifest, service worker, icons, splash screens)
- Mobile component library in `src/components/mobile/`
- Camera access with face detection (MediaPipe + BlazeFace fallback)
- Haptic feedback for iOS + Android
- Safe area support (iPhone notch)
- Bottom navigation bar for mobile
- Capacitor planned for App Store deployment
- Apple Sign-In needed for iOS App Store submission

## Project Map — All Files

### Backend Routers (18 routers)
- `routers/admin.py` → `/admin` — Admin operations, user/content management
- `routers/ai.py` → `/api/v1/ai` — AI recommendations, routine generation, ingredient analysis
- `routers/ai_chat.py` → `/ai/chat` — AI chat with SSE streaming, session management
- `routers/analysis.py` → `/analysis` — Skin analysis image processing
- `routers/catalog.py` → `/catalog` — Product catalog lookups (separate DB)
- `routers/clinical.py` → `/clinical` — Clinical reports, skin alerts, benchmarking
- `routers/consent.py` → `/consent` — GDPR consent tracking
- `routers/content.py` → `/content` — Public blogs, videos, news
- `routers/digital_twin.py` → `/digital-twin` — Skin state snapshots, simulation
- `routers/favorites.py` → `/favorites` — User favorite products
- `routers/goals.py` → `/goals` — Skin goals CRUD and tracking
- `routers/notifications.py` → `/notifications` — Notifications + WebSocket
- `routers/products.py` → `/api/v1/products` — Product search, reviews (price_usd column)
- `routers/profile.py` → `/profile` — User profile, skin type, preferences
- `routers/reports.py` → `/reports` — Weekly summary reports
- `routers/scan.py` → `/api/v1/scan` — Face scan upload + analysis
- `routers/search.py` → `/search` — Cross-entity search
- `routers/shelf.py` → `/shelf` — Product inventory management

### Backend Models (22 model files)
- `models/user.py` — User, UserAccessLog, UserConsent, PolicyVersion, UserProfile
- `models/scan.py` — ScanSession (id, user_id, status, image_data), SkinAnalysis, ConfidenceMetrics
- `models/analysis_outputs.py` — ScanOutput, SkinCondition, ScanCondition, ScanRecommendation, ProductRecommendation
- `models/product_models.py` — Ingredient, Product (price_usd!), ProductIngredient, ProductReview
- `models/digital_twin.py` — SkinStateSnapshot, SkinRegionState, EnvironmentSnapshot, RoutineInstance
- `models/clinical.py` — SkinAlert, DermReport, IngredientInteraction
- `models/ai_chat.py` — AIChatSession, AIChatMessage, AIUsageLog
- `models/shelf.py` — ShelfProduct
- `models/goals.py` — SkinGoal (is_active, NOT status!)
- `models/favorites.py` — UserFavorite
- `models/notifications.py` — Notification, NotificationSettings
- `models/content.py` — Blog (NOT BlogPost!), Video, NewsItem
- `models/engagement.py` — ProductScanSession, RoutineRecommendation, RoutineCheckin
- `models/saved_routine.py` — SavedRoutine
- `models/routine_product.py` — RoutineProduct

### Backend Services (21 services)
- `services/ai_chat_service.py` — GPT-4o-mini streaming chat with user context
- `services/ai_intelligence_service.py` — Central AI engine for recommendations/routines
- `services/auth_service.py` — Argon2id password hashing, user auth
- `services/openai_vision_service.py` — GPT-4V skin image analysis
- `services/digital_twin_service.py` — Skin state snapshots and simulation
- `services/clinical_insights_service.py` — Dermatologist-ready reports
- `services/notification_service.py` — Notification creation + WebSocket
- `services/email_service.py` — Verification and password reset emails
- `services/google_auth_service.py` — Google OAuth integration
- `services/product_catalog.py` — Product catalog lookups (separate DB)
- `services/ingredient_safety.py` — Safety scoring, interaction detection

### Frontend Pages (55 pages)
- `pages/HomePage.tsx` — Marketing homepage
- `pages/AuthPage.tsx` — Login/register
- `pages/ScanPage.tsx` — Face scan with camera/upload
- `pages/AnalysisResults.tsx` — Scan results + product recommendations
- `pages/DashboardPage.tsx` — User dashboard, scores, widgets
- `pages/TodayPage.tsx` — Daily routine checklist
- `pages/HistoryPage.tsx` — Past scan timeline
- `pages/ProgressTrackingPage.tsx` — Progress charts over time
- `pages/ProfileSettingsPage.tsx` — User profile + settings
- `pages/MyShelfPage.tsx` — Product inventory
- `pages/RoutineBuilderPage.tsx` — Custom routine creation
- `pages/ProductScannerPage.tsx` — Barcode/QR scanner
- `pages/ProductDetailsPage.tsx` — Product info, reviews
- `pages/ComparisonPage.tsx` — Before/after comparison
- `pages/AIChatPage.tsx` — AI chat assistant
- `pages/SkinTypeQuizPage.tsx` — Skin type quiz
- `pages/IngredientDictionaryPage.tsx` — Ingredient lookup
- `pages/Recommendations.tsx` — AI product recommendations
- `pages/ClinicalDashboardPage.tsx` — Clinical reports
- `pages/DigitalTwinTimelinePage.tsx` — Digital twin timeline
- `pages/BlogPage.tsx` — Blog articles
- `pages/SearchPage.tsx` — Global search
- `pages/Admin*.tsx` — 8 admin pages (dashboard, users, products, catalog, content, blogs, news, videos, analytics)

### Frontend Context Providers (6)
- `context/AuthContext.tsx` — Auth state, login/register/logout, token management
- `context/ShelfContext.tsx` — Product shelf state and product count
- `context/ScanContext.tsx` — Current scan session and results
- `context/ThemeContext.tsx` — Dark/light theme preference
- `context/ToastContext.tsx` — Toast notification display
- `context/NotificationContext.tsx` — Notifications + WebSocket

### Frontend Hooks (14)
- `usePageTitle` — Document title + meta tags
- `useIsMobile` — Mobile viewport detection (<768px)
- `useIsMobileOrTablet` — Tablet detection (<1024px)
- `useViewport` — Viewport dimensions + breakpoints
- `useDebounce` — Input debouncing for search
- `useKeyboardVisible` — Mobile keyboard detection
- `usePullToRefresh` — Pull-to-refresh gesture
- `useWebSocket` — WebSocket with auto-reconnect
- `useOptimizedApi` — API calls with loading/error states

## AI Features (20 features — all production-ready)

### Scan & Analysis (GPT-4V Vision)
- `services/openai_vision_service.py` — Skin scan analysis with 10 signals + skin age + hydration + barrier health
- Every scan saves: scores, concerns, zone analysis, skin age, recommendations to DB

### AI Intelligence Engine (GPT-4o-mini)
- `services/ai_intelligence_service.py` — 16 AI functions:
  1. `ai_recommend_products()` — Weighted scoring (40% ingredients, 25% skin type, 20% concerns, 15% quality)
  2. `ai_generate_routine()` — AM/PM routines with reasoning
  3. `ai_analyze_ingredients()` — Safety + efficacy analysis
  4. `ai_generate_notifications()` — Smart alerts from scan trends
  5. `ai_curate_content()` — Personalized blog/video ranking
  6. `ai_predict_skin_future()` — 4-week skin predictions
  7. `ai_compare_scans()` — Before/after AI narration
  8. `ai_rerank_search()` — Search result optimization
  9. `ai_detect_seasonal_trends()` — Pattern detection across scans
  10. `ai_skin_age_report()` — Skin age vs real age analysis
  11. `ai_exposome_prediction()` — UV/humidity/pollution skin impact
  12. `ai_community_benchmark()` — Percentile ranking vs similar users
  13. `ai_shelf_conflicts()` — Cross-product ingredient conflicts/synergies
  14. `ai_proactive_insights()` — AI Coach with full journey context
  15. `ai_product_match_score()` — Personalized product compatibility %
  16. `build_profile_context()` — Profile → prompt context builder

### Smart Recommendation Engine
- `services/smart_recommendation_engine.py` — Multi-signal scoring:
  - 35% AI analysis, 25% effectiveness data, 20% community reviews, 10% shelf compatibility, 10% scan correlation
  - `auto_track_effectiveness()` — Auto-called after every scan, links shelf products to score changes
  - Builds proprietary dataset (ProductEffectiveness table) that gets smarter with every user

### Blog Agent
- `services/blog_agent.py` — Auto-generates daily blog articles:
  - Data-driven articles from scan trends ("Why Dehydration Is Trending")
  - Marketing articles from 30-topic rotation (SEO-optimized)
  - Cover images from curated Unsplash URLs
  - `auto_generate_daily_article()` — One article per day, alternating data/marketing

### Digital Twin & Simulation
- `services/simulation_service.py` — Enhanced with:
  - 30+ ingredient effects database
  - Ingredient synergy detection (vitamin C+E, niacinamide+zinc, etc.)
  - Ingredient conflict detection (retinol+AHA, vitamin C+BP, etc.)
  - Environmental impact factors (UV, humidity, temperature, pollution)
  - `simulate_advanced()` — Combines all factors for realistic predictions

### AI Chat
- `services/ai_chat_service.py` — Context-aware GPT-4o-mini streaming chat
  - Gathers: profile, detailed scan scores, shelf products, goals, routine adherence, skin trends
  - SSE streaming with cost tracking

### Clinical Insights
- `services/clinical_insights_service.py` — Derm reports, skin alerts, benchmarking, trend analysis

### Security
- DOMPurify on all dangerouslySetInnerHTML
- Magic-byte file upload validation + UUID filenames
- httpOnly cookies for refresh tokens
- SECRET_KEY fails fast in production/staging

### API Endpoints (AI)
- `GET /api/v1/ai/skin-age` — Skin age analysis
- `GET /api/v1/ai/exposome` — Environmental predictions
- `GET /api/v1/ai/benchmark` — Community comparison
- `GET /api/v1/ai/shelf-analysis` — Shelf conflicts/synergies
- `GET /api/v1/ai/coach` — Proactive AI coaching
- `GET /api/v1/ai/product-match/{id}` — Product compatibility score
- `GET /api/v1/ai/smart-recommendations` — Multi-signal recommendations
- `POST /admin/generate-articles` — AI blog generation
