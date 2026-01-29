# AI Image Enhancement Plan

## Pellicura - Improving Camera Quality with AI

---

## Overview

Enhance uploaded photos using AI to improve skin analysis accuracy, especially for:
- Low-light photos
- Low-resolution cameras
- Blurry or noisy images
- Poor contrast/exposure

---

## Options Comparison

| Approach | Location | Latency | Cost | Quality |
|----------|----------|---------|------|---------|
| **Real-ESRGAN (Browser)** | Client | ~2-5s | Free | ⭐⭐⭐⭐ |
| **OpenCV Enhancement** | Server | ~0.5s | Free | ⭐⭐⭐ |
| **Replicate API** | Cloud | ~3-10s | $0.01/image | ⭐⭐⭐⭐⭐ |
| **Cloudflare AI** | Edge | ~1-2s | $0.001/image | ⭐⭐⭐⭐ |
| **Custom TensorFlow.js** | Client | ~3-8s | Free | ⭐⭐⭐⭐ |

---

## Recommended: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                      User Uploads Photo                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Step 1: Client-Side Pre-Processing              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ • Auto white balance                                    ││
│  │ • Exposure correction                                   ││
│  │ • Noise reduction (light)                               ││
│  │ • Face detection & crop (MediaPipe - already have)      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Step 2: Server-Side Enhancement                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ • Super-resolution (if image < 1024px)                  ││
│  │ • Skin tone normalization                               ││
│  │ • Lighting correction                                   ││
│  │ • Sharpening for texture analysis                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Image → AI Analysis              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Options

### Option 1: OpenCV Enhancement (Quick Win - Free)

**Backend: Python/FastAPI**

```python
# backend/services/image_enhancement.py
import cv2
import numpy as np
from PIL import Image
import io

class ImageEnhancer:
    """AI-powered image enhancement for skin analysis."""
    
    def enhance(self, image_bytes: bytes) -> bytes:
        """Apply full enhancement pipeline."""
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 1. Denoise
        img = self.denoise(img)
        
        # 2. Auto white balance
        img = self.white_balance(img)
        
        # 3. Enhance contrast (CLAHE)
        img = self.enhance_contrast(img)
        
        # 4. Sharpen for texture
        img = self.sharpen(img)
        
        # Convert back to bytes
        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return buffer.tobytes()
    
    def denoise(self, img: np.ndarray) -> np.ndarray:
        """Remove noise while preserving skin texture."""
        return cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
    
    def white_balance(self, img: np.ndarray) -> np.ndarray:
        """Auto white balance using gray world assumption."""
        result = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        avg_a = np.average(result[:, :, 1])
        avg_b = np.average(result[:, :, 2])
        result[:, :, 1] = result[:, :, 1] - ((avg_a - 128) * (result[:, :, 0] / 255.0) * 1.1)
        result[:, :, 2] = result[:, :, 2] - ((avg_b - 128) * (result[:, :, 0] / 255.0) * 1.1)
        return cv2.cvtColor(result, cv2.COLOR_LAB2BGR)
    
    def enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        """CLAHE for local contrast enhancement."""
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    def sharpen(self, img: np.ndarray) -> np.ndarray:
        """Unsharp masking for texture enhancement."""
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        return cv2.addWeighted(img, 1.5, gaussian, -0.5, 0)
    
    def super_resolution_2x(self, img: np.ndarray) -> np.ndarray:
        """2x upscale using OpenCV DNN super-resolution."""
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel("models/EDSR_x2.pb")  # Download model
        sr.setModel("edsr", 2)
        return sr.upsample(img)
```

**Integration in scan endpoint:**

```python
# backend/app/api/v1/endpoints/scan.py
from services.image_enhancement import ImageEnhancer

enhancer = ImageEnhancer()

@router.post("/{scan_id}/upload")
async def upload_scan_image(scan_id: str, file: UploadFile):
    # Read image
    image_bytes = await file.read()
    
    # Enhance image
    enhanced_bytes = enhancer.enhance(image_bytes)
    
    # Continue with analysis using enhanced image
    # ...
```

