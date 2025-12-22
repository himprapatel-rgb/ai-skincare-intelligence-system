/**
 * TypeScript types for Sprint 2 Face Scan AI Analysis
 * Aligned with backend schemas in backend/app/schemas/scan.py
 */

// Fitzpatrick skin type classification
export enum FitzpatrickType {
  TYPE_I = 'I',
  TYPE_II = 'II',
  TYPE_III = 'III',
  TYPE_IV = 'IV',
  TYPE_V = 'V',
  TYPE_VI = 'VI'
}

// Skin concern categories (9 categories as per SRS)
export enum SkinConcernType {
  ACNE = 'acne',
  WRINKLES = 'wrinkles',
  DARK_SPOTS = 'dark_spots',
  REDNESS = 'redness',
  DRYNESS = 'dryness',
  OILINESS = 'oiliness',
  DARK_CIRCLES = 'dark_circles',
  PORES = 'pores',
  TEXTURE = 'texture'
}

// Scan session status
export enum ScanStatus {
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Face detection result
export interface FaceDetection {
  detected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number }>;
}

// Lighting quality assessment
export interface LightingQuality {
  score: number; // 0-100
  isAcceptable: boolean;
  feedback: string;
}

// Skin concern detection result
export interface SkinConcernDetection {
  type: SkinConcernType;
  severity: number; // 0-100
  confidence: number; // 0-1
  uncertaintyEstimate?: number; // 0-1
  affectedAreas?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

// Fairness metrics
export interface FairnessMetrics {
  fitzpatrickType: FitzpatrickType;
  skinToneConfidence: number;
  biasDetected: boolean;
  adjustmentApplied: boolean;
  notes?: string;
}

// Scan session initialization
export interface ScanSessionInit {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// Complete scan analysis result
export interface ScanAnalysisResult {
  sessionId: string;
  userId: string;
  status: ScanStatus;
  faceDetection: FaceDetection;
  lightingQuality: LightingQuality;
  skinConcerns: SkinConcernDetection[];
  fairnessMetrics: FairnessMetrics;
  overallConfidence: number;
  recommendations?: string[];
  createdAt: string;
  completedAt?: string;
}

// Scan upload request
export interface ScanUploadRequest {
  sessionId: string;
  imageData: string; // base64 encoded
  metadata: {
    captureTimestamp: string;
    deviceType?: string;
    lightingCondition?: string;
  };
}

// Scan upload response
export interface ScanUploadResponse {
  sessionId: string;
  status: ScanStatus;
  message: string;
  analysisId?: string;
}

// API Error response
export interface ApiError {
  detail: string;
  status: number;
  timestamp: string;
}


// Scan init response
export interface ScanInitResponse {
  session_id: string;
}
