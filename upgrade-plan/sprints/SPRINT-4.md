# Sprint 4 — Remaining Pages, Real-time Notifications, PWA, Search

**Weeks:** 7-8
**Dependencies:** Sprint 3 (core page redesigns, API upgrades)
**Goal:** Complete all page redesigns + WebSocket real-time + PWA + unified search.

---

## Track A: WebSocket Real-time Notifications

### A1. WebSocket Manager
- Connection registry per user (dict: user_id → set of WebSocket connections)
- Heartbeat/ping-pong every 30s
- Auto-disconnect on missed pongs
- **File**: `backend/app/core/websocket.py`

### A2. Redis Pub/Sub Integration
- Multi-worker WebSocket coordination
- Publish events from any worker → all connected clients receive
- Channel: `notifications:{user_id}`
- **File**: `backend/app/core/websocket.py`

### A3. WebSocket Endpoint
- `WS /api/v1/notifications/live` — authenticated WebSocket connection
- Verify JWT on connect
- Send queued notifications on connect
- **File**: `backend/app/routers/notifications.py`

### A4. Event Triggers
- Scan complete → publish `scan_complete` event
- Routine reminder → scheduled background task
- Product expiry → daily background check
- Skin alert → AI monitoring trigger
- Goal milestone → progress threshold check
- **Files**: `backend/app/routers/scan.py`, `backend/app/tasks/notifications.py`

### A5. Frontend useWebSocket Hook
- Auto-connect on auth, disconnect on logout
- Reconnect with exponential backoff (1s → 30s max)
- Parse events, dispatch to TanStack Query cache invalidation
- **File**: `frontend/src/hooks/useWebSocket.ts`

### A6. Frontend Integration
- Update NotificationContext to use WebSocket alongside polling
- Show toast on real-time events
- Update unread count badge instantly
- **Files**: `frontend/src/context/NotificationContext.tsx`, `frontend/src/components/notifications/NotificationBell.tsx`

### A7. Web Push Subscription
- `POST /api/v1/notifications/subscribe` — save push subscription
- Service worker push event handler
- **Files**: `backend/app/routers/notifications.py`, `frontend/public/service-worker.js`

---

## Track B: PWA Upgrades

### B1. Install vite-plugin-pwa
- `npm install vite-plugin-pwa`
- Configure in `vite.config.ts`:
  - Precache: app shell (HTML, CSS, JS)
  - Runtime: StaleWhileRevalidate for API, CacheFirst for images/ML models
- **File**: `frontend/vite.config.ts`

### B2. Delete No-op Service Worker
- Remove `frontend/public/service-worker.js` (current no-op)
- Workbox generates the real one
- **File deleted**: `frontend/public/service-worker.js`

### B3. Update Manifest
- Add `shortcuts` (Scan, Shelf, Chat)
- Add `screenshots` for richer install prompt
- Add missing icon sizes
- **File**: `frontend/public/manifest.json`

### B4. Offline Fallback
- Show cached data when offline
- Queue mutations (shelf updates, routine check-ins) for background sync
- Verify `OfflineBanner` component works with new service worker
- **Files**: `frontend/src/components/OfflineBanner.tsx`

---

## Track C: Unified Search

### C1. Backend Search Router
- `GET /api/v1/search?q=niacinamide&type=all` — search products, ingredients, blogs
- `GET /api/v1/search/suggestions?q=nia` — typeahead (pg_trgm fuzzy)
- Track queries in `search_queries` table
- **File**: `backend/app/routers/search.py`

### C2. Search Migration
- Create `search_queries` table
- Enable `pg_trgm` extension if not already
- Add trigram indexes on product names
- **File**: `backend/alembic/versions/006_search.py`

### C3. Register Search Router
- **File**: `backend/app/main.py`

### C4. Frontend SearchPage
- Route: `/search`
- Search input with typeahead dropdown
- Tabs: All, Products, Ingredients, Blog
- Result cards per type
- "No results" state with suggestions
- **Files**: `frontend/src/pages/SearchPage.tsx`, `SearchPage.module.css`

### C5. Global Search
- Search icon in AppLayout header
- Click → opens search overlay or navigates to `/search`
- **File**: `frontend/src/components/AppLayout.tsx`

---

## Track D: Tier 2 Page Redesigns

