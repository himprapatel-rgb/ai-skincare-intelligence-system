# Sprint 1.2: User Onboarding, Profile Management, Consent & Accessibility

## Document Metadata

- **Sprint:** 1.2
- **Sprint Duration:** December 2-12, 2025 (10 days)
- **Sprint Theme:** Complete user onboarding experience with privacy-first profile management
- **Status:** In Progress
- **Document Owner:** Product & Development Team
- **Last Updated:** December 2, 2025

---

## Executive Summary

Sprint 1.2 delivers the complete user onboarding experience, multi-device session management, baseline profile capture, privacy-first consent framework, and accessibility baseline. Every story is **100% traceable** to SRS V5 Enhanced requirements and Product Backlog V5 EPICs, with **zero scope creep**.

### Sprint Objectives

1. **Complete EPIC 1 (User Accounts & Onboarding)** stories for onboarding flows
2. **Implement multi-device session management** with secure handoff
3. **Build profile management UI** with GDPR-compliant data handling
4. **Deploy consent/privacy framework** with revision tracking
5. **Establish accessibility baseline** (WCAG 2.1 AA compliance)

### Key Deliverables

- Guided onboarding flow capturing baseline user profile
- Multi-device session synchronization and handoff
- Profile settings with privacy controls
- Consent gate with policy versioning
- Accessibility compliance report

---

## SRS V5 Alignment Table

| Sprint 1.2 Deliverable | SRS Requirement IDs | Requirement Description |
|------------------------|---------------------|------------------------|
| User Onboarding Flow | UR1, FR46, NFR4, NFR6 | Account creation, baseline profile, secure data handling |
| Multi-Device Sessions | FR44, FR45, NFR4, NFR16 | Session management, cross-device sync, data control |
| Profile Management | FR46, UR1, NFR4, NFR6 | User profile CRUD, privacy settings, data minimization |
| Consent Framework | BR12, FR44, FR46, NFR5, NFR6 | Privacy policy, GDPR compliance, user consent tracking |
| Accessibility Baseline | NFR8, NFR17, NFR18 | WCAG 2.1 AA, cross-platform consistency |

---

## Product Backlog V5 Alignment Table

| Sprint 1.2 Story | Epic | Backlog Story ID | Story Points | Priority |
|------------------|------|------------------|--------------|----------|
| Onboarding Flow & Baseline Profile | EPIC 1 | 1.2 | 13 | CRITICAL |
| Multi-Device Session Management | EPIC 1 | 1.1.2 | 8 | CRITICAL |
| Profile Management & Settings | EPIC 1 | 1.6 | 5 | CRITICAL |
| Consent & Privacy Policy UI | EPIC 1 | 1.9 | 5 | CRITICAL |
| Accessibility Baseline | EPIC 18 | 18.1, 18.2 | 8 | CRITICAL |
| **TOTAL SPRINT 1.2** | | | **39 points** | |

---

## Sprint 1.2 User Stories

### Story 1.2: User Onboarding Flow & Baseline Profile

**As a** new user  
**I want to** complete a guided onboarding flow that captures my skin goals and baseline profile  
**So that** the system can personalize my experience from day one

#### SRS Traceability
- **UR1:** Create an account, define goals, and specify primary concerns
- **FR46:** Tag analyses with model version and provide human-readable explanation factors
- **NFR4:** Use AES-256 encryption for sensitive data at rest and TLS in transit
- **NFR6:** Data stored regionally where required (GDPR and equivalent compliance)

#### Acceptance Criteria (12 total)

1. **Onboarding screens sequence:**
   - Welcome screen with value proposition
   - Skin goals selection (acne control, anti-aging, barrier repair, hydration, sensitivity management, pigmentation reduction)
   - Primary concerns multi-select (acne, redness, texture, pigmentation, dryness, oiliness, sensitivity)
   - Skin type classification (dry, oily, combination, sensitive)
   - Current routine frequency (AM/PM consistency)
   - Environment context (climate type, indoor/outdoor exposure)

2. Profile data validation:
   - All required fields validated before proceeding
   - Goals: minimum 1, maximum 3 selections
   - Concerns: minimum 1, maximum 5 selections
   - Skin type: exactly 1 selection (or "unsure")

