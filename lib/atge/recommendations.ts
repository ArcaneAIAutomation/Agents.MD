/**
 * ATGE Recommendation Generation System
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Analyzes historical trade data to generate actionable recommendations
 * for improving trading strategy and performance.
 * 
 * Requirements: 3.4
 */

import { query } from '../db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Recommendation {
  id: string;
  category: 'entry_conditions' | 'avoid_conditions' | 'position_sizing' | 'timeframe' | 'risk_management';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  potentialImpact: {
    estimatedProfitIncrease?: number; // Percentage
    estimatedLossReduction?: number; // Percentage
    winRateImprovement?: number; // Percentage
  };
  supportingData: {
    sampleSize: number;
    successRate: number;
    averageProfit: number;
    averageLoss: number;
  };
}

export interface RecommendationSet {
  userId: string;
  symbol?: string;
  generatedAt: Date;
  recommendations: Recommendation[];
  summary: {
    totalRecommendations: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    averageConfidence: number;
  };
}

interface TradeData {
  id: string;
  symbol: string;
  status: string;
  entry_price: number;
  stop_loss_price: number;
  timeframe: string;
  confidence_score: number;
  market_condition: string;
  risk_reward_ratio: number;
  generated_at: Date;
  profit_loss_usd?: number;
  profit_loss_percentage?: number;
  trade_duration_minutes?: number;
  rsi_value?: number;
  macd_value?: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
  social_sentiment_score?: number;
  fear_greed_index?: number;
}

// ============================================================================
// MAIN RECOMMENDATION GENERATION FUNCTION
// ============================================================================

/**
 * Generate comprehensive recommendations based on historical trade data
 * Requirements: 3.4 (all acceptance criteria)
 */
