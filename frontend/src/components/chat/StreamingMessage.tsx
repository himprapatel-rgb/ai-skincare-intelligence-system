import React, { useMemo } from 'react';
import styles from './StreamingMessage.module.css';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
}

/** Minimal markdown rendering matching ChatMessage. */
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="${styles.codeBlock}"><code>${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, `<code class="${styles.inlineCode}">$1</code>`);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n/g, '<br/>');
  html = html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_m, attrs, inner) => {
    return `<pre${attrs}>${inner.replace(/<br\/>/g, '\n')}</pre>`;
  });

  return html;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content, isStreaming }) => {
  const renderedContent = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className={styles.messageRow}>
      <div className={styles.avatar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
          <circle cx="12" cy="17" r="4" />
        </svg>
      </div>
      <div className={styles.bubbleWrap}>
        <div className={styles.bubble}>
          {!content && isStreaming ? (
            <div className={styles.typingIndicator}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          ) : (
            <div className={styles.content}>
              <span dangerouslySetInnerHTML={{ __html: renderedContent }} />
              {isStreaming && <span className={styles.cursor} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;
