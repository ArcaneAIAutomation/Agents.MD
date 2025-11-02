/**
 * Scenario Analysis for UCIE
 * 
 * Generates bull, base, and bear case price targets with probabilities
 * Creates probability distribution visualizations
 */

export interface ScenarioCase {
  target: number;
  probability: number; // 0-100
  timeframe: string;
  reasoning: string;
  keyFactors: string[];
}

export interface ScenarioAnalysis {
  bullCase: ScenarioCase;
  baseCase: ScenarioCase;
  bearCase: ScenarioCase;
  probabilityDistribution: ProbabilityPoint[];
  expectedValue: number;
  riskRewardRatio: number;
}

export interface ProbabilityPoint {
  price: number;
  probability: number;
}

export interface MarketConditions {
  volatility: number; // 0-100
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: number; // -100 to +100
  sentiment: number; // -100 to +100
  technicalScore: number; // 0-100
  fundamentalScore: number; // 0-100
}

/**
 * Calculate scenario probabilities based on market conditions
 */
function calculateScenarioProbabilities(conditions: MarketConditions): {
  bull: number;
  base: number;
  bear: number;
} {
  // Start with base probabilities
  let bullProb = 25;
  let baseProb = 50;
  let bearProb = 25;
  
  // Adjust based on trend
  if (conditions.trend === 'bullish') {
    bullProb += 15;
    bearProb -= 10;
    baseProb -= 5;
  } else if (conditions.trend === 'bearish') {
    bearProb += 15;
    bullProb -= 10;
    baseProb -= 5;
  }
  
  // Adjust based on momentum
  const momentumAdjust = conditions.momentum / 10;
  bullProb += momentumAdjust;
  bearProb -= momentumAdjust;
  
  // Adjust based on sentiment
  const sentimentAdjust = conditions.sentiment / 10;
  bullProb += sentimentAdjust * 0.5;
  bearProb -= sentimentAdjust * 0.5;
  
  // Adjust based on technical score
  const technicalAdjust = (conditions.technicalScore - 50) / 5;
  bullProb += technicalAdjust;
  bearProb -= technicalAdjust;
  
  // Adjust based on fundamental score
  const fundamentalAdjust = (conditions.fundamentalScore - 50) / 5;
  bullProb += fundamentalAdjust * 0.7;
  bearProb -= fundamentalAdjust * 0.7;
  
  // Normalize to ensure they sum to 100
  const total = bullProb + baseProb + bearProb;
  bullProb = (bullProb / total) * 100;
  baseProb = (baseProb / total) * 100;
  bearProb = (bearProb / total) * 100;
  
  // Ensure minimum probabilities
  bullProb = Math.max(10, Math.min(70, bullProb));
  bearProb = Math.max(10, Math.min(70, bearProb));
  baseProb = 100 - bullProb - bearProb;
  
  return {
    bull: Math.round(bullProb),
    base: Math.round(baseProb),
    bear: Math.round(bearProb)
  };
}

/**
 * Generate bull case scenario
 */
function generateBullCase(
  currentPrice: number,
  conditions: MarketConditions,
  probability: number,
  timeframe: string
): ScenarioCase {
  // Calculate target based on historical bull moves and current conditions
  const baseMultiplier = timeframe === '30d' ? 1.3 : timeframe === '7d' ? 1.15 : 1.05;
  
  // Adjust multiplier based on conditions
  const momentumBoost = (conditions.momentum / 100) * 0.2;
  const sentimentBoost = (conditions.sentiment / 100) * 0.15;
  const technicalBoost = (conditions.technicalScore / 100) * 0.1;
  
  const multiplier = baseMultiplier + momentumBoost + sentimentBoost + technicalBoost;
  const target = currentPrice * multiplier;
  
  const keyFactors: string[] = [];
  
  if (conditions.momentum > 50) {
    keyFactors.push('Strong positive momentum');
  }
  if (conditions.sentiment > 50) {
    keyFactors.push('Bullish market sentiment');
  }
  if (conditions.technicalScore > 60) {
    keyFactors.push('Favorable technical indicators');
  }
  if (conditions.fundamentalScore > 60) {
    keyFactors.push('Strong fundamentals');
  }
  if (conditions.trend === 'bullish') {
    keyFactors.push('Established uptrend');
  }
  
  if (keyFactors.length === 0) {
    keyFactors.push('Potential breakout scenario');
  }
  
  return {
    target: Math.round(target * 100) / 100,
    probability,
    timeframe,
    reasoning: `Bull case assumes ${keyFactors.join(', ').toLowerCase()} continue to drive price higher`,
    keyFactors
  };
}

