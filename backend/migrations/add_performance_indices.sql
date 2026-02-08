-- Performance indices for backend stability
-- Task: Add DB index audit for hot tables (stability task #65-80)

-- Scan sessions indices
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_created_at ON scan_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_created ON scan_sessions(user_id, created_at DESC);

-- Notifications indices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Shelf products indices
CREATE INDEX IF NOT EXISTS idx_shelf_products_user_id ON shelf_products(user_id);
CREATE INDEX IF NOT EXISTS idx_shelf_products_status ON shelf_products(status);
CREATE INDEX IF NOT EXISTS idx_shelf_products_user_status ON shelf_products(user_id, status);

-- User favorites indices
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);

-- User progress snapshots indices
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_id ON user_progress_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_created ON user_progress_snapshots(created_at DESC);

-- Scan outputs indices
CREATE INDEX IF NOT EXISTS idx_scan_outputs_scan_session_id ON scan_outputs(scan_session_id);

-- User profiles index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- User access logs indices
CREATE INDEX IF NOT EXISTS idx_user_access_logs_user_id ON user_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_created ON user_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_user_created ON user_access_logs(user_id, created_at DESC);

-- Routine checkins indices
CREATE INDEX IF NOT EXISTS idx_routine_checkins_user_id ON routine_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_checkins_created ON routine_checkins(created_at DESC);

-- Saved routines indices
CREATE INDEX IF NOT EXISTS idx_saved_routines_user_id ON saved_routines(user_id);

-- User consent indices
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);

-- Products indices (product DB - may need separate migration)
-- CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
-- CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Ingredients indices (product DB)
-- CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- Product ingredients composite index (product DB)
-- CREATE INDEX IF NOT EXISTS idx_product_ingredients_composite ON product_ingredients(product_id, ingredient_id);
