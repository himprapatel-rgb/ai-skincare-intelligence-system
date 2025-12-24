# SPRINT 1: CORE MVP DEVELOPMENT
# AI Skincare Intelligence System - First Feature Slice

**Project:** AI Skincare Intelligence System  
**Sprint:** Sprint 1 - Core MVP Development  
**Duration:** 2 weeks (10 business days)  
**Status:** Development Phase  
**Last Updated:** December 1, 2025

---

## Executive Summary

Sprint 1 is the first development sprint following the completion of Sprint 0 foundations. This sprint delivers a minimum viable product (MVP) slice: a functional prototype where users can register, log in, capture face images, upload them to the backend, receive simulated ML analysis results, and view those results in a clean UI.

By the end of Sprint 1, the AI Skincare Intelligence System will have a working, demonstrable prototype that validates the core user journey: registration → skin profile onboarding → scan capture → ML analysis → result display → data persistence.

---

## Sprint 1 Context & Strategic Goals

### Why Sprint 1?

Sprint 0 has completed all foundational work:
- ✅ Technical environment is live (Render, Neon, Cloudflare R2, GitHub Actions)
- ✅ Team workflows and ceremonies established
- ✅ Database schema and API architecture defined
- ✅ Design system and wireframes approved
- ✅ ML datasets bootstrapped and ready for training

Sprint 1 builds the first real features on top of these foundations.

### Sprint 1 Goals (Primary)

1. **Deliver User Accounts** - Secure registration, login, password reset, JWT token management
2. **Implement Scan Flow** - Camera UI, face alignment helper, image capture/upload to R2
3. **Create ML Stub API** - Backend returns simulated skin analysis scores (redness, acne, pigmentation, dehydration, sensitivity, confidence)
4. **Store & Retrieve Data** - User and scan metadata persisted in Neon PostgreSQL with proper indexing
5. **Build Core UI** - Navigation, result display, responsive design using design tokens
6. **Ensure Quality** - Unit tests (≥80% critical path), integration tests, staged deployment, zero critical Sentry errors

---

## Optimization Principles

- **Time-box to 2 weeks** - Fixed sprint duration forces prioritization and delivery discipline
- **Stub-first approach** - Use simulated ML results so frontend and backend develop in parallel (stub designed to swap with real model in Sprint 2 without UI changes)
- **Definition of Done enforcement** - Every feature must pass code review, peer-reviewed tests, staging deployment, and QA sign-off
- **JWT Security First** - Implement secure token-based auth (bcrypt hashing, httpOnly cookies, token blacklist) from Sprint 1 to avoid rework
- **Daily standups** - Catch blockers early & maintain team alignment
- **Zero critical blockers gate** - Sprint 1 closes only when all stories meet DoD and all acceptance criteria verified

---

## Sprint 1 Scope: 15 User Stories Across 5 Epics

### EPIC 1: User Accounts & Authentication (5 Stories)

#### Story 1.1: User Registration - Secure Email Signup

**As a** new user,  
**I want to** create an account with email and password,  
**So that** I can securely access my personalized skincare insights.

**Acceptance Criteria:**

- **Frontend:**
  - Registration form with email, password, confirm password, terms checkbox
  - Real-time password validation (min 8 chars, 1 uppercase, 1 number, 1 special char) + show strength meter
  - Email format validation (RFC 5322) and duplicate email check via backend
  - Error handling: User-friendly messages (never reveal security details)
  - Store JWT in httpOnly cookie → auto-login, redirect to onboarding

- **Backend:**
  - `POST /api/v1/auth/register` validates input → returns `userid` + JWT token (24hr expiry)
  - Hash password using bcrypt (salt rounds = 12) — never store plaintext
  - Return 201 (created), 400 (bad request), 409 (conflict for duplicate)
  - Log registration event in `audit_logs` (user_id, action, timestamp, status, IP)

- **Database:**
  - Insert into `users` table: `id`, `email`, `hashed_password`, `created_at`, `updated_at`

- **Security:**
  - HTTPS-only, validate CSRF token

**Story Points:** 5  
**Owner:** Backend + Frontend pair

---

#### Story 1.2: User Login - Secure Session Management

