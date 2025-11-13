/**
 * ATGE Background Jobs Tests
 * 
 * Tests for expired trade checking and on-page-load data fetching
 * Requirements: 5.7, 5.8, 5.20, 6.1
 */

import { checkExpiredTrades, getExpiredTradesStats } from '../../lib/atge/expiredTradesChecker';

// Mock the database module
jest.mock('../../lib/db', () => ({
  query: jest.fn(),
  queryMany: jest.fn(),
  queryOne: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ATGE Background Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkExpiredTrades', () => {
    it('should return zero counts when no expired trades exist', async () => {
      const { queryMany } = require('../../lib/db');
      queryMany.mockResolvedValue([]);

      const result = await checkExpiredTrades();

      expect(result).toEqual({
        checked: 0,
        triggered: 0,
        errors: 0
      });
    });

    it('should trigger backtesting for expired trades', async () => {
      const { queryMany } = require('../../lib/db');
      const mockTrades = [
        {
          id: 'trade-1',
          symbol: 'BTC',
          timeframe: '1h',
          generated_at: new Date('2025-01-01T10:00:00Z'),
          expires_at: new Date('2025-01-01T11:00:00Z')
        }
      ];
      
      queryMany.mockResolvedValue(mockTrades);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: { status: 'completed' } })
      });

      const result = await checkExpiredTrades();

      expect(result.checked).toBe(1);
      expect(result.triggered).toBe(1);
      expect(result.errors).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/atge/historical-data'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ tradeSignalId: 'trade-1' })
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const { queryMany } = require('../../lib/db');
      const mockTrades = [
        {
          id: 'trade-1',
          symbol: 'BTC',
          timeframe: '1h',
          generated_at: new Date('2025-01-01T10:00:00Z'),
          expires_at: new Date('2025-01-01T11:00:00Z')
        }
      ];
      
      queryMany.mockResolvedValue(mockTrades);
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await checkExpiredTrades();

      expect(result.checked).toBe(1);
      expect(result.triggered).toBe(0);
      expect(result.errors).toBe(1);
    });
  });

  describe('getExpiredTradesStats', () => {
    it('should return statistics about expired trades', async () => {
      const { queryMany } = require('../../lib/db');
      queryMany.mockResolvedValue([
        {
          total_expired: '5',
          pending_backtest: '2',
          completed_backtest: '3'
        }
      ]);

      const result = await getExpiredTradesStats();

      expect(result).toEqual({
        totalExpired: 5,
        pendingBacktest: 2,
        completedBacktest: 3
      });
    });

    it('should handle empty results', async () => {
      const { queryMany } = require('../../lib/db');
      queryMany.mockResolvedValue([]);

      const result = await getExpiredTradesStats();

      expect(result).toEqual({
        totalExpired: 0,
        pendingBacktest: 0,
        completedBacktest: 0
      });
    });
  });
});
