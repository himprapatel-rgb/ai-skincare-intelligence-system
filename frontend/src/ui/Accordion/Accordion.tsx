import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import styles from './Accordion.module.css';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const baseId = useId();

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!allowMultiple) next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [allowMultiple],
  );

  const cls = [styles.accordion, className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              id={triggerId}
              className={styles.trigger}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
            >
              <span className={styles.triggerLabel}>{item.title}</span>
              <svg
                className={[styles.chevron, isOpen ? styles.chevronOpen : '']
                  .filter(Boolean)
                  .join(' ')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <AccordionPanel id={panelId} labelledBy={triggerId} isOpen={isOpen}>
              {item.content}
            </AccordionPanel>
          </div>
        );
      })}
    </div>
  );
};

interface AccordionPanelProps {
  id: string;
  labelledBy: string;
  isOpen: boolean;
  children: React.ReactNode;
}

const AccordionPanel: React.FC<AccordionPanelProps> = ({
  id,
  labelledBy,
  isOpen,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (isOpen) {
      setHeight(el.scrollHeight);
    } else {
      // Set current height explicitly first so transition can animate from it
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [isOpen]);

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      className={styles.panel}
      style={{ height: height !== undefined ? `${height}px` : undefined }}
      hidden={!isOpen && height === 0}
    >
      <div ref={contentRef} className={styles.panelContent}>
        {children}
      </div>
    </div>
  );
};
