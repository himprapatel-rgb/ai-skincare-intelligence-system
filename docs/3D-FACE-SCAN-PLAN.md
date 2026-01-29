# 3D Face Scan & Model Plan

## Pellicura - Advanced 3D Skin Analysis

---

## Overview

Create a 3D model of the user's face for comprehensive skin analysis from all angles, enabling:
- Full face coverage (not just front view)
- Precise skin texture mapping
- Accurate area measurement (acne coverage %, etc.)
- Before/after 3D comparison
- Virtual try-on for skincare effects

---

## Technology Options

### Option 1: iPhone LiDAR (Best for iOS)

**How it works**: iPhone 12 Pro+ and iPad Pro have built-in LiDAR sensors for depth scanning.

```
┌─────────────────────────────────────────────────────────────┐
│                    iPhone LiDAR Scanning                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   iPhone Camera + LiDAR  →  ARKit Face Tracking  →  3D Mesh │
│                                                              │
│   Accuracy: ~1mm depth                                       │
│   Speed: Real-time                                           │
│   Texture: Yes (from camera)                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Pros**:
- Built into modern iPhones
- Real-time scanning
- High accuracy
- Apple ARKit handles complexity

**Cons**:
- iOS only
- Requires native app (React Native or Swift)
- Not available on older devices

**Implementation**:
```swift
// iOS Native - ARKit Face Tracking
import ARKit

class FaceScanViewController: UIViewController, ARSessionDelegate {
    let sceneView = ARSCNView()
    
    func startScanning() {
        let configuration = ARFaceTrackingConfiguration()
        configuration.maximumNumberOfTrackedFaces = 1
        sceneView.session.run(configuration)
    }
    
    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        guard let faceAnchor = anchors.first as? ARFaceAnchor else { return }
        
        // Get 3D mesh vertices
        let geometry = faceAnchor.geometry
        let vertices = geometry.vertices  // 1220 vertices
        let textureCoords = geometry.textureCoordinates
        
        // Export mesh + texture for analysis
        exportFaceMesh(vertices: vertices, texture: captureTexture())
    }
}
```

---

### Option 2: Multi-Photo Photogrammetry (Cross-Platform)

**How it works**: User takes 5-10 photos from different angles, AI reconstructs 3D model.

```
┌─────────────────────────────────────────────────────────────┐
│                  Multi-Photo 3D Reconstruction               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Photo 1 (Front)                                            │
│   Photo 2 (Left 45°)     →  AI Photogrammetry  →  3D Model  │
│   Photo 3 (Right 45°)                                        │
│   Photo 4 (Left 90°)                                         │
│   Photo 5 (Right 90°)                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Guided Capture Flow**:
```typescript
// frontend/src/components/3DScan/GuidedCapture.tsx
const captureAngles = [
  { angle: 0, label: "Look straight ahead", icon: "→" },
  { angle: 45, label: "Turn slightly left", icon: "↖" },
  { angle: -45, label: "Turn slightly right", icon: "↗" },
  { angle: 90, label: "Turn left (profile)", icon: "←" },
  { angle: -90, label: "Turn right (profile)", icon: "→" },
  { angle: 30, label: "Tilt head up slightly", icon: "↑" },
  { angle: -30, label: "Tilt head down slightly", icon: "↓" },
];

const GuidedCapture = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<string[]>([]);

  return (
    <div className="guided-capture">
      <div className="face-guide">
        {/* Overlay showing head position guide */}
        <FacePositionGuide angle={captureAngles[currentStep].angle} />
      </div>
      
      <p className="instruction">{captureAngles[currentStep].label}</p>
      
      <button onClick={capturePhoto}>
        Capture ({currentStep + 1}/{captureAngles.length})
      </button>
      
      <div className="progress">
        {captureAngles.map((_, i) => (
          <div key={i} className={i <= currentStep ? 'done' : ''} />
        ))}
      </div>
    </div>
  );
};
```

