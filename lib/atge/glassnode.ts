/**
 * Glassnode API Integration for ATGE
 * 
 * Provides Bitcoin on-chain metrics:
 * - SOPR (Spent Output Profit Ratio)
 * - MVRV Z-Score (Market Value to Realized Value Z-Score)
 * 
 * Features:
 * - 1-hour caching to reduce API calls
 * - Graceful error handling (continues without metrics if API fails)
 * - Bitcoin-only metrics (returns null for other symbols)
 */

interface GlassnodeConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

interface SOPRResponse {
  t: number; // Unix timestamp
  v: number; // SOPR value
}

interface MVRVResponse {
  t: number; // Unix timestamp
  v: number; // MVRV Z-Score value
}

interface CachedMetric {
  value: number;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for Glassnode metrics (1 hour TTL)
const metricsCache = new Map<string, CachedMetric>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get Glassnode configuration from environment
 */
function getGlassnodeConfig(): GlassnodeConfig {
  const apiKey = process.env.GLASSNODE_API_KEY;
  
  if (!apiKey) {
    throw new Error('GLASSNODE_API_KEY not configured');
  }
  
  return {
    apiKey,
    baseUrl: 'https://api.glassnode.com/v1/metrics',
    timeout: 10000 // 10 seconds
  };
}

/**
 * Fetch data from Glassnode API with timeout
 */
async function fetchGlassnodeMetric(
  endpoint: string,
  config: GlassnodeConfig
): Promise<any> {
  const url = `${config.baseUrl}${endpoint}?a=BTC&api_key=${config.apiKey}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Glassnode API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Glassnode API request timeout');
      }
      throw error;
    }
    
    throw new Error('Unknown error fetching Glassnode metric');
  }
}

/**
 * Get cached metric or fetch from API
 */
async function getCachedOrFetch(
  cacheKey: string,
  fetcher: () => Promise<number>
): Promise<number | null> {
  // Check cache first
  const cached = metricsCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expiresAt) {
    console.log(`✅ Using cached ${cacheKey}: ${cached.value}`);
    return cached.value;
  }
  
  // Fetch fresh data
  try {
    const value = await fetcher();
    
    // Store in cache
    metricsCache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS
    });
    
    console.log(`✅ Fetched and cached ${cacheKey}: ${value}`);
    return value;
  } catch (error) {
    console.error(`❌ Failed to fetch ${cacheKey}:`, error);
    
    // Return stale cache if available (better than nothing)
    if (cached) {
      console.log(`⚠️ Using stale cache for ${cacheKey}: ${cached.value}`);
      return cached.value;
    }
    
    return null;
  }
}

/**
 * Fetch SOPR (Spent Output Profit Ratio) from Glassnode
 * 
 * SOPR measures the profit ratio of spent outputs.
 * - SOPR > 1: Coins are being spent at a profit (bullish)
 * - SOPR < 1: Coins are being spent at a loss (bearish)
 * - SOPR = 1: Break-even
 * 
 * @param symbol - Cryptocurrency symbol (only BTC supported)
 * @returns SOPR value or null if unavailable
 */
export async function fetchSOPR(symbol: string): Promise<number | null> {
  // Only Bitcoin is supported
  if (symbol.toUpperCase() !== 'BTC') {
    console.log(`ℹ️ SOPR not available for ${symbol} (Bitcoin only)`);
    return null;
  }
  
  // Check if API key is configured
  if (!process.env.GLASSNODE_API_KEY) {
    console.log('⚠️ GLASSNODE_API_KEY not configured, skipping SOPR');
    return null;
  }
  
  const cacheKey = 'sopr_btc';
  
  return getCachedOrFetch(cacheKey, async () => {
    const config = getGlassnodeConfig();
    const data = await fetchGlassnodeMetric('/indicators/sopr', config);
    
    // Get the most recent value
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[data.length - 1] as SOPRResponse;
      return latest.v;
    }
    
    throw new Error('No SOPR data available');
  });
}

/**
 * Fetch MVRV Z-Score from Glassnode
 * 
 * MVRV Z-Score measures how far the market value deviates from realized value.
 * - MVRV > 7: Overvalued (potential market top)
 * - MVRV 0-7: Fair value range
 * - MVRV < 0: Undervalued (potential market bottom)
 * 
 * @param symbol - Cryptocurrency symbol (only BTC supported)
 * @returns MVRV Z-Score or null if unavailable
 */
export async function fetchMVRVZScore(symbol: string): Promise<number | null> {
  // Only Bitcoin is supported
  if (symbol.toUpperCase() !== 'BTC') {
    console.log(`ℹ️ MVRV Z-Score not available for ${symbol} (Bitcoin only)`);
    return null;
  }
  
  // Check if API key is configured
  if (!process.env.GLASSNODE_API_KEY) {
    console.log('⚠️ GLASSNODE_API_KEY not configured, skipping MVRV Z-Score');
    return null;
  }
  
  const cacheKey = 'mvrv_zscore_btc';
  
  return getCachedOrFetch(cacheKey, async () => {
    const config = getGlassnodeConfig();
    const data = await fetchGlassnodeMetric('/market/mvrv_z_score', config);
    
    // Get the most recent value
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[data.length - 1] as MVRVResponse;
      return latest.v;
    }
    
    throw new Error('No MVRV Z-Score data available');
  });
}

/**
 * Fetch both SOPR and MVRV Z-Score in parallel
 * 
 * @param symbol - Cryptocurrency symbol (only BTC supported)
 * @returns Object with both metrics or null values if unavailable
 */
export async function fetchBitcoinOnChainMetrics(symbol: string): Promise<{
  sopr: number | null;
  mvrvZScore: number | null;
}> {
  // Only Bitcoin is supported
  if (symbol.toUpperCase() !== 'BTC') {
    return {
      sopr: null,
      mvrvZScore: null
    };
  }
  
  // Fetch both metrics in parallel
  const [sopr, mvrvZScore] = await Promise.all([
    fetchSOPR(symbol),
    fetchMVRVZScore(symbol)
  ]);
  
  return {
    sopr,
    mvrvZScore
  };
}

/**
 * Interpret SOPR value
 */
export function interpretSOPR(sopr: number | null): string {
  if (sopr === null) return 'N/A';
  
  if (sopr > 1) {
    return 'Bullish (profitable spending)';
  } else if (sopr < 1) {
    return 'Bearish (loss-taking)';
  } else {
    return 'Neutral (break-even)';
  }
}

/**
 * Interpret MVRV Z-Score value
 */
export function interpretMVRVZScore(mvrvZScore: number | null): string {
  if (mvrvZScore === null) return 'N/A';
  
  if (mvrvZScore > 7) {
    return 'Overvalued (potential top)';
  } else if (mvrvZScore < 0) {
    return 'Undervalued (potential bottom)';
  } else {
    return 'Fair value';
  }
}

/**
 * Clear the metrics cache (useful for testing)
 */
export function clearMetricsCache(): void {
  metricsCache.clear();
  console.log('✅ Glassnode metrics cache cleared');
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; expiresIn: number }>;
} {
  const now = Date.now();
  const entries = Array.from(metricsCache.entries()).map(([key, value]) => ({
    key,
    expiresIn: Math.max(0, value.expiresAt - now)
  }));
  
  return {
    size: metricsCache.size,
    entries
  };
}
