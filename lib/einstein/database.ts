/**
 * Einstein Trade Engine - Database Utilities
 * Provides type-safe database operations for Einstein tables
 */

import { query, queryOne, queryMany, transaction } from '../db';
import type { PoolClient } from 'pg';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Einstein Trade Signal database model
 */
export interface EinsteinTradeSignal {
  id: string;
  user_id: string;
  symbol: string;
  position_type: 'LONG' | 'SHORT' | 'NO_TRADE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';
  entry_price: number;
  stop_loss: number;
  tp1_price: number;
  tp1_allocation: number;
  tp2_price: number;
  tp2_allocation: number;
  tp3_price: number;
  tp3_allocation: number;
  confidence_overall: number;
  confidence_technical: number;
  confidence_sentiment: number;
  confidence_onchain: number;
  confidence_risk: number;
  risk_reward_ratio: number;
  position_size: number;
  max_loss: number;
  timeframe: string;
  timeframe_alignment: number;
  timeframe_15m?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe_1h?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe_4h?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe_1d?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  data_quality_overall: number;
  data_quality_market?: number;
  data_quality_sentiment?: number;
  data_quality_onchain?: number;
  data_quality_technical?: number;
  ai_reasoning_technical?: string;
  ai_reasoning_sentiment?: string;
  ai_reasoning_onchain?: string;
  ai_reasoning_risk?: string;
  ai_reasoning_overall: string;
  ai_model_version: string;
  ai_reasoning_effort: 'low' | 'medium' | 'high';
  executed_at?: Date;
  entry_price_actual?: number;
  current_price?: number;
  exit_prices?: any;
  percent_filled?: number;
  unrealized_pl?: number;
  realized_pl?: number;
  targets_hit?: any;
  data_source_health?: any;
  created_at: Date;
  updated_at: Date;
  last_refreshed?: Date;
  approved_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
}

/**
 * Einstein Analysis Cache database model
 */
