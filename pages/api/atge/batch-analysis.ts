/**
 * ATGE Batch Analysis API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Analyzes multiple trades at once to identify trends and patterns
 * Provides aggregate statistics and recommendations for strategy improvement
 * 
 * Requirements: 3.3
 */

import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BatchAnalysisRequest {
  symbol?: 'BTC' | 'ETH';
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'tp1_hit' | 'tp2_hit' | 'tp3_hit' | 'stop_loss_hit' | 'expired';
}

interface BatchAnalysisResponse {
  success: boolean;
  analysis: {
    // Aggregate Statistics
    aggregateStats: {
      totalTrades: number;
      winRate: number;
      profitFactor: number;
      averageWin: number;
      averageLoss: number;
      totalProfitLoss: number;
      largestWin: number;
      largestLoss: number;
      averageTradeDuration: number; // in hours
    };
    
    // Best Performing Conditions
    bestConditions: {
      rsiRanges: Array<{
        range: string;
        winRate: number;
        avgProfitLoss: number;
        tradeCount: number;
      }>;
      macdSignals: Array<{
        signal: string;
        winRate: number;
        avgProfitLoss: number;
        tradeCount: number;
      }>;
      timeframes: Array<{
        timeframe: string;
        winRate: number;
        avgProfitLoss: number;
        tradeCount: number;
      }>;
      marketConditions: Array<{
        condition: string;
        winRate: number;
        avgProfitLoss: number;
        tradeCount: number;
      }>;
    };
    
    // Recommendations
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: 'entry' | 'exit' | 'risk' | 'timing' | 'position_sizing';
      recommendation: string;
      potentialImpact: string;
      confidence: number;
    }>;
    
    // Filters Applied
    filters: BatchAnalysisRequest;
    
