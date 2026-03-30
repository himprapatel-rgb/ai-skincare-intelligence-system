import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from '../components/chat/ChatMessage';
import StreamingMessage from '../components/chat/StreamingMessage';
import ChatInput from '../components/chat/ChatInput';
import ChatSuggestions from '../components/chat/ChatSuggestions';
import ChatSessionList, { ChatSessionItem } from '../components/chat/ChatSessionList';
import {
  createSession,
  listSessions,
  getMessages,
  deleteSession,
  sendMessageSSE,
  ChatSession,
  ChatMessage as ChatMessageType,
} from '../services/chatApi';
import './AIChatPage.css';

const AIChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Set body attribute for ChatWidget hiding
  useEffect(() => {
    document.body.setAttribute('data-page', 'chat');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  // Load sessions on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listSessions();
        if (!cancelled) {
          setSessions(data);
          setIsLoadingSessions(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sessions');
          setIsLoadingSessions(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setIsLoadingMessages(true);
    (async () => {
      try {
        const data = await getMessages(activeSessionId);
        if (!cancelled) {
          setMessages(data);
          setIsLoadingMessages(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
          setIsLoadingMessages(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [activeSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleCreateSession = useCallback(async () => {
    try {
      setError(null);
      const session = await createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
  }, []);

  const handleSelectSession = useCallback((sessionId: number) => {
    if (isStreaming) return; // Don't switch while streaming
    setActiveSessionId(sessionId);
    setStreamingContent('');
    setSidebarOpen(false);
  }, [isStreaming]);

  const handleDeleteSession = useCallback(async (sessionId: number) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  }, [activeSessionId]);

  const handleSend = useCallback(async (content: string) => {
    setError(null);

    // Create a session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const session = await createSession(content.slice(0, 50));
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session');
        return;
      }
    }

    // Add user message optimistically
    const userMsg: ChatMessageType = {
      id: Date.now(),
      session_id: sessionId as number,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    abortRef.current = sendMessageSSE(sessionId, content, {
      onChunk: (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      onDone: (fullContent) => {
        const assistantMsg: ChatMessageType = {
          id: Date.now() + 1,
          session_id: sessionId as number,
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');
        setIsStreaming(false);
        abortRef.current = null;

        // Update session title and timestamp in sidebar
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, updated_at: new Date().toISOString(), message_count: s.message_count + 2 }
              : s
          )
        );
      },
      onError: (err) => {
        setError(err.message);
        setStreamingContent('');
        setIsStreaming(false);
        abortRef.current = null;
      },
    });
  }, [activeSessionId]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sessionItems: ChatSessionItem[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    updated_at: s.updated_at,
  }));

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="chat-page">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="chat-backdrop"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`}>
        <ChatSessionList
          sessions={sessionItems}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onDelete={handleDeleteSession}
          onCreate={handleCreateSession}
        />
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <button
            className="chat-menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle chat history"
            type="button"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="chat-header-title">
            <span className="chat-expert-dot" />
            Skin Expert
          </h1>
          <button
            className="chat-new-btn"
            onClick={handleCreateSession}
            aria-label="New chat"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </header>

        {/* Messages area */}
        <div className="chat-messages-area">
          {error && (
            <div className="chat-error-banner">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="chat-error-close" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {isLoadingSessions || isLoadingMessages ? (
            <div className="chat-center-state">
              <div className="chat-loading-spinner" />
              <p>Loading conversations...</p>
            </div>
          ) : !hasMessages ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="chat-empty-title">Ask Our Skin Expert</h2>
              <p className="chat-empty-text">
                Get expert skincare guidance based on dermatology research, your skin profile, and scan history.
              </p>
              <p className="chat-expert-disclosure">
                Powered by AI &middot; Not a substitute for medical advice
              </p>
              <ChatSuggestions onSelect={handleSend} />
            </div>
          ) : (
            <div className="chat-messages-list">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={new Date(msg.created_at)}
                />
              ))}
              {isStreaming && (
                <StreamingMessage
                  content={streamingContent}
                  isStreaming={isStreaming}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </main>
    </div>
  );
};

export default AIChatPage;