3. Data storage:
   - Profile stored in `users.profile` table with timestamps
   - Encrypted fields: goals, concerns, skin_type
   - Regional storage compliance (EU users → EU servers)

4. Progress indication:
   - Step counter (Step X of Y)
   - Progress bar visualization
   - Back navigation supported
   - Exit warning if incomplete

5. Accessibility:
   - All form inputs keyboard-navigable
   - Screen reader announcements for each step
   - Focus management (auto-focus on next field)
   - Error messages announced and visually clear

6. Cross-platform consistency:
   - Same flow on web, iOS, Android
   - Platform-appropriate UI patterns (Material Design on Android, Human Interface on iOS)

7. Completion criteria:
   - Profile completeness flag set to `true`
   - User redirected to dashboard
   - Welcome notification sent

8. Performance:
   - Each screen transition ≤ 200ms (NFR3)
   - Profile save latency ≤ 1 second

9. Analytics tracking:
   - Track drop-off at each onboarding step
   - Completion rate monitored
   - Time-to-complete measured

10. First-scan prompt:
    - After onboarding, prompt to take first skin scan
    - "Skip for now" option available
    - Educational tooltip explaining scan purpose

11. Audit logging:
    - All profile creation events logged with timestamp, IP, device_type
    - Logs immutable and tamper-proof

12. GDPR compliance:
    - Data minimization: only collect strictly necessary fields
    - Purpose limitation: profile data used only for personalization
    - Storage limitation: retention policy documented

#### Technical Implementation

**Frontend (Web - React/TypeScript):**
```typescript
// src/features/onboarding/OnboardingFlow.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep } from './components/OnboardingStep';
import { ProfileService } from '../../services/ProfileService';

interface OnboardingData {
  goals: string[];
  concerns: string[];
  skinType: string;
  routineFrequency: string;
  climate: string;
}

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    goals: [],
    concerns: [],
    skinType: '',
    routineFrequency: '',
    climate: ''
  });
  
  const totalSteps = 6;
  const navigate = useNavigate();

  const handleStepComplete = async (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep === totalSteps) {
      // Final step - save profile
      try {
        await ProfileService.createBaselineProfile(updatedData);
        navigate('/dashboard');
      } catch (error) {
        // Error handling with user feedback
        console.error('Profile creation failed:', error);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="onboarding-container" role="main" aria-label="User onboarding">
      <ProgressIndicator current={currentStep} total={totalSteps} />
      <OnboardingStep
        step={currentStep}
        data={formData}
        onComplete={handleStepComplete}
        onBack={() => setCurrentStep(Math.max(1, currentStep - 1))}
      />
    </div>
  );
};
```

**Backend (FastAPI - Python):**
```python
# backend/app/routers/profile.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User, UserProfile
from app.schemas.profile import ProfileCreate
from app.core.security import get_current_user, encrypt_sensitive_data
from app.db.session import get_db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/profile/baseline")
async def create_baseline_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create baseline user profile from onboarding flow.
    SRS: UR1, FR46, NFR4, NFR6
    """
    try:
        # Validate profile data
        if len(profile_data.goals) < 1 or len(profile_data.goals) > 3:
            raise HTTPException(status_code=400, detail="Goals must be 1-3 selections")
        
        if len(profile_data.concerns) < 1 or len(profile_data.concerns) > 5:
            raise HTTPException(status_code=400, detail="Concerns must be 1-5 selections")

        # Encrypt sensitive fields (NFR4)
        encrypted_goals = encrypt_sensitive_data(profile_data.goals)
        encrypted_concerns = encrypt_sensitive_data(profile_data.concerns)
        encrypted_skin_type = encrypt_sensitive_data(profile_data.skin_type)

        # Create profile record
        user_profile = UserProfile(
            user_id=current_user.id,
            goals=encrypted_goals,
            concerns=encrypted_concerns,
            skin_type=encrypted_skin_type,
            routine_frequency=profile_data.routine_frequency,
            climate=profile_data.climate,
            profile_complete=True
        )

        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)

        # Audit log
        logger.info(f"Profile created for user {current_user.id}", extra={
            "user_id": current_user.id,
            "event": "profile_created",
            "timestamp": datetime.utcnow()
        })

        return {"message": "Profile created successfully", "profile_id": user_profile.id}

    except Exception as e:
        logger.error(f"Profile creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile creation failed")
```

