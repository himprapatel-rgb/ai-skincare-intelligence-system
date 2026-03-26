import React, { useState, useRef, useCallback, useId } from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  children,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  const wrapperCls = [styles.wrapper, className].filter(Boolean).join(' ');
  const tooltipCls = [styles.tooltip, styles[placement], visible ? styles.visible : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapperCls}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <div aria-describedby={visible ? tooltipId : undefined}>
        {children}
      </div>
      <div
        id={tooltipId}
        role="tooltip"
        className={tooltipCls}
        aria-hidden={!visible}
      >
        {content}
        <span className={styles.arrow} />
      </div>
    </div>
  );
};
