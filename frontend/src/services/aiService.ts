/**
 * AI Intelligence Service — Frontend API client
 *
 * Connects to all /api/v1/ai/* endpoints for AI-powered features:
 * - Product recommendations
 * - Routine generation
 * - Ingredient analysis
 * - Smart notifications
 * - Content curation
 * - Skin prediction
 * - Before/after comparison
 * - Trend detection
 */

import { api } from './api';

// ============================================================================
// Types
// ============================================================================

export interface AIRecommendation {
  name: string;
  brand: string;
  category: string;
  ai_score: number;
  ai_reason: string;
}

export interface AIRoutineStep {
  step: number;
  category: string;
  product: string;
  why: string;
  duration?: string;
}

export interface AIRoutine {
  morning: AIRoutineStep[];
  evening: AIRoutineStep[];
  tips: string[];
  missing_products: string[];
}

export interface AIIngredientHighlight {
  ingredient: string;
  role: string;
  rating: 'beneficial' | 'neutral' | 'caution' | 'avoid';
  note: string;
}

export interface AIIngredientAnalysis {
  overall_rating: string;
  score: number;
  highlights: AIIngredientHighlight[];
  concerns: string[];
  recommendations: string[];
}

export interface AISmartNotification {
  type: 'trend_alert' | 'reminder' | 'tip' | 'milestone';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIScanComparison {
  overall_progress: string;
  score_change: number;
  improvements: string[];
  regressions: string[];
  unchanged: string[];
  insights: string;
  next_steps: string[];
}

export interface AIPrediction {
  predicted_metrics: Record<string, number>;
  confidence: number;
  key_changes: string[];
  recommendations: string[];
}

export interface AITrend {
  patterns: Array<{ type: string; description: string; metrics_affected: string[] }>;
  insights: string;
  recommendations: string[];
  predicted_next_change?: string;
}

// ============================================================================
// API Calls
// ============================================================================

export const aiService = {
  /** Get AI-ranked product recommendations */
  async getRecommendations(budget?: string, maxResults = 10) {
    const { data } = await api.post('/ai/recommendations', { budget, max_results: maxResults });
    return data as { recommendations: AIRecommendation[]; skin_type: string; concerns: string[] };
  },

  /** Generate personalized AM/PM routine */
  async generateRoutine(goals?: string[]) {
    const { data } = await api.post('/ai/routine', { goals });
    return data as AIRoutine;
  },

  /** Analyze any ingredient list */
  async analyzeIngredients(ingredients: string[]) {
    const { data } = await api.post('/ai/ingredients', { ingredients });
    return data as AIIngredientAnalysis;
  },

  /** Get smart AI-generated notifications */
  async getSmartNotifications() {
    const { data } = await api.get('/ai/notifications/smart');
    return data as { notifications: AISmartNotification[] };
  },

  /** Get AI-curated content */
  async getCuratedContent() {
    const { data } = await api.get('/ai/content/curated');
    return data as { curated: Array<{ title: string; relevance_score: number }> };
  },

  /** Predict skin condition changes */
  async predictSkinFuture(weeksAhead = 4, productsInUse?: string[]) {
    const { data } = await api.post('/ai/predict', {
      weeks_ahead: weeksAhead,
      products_in_use: productsInUse,
    });
    return data as AIPrediction;
  },

  /** Compare two scans (before/after) */
  async compareScans(scanIdBefore: string, scanIdAfter: string) {
    const { data } = await api.post('/ai/compare', {
      scan_id_before: scanIdBefore,
      scan_id_after: scanIdAfter,
    });
    return data as AIScanComparison;
  },

  /** Detect seasonal trends */
  async detectTrends(location?: string) {
    const { data } = await api.post('/ai/trends', { location });
    return data as AITrend;
  },
};

export default aiService;
