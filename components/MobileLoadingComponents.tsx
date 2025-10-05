import { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { useMobileViewport, useDeviceCapabilities } from '../hooks/useMobileViewport';
import { 
  MobileErrorState, 
  MobileNetworkError, 
  MobileApiError, 
  MobileTimeoutError,
  MobileRateLimitError,
  MobileNoDataError 
} from './MobileErrorStates';

interface MobileSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

/**
 * Mobile-optimized loading spinner with performance considerations
 * Uses CSS transforms for better mobile performance and battery life
 */
export function MobileSpinner({ 
  size = 'medium', 
  color = 'primary', 
  className = '' 
}: MobileSpinnerProps) {
  const { isMobile } = useMobileViewport();
  const { prefersReducedMotion, connectionType, deviceMemory } = useDeviceCapabilities();

  // Adaptive sizing based on mobile device capabilities
  const sizeClasses = {
    small: isMobile ? 'w-5 h-5' : 'w-4 h-4',
    medium: isMobile ? 'w-7 h-7' : 'w-6 h-6',
    large: isMobile ? 'w-9 h-9' : 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'mobile-spinner-primary border-gray-900 border-t-transparent',
    secondary: 'mobile-spinner-secondary border-gray-600 border-t-transparent',
    accent: 'mobile-spinner-success border-blue-600 border-t-transparent'
  };

  // Performance-conscious animation selection
  const getAnimationClass = () => {
    if (prefersReducedMotion) return 'animate-pulse';
    
    // Use slower animations on low-end devices or slow connections
    if (isMobile && (connectionType === 'slow-2g' || connectionType === '2g' || 
        (deviceMemory !== null && deviceMemory < 2))) {
      return 'animate-pulse'; // Fallback to pulse for very low-end devices
    }
    
    return isMobile ? 'animate-spin-slow' : 'animate-spin';
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        ${getAnimationClass()}
        border-2 rounded-full mobile-spinner
        ${className}
      `}
      role="status"
      aria-label="Loading"
      style={{
        // Hardware acceleration for better mobile performance
        transform: 'translate3d(0, 0, 0)',
        willChange: prefersReducedMotion ? 'auto' : 'transform'
      }}
    />
  );
}

interface MobileSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

/**
 * Mobile-optimized skeleton loading component with performance enhancements
 * Provides visual placeholders while content loads with adaptive animations
 */
export function MobileSkeleton({ 
  variant = 'text', 
  width = '100%', 
  height = '1rem',
  lines = 1,
  className = '' 
}: MobileSkeletonProps) {
  const { prefersReducedMotion, connectionType, deviceMemory } = useDeviceCapabilities();
  const { isMobile } = useMobileViewport();

  // Performance-conscious animation selection
  const getAnimationClass = () => {
    if (prefersReducedMotion) return '';
    
    // Use simpler animations on low-end devices
    if (isMobile && (connectionType === 'slow-2g' || connectionType === '2g' || 
        (deviceMemory !== null && deviceMemory < 2))) {
      return 'animate-skeleton-loading'; // Custom slower animation
    }
    
    return isMobile ? 'animate-shimmer' : 'animate-pulse';
  };

  const baseClasses = `
    mobile-skeleton bg-gray-200 
    ${getAnimationClass()}
    ${className}
  `;

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  // Multi-line text skeleton with staggered animation
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" role="status" aria-label={`Loading ${lines} lines of text`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} rounded`}
            style={{
              width: index === lines - 1 ? '75%' : widthStyle,
              height: heightStyle,
              animationDelay: prefersReducedMotion ? '0ms' : `${index * 100}ms`,
              transform: 'translate3d(0, 0, 0)' // Hardware acceleration
            }}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    card: 'rounded-lg'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]}`}
      style={{ 
        width: widthStyle, 
        height: heightStyle,
        transform: 'translate3d(0, 0, 0)', // Hardware acceleration
        willChange: prefersReducedMotion ? 'auto' : 'background-color'
      }}
      role="status"
      aria-label="Loading content"
    />
  );
}

interface MobileLoadingCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  className?: string;
}

/**
 * Mobile-optimized loading card for article/content placeholders
 */
export function MobileLoadingCard({ 
  showImage = true, 
  showTitle = true, 
  showDescription = true,
  className = '' 
}: MobileLoadingCardProps) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg bg-white ${className}`}>
      {showImage && (
        <MobileSkeleton 
          variant="rectangular" 
          height="12rem" 
          className="mb-4" 
        />
      )}
      
      {showTitle && (
        <MobileSkeleton 
          variant="text" 
          height="1.5rem" 
          width="85%" 
          className="mb-2" 
        />
      )}
      
      {showDescription && (
        <MobileSkeleton 
          variant="text" 
          lines={3} 
          height="1rem" 
        />
      )}
    </div>
  );
}

