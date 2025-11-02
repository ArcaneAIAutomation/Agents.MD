import { useState, useEffect, useCallback } from 'react';

interface WatchlistItem {
  symbol: string;
  added_at: string;
  notes?: string;
}

interface UseWatchlistReturn {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  isInWatchlist: (symbol: string) => boolean;
  addToWatchlist: (symbol: string, notes?: string) => Promise<boolean>;
  removeFromWatchlist: (symbol: string) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;
}

/**
 * Hook for managing user's cryptocurrency watchlist
 */
export function useWatchlist(): UseWatchlistReturn {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch watchlist from API
   */
  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ucie/watchlist');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch watchlist');
      }

      setWatchlist(data.watchlist || []);
    } catch (err: any) {
      console.error('Fetch watchlist error:', err);
      setError(err.message || 'Failed to fetch watchlist');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if symbol is in watchlist
   */
  const isInWatchlist = useCallback((symbol: string): boolean => {
    return watchlist.some(item => item.symbol.toUpperCase() === symbol.toUpperCase());
  }, [watchlist]);

  /**
   * Add token to watchlist
   */
  const addToWatchlist = useCallback(async (symbol: string, notes?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/ucie/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, notes }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add to watchlist');
      }

      // Refresh watchlist
      await fetchWatchlist();
      return true;
    } catch (err: any) {
      console.error('Add to watchlist error:', err);
      setError(err.message || 'Failed to add to watchlist');
      return false;
    }
  }, [fetchWatchlist]);

  /**
   * Remove token from watchlist
   */
  const removeFromWatchlist = useCallback(async (symbol: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/ucie/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove from watchlist');
      }

      // Refresh watchlist
      await fetchWatchlist();
      return true;
    } catch (err: any) {
      console.error('Remove from watchlist error:', err);
      setError(err.message || 'Failed to remove from watchlist');
      return false;
    }
  }, [fetchWatchlist]);

  /**
   * Refresh watchlist
   */
  const refreshWatchlist = useCallback(async () => {
    await fetchWatchlist();
  }, [fetchWatchlist]);

  // Fetch watchlist on mount
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return {
    watchlist,
    loading,
    error,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    refreshWatchlist,
  };
}
