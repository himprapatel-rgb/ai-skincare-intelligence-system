// src/pages/ScanPage.tsx - Enhanced Face Scan Analysis Page
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initScan, uploadScanImage, getScanStatus, getScanResult } from "../services/scanApi";
import { cameraService } from "../services/cameraService";
import type { ScanResultResponse } from "../services/scanApi";
import { IconCamera, IconScan, IconUpload, IconSearch, IconCheckCircle, IconAlertTriangle, IconFileText, IconCheck, IconX } from '../components/Icons';
import './ScanPage.css';

type UploadMode = 'camera' | 'file';
type ScanStep = 'upload' | 'scanning' | 'complete';

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  // const [faceDetected, setFaceDetected] = useState(false); // Reserved for future face detection feature

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

  const stopCamera = () => {
    cameraService.stopCamera();
    setCameraActive(false);
    // setFaceDetected(false); // Reserved for future face detection feature
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
      setScanStep('upload');
    }
  }, []);

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
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
          setFile(file);
          setPreviewUrl(canvas.toDataURL('image/jpeg'));
          stopCamera();
          setUploadMode('file');
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture image");
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
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
    if (cameraActive) {
      stopCamera();
    }
  };

  return (
    <div className="scan-page">
      <main className="scan-container">
        <div className="scan-content">
          <div className="scan-header">
            <h1 className="scan-title">
              AI Face Scan Analysis<br />
              <span className="gradient-text">From a Single Photo</span>
            </h1>
            <p className="scan-subtitle">
              Get instant AI-powered insights on your skin health from a single photo
            </p>
          </div>

          {scanStep === 'upload' && (
            <div className="scan-upload-section">
              {/* Mode Toggle */}
              <div className="scan-mode-toggle">
                <button
                  className={`mode-btn ${uploadMode === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadMode('file')}
                >
                  📁 Upload Photo
                </button>
                <button
                  className={`mode-btn ${uploadMode === 'camera' ? 'active' : ''}`}
                  onClick={() => setUploadMode('camera')}
                >
                  <IconCamera size={20} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Use Camera
                </button>
              </div>

              {/* Camera View */}
              {uploadMode === 'camera' && (
                <div className="scan-camera-section">
                  <div className="camera-container">
                    <video
                      ref={videoRef}
                      className="camera-video"
                      autoPlay
                      playsInline
                      muted
                    />
                    {!cameraActive && (
                      <div className="camera-placeholder">
                        <div className="camera-icon">
                          <IconCamera size={48} strokeWidth={2} />
                        </div>
                        <p>Initializing camera...</p>
                      </div>
                    )}
                    {cameraActive && (
                      <div className="face-guide-overlay">
                        <div className="face-guide-circle"></div>
                        <div className="face-guide-text">
                          Position your face within the circle
                        </div>
                      </div>
                    )}
                  </div>
                  {cameraActive && (
                    <button
                      onClick={captureFromCamera}
                      className="scan-btn-primary capture-btn"
                    >
                      <IconScan size={20} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Capture Photo
                    </button>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                        <img src={previewUrl} alt="Preview" className="scan-preview" />
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
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* Tips Section */}
              {!previewUrl && (
                <div className="scan-tips">
                  <h3>
                    <IconFileText size={20} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                    Tips for Best Results
                  </h3>
                  <ul>
                    <li>
                      <IconCheck size={16} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Use good, even lighting (natural light is best)
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Remove glasses and face the camera directly
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Keep hair away from your face
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Take photo from shoulders up
                    </li>
                    <li>
                      <IconCheck size={16} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
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
                    disabled={scanning}
                    className="scan-btn-primary"
                  >
                    {scanning ? "Analyzing..." : (
                      <>
                        <IconSearch size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Start Analysis
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetScan}
                    className="scan-btn-secondary"
                    disabled={scanning}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {error && (
                <div className="scan-error">
                  <div className="error-icon">
                    <IconAlertTriangle size={32} strokeWidth={2} />
                  </div>
                  <div className="error-content">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
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
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">{progress}%</div>
              </div>
            </div>
          )}

          {/* Results Preview */}
          {scanStep === 'complete' && result && (
            <div className="scan-results-preview">
              <div className="results-success">
                <div className="success-icon">
                  <IconCheckCircle size={48} strokeWidth={2} />
                </div>
                <h2>Analysis Complete!</h2>
                <p>Your skin analysis is ready. Redirecting to results...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
