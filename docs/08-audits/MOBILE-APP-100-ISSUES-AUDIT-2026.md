# Mobile App: 100 Issues Audit (vs. Best Mobile Apps)

**Date:** February 2026  
**Scope:** Pellicura / SkinCareAI mobile experience (viewport ≤768px, PWA)  
**Reference:** Compared to best-practice criteria from Nielsen’s 10 heuristics, NN/g Mobile Usability, Apple HIG, Android Quality Guidelines, Baymard/UserX mobile UX checklists, and top health/lifestyle apps.  
**Best-apps design reference:** [BEST-APPS-MOBILE-DESIGN-REFERENCE.md](./BEST-APPS-MOBILE-DESIGN-REFERENCE.md) — patterns from Headspace, Glossier, Spotify, Instagram, Apple Health.

---

## How to use this doc

- **#** = issue number (1–100).  
- **Ref** = best-practice reference (Nielsen = visibility/control/consistency/etc.; HIG = Apple; Android = Android quality; NN/g = NN/g mobile; WCAG = accessibility).  
- **P** = suggested priority (P0 critical, P1 high, P2 medium, P3 low).

---

## 1. NAVIGATION & WAYFINDING (Issues 1–12)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 1 | Bottom nav shows only 3 items (Today, Scan, Me); Dashboard, Shelf, and other core flows are buried in hamburger or desktop nav on mobile. Best apps keep 4–5 primary destinations in thumb zone. | NN/g, Android | P1 |
| 2 | Active tab indicator (underline/background) is too subtle (2px). Best apps use 3–4px or filled pill. | Consistency | P2 |
| 3 | No persistent “Back” affordance on detail pages (e.g. Product, Analysis); users rely on browser back or header. Standard is explicit back control. | HIG, Android | P1 |
| 4 | Breadcrumbs use “/” separator; best practice is “›” or “/” with clearer clickable regions. | Consistency | P3 |
| 5 | Hamburger menu has no badge for notifications/count; users can’t see at a glance if there’s something new. | Visibility of status | P2 |
| 6 | “Skip to main content” link is present but not announced on every key screen; visibility on first tab varies. | WCAG | P2 |
| 7 | Deep links (e.g. /product/123) don’t show where the user is in the app hierarchy (e.g. “Shelf › Product”). | Recognition not recall | P2 |
| 8 | Nav labels (“Today”, “Scan”, “Me”) are short but “Scan” doesn’t distinguish face vs product; best apps use clear labels. | Match system/real world | P2 |
| 9 | On mobile, primary CTA “Free Scan” appears in header and hero; logged-in users still see “Free Scan” instead of “Dashboard” or “New Scan”. | Consistency | P1 |
| 10 | Footer on mobile (app shell) is minimal; full footer with links is hidden. Users can’t reach About/Contact/Privacy from app-shell mode without opening menu. | User control | P2 |
| 11 | Product Scanner nav shows “Skin Analysis” as active in some states instead of “Product Scanner”; wrong tab highlighted. | Visibility of status | P1 |
| 12 | No “Home” or “Start over” from deep screens (e.g. mid-scan, mid-onboarding). Best apps offer escape. | User control, Nielsen #3 | P2 |

---

## 2. TOUCH TARGETS & INTERACTION (13–22)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 13 | Dropdown chevron next to user name (~8px) is below 44px minimum touch target. | HIG, WCAG 2.5.5 | P1 |
| 14 | “See Sample Report” and other ghost buttons have no minimum touch height on some breakpoints. | Touch targets | P2 |
| 15 | Filter/sort chips and pill buttons on My Shelf and Recommendations are small; tap area not extended with padding. | Android | P2 |
| 16 | Star ratings and “Would repurchase?” toggles on product cards are small; hard to tap accurately. | Touch targets | P2 |
| 17 | Drag handles in Routine Builder are too subtle; hard to discover and tap. | Flexibility | P2 |
| 18 | “Change” and “Edit” links in forms are 14px and feel like secondary text; should be at least 44px tap height. | Touch targets | P2 |
| 19 | No visible tap feedback (e.g. scale or opacity) on several custom buttons; only default highlight. | HIG, Android | P2 |
| 20 | Camera “Take photo” and “Start Camera” buttons lack clear pressed/active state. | Visibility of status | P2 |
| 21 | Bottom nav center “Scan” pill is larger but surrounding tap area can feel cramped on small devices. | Thumb zone | P2 |
| 22 | Checkbox/radio in consent and settings are 20px; best practice on mobile is 24px minimum for touch. | WCAG, HIG | P2 |

