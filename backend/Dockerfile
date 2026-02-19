FROM python:3.11-slim

# Cache bust: 2026-01-31-v1 (fix deploy)
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app /app/app
COPY middleware /app/middleware
COPY scripts /app/backend/scripts
COPY migrations /app/backend/migrations

EXPOSE 8000

# Use Railway's PORT environment variable (Railway provides $PORT dynamically)
# Use UVICORN_WORKERS (default 4) to avoid exhausting DB connections on small instances
# Run migrations first; if they fail (e.g. RUN_MIGRATIONS/ALLOW_PROD_MIGRATIONS unset or DB down),
# still start the server so /api/health can return 200 and deployment is marked healthy.
CMD ["sh", "-c", "(python3 /app/backend/scripts/run_migrations.py || true) && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${UVICORN_WORKERS:-4}"]
