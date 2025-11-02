/**
 * Unit Tests: Technical Indicators
 * 
 * Tests for RSI, MACD, Bollinger Bands, and other technical indicators
 */

import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateEMA,
  calculateSMA
} from '../../../lib/ucie/technicalIndicators';

describe('Technical Indicators', () => {
  describe('calculateSMA', () => {
    test('calculates simple moving average correctly', () => {
      const prices = [10, 12, 14, 16, 18, 20];
      const sma = calculateSMA(prices, 3);
      
      expect(sma).toHaveLength(4); // 6 prices - 3 period + 1
      expect(sma[0]).toBeCloseTo(12, 2); // (10+12+14)/3
      expect(sma[3]).toBeCloseTo(18, 2); // (16+18+20)/3
    });

    test('returns empty array for insufficient data', () => {
      const prices = [10, 12];
      const sma = calculateSMA(prices, 3);
      
      expect(sma).toHaveLength(0);
    });

    test('handles single period', () => {
      const prices = [10, 12, 14];
      const sma = calculateSMA(prices, 1);
      
      expect(sma).toEqual(prices);
    });
  });

  describe('calculateEMA', () => {
    test('calculates exponential moving average correctly', () => {
      const prices = [22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
      const ema = calculateEMA(prices, 5);
      
      expect(ema).toHaveLength(prices.length);
      expect(ema[ema.length - 1]).toBeGreaterThan(0);
      expect(ema[ema.length - 1]).toBeLessThan(prices[prices.length - 1]);
    });

    test('gives more weight to recent prices', () => {
      const prices1 = [10, 10, 10, 10, 20]; // Recent spike
      const prices2 = [20, 10, 10, 10, 10]; // Old spike
      
      const ema1 = calculateEMA(prices1, 5);
      const ema2 = calculateEMA(prices2, 5);
      
      expect(ema1[ema1.length - 1]).toBeGreaterThan(ema2[ema2.length - 1]);
    });
  });

  describe('calculateRSI', () => {
    test('calculates RSI correctly for trending data', () => {
      // Uptrend data
      const uptrend = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38];
      const rsiUp = calculateRSI(uptrend, 14);
      
      expect(rsiUp).toBeGreaterThan(50);
      expect(rsiUp).toBeLessThanOrEqual(100);
    });

    test('returns value between 0 and 100', () => {
      const prices = [100, 102, 98, 103, 97, 105, 95, 108, 92, 110, 90, 112, 88, 115, 85];
      const rsi = calculateRSI(prices, 14);
      
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    test('identifies overbought conditions', () => {
      // Strong uptrend should produce high RSI
      const strongUp = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
      const rsi = calculateRSI(strongUp, 14);
      
      expect(rsi).toBeGreaterThan(70); // Overbought threshold
    });

    test('identifies oversold conditions', () => {
      // Strong downtrend should produce low RSI
      const strongDown = Array.from({ length: 20 }, (_, i) => 100 - i * 2);
      const rsi = calculateRSI(strongDown, 14);
      
      expect(rsi).toBeLessThan(30); // Oversold threshold
    });
  });

  describe('calculateMACD', () => {
    test('calculates MACD line, signal line, and histogram', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
      const macd = calculateMACD(prices);
      
      expect(macd).toHaveProperty('macdLine');
      expect(macd).toHaveProperty('signalLine');
      expect(macd).toHaveProperty('histogram');
      
      expect(typeof macd.macdLine).toBe('number');
      expect(typeof macd.signalLine).toBe('number');
      expect(typeof macd.histogram).toBe('number');
    });

    test('histogram equals macdLine minus signalLine', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const macd = calculateMACD(prices);
      
      expect(macd.histogram).toBeCloseTo(macd.macdLine - macd.signalLine, 5);
    });

    test('detects bullish crossover', () => {
      // Create data that should produce positive histogram
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
      const macd = calculateMACD(prices);
      
      expect(macd.histogram).toBeGreaterThan(0);
    });
  });

  describe('calculateBollingerBands', () => {
    test('calculates upper, middle, and lower bands', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      const bands = calculateBollingerBands(prices, 20, 2);
      
      expect(bands).toHaveProperty('upper');
      expect(bands).toHaveProperty('middle');
      expect(bands).toHaveProperty('lower');
      
      expect(typeof bands.upper).toBe('number');
      expect(typeof bands.middle).toBe('number');
      expect(typeof bands.lower).toBe('number');
    });

    test('upper band is above middle band', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      const bands = calculateBollingerBands(prices, 20, 2);
      
      expect(bands.upper).toBeGreaterThan(bands.middle);
    });

    test('lower band is below middle band', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      const bands = calculateBollingerBands(prices, 20, 2);
      
      expect(bands.lower).toBeLessThan(bands.middle);
    });

    test('middle band equals SMA', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
      const bands = calculateBollingerBands(prices, 20, 2);
      const sma = calculateSMA(prices, 20);
      
      expect(bands.middle).toBeCloseTo(sma[sma.length - 1], 5);
    });

    test('wider bands with higher standard deviation multiplier', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      const bands2 = calculateBollingerBands(prices, 20, 2);
      const bands3 = calculateBollingerBands(prices, 20, 3);
      
      const width2 = bands2.upper - bands2.lower;
      const width3 = bands3.upper - bands3.lower;
      
      expect(width3).toBeGreaterThan(width2);
    });
  });
});
