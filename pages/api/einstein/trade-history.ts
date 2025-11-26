/**
 * Einstein Trade History Endpoint
 * 
 * GET /api/einstein/trade-history
 * 
 * Returns paginated trade history with filtering and sorting options.
 * Displays all saved trades with full analysis data for the authenticated user.
 * 
 * Requirements: 11.4, 17.1, 17.2, 17.3, 17.4, 17.5
 * Task 51: Create trade history endpoint
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

/**
 * Query parameters interface
 */
interface TradeHistoryQuery {
  page?: string;
  limit?: string;
  status?: string;
  positionType?: string;
  symbol?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Trade history response interface
 */
interface TradeHistoryResponse {
  success: boolean;
  trades: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: {
    total_trades: number;
    approved_trades: number;
    executed_trades: number;
    closed_trades: number;
    // Performance metrics (Requirement 17.5)
    total_pl?: number;
    total_pl_percent?: number;
    win_rate?: number;
    average_return?: number;
    winning_trades?: number;
    losing_trades?: number;
    max_drawdown?: number;
  };
  timestamp: string;
}

/**
 * Trade history endpoint handler
 * 
 * This endpoint:
 * 1. Validates query parameters
 * 2. Builds SQL query with filters
 * 3. Fetches paginated trade history from database
 * 4. Calculates aggregate statistics
 * 5. Returns formatted response
 * 
 * Authentication: Required (JWT token in httpOnly cookie)
 * Method: GET
 * 
 * Query Parameters:
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 20, max: 100) - Number of trades per page
 * - status: string - Filter by status (PENDING, APPROVED, EXECUTED, PARTIAL_CLOSE, CLOSED)
 * - positionType: string - Filter by position type (LONG, SHORT)
 * - symbol: string - Filter by symbol (BTC, ETH, etc.)
 * - fromDate: ISO string - Filter trades created after this date
 * - toDate: ISO string - Filter trades created before this date
 * - sortBy: string (default: created_at) - Sort field (created_at, confidence_overall, data_quality_overall)
 * - sortOrder: string (default: DESC) - Sort order (ASC, DESC)
 * 
 * Response:
 * {
 *   success: boolean
 *   trades: TradeSignal[]
 *   pagination: { page, limit, total, totalPages, hasNext, hasPrev }
 *   aggregateStats: { totalTrades, pendingTrades, executedTrades, closedTrades, totalPL, winRate, averageReturn }
 *   timestamp: string
 * }
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  const startTime = Date.now();
  
  try {
    // ========================================================================
    // STEP 1: VALIDATE AND PARSE QUERY PARAMETERS
    // ========================================================================
    
    const {
      page = '1',
      limit = '20',
      status,
      positionType,
      symbol,
      fromDate,
      toDate,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query as TradeHistoryQuery;
    
    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Validate status filter
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'PARTIAL_CLOSE', 'CLOSED'];
    if (status && !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Supported values: ${validStatuses.join(', ')}`
      });
    }
    
    // Validate position type filter
    const validPositionTypes = ['LONG', 'SHORT'];
    if (positionType && !validPositionTypes.includes(positionType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid position type. Supported values: ${validPositionTypes.join(', ')}`
      });
    }
    
    // Validate sort field
    const validSortFields = ['created_at', 'confidence_overall', 'data_quality_overall', 'entry_price', 'risk_reward'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sort field. Supported values: ${validSortFields.join(', ')}`
      });
    }
    
    // Validate sort order
    const validSortOrders = ['ASC', 'DESC'];
    if (!validSortOrders.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid sort order. Supported values: ${validSortOrders.join(', ')}`
      });
    }
    
    // Validate date filters
    if (fromDate && isNaN(Date.parse(fromDate))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fromDate format. Use ISO 8601 format.'
      });
    }
    
    if (toDate && isNaN(Date.parse(toDate))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid toDate format. Use ISO 8601 format.'
      });
    }
    
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    
    console.log('\n========================================');
    console.log('EINSTEIN TRADE HISTORY REQUEST');
    console.log('========================================');
    console.log(`User: ${userEmail} (${userId})`);
    console.log(`Page: ${pageNum}, Limit: ${limitNum}`);
    if (status) console.log(`Status Filter: ${status}`);
    if (positionType) console.log(`Position Type Filter: ${positionType}`);
    if (symbol) console.log(`Symbol Filter: ${symbol}`);
    if (fromDate) console.log(`From Date: ${fromDate}`);
    if (toDate) console.log(`To Date: ${toDate}`);
    console.log(`Sort: ${sortBy} ${sortOrder}`);
    console.log('========================================\n');
    
    // ========================================================================
    // STEP 2: BUILD SQL QUERY WITH FILTERS
    // ========================================================================
    
    const whereClauses: string[] = ['user_id = $1'];
    const queryParams: any[] = [userId];
    let paramIndex = 2;
    
    // Add status filter
    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      queryParams.push(status.toUpperCase());
      paramIndex++;
    }
    
    // Add position type filter
    if (positionType) {
      whereClauses.push(`position_type = $${paramIndex}`);
      queryParams.push(positionType.toUpperCase());
      paramIndex++;
    }
    
    // Add symbol filter
    if (symbol) {
      whereClauses.push(`symbol = $${paramIndex}`);
      queryParams.push(symbol.toUpperCase());
      paramIndex++;
    }
    
    // Add date range filters
    if (fromDate) {
      whereClauses.push(`created_at >= $${paramIndex}`);
      queryParams.push(fromDate);
      paramIndex++;
    }
    
    if (toDate) {
      whereClauses.push(`created_at <= $${paramIndex}`);
      queryParams.push(toDate);
      paramIndex++;
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    // ========================================================================
    // STEP 3: FETCH TOTAL COUNT
    // ========================================================================
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM einstein_trade_signals
      WHERE ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limitNum);
    
    console.log(`Total trades matching filters: ${total}`);
    console.log(`Total pages: ${totalPages}\n`);
    
    // ========================================================================
    // STEP 4: FETCH PAGINATED TRADES
    // ========================================================================
    
    const tradesQuery = `
      SELECT 
        id, symbol, position_type, status,
        entry_price, stop_loss,
        tp1_price, tp1_allocation, tp2_price, tp2_allocation, tp3_price, tp3_allocation,
        confidence_overall, confidence_technical, confidence_sentiment, confidence_onchain, confidence_risk,
        risk_reward, position_size, max_loss,
        timeframe, created_at, approved_at, approved_by,
        data_quality_overall, data_quality_market, data_quality_sentiment, data_quality_onchain, data_quality_technical,
        analysis_technical, analysis_sentiment, analysis_onchain, analysis_risk, analysis_reasoning,
        timeframe_alignment
      FROM einstein_trade_signals
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const tradesParams = [...queryParams, limitNum, offset];
    const tradesResult = await query(tradesQuery, tradesParams);
    
    console.log(`Fetched ${tradesResult.rows.length} trades for page ${pageNum}\n`);
    
    // ========================================================================
    // STEP 5: CALCULATE AGGREGATE STATISTICS (Requirement 17.5)
    // ========================================================================
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_trades,
        COUNT(*) FILTER (WHERE status = 'EXECUTED') as executed_trades,
        COUNT(*) FILTER (WHERE status = 'CLOSED') as closed_trades,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_trades
      FROM einstein_trade_signals
      WHERE user_id = $1
    `;
    
    const statsResult = await query(statsQuery, [userId]);
    const stats = statsResult.rows[0];
    
    // Calculate performance metrics for closed trades (Requirement 17.5)
    let totalPL = 0;
    let totalPLPercent = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let maxDrawdown = 0;
    let cumulativePL = 0;
    let peakPL = 0;
    
    const closedTradesCount = parseInt(stats.closed_trades, 10);
    
    if (closedTradesCount > 0) {
      // Fetch closed trades with P/L data
      const closedTradesQuery = `
        SELECT 
          realized_pl,
          realized_pl_percent,
          created_at
        FROM einstein_trade_signals
        WHERE user_id = $1 AND status = 'CLOSED'
        ORDER BY created_at ASC
      `;
      
      const closedTradesResult = await query(closedTradesQuery, [userId]);
      
      // Calculate aggregate metrics
      for (const trade of closedTradesResult.rows) {
        const pl = parseFloat(trade.realized_pl || 0);
        const plPercent = parseFloat(trade.realized_pl_percent || 0);
        
        totalPL += pl;
        totalPLPercent += plPercent;
        
        if (pl > 0) {
          winningTrades++;
        } else if (pl < 0) {
          losingTrades++;
        }
        
        // Calculate maximum drawdown
        cumulativePL += pl;
        if (cumulativePL > peakPL) {
          peakPL = cumulativePL;
        }
        const drawdown = peakPL - cumulativePL;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    // Calculate win rate and average return
    const winRate = closedTradesCount > 0 
      ? (winningTrades / closedTradesCount) * 100 
      : 0;
    
    const averageReturn = closedTradesCount > 0 
      ? totalPLPercent / closedTradesCount 
      : 0;
    
    const aggregateStats = {
      total_trades: parseInt(stats.total_trades, 10),
      approved_trades: parseInt(stats.approved_trades, 10),
      executed_trades: parseInt(stats.executed_trades, 10),
      closed_trades: closedTradesCount,
      // Performance metrics (Requirement 17.5)
      total_pl: closedTradesCount > 0 ? totalPL : undefined,
      total_pl_percent: closedTradesCount > 0 ? totalPLPercent : undefined,
      win_rate: closedTradesCount > 0 ? winRate : undefined,
      average_return: closedTradesCount > 0 ? averageReturn : undefined,
      winning_trades: closedTradesCount > 0 ? winningTrades : undefined,
      losing_trades: closedTradesCount > 0 ? losingTrades : undefined,
      max_drawdown: closedTradesCount > 0 ? maxDrawdown : undefined
    };
    
    console.log('Aggregate Statistics:');
    console.log(`  Total Trades: ${aggregateStats.total_trades}`);
    console.log(`  Approved: ${aggregateStats.approved_trades}`);
    console.log(`  Executed: ${aggregateStats.executed_trades}`);
    console.log(`  Closed: ${aggregateStats.closed_trades}`);
    if (closedTradesCount > 0) {
      console.log(`  Total P/L: ${totalPL.toFixed(2)} (${totalPLPercent.toFixed(2)}%)`);
      console.log(`  Win Rate: ${winRate.toFixed(2)}% (${winningTrades}W / ${losingTrades}L)`);
      console.log(`  Average Return: ${averageReturn.toFixed(2)}%`);
      console.log(`  Max Drawdown: ${maxDrawdown.toFixed(2)}`);
    }
    console.log();
    
    // ========================================================================
    // STEP 6: FORMAT AND RETURN RESPONSE
    // ========================================================================
    
    const totalTime = Date.now() - startTime;
    
    const response: TradeHistoryResponse = {
      success: true,
      trades: tradesResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      stats: aggregateStats,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Trade history fetched successfully');
    console.log(`Total time: ${totalTime}ms`);
    console.log('========================================\n');
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    
    console.error('\n========================================');
    console.error('❌ ENDPOINT ERROR');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`Total time: ${totalTime}ms\n`);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching trade history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Export handler wrapped with authentication middleware
 * 
 * This ensures that only authenticated users can view their trade history.
 * The withAuth middleware verifies the JWT token and attaches user data to the request.
 */
export default withAuth(handler);
