import React from 'react';

type SnapshotDetailsProps = {
  snapshot: {
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
};

const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({ snapshot, formatDate }) => (
  <section className="dt-card">
    <div className="dt-card-header">
      <h2>Snapshot Details - {formatDate(snapshot.date)}</h2>
    </div>
    <div className="dt-card-body dt-details-grid">
      <div className="dt-details-image">
        <img
          src={snapshot.imageUrl}
          alt="Selected snapshot"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="dt-details-metrics">
        <h3>Metrics</h3>
        <div className="dt-metric-grid">
          <div>
            <span>Overall Score</span>
            <strong>{snapshot.overallScore}</strong>
          </div>
          <div>
            <span>Skin Mood</span>
            <strong>{snapshot.skinMoodLabel}</strong>
          </div>
          <div>
            <span>Acne</span>
            <strong>{snapshot.concerns.acne}%</strong>
          </div>
          <div>
            <span>Wrinkles</span>
            <strong>{snapshot.concerns.wrinkles}%</strong>
          </div>
          <div>
            <span>Dark Spots</span>
            <strong>{snapshot.concerns.darkSpots}%</strong>
          </div>
          <div>
            <span>Hydration</span>
            <strong>{snapshot.concerns.hydration}%</strong>
          </div>
          <div>
            <span>Oiliness</span>
            <strong>{snapshot.concerns.oiliness}%</strong>
          </div>
          <div>
            <span>Redness</span>
            <strong>{snapshot.concerns.redness}%</strong>
          </div>
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
