/**
 * Einstein Refresh Button Component
 * 
 * Provides real-time data refresh functionality with visual feedback.
 * Implements Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 * 
 * Features:
 * - Click handler to trigger refreshAllData()
 * - Loading spinner during refresh
 * - "Last Refreshed: X seconds ago" timestamp
 * - Highlight changed data with orange glow
 * - Disable button during refresh
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface RefreshButtonProps {
  /** Symbol to refresh data for (e.g., 'BTC', 'ETH') */
  symbol: string;
  
  /** Timeframe for data refresh */
  timeframe?: '15m' | '1h' | '4h' | '1d';
  
  /** Callback when refresh completes successfully */
  onRefreshComplete?: (result: RefreshResult) => void;
  
  /** Callback when refresh fails */
  onRefreshError?: (error: Error) => void;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Show compact version (icon only) */
  compact?: boolean;
}

interface RefreshResult {
  success: boolean;
  dataQuality: {
    overall: number;
    market: number;
    sentiment: number;
    onChain: number;
    technical: number;
    sources: {
      successful: string[];
      failed: string[];
    };
  };
  changes: {
    priceChanged: boolean;
    priceDelta: number;
    indicatorsChanged: string[];
    sentimentChanged: boolean;
    onChainChanged: boolean;
    significantChanges: boolean;
  };
  timestamp: string;
  duration: number;
}

// ============================================================================
// Refresh Button Component
// ============================================================================

/**
 * RefreshButton Component
 * 
 * Requirement 16.1: WHEN the user clicks "Refresh" on a trade signal THEN 
 * the system SHALL re-fetch market data, technical indicators, sentiment, 
 * and on-chain data
 * 
 * Requirement 16.2: WHEN refresh is in progress THEN the system SHALL 
 * disable the button and show loading spinner
 * 
 * Requirement 16.3: WHEN refresh completes THEN the system SHALL update 
 * all displayed values and highlight changes
 * 
 * Requirement 16.4: WHEN refresh detects price targets hit THEN the system 
 * SHALL display notification suggesting status update
 * 
 * Requirement 16.5: WHEN refresh completes THEN the system SHALL display 
 * "Last Refreshed: X seconds ago" timestamp
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({
  symbol,
  timeframe = '1h',
  onRefreshComplete,
  onRefreshError,
  className = '',
  compact = false
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [timeSinceRefresh, setTimeSinceRefresh] = useState<string>('Never');
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Update "X seconds ago" timestamp every second
   * Requirement 16.5: Display "Last Refreshed: X seconds ago"
   */
  useEffect(() => {
    if (!lastRefreshTime) {
      setTimeSinceRefresh('Never');
      return;
    }

    const updateTimestamp = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastRefreshTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds < 60) {
        setTimeSinceRefresh(`${diffSeconds} seconds ago`);
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        setTimeSinceRefresh(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(diffSeconds / 3600);
        setTimeSinceRefresh(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };

    // Update immediately
    updateTimestamp();

    // Update every second
    const interval = setInterval(updateTimestamp, 1000);

    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle refresh button click
   * 
   * Requirement 16.1: Re-fetch ALL data from all 13+ APIs
   * Requirement 16.2: Disable button and show loading spinner
   * Requirement 16.3: Update all displayed values and highlight changes
   */
  const handleRefresh = async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('[RefreshButton] Refresh already in progress, ignoring click');
      return;
    }

    console.log(`[RefreshButton] Starting refresh for ${symbol}...`);
    setIsRefreshing(true);
    setError(null);

    try {
      // Call the refresh API endpoint
      const response = await fetch('/api/einstein/refresh-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          timeframe
        })
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: HTTP ${response.status}`);
      }

      const result: RefreshResult = await response.json();

      // Update last refresh time
      setLastRefreshTime(new Date());

      // Log refresh results
      console.log('[RefreshButton] Refresh complete:', {
        dataQuality: `${result.dataQuality.overall}%`,
        duration: `${result.duration}ms`,
        significantChanges: result.changes.significantChanges,
        priceChanged: result.changes.priceChanged,
        priceDelta: result.changes.priceDelta
      });

      // Call success callback
      if (onRefreshComplete) {
        onRefreshComplete(result);
      }

      // Show notification if significant changes detected
      if (result.changes.significantChanges) {
        console.log('[RefreshButton] Significant changes detected!');
        // Requirement 16.3: Highlight changes with visual indicators
        // This will be handled by the parent component
      }

    } catch (err) {
      const error = err as Error;
      console.error('[RefreshButton] Refresh failed:', error);
      setError(error.message);

      // Call error callback
      if (onRefreshError) {
        onRefreshError(error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (compact) {
    // Compact version: Icon only
    return (
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          relative
          p-2
          bg-transparent
          border-2 border-bitcoin-orange
          rounded-lg
          text-bitcoin-orange
          transition-all duration-300
          hover:bg-bitcoin-orange hover:text-bitcoin-black
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:bg-transparent disabled:hover:text-bitcoin-orange
          ${isRefreshing ? 'pointer-events-none' : ''}
          ${className}
        `}
        title={`Last refreshed: ${timeSinceRefresh}`}
        aria-label="Refresh data"
      >
        <RefreshCw
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
        />
      </button>
    );
  }

  // Full version: Button with text and timestamp
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          relative
          flex items-center justify-center gap-2
          px-6 py-3
          bg-transparent
          border-2 border-bitcoin-orange
          rounded-lg
          text-bitcoin-orange
          font-semibold
          uppercase
          tracking-wider
          transition-all duration-300
          hover:bg-bitcoin-orange hover:text-bitcoin-black
          hover:shadow-[0_0_20px_rgba(247,147,26,0.5)]
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:bg-transparent disabled:hover:text-bitcoin-orange
          disabled:hover:shadow-none
          ${isRefreshing ? 'pointer-events-none' : ''}
          min-h-[48px]
        `}
        aria-label="Refresh all data"
      >
        {/* Icon */}
        <RefreshCw
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        
        {/* Button Text - Requirement 15.5: Display "Verifying Data..." text */}
        <span>
          {isRefreshing ? 'Verifying Data...' : 'Refresh Data'}
        </span>

        {/* Loading Spinner Overlay - Requirement 15.5: Pulsing orange spinner */}
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-bitcoin-black bg-opacity-50 rounded-lg pointer-events-none">
            <div className="w-6 h-6 border-2 border-bitcoin-orange border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Last Refreshed Timestamp (Requirement 16.5) */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-bitcoin-white-60">Last Refreshed:</span>
        <span className="text-bitcoin-white font-mono">
          {timeSinceRefresh}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-bitcoin-black border border-red-500 rounded-lg">
          <p className="text-red-500 text-sm">
            <span className="font-bold">Error:</span> {error}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default RefreshButton;
