import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconMail, IconClock, IconMessageCircle, IconMapPin, IconCheckCircle, IconInstagram, IconTwitter, IconLinkedin, IconTiktok } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import { SOCIAL_LINKS } from '../config';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  usePageTitle('Contact');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [subjectPreFilled, setSubjectPreFilled] = useState(false);

  useEffect(() => {
    const subject = searchParams.get('subject');
    if (subject && !subjectPreFilled) {
      setFormData((prev) => ({ ...prev, subject }));
      setSubjectPreFilled(true);
    }
  }, [searchParams, subjectPreFilled]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = 'Name is required';
    if (!formData.email.trim()) next.email = 'Email is required';
    if (!formData.subject.trim()) next.subject = 'Subject is required';
    if (!formData.message.trim()) next.message = 'Message is required';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-page app-page">
      <header className="app-header-card">
        <h1>Get in touch</h1>
        <p className="app-header-subtitle">Questions? Send a message and we'll reply soon.</p>
      </header>
      <div className="app-page-content contact-container">
        <div className="contact-info">
          <div className="info-card">
            <div className="info-icon">
              <IconMail size={32} strokeWidth={2} />
            </div>
            <h3>Email Us</h3>
            <p>support@aiskincareai.com</p>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <IconMessageCircle size={32} strokeWidth={2} />
            </div>
            <h3>Live Chat</h3>
            <p>Available 9AM - 6PM EST</p>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <IconMapPin size={32} strokeWidth={2} />
            </div>
            <h3>Location</h3>
            <p>San Francisco, CA</p>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <IconClock size={32} strokeWidth={2} />
            </div>
            <h3>Response Time</h3>
            <p>Within 24 hours</p>
          </div>

          <div className="info-card social-card">
            <div className="info-icon">
              <IconMessageCircle size={32} strokeWidth={2} />
            </div>
            <h3>Social Support</h3>
            <p>Reach out on your favorite platform</p>
            <div className="social-links">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <IconInstagram size={18} strokeWidth={2} />
              </a>
              <a href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer" aria-label="X">
                <IconTwitter size={18} strokeWidth={2} />
              </a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                <IconTiktok size={18} strokeWidth={2} />
              </a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <IconLinkedin size={18} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          {submitted ? (
            <div className="success-message" role="status" aria-live="polite">
              <div className="success-icon">
                <IconCheckCircle size={24} strokeWidth={2} />
              </div>
              <h2>Message sent</h2>
              <p>Thanks! We&apos;ve received your message and will respond within 24 hours.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  aria-required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <span id="name-error" className="form-error">{errors.name}</span>}
              </div>

              <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  aria-required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <span id="email-error" className="form-error">{errors.email}</span>}
              </div>

              <div className={`form-group ${errors.subject ? 'has-error' : ''}`}>
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                  aria-required
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'subject-error' : undefined}
                />
                {errors.subject && <span id="subject-error" className="form-error">{errors.subject}</span>}
              </div>

              <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  aria-required
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                />
                {errors.message && <span id="message-error" className="form-error">{errors.message}</span>}
              </div>

              <button type="submit" className="submit-button">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>How does the AI analysis work?</h3>
            <p>Our AI analyzes your skin image using advanced computer vision to identify skin types, conditions, and provide personalized recommendations.</p>
          </div>
          <div className="faq-item">
            <h3>Is my data secure?</h3>
            <p>Yes, we use industry-standard encryption and comply with GDPR regulations to protect your personal information.</p>
          </div>
          <div className="faq-item">
            <h3>Can I delete my data?</h3>
            <p>Absolutely. You can request data deletion at any time through your account settings or our privacy page.</p>
          </div>
          <div className="faq-item">
            <h3>Do you offer refunds?</h3>
            <p>We offer a 30-day satisfaction guarantee for premium features. Contact us if you're not completely satisfied.</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Try It?</h2>
        <p>Experience personalized skincare recommendations powered by AI</p>
        <button className="cta-button" onClick={() => navigate('/scan')}>
          Start Free Scan
        </button>
      </div>
    </div>
  );
};

export default ContactPage;
