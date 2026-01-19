# External API vendor shortlist

This list is a starting point for third-party skin analysis capabilities.
It does not imply endorsement and should be validated with trials.

## Decision

- Selected for MVP pilot: Skinive (pending contract, SLA, and pricing).

## Category A: Skincare-specific vendors (best fit for app promises)

Examples:
- Perfect Corp (YouCam)
- Skinive
- ModiFace

Pros:
- Domain-specific skin metrics (acne, pores, wrinkles, pigmentation).
- Often includes SDKs and UI components.

Cons:
- Enterprise pricing and longer onboarding.
- Data handling and region support must be verified.

## Category B: Model hosting platforms

Examples:
- Hugging Face Inference Endpoints
- Replicate
- AWS SageMaker

Pros:
- Flexibility to use or fine-tune your own model.
- Clear cost per request with infrastructure control.

Cons:
- You must choose and validate the model yourself.
- Ongoing MLOps ownership.

## Category C: General CV and face APIs (not enough on their own)

Examples:
- Google Cloud Vision
- AWS Rekognition
- Azure Face API

Pros:
- Strong face detection and landmarks.
- Scales reliably with global SLAs.

Cons:
- Does not provide detailed skin condition scoring by default.

## Open questions for trials

1) Which vendors return all required outputs: acne, wrinkles, redness, pigmentation?
2) Can the provider return model_version for every inference?
3) What is the P95 latency and price per 1,000 scans?
4) What are the data retention policies and regional hosting options?