interface MobileProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'thin' | 'medium' | 'thick';
  className?: string;
}

/**
 * Mobile-optimized progress bar with touch-friendly sizing
 */
export function MobileProgressBar({ 
  progress, 
  showPercentage = false,
  color = 'primary',
  size = 'medium',
  className = '' 
}: MobileProgressBarProps) {
  const { isMobile } = useMobileViewport();

  const sizeClasses = {
    thin: 'h-1',
    medium: isMobile ? 'h-3' : 'h-2',
    thick: isMobile ? 'h-4' : 'h-3'
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}

interface MobileLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  showSpinner?: boolean;
  className?: string;
}

/**
 * Mobile-optimized full-screen loading overlay
 */
export function MobileLoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  showSpinner = true,
  className = '' 
}: MobileLoadingOverlayProps) {
  const { isMobile } = useMobileViewport();

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 bg-white bg-opacity-90 
        flex flex-col items-center justify-center 
        z-50 backdrop-blur-sm
        ${className}
      `}
      role="dialog"
      aria-label="Loading"
    >
      {showSpinner && (
        <MobileSpinner 
          size={isMobile ? 'large' : 'medium'} 
          className="mb-4" 
        />
      )}
      
      <p className={`
        text-gray-700 font-serif text-center
        ${isMobile ? 'text-lg px-6' : 'text-base'}
      `}>
        {message}
      </p>
    </div>
  );
}

interface MobilePulseLoaderProps {
  count?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

/**
 * Mobile-optimized pulse loader with multiple dots
 * Performance-conscious animation for mobile devices
 */
export function MobilePulseLoader({ 
  count = 3, 
  size = 'medium',
  color = 'primary',
  className = '' 
}: MobilePulseLoaderProps) {
  const { prefersReducedMotion } = useDeviceCapabilities();

  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-600',
    accent: 'bg-blue-600'
  };

  return (
    <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]} 
            rounded-full
            ${prefersReducedMotion ? 'opacity-50' : 'animate-bounce'}
          `}
          style={{
            animationDelay: prefersReducedMotion ? '0ms' : `${index * 150}ms`
          }}
        />
      ))}
    </div>
  );
}

interface MobileShimmerProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Mobile-optimized shimmer effect for loading states
 * Uses CSS gradients for better mobile performance
 */
