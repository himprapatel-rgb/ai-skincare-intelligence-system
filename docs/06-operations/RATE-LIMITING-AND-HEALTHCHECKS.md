# Rate Limiting and Health Checks

**Last updated:** February 2026

---

## Health checks (Railway)

The backend exposes:

- **`GET /api/health`** – Detailed status (main DB, product DB, latency). Returns 200 when healthy.
- **`GET /api/health/ready`** – Readiness probe: 200 only if the main database is reachable. Use this for Railway’s health check so traffic is not sent until the app is ready.
- **`GET /api/health/live`** – Liveness: 200 if the process is alive.

### Railway configuration

In **Config as Code** (`railway.toml` or `railway.json` in the repo):

- **healthcheckPath:** `/api/health/ready`
- **healthcheckTimeout:** 30 (seconds)

Railway will call this path during deployment. If it does not return 200 within the timeout, the deploy can be considered failed. This avoids sending traffic to the service before migrations or DB connections are ready.

---

## Rate limiting

### Scan endpoints

- **Scope:** All requests to `/api/v1/scan/*` (init, upload, result, history, etc.).
- **Limit:** 10 requests per 60 seconds per identifier (see below).
- **Response when limited:** `429 Too Many Requests` with `Retry-After: 60`.

### Identifier

- **Authenticated:** `user_{user_id}` (when `request.state.user` is set).
- **Anonymous:** `ip_{client_ip}`. When behind a proxy (e.g. Railway), the IP is taken from the first value in `X-Forwarded-For`.

### Single process (no Redis)

If **REDIS_URL** is not set:

- Limits are stored **in memory per process**.
- Each uvicorn worker has its own counter.
- With `--workers 16`, a user could send up to 16 × 10 = 160 requests per minute by hitting different workers.

Use this for single-worker or low-traffic deployments.

### Multi-worker / multi-instance (Redis)

If **REDIS_URL** is set (e.g. Railway Redis plugin or external Redis):

- Limits are stored in **Redis** and shared across all workers and instances.
- The effective limit is 10 requests per 60 seconds per identifier globally.
- Requires the **redis** Python package (in `requirements.txt`). If Redis is unavailable at runtime, the middleware **fails open** (allows the request) and logs a warning.

**Railway:** Add a Redis service, copy its `REDIS_URL` into the backend service variables, and redeploy. No code change needed.

### Login rate limiting

Login uses a separate, in-memory rate limit in `app.core.rate_limit` (10 attempts per IP per 15 minutes). This is **not** shared across workers. For shared login rate limiting, a future change could use the same Redis store with a different key prefix.

---

## Summary

| Item              | Configuration                          | Effect |
|-------------------|----------------------------------------|--------|
| Readiness         | `healthcheckPath = "/api/health/ready"` | Traffic only after DB is ready |
| Scan rate limit   | Default 10/60s per IP or user          | Abuse prevention |
| Shared limit      | Set `REDIS_URL`                        | Same limit across workers/instances |
