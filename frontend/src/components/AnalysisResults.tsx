import React from 'react';
import type { ScanAnalysisResult } from '../types/scan';

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
  const { analysis_result, recommendations } = results;

  return (
    <div className="analysis-results">
      <div className="analysis-results__header">
        <h2>Analysis Complete</h2>
        <p className="analysis-results__timestamp">
          Scan Date: {new Date(results.created_at).toLocaleString()}
        </p>
      </div>

      {/* Skin Analysis Summary */}
      <div className="analysis-results__summary">
        <h3>Skin Analysis Summary</h3>
        
        {/* Overall Condition */}
        <div className="analysis-results__section">
          <h4>Overall Skin Condition</h4>
          <div className="analysis-results__score">
            <span className="score-label">Health Score:</span>
            <span className="score-value">
              {analysis_result.overall_condition?.score || 'N/A'}/100
            </span>
          </div>
          <p>{analysis_result.overall_condition?.description}</p>
        </div>

        {/* Detected Concerns */}
        {analysis_result.concerns && analysis_result.concerns.length > 0 && (
          <div className="analysis-results__section">
            <h4>Detected Skin Concerns</h4>
            <ul className="concerns-list">
              {analysis_result.concerns.map((concern, index) => (
                <li key={index} className="concern-item">
                  <span className="concern-type">{concern.type}:</span>
                  <span className="concern-severity">{concern.severity}</span>
                  <p className="concern-description">{concern.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skin Type */}
        {analysis_result.skin_type && (
          <div className="analysis-results__section">
            <h4>Skin Type</h4>
            <p className="skin-type">{analysis_result.skin_type}</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="analysis-results__recommendations">
          <h3>Personalized Recommendations</h3>
          <ul className="recommendations-list">
            {recommendations.map((rec, index) => (
              <li key={index} className="recommendation-item">
                <h5>{rec.title}</h5>
                <p>{rec.description}</p>
                {rec.products && rec.products.length > 0 && (
                  <div className="recommended-products">
                    <strong>Suggested Products:</strong>
                    <ul>
                      {rec.products.map((product, idx) => (
                        <li key={idx}>{product}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="analysis-results__actions">
        <button 
          className="btn btn--primary"
          onClick={onNewScan}
        >
          Take New Scan
        </button>
        <button 
          className="btn btn--secondary"
          onClick={() => window.print()}
        >
          Print Results
        </button>
      </div>

      {/* Disclaimer */}
      <div className="analysis-results__disclaimer">
        <p>
          <strong>Disclaimer:</strong> This analysis is for informational purposes only 
          and should not replace professional medical advice. Please consult a 
          dermatologist for personalized skincare guidance.
        </p>
      </div>
    </div>
  );
};
