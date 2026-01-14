import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';

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
      <span style={{ color: improved ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
        {improved ? '↓' : '↑'} {Math.abs(diff)}%
      </span>
    );
  };

  const analysis1 = analyses.find(a => a.id === selectedAnalyses[0]);
  const analysis2 = analyses.find(a => a.id === selectedAnalyses[1]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Compare Analyses</h1>
        <p>Select two analyses to compare your skin progress</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3>Select Analyses to Compare</h3></div>
        <div className="card-content" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <label>First Analysis (Newer)</label>
            <select
              value={selectedAnalyses[0] || ''}
              onChange={(e) => setSelectedAnalyses([e.target.value, selectedAnalyses[1]])}
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            >
              <option value="">Select analysis...</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>{a.date} - Score: {a.overallScore}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Second Analysis (Older)</label>
            <select
              value={selectedAnalyses[1] || ''}
              onChange={(e) => setSelectedAnalyses([selectedAnalyses[0], e.target.value])}
              style={{ width: '100%', padding: '8px', marginTop: '8px' }}
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
        <div className="card">
          <div className="card-header"><h3>Comparison Results</h3></div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{analysis1.date}</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {analysis1.overallScore}
                </div>
                <div>Overall Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{analysis2.date}</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  {analysis2.overallScore}
                </div>
                <div>Overall Score</div>
              </div>
            </div>
            
            <h4 style={{ marginTop: '24px' }}>Concern Changes</h4>
            <table style={{ width: '100%', marginTop: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Concern</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>{analysis1.date}</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>{analysis2.date}</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {(['acne', 'wrinkles', 'darkSpots', 'hydration', 'redness'] as const).map(concern => (
                  <tr key={concern} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', textTransform: 'capitalize' }}>
                      {concern.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{analysis1.concerns[concern]}%</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{analysis2.concerns[concern]}%</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{renderComparisonIndicator(concern)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/history" className="btn btn-secondary">View All History</Link>
      </div>
    </div>
  );
};

export default ComparisonPage;
