# Database Schema

## Architecture
- **Main Database** (`DATABASE_URL`): Users, scans, profiles, shelf, goals, notifications, digital twin, routines, chat
- **Product Catalog Database** (`PRODUCT_DATABASE_URL`): Products, ingredients, brands, categories

---

## Main Database Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| public_id | VARCHAR UNIQUE | UUID for external reference |
| email | VARCHAR UNIQUE | Login identifier |
| hashed_password | VARCHAR | Argon2id hash |
| full_name | VARCHAR | Display name |
| is_active | BOOLEAN | Account active |
| is_verified | BOOLEAN | Email verified |
| is_admin | BOOLEAN | Admin access |
| email_verification_token | VARCHAR | Verification token |
| email_verification_expires_at | TIMESTAMPTZ | Token expiry |
| last_ip_address | VARCHAR(45) | Last known IP |
| last_geolocation | JSONB | {country, region, city, lat, lon} |
| last_seen_at | TIMESTAMPTZ | Last activity |
| created_at | TIMESTAMPTZ | Registration date |
| updated_at | TIMESTAMPTZ | Last update |

**Relationships**: scan_sessions, skin_snapshots, profile, consents, access_logs

---

### user_profiles
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK UNIQUE | One-to-one with users |
| **Personal** | | |
| first_name, last_name | VARCHAR | |
| date_of_birth | DATE | |
| gender | VARCHAR | |
| location | VARCHAR | |
| timezone | VARCHAR | |
| phone_number | VARCHAR | |
| profile_photo_url | VARCHAR | |
| **Skin Profile** | | |
| skin_type | TEXT | **AES-256 encrypted** |
| skin_tone | VARCHAR | |
| skin_texture | VARCHAR | |
| pore_size | VARCHAR | |
| moisture_level | VARCHAR | |
| oil_production | VARCHAR | |
| sensitivity_level | VARCHAR | |
| primary_concern | VARCHAR | |
| secondary_concerns | JSONB | **AES-256 encrypted** |
| **Lifestyle** | | |
| sun_exposure | VARCHAR | |
| water_intake | INTEGER | glasses/day |
| sleep_hours | FLOAT | |
| diet_type | VARCHAR | |
| stress_level | VARCHAR | |
| exercise_frequency | VARCHAR | |
| smoking_status | VARCHAR | |
| alcohol_consumption | VARCHAR | |
| climate | VARCHAR | |
| **Medical** | | |
| known_allergies | JSONB | |
| current_medications | JSONB | |
| skin_conditions | JSONB | |
| previous_treatments | TEXT | |
| **Preferences** | | |
| preferred_ingredients | JSONB | |
| ingredients_to_avoid | JSONB | |
| product_texture_preference | VARCHAR | |
| fragrance_preference | VARCHAR | |
| budget_range | VARCHAR | |
| brand_preferences | JSONB | |
| goals | JSONB | **AES-256 encrypted** |
| **Settings** | | |
| email_notifications | BOOLEAN | |
| push_notifications | BOOLEAN | |
| profile_visibility | VARCHAR | private/public |
| profile_complete | BOOLEAN | |
| completion_percentage | INTEGER | |

---

### scan_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | INTEGER FK | Nullable (guest scans) |
| status | VARCHAR | PENDING / PROCESSING / COMPLETED / FAILED |
| image_url | VARCHAR | |
| image_data | BYTEA | Raw image (to be migrated to R2) |
| image_content_type | VARCHAR | |
| image_filename | VARCHAR | |
| image_hash | VARCHAR | Dedup check |
| scan_metadata | JSONB | Device info, lighting, etc. |
| error_message | TEXT | On failure |
| retry_count | INTEGER | |
| created_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |

**Indexes**: user_id, created_at, (user_id, created_at)
**Relationships**: analysis, outputs, conditions, recommendations

---

### skin_analyses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| scan_session_id | UUID FK | |
| skin_type | ENUM | normal/dry/oily/combination/sensitive |
| fitzpatrick_scale | INTEGER | 1-6 |
| overall_score | FLOAT | 0-100 |
| confidence_score | FLOAT | 0-1 |
| analysis_data | JSONB | Full structured result |
| model_version | VARCHAR | GPT-4V version |
| created_at | TIMESTAMPTZ | |

---

### products (Main DB)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| brand | VARCHAR | |
| name | VARCHAR | |
| category | VARCHAR | |
| upc | VARCHAR | Barcode |
| size_ml | FLOAT | |
| primary_concerns | JSONB | |
| skin_types | JSONB | |
| is_fragrance_free | BOOLEAN | |
| is_vegan | BOOLEAN | |
| is_cruelty_free | BOOLEAN | |
| average_rating | FLOAT | |
| price_usd | FLOAT | |
| product_image_url | VARCHAR | |