**Backend Processing**:
```python
# backend/services/photogrammetry.py
import cv2
import numpy as np
from scipy.spatial import Delaunay

class PhotogrammetryService:
    """Reconstruct 3D face from multiple photos."""
    
    def __init__(self):
        self.face_detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.landmark_detector = dlib.shape_predictor(
            "models/shape_predictor_68_face_landmarks.dat"
        )
    
    def reconstruct_3d(self, images: list[bytes]) -> dict:
        """
        Reconstruct 3D face model from multiple angle photos.
        
        Returns:
            vertices: 3D point cloud
            faces: Triangle mesh
            texture: UV-mapped texture
            skin_map: Skin analysis per region
        """
        # 1. Detect face landmarks in each image
        all_landmarks = []
        for img_bytes in images:
            landmarks = self.detect_landmarks(img_bytes)
            all_landmarks.append(landmarks)
        
        # 2. Estimate camera poses
        poses = self.estimate_camera_poses(all_landmarks)
        
        # 3. Triangulate 3D points
        points_3d = self.triangulate_points(all_landmarks, poses)
        
        # 4. Create mesh
        mesh = self.create_mesh(points_3d)
        
        # 5. Project texture
        texture = self.project_texture(mesh, images, poses)
        
        return {
            "vertices": points_3d.tolist(),
            "faces": mesh.tolist(),
            "texture": texture,
            "regions": self.analyze_regions(mesh, texture)
        }
    
    def analyze_regions(self, mesh, texture) -> dict:
        """Analyze skin by face region."""
        regions = {
            "forehead": {"area": 0, "concerns": []},
            "left_cheek": {"area": 0, "concerns": []},
            "right_cheek": {"area": 0, "concerns": []},
            "nose": {"area": 0, "concerns": []},
            "chin": {"area": 0, "concerns": []},
            "jawline_left": {"area": 0, "concerns": []},
            "jawline_right": {"area": 0, "concerns": []},
        }
        # Analyze each region...
        return regions
```

---

### Option 3: Neural Radiance Fields (NeRF) - Cutting Edge

**How it works**: AI creates photorealistic 3D model from video or photos using neural networks.

```
┌─────────────────────────────────────────────────────────────┐
│                    NeRF 3D Reconstruction                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User rotates face slowly (5-10 second video)               │
│                         │                                    │
│                         ▼                                    │
│   Extract 30-60 frames from video                            │
│                         │                                    │
│                         ▼                                    │
│   NeRF neural network training (2-5 minutes on GPU)          │
│                         │                                    │
│                         ▼                                    │
│   Photorealistic 3D model with any viewing angle             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Benefits**:
- Highest quality 3D reconstruction
- Works from video (easier for users)
- Can render any angle after processing
- Captures fine skin texture

**Challenges**:
- Requires GPU processing (cloud)
- 2-5 minute processing time
- Higher cost per scan

**Using Instant-NGP (NVIDIA)**:
```python
# backend/services/nerf_reconstruction.py
import subprocess
import json

class NeRFService:
    """3D face reconstruction using Instant-NGP."""
    
    def reconstruct_from_video(self, video_path: str) -> dict:
        # 1. Extract frames
        frames_dir = self.extract_frames(video_path)
        
        # 2. Run COLMAP for camera poses
        self.run_colmap(frames_dir)
        
        # 3. Train NeRF model
        model_path = self.train_nerf(frames_dir)
        
        # 4. Export mesh
        mesh = self.export_mesh(model_path)
        
        return mesh
    
    def train_nerf(self, frames_dir: str) -> str:
        """Train Instant-NGP model."""
        subprocess.run([
            "python", "instant-ngp/scripts/run.py",
            "--scene", frames_dir,
            "--n_steps", "5000",  # Quick training
            "--save_mesh", "output/face.obj"
        ])
        return "output/face.obj"
