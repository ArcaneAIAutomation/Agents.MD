/**
 * UCIE Cache Utilities
 * 
 * Provides database-backed caching for UCIE analysis results.
 * Replaces in-memory caching to persist across serverless function restarts.
 */

import { query } from '../db';

/**
 * Analysis types supported by UCIE
 */
export type AnalysisType =
  | 'research'
  | 'market-data'
  | 'technical'
  | 'sentiment'
  | 'news'
  | 'on-chain'
  | 'predictions'
  | 'risk'
  | 'derivatives'
  | 'defi';

/**
 * Get cached analysis from database (USER-SPECIFIC)
 * 
 * @param symbol - Token symbol
 * @param analysisType - Type of analysis
 * @param userId - User ID for data isolation (REQUIRED for security)
 * @param userEmail - User email for tracking (optional)
 * @returns Cached data or null if not found/expired
 */
export async function getCachedAnalysis(
  symbol: string,
  analysisType: AnalysisType,
  userId?: string,
  userEmail?: string
): Promise<any | null> {
  try {
    // If no userId provided, use 'anonymous' for backward compatibility
    // In production, userId should ALWAYS be provided
    const effectiveUserId = userId || 'anonymous';
    
    const result = await query(
      `SELECT data, data_quality_score, created_at, expires_at, user_email
       FROM ucie_analysis_cache
       WHERE symbol = $1 AND analysis_type = $2 AND user_id = $3 AND expires_at > NOW()`,
      [symbol.toUpperCase(), analysisType, effectiveUserId]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Cache miss for ${symbol}/${analysisType} (user: ${effectiveUserId})`);
      return null;
    }
    
    const row = result.rows[0];
    const age = Date.now() - new Date(row.created_at).getTime();
    const ttl = new Date(row.expires_at).getTime() - Date.now();
    
    console.log(`✅ Cache hit for ${symbol}/${analysisType} (user: ${effectiveUserId}, age: ${Math.floor(age / 1000)}s, ttl: ${Math.floor(ttl / 1000)}s, quality: ${row.data_quality_score || 'N/A'})`);
    
    return row.data;
  } catch (error) {
    console.error(`❌ Failed to get cached analysis for ${symbol}/${analysisType}:`, error);
    return null;
  }
}

/**
 * Store analysis in database cache (USER-SPECIFIC)
 * 
 * @param symbol - Token symbol
 * @param analysisType - Type of analysis
 * @param data - Analysis data to cache
 * @param ttlSeconds - Time to live in seconds (default: 24 hours)
 * @param dataQualityScore - Optional quality score (0-100)
 * @param userId - User ID for data isolation (REQUIRED for security)
 * @param userEmail - User email for tracking (optional)
 */
export async function setCachedAnalysis(
  symbol: string,
  analysisType: AnalysisType,
  data: any,
  ttlSeconds: number = 86400, // 24 hours default
  dataQualityScore?: number,
  userId?: string,
  userEmail?: string
): Promise<void> {
  try {
    // If no userId provided, use 'anonymous' for backward compatibility
    // In production, userId should ALWAYS be provided
    const effectiveUserId = userId || 'anonymous';
    
    // ✅ FIX: Round quality score to integer (database expects INTEGER, not FLOAT)
    const qualityScoreInt = dataQualityScore !== undefined 
      ? Math.round(dataQualityScore) 
      : null;
    
    // ✅ FIX: Use ON CONFLICT ON CONSTRAINT to handle old constraint name
    // The old constraint 'ucie_cache_unique' is (symbol, analysis_type) without user_id
    // We need to handle this until migration 006 is run in production
    await query(
      `INSERT INTO ucie_analysis_cache (symbol, analysis_type, data, data_quality_score, user_id, user_email, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${ttlSeconds} seconds')
       ON CONFLICT (symbol, analysis_type)
       DO UPDATE SET 
         data = EXCLUDED.data, 
         data_quality_score = EXCLUDED.data_quality_score,
         user_id = EXCLUDED.user_id,
         user_email = EXCLUDED.user_email,
         expires_at = EXCLUDED.expires_at, 
         created_at = NOW()`,
      [symbol.toUpperCase(), analysisType, JSON.stringify(data), qualityScoreInt, effectiveUserId, userEmail || null]
    );
    
    console.log(`💾 Cached ${symbol}/${analysisType} for ${ttlSeconds}s (user: ${effectiveUserId}${userEmail ? ` <${userEmail}>` : ''}, quality: ${qualityScoreInt || 'N/A'})`);
  } catch (error) {
    console.error(`❌ Failed to cache analysis for ${symbol}/${analysisType}:`, error);
    throw error;
  }
}

/**
 * Invalidate cache for a symbol (USER-SPECIFIC)
 * 
 * @param symbol - Token symbol
 * @param analysisType - Optional specific analysis type to invalidate
 * @param userId - User ID for data isolation (REQUIRED for security)
 */
export async function invalidateCache(
  symbol: string,
  analysisType?: AnalysisType,
  userId?: string
): Promise<void> {
  try {
    const effectiveUserId = userId || 'anonymous';
    
    if (analysisType) {
      await query(
        `DELETE FROM ucie_analysis_cache WHERE symbol = $1 AND analysis_type = $2 AND user_id = $3`,
        [symbol.toUpperCase(), analysisType, effectiveUserId]
      );
      console.log(`🗑️ Invalidated cache for ${symbol}/${analysisType} (user: ${effectiveUserId})`);
    } else {
      await query(
        `DELETE FROM ucie_analysis_cache WHERE symbol = $1 AND user_id = $2`,
        [symbol.toUpperCase(), effectiveUserId]
      );
      console.log(`🗑️ Invalidated all cache for ${symbol} (user: ${effectiveUserId})`);
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
export async function getCacheStats(symbol: string): Promise<{
  totalCached: number;
  analysisTypes: string[];
  oldestCache: Date | null;
  newestCache: Date | null;
  averageQuality: number | null;
}> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_cached,
        ARRAY_AGG(analysis_type) as analysis_types,
        MIN(created_at) as oldest_cache,
        MAX(created_at) as newest_cache,
        AVG(data_quality_score) as average_quality
       FROM ucie_analysis_cache
       WHERE symbol = $1 AND expires_at > NOW()`,
      [symbol.toUpperCase()]
    );
    
    const row = result.rows[0];
    return {
      totalCached: parseInt(row.total_cached),
      analysisTypes: row.analysis_types || [],
      oldestCache: row.oldest_cache ? new Date(row.oldest_cache) : null,
      newestCache: row.newest_cache ? new Date(row.newest_cache) : null,
      averageQuality: row.average_quality ? parseFloat(row.average_quality) : null
    };
  } catch (error) {
    console.error(`❌ Failed to get cache stats:`, error);
    return {
      totalCached: 0,
      analysisTypes: [],
      oldestCache: null,
      newestCache: null,
      averageQuality: null
    };
  }
}

/**
 * Get global cache statistics
 * 
 * @returns Global cache statistics
 */
export async function getGlobalCacheStats(): Promise<{
  totalEntries: number;
  totalSymbols: number;
  cacheHitRate: number | null;
  averageQuality: number | null;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT symbol) as total_symbols,
        AVG(data_quality_score) as average_quality,
        MIN(created_at) as oldest_entry,
        MAX(created_at) as newest_entry
       FROM ucie_analysis_cache
       WHERE expires_at > NOW()`
    );
    
    const row = result.rows[0];
    return {
      totalEntries: parseInt(row.total_entries),
      totalSymbols: parseInt(row.total_symbols),
      cacheHitRate: null, // Would need request tracking to calculate
      averageQuality: row.average_quality ? parseFloat(row.average_quality) : null,
      oldestEntry: row.oldest_entry ? new Date(row.oldest_entry) : null,
      newestEntry: row.newest_entry ? new Date(row.newest_entry) : null
    };
  } catch (error) {
    console.error(`❌ Failed to get global cache stats:`, error);
    return {
      totalEntries: 0,
      totalSymbols: 0,
      cacheHitRate: null,
      averageQuality: null,
      oldestEntry: null,
      newestEntry: null
    };
  }
}

/**
 * Clean up expired cache entries manually
 * (Normally handled by database function, but can be called manually)
 * 
 * @returns Number of entries deleted
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM ucie_analysis_cache WHERE expires_at < NOW()`
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
 * Refresh cache for a symbol (invalidate and return null to trigger fresh fetch)
 * 
 * @param symbol - Token symbol
 * @param analysisType - Optional specific analysis type
 */
export async function refreshCache(
  symbol: string,
  analysisType?: AnalysisType
): Promise<void> {
  await invalidateCache(symbol, analysisType);
  console.log(`🔄 Cache refreshed for ${symbol}${analysisType ? `/${analysisType}` : ''}`);
}
