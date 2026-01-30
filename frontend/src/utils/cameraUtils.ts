/**
 * Camera Utilities for Product Scanner
 * Tasks 1-25: Camera Access & Permissions
 */

// Camera permission status
export type CameraPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable' | 'unknown';

// Camera error types for specific messaging
export enum CameraErrorType {
  PERMISSION_DENIED = 'permission_denied',
  NOT_FOUND = 'not_found',
  INSECURE_CONTEXT = 'insecure_context',
  IN_USE = 'in_use',
  OVERCONSTRAINED = 'overconstrained',
  NOT_SUPPORTED = 'not_supported',
  UNKNOWN = 'unknown'
}

// Camera capability info
export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  hasFlash: boolean;
  hasZoom: boolean;
  supportedResolutions: string[];
  facingModes: string[];
}

// Stored camera preference
const CAMERA_PREFERENCE_KEY = 'pellicura_camera_preference';

/**
 * Task 6, 7: Check camera permission status
 */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  try {
    // Check if permissions API is available
    if (!navigator.permissions) {
      return 'unknown';
    }
    
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state as CameraPermissionStatus;
  } catch {
    // Permissions API not supported for camera
    return 'unknown';
  }
}

/**
 * Task 11: Check if page is served over HTTPS (required for camera)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

/**
 * Task 12: Check if running on localhost (development exception)
 */
export function isLocalhost(): boolean {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname === '[::1]';
}

/**
 * Task 15: Detect camera capabilities
 */
export async function getCameraCapabilities(): Promise<CameraCapabilities> {
  const capabilities: CameraCapabilities = {
    hasCamera: false,
    hasFrontCamera: false,
    hasBackCamera: false,
    hasFlash: false,
    hasZoom: false,
    supportedResolutions: [],
    facingModes: []
  };
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return capabilities;
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    capabilities.hasCamera = videoDevices.length > 0;
    
    // Check for front/back cameras
    for (const device of videoDevices) {
      const label = device.label.toLowerCase();
      if (label.includes('front') || label.includes('user') || label.includes('facetime')) {
        capabilities.hasFrontCamera = true;
        capabilities.facingModes.push('user');
      }
      if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
        capabilities.hasBackCamera = true;
        capabilities.facingModes.push('environment');
      }
    }
    
    // If we have cameras but couldn't detect type, assume we have at least one type
    if (capabilities.hasCamera && !capabilities.hasFrontCamera && !capabilities.hasBackCamera) {
      capabilities.hasFrontCamera = true;
      capabilities.facingModes.push('user');
    }
    
    return capabilities;
  } catch {
    return capabilities;
  }
}

/**
 * Task 28: Store camera preference
 */
export function saveCameraPreference(facingMode: 'user' | 'environment'): void {
  try {
    localStorage.setItem(CAMERA_PREFERENCE_KEY, facingMode);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Task 28: Get stored camera preference
 */
export function getCameraPreference(): 'user' | 'environment' | null {
  try {
    const pref = localStorage.getItem(CAMERA_PREFERENCE_KEY);
    if (pref === 'user' || pref === 'environment') {
      return pref;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Task 29: Detect if on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Task 1, 14: Parse camera error and return specific type
 */
export function parseCameraError(error: unknown): { type: CameraErrorType; message: string } {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorName = error instanceof Error ? error.name : '';
  
  // Permission denied
  if (errorMessage.includes('permission') || 
      errorMessage.includes('denied') || 
      errorMessage.includes('notallowed') ||
      errorName === 'NotAllowedError') {
    return {
      type: CameraErrorType.PERMISSION_DENIED,
      message: 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.'
    };
  }
  
  // Camera not found
  if (errorMessage.includes('notfound') || 
      errorMessage.includes('no camera') || 
      errorMessage.includes('no video') ||
      errorName === 'NotFoundError') {
    return {
      type: CameraErrorType.NOT_FOUND,
      message: 'No camera found. Please make sure your device has a camera and it is not being used by another application.'
    };
  }
  
  // Insecure context
  if (errorMessage.includes('insecure') || 
      errorMessage.includes('https') ||
      errorName === 'SecurityError') {
    return {
      type: CameraErrorType.INSECURE_CONTEXT,
      message: 'Camera requires a secure connection (HTTPS). Please access this page using HTTPS.'
    };
  }
  
  // Camera in use
  if (errorMessage.includes('busy') || 
      errorMessage.includes('in use') || 
      errorMessage.includes('already') ||
      errorName === 'NotReadableError') {
    return {
      type: CameraErrorType.IN_USE,
      message: 'Camera is being used by another application. Please close other apps using the camera and try again.'
    };
  }
  
  // Overconstrained
  if (errorMessage.includes('constraint') || 
      errorMessage.includes('overconstrained') ||
      errorName === 'OverconstrainedError') {
    return {
      type: CameraErrorType.OVERCONSTRAINED,
      message: 'Camera settings not supported. Please try again with a different camera if available.'
    };
  }
  
  // Not supported
  if (errorMessage.includes('notsupported') || 
      !navigator.mediaDevices) {
    return {
      type: CameraErrorType.NOT_SUPPORTED,
      message: 'Camera is not supported in this browser. Please try using Chrome, Safari, or Firefox.'
    };
  }
  
  // Unknown error
  return {
    type: CameraErrorType.UNKNOWN,
    message: 'Could not access camera. Please check that camera permissions are allowed and no other app is using the camera.'
  };
}

/**
 * Task 10: Get browser-specific camera instructions
 */
export function getBrowserCameraInstructions(): string {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('chrome') && !ua.includes('edge')) {
    return 'Chrome: Click the camera icon in the address bar, or go to Settings > Privacy and Security > Site Settings > Camera';
  }
  if (ua.includes('firefox')) {
    return 'Firefox: Click the camera icon in the address bar, or go to Settings > Privacy & Security > Permissions > Camera';
  }
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari: Go to Safari > Settings for This Website > Camera, or System Preferences > Security & Privacy > Camera';
  }
  if (ua.includes('edge')) {
    return 'Edge: Click the lock icon in the address bar, then Camera permissions, or go to Settings > Site permissions > Camera';
  }
  
  return 'Please check your browser settings to allow camera access for this website.';
}

/**
 * Task 2, 4: Request camera permission with user-friendly prompt
 */
export async function requestCameraPermission(): Promise<{
  granted: boolean;
  stream?: MediaStream;
  error?: { type: CameraErrorType; message: string };
}> {
  // Check secure context first
  if (!isSecureContext() && !isLocalhost()) {
    return {
      granted: false,
      error: {
        type: CameraErrorType.INSECURE_CONTEXT,
        message: 'Camera requires HTTPS. Please use a secure connection.'
      }
    };
  }
  
  // Check if mediaDevices is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: {
        type: CameraErrorType.NOT_SUPPORTED,
        message: 'Camera is not supported in this browser.'
      }
    };
  }
  
  try {
    // Try to get back camera first for product scanning
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    return { granted: true, stream };
  } catch (error) {
    const parsed = parseCameraError(error);
    return { granted: false, error: parsed };
  }
}

