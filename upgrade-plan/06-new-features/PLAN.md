# New Features — Gamification, Community, Real-time, Search

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

- **Event Types**:
  | Event | Trigger | Payload |
  |-------|---------|---------|
  | `scan_complete` | Scan analysis finishes | `{scan_id, score, concerns}` |
  | `routine_reminder` | Scheduled time | `{routine_type, time}` |
  | `product_expiry` | Daily check | `{product_name, days_until}` |
  | `achievement_unlocked` | Achievement trigger | `{achievement, name, tier}` |
  | `ai_insight` | AI detects pattern | `{insight_text, type}` |
  | `community_like` | Someone likes post | `{post_id, liker_name}` |
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

## NF2. Gamification System

### Sprint 5

#### Achievements

| Achievement | Trigger | Tier | XP |
|-------------|---------|------|-----|
| First Scan | Complete first face scan | Bronze | 50 |
| Skin Scholar | Read 5 ingredient articles | Bronze | 30 |
| Routine Starter | Create first routine | Bronze | 40 |
| Shelf Builder | Add 5 products to shelf | Bronze | 30 |
| Profile Pro | Complete 100% of profile | Silver | 100 |
| Week Warrior | 7-day scan streak | Silver | 150 |
| Month Master | 30-day scan streak | Gold | 500 |
| Ingredient Expert | Look up 20 ingredients | Silver | 100 |
| Social Butterfly | Post 5 community updates | Silver | 100 |
| Goal Crusher | Complete 3 skin goals | Gold | 300 |
| AI Explorer | Have 10 AI chat sessions | Silver | 100 |
| Product Reviewer | Write 5 product reviews | Silver | 100 |
| Skin Transformation | Improve score by 20 points | Gold | 500 |
| Year Legend | 365-day streak | Platinum | 2000 |

#### Streak System
- Track consecutive days with ANY activity (scan, routine check-in, shelf update)
- Freeze: 1 free freeze per week (miss a day without breaking streak)
- Display: streak counter on Dashboard + MePage
- Notification: "Don't break your 14-day streak!" reminder

#### XP & Levels
| Level | XP Required | Name |
|-------|-------------|------|
| 1 | 0 | Skincare Newbie |
| 2 | 100 | Skincare Explorer |
| 3 | 300 | Skincare Enthusiast |
| 4 | 600 | Skincare Devotee |
| 5 | 1000 | Skincare Expert |
| 6 | 1500 | Skincare Master |
| 7 | 2500 | Skincare Guru |
| 8 | 4000 | Skincare Legend |

#### Backend
- **Achievement Service**: `app/services/achievement_service.py`
  - `check_achievements(user_id, event_type)` — called after key actions
  - `get_user_achievements(user_id)` — list with progress
  - `get_streak(user_id)` — current streak info
  - `add_xp(user_id, amount, reason)` — XP tracking

- **Event-driven**: After scan → check scan achievements. After shelf add → check shelf achievements. Etc.

#### Frontend
- **AchievementsPage** (`/achievements`):
  - Grid of achievement cards (locked/unlocked)
  - Progress bars for in-progress achievements
  - Filter by category (scan, routine, social, expert)
  - Confetti animation on unlock

- **Components**:
  - `AchievementCard.tsx` — card with icon, name, progress, tier badge
  - `StreakCounter.tsx` — flame icon + count (already exists as ScanStreak, extend)
  - `LevelBadge.tsx` — level circle with XP progress ring
  - `AchievementToast.tsx` — celebration toast when achievement unlocked

---

## NF3. Community / Social

### Sprint 5

#### Post Types
| Type | Content | Example |
|------|---------|---------|
| Progress Update | Scan comparison + text | "2 months on my new routine! Score up 15 points" |
| Product Review | Product + rating + text | "CeraVe PM Moisturizer changed my skin" |
| Routine Share | Routine steps + text | "My 5-step morning routine that works" |
| Question | Text | "What's the best sunscreen for oily skin?" |
| Tip | Text + optional image | "Apply vitamin C before sunscreen, not after" |

#### Backend
- **Community Router**: `app/routers/community.py`
  ```
  GET    /community/feed                — paginated feed (cursor-based)
  POST   /community/posts               — create post
  GET    /community/posts/{id}          — post + comments
  POST   /community/posts/{id}/like     — toggle like
  POST   /community/posts/{id}/comments — add comment
  POST   /community/posts/{id}/report   — report content
  DELETE /community/posts/{id}          — delete own post
  GET    /community/posts/{id}/comments — paginated comments
  ```

- **Content Moderation**:
  - AI auto-flag: run content through GPT-4o-mini for toxicity check
  - Flagged → admin review queue
  - User report → admin queue
  - 3 reports → auto-hide pending review

- **Privacy**:
  - Opt-in only (default: profile not shared)
  - Display name (not email) on posts
  - Can hide scan scores from posts
  - Block/mute other users

#### Frontend
- **CommunityFeedPage** (`/community`):
  - Infinite scroll feed
  - Post creation with image upload
  - Like/comment/share actions
  - Report button

- **Components**:
  - `CommunityPost.tsx` — post card with avatar, content, actions
  - `CommentSection.tsx` — comment list + input
  - `CreatePostModal.tsx` — post creation with type selector
  - `ComparisonShareCard.tsx` — formatted scan comparison for sharing

---

## NF4. Unified Search

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

## NF5. PWA Upgrades

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
    {"name": "Chat", "url": "/chat", "icon": "icons/chat.png"}
  ],
  "screenshots": [
    {"src": "screenshots/dashboard.png", "sizes": "1080x1920", "type": "image/png"}
  ]
}
```

#### Push Notifications
- Web Push API subscription management
- Service worker handles push events
- Notification types: scan complete, routine reminder, achievement unlocked

---

## NF6. A/B Testing Framework

### Sprint 6

#### Backend
- Experiment management API
- Deterministic variant assignment (user_id hash)
- Metrics collection per variant

#### Frontend
- `useExperiment(name)` hook
  ```tsx
  const { variant, track } = useExperiment('new-scan-flow');
  // variant = 'control' | 'treatment_a' | 'treatment_b'
  ```
- Admin dashboard for experiment creation and results

---

## Feature Rollout Order

1. **Sprint 4, Week 7**: WebSocket infrastructure + real-time notifications
2. **Sprint 4, Week 8**: Unified search + PWA upgrades
3. **Sprint 5, Week 9**: Gamification (achievements + streaks + XP)
4. **Sprint 5, Week 10**: Community feed (posts + likes + comments)
5. **Sprint 6, Week 11**: A/B testing framework
6. **Sprint 6, Week 12**: Polish all new features
