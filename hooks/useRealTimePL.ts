/**
 * Einstein 100000x Trade Generation Engine - Real-Time P/L Hook
 * 
 * React hook for managing real-time P/L updates in the frontend.
 * 
 * Requirements: 14.3, 17.2
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * P/L Update Result
 */
interface PLUpdateResult {
  tradeId: string;
  symbol: string;
  currentPrice: number;
  pl: {
    profitLoss: number;
    profitLossPercent: number;
    isProfit: boolean;
    color: 'green' | 'red';
    icon: 'up' | 'down';
  };
  significantChange: boolean;
  previousPL?: number;
  changePercent?: number;
}

/**
 * Hook Configuration
 */
interface UseRealTimePLConfig {
  autoStart?: boolean; // Auto-start updates on mount (default: true)
  updateInterval?: number; // Update interval in milliseconds (default: 30000)
  significantChangeThreshold?: number; // Threshold for highlighting changes (default: 5%)
}

/**
 * Hook Return Type
 */
interface UseRealTimePLReturn {
  trades: PLUpdateResult[];
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  refresh: () => Promise<void>;
  getTradeById: (tradeId: string) => PLUpdateResult | undefined;
  getSignificantChanges: () => PLUpdateResult[];
}

/**
 * useRealTimePL Hook
 * 
 * Manages real-time P/L updates for executed trades.
 * 
 * @param config - Hook configuration
 * @returns Real-time P/L state and control functions
 * 
 * @example
 * ```tsx
 * const { trades, isRunning, start, stop, refresh } = useRealTimePL({
 *   autoStart: true,
 *   updateInterval: 30000
 * });
 * 
 * // Display trades with P/L
 * {trades.map(trade => (
 *   <div key={trade.tradeId} className={trade.significantChange ? 'highlight' : ''}>
 *     {trade.symbol}: ${trade.pl.profitLoss.toFixed(2)} ({trade.pl.profitLossPercent.toFixed(2)}%)
 *   </div>
 * ))}
 * ```
 */
export function useRealTimePL(config: UseRealTimePLConfig = {}): UseRealTimePLReturn {
  const {
    autoStart = true,
    updateInterval = 30000,
    significantChangeThreshold = 5
  } = config;

  // State
  const [trades, setTrades] = useState<PLUpdateResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * Fetch current P/L data
   */
  const fetchPLData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/einstein/realtime-pl');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch P/L data');
      }

      if (mountedRef.current) {
        setTrades(data.data.trades || []);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('❌ Failed to fetch P/L data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch P/L data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Start real-time updates
   */
  const start = useCallback(async () => {
    try {
      setError(null);

      // Start backend updater
      const response = await fetch('/api/einstein/realtime-pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          config: {
            updateInterval,
            significantChangeThreshold
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start updates');
      }

      if (mountedRef.current) {
        setIsRunning(true);

        // Start frontend polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        // Initial fetch
        await fetchPLData();

        // Set up interval
        intervalRef.current = setInterval(() => {
          fetchPLData();
        }, updateInterval);
      }
    } catch (err) {
      console.error('❌ Failed to start updates:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to start updates');
      }
    }
  }, [updateInterval, significantChangeThreshold, fetchPLData]);

  /**
   * Stop real-time updates
   */
  const stop = useCallback(async () => {
    try {
      setError(null);

      // Stop backend updater
      const response = await fetch('/api/einstein/realtime-pl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop updates');
      }

      if (mountedRef.current) {
        setIsRunning(false);

        // Stop frontend polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('❌ Failed to stop updates:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to stop updates');
      }
    }
  }, []);

  /**
   * Trigger manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchPLData();
  }, [fetchPLData]);

  /**
   * Get trade by ID
   */
  const getTradeById = useCallback((tradeId: string): PLUpdateResult | undefined => {
    return trades.find(trade => trade.tradeId === tradeId);
  }, [trades]);

  /**
   * Get trades with significant changes
   */
  const getSignificantChanges = useCallback((): PLUpdateResult[] => {
    return trades.filter(trade => trade.significantChange);
  }, [trades]);

  /**
   * Auto-start on mount
   */
  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, start]);

  return {
    trades,
    isRunning,
    isLoading,
    error,
    lastUpdate,
    start,
    stop,
    refresh,
    getTradeById,
    getSignificantChanges
  };
}