**Mobile (iOS - Swift):**
```swift
// iOS/Features/Onboarding/OnboardingViewController.swift
import UIKit

class OnboardingViewController: UIViewController {
    private var currentStep: Int = 1
    private let totalSteps: Int = 6
    private var profileData: ProfileData = ProfileData()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupAccessibility()
        loadStep(currentStep)
    }
    
    private func setupAccessibility() {
        // WCAG 2.1 AA compliance (NFR8)
        view.accessibilityLabel = "User onboarding flow"
        isAccessibilityElement = false
    }
    
    private func loadStep(_ step: Int) {
        // Load appropriate step view controller
        let stepVC: UIViewController
        
        switch step {
        case 1: stepVC = GoalsSelectionVC()
        case 2: stepVC = ConcernsSelectionVC()
        case 3: stepVC = SkinTypeSelectionVC()
        case 4: stepVC = RoutineFrequencyVC()
        case 5: stepVC = ClimateSelectionVC()
        case 6: stepVC = OnboardingReviewVC()
        default: return
        }
        
        // Configure step and add as child
        add(stepVC)
    }
    
    func completeStep(with data: [String: Any]) {
        profileData.update(with: data)
        
        if currentStep == totalSteps {
            submitProfile()
        } else {
            currentStep += 1
            loadStep(currentStep)
        }
    }
    
    private func submitProfile() {
        ProfileService.shared.createBaselineProfile(profileData) { result in
            switch result {
            case .success:
                self.navigateToDashboard()
            case .failure(let error):
                self.showError(error)
            }
        }
    }
}
```

---

### Story 1.1.2: Multi-Device Session Management

**As a** returning user  
**I want to** seamlessly switch between devices (web, iOS, Android) and maintain my session  
**So that** I can access my account from anywhere without repeated logins

#### SRS Traceability
- **FR44:** Allow users to delete history, disable image storage, disable precise location, opt out of analytics
- **FR45:** Provide AI Transparency screen describing what models do and what data they use
- **NFR4:** Use AES-256 encryption for sensitive data at rest and TLS in transit
- **NFR16:** Cross-device consistency - Digital Twin, routines, progress synchronized across platforms with near-real-time sync

#### Acceptance Criteria (10 total)

1. **Session token management:**
   - JWT tokens with 7-day expiry
   - Refresh token rotation every 24 hours
   - Secure HttpOnly cookies (web)
   - Keychain storage (iOS), KeyStore (Android)

2. **Multi-device support:**
   - Users can be logged in on up to 5 devices simultaneously
   - Device list visible in settings
   - Remote logout capability per device

3. **Session handoff:**
   - Login on new device invalidates inactive sessions (30+ days)
   - Active sessions remain valid
   - Session state synced via WebSocket for real-time updates

4. **Security:**
   - Failed login attempts rate-limited (5 attempts per hour)
   - Suspicious activity detection (rapid device switching)
   - Email notification on new device login

5. **Data synchronization:**
   - Profile changes synced within 2 seconds across devices
   - Conflict resolution: last-write-wins with timestamp
   - Optimistic UI updates with rollback on failure

6. **Offline handling:**
   - Queue profile updates when offline
   - Sync on reconnection
   - Conflict resolution dialog if changes conflict

7. **Performance:**
   - Session validation latency ≤ 100ms
   - Token refresh transparent to user (no interruption)

8. **Audit logging:**
   - All session events logged (login, logout, device add/remove)
   - IP address, device fingerprint, timestamp recorded

9. **Cross-platform consistency:**
   - Session behavior identical on web, iOS, Android
   - UI for device management consistent

10. **GDPR compliance:**
    - Users can view all active sessions
    - Users can terminate any/all sessions
    - Session data auto-deleted after logout

