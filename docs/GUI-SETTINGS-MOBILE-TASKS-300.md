# 300 Tasks: Settings & Under-Settings Mobile GUI

GUI improvement tasks for **Settings** and everything under it (profile, preferences, notifications, privacy, data export, device context, consent, help, etc.) to feel like a **mobile app**.  
Target: viewport ≤ 768px; touch-first, clear hierarchy, consistent patterns.

**Implementation:** `frontend/src/styles/settings-mobile-app.css` (imported in `main.tsx`), `ProfileSettingsPage.tsx` (tab=settings → notifications, beforeunload, scroll-to-first-error on validation, haptic on save + theme + toggles, role="switch"/aria-checked on notification & privacy toggles, stats quick links to History & Digital Twin), `DataExportPage.tsx` (header back link), `NotificationCenterPage.tsx` (header back link), `ProfileSettingsPage.css` (existing mobile block). Me → "Preferences" links to `/profile?tab=settings` (opens Notifications tab). Settings CSS: checkbox-grid/chips (skin, goals, lifestyle), stats 2×2 grid, theme-option touch targets, privacy action buttons full width, stats-quick-links.

---

## 1. Settings Entry & Shell (Tasks 1–20)

| # | Task | Description |
|---|------|--------------|
| 1 | Me → Preferences link | Ensure "Preferences" on Me page has min 44px tap target and clear label; links to /profile?tab=settings or /profile. |
| 2 | Profile route as settings home | Treat /profile as the main settings hub; consistent header and back behavior from all sub-pages. |
| 3 | Back from profile | From /profile, back button or "Me" returns to /me with clear tap target (44×44px). |
| 4 | Settings header on mobile | Profile/Settings page has a fixed or sticky header with title "Profile" or "Settings" and back on mobile. |
| 5 | Safe area in settings | All settings pages use padding: max(16px, env(safe-area-inset-*)) for top, left, right, bottom. |
| 6 | Bottom nav when in settings | When on /profile or /notifications, bottom nav remains visible; active state shows "Me" as current. |
| 7 | No horizontal scroll | Settings and all sub-pages have overflow-x: hidden; content never causes horizontal scroll. |
| 8 | Max content width | Main settings content has max-width (e.g. 560px) and is centered on large phones. |
| 9 | Consistent page class | All settings-related pages use a common class (e.g. .app-page .settings-page) for shared layout. |
| 10 | Settings entry from nav | Desktop/mobile nav "Profile" or "Account" goes to /profile; label is clear. |
| 11 | Deep link to tab | Support /profile?tab=notifications so links can open a specific settings tab directly. |
| 12 | Scroll restoration | When returning to profile, restore scroll position or scroll to top consistently. |
| 13 | Loading shell | While profile data loads, show header + skeleton or spinner so layout doesn’t jump. |
| 14 | Guest in settings | If user is not signed in and hits /profile, redirect to auth with returnUrl=/profile. |
| 15 | Settings title in tab | Document title (e.g. "Profile – App Name") when on settings pages. |
| 16 | Header shadow on scroll | Settings main page header gets subtle shadow when user scrolls (sticky header). |
| 17 | Pull-to-refresh on profile | Profile/Settings main page supports pull-to-refresh to reload profile data (optional). |
| 18 | Keyboard avoid | On mobile, when an input in settings is focused, ensure it’s not covered by keyboard. |
| 19 | Orientation in settings | Layout remains usable in landscape; forms and lists don’t break. |
| 20 | Focus after save | After saving profile, focus moves to a success message or back button for accessibility. |

---

## 2. Profile/Settings Main Layout (Tasks 21–45)

