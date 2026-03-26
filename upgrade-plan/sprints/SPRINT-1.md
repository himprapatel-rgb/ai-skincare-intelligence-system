# Sprint 1 — Foundation & Architecture

**Weeks:** 1-2
**Dependencies:** None (first sprint)
**Goal:** Set up the infrastructure that all future sprints depend on.

---

## Track A: Database Migrations (Alembic)

### A1. Install & Configure Alembic
- **Install**: `pip install alembic` + add to `requirements.txt`
- **Init**: `alembic init alembic` in `backend/`
- **Configure** `alembic/env.py`:
  - Import `Base` from `app.database`
  - Set `target_metadata = Base.metadata`
  - Configure `sqlalchemy.url` from `app.config.settings.DATABASE_URL`
- **Files created**: `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/versions/`

### A2. Create Baseline Migration
- Auto-generate from current models: `alembic revision --autogenerate -m "baseline"`
- Review generated migration for accuracy
- Test: `alembic upgrade head` on test database
- **File**: `backend/alembic/versions/001_baseline.py`

### A3. Remove ALTER TABLE from main.py
- Remove lines 219-267 in `backend/app/main.py` (the `ALTER TABLE` block in `ensure_test_user`)
- These are now handled by Alembic migrations
- Keep the test user seeding logic, just remove schema modification
- **File modified**: `backend/app/main.py`

### A4. Schema Fix Migrations
Create migration for existing table improvements:
```
alembic revision --autogenerate -m "schema_fixes"
```

**users table**:
- `password_reset_token VARCHAR(255)`
- `password_reset_expires_at TIMESTAMPTZ`
- `login_count INTEGER DEFAULT 0`
- `failed_login_count INTEGER DEFAULT 0`
- `locked_until TIMESTAMPTZ`
- `deleted_at TIMESTAMPTZ` (soft delete)
- `language VARCHAR(10) DEFAULT 'en'`
- Index: `(email, is_active)`

**user_profiles table**:
- `fitzpatrick_type INTEGER`
- `pregnancy_status VARCHAR(20)`
- `avatar_storage_key VARCHAR(500)`
- GIN indexes on `secondary_concerns`, `known_allergies`

**scan_sessions table**:
- `device_type VARCHAR(50)`
- `client_version VARCHAR(20)`
- `processing_duration_ms INTEGER`
- `storage_key VARCHAR(500)`
- Index: `(user_id, status, created_at)`

**products table**:
- `description TEXT`
- `ingredients_text TEXT`
- `country_of_origin VARCHAR(100)`
- `discontinued BOOLEAN DEFAULT FALSE`
- Full-text index on `(name, brand)`

**shelf_products**:
- `opened_date TIMESTAMPTZ`
- `pao_months INTEGER`

**notifications**:
- `priority VARCHAR(10) DEFAULT 'normal'`
- `category VARCHAR(50)`

**blogs**:
- `category VARCHAR(100)`
- `tags JSONB DEFAULT '[]'`
- `view_count INTEGER DEFAULT 0`

**All tables**: Audit datetime defaults → `server_default=func.now()`

- **File**: `backend/alembic/versions/002_schema_fixes.py`
- **Models modified**: `backend/app/models/user.py`, `scan.py`, `product_models.py`, `shelf.py`, `notifications.py`, `content.py`

### A5. Performance Indexes Migration
```
alembic revision -m "performance_indexes"
```
- Enable `pg_trgm` extension
- Partial indexes:
  - `idx_scans_completed ON scan_sessions(user_id, created_at) WHERE status = 'COMPLETED'`
  - `idx_shelf_active ON shelf_products(user_id) WHERE status = 'active'`
  - `idx_notifications_unread ON notifications(user_id) WHERE read = false`
- Materialized view: `user_dashboard_stats`
- **File**: `backend/alembic/versions/003_performance_indexes.py`

---

## Track B: Design Token Pipeline

### B1. Create Token JSON
- Single source of truth for all design tokens
- **File**: `frontend/src/tokens/tokens.json`
- Content: colors (primary, semantic, grays), spacing (4px grid), typography (font, sizes), shadows, radii, z-index, transitions
- Include dark mode overrides in same file

### B2. Token Build Script
- Node script that reads `tokens.json` → generates `tokens.css` + `tokens-dark.css`
- Add `"build:tokens"` script to `package.json`
- **File**: `frontend/src/tokens/build.js`

### B3. Consolidate Global CSS
- Merge surviving rules from redundant files into:
  - `styles/tokens.css` (generated)
  - `styles/base.css` (resets, typography, global elements)
  - `styles/utilities.css` (responsive helpers, safe-area)
  - `styles/dark-mode.css` (generated or keep existing)
- Update `index.css` imports to 4 files
- Delete: files with zero surviving unique rules after merge
- **Files modified**: `frontend/src/index.css`, `frontend/src/styles/`

---

## Track C: State Management

### C1. Install TanStack Query
- `npm install @tanstack/react-query @tanstack/react-query-devtools`
- **File modified**: `frontend/package.json`

### C2. Add QueryClientProvider
- Wrap app in `QueryClientProvider` in App.tsx
- Configure: `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000`
- Add React Query DevTools (dev only)
- **File modified**: `frontend/src/App.tsx`