```

---

### Option 4: MediaPipe Face Mesh (Available Now!)

**How it works**: MediaPipe already provides 468-point 3D face mesh in real-time.

```
┌─────────────────────────────────────────────────────────────┐
│              MediaPipe Face Mesh (Current Tech)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Already integrated in Pellicura!                           │
│                                                              │
│   Features:                                                  │
│   • 468 3D landmarks                                         │
│   • Real-time (30+ FPS)                                      │
│   • Works in browser (TensorFlow.js)                         │
│   • Depth estimation included                                │
│                                                              │
│   Limitations:                                               │
│   • Landmarks only (not full mesh)                           │
│   • No texture mapping                                       │
│   • Single angle at a time                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Enhanced Implementation**:
```typescript
// frontend/src/services/faceMesh3D.ts
import { FaceMesh } from '@mediapipe/face_mesh';
import * as THREE from 'three';

class Face3DScanner {
  private faceMesh: FaceMesh;
  private captures: { landmarks: number[][], image: string }[] = [];

  async captureAngle(video: HTMLVideoElement, angle: string) {
    const results = await this.faceMesh.send({ image: video });
    
    if (results.multiFaceLandmarks?.[0]) {
      const landmarks = results.multiFaceLandmarks[0].map(l => [l.x, l.y, l.z]);
      const image = this.captureFrame(video);
      
      this.captures.push({ landmarks, image, angle });
    }
  }

  createMerged3DModel(): THREE.Mesh {
    // Merge landmarks from multiple angles
    const mergedPoints = this.mergeCaptures(this.captures);
    
    // Create Three.js mesh
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', 
      new THREE.Float32BufferAttribute(mergedPoints.flat(), 3)
    );
    
    // Add faces (triangulation)
    const indices = this.triangulateFace(mergedPoints);
    geometry.setIndex(indices);
    
    // Create material with skin texture
    const texture = this.createTextureAtlas(this.captures);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    
    return new THREE.Mesh(geometry, material);
  }
}
```

---

## Recommended Implementation Path

### Phase 1: Enhanced MediaPipe (2-3 weeks)
**Already have MediaPipe - enhance it!**

1. Multi-angle capture with guided UI
2. Merge 468-point landmarks from different angles
3. Create simple 3D visualization
4. Region-based analysis (forehead, cheeks, etc.)

### Phase 2: Web-Based Photogrammetry (1 month)
1. 5-photo guided capture
2. Server-side 3D reconstruction
3. Texture mapping
4. 3D viewer in browser (Three.js)

### Phase 3: iOS LiDAR (2 months)
1. React Native app with ARKit
2. High-precision face scanning
3. Export mesh + texture
4. Premium feature for iPhone Pro users

### Phase 4: NeRF (3+ months)
1. Video-based capture
2. Cloud GPU processing
3. Photorealistic 3D models
4. Before/after 3D comparison

---

## 3D Viewer Component

```typescript
// frontend/src/components/3DFaceViewer.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

interface FaceViewerProps {
  modelUrl: string;
  skinAnalysis: {
    regions: { [key: string]: { score: number; concerns: string[] } };
  };
}

const FaceModel = ({ modelUrl, skinAnalysis }) => {
  const { scene } = useGLTF(modelUrl);
  
  // Highlight problem areas
  scene.traverse((child) => {
    if (child.isMesh && child.name in skinAnalysis.regions) {
      const region = skinAnalysis.regions[child.name];
      if (region.concerns.length > 0) {
        // Highlight with color overlay
        child.material = child.material.clone();
        child.material.emissive.setHex(0xff6b6b);
        child.material.emissiveIntensity = 0.3;
      }
    }
  });
  
  return <primitive object={scene} />;
};

export const FaceViewer3D: React.FC<FaceViewerProps> = ({ modelUrl, skinAnalysis }) => {
  return (
    <div className="face-viewer-3d">
      <Canvas camera={{ position: [0, 0, 2] }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} />
        <FaceModel modelUrl={modelUrl} skinAnalysis={skinAnalysis} />
        <OrbitControls 
          enableZoom={true}
          maxDistance={5}
          minDistance={1}
        />
      </Canvas>
      
      <div className="region-legend">
        {Object.entries(skinAnalysis.regions).map(([region, data]) => (
          <div key={region} className="region-item">
            <span className="region-name">{region}</span>
            <span className="region-score">{data.score}/100</span>
            {data.concerns.map(c => (
              <span key={c} className="concern-tag">{c}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Data Structure

```typescript
// types/3dScan.ts
interface Face3DScan {
  id: string;
  userId: string;
  createdAt: string;
  
