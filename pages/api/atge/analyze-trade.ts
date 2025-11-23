/**
 * ATGE Trade Analysis API Route
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Fetches complete trade data and prepares analysis context for GPT-5.1.
 * This endpoint retrieves all relevant data for a specific trade including
 * entry/exit prices, technical indicators, market snapshot, and actual outcome.
 * 
 * Requirements: 3.1
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { query } from '../../../lib/db';

interface TradeAnalysisContext {
  // Trade Signal Information
  tradeSignal: {
    id: string;
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
  };
  
  // Actual Trade Outcome
  outcome?: {
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
    dataQualityScore: number;
  };
  
  // Technical Indicators at Trade Generation
  technicalIndicators?: {
    rsiValue: number;
    rsiSignal: 'overbought' | 'oversold' | 'neutral';
    macdValue: number;
    macdSignal: number;
    macdHistogram: number;
    ema20: number;
    ema50: number;
    ema200: number;
    bollingerUpper: number;
    bollingerMiddle: number;
    bollingerLower: number;
    atrValue: number;
    volume24h: number;
  };
  
  // Market Snapshot at Trade Generation
  marketSnapshot?: {
    currentPrice: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    high24h: number;
    low24h: number;
    socialSentimentScore?: number;
    whaleActivityCount?: number;
    fearGreedIndex?: number;
    snapshotAt: Date;
  };
  
  // Analysis Metadata
  metadata: {
    tradeCompleted: boolean;
    tradeExpired: boolean;
    hasOutcome: boolean;
    hasTechnicalIndicators: boolean;
    hasMarketSnapshot: boolean;
    readyForAnalysis: boolean;
  };
}

/**
 * Calculate RSI signal based on value
 */
