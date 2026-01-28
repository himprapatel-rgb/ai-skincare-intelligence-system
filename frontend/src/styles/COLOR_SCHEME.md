# SkinCareAI Color Scheme Documentation

> **🔒 LOCKED - DO NOT CHANGE THESE COLORS**
> 
> This document serves as the official color reference for the application.
> The color scheme is final and should not be modified.

---

## Brand Colors (Primary Palette)

The application uses a **Blue + White** color scheme for a clean, premium, medical feel.

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Brand Blue** | `#1f6feb` | `rgb(31, 111, 235)` | Primary buttons, links, accents, active states |
| **Brand Blue Hover** | `#1e4fd6` | `rgb(30, 79, 214)` | Hover states, darker variant |
| **Brand Blue Light** | `#e6efff` | `rgb(230, 239, 255)` | Backgrounds, selections, subtle highlights |
| **White** | `#ffffff` | `rgb(255, 255, 255)` | Main backgrounds, cards |

## RGBA Values for Shadows & Overlays

When you need transparency, use these RGBA values:

```css
/* Blue with opacity */
rgba(31, 111, 235, 0.1)   /* Very light - backgrounds */
rgba(31, 111, 235, 0.2)   /* Light - shadows */
rgba(31, 111, 235, 0.3)   /* Medium - hover shadows */
rgba(31, 111, 235, 0.5)   /* Strong - focus rings */
rgba(31, 111, 235, 0.9)   /* Almost solid - overlays */
```

---

## Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Accent Blue** | `#a9c7ff` | Secondary highlights, decorative elements |
| **Accent Light** | `#f1f5ff` | Light backgrounds, hover states |

---

## Neutral Colors (Grays)

| Name | Hex | Usage |
|------|-----|-------|
| Gray 50 | `#f8fbff` | Tertiary backgrounds |
| Gray 100 | `#eef3fb` | Secondary backgrounds |
| Gray 200 | `#e3ecff` | Borders, dividers |
| Gray 300 | `#c8d6f2` | Disabled states |
| Gray 400 | `#8a9ab7` | Muted text, placeholders |
| Gray 500 | `#6b7d99` | Secondary text |
| Gray 600 | `#4b5b76` | Body text |
| Gray 700 | `#32415b` | Headings |
| Gray 800 | `#1b2740` | Dark text |
| Gray 900 | `#0b1220` | Primary text (near black) |

---

## Background Colors

| CSS Variable | Value | Usage |
|--------------|-------|-------|
| `--bg-primary` | `#ffffff` | Main background |
| `--bg-secondary` | `#f3f7ff` | Section backgrounds |
| `--bg-tertiary` | `#f8fbff` | Card backgrounds |

---

## Status Colors (Use Sparingly)

These are for functional feedback only:

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#34c759` | Success messages only |
| Warning | `#ffb020` | Warning messages only |
| Danger | `#ff3b30` | Error messages only |

---

## CSS Variables Reference

```css
:root {
  /* Primary - LOCKED */
  --primary: #1f6feb;
  --primary-hover: #1e4fd6;
  --primary-light: #e6efff;
  
  /* Accent - LOCKED */
  --accent: #a9c7ff;
  --accent-light: #f1f5ff;
  
  /* Text - LOCKED */
  --text-primary: #0b1220;
  --text-secondary: #4b5b76;
  --text-muted: #8a9ab7;
  
  /* Background - LOCKED */
  --bg-primary: #ffffff;
  --bg-secondary: #f3f7ff;
}
```

---

## Gradients

```css
/* Primary Gradient - for CTAs and hero elements */
background: linear-gradient(135deg, #1f6feb 0%, #5a8bff 100%);

/* Logo mark gradient */
background: linear-gradient(135deg, #1f6feb 0%, #5a8bff 100%);
```

---

## Design Principles

1. **Blue is the primary color** - Use for all interactive elements
2. **White backgrounds** - Keep backgrounds clean and minimal
3. **No random colors** - Avoid introducing new colors
4. **Consistent shadows** - Use blue-tinted shadows for depth
5. **Simple and premium** - Less is more

---

## What NOT to Use

❌ Teal/Green as primary (`#0D9488`)
❌ Orange as secondary (`#F97316`)  
❌ Random accent colors
❌ Gradients with multiple different colors

---

*Color scheme locked: January 27, 2026*
