/**
 * Quantum BTC Cache Service
 * 
 * Stores and retrieves aggregated market data from Supabase database.
 * Implements 5-minute TTL caching to reduce API calls and improve performance.
 */

import { query } from '../db';
import { AggregatedMarketData } from './dataAggregator';

/**
 * Store aggregated market data in database cache
 */
export async function cacheMarketData(data: AggregatedMarketData): Promise<void> {
  console.log('[Cache] 💾 Storing market data in database...');
  
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  const sql = `
    INSERT INTO quantum_api_cache (
      symbol, cache_type, data, data_quality_score, expires_at
    ) VALUES (
      $1, $2, $3, $4, $5
    )
    ON CONFLICT (symbol, cache_type) 
    DO UPDATE SET 
      data = EXCLUDED.data,
      data_quality_score = EXCLUDED.data_quality_score,
      created_at = NOW(),
      expires_at = EXCLUDED.expires_at
  `;
  
  await query(sql, [
    'BTC',
    'market-data',
    JSON.stringify(data),
    data.dataQuality.score,
    expiresAt,
  ]);
  
  console.log('[Cache] ✅ Market data cached successfully');
}

/**
 * Retrieve cached market data from database
 * 
 * @param maxAgeMinutes Maximum age of cached data in minutes (default: 5)
 * @returns Cached data if available and fresh, null otherwise
 */
export async function getCachedMarketData(maxAgeMinutes: number = 5): Promise<AggregatedMarketData | null> {
  console.log(`[Cache] 🔍 Checking for cached data (max age: ${maxAgeMinutes} minutes)...`);
  
  const sql = `
    SELECT data, created_at FROM quantum_api_cache
    WHERE symbol = 'BTC'
      AND cache_type = 'market-data'
      AND expires_at > NOW()
      AND created_at > NOW() - INTERVAL '${maxAgeMinutes} minutes'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  const result = await query(sql);
  
  if (result.rows.length === 0) {
    console.log('[Cache] ❌ No cached data found or cache expired');
    return null;
  }
  
  const row = result.rows[0];
  
  console.log(`[Cache] ✅ Found cached data from ${row.created_at}`);
  
  // Parse the JSONB data
  const aggregated: AggregatedMarketData = typeof row.data === 'string' 
    ? JSON.parse(row.data) 
    : row.data;
  
  return aggregated;
}
