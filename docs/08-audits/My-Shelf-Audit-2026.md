# COMPREHENSIVE DESIGN AUDIT: MY SHELF PAGE (/myshelf)

**Date:** February 2026

---

## A. HEADER & BREADCRUMB

### Issues
- Breadcrumb "/" separator → use "›" chevron
- No shelf icon next to title
- Consider product count badge near title

---

## B. ONBOARDING/BENEFITS SECTION

### Issues
- No icons for benefits (Add Products, Track, Expiry)
- No dismiss button
- Expiry reminders mentioned but not visible on cards
- Feature announced but not implemented

---

## C. FILTER & SEARCH BAR

### Issues
- Search input 200px → increase to 280px
- No search icon inside input
- Tab counts "(4)" should be badges, not inline text
- Hide or dim zero counts

---

## D. SORT & CATEGORY

### Issues
- Category names lowercase → capitalize
- Add more sort options (Oldest First, etc.)
- Product count could be more prominent

---

## E. PRODUCT CARDS GRID

### Critical
1. **Duplicate products** – Two "Vitamin C Complex Serum" by Naturium
2. **Inconsistent images** – Mix of real photos and placeholder "Product Image"
3. **Card height inconsistency** – Vary by content; use fixed height

### Card UI
- Star rating: "-" for unrated is confusing
- "Would Repurchase?" – unclear toggle state
- Status dropdown – full width, takes space
- Remove button – no confirmation; too prominent

---

## F. PRODUCT DETAIL PAGE

### Issues
- Description says "Non-foaming" but title "Foaming Cleanser"
- **Ingredient list not available** despite description having ingredients
- No Edit Product button
- Duplicate "Write a Review" buttons

---

## G. FLOATING BUTTON

- Teal circle overlaps inputs/content
- **Status:** Fixed in previous session (moved to bottom-right, z-index 100, mobile offset)

---

## H. BUGS SUMMARY

| Bug | Severity |
|-----|----------|
| Duplicate product entries | High |
| Ingredient list not available | High |
| Title/description mismatch | Medium |
| Placeholder "Product Image" text | Medium |
