/**
 * ATGE Statistics API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Returns performance statistics for the dashboard
 * Queries atge_performance_cache table for user statistics
 * Recalculates if cache is stale (>1 hour)
 * 
 * Requirements: 1.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StatisticsResponse {
  success: boolean;
  statistics: {
    // Aggregate Statistics
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number; // Percentage (0-100)
    
    // Profit/Loss
    totalProfitLoss: number;
    totalProfit: number;
    totalLoss: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number; // Total profit / total loss
    
    // Best/Worst Trades
    bestTrade: {
      id: string | null;
      profit: number;
    };
    worstTrade: {
      id: string | null;
      loss: number;
    };
    
    // Advanced Metrics
    sharpeRatio: number | null;
    maxDrawdown: number | null;
    winLossRatio: number | null;
    
    // Social Intelligence Performance
    avgGalaxyScoreWins: number | null;
    avgGalaxyScoreLosses: number | null;
    socialCorrelation: number | null;
    
    // Best Performing Symbol
    bestPerformingSymbol: string | null;
    
    // Cache Metadata
    lastCalculated: string;
    cacheAge: number; // Age in seconds
  };
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_SECONDS = 3600; // 1 hour

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function handler(req: AuthenticatedRequest, res: NextApiResponse<StatisticsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      statistics: getEmptyStatistics(),
      error: 'Method not allowed'
    });
  }

  const userId = req.user!.id;
  console.log(`[ATGE Statistics] Fetching statistics for user ${userId}`);

  try {
    // Query atge_performance_cache table for user statistics
    const cacheResult = await query(
      'SELECT * FROM atge_performance_cache WHERE user_id = $1',
      [userId]
    );

    // Check if cache exists
    if (cacheResult.rows.length === 0) {
      console.log('[ATGE Statistics] No cache found, calculating statistics...');
      
      // Calculate statistics using calculate_atge_performance() function
      await recalculateStatistics(userId);
      
      // Fetch the newly calculated statistics
      const newCacheResult = await query(
        'SELECT * FROM atge_performance_cache WHERE user_id = $1',
        [userId]
      );
      
      if (newCacheResult.rows.length === 0) {
        // No trades yet, return empty statistics
        console.log('[ATGE Statistics] No trades found for user');
        return res.status(200).json({
          success: true,
          statistics: getEmptyStatistics()
        });
      }
      
      return res.status(200).json({
        success: true,
        statistics: formatStatistics(newCacheResult.rows[0])
      });
    }

    const cachedData = cacheResult.rows[0];
    const lastCalculated = new Date(cachedData.last_calculated_at);
    const cacheAge = Math.floor((Date.now() - lastCalculated.getTime()) / 1000);

    // Check if cache is stale (>1 hour)
    if (cacheAge > CACHE_TTL_SECONDS) {
      console.log(`[ATGE Statistics] Cache is stale (${cacheAge}s old), recalculating...`);
      
      // Recalculate using calculate_atge_performance() function
      await recalculateStatistics(userId);
      
      // Fetch the updated statistics
      const updatedCacheResult = await query(
        'SELECT * FROM atge_performance_cache WHERE user_id = $1',
        [userId]
      );
      
      return res.status(200).json({
        success: true,
        statistics: formatStatistics(updatedCacheResult.rows[0])
      });
    }

    // Cache is fresh, return cached statistics
    console.log(`[ATGE Statistics] Returning cached statistics (${cacheAge}s old)`);
    
    return res.status(200).json({
      success: true,
      statistics: formatStatistics(cachedData)
    });

  } catch (error) {
    console.error('[ATGE Statistics] Error fetching statistics:', error);
    
    return res.status(500).json({
      success: false,
      statistics: getEmptyStatistics(),
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Recalculate statistics using calculate_atge_performance() function
 * Requirements: 1.5 - If cache is stale (>1 hour), recalculate using calculate_atge_performance() function
 */
async function recalculateStatistics(userId: string): Promise<void> {
  console.log(`[ATGE Statistics] Calling calculate_atge_performance for user ${userId}`);
  
  try {
    await query('SELECT calculate_atge_performance($1)', [userId]);
    console.log('[ATGE Statistics] Statistics recalculated successfully');
  } catch (error) {
    console.error('[ATGE Statistics] Error recalculating statistics:', error);
    throw error;
  }
}

/**
 * Format cached data into statistics response
 * Requirements: 1.5 - Calculate win rate, profit factor, average profit/loss
 */
