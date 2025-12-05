# Sprint 2: Face Scan & AI Analysis

## Document Metadata

- **Sprint:** 2
- **Sprint Duration:** December 13-26, 2025 (2 weeks / 14 days)
- **Sprint Theme:** AI-powered face scanning with real-time skin analysis
- **Status:** Planned
- **Document Owner:** Product & Development Team
- **Last Updated:** December 5, 2025

## Executive Summary

Sprint 2 delivers the core AI-powered face scanning capability, including guided camera UI, face detection, AI skin concern analysis across 9 categories, confidence scoring, and fairness monitoring across diverse skin tones (Fitzpatrick I-VI). Every story is **100% traceable** to SRS V5 Enhanced requirements and Product Backlog V5 EPIC 2, with **zero scope creep**.

### Sprint Objectives

1. **Implement guided face scan UI** with real-time lighting feedback (web, iOS, Android)
2. **Integrate face detection ML model** for facial landmark extraction
3. **Deploy AI skin concern detection** across 9 concern categories
4. **Establish confidence scoring system** with uncertainty handling
5. **Implement fairness monitoring** for bias detection across Fitzpatrick skin types

### Key Deliverables

- Guided face scan camera UI (cross-platform)
- Face detection and landmark extraction pipeline
- AI skin analysis model (9 concern categories)
- Confidence scoring and uncertainty quantification
- Fairness monitoring dashboard
- API endpoints for ML inference
- Comprehensive test suite (unit, integration, E2E)

## SRS V5 Alignment Table

| Sprint 2 Deliverable | SRS Requirement IDs | Requirement Description |
|---------------------|---------------------|-------------------------|
| Guided Face Scan UI | UR2, FR6, FR7, NFR1, NFR17 | Capture face image, real-time feedback, cross-platform consistency |
| Face Detection & Landmarks | FR6, FR8, NFR1, NFR2 | Detect face region, extract landmarks, <4s latency |
| AI Skin Concern Detection | UR2, FR9A, FR9B, NFR1, NFR3 | Analyze 9 concern categories, <4s inference, accuracy metrics |
| Confidence Scoring | FR9B, NFR12 | Uncertainty quantification, threshold-based validation |
| Fairness Monitoring | NFR12, BR13 | Bias detection across Fitzpatrick I-VI, <5% variance target |

## Product Backlog V5 Alignment Table

| Sprint 2 Story | Epic | Backlog Story ID | Story Points | Priority |
|---------------|------|------------------|--------------|----------|
| Guided Face Scan UI | EPIC 2 | 2.1 | 8 | CRITICAL |
| Face Detection & Landmarks | EPIC 2 | 2.2 | 13 | CRITICAL |
| AI Skin Concern Detection | EPIC 2 | 2.3 | 13 | CRITICAL |
| Confidence Scoring | EPIC 2 | 2.4 | 5 | CRITICAL |
| Fairness Monitoring | EPIC 2 | 2.5 | 5 | CRITICAL |
| **TOTAL SPRINT 2** | **44 points** |

## Sprint 2 User Stories

### Story 2.1: Guided Face Scan UI

**As a** user  
**I want to** capture my face image with real-time guidance and feedback  
**So that** I can ensure optimal image quality for accurate AI analysis

#### SRS Traceability

- **UR2:** Capture face for AI analysis using device camera
- **FR6:** System should display real-time feedback on face position, lighting, and occlusion
- **FR7:** Capture high-resolution front-facing image (minimum 1080p)
- **NFR1:** Face scan latency <4 seconds (capture + upload)
- **NFR17:** Cross-platform parity across web, iOS, Android

#### Acceptance Criteria (15 total)

1. **Camera initialization:**
   - Request camera permission on first use
   - Display permission rationale before request (iOS/Android)
   - Handle permission denied gracefully (show alternative flow)
   - Support front-facing camera selection
   - Minimum resolution: 1920x1080 (1080p)

2. **Real-time face detection overlay:**
   - Detect face bounding box in real-time
   - Display oval guide overlay for face positioning
   - Visual feedback when face is centered (green border)
   - Warning when face is off-center (yellow border)
   - Error when no face detected (red border + message)

3. **Lighting quality feedback:**
   - Analyze frame brightness in real-time
   - Display "Too dark" warning if brightness <30%
   - Display "Too bright" warning if brightness >85%
   - Display "Good lighting" indicator when optimal (30-85%)
   - Suggest user move to better lit area

4. **Occlusion detection:**
   - Detect sunglasses/glasses occlusion
   - Detect hand/object occlusion
   - Detect hair covering face
   - Display "Remove accessories" message
   - Block capture if critical occlusion detected

