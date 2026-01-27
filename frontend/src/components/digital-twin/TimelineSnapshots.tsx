import React, { useState } from 'react';
import { IconCamera } from '../Icons';
import SnapshotCard from './SnapshotCard';

type Snapshot = {
  id: string;
  imageUrl: string;
  overallScore: number;
  skinMoodLabel: string;
  date: string;
};

type TimelineSnapshotsProps = {
  snapshots: Snapshot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTakeNew: () => void;
  formatDate: (value: string) => string;
};

const TimelineSnapshots: React.FC<TimelineSnapshotsProps> = ({
  snapshots,
  selectedId,
  onSelect,
  onTakeNew,
  formatDate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const visible = isExpanded ? snapshots : snapshots.slice(0, 6);
  const hiddenCount = Math.max(0, snapshots.length - 6);

  return (
    <section className="dt-card">
      <div className="dt-card-header">
        <div className="dt-card-title">
          <h2>Timeline Snapshots</h2>
          <span>{snapshots.length} total</span>
        </div>
        <button type="button" className="btn-primary" onClick={onTakeNew}>
          <IconCamera size={18} strokeWidth={2} className="icon-inline" />
          Take New Snapshot
        </button>
      </div>
      <div className="dt-card-body">
        <div className="dt-snapshot-grid">
          {visible.map((snapshot) => (
            <SnapshotCard
              key={snapshot.id}
              id={snapshot.id}
              imageUrl={snapshot.imageUrl}
              dateLabel={formatDate(snapshot.date)}
              score={snapshot.overallScore}
              mood={snapshot.skinMoodLabel}
              isSelected={snapshot.id === selectedId}
              onClick={() => onSelect(snapshot.id)}
            />
          ))}
        </div>
        {snapshots.length > 6 && (
          <div className="dt-snapshot-toggle">
            <button type="button" className="btn-secondary" onClick={() => setIsExpanded((value) => !value)}>
              {isExpanded ? 'Show Less' : `View ${hiddenCount} More`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TimelineSnapshots;
