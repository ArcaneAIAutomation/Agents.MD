/**
 * Einstein Trade Engine - Performance Tracker
 * 
 * Tracks trade execution, calculates performance metrics, and stores
 * performance data for learning and improvement.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */

import {
  createPerformanceRecord,
  getPerformanceByTradeSignalId,
  updatePerformanceMetrics,
  getTradeSignalById,
  type EinsteinPerformance,
  type EinsteinTradeSignal,
} from '../database';
import type { ExitPrice } from '../types';
import { learningFeedbackLoop } from './learningFeedback';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Trade execution data for tracking
 */
export interface TradeExecution {
  tradeSignalId: string;
  entryPrice: number;
  entryTimestamp: Date;
  exitPrices?: ExitPrice[];
  currentPrice?: number;
}

/**
 * Performance metrics calculation result
 */
export interface PerformanceMetrics {
  winRate: number;              // Percentage of winning trades (0-100)
  averageProfit: number;        // Average profit in USD
  averageLoss: number;          // Average loss in USD (positive number)
  maxDrawdown: number;          // Maximum drawdown percentage
  sharpeRatio: number;          // Risk-adjusted return metric
  totalTrades: number;          // Total number of completed trades
  winningTrades: number;        // Number of winning trades
  losingTrades: number;         // Number of losing trades
  totalProfitLoss: number;      // Total P/L in USD
}

/**
 * Learning insights from trade outcomes
 */
export interface LearningInsights {
  confidenceAccuracy: number;   // How accurate confidence predictions were
  durationAccuracy: number;     // How accurate duration predictions were
  profitLossAccuracy: number;   // How accurate P/L predictions were
  bestPerformingTimeframes: string[];
  worstPerformingTimeframes: string[];
  recommendations: string[];
}

// ============================================================================
// PERFORMANCE TRACKER CLASS
// ============================================================================

/**
 * PerformanceTracker class for tracking and analyzing trade performance
 * 
 * Requirement 10.1: Track trade execution (entry, exits, P/L)
 * Requirement 10.2: Compare actual outcome to predicted outcome
 * Requirement 10.3: Calculate win rate, average profit, and maximum drawdown
 */
export class PerformanceTracker {
  /**
   * Track a trade execution
   * 
   * Creates or updates a performance record when a trade is executed.
   * 
   * @param execution - Trade execution data
   * @returns Performance record
   */
  async trackExecution(execution: TradeExecution): Promise<EinsteinPerformance> {
    // Get the original trade signal
    const tradeSignal = await getTradeSignalById(execution.tradeSignalId);
    if (!tradeSignal) {
      throw new Error(`Trade signal not found: ${execution.tradeSignalId}`);
    }

    // Check if performance record already exists
    const existing = await getPerformanceByTradeSignalId(execution.tradeSignalId);

    if (existing) {
      // Update existing record
      return this.updateExecution(execution);
    }

    // Create new performance record
    const performance: Partial<EinsteinPerformance> = {
      trade_signal_id: execution.tradeSignalId,
      entry_price_predicted: tradeSignal.entry_price,
      entry_price_actual: execution.entryPrice,
      entry_slippage: this.calculateSlippage(
        tradeSignal.entry_price,
        execution.entryPrice
      ),
      tp1_hit: false,
      tp2_hit: false,
      tp3_hit: false,
      stop_loss_hit: false,
      confidence_predicted: tradeSignal.confidence_overall,
    };

    return createPerformanceRecord(performance);
  }

  /**
   * Update trade execution with exit prices
   * 
   * Updates performance record when positions are closed.
   * Triggers learning feedback loop when trade is completed.
   * 
   * @param execution - Trade execution data with exit prices
   * @returns Updated performance record
   */
  async updateExecution(execution: TradeExecution): Promise<EinsteinPerformance> {
    const tradeSignal = await getTradeSignalById(execution.tradeSignalId);
    if (!tradeSignal) {
      throw new Error(`Trade signal not found: ${execution.tradeSignalId}`);
    }

    const updates: Partial<EinsteinPerformance> = {};

    // Track which targets were hit
    if (execution.exitPrices && execution.exitPrices.length > 0) {
      for (const exit of execution.exitPrices) {
        const hitAt = new Date(exit.timestamp);
        
        switch (exit.target) {
          case 'TP1':
            updates.tp1_hit = true;
            updates.tp1_hit_at = hitAt;
            updates.tp1_hit_price = exit.price;
            break;
          case 'TP2':
            updates.tp2_hit = true;
            updates.tp2_hit_at = hitAt;
            updates.tp2_hit_price = exit.price;
            break;
          case 'TP3':
            updates.tp3_hit = true;
            updates.tp3_hit_at = hitAt;
            updates.tp3_hit_price = exit.price;
            break;
          case 'STOP_LOSS':
            updates.stop_loss_hit = true;
            updates.stop_loss_hit_at = hitAt;
            updates.stop_loss_hit_price = exit.price;
            break;
        }
      }

      // Calculate profit/loss
      const plResult = this.calculateProfitLoss(
        tradeSignal,
        execution.exitPrices
      );
      
      updates.profit_loss_usd = plResult.profitLoss;
      updates.profit_loss_percentage = plResult.profitLossPercent;
      
      // Calculate exit slippage
      const avgExitPrice = this.calculateAverageExitPrice(execution.exitPrices);
      updates.exit_price_actual = avgExitPrice;
      updates.exit_slippage = this.calculateSlippage(
        this.calculatePredictedExitPrice(tradeSignal),
        avgExitPrice
      );

      // Mark as completed if all positions are closed
      const totalPercentage = execution.exitPrices.reduce(
        (sum, exit) => sum + exit.percentage,
        0
      );
      
      if (totalPercentage >= 100) {
        updates.completed_at = new Date();
        
        // Calculate trade duration
        if (tradeSignal.executed_at) {
          const durationMs = updates.completed_at.getTime() - 
            new Date(tradeSignal.executed_at).getTime();
          updates.trade_duration_minutes = Math.round(durationMs / 60000);
        }

        // Trigger learning feedback loop for completed trade
        await this.triggerLearningFeedback(execution.tradeSignalId);
      }
    }

    const result = await updatePerformanceMetrics(
      execution.tradeSignalId,
      updates
    );

    if (!result) {
      throw new Error('Failed to update performance metrics');
    }

    return result;
  }

