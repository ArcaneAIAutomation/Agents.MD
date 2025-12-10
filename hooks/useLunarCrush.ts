/**
 * React hooks for LunarCrush data
 */

import { useState, useEffect, useCallback } from "react";
import type {
  SentimentData,
  SocialPostsResponse,
  TradingSignal,
  ViralContent,
} from "../lib/lunarcrush/types";

/**
 * Hook for fetching sentiment data
 */
export function useLunarCrushSentiment(symbol: string) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lunarcrush/sentiment/${symbol}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch sentiment data");
      }

      const sentimentData = await response.json();
      setData(sentimentData);
    } catch (err) {
      console.error("Error fetching sentiment:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching social posts
 */
export function useLunarCrushPosts(
  symbol: string,
  limit: number = 50,
  filter?: string
) {
  const [data, setData] = useState<SocialPostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (filter && filter !== "all") {
        params.append("filter", filter);
      }

      const response = await fetch(`/api/lunarcrush/posts/${symbol}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch posts");
      }

      const postsData = await response.json();
      setData(postsData);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbol, limit, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching viral content
 */
export function useLunarCrushViral(
  symbol: string,
  threshold: number = 10000000
) {
  const [data, setData] = useState<ViralContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/lunarcrush/viral/${symbol}?threshold=${threshold}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch viral content");
      }

      const viralData = await response.json();
      setData(viralData);
    } catch (err) {
      console.error("Error fetching viral content:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbol, threshold]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching trading signals
 */
export function useLunarCrushSignals(symbol: string) {
  const [data, setData] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lunarcrush/signals/${symbol}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trading signals");
      }

      const signalData = await response.json();
      setData(signalData);
    } catch (err) {
      console.error("Error fetching signals:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
