import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconScan, IconHome, IconCheck, IconAlertTriangle, IconArrowLeft } from '../components/Icons';
import './AnalysisResults.css';

interface SkinAnalysis {
  id: string;
  userId: string;
  skinType: string;
  concerns: string[];
  severity: {
    acne?: number;
    wrinkles?: number;
    darkSpots?: number;
    dryness?: number;
    oiliness?: number;
  };
  confidence: number;
  imageUrl: string;
  timestamp: string;
  recommendations?: string[];
}

const AnalysisResults: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<SkinAnalysis[]>([]);

  const fetchAnalysisResults = useCallback(async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app';
      
      // Fetch current analysis
      const response = await fetch(`${API_BASE}/api/v1/analysis/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis results');
      }

      const data = await response.json();
      setAnalysis(data);

      // Fetch previous analyses for comparison
      const historyResponse = await fetch(`${API_BASE}/api/v1/analysis/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPreviousAnalyses(historyData.analyses || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchAnalysisResults();
  }, [fetchAnalysisResults]);

  const getSeverityColor = (severity: number): string => {
    if (severity >= 80) return 'severity-severe';
    if (severity >= 60) return 'severity-high';
    if (severity >= 40) return 'severity-medium';
    if (severity >= 20) return 'severity-low';
    return 'severity-clear';
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity >= 80) return 'Severe';
    if (severity >= 60) return 'Moderate';
    if (severity >= 40) return 'Mild';
    if (severity >= 20) return 'Light';
    return 'Clear';
  };

  if (loading) {
    return (
      <div className="analysis-results">
        <div className="analysis-loading">
          <div className="analysis-loading-spinner"></div>
          <p>Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="analysis-results">
        <div className="analysis-error">
          <div className="analysis-error-icon">
            <IconAlertTriangle size={48} strokeWidth={2} />
          </div>
          <h2>Error Loading Results</h2>
          <p>{error || 'Analysis not found'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-results">
      <div className="results-container">
        <div className="results-header">
          <div>
            <h1>Skin Analysis Results</h1>
            <p>
              Analysis Date: {new Date(analysis.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button onClick={() => navigate('/')} className="results-back">
            <IconArrowLeft size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Back to Dashboard
          </button>
        </div>

        <div className="confidence-row">
          <span>Confidence Score:</span>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${analysis.confidence}%` }}></div>
          </div>
          <span className="confidence-value">{analysis.confidence}%</span>
        </div>

        <div className="results-grid">
          <div className="result-card">
            <h2>Analyzed Image</h2>
            <div className="analysis-image">
              <img src={analysis.imageUrl} alt="Skin analysis" />
            </div>
          </div>

          <div className="result-card">
            <h2>Overview</h2>
            <div className="overview-section">
              <h3>Skin Type</h3>
              <div className="skin-type-badge">{analysis.skinType}</div>
            </div>
            <div className="overview-section">
              <h3>Identified Concerns</h3>
              <div className="concern-tags">
                {analysis.concerns.map((concern, index) => (
                  <span key={index} className="concern-tag">{concern}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="result-card">
          <h2>Severity Analysis</h2>
          <div className="severity-grid">
            {Object.entries(analysis.severity).map(([concern, value]) => (
              <div key={concern} className="severity-card">
                <div className="severity-header">
                  <h3 className="severity-title">{concern}</h3>
                  <span className={`severity-pill ${getSeverityColor(value)}`}>
                    {getSeverityLabel(value)}
                  </span>
                </div>
                <div className="severity-bar">
                  <div className={`severity-fill ${getSeverityColor(value)}`} style={{ width: `${value}%` }}></div>
                </div>
                <div className="severity-value">{value}%</div>
              </div>
            ))}
          </div>
        </div>

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="result-card">
            <h2>Recommendations</h2>
            <ul className="recommendations-list">
              {analysis.recommendations.map((rec, index) => (
                <li key={index}>
                  <IconCheck size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                  {rec}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/recommendations')} className="btn btn-primary">
              View Product Recommendations
            </button>
          </div>
        )}

        {previousAnalyses.length > 0 && (
          <div className="result-card">
            <h2>Historical Comparison</h2>
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Skin Type</th>
                    <th>Concerns</th>
                    <th>Confidence</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {previousAnalyses.slice(0, 5).map((prev) => (
                    <tr key={prev.id}>
                      <td>{new Date(prev.timestamp).toLocaleDateString()}</td>
                      <td>{prev.skinType}</td>
                      <td>{prev.concerns.length} concern(s)</td>
                      <td>{prev.confidence}%</td>
                      <td className="right">
                        <button onClick={() => navigate(`/analysis/${prev.id}`)} className="link-button">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="results-actions">
          <button onClick={() => navigate('/scan')} className="btn btn-primary">
            <IconScan size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Take New Scan
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <IconHome size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
