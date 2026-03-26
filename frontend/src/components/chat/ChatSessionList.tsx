import React from 'react';
import styles from './ChatSessionList.module.css';

export interface ChatSessionItem {
  id: number;
  title: string;
  updated_at: string;
}

interface ChatSessionListProps {
  sessions: ChatSessionItem[];
  activeSessionId: number | null;
  onSelect: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
  onCreate: () => void;
}

const ChatSessionList: React.FC<ChatSessionListProps> = ({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onCreate,
}) => {
  return (
    <div className={styles.container}>
      <button className={styles.newBtn} onClick={onCreate} type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>

      <div className={styles.list}>
        {sessions.length === 0 && (
          <p className={styles.empty}>No conversations yet</p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`${styles.item} ${session.id === activeSessionId ? styles.active : ''}`}
            onClick={() => onSelect(session.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(session.id); }}
          >
            <div className={styles.itemContent}>
              <span className={styles.itemTitle}>{session.title || 'Untitled chat'}</span>
              <span className={styles.itemDate}>
                {new Date(session.updated_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              aria-label={`Delete chat: ${session.title}`}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSessionList;
