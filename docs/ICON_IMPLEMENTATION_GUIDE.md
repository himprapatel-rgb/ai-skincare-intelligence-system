# Icon Implementation Guide

## Overview
We've migrated from emoji icons to **Lucide React** - a modern, professional icon library that perfectly matches our brand aesthetic.

## Why Lucide React?
✅ **Modern & Clean** - Matches our brand's professional look  
✅ **Lightweight** - Tree-shakeable, only imports what you use  
✅ **Consistent** - All icons follow the same design system  
✅ **Scalable** - SVG-based, perfect at any size  
✅ **Accessible** - Better for screen readers than emojis  
✅ **Customizable** - Easy to style with CSS

## Installation
Already installed! The package is in `package.json`:
```bash
npm install lucide-react
```

## Usage

### Basic Import
```tsx
import { IconCamera, IconStar, IconHeart } from '../components/Icons';

// Use in component
<IconCamera size={24} strokeWidth={2} />
```

### Available Icons
All commonly used icons are exported from `frontend/src/components/Icons.tsx`:

**Dashboard & Stats:**
- `IconTrendingUp` - Trends, growth
- `IconCamera` - Scans, photos
- `IconSparkles` - Routines, magic
- `IconPackage` - Products, items
- `IconBarChart` - Analytics
- `IconActivity` - Activity tracking

**Actions:**
- `IconScan` - Scan actions
- `IconShoppingCart` - Shopping, shelf
- `IconCalendar` - Schedules, routines
- `IconStar` - Favorites, ratings
- `IconHeart` - Likes, favorites
- `IconPlus` - Add actions
- `IconSearch` - Search
- `IconFilter` - Filters

**Navigation:**
- `IconHome` - Home page
- `IconUser` - Profile, user
- `IconSettings` - Settings
- `IconHistory` - History
- `IconChevronRight` - Next, forward
- `IconArrowLeft` - Back, previous

**Features:**
- `IconZap` - Quick actions, energy
- `IconTarget` - Goals, targets
- `IconCheckCircle` - Success, complete
- `IconAlertCircle` - Warnings, alerts
- `IconInfo` - Information

**Product & Skincare:**
- `IconDroplet` - Moisture, hydration
- `IconSun` - Sun protection
- `IconMoon` - Night routine
- `IconShield` - Protection
- `IconLeaf` - Natural, organic

**Status:**
- `IconCheck` - Success
- `IconX` - Error, close
- `IconLoader` - Loading spinner
- `IconDownload` - Download
- `IconUpload` - Upload

### Icon Props
```tsx
<IconCamera 
  size={24}           // Size in pixels (default: 24)
  strokeWidth={2}    // Line thickness (default: 2)
  color="#0D9488"    // Optional color override
  className="..."     // CSS classes
/>
```

### Styling Icons
Icons inherit color from their parent by default. Use CSS to style:

```css
.stat-icon {
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 32px;
  height: 32px;
}
```

## Migration Pattern

### Before (Emoji):
```tsx
<div className="stat-icon">📷</div>
<div className="action-icon">🌟</div>
```

### After (Lucide):
```tsx
import { IconCamera, IconStar } from '../components/Icons';

<div className="stat-icon">
  <IconCamera size={32} strokeWidth={2} />
</div>
<div className="action-icon">
  <IconStar size={24} strokeWidth={2} />
</div>
```

## Pages to Update

### ✅ Completed
- DashboardPage.tsx

### 🔄 To Update
1. **AuthPage.tsx** - Feature icons (camera, sparkles, chart)
2. **HistoryPage.tsx** - Stat icons (camera, star, lightbulb)
3. **ProfileSettingsPage.tsx** - Stat icons (chart, camera, package, sparkles)
4. **Recommendations.tsx** - Product icons
5. **MyShelfPage.tsx** - Product icons
6. **RoutineBuilderPage.tsx** - Routine icons
7. **ScanPage.tsx** - Scan-related icons
8. **AnalysisResults.tsx** - Result icons

## Icon Size Guidelines

Based on brand guidelines and usage context:

- **Large Icons (32-48px)**: Hero sections, stat cards, feature highlights
- **Medium Icons (24px)**: Action buttons, navigation items, cards
- **Small Icons (16-20px)**: Lists, inline elements, badges

```tsx
// Large - Dashboard stat cards
<IconTrendingUp size={32} strokeWidth={2} />

// Medium - Action cards, buttons
<IconScan size={24} strokeWidth={2} />

// Small - Activity lists, inline
<IconCamera size={20} strokeWidth={2} />
```

## Finding More Icons

If you need an icon not in `Icons.tsx`:

1. Browse [Lucide Icons](https://lucide.dev/icons/)
2. Import directly:
```tsx
import { IconName } from 'lucide-react';
```
3. Or add to `Icons.tsx` for consistency

## Best Practices

1. **Consistent Sizing**: Use standard sizes (16, 20, 24, 32, 48)
2. **Stroke Width**: Use 2 for most icons, 1.5 for small icons
3. **Color**: Let CSS handle colors via `color` property
4. **Accessibility**: Icons are decorative - use `aria-label` if needed
5. **Performance**: Icons are tree-shaken, only imported icons are bundled

## Example: Complete Icon Update

```tsx
// Before
<div className="feature-icon">&#x1F4F7;</div>

// After
import { IconCamera } from '../components/Icons';

<div className="feature-icon">
  <IconCamera size={48} strokeWidth={2} />
</div>
```

```css
.feature-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-light);
  border-radius: 12px;
  color: var(--primary);
}
```

## Questions?

- Check `frontend/src/components/Icons.tsx` for available icons
- Visit [lucide.dev](https://lucide.dev) for icon search
- See `DashboardPage.tsx` for implementation examples