---

## 3. FORMS & INPUT (23–30)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 23 | Some inputs use font-size &lt; 16px on mobile; iOS zooms on focus. Should be 16px minimum. | HIG, existing MOBILE-UX | P0 |
| 24 | Search bars (My Shelf, History, Favorites) have no clear “clear” (X) control when text is entered. | Error prevention | P2 |
| 25 | Date picker / “Remind me to scan” uses placeholder “dd/mm/yyyy” and “—” default; no native date picker on mobile. | Match system/real world | P1 |
| 26 | Long placeholder in Digital Twin “What-If” dropdown; truncation or shorter hint needed. | Aesthetic/minimalist | P2 |
| 27 | Password fields don’t show “Show password” toggle on mobile; only type="password". | Flexibility | P3 |
| 28 | Newsletter and contact forms: email + button cramped; need more padding and full-width on small screens. | NN/g | P2 |
| 29 | Barcode manual entry input is 600px max-width; on mobile should be full width with larger tap target. | Touch targets | P2 |
| 30 | No autocomplete or suggestions for email/login where appropriate; increases typing and errors. | Error prevention | P3 |

---

## 4. VISIBILITY OF SYSTEM STATUS / LOADING & FEEDBACK (31–42)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 31 | After scan upload, progress states (uploading → analyzing) are minimal or generic; users don’t know which step is running. | Nielsen #1 | P1 |
| 32 | Dashboard and list pages sometimes show single spinner instead of skeleton matching final layout. | NN/g, best apps | P2 |
| 33 | No global “offline” indicator when network is lost; users may not know why actions fail. | Visibility of status | P1 |
| 34 | API/backend status (e.g. “API unreachable”) is in footer; not prominent when critical. | Visibility of status | P2 |
| 35 | Form submit (login, register, contact) lacks disabled state + “Sending…” during request; double submit possible. | Error prevention | P1 |
| 36 | Google OAuth callback can show “Signing in…” for a long time with no progress or retry option. | Visibility of status | P2 |
| 37 | Add to shelf / favorite: no immediate visual confirmation (e.g. heart fill or toast) on some flows. | Visibility of status | P2 |
| 38 | Scan session “Initializing…” has no progress or timeout message; users don’t know if it’s stuck. | Nielsen #1 | P2 |
| 39 | Route changes (React Router) have loading bar but no screen-level “Loading…” for slow data. | Consistency | P2 |
| 40 | Delete/remove actions (e.g. shelf product, favorite) sometimes confirm but don’t show undo. | User control, Nielsen #3 | P2 |
| 41 | Digital Twin chart loading: no skeleton for chart area; empty then pop-in. | Aesthetic | P3 |
| 42 | “Product Image” and other placeholders remain visible in production on cards; looks like broken state. | Visibility of status | P1 |

---

## 5. ERROR PREVENTION & RECOVERY (43–50)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 43 | No inline validation on login/register (e.g. “Invalid email” before submit). | Nielsen #5 | P2 |
| 44 | Delete profile / delete account has confirmation but no “Type DELETE to confirm” or similar. | Error prevention | P1 |
| 45 | Remove product from shelf has no confirmation; accidental tap removes. | Nielsen #3, #5 | P1 |
| 46 | Network errors show generic message; don’t suggest “Check connection” or “Retry”. | Nielsen #9 | P2 |
| 47 | 401/session expired redirects to login but doesn’t always preserve “return URL” for after login. | User control | P2 |
| 48 | File upload (scan photo) doesn’t reject oversized or wrong type with clear message before upload. | Error prevention | P2 |
| 49 | Barcode “Look Up” when disabled looks active (e.g. purple); disabled state should be visually distinct. | Consistency | P2 |
| 50 | Password reset: no message if email not found (security) but also no “If an account exists…” message; users confused. | Nielsen #9 | P2 |

