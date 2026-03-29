import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './ConsentPage.css';

interface ConsentOptions {
  dataCollection: boolean;
  locationAndDevice: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

interface PolicyVersions {
  termsVersion: string;
  privacyVersion: string;
}

const ConsentPage: React.FC = () => {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<ConsentOptions>({
    dataCollection: false,
    locationAndDevice: false,
    analytics: false,
    marketing: false,
    thirdParty: false
  });
  const [policyVersions, setPolicyVersions] = useState<PolicyVersions>({
    termsVersion: 'terms-1.0.0',
    privacyVersion: 'privacy-1.0.0'
  });
  const [hasExistingConsent, setHasExistingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch current policies and existing consent on mount
  useEffect(() => {
    const fetchConsentData = async () => {
      try {
        // Fetch current policy versions
        const policiesResponse = await api.get('/consent/policies/current');
        const policies = policiesResponse.data;
        setPolicyVersions({
          termsVersion: policies.terms_of_service?.version || 'terms-1.0.0',
          privacyVersion: policies.privacy_policy?.version || 'privacy-1.0.0'
        });

        // Try to fetch existing consent status (will 404 if none)
        try {
          const statusResponse = await api.get('/consent/status');
          if (statusResponse.data) {
            setHasExistingConsent(true);
            // Load any stored granular preferences
            const stored = localStorage.getItem('userConsents');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setConsents(prev => ({ ...prev, ...parsed }));
              } catch {
                /* ignore */
              }
            }
          }
        } catch {
          // No existing consent - that's fine
          setHasExistingConsent(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to fetch consent data:', err);
        // Use defaults if API fails
      } finally {
        setInitialLoading(false);
      }
    };

    fetchConsentData();
  }, []);

  const handleConsentChange = (key: keyof ConsentOptions) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAcceptAll = () => {
    setConsents({
      dataCollection: true,
      locationAndDevice: true,
      analytics: true,
      marketing: true,
      thirdParty: true
    });
  };

  const handleRejectAll = () => {
    setConsents({
      dataCollection: false,
      locationAndDevice: false,
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
      // Call the real consent API
      await api.post('/consent/accept', {
        terms_accepted: true,
        privacy_accepted: true,
        terms_version: policyVersions.termsVersion,
        privacy_version: policyVersions.privacyVersion
      });
      
      // Store granular preferences in localStorage (for analytics, marketing, thirdParty)
      localStorage.setItem('userConsents', JSON.stringify(consents));
      localStorage.setItem('consentTimestamp', new Date().toISOString());
      
      // Navigate to next page (onboarding or home)
      navigate('/onboarding');
    } catch (err: unknown) {
      if (import.meta.env.DEV) if (import.meta.env.DEV) console.error('Failed to save consent:', err);
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response : undefined;
      if (res?.status === 401) {
        setError('Please log in to save your preferences.');
      } else if (res?.status === 400) {
        setError('Invalid policy versions. Please refresh and try again.');
      } else {
        setError('Failed to save your preferences. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="consent-page app-page">
        <div className="app-page-content consent-container">
          <div className="consent-header">
            <h1>Loading…</h1>
            <p className="subtitle">Fetching your preferences</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consent-page app-page">
      <header className="app-header-card">
        <h1>Your privacy</h1>
        <p className="app-header-subtitle">We collect data like other apps — you choose what’s optional.</p>
      </header>
      <div className="app-page-content consent-container">
        {hasExistingConsent && (
          <p className="consent-existing-notice">You’ve accepted before. Update optional preferences below.</p>
        )}

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
              <p className="consent-summary">Required for skin analysis and your account.</p>
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
                  <h3>Location & device data</h3>
                  <span className="badge-optional">Optional</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={consents.locationAndDevice}
                    onChange={() => handleConsentChange('locationAndDevice')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <p className="consent-summary">Like other apps, we may use location and device info to personalize your experience.</p>
              <p className="consent-description">
                With your permission we may collect approximate location, device type, and language to improve recommendations and app experience. You can turn this off anytime.
              </p>
              <ul className="consent-details">
                <li>Approximate location (country/region)</li>
                <li>Device type and OS</li>
                <li>Language and time zone</li>
              </ul>
            </div>

            <div className="consent-item">
              <div className="consent-header-item">
                <div className="consent-title">
                  <h3>Analytics & performance</h3>
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
              <p className="consent-summary">Helps us improve the app and fix issues.</p>
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
              <p className="consent-summary">Product tips, offers, and skincare recommendations by email.</p>
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
              <p className="consent-summary">Anonymized data may be shared with research partners.</p>
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
            <h3>Your rights</h3>
            <p>
              You can access, change, or delete your data anytime and withdraw optional consents. See our <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms</Link>.
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
          <p>Last updated: January 2026. Change preferences anytime in Settings.</p>
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
