/**
 * TVL (Total Value Locked) Analysis
 * 
 * This module provides functions for analyzing TVL data across DeFi protocols.
 * 
 * Requirements: 18.1
 */

import { DeFiLlamaTVLData, DeFiProtocolMetrics } from './defiClients';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TVLAnalysis {
  currentTVL: number;
  tvlChange24h: number;
  tvlChange7d: number;
  tvlChange30d: number;
  tvlTrend: 'increasing' | 'decreasing' | 'stable';
  tvlByChain: Array<{
    chain: string;
    tvl: number;
    percentage: number;
  }>;
  tvlRank?: number;
  tvlCategory: 'micro' | 'small' | 'medium' | 'large' | 'mega';
  dominantChain: string;
  chainDiversification: number; // 0-100, higher = more diversified
}

export interface TVLTrendData {
  timestamp: number;
  tvl: number;
  change: number;
}

// ============================================================================
// TVL Analysis Functions
// ============================================================================

/**
 * Analyze TVL data and calculate trends
 */
export function analyzeTVL(tvlData: DeFiLlamaTVLData | DeFiProtocolMetrics): TVLAnalysis {
  const currentTVL = tvlData.tvl;
  
  // Calculate changes
  let tvlChange24h = 0;
  let tvlChange7d = 0;
  let tvlChange30d = 0;

  if ('tvlPrevDay' in tvlData) {
    tvlChange24h = ((currentTVL - tvlData.tvlPrevDay) / tvlData.tvlPrevDay) * 100;
    tvlChange7d = ((currentTVL - tvlData.tvlPrevWeek) / tvlData.tvlPrevWeek) * 100;
    tvlChange30d = ((currentTVL - tvlData.tvlPrevMonth) / tvlData.tvlPrevMonth) * 100;
  } else if ('tvlChange7d' in tvlData) {
    tvlChange7d = tvlData.tvlChange7d;
    tvlChange30d = tvlData.tvlChange30d || 0;
  }

  // Determine trend
  const trend = determineTVLTrend(tvlChange7d);

  // Analyze chain distribution
  const chainTvls = tvlData.chainTvls || {};
  const tvlByChain = Object.entries(chainTvls)
    .map(([chain, tvl]) => ({
      chain,
      tvl,
      percentage: (tvl / currentTVL) * 100,
    }))
    .sort((a, b) => b.tvl - a.tvl);

  // Find dominant chain
  const dominantChain = tvlByChain[0]?.chain || 'Unknown';

  // Calculate chain diversification (Herfindahl-Hirschman Index inverted)
  const chainDiversification = calculateChainDiversification(tvlByChain);

  // Categorize TVL size
  const tvlCategory = categorizeTVL(currentTVL);

  return {
    currentTVL,
    tvlChange24h,
    tvlChange7d,
    tvlChange30d,
    tvlTrend: trend,
    tvlByChain,
    tvlCategory,
    dominantChain,
    chainDiversification,
  };
}

/**
 * Determine TVL trend based on 7-day change
 */
function determineTVLTrend(change7d: number): 'increasing' | 'decreasing' | 'stable' {
  if (change7d > 5) return 'increasing';
  if (change7d < -5) return 'decreasing';
  return 'stable';
}

/**
 * Calculate chain diversification score (0-100)
 * Higher score = more diversified across chains
 */
function calculateChainDiversification(
  tvlByChain: Array<{ chain: string; tvl: number; percentage: number }>
): number {
  if (tvlByChain.length === 0) return 0;
  if (tvlByChain.length === 1) return 0;

  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = tvlByChain.reduce((sum, item) => {
    const marketShare = item.percentage / 100;
    return sum + marketShare * marketShare;
  }, 0);

  // Invert and normalize to 0-100 scale
  // HHI ranges from 1/n (perfect diversification) to 1 (monopoly)
  const maxHHI = 1;
  const minHHI = 1 / tvlByChain.length;
  const normalizedHHI = (hhi - minHHI) / (maxHHI - minHHI);
  
  // Invert so higher score = more diversified
  return Math.round((1 - normalizedHHI) * 100);
}

/**
 * Categorize TVL size
 */
function categorizeTVL(tvl: number): 'micro' | 'small' | 'medium' | 'large' | 'mega' {
  if (tvl < 1_000_000) return 'micro';        // < $1M
  if (tvl < 10_000_000) return 'small';       // < $10M
  if (tvl < 100_000_000) return 'medium';     // < $100M
  if (tvl < 1_000_000_000) return 'large';    // < $1B
  return 'mega';                               // >= $1B
}

