# AI Clothes & Fabric Virtual Try-On API

> Virtual try-on for clothes, fabric patterns, and complete looks

## Table of Contents
- [Overview](#overview)
- [AI Clothes VTO](#ai-clothes-vto)
- [AI Fabric VTO](#ai-fabric-vto)
- [AI Look VTO](#ai-look-vto)
- [Common Specifications](#common-specifications)

---

## Overview

The AI Clothes & Fabric VTO APIs enable virtual try-on experiences for clothing items, fabric patterns, and complete outfit looks. These APIs use advanced AI to realistically render clothes on user photos.

**Base URL:** `https://yce-api-01.makeupar.com`

---

## AI Clothes VTO

Virtual try-on for tops, bottoms, and dresses.

### Endpoint

```
POST /api/clothtryonpro/v2
```

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | multipart/form-data |
| Authorization | Bearer YOUR_API_KEY |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's full-body photo |
| clothImage | file | Yes | Clothing item image |
| clothType | string | Yes | Type: "top", "bottom", "dress" |
| clothMask | file | No | Custom mask for clothing |
| outputFormat | string | No | Output format (jpg/png) |
| outputQuality | integer | No | Quality 1-100 (default: 90) |

### Cloth Types

| Type | Description |
|------|-------------|
| top | Shirts, blouses, jackets, sweaters |
| bottom | Pants, skirts, shorts |
| dress | Full-body dresses, jumpsuits |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "processingTime": 2.5
  }
}
```

### Image Requirements

**Selfie Image:**
- Full-body view preferred
- Front-facing pose
- Good lighting
- Neutral background recommended
- Min resolution: 512x512px

**Clothing Image:**
- Flat-lay or model worn image
- Clear, unobstructed view
- White/transparent background preferred
- Min resolution: 256x256px

---

## AI Fabric VTO

Apply fabric patterns to clothing items.

### Endpoint

```
POST /api/fabrictryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's full-body photo |
| fabricImage | file | Yes | Fabric pattern image |
| targetArea | string | Yes | Area to apply: "top", "bottom", "full" |
| tileScale | float | No | Pattern scale (0.5-2.0, default: 1.0) |
| seamlessMode | boolean | No | Enable seamless tiling |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "fabricApplied": true,
    "targetArea": "top"
  }
}
```

### Fabric Requirements

- Square or seamless tileable pattern
- Min resolution: 256x256px
- Supported formats: jpg, png
- File size: max 5MB

---

## AI Look VTO

Complete outfit virtual try-on.

### Endpoint

```
POST /api/looktryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's full-body photo |
| lookImage | file | Yes | Complete outfit reference |
| includeAccessories | boolean | No | Include accessories (default: false) |
| preserveFace | boolean | No | Keep original face (default: true) |
| bodyFitMode | string | No | "natural", "fitted", "loose" |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "itemsApplied": ["top", "bottom", "shoes"],
    "confidence": 0.92
  }
}
```

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|----------|
| All Clothes VTO | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Common Error Codes

| Code | Description |
|------|-------------|
| RUNTIME_ERROR | Unexpected runtime error |
| PHOTO_DETECTION_FAIL | Photo could not be processed |
| BODY_DETECTION_FAIL | Body not detected |
| CLOTH_DETECTION_FAIL | Clothing item not detected |
| PHOTO_CHECK_INVALID | Invalid pose or size |
| INPUT_ERROR | Incorrect file format |

### Body Detection Requirements

- Full body visible (head to feet preferred)
- Standing pose recommended
- Arms visible and not crossing body
- Front or slight angle view

---

[← Back to Index](./README.md)
