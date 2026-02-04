// src/pages/ScanPage.tsx - Enhanced Face Scan Analysis Page
import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { initScan, uploadScanImage, getScanStatus, getScanResult } from "../services/scanApi";
import { cameraService } from "../services/cameraService";
import type { ScanResultResponse } from "../services/scanApi";
import { validateAndCropFace } from "../utils/faceValidation";
import { IconCamera, IconScan, IconUpload, IconSearch, IconCheckCircle, IconFileText, IconCheck, IconX } from '../components/Icons';
import { ErrorCard } from '../components/ErrorCard';
import ProductScannerPage from './ProductScannerPage';
import './ScanPage.css';

type UploadMode = 'camera' | 'file';
type ScanStep = 'upload' | 'scanning' | 'complete';
/** Pro restructure: unified scan tab – Face vs Product */
type ScanType = 'face' | 'product';
const ENABLE_LIVE_QUALITY_CHECKS = false;

export default function ScanPage() {
  usePageTitle('Scan', 'Scan your face or a product. AI skin analysis and product insights.');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const stableMsRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const autoCaptureRef = useRef(false);
  const trackingActiveRef = useRef(false);
  
  const [scanType, setScanType] = useState<ScanType>(() =>
    modeParam === 'product' ? 'product' : 'face'
  );
  useEffect(() => {
    if (modeParam === 'product' && scanType !== 'product') setScanType('product');
    if (modeParam === 'face' && scanType !== 'face') setScanType('face');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync URL to state only
  }, [modeParam]);
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<ScanStep>('upload');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing scan...");
  const [result, setResult] = useState<ScanResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [faceLocked, setFaceLocked] = useState(false);
  const [autoCaptureEnabled] = useState(true);
  const [cameraStatus, setCameraStatus] = useState("Position your face in the frame");
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [capturePreviewUrl, setCapturePreviewUrl] = useState<string | null>(null);
  const [trackingRestartTick, setTrackingRestartTick] = useState(0);
  const lastStatusRef = useRef("");
  const lastCountdownRef = useRef<number | null>(null);
  const capturePreviewRef = useRef<string | null>(null);
  const qualityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qualityStateRef = useRef({
    lastCheck: 0,
    ok: true,
    reason: "",
    goodStreak: 0,
    badStreak: 0,
  });
  // const [faceDetected, setFaceDetected] = useState(false); // Reserved for future face detection feature

  const setCapturePreview = useCallback((url: string | null) => {
    if (capturePreviewRef.current) {
      URL.revokeObjectURL(capturePreviewRef.current);
      capturePreviewRef.current = null;
    }
    if (url) {
      capturePreviewRef.current = url;
    }
    setCapturePreviewUrl(url);
  }, []);

  useEffect(() => {
    return () => {
      if (capturePreviewRef.current) {
        URL.revokeObjectURL(capturePreviewRef.current);
        capturePreviewRef.current = null;
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      if (!videoRef.current) return;
      await cameraService.initializeCamera(videoRef.current);
      setCameraActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera access denied. Please use file upload instead.");
      setUploadMode('file');
    }
  };

  const stopCamera = useCallback(() => {
    cameraService.stopCamera();
    setCameraActive(false);
    // setFaceDetected(false); // Reserved for future face detection feature
  }, []);

  const getFriendlyError = useCallback((code: string) => {
    switch (code) {
      case "no_face":
        return "No face found. Please upload a clear selfie with your full face visible.";
      case "multiple_faces":
        return "Multiple faces detected. Please upload a photo with only your face.";
      case "face_too_small":
        return "Face too small in the photo. Move closer so your face fills most of the frame.";
      case "face_off_center":
        return "Face is off-center. Please align your face within the guide.";
      case "face_angle":
        return "Face turned too much. Look straight at the camera and try again.";
      case "landmarks_missing":
        return "We couldn't detect facial landmarks. Try better lighting and a front-facing pose.";
      case "image_blurry":
        return "Image is blurry. Hold still and keep the camera steady.";
      case "lighting_low":
        return "Lighting is too low. Move to brighter light.";
      case "lighting_high":
        return "Lighting is too harsh. Avoid glare or backlight.";
      case "low_contrast":
        return "Lighting is flat. Use more even, brighter light.";
      default:
        return "We couldn't validate this photo. Please try another clear selfie.";
    }
  }, []);

  const handleValidatedFile = useCallback(async (selectedFile: File) => {
    setValidating(true);
    setValidationMessage("Validating selfie...");
    setFaceLocked(false);
    setError(null);
    setResult(null);

    try {
      const { croppedBlob, previewUrl: croppedPreview } = await validateAndCropFace(selectedFile);
      const croppedFile = new File([croppedBlob], "face-crop.png", { type: "image/png" });
      setFile(croppedFile);
      setPreviewUrl(croppedPreview);
      setScanStep("upload");
      setValidationMessage("Selfie validated.");
      setFaceLocked(true);
    } catch (err) {
      const message =
        err instanceof Error ? getFriendlyError(err.message) : "Unable to validate the selfie.";
      setError(message);
      setFile(null);
      setPreviewUrl(null);
      setFaceLocked(false);
    } finally {
      setValidating(false);
      setTimeout(() => setValidationMessage(null), 2000);
    }
  }, [getFriendlyError]);

  const stopFaceTracking = useCallback(() => {
    trackingActiveRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext("2d");
      ctx?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    stableMsRef.current = 0;
    autoCaptureRef.current = false;
  }, []);

  const initFaceLandmarker = useCallback(async () => {
    if (landmarkerRef.current) {
      return landmarkerRef.current;
    }
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    });
    return landmarkerRef.current;
  }, []);

  // Initialize camera when camera mode is selected
  useEffect(() => {
    if (uploadMode === 'camera' && videoRef.current && !cameraActive) {
      initializeCamera();
    } else if (uploadMode === 'file' && cameraActive) {
      stopCamera();
    }

    return () => {
      if (uploadMode === 'file' && cameraActive) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadMode]);

  /* Release camera when leaving the page (e.g. navigate away) */
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const handleCapturedFile = useCallback(
    async (selectedFile: File, rawPreviewUrl: string) => {
      setValidating(true);
      setValidationMessage("Validating selfie...");
      setFaceLocked(false);
      setError(null);
      setResult(null);
      setCameraStatus("Validating selfie...");
      setCameraCountdown(null);
      setCapturePreview(rawPreviewUrl);

      try {
        const { croppedBlob, previewUrl: croppedPreview } = await validateAndCropFace(selectedFile);
        const croppedFile = new File([croppedBlob], "face-crop.png", { type: "image/png" });
        setFile(croppedFile);
        setPreviewUrl(croppedPreview);
        setScanStep("upload");
        setValidationMessage("Selfie validated.");
        setFaceLocked(true);
        setCapturePreview(null);
        stopFaceTracking();
        stopCamera();
        setUploadMode("file");
      } catch (err) {
        const message =
          err instanceof Error ? getFriendlyError(err.message) : "Unable to validate the selfie.";
        setError(message);
        setCameraStatus(message);
        autoCaptureRef.current = false;
        stableMsRef.current = 0;
        setTimeout(() => {
          setCapturePreview(null);
          setTrackingRestartTick((value) => value + 1);
        }, 1200);
      } finally {
        setValidating(false);
        setTimeout(() => setValidationMessage(null), 2000);
      }
    },
    [getFriendlyError, setCapturePreview, stopCamera, stopFaceTracking]
  );

  const captureFromVideo = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || validating) return;
    try {
      stopFaceTracking();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          const previewUrl = URL.createObjectURL(blob);
          await handleCapturedFile(file, previewUrl);
        }
      }, "image/jpeg", 0.95);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture image");
    }
  }, [handleCapturedFile, stopFaceTracking, validating]);

  const checkFrameQuality = useCallback((video: HTMLVideoElement) => {
    const canvas = qualityCanvasRef.current ?? document.createElement("canvas");
    if (!qualityCanvasRef.current) {
      qualityCanvasRef.current = canvas;
    }
    const maxSide = 160;
    const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: true, reason: "" };
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let sum = 0;
    let sumSq = 0;
    const gray = new Float32Array(width * height);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const value = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[j] = value;
      sum += value;
      sumSq += value * value;
    }

    const count = gray.length;
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    const stdDev = Math.sqrt(Math.max(0, variance));

    if (mean < 80) {
      return { ok: false, reason: "lighting_low" };
    }
    if (mean > 210) {
      return { ok: false, reason: "lighting_high" };
    }
    if (stdDev < 28) {
      return { ok: false, reason: "low_contrast" };
    }

    let laplacianSum = 0;
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = y * width + x;
        const center = gray[idx];
        const laplacian =
          4 * center -
          gray[idx - 1] -
          gray[idx + 1] -
          gray[idx - width] -
          gray[idx + width];
        laplacianSum += Math.abs(laplacian);
      }
    }

    const laplacianAvg = laplacianSum / count;
    if (laplacianAvg < 18) {
      return { ok: false, reason: "image_blurry" };
    }

    return { ok: true, reason: "" };
  }, []);

  const startFaceTracking = useCallback(async () => {
    if (!videoRef.current || !overlayCanvasRef.current || trackingActiveRef.current) return;
    const landmarker = await initFaceLandmarker();
    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;

    trackingActiveRef.current = true;
    stableMsRef.current = 0;
    autoCaptureRef.current = false;
    lastTimeRef.current = performance.now();

    const REQUIRED_STABLE_MS = 10000;
    const ROI = { xMin: 0.15, xMax: 0.85, yMin: 0.15, yMax: 0.85 };
    const MIN_FACE_RATIO = 0.22;
    const MAX_FACE_RATIO = 0.9;
    const TILT_DEG_MAX = 15;
    const YAW_RATIO_MAX = 0.18;
    const render = () => {
      if (!trackingActiveRef.current || !videoRef.current || !overlayCanvasRef.current) {
        return;
      }
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (overlayCanvas.width !== video.videoWidth || overlayCanvas.height !== video.videoHeight) {
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
      }

      const results = landmarker.detectForVideo(video, now);
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      let isOptimal = false;
      let statusText = "No face detected";
      if (results.faceLandmarks && results.faceLandmarks.length === 1) {
        statusText = "Align your face in the oval";
        const lm = results.faceLandmarks[0];
        const xs = lm.map((p) => p.x);
        const ys = lm.map((p) => p.y);
        const minX = Math.min(...xs) * overlayCanvas.width;
        const maxX = Math.max(...xs) * overlayCanvas.width;
        const minY = Math.min(...ys) * overlayCanvas.height;
        const maxY = Math.max(...ys) * overlayCanvas.height;

        const boxHeight = maxY - minY;

        const roi = {
          xMin: overlayCanvas.width * ROI.xMin,
          xMax: overlayCanvas.width * ROI.xMax,
          yMin: overlayCanvas.height * ROI.yMin,
          yMax: overlayCanvas.height * ROI.yMax,
        };

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centered =
          centerX > roi.xMin &&
          centerX < roi.xMax &&
          centerY > roi.yMin &&
          centerY < roi.yMax;
        const bigEnough = boxHeight > overlayCanvas.height * MIN_FACE_RATIO;
        const tooClose = boxHeight > overlayCanvas.height * MAX_FACE_RATIO;

        const leftEye = lm[33];
        const rightEye = lm[263];
        const noseTip = lm[1];
        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const rollRad = Math.atan2(dy, dx);
        const rollDeg = (rollRad * 180) / Math.PI;
        const smallTilt = Math.abs(rollDeg) < TILT_DEG_MAX;

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeDistance = Math.max(0.0001, Math.abs(rightEye.x - leftEye.x));
        const yawRatio = (noseTip.x - eyeCenterX) / eyeDistance;
        const smallYaw = Math.abs(yawRatio) < YAW_RATIO_MAX;

        if (ENABLE_LIVE_QUALITY_CHECKS) {
          const qualityNow = performance.now();
          if (qualityNow - qualityStateRef.current.lastCheck > 450) {
            const quality = checkFrameQuality(video);
            let { ok, reason, goodStreak, badStreak } = qualityStateRef.current;

            if (quality.ok) {
              goodStreak += 1;
              badStreak = 0;
              if (!ok && goodStreak >= 2) {
                ok = true;
                reason = "";
              }
            } else {
              badStreak += 1;
              goodStreak = 0;
              reason = quality.reason;
              if (ok && badStreak >= 2) {
                ok = false;
              }
            }

            qualityStateRef.current = {
              lastCheck: qualityNow,
              ok,
              reason,
              goodStreak,
              badStreak,
            };
          }

          if (!qualityStateRef.current.ok) {
            statusText = getFriendlyError(qualityStateRef.current.reason);
            isOptimal = false;
          }
        } else {
          qualityStateRef.current.ok = true;
          qualityStateRef.current.reason = "";
        }

        if (!ENABLE_LIVE_QUALITY_CHECKS || qualityStateRef.current.ok) {
          if (!bigEnough) {
          statusText = "Move closer to the camera";
        } else if (tooClose) {
          statusText = "Move back slightly";
        } else if (!centered) {
          statusText = "Center your face in the oval";
        } else if (!smallTilt) {
          statusText = "Hold straight - reduce tilt";
        } else if (!smallYaw) {
          statusText = "Look straight at the camera";
        } else {
          isOptimal = true;
          statusText = "Hold still...";
        }
        }
      } else if (results.faceLandmarks && results.faceLandmarks.length > 1) {
        statusText = "Only one face in frame";
      }

      if (isOptimal) {
        stableMsRef.current += dt;
      } else {
        stableMsRef.current = 0;
      }

      // We keep the existing HUD/oval overlay (CSS) and only use the canvas
      // for future drawing to avoid visual overlap.
      let remainingSeconds: number | null = null;
      if (stableMsRef.current > 0) {
        remainingSeconds = Math.max(
          0,
          Math.ceil((REQUIRED_STABLE_MS - stableMsRef.current) / 1000)
        );
      }

      if (statusText !== lastStatusRef.current) {
        lastStatusRef.current = statusText;
        setCameraStatus(statusText);
      }
      if (remainingSeconds !== lastCountdownRef.current) {
        lastCountdownRef.current = remainingSeconds;
        setCameraCountdown(remainingSeconds);
      }

      if (
        autoCaptureEnabled &&
        stableMsRef.current >= REQUIRED_STABLE_MS &&
        !autoCaptureRef.current
      ) {
        autoCaptureRef.current = true;
        void captureFromVideo();
      } else if (trackingActiveRef.current) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    rafRef.current = requestAnimationFrame(render);
  }, [autoCaptureEnabled, captureFromVideo, checkFrameQuality, getFriendlyError, initFaceLandmarker]);

  useEffect(() => {
    if (uploadMode !== "camera" || !cameraActive) {
      stopFaceTracking();
      return;
    }
    if (videoRef.current?.readyState && videoRef.current.readyState >= 2) {
      void startFaceTracking();
    }
  }, [cameraActive, startFaceTracking, stopFaceTracking, trackingRestartTick, uploadMode]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleValidatedFile(selectedFile);
      }
    },
    [handleValidatedFile]
  );

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      stopFaceTracking();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          await handleCapturedFile(file, previewUrl);
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture image");
    }
  };

  const handleScan = async () => {
    if (!file || validating) return;
    
    setScanning(true);
    setScanStep('scanning');
    setError(null);
    setProgress(0);
    setStatusMessage("Initializing scan...");
    
    try {
      setProgress(10);
      setStatusMessage("Creating scan session...");
      const initResponse = await initScan();
      const sessionId = initResponse.session_id ?? initResponse.scan_id;
      if (!sessionId) {
        throw new Error("Scan initialization did not return a session id");
      }
      
      setProgress(30);
      setStatusMessage("Uploading image...");
      await uploadScanImage(sessionId, file);
      
      setProgress(50);
      setStatusMessage("Analyzing your skin...");
      
      // Poll for results with progress updates
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        const status = await getScanStatus(sessionId);
        
        if (status.status === "completed") {
          setProgress(90);
          setStatusMessage("Finalizing results...");
          const scanResult = await getScanResult(sessionId);
          setResult(scanResult);
          setProgress(100);
          setScanStep('complete');
          
          // Navigate to results page if analysis ID is available
          if (scanResult.analysis_id || scanResult.session_id) {
            setTimeout(() => {
              navigate(`/analysis/${scanResult.analysis_id || scanResult.session_id}`);
            }, 1500);
          }
          break;
        } else if (status.status === "failed") {
          throw new Error(status.message || "Scan failed");
        } else if (status.status === "processing") {
          const baseProgress = 50;
          const progressIncrement = 40 / maxAttempts;
          setProgress(Math.min(baseProgress + (attempts * progressIncrement), 85));
          setStatusMessage(status.message || "Processing your image...");
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error("Scan timeout - please try again");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setScanStep('upload');
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
    setScanStep('upload');
    setProgress(0);
    setStatusMessage("Initializing scan...");
    setError(null);
    setFaceLocked(false);
    setCapturePreview(null);
    stopFaceTracking();
    if (cameraActive) {
      stopCamera();
    }
  };

  return (
    <div className="scan-page app-page">
      <main className="scan-container app-page-content">
        <div className="scan-content">
          {/* Unified Scan: Face vs Product toggle (Pro restructure) */}
          <div className="scan-type-toggle" role="tablist" aria-label="Scan type">
            <button
              type="button"
              role="tab"
              aria-selected={scanType === 'face'}
              className={`scan-type-tab ${scanType === 'face' ? 'active' : ''}`}
              onClick={() => { setScanType('face'); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('mode'); return next; }); }}
            >
              <span className="scan-type-emoji" aria-hidden>😊</span> Face
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scanType === 'product'}
              className={`scan-type-tab ${scanType === 'product' ? 'active' : ''}`}
              onClick={() => { setScanType('product'); setSearchParams({ mode: 'product' }); }}
            >
              <span className="scan-type-emoji" aria-hidden>📦</span> Product
            </button>
          </div>

          {scanType === 'product' ? (
            <div className="scan-product-panel">
              <ProductScannerPage embedded />
            </div>
          ) : (
            <>
          <div className="scan-header">
            <h1 className="scan-title">
              AI Face Scan Analysis<br />
              <span className="gradient-text">From a Single Photo</span>
            </h1>
            <p className="scan-subtitle">
              Get instant AI-powered insights on your skin health from a single photo
            </p>
            {/* Step titles and descriptions (Task 214) */}
            {scanStep === 'upload' && (
              <div className="scan-step-desc" role="status">
                <h2 className="scan-step-title">Step 1: Add your photo</h2>
                <p className="scan-step-text">Upload a clear selfie or use the camera. Face the light for best results.</p>
              </div>
            )}
            {scanStep === 'scanning' && (
              <div className="scan-step-desc" role="status">
                <h2 className="scan-step-title">Step 2: Analyzing</h2>
                <p className="scan-step-text">Hold on — we&apos;re analyzing your skin. This usually takes 30–60 seconds.</p>
              </div>
            )}
            {scanStep === 'complete' && (
              <div className="scan-step-desc" role="status">
                <h2 className="scan-step-title">Step 3: Results</h2>
                <p className="scan-step-text">Your report is ready. Opening your results now.</p>
              </div>
            )}
          </div>

          {/* Legal disclaimer (Tasks 245, 246) */}
          <p className="scan-legal-disclaimer" role="note">
            This tool is for informational use only and is not a medical device. It does not replace professional dermatological advice.
          </p>

          {scanStep === 'upload' && (
            <div className="scan-upload-section">
              <p className="scan-tip" role="note">Tip: Face the light for best results.</p>
              {/* Mode Toggle */}
              <div className="scan-mode-toggle">
                <button
                  className={`mode-btn ${uploadMode === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadMode('file')}
                >
                  <IconUpload size={20} strokeWidth={2} className="inline-icon" />
                  Upload Photo
                </button>
                <button
                  className={`mode-btn ${uploadMode === 'camera' ? 'active' : ''}`}
                  onClick={() => setUploadMode('camera')}
                >
                  <IconCamera size={20} strokeWidth={2} className="inline-icon" />
                  Use Camera
                </button>
              </div>

              {/* Camera View */}
              {uploadMode === 'camera' && (
                <div className="scan-camera-section">
                  <div className="camera-container">
                    <video
                      ref={videoRef}
                      className={`camera-video ${capturePreviewUrl ? 'is-hidden' : ''}`}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => {
                        if (cameraActive) {
                          void startFaceTracking();
                        }
                      }}
                    />
                    {capturePreviewUrl && (
                      <img
                        className="camera-preview"
                        src={capturePreviewUrl}
                        alt="Captured preview"
                        width={400}
                        height={300}
                      />
                    )}
                    <canvas ref={overlayCanvasRef} className="camera-overlay" />
                    {!cameraActive && (
                      <div className="camera-placeholder">
                        <div className="camera-icon">
                          <IconCamera size={48} strokeWidth={2} />
                        </div>
                        <p>Allow camera access, then position your face in the frame.</p>
                      </div>
                    )}
                    {cameraActive && (
                      <div className="face-guide-overlay">
                        <div
                          className="sr-only"
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {cameraStatus}. {cameraCountdown !== null
                            ? `Hold still: ${cameraCountdown} seconds`
                            : faceLocked
                            ? "Face locked. Ready to capture."
                            : "Tracking alignment."}
                        </div>
                        <div className="scan-hud">
                          <span className="hud-corner top-left" aria-hidden="true"></span>
                          <span className="hud-corner top-right" aria-hidden="true"></span>
                          <span className="hud-corner bottom-left" aria-hidden="true"></span>
                          <span className="hud-corner bottom-right" aria-hidden="true"></span>
                        </div>
                        <div className="scan-sweep-line" aria-hidden="true"></div>
                        <div className={`face-guide-circle ${faceLocked ? "face-locked" : ""}`} aria-hidden="true"></div>
                        <div className="face-guide-text">
                          {cameraStatus}
                        </div>
                        <div className="scan-hud-status">
                          {cameraCountdown !== null
                            ? `Hold still: ${cameraCountdown}s`
                            : faceLocked
                            ? "Face locked"
                            : "Tracking alignment..."}
                        </div>
                      </div>
                    )}
                  </div>
                  {cameraActive && (
                    <button
                      onClick={captureFromCamera}
                      className="scan-btn-primary capture-btn"
                      disabled={validating}
                    >
                      <IconScan size={20} strokeWidth={2} className="inline-icon" />
                      {validating ? "Validating..." : "Capture Photo"}
                    </button>
                  )}
                  {cameraActive && false && (
                    <div className="scan-camera-status" role="status">
                      <span>{cameraStatus}</span>
                      {cameraCountdown !== null && (
                        <span className="scan-camera-countdown">
                          Hold still: {cameraCountdown}s
                        </span>
                      )}
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden-canvas" />
                </div>
              )}

              {/* File Upload */}
              {uploadMode === 'file' && (
                <div className="scan-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="scan-file-input"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="scan-upload-label">
                    {previewUrl ? (
                      <div className="preview-container">
                        <img
                          src={previewUrl}
                          alt="Upload preview"
                          className={`scan-preview ${faceLocked ? "scan-preview-locked" : ""}`}
                          width={400}
                          height={300}
                        />
                        <button
                          className="preview-remove"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                            setPreviewUrl(null);
                          }}
                          title="Remove image"
                        >
                          <IconX size={20} strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <div className="scan-upload-prompt">
                        <div className="scan-upload-icon">
                          <IconUpload size={48} strokeWidth={2} />
                        </div>
                        <div className="scan-upload-text">Click to upload or drag and drop</div>
                        <div className="scan-upload-hint">JPG, PNG, or WEBP (Max 10MB)</div>
                        <div className="scan-upload-hint">Face only: close-up selfie, centered, no group shots.</div>
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* Tips Section */}
              {!previewUrl && (
                <div className="scan-tips">
                  <h3>
                    <IconFileText size={20} strokeWidth={2} className="inline-icon" />
                    Tips for Best Results
                  </h3>
                  <ul>
                    <li>
                      <IconCheck size={16} strokeWidth={2} className="inline-icon-sm" />
                      Use good, even lighting (natural light is best)
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} className="inline-icon-sm" />
                      Remove glasses and face the camera directly
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} className="inline-icon-sm" />
                      Keep hair away from your face
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} className="inline-icon-sm" />
                      Take photo from shoulders up
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} className="inline-icon-sm" />
                      Ensure your face is in focus
                    </li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              {file && (
                <div className="scan-actions">
                  <button
                    onClick={handleScan}
                    disabled={scanning || validating}
                    className="scan-btn-primary"
                  >
                    {scanning ? "Analyzing..." : validating ? "Validating..." : (
                      <>
                        <IconSearch size={18} strokeWidth={2} className="inline-icon" />
                        Start Analysis
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetScan}
                    className="scan-btn-secondary"
                    disabled={scanning || validating}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {validationMessage && (
                <div className="scan-info">
                  <div className="info-content">{validationMessage}</div>
                </div>
              )}

              {error && (
                <ErrorCard
                  title="Scan issue"
                  message={error}
                  actionLabel="Try again"
                  onAction={() => {
                    setError(null);
                    setFile(null);
                    setPreviewUrl(null);
                    setCapturePreview(null);
                    setScanStep('upload');
                  }}
                  secondaryLabel="Use file upload"
                  onSecondary={() => {
                    setError(null);
                    setUploadMode('file');
                    stopCamera();
                  }}
                />
              )}
            </div>
          )}

          {/* Scanning Progress */}
          {scanStep === 'scanning' && (
            <div className="scan-progress-section">
              <div className="progress-container">
                <div className="progress-spinner"></div>
                <h2 className="progress-title">Analyzing Your Skin</h2>
                <p className="progress-message">{statusMessage}</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ '--progress-width': `${progress}%` } as React.CSSProperties}
                  ></div>
                </div>
                <div className="progress-percentage">{progress}%</div>
              </div>
            </div>
          )}

          {/* Results Preview */}
          {scanStep === 'complete' && result && (
            <div className="scan-results-preview app-card">
              <div className="results-success">
                <div className="success-icon">
                  <IconCheckCircle size={48} strokeWidth={2} />
                </div>
                <h2>Analysis Complete!</h2>
                <p>Your skin analysis is ready. Redirecting to results...</p>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