5. **Distance guidance:**
   - Detect if face too close (>40% of frame)
   - Detect if face too far (<15% of frame)
   - Display distance feedback ("Move closer" / "Move back")
   - Optimal face size: 20-35% of frame height

6. **Capture flow:**
   - Auto-capture when all conditions met (3-second countdown)
   - Manual capture button always available
   - Haptic/audio feedback on capture (iOS/Android)
   - Display captured image for review
   - "Retake" and "Use This Photo" options

7. **Image processing:**
   - Compress image to <2MB for upload
   - Maintain aspect ratio
   - Store original resolution locally
   - Generate thumbnail (256x256) for UI

8. **Error handling:**
   - Handle camera initialization failure
   - Handle network errors during upload
   - Retry mechanism (3 attempts with exponential backoff)
   - Offline mode: queue for later upload

9. **Accessibility:**
   - VoiceOver/TalkBack announcements for all feedback
   - Screen reader describes capture status
   - Haptic feedback for visual indicators
   - High contrast mode support

10. **Performance:**
    - Frame processing at ≥15 FPS
    - Face detection latency <100ms per frame
    - Total capture flow <4 seconds (NFR1)
    - Memory usage <100MB during scan

11. **Privacy:**
    - No image stored until user confirms
    - Option to delete captured image
    - Clear indication of upload status
    - User can disable image storage (FR44)

12. **Cross-platform consistency:**
    - Same UI layout on web, iOS, Android
    - Platform-native camera APIs (WebRTC, AVFoundation, CameraX)
    - Consistent feedback messages

13. **Tutorial/onboarding:**
    - First-time users see tutorial overlay
    - Explain each feedback indicator
    - "Skip tutorial" option
    - Tutorial can be re-accessed from settings

14. **Analytics tracking:**
    - Track capture success rate
    - Track average time to capture
    - Track rejection reasons (lighting, occlusion, etc.)
    - Track retake frequency

15. **Edge cases:**
    - Multiple faces detected: prompt to scan alone
    - No face detected after 30 seconds: show help
    - Device orientation changes: maintain state
    - App backgrounded during scan: save state

### Story 2.2: Face Detection & Landmark Extraction

**As a** system  
**I want to** detect facial landmarks and extract key regions  
**So that** I can perform accurate spatial skin analysis

#### SRS Traceability

- **FR6:** Face detection with bounding box and landmarks
- **FR8:** Extract 468 facial landmarks for spatial analysis
- **NFR1:** Total ML inference time <4 seconds
- **NFR2:** Face detection accuracy ≥95% across diverse skin tones

#### Acceptance Criteria (12 total)

1. **Face detection model:**
   - Use MediaPipe Face Mesh or TensorFlow.js FaceMesh
   - Detect single face per image
   - Return bounding box coordinates (x, y, width, height)
   - Confidence score for face detection
   - Handle multiple faces: use largest/centered face

2. **Landmark extraction:**
   - Extract 468 3D facial landmarks
   - Normalize coordinates to image dimensions
   - Z-depth estimation for 3D structure
   - Return landmarks in standardized format (JSON)

3. **Region mapping:**
   - Map landmarks to 7 facial regions:
     - Forehead (zone 1)
     - Left cheek (zone 2)
     - Right cheek (zone 3)
     - Nose (zone 4)
     - Chin (zone 5)
     - Under-eye left (zone 6)
     - Under-eye right (zone 7)
   - Generate region masks for spatial analysis
   - Store region polygons for visualization

4. **Quality validation:**
   - Minimum face size: 256x256 pixels
   - Maximum rotation: ±15 degrees (pitch, yaw, roll)
   - Reject if face partially out of frame
   - Reject if landmark confidence <0.7

5. **Performance:**
   - Inference time <500ms on device (mobile)
   - Inference time <300ms on server (GPU)
   - Model size <10MB (mobile deployment)
   - Memory footprint <50MB during inference

6. **Error handling:**
   - No face detected: return error with message
   - Multiple faces: select primary face or error
   - Low quality image: request retake
   - Model loading failure: fallback to server inference

7. **Model versioning:**
   - Tag inference results with model version
   - Support A/B testing of model versions
   - Gradual rollout capability

8. **Fairness validation:**
   - Test accuracy across Fitzpatrick I-VI
   - Target: <5% variance in landmark accuracy
   - Maintain dataset with diverse skin tones

9. **Output format:**
   - Standardized JSON schema
   - Include metadata (timestamp, model version, confidence)
   - Face bounding box
   - 468 landmarks with (x, y, z, confidence)
   - 7 region masks

10. **Integration:**
    - RESTful API endpoint: POST /api/v1/face/detect
    - Support batch processing (up to 5 images)
    - WebSocket support for real-time streaming

11. **Caching:**
    - Cache detection results for 24 hours
    - Deduplicate identical images
    - Invalidate cache on model update

