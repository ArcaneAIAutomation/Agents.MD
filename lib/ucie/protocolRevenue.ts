/**
 * Protocol Revenue Tracking
 * 
 * This module provides functions for tracking and analyzing protocol revenue,
 * fees generated, and token holder value capture.
 * 
 * Requirements: 18.2
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProtocolRevenueData {
  revenue24h: number;
  revenue7d: number;
  revenue30d: number;
  fees24h: number;
  fees7d: number;
  fees30d: number;
  protocolRevenue: number;      // Revenue retained by protocol
  holderRevenue: number;         // Revenue distributed to token holders
  revenueGrowthRate: number;     // Annualized growth rate
  feeToRevenueRatio: number;     // Efficiency metric
  holderValueCapture: number;    // % of revenue going to holders
}

export interface RevenueProjection {
  annualizedRevenue: number;
  projectedRevenue1y: number;
  projectedRevenue2y: number;
  projectedRevenue5y: number;
  growthAssumption: number;      // % annual growth
  confidence: number;            // 0-100
}

export interface RevenueAnalysis {
  current: ProtocolRevenueData;
  projection: RevenueProjection;
  revenueCategory: 'no_revenue' | 'low' | 'medium' | 'high' | 'very_high';
  revenueModel: string;
  valueCaptureScore: number;     // 0-100, how well token captures value
  sustainability: 'unsustainable' | 'questionable' | 'sustainable' | 'highly_sustainable';
}

// ============================================================================
// Revenue Calculation Functions
// ============================================================================

/**
 * Calculate protocol revenue metrics
 */
export function calculateProtocolRevenue(
  revenue24h: number,
  fees24h: number,
  protocolRevenue: number,
  holderRevenue: number
): ProtocolRevenueData {
  // Extrapolate to longer periods (rough estimates)
  const revenue7d = revenue24h * 7;
  const revenue30d = revenue24h * 30;
  const fees7d = fees24h * 7;
  const fees30d = fees24h * 30;

  // Calculate growth rate (annualized from 30-day data)
  const revenueGrowthRate = calculateGrowthRate(revenue30d);

  // Calculate fee to revenue ratio
  const feeToRevenueRatio = fees24h > 0 ? revenue24h / fees24h : 0;

  // Calculate holder value capture percentage
  const totalRevenue = protocolRevenue + holderRevenue;
  const holderValueCapture = totalRevenue > 0 ? (holderRevenue / totalRevenue) * 100 : 0;

  return {
    revenue24h,
    revenue7d,
    revenue30d,
    fees24h,
    fees7d,
    fees30d,
    protocolRevenue,
    holderRevenue,
    revenueGrowthRate,
    feeToRevenueRatio,
    holderValueCapture,
  };
}

/**
 * Calculate annualized revenue growth rate
 */
function calculateGrowthRate(revenue30d: number): number {
  // Simple annualization: (30-day revenue * 12)
  // In reality, would use historical data for more accurate calculation
  return revenue30d * 12;
}

/**
 * Project future revenue based on current trends
 */
export function projectRevenue(
  currentRevenue: ProtocolRevenueData,
  historicalGrowthRate?: number
): RevenueProjection {
  const annualizedRevenue = currentRevenue.revenue24h * 365;
  
  // Use historical growth rate if available, otherwise estimate from current data
  const growthAssumption = historicalGrowthRate || estimateGrowthRate(currentRevenue);
  
  // Project future revenue with compound growth
  const projectedRevenue1y = annualizedRevenue * (1 + growthAssumption / 100);
  const projectedRevenue2y = projectedRevenue1y * (1 + growthAssumption / 100);
  const projectedRevenue5y = annualizedRevenue * Math.pow(1 + growthAssumption / 100, 5);

  // Calculate confidence based on data quality and volatility
  const confidence = calculateProjectionConfidence(currentRevenue, growthAssumption);

  return {
    annualizedRevenue,
    projectedRevenue1y,
    projectedRevenue2y,
    projectedRevenue5y,
    growthAssumption,
    confidence,
  };
}

/**
 * Estimate growth rate from current revenue data
 */
function estimateGrowthRate(revenue: ProtocolRevenueData): number {
  // Conservative estimate: use 30-day to 7-day ratio
  if (revenue.revenue7d === 0) return 0;
  
  const weeklyGrowth = ((revenue.revenue30d / 4) - revenue.revenue7d) / revenue.revenue7d;
  const annualizedGrowth = weeklyGrowth * 52;
  
  // Cap at reasonable bounds (-50% to +200%)
  return Math.max(-50, Math.min(200, annualizedGrowth));
}

/**
 * Calculate confidence in revenue projections
 */
