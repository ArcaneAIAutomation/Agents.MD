/**
 * Long/Short Ratio Analysis
 * 
 * Analyzes long/short positioning across exchanges:
 * - Fetch long/short ratios from multiple exchanges
 * - Calculate aggregated sentiment
 * - Identify extreme positioning (>70% or <30%)
 * - Generate contrarian signals
 */

import { LongShortRatio } from './derivativesClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AggregatedLongShortRatio {
  longRatio: number;
  shortRatio: number;
  longAccount: number;
  shortAccount: number;
  exchanges: number;
  timestamp: string;
}

export interface ExtremePositioning {
  exchange: string;
  longRatio: number;
  shortRatio: number;
  severity: 'extreme_long' | 'extreme_short' | 'high_long' | 'high_short';
  description: string;
  timestamp: string;
}

export interface ContrarianSignal {
  signal: 'contrarian_long' | 'contrarian_short' | 'neutral';
  confidence: number;
  reasoning: string;
  targetEntry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskReward: number | null;
}

export interface LongShortAnalysis {
  symbol: string;
  timestamp: string;
  byExchange: LongShortRatio[];
  aggregated: AggregatedLongShortRatio;
  extremePositioning: ExtremePositioning[];
  marketSentiment: 'extremely_bullish' | 'bullish' | 'neutral' | 'bearish' | 'extremely_bearish';
  crowdedness: 'extremely_crowded' | 'crowded' | 'balanced' | 'uncrowded';
  contrarianSignal: ContrarianSignal;
  recommendation: string;
}

// ============================================================================
// Long/Short Analysis Functions
// ============================================================================

/**
 * Analyze long/short ratios from multiple exchanges
 */
export function analyzeLongShortRatios(
  ratios: LongShortRatio[],
  currentPrice: number
): LongShortAnalysis {
  const symbol = ratios[0]?.symbol || 'UNKNOWN';
  const timestamp = new Date().toISOString();

  // Calculate aggregated ratio
  const aggregated = calculateAggregatedRatio(ratios);

  // Identify extreme positioning
  const extremePositioning = identifyExtremePositioning(ratios);

  // Determine market sentiment
  const marketSentiment = determineMarketSentiment(aggregated.longRatio);

  // Assess crowdedness
  const crowdedness = assessCrowdedness(aggregated.longRatio, extremePositioning);

  // Generate contrarian signal
  const contrarianSignal = generateContrarianSignal(
    aggregated,
    extremePositioning,
    currentPrice
  );

  // Generate recommendation
  const recommendation = generateRecommendation(
    marketSentiment,
    crowdedness,
    contrarianSignal
  );

  return {
    symbol,
    timestamp,
    byExchange: ratios,
    aggregated,
    extremePositioning,
    marketSentiment,
    crowdedness,
    contrarianSignal,
    recommendation
  };
}

/**
 * Calculate aggregated long/short ratio across exchanges
 */
