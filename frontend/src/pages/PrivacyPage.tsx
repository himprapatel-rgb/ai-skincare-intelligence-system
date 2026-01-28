import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import './PrivacyPage.css';

const PrivacyPage: React.FC = () => {
  usePageTitle('Privacy Policy');
  const navigate = useNavigate();

  return (
    <div className="privacy-page">
      <div className="privacy-hero">
        <h1>Privacy Policy</h1>
        <p className="effective-date">Effective: January 2026</p>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="privacy-summary">We collect only what we need to run the service, keep your data secure, and never sell it. You can export or delete your data anytime.</p>
      </div>

      <nav className="privacy-toc" aria-label="Privacy policy sections">
          <h2 className="privacy-toc-title">On this page</h2>
          <ul>
            <li><a href="#intro">Introduction</a></li>
            <li><a href="#info-we-collect">Information We Collect</a></li>
            <li><a href="#how-we-use">How We Use Your Information</a></li>
            <li><a href="#data-retention">Data Retention</a></li>
            <li><a href="#your-rights">Your Data Protection Rights</a></li>
            <li><a href="#delete">Delete My Data</a></li>
          </ul>
        </nav>
      <div className="privacy-container">
        <section className="privacy-section" id="intro">
          <h2>1. Introduction</h2>
          <p>
            At AI Skincare Intelligence System, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
          </p>
        </section>

        <section className="privacy-section" id="info-we-collect">
          <h2>2. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>
            We may collect personal information that you voluntarily provide when you register on the application, express an interest in obtaining information about us or our products and services, or otherwise contact us.
          </p>
          <ul>
            <li>Name and contact data (email address, phone number)</li>
            <li>Profile information (username, profile photo)</li>
            <li>Skin analysis images you upload</li>
            <li>Device and usage information</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>
            When you access our application, we may automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies installed on your device.
          </p>
        </section>

        <section className="privacy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect or receive:</p>
          <ul>
            <li>To provide and improve our AI skin analysis service</li>
            <li>To send you personalized skincare recommendations</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To send administrative information such as updates to our terms and policies</li>
            <li>To protect our services and prevent fraud</li>
            <li>To analyze usage patterns and improve user experience</li>
          </ul>
        </section>

        <section className="privacy-section" id="data-retention">
          <h2>4. Data Retention</h2>
          <p>
            We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your personal information, we will securely delete or anonymize it.
          </p>
        </section>

        <section className="privacy-section" id="your-rights">
          <h2>5. Your Data Protection Rights (GDPR)</h2>
          <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights:</p>
          <ul>
            <li><strong>Right to Access:</strong> You can request copies of your personal data</li>
            <li><strong>Right to Rectification:</strong> You can request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
            <li><strong>Right to Restrict Processing:</strong> You can request restriction of processing</li>
            <li><strong>Right to Data Portability:</strong> You can request transfer of your data</li>
            <li><strong>Right to Object:</strong> You can object to our processing of your data</li>
          </ul>
        </section>

        <section className="privacy-section" id="delete">
          <h2>6. Delete My Data</h2>
          <p>
            You have the right to request deletion of your personal data at any time. To request data deletion:
          </p>
          <ol>
            <li>Log into your account and navigate to Settings</li>
            <li>Click on "Delete Account" or "Request Data Deletion"</li>
            <li>Confirm your request</li>
            <li>Alternatively, contact us at privacy@aiskincareai.com</li>
          </ol>
          <p>
            We will process your deletion request within 30 days. Please note that we may need to retain certain information for legal or legitimate business purposes.
          </p>
          <button className="delete-button" onClick={() => navigate('/contact')}>
            Request Data Deletion
          </button>
        </section>

        <section className="privacy-section">
          <h2>7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Third-Party Services</h2>
          <p>
            We may employ third-party companies and individuals to facilitate our service, provide service on our behalf, or assist us in analyzing how our service is used. These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Children's Privacy</h2>
          <p>
            Our service is not intended for children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.
          </p>
        </section>

        <section className="privacy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
          </p>
        </section>

        <section className="privacy-section">
          <h2>12. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: privacy@aiskincareai.com</li>
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

export default PrivacyPage;