### D1. RoutineBuilderPage
- AI "Generate routine for me" button
- Polish drag-reorder touch interactions
- Product search when adding step
- Routine check-in button
- **Files**: `frontend/src/pages/RoutineBuilderPage.tsx`, `RoutineBuilderPage.module.css`

### D2. ProductDetailsPage
- Refactor 1230 lines → sub-components (IngredientList, ReviewSection, SafetyReport)
- Personalized ingredient warnings (user's allergies)
- "Safe for me?" check button
- Similar products carousel
- **Files**: `frontend/src/pages/ProductDetailsPage.tsx` + sub-components

### D3. HistoryPage
- Timeline view with calendar heatmap
- Infinite scroll (cursor-based pagination)
- Filter by date range, score range
- Compare any 2 scans
- **Files**: `frontend/src/pages/HistoryPage.tsx`, `HistoryPage.module.css`

### D4. ComparisonPage
- Side-by-side slider (existing ComparisonSlider)
- Metric diff table (improved/worsened highlighting)
- AI comparison narrative
- **Files**: `frontend/src/pages/ComparisonPage.tsx`, `ComparisonPage.module.css`

### D5. DigitalTwinTimelinePage
- 3D face model with concern overlay (Three.js)
- Timeline scrubber with snapshots
- Simulation panel
- 2D fallback for low-power devices
- **Files**: `frontend/src/pages/DigitalTwinTimelinePage.tsx`, sub-components

### D6. ProgressTrackingPage
- Recharts line charts per metric
- Date range selector (week/month/3mo/6mo/year)
- Milestone markers on chart
- **Files**: `frontend/src/pages/ProgressTrackingPage.tsx`, `ProgressTrackingPage.module.css`

### D7. ProfileSettingsPage
- Refactor 1460 lines → tab sub-components
- Tabs: Personal, Skin, Lifestyle, Preferences, Notifications, Privacy, Account
- Photo upload with crop
- Theme preference selector
- **Files**: `frontend/src/pages/ProfileSettingsPage.tsx` + tab components

---

## Track E: Tier 3 Pages (Secondary)

### E1. Educational Pages
- **IngredientDictionaryPage**: fuzzy search, A-Z index, safety badges
- **SkinTypeGuidePage**: interactive quiz → saves to profile
- **BlogPage**: grid with featured hero, category filters, pagination
- **VideoTutorialsPage**: grid with thumbnails, difficulty badges
- **AboutPage**: team section, timeline, mission
- **ContactPage**: form with validation

### E2. Legal Pages
- **PrivacyPage**: table of contents, collapsible sections
- **TermsPage**: same treatment
- **ConsentPage**: granular consent checkboxes

### E3. User Pages
- **SkinGoalsPage**: card-based with progress rings
- **FavoritesPage**: grid layout, collection folders (if endpoint ready)
- **NotificationCenterPage**: group by date, read/unread, filter by type
- **DataExportPage**: format options, progress indicator

### E4. NotFoundPage
- Helpful 404 with search, popular links, illustration

---

## Track F: Backend — Notification & Admin Upgrades

### F1. Notification Endpoints
- `GET /notifications/unread-count` — lightweight polling
- `DELETE /notifications/read` — bulk delete read
- Cursor-based pagination
- **File**: `backend/app/routers/notifications.py`

### F2. Admin Upgrades
- `GET /admin/audit-log` — admin action audit trail
- `GET /admin/system/health` — detailed system health (DB pool, Redis, AI API status)
- Admin action logging middleware
- **Files**: `backend/app/routers/admin.py`

### F3. Consent Upgrades
- `POST /consent/export-data` — GDPR data portability
- `POST /consent/delete-data` — right to be forgotten
- **File**: `backend/app/routers/consent.py`

---

## Verification Checklist

```bash
cd backend && python -m pytest tests/ -x -q
cd frontend && npm run build
```

- [ ] WebSocket: real-time notifications working (scan complete, reminders)
- [ ] Web Push: background notifications received
- [ ] PWA: installable, offline mode shows cached data
- [ ] Search: typeahead working, results across products/ingredients/blogs
- [ ] All Tier 2 pages redesigned (7 pages)
- [ ] All Tier 3 pages polished (12+ pages)
- [ ] All pages responsive at 375px / 768px / 1024px / 1440px
- [ ] All pages dark mode verified
- [ ] Build + tests pass
