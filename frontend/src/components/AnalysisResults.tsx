import React from 'react';
import type { ScanAnalysisResult, SkinConcernDetection } from '../types/scan';

/**
 * AnalysisResults Component Props
 */
interface AnalysisResultsProps {
  results: ScanAnalysisResult;
  onNewScan: () => void;
}

/**
 * AnalysisResults Component
 * Displays scan analysis results and recommendations
 */
export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, onNewScan }) => {
  return (
    <div className="analysis-results">
      <div className="analysis-results__header">
        <h2>Analysis Complete</h2>
        <p className="analysis-results__timestamp">
          Scan Date: {new Date(results.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Skin Analysis Summary */}
      <div className="analysis-results__summary">
        <h3>Skin Analysis Summary</h3>
        
        {/* Overall Confidence */}
        <div className="analysis-results__section">
          <h4>Analysis Confidence</h4>
          <div className="analysis-results__score">
            <span className="score-label">Confidence Score:</span>
            <span className="score-value">
              {Math.round(results.overallConfidence * 100)}%
            </span>
          </div>
        </div>

        {/* Detected Concerns */}
        {results.skinConcerns && results.skinConcerns.length > 0 && (
          <div className="analysis-results__section">
            <h4>Detected Skin Concerns</h4>
            <ul className="concerns-list">
              {results.skinConcerns.map((concern: SkinConcernDetection, index: number) => (
                <li key={index} className="concern-item">
                  <span className="concern-type">{concern.type}:</span>
                  <span className="concern-severity">Severity {concern.severity}%</span>
                  <span className="concern-confidence">Confidence {Math.round(concern.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skin Type */}
        {results.fairnessMetrics && (
          <div className="analysis-results__section">
            <h4>Skin Type</h4>
            <p className="skin-type">Fitzpatrick Type {results.fairnessMetrics.fitzpatrickType}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <div className="analysis-results__recommendations">
          <h3>Personalized Recommendations</h3>
          <ul className="recommendations-list">
            {results.recommendations.map((rec: string, index: number) => (
              <li key={index} className="recommendation-item">
                <p>{rec}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <div className="analysis-results__actions">
        <button 
          onClick={onNewScan}
          className="btn btn-primary"
        >
          Take Another Scan
        </button>
      </div>
    </div>
  );
};

export default AnalysisResults;
