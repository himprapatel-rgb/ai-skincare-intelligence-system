// src/pages/OnboardingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSparkles, IconScan, IconCheck } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import './OnboardingPage.css';

const ONBOARDING_PROGRESS_KEY = 'onboarding_progress';

/** Section 8: Skin type options (Pellicura report) */
const SKIN_TYPES = ['Dry', 'Oily', 'Combo', 'Normal', 'Sensitive'];

/** Section 8: Main concerns (select all that apply) */
const CONCERNS_OPTIONS = ['Acne', 'Dark spots', 'Wrinkles', 'Redness', 'Dryness', 'Pores', 'Dark circles', 'Texture'];

/** Section 8: Routine complexity */
const ROUTINE_LEVELS = [
  { id: 'beginner', label: 'Beginner (0-2 products)', desc: '0-2 products' },
  { id: 'basic', label: 'Basic (3-5 products)', desc: '3-5 products' },
  { id: 'advanced', label: 'Advanced (6+ products)', desc: '6+ products' },
] as const;

interface OnboardingData {
  skinType: string;
  concerns: string[];
  routineLevel: string;
  cameraConsent: boolean;
}

const defaultFormData: OnboardingData = {
  skinType: '',
  concerns: [],
  routineLevel: '',
  cameraConsent: false,
};

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return typeof data?.step === 'number' ? data.step : 1;
    } catch {
      return 1;
    }
  });
  const [formData, setFormData] = useState<OnboardingData>(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (data?.formData && typeof data.formData === 'object') {
        const fd = data.formData;
        return {
          ...defaultFormData,
          skinType: fd.skinType || '',
          concerns: Array.isArray(fd.concerns) ? fd.concerns : [],
          routineLevel: fd.routineLevel || '',
          cameraConsent: Boolean(fd.cameraConsent),
        };
      }
    } catch {
      /* ignore */
    }
    return defaultFormData;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify({ step, formData }));
    } catch {
      /* ignore */
    }
  }, [step, formData]);

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern],
    }));
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const hasFormData = formData.skinType || formData.concerns.length > 0 || formData.routineLevel;

  const handleBack = () => {
    if (step <= 1) return;
    if (hasFormData) {
      setShowBackConfirm(true);
    } else {
      setStep(step - 1);
    }
  };

  const confirmBack = () => {
    setShowBackConfirm(false);
    setStep((s: number) => s - 1);
  };

  const submitBaselineAndGoToScan = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const payload = {
        goals: formData.concerns.slice(0, 3).map((c) => c.toLowerCase().replace(/\s+/g, '_')),
        concerns: formData.concerns.map((c) => c.toLowerCase().replace(/\s+/g, '_')),
        skin_type: (formData.skinType || 'normal').toLowerCase(),
        routine_frequency: formData.routineLevel === 'advanced' ? 'twice_daily' : formData.routineLevel === 'basic' ? 'daily' : 'few_times_weekly',
        climate: 'temperate',
      };
      const response = await fetch(`${API_BASE_URL}/profile/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Onboarding failed');
      try {
        localStorage.setItem('onboarding_goals', JSON.stringify({
          goals: formData.concerns,
          concerns: formData.concerns,
          skinType: formData.skinType,
          routineLevel: formData.routineLevel,
        }));
      } catch {
        /* ignore */
      }
      navigate('/scan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToScan = () => {
    submitBaselineAndGoToScan();
  };

  const handleSkipForNow = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const payload = {
        goals: formData.concerns.map((c) => c.toLowerCase().replace(/\s+/g, '_')),
        concerns: formData.concerns.map((c) => c.toLowerCase().replace(/\s+/g, '_')),
        skin_type: (formData.skinType || 'normal').toLowerCase(),
        routine_frequency: 'twice_daily',
        climate: 'temperate',
      };
      const response = await fetch(`${API_BASE_URL}/profile/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save');
      try {
        localStorage.setItem('onboarding_goals', JSON.stringify({
          goals: formData.concerns,
          concerns: formData.concerns,
          skinType: formData.skinType,
          routineLevel: formData.routineLevel,
        }));
        localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
      } catch {
        /* ignore */
      }
      setShowCompletion(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <div className="welcome-icon">
              <IconSparkles size={48} strokeWidth={1.5} />
            </div>
            <h1 className="onboarding-hero-title">Welcome to Pellicura</h1>
            <p className="onboarding-hero-subtitle">Your AI-powered skincare coach</p>
            <div className="button-group">
              <button type="button" onClick={handleNext} className="btn-primary">
                Get Started →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 2: Skin type (1/4)</p>
            <h2>What&apos;s your skin type?</h2>
            <div className="skin-type-grid">
              {SKIN_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`skin-type-btn ${formData.skinType === type ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, skinType: type })}
                >
                  {type}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0' }}>
              Not sure? <a href="/skin-quiz" style={{ color: 'var(--primary)', fontWeight: 600 }}>Take our detailed Skin Type Quiz</a>
            </p>
            <div className="button-group">
              <button type="button" onClick={handleBack} className="btn-secondary">Back</button>
              <button type="button" onClick={handleNext} className="btn-primary">Continue</button>
            </div>
            <button type="button" onClick={handleSkipToScan} className="btn-link onboarding-skip" disabled={loading}>
              Skip &amp; scan →
            </button>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 3: Concerns (2/4)</p>
            <h2>What are your main concerns?</h2>
            <p className="step-description">Select all that apply</p>
            <div className="options-grid">
              {CONCERNS_OPTIONS.map((concern) => (
                <label key={concern} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.concerns.includes(concern)}
                    onChange={() => handleConcernToggle(concern)}
                  />
                  <span className="checkbox-label">{concern}</span>
                </label>
              ))}
            </div>
            <div className="button-group">
              <button type="button" onClick={handleBack} className="btn-secondary">Back</button>
              <button type="button" onClick={handleNext} className="btn-primary">Continue →</button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 4: Routine (3/4)</p>
            <h2>How complex is your routine?</h2>
            <div className="routine-level-list">
              {ROUTINE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`routine-level-btn ${formData.routineLevel === level.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, routineLevel: level.id })}
                >
                  <span className="routine-level-label">{level.label}</span>
                </button>
              ))}
            </div>
            <div className="button-group">
              <button type="button" onClick={handleBack} className="btn-secondary">Back</button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
                disabled={!formData.routineLevel}
              >
                Continue →
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 5: First scan (4/4)</p>
            <div className="first-scan-icon">
              <IconScan size={56} strokeWidth={1.5} />
            </div>
            <h2>Let&apos;s scan your face!</h2>
            <p className="step-description">
              This helps us personalize everything just for you
            </p>
            {error && <div className="error-message">{error}</div>}
            <div className="button-group">
              <button
                type="button"
                onClick={submitBaselineAndGoToScan}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Start Face Scan'}
              </button>
              <button
                type="button"
                onClick={handleSkipForNow}
                className="btn-link onboarding-skip"
                disabled={loading}
              >
                Skip for now
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showCompletion) {
    return (
      <div className="onboarding-page app-page">
        <div className="app-page-content onboarding-container onboarding-completion">
          <div className="completion-icon" aria-hidden>🎉</div>
          <h1 className="completion-title">You&apos;re all set!</h1>
          <div className="completion-score">
            <span className="completion-score-label">Your Skin Score</span>
            <span className="completion-score-value">—</span>
            <p className="completion-score-hint">Complete a scan to see your score</p>
          </div>
          <ul className="completion-checklist">
            <li><IconCheck size={20} strokeWidth={2.5} /> Product recommendations</li>
            <li><IconCheck size={20} strokeWidth={2.5} /> Routine suggestions</li>
            <li><IconCheck size={20} strokeWidth={2.5} /> Ingredient warnings</li>
          </ul>
          <button type="button" onClick={handleGoToDashboard} className="btn-primary">
            Go to My Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page app-page">
      <ConfirmModal
        open={showBackConfirm}
        title="Leave onboarding?"
        message="You've entered some information. If you go back, you can continue later from where you left off."
        confirmLabel="Leave"
        cancelLabel="Stay"
        variant="neutral"
        onConfirm={confirmBack}
        onCancel={() => setShowBackConfirm(false)}
      />
      <div className="app-page-content onboarding-container">
        <div className="progress-bar" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5} aria-label={`Step ${step} of 5`}>
          <span className="progress-bar-label">Step {step} of 5</span>
          {[1, 2, 3, 4, 5].map(num => (
            <div 
              key={num} 
              className={`progress-step ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}
              aria-current={step === num ? 'step' : undefined}
            >
              {step > num ? '✓' : num}
            </div>
          ))}
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingPage;
