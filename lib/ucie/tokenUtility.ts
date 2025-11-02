/**
 * Token Utility Analysis
 * 
 * This module provides functions for analyzing token utility and use cases.
 * 
 * Requirements: 18.3
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TokenUseCase {
  type: 'governance' | 'staking' | 'fees' | 'collateral' | 'payment' | 'rewards' | 'access' | 'other';
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  active: boolean;
}

export interface TokenUtilityAnalysis {
  useCases: TokenUseCase[];
  utilityScore: number;              // 0-100
  utilityCategory: 'minimal' | 'basic' | 'moderate' | 'strong' | 'exceptional';
  primaryUtility: string;
  secondaryUtilities: string[];
  hasGovernance: boolean;
  hasStaking: boolean;
  hasFeeDiscount: boolean;
  hasCollateralUse: boolean;
  utilityDiversification: number;    // 0-100, higher = more diverse use cases
  comparison: {
    vsCategory: 'below_average' | 'average' | 'above_average';
    percentile: number;
  };
}

// ============================================================================
// Token Utility Analysis Functions
// ============================================================================

/**
 * Analyze token utility and calculate utility score
 */
export function analyzeTokenUtility(
  useCases: TokenUseCase[],
  categoryAverageScore?: number
): TokenUtilityAnalysis {
  // Calculate utility score
  const utilityScore = calculateUtilityScore(useCases);
  
  // Categorize utility level
  const utilityCategory = categorizeUtility(utilityScore);
  
  // Identify primary and secondary utilities
  const { primary, secondary } = identifyUtilityHierarchy(useCases);
  
  // Check for specific utility types
  const hasGovernance = useCases.some(uc => uc.type === 'governance' && uc.active);
  const hasStaking = useCases.some(uc => uc.type === 'staking' && uc.active);
  const hasFeeDiscount = useCases.some(uc => uc.type === 'fees' && uc.active);
  const hasCollateralUse = useCases.some(uc => uc.type === 'collateral' && uc.active);
  
  // Calculate utility diversification
  const utilityDiversification = calculateUtilityDiversification(useCases);
  
  // Compare to category average
  const comparison = compareToCategory(utilityScore, categoryAverageScore || 50);

  return {
    useCases,
    utilityScore,
    utilityCategory,
    primaryUtility: primary,
    secondaryUtilities: secondary,
    hasGovernance,
    hasStaking,
    hasFeeDiscount,
    hasCollateralUse,
    utilityDiversification,
    comparison,
  };
}

/**
 * Calculate utility score (0-100)
 */