function calculateRSISignal(rsiValue: number): 'overbought' | 'oversold' | 'neutral' {
  if (rsiValue > 70) return 'overbought';
  if (rsiValue < 30) return 'oversold';
  return 'neutral';
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
    
    // Get tradeId from query parameters
    const { tradeId } = req.query;
    
    if (!tradeId || typeof tradeId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Trade ID is required'
      });
    }
    
    // Fetch complete trade data with all related information
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
        ts.generated_at, ts.expires_at,
        
        -- Trade Result
        tr.id as result_id,
        tr.actual_entry_price, tr.actual_exit_price,
        tr.tp1_hit, tr.tp1_hit_at, tr.tp1_hit_price,
        tr.tp2_hit, tr.tp2_hit_at, tr.tp2_hit_price,
        tr.tp3_hit, tr.tp3_hit_at, tr.tp3_hit_price,
        tr.stop_loss_hit, tr.stop_loss_hit_at, tr.stop_loss_hit_price,
        tr.profit_loss_usd, tr.profit_loss_percentage, tr.trade_duration_minutes,
        tr.trade_size_usd, tr.fees_usd, tr.slippage_usd, tr.net_profit_loss_usd,
        tr.data_source, tr.data_quality_score,
        
        -- Technical Indicators
        ti.rsi_value, ti.macd_value, ti.macd_signal, ti.macd_histogram,
        ti.ema_20, ti.ema_50, ti.ema_200,
        ti.bollinger_upper, ti.bollinger_middle, ti.bollinger_lower,
        ti.atr_value, ti.volume_24h as indicator_volume,
        
        -- Market Snapshot
        ms.current_price, ms.price_change_24h, 
        ms.volume_24h as snapshot_volume, ms.market_cap,
        ms.high_24h, ms.low_24h,
        ms.social_sentiment_score, ms.whale_activity_count, ms.fear_greed_index,
        ms.snapshot_at
        
      FROM trade_signals ts
      LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
      LEFT JOIN trade_technical_indicators ti ON ts.id = ti.trade_signal_id
      LEFT JOIN trade_market_snapshot ms ON ts.id = ms.trade_signal_id
      WHERE ts.id = $1 AND ts.user_id = $2
    `, [tradeId, userId]);
    
    // Check if trade exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found or access denied'
      });
    }
    
    const row = result.rows[0];
    
    // Build analysis context
    const context: TradeAnalysisContext = {
      tradeSignal: {
        id: row.id,
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
        expiresAt: new Date(row.expires_at)
      },
      metadata: {
        tradeCompleted: false,
        tradeExpired: false,
        hasOutcome: false,
        hasTechnicalIndicators: false,
        hasMarketSnapshot: false,
        readyForAnalysis: false
      }
    };
    
    // Add outcome if exists
    if (row.result_id) {
      context.outcome = {
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
        dataQualityScore: row.data_quality_score
      };
      
      context.metadata.hasOutcome = true;
      context.metadata.tradeCompleted = row.tp1_hit || row.tp2_hit || row.tp3_hit || row.stop_loss_hit;
    }
    
    // Add technical indicators if exists
    if (row.rsi_value !== null) {
      const rsiValue = parseFloat(row.rsi_value);
      
      context.technicalIndicators = {
        rsiValue: rsiValue,
        rsiSignal: calculateRSISignal(rsiValue),
        macdValue: row.macd_value ? parseFloat(row.macd_value) : 0,
        macdSignal: row.macd_signal ? parseFloat(row.macd_signal) : 0,
        macdHistogram: row.macd_histogram ? parseFloat(row.macd_histogram) : 0,
        ema20: row.ema_20 ? parseFloat(row.ema_20) : 0,
        ema50: row.ema_50 ? parseFloat(row.ema_50) : 0,
        ema200: row.ema_200 ? parseFloat(row.ema_200) : 0,
        bollingerUpper: row.bollinger_upper ? parseFloat(row.bollinger_upper) : 0,
        bollingerMiddle: row.bollinger_middle ? parseFloat(row.bollinger_middle) : 0,
        bollingerLower: row.bollinger_lower ? parseFloat(row.bollinger_lower) : 0,
        atrValue: row.atr_value ? parseFloat(row.atr_value) : 0,
        volume24h: row.indicator_volume ? parseFloat(row.indicator_volume) : 0
      };
      
      context.metadata.hasTechnicalIndicators = true;
    }
    
    // Add market snapshot if exists
    if (row.current_price !== null) {
      context.marketSnapshot = {
        currentPrice: parseFloat(row.current_price),
        priceChange24h: row.price_change_24h ? parseFloat(row.price_change_24h) : 0,
        volume24h: row.snapshot_volume ? parseFloat(row.snapshot_volume) : 0,
        marketCap: row.market_cap ? parseFloat(row.market_cap) : 0,
        high24h: row.high_24h ? parseFloat(row.high_24h) : parseFloat(row.current_price),
        low24h: row.low_24h ? parseFloat(row.low_24h) : parseFloat(row.current_price),
        socialSentimentScore: row.social_sentiment_score ? parseFloat(row.social_sentiment_score) : undefined,
        whaleActivityCount: row.whale_activity_count,
        fearGreedIndex: row.fear_greed_index,
        snapshotAt: new Date(row.snapshot_at)
      };
      
      context.metadata.hasMarketSnapshot = true;
    }
    
    // Check if trade is expired
    context.metadata.tradeExpired = new Date() > new Date(row.expires_at);
    
    // Determine if ready for analysis
    // Trade is ready for analysis if it's completed (hit any target) or expired
    context.metadata.readyForAnalysis = 
      context.metadata.tradeCompleted || 
      context.metadata.tradeExpired;
    
    // Return analysis context
    return res.status(200).json({
      success: true,
      context,
      message: context.metadata.readyForAnalysis 
        ? 'Trade data ready for analysis'
        : 'Trade is still active and not ready for analysis'
    });
    
  } catch (error) {
    console.error('Analyze trade error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch trade analysis context',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export default withAuth(handler);
