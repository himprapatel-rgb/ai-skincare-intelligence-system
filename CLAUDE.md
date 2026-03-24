# CLAUDE.md — Pellicura AI Skincare Intelligence System

## Project Overview
Pellicura is a clinical-grade AI-powered skincare analysis platform. Monorepo with React 18 frontend + FastAPI backend + PostgreSQL (two-database architecture).

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, deployed on Cloudflare Pages
- **Backend**: FastAPI + Python 3.11, deployed on Railway
- **Databases**: PostgreSQL 15 (main DB for users/scans + separate product catalog DB)
- **AI**: OpenAI GPT-4V for skin analysis, GPT-4o-mini for text features, MediaPipe/TensorFlow.js on frontend

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
frontend/
  src/pages/           — 55 React page components (lazy-loaded)
  src/components/      — Reusable UI components
  src/context/         — React Context providers (Auth, Theme, Shelf, Toast, Notification)
  src/services/        — API clients (api.ts, scanApi.ts, aiService.ts)
  src/styles/          — Global CSS design system
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
```

## Environment Variables
Backend requires: `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`
Optional: `PRODUCT_DATABASE_URL`, `REDIS_URL`, `ANTHROPIC_API_KEY`
See `backend/.env.example` for full list.

## API Endpoints
All under `/api/v1/`. Key prefixes:
- `/auth` — Registration, login, OAuth, password reset
- `/scan` — Face scan upload and analysis
- `/ai` — AI Intelligence Engine (recommendations, routines, ingredients, predictions)
- `/products` — Product search, barcode lookup, reviews
- `/profile` — User profile CRUD
- `/shelf` — Product inventory management
- `/digital-twin` — Skin state snapshots and simulation

## Conventions
- Settings: `from app.config import settings`
- DB sessions: `get_db()` dependency injection
- Auth: `get_current_user` / `get_current_user_optional` dependencies
- CSS: Design tokens in `index.css`, page CSS co-located with components
- Commits: conventional commits (feat/fix/perf/docs prefix)
