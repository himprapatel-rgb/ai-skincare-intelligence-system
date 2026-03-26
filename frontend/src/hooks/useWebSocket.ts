import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Derive WebSocket base URL from the HTTP API base URL.
 * http(s)://host/api/v1 -> ws(s)://host/api/v1
 */
function getWsBaseUrl(): string {
  return API_BASE_URL.replace(/^http/, 'ws');
}

export interface WebSocketMessage {
  type: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  /** Called when a parsed JSON message arrives */
  onMessage?: (message: WebSocketMessage) => void;
  /** Whether the hook should attempt to connect (default: true) */
  enabled?: boolean;
}

interface UseWebSocketReturn {
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** The last parsed message received */
  lastMessage: WebSocketMessage | null;
}

const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

/**
 * Custom hook for WebSocket real-time notifications.
 *
 * - Reads the auth token from localStorage
 * - Connects to ws(s)://host/api/v1/notifications/live?token=xxx
 * - Auto-reconnects with exponential backoff (1s -> 2s -> 4s -> ... -> 30s max)
 * - Parses incoming JSON events and calls the onMessage callback
 * - Disconnects on unmount or when the token is removed (logout)
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { onMessage, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref up to date without re-triggering the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      cleanup();
      return;
    }

    // Don't open a second connection
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    const wsBaseUrl = getWsBaseUrl();
    const url = `${wsBaseUrl}/notifications/live?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        // Reset backoff on successful connection
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(data);
          onMessageRef.current?.(data);
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror, so reconnect logic is handled there
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;

        // Schedule reconnect with exponential backoff
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch {
      // If WebSocket constructor throws, schedule a reconnect
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, delay);
    }
  }, [cleanup]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      connect();
    } else {
      cleanup();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, connect, cleanup]);

  return { isConnected, lastMessage };
}

export default useWebSocket;
