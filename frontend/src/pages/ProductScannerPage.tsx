import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  IconScan, 
  IconCamera, 
  IconAlertTriangle, 
  IconPackage, 
  IconX, 
  IconUpload,
  IconCheck,
  IconLoader,
  IconFlash,
  IconVolume
} from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useShelf } from '../context/ShelfContext';
import { useToast } from '../context/ToastContext';
import {
  getCameraPermissionStatus,
  getCameraCapabilities,
  isSecureContext,
  isMobileDevice,
  parseCameraError,
  getBrowserCameraInstructions,
  getCameraPreference,
  hasTorchSupport,
  toggleTorch,
  warmUpDelay,
  CameraPermissionStatus,
  CameraCapabilities
} from '../utils/cameraUtils';
import './ProductScannerPage.css';

import { API_BASE_URL } from '../config';
const API_BASE = API_BASE_URL;

interface KeyIngredient {
  name: string;
  percentage?: string;  // e.g., "10%", "2%"
}

interface FlaggedIngredient {
  name: string;           // Official name (e.g., "Parabens")
  matched_term: string;   // What was matched in the list
  severity: 'high' | 'moderate' | 'low';
  categories: string[];   // ["irritant", "allergen", etc.]
  reason: string;         // Why it's flagged
  alternatives: string[]; // Safer alternatives
  avoid_if: string[];     // Conditions where caution is needed
}

interface SafetyReport {
  flagged_ingredients: FlaggedIngredient[];
  total_flagged: number;
  high_severity_count: number;
  moderate_severity_count: number;
  low_severity_count: number;
  safety_score: number;
  recommendations: string[];
  is_pregnancy_safe: boolean;
  is_sensitive_skin_safe: boolean;
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
  safetyReport?: SafetyReport;  // Detailed safety analysis
  source: 'barcode' | 'image';
  /** API data source: catalog = instant from product DB, database, openbeautyfacts, ai */
  dataSource?: string;
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
// Scan history item stored in localStorage
interface ScanHistoryItem {
  id: string;
  barcode?: string;
  name: string;
  brand: string;
  imageUrl?: string;
  category?: string;
  scannedAt: string;
  source: 'barcode' | 'image';
}

const SCAN_HISTORY_KEY = 'pellicura_scan_history';
const MAX_HISTORY_ITEMS = 5;

/** How to use: best time from category */
function getUsageTime(category: string | undefined): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('sunscreen') || cat.includes('spf')) return '☀️ Morning only';
  if (cat.includes('retinol') || cat.includes('night')) return '🌙 Evening only';
  if (cat.includes('serum') || cat.includes('treatment')) return '☀️🌙 AM or PM';
  if (cat.includes('cleanser') || cat.includes('moisturizer') || cat.includes('toner')) return '☀️🌙 AM & PM';
  return '☀️🌙 As needed';
}
/** Step order from category */
function getStepOrder(category: string | undefined): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('cleanser') || cat.includes('clean')) return 'Step 1 – Cleanse';
  if (cat.includes('toner') || cat.includes('essence')) return 'Step 2 – Tone';
  if (cat.includes('serum') || cat.includes('ampoule')) return 'Step 3 – Treat';
  if (cat.includes('eye')) return 'Step 4 – Eye';
  if (cat.includes('moisturizer') || cat.includes('cream') || cat.includes('lotion')) return 'Step 5 – Moisturize';
  if (cat.includes('sunscreen') || cat.includes('spf')) return 'Step 6 – Protect (AM)';
  return 'As directed';
}
/** Amount per use from category */
function getAmount(category: string | undefined): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('serum') || cat.includes('oil')) return '2–3 drops';
  if (cat.includes('cleanser')) return 'Dime-sized';
  if (cat.includes('moisturizer') || cat.includes('cream')) return 'Pea-sized';
  if (cat.includes('sunscreen')) return '2 finger lengths';
  if (cat.includes('toner') || cat.includes('essence')) return '3–4 drops or cotton pad';
  if (cat.includes('eye')) return 'Rice grain';
  return 'As directed';
}

