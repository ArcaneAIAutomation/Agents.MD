/**
 * Quantum BTC Cache Utilities
 * 
 * Provides database-backed caching for Quantum BTC API calls.
 * Reduces unnecessary API calls and improves performance.
 * 
 * Requirements: 2.1-2.8 (Multi-Source Data Convergence)
 * Task: 12.4 (Optimize API calls)
 */

import { query } from '../db';

/**
 * Cache types for Quantum BTC system
 */
export type QuantumCacheType =
  | 'market-data'      // CoinMarketCap, CoinGecko, Kraken
  | 'on-chain'         // Blockchain.com
  | 'sentiment'        // LunarCrush
  | 'triangulation'    // Multi-API price triangulation
  | 'validation'       // QDPP validation results
  | 'quantum-analysis' // QSIC analysis results
  | 'trade-signal';    // QSTGE trade signals

/**
 * Cache entry interface
 */
interface CacheEntry {
  symbol: string;
  cacheType: QuantumCacheType;
  data: any;
  dataQualityScore?: number;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Cache TTL configuration (in seconds)
 */
const CACHE_TTL: Record<QuantumCacheType, number> = {
  'market-data': 60,        // 1 minute (real-time data)
  'on-chain': 300,          // 5 minutes (blockchain data)
  'sentiment': 300,         // 5 minutes (social data)
  'triangulation': 60,      // 1 minute (price triangulation)
  'validation': 60,         // 1 minute (validation results)
  'quantum-analysis': 300,  // 5 minutes (quantum analysis)
  'trade-signal': 3600,     // 1 hour (trade signals)
};

/**
 * Get cached data from database
 * 
 * @param symbol - Token symbol (e.g., 'BTC')
 * @param cacheType - Type of cached data
 * @returns Cached data or null if not found/expired
 */
export async function getQuantumCache(
  symbol: string,
  cacheType: QuantumCacheType
): Promise<any | null> {
  try {
    const result = await query(
      `SELECT data, data_quality_score, created_at, expires_at
       FROM quantum_api_cache
       WHERE symbol = $1 AND cache_type = $2 AND expires_at > NOW()`,
      [symbol.toUpperCase(), cacheType]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Cache miss for ${symbol}/${cacheType}`);
      return null;
    }
    
    const row = result.rows[0];
    const age = Date.now() - new Date(row.created_at).getTime();
    const ageSeconds = Math.floor(age / 1000);
    const ttl = new Date(row.expires_at).getTime() - Date.now();
    
    console.log(`✅ Cache hit for ${symbol}/${cacheType} (age: ${ageSeconds}s, ttl: ${Math.floor(ttl / 1000)}s, quality: ${row.data_quality_score || 'N/A'})`);
    
    return row.data;
  } catch (error) {
    console.error(`❌ Failed to get cached data for ${symbol}/${cacheType}:`, error);
    return null;
  }
}

/**
 * Store data in cache
 * 
 * @param symbol - Token symbol (e.g., 'BTC')
 * @param cacheType - Type of data to cache
 * @param data - Data to cache
 * @param dataQualityScore - Optional quality score (0-100)
 * @param customTTL - Optional custom TTL in seconds (overrides default)
 */
export async function setQuantumCache(
  symbol: string,
  cacheType: QuantumCacheType,
  data: any,
  dataQualityScore?: number,
  customTTL?: number
): Promise<void> {
  try {
    const ttlSeconds = customTTL || CACHE_TTL[cacheType];
    
    // Round data quality score to integer
    const qualityScoreInt = dataQualityScore !== undefined && dataQualityScore !== null 
      ? Math.round(dataQualityScore) 
      : null;
    
    // UPSERT: Replace old data if it exists
    await query(
      `INSERT INTO quantum_api_cache (
        symbol, cache_type, data, data_quality_score, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${ttlSeconds} seconds', NOW())
      ON CONFLICT (symbol, cache_type)
      DO UPDATE SET
        data = EXCLUDED.data,
        data_quality_score = EXCLUDED.data_quality_score,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()`,
      [
        symbol.toUpperCase(),
        cacheType,
        JSON.stringify(data),
        qualityScoreInt
      ]
    );
    
    console.log(`✅ Data cached for ${symbol}/${cacheType} (TTL: ${ttlSeconds}s, quality: ${dataQualityScore || 'N/A'})`);
  } catch (error) {
    console.error(`❌ Failed to cache data for ${symbol}/${cacheType}:`, error);
    // Non-blocking: Don't throw error to prevent timeout
  }
}

/**
 * Invalidate cache for a symbol
 * 
 * @param symbol - Token symbol
 * @param cacheType - Optional specific cache type to invalidate
 */
export async function invalidateQuantumCache(
  symbol: string,
  cacheType?: QuantumCacheType
): Promise<void> {
  try {
    if (cacheType) {
      await query(
        `DELETE FROM quantum_api_cache WHERE symbol = $1 AND cache_type = $2`,
        [symbol.toUpperCase(), cacheType]
      );
      console.log(`🗑️ Invalidated cache for ${symbol}/${cacheType}`);
    } else {
      await query(
        `DELETE FROM quantum_api_cache WHERE symbol = $1`,
        [symbol.toUpperCase()]
      );
      console.log(`🗑️ Invalidated all cache for ${symbol}`);
    }
  } catch (error) {
    console.error(`❌ Failed to invalidate cache:`, error);
  }
}

/**
 * Get cache statistics for a symbol
 * 
 * @param symbol - Token symbol
 * @returns Cache statistics
 */
export async function getQuantumCacheStats(symbol: string): Promise<{
  totalCached: number;
  cacheTypes: string[];
  oldestCache: Date | null;
  newestCache: Date | null;
  averageQuality: number | null;
}> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_cached,
        ARRAY_AGG(cache_type) as cache_types,
        MIN(created_at) as oldest_cache,
        MAX(created_at) as newest_cache,
        AVG(data_quality_score) as average_quality
       FROM quantum_api_cache
       WHERE symbol = $1 AND expires_at > NOW()`,
      [symbol.toUpperCase()]
    );
    
    const row = result.rows[0];
    return {
      totalCached: parseInt(row.total_cached),
      cacheTypes: row.cache_types || [],
      oldestCache: row.oldest_cache ? new Date(row.oldest_cache) : null,
      newestCache: row.newest_cache ? new Date(row.newest_cache) : null,
      averageQuality: row.average_quality ? parseFloat(row.average_quality) : null
    };
  } catch (error) {
    console.error(`❌ Failed to get cache stats:`, error);
    return {
      totalCached: 0,
      cacheTypes: [],
      oldestCache: null,
      newestCache: null,
      averageQuality: null
    };
  }
}

/**
 * Clean up expired cache entries
 * 
 * @returns Number of entries deleted
 */
export async function cleanupExpiredQuantumCache(): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM quantum_api_cache WHERE expires_at < NOW()`
    );
    
    const deletedCount = result.rowCount || 0;
    console.log(`🗑️ Cleaned up ${deletedCount} expired cache entries`);
    
    return deletedCount;
  } catch (error) {
    console.error(`❌ Failed to cleanup expired cache:`, error);
    return 0;
  }
}

/**
 * Batch get multiple cache entries
 * Optimizes database queries by fetching multiple cache types at once
 * 
 * @param symbol - Token symbol
 * @param cacheTypes - Array of cache types to fetch
 * @returns Map of cache type to data
 */
export async function batchGetQuantumCache(
  symbol: string,
  cacheTypes: QuantumCacheType[]
): Promise<Map<QuantumCacheType, any>> {
  const result = new Map<QuantumCacheType, any>();
  
  try {
    const queryResult = await query(
      `SELECT cache_type, data, data_quality_score, created_at, expires_at
       FROM quantum_api_cache
       WHERE symbol = $1 AND cache_type = ANY($2) AND expires_at > NOW()`,
      [symbol.toUpperCase(), cacheTypes]
    );
    
    for (const row of queryResult.rows) {
      result.set(row.cache_type as QuantumCacheType, row.data);
      
      const age = Date.now() - new Date(row.created_at).getTime();
      const ageSeconds = Math.floor(age / 1000);
      console.log(`✅ Batch cache hit for ${symbol}/${row.cache_type} (age: ${ageSeconds}s)`);
    }
    
    // Log cache misses
    for (const cacheType of cacheTypes) {
      if (!result.has(cacheType)) {
        console.log(`❌ Batch cache miss for ${symbol}/${cacheType}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to batch get cached data:`, error);
  }
  
  return result;
}

/**
 * Batch set multiple cache entries
 * Optimizes database writes by batching multiple cache updates
 * 
 * @param symbol - Token symbol
 * @param entries - Array of cache entries to store
 */
export async function batchSetQuantumCache(
  symbol: string,
  entries: Array<{
    cacheType: QuantumCacheType;
    data: any;
    dataQualityScore?: number;
    customTTL?: number;
  }>
): Promise<void> {
  try {
    // Build batch insert query
    const values: any[] = [];
    const placeholders: string[] = [];
    
    entries.forEach((entry, index) => {
      const ttlSeconds = entry.customTTL || CACHE_TTL[entry.cacheType];
      const qualityScoreInt = entry.dataQualityScore !== undefined && entry.dataQualityScore !== null 
        ? Math.round(entry.dataQualityScore) 
        : null;
      
      const baseIndex = index * 4;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, NOW() + INTERVAL '${ttlSeconds} seconds', NOW())`
      );
      
