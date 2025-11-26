/**
 * Performance Monitor Tests
 * 
 * Tests for the Quantum BTC Performance Monitor
 * Requirements: 14.1-14.10
 */

import { performanceMonitor, trackAPICall, trackDatabaseQuery } from '../../../lib/quantum/performanceMonitor';
import { closePool } from '../../../lib/db';

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor.clearOldMetrics();
  });

  afterAll(async () => {
    // Close database connection pool after all tests
    await closePool();
  });

  describe('API Call Tracking', () => {
    it('should track successful API calls', async () => {
      const result = await trackAPICall(
        'TestAPI',
        '/test/endpoint',
        'GET',
        async () => {
          return { data: 'test' };
        }
      );

      expect(result).toEqual({ data: 'test' });
    });

    it('should track failed API calls', async () => {
      try {
        await trackAPICall(
          'TestAPI',
          '/test/endpoint',
          'GET',
          async () => {
            throw new Error('Test error');
          }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Test error');
      }
    });

    it('should measure response time', async () => {
      const startTime = Date.now();
      
      await trackAPICall(
        'TestAPI',
        '/test/endpoint',
        'GET',
        async () => {
          // Simulate 100ms delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return { data: 'test' };
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Response time should be at least 100ms
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Database Query Tracking', () => {
    it('should track successful database queries', async () => {
      const result = await trackDatabaseQuery(
        'SELECT',
        'test_query',
        async () => {
          return { rows: [{ id: 1 }], rowCount: 1 };
        }
      );

      expect(result).toEqual({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should track failed database queries', async () => {
      try {
        await trackDatabaseQuery(
          'SELECT',
          'test_query',
          async () => {
            throw new Error('Database error');
          }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });
  });

  describe('Error Rate Tracking', () => {
    it('should calculate error rate correctly', async () => {
      // Track 3 successful calls
      for (let i = 0; i < 3; i++) {
        await trackAPICall(
          'TestAPI',
          '/test/endpoint',
          'GET',
          async () => ({ data: 'test' })
        );
      }

      // Track 1 failed call
      try {
        await trackAPICall(
          'TestAPI',
          '/test/endpoint',
          'GET',
          async () => {
            throw new Error('Test error');
          }
        );
      } catch (error) {
        // Expected error
      }

      const errorStats = performanceMonitor.getErrorStats();
      
      // Error rate should be 25% (1 error out of 4 total calls)
      expect(errorStats.totalCalls).toBe(4);
      expect(errorStats.totalErrors).toBe(1);
      expect(errorStats.errorRate).toBe(25);
    });
  });

  describe('System Health', () => {
    it('should return system health metrics', async () => {
      // Track some API calls
      await trackAPICall(
        'TestAPI',
        '/test/endpoint',
        'GET',
        async () => ({ data: 'test' })
      );

      const health = await performanceMonitor.getSystemHealth();

      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('errorRate');
      expect(health).toHaveProperty('avgResponseTime');
      expect(typeof health.errorRate).toBe('number');
      expect(typeof health.avgResponseTime).toBe('number');
    });
  });

  describe('Performance Summary', () => {
    it('should return comprehensive performance summary', async () => {
      // Track some API calls
      await trackAPICall(
        'TestAPI',
        '/test/endpoint',
        'GET',
        async () => ({ data: 'test' })
      );

      // Track some database queries
      await trackDatabaseQuery(
        'SELECT',
        'test_query',
        async () => ({ rows: [], rowCount: 0 })
      );

      const summary = await performanceMonitor.getPerformanceSummary();

      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('api');
      expect(summary).toHaveProperty('database');
      expect(summary).toHaveProperty('errors');
      expect(summary).toHaveProperty('health');
    });
  });
});
