/**
 * Rate Limiter Instances for UCIE APIs
 * 
 * Provides individual rate limiters for each external API service
 * to prevent exceeding API quotas and ensure fair usage.
 * 
 * Features:
 * - Token bucket algorithm for smooth rate limiting
 * - Per-service rate limit configuration
 * - Automatic token refill
 * - Queue management for pending requests
 * - Burst handling
 * 
 * Requirements: 13.5, 14.2
 */

import { API_SERVICES } from './apiKeyManager';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface RateLimiterConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval: number; // milliseconds
}

export interface RateLimiterState {
  tokens: number;
  lastRefill: number;
  queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>;
}

// =============================================================================
// Token Bucket Rate Limiter
// =============================================================================

export class TokenBucketRateLimiter {
  private config: RateLimiterConfig;
  private state: RateLimiterState;
  private refillTimer: NodeJS.Timeout | null = null;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.state = {
      tokens: config.maxTokens,
      lastRefill: Date.now(),
      queue: [],
    };

    // Start automatic token refill
    this.startRefill();
  }

  /**
   * Start automatic token refill
   */
  private startRefill(): void {
    this.refillTimer = setInterval(() => {
      this.refillTokens();
      this.processQueue();
    }, this.config.refillInterval);
  }

  /**
   * Stop automatic token refill
   */
  stop(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = now - this.state.lastRefill;
    const tokensToAdd = (timeSinceLastRefill / 1000) * this.config.refillRate;

    this.state.tokens = Math.min(
      this.config.maxTokens,
      this.state.tokens + tokensToAdd
    );
    this.state.lastRefill = now;
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (this.state.queue.length > 0 && this.state.tokens >= 1) {
      const request = this.state.queue.shift();
      if (request) {
        this.state.tokens -= 1;
        request.resolve();
      }
    }
  }

  /**
   * Acquire a token (wait if necessary)
   */
  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      return Promise.resolve();
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.state.queue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        const index = this.state.queue.findIndex((r) => r.resolve === resolve);
        if (index !== -1) {
          this.state.queue.splice(index, 1);
          reject(new Error('Rate limit timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Try to acquire a token without waiting
   */
  tryAcquire(): boolean {
    this.refillTokens();

    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get current state
   */
  getState(): {
    availableTokens: number;
    queueLength: number;
    maxTokens: number;
  } {
    this.refillTokens();
    return {
      availableTokens: Math.floor(this.state.tokens),
      queueLength: this.state.queue.length,
      maxTokens: this.config.maxTokens,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.state.tokens = this.config.maxTokens;
    this.state.lastRefill = Date.now();
    this.state.queue = [];
  }
}

// =============================================================================
// Rate Limiter Factory
// =============================================================================

/**
 * Create rate limiter from API service configuration
 */
function createRateLimiterFromConfig(serviceName: string): TokenBucketRateLimiter {
  const config = API_SERVICES[serviceName];
  if (!config) {
    throw new Error(`Unknown API service: ${serviceName}`);
  }

  const { maxRequests, windowMs } = config.rateLimit;
  const refillRate = maxRequests / (windowMs / 1000); // tokens per second
  const refillInterval = Math.min(1000, windowMs / maxRequests); // refill every second or less

  return new TokenBucketRateLimiter({
    maxTokens: maxRequests,
    refillRate,
    refillInterval,
  });
}

// =============================================================================
// Rate Limiter Instances
// =============================================================================

/**
 * Rate limiter instances for all API services
 */
export const rateLimiters = {
  // AI Services
  openai: createRateLimiterFromConfig('OPENAI'),
  caesar: createRateLimiterFromConfig('CAESAR'),
  gemini: createRateLimiterFromConfig('GEMINI'),

  // Market Data Services
  coinGecko: createRateLimiterFromConfig('COINGECKO'),
  coinMarketCap: createRateLimiterFromConfig('COINMARKETCAP'),

  // Blockchain Explorer Services
  etherscan: createRateLimiterFromConfig('ETHERSCAN'),
  bscScan: createRateLimiterFromConfig('BSCSCAN'),
  polygonScan: createRateLimiterFromConfig('POLYGONSCAN'),

  // Social Sentiment Services
  lunarCrush: createRateLimiterFromConfig('LUNARCRUSH'),
  twitter: createRateLimiterFromConfig('TWITTER'),

  // News Services
  newsApi: createRateLimiterFromConfig('NEWSAPI'),
  cryptoCompare: createRateLimiterFromConfig('CRYPTOCOMPARE'),

  // Derivatives Services
  coinGlass: createRateLimiterFromConfig('COINGLASS'),

  // DeFi Services
  defiLlama: createRateLimiterFromConfig('DEFILLAMA'),
  messari: createRateLimiterFromConfig('MESSARI'),
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Execute function with rate limiting
 */
export async function withRateLimit<T>(
  limiter: TokenBucketRateLimiter,
  fn: () => Promise<T>
): Promise<T> {
  await limiter.acquire();
  return fn();
}

/**
 * Execute function with rate limiting and retry
 */
export async function withRateLimitAndRetry<T>(
  limiter: TokenBucketRateLimiter,
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await limiter.acquire();
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on rate limit timeout
      if (lastError.message === 'Rate limit timeout') {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Get rate limiter by service name
 */
export function getRateLimiter(serviceName: string): TokenBucketRateLimiter | undefined {
  const limiterMap: Record<string, TokenBucketRateLimiter> = {
    OPENAI: rateLimiters.openai,
    CAESAR: rateLimiters.caesar,
    GEMINI: rateLimiters.gemini,
    COINGECKO: rateLimiters.coinGecko,
    COINMARKETCAP: rateLimiters.coinMarketCap,
    ETHERSCAN: rateLimiters.etherscan,
    BSCSCAN: rateLimiters.bscScan,
    POLYGONSCAN: rateLimiters.polygonScan,
    LUNARCRUSH: rateLimiters.lunarCrush,
    TWITTER: rateLimiters.twitter,
    NEWSAPI: rateLimiters.newsApi,
    CRYPTOCOMPARE: rateLimiters.cryptoCompare,
    COINGLASS: rateLimiters.coinGlass,
    DEFILLAMA: rateLimiters.defiLlama,
    MESSARI: rateLimiters.messari,
  };

  return limiterMap[serviceName];
}

/**
 * Get all rate limiter states
 */
export function getAllRateLimiterStates(): Record<string, ReturnType<TokenBucketRateLimiter['getState']>> {
  return {
    openai: rateLimiters.openai.getState(),
    caesar: rateLimiters.caesar.getState(),
    gemini: rateLimiters.gemini.getState(),
    coinGecko: rateLimiters.coinGecko.getState(),
    coinMarketCap: rateLimiters.coinMarketCap.getState(),
    etherscan: rateLimiters.etherscan.getState(),
    bscScan: rateLimiters.bscScan.getState(),
    polygonScan: rateLimiters.polygonScan.getState(),
    lunarCrush: rateLimiters.lunarCrush.getState(),
    twitter: rateLimiters.twitter.getState(),
    newsApi: rateLimiters.newsApi.getState(),
    cryptoCompare: rateLimiters.cryptoCompare.getState(),
    coinGlass: rateLimiters.coinGlass.getState(),
    defiLlama: rateLimiters.defiLlama.getState(),
    messari: rateLimiters.messari.getState(),
  };
}

/**
 * Reset all rate limiters
 */
export function resetAllRateLimiters(): void {
  Object.values(rateLimiters).forEach((limiter) => limiter.reset());
}

/**
 * Stop all rate limiters
 */
export function stopAllRateLimiters(): void {
  Object.values(rateLimiters).forEach((limiter) => limiter.stop());
}
