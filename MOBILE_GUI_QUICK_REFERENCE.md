# Mobile GUI Components - Quick Reference
**Fast lookup guide for mobile components**

---

## 📦 Import All Components

```typescript
// Single import for all mobile components
import {
  MobileButton,
  MobileCard,
  MobileInput,
  MobileTextarea,
  MobileSkeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonProductGrid,
  PageTransition,
} from './components/mobile';
```

---

## 🎨 Components Cheat Sheet

### MobileButton

```tsx
<MobileButton 
  variant="primary | secondary | outline | ghost | danger"
  size="small | medium | large"
  fullWidth
  loading
  disabled
  icon={<Icon />}
  iconPosition="left | right"
  haptic="light | medium | heavy | none"
  onClick={() => {}}
>
  Button Text
</MobileButton>
```

**Quick Examples:**
```tsx
// Primary CTA
<MobileButton variant="primary" size="large" fullWidth>Continue</MobileButton>

// With icon
<MobileButton icon={<IconPlus />}>Add Item</MobileButton>

// Loading state
<MobileButton loading={isSubmitting}>Submit</MobileButton>

// Danger action
<MobileButton variant="danger" haptic="heavy">Delete</MobileButton>
```

---

### MobileCard

```tsx
<MobileCard
  variant="elevated | outlined | filled"
  padding="none | small | medium | large"
  pressable
  hoverable
  haptic
  onClick={() => {}}
>
  Card Content
</MobileCard>
```

**Quick Examples:**
```tsx
// Elevated card
<MobileCard variant="elevated" padding="medium">
  <h3>Title</h3>
  <p>Description</p>
</MobileCard>

// Clickable card
<MobileCard onClick={() => navigate('/product')} pressable>
  Product Info
</MobileCard>

// No padding (for images)
<MobileCard padding="none">
  <img src={image} />
</MobileCard>
```

---

### MobileInput

```tsx
<MobileInput
  label="Label"
  type="text | email | password | tel | number | search"
  value={value}
  onChange={setValue}
  placeholder="Placeholder"
  error="Error message"
  required
  disabled
  icon={<Icon />}
  maxLength={100}
/>

<MobileTextarea
  label="Label"
  value={value}
  onChange={setValue}
  rows={4}
  autoResize
  maxLength={500}
/>
```

**Quick Examples:**
```tsx
// Email input
<MobileInput 
  label="Email" 
  type="email" 
  value={email} 
  onChange={setEmail}
  icon={<IconMail />}
  required
/>

// With validation
<MobileInput 
  label="Password"
  type="password"
  value={password}
  onChange={setPassword}
  error={passwordError}
  maxLength={128}
/>

// Auto-resize textarea
<MobileTextarea 
  label="Bio"
  value={bio}
  onChange={setBio}
  autoResize
  maxLength={500}
/>
```

---

### MobileSkeleton

```tsx
// Individual skeleton
<MobileSkeleton 
  variant="text | circular | rectangular | rounded"
  width="100px | 80%"
  height="20px | 100"
  animation="wave | pulse | none"
/>

// Pre-built patterns
<SkeletonCard />
<SkeletonList count={5} />
<SkeletonProductGrid count={6} />
```

**Quick Examples:**
```tsx
// Text skeleton
<MobileSkeleton variant="text" width="80%" />

// Avatar
<MobileSkeleton variant="circular" width={48} height={48} />

// Product card loading
{loading ? <SkeletonProductGrid count={6} /> : <ProductGrid products={products} />}
```

---

### PageTransition

```tsx
<PageTransition type="slide | fade | scale | slideUp" duration={300}>
  {children}
</PageTransition>
```

**Quick Examples:**
```tsx
// iOS-style slide
<PageTransition type="slide">
  <Routes>{routes}</Routes>
</PageTransition>

// Fade transition
<PageTransition type="fade" duration={200}>
  {content}
</PageTransition>

// Material Design scale
<PageTransition type="scale">
  {page}
</PageTransition>
```

---

## 🎨 CSS Utilities

### Animations

```html
<!-- Entrance animations -->
<div class="animate-fade-in">Fade in</div>
<div class="animate-slide-up">Slide up</div>
<div class="animate-scale-in">Scale in</div>

<!-- Stagger list items -->
<div class="animate-stagger-item">Item 1</div>
<div class="animate-stagger-item">Item 2</div>

<!-- Micro-interactions -->
<button class="press-bounce">Bounces on press</button>
<button class="ripple">Ripple effect</button>
<div class="hover-lift">Lifts on hover</div>

<!-- Loading -->
<div class="animate-spin">Spinning</div>
<div class="animate-pulse">Pulsing</div>
<div class="shimmer">Shimmer effect</div>
```