12. **Monitoring:**
    - Log inference latency
    - Track success/failure rates
    - Alert on accuracy degradation
    - Monitor fairness metrics

### Story 2.3: AI Skin Concern Detection

**As a** user  
**I want to** receive AI-powered analysis of my skin concerns  
**So that** I can understand my skin condition and receive personalized recommendations

#### SRS Traceability

- **UR2:** AI analysis detecting multiple concerns simultaneously
- **FR9A:** Detect 9 concern categories (acne, redness, pigmentation, texture, pores, wrinkles, dark circles, dryness, oiliness)
- **FR9B:** Return severity scores (0-100) with confidence intervals
- **NFR1:** Total inference time <4 seconds
- **NFR3:** Model accuracy ≥80% on validation set, precision ≥75%, recall ≥70%

#### Acceptance Criteria (14 total)

1. **Concern categories (9 total):**
   - **Acne:** Active lesions, comedones, inflammation
   - **Redness:** Erythema, inflammation, rosacea indicators
   - **Pigmentation:** Hyperpigmentation, dark spots, melasma
   - **Texture:** Roughness, unevenness, scarring
   - **Pores:** Enlarged pores, visibility, congestion
   - **Wrinkles:** Fine lines, deep wrinkles, crow's feet
   - **Dark circles:** Under-eye pigmentation and shadows
   - **Dryness:** Flakiness, dehydration indicators
   - **Oiliness:** Shine, sebum production indicators

2. **Severity scoring:**
   - Each concern rated 0-100 (continuous scale)
   - 0 = None/Not detected
   - 1-30 = Mild
   - 31-60 = Moderate
   - 61-100 = Severe
   - Include confidence interval (±)

3. **Multi-concern detection:**
   - Analyze all 9 concerns simultaneously
   - Support overlapping concerns (e.g., acne + redness)
   - Rank concerns by severity
   - Highlight top 3 primary concerns

4. **Spatial analysis:**
   - Per-region scores (forehead, cheeks, nose, chin, under-eye)
   - Generate heatmaps for visualization
   - Identify concern location (e.g., "acne on forehead and chin")

5. **ML model architecture:**
   - CNN-based classification + regression
   - Multi-task learning (9 concern heads)
   - Input: 512x512 RGB face image + landmarks
   - Output: 9 severity scores + confidence + spatial maps

6. **Training data requirements:**
   - Minimum 10,000 labeled images per concern
   - Diverse Fitzpatrick I-VI representation (balanced)
   - Age diversity: 18-65+
   - Gender diversity
   - Lighting variations

7. **Model performance targets:**
   - Inference time: <2 seconds (GPU), <3 seconds (CPU)
   - Model size: <50MB
   - Accuracy (per concern): ≥80%
   - Precision: ≥75%
   - Recall: ≥70%
   - F1-score: ≥72%

8. **Confidence thresholds:**
   - Display result only if confidence >0.6
   - Flag low confidence (<0.6) with "Uncertain" label
   - Suggest retake if multiple low-confidence concerns

9. **Explainability:**
   - GradCAM heatmaps showing model attention
   - Human-readable explanations per concern
   - Example: "Detected moderate acne due to inflammatory lesions on forehead"
   - Link to educational resources

10. **Comparison with baseline:**
    - Compare current scan with previous scans
    - Show trend (improving/worsening/stable)
    - Percentage change since last scan
    - Visualize progress over time

11. **Output format:**
    - JSON schema with:
      - Scan ID, timestamp, user ID
      - Model version
      - 9 concern scores (severity + confidence)
      - Spatial heatmaps (Base64 PNG)
      - Top 3 primary concerns
      - Explanations

12. **API integration:**
    - POST /api/v1/scan/analyze
    - Request: image + landmarks + user profile
    - Response: analysis results
    - Async processing with webhook callback

13. **Error handling:**
    - Model inference failure: retry with fallback model
    - Invalid input: return validation errors
    - Timeout (>10s): return partial results
    - Log all errors for debugging

14. **Monitoring:**
    - Track inference latency (p50, p95, p99)
    - Monitor model drift (accuracy over time)
    - Track concern distribution
    - Alert on anomalies

### Story 2.4: Confidence Scoring & Uncertainty Handling

**As a** system  
**I want to** quantify prediction uncertainty and filter low-confidence results  
**So that** users receive only reliable analysis results

#### SRS Traceability

- **FR9B:** Provide confidence scores with all predictions
- **NFR12:** Model explainability with confidence intervals

#### Acceptance Criteria (10 total)

1. **Confidence calculation:**
   - Per-concern confidence score (0-1)
   - Based on model softmax output
   - Calibrated using validation set
   - Account for prediction variance