| # | Task | Description |
|---|------|--------------|
| 21 | Tab bar on mobile | Profile tabs (Personal, Skin, Goals, etc.) are a horizontal scrollable bar or pill group on mobile. |
| 22 | Tab touch target | Each tab has min 44px height and adequate horizontal padding; active tab clearly indicated. |
| 23 | Tab scroll snap | If many tabs, horizontal scroll with scroll-snap so one tab is centered or aligned. |
| 24 | Tab labels | Tab labels don’t truncate with ellipsis; use short names (e.g. "Personal", "Skin", "Goals"). |
| 25 | Section grouping | Settings content is grouped into sections with a section title (e.g. "Personal information"). |
| 26 | Section title style | Section titles use consistent font size (e.g. 0.75rem uppercase) and color (muted). |
| 27 | Spacing between sections | Consistent vertical gap (e.g. 24px) between sections on the profile page. |
| 28 | Card per section | Optionally wrap each section in a card with border-radius and subtle shadow for separation. |
| 29 | Avatar/hero at top | Profile avatar and name at top of profile; avatar min 64px, tappable for "Change photo". |
| 30 | Stats row in header | If stats (scans, score, shelf) appear in profile header, use a compact row with equal-width cells. |
| 31 | Save button placement | Primary "Save" is sticky at bottom or fixed above safe area; always visible when form is dirty. |
| 32 | Save button state | Save is disabled when form is not dirty; loading state (spinner) when submit in progress. |
| 33 | Unsaved warning | When user navigates away with unsaved changes, show confirm dialog (e.g. "Discard changes?"). |
| 34 | Success feedback | After save, show toast or inline success message; form no longer dirty. |
| 35 | Error summary | If save fails, show error at top of form or near Save button with retry option. |
| 36 | Form scroll to error | On validation error, scroll to first invalid field and focus it. |
| 37 | Long form sections | Very long tabs (e.g. Lifestyle) are scrollable with sticky section titles if needed. |
| 38 | No nested scroll | Avoid nested scroll areas; one main scroll for the settings content. |
| 39 | Divider between rows | List-style rows (e.g. notification toggles) have a subtle divider between items. |
| 40 | Row min height | Every clickable row in settings has min-height 44px. |
| 41 | Chevron for drill-down | Rows that navigate to a sub-page have a chevron or arrow on the right. |
| 42 | Value on right | For list rows that open a picker or sub-page, show current value on the right (e.g. "English"). |
| 43 | Inline vs drill-down | Use inline controls (toggle, input) when single value; drill to sub-page when complex. |
| 44 | Empty tab state | If a tab has no content yet, show short message and optional CTA instead of blank. |
| 45 | Profile photo placeholder | When no photo, show initials or generic avatar with "Add photo" overlay. |

---

## 3. Personal Info Tab (Tasks 46–65)

| # | Task | Description |
|---|------|--------------|
| 46 | Full name input | Name field has min-height 48px, 16px font size (no iOS zoom), label above. |
| 47 | Email display/edit | Email shown clearly; "Change email" opens modal or inline flow with validation. |
| 48 | Phone input | Phone field uses input type="tel" and appropriate inputmode; optional country code. |
| 49 | Date of birth | Use native date picker or a mobile-friendly picker for DOB; label and error below. |
| 50 | Gender/pronoun | Single select or chips for gender; full-width on mobile, min 44px per option. |
| 51 | Location field | Location (city/country) as text input or link to location picker; optional. |
| 52 | Timezone | Timezone shown as read-only or select; default from browser when possible. |
| 53 | Label above input | All personal info fields use label above input on mobile (not inline). |
| 54 | Required indicator | Required fields have asterisk or "Required" in label. |
| 55 | Error below field | Validation errors appear below the field with sufficient contrast (e.g. red text). |
| 56 | Photo upload area | "Change photo" or avatar tap opens file picker; area at least 44px or full avatar. |
| 57 | Photo crop/confirm | After selecting image, optional crop step or confirm before upload. |
| 58 | Upload progress | While photo uploads, show spinner or progress on avatar. |
| 59 | Photo error | If upload fails, show toast or inline error with retry. |
| 60 | Autocomplete attributes | Use autocomplete="name", "email", "tel" where appropriate. |
| 61 | No double submit | Submit button disabled and showing loading during save to prevent double-tap. |
| 62 | Success message | After profile save, show "Profile updated" toast or inline message. |
| 63 | Field spacing | Consistent vertical spacing (e.g. 16px) between form fields in Personal tab. |
| 64 | Optional fields | Optional fields clearly marked (e.g. "Optional") so users don’t feel forced. |
| 65 | Accessibility | All inputs have associated label (for/id or aria-label); errors with aria-describedby. |

