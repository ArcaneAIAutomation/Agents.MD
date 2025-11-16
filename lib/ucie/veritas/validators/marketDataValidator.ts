/**
 * Market Data Validator
 * 
 * Cross-validates market data from multiple sources (CoinMarketCap, CoinGecko, Kraken)
 * with Zod schema validation and dynamic trust weighting.
 * 
 * Includes volume consistency validation and arbitrage detection (Task 8).
 * 
 * Requirements: 1.1, 1.2, 1.3, 9.1, 13.1, 14.1
 */

import {
  fetchWithValidation,
  CoinGeckoMarketDataSchema,
  CoinMarketCapQuoteSchema,
  KrakenTickerSchema,
  type CoinGeckoMarketData,
  type CoinMarketCapQuote,
  type KrakenTicker
} from '../schemas/apiSchemas';
import { getSourceReliabilityTracker } from '../utils/sourceReliabilityTracker';
import { sendEmail } from '../../../email/office365';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationAlert {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  type: 'market' | 'social' | 'onchain' | 'news';
  message: string;
  affectedSources: string[];
  recommendation: string;
}

export interface Discrepancy {
  metric: string;
  sources: { name: string; value: any }[];
  variance: number;
  threshold: number;
  exceeded: boolean;
}

export interface DataQualitySummary {
  overallScore: number; // 0-100
  marketDataQuality: number;
  socialDataQuality: number;
  onChainDataQuality: number;
  newsDataQuality: number;
  passedChecks: string[];
  failedChecks: string[];
}

export interface VeritasValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  alerts: ValidationAlert[];
  discrepancies: Discrepancy[];
  dataQualitySummary: DataQualitySummary;
}

interface MarketDataSource {
  name: string;
  price: number;
  volume24h: number;
  trustWeight: number;
}

// ============================================================================
// API Configuration
// ============================================================================

const APIS = {
  coinmarketcap: 'https://pro-api.coinmarketcap.com/v1',
  coingecko: 'https://api.coingecko.com/api/v3',
  kraken: 'https://api.kraken.com/0/public'
};

const SYMBOL_MAP: Record<string, { 
  coingecko: string; 
  kraken: string; 
  cmcId: number 
}> = {
  'BTC': { coingecko: 'bitcoin', kraken: 'XXBTZUSD', cmcId: 1 },
  'ETH': { coingecko: 'ethereum', kraken: 'XETHZUSD', cmcId: 1027 },
  'XRP': { coingecko: 'ripple', kraken: 'XXRPZUSD', cmcId: 52 },
  'SOL': { coingecko: 'solana', kraken: 'SOLUSD', cmcId: 5426 },
  'ADA': { coingecko: 'cardano', kraken: 'ADAUSD', cmcId: 2010 }
};

// ============================================================================
// Validation Thresholds
// ============================================================================

const THRESHOLDS = {
  PRICE_DISCREPANCY: 0.015, // 1.5%
  VOLUME_DISCREPANCY: 0.10, // 10%
  CRITICAL_DISCREPANCY: 0.05, // 5% (triggers email alert)
  ARBITRAGE_OPPORTUNITY: 0.02 // 2%
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate variance across multiple values
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Return as percentage of mean
  return Math.sqrt(variance) / mean;
}

/**
 * Calculate weighted average price
 */
function calculateWeightedAverage(sources: MarketDataSource[]): number {
  const totalWeight = sources.reduce((sum, s) => sum + s.trustWeight, 0);
  const weightedSum = sources.reduce((sum, s) => sum + (s.price * s.trustWeight), 0);
  
  return weightedSum / totalWeight;
}

/**
 * Calculate weighted average volume
 */
function calculateWeightedAverageVolume(sources: MarketDataSource[]): number {
  const totalWeight = sources.reduce((sum, s) => sum + s.trustWeight, 0);
  const weightedSum = sources.reduce((sum, s) => sum + (s.volume24h * s.trustWeight), 0);
  
  return weightedSum / totalWeight;
}

/**
 * Send email alert for critical discrepancies
 */
