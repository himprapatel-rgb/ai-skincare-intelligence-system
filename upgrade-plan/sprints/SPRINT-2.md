# Sprint 2 — Backend API Upgrades & AI Chat Backend

**Weeks:** 3-4
**Dependencies:** Sprint 1 (Alembic, schema fixes, TanStack Query)
**Goal:** Upgrade core API endpoints + build AI Chat backend + remaining UI components.

---

## Track A: Auth API Upgrades

### A1. Token Refresh Endpoint
- `POST /auth/refresh` — accept refresh token, issue new access + refresh pair
- Add `refresh_token` column to users table (via migration)
- Rotate refresh token on each use
- **Files**: `backend/app/api/v1/endpoints/auth.py`, new migration

### A2. Server-side Logout
- `POST /auth/logout` — add token to Redis blacklist
- Check blacklist in `get_current_user` dependency
- TTL = remaining token lifetime
- **Files**: `backend/app/api/v1/endpoints/auth.py`, `backend/app/core/security.py`

### A3. Account Lockout
- After 5 failed login attempts → lock for 15 minutes
- Use `failed_login_count` and `locked_until` columns (added in Sprint 1)
- Reset on successful login
- **File**: `backend/app/api/v1/endpoints/auth.py`

### A4. GDPR Account Deletion
- `DELETE /auth/account` — soft delete (set `deleted_at`, deactivate)
- 30-day grace period before hard delete (background task)
- Send confirmation email
- **File**: `backend/app/api/v1/endpoints/auth.py`

### A5. Standardize Error Responses
- Create `backend/app/core/exceptions.py`:
  - `NotFoundError`, `ValidationError`, `AuthError`, `RateLimitError`, `AIServiceError`
- Each returns: `{"detail": str, "code": str, "status": int}`
- Register global exception handlers in main.py
- **Files**: `backend/app/core/exceptions.py`, `backend/app/main.py`

---

## Track B: Scan API Upgrades

### B1. Deduplicate Scan Routers
- Merge `app/api/v1/endpoints/scan.py` (578 lines) + `app/routers/scan.py` (664 lines) into ONE
- Keep the more complete version, merge unique functionality from the other
- Remove duplicate registration in `main.py`
- **Files**: `backend/app/routers/scan.py`, delete `backend/app/api/v1/endpoints/scan.py`, update `backend/app/api/v1/__init__.py`

### B2. Cursor-based Pagination on History
- Replace offset pagination with cursor-based (using `created_at` + `id`)
- Response: `{"data": [...], "next_cursor": "...", "has_more": true}`
- **File**: `backend/app/routers/scan.py`

### B3. Image Serve from R2
- `GET /scan/{id}/image` — return signed R2 URL or proxy image
- Requires `storage_service.py` (from Sprint 1 if R2 is set up, else local fallback)
- **File**: `backend/app/routers/scan.py`

### B4. Per-user Scan Rate Limit
- 5 scans per hour per authenticated user
- Use Redis counter with 1-hour TTL
- **File**: `backend/app/routers/scan.py`

---

## Track C: Product API Upgrades

### C1. Pagination Envelope
- All list endpoints return: `{"data": [...], "total": int, "page": int, "per_page": int, "has_more": bool}`
- Apply to: `GET /products`, `GET /products/{id}/reviews`
- **File**: `backend/app/routers/products.py`

### C2. Sorting & Filtering
- Add query params: `sort_by` (price/rating/name/newest), `min_price`, `max_price`, `skin_types`, `concerns`
- **File**: `backend/app/routers/products.py`

### C3. Shelf Pagination
- Add pagination + filtering to `GET /shelf`
- Filter by: status, category, routine_type
- Sort by: recent, name, brand, rating
- **File**: `backend/app/routers/shelf.py`

### C4. Catalog Pagination
- Add pagination to all catalog list endpoints
- **File**: `backend/app/routers/catalog.py`

---

## Track D: AI Chat Backend (TOP PRIORITY)

### D1. Create Chat Database Tables
- Migration for `ai_chat_sessions` + `ai_chat_messages`
- **File**: `backend/alembic/versions/004_ai_chat_tables.py`

### D2. Create Chat Models
- SQLAlchemy models for both tables
- **File**: `backend/app/models/ai_chat.py`

### D3. Create Chat Schemas
- Pydantic schemas: `ChatSessionCreate`, `ChatSessionResponse`, `ChatMessageCreate`, `ChatMessageResponse`
- **File**: `backend/app/schemas/ai_chat_schemas.py`

### D4. Create AI Chat Service
- `AIChatService` class:
  - `create_session(user_id, title)` → new session
  - `get_context(user_id, db)` → gather profile, last 5 scans, shelf, goals
  - `build_system_prompt(context)` → clinical-grade system prompt
  - `send_message(session_id, user_message, db)` → async generator yielding chunks
- Max 20 messages of history per request
- Summarize older messages before injecting
- **File**: `backend/app/services/ai_chat_service.py`

### D5. Create AI Chat Router
- `POST /ai/chat/sessions` — create session
- `GET /ai/chat/sessions` — list sessions (paginated)
- `GET /ai/chat/sessions/{id}/messages` — get messages
- `POST /ai/chat/sessions/{id}/messages` — send message (SSE streaming via StreamingResponse)
- `DELETE /ai/chat/sessions/{id}` — delete session
- **File**: `backend/app/routers/ai_chat.py`

### D6. Register Chat Router
- Add to `main.py`: `app.include_router(ai_chat.router, prefix="/api/v1", tags=["ai_chat"])`
- **File**: `backend/app/main.py`

