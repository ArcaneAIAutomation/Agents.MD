/**
 * Quantum BTC API Optimizer
 * 
 * Implements caching and reduces unnecessary API calls
 * Requirements: 2.1-2.8
 */

import { query } from '../db';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

// API cache configuration
interface CacheConfig {
  ttlSeconds: number;
  maxEntries: number;
  enabled: boolean;
}

// Default cache configurations by API
const DEFAULT_CACHE_CONFIGS: Record<string, CacheConfig> = {
  'CMC': { ttlSeconds: 60, maxEntries: 100, enabled: true },
  'CoinGecko': { ttlSeconds: 60, maxEntries: 100, enabled: true },
  'Kraken': { ttlSeconds: 30, maxEntries: 100, enabled: true },
  'Blockchain.com': { ttlSeconds: 120, maxEntries: 50, enabled: true },
  'LunarCrush': { ttlSeconds: 300, maxEntries: 50, enabled: true },
  'GPT-5.1': { ttlSeconds: 0, maxEntries: 0, enabled: false }, // No caching for AI
  'Gemini': { ttlSeconds: 0, maxEntries: 0, enabled: false } // No caching for AI
};

/**
 * API Optimizer Class
 * Manages caching and request optimization
 */
class APIOptimizer {
  private static instance: APIOptimizer;
  private cache: Map<string, CacheEntry<any>>;
  private cacheConfigs: Map<string, CacheConfig>;
  private requestQueue: Map<string, Promise<any>>;

  private constructor() {
    this.cache = new Map();
    this.cacheConfigs = new Map(Object.entries(DEFAULT_CACHE_CONFIGS));
    this.requestQueue = new Map();
  }

  public static getInstance(): APIOptimizer {
    if (!APIOptimizer.instance) {
      APIOptimizer.instance = new APIOptimizer();
    }
    return APIOptimizer.instance;
  }

  /**
   * Configure cache for specific API
   */
  configureCacheForAPI(apiName: string, config: Partial<CacheConfig>): void {
    const existing = this.cacheConfigs.get(apiName) || DEFAULT_CACHE_CONFIGS[apiName] || {
      ttlSeconds: 60,
      maxEntries: 100,
      enabled: true
    };

    this.cacheConfigs.set(apiName, { ...existing, ...config });
  }

