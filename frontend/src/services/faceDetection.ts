/**
 * Face Detection Service
 * Client-side face validation before sending to backend
 */

export interface FaceDetectionResult {
  faceDetected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  warning?: string;
}

export class FaceDetectionService {
  /**
   * Validate if image contains a face using basic heuristics
   * Note: For MVP, we use simple checks. Production would use ML models
   */
  async validateFace(imageBlob: Blob): Promise<FaceDetectionResult> {
    try {
      // Convert blob to image for analysis
      const imageData = await this.loadImage(imageBlob);
      
      // Basic validation checks
      const sizeCheck = this.validateImageSize(imageData);
      if (!sizeCheck.valid) {
        return {
          faceDetected: false,
          confidence: 0,
          warning: sizeCheck.message
        };
      }

      const brightnessCheck = this.validateBrightness(imageData);
      if (!brightnessCheck.valid) {
        return {
          faceDetected: true,
          confidence: 0.5,
          warning: brightnessCheck.message
        };
      }

      // For MVP: Return optimistic result
      // Backend will perform actual face detection with ML
      return {
        faceDetected: true,
        confidence: 0.85,
        boundingBox: {
          x: imageData.width * 0.25,
          y: imageData.height * 0.15,
          width: imageData.width * 0.5,
          height: imageData.height * 0.7
        }
      };
    } catch (error) {
      console.error('Face validation failed:', error);
      return {
        faceDetected: false,
        confidence: 0,
        warning: 'Failed to process image'
      };
    }
  }

  /**
   * Load image blob into canvas for analysis
   */
  private loadImage(blob: Blob): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(imageData);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Validate image dimensions
   */
  private validateImageSize(imageData: ImageData): { valid: boolean; message?: string } {
    const minWidth = 640;
    const minHeight = 480;

    if (imageData.width < minWidth || imageData.height < minHeight) {
      return {
        valid: false,
        message: `Image too small. Minimum ${minWidth}x${minHeight} required`
      };
    }

    return { valid: true };
  }

  /**
   * Check image brightness to ensure adequate lighting
   */
  private validateBrightness(imageData: ImageData): { valid: boolean; message?: string } {
    const { data, width, height } = imageData;
    let totalBrightness = 0;
    const sampleSize = 100; // Sample pixels for performance
    const step = Math.floor((width * height) / sampleSize);

    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Calculate perceived brightness
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / sampleSize;

    if (avgBrightness < 50) {
      return {
        valid: false,
        message: 'Image too dark. Please ensure good lighting'
      };
    }

    if (avgBrightness > 240) {
      return {
        valid: false,
        message: 'Image too bright. Reduce lighting or exposure'
      };
    }

    return { valid: true };
  }

  /**
   * Get quality recommendations for user
   */
  getQualityGuidelines(): string[] {
    return [
      'Ensure your face is well-lit',
      'Look directly at the camera',
      'Remove glasses if possible',
      'Keep a neutral expression',
      'Fill the frame with your face',
      'Avoid shadows on your face'
    ];
  }
}

export const faceDetectionService = new FaceDetectionService();
