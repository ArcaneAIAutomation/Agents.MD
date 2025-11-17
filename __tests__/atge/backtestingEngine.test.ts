/**
 * Unit Tests for ATGE Backtesting Engine
 * 
 * Tests core backtesting functionality: target detection, P/L calculation, edge cases
 * 
 * Requirements: Task 6.1 - Create Backtesting Engine Core
 * Acceptance Criteria:
 * - Function accepts trade signal input
 * - Fetches historical prices for timeframe
 * - Validates data quality (≥70%)
 * - Iterates through prices chronologically
 * - Returns complete trade result
 * - Handles all edge cases
 * - TypeScript types are correct
 * - Unit tests pass
 */

import { runBacktest, BacktestInput, BacktestResult } from '../../lib/atge/backtestingEngine';

// Mock the historicalPriceQuery module
jest.mock('../../lib/atge/historicalPriceQuery', () => ({
  queryHistoricalPrices: jest.fn()
}));

import { queryHistoricalPrices } from '../../lib/atge/historicalPriceQuery';

// ============================================================================
// TEST DATA & HELPERS
// ============================================================================

const mockQueryHistoricalPrices = queryHistoricalPrices as jest.MockedFunction<typeof queryHistoricalPrices>;

/**
 * Create a valid backtest input for testing
 */
function createValidBacktestInput(overrides?: Partial<BacktestInput>): BacktestInput {
  return {
    tradeId: 'test-trade-123',
    symbol: 'BTC',
    entryPrice: 100000,
    tp1Price: 102000,
    tp1Allocation: 30,
    tp2Price: 104000,
    tp2Allocation: 40,
    tp3Price: 106000,
    tp3Allocation: 30,
    stopLossPrice: 98000,
    timeframe: '1h',
    timeframeHours: 24,
    generatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * Create mock historical price data
 */
function createMockHistoricalData(candles: Array<{
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>) {
  return {
    data: candles,
    dataQuality: 100,
    gaps: []
  };
}

// ============================================================================
// PARAMETER VALIDATION TESTS
// ============================================================================

describe('Backtesting Engine - Parameter Validation', () => {
  
  beforeEach(() => {
    mockQueryHistoricalPrices.mockClear();
  });
  
  test('should accept valid trade parameters', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 101000,
        low: 99000,
        close: 100500,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result).toBeDefined();
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(70);
  });
  
  test('should reject negative entry price', async () => {
    const input = createValidBacktestInput({ entryPrice: -100000 });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.dataQualityScore).toBe(0);
  });
  
  test('should reject invalid allocations (not summing to 100%)', async () => {
    const input = createValidBacktestInput({
      tp1Allocation: 30,
      tp2Allocation: 30,
      tp3Allocation: 30 // Total = 90%, not 100%
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
  });
  
  test('should reject TP1 below entry price', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 99000 // Below entry
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
  });
  
  test('should reject stop loss above entry price', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      stopLossPrice: 101000 // Above entry
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
  });
});

// ============================================================================
// DATA QUALITY VALIDATION TESTS
// ============================================================================

describe('Backtesting Engine - Data Quality Validation', () => {
  
  beforeEach(() => {
    mockQueryHistoricalPrices.mockClear();
  });
  
  test('should accept data quality ≥70%', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue({
      data: [
        {
          timestamp: '2025-01-01T01:00:00Z',
          open: 100000,
          high: 101000,
          low: 99000,
          close: 100500,
          volume: 1000
        }
      ],
      dataQuality: 75,
      gaps: []
    });
    
    const result = await runBacktest(input);
    
    expect(result.dataQualityScore).toBe(75);
    expect(result.status).not.toBe('incomplete_data');
  });
  
  test('should reject data quality <70%', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue({
      data: [],
      dataQuality: 50,
      gaps: []
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.dataQualityScore).toBe(50);
  });
  
  test('should handle empty data array', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue({
      data: [],
      dataQuality: 0,
      gaps: []
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.dataQualityScore).toBe(0);
  });
});

// ============================================================================
// TARGET HIT DETECTION TESTS
// ============================================================================

