/**
 * Multi-Level Caching Infrastructure for UCIE
 * Bitcoin Sovereign Technology - Universal Crypto Intelligence Engine
 * 
 * Implements a three-tier caching strategy:
 * 1. Memory Cache (L1) - Fastest, 30 seconds TTL
 * 2. Redis Cache (L2) - Fast, 5 minutes TTL
 * 3. Database Cache (L3) - Persistent, 1 hour TTL
 * 
 * Requirements: 14.3, 14.4
 */

import { query, queryOne } from '../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'redis' | 'database';
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryHits: number;
  redisHits: number;
  databaseHits: number;
  totalEntries: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  skipMemory?: boolean; // Skip memory cache
  skipRedis?: boolean; // Skip Redis cache
  skipDatabase?: boolean; // Skip database cache
}

// ============================================================================
// LEVEL 1: MEMORY CACHE (FASTEST)
// ============================================================================

/**
 * In-memory cache using Map
 * TTL: 30 seconds (configurable)
 * Scope: Single server instance
 */
class MemoryCache {
  private cache: Map<string, CacheEntry>;
  private stats: { hits: number; misses: number };
  private defaultTTL: number;

  constructor(defaultTTL: number = 30) {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.defaultTTL = defaultTTL;

    // Cleanup expired entries every 10 seconds
    setInterval(() => this.cleanup(), 10000);
  }

  /**
   * Get value from memory cache
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in memory cache
   */
  set<T = any>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      source: 'memory',
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from memory cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from memory cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number } {
    return {
      ...this.stats,
      size: this.cache.size,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Memory cache cleanup: removed ${removed} expired entries`);
    }
  }
}

// Global memory cache instance
const memoryCache = new MemoryCache(30);

// ============================================================================
// LEVEL 2: REDIS CACHE (FAST)
// ============================================================================

/**
 * Redis cache using Upstash
 * TTL: 5 minutes (configurable)
 * Scope: Distributed across all server instances
 */
class RedisCache {
  private baseUrl: string | null;
  private token: string | null;
  private enabled: boolean;
  private stats: { hits: number; misses: number; errors: number };

  constructor() {
    this.baseUrl = process.env.KV_REST_API_URL || null;
    this.token = process.env.KV_REST_API_TOKEN || null;
    this.enabled = !!(this.baseUrl && this.token);
    this.stats = { hits: 0, misses: 0, errors: 0 };

    if (!this.enabled) {
      console.warn('⚠️ Redis cache disabled: KV_REST_API_URL or KV_REST_API_TOKEN not set');
    }
  }

  /**
   * Get value from Redis cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.enabled) {
      this.stats.misses++;
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/get/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.stats.misses++;
          return null;
        }
        throw new Error(`Redis GET failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(data.result) as T;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis cache GET error:', error);
      return null;
    }
  }

  /**
   * Set value in Redis cache with TTL
   */
  async set<T = any>(key: string, data: T, ttl: number = 300): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(data),
          ex: ttl, // Expiration in seconds
        }),
      });

      if (!response.ok) {
        throw new Error(`Redis SET failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis cache SET error:', error);
      return false;
    }
  }

  /**
   * Delete value from Redis cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis cache DELETE error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; errors: number; enabled: boolean } {
    return {
      ...this.stats,
      enabled: this.enabled,
    };
  }
}

// Global Redis cache instance
const redisCache = new RedisCache();

// ============================================================================
// LEVEL 3: DATABASE CACHE (PERSISTENT)
// ============================================================================

/**
 * Database cache using Supabase
 * TTL: 1 hour (configurable)
 * Scope: Persistent across all instances and restarts
 */
class DatabaseCache {
  private stats: { hits: number; misses: number; errors: number };

  constructor() {
    this.stats = { hits: 0, misses: 0, errors: 0 };
    this.initializeTable();
  }

  /**
   * Initialize database cache table if it doesn't exist
   */
  private async initializeTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
          key VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL,
          symbol VARCHAR(20),
          analysis_type VARCHAR(50)
        );

        CREATE INDEX IF NOT EXISTS idx_ucie_cache_expires_at ON ucie_analysis_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_ucie_cache_symbol ON ucie_analysis_cache(symbol);
        CREATE INDEX IF NOT EXISTS idx_ucie_cache_type ON ucie_analysis_cache(analysis_type);
      `);
      console.log('✅ Database cache table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database cache table:', error);
    }
  }

  /**
   * Get value from database cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const result = await queryOne<{ data: T }>(
        `SELECT data FROM ucie_analysis_cache 
         WHERE key = $1 AND expires_at > NOW()`,
        [key]
      );

      if (!result) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return result.data;
    } catch (error) {
      this.stats.errors++;
      console.error('Database cache GET error:', error);
      return null;
    }
  }

  /**
   * Set value in database cache with TTL
   */
  async set<T = any>(
    key: string,
    data: T,
    ttl: number = 3600,
    metadata?: { symbol?: string; analysisType?: string }
  ): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);

      await query(
        `INSERT INTO ucie_analysis_cache (key, data, expires_at, symbol, analysis_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) 
         DO UPDATE SET data = $2, expires_at = $3, symbol = $4, analysis_type = $5`,
        [key, JSON.stringify(data), expiresAt, metadata?.symbol || null, metadata?.analysisType || null]
      );

      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Database cache SET error:', error);
      return false;
    }
  }

  /**
   * Delete value from database cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await query('DELETE FROM ucie_analysis_cache WHERE key = $1', [key]);
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Database cache DELETE error:', error);
      return false;
    }
  }

  /**
   * Delete all expired entries
   */
  async cleanup(): Promise<number> {
    try {
      const result = await query(
        'DELETE FROM ucie_analysis_cache WHERE expires_at < NOW()'
      );
      return result.rowCount || 0;
    } catch (error) {
      this.stats.errors++;
      console.error('Database cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; errors: number } {
    return { ...this.stats };
  }
}

// Global database cache instance
const databaseCache = new DatabaseCache();

// ============================================================================
// UNIFIED CACHE INTERFACE
// ============================================================================

/**
 * Get value from multi-level cache
 * Tries memory -> Redis -> database in order
 */
export async function getCached<T = any>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  // Try memory cache first (L1)
  if (!options.skipMemory) {
    const memoryData = memoryCache.get<T>(key);
    if (memoryData !== null) {
      return memoryData;
    }
  }

  // Try Redis cache (L2)
  if (!options.skipRedis) {
    const redisData = await redisCache.get<T>(key);
    if (redisData !== null) {
      // Backfill memory cache
      if (!options.skipMemory) {
        memoryCache.set(key, redisData, 30);
      }
      return redisData;
    }
  }

  // Try database cache (L3)
  if (!options.skipDatabase) {
    const dbData = await databaseCache.get<T>(key);
    if (dbData !== null) {
      // Backfill Redis and memory caches
      if (!options.skipRedis) {
        await redisCache.set(key, dbData, 300);
      }
      if (!options.skipMemory) {
        memoryCache.set(key, dbData, 30);
      }
      return dbData;
    }
  }

  return null;
}

