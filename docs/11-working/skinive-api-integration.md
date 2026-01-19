# Skinive API Integration (Working Notes)

Status: Deprecated (migrated to YouCam API)

This integration plan is no longer active. See:

- `docs/11-working/youcam-api-integration.md`

## Goal

Replace or augment the current local skin analysis with Skinive API.

## API Summary (from Skinive docs)

- Base URL: `https://api.skiniver.com`
- Auth: `Authorization: token` header (token provided by Skinive)
- Optional: `Locale: en` header (language)
- Endpoints:
  - `POST /validate` - validate image suitability
  - `POST /predict` - run prediction
  - `GET /get_disease_classes` - list supported classes

## Pending Inputs

- API token value
- Rate limits and error handling guidance

## Environment Variables

- `SKINIVE_API_BASE` (default: `https://api.skiniver.com`)
- `SKINIVE_API_TOKEN` (required for live calls)
- `SKINIVE_LOCALE` (default: `en`)
- `SKINIVE_TIMEOUT_SECONDS` (default: `30`)

Note: Store tokens in environment variables only. Do not commit or paste secrets into docs.
## Request Format

- `POST /predict`
- Headers:
  - `Authorization: token`
  - `Locale: en` (optional)
- Body:
  - `multipart/form-data` with `img` file field

## Response Fields (core)

- `status`: boolean
- `class`: human-readable label
- `class_raw`: normalized label
- `desease`: broad class (spelling per API)
- `prob`: probability (percent)
- `risk`: Low/Medium/High
- `risk_level`: normalized risk
- `description`: narrative text
- `atlas_page_link`: URL to atlas content
- `check_datetime`: timestamp
- `image_url`, `s3_url`: original image URLs
- `masked_s3_url`: masked image
- `colored_s3_url`: colored overlay

## Planned Integration Points

- `backend/app/config.py`: add Skinive settings
- `backend/services/skin_analysis_service.py`: call Skinive API
- `backend/app/routers/scan.py`: wire analysis flow to Skinive

## Decisions (TBD)

- Fallback strategy if Skinive fails
- Caching or retries
- Data retention and logging policy

## Test Notes (TBD)

- Unit tests for client wrapper
- Mocked API response tests for `/api/v1/scan`

