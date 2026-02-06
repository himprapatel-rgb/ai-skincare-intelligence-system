/**
 * Error Boundary – catches React errors and shows a friendly recovery UI.
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Called when user clicks Try Again - e.g. navigate to home for a clean slate */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Task 356: Log error for analytics
    try {
      // Could send to error tracking service here
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      console.error('Error data for analytics:', errorData);
      // Future: send to error tracking service
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  private handleRetry = () => {
    this.props.onRetry?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>We hit a snag</h2>
            <p>Refresh the page or go home to try again. We've logged the issue.</p>
            
            {/* Task 353-354: Error recovery suggestions */}
            <div className="error-suggestions">
              <h4>Try these steps:</h4>
              <ol>
                <li>Click &quot;Try Again&quot; to return home, then try your action again</li>
                <li>Refresh the page</li>
                <li>Clear your browser cache</li>
                <li>Try a different browser</li>
              </ol>
            </div>

            <div className="error-actions">
              <button onClick={this.handleRetry} className="btn-primary">
                Try Again
              </button>
              <button onClick={this.handleRefresh} className="btn-secondary">
                Refresh Page
              </button>
            </div>

            {/* Task 352: Error code for debugging */}
            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Dev Only)</summary>
                <pre>{this.state.error.message}</pre>
                <pre>{this.state.error.stack}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <p className="error-support">
              If the problem persists, please{' '}
              <a 
                href={`mailto:support@pellicura.com?subject=Error Report&body=Error: ${encodeURIComponent(this.state.error?.message || 'Unknown error')}%0A%0APage: ${encodeURIComponent(window.location.href)}%0A%0APlease describe what you were doing when this error occurred:`}
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
