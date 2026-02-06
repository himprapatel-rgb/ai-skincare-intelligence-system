import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import './SkinTypeGuidePage.css';

const TYPES = [
  { name: 'Normal', desc: 'Balanced hydration, minimal concerns. Maintain with consistent gentle care.' },
  { name: 'Dry', desc: 'Often feels tight or flaky. Needs rich hydration and barrier care.' },
  { name: 'Oily', desc: 'Shiny T-zone and visible pores. Benefit from lightweight, balancing care.' },
  { name: 'Combination', desc: 'Mix of dry and oily areas. Target T-zone and hydrate cheeks.' },
  { name: 'Sensitive', desc: 'Prone to redness or irritation. Focus on calming and minimal formulas.' },
];

const SkinTypeGuidePage: React.FC = () => {
  usePageTitle('Skin Type Guide');
  return (
    <div className="skin-type-page app-page">
      <header className="app-header-card">
        <h1>Skin Type Guide</h1>
        <p className="app-header-subtitle">Identify your type and choose products with confidence.</p>
      </header>
      <div className="app-page-content skin-type-container">
        <div className="skin-type-grid">
          {TYPES.map((t) => (
            <div key={t.name} className="skin-type-card">
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="skin-type-tips">
          <h2>How to Identify Your Type</h2>
          <ol className="skin-type-steps">
            <li>Cleanse and wait 60 minutes without applying products.</li>
            <li>Notice shine (oily), tightness (dry), or a mix (combination).</li>
            <li>Track changes across seasons and stress levels.</li>
          </ol>
        </div>

        <div className="skin-type-summary" role="region" aria-label="Result summary">
          <h2>Using Your Result</h2>
          <p className="skin-type-summary-text">
            Your skin type helps you choose the right products. Dry? Prioritize rich hydration and barrier care. Oily? Look for lightweight, non-comedogenic formulas. Combination? Target the T-zone and hydrate drier areas. Sensitive? Stick to calming, minimal-ingredient products.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkinTypeGuidePage;
