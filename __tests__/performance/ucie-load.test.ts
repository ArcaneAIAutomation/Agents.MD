/**
 * Performance Tests: UCIE Load Testing
 * 
 * Tests for concurrent users, response times, and cache performance
 */

import { NextApiRequest, NextApiResponse } from 'next';
import analyzeHandler from '../../pages/api/ucie/analyze/[symbol]';
import searchHandler from '../../pages/api/ucie/search';
import marketDataHandler from '../../pages/api/ucie/market-data/[symbol]';

function createMockRequest(endpoint: string, params: any): Partial<NextApiRequest> {
  return {
    method: 'GET',
    query: params,
    headers: {}
  };
}

function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  };
  return res;
}

describe('UCIE Performance Tests', () => {
  // Increase timeout for load tests
  jest.setTimeout(60000);

  describe('Concurrent User Load', () => {
    test('handles 10 concurrent analysis requests', async () => {
      const requests = Array.from({ length: 10 }, () => {
        const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return analyzeHandler(req, res);
      });
      
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All requests should complete
      expect(duration).toBeLessThan(30000); // 30 seconds for 10 concurrent
    });

    test('handles 50 concurrent search requests', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => {
        const req = createMockRequest('search', { q: `BTC${i % 10}` }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return searchHandler(req, res);
      });
      
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;
      
      // Should handle high concurrency for simple searches
      expect(duration).toBeLessThan(10000); // 10 seconds for 50 concurrent
    });

    test('handles 100 concurrent market data requests', async () => {
      const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
      const requests = Array.from({ length: 100 }, (_, i) => {
        const symbol = symbols[i % symbols.length];
        const req = createMockRequest('market-data', { symbol }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return marketDataHandler(req, res);
      });
      
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;
      
      // Should handle high concurrency with caching
      expect(duration).toBeLessThan(15000); // 15 seconds for 100 concurrent
    });
  });

  describe('Response Time Benchmarks', () => {
    test('search completes in under 100ms', async () => {
      const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await searchHandler(req, res);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('market data completes in under 2 seconds', async () => {
      const req = createMockRequest('market-data', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await marketDataHandler(req, res);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });

    test('complete analysis completes in under 15 seconds', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await analyzeHandler(req, res);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Cache Performance', () => {
    test('achieves >80% cache hit rate', async () => {
      const symbols = ['BTC', 'ETH', 'BTC', 'ETH', 'BTC', 'ETH', 'BTC', 'ETH', 'BTC', 'ETH'];
      let cacheHits = 0;
      let totalRequests = symbols.length;
      
      for (const symbol of symbols) {
        const req = createMockRequest('market-data', { symbol }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        const start = Date.now();
        await marketDataHandler(req, res);
        const duration = Date.now() - start;
        
        // If response is very fast, it's likely cached
        if (duration < 50) {
          cacheHits++;
        }
      }
      
      const hitRate = cacheHits / totalRequests;
      expect(hitRate).toBeGreaterThan(0.8); // >80% hit rate
    });

    test('cached responses are significantly faster', async () => {
      const req1 = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const req2 = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res1 = createMockResponse() as NextApiResponse;
      const res2 = createMockResponse() as NextApiResponse;
      
      // First request (uncached)
      const start1 = Date.now();
      await analyzeHandler(req1, res1);
      const time1 = Date.now() - start1;
      
      // Second request (cached)
      const start2 = Date.now();
      await analyzeHandler(req2, res2);
      const time2 = Date.now() - start2;
      
      // Cached should be at least 5x faster
      expect(time2).toBeLessThan(time1 * 0.2);
    });

    test('cache invalidation works correctly', async () => {
      const req1 = createMockRequest('market-data', { symbol: 'BTC' }) as NextApiRequest;
      const res1 = createMockResponse() as NextApiResponse;
      
      await marketDataHandler(req1, res1);
      const data1 = res1.json.mock.calls[0][0];
      
      // Wait for cache to expire (30 seconds)
      await new Promise(resolve => setTimeout(resolve, 31000));
      
      const req2 = createMockRequest('market-data', { symbol: 'BTC' }) as NextApiRequest;
      const res2 = createMockResponse() as NextApiResponse;
      
      await marketDataHandler(req2, res2);
      const data2 = res2.json.mock.calls[0][0];
      
      // Data should be refreshed
      expect(data1.timestamp).not.toBe(data2.timestamp);
    });
  });

  describe('API Response Time Distribution', () => {
    test('measures response time percentiles', async () => {
      const responseTimes: number[] = [];
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        const start = Date.now();
        await searchHandler(req, res);
        const duration = Date.now() - start;
        
        responseTimes.push(duration);
      }
      
      // Sort times
      responseTimes.sort((a, b) => a - b);
      
      // Calculate percentiles
      const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
      const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
      const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
      
      // Verify performance targets
      expect(p50).toBeLessThan(100); // Median < 100ms
      expect(p95).toBeLessThan(200); // 95th percentile < 200ms
      expect(p99).toBeLessThan(500); // 99th percentile < 500ms
    });
  });

  describe('Memory and Resource Usage', () => {
    test('does not leak memory with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        await searchHandler(req, res);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Bottleneck Identification', () => {
    test('identifies slowest analysis phase', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const phaseTimes: Record<string, number> = {};
      
      // This would require instrumentation in the actual handler
      // For now, we just verify the analysis completes
      const start = Date.now();
      await analyzeHandler(req, res);
      const total = Date.now() - start;
      
      expect(total).toBeLessThan(15000);
      
      // In a real implementation, we'd track:
      // - Phase 1 (market data): < 2s
      // - Phase 2 (sentiment/news): < 3s
      // - Phase 3 (technical/on-chain): < 5s
      // - Phase 4 (AI processing): < 10s
    });

    test('measures API call overhead', async () => {
      const times: number[] = [];
      
      // Make 10 requests to measure consistency
      for (let i = 0; i < 10; i++) {
        const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        const start = Date.now();
        await searchHandler(req, res);
        const duration = Date.now() - start;
        
        times.push(duration);
      }
      
      // Calculate standard deviation
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be low (consistent performance)
      expect(stdDev).toBeLessThan(mean * 0.5); // < 50% of mean
    });
  });

  describe('Scalability Tests', () => {
    test('maintains performance with increasing load', async () => {
      const loadLevels = [10, 25, 50, 100];
      const avgTimes: number[] = [];
      
      for (const load of loadLevels) {
        const requests = Array.from({ length: load }, () => {
          const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
          const res = createMockResponse() as NextApiResponse;
          return searchHandler(req, res);
        });
        
        const start = Date.now();
        await Promise.all(requests);
        const duration = Date.now() - start;
        
        avgTimes.push(duration / load);
      }
      
      // Average time per request should not increase dramatically
      const firstAvg = avgTimes[0];
      const lastAvg = avgTimes[avgTimes.length - 1];
      
      // Last average should be < 3x first average
      expect(lastAvg).toBeLessThan(firstAvg * 3);
    });
  });
});
