import React, { useState, useEffect } from 'react';
import {
  MobileIntelligentLoading,
  MobilePerformanceLoading,
  MobileBatteryAwareLoading,
  MobileAsyncState,
  MobileLoadingWithTimeout,
  MobileRetryableLoading
} from './MobileLoadingComponents';
import { MobileErrorBoundary } from './MobileErrorStates';
import { useMobileViewport, useDeviceCapabilities } from '../hooks/useMobileViewport';

interface MobileFinalIntegrationProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Final mobile integration component that wraps content with comprehensive
 * mobile-optimized loading states, error handling, and performance optimizations
 */
export function MobileFinalIntegration({ 
  children, 
  className = '' 
}: MobileFinalIntegrationProps) {
  const { isMobile } = useMobileViewport();
  const { prefersReducedMotion, connectionType, deviceMemory } = useDeviceCapabilities();
  const [isInitializing, setIsInitializing] = useState(true);

  // Simulate initial app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <MobilePerformanceLoading
          isLoading={true}
          performanceMode="auto"
        >
          <div />
        </MobilePerformanceLoading>
      </div>
    );
  }

  return (
    <MobileErrorBoundary
      onError={(error) => {
        console.error('Mobile app error:', error);
        // Could send to error reporting service
      }}
    >
      <div className={`mobile-app-container ${className}`}>
        {children}
      </div>
    </MobileErrorBoundary>
  );
}

interface MobileDataWrapperProps<T> {
  fetchData: () => Promise<T>;
  children: (data: T) => React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  retryAttempts?: number;
  timeout?: number;
  className?: string;
}

/**
 * Comprehensive mobile data wrapper that handles all loading states
 * with intelligent error handling and performance optimizations
 */
export function MobileDataWrapper<T>({
  fetchData,
  children,
  loadingMessage = "Loading data...",
  errorMessage,
  emptyMessage,
  retryAttempts = 3,
  timeout = 15000,
  className = ''
}: MobileDataWrapperProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadingStartTime, setLoadingStartTime] = useState(Date.now());
  const { isMobile } = useMobileViewport();
  const { connectionType } = useDeviceCapabilities();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadingStartTime(Date.now());
      
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadingDuration = Date.now() - loadingStartTime;

  // Use intelligent loading for complex data operations
  return (
    <div className={className}>
      <MobileRetryableLoading
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        maxRetries={retryAttempts}
        retryDelay={connectionType === 'slow-2g' ? 3000 : 1000}
      >
        <MobileLoadingWithTimeout
          isLoading={isLoading}
          timeout={timeout}
          onTimeout={() => {
            setError(new Error('Request timeout - please check your connection'));
          }}
          loadingMessage={loadingMessage}
        >
          <MobileIntelligentLoading
            isLoading={isLoading}
            loadingDuration={loadingDuration}
            data={data}
            error={error}
            onRetry={loadData}
            loadingMessage={loadingMessage}
          >
            {data && children(data)}
          </MobileIntelligentLoading>
        </MobileLoadingWithTimeout>
      </MobileRetryableLoading>
    </div>
  );
}

interface MobileCryptoDataWrapperProps {
  children: React.ReactNode;
  apiEndpoint: string;
  refreshInterval?: number;
  className?: string;
}

/**
 * Specialized mobile wrapper for crypto data with real-time updates
 * Optimized for crypto market data loading patterns
 */
export function MobileCryptoDataWrapper({
  children,
  apiEndpoint,
  refreshInterval = 30000, // 30 seconds default
  className = ''
}: MobileCryptoDataWrapperProps) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { isMobile } = useMobileViewport();
  const { connectionType } = useDeviceCapabilities();

  const fetchCryptoData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();

    // Set up auto-refresh with connection-aware intervals
    const getRefreshInterval = () => {
      if (connectionType === 'slow-2g' || connectionType === '2g') {
        return refreshInterval * 2; // Slower refresh on slow connections
      }
      return refreshInterval;
    };

    const interval = setInterval(fetchCryptoData, getRefreshInterval());
    
    return () => clearInterval(interval);
  }, [apiEndpoint, refreshInterval, connectionType]);

  return (
    <div className={className}>
      <MobileBatteryAwareLoading
        isLoading={isLoading}
      >
        <MobileAsyncState
          isLoading={isLoading}
          error={error}
          data={data}
          onRetry={fetchCryptoData}
        >
          <div className="mobile-crypto-data-container">
            {/* Last update indicator */}
            {lastUpdate && !isLoading && (
              <div className="mobile-text-muted text-xs text-center mb-2">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            {children}
          </div>
        </MobileAsyncState>
      </MobileBatteryAwareLoading>
    </div>
  );
}

interface MobileNewsWrapperProps {
  children: React.ReactNode;
  newsCategory?: string;
  maxArticles?: number;
  className?: string;
}

/**
 * Specialized mobile wrapper for news data with progressive loading
 * Optimized for news article loading and display
 */
export function MobileNewsWrapper({
  children,
  newsCategory = 'crypto',
  maxArticles = 10,
  className = ''
}: MobileNewsWrapperProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const { isMobile } = useMobileViewport();

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadedCount(0);
      
      // Simulate progressive loading for better UX
      const response = await fetch(`/api/crypto-herald?category=${newsCategory}&limit=${maxArticles}`);
      if (!response.ok) {
        throw new Error(`News API Error: ${response.status}`);
      }
      
      const newsData = await response.json();
      
      // Progressive loading simulation
      if (isMobile && newsData.articles && newsData.articles.length > 5) {
        // Load articles progressively on mobile for better perceived performance
        const batchSize = 3;
        for (let i = 0; i < newsData.articles.length; i += batchSize) {
          const batch = newsData.articles.slice(i, i + batchSize);
          setArticles(prev => [...prev, ...batch]);
          setLoadedCount(i + batch.length);
          
          // Small delay between batches for smooth loading
          if (i + batchSize < newsData.articles.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } else {
        setArticles(newsData.articles || []);
        setLoadedCount(newsData.articles?.length || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [newsCategory, maxArticles]);

  const isProgressiveLoading = isLoading && loadedCount > 0;

  return (
    <div className={className}>
      <MobileAsyncState
        isLoading={isLoading && loadedCount === 0}
        error={error}
        data={articles}
        onRetry={fetchNews}
        loadingComponent={
          <MobileIntelligentLoading
            isLoading={true}
            loadingMessage="Loading crypto news..."
            data={null}
            error={null}
          >
            <div />
          </MobileIntelligentLoading>
        }
      >
        <div className="mobile-news-container">
          {/* Progressive loading indicator */}
          {isProgressiveLoading && (
            <div className="mobile-text-muted text-sm text-center mb-4">
              Loading articles... ({loadedCount}/{maxArticles})
            </div>
          )}
          
          {children}
          
          {/* Loading more indicator */}
          {isProgressiveLoading && (
            <div className="flex justify-center mt-4">
              <div className="mobile-spinner-small animate-spin-slow" />
            </div>
          )}
        </div>
      </MobileAsyncState>
    </div>
  );
}

// Export all mobile integration components
export {
  MobileFinalIntegration,
  MobileDataWrapper,
  MobileCryptoDataWrapper,
  MobileNewsWrapper
};

export default MobileFinalIntegration;