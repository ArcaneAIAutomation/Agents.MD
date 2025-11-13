/**
 * Performance Summary Generator
 * 
 * Analyzes patterns across all trades to identify best performing conditions and generate recommendations.
 * Requirements: 7.8-7.12
 */

import { query } from '../db';

interface Trade {
  id: string;
  symbol: string;
  status: string;
  entry_price: number;
  stop_loss_price: number;
  timeframe: string;
  confidence_score: number;
  market_condition: string;
  generated_at: Date;
  profit_loss_usd?: number;
  profit_loss_percentage?: number;
  trade_duration_minutes?: number;
}

interface PerformanceSummary {
  totalTrades: number;
  completedTrades: number;
  successfulTrades: number;
  failedTrades: number;
  successRate: number;
  totalProfitLoss: number;
  averageProfit: number;
  averageLoss: number;
  bestMarketConditions: Array<{
    condition: string;
    successRate: number;
    totalProfit: number;
    tradeCount: number;
  }>;
  bestTimeframes: Array<{
    timeframe: string;
    successRate: number;
    totalProfit: number;
    tradeCount: number;
  }>;
  confidenceAnalysis: {
    averageSuccessConfidence: number;
    averageFailureConfidence: number;
    optimalConfidenceThreshold: number;
  };
  recommendations: string[];
}

/**
 * Generate comprehensive performance summary
 * Requirements: 7.8-7.12
 */
export async function generatePerformanceSummary(
  userId: string,
  symbol?: string
): Promise<PerformanceSummary> {
  try {
    // Fetch all completed trades for the user
    const trades = await fetchCompletedTrades(userId, symbol);

    if (trades.length === 0) {
      return getEmptySummary();
    }

    // Calculate basic statistics
    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => (t.profit_loss_usd ?? 0) > 0);
    const failedTrades = trades.filter(t => (t.profit_loss_usd ?? 0) <= 0);
    const successRate = (successfulTrades.length / totalTrades) * 100;

    // Calculate profit/loss metrics
    const totalProfitLoss = trades.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0);
    const averageProfit = successfulTrades.length > 0
      ? successfulTrades.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / successfulTrades.length
      : 0;
    const averageLoss = failedTrades.length > 0
      ? failedTrades.reduce((sum, t) => sum + (t.profit_loss_usd ?? 0), 0) / failedTrades.length
      : 0;

    // Analyze best performing market conditions (Requirement 7.9)
    const bestMarketConditions = analyzeMarketConditions(trades);

    // Analyze best performing timeframes (Requirement 7.10)
    const bestTimeframes = analyzeTimeframes(trades);

    // Analyze confidence score correlation
    const confidenceAnalysis = analyzeConfidenceScores(successfulTrades, failedTrades);

    // Generate recommendations (Requirement 7.11)
    const recommendations = generateRecommendations({
      successRate,
      bestMarketConditions,
      bestTimeframes,
      confidenceAnalysis,
      totalTrades
    });

    return {
      totalTrades,
      completedTrades: totalTrades,
      successfulTrades: successfulTrades.length,
      failedTrades: failedTrades.length,
      successRate,
      totalProfitLoss,
      averageProfit,
      averageLoss,
      bestMarketConditions,
      bestTimeframes,
      confidenceAnalysis,
      recommendations
    };
  } catch (error) {
    console.error('Error generating performance summary:', error);
    return getEmptySummary();
  }
}

/**
 * Fetch completed trades from database
 */
