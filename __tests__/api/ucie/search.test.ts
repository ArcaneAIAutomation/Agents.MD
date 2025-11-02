/**
 * Integration Tests: UCIE Search API
 * 
 * Tests for token search and autocomplete endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/ucie/search';

// Helper to create mock request
function createMockRequest(query: string): Partial<NextApiRequest> {
  return {
    method: 'GET',
    query: { q: query },
    headers: {}
  };
}

// Helper to create mock response
function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  };
  return res;
}

describe('UCIE Search API', () => {
  describe('GET /api/ucie/search', () => {
    test('returns search results for valid query', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.any(Array),
          query: 'BTC'
        })
      );
    });

    test('returns top 10 matches', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.results.length).toBeLessThanOrEqual(10);
    });

    test('performs case-insensitive search', async () => {
      const reqUpper = createMockRequest('BTC') as NextApiRequest;
      const reqLower = createMockRequest('btc') as NextApiRequest;
      const resUpper = createMockResponse() as NextApiResponse;
      const resLower = createMockResponse() as NextApiResponse;
      
      await handler(reqUpper, resUpper);
      await handler(reqLower, resLower);
      
      const resultsUpper = resUpper.json.mock.calls[0][0].results;
      const resultsLower = resLower.json.mock.calls[0][0].results;
      
      expect(resultsUpper).toEqual(resultsLower);
    });

    test('returns empty array for no matches', async () => {
      const req = createMockRequest('NONEXISTENTTOKEN123') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [],
          query: 'NONEXISTENTTOKEN123'
        })
      );
    });

    test('handles empty query', async () => {
      const req = createMockRequest('') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });

    test('sanitizes special characters in query', async () => {
      const req = createMockRequest('BTC<script>') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      // Should not throw error, should sanitize input
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns results with required fields', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      if (jsonCall.results.length > 0) {
        const result = jsonCall.results[0];
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('id');
      }
    });

    test('responds within acceptable time', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await handler(req, res);
      const duration = Date.now() - start;
      
      // Should respond in under 500ms
      expect(duration).toBeLessThan(500);
    });

    test('handles POST method with 405', async () => {
      const req = {
        method: 'POST',
        query: { q: 'BTC' }
      } as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(405);
    });

    test('sets appropriate cache headers', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        expect.stringContaining('max-age')
      );
    });
  });

  describe('Search Performance', () => {
    test('handles concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () => {
        const req = createMockRequest('BTC') as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return handler(req, res);
      });
      
      await expect(Promise.all(requests)).resolves.not.toThrow();
    });

    test('caches results for repeated queries', async () => {
      const req1 = createMockRequest('BTC') as NextApiRequest;
      const req2 = createMockRequest('BTC') as NextApiRequest;
      const res1 = createMockResponse() as NextApiResponse;
      const res2 = createMockResponse() as NextApiResponse;
      
      const start1 = Date.now();
      await handler(req1, res1);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await handler(req2, res2);
      const time2 = Date.now() - start2;
      
      // Second request should be faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });
});