    // Metadata
    analyzedAt: string;
  };
  error?: string;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function handler(req: AuthenticatedRequest, res: NextApiResponse<BatchAnalysisResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      analysis: getEmptyAnalysis({}),
      error: 'Method not allowed'
    });
  }

  const userId = req.user!.id;
  console.log(`[ATGE Batch Analysis] Starting batch analysis for user ${userId}`);

  try {
    // Parse query parameters for filtering
    // Requirements: 3.3 - Accept filter parameters (symbol, date range, status)
    const {
      symbol,
      startDate,
      endDate,
      status
    } = req.query;

    const filters: BatchAnalysisRequest = {
      symbol: symbol as 'BTC' | 'ETH' | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      status: status as any | undefined
    };

    // Build WHERE clause for filtering
    // Requirements: 3.3 - Fetch matching trades from database
    const conditions: string[] = ['ts.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (symbol) {
      conditions.push(`ts.symbol = $${paramIndex++}`);
      params.push(symbol);
    }

    if (startDate) {
      conditions.push(`ts.generated_at >= $${paramIndex++}`);
      params.push(new Date(startDate as string));
    }

    if (endDate) {
      conditions.push(`ts.generated_at <= $${paramIndex++}`);
      params.push(new Date(endDate as string));
    }

    if (status) {
      conditions.push(`ts.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Fetch all analysis data in parallel
    // Requirements: 3.3 - Calculate aggregate statistics
    const [
      aggregateStats,
      rsiRanges,
      macdSignals,
      timeframes,
      marketConditions
    ] = await Promise.all([
      calculateAggregateStats(whereClause, params),
      analyzeBestRSIRanges(whereClause, params),
      analyzeBestMACDSignals(whereClause, params),
      analyzeBestTimeframes(whereClause, params),
      analyzeBestMarketConditions(whereClause, params)
    ]);

    // Generate recommendations based on analysis
    // Requirements: 3.3 - Generate recommendations for strategy improvement
    const recommendations = generateRecommendations(
      aggregateStats,
      { rsiRanges, macdSignals, timeframes, marketConditions }
    );

    console.log(`[ATGE Batch Analysis] Analysis complete for ${aggregateStats.totalTrades} trades`);

    return res.status(200).json({
      success: true,
      analysis: {
        aggregateStats,
        bestConditions: {
          rsiRanges,
          macdSignals,
          timeframes,
          marketConditions
        },
        recommendations,
        filters,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[ATGE Batch Analysis] Error performing batch analysis:', error);
    
    return res.status(500).json({
      success: false,
      analysis: getEmptyAnalysis({}),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS - AGGREGATE STATISTICS
// ============================================================================

/**
 * Calculate aggregate statistics for all matching trades
 * Requirements: 3.3 - Calculate aggregate statistics (win rate, profit factor, etc.)
 */
async function calculateAggregateStats(
  whereClause: string,
  params: any[]
): Promise<BatchAnalysisResponse['analysis']['aggregateStats']> {
  const result = await query(`
    WITH trade_stats AS (
      SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END) as winning_trades,
        SUM(CASE WHEN tr.net_profit_loss > 0 THEN tr.net_profit_loss ELSE 0 END) as total_profit,
        SUM(CASE WHEN tr.net_profit_loss < 0 THEN ABS(tr.net_profit_loss) ELSE 0 END) as total_loss,
        AVG(CASE WHEN tr.net_profit_loss > 0 THEN tr.net_profit_loss END) as avg_win,
        AVG(CASE WHEN tr.net_profit_loss < 0 THEN tr.net_profit_loss END) as avg_loss,
        SUM(tr.net_profit_loss) as total_pl,
        MAX(tr.net_profit_loss) as largest_win,
        MIN(tr.net_profit_loss) as largest_loss,
        AVG(
          EXTRACT(EPOCH FROM (
            COALESCE(tr.tp3_hit_at, tr.tp2_hit_at, tr.tp1_hit_at, tr.stop_loss_hit_at, ts.expires_at) - 
            ts.generated_at
          )) / 3600
        ) as avg_duration_hours
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      WHERE ${whereClause}
        AND tr.net_profit_loss IS NOT NULL
    )
    SELECT 
      total_trades,
      winning_trades,
      ROUND((winning_trades::numeric / NULLIF(total_trades, 0)::numeric) * 100, 2) as win_rate,
      ROUND(total_profit / NULLIF(total_loss, 0), 2) as profit_factor,
      ROUND(avg_win, 2) as avg_win,
      ROUND(avg_loss, 2) as avg_loss,
      ROUND(total_pl, 2) as total_pl,
      ROUND(largest_win, 2) as largest_win,
      ROUND(largest_loss, 2) as largest_loss,
      ROUND(avg_duration_hours, 2) as avg_duration_hours
    FROM trade_stats
  `, params);

  const row = result.rows[0] || {};

  return {
    totalTrades: parseInt(row.total_trades) || 0,
    winRate: parseFloat(row.win_rate) || 0,
    profitFactor: parseFloat(row.profit_factor) || 0,
    averageWin: parseFloat(row.avg_win) || 0,
    averageLoss: parseFloat(row.avg_loss) || 0,
    totalProfitLoss: parseFloat(row.total_pl) || 0,
    largestWin: parseFloat(row.largest_win) || 0,
    largestLoss: parseFloat(row.largest_loss) || 0,
    averageTradeDuration: parseFloat(row.avg_duration_hours) || 0
  };
}

// ============================================================================
// HELPER FUNCTIONS - BEST PERFORMING CONDITIONS
// ============================================================================

/**
 * Analyze best performing RSI ranges
 * Requirements: 3.3 - Identify best performing conditions (RSI range, MACD signal, etc.)
 */
async function analyzeBestRSIRanges(
  whereClause: string,
  params: any[]
): Promise<Array<{ range: string; winRate: number; avgProfitLoss: number; tradeCount: number }>> {
  const result = await query(`
    WITH rsi_buckets AS (
      SELECT 
        CASE
          WHEN tms.rsi < 30 THEN 'Oversold (< 30)'
          WHEN tms.rsi >= 30 AND tms.rsi < 40 THEN 'Low (30-40)'
          WHEN tms.rsi >= 40 AND tms.rsi < 60 THEN 'Neutral (40-60)'
          WHEN tms.rsi >= 60 AND tms.rsi < 70 THEN 'High (60-70)'
          ELSE 'Overbought (> 70)'
        END as rsi_range,
        tr.tp1_hit,
        tr.net_profit_loss
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
      WHERE ${whereClause}
        AND tms.rsi IS NOT NULL
        AND tr.net_profit_loss IS NOT NULL
    )
    SELECT 
      rsi_range,
      COUNT(*) as trade_count,
      ROUND((COUNT(CASE WHEN tp1_hit = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) as win_rate,
      ROUND(AVG(net_profit_loss), 2) as avg_profit_loss
    FROM rsi_buckets
    GROUP BY rsi_range
    ORDER BY win_rate DESC, avg_profit_loss DESC
    LIMIT 5
  `, params);

  return result.rows.map(row => ({
    range: row.rsi_range,
    winRate: parseFloat(row.win_rate) || 0,
    avgProfitLoss: parseFloat(row.avg_profit_loss) || 0,
    tradeCount: parseInt(row.trade_count)
  }));
}

/**
 * Analyze best performing MACD signals
 * Requirements: 3.3 - Identify best performing conditions (RSI range, MACD signal, etc.)
 */
async function analyzeBestMACDSignals(
  whereClause: string,
  params: any[]
): Promise<Array<{ signal: string; winRate: number; avgProfitLoss: number; tradeCount: number }>> {
  const result = await query(`
    WITH macd_signals AS (
      SELECT 
        CASE
          WHEN tms.macd > tms.macd_signal AND tms.macd > 0 THEN 'Strong Bullish'
          WHEN tms.macd > tms.macd_signal AND tms.macd <= 0 THEN 'Bullish Crossover'
          WHEN tms.macd < tms.macd_signal AND tms.macd < 0 THEN 'Strong Bearish'
          WHEN tms.macd < tms.macd_signal AND tms.macd >= 0 THEN 'Bearish Crossover'
          ELSE 'Neutral'
        END as macd_signal,
        tr.tp1_hit,
        tr.net_profit_loss
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
      WHERE ${whereClause}
        AND tms.macd IS NOT NULL
        AND tms.macd_signal IS NOT NULL
        AND tr.net_profit_loss IS NOT NULL
    )
    SELECT 
      macd_signal,
      COUNT(*) as trade_count,
      ROUND((COUNT(CASE WHEN tp1_hit = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) as win_rate,
      ROUND(AVG(net_profit_loss), 2) as avg_profit_loss
    FROM macd_signals
    GROUP BY macd_signal
    ORDER BY win_rate DESC, avg_profit_loss DESC
    LIMIT 5
  `, params);

  return result.rows.map(row => ({
    signal: row.macd_signal,
    winRate: parseFloat(row.win_rate) || 0,
    avgProfitLoss: parseFloat(row.avg_profit_loss) || 0,
    tradeCount: parseInt(row.trade_count)
  }));
}

/**
 * Analyze best performing timeframes
 * Requirements: 3.3 - Identify best performing conditions (RSI range, MACD signal, etc.)
 */
async function analyzeBestTimeframes(
  whereClause: string,
  params: any[]
): Promise<Array<{ timeframe: string; winRate: number; avgProfitLoss: number; tradeCount: number }>> {
  const result = await query(`
    SELECT 
      ts.timeframe,
      COUNT(*) as trade_count,
      ROUND((COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) as win_rate,
      ROUND(AVG(tr.net_profit_loss), 2) as avg_profit_loss
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${whereClause}
      AND tr.net_profit_loss IS NOT NULL
    GROUP BY ts.timeframe
    ORDER BY win_rate DESC, avg_profit_loss DESC
  `, params);

  return result.rows.map(row => ({
    timeframe: row.timeframe,
    winRate: parseFloat(row.win_rate) || 0,
    avgProfitLoss: parseFloat(row.avg_profit_loss) || 0,
    tradeCount: parseInt(row.trade_count)
  }));
}

/**
 * Analyze best performing market conditions
 * Requirements: 3.3 - Identify best performing conditions (RSI range, MACD signal, etc.)
 */
async function analyzeBestMarketConditions(
  whereClause: string,
  params: any[]
): Promise<Array<{ condition: string; winRate: number; avgProfitLoss: number; tradeCount: number }>> {
  const result = await query(`
    WITH market_conditions AS (
      SELECT 
        CASE
          WHEN tms.fear_greed_index < 25 THEN 'Extreme Fear'
          WHEN tms.fear_greed_index >= 25 AND tms.fear_greed_index < 45 THEN 'Fear'
          WHEN tms.fear_greed_index >= 45 AND tms.fear_greed_index < 55 THEN 'Neutral'
          WHEN tms.fear_greed_index >= 55 AND tms.fear_greed_index < 75 THEN 'Greed'
          ELSE 'Extreme Greed'
        END as market_condition,
        tr.tp1_hit,
        tr.net_profit_loss
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
      WHERE ${whereClause}
        AND tms.fear_greed_index IS NOT NULL
        AND tr.net_profit_loss IS NOT NULL
    )
    SELECT 
      market_condition,
      COUNT(*) as trade_count,
      ROUND((COUNT(CASE WHEN tp1_hit = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) as win_rate,
      ROUND(AVG(net_profit_loss), 2) as avg_profit_loss
    FROM market_conditions
    GROUP BY market_condition
    ORDER BY win_rate DESC, avg_profit_loss DESC
    LIMIT 5
  `, params);

  return result.rows.map(row => ({
    condition: row.market_condition,
    winRate: parseFloat(row.win_rate) || 0,
    avgProfitLoss: parseFloat(row.avg_profit_loss) || 0,
    tradeCount: parseInt(row.trade_count)
  }));
}

// ============================================================================
// HELPER FUNCTIONS - RECOMMENDATIONS
// ============================================================================

/**
 * Generate actionable recommendations based on analysis
 * Requirements: 3.3 - Generate recommendations for strategy improvement
 */
function generateRecommendations(
  stats: BatchAnalysisResponse['analysis']['aggregateStats'],
  conditions: {
    rsiRanges: Array<{ range: string; winRate: number; avgProfitLoss: number; tradeCount: number }>;
    macdSignals: Array<{ signal: string; winRate: number; avgProfitLoss: number; tradeCount: number }>;
    timeframes: Array<{ timeframe: string; winRate: number; avgProfitLoss: number; tradeCount: number }>;
    marketConditions: Array<{ condition: string; winRate: number; avgProfitLoss: number; tradeCount: number }>;
  }
): Array<{
  priority: 'high' | 'medium' | 'low';
  category: 'entry' | 'exit' | 'risk' | 'timing' | 'position_sizing';
  recommendation: string;
  potentialImpact: string;
  confidence: number;
}> {
  const recommendations: Array<any> = [];

  // Recommendation 1: Win Rate Analysis
  if (stats.winRate < 50) {
    recommendations.push({
      priority: 'high' as const,
      category: 'entry' as const,
      recommendation: `Your win rate is ${stats.winRate.toFixed(1)}%, which is below 50%. Consider tightening entry criteria and waiting for stronger confirmation signals before entering trades.`,
      potentialImpact: `Improving entry quality could increase win rate by 10-15%`,
      confidence: 85
    });
  } else if (stats.winRate > 70) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'exit' as const,
      recommendation: `Your win rate is strong at ${stats.winRate.toFixed(1)}%. Consider taking partial profits earlier to lock in gains and reduce risk.`,
      potentialImpact: `Early profit-taking could improve profit factor by 0.2-0.3`,
      confidence: 75
    });
  }

  // Recommendation 2: Profit Factor Analysis
  if (stats.profitFactor < 1.5) {
    recommendations.push({
      priority: 'high' as const,
      category: 'risk' as const,
      recommendation: `Your profit factor is ${stats.profitFactor.toFixed(2)}, indicating losses are eating into profits. Implement stricter stop-loss discipline and consider reducing position sizes.`,
      potentialImpact: `Better risk management could improve profit factor to 2.0+`,
      confidence: 90
    });
  }

  // Recommendation 3: Best RSI Range
  if (conditions.rsiRanges.length > 0) {
    const bestRSI = conditions.rsiRanges[0];
    if (bestRSI.winRate > stats.winRate + 10) {
      recommendations.push({
        priority: 'high' as const,
        category: 'entry' as const,
        recommendation: `Trades in ${bestRSI.range} RSI range have a ${bestRSI.winRate.toFixed(1)}% win rate. Focus on entering trades when RSI is in this range.`,
        potentialImpact: `Focusing on optimal RSI ranges could increase win rate by ${(bestRSI.winRate - stats.winRate).toFixed(1)}%`,
        confidence: 80
      });
    }
  }

  // Recommendation 4: Best MACD Signal
  if (conditions.macdSignals.length > 0) {
    const bestMACD = conditions.macdSignals[0];
    if (bestMACD.winRate > stats.winRate + 10) {
      recommendations.push({
        priority: 'high' as const,
        category: 'entry' as const,
        recommendation: `${bestMACD.signal} MACD signals have a ${bestMACD.winRate.toFixed(1)}% win rate. Prioritize trades with this MACD configuration.`,
        potentialImpact: `Focusing on optimal MACD signals could increase win rate by ${(bestMACD.winRate - stats.winRate).toFixed(1)}%`,
        confidence: 80
      });
    }
  }

  // Recommendation 5: Best Timeframe
  if (conditions.timeframes.length > 0) {
    const bestTimeframe = conditions.timeframes[0];
    const worstTimeframe = conditions.timeframes[conditions.timeframes.length - 1];
    
    if (bestTimeframe.winRate - worstTimeframe.winRate > 15) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'timing' as const,
        recommendation: `${bestTimeframe.timeframe} timeframe performs significantly better (${bestTimeframe.winRate.toFixed(1)}% win rate) than ${worstTimeframe.timeframe} (${worstTimeframe.winRate.toFixed(1)}%). Consider focusing on ${bestTimeframe.timeframe} trades.`,
        potentialImpact: `Optimizing timeframe selection could increase win rate by ${(bestTimeframe.winRate - worstTimeframe.winRate).toFixed(1)}%`,
        confidence: 75
      });
    }
  }

  // Recommendation 6: Market Conditions
  if (conditions.marketConditions.length > 0) {
    const bestCondition = conditions.marketConditions[0];
    if (bestCondition.winRate > stats.winRate + 10) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'timing' as const,
        recommendation: `Trades during ${bestCondition.condition} market conditions have a ${bestCondition.winRate.toFixed(1)}% win rate. Consider increasing position sizes during these conditions.`,
        potentialImpact: `Timing trades with optimal market conditions could increase win rate by ${(bestCondition.winRate - stats.winRate).toFixed(1)}%`,
        confidence: 70
      });
    }
  }

  // Recommendation 7: Average Loss Management
  if (Math.abs(stats.averageLoss) > stats.averageWin * 0.5) {
    recommendations.push({
      priority: 'high' as const,
      category: 'risk' as const,
      recommendation: `Your average loss ($${Math.abs(stats.averageLoss).toFixed(2)}) is more than 50% of your average win ($${stats.averageWin.toFixed(2)}). Tighten stop-losses to preserve capital.`,
      potentialImpact: `Reducing average loss by 25% could improve profit factor by 0.5+`,
      confidence: 85
    });
  }

  // Recommendation 8: Trade Duration
  if (stats.averageTradeDuration > 12) {
    recommendations.push({
      priority: 'low' as const,
      category: 'timing' as const,
      recommendation: `Your average trade duration is ${stats.averageTradeDuration.toFixed(1)} hours. Consider shorter timeframes or tighter profit targets to increase capital efficiency.`,
      potentialImpact: `Reducing trade duration could increase trading opportunities by 20-30%`,
      confidence: 65
    });
  }

  // Sort by priority and confidence
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.confidence - a.confidence;
  });
}

/**
 * Return empty analysis when no data is available
 */
function getEmptyAnalysis(filters: BatchAnalysisRequest): BatchAnalysisResponse['analysis'] {
  return {
    aggregateStats: {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      totalProfitLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      averageTradeDuration: 0
    },
    bestConditions: {
      rsiRanges: [],
      macdSignals: [],
      timeframes: [],
      marketConditions: []
    },
    recommendations: [],
    filters,
    analyzedAt: new Date().toISOString()
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default withAuth(handler);
