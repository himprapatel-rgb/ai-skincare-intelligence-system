# Web App – Data Saved to Database

**Purpose:** List everything the web app saves to the database, which tables store it, and how to verify.

---

## Summary Table

| Frontend action | API endpoint | Database | Table(s) | Verified |
|-----------------|--------------|----------|----------|----------|
| Register | POST /auth/register | Main | `users` | |
| Google sign-in | POST /auth/google | Main | `users` | |
| Verify email | POST /auth/verify-email | Main | `users` | |
| Password reset | POST /auth/password-reset/confirm | Main | `users` | |
| Onboarding / baseline profile | POST /profile/baseline | Main | `user_profiles` | |
| Profile update | PUT /profile/me | Main | `user_profiles` | |
| Consent (accept/record/decline) | POST /consent/* | Main | `user_consents`, `policy_versions` | |
| Start skin scan | POST /scan/init | Main | `scan_sessions` | |
| Upload scan image | POST /scan/{id}/upload | Main | `scan_sessions`, `skin_analyses` | |
| Add to shelf | POST /shelf | Main | `shelf_products` | |
| Update shelf product | PATCH /shelf/{id} | Main | `shelf_products` | |
| Remove from shelf | DELETE /shelf/{id} | Main | `shelf_products` | |
| Add to favorites | POST /favorites | Main | `user_favorites` | |
| Remove from favorites | DELETE /favorites/{id} | Main | `user_favorites` | |
| Add skin goal | POST /goals | Main | `skin_goals` | |
| Save routine | POST /routines, PUT /routines/{id} | Main | `saved_routines`, `routine_products` | |
| Mark notification read | PATCH /notifications/{id}/read | Main | `notifications` | |
| Mark all read | PATCH /notifications/read-all | Main | `notifications` | |
| Delete notification | DELETE /notifications/{id} | Main | `notifications` | |
| Submit product review | POST /products/{id}/reviews | Main | `product_reviews` (products DB) | |
| Admin: Create/update blog | POST/PATCH /admin/blogs | Main | `blogs` | |
| Admin: Create/update video | POST/PATCH /admin/videos | Main | `videos` | |
| Admin: Create/update news | POST/PATCH /admin/news | Main | `news_items` | |
| Admin: Delete content | DELETE /admin/blogs|videos|news | Main | `blogs`, `videos`, `news_items` | |
| Admin: Upload image | POST /admin/upload-image | File system | `backend/uploads/` | |
| Admin: Update user | PATCH /admin/users/{id} | Main | `users` | |
| Admin: Create/update product | POST/PATCH /admin/products | Main | `products` | |
| Admin: Delete product | DELETE /admin/products/{id} | Main | `products` | |

---

## Not Saved to Database (LocalStorage Only)

| Feature | Storage | Notes |
|---------|---------|-------|
| Recommendations "Add to favorites" | `localStorage.favorites` | Different from `/favorites` API. FavoritesPage uses API. |
| Analysis results "Save to favorites" | `localStorage.favorite_analyses` | Analysis IDs only; no API call. |
| Data export | Fetches from API + merges localStorage favorites | Export includes localStorage data in JSON. |

---

## Main Database Tables (DATABASE_URL)

| Table | Model | Written by |
|-------|-------|------------|
| `users` | User | auth, admin |
| `user_profiles` | UserProfile | profile |
| `user_consents` | UserConsent | consent |
| `policy_versions` | PolicyVersion | consent |
| `scan_sessions` | ScanSession | scan |
| `skin_analyses` | SkinAnalysis | scan |
| `shelf_products` | ShelfProduct | shelf |
| `user_favorites` | UserFavorite | favorites |
| `skin_goals` | SkinGoal | goals |
| `saved_routines` | SavedRoutine | routines |
| `routine_products` | RoutineProduct | routines |
| `notifications` | Notification | notifications |
| `blogs` | Blog | admin content |
| `videos` | Video | admin content |
| `news_items` | NewsItem | admin content |

---

## Product Database Tables (PRODUCT_DATABASE_URL or main if not set)

| Table | Model | Written by |
|-------|-------|------------|
| `products` | Product | admin, auto-save from scan |
| `product_reviews` | ProductReview | products router |
| `ingredients` | Ingredient | admin, imports |
| `product_ingredients` | ProductIngredient | admin |
| `catalog_products` | CatalogProduct | catalog admin, imports |
| `catalog_ingredients` | CatalogIngredient | catalog |
| `catalog_brands` | CatalogBrand | catalog |

---

## How to Verify in Database

1. **Railway** → PostgreSQL (main) → **Data** or **Query**
2. Run the verification script:
   ```bash
   cd backend
   set DATABASE_URL=postgresql://...   # From Railway
   python scripts/verify_database_tables.py
   ```
   Or on Windows: `backend\scripts\verify_database_tables.bat` (after setting DATABASE_URL)

### Quick SQL checks (main DB)

```sql
-- User count
SELECT COUNT(*) FROM users;

-- Shelf products
SELECT COUNT(*) FROM shelf_products;

-- Favorites
SELECT COUNT(*) FROM user_favorites;

-- Scans
SELECT COUNT(*) FROM scan_sessions;

-- Goals
SELECT COUNT(*) FROM skin_goals;

-- Routines
SELECT COUNT(*) FROM saved_routines;

-- Content (blogs, videos, news)
SELECT (SELECT COUNT(*) FROM blogs) AS blogs,
       (SELECT COUNT(*) FROM videos) AS videos,
       (SELECT COUNT(*) FROM news_items) AS news;
```
