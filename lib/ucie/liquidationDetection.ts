/**
 * Liquidation Level Detection
 * 
 * Identifies and analyzes liquidation clusters:
 * - Identify liquidation clusters at price levels
 * - Estimate cascade liquidation potential
 * - Calculate probability scores for cascades
 */

import { LiquidationData, OpenInterestData } from './derivativesClients';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LiquidationCluster {
  priceLevel: number;
  totalLiquidations: number;
  totalValue: number;
  longLiquidations: number;
  shortLiquidations: number;
  exchanges: string[];
  density: number; // Liquidations per $100 price range
  severity: 'extreme' | 'high' | 'moderate' | 'low';
}

export interface CascadePotential {
  triggerPrice: number;
  direction: 'up' | 'down';
  estimatedLiquidations: number;
  estimatedValue: number;
  probability: number;
  impactLevel: 'extreme' | 'high' | 'moderate' | 'low';
  description: string;
  chainReaction: boolean;
}

export interface LiquidationHeatmap {
  priceRange: {
    min: number;
    max: number;
    current: number;
  };
  clusters: LiquidationCluster[];
  hotspots: number[]; // Price levels with highest liquidation risk
  cascadePotentials: CascadePotential[];
}

export interface LiquidationAnalysis {
  symbol: string;
  timestamp: string;
  currentPrice: number;
  recentLiquidations: LiquidationData[];
  totalLiquidated24h: number;
  totalValue24h: number;
  longLiquidationRatio: number;
  shortLiquidationRatio: number;
  heatmap: LiquidationHeatmap;
  riskLevel: 'extreme' | 'high' | 'moderate' | 'low';
  recommendation: string;
}

// ============================================================================
// Liquidation Detection Functions
// ============================================================================

/**
 * Analyze liquidation data and detect clusters
 */
export function analyzeLiquidations(
  recentLiquidations: LiquidationData[],
  currentPrice: number,
  openInterest?: OpenInterestData[]
): LiquidationAnalysis {
  const symbol = recentLiquidations[0]?.symbol || 'UNKNOWN';
  const timestamp = new Date().toISOString();

  // Calculate 24h totals
  const totalLiquidated24h = recentLiquidations.length;
  const totalValue24h = recentLiquidations.reduce((sum, liq) => sum + liq.value, 0);

  // Calculate long/short ratios
  const longLiquidations = recentLiquidations.filter(l => l.side === 'long').length;
  const shortLiquidations = recentLiquidations.filter(l => l.side === 'short').length;
  const total = longLiquidations + shortLiquidations;
  
  const longLiquidationRatio = total > 0 ? longLiquidations / total : 0;
  const shortLiquidationRatio = total > 0 ? shortLiquidations / total : 0;

  // Generate liquidation heatmap
  const heatmap = generateLiquidationHeatmap(
    recentLiquidations,
    currentPrice,
    openInterest
  );

  // Assess overall risk level
  const riskLevel = assessLiquidationRisk(heatmap, totalValue24h);

  // Generate recommendation
  const recommendation = generateRecommendation(
    heatmap,
    riskLevel,
    longLiquidationRatio,
    shortLiquidationRatio
  );

  return {
    symbol,
    timestamp,
    currentPrice,
    recentLiquidations,
    totalLiquidated24h,
    totalValue24h,
    longLiquidationRatio,
    shortLiquidationRatio,
    heatmap,
    riskLevel,
    recommendation
  };
}

/**
 * Generate liquidation heatmap with clusters
 */
function generateLiquidationHeatmap(
  liquidations: LiquidationData[],
  currentPrice: number,
  openInterest?: OpenInterestData[]
): LiquidationHeatmap {
  // Define price range (±20% from current price)
  const priceRange = {
    min: currentPrice * 0.8,
    max: currentPrice * 1.2,
    current: currentPrice
  };

  // Identify liquidation clusters
  const clusters = identifyLiquidationClusters(liquidations, priceRange);

  // Find hotspots (price levels with highest density)
  const hotspots = clusters
    .filter(c => c.severity === 'extreme' || c.severity === 'high')
    .map(c => c.priceLevel)
    .slice(0, 5); // Top 5 hotspots

  // Estimate cascade potentials
  const cascadePotentials = estimateCascadePotentials(
    clusters,
    currentPrice,
    openInterest
  );

  return {
    priceRange,
    clusters,
    hotspots,
    cascadePotentials
  };
}

