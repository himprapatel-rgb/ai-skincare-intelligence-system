# YouCam API Documentation (v1.7)

> **External API Reference for AI Skincare Intelligence System**  
> Last modified: January 5, 2026  
> Contact: YouCamOnlineEditor_API@perfectcorp.com

---

## Overview

The YouCam APIs provide AI-powered visual effects for photos, enabling beautiful and true-to-life results. These standard RESTful APIs integrate easily into websites, e-commerce platforms, iOS/Android apps, applets, and mini-programs.

**Base URL:** `https://yce-api-01.makeupar.com`

**Authentication:** All requests require Bearer Token: `Authorization: Bearer YOUR_API_KEY`

Get your API Key at: https://yce.makeupar.com/api-console/en/api-keys

---

## Documentation Index

### Virtual Try-On APIs

| Document | Description |
|----------|-------------|
| [AI Accessories VTO](./ai-accessories-vto.md) | Shoes, Hat, Ring, Watch, Earring, Necklace virtual try-on |
| [AI Clothes & Fabric](./ai-clothes-fabric.md) | Clothes, Fabric, and Look virtual try-on |

### Face & Skin Analysis APIs

| Document | Description |
|----------|-------------|
| [AI Face Analysis](./ai-face-analysis.md) | Face Analyzer, Skin Analysis (SD/HD), Face Tone Analysis |

### Hair APIs

| Document | Description |
|----------|-------------|
| [AI Hair Features](./ai-hair-features.md) | Hair Color, Hair Style, Hair Length/Frizziness/Type Detection |

### Photo Editing APIs

| Document | Description |
|----------|-------------|
| [AI Photo Editing](./ai-photo-editing.md) | Object Removal, Photo Enhance, Background Removal |

### Other APIs

| Document | Description |
|----------|-------------|
| [AI Beard Style](./ai-beard-style.md) | Beard style transformation |
| [JS Camera Kit](./js-camera-kit.md) | In-browser camera SDK for face capture |

---

## Quick Reference

### Common Workflow

1. **Upload file** using File API (`POST /s2s/v2.0/file/{feature}`)
2. **Create AI task** (`POST /s2s/v2.0/task/{feature}`)
3. **Poll for result** (`GET /s2s/v2.0/task/{feature}/{taskid}`)
4. **Retrieve result** when `taskstatus: success`

### Supported Formats

| Format | Max Dimensions | File Size |
|--------|----------------|----------|
| JPG/JPEG | 4096px (long side) | 10MB |
| PNG | 4096px (long side) | 10MB |
| HEIC | 4096px (long side) | 10MB |

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request parameters |
| 401 | Invalid/Inactive/Expired API Key |
| 429 | Rate limit exceeded |
| 500 | Internal error or task timeout |

### Environment Dependencies

| Language | Recommended Version |
|----------|--------------------|
| cURL | bash 3.2+, curl 7.58+ |
| Node.js | Node 18+ |
| JavaScript | Chrome/Edge 80+, Firefox 74+, Safari 13.1+ |
| PHP | PHP 7.4+ |
| Python | Python 3.10+, requests 2.20.0+ |
| Java | Java 11+, Jackson Databind 2.12.0+ |

---

## Additional Resources

- **API Console**: https://yce.makeupar.com/api-console/en/api-keys
- **API Playground**: https://yce.makeupar.com/api-console/en/api-playground
- **Support**: YouCamOnlineEditor_API@perfectcorp.com
- **License**: Privacy policy & Terms of Service apply

---

*This documentation is provided by Perfect Corp. for integration with the AI Skincare Intelligence System.*
