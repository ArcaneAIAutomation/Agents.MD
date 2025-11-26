/**
 * Einstein Data Validation Module
 * 
 * Implements comprehensive data validation logic including:
 * - Data freshness checks (5-minute maximum age)
 * - Cross-source validation (median for conflicts)
 * - Data quality scoring
 * 
 * Requirements: 2.2, 2.4
 */

import type {
  ComprehensiveData,
  MarketData,
  SentimentData,
  OnChainData,
  TechnicalData,
  NewsData,
  DataQualityScore
} from '../types';

// ============================================================================
// Configuration Constants
// ============================================================================

const MAX_DATA_AGE_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const MIN_DATA_QUALITY = 90; // Minimum 90% quality required (Requirement 2.3)
const PRICE_DEVIATION_THRESHOLD = 0.05; // 5% price deviation threshold

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate all collected data and calculate comprehensive quality scores
 * 
 * Requirements:
 * - 2.2: Verify data freshness (maximum 5 minutes old)
 * - 2.4: Use median value for conflicts and flag discrepancies
 * 
 * @param data - Complete data collection from all sources
 * @returns DataQualityScore with overall and component scores
 */
export function validateAllData(data: ComprehensiveData): DataQualityScore {
  console.log('[Einstein Validator] Starting comprehensive data validation...');
  
  // Validate each data component
  const marketScore = validateMarketData(data.market);
  const sentimentScore = validateSentimentData(data.sentiment);
  const onChainScore = validateOnChainData(data.onChain);
  const technicalScore = validateTechnicalData(data.technical);
  
  // Calculate overall quality score (weighted average)
  const overall = Math.round(
    (marketScore * 0.3 +      // Market data is most critical (30%)
     sentimentScore * 0.2 +   // Sentiment is important (20%)
     onChainScore * 0.25 +    // On-chain data is critical (25%)
     technicalScore * 0.25)   // Technical indicators are critical (25%)
  );
  
  // Track successful and failed sources
  const sources = getDataSources(data);
  
  const qualityScore: DataQualityScore = {
    overall,
    market: marketScore,
    sentiment: sentimentScore,
    onChain: onChainScore,
    technical: technicalScore,
    sources
  };
  
  console.log('[Einstein Validator] Validation complete:', {
    overall: `${overall}%`,
    market: `${marketScore}%`,
    sentiment: `${sentimentScore}%`,
    onChain: `${onChainScore}%`,
    technical: `${technicalScore}%`,
    successfulSources: sources.successful.length,
    failedSources: sources.failed.length
  });
  
  // Requirement 2.3: Refuse to generate signal if quality < 90%
  if (overall < MIN_DATA_QUALITY) {
    throw new Error(
      `Data quality insufficient: ${overall}% (minimum ${MIN_DATA_QUALITY}% required). ` +
      `Failed sources: ${sources.failed.join(', ')}`
    );
  }
  
  return qualityScore;
}

// ============================================================================
// Market Data Validation
// ============================================================================

/**
 * Validate market data quality and freshness
 * 
 * Checks:
 * - Data freshness (< 5 minutes old)
 * - Required fields present and valid
 * - Price within reasonable bounds
 * - Volume and market cap positive
 */
function validateMarketData(data: MarketData): number {
  let score = 0;
  const checks = [];
  
  // Check 1: Data freshness (Requirement 2.2)
  const isFresh = checkDataFreshness(data.timestamp, 'Market');
  if (isFresh) {
    score += 20;
    checks.push('✓ Fresh data');
  } else {
    checks.push('✗ Stale data');
  }
  
  // Check 2: Price validity
  if (data.price && data.price > 0 && data.price < 1000000000) {
    score += 20;
    checks.push('✓ Valid price');
  } else {
    checks.push('✗ Invalid price');
  }
  
  // Check 3: Volume validity
  if (data.volume24h && data.volume24h > 0) {
    score += 15;
    checks.push('✓ Valid volume');
  } else {
    checks.push('✗ Invalid volume');
  }
  
  // Check 4: Market cap validity
  if (data.marketCap && data.marketCap > 0) {
    score += 15;
    checks.push('✓ Valid market cap');
  } else {
    checks.push('✗ Invalid market cap');
  }
  
  // Check 5: 24h change present
  if (data.change24h !== undefined && !isNaN(data.change24h)) {
    score += 10;
    checks.push('✓ Valid 24h change');
  } else {
    checks.push('✗ Invalid 24h change');
  }
  
  // Check 6: High/Low prices
  if (data.high24h && data.low24h && data.high24h > data.low24h) {
    score += 10;
    checks.push('✓ Valid high/low');
  } else {
    checks.push('✗ Invalid high/low');
  }
  
  // Check 7: Source attribution
  if (data.source && data.source.length > 0) {
    score += 10;
    checks.push('✓ Source attributed');
  } else {
    checks.push('✗ No source');
  }
  
  console.log('[Validator] Market data:', checks.join(', '), `(${score}%)`);
  return score;
}