### D7. AI Caching Layer
- Redis cache for AI recommendations: 1-hour TTL per user
- Invalidate on: new scan, shelf change, profile update
- Add `cache_key` helper to ai_intelligence_service
- **File**: `backend/app/services/ai_intelligence_service.py`

### D8. AI Token Tracking
- Log every AI call: user_id, endpoint, model, input_tokens, output_tokens, cost_usd, duration_ms
- Create `ai_usage_logs` table (lightweight migration)
- **Files**: `backend/alembic/versions/005_ai_usage_logs.py`, `backend/app/models/ai_usage.py`

---

## Track E: Remaining UI Components

### E1. Sheet (Bottom Sheet)
- Extract from `MobileBottomSheet.tsx` → `ui/Sheet/Sheet.tsx`
- Props: `open`, `onClose`, `snapPoints`
- **Files**: `frontend/src/ui/Sheet/Sheet.tsx`, `Sheet.module.css`

### E2. Toast
- Refactor `Toast.tsx` → `ui/Toast/Toast.tsx`
- **Files**: `frontend/src/ui/Toast/Toast.tsx`, `Toast.module.css`

### E3. EmptyState
- Refactor `EmptyState.tsx` → `ui/EmptyState/EmptyState.tsx`
- **Files**: `frontend/src/ui/EmptyState/EmptyState.tsx`, `EmptyState.module.css`

### E4. Switch
- New component for toggle switches
- Props: `checked`, `onChange`, `label`, `disabled`
- ARIA: `role="switch"`, `aria-checked`
- **Files**: `frontend/src/ui/Switch/Switch.tsx`, `Switch.module.css`

### E5. RadioGroup
- New component for radio button groups
- Props: `options`, `value`, `onChange`, `variant` (default/card)
- ARIA: `role="radiogroup"`, `role="radio"`
- **Files**: `frontend/src/ui/RadioGroup/RadioGroup.tsx`, `RadioGroup.module.css`

### E6. Progress
- New component for progress indicators
- Props: `value`, `max`, `variant` (bar/ring/steps)
- ARIA: `role="progressbar"`, `aria-valuenow`
- **Files**: `frontend/src/ui/Progress/Progress.tsx`, `Progress.module.css`

### E7. Avatar
- New component for user avatars
- Props: `src`, `fallback`, `size` (xs/sm/md/lg/xl)
- **Files**: `frontend/src/ui/Avatar/Avatar.tsx`, `Avatar.module.css`

### E8. Tooltip
- New component for tooltips
- Props: `content`, `placement` (top/bottom/left/right)
- **Files**: `frontend/src/ui/Tooltip/Tooltip.tsx`, `Tooltip.module.css`

### E9. Accordion
- New component (for FAQ, settings)
- Props: `items`, `allowMultiple`
- ARIA: `aria-expanded`, `aria-controls`
- **Files**: `frontend/src/ui/Accordion/Accordion.tsx`, `Accordion.module.css`

### E10. DropdownMenu
- New component for dropdown menus
- Props: `items`, `trigger`
- ARIA: `role="menu"`, `role="menuitem"`
- **Files**: `frontend/src/ui/DropdownMenu/DropdownMenu.tsx`, `DropdownMenu.module.css`

### E11. Checkbox
- New component
- Props: `checked`, `onChange`, `label`, `indeterminate`
- **Files**: `frontend/src/ui/Checkbox/Checkbox.tsx`, `Checkbox.module.css`

### E12. Select
- New component for dropdowns
- Props: `options`, `value`, `onChange`, `label`, `error`, `searchable`
- **Files**: `frontend/src/ui/Select/Select.tsx`, `Select.module.css`

### E13. Textarea
- New component
- Props: `rows`, `maxLength`, `label`, `error`, `autoResize`
- **Files**: `frontend/src/ui/Textarea/Textarea.tsx`, `Textarea.module.css`

### E14. Dialog
- Full-screen capable dialog (extends Modal)
- Props: `open`, `onClose`, `title`, `fullscreen`
- **Files**: `frontend/src/ui/Dialog/Dialog.tsx`, `Dialog.module.css`

---

## Track F: Error Handling & Monitoring

### F1. Sentry Backend
- `pip install sentry-sdk[fastapi]`
- Initialize in `main.py` with `SENTRY_DSN` env var
- **Files**: `backend/app/main.py`, `backend/app/config.py`

### F2. Sentry Frontend
- `npm install @sentry/react`
- Initialize in `main.tsx` with `VITE_SENTRY_DSN`
- **Files**: `frontend/src/main.tsx`, `frontend/.env.example`

### F3. Structured Logging
- Replace `logger.info(string)` with structured JSON format
- Include: timestamp, level, message, trace_id, user_id, duration_ms
- **File**: `backend/app/core/logging.py` (new)

---

## Verification Checklist

```bash
cd backend && alembic upgrade head && python -m pytest tests/ -x -q
cd frontend && npm run build
```

- [ ] Auth: refresh, logout, lockout, delete account working
- [ ] Scan: deduplicated, cursor pagination, rate limited
- [ ] Products: pagination envelope, sorting, filtering
- [ ] AI Chat: sessions CRUD + SSE streaming working
- [ ] AI caching + token tracking live
- [ ] 24 UI components in `src/ui/` (10 from Sprint 1 + 14 new)
- [ ] Sentry reporting errors in both frontend and backend
- [ ] Structured logging active
- [ ] Build + tests pass
