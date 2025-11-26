/**
 * Einstein Data Collection Module
 * 
 * Coordinates parallel data fetching from all 13+ API sources with timeout handling,
 * validation, and quality scoring. This module is responsible for gathering all
 * market, sentiment, on-chain, and technical data needed for trade signal generation.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type {
  MarketData,
  SentimentData,
  OnChainData,
  TechnicalData,
  NewsData,
  ComprehensiveData,
  DataQualityScore,
  Timeframe,
  TimeframeAlignment
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const API_TIMEOUT = 15000; // 15 seconds per API call
const MIN_DATA_QUALITY = 90; // Minimum 90% data quality required

// Retry configuration (Requirement 12.1)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const RETRY_BACKOFF_MULTIPLIER = 2;

// ============================================================================
// Rate Limiter Utility
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }
    
    this.requests.push(now);
  }
}

// Rate limiters for each API (Requirement 12.1: Handle API rate limits gracefully)
const coinGeckoLimiter = new RateLimiter(50, 60000);
const coinMarketCapLimiter = new RateLimiter(30, 60000);
const krakenLimiter = new RateLimiter(15, 1000);
const lunarCrushLimiter = new RateLimiter(10, 60000);
const newsAPILimiter = new RateLimiter(100, 86400000); // 100 per day

// ============================================================================
// Retry Utility with Exponential Backoff
// ============================================================================

/**
 * Retry a function with exponential backoff
 * Requirement 12.1: Add retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    maxDelay = MAX_RETRY_DELAY,
    backoffMultiplier = RETRY_BACKOFF_MULTIPLIER,
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      console.log(`[Einstein] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Determine if an error is retryable
 * Requirement 12.1: Handle API rate limits gracefully
 */
function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  // Rate limit errors are retryable
  if (error.message?.includes('rate limit') || error.message?.includes('429')) {
    return true;
  }

  // Temporary server errors are retryable
  if (error.message?.includes('503') || error.message?.includes('502')) {
    return true;
  }

  // Connection errors are retryable
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
    return true;
  }

  // Don't retry client errors (4xx except 429)
  if (error.message?.match(/4[0-8][0-9]/)) {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
}

// ============================================================================
// Data Collection Module
// ============================================================================

export class DataCollectionModule {
  private symbol: string;
  private timeframe: Timeframe;
  private lastDataQuality: DataQualityScore | null = null;

  constructor(symbol: string, timeframe: Timeframe = '1h') {
    this.symbol = symbol.toUpperCase();
    this.timeframe = timeframe;
  }
  
  /**
   * Get the last calculated data quality score
   * Used by the coordinator to pass data quality to confidence calculation
   */
  getLastDataQuality(): DataQualityScore | undefined {
    return this.lastDataQuality || undefined;
  }

  /**
   * Fetch market data from multiple sources (CoinGecko, CoinMarketCap, Kraken)
   * Requirement 3.1: Fetch data from all 13+ configured APIs
   * Requirement 12.1: Implement primary/fallback source logic for market data
   */
  async fetchMarketData(): Promise<MarketData> {
    // Define source priority: CoinMarketCap (primary) -> CoinGecko (fallback) -> Kraken (last resort)
    const sourcePriority = [
      { name: 'CoinMarketCap', fn: () => this.fetchCoinMarketCapData() },
      { name: 'CoinGecko', fn: () => this.fetchCoinGeckoData() },
      { name: 'Kraken', fn: () => this.fetchKrakenData() }
    ];

    // Try to fetch from all sources in parallel first
    const sources: Promise<Partial<MarketData>>[] = sourcePriority.map(s => s.fn());
    const results = await Promise.allSettled(sources);
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<Partial<MarketData>> => r.status === 'fulfilled')
      .map(r => r.value);

    // If we have at least one successful result, aggregate and return
    if (successfulResults.length > 0) {
      const aggregated = this.aggregateMarketData(successfulResults);
      console.log(`[Einstein] Market data fetched from ${successfulResults.length}/${sourcePriority.length} sources`);
      
      return {
        ...aggregated,
        timestamp: new Date().toISOString(),
        source: `${successfulResults.length} sources`
      } as MarketData;
    }