---

## 4. Skin Profile Tab (Tasks 66–85)

| # | Task | Description |
|---|------|--------------|
| 66 | Skin type select | Skin type (Normal, Dry, Oily, etc.) as full-width select or bottom sheet on mobile. |
| 67 | Skin type options | All options visible in one list; current value pre-selected. |
| 68 | Skin tone | Skin tone (Fair, Light, Medium, etc.) as chips or select; min 44px tap per option. |
| 69 | Undertone | Undertone (Cool, Warm, Neutral) with clear labels and single selection. |
| 70 | Skin concerns multi-select | Concerns as multi-select chips or checklist; selected state clear. |
| 71 | Concern chips wrap | Concern chips wrap with consistent gap; no horizontal overflow. |
| 72 | Add/remove concern | Easy to add and remove concerns; "Select all that apply" or similar copy. |
| 73 | Skin profile summary | Optional short summary line under skin section (e.g. "Combination, medium tone"). |
| 74 | Section order | Logical order: type → tone → undertone → concerns. |
| 75 | Default values | Sensible defaults (e.g. Combination) when no data; user can change. |
| 76 | Save skin only | Option to save only skin section without leaving tab, or single Save for all. |
| 77 | Skin guide link | Link to "Skin type guide" or help for users unsure of type. |
| 78 | Visual feedback | Selected chip/option has distinct background and border. |
| 79 | Long list scroll | If concern list is long, section is scrollable within page. |
| 80 | Accessibility | Selects and chip groups have aria-label; selected state with aria-selected. |
| 81 | Skin type icon | Optional small icon per skin type for quick recognition. |
| 82 | Reset skin | Optional "Reset to default" for skin section. |
| 83 | Validation | At least one skin type selected; show error if required field empty on save. |
| 84 | Loading skin options | If options load from API, show skeleton or spinner until ready. |
| 85 | Skin + goals link | If goals depend on skin, subtle hint or link from skin to goals tab. |

---

## 5. Goals Tab (Tasks 86–100)

| # | Task | Description |
|---|------|--------------|
| 86 | Goals multi-select | Skin goals (Clear skin, Anti-aging, etc.) as multi-select chips or checklist. |
| 87 | Goal priority | If priority is supported, use drag handle or "High/Medium/Low" per goal. |
| 88 | Target timeline | Timeline (30 days, 90 days, etc.) as single select or segmented control. |
| 89 | Timeline options | All timeline options visible; current value highlighted. |
| 90 | Goals summary | Short line showing selected goals count (e.g. "3 goals selected"). |
| 91 | Min one goal | Encourage at least one goal; optional validation or hint. |
| 92 | Goal icons | Optional icon per goal for visual clarity. |
| 93 | Goal description | Optional expandable description per goal for new users. |
| 94 | Save goals | Save button applies to goals; feedback on success. |
| 95 | Goals and recommendations | If goals drive recommendations, note "Used for personalized tips" under section. |
| 96 | Reset goals | Optional "Clear all" or "Reset" for goals. |
| 97 | Spacing | Consistent spacing between goal chips and timeline control. |
| 98 | Touch targets | Each goal chip and timeline option min 44px tap area. |
| 99 | Accessibility | Goal group has fieldset/legend or aria-label; selected state announced. |
| 100 | Empty goals | If no goals selected, show CTA "Select at least one goal to get tailored advice." |

---

## 6. Lifestyle Tab (Tasks 101–120)

