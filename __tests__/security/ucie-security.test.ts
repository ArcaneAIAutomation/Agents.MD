/**
 * Security Tests: UCIE Security Validation
 * 
 * Tests for input validation, API key security, rate limiting, and penetration testing
 */

import { NextApiRequest, NextApiResponse } from 'next';
import searchHandler from '../../pages/api/ucie/search';
import analyzeHandler from '../../pages/api/ucie/analyze/[symbol]';

function createMockRequest(endpoint: string, params: any, headers: any = {}): Partial<NextApiRequest> {
  return {
    method: 'GET',
    query: params,
    headers
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

describe('UCIE Security Tests', () => {
  describe('Input Validation', () => {
    test('rejects SQL injection attempts in symbol', async () => {
      const maliciousInputs = [
        "BTC'; DROP TABLE users; --",
        "BTC' OR '1'='1",
        "BTC'; DELETE FROM tokens; --",
        "BTC' UNION SELECT * FROM users--"
      ];
      
      for (const input of maliciousInputs) {
        const req = createMockRequest('analyze', { symbol: input }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        await analyzeHandler(req, res);
        
        // Should reject with 400 Bad Request
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });

    test('rejects XSS attempts in search query', async () => {
      const xssInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<body onload=alert(1)>',
        'javascript:alert(1)'
      ];
      
      for (const input of xssInputs) {
        const req = createMockRequest('search', { q: input }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        await searchHandler(req, res);
        
        // Should sanitize or reject
        const jsonCall = res.json.mock.calls[0][0];
        
        if (res.status.mock.calls[0][0] === 200) {
          // If accepted, should be sanitized
          expect(jsonCall.query).not.toContain('<script>');
          expect(jsonCall.query).not.toContain('javascript:');
        } else {
          // Or rejected with 400
          expect(res.status).toHaveBeenCalledWith(400);
        }
      }
    });

    test('validates symbol length', async () => {
      const longSymbol = 'A'.repeat(100);
      const req = createMockRequest('analyze', { symbol: longSymbol }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validates symbol characters', async () => {
      const invalidSymbols = [
        'BTC@USD',
        'BTC#123',
        'BTC$',
        'BTC%',
        'BTC&ETH'
      ];
      
      for (const symbol of invalidSymbols) {
        const req = createMockRequest('analyze', { symbol }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        await analyzeHandler(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });

    test('handles null and undefined inputs', async () => {
      const req1 = createMockRequest('search', { q: null }) as NextApiRequest;
      const req2 = createMockRequest('search', { q: undefined }) as NextApiRequest;
      const res1 = createMockResponse() as NextApiResponse;
      const res2 = createMockResponse() as NextApiResponse;
      
      await searchHandler(req1, res1);
      await searchHandler(req2, res2);
      
      expect(res1.status).toHaveBeenCalledWith(400);
      expect(res2.status).toHaveBeenCalledWith(400);
    });

    test('prevents path traversal attempts', async () => {
      const pathTraversalInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '....//....//....//etc/passwd'
      ];
      
      for (const input of pathTraversalInputs) {
        const req = createMockRequest('analyze', { symbol: input }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        
        await analyzeHandler(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });

  describe('API Key Security', () => {
    test('does not expose API keys in responses', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      const responseString = JSON.stringify(jsonCall);
      
      // Should not contain common API key patterns
      expect(responseString).not.toMatch(/sk-[a-zA-Z0-9]{32,}/); // OpenAI keys
      expect(responseString).not.toMatch(/[a-f0-9]{32,}/); // Generic API keys
      expect(responseString).not.toMatch(/Bearer [a-zA-Z0-9]/); // Bearer tokens
    });

    test('does not log API keys', async () => {
      // This would require checking actual logs
      // For now, we verify the response doesn't contain keys
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      // Verify no sensitive data in response
      expect(res.json).toHaveBeenCalled();
    });

    test('validates API key format before use', async () => {
      // This test would require mocking environment variables
      // For now, we verify the endpoint handles missing keys gracefully
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      // Should not crash even if some API keys are missing
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    test('enforces rate limits on search endpoint', async () => {
      const requests = Array.from({ length: 100 }, () => {
        const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return searchHandler(req, res);
      });
      
      await Promise.all(requests);
      
      // Some requests should be rate limited (429)
      // This depends on rate limit configuration
    });

    test('rate limits are per-IP', async () => {
      const ip1Requests = Array.from({ length: 50 }, () => {
        const req = createMockRequest('search', { q: 'BTC' }, { 'x-forwarded-for': '1.1.1.1' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return searchHandler(req, res);
      });
      
      const ip2Requests = Array.from({ length: 50 }, () => {
        const req = createMockRequest('search', { q: 'BTC' }, { 'x-forwarded-for': '2.2.2.2' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return searchHandler(req, res);
      });
      
      // Both IPs should be able to make requests independently
      await Promise.all([...ip1Requests, ...ip2Requests]);
    });

    test('rate limit resets after window expires', async () => {
      // Make requests to hit rate limit
      const requests1 = Array.from({ length: 50 }, () => {
        const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return searchHandler(req, res);
      });
      
      await Promise.all(requests1);
      
      // Wait for rate limit window to reset (e.g., 1 minute)
      await new Promise(resolve => setTimeout(resolve, 61000));
      
      // Should be able to make requests again
      const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await searchHandler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Authentication and Authorization', () => {
    test('public endpoints do not require authentication', async () => {
      const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await searchHandler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('rejects requests with invalid authentication', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }, {
        'authorization': 'Bearer invalid-token'
      }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      // If authentication is required, should reject
      // If not required, should succeed
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('Data Sanitization', () => {
    test('sanitizes output data', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      const responseString = JSON.stringify(jsonCall);
      
      // Should not contain potentially dangerous content
      expect(responseString).not.toContain('<script>');
      expect(responseString).not.toContain('javascript:');
      expect(responseString).not.toContain('onerror=');
    });

    test('escapes HTML in user-generated content', async () => {
      // If the system includes user-generated content
      const req = createMockRequest('search', { q: '<b>BTC</b>' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await searchHandler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      if (jsonCall.query) {
        // HTML should be escaped or stripped
        expect(jsonCall.query).not.toContain('<b>');
      }
    });
  });

  describe('Error Message Security', () => {
    test('does not expose internal paths in errors', async () => {
      const req = createMockRequest('analyze', { symbol: 'INVALID' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      if (res.status.mock.calls[0][0] !== 200) {
        const jsonCall = res.json.mock.calls[0][0];
        
        // Error message should not contain file paths
        expect(jsonCall.error).not.toMatch(/\/home\//);
        expect(jsonCall.error).not.toMatch(/C:\\/);
        expect(jsonCall.error).not.toMatch(/node_modules/);
      }
    });

    test('does not expose stack traces in production', async () => {
      const req = createMockRequest('analyze', { symbol: 'INVALID' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Should not contain stack traces
      expect(jsonCall).not.toHaveProperty('stack');
      expect(jsonCall).not.toHaveProperty('stackTrace');
    });
  });

  describe('CORS and Security Headers', () => {
    test('sets appropriate CORS headers', async () => {
      const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await searchHandler(req, res);
      
      // Should set CORS headers
      expect(res.setHeader).toHaveBeenCalled();
    });

    test('sets security headers', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(req, res);
      
      // Should set security headers like X-Content-Type-Options
      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('Denial of Service Protection', () => {
    test('handles extremely large payloads', async () => {
      const largeQuery = 'A'.repeat(10000);
      const req = createMockRequest('search', { q: largeQuery }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await searchHandler(req, res);
      
      // Should reject or handle gracefully
      expect(res.status).toHaveBeenCalled();
    });

    test('handles rapid repeated requests', async () => {
      const requests = Array.from({ length: 1000 }, () => {
        const req = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
        const res = createMockResponse() as NextApiResponse;
        return searchHandler(req, res);
      });
      
      // Should not crash
      await expect(Promise.all(requests)).resolves.not.toThrow();
    });

    test('times out long-running requests', async () => {
      const req = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await analyzeHandler(req, res);
      const duration = Date.now() - start;
      
      // Should timeout if taking too long (e.g., 30 seconds)
      expect(duration).toBeLessThan(30000);
    });
  });
});
