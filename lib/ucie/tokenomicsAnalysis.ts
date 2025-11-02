/**
 * Tokenomics Deep Dive Analysis for UCIE
 * 
 * Comprehensive tokenomics analysis including supply dynamics and inflation
 * Requirements: 24.1, 24.2, 24.3, 24.4, 24.5
 */

export interface SupplySchedule {
  currentSupply: number;
  maxSupply: number | null; // null if unlimited
  circulatingSupply: number;
  inflationRate: number; // Annual percentage
  emissionSchedule: EmissionEvent[];
  halvingEvents: HalvingEvent[];
  burnMechanism: BurnMechanism | null;
}

export interface EmissionEvent {
  date: string;
  amount: number;
  recipient: string;
  type: 'mining' | 'staking' | 'vesting' | 'unlock' | 'other';
  description: string;
}

export interface HalvingEvent {
  date: string;
  blockHeight: number;
  rewardBefore: number;
  rewardAfter: number;
  inflationImpact: number;
}

export interface BurnMechanism {
  type: 'transaction_fee' | 'buyback' | 'deflationary' | 'other';
  burnRate: number; // Tokens burned per period
  totalBurned: number;
  burnPercentage: number; // % of supply burned
  description: string;
}

export interface TokenVelocity {
  velocity: number; // Transactions per token per period
  period: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  interpretation: string;
}

export interface TokenDistribution {
  team: number;
  investors: number;
  community: number;
  treasury: number;
  foundation: number;
  other: number;
  concentrationScore: number; // 0-100 (higher = more concentrated)
  giniCoefficient: number; // 0-1 (higher = more unequal)
}

export interface FutureSupplyEstimate {
  timeframe: string;
  estimatedSupply: number;
  inflationFromNow: number;
  dilutionImpact: number; // % dilution for current holders
  assumptions: string[];
}

export interface TokenomicsScore {
  overall: number; // 0-100
  supplyManagement: number;
  distribution: number;
  utility: number;
  sustainability: number;
  transparency: number;
  breakdown: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
}

export interface TokenomicsReport {
  symbol: string;
  timestamp: string;
  supplySchedule: SupplySchedule;
  velocity: TokenVelocity;
  distribution: TokenDistribution;
  futureSupply: {
    oneYear: FutureSupplyEstimate;
    twoYears: FutureSupplyEstimate;
    fiveYears: FutureSupplyEstimate;
  };
  score: TokenomicsScore;
  peerComparison: {
    similarTokens: string[];
    supplyRank: number;
    inflationRank: number;
    distributionRank: number;
    overallRank: number;
  };
  summary: string;
}

/**
 * Calculate token velocity
 */
export function calculateTokenVelocity(
  transactionVolume: number,
  averageSupply: number,
  period: string = '30d'
): TokenVelocity {
  const velocity = averageSupply > 0 ? transactionVolume / averageSupply : 0;
  
  // Determine trend (would use historical data in production)
  const trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  let interpretation = '';
  if (velocity > 10) {
    interpretation = 'Very high velocity indicates active usage but may suggest speculative trading rather than holding';
  } else if (velocity > 5) {
    interpretation = 'High velocity suggests good liquidity and active usage';
  } else if (velocity > 2) {
    interpretation = 'Moderate velocity indicates balanced trading and holding behavior';
  } else if (velocity > 0.5) {
    interpretation = 'Low velocity suggests strong holding behavior and reduced speculation';
  } else {
    interpretation = 'Very low velocity may indicate low liquidity or inactive market';
  }
  
  return {
    velocity,
    period,
    trend,
    interpretation
  };
}

/**
 * Calculate burn rate
 */
export function calculateBurnRate(
  totalBurned: number,
  currentSupply: number,
  period: string = '30d'
): number {
  return (totalBurned / currentSupply) * 100;
}

/**
 * Calculate net inflation
 */
export function calculateNetInflation(
  inflationRate: number,
  burnRate: number
): number {
  return inflationRate - burnRate;
}

/**
 * Analyze token distribution
 */
export function analyzeTokenDistribution(
  distribution: {
    team: number;
    investors: number;
    community: number;
    treasury: number;
    foundation: number;
    other: number;
  },
  holderData: Array<{ address: string; balance: number }>
): TokenDistribution {
  // Calculate concentration score (0-100)
  const top10Percentage = holderData
    .slice(0, 10)
    .reduce((sum, h) => sum + h.balance, 0);
  const concentrationScore = Math.min(100, top10Percentage);
  
  // Calculate Gini coefficient
  const giniCoefficient = calculateGiniCoefficient(holderData.map(h => h.balance));
  
  return {
    ...distribution,
    concentrationScore,
    giniCoefficient
  };
}

/**
 * Calculate Gini coefficient
 */
function calculateGiniCoefficient(balances: number[]): number {
  if (balances.length === 0) return 0;
  
  const sortedBalances = [...balances].sort((a, b) => a - b);
  const n = sortedBalances.length;
  const totalBalance = sortedBalances.reduce((sum, b) => sum + b, 0);
  
  if (totalBalance === 0) return 0;
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sortedBalances[i];
  }
  
  const gini = numerator / (n * totalBalance);
  return Math.abs(gini);
}

