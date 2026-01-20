# AI Hair Analysis & Color VTO API

> Hair analysis, color try-on, and styling virtual try-on

## Table of Contents
- [Overview](#overview)
- [Hair Analysis](#hair-analysis)
- [Hair Color VTO](#hair-color-vto)
- [Hair Style VTO](#hair-style-vto)
- [Common Specifications](#common-specifications)

---

## Overview

The AI Hair Analysis & Color VTO APIs provide comprehensive hair analysis and virtual try-on capabilities for hair colors, highlights, and styling options.

**Base URL:** `https://yce-api-01.makeupar.com`

---

## Hair Analysis

Analyze hair characteristics and conditions.

### Endpoint

```
POST /api/hairanalysispro/v2
```

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | multipart/form-data |
| Authorization | Bearer YOUR_API_KEY |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's photo showing hair |
| analysisType | array | No | Specific analyses to perform |
| includeRecommendations | boolean | No | Include care recommendations |

### Analysis Types

| Type | Description |
|------|-------------|
| hairColor | Current hair color detection |
| hairType | Straight, wavy, curly, coily |
| hairTexture | Fine, medium, coarse |
| hairDensity | Thin, medium, thick |
| hairCondition | Healthy, damaged, dry |
| scalpCondition | Oily, dry, normal, flaky |
| grayPercentage | Gray hair percentage |
| hairLength | Short, medium, long |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "hairDetected": true,
    "analysis": {
      "hairColor": {
        "primary": "brown",
        "level": "6",
        "undertone": "warm"
      },
      "hairType": "wavy",
      "hairTexture": "medium",
      "hairDensity": "medium",
      "hairCondition": "healthy",
      "scalpCondition": "normal",
      "grayPercentage": 15,
      "hairLength": "medium"
    },
    "confidence": 0.91
  }
}
```

---

## Hair Color VTO

Virtual try-on for hair colors.

### Endpoint

```
POST /api/haircolortryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's photo |
| colorCode | string | Yes | Target hair color code |
| colorType | string | No | "solid", "highlights", "ombre", "balayage" |
| intensity | float | No | Color intensity (0.0-1.0) |
| preserveHighlights | boolean | No | Keep natural highlights |
| blendMode | string | No | "natural", "vivid", "subtle" |

### Color Categories

| Category | Colors |
|----------|--------|
| Natural | Black, Brown (light to dark), Blonde shades |
| Red | Auburn, Copper, Red, Burgundy |
| Fashion | Purple, Blue, Pink, Green, Silver |
| Highlights | Blonde, Caramel, Honey, Platinum |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "colorApplied": {
      "code": "#8B4513",
      "name": "Medium Brown",
      "type": "solid"
    },
    "processingTime": 1.8
  }
}
```

### Highlight/Ombre Options

| Parameter | Type | Description |
|-----------|------|-------------|
| highlightColor | string | Secondary color for highlights |
| highlightPattern | string | "babylights", "chunky", "face-framing" |
| ombreStart | float | Transition start point (0-1) |
| ombreBlend | string | "sharp", "gradual", "natural" |

---

## Hair Style VTO

Virtual try-on for hairstyles.

### Endpoint

```
POST /api/hairstyletryonpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's front-facing photo |
| styleId | string | Yes | Hairstyle template ID |
| hairColor | string | No | Apply color with style |
| adjustFit | boolean | No | Auto-adjust to face shape |

### Style Categories

| Category | Styles |
|----------|--------|
| Short | Pixie, Bob, Buzz cut, Crew cut |
| Medium | Lob, Shag, Layered, Shoulder-length |
| Long | Straight, Waves, Curls, Braids |
| Updo | Bun, Ponytail, French twist |
| Bangs | Side-swept, Curtain, Blunt, Wispy |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "resultImage": "base64_encoded_image",
    "styleApplied": {
      "id": "style_bob_001",
      "name": "Classic Bob",
      "category": "short"
    },
    "faceShapeMatch": 0.88
  }
}
```

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|----------|
| All Hair APIs | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Image Requirements

- Clear view of hair
- Good lighting
- Hair not covered by hat/accessories
- Front or side view acceptable
- Minimum resolution: 512x512px

### Common Error Codes

| Code | Description |
|------|-------------|
| RUNTIME_ERROR | Unexpected runtime error |
| PHOTO_DETECTION_FAIL | Photo could not be processed |
| HAIR_NOT_DETECTED | Hair not visible in image |
| HAIR_COVERED | Hair obscured by accessories |
| COLOR_NOT_FOUND | Invalid color code |
| STYLE_NOT_FOUND | Invalid style ID |

---

[← Back to Index](./README.md)
