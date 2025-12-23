# 📋 SRS V5.3 - External Pre-Trained ML Model Integration

**AI Skincare Intelligence System - Software Requirements Specification**
**Version**: 5.3 (External Pre-Trained ML Model Integration)
**Last Updated**: December 23, 2025
**Status**: Active

---

## 🔗 What's New in V5.3

This update adds **comprehensive external pre-trained ML model integration requirements** to enable the system to leverage state-of-the-art pre-trained models from external sources (Hugging Face, OpenAI, cloud providers) for advanced skin analysis capabilities.

### Key Changes:
- **New Epic 17**: External Pre-Trained ML Model Integration
- **4 New Non-Functional Requirements** (NFR-ML-1 through NFR-ML-4)
- **Database Schema Extensions**: New `model_version` column in `inference_results`
- **API Enhancements**: Model selection and metadata endpoints
- **Configuration Updates**: New environment variables for external model credentials

### Related Documentation:
- [SRS-ADDENDUM-EXTERNAL-PRETRAINED-MODEL.md](./SRS-ADDENDUM-EXTERNAL-PRETRAINED-MODEL.md) - Detailed requirements
- [ADR-ML-003-External-Model-Storage.md](./ADR-ML-003-External-Model-Storage.md) - Architecture decisions
- [API-IMPACT-ANALYSIS.md](./API-IMPACT-ANALYSIS.md) - Breaking changes analysis

---

## 📚 Section 1: Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document defines the functional and non-functional requirements for the AI Skincare Intelligence System, including external pre-trained ML model integration capabilities.

### 1.2 Scope
The system integrates:
- Internal ML models trained on proprietary datasets
- External pre-trained models from Hugging Face, OpenAI, and cloud providers
- Hybrid inference pipelines combining multiple models
- Model version tracking and metadata management

### 1.3 Definitions and Acronyms
- **ML**: Machine Learning
- **NFR**: Non-Functional Requirement
- **API**: Application Programming Interface
- **SRS**: Software Requirements Specification
- **ADR**: Architecture Decision Record

---

## 🎯 Section 2: Functional Requirements

### 2.1 External Model Integration (FR-ML-EXT)

#### FR-ML-EXT-001: Model Discovery
**Priority**: High
**Description**: System shall support discovery and registration of external pre-trained models

**Acceptance Criteria**:
- ✅ Support Hugging Face model hub integration
- ✅ Support OpenAI API model endpoints
- ✅ Support Google Cloud AI Platform models
- ✅ Validate model compatibility before registration
- ✅ Store model metadata (name, version, source, capabilities)

#### FR-ML-EXT-002: Model Selection
**Priority**: High
**Description**: System shall allow users to select which model(s) to use for inference

**Acceptance Criteria**:
- ✅ API endpoint accepts `model_id` or `model_name` parameter
- ✅ Support for multiple model selection (ensemble inference)
- ✅ Default to internal model if no selection specified
- ✅ Return model metadata in response

#### FR-ML-EXT-003: Credential Management
**Priority**: Critical
**Description**: System shall securely manage API keys and credentials for external model providers

**Acceptance Criteria**:
- ✅ Encrypted storage of API keys
- ✅ Environment variable configuration
- ✅ Support for multiple provider credentials
- ✅ Credential rotation capability

#### FR-ML-EXT-004: Inference Results Tracking
**Priority**: High
**Description**: System shall track which model version generated each inference result

**Acceptance Criteria**:
- ✅ Store `model_version` in `inference_results` table
- ✅ Include model source (internal/external) in metadata
- ✅ Enable filtering results by model version

---

## ⚡ Section 3: Non-Functional Requirements

### 3.1 Performance Requirements (NFR-ML)

#### NFR-ML-1: Model Loading Performance
**Priority**: High
**Description**: External models shall load within acceptable time limits

**Metrics**:
- **Small models** (<500MB): Load in ≤5 seconds
- **Medium models** (500MB-2GB): Load in ≤15 seconds
- **Large models** (>2GB): Load in ≤30 seconds

**Implementation Strategy**:
- Model caching with 24-hour TTL
- Lazy loading on first request
- Pre-warming for frequently used models

#### NFR-ML-2: Inference Latency
**Priority**: Critical
**Description**: External model inference shall maintain acceptable response times

**Targets**:
- **95th percentile**: ≤3 seconds for single model inference
- **99th percentile**: ≤5 seconds for single model inference
- **Ensemble inference**: ≤8 seconds for up to 3 models

**Monitoring**:
- Track per-model latency metrics
- Alert on degradation >20% from baseline
- Dashboard with P50, P95, P99 latencies

#### NFR-ML-3: API Reliability
**Priority**: Critical
**Description**: External API calls shall implement robust error handling

