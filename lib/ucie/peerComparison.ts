/**
 * Peer Comparison Analysis
 * 
 * This module provides functions for comparing DeFi protocols against their peers
 * in the same category.
 * 
 * Requirements: 18.5
 */

import { TVLAnalysis } from './tvlAnalysis';
import { RevenueAnalysis } from './protocolRevenue';
import { TokenUtilityAnalysis } from './tokenUtility';
import { DevelopmentAnalysis } from './developmentActivity';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PeerProtocol {
  symbol: string;
  name: string;
  category: string;
  tvl: number;
  revenue24h: number;
  utilityScore: number;
  developmentScore: number;
  marketCap?: number;
}

export interface PeerComparisonMetrics {
  tvl: {
    value: number;
    rank: number;
    percentile: number;
    vsAverage: number;        // % difference from average
    vsMedian: number;         // % difference from median
  };
  revenue: {
    value: number;
    rank: number;
    percentile: number;
    vsAverage: number;
    vsMedian: number;
  };
  utility: {
    score: number;
    rank: number;
    percentile: number;
    vsAverage: number;
    vsMedian: number;
  };
  development: {
    score: number;
    rank: number;
    percentile: number;
    vsAverage: number;
    vsMedian: number;
  };
  overall: {
    compositeScore: number;
    rank: number;
    percentile: number;
    category: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
  };
}

export interface PeerComparisonAnalysis {
  protocol: {
    symbol: string;
    name: string;
    category: string;
  };
  peers: PeerProtocol[];
  metrics: PeerComparisonMetrics;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
}

// ============================================================================
// Peer Identification Functions
// ============================================================================

/**
 * Identify similar protocols in the same category
 */
export function identifySimilarProtocols(
  category: string,
  allProtocols: PeerProtocol[]
): PeerProtocol[] {
  // Filter protocols in the same category
  const similarProtocols = allProtocols.filter(p => 
    p.category.toLowerCase() === category.toLowerCase()
  );

  // Sort by TVL (descending)
  return similarProtocols.sort((a, b) => b.tvl - a.tvl);
}

/**
 * Find top competitors by TVL
 */
export function findTopCompetitors(
  currentProtocol: PeerProtocol,
  peers: PeerProtocol[],
  limit: number = 5
): PeerProtocol[] {
  // Exclude current protocol
  const competitors = peers.filter(p => p.symbol !== currentProtocol.symbol);
  
  // Sort by TVL and take top N
  return competitors
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, limit);
}

// ============================================================================
// Comparison Calculation Functions
// ============================================================================

/**
 * Calculate peer comparison metrics
 */
export function calculatePeerComparison(
  currentProtocol: {
    symbol: string;
    name: string;
    category: string;
    tvl: number;
    revenue24h: number;
    utilityScore: number;
    developmentScore: number;
  },
  peers: PeerProtocol[]
): PeerComparisonMetrics {
  // Include current protocol in calculations
  const allProtocols = [...peers, currentProtocol as PeerProtocol];

  // Calculate TVL metrics
  const tvlMetrics = calculateMetricComparison(
    currentProtocol.tvl,
    allProtocols.map(p => p.tvl)
  );

  // Calculate revenue metrics
  const revenueMetrics = calculateMetricComparison(
    currentProtocol.revenue24h,
    allProtocols.map(p => p.revenue24h)
  );

  // Calculate utility metrics
  const utilityMetrics = calculateMetricComparison(
    currentProtocol.utilityScore,
    allProtocols.map(p => p.utilityScore)
  );

  // Calculate development metrics
  const developmentMetrics = calculateMetricComparison(
    currentProtocol.developmentScore,
    allProtocols.map(p => p.developmentScore)
  );

  // Calculate overall composite score
  const compositeScore = calculateCompositeScore({
    tvl: tvlMetrics.percentile,
    revenue: revenueMetrics.percentile,
    utility: utilityMetrics.percentile,
    development: developmentMetrics.percentile,
  });

  const overallRank = calculateRank(compositeScore, allProtocols.map(p => 
    calculateCompositeScore({
      tvl: calculateMetricComparison(p.tvl, allProtocols.map(x => x.tvl)).percentile,
      revenue: calculateMetricComparison(p.revenue24h, allProtocols.map(x => x.revenue24h)).percentile,
      utility: calculateMetricComparison(p.utilityScore, allProtocols.map(x => x.utilityScore)).percentile,
      development: calculateMetricComparison(p.developmentScore, allProtocols.map(x => x.developmentScore)).percentile,
    })
  ));

  const overallPercentile = ((allProtocols.length - overallRank + 1) / allProtocols.length) * 100;
  const overallCategory = categorizeOverallPerformance(overallPercentile);

  return {
    tvl: {
      value: currentProtocol.tvl,
      rank: tvlMetrics.rank,
      percentile: tvlMetrics.percentile,
      vsAverage: tvlMetrics.vsAverage,
      vsMedian: tvlMetrics.vsMedian,
    },
    revenue: {
      value: currentProtocol.revenue24h,
      rank: revenueMetrics.rank,
      percentile: revenueMetrics.percentile,
      vsAverage: revenueMetrics.vsAverage,
      vsMedian: revenueMetrics.vsMedian,
    },
    utility: {
      score: currentProtocol.utilityScore,
      rank: utilityMetrics.rank,
      percentile: utilityMetrics.percentile,
      vsAverage: utilityMetrics.vsAverage,
      vsMedian: utilityMetrics.vsMedian,
    },
    development: {
      score: currentProtocol.developmentScore,
      rank: developmentMetrics.rank,
      percentile: developmentMetrics.percentile,
      vsAverage: developmentMetrics.vsAverage,
      vsMedian: developmentMetrics.vsMedian,
    },
    overall: {
      compositeScore,
      rank: overallRank,
      percentile: Math.round(overallPercentile),
      category: overallCategory,
    },
  };
}

