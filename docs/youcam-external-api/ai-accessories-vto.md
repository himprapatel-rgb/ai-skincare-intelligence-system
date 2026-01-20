# AI Accessories Virtual Try-On

> Complete API documentation for Shoes, Hat, Ring, Watch, Earring, and Necklace virtual try-on features.

---

## Table of Contents

1. [AI Shoes Virtual Try-On](#ai-shoes-virtual-try-on)
2. [AI Hat Virtual Try-On](#ai-hat-virtual-try-on)
3. [AI Ring Virtual Try-On](#ai-ring-virtual-try-on)
4. [AI Watch Virtual Try-On](#ai-watch-virtual-try-on)
5. [AI Earring Virtual Try-On](#ai-earring-virtual-try-on)
6. [AI Necklace Virtual Try-On](#ai-necklace-virtual-try-on)

---

## AI Shoes Virtual Try-On

Step into the future of fashion with hyper-realistic AR try-on for footwear.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/shoes` | Create file upload URL |
| POST | `/s2s/v2.0/task/shoes` | Run AI shoes task |
| GET | `/s2s/v2.0/task/shoes/{taskid}` | Check task status |

### Integration Workflow

1. **Prepare a selfie image** - Upload or provide a valid image URL
2. **Prepare a shoes image** - Product image or worn image
3. **Select style and gender** - Choose from predefined styles
4. **Create AI task** - Fire the task and get taskid
5. **Poll for result** - Check status until success/error
6. **Retrieve result** - Download the generated image

### Request Example

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

### Response Example

```json
{
  "status": 200,
  "data": {
    "taskid": "SaGaqpDgKwFrVBgMpQMA3HY0LeqdT913W5TOD8uGPi6NqQ3dhlmN-6ntFwhzT"
  }
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `srcfileurl` | string | Yes | URL of selfie image |
| `srcfileid` | string | Yes* | File ID from upload |
| `reffileurl` | string | Yes | URL of shoes image |
| `reffileid` | string | Yes* | File ID of shoes image |
| `gender` | string | Yes | `female` or `male` |
| `style` | string | No | Style preset (default: `random`) |

*Either URL or File ID required

### Available Styles

- `style:minimalist`
- `style:bohemian`
- `style:cottagecore`
- `style:frenchelegance`
- `style:retrofashion`
- `random` (default)

### Image Specifications

| Type | Min Resolution | Notes |
|------|----------------|-------|
| Selfie | 512×512 | Face visible, head-to-chest preferred |
| Shoes (product) | 512×512 | One product per image, >25% height coverage |
| Shoes (worn) | 800×800 | Clear, unobstructed view |

### Error Codes

| Code | Description |
|------|-------------|
| `error:download:image` | Failed to download source/reference image |
| `error:inference` | Inference pipeline error |
| `error:no:face` | No face detected in source image |
| `error:nsfw:content:detected` | NSFW content detected |
| `exceed:max:file:size` | File exceeds 10MB |
| `invalid:parameter` | Invalid gender or style |

---

## AI Hat Virtual Try-On

Transform online shopping with immersive headwear virtual try-on.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/hat` | Create file upload URL |
| POST | `/s2s/v2.0/task/hat` | Run AI hat task |
| GET | `/s2s/v2.0/task/hat/{taskid}` | Check task status |

### Request Example

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/hat \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "content-type: application/json" \
  --data '{
    "srcfileurl": "https://example.com/selfie.jpg",
    "reffileurl": "https://example.com/hat.jpg",
    "gender": "female",
    "style": "random"
  }'
```

### Available Styles

- `style:sportycasual`
- `style:urbanfashion`
- `style:vacationcasual`
- `style:warmcozy`
- `style:bohemian`
- `random` (default)

### Image Specifications

| Type | Min Resolution | Notes |
|------|----------------|-------|
| Selfie | 512×512 | Face visible, head-to-chest preferred |
| Hat (product) | 512×512 | One product, >25% height coverage |
| Hat (worn) | 800×800 | Clear, unobstructed hat view |

---

## AI Ring Virtual Try-On

2D virtual try-on for rings with high precision.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/ring` | Create file upload URL |
| POST | `/s2s/v2.0/task/2d-vto/ring` | Run AI ring task |
| GET | `/s2s/v2.0/task/2d-vto/ring/{taskid}` | Check task status |

### Request Example

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/2d-vto/ring \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "content-type: application/json" \
  --data '{
    "srcfileurl": "https://example.com/hand.jpg",
    "reffileurls": ["https://example.com/ring.jpg"],
    "sourceinfo": [{"name": "hand.jpg"}],
    "objectinfos": [{"ringwearingfinger": 3}]
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ringwearingfinger` | int (0-4) | - | 0=Thumb, 1=Index, 2=Middle, 3=Ring, 4=Little |
| `ringwearinglocation` | float (0.0-1.0) | - | Position along finger (0=MCP, 1=PIP joint) |
| `ringshadowintensity` | float (0.0-1.0) | 0.15 | Shadow strength |
| `ringambientlightintensity` | float (0.0-1.0) | 1.0 | Lighting match intensity |
| `ringanchorpoint` | array | null | Inner edge points for wide rings |

### Image Specifications

- **Ring View**: Three-quarter front view (~45 degrees)
- **Hand View**: Back of hand fully visible, all five fingers shown, no occlusion

---

## AI Watch Virtual Try-On

Virtual try-on for watches and bracelets.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/watch` | Create file upload URL |
| POST | `/s2s/v2.0/task/2d-vto/watch` | Run AI watch task |
| GET | `/s2s/v2.0/task/2d-vto/watch/{taskid}` | Check task status |

### Request Example

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/2d-vto/watch \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "content-type: application/json" \
  --data '{
    "srcfileurl": "https://example.com/wrist.jpg",
    "reffileurls": ["https://example.com/watch.jpg"],
    "sourceinfo": [{"name": "wrist.jpg"}],
    "objectinfos": []
  }'
```

---

## AI Earring Virtual Try-On

Top AI ear piercing simulator for virtual earring try-on.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/earring` | Create file upload URL |
| POST | `/s2s/v2.0/task/2d-vto/earring` | Run AI earring task |
| GET | `/s2s/v2.0/task/2d-vto/earring/{taskid}` | Check task status |

### Request Example

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/2d-vto/earring \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "content-type: application/json" \
  --data '{
    "srcfileurl": "https://example.com/selfie.jpg",
    "reffileurls": ["https://example.com/earring.jpg"],
    "sourceinfo": [{"name": "selfie.jpg"}],
    "objectinfos": [{"earringisrightear": true}]
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `earringwearinglocation` | int[2] | null | Target location in selfie |
| `earringscale` | number | null | Size in centimeters |
| `earringisrightear` | boolean | true | Right ear placement |
| `earringoccludedtype` | int (0-2) | 0 | 0=auto, 1=occluded, 2=no occlusion |
| `earringshadowintensity` | float (0.0-1.0) | 0.15 | Shadow strength |
| `earringambientlightintensity` | float (0.0-1.0) | 1.0 | Lighting match |
| `earringanchorpoint` | array | null | Wearing position in product image |

### Image Specifications

**Supported Earring View:**
- Single earring in clear front view without obstruction

**Supported Selfie View:**
- Clear view of one side of face with ear unobstructed
- Single-side earring wearing supported
- Vertical head tilt: 0° to 20° upward
- Horizontal head rotation: 15° to 75° sideways
- Ear size: 10% to 50% of image height

---

## AI Necklace Virtual Try-On

Ultra-realistic AR try-on for necklaces with precise neck tracking.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/s2s/v2.0/file/2d-vto/necklace` | Create file upload URL |
| POST | `/s2s/v2.0/task/2d-vto/necklace` | Run AI necklace task |
| GET | `/s2s/v2.0/task/2d-vto/necklace/{taskid}` | Check task status |

### Request Example

```bash
curl --request POST \
  --url https://yce-api-01.makeupar.com/s2s/v2.0/task/2d-vto/necklace \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "content-type: application/json" \
  --data '{
    "srcfileurl": "https://example.com/selfie.jpg",
    "reffileurls": ["https://example.com/necklace.jpg"],
    "sourceinfo": [{"name": "selfie.jpg"}],
    "objectinfos": []
  }'
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `necklacewearinglocation` | array[2] | null | Target placement locations |
| `necklaceshadowintensity` | float (0.0-1.0) | 0.15 | Shadow strength |
| `necklaceambientlightintensity` | float (0.0-1.0) | 1.0 | Lighting match |
| `necklaceanchorpoint` | array[2] | null | Left/right chain anchor points |

### Image Specifications

**Supported Necklace View:**
- Front-facing worn image with background removed

**Supported Selfie View:**
- Front-facing selfie with neck clearly visible
- Horizontal head rotation within 20°
- Neck width should occupy ≥15% of image width

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|---------|
| All VTO | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Common Error Codes

| Code | Description |
|------|-------------|
| `RUNTIME_ERROR` | Unexpected runtime error |
| `PHOTO_DETECTION_FAIL` | Photo could not be processed |
| `OBJECT_DETECTION_FAIL` | Object not detected |
| `PHOTO_CHECK_INVALID` | Invalid pose or size |
| `INPUT_ERROR` | Incorrect file format |
| `INPUT_MAIN_IMAGE_EMPTY` | User image required |

---

[← Back to Index](./README.md)