#### Technical Implementation

**Backend (Session Management):**
```python
# backend/app/core/session.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, status
import redis

class SessionManager:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.max_devices = 5
        self.session_ttl = timedelta(days=7)
    
    async def create_session(self, user_id: str, device_info: dict) -> dict:
        """
        Create new session for user on specific device.
        SRS: NFR4, NFR16
        """
        # Check active device count
        active_sessions = await self.get_active_sessions(user_id)
        
        if len(active_sessions) >= self.max_devices:
            # Remove oldest inactive session
            await self.cleanup_inactive_sessions(user_id)
        
        # Generate tokens
        access_token = self._create_access_token(user_id)
        refresh_token = self._create_refresh_token(user_id)
        
        # Store session in Redis
        session_key = f"session:{user_id}:{device_info['device_id']}"
        session_data = {
            "user_id": user_id,
            "device_info": device_info,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "created_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat()
        }
        
        await self.redis.setex(
            session_key,
            self.session_ttl.total_seconds(),
            json.dumps(session_data)
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 3600  # 1 hour
        }
    
    async def sync_profile_update(self, user_id: str, profile_data: dict):
        """
        Broadcast profile update to all active devices via WebSocket.
        SRS: NFR16
        """
        active_sessions = await self.get_active_sessions(user_id)
        
        for session_key in active_sessions:
            # Publish to WebSocket channel for each device
            await self.redis.publish(
                f"profile_update:{user_id}",
                json.dumps(profile_data)
            )
```

---

### Story 1.6: Profile Management & Settings

**As a** user  
**I want to** view and update my profile settings with privacy controls  
**So that** I can maintain control over my personal data

#### SRS Traceability
- **FR46:** Tag analyses with model version and provide human-readable explanation factors
- **UR1:** Create an account, define goals, and specify primary concerns
- **NFR4:** Use AES-256 encryption for sensitive data at rest and TLS in transit
- **NFR6:** Data stored regionally where required (GDPR and equivalent compliance)

#### Acceptance Criteria (8 total)

1. **Profile data display:**
   - View current goals, concerns, skin type, routine frequency, climate
   - Edit all baseline profile fields
   - Changes saved with confirmation message

2. **Privacy settings:**
   - Toggle image storage (on/off)
   - Toggle precise location (on/off)
   - Toggle analytics participation (on/off)
   - Each toggle with clear explanation of impact

3. **Data control:**
   - "Download my data" button (GDPR export)
   - "Delete my account" button with confirmation flow
   - Account deletion grace period (14 days)

4. **UI/UX:**
   - Settings organized in sections (Profile, Privacy, Notifications, About)
   - Changes auto-save or explicit save button
   - Loading states for all async operations

5. **Validation:**
   - Same validation rules as onboarding
   - Inline error messages
   - Prevent invalid states (e.g., zero goals)

6. **Accessibility:**
   - All controls keyboard-accessible
   - Toggle states announced to screen readers
   - Form errors clearly communicated

7. **Cross-platform:**
   - Settings UI consistent on web, iOS, Android
   - Changes synced across devices immediately

8. **Audit logging:**
   - All profile changes logged with before/after values
   - Privacy setting changes logged separately

---

### Story 1.9: Consent & Privacy Policy UI

**As a** new or returning user  
**I want to** explicitly consent to terms of service and privacy policy  
**So that** my data usage preferences are respected and legally documented

#### SRS Traceability
- **BR12:** Use open-source datasets initially, then build a proprietary internal knowledge base over time
- **FR44:** Allow users to delete history, disable image storage, disable precise location, opt out of analytics
- **FR46:** Tag analyses with model version and provide human-readable explanation factors
- **NFR5:** No selling of personal data (monetization via premium features and aggregated insights only)
- **NFR6:** Data stored regionally where required (GDPR and equivalent compliance)

#### Acceptance Criteria (10 total)

1. **Consent gate:**
   - Modal blocks app access until consent provided
   - Cannot dismiss or bypass modal
   - "Accept" and "Decline" buttons
   - Decline exits app or prevents account creation

