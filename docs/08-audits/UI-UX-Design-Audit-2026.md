# Comprehensive UI/UX Design Audit Report: SkinCareAI (pellicura.com)

**Date:** January 2026  
**Scope:** All pages | **Standards:** 2026 market standards

---

## 1. HOMEPAGE (/)

### Design Issues
- Hero Section Asymmetry: "Premium Skin Intelligence" badge disconnected from headline
- CTA Button Hierarchy: Primary and secondary buttons have similar visual weight; secondary should be ghost
- Sample Analysis Card: Floating scores card cut off at viewport edge
- Trust Badges: "AS FEATURED IN" shows plain text instead of actual brand logos
- Inconsistent Card Shadows: Feature cards have shadows; stats cards do not
- How It Works: Numbered circles + arrows overlap card boundaries
- Testimonials: Missing user photos; placeholder circles reduce credibility
- FAQ Accordion: Both "›" and "+" icons—inconsistent
- Newsletter: Email input and button cramped; needs padding

### Recommendations
- Add subtle gradient/texture to hero
- Smooth scroll animations for sections
- Hover micro-interactions on feature cards
- Use actual brand logos in "Featured In"

---

## 2. SKIN ANALYSIS PAGE (/scan)

### Design Issues
- Redundant header repeating nav info
- Tab styling (Upload Photo/Use Camera) basic; active indicator needs color fill
- Dashed border upload zone looks dated
- Instructions checklist cramped; add 12px+ vertical spacing
- Disclaimer competes with CTA; move below with reduced opacity
- Missing progress states after upload

### Recommendations
- Animated upload zone with pulsing border on hover
- Sample "good vs bad" photo examples
- Real-time camera preview with face detection overlay

---

## 3. DASHBOARD PAGE (/dashboard)

### Design Issues
- Stats cards inconsistent: Skin Health Score blue/filled vs others white
- Quick Actions: 2x2 grid lacks differentiation; all icons same blue
- "Product Image" placeholder text visible in production
- "Remind me to scan" widget: dd/mm/yyyy placeholder, "—" default in dropdown
- Empty states lack CTAs
- Card border radius inconsistent

### Recommendations
- Mini charts in stats cards
- Skeleton loading states
- Personalized recommendations from skin score
- Streak/gamification elements

---

## 4. DIGITAL TWIN PAGE (/digital-twin)

### Design Issues
- Chart X-axis labels too long; truncate dates
- Legend positioning wastes space
- Data points 8px; increase to 12px for touch
- What-If: long placeholder, awkward dropdown placement
- Summary stats cards (TREND, TOP CONCERNS, etc.) have no icons
- Score display lacks tooltips/context
- Chart legend colors too similar (both blue-ish)

### Recommendations
- Comparison slider for before/after
- Exportable progress reports
- Predictive trend lines
- Custom date range selection

---

## 5. ABOUT PAGE (/about)

### Design Issues
- Excessive white space (100px+) at top
- Timeline bullets inconsistent
- Impact stats lack hierarchy
- Technology cards have no icons
- Values section same styling as tech cards—monotony
- Medical disclaimer box too prominent

### Recommendations
- Team photos/profiles
- Animated timeline
- Video introduction
- Partner/investor logos

---

## 6. RECOMMENDATIONS PAGE (/recommendations)

### Design Issues
- Filter dropdowns too wide
- "Clear all" isolated; move near filters
- No active filter state
- "Product Image" placeholder on cards
- Star ratings lack star icons
- Concern tags inconsistent colors
- Heart/favorite icon position inconsistent
- Missing pagination

### Recommendations
- Product comparison
- Price information
- "Why recommended" per product
- Infinite scroll + lazy load

---

## 7. ROUTINE BUILDER PAGE (/routine-builder)

### Design Issues
- Tab transition lacks animation
- Drag handles too subtle
- "Change" link small and easy to miss
- Reorder arrows inconsistent sizing
- "Select Product" button 14px—increase to 16px
- "Auto-Order" unclear; needs tooltip

### Recommendations
- Drag-and-drop preview animation
- Time estimates per step
- Printable/exportable routine card
- Product compatibility warnings

---

## 8. MY SHELF PAGE (/myshelf)

### Design Issues
- Mixed real images with placeholders
- Duplicate "Vitamin C Complex Serum" entries
- Card heights inconsistent
- Filter tab counts should be badges
- Search placeholder cuts off
- Sort dropdown conflicts with filter tabs

### Recommendations
- Expiry date indicators (color-coded)
- Usage tracking
- Barcode scan shortcut
- Product notes/reviews

---

## 9. PRODUCT SCANNER PAGE (/scanner)

### Design Issues
- Black device frame mockup unnecessary
- Redundant "Click Start Camera" text
- Supported format list (EAN-13, UPC) is jargon
- Tabs lack clear active state
- "Enter barcode manually" too small
- No camera permission/loading feedback

### Recommendations
- Real-time barcode overlay
- Product recognition from photo
- Recent scans quick access
- Haptic feedback on scan

---

## 10. HISTORY PAGE (/history)

### Design Issues
- Filter tabs (All, 7 days, 30 days) may lack clear active state
- Empty state when no scans—needs CTA to start first scan
- Scan cards: image thumbnails may use placeholders
- Sort dropdown placement relative to filters