export async function generateRecommendations(
  userId: string,
  symbol?: string
): Promise<RecommendationSet> {
  try {
    // Fetch historical trade data
    const trades = await fetchTradeDataForAnalysis(userId, symbol);

    if (trades.length < 5) {
      return getMinimalRecommendations(userId, symbol, trades.length);
    }

    const recommendations: Recommendation[] = [];

    // Generate recommendations for each category
    recommendations.push(...await generateEntryConditionRecommendations(trades));
    recommendations.push(...await generateAvoidConditionRecommendations(trades));
    recommendations.push(...await generatePositionSizingRecommendations(trades));
    recommendations.push(...await generateTimeframeRecommendations(trades));
    recommendations.push(...await generateRiskManagementRecommendations(trades));

    // Sort by impact and confidence
    const sortedRecommendations = prioritizeRecommendations(recommendations);

    // Calculate summary statistics
    const summary = calculateRecommendationSummary(sortedRecommendations);

    return {
      userId,
      symbol,
      generatedAt: new Date(),
      recommendations: sortedRecommendations.slice(0, 10), // Top 10 recommendations
      summary
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

// ============================================================================
// ENTRY CONDITION RECOMMENDATIONS
// ============================================================================

/**
 * Generate recommendations for optimal entry conditions
 * Requirement 3.4.1
 */
async function generateEntryConditionRecommendations(
  trades: TradeData[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const successfulTrades = trades.filter(t => (t.profit_loss_usd ?? 0) > 0);

  // Analyze RSI patterns
  const rsiRecommendation = analyzeRSIPatterns(successfulTrades, trades);
  if (rsiRecommendation) recommendations.push(rsiRecommendation);

  // Analyze MACD patterns
  const macdRecommendation = analyzeMACDPatterns(successfulTrades, trades);
  if (macdRecommendation) recommendations.push(macdRecommendation);

  // Analyze EMA alignment
  const emaRecommendation = analyzeEMAAlignment(successfulTrades, trades);
  if (emaRecommendation) recommendations.push(emaRecommendation);

  // Analyze sentiment conditions
  const sentimentRecommendation = analyzeSentimentConditions(successfulTrades, trades);
  if (sentimentRecommendation) recommendations.push(sentimentRecommendation);

  // Analyze confidence score patterns
  const confidenceRecommendation = analyzeConfidencePatterns(successfulTrades, trades);
  if (confidenceRecommendation) recommendations.push(confidenceRecommendation);

  return recommendations;
}

function analyzeRSIPatterns(
  successfulTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  const tradesWithRSI = successfulTrades.filter(t => t.rsi_value !== null && t.rsi_value !== undefined);
  
  if (tradesWithRSI.length < 3) return null;

  // Find optimal RSI range
  const rsiValues = tradesWithRSI.map(t => t.rsi_value!);
  const avgRSI = rsiValues.reduce((sum, val) => sum + val, 0) / rsiValues.length;
  const minRSI = Math.min(...rsiValues);
  const maxRSI = Math.max(...rsiValues);

  // Calculate success rate in this range
  const tradesInRange = allTrades.filter(t => 
    t.rsi_value !== null && 
    t.rsi_value !== undefined &&
    t.rsi_value >= minRSI && 
    t.rsi_value <= maxRSI
  );
  const successRate = (tradesInRange.filter(t => (t.profit_loss_usd ?? 0) > 0).length / tradesInRange.length) * 100;

  // Calculate overall success rate for comparison
  const overallSuccessRate = (successfulTrades.length / allTrades.length) * 100;
  const improvement = successRate - overallSuccessRate;

  if (improvement > 5) {
    return {
      id: 'entry-rsi-range',
      category: 'entry_conditions',
      title: `Enter trades when RSI is between ${minRSI.toFixed(0)} and ${maxRSI.toFixed(0)}`,
      description: `Historical data shows ${successRate.toFixed(1)}% success rate when RSI is in this range, compared to ${overallSuccessRate.toFixed(1)}% overall.`,
      impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
      confidence: Math.min(95, 60 + (tradesInRange.length * 2)),
      potentialImpact: {
        winRateImprovement: improvement
      },
      supportingData: {
        sampleSize: tradesInRange.length,
        successRate: successRate,
        averageProfit: tradesInRange.filter(t => (t.profit_loss_usd ?? 0) > 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / tradesInRange.filter(t => (t.profit_loss_usd ?? 0) > 0).length,
        averageLoss: tradesInRange.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / tradesInRange.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

function analyzeMACDPatterns(
  successfulTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  const tradesWithMACD = successfulTrades.filter(t => t.macd_value !== null && t.macd_value !== undefined);
  
  if (tradesWithMACD.length < 3) return null;

  // Identify bullish MACD pattern (positive MACD)
  const bullishTrades = tradesWithMACD.filter(t => t.macd_value! > 0);
  const bullishSuccessRate = bullishTrades.length > 0 
    ? (bullishTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / bullishTrades.length) * 100
    : 0;

  const overallSuccessRate = (successfulTrades.length / allTrades.length) * 100;
  const improvement = bullishSuccessRate - overallSuccessRate;

  if (improvement > 5 && bullishTrades.length >= 3) {
    return {
      id: 'entry-macd-bullish',
      category: 'entry_conditions',
      title: 'Enter trades when MACD is positive (bullish crossover)',
      description: `Trades with positive MACD show ${bullishSuccessRate.toFixed(1)}% success rate, ${improvement.toFixed(1)}% better than average.`,
      impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
      confidence: Math.min(90, 55 + (bullishTrades.length * 3)),
      potentialImpact: {
        winRateImprovement: improvement
      },
      supportingData: {
        sampleSize: bullishTrades.length,
        successRate: bullishSuccessRate,
        averageProfit: bullishTrades.filter(t => (t.profit_loss_usd ?? 0) > 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / bullishTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length,
        averageLoss: bullishTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / bullishTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

function analyzeEMAAlignment(
  successfulTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  const tradesWithEMA = successfulTrades.filter(t => 
    t.ema_20 !== null && t.ema_50 !== null && t.ema_200 !== null
  );
  
  if (tradesWithEMA.length < 3) return null;

  // Check for bullish EMA alignment (20 > 50 > 200)
  const alignedTrades = tradesWithEMA.filter(t => 
    t.ema_20! > t.ema_50! && t.ema_50! > t.ema_200!
  );

  if (alignedTrades.length < 2) return null;

  const alignedSuccessRate = (alignedTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / alignedTrades.length) * 100;
  const overallSuccessRate = (successfulTrades.length / allTrades.length) * 100;
  const improvement = alignedSuccessRate - overallSuccessRate;

  if (improvement > 5) {
    return {
      id: 'entry-ema-alignment',
      category: 'entry_conditions',
      title: 'Enter trades when EMAs are bullishly aligned (20 > 50 > 200)',
      description: `Bullish EMA alignment shows ${alignedSuccessRate.toFixed(1)}% success rate, ${improvement.toFixed(1)}% above average.`,
      impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
      confidence: Math.min(85, 50 + (alignedTrades.length * 4)),
      potentialImpact: {
        winRateImprovement: improvement
      },
      supportingData: {
        sampleSize: alignedTrades.length,
        successRate: alignedSuccessRate,
        averageProfit: alignedTrades.filter(t => (t.profit_loss_usd ?? 0) > 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / alignedTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length,
        averageLoss: alignedTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / alignedTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

function analyzeSentimentConditions(
  successfulTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  const tradesWithSentiment = successfulTrades.filter(t => 
    t.social_sentiment_score !== null && t.social_sentiment_score !== undefined
  );
  
  if (tradesWithSentiment.length < 3) return null;

  // Find optimal sentiment range
  const sentimentValues = tradesWithSentiment.map(t => t.social_sentiment_score!);
  const avgSentiment = sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;

  // Determine if high or low sentiment is better
  const highSentimentTrades = allTrades.filter(t => 
    t.social_sentiment_score !== null && t.social_sentiment_score! > avgSentiment
  );
  const highSentimentSuccess = highSentimentTrades.length > 0
    ? (highSentimentTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / highSentimentTrades.length) * 100
    : 0;

  const overallSuccessRate = (successfulTrades.length / allTrades.length) * 100;
  const improvement = highSentimentSuccess - overallSuccessRate;

  if (improvement > 5 && highSentimentTrades.length >= 3) {
    return {
      id: 'entry-high-sentiment',
      category: 'entry_conditions',
      title: `Enter trades when social sentiment is above ${avgSentiment.toFixed(0)}`,
      description: `High sentiment conditions show ${highSentimentSuccess.toFixed(1)}% success rate, ${improvement.toFixed(1)}% better than average.`,
      impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
      confidence: Math.min(80, 50 + (highSentimentTrades.length * 3)),
      potentialImpact: {
        winRateImprovement: improvement
      },
      supportingData: {
        sampleSize: highSentimentTrades.length,
        successRate: highSentimentSuccess,
        averageProfit: highSentimentTrades.filter(t => (t.profit_loss_usd ?? 0) > 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / highSentimentTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length,
        averageLoss: highSentimentTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / highSentimentTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

function analyzeConfidencePatterns(
  successfulTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  if (successfulTrades.length < 5) return null;

  // Calculate average confidence for successful vs failed trades
  const avgSuccessConfidence = successfulTrades.reduce((sum, t) => sum + t.confidence_score, 0) / successfulTrades.length;
  const failedTrades = allTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0);
  const avgFailConfidence = failedTrades.length > 0
    ? failedTrades.reduce((sum, t) => sum + t.confidence_score, 0) / failedTrades.length
    : 0;

  const confidenceDiff = avgSuccessConfidence - avgFailConfidence;

  if (confidenceDiff > 5) {
    const threshold = Math.round((avgSuccessConfidence + avgFailConfidence) / 2);
    const highConfidenceTrades = allTrades.filter(t => t.confidence_score >= threshold);
    const highConfidenceSuccess = (highConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / highConfidenceTrades.length) * 100;
    const overallSuccessRate = (successfulTrades.length / allTrades.length) * 100;
    const improvement = highConfidenceSuccess - overallSuccessRate;

    return {
      id: 'entry-high-confidence',
      category: 'entry_conditions',
      title: `Only take trades with confidence score above ${threshold}%`,
      description: `High confidence trades (>${threshold}%) show ${highConfidenceSuccess.toFixed(1)}% success rate vs ${overallSuccessRate.toFixed(1)}% overall.`,
      impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
      confidence: Math.min(90, 60 + (highConfidenceTrades.length * 2)),
      potentialImpact: {
        winRateImprovement: improvement
      },
      supportingData: {
        sampleSize: highConfidenceTrades.length,
        successRate: highConfidenceSuccess,
        averageProfit: highConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) > 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / highConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length,
        averageLoss: highConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / highConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

// ============================================================================
// AVOID CONDITION RECOMMENDATIONS
// ============================================================================

/**
 * Generate recommendations for conditions to avoid
 * Requirement 3.4.2
 */
async function generateAvoidConditionRecommendations(
  trades: TradeData[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const failedTrades = trades.filter(t => (t.profit_loss_usd ?? 0) <= 0);

  if (failedTrades.length < 3) return recommendations;

  // Analyze market conditions to avoid
  const marketConditionRecommendation = analyzeMarketConditionsToAvoid(failedTrades, trades);
  if (marketConditionRecommendation) recommendations.push(marketConditionRecommendation);

  // Analyze fear/greed extremes
  const fearGreedRecommendation = analyzeFearGreedExtremes(failedTrades, trades);
  if (fearGreedRecommendation) recommendations.push(fearGreedRecommendation);

  // Analyze low confidence trades
  const lowConfidenceRecommendation = analyzeLowConfidenceTrades(failedTrades, trades);
  if (lowConfidenceRecommendation) recommendations.push(lowConfidenceRecommendation);

  return recommendations;
}

function analyzeMarketConditionsToAvoid(
  failedTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  // Group failed trades by market condition
  const conditionCounts: Record<string, { total: number; failed: number }> = {};

  for (const trade of allTrades) {
    if (!conditionCounts[trade.market_condition]) {
      conditionCounts[trade.market_condition] = { total: 0, failed: 0 };
    }
    conditionCounts[trade.market_condition].total++;
    if ((trade.profit_loss_usd ?? 0) <= 0) {
      conditionCounts[trade.market_condition].failed++;
    }
  }

  // Find condition with highest failure rate
  let worstCondition = '';
  let worstFailureRate = 0;
  let worstCount = 0;

  for (const [condition, counts] of Object.entries(conditionCounts)) {
    const failureRate = (counts.failed / counts.total) * 100;
    if (failureRate > worstFailureRate && counts.total >= 3) {
      worstCondition = condition;
      worstFailureRate = failureRate;
      worstCount = counts.total;
    }
  }

  if (worstFailureRate > 60 && worstCount >= 3) {
    const successRate = 100 - worstFailureRate;
    return {
      id: 'avoid-market-condition',
      category: 'avoid_conditions',
      title: `Avoid trading in ${worstCondition} market conditions`,
      description: `${worstCondition} markets show only ${successRate.toFixed(1)}% success rate (${worstFailureRate.toFixed(1)}% failure rate).`,
      impact: worstFailureRate > 75 ? 'high' : worstFailureRate > 65 ? 'medium' : 'low',
      confidence: Math.min(85, 50 + (worstCount * 3)),
      potentialImpact: {
        estimatedLossReduction: worstFailureRate - 50
      },
      supportingData: {
        sampleSize: worstCount,
        successRate: successRate,
        averageProfit: 0,
        averageLoss: allTrades.filter(t => t.market_condition === worstCondition && (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / conditionCounts[worstCondition].failed
      }
    };
  }

  return null;
}

function analyzeFearGreedExtremes(
  failedTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  const tradesWithFG = failedTrades.filter(t => 
    t.fear_greed_index !== null && t.fear_greed_index !== undefined
  );
  
  if (tradesWithFG.length < 3) return null;

  // Check for extreme fear or greed
  const extremeFearTrades = allTrades.filter(t => 
    t.fear_greed_index !== null && t.fear_greed_index! < 25
  );
  const extremeGreedTrades = allTrades.filter(t => 
    t.fear_greed_index !== null && t.fear_greed_index! > 75
  );

  const fearFailureRate = extremeFearTrades.length > 0
    ? (extremeFearTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length / extremeFearTrades.length) * 100
    : 0;
  const greedFailureRate = extremeGreedTrades.length > 0
    ? (extremeGreedTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length / extremeGreedTrades.length) * 100
    : 0;

  if (fearFailureRate > 60 && extremeFearTrades.length >= 3) {
    return {
      id: 'avoid-extreme-fear',
      category: 'avoid_conditions',
      title: 'Avoid trading during extreme fear (Fear & Greed < 25)',
      description: `Extreme fear conditions show ${fearFailureRate.toFixed(1)}% failure rate. Wait for market stabilization.`,
      impact: fearFailureRate > 75 ? 'high' : 'medium',
      confidence: Math.min(80, 50 + (extremeFearTrades.length * 3)),
      potentialImpact: {
        estimatedLossReduction: fearFailureRate - 50
      },
      supportingData: {
        sampleSize: extremeFearTrades.length,
        successRate: 100 - fearFailureRate,
        averageProfit: 0,
        averageLoss: extremeFearTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / extremeFearTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  if (greedFailureRate > 60 && extremeGreedTrades.length >= 3) {
    return {
      id: 'avoid-extreme-greed',
      category: 'avoid_conditions',
      title: 'Avoid trading during extreme greed (Fear & Greed > 75)',
      description: `Extreme greed conditions show ${greedFailureRate.toFixed(1)}% failure rate. Market may be overheated.`,
      impact: greedFailureRate > 75 ? 'high' : 'medium',
      confidence: Math.min(80, 50 + (extremeGreedTrades.length * 3)),
      potentialImpact: {
        estimatedLossReduction: greedFailureRate - 50
      },
      supportingData: {
        sampleSize: extremeGreedTrades.length,
        successRate: 100 - greedFailureRate,
        averageProfit: 0,
        averageLoss: extremeGreedTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / extremeGreedTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

function analyzeLowConfidenceTrades(
  failedTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  if (allTrades.length < 10) return null;

  // Calculate threshold for low confidence
  const avgConfidence = allTrades.reduce((sum, t) => sum + t.confidence_score, 0) / allTrades.length;
  const lowThreshold = avgConfidence - 10;

  const lowConfidenceTrades = allTrades.filter(t => t.confidence_score < lowThreshold);
  
  if (lowConfidenceTrades.length < 3) return null;

  const lowConfidenceFailureRate = (lowConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length / lowConfidenceTrades.length) * 100;

  if (lowConfidenceFailureRate > 60) {
    return {
      id: 'avoid-low-confidence',
      category: 'avoid_conditions',
      title: `Avoid trades with confidence below ${lowThreshold.toFixed(0)}%`,
      description: `Low confidence trades show ${lowConfidenceFailureRate.toFixed(1)}% failure rate. Stick to high-confidence setups.`,
      impact: lowConfidenceFailureRate > 75 ? 'high' : 'medium',
      confidence: Math.min(85, 55 + (lowConfidenceTrades.length * 2)),
      potentialImpact: {
        estimatedLossReduction: lowConfidenceFailureRate - 50
      },
      supportingData: {
        sampleSize: lowConfidenceTrades.length,
        successRate: 100 - lowConfidenceFailureRate,
        averageProfit: 0,
        averageLoss: lowConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / lowConfidenceTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

// ============================================================================
// POSITION SIZING RECOMMENDATIONS
// ============================================================================

/**
 * Generate recommendations for position sizing adjustments
 * Requirement 3.4.3
 */
async function generatePositionSizingRecommendations(
  trades: TradeData[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (trades.length < 10) return recommendations;

  const successfulTrades = trades.filter(t => (t.profit_loss_usd ?? 0) > 0);
  const failedTrades = trades.filter(t => (t.profit_loss_usd ?? 0) <= 0);

  // Analyze risk/reward ratio patterns
  const rrRecommendation = analyzeRiskRewardPatterns(successfulTrades, failedTrades, trades);
  if (rrRecommendation) recommendations.push(rrRecommendation);

  // Analyze stop loss effectiveness
  const slRecommendation = analyzeStopLossEffectiveness(trades);
  if (slRecommendation) recommendations.push(slRecommendation);

  return recommendations;
}

function analyzeRiskRewardPatterns(
  successfulTrades: TradeData[],
  failedTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  if (allTrades.length < 10) return null;

  // Calculate average R:R for successful vs failed trades
  const avgSuccessRR = successfulTrades.reduce((sum, t) => sum + t.risk_reward_ratio, 0) / successfulTrades.length;
  const avgFailRR = failedTrades.length > 0
    ? failedTrades.reduce((sum, t) => sum + t.risk_reward_ratio, 0) / failedTrades.length
    : 0;

  // Find optimal R:R threshold
  const optimalRR = Math.max(2.0, avgSuccessRR);
  const highRRTrades = allTrades.filter(t => t.risk_reward_ratio >= optimalRR);

  if (highRRTrades.length < 3) return null;

  const highRRSuccessRate = (highRRTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / highRRTrades.length) * 100;
  const overallSuccessRate = (successfulTrades.length / allTrades.length) * 100;
  const improvement = highRRSuccessRate - overallSuccessRate;

  if (improvement > 5) {
    return {
      id: 'position-high-rr',
      category: 'position_sizing',
      title: `Focus on trades with risk/reward ratio above ${optimalRR.toFixed(1)}:1`,
      description: `High R:R trades (>${optimalRR.toFixed(1)}:1) show ${highRRSuccessRate.toFixed(1)}% success rate, ${improvement.toFixed(1)}% better than average.`,
      impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
      confidence: Math.min(85, 55 + (highRRTrades.length * 2)),
      potentialImpact: {
        estimatedProfitIncrease: improvement,
        winRateImprovement: improvement
      },
      supportingData: {
        sampleSize: highRRTrades.length,
        successRate: highRRSuccessRate,
        averageProfit: highRRTrades.filter(t => (t.profit_loss_usd ?? 0) > 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / highRRTrades.filter(t => (t.profit_loss_usd ?? 0) > 0).length,
        averageLoss: highRRTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0)
          .reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / highRRTrades.filter(t => (t.profit_loss_usd ?? 0) <= 0).length
      }
    };
  }

  return null;
}

function analyzeStopLossEffectiveness(
  trades: TradeData[]
): Recommendation | null {
  if (trades.length < 10) return null;

  // Calculate average stop loss distance as percentage
  const slDistances = trades.map(t => {
    const distance = ((t.entry_price - t.stop_loss_price) / t.entry_price) * 100;
    return { trade: t, distance };
  });

  const avgSLDistance = slDistances.reduce((sum, item) => sum + item.distance, 0) / slDistances.length;

  // Analyze if tighter or wider stops perform better
  const tightStops = slDistances.filter(item => item.distance < avgSLDistance);
  const wideStops = slDistances.filter(item => item.distance >= avgSLDistance);

  const tightSuccessRate = tightStops.length > 0
    ? (tightStops.filter(item => (item.trade.profit_loss_usd ?? 0) > 0).length / tightStops.length) * 100
    : 0;
  const wideSuccessRate = wideStops.length > 0
    ? (wideStops.filter(item => (item.trade.profit_loss_usd ?? 0) > 0).length / wideStops.length) * 100
    : 0;

  const diff = Math.abs(tightSuccessRate - wideSuccessRate);

  if (diff > 10 && Math.min(tightStops.length, wideStops.length) >= 3) {
    const better = tightSuccessRate > wideSuccessRate ? 'tighter' : 'wider';
    const betterRate = Math.max(tightSuccessRate, wideSuccessRate);
    const betterDistance = better === 'tighter' 
      ? tightStops.reduce((sum, item) => sum + item.distance, 0) / tightStops.length
      : wideStops.reduce((sum, item) => sum + item.distance, 0) / wideStops.length;

    return {
      id: 'position-sl-adjustment',
      category: 'position_sizing',
      title: `Use ${better} stop losses (around ${betterDistance.toFixed(1)}% from entry)`,
      description: `${better === 'tighter' ? 'Tighter' : 'Wider'} stops show ${betterRate.toFixed(1)}% success rate vs ${Math.min(tightSuccessRate, wideSuccessRate).toFixed(1)}% for ${better === 'tighter' ? 'wider' : 'tighter'} stops.`,
      impact: diff > 20 ? 'high' : diff > 15 ? 'medium' : 'low',
      confidence: Math.min(80, 50 + (Math.min(tightStops.length, wideStops.length) * 2)),
      potentialImpact: {
        estimatedLossReduction: diff / 2,
        winRateImprovement: diff
      },
      supportingData: {
        sampleSize: better === 'tighter' ? tightStops.length : wideStops.length,
        successRate: betterRate,
        averageProfit: 0,
        averageLoss: 0
      }
    };
  }

  return null;
}

// ============================================================================
// TIMEFRAME RECOMMENDATIONS
// ============================================================================

/**
 * Generate recommendations for timeframe preferences
 * Requirement 3.4.4
 */
async function generateTimeframeRecommendations(
  trades: TradeData[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (trades.length < 10) return recommendations;

  // Group trades by timeframe
  const timeframeStats: Record<string, {
    trades: TradeData[];
    successRate: number;
    avgProfit: number;
    avgLoss: number;
  }> = {};

  for (const trade of trades) {
    if (!timeframeStats[trade.timeframe]) {
      timeframeStats[trade.timeframe] = {
        trades: [],
        successRate: 0,
        avgProfit: 0,
        avgLoss: 0
      };
    }
    timeframeStats[trade.timeframe].trades.push(trade);
  }

  // Calculate statistics for each timeframe
  for (const [timeframe, stats] of Object.entries(timeframeStats)) {
    const successful = stats.trades.filter(t => (t.profit_loss_usd ?? 0) > 0);
    const failed = stats.trades.filter(t => (t.profit_loss_usd ?? 0) <= 0);

    stats.successRate = (successful.length / stats.trades.length) * 100;
    stats.avgProfit = successful.length > 0
      ? successful.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / successful.length
      : 0;
    stats.avgLoss = failed.length > 0
      ? failed.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / failed.length
      : 0;
  }

  // Find best performing timeframe
  const sortedTimeframes = Object.entries(timeframeStats)
    .filter(([_, stats]) => stats.trades.length >= 3)
    .sort((a, b) => b[1].successRate - a[1].successRate);

  if (sortedTimeframes.length > 0) {
    const [bestTimeframe, bestStats] = sortedTimeframes[0];
    const overallSuccessRate = (trades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / trades.length) * 100;
    const improvement = bestStats.successRate - overallSuccessRate;

    if (improvement > 5) {
      recommendations.push({
        id: 'timeframe-best',
        category: 'timeframe',
        title: `Focus on ${bestTimeframe} timeframe for best results`,
        description: `${bestTimeframe} timeframe shows ${bestStats.successRate.toFixed(1)}% success rate, ${improvement.toFixed(1)}% above average.`,
        impact: improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low',
        confidence: Math.min(85, 50 + (bestStats.trades.length * 2)),
        potentialImpact: {
          winRateImprovement: improvement,
          estimatedProfitIncrease: improvement
        },
        supportingData: {
          sampleSize: bestStats.trades.length,
          successRate: bestStats.successRate,
          averageProfit: bestStats.avgProfit,
          averageLoss: bestStats.avgLoss
        }
      });
    }
  }

  // Find worst performing timeframe to avoid
  if (sortedTimeframes.length > 1) {
    const [worstTimeframe, worstStats] = sortedTimeframes[sortedTimeframes.length - 1];
    const overallSuccessRate = (trades.filter(t => (t.profit_loss_usd ?? 0) > 0).length / trades.length) * 100;
    const underperformance = overallSuccessRate - worstStats.successRate;

    if (underperformance > 10 && worstStats.trades.length >= 3) {
      recommendations.push({
        id: 'timeframe-avoid',
        category: 'timeframe',
        title: `Consider avoiding ${worstTimeframe} timeframe`,
        description: `${worstTimeframe} timeframe shows only ${worstStats.successRate.toFixed(1)}% success rate, ${underperformance.toFixed(1)}% below average.`,
        impact: underperformance > 20 ? 'high' : underperformance > 15 ? 'medium' : 'low',
        confidence: Math.min(80, 45 + (worstStats.trades.length * 2)),
        potentialImpact: {
          estimatedLossReduction: underperformance
        },
        supportingData: {
          sampleSize: worstStats.trades.length,
          successRate: worstStats.successRate,
          averageProfit: worstStats.avgProfit,
          averageLoss: worstStats.avgLoss
        }
      });
    }
  }

  return recommendations;
}

// ============================================================================
// RISK MANAGEMENT RECOMMENDATIONS
// ============================================================================

/**
 * Generate recommendations for risk management improvements
 * Requirement 3.4.5
 */
async function generateRiskManagementRecommendations(
  trades: TradeData[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (trades.length < 10) return recommendations;

  const successfulTrades = trades.filter(t => (t.profit_loss_usd ?? 0) > 0);
  const failedTrades = trades.filter(t => (t.profit_loss_usd ?? 0) <= 0);

  // Analyze trade duration patterns
  const durationRecommendation = analyzeTradeDuration(successfulTrades, failedTrades);
  if (durationRecommendation) recommendations.push(durationRecommendation);

  // Analyze profit taking patterns
  const profitTakingRecommendation = analyzeProfitTaking(trades);
  if (profitTakingRecommendation) recommendations.push(profitTakingRecommendation);

  // Analyze loss cutting patterns
  const lossCuttingRecommendation = analyzeLossCutting(failedTrades, trades);
  if (lossCuttingRecommendation) recommendations.push(lossCuttingRecommendation);

  return recommendations;
}

function analyzeTradeDuration(
  successfulTrades: TradeData[],
  failedTrades: TradeData[]
): Recommendation | null {
  const successWithDuration = successfulTrades.filter(t => t.trade_duration_minutes !== null && t.trade_duration_minutes !== undefined);
  const failedWithDuration = failedTrades.filter(t => t.trade_duration_minutes !== null && t.trade_duration_minutes !== undefined);

  if (successWithDuration.length < 3 || failedWithDuration.length < 3) return null;

  const avgSuccessDuration = successWithDuration.reduce((sum, t) => sum + t.trade_duration_minutes!, 0) / successWithDuration.length;
  const avgFailedDuration = failedWithDuration.reduce((sum, t) => sum + t.trade_duration_minutes!, 0) / failedWithDuration.length;

  const durationDiff = Math.abs(avgSuccessDuration - avgFailedDuration);
  const durationDiffPercent = (durationDiff / Math.max(avgSuccessDuration, avgFailedDuration)) * 100;

  if (durationDiffPercent > 30) {
    const better = avgSuccessDuration < avgFailedDuration ? 'shorter' : 'longer';
    const betterDuration = Math.min(avgSuccessDuration, avgFailedDuration);
    const betterHours = (betterDuration / 60).toFixed(1);

    return {
      id: 'risk-trade-duration',
      category: 'risk_management',
      title: `${better === 'shorter' ? 'Take profits earlier' : 'Give trades more time'} (around ${betterHours} hours)`,
      description: `Successful trades average ${(avgSuccessDuration / 60).toFixed(1)} hours vs ${(avgFailedDuration / 60).toFixed(1)} hours for failed trades.`,
      impact: durationDiffPercent > 50 ? 'high' : durationDiffPercent > 40 ? 'medium' : 'low',
      confidence: Math.min(80, 50 + (Math.min(successWithDuration.length, failedWithDuration.length) * 2)),
      potentialImpact: {
        estimatedProfitIncrease: durationDiffPercent / 3,
        estimatedLossReduction: durationDiffPercent / 3
      },
      supportingData: {
        sampleSize: successWithDuration.length + failedWithDuration.length,
        successRate: (successWithDuration.length / (successWithDuration.length + failedWithDuration.length)) * 100,
        averageProfit: successWithDuration.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / successWithDuration.length,
        averageLoss: failedWithDuration.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / failedWithDuration.length
      }
    };
  }

  return null;
}

function analyzeProfitTaking(
  trades: TradeData[]
): Recommendation | null {
  const successfulTrades = trades.filter(t => (t.profit_loss_usd ?? 0) > 0);

  if (successfulTrades.length < 5) return null;

  // Calculate average profit percentage
  const avgProfitPercent = successfulTrades.reduce((sum, t) => sum + (t.profit_loss_percentage ?? 0), 0) / successfulTrades.length;

  // Find trades that took profits early vs late
  const earlyProfits = successfulTrades.filter(t => (t.profit_loss_percentage ?? 0) < avgProfitPercent);
  const lateProfits = successfulTrades.filter(t => (t.profit_loss_percentage ?? 0) >= avgProfitPercent);

  if (earlyProfits.length >= 3 && lateProfits.length >= 3) {
    const earlyAvg = earlyProfits.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / earlyProfits.length;
    const lateAvg = lateProfits.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / lateProfits.length;

    if (Math.abs(lateAvg - earlyAvg) > earlyAvg * 0.3) {
      const better = lateAvg > earlyAvg ? 'later' : 'earlier';
      const improvement = ((Math.abs(lateAvg - earlyAvg) / Math.min(lateAvg, earlyAvg)) * 100);

      return {
        id: 'risk-profit-taking',
        category: 'risk_management',
        title: `Take profits ${better} for better returns`,
        description: `${better === 'later' ? 'Letting profits run' : 'Taking profits early'} yields ${improvement.toFixed(1)}% better average profit.`,
        impact: improvement > 40 ? 'high' : improvement > 25 ? 'medium' : 'low',
        confidence: Math.min(75, 45 + (Math.min(earlyProfits.length, lateProfits.length) * 2)),
        potentialImpact: {
          estimatedProfitIncrease: improvement / 2
        },
        supportingData: {
          sampleSize: successfulTrades.length,
          successRate: 100,
          averageProfit: better === 'later' ? lateAvg : earlyAvg,
          averageLoss: 0
        }
      };
    }
  }

  return null;
}

function analyzeLossCutting(
  failedTrades: TradeData[],
  allTrades: TradeData[]
): Recommendation | null {
  if (failedTrades.length < 5) return null;

  // Calculate average loss percentage
  const avgLossPercent = Math.abs(failedTrades.reduce((sum, t) => sum + (t.profit_loss_percentage ?? 0), 0) / failedTrades.length);

  // Find trades with small vs large losses
  const smallLosses = failedTrades.filter(t => Math.abs(t.profit_loss_percentage ?? 0) < avgLossPercent);
  const largeLosses = failedTrades.filter(t => Math.abs(t.profit_loss_percentage ?? 0) >= avgLossPercent);

  if (largeLosses.length >= 3) {
    const largeAvgLoss = Math.abs(largeLosses.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / largeLosses.length);
    const smallAvgLoss = Math.abs(smallLosses.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / smallLosses.length);
    const lossReduction = ((largeAvgLoss - smallAvgLoss) / largeAvgLoss) * 100;

    if (lossReduction > 30) {
      return {
        id: 'risk-cut-losses',
        category: 'risk_management',
        title: 'Cut losses earlier to reduce average loss size',
        description: `Large losses average $${largeAvgLoss.toFixed(2)} vs $${smallAvgLoss.toFixed(2)} for smaller losses. Tighten stops or exit faster.`,
        impact: lossReduction > 50 ? 'high' : lossReduction > 40 ? 'medium' : 'low',
        confidence: Math.min(85, 50 + (largeLosses.length * 2)),
        potentialImpact: {
          estimatedLossReduction: lossReduction
        },
        supportingData: {
          sampleSize: failedTrades.length,
          successRate: 0,
          averageProfit: 0,
          averageLoss: -smallAvgLoss
        }
      };
    }
  }

  return null;
}

// ============================================================================
// PRIORITIZATION AND UTILITY FUNCTIONS
// ============================================================================

/**
 * Prioritize recommendations by potential impact and confidence
 * Requirements: 3.4 (all acceptance criteria)
 * 
 * This function:
 * 1. Calculates potential impact for each recommendation
 * 2. Ranks recommendations by impact (highest first)
 * 3. Assigns confidence score (0-100) based on sample size
 * 4. Returns top 10 recommendations
 */
function prioritizeRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  // Calculate priority score and enhanced metrics for each recommendation
  const scoredRecommendations = recommendations.map(rec => {
    // 1. Calculate total potential impact (sum of all impact metrics)
    const estimatedProfitIncrease = rec.potentialImpact.estimatedProfitIncrease ?? 0;
    const estimatedLossReduction = rec.potentialImpact.estimatedLossReduction ?? 0;
    const winRateImprovement = rec.potentialImpact.winRateImprovement ?? 0;
    
    const totalImpact = estimatedProfitIncrease + estimatedLossReduction + winRateImprovement;
    
    // 2. Adjust confidence score based on sample size
    // Larger sample sizes increase confidence, smaller ones decrease it
    const sampleSize = rec.supportingData.sampleSize;
    let adjustedConfidence = rec.confidence;
    
    if (sampleSize < 5) {
      // Very small sample: reduce confidence by 20%
      adjustedConfidence = Math.max(30, rec.confidence * 0.8);
    } else if (sampleSize < 10) {
      // Small sample: reduce confidence by 10%
      adjustedConfidence = Math.max(40, rec.confidence * 0.9);
    } else if (sampleSize >= 20) {
      // Large sample: increase confidence by 10%
      adjustedConfidence = Math.min(100, rec.confidence * 1.1);
    } else if (sampleSize >= 50) {
      // Very large sample: increase confidence by 20%
      adjustedConfidence = Math.min(100, rec.confidence * 1.2);
    }
    
    // Round to integer
    adjustedConfidence = Math.round(adjustedConfidence);
    
    // 3. Calculate impact weight based on impact level
    // high = 3, medium = 2, low = 1
    const impactWeight = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
    
    // 4. Calculate comprehensive priority score
    // Formula: (impact weight * 40) + (adjusted confidence * 0.6) + (total impact * 0.4)
    // This balances impact level, confidence, and quantitative impact
    const priorityScore = (impactWeight * 40) + (adjustedConfidence * 0.6) + (totalImpact * 0.4);
    
    // 5. Calculate expected value (EV) for ranking
    // EV = (total impact * adjusted confidence) / 100
    // This represents the "expected" improvement accounting for confidence
    const expectedValue = (totalImpact * adjustedConfidence) / 100;
    
    return {
      recommendation: {
        ...rec,
        confidence: adjustedConfidence // Update with adjusted confidence
      },
      priorityScore,
      totalImpact,
      expectedValue,
      adjustedConfidence
    };
  });

  // 6. Sort by multiple criteria (in order of importance):
  // Primary: Expected value (impact * confidence)
  // Secondary: Total impact
  // Tertiary: Adjusted confidence
  scoredRecommendations.sort((a, b) => {
    // First, compare expected values
    if (Math.abs(a.expectedValue - b.expectedValue) > 1) {
      return b.expectedValue - a.expectedValue;
    }
    
    // If expected values are similar, compare total impact
    if (Math.abs(a.totalImpact - b.totalImpact) > 1) {
      return b.totalImpact - a.totalImpact;
    }
    
    // If impacts are similar, compare confidence
    return b.adjustedConfidence - a.adjustedConfidence;
  });

  // 7. Return top 10 recommendations (or all if less than 10)
  const topRecommendations = scoredRecommendations
    .slice(0, 10)
    .map(item => item.recommendation);
  
  return topRecommendations;
}

/**
 * Calculate summary statistics for recommendations
 * Requirement 3.4.7
 */
function calculateRecommendationSummary(
  recommendations: Recommendation[]
): RecommendationSet['summary'] {
  const highImpact = recommendations.filter(r => r.impact === 'high').length;
  const mediumImpact = recommendations.filter(r => r.impact === 'medium').length;
  const lowImpact = recommendations.filter(r => r.impact === 'low').length;
  
  const averageConfidence = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
    : 0;

  return {
    totalRecommendations: recommendations.length,
    highImpact,
    mediumImpact,
    lowImpact,
    averageConfidence: Math.round(averageConfidence)
  };
}

/**
 * Fetch trade data for analysis from database
 */
async function fetchTradeDataForAnalysis(
  userId: string,
  symbol?: string
): Promise<TradeData[]> {
  let sql = `
    SELECT 
      ts.id,
      ts.symbol,
      ts.status,
      ts.entry_price,
      ts.stop_loss_price,
      ts.timeframe,
      ts.confidence_score,
      ts.market_condition,
      ts.risk_reward_ratio,
      ts.generated_at,
      tr.profit_loss_usd,
      tr.profit_loss_percentage,
      tr.trade_duration_minutes,
      ti.rsi_value,
      ti.macd_value,
      ti.ema_20,
      ti.ema_50,
      ti.ema_200,
      ms.social_sentiment_score,
      ms.fear_greed_index
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    LEFT JOIN trade_technical_indicators ti ON ts.id = ti.trade_signal_id
    LEFT JOIN trade_market_snapshot ms ON ts.id = ms.trade_signal_id
    WHERE ts.user_id = $1
      AND (ts.status = 'completed_success' OR ts.status = 'completed_failure')
  `;

  const params: any[] = [userId];

  if (symbol) {
    sql += ' AND ts.symbol = $2';
    params.push(symbol);
  }

  sql += ' ORDER BY ts.generated_at DESC LIMIT 100';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Return minimal recommendations when insufficient data
 */
function getMinimalRecommendations(
  userId: string,
  symbol: string | undefined,
  tradeCount: number
): RecommendationSet {
  const recommendations: Recommendation[] = [
    {
      id: 'general-build-history',
      category: 'risk_management',
      title: 'Continue building trade history',
      description: `You have ${tradeCount} completed trades. Generate at least 10 trades to receive personalized recommendations.`,
      impact: 'medium',
      confidence: 100,
      potentialImpact: {},
      supportingData: {
        sampleSize: tradeCount,
        successRate: 0,
        averageProfit: 0,
        averageLoss: 0
      }
    },
    {
      id: 'general-high-confidence',
      category: 'entry_conditions',
      title: 'Focus on high-confidence trades',
      description: 'Prioritize trades with confidence scores above 70% for better initial results.',
      impact: 'medium',
      confidence: 80,
      potentialImpact: {
        winRateImprovement: 10
      },
      supportingData: {
        sampleSize: 0,
        successRate: 0,
        averageProfit: 0,
        averageLoss: 0
      }
    },
    {
      id: 'general-risk-management',
      category: 'risk_management',
      title: 'Always use stop losses',
      description: 'Protect your capital by setting stop losses on every trade. Risk no more than 2% per trade.',
      impact: 'high',
      confidence: 100,
      potentialImpact: {
        estimatedLossReduction: 50
      },
      supportingData: {
        sampleSize: 0,
        successRate: 0,
        averageProfit: 0,
        averageLoss: 0
      }
    }
  ];

  return {
    userId,
    symbol,
    generatedAt: new Date(),
    recommendations,
    summary: {
      totalRecommendations: recommendations.length,
      highImpact: 1,
      mediumImpact: 2,
      lowImpact: 0,
      averageConfidence: 93
    }
  };
}

/**
 * Export recommendations as formatted text
 */
export function formatRecommendationsForDisplay(
  recommendationSet: RecommendationSet
): string {
  let output = `# Trading Recommendations\n\n`;
  output += `Generated: ${recommendationSet.generatedAt.toLocaleString()}\n`;
  output += `Symbol: ${recommendationSet.symbol || 'All'}\n\n`;
  
  output += `## Summary\n`;
  output += `- Total Recommendations: ${recommendationSet.summary.totalRecommendations}\n`;
  output += `- High Impact: ${recommendationSet.summary.highImpact}\n`;
  output += `- Medium Impact: ${recommendationSet.summary.mediumImpact}\n`;
  output += `- Low Impact: ${recommendationSet.summary.lowImpact}\n`;
  output += `- Average Confidence: ${recommendationSet.summary.averageConfidence}%\n\n`;

  output += `## Recommendations\n\n`;

  for (let i = 0; i < recommendationSet.recommendations.length; i++) {
    const rec = recommendationSet.recommendations[i];
    output += `### ${i + 1}. ${rec.title}\n`;
    output += `**Category:** ${rec.category.replace('_', ' ')}\n`;
    output += `**Impact:** ${rec.impact.toUpperCase()}\n`;
    output += `**Confidence:** ${rec.confidence}%\n\n`;
    output += `${rec.description}\n\n`;
    
    if (Object.keys(rec.potentialImpact).length > 0) {
      output += `**Potential Impact:**\n`;
      if (rec.potentialImpact.estimatedProfitIncrease) {
        output += `- Estimated Profit Increase: +${rec.potentialImpact.estimatedProfitIncrease.toFixed(1)}%\n`;
      }
      if (rec.potentialImpact.estimatedLossReduction) {
        output += `- Estimated Loss Reduction: -${rec.potentialImpact.estimatedLossReduction.toFixed(1)}%\n`;
      }
      if (rec.potentialImpact.winRateImprovement) {
        output += `- Win Rate Improvement: +${rec.potentialImpact.winRateImprovement.toFixed(1)}%\n`;
      }
      output += `\n`;
    }
    
    output += `**Supporting Data:**\n`;
    output += `- Sample Size: ${rec.supportingData.sampleSize} trades\n`;
    output += `- Success Rate: ${rec.supportingData.successRate.toFixed(1)}%\n`;
    output += `\n---\n\n`;
  }

  return output;
}

