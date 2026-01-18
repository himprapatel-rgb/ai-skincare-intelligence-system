import React from 'react';
import { Link } from 'react-router-dom';
import './SampleReportPage.css';

const SampleReportPage: React.FC = () => {
  return (
    <div className="sample-report-page">
      <main className="sample-report-container sample-report-main">
        <section className="sample-report-hero">
          <h1>Sample Skin Analysis Report</h1>
          <p>
            This is a preview of the insights you get after uploading a clear selfie.
            Results are estimates based on visible features and image quality.
          </p>
        </section>

        <section className="sample-report-grid">
          <div className="sample-card">
            <h2>Overall Score</h2>
            <div className="sample-score">85</div>
            <p>Balanced skin with good hydration and low redness.</p>
          </div>
          <div className="sample-card">
            <h2>Top Concerns</h2>
            <ul>
              <li>Mild acne on T-zone</li>
              <li>Slight redness on cheeks</li>
              <li>Minor texture unevenness</li>
            </ul>
          </div>
          <div className="sample-card">
            <h2>Routine Suggestions</h2>
            <ul>
              <li>Gentle cleanser (AM/PM)</li>
              <li>Hydrating serum (AM)</li>
              <li>Niacinamide (PM)</li>
              <li>SPF 30+ daily (AM)</li>
            </ul>
          </div>
        </section>

        <section className="sample-report-cta">
          <h3>Want your own report?</h3>
          <Link to="/scan" className="sample-report-btn">Start Free Skin Scan</Link>
        </section>
      </main>
    </div>
  );
};

export default SampleReportPage;
