import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconScan, IconPackage, IconUser, IconBarChart } from './Icons';
import './BottomNav.css';

const navItems = [
  { to: '/', icon: IconHome, label: 'Home' },
  { to: '/scan', icon: IconScan, label: 'Scan' },
  { to: '/dashboard', icon: IconBarChart, label: 'Dashboard' },
  { to: '/myshelf', icon: IconPackage, label: 'Shelf' },
  { to: '/profile', icon: IconUser, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {navItems.map(({ to, icon: Icon, label }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
