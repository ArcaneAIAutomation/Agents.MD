/**
 * Risk Scoring Algorithm for UCIE Risk Assessment
 * 
 * Aggregates multiple risk factors to calculate overall risk score (0-100):
 * - Volatility risk
 * - Liquidity risk
 * - Concentration risk (holder distribution)
 * - Regulatory risk
 * - Market cap risk
 * 
 * Generates risk category: Low, Medium, High, Critical
 */

export interface RiskScore {
  overall: number;
  category: 'Low' | 'Medium' | 'High' | 'Critical';
  components: {
    volatility: number;
    liquidity: number;
    concentration: number;
    regulatory: number;
    marketCap: number;
  };
  weights: {
    volatility: number;
    liquidity: number;
    concentration: number;
    regulatory: number;
    marketCap: number;
  };
  explanation: string;
}

export interface RiskInputs {
  // Volatility metrics
  annualizedVolatility: number;
  volatilityPercentile: number;
  
  // Liquidity metrics
  dailyVolume: number;
  marketCap: number;
  bidAskSpread?: number;
  
  // Concentration metrics
  top10HolderPercentage: number;
  giniCoefficient: number;
  
  // Regulatory metrics
  regulatoryStatus?: 'Clear' | 'Uncertain' | 'Problematic' | 'Banned';
  exchangeDelistings?: number;
  
  // Market cap
  marketCapUSD: number;
}

/**
 * Calculate volatility risk score (0-100)
 * Higher volatility = higher risk
 */
function calculateVolatilityRisk(
  annualizedVolatility: number,
  volatilityPercentile: number
): number {
  // Normalize annualized volatility to 0-100 scale
  // 0% volatility = 0 risk, 200%+ volatility = 100 risk
  const volScore = Math.min(annualizedVolatility / 2, 1) * 100;
  
  // Weight by percentile (higher percentile = higher risk)
  const percentileScore = volatilityPercentile;
  
  // Combine (70% volatility, 30% percentile)
  return volScore * 0.7 + percentileScore * 0.3;
}

/**
 * Calculate liquidity risk score (0-100)
 * Lower liquidity = higher risk
 */
function calculateLiquidityRisk(
  dailyVolume: number,
  marketCap: number,
  bidAskSpread?: number
): number {
  // Calculate volume-to-market-cap ratio
  const volumeRatio = dailyVolume / marketCap;
  
  // Ideal ratio is 0.1-0.3 (10-30% daily turnover)
  // Lower ratio = higher risk
  let volumeScore: number;
  if (volumeRatio < 0.01) volumeScore = 90;      // Very low liquidity
  else if (volumeRatio < 0.05) volumeScore = 70; // Low liquidity
  else if (volumeRatio < 0.1) volumeScore = 50;  // Moderate liquidity
  else if (volumeRatio < 0.3) volumeScore = 20;  // Good liquidity
  else volumeScore = 30;                          // High turnover (potential manipulation)
  
  // Factor in bid-ask spread if available
  let spreadScore = 50; // Default neutral
  if (bidAskSpread !== undefined) {
    // 0-0.1% spread = low risk, 1%+ spread = high risk
    spreadScore = Math.min(bidAskSpread * 100, 100);
  }
  
  // Combine (70% volume, 30% spread)
  return volumeScore * 0.7 + spreadScore * 0.3;
}

/**
 * Calculate concentration risk score (0-100)
 * Higher concentration = higher risk
 */
function calculateConcentrationRisk(
  top10HolderPercentage: number,
  giniCoefficient: number
): number {
  // Top 10 holder percentage
  // 0-20% = low risk, 80%+ = critical risk
  const holderScore = Math.min(top10HolderPercentage / 0.8, 1) * 100;
  
  // Gini coefficient (0 = perfect equality, 1 = perfect inequality)
  // 0-0.5 = low risk, 0.9+ = critical risk
  const giniScore = Math.min(giniCoefficient / 0.9, 1) * 100;
  
  // Combine (60% holder concentration, 40% Gini)
  return holderScore * 0.6 + giniScore * 0.4;
}

/**
 * Calculate regulatory risk score (0-100)
 * More regulatory issues = higher risk
 */