2. **Uncertainty quantification:**
   - Aleatoric uncertainty (data noise)
   - Epistemic uncertainty (model knowledge)
   - Combined total uncertainty
   - Confidence intervals (± standard deviation)

3. **Threshold management:**
   - High confidence: >0.8 (display with "High confidence")
   - Medium confidence: 0.6-0.8 (display normally)
   - Low confidence: <0.6 (flag as "Uncertain")
   - Very low confidence: <0.4 (hide result, suggest retake)

4. **User communication:**
   - Visual confidence indicator (3-level badge)
   - Explanation of confidence level
   - Suggestion for improvement (better lighting, retake)
   - Link to support/FAQ

5. **Fallback behavior:**
   - If all concerns <0.6: show "Unable to analyze"
   - Suggest common issues (lighting, occlusion, distance)
   - Option to retake immediately
   - Option to skip and continue

6. **Confidence factors:**
   - Image quality score
   - Lighting quality score
   - Landmark detection confidence
   - Model training data coverage

7. **Historical tracking:**
   - Track confidence distribution over time
   - Identify patterns in low-confidence results
   - Use for model improvement

8. **A/B testing:**
   - Test different confidence thresholds
   - Measure impact on user satisfaction
   - Optimize threshold values

9. **Output format:**
   - Include per-concern confidence
   - Include overall scan confidence
   - Include uncertainty estimates
   - Include confidence factors breakdown

10. **Monitoring:**
    - Track low-confidence rate
    - Alert if >20% low confidence
    - Analyze failure patterns
    - Feed back to model training

### Story 2.5: Fairness Monitoring & Bias Detection

**As a** ML engineer  
**I want to** monitor model performance across diverse skin tones  
**So that** we ensure equitable accuracy for all users

#### SRS Traceability

- **NFR12:** Model fairness across demographics
- **BR13:** Avoid bias in AI models (Fitzpatrick I-VI)

#### Acceptance Criteria (12 total)

1. **Fitzpatrick classification:**
   - Type I: Very fair (always burns, never tans)
   - Type II: Fair (usually burns, tans with difficulty)
   - Type III: Medium (sometimes burns, tans gradually)
   - Type IV: Olive (rarely burns, tans easily)
   - Type V: Brown (very rarely burns, tans very easily)
   - Type VI: Deep brown/black (never burns, tans very easily)
   - Automatic classification from image
   - User self-reported option

2. **Performance parity metrics:**
   - Accuracy variance across types <5%
   - Precision variance <5%
   - Recall variance <5%
   - False positive rate variance <3%
   - False negative rate variance <3%

3. **Training data balance:**
   - Each Fitzpatrick type: minimum 15% of dataset
   - Target: 16.67% per type (balanced)
   - Monitor data distribution
   - Alert if imbalance >10%

4. **Validation strategy:**
   - Separate validation set per Fitzpatrick type
   - Stratified sampling
   - Report metrics per type
   - Overall fairness score

5. **Bias detection:**
   - Automated bias testing in CI/CD
   - Run on every model update
   - Block deployment if variance >5%
   - Generate fairness report

6. **Mitigation strategies:**
   - Data augmentation for underrepresented types
   - Reweighting loss function
   - Adversarial debiasing
   - Ensemble methods

7. **Monitoring dashboard:**
   - Real-time metrics per Fitzpatrick type
   - Accuracy trends over time
   - Confusion matrices per type
   - Alert on degradation

8. **User impact:**
   - Track user satisfaction by skin tone
   - Survey users on perceived fairness
   - Monitor dropout rates
   - Measure engagement by demographic

9. **Transparency:**
   - Publish fairness metrics publicly
   - Include in AI transparency screen
   - Explain limitations
   - Commit to ongoing improvement

10. **Intersectionality:**
    - Consider age × skin tone
    - Consider gender × skin tone
    - Consider concern × skin tone
    - Ensure equitable performance across intersections

11. **Feedback loop:**
    - Collect user-reported inaccuracies
    - Tag with Fitzpatrick type
    - Prioritize fixes for underperforming groups
    - Retrain with corrected data

12. **Reporting:**
    - Monthly fairness report to stakeholders
    - Quarterly public transparency report
    - Include metrics, trends, actions taken
    - Set improvement targets

## Definition of Done (DoD)

### Code Quality

- [ ] All code reviewed by ≥1 team member
- [ ] Unit test coverage ≥80% (backend ML), ≥70% (frontend)
- [ ] Integration tests pass on all platforms
- [ ] E2E tests pass (camera capture → analysis → results)
- [ ] No critical/high severity bugs
- [ ] Model performance meets NFR targets
- [ ] Code follows team style guide

### Functionality