**Indexes**: brand, name, upc, category

---

### ingredients
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name_inci | VARCHAR UNIQUE | INCI standard name |
| common_names | JSONB | |
| category | VARCHAR | |
| function | VARCHAR | |
| safety_category | VARCHAR | |
| safety_rating | FLOAT | |
| comedogenic_rating | INTEGER | |
| microbiome_impact | VARCHAR | |
| is_antimicrobial | BOOLEAN | |
| fda_approved | BOOLEAN | |
| eu_approved | BOOLEAN | |

---

### shelf_products
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| product_id | UUID FK | Nullable |
| external_product_id | VARCHAR | For external products |
| product_name | VARCHAR | |
| product_brand | VARCHAR | |
| status | VARCHAR | active/finished/discontinued/wishlist |
| rating | FLOAT | |
| notes | TEXT | |
| routine_type | VARCHAR | am/pm/both |
| routine_order | INTEGER | |
| purchase_date | DATE | |
| expiry_date | DATE | |
| ingredients_json | JSONB | Snapshot at time of add |
| times_repurchased | INTEGER | |

**Indexes**: (user_id, status), created_at, routine_type

---

### skin_goals
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| goal_type | VARCHAR | anti_aging, hydration, etc. |
| title | VARCHAR | |
| priority | INTEGER | |
| target_date | DATE | |
| progress_percentage | FLOAT | |
| is_completed | BOOLEAN | |
| baseline_value | FLOAT | |
| target_value | FLOAT | |
| current_value | FLOAT | |
| milestones | JSONB | |

---

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| type | VARCHAR | reminder/progress/alert/info/recommendation/system |
| title | VARCHAR | |
| message | TEXT | |
| action_url | VARCHAR | |
| read | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

---

### Digital Twin Tables

**skin_state_snapshots**: id, user_id, scan_session_id, overall_health_score, hydration_level, oil_level, sensitivity_score, acne_severity, wrinkle_severity, pigmentation_severity, redness_severity, ml_model_version, confidence_score, snapshot_date

**skin_region_states**: id, snapshot_id, region_name, region_type, texture_score, acne_severity, redness_level, pigmentation_level, oil_level, hydration_level, sensitivity_score, heatmap_url, bounding_box (JSONB), concerns (JSONB)

**environment_snapshots**: Environmental conditions (temperature, humidity, UV, pollution)

**routine_instances**: Routine usage tracking

**routine_product_usages**: Product usage within routines

---

### Other Tables

| Table | Purpose |
|-------|---------|
| user_consents | GDPR consent records (terms, privacy, version, IP) |
| user_access_logs | Login IP/geolocation audit trail |
| policy_versions | Terms/privacy policy versions |
| user_favorites | Favorite products (internal + external) |
| saved_routines | Saved AM/PM routines |
| progress_photos | Before/after photos linked to routines |
| product_reviews | User product reviews (1-5 rating) |
| product_ingredients | Junction: product ↔ ingredient with order |
| scan_outputs | Raw + normalized AI analysis results |
| scan_conditions | Per-scan condition findings |
| scan_recommendations | Per-scan recommendations |
| product_recommendations | AI product recommendations per scan |
| notification_settings | Per-user notification preferences |
| blogs | Blog posts (admin-managed) |
| videos | Video tutorials (admin-managed) |
| news_items | News/updates (admin-managed) |

---

### Engagement Tables

| Table | Purpose |
|-------|---------|
| product_scan_sessions | Product barcode scan sessions |
| product_scan_items | Matched products from scans |
| routine_recommendations | AI routine suggestions |
| routine_checkins | Routine completion tracking |
| user_notifications | Multi-channel notifications (push/SMS/email) |

---

## Encryption

Fields encrypted with AES-256 (Fernet):
- `user_profiles.skin_type`
- `user_profiles.secondary_concerns`
- `user_profiles.goals`

Encrypted at write, decrypted at read via `encrypt_sensitive_data()` / `decrypt_sensitive_data()` in `app/core/security.py`.

---

## Key Relationships

```
User (1) ──→ (1) UserProfile
User (1) ──→ (N) ScanSession ──→ (1) SkinAnalysis
User (1) ──→ (N) ShelfProduct
User (1) ──→ (N) UserFavorite
User (1) ──→ (N) SkinGoal
User (1) ──→ (N) Notification
User (1) ──→ (N) SkinStateSnapshot ──→ (N) SkinRegionState
User (1) ──→ (N) SavedRoutine
User (1) ──→ (N) UserConsent
Product (1) ──→ (N) ProductIngredient ──→ (1) Ingredient
Product (1) ──→ (N) ProductReview
```
