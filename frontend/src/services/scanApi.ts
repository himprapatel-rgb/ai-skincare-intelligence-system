import { apiClient } from './api';

export interface ScanInitResponse {
  scan_id: number;
  status: string;
  created_at: string;
}

export interface ScanUploadResponse {
  scan_id: number;
  status: string;
  image_path: string;
}

export interface ScanStatusResponse {
  scan_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ScanResultResponse {
  scan_id: number;
  status: string;
  result: {
    scan_id: number;
    status: string;
    skin_mood: string;
    scores: {
      redness: number;
      acne: number;
      pigmentation: number;
      dehydration: number;
      sensitivity: number;
    };
    recommendations: {
      summary: string;
      priority_actions: string[];
    };
    generated_at: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Scan API Service
 * Handles all scan-related API calls to the backend
 */
export class ScanApiService {
  /**
   * Initialize a new scan session
   */
  static async initScan(): Promise<ScanInitResponse> {
    const response = await apiClient.post<ScanInitResponse>('/api/v1/scan/init');
    return response.data;
  }

  /**
   * Upload face scan image for analysis
   */
  static async uploadScan(scanId: number, imageBlob: Blob): Promise<ScanUploadResponse> {
    const formData = new FormData();
    formData.append('file', imageBlob, 'face-scan.jpg');

    const response = await apiClient.post<ScanUploadResponse>(
      `/api/v1/scan/${scanId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Get scan status
   */
  static async getScanStatus(scanId: number): Promise<ScanStatusResponse> {
    const response = await apiClient.get<ScanStatusResponse>(
      `/api/v1/scan/${scanId}/status`
    );
    return response.data;
  }

  /**
   * Get scan analysis results
   */
  static async getResults(scanId: number): Promise<ScanResultResponse> {
    const response = await apiClient.get<ScanResultResponse>(
      `/api/v1/scan/${scanId}/results`
    );
    return response.data;
  }

  /**
   * Poll for results with timeout
   */
  static async pollResults(
    scanId: number,
    maxAttempts: number = 30,
    interval: number = 2000
  ): Promise<ScanResultResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getScanStatus(scanId);
      
      if (status.status === 'completed') {
        return await this.getResults(scanId);
      }
      
      if (status.status === 'failed') {
        throw new Error('Scan analysis failed - please try again');
      }
      
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    
    throw new Error('Scan analysis timeout - please try again');
  }
}

// Export singleton instance
export const scanApi = ScanApiService;
