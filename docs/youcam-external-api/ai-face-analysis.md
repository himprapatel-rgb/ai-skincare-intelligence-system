# AI Face Analysis API

> Comprehensive facial analysis including attributes, landmarks, and feature detection

## Table of Contents
- [Overview](#overview)
- [Face Attributes Analysis](#face-attributes-analysis)
- [Face Landmarks Detection](#face-landmarks-detection)
- [Age & Gender Detection](#age--gender-detection)
- [Face Shape Analysis](#face-shape-analysis)
- [Emotion Detection](#emotion-detection)
- [Common Specifications](#common-specifications)

---

## Overview

The AI Face Analysis APIs provide comprehensive facial analysis capabilities including attribute detection, landmark identification, and feature analysis for skincare and beauty applications.

**Base URL:** `https://yce-api-01.makeupar.com`

---

## Face Attributes Analysis

Analyze multiple facial attributes in a single request.

### Endpoint

```
POST /api/faceattributespro/v2
```

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | multipart/form-data |
| Authorization | Bearer YOUR_API_KEY |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie photo |
| attributes | array | No | Specific attributes to analyze |
| includeConfidence | boolean | No | Return confidence scores |
| outputFormat | string | No | Response format |

### Available Attributes

| Attribute | Description |
|-----------|-------------|
| skinType | Oily, Dry, Normal, Combination |
| skinTone | Fitzpatrick scale (I-VI) |
| wrinkles | Wrinkle severity (0-100) |
| darkCircles | Dark circle severity (0-100) |
| pores | Pore visibility (0-100) |
| acne | Acne severity (0-100) |
| spots | Spot/blemish detection |
| redness | Skin redness level |
| oiliness | Oil shine level |
| hydration | Skin hydration estimate |
| firmness | Skin firmness score |
| texture | Skin texture smoothness |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "faceDetected": true,
    "attributes": {
      "skinType": "combination",
      "skinTone": "III",
      "wrinkles": 25,
      "darkCircles": 40,
      "pores": 35,
      "acne": 15,
      "spots": 20,
      "redness": 30,
      "oiliness": 45,
      "hydration": 55,
      "firmness": 70,
      "texture": 65
    },
    "confidence": 0.94
  }
}
```

---

## Face Landmarks Detection

Detect 68+ facial landmark points.

### Endpoint

```
POST /api/facelandmarkspro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie photo |
| landmarkSet | string | No | "basic" (17), "standard" (68), "detailed" (468) |
| returnCoordinates | boolean | No | Return x,y coordinates |
| normalize | boolean | No | Normalize to 0-1 range |

### Landmark Groups

| Group | Points | Description |
|-------|--------|-------------|
| jawline | 17 | Face contour |
| eyebrows | 10 | Left and right eyebrows |
| nose | 9 | Nose bridge and tip |
| eyes | 12 | Eye contours |
| lips | 20 | Outer and inner lip contours |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "landmarks": [
      {"id": 0, "x": 125, "y": 180, "group": "jawline"},
      {"id": 1, "x": 130, "y": 195, "group": "jawline"}
    ],
    "faceBox": {
      "x": 100, "y": 80, "width": 200, "height": 250
    },
    "totalLandmarks": 68
  }
}
```

---

## Age & Gender Detection

Estimate apparent age and detect gender.

### Endpoint

```
POST /api/agegenderpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie photo |
| ageRange | boolean | No | Return age as range |
| genderConfidence | boolean | No | Include confidence score |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "estimatedAge": 28,
    "ageRange": "25-32",
    "gender": "female",
    "genderConfidence": 0.96
  }
}
```

---

## Face Shape Analysis

Determine face shape classification.

### Endpoint

```
POST /api/faceshapepro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie photo |
| includeRatios | boolean | No | Return facial ratios |
| recommendations | boolean | No | Include style suggestions |

### Face Shape Types

| Shape | Description |
|-------|-------------|
| oval | Balanced proportions |
| round | Equal width and length |
| square | Strong jawline, equal proportions |
| heart | Wider forehead, narrow chin |
| oblong | Longer than wide |
| diamond | Narrow forehead and jaw |
| triangle | Narrow forehead, wide jaw |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "faceShape": "oval",
    "confidence": 0.89,
    "ratios": {
      "faceLength": 1.0,
      "faceWidth": 0.75,
      "jawWidth": 0.68,
      "foreheadWidth": 0.72
    }
  }
}
```

---

## Emotion Detection

Detect facial expressions and emotions.

### Endpoint

```
POST /api/emotionpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie photo |
| allEmotions | boolean | No | Return all emotion scores |
| threshold | float | No | Minimum confidence threshold |

### Detectable Emotions

| Emotion | Description |
|---------|-------------|
| happy | Joy, smile detection |
| sad | Sadness indicators |
| angry | Anger expression |
| surprised | Surprise/shock |
| fearful | Fear expression |
| disgusted | Disgust expression |
| neutral | No strong emotion |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "dominantEmotion": "happy",
    "emotions": {
      "happy": 0.85,
      "neutral": 0.10,
      "surprised": 0.03,
      "sad": 0.02
    }
  }
}
```

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|----------|
| All Face Analysis | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Image Requirements

- Front-facing selfie
- Good, even lighting
- Face clearly visible
- Minimal obstructions (glasses OK)
- Head rotation within 30 degrees

### Common Error Codes

| Code | Description |
|------|-------------|
| RUNTIME_ERROR | Unexpected runtime error |
| PHOTO_DETECTION_FAIL | Photo could not be processed |
| FACE_NOT_DETECTED | No face found in image |
| MULTIPLE_FACES | More than one face detected |
| FACE_TOO_SMALL | Face region too small |
| POOR_LIGHTING | Insufficient lighting quality |

---

[← Back to Index](./README.md)