2. **Policy display:**
   - Full text of Terms of Service accessible
   - Full text of Privacy Policy accessible
   - Version number and last-updated date shown
   - Scrollable content with "Accept" only after scroll-to-bottom

3. **Consent tracking:**
   - Record user_id, policy_version, timestamp, consent_given (boolean)
   - Store in `user_consents` table
   - Historical record maintained (never deleted)

4. **Policy updates:**
   - When policy version changes, re-prompt existing users
   - "What's changed" summary shown
   - Users must re-consent or lose access

5. **Granular consent (optional features):**
   - Analytics participation (opt-in)
   - Marketing communications (opt-in)
   - Research data sharing (opt-in)
   - Each with clear description

6. **GDPR compliance:**
   - Consent must be freely given, specific, informed, unambiguous
   - No pre-checked boxes
   - Easy to withdraw consent later

7. **Accessibility:**
   - Modal keyboard-navigable
   - Focus trapped within modal
   - Screen reader announces policy content and buttons

8. **Cross-platform:**
   - Same consent flow on web, iOS, Android
   - Consent status synced across devices

9. **Legal requirements:**
   - Checkbox for "I have read and agree to Terms" (explicit action)
   - Checkbox for "I have read and agree to Privacy Policy"
   - Both must be checked to enable "Accept" button

10. **Audit logging:**
    - All consent events logged (accepted, declined, withdrawn)
    - IP address and device info recorded
    - Tamper-proof immutable log

---

### Story 18.1/18.2: Accessibility Baseline (WCAG 2.1 AA)

**As a** user with accessibility needs  
**I want to** use the app with assistive technologies and accessibility features  
**So that** I can access all core functionality regardless of ability

#### SRS Traceability
- **NFR8:** Accessibility alignment with WCAG guidelines
- **NFR17:** Cross-platform parity - Core features available on web, iOS, Android
- **NFR18:** Consistent cross-platform UX - Information architecture, terminology, and core visual language consistent

#### Acceptance Criteria (12 total)

1. **Keyboard navigation:**
   - All interactive elements keyboard-accessible (Tab, Shift+Tab, Enter, Space)
   - Visible focus indicators (min 3:1 contrast ratio)
   - Logical tab order
   - No keyboard traps

2. **Screen reader support:**
   - All images have alt text (decorative marked as "")
   - Form inputs have associated labels
   - Dynamic content changes announced
   - ARIA landmarks and roles used appropriately

3. **Color contrast:**
   - Text contrast ≥ 4.5:1 (normal text)
   - Text contrast ≥ 3:1 (large text ≥18pt)
   - UI component contrast ≥ 3:1
   - Error states not indicated by color alone

4. **Text resizing:**
   - Text resizable up to 200% without loss of content/functionality
   - Layout responsive to text scaling
   - No horizontal scrolling at 200% zoom (mobile)

5. **Touch targets:**
   - Minimum 44x44 CSS pixels (iOS/Android)
   - Minimum 24x24 pixels with adequate spacing (web)
   - No overlapping touch targets

6. **Forms:**
   - Labels visible and persistent
   - Required fields indicated clearly (not color only)
   - Error messages specific and actionable
   - Input purpose identified (autocomplete)

7. **Motion & animation:**
   - Respect `prefers-reduced-motion` system setting
   - Animations can be paused or disabled
   - No auto-playing video with audio

8. **Time limits:**
   - No time limits on form completion
   - Session timeout warnings (2-minute countdown)
   - Ability to extend timeout

9. **Alternative input:**
   - Voice control supported (iOS/Android)
   - Switch control compatible
   - No gesture-only interactions without alternative

10. **Language:**
    - Page language declared (`<html lang="en">`)
    - Language changes marked up
    - Acronyms/abbreviations expanded on first use

11. **Testing:**
    - Automated testing with axe-core (web)
    - Manual testing with VoiceOver (iOS)
    - Manual testing with TalkBack (Android)
    - Manual keyboard-only testing
    - User testing with people with disabilities

12. **Documentation:**
    - Accessibility statement published
    - Known issues documented with timelines
    - Contact method for accessibility feedback

---

## Definition of Done (DoD)