describe('Backtesting Engine - Target Hit Detection', () => {
  
  beforeEach(() => {
    mockQueryHistoricalPrices.mockClear();
  });
  
  test('should detect TP1 hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500, // Hits TP1 (102000)
        low: 99000,
        close: 102000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp1HitPrice).toBe(102000);
    expect(result.tp1HitAt).toBeDefined();
  });
  
  test('should detect TP2 hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 104500, // Hits TP1 and TP2
        low: 99000,
        close: 104000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp2HitPrice).toBe(104000);
  });
  
  test('should detect all 3 TPs hit in sequence', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 106500, // Hits all TPs
        low: 99000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(true);
    expect(result.status).toBe('completed_success');
  });
  
  test('should detect stop loss hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 101000,
        low: 97500, // Hits stop loss (98000)
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.stopLossHit).toBe(true);
    expect(result.stopLossHitPrice).toBe(98000);
    expect(result.status).toBe('completed_failure');
  });
  
  test('should prioritize stop loss over take profits', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 106500, // Would hit all TPs
        low: 97500,   // But also hits stop loss
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.stopLossHit).toBe(true);
    expect(result.tp1Hit).toBe(false);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.status).toBe('completed_failure');
  });
});

// ============================================================================
// PROFIT/LOSS CALCULATION TESTS
// ============================================================================

