FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app /app/app
COPY scripts /app/backend/scripts

EXPOSE 8000

# Use Railway's PORT environment variable (Railway provides $PORT dynamically)
CMD ["sh", "-c", "python3 /app/backend/scripts/run_migrations.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
