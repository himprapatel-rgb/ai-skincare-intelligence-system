// src/pages/OnboardingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSparkles, IconScan, IconZap, IconShield, IconBarChart, IconCheck } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { API_BASE_URL } from '../config';
import './OnboardingPage.css';

const ONBOARDING_PROGRESS_KEY = 'onboarding_progress';

interface OnboardingData {
  name: string;
  age: number;
  skinType: string;
  concerns: string[];
  goals: string[];
  cameraConsent: boolean;
}

const defaultFormData: OnboardingData = {
  name: '',
  age: 0,
  skinType: '',
  concerns: [],
  goals: [],
  cameraConsent: false
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
        return { ...defaultFormData, ...data.formData };
      }
    } catch {
      /* ignore */
    }
    return defaultFormData;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify({ step, formData }));
    } catch {
      /* ignore */
    }
  }, [step, formData]);

  const skinTypes = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'];
  const concernsOptions = ['Acne', 'Rosacea', 'Wrinkles', 'Dark Spots', 'Sensitivity', 'Dryness', 'Oiliness', 'Pores'];
  const goalsOptions = ['Clear skin', 'Anti-aging', 'Hydration', 'Brightening', 'Even tone', 'Reduce redness'];

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const hasFormData = formData.name || formData.age || formData.skinType || formData.concerns.length > 0 || formData.goals.length > 0;

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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (formData.goals.length === 0 || formData.concerns.length === 0 || !formData.skinType) {
        throw new Error('Please complete all required fields.');
      }

      const token = localStorage.getItem('auth_token');
      const payload = {
        goals: formData.goals.map((goal) => goal.toLowerCase().replace(/\s+/g, '_')),
        concerns: formData.concerns.map((concern) => concern.toLowerCase().replace(/\s+/g, '_')),
        skin_type: formData.skinType.toLowerCase(),
        routine_frequency: 'twice_daily',
        climate: 'temperate',
      };

      const response = await fetch(`${API_BASE_URL}/profile/baseline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Onboarding failed');

      try {
        localStorage.setItem('onboarding_goals', JSON.stringify({
          goals: formData.goals,
          concerns: formData.concerns,
          skinType: formData.skinType,
        }));
      } catch {
        /* ignore */
      }
      navigate('/scan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    } catch {
      /* ignore */
    }
    navigate('/scan');
  };

  const stepTitles: Record<number, string> = {
    1: 'Welcome',
    2: 'Profile setup',
    3: 'Skin concerns',
    4: 'Skincare goals',
    5: 'Camera permission',
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 1: {stepTitles[1]}</p>
            <div className="welcome-icon">
              <IconSparkles size={48} strokeWidth={1.5} />
            </div>
            <h1>Welcome to AuraSkin AI</h1>
            <p>Analyze your skin in seconds with AI-powered technology</p>
            <ul className="features-list">
              <li>
                <IconZap size={22} strokeWidth={2} />
                Fast analysis in under 3 seconds
              </li>
              <li>
                <IconShield size={22} strokeWidth={2} />
                Privacy-first - your data is secure
              </li>
              <li>
                <IconBarChart size={22} strokeWidth={2} />
                Detailed insights and recommendations
              </li>
            </ul>
            <div className="button-group">
              <button onClick={handleNext} className="btn-primary">
                Get Started
              </button>
              <button type="button" onClick={handleSkip} className="btn-link onboarding-skip">
                Skip for now
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 2: {stepTitles[2]}</p>
            <h2>Profile Setup</h2>
            <p className="step-description">Tell us a bit about yourself</p>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                value={formData.age || ''}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                placeholder="Enter your age"
                min="13"
                max="120"
                required
              />
            </div>
            <div className="form-group">
              <label>Skin Type *</label>
              <div className="skin-type-grid">
                {skinTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`skin-type-btn ${formData.skinType === type ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, skinType: type})}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="button-group">
              <button onClick={handleBack} className="btn-secondary">Back</button>
              <button 
                onClick={handleNext} 
                className="btn-primary"
                disabled={!formData.name || !formData.age || !formData.skinType}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 3: {stepTitles[3]}</p>
            <h2>Skin Concerns</h2>
            <p className="step-description">Select all that apply (optional)</p>
            <div className="options-grid">
              {concernsOptions.map(concern => (
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
              <button onClick={handleBack} className="btn-secondary">Back</button>
              <button onClick={handleNext} className="btn-primary">Next</button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Skincare Goals</h2>
            <p className="step-description">What do you want to achieve?</p>
            <div className="options-grid">
              {goalsOptions.map(goal => (
                <label key={goal} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={formData.goals.includes(goal)}
                    onChange={() => handleGoalToggle(goal)}
                  />
                  <span className="checkbox-label">{goal}</span>
                </label>
              ))}
            </div>
            <div className="button-group">
              <button onClick={handleBack} className="btn-secondary">Back</button>
              <button onClick={handleNext} className="btn-primary">Next</button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <p className="onboarding-step-title" role="status">Step 5: {stepTitles[5]}</p>
            <h2>Camera Permission</h2>
            <p className="step-description">Allow camera access for skin analysis</p>
            <div className="camera-info">
              <div className="camera-icon">
                <IconScan size={40} strokeWidth={1.5} />
              </div>
              <p>We need access to your camera to capture your skin for analysis</p>
              <ul className="permission-list">
                <li>
                  <IconCheck size={18} strokeWidth={2.5} />
                  Photos are processed securely
                </li>
                <li>
                  <IconCheck size={18} strokeWidth={2.5} />
                  Never shared without permission
                </li>
                <li>
                  <IconCheck size={18} strokeWidth={2.5} />
                  You can revoke access anytime
                </li>
              </ul>
            </div>
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={formData.cameraConsent}
                onChange={(e) => setFormData({...formData, cameraConsent: e.target.checked})}
              />
              <span>I consent to camera access for skin analysis</span>
            </label>
            {error && <div className="error-message">{error}</div>}
            <div className="button-group">
              <button onClick={handleBack} className="btn-secondary">Back</button>
              <button 
                onClick={handleSubmit} 
                className="btn-primary"
                disabled={loading || !formData.cameraConsent}
              >
                {loading ? 'Setting up...' : 'Start Scanning'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