/** Check for common ingredient conflicts with user's shelf (e.g. Vitamin C + Retinol) */
function getShelfConflict(
  scannedIngredients: string[],
  _scannedName: string,
  shelfProducts: Array<{ product_name: string; ingredients_json?: { ingredients?: string[] } }>
): { message: string; productName: string } | null {
  const scannedLower = scannedIngredients.join(' ').toLowerCase();
  const hasVitaminC = /\b(ascorbic|vitamin\s*c|sodium\s*ascorbyl)\b/i.test(scannedLower);
  const hasRetinol = /\b(retinol|retinyl|adapalene|tretinoin|retinoid)\b/i.test(scannedLower);
  const hasAhaBha = /\b(glycolic|lactic|salicylic|aha|bha|beta\s*hydroxy)\b/i.test(scannedLower);
  for (const shelf of shelfProducts) {
    const ing = shelf.ingredients_json?.ingredients || [];
    const shelfLower = ing.join(' ').toLowerCase();
    const shelfHasRetinol = /\b(retinol|retinyl|adapalene|tretinoin|retinoid)\b/i.test(shelfLower);
    const shelfHasVitaminC = /\b(ascorbic|vitamin\s*c|sodium\s*ascorbyl)\b/i.test(shelfLower);
    if (hasVitaminC && shelfHasRetinol) {
      return { message: 'Don\'t use together. Use Vitamin C in AM, Retinol in PM.', productName: shelf.product_name };
    }
    if (hasRetinol && shelfHasVitaminC) {
      return { message: 'Don\'t use together. Use Vitamin C in AM, Retinol in PM.', productName: shelf.product_name };
    }
    if (hasAhaBha && shelfHasRetinol) {
      return { message: 'Avoid using AHA/BHA with retinol on the same night.', productName: shelf.product_name };
    }
  }
  return null;
}

interface ProductScannerPageProps {
  /** When true, render without page header for embedding inside combined Scan tab */
  embedded?: boolean;
}

