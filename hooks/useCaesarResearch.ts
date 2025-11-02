/**
 * useCaesarResearch Hook
 * React hook for fetching Caesar AI research data
 * 
 * Features:
 * - Automatic data fetching
 * - Loading and error states
 * - Caching support
 * - Retry functionality
 */

import { useState, useEffect } from 'react';
import { UCIECaesarResearch } from '../lib/ucie/caesarClient';

interface UseCaesarResearchResult {
  research: UCIECaesarResearch | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
  refetch: () => Promise<void>;
}

interface CaesarResearchResponse {
  success: boolean;
  data?: UCIECaesarResearch;
  cached?: boolean;
  error?: string;
  fallbackData?: UCIECaesarResearch;
}

/**
 * Hook for fetching Caesar AI research
 * 
 * @param symbol - Token symbol (e.g., "BTC", "ETH")
 * @param enabled - Whether to fetch automatically (default: true)
 * @returns Research data, loading state, error, and refetch function
 */
export function useCaesarResearch(
  symbol: string | null,
  enabled: boolean = true
): UseCaesarResearchResult {
  const [research, setResearch] = useState<UCIECaesarResearch | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean>(false);

  const fetchResearch = async () => {
    if (!symbol) {
      setError('No symbol provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching Caesar research for ${symbol}`);
      
      const response = await fetch(`/api/ucie/research/${symbol}`);
      const data: CaesarResearchResponse = await response.json();

      if (data.success && data.data) {
        setResearch(data.data);
        setCached(data.cached || false);
        setError(null);
        console.log(`✅ Caesar research loaded for ${symbol} (cached: ${data.cached})`);
      } else {
        // Use fallback data if available
        if (data.fallbackData) {
          setResearch(data.fallbackData);
          setCached(false);
        }
        setError(data.error || 'Failed to fetch research');
        console.error(`❌ Caesar research failed for ${symbol}:`, data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setResearch(null);
      console.error(`❌ Caesar research request failed for ${symbol}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when symbol changes
  useEffect(() => {
    if (enabled && symbol) {
      fetchResearch();
    }
  }, [symbol, enabled]);

  return {
    research,
    loading,
    error,
    cached,
    refetch: fetchResearch
  };
}

export default useCaesarResearch;
