/**
 * Einstein Risk Calculator
 * 
 * Implements advanced risk management calculations including:
 * - Position sizing based on account balance and risk tolerance
 * - ATR-based dynamic stop-loss calculation
 * - Risk-reward ratio validation
 * - Maximum loss cap enforcement
 * 
 * Requirements: 8.1, 8.2, 8.4
 */

import {
  TakeProfitTargets,
  TakeProfitTarget,
  PositionType,
  TechnicalIndicators
} from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum risk per trade as percentage of account balance
 * Requirement 8.5: Never exceed 2% of account balance per trade
 */
const MAX_RISK_PERCENT = 2;

/**
 * Minimum risk-reward ratio for all trades
 * Requirement 8.4: Ensure minimum 2:1 ratio
 */
const MIN_RISK_REWARD_RATIO = 2;

/**
 * ATR multiplier for stop-loss calculation
 * Standard multiplier for dynamic stops based on volatility
 */
const ATR_STOP_MULTIPLIER = 2;

/**
 * Fibonacci levels for take-profit calculation
 */
const FIBONACCI_LEVELS = {
  TP1: 1.618,  // 161.8% extension
  TP2: 2.618,  // 261.8% extension
  TP3: 4.236   // 423.6% extension
};

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Input parameters for risk calculation
 */
export interface RiskCalculationInput {
  accountBalance: number;
  riskTolerance: number;      // 0-100 (percentage of max risk to use)
  entryPrice: number;
  positionType: PositionType;
  atr: number;                // Average True Range
  currentPrice: number;
  technicalIndicators: TechnicalIndicators;
  historicalAtr?: number;     // Historical average ATR for volatility comparison
}

/**
 * Complete risk calculation result
 */
export interface RiskCalculationResult {
  positionSize: number;       // Number of units to trade
  stopLoss: number;           // Stop-loss price
  takeProfits: TakeProfitTargets;
  riskReward: number;         // Risk-reward ratio
  maxLoss: number;            // Maximum loss in currency
  maxLossPercent: number;     // Maximum loss as % of account
  riskAmount: number;         // Amount at risk per trade
  potentialProfit: number;    // Potential profit at TP3
}

// ============================================================================
// Main Risk Calculator Class
// ============================================================================

/**
 * Risk Calculator for Einstein Trade Engine
 * 
 * Calculates optimal position sizing, stop-loss, and take-profit levels
 * based on account balance, risk tolerance, and market volatility.
 */
export class RiskCalculator {
  /**
   * Calculate complete risk parameters for a trade
   * 
   * @param input - Risk calculation input parameters
   * @returns Complete risk calculation result
   * @throws Error if risk parameters violate constraints
   */
  public calculateRisk(input: RiskCalculationInput): RiskCalculationResult {
    // Validate input
    this.validateInput(input);

    // Calculate risk amount based on account balance and tolerance
    const riskAmount = this.calculateRiskAmount(
      input.accountBalance,
      input.riskTolerance
    );

    // Calculate ATR-based stop-loss
    let stopLoss = this.calculateStopLoss(
      input.entryPrice,
      input.atr,
      input.positionType
    );

    // Apply volatility-based adjustments if historical ATR is provided
    // Requirement 9.3: Adjust stop-loss based on ATR
    if (input.historicalAtr && input.historicalAtr > 0) {
      stopLoss = this.adjustStopLossForVolatility(
        stopLoss,
        input.atr,
        input.historicalAtr,
        input.entryPrice,
        input.positionType
      );
    }

    // Calculate position size based on risk amount and stop distance
    const positionSize = this.calculatePositionSize(
      riskAmount,
      input.entryPrice,
      stopLoss
    );

    // Calculate take-profit targets
    const takeProfits = this.calculateTakeProfits(
      input.entryPrice,
      stopLoss,
      input.positionType,
      input.technicalIndicators
    );

    // Calculate risk-reward ratio
    const riskReward = this.calculateRiskReward(
      input.entryPrice,
      stopLoss,
      takeProfits
    );

    // Validate risk-reward ratio meets minimum
    if (riskReward < MIN_RISK_REWARD_RATIO) {
      throw new Error(
        `Risk-reward ratio ${riskReward.toFixed(2)} is below minimum ${MIN_RISK_REWARD_RATIO}`
      );
    }

    // Calculate maximum loss
    const maxLoss = Math.abs(input.entryPrice - stopLoss) * positionSize;
    const maxLossPercent = (maxLoss / input.accountBalance) * 100;

    // Validate maximum loss doesn't exceed 2%
    if (maxLossPercent > MAX_RISK_PERCENT) {
      throw new Error(
        `Maximum loss ${maxLossPercent.toFixed(2)}% exceeds limit of ${MAX_RISK_PERCENT}%`
      );
    }

    // Calculate potential profit at TP3
    const potentialProfit = Math.abs(input.entryPrice - takeProfits.tp3.price) * positionSize;

    return {
      positionSize,
      stopLoss,
      takeProfits,
      riskReward,
      maxLoss,
      maxLossPercent,
      riskAmount,
      potentialProfit
    };
  }

