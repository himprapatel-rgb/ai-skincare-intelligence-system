# YouCam API Integration (Working Notes)

Status: Draft (sourced from YouCam docs)

Docs: https://yce.perfectcorp.com/document/index.html#section/API-Document

## Goal

Replace the local skin analysis pipeline with YouCam AI Skin Analysis.

## API Summary (v2)

- Base URL: `https://yce-api-01.makeupar.com`
- Auth: `Authorization: Bearer <API_KEY>`
- Flow (async):
  - `POST /s2s/v2.0/file/skin-analysis` (get upload URL + `file_id`)
  - `PUT` to presigned URL (upload image bytes)
  - `POST /s2s/v2.0/task/skin-analysis` (get `task_id`)
  - `GET /s2s/v2.0/task/skin-analysis/{task_id}` (poll)

## Required Inputs

- API key (YouCam console)
- Decide SD vs HD concerns (cannot mix in one request)
- Polling interval + max wait

## Environment Variables

- `YOUCAM_API_BASE` (default: `https://yce-api-01.makeupar.com`)
- `YOUCAM_API_KEY` (required for live calls)
- `YOUCAM_TIMEOUT_SECONDS` (default: `30`)
- `YOUCAM_POLL_INTERVAL_SECONDS` (default: `2`)
- `YOUCAM_MAX_POLL_SECONDS` (default: `120`)
- `YOUCAM_SKIN_ANALYSIS_FORMAT` (`json` or `zip`, default: `json`)
- `YOUCAM_SKIN_ANALYSIS_ACTIONS` (comma-separated list)

Note: Store tokens in environment variables only. Do not commit or paste secrets into docs.

## Request Format (Skin Analysis)

### File API

- `POST /s2s/v2.0/file/skin-analysis`
- Body:
  - `files`: array of `{ content_type, file_name, file_size }`

### Task API

- `POST /s2s/v2.0/task/skin-analysis`
- Body:
  - `src_file_id`
  - `dst_actions` (SD or HD only)
  - `format` (`json` or `zip`)

## Response Notes

- `task_status` is `running` until completion.
- On `success`, results appear in `data.results`.
- `json` format returns scores + mask URLs inline.
- `zip` format returns a URL to a downloadable zip.

## Constraints

- SD vs HD actions cannot be mixed.
- File retention is 24 hours; download URLs can expire quickly.
- Rate limits apply per IP and per token (see docs).

## Planned Integration Points

- `backend/app/config.py`: YouCam settings
- `backend/services/youcam_service.py`: client + polling
- `backend/app/routers/scan.py`: analysis flow via YouCam

## Test Notes (TBD)

- Unit tests for YouCam client wrapper
- Mocked API response tests for `/api/v1/scan`
