/**
 * Unit Tests: Price Aggregation
 * 
 * Tests for multi-exchange price aggregation and VWAP calculation
 */

import {
  calculateVWAP,
  detectArbitrageOpportunities,
  aggregateExchangePrices,
  calculatePriceDeviation
} from '../../../lib/ucie/priceAggregation';

describe('Price Aggregation', () => {
  describe('calculateVWAP', () => {
    test('calculates volume-weighted average price correctly', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Coinbase', price: 102, volume: 500 },
        { exchange: 'Kraken', price: 98, volume: 300 }
      ];
      
      const vwap = calculateVWAP(prices);
      
      // VWAP = (100*1000 + 102*500 + 98*300) / (1000 + 500 + 300)
      // = (100000 + 51000 + 29400) / 1800 = 180400 / 1800 = 100.22
      expect(vwap).toBeCloseTo(100.22, 2);
    });

    test('handles single exchange', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 }
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBe(100);
    });

    test('gives more weight to higher volume exchanges', () => {
      const prices1 = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 110, volume: 100 }
      ];
      
      const prices2 = [
        { exchange: 'A', price: 100, volume: 100 },
        { exchange: 'B', price: 110, volume: 1000 }
      ];
      
      const vwap1 = calculateVWAP(prices1);
      const vwap2 = calculateVWAP(prices2);
      
      expect(vwap1).toBeLessThan(vwap2);
      expect(vwap1).toBeCloseTo(100.91, 2);
      expect(vwap2).toBeCloseTo(109.09, 2);
    });

    test('handles zero volume gracefully', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 110, volume: 0 }
      ];
      
      const vwap = calculateVWAP(prices);
      
      expect(vwap).toBe(100); // Only non-zero volume counts
    });

    test('returns 0 for empty array', () => {
      const vwap = calculateVWAP([]);
      
      expect(vwap).toBe(0);
    });
  });

  describe('detectArbitrageOpportunities', () => {
    test('detects arbitrage when price difference exceeds threshold', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Coinbase', price: 105, volume: 500 }, // 5% higher
        { exchange: 'Kraken', price: 98, volume: 300 }
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 0.02); // 2% threshold
      
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0]).toHaveProperty('buyExchange');
      expect(opportunities[0]).toHaveProperty('sellExchange');
      expect(opportunities[0]).toHaveProperty('profitPercentage');
    });

    test('finds best arbitrage opportunity', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 103, volume: 500 },
        { exchange: 'C', price: 107, volume: 300 } // Best opportunity: buy A, sell C
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 0.01);
      
      expect(opportunities[0].buyExchange).toBe('A');
      expect(opportunities[0].sellExchange).toBe('C');
      expect(opportunities[0].profitPercentage).toBeCloseTo(7, 1);
    });

    test('returns empty array when no opportunities exist', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 100.5, volume: 500 },
        { exchange: 'C', price: 99.8, volume: 300 }
      ];
      
      const opportunities = detectArbitrageOpportunities(prices, 0.02); // 2% threshold
      
      expect(opportunities).toHaveLength(0);
    });

    test('respects threshold parameter', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 102, volume: 500 } // 2% difference
      ];
      
      const strictOpps = detectArbitrageOpportunities(prices, 0.03); // 3% threshold
      const looseOpps = detectArbitrageOpportunities(prices, 0.01); // 1% threshold
      
      expect(strictOpps).toHaveLength(0);
      expect(looseOpps.length).toBeGreaterThan(0);
    });
  });

  describe('aggregateExchangePrices', () => {
    test('aggregates prices from multiple exchanges', () => {
      const prices = [
        { exchange: 'Binance', price: 100, volume: 1000 },
        { exchange: 'Coinbase', price: 102, volume: 500 },
        { exchange: 'Kraken', price: 98, volume: 300 }
      ];
      
      const aggregated = aggregateExchangePrices(prices);
      
      expect(aggregated).toHaveProperty('vwap');
      expect(aggregated).toHaveProperty('median');
      expect(aggregated).toHaveProperty('min');
      expect(aggregated).toHaveProperty('max');
      expect(aggregated).toHaveProperty('spread');
    });

    test('calculates median correctly', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 102, volume: 500 },
        { exchange: 'C', price: 98, volume: 300 }
      ];
      
      const aggregated = aggregateExchangePrices(prices);
      
      expect(aggregated.median).toBe(100); // Middle value when sorted
    });

    test('calculates spread correctly', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 110, volume: 500 }
      ];
      
      const aggregated = aggregateExchangePrices(prices);
      
      expect(aggregated.spread).toBe(10); // 110 - 100
      expect(aggregated.min).toBe(100);
      expect(aggregated.max).toBe(110);
    });
  });

  describe('calculatePriceDeviation', () => {
    test('calculates standard deviation of prices', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 102, volume: 500 },
        { exchange: 'C', price: 98, volume: 300 }
      ];
      
      const deviation = calculatePriceDeviation(prices);
      
      expect(deviation).toBeGreaterThan(0);
      expect(typeof deviation).toBe('number');
    });

    test('returns 0 for identical prices', () => {
      const prices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 100, volume: 500 },
        { exchange: 'C', price: 100, volume: 300 }
      ];
      
      const deviation = calculatePriceDeviation(prices);
      
      expect(deviation).toBe(0);
    });

    test('higher deviation for more dispersed prices', () => {
      const tightPrices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 101, volume: 500 },
        { exchange: 'C', price: 99, volume: 300 }
      ];
      
      const widePrices = [
        { exchange: 'A', price: 100, volume: 1000 },
        { exchange: 'B', price: 110, volume: 500 },
        { exchange: 'C', price: 90, volume: 300 }
      ];
      
      const tightDev = calculatePriceDeviation(tightPrices);
      const wideDev = calculatePriceDeviation(widePrices);
      
      expect(wideDev).toBeGreaterThan(tightDev);
    });
  });
});