export interface EinsteinAnalysisCache {
  id: string;
  symbol: string;
  analysis_type: string;
  data: any;
  data_quality: number;
  ttl: number;
  expires_at: Date;
  sources?: string[];
  successful_sources?: string[];
  failed_sources?: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Einstein Performance database model
 */
export interface EinsteinPerformance {
  id: string;
  trade_signal_id: string;
  entry_price_predicted: number;
  entry_price_actual?: number;
  entry_slippage?: number;
  exit_price_predicted?: number;
  exit_price_actual?: number;
  exit_slippage?: number;
  tp1_hit: boolean;
  tp1_hit_at?: Date;
  tp1_hit_price?: number;
  tp2_hit: boolean;
  tp2_hit_at?: Date;
  tp2_hit_price?: number;
  tp3_hit: boolean;
  tp3_hit_at?: Date;
  tp3_hit_price?: number;
  stop_loss_hit: boolean;
  stop_loss_hit_at?: Date;
  stop_loss_hit_price?: number;
  profit_loss_usd?: number;
  profit_loss_percentage?: number;
  profit_loss_predicted?: number;
  profit_loss_accuracy?: number;
  trade_duration_minutes?: number;
  trade_duration_predicted?: number;
  win_rate?: number;
  average_profit?: number;
  average_loss?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  confidence_predicted?: number;
  confidence_actual?: number;
  confidence_accuracy?: number;
  learning_insights?: any;
  adjustment_recommendations?: any;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// ============================================================================
// TRADE SIGNAL OPERATIONS
// ============================================================================

/**
 * Create a new Einstein trade signal
 */
export async function createTradeSignal(
  signal: Partial<EinsteinTradeSignal>
): Promise<EinsteinTradeSignal> {
  const result = await queryOne<EinsteinTradeSignal>(
    `INSERT INTO einstein_trade_signals (
      user_id, symbol, position_type, status,
      entry_price, stop_loss,
      tp1_price, tp1_allocation, tp2_price, tp2_allocation, tp3_price, tp3_allocation,
      confidence_overall, confidence_technical, confidence_sentiment, confidence_onchain, confidence_risk,
      risk_reward_ratio, position_size, max_loss,
      timeframe, timeframe_alignment,
      timeframe_15m, timeframe_1h, timeframe_4h, timeframe_1d,
      data_quality_overall, data_quality_market, data_quality_sentiment, data_quality_onchain, data_quality_technical,
      ai_reasoning_technical, ai_reasoning_sentiment, ai_reasoning_onchain, ai_reasoning_risk, ai_reasoning_overall,
      ai_model_version, ai_reasoning_effort
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
      $32, $33, $34, $35, $36, $37, $38
    ) RETURNING *`,
    [
      signal.user_id, signal.symbol, signal.position_type, signal.status || 'PENDING',
      signal.entry_price, signal.stop_loss,
      signal.tp1_price, signal.tp1_allocation || 50, signal.tp2_price, signal.tp2_allocation || 30, signal.tp3_price, signal.tp3_allocation || 20,
      signal.confidence_overall, signal.confidence_technical, signal.confidence_sentiment, signal.confidence_onchain, signal.confidence_risk,
      signal.risk_reward_ratio, signal.position_size, signal.max_loss,
      signal.timeframe, signal.timeframe_alignment,
      signal.timeframe_15m, signal.timeframe_1h, signal.timeframe_4h, signal.timeframe_1d,
      signal.data_quality_overall, signal.data_quality_market, signal.data_quality_sentiment, signal.data_quality_onchain, signal.data_quality_technical,
      signal.ai_reasoning_technical, signal.ai_reasoning_sentiment, signal.ai_reasoning_onchain, signal.ai_reasoning_risk, signal.ai_reasoning_overall,
      signal.ai_model_version || 'gpt-5.1', signal.ai_reasoning_effort || 'medium'
    ]
  );
  
  if (!result) {
    throw new Error('Failed to create trade signal');
  }
  
  return result;
}

/**
 * Get trade signal by ID
 */
export async function getTradeSignalById(id: string): Promise<EinsteinTradeSignal | null> {
  return queryOne<EinsteinTradeSignal>(
    'SELECT * FROM einstein_trade_signals WHERE id = $1',
    [id]
  );
}

/**
 * Get trade signals by user ID
 */
export async function getTradeSignalsByUserId(
  userId: string,
  limit: number = 50
): Promise<EinsteinTradeSignal[]> {
  return queryMany<EinsteinTradeSignal>(
    'SELECT * FROM einstein_trade_signals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
}

/**
 * Update trade signal status
 */
export async function updateTradeSignalStatus(
  id: string,
  status: EinsteinTradeSignal['status'],
  additionalData?: Partial<EinsteinTradeSignal>
): Promise<EinsteinTradeSignal | null> {
  const fields = ['status = $2'];
  const values: any[] = [id, status];
  let paramIndex = 3;
  
  if (additionalData?.approved_at) {
    fields.push(`approved_at = $${paramIndex++}`);
    values.push(additionalData.approved_at);
  }
  
  if (additionalData?.rejected_at) {
    fields.push(`rejected_at = $${paramIndex++}`);
    values.push(additionalData.rejected_at);
  }
  
  if (additionalData?.rejection_reason) {
    fields.push(`rejection_reason = $${paramIndex++}`);
    values.push(additionalData.rejection_reason);
  }
  
  return queryOne<EinsteinTradeSignal>(
    `UPDATE einstein_trade_signals SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
}

// ============================================================================
// ANALYSIS CACHE OPERATIONS
// ============================================================================

/**
 * Get cached analysis
 */
export async function getCachedAnalysis(
  symbol: string,
  analysisType: string
): Promise<EinsteinAnalysisCache | null> {
  return queryOne<EinsteinAnalysisCache>(
    `SELECT * FROM einstein_analysis_cache 
     WHERE symbol = $1 AND analysis_type = $2 AND expires_at > NOW()`,
    [symbol, analysisType]
  );
}

/**
 * Set cached analysis
 */
export async function setCachedAnalysis(
  symbol: string,
  analysisType: string,
  data: any,
  dataQuality: number,
  ttl: number = 300
): Promise<EinsteinAnalysisCache> {
  const result = await queryOne<EinsteinAnalysisCache>(
    `INSERT INTO einstein_analysis_cache (
      symbol, analysis_type, data, data_quality, ttl, expires_at
    ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 second' * $5)
    ON CONFLICT (symbol, analysis_type)
    DO UPDATE SET
      data = EXCLUDED.data,
      data_quality = EXCLUDED.data_quality,
      ttl = EXCLUDED.ttl,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    RETURNING *`,
    [symbol, analysisType, JSON.stringify(data), dataQuality, ttl]
  );
  
  if (!result) {
    throw new Error('Failed to cache analysis');
  }
  
  return result;
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const result = await query(
    'DELETE FROM einstein_analysis_cache WHERE expires_at <= NOW()'
  );
  return result.rowCount || 0;
}

// ============================================================================
// PERFORMANCE OPERATIONS
// ============================================================================

/**
 * Create performance record
 */
export async function createPerformanceRecord(
  performance: Partial<EinsteinPerformance>
): Promise<EinsteinPerformance> {
  const result = await queryOne<EinsteinPerformance>(
    `INSERT INTO einstein_performance (
      trade_signal_id, entry_price_predicted, entry_price_actual,
      profit_loss_usd, profit_loss_percentage, win_rate
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      performance.trade_signal_id,
      performance.entry_price_predicted,
      performance.entry_price_actual,
      performance.profit_loss_usd,
      performance.profit_loss_percentage,
      performance.win_rate
    ]
  );
  
  if (!result) {
    throw new Error('Failed to create performance record');
  }
  
  return result;
}

/**
 * Get performance by trade signal ID
 */
export async function getPerformanceByTradeSignalId(
  tradeSignalId: string
): Promise<EinsteinPerformance | null> {
  return queryOne<EinsteinPerformance>(
    'SELECT * FROM einstein_performance WHERE trade_signal_id = $1',
    [tradeSignalId]
  );
}

/**
 * Update performance metrics
 */
export async function updatePerformanceMetrics(
  tradeSignalId: string,
  metrics: Partial<EinsteinPerformance>
): Promise<EinsteinPerformance | null> {
  const fields: string[] = [];
  const values: any[] = [tradeSignalId];
  let paramIndex = 2;
  
  Object.entries(metrics).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });
  
  if (fields.length === 0) {
    return getPerformanceByTradeSignalId(tradeSignalId);
  }
  
  return queryOne<EinsteinPerformance>(
    `UPDATE einstein_performance SET ${fields.join(', ')} WHERE trade_signal_id = $1 RETURNING *`,
    values
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Trade Signals
  createTradeSignal,
  getTradeSignalById,
  getTradeSignalsByUserId,
  updateTradeSignalStatus,
  
  // Analysis Cache
  getCachedAnalysis,
  setCachedAnalysis,
  clearExpiredCache,
  
  // Performance
  createPerformanceRecord,
  getPerformanceByTradeSignalId,
  updatePerformanceMetrics,
};
