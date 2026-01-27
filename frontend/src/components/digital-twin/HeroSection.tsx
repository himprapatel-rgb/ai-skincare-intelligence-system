import React, { useState } from 'react';

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
        <div>
          <h1>Digital Twin Timeline</h1>
          <p>Your skin's living profile — track progress across every scan.</p>
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
      <div className="dt-hero-toggle">
        <button
          type="button"
          className="dt-link-button"
          onClick={() => setShowDetails((value) => !value)}
        >
          {showDetails ? 'Hide details' : 'What is a Digital Twin?'}
        </button>
        {showDetails && (
          <div className="dt-hero-details">
            <div>Each scan creates a snapshot of your skin's condition.</div>
            <div>Track scores, mood, and concerns over time.</div>
            <div>Connect skincare choices with visible results.</div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
