# Backend Services

All business logic lives in `backend/app/services/`. Services are imported by routers and handle data processing, external API calls, and complex operations.

---

## 21 Services

### 1. Auth Service (`auth_service.py`)
**Purpose**: User authentication and password management
- `hash_password(password)` → Argon2id hash
- `verify_password(hashed, password)` → constant-time verification
- `create_user(db, user_data)` → create user with hashed password
- `get_user_by_email(db, email)` → lookup user

### 2. OpenAI Vision Service (`openai_vision_service.py`)
**Purpose**: Skin analysis via GPT-4V
- `OpenAIVisionClient.analyze_skin_image(base64_image, signals)` → structured analysis
- Model: GPT-4V (vision)
- Timeout: 60s (configurable)
- Output: SkinAnalysis schema (scores, concerns, zones, recommendations)
- 10 signals: acne, redness, pigmentation, dehydration, sensitivity, wrinkles, pores, dark_circles, texture, oiliness

### 3. AI Intelligence Service (`ai_intelligence_service.py`)
**Purpose**: All GPT-4o-mini powered AI features
- `ai_recommend_products(skin_type, concerns, products, budget)` → ranked products
- `ai_generate_routine(skin_type, concerns, goals)` → AM/PM routine
- `ai_analyze_ingredients(ingredients)` → safety analysis
- `ai_generate_notifications(context)` → smart notifications
- `ai_curate_content(user_interests)` → personalized content
- `ai_predict_skin_future(current_state, routine, weeks)` → prediction
- `ai_compare_scans(before, after)` → comparison narrative
- `ai_detect_seasonal_trends(location)` → seasonal patterns
- `ai_rerank_search(query, results)` → re-ranked search results
- Caching: Redis-backed (when available)

### 4. Ingredient Safety Service (`ingredient_safety.py`)
**Purpose**: Ingredient hazard analysis
- `analyze_ingredients_list(ingredients)` → safety report
- Database: 200+ harmful ingredients with categories
- Severity levels: HIGH, MODERATE, LOW
- Categories: irritant, allergen, carcinogen, endocrine_disruptor, environmental_toxin, pregnancy_unsafe, sensitizer, comedogenic, drying

### 5. Ingredient Service (`ingredient_service.py`)
**Purpose**: Ingredient data management
- `normalize_ingredient_name(name)` → standardized name
- `get_or_create_ingredient(db, name, category)` → upsert
- `save_product_ingredients(db, product_id, ingredients)` → link to product
- `build_ingredients_snapshot(ingredients)` → snapshot for shelf

### 6. Product Catalog Service (`product_catalog.py`)
**Purpose**: Product catalog operations (separate DB)
- `lookup_barcode(barcode)` → product data
- `lookup_by_name_brand(name, brand)` → fuzzy match
- `search(query, category, brand, limit, offset)` → full-text search
- `add_from_scan(product_data)` → add from AI scan result
- `get_stats()` → category/brand/ingredient statistics
- Uses PostgreSQL full-text search (to_tsvector)

### 7. Email Service (`email_service.py`)
**Purpose**: Transactional emails via SMTP
- `send_verification_email(email, token)` → verification link
- `send_password_reset_email(email, token)` → reset link

### 8. Notification Service (`notification_service.py`)
**Purpose**: Notification management
- `get_user_settings(user_id)` → notification preferences
- `create_routine_reminder(user_id, routine_name, type)` → reminder
- `create_progress_milestone(user_id, milestone, score_change)` → progress
- `create_scan_complete(user_id, scan_id, score)` → completion notice

### 9. Digital Twin Service (`digital_twin_service.py`)
**Purpose**: Skin state tracking and analysis
- `build_snapshot_from_scan(scan)` → snapshot extraction
- `simulate_routine_impact(state, routine, weeks)` → simulation
- `detect_trends(snapshots, timeframe)` → trend detection

### 10. Twin Builder Service (`twin_builder_service.py`)
**Purpose**: Build and update digital twin snapshots

### 11. Simulation Service (`simulation_service.py`)
**Purpose**: Advanced skin state simulation
- `simulate_skin_state(state, routine, environment, days)` → simulated state

### 12. Google Auth Service (`google_auth_service.py`)
**Purpose**: Google OAuth integration
- `get_user_info(access_token)` → user profile from Google
- `verify_id_token(id_token)` → verify Google ID token

### 13. GPT Service (`gpt_service.py`)
**Purpose**: Generic GPT text completion
- `GPTService.chat(prompt)` → text response

### 14. ML Model Loader (`ml_model_loader.py`)
**Purpose**: Local ML model loading
- Load from disk (Railway volume) or download from URL
- SHA256 verification for model integrity

### 15. ML Service (`ml_service.py`)
**Purpose**: Local ML model inference wrapper

### 16. Skin Inference Service (`skin_inference.py`)
**Purpose**: Local ML inference (backend fallback)

### 17. External ML Service (`external_ml_service.py`)
**Purpose**: External ML API integration (e.g., Skinive API)

### 18. Open Beauty Facts Service (`open_beauty_facts_service.py`)
**Purpose**: Query Open Beauty Facts API
- Barcode lookup for cosmetic products
- Ingredient list extraction

### 19. Amazon Affiliate Service (`amazon_affiliate_service.py`)
**Purpose**: Amazon PA-API integration
- Product search on Amazon
- Affiliate link generation
- Uses: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG

---

## Core Modules (`backend/app/core/`)

### Security (`security.py`)
- `create_access_token(data, expires)` → JWT (HS256)
- `get_current_user(token)` → User (required auth)
- `get_current_user_optional(token)` → User | None (guest allowed)
- `get_current_admin(user)` → User (admin check)
- `encrypt_sensitive_data(value)` → AES-256 encrypted string
- `decrypt_sensitive_data(value)` → decrypted string
- `hash_password(password)` → Argon2id hash
- `verify_password(password, hash)` → boolean

### Rate Limiting (`rate_limit.py`)
- `check_login_rate_limit(email)` → boolean
- `record_login_attempt(email, success)` → track attempts
- Storage: Redis (if available) or in-memory

### Caching (`cache.py`)
- `cache_get(key)` → cached value
- `cache_set(key, value, ttl)` → store with TTL
- Backend: Redis (if available) or no-op

### Geolocation (`geo.py`)
- `fetch_geolocation(ip)` → country, city, lat/lon
- `get_client_ip(request)` → extract from headers

### Audit (`audit.py`)
- `log_profile_event(user_id, event_type, details)` → profile audit
- `log_scan_event(user_id, scan_id, event_type, details)` → scan audit

---

## Middleware Stack (`backend/middleware/`)

| Middleware | File | Purpose |
|-----------|------|---------|
| Request Tracing | `request_tracing.py` | Inject X-Correlation-ID |
| IP Geo Logging | `ip_geo_logging.py` | Record IP + geolocation per auth request |
| Performance Logging | `performance_logging.py` | Log slow requests (>1s), X-Response-Time header |
| Slow Query Logger | `slow_query_logger.py` | Monitor SQLAlchemy queries >500ms |
| Rate Limiter | `rate_limiter.py` | Per-IP rate limiting (configurable) |