### Gradients

```html
<!-- Background gradients -->
<div class="bg-gradient-primary">Primary</div>
<div class="bg-gradient-secondary">Secondary</div>
<div class="bg-gradient-success">Success</div>
<div class="bg-gradient-gold">Gold</div>
<div class="bg-gradient-sunset">Sunset</div>

<!-- Gradient text -->
<h1 class="text-gradient">Gradient Text</h1>

<!-- Glass morphism -->
<div class="glass-primary">Frosted glass</div>

<!-- Animated gradient -->
<div class="bg-gradient-animated">Shifting colors</div>

<!-- Shadows -->
<div class="shadow-gradient-primary">With shadow</div>
```

---

## 💡 Common Patterns

### Login Form
```tsx
<form className="animate-slide-up">
  <MobileInput
    label="Email"
    type="email"
    value={email}
    onChange={setEmail}
    icon={<IconMail />}
    required
  />
  <MobileInput
    label="Password"
    type="password"
    value={password}
    onChange={setPassword}
    icon={<IconLock />}
    required
  />
  <MobileButton variant="primary" fullWidth loading={isLoading}>
    Sign In
  </MobileButton>
</form>
```

### Product Card
```tsx
<MobileCard 
  variant="elevated"
  onClick={() => navigate(`/product/${id}`)}
  pressable
  className="animate-stagger-item"
>
  <img src={product.image} alt={product.name} loading="lazy" />
  <h3>{product.name}</h3>
  <p class="text-gradient">${product.price}</p>
  <MobileButton variant="outline" size="small" fullWidth>
    Add to Cart
  </MobileButton>
</MobileCard>
```

### Loading State
```tsx
{loading ? (
  <SkeletonProductGrid count={6} />
) : (
  <div className="product-grid">
    {products.map((product, i) => (
      <ProductCard 
        key={product.id} 
        product={product}
        className="animate-stagger-item"
        style={{ animationDelay: `${i * 0.05}s` }}
      />
    ))}
  </div>
)}
```

### Modal with Transition
```tsx
{isOpen && (
  <>
    <div className="modal-backdrop-fade" onClick={onClose} />
    <div className="modal-slide-up">
      <MobileCard variant="elevated" padding="large">
        <h2>Modal Title</h2>
        <MobileInput label="Name" value={name} onChange={setName} />
        <MobileButton variant="primary" onClick={handleSubmit}>
          Save
        </MobileButton>
      </MobileCard>
    </div>
  </>
)}
```

### Hero Section
```tsx
<section className="bg-gradient-animated">
  <div className="glass-white" style={{ padding: '48px 24px' }}>
    <h1 className="text-gradient animate-slide-up">
      Welcome to Pellicura
    </h1>
    <p className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      Your AI skincare companion
    </p>
    <MobileButton 
      variant="primary" 
      size="large"
      className="animate-slide-up"
      style={{ animationDelay: '0.2s' }}
    >
      Get Started
    </MobileButton>
  </div>
</section>
```

---

## 🎯 Pro Tips

### Performance
- Use `loading="lazy"` on images
- Apply animations only to visible elements
- Use skeletons instead of spinners
- Implement virtual scrolling for long lists

### Animations
- Keep entrance animations under 0.4s
- Use stagger for lists (50ms delay)
- Respect `prefers-reduced-motion`
- Hardware-accelerate with transform/opacity

### Haptics
- Light: Navigation, taps
- Medium: Success, selections
- Heavy: Errors, deletions

### Accessibility
- All components have ARIA labels
- Keyboard navigation supported
- Screen reader friendly
- Color contrast WCAG AA compliant

---

## 🐛 Troubleshooting

**Issue:** Animations not working
```typescript
// Import animation CSS
import './styles/mobile-animations.css';
```

**Issue:** Gradients not showing
```typescript
// Import gradient CSS
import './styles/mobile-gradients.css';
```

**Issue:** Components not found
```typescript
// Check import path
import { MobileButton } from './components/mobile';
// OR
import { MobileButton } from './components/mobile/MobileButton';
```

**Issue:** Haptic feedback not working
```typescript
// Check import
import { triggerHaptic } from './utils/mobileOptimizations';
```

---

## 📚 Full Documentation

- **Complete Guide:** `MOBILE_GUI_IMPROVEMENTS.md`
- **Mobile Setup:** `MOBILE_SETUP_GUIDE.md`
- **Features Summary:** `MOBILE_FEATURES_SUMMARY.md`

---

**Quick Start:** Import component → Use with props → Add animations → Done! 🎉

*Created: February 5, 2026*
