/**
 * Dark mode toggle for header/nav. Cycles light → dark → system (or just toggles light/dark).
 * Uses ThemeProvider (data-theme on documentElement).
 */
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { IconSun, IconMoon } from './Icons';
import './DarkModeToggle.css';

export const DarkModeToggle: React.FC = () => {
  const { setTheme, resolvedTheme } = useTheme();

  const handleClick = () => {
    if (resolvedTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      type="button"
      className="dark-mode-toggle"
      onClick={handleClick}
      aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {resolvedTheme === 'dark' ? (
        <IconSun size={20} strokeWidth={2} className="dark-mode-icon" />
      ) : (
        <IconMoon size={20} strokeWidth={2} className="dark-mode-icon" />
      )}
    </button>
  );
};
