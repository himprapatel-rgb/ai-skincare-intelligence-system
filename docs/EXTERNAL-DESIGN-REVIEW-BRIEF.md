# External Design Review — Brief for Reviewers

**Product:** SkinCareAI — AI-powered skin analysis and personalized skincare  
**Request:** A design audit and prioritized recommendations to improve the app’s visual design, consistency, and UX (especially mobile / super-app experience).

---

## 1. How to access the app

- **Live (if deployed):** [Add your staging or production URL here, e.g. https://yourapp.vercel.app]
- **Local:** Clone the repo, run `npm install` and `npm run dev` in `/frontend`, then open the URL shown (e.g. http://localhost:5173).

**Please test on:**
- Mobile viewport (375px, 414px width) and optionally tablet (768px).
- At least one real device (iOS or Android) if possible, for touch and safe areas.

---

## 2. What the app does

- **Core flow:** User takes a selfie → AI analyzes skin (concerns, scores, tips) → User gets recommendations, routine builder, product scanner, “My Shelf,” and optional Digital Twin.
- **Audience:** Consumers interested in skincare; mix of signed-out (marketing home + free scan) and signed-in (dashboard, history, profile).
- **Positioning:** Premium, trustworthy, “clinical-grade” feel without looking clinical; we aim for a **super-app / Bumble-like** mobile experience (clear primary action, bottom nav with prominent center CTA).

---

## 3. What we’d like you to review

### 3.1 Overall

- **Visual identity:** Does the app feel cohesive and premium? Any mismatch between marketing (home) and in-app (dashboard, scan)?
- **Hierarchy and clarity:** Is the primary action obvious on key screens (Home, Scan, Dashboard, empty states)?
- **Consistency:** Layout, headers, buttons, cards, and spacing across pages — where do we drift?

### 3.2 Mobile / super-app

- **Bottom navigation:** We use a Bumble-style center “Scan” button. Does it read as the main action? Is the balance with other tabs (Home, Dashboard, Shelf, Profile) clear?
- **Headers and chrome:** Are top bars and headers minimal and consistent on app routes?
- **Touch and safe areas:** Anything cut off, too small to tap, or cramped by notches/home indicator?

### 3.3 Key flows to walk through

1. **Landing → First scan**  
   Home → “Start Free Skin Scan” (hero + floating CTA on mobile) → Scan flow → Result.

2. **Signed-in dashboard**  
   Dashboard → “Take your first scan” or recent activity → Analysis or History.

3. **Discovery**  
   Recommendations, Product Scanner, My Shelf, Routine Builder — do these feel part of the same app?

4. **Profile and settings**  
   Profile, Settings, consent, export — clarity and trust.

### 3.4 Accessibility and inclusion

- Focus order and visible focus states.
- Color contrast and “don’t rely on color alone” for status.
- Motion (we respect `prefers-reduced-motion`; is it enough?).
- Any obvious gaps for screen reader or keyboard users.

---

## 4. Design system context (for reference)

- **Colors:** Primary blue `#2563eb` (and variants); purple accent in gradients; grays for text and borders. See `frontend/src/styles/COLOR_SCHEME.md`.
- **Typography:** Inter (or system fallback); we aim for one H1 per page and clear hierarchy.
- **Structure:** Mobile pages use `app-page`, optional `app-header-card`, and `app-page-content`; we have shared `EmptyState` and `ErrorCard` components.
- **Principles:** We follow a one-pager in `docs/MOBILE-UX-PRINCIPLES.md` (one primary action, 44px touch targets, safe areas, etc.).

You don’t need to read the code; this is only to understand intent. Your review can be purely from a user/designer perspective.

---

## 5. What we need from you

- **Audit document** (PDF or Markdown) that includes:
  1. **Summary** — 2–3 paragraphs: overall impression, main strengths, main weaknesses.
  2. **Screens/flows** — Where possible, refer to specific screens or flows (e.g. “Home hero,” “Dashboard when empty,” “Scan result”).
  3. **Prioritized recommendations** — List of improvements in order of impact (e.g. P0/P1/P2 or High/Medium/Low), with short rationale and, if possible, a one-line suggestion per item.
  4. **Optional:** Mood boards, competitor references, or wireframe-level suggestions for the highest-impact items.

- **Scope:** Focus on **product UI/UX and visual design**. You don’t need to audit code, performance, or backend.

---

## 6. Contact and timeline

- **Contact:** [Your name/email or design lead]
- **Deadline for first draft:** [e.g. 2 weeks from brief]
- **Follow-up:** We’ll schedule a 1-hour call to walk through the audit and agree on priorities.

Thank you for your time; we’re looking forward to your perspective.