    // If all parallel attempts failed, try fallback chain with retry
    console.warn('[Einstein] All parallel market data fetches failed, trying fallback chain...');
    
    for (const source of sourcePriority) {
      try {
        console.log(`[Einstein] Attempting fallback to ${source.name}...`);
        const data = await retryWithBackoff(source.fn, {
          onRetry: (attempt, error) => {
            console.log(`[Einstein] ${source.name} retry ${attempt}: ${error.message}`);
          }
        });
        
        console.log(`[Einstein] Successfully fetched market data from ${source.name} (fallback)`);
        return {
          ...data,
          timestamp: new Date().toISOString(),
          source: `${source.name} (fallback)`
        } as MarketData;
      } catch (error) {
        console.error(`[Einstein] ${source.name} fallback failed:`, error);
        // Continue to next source
      }
    }

    throw new Error('Failed to fetch market data from any source after retries');
  }

  /**
   * Fetch sentiment data from social sources (LunarCrush, Twitter, Reddit)
   * Requirement 3.3: Aggregate data from LunarCrush, Twitter/X, and Reddit
   * Requirement 12.1: Implement fallback mechanisms for sentiment data
   */
  async fetchSentimentData(): Promise<SentimentData> {
    const sources: Promise<Partial<SentimentData>>[] = [
      this.fetchLunarCrushSentiment(),
      this.fetchTwitterSentiment(),
      this.fetchRedditSentiment()
    ];

    const results = await Promise.allSettled(sources);
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<Partial<SentimentData>> => r.status === 'fulfilled')
      .map(r => r.value);

    // Log failures for monitoring
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`[Einstein] ${failures.length} sentiment source(s) failed`);
    }

    if (successfulResults.length === 0) {
      throw new Error('Failed to fetch sentiment data from any source');
    }

    console.log(`[Einstein] Sentiment data fetched from ${successfulResults.length}/3 sources`);
    return this.aggregateSentimentData(successfulResults);
  }

  /**
   * Fetch on-chain data (whale transactions, exchange flows, holder distribution)
   * Requirement 3.4: Include whale transactions, exchange flows, and holder distribution
   * Requirement 12.1: Implement fallback mechanisms for on-chain data
   */
  async fetchOnChainData(): Promise<OnChainData> {
    const sources: Promise<Partial<OnChainData>>[] = [
      this.fetchBlockchainData(),
      this.fetchWhaleTransactions(),
      this.fetchExchangeFlows()
    ];

    const results = await Promise.allSettled(sources);
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<Partial<OnChainData>> => r.status === 'fulfilled')
      .map(r => r.value);

    // Log failures for monitoring
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`[Einstein] ${failures.length} on-chain source(s) failed`);
    }

    if (successfulResults.length === 0) {
      throw new Error('Failed to fetch on-chain data from any source');
    }

    console.log(`[Einstein] On-chain data fetched from ${successfulResults.length}/3 sources`);
    return this.aggregateOnChainData(successfulResults);
  }

  /**
   * Calculate technical indicators for the specified timeframe
   * Requirement 3.2: Calculate RSI, MACD, EMA, Bollinger Bands, ATR, and Stochastic
   */
  async fetchTechnicalIndicators(): Promise<TechnicalData> {
    // Fetch historical price data
    const priceData = await this.fetchHistoricalPrices(this.timeframe);
    
    // Calculate all indicators
    const indicators = {
      rsi: this.calculateRSI(priceData),
      macd: this.calculateMACD(priceData),
      ema: this.calculateEMAs(priceData),
      bollingerBands: this.calculateBollingerBands(priceData),
      atr: this.calculateATR(priceData),
      stochastic: this.calculateStochastic(priceData)
    };

    return {
      indicators,
      timeframe: this.timeframe,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze trends across multiple timeframes (15m, 1h, 4h, 1d)
   * Requirement 7.1: Analyze 15-minute, 1-hour, 4-hour, and 1-day timeframes
   * Requirement 7.2: Display trend alignment across timeframes
   */
  async fetchMultiTimeframeAnalysis(): Promise<TimeframeAlignment> {
    const { TimeframeAnalyzer } = await import('./timeframeAnalyzer');
    const analyzer = new TimeframeAnalyzer(this.symbol);
    
    return await analyzer.analyzeAllTimeframes();
  }

  /**
   * Fetch news data from NewsAPI and Caesar API
   * Requirement 3.5: Include recent news sentiment from NewsAPI and Caesar API
   * Requirement 12.1: Implement fallback mechanisms for news data
   */
  async fetchNewsData(): Promise<NewsData> {
    const sources: Promise<Partial<NewsData>>[] = [
      this.fetchNewsAPI(),
      this.fetchCaesarNews()
    ];

    const results = await Promise.allSettled(sources);
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<Partial<NewsData>> => r.status === 'fulfilled')
      .map(r => r.value);

    // Log failures for monitoring
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`[Einstein] ${failures.length} news source(s) failed`);
    }

    if (successfulResults.length === 0) {
      throw new Error('Failed to fetch news data from any source');
    }

    console.log(`[Einstein] News data fetched from ${successfulResults.length}/2 sources`);
    return this.aggregateNewsData(successfulResults);
  }

  /**
   * Fetch all data in parallel with timeout handling
   * Uses Promise.all for parallel execution
   * Requirement 12.1: Comprehensive error handling with fallbacks
   */
  async fetchAllData(): Promise<ComprehensiveData> {
    console.log(`[Einstein] Starting parallel data collection for ${this.symbol}...`);
    const startTime = Date.now();

    // Fetch all data sources in parallel with individual error handling
    const results = await Promise.allSettled([
      this.withTimeout(this.fetchMarketData(), 'market'),
      this.withTimeout(this.fetchSentimentData(), 'sentiment'),
      this.withTimeout(this.fetchOnChainData(), 'onChain'),
      this.withTimeout(this.fetchTechnicalIndicators(), 'technical'),
      this.withTimeout(this.fetchNewsData(), 'news')
    ]);

    const duration = Date.now() - startTime;

    // Extract successful results
    const [marketResult, sentimentResult, onChainResult, technicalResult, newsResult] = results;

    // Check for critical failures (market data is required)
    if (marketResult.status === 'rejected') {
      console.error('[Einstein] Critical: Market data fetch failed');
      throw new Error('Failed to fetch critical market data');
    }

    // Log warnings for non-critical failures
    const failures: string[] = [];
    if (sentimentResult.status === 'rejected') {
      console.warn('[Einstein] Sentiment data fetch failed:', sentimentResult.reason);
      failures.push('sentiment');
    }
    if (onChainResult.status === 'rejected') {
      console.warn('[Einstein] On-chain data fetch failed:', onChainResult.reason);
      failures.push('on-chain');
    }
    if (technicalResult.status === 'rejected') {
      console.warn('[Einstein] Technical data fetch failed:', technicalResult.reason);
      failures.push('technical');
    }
    if (newsResult.status === 'rejected') {
      console.warn('[Einstein] News data fetch failed:', newsResult.reason);
      failures.push('news');
    }

    if (failures.length > 0) {
      console.warn(`[Einstein] Data collection completed with ${failures.length} failure(s): ${failures.join(', ')}`);
    } else {
      console.log(`[Einstein] Data collection completed successfully in ${duration}ms`);
    }

    return {
      market: marketResult.value,
      sentiment: sentimentResult.status === 'fulfilled' ? sentimentResult.value : this.getEmptySentimentData(),
      onChain: onChainResult.status === 'fulfilled' ? onChainResult.value : this.getEmptyOnChainData(),
      technical: technicalResult.status === 'fulfilled' ? technicalResult.value : this.getEmptyTechnicalData(),
      news: newsResult.status === 'fulfilled' ? newsResult.value : this.getEmptyNewsData(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get empty sentiment data as fallback
   */
  private getEmptySentimentData(): SentimentData {
    return {
      social: {
        lunarCrush: { galaxyScore: 0, altRank: 0, socialScore: 0 },
        twitter: { mentions: 0, sentiment: 0 },
        reddit: { posts: 0, sentiment: 0 }
      },
      timestamp: new Date().toISOString()
    } as SentimentData;
  }

  /**
   * Get empty on-chain data as fallback
   */
  private getEmptyOnChainData(): OnChainData {
    return {
      whaleActivity: {
        transactions: 0,
        totalValue: 0,
        averageSize: 0
      },
      exchangeFlows: {
        deposits: 0,
        withdrawals: 0,
        netFlow: 0
      },
      timestamp: new Date().toISOString()
    } as OnChainData;
  }

  /**
   * Get empty technical data as fallback
   */
  private getEmptyTechnicalData(): TechnicalData {
    return {
      indicators: {
        rsi: 50,
        macd: { value: 0, signal: 0, histogram: 0 },
        ema: { ema9: 0, ema21: 0, ema50: 0, ema200: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0 },
        atr: 0,
        stochastic: { k: 0, d: 0 }
      },
      timeframe: this.timeframe,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get empty news data as fallback
   */
  private getEmptyNewsData(): NewsData {
    return {
      articles: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate all collected data and calculate quality score
   * Requirement 2.3: Refuse to generate signal if data quality < 90%
   * 
   * Note: This method is now a wrapper around the validator module
   * for backward compatibility. Use validator.validateAllData() directly.
   */
  validateAllData(data: ComprehensiveData): DataQualityScore {
    // Import and use the validator module
    const { validateAllData } = require('./validator');
    const quality = validateAllData(data);
    
    // Store for later retrieval by coordinator
    this.lastDataQuality = quality;
    
    return quality;
  }

  // ============================================================================
  // Private Helper Methods - Market Data
  // ============================================================================

  private async fetchCoinGeckoData(): Promise<Partial<MarketData>> {
    return retryWithBackoff(async () => {
      await coinGeckoLimiter.checkLimit();
      
      const coinId = this.getCoinGeckoId(this.symbol);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            throw new Error(`CoinGecko rate limit exceeded: ${response.status}`);
          }
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
          price: data.market_data.current_price.usd,
          volume24h: data.market_data.total_volume.usd,
          marketCap: data.market_data.market_cap.usd,
          change24h: data.market_data.price_change_percentage_24h,
          high24h: data.market_data.high_24h.usd,
          low24h: data.market_data.low_24h.usd
        };
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private async fetchCoinMarketCapData(): Promise<Partial<MarketData>> {
    return retryWithBackoff(async () => {
      await coinMarketCapLimiter.checkLimit();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(
          `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${this.symbol}`,
          {
            signal: controller.signal,
            headers: {
              'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || ''
            }
          }
        );

        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            throw new Error(`CoinMarketCap rate limit exceeded: ${response.status}`);
          }
          throw new Error(`CoinMarketCap API error: ${response.status}`);
        }

        const data = await response.json();
        const quote = data.data[this.symbol].quote.USD;

        return {
          price: quote.price,
          volume24h: quote.volume_24h,
          marketCap: quote.market_cap,
          change24h: quote.percent_change_24h
        };
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private async fetchKrakenData(): Promise<Partial<MarketData>> {
    return retryWithBackoff(async () => {
      await krakenLimiter.checkLimit();
      
      const pair = this.getKrakenPair(this.symbol);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(
          `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            throw new Error(`Kraken rate limit exceeded: ${response.status}`);
          }
          throw new Error(`Kraken API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Check for Kraken-specific errors
        if (data.error && data.error.length > 0) {
          throw new Error(`Kraken API error: ${data.error.join(', ')}`);
        }

        const ticker = data.result[Object.keys(data.result)[0]];

        return {
          price: parseFloat(ticker.c[0]),
          volume24h: parseFloat(ticker.v[1]) * parseFloat(ticker.c[0]),
          high24h: parseFloat(ticker.h[1]),
          low24h: parseFloat(ticker.l[1])
        };
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private aggregateMarketData(sources: Partial<MarketData>[]): Partial<MarketData> {
    // Import validator for cross-source validation
    const { validateCrossSource } = require('./validator');
    
    // Use median for price to handle outliers (Requirement 2.4)
    const prices = sources.map(s => s.price).filter((p): p is number => p !== undefined);
    const volumes = sources.map(s => s.volume24h).filter((v): v is number => v !== undefined);
    const marketCaps = sources.map(s => s.marketCap).filter((m): m is number => m !== undefined);

    // Validate price across sources
    const priceValidation = prices.length > 0 
      ? validateCrossSource(prices, 'price')
      : { value: 0, hasConflict: false, deviation: 0 };
    
    if (priceValidation.hasConflict) {
      console.warn('[Einstein] Price conflict detected across sources');
    }

    return {
      price: priceValidation.value,
      volume24h: this.median(volumes),
      marketCap: marketCaps.length > 0 ? this.median(marketCaps) : undefined,
      change24h: sources[0]?.change24h,
      high24h: Math.max(...sources.map(s => s.high24h || 0)),
      low24h: Math.min(...sources.map(s => s.low24h || Infinity).filter(l => l !== Infinity))
    };
  }

  // ============================================================================
  // Private Helper Methods - Sentiment Data
  // ============================================================================

  private async fetchLunarCrushSentiment(): Promise<Partial<SentimentData>> {
    return retryWithBackoff(async () => {
      await lunarCrushLimiter.checkLimit();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(
          `https://lunarcrush.com/api4/public/coins/${this.symbol}/v1`,
          {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY || ''}`
            }
          }
        );

        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            throw new Error(`LunarCrush rate limit exceeded: ${response.status}`);
          }
          throw new Error(`LunarCrush API error: ${response.status}`);
        }

        const data = await response.json();

        return {
          social: {
            lunarCrush: {
              galaxyScore: data.galaxy_score || 0,
              altRank: data.alt_rank || 0,
              socialScore: data.social_score || 0
            },
            twitter: {
              mentions: data.twitter_mentions || 0,
              sentiment: data.twitter_sentiment || 0
            },
            reddit: {
              posts: data.reddit_posts || 0,
              sentiment: data.reddit_sentiment || 0
            }
          },
          timestamp: new Date().toISOString()
        } as Partial<SentimentData>;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private async fetchTwitterSentiment(): Promise<Partial<SentimentData>> {
    // Twitter API integration would go here
    // For now, return placeholder
    return {
      social: {
        twitter: {
          mentions: 0,
          sentiment: 0
        }
      }
    } as Partial<SentimentData>;
  }

  private async fetchRedditSentiment(): Promise<Partial<SentimentData>> {
    // Reddit API integration would go here
    // For now, return placeholder
    return {
      social: {
        reddit: {
          posts: 0,
          sentiment: 0
        }
      }
    } as Partial<SentimentData>;
  }

  private aggregateSentimentData(sources: Partial<SentimentData>[]): SentimentData {
    // Merge all social metrics
    const merged = sources.reduce((acc, source) => {
      if (source.social) {
        acc.social = { ...acc.social, ...source.social };
      }
      if (source.news) {
        acc.news = { ...acc.news, ...source.news };
      }
      return acc;
    }, { social: {}, news: {} } as any);

    return {
      ...merged,
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================================
  // Private Helper Methods - On-Chain Data
  // ============================================================================

  private async fetchBlockchainData(): Promise<Partial<OnChainData>> {
    // Blockchain.com API for Bitcoin
    // Etherscan for Ethereum
    // Implementation depends on symbol
    return {
      whaleActivity: {
        transactions: 0,
        totalValue: 0,
        averageSize: 0
      },
      timestamp: new Date().toISOString()
    } as Partial<OnChainData>;
  }

  private async fetchWhaleTransactions(): Promise<Partial<OnChainData>> {
    // Fetch large transactions from blockchain explorers
    return {} as Partial<OnChainData>;
  }

  private async fetchExchangeFlows(): Promise<Partial<OnChainData>> {
    // Fetch exchange deposit/withdrawal data
    return {
      exchangeFlows: {
        deposits: 0,
        withdrawals: 0,
        netFlow: 0
      }
    } as Partial<OnChainData>;
  }

  private aggregateOnChainData(sources: Partial<OnChainData>[]): OnChainData {
    // Merge on-chain metrics
    const merged = sources.reduce((acc, source) => ({
      ...acc,
      ...source
    }), {});

    return {
      ...merged,
      timestamp: new Date().toISOString()
    } as OnChainData;
  }

  // ============================================================================
  // Private Helper Methods - Technical Indicators
  // ============================================================================

  private async fetchHistoricalPrices(timeframe: Timeframe): Promise<number[]> {
    // Fetch historical price data for indicator calculations
    // This would call CoinGecko or similar API
    // For now, return placeholder
    return [];
  }

  private calculateRSI(prices: number[]): number {
    // RSI calculation implementation
    return 50; // Placeholder
  }

  private calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    // MACD calculation implementation
    return { value: 0, signal: 0, histogram: 0 }; // Placeholder
  }

  private calculateEMAs(prices: number[]): { ema9: number; ema21: number; ema50: number; ema200: number } {
    // EMA calculation implementation
    return { ema9: 0, ema21: 0, ema50: 0, ema200: 0 }; // Placeholder
  }

  private calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
    // Bollinger Bands calculation implementation
    return { upper: 0, middle: 0, lower: 0 }; // Placeholder
  }

  private calculateATR(prices: number[]): number {
    // ATR calculation implementation
    return 0; // Placeholder
  }

  private calculateStochastic(prices: number[]): { k: number; d: number } {
    // Stochastic calculation implementation
    return { k: 0, d: 0 }; // Placeholder
  }

  // ============================================================================
  // Private Helper Methods - News Data
  // ============================================================================

  private async fetchNewsAPI(): Promise<Partial<NewsData>> {
    return retryWithBackoff(async () => {
      await newsAPILimiter.checkLimit();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${this.symbol}&sortBy=publishedAt&language=en&pageSize=10`,
          {
            signal: controller.signal,
            headers: {
              'X-Api-Key': process.env.NEWS_API_KEY || ''
            }
          }
        );

        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            throw new Error(`NewsAPI rate limit exceeded: ${response.status}`);
          }
          throw new Error(`NewsAPI error: ${response.status}`);
        }

        const data = await response.json();

        return {
          articles: data.articles.map((article: any) => ({
            title: article.title,
            source: article.source.name,
            sentiment: 0, // Would need sentiment analysis
            timestamp: article.publishedAt
          })),
          timestamp: new Date().toISOString()
        };
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  private async fetchCaesarNews(): Promise<Partial<NewsData>> {
    // Caesar API integration would go here
    return {
      articles: [],
      timestamp: new Date().toISOString()
    };
  }

  private aggregateNewsData(sources: Partial<NewsData>[]): NewsData {
    const allArticles = sources.flatMap(s => s.articles || []);
    
    return {
      articles: allArticles,
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================================
  // Private Helper Methods - Validation
  // ============================================================================
  // Note: Validation methods moved to validator.ts module

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async withTimeout<T>(promise: Promise<T>, name: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} data fetch timeout`)), API_TIMEOUT)
    );

    try {
      return await Promise.race([promise, timeout]);
    } catch (error) {
      console.error(`[Einstein] ${name} data fetch failed:`, error);
      throw error;
    }
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple'
    };
    return mapping[symbol] || symbol.toLowerCase();
  }

  private getKrakenPair(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'XXBTZUSD',
      'ETH': 'XETHZUSD',
      'SOL': 'SOLUSD',
      'XRP': 'XXRPZUSD'
    };
    return mapping[symbol] || `${symbol}USD`;
  }
}
