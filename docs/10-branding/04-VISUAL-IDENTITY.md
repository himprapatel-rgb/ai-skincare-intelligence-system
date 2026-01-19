# Visual Identity Guidelines

## Overview

This document establishes the visual identity system for AI Skincare Intelligence System, informed by color psychology research in skincare branding and competitive analysis.

---

## Color Palette

### Primary Colors

Based on skincare color psychology research, our palette balances trust (blue), technology (teal), and warmth (coral accents).

#### Primary - Intelligent Teal
```
Hex: #0D9488
RGB: 13, 148, 136
Usage: Primary CTAs, headers, key UI elements
Psychology: Trust, intelligence, calm, technology
```

#### Secondary - Warm Coral
```
Hex: #F97316
RGB: 249, 115, 22
Usage: Accents, highlights, progress indicators
Psychology: Energy, warmth, health, vitality
```

#### Neutral - Deep Navy
```
Hex: #1E293B
RGB: 30, 41, 59
Usage: Text, backgrounds, contrast
Psychology: Authority, professionalism, depth
```

### Extended Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Soft Sage | #D1FAE5 | Success states, positive |
| Gentle Lavender | #E0E7FF | Calm UI backgrounds |
| Warm Cream | #FEF3C7 | Warning, attention |
| Soft Rose | #FCE7F3 | Sensitive skin content |
| Pure White | #FFFFFF | Backgrounds, clarity |
| Light Gray | #F8FAFC | Secondary backgrounds |

### Color Psychology in Skincare

| Color | Emotional Response | Best Use |
|-------|-------------------|----------|
| Blue/Teal | Trust, calm, technology | Primary brand, sensitive skin |
| Green | Natural, balance, healing | Organic, results |
| Coral/Orange | Energy, vitality, confidence | CTAs, progress |
| Purple | Premium, expertise | Anti-aging content |
| White | Clean, pure, clinical | Backgrounds |

---

## Typography

### Primary Typeface - Inter

**Why Inter:**
- Excellent screen legibility
- Modern, clean aesthetic
- Wide weight range
- Free and open source

#### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 - Hero | 48px / 3rem | Bold (700) | 1.2 |
| H2 - Section | 32px / 2rem | Semibold (600) | 1.3 |
| H3 - Subsection | 24px / 1.5rem | Semibold (600) | 1.4 |
| H4 - Card Title | 20px / 1.25rem | Medium (500) | 1.4 |
| Body Large | 18px / 1.125rem | Regular (400) | 1.6 |
| Body | 16px / 1rem | Regular (400) | 1.6 |
| Body Small | 14px / 0.875rem | Regular (400) | 1.5 |
| Caption | 12px / 0.75rem | Medium (500) | 1.4 |

### Secondary Typeface - DM Sans

**Usage:** Marketing materials, headlines, display

---

## Iconography

### Icon Style
- **Line weight:** 1.5px - 2px
- **Style:** Rounded corners, friendly
- **Size grid:** 16px, 20px, 24px, 32px

### Core Icon Set

| Icon | Usage |
|------|-------|
| Scan/Camera | Skin analysis feature |
| Sparkle/AI | AI-powered features |
| Droplet | Skincare/hydration |
| Sun | UV protection, morning routine |
| Moon | Night routine |
| Chart/Graph | Progress tracking |
| Bottle | Product recommendations |
| Check/Shield | Verified, safe ingredients |
| User | Profile, personalization |
| Heart | Favorites, saved items |

### Recommended Icon Library
- **Lucide Icons** (primary)
- **Heroicons** (alternative)

---

## Imagery Guidelines

### Photography Style

#### Do:
- Natural lighting, soft shadows
- Diverse skin types and tones
- Real skin texture (not over-retouched)
- Clean, minimal backgrounds
- Authentic expressions
- Close-up skin detail shots

#### Don't:
- Heavy filters or artificial effects
- Overly perfect/airbrushed skin
- Stock photo cliches
- Busy backgrounds
- Harsh lighting

### Image Categories

1. **Skin Close-ups** - Detailed, honest skin texture
2. **Product Shots** - Clean, consistent styling
3. **Lifestyle** - Real people, natural moments
4. **UI Screenshots** - Clean, focused app demos
5. **Before/After** - Respectful, realistic progress

### Illustration Style
- Flat, modern aesthetic
- Limited color palette (brand colors)
- Rounded, friendly shapes
- Consistent line weights

---

## UI Components

### Buttons

#### Primary Button
```css
background: #0D9488;
color: white;
border-radius: 8px;
padding: 12px 24px;
font-weight: 600;
```

#### Secondary Button
```css
background: transparent;
color: #0D9488;
border: 2px solid #0D9488;
border-radius: 8px;
```

### Cards
```css
background: white;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
padding: 20px;
```

### Input Fields
```css
border: 1px solid #E2E8F0;
border-radius: 8px;
padding: 12px 16px;
font-size: 16px;
```

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Related elements |
| md | 16px | Default spacing |
| lg | 24px | Section padding |
| xl | 32px | Large sections |
| 2xl | 48px | Page sections |
| 3xl | 64px | Hero areas |

---

## Logo Guidelines

### Logo Concept
The logo should convey:
- Intelligence (AI/tech element)
- Skincare (organic/skin element)
- Personalization (human touch)

### Clear Space
Minimum clear space = height of logo mark

### Minimum Sizes
- Digital: 32px height minimum
- Print: 0.5 inch height minimum

### Logo Variations
1. **Full logo** - Icon + wordmark (horizontal)
2. **Stacked** - Icon above wordmark
3. **Icon only** - App icon, favicon
4. **Wordmark only** - Text-only contexts

### Color Usage
- Primary: Teal on white
- Reversed: White on dark
- Monochrome: For single-color contexts

---

## Accessibility

### Color Contrast
- All text meets WCAG 2.1 AA minimum (4.5:1)
- Large text minimum 3:1
- Interactive elements clearly distinguishable

### Focus States
- Visible focus indicators on all interactive elements
- 2px solid outline in brand color

---

*Document Version: 1.0*  
*Last Updated: January 2026*
