/**
 * What-If Simulation Panel for Digital Twin
 * Sprint: Final Features - Trend-based predictions
 */
import React, { useState } from 'react';
import api from '../../services/api';
import { IconSparkles, IconLoader, IconTrendingUp, IconTrendingDown } from '../Icons';

interface SimulationResult {
  current_scores: Record<string, number>;
  projected_scores: Record<string, number>;
  changes: Record<string, number>;
  confidence: number;
  improvements: string[];
  concerns: string[];
}

const SimulationPanel: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    if (!ingredients.trim()) {
      setError('Enter at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const ingredientList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      const response = await api.post('/digital-twin/simulate', {
        products: [{ ingredients: ingredientList }],
        weeks,
      });
      
      // Extract data from response
      const data = response.data;
      setResult({
        current_scores: {
          hydration: (data.baseline_state?.hydration_level || 0.5) * 100,
          oiliness: (data.baseline_state?.oiliness_level || 0.5) * 100,
          acne: (data.baseline_state?.inflammation_level || 0.3) * 100,
          wrinkles: (data.baseline_state?.aging_signs || 0.25) * 100,
          dark_spots: (data.baseline_state?.pigmentation_issues || 0.2) * 100,
          redness: (data.baseline_state?.sensitivity_level || 0.3) * 100,
        },
        projected_scores: {
          hydration: (data.simulated_state?.hydration_level || 0.5) * 100,
          oiliness: (data.simulated_state?.oiliness_level || 0.5) * 100,
          acne: (data.simulated_state?.inflammation_level || 0.3) * 100,
          wrinkles: (data.simulated_state?.aging_signs || 0.25) * 100,
          dark_spots: (data.simulated_state?.pigmentation_issues || 0.2) * 100,
          redness: (data.simulated_state?.sensitivity_level || 0.3) * 100,
        },
        changes: {},
        confidence: data.confidence_score || 0.5,
        improvements: data.recommendations || [],
        concerns: [],
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getChangeIcon = (current: number, projected: number, isNegativeBetter: boolean) => {
    const diff = projected - current;
    const improved = isNegativeBetter ? diff < -2 : diff > 2;
    const worsened = isNegativeBetter ? diff > 2 : diff < -2;
    
    if (improved) return <IconTrendingUp size={14} className="trend-up" />;
    if (worsened) return <IconTrendingDown size={14} className="trend-down" />;
    return null;
  };

  return (
    <div className="simulation-panel">
      <div className="simulation-header">
        <IconSparkles size={24} />
        <h3>What-If Simulation</h3>
      </div>
      <p className="simulation-desc">
        See how your skin might respond to specific ingredients over time.
      </p>

      <div className="simulation-form">
        <div className="form-group">
          <label>Ingredients (comma-separated)</label>
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g., retinol, niacinamide, hyaluronic acid"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Time Period</label>
          <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} disabled={loading}>
            <option value={2}>2 weeks</option>
            <option value={4}>4 weeks</option>
            <option value={8}>8 weeks</option>
            <option value={12}>12 weeks</option>
          </select>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="btn-simulate">
          {loading ? <IconLoader size={16} className="spin" /> : <IconSparkles size={16} />}
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      {error && <div className="simulation-error">{error}</div>}

      {result && (
        <div className="simulation-results">
          <div className="confidence-badge">
            Confidence: {Math.round(result.confidence * 100)}%
          </div>
          <h4>Projected Changes ({weeks} weeks)</h4>
          <div className="metric-grid">
            {Object.entries(result.projected_scores).map(([key, projected]) => {
              const current = result.current_scores[key] || 50;
              const isNegativeBetter = ['acne', 'wrinkles', 'dark_spots', 'redness', 'oiliness'].includes(key);
              const diff = projected - current;
              
              return (
                <div key={key} className="metric-item">
                  <span className="metric-name">{formatMetric(key)}</span>
                  <div className="metric-values">
                    <span className="current">{Math.round(current)}</span>
                    <span className="arrow">→</span>
                    <span className={`projected ${diff > 0 ? (isNegativeBetter ? 'worse' : 'better') : (isNegativeBetter ? 'better' : 'worse')}`}>
                      {Math.round(projected)}
                    </span>
                    {getChangeIcon(current, projected, isNegativeBetter)}
                  </div>
                </div>
              );
            })}
          </div>
          {result.improvements.length > 0 && (
            <div className="recommendations">
              <h5>Analysis</h5>
              <ul>
                {result.improvements.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;
