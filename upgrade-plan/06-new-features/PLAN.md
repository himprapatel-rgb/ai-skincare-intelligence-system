# New Features — Clinical Intelligence, Real-time, Search, Advanced Analytics

**Sprint:** 4-5 (Weeks 7-10)
**Team Size:** 30 engineers
**Dependencies:** Backend API (Sprint 2-3), Component library (Sprint 2)

---

## NF1. Real-time Notifications (WebSocket)

### Sprint 4

#### Backend
- **WebSocket Manager**: `app/core/websocket.py`
  - Connection registry per user
  - Redis Pub/Sub for multi-worker coordination
  - Heartbeat/ping-pong to detect disconnects
  - Reconnect support

- **WebSocket Endpoint**: `WS /api/v1/notifications/live`
  ```python
  @router.websocket("/notifications/live")
  async def notification_websocket(websocket, user):
      await manager.connect(user.id, websocket)
      try:
          while True:
              data = await websocket.receive_text()  # heartbeat
              await manager.send_pong(user.id)
      except WebSocketDisconnect:
          manager.disconnect(user.id)
  ```

- **Clinical Event Types**:
  | Event | Trigger | Payload |
  |-------|---------|---------|
  | `scan_complete` | Scan analysis finishes | `{scan_id, score, concerns}` |
  | `routine_reminder` | Scheduled time | `{routine_type, time}` |
  | `product_expiry` | Daily check | `{product_name, days_until}` |
  | `skin_alert` | AI detects worsening trend | `{concern, severity_change, recommendation}` |
  | `uv_alert` | High UV index at user location | `{uv_index, recommendation}` |
  | `ingredient_recall` | Product safety update | `{product_name, alert_type}` |
  | `derm_referral` | AI flags potential medical concern | `{concern, severity, message}` |
  | `goal_milestone` | Goal % threshold hit | `{goal_name, percentage}` |

- **Web Push**: Register service worker for background notifications
  ```
  POST /api/v1/notifications/subscribe — save push subscription
  ```

#### Frontend
- **useWebSocket hook**: `frontend/src/hooks/useWebSocket.ts`
  - Auto-connect on auth
  - Reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
  - Parse incoming events, dispatch to appropriate handlers
  - Queue messages while disconnected

- **NotificationProvider upgrade**: Add WebSocket alongside polling
- **Toast on event**: Show toast for real-time events
- **Badge update**: Unread count updates instantly

---

## NF2. Clinical Insights & Dermatologist Integration

### Sprint 5

A medical-grade platform needs clinical intelligence, not gamification. Replace XP/levels with features that improve skin health outcomes.

#### Dermatologist Report Generator
**Upgrade existing** `/analysis/:analysisId` export:
- **PDF report** formatted for dermatologist review:
  - Patient skin profile summary
  - AI analysis with confidence scores
  - Concern severity timeline (showing progression)
  - Zone-by-zone heatmap analysis
  - Product ingredient interaction warnings
  - Environmental factor correlations
  - Recommended follow-up areas
- **Shareable link**: Generate secure, time-limited link for sharing with dermatologist
- **Print-optimized**: CSS print stylesheet for clean printing

#### Skin Health Tracking Dashboard
Replace gamification with clinical-grade tracking:

| Metric | How Tracked | Display |
|--------|------------|---------|
| Skin Health Score | Per-scan AI score (0-100) | Trend line chart over time |
| Concern Severity | Per-concern per-scan | Individual concern trend lines |
| Hydration Level | AI assessment per scan | Gauge + trend |
| Routine Adherence | Check-ins vs scheduled | Calendar heatmap (medical style) |
| Environmental Correlation | UV, humidity, pollution vs skin | Dual-axis correlation chart |
| Product Effectiveness | Score changes after product starts | Before/after comparison |

#### AI Skin Alerts
Proactive AI monitoring (background analysis):
```
POST /api/v1/ai/monitor — run nightly per user with 3+ scans
```
- Detect negative trends early: "Your acne severity has increased 20% over 2 weeks"
- Suggest action: "Consider reducing exfoliation frequency"
- Flag for dermatologist: "Persistent redness increase — consider professional consultation"
- Correlate with routine changes: "This started after you added Product X"

#### Ingredient Safety Intelligence
**Upgrade existing** ingredient analysis:
- **Drug interaction warnings**: Flag ingredients that interact with user's medications (from profile)
- **Pregnancy safety**: Automatic flags for retinoids, salicylic acid, etc. when `pregnancy_status` is set
- **Allergen cross-reactivity**: "You're allergic to fragrance — this product contains linalool (common fragrance allergen)"
- **Comedogenic risk scoring**: Per-product score based on full ingredient list
- **Regulatory compliance**: EU vs FDA approval status for each ingredient

#### Backend
- **Clinical Insights Service**: `app/services/clinical_insights_service.py`
  - `generate_derm_report(user_id, scan_ids) → PDF`
  - `analyze_trends(user_id, days) → TrendAnalysis`
  - `check_skin_alerts(user_id) → List[Alert]`
  - `check_ingredient_interactions(ingredients, user_profile) → List[Warning]`
  - `correlate_environmental(user_id) → CorrelationReport`

- **New Endpoints**:
  ```
  GET  /api/v1/clinical/report/{scan_id}     — generate derm PDF report
  POST /api/v1/clinical/share-report          — create shareable link
  GET  /api/v1/clinical/trends                — skin health trends over time
  GET  /api/v1/clinical/alerts                — active skin alerts
  GET  /api/v1/clinical/correlations          — environmental correlations
  POST /api/v1/clinical/ingredient-check      — full safety check with interactions
  ```

