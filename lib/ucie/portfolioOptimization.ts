/**
 * Portfolio Optimization for UCIE
 * 
 * Modern Portfolio Theory optimization and correlation analysis
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */

export interface CorrelationData {
  asset: string;
  correlation30d: number;
  correlation90d: number;
  correlation1y: number;
  averageCorrelation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  significance: number; // p-value
}

export interface CorrelationMatrix {
  assets: string[];
  correlations: number[][]; // 2D matrix
  period: string;
}

export interface CorrelationRegimeChange {
  asset: string;
  previousCorrelation: number;
  currentCorrelation: number;
  change: number;
  changeType: 'positive_to_negative' | 'negative_to_positive' | 'strengthening' | 'weakening';
  significance: number;
  date: string;
  description: string;
}

export interface PortfolioMetrics {
  expectedReturn: number; // Annual percentage
  volatility: number; // Annual standard deviation
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  beta: number; // Relative to BTC
  alpha: number; // Excess return over BTC
}

export interface EfficientFrontierPoint {
  risk: number; // Volatility
  return: number; // Expected return
  sharpeRatio: number;
  weights: Record<string, number>; // Asset allocations
}

export interface OptimalPortfolio {
  type: 'max_sharpe' | 'min_volatility' | 'target_return';
  weights: Record<string, number>;
  metrics: PortfolioMetrics;
  description: string;
}

export interface ScenarioAnalysis {
  scenario: 'bull' | 'bear' | 'sideways';
  probability: number;
  expectedReturn: number;
  volatility: number;
  description: string;
  assumptions: string[];
}

export interface PortfolioOptimizationReport {
  symbol: string;
  timestamp: string;
  correlations: {
    withBTC: CorrelationData;
    withETH: CorrelationData;
    withTop50: CorrelationData[];
  };
  correlationMatrix: CorrelationMatrix;
  regimeChanges: CorrelationRegimeChange[];
  currentMetrics: PortfolioMetrics;
  efficientFrontier: EfficientFrontierPoint[];
  optimalPortfolios: {
    maxSharpe: OptimalPortfolio;
    minVolatility: OptimalPortfolio;
    targetReturn: OptimalPortfolio;
  };
  scenarioAnalysis: ScenarioAnalysis[];
  diversificationBenefit: number; // Percentage reduction in risk
  recommendation: string;
}

/**
 * Calculate correlation coefficient
 */
export function calculateCorrelation(
  returns1: number[],
  returns2: number[]
): number {
  if (returns1.length !== returns2.length || returns1.length === 0) {
    return 0;
  }
  
  const n = returns1.length;
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;
  
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Calculate rolling correlation
 */
export function calculateRollingCorrelation(
  returns1: number[],
  returns2: number[],
  window: number
): number[] {
  const rollingCorrelations: number[] = [];
  
  for (let i = window; i <= returns1.length; i++) {
    const window1 = returns1.slice(i - window, i);
    const window2 = returns2.slice(i - window, i);
    rollingCorrelations.push(calculateCorrelation(window1, window2));
  }
  
  return rollingCorrelations;
}

/**
 * Analyze correlation with asset
 */
export function analyzeCorrelation(
  asset: string,
  returns: number[],
  assetReturns: number[]
): CorrelationData {
  // Calculate correlations for different periods
  const correlation30d = calculateCorrelation(
    returns.slice(-30),
    assetReturns.slice(-30)
  );
  
  const correlation90d = calculateCorrelation(
    returns.slice(-90),
    assetReturns.slice(-90)
  );
  
  const correlation1y = calculateCorrelation(
    returns.slice(-365),
    assetReturns.slice(-365)
  );
  
  const averageCorrelation = (correlation30d + correlation90d + correlation1y) / 3;
  
  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (correlation30d > correlation90d && correlation90d > correlation1y) {
    trend = 'increasing';
  } else if (correlation30d < correlation90d && correlation90d < correlation1y) {
    trend = 'decreasing';
  }
  
  // Calculate statistical significance (simplified)
  const n = Math.min(returns.length, assetReturns.length);
  const tStat = averageCorrelation * Math.sqrt((n - 2) / (1 - averageCorrelation * averageCorrelation));
  const significance = 1 - Math.abs(tStat) / 10; // Simplified p-value approximation
  
  return {
    asset,
    correlation30d,
    correlation90d,
    correlation1y,
    averageCorrelation,
    trend,
    significance
  };
}

/**
 * Build correlation matrix
 */
export function buildCorrelationMatrix(
  assets: string[],
  returnsData: Record<string, number[]>,
  period: string = '90d'
): CorrelationMatrix {
  const n = assets.length;
  const correlations: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlations[i][j] = 1;
      } else {
        correlations[i][j] = calculateCorrelation(
          returnsData[assets[i]],
          returnsData[assets[j]]
        );
      }
    }
  }
  
  return {
    assets,
    correlations,
    period
  };
}

