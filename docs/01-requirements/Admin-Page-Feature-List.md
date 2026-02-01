# Admin Page – Feature List & Requirements

**Date:** February 2026  
**Status:** Proposed (to implement)

---

## Current Admin Capabilities (Already Exists)

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Dashboard | ✅ | Summary: users, scans, products, routines, snapshots |
| Manage Users | ✅ | List, search, update (is_active, is_admin, is_verified) |
| Manage Products | ✅ | CRUD for legacy products table |
| Catalog Admin | ✅ | Catalog DB management |
| Seed Database | ✅ | Background job to import data |
| Populate Ingredients | ✅ | Manual ingredient insert |
| SCIN Data Upload/Import | ✅ | Dataset import |

---

## Proposed Admin Features (Your Requirements)

### 1. **Content Management – Blogs**

| Task | Description | Priority |
|------|-------------|----------|
| Upload/Create Blog | Admin adds new blog post: title, excerpt, content (rich text or markdown), cover image, read time, publish date | **High** |
| Edit Blog | Update existing posts | **High** |
| Delete Blog | Remove a post | **High** |
| Draft/Publish | Save as draft; publish when ready | Medium |
| Reorder Blogs | Control display order on /blog page | Low |

**Result:** Blog posts appear on `/blog` page without editing website code.

---

### 2. **Content Management – Videos**

| Task | Description | Priority |
|------|-------------|----------|
| Upload/Add Video | Admin adds video: title, description, video URL (YouTube/Vimeo/self-hosted), thumbnail URL, duration, difficulty (Beginner/Intermediate/Advanced) | **High** |
| Edit Video | Update existing videos | **High** |
| Delete Video | Remove a video | **High** |
| Reorder Videos | Control display order on /tutorials page | Low |

**Result:** Videos appear on `/tutorials` (Video Tutorials) page without editing website code.

---

### 3. **Content Management – News / Announcements**

| Task | Description | Priority |
|------|-------------|----------|
| Add News Item | Title, short text, link (optional), date, featured (yes/no) | **High** |
| Edit/Delete News | Update or remove news items | **High** |
| Display Location | Homepage banner, dedicated news section, or both | Medium |

**Result:** News/announcements appear on site (e.g. homepage, About) without code changes.

---

### 4. **User Monitoring**

| Task | Description | Priority |
|------|-------------|----------|
| Registered Users Count | ✅ Already exists in admin summary | Done |
| User List with Search | ✅ Already exists | Done |
| New Signups (last 7/30 days) | Chart or count of new users by period | **High** |
| Active Users (recent login/scan) | Users active in last 7/30 days | **High** |
| User Detail View | Click user → see profile, scans, routines, last activity | Medium |
| Export Users | CSV/Excel export (with consent/GDPR) | Low |

---

### 5. **Traffic & Analytics**

| Task | Description | Priority |
|------|-------------|----------|
| Page Views | Count views per page (needs analytics integration) | **High** |
| Scan Count | ✅ Already in admin summary | Done |
| Traffic Over Time | Simple chart: scans, signups, or page hits by day/week | **High** |
| Popular Pages | Which pages get most visits | Medium |
| Integration Options | Use existing: Railway logs, or add: Google Analytics, Plausible, or custom events table | — |

**Note:** Full traffic analytics usually requires an external tool (GA, Plausible, Umami) or a custom events table.

---

### 6. **Admin Navigation & Layout**

| Task | Description | Priority |
|------|-------------|----------|
| Admin Sidebar/Menu | Single admin layout with sections: Dashboard, Users, Products, Blogs, Videos, News, Analytics | **High** |
| Breadcrumbs | Admin breadcrumbs for deep pages | Low |
| Quick Stats on Dashboard | Users, scans, blogs count, recent activity | **High** |

---

### 7. **File/Media Storage**

| Task | Description | Priority |
|------|-------------|----------|
| Image Upload (Blog cover, thumbnails) | Store in Cloudinary, S3, or similar | **High** |
| Video Storage | Prefer external URLs (YouTube, Vimeo) to avoid large storage; optional: self-hosted uploads | **High** |
| File Size Limits | Limit upload size (e.g. 5MB for images) | Medium |

---

### 8. **Security & Access**

| Task | Description | Priority |
|------|-------------|----------|
| Admin-Only Access | ✅ Only users with `is_admin=true` can access /admin | Done |
| Audit Log | Optional: log admin actions (who did what, when) | Low |

---

## Suggested Implementation Order

### Phase 1 – Content Management (Core)
1. **Blogs** – DB table, API, Admin UI, BlogPage fetches from API  
2. **Videos** – DB table, API, Admin UI, VideoTutorialsPage fetches from API  
3. **News** – DB table, API, Admin UI, optional homepage section  

### Phase 2 – Monitoring & Analytics
4. **User stats** – New signups, active users (extend admin summary)  
5. **Traffic** – Basic analytics (e.g. custom events table or GA integration)  

### Phase 3 – Polish
6. **Admin layout** – Sidebar, consolidated navigation  
7. **Media upload** – Cloudinary/S3 integration for images  

---

## Database Tables (New)

| Table | Purpose |
|-------|---------|
| `blogs` | id, title, slug, excerpt, content, cover_image_url, read_time_min, published_at, created_at, updated_at |
| `videos` | id, title, description, video_url, thumbnail_url, duration_sec, difficulty, sort_order, created_at, updated_at |
| `news` | id, title, body, link_url, published_at, is_featured, created_at, updated_at |
| `analytics_events` (optional) | id, event_type, page_path, user_id, created_at |

---

## Summary – Admin Can Do (Full List)

1. ✅ **Users** – View, search, edit (active/admin/verified)  
2. ✅ **Products** – CRUD for products  
3. ✅ **Catalog** – Manage product catalog  
4. ✅ **Database** – Seed, populate ingredients, import datasets  
5. 🔲 **Blogs** – Create, edit, delete; appear on /blog  
6. 🔲 **Videos** – Add, edit, delete; appear on /tutorials  
7. 🔲 **News** – Add, edit, delete; show on homepage or news section  
8. 🔲 **User Stats** – New signups, active users over time  
9. 🔲 **Traffic** – Page views, popular pages (via analytics)  
10. 🔲 **Media** – Upload images for blogs/videos (Cloudinary/S3)  

---

**Next Step:** Confirm this list and priorities, then implement Phase 1 (Blogs, Videos, News).
