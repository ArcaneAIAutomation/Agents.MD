/**
 * Error Boundary Component for UCIE
 * 
 * Catches React errors and provides graceful error handling
 * with user-friendly error messages and recovery options.
 * 
 * Features:
 * - Catches component errors
 * - Logs errors to monitoring service
 * - Displays user-friendly error UI
 * - Provides recovery actions
 * - Bitcoin Sovereign styling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../../lib/ucie/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    logError(error, {
      source: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
      critical: true
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with Bitcoin Sovereign styling
      return (
        <div className="min-h-screen bg-bitcoin-black flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-xl p-8 shadow-[0_0_30px_rgba(247,147,26,0.3)]">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-bitcoin-orange-10 border-2 border-bitcoin-orange flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-bitcoin-orange"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-bitcoin-white text-center mb-4">
                Something Went Wrong
              </h1>

              {/* Error Message */}
              <p className="text-bitcoin-white-80 text-center mb-6">
                We encountered an unexpected error while loading this component.
                Don't worry, your data is safe.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                  <p className="text-sm font-mono text-bitcoin-orange mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-sm text-bitcoin-white-60 cursor-pointer hover:text-bitcoin-orange">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-bitcoin-white-60 mt-2 overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.5)] min-h-[48px]"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="bg-transparent text-bitcoin-orange border-2 border-bitcoin-orange font-semibold uppercase tracking-wider px-6 py-3 rounded-lg transition-all hover:bg-bitcoin-orange hover:text-bitcoin-black hover:shadow-[0_0_20px_rgba(247,147,26,0.3)] min-h-[48px]"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-bitcoin-white-60 text-center mt-6">
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