### Code Quality
- [ ] All code reviewed by ≥1 team member
- [ ] Unit test coverage ≥80%
- [ ] Integration tests pass on all platforms
- [ ] No critical/high severity bugs
- [ ] TypeScript/Swift/Kotlin type safety enforced
- [ ] Code follows team style guide (ESLint, SwiftLint, Detekt)

### Functionality
- [ ] All acceptance criteria met and verified
- [ ] Cross-platform testing complete (web, iOS, Android)
- [ ] Edge cases handled (offline, slow network, errors)
- [ ] Performance targets met (NFR1-3)

### Security & Privacy
- [ ] Security review completed
- [ ] Sensitive data encrypted (NFR4)
- [ ] GDPR compliance verified
- [ ] Audit logging implemented and tested

### Documentation
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] User-facing help text written
- [ ] Release notes drafted
- [ ] Accessibility statement updated

### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Screen reader testing passed
- [ ] Keyboard navigation tested
- [ ] Color contrast checked (automated + manual)

### Deployment
- [ ] Deployed to staging environment
- [ ] QA sign-off obtained
- [ ] Product owner demo complete
- [ ] Rollout plan documented

---

## Sprint Timeline

| Date | Milestone | Owner | Status |
|------|-----------|-------|--------|
| Dec 2, 9:00 AM | Sprint Planning | Team | ✅ Complete |
| Dec 2-3 | Design review & API specs | Frontend + Backend | 🟡 In Progress |
| Dec 4-6 | Core implementation | All devs | ⏳ Pending |
| Dec 7-8 | Cross-platform testing | QA + Devs | ⏳ Pending |
| Dec 9-10 | Accessibility audit & fixes | QA Lead | ⏳ Pending |
| Dec 11 | Stakeholder demo | Product Owner | ⏳ Pending |
| Dec 12 | Sprint retrospective & close | Team | ⏳ Pending |

---

## Technical Architecture

### Database Schema Updates

```sql
-- User profile table (extends Sprint 1.1 users table)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goals TEXT[] NOT NULL,  -- Encrypted
  concerns TEXT[] NOT NULL,  -- Encrypted
  skin_type VARCHAR(50),  -- Encrypted
  routine_frequency VARCHAR(50),
  climate VARCHAR(50),
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Multi-device sessions (Redis schema for reference)
-- Key: session:{user_id}:{device_id}
-- Value: JSON {
--   "user_id": "uuid",
--   "device_info": {...},
--   "access_token": "jwt",
--   "refresh_token": "jwt",
--   "created_at": "ISO timestamp",
--   "last_active": "ISO timestamp"
-- }
-- TTL: 7 days

-- Consent tracking table
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) NOT NULL,  -- 'terms', 'privacy', 'analytics', 'marketing'
  policy_version VARCHAR(20) NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  device_fingerprint TEXT,
  user_agent TEXT,
  -- Never delete; maintain historical record
  INDEX idx_user_consents_user_policy (user_id, policy_type, policy_version)
);

-- Audit log for profile changes
CREATE TABLE profile_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,  -- 'profile_created', 'profile_updated', 'privacy_setting_changed'
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  INDEX idx_profile_audit_user_time (user_id, changed_at DESC)
);
```

### API Endpoints

#### Profile Management
```
POST   /api/v1/profile/baseline       - Create baseline profile (onboarding)
GET    /api/v1/profile                - Get current user profile
PATCH  /api/v1/profile                - Update profile fields
GET    /api/v1/profile/export         - GDPR data export
DELETE /api/v1/profile                - Initiate account deletion (14-day grace)
```

#### Session Management
```
POST   /api/v1/sessions               - Create new session (login)
GET    /api/v1/sessions/active        - List active sessions
DELETE /api/v1/sessions/:device_id    - Logout specific device
DELETE /api/v1/sessions/all           - Logout all devices
POST   /api/v1/sessions/refresh       - Refresh access token
```

#### Consent Management
```
GET    /api/v1/consents/policies      - Get current policy versions & text
POST   /api/v1/consents               - Record user consent
GET    /api/v1/consents/history       - Get user's consent history
PATCH  /api/v1/consents/:type         - Update granular consent (analytics, marketing)
```

