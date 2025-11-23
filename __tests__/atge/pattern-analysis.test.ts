/**
 * Pattern Analysis Tests
 * Tests for ATGE pattern recognition and statistical analysis
 * 
 * Requirements: 3.2 - Pattern Recognition
 */

import { describe, it, expect } from '@jest/globals';

// Mock trade data for testing
interface TradeOutcome {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number | null;
  netProfitLoss: number | null;
  profitLossPercentage: number | null;
  status: string;
  generatedAt: Date;
  completedAt: Date | null;
  rsi?: number;
  macd?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  stopLossHit: boolean;
}

describe('Pattern Analysis Logic', () => {
  describe('Trade Grouping', () => {
    it('should correctly group trades by outcome', () => {
      const trades: TradeOutcome[] = [
        {
          id: '1',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 51000,
          netProfitLoss: 1000,
          profitLossPercentage: 2,
          status: 'completed_success',
          generatedAt: new Date(),
          completedAt: new Date(),
          tp1Hit: true,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: false
        },
        {
          id: '2',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 49000,
          netProfitLoss: -1000,
          profitLossPercentage: -2,
          status: 'completed_failure',
          generatedAt: new Date(),
          completedAt: new Date(),
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: true
        },
        {
          id: '3',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: null,
          netProfitLoss: null,
          profitLossPercentage: null,
          status: 'expired',
          generatedAt: new Date(),
          completedAt: null,
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: false
        }
      ];

      // Group trades
      const winning = trades.filter(t => t.netProfitLoss !== null && t.netProfitLoss > 0);
      const losing = trades.filter(t => 
        (t.netProfitLoss !== null && t.netProfitLoss <= 0) || 
        t.status === 'completed_failure'
      );
      const expired = trades.filter(t => t.status === 'expired');

      expect(winning.length).toBe(1);
      expect(losing.length).toBe(1);
      expect(expired.length).toBe(1);
    });
  });

  describe('RSI Pattern Analysis', () => {
    it('should identify RSI patterns in winning trades', () => {
      const winningTrades: TradeOutcome[] = [
        {
          id: '1',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 51000,
          netProfitLoss: 1000,
          profitLossPercentage: 2,
          status: 'completed_success',
          generatedAt: new Date(),
          completedAt: new Date(),
          rsi: 65, // Strong RSI
          tp1Hit: true,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: false
        },
        {
          id: '2',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 52000,
          netProfitLoss: 2000,
          profitLossPercentage: 4,
          status: 'completed_success',
          generatedAt: new Date(),
          completedAt: new Date(),
          rsi: 68, // Strong RSI
          tp1Hit: true,
          tp2Hit: true,
          tp3Hit: false,
          stopLossHit: false
        }
      ];

      const losingTrades: TradeOutcome[] = [
        {
          id: '3',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 49000,
          netProfitLoss: -1000,
          profitLossPercentage: -2,
          status: 'completed_failure',
          generatedAt: new Date(),
          completedAt: new Date(),
          rsi: 25, // Oversold RSI
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: true
        }
      ];

      // Count RSI in 60-70 range (Strong)
      const winningInRange = winningTrades.filter(t => t.rsi && t.rsi >= 60 && t.rsi < 70).length;
      const losingInRange = losingTrades.filter(t => t.rsi && t.rsi >= 60 && t.rsi < 70).length;

      expect(winningInRange).toBe(2);
      expect(losingInRange).toBe(0);
    });
  });

  describe('MACD Pattern Analysis', () => {
    it('should identify MACD patterns in trades', () => {
      const winningTrades: TradeOutcome[] = [
        {
          id: '1',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 51000,
          netProfitLoss: 1000,
          profitLossPercentage: 2,
          status: 'completed_success',
          generatedAt: new Date(),
          completedAt: new Date(),
          macd: 3.5, // Positive MACD
          tp1Hit: true,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: false
        }
      ];

      const losingTrades: TradeOutcome[] = [
        {
          id: '2',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 49000,
          netProfitLoss: -1000,
          profitLossPercentage: -2,
          status: 'completed_failure',
          generatedAt: new Date(),
          completedAt: new Date(),
          macd: -1.5, // Negative MACD
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: true
        }
      ];

      // Count positive MACD (2 to 5 range)
      const winningPositive = winningTrades.filter(t => t.macd && t.macd >= 2 && t.macd < 5).length;
      const losingPositive = losingTrades.filter(t => t.macd && t.macd >= 2 && t.macd < 5).length;

      expect(winningPositive).toBe(1);
      expect(losingPositive).toBe(0);
    });
  });

  describe('EMA Pattern Analysis', () => {
    it('should identify EMA trend patterns', () => {
      const winningTrades: TradeOutcome[] = [
        {
          id: '1',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 51000,
          netProfitLoss: 1000,
          profitLossPercentage: 2,
          status: 'completed_success',
          generatedAt: new Date(),
          completedAt: new Date(),
          ema20: 49500,
          ema50: 49000,
          ema200: 48000,
          tp1Hit: true,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: false
        }
      ];

      const losingTrades: TradeOutcome[] = [
        {
          id: '2',
          symbol: 'BTC',
          entryPrice: 50000,
          exitPrice: 49000,
          netProfitLoss: -1000,
          profitLossPercentage: -2,
          status: 'completed_failure',
          generatedAt: new Date(),
          completedAt: new Date(),
          ema20: 50500,
          ema50: 51000,
          ema200: 52000,
          tp1Hit: false,
          tp2Hit: false,
          tp3Hit: false,
          stopLossHit: true
        }
      ];

      // Check EMA20 > EMA50 (Bullish)
      const winningBullish = winningTrades.filter(t => 
        t.ema20 !== undefined && t.ema50 !== undefined && t.ema20 > t.ema50
      ).length;
      const losingBullish = losingTrades.filter(t => 
        t.ema20 !== undefined && t.ema50 !== undefined && t.ema20 > t.ema50
      ).length;

      expect(winningBullish).toBe(1);
      expect(losingBullish).toBe(0);
    });
  });

  describe('Chi-Square Statistical Test', () => {
    it('should calculate chi-square p-value correctly', () => {
      // Simple chi-square calculation
      // Example: 10 winning with condition, 5 winning without
      //          2 losing with condition, 8 losing without
      
      const a11 = 10; // Winning with condition
      const a12 = 5;  // Winning without condition
      const a21 = 2;  // Losing with condition
      const a22 = 8;  // Losing without condition

      const n1 = a11 + a12; // 15 total winning
      const n2 = a21 + a22; // 10 total losing
      const m1 = a11 + a21; // 12 total with condition
      const m2 = a12 + a22; // 13 total without condition
      const n = n1 + n2;    // 25 grand total

      // Expected frequencies
      const e11 = (n1 * m1) / n; // 7.2
      const e12 = (n1 * m2) / n; // 7.8
      const e21 = (n2 * m1) / n; // 4.8
      const e22 = (n2 * m2) / n; // 5.2

      // Chi-square statistic
      const chiSquare = 
        Math.pow(a11 - e11, 2) / e11 +
        Math.pow(a12 - e12, 2) / e12 +
        Math.pow(a21 - e21, 2) / e21 +
        Math.pow(a22 - e22, 2) / e22;

      // Chi-square should be > 0
      expect(chiSquare).toBeGreaterThan(0);

      // For this example, chi-square ≈ 4.5, which is > 3.841 (p < 0.05)
      // So this pattern should be statistically significant
      expect(chiSquare).toBeGreaterThan(3.841);
    });

    it('should identify non-significant patterns', () => {
      // Example with no real difference
      const a11 = 5;  // Winning with condition
      const a12 = 5;  // Winning without condition
      const a21 = 5;  // Losing with condition
      const a22 = 5;  // Losing without condition

      const n1 = a11 + a12;
      const n2 = a21 + a22;
      const m1 = a11 + a21;
      const m2 = a12 + a22;
      const n = n1 + n2;

      const e11 = (n1 * m1) / n;
      const e12 = (n1 * m2) / n;
      const e21 = (n2 * m1) / n;
      const e22 = (n2 * m2) / n;

      const chiSquare = 
        Math.pow(a11 - e11, 2) / e11 +
        Math.pow(a12 - e12, 2) / e12 +
        Math.pow(a21 - e21, 2) / e21 +
        Math.pow(a22 - e22, 2) / e22;

      // Chi-square should be very small (close to 0)
      expect(chiSquare).toBeLessThan(0.1);
      
      // This is not significant (p > 0.05)
      expect(chiSquare).toBeLessThan(3.841);
    });
  });

  describe('Pattern Ranking', () => {
    it('should rank patterns by predictive power', () => {
      const patterns = [
        {
          indicator: 'RSI',
          condition: 'RSI 60-70',
          winningPercentage: 80,
          losingPercentage: 20,
          predictivePower: 60 // High predictive power
        },
        {
          indicator: 'MACD',
          condition: 'MACD Positive',
          winningPercentage: 55,
          losingPercentage: 45,
          predictivePower: 10 // Low predictive power
        },
        {
          indicator: 'EMA',
          condition: 'EMA20 > EMA50',
          winningPercentage: 70,
          losingPercentage: 30,
          predictivePower: 40 // Medium predictive power
        }
      ];

      // Sort by predictive power
      const ranked = patterns.sort((a, b) => b.predictivePower - a.predictivePower);

      expect(ranked[0].indicator).toBe('RSI');
      expect(ranked[1].indicator).toBe('EMA');
      expect(ranked[2].indicator).toBe('MACD');
    });
  });
});
