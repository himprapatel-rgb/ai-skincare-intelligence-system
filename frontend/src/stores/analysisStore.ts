import { create } from 'zustand';
import axios from 'axios';

export interface Analysis {
  id: string;
  userId: string;
  imageUrl: string;
  skinType: string;
  severity: number;
  conditions: string[];
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisState {
  // State
  currentAnalysis: Analysis | null;
  analyses: Analysis[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;

  // Actions
  setCurrentAnalysis: (analysis: Analysis | null) => void;
  setAnalyses: (analyses: Analysis[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUploadProgress: (progress: number) => void;

  // API Methods
  uploadImage: (file: File, token: string) => Promise<Analysis>;
  getAnalysis: (id: string, token: string) => Promise<Analysis>;
  getHistory: (token: string) => Promise<Analysis[]>;
  deleteAnalysis: (id: string, token: string) => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // Initial State
  currentAnalysis: null,
  analyses: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,

  // Setters
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setAnalyses: (analyses) => set({ analyses }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  // API Methods
  uploadImage: async (file, token) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/analysis/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            set({ uploadProgress: progress });
          },
        }
      );

      const analysis = response.data;
      set({
        currentAnalysis: analysis,
        isLoading: false,
        uploadProgress: 100,
      });
      return analysis;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Upload failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  getAnalysis: async (id, token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analysis/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const analysis = response.data;
      set({ currentAnalysis: analysis, isLoading: false });
      return analysis;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch analysis';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getHistory: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analysis/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const analyses = response.data;
      set({ analyses, isLoading: false });
      return analyses;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch history';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteAnalysis: async (id, token) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(
        `${API_BASE_URL}/analysis/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { analyses, currentAnalysis } = get();
      set({
        analyses: analyses.filter((a) => a.id !== id),
        currentAnalysis: currentAnalysis?.id === id ? null : currentAnalysis,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Delete failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