  /**
   * Trigger learning feedback loop for a completed trade
   * 
   * Requirement 10.5: Compare predicted vs actual outcomes, adjust confidence
   * scoring, and log learning insights
   * 
   * @param tradeSignalId - Trade signal ID
   */
  private async triggerLearningFeedback(tradeSignalId: string): Promise<void> {
    try {
      // Compare predicted vs actual outcomes
      const comparison = await learningFeedbackLoop.compareOutcomes(tradeSignalId);
      
      // Generate learning insights
      const insights = await learningFeedbackLoop.generateLearningInsights();
      
      // Log insights to database
      await learningFeedbackLoop.logLearningInsights(tradeSignalId, insights);
      
      // Get confidence adjustment recommendations
      const adjustments = await learningFeedbackLoop.adjustConfidenceScoring();
      
      // Log adjustments to database
      await learningFeedbackLoop.logConfidenceAdjustments(tradeSignalId, adjustments);
      
      console.log(`Learning feedback loop completed for trade ${tradeSignalId}`);
      console.log(`Deviation score: ${comparison.deviationScore.toFixed(2)}`);
      console.log(`Confidence accuracy: ${comparison.confidenceAccuracy.toFixed(2)}%`);
      console.log(`Generated ${insights.length} insights and ${adjustments.length} adjustment recommendations`);
    } catch (error) {
      console.error(`Failed to trigger learning feedback for trade ${tradeSignalId}:`, error);
      // Don't throw - learning feedback is non-critical
    }
  }

  /**
   * Calculate overall performance metrics
   * 
   * Requirement 10.3: Calculate win rate, average profit, and maximum drawdown
   * 
   * @param userId - User ID to calculate metrics for (optional)
   * @returns Performance metrics
   */
  async calculatePerformanceMetrics(userId?: string): Promise<PerformanceMetrics> {
    // This would query all completed trades for the user
    // For now, we'll implement the calculation logic
    
    // TODO: Implement database query to get all completed trades
    // const completedTrades = await getCompletedTrades(userId);
    
    // Placeholder implementation
    const metrics: PerformanceMetrics = {
      winRate: 0,
      averageProfit: 0,
      averageLoss: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfitLoss: 0,
    };

    // TODO: Calculate actual metrics from completed trades
    // This will be implemented when we have trade history queries

    return metrics;
  }

