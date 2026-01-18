# 🔧 Configuration Guide - External ML Models

**AI Skincare Intelligence System**
**Version**: 1.0
**Last Updated**: December 23, 2025
**Status**: Active

---

## 📝 Overview

This guide provides step-by-step instructions for configuring external ML model integration in the AI Skincare Intelligence System.

---

## 🔑 Section 1: External Provider Credentials

### 1.1 Hugging Face Configuration

**Required Environment Variables**:
```bash
# Hugging Face API Key
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Model cache directory
HUGGINGFACE_CACHE_DIR=/app/model_cache/huggingface
```

**How to Obtain**:
1. Visit https://huggingface.co/settings/tokens
2. Create a new token with `read` access
3. Copy the token to `HUGGINGFACE_API_KEY`

**Required Permissions**:
- Model read access
- Inference API access

### 1.2 OpenAI Configuration

**Required Environment Variables**:
```bash
# OpenAI API Key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Organization ID
OPENAI_ORG_ID=org-xxxxxxxxxxxxx
```

**How to Obtain**:
1. Visit https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy to `OPENAI_API_KEY`

### 1.3 Google Cloud AI Platform

**Required Environment Variables**:
```bash
# Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=ai-skincare-prod

# Path to service account credentials JSON
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/gcp-service-account.json

# Optional: Region
GOOGLE_CLOUD_REGION=us-central1
```

**How to Obtain**:
1. Create service account in GCP Console
2. Grant "AI Platform User" role
3. Download JSON credentials
4. Mount as secret in Railway/deployment platform

---

## 📦 Section 2: Model Configuration

### 2.1 Default Model Settings

**Required Environment Variables**:
```bash
# Default model to use
DEFAULT_MODEL_VERSION=internal-v1.0

# Model cache configuration
EXTERNAL_MODEL_CACHE_DIR=/app/model_cache
MODEL_CACHE_TTL_HOURS=24
MODEL_CACHE_MAX_SIZE_GB=10

# Model loading timeouts
MODEL_LOAD_TIMEOUT_SECONDS=30
MODEL_WARMUP_ON_STARTUP=false
```

### 2.2 Model Selection

**Supported Models**:
```bash
# Internal model (always available)
INTERNAL_MODEL_PATH=/app/models/skincare_v1.0.pkl

# External model identifiers
EXTERNAL_MODELS=huggingface/skin-condition-v2,openai/gpt-4-vision-preview
```

---

## 💰 Section 3: Cost Controls

### 3.1 Budget Limits

**Required Environment Variables**:
```bash
# Daily budget per provider (USD)
DAILY_BUDGET_USD=100.00
HUGGINGFACE_DAILY_BUDGET_USD=50.00
OPENAI_DAILY_BUDGET_USD=50.00

# Alert thresholds
COST_ALERT_THRESHOLD=0.80  # Alert at 80% of budget
COST_ALERT_EMAIL=alerts@company.com
```

### 3.2 Rate Limiting

**Required Environment Variables**:
```bash
# Rate limits per user
MAX_REQUESTS_PER_MINUTE=60
MAX_REQUESTS_PER_DAY=1000

# External model specific limits
EXTERNAL_MODEL_MAX_RPM=30  # Requests per minute
EXTERNAL_MODEL_MAX_RPD=500  # Requests per day
```

---

## ⚡ Section 4: Performance Tuning

### 4.1 Inference Configuration

**Required Environment Variables**:
```bash
# Inference timeouts
INFERENCE_TIMEOUT_SECONDS=30
INFERENCE_MAX_RETRIES=3
INFERENCE_RETRY_DELAY_SECONDS=2

# Circuit breaker
CIRCUIT_BREAKER_THRESHOLD=5  # Failures before opening
CIRCUIT_BREAKER_TIMEOUT_SECONDS=60
```

### 4.2 Caching Strategy

**Required Environment Variables**:
```bash
# Result caching
ENABLE_RESULT_CACHING=true
RESULT_CACHE_TTL_SECONDS=3600
RESULT_CACHE_MAX_ENTRIES=10000

# Model caching
ENABLE_MODEL_CACHING=true
MODEL_CACHE_PRELOAD=internal-v1.0
```

---

## 📊 Section 5: Monitoring & Logging

### 5.1 Logging Configuration

**Required Environment Variables**:
```bash
# Log level
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR

# Structured logging
ENABLE_JSON_LOGGING=true
LOG_INFERENCE_METADATA=true
```

### 5.2 Metrics Export

**Required Environment Variables**:
```bash
# Prometheus metrics
ENABLE_METRICS=true
METRICS_PORT=9090

# Export intervals
METRICS_EXPORT_INTERVAL_SECONDS=60
```

---

## 🔒 Section 6: Security Settings

### 6.1 Credential Management