const ProductScannerPage: React.FC<ProductScannerPageProps> = ({ embedded = false }) => {
  usePageTitle(embedded ? null : 'Product Scanner');
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToShelf: addToShelfContext, isOnShelf, products: shelfProducts } = useShelf();
  const toast = useToast();
  
  // Scanner state
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [addedToShelf, setAddedToShelf] = useState(false);
  const [addingToShelf, setAddingToShelf] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackOpenedDate, setTrackOpenedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [trackPAOMonths, setTrackPAOMonths] = useState(6);
  
  // Enhanced camera state (Tasks 1-50)
  const [_cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('unknown');
  const [_cameraCapabilities, setCameraCapabilities] = useState<CameraCapabilities | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, _setVibrationEnabled] = useState(true);
  const [continuousMode, _setContinuousMode] = useState(false);
  const [sessionScanCount, setSessionScanCount] = useState(0);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  
  // Camera stream ref for photo capture
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Load scan history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCAN_HISTORY_KEY);
      if (stored) {
        setScanHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load scan history:', e);
    }
  }, []);
  
  // Task 7: Check camera permission and capabilities on mount
  useEffect(() => {
    const initializeCamera = async () => {
      // Check permission status
      const permission = await getCameraPermissionStatus();
      setCameraPermission(permission);
      
      // Get camera capabilities
      const capabilities = await getCameraCapabilities();
      setCameraCapabilities(capabilities);
      
      // Load saved camera preference, default to back camera on mobile
      const savedPreference = getCameraPreference();
      if (savedPreference) {
        setCurrentFacingMode(savedPreference);
      } else if (isMobileDevice()) {
        setCurrentFacingMode('environment'); // Back camera for mobile
      }
    };
    
    initializeCamera();
  }, []);
  
  // Task 55, 56: Feedback on successful scan
  const playSuccessFeedback = useCallback(() => {
    // Sound feedback
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch {
        // Audio not supported
      }
    }
    
    // Haptic feedback
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, [soundEnabled, vibrationEnabled]);
  
  // Task 62: Handle manual barcode entry
  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) return;
    
    // Validate barcode format (8-14 digits)
    const cleanBarcode = manualBarcode.replace(/\D/g, '');
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      setError('Invalid barcode. Please enter 8-14 digits.');
      return;
    }
    
    setShowManualEntry(false);
    await handleBarcodeDetected(cleanBarcode);
    setManualBarcode('');
  };
  
  // Task 40: Toggle torch/flashlight
  const handleToggleTorch = async () => {
    if (cameraStreamRef.current) {
      const newState = !torchEnabled;
      const success = await toggleTorch(cameraStreamRef.current, newState);
      if (success) {
        setTorchEnabled(newState);
      }
    }
  };

  // Save product to scan history
  const addToScanHistory = (product: ScannedProduct) => {
    const historyItem: ScanHistoryItem = {
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      category: product.category,
      scannedAt: new Date().toISOString(),
      source: product.source
    };

    setScanHistory(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== product.id);
      // Add to front, limit to MAX_HISTORY_ITEMS
      const updated = [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      // Save to localStorage
      try {
        localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save scan history:', e);
      }
      return updated;
    });
  };
  
  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const errorCardRef = useRef<HTMLDivElement>(null);

  // Scroll error card into view when error is set (e.g. product not found)
  useEffect(() => {
    if (error && errorCardRef.current) {
      errorCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Start barcode scanner with enhanced features (Tasks 1-75)
  const startBarcodeScanner = async () => {
    if (!scannerContainerRef.current) return;
    
    // Task 11: Check secure context
    if (!isSecureContext()) {
      setError('Camera requires a secure connection (HTTPS). Please access this page using HTTPS.');
      return;
    }
    
    try {
      setError(null);
      setCameraActive(true);
      
      // Task 19: Camera warm-up delay
      await warmUpDelay();
      
      // Task 52: Support more barcode formats
      const html5Qrcode = new Html5Qrcode("barcode-scanner", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false
      });
      
      scannerRef.current = html5Qrcode;
      
      // Task 26, 31: Use back camera (environment) for product scanning
      await html5Qrcode.start(
        { facingMode: currentFacingMode },
        {
          fps: 15, // Slightly higher FPS for better scanning
          qrbox: { width: 280, height: 160 }, // Larger scan area
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
      
      // Task 40: Check for torch support after camera starts
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } });
        cameraStreamRef.current = stream;
        const torchSupported = await hasTorchSupport(stream);
        setHasTorch(torchSupported);
        // Stop this stream as Html5Qrcode manages its own
        stream.getTracks().forEach(t => t.stop());
      } catch {
        // Ignore - Html5Qrcode will manage the camera
      }
      
      setScanning(true);
    } catch (err: unknown) {
      console.error('Failed to start scanner:', err);
      setCameraActive(false);
      
      // Task 1, 10: Use parseCameraError utility for specific messages
      const { message } = parseCameraError(err);
      const instructions = getBrowserCameraInstructions();
      setError(`${message}\n\n${instructions}`);
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

  // Handle barcode detection (Tasks 55-71)
  const handleBarcodeDetected = async (barcode: string) => {
    // Task 70, 71: Duplicate detection within session
    if (barcode === lastScannedBarcode) {
      // Same barcode scanned again - ignore to prevent duplicates
      return;
    }
    
    // Task 55, 56: Play success feedback immediately on scan
    playSuccessFeedback();
    
    // Stop scanner if not in continuous mode
    if (!continuousMode) {
      await stopBarcodeScanner();
    }
    
    setProcessing(true);
    setError(null);
    setLastScannedBarcode(barcode);
    
    // Task 69: Update session scan count
    setSessionScanCount(prev => prev + 1);
    
    try {
      setProcessingStep('Checking catalog...');
      const response = await fetch(`${API_BASE}/products/scan-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ barcode }),
      });
      
      if (response.status === 401) {
        sessionStorage.setItem('session_expired_redirect', '1');
        setError('Your session expired. Please sign in again.');
        toast.error('Your session expired. Please sign in again.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        if (data.found && data.product) {
          setProcessingStep('Product found!');
          const product: ScannedProduct = {
            id: data.product.id || barcode,
            name: data.product.name || 'Unknown Product',
            brand: data.product.brand || 'Unknown Brand',
            barcode: barcode,
            imageUrl: data.product.image_url,
            category: data.product.category,
            keyIngredients: data.key_ingredients?.map((ki: { name: string; percentage?: string }) => ({
              name: ki.name,
              percentage: ki.percentage,
            })) ?? [],
            ingredients: data.ingredients || [],
            safetyRating: data.safety_rating || 0,
            suitabilityScore: data.suitability_score || 0,
            warnings: data.warnings || [],
            safetyReport: data.safety_report || undefined,
            source: 'barcode',
            dataSource: data.source,
          };
          setScannedProduct(product);
          addToScanHistory(product);
        } else {
          // Task 66: Offer alternatives when product not found; show toast so user always sees feedback
          const msg = `Product not found for barcode ${barcode}. Try a photo of the product or check the barcode.`;
          setError(`Product not found for barcode: ${barcode}.\n\nTry:\n• Take a photo of the product instead\n• Enter the barcode manually\n• Check if the barcode is complete and undamaged`);
          toast.error(msg);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Failed to scan barcode. Please try again.');
      }
    } catch (err) {
      setError('Failed to look up product. Check your internet connection and try again.');
      console.error('Barcode lookup error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Handle photo upload/capture
  const handlePhotoCapture = async (file: File) => {
    setProcessing(true);
    setError(null);
    setProcessingStep('Preparing image...');
    
    try {
      const base64 = await fileToBase64(file);
      setProcessingStep('Checking catalog...');
      
      const response = await fetch(`${API_BASE}/products/identify-from-image`, {
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
          setProcessingStep('Product identified! Loading details...');
          
          // Prioritize clean product image from API over user's photo
          const cleanImageUrl = data.product_image_url 
            || data.matched_product?.image_url 
            || null;
          
          const product: ScannedProduct = {
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
            safetyReport: data.safety_report || undefined,
            source: 'image',
            confidence: data.confidence
          };
          
          setScannedProduct(product);
          addToScanHistory(product);  // Save to scan history
        } else {
          setError('Could not identify product from image. Try a clearer photo with the product label visible.');
        }
      } else if (response.status === 401) {
        setError('Please log in to use product identification.');
      } else if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 429) {
        setError('AI service is busy. Please wait a moment and try again.');
      } else {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Could not identify product. Try a clearer photo with the product label visible.');
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

  // Add to shelf using global context (optional expiry from "Track this product" modal)
  const handleAddToShelf = async (expiryDate?: string) => {
    if (!scannedProduct || !token) return;
    
    if (isOnShelf(scannedProduct.id)) {
      setAddedToShelf(true);
      setTimeout(() => navigate('/myshelf'), 1500);
      return;
    }
    
    setAddingToShelf(true);
    setShowTrackModal(false);
    try {
      // Build full scan snapshot for persistent storage (ingredients + safety data)
      const ingredientsList: string[] = Array.isArray(scannedProduct.ingredients)
        ? scannedProduct.ingredients
        : [];
      const flagged = scannedProduct.safetyReport?.flagged_ingredients;
      const ingredientsSnapshot = {
        ingredients: ingredientsList,
        key_ingredients: (scannedProduct.keyIngredients || []).map(ki => ({
          name: ki.name,
          percentage: ki.percentage || null
        })),
        captured_at: new Date().toISOString(),
        safety_rating: scannedProduct.safetyRating ?? undefined,
        suitability_score: scannedProduct.suitabilityScore ?? undefined,
        safety_report: scannedProduct.safetyReport && Array.isArray(flagged) ? {
          flagged_ingredients: flagged.map(f => ({
            name: f.name,
            matched_term: f.matched_term,
            severity: f.severity,
            categories: f.categories,
            reason: f.reason,
            alternatives: f.alternatives,
            avoid_if: f.avoid_if
          })),
          total_flagged: scannedProduct.safetyReport.total_flagged,
          high_severity_count: scannedProduct.safetyReport.high_severity_count,
          moderate_severity_count: scannedProduct.safetyReport.moderate_severity_count,
          low_severity_count: scannedProduct.safetyReport.low_severity_count,
          safety_score: scannedProduct.safetyReport.safety_score,
          recommendations: scannedProduct.safetyReport.recommendations,
          is_pregnancy_safe: scannedProduct.safetyReport.is_pregnancy_safe,
          is_sensitive_skin_safe: scannedProduct.safetyReport.is_sensitive_skin_safe
        } : undefined,
        warnings: scannedProduct.warnings?.length ? scannedProduct.warnings : undefined
      };
      
      const success = await addToShelfContext({
        external_product_id: scannedProduct.barcode || scannedProduct.id,
        product_name: scannedProduct.name,
        product_brand: scannedProduct.brand,
        product_category: scannedProduct.category,
        product_image: scannedProduct.imageUrl?.startsWith('data:') 
          ? undefined 
          : scannedProduct.imageUrl,
        status: 'active',
        ingredients_json: ingredientsSnapshot,
        expiry_date: expiryDate || undefined,
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
    <div className={`product-scanner-page app-page${embedded ? ' product-scanner-embedded' : ''}`}>
      {!embedded && (
        <header className="app-header-card scanner-page-header">
          <h1>
            <IconScan size={28} strokeWidth={2} className="icon-inline-lg" aria-hidden />
            Product Scanner
          </h1>
          <p className="app-header-subtitle">Scan barcodes or take photos to identify beauty products</p>
        </header>
      )}
      <div className="scanner-container app-page-content">
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

        {/* Barcode Scanner Mode - Enhanced (Tasks 76-100) */}
        {scanMode === 'barcode' && !scannedProduct && !processing && (
          <div className="scanner-section">
            <div className="scanner-card">
              <div className="scanner-header">
                <h2>Scan Product Barcode</h2>
                {sessionScanCount > 0 && (
                  <span className="scan-count" title="Products scanned this session">
                    {sessionScanCount} scanned
                  </span>
                )}
              </div>
              
              <div 
                id="barcode-scanner" 
                ref={scannerContainerRef}
                className={`barcode-scanner-container ${cameraActive ? 'active' : ''}`}
              >
                {!cameraActive && (
                  <div className="camera-placeholder">
                    <IconCamera size={64} strokeWidth={1.5} />
                    <p className="placeholder-main">Works with most product barcodes</p>
                  </div>
                )}
                
                {/* Task 79: Scan zone guide overlay */}
                {cameraActive && (
                  <div className="scan-zone-overlay">
                    <div className="scan-zone-guide">
                      <span className="corner top-left"></span>
                      <span className="corner top-right"></span>
                      <span className="corner bottom-left"></span>
                      <span className="corner bottom-right"></span>
                      <span className="scan-line"></span>
                    </div>
                    <p className="scan-hint">Center barcode in the box</p>
                  </div>
                )}
              </div>
              
              <div className="scanner-start-row">
                <button 
                  onClick={cameraActive ? stopBarcodeScanner : startBarcodeScanner}
                  className="btn-toggle-camera btn-toggle-camera-centered"
                >
                  {cameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
              </div>
              
              {/* Task 40, 90: Quick scanner controls */}
              {cameraActive && (
                <div className="scanner-quick-controls">
                  {/* Torch toggle */}
                  {hasTorch && (
                    <button 
                      onClick={handleToggleTorch}
                      className={`control-btn ${torchEnabled ? 'active' : ''}`}
                      title={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}
                    >
                      <IconFlash size={20} />
                    </button>
                  )}
                  
                  {/* Sound toggle */}
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`control-btn ${soundEnabled ? 'active' : ''}`}
                    title={soundEnabled ? 'Mute scan sound' : 'Enable scan sound'}
                  >
                    <IconVolume size={20} />
                  </button>
                </div>
              )}
              
              {scanning && (
                <div className="scanning-indicator">
                  <IconLoader size={20} className="spin" />
                  <span>Scanning for barcodes...</span>
                </div>
              )}
              
              {/* Task 62-63: Manual barcode entry fallback */}
              <div className="manual-entry-section">
                <button 
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="btn-link manual-entry-toggle"
                >
                  {showManualEntry ? 'Hide manual entry' : "Can't scan? Enter barcode manually"}
                </button>
                
                {showManualEntry && (
                  <div className="manual-entry-form">
                    <input
                      type="text"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter barcode numbers (8-14 digits)"
                      maxLength={14}
                      className="barcode-input"
                      onKeyDown={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                    />
                    <button 
                      onClick={handleManualBarcodeSubmit}
                      className="btn-primary"
                      disabled={!manualBarcode.trim() || manualBarcode.length < 8}
                    >
                      Look Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Mode - Enhanced (Tasks 101-150) */}
        {scanMode === 'photo' && !scannedProduct && !processing && (
          <div className="scanner-section">
            <div className="scanner-card photo-mode">
              <h2>Take Product Photo</h2>
              <p>Take a clear photo of the product packaging or label</p>
              
              {/* Task 101-103: Photo capture options */}
              <div className="photo-capture-options">
                {/* Option 1: Use device camera directly */}
                <div className="capture-option">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    id="product-camera-input"
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      // Set capture attribute for mobile cameras
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('capture', 'environment');
                        fileInputRef.current.click();
                      }
                    }}
                    className="btn-primary capture-btn"
                  >
                    <IconCamera size={24} />
                    <span>Take Photo</span>
                    <span className="btn-hint">Opens your camera</span>
                  </button>
                </div>
                
                {/* Divider */}
                <div className="capture-divider">
                  <span>or</span>
                </div>
                
                {/* Option 2: Upload from gallery */}
                <div className="capture-option">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="product-gallery-input"
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('product-gallery-input') as HTMLInputElement;
                      if (input) {
                        input.removeAttribute('capture');
                        input.click();
                      }
                    }}
                    className="btn-secondary upload-btn"
                  >
                    <IconUpload size={24} />
                    <span>Upload Photo</span>
                    <span className="btn-hint">From gallery or files</span>
                  </button>
                </div>
              </div>
              
              {/* Task 127: Drag and drop zone */}
              <div 
                className="photo-drop-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('drag-over');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handlePhotoCapture(file);
                  }
                }}
              >
                <IconUpload size={32} strokeWidth={1.5} className="drop-icon" />
                <span>Drag & drop an image here</span>
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

        {/* Processing State with Steps */}
        {processing && (
          <div className="processing-card">
            <div className="processing-animation">
              <div className="processing-ring"></div>
              <IconLoader size={32} className="processing-icon" />
            </div>
            <h3>
              {scanMode === 'barcode' ? 'Looking up product...' : 'Analyzing product image...'}
            </h3>
            <p className="processing-step">{processingStep || 'This may take a few seconds'}</p>
            <div className="processing-steps">
              <div className={`step ${processingStep.includes('Preparing') ? 'active' : processingStep ? 'done' : ''}`}>
                <span className="step-dot"></span>
                <span>Prepare Image</span>
              </div>
              <div className={`step ${processingStep.includes('Analyzing') ? 'active' : processingStep.includes('identified') ? 'done' : ''}`}>
                <span className="step-dot"></span>
                <span>AI Analysis</span>
              </div>
              <div className={`step ${processingStep.includes('identified') ? 'active' : ''}`}>
                <span className="step-dot"></span>
                <span>Get Details</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !processing && (
          <div className="error-card" ref={errorCardRef} role="alert">
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
            <div className="card product-info-card product-result-card">
              <div className="card-header product-found-header">
                <h2><span className="product-found-badge" aria-hidden>✅</span> Product found</h2>
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
                      <div className="confidence-display">
                        <span className="confidence-label">AI Confidence</span>
                        <div className="confidence-bar-container">
                          <div 
                            className="confidence-bar-fill" 
                            style={{ 
                              width: `${Math.round(scannedProduct.confidence * 100)}%`,
                              backgroundColor: scannedProduct.confidence >= 0.8 ? '#22c55e' : 
                                               scannedProduct.confidence >= 0.6 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className="confidence-value">{Math.round(scannedProduct.confidence * 100)}%</span>
                      </div>
                    )}
                    <span className={`source-badge ${scannedProduct.source}`}>
                      {scannedProduct.source === 'barcode' ? 'Barcode Scan' : 'AI Identified'}
                    </span>
                    {scannedProduct.dataSource === 'catalog' && (
                      <span className="source-badge catalog-badge" title="Instant result from product catalog">
                        From catalog
                      </span>
                    )}
                  </div>
                </div>

                {/* Your Skin Match – personalized match % and bullets */}
                {(() => {
                  const matchPct = Math.round(scannedProduct.suitabilityScore ?? 0);
                  const isGood = matchPct >= 70;
                  const isFair = matchPct >= 50 && matchPct < 70;
                  const skinMatchBullets: { type: 'ok' | 'warn'; text: string }[] = [];
                  if (scannedProduct.safetyReport?.is_sensitive_skin_safe) {
                    skinMatchBullets.push({ type: 'ok', text: 'Good for sensitive skin' });
                  }
                  if (scannedProduct.keyIngredients && scannedProduct.keyIngredients.length > 0) {
                    const concerns = scannedProduct.keyIngredients.slice(0, 2).map(ki => ki.name).join(', ');
                    skinMatchBullets.push({ type: 'ok', text: `Addresses: ${concerns}` });
                  } else {
                    skinMatchBullets.push({ type: 'ok', text: 'Suitable for daily care' });
                  }
                  const fragranceOrWarning = scannedProduct.warnings?.find(w =>
                    /fragrance|parfum|perfume|scent/i.test(w)
                  ) || scannedProduct.safetyReport?.flagged_ingredients?.find(f =>
                    /fragrance|parfum|perfume/i.test(f.name)
                  );
                  if (fragranceOrWarning) {
                    const warnText = typeof fragranceOrWarning === 'string'
                      ? fragranceOrWarning
                      : `Contains ${(fragranceOrWarning as FlaggedIngredient).name}`;
                    skinMatchBullets.push({ type: 'warn', text: warnText });
                  } else if (scannedProduct.safetyReport && scannedProduct.safetyReport.total_flagged > 0) {
                    skinMatchBullets.push({
                      type: 'warn',
                      text: `${scannedProduct.safetyReport.total_flagged} ingredient(s) to review below`
                    });
                  }
                  const dontMixWith: string[] = [];
                  scannedProduct.safetyReport?.recommendations?.forEach((r) => {
                    const lower = r.toLowerCase();
                    if (lower.includes("don't") && lower.includes("with") || lower.includes('avoid') && lower.includes('together') || lower.includes('retinol') || lower.includes('vitamin c') || lower.includes('aha') || lower.includes('bha')) {
                      dontMixWith.push(r);
                    }
                  });
                  scannedProduct.safetyReport?.flagged_ingredients?.forEach((f) => {
                    f.avoid_if?.forEach((a) => { if (a && !dontMixWith.includes(a)) dontMixWith.push(a); });
                  });
                  return (
                    <>
                    <div className={`skin-match-card ${isGood ? 'good' : isFair ? 'fair' : 'low'}`}>
                      <h3 className="skin-match-title">🎯 {matchPct}% match for you</h3>
                      <div className="skin-match-bar-wrap">
                        <div className="skin-match-bar" style={{ width: `${matchPct}%` }} />
                      </div>
                      <p className="skin-match-sub">Good for you</p>
                      <ul className="skin-match-bullets">
                        {skinMatchBullets.filter(b => b.type === 'ok').map((b, i) => (
                          <li key={i}>✅ {b.text}</li>
                        ))}
                      </ul>
                      {(skinMatchBullets.some(b => b.type === 'warn') || dontMixWith.length > 0) && (
                        <>
                          <p className="skin-match-sub">Watch out</p>
                          <ul className="skin-match-bullets skin-match-watch">
                            {skinMatchBullets.filter(b => b.type === 'warn').map((b, i) => (
                              <li key={i}>⚠️ {b.text}</li>
                            ))}
                            {dontMixWith.slice(0, 3).map((text, i) => (
                              <li key={`dm-${i}`}>⚠️ Don&apos;t mix with: {text}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                    <div className="how-to-use-card">
                      <h3 className="how-to-use-title">📋 How to use</h3>
                      <ul className="how-to-use-list">
                        <li>{getUsageTime(scannedProduct.category)}</li>
                        <li>{getStepOrder(scannedProduct.category)}</li>
                        <li>{getAmount(scannedProduct.category)}</li>
                      </ul>
                    </div>
                    </>
                  );
                })()}

                {/* Ingredient conflict with shelf */}
                {(() => {
                  const conflict = getShelfConflict(scannedProduct.ingredients, scannedProduct.name, shelfProducts);
                  if (!conflict) return null;
                  return (
                    <div className="ingredient-conflict-card" role="alert">
                      <h3 className="ingredient-conflict-title"><IconAlertTriangle size={20} strokeWidth={2} className="icon-inline" /> Ingredient alert</h3>
                      <p className="ingredient-conflict-text">
                        This product may conflict with <strong>{conflict.productName}</strong> on your shelf.
                      </p>
                      <p className="ingredient-conflict-advice">{conflict.message}</p>
                    </div>
                  );
                })()}

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

                {/* Flagged Harmful Ingredients */}
                {scannedProduct.safetyReport && scannedProduct.safetyReport.flagged_ingredients.length > 0 && (
                  <div className="flagged-ingredients-section">
                    <h3>
                      <IconAlertTriangle size={20} strokeWidth={2} className="icon-inline warning-icon" />
                      Ingredient Safety Concerns ({scannedProduct.safetyReport.total_flagged})
                    </h3>
                    
                    <div className="flagged-list">
                      {scannedProduct.safetyReport.flagged_ingredients.map((flagged, idx) => (
                        <div key={idx} className={`flagged-item severity-${flagged.severity}`}>
                          <div className="flagged-header">
                            <span className="flagged-name">{flagged.name}</span>
                            <span className={`severity-badge ${flagged.severity}`}>
                              {flagged.severity === 'high' ? '⚠️ Avoid' : 
                               flagged.severity === 'moderate' ? '⚡ Caution' : 'ℹ️ Note'}
                            </span>
                          </div>
                          <p className="flagged-reason">{flagged.reason}</p>
                          <div className="flagged-categories">
                            {flagged.categories.map((cat, catIdx) => (
                              <span key={catIdx} className="category-tag">
                                {cat.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                          {flagged.alternatives.length > 0 && flagged.alternatives[0] !== "None - avoid completely" && (
                            <div className="flagged-alternatives">
                              <strong>Safer alternatives:</strong> {flagged.alternatives.join(', ')}
                            </div>
                          )}
                          {flagged.avoid_if.length > 0 && (
                            <div className="flagged-avoid">
                              <strong>Extra caution for:</strong> {flagged.avoid_if.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Safety Recommendations */}
                    {scannedProduct.safetyReport.recommendations.length > 0 && (
                      <div className="safety-recommendations">
                        <h4>Recommendations</h4>
                        <ul>
                          {scannedProduct.safetyReport.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Safety Badges */}
                    <div className="safety-badges">
                      {scannedProduct.safetyReport.is_pregnancy_safe && (
                        <span className="safety-badge safe">🤰 Pregnancy Safe</span>
                      )}
                      {!scannedProduct.safetyReport.is_pregnancy_safe && (
                        <span className="safety-badge warning">🤰 Check with Doctor</span>
                      )}
                      {scannedProduct.safetyReport.is_sensitive_skin_safe && (
                        <span className="safety-badge safe">✓ Sensitive Skin Friendly</span>
                      )}
                      {!scannedProduct.safetyReport.is_sensitive_skin_safe && (
                        <span className="safety-badge warning">⚡ May Irritate Sensitive Skin</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Simple Warnings (legacy) */}
                {scannedProduct.warnings.length > 0 && !scannedProduct.safetyReport && (
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
                <div className="product-actions product-actions-grid">
                  {addedToShelf ? (
                    <button className="btn-success product-action-btn" disabled>
                      <IconCheck size={18} strokeWidth={2} className="icon-inline" />
                      Added to Shelf!
                    </button>
                  ) : addingToShelf ? (
                    <button className="btn-primary product-action-btn" disabled>
                      <IconLoader size={18} strokeWidth={2} className="icon-inline spin" />
                      Adding...
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (scannedProduct && isOnShelf(scannedProduct.id)) {
                          handleAddToShelf();
                        } else {
                          setShowTrackModal(true);
                        }
                      }}
                      className="btn-primary product-action-btn"
                      disabled={!token}
                    >
                      <IconPackage size={18} strokeWidth={2} className="icon-inline" />
                      Add to Shelf
                    </button>
                  )}
                  <Link
                    to="/routine-builder"
                    state={{ addProduct: { name: scannedProduct.name, category: scannedProduct.category, suggestedStep: getStepOrder(scannedProduct.category) } }}
                    className="btn-secondary product-action-btn product-action-routine"
                  >
                    <IconCheck size={18} strokeWidth={2} className="icon-inline" />
                    Add to Routine
                  </Link>
                  <button onClick={handleReset} className="btn-secondary product-action-btn product-action-scan">
                    Scan Another
                  </button>
                </div>
                
                {/* Track this product – opened date + PAO for expiry */}
                {showTrackModal && scannedProduct && (
                  <div className="track-product-modal-overlay" role="dialog" aria-labelledby="track-product-title" aria-modal="true">
                    <div className="track-product-modal">
                      <h3 id="track-product-title">📅 Track this product</h3>
                      <p className="track-product-desc">We&apos;ll remind you when it expires.</p>
                      <div className="track-product-field">
                        <label htmlFor="track-opened">When did you open it?</label>
                        <input
                          id="track-opened"
                          type="date"
                          value={trackOpenedDate}
                          onChange={(e) => setTrackOpenedDate(e.target.value)}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div className="track-product-field">
                        <label htmlFor="track-pao">PAO (Period After Opening)</label>
                        <select
                          id="track-pao"
                          value={trackPAOMonths}
                          onChange={(e) => setTrackPAOMonths(Number(e.target.value))}
                        >
                          <option value={3}>3 months</option>
                          <option value={6}>6 months</option>
                          <option value={12}>12 months</option>
                          <option value={18}>18 months</option>
                          <option value={24}>24 months</option>
                        </select>
                      </div>
                      <div className="track-product-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            const d = new Date(trackOpenedDate);
                            d.setMonth(d.getMonth() + trackPAOMonths);
                            handleAddToShelf(d.toISOString().slice(0, 10));
                          }}
                          disabled={addingToShelf}
                        >
                          {addingToShelf ? 'Adding...' : 'Add with expiry'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleAddToShelf()}
                          disabled={addingToShelf}
                        >
                          Add without tracking
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => setShowTrackModal(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!token && (
                  <p className="login-hint">
                    <Link to="/auth">Log in</Link> to save products to your shelf
                  </p>
                )}
                <div className="view-details-row">
                  <Link 
                    to={`/product/${encodeURIComponent(scannedProduct.barcode || scannedProduct.id)}`} 
                    className="btn-view-details"
                  >
                    View full product details →
                  </Link>
                </div>
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

      {/* Scan History */}
      {scanHistory.length > 0 && !scannedProduct && !processing && (
        <section className="scan-history-section">
          <div className="section-header">
            <h2>Recently Scanned</h2>
            <p className="scan-history-subtitle">Your last {scanHistory.length} scanned <span style={{ whiteSpace: 'nowrap' }}>product{scanHistory.length !== 1 ? 's' : ''}</span></p>
          </div>
          
          <div className="history-grid">
            {scanHistory.map((item) => (
              <div 
                key={item.id} 
                className="history-card"
                onClick={() => navigate(`/product/${item.barcode || item.id}`)}
                role="button"
                tabIndex={0}
              >
                <div className="history-image">
                  <img 
                    src={item.imageUrl || placeholderImage} 
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = placeholderImage;
                    }}
                  />
                </div>
                <div className="history-details">
                  <h4>{item.name}</h4>
                  <p className="history-brand">{item.brand}</p>
                  <span className={`history-badge ${item.source}`}>
                    {item.source === 'barcode' ? 'Barcode' : 'Photo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductScannerPage;
