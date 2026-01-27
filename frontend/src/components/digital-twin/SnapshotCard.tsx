import React from 'react';

type SnapshotCardProps = {
  id: string;
  imageUrl: string;
  dateLabel: string;
  score: number;
  mood: string;
  isSelected: boolean;
  onClick: () => void;
};

const SnapshotCard: React.FC<SnapshotCardProps> = ({
  imageUrl,
  dateLabel,
  score,
  mood,
  isSelected,
  onClick,
}) => (
  <button type="button" className={`dt-snapshot-card ${isSelected ? 'is-selected' : ''}`} onClick={onClick}>
    <div className="dt-snapshot-image">
      <img src={imageUrl} alt={`Snapshot from ${dateLabel}`} loading="lazy" />
      <div className="dt-snapshot-date">{dateLabel}</div>
    </div>
    <div className="dt-snapshot-info">
      <div className="dt-snapshot-score">Score: {score}</div>
      <div className="dt-snapshot-mood">Mood: {mood}</div>
    </div>
  </button>
);

export default SnapshotCard;