**As a** registered user,  
**I want to** log in with email and password,  
**So that** I can securely access my scans and recommendations.

**Acceptance Criteria:**

- **Frontend:**
  - Login form with email, password, optional "Remember me"
  - Attach JWT to all API requests via Authorization header

- **Backend:**
  - `POST /api/v1/auth/login` validates credentials against bcrypt hash
  - Rate limiting - max 5 failed attempts per IP per 15 min
  - On success, issue access JWT (24hr) and refresh token (7 days)
  - Store JWT in httpOnly, secure, SameSite cookie
  - Log login events (success/failure, timestamp, IP) in `audit_logs`
  - Error handling: Generic "Invalid email or password" (prevent user enumeration)

- **Tests:**
  - Successful login, wrong password, non-existent user, rate limiting, token refresh, expiry

**Story Points:** 3  
**Owner:** Backend + Frontend  
**Depends on:** Story 1.1

---
#### Story 1.3: Password Reset

**As a** user who forgot their password,  
**I want to** reset my password via email link,  
**So that** I can regain access.

**Acceptance Criteria:**

- **Frontend:**
  - "Forgot password" screen with email input
  - Reset password form validates new password (same rules as registration)

- **Backend:**
  - `POST /api/v1/auth/forgot-password` generates time-limited reset token (15 min)
  - Send reset link via email: `https://app.skintelica.com/reset-password?token={token}`
  - `POST /api/v1/auth/reset-password` validates token expiry, hashes new password
  - Invalidate token after use + log reset in `audit_logs`

- **Error handling:**
  - Expired token, invalid token, password mismatch

**Story Points:** 5  
**Owner:** Backend + Frontend  
**Depends on:** Story 1.1, email service

---

#### Story 1.4: Secure Token Management & Logout

**As a** logged-in user,  
**I want to** have my session securely managed and log out,  
**So that** my account is protected.

**Acceptance Criteria:**

- **Backend:**
  - JWT tokens include expiry (24 hours for access token)
  - JWT middleware verifies token on protected routes → return 401 if invalid/expired
  - Optional refresh token mechanism for session extension
  - `POST /api/v1/auth/logout` clears JWT from client
  - On logout, add JWT to blacklist (Redis or in-memory) to prevent reuse
  - Log logout in `audit_logs`

- **Frontend:**
  - Logout button in settings → clears token, redirects to login

- **Tests:**
  - Verify token expiry, refresh flow, logout invalidation

**Story Points:** 3  
**Owner:** Backend  
**Depends on:** Story 1.1

---

#### Story 1.5: Skin Profile Onboarding

**As a** newly registered user,  
**I want to** provide my skin type, concerns, and allergies,  
**So that** the AI personalizes recommendations.

**Acceptance Criteria:**

- **Frontend:**
  - Multi-step onboarding form after registration:
    - **Step 1:** Skin type (dry, oily, combination, sensitive, normal) - radio buttons
    - **Step 2:** Main concerns (acne, sensitivity, aging, dullness, dark spots) - checkboxes
    - **Step 3:** Known allergies/ingredient sensitivities - text input
  - Progress indicator (1/3, 2/3, 3/3) — "Next" enables only when complete
  - On completion, redirect to dashboard
  - Allow editing profile from settings

- **Backend:**
  - `POST /api/v1/user/profile` accepts `skin_type`, `concerns` (array), `allergies` (array)

- **Database:**
  - Insert/update `user_profiles` with `user_id`, `skin_type`, `concerns` (JSON), `allergies` (JSON)

- **Tests:**
  - Verify profile creation, update, retrieval

**Story Points:** 5  
**Owner:** Frontend + Backend

---

### EPIC 2: Scan Capture & Upload (3 Stories)

#### Story 2.1: Camera Permission & Face Alignment UI

**As a** user,  
**I want to** grant camera access and see face alignment guide,  
**So that** I capture a clear, centered image.

**Acceptance Criteria:**

- **Frontend:**
  - Camera permission request modal (iOS/Android/Web standard)
  - Display "Grant camera access" flow with rationale
  - Live camera feed with overlay face alignment guide (oval frame)
  - Visual feedback: "Move closer", "Move away", "Center face", "Look straight"
  - Use ml5.js or tracking.js for lightweight client-side face detection
  - Capture button enabled only when face centered and well-positioned
  - Preview of captured frame before upload

