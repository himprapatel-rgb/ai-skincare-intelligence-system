# YouCam API Documentation (v1.7)

> **External API Reference for AI Skincare Intelligence System**  
> Last modified: January 5, 2026  
> Contact: YouCamOnlineEditor_API@perfectcorp.com

---

## Table of Contents

1. [Introduction](#introduction)
2. [API Server & Authentication](#api-server--authentication)
3. [AI Virtual Try-On APIs](#ai-virtual-try-on-apis)
   - [AI Shoes Virtual Try-On](#ai-shoes-virtual-try-on)
   - [AI Hat Virtual Try-On](#ai-hat-virtual-try-on)
   - [AI Ring Virtual Try-On](#ai-ring-virtual-try-on)
   - [AI Watch Virtual Try-On](#ai-watch-virtual-try-on)
   - [AI Earring Virtual Try-On](#ai-earring-virtual-try-on)
   - [AI Necklace Virtual Try-On](#ai-necklace-virtual-try-on)
4. [AI Hair Features](#ai-hair-features)
   - [AI Hair Color](#ai-hair-color)
   - [AI Hair Style](#ai-hair-style)
5. [JS Camera Kit](#js-camera-kit)
6. [Common Specifications](#common-specifications)

---

## Introduction

The YouCam APIs provide AI-powered visual effects for photos, enabling beautiful and true-to-life results. These standard RESTful APIs integrate easily into websites, e-commerce platforms, iOS/Android apps, applets, and mini-programs.

**Key Features:**
- Virtual try-on for accessories (shoes, hats, rings, watches, earrings, necklaces)
- Hair color and style transformations
- JS Camera Kit for in-browser capture

---

## API Server & Authentication

### Base URL

```
https://yce-api-01.makeupar.com
```

### Authentication

All requests require Bearer Token authentication:

```
Authorization: Bearer YOUR_API_KEY
```

Get your API Key at: https://yce.makeupar.com/api-console/en/api-keys

### Rate Limits

API requests are subject to rate limiting. Exceeding limits returns HTTP 429.

---

## AI Virtual Try-On APIs

### AI Shoes Virtual Try-On

Virtual try-on for shoes using AI technology.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/shoes` | Upload file |
| POST | `/s2s/v2.0/task/shoes` | Create AI task |
| GET | `/s2s/v2.0/task/shoes/{taskid}` | Check task status |

#### Workflow

1. **Prepare selfie image** - Upload or provide URL
2. **Prepare shoes image** - Product or worn image
3. **Create AI task** - Select style and gender
4. **Poll for result** - Check status until complete
5. **Retrieve result** - Download generated image

#### Request Example

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/shoes \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "content-type: application/json" \
  --data '{
    "srcfileurl": "https://example.com/selfie.jpg",
    "reffileurl": "https://example.com/shoes.jpg",
    "gender": "female",
    "style": "random"
  }'
```

#### Styles Available

- `style:minimalist`
- `style:bohemian`
- `style:cottagecore`
- `style:frenchelegance`
- `style:retrofashion`
- `random` (default)

#### Image Requirements

| Type | Min Resolution | Notes |
|------|----------------|-------|
| Selfie | 512×512 | Face visible, head-to-chest preferred |
| Shoes (product) | 512×512 | One product per image, >25% height |
| Shoes (worn) | 800×800 | Clear, unobstructed view |

---

### AI Hat Virtual Try-On

Virtual try-on for headwear.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/hat` | Upload file |
| POST | `/s2s/v2.0/task/hat` | Create AI task |
| GET | `/s2s/v2.0/task/hat/{taskid}` | Check task status |

#### Styles Available

- `style:sportycasual`
- `style:urbanfashion`
- `style:vacationcasual`
- `style:warmcozy`
- `style:bohemian`
- `random` (default)

---

### AI Ring Virtual Try-On

2D virtual try-on for rings.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/ring` | Upload file |
| POST | `/s2s/v2.0/task/2d-vto/ring` | Create AI task |
| GET | `/s2s/v2.0/task/2d-vto/ring/{taskid}` | Check task status |

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ringwearingfinger` | int (0-4) | 0=Thumb, 1=Index, 2=Middle, 3=Ring, 4=Little |
| `ringwearinglocation` | float (0.0-1.0) | Position along finger |
| `ringshadowintensity` | float (0.0-1.0) | Shadow strength (default: 0.15) |
| `ringambientlightintensity` | float (0.0-1.0) | Lighting match (default: 1.0) |

---

### AI Watch Virtual Try-On

Virtual try-on for watches.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/watch` | Upload file |
| POST | `/s2s/v2.0/task/2d-vto/watch` | Create AI task |
| GET | `/s2s/v2.0/task/2d-vto/watch/{taskid}` | Check task status |

---

### AI Earring Virtual Try-On

Virtual try-on for earrings with sophisticated lighting effects.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/earring` | Upload file |
| POST | `/s2s/v2.0/task/2d-vto/earring` | Create AI task |
| GET | `/s2s/v2.0/task/2d-vto/earring/{taskid}` | Check task status |

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `earringwearinglocation` | int[2] | Target location in selfie |
| `earringscale` | number | Size in centimeters |
| `earringisrightear` | boolean | Right ear (default: true) |
| `earringoccludedtype` | int (0-2) | 0=auto, 1=occluded, 2=no occlusion |
| `earringshadowintensity` | float (0.0-1.0) | Shadow strength (default: 0.15) |

---

### AI Necklace Virtual Try-On

Virtual try-on for necklaces with precise neck tracking.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/necklace` | Upload file |
| POST | `/s2s/v2.0/task/2d-vto/necklace` | Create AI task |
| GET | `/s2s/v2.0/task/2d-vto/necklace/{taskid}` | Check task status |

---

## AI Hair Features

### AI Hair Color

Transform hair color with AI.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/hair-color` | Upload file |
| POST | `/s2s/v2.0/task/hair-color` | Create AI task |
| GET | `/s2s/v2.0/task/hair-color/{taskid}` | Check task status |

#### Full Mode Colors

- Jet Black
- Chocolate Brown
- Honey Blonde
- Platinum Blonde
- Ash Gray
- Rose Gold
- Burgundy
- Copper Red
- Lavender
- Teal Blue

#### Ombre Mode Colors

- Dark Brown/Caramel Blonde
- Jet Black/Silver Gray
- Ash Brown/Lavender
- Rose Gold/Peach Blonde
- Burgundy/Magenta Pink
- Deep Blue/Teal Green
- Plum Purple/Pastel Lilac
- Copper Red/Golden Blonde
- Dark Gray/Ice Blonde
- Midnight Blue/Denim Blue

---

### AI Hair Style

Transform hairstyles using predefined templates.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/hair-style` | Upload file |
| GET | `/s2s/v2.0/task/template/hair-style` | List templates |
| POST | `/s2s/v2.0/task/hair-style` | Create AI task |
| GET | `/s2s/v2.0/task/hair-style/{taskid}` | Check task status |

---

## JS Camera Kit

### Overview

The JavaScript Camera Kit provides in-browser camera capture with:

- Camera permission handling
- Real-time face detection
- Automatic face quality validation
- Guided capture UI
- Multi-step capture flows
- Base64 and blob output formats

### Installation

```html
<script src="https://plugins-media.makeupar.com/v2.2-camera-kit/sdk.js"></script>
```

### Quick Start

```javascript
window.ymkAsyncInit = function() {
  YMK.addEventListener('loaded', function() {
    // Module fully loaded
  });
  
  YMK.addEventListener('faceDetectionCaptured', function(result) {
    // Handle captured images
    for (const image of result.images) {
      console.log(image.image); // base64 or blob
    }
  });
};

YMK.init({
  faceDetectionMode: 'skincare',
  imageFormat: 'base64',
  language: 'enu'
});

YMK.openCameraKit();
```

### Detection Modes

| Mode | Description |
|------|-------------|
| `makeup` | Virtual cosmetic try-on |
| `skincare` | Standard skin analysis |
| `hdskincare` | HD skin capture (2560px) |
| `shadefinder` | Skin tone analysis |
| `hairlength` | Full hair-length capture |
| `hairfrizziness` | 3-phase hair capture |
| `hairtype` | Multi-angle hair capture |
| `ring` | Hand capture for ring |
| `wrist` | Wrist capture for watch |
| `necklace` | Selfie for necklace |
| `earring` | Selfie for earring |

### Face Quality Events

```javascript
YMK.addEventListener('faceQualityChanged', function(q) {
  // q.hasFace - boolean
  // q.area - good/notgood/toosmall/outofboundary
  // q.frontal - good/notgood
  // q.lighting - good/ok/notgood
  // q.nakedeye - good/notgood
  // q.faceangle - good/upward/downward/leftward/rightward
});
```

---

## Common Specifications

### Supported Formats

| AI Feature | Max Dimensions | File Size | Formats |
|------------|----------------|-----------|---------|
| Shoes VTO | 4096 (long side) | 10MB | jpg, jpeg, png, heic |
| Hat VTO | 4096 (long side) | 10MB | jpg, jpeg, png, heic |
| Ring VTO | 4096 (long side) | 10MB | jpg, jpeg, png |
| Watch VTO | 4096 (long side) | 10MB | jpg, jpeg, png |
| Earring VTO | 4096 (long side) | 10MB | jpg, jpeg, png |
| Necklace VTO | 4096 (long side) | 10MB | jpg, jpeg, png |
| Hair Color | 4096 (long side) | 10MB | jpg, png |
| Hair Style | 4096 (long side) | 10MB | jpg, png |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `error:download:image` | Failed to download source/reference image |
| `error:inference` | Inference pipeline error |
| `error:no:face` | No face detected in source image |
| `error:nsfw:content:detected` | NSFW content detected |
| `exceed:max:file:size` | File size exceeds 10 MB |
| `invalid:parameter` | Invalid gender or style value |
| `unknown:internal:error` | Other internal errors |
| `RUNTIME_ERROR` | Unexpected runtime error |
| `PHOTO_DETECTION_FAIL` | Photo could not be processed |
| `OBJECT_DETECTION_FAIL` | Object could not be detected |
| `PHOTO_CHECK_INVALID` | Invalid pose or size |
| `INPUT_ERROR` | Incorrect file format |
| `INPUT_MAIN_IMAGE_EMPTY` | User image required |

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Successful |
| 400 | Invalid request parameters |
| 401 | Invalid/Inactive/Expired API Key |
| 429 | Too many requests |
| 500 | Task timeout or internal error |

### Environment Dependencies

| Language | Recommended Versions |
|----------|---------------------|
| cURL | bash 3.2+, curl 7.58+, jq 1.6+ |
| Node.js | Node 18+ |
| JavaScript | Chrome/Edge 80+, Firefox 74+, Safari 13.1+ |
| PHP | PHP 7.4+ with ext-curl |
| Python | Python 3.10+, requests 2.20.0+ |
| Java | Java 11+, Jackson Databind 2.12.0+ |

---

## Additional Resources

- **API Console**: https://yce.makeupar.com/api-console/en/api-keys
- **API Playground**: https://yce.makeupar.com/api-console/en/api-playground
- **Support**: YouCamOnlineEditor_API@perfectcorp.com

---

*This documentation is provided by Perfect Corp. for integration with the AI Skincare Intelligence System.*
