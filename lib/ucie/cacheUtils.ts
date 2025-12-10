/**
 * UCIE Cache Utilities
 * 
 * Provides database-backed caching for UCIE analysis results.
 * Replaces in-memory caching to persist across serverless function restarts.
 */

import { query } from '../db';
import { unwrapData, hasAPIWrappers } from './dataUnwrapper';

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
  | 'defi'
  | 'veritas-validation'; // Veritas Protocol validation results

/**
 * Get cached analysis from database (WITH FRESHNESS CHECK)
 * 
 * @param symbol - Token symbol
 * @param analysisType - Type of analysis
 * @param userId - User ID (optional, for logging only)
 * @param userEmail - User email (optional, for logging only)
 * @param maxAgeSeconds - Maximum age in seconds (default: 1020 = 17 minutes)
 * @returns Cached data or null if not found/expired/too old
 */
export async function getCachedAnalysis(
  symbol: string,
  analysisType: AnalysisType,
  userId?: string,
  userEmail?: string,
  maxAgeSeconds: number = 1020 // 17 minutes default freshness (matches longest core data TTL)
): Promise<any | null> {
  try {
    // ✅ Query by symbol + analysis_type only (no user_id)
    // Since UNIQUE constraint is (symbol, analysis_type), there's only ONE entry
    const result = await query(
      `SELECT data, data_quality_score, created_at, expires_at, user_email, user_id
       FROM ucie_analysis_cache
       WHERE symbol = $1 AND analysis_type = $2 AND expires_at > NOW()`,
      [symbol.toUpperCase(), analysisType]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Cache miss for ${symbol}/${analysisType}`);
      
      // ✅ DEBUG: Check if data exists but is expired
      const expiredCheck = await query(
        `SELECT expires_at, created_at FROM ucie_analysis_cache WHERE symbol = $1 AND analysis_type = $2`,
        [symbol.toUpperCase(), analysisType]
      );
      
      if (expiredCheck.rows.length > 0) {
        const row = expiredCheck.rows[0];
        const expiresAt = new Date(row.expires_at);
        const now = new Date();
        console.log(`   ℹ️ Data exists but is expired (expired: ${expiresAt.toISOString()}, now: ${now.toISOString()})`);
      } else {
        console.log(`   ℹ️ No data found in database at all (not even expired)`);
      }
      
      return null;
    }
    
    const row = result.rows[0];
    const age = Date.now() - new Date(row.created_at).getTime();
    const ageSeconds = Math.floor(age / 1000);
    const ttl = new Date(row.expires_at).getTime() - Date.now();
    
    // ✅ FRESHNESS CHECK: Reject if data is too old (handles concurrent users)
    // This prevents User A's stale data from being used by User B
    if (ageSeconds > maxAgeSeconds) {
      console.log(`⚠️  Cache too old for ${symbol}/${analysisType} (age: ${ageSeconds}s > max: ${maxAgeSeconds}s) - forcing refresh`);
      return null;
    }
    
    console.log(`✅ Cache hit for ${symbol}/${analysisType} (stored by: ${row.user_email}, age: ${ageSeconds}s, ttl: ${Math.floor(ttl / 1000)}s, quality: ${row.data_quality_score || 'N/A'})`);
    
    // ✅ BACKWARD COMPATIBILITY: Auto-unwrap old format data
    const cachedData = row.data;
    
    if (hasAPIWrappers(cachedData)) {
      console.log(`🔓 Auto-unwrapping old format data for ${symbol}/${analysisType}`);
      return unwrapData(cachedData, analysisType);
    }
    
    return cachedData;
  } catch (error) {
    console.error(`❌ Failed to get cached analysis for ${symbol}/${analysisType}:`, error);
    return null;
  }
}

/**
 * Store analysis in database cache (WITH SYSTEM USER FALLBACK)
 * 
 * @param symbol - Token symbol
 * @param analysisType - Type of analysis
 * @param data - Analysis data to cache
 * @param ttlSeconds - Time to live in seconds (default: 24 hours)
 * @param dataQualityScore - Optional quality score (0-100)
 * @param userId - User ID for tracking (optional, falls back to system user)
 * @param userEmail - User email (optional, falls back to system user)
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
    // ✅ SYSTEM USER FALLBACK: Use system user for anonymous requests
    // This allows caching for all users while tracking authenticated users separately
    const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000001';
    const effectiveUserId = userId || SYSTEM_USER_UUID;
    const effectiveUserEmail = userEmail || 'system@arcane.group';
    
    // ✅ DEBUG: Log user type
    if (userId && userEmail) {
      console.log(`🔐 Caching for authenticated user: ${userId} <${userEmail}>`);
    } else {
      console.log(`🤖 Caching for system user (anonymous request)`);
    }
    
    // ✅ FIX: Round data quality score to integer (database column is INTEGER, not FLOAT)
    const qualityScoreInt = dataQualityScore !== undefined && dataQualityScore !== null 
      ? Math.round(dataQualityScore) 
      : null;
    
    // ✅ UPSERT: Replace old data if it exists
    // UNIQUE constraint is (symbol, analysis_type) - one entry per symbol+type
    await query(
      `INSERT INTO ucie_analysis_cache (
        symbol, analysis_type, data, data_quality_score, user_id, user_email, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${ttlSeconds} seconds', NOW())
      ON CONFLICT (symbol, analysis_type)
      DO UPDATE SET
        data = EXCLUDED.data,
        data_quality_score = EXCLUDED.data_quality_score,
        user_id = EXCLUDED.user_id,
        user_email = EXCLUDED.user_email,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()`,
      [
        symbol.toUpperCase(),
        analysisType,
        JSON.stringify(data),
        qualityScoreInt,
        effectiveUserId,
        effectiveUserEmail
      ]
    );
    
    console.log(`✅ Analysis cached for ${symbol}/${analysisType} (user: ${effectiveUserEmail}, TTL: ${ttlSeconds}s, quality: ${dataQualityScore || 'N/A'})`);
    
    // ✅ VERIFICATION: Immediately verify the data was written
    // This helps catch database write issues early
    try {
      const verification = await query(
        `SELECT symbol, analysis_type, created_at FROM ucie_analysis_cache WHERE symbol = $1 AND analysis_type = $2`,
        [symbol.toUpperCase(), analysisType]
      );
      
      if (verification.rows.length > 0) {
        console.log(`   ✅ Verified: Data exists in database (created: ${verification.rows[0].created_at})`);
      } else {
        console.error(`   ❌ VERIFICATION FAILED: Data not found in database after write!`);
      }
    } catch (verifyError) {
      console.error(`   ⚠️ Verification query failed:`, verifyError);
    }
    
  } catch (error) {
    console.error(`❌ Failed to cache analysis for ${symbol}/${analysisType}:`, error);
    // ✅ NON-BLOCKING: Don't throw error to prevent timeout
    // Just log and continue - caching is optional, not critical
  }
}

/**
 * Invalidate cache for a symbol (GLOBAL - affects all users)
 * ✅ CRITICAL FIX: Remove user_id filter to delete cache for ALL users
 * This ensures refresh=true works for everyone, not just the requesting user
 * 
 * @param symbol - Token symbol
 * @param analysisType - Optional specific analysis type to invalidate
 * @param userId - User ID (IGNORED - kept for backward compatibility)
 */
export async function invalidateCache(
  symbol: string,
  analysisType?: AnalysisType,
  userId?: string
): Promise<void> {
  try {
    // ✅ CRITICAL FIX: Delete for ALL users (no user_id filter)
    // This ensures fresh data is fetched for everyone when refresh=true
    
    if (analysisType) {
      const result = await query(
        `DELETE FROM ucie_analysis_cache WHERE symbol = $1 AND analysis_type = $2`,
        [symbol.toUpperCase(), analysisType]
      );
      const deletedCount = result.rowCount || 0;
      console.log(`🗑️ Invalidated cache for ${symbol}/${analysisType} (deleted ${deletedCount} entries for ALL users)`);
    } else {
      const result = await query(
        `DELETE FROM ucie_analysis_cache WHERE symbol = $1`,
        [symbol.toUpperCase()]
      );
      const deletedCount = result.rowCount || 0;
      console.log(`🗑️ Invalidated all cache for ${symbol} (deleted ${deletedCount} entries for ALL users)`);
    }
  } catch (error) {
    console.error(`❌ Failed to invalidate cache:`, error);
    throw error; // Re-throw to let caller know invalidation failed
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