/**
 * Estimate future supply
 */
export function estimateFutureSupply(
  currentSupply: number,
  inflationRate: number,
  burnRate: number,
  years: number,
  maxSupply: number | null
): FutureSupplyEstimate {
  const netInflationRate = (inflationRate - burnRate) / 100;
  let estimatedSupply = currentSupply;
  
  // Compound inflation over years
  for (let i = 0; i < years; i++) {
    estimatedSupply *= (1 + netInflationRate);
    
    // Cap at max supply if defined
    if (maxSupply && estimatedSupply > maxSupply) {
      estimatedSupply = maxSupply;
      break;
    }
  }
  
  const inflationFromNow = ((estimatedSupply - currentSupply) / currentSupply) * 100;
  const dilutionImpact = inflationFromNow;
  
  const assumptions = [
    `Constant net inflation rate of ${(netInflationRate * 100).toFixed(2)}% per year`,
    `No changes to emission or burn mechanisms`,
    maxSupply ? `Supply capped at ${maxSupply.toLocaleString()} tokens` : 'No maximum supply cap'
  ];
  
  return {
    timeframe: `${years} year${years > 1 ? 's' : ''}`,
    estimatedSupply,
    inflationFromNow,
    dilutionImpact,
    assumptions
  };
}

/**
 * Score tokenomics
 */
export function scoreTokenomics(
  supplySchedule: SupplySchedule,
  distribution: TokenDistribution,
  velocity: TokenVelocity,
  hasUtility: boolean
): TokenomicsScore {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  
  // Supply Management Score (0-100)
  let supplyScore = 50;
  
  if (supplySchedule.maxSupply !== null) {
    supplyScore += 15;
    strengths.push('Fixed maximum supply provides scarcity');
  } else {
    weaknesses.push('Unlimited supply may lead to inflation concerns');
    improvements.push('Consider implementing maximum supply cap');
  }
  
  if (supplySchedule.inflationRate < 5) {
    supplyScore += 15;
    strengths.push('Low inflation rate protects holder value');
  } else if (supplySchedule.inflationRate > 10) {
    supplyScore -= 10;
    weaknesses.push('High inflation rate may dilute holder value');
    improvements.push('Reduce emission rate or implement burn mechanism');
  }
  
  if (supplySchedule.burnMechanism) {
    supplyScore += 20;
    strengths.push('Burn mechanism creates deflationary pressure');
  } else {
    improvements.push('Consider implementing token burn mechanism');
  }
  
  // Distribution Score (0-100)
  let distributionScore = 50;
  
  if (distribution.concentrationScore < 30) {
    distributionScore += 25;
    strengths.push('Well-distributed token ownership');
  } else if (distribution.concentrationScore > 60) {
    distributionScore -= 20;
    weaknesses.push('High concentration among top holders');
    improvements.push('Improve token distribution through airdrops or incentives');
  }
  
  if (distribution.community > 40) {
    distributionScore += 15;
    strengths.push('Strong community allocation');
  } else {
    weaknesses.push('Low community allocation');
    improvements.push('Increase community allocation in future distributions');
  }
  
  if (distribution.team < 20) {
    distributionScore += 10;
    strengths.push('Reasonable team allocation');
  } else {
    weaknesses.push('High team allocation may create selling pressure');
    improvements.push('Implement longer vesting periods for team tokens');
  }
  
  // Utility Score (0-100)
  const utilityScore = hasUtility ? 80 : 30;
  if (hasUtility) {
    strengths.push('Token has clear utility within ecosystem');
  } else {
    weaknesses.push('Limited token utility');
    improvements.push('Develop more use cases for token within ecosystem');
  }
  
  // Sustainability Score (0-100)
  let sustainabilityScore = 50;
  
  const netInflation = calculateNetInflation(
    supplySchedule.inflationRate,
    supplySchedule.burnMechanism?.burnRate || 0
  );
  
  if (netInflation < 0) {
    sustainabilityScore += 25;
    strengths.push('Deflationary tokenomics');
  } else if (netInflation < 3) {
    sustainabilityScore += 15;
    strengths.push('Low net inflation rate');
  } else if (netInflation > 10) {
    sustainabilityScore -= 15;
    weaknesses.push('High net inflation may not be sustainable');
  }
  
  if (velocity.velocity > 1 && velocity.velocity < 5) {
    sustainabilityScore += 15;
    strengths.push('Healthy token velocity');
  }
  
  // Transparency Score (0-100)
  const transparencyScore = 75; // Based on data availability
  
  // Overall Score
  const overall = Math.round(
    (supplyScore * 0.25 +
      distributionScore * 0.25 +
      utilityScore * 0.2 +
      sustainabilityScore * 0.2 +
      transparencyScore * 0.1)
  );
  
  return {
    overall,
    supplyManagement: Math.round(supplyScore),
    distribution: Math.round(distributionScore),
    utility: utilityScore,
    sustainability: Math.round(sustainabilityScore),
    transparency: transparencyScore,
    breakdown: {
      strengths,
      weaknesses,
      improvements
    }
  };
}