---

## 6. CONSISTENCY & STANDARDS (51–60)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 51 | Card border radius varies (10px, 12px, 14px, 16px) across pages. Best apps use one token. | Consistency | P2 |
| 52 | Primary buttons: some pages use gradient, some solid; “Free Scan” vs “Start Free Skin Scan” wording. | Consistency | P2 |
| 53 | FAQ uses both “›” and “+” for expand; one pattern preferred. | Consistency | P2 |
| 54 | Stats cards: one uses blue fill (Skin Health Score), others white; inconsistent hierarchy. | Consistency | P2 |
| 55 | Icon sizes vary (16px, 18px, 20px, 22px, 24px) without clear system. | Consistency | P3 |
| 56 | Empty state component exists but some pages use custom empty UI instead. | Consistency | P2 |
| 57 | “Product Image” placeholder text vs real images mixed; no consistent fallback image. | Consistency | P1 |
| 58 | Date/datetime display format not standardized (e.g. “Jan 15” vs “15/01/2026”). | Match system/real world | P3 |
| 59 | Category/filter labels sometimes lowercase, sometimes capitalized. | Consistency | P3 |
| 60 | Header height and padding differ between app-shell and full layout. | Consistency | P2 |

---

## 7. CONTENT & HIERARCHY (61–70)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 61 | Hero headline “AI Skin Analysis” and “From a Single Photo” same size (48px); need weight/size hierarchy. | Aesthetic | P2 |
| 62 | Subheadline contrast (18px gray) barely meets WCAG AA; increase size or darken. | WCAG | P1 |
| 63 | “AS FEATURED IN” section uses text instead of logos; reduces credibility. | Best apps | P1 |
| 64 | Trust badges: shield icon outlined not filled; “Delete Data Anytime” uses trash (negative connotation). | Match system/real world | P2 |
| 65 | Sample analysis card: score circles lack progress rings; tags have inconsistent padding. | Aesthetic | P2 |
| 66 | One H1 per page not enforced everywhere; some pages have multiple competing headings. | WCAG, MOBILE-UX | P2 |
| 67 | How It Works: numbered circles and arrows overlap card boundaries. | Aesthetic | P2 |
| 68 | Testimonials: placeholder circles instead of photos; weak social proof. | Best apps | P2 |
| 69 | Digital Twin chart X-axis labels too long; truncate or rotate. | Recognition not recall | P2 |
| 70 | Legend and data point sizes (8px) too small for touch and readability. | Touch, readability | P2 |

---

## 8. EMPTY STATES & ONBOARDING (71–78)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 71 | Dashboard empty state improved but some flows still show blank area with no CTA. | NN/g | P2 |
| 72 | Digital Twin empty state has CTA; My Shelf and History empty states could be more actionable. | Best apps | P2 |
| 73 | First-time user: no dedicated onboarding carousel or “key benefits” overlay. | Android, best apps | P2 |
| 74 | Onboarding progress steps: no “Skip” for returning users. | Flexibility | P2 |
| 75 | My Shelf benefits section (Add Products, Track, Expiry) has no icons or dismiss. | Recognition not recall | P2 |
| 76 | After signup, “Verify email” state could show clearer “Check your inbox” and resend. | Visibility of status | P2 |
| 77 | No “What’s new” or release notes for existing users after updates. | Best apps | P3 |
| 78 | Consent and policy screens: long text with no summary or “I agree to X and Y” checkboxes. | Error prevention | P2 |

---

