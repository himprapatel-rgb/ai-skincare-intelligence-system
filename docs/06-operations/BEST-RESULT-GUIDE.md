# Best Result Guide

**Purpose:** How to get the best possible result from the app – for users (scan quality) and for the product (analysis quality).

---

## 1. Best Result for the User (Scan & Report)

### 1.1 Photo quality (frontend)

We guide users so the photo is good enough for a reliable analysis:

- **Tips on Scan page** (upload and camera):
  - Use good, even lighting (natural light is best)
  - Remove glasses and face the camera directly
  - Keep hair away from your face
  - Take photo from shoulders up
  - Ensure your face is in focus
  - Clean skin or minimal makeup for most accurate reading

- **Validation** (faceValidation, ScanPage):
  - Face detection and landmarks (MediaPipe / BlazeFace)
  - Lighting checks (too dark / too bright)
  - Blur and contrast checks where enabled
  - Clear error messages so the user can retake (e.g. “Try better lighting and a front-facing pose”)

- **Copy:** “Face the light for best results” and step text set expectations before capture.

### 1.2 What “best result” means for the report

- **Accurate:** Scores and concerns match what’s visible (no medical diagnosis).
- **Actionable:** Recommendations are specific (ingredients or habits), not generic.
- **Consistent:** Similar photos give similar scores; confidence reflects image quality.

---

## 2. Best Result from the AI (Backend)

### 2.1 OpenAI Vision prompts (openai_vision_service.py)

Prompts are tuned so the model returns:

- **Structured output:** Only valid JSON matching the schema (summary, scores, skin_type, concerns_detail, recommendations, notes).
- **Realistic scores:** 0–100 per signal; similar appearance → similar scores.
- **Clear concerns_detail:** Each concern with severity, confidence, and affected_areas (e.g. forehead, under_eyes).
- **Actionable recommendations:** 2–5 short tips (ingredients or habits), not generic advice.
- **Honest confidence:** 0–1 reflecting lighting, angle, and clarity.
- **Brief notes:** Image quality or limitation when relevant.

System prompt stresses: expert cosmetic analysis, consistency, and actionable recommendations. User prompt asks for differentiated values and specific recommendations.

### 2.2 Image before analysis

- Backend receives the image after frontend validation (face present, optional quality checks).
- No extra preprocessing today; the model sees the image as uploaded.
- For future: optional server-side checks (resolution, brightness) could gate or warn before calling the API.

---

## 3. Levers to Improve “Best Result” Further

| Lever | Where | Effect |
|-------|--------|--------|
| **Stronger prompts** | openai_vision_service.py | ✅ Done – more consistent, actionable analysis. |
| **More tips** | ScanPage.tsx | ✅ Done – e.g. “minimal makeup” for accuracy. |
| **Stricter validation** | faceValidation.ts, ScanPage | Reject or warn on blur/low light before upload → fewer bad analyses. |
| **Confidence in UI** | Analysis results | Show confidence or “Quality: good/fair” so users know when to retake. |
| **Retake suggestion** | Analysis results | If confidence &lt; 0.6, suggest “Retake in better light for a more accurate result.” |

---

## 4. Quick checklist (per scan)

- User sees “Tips for Best Results” (upload) and “Face the light” (step/camera).
- Photo passes face and optional quality checks.
- Backend runs with updated prompts → structured, consistent, actionable JSON.
- Results show scores, concerns with areas, and specific recommendations; optional: confidence and retake hint.

---

*Last updated: Feb 2026. Align with Skin-Analysis-AI.md and openai_vision_service.py.*