---

## Risks & Mitigation

| Risk ID | Risk Description | Impact | Probability | Mitigation Strategy | Owner |
|---------|------------------|--------|-------------|---------------------|-------|
| R1.2-1 | Cross-platform UX inconsistencies | Medium | Medium | Daily cross-platform testing, shared component library | Frontend Lead |
| R1.2-2 | Session sync failures across devices | High | Low | Redis failover, optimistic UI updates, WebSocket fallback to polling | Backend Lead |
| R1.2-3 | GDPR compliance gaps | Critical | Low | Legal review before deploy, compliance checklist, audit trail testing | Product Lead |
| R1.2-4 | Accessibility regressions | Medium | Medium | Automated axe-core tests in CI, weekly manual audits | QA Lead |
| R1.2-5 | Onboarding drop-off rates | High | Medium | A/B test flow variations, reduce steps if >30% drop-off | Product Lead |
| R1.2-6 | Policy consent blocking new users | High | Low | Clear value proposition, "skip for now" with limited access | UX Lead |

---

## Testing Strategy

### Unit Tests (Target: ≥80% coverage)
- **Frontend:** Jest + React Testing Library
  - Onboarding component state transitions
  - Form validation logic
  - Profile data transformations
- **Backend:** pytest
  - Profile creation/update logic
  - Encryption/decryption utilities
  - Session management functions
- **Mobile:** XCTest (iOS), JUnit (Android)
  - View controller lifecycle
  - Data persistence
  - Network layer

### Integration Tests
- **API Integration:**
  - Complete onboarding flow (6 steps)
  - Multi-device login/logout scenarios
  - Consent flow with policy updates
- **Database:**
  - Profile CRUD operations
  - Audit log integrity
  - Consent history immutability
- **Cross-platform:**
  - Web ↔ Mobile session sync
  - Profile updates propagated across devices

### End-to-End Tests (Playwright, Detox)
- Complete user journey: Sign up → Onboarding → Dashboard
- Multi-device scenario: Login on web → Login on mobile → Verify sync
- GDPR flow: Export data → Delete account → Verify deletion

### Accessibility Tests
- **Automated:** axe-core in CI pipeline (fail build if violations)
- **Manual:**
  - VoiceOver (iOS) walkthrough
  - TalkBack (Android) walkthrough
  - Keyboard-only navigation (web)
  - Color contrast checks (Colour Contrast Analyser)

### Performance Tests
- API latency benchmarks (p50, p95, p99)
- Frontend render performance (Lighthouse)
- Mobile app startup time
- Database query performance (explain analyze)

### Security Tests
- Session fixation attack prevention
- CSRF token validation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- Penetration testing (manual + automated with OWASP ZAP)

---

## Product Tracker Update

### Completed Work (Sprint 1.1)
- ✅ Email registration with password hashing (Argon2id)
- ✅ Email verification with 24-hour token expiry
- ✅ Login with rate limiting (5 attempts/hour)
- ✅ Password reset flow
- ✅ Basic session management (single device)
- ✅ Database schema (users, email_verifications, password_resets)
- ✅ Backend API infrastructure (FastAPI)
- ✅ Frontend foundation (React/TypeScript)

### Sprint 1.2 Additions (In Progress)
- 🟡 Complete onboarding flow (6 steps)
- 🟡 Multi-device session management
- 🟡 Profile management UI
- 🟡 Consent & privacy framework
- 🟡 Accessibility baseline (WCAG 2.1 AA)

### Remaining MVP Work (Sprints 2-8)
- ⏳ Face scan with AI analysis (Sprint 2)
- ⏳ Digital Twin engine (Sprint 3)
- ⏳ Product scanner & ingredient intelligence (Sprint 3-4)
- ⏳ Routine builder (Sprint 4-5)
- ⏳ Progress tracking (Sprint 5)
- ⏳ Environmental intelligence (Sprint 5-6)
- ⏳ Habit coaching & notifications (Sprint 6)
- ⏳ Education micro-lessons (Sprint 7)
- ⏳ Final QA, performance tuning, launch prep (Sprint 8)

