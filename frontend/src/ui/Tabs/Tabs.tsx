import React from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey,
  onChange,
  variant = 'underline',
  className = '',
}) => (
  <div className={`${styles.tabs} ${styles[variant]} ${className}`} role="tablist">
    {items.map((item) => (
      <button
        key={item.key}
        role="tab"
        aria-selected={item.key === activeKey}
        className={`${styles.tab} ${item.key === activeKey ? styles.active : ''}`}
        onClick={() => onChange(item.key)}
      >
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        {item.label}
      </button>
    ))}
  </div>
);
