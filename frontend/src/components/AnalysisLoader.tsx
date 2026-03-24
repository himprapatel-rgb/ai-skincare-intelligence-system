// AnalysisLoader — Premium animated loading state during skin analysis
import React from 'react';
import './AnalysisLoader.css';

interface AnalysisLoaderProps {
  progress: number;
  message?: string;
}

const STAGES = [
  { threshold: 0, label: 'Detecting face...', icon: '🔍' },
  { threshold: 20, label: 'Uploading image...', icon: '📤' },
  { threshold: 40, label: 'Analyzing skin...', icon: '🧬' },
  { threshold: 70, label: 'Mapping concerns...', icon: '🗺️' },
  { threshold: 85, label: 'Generating insights...', icon: '✨' },
  { threshold: 95, label: 'Finalizing report...', icon: '📋' },
];

function getStage(progress: number) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (progress >= stage.threshold) current = stage;
  }
  return current;
}

export function AnalysisLoader({ progress, message }: AnalysisLoaderProps) {
  const stage = getStage(progress);

  return (
    <div className="analysis-loader" role="status" aria-live="polite">
      {/* Face outline with scanning laser */}
      <div className="analysis-loader-visual">
        <svg
          viewBox="0 0 120 160"
          className="analysis-loader-face"
          aria-hidden="true"
        >
          {/* Face outline */}
          <ellipse
            cx="60" cy="72" rx="44" ry="56"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.3"
          />
          {/* Corner brackets */}
          <path d="M28,30 L28,20 L40,20" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M92,20 L80,20 L80,20 M92,20 L92,30" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M28,114 L28,124 L40,124" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M92,124 L80,124 M92,114 L92,124" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />

          {/* Eyes */}
          <ellipse cx="42" cy="64" rx="8" ry="5" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
          <ellipse cx="78" cy="64" rx="8" ry="5" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />

          {/* Nose */}
          <path d="M56,74 Q60,84 64,74" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.3" />

          {/* Mouth */}
          <path d="M48,92 Q60,100 72,92" fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.3" />
        </svg>

        {/* Scanning laser line */}
        <div className="analysis-loader-laser" aria-hidden="true" />

        {/* Pulse rings */}
        <div className="analysis-loader-pulse" aria-hidden="true" />
        <div className="analysis-loader-pulse analysis-loader-pulse--delayed" aria-hidden="true" />
      </div>

      {/* Stage info */}
      <div className="analysis-loader-content">
        <div className="analysis-loader-stage-icon" aria-hidden="true">
          {stage.icon}
        </div>
        <h2 className="analysis-loader-title">{stage.label}</h2>
        {message && <p className="analysis-loader-message">{message}</p>}

        {/* Progress bar */}
        <div className="analysis-loader-progress">
          <div
            className="analysis-loader-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="analysis-loader-pct">{progress}%</span>

        {/* Stage dots */}
        <div className="analysis-loader-stages">
          {STAGES.map((s, i) => (
            <span
              key={i}
              className={`analysis-loader-stage-dot ${progress >= s.threshold ? 'active' : ''}`}
              title={s.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