function calculateRegulatoryRisk(
  regulatoryStatus: 'Clear' | 'Uncertain' | 'Problematic' | 'Banned' = 'Uncertain',
  exchangeDelistings: number = 0
): number {
  // Base score from regulatory status
  let statusScore: number;
  switch (regulatoryStatus) {
    case 'Clear':
      statusScore = 10;
      break;
    case 'Uncertain':
      statusScore = 40;
      break;
    case 'Problematic':
      statusScore = 70;
      break;
    case 'Banned':
      statusScore = 100;
      break;
  }
  
  // Add penalty for exchange delistings (10 points per delisting, max 30)
  const delistingPenalty = Math.min(exchangeDelistings * 10, 30);
  
  return Math.min(statusScore + delistingPenalty, 100);
}

/**
 * Calculate market cap risk score (0-100)
 * Lower market cap = higher risk
 */
function calculateMarketCapRisk(marketCapUSD: number): number {
  // Market cap tiers
  if (marketCapUSD >= 10_000_000_000) return 10;  // $10B+ = very low risk
  if (marketCapUSD >= 1_000_000_000) return 25;   // $1B-$10B = low risk
  if (marketCapUSD >= 100_000_000) return 50;     // $100M-$1B = medium risk
  if (marketCapUSD >= 10_000_000) return 75;      // $10M-$100M = high risk
  return 95;                                       // <$10M = critical risk
}

/**
 * Generate risk explanation based on scores
 */
function generateRiskExplanation(
  overall: number,
  components: RiskScore['components']
): string {
  const highRiskFactors: string[] = [];
  
  if (components.volatility > 70) highRiskFactors.push('high volatility');
  if (components.liquidity > 70) highRiskFactors.push('low liquidity');
  if (components.concentration > 70) highRiskFactors.push('high holder concentration');
  if (components.regulatory > 70) highRiskFactors.push('regulatory concerns');
  if (components.marketCap > 70) highRiskFactors.push('small market cap');
  
  if (highRiskFactors.length === 0) {
    return 'This asset shows relatively low risk across all measured factors.';
  }
  
  return `Primary risk factors: ${highRiskFactors.join(', ')}.`;
}

/**
 * Main function to calculate overall risk score
 */
export function calculateRiskScore(inputs: RiskInputs): RiskScore {
  // Define weights for each risk component
  const weights = {
    volatility: 0.30,    // 30% weight
    liquidity: 0.25,     // 25% weight
    concentration: 0.20, // 20% weight
    regulatory: 0.15,    // 15% weight
    marketCap: 0.10      // 10% weight
  };
  
  // Calculate individual risk scores
  const components = {
    volatility: calculateVolatilityRisk(
      inputs.annualizedVolatility,
      inputs.volatilityPercentile
    ),
    liquidity: calculateLiquidityRisk(
      inputs.dailyVolume,
      inputs.marketCap,
      inputs.bidAskSpread
    ),
    concentration: calculateConcentrationRisk(
      inputs.top10HolderPercentage,
      inputs.giniCoefficient
    ),
    regulatory: calculateRegulatoryRisk(
      inputs.regulatoryStatus,
      inputs.exchangeDelistings
    ),
    marketCap: calculateMarketCapRisk(inputs.marketCapUSD)
  };
  
  // Calculate weighted overall score
  const overall = Math.round(
    components.volatility * weights.volatility +
    components.liquidity * weights.liquidity +
    components.concentration * weights.concentration +
    components.regulatory * weights.regulatory +
    components.marketCap * weights.marketCap
  );
  
  // Determine risk category
  let category: 'Low' | 'Medium' | 'High' | 'Critical';
  if (overall < 30) category = 'Low';
  else if (overall < 50) category = 'Medium';
  else if (overall < 75) category = 'High';
  else category = 'Critical';
  
  // Generate explanation
  const explanation = generateRiskExplanation(overall, components);
  
  return {
    overall,
    category,
    components,
    weights,
    explanation
  };
}

/**
 * Calculate risk score with default values for missing inputs
 */
export function calculateRiskScoreWithDefaults(
  partialInputs: Partial<RiskInputs>
): RiskScore {
  const defaultInputs: RiskInputs = {
    annualizedVolatility: 0.5,
    volatilityPercentile: 50,
    dailyVolume: 1_000_000,
    marketCap: 100_000_000,
    bidAskSpread: 0.005,
    top10HolderPercentage: 0.5,
    giniCoefficient: 0.7,
    regulatoryStatus: 'Uncertain',
    exchangeDelistings: 0,
    marketCapUSD: 100_000_000
  };
  
  const inputs = { ...defaultInputs, ...partialInputs };
  return calculateRiskScore(inputs);
}