export function MobileShimmer({ 
  width = '100%', 
  height = '1rem',
  className = '' 
}: MobileShimmerProps) {
  const { prefersReducedMotion } = useDeviceCapabilities();

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
        ${prefersReducedMotion ? '' : 'animate-shimmer'}
        rounded
        ${className}
      `}
      style={{ 
        width: widthStyle, 
        height: heightStyle,
        backgroundSize: '200% 100%'
      }}
    />
  );
}

interface MobileLoadingStateProps {
  type: 'spinner' | 'skeleton' | 'pulse' | 'shimmer' | 'progress';
  message?: string;
  progress?: number;
  className?: string;
}

/**
 * Unified mobile loading state component
 * Automatically selects appropriate loading animation based on device capabilities
 */
export function MobileLoadingState({ 
  type, 
  message, 
  progress = 0,
  className = '' 
}: MobileLoadingStateProps) {
  const { isMobile } = useMobileViewport();
  const { prefersReducedMotion } = useDeviceCapabilities();

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return <MobileSpinner size={isMobile ? 'large' : 'medium'} />;
      
      case 'skeleton':
        return <MobileSkeleton variant="rectangular" height="4rem" />;
      
      case 'pulse':
        return <MobilePulseLoader count={3} size={isMobile ? 'large' : 'medium'} />;
      
      case 'shimmer':
        return <MobileShimmer height="4rem" />;
      
      case 'progress':
        return (
          <MobileProgressBar 
            progress={progress} 
            showPercentage={true}
            size={isMobile ? 'thick' : 'medium'}
          />
        );
      
      default:
        return <MobileSpinner />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      {renderLoader()}
      
      {message && (
        <p className={`
          mt-4 text-gray-600 font-serif text-center
          ${isMobile ? 'text-base' : 'text-sm'}
        `}>
          {message}
        </p>
      )}
    </div>
  );
}

interface MobileAsyncStateProps {
  isLoading: boolean;
  error?: Error | string | null;
  data?: any;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Comprehensive mobile async state manager
 * Handles loading, error, and empty states with mobile optimizations
 */
export function MobileAsyncState({
  isLoading,
  error,
  data,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  className = ''
}: MobileAsyncStateProps) {
  const { isMobile } = useMobileViewport();

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }
    
    return (
      <div className={className}>
        <MobileLoadingState 
          type="spinner" 
          message="Loading crypto data..."
        />
      </div>
    );
  }

  // Error state
  if (error) {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }

    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Determine error type based on message content
    let errorType: 'network' | 'timeout' | 'api' | 'rateLimit' | 'generic' = 'generic';
    
    if (errorMessage.toLowerCase().includes('network') || 
        errorMessage.toLowerCase().includes('connection') ||
        errorMessage.toLowerCase().includes('offline')) {
      errorType = 'network';
    } else if (errorMessage.toLowerCase().includes('timeout')) {
      errorType = 'timeout';
    } else if (errorMessage.toLowerCase().includes('rate limit') || 
               errorMessage.toLowerCase().includes('too many requests')) {
      errorType = 'rateLimit';
    } else if (errorMessage.toLowerCase().includes('api') || 
               errorMessage.toLowerCase().includes('service')) {
      errorType = 'api';
    }

    return (
      <div className={className}>
        <MobileErrorState
          type={errorType}
          message={errorMessage}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    if (emptyComponent) {
      return <div className={className}>{emptyComponent}</div>;
    }
    
    return (
      <div className={className}>
        <MobileNoDataError 
          dataType="crypto data"
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Success state - render children
  return <div className={className}>{children}</div>;
}

interface MobileLoadingWithTimeoutProps {
  isLoading: boolean;
  timeout?: number;
  onTimeout?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  timeoutMessage?: string;
  className?: string;
}

/**
 * Mobile loading component with timeout handling
 * Automatically shows timeout error after specified duration
 */
export function MobileLoadingWithTimeout({
  isLoading,
  timeout = 15000, // 15 seconds default
  onTimeout,
  children,
  loadingMessage = "Loading...",
  timeoutMessage = "Request is taking longer than expected",
  className = ''
}: MobileLoadingWithTimeoutProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const { isMobile } = useMobileViewport();

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      onTimeout?.();
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [isLoading, timeout, onTimeout]);

  if (isLoading && hasTimedOut) {
    return (
      <div className={className}>
        <MobileTimeoutError 
          onRetry={() => {
            setHasTimedOut(false);
            onTimeout?.();
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <MobileLoadingState 
          type="spinner" 
          message={loadingMessage}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

interface MobileRetryableLoadingProps {
  isLoading: boolean;
  error?: Error | string | null;
  onRetry: () => void;
  maxRetries?: number;
  retryDelay?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile loading component with automatic retry functionality
 * Provides user-friendly retry options with exponential backoff
 */
export function MobileRetryableLoading({
  isLoading,
  error,
  onRetry,
  maxRetries = 3,
  retryDelay = 1000,
  children,
  className = ''
}: MobileRetryableLoadingProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Exponential backoff delay
    const delay = retryDelay * Math.pow(2, retryCount);
    
    setTimeout(() => {
      onRetry();
      setIsRetrying(false);
    }, delay);
  };

  const resetRetries = () => {
    setRetryCount(0);
    setIsRetrying(false);
  };

  // Reset retry count on successful load
  useEffect(() => {
    if (!isLoading && !error) {
      resetRetries();
    }
  }, [isLoading, error]);

  if (error && retryCount < maxRetries) {
    return (
      <div className={className}>
        <MobileErrorState
          type="generic"
          message={typeof error === 'string' ? error : error.message}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          retryLabel={`Retry (${retryCount}/${maxRetries})`}
        />
      </div>
    );
  }

  if (error && retryCount >= maxRetries) {
    return (
      <div className={className}>
        <MobileErrorState
          type="generic"
          title="Maximum Retries Exceeded"
          message="Unable to load data after multiple attempts. Please check your connection and refresh the page."
          onRetry={resetRetries}
          retryLabel="Reset & Try Again"
        />
      </div>
    );
  }

  if (isLoading || isRetrying) {
    return (
      <div className={className}>
        <MobileLoadingState 
          type="spinner" 
          message={isRetrying ? "Retrying..." : "Loading..."}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

interface MobileProgressiveLoadingProps {
  stages: Array<{
    name: string;
    progress: number;
    message?: string;
  }>;
  currentStage: number;
  error?: Error | string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Mobile progressive loading component
 * Shows detailed progress through multiple loading stages
 */
export function MobileProgressiveLoading({
  stages,
  currentStage,
  error,
  onRetry,
  children,
  className = ''
}: MobileProgressiveLoadingProps) {
  const { isMobile } = useMobileViewport();
  
  const isComplete = currentStage >= stages.length;
  const currentStageData = stages[currentStage] || stages[stages.length - 1];
  
  if (error) {
    return (
      <div className={className}>
        <MobileErrorState
          type="generic"
          message={typeof error === 'string' ? error : error.message}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!isComplete) {
    const totalProgress = stages.reduce((acc, stage, index) => {
      if (index < currentStage) return acc + 100;
      if (index === currentStage) return acc + stage.progress;
      return acc;
    }, 0) / stages.length;

    return (
      <div className={`${className} space-y-4`}>
        <MobileProgressBar 
          progress={totalProgress}
          showPercentage={true}
          size={isMobile ? 'thick' : 'medium'}
        />
        
        <div className="text-center">
          <div className={`font-bold ${isMobile ? 'text-base' : 'text-sm'} mb-2`}>
            {currentStageData.name}
          </div>
          {currentStageData.message && (
            <div className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              {currentStageData.message}
            </div>
          )}
        </div>

        {/* Stage indicators */}
        <div className="flex justify-center space-x-2">
          {stages.map((stage, index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-colors
                ${index < currentStage ? 'bg-green-500' : 
                  index === currentStage ? 'bg-blue-500' : 'bg-gray-300'}
              `}
            />
          ))}
        </div>
      </div>
    );
  }

  return children ? <div className={className}>{children}</div> : null;
}

