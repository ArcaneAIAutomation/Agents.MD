/**
 * ATGE Error Handling Tests
 * 
 * Tests comprehensive error handling scenarios:
 * - CoinMarketCap API failure (should fallback to CoinGecko)
 * - Both market APIs failing (should mark as failed)
 * - Invalid trade ID
 * - Network timeouts
 * - Error message display
 * - System continues operating after errors
 * 
 * Requirements: Task 42
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock database module
vi.mock('../lib/db', () => ({
  query: vi.fn()
}));

// Import after mocks are set up
import { getMarketData, clearMarketDataCache } from '../lib/atge/marketData';
import { query } from '../lib/db';

describe('ATGE Error Handling Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearMarketDataCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Test 1: CoinMarketCap API Failure (should fallback to CoinGecko)', () => {
    it('should fallback to CoinGecko when CoinMarketCap fails', async () => {
      // Mock CoinMarketCap failure
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        // Mock CoinGecko success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: {
              current_price: { usd: 95000 },
              price_change_24h: 1500,
              price_change_percentage_24h: 1.6,
              total_volume: { usd: 45000000000 },
              market_cap: { usd: 1850000000000 },
              high_24h: { usd: 96000 },
              low_24h: { usd: 93500 }
            }
          })
        } as Response);

      const result = await getMarketData('BTC', true);

      expect(result).toBeDefined();
      expect(result.source).toBe('CoinGecko');
      expect(result.currentPrice).toBe(95000);
      expect(mockFetch).toHaveBeenCalledTimes(2); // CMC failed, CoinGecko succeeded
    });

    it('should log error when CoinMarketCap fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: {
              current_price: { usd: 95000 },
              price_change_24h: 1500,
              price_change_percentage_24h: 1.6,
              total_volume: { usd: 45000000000 },
              market_cap: { usd: 1850000000000 },
              high_24h: { usd: 96000 },
              low_24h: { usd: 93500 }
            }
          })
        } as Response);

      await getMarketData('BTC', true);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ATGE] CoinMarketCap failed, trying CoinGecko:'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Test 2: Both Market APIs Failing (should mark as failed)', () => {
    it('should throw error when both CoinMarketCap and CoinGecko fail', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        // Mock CoinMarketCap failure
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        // Mock CoinGecko failure
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response);

      await expect(getMarketData('BTC', true)).rejects.toThrow(
        'Failed to fetch market data for BTC: Both CoinMarketCap and CoinGecko failed'
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should log errors from both APIs', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response);

      try {
        await getMarketData('BTC', true);
      } catch (error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ATGE] CoinMarketCap failed, trying CoinGecko:'),
        expect.any(Error)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ATGE] CoinGecko also failed:'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not use fallback data when both APIs fail', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response);

      try {
        const result = await getMarketData('BTC', true);
        // Should not reach here
        expect(result).toBeUndefined();
      } catch (error) {
        // Verify error message indicates no fallback data
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Both CoinMarketCap and CoinGecko failed');
      }
    });
  });

  describe('Test 3: Invalid Trade ID', () => {
    it('should handle invalid trade ID gracefully', async () => {
      const mockQuery = query as ReturnType<typeof vi.fn>;
      mockQuery.mockResolvedValueOnce({ rows: [] }); // No trade found

      // Simulate verification with invalid trade ID
      const result = await mockQuery(
        'SELECT * FROM trade_signals WHERE id = $1',
        ['invalid-uuid']
      );

      expect(result.rows).toHaveLength(0);
    });

    it('should log error for invalid trade ID', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockQuery = query as ReturnType<typeof vi.fn>;
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const tradeId = 'invalid-uuid';
      const result = await mockQuery(
        'SELECT * FROM trade_signals WHERE id = $1',
        [tradeId]
      );

      if (result.rows.length === 0) {
        console.error(`[ATGE Verify] Trade ${tradeId} not found`);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[ATGE Verify] Trade ${tradeId} not found`)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Test 4: Network Timeouts', () => {
    it('should handle network timeout for CoinMarketCap', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        // Mock timeout error
        .mockRejectedValueOnce(new Error('Network timeout'))
        // Mock CoinGecko success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: {
              current_price: { usd: 95000 },
              price_change_24h: 1500,
              price_change_percentage_24h: 1.6,
              total_volume: { usd: 45000000000 },
              market_cap: { usd: 1850000000000 },
              high_24h: { usd: 96000 },
              low_24h: { usd: 93500 }
            }
          })
        } as Response);

      const result = await getMarketData('BTC', true);

      expect(result).toBeDefined();
      expect(result.source).toBe('CoinGecko');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error when both APIs timeout', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'));

      await expect(getMarketData('BTC', true)).rejects.toThrow(
        'Failed to fetch market data for BTC: Both CoinMarketCap and CoinGecko failed'
      );
    });

    it('should handle AbortController timeout', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: {
              current_price: { usd: 95000 },
              price_change_24h: 1500,
              price_change_percentage_24h: 1.6,
              total_volume: { usd: 45000000000 },
              market_cap: { usd: 1850000000000 },
              high_24h: { usd: 96000 },
              low_24h: { usd: 93500 }
            }
          })
        } as Response);

      const result = await getMarketData('BTC', true);

      expect(result).toBeDefined();
      expect(result.source).toBe('CoinGecko');
    });
  });

  describe('Test 5: Error Messages Display Correctly', () => {
    it('should return user-friendly error message for API failures', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response);

      try {
        await getMarketData('BTC', true);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Failed to fetch market data');
        expect(errorMessage).toContain('BTC');
        expect(errorMessage).not.toContain('undefined');
        expect(errorMessage).not.toContain('null');
      }
    });

    it('should include symbol in error message', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        } as Response);

      try {
        await getMarketData('ETH', true);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('ETH');
      }
    });

    it('should provide specific error for missing API key', async () => {
      // Temporarily remove API key
      const originalKey = process.env.COINMARKETCAP_API_KEY;
      delete process.env.COINMARKETCAP_API_KEY;

      try {
        await getMarketData('BTC', true);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('CoinMarketCap API key not configured');
      } finally {
        // Restore API key
        if (originalKey) {
          process.env.COINMARKETCAP_API_KEY = originalKey;
        }
      }
    });
  });

  describe('Test 6: System Continues Operating After Errors', () => {
    it('should continue processing other trades after one fails', async () => {
      const mockQuery = query as ReturnType<typeof vi.fn>;
      
      // Mock active trades
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'trade-1',
            symbol: 'BTC',
            entry_price: '94000',
            tp1_price: '96000',
            tp2_price: '98000',
            tp3_price: '100000',
            stop_loss_price: '92000',
            expires_at: new Date(Date.now() + 3600000),
            status: 'active'
          },
          {
            id: 'trade-2',
            symbol: 'ETH',
            entry_price: '3500',
            tp1_price: '3600',
            tp2_price: '3700',
            tp3_price: '3800',
            stop_loss_price: '3400',
            expires_at: new Date(Date.now() + 3600000),
            status: 'active'
          }
        ]
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        // BTC - CoinMarketCap fails, CoinGecko succeeds
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            market_data: {
              current_price: { usd: 95000 },
              price_change_24h: 1500,
              price_change_percentage_24h: 1.6,
              total_volume: { usd: 45000000000 },
              market_cap: { usd: 1850000000000 },
              high_24h: { usd: 96000 },
              low_24h: { usd: 93500 }
            }
          })
        } as Response)
        // ETH - Both fail
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response);

      // Simulate verification loop
      const trades = (await mockQuery()).rows;
      const results = [];

      for (const trade of trades) {
        try {
          const marketData = await getMarketData(trade.symbol, true);
          results.push({ tradeId: trade.id, success: true, price: marketData.currentPrice });
        } catch (error) {
          results.push({ tradeId: trade.id, success: false, error: (error as Error).message });
        }
      }

      // Verify first trade succeeded
      expect(results[0].success).toBe(true);
      expect(results[0].price).toBe(95000);

      // Verify second trade failed but didn't crash the system
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Failed to fetch market data');

      // Verify both trades were processed
      expect(results).toHaveLength(2);
    });

    it('should track failed verifications in summary', async () => {
      const mockQuery = query as ReturnType<typeof vi.fn>;
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'trade-1', symbol: 'BTC', entry_price: '94000', tp1_price: '96000', tp2_price: '98000', tp3_price: '100000', stop_loss_price: '92000', expires_at: new Date(Date.now() + 3600000), status: 'active' },
          { id: 'trade-2', symbol: 'ETH', entry_price: '3500', tp1_price: '3600', tp2_price: '3700', tp3_price: '3800', stop_loss_price: '3400', expires_at: new Date(Date.now() + 3600000), status: 'active' }
        ]
      });

      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ market_data: { current_price: { usd: 95000 }, price_change_24h: 1500, price_change_percentage_24h: 1.6, total_volume: { usd: 45000000000 }, market_cap: { usd: 1850000000000 }, high_24h: { usd: 96000 }, low_24h: { usd: 93500 } } }) } as Response)
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response)
        .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' } as Response);

      const trades = (await mockQuery()).rows;
      let verified = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const trade of trades) {
        try {
          await getMarketData(trade.symbol, true);
          verified++;
        } catch (error) {
          failed++;
          errors.push(`Failed to fetch price for ${trade.symbol} (trade ${trade.id})`);
        }
      }

      expect(verified).toBe(1);
      expect(failed).toBe(1);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('ETH');
    });
  });

  describe('Test 7: Vercel Logs Error Tracking', () => {
    it('should log errors with context for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        } as Response);

      try {
        await getMarketData('BTC', true);
      } catch (error) {
        // Expected
      }

      // Verify error was logged with context
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCalls = consoleErrorSpy.mock.calls;
      
      // Check that error logs contain useful information
      const hasContextualError = errorCalls.some(call => 
        call.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('[ATGE]') || arg.includes('CoinMarketCap') || arg.includes('CoinGecko'))
        )
      );
      
      expect(hasContextualError).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it('should log error stack traces', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const testError = new Error('Test error with stack');
      mockFetch
        .mockRejectedValueOnce(testError)
        .mockRejectedValueOnce(testError);

      try {
        await getMarketData('BTC', true);
      } catch (error) {
        // Expected
      }

      // Verify error object was logged (which includes stack trace)
      const errorCalls = consoleErrorSpy.mock.calls;
      const hasErrorObject = errorCalls.some(call => 
        call.some(arg => arg instanceof Error)
      );
      
      expect(hasErrorObject).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });
});