async function fetchCompletedTrades(userId: string, symbol?: string): Promise<Trade[]> {
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
      ts.generated_at,
      tr.profit_loss_usd,
      tr.profit_loss_percentage,
      tr.trade_duration_minutes
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ts.user_id = $1
      AND (ts.status = 'completed_success' OR ts.status = 'completed_failure')
  `;

  const params: any[] = [userId];

  if (symbol) {
    sql += ' AND ts.symbol = $2';
    params.push(symbol);
  }

  sql += ' ORDER BY ts.generated_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Analyze performance by market condition
 * Requirement 7.9
 */
function analyzeMarketConditions(trades: Trade[]): Array<{
  condition: string;
  successRate: number;
  totalProfit: number;
  tradeCount: number;
}> {
  const conditionStats: Record<string, {
    total: number;
    successful: number;
    totalProfit: number;
  }> = {};

  // Group trades by market condition
  for (const trade of trades) {
    const condition = trade.market_condition;
    
    if (!conditionStats[condition]) {
      conditionStats[condition] = {
        total: 0,
        successful: 0,
        totalProfit: 0
      };
    }

    conditionStats[condition].total++;
    if ((trade.profit_loss_usd ?? 0) > 0) {
      conditionStats[condition].successful++;
    }
    conditionStats[condition].totalProfit += (trade.profit_loss_usd ?? 0);
  }

  // Convert to array and calculate success rates
  const results = Object.entries(conditionStats).map(([condition, stats]) => ({
    condition,
    successRate: (stats.successful / stats.total) * 100,
    totalProfit: stats.totalProfit,
    tradeCount: stats.total
  }));

  // Sort by total profit (descending)
  return results.sort((a, b) => b.totalProfit - a.totalProfit);
}

/**
 * Analyze performance by timeframe
 * Requirement 7.10
 */
function analyzeTimeframes(trades: Trade[]): Array<{
  timeframe: string;
  successRate: number;
  totalProfit: number;
  tradeCount: number;
}> {
  const timeframeStats: Record<string, {
    total: number;
    successful: number;
    totalProfit: number;
  }> = {};

  // Group trades by timeframe
  for (const trade of trades) {
    const timeframe = trade.timeframe;
    
    if (!timeframeStats[timeframe]) {
      timeframeStats[timeframe] = {
        total: 0,
        successful: 0,
        totalProfit: 0
      };
    }

    timeframeStats[timeframe].total++;
    if ((trade.profit_loss_usd ?? 0) > 0) {
      timeframeStats[timeframe].successful++;
    }
    timeframeStats[timeframe].totalProfit += (trade.profit_loss_usd ?? 0);
  }

  // Convert to array and calculate success rates
  const results = Object.entries(timeframeStats).map(([timeframe, stats]) => ({
    timeframe,
    successRate: (stats.successful / stats.total) * 100,
    totalProfit: stats.totalProfit,
    tradeCount: stats.total
  }));

  // Sort by total profit (descending)
  return results.sort((a, b) => b.totalProfit - a.totalProfit);
}

/**
 * Analyze confidence score correlation with success
 */
function analyzeConfidenceScores(
  successfulTrades: Trade[],
  failedTrades: Trade[]
): {
  averageSuccessConfidence: number;
  averageFailureConfidence: number;
  optimalConfidenceThreshold: number;
} {
  // Calculate average confidence for successful trades
  const averageSuccessConfidence = successfulTrades.length > 0
    ? successfulTrades.reduce((sum, t) => sum + t.confidence_score, 0) / successfulTrades.length
    : 0;

  // Calculate average confidence for failed trades
  const averageFailureConfidence = failedTrades.length > 0
    ? failedTrades.reduce((sum, t) => sum + t.confidence_score, 0) / failedTrades.length
    : 0;

  // Calculate optimal threshold (midpoint between averages)
  const optimalConfidenceThreshold = Math.round(
    (averageSuccessConfidence + averageFailureConfidence) / 2
  );

  return {
    averageSuccessConfidence: Math.round(averageSuccessConfidence),
    averageFailureConfidence: Math.round(averageFailureConfidence),
    optimalConfidenceThreshold
  };
}

/**
 * Generate actionable recommendations
 * Requirement 7.11
 */
function generateRecommendations(data: {
  successRate: number;
  bestMarketConditions: Array<{ condition: string; successRate: number; totalProfit: number }>;
  bestTimeframes: Array<{ timeframe: string; successRate: number; totalProfit: number }>;
  confidenceAnalysis: { averageSuccessConfidence: number; averageFailureConfidence: number; optimalConfidenceThreshold: number };
  totalTrades: number;
}): string[] {
  const recommendations: string[] = [];

  // Success rate recommendations
  if (data.successRate >= 70) {
    recommendations.push('Excellent performance! Continue with current strategy.');
  } else if (data.successRate >= 60) {
    recommendations.push('Good performance. Consider refining entry criteria for even better results.');
  } else if (data.successRate >= 50) {
    recommendations.push('Moderate performance. Focus on high-confidence trades and favorable market conditions.');
  } else {
    recommendations.push('Performance needs improvement. Review and adjust trading strategy.');
  }

  // Market condition recommendations
  if (data.bestMarketConditions.length > 0) {
    const topCondition = data.bestMarketConditions[0];
    if (topCondition.successRate > data.successRate + 10) {
      recommendations.push(
        `Focus on ${topCondition.condition} market conditions - they show ${topCondition.successRate.toFixed(1)}% success rate.`
      );
    }
  }

  // Timeframe recommendations
  if (data.bestTimeframes.length > 0) {
    const topTimeframe = data.bestTimeframes[0];
    if (topTimeframe.totalProfit > 0 && topTimeframe.successRate > data.successRate + 10) {
      recommendations.push(
        `${topTimeframe.timeframe} timeframe performs best with ${topTimeframe.successRate.toFixed(1)}% success rate and $${topTimeframe.totalProfit.toFixed(2)} total profit.`
      );
    }
  }

  // Confidence threshold recommendations
  const confidenceDiff = data.confidenceAnalysis.averageSuccessConfidence - data.confidenceAnalysis.averageFailureConfidence;
  if (confidenceDiff > 10) {
    recommendations.push(
      `Prioritize trades with confidence scores above ${data.confidenceAnalysis.optimalConfidenceThreshold}% for better outcomes.`
    );
  }

  // Sample size recommendations
  if (data.totalTrades < 10) {
    recommendations.push('Continue generating trades to build a more comprehensive performance history.');
  } else if (data.totalTrades < 30) {
    recommendations.push('Good sample size. Patterns are becoming more reliable with each trade.');
  }

  // Risk management recommendations
  if (data.successRate < 60) {
    recommendations.push('Consider tightening stop losses or widening take profit targets to improve risk/reward ratio.');
  }

  return recommendations;
}

/**
 * Return empty summary when no trades exist
 */
function getEmptySummary(): PerformanceSummary {
  return {
    totalTrades: 0,
    completedTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    successRate: 0,
    totalProfitLoss: 0,
    averageProfit: 0,
    averageLoss: 0,
    bestMarketConditions: [],
    bestTimeframes: [],
    confidenceAnalysis: {
      averageSuccessConfidence: 0,
      averageFailureConfidence: 0,
      optimalConfidenceThreshold: 70
    },
    recommendations: [
      'Generate your first trade to start building performance history.',
      'The AI will analyze patterns as you accumulate more trades.'
    ]
  };
}

/**
 * Get performance summary for display
 */
export async function getPerformanceSummaryForDisplay(
  userId: string,
  symbol?: string
): Promise<{
  summary: PerformanceSummary;
  insights: string[];
}> {
  const summary = await generatePerformanceSummary(userId, symbol);

  // Generate additional insights
  const insights: string[] = [];

  if (summary.totalTrades > 0) {
    // Win/loss ratio insight
    const winLossRatio = summary.failedTrades > 0
      ? (summary.successfulTrades / summary.failedTrades).toFixed(2)
      : summary.successfulTrades.toString();
    insights.push(`Win/Loss Ratio: ${winLossRatio}:1`);

    // Average profit vs loss insight
    if (summary.averageProfit > 0 && summary.averageLoss < 0) {
      const ratio = (summary.averageProfit / Math.abs(summary.averageLoss)).toFixed(2);
      insights.push(`Average win is ${ratio}x larger than average loss`);
    }

    // Best performing condition
    if (summary.bestMarketConditions.length > 0) {
      const best = summary.bestMarketConditions[0];
      insights.push(`Best condition: ${best.condition} (${best.successRate.toFixed(1)}% success)`);
    }

    // Best performing timeframe
    if (summary.bestTimeframes.length > 0) {
      const best = summary.bestTimeframes[0];
      insights.push(`Best timeframe: ${best.timeframe} ($${best.totalProfit.toFixed(2)} profit)`);
    }
  }

  return {
    summary,
    insights
  };
}
