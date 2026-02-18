# How to Use the New Mobile Sign-In Page
**Step-by-step integration guide**

---

## 🚀 **Quick Integration (3 Steps)**

### Step 1: Import Styles

Open `frontend/src/main.tsx` and add these imports at the top:

```typescript
import './styles/mobile-animations.css';
import './styles/mobile-gradients.css';
```

**Your main.tsx should look like:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/premium-polish.css'
import './styles/mobile-app-polish.css'
import './styles/mobile-animations.css'      // ✨ ADD THIS
import './styles/mobile-gradients.css'       // ✨ ADD THIS
// ... rest of imports
```

---

### Step 2: Update App Route

Open `frontend/src/App.tsx` and update the auth route:

**Option A: Mobile-First (Recommended)**
```typescript
// Replace line ~20-22
const AuthPage = React.lazy(() =>
  import("./pages/AuthPageMobile").then((module) => ({ 
    default: module.AuthPageMobile 
  }))
);
```

**Option B: Conditional (Keep Desktop Version)**
```typescript
// Add after imports (around line 15)
import { useMobileDetection } from "./hooks/useMobileDetection";

// Create wrapper component
function AuthRoute() {
  const { isMobile } = useMobileDetection();
  
  const AuthPage = React.lazy(() =>
    isMobile 
      ? import("./pages/AuthPageMobile").then(m => ({ default: m.AuthPageMobile }))
      : import("./pages/AuthPage").then(m => ({ default: m.AuthPage }))
  );
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthPage />
    </Suspense>
  );
}

// Then in routes (line ~74)
<Route path="/auth" element={<AuthRoute />} />
```

---

### Step 3: Test It!

```bash
# Start dev server
cd frontend
npm run dev

# Open in browser
http://localhost:3000/auth

# Or mobile view
npm run dev:mobile
```

---

## 🎨 **What You'll See**

### Desktop View (1025px+)
- Centered layout
- Card floats in middle
- Gradient background on left
- Features on register mode

### Tablet View (769-1024px)
- Similar to desktop
- Slightly narrower
- Optimized spacing

### Mobile View (≤768px)
- **Full-screen gradient background**
- **Large animated logo** (80px)
- **Bold title** "Pellicura"
- **Floating auth card** with shadows
- **Tab switcher** (Sign In / Sign Up)
- **Modern inputs** with floating labels
- **Gradient buttons** with haptics
- **Feature cards** (register mode)
- **Smooth animations** throughout

---

## 🎯 **Visual Preview**

### Sign In Mode:
```
📱 Phone Screen
├── Gradient bg (animated)
├── Logo (scales in)
├── Title "Pellicura"
├── Subtitle text
├── ╔════════╗
│   ║ Card   ║
│   ║━━━━━━━━║
│   ║ Tabs   ║ ← Sign In active
│   ║        ║
│   ║ Email  ║ ← Floating label
│   ║ Pass   ║ ← Floating label
│   ║ □ ☑️   ║ ← Remember / Forgot
│   ║        ║
│   ║ [Sign In]║ ← Gradient button
│   ║        ║
│   ║ ── or ──║
│   ║        ║
│   ║ [Google]║ ← Social login
│   ║        ║
│   ║ Sign Up?║ ← Switch link
│   ╚════════╝
└── Footer links
```

### Sign Up Mode:
```
📱 Phone Screen
├── (same header)
├── ╔════════╗
│   ║ Card   ║
│   ║━━━━━━━━║
│   ║ Tabs   ║ ← Sign Up active
│   ║        ║
│   ║ Name   ║ ← New field
│   ║ Email  ║
│   ║ Pass   ║
│   ║ ━━━━   ║ ← Strength bar
│   ║        ║
│   ║ [Create]║
│   ║ [Google]║
│   ║ Sign In?║
│   ╚════════╝
├── Features:
│   ├── 📷 AI Analysis
│   ├── ✨ Personalized
│   └── 📊 Track Progress
└── Footer
```

---

## 🎬 **Animation Sequence**

When user opens `/auth`:

```
0.0s  → Background appears
0.1s  → Logo scales in (0.9 → 1.0)
0.2s  → Title slides up from bottom
0.3s  → Subtitle slides up (delayed)
0.4s  → Card slides up from bottom
0.5s  → Form elements ready
```

When user switches tabs:
```
Click → Haptic vibration (10ms)
     → Indicator slides (300ms)
     → Color changes smoothly
```

When user submits:
```
Click → Haptic (medium)
     → Button scales (0.96)
     → Spinner appears
     → API call
     → Success → Navigate with transition
     → Error → Shake animation (400ms)
```

---

## 🔧 **Customization**

### Change Colors

In `AuthPageMobile.css`, update:
```css
/* Change gradient background */
.auth-mobile-bg {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* Change card shadow */
.auth-mobile-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

### Change Logo

In `AuthPageMobile.tsx`, replace:
```tsx
<div className="auth-mobile-logo animate-scale-in">
  <IconSparkles size={48} strokeWidth={2} />
  {/* Or use your logo: */}
  {/* <img src="/logo.png" alt="Logo" /> */}
</div>
```

### Change Animation Speed

In `AuthPageMobile.css`:
```css
.auth-mobile-card {
  animation: slideUp 0.4s ease; /* Change 0.4s */
}
```

---

## 🐛 **Troubleshooting**

### Issue: Animations not working
**Solution:** Import animation CSS in `main.tsx`:
```typescript
import './styles/mobile-animations.css';
```

### Issue: Gradients not showing
**Solution:** Import gradient CSS in `main.tsx`:
```typescript
import './styles/mobile-gradients.css';
```

### Issue: Components not found
**Solution:** Check import paths:
```typescript
import { MobileButton } from './components/mobile';
import { MobileInput } from './components/mobile';
```

### Issue: Inputs zooming on iOS
**Solution:** Already fixed! Inputs use 16px font size to prevent zoom.

### Issue: Page not full height
**Solution:** Already handled with `100dvh` (dynamic viewport height).

---

## ✅ **Verification Checklist**

After integration, verify:

- [ ] Page loads with gradient background
- [ ] Logo animates on entry (scales in)
- [ ] Title and subtitle slide up
- [ ] Card slides up from bottom
- [ ] Tab switcher indicator animates
- [ ] Input labels float on focus
- [ ] Password strength bar works (register)
- [ ] Buttons have haptic feedback
- [ ] Error messages shake
- [ ] Loading spinner appears
- [ ] Google sign-in button shows
- [ ] Features show (register mode)
- [ ] Dark mode works
- [ ] Safe areas respected (iPhone)
- [ ] Landscape mode works

---

## 🎉 **You're Done!**

Your sign-in page is now:
- ✨ Modern & beautiful
- 📱 Mobile-first
- 🎬 Smoothly animated
- 💫 Professionally polished
- 🏆 World-class quality

**Navigation:** http://localhost:3000/auth

**Try it on mobile or Chrome DevTools (F12 → Device toolbar)!**

---

## 📚 **Related Documentation**

- `MOBILE_GUI_PROFESSIONAL_SUMMARY.md` - Complete component guide
- `MOBILE_GUI_QUICK_REFERENCE.md` - Quick component lookup
- `SIGN_IN_PAGE_REDESIGN.md` - Design details
- `MOBILE_SETUP_GUIDE.md` - Mobile features

---

**Need help?** Check the example code in the component files or documentation above.

**Ready to ship!** 🚀

*Created: February 5, 2026*