- [ ] All acceptance criteria met and verified
- [ ] Cross-platform testing complete (web, iOS, Android)
- [ ] Camera permissions handled correctly
- [ ] Face detection works across diverse faces
- [ ] AI analysis accuracy ≥80%
- [ ] Performance targets met (NFR1-3)

### ML/AI Quality

- [ ] Model trained on balanced dataset (Fitzpatrick I-VI)
- [ ] Fairness metrics within targets (<5% variance)
- [ ] Confidence calibration validated
- [ ] Explainability features implemented
- [ ] Model versioning and rollback tested

### Security & Privacy

- [ ] Image upload encrypted (TLS 1.3)
- [ ] Face images stored with user consent only
- [ ] GDPR compliance verified (data export, deletion)
- [ ] No biometric data leakage
- [ ] Audit logging implemented

### Documentation

- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] ML model card published
- [ ] User-facing help text written
- [ ] Fairness transparency report drafted
- [ ] Release notes drafted

### Deployment

- [ ] Deployed to staging environment
- [ ] QA sign-off obtained
- [ ] Product owner demo complete
- [ ] A/B test plan ready (if applicable)
- [ ] Rollback plan documented

## Sprint Timeline

| Date | Milestone | Owner | Status |
|------|-----------|-------|--------|
| Dec 13, 10:00 AM | Sprint 2 Kickoff & Planning | Team | ⏳ Scheduled |
| Dec 13-14 | ML model architecture design | ML Engineers | ⏳ Pending |
| Dec 15-16 | Camera UI implementation (all platforms) | Frontend + Mobile | ⏳ Pending |
| Dec 17-18 | Face detection integration | Backend + ML | ⏳ Pending |
| Dec 19-20 | AI skin analysis model training/integration | ML Engineers | ⏳ Pending |
| Dec 21-22 | Confidence scoring & fairness monitoring | ML Engineers | ⏳ Pending |
| Dec 23-24 | Cross-platform testing & bug fixes | QA + Devs | ⏳ Pending |
| Dec 25 | Buffer day for issues | Team | ⏳ Pending |
| Dec 26 | Sprint demo & retrospective | Team | ⏳ Pending |

## Technical Architecture

### ML Model Pipeline

```
User Face Image (1080p+)
    ↓
[Preprocessing]
    ├─ Resize to 512x512
    ├─ Normalize (0-1)
    ├─ Color correction
    └─ Face alignment
    ↓
[Face Detection Module]
    ├─ MediaPipe FaceMesh / TensorFlow.js
    ├─ Extract 468 landmarks
    ├─ Calculate bounding box
    └─ Quality validation
    ↓
[Skin Analysis CNN]
    ├─ ResNet-50 backbone
    ├─ Multi-task head (9 concerns)
    ├─ Spatial attention layers
    └─ Confidence estimation
    ↓
[Post-processing]
    ├─ Severity scoring (0-100)
    ├─ Confidence calibration
    ├─ Spatial heatmap generation
    └─ Explanation generation
    ↓
[Results]
    ├─ 9 concern scores + confidence
    ├─ Top 3 primary concerns
    ├─ Spatial visualizations
    └─ Human-readable explanations
```

### Database Schema Updates

