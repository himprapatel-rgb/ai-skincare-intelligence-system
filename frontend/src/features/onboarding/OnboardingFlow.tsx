import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep } from './components/OnboardingStep';
import { ProgressIndicator } from '../../components/ProgressIndicator';
import { ProfileService } from '../../services/ProfileService';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingData } from './types';

/**
 * Complete user onboarding flow capturing baseline profile.
 * 
 * SRS Traceability:
 * - UR1: Create an account, define goals, and specify primary concerns
 * - FR46: Tag analyses with model version
 * - NFR4: AES-256 encryption (handled by backend)
 * - NFR8: WCAG 2.1 AA accessibility
 * 
 * Sprint: 1.2 - Story 1.2
 */
export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    goals: [],
    concerns: [],
    skinType: '',
    routineFrequency: '',
    climate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const totalSteps = 6;
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStepComplete = async (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep === totalSteps) {
      // Final step - submit profile
      setIsSubmitting(true);
      setError(null);
      
      try {
        await ProfileService.createBaselineProfile(updatedData);
        
        // Track analytics
        if (window.analytics) {
          window.analytics.track('Onboarding Completed', {
            user_id: user?.id,
            goals: updatedData.goals,
            concerns_count: updatedData.concerns.length,
            skin_type: updatedData.skinType,
            timestamp: new Date().toISOString()
          });
        }
        
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to create profile. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit onboarding? Your progress will not be saved.')) {
      navigate('/dashboard');
    }
  };

  return (
    <div 
      className="onboarding-container" 
      role="main" 
      aria-label="User onboarding flow"
    >
      <div className="onboarding-header">
        <button
          onClick={handleExit}
          className="exit-button"
          aria-label="Exit onboarding"
        >
          ✕
        </button>
        <ProgressIndicator 
          current={currentStep} 
          total={totalSteps} 
          aria-label={`Step ${currentStep} of ${totalSteps}`}
        />
      </div>

      {error && (
        <div 
          className="error-message" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <OnboardingStep
        step={currentStep}
        data={formData}
        onComplete={handleStepComplete}
        onBack={handleBack}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default OnboardingFlow;
