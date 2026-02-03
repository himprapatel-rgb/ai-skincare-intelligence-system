import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import './VideoTutorialsPage.css';

const VideoTutorialsPage: React.FC = () => {
  usePageTitle('Video Tutorials', 'Short walkthroughs for every feature.');
  return (
    <div className="video-page app-page">
      <header className="app-header-card">
        <h1>Video Tutorials</h1>
        <p className="app-header-subtitle">Short walkthroughs for every feature.</p>
      </header>
      <div className="app-page-content video-container">
        <div className="video-grid">
          <div className="video-card">
            <div className="video-thumb-wrap">
              <div className="video-thumb">
                <span className="video-duration" aria-label="Duration 3 minutes 12 seconds">3:12</span>
                <span className="video-difficulty" aria-label="Difficulty: Beginner">Beginner</span>
              </div>
            </div>
            <h3>How to Capture a Great Scan</h3>
            <p>Lighting, angles, and best practices for accurate results.</p>
          </div>
          <div className="video-card">
            <div className="video-thumb-wrap">
              <div className="video-thumb">
                <span className="video-duration" aria-label="Duration 2 minutes 45 seconds">2:45</span>
                <span className="video-difficulty" aria-label="Difficulty: Intermediate">Intermediate</span>
              </div>
            </div>
            <h3>Reading Your Digital Twin</h3>
            <p>Understand progress charts, metrics, and before/after tools.</p>
          </div>
          <div className="video-card">
            <div className="video-thumb-wrap">
              <div className="video-thumb">
                <span className="video-duration" aria-label="Duration 4 minutes 20 seconds">4:20</span>
                <span className="video-difficulty" aria-label="Difficulty: Beginner">Beginner</span>
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