  /**
   * Calculate risk amount based on account balance and tolerance
   * 
   * Requirement 8.1: Calculate optimal position size based on account balance and risk tolerance
   * Requirement 8.5: Never exceed 2% of account balance per trade
   * 
   * @param accountBalance - Total account balance
   * @param riskTolerance - Risk tolerance (0-100)
   * @returns Amount to risk on this trade
   */
  private calculateRiskAmount(
    accountBalance: number,
    riskTolerance: number
  ): number {
    // Calculate maximum risk (2% of account)
    const maxRisk = accountBalance * (MAX_RISK_PERCENT / 100);

    // Apply risk tolerance (0-100% of max risk)
    const riskAmount = maxRisk * (riskTolerance / 100);

    return riskAmount;
  }

  /**
   * Calculate ATR-based dynamic stop-loss
   * 
   * Requirement 8.2: Use ATR-based dynamic stops that adapt to volatility
   * 
   * @param entryPrice - Entry price for the trade
   * @param atr - Average True Range (volatility measure)
   * @param positionType - LONG or SHORT position
   * @returns Stop-loss price
   */
  private calculateStopLoss(
    entryPrice: number,
    atr: number,
    positionType: PositionType
  ): number {
    // Calculate stop distance using ATR multiplier
    const stopDistance = atr * ATR_STOP_MULTIPLIER;

    // Calculate stop-loss based on position type
    if (positionType === 'LONG') {
      // For LONG: stop below entry
      return entryPrice - stopDistance;
    } else if (positionType === 'SHORT') {
      // For SHORT: stop above entry
      return entryPrice + stopDistance;
    } else {
      throw new Error('Cannot calculate stop-loss for NO_TRADE position');
    }
  }

  /**
   * Calculate position size based on risk amount and stop distance
   * 
   * Position size = Risk Amount / Stop Distance
   * 
   * @param riskAmount - Amount willing to risk
   * @param entryPrice - Entry price
   * @param stopLoss - Stop-loss price
   * @returns Number of units to trade
   */
  private calculatePositionSize(
    riskAmount: number,
    entryPrice: number,
    stopLoss: number
  ): number {
    const stopDistance = Math.abs(entryPrice - stopLoss);
    
    if (stopDistance === 0) {
      throw new Error('Stop distance cannot be zero');
    }

    const positionSize = riskAmount / stopDistance;
    
    return positionSize;
  }

  /**
   * Calculate take-profit targets using Fibonacci levels and technical analysis
   * 
   * Requirement 8.3: Provide 3 targets (TP1, TP2, TP3) with percentage allocations
   * 
   * @param entryPrice - Entry price
   * @param stopLoss - Stop-loss price
   * @param positionType - LONG or SHORT
   * @param indicators - Technical indicators for resistance/support
   * @returns Take-profit targets with allocations
   */
  private calculateTakeProfits(
    entryPrice: number,
    stopLoss: number,
    positionType: PositionType,
    indicators: TechnicalIndicators
  ): TakeProfitTargets {
    const stopDistance = Math.abs(entryPrice - stopLoss);

    if (positionType === 'LONG') {
      // For LONG positions: targets above entry
      const tp1Price = entryPrice + (stopDistance * FIBONACCI_LEVELS.TP1);
      const tp2Price = entryPrice + (stopDistance * FIBONACCI_LEVELS.TP2);
      
      // TP3 uses Bollinger Band upper as resistance
      const tp3Price = Math.max(
        entryPrice + (stopDistance * FIBONACCI_LEVELS.TP3),
        indicators.bollingerBands.upper
      );

      return {
        tp1: { price: tp1Price, allocation: 50 },
        tp2: { price: tp2Price, allocation: 30 },
        tp3: { price: tp3Price, allocation: 20 }
      };
    } else if (positionType === 'SHORT') {
      // For SHORT positions: targets below entry
      const tp1Price = entryPrice - (stopDistance * FIBONACCI_LEVELS.TP1);
      const tp2Price = entryPrice - (stopDistance * FIBONACCI_LEVELS.TP2);
      
      // TP3 uses Bollinger Band lower as support
      const tp3Price = Math.min(
        entryPrice - (stopDistance * FIBONACCI_LEVELS.TP3),
        indicators.bollingerBands.lower
      );

      return {
        tp1: { price: tp1Price, allocation: 50 },
        tp2: { price: tp2Price, allocation: 30 },
        tp3: { price: tp3Price, allocation: 20 }
      };
    } else {
      throw new Error('Cannot calculate take-profits for NO_TRADE position');
    }
  }