| # | Task | Description |
|---|------|--------------|
| 101 | Allergies multi-select | Allergies (Fragrances, Parabens, etc.) as multi-select; clear selected state. |
| 102 | Preferred ingredients | Preferred ingredients as multi-select chips; same pattern as skin concerns. |
| 103 | Budget range | Budget (Budget, Mid-range, Premium) as single select or cards. |
| 104 | Brand preferences | Brand preferences as text list or tags; optional autocomplete. |
| 105 | Climate | Climate (Temperate, Humid, etc.) as select; one choice. |
| 106 | Sun exposure | Sun exposure level as select or slider label. |
| 107 | Sleep quality | Sleep (Poor, Fair, Good) as select or short scale. |
| 108 | Stress level | Stress level as select or short scale. |
| 109 | Diet type | Diet (Balanced, Vegetarian, etc.) as select. |
| 110 | Section grouping | Group lifestyle into "Allergies & ingredients", "Budget & brands", "Lifestyle factors". |
| 111 | Long lists scroll | Allergy/ingredient lists scrollable; no tiny scroll area. |
| 112 | Search in ingredients | If ingredient list is long, add search/filter above list. |
| 113 | "None" option | Clear "None" or "No allergies" option when applicable. |
| 114 | Save lifestyle | Single Save for lifestyle or per-section save; clear feedback. |
| 115 | Validation | Validate format only where needed (e.g. no required allergies). |
| 116 | Accessibility | All lifestyle controls have labels; groups have legend or aria-label. |
| 117 | Optional sections | Mark optional sections so users don’t feel overwhelmed. |
| 118 | Tooltips or help | Optional (i) icon with short explanation for budget or climate. |
| 119 | Defaults | Sensible defaults (e.g. Balanced diet, Medium budget) when empty. |
| 120 | Responsive grid | If using 2-column for options on tablet, collapse to 1 column on narrow mobile. |

---

## 7. Notifications (Settings + Center) (Tasks 121–145)

| # | Task | Description |
|---|------|--------------|
| 121 | Notification toggles | Each notification preference (email, push, recommendations, etc.) is a toggle row. |
| 122 | Toggle row height | Each toggle row min 44px; toggle thumb and track large enough to tap. |
| 123 | Toggle label | Label on the left, toggle on the right; label describes what the setting does. |
| 124 | Toggle accessibility | Toggle has role="switch", aria-checked, aria-label. |
| 125 | Reminder times | AM/PM reminder times use time input or native time picker; min 44px tap. |
| 126 | Time display | Show time in user’s locale (e.g. 7:00 AM); clear AM/PM. |
| 127 | "Open notification settings" | Link to system notification settings (e.g. browser or OS) when push is off. |
| 128 | Notification center entry | "Notifications" in Me/settings opens Notification Center page with clear header. |
| 129 | Notification center list | Each notification item has min 44px height; read/unread state clear. |
| 130 | Mark all read | "Mark all as read" button with adequate tap target at top of list. |
| 131 | Filter by type | Filter (All, Unread, Reminder, etc.) as chips or dropdown; current filter highlighted. |
| 132 | Empty notifications | Empty state: icon + "No notifications" + short copy. |
| 133 | Delete single | Swipe or "Delete" on each item to remove; confirm for critical. |
| 134 | Notification time | Each item shows relative or absolute time (e.g. "2 hours ago"). |
| 135 | Notification icon | Icon per type (reminder, progress, alert) for quick scan. |
| 136 | In-app settings panel | Notification Center has "Settings" or inline panel for reminder times. |
| 137 | Sync with profile | Notification preferences in Profile tab and Notification Center stay in sync. |
| 138 | Push permission copy | Short copy explaining why push is useful and how to enable if denied. |
| 139 | Loading list | Notification list shows skeleton or spinner while loading. |
| 140 | Pull to refresh | Notification Center supports pull-to-refresh. |
| 141 | Sticky header | Notification Center header stays visible on scroll. |
| 142 | Back from center | Back from Notification Center returns to Me or previous page. |
| 143 | Badge count | If badge on bell shows count, it’s readable and doesn’t overflow. |
| 144 | Quiet hours | Optional "Quiet hours" (e.g. 22:00–07:00) with start/end time inputs. |
| 145 | Weekly summary day | If weekly summary is optional, allow user to pick day (e.g. Monday). |

---

## 8. Privacy Tab (Tasks 146–165)

