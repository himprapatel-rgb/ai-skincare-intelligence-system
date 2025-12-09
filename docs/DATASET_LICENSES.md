# Dataset Licenses and Attributions

**AI Skincare Intelligence System**  
**Last Updated**: December 9, 2025  
**Version**: 1.0

---

## Overview

This document provides complete license information and required attributions for all external datasets used in the AI Skincare Intelligence System. All data sources have been verified for compliance with their respective licenses.

---

## Product Databases

### 1. Open Beauty Facts

**Source**: https://world.openbeautyfacts.org/  
**License**: Creative Commons BY-SA 4.0 (CC BY-SA 4.0)  
**Data Type**: Product catalog with ingredients, barcodes, images  
**Records**: 100,000+ beauty and cosmetic products  
**Last Updated**: Weekly bulk imports

**License Summary**:
- ✅ Commercial use permitted
- ✅ Modification permitted
- ✅ Distribution permitted
- ⚠️ Share-Alike required (derivatives must use same license)
- ⚠️ Attribution required

**Required Attribution**:
> "Product data provided by Open Beauty Facts (https://world.openbeautyfacts.org)  
> Licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)"

**In-App Attribution** (footer):
> "Product data from Open Beauty Facts (CC BY-SA 4.0)"

**Usage Notes**:
- Product data updated weekly via bulk export
- Real-time API lookups for products not in local database
- Barcode database used for product scanning feature
- ingredient lists parsed and normalized

---

### 2. Kaggle Sephora Products Dataset

**Source**: https://www.kaggle.com/datasets/nadyinky/sephora-products-and-skincare-reviews  
**License**: CC0 1.0 Universal (Public Domain)  
**Data Type**: Product prices, ratings, reviews  
**Records**: 5,000+ products  
**Last Updated**: Static dataset (2023)

**License Summary**:
- ✅ Commercial use permitted
- ✅ No attribution required
- ✅ Public domain dedication

**Attribution** (optional but recommended):
> "Pricing and ratings data sourced from Kaggle Sephora Products Dataset (CC0)"

**Usage Notes**:
- Enriches product catalog with pricing information
- Provides user ratings and review sentiment
- One-time import, merged with Open Beauty Facts via barcode matching

---

## Ingredient Databases

### 3. EU CosIng (Cosmetic Ingredient Database)

**Source**: https://ec.europa.eu/growth/tools-databases/cosing/  
**License**: Public database - Free for non-commercial use  
**Data Type**: INCI ingredient names, functions, restrictions  
**Records**: 26,000+ cosmetic ingredients  
**Last Updated**: Quarterly imports

**License Summary**:
- ✅ Non-commercial use permitted
- ✅ Commercial use permitted with attribution
- ⚠️ Attribution recommended

