import React, { useState, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  onCopy?: (content: string) => void;
}

/** Simple markdown-like rendering: bold, italic, inline code, code blocks, lists. */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (triple backtick)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="${styles.codeBlock}"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, `<code class="${styles.inlineCode}">$1</code>`);

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, `<li>$1</li>`);
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="${styles.list}">${match}</ul>`);

  // Ordered lists
  html = html.replace(/^\d+\.\s(.+)$/gm, `<li>$1</li>`);

  // Line breaks (but not inside pre blocks)
  html = html.replace(/\n/g, '<br/>');

  // Clean up <br/> inside <pre>
  html = html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_m, attrs, inner) => {
    return `<pre${attrs}>${inner.replace(/<br\/>/g, '\n')}</pre>`;
  });

  return html;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp, onCopy }) => {
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content, onCopy]);

  const renderedContent = useMemo(() => renderMarkdown(content), [content]);

  const timeString = useMemo(() => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [timestamp]);

  return (
    <div
      className={`${styles.messageRow} ${styles[role]}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {role === 'assistant' && (
        <div className={styles.avatar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
            <circle cx="12" cy="17" r="4" />
          </svg>
        </div>
      )}
      <div className={styles.bubbleWrap}>
        <div className={`${styles.bubble} ${styles[`bubble_${role}`]}`}>
          {role === 'assistant' ? (
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderedContent) }}
            />
          ) : (
            <div className={styles.content}>{content}</div>
          )}
          {showCopy && (
            <button
              className={styles.copyBtn}
              onClick={handleCopy}
              aria-label="Copy message"
              type="button"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          )}
        </div>
        <span className={styles.timestamp}>{timeString}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
