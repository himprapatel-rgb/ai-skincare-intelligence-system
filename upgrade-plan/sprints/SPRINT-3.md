# Sprint 3 — Page Redesigns & AI Chat Frontend

**Weeks:** 5-6
**Dependencies:** Sprint 2 (API upgrades, AI Chat backend, UI components)
**Goal:** Redesign core 15 pages + build AI Chat frontend + upgrade remaining APIs.

---

## Track A: AI Chat Frontend (TOP PRIORITY)

### A1. ChatMessage Component
- Render user/assistant message bubbles
- Markdown rendering for assistant messages (bold, lists, links, code)
- Copy message button
- Timestamp display
- **Files**: `frontend/src/components/chat/ChatMessage.tsx`, `ChatMessage.module.css`

### A2. StreamingMessage Component
- Handles SSE streaming display
- Character-by-character typing effect
- Typing indicator while streaming
- Fallback for connection errors
- **Files**: `frontend/src/components/chat/StreamingMessage.tsx`

### A3. ChatInput Component
- Text input with send button
- Enter to send, Shift+Enter for newline
- Disable while streaming
- Character count (optional)
- **Files**: `frontend/src/components/chat/ChatInput.tsx`, `ChatInput.module.css`

### A4. ChatSuggestions Component
- Suggested question chips after assistant response
- Clickable → sends as user message
- **Files**: `frontend/src/components/chat/ChatSuggestions.tsx`

### A5. ChatSessionList Component
- Sidebar/drawer with session history
- Create new session button
- Delete session (swipe or button)
- **Files**: `frontend/src/components/chat/ChatSessionList.tsx`, `ChatSessionList.module.css`

### A6. AIChatPage
- Full page: session list + message area + input
- Mobile: session list as drawer, messages fullscreen
- Desktop: sidebar + main area
- Route: `/chat`
- **Files**: `frontend/src/pages/AIChatPage.tsx`, `AIChatPage.module.css`

### A7. ChatWidget (Floating)
- Small chat bubble on all pages (bottom-right, above BottomNav on mobile)
- Click → navigate to `/chat`
- **Files**: `frontend/src/components/chat/ChatWidget.tsx`, `ChatWidget.module.css`

### A8. Register Chat Route
- Add `/chat` route to App.tsx (lazy loaded, auth required)
- **File**: `frontend/src/App.tsx`

### A9. Deep Links
- Add "Ask AI about this" button on AnalysisResults page → navigates to `/chat` with scan context
- Add "Ask AI about this product" on ProductDetailsPage → navigates with product context
- **Files**: `frontend/src/pages/AnalysisResults.tsx`, `frontend/src/pages/ProductDetailsPage.tsx`

---

## Track B: Core Page Redesigns (Tier 1)

For each page: use new UI components from `src/ui/`, apply CSS Modules, ensure responsive + dark mode + a11y.

### B1. HomePage Redesign
- All 9 sections visible on all breakpoints (no hidden content)
- Hero: gradient background, "Try Demo Scan" CTA
- Social proof: animated counters
- Testimonials: swipeable on mobile
- FAQ: use `ui/Accordion`
- **Files**: `frontend/src/pages/HomePage.tsx`, `HomePage.module.css`

### B2. AuthPage Redesign
- Split layout: illustration left, form right (desktop)
- Use `ui/Input`, `ui/Button`
- Password strength meter
- Tab transition animation (login ↔ register)
- **Files**: `frontend/src/pages/AuthPage.tsx`, `AuthPage.module.css`

### B3. ScanPage Improvements
- Refactor 1201 lines → extract sub-components (CameraView, ScanProgress, ScanResults)
- Quality meter for face positioning
- Use WebSocket for progress (if ready) or keep polling
- **Files**: `frontend/src/pages/ScanPage.tsx` + sub-components

### B4. AnalysisResults Redesign
- Dashboard-style score display
- Interactive face heatmap (click zone → detail)
- Expandable concern cards with "What this means"
- Score counter animation
- **Files**: `frontend/src/pages/AnalysisResults.tsx`, `AnalysisResults.module.css`

