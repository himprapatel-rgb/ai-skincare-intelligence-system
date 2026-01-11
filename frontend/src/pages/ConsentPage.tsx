import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConsentPage.css';

interface ConsentOptions {
  dataCollection: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

const ConsentPage: React.FC = () => {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<ConsentOptions>({
    dataCollection: false,
    analytics: false,
    marketing: false,
    thirdParty: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConsentChange = (key: keyof ConsentOptions) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAcceptAll = () => {
    setConsents({
      dataCollection: true,
      analytics: true,
      marketing: true,
      thirdParty: true
    });
  };

  const handleRejectAll = () => {
    setConsents({
      dataCollection: false,
      analytics: false,
      marketing: false,
      thirdParty: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/consent', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(consents)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store consents in localStorage
      localStorage.setItem('userConsents', JSON.stringify(consents));
      localStorage.setItem('consentTimestamp', new Date().toISOString());
      
      // Navigate to next page (onboarding or home)
      navigate('/onboarding');
    } catch (err) {
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consent-page">
      <div className="consent-container">
        <div className="consent-header">
          <h1>Your Privacy Matters</h1>
          <p className="subtitle">We value your privacy and want to be transparent about how we use your data</p>
        </div>

        <form onSubmit={handleSubmit} className="consent-form">
          <div className="consent-section">
            <div className="consent-item required">
              <div className="consent-header-item">
                <div className="consent-title">
                  <h3>Essential Data Collection</h3>
                  <span className="badge-required">Required</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="consent-description">
                We collect and process basic information necessary to provide you with our skin analysis service. 
                This includes your skin images, profile data, and analysis results. This consent is mandatory 
                to use our service.
              </p>
              <ul className="consent-details">
                <li>Skin scan images and analysis</li>
                <li>Basic profile information (age, skin type)</li>
                <li>Analysis history and results</li>
              </ul>
            </div>

            <div className="consent-item">
              <div className="consent-header-item">
                <div className="consent-title">
                  <h3>Analytics & Performance</h3>
                  <span className="badge-optional">Optional</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={consents.analytics}
                    onChange={() => handleConsentChange('analytics')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="consent-description">
                Help us improve our service by allowing us to collect anonymous usage data and performance metrics.
              </p>
              <ul className="consent-details">
                <li>App usage patterns and features used</li>
                <li>Performance metrics and error reports</li>
                <li>Device and browser information</li>
              </ul>
            </div>

            <div className="consent-item">
              <div className="consent-header-item">
                <div className="consent-title">
                  <h3>Personalized Marketing</h3>
                  <span className="badge-optional">Optional</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={consents.marketing}
                    onChange={() => handleConsentChange('marketing')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="consent-description">
                Receive personalized product recommendations, skincare tips, and special offers tailored to your skin profile.
              </p>
              <ul className="consent-details">
                <li>Personalized email newsletters</li>
                <li>Product recommendations based on your skin analysis</li>
                <li>Special offers and promotions</li>
              </ul>
            </div>

            <div className="consent-item">
              <div className="consent-header-item">
                <div className="consent-title">
                  <h3>Third-Party Data Sharing</h3>
                  <span className="badge-optional">Optional</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={consents.thirdParty}
                    onChange={() => handleConsentChange('thirdParty')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="consent-description">
                Allow us to share anonymized data with trusted research partners to advance skincare science and AI technology.
              </p>
              <ul className="consent-details">
                <li>Anonymized skin analysis data for research</li>
                <li>Aggregated usage statistics</li>
                <li>No personal identifiable information shared</li>
              </ul>
            </div>
          </div>

          <div className="privacy-info">
            <h3>Your Rights</h3>
            <p>
              You have the right to access, modify, or delete your data at any time. You can also withdraw 
              your consent for optional data processing. Learn more in our <a href="/privacy">Privacy Policy</a> and 
              <a href="/terms">Terms of Service</a>.
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="consent-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleRejectAll}
              disabled={loading}
            >
              Reject Optional
            </button>
            <button 
              type="button" 
              className="btn-outline"
              onClick={handleAcceptAll}
              disabled={loading}
            >
              Accept All
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>

        <div className="consent-footer">
          <p>Last updated: January 2025</p>
          <p>You can change these preferences at any time in your settings.</p>
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