interface MobileIntelligentLoadingProps {
  isLoading: boolean;
  loadingDuration?: number;
  data?: any;
  error?: Error | string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  className?: string;
}

/**
 * Intelligent mobile loading component that adapts based on device capabilities
 * Automatically selects optimal loading animations and provides smart error handling
 */
export function MobileIntelligentLoading({
  isLoading,
  loadingDuration = 0,
  data,
  error,
  onRetry,
  children,
  loadingMessage = "Loading...",
  className = ''
}: MobileIntelligentLoadingProps) {
  const { isMobile } = useMobileViewport();
  const { prefersReducedMotion, connectionType, deviceMemory } = useDeviceCapabilities();
  const [loadingStartTime] = useState(Date.now());
  const [showProgressiveLoading, setShowProgressiveLoading] = useState(false);

  // Determine optimal loading animation based on device capabilities
  const getOptimalLoadingType = (): 'spinner' | 'skeleton' | 'pulse' | 'shimmer' => {
    if (prefersReducedMotion) return 'pulse';
    
    // Use simpler animations on low-end devices
    if (connectionType === 'slow-2g' || connectionType === '2g' || 
        (deviceMemory !== null && deviceMemory < 2)) {
      return 'pulse';
    }
    
    // Use skeleton for longer loading times
    if (loadingDuration > 3000) return 'skeleton';
    
    // Use shimmer for medium loading times on capable devices
    if (loadingDuration > 1000 && !isMobile) return 'shimmer';
    
    return 'spinner';
  };

  // Show progressive loading for longer operations
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowProgressiveLoading(true);
      }, 2000); // Show progressive loading after 2 seconds

      return () => clearTimeout(timer);
    } else {
      setShowProgressiveLoading(false);
    }
  }, [isLoading]);

  // Enhanced error detection and categorization
  const getErrorType = (error: Error | string): 'network' | 'timeout' | 'api' | 'rateLimit' | 'generic' => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || 
        lowerMessage.includes('offline') || lowerMessage.includes('fetch')) {
      return 'network';
    }
    
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return 'timeout';
    }
    
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests') ||
        lowerMessage.includes('429')) {
      return 'rateLimit';
    }
    
    if (lowerMessage.includes('api') || lowerMessage.includes('service') || 
        lowerMessage.includes('server') || lowerMessage.includes('500') ||
        lowerMessage.includes('502') || lowerMessage.includes('503')) {
      return 'api';
    }
    
    return 'generic';
  };

  // Loading state with intelligent animation selection
  if (isLoading) {
    const loadingType = getOptimalLoadingType();
    const currentLoadingTime = Date.now() - loadingStartTime;
    
    // Show progressive loading for long operations
    if (showProgressiveLoading && currentLoadingTime > 2000) {
      const stages = [
        { name: 'Connecting', progress: 25, message: 'Establishing connection...' },
        { name: 'Loading Data', progress: 50, message: loadingMessage },
        { name: 'Processing', progress: 75, message: 'Processing response...' },
        { name: 'Finalizing', progress: 90, message: 'Almost ready...' }
      ];
      
      const currentStage = Math.min(
        Math.floor(currentLoadingTime / 1000) - 1, 
        stages.length - 1
      );
      
      return (
        <div className={className}>
          <MobileProgressiveLoading
            stages={stages}
            currentStage={Math.max(0, currentStage)}
          />
        </div>
      );
    }
    
    // Standard loading state
    return (
      <div className={className}>
        <MobileLoadingState 
          type={loadingType}
          message={loadingMessage}
        />
      </div>
    );
  }

  // Error state with intelligent error type detection
  if (error) {
    const errorType = getErrorType(error);
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return (
      <div className={className}>
        <MobileErrorState
          type={errorType}
          message={errorMessage}
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={className}>
        <MobileNoDataError 
          dataType="content"
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Success state
  return <div className={className}>{children}</div>;
}

interface MobilePerformanceLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
  performanceMode?: 'auto' | 'high' | 'low';
  className?: string;
}