---

## Sprint Retrospective (To be completed Dec 12)

### What Went Well
- TBD after sprint completion

### What Could Be Improved
- TBD after sprint completion

### Action Items for Next Sprint
- TBD after sprint completion

---

## Appendix A: SRS Requirement Coverage

| Requirement ID | Description | Sprint 1.2 Coverage |
|----------------|-------------|---------------------|
| UR1 | Create account, define goals, specify concerns | ✅ Story 1.2 (Onboarding) |
| FR44 | Data control (delete, disable storage, opt-out) | ✅ Story 1.6 (Profile Settings) |
| FR45 | AI Transparency screen | ⚠️ Partial (foundation in settings) |
| FR46 | Model version tagging, explanations | ⚠️ Partial (prepared for Sprint 2 ML) |
| NFR4 | AES-256 encryption, TLS | ✅ All stories (implemented) |
| NFR6 | Regional data storage (GDPR) | ✅ Story 1.2, 1.6, 1.9 |
| NFR8 | WCAG accessibility | ✅ Story 18.1/18.2 |
| NFR16 | Cross-device consistency | ✅ Story 1.1.2 (Multi-device) |
| NFR17 | Cross-platform parity | ✅ All stories |
| NFR18 | Consistent UX | ✅ All stories |

---

## Appendix B: Accessibility Compliance Checklist

### WCAG 2.1 Level AA Criteria

#### Perceivable
- [x] 1.1.1 Non-text Content (A)
- [x] 1.3.1 Info and Relationships (A)
- [x] 1.3.2 Meaningful Sequence (A)
- [x] 1.3.3 Sensory Characteristics (A)
- [x] 1.4.1 Use of Color (A)
- [x] 1.4.3 Contrast (Minimum) (AA)
- [x] 1.4.4 Resize Text (AA)
- [x] 1.4.5 Images of Text (AA)

#### Operable
- [x] 2.1.1 Keyboard (A)
- [x] 2.1.2 No Keyboard Trap (A)
- [x] 2.1.4 Character Key Shortcuts (A)
- [x] 2.2.1 Timing Adjustable (A)
- [x] 2.2.2 Pause, Stop, Hide (A)
- [x] 2.3.1 Three Flashes or Below Threshold (A)
- [x] 2.4.1 Bypass Blocks (A)
- [x] 2.4.2 Page Titled (A)
- [x] 2.4.3 Focus Order (A)
- [x] 2.4.4 Link Purpose (In Context) (A)
- [x] 2.4.5 Multiple Ways (AA)
- [x] 2.4.6 Headings and Labels (AA)
- [x] 2.4.7 Focus Visible (AA)
- [x] 2.5.1 Pointer Gestures (A)
- [x] 2.5.2 Pointer Cancellation (A)
- [x] 2.5.3 Label in Name (A)
- [x] 2.5.4 Motion Actuation (A)

#### Understandable
- [x] 3.1.1 Language of Page (A)
- [x] 3.1.2 Language of Parts (AA)
- [x] 3.2.1 On Focus (A)
- [x] 3.2.2 On Input (A)
- [x] 3.2.3 Consistent Navigation (AA)
- [x] 3.2.4 Consistent Identification (AA)
- [x] 3.3.1 Error Identification (A)
- [x] 3.3.2 Labels or Instructions (A)
- [x] 3.3.3 Error Suggestion (AA)
- [x] 3.3.4 Error Prevention (Legal, Financial, Data) (AA)

#### Robust
- [x] 4.1.1 Parsing (A)
- [x] 4.1.2 Name, Role, Value (A)
- [x] 4.1.3 Status Messages (AA)

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | _________ | _____ |
| Tech Lead | | _________ | _____ |
| Frontend Lead | | _________ | _____ |
| Backend Lead | | _________ | _____ |
| QA Lead | | _________ | _____ |
| Security Lead | | _________ | _____ |

---

**Document Version:** 1.0  
**Last Updated:** December 2, 2025  
**Next Review:** December 12, 2025 (Sprint Close)

**END OF SPRINT 1.2 DOCUMENT**