```sql
-- Face scans table
CREATE TABLE face_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Image storage
  image_url TEXT, -- S3/CloudStorage URL
  image_hash VARCHAR(64) UNIQUE, -- SHA-256 for deduplication
  image_size_bytes INTEGER,
  
  -- Face detection results
  face_bbox JSONB, -- {x, y, width, height}
  landmarks JSONB, -- Array of 468 {x, y, z, confidence}
  face_quality_score FLOAT, -- 0-1
  
  -- Metadata
  device_type VARCHAR(50), -- web, ios, android
  camera_resolution VARCHAR(20), -- e.g., "1920x1080"
  lighting_score FLOAT, -- 0-1
  
  -- Model version
  face_model_version VARCHAR(20),
  analysis_model_version VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_face_scans_user_date (user_id, scan_date DESC),
  INDEX idx_face_scans_image_hash (image_hash)
);

-- Skin analysis results table
CREATE TABLE skin_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES face_scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Concern scores (9 categories)
  acne_severity FLOAT, -- 0-100
  acne_confidence FLOAT, -- 0-1
  acne_explanation TEXT,
  
  redness_severity FLOAT,
  redness_confidence FLOAT,
  redness_explanation TEXT,
  
  pigmentation_severity FLOAT,
  pigmentation_confidence FLOAT,
  pigmentation_explanation TEXT,
  
  texture_severity FLOAT,
  texture_confidence FLOAT,
  texture_explanation TEXT,
  
  pores_severity FLOAT,
  pores_confidence FLOAT,
  pores_explanation TEXT,
  
  wrinkles_severity FLOAT,
  wrinkles_confidence FLOAT,
  wrinkles_explanation TEXT,
  
  dark_circles_severity FLOAT,
  dark_circles_confidence FLOAT,
  dark_circles_explanation TEXT,
  
  dryness_severity FLOAT,
  dryness_confidence FLOAT,
  dryness_explanation TEXT,
  
  oiliness_severity FLOAT,
  oiliness_confidence FLOAT,
  oiliness_explanation TEXT,
  
  -- Overall metrics
  overall_confidence FLOAT, -- Average of all concerns
  primary_concerns TEXT[], -- Top 3 concern names
  
  -- Spatial data
  concern_heatmaps JSONB, -- Base64 encoded PNG images
  region_scores JSONB, -- Per-region breakdown
  
  -- Fairness tracking
  fitzpatrick_type INTEGER, -- 1-6 (auto-detected)
  fitzpatrick_user_reported INTEGER, -- 1-6 (optional)
  
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_analyses_scan (scan_id),
  INDEX idx_analyses_user_date (user_id, created_at DESC),
  INDEX idx_analyses_fitzpatrick (fitzpatrick_type)
);

-- Model performance tracking
CREATE TABLE ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version VARCHAR(20) NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Overall metrics
  total_inferences INTEGER,
  avg_latency_ms FLOAT,
  p95_latency_ms FLOAT,
  p99_latency_ms FLOAT,
  
  -- Accuracy metrics (updated from validation)
  accuracy FLOAT,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,
  
  -- Fairness metrics per Fitzpatrick type
  fairness_metrics JSONB, -- {type1: {acc, prec, rec}, ...}
  max_accuracy_variance FLOAT,
  
  -- Confidence distribution
  low_confidence_rate FLOAT, -- % of predictions with conf <0.6
  avg_confidence FLOAT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (model_version, metric_date)
);
```

### API Endpoints

#### Face Scan Endpoints

```
POST /api/v1/scan/capture
  - Upload face image for analysis
  - Request: multipart/form-data (image file)
  - Response: {scan_id, upload_url, status}
  
GET /api/v1/scan/{scan_id}
  - Get scan details and status
  - Response: {scan_id, status, created_at, ...}
  
DELETE /api/v1/scan/{scan_id}
  - Delete scan and associated data
  - Response: {success, message}
```

#### Face Detection Endpoints

```
POST /api/v1/face/detect
  - Detect face and extract landmarks
  - Request: {image_url OR image_base64}
  - Response: {
      face_bbox: {x, y, width, height},
      landmarks: [{x, y, z, confidence}, ...],
      quality_score: 0.95,
      regions: [{name, polygon}, ...]
    }
```

#### AI Analysis Endpoints

```
POST /api/v1/analysis/analyze
  - Run AI skin concern analysis
  - Request: {
      scan_id: "uuid",
      user_profile: {...}, // Optional for personalization
      options: {include_heatmaps: true}
    }
  - Response: {
      analysis_id: "uuid",
      concerns: [
        {
          name: "acne",
          severity: 45.2,
          confidence: 0.87,
          explanation: "Detected moderate acne...",
          spatial_data: {regions: [...], heatmap: "base64..."}
        },
        ...
      ],
      primary_concerns: ["acne", "redness", "texture"],
      overall_confidence: 0.82,
      fitzpatrick_type: 3,
      model_version: "v2.1.0",
      processing_time_ms: 2340
    }
    
GET /api/v1/analysis/{analysis_id}
  - Get analysis results
  
GET /api/v1/analysis/history
  - Get user's analysis history
  - Query params: ?limit=10&offset=0&sort=desc
  
GET /api/v1/analysis/compare
  - Compare two analyses
  - Query params: ?scan_id_1=uuid&scan_id_2=uuid
  - Response: {
      scan_1: {...},
      scan_2: {...},
      changes: [
        {concern: "acne", change: -12.5, trend: "improving"},
        ...
      ]
    }
```

#### ML Model Endpoints (Internal)

```
GET /api/v1/ml/model/info
  - Get current model version and metadata
  
GET /api/v1/ml/model/metrics
  - Get model performance metrics
  - Query params: ?version=v2.1.0&date=2025-12-13
  
GET /api/v1/ml/fairness/report
  - Get fairness metrics report
  - Response: {
      model_version: "v2.1.0",
      fitzpatrick_metrics: [...],
      max_variance: 0.042,
      passed: true
    }
```

## Testing Strategy

### Unit Tests (Target: ≥80% backend ML, ≥70% frontend)

**Backend ML:**
- Face detection pipeline unit tests
- Landmark extraction accuracy tests
- Concern detection per category
- Confidence calibration tests
- Fairness metric calculations
- API request/response validation

**Frontend/Mobile:**
- Camera initialization tests
- Permission handling tests
- Real-time feedback logic tests
- Image compression tests
- UI component rendering tests