/**
 * Performance-optimized mobile loading component
 * Automatically adjusts animations based on device performance characteristics
 */
export function MobilePerformanceLoading({
  isLoading,
  children,
  fallbackComponent,
  performanceMode = 'auto',
  className = ''
}: MobilePerformanceLoadingProps) {
  const { isMobile } = useMobileViewport();
  const { prefersReducedMotion, connectionType, deviceMemory } = useDeviceCapabilities();
  
  // Determine performance level
  const getPerformanceLevel = (): 'high' | 'medium' | 'low' => {
    if (performanceMode !== 'auto') {
      return performanceMode === 'high' ? 'high' : 'low';
    }
    
    // Auto-detect performance level
    if (prefersReducedMotion) return 'low';
    
    if (connectionType === 'slow-2g' || connectionType === '2g') return 'low';
    
    if (deviceMemory !== null && deviceMemory < 2) return 'low';
    
    if (deviceMemory !== null && deviceMemory >= 4 && 
        (connectionType === '4g' || connectionType === '5g')) return 'high';
    
    return 'medium';
  };

  const performanceLevel = getPerformanceLevel();

  if (isLoading) {
    if (fallbackComponent) {
      return <div className={className}>{fallbackComponent}</div>;
    }

    // Performance-based loading component selection
    switch (performanceLevel) {
      case 'high':
        return (
          <div className={className}>
            <MobileLoadingState type="shimmer" message="Loading..." />
          </div>
        );
      
      case 'medium':
        return (
          <div className={className}>
            <MobileLoadingState type="spinner" message="Loading..." />
          </div>
        );
      
      case 'low':
        return (
          <div className={className}>
            <MobileLoadingState type="pulse" message="Loading..." />
          </div>
        );
      
      default:
        return (
          <div className={className}>
            <MobileLoadingState type="spinner" message="Loading..." />
          </div>
        );
    }
  }

  return <div className={className}>{children}</div>;
}