---

### Option 2: Real-ESRGAN (Best Quality - Free)

**Super-resolution AI model for 4x upscaling**

```python
# backend/services/super_resolution.py
import torch
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
import numpy as np
import cv2

class SuperResolutionService:
    def __init__(self):
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load Real-ESRGAN model."""
        model = RRDBNet(
            num_in_ch=3, num_out_ch=3, num_feat=64,
            num_block=23, num_grow_ch=32, scale=4
        )
        self.upsampler = RealESRGANer(
            scale=4,
            model_path='models/RealESRGAN_x4plus.pth',
            model=model,
            tile=400,  # For memory efficiency
            tile_pad=10,
            pre_pad=0,
            half=True  # Use FP16 for speed
        )
    
    def enhance(self, image_bytes: bytes) -> bytes:
        """4x super-resolution enhancement."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Only upscale if image is small
        h, w = img.shape[:2]
        if max(h, w) < 1024:
            output, _ = self.upsampler.enhance(img, outscale=2)
        else:
            output = img
        
        _, buffer = cv2.imencode('.jpg', output, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return buffer.tobytes()
```

**Requirements:**

```txt
# Add to requirements.txt
basicsr>=1.4.2
realesrgan>=0.3.0
torch>=2.0.0
```

---

### Option 3: TensorFlow.js (Client-Side)

**Browser-based enhancement before upload**

```typescript
// frontend/src/services/imageEnhancement.ts
import * as tf from '@tensorflow/tfjs';

export class ImageEnhancer {
  private model: tf.GraphModel | null = null;

  async loadModel() {
    // Load ESRGAN or custom model
    this.model = await tf.loadGraphModel('/models/esrgan/model.json');
  }

  async enhance(imageElement: HTMLImageElement): Promise<HTMLCanvasElement> {
    if (!this.model) await this.loadModel();

    // Convert to tensor
    const tensor = tf.browser.fromPixels(imageElement)
      .toFloat()
      .div(255.0)
      .expandDims(0);

    // Run model
    const enhanced = this.model!.predict(tensor) as tf.Tensor;

    // Convert back to canvas
    const canvas = document.createElement('canvas');
    const [, height, width] = enhanced.shape;
    canvas.width = width!;
    canvas.height = height!;

    await tf.browser.toPixels(
      enhanced.squeeze().clipByValue(0, 1).mul(255).toInt() as tf.Tensor3D,
      canvas
    );

    // Cleanup
    tensor.dispose();
    enhanced.dispose();

    return canvas;
  }

  // Quick enhancement without AI model
  quickEnhance(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Auto levels
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (let i = 0; i < data.length; i += 4) {
      minR = Math.min(minR, data[i]);
      maxR = Math.max(maxR, data[i]);
      minG = Math.min(minG, data[i + 1]);
      maxG = Math.max(maxG, data[i + 1]);
      minB = Math.min(minB, data[i + 2]);
      maxB = Math.max(maxB, data[i + 2]);
    }

    const rangeR = maxR - minR || 1;
    const rangeG = maxG - minG || 1;
    const rangeB = maxB - minB || 1;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - minR) / rangeR) * 255;
      data[i + 1] = ((data[i + 1] - minG) / rangeG) * 255;
      data[i + 2] = ((data[i + 2] - minB) / rangeB) * 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}
```

**Usage in ScanPage:**

```typescript
// frontend/src/pages/ScanPage.tsx
import { ImageEnhancer } from '../services/imageEnhancement';

const enhancer = new ImageEnhancer();

const handleCapture = async (imageData: string) => {
  setStatus('Enhancing image...');
  
  // Create image element
  const img = new Image();
  img.src = imageData;
  await img.decode();
  
  // Enhance
  const enhancedCanvas = await enhancer.enhance(img);
  const enhancedData = enhancedCanvas.toDataURL('image/jpeg', 0.95);
  
  // Upload enhanced image
  await uploadImage(enhancedData);
};
```

---

### Option 4: Cloudflare AI (After Migration)

