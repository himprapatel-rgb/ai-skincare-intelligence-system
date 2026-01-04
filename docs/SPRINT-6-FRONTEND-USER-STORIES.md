# SPRINT 6: Frontend User Stories & Implementation Plan

**Sprint Duration:** 2 weeks (Jan 6 - Jan 17, 2026)  
**MVP Readiness Target:** 50%+ (from 32%)  
**Story Points Target:** 45-50 points  
**Team:** Frontend Lead + 2 Frontend Engineers + UX Designer  
**Status:** Ready to Kickoff

---

## 📋 Sprint 6 Overview

Sprint 6 focuses on building the 8 critical frontend pages that are currently missing. These pages block user registration flow and are essential for MVP completion. The sprint is split into two priority tiers:

**P0 (BLOCKING):** 3 pages - MUST complete in Sprint 6  
**P1 (CRITICAL):** 3 pages - Should complete in Sprint 6  
**P2 (IMPORTANT):** 2 pages - Stretch goals

---

## 🎯 P0 - BLOCKING PAGES (Must Complete)

### Story 6.1: OnboardingPage.tsx (8 points)

**Priority:** P0 - CRITICAL  
**Owner:** Frontend Lead  
**SRS Traceability:** FR1, FR2 (User Registration & Profile Setup)

**Description:**  
First page users see after email verification. Guides users through:
1. Welcome screen with app overview
2. Profile setup (name, age, skin type)
3. Skin concerns selection (checkboxes)
4. Skincare goals selection
5. Photo consent + camera permission request

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] All form fields validate correctly
- [ ] Submit calls `POST /api/v1/auth/onboarding` with validated data
- [ ] Error handling for failed API calls
- [ ] Mobile responsive (< 768px, 768-1024px, > 1024px)
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Loading state with spinner
- [ ] Success redirect to ScanPage

**Technical Details:**
- Stack: React 18, TypeScript, Tailwind CSS
- State Management: Redux (auth store)
- API Integration: axios interceptor for auth
- Form Validation: React Hook Form + Yup

**Wireframe:**
```
┌─────────────────────────────────┐
│  Welcome to AI Skincare         │
│  [App Icon]                     │
│  "Analyze your skin in seconds" │
│  [Continue Button]              │
├─────────────────────────────────┤
│  Profile Setup                  │
│  Name: [_________]              │
│  Age: [__]                      │
│  Skin Type: [Dropdown]          │
│  [Dry] [Oily] [Combo]           │
│  [Next Button]                  │
├─────────────────────────────────┤
│  Skin Concerns (Multi-select)   │
│  ☐ Acne   ☐ Rosacea            │
│  ☐ Wrinkles ☐ Dark Spots       │
│  ☐ Sensitivity ☐ Dryness       │
│  [Next Button]                  │
├─────────────────────────────────┤
│  Goals (Multi-select)           │
│  ☐ Clear skin  ☐ Anti-aging    │
│  ☐ Hydration   ☐ Brightening   │
│  [Next Button]                  │
├─────────────────────────────────┤
│  Camera Permission              │
│  "Allow camera access"          │
│  [Allow] [Skip]                 │
│  [Start Scanning]               │
└─────────────────────────────────┘
```

**Definition of Done:**
- Code review approved
- Unit tests: ≥80% coverage
- Integration test: API endpoints verified
- Visual design matches Figma (provide link)
- Performance: Page load < 2s
- No console errors/warnings

---

### Story 6.2: ProfileSettingsPage.tsx (5 points)

**Priority:** P0 - LEGAL REQUIREMENT  
**Owner:** Frontend Engineer #1  
**SRS Traceability:** FR11 (User Profile Management)

**Description:**  
Allows users to view/edit their profile information.

**Screens:**
1. Profile Overview (name, email, skin type, photo)
2. Edit Profile Form
3. Change Password Form
4. Delete Account (with confirmation)