**Best Practices**:
- Store API keys in secure secret management (e.g., Railway Secrets, AWS Secrets Manager)
- Never commit credentials to version control
- Rotate API keys quarterly
- Use separate keys for dev/staging/production

**Required Environment Variables**:
```bash
# Enable credential encryption
ENCRYPT_STORED_CREDENTIALS=true
CREDENTIAL_ENCRYPTION_KEY=base64_encoded_32_byte_key

# Credential rotation
CREDENTIAL_ROTATION_WARNING_DAYS=30
```

### 6.2 API Security

**Required Environment Variables**:
```bash
# API authentication
REQUIRE_API_KEY=true
API_KEY_HEADER=X-API-Key

# CORS settings
CORS_ALLOWED_ORIGINS=https://app.skincare-ai.com
CORS_ALLOW_CREDENTIALS=true
```

---

## 🚀 Section 7: Deployment Configuration

### 7.1 Railway Setup

**Step-by-step**:
1. Navigate to Railway project settings
2. Add all required environment variables
3. Create persistent volume for model cache:
   ```
   Volume Name: model-cache
   Mount Path: /app/model_cache
   Size: 10GB
   ```
4. Deploy application

**Example Railway Configuration**:
```bash
# Core settings
PORT=8000
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://...

# External ML Models
HUGGINGFACE_API_KEY=${{HUGGINGFACE_API_KEY}}
OPENAI_API_KEY=${{OPENAI_API_KEY}}
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/gcp.json

# Performance
MODEL_CACHE_DIR=/app/model_cache
DAILY_BUDGET_USD=100.00
```

### 7.2 Docker Configuration

**Dockerfile additions**:
```dockerfile
# Add model cache volume
VOLUME ["/app/model_cache"]

# Copy GCP credentials
COPY secrets/gcp-service-account.json /app/secrets/

# Set environment
ENV EXTERNAL_MODEL_CACHE_DIR=/app/model_cache
ENV MODEL_CACHE_TTL_HOURS=24
```

**Docker Compose**:
```yaml
services:
  backend:
    environment:
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DAILY_BUDGET_USD=100.00
    volumes:
      - model-cache:/app/model_cache
      - ./secrets/gcp.json:/app/secrets/gcp.json:ro

volumes:
  model-cache:
    driver: local
```

---

## ✅ Section 8: Validation & Testing

### 8.1 Configuration Validation

**Test external provider connections**:
```bash
# Test Hugging Face
curl -X GET "https://api.huggingface.co/api/whoami" \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY"

# Test OpenAI
curl -X GET "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 8.2 Health Check Endpoint

**Test system health**:
```bash
curl -X GET "http://localhost:8000/health"

# Expected response:
{
  "status": "healthy",
  "external_models": {
    "huggingface": "connected",
    "openai": "connected",
    "google": "connected"
  },
  "cache": {
    "size_mb": 245,
    "models_cached": 2
  }
}
```

---

## 📄 Section 9: Complete Environment Variable Reference

```bash
# ========== External Provider Credentials ==========
HUGGINGFACE_API_KEY=hf_xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_CLOUD_PROJECT_ID=project-id
GOOGLE_APPLICATION_CREDENTIALS=/app/secrets/gcp.json

# ========== Model Configuration ==========
DEFAULT_MODEL_VERSION=internal-v1.0
EXTERNAL_MODEL_CACHE_DIR=/app/model_cache
MODEL_CACHE_TTL_HOURS=24
MODEL_CACHE_MAX_SIZE_GB=10
MODEL_LOAD_TIMEOUT_SECONDS=30

# ========== Cost Controls ==========
DAILY_BUDGET_USD=100.00
MAX_REQUESTS_PER_MINUTE=60
COST_ALERT_THRESHOLD=0.80

# ========== Performance Tuning ==========
INFERENCE_TIMEOUT_SECONDS=30
RETRY_ATTEMPTS=3
CIRCUIT_BREAKER_THRESHOLD=5

# ========== Caching ==========
ENABLE_RESULT_CACHING=true
RESULT_CACHE_TTL_SECONDS=3600

# ========== Logging & Monitoring ==========
LOG_LEVEL=INFO
ENABLE_JSON_LOGGING=true
ENABLE_METRICS=true
METRICS_PORT=9090

# ========== Security ==========
ENCRYPT_STORED_CREDENTIALS=true
REQUIRE_API_KEY=true
CORS_ALLOWED_ORIGINS=https://app.skincare-ai.com
```

---

## 🔗 References

1. [SRS-V5.3-EXTERNAL-PRETRAINED-ML.md](./AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md)
2. [API-IMPACT-ANALYSIS.md](./API-IMPACT-ANALYSIS.md)
3. [ADR-ML-003-External-Model-Storage.md](./ADR-ML-003-External-Model-Storage.md)

---

**Document Owner**: DevOps & ML Team
**Review Cycle**: Quarterly
**Next Review**: March 23, 2026
