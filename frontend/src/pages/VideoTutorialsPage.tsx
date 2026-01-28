import React from 'react';
import './VideoTutorialsPage.css';

const VideoTutorialsPage: React.FC = () => {
  return (
    <div className="video-page">
      <div className="page-container video-container">
        <div className="page-header">
          <h1>Video Tutorials</h1>
          <p>Short walkthroughs to help you use every feature with confidence.</p>
        </div>

        <div className="video-grid">
          <div className="video-card">
            <div className="video-thumb-wrap">
              <div className="video-thumb">
                <span className="video-duration" aria-label="Duration 3 minutes 12 seconds">3:12</span>
              </div>
            </div>
            <h3>How to Capture a Great Scan</h3>
            <p>Lighting, angles, and best practices for accurate results.</p>
          </div>
          <div className="video-card">
            <div className="video-thumb-wrap">
              <div className="video-thumb">
                <span className="video-duration" aria-label="Duration 2 minutes 45 seconds">2:45</span>
              </div>
            </div>
            <h3>Reading Your Digital Twin</h3>
            <p>Understand progress charts, metrics, and before/after tools.</p>
          </div>
          <div className="video-card">
            <div className="video-thumb-wrap">
              <div className="video-thumb">
                <span className="video-duration" aria-label="Duration 4 minutes 20 seconds">4:20</span>
              </div>
            </div>
            <h3>Building a Routine</h3>
            <p>Layering products safely and saving your personalized routine.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorialsPage;
