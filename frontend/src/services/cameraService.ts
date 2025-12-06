/**
 * Camera Service
 * Handles webcam access and image capture for face scanning
 */

export interface CameraConstraints {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    facingMode: string;
  };
}

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Initialize camera with constraints
   */
  async initializeCamera(
    videoElement: HTMLVideoElement,
    constraints?: CameraConstraints
  ): Promise<MediaStream> {
    try {
      this.videoElement = videoElement;
      
      const defaultConstraints: CameraConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints
      );

      videoElement.srcObject = this.stream;
      await videoElement.play();

      return this.stream;
    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw new Error(
        error instanceof Error 
          ? `Camera access denied: ${error.message}`
          : 'Camera access denied'
      );
    }
  }

  /**
   * Capture image from video stream
   */
  captureImage(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.videoElement || !this.stream) {
        reject(new Error('Camera not initialized'));
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(this.videoElement, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/jpeg', 0.95);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }
}

export const cameraService = new CameraService();