### Integration Tests

- End-to-end face scan flow (capture → detect → analyze)
- API integration (frontend/mobile → backend → ML)
- Database persistence (scans, analyses)
- Cross-platform camera APIs (WebRTC, AVFoundation, CameraX)
- Model versioning and rollback

### ML Model Tests

- Validation set accuracy (≥80% per concern)
- Fairness tests (Fitzpatrick I-VI, variance <5%)
- Confidence calibration validation
- Performance benchmarks (latency <4s)
- Adversarial testing (edge cases, occlusions)

### End-to-End Tests (Playwright, Detox)

1. **Happy path:**
   - User opens camera → captures face → receives analysis → views results
2. **Error handling:**
   - Permission denied → shows alternative flow
   - Poor lighting → shows feedback → retake
   - No face detected → shows help
3. **Cross-platform:**
   - Same flow on web, iOS, Android
   - Verify UI consistency

### Performance Tests

- API latency benchmarks (p50, p95, p99)
- ML inference time (<4s total)
- Camera frame processing rate (≥15 FPS)
- Memory usage during scan (<100MB)
- Concurrent user load testing (100+ simultaneous scans)

### Security Tests

- Image upload encryption (TLS 1.3)
- API authentication/authorization
- SQL injection prevention
- XSS prevention
- GDPR compliance (data export/deletion)

## Risks & Mitigation

| Risk ID | Risk Description | Impact | Probability | Mitigation Strategy | Owner |
|---------|-----------------|--------|-------------|---------------------|-------|
| R2-1 | ML model bias >5% variance across skin tones | Critical | Medium | Balanced training data, fairness testing in CI, block deployment if fails | ML Lead |
| R2-2 | Training data insufficient/poor quality | Critical | Medium | Partner with dermatology institutions, data quality validation, synthetic data augmentation | ML Lead |
| R2-3 | Camera permission denial rate >20% | High | Medium | Clear value proposition, educational onboarding, alternative upload flow | Product Lead |
| R2-4 | ML inference latency >4 seconds | High | Low | GPU acceleration, model optimization (quantization, pruning), caching | Backend Lead |
| R2-5 | Poor lighting degrades accuracy | High | Medium | Real-time lighting feedback, reject scans below threshold, educational tips | Frontend Lead |
| R2-6 | Privacy concerns with face image storage | Critical | Low | Explicit consent, local processing option, encrypted storage, GDPR compliance | Product/Security Lead |
| R2-7 | Cross-platform camera API inconsistencies | Medium | Medium | Platform-specific testing, fallback mechanisms, thorough documentation | Mobile Lead |
| R2-8 | Model drift over time (accuracy degradation) | High | Low | Continuous monitoring, automated alerts, retraining pipeline, A/B testing | ML Lead |

## Prerequisites & Dependencies

### Sprint 1.2 Completion (MANDATORY)

- ☑ User authentication and session management
- ☑ User profile baseline captured
- ☑ GDPR consent framework
- ☑ Backend API infrastructure
- ☑ Frontend/mobile foundation
- ☑ Database schema and migrations

### Training Data Acquisition (CRITICAL)

- 🟡 Minimum 90,000 labeled face images (10k per concern)
- 🟡 Balanced Fitzpatrick I-VI representation
- 🟡 Dermatologist-validated labels
- 🟡 Data licensing agreements signed
- 🟡 Ethics review board approval

### ML Infrastructure

- 🟡 GPU instances provisioned (AWS p3.2xlarge or equivalent)
- 🟡 ML model training pipeline set up
- 🟡 Model registry configured (MLflow or similar)
- 🟡 A/B testing framework ready

### Platform-Specific

- 🟡 Camera permissions configured (iOS: Info.plist, Android: manifest)
- 🟡 TensorFlow.js / MediaPipe SDKs integrated
- 🟡 Image storage (S3/CloudStorage) configured

## Sprint Retrospective (To be completed Dec 26)

### What Went Well

- TBD after sprint completion

### What Could Be Improved

- TBD after sprint completion

### Action Items for Next Sprint

- TBD after sprint completion

## Appendix A: SRS Requirement Coverage

| Requirement ID | Description | Sprint 2 Coverage |
|----------------|-------------|-------------------|
| UR2 | Face scan for AI analysis | ✅ Story 2.1 (Guided Scan UI) |
| FR6 | Real-time face positioning feedback | ✅ Story 2.1 |
| FR7 | High-resolution front-facing image capture | ✅ Story 2.1 |
| FR8 | Extract 468 facial landmarks | ✅ Story 2.2 (Face Detection) |
| FR9A | Detect 9 concern categories | ✅ Story 2.3 (AI Analysis) |
| FR9B | Severity scores with confidence | ✅ Story 2.3, 2.4 |
| NFR1 | Face scan latency <4 seconds | ✅ All stories (performance target) |
| NFR2 | Face detection accuracy ≥95% | ✅ Story 2.2 |
| NFR3 | Model accuracy ≥80%, precision ≥75%, recall ≥70% | ✅ Story 2.3 |
| NFR12 | Model fairness & explainability | ✅ Story 2.4, 2.5 |
| BR13 | Avoid bias across skin tones | ✅ Story 2.5 (Fairness Monitoring) |
| NFR17 | Cross-platform parity | ✅ All stories |

