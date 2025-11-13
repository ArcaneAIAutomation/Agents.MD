/**
 * ATGE Database Functions - Unit Tests
 * Bitcoin Sovereign Technology - AI Trade Generation Engine
 * 
 * Tests for database utility functions including:
 * - Trade signal insertion and retrieval
 * - Filtering and sorting
 * - Foreign key constraints
 * - Unique constraints
 */

import {
  storeTradeSignal,
  fetchTradeSignal,
  fetchAllTrades,
  updateTradeStatus,
  storeTradeResults,
  storeTechnicalIndicators,
  storeMarketSnapshot,
  storeHistoricalPrices,
  TradeSignal,
  TradeResult,
  TechnicalIndicators,
  MarketSnapshot,
  HistoricalPrice
} from '../../../lib/atge/database';
import { query } from '../../../lib/db';

// ============================================================================
// TEST SETUP & TEARDOWN
// ============================================================================

describe('ATGE Database Functions', () => {
  let testUserId: string;
  let testTradeSignalId: string;

  beforeAll(async () => {
    // Create a test user for foreign key relationships
    const userResult = await query(`
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id
    `, ['test-atge@example.com', 'test-hash']);
    
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testTradeSignalId) {
      await query('DELETE FROM trade_signals WHERE id = $1', [testTradeSignalId]);
    }
    if (testUserId) {
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  // ============================================================================
  // TRADE SIGNAL TESTS
  // ============================================================================

  describe('storeTradeSignal', () => {
    it('should insert a new trade signal and return it with generated ID', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

      const signalData = {
        userId: testUserId,
        symbol: 'BTC',
        status: 'active' as const,
        entryPrice: 95000,
        tp1Price: 96000,
        tp1Allocation: 40,
        tp2Price: 97000,
        tp2Allocation: 30,
        tp3Price: 98000,
        tp3Allocation: 30,
        stopLossPrice: 94000,
        stopLossPercentage: 1.05,
        timeframe: '4h' as const,
        timeframeHours: 4,
        confidenceScore: 75,
        riskRewardRatio: 2.5,
        marketCondition: 'trending' as const,
        aiReasoning: 'Strong bullish momentum with RSI confirmation',
        aiModelVersion: 'gpt-4o-2024-11-20',
        generatedAt: now,
        expiresAt: expiresAt
      };

      const result = await storeTradeSignal(signalData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.symbol).toBe('BTC');
      expect(result.status).toBe('active');
      expect(result.entryPrice).toBe(95000);
      expect(result.confidenceScore).toBe(75);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Store for cleanup
      testTradeSignalId = result.id;
    });

    it('should enforce NOT NULL constraints on required fields', async () => {
      const invalidSignal = {
        userId: testUserId,
        symbol: 'BTC',
        status: 'active' as const,
        // Missing required fields like entryPrice
      } as any;

      await expect(storeTradeSignal(invalidSignal)).rejects.toThrow();
    });

    it('should enforce CHECK constraint on confidence score (0-100)', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      const invalidSignal = {
        userId: testUserId,
        symbol: 'BTC',
        status: 'active' as const,
        entryPrice: 95000,
        tp1Price: 96000,
        tp1Allocation: 40,
        tp2Price: 97000,
        tp2Allocation: 30,
        tp3Price: 98000,
        tp3Allocation: 30,
        stopLossPrice: 94000,
        stopLossPercentage: 1.05,
        timeframe: '4h' as const,
        timeframeHours: 4,
        confidenceScore: 150, // Invalid: > 100
        riskRewardRatio: 2.5,
        marketCondition: 'trending' as const,
        aiReasoning: 'Test',
        aiModelVersion: 'gpt-4o',
        generatedAt: now,
        expiresAt: expiresAt
      };

      await expect(storeTradeSignal(invalidSignal)).rejects.toThrow();
    });
  });

  describe('fetchTradeSignal', () => {
    it('should retrieve a trade signal by ID', async () => {
      const result = await fetchTradeSignal(testTradeSignalId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testTradeSignalId);
      expect(result?.userId).toBe(testUserId);
      expect(result?.symbol).toBe('BTC');
    });

    it('should return null for non-existent trade signal', async () => {
      const result = await fetchTradeSignal('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('fetchAllTrades', () => {
    it('should fetch all trades without filters', async () => {
      const results = await fetchAllTrades();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter trades by userId', async () => {
      const results = await fetchAllTrades({ userId: testUserId });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(trade => {
        expect(trade.userId).toBe(testUserId);
      });
    });

    it('should filter trades by symbol', async () => {
      const results = await fetchAllTrades({ symbol: 'BTC' });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(trade => {
        expect(trade.symbol).toBe('BTC');
      });
    });

    it('should filter trades by status', async () => {
      const results = await fetchAllTrades({ status: 'active' });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(trade => {
        expect(trade.status).toBe('active');
      });
    });

    it('should filter trades by timeframe', async () => {
      const results = await fetchAllTrades({ timeframe: '4h' });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(trade => {
        expect(trade.timeframe).toBe('4h');
      });
    });

    it('should filter trades by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const results = await fetchAllTrades({ startDate, endDate });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(trade => {
        expect(trade.generatedAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(trade.generatedAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should apply limit and offset for pagination', async () => {
      const page1 = await fetchAllTrades({ limit: 5, offset: 0 });
      const page2 = await fetchAllTrades({ limit: 5, offset: 5 });

      expect(page1.length).toBeLessThanOrEqual(5);
      expect(page2.length).toBeLessThanOrEqual(5);
      
      // Ensure different results (if enough data exists)
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it('should sort trades by generated_at DESC', async () => {
      const results = await fetchAllTrades({ limit: 10 });

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].generatedAt.getTime()).toBeGreaterThanOrEqual(
            results[i + 1].generatedAt.getTime()
          );
        }
      }
    });

    it('should combine multiple filters', async () => {
      const results = await fetchAllTrades({
        userId: testUserId,
        symbol: 'BTC',
        status: 'active',
        limit: 10
      });

      expect(Array.isArray(results)).toBe(true);
      results.forEach(trade => {
        expect(trade.userId).toBe(testUserId);
        expect(trade.symbol).toBe('BTC');
        expect(trade.status).toBe('active');
      });
    });
  });

  describe('updateTradeStatus', () => {
    it('should update trade signal status', async () => {
      await updateTradeStatus(testTradeSignalId, 'completed_success');

      const updated = await fetchTradeSignal(testTradeSignalId);
      expect(updated?.status).toBe('completed_success');

      // Reset for other tests
      await updateTradeStatus(testTradeSignalId, 'active');
    });

    it('should update updated_at timestamp', async () => {
      const before = await fetchTradeSignal(testTradeSignalId);
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await updateTradeStatus(testTradeSignalId, 'expired');
      
      const after = await fetchTradeSignal(testTradeSignalId);
      
      expect(after?.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());

      // Reset
      await updateTradeStatus(testTradeSignalId, 'active');
    });
  });

  // ============================================================================
  // TRADE RESULTS TESTS
  // ============================================================================

  describe('storeTradeResults', () => {
    it('should insert trade results with foreign key to trade_signals', async () => {
      const resultsData = {
        tradeSignalId: testTradeSignalId,
        actualEntryPrice: 95000,
        actualExitPrice: 96500,
        tp1Hit: true,
        tp1HitAt: new Date(),
        tp1HitPrice: 96000,
        tp2Hit: true,
        tp2HitAt: new Date(),
        tp2HitPrice: 97000,
        tp3Hit: false,
        stopLossHit: false,
        profitLossUsd: 87.50,
        profitLossPercentage: 1.58,
        tradeDurationMinutes: 180,
        tradeSizeUsd: 1000,
        feesUsd: 2,
        slippageUsd: 2,
        netProfitLossUsd: 83.50,
        dataSource: 'CoinMarketCap',
        dataResolution: '1m',
        dataQualityScore: 95,
        aiAnalysis: 'Trade succeeded due to strong momentum',
        backtestedAt: new Date()
      };

      const result = await storeTradeResults(resultsData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tradeSignalId).toBe(testTradeSignalId);
      expect(result.tp1Hit).toBe(true);
      expect(result.tp2Hit).toBe(true);
      expect(result.tp3Hit).toBe(false);
      expect(result.profitLossUsd).toBe(87.50);
      expect(result.netProfitLossUsd).toBe(83.50);
    });

    it('should enforce unique constraint on trade_signal_id', async () => {
      const duplicateResults = {
        tradeSignalId: testTradeSignalId,
        actualEntryPrice: 95000,
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        stopLossHit: false,
        tradeSizeUsd: 1000,
        feesUsd: 2,
        slippageUsd: 2,
        dataSource: 'CoinGecko',
        dataResolution: '1m',
        dataQualityScore: 90,
        backtestedAt: new Date()
      };

      await expect(storeTradeResults(duplicateResults)).rejects.toThrow();
    });

    it('should enforce foreign key constraint', async () => {
      const invalidResults = {
        tradeSignalId: '00000000-0000-0000-0000-000000000000', // Non-existent
        actualEntryPrice: 95000,
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        stopLossHit: false,
        tradeSizeUsd: 1000,
        feesUsd: 2,
        slippageUsd: 2,
        dataSource: 'CoinGecko',
        dataResolution: '1m',
        dataQualityScore: 90,
        backtestedAt: new Date()
      };

      await expect(storeTradeResults(invalidResults)).rejects.toThrow();
    });

    it('should enforce CHECK constraint on data_quality_score (0-100)', async () => {
      // First delete existing result to avoid unique constraint
      await query('DELETE FROM trade_results WHERE trade_signal_id = $1', [testTradeSignalId]);

      const invalidResults = {
        tradeSignalId: testTradeSignalId,
        actualEntryPrice: 95000,
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        stopLossHit: false,
        tradeSizeUsd: 1000,
        feesUsd: 2,
        slippageUsd: 2,
        dataSource: 'CoinGecko',
        dataResolution: '1m',
        dataQualityScore: 150, // Invalid: > 100
        backtestedAt: new Date()
      };

      await expect(storeTradeResults(invalidResults)).rejects.toThrow();
    });
  });

  // ============================================================================
  // TECHNICAL INDICATORS TESTS
  // ============================================================================

  describe('storeTechnicalIndicators', () => {
    it('should insert technical indicators with foreign key to trade_signals', async () => {
      const indicatorsData = {
        tradeSignalId: testTradeSignalId,
        rsiValue: 65.5,
        macdValue: 150.25,
        macdSignal: 145.30,
        macdHistogram: 4.95,
        ema20: 94500,
        ema50: 93000,
        ema200: 90000,
        bollingerUpper: 96000,
        bollingerMiddle: 95000,
        bollingerLower: 94000,
        atrValue: 1200,
        volume24h: 25000000000,
        marketCap: 1800000000000
      };

      const result = await storeTechnicalIndicators(indicatorsData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tradeSignalId).toBe(testTradeSignalId);
      expect(result.rsiValue).toBe(65.5);
      expect(result.macdValue).toBe(150.25);
      expect(result.ema20).toBe(94500);
    });

    it('should enforce unique constraint on trade_signal_id', async () => {
      const duplicateIndicators = {
        tradeSignalId: testTradeSignalId,
        rsiValue: 70,
        ema20: 95000
      };

      await expect(storeTechnicalIndicators(duplicateIndicators)).rejects.toThrow();
    });

    it('should enforce foreign key constraint', async () => {
      const invalidIndicators = {
        tradeSignalId: '00000000-0000-0000-0000-000000000000',
        rsiValue: 65
      };

      await expect(storeTechnicalIndicators(invalidIndicators)).rejects.toThrow();
    });
  });

  // ============================================================================
  // MARKET SNAPSHOT TESTS
  // ============================================================================

  describe('storeMarketSnapshot', () => {
    it('should insert market snapshot with foreign key to trade_signals', async () => {
      const snapshotData = {
        tradeSignalId: testTradeSignalId,
        currentPrice: 95000,
        priceChange24h: 2.5,
        volume24h: 25000000000,
        marketCap: 1800000000000,
        socialSentimentScore: 75,
        whaleActivityCount: 23,
        fearGreedIndex: 65,
        snapshotAt: new Date()
      };

      const result = await storeMarketSnapshot(snapshotData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.tradeSignalId).toBe(testTradeSignalId);
      expect(result.currentPrice).toBe(95000);
      expect(result.socialSentimentScore).toBe(75);
      expect(result.whaleActivityCount).toBe(23);
    });

    it('should enforce unique constraint on trade_signal_id', async () => {
      const duplicateSnapshot = {
        tradeSignalId: testTradeSignalId,
        currentPrice: 96000,
        snapshotAt: new Date()
      };

      await expect(storeMarketSnapshot(duplicateSnapshot)).rejects.toThrow();
    });

    it('should enforce foreign key constraint', async () => {
      const invalidSnapshot = {
        tradeSignalId: '00000000-0000-0000-0000-000000000000',
        currentPrice: 95000,
        snapshotAt: new Date()
      };

      await expect(storeMarketSnapshot(invalidSnapshot)).rejects.toThrow();
    });

    it('should enforce CHECK constraints on sentiment scores', async () => {
      // Delete existing snapshot
      await query('DELETE FROM trade_market_snapshot WHERE trade_signal_id = $1', [testTradeSignalId]);

      const invalidSnapshot = {
        tradeSignalId: testTradeSignalId,
        currentPrice: 95000,
        socialSentimentScore: 150, // Invalid: > 100
        snapshotAt: new Date()
      };

      await expect(storeMarketSnapshot(invalidSnapshot)).rejects.toThrow();
    });
  });

  // ============================================================================
  // HISTORICAL PRICES TESTS
  // ============================================================================

  describe('storeHistoricalPrices', () => {
    it('should batch insert multiple historical prices', async () => {
      const now = new Date();
      const prices: Omit<HistoricalPrice, 'id' | 'createdAt'>[] = [
        {
          tradeSignalId: testTradeSignalId,
          timestamp: new Date(now.getTime() - 3 * 60 * 1000),
          openPrice: 94800,
          highPrice: 95000,
          lowPrice: 94700,
          closePrice: 94900,
          volume: 1000000,
          dataSource: 'CoinMarketCap'
        },
        {
          tradeSignalId: testTradeSignalId,
          timestamp: new Date(now.getTime() - 2 * 60 * 1000),
          openPrice: 94900,
          highPrice: 95100,
          lowPrice: 94850,
          closePrice: 95000,
          volume: 1200000,
          dataSource: 'CoinMarketCap'
        },
        {
          tradeSignalId: testTradeSignalId,
          timestamp: new Date(now.getTime() - 1 * 60 * 1000),
          openPrice: 95000,
          highPrice: 95200,
          lowPrice: 94950,
          closePrice: 95100,
          volume: 1100000,
          dataSource: 'CoinMarketCap'
        }
      ];

      await expect(storeHistoricalPrices(prices)).resolves.not.toThrow();

      // Verify insertion
      const result = await query(`
        SELECT COUNT(*) as count
        FROM trade_historical_prices
        WHERE trade_signal_id = $1
      `, [testTradeSignalId]);

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(3);
    });

    it('should handle empty array gracefully', async () => {
      await expect(storeHistoricalPrices([])).resolves.not.toThrow();
    });

    it('should enforce unique constraint on (trade_signal_id, timestamp, data_source)', async () => {
      const now = new Date();
      const duplicatePrice: Omit<HistoricalPrice, 'id' | 'createdAt'> = {
        tradeSignalId: testTradeSignalId,
        timestamp: new Date(now.getTime() - 3 * 60 * 1000), // Same as first insert
        openPrice: 94800,
        highPrice: 95000,
        lowPrice: 94700,
        closePrice: 94900,
        volume: 1000000,
        dataSource: 'CoinMarketCap' // Same source
      };

      // Should not throw due to ON CONFLICT DO NOTHING
      await expect(storeHistoricalPrices([duplicatePrice])).resolves.not.toThrow();
    });

    it('should enforce foreign key constraint', async () => {
      const invalidPrice: Omit<HistoricalPrice, 'id' | 'createdAt'> = {
        tradeSignalId: '00000000-0000-0000-0000-000000000000',
        timestamp: new Date(),
        openPrice: 95000,
        highPrice: 95100,
        lowPrice: 94900,
        closePrice: 95000,
        dataSource: 'CoinGecko'
      };

      await expect(storeHistoricalPrices([invalidPrice])).rejects.toThrow();
    });
  });
});
