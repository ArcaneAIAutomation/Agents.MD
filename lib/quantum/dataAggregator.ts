/**
 * Quantum BTC Data Aggregator
 * 
 * Aggregates data from multiple sources (CMC, CoinGecko, Kraken, Blockchain, LunarCrush)
 * Calculates median prices, detects divergence, and scores data quality.
 * 
 * This is the CORE of the real data pipeline.
 */

import { fetchCMCData, CMCQuote } from './apis/coinmarketcap';
import { fetchCoinGeckoData, CoinGeckoQuote } from './apis/coingecko';
import { fetchKrakenData, KrakenQuote } from './apis/kraken';
import { fetchBlockchainData, BlockchainStats } from './apis/blockchain';
import { fetchLunarCrushData, LunarCrushMetrics } from './apis/lunarcrush';

export interface AggregatedMarketData {
  price: {
    cmc: number;
    coingecko: number;
    kraken: number;
    median: number;
    average: number;
    divergence: number; // Percentage difference between highest and lowest
    divergenceStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  };
  volume: {
    cmc: number;
    coingecko: number;
    kraken: number;
    average: number;
  };
  marketCap: {
    cmc: number;
    coingecko: number;
    average: number;
  };
  priceChanges: {
    change_1h: number;
    change_24h: number;
    change_7d: number;
    change_30d: number;
  };
  onChain: {
    mempoolSize: number;
    difficulty: number;
    hashRate: number;
    totalBTC: number;
    blockHeight: number;
    avgBlockTime: number;
  };
  sentiment: {
    score: number;
    socialDominance: number;
    galaxyScore: number;
    altRank: number;
    socialVolume: number;
    socialScore: number;
    influencers: number;
  };
  dataQuality: {
    score: number; // 0-100
    status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
    apiStatus: {
      cmc: boolean;
      coingecko: boolean;
      kraken: boolean;
      blockchain: boolean;
      lunarcrush: boolean;
    };
    issues: string[];
  };
  timestamp: string;
}

/**
 * Calculate median from array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

/**
 * Calculate average from array of numbers
 */
function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Aggregate market data from all sources
 * 
 * This is the MAIN function that fetches and combines all real API data.
 */
