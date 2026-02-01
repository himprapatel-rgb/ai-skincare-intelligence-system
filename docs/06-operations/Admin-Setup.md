# Admin Page Setup

How to log in to the Admin page (`/admin`) on pellicura.com.

---

## Requirements

Admin access needs **both** of these:

| Requirement | Description |
|-------------|-------------|
| 1. Database | Your user must have `is_admin = true` in the `users` table |
| 2. Allowlist | Your email must be in the `ADMIN_EMAIL_ALLOWLIST` environment variable |

---

## Step 1: Set `ADMIN_EMAIL_ALLOWLIST` in Railway

1. Go to [Railway Dashboard](https://railway.app) → your **backend** service
2. Open **Variables**
3. Add or edit:
   - **Name:** `ADMIN_EMAIL_ALLOWLIST`
   - **Value:** your email (same as Google Sign-In), e.g. `you@gmail.com`
4. For multiple admins, use comma-separated: `admin1@gmail.com,admin2@gmail.com`
5. Railway will redeploy automatically when variables change

---

## Step 2: Promote your user in the database

Your account must exist in the database before promoting. Sign in once with Google so the user record is created.

### Option A: Run the script (recommended)

From your machine, with `DATABASE_URL` set from Railway:

**Windows (PowerShell):**
```powershell
cd backend
$env:DATABASE_URL = "postgresql://user:pass@host:port/dbname"  # Copy from Railway
python scripts/promote_admin.py you@gmail.com
```

**Windows (Command Prompt):**
```cmd
cd backend
set DATABASE_URL=postgresql://user:pass@host:port/dbname
python scripts\promote_admin.py you@gmail.com
```

**Or use the batch file:**
```cmd
cd backend\scripts
REM Edit promote_admin.bat and set DATABASE_URL, then run:
promote_admin.bat you@gmail.com
```

**Linux/macOS:**
```bash
cd backend
export DATABASE_URL="postgresql://user:pass@host:port/dbname"  # Copy from Railway
python scripts/promote_admin.py you@gmail.com
```

### Option B: Run SQL directly in Railway

1. Railway → your **PostgreSQL** (main DB) service
2. Open **Data** tab or connect with a PostgreSQL client
3. Run:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'you@gmail.com';
   ```

---

## Step 3: Log out and log back in

1. Open pellicura.com and sign out
2. Sign in again with Google
3. The **Admin** link should appear in the navigation (header and mobile menu)

---

## Quick check

| When logged in as regular user | When logged in as admin |
|-------------------------------|-------------------------|
| Nav: Home, Skin Analysis, Dashboard, Digital Twin, About | Nav: Home, Skin Analysis, Dashboard, Digital Twin, About, **Admin** |

---

## Testing: Make all users admin

For temporary testing, you can:

1. **Database:** Promote all users to admin:
   ```bash
   cd backend
   python scripts/promote_admin.py --all
   ```

2. **Railway:** Set `ADMIN_EMAIL_ALLOWLIST=*` in Variables (any user with `is_admin=true` can access).

3. **Revert after testing:** Change `ADMIN_EMAIL_ALLOWLIST` back to specific emails. To revoke admin from a user, run SQL: `UPDATE users SET is_admin = false WHERE email = '...'`.

---

## Don't see Admin?

**Checklist:**

1. **Promote your user** — Run `python scripts/promote_admin.py your@email.com` with `DATABASE_URL` set, or run `UPDATE users SET is_admin = true WHERE email = 'your@email.com'` in Railway PostgreSQL.
2. **Set allowlist** — In Railway → backend → Variables, add `ADMIN_EMAIL_ALLOWLIST` = `your@email.com` (or `*` for testing).
3. **Use the right account** — Log in with the same email you promoted (e.g. `himanshu@test.com` for test user, or your Google email).
4. **Refresh the page** — Or log out and log back in so the app fetches your updated user data.

**Try accessing `/admin` directly** — If you've done steps 1–2, go to `pellicura.com/admin`. If you get "Admin access denied", the backend is blocking (check allowlist). If the page loads, you're admin (the nav link should appear after a refresh).

---

## Regular users can't log in

**Symptom:** User gets "Email not verified" or "Please verify your email to sign in."

**Cause:** Verification emails never arrived (SMTP not configured, went to spam, etc.).

**Fix:** Use the internal verify-user API to manually verify them:

```bash
curl -X POST "https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/internal/verify-user" \
  -H "Content-Type: application/json" \
  -H "X-SUMMARY-TOKEN: YOUR_TOKEN" \
  -d '{"email": "user@example.com"}'
```

Replace `user@example.com` with their email. Requires `SUMMARY_TOKEN` set in Railway.

---

## Test user login (himanshu@test.com)

If you can't log in with `himanshu@test.com` / `Test1234!`:

### Option A: Fix via API (no local DB access)

1. In Railway → backend → **Variables**, add `SUMMARY_TOKEN` (any secret string, e.g. a random 32-char value).
2. Call the fix endpoint (replace `YOUR_TOKEN` and `YOUR_BACKEND_URL`):

```bash
curl -X POST "https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/internal/fix-test-user" \
  -H "X-SUMMARY-TOKEN: YOUR_TOKEN"
```

3. Check database status:

```bash
curl "https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/internal/db-status" \
  -H "X-SUMMARY-TOKEN: YOUR_TOKEN"
```

Returns: `database`, `user_count`, `test_user_exists`, `test_user_verified`, `test_user_active`.

### Option B: Fix via local script (with DATABASE_URL)

1. **Check the user:** Run `python scripts/check_user.py` (with `DATABASE_URL` set).
2. **Create or fix the user:** Run `python scripts/verify_test_user.py`.
3. **Get DATABASE_URL:** Railway → PostgreSQL → Variables → copy the URL.

**Windows:** Use `backend\scripts\check_user.bat` and `backend\scripts\verify_test_user.bat`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Admin access is not configured" | Add `ADMIN_EMAIL_ALLOWLIST` in Railway Variables |
| "Admin access denied" | Ensure your email is in `ADMIN_EMAIL_ALLOWLIST` and `is_admin=true` in DB |
| No Admin link in nav | Refresh the page or log out and log back in |
| User not found when running script | Sign in once so the user record exists, then run the script |
| `DATABASE_URL is not configured` | Set `DATABASE_URL` env var from Railway dashboard (PostgreSQL → Variables → Copy) |

---

## Admin routes

Once logged in as admin, you can access:

- `/admin` — Dashboard (summary stats)
- `/admin/content` — **Upload blogs & videos** (tabbed: Blogs, Videos, News)
- `/admin/users` — Manage users
- `/admin/products` — Manage products
- `/admin/catalog` — Catalog admin

---

## Upload blogs & videos

1. Go to **Admin** → **Manage Content** (or `/admin/content`)
2. Use the **Blogs** tab to add blog posts — title, excerpt, content, cover image (1200×630px). Paste a URL or click **Upload** to upload an image.
3. Use the **Videos** tab to add video tutorials — title, video URL (YouTube/Vimeo), thumbnail (1280×720px). Paste a URL or click **Upload** for the thumbnail.
4. Use the **News** tab to add news items for the homepage.

**Image sizes:**
- Blog cover: 1200×630px recommended
- Video thumbnail: 1280×720px recommended
