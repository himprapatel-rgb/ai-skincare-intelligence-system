import React from 'react';
import './SkinTypeGuidePage.css';

const SkinTypeGuidePage: React.FC = () => {
  return (
    <div className="skin-type-page">
      <div className="skin-type-container">
        <div className="page-header">
          <h1>Skin Type Guide</h1>
          <p>Identify your skin type and choose products with confidence.</p>
        </div>

        <div className="skin-type-grid">
          <div className="skin-type-card">
            <h3>Dry</h3>
            <p>Often feels tight or flaky. Needs rich hydration and barrier care.</p>
          </div>
          <div className="skin-type-card">
            <h3>Oily</h3>
            <p>Shiny T-zone and visible pores. Benefit from lightweight, balancing care.</p>
          </div>
          <div className="skin-type-card">
            <h3>Combination</h3>
            <p>Mix of dry and oily areas. Target T-zone and hydrate cheeks.</p>
          </div>
          <div className="skin-type-card">
            <h3>Sensitive</h3>
            <p>Prone to redness or irritation. Focus on calming and minimal formulas.</p>
          </div>
        </div>

        <div className="skin-type-tips">
          <h2>How to Identify Your Type</h2>
          <ul>
            <li>Cleanse and wait 60 minutes without applying products.</li>
            <li>Notice shine (oily), tightness (dry), or a mix (combination).</li>
            <li>Track changes across seasons and stress levels.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SkinTypeGuidePage;