/**
 * Calculate comparison metrics for a single metric
 */
function calculateMetricComparison(
  currentValue: number,
  allValues: number[]
): {
  rank: number;
  percentile: number;
  vsAverage: number;
  vsMedian: number;
} {
  // Sort values descending
  const sorted = [...allValues].sort((a, b) => b - a);
  
  // Calculate rank
  const rank = sorted.indexOf(currentValue) + 1;
  
  // Calculate percentile
  const percentile = ((allValues.length - rank + 1) / allValues.length) * 100;
  
  // Calculate average
  const average = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
  const vsAverage = average > 0 ? ((currentValue - average) / average) * 100 : 0;
  
  // Calculate median
  const median = sorted[Math.floor(sorted.length / 2)];
  const vsMedian = median > 0 ? ((currentValue - median) / median) * 100 : 0;

  return {
    rank,
    percentile: Math.round(percentile),
    vsAverage: Math.round(vsAverage * 10) / 10,
    vsMedian: Math.round(vsMedian * 10) / 10,
  };
}

/**
 * Calculate rank for a value in a list
 */
function calculateRank(value: number, allValues: number[]): number {
  const sorted = [...allValues].sort((a, b) => b - a);
  return sorted.indexOf(value) + 1;
}

/**
 * Calculate composite score from multiple metrics
 */
function calculateCompositeScore(metrics: {
  tvl: number;
  revenue: number;
  utility: number;
  development: number;
}): number {
  // Weighted average of percentiles
  const weights = {
    tvl: 0.35,        // 35% weight
    revenue: 0.30,    // 30% weight
    utility: 0.20,    // 20% weight
    development: 0.15, // 15% weight
  };

  return (
    metrics.tvl * weights.tvl +
    metrics.revenue * weights.revenue +
    metrics.utility * weights.utility +
    metrics.development * weights.development
  );
}

/**
 * Categorize overall performance
 */
function categorizeOverallPerformance(
  percentile: number
): 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard' {
  if (percentile >= 80) return 'leader';
  if (percentile >= 60) return 'above_average';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'laggard';
}

// ============================================================================
// SWOT Analysis Functions
// ============================================================================

/**
 * Perform SWOT analysis based on peer comparison
 */