### Recommendations
- Add "Start your first scan" empty-state CTA
- Skeleton loading for history cards
- Date formatting consistency (relative vs absolute)

---

## 11. ANALYSIS RESULTS (/analysis/:id)

### Design Issues
- Score display may lack visual hierarchy
- Concern/attribute breakdown cards consistency
- "View recommendations" CTA prominence
- Breadcrumb and back navigation clarity

### Recommendations
- Visual score gauge or radial progress
- Expandable concern sections
- Clear next-step CTAs

---

## 12. PRODUCT DETAILS (/product/:id)

### Design Issues
- Ingredient list layout and readability
- Image gallery vs single image
- Add to shelf / favorite buttons placement
- Related products section consistency

### Recommendations
- Ingredient search/filter
- Image zoom or lightbox
- "Why for you" personalization

---

## 13. FAVORITES PAGE (/favorites)

### Design Issues
- Empty state when no favorites
- Card layout alignment with My Shelf
- Remove confirmation modal styling
- Sort/filter consistency with other list pages

### Recommendations
- "Discover products" empty-state CTA
- Bulk remove option
- Match score explanation

---

## 14. AUTH PAGE (/auth)

### Design Issues
- Sign in / Sign up tab clarity
- Google OAuth button prominence and styling
- Form validation feedback (inline vs toast)
- Password visibility toggle
- "Forgot password" link visibility

### Recommendations
- Social login hierarchy
- Loading state on submit
- Remember me option

---

## 15. PROFILE PAGE (/profile)

### Design Issues
- Tab navigation (Personal, Skin, Goals, etc.)—many tabs may feel overwhelming
- Long form sections; consider progressive disclosure
- Profile photo upload area prominence
- Save button placement (sticky vs inline)

### Recommendations
- Collapsible or accordion sections
- Progress indicator for profile completeness
- Auto-save or draft indicator

---

## 16. CONTACT PAGE (/contact)

### Design Issues
- Form field spacing and label alignment
- Info cards (Email, Live Chat, Location) visual hierarchy
- Social links styling
- Success message after submit

### Recommendations
- Map integration (if applicable)
- Response time expectation
- FAQ link before form

---

## 17. PRIVACY & TERMS (/privacy, /terms)

### Design Issues
- Long text blocks; poor scannability
- Table of contents navigation
- Last updated date prominence
- Mobile readability

### Recommendations
- Sticky TOC on desktop
- Section anchors for sharing
- Print-friendly styling

---

## 18. DATA EXPORT (/export)

### Design Issues
- Checkbox options clarity (Profile, Products, Analysis)
- Format selection (JSON/PDF) prominence
- Export button and loading state
- Success/error feedback

### Recommendations
- Preview of what will be exported
- Email option for large exports
- Clear data scope explanation

---

## 19. ADMIN PAGES (/admin, /admin/users, /admin/products, /admin/catalog)

### Design Issues
- Table density and readability
- Mobile card view (if present) consistency
- Action buttons (edit, delete) placement
- Pagination and search

### Recommendations
- Bulk actions
- Export table data
- Role/permission indicators

---

## 20. INGREDIENT DICTIONARY (/ingredients)

### Design Issues
- Search and filter layout
- Ingredient card consistency
- Alphabetical navigation
- Empty search state

### Recommendations
- Ingredient categories
- Safety/concentration info
- Link to products containing ingredient

---

## 21. SKIN TYPE GUIDE (/skin-type-guide)

### Design Issues
- Content hierarchy
- Visual aids (images/icons) per skin type
- CTA to take skin quiz

### Recommendations
- Interactive skin type selector
- Comparison table
- Product recommendations by type

---

## 22. BLOG & TUTORIALS (/blog, /tutorials)

### Design Issues
- Card grid consistency
- Featured vs list layout
- Video embed styling
- Empty/placeholder content

### Recommendations
- Category filters
- Reading time estimate
- Share buttons

---

## 23. NOT FOUND (404)

### Design Issues
- Message clarity and tone
- CTA to go home
- Visual treatment (illustration vs text only)

### Recommendations
- Friendly illustration
- Search or sitemap link
- Report broken link option

---

## Summary

| Page | Priority | Key Issues |
|------|----------|------------|
| Homepage | High | CTA hierarchy, card shadows, trust logos |
| Scan | High | Upload zone, progress states |
| Dashboard | High | Stats consistency, placeholders, empty states |
| Digital Twin | Medium | Chart readability, legend |
| About | Medium | White space, timeline |
| Recommendations | Medium | Filters, placeholders, pagination |
| Routine Builder | Medium | Tab animation, drag handles |
| My Shelf | Medium | Duplicates, badges |
| Product Scanner | Medium | Tabs, redundant text |
| History–22 | Medium–Low | Per-section fixes |

---

## Next Steps

1. Add actionable items to [IMPROVEMENT-BACKLOG.md](../12-tasks/IMPROVEMENT-BACKLOG.md)
2. Prioritize by impact (homepage, scan, dashboard first)
3. Improvement Agent picks one item per day
4. Track completion in ACTIVE-TASKS.md
