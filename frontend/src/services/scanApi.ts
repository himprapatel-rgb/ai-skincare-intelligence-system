import { apiClient } from './api';
import {
  ScanSessionInit,
  ScanUploadRequest,
  ScanUploadResponse,
  ScanAnalysisResult,
} from '../types/scan';

export class ScanApiService {
  /**
   * Initialize a new scan session
   */
  static async initSession(): Promise<ScanSessionInit> {
    const response = await apiClient.post<ScanSessionInit>('/api/scan/init');
    return response.data;
  }

  /**
   * Upload face scan image for analysis
   */
  static async uploadScan(request: ScanUploadRequest): Promise<ScanUploadResponse> {
    const response = await apiClient.post<ScanUploadResponse>('/api/scan/upload', request);
    return response.data;
  }

  /**
   * Get scan analysis results
   */
  static async getResults(sessionId: string): Promise<ScanAnalysisResult> {
    const response = await apiClient.get<ScanAnalysisResult>(`/api/scan/${sessionId}/result`);
    return response.data;
  }

  /**
   * Poll for results with timeout
   */
  static async pollResults(
    sessionId: string,
    maxAttempts: number = 20,
    interval: number = 2000
  ): Promise<ScanAnalysisResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getResults(sessionId);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }
      
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    
    throw new Error('Scan analysis timeout - please try again');
  }
}
