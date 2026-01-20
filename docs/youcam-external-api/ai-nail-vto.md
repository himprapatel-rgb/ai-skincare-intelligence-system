# AI Nail Virtual Try-On API

> Virtual try-on for nail polish colors and nail art designs

## Table of Contents
- [Overview](#overview)
- [Nail Color VTO](#nail-color-vto)
- [Nail Art VTO](#nail-art-vto)
- [Nail Shape VTO](#nail-shape-vto)
- [Common Specifications](#common-specifications)

---

## Overview

The AI Nail VTO APIs enable virtual try-on for nail polish colors, nail art patterns, and nail shape modifications.

**Base URL:** `https://yce-api-01.makeupar.com`

---

## Nail Color VTO

Virtual try-on for nail polish colors.

### Endpoint

```
POST /api/nailcolortryonpro/v2
```

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | multipart/form-data |
| Authorization | Bearer YOUR_API_KEY |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| handImage | file | Yes | Image of hand/nails |
| colorCode | string | Yes | Nail color (hex) |
| finishType | string | No | "cream", "shimmer", "glitter", "matte" |
| opacity | float | No | Color intensity (0.0-1.0) |
| applyToAll | boolean | No | Apply to all visible nails |
| nailSelection | array | No | Specific nail indices |

### Finish Types

| Finish | Description |
|--------|-------------|
| cream | Solid, glossy finish |
| shimmer | Subtle sparkle effect |
| glitter | Visible glitter particles |
| matte | No shine, flat finish |
| metallic | Chrome/mirror effect |
| jelly | Semi-transparent, glossy |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "nailsDetected": 5,
    "colorApplied": "#FF69B4",
    "finishApplied": "cream"
  }
}
```

---

## Nail Art VTO

Virtual try-on for nail art designs.

### Endpoint

```
POST /api/nailarttryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| handImage | file | Yes | Image of hand/nails |
| designId | string | Yes | Nail art design ID |
| baseColor | string | No | Base nail color |
| accentNails | array | No | Nails for accent design |
| designScale | float | No | Pattern scale (0.5-2.0) |

### Design Categories

| Category | Designs |
|----------|--------|
| French | Classic, colored tip, reverse, chevron |
| Patterns | Stripes, dots, marble, animal print |
| Seasonal | Holiday, spring florals, summer bright |
| Minimalist | Lines, geometric, negative space |
| Glam | Rhinestones, foil, chrome accent |
| Abstract | Swirls, splatter, gradient |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "designApplied": {
      "id": "french_classic_001",
      "name": "Classic French",
      "category": "french"
    },
    "nailsProcessed": 5
  }
}
```

---

## Nail Shape VTO

Virtual try-on for different nail shapes.

### Endpoint

```
POST /api/nailshapetryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| handImage | file | Yes | Image of hand/nails |
| shapeType | string | Yes | Target nail shape |
| length | string | No | "short", "medium", "long", "extra-long" |
| preserveColor | boolean | No | Keep current nail color |

### Nail Shapes

| Shape | Description |
|-------|-------------|
| round | Classic rounded tip |
| square | Flat, squared-off tip |
| squoval | Square with rounded corners |
| oval | Elongated, tapered sides |
| almond | Pointed with soft edges |
| stiletto | Sharp, pointed tip |
| coffin | Tapered with flat tip |
| ballerina | Similar to coffin, softer |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "shapeApplied": "almond",
    "lengthApplied": "medium",
    "nailsModified": 5
  }
}
```

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|----------|
| All Nail VTO | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Image Requirements

- Hand clearly visible
- Nails in frame and unobscured
- Good lighting, minimal shadows
- Fingers spread for best detection
- Background contrast recommended

### Common Error Codes

| Code | Description |
|------|-------------|
| RUNTIME_ERROR | Unexpected runtime error |
| PHOTO_DETECTION_FAIL | Photo could not be processed |
| HAND_NOT_DETECTED | No hand found in image |
| NAILS_NOT_DETECTED | Nails not visible |
| NAILS_OBSCURED | Nails covered or unclear |
| COLOR_NOT_FOUND | Invalid color code |
| DESIGN_NOT_FOUND | Invalid design ID |
| SHAPE_NOT_FOUND | Invalid shape type |

---

[← Back to Index](./README.md)
