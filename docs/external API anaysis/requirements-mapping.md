# External API requirements mapping

This mapping aligns third-party API evaluation with the SRS requirements for
external model integration and performance goals.

Reference:
- ../01-requirements/SRS-V5.3-External-Pretrained-ML.md

## Functional requirements

| Requirement | Why it matters | Evaluation signals |
| --- | --- | --- |
| FR-ML-EXT-001 Model discovery | We need stable, documented model access | Public docs, model registry, versioning |
| FR-ML-EXT-002 Model selection | API should support selecting or configuring models | Explicit model_id or model_name in requests |
| FR-ML-EXT-003 Credential management | Secure key handling and rotation | Key rotation support, scope-limited keys |
| FR-ML-EXT-004 Inference tracking | We must store model version per result | Response includes model_version |

## Non-functional requirements

| Requirement | Target | Evaluation signals |
| --- | --- | --- |
| NFR-ML-1 Model loading | Load within 5-30 seconds | Cold start metrics and caching |
| NFR-ML-2 Inference latency | P95 <= 3s single model | Vendor SLA or benchmark |
| NFR-ML-3 API reliability | Retries, timeouts, fallback | SLA, rate limits, error codes |
| NFR-ML-4 Cost management | Budget and cost tracking | Cost per request, usage dashboard |

## Data and compliance

Checklist:
- Data retention and deletion policies available
- Region support that matches GDPR or target markets
- Explicit consent guidance for biometric data
