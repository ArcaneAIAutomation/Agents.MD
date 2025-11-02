/**
 * Open Interest Tracking
 * 
 * Tracks and analyzes open interest across exchanges:
 * - Aggregate open interest across exchanges
 * - Calculate 24h, 7d, 30d changes
 * - Track open interest by exchange
 * - Identify unusual OI spikes
 */

import { OpenInterestData } from './derivativesClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface OpenInterestChange {
  period: '24h' | '7d' | '30d';
  absolute: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ExchangeOpenInterest {
  exchange: string;
  openInterest: number;
  openInterestValue: number;
  percentageOfTotal: number;
  change24h: number;
  change24hPercent: number;
}

export interface OpenInterestSpike {
  exchange: string;
  currentOI: number;
  previousOI: number;
  change: number;
  changePercent: number;
  severity: 'extreme' | 'high' | 'moderate';
  description: string;
  timestamp: string;
}

export interface OpenInterestAnalysis {
  symbol: string;
  timestamp: string;
  totalOpenInterest: number;
  totalOpenInterestValue: number;
  changes: OpenInterestChange[];
  byExchange: ExchangeOpenInterest[];
  spikes: OpenInterestSpike[];
  dominantExchange: string;
  marketSignal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

// ============================================================================
// Open Interest Tracking Functions
// ============================================================================

/**
 * Analyze open interest data
 */
export function analyzeOpenInterest(
  currentOI: OpenInterestData[],
  historical24h?: OpenInterestData[],
  historical7d?: OpenInterestData[],
  historical30d?: OpenInterestData[]
): OpenInterestAnalysis {
  const symbol = currentOI[0]?.symbol || 'UNKNOWN';
  const timestamp = new Date().toISOString();

  // Calculate total open interest
  const totalOpenInterest = currentOI.reduce((sum, oi) => sum + oi.openInterest, 0);
  const totalOpenInterestValue = currentOI.reduce((sum, oi) => sum + oi.openInterestValue, 0);

  // Calculate changes over different periods
  const changes = calculateChanges(
    totalOpenInterest,
    historical24h,
    historical7d,
    historical30d
  );

  // Break down by exchange
  const byExchange = calculateExchangeBreakdown(
    currentOI,
    historical24h,
    totalOpenInterest
  );

  // Identify unusual spikes
  const spikes = identifySpikes(currentOI, historical24h);

  // Determine dominant exchange
  const dominantExchange = byExchange.length > 0
    ? byExchange.reduce((max, ex) => ex.openInterest > max.openInterest ? ex : max).exchange
    : 'Unknown';

  // Generate market signal
  const { signal, confidence } = generateMarketSignal(changes, spikes);

  return {
    symbol,
    timestamp,
    totalOpenInterest,
    totalOpenInterestValue,
    changes,
    byExchange,
    spikes,
    dominantExchange,
    marketSignal: signal,
    confidence
  };
}

/**
 * Calculate 24h, 7d, 30d changes
 */
function calculateChanges(
  currentTotal: number,
  historical24h?: OpenInterestData[],
  historical7d?: OpenInterestData[],
  historical30d?: OpenInterestData[]
): OpenInterestChange[] {
  const changes: OpenInterestChange[] = [];

  // 24h change
  if (historical24h && historical24h.length > 0) {
    const total24h = historical24h.reduce((sum, oi) => sum + oi.openInterest, 0);
    const absolute = currentTotal - total24h;
    const percentage = total24h > 0 ? (absolute / total24h) * 100 : 0;
    
    changes.push({
      period: '24h',
      absolute,
      percentage,
      trend: determineTrend(percentage)
    });
  }

  // 7d change
  if (historical7d && historical7d.length > 0) {
    const total7d = historical7d.reduce((sum, oi) => sum + oi.openInterest, 0);
    const absolute = currentTotal - total7d;
    const percentage = total7d > 0 ? (absolute / total7d) * 100 : 0;
    
    changes.push({
      period: '7d',
      absolute,
      percentage,
      trend: determineTrend(percentage)
    });
  }

  // 30d change
  if (historical30d && historical30d.length > 0) {
    const total30d = historical30d.reduce((sum, oi) => sum + oi.openInterest, 0);
    const absolute = currentTotal - total30d;
    const percentage = total30d > 0 ? (absolute / total30d) * 100 : 0;
    
    changes.push({
      period: '30d',
      absolute,
      percentage,
      trend: determineTrend(percentage)
    });
  }

  return changes;
}

/**
 * Determine trend from percentage change
 */
function determineTrend(percentageChange: number): 'increasing' | 'decreasing' | 'stable' {
  if (percentageChange > 5) {
    return 'increasing';
  } else if (percentageChange < -5) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Calculate open interest breakdown by exchange
 */
function calculateExchangeBreakdown(
  currentOI: OpenInterestData[],
  historical24h: OpenInterestData[] | undefined,
  totalOpenInterest: number
): ExchangeOpenInterest[] {
  return currentOI.map((oi) => {
    const percentageOfTotal = totalOpenInterest > 0
      ? (oi.openInterest / totalOpenInterest) * 100
      : 0;

    // Find 24h historical data for this exchange
    const historical = historical24h?.find(h => h.exchange === oi.exchange);
    const change24h = historical ? oi.openInterest - historical.openInterest : 0;
    const change24hPercent = historical && historical.openInterest > 0
      ? (change24h / historical.openInterest) * 100
      : 0;

    return {
      exchange: oi.exchange,
      openInterest: oi.openInterest,
      openInterestValue: oi.openInterestValue,
      percentageOfTotal,
      change24h,
      change24hPercent
    };
  }).sort((a, b) => b.openInterest - a.openInterest); // Sort by OI descending
}

/**
 * Identify unusual OI spikes
 */
function identifySpikes(
  currentOI: OpenInterestData[],
  historical24h?: OpenInterestData[]
): OpenInterestSpike[] {
  if (!historical24h || historical24h.length === 0) {
    return [];
  }

  const spikes: OpenInterestSpike[] = [];

  currentOI.forEach((current) => {
    const previous = historical24h.find(h => h.exchange === current.exchange);
    
    if (!previous || previous.openInterest === 0) {
      return;
    }

    const change = current.openInterest - previous.openInterest;
    const changePercent = (change / previous.openInterest) * 100;

    // Identify significant changes
    let severity: 'extreme' | 'high' | 'moderate' | null = null;
    let description = '';

    if (Math.abs(changePercent) >= 50) {
      severity = 'extreme';
      description = `Extreme ${changePercent > 0 ? 'increase' : 'decrease'} of ${Math.abs(changePercent).toFixed(1)}% in open interest on ${current.exchange}. This suggests ${changePercent > 0 ? 'massive new positions being opened' : 'significant position closures or liquidations'}.`;
    } else if (Math.abs(changePercent) >= 25) {
      severity = 'high';
      description = `High ${changePercent > 0 ? 'increase' : 'decrease'} of ${Math.abs(changePercent).toFixed(1)}% in open interest on ${current.exchange}. This indicates ${changePercent > 0 ? 'strong new interest' : 'notable position unwinding'}.`;
    } else if (Math.abs(changePercent) >= 15) {
      severity = 'moderate';
      description = `Moderate ${changePercent > 0 ? 'increase' : 'decrease'} of ${Math.abs(changePercent).toFixed(1)}% in open interest on ${current.exchange}.`;
    }

    if (severity) {
      spikes.push({
        exchange: current.exchange,
        currentOI: current.openInterest,
        previousOI: previous.openInterest,
        change,
        changePercent,
        severity,
        description,
        timestamp: current.timestamp
      });
    }
  });

  return spikes.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

/**
 * Generate market signal based on OI changes
 */
function generateMarketSignal(
  changes: OpenInterestChange[],
  spikes: OpenInterestSpike[]
): { signal: 'bullish' | 'bearish' | 'neutral'; confidence: number } {
  // Find 24h change
  const change24h = changes.find(c => c.period === '24h');
  
  if (!change24h) {
    return { signal: 'neutral', confidence: 0 };
  }

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let confidence = 50;

  // Increasing OI generally suggests trend continuation
  if (change24h.percentage > 15) {
    signal = 'bullish';
    confidence = Math.min(85, 50 + change24h.percentage);
  } else if (change24h.percentage < -15) {
    signal = 'bearish';
    confidence = Math.min(85, 50 + Math.abs(change24h.percentage));
  }

  // Adjust confidence based on spikes
  const extremeSpikes = spikes.filter(s => s.severity === 'extreme');
  if (extremeSpikes.length > 0) {
    confidence = Math.min(95, confidence + 10);
  }

  return { signal, confidence };
}

/**
 * Calculate OI concentration (Herfindahl-Hirschman Index)
 */
export function calculateOIConcentration(byExchange: ExchangeOpenInterest[]): number {
  // HHI = sum of squared market shares
  const hhi = byExchange.reduce((sum, ex) => {
    const marketShare = ex.percentageOfTotal / 100;
    return sum + Math.pow(marketShare, 2);
  }, 0);

  return hhi * 10000; // Scale to 0-10000
}

/**
 * Interpret OI concentration
 */
export function interpretConcentration(hhi: number): string {
  if (hhi > 2500) {
    return 'Highly concentrated - Single exchange dominates';
  } else if (hhi > 1500) {
    return 'Moderately concentrated - Few exchanges dominate';
  } else {
    return 'Well distributed - Multiple exchanges have significant OI';
  }
}

/**
 * Calculate OI to volume ratio
 */
export function calculateOIVolumeRatio(
  openInterest: number,
  volume24h: number
): number {
  if (volume24h === 0) return 0;
  return openInterest / volume24h;
}

/**
 * Interpret OI/Volume ratio
 */
export function interpretOIVolumeRatio(ratio: number): string {
  if (ratio > 10) {
    return 'Very high - Positions are being held, low turnover';
  } else if (ratio > 5) {
    return 'High - More holding than trading';
  } else if (ratio > 2) {
    return 'Moderate - Balanced holding and trading';
  } else if (ratio > 1) {
    return 'Low - More trading than holding';
  } else {
    return 'Very low - High turnover, positions not being held';
  }
}

/**
 * Format open interest value
 */
export function formatOI(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}
