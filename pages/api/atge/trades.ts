/**
 * ATGE Trades API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Fetches all trades for the authenticated user with optional filters.
 * Returns complete trade data with results, indicators, and snapshots.
 * 
 * Requirements: 8.1-8.24, 5.13-5.16
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

interface TradeWithRelations {
  // Trade Signal
  id: string;
  userId: string;
  symbol: string;
  status: string;
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  stopLossPercentage: number;
  timeframe: string;
  timeframeHours: number;
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: string;
  aiReasoning: string;
  aiModelVersion: string;
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Trade Result (if exists)
  result?: {
    id: string;
    actualEntryPrice: number;
    actualExitPrice?: number;
    tp1Hit: boolean;
    tp1HitAt?: Date;
    tp1HitPrice?: number;
    tp2Hit: boolean;
    tp2HitAt?: Date;
    tp2HitPrice?: number;
    tp3Hit: boolean;
    tp3HitAt?: Date;
    tp3HitPrice?: number;
    stopLossHit: boolean;
    stopLossHitAt?: Date;
    stopLossHitPrice?: number;
    profitLossUsd?: number;
    profitLossPercentage?: number;
    tradeDurationMinutes?: number;
    tradeSizeUsd: number;
    feesUsd: number;
    slippageUsd: number;
    netProfitLossUsd?: number;
    dataSource: string;
    dataResolution: string;
    dataQualityScore: number;
    aiAnalysis?: string;
    backtestedAt: Date;
  };
  
  // Technical Indicators (if exists)
  indicators?: {
    rsiValue?: number;
    macdValue?: number;
    macdSignal?: number;
    macdHistogram?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
    bollingerUpper?: number;
    bollingerMiddle?: number;
    bollingerLower?: number;
    atrValue?: number;
    volume24h?: number;
    marketCap?: number;
  };
  
  // Market Snapshot (if exists)
  snapshot?: {
    currentPrice: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    socialSentimentScore?: number;
    whaleActivityCount?: number;
    fearGreedIndex?: number;
    snapshotAt: Date;
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    // Get authenticated user
    const userId = req.user!.id;
    
    // Parse query parameters
    const {
      symbol,
      status,
      timeframe,
      startDate,
      endDate,
      needsData, // Filter for trades that need historical data
      sortBy = 'generated_at',
      sortOrder = 'DESC',
      limit = '25',
      offset = '0'
    } = req.query;
    
    // Build WHERE clause
    const conditions: string[] = ['ts.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (symbol) {
      conditions.push(`ts.symbol = $${paramIndex++}`);
      params.push(symbol);
    }
    
    if (status) {
      conditions.push(`ts.status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (timeframe) {
      conditions.push(`ts.timeframe = $${paramIndex++}`);
      params.push(timeframe);
    }
    
    if (startDate) {
      conditions.push(`ts.generated_at >= $${paramIndex++}`);
      params.push(new Date(startDate as string));
    }
    
    if (endDate) {
      conditions.push(`ts.generated_at <= $${paramIndex++}`);
      params.push(new Date(endDate as string));
    }
    
    // Filter for trades that need historical data (active trades without results)
    if (needsData === 'true') {
      conditions.push(`ts.status = 'active'`);
      conditions.push(`tr.id IS NULL`); // No result exists yet
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Validate sort column
    const validSortColumns = ['generated_at', 'confidence_score', 'status', 'timeframe'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'generated_at';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    // Parse pagination
    const limitNum = Math.min(parseInt(limit as string) || 25, 100);
    const offsetNum = parseInt(offset as string) || 0;
    
    // Fetch trades with all related data using LEFT JOINs
    const result = await query(`
      SELECT 
        -- Trade Signal
        ts.id, ts.user_id, ts.symbol, ts.status,
        ts.entry_price, 
        ts.tp1_price, ts.tp1_allocation,
        ts.tp2_price, ts.tp2_allocation,
        ts.tp3_price, ts.tp3_allocation,
        ts.stop_loss_price, ts.stop_loss_percentage,
        ts.timeframe, ts.timeframe_hours,
        ts.confidence_score, ts.risk_reward_ratio, ts.market_condition,
        ts.ai_reasoning, ts.ai_model_version,
        ts.generated_at, ts.expires_at, ts.created_at, ts.updated_at,
        
        -- Trade Result
        tr.id as result_id,
        tr.actual_entry_price, tr.actual_exit_price,
        tr.tp1_hit, tr.tp1_hit_at, tr.tp1_hit_price,
        tr.tp2_hit, tr.tp2_hit_at, tr.tp2_hit_price,
        tr.tp3_hit, tr.tp3_hit_at, tr.tp3_hit_price,
        tr.stop_loss_hit, tr.stop_loss_hit_at, tr.stop_loss_hit_price,
        tr.profit_loss_usd, tr.profit_loss_percentage, tr.trade_duration_minutes,
        tr.trade_size_usd, tr.fees_usd, tr.slippage_usd, tr.net_profit_loss_usd,
        tr.data_source, tr.data_resolution, tr.data_quality_score,
        tr.ai_analysis, tr.backtested_at,
        
        -- Technical Indicators
        ti.rsi_value, ti.macd_value, ti.macd_signal, ti.macd_histogram,
        ti.ema_20, ti.ema_50, ti.ema_200,
        ti.bollinger_upper, ti.bollinger_middle, ti.bollinger_lower,
        ti.atr_value, ti.volume_24h as indicator_volume, ti.market_cap as indicator_market_cap,
        
        -- Market Snapshot
        ms.current_price, ms.price_change_24h, ms.volume_24h as snapshot_volume, ms.market_cap as snapshot_market_cap,
        ms.social_sentiment_score, ms.whale_activity_count, ms.fear_greed_index,
        ms.snapshot_at
        
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_technical_indicators ti ON ts.id = ti.trade_signal_id
      LEFT JOIN trade_market_snapshot ms ON ts.id = ms.trade_signal_id
      WHERE ${whereClause}
      ORDER BY ts.${sortColumn} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limitNum, offsetNum]);
    
    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM trade_signals ts
      WHERE ${whereClause}
    `, params);
    
    const total = parseInt(countResult.rows[0].total);
    
    // Map database rows to structured objects
    const trades: TradeWithRelations[] = result.rows.map((row: any) => {
      const trade: TradeWithRelations = {
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        status: row.status,
        entryPrice: parseFloat(row.entry_price),
        tp1Price: parseFloat(row.tp1_price),
        tp1Allocation: parseFloat(row.tp1_allocation),
        tp2Price: parseFloat(row.tp2_price),
        tp2Allocation: parseFloat(row.tp2_allocation),
        tp3Price: parseFloat(row.tp3_price),
        tp3Allocation: parseFloat(row.tp3_allocation),
        stopLossPrice: parseFloat(row.stop_loss_price),
        stopLossPercentage: parseFloat(row.stop_loss_percentage),
        timeframe: row.timeframe,
        timeframeHours: row.timeframe_hours,
        confidenceScore: row.confidence_score,
        riskRewardRatio: parseFloat(row.risk_reward_ratio),
        marketCondition: row.market_condition,
        aiReasoning: row.ai_reasoning,
        aiModelVersion: row.ai_model_version,
        generatedAt: new Date(row.generated_at),
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      // Add result if exists
      if (row.result_id) {
        trade.result = {
          id: row.result_id,
          actualEntryPrice: parseFloat(row.actual_entry_price),
          actualExitPrice: row.actual_exit_price ? parseFloat(row.actual_exit_price) : undefined,
          tp1Hit: row.tp1_hit,
          tp1HitAt: row.tp1_hit_at ? new Date(row.tp1_hit_at) : undefined,
          tp1HitPrice: row.tp1_hit_price ? parseFloat(row.tp1_hit_price) : undefined,
          tp2Hit: row.tp2_hit,
          tp2HitAt: row.tp2_hit_at ? new Date(row.tp2_hit_at) : undefined,
          tp2HitPrice: row.tp2_hit_price ? parseFloat(row.tp2_hit_price) : undefined,
          tp3Hit: row.tp3_hit,
          tp3HitAt: row.tp3_hit_at ? new Date(row.tp3_hit_at) : undefined,
          tp3HitPrice: row.tp3_hit_price ? parseFloat(row.tp3_hit_price) : undefined,
          stopLossHit: row.stop_loss_hit,
          stopLossHitAt: row.stop_loss_hit_at ? new Date(row.stop_loss_hit_at) : undefined,
          stopLossHitPrice: row.stop_loss_hit_price ? parseFloat(row.stop_loss_hit_price) : undefined,
          profitLossUsd: row.profit_loss_usd ? parseFloat(row.profit_loss_usd) : undefined,
          profitLossPercentage: row.profit_loss_percentage ? parseFloat(row.profit_loss_percentage) : undefined,
          tradeDurationMinutes: row.trade_duration_minutes,
          tradeSizeUsd: parseFloat(row.trade_size_usd),
          feesUsd: parseFloat(row.fees_usd),
          slippageUsd: parseFloat(row.slippage_usd),
          netProfitLossUsd: row.net_profit_loss_usd ? parseFloat(row.net_profit_loss_usd) : undefined,
          dataSource: row.data_source,
          dataResolution: row.data_resolution,
          dataQualityScore: row.data_quality_score,
          aiAnalysis: row.ai_analysis,
          backtestedAt: new Date(row.backtested_at)
        };
      }
      
      // Add indicators if exists
      if (row.rsi_value !== null) {
        trade.indicators = {
          rsiValue: row.rsi_value ? parseFloat(row.rsi_value) : undefined,
          macdValue: row.macd_value ? parseFloat(row.macd_value) : undefined,
          macdSignal: row.macd_signal ? parseFloat(row.macd_signal) : undefined,
          macdHistogram: row.macd_histogram ? parseFloat(row.macd_histogram) : undefined,
          ema20: row.ema_20 ? parseFloat(row.ema_20) : undefined,
          ema50: row.ema_50 ? parseFloat(row.ema_50) : undefined,
          ema200: row.ema_200 ? parseFloat(row.ema_200) : undefined,
          bollingerUpper: row.bollinger_upper ? parseFloat(row.bollinger_upper) : undefined,
          bollingerMiddle: row.bollinger_middle ? parseFloat(row.bollinger_middle) : undefined,
          bollingerLower: row.bollinger_lower ? parseFloat(row.bollinger_lower) : undefined,
          atrValue: row.atr_value ? parseFloat(row.atr_value) : undefined,
          volume24h: row.indicator_volume ? parseFloat(row.indicator_volume) : undefined,
          marketCap: row.indicator_market_cap ? parseFloat(row.indicator_market_cap) : undefined
        };
      }
      
      // Add snapshot if exists
      if (row.current_price !== null) {
        trade.snapshot = {
          currentPrice: parseFloat(row.current_price),
          priceChange24h: row.price_change_24h ? parseFloat(row.price_change_24h) : undefined,
          volume24h: row.snapshot_volume ? parseFloat(row.snapshot_volume) : undefined,
          marketCap: row.snapshot_market_cap ? parseFloat(row.snapshot_market_cap) : undefined,
          socialSentimentScore: row.social_sentiment_score,
          whaleActivityCount: row.whale_activity_count,
          fearGreedIndex: row.fear_greed_index,
          snapshotAt: new Date(row.snapshot_at)
        };
      }
      
      return trade;
    });
    
    // Return response
    return res.status(200).json({
      success: true,
      trades,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });
    
  } catch (error) {
    console.error('Fetch trades error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch trades',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export default withAuth(handler);