/**
 * Task 8: Retry camera initialization with fallback
 */
export async function retryWithFallback(
  maxRetries: number = 3
): Promise<{ stream: MediaStream | null; facingMode: string }> {
  const attempts = [
    { facingMode: 'environment' as const, label: 'back camera' },
    { facingMode: 'user' as const, label: 'front camera' },
    { facingMode: undefined, label: 'any camera' }
  ];
  
  for (let retry = 0; retry < maxRetries; retry++) {
    for (const attempt of attempts) {
      try {
        const constraints: MediaStreamConstraints = {
          video: attempt.facingMode 
            ? { facingMode: attempt.facingMode }
            : true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return { stream, facingMode: attempt.facingMode || 'unknown' };
      } catch {
        // Continue to next attempt
      }
    }
    
    // Wait before retry
    await new Promise(r => setTimeout(r, 500));
  }
  
  return { stream: null, facingMode: '' };
}

/**
 * Task 19: Camera warm-up delay to prevent black screen
 */
export function warmUpDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Task 21, 22: Get optimal camera constraints based on device
 */
export function getOptimalConstraints(
  purpose: 'barcode' | 'product' | 'face',
  preferredFacing?: 'user' | 'environment'
): MediaStreamConstraints {
  const isMobile = isMobileDevice();
  
  // Determine facing mode
  let facingMode: 'user' | 'environment';
  if (preferredFacing) {
    facingMode = preferredFacing;
  } else if (purpose === 'face') {
    facingMode = 'user'; // Front camera for face scans
  } else {
    facingMode = isMobile ? 'environment' : 'user'; // Back camera for products on mobile
  }
  
  // Determine resolution based on purpose
  let width: number, height: number;
  if (purpose === 'barcode') {
    // Lower resolution for faster barcode scanning
    width = 640;
    height = 480;
  } else if (purpose === 'product') {
    // Higher resolution for AI product identification
    width = 1280;
    height = 960;
  } else {
    // Medium resolution for face
    width = 1024;
    height = 768;
  }
  
  return {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: width },
      height: { ideal: height },
      aspectRatio: { ideal: width / height }
    },
    audio: false
  };
}

/**
 * Task 40: Check if torch/flash is available
 */
export async function hasTorchSupport(stream: MediaStream): Promise<boolean> {
  try {
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    
    const capabilities = track.getCapabilities?.();
    return capabilities?.torch === true;
  } catch {
    return false;
  }
}

/**
 * Task 40: Toggle torch/flash
 */
export async function toggleTorch(stream: MediaStream, enabled: boolean): Promise<boolean> {
  try {
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    
    await track.applyConstraints({
      // @ts-expect-error - torch is not in standard types
      advanced: [{ torch: enabled }]
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Task 24: Apply zoom to camera
 */
export async function setZoom(stream: MediaStream, zoomLevel: number): Promise<boolean> {
  try {
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    
    const capabilities = track.getCapabilities?.();
    // @ts-expect-error - zoom is not in standard types
    if (!capabilities?.zoom) return false;
    
    // @ts-expect-error - zoom is not in standard types
    const { min, max } = capabilities.zoom;
    const clampedZoom = Math.max(min, Math.min(max, zoomLevel));
    
    await track.applyConstraints({
      // @ts-expect-error - zoom is not in standard types
      advanced: [{ zoom: clampedZoom }]
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Task 23: Switch between cameras
 */
export async function switchCamera(
  currentStream: MediaStream | null,
  newFacingMode: 'user' | 'environment'
): Promise<{ stream: MediaStream | null; error?: string }> {
  // Stop current stream
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: newFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    // Save preference
    saveCameraPreference(newFacingMode);
    
    return { stream };
  } catch (error) {
    // Try with 'ideal' instead of 'exact'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: newFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      return { stream };
    } catch {
      const parsed = parseCameraError(error);
      return { stream: null, error: parsed.message };
    }
  }
}
