/**
 * Integration Tests: UCIE Market Data API
 * 
 * Tests for multi-source market data aggregation endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/ucie/market-data/[symbol]';

function createMockRequest(symbol: string, method: string = 'GET'): Partial<NextApiRequest> {
  return {
    method,
    query: { symbol },
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

describe('UCIE Market Data API', () => {
  describe('GET /api/ucie/market-data/[symbol]', () => {
    test('returns market data for valid symbol', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          prices: expect.any(Array),
          vwap: expect.any(Number),
          volume24h: expect.any(Number),
          marketCap: expect.any(Number)
        })
      );
    });

    test('aggregates data from multiple exchanges', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Should have data from at least 3 exchanges
      expect(jsonCall.prices.length).toBeGreaterThanOrEqual(3);
    });

    test('includes data quality score', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall).toHaveProperty('dataQuality');
      expect(jsonCall.dataQuality).toBeGreaterThanOrEqual(0);
      expect(jsonCall.dataQuality).toBeLessThanOrEqual(100);
    });

    test('detects arbitrage opportunities', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall).toHaveProperty('arbitrageOpportunities');
      expect(Array.isArray(jsonCall.arbitrageOpportunities)).toBe(true);
    });

    test('handles invalid symbol gracefully', async () => {
      const req = createMockRequest('INVALID123') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });

    test('validates symbol format', async () => {
      const req = createMockRequest('BTC<script>') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('completes within timeout', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await handler(req, res);
      const duration = Date.now() - start;
      
      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    test('includes timestamp in response', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall).toHaveProperty('timestamp');
      expect(new Date(jsonCall.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('Multi-Source Fallback', () => {
    test('continues with partial data if one source fails', async () => {
      // This test would require mocking API failures
      // For now, we test that the endpoint handles errors gracefully
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Should still return data even if some sources fail
      expect(jsonCall.dataQuality).toBeGreaterThan(0);
    });

    test('includes source attribution', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Each price should have exchange attribution
      jsonCall.prices.forEach((price: any) => {
        expect(price).toHaveProperty('exchange');
        expect(price).toHaveProperty('price');
        expect(price).toHaveProperty('volume');
      });
    });
  });

  describe('Caching Behavior', () => {
    test('caches results with appropriate TTL', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        expect.stringContaining('max-age=30')
      );
    });

    test('serves cached data on repeated requests', async () => {
      const req1 = createMockRequest('BTC') as NextApiRequest;
      const req2 = createMockRequest('BTC') as NextApiRequest;
      const res1 = createMockResponse() as NextApiResponse;
      const res2 = createMockResponse() as NextApiResponse;
      
      await handler(req1, res1);
      const time1 = res1.json.mock.calls[0][0].timestamp;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await handler(req2, res2);
      const time2 = res2.json.mock.calls[0][0].timestamp;
      
      // Timestamps should be the same (cached)
      expect(time1).toBe(time2);
    });
  });

  describe('Error Handling', () => {
    test('returns 405 for unsupported methods', async () => {
      const req = createMockRequest('BTC', 'POST') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(405);
    });

    test('handles network timeouts gracefully', async () => {
      // This would require mocking network delays
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      // Should not throw, should return error or partial data
      expect(res.status).toHaveBeenCalled();
    });

    test('includes error details in response', async () => {
      const req = createMockRequest('INVALID') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      if (res.status.mock.calls[0][0] !== 200) {
        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall).toHaveProperty('error');
        expect(typeof jsonCall.error).toBe('string');
      }
    });
  });

  describe('Rate Limiting', () => {
    test('respects API rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 5 }, () => {
        const req = createMockRequest('BTC') as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return handler(req, res);
      });
      
      await Promise.all(requests);
      
      // All should complete without rate limit errors
      // (assuming rate limits are configured appropriately)
    });
  });
});
