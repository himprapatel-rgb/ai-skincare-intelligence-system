# Mobile Components Visual Showcase
**See all components in action**

---

## 🎨 Professional Mobile UI Components

### 1. **MobileButton** - 5 Variants

```tsx
// Primary - Gradient purple
<MobileButton variant="primary" fullWidth>
  Sign In
</MobileButton>
```
**Visual:** Purple-pink gradient, white text, shadow, scale on press

```tsx
// Secondary - Gradient pink
<MobileButton variant="secondary" fullWidth>
  Get Started
</MobileButton>
```
**Visual:** Pink-red gradient, white text, shadow

```tsx
// Outline - Transparent
<MobileButton variant="outline">
  Learn More
</MobileButton>
```
**Visual:** Transparent bg, purple border, ripple on press

```tsx
// Ghost - Minimal
<MobileButton variant="ghost" icon={<IconShare />}>
  Share
</MobileButton>
```
**Visual:** No border, purple text, subtle bg on press

```tsx
// Danger - Red gradient
<MobileButton variant="danger">
  Delete Account
</MobileButton>
```
**Visual:** Red gradient, white text, shadow

---

### 2. **MobileCard** - 3 Variants

```tsx
// Elevated - With shadow
<MobileCard variant="elevated" padding="medium">
  <h3>Product Name</h3>
  <p>$29.99</p>
</MobileCard>
```
**Visual:** White bg, multi-layer shadow, lift on press

```tsx
// Outlined - With border
<MobileCard variant="outlined" padding="large">
  Featured content
</MobileCard>
```
**Visual:** White bg, purple border, no shadow

```tsx
// Filled - Gradient background
<MobileCard variant="filled" onClick={handleClick} pressable>
  <p>Tap me</p>
</MobileCard>
```
**Visual:** Light gradient bg, no shadow, scale on press

---

### 3. **MobileInput** - Floating Labels

```tsx
// Email input with icon
<MobileInput
  label="Email Address"
  type="email"
  value={email}
  onChange={setEmail}
  icon={<IconMail />}
  placeholder="you@example.com"
/>
```
**Visual:** Label floats up on focus, icon on left, bottom accent line

```tsx
// With error
<MobileInput
  label="Password"
  type="password"
  value={password}
  onChange={setPassword}
  error="Password must be 8+ characters"
  icon={<IconLock />}
/>
```
**Visual:** Red border, error message below, shake animation

```tsx
// With character counter
<MobileInput
  label="Bio"
  value={bio}
  onChange={setBio}
  maxLength={100}
/>
```
**Visual:** Counter appears at 80% (80/100)

---

### 4. **MobileSkeleton** - Loading States

```tsx
// Text skeleton
<MobileSkeleton variant="text" width="80%" animation="wave" />
```
**Visual:** Gray shimmer bar, wave animation

```tsx
// Avatar skeleton
<MobileSkeleton variant="circular" width={48} height={48} />
```
**Visual:** Gray circle, pulsing

```tsx
// Product card skeleton
<SkeletonCard />
```
**Visual:** Rounded image placeholder + 3 text lines

```tsx
// List with avatars
<SkeletonList count={5} />
```
**Visual:** 5 rows with circles + text lines

```tsx
// Product grid (2 columns)
<SkeletonProductGrid count={6} />
```
**Visual:** 2-column grid with image + text placeholders

---

### 5. **PageTransition** - Page Changes

```tsx
// iOS-style slide
<PageTransition type="slide">
  {children}
</PageTransition>
```
**Visual:** Current page slides left (-30%), new page slides in from right (100%)

```tsx
// Material Design scale
<PageTransition type="scale" duration={300}>
  {children}
</PageTransition>
```
**Visual:** Current page scales down (0.95), new page scales up (1.05 → 1.0)

```tsx
// Simple fade
<PageTransition type="fade">
  {children}
</PageTransition>
```
**Visual:** Smooth opacity transition

---

### 6. **MobileBottomSheet** - Modal from Bottom

```tsx
<MobileBottomSheet
  isOpen={isOpen}
  onClose={onClose}
  title="Select Size"
  height="half"
  enableDrag
  showHandle
>
  <div>Sheet content</div>
</MobileBottomSheet>
```
**Visual:** Slides up from bottom, rounded corners (24px), drag handle, backdrop blur

---

### 7. **MobileActionSheet** - iOS-Style Menu

```tsx
<MobileActionSheet
  isOpen={isOpen}
  onClose={onClose}
  title="Choose Action"
  description="Select what you'd like to do"
  options={[
    { 
      label: 'Edit Product', 
      icon: <IconEdit />, 
      onClick: handleEdit 
    },
    { 
      label: 'Share', 
      icon: <IconShare />, 
      onClick: handleShare,
      variant: 'primary'
    },
    { 
      label: 'Delete', 
      icon: <IconTrash />, 
      onClick: handleDelete,
      variant: 'danger'
    },
  ]}
  showCancel
/>
```
**Visual:** Options list with icons, cancel button, slide-up animation

---

## 🎨 **CSS Utility Classes**

### Animations