/**
 * Detect correlation regime changes
 */
export function detectRegimeChanges(
  asset: string,
  currentCorrelation: number,
  historicalCorrelations: Array<{ date: string; correlation: number }>
): CorrelationRegimeChange | null {
  if (historicalCorrelations.length === 0) return null;
  
  const previousCorrelation = historicalCorrelations[historicalCorrelations.length - 1].correlation;
  const change = currentCorrelation - previousCorrelation;
  
  // Detect significant regime changes (>0.3 change)
  if (Math.abs(change) < 0.3) return null;
  
  let changeType: 'positive_to_negative' | 'negative_to_positive' | 'strengthening' | 'weakening';
  let description = '';
  
  if (previousCorrelation > 0 && currentCorrelation < 0) {
    changeType = 'positive_to_negative';
    description = `Correlation shifted from positive (${previousCorrelation.toFixed(2)}) to negative (${currentCorrelation.toFixed(2)})`;
  } else if (previousCorrelation < 0 && currentCorrelation > 0) {
    changeType = 'negative_to_positive';
    description = `Correlation shifted from negative (${previousCorrelation.toFixed(2)}) to positive (${currentCorrelation.toFixed(2)})`;
  } else if (Math.abs(currentCorrelation) > Math.abs(previousCorrelation)) {
    changeType = 'strengthening';
    description = `Correlation strengthened from ${previousCorrelation.toFixed(2)} to ${currentCorrelation.toFixed(2)}`;
  } else {
    changeType = 'weakening';
    description = `Correlation weakened from ${previousCorrelation.toFixed(2)} to ${currentCorrelation.toFixed(2)}`;
  }
  
  return {
    asset,
    previousCorrelation,
    currentCorrelation,
    change,
    changeType,
    significance: Math.abs(change),
    date: new Date().toISOString(),
    description
  };
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(
  weights: Record<string, number>,
  returns: Record<string, number[]>,
  btcReturns: number[]
): PortfolioMetrics {
  const assets = Object.keys(weights);
  const n = returns[assets[0]].length;
  
  // Calculate portfolio returns
  const portfolioReturns: number[] = [];
  for (let i = 0; i < n; i++) {
    let portfolioReturn = 0;
    assets.forEach(asset => {
      portfolioReturn += weights[asset] * returns[asset][i];
    });
    portfolioReturns.push(portfolioReturn);
  }
  
  // Expected return (annualized)
  const avgReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / n;
  const expectedReturn = avgReturn * 252; // Annualize (252 trading days)
  
  // Volatility (annualized)
  const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / n;
  const volatility = Math.sqrt(variance) * Math.sqrt(252);
  
  // Sharpe Ratio (assuming 2% risk-free rate)
  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
  
  // Sortino Ratio (downside deviation)
  const downsideReturns = portfolioReturns.filter(r => r < 0);
  const downsideVariance = downsideReturns.length > 0
    ? downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
  const sortinoRatio = downsideDeviation > 0 ? (expectedReturn - riskFreeRate) / downsideDeviation : 0;
  
  // Maximum Drawdown
  let peak = portfolioReturns[0];
  let maxDrawdown = 0;
  let cumReturn = 0;
  
  portfolioReturns.forEach(r => {
    cumReturn += r;
    if (cumReturn > peak) peak = cumReturn;
    const drawdown = (peak - cumReturn) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // Calmar Ratio
  const calmarRatio = maxDrawdown > 0 ? expectedReturn / maxDrawdown : 0;
  
  // Beta and Alpha (relative to BTC)
  const btcAvgReturn = btcReturns.reduce((sum, r) => sum + r, 0) / btcReturns.length;
  const btcVariance = btcReturns.reduce((sum, r) => sum + Math.pow(r - btcAvgReturn, 2), 0) / btcReturns.length;
  
  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (portfolioReturns[i] - avgReturn) * (btcReturns[i] - btcAvgReturn);
  }
  covariance /= n;
  
  const beta = btcVariance > 0 ? covariance / btcVariance : 1;
  const btcExpectedReturn = btcAvgReturn * 252;
  const alpha = expectedReturn - (riskFreeRate + beta * (btcExpectedReturn - riskFreeRate));
  
  return {
    expectedReturn: expectedReturn * 100, // Convert to percentage
    volatility: volatility * 100,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: maxDrawdown * 100,
    calmarRatio,
    beta,
    alpha: alpha * 100
  };
}

/**
 * Generate efficient frontier
 */
export function generateEfficientFrontier(
  assets: string[],
  returns: Record<string, number[]>,
  btcReturns: number[],
  points: number = 20
): EfficientFrontierPoint[] {
  const frontier: EfficientFrontierPoint[] = [];
  
  // Generate random portfolios
  for (let i = 0; i < points; i++) {
    // Generate random weights that sum to 1
    const weights: Record<string, number> = {};
    let sum = 0;
    
    assets.forEach(asset => {
      const weight = Math.random();
      weights[asset] = weight;
      sum += weight;
    });
    
    // Normalize weights
    assets.forEach(asset => {
      weights[asset] /= sum;
    });
    
    // Calculate metrics
    const metrics = calculatePortfolioMetrics(weights, returns, btcReturns);
    
    frontier.push({
      risk: metrics.volatility,
      return: metrics.expectedReturn,
      sharpeRatio: metrics.sharpeRatio,
      weights
    });
  }
  
  // Sort by Sharpe ratio
  return frontier.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
}

/**
 * Find optimal portfolio (max Sharpe ratio)
 */
export function findMaxSharpePortfolio(
  assets: string[],
  returns: Record<string, number[]>,
  btcReturns: number[]
): OptimalPortfolio {
  const frontier = generateEfficientFrontier(assets, returns, btcReturns, 100);
  const best = frontier[0];
  
  const metrics = calculatePortfolioMetrics(best.weights, returns, btcReturns);
  
  return {
    type: 'max_sharpe',
    weights: best.weights,
    metrics,
    description: `Maximum Sharpe Ratio portfolio (${metrics.sharpeRatio.toFixed(2)}) with ${metrics.expectedReturn.toFixed(1)}% expected return and ${metrics.volatility.toFixed(1)}% volatility`
  };
}

/**
 * Find minimum volatility portfolio
 */
export function findMinVolatilityPortfolio(
  assets: string[],
  returns: Record<string, number[]>,
  btcReturns: number[]
): OptimalPortfolio {
  const frontier = generateEfficientFrontier(assets, returns, btcReturns, 100);
  const best = frontier.reduce((min, p) => p.risk < min.risk ? p : min, frontier[0]);
  
  const metrics = calculatePortfolioMetrics(best.weights, returns, btcReturns);
  
  return {
    type: 'min_volatility',
    weights: best.weights,
    metrics,
    description: `Minimum Volatility portfolio with ${metrics.volatility.toFixed(1)}% volatility and ${metrics.expectedReturn.toFixed(1)}% expected return`
  };
}

/**
 * Find target return portfolio
 */
export function findTargetReturnPortfolio(
  assets: string[],
  returns: Record<string, number[]>,
  btcReturns: number[],
  targetReturn: number = 50 // 50% annual return
): OptimalPortfolio {
  const frontier = generateEfficientFrontier(assets, returns, btcReturns, 100);
  
  // Find portfolio closest to target return
  const best = frontier.reduce((closest, p) => {
    const currentDiff = Math.abs(p.return - targetReturn);
    const closestDiff = Math.abs(closest.return - targetReturn);
    return currentDiff < closestDiff ? p : closest;
  }, frontier[0]);
  
  const metrics = calculatePortfolioMetrics(best.weights, returns, btcReturns);
  
  return {
    type: 'target_return',
    weights: best.weights,
    metrics,
    description: `Target ${targetReturn}% Return portfolio with ${metrics.expectedReturn.toFixed(1)}% expected return and ${metrics.volatility.toFixed(1)}% volatility`
  };
}

/**
 * Perform scenario analysis
 */
export function performScenarioAnalysis(
  weights: Record<string, number>,
  returns: Record<string, number[]>,
  btcReturns: number[]
): ScenarioAnalysis[] {
  const baseMetrics = calculatePortfolioMetrics(weights, returns, btcReturns);
  
  return [
    {
      scenario: 'bull',
      probability: 30,
      expectedReturn: baseMetrics.expectedReturn * 1.5,
      volatility: baseMetrics.volatility * 1.2,
      description: 'Strong bull market with increased volatility',
      assumptions: [
        'BTC increases 100%+',
        'Altcoins outperform BTC',
        'Increased market participation',
        'Positive regulatory developments'
      ]
    },
    {
      scenario: 'bear',
      probability: 25,
      expectedReturn: baseMetrics.expectedReturn * -0.5,
      volatility: baseMetrics.volatility * 1.5,
      description: 'Bear market with high volatility',
      assumptions: [
        'BTC decreases 50%+',
        'Altcoins underperform BTC',
        'Reduced market participation',
        'Negative regulatory developments'
      ]
    },
    {
      scenario: 'sideways',
      probability: 45,
      expectedReturn: baseMetrics.expectedReturn * 0.5,
      volatility: baseMetrics.volatility * 0.8,
      description: 'Sideways market with reduced volatility',
      assumptions: [
        'BTC trades in range',
        'Mixed altcoin performance',
        'Stable market participation',
        'Neutral regulatory environment'
      ]
    }
  ];
}

/**
 * Calculate diversification benefit
 */
export function calculateDiversificationBenefit(
  portfolioVolatility: number,
  assetVolatilities: number[],
  weights: number[]
): number {
  // Calculate weighted average of individual volatilities
  const weightedVolatility = assetVolatilities.reduce((sum, vol, i) => sum + vol * weights[i], 0);
  
  // Diversification benefit = reduction in risk
  const benefit = ((weightedVolatility - portfolioVolatility) / weightedVolatility) * 100;
  
  return Math.max(0, benefit);
}

/**
 * Generate comprehensive portfolio optimization report
 */
export async function generatePortfolioOptimizationReport(
  symbol: string,
  returns: number[],
  btcReturns: number[],
  ethReturns: number[],
  top50Returns: Record<string, number[]>
): Promise<PortfolioOptimizationReport> {
  // Analyze correlations
  const withBTC = analyzeCorrelation('BTC', returns, btcReturns);
  const withETH = analyzeCorrelation('ETH', returns, ethReturns);
  const withTop50 = Object.keys(top50Returns).map(asset =>
    analyzeCorrelation(asset, returns, top50Returns[asset])
  ).sort((a, b) => Math.abs(b.averageCorrelation) - Math.abs(a.averageCorrelation));
  
  // Build correlation matrix
  const assets = [symbol, 'BTC', 'ETH', ...Object.keys(top50Returns).slice(0, 7)];
  const returnsData: Record<string, number[]> = {
    [symbol]: returns,
    'BTC': btcReturns,
    'ETH': ethReturns,
    ...top50Returns
  };
  const correlationMatrix = buildCorrelationMatrix(assets, returnsData);
  
  // Detect regime changes
  const regimeChanges: CorrelationRegimeChange[] = [];
  const btcRegimeChange = detectRegimeChanges('BTC', withBTC.correlation30d, [
    { date: '2024-01-01', correlation: withBTC.correlation90d }
  ]);
  if (btcRegimeChange) regimeChanges.push(btcRegimeChange);
  
  // Calculate current metrics (100% allocation to symbol)
  const currentWeights = { [symbol]: 1.0 };
  const currentMetrics = calculatePortfolioMetrics(currentWeights, { [symbol]: returns }, btcReturns);
  
  // Generate efficient frontier
  const efficientFrontier = generateEfficientFrontier(assets, returnsData, btcReturns);
  
  // Find optimal portfolios
  const maxSharpe = findMaxSharpePortfolio(assets, returnsData, btcReturns);
  const minVolatility = findMinVolatilityPortfolio(assets, returnsData, btcReturns);
  const targetReturn = findTargetReturnPortfolio(assets, returnsData, btcReturns);
  
  // Perform scenario analysis
  const scenarioAnalysis = performScenarioAnalysis(maxSharpe.weights, returnsData, btcReturns);
  
  // Calculate diversification benefit
  const assetVolatilities = assets.map(asset => {
    const assetReturns = returnsData[asset];
    const variance = assetReturns.reduce((sum, r) => sum + r * r, 0) / assetReturns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
  });
  const weights = assets.map(asset => maxSharpe.weights[asset] || 0);
  const diversificationBenefit = calculateDiversificationBenefit(
    maxSharpe.metrics.volatility,
    assetVolatilities,
    weights
  );
  
  // Generate recommendation
  const recommendation = `Current portfolio (100% ${symbol}) has ${currentMetrics.sharpeRatio.toFixed(2)} Sharpe ratio. Optimal diversified portfolio could achieve ${maxSharpe.metrics.sharpeRatio.toFixed(2)} Sharpe ratio with ${diversificationBenefit.toFixed(1)}% risk reduction through diversification. Consider allocating ${(maxSharpe.weights[symbol] * 100).toFixed(1)}% to ${symbol} with remainder diversified across BTC, ETH, and other assets.`;
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    correlations: {
      withBTC,
      withETH,
      withTop50: withTop50.slice(0, 10)
    },
    correlationMatrix,
    regimeChanges,
    currentMetrics,
    efficientFrontier: efficientFrontier.slice(0, 20),
    optimalPortfolios: {
      maxSharpe,
      minVolatility,
      targetReturn
    },
    scenarioAnalysis,
    diversificationBenefit,
    recommendation
  };
}
