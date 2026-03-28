---
globs:
  - "backend/**/*.py"
---

# Backend Development Rules

## Code Patterns
- Settings: `from app.config import settings`
- DB sessions: `get_db()` dependency injection, never create sessions manually
- Auth: `get_current_user` for protected endpoints, `get_current_user_optional` for mixed
- Always use `Optional[Type]` from typing, not `Type | None` (Python 3.9 compatibility)
- Use `List[Type]` not `list[Type]` for the same reason

## Database Rules
- **Two databases exist**: main DB (users/scans) via `DATABASE_URL`, product catalog via `PRODUCT_DATABASE_URL`
- Never mix database sessions between the two
- Product price column is `price_usd`, NOT `price`
- Blog model is `Blog` in `app.models.content`, NOT `BlogPost`
- SkinGoal uses `is_active` (Boolean), NOT `status` (doesn't exist)
- Always use SQLAlchemy ORM, never raw SQL strings

## Security
- File uploads: validate magic bytes, use UUID filenames
- Refresh tokens: set as httpOnly cookies via `_set_refresh_cookie()`
- SECRET_KEY: fails fast in production/staging if using default
- All new endpoints need `get_current_user` unless explicitly public
- Never log PII (emails, tokens) in production

## API Design
- All routes under `/api/v1/`
- Register new routers in `app/main.py`
- Use Pydantic schemas for request/response validation
- Return proper HTTP status codes (201 for creation, 204 for deletion)

## Testing
- Run before committing: `cd backend && python -m pytest tests/ -x`
- Mock OpenAI calls in unit tests
- Use pytest fixtures for database setup
