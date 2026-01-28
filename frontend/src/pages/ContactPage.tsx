import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconMail, IconClock, IconMessageCircle, IconMapPin, IconCheckCircle, IconInstagram, IconTwitter, IconLinkedin, IconTiktok } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  usePageTitle('Contact');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just show success message
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Get in Touch</h1>
        <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </div>

      <div className="contact-container">
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
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <IconInstagram size={18} strokeWidth={2} />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                <IconTwitter size={18} strokeWidth={2} />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                <IconTiktok size={18} strokeWidth={2} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <IconLinkedin size={18} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          {submitted ? (
            <div className="success-message">
              <div className="success-icon">
                <IconCheckCircle size={24} strokeWidth={2} />
              </div>
              <h2>Thank You!</h2>
              <p>Your message has been received. We'll get back to you soon.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                />
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
