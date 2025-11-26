/**
 * Einstein 100000x Trade Generation Engine - Trade Execution Tracker
 * 
 * This module tracks trade execution status and calculates real-time P/L.
 * It monitors whether trades have been executed, calculates unrealized and
 * realized profit/loss, and detects when take-profit or stop-loss targets are hit.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { query } from '../../db';
import {
  TradeSignal,
  TradeStatus,
  ExitPrice,
  PLCalculation,
  TargetStatus,
  TradeExecutionStatus,
  PositionType
} from '../types';

/**
 * Trade Execution Tracker
 * 
 * Tracks trade execution status and calculates real-time P/L for Einstein trade signals.
 */
export class TradeExecutionTracker {
  /**
   * Update the execution status of a trade
   * 
   * @param tradeId - Unique identifier of the trade signal
   * @param status - New execution status to set
   * @throws Error if database update fails
   * 
   * Requirements: 14.1, 14.2
   */
  async updateTradeStatus(
    tradeId: string,
    status: TradeStatus
  ): Promise<void> {
    try {
      // Validate status transition
      this.validateStatusTransition(status);

      // Prepare execution status update
      const executionStatus: Partial<TradeExecutionStatus> = {
        executedAt: status === 'EXECUTED' ? new Date().toISOString() : undefined
      };

      // Update trade status in database
      await query(
        `UPDATE einstein_trade_signals 
         SET status = $1, 
             execution_status = COALESCE(execution_status, '{}'::jsonb) || $2::jsonb,
             updated_at = NOW()
         WHERE id = $3`,
        [status, JSON.stringify(executionStatus), tradeId]
      );

      console.log(`✅ Trade ${tradeId} status updated to ${status}`);
    } catch (error) {
      console.error('❌ Failed to update trade status:', error);
      throw new Error(`Failed to update trade status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate unrealized P/L for an open trade
   * 
   * Uses current market price to calculate profit/loss for executed trades
   * that haven't been closed yet.
   * 
   * @param trade - Trade signal with execution information
   * @param currentPrice - Current market price
   * @returns P/L calculation with profit/loss amount and percentage
   * 
   * Requirements: 14.3
   */
  calculateUnrealizedPL(
    trade: TradeSignal,
    currentPrice: number
  ): PLCalculation {
    // Validate inputs
    if (!trade.executionStatus?.entryPrice) {
      throw new Error('Trade must have an entry price to calculate unrealized P/L');
    }

    if (currentPrice <= 0) {
      throw new Error('Current price must be greater than zero');
    }

    const entryPrice = trade.executionStatus.entryPrice;
    const positionSize = trade.positionSize;

    // Calculate P/L based on position type
    let profitLoss: number;
    let profitLossPercent: number;

    if (trade.positionType === 'LONG') {
      // LONG: Profit when price goes up
      profitLoss = (currentPrice - entryPrice) * positionSize;
      profitLossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    } else if (trade.positionType === 'SHORT') {
      // SHORT: Profit when price goes down
      profitLoss = (entryPrice - currentPrice) * positionSize;
      profitLossPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
    } else {
      throw new Error('Invalid position type for P/L calculation');
    }

    const isProfit = profitLoss > 0;

    return {
      profitLoss,
      profitLossPercent,
      isProfit,
      color: isProfit ? 'green' : 'red',
      icon: isProfit ? 'up' : 'down'
    };
  }

  /**
   * Calculate realized P/L for a closed trade
   * 
   * Calculates final profit/loss based on actual exit prices for closed positions.
   * Handles partial closes with multiple exit prices.
   * 
   * @param trade - Trade signal with execution information
   * @param exitPrices - Array of exit prices with percentages
   * @returns P/L calculation with final profit/loss amount and percentage
   * 
   * Requirements: 14.3, 14.5
   */
  calculateRealizedPL(
    trade: TradeSignal,
    exitPrices: ExitPrice[]
  ): PLCalculation {
    // Validate inputs
    if (!trade.executionStatus?.entryPrice) {
      throw new Error('Trade must have an entry price to calculate realized P/L');
    }

    if (!exitPrices || exitPrices.length === 0) {
      throw new Error('Exit prices are required to calculate realized P/L');
    }

    const entryPrice = trade.executionStatus.entryPrice;
    const positionSize = trade.positionSize;

    // Calculate weighted average exit price based on percentages
    let totalProfitLoss = 0;
    let totalPercentage = 0;

    for (const exit of exitPrices) {
      const exitPercentage = exit.percentage / 100;
      const exitSize = positionSize * exitPercentage;

      let exitPL: number;
      if (trade.positionType === 'LONG') {
        exitPL = (exit.price - entryPrice) * exitSize;
      } else if (trade.positionType === 'SHORT') {
        exitPL = (entryPrice - exit.price) * exitSize;
      } else {
        throw new Error('Invalid position type for P/L calculation');
      }

      totalProfitLoss += exitPL;
      totalPercentage += exit.percentage;
    }

    // Validate that percentages add up correctly
    if (Math.abs(totalPercentage - 100) > 0.01) {
      console.warn(`⚠️ Exit percentages sum to ${totalPercentage}%, expected 100%`);
    }

    // Calculate percentage return
    const profitLossPercent = (totalProfitLoss / (entryPrice * positionSize)) * 100;
    const isProfit = totalProfitLoss > 0;

    return {
      profitLoss: totalProfitLoss,
      profitLossPercent,
      isProfit,
      color: isProfit ? 'green' : 'red',
      icon: isProfit ? 'up' : 'down'
    };
  }

  /**
   * Check if any take-profit or stop-loss targets have been hit
   * 
   * Monitors current price against trade targets and determines if user
   * should be notified to update trade status.
   * 
   * @param trade - Trade signal with target prices
   * @param currentPrice - Current market price
   * @returns Target status with hit flags and notification message
   * 
   * Requirements: 14.4, 16.4
   */
  checkTargetsHit(
    trade: TradeSignal,
    currentPrice: number
  ): TargetStatus {
    // Validate inputs
    if (currentPrice <= 0) {
      throw new Error('Current price must be greater than zero');
    }

    const { positionType, takeProfits, stopLoss } = trade;

    // Initialize target status
    const status: TargetStatus = {
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
      stopLossHit: false,
      suggestUpdate: false,
      message: undefined
    };

    // Check targets based on position type
    if (positionType === 'LONG') {
      // LONG: TP hit when price goes up, SL hit when price goes down
      status.tp1Hit = currentPrice >= takeProfits.tp1.price;
      status.tp2Hit = currentPrice >= takeProfits.tp2.price;
      status.tp3Hit = currentPrice >= takeProfits.tp3.price;
      status.stopLossHit = currentPrice <= stopLoss;
    } else if (positionType === 'SHORT') {
      // SHORT: TP hit when price goes down, SL hit when price goes up
      status.tp1Hit = currentPrice <= takeProfits.tp1.price;
      status.tp2Hit = currentPrice <= takeProfits.tp2.price;
      status.tp3Hit = currentPrice <= takeProfits.tp3.price;
      status.stopLossHit = currentPrice >= stopLoss;
    }

    // Determine if user should be notified
    const anyTargetHit = status.tp1Hit || status.tp2Hit || status.tp3Hit || status.stopLossHit;
    status.suggestUpdate = anyTargetHit;

    // Generate notification message
    if (status.stopLossHit) {
      status.message = `⚠️ Stop-loss hit at $${currentPrice.toFixed(2)}. Consider closing the position.`;
    } else if (status.tp3Hit) {
      status.message = `🎯 TP3 hit at $${currentPrice.toFixed(2)}! Consider taking profit on remaining position.`;
    } else if (status.tp2Hit) {
      status.message = `🎯 TP2 hit at $${currentPrice.toFixed(2)}! Consider taking partial profit.`;
    } else if (status.tp1Hit) {
      status.message = `🎯 TP1 hit at $${currentPrice.toFixed(2)}! Consider taking partial profit.`;
    }

    return status;
  }

  /**
   * Update trade with current market price and recalculate P/L
   * 
   * Convenience method that updates current price and recalculates unrealized P/L
   * for executed trades.
   * 
   * @param tradeId - Unique identifier of the trade signal
   * @param currentPrice - Current market price
   * @returns Updated P/L calculation
   */
  async updateCurrentPrice(
    tradeId: string,
    currentPrice: number
  ): Promise<PLCalculation | null> {
    try {
      // Fetch trade from database
      const result = await query(
        `SELECT * FROM einstein_trade_signals WHERE id = $1`,
        [tradeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Trade ${tradeId} not found`);
      }

      const trade = this.parseTradeFromDB(result.rows[0]);

      // Only calculate P/L for executed trades
      if (trade.status !== 'EXECUTED' && trade.status !== 'PARTIAL_CLOSE') {
        return null;
      }

      // Calculate unrealized P/L
      const pl = this.calculateUnrealizedPL(trade, currentPrice);

      // Check if targets are hit
      const targetsHit = this.checkTargetsHit(trade, currentPrice);

      // Update execution status in database
      const executionStatus: Partial<TradeExecutionStatus> = {
        currentPrice,
        unrealizedPL: pl,
        targetsHit
      };

      await query(
        `UPDATE einstein_trade_signals 
         SET execution_status = COALESCE(execution_status, '{}'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(executionStatus), tradeId]
      );

      return pl;
    } catch (error) {
      console.error('❌ Failed to update current price:', error);
      throw new Error(`Failed to update current price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark a trade as executed with entry price
   * 
   * @param tradeId - Unique identifier of the trade signal
   * @param entryPrice - Actual entry price of the trade
   */
  async markAsExecuted(
    tradeId: string,
    entryPrice: number
  ): Promise<void> {
    try {
      const executionStatus: Partial<TradeExecutionStatus> = {
        executedAt: new Date().toISOString(),
        entryPrice,
        currentPrice: entryPrice,
        percentFilled: 100
      };

      await query(
        `UPDATE einstein_trade_signals 
         SET status = 'EXECUTED',
             execution_status = COALESCE(execution_status, '{}'::jsonb) || $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(executionStatus), tradeId]
      );

      console.log(`✅ Trade ${tradeId} marked as executed at $${entryPrice}`);
    } catch (error) {
      console.error('❌ Failed to mark trade as executed:', error);
      throw new Error(`Failed to mark trade as executed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record a partial close of a trade
   * 
   * @param tradeId - Unique identifier of the trade signal
   * @param exitPrice - Exit price for this partial close
   * @param percentage - Percentage of position closed
   * @param target - Which target was hit (TP1, TP2, TP3, or STOP_LOSS)
   */
  async recordPartialClose(
    tradeId: string,
    exitPrice: number,
    percentage: number,
    target: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS'
  ): Promise<void> {
    try {
      // Fetch current trade
      const result = await query(
        `SELECT * FROM einstein_trade_signals WHERE id = $1`,
        [tradeId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Trade ${tradeId} not found`);
      }

      const trade = this.parseTradeFromDB(result.rows[0]);

      // Get existing exit prices or initialize empty array
      const exitPrices: ExitPrice[] = trade.executionStatus?.exitPrices || [];

      // Add new exit price
      exitPrices.push({
        target,
        price: exitPrice,
        percentage,
        timestamp: new Date().toISOString()
      });

      // Calculate total percentage filled
      const totalPercentage = exitPrices.reduce((sum, exit) => sum + exit.percentage, 0);

      // Determine new status
      const newStatus: TradeStatus = totalPercentage >= 100 ? 'CLOSED' : 'PARTIAL_CLOSE';

      // Calculate realized P/L if fully closed
      let realizedPL: PLCalculation | undefined;
      if (newStatus === 'CLOSED') {
        realizedPL = this.calculateRealizedPL(trade, exitPrices);
      }

      // Update execution status
      const executionStatus: Partial<TradeExecutionStatus> = {
        exitPrices,
        percentFilled: totalPercentage,
        realizedPL
      };

      await query(
        `UPDATE einstein_trade_signals 
         SET status = $1,
             execution_status = COALESCE(execution_status, '{}'::jsonb) || $2::jsonb,
             updated_at = NOW()
         WHERE id = $3`,
        [newStatus, JSON.stringify(executionStatus), tradeId]
      );

      console.log(`✅ Trade ${tradeId} partial close recorded: ${percentage}% at $${exitPrice}`);
    } catch (error) {
      console.error('❌ Failed to record partial close:', error);
      throw new Error(`Failed to record partial close: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate status transition is valid
   * 
   * @param status - New status to validate
   * @throws Error if status is invalid
   */
  private validateStatusTransition(status: TradeStatus): void {
    const validStatuses: TradeStatus[] = [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'EXECUTED',
      'PARTIAL_CLOSE',
      'CLOSED'
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid trade status: ${status}`);
    }
  }

  /**
   * Parse trade signal from database row
   * 
   * @param row - Database row
   * @returns Parsed trade signal
   */
  private parseTradeFromDB(row: any): TradeSignal {
    return {
      id: row.id,
      symbol: row.symbol,
      positionType: row.position_type,
      entry: parseFloat(row.entry),
      stopLoss: parseFloat(row.stop_loss),
      takeProfits: row.take_profits,
      confidence: row.confidence,
      riskReward: parseFloat(row.risk_reward),
      positionSize: parseFloat(row.position_size),
      maxLoss: parseFloat(row.max_loss),
      timeframe: row.timeframe,
      createdAt: row.created_at,
      lastRefreshed: row.last_refreshed,
      status: row.status,
      executionStatus: row.execution_status,
      dataQuality: row.data_quality,
      analysis: row.analysis,
      dataSourceHealth: row.data_source_health
    };
  }
}

// Export singleton instance
export const tradeExecutionTracker = new TradeExecutionTracker();
