/**
 * BackButton - Task 10001 B3
 * Consistent back behavior and placement on inner pages
 */
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft } from './Icons';
import './BackButton.css';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ to, label = 'Back', className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button
      type="button"
      className={`back-button ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
    >
      <IconArrowLeft size={18} strokeWidth={2} className="back-button-icon" aria-hidden />
      {label}
    </button>
  );
}
