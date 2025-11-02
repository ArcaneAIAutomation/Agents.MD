/**
 * Portfolio Impact Analysis for UCIE Risk Assessment
 * 
 * Calculates portfolio metrics at different allocation percentages:
 * - Portfolio Sharpe ratio impact
 * - Diversification benefits
 * - Risk-adjusted return improvements
 * - Optimal allocation recommendations
 */

export interface PortfolioImpactAnalysis {
  allocations: AllocationScenario[];
  optimalAllocation: number;
  diversificationBenefit: number;
  recommendations: string[];
}

export interface AllocationScenario {
  percentage: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  diversificationScore: number;
}

export interface AssetMetrics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  correlationWithPortfolio: number;
}

export interface PortfolioMetrics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  assets: {
    symbol: string;
    allocation: number;
    expectedReturn: number;
    volatility: number;
  }[];
}

/**
 * Calculate portfolio expected return
 */
function calculatePortfolioReturn(
  currentPortfolio: PortfolioMetrics,
  newAsset: AssetMetrics,
  allocation: number
): number {
  // Weighted average of returns
  const portfolioReturn = currentPortfolio.expectedReturn * (1 - allocation);
  const assetReturn = newAsset.expectedReturn * allocation;
  
  return portfolioReturn + assetReturn;
}

/**
 * Calculate portfolio volatility with new asset
 * Uses correlation to account for diversification
 */
function calculatePortfolioVolatility(
  currentPortfolio: PortfolioMetrics,
  newAsset: AssetMetrics,
  allocation: number
): number {
  const w1 = 1 - allocation; // Weight of current portfolio
  const w2 = allocation;      // Weight of new asset
  
  const var1 = Math.pow(currentPortfolio.volatility, 2);
  const var2 = Math.pow(newAsset.volatility, 2);
  const corr = newAsset.correlationWithPortfolio;
  
  // Portfolio variance formula
  const portfolioVariance = 
    Math.pow(w1, 2) * var1 +
    Math.pow(w2, 2) * var2 +
    2 * w1 * w2 * corr * currentPortfolio.volatility * newAsset.volatility;
  
  return Math.sqrt(portfolioVariance);
}

/**
 * Calculate Sharpe ratio
 * Assumes risk-free rate of 4% (typical for crypto analysis)
 */
function calculateSharpeRatio(
  expectedReturn: number,
  volatility: number,
  riskFreeRate: number = 0.04
): number {
  if (volatility === 0) return 0;
  return (expectedReturn - riskFreeRate) / volatility;
}

/**
 * Estimate maximum drawdown based on volatility
 * Uses empirical relationship: MaxDD ≈ 2 * volatility
 */
function estimateMaxDrawdown(volatility: number): number {
  return Math.min(volatility * 2, 0.99); // Cap at 99%
}

/**
 * Calculate diversification score
 * Based on correlation and allocation
 */
function calculateDiversificationScore(
  correlation: number,
  allocation: number
): number {
  // Lower correlation = better diversification
  // Moderate allocation = better diversification
  const correlationScore = (1 - Math.abs(correlation)) * 100;
  
  // Optimal allocation is around 10-20%
  let allocationScore: number;
  if (allocation < 0.05) allocationScore = 50;      // Too small
  else if (allocation < 0.10) allocationScore = 80; // Good
  else if (allocation < 0.20) allocationScore = 100; // Optimal
  else if (allocation < 0.30) allocationScore = 80; // Still good
  else allocationScore = 50;                         // Too large
  
  return (correlationScore * 0.7 + allocationScore * 0.3);
}

/**
 * Generate allocation recommendations
 */
