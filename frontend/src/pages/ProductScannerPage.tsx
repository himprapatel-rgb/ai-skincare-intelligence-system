import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  IconScan, 
  IconCamera, 
  IconAlertTriangle, 
  IconPackage, 
  IconX, 
  IconUpload,
  IconCheck,
  IconLoader
} from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useShelf } from '../context/ShelfContext';
import './ProductScannerPage.css';

interface KeyIngredient {
  name: string;
  percentage?: string;  // e.g., "10%", "2%"
}

interface ScannedProduct {
  id: string;
  name: string;
  brand: string;
  barcode?: string;
  imageUrl?: string;
  category?: string;
  keyIngredients?: KeyIngredient[];  // Active ingredients with percentages
  ingredients: string[];  // Full ingredient list
  safetyRating: number;
  suitabilityScore: number;
  warnings: string[];
  source: 'barcode' | 'image';
  confidence?: number;
}

type ScanMode = 'barcode' | 'photo';

// Clean white background placeholder for products without images
const placeholderImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
      '<rect width="100%" height="100%" fill="#ffffff"/>' +
      '<defs>' +
        '<linearGradient id="icon" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#3b82f6"/>' +
          '<stop offset="100%" stop-color="#8b5cf6"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<g transform="translate(150, 120)">' +
        '<rect x="10" y="0" width="80" height="140" rx="10" fill="url(#icon)" opacity="0.9"/>' +
        '<rect x="20" y="10" width="60" height="25" rx="5" fill="white" opacity="0.3"/>' +
        '<circle cx="50" cy="90" r="25" fill="white" opacity="0.2"/>' +
        '<rect x="30" y="150" width="40" height="8" rx="4" fill="#e5e7eb"/>' +
      '</g>' +
      '<text x="200" y="340" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" fill="#9ca3af">Product Image</text>' +
    '</svg>'
  );

/**
 * Product Scanner Page (FR28 from SRS)
 * 
 * Features:
 * 1. Barcode scanning using camera (EAN, UPC, QR codes)
 * 2. Product identification from photo using AI
 * 3. Ingredient analysis and safety ratings
 * 4. Add to shelf functionality
 */
