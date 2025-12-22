// src/pages/ScanPage.tsx
import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { initScan, uploadScanImage, getScanStatus, getScanResult } from "../services/scanApi";

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    }
  }, []);

  const handleScan = async () => {
    if (!file) return;
    
    setScanning(true);
    setError(null);
    
    try {
      const initResponse = await initScan();
      const sessionId = initResponse.session_id;
      
      await uploadScanImage(sessionId, file);
      
      // Poll for results
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        const status = await getScanStatus(sessionId);
        
        if (status.status === "completed") {
          const scanResult = await getScanResult(sessionId);
          setResult(scanResult);
          break;
        } else if (status.status === "failed") {
          throw new Error("Scan failed");
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error("Scan timeout");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="onskin-page">
      <header className="onskin-header">
        <div className="onskin-container">
          <Link to="/" className="onskin-logo">AuraSkin</Link>
          <Link to="/" className="onskin-back">← Back</Link>
        </div>
      </header>

      <main className="onskin-container onskin-main">
        <div className="onskin-content">
          <h1 className="onskin-title">Face Scan Analysis</h1>
          <p className="onskin-subtitle">Upload a clear photo of your face for AI-powered skin analysis</p>

          {!result && (
            <div className="onskin-upload-section">
              <div className="onskin-upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="onskin-file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="onskin-upload-label">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="onskin-preview" />
                  ) : (
                    <div className="onskin-upload-prompt">
                      <div className="onskin-upload-icon">📸</div>
                      <div className="onskin-upload-text">Tap to upload photo</div>
                      <div className="onskin-upload-hint">JPG, PNG, or WEBP</div>
                    </div>
                  )}
                </label>
              </div>

              {file && (
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="onskin-btn-primary"
                >
                  {scanning ? "Analyzing..." : "Start Analysis"}
                </button>
              )}

              {error && (
                <div className="onskin-error">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="onskin-results">
              <div className="onskin-result-header">
                <h2 className="onskin-result-title">Analysis Complete</h2>
                <button 
                  onClick={() => { setResult(null); setFile(null); setPreviewUrl(null); }}
                  className="onskin-btn-secondary"
                >
                  New Scan
                </button>
              </div>

              <div className="onskin-result-card">
                <h3>Results</h3>
                <pre className="onskin-result-data">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