- **Error handling:**
  - Camera permission denied, unavailable, face not detected

**Story Points:** 5  
**Owner:** Frontend

---

#### Story 2.2: Image Capture & Upload to R2

**As a** user,  
**I want to** capture or upload a face image,  
**So that** backend can analyze my skin.

**Acceptance Criteria:**

- **Frontend:**
  - Capture button saves frame as JPG (max 2MB)
  - Upload fallback: "Upload from gallery" for users without camera
  - Upload progress indicator (…complete)
  - Image preview with "confirm" and "retake" buttons

- **Backend:**
  - `POST /api/v1/scans` accepts multipart form data (`image`, `user_id`)
  - Validate image: JPG/PNG, <5MB, dimensions ≥256x256
  - Upload to R2 bucket: `scans/{user_id}/{timestamp}-{uuid}.jpg`
  - Return `scan_id` + upload confirmation

- **Database:**
  - Insert into `scans` table: `user_id`, `r2_url`, `upload_timestamp`, `analysis_status`

- **Error handling:**
  - Invalid file type, file too large, R2 failure, DB error

**Story Points:** 5  
**Owner:** Backend + Frontend  
**Depends on:** Story 2.1, Cloudflare R2

---
#### Story 2.3: ML Analysis Stub - Simulated Results

**As a** backend developer,  
**I want to** return simulated ML analysis scores,  
**So that** frontend develops without waiting for real model.

**Acceptance Criteria:**

- **Backend:**
  - After scan upload, return simulated analysis immediately
  - Simulated scores for: `redness` (0-10), `acne` (0-10), `pigmentation` (0-10), `dehydration` (0-10), `sensitivity` (0-10), `confidence` (0-1)
  - Optionally vary results based on user profile (higher acne if user selected "acne" concern)
  - `POST /api/v1/scans/{scan_id}/analyze` triggers stub analysis
  - Update `scans` table with `analysis_results` (JSON), `status: completed`, `analyzed_at`
  - Include `severity_level` (low, medium, high) for UI interpretation
  - Frontend: Poll endpoint or receive notification when analysis completes

- **Documentation:**
  - Clearly mark stub as temporary + plan for model replacement in Sprint 2

**Story Points:** 3  
**Owner:** Backend  
**Depends on:** Story 2.2

---

### EPIC 3: Result Display & Navigation (3 Stories)

#### Story 3.1: Result Screen UI

**As a** user,  
**I want to** see skin analysis results in clear visual format,  
**So that** I understand key findings.

**Acceptance Criteria:**

- **Frontend:**
  - Display analysis date and time
  - Show each concern with:
    - Concern name + numerical score (0-10)
    - Visual bar chart/gauge (color-coded: green=low, yellow=medium, red=high)
    - Severity label (minimal, moderate, high)
  - Overall confidence score displayed prominently
  - "Recommended Products" placeholder section (Sprint 2)
  - "Save to My Results" button + "Take Another Scan" button
  - Responsive design: mobile-first + accessible color contrast
  - Optional animation/transition when results load

- **Tests:**
  - All results display, buttons navigate, responsive on mobile/tablet/desktop

**Story Points:** 5  
**Owner:** Frontend  
**Depends on:** Story 2.3

---

#### Story 3.2: Dashboard & Scan History

**As a** logged-in user,  
**I want to** see dashboard with scan history and trends,  
**So that** I track skin over time.

**Acceptance Criteria:**

- **Frontend:**
  - Dashboard displays:
    - Welcome message with user name
    - "Last Scan" card (date, time, thumbnail, quick stats)
    - Scan History list (latest 10 scans with thumbnails)
    - Quick Actions: "New Scan", "View Routine", "Settings"
  - Click scan → navigate to result screen for that scan
  - Empty state message if no scans
  - Responsive grid layout for history

- **Backend:**
  - `GET /api/v1/user/{user_id}/scans` returns paginated list (limit 10)
  - Include: `scan_id`, `upload_timestamp`, `thumbnail_url`, `analysis_results` (summary)

- **Database:**
  - Query `scans` table efficiently (indexed on `user_id`, `created_at DESC`)