| # | Task | Description |
|---|------|--------------|
| 146 | Profile visible toggle | "Profile visible to others" (or similar) as toggle row with label. |
| 147 | Share data toggle | "Share anonymized data for improvement" with short explanation below. |
| 148 | Show progress toggle | "Show progress to others" or similar; clear what "progress" means. |
| 149 | Privacy copy | Short, readable explanation under each toggle (1–2 lines). |
| 150 | Link to privacy policy | "Privacy policy" link opens /privacy in same tab or new; styled as link. |
| 151 | Link to data export | "Download my data" or "Export data" links to /export with clear label. |
| 152 | Link to delete account | "Delete account" in privacy or account section; destructive style. |
| 153 | Delete account flow | Delete account opens confirm modal with password or confirm step. |
| 154 | Privacy section order | Order: visibility → data sharing → progress → links (policy, export, delete). |
| 155 | Toggle consistency | Same toggle component and row style as Notifications tab. |
| 156 | Accessibility | Each toggle has aria-label describing the setting. |
| 157 | Legal requirement | If consent is required by region, ensure toggle and copy comply. |
| 158 | Save privacy | Privacy toggles save on change or via Save button; consistent with rest of profile. |
| 159 | Success feedback | After changing privacy, show toast or inline "Preferences saved." |
| 160 | Sensitive actions | "Delete account" and "Export data" use primary/danger button style. |
| 161 | Export explanation | Short line under "Export data": "Download a copy of your data (GDPR)." |
| 162 | No horizontal scroll | Privacy section content wraps; no overflow. |
| 163 | Spacing | Consistent spacing between toggle rows and between sections. |
| 164 | Defaults | Sensible defaults (e.g. profile visible on, share data off) for new users. |
| 165 | Revoke consent | If user turns off a consent toggle, confirm or explain effect (e.g. "Recommendations may be less personalized"). |

---

## 9. Stats Tab (Tasks 166–180)

| # | Task | Description |
|---|------|--------------|
| 166 | Stats cards layout | Stats (score, scans, shelf, routines) in 2×2 grid on mobile; equal card size. |
| 167 | Stat card min height | Each stat card has min height so content doesn’t look cramped. |
| 168 | Stat value font | Stat value (number) uses prominent, tabular-nums font. |
| 169 | Stat label | Label under value (e.g. "Scans") in muted, smaller text. |
| 170 | Progress chart | If progress chart (e.g. score over time), it’s readable on mobile; labels not cut off. |
| 171 | Chart touch | Chart doesn’t require hover; tap or scroll for interaction if needed. |
| 172 | Chart legend | Legend is visible and readable; avoid tiny text. |
| 173 | Empty stats | When no scans yet, show "Complete a scan to see your score" with CTA. |
| 174 | Link to history | "View scan history" or similar link to /history from stats. |
| 175 | Link to Digital Twin | "View Digital Twin" link to /digital-twin when relevant. |
| 176 | Loading stats | Stats section shows skeleton or spinner while loading. |
| 177 | Refresh stats | Optional refresh button or pull-to-refresh to reload stats. |
| 178 | Accessibility | Stats region has aria-label; chart has accessible alternative (table or summary). |
| 179 | Responsive chart | Chart scales with viewport; no horizontal scroll. |
| 180 | Section title | "Your stats" or "Overview" as section title above cards. |

---

## 10. Data Export Page (Tasks 181–200)

| # | Task | Description |
|---|------|--------------|
| 181 | Export page header | Data Export has back button and title "Export my data" (or similar). |
| 182 | Safe area | Export page uses safe-area insets. |
| 183 | Format choice | JSON vs PDF (or other) as radio group or segmented control; min 44px per option. |
| 184 | Include options | Checkboxes for "Include profile", "Include scans", "Include products" with labels. |
| 185 | Checkbox size | Checkboxes min 24×24px; label tappable. |
| 186 | Export button | Primary "Export" or "Download" button; full-width on mobile, min 48px height. |
| 187 | Export loading | During export, button shows spinner and is disabled. |
| 188 | Export success | After export, show success message and optional "Download again" or "Done". |
| 189 | Export error | On failure, show error message and "Try again" button. |
| 190 | GDPR copy | Short line: "You can request a copy of your data at any time (GDPR)." |
| 191 | Back after export | Back button returns to profile or previous page. |
| 192 | No horizontal scroll | Export form fits viewport. |
| 193 | Accessibility | Format and include options have fieldset/legend or aria-label. |
| 194 | Focus order | Tab order: format → includes → export button → back. |
| 195 | File name | Downloaded file has sensible name (e.g. my-data-2025-02-03.json). |
| 196 | Large export | If export is large, show progress or "Preparing…" state. |
| 197 | Sign-in required | If user is not signed in, redirect to auth with returnUrl=/export. |
| 198 | Export limits | If there are rate limits, show message after too many requests. |
| 199 | Link from privacy | Privacy tab has clear "Export my data" link to this page. |
| 200 | Mobile-specific | Layout and buttons follow same mobile patterns as rest of settings. |

