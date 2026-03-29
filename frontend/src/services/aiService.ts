/**
 * AI Intelligence Service — Frontend API client
 *
 * Connects to ALL /api/v1/ai/* endpoints for AI-powered features.
 * Every AI feature has a typed function here.
 */

import { api } from './api';

// ============================================================================
// Types — Original Features
// ============================================================================

export interface AIRecommendation {
  name: string;
  brand: string;
  category: string;
  ai_score: number;
  ai_reason: string;
  smart_score?: number;
  score_breakdown?: Record<string, number>;
  why_recommended?: string[];
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

export interface AIIngredientAnalysis {
  overall_rating: string;
  score: number;
  highlights: Array<{ ingredient: string; role: string; rating: string; note: string }>;
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
}

// ============================================================================
// Types — New Features
// ============================================================================

export interface AISkinAge {
  skin_age: number;
  real_age: number | null;
  age_gap: number | null;
  verdict: 'younger' | 'same' | 'older' | 'unknown';
  trend: 'improving' | 'stable' | 'aging' | 'unknown';
  top_3_actions: string[];
  biggest_aging_factor: string;
  biggest_strength: string;
  projected_age_4_weeks?: number;
}

export interface AIExposomePrediction {
  risk_level: 'low' | 'moderate' | 'high' | 'critical' | 'unknown';
  predicted_impacts: Array<{ metric: string; direction: string; magnitude: number; reason: string }>;
  daily_tips: Array<{ day: number; tip: string; priority: string }>;
  missing_protection: string[];
  uv_alert: string;
  hydration_forecast: string;
}

export interface AIBenchmark {
  percentiles: Record<string, number>;
  strengths: string[];
  improvement_areas: string[];
  overall_percentile: number;
  peer_comparison: string;
  actionable_tip: string;
}

export interface AIShelfAnalysis {
  conflicts: Array<{ severity: string; products: string[]; ingredients: string[]; issue: string; fix: string }>;
  synergies: Array<{ products: string[]; ingredients: string[]; benefit: string }>;
  optimal_order: string[];
  missing_categories: string[];
  shelf_score: number;
}

export interface AICoachInsight {
  type: 'alert' | 'tip' | 'milestone' | 'warning' | 'encouragement';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  data_point: string;
}

export interface AICoachResponse {
  insights: AICoachInsight[];
  weekly_focus: string;
  skin_mood: 'improving' | 'stable' | 'needs_attention' | 'great';
}

export interface AIProductMatch {
  match_score: number;
  verdict: 'perfect_match' | 'good_match' | 'neutral' | 'caution' | 'avoid';
  pros: string[];
  cons: string[];
  best_used: 'morning' | 'evening' | 'both' | 'occasional';
  pair_with: string[];
  avoid_with: string[];
  personalized_tip: string;
}

export interface AISmartRecommendations {
  recommendations: AIRecommendation[];
  scoring_method: string;
  signals: string[];
  data_points: number;
  user_skin_type: string;
  user_concerns: string[];
}

// ============================================================================
// API Calls — All 16 AI Features
// ============================================================================

export const aiService = {
  // ── Original Features ──

  async getRecommendations(budget?: string, maxResults = 10) {
    const { data } = await api.post('/ai/recommendations', { budget, max_results: maxResults });
    return data as { recommendations: AIRecommendation[]; skin_type: string; concerns: string[] };
  },

  async generateRoutine(goals?: string[]) {
    const { data } = await api.post('/ai/routine', { goals });
    return data as AIRoutine;
  },

  async analyzeIngredients(ingredients: string[]) {
    const { data } = await api.post('/ai/ingredients', { ingredients });
    return data as AIIngredientAnalysis;
  },

  async getSmartNotifications() {
    const { data } = await api.get('/ai/notifications/smart');
    return data as { notifications: AISmartNotification[] };
  },

  async getCuratedContent() {
    const { data } = await api.get('/ai/content/curated');
    return data;
  },

  async predictSkinFuture(weeksAhead = 4, productsInUse?: string[]) {
    const { data } = await api.post('/ai/predict', { weeks_ahead: weeksAhead, products_in_use: productsInUse });
    return data as AIPrediction;
  },

  async compareScans(scanIdBefore: string, scanIdAfter: string) {
    const { data } = await api.post('/ai/compare', { scan_id_before: scanIdBefore, scan_id_after: scanIdAfter });
    return data as AIScanComparison;
  },

  async detectTrends(location?: string) {
    const { data } = await api.post('/ai/trends', { location });
    return data as AITrend;
  },

  // ── New Features ──

  async getSkinAge() {
    const { data } = await api.get('/ai/skin-age');
    return data as AISkinAge;
  },

  async getExposomePrediction(city?: string, lat?: number, lng?: number) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (lat) params.set('latitude', String(lat));
    if (lng) params.set('longitude', String(lng));
    const { data } = await api.get(`/ai/exposome${params.toString() ? '?' + params.toString() : ''}`);
    return data as AIExposomePrediction;
  },

  async getBenchmark() {
    const { data } = await api.get('/ai/benchmark');
    return data as AIBenchmark;
  },

  async getShelfAnalysis() {
    const { data } = await api.get('/ai/shelf-analysis');
    return data as AIShelfAnalysis;
  },

  async getCoachInsights() {
    const { data } = await api.get('/ai/coach');
    return data as AICoachResponse;
  },

  async getProductMatch(productId: string) {
    const { data } = await api.get(`/ai/product-match/${productId}`);
    return data as AIProductMatch;
  },

  async getSmartRecommendations(budget?: string, limit = 10) {
    const params = new URLSearchParams();
    if (budget) params.set('budget', budget);
    params.set('limit', String(limit));
    const { data } = await api.get(`/ai/smart-recommendations?${params.toString()}`);
    return data as AISmartRecommendations;
  },

  async getDailyBrief() {
    const { data } = await api.get('/ai/daily-brief');
    return data;
  },
};

export default aiService;
