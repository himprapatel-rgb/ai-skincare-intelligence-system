import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { IconScan, IconCamera, IconAlertTriangle, IconPackage, IconX } from '../components/Icons';
import './ProductScannerPage.css';

interface ScannedProduct {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  imageUrl: string;
  ingredients: string[];
  safetyRating: number; // 0-100
  suitabilityScore: number; // 0-100
  warnings: string[];
}

/**
 * Product Scanner Page (FR28 from SRS)
 * Camera integration to scan product barcodes and analyze ingredients
 */
const ProductScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        handleScan(imageSrc);
      }
    }
  }, []);

  const handleScan = async (imageData: string) => {
    setScanning(true);
    setError(null);
    
    try {
      // TODO: API call to /api/v1/products/scan
      // For now, mock response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockProduct: ScannedProduct = {
        id: 'scanned-1',
        name: 'Vitamin C Serum',
        brand: 'CeraVe',
        barcode: '1234567890123',
        imageUrl: imageData,
        ingredients: ['Water', 'Ascorbic Acid', 'Glycerin', 'Hyaluronic Acid', 'Niacinamide'],
        safetyRating: 85,
        suitabilityScore: 78,
        warnings: ['Contains fragrance', 'May cause irritation in sensitive skin']
      };
      
      setScannedProduct(mockProduct);
    } catch (err) {
      setError('Failed to scan product. Please try again.');
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleAddToShelf = () => {
    if (scannedProduct) {
      // TODO: API call to add product to shelf
      navigate('/myshelf');
    }
  };

  const handleRetry = () => {
    setScannedProduct(null);
    setError(null);
    setCameraActive(true);
  };

  const getSafetyColor = (rating: number) => {
    if (rating >= 80) return 'var(--primary)';
    if (rating >= 60) return 'var(--secondary)';
    return '#dc2626';
  };

  return (
    <div className="product-scanner-page">
      <div className="scanner-container">
        <div className="page-header">
          <h1>
            <IconScan size={32} strokeWidth={2} className="icon-inline-lg" />
            Product Scanner
          </h1>
          <p>Scan product barcodes to analyze ingredients and safety</p>
        </div>

        {!scannedProduct && !error && (
          <div className="scanner-section">
            <div className="scanner-card">
              <div className="scanner-header">
                <h2>Scan Product Barcode</h2>
                <button 
                  onClick={() => setCameraActive(!cameraActive)}
                  className="btn-toggle-camera"
                >
                  {cameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
              </div>
              
              {cameraActive ? (
                <div className="camera-container">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: 'environment'
                    }}
                    className="scanner-webcam"
                  />
                  <div className="scanner-overlay">
                    <div className="scanner-frame"></div>
                    <p className="scanner-hint">Position barcode within the frame</p>
                  </div>
                </div>
              ) : (
                <div className="camera-placeholder">
                  <IconCamera size={64} strokeWidth={2} />
                  <p>Click "Start Camera" to begin scanning</p>
                </div>
              )}

              {cameraActive && (
                <div className="scanner-actions">
                  <button 
                    onClick={capture}
                    disabled={scanning}
                    className="btn-scan"
                  >
                    {scanning ? (
                      <>
                        <IconScan size={20} strokeWidth={2} className="icon-inline" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <IconScan size={20} strokeWidth={2} className="icon-inline" />
                        Capture & Scan
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <IconAlertTriangle size={48} strokeWidth={2} />
            <h3>Scan Failed</h3>
            <p>{error}</p>
            <button onClick={handleRetry} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {scannedProduct && (
          <div className="product-results">
            <div className="card product-info-card">
              <div className="card-header">
                <h2>Product Analysis</h2>
                <button onClick={handleRetry} className="btn-icon-small">
                  <IconX size={18} strokeWidth={2} />
                </button>
              </div>
              <div className="card-content">
                <div className="product-header">
                  <div className="product-image">
                    <img src={scannedProduct.imageUrl} alt={scannedProduct.name} />
                  </div>
                  <div className="product-details">
                    <h3>{scannedProduct.name}</h3>
                    <p className="product-brand">{scannedProduct.brand}</p>
                    <p className="product-barcode">Barcode: {scannedProduct.barcode}</p>
                  </div>
                </div>

                <div className="safety-ratings">
                  <div
                    className="rating-card"
                    style={
                      {
                        '--rating-color': getSafetyColor(scannedProduct.safetyRating),
                        '--rating-width': `${scannedProduct.safetyRating}%`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="rating-label">Safety Rating</div>
                    <div className="rating-value">
                      {scannedProduct.safetyRating}/100
                    </div>
                    <div className="rating-bar">
                      <div className="rating-fill" />
                    </div>
                  </div>
                  <div
                    className="rating-card"
                    style={
                      {
                        '--rating-color': getSafetyColor(scannedProduct.suitabilityScore),
                        '--rating-width': `${scannedProduct.suitabilityScore}%`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="rating-label">Suitability Score</div>
                    <div className="rating-value">
                      {scannedProduct.suitabilityScore}/100
                    </div>
                    <div className="rating-bar">
                      <div className="rating-fill" />
                    </div>
                  </div>
                </div>

                <div className="ingredients-section">
                  <h3>Ingredients</h3>
                  <div className="ingredients-list">
                    {scannedProduct.ingredients.map((ingredient, idx) => (
                      <span key={idx} className="ingredient-tag">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>

                {scannedProduct.warnings.length > 0 && (
                  <div className="warnings-section">
                    <h3>
                      <IconAlertTriangle size={20} strokeWidth={2} className="icon-inline warning-icon" />
                      Warnings
                    </h3>
                    <ul className="warnings-list">
                      {scannedProduct.warnings.map((warning, idx) => (
                        <li key={idx}>
                          <IconAlertTriangle size={16} strokeWidth={2} className="icon-inline warning-icon" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="product-actions">
                  <button onClick={handleAddToShelf} className="btn-primary">
                    <IconPackage size={18} strokeWidth={2} className="icon-inline" />
                    Add to My Shelf
                  </button>
                  <button onClick={() => navigate(`/product/${scannedProduct.id}`)} className="btn-secondary">
                    View Full Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="scanner-guide">
        <div className="section-header">
          <h2>How Product Scanner Works</h2>
          <p>Scan any skincare barcode to decode ingredients and safety scores.</p>
        </div>
        <div className="guide-grid">
          <div className="guide-card">
            <h3>1. Capture the Barcode</h3>
            <p>Point your camera at the product barcode and capture a clear image.</p>
          </div>
          <div className="guide-card">
            <h3>2. Match the Product</h3>
            <p>We cross-check the barcode against verified ingredient databases.</p>
          </div>
          <div className="guide-card">
            <h3>3. Read the Insights</h3>
            <p>View safety ratings, suitability, and ingredient warnings instantly.</p>
          </div>
        </div>

        <div className="guide-grid">
          <div className="guide-card">
            <h3>Supported Barcode Types</h3>
            <ul className="barcode-list">
              <li>EAN-13 / EAN-8</li>
              <li>UPC-A / UPC-E</li>
              <li>GS1 DataBar (limited)</li>
              <li>QR codes on packaging</li>
            </ul>
          </div>
          <div className="guide-card">
            <h3>Ingredient Analysis</h3>
            <p>
              Ingredients are parsed by function (hydration, exfoliation, soothing),
              and flagged if they commonly irritate sensitive skin or clash with
              your profile.
            </p>
          </div>
          <div className="guide-card">
            <h3>Safety Rating System</h3>
            <p>
              Scores blend ingredient risk, concentration patterns, and known sensitivities.
              80–100 is low risk, 60–79 is moderate, below 60 needs caution.
            </p>
          </div>
        </div>

        <div className="example-card">
          <h3>Example Scan Result</h3>
          <div className="example-grid">
            <div>
              <p><strong>Product:</strong> Vitamin C Serum</p>
              <p><strong>Safety:</strong> 85/100 (Low Risk)</p>
              <p><strong>Suitability:</strong> 78/100 (Good Fit)</p>
            </div>
            <div>
              <p><strong>Key Ingredients:</strong> Ascorbic Acid, Niacinamide</p>
              <p><strong>Warnings:</strong> Contains fragrance; patch test recommended.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductScannerPage;