// ============================================================================
// Sentiment Data Validation
// ============================================================================

/**
 * Validate sentiment data quality and freshness
 * 
 * Checks:
 * - Data freshness (< 5 minutes old)
 * - Social metrics present
 * - News metrics present
 * - Sentiment scores within valid range
 */
function validateSentimentData(data: SentimentData): number {
  let score = 0;
  const checks = [];
  
  // Check 1: Data freshness (Requirement 2.2)
  const isFresh = checkDataFreshness(data.timestamp, 'Sentiment');
  if (isFresh) {
    score += 25;
    checks.push('✓ Fresh data');
  } else {
    checks.push('✗ Stale data');
  }
  
  // Check 2: Social metrics present
  if (data.social) {
    let socialScore = 0;
    
    // LunarCrush metrics
    if (data.social.lunarCrush) {
      if (data.social.lunarCrush.galaxyScore >= 0) socialScore += 8;
      if (data.social.lunarCrush.altRank >= 0) socialScore += 8;
      if (data.social.lunarCrush.socialScore >= 0) socialScore += 9;
    }
    
    // Twitter metrics
    if (data.social.twitter) {
      if (data.social.twitter.mentions >= 0) socialScore += 8;
      if (data.social.twitter.sentiment >= -1 && data.social.twitter.sentiment <= 1) socialScore += 8;
    }
    
    // Reddit metrics
    if (data.social.reddit) {
      if (data.social.reddit.posts >= 0) socialScore += 8;
      if (data.social.reddit.sentiment >= -1 && data.social.reddit.sentiment <= 1) socialScore += 8;
    }
    
    score += Math.min(socialScore, 50);
    checks.push(`✓ Social metrics (${socialScore}%)`);
  } else {
    checks.push('✗ No social metrics');
  }
  
  // Check 3: News metrics present
  if (data.news) {
    let newsScore = 0;
    
    if (data.news.articles >= 0) newsScore += 10;
    if (data.news.sentiment >= -1 && data.news.sentiment <= 1) newsScore += 10;
    if (data.news.trending !== undefined) newsScore += 5;
    
    score += newsScore;
    checks.push(`✓ News metrics (${newsScore}%)`);
  } else {
    checks.push('✗ No news metrics');
  }
  
  console.log('[Validator] Sentiment data:', checks.join(', '), `(${score}%)`);
  return score;
}

// ============================================================================
// On-Chain Data Validation
// ============================================================================

/**
 * Validate on-chain data quality and freshness
 * 
 * Checks:
 * - Data freshness (< 5 minutes old)
 * - Whale activity metrics
 * - Exchange flow data
 * - Holder distribution data
 */