export function performSWOTAnalysis(
  metrics: PeerComparisonMetrics,
  peers: PeerProtocol[]
): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // Identify strengths (top 25% in any metric)
  if (metrics.tvl.percentile >= 75) {
    strengths.push(`Top quartile TVL (${metrics.tvl.percentile}th percentile)`);
  }
  if (metrics.revenue.percentile >= 75) {
    strengths.push(`Top quartile revenue generation (${metrics.revenue.percentile}th percentile)`);
  }
  if (metrics.utility.percentile >= 75) {
    strengths.push(`Strong token utility (${metrics.utility.percentile}th percentile)`);
  }
  if (metrics.development.percentile >= 75) {
    strengths.push(`Active development (${metrics.development.percentile}th percentile)`);
  }

  // Identify weaknesses (bottom 25% in any metric)
  if (metrics.tvl.percentile <= 25) {
    weaknesses.push(`Low TVL compared to peers (${metrics.tvl.percentile}th percentile)`);
  }
  if (metrics.revenue.percentile <= 25) {
    weaknesses.push(`Below-average revenue generation (${metrics.revenue.percentile}th percentile)`);
  }
  if (metrics.utility.percentile <= 25) {
    weaknesses.push(`Limited token utility (${metrics.utility.percentile}th percentile)`);
  }
  if (metrics.development.percentile <= 25) {
    weaknesses.push(`Low development activity (${metrics.development.percentile}th percentile)`);
  }

  // Identify opportunities
  if (metrics.tvl.vsAverage < -20) {
    opportunities.push('Significant TVL growth potential to reach category average');
  }
  if (metrics.utility.score < 60) {
    opportunities.push('Expand token utility to increase value capture');
  }
  if (metrics.development.score < 60) {
    opportunities.push('Increase development activity to improve competitiveness');
  }

  // Identify threats
  const topCompetitor = peers.sort((a, b) => b.tvl - a.tvl)[0];
  if (topCompetitor && topCompetitor.tvl > metrics.tvl.value * 5) {
    threats.push(`Market leader has ${Math.round(topCompetitor.tvl / metrics.tvl.value)}x more TVL`);
  }
  if (metrics.overall.category === 'below_average' || metrics.overall.category === 'laggard') {
    threats.push('Below-average performance may lead to loss of market share');
  }

  return { strengths, weaknesses, opportunities, threats };
}

// ============================================================================
// Analysis Generation Functions
// ============================================================================

/**
 * Generate comprehensive peer comparison analysis
 */
export function analyzePeerComparison(
  currentProtocol: {
    symbol: string;
    name: string;
    category: string;
    tvl: number;
    revenue24h: number;
    utilityScore: number;
    developmentScore: number;
  },
  peers: PeerProtocol[]
): PeerComparisonAnalysis {
  const metrics = calculatePeerComparison(currentProtocol, peers);
  const swot = performSWOTAnalysis(metrics, peers);
  const summary = generateComparisonSummary(currentProtocol, metrics, peers);

  return {
    protocol: {
      symbol: currentProtocol.symbol,
      name: currentProtocol.name,
      category: currentProtocol.category,
    },
    peers,
    metrics,
    strengths: swot.strengths,
    weaknesses: swot.weaknesses,
    opportunities: swot.opportunities,
    threats: swot.threats,
    summary,
  };
}

/**
 * Generate comparison summary text
 */
function generateComparisonSummary(
  protocol: { name: string; category: string },
  metrics: PeerComparisonMetrics,
  peers: PeerProtocol[]
): string {
  const categoryDesc = metrics.overall.category.replace('_', ' ');
  const totalPeers = peers.length;

  return `${protocol.name} ranks #${metrics.overall.rank} out of ${totalPeers + 1} protocols ` +
         `in the ${protocol.category} category, placing it as a ${categoryDesc} performer. ` +
         `The protocol is in the ${metrics.overall.percentile}th percentile overall, ` +
         `with particularly ${metrics.tvl.percentile >= 60 ? 'strong' : 'weak'} TVL performance ` +
         `(${metrics.tvl.percentile}th percentile) and ` +
         `${metrics.revenue.percentile >= 60 ? 'strong' : 'weak'} revenue generation ` +
         `(${metrics.revenue.percentile}th percentile).`;
}

/**
 * Format comparison table data
 */
export function formatComparisonTable(
  currentProtocol: { symbol: string; name: string; tvl: number; revenue24h: number; utilityScore: number },
  peers: PeerProtocol[]
): Array<{
  rank: number;
  name: string;
  symbol: string;
  tvl: string;
  revenue: string;
  utility: number;
  isCurrent: boolean;
}> {
  const allProtocols = [
    { ...currentProtocol, isCurrent: true },
    ...peers.map(p => ({ ...p, isCurrent: false })),
  ];

  // Sort by TVL
  const sorted = allProtocols.sort((a, b) => b.tvl - a.tvl);

  return sorted.map((protocol, index) => ({
    rank: index + 1,
    name: protocol.name,
    symbol: protocol.symbol,
    tvl: formatTVL(protocol.tvl),
    revenue: formatRevenue(protocol.revenue24h),
    utility: protocol.utilityScore,
    isCurrent: protocol.isCurrent,
  }));
}

/**
 * Format TVL for display
 */
function formatTVL(tvl: number): string {
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
 * Format revenue for display
 */
function formatRevenue(revenue: number): string {
  if (revenue >= 1_000_000) {
    return `$${(revenue / 1_000_000).toFixed(2)}M`;
  } else if (revenue >= 1_000) {
    return `$${(revenue / 1_000).toFixed(2)}K`;
  } else {
    return `$${revenue.toFixed(2)}`;
  }
}
