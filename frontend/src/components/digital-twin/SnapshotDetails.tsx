import React from 'react';
import { IconTrash2 } from '../Icons';

type SnapshotDetailsProps = {
  snapshot: {
    id: string;
    imageUrl: string;
    date: string;
    overallScore: number;
    skinMoodLabel: string;
    concerns: {
      acne: number;
      wrinkles: number;
      darkSpots: number;
      hydration: number;
      oiliness: number;
      redness: number;
    };
    improvements: string[];
  };
  formatDate: (value: string) => string;
  onDelete?: (id: string) => void;
};

// Get color class based on metric value and type
const getMetricColor = (value: number, isPositive: boolean = false): string => {
  if (isPositive) {
    // For hydration - higher is better
    if (value >= 70) return 'metric-good';
    if (value >= 40) return 'metric-moderate';
    return 'metric-concern';
  } else {
    // For concerns - lower is better
    if (value <= 20) return 'metric-good';
    if (value <= 40) return 'metric-moderate';
    return 'metric-concern';
  }
};

const MetricBar: React.FC<{ label: string; value: number; isPositive?: boolean }> = ({ 
  label, 
  value, 
  isPositive = false 
}) => {
  const colorClass = getMetricColor(value, isPositive);
  
  return (
    <div className="dt-metric-bar-item">
      <div className="dt-metric-bar-header">
        <span className="dt-metric-bar-label">{label}</span>
        <span className={`dt-metric-bar-value ${colorClass}`}>{value}%</span>
      </div>
      <div className="dt-metric-bar-track">
        <div 
          className={`dt-metric-bar-fill ${colorClass}`} 
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
};

const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({ snapshot, formatDate, onDelete }) => (
  <section className="dt-card">
    <div className="dt-card-header">
      <h2>Snapshot Details - {formatDate(snapshot.date)}</h2>
      {onDelete && (
        <button 
          type="button" 
          className="dt-delete-button"
          onClick={() => onDelete(snapshot.id)}
          title="Delete this snapshot"
          aria-label="Delete snapshot"
        >
          <IconTrash2 size={18} strokeWidth={2} />
          <span>Delete</span>
        </button>
      )}
    </div>
    <div className="dt-card-body dt-details-grid">
      <div className="dt-details-image">
        <img
          src={snapshot.imageUrl}
          alt="Selected snapshot"
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
        />
      </div>
      <div className="dt-details-metrics">
        <div className="dt-metrics-summary">
          <div className="dt-metric-highlight">
            <span className="dt-metric-highlight-value">{snapshot.overallScore}</span>
            <span className="dt-metric-highlight-label">Overall Score</span>
          </div>
          <div className="dt-metric-highlight">
            <span className="dt-metric-highlight-value">{snapshot.skinMoodLabel}</span>
            <span className="dt-metric-highlight-label">Skin Mood</span>
          </div>
        </div>
        
        <h3>Skin Metrics</h3>
        <div className="dt-metric-bars">
          <MetricBar label="Hydration" value={snapshot.concerns.hydration} isPositive={true} />
          <MetricBar label="Acne" value={snapshot.concerns.acne} />
          <MetricBar label="Wrinkles" value={snapshot.concerns.wrinkles} />
          <MetricBar label="Dark Spots" value={snapshot.concerns.darkSpots} />
          <MetricBar label="Oiliness" value={snapshot.concerns.oiliness} />
          <MetricBar label="Redness" value={snapshot.concerns.redness} />
        </div>
        
        {snapshot.improvements.length > 0 && (
          <div className="dt-improvements">
            <h3>Key Improvements</h3>
            <ul>
              {snapshot.improvements.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  </section>
);

export default SnapshotDetails;
