import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';
import { STORAGE_KEYS } from '../../constants/storage';
import styles from './ChatSuggestions.module.css';

interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  "What's my ideal AM routine?",
  "Which ingredients should I avoid?",
  "How's my skin barrier?",
  "Explain my latest scan results",
  "What products work best for my skin type?",
  "How can I reduce dark spots?",
];

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  // Generate contextual suggestions based on latest scan
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/scan/history?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const scans = json.data || json.scans || [];
        if (cancelled || scans.length === 0) return;

        const latest = scans[0];
        const score = latest.overall_score ?? latest.skin_score;
        const concerns: string[] = latest.concerns || latest.detected_conditions || [];

        const contextual: string[] = [];

        if (typeof score === 'number') {
          if (score < 60) {
            contextual.push(`My skin score is ${score} — how can I improve it?`);
          } else if (score >= 80) {
            contextual.push(`My skin score is ${score} — how do I maintain it?`);
          }
        }

        if (concerns.length > 0) {
          const top = concerns[0];
          contextual.push(`What's the best treatment for ${top}?`);
          if (concerns.length > 1) {
            contextual.push(`I have ${concerns.slice(0, 2).join(' and ')} — what routine helps?`);
          }
        }

        contextual.push("What ingredients should I add to my routine?");
        contextual.push("Explain my latest scan results in detail");
        contextual.push("What's my ideal AM/PM routine?");
        contextual.push("Which of my products might be causing irritation?");

        // Take up to 6, mixing contextual + defaults
        setSuggestions(contextual.slice(0, 6));
      } catch {
        // Keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.container}>
      <p className={styles.label}>Ask our skin expert</p>
      <div className={styles.chips}>
        {suggestions.map((q) => (
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