## 9. ACCESSIBILITY (79–86)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 79 | Focus order on modal and dropdown may not trap focus; keyboard/screen reader can tab outside. | WCAG 2.1 | P1 |
| 80 | Some images (sample report, avatars) lack alt text or aria-hidden where decorative. | WCAG | P2 |
| 81 | Color contrast on muted text and badges fails AA in places (e.g. #94A3B8 on white). | WCAG 1.4.3 | P1 |
| 82 | Custom controls (tabs, accordions) don’t always have aria-expanded/aria-selected. | WCAG 4.1.2 | P2 |
| 83 | Reduced motion: some animations don’t respect prefers-reduced-motion. | WCAG 2.3.3 | P2 |
| 84 | Live regions (toast, success message) may not be announced; use aria-live. | WCAG 4.1.3 | P2 |
| 85 | Form errors not associated with fields via aria-describedby. | WCAG 3.3.1 | P2 |
| 86 | Touch targets &lt; 44px still present in several places (see Touch section). | WCAG 2.5.5 | P1 |

---

## 10. PWA, INSTALL & PERFORMANCE (87–94)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 87 | manifest.json has no screenshots for “Add to Home Screen” storefront. | PWA best practice | P2 |
| 88 | Single splash image for one device size; other devices get default. Multiple apple-touch-startup-image sizes recommended. | HIG, PWA | P2 |
| 89 | No service worker offline fallback page; offline shows browser error. | PWA | P2 |
| 90 | Theme-color and apple-mobile-web-app-status-bar-style: dark theme may not update status bar on install. | PWA | P3 |
| 91 | Large images (hero, sample card) not lazy-loaded or with explicit dimensions; can affect LCP. | Performance | P2 |
| 92 | Font loading: Inter from Google; no font-display: swap or preload in index. | Performance | P2 |
| 93 | No resource hints (preconnect/preload) for critical API or assets beyond one preconnect. | Performance | P3 |
| 94 | Route-level code splitting exists but some heavy pages (Dashboard, Digital Twin) could be split further. | Performance | P3 |

---

## 11. TRUST, PRIVACY & CONTENT (95–100)

| # | Issue | Ref | P |
|---|--------|-----|---|
| 95 | “Encrypted uploads” and “Privacy-first” copy not backed by visible trust marks (e.g. GDPR, encryption badge). | Best apps | P2 |
| 96 | Contact form doesn’t show “Average response time: 24 hours” prominently on mobile. | Best apps | P3 |
| 97 | No in-app help or “?” for key flows (e.g. how to take a good scan photo). | Nielsen #10 | P2 |
| 98 | Terms/Privacy links in footer not always visible in app-shell; need in menu or profile. | Legal, Android | P2 |
| 99 | Product details: “Write a Review” appears twice in some layouts. | Consistency | P2 |
| 100 | Ingredient list on product detail not available despite description mentioning ingredients. | Match system/real world | P1 |

---

## SUMMARY BY PRIORITY

| Priority | Count | Focus |
|----------|-------|--------|
| P0 | 1 | Input font size 16px on mobile (iOS zoom). |
| P1 | 18 | Nav/back, touch targets, placeholders, errors, contrast, empty confirmations, product data. |
| P2 | 68 | Consistency, feedback, accessibility, forms, performance, trust. |
| P3 | 13 | Minor copy, icons, dates, “What’s new.” |

---

## REFERENCE SOURCES

- **Nielsen’s 10 Usability Heuristics** – [nngroup.com/articles/ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- **Mobile Usability (NN/g)** – [nngroup.com/reports/mobile-website-and-application-usability](https://www.nngroup.com/reports/mobile-website-and-application-usability/)
- **Apple Human Interface Guidelines** – [developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- **Android Quality Guidelines** – [developer.android.com/quality](https://developer.android.com/quality)
- **WCAG 2.1** – [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/)
- **Baymard / UserX mobile UX** – [baymard.com/blog/mobile-app-ux-trends](https://baymard.com/blog/mobile-app-ux-trends), [userx.pro](https://userx.pro) mobile checklist

---

## NEXT STEPS

1. Triage P0/P1 into current sprint backlog ([12-tasks/ACTIVE-TASKS.md](../12-tasks/ACTIVE-TASKS.md)).
2. Add P2 items to [12-tasks/IMPROVEMENT-BACKLOG.md](../12-tasks/IMPROVEMENT-BACKLOG.md).
3. Re-audit after fixes; track closure in this doc or in a follow-up “100 Issues – Status” file.

---

*Last updated: February 2026*