- **Tests:**
  - Dashboard renders, history paginates, navigation works

**Story Points:** 5  
**Owner:** Frontend + Backend  
**Depends on:** Story 3.1

---

#### Story 3.3: Navigation & Layout System

**As a** user,  
**I want to** navigate between dashboard, scans, profile, settings,  
**So that** app feels intuitive.

**Acceptance Criteria:**

- **Frontend:**
  - Bottom navigation (mobile) or sidebar (desktop) with 4 tabs:
    - **Home** (dashboard)
    - **Scans** (scan page + history)
    - **Profile** (edit skin profile, allergies)
    - **Settings** (logout, privacy, account)
  - Navigation bar persistent across screens
  - Current tab highlighted + smooth transitions
  - Header shows page title and optional back button
  - Responsive: bottom nav (mobile), sidebar (desktop)
  - Accessible: keyboard navigation, tab order, screen reader support

- **Tests:**
  - All navigation links work, active states update, responsive layout

**Story Points:** 3  
**Owner:** Frontend

---

### EPIC 4: Infrastructure & Deployment (2 Stories)

#### Story 4.1: API Endpoints & Database Integration

**As a** backend developer,  
**I want to** ensure all API endpoints integrate with Neon database,  
**So that** user data persists correctly.

**Acceptance Criteria:**

- **Backend:**
  - Implement all OpenAPI spec endpoints:
    - `POST /api/v1/auth/register`, `login`, `forgot-password`, `reset-password`, `logout`
    - `GET/POST /api/v1/user/profile`
    - `POST /api/v1/scans` (upload), `GET /api/v1/scans/{scan_id}`, `POST /api/v1/scans/{scan_id}/analyze`
    - `GET /api/v1/user/{user_id}/scans` (history)
  - Database connection string from environment variables (GitHub Secrets)
  - Connection pooling configured (SQLAlchemy: 20 pool size)
  - All CRUD operations tested locally and staging
  - Consistent JSON response format with error messages

- **Database:**
  - Migration script runs on deployment → schema up-to-date

- **Tests:**
  - Integration tests verify each endpoint with real/test DB

- **Error handling:**
  - DB connection errors, timeouts, constraint violations

**Story Points:** 5  
**Owner:** Backend  
**Depends on:** All feature stories

---

## Sprint 1 Success Criteria

### Delivery
- ✅ All 15 user stories completed and verified (DoD met)
- ✅ Feature branches merged to `develop` and `main`
- ✅ Code deployed to staging (ready for production)

### Quality
- ✅ Zero critical bugs in staging
- ✅ Test coverage: ≥80% backend, ≥60% frontend
- ✅ No Sentry errors exceeding threshold
- ✅ Performance: scan upload <10 sec, result display <2 sec

### Team
- ✅ All team members actively contributed
- ✅ No blockers lasting >1 hour without escalation
- ✅ 100% sprint ceremony attendance

### Product
- ✅ Working MVP demo: registration → scan → results
- ✅ Product Owner sign-off on all acceptance criteria
- ✅ Sprint 2 backlog refined

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Camera API inconsistency (iOS/Android/Web) | Medium | High | Day 1 spike: Test camera + ml5.js across all platforms. Fallback: gallery upload (Story 2.2). |
| DB connection pooling under load | Medium | High | Stress test Neon with 100+ concurrent connections (Week 1). Pool size = 20. Monitor latency. |
| R2 upload timeout (>10 sec for 5MB) | Low | High | Exponential backoff + retry (3 attempts). Test 5MB files Week 1. Timeout threshold = 15 sec. |
| JWT token edge cases | Medium | Medium | Comprehensive token tests (expiry, refresh, blacklist). Test all scenarios (Story 1.4) before deploy. |
| Scope creep (mid-sprint requests) | High | High | Strict backlog enforcement (PO reviews all requests). Defer to Sprint 2. Weekly scope freeze (Tue). |
| New team member with FastAPI/JWT | Medium | Medium | Pair new dev with auth lead for Stories 1.1-1.4. Security-aware code review before merge. |

### Escalation Protocol

If any story is **≥2 days behind schedule**:
1. Notify tech lead + product lead immediately
2. Options: reduce scope, add resource, extend sprint (not preferred)
3. Document decision and rationale

