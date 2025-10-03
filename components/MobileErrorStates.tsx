import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Wifi, 
  RefreshCw, 
  Clock, 
  Shield, 
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useMobileViewport, useDeviceCapabilities } from '../hooks/useMobileViewport';

interface MobileErrorStateProps {
  type: 'network' | 'timeout' | 'api' | 'generic' | 'rateLimit' | 'noData';
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Enhanced mobile-optimized error state component with intelligent error handling
 * Provides clear error messaging, recovery options, and adaptive UI for mobile users
 */
function MobileErrorState({
  type,
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
  className = ''
}: MobileErrorStateProps) {
  const { isMobile } = useMobileViewport();
  const { prefersReducedMotion, connectionType } = useDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: Wifi,
          defaultTitle: 'Connection Problem',
          defaultMessage: isMobile 
            ? 'Check your mobile data or WiFi connection and try again.'
            : 'Unable to connect to the internet. Please check your connection and try again.',
          bgColor: 'mobile-bg-error',
          borderColor: 'border-red-200',
          textColor: 'mobile-text-error',
          iconColor: 'text-red-600',
          suggestions: [
            'Check your internet connection',
            'Try switching between WiFi and mobile data',
            'Move to an area with better signal'
          ]
        };
      
      case 'timeout':
        return {
          icon: Clock,
          defaultTitle: 'Request Timeout',
          defaultMessage: isMobile && connectionType === 'slow-2g'
            ? 'Slow connection detected. This may take longer than usual.'
            : 'The request is taking longer than expected. This might be due to slow connection or server issues.',
          bgColor: 'mobile-bg-warning',
          borderColor: 'border-yellow-200',
          textColor: 'mobile-text-warning',
          iconColor: 'text-yellow-600',
          suggestions: [
            'Wait a moment and try again',
            'Check your connection speed',
            'Try again when you have a better connection'
          ]
        };
      
      case 'api':
        return {
          icon: AlertTriangle,
          defaultTitle: 'Service Unavailable',
          defaultMessage: 'The crypto data service is temporarily unavailable. Please try again in a few moments.',
          bgColor: 'mobile-bg-warning',
          borderColor: 'border-orange-200',
          textColor: 'mobile-text-warning',
          iconColor: 'text-orange-600',
          suggestions: [
            'The service may be under maintenance',
            'Try again in a few minutes',
            'Check if other crypto services are working'
          ]
        };
      
      case 'rateLimit':
        return {
          icon: Shield,
          defaultTitle: 'Rate Limit Reached',
          defaultMessage: 'Too many requests. Please wait a moment before trying again.',
          bgColor: 'mobile-bg-info',
          borderColor: 'border-purple-200',
          textColor: 'mobile-text-info',
          iconColor: 'text-purple-600',
          suggestions: [
            'Wait 1-2 minutes before trying again',
            'Avoid refreshing too frequently',
            'Rate limits help keep the service stable'
          ]
        };
      
      case 'noData':
        return {
          icon: Info,
          defaultTitle: 'No Data Available',
          defaultMessage: 'No crypto news or market data is currently available. Try refreshing to load new content.',
          bgColor: 'mobile-bg-info',
          borderColor: 'border-blue-200',
          textColor: 'mobile-text-info',
          iconColor: 'text-blue-600',
          suggestions: [
            'Market data may be temporarily unavailable',
            'Try refreshing in a few moments',
            'Check back later for updated information'
          ]
        };
      
