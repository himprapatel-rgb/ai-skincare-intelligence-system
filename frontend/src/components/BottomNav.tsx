import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconScan, IconPackage, IconUser, IconBarChart } from './Icons';
import './BottomNav.css';

const leftItems = [{ to: '/', icon: IconHome, label: 'Home' }];
const centerItem = { to: '/scan', icon: IconScan, label: 'Scan' };
const rightItems = [
  { to: '/dashboard', icon: IconBarChart, label: 'Dashboard' },
  { to: '/myshelf', icon: IconPackage, label: 'Shelf' },
  { to: '/profile', icon: IconUser, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  const scanActive = isActive(centerItem.to);
  const CenterIcon = centerItem.icon;

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {leftItems.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={`bottom-nav-item${isActive(to) ? ' active' : ''}`}
          aria-current={isActive(to) ? 'page' : undefined}
        >
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </Link>
      ))}

      <Link
        to={centerItem.to}
        className={`bottom-nav-item bottom-nav-item-center${scanActive ? ' active' : ''}`}
        aria-current={scanActive ? 'page' : undefined}
        title="Start free skin analysis"
      >
        <span className="bottom-nav-center-pill">
          <CenterIcon size={28} strokeWidth={2.25} />
        </span>
        <span className="bottom-nav-center-label">{centerItem.label}</span>
      </Link>

      {rightItems.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={`bottom-nav-item${isActive(to) ? ' active' : ''}`}
          aria-current={isActive(to) ? 'page' : undefined}
        >
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};
