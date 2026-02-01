# Task 10000: Mobile App Look in Mobile Browser

**Status:** In Progress  
**Priority:** High  
**Sprint:** GUI Polish

---

## Objective

Make Pellicura feel like a native mobile app when opened in a mobile browser (Chrome, Safari, etc.)—especially when "Add to Home Screen" is used. Users should get an app-like experience: no browser chrome when launched from home screen, proper safe areas, smooth touch interactions, and no accidental pull-to-refresh.

---

## Acceptance Criteria

- [ ] **PWA manifest** – `display: standalone`, proper icons, theme colors
- [ ] **Apple meta tags** – `apple-mobile-web-app-capable`, status bar style, app title
- [ ] **Viewport** – `viewport-fit=cover` for full-screen, notch support
- [ ] **Safe areas** – content respects `env(safe-area-inset-*)` on notched devices
- [ ] **Touch behavior** – no 300ms tap delay, no blue tap highlight
- [ ] **Overscroll** – no pull-to-refresh / rubber-band when scrolling to edges
- [ ] **Dynamic viewport** – `100dvh` for correct height when mobile browser chrome shows/hides
- [ ] **Add to Home Screen** – app opens without URL bar when launched from home screen icon

---

## Implementation Checklist

### 1. HTML Meta Tags (`index.html`)

| Meta | Value | Purpose |
|------|-------|---------|
| `viewport` | `width=device-width, initial-scale=1.0, viewport-fit=cover` | Full viewport, notch support |
| `apple-mobile-web-app-capable` | `yes` | Run in standalone mode when from home screen |
| `apple-mobile-web-app-status-bar-style` | `black-translucent` | Status bar over content (immersive) |
| `apple-mobile-web-app-title` | `SkinCareAI` | Name shown under home screen icon |
| `theme-color` | `#2563eb` | Browser UI / status bar color |
| `format-detection` | `telephone=no` | Prevent auto-linking phone numbers |

### 2. Manifest (`manifest.json`)

- `display`: `standalone` – no browser UI
- `display_override`: `["standalone", "minimal-ui", "browser"]` – fallback order
- `background_color`, `theme_color` – match brand
- `orientation`: `portrait-primary` – preferred for skincare app
- `categories`: `["health", "lifestyle"]`
- Icons: 192x192 and 512x512 PNG (maskable) recommended for best results

### 3. CSS Enhancements

- `overscroll-behavior: none` – disable pull-to-refresh / overscroll bounce
- `-webkit-tap-highlight-color: transparent` – no blue tap flash
- `touch-action: manipulation` – remove 300ms tap delay
- `-webkit-text-size-adjust: 100%` – prevent iOS font scaling on rotate
- `min-height: 100dvh` – dynamic viewport height
- Safe-area insets on body, bottom nav, main content

### 4. Optional Improvements (Future)

- [ ] Add splash screen images for iOS (`apple-touch-startup-image`)
- [ ] Add proper 192x192 and 512x512 PNG icons (maskable) for Android
- [ ] Service worker for offline support
- [ ] Install prompt ("Add to Home Screen") for first-time mobile visitors

---

## References

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [iOS Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env#safe-area-inset-left_right_top_bottom)
- [100dvh / Dynamic Viewport](https://caniuse.com/viewport-unit-variants)