function generateRecommendations(
  scenarios: AllocationScenario[],
  currentSharpe: number
): string[] {
  const recommendations: string[] = [];
  
  // Find best Sharpe ratio scenario
  const bestSharpe = scenarios.reduce((best, current) => 
    current.sharpeRatio > best.sharpeRatio ? current : best
  );
  
  if (bestSharpe.sharpeRatio > currentSharpe) {
    recommendations.push(
      `Adding ${bestSharpe.percentage}% allocation could improve portfolio Sharpe ratio from ${currentSharpe.toFixed(2)} to ${bestSharpe.sharpeRatio.toFixed(2)}`
    );
  } else {
    recommendations.push(
      'Adding this asset may not improve risk-adjusted returns significantly'
    );
  }
  
  // Check diversification
  const bestDiversification = scenarios.reduce((best, current) =>
    current.diversificationScore > best.diversificationScore ? current : best
  );
  
  if (bestDiversification.diversificationScore > 70) {
    recommendations.push(
      `${bestDiversification.percentage}% allocation provides optimal diversification benefits`
    );
  }
  
  // Check risk impact
  const scenarios10 = scenarios.find(s => s.percentage === 10);
  if (scenarios10 && scenarios10.volatility < currentSharpe * 1.1) {
    recommendations.push(
      'A 10% allocation adds minimal additional risk to the portfolio'
    );
  }
  
  // Conservative recommendation
  if (bestSharpe.percentage > 20) {
    recommendations.push(
      'Consider starting with a smaller allocation (5-10%) and increasing gradually'
    );
  }
  
  return recommendations;
}

/**
 * Main function to calculate portfolio impact analysis
 */
export function calculatePortfolioImpact(
  currentPortfolio: PortfolioMetrics,
  newAsset: AssetMetrics,
  allocationPercentages: number[] = [0.01, 0.05, 0.10, 0.20]
): PortfolioImpactAnalysis {
  const scenarios: AllocationScenario[] = [];
  
  // Calculate metrics for each allocation scenario
  for (const allocation of allocationPercentages) {
    const expectedReturn = calculatePortfolioReturn(
      currentPortfolio,
      newAsset,
      allocation
    );
    
    const volatility = calculatePortfolioVolatility(
      currentPortfolio,
      newAsset,
      allocation
    );
    
    const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility);
    const maxDrawdown = estimateMaxDrawdown(volatility);
    const diversificationScore = calculateDiversificationScore(
      newAsset.correlationWithPortfolio,
      allocation
    );
    
    scenarios.push({
      percentage: allocation * 100,
      expectedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      diversificationScore
    });
  }
  
  // Find optimal allocation (best Sharpe ratio)
  const optimalScenario = scenarios.reduce((best, current) =>
    current.sharpeRatio > best.sharpeRatio ? current : best
  );
  
  // Calculate diversification benefit
  // Compare portfolio volatility with and without the asset
  const volatilityWithout = currentPortfolio.volatility;
  const volatilityWith = optimalScenario.volatility;
  const diversificationBenefit = Math.max(
    0,
    (volatilityWithout - volatilityWith) / volatilityWithout * 100
  );
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    scenarios,
    currentPortfolio.sharpeRatio
  );
  
  return {
    allocations: scenarios,
    optimalAllocation: optimalScenario.percentage,
    diversificationBenefit,
    recommendations
  };
}

/**
 * Create a default portfolio for analysis
 * Represents a typical 60/40 crypto portfolio (60% BTC, 40% ETH)
 */
export function createDefaultPortfolio(): PortfolioMetrics {
  return {
    expectedReturn: 0.25,  // 25% expected annual return
    volatility: 0.60,      // 60% annual volatility
    sharpeRatio: 0.35,     // (0.25 - 0.04) / 0.60
    assets: [
      {
        symbol: 'BTC',
        allocation: 0.60,
        expectedReturn: 0.20,
        volatility: 0.55
      },
      {
        symbol: 'ETH',
        allocation: 0.40,
        expectedReturn: 0.32,
        volatility: 0.70
      }
    ]
  };
}

/**
 * Calculate portfolio impact with default portfolio
 */
export function calculatePortfolioImpactWithDefaults(
  newAsset: AssetMetrics,
  allocationPercentages?: number[]
): PortfolioImpactAnalysis {
  const defaultPortfolio = createDefaultPortfolio();
  return calculatePortfolioImpact(defaultPortfolio, newAsset, allocationPercentages);
}

/**
 * Estimate asset metrics from historical data
 */
export function estimateAssetMetrics(
  annualizedReturn: number,
  annualizedVolatility: number,
  correlationWithBTC: number,
  correlationWithETH: number
): AssetMetrics {
  // Estimate correlation with typical 60/40 BTC/ETH portfolio
  const correlationWithPortfolio = 
    correlationWithBTC * 0.60 + correlationWithETH * 0.40;
  
  const sharpeRatio = calculateSharpeRatio(annualizedReturn, annualizedVolatility);
  
  return {
    expectedReturn: annualizedReturn,
    volatility: annualizedVolatility,
    sharpeRatio,
    correlationWithPortfolio
  };
}