function validateOnChainData(data: OnChainData): number {
  let score = 0;
  const checks = [];
  
  // Check 1: Data freshness (Requirement 2.2)
  const isFresh = checkDataFreshness(data.timestamp, 'On-chain');
  if (isFresh) {
    score += 25;
    checks.push('✓ Fresh data');
  } else {
    checks.push('✗ Stale data');
  }
  
  // Check 2: Whale activity metrics
  if (data.whaleActivity) {
    let whaleScore = 0;
    
    if (data.whaleActivity.transactions >= 0) whaleScore += 8;
    if (data.whaleActivity.totalValue >= 0) whaleScore += 8;
    if (data.whaleActivity.averageSize >= 0) whaleScore += 9;
    
    score += whaleScore;
    checks.push(`✓ Whale activity (${whaleScore}%)`);
  } else {
    checks.push('✗ No whale activity');
  }
  
  // Check 3: Exchange flow data
  if (data.exchangeFlows) {
    let flowScore = 0;
    
    if (data.exchangeFlows.deposits >= 0) flowScore += 8;
    if (data.exchangeFlows.withdrawals >= 0) flowScore += 8;
    if (data.exchangeFlows.netFlow !== undefined) flowScore += 9;
    
    score += flowScore;
    checks.push(`✓ Exchange flows (${flowScore}%)`);
  } else {
    checks.push('✗ No exchange flows');
  }
  
  // Check 4: Holder distribution
  if (data.holderDistribution) {
    let holderScore = 0;
    
    if (data.holderDistribution.whales >= 0) holderScore += 8;
    if (data.holderDistribution.retail >= 0) holderScore += 8;
    if (data.holderDistribution.concentration >= 0 && data.holderDistribution.concentration <= 100) holderScore += 9;
    
    score += holderScore;
    checks.push(`✓ Holder distribution (${holderScore}%)`);
  } else {
    checks.push('✗ No holder distribution');
  }
  
  console.log('[Validator] On-chain data:', checks.join(', '), `(${score}%)`);
  return score;
}

// ============================================================================
// Technical Data Validation
// ============================================================================

/**
 * Validate technical indicators quality and freshness
 * 
 * Checks:
 * - Data freshness (< 5 minutes old)
 * - All required indicators present
 * - Indicator values within valid ranges
 */
function validateTechnicalData(data: TechnicalData): number {
  let score = 0;
  const checks = [];
  
  // Check 1: Data freshness (Requirement 2.2)
  const isFresh = checkDataFreshness(data.timestamp, 'Technical');
  if (isFresh) {
    score += 20;
    checks.push('✓ Fresh data');
  } else {
    checks.push('✗ Stale data');
  }
  
  const indicators = data.indicators;
  
  // Check 2: RSI (0-100 range)
  if (indicators.rsi >= 0 && indicators.rsi <= 100) {
    score += 13;
    checks.push('✓ Valid RSI');
  } else {
    checks.push('✗ Invalid RSI');
  }
  
  // Check 3: MACD
  if (indicators.macd && 
      typeof indicators.macd.value === 'number' &&
      typeof indicators.macd.signal === 'number' &&
      typeof indicators.macd.histogram === 'number') {
    score += 13;
    checks.push('✓ Valid MACD');
  } else {
    checks.push('✗ Invalid MACD');
  }
  
  // Check 4: EMAs
  if (indicators.ema &&
      indicators.ema.ema9 > 0 &&
      indicators.ema.ema21 > 0 &&
      indicators.ema.ema50 > 0 &&
      indicators.ema.ema200 > 0) {
    score += 14;
    checks.push('✓ Valid EMAs');
  } else {
    checks.push('✗ Invalid EMAs');
  }
  
  // Check 5: Bollinger Bands
  if (indicators.bollingerBands &&
      indicators.bollingerBands.upper > indicators.bollingerBands.middle &&
      indicators.bollingerBands.middle > indicators.bollingerBands.lower) {
    score += 13;
    checks.push('✓ Valid Bollinger Bands');
  } else {
    checks.push('✗ Invalid Bollinger Bands');
  }
  
  // Check 6: ATR (positive value)
  if (indicators.atr > 0) {
    score += 13;
    checks.push('✓ Valid ATR');
  } else {
    checks.push('✗ Invalid ATR');
  }
  
  // Check 7: Stochastic (0-100 range)
  if (indicators.stochastic &&
      indicators.stochastic.k >= 0 && indicators.stochastic.k <= 100 &&
      indicators.stochastic.d >= 0 && indicators.stochastic.d <= 100) {
    score += 14;
    checks.push('✓ Valid Stochastic');
  } else {
    checks.push('✗ Invalid Stochastic');
  }
  
  console.log('[Validator] Technical data:', checks.join(', '), `(${score}%)`);
  return score;
}

// ============================================================================
// Data Freshness Check
// ============================================================================

