/**
 * Toast notification UI - Task 3
 */
import { useToast } from '../context/ToastContext';
import { IconCheck, IconX, IconInfo } from './Icons';
import './Toast.css';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          role="alert"
          aria-live="polite"
        >
          <span className="toast-icon">
            {t.type === 'success' && <IconCheck size={18} strokeWidth={2.5} />}
            {t.type === 'error' && <IconX size={18} strokeWidth={2.5} />}
            {t.type === 'info' && <IconInfo size={18} strokeWidth={2} />}
          </span>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            <IconX size={16} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