function calculateAggregatedRatio(ratios: LongShortRatio[]): AggregatedLongShortRatio {
  if (ratios.length === 0) {
    return {
      longRatio: 0.5,
      shortRatio: 0.5,
      longAccount: 0,
      shortAccount: 0,
      exchanges: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Calculate weighted average (simple average for now, could weight by volume)
  const totalLongRatio = ratios.reduce((sum, r) => sum + r.longRatio, 0);
  const totalShortRatio = ratios.reduce((sum, r) => sum + r.shortRatio, 0);
  const totalLongAccount = ratios.reduce((sum, r) => sum + r.longAccount, 0);
  const totalShortAccount = ratios.reduce((sum, r) => sum + r.shortAccount, 0);

  const longRatio = totalLongRatio / ratios.length;
  const shortRatio = totalShortRatio / ratios.length;

  return {
    longRatio,
    shortRatio,
    longAccount: totalLongAccount / ratios.length,
    shortAccount: totalShortAccount / ratios.length,
    exchanges: ratios.length,
    timestamp: ratios[0].timestamp
  };
}

/**
 * Identify extreme positioning (>70% or <30%)
 */
function identifyExtremePositioning(ratios: LongShortRatio[]): ExtremePositioning[] {
  const extremePositions: ExtremePositioning[] = [];

  ratios.forEach((ratio) => {
    let severity: ExtremePositioning['severity'] | null = null;
    let description = '';

    if (ratio.longRatio >= 0.75) {
      severity = 'extreme_long';
      description = `Extreme long bias on ${ratio.exchange} with ${(ratio.longRatio * 100).toFixed(1)}% longs. Market is heavily one-sided, increasing risk of long squeeze.`;
    } else if (ratio.longRatio <= 0.25) {
      severity = 'extreme_short';
      description = `Extreme short bias on ${ratio.exchange} with ${(ratio.shortRatio * 100).toFixed(1)}% shorts. Market is heavily one-sided, increasing risk of short squeeze.`;
    } else if (ratio.longRatio >= 0.70) {
      severity = 'high_long';
      description = `High long bias on ${ratio.exchange} with ${(ratio.longRatio * 100).toFixed(1)}% longs. Crowded long positioning may lead to reversal.`;
    } else if (ratio.longRatio <= 0.30) {
      severity = 'high_short';
      description = `High short bias on ${ratio.exchange} with ${(ratio.shortRatio * 100).toFixed(1)}% shorts. Crowded short positioning may lead to reversal.`;
    }

    if (severity) {
      extremePositions.push({
        exchange: ratio.exchange,
        longRatio: ratio.longRatio,
        shortRatio: ratio.shortRatio,
        severity,
        description,
        timestamp: ratio.timestamp
      });
    }
  });

  return extremePositions;
}

/**
 * Determine market sentiment based on long/short ratio
 */
function determineMarketSentiment(
  longRatio: number
): 'extremely_bullish' | 'bullish' | 'neutral' | 'bearish' | 'extremely_bearish' {
  if (longRatio >= 0.75) {
    return 'extremely_bullish';
  } else if (longRatio >= 0.60) {
    return 'bullish';
  } else if (longRatio >= 0.40) {
    return 'neutral';
  } else if (longRatio >= 0.25) {
    return 'bearish';
  } else {
    return 'extremely_bearish';
  }
}

/**
 * Assess position crowdedness
 */
function assessCrowdedness(
  longRatio: number,
  extremePositioning: ExtremePositioning[]
): 'extremely_crowded' | 'crowded' | 'balanced' | 'uncrowded' {
  const hasExtremePositions = extremePositioning.some(
    p => p.severity === 'extreme_long' || p.severity === 'extreme_short'
  );

  if (hasExtremePositions || longRatio >= 0.75 || longRatio <= 0.25) {
    return 'extremely_crowded';
  } else if (extremePositioning.length > 0 || longRatio >= 0.70 || longRatio <= 0.30) {
    return 'crowded';
  } else if (longRatio >= 0.45 && longRatio <= 0.55) {
    return 'balanced';
  } else {
    return 'uncrowded';
  }
}

/**
 * Generate contrarian trading signals
 */
function generateContrarianSignal(
  aggregated: AggregatedLongShortRatio,
  extremePositioning: ExtremePositioning[],
  currentPrice: number
): ContrarianSignal {
  let signal: ContrarianSignal['signal'] = 'neutral';
  let confidence = 50;
  let reasoning = '';
  let targetEntry: number | null = null;
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;
  let riskReward: number | null = null;

  // Extreme long positioning -> Contrarian short signal
  if (aggregated.longRatio >= 0.70) {
    signal = 'contrarian_short';
    
    // Calculate confidence based on extremity
    confidence = Math.min(90, 50 + (aggregated.longRatio - 0.70) * 100);
    
    // Increase confidence if multiple exchanges show extreme positioning
    const extremeLongs = extremePositioning.filter(
      p => p.severity === 'extreme_long' || p.severity === 'high_long'
    );
    confidence = Math.min(95, confidence + extremeLongs.length * 5);

    reasoning = `${(aggregated.longRatio * 100).toFixed(1)}% of traders are long, indicating overcrowded positioning. When the majority is on one side, the market often moves against them. Consider shorting or waiting for better long entry after a pullback.`;

    // Calculate entry/exit levels
    targetEntry = currentPrice * 0.98; // Enter short on slight bounce
    stopLoss = currentPrice * 1.03; // 3% stop loss
    takeProfit = currentPrice * 0.92; // 8% take profit
    riskReward = (currentPrice - takeProfit) / (stopLoss - currentPrice);
  }
  // Extreme short positioning -> Contrarian long signal
  else if (aggregated.longRatio <= 0.30) {
    signal = 'contrarian_long';
    
    // Calculate confidence based on extremity
    confidence = Math.min(90, 50 + (0.30 - aggregated.longRatio) * 100);
    
    // Increase confidence if multiple exchanges show extreme positioning
    const extremeShorts = extremePositioning.filter(
      p => p.severity === 'extreme_short' || p.severity === 'high_short'
    );
    confidence = Math.min(95, confidence + extremeShorts.length * 5);

    reasoning = `${(aggregated.shortRatio * 100).toFixed(1)}% of traders are short, indicating overcrowded positioning. When the majority is on one side, the market often moves against them. Consider longing or waiting for better short entry after a bounce.`;

    // Calculate entry/exit levels
    targetEntry = currentPrice * 1.02; // Enter long on slight dip
    stopLoss = currentPrice * 0.97; // 3% stop loss
    takeProfit = currentPrice * 1.08; // 8% take profit
    riskReward = (takeProfit - currentPrice) / (currentPrice - stopLoss);
  }
  // Balanced positioning
  else {
    reasoning = `Long/short ratio is relatively balanced at ${(aggregated.longRatio * 100).toFixed(1)}% longs. No clear contrarian opportunity at this time.`;
  }

  return {
    signal,
    confidence,
    reasoning,
    targetEntry,
    stopLoss,
    takeProfit,
    riskReward
  };
}

/**
 * Generate trading recommendation
 */
function generateRecommendation(
  sentiment: string,
  crowdedness: string,
  contrarianSignal: ContrarianSignal
): string {
  const recommendations: string[] = [];

  // Sentiment warning
  if (sentiment === 'extremely_bullish') {
    recommendations.push('⚠️ Extremely bullish sentiment detected. Market may be overextended.');
  } else if (sentiment === 'extremely_bearish') {
    recommendations.push('⚠️ Extremely bearish sentiment detected. Market may be oversold.');
  }

  // Crowdedness warning
  if (crowdedness === 'extremely_crowded') {
    recommendations.push('🚨 EXTREMELY crowded positioning. High risk of sudden reversal.');
  } else if (crowdedness === 'crowded') {
    recommendations.push('⚠️ Crowded positioning detected. Exercise caution.');
  }

  // Contrarian signal
  if (contrarianSignal.signal !== 'neutral' && contrarianSignal.confidence >= 70) {
    if (contrarianSignal.signal === 'contrarian_long') {
      recommendations.push(`📈 CONTRARIAN LONG signal (${contrarianSignal.confidence}% confidence). ${contrarianSignal.reasoning}`);
      if (contrarianSignal.targetEntry) {
        recommendations.push(`Entry: $${contrarianSignal.targetEntry.toFixed(2)}, Stop: $${contrarianSignal.stopLoss?.toFixed(2)}, Target: $${contrarianSignal.takeProfit?.toFixed(2)} (R:R ${contrarianSignal.riskReward?.toFixed(2)})`);
      }
    } else {
      recommendations.push(`📉 CONTRARIAN SHORT signal (${contrarianSignal.confidence}% confidence). ${contrarianSignal.reasoning}`);
      if (contrarianSignal.targetEntry) {
        recommendations.push(`Entry: $${contrarianSignal.targetEntry.toFixed(2)}, Stop: $${contrarianSignal.stopLoss?.toFixed(2)}, Target: $${contrarianSignal.takeProfit?.toFixed(2)} (R:R ${contrarianSignal.riskReward?.toFixed(2)})`);
      }
    }
  }

  return recommendations.join(' ');
}

/**
 * Calculate long/short ratio divergence from historical average
 */
export function calculateDivergence(
  currentRatio: number,
  historicalAverage: number
): number {
  return ((currentRatio - historicalAverage) / historicalAverage) * 100;
}

/**
 * Interpret divergence
 */
export function interpretDivergence(divergence: number): string {
  if (divergence > 50) {
    return 'Significantly more bullish than average';
  } else if (divergence > 20) {
    return 'More bullish than average';
  } else if (divergence < -50) {
    return 'Significantly more bearish than average';
  } else if (divergence < -20) {
    return 'More bearish than average';
  } else {
    return 'Near historical average';
  }
}

/**
 * Format long/short ratio as percentage
 */
export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/**
 * Calculate sentiment score (-100 to +100)
 */
export function calculateSentimentScore(longRatio: number): number {
  // Convert 0-1 ratio to -100 to +100 score
  return (longRatio - 0.5) * 200;
}
