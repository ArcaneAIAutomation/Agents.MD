/**
 * Market Data Fetcher for ATGE
 * 
 * Fetches current market data from CoinMarketCap API with CoinGecko fallback
 * Implements 60-second caching to reduce API calls
 * 
 * Requirements: 1.2, 1.3
 */

interface MarketData {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
  source: 'CoinMarketCap' | 'CoinGecko';
}

interface CacheEntry {
  data: MarketData;
  expiresAt: number;
}

// In-memory cache with 60-second TTL
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Fetch market data from CoinMarketCap API
 */
async function fetchFromCoinMarketCap(symbol: string): Promise<MarketData> {
  const apiKey = process.env.COINMARKETCAP_API_KEY;
  
  if (!apiKey) {
    throw new Error('CoinMarketCap API key not configured');
  }

  // Map symbol to CoinMarketCap symbol (BTC -> bitcoin, ETH -> ethereum)
  const cmcSymbol = symbol.toUpperCase() === 'BTC' ? 'BTC' : 'ETH';
  
  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${cmcSymbol}`;
  
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Extract data from response
  const coinData = data.data[cmcSymbol][0];
  const quote = coinData.quote.USD;

  return {
    symbol: symbol.toUpperCase(),
    currentPrice: quote.price,
    priceChange24h: quote.price * (quote.percent_change_24h / 100),
    priceChangePercentage24h: quote.percent_change_24h,
    volume24h: quote.volume_24h,
    marketCap: quote.market_cap,
    high24h: quote.price * (1 + Math.abs(quote.percent_change_24h) / 100), // Estimate
    low24h: quote.price * (1 - Math.abs(quote.percent_change_24h) / 100), // Estimate
    timestamp: new Date(),
    source: 'CoinMarketCap'
  };
}

/**
 * Fetch market data from CoinGecko API (fallback)
 */
async function fetchFromCoinGecko(symbol: string): Promise<MarketData> {
  // Map symbol to CoinGecko ID
  const coinId = symbol.toUpperCase() === 'BTC' ? 'bitcoin' : 'ethereum';
  
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const marketData = data.market_data;

  return {
    symbol: symbol.toUpperCase(),
    currentPrice: marketData.current_price.usd,
    priceChange24h: marketData.price_change_24h,
    priceChangePercentage24h: marketData.price_change_percentage_24h,
    volume24h: marketData.total_volume.usd,
    marketCap: marketData.market_cap.usd,
    high24h: marketData.high_24h.usd,
    low24h: marketData.low_24h.usd,
    timestamp: new Date(),
    source: 'CoinGecko'
  };
}

/**
 * Get market data with caching and fallback
 * 
 * @param symbol - Cryptocurrency symbol (BTC or ETH)
 * @param forceRefresh - If true, bypass cache and fetch fresh data (default: false)
 * @returns Market data with 60-second cache (or fresh if forceRefresh=true)
 */
export async function getMarketData(symbol: string, forceRefresh: boolean = false): Promise<MarketData> {
  const cacheKey = symbol.toUpperCase();
  
  // Check cache first (unless force refresh for trade generation)
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`[ATGE] Using cached market data for ${symbol}`);
      return cached.data;
    }
  } else {
    console.log(`[ATGE] Force refreshing market data for ${symbol} (trade generation)`);
  }

  console.log(`[ATGE] Fetching fresh market data for ${symbol}`);

  try {
    // Try CoinMarketCap first
    const data = await fetchFromCoinMarketCap(symbol);
    
    // Cache the result
    cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_TTL
    });
    
    return data;
  } catch (error) {
    console.error(`[ATGE] CoinMarketCap failed, trying CoinGecko:`, error);
    
    try {
      // Fallback to CoinGecko
      const data = await fetchFromCoinGecko(symbol);
      
      // Cache the result
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL
      });
      
      return data;
    } catch (fallbackError) {
      console.error(`[ATGE] CoinGecko also failed:`, fallbackError);
      throw new Error(`Failed to fetch market data for ${symbol}: Both CoinMarketCap and CoinGecko failed`);
    }
  }
}

/**
 * Clear cache (useful for testing)
 */
export function clearMarketDataCache(): void {
  cache.clear();
}

export type { MarketData };
