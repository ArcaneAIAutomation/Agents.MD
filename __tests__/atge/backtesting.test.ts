/**
 * Unit Tests for ATGE Backtesting Engine
 * 
 * Tests core functionality: target hit detection, P/L calculations, fees/slippage
 * 
 * Requirements: 4.1-4.15, 20.1-20.15
 */

import { runBacktest, TradeSignal, calculatePerformanceStats } from '../../lib/atge/backtesting';
import { OHLCVData } from '../../lib/atge/historicalData';

// ============================================================================
// TEST DATA
// ============================================================================

const mockTradeSignal: TradeSignal = {
  id: 'test-trade-1',
  symbol: 'BTC',
  entryPrice: 50000,
  tp1Price: 51000, // +2% (40% allocation)
  tp1Allocation: 40,
  tp2Price: 52000, // +4% (30% allocation)
  tp2Allocation: 30,
  tp3Price: 53000, // +6% (30% allocation)
  tp3Allocation: 30,
  stopLossPrice: 49000, // -2%
  stopLossPercentage: 2,
  timeframe: '1h',
  generatedAt: new Date('2025-01-27T10:00:00Z'),
  expiresAt: new Date('2025-01-27T11:00:00Z')
};

function createOHLCVData(prices: number[], startTime: Date): OHLCVData[] {
  return prices.map((price, index) => ({
    timestamp: new Date(startTime.getTime() + index * 60000), // 1 minute intervals
    open: price,
    high: price + 100,
    low: price - 100,
    close: price,
    volume: 1000000
  }));
}

// ============================================================================
// TESTS
// ============================================================================