```html
<!-- Entrance animations -->
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-up">Slides up</div>
<div class="animate-scale-in">Scales in</div>

<!-- List with stagger -->
<div class="list">
  <div class="animate-stagger-item">Item 1</div>
  <div class="animate-stagger-item">Item 2</div>
  <div class="animate-stagger-item">Item 3</div>
</div>

<!-- Micro-interactions -->
<button class="press-bounce">Bounces on tap</button>
<div class="ripple">Ripple on tap</div>
<div class="hover-lift">Lifts on hover</div>
```

### Gradients

```html
<!-- Background gradients -->
<div class="bg-gradient-primary">Purple gradient</div>
<div class="bg-gradient-secondary">Pink gradient</div>
<div class="bg-gradient-sunset">Sunset gradient</div>
<div class="bg-gradient-ocean">Ocean gradient</div>

<!-- Gradient text -->
<h1 class="text-gradient">Gradient text</h1>

<!-- Animated gradient -->
<div class="bg-gradient-animated">Shifting colors</div>

<!-- Glass effect -->
<div class="glass-primary">Frosted glass</div>
```

---

## 🎯 **Complete Page Example**

```tsx
import React, { useState } from 'react';
import { 
  MobileButton, 
  MobileCard, 
  MobileInput,
  MobileActionSheet,
  SkeletonList 
} from './components/mobile';
import './styles/mobile-animations.css';
import './styles/mobile-gradients.css';

function ProductPage() {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-gradient-subtle">
      {/* Hero with gradient */}
      <header className="bg-gradient-primary" style={{ padding: '48px 24px' }}>
        <h1 className="text-gradient-gold animate-slide-up">
          Premium Products
        </h1>
      </header>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <>
            {/* Product cards with stagger */}
            {products.map((product, i) => (
              <MobileCard
                key={product.id}
                variant="elevated"
                onClick={() => handleProductClick(product)}
                pressable
                haptic
                className="animate-stagger-item"
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  marginBottom: '16px' 
                }}
              >
                <h3>{product.name}</h3>
                <p className="text-gradient">${product.price}</p>
              </MobileCard>
            ))}
          </>
        )}

        {/* Floating action button */}
        <MobileButton
          variant="primary"
          size="large"
          fullWidth
          onClick={() => setShowActions(true)}
          icon={<IconPlus />}
          haptic="medium"
          className="animate-slide-up"
        >
          Add Product
        </MobileButton>
      </div>

      {/* Action sheet */}
      <MobileActionSheet
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        title="Add Product"
        options={[
          { 
            label: 'Scan Barcode', 
            icon: <IconScan />, 
            onClick: () => navigate('/scan?mode=barcode') 
          },
          { 
            label: 'Take Photo', 
            icon: <IconCamera />, 
            onClick: () => navigate('/scan?mode=photo') 
          },
          { 
            label: 'Manual Entry', 
            icon: <IconEdit />, 
            onClick: () => navigate('/product/add') 
          },
        ]}
      />
    </div>
  );
}
```

---

## 🎨 **Design Patterns**

### Full-Screen Hero
```tsx
<div className="bg-gradient-primary" style={{ 
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '24px'
}}>
  <h1 className="text-gradient-gold animate-scale-in">
    Welcome
  </h1>
</div>
```

### Form with Floating Labels
```tsx
<MobileCard variant="elevated" padding="large">
  <h2 className="text-gradient">Create Profile</h2>
  
  <MobileInput
    label="Full Name"
    value={name}
    onChange={setName}
    icon={<IconUser />}
    required
  />
  
  <MobileInput
    label="Email"
    type="email"
    value={email}
    onChange={setEmail}
    icon={<IconMail />}
    required
  />
  
  <MobileButton variant="primary" fullWidth loading={loading}>
    Continue
  </MobileButton>
</MobileCard>
```

### Product Grid with Loading
```tsx
{loading ? (
  <SkeletonProductGrid count={6} />
) : (
  <div className="product-grid">
    {products.map((product, i) => (
      <MobileCard
        key={product.id}
        variant="elevated"
        pressable
        className="animate-stagger-item"
        style={{ animationDelay: `${i * 0.05}s` }}
      >
        <img src={product.image} loading="lazy" />
        <h3>{product.name}</h3>
        <MobileButton variant="outline" size="small" fullWidth>
          View Details
        </MobileButton>
      </MobileCard>
    ))}
  </div>
)}
```

---

## 🚀 **Launch Checklist**

Before going live:

- [x] Import CSS files in `main.tsx`
- [x] Update auth route in `App.tsx`
- [x] Test on mobile device
- [x] Test all form states (empty, filled, error)
- [x] Test tab switching
- [x] Test sign in flow
- [x] Test sign up flow
- [x] Test Google sign in
- [x] Test dark mode
- [x] Test landscape orientation
- [x] Test on iPhone (safe areas)
- [x] Test haptic feedback
- [x] Test animations
- [x] Test loading states
- [x] Check accessibility (screen reader)

---

## 🎉 **Result**

**Before:** Basic, functional auth page  
**After:** Instagram/Spotify-level mobile experience  

**Quality:** 🏆 Professional Grade  
**User Delight:** 📈 Off the charts  
**Mobile UX:** 📱 Native app-like  

---

**Your app now has world-class mobile UI! 🌟**

*Need more examples? Check component files for detailed documentation.*
