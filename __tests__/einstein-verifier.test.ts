/**
 * Einstein Data Accuracy Verifier - Unit Tests
 * 
 * Tests for data refresh, freshness validation, change detection, and health monitoring
 */

import { DataAccuracyVerifier } from '../lib/einstein/data/verifier';
import type { ComprehensiveData } from '../lib/einstein/types';

describe('DataAccuracyVerifier', () => {
  let verifier: DataAccuracyVerifier;

  beforeEach(() => {
    verifier = new DataAccuracyVerifier('BTC', '1h');
  });

  describe('constructor', () => {
    it('should create verifier with symbol and timeframe', () => {
      expect(verifier).toBeDefined();
      expect(verifier.getLastRefreshTime()).toBeNull();
      expect(verifier.getCachedData()).toBeNull();
    });

    it('should uppercase symbol', () => {
      const btcVerifier = new DataAccuracyVerifier('btc', '1h');
      expect(btcVerifier).toBeDefined();
    });
  });

  describe('validateDataFreshness', () => {
    it('should validate fresh data correctly', () => {
      const now = new Date().toISOString();
      const data: ComprehensiveData = createMockData(now);

      const result = verifier.validateDataFreshness(data);

      expect(result.overall).toBe(true);
      expect(result.market.fresh).toBe(true);
      expect(result.sentiment.fresh).toBe(true);
      expect(result.onChain.fresh).toBe(true);
      expect(result.technical.fresh).toBe(true);
      expect(result.news.fresh).toBe(true);
    });

    it('should detect stale data', () => {
      // Create data from 10 minutes ago (stale)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const data: ComprehensiveData = createMockData(tenMinutesAgo);

      const result = verifier.validateDataFreshness(data);

      expect(result.overall).toBe(false);
      expect(result.market.fresh).toBe(false);
      expect(result.market.age).toBeGreaterThan(300); // > 5 minutes
    });

    it('should calculate age in seconds correctly', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const data: ComprehensiveData = createMockData(oneMinuteAgo);

      const result = verifier.validateDataFreshness(data);

      expect(result.market.age).toBeGreaterThanOrEqual(59);
      expect(result.market.age).toBeLessThanOrEqual(61);
    });
  });

  describe('compareDataChanges', () => {
    it('should detect price changes', () => {
      const oldData = createMockData(new Date().toISOString(), 50000);
      const newData = createMockData(new Date().toISOString(), 51000);

      const changes = verifier.compareDataChanges(oldData, newData);

      expect(changes.priceChanged).toBe(true);
      expect(changes.priceDelta).toBe(1000);
    });

    it('should detect no changes when data is identical', () => {
      const timestamp = new Date().toISOString();
      const oldData = createMockData(timestamp, 50000);
      const newData = createMockData(timestamp, 50000);

      const changes = verifier.compareDataChanges(oldData, newData);

      expect(changes.priceChanged).toBe(false);
      expect(changes.priceDelta).toBe(0);
      expect(changes.indicatorsChanged).toHaveLength(0);
      expect(changes.significantChanges).toBe(false);
    });

    it('should detect significant price changes', () => {
      const oldData = createMockData(new Date().toISOString(), 50000);
      const newData = createMockData(new Date().toISOString(), 52000); // 4% change

      const changes = verifier.compareDataChanges(oldData, newData);

      expect(changes.significantChanges).toBe(true);
    });

    it('should detect indicator changes', () => {
      const oldData = createMockData(new Date().toISOString(), 50000);
      const newData = createMockData(new Date().toISOString(), 50000);
      
      // Change RSI
      newData.technical.indicators.rsi = 70;

      const changes = verifier.compareDataChanges(oldData, newData);

      expect(changes.indicatorsChanged).toContain('RSI');
    });
  });

  describe('getLastRefreshTime', () => {
    it('should return null initially', () => {
      expect(verifier.getLastRefreshTime()).toBeNull();
    });
  });

  describe('getCachedData', () => {
    it('should return null initially', () => {
      expect(verifier.getCachedData()).toBeNull();
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create mock comprehensive data for testing
 */
function createMockData(timestamp: string, price: number = 50000): ComprehensiveData {
  return {
    market: {
      price,
      volume24h: 1000000000,
      marketCap: 1000000000000,
      change24h: 2.5,
      high24h: price + 1000,
      low24h: price - 1000,
      timestamp,
      source: 'test'
    },
    sentiment: {
      social: {
        lunarCrush: {
          galaxyScore: 75,
          altRank: 1,
          socialScore: 80
        },
        twitter: {
          mentions: 1000,
          sentiment: 0.5
        },
        reddit: {
          posts: 500,
          sentiment: 0.6
        }
      },
      news: {
        articles: 10,
        sentiment: 0.7,
        trending: true
      },
      timestamp
    },
    onChain: {
      whaleActivity: {
        transactions: 50,
        totalValue: 500000000,
        averageSize: 10000000
      },
      exchangeFlows: {
        deposits: 100000000,
        withdrawals: 150000000,
        netFlow: 50000000
      },
      holderDistribution: {
        whales: 100,
        retail: 10000,
        concentration: 60
      },
      timestamp
    },
    technical: {
      indicators: {
        rsi: 55,
        macd: {
          value: 100,
          signal: 90,
          histogram: 10
        },
        ema: {
          ema9: price - 100,
          ema21: price - 200,
          ema50: price - 500,
          ema200: price - 2000
        },
        bollingerBands: {
          upper: price + 1000,
          middle: price,
          lower: price - 1000
        },
        atr: 500,
        stochastic: {
          k: 60,
          d: 55
        }
      },
      timeframe: '1h',
      timestamp
    },
    news: {
      articles: [
        {
          title: 'Test Article',
          source: 'Test Source',
          sentiment: 0.5,
          timestamp
        }
      ],
      timestamp
    },
    timestamp
  };
}