**Acceptance Criteria:**
- [ ] Display current user profile from `GET /api/v1/profile`
- [ ] Edit form calls `PATCH /api/v1/profile`
- [ ] Change password validates current password
- [ ] Delete account shows confirmation modal
- [ ] Photo upload integration (Cloudinary)
- [ ] Success/error notifications (toast)
- [ ] Mobile responsive
- [ ] WCAG 2.1 AA compliant

---

### Story 6.3: ConsentManagementPage.tsx (5 points)

**Priority:** P0 - GDPR LEGAL REQUIREMENT  
**Owner:** Frontend Engineer #2  
**SRS Traceability:** FR44, FR45, FR46 (GDPR Consent)

**Description:**  
GDPR consent management interface. Users can:
1. View active consent policies
2. Withdraw consent at any time
3. View consent history
4. Export/delete personal data

**Acceptance Criteria:**
- [ ] Display active consents from `GET /api/v1/consent`
- [ ] Toggle consent switches call `POST /api/v1/consent/withdraw`
- [ ] Show last updated timestamp
- [ ] Display data retention policy
- [ ] "Export My Data" button calls `POST /api/v1/consent/export`
- [ ] "Delete Account" confirmation
- [ ] Mobile responsive
- [ ] Accessibility compliant

---

## 🔴 P1 - CRITICAL PAGES (Should Complete)

### Story 6.4: MyShelfPage.tsx (5 points)

**Priority:** P1 - CORE FEATURE  
**Owner:** Frontend Lead + Engineer #1

**Description:**  
User's inventory of skincare products they own/use.

**Features:**
- List of products (with photos from Cloudinary)
- Add/remove products
- Sort by category/date added
- Search functionality
- Link to product details

**API Integration:**
- `GET /api/v1/products/my-shelf`
- `POST /api/v1/products/add-to-shelf`
- `DELETE /api/v1/products/:id/from-shelf`

---

### Story 6.5: DigitalTwinTimelinePage.tsx (5 points)

**Priority:** P1 - CORE FEATURE  
**Owner:** Frontend Engineer #2

**Description:**  
Showcase user's skin improvement over time (timeline visualization).

**Components:**
- Timeline of skin scan photos
- Before/after comparison
- Skin mood index trend chart
- Key improvements highlighted

---

### Story 6.6: RoutineBuilderPage.tsx (6 points)

**Priority:** P1 - CORE FEATURE  
**Owner:** Frontend Lead

**Description:**  
AI-powered routine builder where users can:
1. Select morning routine (3-5 steps)
2. Select evening routine (3-5 steps)
3. Add custom products from My Shelf
4. View recommended routine from AI
5. Save/apply routine

**Wireframe:**
```
Morning Routine        |  Evening Routine
─────────────────────  ──────────────────
1. Cleanser: [Select]  1. Cleanser: [Select]
2. Toner: [Select]     2. Treatment: [Select]
3. Serum: [Select]     3. Moisturizer: [Select]
4. Moisturizer: [Sel]  4. Oil: [Select]
5. SPF: [Select]       

[AI Recommended] [Save Routine] [Apply]
```

---

## 🟡 P2 - IMPORTANT PAGES (Stretch Goals)

### Story 6.7: ProgressDashboardPage.tsx (4 points)

**Features:**
- Skin progress metrics (acne reduction %, hydration %, etc.)
- Charts showing trends over time
- Key milestones achieved

---

### Story 6.8: ProductScannerPage.tsx (3 points)

**Features:**
- Camera integration to scan product barcodes
- Product ingredient extraction
- Safety rating display

---

## 📊 Sprint 6 Work Breakdown

| Story ID | Page Name | Points | Priority | Owner | Status |
|----------|-----------|--------|----------|-------|--------|
| 6.1 | OnboardingPage | 8 | P0 | Frontend Lead | Pending |
| 6.2 | ProfileSettingsPage | 5 | P0 | Engineer #1 | Pending |
| 6.3 | ConsentManagementPage | 5 | P0 | Engineer #2 | Pending |
| 6.4 | MyShelfPage | 5 | P1 | Lead + Eng1 | Pending |
| 6.5 | DigitalTwinTimeline | 5 | P1 | Engineer #2 | Pending |
| 6.6 | RoutineBuilder | 6 | P1 | Frontend Lead | Pending |
| 6.7 | ProgressDashboard | 4 | P2 | Engineer #1 | Pending |
| 6.8 | ProductScanner | 3 | P2 | Engineer #2 | Pending |
| **TOTAL** | | **41 points** | | | |

