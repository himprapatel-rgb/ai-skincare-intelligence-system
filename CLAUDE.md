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