---

## 11. Device & Context Page (Tasks 201–215)

| # | Task | Description |
|---|------|--------------|
| 201 | Device page header | "Device & context" with back to Me; safe area. |
| 202 | Intro copy | Short explanation of what data is collected; readable font size. |
| 203 | Section cards | Screen, Locale, Device, etc. in separate cards with consistent padding. |
| 204 | Refresh button | "Refresh with permissions" has min 44px height; loading state when requesting. |
| 205 | Copy JSON | "Copy JSON" button; feedback "Copied" toast. |
| 206 | Download JSON | "Download JSON" button; file name with date. |
| 207 | Row layout | Key-value rows (label left, value right) don’t overflow; wrap if needed. |
| 208 | Optional sections | Location, Motion, Ambient light only shown when available. |
| 209 | Collected at | Timestamp "Collected at" visible. |
| 210 | Link from Me | Me page has "Device & context" entry; same style as other list items. |
| 211 | Accessibility | Section headings and buttons have proper labels. |
| 212 | No horizontal scroll | Content fits viewport. |
| 213 | Sync-only button | "Update sync info" without requesting permissions; clear label. |
| 214 | Error state | If permission denied or error, show inline message. |
| 215 | Same app feel | Same card style, spacing, and button style as other settings pages. |

---

## 12. Consent, Privacy Policy, Terms (Tasks 216–235)