/**
 * Calculate TVL growth rate (annualized)
 */
export function calculateTVLGrowthRate(tvlChange30d: number): number {
  // Annualize the 30-day change
  return tvlChange30d * 12;
}

/**
 * Compare TVL against category average
 */
export function compareTVLToCategory(
  currentTVL: number,
  categoryAverageTVL: number
): {
  percentile: number;
  comparison: 'above_average' | 'average' | 'below_average';
} {
  const ratio = currentTVL / categoryAverageTVL;
  
  let percentile = 50;
  let comparison: 'above_average' | 'average' | 'below_average' = 'average';

  if (ratio > 1.5) {
    percentile = 75;
    comparison = 'above_average';
  } else if (ratio > 1.2) {
    percentile = 65;
    comparison = 'above_average';
  } else if (ratio < 0.5) {
    percentile = 25;
    comparison = 'below_average';
  } else if (ratio < 0.8) {
    percentile = 35;
    comparison = 'below_average';
  }

  return { percentile, comparison };
}

/**
 * Generate TVL trend description
 */
export function generateTVLTrendDescription(analysis: TVLAnalysis): string {
  const { currentTVL, tvlChange7d, tvlTrend, tvlCategory } = analysis;
  
  const tvlFormatted = formatTVL(currentTVL);
  const changeFormatted = tvlChange7d.toFixed(2);
  const direction = tvlChange7d > 0 ? 'increased' : 'decreased';
  
  let categoryDesc = '';
  switch (tvlCategory) {
    case 'micro':
      categoryDesc = 'a micro-cap protocol';
      break;
    case 'small':
      categoryDesc = 'a small protocol';
      break;
    case 'medium':
      categoryDesc = 'a medium-sized protocol';
      break;
    case 'large':
      categoryDesc = 'a large protocol';
      break;
    case 'mega':
      categoryDesc = 'a mega-cap protocol';
      break;
  }

  return `This is ${categoryDesc} with ${tvlFormatted} in Total Value Locked. ` +
         `TVL has ${direction} by ${Math.abs(parseFloat(changeFormatted))}% over the past 7 days, ` +
         `indicating a ${tvlTrend} trend.`;
}

/**
 * Format TVL for display
 */
export function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  } else if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  } else if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`;
  } else {
    return `$${tvl.toFixed(2)}`;
  }
}

/**
 * Calculate TVL market share within a category
 */
export function calculateTVLMarketShare(
  protocolTVL: number,
  categoryTotalTVL: number
): number {
  if (categoryTotalTVL === 0) return 0;
  return (protocolTVL / categoryTotalTVL) * 100;
}

/**
 * Identify TVL anomalies (unusual changes)
 */
export function identifyTVLAnomalies(analysis: TVLAnalysis): {
  hasAnomaly: boolean;
  type?: 'sudden_increase' | 'sudden_decrease' | 'extreme_volatility';
  severity: 'low' | 'medium' | 'high';
  description: string;
} {
  const { tvlChange24h, tvlChange7d } = analysis;

  // Check for sudden changes
  if (Math.abs(tvlChange24h) > 50) {
    return {
      hasAnomaly: true,
      type: tvlChange24h > 0 ? 'sudden_increase' : 'sudden_decrease',
      severity: 'high',
      description: `TVL changed by ${tvlChange24h.toFixed(2)}% in 24 hours, indicating unusual activity.`,
    };
  }

  if (Math.abs(tvlChange7d) > 100) {
    return {
      hasAnomaly: true,
      type: tvlChange7d > 0 ? 'sudden_increase' : 'sudden_decrease',
      severity: 'high',
      description: `TVL changed by ${tvlChange7d.toFixed(2)}% in 7 days, which is highly unusual.`,
    };
  }

  // Check for extreme volatility (large swings)
  if (Math.abs(tvlChange24h) > 20 && Math.abs(tvlChange7d) > 30) {
    return {
      hasAnomaly: true,
      type: 'extreme_volatility',
      severity: 'medium',
      description: 'TVL is experiencing high volatility with significant daily and weekly changes.',
    };
  }

  return {
    hasAnomaly: false,
    severity: 'low',
    description: 'TVL is within normal ranges.',
  };
}
