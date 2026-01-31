/**
 * Error Boundary Component (Task 375)
 * Catches JavaScript errors anywhere in child component tree
 */
import { Component, ErrorInfo, ReactNode } from 'react';

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
            <h2>Something went wrong</h2>
            <p>We encountered an unexpected error. This has been logged and we'll look into it.</p>
            
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

            {/* Task 355: Contact support */}
            <p className="error-support">
              If the problem persists, please{' '}
              <a 
                href={`mailto:support@pellicura.com?subject=Error Report&body=Error: ${encodeURIComponent(this.state.error?.message || 'Unknown error')}%0A%0APage: ${encodeURIComponent(window.location.href)}%0A%0APlease describe what you were doing when this error occurred:`}
              >
                contact support
              </a>
            </p>
          </div>

          <style>{`
            .error-boundary-fallback {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: #f8fafc;
            }
            .error-content {
              max-width: 500px;
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }
            .error-content h2 {
              color: #1e293b;
              margin-bottom: 12px;
            }
            .error-content p {
              color: #64748b;
              margin-bottom: 24px;
            }
            .error-suggestions {
              text-align: left;
              background: #f1f5f9;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .error-suggestions h4 {
              margin: 0 0 12px;
              color: #475569;
            }
            .error-suggestions ol {
              margin: 0;
              padding-left: 20px;
              color: #64748b;
            }
            .error-suggestions li {
              margin-bottom: 8px;
            }
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-bottom: 24px;
            }
            .error-actions button {
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              border: none;
            }
            .error-actions .btn-primary {
              background: #3b82f6;
              color: white;
            }
            .error-actions .btn-secondary {
              background: #e2e8f0;
              color: #475569;
            }
            .error-details {
              text-align: left;
              margin-top: 24px;
              padding: 16px;
              background: #fef2f2;
              border-radius: 8px;
              font-size: 12px;
            }
            .error-details summary {
              cursor: pointer;
              color: #991b1b;
              font-weight: 600;
            }
            .error-details pre {
              margin-top: 12px;
              white-space: pre-wrap;
              word-break: break-all;
              color: #7f1d1d;
            }
            .error-support {
              font-size: 14px;
              color: #94a3b8;
            }
            .error-support a {
              color: #3b82f6;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
