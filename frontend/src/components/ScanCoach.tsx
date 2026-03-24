// ScanCoach — Guided 4-step scan tutorial for first-time users
import React, { useState, useCallback } from 'react';
import { IconSun, IconScan, IconTarget, IconClock, IconArrowRight, IconX } from './Icons';

const STORAGE_KEY = 'pellicura_scan_tutorial_complete';

interface ScanCoachProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: IconSun,
    title: 'Find Good Lighting',
    desc: 'Face a window or bright, even light source. Avoid harsh shadows and backlight.',
    tip: 'Natural daylight gives the best results.',
    visual: 'lighting',
  },
  {
    icon: IconScan,
    title: 'Get the Right Distance',
    desc: 'Hold your device at arm\'s length. Your face should fill about 60% of the frame.',
    tip: 'Too close = blurry. Too far = low detail.',
    visual: 'distance',
  },
  {
    icon: IconTarget,
    title: 'Angle & Position',
    desc: 'Look straight at the camera. Keep your head level — no tilt or turn.',
    tip: 'Remove glasses and keep hair away from your face.',
    visual: 'angle',
  },
  {
    icon: IconClock,
    title: 'Hold Still',
    desc: 'The camera will auto-capture after 10 seconds of stable positioning. Stay steady!',
    tip: 'Rest your elbows on a surface for stability.',
    visual: 'steady',
  },
];

export function ScanCoach({ onComplete }: ScanCoachProps) {
  const [step, setStep] = useState(0);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, 'true');
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
  }, [onComplete]);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="scan-coach-overlay">
      <div className="scan-coach-card">
        <button
          type="button"
          className="scan-coach-skip"
          onClick={handleSkip}
          aria-label="Skip tutorial"
        >
          <IconX size={18} strokeWidth={2} />
          <span>Skip</span>
        </button>

        {/* Step indicator dots */}
        <div className="scan-coach-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`scan-coach-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* Visual illustration */}
        <div className={`scan-coach-visual scan-coach-visual--${current.visual}`}>
          <div className="scan-coach-face-outline">
            <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <ellipse cx="60" cy="72" rx="42" ry="55" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
              {/* Eyes */}
              <circle cx="42" cy="62" r="4" fill="currentColor" opacity="0.4" />
              <circle cx="78" cy="62" r="4" fill="currentColor" opacity="0.4" />
              {/* Nose */}
              <line x1="60" y1="68" x2="60" y2="82" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
              {/* Mouth */}
              <path d="M48 92 Q60 100 72 92" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
              {/* Shoulders hint */}
              <path d="M20 135 Q60 120 100 135" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
            </svg>

            {/* Animated indicators per step */}
            {current.visual === 'lighting' && (
              <div className="scan-coach-rays" aria-hidden="true">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <span key={deg} className="scan-coach-ray" style={{ transform: `rotate(${deg}deg)` }} />
                ))}
              </div>
            )}
            {current.visual === 'distance' && (
              <div className="scan-coach-distance-arrows" aria-hidden="true">
                <span className="scan-coach-arrow-left" />
                <span className="scan-coach-arrow-right" />
              </div>
            )}
            {current.visual === 'angle' && (
              <div className="scan-coach-crosshair" aria-hidden="true">
                <span className="crosshair-h" />
                <span className="crosshair-v" />
              </div>
            )}
            {current.visual === 'steady' && (
              <div className="scan-coach-pulse" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="scan-coach-content">
          <div className="scan-coach-icon-badge">
            <Icon size={24} strokeWidth={2} />
          </div>
          <h2 className="scan-coach-title">{current.title}</h2>
          <p className="scan-coach-desc">{current.desc}</p>
          <p className="scan-coach-tip">{current.tip}</p>
        </div>

        {/* Actions */}
        <div className="scan-coach-actions">
          {step > 0 && (
            <button
              type="button"
              className="scan-coach-back"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className="scan-coach-next"
            onClick={handleNext}
          >
            {isLast ? 'Start Scanning' : 'Next'}
            <IconArrowRight size={16} strokeWidth={2} />
          </button>
        </div>

        <p className="scan-coach-step-label">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}

export function shouldShowScanCoach(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
