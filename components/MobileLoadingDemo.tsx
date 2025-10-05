import React, { useState, useEffect } from 'react';
import {
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
  MobileBatteryAwareLoading
} from './MobileLoadingComponents';
import {
  MobileErrorState,
  MobileNetworkError,
  MobileApiError,
  MobileTimeoutError,
  MobileRateLimitError,
  MobileNoDataError,
  MobileErrorBoundary
} from './MobileErrorStates';
import { useMobileViewport } from '../hooks/useMobileViewport';

/**
 * Demo component showcasing all mobile loading and error states
 * This component demonstrates proper usage of mobile-optimized loading components
 */
export function MobileLoadingDemo() {
  const { isMobile } = useMobileViewport();
  const [demoState, setDemoState] = useState<'loading' | 'error' | 'success' | 'empty'>('loading');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    if (demoState === 'loading') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setDemoState('success');
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [demoState]);

  // Simulate progressive loading stages
  const loadingStages = [
    { name: 'Connecting to API', progress: 0, message: 'Establishing connection...' },
    { name: 'Fetching Market Data', progress: 30, message: 'Loading cryptocurrency prices...' },
    { name: 'Processing News', progress: 60, message: 'Analyzing latest crypto news...' },
    { name: 'Finalizing', progress: 90, message: 'Preparing data for display...' }
  ];

  useEffect(() => {
    if (demoState === 'loading') {
      const stageInterval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev >= loadingStages.length - 1) {
            return prev;
          }
          return prev + 1;
        });
      }, 2000);

      return () => clearInterval(stageInterval);
    }
  }, [demoState]);

  const resetDemo = () => {
    setDemoState('loading');
    setProgress(0);
    setCurrentStage(0);
  };

  const simulateError = (type: 'network' | 'api' | 'timeout' | 'rateLimit' | 'noData') => {
    setDemoState('error');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 mobile-text-primary">
          Mobile Loading States Demo
        </h1>
        <p className="mobile-text-secondary mb-6">
          Comprehensive showcase of mobile-optimized loading and error states
        </p>
        
        {/* Demo Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={resetDemo}
            className="mobile-retry-button bg-blue-600 hover:bg-blue-700"
          >
            Reset Demo
          </button>
          <button
            onClick={() => simulateError('network')}
            className="mobile-retry-button bg-red-600 hover:bg-red-700"
          >
            Network Error
          </button>
          <button
            onClick={() => simulateError('api')}
            className="mobile-retry-button bg-orange-600 hover:bg-orange-700"
          >
            API Error
          </button>
          <button
            onClick={() => setDemoState('empty')}
            className="mobile-retry-button bg-gray-600 hover:bg-gray-700"
          >
            Empty State
          </button>
        </div>
      </div>

      {/* Basic Loading Components */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Basic Loading Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Spinners */}
          <div className="text-center">
            <h3 className="font-semibold mb-3 mobile-text-primary">Spinners</h3>
            <div className="space-y-3">
              <div className="flex justify-center">
                <MobileSpinner size="small" color="primary" />
              </div>
              <div className="flex justify-center">
                <MobileSpinner size="medium" color="secondary" />
              </div>
              <div className="flex justify-center">
                <MobileSpinner size="large" color="accent" />
              </div>
            </div>
          </div>

          {/* Pulse Loaders */}
          <div className="text-center">
            <h3 className="font-semibold mb-3 mobile-text-primary">Pulse Loaders</h3>
            <div className="space-y-3">
              <div className="flex justify-center">
                <MobilePulseLoader count={3} size="small" color="primary" />
              </div>
              <div className="flex justify-center">
                <MobilePulseLoader count={4} size="medium" color="secondary" />
              </div>
              <div className="flex justify-center">
                <MobilePulseLoader count={5} size="large" color="accent" />
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="text-center">
            <h3 className="font-semibold mb-3 mobile-text-primary">Progress Bars</h3>
            <div className="space-y-3">
              <MobileProgressBar progress={25} color="primary" size="thin" />
              <MobileProgressBar progress={50} color="secondary" size="medium" showPercentage />
              <MobileProgressBar progress={75} color="success" size="thick" showPercentage />
            </div>
          </div>
        </div>
      </section>

      {/* Skeleton Loading */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Skeleton Loading</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">Text Skeletons</h3>
            <div className="space-y-3">
              <MobileSkeleton variant="text" width="100%" />
              <MobileSkeleton variant="text" width="75%" />
              <MobileSkeleton variant="text" lines={3} />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">Shape Skeletons</h3>
            <div className="space-y-3">
              <MobileSkeleton variant="rectangular" width="100%" height="3rem" />
              <MobileSkeleton variant="circular" width="3rem" height="3rem" />
              <MobileShimmer width="100%" height="2rem" />
            </div>
          </div>
        </div>
      </section>

      {/* Loading Cards */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Loading Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MobileLoadingCard showImage showTitle showDescription />
          <MobileLoadingCard showTitle showDescription />
          <MobileLoadingCard showImage showTitle />
        </div>
      </section>

      {/* Advanced Loading States */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Advanced Loading States</h2>
        
        {/* Progressive Loading */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 mobile-text-primary">Progressive Loading</h3>
          <MobileProgressiveLoading
            stages={loadingStages}
            currentStage={currentStage}
            className="mobile-bg-secondary p-4 rounded"
          />
        </div>

        {/* Intelligent Loading */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 mobile-text-primary">Intelligent Loading</h3>
          <MobileIntelligentLoading
            isLoading={demoState === 'loading'}
            loadingDuration={progress * 100}
            data={demoState === 'success' ? ['data'] : demoState === 'empty' ? [] : null}
            error={demoState === 'error' ? new Error('Demo intelligent error') : null}
            onRetry={resetDemo}
            loadingMessage="Smart loading with device adaptation..."
            className="mobile-bg-secondary p-4 rounded"
          >
            <div className="text-center mobile-text-success font-semibold">
              ✅ Intelligent loading completed!
            </div>
          </MobileIntelligentLoading>
        </div>

        {/* Performance Loading */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 mobile-text-primary">Performance-Optimized Loading</h3>
          <MobilePerformanceLoading
            isLoading={demoState === 'loading'}
            performanceMode="auto"
            className="mobile-bg-secondary p-4 rounded"
          >
            <div className="text-center mobile-text-success font-semibold">
              ✅ Performance-optimized content loaded!
            </div>
          </MobilePerformanceLoading>
        </div>

        {/* Battery-Aware Loading */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 mobile-text-primary">Battery-Aware Loading</h3>
          <MobileBatteryAwareLoading
            isLoading={demoState === 'loading'}
            batteryLevel={0.3} // Simulate low battery
            isCharging={false}
            className="mobile-bg-secondary p-4 rounded"
          >
            <div className="text-center mobile-text-success font-semibold">
              ✅ Battery-conscious loading completed!
            </div>
          </MobileBatteryAwareLoading>
        </div>

        {/* Async State Management */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 mobile-text-primary">Async State Management</h3>
          <MobileAsyncState
            isLoading={demoState === 'loading'}
            error={demoState === 'error' ? new Error('Demo error state') : null}
            data={demoState === 'success' ? ['data'] : demoState === 'empty' ? [] : null}
            onRetry={resetDemo}
            className="mobile-bg-secondary p-4 rounded"
          >
            <div className="text-center mobile-text-success font-semibold">
              ✅ Data loaded successfully!
            </div>
          </MobileAsyncState>
        </div>

        {/* Loading with Timeout */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 mobile-text-primary">Loading with Timeout</h3>
          <MobileLoadingWithTimeout
            isLoading={demoState === 'loading'}
            timeout={10000}
            onTimeout={() => console.log('Timeout occurred')}
            loadingMessage="Loading crypto data..."
            className="mobile-bg-secondary p-4 rounded"
          >
            <div className="text-center mobile-text-success font-semibold">
              ✅ Content loaded within timeout!
            </div>
          </MobileLoadingWithTimeout>
        </div>
      </section>

      {/* Error States */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Error States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Error */}
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">Network Error</h3>
            <MobileNetworkError onRetry={() => console.log('Retry network')} />
          </div>

          {/* API Error */}
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">API Error</h3>
            <MobileApiError 
              apiName="CoinGecko API" 
              onRetry={() => console.log('Retry API')} 
            />
          </div>

          {/* Timeout Error */}
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">Timeout Error</h3>
            <MobileTimeoutError onRetry={() => console.log('Retry timeout')} />
          </div>

          {/* Rate Limit Error */}
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">Rate Limit Error</h3>
            <MobileRateLimitError 
              resetTime="2:30 PM"
              onRetry={() => console.log('Retry rate limit')} 
            />
          </div>

          {/* No Data Error */}
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">No Data Error</h3>
            <MobileNoDataError 
              dataType="crypto news"
              onRetry={() => console.log('Retry no data')} 
            />
          </div>

          {/* Generic Error */}
          <div>
            <h3 className="font-semibold mb-3 mobile-text-primary">Generic Error</h3>
            <MobileErrorState
              type="generic"
              title="Custom Error"
              message="This is a custom error message for demonstration purposes."
              onRetry={() => console.log('Retry generic')}
            />
          </div>
        </div>
      </section>

      {/* Error Boundary Demo */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Error Boundary</h2>
        
        <MobileErrorBoundary onError={(error) => console.error('Boundary caught:', error)}>
          <div className="mobile-bg-secondary p-4 rounded text-center">
            <p className="mobile-text-primary">
              This content is wrapped in a mobile error boundary. 
              If an error occurs, it will be caught and displayed with a mobile-friendly error state.
            </p>
          </div>
        </MobileErrorBoundary>
      </section>

      {/* Loading Overlay Demo */}
      <section className="mobile-bg-card p-6 rounded-lg relative">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Loading Overlay</h2>
        
        <div className="mobile-bg-secondary p-4 rounded min-h-[200px] relative">
          <p className="mobile-text-primary">
            This section demonstrates the loading overlay component. 
            The overlay appears on top of existing content during loading states.
          </p>
          
          <MobileLoadingOverlay
            isVisible={demoState === 'loading' && progress < 50}
            message="Loading overlay demo..."
            showSpinner={true}
          />
        </div>
      </section>

      {/* Performance Notes */}
      <section className="mobile-bg-card p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 mobile-text-primary">Performance Features</h2>
        
        <div className="space-y-4 mobile-text-secondary">
          <div>
            <h3 className="font-semibold mobile-text-primary">Mobile Optimizations:</h3>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Reduced motion support for accessibility</li>
              <li>Touch-friendly minimum sizes (44px)</li>
              <li>Performance-conscious animations</li>
              <li>High contrast colors for readability</li>
              <li>Responsive breakpoint handling</li>
              <li>Battery-aware loading states</li>
              <li>Connection-adaptive animations</li>
              <li>Device capability detection</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mobile-text-primary">Intelligent Features:</h3>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Automatic performance mode selection</li>
              <li>Progressive loading for long operations</li>
              <li>Smart error categorization and suggestions</li>
              <li>Hardware acceleration optimization</li>
              <li>Memory and CPU usage awareness</li>
              <li>Network condition adaptation</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mobile-text-primary">Error Handling:</h3>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Automatic error type detection</li>
              <li>Retry functionality with exponential backoff</li>
              <li>Timeout handling for slow connections</li>
              <li>Rate limit awareness</li>
              <li>Network status detection</li>
              <li>Detailed troubleshooting suggestions</li>
              <li>Connection-aware retry intervals</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MobileLoadingDemo;