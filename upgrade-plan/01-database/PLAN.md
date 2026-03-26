# Database Upgrades

**Sprint:** 1-2 (Weeks 1-4)
**Team Size:** 8 engineers
**Dependencies:** Architecture foundation (Alembic setup)

---

## D1. Migration Infrastructure

### Current Problems
- No Alembic — uses `Base.metadata.create_all()` at startup
- 15+ `ALTER TABLE` statements in `main.py ensure_test_user()` — production hazard
- Schema changes require manual SQL or app restart

### Changes
1. Install Alembic, configure with both main DB and product DB
2. Create initial baseline migration from current schema
3. Remove ALL `ALTER TABLE` from `main.py` startup
4. Add `alembic upgrade head` to deployment pipeline
5. Add `alembic downgrade -1` rollback capability

### Files
- `backend/alembic.ini` — new
- `backend/alembic/` — new directory with env.py and versions/
- `backend/app/main.py` — remove ALTER TABLE block (lines 219-267)

---

## D2. Schema Fixes — Existing Tables

### users table
```sql
ADD COLUMN password_reset_token VARCHAR(255);
ADD COLUMN password_reset_expires_at TIMESTAMPTZ;
ADD COLUMN login_count INTEGER DEFAULT 0;
ADD COLUMN failed_login_count INTEGER DEFAULT 0;
ADD COLUMN locked_until TIMESTAMPTZ;
ADD COLUMN deleted_at TIMESTAMPTZ;              -- soft delete for GDPR
ADD COLUMN language VARCHAR(10) DEFAULT 'en';   -- i18n
ALTER COLUMN hashed_password DROP NOT NULL;      -- OAuth-only users
CREATE INDEX idx_users_email_active ON users(email, is_active);
```

### user_profiles table
```sql
ADD COLUMN fitzpatrick_type INTEGER;            -- 1-6, currently only on SkinAnalysis
ADD COLUMN pregnancy_status VARCHAR(20);        -- pregnancy-safe filtering
ADD COLUMN avatar_storage_key VARCHAR(500);     -- CDN key instead of URL
CREATE INDEX idx_profiles_concerns ON user_profiles USING GIN(secondary_concerns);
CREATE INDEX idx_profiles_allergies ON user_profiles USING GIN(known_allergies);
```

### scan_sessions table
```sql
ADD COLUMN device_type VARCHAR(50);
ADD COLUMN client_version VARCHAR(20);
ADD COLUMN processing_duration_ms INTEGER;
ADD COLUMN storage_key VARCHAR(500);            -- R2 image key (replaces BYTEA)
CREATE INDEX idx_scans_user_status_date ON scan_sessions(user_id, status, created_at);
-- After R2 migration: DROP COLUMN image_data;
```

### products table
```sql
ADD COLUMN description TEXT;
ADD COLUMN ingredients_text TEXT;
ADD COLUMN country_of_origin VARCHAR(100);
ADD COLUMN discontinued BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_products_fulltext ON products USING GIN(to_tsvector('english', name || ' ' || brand));
CREATE INDEX idx_products_concerns ON products USING GIN(primary_concerns);
```

### product_reviews table
```sql
ADD COLUMN reported BOOLEAN DEFAULT FALSE;
ADD COLUMN admin_approved BOOLEAN DEFAULT TRUE;
```

### shelf_products table
```sql
ADD COLUMN opened_date TIMESTAMPTZ;
ADD COLUMN pao_months INTEGER;                  -- Period After Opening
```

### notifications table
```sql
ADD COLUMN priority VARCHAR(10) DEFAULT 'normal';
ADD COLUMN category VARCHAR(50);
```

### blogs table
```sql
ADD COLUMN category VARCHAR(100);
ADD COLUMN tags JSONB DEFAULT '[]';
ADD COLUMN view_count INTEGER DEFAULT 0;
ADD COLUMN like_count INTEGER DEFAULT 0;
```

### All tables
- Audit `datetime.utcnow` Python defaults → switch to `server_default=func.now()`
- Ensure all TIMESTAMPTZ columns use timezone-aware defaults

---

## D3. New Tables

### AI Chat (Sprint 2)
```sql
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    message_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chat_sessions_user ON ai_chat_sessions(user_id, created_at DESC);

CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB,
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chat_messages_session ON ai_chat_messages(session_id, created_at);
```

### Gamification (Sprint 5)
```sql
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(200) NOT NULL,
    description TEXT,
    tier VARCHAR(20) DEFAULT 'bronze',
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    progress_current INTEGER DEFAULT 0,
    progress_target INTEGER,
    metadata JSONB
);
CREATE INDEX idx_achievements_user ON user_achievements(user_id);

CREATE TABLE user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL,
    current_count INTEGER DEFAULT 0,
    longest_count INTEGER DEFAULT 0,
    last_activity_date DATE,
    started_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX idx_streaks_user_type ON user_streaks(user_id, streak_type);
```

### Community / Social (Sprint 5)
```sql
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    post_type VARCHAR(30) DEFAULT 'update',
    visibility VARCHAR(20) DEFAULT 'public',
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_posts_user ON community_posts(user_id, created_at DESC);
CREATE INDEX idx_posts_feed ON community_posts(created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES community_comments(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE community_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, post_id)
);
```

### Scan Images (Sprint 1 — with R2 migration)
```sql
CREATE TABLE scan_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_session_id UUID REFERENCES scan_sessions(id) ON DELETE CASCADE,
    storage_backend VARCHAR(20) DEFAULT 'r2',
    storage_key VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    file_size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_scan_images_session ON scan_images(scan_session_id);
```

### Search Analytics (Sprint 5)
```sql
CREATE TABLE search_queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query_text VARCHAR(500) NOT NULL,
    result_count INTEGER,
    clicked_result_id VARCHAR(100),
    search_type VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### A/B Experiments (Sprint 6)
```sql
CREATE TABLE ab_experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    variants JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ab_assignments (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ab_experiments(id),
    user_id INTEGER REFERENCES users(id),
    variant VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(experiment_id, user_id)
);
```

---

## D4. Database Performance

### Changes
1. Enable `pg_trgm` extension for fuzzy text search on product names
2. Add materialized view for dashboard aggregations:
   ```sql
   CREATE MATERIALIZED VIEW user_dashboard_stats AS
   SELECT user_id,
          COUNT(*) as total_scans,
          AVG(overall_score) as avg_score,
          MAX(created_at) as last_scan_date
   FROM scan_sessions s
   JOIN skin_analyses a ON a.scan_session_id = s.id
   WHERE s.status = 'COMPLETED'
   GROUP BY user_id;
   ```
3. Add connection pool monitoring: expose pool stats in `/api/health`
4. Configure statement timeout: `SET statement_timeout = '8s'`
5. Add `EXPLAIN ANALYZE` logging for queries > 500ms (already have slow query logger)
6. Add partial indexes for common filtered queries:
   ```sql
   CREATE INDEX idx_scans_completed ON scan_sessions(user_id, created_at) WHERE status = 'COMPLETED';
   CREATE INDEX idx_shelf_active ON shelf_products(user_id) WHERE status = 'active';
   CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;
   ```

---

## Migration Order
1. Alembic setup + baseline (Sprint 1, Week 1)
2. Schema fixes for existing tables (Sprint 1, Week 2)
3. scan_images table + R2 migration (Sprint 1-2)
4. AI chat tables (Sprint 2)
5. Performance indexes + materialized views (Sprint 2)
6. Gamification tables (Sprint 5)
7. Community tables (Sprint 5)
8. A/B experiment tables (Sprint 6)