**Use Cloudflare Workers AI for image enhancement**

```typescript
// Cloudflare Worker
export default {
  async fetch(request: Request, env: Env) {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    // Use Cloudflare AI for enhancement
    const enhanced = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: 'enhance skin detail, improve lighting, professional photo',
      image: await image.arrayBuffer(),
      strength: 0.3, // Light enhancement
    });
    
    return new Response(enhanced, {
      headers: { 'Content-Type': 'image/png' }
    });
  }
}
```

---

### Option 5: Replicate API (Highest Quality)

**Use hosted AI models via API**

```python
# backend/services/replicate_enhance.py
import replicate
import base64
import httpx

class ReplicateEnhancer:
    def __init__(self, api_token: str):
        self.client = replicate.Client(api_token=api_token)
    
    async def enhance(self, image_bytes: bytes) -> bytes:
        """Enhance image using Real-ESRGAN on Replicate."""
        # Upload image
        image_b64 = base64.b64encode(image_bytes).decode()
        data_uri = f"data:image/jpeg;base64,{image_b64}"
        
        # Run model
        output = self.client.run(
            "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
            input={
                "image": data_uri,
                "scale": 2,
                "face_enhance": True  # Also enhance faces
            }
        )
        
        # Download result
        async with httpx.AsyncClient() as client:
            response = await client.get(output)
            return response.content
```

**Cost: ~$0.01 per image**

---

## Recommended Implementation Plan

### Phase 1: Quick Win (1 day)
- Add OpenCV enhancement to backend
- Apply before AI analysis
- No frontend changes needed

### Phase 2: Client-Side (2-3 days)
- Add quick enhance (auto-levels, sharpen) in browser
- Show "Enhancing..." feedback
- Reduce upload size with smart compression

### Phase 3: AI Super-Resolution (3-5 days)
- Add Real-ESRGAN for low-res images
- Only apply when image < 1024px
- Cache enhanced images

### Phase 4: Cloudflare AI (After Migration)
- Use edge AI for fastest processing
- Integrated with Cloudflare Pages

---

## UI/UX Considerations

### Enhancement Toggle

```typescript
// Let users choose enhancement level
<div className="enhancement-options">
  <label>
    <input type="radio" name="enhance" value="auto" defaultChecked />
    Auto (Recommended)
  </label>
  <label>
    <input type="radio" name="enhance" value="high" />
    High Quality (Slower)
  </label>
  <label>
    <input type="radio" name="enhance" value="none" />
    No Enhancement
  </label>
</div>
```

### Progress Indicator

```typescript
// Show enhancement progress
{enhancing && (
  <div className="enhancement-progress">
    <div className="spinner" />
    <p>Enhancing image quality...</p>
    <p className="subtext">This improves analysis accuracy</p>
  </div>
)}
```

### Before/After Preview

```typescript
// Show enhancement result
{enhanced && (
  <div className="enhancement-preview">
    <div className="before">
      <img src={originalImage} alt="Original" />
      <span>Original</span>
    </div>
    <div className="after">
      <img src={enhancedImage} alt="Enhanced" />
      <span>Enhanced</span>
    </div>
  </div>
)}
```

---

## Performance Considerations

| Approach | Processing Time | Memory | Battery Impact |
|----------|-----------------|--------|----------------|
| OpenCV (Server) | 0.5-1s | Low | None |
| TensorFlow.js | 3-8s | High | High |
| Real-ESRGAN (Server) | 2-5s | High | None |
| Replicate API | 5-15s | None | None |

### Recommendations:
1. **Mobile**: Use server-side enhancement (save battery)
2. **Desktop**: Option for client-side (faster feedback)
3. **Low-end devices**: Always server-side

---

## Next Steps

1. **Start with OpenCV** - Immediate improvement, no cost
2. **Add client-side quick enhance** - Better UX
3. **Evaluate Real-ESRGAN** - For premium quality option
4. **Monitor user feedback** - Adjust based on needs

---

*Document created: 2026-01-28*
*Ready for implementation*