#### Frontend
- **ClinicalDashboardPage** (`/clinical` or integrated into Dashboard):
  - Skin health score trend (primary chart)
  - Active alerts (warning cards)
  - Environmental correlation panel
  - Product effectiveness timeline
  - "Generate Dermatologist Report" button

---

## NF3. Unified Search

### Sprint 4

#### Backend
- **Search Router**: `app/routers/search.py`
  ```
  GET /search?q=niacinamide&type=all — search across products, ingredients, blogs
  GET /search/suggestions?q=nia     — typeahead (pg_trgm fuzzy match)
  ```

- **Implementation**: PostgreSQL full-text search + `pg_trgm` extension
  ```sql
  SELECT *, ts_rank(search_vector, to_tsquery('english', 'niacinamide')) as rank
  FROM products
  WHERE search_vector @@ to_tsquery('english', 'niacinamide')
  ORDER BY rank DESC
  LIMIT 20;
  ```

- **Track**: Log search queries for analytics

#### Frontend
- **SearchPage** (`/search`):
  - Search input with typeahead suggestions
  - Tabs: All, Products, Ingredients, Blog
  - Result cards per type
  - "No results" state with suggestions

- **Global search**: Search icon in header → opens search overlay

---

## NF4. PWA Upgrades

### Sprint 4

#### Service Worker (Workbox via vite-plugin-pwa)
- **Precache**: App shell (HTML, CSS, JS)
- **Runtime cache**:
  | Route | Strategy | TTL |
  |-------|----------|-----|
  | `/api/v1/profile` | StaleWhileRevalidate | 5 min |
  | `/api/v1/shelf` | StaleWhileRevalidate | 5 min |
  | `/api/v1/scan/history` | StaleWhileRevalidate | 10 min |
  | `/api/v1/content/*` | CacheFirst | 1 hour |
  | Images | CacheFirst | 7 days |
  | ML models | CacheFirst | 30 days |

- **Offline fallback**: Show cached data with "You're offline" banner
- **Background sync**: Queue shelf updates, routine check-ins when offline

#### Manifest Updates
```json
{
  "shortcuts": [
    {"name": "Scan Face", "url": "/scan", "icon": "icons/scan.png"},
    {"name": "My Shelf", "url": "/myshelf", "icon": "icons/shelf.png"},
    {"name": "AI Assistant", "url": "/chat", "icon": "icons/chat.png"}
  ],
  "screenshots": [
    {"src": "screenshots/dashboard.png", "sizes": "1080x1920", "type": "image/png"}
  ]
}
```

#### Push Notifications
- Web Push API subscription management
- Service worker handles push events
- Notification types: scan complete, routine reminder, skin alert, product expiry

---

## NF5. Advanced Admin Analytics

### Sprint 5

Medical-grade platforms need operational analytics, not A/B experiments.

#### Backend
- **Analytics Router**: `app/routers/analytics.py`
  ```
  GET /api/v1/admin/analytics/overview      — DAU, MAU, scan volume, AI usage
  GET /api/v1/admin/analytics/scans         — scan success rate, processing time, model accuracy
  GET /api/v1/admin/analytics/ai-usage      — token consumption, cost per endpoint, error rate
  GET /api/v1/admin/analytics/users         — registration rate, retention, profile completion
  GET /api/v1/admin/analytics/products      — most searched, most shelved, most reviewed
  GET /api/v1/admin/analytics/clinical      — alert frequency, derm report generation, concern distribution
  ```

#### Frontend
- **AdminAnalyticsPage** (`/admin/analytics`):
  - KPI cards: DAU, MAU, total scans, AI cost
  - Charts: user growth, scan volume over time, AI token usage
  - Tables: top products, top concerns, most common skin types
  - Filters: date range, user segment

---

## NF6. Multi-Scan Analysis (Advanced AI)

### Sprint 5

Go beyond single-scan analysis — the differentiator for a clinical-grade platform.

#### Features
- **Multi-angle scan**: Capture front + left profile + right profile in one session
  - Backend: link 3 images to one scan session, analyze each, merge results
  - Frontend: guided 3-step capture with face rotation guide
  - AI: separate zone analysis per angle, combined overall score

- **Longitudinal Analysis**: AI analyzes scan history (not just latest scan)
  ```
  POST /api/v1/ai/longitudinal-analysis
  ```
  - Input: user's last 10 scans
  - Output: trend narrative, seasonal patterns, product correlation, predicted trajectory
  - "Your skin improves in summer months — likely UV-related vitamin D benefit, but watch sun damage"

- **Comparative Benchmarking** (anonymized):
  ```
  GET /api/v1/ai/benchmark
  ```
  - "Your hydration score is in the top 30% for your age group and skin type"
  - Fully anonymized, aggregate-only, opt-in
  - No individual data shared

---

## Feature Rollout Order

1. **Sprint 4, Week 7**: WebSocket infrastructure + real-time notifications
2. **Sprint 4, Week 8**: Unified search + PWA upgrades
3. **Sprint 5, Week 9**: Clinical insights (derm reports, skin alerts, trends, ingredient intelligence)
4. **Sprint 5, Week 10**: Admin analytics + multi-scan analysis
5. **Sprint 6, Week 11-12**: Polish all new features + performance optimization