  // 3D Model
  mesh: {
    vertices: number[][];  // [x, y, z] for each vertex
    faces: number[][];     // Triangle indices
    uvCoords: number[][];  // Texture coordinates
  };
  
  // Texture
  texture: {
    url: string;           // Cloudinary URL
    resolution: [number, number];
  };
  
  // Analysis per region
  regions: {
    forehead: RegionAnalysis;
    leftCheek: RegionAnalysis;
    rightCheek: RegionAnalysis;
    nose: RegionAnalysis;
    chin: RegionAnalysis;
    jawlineLeft: RegionAnalysis;
    jawlineRight: RegionAnalysis;
    templeLeft: RegionAnalysis;
    templeRight: RegionAnalysis;
  };
  
  // Overall scores
  overallScore: number;
  textureScore: number;
  symmetryScore: number;
  
  // Concerns with location
  concerns: {
    type: string;          // "acne", "wrinkles", etc.
    severity: number;
    location: [number, number, number];  // 3D coordinate
    region: string;
  }[];
}

interface RegionAnalysis {
  area: number;            // Square cm
  score: number;           // 0-100
  texture: number;         // Texture score
  hydration: number;       // Estimated hydration
  concerns: string[];      // ["mild_acne", "slight_redness"]
  poreSize: "small" | "medium" | "large";
}
```

---

## Benefits of 3D Analysis

| Metric | 2D (Current) | 3D (Enhanced) |
|--------|--------------|---------------|
| Face coverage | 40-60% | 95-100% |
| Accuracy | Good | Excellent |
| Hidden areas (jawline, temples) | ❌ Missed | ✅ Captured |
| Measurement precision | Estimate | Exact (mm) |
| Before/after comparison | 2D overlay | 3D morph |
| User experience | Single photo | Interactive 3D |

---

## Cost Estimates

| Approach | Development | Infra Cost |
|----------|-------------|------------|
| Enhanced MediaPipe | 2-3 weeks | Free |
| Photogrammetry | 1 month | $50/mo (GPU) |
| iOS LiDAR | 2 months | Free (on-device) |
| NeRF | 3 months | $200/mo (GPU) |

---

## Add to Future Tasks

```markdown
| # | Task | Priority | Effort |
|---|------|----------|--------|
| F46 | Enhanced MediaPipe multi-angle capture | 🟠 P1 | 2 weeks |
| F47 | 3D Face Viewer (Three.js) | 🟠 P1 | 1 week |
| F48 | Region-based skin analysis | 🟡 P2 | 2 weeks |
| F49 | Photogrammetry 3D reconstruction | 🟢 P3 | 1 month |
| F50 | iOS LiDAR integration (React Native) | 🔵 P4 | 2 months |
| F51 | NeRF video-based 3D scanning | 🔵 P4 | 3 months |
| F52 | 3D Before/After comparison | 🟢 P3 | 2 weeks |
```

---

## Quick Win: Multi-Angle Capture

Start with guided multi-angle capture using existing MediaPipe:

```typescript
// Capture 5 angles with guidance
const angles = [
  "front",      // Current
  "left-45",    // New
  "right-45",   // New
  "left-90",    // New (profile)
  "right-90"    // New (profile)
];

// Merge analysis from all angles
const fullFaceAnalysis = mergeAnalyses(angleResults);
```

This gives 95%+ face coverage without complex 3D reconstruction!

---

*Document created: 2026-01-28*
*Ready for implementation after Cloudflare migration*
