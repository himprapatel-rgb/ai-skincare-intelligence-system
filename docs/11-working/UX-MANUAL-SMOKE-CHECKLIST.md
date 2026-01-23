# Manual UX Smoke Checklist (Live)

Use this checklist for a full manual pass on the live app. It covers
visual, camera permission, and critical flows that cannot be verified
purely by automated tests.

## Environment
- Live URL: https://frontend-production-0415.up.railway.app/
- Test account: himanshu@test.com / Test1234!
- Device: Desktop Chrome (latest), plus one mobile device or emulator

## Preflight
- Clear cache and cookies for the site.
- Disable ad blockers or strict privacy extensions for this test.
- Set timezone to local for date display validation.

## Auth & Core Navigation
- Open home page, verify hero layout and CTA visibility.
- Go to Login, sign in, confirm redirect to Dashboard.
- Header links navigate to: Home, Analysis, Dashboard, About.
- Footer links navigate to: Skin Analysis, Dashboard, History, Login/Register,
  About Us, Contact, Privacy, Terms, Delete My Data.
- Logout returns to Home and removes authenticated UI.

## Scan Flow (Camera)
- Navigate to Scan.
- When prompted, allow camera permissions.
- Verify camera preview appears and is not frozen.
- Capture a scan and confirm progress indicators show.
- On success, confirm Analysis Results page shows:
  - Analysis date formatted (Mon DD, YYYY)
  - Confidence bar visible and colored
  - Concerns and severity appear if data exists
- If scan fails, confirm Retry Scan button and fallback copy display.

## Scan Flow (Upload)
- If upload option exists, upload a valid image file.
- Verify upload progress and final analysis results.
- Try invalid file type and confirm user-friendly error.

## Dashboard
- Check key cards: Skin Health Score, Total Scans, My Products, Active Routines.
- Next Scan Reminder date uses short month format.
- Quick Actions navigate correctly.
- Recent Activity list shows last scans or empty state.

## History
- Filters (7/30/90 days) change the list.
- Avg Score is calculated using completed scans only.
- Individual scan cards open detail views without errors.

## My Shelf
- Add Product button routes to Scan.
- Product cards render with images or fall back placeholder.
- Search and status filters work as expected.

## Profile
- Tabs render on desktop and scroll on mobile.
- Statistics show "My Products".
- Update profile fields (no errors).

## Recommendations / Routine Builder
- Recommendations list loads without "Not Found".
- Routine Builder loads and shows default UI state.

## Notifications / Export / Progress
- Each page loads and shows non-empty UI (or clear empty states).
- Export triggers download or shows confirmation messaging.

## Mobile Layout (small viewport)
- Header does not overlap content.
- Tabs (Profile) remain accessible (horizontal scroll).
- CTA buttons fit without clipping.

## Accessibility Quick Check
- Tab through primary CTAs; focus visible.
- Forms show labels and error messaging.
- Contrast acceptable on primary buttons and pills.

## Performance / Stability
- Page transitions under 2 seconds.
- No visible console errors during core flows.

## Regression Notes
- Record any broken links, layout shifts, or missing data states.
- Capture screenshots of any issues.

