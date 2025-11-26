/**
 * Risk Calculator Tests
 * 
 * Tests for the Einstein Risk Calculator module
 * Validates position sizing, stop-loss, and risk-reward calculations
 */

import { RiskCalculator } from '../../../../lib/einstein/analysis/riskCalculator';
import type { RiskCalculationInput, TechnicalIndicators } from '../../../../lib/einstein/types';

describe('RiskCalculator', () => {
  let calculator: RiskCalculator;

  beforeEach(() => {
    calculator = new RiskCalculator();
  });

  // Sample technical indicators for testing
  const sampleIndicators: TechnicalIndicators = {
    rsi: 50,
    macd: { value: 0, signal: 0, histogram: 0 },
    ema: { ema9: 95000, ema21: 94000, ema50: 93000, ema200: 90000 },
    bollingerBands: { upper: 98000, middle: 95000, lower: 92000 },
    atr: 1000,
    stochastic: { k: 50, d: 50 }
  };

  describe('calculateRisk', () => {
    it('should calculate risk parameters for a LONG position', () => {
      const input: RiskCalculationInput = {
        accountBalance: 100000,
        riskTolerance: 100, // Use full 2% risk
        entryPrice: 95000,
        positionType: 'LONG',
        atr: 1000,
        currentPrice: 95000,
        technicalIndicators: sampleIndicators
      };

      const result = calculator.calculateRisk(input);

      // Verify position size is calculated
      expect(result.positionSize).toBeGreaterThan(0);

      // Verify stop-loss is below entry for LONG
      expect(result.stopLoss).toBeLessThan(input.entryPrice);

      // Verify take-profits are above entry for LONG
      expect(result.takeProfits.tp1.price).toBeGreaterThan(input.entryPrice);
      expect(result.takeProfits.tp2.price).toBeGreaterThan(result.takeProfits.tp1.price);
      expect(result.takeProfits.tp3.price).toBeGreaterThan(result.takeProfits.tp2.price);

      // Verify allocations sum to 100%
      const totalAllocation = 
        result.takeProfits.tp1.allocation +
        result.takeProfits.tp2.allocation +
        result.takeProfits.tp3.allocation;
      expect(totalAllocation).toBe(100);

      // Verify risk-reward ratio meets minimum (2:1)
      expect(result.riskReward).toBeGreaterThanOrEqual(2);

      // Verify max loss doesn't exceed 2% of account
      expect(result.maxLossPercent).toBeLessThanOrEqual(2);
    });

    it('should calculate risk parameters for a SHORT position', () => {
      const input: RiskCalculationInput = {
        accountBalance: 100000,
        riskTolerance: 100,
        entryPrice: 95000,
        positionType: 'SHORT',
        atr: 1000,
        currentPrice: 95000,
        technicalIndicators: sampleIndicators
      };

      const result = calculator.calculateRisk(input);

      // Verify stop-loss is above entry for SHORT
      expect(result.stopLoss).toBeGreaterThan(input.entryPrice);

      // Verify take-profits are below entry for SHORT
      expect(result.takeProfits.tp1.price).toBeLessThan(input.entryPrice);
      expect(result.takeProfits.tp2.price).toBeLessThan(result.takeProfits.tp1.price);
      expect(result.takeProfits.tp3.price).toBeLessThan(result.takeProfits.tp2.price);

      // Verify risk-reward ratio meets minimum
      expect(result.riskReward).toBeGreaterThanOrEqual(2);
    });

    it('should respect risk tolerance setting', () => {
      const input50: RiskCalculationInput = {
        accountBalance: 100000,
        riskTolerance: 50, // Use only 50% of max risk (1% instead of 2%)
        entryPrice: 95000,
        positionType: 'LONG',
        atr: 1000,
        currentPrice: 95000,
        technicalIndicators: sampleIndicators
      };

      const input100: RiskCalculationInput = {
        ...input50,
        riskTolerance: 100 // Use full 2% risk
      };

      const result50 = calculator.calculateRisk(input50);
      const result100 = calculator.calculateRisk(input100);

      // Position size should be smaller with lower risk tolerance
      expect(result50.positionSize).toBeLessThan(result100.positionSize);

      // Max loss should be smaller with lower risk tolerance
      expect(result50.maxLoss).toBeLessThan(result100.maxLoss);
    });

    it('should throw error for NO_TRADE position type', () => {
      const input: RiskCalculationInput = {
        accountBalance: 100000,
        riskTolerance: 100,
        entryPrice: 95000,
        positionType: 'NO_TRADE',
        atr: 1000,
        currentPrice: 95000,
        technicalIndicators: sampleIndicators
      };

      expect(() => calculator.calculateRisk(input)).toThrow();
    });

    it('should throw error for invalid account balance', () => {
      const input: RiskCalculationInput = {
        accountBalance: -1000,
        riskTolerance: 100,
        entryPrice: 95000,
        positionType: 'LONG',
        atr: 1000,
        currentPrice: 95000,
        technicalIndicators: sampleIndicators
      };

      expect(() => calculator.calculateRisk(input)).toThrow('Account balance must be positive');
    });

    it('should throw error for invalid risk tolerance', () => {
      const input: RiskCalculationInput = {
        accountBalance: 100000,
        riskTolerance: 150, // Invalid: > 100
        entryPrice: 95000,
        positionType: 'LONG',
        atr: 1000,
        currentPrice: 95000,
        technicalIndicators: sampleIndicators
      };

      expect(() => calculator.calculateRisk(input)).toThrow('Risk tolerance must be between 0 and 100');
    });
  });

  describe('adjustStopLossForVolatility', () => {
    it('should widen stops during high volatility', () => {
      const baseStopLoss = 93000;
      const currentAtr = 2000; // High volatility
      const historicalAtr = 1000; // Normal volatility
      const entryPrice = 95000;

      const adjustedStop = calculator.adjustStopLossForVolatility(
        baseStopLoss,
        currentAtr,
        historicalAtr,
        entryPrice,
        'LONG'
      );

      // Stop should be wider (lower) for LONG during high volatility
      expect(adjustedStop).toBeLessThan(baseStopLoss);
    });

    it('should tighten stops during low volatility', () => {
      const baseStopLoss = 93000;
      const currentAtr = 400; // Low volatility
      const historicalAtr = 1000; // Normal volatility
      const entryPrice = 95000;

      const adjustedStop = calculator.adjustStopLossForVolatility(
        baseStopLoss,
        currentAtr,
        historicalAtr,
        entryPrice,
        'LONG'
      );

      // Stop should be tighter (higher) for LONG during low volatility
      expect(adjustedStop).toBeGreaterThan(baseStopLoss);
    });

    it('should not adjust stops during normal volatility', () => {
      const baseStopLoss = 93000;
      const currentAtr = 1000;
      const historicalAtr = 1000;
      const entryPrice = 95000;

      const adjustedStop = calculator.adjustStopLossForVolatility(
        baseStopLoss,
        currentAtr,
        historicalAtr,
        entryPrice,
        'LONG'
      );

      // Stop should remain unchanged
      expect(adjustedStop).toBe(baseStopLoss);
    });
  });
});
