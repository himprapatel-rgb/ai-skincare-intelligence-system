# AI Makeup Virtual Try-On API

> Virtual try-on for lipstick, eyeshadow, foundation, and complete makeup looks

## Table of Contents
- [Overview](#overview)
- [Lipstick VTO](#lipstick-vto)
- [Eyeshadow VTO](#eyeshadow-vto)
- [Foundation VTO](#foundation-vto)
- [Blush VTO](#blush-vto)
- [Eyeliner & Mascara VTO](#eyeliner--mascara-vto)
- [Complete Makeup Look VTO](#complete-makeup-look-vto)
- [Common Specifications](#common-specifications)

---

## Overview

The AI Makeup VTO APIs enable realistic virtual try-on for various makeup products including lipstick, eyeshadow, foundation, blush, eyeliner, and complete looks.

**Base URL:** `https://yce-api-01.makeupar.com`

---

## Lipstick VTO

Virtual try-on for lip products.

### Endpoint

```
POST /api/lipsticktryonpro/v2
```

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | multipart/form-data |
| Authorization | Bearer YOUR_API_KEY |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| colorCode | string | Yes | Lipstick color (hex) |
| finishType | string | No | "matte", "glossy", "satin", "metallic" |
| opacity | float | No | Color intensity (0.0-1.0) |
| lipShape | string | No | "natural", "overline", "gradient" |

### Finish Types

| Finish | Description |
|--------|-------------|
| matte | No shine, full coverage |
| glossy | High shine, wet look |
| satin | Subtle sheen |
| metallic | Shimmer/sparkle effect |
| velvet | Soft matte with dimension |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "lipDetected": true,
    "colorApplied": "#C41E3A",
    "finishApplied": "matte"
  }
}
```

---

## Eyeshadow VTO

Virtual try-on for eyeshadow.

### Endpoint

```
POST /api/eyeshadowtryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| colors | array | Yes | Color codes for lid zones |
| blendMode | string | No | "soft", "defined", "smoky" |
| shimmer | boolean | No | Add shimmer effect |
| eyelidZones | object | No | Custom zone color mapping |

### Eyelid Zones

| Zone | Description |
|------|-------------|
| lid | Main eyelid area |
| crease | Crease/socket line |
| innerCorner | Inner eye highlight |
| outerCorner | Outer V area |
| browBone | Under brow highlight |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "eyesDetected": true,
    "zonesApplied": {
      "lid": "#8B4513",
      "crease": "#654321",
      "innerCorner": "#FFE4C4"
    }
  }
}
```

---

## Foundation VTO

Virtual try-on for foundation/skin tone.

### Endpoint

```
POST /api/foundationtryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| shadeCode | string | Yes | Foundation shade code |
| coverage | string | No | "sheer", "medium", "full" |
| finishType | string | No | "natural", "matte", "dewy" |
| blendEdges | boolean | No | Blend at face edges |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "shadeApplied": "warm-medium-03",
    "coverageApplied": "medium"
  }
}
```

---

## Blush VTO

Virtual try-on for blush/cheek color.

### Endpoint

```
POST /api/blushtryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| colorCode | string | Yes | Blush color (hex) |
| placement | string | No | "apples", "draping", "sculpted" |
| intensity | float | No | Color intensity (0.0-1.0) |
| finishType | string | No | "matte", "shimmer", "satin" |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "cheeksDetected": true,
    "colorApplied": "#FFB6C1"
  }
}
```

---

## Eyeliner & Mascara VTO

Virtual try-on for eye definition products.

### Endpoint

```
POST /api/eyelinertryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| eyelinerStyle | string | No | "natural", "cat", "wing", "graphic" |
| eyelinerColor | string | No | Color (default: black) |
| eyelinerThickness | float | No | Line thickness (0.5-2.0) |
| mascara | boolean | No | Apply mascara effect |
| mascaraIntensity | string | No | "natural", "dramatic", "volumizing" |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "eyelinerApplied": true,
    "mascaraApplied": true
  }
}
```

---

## Complete Makeup Look VTO

Apply complete makeup looks.

### Endpoint

```
POST /api/makeuplooktryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| lookId | string | Yes | Preset look ID |
| intensity | float | No | Overall intensity (0.0-1.0) |
| customizeColors | object | No | Override specific product colors |

### Preset Look Categories

| Category | Looks |
|----------|-------|
| Natural | No-makeup makeup, Fresh, Everyday |
| Glam | Evening, Red carpet, Party |
| Editorial | Avant-garde, Artistic, Bold |
| Bridal | Classic bridal, Romantic, Modern |
| Seasonal | Spring fresh, Summer glow, Fall warm, Winter cool |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "lookApplied": {
      "id": "look_natural_001",
      "name": "Everyday Natural",
      "category": "natural"
    },
    "productsApplied": ["foundation", "blush", "lipstick", "mascara"]
  }
}
```

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|----------|
| All Makeup VTO | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Image Requirements

- Front-facing selfie
- Good, even lighting
- Face clearly visible
- Eyes open (for eye products)
- Lips visible and relaxed
- Minimal head tilt

### Common Error Codes

| Code | Description |
|------|-------------|
| RUNTIME_ERROR | Unexpected runtime error |
| PHOTO_DETECTION_FAIL | Photo could not be processed |
| FACE_NOT_DETECTED | No face found in image |
| LIPS_NOT_DETECTED | Lips not visible |
| EYES_NOT_DETECTED | Eyes not visible or closed |
| COLOR_NOT_FOUND | Invalid color code |
| LOOK_NOT_FOUND | Invalid look ID |

---

[← Back to Index](./README.md)