describe('Backtesting Engine - P/L Calculation', () => {
  
  beforeEach(() => {
    mockQueryHistoricalPrices.mockClear();
  });
  
  test('should calculate correct profit for TP1 hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500,
        low: 99000,
        close: 102000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // TP1: (102000 - 100000) * 0.30 = 600
    expect(result.profitLossUsd).toBeCloseTo(600, 2);
    expect(result.profitLossPercentage).toBeCloseTo(0.6, 2);
  });
  
  test('should calculate correct profit for all TPs hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 106500,
        low: 99000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // TP1: (102000 - 100000) * 0.30 = 600
    // TP2: (104000 - 100000) * 0.40 = 1600
    // TP3: (106000 - 100000) * 0.30 = 1800
    // Total: 4000
    expect(result.profitLossUsd).toBeCloseTo(4000, 2);
    expect(result.profitLossPercentage).toBeCloseTo(4.0, 2);
  });
  
  test('should calculate correct loss for stop loss hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 101000,
        low: 97500,
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Stop loss: (98000 - 100000) * 1.00 = -2000
    expect(result.profitLossUsd).toBeCloseTo(-2000, 2);
    expect(result.profitLossPercentage).toBeCloseTo(-2.0, 2);
  });
  
  test('should calculate correct profit for partial fills', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 104500, // Hits TP1 and TP2 only (not TP3 which is 106000)
        low: 99000,
        close: 104000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // TP1: (102000 - 100000) * 0.30 = 600
    // TP2: (104000 - 100000) * 0.40 = 1600
    // Total: 2200
    expect(result.profitLossUsd).toBeCloseTo(2200, 2);
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(false);
  });
  
  test('should track remaining allocation correctly after each TP hit', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 102000,
      tp1Allocation: 30,
      tp2Price: 104000,
      tp2Allocation: 40,
      tp3Price: 106000,
      tp3Allocation: 30,
      stopLossPrice: 98000
    });
    
    // Scenario: TP1 and TP2 hit, then stop loss hits with remaining 30%
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500, // Hits TP1 (30% allocation taken)
        low: 99500,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T02:00:00Z',
        open: 102000,
        high: 104500, // Hits TP2 (40% allocation taken, 30% remaining)
        low: 101000,
        close: 104000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T03:00:00Z',
        open: 104000,
        high: 105000,
        low: 97500, // Hits stop loss with remaining 30%
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Verify targets hit
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(false);
    expect(result.stopLossHit).toBe(true);
    
    // Verify P/L calculation with correct remaining allocation
    // TP1: (102000 - 100000) * 0.30 = 600
    // TP2: (104000 - 100000) * 0.40 = 1600
    // Stop Loss: (98000 - 100000) * 0.30 = -600 (only 30% remaining after TP1 and TP2)
    // Total: 600 + 1600 - 600 = 1600
    expect(result.profitLossUsd).toBeCloseTo(1600, 2);
    expect(result.profitLossPercentage).toBeCloseTo(1.6, 2);
    expect(result.status).toBe('completed_failure');
  });
  
  test('should track remaining allocation correctly when only TP1 hits before stop loss', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 102000,
      tp1Allocation: 30,
      tp2Price: 104000,
      tp2Allocation: 40,
      tp3Price: 106000,
      tp3Allocation: 30,
      stopLossPrice: 98000
    });
    
    // Scenario: TP1 hits (30% taken), then stop loss hits with remaining 70%
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500, // Hits TP1 (30% allocation taken, 70% remaining)
        low: 99500,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T02:00:00Z',
        open: 102000,
        high: 103000,
        low: 97500, // Hits stop loss with remaining 70%
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Verify targets hit
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.stopLossHit).toBe(true);
    
    // Verify P/L calculation with correct remaining allocation
    // TP1: (102000 - 100000) * 0.30 = 600
    // Stop Loss: (98000 - 100000) * 0.70 = -1400 (70% remaining after TP1)
    // Total: 600 - 1400 = -800
    expect(result.profitLossUsd).toBeCloseTo(-800, 2);
    expect(result.profitLossPercentage).toBeCloseTo(-0.8, 2);
    expect(result.status).toBe('completed_failure');
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Backtesting Engine - Edge Cases', () => {
  
  beforeEach(() => {
    mockQueryHistoricalPrices.mockClear();
  });
  
  test('should handle trade expiring with no targets hit', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 101000, // Doesn't hit any TP
        low: 99000,   // Doesn't hit SL
        close: 100500,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('expired');
    expect(result.tp1Hit).toBe(false);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.stopLossHit).toBe(false);
    expect(result.profitLossUsd).toBe(0);
  });
  
  test('should expire trade after timeframe hours have passed', async () => {
    const input = createValidBacktestInput({
      generatedAt: new Date('2025-01-01T00:00:00Z'),
      timeframeHours: 24 // 24-hour timeframe
    });
    
    // Create candles that span beyond the 24-hour timeframe
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z', // 1 hour after generation
        open: 100000,
        high: 101000,
        low: 99000,
        close: 100500,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T12:00:00Z', // 12 hours after generation
        open: 100500,
        high: 101500,
        low: 99500,
        close: 101000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T23:00:00Z', // 23 hours after generation (within timeframe)
        open: 101000,
        high: 101800,
        low: 100000,
        close: 101500,
        volume: 1000
      },
      {
        timestamp: '2025-01-02T01:00:00Z', // 25 hours after generation (BEYOND timeframe)
        open: 101500,
        high: 106500, // Would hit all TPs if processed
        low: 97000,   // Would hit SL if processed
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Trade should expire after 24 hours, so the candle at 25 hours should NOT be processed
    expect(result.status).toBe('expired');
    expect(result.tp1Hit).toBe(false);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.stopLossHit).toBe(false);
    expect(result.profitLossUsd).toBe(0);
    expect(result.tradeDurationMinutes).toBe(1440); // 24 hours = 1440 minutes
  });
  
  test('should process candles within timeframe but stop at expiration', async () => {
    const input = createValidBacktestInput({
      generatedAt: new Date('2025-01-01T00:00:00Z'),
      timeframeHours: 4 // 4-hour timeframe
    });
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z', // 1 hour - within timeframe
        open: 100000,
        high: 102500, // Hits TP1
        low: 99000,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T03:00:00Z', // 3 hours - within timeframe
        open: 102000,
        high: 103500,
        low: 101000,
        close: 103000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T05:00:00Z', // 5 hours - BEYOND timeframe
        open: 103000,
        high: 106500, // Would hit TP2 and TP3 if processed
        low: 102000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Should process first two candles (within 4-hour timeframe) but not the third
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(false); // Not hit because candle at 5 hours is beyond timeframe
    expect(result.tp3Hit).toBe(false);
    expect(result.status).toBe('completed_success'); // Partial success with TP1
    expect(result.tradeDurationMinutes).toBe(240); // 4 hours = 240 minutes
  });
  
  test('should handle stop loss hit immediately (first candle)', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T00:05:00Z', // Very close to generation time
        open: 100000,
        high: 100500,
        low: 97000, // Immediate stop loss
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.stopLossHit).toBe(true);
    expect(result.status).toBe('completed_failure');
    expect(result.tradeDurationMinutes).toBeLessThan(60);
  });
  
  test('should handle partial fills with trade expiration', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500, // Hits TP1 only
        low: 99000,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T23:00:00Z', // Near expiration
        open: 102000,
        high: 103000, // Doesn't hit TP2 or TP3
        low: 101000,
        close: 102500,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.status).toBe('completed_success'); // Partial success
    expect(result.profitLossUsd).toBeGreaterThan(0);
  });
  
  test('should calculate trade duration correctly', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T02:00:00Z', // 2 hours after generation
        open: 100000,
        high: 106500,
        low: 99000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tradeDurationMinutes).toBe(120); // 2 hours = 120 minutes
  });
  
  test('should handle missing candles (gaps in data)', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 101000,
        low: 99000,
        close: 100500,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T05:00:00Z', // 4-hour gap
        open: 100500,
        high: 106500,
        low: 100000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Should still process despite gap
    expect(result).toBeDefined();
    expect(result.tp3Hit).toBe(true);
  });
  
  test('should handle zero timeframe hours', async () => {
    const input = createValidBacktestInput({
      timeframeHours: 0 // Invalid: zero timeframe
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.errorMessage).toContain('Timeframe hours must be positive');
  });
  
  test('should handle negative prices', async () => {
    const input = createValidBacktestInput({
      entryPrice: -100000 // Invalid: negative price
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.errorMessage).toContain('Entry price must be positive');
  });
  
  test('should handle TP prices not in ascending order', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 106000, // TP1 higher than TP2
      tp2Price: 104000,
      tp3Price: 102000
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.errorMessage).toBeDefined();
  });
  
  test('should handle allocations not summing to 100%', async () => {
    const input = createValidBacktestInput({
      tp1Allocation: 25,
      tp2Allocation: 25,
      tp3Allocation: 25 // Total = 75%, not 100%
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.errorMessage).toContain('Allocations must sum to 100%');
  });
  
  test('should handle negative allocations', async () => {
    const input = createValidBacktestInput({
      tp1Allocation: -30,
      tp2Allocation: 70,
      tp3Allocation: 60
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.errorMessage).toContain('Allocations must be non-negative');
  });
  
  test('should handle very large price movements', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 102000,
      tp2Price: 104000,
      tp3Price: 106000,
      stopLossPrice: 98000
    });
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 200000, // Extreme price spike (100% gain)
        low: 50000,   // Extreme price drop (50% loss) - hits SL
        close: 150000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Should handle extreme volatility - SL is checked first and takes priority
    expect(result).toBeDefined();
    expect(result.stopLossHit).toBe(true); // SL checked first
    expect(result.tp1Hit).toBe(false); // TPs not checked after SL hit
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.status).toBe('completed_failure'); // SL takes priority
    expect(result.profitLossUsd).toBeLessThan(0); // Loss from SL
  });
  
  test('should handle multiple timeframes correctly', async () => {
    const timeframes: Array<'15m' | '1h' | '4h' | '1d' | '1w'> = ['15m', '1h', '4h', '1d', '1w'];
    
    for (const timeframe of timeframes) {
      const input = createValidBacktestInput({
        timeframe,
        timeframeHours: timeframe === '15m' ? 0.25 : 
                       timeframe === '1h' ? 1 :
                       timeframe === '4h' ? 4 :
                       timeframe === '1d' ? 24 : 168
      });
      
      mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
        {
          timestamp: '2025-01-01T01:00:00Z',
          open: 100000,
          high: 106500,
          low: 99000,
          close: 106000,
          volume: 1000
        }
      ]));
      
      const result = await runBacktest(input);
      
      expect(result).toBeDefined();
      expect(result.dataResolution).toBe(timeframe);
    }
  });
  
  test('should handle trade with only TP1 hit before expiration', async () => {
    const input = createValidBacktestInput({
      generatedAt: new Date('2025-01-01T00:00:00Z'),
      timeframeHours: 2 // 2-hour timeframe
    });
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500, // Hits TP1 only
        low: 99000,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T01:30:00Z',
        open: 102000,
        high: 102500, // Doesn't reach TP2
        low: 101000,
        close: 102200,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.stopLossHit).toBe(false);
    expect(result.status).toBe('completed_success'); // Partial success
    expect(result.profitLossUsd).toBeCloseTo(600, 2); // Only TP1 profit
    expect(result.warningMessage).toContain('partial fills');
  });
  
  test('should handle trade with TP1 and TP2 hit before expiration', async () => {
    const input = createValidBacktestInput({
      generatedAt: new Date('2025-01-01T00:00:00Z'),
      timeframeHours: 3
    });
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 104500, // Hits TP1 and TP2
        low: 99000,
        close: 104000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T02:00:00Z',
        open: 104000,
        high: 105000, // Doesn't reach TP3
        low: 103000,
        close: 104500,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(false);
    expect(result.status).toBe('completed_success'); // Partial success
    expect(result.profitLossUsd).toBeCloseTo(2200, 2); // TP1 + TP2 profit
  });
  
  test('should handle empty historical data array', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue({
      data: [], // Empty data
      dataQuality: 0,
      gaps: []
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.dataQualityScore).toBe(0);
    // Error message should mention insufficient data quality (which is caught first)
    expect(result.errorMessage).toContain('Insufficient data quality');
  });
  
  test('should handle data quality exactly at 70% threshold', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue({
      data: [
        {
          timestamp: '2025-01-01T01:00:00Z',
          open: 100000,
          high: 106500,
          low: 99000,
          close: 106000,
          volume: 1000
        }
      ],
      dataQuality: 70, // Exactly at threshold
      gaps: []
    });
    
    const result = await runBacktest(input);
    
    expect(result.dataQualityScore).toBe(70);
    expect(result.status).not.toBe('incomplete_data'); // Should pass
  });
  
  test('should handle data quality just below 70% threshold', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue({
      data: [],
      dataQuality: 69.9, // Just below threshold
      gaps: []
    });
    
    const result = await runBacktest(input);
    
    expect(result.status).toBe('incomplete_data');
    expect(result.dataQualityScore).toBe(69.9);
    expect(result.errorMessage).toContain('Insufficient data quality');
  });
  
  test('should handle concurrent TP and SL hits in same candle (SL priority)', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 102000,
      tp2Price: 104000,
      tp3Price: 106000,
      stopLossPrice: 98000
    });
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 106500, // Would hit all TPs
        low: 97000,   // Also hits SL
        close: 98000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Stop loss should take priority
    expect(result.stopLossHit).toBe(true);
    expect(result.tp1Hit).toBe(false);
    expect(result.tp2Hit).toBe(false);
    expect(result.tp3Hit).toBe(false);
    expect(result.status).toBe('completed_failure');
    expect(result.profitLossUsd).toBeLessThan(0);
  });
  
  test('should handle trade with exact price matches', async () => {
    const input = createValidBacktestInput({
      entryPrice: 100000,
      tp1Price: 102000,
      tp2Price: 104000,
      tp3Price: 106000,
      stopLossPrice: 98000
    });
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102000, // Exactly TP1
        low: 99000,
        close: 101500,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T02:00:00Z',
        open: 101500,
        high: 104000, // Exactly TP2
        low: 101000,
        close: 103500,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T03:00:00Z',
        open: 103500,
        high: 106000, // Exactly TP3
        low: 103000,
        close: 105500,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(true);
    expect(result.tp1HitPrice).toBe(102000);
    expect(result.tp2HitPrice).toBe(104000);
    expect(result.tp3HitPrice).toBe(106000);
    expect(result.status).toBe('completed_success');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Backtesting Engine - Integration', () => {
  
  beforeEach(() => {
    mockQueryHistoricalPrices.mockClear();
  });
  
  test('should complete full backtest flow successfully', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 102500,
        low: 99000,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T02:00:00Z',
        open: 102000,
        high: 104500,
        low: 101000,
        close: 104000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T03:00:00Z',
        open: 104000,
        high: 106500,
        low: 103000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    // Verify complete result structure
    expect(result.actualEntryPrice).toBe(100000);
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(true);
    expect(result.stopLossHit).toBe(false);
    expect(result.profitLossUsd).toBeCloseTo(4000, 2);
    expect(result.profitLossPercentage).toBeCloseTo(4.0, 2);
    expect(result.tradeDurationMinutes).toBeGreaterThan(0);
    expect(result.netProfitLossUsd).toBeCloseTo(4000, 2);
    expect(result.dataSource).toBe('coingecko');
    expect(result.dataResolution).toBe('1h');
    expect(result.dataQualityScore).toBe(100);
    expect(result.status).toBe('completed_success');
  });
  
  test('should handle realistic market scenario with volatility', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 101500,
        low: 99500,
        close: 101000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T02:00:00Z',
        open: 101000,
        high: 102500, // Hits TP1
        low: 100500,
        close: 102000,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T03:00:00Z',
        open: 102000,
        high: 103000,
        low: 101500,
        close: 102500,
        volume: 1000
      },
      {
        timestamp: '2025-01-01T04:00:00Z',
        open: 102500,
        high: 104500, // Hits TP2
        low: 102000,
        close: 104000,
        volume: 1000
      }
    ]));
    
    const result = await runBacktest(input);
    
    expect(result.tp1Hit).toBe(true);
    expect(result.tp2Hit).toBe(true);
    expect(result.tp3Hit).toBe(false);
    expect(result.profitLossUsd).toBeCloseTo(2200, 2);
    expect(result.status).toBe('completed_success');
  });
});

