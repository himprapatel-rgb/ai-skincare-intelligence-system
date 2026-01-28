import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import './TermsPage.css';

const TermsPage: React.FC = () => {
  usePageTitle('Terms of Service');
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-hero">
        <h1>Terms of Service</h1>
        <p className="effective-date">Effective: January 2026</p>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="terms-summary">By using our app you agree to use the service as intended, accept that skin analysis is for informational use only, and follow our acceptable use policy.</p>
      </div>

      <nav className="terms-toc" aria-label="Terms of Service sections">
          <h2 className="terms-toc-title">On this page</h2>
          <ul>
            <li><a href="#acceptance">Acceptance of Terms</a></li>
            <li><a href="#description">Description of Service</a></li>
            <li><a href="#user-accounts">User Accounts</a></li>
            <li><a href="#medical-disclaimer">Medical Disclaimer</a></li>
            <li><a href="#user-content">User Content and Conduct</a></li>
            <li><a href="#ip">Intellectual Property</a></li>
            <li><a href="#liability">Limitation of Liability</a></li>
            <li><a href="#modifications">Service Modifications</a></li>
            <li><a href="#termination">Termination</a></li>
            <li><a href="#governing-law">Governing Law</a></li>
            <li><a href="#changes">Changes to Terms</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </nav>
      <div className="terms-container">
        <section className="terms-section" id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the AI Skincare Intelligence System, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, you may not access or use this service.
          </p>
        </section>

        <section className="terms-section" id="description">
          <h2>2. Description of Service</h2>
          <p>
            AI Skincare Intelligence System provides an AI-powered skin analysis platform that uses machine learning to analyze uploaded images and provide personalized skincare recommendations. The service includes:
          </p>
          <ul>
            <li>AI-based skin condition analysis</li>
            <li>Personalized product recommendations</li>
            <li>Skin health tracking and history</li>
            <li>Educational content about skincare</li>
          </ul>
        </section>

        <section className="terms-section" id="user-accounts">
          <h2>3. User Accounts</h2>
          <p>
            To use certain features of our service, you must register for an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain the security of your password and account</li>
            <li>Promptly notify us of any unauthorized use of your account</li>
            <li>Be responsible for all activities that occur under your account</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Medical Disclaimer</h2>
          <div className="disclaimer-box">
            <p>
              <strong>IMPORTANT:</strong> This service is for informational and educational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have learned through this service.
            </p>
          </div>
        </section>

        <section className="terms-section" id="user-content">
          <h2>5. User Content and Conduct</h2>
          <p>By uploading images or content to our service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and analyze such content for the purpose of providing our services. You agree NOT to:</p>
          <ul>
            <li>Upload images of minors without proper consent</li>
            <li>Upload inappropriate, offensive, or illegal content</li>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to interfere with or disrupt the service</li>
            <li>Use automated systems to access the service</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>6. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are owned by AI Skincare Intelligence System and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section className="terms-section" id="liability">
          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, AI Skincare Intelligence System shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from:
          </p>
          <ul>
            <li>Your use or inability to use the service</li>
            <li>Any unauthorized access to or use of our servers</li>
            <li>Any interruption or cessation of transmission to or from the service</li>
            <li>Any bugs, viruses, trojan horses, or the like transmitted through the service</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Service Modifications</h2>
          <p>
            We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.
          </p>
        </section>

        <section className="terms-section" id="termination">
          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of California, United States, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought exclusively in the courts located in San Francisco, California.
          </p>
        </section>

        <section className="terms-section" id="changes">
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section className="terms-section" id="contact">
          <h2>12. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>Email: legal@aiskincareai.com</li>
            <li>Address: San Francisco, CA</li>
          </ul>
          <button className="contact-button" onClick={() => navigate('/contact')}>
            Contact Us
          </button>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
