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
  
  const sql = `
    INSERT INTO quantum_btc_market_data (
      id, symbol, timestamp,
      price_median, price_average, price_cmc, price_coingecko, price_kraken, 
      price_divergence, price_divergence_status,
      volume_average, volume_cmc, volume_coingecko, volume_kraken,
      market_cap_average, market_cap_cmc, market_cap_coingecko,
      change_1h, change_24h, change_7d, change_30d,
      mempool_size, difficulty, hash_rate, total_btc, block_height, avg_block_time,
      sentiment_score, social_dominance, galaxy_score, alt_rank, 
      social_volume, social_score, influencers,
      data_quality_score, data_quality_status,
      api_status_cmc, api_status_coingecko, api_status_kraken, 
      api_status_blockchain, api_status_lunarcrush,
      quality_issues
    ) VALUES (
      gen_random_uuid(), 'BTC', $1,
      $2, $3, $4, $5, $6,
      $7, $8,
      $9, $10, $11, $12,
      $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21, $22, $23, $24, $25,
      $26, $27, $28, $29,
      $30, $31, $32,
      $33, $34,
      $35, $36, $37,
      $38, $39,
      $40
    )
  `;
  
  await query(sql, [
    data.timestamp,
    data.price.median,
    data.price.average,
    data.price.cmc,
    data.price.coingecko,
    data.price.kraken,
    data.price.divergence,
    data.price.divergenceStatus,
    data.volume.average,
    data.volume.cmc,
    data.volume.coingecko,
    data.volume.kraken,
    data.marketCap.average,
    data.marketCap.cmc,
    data.marketCap.coingecko,
    data.priceChanges.change_1h,
    data.priceChanges.change_24h,
    data.priceChanges.change_7d,
    data.priceChanges.change_30d,
    data.onChain.mempoolSize,
    data.onChain.difficulty,
    data.onChain.hashRate,
    data.onChain.totalBTC,
    data.onChain.blockHeight,
    data.onChain.avgBlockTime,
    data.sentiment.score,
    data.sentiment.socialDominance,
    data.sentiment.galaxyScore,
    data.sentiment.altRank,
    data.sentiment.socialVolume,
    data.sentiment.socialScore,
    data.sentiment.influencers,
    data.dataQuality.score,
    data.dataQuality.status,
    data.dataQuality.apiStatus.cmc,
    data.dataQuality.apiStatus.coingecko,
    data.dataQuality.apiStatus.kraken,
    data.dataQuality.apiStatus.blockchain,
    data.dataQuality.apiStatus.lunarcrush,
    JSON.stringify(data.dataQuality.issues),
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
    SELECT * FROM quantum_btc_market_data
    WHERE symbol = 'BTC'
      AND timestamp > NOW() - INTERVAL '${maxAgeMinutes} minutes'
    ORDER BY timestamp DESC
    LIMIT 1
  `;
  
  const result = await query(sql);
  
  if (result.rows.length === 0) {
    console.log('[Cache] ❌ No cached data found or cache expired');
    return null;
  }
  
  const row = result.rows[0];
  
  console.log(`[Cache] ✅ Found cached data from ${row.timestamp}`);
  
  // Reconstruct aggregated data from database row
  const aggregated: AggregatedMarketData = {
    price: {
      cmc: row.price_cmc,
      coingecko: row.price_coingecko,
      kraken: row.price_kraken,
      median: row.price_median,
      average: row.price_average,
      divergence: row.price_divergence,
      divergenceStatus: row.price_divergence_status,
    },
    volume: {
      cmc: row.volume_cmc,
      coingecko: row.volume_coingecko,
      kraken: row.volume_kraken,
      average: row.volume_average,
    },
    marketCap: {
      cmc: row.market_cap_cmc,
      coingecko: row.market_cap_coingecko,
      average: row.market_cap_average,
    },
    priceChanges: {
      change_1h: row.change_1h,
      change_24h: row.change_24h,
      change_7d: row.change_7d,
      change_30d: row.change_30d,
    },
    onChain: {
      mempoolSize: row.mempool_size,
      difficulty: row.difficulty,
      hashRate: row.hash_rate,
      totalBTC: row.total_btc,
      blockHeight: row.block_height,
      avgBlockTime: row.avg_block_time,
    },
    sentiment: {
      score: row.sentiment_score,
      socialDominance: row.social_dominance,
      galaxyScore: row.galaxy_score,
      altRank: row.alt_rank,
      socialVolume: row.social_volume,
      socialScore: row.social_score,
      influencers: row.influencers,
    },
    dataQuality: {
      score: row.data_quality_score,
      status: row.data_quality_status,
      apiStatus: {
        cmc: row.api_status_cmc,
        coingecko: row.api_status_coingecko,
        kraken: row.api_status_kraken,
        blockchain: row.api_status_blockchain,
        lunarcrush: row.api_status_lunarcrush,
      },
      issues: JSON.parse(row.quality_issues || '[]'),
    },
    timestamp: row.timestamp,
  };
  
  return aggregated;
}
