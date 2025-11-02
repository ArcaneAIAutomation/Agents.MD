/**
 * React Hook for Social Sentiment Data
 * 
 * Provides easy access to social sentiment analysis for any cryptocurrency token
 * 
 * Usage:
 * ```tsx
 * const { sentiment, influencers, loading, error, refetch } = useSocialSentiment('BTC');
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { AggregatedSentiment } from '../lib/ucie/sentimentAnalysis';
import type { InfluencerMetrics } from '../lib/ucie/influencerTracking';

// ============================================================================
// Type Definitions
// ============================================================================

interface SocialSentimentData {
  sentiment: AggregatedSentiment | null;
  influencers: InfluencerMetrics | null;
  sources: {
    lunarCrush: boolean;
    twitter: boolean;
    reddit: boolean;
  };
  dataQuality: number;
  cached: boolean;
  timestamp: string | null;
}

interface UseSocialSentimentReturn {
  data: SocialSentimentData | null;
  sentiment: AggregatedSentiment | null;
  influencers: InfluencerMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSocialSentiment(symbol: string): UseSocialSentimentReturn {
  const [data, setData] = useState<SocialSentimentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentiment = useCallback(async () => {
    if (!symbol) {
      setError('Symbol is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ucie/sentiment/${symbol}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sentiment data');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sentiment data');
      }

      setData({
        sentiment: result.sentiment,
        influencers: result.influencers,
        sources: result.sources,
        dataQuality: result.dataQuality,
        cached: result.cached,
        timestamp: result.timestamp,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching social sentiment:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Fetch on mount and when symbol changes
  useEffect(() => {
    fetchSentiment();
  }, [fetchSentiment]);

  return {
    data,
    sentiment: data?.sentiment || null,
    influencers: data?.influencers || null,
    loading,
    error,
    refetch: fetchSentiment,
  };
}

// ============================================================================
// Utility Hook for Multiple Symbols
// ============================================================================

/**
 * Hook for fetching sentiment data for multiple symbols
 */
export function useMultipleSocialSentiment(symbols: string[]): {
  data: Record<string, SocialSentimentData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<Record<string, SocialSentimentData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMultipleSentiment = useCallback(async () => {
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled(
        symbols.map(symbol =>
          fetch(`/api/ucie/sentiment/${symbol}`).then(res => res.json())
        )
      );

      const newData: Record<string, SocialSentimentData> = {};

      results.forEach((result, index) => {
        const symbol = symbols[index];
        
        if (result.status === 'fulfilled' && result.value.success) {
          newData[symbol] = {
            sentiment: result.value.sentiment,
            influencers: result.value.influencers,
            sources: result.value.sources,
            dataQuality: result.value.dataQuality,
            cached: result.value.cached,
            timestamp: result.value.timestamp,
          };
        }
      });

      setData(newData);
      setError(null);
    } catch (err) {
      console.error('Error fetching multiple sentiment data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchMultipleSentiment();
  }, [fetchMultipleSentiment]);

  return {
    data,
    loading,
    error,
    refetch: fetchMultipleSentiment,
  };
}
