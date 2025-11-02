/**
 * Unit Tests: Price Aggregation
 * 
 * Tests for multi-exchange price aggregation including:
 * - Volume-Weighted Average Price (VWAP)
 * - Price variance detection
 * - Arbitrage opportunity identification
 * - Data quality scoring
 */

import {
  calculateVWAP,
  calculatePriceVariance,
  detectArbitrageOpportunities,
  calculateDataQualityScore,
} from '../../../lib/ucie/priceAggregation';

describe('Price Aggregation', () => {
  describe('calculateVWAP', () => {
    it('should calculate volume-weighted average price correctly', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 110, volume: 500 },
        { exchange: 'Coinbase', price: 105, volume: 1500 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      // VWAP = (100*1000 + 110*500 + 105*1500) / (1000 + 500 + 1500)
      // VWAP = (100000 + 55000 + 157500) / 3000 = 312500 / 3000 = 104.17
      expect(vwap).toBeCloseTo(104.17, 2);
    });

    it('should weight higher volume exchanges more heavily', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 10000 },
        { exchange: 'Kraken', price: 200, volume: 100 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      // Should be much closer to 100 than 200
      expect(vwap).toBeCloseTo(100.99, 2);
      expect(vwap).toBeLessThan(110);
    });

    it('should handle single exchange', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBe(100);
    });

    it('should handle zero volume gracefully', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 0 },
        { exchange: 'Kraken', price: 110, volume: 1000 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      // Should only consider non-zero volume
      expect(vwap).toBe(110);
    });

    it('should return null for all zero volumes', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 0 },
        { exchange: 'Kraken', price: 110, volume: 0 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBeNull();
    });

    it('should return null for empty array', () => {
      const prices: any[] = [];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBeNull();
    });

    it('should handle decimal prices and volumes', () => {
      const prices = [
        { exchange: 'Binance', price: 100.5, volume: 1000.25 },
        { exchange: 'Kraken', price: 110.75, volume: 500.5 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBeGreaterThan(100);
      expect(vwap).toBeLessThan(111);
    });
  });

  describe('calculatePriceVariance', () => {
    it('should calculate price variance correctly', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 110, volume: 1000 },
        { exchange: 'Coinbase', price: 105, volume: 1000 },
      ];
      
      const variance = calculatePriceVariance(prices);
      
      expect(variance).toBeGreaterThan(0);
      expect(variance).toBeLessThan(100);
    });

    it('should return 0 for identical prices', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 100, volume: 1000 },
        { exchange: 'Coinbase', price: 100, volume: 1000 },
      ];
      
      const variance = calculatePriceVariance(prices);
      
      expect(variance).toBe(0);
    });

    it('should return high variance for large price differences', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 200, volume: 1000 },
      ];
      
      const variance = calculatePriceVariance(prices);
      
      // 100% difference
      expect(variance).toBeCloseTo(100, 0);
    });

    it('should calculate variance as percentage', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 102, volume: 1000 },
      ];
      
      const variance = calculatePriceVariance(prices);
      
      // 2% difference
      expect(variance).toBeCloseTo(2, 1);
    });

    it('should return null for single price', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
      ];
      
      const variance = calculatePriceVariance(prices);
      
      expect(variance).toBeNull();
    });

    it('should return null for empty array', () => {
      const prices: any[] = [];
      
      const variance = calculatePriceVariance(prices);
      
      expect(variance).toBeNull();
    });
  });

  describe('detectArbitrageOpportunities', () => {
    it('should detect arbitrage opportunities', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 110, volume: 1000 },
        { exchange: 'Coinbase', price: 105, volume: 1000 },
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 2);
      
      expect(opportunities.length).toBeGreaterThan(0);
    });

    it('should identify buy and sell exchanges correctly', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 110, volume: 1000 },
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 2);
      
      expect(opportunities[0].buyExchange).toBe('Binance');
      expect(opportunities[0].sellExchange).toBe('Kraken');
      expect(opportunities[0].buyPrice).toBe(100);
      expect(opportunities[0].sellPrice).toBe(110);
    });

    it('should calculate profit percentage correctly', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 110, volume: 1000 },
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 2);
      
      // (110 - 100) / 100 * 100 = 10%
      expect(opportunities[0].profitPercentage).toBeCloseTo(10, 1);
    });

    it('should only return opportunities above threshold', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 101, volume: 1000 }, // 1% difference
        { exchange: 'Coinbase', price: 105, volume: 1000 }, // 5% difference
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 2);
      
      // Should only include opportunities > 2%
      opportunities.forEach(opp => {
        expect(opp.profitPercentage).toBeGreaterThan(2);
      });
    });

    it('should return empty array when no opportunities exist', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 100.5, volume: 1000 },
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 2);
      
      expect(opportunities).toEqual([]);
    });

    it('should sort opportunities by profit percentage', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 110, volume: 1000 },
        { exchange: 'Coinbase', price: 120, volume: 1000 },
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 2);
      
      // Should be sorted descending by profit
      for (let i = 0; i < opportunities.length - 1; i++) {
        expect(opportunities[i].profitPercentage).toBeGreaterThanOrEqual(
          opportunities[i + 1].profitPercentage
        );
      }
    });

    it('should handle custom threshold', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Kraken', price: 103, volume: 1000 },
      ];
      
      const opportunities1 = detectArbitrageOpportunities(prices, 2);
      const opportunities2 = detectArbitrageOpportunities(prices, 5);
      
      expect(opportunities1.length).toBeGreaterThan(0);
      expect(opportunities2.length).toBe(0);
    });
  });

  describe('calculateDataQualityScore', () => {
    it('should calculate data quality score correctly', () => {
      const data = {
        exchangeCount: 5,
        totalVolume: 1000000,
        priceVariance: 1.5,
        timestamp: new Date().toISOString(),
      };
      
      const score = calculateDataQualityScore(data);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give high score for good data quality', () => {
      const data = {
        exchangeCount: 10,
        totalVolume: 10000000,
        priceVariance: 0.5,
        timestamp: new Date().toISOString(),
      };
      
      const score = calculateDataQualityScore(data);
      
      expect(score).toBeGreaterThan(90);
    });

    it('should give low score for poor data quality', () => {
      const data = {
        exchangeCount: 1,
        totalVolume: 1000,
        priceVariance: 10,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour old
      };
      
      const score = calculateDataQualityScore(data);
      
      expect(score).toBeLessThan(50);
    });

    it('should penalize high price variance', () => {
      const lowVariance = {
        exchangeCount: 5,
        totalVolume: 1000000,
        priceVariance: 0.5,
        timestamp: new Date().toISOString(),
      };
      
      const highVariance = {
        exchangeCount: 5,
        totalVolume: 1000000,
        priceVariance: 10,
        timestamp: new Date().toISOString(),
      };
      
      const scoreLow = calculateDataQualityScore(lowVariance);
      const scoreHigh = calculateDataQualityScore(highVariance);
      
      expect(scoreLow).toBeGreaterThan(scoreHigh);
    });

    it('should reward more exchanges', () => {
      const fewExchanges = {
        exchangeCount: 2,
        totalVolume: 1000000,
        priceVariance: 1,
        timestamp: new Date().toISOString(),
      };
      
      const manyExchanges = {
        exchangeCount: 10,
        totalVolume: 1000000,
        priceVariance: 1,
        timestamp: new Date().toISOString(),
      };
      
      const scoreFew = calculateDataQualityScore(fewExchanges);
      const scoreMany = calculateDataQualityScore(manyExchanges);
      
      expect(scoreMany).toBeGreaterThan(scoreFew);
    });

    it('should reward higher volume', () => {
      const lowVolume = {
        exchangeCount: 5,
        totalVolume: 10000,
        priceVariance: 1,
        timestamp: new Date().toISOString(),
      };
      
      const highVolume = {
        exchangeCount: 5,
        totalVolume: 10000000,
        priceVariance: 1,
        timestamp: new Date().toISOString(),
      };
      
      const scoreLow = calculateDataQualityScore(lowVolume);
      const scoreHigh = calculateDataQualityScore(highVolume);
      
      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    it('should penalize stale data', () => {
      const fresh = {
        exchangeCount: 5,
        totalVolume: 1000000,
        priceVariance: 1,
        timestamp: new Date().toISOString(),
      };
      
      const stale = {
        exchangeCount: 5,
        totalVolume: 1000000,
        priceVariance: 1,
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours old
      };
      
      const scoreFresh = calculateDataQualityScore(fresh);
      const scoreStale = calculateDataQualityScore(stale);
      
      expect(scoreFresh).toBeGreaterThan(scoreStale);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative prices', () => {
      const prices = [
        { exchange: 'Binance', price: -100, volume: 1000 },
        { exchange: 'Kraken', price: -110, volume: 1000 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBeLessThan(0);
    });

    it('should handle very large numbers', () => {
      const prices = [
        { exchange: 'Binance', price: 1e10, volume: 1e10 },
        { exchange: 'Kraken', price: 1e10 + 1, volume: 1e10 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBeGreaterThan(1e10);
    });

    it('should handle very small numbers', () => {
      const prices = [
        { exchange: 'Binance', price: 0.0001, volume: 0.0001 },
        { exchange: 'Kraken', price: 0.0002, volume: 0.0001 },
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBeGreaterThan(0);
      expect(vwap).toBeLessThan(0.001);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const prices = Array.from({ length: 100 }, (_, i) => ({
        exchange: `Exchange${i}`,
        price: 100 + Math.random() * 10,
        volume: 1000 + Math.random() * 1000,
      }));
      
      const start = Date.now();
      calculateVWAP(prices);
      calculatePriceVariance(prices);
      detectArbitrageOpportunities(prices, 2);
      const duration = Date.now() - start;
      
      // Should complete in under 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
