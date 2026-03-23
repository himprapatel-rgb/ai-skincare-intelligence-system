/**
 * Back to top button - Task 9
 */
import React, { useState, useEffect } from 'react';
import { IconArrowUp } from './Icons';
import './BackToTop.css';

export const BackToTop = React.memo(function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
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
});