export async function aggregateMarketData(): Promise<AggregatedMarketData> {
  console.log('[Data Aggregator] 🚀 Starting multi-source data collection...');
  
  const startTime = Date.now();
  
  // Fetch all data in parallel for maximum speed
  const [cmcResult, coinGeckoResult, krakenResult, blockchainResult, lunarCrushResult] = await Promise.all([
    fetchCMCData('BTC'),
    fetchCoinGeckoData('bitcoin'),
    fetchKrakenData('XBTUSD'),
    fetchBlockchainData(),
    fetchLunarCrushData('BTC'),
  ]);
  
  const fetchTime = Date.now() - startTime;
  console.log(`[Data Aggregator] ⚡ All APIs fetched in ${fetchTime}ms`);
  
  // Track API status
  const apiStatus = {
    cmc: cmcResult.success,
    coingecko: coinGeckoResult.success,
    kraken: krakenResult.success,
    blockchain: blockchainResult.success,
    lunarcrush: lunarCrushResult.success,
  };
  
  const issues: string[] = [];
  
  // Log API failures
  if (!cmcResult.success) {
    console.warn('[Data Aggregator] ⚠️ CoinMarketCap failed:', cmcResult.error);
    issues.push(`CoinMarketCap: ${cmcResult.error}`);
  }
  if (!coinGeckoResult.success) {
    console.warn('[Data Aggregator] ⚠️ CoinGecko failed:', coinGeckoResult.error);
    issues.push(`CoinGecko: ${coinGeckoResult.error}`);
  }
  if (!krakenResult.success) {
    console.warn('[Data Aggregator] ⚠️ Kraken failed:', krakenResult.error);
    issues.push(`Kraken: ${krakenResult.error}`);
  }
  if (!blockchainResult.success) {
    console.warn('[Data Aggregator] ⚠️ Blockchain.com failed:', blockchainResult.error);
    issues.push(`Blockchain.com: ${blockchainResult.error}`);
  }
  if (!lunarCrushResult.success) {
    console.warn('[Data Aggregator] ⚠️ LunarCrush failed:', lunarCrushResult.error);
    issues.push(`LunarCrush: ${lunarCrushResult.error}`);
  }
  
  // Extract prices from successful API calls
  const prices: number[] = [];
  if (cmcResult.data) prices.push(cmcResult.data.price);
  if (coinGeckoResult.data) prices.push(coinGeckoResult.data.price);
  if (krakenResult.data) prices.push(krakenResult.data.price);
  
  // Calculate price statistics
  const medianPrice = calculateMedian(prices);
  const averagePrice = calculateAverage(prices);
  
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const priceDivergence = medianPrice > 0 ? ((maxPrice - minPrice) / medianPrice) * 100 : 0;
  
  // Determine divergence status
  let divergenceStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  if (priceDivergence < 0.5) divergenceStatus = 'EXCELLENT';
  else if (priceDivergence < 1.0) divergenceStatus = 'GOOD';
  else if (priceDivergence < 2.0) divergenceStatus = 'WARNING';
  else divergenceStatus = 'CRITICAL';
  
  console.log(`[Data Aggregator] 💰 Median Price: $${medianPrice.toLocaleString()}`);
  console.log(`[Data Aggregator] 📊 Price Divergence: ${priceDivergence.toFixed(3)}% (${divergenceStatus})`);
  
  // Calculate data quality score (0-100)
  let qualityScore = 100;
  
  // Deduct points for missing APIs
  if (!cmcResult.success) qualityScore -= 20;
  if (!coinGeckoResult.success) qualityScore -= 15;
  if (!krakenResult.success) qualityScore -= 15;
  if (!blockchainResult.success) qualityScore -= 25;
  if (!lunarCrushResult.success) qualityScore -= 25;
  
  // Deduct points for high price divergence
  if (priceDivergence > 1.0) qualityScore -= 10;
  if (priceDivergence > 2.0) qualityScore -= 20;
  
  // Deduct points for invalid on-chain data
  if (blockchainResult.data && blockchainResult.data.mempoolSize === 0) {
    qualityScore -= 15;
    issues.push('Mempool size is zero (suspicious)');
  }
  
  // Ensure quality score is between 0-100
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  
  // Determine quality status
  let qualityStatus: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
  if (qualityScore >= 90) qualityStatus = 'EXCELLENT';
  else if (qualityScore >= 75) qualityStatus = 'GOOD';
  else if (qualityScore >= 60) qualityStatus = 'ACCEPTABLE';
  else if (qualityScore >= 40) qualityStatus = 'POOR';
  else qualityStatus = 'CRITICAL';
  
  console.log(`[Data Aggregator] ✅ Data Quality: ${qualityScore}% (${qualityStatus})`);
  
  // Aggregate all data
  const aggregated: AggregatedMarketData = {
    price: {
      cmc: cmcResult.data?.price || 0,
      coingecko: coinGeckoResult.data?.price || 0,
      kraken: krakenResult.data?.price || 0,
      median: medianPrice,
      average: averagePrice,
      divergence: priceDivergence,
      divergenceStatus,
    },
    volume: {
      cmc: cmcResult.data?.volume_24h || 0,
      coingecko: coinGeckoResult.data?.volume_24h || 0,
      kraken: krakenResult.data?.volume_24h || 0,
      average: calculateAverage([
        cmcResult.data?.volume_24h || 0,
        coinGeckoResult.data?.volume_24h || 0,
        krakenResult.data?.volume_24h || 0,
      ].filter(v => v > 0)),
    },
    marketCap: {
      cmc: cmcResult.data?.market_cap || 0,
      coingecko: coinGeckoResult.data?.market_cap || 0,
      average: calculateAverage([
        cmcResult.data?.market_cap || 0,
        coinGeckoResult.data?.market_cap || 0,
      ].filter(v => v > 0)),
    },
    priceChanges: {
      change_1h: cmcResult.data?.percent_change_1h || 0,
      change_24h: cmcResult.data?.percent_change_24h || coinGeckoResult.data?.percent_change_24h || 0,
      change_7d: cmcResult.data?.percent_change_7d || 0,
      change_30d: cmcResult.data?.percent_change_30d || 0,
    },
    onChain: {
      mempoolSize: blockchainResult.data?.mempoolSize || 0,
      difficulty: blockchainResult.data?.difficulty || 0,
      hashRate: blockchainResult.data?.hashRate || 0,
      totalBTC: blockchainResult.data?.totalBTC || 0,
      blockHeight: blockchainResult.data?.blockHeight || 0,
      avgBlockTime: blockchainResult.data?.avgBlockTime || 10,
    },
    sentiment: {
      score: lunarCrushResult.data?.sentiment || 50,
      socialDominance: lunarCrushResult.data?.socialDominance || 0,
      galaxyScore: lunarCrushResult.data?.galaxyScore || 0,
      altRank: lunarCrushResult.data?.altRank || 0,
      socialVolume: lunarCrushResult.data?.socialVolume || 0,
      socialScore: lunarCrushResult.data?.socialScore || 0,
      influencers: lunarCrushResult.data?.influencers || 0,
    },
    dataQuality: {
      score: qualityScore,
      status: qualityStatus,
      apiStatus,
      issues,
    },
    timestamp: new Date().toISOString(),
  };
  
  console.log('[Data Aggregator] 🎯 Aggregation complete!');
  
  return aggregated;
}