async function sendCriticalDiscrepancyAlert(
  symbol: string,
  discrepancy: Discrepancy,
  variance: number
): Promise<void> {
  const subject = `[CRITICAL] Veritas Protocol: ${symbol} ${discrepancy.metric} Discrepancy ${(variance * 100).toFixed(2)}%`;
  
  const sourcesHtml = discrepancy.sources
    .map(s => `<li><strong>${s.name}:</strong> ${typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</li>`)
    .join('');
  
  const body = `
    <h2>Critical Market Data Discrepancy Detected</h2>
    <p><strong>Symbol:</strong> ${symbol}</p>
    <p><strong>Metric:</strong> ${discrepancy.metric}</p>
    <p><strong>Variance:</strong> ${(variance * 100).toFixed(2)}%</p>
    <p><strong>Threshold:</strong> ${(discrepancy.threshold * 100).toFixed(2)}%</p>
    
    <h3>Data Sources</h3>
    <ul>
      ${sourcesHtml}
    </ul>
    
    <h3>Recommendation</h3>
    <p>Using weighted average with dynamic trust scores for final determination.</p>
    
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    
    <hr>
    <p><small>This is an automated alert from the Veritas Protocol market data validation system.</small></p>
  `;
  
  try {
    await sendEmail({
      to: ['no-reply@arcane.group'],
      subject,
      html: body
    });
    
    console.log(`✅ Critical discrepancy alert sent for ${symbol} (${discrepancy.metric})`);
  } catch (error) {
    console.error('❌ Failed to send critical discrepancy alert:', error);
    // Don't throw - email failure shouldn't break validation
  }
}

// ============================================================================
// API Fetchers with Zod Validation
// ============================================================================

/**
 * Fetch price and volume from CoinMarketCap with Zod validation
 */
