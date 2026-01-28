/**
 * Back to top button - Task 9
 */
import { useState, useEffect } from 'react';
import { IconArrowUp } from './Icons';
import './BackToTop.css';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={scrollTop}
      aria-label="Back to top"
    >
      <IconArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