function calculateUtilityScore(useCases: TokenUseCase[]): number {
  if (useCases.length === 0) return 0;

  let score = 0;
  const weights = {
    governance: 20,
    staking: 25,
    fees: 20,
    collateral: 20,
    payment: 10,
    rewards: 15,
    access: 10,
    other: 5,
  };

  const importanceMultipliers = {
    critical: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4,
  };

  useCases.forEach(useCase => {
    if (!useCase.active) return;
    
    const baseWeight = weights[useCase.type] || 5;
    const multiplier = importanceMultipliers[useCase.importance];
    score += baseWeight * multiplier;
  });

  // Bonus for having multiple use cases (diversification)
  const activeUseCases = useCases.filter(uc => uc.active);
  if (activeUseCases.length >= 4) {
    score += 10;
  } else if (activeUseCases.length >= 3) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Categorize utility level
 */
function categorizeUtility(score: number): 'minimal' | 'basic' | 'moderate' | 'strong' | 'exceptional' {
  if (score < 20) return 'minimal';
  if (score < 40) return 'basic';
  if (score < 60) return 'moderate';
  if (score < 80) return 'strong';
  return 'exceptional';
}

/**
 * Identify primary and secondary utilities
 */
function identifyUtilityHierarchy(useCases: TokenUseCase[]): {
  primary: string;
  secondary: string[];
} {
  const activeUseCases = useCases.filter(uc => uc.active);
  
  if (activeUseCases.length === 0) {
    return { primary: 'None', secondary: [] };
  }

  // Sort by importance
  const sorted = [...activeUseCases].sort((a, b) => {
    const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });

  const primary = sorted[0].description;
  const secondary = sorted.slice(1, 4).map(uc => uc.description);

  return { primary, secondary };
}

/**
 * Calculate utility diversification (0-100)
 */
function calculateUtilityDiversification(useCases: TokenUseCase[]): number {
  const activeUseCases = useCases.filter(uc => uc.active);
  const uniqueTypes = new Set(activeUseCases.map(uc => uc.type));
  
  // Maximum of 8 different utility types
  const maxTypes = 8;
  const diversificationScore = (uniqueTypes.size / maxTypes) * 100;
  
  return Math.round(diversificationScore);
}

/**
 * Compare utility score to category average
 */
function compareToCategory(
  score: number,
  categoryAverage: number
): {
  vsCategory: 'below_average' | 'average' | 'above_average';
  percentile: number;
} {
  const ratio = score / categoryAverage;
  
  let vsCategory: 'below_average' | 'average' | 'above_average' = 'average';
  let percentile = 50;

  if (ratio > 1.3) {
    vsCategory = 'above_average';
    percentile = 75;
  } else if (ratio > 1.1) {
    vsCategory = 'above_average';
    percentile = 65;
  } else if (ratio < 0.7) {
    vsCategory = 'below_average';
    percentile = 25;
  } else if (ratio < 0.9) {
    vsCategory = 'below_average';
    percentile = 35;
  }

  return { vsCategory, percentile };
}

/**
 * Detect token use cases from protocol data
 */
export function detectTokenUseCases(protocolData: any): TokenUseCase[] {
  const useCases: TokenUseCase[] = [];

  // Check for governance (common in DeFi)
  if (protocolData.hasGovernance || protocolData.category?.includes('Governance')) {
    useCases.push({
      type: 'governance',
      description: 'Protocol governance and voting rights',
      importance: 'high',
      active: true,
    });
  }

  // Check for staking
  if (protocolData.hasStaking || protocolData.category?.includes('Staking')) {
    useCases.push({
      type: 'staking',
      description: 'Stake tokens to earn rewards and secure the network',
      importance: 'critical',
      active: true,
    });
  }

  // Check for fee discounts (common in exchanges)
  if (protocolData.category?.includes('DEX') || protocolData.category?.includes('Exchange')) {
    useCases.push({
      type: 'fees',
      description: 'Trading fee discounts for token holders',
      importance: 'medium',
      active: true,
    });
  }

  // Check for collateral use (lending protocols)
  if (protocolData.category?.includes('Lending') || protocolData.category?.includes('CDP')) {
    useCases.push({
      type: 'collateral',
      description: 'Use as collateral for borrowing',
      importance: 'high',
      active: true,
    });
  }

  // Check for rewards distribution
  if (protocolData.hasRewards || protocolData.category?.includes('Yield')) {
    useCases.push({
      type: 'rewards',
      description: 'Earn protocol revenue share and rewards',
      importance: 'high',
      active: true,
    });
  }

  return useCases;
}

/**
 * Generate utility analysis description
 */
export function generateUtilityDescription(analysis: TokenUtilityAnalysis): string {
  const { utilityScore, utilityCategory, primaryUtility, useCases } = analysis;
  
  const activeCount = useCases.filter(uc => uc.active).length;
  
  let categoryDesc = '';
  switch (utilityCategory) {
    case 'minimal':
      categoryDesc = 'minimal utility';
      break;
    case 'basic':
      categoryDesc = 'basic utility';
      break;
    case 'moderate':
      categoryDesc = 'moderate utility';
      break;
    case 'strong':
      categoryDesc = 'strong utility';
      break;
    case 'exceptional':
      categoryDesc = 'exceptional utility';
      break;
  }

  if (activeCount === 0) {
    return 'This token has no identified utility within the protocol.';
  }

  return `This token has ${categoryDesc} with a score of ${utilityScore}/100. ` +
         `The primary use case is: ${primaryUtility}. ` +
         `The token has ${activeCount} active use case${activeCount > 1 ? 's' : ''} within the protocol.`;
}

/**
 * Compare utility against similar protocols
 */
export function compareUtilityToSimilarProtocols(
  currentUtility: TokenUtilityAnalysis,
  similarProtocols: TokenUtilityAnalysis[]
): {
  rank: number;
  totalProtocols: number;
  percentile: number;
  betterThan: number;
  worseThan: number;
} {
  const allScores = [
    currentUtility.utilityScore,
    ...similarProtocols.map(p => p.utilityScore),
  ].sort((a, b) => b - a);

  const rank = allScores.indexOf(currentUtility.utilityScore) + 1;
  const totalProtocols = allScores.length;
  const percentile = ((totalProtocols - rank + 1) / totalProtocols) * 100;
  const betterThan = totalProtocols - rank;
  const worseThan = rank - 1;

  return {
    rank,
    totalProtocols,
    percentile: Math.round(percentile),
    betterThan,
    worseThan,
  };
}

/**
 * Identify missing utility opportunities
 */
export function identifyMissingUtilities(analysis: TokenUtilityAnalysis): string[] {
  const missing: string[] = [];

  if (!analysis.hasGovernance) {
    missing.push('Governance rights could increase token value and community engagement');
  }

  if (!analysis.hasStaking) {
    missing.push('Staking mechanism could provide yield and reduce circulating supply');
  }

  if (!analysis.hasFeeDiscount) {
    missing.push('Fee discounts could drive token demand and usage');
  }

  if (!analysis.hasCollateralUse) {
    missing.push('Collateral utility could expand token use cases in DeFi');
  }

  if (analysis.useCases.length < 3) {
    missing.push('Limited use cases - consider expanding token utility');
  }

  return missing;
}
