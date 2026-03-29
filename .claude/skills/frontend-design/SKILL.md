---
name: pellicura-design
description: Pellicura skincare app design system. Create distinctive, clinical-grade UI that feels premium and trustworthy. Mobile-first, 4-breakpoint responsive (mobile/tablet/laptop/desktop). Use this for ALL frontend work.
---

# Pellicura Design System — UI/UX Skill

This skill guides ALL frontend work for Pellicura, a clinical-grade AI skincare platform targeting 1M+ users. Every UI element must feel premium, trustworthy, and distinctive.

## Brand Identity

- **Tone**: Clinical luxury meets approachable tech — think Glossier meets Apple Health
- **Personality**: Expert but warm, data-driven but human, clinical but beautiful
- **Differentiator**: Real AI scan data visualized beautifully — not just another pretty app

## Design Tokens (MANDATORY — never hardcode values)

### Typography
- Font family: System stack (fast, native feel on every device)
- Weights: `var(--font-weight-normal/medium/semibold/bold/extrabold)` → 400/500/600/700/800
- Sizes: `var(--font-size-xs/sm/base/lg/xl/2xl/3xl)` → 0.75/0.875/1/1.125/1.25/1.5/1.875rem
- Line heights: `var(--line-height-tight/snug/normal/relaxed/loose)` → 1.2/1.35/1.5/1.65/1.8
- Letter spacing: `var(--letter-spacing-tight/normal/wide)` → -0.025em/0/0.05em

### Colors (semantic tokens — NEVER use hex/rgb)
- Text: `var(--text-primary/secondary/muted)`
- Background: `var(--bg-primary/secondary/tertiary)`
- Brand: `var(--primary/primary-hover/primary-light/primary-dark)`
- Status: `var(--success/warning/danger)` + `-100/-600/-700` variants
- Border: `var(--border-color)`

### Spacing (8px base grid)
- Scale: 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 56px
- Card padding: 24px
- Section padding: 56px vertical
- Gaps: 12px (tight), 20px (normal), 24px (relaxed)
- Max content width: 1120px

### Elevation
- Shadows: `var(--shadow-sm/md/lg/xl/primary/card/card-hover)`
- Border radius: `var(--radius-sm/md/lg/xl/full)` → 6/8/12/16/9999px
- Z-index: `var(--z-dropdown/sticky/overlay/modal/toast/nav)` → 100-700

### Motion
- Transitions: `var(--transition-fast/base/slow)` → 0.15s/0.2s/0.3s
- Press scale: `var(--button-press-scale)` → 0.97
- Hover lift: `var(--card-hover-lift)` → -4px
- Easing: cubic-bezier(0.4, 0, 0.2, 1) for all interactions

## 4-Breakpoint Responsive (MANDATORY on every page)

```css
/* Mobile — phones */
@media (max-width: 768px) {
  /* 1 column, 16px padding, 48px touch targets */
}
/* Tablet — iPad */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 2 columns, 20px padding */
}
/* Laptop — MacBook */
@media (min-width: 1025px) and (max-width: 1440px) {
  /* 2-3 columns, 24px padding, 1120px max-width */
}
/* Desktop — monitors */
@media (min-width: 1441px) {
  /* 3 columns, 1120px max-width centered */
}
```

## Mobile-First Rules
- All inputs: 16px font-size (prevents iOS auto-zoom)
- Touch targets: minimum 44x44px (iOS) / 48x48px (Material)
- Safe areas: `env(safe-area-inset-*)` for iPhone notch
- Bottom nav clearance: `padding-bottom: max(96px, calc(96px + env(safe-area-inset-bottom)))`
- Haptic feedback on all button taps
- Use mobile components from `src/components/mobile/`

## Component Patterns

### Cards
- Background: `var(--bg-primary)`
- Border: none (use shadow for elevation)
- Radius: `var(--radius-xl)` (16px)
- Padding: 24px
- Shadow: `var(--shadow-card)`
- Hover: `var(--shadow-card-hover)` + `translateY(var(--card-hover-lift))`

### Buttons
- Primary: `var(--primary)` bg, white text, `var(--shadow-primary)`
- Sizes: sm (36px), md (44px), lg (52px)
- Press: `scale(var(--button-press-scale))`
- Full-width on mobile, auto on desktop
- Loading state: spinner replaces content

### Forms
- Input height: 48px minimum (mobile)
- Floating labels that animate on focus
- Error states with `var(--danger)` border + message
- Success feedback with `var(--success)` checkmark

### Empty States
- Centered illustration or icon (48-72px)
- Headline + description
- CTA button
- Consistent across all pages

## Accessibility (WCAG 2.1 AA)
- All `dangerouslySetInnerHTML` uses DOMPurify
- Color contrast: 4.5:1 minimum for text
- Focus visible on all interactive elements
- `prefers-reduced-motion` respected globally
- Skip link for keyboard navigation
- ARIA labels on all icon buttons
- `eslint-plugin-jsx-a11y` configured

## Anti-Patterns (NEVER DO)
- Never hardcode hex colors, px border-radius, or raw shadow values
- Never use `transition: all` — specify exact properties
- Never skip mobile/tablet breakpoints
- Never use touch targets under 44px
- Never render HTML without DOMPurify
- Never use `!important` (except reduced-motion global)
- Never hardcode font-weight numbers — use tokens
