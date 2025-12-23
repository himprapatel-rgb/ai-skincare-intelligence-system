# 🔌 API Impact Analysis - External Pre-Trained ML Model Integration

**AI Skincare Intelligence System**
**Document Version**: 1.0
**Last Updated**: December 23, 2025
**Status**: Active
**Related**: SRS V5.3, Epic 16

---

## 📝 Executive Summary

This document provides a comprehensive analysis of API changes, breaking changes, and migration paths required for integrating external pre-trained ML models into the AI Skincare Intelligence System.

### Key Findings
- **New Endpoints**: 3 new API endpoints
- **Breaking Changes**: 1 critical breaking change
- **Backward Compatibility**: Migration path available
- **Client Impact**: Moderate - frontend updates required
- **Timeline**: 2-week migration window recommended

---

## 🎯 Section 1: New API Endpoints

### 1.1 POST /api/v1/inference/external

**Purpose**: Execute inference using external pre-trained models

**Request Schema**:
```json
{
  "image_url": "string (required)",
  "model_name": "string (required)",
  "options": {
    "confidence_threshold": "float (0.0-1.0, default: 0.7)",
    "return_metadata": "boolean (default: true)"
  }
}
```

**Response Schema**:
```json
{
  "inference_id": "uuid",
  "model_version": "string",
  "model_source": "string (internal|external)",
  "results": {
    "conditions": [
      {
        "condition_name": "string",
        "confidence": "float",
        "severity": "string"
      }
    ]
  },
  "metadata": {
    "latency_ms": "integer",
    "cost_usd": "float",
    "provider": "string"
  },
  "timestamp": "ISO 8601 string"
}
```

**Status Codes**:
- `200 OK`: Successful inference
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Model not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Inference failed
- `503 Service Unavailable`: External model provider unavailable

### 1.2 GET /api/v1/models

**Purpose**: List all available models (internal and external)

**Query Parameters**:
- `type`: Filter by model type (`internal`, `external`, `all` - default: `all`)
- `active_only`: Boolean (default: `true`)

**Response Schema**:
```json
{
  "models": [
    {
      "model_id": "string",
      "model_name": "string",
      "type": "string (internal|external)",
      "provider": "string",
      "version": "string",
      "capabilities": ["string"],
      "cost_per_request": "float",
      "avg_latency_ms": "integer",
      "is_active": "boolean"
    }
  ],
  "total_count": "integer"
}
```

### 1.3 GET /api/v1/inference/{inference_id}/metadata

**Purpose**: Retrieve detailed metadata for a specific inference result

**Response Schema**:
```json
{
  "inference_id": "uuid",
  "user_id": "uuid",
  "model_version": "string",
  "model_source": "string",
  "execution_details": {
    "latency_ms": "integer",
    "cost_usd": "float",
    "provider": "string",
    "timestamp": "ISO 8601 string"
  },
  "image_details": {
    "image_url": "string",
    "image_size_bytes": "integer",
    "dimensions": "string"
  }
}
```

---

## ⚠️ Section 2: Breaking Changes

### 2.1 BREAKING: POST /api/v1/inference Response Schema Change

**Impact**: HIGH
**Affected Clients**: All frontend applications using inference API

**Previous Response** (V1):
```json
{
  "inference_id": "uuid",
  "results": {
    "conditions": []
  },
  "timestamp": "ISO 8601 string"
}
```

**New Response** (V2):
```json
{
  "inference_id": "uuid",
  "model_version": "string",  // NEW FIELD (REQUIRED)
  "model_source": "string",    // NEW FIELD (REQUIRED)
  "results": {
    "conditions": []
  },
  "metadata": {  // NEW OBJECT
    "latency_ms": "integer",
    "cost_usd": "float"
  },
  "timestamp": "ISO 8601 string"
}
```

**Migration Strategy**:
1. **Phase 1** (Weeks 1-2): Dual response mode
   - API returns both old and new schemas
   - Clients can opt-in via `X-API-Version: v2` header
   
2. **Phase 2** (Weeks 3-4): Deprecation warnings
   - V1 responses include deprecation header
   - Monitoring and alerts for V1 usage
   
3. **Phase 3** (Week 5+): V2 becomes default
   - V1 responses removed
   - All clients must upgrade

**Client Migration Checklist**:
- [ ] Update API client to handle `model_version` field
- [ ] Update API client to handle `model_source` field
- [ ] Update UI to display model metadata (optional)
- [ ] Test with `X-API-Version: v2` header
- [ ] Deploy frontend updates before Phase 3

---

## 🔄 Section 3: Backward Compatibility

### 3.1 Versioning Strategy

**API Versioning Approach**: Header-based versioning

**Supported Versions**:
- **v1**: Legacy (supported until Week 5)
- **v2**: Current (default after Week 5)

**Version Selection**:
```bash
# Use V1 (legacy)
curl -H "X-API-Version: v1" /api/v1/inference

# Use V2 (current)
curl -H "X-API-Version: v2" /api/v1/inference

# Default (v2 after migration)
curl /api/v1/inference
```

