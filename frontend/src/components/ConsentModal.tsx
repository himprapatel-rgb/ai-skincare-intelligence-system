import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConsentModal.css';

interface ConsentModalProps {
  visible: boolean;
  onAccept: (consentData: ConsentData) => void;
  onDecline: () => void;
  userId?: string;
}

interface ConsentData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingAccepted: boolean;
  marketingAccepted: boolean;
  analyticsAccepted: boolean;
  timestamp: string;
  userAgent: string;
  consentVersion: string;
}

interface PolicyVersion {
  version: string;
  effectiveDate: string;
  termsUrl: string;
  privacyUrl: string;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ visible, onAccept, onDecline, userId }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [policyVersion, setPolicyVersion] = useState<PolicyVersion | null>(null);

  useEffect(() => {
    const fetchPolicyVersion = async () => {
      try {
        const response = await axios.get('/api/v1/consent/policy-version');
        setPolicyVersion(response.data);
      } catch (error) {
        setPolicyVersion({ version: '1.0.0', effectiveDate: '2025-12-02', termsUrl: '/terms', privacyUrl: '/privacy' });
      }
    };
    if (visible) fetchPolicyVersion();
  }, [visible]);

  const allRequiredAccepted = termsAccepted && privacyAccepted && dataProcessingAccepted;

  const handleAccept = async () => {
    if (!allRequiredAccepted) return;
    setLoading(true);
    try {
      const consentData: ConsentData = {
        termsAccepted, privacyAccepted, dataProcessingAccepted, marketingAccepted, analyticsAccepted,
        timestamp: new Date().toISOString(), userAgent: navigator.userAgent,
        consentVersion: policyVersion?.version || '1.0.0'
      };
      if (userId) await axios.post('/api/v1/consent/record', { userId, ...consentData });
      onAccept(consentData);
    } catch (error) {
      console.error('Failed to record consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (userId) axios.post('/api/v1/consent/decline', { userId, timestamp: new Date().toISOString(), userAgent: navigator.userAgent }).catch(err => console.error(err));
    onDecline();
  };

  if (!visible) return null;

  return (
    <div className="consent-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent-modal">
        <div className="consent-header">
          <h2 id="consent-title">Privacy & Consent</h2>
          <p>Version {policyVersion?.version || '1.0.0'} | Effective: {policyVersion?.effectiveDate || '2025-12-02'}</p>
        </div>
        <div className="consent-content">
          <p><strong>To use the AI Skincare Intelligence System, we need your consent to process your data in compliance with GDPR.</strong></p>
          <div className="consent-section">
            <h3>Required Consents</h3>
            <label><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} aria-label="Accept Terms" />
              <strong>I accept the Terms of Service *</strong> <a href={policyVersion?.termsUrl || '/terms'} target="_blank" rel="noopener">Read Terms</a>
            </label>
            <label><input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} aria-label="Accept Privacy" />
              <strong>I accept the Privacy Policy *</strong> <a href={policyVersion?.privacyUrl || '/privacy'} target="_blank" rel="noopener">Read Privacy</a>
            </label>
            <label><input type="checkbox" checked={dataProcessingAccepted} onChange={(e) => setDataProcessingAccepted(e.target.checked)} aria-label="Accept Data Processing" />
              <strong>I consent to AI processing of my facial images *</strong> (GDPR Art. 6(1)(a))
            </label>
          </div>
          <div className="consent-section">
            <h3>Optional Consents</h3>
            <label><input type="checkbox" checked={marketingAccepted} onChange={(e) => setMarketingAccepted(e.target.checked)} aria-label="Marketing" />
              Send me product recommendations
            </label>
            <label><input type="checkbox" checked={analyticsAccepted} onChange={(e) => setAnalyticsAccepted(e.target.checked)} aria-label="Analytics" />
              Share anonymous usage data
            </label>
          </div>
          {!allRequiredAccepted && <p className="error" role="alert">* Please accept all required consents</p>}
        </div>
        <div className="consent-footer">
          <button onClick={handleDecline} className="btn-danger">Decline & Exit</button>
          <button onClick={handleAccept} disabled={!allRequiredAccepted || loading} className="btn-primary">
            {loading ? 'Processing...' : 'Accept & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
