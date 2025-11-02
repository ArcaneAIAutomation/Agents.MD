import { useState, useEffect, useCallback, useRef } from 'react';

interface RealTimeConfig {
  symbol: string;
  enabled: boolean;
  updateInterval?: number; // milliseconds
  onPriceChange?: (data: any) => void;
  onSignificantEvent?: (event: SignificantEvent) => void;
}

interface SignificantEvent {
  type: 'price_change' | 'whale_transaction' | 'news' | 'sentiment_shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: string;
}

interface RealTimeData {
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: Date;
}

interface UseRealTimeUpdatesReturn {
  data: RealTimeData | null;
  events: SignificantEvent[];
  isConnected: boolean;
  error: string | null;
  clearEvents: () => void;
  dismissEvent: (index: number) => void;
}

/**
 * Hook for managing real-time updates
 * 
 * Features:
 * - Polls for price updates every 5 seconds
 * - Detects significant events (price changes, whale txs, news)
 * - Maintains event feed
 * - Automatic reconnection on errors
 */
export function useRealTimeUpdates(config: RealTimeConfig): UseRealTimeUpdatesReturn {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [events, setEvents] = useState<SignificantEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const previousPriceRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateInterval = config.updateInterval || 5000; // Default 5 seconds

  /**
   * Fetch latest market data
   */
  const fetchUpdate = useCallback(async () => {
    if (!config.enabled || !config.symbol) return;

    try {
      const response = await fetch(`/api/ucie/market-data/${encodeURIComponent(config.symbol)}`);
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Update failed');
      }

      const marketData = result.marketData;
      const currentPrice = marketData.prices?.vwap || 0;

      // Update data
      const newData: RealTimeData = {
        price: currentPrice,
        change24h: marketData.change24h || 0,
        volume24h: marketData.volume24h || 0,
        lastUpdate: new Date(),
      };

      setData(newData);
      setIsConnected(true);
      setError(null);

      // Call price change callback
      if (config.onPriceChange) {
        config.onPriceChange(newData);
      }

      // Detect significant price changes
      if (previousPriceRef.current !== null) {
        const priceChange = ((currentPrice - previousPriceRef.current) / previousPriceRef.current) * 100;
        
        if (Math.abs(priceChange) >= 5) {
          // Significant price change (>= 5%)
          const event: SignificantEvent = {
            type: 'price_change',
            severity: Math.abs(priceChange) >= 10 ? 'critical' : 'high',
            message: `Price ${priceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)}%`,
            data: { previousPrice: previousPriceRef.current, currentPrice, priceChange },
            timestamp: new Date().toISOString(),
          };

          addEvent(event);
        }
      }

      previousPriceRef.current = currentPrice;
    } catch (err: any) {
      console.error('Real-time update error:', err);
      setError(err.message || 'Update failed');
      setIsConnected(false);

      // Attempt reconnection after 10 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        setError(null);
        fetchUpdate();
      }, 10000);
    }
  }, [config.symbol, config.enabled, config.onPriceChange]);

  /**
   * Add event to feed
   */
  const addEvent = useCallback((event: SignificantEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events

    // Call event callback
    if (config.onSignificantEvent) {
      config.onSignificantEvent(event);
    }
  }, [config.onSignificantEvent]);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * Dismiss specific event
   */
  const dismissEvent = useCallback((index: number) => {
    setEvents(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Start polling
   */
  useEffect(() => {
    if (!config.enabled || !config.symbol) {
      // Clean up if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Initial fetch
    fetchUpdate();

    // Set up polling interval
    intervalRef.current = setInterval(fetchUpdate, updateInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [config.enabled, config.symbol, updateInterval, fetchUpdate]);

  return {
    data,
    events,
    isConnected,
    error,
    clearEvents,
    dismissEvent,
  };
}

/**
 * Hook for checking whale transactions
 */
export function useWhaleWatch(symbol: string, enabled: boolean, threshold: number = 50) {
  const [whaleTransactions, setWhaleTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) return;

    const checkWhaleTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/whale-watch/detect?threshold=${threshold}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch whale transactions');
        }

        const data = await response.json();
        
        if (data.success && data.whales) {
          // Filter for the specific symbol if needed
          const relevantWhales = data.whales.filter((w: any) => 
            w.symbol?.toUpperCase() === symbol.toUpperCase()
          );
          
          setWhaleTransactions(relevantWhales);
        }
      } catch (err: any) {
        console.error('Whale watch error:', err);
        setError(err.message || 'Failed to check whale transactions');
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkWhaleTransactions();

    // Check every 30 seconds
    const interval = setInterval(checkWhaleTransactions, 30000);

    return () => clearInterval(interval);
  }, [symbol, enabled, threshold]);

  return { whaleTransactions, loading, error };
}

/**
 * Hook for checking breaking news
 */
export function useBreakingNews(symbol: string, enabled: boolean) {
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCheckRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!enabled || !symbol) return;

    const checkBreakingNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/ucie/news/${encodeURIComponent(symbol)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await response.json();
        
        if (data.success && data.news?.articles) {
          // Filter for breaking news (< 2 hours old)
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const breaking = data.news.articles.filter((article: any) => {
            const publishedAt = new Date(article.publishedAt);
            return publishedAt > twoHoursAgo && publishedAt > lastCheckRef.current;
          });
          
          if (breaking.length > 0) {
            setBreakingNews(breaking);
            lastCheckRef.current = new Date();
          }
        }
      } catch (err: any) {
        console.error('Breaking news error:', err);
        setError(err.message || 'Failed to check breaking news');
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkBreakingNews();

    // Check every 60 seconds
    const interval = setInterval(checkBreakingNews, 60000);

    return () => clearInterval(interval);
  }, [symbol, enabled]);

  return { breakingNews, loading, error };
}
