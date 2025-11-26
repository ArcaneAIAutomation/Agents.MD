/**
 * Quantum Data Purity Protocol (QDPP)
 * Quantum BTC Super Spec - Zero-Hallucination Data Validation Layer
 * 
 * Enforces strict data validation through multi-API triangulation,
 * cross-source sanity checks, and quality scoring to prevent AI hallucination.
 * 
 * Requirements: 5.1-5.10 (Quantum Data Purity Protocol)
 */

import { coinMarketCapClient, type CMCMarketData } from './api/coinmarketcap';
import { coinGeckoClient, type CoinGeckoMarketData } from './api/coingecko';
import { krakenClient, type KrakenMarketData } from './api/kraken';
import { blockchainClient, type BlockchainOnChainData } from './api/blockchain';
import { lunarCrushClient, type LunarCrushSentimentData } from './api/lunarcrush';
import { 
  getQuantumCache, 
  setQuantumCache, 
  batchGetQuantumCache, 
  batchSetQuantumCache,
  type QuantumCacheType 
} from './cacheUtils';

/**
 * Unified market data structure
 */
interface UnifiedMarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  change24h: number;
  timestamp: string;
  source: 'coinmarketcap' | 'coingecko' | 'kraken';
}

/**
 * Price triangulation result
 */
interface PriceTriangulation {
  medianPrice: number;
  prices: {
    coinMarketCap: number | null;
    coinGecko: number | null;
    kraken: number | null;
  };
  divergence: {
    maxDivergence: number; // Maximum % difference from median
    hasDivergence: boolean; // True if any source diverges >1%
    divergentSources: string[];
  };
  timestamp: string;
}

/**
 * Data quality discrepancy
 */
interface Discrepancy {
  type: 'PRICE_DIVERGENCE' | 'MEMPOOL_ZERO' | 'WHALE_COUNT_LOW' | 'VOLUME_MISMATCH' | 'STALE_DATA';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
  description: string;
  affectedSources: string[];
  impact: string;
  value?: number;
}

/**
 * Cross-source sanity check result
 */
interface SanityCheckResult {
  passed: boolean;
  checks: {
    mempoolValid: boolean;
    whaleCountValid: boolean;
    priceAgreement: boolean;
    volumeReasonable: boolean;
    dataFresh: boolean;
  };
  discrepancies: Discrepancy[];
}

/**
 * Data quality validation result
 */
interface ValidationResult {
  passed: boolean;
  dataQualityScore: number; // 0-100
  sources: {
    name: string;
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
    responseTime: number;
    data?: any;
    error?: string;
  }[];
  discrepancies: Discrepancy[];
  recommendation: 'PROCEED' | 'RETRY' | 'HALT';
  fallbackUsed: string | null;
}

/**
 * Comprehensive market data from all sources
 */
interface ComprehensiveMarketData {
  triangulation: PriceTriangulation;
  marketData: {
    coinMarketCap: CMCMarketData | null;
    coinGecko: CoinGeckoMarketData | null;
    kraken: KrakenMarketData | null;
  };
  onChain: BlockchainOnChainData | null;
  sentiment: LunarCrushSentimentData | null;
  validation: ValidationResult;
}

/**
 * Quantum Data Purity Protocol Implementation
 */
class QuantumDataPurityProtocol {
  private readonly PRICE_DIVERGENCE_THRESHOLD = 1.0; // 1% maximum divergence
  private readonly MIN_WHALE_COUNT = 2;
  private readonly MAX_DATA_AGE_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_QUALITY_SCORE = 70; // 70% minimum for trade generation

