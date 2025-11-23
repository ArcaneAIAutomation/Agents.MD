/**
 * ATGE Batch Analysis Tests
 * Tests for batch trade analysis endpoint
 * Requirements: 3.3
 */

import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/atge/batch-analysis';
import * as db from '../../lib/db';

// Mock the database module
jest.mock('../../lib/db');
const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  withAuth: (handler: any) => handler
}));

describe('ATGE Batch Analysis Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/atge/batch-analysis', () => {
    it('should return batch analysis with aggregate statistics', async () => {
      // Mock authenticated request
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          symbol: 'BTC',
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        }
      });

      // Add user to request (simulating auth middleware)
      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      // Mock database responses
      mockQuery
        // Aggregate stats query
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 50,
            winning_trades: 35,
            win_rate: 70.00,
            profit_factor: 2.50,
            avg_win: 150.00,
            avg_loss: -75.00,
            total_pl: 3750.00,
            largest_win: 500.00,
            largest_loss: -200.00,
            avg_duration_hours: 8.50
          }]
        } as any)
        // RSI ranges query
        .mockResolvedValueOnce({
          rows: [
            { rsi_range: 'Oversold (< 30)', trade_count: 15, win_rate: 80.00, avg_profit_loss: 200.00 },
            { rsi_range: 'Neutral (40-60)', trade_count: 20, win_rate: 65.00, avg_profit_loss: 100.00 }
          ]
        } as any)
        // MACD signals query
        .mockResolvedValueOnce({
          rows: [
            { macd_signal: 'Strong Bullish', trade_count: 12, win_rate: 83.33, avg_profit_loss: 180.00 },
            { macd_signal: 'Bullish Crossover', trade_count: 18, win_rate: 66.67, avg_profit_loss: 120.00 }
          ]
        } as any)
        // Timeframes query
        .mockResolvedValueOnce({
          rows: [
            { timeframe: '1h', trade_count: 25, win_rate: 72.00, avg_profit_loss: 160.00 },
            { timeframe: '4h', trade_count: 25, win_rate: 68.00, avg_profit_loss: 140.00 }
          ]
        } as any)
        // Market conditions query
        .mockResolvedValueOnce({
          rows: [
            { market_condition: 'Fear', trade_count: 20, win_rate: 75.00, avg_profit_loss: 170.00 },
            { market_condition: 'Neutral', trade_count: 30, win_rate: 66.67, avg_profit_loss: 130.00 }
          ]
        } as any);

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.aggregateStats).toBeDefined();
      expect(data.analysis.aggregateStats.totalTrades).toBe(50);
      expect(data.analysis.aggregateStats.winRate).toBe(70);
      expect(data.analysis.aggregateStats.profitFactor).toBe(2.5);
      expect(data.analysis.bestConditions).toBeDefined();
      expect(data.analysis.recommendations).toBeDefined();
      expect(Array.isArray(data.analysis.recommendations)).toBe(true);
    });

    it('should accept filter parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          symbol: 'ETH',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          status: 'tp1_hit'
        }
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      // Mock empty results
      mockQuery.mockResolvedValue({ rows: [] } as any);

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      expect(data.success).toBe(true);
      expect(data.analysis.filters).toEqual({
        symbol: 'ETH',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        status: 'tp1_hit'
      });
    });

    it('should generate recommendations based on analysis', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      // Mock low win rate scenario
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 100,
            winning_trades: 40,
            win_rate: 40.00,
            profit_factor: 1.20,
            avg_win: 100.00,
            avg_loss: -80.00,
            total_pl: 800.00,
            largest_win: 300.00,
            largest_loss: -250.00,
            avg_duration_hours: 6.00
          }]
        } as any)
        .mockResolvedValue({ rows: [] } as any);

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      expect(data.success).toBe(true);
      expect(data.analysis.recommendations.length).toBeGreaterThan(0);
      
      // Should have high priority recommendation for low win rate
      const highPriorityRecs = data.analysis.recommendations.filter(
        (r: any) => r.priority === 'high'
      );
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });

    it('should return 405 for non-GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Method not allowed');
    });

    it('should handle database errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      // Mock database error
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });

    it('should return empty analysis when no trades match filters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          symbol: 'BTC',
          startDate: '2025-01-01',
          endDate: '2025-01-01'
        }
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      // Mock empty results
      mockQuery.mockResolvedValue({ rows: [] } as any);

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      expect(data.success).toBe(true);
      expect(data.analysis.aggregateStats.totalTrades).toBe(0);
      expect(data.analysis.bestConditions.rsiRanges).toEqual([]);
      expect(data.analysis.bestConditions.macdSignals).toEqual([]);
      // Recommendations may still be generated based on 0% win rate and 0 profit factor
      expect(Array.isArray(data.analysis.recommendations)).toBe(true);
    });
  });

  describe('Recommendation Generation', () => {
    it('should recommend tightening entry criteria for low win rate', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 50,
            winning_trades: 20,
            win_rate: 40.00,
            profit_factor: 1.50,
            avg_win: 100.00,
            avg_loss: -50.00,
            total_pl: 500.00,
            largest_win: 200.00,
            largest_loss: -100.00,
            avg_duration_hours: 5.00
          }]
        } as any)
        .mockResolvedValue({ rows: [] } as any);

      await handler(req as any, res as any);

      const data = JSON.parse(res._getData());
      const entryRecs = data.analysis.recommendations.filter(
        (r: any) => r.category === 'entry'
      );
      
      expect(entryRecs.length).toBeGreaterThan(0);
      expect(entryRecs[0].recommendation).toContain('win rate');
    });

    it('should recommend better risk management for low profit factor', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      (req as any).user = { id: 'test-user-id', email: 'test@example.com' };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 50,
            winning_trades: 30,
            win_rate: 60.00,
            profit_factor: 1.20,
            avg_win: 100.00,
            avg_loss: -90.00,
            total_pl: 300.00,
            largest_win: 200.00,
            largest_loss: -180.00,
            avg_duration_hours: 5.00
          }]
        } as any)
        .mockResolvedValue({ rows: [] } as any);

      await handler(req as any, res as any);

      const data = JSON.parse(res._getData());
      const riskRecs = data.analysis.recommendations.filter(
        (r: any) => r.category === 'risk'
      );
      
      expect(riskRecs.length).toBeGreaterThan(0);
      expect(riskRecs[0].recommendation).toContain('profit factor');
    });
  });
});
