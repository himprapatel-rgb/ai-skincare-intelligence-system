# SRS Addendum: External Pre-Trained ML Model Integration

**Version**: 1.0  
**Date**: December 23, 2025  
**Related CR**: Epic 17 - External Pre-Trained ML Model Integration  
**Base SRS**: V5.3  
**Status**: Active

## Overview

This addendum extends SRS V5.3 to support external pre-trained ML models for face & skin analysis (inference-only) without storing model files in GitHub, respecting the 100MB file limit.

## New Functional Requirements

### FR-ML-1: External Model Storage

**ID**: FR-ML-1  
**Priority**: High  
**Description**: The system SHALL support loading ML models from external storage (Railway volumes OR secure download URLs), respecting GitHub's 100MB file limit.

**Acceptance Criteria**:
- Model files MUST NOT be committed to GitHub
- Support Railway volume mounting at `/models`
- Support HTTPS download with SHA256 verification
- Cache downloaded models in `/tmp/model_cache`
- Configuration via environment variables

**SRS Traceability**: Linked to SRS V5.3 NFR21 (External Model Storage)

---

### FR-ML-2: Runtime Model Loading

**ID**: FR-ML-2  
**Priority**: High  
**Description**: The system SHALL load ML models at application startup or first inference request using lazy initialization.

**Acceptance Criteria**:
- Model loading MUST NOT block FastAPI startup
- First inference may have higher latency (model load time)
- Subsequent inferences use cached in-memory model
- Thread-safe singleton pattern
- Clear error messages if model unavailable

**SRS Traceability**: Linked to SRS V5.3 NFR22 (Runtime Model Loading)

---

### FR-ML-3: Skin Analysis Inference

**ID**: FR-ML-3  
**Priority**: High  
**Description**: The system SHALL perform face-based skin analysis using pre-trained models, detecting conditions: acne/pimples, rash, redness, pigmentation, wrinkles, uneven tone.

**Acceptance Criteria**:
- Accept image path from existing scan storage
- Return structured JSON: `{conditions: [{name, score, severity}], overall_score, notes, model_version, inference_time_ms}`
- All scores in 0.0-1.0 range
- Non-blocking async execution
- Human-readable notes generation

**SRS Traceability**: Extends SRS V5.3 FR6 (AI Skin Analysis)

---

### FR-ML-4: Model Versioning

**ID**: FR-ML-4  
**Priority**: Medium  
**Description**: Each scan result SHALL be tagged with the model version used for inference to enable auditability and A/B testing.

**Acceptance Criteria**:
- Store `model_version` string in `scan_sessions` table
- Include model_version in API response
- Support switching models via config without code changes

**SRS Traceability**: Linked to SRS V5.3 FR6D (Model Versioning)

---

### FR-ML-5: Result Persistence

**ID**: FR-ML-5  
**Priority**: High  
**Description**: All scan results SHALL be stored in PostgreSQL for future ML training and quality monitoring.

**Acceptance Criteria**:
- Store result JSON in existing `result` column (JSONB)
- Store model metadata (version, inference time)
- Link to original image path
- Retain for minimum 90 days per data retention policy

**SRS Traceability**: Linked to SRS V5.3 DR4A, DR4B (Data Storage for Training)

---

## New Non-Functional Requirements

### NFR-ML-1: Model Swap Safety

**Description**: Changing the external model MUST NOT require frontend changes or API schema modifications.  
**Rationale**: Model-agnostic architecture for rapid iteration.  
**Acceptance Criteria**: Frontend continues to work without redeployment when model version changes.

---

### NFR-ML-2: Inference Latency

**Description**: Inference SHALL complete within 5 seconds for standard images (< 5MB).  
**Rationale**: Acceptable user experience for ML processing.  
**Measurement**: 95th percentile response time.

---

### NFR-ML-3: Security

**Requirements**:
- Model download URLs MUST use HTTPS
- API keys stored in Railway secrets
- Model files never exposed to client
- SHA256 checksum verification for downloads

---

### NFR-ML-4: CI/CD Compatibility

**Description**: CI pipelines SHALL NOT require downloading production models.  
**Rationale**: Use stub/mock models for testing to keep pipeline fast and lean.  
**Implementation**: Stub model returns fixed predictions for testing.

---

## Deferred (Post-MVP)

The following are explicitly **NOT** part of this implementation and remain deferred to future phases:

- **Training Pipelines**: On-platform model training using stored scan data
- **Open-Source Datasets**: Integration of external dermatology datasets for training
- **Fine-Tuning**: Personalized model adaptation per user
- **Active Learning**: User feedback loop for continuous model improvement
- **Model Retraining**: Automated periodic retraining workflows

These remain in the product roadmap but will be implemented as separate features with dedicated ADRs and SRS updates.

---

## Database Schema Changes

**Table**: `scan_sessions`  
**New Column**: `model_version TEXT`  
**Migration**: Alembic revision required  
**Backward Compatible**: Yes (nullable column)

---

## API Impact

**No Breaking Changes**: All existing endpoints maintain same contracts.

**Modified Behavior**:
- `POST /api/v1/scan/{scan_id}/upload`: Now uses real ML inference instead of mock
- Response schema unchanged (same JSON structure)
- New field added: `model_version` in analysis results

---

## Configuration

**New Environment Variables**:
```bash
MODEL_SOURCE=volume          # or "download"
MODEL_PATH=/models/skin_analysis_v1.pth
MODEL_URL=https://...        # if download mode
MODEL_SHA256=abc123...       # if download mode  
MODEL_VERSION=1.0.0
```

---

## Testing Strategy

- Unit tests: Mock model loader and inference service
- Integration tests: Use stub model (no external dependencies)
- CI: Stub model only (no model downloads)
- Staging: Test with real model from volume
- Production: Railway volume with production model

---

## Rollout Plan

1. Deploy code with stub model (no production impact)
2. Mount Railway volume with production model
3. Update `MODEL_SOURCE=volume` in Railway
4. Monitor inference latency and error rates
5. Gradual rollout if needed (feature flag ready)

---

## Success Criteria

- ✅ No model files in GitHub repository
- ✅ Existing scan endpoints continue to function
- ✅ Frontend unchanged
- ✅ CI pipeline remains green with stub models
- ✅ Railway deployment uses volume-mounted models
- ✅ Inference completes within 5 seconds (95th percentile)
- ✅ Model version tracked in all scan results

---

## References

- **Base SRS**: `SRS-V5-Enhanced.md` (V5.3)
- **ADR**: `ADR-ML-003-External-Model-Storage.md`
- **Product Backlog**: Epic 17 stories (17.1-17.5)
- **Implementation**: `backend/app/services/ml_model_loader.py`, `skin_inference.py`