---

## Dependencies & Assumptions

### External Dependencies
- ✅ Render backend live (Sprint 0)
- ✅ Neon PostgreSQL accessible (Sprint 0)
- ✅ Cloudflare R2 bucket configured (Sprint 0)
- ✅ GitHub Actions CI/CD available
- ✅ Design tokens defined (Sprint 0)
- ⚠️ Email service (SendGrid/Mailgun free tier) for password reset

### Team Capacity
- 1 Backend Engineer (full-time)
- 1 Frontend Developer (full-time)
- 1 DevOps Lead (50% Week 1, then as-needed)
- 1 QA Engineer (50% throughout)

**Total Capacity:** 4 team × 10 days × 80% utilization = **32 person-days**  
**Estimated Load:** 33.5 person-days  
**Status:** ⚠️ Slightly overallocated — recommend deferring Story 1.3 (Password Reset) to Sprint 1.5 if needed.

### Assumptions
- Team familiar with FastAPI, React/Vue, Postgres, Docker
- Sprint 0 completion criteria fully met
- No production incidents require immediate attention
- All team members available full sprint (no planned absences)

---

## Sprint 1 Deliverables & Artifacts

### 1. Backend Code Repository: `skincare-backend`
- All API endpoints implemented and tested
- Database migrations
- Unit and integration tests (≥80% coverage)
- README with setup/deploy/test instructions

### 2. Frontend Code Repository: `skincare-frontend`
- Registration, login, scan, result, dashboard, settings screens
- Unit tests for components (≥60% coverage)
- Design tokens applied throughout
- README with setup/build/test instructions

### 3. DevOps Code Repository: `skincare-infra`
- Updated CI/CD GitHub Actions workflow
- Deployment guide
- Monitoring/alerting setup documentation

### 4. Documentation
- Sprint 1 Completion Report (stories, tests, QA sign-off)
- API endpoint documentation (OpenAPI spec)
- Deployment log
- Sprint 2 backlog (real ML model, digital twin, product recommendations)

### 5. Demo Deliverable
**5-10 minute video walkthrough** showcasing:
- New user registration
- Skin profile onboarding
- Camera permission + face alignment
- Scan capture
- Result display with analysis scores
- Dashboard with scan history
- Navigation between all screens

---

## Team Assignments & Velocity

| Story | Title | Owner | Est. Days | Priority | Dependencies |
|-------|-------|-------|-----------|----------|-------------|
| 1.1 | Registration | Backend + Frontend | 2.5 | P0 | None |
| 1.2 | Login | Backend + Frontend | 2.0 | P0 | 1.1 |
| 1.3 | Password Reset | Backend + Frontend | 2.0 | P1 | 1.1 |
| 1.4 | Token & Logout | Backend | 1.5 | P0 | 1.2 |
| 1.5 | Skin Profile | Frontend + Backend | 2.0 | P1 | 1.1 |
| 2.1 | Camera UI | Frontend | 2.5 | P0 | Design |
| 2.2 | Upload | Backend + Frontend | 2.5 | P0 | 2.1 |
| 2.3 | ML Stub | Backend | 1.5 | P0 | 2.2 |
| 3.1 | Result Display | Frontend | 2.0 | P0 | 2.3 |
| 3.2 | Dashboard | Frontend + Backend | 2.5 | P1 | 3.1 |
| 3.3 | Navigation | Frontend | 1.5 | P1 | Design |
| 4.1 | API Integration | Backend | 3.0 | P0 | All auth/scan |
| 4.2 | CI/CD Pipeline | DevOps + Backend | 2.0 | P0 | 4.1 |
| 5.1 | Unit Tests | QA + Backend + Frontend | 3.0 | P0 | All features |
| 5.2 | Manual QA | QA | 2.5 | P0 | Staging |
| **TOTAL** | | | **33.5 days** | | |

**Recommendation:** Defer Story 1.3 to Sprint 1.5 if timeline pressure emerges. P1 stories have flexibility; P0 stories must complete.

---

## Success Indicators & Metrics

### Velocity Metrics
- **Target:** 100% scope delivery (all 15 stories)
- **Measure:** Stories completed / stories planned

