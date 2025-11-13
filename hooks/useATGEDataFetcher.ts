/**
 * ATGE Data Fetcher Hook
 * 
 * Automatically fetches historical data for active trades when user accesses ATGE page.
 * Prioritizes trades closest to expiration.
 * 
 * Requirements: 6.1, 6.14-6.19
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveTrade {
  id: string;
  symbol: string;
  timeframe: string;
  expiresAt: string;
  status: string;
}

interface FetchProgress {
  total: number;
  completed: number;
  current: string | null;
  errors: string[];
}

interface UseATGEDataFetcherResult {
  isLoading: boolean;
  progress: FetchProgress;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to automatically fetch historical data for active trades
 * Triggers when user accesses ATGE page
 */
export function useATGEDataFetcher(enabled: boolean = true): UseATGEDataFetcherResult {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<FetchProgress>({
    total: 0,
    completed: 0,
    current: null,
    errors: []
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch active trades that need historical data
   */
  const fetchActiveTrades = useCallback(async (): Promise<ActiveTrade[]> => {
    try {
      const response = await fetch('/api/atge/trades?status=active&needsData=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch active trades: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch active trades');
      }

      return data.trades || [];
    } catch (err) {
      console.error('[useATGEDataFetcher] Error fetching active trades:', err);
      throw err;
    }
  }, []);

  /**
   * Trigger historical data fetch for a specific trade
   */
  const fetchHistoricalDataForTrade = useCallback(async (tradeId: string): Promise<void> => {
    try {
      const response = await fetch('/api/atge/historical-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tradeSignalId: tradeId })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch historical data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch historical data');
      }

      console.log(`[useATGEDataFetcher] Historical data fetched for trade ${tradeId}`);
    } catch (err) {
      console.error(`[useATGEDataFetcher] Error fetching historical data for trade ${tradeId}:`, err);
      throw err;
    }
  }, []);

  /**
   * Sort trades by expiration (closest first)
   */
  const sortTradesByExpiration = useCallback((trades: ActiveTrade[]): ActiveTrade[] => {
    return [...trades].sort((a, b) => {
      const dateA = new Date(a.expiresAt).getTime();
      const dateB = new Date(b.expiresAt).getTime();
      return dateA - dateB; // Ascending order (closest to expiration first)
    });
  }, []);

  /**
   * Main fetch function
   */
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    setProgress({
      total: 0,
      completed: 0,
      current: null,
      errors: []
    });

    try {
      console.log('[useATGEDataFetcher] Starting data fetch...');

      // Step 1: Fetch active trades
      const activeTrades = await fetchActiveTrades();

      if (activeTrades.length === 0) {
        console.log('[useATGEDataFetcher] No active trades need historical data');
        setIsLoading(false);
        return;
      }

      // Step 2: Sort by expiration (prioritize trades closest to expiration)
      const sortedTrades = sortTradesByExpiration(activeTrades);

      console.log(`[useATGEDataFetcher] Found ${sortedTrades.length} active trades, fetching historical data...`);

      setProgress(prev => ({
        ...prev,
        total: sortedTrades.length
      }));

      // Step 3: Fetch historical data for each trade
      const errors: string[] = [];

      for (let i = 0; i < sortedTrades.length; i++) {
        const trade = sortedTrades[i];

        setProgress(prev => ({
          ...prev,
          current: trade.id,
          completed: i
        }));

        try {
          await fetchHistoricalDataForTrade(trade.id);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Trade ${trade.id}: ${errorMsg}`);
          console.error(`[useATGEDataFetcher] Failed to fetch data for trade ${trade.id}:`, err);
        }

        // Add small delay between requests to avoid overwhelming the API
        if (i < sortedTrades.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setProgress(prev => ({
        ...prev,
        completed: sortedTrades.length,
        current: null,
        errors
      }));

      console.log(`[useATGEDataFetcher] Data fetch completed: ${sortedTrades.length - errors.length}/${sortedTrades.length} successful`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('[useATGEDataFetcher] Error during data fetch:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchActiveTrades, fetchHistoricalDataForTrade, sortTradesByExpiration]);

  /**
   * Trigger fetch on mount (when enabled)
   */
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled]); // Only run on mount or when enabled changes

  return {
    isLoading,
    progress,
    error,
    refetch: fetchData
  };
}

// ============================================================================
// HELPER HOOK FOR UI DISPLAY
// ============================================================================

/**
 * Hook to format progress for UI display
 */
export function useATGEDataFetcherUI(fetcher: UseATGEDataFetcherResult) {
  const { isLoading, progress, error } = fetcher;

  const progressPercentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const statusMessage = (() => {
    if (error) return `Error: ${error}`;
    if (!isLoading && progress.completed === 0) return 'Ready';
    if (!isLoading && progress.completed > 0) {
      const successCount = progress.completed - progress.errors.length;
      return `Completed: ${successCount}/${progress.total} trades`;
    }
    if (progress.current) return `Fetching data for trade ${progress.current}...`;
    return 'Initializing...';
  })();

  const hasErrors = progress.errors.length > 0;

  return {
    isLoading,
    progressPercentage,
    statusMessage,
    hasErrors,
    errorCount: progress.errors.length,
    errors: progress.errors,
    completedCount: progress.completed,
    totalCount: progress.total
  };
}
