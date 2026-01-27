import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconScan, IconHome, IconCheck, IconAlertTriangle, IconArrowLeft } from '../components/Icons';
import { getScanHistory, getScanResult } from '../services/scanApi';
import './AnalysisResults.css';

interface SkinAnalysis {
  id: string;
  userId: string;
  skinType: string;
  concerns: string[];
  severity: Record<string, number>;
  confidence: number;
  imageUrl: string;
  timestamp: string;
  recommendations?: string[];
}

type ScanHistoryItem = {
  scan_id: string;
  status: string;
  created_at?: string | null;
};

const AnalysisResults: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [previousScans, setPreviousScans] = useState<ScanHistoryItem[]>([]);

  const buildAnalysisFromScan = useCallback((scanResult: Record<string, unknown>): SkinAnalysis => {
    type Summary = {
      overall_score?: number;
      scores?: Record<string, number>;
      concerns?: string[];
      image_url?: string;
    };

    const result = (scanResult as { result?: Record<string, unknown> }).result || {};
    const analysis = (result as { analysis?: Record<string, unknown> }).analysis || {};
    const summary = ((result as { summary?: Summary }).summary || (analysis as { summary?: Summary }).summary || {}) as Summary;

    const scores: Record<string, number> = {};
    const concerns: string[] = [];
    let overallScore: number | null = typeof summary.overall_score === 'number' ? summary.overall_score : null;
    const imageUrl: string | null =
      typeof summary.image_url === 'string'
        ? summary.image_url
        : typeof (result as { image_url?: string }).image_url === 'string'
        ? (result as { image_url?: string }).image_url || null
        : null;

    if (summary.scores && typeof summary.scores === 'object') {
      Object.entries(summary.scores).forEach(([key, value]) => {
        if (typeof value === 'number') scores[key] = value;
      });
    }

    if (Array.isArray(summary.concerns)) {
      summary.concerns.forEach((value: string) => {
        if (typeof value === 'string') concerns.push(value);
      });
    }

    if (!overallScore && Object.keys(scores).length > 0) {
      const values = Object.values(scores);
      overallScore = values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    const recommendations =
      (result as { recommendations?: string[] }).recommendations ||
      (analysis as { recommendations?: string[] }).recommendations ||
      [];

    return {
      id: analysisId || 'unknown',
      userId: '',
      skinType: 'Not provided',
      concerns,
      severity: Object.fromEntries(
        Object.entries(scores).map(([key, value]) => [key, Math.round(value)])
      ),
      confidence: overallScore ? Math.round(overallScore) : 0,
      imageUrl: imageUrl || '',
      timestamp: String((scanResult as { created_at?: string }).created_at || new Date().toISOString()),
      recommendations,
    };
  }, [analysisId]);

  const fetchAnalysisResults = useCallback(async () => {
    try {
      setLoading(true);
      if (!analysisId) {
        throw new Error('Missing scan id');
      }

      const scanResult = await getScanResult(analysisId);
      const status = typeof (scanResult as { status?: string }).status === 'string'
        ? String((scanResult as { status?: string }).status)
        : null;
      if (status === 'failed') {
        const message = (scanResult as { message?: string; detail?: string }).message
          || (scanResult as { message?: string; detail?: string }).detail
          || 'Scan failed. Please retry with a clear, well-lit selfie.';
        setFailureMessage(message);
      } else {
        setFailureMessage(null);
      }
      const mapped = buildAnalysisFromScan(scanResult as Record<string, unknown>);
      if (!status && mapped.confidence === 0 && mapped.concerns.length === 0 && Object.keys(mapped.severity).length === 0) {
        setFailureMessage('No analysis data returned. Please retry the scan with a clear, front-facing selfie.');
      }
      setAnalysis(mapped);

      const historyData = await getScanHistory();
      const scans = (historyData as { scans?: ScanHistoryItem[] }).scans || [];
      setPreviousScans(scans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [analysisId, buildAnalysisFromScan]);

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
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
          <button onClick={() => navigate('/')} className="results-back">
            <IconArrowLeft size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Back to Dashboard
          </button>
        </div>

        {failureMessage && (
          <div className="analysis-inline-warning">
            <IconAlertTriangle size={24} strokeWidth={2} />
            <div>
              <h3>Scan failed</h3>
              <p>{failureMessage}</p>
              <button onClick={() => navigate('/scan')} className="btn btn-primary">
                Retry Scan
              </button>
            </div>
          </div>
        )}

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
              {analysis.imageUrl ? (
                <img src={analysis.imageUrl} alt="Skin analysis" />
              ) : (
                <div className="analysis-image-fallback">
                  <IconScan size={32} strokeWidth={2} />
                  <div>
                    <strong>{failureMessage ? 'No image available' : 'Image processed but not stored'}</strong>
                    <span>{failureMessage ? 'We do not store images when scans fail.' : 'Your analysis is complete, but the image was not saved.'}</span>
                  </div>
                </div>
              )}
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
                {analysis.concerns.length > 0 ? (
                  analysis.concerns.map((concern, index) => (
                    <span key={index} className="concern-tag">{concern}</span>
                  ))
                ) : (
                  <span className="concern-tag">No concerns detected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="result-card">
          <h2>Severity Analysis</h2>
          <div className="severity-grid">
            {Object.keys(analysis.severity).length > 0 ? (
              Object.entries(analysis.severity).map(([concern, value]) => (
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
              ))
            ) : (
              <p className="analysis-empty">No severity metrics available for this scan.</p>
            )}
          </div>
        </div>

        <div className="result-card metric-explanations">
          <h2>How to Read Your Scores</h2>
          <div className="metric-grid">
            <div>
              <h3>Acne</h3>
              <p>Higher values indicate more visible breakouts or inflammation.</p>
            </div>
            <div>
              <h3>Texture</h3>
              <p>Measures surface smoothness. Lower scores suggest roughness.</p>
            </div>
            <div>
              <h3>Hydration</h3>
              <p>Reflects moisture balance. Higher is generally healthier.</p>
            </div>
            <div>
              <h3>Redness</h3>
              <p>Tracks visible irritation or sensitivity flare-ups.</p>
            </div>
            <div>
              <h3>Score Ranges</h3>
              <p>80–100 = strong, 60–79 = moderate, 40–59 = mild, below 40 = needs care.</p>
            </div>
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

        {previousScans.length > 0 && (
          <div className="result-card">
            <h2>Historical Comparison</h2>
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {previousScans.slice(0, 5).map((prev) => (
                    <tr key={prev.scan_id}>
                      <td>{prev.created_at ? new Date(prev.created_at).toLocaleDateString() : '—'}</td>
                      <td>{prev.status}</td>
                      <td className="right">
                        <button onClick={() => navigate(`/analysis/${prev.scan_id}`)} className="link-button">
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