### B5. DashboardPage Redesign
- Widget-based layout (2-col tablet, 3-col desktop)
- Parallel API calls + skeleton loading per widget
- Personalized greeting with weather
- Quick action buttons
- **Files**: `frontend/src/pages/DashboardPage.tsx`, `DashboardPage.module.css`

### B6. MePage Redesign
- Stats: total scans, avg score, shelf count
- Clinical summary: last scan + top concern + next reminder
- Profile completion progress bar
- **Files**: `frontend/src/pages/MePage.tsx`, `MePage.module.css`

### B7. Recommendations Redesign
- "Why recommended" tag per product
- Enhanced filters (skin type, brand, rating, vegan)
- Infinite scroll with TanStack Query
- **Files**: `frontend/src/pages/Recommendations.tsx`, `Recommendations.module.css`

### B8. MyShelfPage Redesign
- Grid/list toggle
- Expiry countdown badges
- Bulk actions
- Tab-based category filter
- **Files**: `frontend/src/pages/MyShelfPage.tsx`, `MyShelfPage.module.css`

---

## Track C: Remaining API Upgrades

### C1. Profile Endpoints
- `GET /profile/completion-guide` — missing fields + hints
- `GET /profile/skin-type-quiz` — guided skin type quiz
- **File**: `backend/app/routers/profile.py`

### C2. Shelf Endpoints
- `POST /shelf/batch` — add multiple products
- `GET /shelf/expiring-soon` — products within 30 days of expiry
- `GET /shelf/stats` — totals by category/status
- **File**: `backend/app/routers/shelf.py`

### C3. Goals Endpoints
- `GET /goals/suggested` — AI-suggested goals from last scan
- `GET /goals/timeline` — visualization data for progress
- Auto-update goal progress on new scan
- **File**: `backend/app/routers/goals.py`

### C4. Digital Twin Endpoints
- `GET /digital-twin/compare/{id1}/{id2}` — side-by-side snapshot comparison
- `GET /digital-twin/heatmap/{snapshot_id}` — region-level data
- Pagination on timeline
- **File**: `backend/app/routers/digital_twin.py`

### C5. AI New Endpoints
- `GET /ai/daily-brief` — personalized daily skin brief
- `POST /ai/ingredient-conflicts` — check two product ingredient lists
- **File**: `backend/app/routers/ai.py`

### C6. Content Upgrades
- Pagination on all content lists
- `GET /content/blogs/{slug}` — get by slug
- View count tracking
- **File**: `backend/app/routers/content.py`

### C7. Email Service Upgrade
- Replace basic SMTP with template-based sending
- Templates: welcome, verification, password reset, weekly digest
- Background queue via arq
- **File**: `backend/app/services/email_service.py`

---

## Track D: Auth Flow Pages

### D1. OnboardingPage Polish
- Step-by-step wizard with progress bar
- Skin type → concerns → goals → first scan CTA
- Slide transitions between steps
- **Files**: `frontend/src/pages/OnboardingPage.tsx`, `OnboardingPage.module.css`

### D2. Password Reset Pages
- Consistent with AuthPage design
- Countdown timer for token expiry
- Clear success/failure states
- **Files**: `frontend/src/pages/PasswordResetPage.tsx`, `PasswordResetConfirmPage.tsx`

### D3. EmailVerificationPage
- Auto-redirect on success
- Resend verification link button
- **File**: `frontend/src/pages/EmailVerificationPage.tsx`

---

## Verification Checklist

```bash
cd backend && python -m pytest tests/ -x -q
cd frontend && npm run build
```

- [ ] AI Chat: full conversation working (send message → streaming response)
- [ ] AI Chat: session CRUD (create, list, delete)
- [ ] AI Chat: floating widget visible on all pages
- [ ] AI Chat: deep links from AnalysisResults + ProductDetails
- [ ] 8 core pages redesigned and responsive
- [ ] All redesigned pages pass dark mode check
- [ ] Profile, shelf, goals, digital twin new endpoints working
- [ ] Daily brief + ingredient conflicts endpoints working
- [ ] Email templates working (verification, reset)
- [ ] Build + tests pass