  /**
   * Generate learning insights from trade outcomes
   * 
   * Requirement 10.2: Compare actual outcome to predicted outcome
   * 
   * @param tradeSignalId - Trade signal ID to analyze
   * @returns Learning insights
   */
  async generateLearningInsights(
    tradeSignalId: string
  ): Promise<LearningInsights> {
    const performance = await getPerformanceByTradeSignalId(tradeSignalId);
    if (!performance) {
      throw new Error(`Performance record not found: ${tradeSignalId}`);
    }

    const tradeSignal = await getTradeSignalById(tradeSignalId);
    if (!tradeSignal) {
      throw new Error(`Trade signal not found: ${tradeSignalId}`);
    }

    // Calculate confidence accuracy
    const confidenceAccuracy = this.calculateConfidenceAccuracy(
      performance,
      tradeSignal
    );

    // Calculate duration accuracy
    const durationAccuracy = this.calculateDurationAccuracy(performance);

    // Calculate P/L accuracy
    const profitLossAccuracy = this.calculateProfitLossAccuracy(performance);

    // Generate recommendations based on insights
    const recommendations = this.generateRecommendations(
      confidenceAccuracy,
      durationAccuracy,
      profitLossAccuracy
    );

    return {
      confidenceAccuracy,
      durationAccuracy,
      profitLossAccuracy,
      bestPerformingTimeframes: [], // TODO: Implement timeframe analysis
      worstPerformingTimeframes: [], // TODO: Implement timeframe analysis
      recommendations,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Calculate slippage between predicted and actual price
   */
  private calculateSlippage(predicted: number, actual: number): number {
    return ((actual - predicted) / predicted) * 100;
  }

  /**
   * Calculate profit/loss from exit prices
   */
  private calculateProfitLoss(
    tradeSignal: EinsteinTradeSignal,
    exitPrices: ExitPrice[]
  ): { profitLoss: number; profitLossPercent: number } {
    const entryPrice = tradeSignal.entry_price_actual || tradeSignal.entry_price;
    const positionSize = tradeSignal.position_size;
    const isLong = tradeSignal.position_type === 'LONG';

    let totalProfitLoss = 0;

    for (const exit of exitPrices) {
      const percentOfPosition = exit.percentage / 100;
      const positionAmount = positionSize * percentOfPosition;
      
      if (isLong) {
        // Long position: profit when exit > entry
        totalProfitLoss += (exit.price - entryPrice) * positionAmount;
      } else {
        // Short position: profit when exit < entry
        totalProfitLoss += (entryPrice - exit.price) * positionAmount;
      }
    }

    const profitLossPercent = (totalProfitLoss / (entryPrice * positionSize)) * 100;

    return {
      profitLoss: totalProfitLoss,
      profitLossPercent,
    };
  }

  /**
   * Calculate average exit price from multiple exits
   */
  private calculateAverageExitPrice(exitPrices: ExitPrice[]): number {
    let totalWeightedPrice = 0;
    let totalPercentage = 0;

    for (const exit of exitPrices) {
      totalWeightedPrice += exit.price * exit.percentage;
      totalPercentage += exit.percentage;
    }

    return totalPercentage > 0 ? totalWeightedPrice / totalPercentage : 0;
  }

  /**
   * Calculate predicted exit price based on take profit targets
   */
  private calculatePredictedExitPrice(tradeSignal: EinsteinTradeSignal): number {
    // Weighted average of TP targets
    const tp1Weight = tradeSignal.tp1_allocation / 100;
    const tp2Weight = tradeSignal.tp2_allocation / 100;
    const tp3Weight = tradeSignal.tp3_allocation / 100;

    return (
      tradeSignal.tp1_price * tp1Weight +
      tradeSignal.tp2_price * tp2Weight +
      tradeSignal.tp3_price * tp3Weight
    );
  }

  /**
   * Calculate confidence accuracy
   */
  private calculateConfidenceAccuracy(
    performance: EinsteinPerformance,
    tradeSignal: EinsteinTradeSignal
  ): number {
    if (!performance.profit_loss_usd) {
      return 0;
    }

    const wasWinningTrade = performance.profit_loss_usd > 0;
    const predictedConfidence = tradeSignal.confidence_overall;

    // If high confidence and won, or low confidence and lost, accuracy is high
    if (wasWinningTrade) {
      return predictedConfidence;
    } else {
      return 100 - predictedConfidence;
    }
  }

  /**
   * Calculate duration accuracy
   */
  private calculateDurationAccuracy(performance: EinsteinPerformance): number {
    if (!performance.trade_duration_minutes || !performance.trade_duration_predicted) {
      return 0;
    }

    const actual = performance.trade_duration_minutes;
    const predicted = performance.trade_duration_predicted;
    const difference = Math.abs(actual - predicted);
    const accuracy = Math.max(0, 100 - (difference / predicted) * 100);

    return accuracy;
  }

  /**
   * Calculate profit/loss accuracy
   */
  private calculateProfitLossAccuracy(performance: EinsteinPerformance): number {
    if (!performance.profit_loss_usd || !performance.profit_loss_predicted) {
      return 0;
    }

    const actual = performance.profit_loss_usd;
    const predicted = performance.profit_loss_predicted;
    const difference = Math.abs(actual - predicted);
    const accuracy = Math.max(0, 100 - (difference / Math.abs(predicted)) * 100);

    return accuracy;
  }

  /**
   * Generate recommendations based on accuracy metrics
   */
  private generateRecommendations(
    confidenceAccuracy: number,
    durationAccuracy: number,
    profitLossAccuracy: number
  ): string[] {
    const recommendations: string[] = [];

    if (confidenceAccuracy < 70) {
      recommendations.push(
        'Confidence scoring needs adjustment - consider weighting technical analysis more heavily'
      );
    }

    if (durationAccuracy < 60) {
      recommendations.push(
        'Trade duration predictions are inaccurate - review timeframe analysis methodology'
      );
    }

    if (profitLossAccuracy < 70) {
      recommendations.push(
        'Profit/loss predictions need improvement - consider adjusting take-profit target calculations'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Performance metrics are within acceptable ranges - continue current strategy'
      );
    }

    return recommendations;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of PerformanceTracker
 */
export const performanceTracker = new PerformanceTracker();

/**
 * Default export
 */
export default PerformanceTracker;
