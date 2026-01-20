// src/pages/OnboardingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSparkles, IconScan, IconZap, IconShield, IconBarChart, IconCheck } from '../components/Icons';
import './OnboardingPage.css';

interface OnboardingData {
  name: string;
  age: number;
  skinType: string;
  concerns: string[];
  goals: string[];
  cameraConsent: boolean;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    age: 0,
    skinType: '',
    concerns: [],
    goals: [],
    cameraConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (formData.goals.length === 0 || formData.concerns.length === 0 || !formData.skinType) {
        throw new Error('Please complete all required fields.');
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const payload = {
        goals: formData.goals.map((goal) => goal.toLowerCase().replace(/\s+/g, '_')),
        concerns: formData.concerns.map((concern) => concern.toLowerCase().replace(/\s+/g, '_')),
        skin_type: formData.skinType.toLowerCase(),
        routine_frequency: 'twice_daily',
        climate: 'temperate',
      };

      const response = await fetch(`${API_BASE}/profile/baseline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Onboarding failed');

      navigate('/scan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <div className="welcome-icon">
              <IconSparkles size={64} strokeWidth={2} />
            </div>
            <h1>Welcome to AuraSkin AI</h1>
            <p>Analyze your skin in seconds with AI-powered technology</p>
            <ul className="features-list">
              <li>
                <IconZap size={20} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                Fast analysis in under 3 seconds
              </li>
              <li>
                <IconShield size={20} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                Privacy-first - your data is secure
              </li>
              <li>
                <IconBarChart size={20} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                Detailed insights and recommendations
              </li>
            </ul>
            <button onClick={handleNext} className="btn-primary">Get Started</button>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
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
            <h2>Camera Permission</h2>
            <p className="step-description">Allow camera access for skin analysis</p>
            <div className="camera-info">
              <div className="camera-icon">
                <IconScan size={64} strokeWidth={2} />
              </div>
              <p>We need access to your camera to capture your skin for analysis</p>
              <ul className="permission-list">
                <li>
                  <IconCheck size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                  Photos are processed securely
                </li>
                <li>
                  <IconCheck size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                  Never shared without permission
                </li>
                <li>
                  <IconCheck size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
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
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="progress-bar">
          {[1, 2, 3, 4, 5].map(num => (
            <div 
              key={num} 
              className={`progress-step ${step >= num ? 'active' : ''}`}
            >
              {num}
            </div>
          ))}
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingPage;