/**
 * Identify liquidation clusters at specific price levels
 */
function identifyLiquidationClusters(
  liquidations: LiquidationData[],
  priceRange: { min: number; max: number; current: number }
): LiquidationCluster[] {
  // Group liquidations into $100 price buckets
  const bucketSize = 100;
  const buckets = new Map<number, LiquidationData[]>();

  liquidations.forEach((liq) => {
    if (liq.price >= priceRange.min && liq.price <= priceRange.max) {
      const bucket = Math.floor(liq.price / bucketSize) * bucketSize;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, []);
      }
      buckets.get(bucket)!.push(liq);
    }
  });

  // Convert buckets to clusters
  const clusters: LiquidationCluster[] = [];

  buckets.forEach((liqs, priceLevel) => {
    const totalLiquidations = liqs.length;
    const totalValue = liqs.reduce((sum, l) => sum + l.value, 0);
    const longLiquidations = liqs.filter(l => l.side === 'long').length;
    const shortLiquidations = liqs.filter(l => l.side === 'short').length;
    const exchanges = [...new Set(liqs.map(l => l.exchange))];
    const density = totalLiquidations; // Liquidations per bucket

    // Determine severity based on density and value
    let severity: 'extreme' | 'high' | 'moderate' | 'low';
    if (density >= 50 || totalValue >= 10_000_000) {
      severity = 'extreme';
    } else if (density >= 20 || totalValue >= 5_000_000) {
      severity = 'high';
    } else if (density >= 10 || totalValue >= 1_000_000) {
      severity = 'moderate';
    } else {
      severity = 'low';
    }

    clusters.push({
      priceLevel,
      totalLiquidations,
      totalValue,
      longLiquidations,
      shortLiquidations,
      exchanges,
      density,
      severity
    });
  });

  // Sort by density (highest first)
  return clusters.sort((a, b) => b.density - a.density);
}

/**
 * Estimate cascade liquidation potential
 */
function estimateCascadePotentials(
  clusters: LiquidationCluster[],
  currentPrice: number,
  openInterest?: OpenInterestData[]
): CascadePotential[] {
  const potentials: CascadePotential[] = [];

  // Calculate total open interest
  const totalOI = openInterest
    ? openInterest.reduce((sum, oi) => sum + oi.openInterestValue, 0)
    : 0;

  // Check for cascade potential above current price (short liquidations)
  const aboveClusters = clusters.filter(c => c.priceLevel > currentPrice);
  if (aboveClusters.length > 0) {
    const cascade = estimateCascade(
      aboveClusters,
      'up',
      currentPrice,
      totalOI
    );
    if (cascade) {
      potentials.push(cascade);
    }
  }

  // Check for cascade potential below current price (long liquidations)
  const belowClusters = clusters.filter(c => c.priceLevel < currentPrice);
  if (belowClusters.length > 0) {
    const cascade = estimateCascade(
      belowClusters,
      'down',
      currentPrice,
      totalOI
    );
    if (cascade) {
      potentials.push(cascade);
    }
  }

  return potentials;
}

/**
 * Estimate cascade for a direction
 */
