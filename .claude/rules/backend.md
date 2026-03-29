---
globs:
  - "backend/**/*.py"
---

# Backend Development Rules — STRICT

## NEVER DO
- NEVER use `Type | None` syntax — use `Optional[Type]` (Python 3.9 compat)
- NEVER use `list[Type]` — use `List[Type]` from typing
- NEVER use `dict[str, Any]` — use `Dict[str, Any]`
- NEVER use `Product.price` — column is `price_usd`
- NEVER use `BlogPost` — model is `Blog` in `app.models.content`
- NEVER use `SkinGoal.status` — field is `is_active` (Boolean)
- NEVER import from `content_models` — use `app.models.content`
- NEVER use relative imports (`from services import...`) — use `from app.services import...`
- NEVER mix main DB and product catalog DB sessions
- NEVER store file uploads with user-supplied filenames — use UUID
- NEVER accept file uploads without magic-byte validation
- NEVER log PII (emails, tokens, passwords) in production
- NEVER return refresh tokens in response body only — set as httpOnly cookie
- NEVER skip `get_current_user` on authenticated endpoints

## ALWAYS DO
- ALWAYS use `from app.config import settings` for configuration
- ALWAYS use `get_db()` dependency injection for database sessions
- ALWAYS use Pydantic schemas for request/response validation
- ALWAYS validate magic bytes on file uploads (JPEG: \xff\xd8\xff, PNG: \x89PNG)
- ALWAYS use UUID-based filenames for uploads via `_safe_filename()`
- ALWAYS set refresh tokens as httpOnly cookies via `_set_refresh_cookie()`
- ALWAYS run `python -m pytest tests/ -x` before committing
- ALWAYS use `Optional[Type]` from typing, not `Type | None`
- ALWAYS register new routers in `app/main.py`
- ALWAYS add `category`, `tags`, `view_count` to BlogResponse (they exist in DB)

## Database Gotchas
- **Two databases**: main DB (`DATABASE_URL`) + product catalog (`PRODUCT_DATABASE_URL`)
- Product model: `price_usd` NOT `price`
- Blog model: `Blog` in `app.models.content` NOT `BlogPost` in `content_models`
- SkinGoal: `is_active` (Boolean) NOT `status` (doesn't exist)
- Scan upload: magic-byte validation + UUID filename + image hash
- `ProductEffectiveness` table: auto-tracked after every scan via `auto_track_effectiveness()`
- Blog endpoints: `/content/blogs/{id}` (numeric) AND `/content/blogs/by-slug/{slug}` (string)

## Auth System
- Login: returns access token in body + sets refresh token as httpOnly cookie
- Refresh: reads from cookie OR body (backwards compatible)
- Logout: blacklists access token + clears httpOnly cookie
- `_set_refresh_cookie()` sets: httpOnly=True, Secure=(not dev), SameSite=lax, path=/api/v1/auth
- SECRET_KEY: crashes at startup in production/staging if using default value

## AI Services
- All AI calls go through `_call_openai_json()` with response validation
- `_validate_response()` ensures required fields + clamps score fields to 0-100
- Simulation effects are FRACTIONAL (0.05 = 5% of current score), NOT raw multipliers
- Ingredient matching uses word-boundary regex, NOT substring matching
- Confidence calculation factors in both data quantity AND time span
- Smart recommendations: 5-signal scoring (AI 35%, effectiveness 25%, community 20%, shelf 10%, scan 10%)

## API Design
- All routes under `/api/v1/`
- CORS: methods restricted to GET/POST/PUT/PATCH/DELETE/OPTIONS
- CORS: headers restricted to Authorization/Content-Type/Accept/X-Requested-With
- Rate limiting: in-memory (per-worker) — needs Redis for production
- Cache headers: catalog 300s, user endpoints 120s

## Blog Agent
- `auto_generate_daily_article()` — generates 1 article/day if none exists today
- Even days: data-driven from scan trends; odd days: marketing from 30-topic rotation
- Cover images from curated Unsplash URLs by category
- Admin trigger: `POST /admin/generate-articles?count=3`

## Testing
- Run before commit: `cd backend && python -m pytest tests/ -x`
- Test images MUST have JPEG magic bytes: `b"\xff\xd8\xff\xe0" + b"\x00" * 100`
- Mock OpenAI calls in unit tests
- Use pytest fixtures for database setup
- Coverage target: 50% minimum (aim for 70%+)