      values.push(
        symbol.toUpperCase(),
        entry.cacheType,
        JSON.stringify(entry.data),
        qualityScoreInt
      );
    });
    
    const sql = `
      INSERT INTO quantum_api_cache (
        symbol, cache_type, data, data_quality_score, expires_at, created_at
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (symbol, cache_type)
      DO UPDATE SET
        data = EXCLUDED.data,
        data_quality_score = EXCLUDED.data_quality_score,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
    `;
    
    await query(sql, values);
    
    console.log(`✅ Batch cached ${entries.length} entries for ${symbol}`);
  } catch (error) {
    console.error(`❌ Failed to batch cache data:`, error);
    // Non-blocking: Don't throw error
  }
}

/**
 * Get cache hit rate statistics
 * 
 * @returns Cache performance metrics
 */
export async function getQuantumCachePerformance(): Promise<{
  totalEntries: number;
  totalSymbols: number;
  averageQuality: number | null;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  cacheByType: Record<string, number>;
}> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT symbol) as total_symbols,
        AVG(data_quality_score) as average_quality,
        MIN(created_at) as oldest_entry,
        MAX(created_at) as newest_entry
       FROM quantum_api_cache
       WHERE expires_at > NOW()`
    );
    
    const typeResult = await query(
      `SELECT cache_type, COUNT(*) as count
       FROM quantum_api_cache
       WHERE expires_at > NOW()
       GROUP BY cache_type`
    );
    
    const cacheByType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      cacheByType[row.cache_type] = parseInt(row.count);
    }
    
    const row = result.rows[0];
    return {
      totalEntries: parseInt(row.total_entries),
      totalSymbols: parseInt(row.total_symbols),
      averageQuality: row.average_quality ? parseFloat(row.average_quality) : null,
      oldestEntry: row.oldest_entry ? new Date(row.oldest_entry) : null,
      newestEntry: row.newest_entry ? new Date(row.newest_entry) : null,
      cacheByType
    };
  } catch (error) {
    console.error(`❌ Failed to get cache performance:`, error);
    return {
      totalEntries: 0,
      totalSymbols: 0,
      averageQuality: null,
      oldestEntry: null,
      newestEntry: null,
      cacheByType: {}
    };
  }
}
