import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    fetchAnalysisResults();
  }, [analysisId]);

  const fetchAnalysisResults = async () => {
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
  };

  const getSeverityColor = (severity: number): string => {
    if (severity >= 80) return 'bg-red-500';
    if (severity >= 60) return 'bg-orange-500';
    if (severity >= 40) return 'bg-yellow-500';
    if (severity >= 20) return 'bg-blue-500';
    return 'bg-green-500';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error || 'Analysis not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Skin Analysis Results</h1>
              <p className="text-gray-600">
                Analysis Date: {new Date(analysis.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Confidence Score:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${analysis.confidence}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700">{analysis.confidence}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Image Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analyzed Image</h2>
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={analysis.imageUrl}
                alt="Skin analysis"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Skin Type & Concerns */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Overview</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Skin Type</h3>
              <div className="bg-purple-100 text-purple-800 px-4 py-3 rounded-lg font-semibold text-lg">
                {analysis.skinType}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Identified Concerns</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.concerns.map((concern, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Severity Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Severity Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis.severity).map(([concern, value]) => (
              <div key={concern} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700 capitalize">{concern}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded text-white ${getSeverityColor(value)}`}>
                    {getSeverityLabel(value)}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 mb-1">
                  <div
                    className={`h-3 rounded-full ${getSeverityColor(value)}`}
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-right">{value}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 font-bold"> ✓</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/recommendations')}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              View Product Recommendations
            </button>
          </div>
        )}

        {/* Historical Comparison */}
        {previousAnalyses.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historical Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Skin Type</th>
                    <th className="text-left py-2 px-4">Concerns</th>
                    <th className="text-left py-2 px-4">Confidence</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {previousAnalyses.slice(0, 5).map((prev) => (
                    <tr key={prev.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">
                        {new Date(prev.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">{prev.skinType}</td>
                      <td className="py-2 px-4">{prev.concerns.length} concern(s)</td>
                      <td className="py-2 px-4">{prev.confidence}%</td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => navigate(`/analysis/${prev.id}`)}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
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

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/scan')}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            📸 Take New Scan
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
