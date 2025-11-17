/**
 * Unit Tests for ATGE Backtesting Engine
 * 
 * Tests all scenarios for the backtesting engine including:
 * - Target hit detection (TP1, TP2, TP3, Stop Loss)
 * - Profit/Loss calculations
 * - Edge cases (expired, immediate SL, all TPs hit, partial fills)
 * - Data quality validation
 * - Invalid trade parameters
 * 
 * Requirements: Task 6.2 (Target Hit Detection), Task 6.4 (Edge Cases)
 */

import { runBacktest, BacktestInput, BacktestResult } from '../lib/atge/backtestingEngine';
import * as historicalPriceQuery from '../lib/atge/historicalPriceQuery';

// Mock the historicalPriceQuery module
jest.mock('../lib/atge/historicalPriceQuery');

describe('Backtesting Engine - Unit Tests', () => {
  const baseDate = new Date('2025-01-01T00:00:00Z');
  
  // Helper to create mock historical price data
  function createMockPriceData(
    count: number,
    startPrice: number,
    priceChanges: number[],
    intervalMinutes: number = 15
  ) {
    const data = [];
    let currentPrice = startPrice;
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(baseDate.getTime() + i * intervalMinutes * 60 * 1000);
      const change = priceChanges[i] || 0;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.abs(change) * 0.1;
      const low = Math.min(open, close) - Math.abs(change) * 0.1;
      
      data.push({
        timestamp: timestamp.toISOString(),
        open,
        high,
        low,
        close,
        volume: 1000000
      });
      
      currentPrice = close;
    }
    
    return data;
  }
  
  // Helper to create base trade input
  function createBaseTradeInput(overrides: Partial<BacktestInput> = {}): BacktestInput {
    return {
      tradeId: 'test-trade-123',
      symbol: 'BTC',
      entryPrice: 100,
      tp1Price: 105,
      tp1Allocation: 30,
      tp2Price: 110,
      tp2Allocation: 40,
      tp3Price: 115,
      tp3Allocation: 30,
      stopLossPrice: 95,
      timeframe: '15m',
      timeframeHours: 4,
      generatedAt: baseDate,
      ...overrides
    };
  }
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // ============================================================================
  // SCENARIO 1: All 3 TPs Hit in Sequence
  // ============================================================================
  
  describe('Scenario: All 3 TPs Hit in Sequence', () => {
    it('should detect all three take profit targets being hit', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Create price data that hits all TPs
      const mockData = createMockPriceData(20, 100, [
        1, 1, 1, 2, 2,    // Gradual rise to TP1 (105)
        2, 2, 3, 3, 3,    // Rise to TP2 (110)
        2, 2, 3, 3, 5,    // Rise to TP3 (115)
        0, 0, 0, 0, 0     // Stable after
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.tp1Hit).toBe(true);
      expect(result.tp2Hit).toBe(true);
      expect(result.tp3Hit).toBe(true);
      expect(result.stopLossHit).toBe(false);
      expect(result.status).toBe('completed_success');
      
      // Verify P/L calculation
      const expectedPL = 
        (105 - 100) * 0.30 +  // TP1: +1.5
        (110 - 100) * 0.40 +  // TP2: +4.0
        (115 - 100) * 0.30;   // TP3: +4.5
      expect(result.profitLossUsd).toBeCloseTo(expectedPL, 2);
      expect(result.profitLossPercentage).toBeCloseTo((expectedPL / 100) * 100, 2);
    });
    
    it('should record correct timestamps for each TP hit', async () => {
      const tradeInput = createBaseTradeInput();
      
      const mockData = createMockPriceData(20, 100, [
        1, 1, 1, 2, 2,    // TP1 hit around candle 4-5
        2, 2, 3, 3, 3,    // TP2 hit around candle 9-10
        2, 2, 3, 3, 5,    // TP3 hit around candle 14-15
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.tp1HitAt).toBeDefined();
      expect(result.tp2HitAt).toBeDefined();
      expect(result.tp3HitAt).toBeDefined();
      
      // Verify timestamps are in chronological order
      expect(result.tp1HitAt!.getTime()).toBeLessThan(result.tp2HitAt!.getTime());
      expect(result.tp2HitAt!.getTime()).toBeLessThan(result.tp3HitAt!.getTime());
    });
  });
  
  // ============================================================================
  // SCENARIO 2: Stop Loss Hit Immediately (First Candle)
  // ============================================================================
  
  describe('Scenario: Stop Loss Hit Immediately', () => {
    it('should detect stop loss hit on first candle', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Create price data where first candle drops below SL
      const mockData = createMockPriceData(20, 100, [
        -10, 0, 0, 0, 0,  // First candle drops to 90 (below SL of 95)
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.stopLossHit).toBe(true);
      expect(result.tp1Hit).toBe(false);
      expect(result.tp2Hit).toBe(false);
      expect(result.tp3Hit).toBe(false);
      expect(result.status).toBe('completed_failure');
      
      // Verify loss calculation (100% position stopped out)
      const expectedLoss = (95 - 100) * 1.0; // -5
      expect(result.profitLossUsd).toBeCloseTo(expectedLoss, 2);
      expect(result.profitLossPercentage).toBeCloseTo(-5, 2);
    });
    
    it('should end trade immediately when SL is hit', async () => {
      const tradeInput = createBaseTradeInput();
      
      const mockData = createMockPriceData(20, 100, [
        -10, 20, 20, 20, 20,  // SL hit first, then price recovers
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      // Even though price recovers, trade should end at SL
      expect(result.stopLossHit).toBe(true);
      expect(result.tp1Hit).toBe(false);
      expect(result.status).toBe('completed_failure');
    });
  });
  
  // ============================================================================
  // SCENARIO 3: Partial Fills (Some TPs Hit, Others Not)
  // ============================================================================
  
  describe('Scenario: Partial Fills', () => {
    it('should handle TP1 and TP2 hit, but TP3 not reached', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Price rises to TP2 but not TP3
      const mockData = createMockPriceData(20, 100, [
        1, 1, 1, 2, 2,    // TP1 hit (105)
        2, 2, 3, 0, 0,    // TP2 hit (110)
        0, 0, 0, 0, 0,    // Price stays at 110, TP3 not hit
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.tp1Hit).toBe(true);
      expect(result.tp2Hit).toBe(true);
      expect(result.tp3Hit).toBe(false);
      expect(result.stopLossHit).toBe(false);
      expect(result.status).toBe('completed_success'); // Partial success
      
      // Verify P/L calculation (only TP1 and TP2)
      const expectedPL = 
        (105 - 100) * 0.30 +  // TP1: +1.5
        (110 - 100) * 0.40;   // TP2: +4.0
      expect(result.profitLossUsd).toBeCloseTo(expectedPL, 2);
    });
    
    it('should handle only TP1 hit before expiry', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Price rises to TP1 only
      const mockData = createMockPriceData(20, 100, [
        1, 1, 1, 2, 0,    // TP1 hit (105)
        0, 0, 0, 0, 0,    // Price stays at 105
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.tp1Hit).toBe(true);
      expect(result.tp2Hit).toBe(false);
      expect(result.tp3Hit).toBe(false);
      expect(result.status).toBe('completed_success');
      
      // Verify P/L calculation (only TP1)
      const expectedPL = (105 - 100) * 0.30; // +1.5
      expect(result.profitLossUsd).toBeCloseTo(expectedPL, 2);
    });
  });
  
  // ============================================================================
  // SCENARIO 4: Trade Expires Without Hitting Any Target
  // ============================================================================
  
  describe('Scenario: Trade Expires Without Hitting Targets', () => {
    it('should return expired status when no targets are hit', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Price stays between entry and TP1, never hits any target
      const mockData = createMockPriceData(20, 100, [
        0.5, 0.5, 0.5, 0.5, 0.5,  // Price at 102.5
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.tp1Hit).toBe(false);
      expect(result.tp2Hit).toBe(false);
      expect(result.tp3Hit).toBe(false);
      expect(result.stopLossHit).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.profitLossUsd).toBe(0);
      expect(result.profitLossPercentage).toBe(0);
    });
    
    it('should calculate full timeframe duration for expired trades', async () => {
      const tradeInput = createBaseTradeInput({ timeframeHours: 4 });
      
      const mockData = createMockPriceData(16, 100, Array(16).fill(0.5));
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('expired');
      expect(result.tradeDurationMinutes).toBe(4 * 60); // 240 minutes
    });
  });
  
  // ============================================================================
  // SCENARIO 5: Insufficient Data Quality (<70%)
  // ============================================================================
  
  describe('Scenario: Insufficient Data Quality', () => {
    it('should return incomplete_data status when quality < 70%', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Return low quality data
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: createMockPriceData(5, 100, [1, 1, 1, 1, 1]), // Very few candles
        dataQuality: 50, // Below 70% threshold
        gaps: [{ start: '2025-01-01T01:00:00Z', end: '2025-01-01T03:00:00Z' }]
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.dataQualityScore).toBe(50);
      expect(result.errorMessage).toContain('Insufficient data quality');
      expect(result.errorMessage).toContain('50%');
      expect(result.errorMessage).toContain('minimum 70% required');
    });
    
    it('should not attempt backtesting with insufficient data', async () => {
      const tradeInput = createBaseTradeInput();
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: [],
        dataQuality: 0,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.tp1Hit).toBe(false);
      expect(result.tp2Hit).toBe(false);
      expect(result.tp3Hit).toBe(false);
      expect(result.stopLossHit).toBe(false);
    });
  });
  
  // ============================================================================
  // SCENARIO 6: Invalid Trade Parameters
  // ============================================================================
  
  describe('Scenario: Invalid Trade Parameters', () => {
    it('should reject negative entry price', async () => {
      const tradeInput = createBaseTradeInput({ entryPrice: -100 });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.errorMessage).toContain('Entry price must be positive');
    });
    
    it('should reject allocations that do not sum to 100%', async () => {
      const tradeInput = createBaseTradeInput({
        tp1Allocation: 30,
        tp2Allocation: 30,
        tp3Allocation: 30 // Total = 90%, not 100%
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.errorMessage).toContain('Allocations must sum to 100%');
    });
    
    it('should reject TP1 price below entry price', async () => {
      const tradeInput = createBaseTradeInput({
        entryPrice: 100,
        tp1Price: 95 // Below entry
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.errorMessage).toContain('TP1 price must be above entry price');
    });
    
    it('should reject stop loss above entry price', async () => {
      const tradeInput = createBaseTradeInput({
        entryPrice: 100,
        stopLossPrice: 105 // Above entry
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.errorMessage).toContain('Stop loss price must be below entry price');
    });
    
    it('should reject negative timeframe hours', async () => {
      const tradeInput = createBaseTradeInput({ timeframeHours: -4 });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('incomplete_data');
      expect(result.errorMessage).toContain('Timeframe hours must be positive');
    });
  });
  
  // ============================================================================
  // SCENARIO 7: Stop Loss Priority Over TPs
  // ============================================================================
  
  describe('Scenario: Stop Loss Priority', () => {
    it('should check stop loss before TPs on same candle', async () => {
      const tradeInput = createBaseTradeInput();
      
      // Create a candle where both SL and TP1 could be hit
      const mockData = [{
        timestamp: baseDate.toISOString(),
        open: 100,
        high: 110, // High enough to hit TP1
        low: 90,   // Low enough to hit SL
        close: 95,
        volume: 1000000
      }];
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      // SL should be hit, not TP1
      expect(result.stopLossHit).toBe(true);
      expect(result.tp1Hit).toBe(false);
      expect(result.status).toBe('completed_failure');
    });
  });
  
  // ============================================================================
  // SCENARIO 8: Remaining Allocation Tracking
  // ============================================================================
  
  describe('Scenario: Remaining Allocation Tracking', () => {
    it('should reduce remaining allocation after each TP hit', async () => {
      const tradeInput = createBaseTradeInput({
        tp1Allocation: 40,
        tp2Allocation: 30,
        tp3Allocation: 30
      });
      
      // Hit TP1, then SL
      const mockData = createMockPriceData(20, 100, [
        1, 1, 1, 2, 2,    // TP1 hit (105)
        -10, 0, 0, 0, 0,  // SL hit (95)
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.tp1Hit).toBe(true);
      expect(result.stopLossHit).toBe(true);
      
      // P/L should be: TP1 profit (40%) + SL loss (60%)
      const tp1Profit = (105 - 100) * 0.40; // +2.0
      const slLoss = (95 - 100) * 0.60;     // -3.0
      const expectedPL = tp1Profit + slLoss; // -1.0
      
      expect(result.profitLossUsd).toBeCloseTo(expectedPL, 2);
    });
  });
  
  // ============================================================================
  // SCENARIO 9: Trade Duration Calculation
  // ============================================================================
  
  describe('Scenario: Trade Duration Calculation', () => {
    it('should calculate duration from entry to TP3 hit', async () => {
      const tradeInput = createBaseTradeInput();
      
      // TP3 hit after 10 candles (150 minutes)
      const mockData = createMockPriceData(20, 100, [
        1, 1, 1, 2, 2,    // TP1
        2, 2, 3, 3, 3,    // TP2
        2, 2, 3, 3, 5,    // TP3 at candle 14
        0, 0, 0, 0, 0
      ]);
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('completed_success');
      expect(result.tradeDurationMinutes).toBeGreaterThan(0);
      expect(result.tradeDurationMinutes).toBeLessThanOrEqual(tradeInput.timeframeHours * 60);
    });
    
    it('should use full timeframe duration for expired trades', async () => {
      const tradeInput = createBaseTradeInput({ timeframeHours: 2 });
      
      const mockData = createMockPriceData(8, 100, Array(8).fill(0.5));
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 95,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.status).toBe('expired');
      expect(result.tradeDurationMinutes).toBe(2 * 60); // 120 minutes
    });
  });
  
  // ============================================================================
  // SCENARIO 10: Data Quality Score Passthrough
  // ============================================================================
  
  describe('Scenario: Data Quality Score', () => {
    it('should include data quality score in result', async () => {
      const tradeInput = createBaseTradeInput();
      
      const mockData = createMockPriceData(16, 100, Array(16).fill(1));
      
      (historicalPriceQuery.queryHistoricalPrices as jest.Mock).mockResolvedValue({
        data: mockData,
        dataQuality: 85,
        gaps: []
      });
      
      const result = await runBacktest(tradeInput);
      
      expect(result.dataQualityScore).toBe(85);
      expect(result.dataSource).toBe('coingecko');
      expect(result.dataResolution).toBe('15m');
    });
  });
});
