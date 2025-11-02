/**
 * Error Message Component for UCIE
 * 
 * Displays user-friendly error messages with Bitcoin Sovereign styling
 * and provides contextual actions for error recovery.
 * 
 * Features:
 * - Multiple error types (network, api, validation, etc.)
 * - Retry functionality
 * - Dismissible messages
 * - Bitcoin Sovereign design
 */

import React from 'react';
import { ErrorCategory } from '../../lib/ucie/errorLogger';

interface ErrorMessageProps {
  type?: ErrorCategory;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  details?: string;
  className?: string;
}

const ERROR_ICONS: Record<ErrorCategory, string> = {
  api_error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  network_error: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  validation_error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  rate_limit_error: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  timeout_error: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  data_quality_error: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  cache_error: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
  unknown_error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};

const ERROR_TITLES: Record<ErrorCategory, string> = {
  api_error: 'Service Unavailable',
  network_error: 'Connection Error',
  validation_error: 'Invalid Input',
  rate_limit_error: 'Too Many Requests',
  timeout_error: 'Request Timeout',
  data_quality_error: 'Data Quality Issue',
  cache_error: 'Cache Error',
  unknown_error: 'Unexpected Error'
};

const ERROR_MESSAGES: Record<ErrorCategory, string> = {
  api_error: 'Unable to fetch data from external service. Please try again.',
  network_error: 'Network connection issue. Please check your internet connection.',
  validation_error: 'Invalid input provided. Please check your request.',
  rate_limit_error: 'Too many requests. Please wait a moment and try again.',
  timeout_error: 'Request timed out. The service may be slow. Please try again.',
  data_quality_error: 'Data quality issue detected. Using fallback data.',
  cache_error: 'Cache error occurred. Fetching fresh data.',
  unknown_error: 'An unexpected error occurred. Please try again.'
};

export function ErrorMessage({
  type = 'unknown_error',
  title,
  message,
  onRetry,
  onDismiss,
  showDetails = false,
  details,
  className = ''
}: ErrorMessageProps) {
  const [showFullDetails, setShowFullDetails] = React.useState(false);

  const errorTitle = title || ERROR_TITLES[type];
  const errorMessage = message || ERROR_MESSAGES[type];
  const iconPath = ERROR_ICONS[type];

  return (
    <div className={`bg-bitcoin-black border-2 border-bitcoin-orange-20 rounded-xl p-6 ${className}`}>
      {/* Header with Icon and Title */}
      <div className="flex items-start gap-4 mb-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-bitcoin-orange-10 border border-bitcoin-orange flex items-center justify-center">
            <svg
              className="w-6 h-6 text-bitcoin-orange"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconPath}
              />
            </svg>
          </div>
        </div>

        {/* Title and Message */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-bitcoin-white mb-2">
            {errorTitle}
          </h3>
          <p className="text-bitcoin-white-80">
            {errorMessage}
          </p>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error Details (Development/Debug) */}
      {showDetails && details && (
        <div className="mt-4 border-t border-bitcoin-orange-20 pt-4">
          <button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="text-sm text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors mb-2"
          >
            {showFullDetails ? '▼' : '▶'} Technical Details
          </button>
          {showFullDetails && (
            <pre className="text-xs text-bitcoin-white-60 bg-bitcoin-black border border-bitcoin-orange-20 rounded p-3 overflow-x-auto">
              {details}
            </pre>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {onRetry && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={onRetry}
            className="bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all hover:bg-bitcoin-black hover:text-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.5)] text-sm min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Inline error message (smaller, for use within components)
 */
export function InlineErrorMessage({
  message,
  onRetry,
  className = ''
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 text-bitcoin-white-80 ${className}`}>
      <svg
        className="w-5 h-5 text-bitcoin-orange flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Toast-style error notification
 */
export function ErrorToast({
  message,
  onDismiss,
  duration = 5000
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up">
      <div className="bg-bitcoin-black border-2 border-bitcoin-orange rounded-lg p-4 shadow-[0_0_30px_rgba(247,147,26,0.5)]">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-bitcoin-orange flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-bitcoin-white-80 flex-1">{message}</p>
          <button
            onClick={onDismiss}
            className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
