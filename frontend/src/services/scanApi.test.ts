import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanApiService } from './scanApi';
import { apiClient } from './api';

// Mock the apiClient
vi.mock('./api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('ScanApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initScan', () => {
    it('should call POST /api/v1/scan/init and return scan_id', async () => {
      const mockResponse = {
        data: {
          scan_id: 123,
          status: 'pending',
          created_at: '2025-12-19T09:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await ScanApiService.initScan();

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/scan/init');
      expect(result).toEqual(mockResponse.data);
      expect(result.scan_id).toBe(123);
    });
  });

  describe('uploadScan', () => {
    it('should upload image as FormData', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      const mockResponse = {
        data: {
          scan_id: 123,
          status: 'processing',
          image_path: '/media/uploads/123.jpg',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await ScanApiService.uploadScan(123, mockBlob);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/scan/123/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
      expect(result.status).toBe('processing');
    });
  });

  describe('getScanStatus', () => {
    it('should fetch scan status', async () => {
      const mockResponse = {
        data: {
          scan_id: 123,
          status: 'completed',
          created_at: '2025-12-19T09:00:00Z',
          updated_at: '2025-12-19T09:01:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await ScanApiService.getScanStatus(123);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/scan/123/status');
      expect(result.status).toBe('completed');
    });
  });

  describe('getResults', () => {
    it('should fetch completed scan results', async () => {
      const mockResponse = {
        data: {
          scan_id: 123,
          status: 'completed',
          result: {
            scan_id: 123,
            status: 'completed',
            skin_mood: 'balanced',
            scores: {
              redness: 25,
              acne: 15,
              pigmentation: 30,
              dehydration: 20,
              sensitivity: 10,
            },
            recommendations: {
              summary: 'Your skin is balanced',
              priority_actions: ['Use SPF daily'],
            },
            generated_at: '2025-12-19T09:01:00Z',
          },
          created_at: '2025-12-19T09:00:00Z',
          updated_at: '2025-12-19T09:01:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await ScanApiService.getResults(123);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/scan/123/results');
      expect(result.result.skin_mood).toBe('balanced');
    });
  });

  describe('pollResults', () => {
    it('should poll until status is completed', async () => {
      const statusPending = {
        data: { scan_id: 123, status: 'processing', created_at: '2025-12-19T09:00:00Z', updated_at: '2025-12-19T09:00:30Z' },
      };
      const statusCompleted = {
        data: { scan_id: 123, status: 'completed', created_at: '2025-12-19T09:00:00Z', updated_at: '2025-12-19T09:01:00Z' },
      };
      const resultsResponse = {
        data: {
          scan_id: 123,
          status: 'completed',
          result: { skin_mood: 'balanced', scores: {}, recommendations: {} },
        },
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(statusPending)
        .mockResolvedValueOnce(statusCompleted)
        .mockResolvedValueOnce(resultsResponse);

      const result = await ScanApiService.pollResults(123, 5, 100);

      expect(apiClient.get).toHaveBeenCalledTimes(3);
      expect(result.status).toBe('completed');
    });

    it('should throw error on timeout', async () => {
      const statusProcessing = {
        data: { scan_id: 123, status: 'processing', created_at: '2025-12-19T09:00:00Z', updated_at: '2025-12-19T09:00:30Z' },
      };

      vi.mocked(apiClient.get).mockResolvedValue(statusProcessing);

      await expect(ScanApiService.pollResults(123, 2, 10)).rejects.toThrow(
        'Scan analysis timeout - please try again'
      );
    });
  });
});
