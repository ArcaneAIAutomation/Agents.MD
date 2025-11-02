/**
 * Funding Rate Analysis
 * 
 * Analyzes funding rates across multiple exchanges to:
 * - Calculate 8-hour historical trends
 * - Identify extreme funding rates
 * - Generate mean reversion opportunity alerts
 */

import { FundingRateData } from './derivativesClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface FundingRateTrend {
  exchange: string;
  current: number;
  average8h: number;
  min8h: number;
  max8h: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
}

export interface ExtremeFundingRate {
  exchange: string;
  fundingRate: number;
  severity: 'extreme_positive' | 'extreme_negative' | 'high_positive' | 'high_negative';
  description: string;
  timestamp: string;
}

export interface MeanReversionOpportunity {
  exchange: string;
  fundingRate: number;
  expectedReversion: number;
  confidence: number;
  reasoning: string;
  signal: 'long' | 'short' | 'neutral';
  timestamp: string;
}

export interface FundingRateAnalysis {
  symbol: string;
  timestamp: string;
  currentRates: FundingRateData[];
  trends: FundingRateTrend[];
  extremeRates: ExtremeFundingRate[];
  meanReversionOpportunities: MeanReversionOpportunity[];
  aggregatedRate: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

// ============================================================================
// Funding Rate Thresholds
// ============================================================================

const THRESHOLDS = {
  EXTREME_POSITIVE: 0.001, // 0.1% or higher
  EXTREME_NEGATIVE: -0.001, // -0.1% or lower
  HIGH_POSITIVE: 0.0005, // 0.05%
  HIGH_NEGATIVE: -0.0005, // -0.05%
  NORMAL_RANGE: 0.0001 // 0.01%
};

// ============================================================================
// Funding Rate Analysis Functions
// ============================================================================

/**
 * Analyze funding rates from multiple exchanges
 */
export function analyzeFundingRates(
  currentRates: FundingRateData[],
  historicalRates?: FundingRateData[][]
): FundingRateAnalysis {
  const symbol = currentRates[0]?.symbol || 'UNKNOWN';
  const timestamp = new Date().toISOString();

  // Calculate trends if historical data is available
  const trends = historicalRates 
    ? calculateTrends(currentRates, historicalRates)
    : [];

  // Identify extreme funding rates
  const extremeRates = identifyExtremeRates(currentRates);

  // Generate mean reversion opportunities
  const meanReversionOpportunities = generateMeanReversionSignals(
    currentRates,
    trends
  );

  // Calculate aggregated funding rate
  const aggregatedRate = calculateAggregatedRate(currentRates);

  // Determine market sentiment
  const marketSentiment = determineMarketSentiment(aggregatedRate);

  // Assess risk level
  const riskLevel = assessRiskLevel(extremeRates, aggregatedRate);

  return {
    symbol,
    timestamp,
    currentRates,
    trends,
    extremeRates,
    meanReversionOpportunities,
    aggregatedRate,
    marketSentiment,
    riskLevel
  };
}

/**
 * Calculate 8-hour historical trends
 */
function calculateTrends(
  currentRates: FundingRateData[],
  historicalRates: FundingRateData[][]
): FundingRateTrend[] {
  const trends: FundingRateTrend[] = [];

  currentRates.forEach((current) => {
    // Find historical data for this exchange
    const exchangeHistory = historicalRates
      .flat()
      .filter(h => h.exchange === current.exchange)
      .slice(-16); // Last 16 funding periods (8 hours if 30min intervals)

    if (exchangeHistory.length < 2) {
      return; // Not enough data
    }

    const rates = exchangeHistory.map(h => h.fundingRate);
    const average8h = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const min8h = Math.min(...rates);
    const max8h = Math.max(...rates);

    // Calculate trend direction
    const recentRates = rates.slice(-3);
    const olderRates = rates.slice(0, 3);
    const recentAvg = recentRates.reduce((sum, r) => sum + r, 0) / recentRates.length;
    const olderAvg = olderRates.reduce((sum, r) => sum + r, 0) / olderRates.length;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    // Calculate volatility (standard deviation)
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - average8h, 2), 0) / rates.length;
    const volatility = Math.sqrt(variance);

    trends.push({
      exchange: current.exchange,
      current: current.fundingRate,
      average8h,
      min8h,
      max8h,
      trend,
      volatility
    });
  });

  return trends;
}

/**
 * Identify extreme funding rates (>0.1% or <-0.1%)
 */
