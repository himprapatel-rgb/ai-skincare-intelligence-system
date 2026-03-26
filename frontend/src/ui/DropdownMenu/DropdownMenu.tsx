import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger: React.ReactNode;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  trigger,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setActiveIndex(0);
      return !prev;
    });
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
          setActiveIndex(0);
        }
        return;
      }

      const enabledItems = items.reduce<number[]>((acc, item, i) => {
        if (!item.disabled) acc.push(i);
        return acc;
      }, []);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowDown': {
          e.preventDefault();
          const currentPos = enabledItems.indexOf(activeIndex);
          const next = enabledItems[(currentPos + 1) % enabledItems.length];
          setActiveIndex(next);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const currentPos = enabledItems.indexOf(activeIndex);
          const prev =
            enabledItems[(currentPos - 1 + enabledItems.length) % enabledItems.length];
          setActiveIndex(prev);
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIndex >= 0 && !items[activeIndex].disabled) {
            items[activeIndex].onClick();
            close();
          }
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(enabledItems[0]);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(enabledItems[enabledItems.length - 1]);
          break;
        default:
          break;
      }
    },
    [open, activeIndex, items, close],
  );

  // Focus active item
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = menuRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.focus();
  }, [open, activeIndex]);

  const wrapperCls = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={wrapperCls} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggleOpen}
      >
        {trigger}
      </button>

      {open && (
        <div ref={menuRef} id={menuId} role="menu" className={styles.menu}>
          {items.map((item, index) => {
            const itemCls = [
              styles.menuItem,
              item.disabled ? styles.disabled : '',
              item.danger ? styles.danger : '',
              activeIndex === index ? styles.active : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                data-index={index}
                className={itemCls}
                disabled={item.disabled}
                tabIndex={activeIndex === index ? 0 : -1}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    close();
                  }
                }}
              >
                {item.icon && (
                  <span className={styles.itemIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
