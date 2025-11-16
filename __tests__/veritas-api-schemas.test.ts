/**
 * Tests for Veritas Protocol API Schema Validation
 * 
 * These tests verify that Zod schemas correctly validate API responses
 * and reject invalid data.
 */

import {
  CoinGeckoMarketDataSchema,
  CoinMarketCapQuoteSchema,
  KrakenTickerSchema,
  LunarCrushSentimentSchema,
  BlockchainInfoSchema,
  validateApiResponse,
  fetchWithValidation
} from '../lib/ucie/veritas/schemas/apiSchemas';

describe('Veritas Protocol - API Schema Validation', () => {
  describe('CoinGeckoMarketDataSchema', () => {
    it('should validate correct CoinGecko data', () => {
      const validData = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 95000,
        market_cap: 1800000000000,
        total_volume: 50000000000,
        price_change_percentage_24h: 2.5,
        circulating_supply: 19000000,
        total_supply: 21000000,
        last_updated: '2025-01-27T12:00:00Z'
      };

      const result = validateApiResponse(CoinGeckoMarketDataSchema, validData, 'CoinGecko');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid CoinGecko data with negative price', () => {
      const invalidData = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: -100, // Invalid: negative price
        market_cap: 1800000000000,
        total_volume: 50000000000,
        price_change_percentage_24h: 2.5,
        last_updated: '2025-01-27T12:00:00Z'
      };

      const result = validateApiResponse(CoinGeckoMarketDataSchema, invalidData, 'CoinGecko');
      expect(result.success).toBe(false);
      expect(result.error).toContain('CoinGecko API response validation failed');
    });

    it('should accept optional fields', () => {
      const dataWithoutOptionals = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 95000,
        market_cap: 1800000000000,
        total_volume: 50000000000,
        price_change_percentage_24h: 2.5,
        last_updated: '2025-01-27T12:00:00Z'
      };

      const result = validateApiResponse(CoinGeckoMarketDataSchema, dataWithoutOptionals, 'CoinGecko');
      expect(result.success).toBe(true);
    });
  });

  describe('CoinMarketCapQuoteSchema', () => {
    it('should validate correct CoinMarketCap data', () => {
      const validData = {
        data: {
          id: 1,
          symbol: 'BTC',
          quote: {
            USD: {
              price: 95000,
              volume_24h: 50000000000,
              market_cap: 1800000000000,
              percent_change_24h: 2.5,
              last_updated: '2025-01-27T12:00:00Z'
            }
          }
        }
      };

      const result = validateApiResponse(CoinMarketCapQuoteSchema, validData, 'CoinMarketCap');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject missing nested fields', () => {
      const invalidData = {
        data: {
          id: 1,
          symbol: 'BTC',
          quote: {
            USD: {
              price: 95000,
              // Missing required fields
            }
          }
        }
      };

      const result = validateApiResponse(CoinMarketCapQuoteSchema, invalidData, 'CoinMarketCap');
      expect(result.success).toBe(false);
    });
  });

  describe('KrakenTickerSchema', () => {
    it('should validate correct Kraken data', () => {
      const validData = {
        result: {
          XXBTZUSD: {
            c: ['95000.00', '0.5'],
            v: ['1000.123', '2000.456'],
            p: ['94500.00', '94800.00'],
            t: [1000, 2000],
            l: ['94000.00', '93500.00'],
            h: ['96000.00', '96500.00'],
            o: '94200.00'
          }
        }
      };

      const result = validateApiResponse(KrakenTickerSchema, validData, 'Kraken');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should handle multiple trading pairs', () => {
      const validData = {
        result: {
          XXBTZUSD: {
            c: ['95000.00', '0.5'],
            v: ['1000.123', '2000.456'],
            p: ['94500.00', '94800.00'],
            t: [1000, 2000],
            l: ['94000.00', '93500.00'],
            h: ['96000.00', '96500.00'],
            o: '94200.00'
          },
          XETHZUSD: {
            c: ['3500.00', '1.0'],
            v: ['5000.123', '10000.456'],
            p: ['3450.00', '3480.00'],
            t: [2000, 4000],
            l: ['3400.00', '3350.00'],
            h: ['3600.00', '3650.00'],
            o: '3420.00'
          }
        }
      };

      const result = validateApiResponse(KrakenTickerSchema, validData, 'Kraken');
      expect(result.success).toBe(true);
    });
  });

  describe('LunarCrushSentimentSchema', () => {
    it('should validate correct LunarCrush data', () => {
      const validData = {
        data: {
          id: 1,
          symbol: 'BTC',
          name: 'Bitcoin',
          galaxy_score: 75,
          alt_rank: 1,
          sentiment: 65,
          social_volume: 50000,
          social_volume_24h_change: 10.5,
          sentiment_absolute: 32500,
          sentiment_relative: 65,
          interactions_24h: 100000,
          social_contributors: 5000,
          social_dominance: 45.5,
          market_cap: 1800000000000,
          volume_24h: 50000000000
        }
      };

      const result = validateApiResponse(LunarCrushSentimentSchema, validData, 'LunarCrush');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject galaxy_score exceeding 100', () => {
      const invalidData = {
        data: {
          id: 1,
          symbol: 'BTC',
          name: 'Bitcoin',
          galaxy_score: 150, // Invalid: exceeds max of 100
          alt_rank: 1,
          sentiment: 65,
          social_volume: 50000,
          social_volume_24h_change: 10.5,
          sentiment_absolute: 32500,
          sentiment_relative: 65,
          interactions_24h: 100000,
          social_contributors: 5000,
          social_dominance: 45.5
        }
      };

      const result = validateApiResponse(LunarCrushSentimentSchema, invalidData, 'LunarCrush');
      expect(result.success).toBe(false);
      expect(result.error).toContain('LunarCrush API response validation failed');
    });

    it('should reject sentiment outside valid range', () => {
      const invalidData = {
        data: {
          id: 1,
          symbol: 'BTC',
          name: 'Bitcoin',
          galaxy_score: 75,
          alt_rank: 1,
          sentiment: -150, // Invalid: below min of -100
          social_volume: 50000,
          social_volume_24h_change: 10.5,
          sentiment_absolute: 32500,
          sentiment_relative: 65,
          interactions_24h: 100000,
          social_contributors: 5000,
          social_dominance: 45.5
        }
      };

      const result = validateApiResponse(LunarCrushSentimentSchema, invalidData, 'LunarCrush');
      expect(result.success).toBe(false);
    });
  });

  describe('BlockchainInfoSchema', () => {
    it('should validate correct Blockchain.com data', () => {
      const validData = {
        hash_rate: 500000000000000000,
        difficulty: 70000000000000,
        mempool_size: 50000,
        n_tx: 300000,
        market_price_usd: 95000,
        estimated_transaction_volume_usd: 5000000000,
        blocks_size: 2000000,
        miners_revenue_usd: 50000000,
        timestamp: 1706356800
      };

      const result = validateApiResponse(BlockchainInfoSchema, validData, 'Blockchain.com');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject negative values for positive-only fields', () => {
      const invalidData = {
        hash_rate: -500000000000000000, // Invalid: negative
        difficulty: 70000000000000,
        mempool_size: 50000,
        n_tx: 300000,
        market_price_usd: 95000,
        estimated_transaction_volume_usd: 5000000000,
        blocks_size: 2000000,
        miners_revenue_usd: 50000000,
        timestamp: 1706356800
      };

      const result = validateApiResponse(BlockchainInfoSchema, invalidData, 'Blockchain.com');
      expect(result.success).toBe(false);
    });
  });

  describe('fetchWithValidation', () => {
    it('should fetch and validate data successfully', async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 95000,
        market_cap: 1800000000000,
        total_volume: 50000000000,
        price_change_percentage_24h: 2.5,
        last_updated: '2025-01-27T12:00:00Z'
      });

      const result = await fetchWithValidation(
        mockFetcher,
        CoinGeckoMarketDataSchema,
        'CoinGecko'
      );

      expect(result.success).toBe(true);
      expect(result.data?.current_price).toBe(95000);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetcher = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchWithValidation(
        mockFetcher,
        CoinGeckoMarketDataSchema,
        'CoinGecko'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('CoinGecko API fetch failed');
      expect(result.error).toContain('Network error');
    });

    it('should handle validation errors after successful fetch', async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: -100, // Invalid
        market_cap: 1800000000000,
        total_volume: 50000000000,
        price_change_percentage_24h: 2.5,
        last_updated: '2025-01-27T12:00:00Z'
      });

      const result = await fetchWithValidation(
        mockFetcher,
        CoinGeckoMarketDataSchema,
        'CoinGecko'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('CoinGecko API response validation failed');
    });

    it('should handle non-Error exceptions', async () => {
      const mockFetcher = jest.fn().mockRejectedValue('String error');

      const result = await fetchWithValidation(
        mockFetcher,
        CoinGeckoMarketDataSchema,
        'CoinGecko'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('CoinGecko API fetch failed');
    });
  });

  describe('validateApiResponse error messages', () => {
    it('should provide detailed error messages for validation failures', () => {
      const invalidData = {
        id: 'bitcoin',
        symbol: 'btc',
        // Missing required fields
      };

      const result = validateApiResponse(CoinGeckoMarketDataSchema, invalidData, 'CoinGecko');
      expect(result.success).toBe(false);
      expect(result.error).toContain('CoinGecko API response validation failed');
      expect(result.error).toMatch(/name|current_price|market_cap|total_volume/);
    });
  });
});
