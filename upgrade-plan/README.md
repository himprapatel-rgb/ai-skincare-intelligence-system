# Pellicura Full App Upgrade — Master Plan

## Vision
Transform Pellicura from a functional MVP into a **production-grade, scalable, delightful** skincare intelligence platform. Keep every existing feature, improve every page, add major new capabilities.

---

## Current State (Post-Cleanup)
- **Frontend**: 50+ pages, 80+ components, 6 context providers, React 18 + TypeScript + Vite
- **Backend**: 15 routers, 100+ endpoints, FastAPI + Python 3.11
- **Database**: PostgreSQL 15 (main DB + separate product catalog DB), 22 model files
- **AI**: OpenAI GPT-4V (vision), GPT-4o-mini (text), MediaPipe/TensorFlow.js (frontend)
- **Deployment**: Railway (backend) + Cloudflare Pages (frontend)

## Already Completed (5 commits)
1. CSS consolidation: 9 files deleted, 7→2 merged, `!important` 107→24 (-4,191 lines)
2. Responsive breakpoints: `PageContainer` + `ResponsiveGrid`, 10 pages with 3 breakpoints
3. Touch/hover polish: `@media (hover: hover)` guards, keyboard-aware BottomNav
4. Dead code cleanup: 4 dead auth page variants removed (-3,070 lines)
5. Design system trim: 743 lines of unused classes removed from design-system.css

---

## Sprint Timeline (2-week sprints)

| Sprint | Weeks | Teams Active | Focus |
|--------|-------|-------------|-------|
| **Sprint 1** | 1-2 | Architecture, Database, Frontend-Core | Foundation: Alembic migrations, design tokens, TanStack Query, component library scaffold |
| **Sprint 2** | 3-4 | Backend-API, Frontend-Core, AI | Auth/Scan/Products API upgrades, UI component library, AI Chat backend |
| **Sprint 3** | 5-6 | Frontend-Pages, AI, Backend-API | Core 15 page redesigns, AI Chat frontend, remaining API upgrades |
| **Sprint 4** | 7-8 | Frontend-Pages, New-Features, Backend-API | Remaining 35+ pages, real-time notifications (WebSocket), PWA |
| **Sprint 5** | 9-10 | New-Features, Frontend-Pages, Testing | Clinical insights, derm reports, admin analytics, multi-scan, E2E tests |
| **Sprint 6** | 11-12 | Testing, DevOps, Polish | Performance optimization, i18n, security hardening, CI/CD |

---

## Team Structure

| Team | Plan File | Scope |
|------|-----------|-------|
| **Architecture** | [00-architecture/PLAN.md](00-architecture/PLAN.md) | Monorepo tooling, API contract generation, state management migration |
| **Database** | [01-database/PLAN.md](01-database/PLAN.md) | Schema fixes, new tables, Alembic migrations, performance |
| **Backend API** | [02-backend-api/PLAN.md](02-backend-api/PLAN.md) | Per-router upgrades, new routers, infrastructure (caching, queues, WebSocket) |
| **Frontend Core** | [03-frontend-core/PLAN.md](03-frontend-core/PLAN.md) | Design system, component library, accessibility, i18n setup |
| **Frontend Pages** | [04-frontend-pages/PLAN.md](04-frontend-pages/PLAN.md) | Per-page visual redesign, features, responsive, dark mode |
| **AI Integration** | [05-ai-integration/PLAN.md](05-ai-integration/PLAN.md) | AI Chat Assistant, GPT upgrades, streaming, caching, cost tracking |
| **New Features** | [06-new-features/PLAN.md](06-new-features/PLAN.md) | Gamification, community/social, real-time notifications, search |
| **Testing & DevOps** | [07-testing-devops/PLAN.md](07-testing-devops/PLAN.md) | CI/CD, monitoring, error tracking, testing strategy |

---

## Dependency Graph

```
Sprint 1:  [Architecture] ──→ [Database] ──→ [Frontend-Core]
                │                  │               │
Sprint 2:      ↓                  ↓               ↓
          [Backend-API] ←── uses schema ──→ [Component Library]
                │                               │
Sprint 3:      ↓                               ↓
          [AI Chat Backend] ──────────→ [Page Redesigns + AI Chat UI]
                │                               │
Sprint 4:      ↓                               ↓
          [WebSocket + PWA] ──────────→ [Remaining Pages]
                │                               │
Sprint 5:      ↓                               ↓
          [New Feature APIs] ─────────→ [Gamification + Community UI]
                │                               │
Sprint 6:      ↓                               ↓
          [Testing + DevOps] ─────────→ [Polish + Performance]
```

---

## Key Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS approach | CSS Modules (per-component) | Prevents global namespace collisions, co-located with components |
| State management | TanStack Query for server state, Context for client state | Automatic caching, refetching, pagination — replaces manual fetch-and-cache |
| API client | Auto-generated from OpenAPI spec (orval) | Type-safe, always in sync with backend |
| Migrations | Alembic | Replace unsafe `ALTER TABLE` in startup, proper version control |
| Real-time | WebSocket (FastAPI) + Redis Pub/Sub | Notifications, scan progress, chat streaming |
| Background tasks | arq (async Redis queue) | Scan processing, email, achievement checks |
| Image storage | Cloudflare R2 | Move scan images out of BYTEA columns, CDN delivery |
| Search | PostgreSQL full-text + pg_trgm | Good enough for current scale, avoid extra infra |
| Error tracking | Sentry | Industry standard, supports both Python and React |
| Email | SendGrid/Postmark | Transactional email (welcome, verification, digests) |

---

## Success Metrics
- Every page works at 375px, 768px, 1024px, 1440px
- WCAG 2.1 AA accessibility on all pages
- Lighthouse scores: Performance > 90, Accessibility > 95, Best Practices > 95
- Backend: 80% test coverage, <200ms p95 API latency
- Frontend: <200KB initial JS bundle, <3s LCP on 3G
- Zero `!important` in global CSS, zero inline styles
- AI Chat Assistant fully functional with streaming responses
- PWA installable with offline support
