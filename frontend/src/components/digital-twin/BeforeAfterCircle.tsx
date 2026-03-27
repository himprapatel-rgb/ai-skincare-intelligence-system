import React from 'react';

type SnapshotOption = {
  id: string;
  date: string;
  imageUrl: string;
  overallScore: number;
};

type BeforeAfterCircleProps = {
  snapshots: SnapshotOption[];
  beforeSnapshot: SnapshotOption | null;
  afterSnapshot: SnapshotOption | null;
  compareSplit: number;
  onBeforeChange: (id: string) => void;
  onAfterChange: (id: string) => void;
  onSplitChange: (value: number) => void;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
};

const BeforeAfterCircle: React.FC<BeforeAfterCircleProps> = ({
  snapshots,
  beforeSnapshot,
  afterSnapshot,
  compareSplit,
  onBeforeChange,
  onAfterChange,
  onSplitChange,
  formatDate,
  formatDateTime,
}) => {
  if (!beforeSnapshot || !afterSnapshot) return null;

  return (
    <section className="dt-card">
      <div className="dt-card-header">
        <h2>Before & After</h2>
        <div className="dt-select-group">
          <label>
            <span>Before</span>
            <select value={beforeSnapshot.id} onChange={(event) => onBeforeChange(event.target.value)}>
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {formatDateTime(snapshot.date)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>After</span>
            <select value={afterSnapshot.id} onChange={(event) => onAfterChange(event.target.value)}>
              {snapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  {formatDateTime(snapshot.date)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="dt-card-body">
        <div className="dt-before-after">
          <div className="dt-before-after-circle">
            <img className="dt-before" src={beforeSnapshot.imageUrl} alt="Before" loading="lazy" width={300} height={300} />
            <div className="dt-after-layer" style={{ width: `${compareSplit}%` }}>
              <img className="dt-after" src={afterSnapshot.imageUrl} alt="After" loading="lazy" width={300} height={300} />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={compareSplit}
            onChange={(event) => onSplitChange(Number(event.target.value))}
            aria-label="Compare before and after"
          />
          <div className="dt-before-after-meta">
            <div>
              <span>Before</span>
              <strong>{formatDate(beforeSnapshot.date)}</strong>
              <em>Score: {beforeSnapshot.overallScore}</em>
            </div>
            <div>
              <span>After</span>
              <strong>{formatDate(afterSnapshot.date)}</strong>
              <em>Score: {afterSnapshot.overallScore}</em>
            </div>
          </div>
          <div className={`dt-improvement ${afterSnapshot.overallScore - beforeSnapshot.overallScore >= 0 ? 'dt-improvement--positive' : 'dt-improvement--negative'}`}>
            {afterSnapshot.overallScore - beforeSnapshot.overallScore >= 0 ? '↑ +' : '↓ '}
            {afterSnapshot.overallScore - beforeSnapshot.overallScore} points
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterCircle;