### Burn-Down Tracking
- Daily standup: Track story completion rate
- **Target:** Linear burn toward zero by Friday EOD
- **Tolerance:** ±5 points variation acceptable; ±10 points triggers escalation

### Quality Metrics
- **Code Review:** 100% of PRs reviewed before merge
- **Test Coverage:** Backend ≥80%, Frontend ≥60%
- **Sentry Errors:** Zero critical/blocking errors in staging
- **Performance:** Scan upload <10 sec, result display <2 sec, login <1 sec

### Team Metrics
- **Standup Attendance:** 100%
- **Blocker Resolution:** Average ≤2 hours
- **Morale:** Retrospective feedback positive

---

## Sprint 2 Foundational Setup

Upon Sprint 1 completion, **Sprint 2** will immediately begin:

- **Real ML Model Integration** — Replace stub with actual skin analysis model (redness, acne detection)
- **Digital Twin Feature** — Personalized product recommendations based on skin profile
- **Advanced Analytics** — Trend tracking, progress charts, skin improvement insights
- **Community Features** — Share results, peer comparison, skin challenges
- **Expanded Testing** — Load testing, stress testing, edge case coverage

Sprint 1's solid foundation and MVP validation enable Sprint 2's ambitious scope.

---

## Appendix: Resources & References

### Backend Development
- [FastAPI](https://fastapi.tiangolo.com)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org)
- [Pydantic](https://docs.pydantic.dev)
- [JWT with FastAPI](https://fastapi.tiangolo.com/advanced/security)

### Frontend Development
- [React](https://react.dev) or [Vue](https://vuejs.org)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Camera API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

### Testing & Quality
- [Pytest](https://docs.pytest.org)
- [Jest](https://jestjs.io)
- [Vitest](https://vitest.dev)
- [MSW](https://mswjs.io)

### DevOps & Deployment
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker](https://docs.docker.com)
- [Render](https://render.com/docs/deploy-fastapi)

### Security Best Practices
- [OWASP Auth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AuthenticationCheatSheet.html)
- [Bcrypt](https://github.com/pyca/bcrypt)
- [GDPR](https://gdpr.eu)

---

## Document Metadata

**Document ID:** SPRINT1-CORE-MVP-DEVELOPMENT-UNIFIED-V1  
**Version:** 1.0  
**Last Updated:** December 1, 2025  
**Status:** Ready for Sprint Kickoff  
**Classification:** Internal — Development Team

### Change Log

| Version | Date | Changes |
|---------|------|----------|
| 1.0 | Dec 1, 2025 | Complete unified Sprint 1 plan merging detailed story specs with high-level structure. 15 user stories across 5 epics, comprehensive DoD, timeline, risk management, team assignments, and Sprint 2 preview. Ready for execution. |

---

**End of Sprint 1 Core MVP Development Document**


---

## 📌 SPRINT STATUS UPDATE (December 2025)

**Sprint 1 Status:** 🟡 **IN PROGRESS / PARTIAL COMPLETION**

**Current Project Phase:** Sprint 3 - CI/CD Pipeline Complete

### Progress Against Sprint 1 Goals:
- ✅ **User Accounts Delivered:** JWT-based authentication fully implemented
  - Registration endpoint operational
  - Login endpoint with token generation
  - Secure password handling with hashing
- 🟡 **Scan Flow Implementation:** Backend scan endpoints operational
  - UUID-based scan session management
  - File upload handling with validation
  - Scan result retrieval API
- ❌ **ML Stub API:** Pending full implementation
- ❌ **Frontend UI:** To be developed in upcoming sprints

### Technical Achievements:
- ✅ CI/CD pipeline operational with 7/7 tests passing
- ✅ Backend deployed on Railway with live API docs
- ✅ PostgreSQL database schema implemented
- ✅ ~58% test coverage with automated testing

### Reference Documentation:
- [Sprint 3 CI/CD Completion Report](SPRINT-3-PHASE-3-CI-CD-COMPLETION.md)
- [Live API Documentation](https://ai-skincare-intelligence-system-production.up.railway.app/docs)

**Next Steps:** Complete ML model integration, develop frontend UI for user onboarding and scan capture.
