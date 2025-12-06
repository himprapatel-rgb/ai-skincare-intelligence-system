import React, { useRef, useEffect, useState } from 'react';
import { cameraService } from '../services/cameraService';

/**
 * Camera Component Props
 */
interface CameraProps {
  onCapture: (imageBlob: Blob) => Promise<void>;
  onError: (error: string) => void;
  isProcessing: boolean;
}

/**
 * Camera Component
 * Handles webcam initialization, preview, and image capture
 */
export const Camera: React.FC<CameraProps> = ({ onCapture, onError, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Initialize camera on mount
   */
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        if (!videoRef.current) return;

        await cameraService.initializeCamera(videoRef.current);
        
        if (mounted) {
          setIsCameraReady(true);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
          onError(errorMessage);
        }
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      mounted = false;
      cameraService.stopCamera();
    };
  }, [onError]);

  /**
   * Handle capture button click
   */
  const handleCapture = async (): Promise<void> => {
    if (!isCameraReady || isProcessing || isCapturing) return;

    setIsCapturing(true);

    try {
      const imageBlob = await cameraService.captureImage();
      await onCapture(imageBlob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture image';
      onError(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="camera">
      <div className="camera__preview-container">
        <video
          ref={videoRef}
          className="camera__video"
          autoPlay
          playsInline
          muted
        />
        
        {!isCameraReady && (
          <div className="camera__loading">
            <p>Initializing camera...</p>
          </div>
        )}
      </div>

      <div className="camera__controls">
        <button
          className="camera__capture-btn"
          onClick={handleCapture}
          disabled={!isCameraReady || isProcessing || isCapturing}
          aria-label="Capture photo"
        >
          {isCapturing ? 'Capturing...' : isProcessing ? 'Processing...' : 'Capture Photo'}
        </button>

        {isCameraReady && (
          <p className="camera__hint">
            Position your face within the frame and click capture
          </p>
        )}
      </div>
    </div>
  );
};