describe('ATGE Backtesting Engine', () => {
  
  describe('Target Hit Detection', () => {
    
    test('should detect TP1 hit', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 51100, // Hits TP1 (51000)
          low: 49900,
          close: 50500,
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      expect(result.tp1Hit.hit).toBe(true);
      expect(result.tp1Hit.hitPrice).toBe(51000);
      expect(result.status).toBe('completed_success');
    });

    test('should detect stop loss hit', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 50100,
          low: 48900, // Hits stop loss
          close: 49000,
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      expect(result.stopLossHit.hit).toBe(true);
      expect(result.stopLossHit.hitPrice).toBe(49000);
      expect(result.status).toBe('completed_failure');
    });

    test('should detect multiple targets hit in order', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 51100, // Hits TP1 (51000)
          low: 49900,
          close: 50500,
          volume: 1000000
        },
        {
          timestamp: new Date('2025-01-27T10:01:00Z'),
          open: 50500,
          high: 52100, // Hits TP2 (52000)
          low: 50400,
          close: 51500,
          volume: 1000000
        },
        {
          timestamp: new Date('2025-01-27T10:02:00Z'),
          open: 51500,
          high: 53100, // Hits TP3 (53000)
          low: 51400,
          close: 52500,
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      expect(result.tp1Hit.hit).toBe(true);
      expect(result.tp2Hit.hit).toBe(true);
      expect(result.tp3Hit.hit).toBe(true);
      expect(result.stopLossHit.hit).toBe(false);
      expect(result.status).toBe('completed_success');
    });
  });

  describe('Profit/Loss Calculations', () => {
    
    test('should calculate profit for TP1 hit (40% allocation)', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 51100, // Hits TP1 (51000)
          low: 49900,
          close: 50000, // Entry at 50000
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      // Entry: 50000, TP1: 51000 = +2%
      // TP1: $1000 * 40% * 2% = $8
      expect(result.profitLossUsd).toBeCloseTo(8, 1);
      expect(result.profitLossPercentage).toBeCloseTo(0.8, 1);
    });

    test('should calculate loss for stop loss hit', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 50100,
          low: 48900, // Hits stop loss (49000)
          close: 50000, // Entry at 50000
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      // Entry: 50000, Stop Loss: 49000 = -2%
      // Stop loss: $1000 * -2% = -$20
      expect(result.profitLossUsd).toBeCloseTo(-20, 1);
      expect(result.profitLossPercentage).toBeCloseTo(-2, 1);
    });

    test('should calculate weighted profit for multiple targets', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 51100, // Hits TP1 (51000)
          low: 49900,
          close: 50000, // Entry at 50000
          volume: 1000000
        },
        {
          timestamp: new Date('2025-01-27T10:01:00Z'),
          open: 50000,
          high: 52100, // Hits TP2 (52000)
          low: 49900,
          close: 50000,
          volume: 1000000
        },
        {
          timestamp: new Date('2025-01-27T10:02:00Z'),
          open: 50000,
          high: 53100, // Hits TP3 (53000)
          low: 49900,
          close: 50000,
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      // Entry: 50000
      // TP1: $1000 * 40% * 2% = $8
      // TP2: $1000 * 30% * 4% = $12
      // TP3: $1000 * 30% * 6% = $18
      // Total: $38
      expect(result.profitLossUsd).toBeCloseTo(38, 1);
    });
  });

  describe('Fees and Slippage', () => {
    
    test('should apply fees ($2) and slippage ($2)', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 51100, // Hits TP1 (51000)
          low: 49900,
          close: 50000, // Entry at 50000
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      expect(result.feesUsd).toBe(2);
      expect(result.slippageUsd).toBe(2);
      
      // Net P/L = Gross P/L - Fees - Slippage
      // Net P/L = $8 - $2 - $2 = $4
      expect(result.netProfitLossUsd).toBeCloseTo(4, 1);
    });

    test('should apply fees and slippage to losses', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 50100,
          low: 48900, // Hits stop loss (49000)
          close: 50000, // Entry at 50000
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      // Net P/L = -$20 - $2 - $2 = -$24
      expect(result.netProfitLossUsd).toBeCloseTo(-24, 1);
    });
  });

  describe('Edge Cases', () => {
    
    test('should handle expired trade with no targets hit', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 50500, // Doesn't reach any target
          low: 49500,
          close: 50000,
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 100);

      expect(result.tp1Hit.hit).toBe(false);
      expect(result.stopLossHit.hit).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.profitLossUsd).toBe(0);
      
      // Still charged fees and slippage
      expect(result.netProfitLossUsd).toBe(-4);
    });

    test('should handle incomplete data', () => {
      const historicalData: OHLCVData[] = [];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 0);

      expect(result.status).toBe('incomplete_data');
      expect(result.dataQualityScore).toBe(0);
    });

    test('should handle low data quality', () => {
      const historicalData: OHLCVData[] = [
        {
          timestamp: new Date('2025-01-27T10:00:00Z'),
          open: 50000,
          high: 51100,
          low: 49900,
          close: 51000,
          volume: 1000000
        }
      ];

      const result = runBacktest(mockTradeSignal, historicalData, 'CoinMarketCap', '1m', 50);

      expect(result.status).toBe('incomplete_data');
    });
  });

  describe('Performance Statistics', () => {
    
    test('should calculate aggregate performance stats', () => {
      const results = [
        {
          actualEntryPrice: 50000,
          actualExitPrice: 51000,
          tp1Hit: { hit: true },
          tp2Hit: { hit: false },
          tp3Hit: { hit: false },
          stopLossHit: { hit: false },
          profitLossUsd: 8,
          profitLossPercentage: 0.8,
          tradeDurationMinutes: 60,
          tradeSizeUsd: 1000,
          feesUsd: 2,
          slippageUsd: 2,
          netProfitLossUsd: 4,
          dataSource: 'CoinMarketCap',
          dataResolution: '1m',
          dataQualityScore: 100,
          status: 'completed_success' as const
        },
        {
          actualEntryPrice: 50000,
          actualExitPrice: 49000,
          tp1Hit: { hit: false },
          tp2Hit: { hit: false },
          tp3Hit: { hit: false },
          stopLossHit: { hit: true },
          profitLossUsd: -20,
          profitLossPercentage: -2,
          tradeDurationMinutes: 30,
          tradeSizeUsd: 1000,
          feesUsd: 2,
          slippageUsd: 2,
          netProfitLossUsd: -24,
          dataSource: 'CoinMarketCap',
          dataResolution: '1m',
          dataQualityScore: 100,
          status: 'completed_failure' as const
        }
      ];

      const stats = calculatePerformanceStats(results);

      expect(stats.totalTrades).toBe(2);
      expect(stats.completedTrades).toBe(2);
      expect(stats.successfulTrades).toBe(1);
      expect(stats.failedTrades).toBe(1);
      expect(stats.successRate).toBe(50);
      expect(stats.totalProfitLoss).toBeCloseTo(-20, 1);
      expect(stats.averageProfit).toBeCloseTo(4, 1);
      expect(stats.averageLoss).toBeCloseTo(-24, 1);
    });
  });
});