### C3. Create Query Key Factory
- Namespaced keys for all server state
- **File**: `frontend/src/api/queryKeys.ts`
```typescript
export const queryKeys = {
  scans: {
    all: ['scans'] as const,
    history: (userId: number) => ['scans', 'history', userId] as const,
    detail: (scanId: string) => ['scans', 'detail', scanId] as const,
  },
  shelf: {
    all: ['shelf'] as const,
    list: (userId: number, filters?: object) => ['shelf', 'list', userId, filters] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: (userId: number) => ['notifications', 'unread', userId] as const,
  },
  profile: {
    current: ['profile'] as const,
  },
  products: {
    search: (query: string) => ['products', 'search', query] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  goals: {
    all: ['goals'] as const,
  },
  ai: {
    chat: {
      sessions: ['ai', 'chat', 'sessions'] as const,
      messages: (sessionId: string) => ['ai', 'chat', 'messages', sessionId] as const,
    },
  },
};
```

### C4. Migrate ScanContext to TanStack Query
- Replace manual fetch + setState with `useQuery`
- Keep the context as a thin wrapper for backward compatibility
- **File modified**: `frontend/src/context/ScanContext.tsx`

### C5. Migrate ShelfContext to TanStack Query
- Same pattern as ScanContext
- **File modified**: `frontend/src/context/ShelfContext.tsx`

### C6. Migrate NotificationContext to TanStack Query
- Same pattern
- **File modified**: `frontend/src/context/NotificationContext.tsx`

### C7. Remove Zustand Stores
- Delete `analysisStore.ts` and `authStore.ts` (functionality now in TanStack Query + AuthContext)
- Verify no imports remain
- **Files deleted**: `frontend/src/stores/analysisStore.ts`, `frontend/src/stores/authStore.ts`

---

## Track D: Component Library Scaffold

### D1. Create UI Directory
- `frontend/src/ui/` with barrel export
- **File**: `frontend/src/ui/index.ts`

### D2. Extract Button Component
- Extract from `MobileButton.tsx` → `ui/Button/Button.tsx`
- Props: `variant` (primary/secondary/outline/ghost/danger), `size` (sm/md/lg), `loading`, `disabled`, `icon`, `fullWidth`
- CSS Module: `Button.module.css`
- **Files**: `frontend/src/ui/Button/Button.tsx`, `Button.module.css`

### D3. Extract Input Component
- Extract from `MobileInput.tsx` → `ui/Input/Input.tsx`
- Props: `type`, `label`, `error`, `helper`, `icon`, `clearable`
- **Files**: `frontend/src/ui/Input/Input.tsx`, `Input.module.css`

### D4. Extract Card Component
- Extract from `MobileCard.tsx` → `ui/Card/Card.tsx`
- Props: `variant` (elevated/outlined/filled/flat), `padding`, `pressable`, `onClick`
- **Files**: `frontend/src/ui/Card/Card.tsx`, `Card.module.css`

### D5. Extract Modal Component
- Extract from `ConfirmModal.tsx` → `ui/Modal/Modal.tsx`
- Props: `open`, `onClose`, `title`, `actions`
- Focus trap + Escape to close
- **Files**: `frontend/src/ui/Modal/Modal.tsx`, `Modal.module.css`

### D6. Extract Skeleton Component
- Refactor `Skeleton.tsx` → `ui/Skeleton/Skeleton.tsx`
- Keep all 10+ variants
- **Files**: `frontend/src/ui/Skeleton/Skeleton.tsx`, `Skeleton.module.css`

### D7. Extract Spinner Component
- From `LoadingSpinner.tsx` → `ui/Spinner/Spinner.tsx`
- **Files**: `frontend/src/ui/Spinner/Spinner.tsx`, `Spinner.module.css`

### D8. Create Tabs Component (New)
- Props: `items`, `activeKey`, `onChange`
- Variants: underline, pills, segmented
- Keyboard: arrow key navigation
- ARIA: tablist, tab, tabpanel
- **Files**: `frontend/src/ui/Tabs/Tabs.tsx`, `Tabs.module.css`

### D9. Create Badge Component (New)
- Props: `variant` (default/success/warning/error/info), `size` (sm/md)
- **Files**: `frontend/src/ui/Badge/Badge.tsx`, `Badge.module.css`

### D10. Create Alert Component (New)
- Props: `type` (info/success/warning/error), `title`, `message`, `dismissible`
- **Files**: `frontend/src/ui/Alert/Alert.tsx`, `Alert.module.css`

---

## Track E: Build Tooling

### E1. Pin Python Dependencies
- Change all `>=` to `==` in `requirements.txt`
- Run `pip freeze` to get exact versions
- **File modified**: `backend/requirements.txt`

### E2. Add pyproject.toml
- Configure ruff, mypy, black
- **File**: `backend/pyproject.toml`

---

## Verification Checklist

```bash
# Backend
cd backend
alembic upgrade head                    # migrations work
python -m pytest tests/ -x -q          # all tests pass
ruff check app/                         # no lint errors

# Frontend
cd frontend
npm run build                           # zero errors
npm run build:tokens                    # token generation works
```

- [ ] Alembic configured and 3 migrations created
- [ ] ALTER TABLE removed from main.py
- [ ] All schema fixes applied via migration
- [ ] Performance indexes created
- [ ] tokens.json → tokens.css pipeline working
- [ ] index.css reduced to 4 imports
- [ ] TanStack Query installed + 3 contexts migrated
- [ ] Zustand stores removed
- [ ] 10 UI components extracted to `src/ui/`
- [ ] Python dependencies pinned
- [ ] `npm run build` + `pytest` both pass
