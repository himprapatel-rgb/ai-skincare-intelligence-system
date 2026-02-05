/**
 * Mobile Action Sheet Component
 * iOS-style action sheet with options
 */

import React from 'react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { triggerHaptic } from '../../utils/mobileOptimizations';
import './MobileActionSheet.css';

export interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  options: ActionSheetOption[];
  showCancel?: boolean;
  className?: string;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  options,
  showCancel = true,
  className = '',
}) => {
  const handleOptionClick = (option: ActionSheetOption) => {
    if (option.disabled) return;
    
    triggerHaptic('light');
    option.onClick();
    onClose();
  };

  const handleCancel = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      height="auto"
      showHandle={true}
      className={`mobile-action-sheet ${className}`}
    >
      {(title || description) && (
        <div className="action-sheet-header">
          {title && <h3 className="action-sheet-title">{title}</h3>}
          {description && <p className="action-sheet-description">{description}</p>}
        </div>
      )}

      <div className="action-sheet-options">
        {options.map((option, index) => (
          <button
            key={index}
            className={`action-sheet-option action-sheet-option--${option.variant || 'default'}`}
            onClick={() => handleOptionClick(option)}
            disabled={option.disabled}
          >
            {option.icon && (
              <span className="action-sheet-option-icon">
                {option.icon}
              </span>
            )}
            <span className="action-sheet-option-label">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {showCancel && (
        <button
          className="action-sheet-cancel"
          onClick={handleCancel}
        >
          Cancel
        </button>
      )}
    </MobileBottomSheet>
  );
};
