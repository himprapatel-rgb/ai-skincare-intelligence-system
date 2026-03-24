import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconBarChart, IconScan, IconUser } from './Icons';
import { useKeyboardVisible } from '../hooks/useMobileDetection';
import './BottomNav.css';

/* Pro restructure: 3 tabs (Jobs-To-Be-Done) – TODAY | SCAN | ME */
const leftItem = { to: '/', icon: IconBarChart, label: 'Today' };
const centerItem = { to: '/scan', icon: IconScan, label: 'Scan' };
const rightItem = { to: '/me', icon: IconUser, label: 'Me' };

export const BottomNav: React.FC = React.memo(() => {
  const location = useLocation();
  const keyboardVisible = useKeyboardVisible();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' || location.pathname === '/today' : (to === '/me' ? location.pathname === '/me' || location.pathname.startsWith('/profile') : location.pathname.startsWith(to));
  const scanActive = isActive(centerItem.to);
  const CenterIcon = centerItem.icon;
  const LeftIcon = leftItem.icon;
  const RightIcon = rightItem.icon;

  return (
    <nav className={`bottom-nav${keyboardVisible ? ' bottom-nav--hidden' : ''}`} aria-label="Bottom navigation">
      <Link
        to={leftItem.to}
        className={`bottom-nav-item${isActive(leftItem.to) ? ' active' : ''}`}
        aria-current={isActive(leftItem.to) ? 'page' : undefined}
      >
        <LeftIcon size={22} strokeWidth={2} />
        <span>{leftItem.label}</span>
      </Link>

      <Link
        to={centerItem.to}
        className={`bottom-nav-item bottom-nav-item-center${scanActive ? ' active' : ''}`}
        aria-current={scanActive ? 'page' : undefined}
        title="Scan face or product"
        aria-label="Scan face or product"
      >
        <span className="bottom-nav-center-pill">
          <CenterIcon size={28} strokeWidth={2.25} />
        </span>
        <span className="bottom-nav-center-label">{centerItem.label}</span>
      </Link>

      <Link
        to={rightItem.to}
        className={`bottom-nav-item${isActive(rightItem.to) ? ' active' : ''}`}
        aria-current={isActive(rightItem.to) ? 'page' : undefined}
      >
        <RightIcon size={22} strokeWidth={2} />
        <span>{rightItem.label}</span>
      </Link>
    </nav>
  );
});
BottomNav.displayName = 'BottomNav';
