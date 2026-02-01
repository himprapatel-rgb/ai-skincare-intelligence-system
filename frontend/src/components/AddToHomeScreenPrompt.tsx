/**
 * Task 10000: Add to Home Screen prompt for mobile
 * Encourages users to install the PWA for an app-like experience.
 * Only shows on mobile, when NOT already in standalone mode, and when not dismissed.
 */
import { useState, useEffect } from 'react';
import { IconX, IconDownload } from './Icons';
import './AddToHomeScreenPrompt.css';

const STORAGE_KEY = 'pellicura_install_prompt_dismissed';
const DISMISS_DAYS = 7;

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (nav.standalone === true) ||
    document.referrer.includes('android-app://')
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function AddToHomeScreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<unknown> } | null>(null);

  useEffect(() => {
    if (!isMobile() || isStandalone()) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!isNaN(ts) && Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as unknown as { prompt: () => Promise<unknown> };
      if (typeof ev.prompt === 'function') {
        setDeferredPrompt({ prompt: () => ev.prompt() });
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    setVisible(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      handleDismiss();
    }
  };

  if (!visible) return null;

  return (
    <div className="add-to-home-prompt" role="dialog" aria-label="Add to Home Screen">
      <button
        type="button"
        className="add-to-home-prompt-close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <IconX size={18} strokeWidth={2} />
      </button>
      <div className="add-to-home-prompt-content">
        <span className="add-to-home-prompt-icon">
          <IconDownload size={24} strokeWidth={2} />
        </span>
        <div>
          <strong>Use as app</strong>
          <p>
            {isIOS()
              ? 'Tap Share, then "Add to Home Screen" for a full app experience.'
              : deferredPrompt
                ? 'Install Pellicura for a faster, app-like experience.'
                : 'Add Pellicura to your home screen for quick access.'}
          </p>
        </div>
      </div>
      {deferredPrompt ? (
        <button type="button" className="add-to-home-prompt-btn" onClick={handleInstall}>
          Install
        </button>
      ) : null}
    </div>
  );
}