/**
 * Compare against peer tokens
 */
export function compareToPeers(
  symbol: string,
  tokenomics: {
    inflationRate: number;
    distribution: TokenDistribution;
    score: TokenomicsScore;
  },
  peerData: Array<{
    symbol: string;
    inflationRate: number;
    concentrationScore: number;
    overallScore: number;
  }>
): {
  similarTokens: string[];
  supplyRank: number;
  inflationRank: number;
  distributionRank: number;
  overallRank: number;
} {
  // Find similar tokens (same category)
  const similarTokens = peerData.slice(0, 5).map(p => p.symbol);
  
  // Rank by inflation (lower is better)
  const inflationRank = peerData.filter(p => p.inflationRate < tokenomics.inflationRate).length + 1;
  
  // Rank by distribution (lower concentration is better)
  const distributionRank = peerData.filter(p => p.concentrationScore < tokenomics.distribution.concentrationScore).length + 1;
  
  // Rank by overall score (higher is better)
  const overallRank = peerData.filter(p => p.overallScore > tokenomics.score.overall).length + 1;
  
  // Supply rank (placeholder)
  const supplyRank = Math.floor(peerData.length / 2);
  
  return {
    similarTokens,
    supplyRank,
    inflationRank,
    distributionRank,
    overallRank
  };
}

/**
 * Generate comprehensive tokenomics report
 */
export async function generateTokenomicsReport(
  symbol: string,
  supplyData: {
    currentSupply: number;
    maxSupply: number | null;
    circulatingSupply: number;
    inflationRate: number;
    burnRate: number;
    totalBurned: number;
  },
  distributionData: {
    team: number;
    investors: number;
    community: number;
    treasury: number;
    foundation: number;
    other: number;
  },
  holderData: Array<{ address: string; balance: number }>,
  transactionVolume: number,
  hasUtility: boolean
): Promise<TokenomicsReport> {
  // Build supply schedule
  const supplySchedule: SupplySchedule = {
    currentSupply: supplyData.currentSupply,
    maxSupply: supplyData.maxSupply,
    circulatingSupply: supplyData.circulatingSupply,
    inflationRate: supplyData.inflationRate,
    emissionSchedule: [], // Would be populated from blockchain data
    halvingEvents: [], // Would be populated for tokens with halving
    burnMechanism: supplyData.burnRate > 0 ? {
      type: 'transaction_fee',
      burnRate: supplyData.burnRate,
      totalBurned: supplyData.totalBurned,
      burnPercentage: (supplyData.totalBurned / supplyData.currentSupply) * 100,
      description: 'Tokens burned through transaction fees'
    } : null
  };
  
  // Calculate velocity
  const velocity = calculateTokenVelocity(
    transactionVolume,
    supplyData.circulatingSupply,
    '30d'
  );
  
  // Analyze distribution
  const distribution = analyzeTokenDistribution(distributionData, holderData);
  
  // Estimate future supply
  const futureSupply = {
    oneYear: estimateFutureSupply(
      supplyData.currentSupply,
      supplyData.inflationRate,
      supplyData.burnRate,
      1,
      supplyData.maxSupply
    ),
    twoYears: estimateFutureSupply(
      supplyData.currentSupply,
      supplyData.inflationRate,
      supplyData.burnRate,
      2,
      supplyData.maxSupply
    ),
    fiveYears: estimateFutureSupply(
      supplyData.currentSupply,
      supplyData.inflationRate,
      supplyData.burnRate,
      5,
      supplyData.maxSupply
    )
  };
  
  // Score tokenomics
  const score = scoreTokenomics(supplySchedule, distribution, velocity, hasUtility);
  
  // Compare to peers (mock data for now)
  const peerComparison = compareToPeers(
    symbol,
    { inflationRate: supplyData.inflationRate, distribution, score },
    [
      { symbol: 'PEER1', inflationRate: 3.5, concentrationScore: 45, overallScore: 72 },
      { symbol: 'PEER2', inflationRate: 5.2, concentrationScore: 38, overallScore: 68 },
      { symbol: 'PEER3', inflationRate: 2.1, concentrationScore: 52, overallScore: 75 }
    ]
  );
  
  // Generate summary
  const netInflation = calculateNetInflation(supplyData.inflationRate, supplyData.burnRate);
  const summary = `Tokenomics score: ${score.overall}/100. ${supplyData.maxSupply ? 'Fixed' : 'Unlimited'} supply with ${netInflation.toFixed(2)}% net inflation. Distribution concentration: ${distribution.concentrationScore.toFixed(0)}/100. ${score.breakdown.strengths.length} strengths, ${score.breakdown.weaknesses.length} weaknesses identified.`;
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    supplySchedule,
    velocity,
    distribution,
    futureSupply,
    score,
    peerComparison,
    summary
  };
}
