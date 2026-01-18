import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';
import './ComparisonPage.css';

interface Analysis {
  id: string;
  date: string;
  thumbnail: string;
  skinType: string;
  overallScore: number;
  concerns: {
    acne: number;
    wrinkles: number;
    darkSpots: number;
    hydration: number;
    redness: number;
  };
}

/**
 * Comparison Page (US-205)
 * Compare two skin analyses side-by-side to track improvement
 */
const ComparisonPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<[string | null, string | null]>([null, null]);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    const mockAnalyses: Analysis[] = [
      {
        id: '1', date: '2026-01-14', thumbnail: '/placeholder.jpg',
        skinType: 'Combination', overallScore: 72,
        concerns: { acne: 35, wrinkles: 20, darkSpots: 25, hydration: 65, redness: 30 }
      },
      {
        id: '2', date: '2026-01-07', thumbnail: '/placeholder.jpg',
        skinType: 'Combination', overallScore: 68,
        concerns: { acne: 45, wrinkles: 22, darkSpots: 30, hydration: 58, redness: 35 }
      },
      {
        id: '3', date: '2025-12-28', thumbnail: '/placeholder.jpg',
        skinType: 'Oily', overallScore: 62,
        concerns: { acne: 55, wrinkles: 18, darkSpots: 28, hydration: 52, redness: 40 }
      },
    ];
    setAnalyses(mockAnalyses);
    setIsLoading(false);
  }, []);

  const getComparison = (key: keyof Analysis['concerns']) => {
    if (!selectedAnalyses[0] || !selectedAnalyses[1]) return null;
    const analysis1 = analyses.find(a => a.id === selectedAnalyses[0]);
    const analysis2 = analyses.find(a => a.id === selectedAnalyses[1]);
    if (!analysis1 || !analysis2) return null;
    const diff = analysis1.concerns[key] - analysis2.concerns[key];
    return { diff, improved: diff < 0 };
  };

  const renderComparisonIndicator = (key: keyof Analysis['concerns']) => {
    const comparison = getComparison(key);
    if (!comparison) return null;
    const { diff, improved } = comparison;
    return (
      <span className={`comparison-delta ${improved ? 'improved' : 'declined'}`}>
        {improved ? '↓' : '↑'} {Math.abs(diff)}%
      </span>
    );
  };

  const analysis1 = analyses.find(a => a.id === selectedAnalyses[0]);
  const analysis2 = analyses.find(a => a.id === selectedAnalyses[1]);

  return (
    <div className="page-container comparison-page">
      <div className="page-header comparison-header">
        <h1>Compare Analyses</h1>
        <p>Select two analyses to compare your skin progress</p>
      </div>

      <div className="card comparison-card">
        <div className="card-header"><h3>Select Analyses to Compare</h3></div>
        <div className="card-content comparison-selects">
          <div className="comparison-select">
            <label className="comparison-label">First Analysis (Newer)</label>
            <select
              value={selectedAnalyses[0] || ''}
              onChange={(e) => setSelectedAnalyses([e.target.value, selectedAnalyses[1]])}
              className="comparison-input"
            >
              <option value="">Select analysis...</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>{a.date} - Score: {a.overallScore}</option>
              ))}
            </select>
          </div>
          <div className="comparison-select">
            <label className="comparison-label">Second Analysis (Older)</label>
            <select
              value={selectedAnalyses[1] || ''}
              onChange={(e) => setSelectedAnalyses([selectedAnalyses[0], e.target.value])}
              className="comparison-input"
            >
              <option value="">Select analysis...</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>{a.date} - Score: {a.overallScore}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {analysis1 && analysis2 && (
        <div className="card comparison-card">
          <div className="card-header"><h3>Comparison Results</h3></div>
          <div className="card-content">
            <div className="comparison-summary">
              <div className="comparison-score-card">
                <div className="comparison-score-date">{analysis1.date}</div>
                <div className="comparison-score-value primary">
                  {analysis1.overallScore}
                </div>
                <div className="comparison-score-label">Overall Score</div>
              </div>
              <div className="comparison-score-card">
                <div className="comparison-score-date">{analysis2.date}</div>
                <div className="comparison-score-value muted">
                  {analysis2.overallScore}
                </div>
                <div className="comparison-score-label">Overall Score</div>
              </div>
            </div>
            
            <h4 className="comparison-section-title">Concern Changes</h4>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="comparison-th left">Concern</th>
                  <th className="comparison-th center">{analysis1.date}</th>
                  <th className="comparison-th center">{analysis2.date}</th>
                  <th className="comparison-th center">Change</th>
                </tr>
              </thead>
              <tbody>
                {(['acne', 'wrinkles', 'darkSpots', 'hydration', 'redness'] as const).map(concern => (
                  <tr key={concern}>
                    <td className="comparison-td capitalize">
                      {concern.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td className="comparison-td center">{analysis1.concerns[concern]}%</td>
                    <td className="comparison-td center">{analysis2.concerns[concern]}%</td>
                    <td className="comparison-td center">{renderComparisonIndicator(concern)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="comparison-actions">
        <Link to="/history" className="btn btn-secondary">View All History</Link>
      </div>
    </div>
  );
};

export default ComparisonPage;
