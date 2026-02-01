# COMPREHENSIVE DESIGN AUDIT: PRODUCT SCANNER PAGE (/scanner)

**Date:** February 2026  
**Tested with:** CeraVe barcode 301871373164

---

## A. HEADER & NAVIGATION

### Issues
- Nav shows "Skin Analysis" active instead of Product Scanner
- Breadcrumb "/" could be chevron (›)
- "Free Scan" CTA missing for logged-in users

---

## B. PAGE HEADER

### Issues
- Tab transition has no animation; add 200ms ease
- Tab icons 16px → 20px
- Gap between tabs 0px → 8px
- Subheadline 16px → 18px

---

## C. BARCODE SCANNER

### Issues
1. **Critical**: Black device frame mockup—dated skeuomorphic design
2. **Critical**: Floating "Back to Top" button overlaps barcode input (z-index bug)
3. Instruction "Click Start Camera" redundant
4. "Supports EAN-13, EAN-8..." too technical → "Works with most product barcodes"
5. "Start Camera" button disconnected; center below camera
6. Manual entry link positioned too far from camera
7. Input 600px too wide for barcode
8. "Look Up" button purple when disabled—use blue when active
9. Look Up text 14px → 16px

---

## D. TAKE PHOTO

### Issues
- Take Photo button has no visible hover state
- OR divider lines 1px → 2px
- Upload button border 1px → 2px
- Drag & drop zone: dashed border dated; icon 24px too subtle
- Zone height 120px → 150px

---

## E. TIPS SECTION

### Issues
- Bullet points → checkmark icons
- Text 14px → 15px
- Missing: example good vs bad photos, icons per tip

---

## F. HOW PRODUCT SCANNER WORKS

### Issues
- Cards lack shadow and hover states
- Photo Recognition icon: camera doesn't convey AI—use AI/brain icon
- "Save to Shelf" is result, not step—confusing hierarchy
- No links to features

---

## G. SUPPORTED FORMATS

### Issues
- No icons per format
- No "Learn more" link

---

## H. RECENTLY SCANNED

### Issues
- Text bug: "product\ns" broken wrapping
- Cards 180px too narrow; text truncates
- No "View Details" or action buttons
- No timestamp
- No "View all" link
- Mixed real image (CeraVe) + placeholder (Vitamin C)

---

## I. FUNCTIONALITY TESTING

### Test 1: Barcode Lookup (301871373164)
- ✅ Lookup works, product identified
- ✅ Safety/Suitability scores shown
- ⚠️ **BUG**: Floating button overlaps input

### Test 2: View Full Product Details
- ✅ **FIXED**: Scanner now uses barcode for link; ProductDetailsPage tries catalog/barcode + catalog/product + products
- ❌ "Unknown UNKNOWN" brand, placeholder image, no ingredients
- **Root cause**: Scanner and product detail page use different data sources

---

## J. ACCESSIBILITY

- Placeholder gray #9CA3B8 fails WCAG AA (3.5:1)
- Tabs lack visible focus ring
- Camera area needs aria-label
- No keyboard shortcut for mode toggle

---

## K. RESPONSIVE

- Device frame too wide on mobile
- Feature cards need vertical stack
- Tab buttons may be small for touch

---

## L. RECOMMENDATIONS

### Critical (fix immediately)
1. **Fix floating button z-index**—must not overlap barcode input
2. **Fix product database inconsistency**—scanner and product page must share same source
3. Add product data to detail page when barcode found

### High priority
4. Remove black device frame from camera preview
5. Center "Start Camera" below camera area
6. Add hover and loading states
7. Fix "Recently Scanned" subtitle text wrapping ✅ FIXED: nowrap on "product(s)"

### Medium priority
8. Simplify barcode format text for users
9. Add example images for Tips
10. Tab animation, icon size, gaps