function formatStatistics(cachedData: any): StatisticsResponse['statistics'] {
  const lastCalculated = new Date(cachedData.last_calculated_at);
  const cacheAge = Math.floor((Date.now() - lastCalculated.getTime()) / 1000);

  // Calculate win rate (trades hitting at least TP1)
  // Requirements: 1.5 - Calculate win rate (trades hitting at least TP1)
  const winRate = cachedData.success_rate ? parseFloat(cachedData.success_rate) : 0;

  // Calculate profit factor (total profit / total loss)
  // Requirements: 1.5 - Calculate profit factor (total profit / total loss)
  const totalProfit = cachedData.total_profit ? parseFloat(cachedData.total_profit) : 0;
  const totalLoss = cachedData.total_loss ? parseFloat(cachedData.total_loss) : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

  // Calculate average profit per winning trade
  // Requirements: 1.5 - Calculate average profit per winning trade
  const averageWin = cachedData.average_win ? parseFloat(cachedData.average_win) : 0;

  // Calculate average loss per losing trade
  // Requirements: 1.5 - Calculate average loss per losing trade
  const averageLoss = cachedData.average_loss ? parseFloat(cachedData.average_loss) : 0;

  // Determine best performing symbol (BTC vs ETH)
  // Requirements: 1.5 - Show best performing symbol (BTC vs ETH)
  // Note: This would require additional query to compare BTC vs ETH performance
  // For now, we'll return null and implement in a future enhancement
  const bestPerformingSymbol = null;

  return {
    // Aggregate Statistics
    totalTrades: cachedData.total_trades || 0,
    winningTrades: cachedData.winning_trades || 0,
    losingTrades: cachedData.losing_trades || 0,
    winRate: winRate,
    
    // Profit/Loss
    totalProfitLoss: cachedData.total_profit_loss ? parseFloat(cachedData.total_profit_loss) : 0,
    totalProfit: totalProfit,
    totalLoss: totalLoss,
    averageWin: averageWin,
    averageLoss: averageLoss,
    profitFactor: profitFactor,
    
    // Best/Worst Trades
    bestTrade: {
      id: cachedData.best_trade_id || null,
      profit: cachedData.best_trade_profit ? parseFloat(cachedData.best_trade_profit) : 0
    },
    worstTrade: {
      id: cachedData.worst_trade_id || null,
      loss: cachedData.worst_trade_loss ? parseFloat(cachedData.worst_trade_loss) : 0
    },
    
    // Advanced Metrics
    sharpeRatio: cachedData.sharpe_ratio ? parseFloat(cachedData.sharpe_ratio) : null,
    maxDrawdown: cachedData.max_drawdown ? parseFloat(cachedData.max_drawdown) : null,
    winLossRatio: cachedData.win_loss_ratio ? parseFloat(cachedData.win_loss_ratio) : null,
    
    // Social Intelligence Performance
    avgGalaxyScoreWins: cachedData.avg_galaxy_score_wins ? parseFloat(cachedData.avg_galaxy_score_wins) : null,
    avgGalaxyScoreLosses: cachedData.avg_galaxy_score_losses ? parseFloat(cachedData.avg_galaxy_score_losses) : null,
    socialCorrelation: cachedData.social_correlation ? parseFloat(cachedData.social_correlation) : null,
    
    // Best Performing Symbol
    bestPerformingSymbol: bestPerformingSymbol,
    
    // Cache Metadata
    lastCalculated: lastCalculated.toISOString(),
    cacheAge: cacheAge
  };
}

/**
 * Return empty statistics when no data is available
 */
function getEmptyStatistics(): StatisticsResponse['statistics'] {
  return {
    // Aggregate Statistics
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    
    // Profit/Loss
    totalProfitLoss: 0,
    totalProfit: 0,
    totalLoss: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    
    // Best/Worst Trades
    bestTrade: {
      id: null,
      profit: 0
    },
    worstTrade: {
      id: null,
      loss: 0
    },
    
    // Advanced Metrics
    sharpeRatio: null,
    maxDrawdown: null,
    winLossRatio: null,
    
    // Social Intelligence Performance
    avgGalaxyScoreWins: null,
    avgGalaxyScoreLosses: null,
    socialCorrelation: null,
    
    // Best Performing Symbol
    bestPerformingSymbol: null,
    
    // Cache Metadata
    lastCalculated: new Date().toISOString(),
    cacheAge: 0
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default withAuth(handler);
