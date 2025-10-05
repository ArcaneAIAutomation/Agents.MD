import { useState, useEffect, useCallback } from 'react';

interface UseCaesarDataOptions {
  symbol: string;
  refreshInterval?: number;
  enabled?: boolean;
}

interface CaesarDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching market data from Caesar API
 */
export function useCaesarMarketData(options: UseCaesarDataOptions): CaesarDataState<any> {
  const { symbol, refreshInterval = 30000, enabled = true } = options;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/caesar-market-data?symbol=${symbol}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch market data');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Caesar market data fetch error:', err);
      setError(err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [symbol, enabled]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching trade signals from Caesar API
 */
export function useCaesarTradeSignals(options: UseCaesarDataOptions): CaesarDataState<any[]> {
  const { symbol, refreshInterval = 60000, enabled = true } = options;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/caesar-trade-signals?symbol=${symbol}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trade signals');
      }

      setData(result.signals || []);
    } catch (err: any) {
      console.error('Caesar trade signals fetch error:', err);
      setError(err.message || 'Failed to fetch trade signals');
    } finally {
      setLoading(false);
    }
  }, [symbol, enabled]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching news from Caesar API
 */
export function useCaesarNews(
  symbols: string[] = ['BTC', 'ETH'],
  limit: number = 15,
  refreshInterval: number = 300000
): CaesarDataState<any[]> {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/caesar-news?symbols=${symbols.join(',')}&limit=${limit}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch news');
      }

      setData(result.news || []);
    } catch (err: any) {
      console.error('Caesar news fetch error:', err);
      setError(err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [symbols, limit]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for Caesar API health monitoring
 */
export function useCaesarHealth(checkInterval: number = 60000) {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/caesar-health');
        const result = await response.json();
        setHealth(result.health);
      } catch (err) {
        console.error('Caesar health check error:', err);
        setHealth({ status: 'down', latency: 0, timestamp: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();

    if (checkInterval > 0) {
      const interval = setInterval(checkHealth, checkInterval);
      return () => clearInterval(interval);
    }
  }, [checkInterval]);

  return { health, loading };
}
