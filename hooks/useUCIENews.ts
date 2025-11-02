/**
 * React Hook for UCIE News Intelligence
 * 
 * Provides easy access to news data with automatic caching and error handling
 */

import { useState, useEffect } from 'react';
import { AssessedNewsArticle } from '../lib/ucie/newsImpactAssessment';

interface NewsData {
  articles: AssessedNewsArticle[];
  summary: {
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    averageImpact: number;
    majorNews: AssessedNewsArticle[];
  };
  dataQuality: number;
  timestamp: string;
}

interface UseUCIENewsResult {
  data: NewsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and manage UCIE news data
 */
export function useUCIENews(symbol: string): UseUCIENewsResult {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!symbol) {
      setError('Symbol is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ucie/news/${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch news');
      }

      setData({
        articles: result.articles,
        summary: result.summary,
        dataQuality: result.dataQuality,
        timestamp: result.timestamp
      });
    } catch (err) {
      console.error('Error fetching UCIE news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  return {
    data,
    loading,
    error,
    refetch: fetchNews
  };
}
