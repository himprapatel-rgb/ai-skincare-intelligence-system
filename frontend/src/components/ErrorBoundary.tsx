/**
 * Error Boundary - Task 4 / 24
 * Catches runtime errors and shows a branded fallback with "Try again" and "Go home"
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconHome, IconRefresh, IconAlertTriangle } from '../components/Icons';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="error-boundary-page">
          <div className="error-boundary-content">
            <div className="error-boundary-icon" aria-hidden="true">
              <IconAlertTriangle size={48} strokeWidth={2} />
            </div>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">We’ve run into an error. You can try again or go back home.</p>
            <div className="error-boundary-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                <IconRefresh size={20} strokeWidth={2} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Try again
              </button>
              <Link to="/" className="btn-secondary">
                <IconHome size={20} strokeWidth={2} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
