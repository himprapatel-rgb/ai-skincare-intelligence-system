import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ChatWidget.module.css';

const ChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide when already on chat page
  if (location.pathname === '/chat') return null;

  return (
    <button
      className={styles.fab}
      onClick={() => navigate('/chat')}
      aria-label="Talk to Skin Expert"
      type="button"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="10" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
};

export default ChatWidget;
