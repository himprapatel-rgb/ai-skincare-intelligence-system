# Database Audit

**Purpose:** Check both main and product databases for table counts, empty tables, and profile picture persistence.

---

## Run the audit

```bash
cd backend
# Set DATABASE_URL (and optionally PRODUCT_DATABASE_URL) from Railway
python scripts/audit_databases.py
```

**Windows:**
```cmd
cd backend
set DATABASE_URL=postgresql://user:pass@host:port/dbname
python scripts\audit_databases.py
```

---

## What it checks

1. **Main database** – All tables and row counts
2. **Product catalog database** – If separate, all catalog_* tables
3. **Profile picture** – How many `user_profiles` have `profile_photo_url` set

---

## Empty tables – expected vs unexpected

| Table | Expected | Why |
|-------|----------|-----|
| `users` | Has rows | User accounts. Empty = no sign-ups |
| `user_profiles` | May be empty | Created on onboarding. Empty if users skipped |
| `user_profiles.profile_photo_url` | May be empty | Set when user uploads photo in Profile Settings and clicks Save |
| `policy_versions` | Has rows | Seeded at startup |
| `scan_sessions` | May be empty | Populated when users do face scans |
| `shelf_products` | May be empty | My Shelf – empty if no products saved |
| `blogs`, `videos`, `news_items` | May be empty | Admin content – add via /admin/content |
| `catalog_products` | May be empty | Product catalog – run `import_obf_catalog.py` to seed |
| `catalog_ingredients`, etc. | May be empty | Populated when catalog is seeded |

---

## Profile picture not saving

**Symptom:** User uploads profile photo but it doesn't persist after refresh.

**Root cause (fixed):** ProfileSettingsPage was not calling the backend. It only updated local React state.

**Fix applied:**
- `POST /api/v1/profile/upload-photo` – Upload image, returns URL
- ProfileSettingsPage now: (1) uploads file to this endpoint, (2) includes `profile_photo_url` in PATCH on Save
- Backend stores URL in `user_profiles.profile_photo_url`

**Flow:** Upload photo → Click **Save** → PATCH /profile with profile_photo_url → persisted.