async function fetchCoinMarketCapData(symbol: string): Promise<{ price: number; volume24h: number } | null> {
  const symbolInfo = SYMBOL_MAP[symbol];
  if (!symbolInfo) {
    console.warn(`Symbol ${symbol} not supported for CoinMarketCap`);
    return null;
  }
  
  if (!process.env.COINMARKETCAP_API_KEY) {
    console.warn('CoinMarketCap API key not configured');
    return null;
  }
  
  const result = await fetchWithValidation(
    async () => {
      const response = await fetch(
        `${APIS.coinmarketcap}/cryptocurrency/quotes/latest?id=${symbolInfo.cmcId}&convert=USD`,
        {
          signal: AbortSignal.timeout(8000),
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY!,
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    CoinMarketCapQuoteSchema,
    'CoinMarketCap'
  );
  
  if (result.success && result.data) {
    const coinData = result.data.data[symbolInfo.cmcId];
    return {
      price: coinData.quote.USD.price,
      volume24h: coinData.quote.USD.volume_24h
    };
  }
  
  console.error(`CoinMarketCap validation failed: ${result.error}`);
  return null;
}

/**
 * Fetch price and volume from CoinGecko with Zod validation
 */
async function fetchCoinGeckoData(symbol: string): Promise<{ price: number; volume24h: number } | null> {
  const symbolInfo = SYMBOL_MAP[symbol];
  if (!symbolInfo) {
    console.warn(`Symbol ${symbol} not supported for CoinGecko`);
    return null;
  }
  
  const result = await fetchWithValidation(
    async () => {
      const response = await fetch(
        `${APIS.coingecko}/coins/${symbolInfo.coingecko}?localization=false&tickers=false&community_data=false&developer_data=false`,
        {
          signal: AbortSignal.timeout(8000),
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    CoinGeckoMarketDataSchema,
    'CoinGecko'
  );
  
  if (result.success && result.data) {
    return {
      price: result.data.market_data.current_price.usd,
      volume24h: result.data.market_data.total_volume.usd
    };
  }
  
  console.error(`CoinGecko validation failed: ${result.error}`);
  return null;
}

/**
 * Fetch price and volume from Kraken with Zod validation
 */
async function fetchKrakenData(symbol: string): Promise<{ price: number; volume24h: number } | null> {
  const symbolInfo = SYMBOL_MAP[symbol];
  if (!symbolInfo) {
    console.warn(`Symbol ${symbol} not supported for Kraken`);
    return null;
  }
  
  const result = await fetchWithValidation(
    async () => {
      const response = await fetch(
        `${APIS.kraken}/Ticker?pair=${symbolInfo.kraken}`,
        {
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'UCIE-Veritas/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    KrakenTickerSchema,
    'Kraken'
  );
  
  if (result.success && result.data) {
    const ticker = result.data.result[Object.keys(result.data.result)[0]];
    const price = parseFloat(ticker.c[0]);
    const volume24h = parseFloat(ticker.v[1]); // 24h volume in base currency
    
    // Convert volume to USD (multiply by price)
    return {
      price,
      volume24h: volume24h * price
    };
  }
  
  console.error(`Kraken validation failed: ${result.error}`);
  return null;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate market data across multiple sources with Zod validation
 * and dynamic trust weighting.
 * 
 * Includes:
 * - Price consistency validation
 * - Volume consistency validation (Task 8)
 * - Arbitrage opportunity detection (Task 8)
 * 
 * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param existingData - Optional existing market data for comparison
 * @returns Validation result with alerts, discrepancies, and quality summary
 */
export async function validateMarketData(
  symbol: string,
  existingData?: any
): Promise<VeritasValidationResult> {
  console.log(`🔍 Veritas: Validating market data for ${symbol}...`);
  
  const alerts: ValidationAlert[] = [];
  const discrepancies: Discrepancy[] = [];
  
  // Get source reliability tracker instance
  const sourceReliabilityTracker = await getSourceReliabilityTracker();
  
  // Fetch prices and volumes from all sources in parallel with Zod validation
  const [cmcData, cgData, krakenData] = await Promise.all([
    fetchCoinMarketCapData(symbol),
    fetchCoinGeckoData(symbol),
    fetchKrakenData(symbol)
  ]);
  
  // Build market data sources with dynamic trust weights
  const marketDataSources: MarketDataSource[] = [];
  
  if (cmcData !== null) {
    marketDataSources.push({
      name: 'CoinMarketCap',
      price: cmcData.price,
      volume24h: cmcData.volume24h,
      trustWeight: sourceReliabilityTracker.getTrustWeight('CoinMarketCap')
    });
    await sourceReliabilityTracker.updateReliability('CoinMarketCap', 'pass');
  } else {
    await sourceReliabilityTracker.updateReliability('CoinMarketCap', 'fail');
  }
  
  if (cgData !== null) {
    marketDataSources.push({
      name: 'CoinGecko',
      price: cgData.price,
      volume24h: cgData.volume24h,
      trustWeight: sourceReliabilityTracker.getTrustWeight('CoinGecko')
    });
    await sourceReliabilityTracker.updateReliability('CoinGecko', 'pass');
  } else {
    await sourceReliabilityTracker.updateReliability('CoinGecko', 'fail');
  }
  
  if (krakenData !== null) {
    marketDataSources.push({
      name: 'Kraken',
      price: krakenData.price,
      volume24h: krakenData.volume24h,
      trustWeight: sourceReliabilityTracker.getTrustWeight('Kraken')
    });
    await sourceReliabilityTracker.updateReliability('Kraken', 'pass');
  } else {
    await sourceReliabilityTracker.updateReliability('Kraken', 'fail');
  }
  
  // Check if we have enough sources
  if (marketDataSources.length === 0) {
    alerts.push({
      severity: 'fatal',
      type: 'market',
      message: 'All market data sources failed validation',
      affectedSources: ['CoinMarketCap', 'CoinGecko', 'Kraken'],
      recommendation: 'Check API connectivity and credentials'
    });
    
    return {
      isValid: false,
      confidence: 0,
      alerts,
      discrepancies: [],
      dataQualitySummary: {
        overallScore: 0,
        marketDataQuality: 0,
        socialDataQuality: 0,
        onChainDataQuality: 0,
        newsDataQuality: 0,
        passedChecks: [],
        failedChecks: ['market_data_availability']
      }
    };
  }
  
  // ============================================================================
  // PRICE CONSISTENCY VALIDATION
  // ============================================================================
  
  const prices = marketDataSources.map(s => s.price);
  const priceVariance = calculateVariance(prices);
  
  console.log(`📊 Price variance: ${(priceVariance * 100).toFixed(3)}%`);
  console.log(`📊 Sources: ${marketDataSources.map(s => `${s.name}=$${s.price.toFixed(2)} (weight=${s.trustWeight})`).join(', ')}`);
  
  // Check for price discrepancies exceeding 1.5% threshold
  if (priceVariance > THRESHOLDS.PRICE_DISCREPANCY) {
    const discrepancy: Discrepancy = {
      metric: 'price',
      sources: marketDataSources.map(s => ({ name: s.name, value: s.price })),
      variance: priceVariance,
      threshold: THRESHOLDS.PRICE_DISCREPANCY,
      exceeded: true
    };
    
    discrepancies.push(discrepancy);
    
    // Update reliability tracker with deviation
    for (const source of marketDataSources) {
      const deviation = Math.abs(source.price - calculateWeightedAverage(marketDataSources)) / source.price;
      if (deviation > THRESHOLDS.PRICE_DISCREPANCY) {
        await sourceReliabilityTracker.updateReliability(source.name, 'deviation', deviation);
      }
    }
    
    // Determine severity based on variance
    const severity = priceVariance > THRESHOLDS.CRITICAL_DISCREPANCY ? 'error' : 'warning';
    
    alerts.push({
      severity,
      type: 'market',
      message: `Price discrepancy detected: ${(priceVariance * 100).toFixed(2)}% variance across sources`,
      affectedSources: marketDataSources.map(s => s.name),
      recommendation: 'Using weighted average with dynamic trust scores for final price determination'
    });
    
    // Send email alert for critical discrepancies (>5%)
    if (priceVariance > THRESHOLDS.CRITICAL_DISCREPANCY) {
      console.log(`🚨 Critical price discrepancy detected: ${(priceVariance * 100).toFixed(2)}%`);
      await sendCriticalDiscrepancyAlert(symbol, discrepancy, priceVariance);
    }
  }

  // ============================================================================
  // VOLUME CONSISTENCY VALIDATION (Task 8)
  // ============================================================================
  
  const volumes = marketDataSources.map(s => s.volume24h);
  const volumeVariance = calculateVariance(volumes);
  
  console.log(`📊 Volume variance: ${(volumeVariance * 100).toFixed(3)}%`);
  console.log(`📊 Volumes: ${marketDataSources.map(s => `${s.name}=$${(s.volume24h / 1e9).toFixed(2)}B (weight=${s.trustWeight})`).join(', ')}`);
  
  // Check for volume discrepancies exceeding 10% threshold
  if (volumeVariance > THRESHOLDS.VOLUME_DISCREPANCY) {
    const volumeDiscrepancy: Discrepancy = {
      metric: 'volume_24h',
      sources: marketDataSources.map(s => ({ name: s.name, value: s.volume24h })),
      variance: volumeVariance,
      threshold: THRESHOLDS.VOLUME_DISCREPANCY,
      exceeded: true
    };
    
    discrepancies.push(volumeDiscrepancy);
    
    // Update reliability tracker with volume deviation
    for (const source of marketDataSources) {
      const deviation = Math.abs(source.volume24h - calculateWeightedAverageVolume(marketDataSources)) / source.volume24h;
      if (deviation > THRESHOLDS.VOLUME_DISCREPANCY) {
        await sourceReliabilityTracker.updateReliability(source.name, 'deviation', deviation);
      }
    }
    
    // Flag misaligned sources
    const avgVolume = calculateWeightedAverageVolume(marketDataSources);
    const misalignedSources = marketDataSources.filter(s => {
      const deviation = Math.abs(s.volume24h - avgVolume) / avgVolume;
      return deviation > THRESHOLDS.VOLUME_DISCREPANCY;
    });
    
    alerts.push({
      severity: 'warning',
      type: 'market',
      message: `Volume discrepancy detected: ${(volumeVariance * 100).toFixed(2)}% variance across sources`,
      affectedSources: misalignedSources.map(s => s.name),
      recommendation: `Misaligned sources: ${misalignedSources.map(s => s.name).join(', ')}. Using weighted average for final volume.`
    });
    
    console.log(`⚠️ Volume discrepancy: ${(volumeVariance * 100).toFixed(2)}%`);
    console.log(`   Misaligned sources: ${misalignedSources.map(s => s.name).join(', ')}`);
  }
  
  // ============================================================================
  // ARBITRAGE OPPORTUNITY DETECTION (Task 8)
  // ============================================================================
  
  if (marketDataSources.length >= 2) {
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const spread = (maxPrice - minPrice) / minPrice;
    
    // Detect profitable arbitrage opportunities (>2% spread)
    if (spread > THRESHOLDS.ARBITRAGE_OPPORTUNITY) {
      const maxSource = marketDataSources.find(s => s.price === maxPrice);
      const minSource = marketDataSources.find(s => s.price === minPrice);
      
      // Calculate potential profit percentage
      const profitPercent = spread * 100;
      
      alerts.push({
        severity: 'info',
        type: 'market',
        message: `Arbitrage opportunity detected: ${profitPercent.toFixed(2)}% spread between ${minSource?.name} and ${maxSource?.name}`,
        affectedSources: [minSource?.name || 'unknown', maxSource?.name || 'unknown'],
        recommendation: `Potential profit: ${profitPercent.toFixed(2)}%. Buy on ${minSource?.name} at $${minPrice.toFixed(2)}, sell on ${maxSource?.name} at $${maxPrice.toFixed(2)}`
      });
      
      console.log(`💰 Arbitrage opportunity: ${profitPercent.toFixed(2)}% profit potential`);
      console.log(`   Buy: ${minSource?.name} @ $${minPrice.toFixed(2)}`);
      console.log(`   Sell: ${maxSource?.name} @ $${maxPrice.toFixed(2)}`);
    }
  }
  
  // ============================================================================
  // DATA QUALITY SCORING
  // ============================================================================
  
  const successRate = marketDataSources.length / 3; // 3 total sources
  const priceVariancePenalty = Math.min(priceVariance * 100, 30); // Max 30 point penalty
  const volumeVariancePenalty = Math.min(volumeVariance * 50, 20); // Max 20 point penalty
  const marketDataQuality = Math.max(0, (successRate * 100) - priceVariancePenalty - volumeVariancePenalty);
  
  const passedChecks: string[] = [];
  const failedChecks: string[] = [];
  
  if (priceVariance <= THRESHOLDS.PRICE_DISCREPANCY) {
    passedChecks.push('price_consistency');
  } else {
    failedChecks.push('price_consistency');
  }
  
  if (volumeVariance <= THRESHOLDS.VOLUME_DISCREPANCY) {
    passedChecks.push('volume_consistency');
  } else {
    failedChecks.push('volume_consistency');
  }
  
  const dataQuality: DataQualitySummary = {
    overallScore: Math.round(marketDataQuality),
    marketDataQuality: Math.round(marketDataQuality),
    socialDataQuality: 0, // Not applicable
    onChainDataQuality: 0, // Not applicable
    newsDataQuality: 0, // Not applicable
    passedChecks,
    failedChecks
  };
  
  // Note: Reliability scores are persisted automatically in updateReliability()
  
  const result: VeritasValidationResult = {
    isValid: alerts.filter(a => a.severity === 'fatal').length === 0,
    confidence: dataQuality.overallScore,
    alerts,
    discrepancies,
    dataQualitySummary: dataQuality
  };
  
  console.log(`✅ Veritas: Market data validation complete for ${symbol}`);
  console.log(`   Confidence: ${result.confidence}%, Alerts: ${alerts.length}, Discrepancies: ${discrepancies.length}`);
  
  return result;
}
