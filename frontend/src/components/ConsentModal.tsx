/**
 * ConsentModal Component
 * Sprint 1.2 - Story 1.9: Consent & Privacy
 * 
 * GDPR-compliant consent modal with version tracking
 * SRS Mapping: BR12, FR46, NFR4
 * 
 * Features:
 * - Privacy policy display
 * - Accept/Reject consent flow
 * - Version tracking and re-consent
 * - Accessibility (WCAG 2.1 AA)
 * - Blocks app access without consent
 */

import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, Check } from 'lucide-react';
import axios from 'axios';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  policyVersion: string;
}

interface PrivacyPolicy {
  version: string;
  content: string;
  lastUpdated: string;
  effectiveDate: string;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  policyVersion
}) => {
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPrivacyPolicy();
    }
  }, [isOpen]);

  const fetchPrivacyPolicy = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/v1/legal/privacy-policy');
      setPolicy(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load privacy policy. Please try again.');
      console.error('Privacy policy fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isScrolledToBottom = 
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (isScrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleAccept = async () => {
    try {
      await axios.post('/api/v1/consent/accept', {
        policy_version: policy?.version,
        accepted: true,
        timestamp: new Date().toISOString()
      });
      onAccept();
    } catch (err) {
      setError('Failed to record consent. Please try again.');
      console.error('Consent acceptance error:', err);
    }
  };

  const handleReject = async () => {
    try {
      await axios.post('/api/v1/consent/reject', {
        policy_version: policy?.version,
        accepted: false
      });
      onReject();
    } catch (err) {
      console.error('Consent rejection error:', err);
      onReject(); // Still proceed with rejection
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      aria-describedby="consent-modal-description"
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" aria-hidden="true" />
            <h2
              id="consent-modal-title"
              className="text-2xl font-bold text-gray-900"
            >
              Privacy & Consent
            </h2>
          </div>
          <button
            onClick={handleReject}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close and reject consent"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
          tabIndex={0}
          aria-live="polite"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="sr-only">Loading privacy policy...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4" role="alert">{error}</p>
              <button
                onClick={fetchPrivacyPolicy}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <FileText className="w-4 h-4" />
                  <span>Version {policy?.version}</span>
                  <span>•</span>
                  <span>Effective: {new Date(policy?.effectiveDate || '').toLocaleDateString()}</span>
                </div>
                <p
                  id="consent-modal-description"
                  className="text-lg text-gray-700 mb-4"
                >
                  We value your privacy. Please review and accept our Privacy Policy to continue using the AI Skincare Intelligence System.
                </p>
              </div>

              <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                <div dangerouslySetInnerHTML={{ __html: policy?.content || '' }} />
              </div>

              {!hasScrolled && (
                <div className="text-center text-sm text-gray-500 py-2" aria-live="polite">
                  Please scroll to read the entire policy
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start space-x-3 mb-4">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              By clicking "Accept", you acknowledge that you have read and understood our Privacy Policy and agree to the collection, use, and sharing of your data as described.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Reject privacy policy and exit"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              disabled={!hasScrolled || isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Accept privacy policy and continue"
            >
              Accept & Continue
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Rejecting this policy will prevent you from using the application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;

// Hook for managing consent state
export const useConsent = () => {
  const [consentRequired, setConsentRequired] = useState(false);
  const [policyVersion, setPolicyVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      const response = await axios.get('/api/v1/consent/status');
      setConsentRequired(response.data.consent_required);
      setPolicyVersion(response.data.latest_version);
    } catch (err) {
      console.error('Consent status check error:', err);
      setConsentRequired(true); // Default to requiring consent on error
    } finally {
      setIsLoading(false);
    }
  };

  return { consentRequired, policyVersion, isLoading, checkConsentStatus };
};
