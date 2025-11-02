/**
 * Error Logging Utility for UCIE
 * 
 * Provides comprehensive error logging with Sentry integration,
 * error categorization, and user-friendly error messages.
 * 
 * Features:
 * - Structured error logging
 * - Sentry integration (optional)
 * - Error severity classification
 * - Context capture
 * - User-friendly error messages
 */

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories
export type ErrorCategory = 
  | 'api_error'
  | 'network_error'
  | 'validation_error'
  | 'rate_limit_error'
  | 'timeout_error'
  | 'data_quality_error'
  | 'cache_error'
  | 'unknown_error';

// Error log structure
export interface ErrorLog {
  timestamp: string;
  errorType: string;
  category: ErrorCategory;
  source: string;
  message: string;
  stack?: string;
  context: {
    symbol?: string;
    userId?: string;
    apiEndpoint?: string;
    requestId?: string;
    [key: string]: any;
  };
  severity: ErrorSeverity;
  userMessage: string;
}

// User-friendly error messages
const USER_ERROR_MESSAGES: Record<ErrorCategory, string> = {
  api_error: 'Unable to fetch data from external service. Please try again.',
  network_error: 'Network connection issue. Please check your internet connection.',
  validation_error: 'Invalid input provided. Please check your request.',
  rate_limit_error: 'Too many requests. Please wait a moment and try again.',
  timeout_error: 'Request timed out. The service may be slow. Please try again.',
  data_quality_error: 'Data quality issue detected. Using fallback data.',
  cache_error: 'Cache error occurred. Fetching fresh data.',
  unknown_error: 'An unexpected error occurred. Please try again.'
};

/**
 * Determine error severity based on error type and context
 */
function determineSeverity(error: Error, context: any): ErrorSeverity {
  // Critical errors that prevent core functionality
  if (error.message.includes('database') || error.message.includes('auth')) {
    return 'critical';
  }
  
  // High severity for API failures affecting primary data sources
  if (context.source?.includes('primary') || context.critical === true) {
    return 'high';
  }
  
  // Medium severity for secondary API failures
  if (context.source?.includes('secondary') || error.message.includes('fallback')) {
    return 'medium';
  }
  
  // Low severity for non-critical errors
  return 'low';
}

/**
 * Categorize error based on error type and message
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  
  if (message.includes('rate limit') || message.includes('429')) {
    return 'rate_limit_error';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout_error';
  }
  
  if (message.includes('network') || message.includes('fetch failed')) {
    return 'network_error';
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation_error';
  }
  
  if (message.includes('api') || message.includes('endpoint')) {
    return 'api_error';
  }
  
  if (message.includes('cache')) {
    return 'cache_error';
  }
  
  if (message.includes('data quality') || message.includes('discrepancy')) {
    return 'data_quality_error';
  }
  
  return 'unknown_error';
}

/**
 * Generate request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log error with full context
 */
export function logError(
  error: Error,
  context: {
    source: string;
    symbol?: string;
    userId?: string;
    apiEndpoint?: string;
    critical?: boolean;
    [key: string]: any;
  }
): ErrorLog {
  const category = categorizeError(error);
  const severity = determineSeverity(error, context);
  const requestId = context.requestId || generateRequestId();
  
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    errorType: error.name,
    category,
    source: context.source,
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      requestId
    },
    severity,
    userMessage: USER_ERROR_MESSAGES[category]
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[UCIE Error]', {
      severity: errorLog.severity,
      category: errorLog.category,
      source: errorLog.source,
      message: errorLog.message,
      context: errorLog.context
    });
  }
  
  // Send to Sentry if configured
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      level: severity,
      tags: {
        category,
        source: context.source,
        symbol: context.symbol
      },
      extra: errorLog.context
    });
  }
  
  // Store in local storage for debugging (last 50 errors)
  if (typeof window !== 'undefined') {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('ucie_errors') || '[]');
      storedErrors.unshift(errorLog);
      localStorage.setItem('ucie_errors', JSON.stringify(storedErrors.slice(0, 50)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  return errorLog;
}

/**
 * Log API error with specific context
 */
export function logApiError(
  error: Error,
  apiName: string,
  endpoint: string,
  symbol?: string
): ErrorLog {
  return logError(error, {
    source: `api:${apiName}`,
    apiEndpoint: endpoint,
    symbol,
    critical: false
  });
}

/**
 * Log data quality issue
 */
export function logDataQualityIssue(
  message: string,
  sources: string[],
  discrepancy: number,
  symbol: string
): ErrorLog {
  const error = new Error(message);
  return logError(error, {
    source: 'data_quality',
    symbol,
    sources,
    discrepancy,
    critical: false
  });
}

/**
 * Log cache error
 */
export function logCacheError(
  error: Error,
  operation: 'get' | 'set' | 'delete',
  key: string
): ErrorLog {
  return logError(error, {
    source: 'cache',
    operation,
    key,
    critical: false
  });
}

/**
 * Get recent errors from local storage
 */
export function getRecentErrors(limit: number = 10): ErrorLog[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedErrors = JSON.parse(localStorage.getItem('ucie_errors') || '[]');
    return storedErrors.slice(0, limit);
  } catch (e) {
    return [];
  }
}

/**
 * Clear error logs from local storage
 */
export function clearErrorLogs(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ucie_errors');
  }
}

/**
 * Initialize Sentry (call this in _app.tsx)
 */
export function initializeSentry(dsn?: string): void {
  if (typeof window === 'undefined') return;
  if (!dsn && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  
  // Dynamically import Sentry to avoid SSR issues
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: dsn || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Filter out low severity errors in production
        if (process.env.NODE_ENV === 'production' && event.level === 'low') {
          return null;
        }
        return event;
      }
    });
  }).catch(() => {
    // Sentry not available, continue without it
  });
}