function estimateCascade(
  clusters: LiquidationCluster[],
  direction: 'up' | 'down',
  currentPrice: number,
  totalOI: number
): CascadePotential | null {
  if (clusters.length === 0) {
    return null;
  }

  // Find the nearest significant cluster
  const sortedClusters = direction === 'up'
    ? clusters.sort((a, b) => a.priceLevel - b.priceLevel)
    : clusters.sort((a, b) => b.priceLevel - a.priceLevel);

  const triggerCluster = sortedClusters.find(
    c => c.severity === 'extreme' || c.severity === 'high'
  ) || sortedClusters[0];

  const triggerPrice = triggerCluster.priceLevel;
  const estimatedLiquidations = triggerCluster.totalLiquidations;
  const estimatedValue = triggerCluster.totalValue;

  // Calculate probability based on distance and cluster severity
  const priceDistance = Math.abs(triggerPrice - currentPrice);
  const distancePercent = (priceDistance / currentPrice) * 100;
  
  let baseProbability = 50;
  if (distancePercent < 2) {
    baseProbability = 80;
  } else if (distancePercent < 5) {
    baseProbability = 60;
  } else if (distancePercent < 10) {
    baseProbability = 40;
  } else {
    baseProbability = 20;
  }

  // Adjust for cluster severity
  if (triggerCluster.severity === 'extreme') {
    baseProbability += 15;
  } else if (triggerCluster.severity === 'high') {
    baseProbability += 10;
  }

  const probability = Math.min(95, baseProbability);

  // Determine impact level
  const oiImpactPercent = totalOI > 0 ? (estimatedValue / totalOI) * 100 : 0;
  let impactLevel: 'extreme' | 'high' | 'moderate' | 'low';
  
  if (oiImpactPercent > 10 || estimatedValue > 50_000_000) {
    impactLevel = 'extreme';
  } else if (oiImpactPercent > 5 || estimatedValue > 20_000_000) {
    impactLevel = 'high';
  } else if (oiImpactPercent > 2 || estimatedValue > 5_000_000) {
    impactLevel = 'moderate';
  } else {
    impactLevel = 'low';
  }

  // Check for chain reaction potential
  const chainReaction = sortedClusters.length > 1 && 
    sortedClusters.slice(0, 3).every(c => c.severity === 'extreme' || c.severity === 'high');

  // Generate description
  const description = `If price moves ${direction} to $${triggerPrice.toFixed(2)} (${distancePercent.toFixed(1)}% ${direction === 'up' ? 'above' : 'below'} current), approximately $${(estimatedValue / 1_000_000).toFixed(2)}M in ${direction === 'up' ? 'short' : 'long'} positions could be liquidated. ${chainReaction ? 'This could trigger a cascade effect with multiple liquidation clusters.' : ''}`;

  return {
    triggerPrice,
    direction,
    estimatedLiquidations,
    estimatedValue,
    probability,
    impactLevel,
    description,
    chainReaction
  };
}

/**
 * Assess overall liquidation risk level
 */
function assessLiquidationRisk(
  heatmap: LiquidationHeatmap,
  totalValue24h: number
): 'extreme' | 'high' | 'moderate' | 'low' {
  const extremeCascades = heatmap.cascadePotentials.filter(
    c => c.impactLevel === 'extreme' && c.probability > 50
  );

  const highCascades = heatmap.cascadePotentials.filter(
    c => c.impactLevel === 'high' && c.probability > 50
  );

  if (extremeCascades.length > 0 || totalValue24h > 100_000_000) {
    return 'extreme';
  } else if (highCascades.length > 0 || totalValue24h > 50_000_000) {
    return 'high';
  } else if (heatmap.cascadePotentials.length > 0 || totalValue24h > 10_000_000) {
    return 'moderate';
  } else {
    return 'low';
  }
}

/**
 * Generate trading recommendation
 */
function generateRecommendation(
  heatmap: LiquidationHeatmap,
  riskLevel: string,
  longLiqRatio: number,
  shortLiqRatio: number
): string {
  const recommendations: string[] = [];

  // Risk level warning
  if (riskLevel === 'extreme') {
    recommendations.push('⚠️ EXTREME liquidation risk detected. Exercise extreme caution with leveraged positions.');
  } else if (riskLevel === 'high') {
    recommendations.push('⚠️ HIGH liquidation risk. Consider reducing leverage or avoiding new positions.');
  }

  // Cascade warnings
  const nearCascades = heatmap.cascadePotentials.filter(
    c => c.probability > 60 && Math.abs(c.triggerPrice - heatmap.priceRange.current) / heatmap.priceRange.current < 0.05
  );

  if (nearCascades.length > 0) {
    nearCascades.forEach(cascade => {
      recommendations.push(`🔥 Cascade risk at $${cascade.triggerPrice.toFixed(2)} (${cascade.direction}). Probability: ${cascade.probability}%`);
    });
  }

  // Liquidation ratio insights
  if (longLiqRatio > 0.7) {
    recommendations.push('📊 Majority of recent liquidations were longs, suggesting downward price pressure.');
  } else if (shortLiqRatio > 0.7) {
    recommendations.push('📊 Majority of recent liquidations were shorts, suggesting upward price pressure.');
  }

  // Hotspot warnings
  if (heatmap.hotspots.length > 0) {
    recommendations.push(`🎯 Key liquidation levels: ${heatmap.hotspots.map(p => `$${p.toFixed(0)}`).join(', ')}`);
  }

  return recommendations.join(' ');
}

/**
 * Format liquidation value
 */
export function formatLiquidationValue(value: number): string {
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
