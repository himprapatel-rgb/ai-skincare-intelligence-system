import React, { useState } from 'react';
import { IconHelpCircle } from '../Icons';

type HeroSectionProps = {
  currentScore: number;
  skinMood: string;
  totalSnapshots: number;
};

const HeroSection: React.FC<HeroSectionProps> = ({ currentScore, skinMood, totalSnapshots }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <section className="dt-hero">
      <div className="dt-hero-header">
        <div className="dt-hero-title-row">
          <div>
            <h1>Digital Twin</h1>
            <p>Your skin&apos;s evolution — track progress across every scan.</p>
          </div>
          <button
            type="button"
            className="dt-help-button"
            onClick={() => setShowDetails((value) => !value)}
            title="What is a Digital Twin?"
            aria-label="Learn about Digital Twin"
          >
            <IconHelpCircle size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="dt-hero-stats">
          <div className="dt-hero-score">
            <div className="dt-hero-score-value">{currentScore}</div>
            <div className="dt-hero-score-label">
              <span>Current</span>
              <span>Score</span>
            </div>
          </div>
          <div className="dt-hero-divider" />
          <div className="dt-hero-meta">
            <div className="dt-hero-mood">{skinMood}</div>
            <div className="dt-hero-mood-label">Skin Mood</div>
          </div>
          <div className="dt-hero-divider" />
          <div className="dt-hero-meta">
            <div className="dt-hero-count">{totalSnapshots}</div>
            <div className="dt-hero-mood-label">Snapshots</div>
          </div>
        </div>
      </div>
      {showDetails && (
        <div className="dt-hero-tooltip">
          <div className="dt-hero-tooltip-content">
            <strong>What is a Digital Twin?</strong>
            <ul>
              <li>Each scan creates a snapshot of your skin's condition</li>
              <li>Track scores, mood, and concerns over time</li>
              <li>Connect skincare choices with visible results</li>
            </ul>
            <button type="button" className="dt-tooltip-close" onClick={() => setShowDetails(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
