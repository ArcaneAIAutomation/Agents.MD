/**
 * Einstein 100000x Trade Generation Engine - Database Operations
 * 
 * Provides database operations for saving approved signals, logging rejections,
 * and handling modifications with transaction support for atomic operations.
 * 
 * Requirements: 11.1, 11.2, 11.3
 */

import { query, queryOne, transaction } from '../../db';
import type { PoolClient } from 'pg';
import type {
  TradeSignal,
  AIAnalysis,
  DatabaseResult,
  ComprehensiveAnalysis
} from '../types';

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Save an approved trade signal to the database
 * 
 * Requirement 11.1: Save approved signals to einstein_trade_signals table
 * Requirement 11.2: Include all analysis data, reasoning, and metadata
 * 
 * @param signal - The approved trade signal
 * @param analysis - The comprehensive AI analysis
 * @param userId - The user who approved the signal
 * @returns Database operation result with trade ID
 */
export async function saveApprovedSignal(
  signal: TradeSignal,
  analysis: ComprehensiveAnalysis,
  userId: string
): Promise<DatabaseResult> {
  try {
    // Use transaction for atomic operation
    const result = await transaction(async (client: PoolClient) => {
      // Insert trade signal
      const insertResult = await client.query(
        `INSERT INTO einstein_trade_signals (
          id, symbol, position_type, entry, stop_loss,
          tp1_price, tp1_allocation, tp2_price, tp2_allocation, tp3_price, tp3_allocation,
          confidence_overall, confidence_technical, confidence_sentiment, 
          confidence_onchain, confidence_risk,
          risk_reward, position_size, max_loss, timeframe,
          status, created_at, approved_at, approved_by,
          data_quality_overall, data_quality_market, data_quality_sentiment, 
          data_quality_onchain, data_quality_technical,
          data_quality_sources_successful, data_quality_sources_failed,
          analysis_data
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30, $31,
          $32
        ) RETURNING id`,
        [
          signal.id,
          signal.symbol,
          signal.positionType,
          signal.entry,
          signal.stopLoss,
          signal.takeProfits.tp1.price,
          signal.takeProfits.tp1.allocation,
          signal.takeProfits.tp2.price,
          signal.takeProfits.tp2.allocation,
          signal.takeProfits.tp3.price,
          signal.takeProfits.tp3.allocation,
          signal.confidence.overall,
          signal.confidence.technical,
          signal.confidence.sentiment,
          signal.confidence.onChain,
          signal.confidence.risk,
          signal.riskReward,
          signal.positionSize,
          signal.maxLoss,
          signal.timeframe,
          'APPROVED', // Status
          signal.createdAt,
          new Date().toISOString(), // Approved at
          userId,
          signal.dataQuality.overall,
          signal.dataQuality.market,
          signal.dataQuality.sentiment,
          signal.dataQuality.onChain,
          signal.dataQuality.technical,
          JSON.stringify(signal.dataQuality.sources.successful),
          JSON.stringify(signal.dataQuality.sources.failed),
          JSON.stringify(analysis)
        ]
      );

      // Log approval event
      await client.query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, timestamp
        ) VALUES ($1, $2, $3, $4)`,
        [signal.id, userId, 'APPROVED', new Date().toISOString()]
      );

      return insertResult.rows[0].id;
    });

    return {
      success: true,
      id: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error saving approved signal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Log a rejected trade signal
 * 
 * Requirement 11.2: Log rejection with reason for audit purposes
 * 
 * @param signalId - The ID of the rejected signal
 * @param userId - The user who rejected the signal
 * @param reason - The reason for rejection
 * @returns Database operation result
 */
export async function logRejection(
  signalId: string,
  userId: string,
  reason: string
): Promise<DatabaseResult> {
  try {
    // Use transaction for atomic operation
    await transaction(async (client: PoolClient) => {
      // Log rejection event with reason
      await client.query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, reason, timestamp
        ) VALUES ($1, $2, $3, $4, $5)`,
        [signalId, userId, 'REJECTED', reason, new Date().toISOString()]
      );

      // Optionally store rejected signal for analysis (with REJECTED status)
      // This helps track what signals were rejected and why
      await client.query(
        `INSERT INTO einstein_rejected_signals (
          signal_id, user_id, reason, rejected_at
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (signal_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          reason = EXCLUDED.reason,
          rejected_at = EXCLUDED.rejected_at`,
        [signalId, userId, reason, new Date().toISOString()]
      );
    });

    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error logging rejection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Save a modified trade signal to the database
 * 
 * Requirement 11.3: Save modified signals with modification tracking
 * 
 * @param originalSignalId - The ID of the original signal
 * @param modifiedSignal - The modified trade signal
 * @param analysis - The comprehensive AI analysis
 * @param userId - The user who modified the signal
 * @param modifications - The specific modifications made
 * @returns Database operation result with new trade ID
 */