/**
 * Check if data is fresh (< 5 minutes old)
 * Requirement 2.2: Verify data freshness (maximum 5 minutes old)
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @param dataType - Type of data being checked (for logging)
 * @returns true if data is fresh, false if stale
 */
export function checkDataFreshness(timestamp: string, dataType: string): boolean {
  try {
    const dataTime = new Date(timestamp).getTime();
    const now = Date.now();
    const age = now - dataTime;
    
    const isFresh = age <= MAX_DATA_AGE_MS;
    
    if (!isFresh) {
      const ageMinutes = Math.round(age / 60000);
      console.warn(
        `[Validator] ${dataType} data is stale: ${ageMinutes} minutes old ` +
        `(maximum ${MAX_DATA_AGE_MS / 60000} minutes)`
      );
    }
    
    return isFresh;
  } catch (error) {
    console.error(`[Validator] Invalid timestamp for ${dataType}:`, timestamp);
    return false;
  }
}

// ============================================================================
// Cross-Source Validation
// ============================================================================

/**
 * Validate data across multiple sources and use median for conflicts
 * Requirement 2.4: Use median value for conflicts and flag discrepancies
 * 
 * @param values - Array of values from different sources
 * @param fieldName - Name of the field being validated
 * @returns Validated value (median) and conflict flag
 */
export function validateCrossSource(
  values: number[],
  fieldName: string
): { value: number; hasConflict: boolean; deviation: number } {
  if (values.length === 0) {
    throw new Error(`No values provided for ${fieldName}`);
  }
  
  if (values.length === 1) {
    return { value: values[0], hasConflict: false, deviation: 0 };
  }
  
  // Calculate median (Requirement 2.4)
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  
  // Check for conflicts (deviation > threshold)
  const deviations = values.map(v => Math.abs(v - median) / median);
  const maxDeviation = Math.max(...deviations);
  const hasConflict = maxDeviation > PRICE_DEVIATION_THRESHOLD;
  
  if (hasConflict) {
    console.warn(
      `[Validator] Conflict detected in ${fieldName}: ` +
      `values=${values.join(', ')}, median=${median.toFixed(2)}, ` +
      `max deviation=${(maxDeviation * 100).toFixed(2)}%`
    );
  }
  
  return {
    value: median,
    hasConflict,
    deviation: maxDeviation
  };
}

// ============================================================================
// Data Source Tracking
// ============================================================================

/**
 * Track which data sources succeeded and which failed
 * 
 * @param data - Complete data collection
 * @returns Object with successful and failed source lists
 */
function getDataSources(data: ComprehensiveData): { successful: string[]; failed: string[] } {
  const successful: string[] = [];
  const failed: string[] = [];
  
  // Check market data
  if (data.market && data.market.price > 0) {
    successful.push('market');
  } else {
    failed.push('market');
  }
  
  // Check sentiment data
  if (data.sentiment && (data.sentiment.social || data.sentiment.news)) {
    successful.push('sentiment');
  } else {
    failed.push('sentiment');
  }
  
  // Check on-chain data
  if (data.onChain && (data.onChain.whaleActivity || data.onChain.exchangeFlows)) {
    successful.push('onChain');
  } else {
    failed.push('onChain');
  }
  
  // Check technical data
  if (data.technical && data.technical.indicators) {
    successful.push('technical');
  } else {
    failed.push('technical');
  }
  
  // Check news data
  if (data.news && data.news.articles && data.news.articles.length > 0) {
    successful.push('news');
  } else {
    failed.push('news');
  }
  
  return { successful, failed };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate median of an array of numbers
 * Used for cross-source validation (Requirement 2.4)
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 * Used for detecting outliers in cross-source validation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Detect outliers using standard deviation method
 * Values more than 2 standard deviations from mean are considered outliers
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 3) return []; // Need at least 3 values
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = calculateStandardDeviation(values);
  
  return values.filter(val => Math.abs(val - mean) > 2 * stdDev);
}

// ============================================================================
// Export Configuration
// ============================================================================

export const VALIDATION_CONFIG = {
  MAX_DATA_AGE_MS,
  MIN_DATA_QUALITY,
  PRICE_DEVIATION_THRESHOLD
};
