/**
 * ATGE Analytics API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Returns comprehensive analytics for trade performance
 * Includes win rate over time, P/L distribution, best/worst trades,
 * symbol comparison, and timeframe performance
 * 
 * Requirements: 2.4
 */

import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AnalyticsResponse {
  success: boolean;
  analytics: {
    // Win Rate Over Time
    winRateOverTime: {
      daily: Array<{
        date: string;
        winRate: number;
        totalTrades: number;
        winningTrades: number;
      }>;
      weekly: Array<{
        week: string;
        winRate: number;
        totalTrades: number;
        winningTrades: number;
      }>;
    };
    
    // P/L Distribution (Histogram)
    profitLossDistribution: Array<{
      bucket: string; // e.g., "-500 to -400", "-400 to -300", etc.
      count: number;
      percentage: number;
    }>;
    
    // Best/Worst Trades
    bestTrades: Array<{
      id: string;
      symbol: string;
      entryPrice: number;
      exitPrice: number;
      profitLoss: number;
      profitLossPercentage: number;
      timeframe: string;
      generatedAt: string;
    }>;
    worstTrades: Array<{
      id: string;
      symbol: string;
      entryPrice: number;
      exitPrice: number;
      profitLoss: number;
      profitLossPercentage: number;
      timeframe: string;
      generatedAt: string;
    }>;
    
    // Symbol Performance Comparison
    symbolPerformance: {
      BTC: {
        totalTrades: number;
        winRate: number;
        totalProfitLoss: number;
        averageProfitLoss: number;
      };
      ETH: {
        totalTrades: number;
        winRate: number;
        totalProfitLoss: number;
        averageProfitLoss: number;
      };
    };
    
    // Timeframe Performance
    timeframePerformance: Array<{
      timeframe: string;
      totalTrades: number;
      winRate: number;
      totalProfitLoss: number;
      averageProfitLoss: number;
    }>;
    
    // Metadata
    dateRange: {
      start: string;
      end: string;
    };
    totalTradesAnalyzed: number;
  };
  error?: string;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function handler(req: AuthenticatedRequest, res: NextApiResponse<AnalyticsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      analytics: getEmptyAnalytics(),
      error: 'Method not allowed'
    });
  }

  const userId = req.user!.id;
  console.log(`[ATGE Analytics] Fetching analytics for user ${userId}`);

  try {
    // Parse query parameters for filtering
    const {
      startDate,
      endDate,
      symbol,
      status
    } = req.query;

    // Build WHERE clause for filtering
    const conditions: string[] = ['ts.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`ts.generated_at >= $${paramIndex++}`);
      params.push(new Date(startDate as string));
    }

    if (endDate) {
      conditions.push(`ts.generated_at <= $${paramIndex++}`);
      params.push(new Date(endDate as string));
    }

    if (symbol) {
      conditions.push(`ts.symbol = $${paramIndex++}`);
      params.push(symbol);
    }

    if (status) {
      conditions.push(`ts.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Fetch all analytics data in parallel
    const [
      winRateDaily,
      winRateWeekly,
      plDistribution,
      bestTrades,
      worstTrades,
      btcPerformance,
      ethPerformance,
      timeframePerformance,
      dateRange
    ] = await Promise.all([
      calculateWinRateDaily(whereClause, params),
      calculateWinRateWeekly(whereClause, params),
      calculatePLDistribution(whereClause, params),
      fetchBestTrades(whereClause, params),
      fetchWorstTrades(whereClause, params),
      calculateSymbolPerformance(whereClause, params, 'BTC'),
      calculateSymbolPerformance(whereClause, params, 'ETH'),
      calculateTimeframePerformance(whereClause, params),
      getDateRange(whereClause, params)
    ]);

    // Count total trades analyzed
    const totalTradesResult = await query(`
      SELECT COUNT(*) as total
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      WHERE ${whereClause}
    `, params);

    const totalTradesAnalyzed = parseInt(totalTradesResult.rows[0].total);

    console.log(`[ATGE Analytics] Analytics calculated for ${totalTradesAnalyzed} trades`);

    return res.status(200).json({
      success: true,
      analytics: {
        winRateOverTime: {
          daily: winRateDaily,
          weekly: winRateWeekly
        },
        profitLossDistribution: plDistribution,
        bestTrades,
        worstTrades,
        symbolPerformance: {
          BTC: btcPerformance,
          ETH: ethPerformance
        },
        timeframePerformance,
        dateRange,
        totalTradesAnalyzed
      }
    });

  } catch (error) {
    console.error('[ATGE Analytics] Error fetching analytics:', error);
    
    return res.status(500).json({
      success: false,
      analytics: getEmptyAnalytics(),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate win rate over time (daily aggregation)
 * Requirements: 2.4 - Calculate win rate over time (daily/weekly aggregation)
 */
async function calculateWinRateDaily(
  whereClause: string,
  params: any[]
): Promise<Array<{ date: string; winRate: number; totalTrades: number; winningTrades: number }>> {
  const result = await query(`
    SELECT 
      DATE(ts.generated_at) as date,
      COUNT(*) as total_trades,
      COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END) as winning_trades,
      ROUND(
        (COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100,
        2
      ) as win_rate
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${whereClause}
    GROUP BY DATE(ts.generated_at)
    ORDER BY DATE(ts.generated_at) DESC
    LIMIT 30
  `, params);

  return result.rows.map(row => ({
    date: row.date,
    winRate: parseFloat(row.win_rate) || 0,
    totalTrades: parseInt(row.total_trades),
    winningTrades: parseInt(row.winning_trades)
  }));
}

/**
 * Calculate win rate over time (weekly aggregation)
 * Requirements: 2.4 - Calculate win rate over time (daily/weekly aggregation)
 */
async function calculateWinRateWeekly(
  whereClause: string,
  params: any[]
): Promise<Array<{ week: string; winRate: number; totalTrades: number; winningTrades: number }>> {
  const result = await query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('week', ts.generated_at), 'YYYY-"W"IW') as week,
      COUNT(*) as total_trades,
      COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END) as winning_trades,
      ROUND(
        (COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100,
        2
      ) as win_rate
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${whereClause}
    GROUP BY DATE_TRUNC('week', ts.generated_at)
    ORDER BY DATE_TRUNC('week', ts.generated_at) DESC
    LIMIT 12
  `, params);

  return result.rows.map(row => ({
    week: row.week,
    winRate: parseFloat(row.win_rate) || 0,
    totalTrades: parseInt(row.total_trades),
    winningTrades: parseInt(row.winning_trades)
  }));
}

/**
 * Calculate P/L distribution (histogram buckets)
 * Requirements: 2.4 - Calculate P/L distribution (histogram buckets)
 */
async function calculatePLDistribution(
  whereClause: string,
  params: any[]
): Promise<Array<{ bucket: string; count: number; percentage: number }>> {
  const result = await query(`
    WITH pl_data AS (
      SELECT 
        tr.net_profit_loss,
        CASE
          WHEN tr.net_profit_loss < -500 THEN '< -500'
          WHEN tr.net_profit_loss >= -500 AND tr.net_profit_loss < -400 THEN '-500 to -400'
          WHEN tr.net_profit_loss >= -400 AND tr.net_profit_loss < -300 THEN '-400 to -300'
          WHEN tr.net_profit_loss >= -300 AND tr.net_profit_loss < -200 THEN '-300 to -200'
          WHEN tr.net_profit_loss >= -200 AND tr.net_profit_loss < -100 THEN '-200 to -100'
          WHEN tr.net_profit_loss >= -100 AND tr.net_profit_loss < 0 THEN '-100 to 0'
          WHEN tr.net_profit_loss >= 0 AND tr.net_profit_loss < 100 THEN '0 to 100'
          WHEN tr.net_profit_loss >= 100 AND tr.net_profit_loss < 200 THEN '100 to 200'
          WHEN tr.net_profit_loss >= 200 AND tr.net_profit_loss < 300 THEN '200 to 300'
          WHEN tr.net_profit_loss >= 300 AND tr.net_profit_loss < 400 THEN '300 to 400'
          WHEN tr.net_profit_loss >= 400 AND tr.net_profit_loss < 500 THEN '400 to 500'
          ELSE '> 500'
        END as bucket
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      WHERE ${whereClause}
        AND tr.net_profit_loss IS NOT NULL
    ),
    bucket_counts AS (
      SELECT 
        bucket,
        COUNT(*) as count
      FROM pl_data
      GROUP BY bucket
    ),
    total_count AS (
      SELECT COUNT(*) as total FROM pl_data
    )
    SELECT 
      bc.bucket,
      bc.count,
      ROUND((bc.count::numeric / tc.total::numeric) * 100, 2) as percentage
    FROM bucket_counts bc
    CROSS JOIN total_count tc
    ORDER BY 
      CASE bc.bucket
        WHEN '< -500' THEN 1
        WHEN '-500 to -400' THEN 2
        WHEN '-400 to -300' THEN 3
        WHEN '-300 to -200' THEN 4
        WHEN '-200 to -100' THEN 5
        WHEN '-100 to 0' THEN 6
        WHEN '0 to 100' THEN 7
        WHEN '100 to 200' THEN 8
        WHEN '200 to 300' THEN 9
        WHEN '300 to 400' THEN 10
        WHEN '400 to 500' THEN 11
        ELSE 12
      END
  `, params);

  return result.rows.map(row => ({
    bucket: row.bucket,
    count: parseInt(row.count),
    percentage: parseFloat(row.percentage)
  }));
}

/**
 * Fetch best 5 trades
 * Requirements: 2.4 - Identify best 5 and worst 5 trades
 */
async function fetchBestTrades(
  whereClause: string,
  params: any[]
): Promise<Array<{
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  profitLossPercentage: number;
  timeframe: string;
  generatedAt: string;
}>> {
  const result = await query(`
    SELECT 
      ts.id,
      ts.symbol,
      ts.entry_price,
      COALESCE(tr.tp3_hit_price, tr.tp2_hit_price, tr.tp1_hit_price) as exit_price,
      tr.net_profit_loss,
      tr.profit_loss_percentage,
      ts.timeframe,
      ts.generated_at
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${whereClause}
      AND tr.net_profit_loss IS NOT NULL
      AND tr.net_profit_loss > 0
    ORDER BY tr.net_profit_loss DESC
    LIMIT 5
  `, params);

  return result.rows.map(row => ({
    id: row.id,
    symbol: row.symbol,
    entryPrice: parseFloat(row.entry_price),
    exitPrice: parseFloat(row.exit_price),
    profitLoss: parseFloat(row.net_profit_loss),
    profitLossPercentage: parseFloat(row.profit_loss_percentage),
    timeframe: row.timeframe,
    generatedAt: new Date(row.generated_at).toISOString()
  }));
}

/**
 * Fetch worst 5 trades
 * Requirements: 2.4 - Identify best 5 and worst 5 trades
 */
async function fetchWorstTrades(
  whereClause: string,
  params: any[]
): Promise<Array<{
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  profitLossPercentage: number;
  timeframe: string;
  generatedAt: string;
}>> {
  const result = await query(`
    SELECT 
      ts.id,
      ts.symbol,
      ts.entry_price,
      COALESCE(tr.stop_loss_hit_price, tr.tp1_hit_price) as exit_price,
      tr.net_profit_loss,
      tr.profit_loss_percentage,
      ts.timeframe,
      ts.generated_at
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${whereClause}
      AND tr.net_profit_loss IS NOT NULL
      AND tr.net_profit_loss < 0
    ORDER BY tr.net_profit_loss ASC
    LIMIT 5
  `, params);

  return result.rows.map(row => ({
    id: row.id,
    symbol: row.symbol,
    entryPrice: parseFloat(row.entry_price),
    exitPrice: row.exit_price ? parseFloat(row.exit_price) : parseFloat(row.entry_price),
    profitLoss: parseFloat(row.net_profit_loss),
    profitLossPercentage: parseFloat(row.profit_loss_percentage),
    timeframe: row.timeframe,
    generatedAt: new Date(row.generated_at).toISOString()
  }));
}

/**
 * Calculate symbol performance (BTC vs ETH)
 * Requirements: 2.4 - Compare BTC vs ETH performance
 */
async function calculateSymbolPerformance(
  whereClause: string,
  params: any[],
  symbol: 'BTC' | 'ETH'
): Promise<{
  totalTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageProfitLoss: number;
}> {
  // Add symbol filter to WHERE clause
  const symbolWhereClause = `${whereClause} AND ts.symbol = '${symbol}'`;

  const result = await query(`
    SELECT 
      COUNT(*) as total_trades,
      COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END) as winning_trades,
      ROUND(
        (COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
        2
      ) as win_rate,
      COALESCE(SUM(tr.net_profit_loss), 0) as total_profit_loss,
      COALESCE(AVG(tr.net_profit_loss), 0) as average_profit_loss
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${symbolWhereClause}
  `, params);

  const row = result.rows[0];

  return {
    totalTrades: parseInt(row.total_trades),
    winRate: parseFloat(row.win_rate) || 0,
    totalProfitLoss: parseFloat(row.total_profit_loss),
    averageProfitLoss: parseFloat(row.average_profit_loss)
  };
}

/**
 * Calculate timeframe performance (15m, 1h, 4h, 1d)
 * Requirements: 2.4 - Compare timeframe performance (15m, 1h, 4h, 1d)
 */
async function calculateTimeframePerformance(
  whereClause: string,
  params: any[]
): Promise<Array<{
  timeframe: string;
  totalTrades: number;
  winRate: number;
  totalProfitLoss: number;
  averageProfitLoss: number;
}>> {
  const result = await query(`
    SELECT 
      ts.timeframe,
      COUNT(*) as total_trades,
      COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END) as winning_trades,
      ROUND(
        (COUNT(CASE WHEN tr.tp1_hit = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
        2
      ) as win_rate,
      COALESCE(SUM(tr.net_profit_loss), 0) as total_profit_loss,
      COALESCE(AVG(tr.net_profit_loss), 0) as average_profit_loss
    FROM trade_signals ts
    LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
    WHERE ${whereClause}
    GROUP BY ts.timeframe
    ORDER BY 
      CASE ts.timeframe
        WHEN '15m' THEN 1
        WHEN '1h' THEN 2
        WHEN '4h' THEN 3
        WHEN '1d' THEN 4
        ELSE 5
      END
  `, params);

  return result.rows.map(row => ({
    timeframe: row.timeframe,
    totalTrades: parseInt(row.total_trades),
    winRate: parseFloat(row.win_rate) || 0,
    totalProfitLoss: parseFloat(row.total_profit_loss),
    averageProfitLoss: parseFloat(row.average_profit_loss)
  }));
}

/**
 * Get date range for analytics
 */
async function getDateRange(
  whereClause: string,
  params: any[]
): Promise<{ start: string; end: string }> {
  const result = await query(`
    SELECT 
      MIN(ts.generated_at) as start_date,
      MAX(ts.generated_at) as end_date
    FROM trade_signals ts
    WHERE ${whereClause}
  `, params);

  const row = result.rows[0];

  return {
    start: row.start_date ? new Date(row.start_date).toISOString() : new Date().toISOString(),
    end: row.end_date ? new Date(row.end_date).toISOString() : new Date().toISOString()
  };
}

/**
 * Return empty analytics when no data is available
 */
function getEmptyAnalytics(): AnalyticsResponse['analytics'] {
  return {
    winRateOverTime: {
      daily: [],
      weekly: []
    },
    profitLossDistribution: [],
    bestTrades: [],
    worstTrades: [],
    symbolPerformance: {
      BTC: {
        totalTrades: 0,
        winRate: 0,
        totalProfitLoss: 0,
        averageProfitLoss: 0
      },
      ETH: {
        totalTrades: 0,
        winRate: 0,
        totalProfitLoss: 0,
        averageProfitLoss: 0
      }
    },
    timeframePerformance: [],
    dateRange: {
      start: new Date().toISOString(),
      end: new Date().toISOString()
    },
    totalTradesAnalyzed: 0
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default withAuth(handler);