export async function saveModifiedSignal(
  originalSignalId: string,
  modifiedSignal: TradeSignal,
  analysis: ComprehensiveAnalysis,
  userId: string,
  modifications: Partial<TradeSignal>
): Promise<DatabaseResult> {
  try {
    // Use transaction for atomic operation
    const result = await transaction(async (client: PoolClient) => {
      // Insert modified trade signal
      const insertResult = await client.query(
        `INSERT INTO einstein_trade_signals (
          id, symbol, position_type, entry, stop_loss,
          tp1_price, tp1_allocation, tp2_price, tp2_allocation, tp3_price, tp3_allocation,
          confidence_overall, confidence_technical, confidence_sentiment, 
          confidence_onchain, confidence_risk,
          risk_reward, position_size, max_loss, timeframe,
          status, created_at, approved_at, approved_by,
          modified_at, modified_by, original_signal_id,
          data_quality_overall, data_quality_market, data_quality_sentiment, 
          data_quality_onchain, data_quality_technical,
          data_quality_sources_successful, data_quality_sources_failed,
          analysis_data
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27,
          $28, $29, $30, $31, $32,
          $33, $34,
          $35
        ) RETURNING id`,
        [
          modifiedSignal.id,
          modifiedSignal.symbol,
          modifiedSignal.positionType,
          modifiedSignal.entry,
          modifiedSignal.stopLoss,
          modifiedSignal.takeProfits.tp1.price,
          modifiedSignal.takeProfits.tp1.allocation,
          modifiedSignal.takeProfits.tp2.price,
          modifiedSignal.takeProfits.tp2.allocation,
          modifiedSignal.takeProfits.tp3.price,
          modifiedSignal.takeProfits.tp3.allocation,
          modifiedSignal.confidence.overall,
          modifiedSignal.confidence.technical,
          modifiedSignal.confidence.sentiment,
          modifiedSignal.confidence.onChain,
          modifiedSignal.confidence.risk,
          modifiedSignal.riskReward,
          modifiedSignal.positionSize,
          modifiedSignal.maxLoss,
          modifiedSignal.timeframe,
          'APPROVED', // Status
          modifiedSignal.createdAt,
          new Date().toISOString(), // Approved at
          userId,
          new Date().toISOString(), // Modified at
          userId, // Modified by
          originalSignalId, // Original signal ID
          modifiedSignal.dataQuality.overall,
          modifiedSignal.dataQuality.market,
          modifiedSignal.dataQuality.sentiment,
          modifiedSignal.dataQuality.onChain,
          modifiedSignal.dataQuality.technical,
          JSON.stringify(modifiedSignal.dataQuality.sources.successful),
          JSON.stringify(modifiedSignal.dataQuality.sources.failed),
          JSON.stringify(analysis)
        ]
      );

      // Log modification event with details
      await client.query(
        `INSERT INTO einstein_approval_logs (
          signal_id, user_id, action, modifications, timestamp
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          modifiedSignal.id,
          userId,
          'MODIFIED',
          JSON.stringify(modifications),
          new Date().toISOString()
        ]
      );

      // Store modification history for audit trail
      await client.query(
        `INSERT INTO einstein_modification_history (
          original_signal_id, modified_signal_id, user_id, 
          modifications, modified_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          originalSignalId,
          modifiedSignal.id,
          userId,
          JSON.stringify(modifications),
          new Date().toISOString()
        ]
      );

      return insertResult.rows[0].id;
    });

    return {
      success: true,
      id: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error saving modified signal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error',
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// Query Helper Functions
// ============================================================================

/**
 * Get a trade signal by ID
 * 
 * @param signalId - The signal ID to retrieve
 * @returns The trade signal or null if not found
 */
export async function getTradeSignalById(
  signalId: string
): Promise<TradeSignal | null> {
  try {
    const result = await queryOne<any>(
      `SELECT * FROM einstein_trade_signals WHERE id = $1`,
      [signalId]
    );

    if (!result) {
      return null;
    }

    // Transform database row to TradeSignal type
    return {
      id: result.id,
      symbol: result.symbol,
      positionType: result.position_type,
      entry: result.entry,
      stopLoss: result.stop_loss,
      takeProfits: {
        tp1: { price: result.tp1_price, allocation: result.tp1_allocation },
        tp2: { price: result.tp2_price, allocation: result.tp2_allocation },
        tp3: { price: result.tp3_price, allocation: result.tp3_allocation }
      },
      confidence: {
        overall: result.confidence_overall,
        technical: result.confidence_technical,
        sentiment: result.confidence_sentiment,
        onChain: result.confidence_onchain,
        risk: result.confidence_risk
      },
      riskReward: result.risk_reward,
      positionSize: result.position_size,
      maxLoss: result.max_loss,
      timeframe: result.timeframe,
      createdAt: result.created_at,
      status: result.status,
      dataQuality: {
        overall: result.data_quality_overall,
        market: result.data_quality_market,
        sentiment: result.data_quality_sentiment,
        onChain: result.data_quality_onchain,
        technical: result.data_quality_technical,
        sources: {
          successful: JSON.parse(result.data_quality_sources_successful || '[]'),
          failed: JSON.parse(result.data_quality_sources_failed || '[]')
        }
      },
      analysis: JSON.parse(result.analysis_data || '{}')
    };
  } catch (error) {
    console.error('Error getting trade signal:', error);
    return null;
  }
}

/**
 * Get all trade signals for a user
 * 
 * @param userId - The user ID
 * @param limit - Maximum number of signals to return
 * @param offset - Offset for pagination
 * @returns Array of trade signals
 */
export async function getTradeSignalsByUser(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<TradeSignal[]> {
  try {
    const results = await query<any>(
      `SELECT * FROM einstein_trade_signals 
       WHERE approved_by = $1 OR modified_by = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return results.rows.map(row => ({
      id: row.id,
      symbol: row.symbol,
      positionType: row.position_type,
      entry: row.entry,
      stopLoss: row.stop_loss,
      takeProfits: {
        tp1: { price: row.tp1_price, allocation: row.tp1_allocation },
        tp2: { price: row.tp2_price, allocation: row.tp2_allocation },
        tp3: { price: row.tp3_price, allocation: row.tp3_allocation }
      },
      confidence: {
        overall: row.confidence_overall,
        technical: row.confidence_technical,
        sentiment: row.confidence_sentiment,
        onChain: row.confidence_onchain,
        risk: row.confidence_risk
      },
      riskReward: row.risk_reward,
      positionSize: row.position_size,
      maxLoss: row.max_loss,
      timeframe: row.timeframe,
      createdAt: row.created_at,
      status: row.status,
      dataQuality: {
        overall: row.data_quality_overall,
        market: row.data_quality_market,
        sentiment: row.data_quality_sentiment,
        onChain: row.data_quality_onchain,
        technical: row.data_quality_technical,
        sources: {
          successful: JSON.parse(row.data_quality_sources_successful || '[]'),
          failed: JSON.parse(row.data_quality_sources_failed || '[]')
        }
      },
      analysis: JSON.parse(row.analysis_data || '{}')
    }));
  } catch (error) {
    console.error('Error getting trade signals by user:', error);
    return [];
  }
}

/**
 * Get approval logs for a signal
 * 
 * @param signalId - The signal ID
 * @returns Array of approval log entries
 */
export async function getApprovalLogs(signalId: string): Promise<any[]> {
  try {
    const results = await query<any>(
      `SELECT * FROM einstein_approval_logs 
       WHERE signal_id = $1
       ORDER BY timestamp DESC`,
      [signalId]
    );

    return results.rows;
  } catch (error) {
    console.error('Error getting approval logs:', error);
    return [];
  }
}

/**
 * Update trade signal status
 * 
 * @param signalId - The signal ID
 * @param status - The new status
 * @returns Database operation result
 */
export async function updateTradeSignalStatus(
  signalId: string,
  status: TradeSignal['status']
): Promise<DatabaseResult> {
  try {
    await query(
      `UPDATE einstein_trade_signals 
       SET status = $1, updated_at = $2
       WHERE id = $3`,
      [status, new Date().toISOString(), signalId]
    );

    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating trade signal status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error',
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  saveApprovedSignal,
  logRejection,
  saveModifiedSignal,
  getTradeSignalById,
  getTradeSignalsByUser,
  getApprovalLogs,
  updateTradeSignalStatus
};
