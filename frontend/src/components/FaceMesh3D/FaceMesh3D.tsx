/**
 * 3D face mesh view – mobile & tablet only.
 * Renders 468 MediaPipe face landmarks as a 3D mesh (tesselation) and point cloud using Three.js.
 * Uses FaceLandmarker.FACE_LANDMARKS_TESSELATION from the app's available landmarks.
 * Call updateLandmarks() each frame with faceLandmarks[0] from Face Landmarker.
 */
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { FaceLandmarker } from '@mediapipe/tasks-vision';

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

/** Landmark index → 3D position. */
function landmarkTo3D(p: FaceLandmarkPoint, scale: number, scaleZ: number): [number, number, number] {
  const x = (p.x - 0.5) * -1 * scale;
  const y = (p.y - 0.5) * scale;
  const z = (p.z ?? 0) * -scaleZ;
  return [x, y, z];
}

const SCALE = 2.2;
const SCALE_Z = 2;

const FaceMesh3D = forwardRef<FaceMesh3DHandle, FaceMesh3DProps>(function FaceMesh3D(
  { width, height, className = '' },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const meshRef = useRef<THREE.LineSegments | null>(null);
  const connectionsRef = useRef<{ start: number; end: number }[]>([]);

  const initThree = useCallback(() => {
    if (!containerRef.current || width < 1 || height < 1) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 10);
    camera.position.set(0, 0, 2.2);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, -1, 0); /* flip view: eyes up, mouth down */
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shared positions for both points and mesh (468 vertices)
    const positions = new Float32Array(468 * 3);
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    pointGeometry.setDrawRange(0, 0);

    const pointMaterial = new THREE.PointsMaterial({
      size: 0.008,
      color: 0x60a5fa,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    });
    const points = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(points);
    pointsRef.current = points;

    // Mesh from MediaPipe FACE_LANDMARKS_TESSELATION (connections available in app)
    const connections =
      (typeof FaceLandmarker !== 'undefined' && FaceLandmarker.FACE_LANDMARKS_TESSELATION) || [];
    connectionsRef.current = connections;

    if (connections.length > 0) {
      const meshGeometry = new THREE.BufferGeometry();
      const meshPositions = new Float32Array(468 * 3);
      meshGeometry.setAttribute('position', new THREE.BufferAttribute(meshPositions, 3));
      const indexArr: number[] = [];
      for (const c of connections) {
        // MediaPipe Connection: { start, end } landmark indices (0–467)
        if (c.start >= 0 && c.start < 468 && c.end >= 0 && c.end < 468) {
          indexArr.push(c.start, c.end);
        }
      }
      meshGeometry.setIndex(indexArr);
      meshGeometry.setDrawRange(0, indexArr.length);

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.85,
        linewidth: 1,
      });
      const mesh = new THREE.LineSegments(meshGeometry, lineMaterial);
      scene.add(mesh);
      meshRef.current = mesh;
    }
  }, [width, height]);

  useEffect(() => {
    const containerEl = containerRef.current;
    initThree();
    return () => {
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
        (pointsRef.current.material as THREE.Material).dispose();
      }
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        (meshRef.current.material as THREE.Material).dispose();
      }
      if (rendererRef.current && containerEl?.contains(rendererRef.current.domElement)) {
        rendererRef.current.dispose();
        containerEl.removeChild(rendererRef.current.domElement);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      pointsRef.current = null;
      meshRef.current = null;
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
        for (let i = 0; i < 468; i++) {
          const [x, y, z] = landmarkTo3D(landmarks[i], SCALE, SCALE_Z);
          pos[i * 3] = x;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = z;
        }
        pointsRef.current.geometry.getAttribute('position').needsUpdate = true;
        pointsRef.current.geometry.setDrawRange(0, 468);

        const mesh = meshRef.current;
        if (mesh && connectionsRef.current.length > 0) {
          const meshPos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          const meshArr = meshPos.array as Float32Array;
          meshArr.set(pos);
          meshPos.needsUpdate = true;
          mesh.geometry.setDrawRange(0, connectionsRef.current.length * 2);
        }

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