### 3.2 Fallback Behavior

If external model fails:
1. Circuit breaker triggers after 5 consecutive failures
2. System automatically falls back to internal model
3. Response includes `fallback: true` flag
4. Client receives 200 OK with fallback indicator

**Example Fallback Response**:
```json
{
  "inference_id": "uuid",
  "model_version": "internal-v1.0",
  "model_source": "internal",
  "fallback": true,
  "fallback_reason": "external_model_timeout",
  "results": {...}
}
```

---

## 📈 Section 4: Performance Impact

### 4.1 Latency Changes

| Endpoint | Current Latency (P95) | New Latency (P95) | Impact |
|----------|----------------------|-------------------|--------|
| POST /inference | 800ms | 800-3000ms | Variable (+0-2200ms) |
| POST /inference/external | N/A | 3000ms | New endpoint |
| GET /models | N/A | 50ms | New endpoint |

**Mitigation**:
- Model caching reduces subsequent requests to <1s
- Internal model always available as fast fallback
- Frontend loading states for longer inference times

### 4.2 Rate Limiting

**New Rate Limits**:
- `/api/v1/inference/external`: 60 requests/minute per user
- `/api/v1/models`: 100 requests/minute per user
- `/api/v1/inference`: Unchanged (120 requests/minute)

**Rate Limit Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

---

## 🛠️ Section 5: Error Handling Changes

### 5.1 New Error Codes

```json
{
  "error": {
    "code": "EXTERNAL_MODEL_UNAVAILABLE",
    "message": "External model provider is temporarily unavailable",
    "details": {
      "provider": "huggingface",
      "retry_after": 30
    },
    "fallback_available": true
  }
}
```

**New Error Codes**:
- `EXTERNAL_MODEL_UNAVAILABLE`: External provider down
- `MODEL_NOT_FOUND`: Requested model doesn't exist
- `COST_LIMIT_EXCEEDED`: Daily budget exceeded
- `INVALID_MODEL_VERSION`: Model version incompatible

### 5.2 Retry Logic

**Client-Side Retry Recommendations**:
1. Exponential backoff: 1s, 2s, 4s
2. Max 3 retries for transient errors
3. No retry for `400` or `403` errors
4. Retry on `503` with `Retry-After` header

---

## 📊 Section 6: Monitoring & Observability

### 6.1 New Metrics

**API Metrics**:
- `api.inference.external.requests.total` (counter)
- `api.inference.external.latency_ms` (histogram)
- `api.inference.fallback.total` (counter)
- `api.models.list.requests.total` (counter)

**Model Metrics**:
- `ml.external_model.cost_usd` (gauge)
- `ml.external_model.success_rate` (gauge)
- `ml.model_version.usage` (counter by version)

### 6.2 Logging Enhancements

**New Log Fields**:
```json
{
  "inference_id": "uuid",
  "model_version": "string",
  "model_source": "internal|external",
  "provider": "string",
  "latency_ms": 2450,
  "cost_usd": 0.003,
  "fallback_triggered": false
}
```

---

## 📋 Section 7: Security & Authentication

### 7.1 No Changes to Auth

- JWT token authentication remains unchanged
- Same OAuth 2.0 flow
- Same permission model

### 7.2 New Permissions

**New Permission Scopes**:
- `models:list`: View available models
- `inference:external`: Use external models (premium tier)

---

## ✅ Section 8: Testing Recommendations

### 8.1 Integration Tests

**Required Test Cases**:
1. ✅ External model inference success
2. ✅ External model fallback on failure
3. ✅ Model list endpoint returns all models
4. ✅ Rate limiting on external inference
5. ✅ Backward compatibility with v1 API
6. ✅ Cost tracking and budget limits

### 8.2 Performance Tests

**Load Testing Scenarios**:
- 100 req/s to `/inference` endpoint
- 50 req/s to `/inference/external` endpoint
- Verify P95 latency <3s for external models
- Verify fallback triggers within 30s

---

## 📆 Section 9: Rollout Plan

### 9.1 Phased Deployment

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Beta** | Week 1-2 | Deploy to staging, internal testing, selected beta users |
| **Phase 2: Soft Launch** | Week 3-4 | 10% traffic rollout, monitor metrics, V1/V2 dual support |
| **Phase 3: Full Rollout** | Week 5+ | 100% traffic, V2 becomes default, V1 deprecated |

### 9.2 Rollback Plan

If critical issues arise:
1. Revert to internal-only inference
2. Disable external model endpoints
3. All existing inference continues with internal models
4. Zero downtime for core functionality

---

## 📖 References

1. [SRS-V5.3-EXTERNAL-PRETRAINED-ML.md](./AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md)
2. [ADR-ML-003-External-Model-Storage.md](./ADR-ML-003-External-Model-Storage.md)
3. [Product-Backlog-V5.md](./Product-Backlog-V5.md) - Epic 16

---

**Document Owner**: AI/ML Team & Backend Team
**Review Cycle**: Monthly
**Next Review**: January 23, 2026