/**
 * Set value in multi-level cache
 * Writes to all enabled cache levels
 */
export async function setCached<T = any>(
  key: string,
  data: T,
  options: CacheOptions & { symbol?: string; analysisType?: string } = {}
): Promise<void> {
  const { ttl, skipMemory, skipRedis, skipDatabase, symbol, analysisType } = options;

  // Set in memory cache (30 seconds)
  if (!skipMemory) {
    memoryCache.set(key, data, 30);
  }

  // Set in Redis cache (5 minutes)
  if (!skipRedis) {
    await redisCache.set(key, data, ttl || 300);
  }

  // Set in database cache (1 hour)
  if (!skipDatabase) {
    await databaseCache.set(key, data, ttl || 3600, { symbol, analysisType });
  }
}

/**
 * Delete value from all cache levels
 */
export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key);
  await redisCache.delete(key);
  await databaseCache.delete(key);
}

/**
 * Invalidate cache by pattern (symbol or analysis type)
 */
export async function invalidateCache(pattern: {
  symbol?: string;
  analysisType?: string;
}): Promise<number> {
  try {
    let query = 'DELETE FROM ucie_analysis_cache WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (pattern.symbol) {
      query += ` AND symbol = $${paramIndex}`;
      params.push(pattern.symbol);
      paramIndex++;
    }

    if (pattern.analysisType) {
      query += ` AND analysis_type = $${paramIndex}`;
      params.push(pattern.analysisType);
      paramIndex++;
    }

    const result = await query(query, params);
    
    // Clear memory cache (can't pattern match, so clear all)
    memoryCache.clear();

    return result.rowCount || 0;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Get comprehensive cache statistics
 */
export function getCacheStats(): CacheStats {
  const memoryStats = memoryCache.getStats();
  const redisStats = redisCache.getStats();
  const dbStats = databaseCache.getStats();

  const totalHits = memoryStats.hits + redisStats.hits + dbStats.hits;
  const totalMisses = memoryStats.misses + redisStats.misses + dbStats.misses;
  const totalRequests = totalHits + totalMisses;

  return {
    hits: totalHits,
    misses: totalMisses,
    hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
    memoryHits: memoryStats.hits,
    redisHits: redisStats.hits,
    databaseHits: dbStats.hits,
    totalEntries: memoryStats.size,
  };
}

/**
 * Cleanup expired database cache entries
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredCache(): Promise<number> {
  return await databaseCache.cleanup();
}

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

/**
 * Generate cache key for market data
 */
export function getMarketDataCacheKey(symbol: string): string {
  return `ucie:market:${symbol.toUpperCase()}`;
}

/**
 * Generate cache key for technical analysis
 */
export function getTechnicalAnalysisCacheKey(symbol: string): string {
  return `ucie:technical:${symbol.toUpperCase()}`;
}

/**
 * Generate cache key for on-chain data
 */
export function getOnChainCacheKey(symbol: string): string {
  return `ucie:onchain:${symbol.toUpperCase()}`;
}

/**
 * Generate cache key for social sentiment
 */
export function getSocialSentimentCacheKey(symbol: string): string {
  return `ucie:sentiment:${symbol.toUpperCase()}`;
}

/**
 * Generate cache key for news data
 */
export function getNewsCacheKey(symbol: string): string {
  return `ucie:news:${symbol.toUpperCase()}`;
}

/**
 * Generate cache key for Caesar research
 */
export function getCaesarResearchCacheKey(symbol: string): string {
  return `ucie:caesar:${symbol.toUpperCase()}`;
}

/**
 * Generate cache key for complete analysis
 */
export function getComprehensiveAnalysisCacheKey(symbol: string): string {
  return `ucie:analysis:${symbol.toUpperCase()}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getCached,
  setCached,
  deleteCached,
  invalidateCache,
  getCacheStats,
  cleanupExpiredCache,
  getMarketDataCacheKey,
  getTechnicalAnalysisCacheKey,
  getOnChainCacheKey,
  getSocialSentimentCacheKey,
  getNewsCacheKey,
  getCaesarResearchCacheKey,
  getComprehensiveAnalysisCacheKey,
};