function calculateProjectionConfidence(
  revenue: ProtocolRevenueData,
  growthRate: number
): number {
  let confidence = 100;

  // Reduce confidence for extreme growth rates
  if (Math.abs(growthRate) > 100) {
    confidence -= 30;
  } else if (Math.abs(growthRate) > 50) {
    confidence -= 15;
  }

  // Reduce confidence for low revenue (less data)
  if (revenue.revenue24h < 1000) {
    confidence -= 20;
  } else if (revenue.revenue24h < 10000) {
    confidence -= 10;
  }

  // Reduce confidence for inconsistent fee/revenue ratio
  if (revenue.feeToRevenueRatio < 0.5 || revenue.feeToRevenueRatio > 2) {
    confidence -= 15;
  }

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Analyze protocol revenue comprehensively
 */
export function analyzeProtocolRevenue(
  revenue24h: number,
  fees24h: number,
  protocolRevenue: number,
  holderRevenue: number,
  historicalGrowthRate?: number
): RevenueAnalysis {
  const current = calculateProtocolRevenue(revenue24h, fees24h, protocolRevenue, holderRevenue);
  const projection = projectRevenue(current, historicalGrowthRate);
  
  // Categorize revenue level
  const revenueCategory = categorizeRevenue(projection.annualizedRevenue);
  
  // Determine revenue model
  const revenueModel = determineRevenueModel(current);
  
  // Calculate value capture score
  const valueCaptureScore = calculateValueCaptureScore(current);
  
  // Assess sustainability
  const sustainability = assessRevenueSustainability(current, projection);

  return {
    current,
    projection,
    revenueCategory,
    revenueModel,
    valueCaptureScore,
    sustainability,
  };
}

/**
 * Categorize revenue level
 */
function categorizeRevenue(
  annualizedRevenue: number
): 'no_revenue' | 'low' | 'medium' | 'high' | 'very_high' {
  if (annualizedRevenue === 0) return 'no_revenue';
  if (annualizedRevenue < 100_000) return 'low';          // < $100K
  if (annualizedRevenue < 1_000_000) return 'medium';     // < $1M
  if (annualizedRevenue < 10_000_000) return 'high';      // < $10M
  return 'very_high';                                      // >= $10M
}

/**
 * Determine revenue model based on revenue distribution
 */
function determineRevenueModel(revenue: ProtocolRevenueData): string {
  const { holderValueCapture, protocolRevenue, holderRevenue } = revenue;

  if (protocolRevenue === 0 && holderRevenue === 0) {
    return 'No revenue model';
  }

  if (holderValueCapture > 80) {
    return 'Token holder focused (>80% to holders)';
  } else if (holderValueCapture > 50) {
    return 'Balanced model (majority to holders)';
  } else if (holderValueCapture > 20) {
    return 'Protocol treasury focused (majority to protocol)';
  } else if (holderValueCapture > 0) {
    return 'Minimal holder value capture (<20%)';
  } else {
    return 'No holder value capture (100% to protocol)';
  }
}

/**
 * Calculate value capture score (0-100)
 * Higher score = better value capture for token holders
 */
function calculateValueCaptureScore(revenue: ProtocolRevenueData): number {
  let score = 0;

  // Factor 1: Holder value capture (40 points max)
  score += Math.min(40, revenue.holderValueCapture * 0.4);

  // Factor 2: Revenue generation (30 points max)
  const revenueScore = Math.min(30, (revenue.revenue24h / 100000) * 30);
  score += revenueScore;

  // Factor 3: Fee efficiency (20 points max)
  if (revenue.feeToRevenueRatio > 0.7 && revenue.feeToRevenueRatio < 1.3) {
    score += 20; // Efficient fee-to-revenue conversion
  } else if (revenue.feeToRevenueRatio > 0.5 && revenue.feeToRevenueRatio < 1.5) {
    score += 10;
  }

  // Factor 4: Growth (10 points max)
  if (revenue.revenueGrowthRate > 0) {
    score += Math.min(10, (revenue.revenueGrowthRate / 1000000) * 10);
  }

  return Math.round(Math.min(100, score));
}

/**
 * Assess revenue sustainability
 */
function assessRevenueSustainability(
  current: ProtocolRevenueData,
  projection: RevenueProjection
): 'unsustainable' | 'questionable' | 'sustainable' | 'highly_sustainable' {
  // Check for red flags
  if (current.revenue24h === 0) return 'unsustainable';
  if (projection.growthAssumption < -20) return 'unsustainable';
  
  // Check for warning signs
  if (current.revenue24h < 100 || projection.growthAssumption < 0) {
    return 'questionable';
  }

  // Check for good signs
  if (current.revenue24h > 10000 && projection.growthAssumption > 20) {
    return 'highly_sustainable';
  }

  if (current.revenue24h > 1000 && projection.growthAssumption > 0) {
    return 'sustainable';
  }

  return 'questionable';
}

/**
 * Format revenue for display
 */
export function formatRevenue(revenue: number): string {
  if (revenue >= 1_000_000_000) {
    return `$${(revenue / 1_000_000_000).toFixed(2)}B`;
  } else if (revenue >= 1_000_000) {
    return `$${(revenue / 1_000_000).toFixed(2)}M`;
  } else if (revenue >= 1_000) {
    return `$${(revenue / 1_000).toFixed(2)}K`;
  } else {
    return `$${revenue.toFixed(2)}`;
  }
}

/**
 * Generate revenue analysis description
 */
export function generateRevenueDescription(analysis: RevenueAnalysis): string {
  const { current, projection, revenueCategory, sustainability } = analysis;
  
  const annualRevenue = formatRevenue(projection.annualizedRevenue);
  const dailyRevenue = formatRevenue(current.revenue24h);
  const holderCapture = current.holderValueCapture.toFixed(1);

  let categoryDesc = '';
  switch (revenueCategory) {
    case 'no_revenue':
      return 'This protocol currently generates no revenue.';
    case 'low':
      categoryDesc = 'low revenue';
      break;
    case 'medium':
      categoryDesc = 'moderate revenue';
      break;
    case 'high':
      categoryDesc = 'high revenue';
      break;
    case 'very_high':
      categoryDesc = 'very high revenue';
      break;
  }

  return `This protocol generates ${categoryDesc} with approximately ${dailyRevenue} per day ` +
         `(${annualRevenue} annualized). Token holders capture ${holderCapture}% of protocol revenue. ` +
         `Revenue sustainability is assessed as ${sustainability}.`;
}