**Required Attribution**:
> "Ingredient data from the European Commission CosIng Database  
> (https://ec.europa.eu/growth/tools-databases/cosing/)"

**In-App Attribution** (footer):
> "Ingredient data from EU CosIng Database"

**Usage Notes**:
- Authoritative source for INCI (International Nomenclature of Cosmetic Ingredients) names
- Includes ingredient functions (moisturizer, preservative, etc.)
- Regulatory restrictions for EU market
- Used for ingredient normalization and safety classification

---

### 4. California CSCP (Cosmetic Safety Priority Database)

**Source**: https://data.ca.gov/dataset/california-safe-cosmetics-program-cscp  
**License**: Public Domain (U.S. Government Work)  
**Data Type**: Hazardous chemical listings for cosmetics  
**Records**: 10,000+ chemical-product associations  
**Last Updated**: Semi-annual imports

**License Summary**:
- ✅ Public domain - no restrictions
- ✅ No attribution required
- ✅ Commercial use permitted

**Attribution** (recommended):
> "Hazard data from California Department of Public Health CSCP  
> (https://data.ca.gov/dataset/california-safe-cosmetics-program-cscp)"

**In-App Attribution** (footer):
> "Hazard data from California CSCP (Public Domain)"

**Usage Notes**:
- Identifies hazardous ingredients (carcinogens, reproductive toxins)
- Linked to CosIng database via CAS numbers
- Powers pregnancy safety filter and ingredient warnings
- Authority: California Health and Safety Code Section 111792

---

## Machine Learning Datasets

### 5. HAM10000 (Human Against Machine with 10000 training images)

**Source**: https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000  
**License**: CC BY-NC-SA 4.0  
**Data Type**: Dermoscopic images of skin lesions  
**Records**: 10,015 images with diagnostic labels  
**Last Updated**: Static dataset (2018)

**License Summary**:
- ✅ Research and education permitted
- ❌ Commercial use NOT permitted without permission
- ⚠️ Share-Alike required for derivatives
- ⚠️ Attribution required

**Required Attribution**:
> "ML training data: HAM10000 dataset  
> Tschandl, P., Rosendahl, C. & Kittler, H. The HAM10000 dataset.  
> Sci Data 5, 180161 (2018). https://doi.org/10.1038/sdata.2018.161  
> Licensed under CC BY-NC-SA 4.0"

**In-App Attribution** (About/Settings):
> "AI models trained on HAM10000 dataset (CC BY-NC-SA 4.0)"

**Usage Notes**:
- Baseline skin lesion classification dataset
- 7 diagnostic categories (melanoma, nevus, etc.)
- Train/val/test split: 70/15/15 (7,010 / 1,502 / 1,503)
- **Commercial licensing**: Contact Vienna Medical University for commercial deployment

---

### 6. ISIC Archive (International Skin Imaging Collaboration)

**Source**: https://www.isic-archive.com/  
**License**: CC BY-NC-SA 4.0  
**Data Type**: Dermoscopic images with ground truth masks  
**Records**: 25,000+ images  
**Last Updated**: Static dataset

**License Summary**:
- ✅ Research and education permitted
- ❌ Commercial use NOT permitted without permission
- ⚠️ Share-Alike required
- ⚠️ Attribution required

**Required Attribution**:
> "ML training data: ISIC Archive  
> International Skin Imaging Collaboration (https://www.isic-archive.com)  
> Licensed under CC BY-NC-SA 4.0"

**In-App Attribution** (About/Settings):
> "AI models trained on ISIC Archive dataset (CC BY-NC-SA 4.0)"

**Usage Notes**:
- High-quality dermoscopic images with expert annotations
- Segmentation masks for lesion boundaries
- Train/val/test split: 70/15/15
- **Commercial licensing**: Contact ISIC consortium for commercial use

---

### 7. Google SCIN Dataset (Skin Condition Image Network)

**Source**: https://github.com/google-research-datasets/scin  
**License**: SCIN Data Use License (Research only)  
**Data Type**: Diverse skin tone images (Fitzpatrick I-VI)  
**Records**: 10,000+ images with demographic metadata  
**Last Updated**: Static dataset (2021)

**License Summary**:
- ✅ Research use permitted
- ❌ Commercial use NOT permitted
- ⚠️ Fairness research encouraged
- ⚠️ Attribution required

**Required Attribution**:
> "Fairness testing: Google SCIN Dataset  
> Daneshjou et al. Disparities in dermatology AI. Sci Adv. 2022.  
> https://github.com/google-research-datasets/scin"

**In-App Attribution** (About/Settings):
> "AI fairness validated using Google SCIN Dataset"

**Usage Notes**:
- Used for fairness validation across skin tones
- Ensures AI models work equitably for Fitzpatrick types I-VI
- Self-reported demographic data included
- **Commercial use**: Requires separate license from Google

---

## Compliance Requirements

### App Footer Attribution

All public-facing applications (web, iOS, Android) must display:

```
Data Sources:
- Product data from Open Beauty Facts (CC BY-SA 4.0)
- Ingredient data from EU CosIng Database
- Hazard data from California CSCP (Public Domain)
- AI training: HAM10000 (CC BY-NC-SA), ISIC (CC BY-NC-SA)
```

### Settings/About Page

Include full "Data Sources" section with:
- Dataset names and links
- License types
- Last updated dates
- Contact information for commercial licensing

### API Documentation

OpenAPI/Swagger docs must include:
- Attribution in API description
- License information in responses
- Data provenance fields in product/ingredient endpoints

### Marketing Materials

Any marketing mentioning datasets must:
- Include proper attributions
- Respect NC (Non-Commercial) licenses if applicable
- Link to original data sources

---

## Commercial Deployment Checklist

### ✅ Compliant for Commercial Use
- [x] Open Beauty Facts (CC BY-SA 4.0)
- [x] EU CosIng (Public with attribution)
- [x] California CSCP (Public Domain)
- [x] Kaggle Sephora (CC0 Public Domain)

### ⚠️ Requires Commercial License
- [ ] HAM10000 (CC BY-NC-SA 4.0) - Contact: Vienna Medical University
- [ ] ISIC Archive (CC BY-NC-SA 4.0) - Contact: ISIC Consortium
- [ ] Google SCIN (Research only) - Contact: Google Research

### Action Required for Commercial Launch

1. **Obtain Commercial ML Licenses**:
   - HAM10000: email [datasetowner@meduniwien.ac.at]
   - ISIC: email [licensing@isic-archive.com]
   - Google SCIN: submit request via GitHub

2. **Implement Attribution UI**:
   - App footer with data sources
   - Settings page with full licenses
   - API docs with provenance

3. **Legal Review**:
   - Attorney review of all licenses
   - Terms of Service alignment
   - Privacy Policy data sources section

4. **Ongoing Compliance**:
   - Quarterly license audits
   - Data refresh compliance
   - Attribution updates when datasets change

---

## Contact Information

### Dataset Licensing Queries
- **Technical**: backend-lead@ai-skincare.com
- **Legal**: legal@ai-skincare.com
- **Product**: product@ai-skincare.com

### External Contacts
- **Open Beauty Facts**: contact@openfoodfacts.org
- **EU Commission CosIng**: grow-cosmetics@ec.europa.eu
- **ISIC Archive**: info@isic-archive.com

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-09 | Initial license documentation for Sprint 0 | Backend Team |

---

## References

1. **Creative Commons Licenses**: https://creativecommons.org/licenses/
2. **Open Data Commons**: https://opendatacommons.org/
3. **EU Database Directive**: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31996L0009
4. **California CSCP**: https://www.cdph.ca.gov/Programs/CCDPHP/DEODC/OHB/CSCP/

---

**Note**: This document must be updated whenever:
- New datasets are added
- License terms change
- Commercial agreements are signed
- Dataset versions are updated

**Legal Disclaimer**: This document is for informational purposes. Consult with legal counsel before commercial deployment.