interface MobileBatteryAwareLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  batteryLevel?: number;
  isCharging?: boolean;
  className?: string;
}

/**
 * Battery-aware mobile loading component
 * Reduces animation intensity when battery is low to preserve battery life
 */
export function MobileBatteryAwareLoading({
  isLoading,
  children,
  batteryLevel,
  isCharging = false,
  className = ''
}: MobileBatteryAwareLoadingProps) {
  const { prefersReducedMotion } = useDeviceCapabilities();
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean }>({
    level: batteryLevel || 1,
    charging: isCharging
  });

  // Battery API detection (if available)
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          setBatteryInfo({
            level: battery.level,
            charging: battery.charging
          });
        };

        updateBatteryInfo();
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
        };
      });
    }
  }, []);

  if (isLoading) {
    // Use minimal animations when battery is low and not charging
    const useLowPowerMode = batteryInfo.level < 0.2 && !batteryInfo.charging;
    
    if (prefersReducedMotion || useLowPowerMode) {
      return (
        <div className={className}>
          <div className="mobile-loading-container">
            <div className="mobile-text-secondary text-center">
              Loading...
            </div>
          </div>
        </div>
      );
    }

    // Use reduced animations when battery is moderately low
    const useReducedAnimations = batteryInfo.level < 0.5 && !batteryInfo.charging;
    
    return (
      <div className={className}>
        <MobileLoadingState 
          type={useReducedAnimations ? "pulse" : "spinner"} 
          message="Loading..." 
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Export all components for easy importing
export {
  MobileSpinner,
  MobileSkeleton,
  MobileLoadingCard,
  MobileProgressBar,
  MobileLoadingOverlay,
  MobilePulseLoader,
  MobileShimmer,
  MobileLoadingState,
  MobileAsyncState,
  MobileLoadingWithTimeout,
  MobileRetryableLoading,
  MobileProgressiveLoading,
  MobileIntelligentLoading,
  MobilePerformanceLoading,
  MobileBatteryAwareLoading,
  // Re-export error components for convenience
  MobileErrorState,
  MobileNetworkError,
  MobileApiError,
  MobileTimeoutError,
  MobileRateLimitError,
  MobileNoDataError
};