/**
 * Generate base case scenario
 */
function generateBaseCase(
  currentPrice: number,
  conditions: MarketConditions,
  probability: number,
  timeframe: string
): ScenarioCase {
  // Base case assumes modest movement based on trend
  let multiplier = 1.0;
  
  if (conditions.trend === 'bullish') {
    multiplier = timeframe === '30d' ? 1.08 : timeframe === '7d' ? 1.03 : 1.01;
  } else if (conditions.trend === 'bearish') {
    multiplier = timeframe === '30d' ? 0.92 : timeframe === '7d' ? 0.97 : 0.99;
  } else {
    multiplier = timeframe === '30d' ? 1.0 : timeframe === '7d' ? 1.0 : 1.0;
  }
  
  // Small adjustments based on momentum
  multiplier += (conditions.momentum / 100) * 0.05;
  
  const target = currentPrice * multiplier;
  
  const keyFactors: string[] = [
    'Market continues current trajectory',
    'No major catalysts or disruptions',
    'Normal trading volume and volatility'
  ];
  
  return {
    target: Math.round(target * 100) / 100,
    probability,
    timeframe,
    reasoning: 'Base case assumes continuation of current market conditions without significant changes',
    keyFactors
  };
}

/**
 * Generate bear case scenario
 */
function generateBearCase(
  currentPrice: number,
  conditions: MarketConditions,
  probability: number,
  timeframe: string
): ScenarioCase {
  // Calculate target based on historical bear moves and current conditions
  const baseMultiplier = timeframe === '30d' ? 0.75 : timeframe === '7d' ? 0.87 : 0.95;
  
  // Adjust multiplier based on conditions
  const momentumPenalty = (conditions.momentum / 100) * 0.15;
  const sentimentPenalty = (conditions.sentiment / 100) * 0.1;
  const volatilityPenalty = (conditions.volatility / 100) * 0.1;
  
  const multiplier = baseMultiplier + momentumPenalty + sentimentPenalty - volatilityPenalty;
  const target = currentPrice * multiplier;
  
  const keyFactors: string[] = [];
  
  if (conditions.momentum < -30) {
    keyFactors.push('Negative momentum accelerates');
  }
  if (conditions.sentiment < -30) {
    keyFactors.push('Bearish sentiment intensifies');
  }
  if (conditions.volatility > 60) {
    keyFactors.push('High volatility triggers sell-off');
  }
  if (conditions.technicalScore < 40) {
    keyFactors.push('Technical breakdown occurs');
  }
  if (conditions.trend === 'bearish') {
    keyFactors.push('Downtrend continues');
  }
  
  if (keyFactors.length === 0) {
    keyFactors.push('Market correction scenario');
  }
  
  return {
    target: Math.round(target * 100) / 100,
    probability,
    timeframe,
    reasoning: `Bear case assumes ${keyFactors.join(', ').toLowerCase()} lead to price decline`,
    keyFactors
  };
}

/**
 * Generate probability distribution curve
 */