  /**
   * Calculate risk-reward ratio
   * 
   * Requirement 8.4: Ensure minimum 2:1 ratio for all trades
   * 
   * Risk-reward is calculated as the weighted average of all TP targets
   * divided by the risk (stop distance).
   * 
   * @param entryPrice - Entry price
   * @param stopLoss - Stop-loss price
   * @param takeProfits - Take-profit targets
   * @returns Risk-reward ratio
   */
  private calculateRiskReward(
    entryPrice: number,
    stopLoss: number,
    takeProfits: TakeProfitTargets
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);

    // Calculate weighted average reward
    const tp1Reward = Math.abs(entryPrice - takeProfits.tp1.price) * (takeProfits.tp1.allocation / 100);
    const tp2Reward = Math.abs(entryPrice - takeProfits.tp2.price) * (takeProfits.tp2.allocation / 100);
    const tp3Reward = Math.abs(entryPrice - takeProfits.tp3.price) * (takeProfits.tp3.allocation / 100);

    const totalReward = tp1Reward + tp2Reward + tp3Reward;

    const riskRewardRatio = totalReward / risk;

    return riskRewardRatio;
  }

  /**
   * Validate input parameters
   * 
   * @param input - Risk calculation input
   * @throws Error if input is invalid
   */
  private validateInput(input: RiskCalculationInput): void {
    if (input.accountBalance <= 0) {
      throw new Error('Account balance must be positive');
    }

    if (input.riskTolerance < 0 || input.riskTolerance > 100) {
      throw new Error('Risk tolerance must be between 0 and 100');
    }

    if (input.entryPrice <= 0) {
      throw new Error('Entry price must be positive');
    }

    if (input.atr <= 0) {
      throw new Error('ATR must be positive');
    }

    if (input.positionType === 'NO_TRADE') {
      throw new Error('Cannot calculate risk for NO_TRADE position');
    }
  }

  /**
   * Adjust stop-loss based on volatility
   * 
   * Requirement 9.3: Adjust stop-loss based on ATR
   * 
   * @param baseStopLoss - Base stop-loss price
   * @param atr - Current ATR
   * @param historicalAtr - Historical average ATR
   * @param entryPrice - Entry price
   * @param positionType - LONG or SHORT
   * @returns Adjusted stop-loss price
   */
  public adjustStopLossForVolatility(
    baseStopLoss: number,
    atr: number,
    historicalAtr: number,
    entryPrice: number,
    positionType: PositionType
  ): number {
    // Calculate volatility ratio
    const volatilityRatio = atr / historicalAtr;

    // If volatility is high (>1.5x normal), widen stops
    if (volatilityRatio > 1.5) {
      const additionalDistance = (atr - historicalAtr) * ATR_STOP_MULTIPLIER;
      
      if (positionType === 'LONG') {
        return baseStopLoss - additionalDistance;
      } else {
        return baseStopLoss + additionalDistance;
      }
    }

    // If volatility is low (<0.5x normal), tighten stops
    if (volatilityRatio < 0.5) {
      const reductionDistance = (historicalAtr - atr) * ATR_STOP_MULTIPLIER * 0.5;
      
      if (positionType === 'LONG') {
        return baseStopLoss + reductionDistance;
      } else {
        return baseStopLoss - reductionDistance;
      }
    }

    // Normal volatility, no adjustment
    return baseStopLoss;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

/**
 * Singleton instance of RiskCalculator
 */
export const riskCalculator = new RiskCalculator();