// ============================================================================
// TYPE SAFETY TESTS
// ============================================================================

describe('Backtesting Engine - TypeScript Types', () => {
  
  test('should have correct BacktestInput type', () => {
    const input: BacktestInput = createValidBacktestInput();
    
    expect(typeof input.tradeId).toBe('string');
    expect(typeof input.symbol).toBe('string');
    expect(typeof input.entryPrice).toBe('number');
    expect(typeof input.tp1Price).toBe('number');
    expect(typeof input.tp1Allocation).toBe('number');
    expect(typeof input.tp2Price).toBe('number');
    expect(typeof input.tp2Allocation).toBe('number');
    expect(typeof input.tp3Price).toBe('number');
    expect(typeof input.tp3Allocation).toBe('number');
    expect(typeof input.stopLossPrice).toBe('number');
    expect(typeof input.timeframe).toBe('string');
    expect(typeof input.timeframeHours).toBe('number');
    expect(input.generatedAt).toBeInstanceOf(Date);
  });
  
  test('should have correct BacktestResult type', async () => {
    const input = createValidBacktestInput();
    
    mockQueryHistoricalPrices.mockResolvedValue(createMockHistoricalData([
      {
        timestamp: '2025-01-01T01:00:00Z',
        open: 100000,
        high: 106500,
        low: 99000,
        close: 106000,
        volume: 1000
      }
    ]));
    
    const result: BacktestResult = await runBacktest(input);
    
    expect(typeof result.actualEntryPrice).toBe('number');
    expect(typeof result.tp1Hit).toBe('boolean');
    expect(typeof result.tp2Hit).toBe('boolean');
    expect(typeof result.tp3Hit).toBe('boolean');
    expect(typeof result.stopLossHit).toBe('boolean');
    expect(typeof result.profitLossUsd).toBe('number');
    expect(typeof result.profitLossPercentage).toBe('number');
    expect(typeof result.tradeDurationMinutes).toBe('number');
    expect(typeof result.netProfitLossUsd).toBe('number');
    expect(typeof result.dataSource).toBe('string');
    expect(typeof result.dataResolution).toBe('string');
    expect(typeof result.dataQualityScore).toBe('number');
    expect(typeof result.status).toBe('string');
    
    // Optional fields
    if (result.tp1HitAt) {
      expect(result.tp1HitAt).toBeInstanceOf(Date);
    }
    if (result.tp1HitPrice) {
      expect(typeof result.tp1HitPrice).toBe('number');
    }
  });
});