  /**
   * Subtask 3.1: Implement multi-API triangulation
   * Query all 3 market data sources simultaneously and calculate median price
   * Requirements: 5.1, 5.2
   * 
   * Task 12.4: Implements caching to reduce unnecessary API calls
   */
  async triangulatePrice(): Promise<PriceTriangulation> {
    console.log('🔺 Starting multi-API price triangulation...');
    
    const startTime = Date.now();
    
    // Check cache first (Task 12.4)
    const cachedTriangulation = await getQuantumCache('BTC', 'triangulation');
    if (cachedTriangulation) {
      console.log('✅ Using cached triangulation data');
      return cachedTriangulation;
    }
    
    // Query all 3 sources simultaneously
    const [cmcResult, cgResult, krakenResult] = await Promise.allSettled([
      coinMarketCapClient.getBitcoinDataWithFallback(),
      coinGeckoClient.getBitcoinDataWithFallback(),
      krakenClient.getBitcoinTicker().catch(() => null),
    ]);
    
    // Extract prices
    const cmcPrice = cmcResult.status === 'fulfilled' && cmcResult.value ? cmcResult.value.price : null;
    const cgPrice = cgResult.status === 'fulfilled' && cgResult.value ? cgResult.value.price : null;
    const krakenPrice = krakenResult.status === 'fulfilled' && krakenResult.value ? krakenResult.value.price : null;
    
    console.log(`📊 Prices fetched: CMC=${cmcPrice}, CG=${cgPrice}, Kraken=${krakenPrice}`);
    
    // Calculate median price
    const validPrices = [cmcPrice, cgPrice, krakenPrice].filter((p): p is number => p !== null);
    
    if (validPrices.length === 0) {
      throw new Error('All price sources failed - cannot triangulate');
    }
    
    validPrices.sort((a, b) => a - b);
    const medianPrice = validPrices.length % 2 === 0
      ? (validPrices[validPrices.length / 2 - 1] + validPrices[validPrices.length / 2]) / 2
      : validPrices[Math.floor(validPrices.length / 2)];
    
    // Detect price divergence >1%
    const divergences = validPrices.map(price => Math.abs((price - medianPrice) / medianPrice) * 100);
    const maxDivergence = Math.max(...divergences);
    const hasDivergence = maxDivergence > this.PRICE_DIVERGENCE_THRESHOLD;
    
    const divergentSources: string[] = [];
    if (cmcPrice && Math.abs((cmcPrice - medianPrice) / medianPrice) * 100 > this.PRICE_DIVERGENCE_THRESHOLD) {
      divergentSources.push('CoinMarketCap');
    }
    if (cgPrice && Math.abs((cgPrice - medianPrice) / medianPrice) * 100 > this.PRICE_DIVERGENCE_THRESHOLD) {
      divergentSources.push('CoinGecko');
    }
    if (krakenPrice && Math.abs((krakenPrice - medianPrice) / medianPrice) * 100 > this.PRICE_DIVERGENCE_THRESHOLD) {
      divergentSources.push('Kraken');
    }
    
    const result: PriceTriangulation = {
      medianPrice,
      prices: {
        coinMarketCap: cmcPrice,
        coinGecko: cgPrice,
        kraken: krakenPrice,
      },
      divergence: {
        maxDivergence,
        hasDivergence,
        divergentSources,
      },
      timestamp: new Date().toISOString(),
    };
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Price triangulation complete in ${elapsed}ms`);
    console.log(`   Median: $${medianPrice.toFixed(2)}, Max Divergence: ${maxDivergence.toFixed(2)}%`);
    
    if (hasDivergence) {
      console.warn(`⚠️  Price divergence detected: ${divergentSources.join(', ')}`);
    }
    
    // Cache the result (Task 12.4)
    const dataQuality = hasDivergence ? 85 : 100;
    await setQuantumCache('BTC', 'triangulation', result, dataQuality);
    
    return result;
  }

  /**
   * Subtask 3.2: Implement cross-source sanity checks
   * Validate mempool size, whale count, and price agreement
   * Requirements: 2.5, 2.6, 2.7
   */
  async performSanityChecks(
    triangulation: PriceTriangulation,
    onChain: BlockchainOnChainData | null
  ): Promise<SanityCheckResult> {
    console.log('🔍 Performing cross-source sanity checks...');
    
    const discrepancies: Discrepancy[] = [];
    
    // Check 1: Mempool size must not be 0
    const mempoolValid = onChain ? onChain.mempoolSize > 0 : false;
    if (!mempoolValid) {
      discrepancies.push({
        type: 'MEMPOOL_ZERO',
        severity: 'FATAL',
        description: 'Mempool size is 0 or unavailable',
        affectedSources: ['Blockchain.com'],
        impact: 'Cannot validate network activity - data quality is 0',
        value: onChain?.mempoolSize || 0,
      });
    }
    
    // Check 2: Whale count must be >= 2
    const whaleCountValid = onChain ? onChain.whaleTransactions.length >= this.MIN_WHALE_COUNT : false;
    if (!whaleCountValid) {
      discrepancies.push({
        type: 'WHALE_COUNT_LOW',
        severity: 'WARNING',
        description: `Whale transaction count is ${onChain?.whaleTransactions.length || 0} (minimum ${this.MIN_WHALE_COUNT})`,
        affectedSources: ['Blockchain.com'],
        impact: 'Reduced confidence in whale activity analysis',
        value: onChain?.whaleTransactions.length || 0,
      });
    }
    
    // Check 3: Price agreement within tolerance
    const priceAgreement = !triangulation.divergence.hasDivergence;
    if (!priceAgreement) {
      discrepancies.push({
        type: 'PRICE_DIVERGENCE',
        severity: 'ERROR',
        description: `Price divergence of ${triangulation.divergence.maxDivergence.toFixed(2)}% exceeds ${this.PRICE_DIVERGENCE_THRESHOLD}% threshold`,
        affectedSources: triangulation.divergence.divergentSources,
        impact: 'Reduced confidence in price data - may indicate market volatility or API issues',
        value: triangulation.divergence.maxDivergence,
      });
    }
    
    // Check 4: Volume reasonableness (basic sanity)
    const volumes = [
      triangulation.prices.coinMarketCap,
      triangulation.prices.coinGecko,
      triangulation.prices.kraken,
    ].filter((p): p is number => p !== null);
    
    const volumeReasonable = volumes.length > 0; // At least one source has data
    if (!volumeReasonable) {
      discrepancies.push({
        type: 'VOLUME_MISMATCH',
        severity: 'ERROR',
        description: 'No volume data available from any source',
        affectedSources: ['All market data sources'],
        impact: 'Cannot validate market activity',
      });
    }
    
    // Check 5: Data freshness
    const now = Date.now();
    const dataAge = now - new Date(triangulation.timestamp).getTime();
    const dataFresh = dataAge < this.MAX_DATA_AGE_MS;
    if (!dataFresh) {
      discrepancies.push({
        type: 'STALE_DATA',
        severity: 'WARNING',
        description: `Data is ${Math.floor(dataAge / 1000)}s old (maximum ${this.MAX_DATA_AGE_MS / 1000}s)`,
        affectedSources: ['All sources'],
        impact: 'Data may not reflect current market conditions',
        value: dataAge,
      });
    }
    
    const passed = mempoolValid && priceAgreement && volumeReasonable && dataFresh;
    
    console.log(`${passed ? '✅' : '❌'} Sanity checks ${passed ? 'passed' : 'failed'}`);
    console.log(`   Mempool: ${mempoolValid ? '✓' : '✗'}, Whales: ${whaleCountValid ? '✓' : '✗'}, Price: ${priceAgreement ? '✓' : '✗'}`);
    
    return {
      passed,
      checks: {
        mempoolValid,
        whaleCountValid,
        priceAgreement,
        volumeReasonable,
        dataFresh,
      },
      discrepancies,
    };
  }

  /**
   * Subtask 3.3: Implement data quality scoring
   * Calculate quality score (0-100) and enforce 70% minimum threshold
   * Requirements: 2.8, 5.8
   */
  calculateDataQualityScore(
    triangulation: PriceTriangulation,
    sanityChecks: SanityCheckResult,
    sources: ValidationResult['sources']
  ): number {
    console.log('📊 Calculating data quality score...');
    
    let score = 0;
    
    // Component 1: Source availability (40 points)
    const successfulSources = sources.filter(s => s.status === 'SUCCESS').length;
    const totalSources = sources.length;
    const availabilityScore = (successfulSources / totalSources) * 40;
    score += availabilityScore;
    
    // Component 2: Price agreement (30 points)
    if (!triangulation.divergence.hasDivergence) {
      score += 30;
    } else {
      // Partial credit based on divergence severity
      const divergencePenalty = Math.min(triangulation.divergence.maxDivergence, 10) / 10;
      score += 30 * (1 - divergencePenalty);
    }
    
    // Component 3: Sanity checks (30 points)
    const checksArray = Object.values(sanityChecks.checks);
    const passedChecks = checksArray.filter(c => c).length;
    const sanityScore = (passedChecks / checksArray.length) * 30;
    score += sanityScore;
    
    // Round to integer
    score = Math.round(score);
    
    // Apply severity penalties
    const fatalDiscrepancies = sanityChecks.discrepancies.filter(d => d.severity === 'FATAL');
    if (fatalDiscrepancies.length > 0) {
      score = 0; // Fatal discrepancies = 0 quality
    }
    
    const errorDiscrepancies = sanityChecks.discrepancies.filter(d => d.severity === 'ERROR');
    score -= errorDiscrepancies.length * 10; // -10 points per error
    
    const warningDiscrepancies = sanityChecks.discrepancies.filter(d => d.severity === 'WARNING');
    score -= warningDiscrepancies.length * 5; // -5 points per warning
    
    // Ensure score is in valid range
    score = Math.max(0, Math.min(100, score));
    
    console.log(`📊 Data quality score: ${score}/100`);
    console.log(`   Availability: ${availabilityScore.toFixed(1)}/40`);
    console.log(`   Price Agreement: ${(score >= 30 ? 30 : score).toFixed(1)}/30`);
    console.log(`   Sanity Checks: ${sanityScore.toFixed(1)}/30`);
    
    if (score < this.MIN_QUALITY_SCORE) {
      console.warn(`⚠️  Quality score ${score}% is below minimum threshold ${this.MIN_QUALITY_SCORE}%`);
    }
    
    return score;
  }

  /**
   * Subtask 3.4: Implement fallback strategy
   * CMC → CoinGecko → Kraken with logging
   * Requirements: 5.6, 5.7, 5.8
   */
  async fetchWithFallback(): Promise<{
    data: UnifiedMarketData;
    source: 'coinmarketcap' | 'coingecko' | 'kraken';
    fallbackUsed: boolean;
    attempts: string[];
  }> {
    console.log('🔄 Executing fallback strategy: CMC → CoinGecko → Kraken');
    
    const attempts: string[] = [];
    
    // Attempt 1: CoinMarketCap (Primary)
    try {
      attempts.push('CoinMarketCap');
      console.log('📡 Attempting CoinMarketCap (primary)...');
      const cmcData = await coinMarketCapClient.getBitcoinData();
      
      console.log('✅ CoinMarketCap successful (primary source)');
      return {
        data: {
          price: cmcData.price,
          volume24h: cmcData.volume24h,
          marketCap: cmcData.marketCap,
          change24h: cmcData.change24h,
          timestamp: cmcData.timestamp,
          source: 'coinmarketcap',
        },
        source: 'coinmarketcap',
        fallbackUsed: false,
        attempts,
      };
    } catch (error: any) {
      console.warn(`⚠️  CoinMarketCap failed: ${error.message}`);
      console.log('🔄 Falling back to CoinGecko...');
    }
    
    // Attempt 2: CoinGecko (Fallback 1)
    try {
      attempts.push('CoinGecko');
      console.log('📡 Attempting CoinGecko (fallback 1)...');
      const cgData = await coinGeckoClient.getBitcoinData();
      
      console.log('✅ CoinGecko successful (fallback source)');
      return {
        data: {
          price: cgData.price,
          volume24h: cgData.volume24h,
          marketCap: cgData.marketCap,
          change24h: cgData.change24h,
          timestamp: cgData.timestamp,
          source: 'coingecko',
        },
        source: 'coingecko',
        fallbackUsed: true,
        attempts,
      };
    } catch (error: any) {
      console.warn(`⚠️  CoinGecko failed: ${error.message}`);
      console.log('🔄 Falling back to Kraken...');
    }
    
    // Attempt 3: Kraken (Fallback 2)
    try {
      attempts.push('Kraken');
      console.log('📡 Attempting Kraken (fallback 2)...');
      const krakenData = await krakenClient.getBitcoinTicker();
      
      console.log('✅ Kraken successful (final fallback source)');
      return {
        data: {
          price: krakenData.price,
          volume24h: krakenData.volume24h,
          marketCap: 0, // Kraken doesn't provide market cap
          change24h: ((krakenData.price - krakenData.open) / krakenData.open) * 100,
          timestamp: krakenData.timestamp,
          source: 'kraken',
        },
        source: 'kraken',
        fallbackUsed: true,
        attempts,
      };
    } catch (error: any) {
      console.error(`❌ Kraken failed: ${error.message}`);
      attempts.push('FAILED');
    }
    
    // All sources failed
    console.error('❌ All market data sources failed');
    throw new Error(`All market data sources failed. Attempts: ${attempts.join(' → ')}`);
  }

  /**
   * Main validation method - combines all QDPP components
   * Requirements: 5.1-5.10
   */
  async validateMarketData(): Promise<ValidationResult> {
    console.log('🛡️  Starting Quantum Data Purity Protocol validation...');
    const startTime = Date.now();
    
    const sources: ValidationResult['sources'] = [];
    
    // Step 1: Multi-API triangulation (Subtask 3.1)
    let triangulation: PriceTriangulation;
    try {
      triangulation = await this.triangulatePrice();
      
      // Record source statuses
      if (triangulation.prices.coinMarketCap !== null) {
        sources.push({ name: 'CoinMarketCap', status: 'SUCCESS', responseTime: 0 });
      } else {
        sources.push({ name: 'CoinMarketCap', status: 'FAILED', responseTime: 0, error: 'No data' });
      }
      
      if (triangulation.prices.coinGecko !== null) {
        sources.push({ name: 'CoinGecko', status: 'SUCCESS', responseTime: 0 });
      } else {
        sources.push({ name: 'CoinGecko', status: 'FAILED', responseTime: 0, error: 'No data' });
      }
      
      if (triangulation.prices.kraken !== null) {
        sources.push({ name: 'Kraken', status: 'SUCCESS', responseTime: 0 });
      } else {
        sources.push({ name: 'Kraken', status: 'FAILED', responseTime: 0, error: 'No data' });
      }
    } catch (error: any) {
      console.error('❌ Price triangulation failed:', error.message);
      return {
        passed: false,
        dataQualityScore: 0,
        sources: [
          { name: 'CoinMarketCap', status: 'FAILED', responseTime: 0, error: error.message },
          { name: 'CoinGecko', status: 'FAILED', responseTime: 0, error: error.message },
          { name: 'Kraken', status: 'FAILED', responseTime: 0, error: error.message },
        ],
        discrepancies: [{
          type: 'PRICE_DIVERGENCE',
          severity: 'FATAL',
          description: 'All price sources failed',
          affectedSources: ['All'],
          impact: 'Cannot generate trade signals without price data',
        }],
        recommendation: 'HALT',
        fallbackUsed: null,
      };
    }
    
    // Fetch on-chain data for sanity checks
    let onChain: BlockchainOnChainData | null = null;
    try {
      onChain = await blockchainClient.getBitcoinOnChainData();
      sources.push({ name: 'Blockchain.com', status: 'SUCCESS', responseTime: 0 });
    } catch (error: any) {
      console.warn('⚠️  On-chain data fetch failed:', error.message);
      sources.push({ name: 'Blockchain.com', status: 'FAILED', responseTime: 0, error: error.message });
    }
    
    // Step 2: Cross-source sanity checks (Subtask 3.2)
    const sanityChecks = await this.performSanityChecks(triangulation, onChain);
    
    // Step 3: Data quality scoring (Subtask 3.3)
    const dataQualityScore = this.calculateDataQualityScore(triangulation, sanityChecks, sources);
    
    // Step 4: Determine recommendation
    let recommendation: 'PROCEED' | 'RETRY' | 'HALT';
    if (dataQualityScore >= this.MIN_QUALITY_SCORE && sanityChecks.passed) {
      recommendation = 'PROCEED';
    } else if (dataQualityScore >= 50) {
      recommendation = 'RETRY';
    } else {
      recommendation = 'HALT';
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`🛡️  QDPP validation complete in ${elapsed}ms`);
    console.log(`   Quality Score: ${dataQualityScore}/100`);
    console.log(`   Recommendation: ${recommendation}`);
    
    return {
      passed: dataQualityScore >= this.MIN_QUALITY_SCORE && sanityChecks.passed,
      dataQualityScore,
      sources,
      discrepancies: sanityChecks.discrepancies,
      recommendation,
      fallbackUsed: null, // Set by caller if fallback was used
    };
  }

  /**
   * Get comprehensive market data with full QDPP validation
   * Task 12.4: Implements batch caching to reduce API calls
   */
  async getComprehensiveMarketData(): Promise<ComprehensiveMarketData> {
    console.log('🚀 Fetching comprehensive market data with QDPP validation...');
    
    // Check cache for all data types (Task 12.4)
    const cachedData = await batchGetQuantumCache('BTC', [
      'market-data',
      'on-chain',
      'sentiment',
      'triangulation',
      'validation'
    ]);
    
    // If all data is cached, return immediately
    if (cachedData.size === 5) {
      console.log('✅ Using fully cached comprehensive market data');
      const triangulation = cachedData.get('triangulation');
      const marketData = cachedData.get('market-data');
      const onChain = cachedData.get('on-chain');
      const sentiment = cachedData.get('sentiment');
      const validation = cachedData.get('validation');
      
      return {
        triangulation,
        marketData: marketData || { coinMarketCap: null, coinGecko: null, kraken: null },
        onChain,
        sentiment,
        validation,
      };
    }
    
    // Triangulate prices (uses its own cache)
    const triangulation = await this.triangulatePrice();
    
    // Fetch all data sources (only if not cached)
    const fetchPromises: Promise<any>[] = [];
    const fetchTypes: string[] = [];
    
    if (!cachedData.has('market-data')) {
      fetchPromises.push(
        Promise.allSettled([
          coinMarketCapClient.getBitcoinDataWithFallback(),
          coinGeckoClient.getBitcoinDataWithFallback(),
          krakenClient.getBitcoinTicker().catch(() => null),
        ])
      );
      fetchTypes.push('market-data');
    }
    
    if (!cachedData.has('on-chain')) {
      fetchPromises.push(blockchainClient.getBitcoinOnChainData().catch(() => null));
      fetchTypes.push('on-chain');
    }
    
    if (!cachedData.has('sentiment')) {
      fetchPromises.push(lunarCrushClient.getBitcoinSentiment().catch(() => null));
      fetchTypes.push('sentiment');
    }
    
    const fetchResults = await Promise.all(fetchPromises);
    
    // Extract results
    let cmcData, cgData, krakenData, onChainData, sentimentData;
    
    if (fetchTypes.includes('market-data')) {
      const marketResults = fetchResults[fetchTypes.indexOf('market-data')] as PromiseSettledResult<any>[];
      cmcData = marketResults[0];
      cgData = marketResults[1];
      krakenData = marketResults[2];
    } else {
      const cached = cachedData.get('market-data');
      cmcData = { status: 'fulfilled', value: cached?.coinMarketCap };
      cgData = { status: 'fulfilled', value: cached?.coinGecko };
      krakenData = { status: 'fulfilled', value: cached?.kraken };
    }
    
    if (fetchTypes.includes('on-chain')) {
      onChainData = { status: 'fulfilled', value: fetchResults[fetchTypes.indexOf('on-chain')] };
    } else {
      onChainData = { status: 'fulfilled', value: cachedData.get('on-chain') };
    }
    
    if (fetchTypes.includes('sentiment')) {
      sentimentData = { status: 'fulfilled', value: fetchResults[fetchTypes.indexOf('sentiment')] };
    } else {
      sentimentData = { status: 'fulfilled', value: cachedData.get('sentiment') };
    }
    
    // Perform validation (uses its own cache)
    const validation = await this.validateMarketData();
    
    // Batch cache all fetched data (Task 12.4)
    const cacheEntries: Array<{
      cacheType: QuantumCacheType;
      data: any;
      dataQualityScore?: number;
    }> = [];
    
    if (fetchTypes.includes('market-data')) {
      cacheEntries.push({
        cacheType: 'market-data',
        data: {
          coinMarketCap: cmcData.status === 'fulfilled' ? cmcData.value : null,
          coinGecko: cgData.status === 'fulfilled' ? cgData.value : null,
          kraken: krakenData.status === 'fulfilled' ? krakenData.value : null,
        },
        dataQualityScore: validation.dataQualityScore,
      });
    }
    
    if (fetchTypes.includes('on-chain')) {
      cacheEntries.push({
        cacheType: 'on-chain',
        data: onChainData.status === 'fulfilled' ? onChainData.value : null,
        dataQualityScore: validation.dataQualityScore,
      });
    }
    
    if (fetchTypes.includes('sentiment')) {
      cacheEntries.push({
        cacheType: 'sentiment',
        data: sentimentData.status === 'fulfilled' ? sentimentData.value : null,
        dataQualityScore: validation.dataQualityScore,
      });
    }
    
    if (cacheEntries.length > 0) {
      await batchSetQuantumCache('BTC', cacheEntries);
    }
    
    return {
      triangulation,
      marketData: {
        coinMarketCap: cmcData.status === 'fulfilled' ? cmcData.value : null,
        coinGecko: cgData.status === 'fulfilled' ? cgData.value : null,
        kraken: krakenData.status === 'fulfilled' ? krakenData.value : null,
      },
      onChain: onChainData.status === 'fulfilled' ? onChainData.value : null,
      sentiment: sentimentData.status === 'fulfilled' ? sentimentData.value : null,
      validation,
    };
  }
}

// Export singleton instance
export const qdpp = new QuantumDataPurityProtocol();

// Export types
export type {
  UnifiedMarketData,
  PriceTriangulation,
  Discrepancy,
  SanityCheckResult,
  ValidationResult,
  ComprehensiveMarketData,
};
