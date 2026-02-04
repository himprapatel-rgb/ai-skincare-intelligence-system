import React from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import './VideoTutorialsPage.css';

/** Replace each videoId with your YouTube tutorial video ID. */
const TUTORIAL_VIDEOS = [
  {
    id: 'scan',
    videoId: import.meta.env.VITE_VIDEO_SCAN ?? 'M7lc1UVf-VE',
    title: 'How to Take the Perfect Skin Scan Photo',
    description: 'Lighting, angles, and best practices for accurate results.',
    duration: '5:32',
    difficulty: 'Beginner',
  },
  {
    id: 'digital-twin',
    videoId: import.meta.env.VITE_VIDEO_DIGITAL_TWIN ?? 'M7lc1UVf-VE',
    title: 'Reading Your Digital Twin',
    description: 'Understand progress charts, metrics, and before/after tools.',
    duration: '2:45',
    difficulty: 'Intermediate',
  },
  {
    id: 'routine',
    videoId: import.meta.env.VITE_VIDEO_ROUTINE ?? 'M7lc1UVf-VE',
    title: 'Building a Routine',
    description: 'Layering products safely and saving your personalized routine.',
    duration: '4:20',
    difficulty: 'Beginner',
  },
];

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
          {TUTORIAL_VIDEOS.map((t) => (
            <div key={t.id} className="video-card tutorial-card">
              <div className="video-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${t.videoId}`}
                  title={t.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="tutorial-info">
                <span className="video-duration" aria-label={`Duration ${t.duration}`}>{t.duration}</span>
                <span className="video-difficulty" aria-label={`Difficulty: ${t.difficulty}`}>{t.difficulty}</span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoTutorialsPage;