  /**
   * Get cache key for API request
   */
  private getCacheKey(apiName: string, endpoint: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${apiName}:${endpoint}:${paramsStr}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Get data from cache
   */
  getFromCache<T>(apiName: string, endpoint: string, params?: any): T | null {
    const config = this.cacheConfigs.get(apiName);
    if (!config || !config.enabled) {
      return null;
    }

    const key = this.getCacheKey(apiName, endpoint, params);
    const entry = this.cache.get(key);

    if (entry && this.isCacheValid(entry)) {
      entry.hits++;
      return entry.data as T;
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Store data in cache
   */
  storeInCache<T>(apiName: string, endpoint: string, data: T, params?: any): void {
    const config = this.cacheConfigs.get(apiName);
    if (!config || !config.enabled) {
      return;
    }

    const key = this.getCacheKey(apiName, endpoint, params);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (config.ttlSeconds * 1000),
      hits: 0
    };

    this.cache.set(key, entry);

    // Enforce max entries limit
    if (this.cache.size > config.maxEntries) {
      this.evictOldestEntries(apiName, config.maxEntries);
    }
  }

  /**
   * Evict oldest cache entries for an API
   */
  private evictOldestEntries(apiName: string, maxEntries: number): void {
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(`${apiName}:`))
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toRemove = entries.length - maxEntries;
    if (toRemove > 0) {
      entries.slice(0, toRemove).forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  /**
   * Deduplicate concurrent requests
   * If same request is already in flight, return the existing promise
   */
  async deduplicateRequest<T>(
    apiName: string,
    endpoint: string,
    requestFn: () => Promise<T>,
    params?: any
  ): Promise<T> {
    const key = this.getCacheKey(apiName, endpoint, params);

    // Check if request is already in flight
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key) as Promise<T>;
    }

    // Execute request and store promise
    const promise = requestFn()
      .then((result) => {
        this.requestQueue.delete(key);
        return result;
      })
      .catch((error) => {
        this.requestQueue.delete(key);
        throw error;
      });

    this.requestQueue.set(key, promise);
    return promise;
  }

  /**
   * Optimized API call with caching and deduplication
   */
  async optimizedAPICall<T>(
    apiName: string,
    endpoint: string,
    requestFn: () => Promise<T>,
    params?: any
  ): Promise<T> {
    // Check cache first
    const cached = this.getFromCache<T>(apiName, endpoint, params);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    const result = await this.deduplicateRequest(apiName, endpoint, requestFn, params);

    // Store in cache
    this.storeInCache(apiName, endpoint, result, params);

    return result;
  }

  /**
   * Batch multiple API calls
   * Useful for fetching data from multiple sources simultaneously
   */
  async batchAPICall<T>(
    calls: Array<{
      apiName: string;
      endpoint: string;
      requestFn: () => Promise<T>;
      params?: any;
    }>
  ): Promise<T[]> {
    const promises = calls.map(call =>
      this.optimizedAPICall(call.apiName, call.endpoint, call.requestFn, call.params)
    );

    return Promise.all(promises);
  }

  /**
   * Batch API calls with fallback
   * If primary fails, try fallback sources
   */
  async batchAPICallWithFallback<T>(
    primary: {
      apiName: string;
      endpoint: string;
      requestFn: () => Promise<T>;
      params?: any;
    },
    fallbacks: Array<{
      apiName: string;
      endpoint: string;
      requestFn: () => Promise<T>;
      params?: any;
    }>
  ): Promise<T> {
    try {
      return await this.optimizedAPICall(
        primary.apiName,
        primary.endpoint,
        primary.requestFn,
        primary.params
      );
    } catch (error) {
      console.warn(`Primary API ${primary.apiName} failed, trying fallbacks...`);

      for (const fallback of fallbacks) {
        try {
          return await this.optimizedAPICall(
            fallback.apiName,
            fallback.endpoint,
            fallback.requestFn,
            fallback.params
          );
        } catch (fallbackError) {
          console.warn(`Fallback API ${fallback.apiName} failed`);
        }
      }

      throw new Error('All API sources failed');
    }
  }

  /**
   * Clear cache for specific API
   */
  clearCacheForAPI(apiName: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${apiName}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    const stats: any = {
      totalEntries: this.cache.size,
      byAPI: {} as Record<string, any>
    };

    this.cache.forEach((entry, key) => {
      const apiName = key.split(':')[0];
      if (!stats.byAPI[apiName]) {
        stats.byAPI[apiName] = {
          entries: 0,
          totalHits: 0,
          validEntries: 0,
          expiredEntries: 0
        };
      }

      stats.byAPI[apiName].entries++;
      stats.byAPI[apiName].totalHits += entry.hits;

      if (this.isCacheValid(entry)) {
        stats.byAPI[apiName].validEntries++;
      } else {
        stats.byAPI[apiName].expiredEntries++;
      }
    });

    return stats;
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (!this.isCacheValid(entry)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Start automatic cache cleanup
   */
  startAutomaticCleanup(intervalMs: number = 300000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanupExpiredCache();
    }, intervalMs);
  }
}

// Export singleton instance
export const apiOptimizer = APIOptimizer.getInstance();

/**
 * Convenience function for optimized API calls
 */
export async function cachedAPICall<T>(
  apiName: string,
  endpoint: string,
  requestFn: () => Promise<T>,
  params?: any
): Promise<T> {
  return apiOptimizer.optimizedAPICall(apiName, endpoint, requestFn, params);
}

/**
 * Convenience function for batch API calls
 */
export async function batchAPICall<T>(
  calls: Array<{
    apiName: string;
    endpoint: string;
    requestFn: () => Promise<T>;
    params?: any;
  }>
): Promise<T[]> {
  return apiOptimizer.batchAPICall(calls);
}

/**
 * Convenience function for API calls with fallback
 */
export async function apiCallWithFallback<T>(
  primary: {
    apiName: string;
    endpoint: string;
    requestFn: () => Promise<T>;
    params?: any;
  },
  fallbacks: Array<{
    apiName: string;
    endpoint: string;
    requestFn: () => Promise<T>;
    params?: any;
  }>
): Promise<T> {
  return apiOptimizer.batchAPICallWithFallback(primary, fallbacks);
}
