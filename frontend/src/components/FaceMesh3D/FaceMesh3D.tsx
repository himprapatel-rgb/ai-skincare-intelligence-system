/**
 * 3D face mesh view – mobile & tablet only.
 * Renders 468 MediaPipe face landmarks as a 3D point cloud (or mesh) using Three.js.
 * Call updateLandmarks() each frame with faceLandmarks[0] from Face Landmarker.
 */
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';

export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface FaceMesh3DHandle {
  updateLandmarks(landmarks: FaceLandmarkPoint[]): void;
}

interface FaceMesh3DProps {
  width: number;
  height: number;
  className?: string;
}

const FaceMesh3D = forwardRef<FaceMesh3DHandle, FaceMesh3DProps>(function FaceMesh3D(
  { width, height, className = '' },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const rafRef = useRef<number | null>(null);

  const initThree = useCallback(() => {
    if (!containerRef.current || width < 1 || height < 1) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 10);
    camera.position.set(0, 0, 2.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initial empty geometry (468 points)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(468 * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.PointsMaterial({
      size: 0.012,
      color: 0x60a5fa,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.92,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;
  }, [width, height]);

  useEffect(() => {
    initThree();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
        (pointsRef.current.material as THREE.Material).dispose();
      }
      if (rendererRef.current && containerRef.current?.contains(rendererRef.current.domElement)) {
        rendererRef.current.dispose();
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      pointsRef.current = null;
    };
  }, [initThree]);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [width, height]);

  useImperativeHandle(
    ref,
    () => ({
      updateLandmarks(landmarks: FaceLandmarkPoint[]) {
        if (!pointsRef.current || landmarks.length < 468) return;

        const pos = (pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute)
          .array as Float32Array;
        // MediaPipe: x,y normalized [0,1] (origin top-left, y down). Z = depth (negative = toward camera).
        // Scale so full face fills view; flip Y so forehead is up (image y=0 = top = 3D +Y).
        const scale = 2.2;
        const scaleZ = 2;
        for (let i = 0; i < 468; i++) {
          const p = landmarks[i];
          const x = (p.x - 0.5) * -1 * scale; // center + mirror for front-cam
          const y = (0.5 - p.y) * scale;      // flip Y so face right-side up
          const z = (p.z ?? 0) * -scaleZ;      // nose forward (positive Z toward camera)
          pos[i * 3] = x;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = z;
        }
        pointsRef.current.geometry.getAttribute('position').needsUpdate = true;
        pointsRef.current.geometry.setDrawRange(0, 468);

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      },
    }),
    []
  );

  return <div ref={containerRef} className={className} style={{ width, height }} aria-hidden />;
});

export default FaceMesh3D;