## Appendix B: ML Model Card Template

### Model Details

- **Model Name:** SkinConcern Analyzer v2.0
- **Model Type:** Multi-task CNN (ResNet-50 backbone)
- **Input:** 512x512 RGB face image + 468 landmarks
- **Output:** 9 concern severity scores (0-100) + confidence (0-1)
- **Training Date:** TBD (Sprint 2)
- **Model Version:** v2.0.0

### Intended Use

- **Primary Use:** Analyze facial skin concerns for personalized skincare recommendations
- **Out-of-Scope:** Medical diagnosis, age estimation, identity verification
- **Target Users:** Adults 18+ with skin concerns

### Training Data

- **Size:** 90,000+ labeled images
- **Demographics:** Balanced Fitzpatrick I-VI, ages 18-65+, diverse genders
- **Labeling:** Dermatologist-validated severity scores
- **Data Sources:** [TBD - partner institutions]

### Performance Metrics

| Concern | Accuracy | Precision | Recall | F1-Score |
|---------|----------|-----------|--------|----------|
| Acne | TBD | TBD | TBD | TBD |
| Redness | TBD | TBD | TBD | TBD |
| Pigmentation | TBD | TBD | TBD | TBD |
| Texture | TBD | TBD | TBD | TBD |
| Pores | TBD | TBD | TBD | TBD |
| Wrinkles | TBD | TBD | TBD | TBD |
| Dark Circles | TBD | TBD | TBD | TBD |
| Dryness | TBD | TBD | TBD | TBD |
| Oiliness | TBD | TBD | TBD | TBD |

### Fairness Metrics

| Fitzpatrick Type | Accuracy | Accuracy Variance |
|------------------|----------|-------------------|
| Type I | TBD | TBD |
| Type II | TBD | TBD |
| Type III | TBD | TBD |
| Type IV | TBD | TBD |
| Type V | TBD | TBD |
| Type VI | TBD | TBD |
| **Max Variance** | **Target: <5%** |

### Ethical Considerations

- **Bias Mitigation:** Balanced training data, adversarial debiasing, continuous monitoring
- **Privacy:** No biometric identification, explicit consent, encrypted storage
- **Transparency:** Model explanations, confidence scores, fairness reports published
- **Limitations:** Not a medical device, cannot diagnose diseases, accuracy varies with image quality

## Appendix C: Camera Implementation Notes

### Web (WebRTC)

```javascript
// Request camera access
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'user',
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
});

// Capture frame
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0);
const imageData = canvas.toDataURL('image/jpeg', 0.9);
```

### iOS (AVFoundation)

```swift
import AVFoundation

let captureSession = AVCaptureSession()
captureSession.sessionPreset = .hd1920x1080

guard let frontCamera = AVCaptureDevice.default(
    .builtInWideAngleCamera,
    for: .video,
    position: .front
) else { return }

let input = try AVCaptureDeviceInput(device: frontCamera)
captureSession.addInput(input)

let photoOutput = AVCapturePhotoOutput()
captureSession.addOutput(photoOutput)
captureSession.startRunning()
```

### Android (CameraX)

```kotlin
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture

val cameraSelector = CameraSelector.Builder()
    .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
    .build()

val imageCapture = ImageCapture.Builder()
    .setTargetResolution(Size(1920, 1080))
    .build()

cameraProvider.bindToLifecycle(
    this,
    cameraSelector,
    imageCapture
)
```

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _________ | _____ | _____ |
| Tech Lead | _________ | _____ | _____ |
| ML Lead | _________ | _____ | _____ |
| Frontend Lead | _________ | _____ | _____ |
| Backend Lead | _________ | _____ | _____ |
| Mobile Lead (iOS) | _________ | _____ | _____ |
| Mobile Lead (Android) | _________ | _____ | _____ |
| QA Lead | _________ | _____ | _____ |
| Security Lead | _________ | _____ | _____ |

---

**Document Version:** 1.0  
**Last Updated:** December 5, 2025  
**Next Review:** December 26, 2025 (Sprint 2 Close)  
**Status:** PLANNED - Ready for Sprint 2 Kickoff

**END OF SPRINT 2 DOCUMENT**