const ProductScannerPage: React.FC = () => {
  usePageTitle('Product Scanner');
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToShelf: addToShelfContext, isOnShelf } = useShelf();
  
  // Scanner state
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [addedToShelf, setAddedToShelf] = useState(false);
  const [addingToShelf, setAddingToShelf] = useState(false);
  
  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Start barcode scanner
  const startBarcodeScanner = async () => {
    if (!scannerContainerRef.current) return;
    
    try {
      setError(null);
      setCameraActive(true);
      
      const html5Qrcode = new Html5Qrcode("barcode-scanner", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false
      });
      
      scannerRef.current = html5Qrcode;
      
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5
        },
        (decodedText) => {
          // Barcode detected - stop scanner and process
          handleBarcodeDetected(decodedText);
        },
        () => {
          // QR Code scan error (ignore, keep scanning)
        }
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Could not access camera. Please allow camera permissions.');
      setCameraActive(false);
    }
  };

  // Stop barcode scanner
  const stopBarcodeScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraActive(false);
  };

  // Handle barcode detection
  const handleBarcodeDetected = async (barcode: string) => {
    // Stop scanner first
    await stopBarcodeScanner();
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/products/scan-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ barcode }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.found && data.product) {
          setScannedProduct({
            id: data.product.id || barcode,
            name: data.product.name || 'Unknown Product',
            brand: data.product.brand || 'Unknown Brand',
            barcode: barcode,
            imageUrl: data.product.image_url,
            category: data.product.category,
            ingredients: data.ingredients || [],
            safetyRating: data.safety_rating || 0,
            suitabilityScore: data.suitability_score || 0,
            warnings: data.warnings || [],
            source: 'barcode'
          });
        } else {
          setError(`Product not found for barcode: ${barcode}. Try taking a photo instead.`);
        }
      } else {
        throw new Error('Scan failed');
      }
    } catch (err) {
      setError('Failed to look up product. Please try again.');
      console.error('Barcode lookup error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Handle photo upload/capture
  const handlePhotoCapture = async (file: File) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      const response = await fetch('/api/v1/products/identify-from-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ image_data: base64 }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.found && data.product_name) {
          // Prioritize clean product image from API over user's photo
          const cleanImageUrl = data.product_image_url 
            || data.matched_product?.image_url 
            || null;
          
          setScannedProduct({
            id: data.matched_product?.id || `img-${Date.now()}`,
            name: data.product_name,
            brand: data.brand || 'Unknown Brand',
            imageUrl: cleanImageUrl,  // Use clean image, not user's blurry photo
            category: data.category,
            keyIngredients: data.key_ingredients?.map((ki: { name: string; percentage?: string }) => ({
              name: ki.name,
              percentage: ki.percentage
            })) || [],
            ingredients: data.ingredients || [],
            safetyRating: data.safety_rating || 0,
            suitabilityScore: data.suitability_score || 0,
            warnings: data.warnings || [],
            source: 'image',
            confidence: data.confidence
          });
        } else {
          setError('Could not identify product from image. Try a clearer photo with the product label visible.');
        }
      } else if (response.status === 401) {
        setError('Please log in to use product identification.');
      } else if (response.status === 503) {
        setError('AI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error('Identification failed');
      }
    } catch (err) {
      setError('Failed to identify product. Please try again with a clearer image.');
      console.error('Image identification error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoCapture(file);
    }
  };

  // Add to shelf using global context
  const handleAddToShelf = async () => {
    if (!scannedProduct || !token) return;
    
    // Check if already on shelf
    if (isOnShelf(scannedProduct.id)) {
      setAddedToShelf(true);
      setTimeout(() => navigate('/myshelf'), 1500);
      return;
    }
    
    setAddingToShelf(true);
    try {
      const success = await addToShelfContext({
        external_product_id: scannedProduct.id,
        product_name: scannedProduct.name,
        product_brand: scannedProduct.brand,
        product_category: scannedProduct.category,
        product_image: scannedProduct.imageUrl?.startsWith('data:') 
          ? undefined 
          : scannedProduct.imageUrl,
        status: 'active',
      });
      
      if (success) {
        setAddedToShelf(true);
        setTimeout(() => navigate('/myshelf'), 1500);
      } else {
        setError('Failed to add product to shelf. Please try again.');
      }
    } catch (err) {
      console.error('Failed to add to shelf:', err);
      setError('Failed to add product to shelf. Please try again.');
    } finally {
      setAddingToShelf(false);
    }
  };

  // Reset scanner
  const handleReset = () => {
    setScannedProduct(null);
    setError(null);
    setAddedToShelf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get safety color
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
          <p>Scan barcodes or take photos to identify beauty products</p>
        </div>

        {/* Mode Selector */}
        {!scannedProduct && !processing && (
          <div className="mode-selector">
            <button 
              className={`mode-btn ${scanMode === 'barcode' ? 'active' : ''}`}
              onClick={() => {
                setScanMode('barcode');
                stopBarcodeScanner();
              }}
            >
              <IconScan size={20} />
              Scan Barcode
            </button>
            <button 
              className={`mode-btn ${scanMode === 'photo' ? 'active' : ''}`}
              onClick={() => {
                setScanMode('photo');
                stopBarcodeScanner();
              }}
            >
              <IconCamera size={20} />
              Take Photo
            </button>
          </div>
        )}

        {/* Barcode Scanner Mode */}
        {scanMode === 'barcode' && !scannedProduct && !processing && (
          <div className="scanner-section">
            <div className="scanner-card">
              <div className="scanner-header">
                <h2>Scan Product Barcode</h2>
                <button 
                  onClick={cameraActive ? stopBarcodeScanner : startBarcodeScanner}
                  className="btn-toggle-camera"
                >
                  {cameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
              </div>
              
              <div 
                id="barcode-scanner" 
                ref={scannerContainerRef}
                className={`barcode-scanner-container ${cameraActive ? 'active' : ''}`}
              >
                {!cameraActive && (
                  <div className="camera-placeholder">
                    <IconCamera size={64} strokeWidth={1.5} />
                    <p>Click "Start Camera" to scan barcodes</p>
                    <p className="hint">Supports EAN-13, EAN-8, UPC-A, UPC-E, QR codes</p>
                  </div>
                )}
              </div>
              
              {scanning && (
                <div className="scanning-indicator">
                  <IconLoader size={20} className="spin" />
                  <span>Scanning for barcodes...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Mode */}
        {scanMode === 'photo' && !scannedProduct && !processing && (
          <div className="scanner-section">
            <div className="scanner-card photo-mode">
              <h2>Take Product Photo</h2>
              <p>Take a clear photo of the product packaging or label</p>
              
              <div className="photo-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="file-input"
                  id="product-photo-input"
                />
                <label htmlFor="product-photo-input" className="upload-label">
                  <IconUpload size={48} strokeWidth={1.5} />
                  <span className="upload-text">Tap to take photo or upload</span>
                  <span className="upload-hint">For best results, capture the full product label</span>
                </label>
              </div>
              
              <div className="photo-tips">
                <h3>Tips for best results:</h3>
                <ul>
                  <li>Ensure good lighting</li>
                  <li>Include the product name and brand</li>
                  <li>Capture ingredient list if visible</li>
                  <li>Avoid blurry images</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="processing-card">
            <IconLoader size={48} className="spin" />
            <h3>
              {scanMode === 'barcode' ? 'Looking up product...' : 'Analyzing product image...'}
            </h3>
            <p>This may take a few seconds</p>
          </div>
        )}

        {/* Error State */}
        {error && !processing && (
          <div className="error-card">
            <IconAlertTriangle size={48} strokeWidth={2} />
            <h3>Scan Failed</h3>
            <p>{error}</p>
            <button onClick={handleReset} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Product Results */}
        {scannedProduct && !processing && (
          <div className="product-results">
            <div className="card product-info-card">
              <div className="card-header">
                <h2>Product Identified</h2>
                <button onClick={handleReset} className="btn-icon-small" aria-label="Close">
                  <IconX size={18} strokeWidth={2} />
                </button>
              </div>
              
              <div className="card-content">
                <div className="product-header">
                  <div className="product-image">
                    <img 
                      src={scannedProduct.imageUrl || placeholderImage} 
                      alt={scannedProduct.name} 
                      loading="lazy" 
                      width={120} 
                      height={120} 
                      onError={(e) => {
                        // Use placeholder on error
                        (e.target as HTMLImageElement).src = placeholderImage;
                      }}
                      className="product-img"
                    />
                  </div>
                  <div className="product-details">
                    <h3>{scannedProduct.name}</h3>
                    <p className="product-brand">{scannedProduct.brand}</p>
                    {scannedProduct.category && (
                      <p className="product-category">{scannedProduct.category}</p>
                    )}
                    {scannedProduct.barcode && (
                      <p className="product-barcode">Barcode: {scannedProduct.barcode}</p>
                    )}
                    {scannedProduct.confidence && (
                      <p className="product-confidence">
                        AI Confidence: {Math.round(scannedProduct.confidence * 100)}%
                      </p>
                    )}
                    <span className={`source-badge ${scannedProduct.source}`}>
                      {scannedProduct.source === 'barcode' ? 'Barcode Scan' : 'AI Identified'}
                    </span>
                  </div>
                </div>

                {/* Safety Ratings */}
                <div className="safety-ratings">
                  <div
                    className="rating-card"
                    style={{
                      '--rating-color': getSafetyColor(scannedProduct.safetyRating),
                      '--rating-width': `${scannedProduct.safetyRating}%`,
                    } as React.CSSProperties}
                  >
                    <div className="rating-label">Safety Rating</div>
                    <div className="rating-value">{scannedProduct.safetyRating}/100</div>
                    <div className="rating-bar">
                      <div className="rating-fill" />
                    </div>
                  </div>
                  <div
                    className="rating-card"
                    style={{
                      '--rating-color': getSafetyColor(scannedProduct.suitabilityScore),
                      '--rating-width': `${scannedProduct.suitabilityScore}%`,
                    } as React.CSSProperties}
                  >
                    <div className="rating-label">Suitability Score</div>
                    <div className="rating-value">{scannedProduct.suitabilityScore}/100</div>
                    <div className="rating-bar">
                      <div className="rating-fill" />
                    </div>
                  </div>
                </div>

                {/* Key Active Ingredients with Percentages */}
                {scannedProduct.keyIngredients && scannedProduct.keyIngredients.length > 0 && (
                  <div className="key-ingredients-section">
                    <h3>Key Active Ingredients</h3>
                    <div className="key-ingredients-list">
                      {scannedProduct.keyIngredients.map((ki, idx) => (
                        <div key={idx} className="key-ingredient-item">
                          <span className="ingredient-name">{ki.name}</span>
                          {ki.percentage && (
                            <span className="ingredient-percentage">{ki.percentage}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Ingredients List */}
                {scannedProduct.ingredients.length > 0 && (
                  <div className="ingredients-section">
                    <h3>All Ingredients</h3>
                    <div className="ingredients-list">
                      {scannedProduct.ingredients.map((ingredient, idx) => (
                        <span key={idx} className="ingredient-tag">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
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

                {/* Actions */}
                <div className="product-actions">
                  {addedToShelf ? (
                    <button className="btn-success" disabled>
                      <IconCheck size={18} strokeWidth={2} className="icon-inline" />
                      Added to Shelf!
                    </button>
                  ) : addingToShelf ? (
                    <button className="btn-primary" disabled>
                      <IconLoader size={18} strokeWidth={2} className="icon-inline spin" />
                      Adding...
                    </button>
                  ) : (
                    <button onClick={handleAddToShelf} className="btn-primary" disabled={!token}>
                      <IconPackage size={18} strokeWidth={2} className="icon-inline" />
                      Add to My Shelf
                    </button>
                  )}
                  <button onClick={handleReset} className="btn-secondary">
                    Scan Another
                  </button>
                </div>
                
                {!token && (
                  <p className="login-hint">
                    <a href="/login">Log in</a> to save products to your shelf
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How It Works Guide */}
      <section className="scanner-guide">
        <div className="section-header">
          <h2>How Product Scanner Works</h2>
          <p>Two ways to identify any beauty product instantly</p>
        </div>
        
        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-icon">
              <IconScan size={32} />
            </div>
            <h3>Barcode Scanning</h3>
            <p>Point your camera at any product barcode (EAN, UPC, or QR code) for instant lookup.</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">
              <IconCamera size={32} />
            </div>
            <h3>Photo Recognition</h3>
            <p>Take a photo of the product packaging. Our AI identifies the product and extracts ingredients.</p>
          </div>
          <div className="guide-card">
            <div className="guide-icon">
              <IconPackage size={32} />
            </div>
            <h3>Save to Shelf</h3>
            <p>Add identified products to your personal shelf to track usage and get personalized recommendations.</p>
          </div>
        </div>

        <div className="supported-formats">
          <h3>Supported Barcode Formats</h3>
          <div className="format-tags">
            <span>EAN-13</span>
            <span>EAN-8</span>
            <span>UPC-A</span>
            <span>UPC-E</span>
            <span>QR Code</span>
            <span>Data Matrix</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductScannerPage;
