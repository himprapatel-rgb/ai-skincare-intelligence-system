# Skinive integration plan

Status: Draft, awaiting vendor API contract.

## Goal

Integrate Skinive as the first external API for face skin analysis while
preserving the current /api/v1/scan flow in the backend.

## Scope

- Backend integration only.
- Frontend continues to call existing scan endpoints.
- No UI changes in this phase.

## Inputs required from Skinive

- Base API URL and version.
- Authentication method and key rotation guidance.
- Request schema for image analysis.
- Response schema with condition scores and metadata.
- Rate limits and latency expectations.
- Data retention and regional hosting options.

## Expected outputs (aligned to product promises)

- Acne severity
- Wrinkles
- Redness
- Pigmentation/dark spots
- Overall score or confidence

## Implementation outline

1) Add environment variables for Skinive credentials and base URL.
2) Create a Skinive client wrapper in backend services.
3) Map Skinive response fields to the internal scan result format.
4) Store model/version metadata alongside results.
5) Add retries, timeouts, and graceful fallback behavior.
6) Add logging and cost tracking hooks if supported by the provider.

## Open questions

- Does Skinive return a model_version or model_id in responses?
- What is the image upload method (multipart or base64)?
- Are there webhook callbacks or only synchronous responses?
- What are the compliance requirements for biometric data?
