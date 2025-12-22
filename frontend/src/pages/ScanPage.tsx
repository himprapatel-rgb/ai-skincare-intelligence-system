import React, { useState, useEffect } from 'react';
import { Camera } from '../components/Camera';
import { AnalysisResults } from '../components/AnalysisResults';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { scanApi } from '../services/scanApi';
import { faceDetectionService } from '../services/faceDetection';
import type { ScanAnalysisResult } from '../types/scan';

/**
 * ScanPage Component
 * Main page for face scanning and analysis
 */
export const ScanPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScanAnalysisResult | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  /**
   * Initialize scan session on mount
   */
  useEffect(() => {
    initializeSession();

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        // Session cleanup handled by backend timeout
        console.log(`Session ${sessionId} will expire automatically`);
      }
    };
  }, []);

  /**
   * Initialize scan session with backend
   */
  const initializeSession = async (): Promise<void> => {
    try {
      setError(null);
      const response = await scanApi.initScan();
      setSessionId(response.sessionId);
      console.log('Scan session initialized:', response.sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize scan';
      setError(errorMessage);
      console.error('Session initialization failed:', err);
    }
  };

  /**
   * Handle image capture from camera
   */
  const handleCapture = async (imageBlob: Blob): Promise<void> => {
    if (!sessionId) {
      setError('No active session. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setValidationWarning(null);

    try {
      // Client-side face validation
          // Perform client-side face validation
      const validationResponse = await faceDetectionService.validateFace(imageBlob);
      
      if (!validationResponse.faceDetected) {
        setValidationWarning(validationResponse.warning || 'No face detected. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      if (validationResponse.warning) {
        setValidationWarning(validationResponse.warning);
      }
      // Upload image to backend
      console.log('Uploading image to backend...');
      await scanApi.uploadScan(sessionId, imageBlob);

      // Poll for results
      console.log('Polling for analysis results...');
      const analysisResults = await scanApi.pollResults(sessionId);
      
      setResults(analysisResults as ScanAnalysisResult);      console.log('Analysis complete:', analysisResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process scan';
      setError(errorMessage);
      console.error('Scan processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset scan to take new photo
   */
  const handleReset = (): void => {
    setResults(null);
    setError(null);
    setValidationWarning(null);
    // Reinitialize session for new scan
    initializeSession();
  };

  /**
   * Handle camera errors
   */
  const handleCameraError = (errorMessage: string): void => {
    setError(errorMessage);
  };

  return (
    <div className="scan-page">
      <div className="scan-page__header">
        <h1>Skin Analysis Scanner</h1>
        <p>Capture a clear photo of your face for personalized skincare analysis</p>
      </div>

      <div className="scan-page__content">
        {/* Error Display */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => {
              setError(null);
              initializeSession();
            }}
          />
        )}

        {/* Validation Warning */}
        {validationWarning && !error && (
          <div className="scan-page__warning">
            <p>⚠️ {validationWarning}</p>
          </div>
        )}

        {/* Main Content */}
        {!results ? (
          <div className="scan-page__scanner">
            {/* Quality Guidelines */}
            <div className="scan-page__guidelines">
              <h3>Guidelines for Best Results:</h3>
              <ul>
                {faceDetectionService.getQualityGuidelines().map((guideline, index) => (
                  <li key={index}>{guideline}</li>
                ))}
              </ul>
            </div>

            {/* Camera Component */}
            {sessionId && (
              <Camera
                onCapture={handleCapture}
                onError={handleCameraError}
                isProcessing={isProcessing}
              />
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="scan-page__processing">
                <LoadingSpinner message="Analyzing your skin..." />
                <p className="scan-page__processing-info">
                  This may take a few moments. Please wait...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Analysis Results */
          <AnalysisResults 
            results={results}
            onNewScan={handleReset}
          />
        )}
      </div>

      {/* Session Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && sessionId && (
        <div className="scan-page__debug">
          <small>Session ID: {sessionId}</small>
        </div>
      )}
    </div>
  );
};