function identifyExtremeRates(rates: FundingRateData[]): ExtremeFundingRate[] {
  const extremeRates: ExtremeFundingRate[] = [];

  rates.forEach((rate) => {
    let severity: ExtremeFundingRate['severity'] | null = null;
    let description = '';

    if (rate.fundingRate >= THRESHOLDS.EXTREME_POSITIVE) {
      severity = 'extreme_positive';
      description = `Extremely high funding rate of ${(rate.fundingRate * 100).toFixed(4)}% on ${rate.exchange}. Longs are paying shorts heavily, indicating extreme bullish positioning.`;
    } else if (rate.fundingRate <= THRESHOLDS.EXTREME_NEGATIVE) {
      severity = 'extreme_negative';
      description = `Extremely low funding rate of ${(rate.fundingRate * 100).toFixed(4)}% on ${rate.exchange}. Shorts are paying longs heavily, indicating extreme bearish positioning.`;
    } else if (rate.fundingRate >= THRESHOLDS.HIGH_POSITIVE) {
      severity = 'high_positive';
      description = `High funding rate of ${(rate.fundingRate * 100).toFixed(4)}% on ${rate.exchange}. Longs are paying shorts, indicating bullish positioning.`;
    } else if (rate.fundingRate <= THRESHOLDS.HIGH_NEGATIVE) {
      severity = 'high_negative';
      description = `Low funding rate of ${(rate.fundingRate * 100).toFixed(4)}% on ${rate.exchange}. Shorts are paying longs, indicating bearish positioning.`;
    }

    if (severity) {
      extremeRates.push({
        exchange: rate.exchange,
        fundingRate: rate.fundingRate,
        severity,
        description,
        timestamp: rate.fundingTime
      });
    }
  });

  return extremeRates;
}

/**
 * Generate mean reversion opportunity alerts
 */
function generateMeanReversionSignals(
  currentRates: FundingRateData[],
  trends: FundingRateTrend[]
): MeanReversionOpportunity[] {
  const opportunities: MeanReversionOpportunity[] = [];

  currentRates.forEach((rate) => {
    const trend = trends.find(t => t.exchange === rate.exchange);
    
    // Check for extreme funding rates that may revert
    if (Math.abs(rate.fundingRate) >= THRESHOLDS.HIGH_POSITIVE) {
      const isExtreme = Math.abs(rate.fundingRate) >= THRESHOLDS.EXTREME_POSITIVE;
      const deviation = trend 
        ? Math.abs(rate.fundingRate - trend.average8h) / trend.volatility
        : 0;

      // High deviation suggests mean reversion opportunity
      if (deviation > 2 || isExtreme) {
        const expectedReversion = trend ? trend.average8h : 0;
        const confidence = Math.min(95, 50 + deviation * 15);

        let signal: 'long' | 'short' | 'neutral';
        let reasoning: string;

        if (rate.fundingRate > THRESHOLDS.HIGH_POSITIVE) {
          signal = 'short';
          reasoning = `Funding rate is ${deviation.toFixed(1)} standard deviations above average. Longs are overpaying, suggesting potential for price decline or funding rate normalization. Consider shorting or waiting for better long entry.`;
        } else if (rate.fundingRate < THRESHOLDS.HIGH_NEGATIVE) {
          signal = 'long';
          reasoning = `Funding rate is ${deviation.toFixed(1)} standard deviations below average. Shorts are overpaying, suggesting potential for price increase or funding rate normalization. Consider longing or waiting for better short entry.`;
        } else {
          signal = 'neutral';
          reasoning = 'Funding rate is within normal range.';
        }

        opportunities.push({
          exchange: rate.exchange,
          fundingRate: rate.fundingRate,
          expectedReversion,
          confidence,
          reasoning,
          signal,
          timestamp: rate.fundingTime
        });
      }
    }
  });

  return opportunities;
}

/**
 * Calculate volume-weighted aggregated funding rate
 */
function calculateAggregatedRate(rates: FundingRateData[]): number {
  if (rates.length === 0) return 0;

  // Simple average (could be weighted by exchange volume in production)
  const sum = rates.reduce((total, rate) => total + rate.fundingRate, 0);
  return sum / rates.length;
}

/**
 * Determine market sentiment based on funding rates
 */
function determineMarketSentiment(aggregatedRate: number): 'bullish' | 'bearish' | 'neutral' {
  if (aggregatedRate > THRESHOLDS.HIGH_POSITIVE) {
    return 'bullish';
  } else if (aggregatedRate < THRESHOLDS.HIGH_NEGATIVE) {
    return 'bearish';
  } else {
    return 'neutral';
  }
}

/**
 * Assess overall risk level
 */
function assessRiskLevel(
  extremeRates: ExtremeFundingRate[],
  aggregatedRate: number
): 'low' | 'medium' | 'high' | 'extreme' {
  const hasExtremeRates = extremeRates.some(
    r => r.severity === 'extreme_positive' || r.severity === 'extreme_negative'
  );

  if (hasExtremeRates || Math.abs(aggregatedRate) >= THRESHOLDS.EXTREME_POSITIVE) {
    return 'extreme';
  } else if (extremeRates.length > 2 || Math.abs(aggregatedRate) >= THRESHOLDS.HIGH_POSITIVE) {
    return 'high';
  } else if (extremeRates.length > 0 || Math.abs(aggregatedRate) >= THRESHOLDS.NORMAL_RANGE) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Format funding rate as percentage string
 */
export function formatFundingRate(rate: number): string {
  return `${(rate * 100).toFixed(4)}%`;
}

/**
 * Calculate annualized funding rate
 */
export function calculateAnnualizedRate(rate: number, periodsPerDay: number = 3): number {
  // Compound the rate over a year
  return Math.pow(1 + rate, periodsPerDay * 365) - 1;
}

/**
 * Estimate funding cost for a position
 */
export function estimateFundingCost(
  positionSize: number,
  fundingRate: number,
  periods: number = 1
): number {
  return positionSize * fundingRate * periods;
}