function generateProbabilityDistribution(
  currentPrice: number,
  bullTarget: number,
  baseTarget: number,
  bearTarget: number,
  bullProb: number,
  baseProb: number,
  bearProb: number
): ProbabilityPoint[] {
  const points: ProbabilityPoint[] = [];
  
  // Generate points from bear to bull target
  const minPrice = bearTarget * 0.9;
  const maxPrice = bullTarget * 1.1;
  const step = (maxPrice - minPrice) / 50;
  
  for (let price = minPrice; price <= maxPrice; price += step) {
    let probability = 0;
    
    // Calculate probability based on distance from scenario targets
    const distToBear = Math.abs(price - bearTarget);
    const distToBase = Math.abs(price - baseTarget);
    const distToBull = Math.abs(price - bullTarget);
    
    // Use Gaussian-like distribution around each scenario
    const bearContribution = bearProb * Math.exp(-Math.pow(distToBear / (bearTarget * 0.1), 2));
    const baseContribution = baseProb * Math.exp(-Math.pow(distToBase / (baseTarget * 0.1), 2));
    const bullContribution = bullProb * Math.exp(-Math.pow(distToBull / (bullTarget * 0.1), 2));
    
    probability = (bearContribution + baseContribution + bullContribution) / 100;
    
    points.push({
      price: Math.round(price * 100) / 100,
      probability: Math.round(probability * 1000) / 1000
    });
  }
  
  // Normalize probabilities to sum to 1
  const totalProb = points.reduce((sum, p) => sum + p.probability, 0);
  points.forEach(p => {
    p.probability = Math.round((p.probability / totalProb) * 1000) / 1000;
  });
  
  return points;
}

/**
 * Calculate expected value and risk-reward ratio
 */
function calculateMetrics(
  currentPrice: number,
  bullTarget: number,
  baseTarget: number,
  bearTarget: number,
  bullProb: number,
  baseProb: number,
  bearProb: number
): { expectedValue: number; riskRewardRatio: number } {
  // Calculate expected value
  const expectedValue = (
    (bullTarget * bullProb / 100) +
    (baseTarget * baseProb / 100) +
    (bearTarget * bearProb / 100)
  );
  
  // Calculate risk-reward ratio
  const potentialGain = bullTarget - currentPrice;
  const potentialLoss = currentPrice - bearTarget;
  const riskRewardRatio = potentialLoss > 0 ? potentialGain / potentialLoss : 0;
  
  return {
    expectedValue: Math.round(expectedValue * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100
  };
}

/**
 * Generate complete scenario analysis
 */
export async function generateScenarioAnalysis(
  symbol: string,
  currentPrice: number,
  conditions: MarketConditions,
  timeframe: '24h' | '7d' | '30d' = '30d'
): Promise<ScenarioAnalysis> {
  // Calculate scenario probabilities
  const probabilities = calculateScenarioProbabilities(conditions);
  
  // Generate scenarios
  const bullCase = generateBullCase(currentPrice, conditions, probabilities.bull, timeframe);
  const baseCase = generateBaseCase(currentPrice, conditions, probabilities.base, timeframe);
  const bearCase = generateBearCase(currentPrice, conditions, probabilities.bear, timeframe);
  
  // Generate probability distribution
  const probabilityDistribution = generateProbabilityDistribution(
    currentPrice,
    bullCase.target,
    baseCase.target,
    bearCase.target,
    probabilities.bull,
    probabilities.base,
    probabilities.bear
  );
  
  // Calculate metrics
  const { expectedValue, riskRewardRatio } = calculateMetrics(
    currentPrice,
    bullCase.target,
    baseCase.target,
    bearCase.target,
    probabilities.bull,
    probabilities.base,
    probabilities.bear
  );
  
  return {
    bullCase,
    baseCase,
    bearCase,
    probabilityDistribution,
    expectedValue,
    riskRewardRatio
  };
}

/**
 * Generate scenarios for multiple timeframes
 */
export async function generateMultiTimeframeScenarios(
  symbol: string,
  currentPrice: number,
  conditions: MarketConditions
): Promise<{
  '24h': ScenarioAnalysis;
  '7d': ScenarioAnalysis;
  '30d': ScenarioAnalysis;
}> {
  const [scenario24h, scenario7d, scenario30d] = await Promise.all([
    generateScenarioAnalysis(symbol, currentPrice, conditions, '24h'),
    generateScenarioAnalysis(symbol, currentPrice, conditions, '7d'),
    generateScenarioAnalysis(symbol, currentPrice, conditions, '30d')
  ]);
  
  return {
    '24h': scenario24h,
    '7d': scenario7d,
    '30d': scenario30d
  };
}