| # | Task | Description |
|---|------|--------------|
| 216 | Consent modal | Consent modal (cookie/preferences) has clear Accept and Settings/Reject; min 44px buttons. |
| 217 | Consent on mobile | Modal is bottom sheet or full-width on mobile; safe area. |
| 218 | Consent copy | Short, readable copy; link to full privacy policy. |
| 219 | Consent checkboxes | If granular consent (e.g. necessary, analytics), checkboxes min 24px. |
| 220 | Privacy policy page | /privacy has readable typography (16px body), consistent padding, no overflow. |
| 221 | Privacy headings | Clear h2/h3 hierarchy in privacy policy. |
| 222 | Terms page | /terms same treatment: readable, padded, hierarchy. |
| 223 | Back from legal | Back from privacy/terms returns to previous page or Me. |
| 224 | Links in legal | In-page links (e.g. #data) work; target has scroll-margin for sticky header. |
| 225 | Consent persistence | User’s consent choice is saved and modal doesn’t reappear until needed. |
| 226 | Revoke consent | Settings has "Privacy" or "Consent" entry to change choices. |
| 227 | Consent in profile | Profile or settings has link "Cookie preferences" or "Consent settings". |
| 228 | Legal page title | Document title "Privacy Policy" / "Terms" when on those pages. |
| 229 | Print-friendly | Legal pages optionally have print-friendly styles. |
| 230 | Accessibility | Consent modal has role="dialog", aria-labelledby; focus trap. |
| 231 | Cookie list | If listing cookies, use simple table or list that works on mobile. |
| 232 | Last updated | Privacy/terms show "Last updated: [date]". |
| 233 | Contact for privacy | Privacy page has contact or email for privacy requests. |
| 234 | Consent analytics | If user turns off analytics, confirm or explain impact. |
| 235 | Mobile padding | Legal pages use same horizontal padding as settings (e.g. 16px + safe area). |

---

## 13. Contact & Help (Tasks 236–250)

| # | Task | Description |
|---|------|--------------|
| 236 | Contact page | /contact has form or email link; header and back button. |
| 237 | Contact form | Name, email, message fields min 48px height; label above. |
| 238 | Contact submit | Submit button full-width on mobile, min 48px; loading state. |
| 239 | Contact success | After submit, show success message and optional "Send another". |
| 240 | Help in Me | Me page has "Help & Support" or "Contact" with chevron. |
| 241 | FAQ link | If FAQ exists, link from Help or Contact. |
| 242 | Help center link | Optional link to help center or docs. |
| 243 | Report a problem | "Report a problem" or "Feedback" with same form pattern. |
| 244 | About page | /about has app name, version, short description; readable on mobile. |
| 245 | About links | Links to privacy, terms, contact from About. |
| 246 | Version number | App version visible in About or Settings. |
| 247 | Accessibility | Contact form has labels and error association. |
| 248 | No captcha overflow | If captcha is used, it doesn’t break layout on small screens. |
| 249 | Contact from profile | Profile/Settings has "Help" or "Contact us" row. |
| 250 | Same list style | Help/Contact row uses same me-list-item style as other Me entries. |

---

## 14. Forms & Controls in Settings (Tasks 251–275)

| # | Task | Description |
|---|------|--------------|
| 251 | Input consistency | All text inputs in settings: min-height 48px, 16px font, border-radius 10–12px. |
| 252 | Select consistency | All selects use same height and padding; chevron or custom dropdown on mobile. |
| 253 | Toggle component | One toggle component used everywhere (notifications, privacy); track and thumb size consistent. |
| 254 | Toggle color | Toggle on state uses primary color; off state muted. |
| 255 | Checkbox consistency | All checkboxes same size (min 24px) and style. |
| 256 | Radio consistency | All radio buttons same size and style; one selected per group. |
| 257 | Chip/button group | Multi-select chips use same padding and min height (e.g. 36px). |
| 258 | Disabled state | Disabled inputs and buttons have reduced opacity and cursor not-allowed. |
| 259 | Focus ring | All focusable elements have visible :focus-visible ring (2px primary). |
| 260 | Error state | Invalid fields have border or outline and error message below. |
| 261 | Placeholder | Placeholders are hint text only; not replace labels. |
| 262 | Required asterisk | Required fields show * or "Required" in label. |
| 263 | Inline validation | Validate on blur or submit; don’t block typing. |
| 264 | Success state | After save, optional green check or "Saved" next to section. |
| 265 | Picker on mobile | Date/time/country pickers use native or bottom-sheet style on mobile. |
| 266 | Long select | Long lists (e.g. country) use searchable select or native select. |
| 267 | Slider if used | Any slider has large thumb (min 44px touch); label shows value. |
| 268 | Textarea | Textarea min height 80px; resizable optional. |
| 269 | Clear button | Text inputs have clear (X) when non-empty; min 44px tap. |
| 270 | Paste support | Password or sensitive fields allow paste where appropriate. |
| 271 | Autocomplete | Use autocomplete and inputmode for email, tel, etc. |
| 272 | No zoom on focus | 16px font on inputs to avoid iOS zoom. |
| 273 | Keyboard type | Numeric fields use inputmode="numeric" or "decimal". |
| 274 | Group labels | Fieldset/legend or aria-labelledby for groups (e.g. "Notification preferences"). |
| 275 | Live region | Success/error messages use aria-live so screen readers announce. |

---

## 15. Navigation & Sub-Pages (Tasks 276–290)

| # | Task | Description |
|---|------|--------------|
| 276 | Back from sub-page | Every settings sub-page (export, notifications, device, privacy, contact) has back to profile or Me. |
| 277 | Back button left | Back button in top-left; min 44×44px tap. |
| 278 | Sub-page title | Sub-page has clear h1 or title next to back button. |
| 279 | Breadcrumb optional | On desktop or tablet, optional breadcrumb (Me > Notifications); on mobile, back is enough. |
| 280 | Deep link | /profile?tab=notifications and /notifications both work; consistent entry. |
| 281 | Return URL | After login, redirect to returnUrl (e.g. /profile) when set. |
| 282 | Tab state in URL | Optional: tab state in URL so refresh keeps tab. |
| 283 | Sub-page scroll | Sub-page content scrolls in one main area; header can be sticky. |
| 284 | No duplicate nav | Don’t show both bottom nav and a second tab bar for same level. |
| 285 | Nested settings | If settings have 3rd level (e.g. Profile > Notifications > Reminder times), back goes one level up. |
| 286 | Link style | In-settings links (e.g. to privacy policy) look like links (color, underline on focus). |
| 287 | External link | External links open in new tab or with icon; optional. |
| 288 | Active section | When on a sub-page, Me or Profile is still marked active in bottom nav. |
| 289 | Transition | Subtle fade or slide when navigating between settings tabs or to sub-page. |
| 290 | Focus after nav | After navigating to sub-page, focus moves to main content or back button. |

---

## 16. Polish & App Feel (Tasks 291–300)

| # | Task | Description |
|---|------|--------------|
| 291 | Haptic on toggle | Where supported, light haptic when toggling a setting. |
| 292 | Haptic on save | Light or medium haptic on successful save. |
| 293 | Haptic on destructive | Medium haptic on "Delete account" or other destructive confirm. |
| 294 | Loading skeleton | Settings tabs show skeleton rows or cards while loading. |
| 295 | Empty state illustration | Empty states (e.g. no notifications) use consistent illustration or icon. |
| 296 | Pull-to-refresh | Profile main and Notification Center support pull-to-refresh where appropriate. |
| 297 | Offline message | If settings require network, show "You're offline" when appropriate. |
| 298 | Retry on error | After network error, show "Retry" button. |
| 299 | Consistent spacing | All settings pages use same spacing scale (8, 12, 16, 24, 32px). |
| 300 | Dark mode | Settings and all sub-pages support dark theme; cards and borders visible in dark. |

---

## Implementation Notes

- **Scope**: All tasks target **Settings** and **under-settings** (profile, notifications, privacy, export, device context, consent, contact, about, legal).
- **Viewport**: Mobile-first; apply at `max-width: 768px` or use same patterns across breakpoints.
- **Order**: Start with Settings entry & shell (1–20), then main layout (21–45), then tab-by-tab (Personal, Skin, Goals, Lifestyle, Notifications, Privacy, Stats), then sub-pages (Export, Device, Consent, Contact), then forms & controls, then navigation and polish.
- **Reference**: Profile page `frontend/src/pages/ProfileSettingsPage.tsx` and `ProfileSettingsPage.css`; NotificationCenterPage, DataExportPage, DeviceContextPage, ConsentPage, PrivacyPage, TermsPage, ContactPage, AboutPage.
- **Testing**: Verify on real devices (iOS Safari, Android Chrome); test with large font sizes and screen readers.

---

## Implementation Status (partial)

**Done (Tasks 1–45, selected 251–275):**
- **1–3:** Me → Preferences link; /profile as settings home; back from profile (mobile top bar + sticky header back, Link to /me).
- **5–9:** Safe area on profile and sub-pages; bottom nav clearance; no horizontal scroll; max content width 560px; .settings-page-app class.
- **11:** Deep link to tab: `/profile?tab=notifications` etc.; URL synced with activeTab (useSearchParams).
- **15:** Document title via usePageTitle.
- **17:** Pull-to-refresh on profile (existing).
- **20:** Focus after save: success message has ref and receives focus; role="status".
- **33:** Unsaved warning: beforeunload when isDirty.
- **36:** Scroll to first error and focus (name/phone refs, scrollIntoView + focus on validation failure).
- **40–42:** Settings rows min-height 44px; chevron and value on right (existing).
- **181–199:** Export: Support section has "Export my data" link to /export; Data Export page has app-page and mobile polish in mobile-app-polish.css.
- **251–252, 255–256, 272:** Input/select min-height 48px, 16px font; checkbox/radio min 24px; focus and spacing in ProfileSettingsPage mobile block.
- **Settings shell CSS:** `frontend/src/styles/mobile-app-polish.css` (Settings & under-settings block): safe area, floating save above nav, form controls, section spacing for profile, notification-center, data-export, device-ctx, consent, contact.
