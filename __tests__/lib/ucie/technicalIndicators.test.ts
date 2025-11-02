/**
 * Unit Tests: Technical Indicators
 * 
 * Tests for technical analysis calculations including:
 * - Simple Moving Average (SMA)
 * - Exponential Moving Average (EMA)
 * - Relative Strength Index (RSI)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 */

import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from '../../../lib/ucie/technicalIndicators';

describe('Technical Indicators', () => {
  describe('calculateSMA', () => {
    it('should calculate simple moving average correctly', () => {
      const prices = [10, 20, 30, 40, 50];
      const period = 3;
      const sma = calculateSMA(prices, period);
      
      // Last 3 values: 30, 40, 50 -> average = 40
      expect(sma).toBe(40);
    });

    it('should handle period equal to array length', () => {
      const prices = [10, 20, 30];
      const period = 3;
      const sma = calculateSMA(prices, period);
      
      expect(sma).toBe(20);
    });

    it('should return null for insufficient data', () => {
      const prices = [10, 20];
      const period = 5;
      const sma = calculateSMA(prices, period);
      
      expect(sma).toBeNull();
    });

    it('should handle decimal values', () => {
      const prices = [10.5, 20.3, 30.7];
      const period = 3;
      const sma = calculateSMA(prices, period);
      
      expect(sma).toBeCloseTo(20.5, 1);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate exponential moving average correctly', () => {
      const prices = [10, 20, 30, 40, 50];
      const period = 3;
      const ema = calculateEMA(prices, period);
      
      // EMA gives more weight to recent prices
      expect(ema).toBeGreaterThan(40); // Should be > SMA
      expect(ema).toBeLessThan(50);
    });

    it('should return null for insufficient data', () => {
      const prices = [10, 20];
      const period = 5;
      const ema = calculateEMA(prices, period);
      
      expect(ema).toBeNull();
    });

    it('should handle single period', () => {
      const prices = [10, 20, 30];
      const period = 1;
      const ema = calculateEMA(prices, period);
      
      // Period 1 should return last price
      expect(ema).toBe(30);
    });
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly for uptrend', () => {
      // Prices going up
      const prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38];
      const period = 14;
      const rsi = calculateRSI(prices, period);
      
      // Strong uptrend should have high RSI
      expect(rsi).toBeGreaterThan(70);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should calculate RSI correctly for downtrend', () => {
      // Prices going down
      const prices = [38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10];
      const period = 14;
      const rsi = calculateRSI(prices, period);
      
      // Strong downtrend should have low RSI
      expect(rsi).toBeLessThan(30);
      expect(rsi).toBeGreaterThanOrEqual(0);
    });

    it('should return 50 for sideways market', () => {
      // Prices oscillating around same level
      const prices = [20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19];
      const period = 14;
      const rsi = calculateRSI(prices, period);
      
      // Sideways should be around 50
      expect(rsi).toBeGreaterThan(40);
      expect(rsi).toBeLessThan(60);
    });

    it('should return null for insufficient data', () => {
      const prices = [10, 20, 30];
      const period = 14;
      const rsi = calculateRSI(prices, period);
      
      expect(rsi).toBeNull();
    });

    it('should handle edge case of all gains', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
      const period = 14;
      const rsi = calculateRSI(prices, period);
      
      // All gains should give RSI of 100
      expect(rsi).toBe(100);
    });

    it('should handle edge case of all losses', () => {
      const prices = [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
      const period = 14;
      const rsi = calculateRSI(prices, period);
      
      // All losses should give RSI of 0
      expect(rsi).toBe(0);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD correctly', () => {
      // Generate sample price data
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const macd = calculateMACD(prices);
      
      expect(macd).toHaveProperty('macdLine');
      expect(macd).toHaveProperty('signalLine');
      expect(macd).toHaveProperty('histogram');
      
      expect(typeof macd.macdLine).toBe('number');
      expect(typeof macd.signalLine).toBe('number');
      expect(typeof macd.histogram).toBe('number');
    });

    it('should have histogram equal to macdLine - signalLine', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const macd = calculateMACD(prices);
      
      const expectedHistogram = macd.macdLine - macd.signalLine;
      expect(macd.histogram).toBeCloseTo(expectedHistogram, 5);
    });

    it('should return null for insufficient data', () => {
      const prices = [10, 20, 30];
      const macd = calculateMACD(prices);
      
      expect(macd).toBeNull();
    });

    it('should show positive MACD for uptrend', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
      const macd = calculateMACD(prices);
      
      expect(macd?.macdLine).toBeGreaterThan(0);
    });

    it('should show negative MACD for downtrend', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
      const macd = calculateMACD(prices);
      
      expect(macd?.macdLine).toBeLessThan(0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const prices = [20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21];
      const period = 20;
      const stdDev = 2;
      
      const bands = calculateBollingerBands(prices, period, stdDev);
      
      expect(bands).toHaveProperty('upper');
      expect(bands).toHaveProperty('middle');
      expect(bands).toHaveProperty('lower');
      
      expect(bands.upper).toBeGreaterThan(bands.middle);
      expect(bands.middle).toBeGreaterThan(bands.lower);
    });

    it('should have middle band equal to SMA', () => {
      const prices = [20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21];
      const period = 20;
      
      const bands = calculateBollingerBands(prices, period, 2);
      const sma = calculateSMA(prices, period);
      
      expect(bands.middle).toBeCloseTo(sma!, 5);
    });

    it('should return null for insufficient data', () => {
      const prices = [10, 20, 30];
      const period = 20;
      
      const bands = calculateBollingerBands(prices, period, 2);
      
      expect(bands).toBeNull();
    });

    it('should have wider bands for higher volatility', () => {
      const lowVolPrices = [20, 20.1, 19.9, 20, 20.1, 19.9, 20, 20.1, 19.9, 20, 20.1, 19.9, 20, 20.1, 19.9, 20, 20.1, 19.9, 20, 20.1];
      const highVolPrices = [20, 25, 15, 30, 10, 35, 5, 40, 20, 25, 15, 30, 10, 35, 5, 40, 20, 25, 15, 30];
      
      const lowVolBands = calculateBollingerBands(lowVolPrices, 20, 2);
      const highVolBands = calculateBollingerBands(highVolPrices, 20, 2);
      
      const lowVolWidth = lowVolBands!.upper - lowVolBands!.lower;
      const highVolWidth = highVolBands!.upper - highVolBands!.lower;
      
      expect(highVolWidth).toBeGreaterThan(lowVolWidth);
    });

    it('should respect standard deviation multiplier', () => {
      const prices = [20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21, 19, 20, 21];
      
      const bands1 = calculateBollingerBands(prices, 20, 1);
      const bands2 = calculateBollingerBands(prices, 20, 2);
      
      const width1 = bands1!.upper - bands1!.lower;
      const width2 = bands2!.upper - bands2!.lower;
      
      // 2 std dev should be approximately twice as wide as 1 std dev
      expect(width2).toBeCloseTo(width1 * 2, 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const prices: number[] = [];
      
      expect(calculateSMA(prices, 5)).toBeNull();
      expect(calculateEMA(prices, 5)).toBeNull();
      expect(calculateRSI(prices, 14)).toBeNull();
      expect(calculateMACD(prices)).toBeNull();
      expect(calculateBollingerBands(prices, 20, 2)).toBeNull();
    });

    it('should handle single value', () => {
      const prices = [100];
      
      expect(calculateSMA(prices, 1)).toBe(100);
      expect(calculateEMA(prices, 1)).toBe(100);
      expect(calculateRSI(prices, 1)).toBeNull(); // Need at least 2 for RSI
    });

    it('should handle negative prices', () => {
      const prices = [-10, -20, -30, -40, -50];
      const sma = calculateSMA(prices, 3);
      
      expect(sma).toBe(-40);
    });

    it('should handle zero prices', () => {
      const prices = [0, 0, 0, 0, 0];
      const sma = calculateSMA(prices, 3);
      
      expect(sma).toBe(0);
    });

    it('should handle very large numbers', () => {
      const prices = [1e10, 1e10 + 1, 1e10 + 2];
      const sma = calculateSMA(prices, 3);
      
      expect(sma).toBeCloseTo(1e10 + 1, -8);
    });

    it('should handle very small numbers', () => {
      const prices = [0.0001, 0.0002, 0.0003];
      const sma = calculateSMA(prices, 3);
      
      expect(sma).toBeCloseTo(0.0002, 4);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const prices = Array.from({ length: 10000 }, (_, i) => 100 + Math.sin(i / 100) * 10);
      
      const start = Date.now();
      calculateSMA(prices, 50);
      calculateEMA(prices, 50);
      calculateRSI(prices, 14);
      calculateMACD(prices);
      calculateBollingerBands(prices, 20, 2);
      const duration = Date.now() - start;
      
      // All calculations should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
