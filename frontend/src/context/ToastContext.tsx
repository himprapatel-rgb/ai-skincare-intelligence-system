/**
 * Toast notifications context - Task 3
 * Use toast.success(), toast.error(), toast.info() from any component
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;
const genId = () => `toast-${++toastId}-${Date.now()}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((message: string, duration?: number) => add(message, 'success', duration), [add]);
  const error = useCallback((message: string, duration?: number) => add(message, 'error', duration ?? 7000), [add]);
  const info = useCallback((message: string, duration?: number) => add(message, 'info', duration), [add]);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, success, error, info, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook export
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toasts: [], success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} };
  return ctx;
}