**Velocity Target:** 45-50 points (stretch 6.7 + 6.8)

---

## 🔧 Technical Implementation Details

### Frontend Tech Stack
- **Framework:** React 18.x
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Modules
- **State Mgmt:** Redux Toolkit
- **Forms:** React Hook Form + Yup validation
- **HTTP Client:** Axios with interceptors
- **Charts:** Recharts (for ProgressDashboard)
- **Image Upload:** Cloudinary SDK
- **Camera:** React Camera (for barcode scanning)

### Component Structure
```
frontend/src/
├── pages/
│   ├── OnboardingPage.tsx
│   ├── ProfileSettingsPage.tsx
│   ├── ConsentManagementPage.tsx
│   ├── MyShelfPage.tsx
│   ├── DigitalTwinTimelinePage.tsx
│   ├── RoutineBuilderPage.tsx
│   ├── ProgressDashboardPage.tsx
│   └── ProductScannerPage.tsx
├── components/
│   ├── Forms/
│   │   ├── ProfileForm.tsx
│   │   ├── ConsentForm.tsx
│   │   └── RoutineForm.tsx
│   ├── Cards/
│   │   ├── ProductCard.tsx
│   │   └── ProgressCard.tsx
│   └── Charts/
│       └── ProgressChart.tsx
├── hooks/
│   ├── useProfile.ts
│   ├── useConsent.ts
│   └── useProducts.ts
└── utils/
    ├── api.ts
    └── validation.ts
```

---

## ✅ Definition of Done (DoD)

For each story to be considered "Done":

- [ ] Code written and committed
- [ ] Peer code review approved (≥1 reviewer)
- [ ] Unit tests written (≥80% coverage)
- [ ] Integration tests pass (API endpoints verified)
- [ ] E2E tests pass (user workflow verified)
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance tested (page load < 2s, Lighthouse ≥80)
- [ ] No console errors/warnings
- [ ] Error handling implemented for all API calls
- [ ] Loading states + user feedback (spinners, toasts)
- [ ] Merged to main branch
- [ ] Deployed to staging environment
- [ ] QA sign-off on staging

---

## 🚀 Sprint 6 Timeline

**Week 1 (Jan 6-10):**
- Mon 6th: Sprint Kickoff + Story refinement
- Tue-Fri: Development of 6.1 (OnboardingPage)

**Week 2 (Jan 13-17):**
- Mon 13th: 6.1 complete, start 6.2 & 6.3
- Wed 15th: 6.2 & 6.3 complete, start 6.4-6.6
- Thu 16th: Buffer for fixes + testing
- Fri 17th: Sprint Review + Retrospective

---

## 📊 Success Metrics

- ✅ 41+ story points completed (45-50 target)
- ✅ All P0 stories 100% complete
- ✅ ≥80% test coverage across all new components
- ✅ 0 blocker/critical bugs in production
- ✅ MVP Readiness increases from 32% to 50%+
- ✅ All pages responsive on mobile/tablet/desktop
- ✅ WCAG 2.1 AA accessibility compliance

---

## 📝 Notes

**Next Sprint (Sprint 7):**
- Continue with remaining P2 pages
- AI model integration for recommendations
- Advanced analytics dashboard
- Mobile app optimization

**Risks:**
- Backend API delays could block frontend work
- Design revisions mid-sprint
- Third-party library incompatibilities

**Mitigation:**
- Mock API responses ready
- Design system finalized before sprint
- Dependency compatibility matrix maintained

---

**Sprint 6 Kickoff:** January 6, 2026, 9:00 AM GMT  
**Document Created:** January 4, 2026  
**Status:** READY FOR DEVELOPMENT