      default:
        return {
          icon: XCircle,
          defaultTitle: 'Something Went Wrong',
          defaultMessage: 'An unexpected error occurred. Please try again.',
          bgColor: 'mobile-bg-secondary',
          borderColor: 'border-gray-200',
          textColor: 'mobile-text-secondary',
          iconColor: 'text-gray-600',
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Contact support if the problem persists'
          ]
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  // Show more detailed error information after multiple retries
  const shouldShowDetails = retryCount >= 2 || showDetails;

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} 
      border-2 rounded-lg p-6 text-center mobile-error-container
      ${isMobile ? 'mx-4' : 'mx-auto max-w-md'}
      ${className}
    `}>
      {/* Error Icon with animation */}
      <div className="flex justify-center mb-4">
        <IconComponent 
          className={`
            ${config.iconColor} 
            ${isMobile ? 'h-12 w-12' : 'h-10 w-10'}
            ${prefersReducedMotion ? '' : 'animate-mobile-error-bounce'}
          `} 
        />
      </div>

      {/* Error Title */}
      <h3 className={`
        ${config.textColor} font-bold mb-3
        ${isMobile ? 'text-lg' : 'text-base'}
      `}>
        {title || config.defaultTitle}
      </h3>

      {/* Error Message */}
      <p className={`
        ${config.textColor} mb-4 leading-relaxed
        ${isMobile ? 'text-base' : 'text-sm'}
      `}>
        {message || config.defaultMessage}
      </p>

      {/* Retry count indicator */}
      {retryCount > 0 && (
        <p className={`
          ${config.textColor} text-sm mb-4 opacity-75
        `}>
          Attempt {retryCount + 1}
        </p>
      )}

      {/* Detailed error information */}
      {shouldShowDetails && (
        <div className="mb-4 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`
              ${config.textColor} text-sm underline mb-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
            `}
          >
            {showDetails ? 'Hide Details' : 'Show Troubleshooting Tips'}
          </button>
          
          {showDetails && (
            <div className={`
              ${config.textColor} text-sm space-y-1 
              bg-white bg-opacity-50 p-3 rounded border
            `}>
              <p className="font-semibold mb-2">Troubleshooting suggestions:</p>
              <ul className="list-disc list-inside space-y-1">
                {config.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className={`
            mobile-retry-button
            ${config.textColor} border-2 ${config.borderColor}
            font-bold py-3 px-6 rounded-lg
            hover:bg-white transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center mx-auto
            ${isMobile ? 'min-h-[44px] text-base' : 'min-h-[36px] text-sm'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${prefersReducedMotion ? '' : 'animate-mobile-retry-pulse'}
          `}
        >
          {isRetrying ? (
            <>
              <RefreshCw className={`
                ${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2
                ${prefersReducedMotion ? '' : 'animate-spin'}
              `} />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
              {retryLabel}
            </>
          )}
        </button>
      )}

      {/* Connection status indicator for network errors */}
      {type === 'network' && (
        <div className="mt-4 text-xs opacity-75">
          <p className={config.textColor}>
            Connection: {connectionType || 'Unknown'}
          </p>
        </div>
      )}
    </div>
  );
}

interface MobileNetworkErrorProps {
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Specialized network error component for mobile devices
 */
function MobileNetworkError({ 
  onRetry, 
  isRetrying = false, 
  className = '' 
}: MobileNetworkErrorProps) {
  const { isMobile } = useMobileViewport();

  return (
    <MobileErrorState
      type="network"
      title="No Internet Connection"
      message={isMobile 
        ? "Please check your mobile data or WiFi connection and try again."
        : "Please check your internet connection and try again."
      }
      onRetry={onRetry}
      retryLabel="Check Connection"
      isRetrying={isRetrying}
      className={className}
    />
  );
}

interface MobileApiErrorProps {
  apiName?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Specialized API error component for mobile devices
 */
function MobileApiError({ 
  apiName = 'Crypto API',
  onRetry, 
  isRetrying = false, 
  className = '' 
}: MobileApiErrorProps) {
  return (
    <MobileErrorState
      type="api"
      title={`${apiName} Unavailable`}
      message={`The ${apiName} service is temporarily unavailable. This could be due to maintenance or high traffic.`}
      onRetry={onRetry}
      retryLabel="Retry Request"
      isRetrying={isRetrying}
      className={className}
    />
  );
}

interface MobileTimeoutErrorProps {
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Specialized timeout error component for mobile devices
 */
function MobileTimeoutError({ 
  onRetry, 
  isRetrying = false, 
  className = '' 
}: MobileTimeoutErrorProps) {
  const { isMobile } = useMobileViewport();

  return (
    <MobileErrorState
      type="timeout"
      title="Request Timeout"
      message={isMobile 
        ? "The request is taking too long. This might be due to slow mobile connection."
        : "The request is taking longer than expected. Please try again."
      }
      onRetry={onRetry}
      retryLabel="Try Again"
      isRetrying={isRetrying}
      className={className}
    />
  );
}

interface MobileRateLimitErrorProps {
  resetTime?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Specialized rate limit error component for mobile devices
 */
function MobileRateLimitError({ 
  resetTime,
  onRetry, 
  isRetrying = false, 
  className = '' 
}: MobileRateLimitErrorProps) {
  const message = resetTime 
    ? `Rate limit exceeded. Please wait until ${resetTime} before trying again.`
    : "Too many requests. Please wait a few minutes before trying again.";

  return (
    <MobileErrorState
      type="rateLimit"
      title="Rate Limit Exceeded"
      message={message}
      onRetry={onRetry}
      retryLabel="Try Again"
      isRetrying={isRetrying}
      className={className}
    />
  );
}

interface MobileNoDataErrorProps {
  dataType?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Specialized no data error component for mobile devices
 */
function MobileNoDataError({ 
  dataType = 'data',
  onRetry, 
  isRetrying = false, 
  className = '' 
}: MobileNoDataErrorProps) {
  return (
    <MobileErrorState
      type="noData"
      title={`No ${dataType} Available`}
      message={`No ${dataType} is currently available. This might be temporary - try refreshing to load new content.`}
      onRetry={onRetry}
      retryLabel="Refresh"
      isRetrying={isRetrying}
      className={className}
    />
  );
}

interface MobileErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}

/**
 * Mobile-optimized error boundary component
 * Catches JavaScript errors and displays mobile-friendly error states
 */
class MobileErrorBoundary extends React.Component<
  MobileErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return (
        <MobileErrorState
          type="generic"
          title="Application Error"
          message="Something went wrong while loading this section. Please try refreshing the page."
          onRetry={this.handleRetry}
          retryLabel="Reload Section"
        />
      );
    }

    return this.props.children;
  }
}

// Export all error components
export {
  MobileErrorState,
  MobileNetworkError,
  MobileApiError,
  MobileTimeoutError,
  MobileRateLimitError,
  MobileNoDataError,
  MobileErrorBoundary
};