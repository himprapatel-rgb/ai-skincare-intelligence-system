import React from 'react';
import styles from './ChatSuggestions.module.css';

interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  "What's my ideal AM routine?",
  "Which ingredients should I avoid?",
  "How's my skin barrier?",
  "Explain my latest scan results",
  "What products work best for my skin type?",
  "How can I reduce dark spots?",
];

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSelect }) => {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Try asking</p>
      <div className={styles.chips}>
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            className={styles.chip}
            onClick={() => onSelect(q)}
            type="button"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSuggestions;