**Requirements**:
- **Retry logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds per API call
- **Circuit breaker**: Open after 5 consecutive failures
- **Fallback**: Return internal model results if external fails

**Success Metrics**:
- 99.5% successful inference requests
- <1% requests fail due to external API issues

#### NFR-ML-4: Cost Management
**Priority**: High
**Description**: System shall track and limit costs from external API usage

**Controls**:
- **Daily budget limits**: Configurable per provider
- **Rate limiting**: Max requests per minute/day
- **Cost tracking**: Log cost per inference
- **Alerts**: Notify when 80% of budget consumed

**Reporting**:
- Daily cost breakdown by provider
- Cost per user/scan metrics
- Monthly cost projections

---

## 🗄️ Section 4: Database Requirements

### 4.1 Schema Changes

#### inference_results Table Update
```sql
ALTER TABLE inference_results 
ADD COLUMN model_version VARCHAR(100) DEFAULT 'internal-v1.0';

CREATE INDEX idx_inference_model_version 
ON inference_results(model_version);
```

#### New Table: external_models
```sql
CREATE TABLE external_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- 'huggingface', 'openai', 'google'
    model_id VARCHAR(255) NOT NULL,
    capabilities JSONB,
    cost_per_request DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🔌 Section 5: API Requirements

### 5.1 New Endpoints

#### POST /api/v1/inference/external
**Description**: Run inference using external model

**Request**:
```json
{
  "image_url": "https://...",
  "model_name": "huggingface/skin-analysis-v2",
  "options": {
    "confidence_threshold": 0.7
  }
}
```

**Response**:
```json
{
  "inference_id": "uuid",
  "model_version": "huggingface/skin-analysis-v2:v1.3",
  "results": {...},
  "latency_ms": 2450,
  "cost_usd": 0.003
}
```

#### GET /api/v1/models
**Description**: List available models

**Response**:
```json
{
  "models": [
    {
      "name": "internal-v1",
      "type": "internal",
      "capabilities": ["acne_detection", "wrinkle_analysis"]
    },
    {
      "name": "huggingface/skin-analysis-v2",
      "type": "external",
      "provider": "huggingface",
      "cost_per_request": 0.003
    }
  ]
}
```

---

## 🔧 Section 6: Configuration Requirements

### 6.1 New Environment Variables

```bash
# External Model Provider Credentials
HUGGINGFACE_API_KEY=hf_...
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_PROJECT_ID=project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Model Configuration
DEFAULT_MODEL_VERSION=internal-v1.0
EXTERNAL_MODEL_CACHE_DIR=/app/model_cache
MODEL_CACHE_TTL_HOURS=24

# Cost Controls
DAILY_BUDGET_USD=100.00
MAX_REQUESTS_PER_MINUTE=60
COST_ALERT_THRESHOLD=0.80

# Performance Tuning
MODEL_LOAD_TIMEOUT_SECONDS=30
INFERENCE_TIMEOUT_SECONDS=30
RETRY_ATTEMPTS=3
CIRCUIT_BREAKER_THRESHOLD=5
```

---

## ✅ Section 7: Success Criteria

### 7.1 Technical Success Metrics
- ✅ All 4 NFRs met in production
- ✅ 99.5% inference success rate
- ✅ P95 latency <3 seconds
- ✅ Daily costs within budget 95% of days
- ✅ Zero security incidents related to credential management

### 7.2 Business Success Metrics
- ✅ >80% user satisfaction with external model quality
- ✅ >50% of premium users utilize external models
- ✅ 30% improvement in skin analysis accuracy

---

## 📋 Section 8: Version History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 5.3 | 2025-12-23 | System | External Pre-Trained ML Model Integration |
| 5.2 | 2025-12-15 | System | Performance optimization updates |
| 5.1 | 2025-12-08 | System | Database integration enhancements |
| 5.0 | 2025-11-20 | System | Major system architecture update |

---

## 📖 References

1. [SRS-ADDENDUM-EXTERNAL-PRETRAINED-MODEL.md](./SRS-ADDENDUM-EXTERNAL-PRETRAINED-MODEL.md)
2. [ADR-ML-003-External-Model-Storage.md](./ADR-ML-003-External-Model-Storage.md)
3. [Product-Backlog-V5.md](./Product-Backlog-V5.md)
4. [AI-MODEL-TRAINING-INTEGRATION-PLAN.md](./AI-MODEL-TRAINING-INTEGRATION-PLAN.md)
5. [API-IMPACT-ANALYSIS.md](./API-IMPACT-ANALYSIS.md)

---

**Document Status**: ✅ Active
**Next Review Date**: 2026-01-23
**Owner**: AI/ML Team
