import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function createSession(title?: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE_URL}/ai/chat/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title: title || 'New Chat' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create session' }));
    throw new Error(err.detail || 'Failed to create session');
  }
  return res.json();
}

export async function listSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE_URL}/ai/chat/sessions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to list sessions' }));
    throw new Error(err.detail || 'Failed to list sessions');
  }
  const json = await res.json();
  // Backend returns paginated envelope {data: [...]} or plain array
  return Array.isArray(json) ? json : (json.data || []);
}

export async function getMessages(sessionId: number | string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/ai/chat/sessions/${sessionId}/messages`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to get messages' }));
    throw new Error(err.detail || 'Failed to get messages');
  }
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data || []);
}

export async function deleteSession(sessionId: number | string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/ai/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete session' }));
    throw new Error(err.detail || 'Failed to delete session');
  }
}

/**
 * Send a message and stream the response via SSE using fetch + ReadableStream.
 * Calls onChunk for each text chunk as it arrives.
 * Calls onDone when the stream ends.
 * Calls onError if something goes wrong.
 * Returns an AbortController so the caller can cancel the stream.
 */
export function sendMessageSSE(
  sessionId: number | string,
  content: string,
  callbacks: {
    onChunk: (chunk: string) => void;
    onDone: (fullContent: string) => void;
    onError: (error: Error) => void;
  }
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          content,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
        throw new Error(err.detail || `Chat request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        // Keep incomplete last line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // skip empty/comment lines

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            if (data === '[DONE]') {
              callbacks.onDone(fullContent);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.content || parsed.text || parsed.delta || '';
              if (chunk) {
                fullContent += chunk;
                callbacks.onChunk(chunk);
              }
            } catch {
              // If not JSON, treat the raw data as text content
              if (data && data !== '') {
                fullContent += data;
                callbacks.onChunk(data);
              }
            }
          }
        }
      }

      // Stream ended without [DONE]
      callbacks.onDone(fullContent);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // User cancelled, no error
      }
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return controller;
}
