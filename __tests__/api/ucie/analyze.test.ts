/**
 * Integration Tests: UCIE Analysis API
 * 
 * Tests for comprehensive token analysis endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/ucie/analyze/[symbol]';

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

describe('UCIE Analysis API', () => {
  // Increase timeout for comprehensive analysis
  jest.setTimeout(20000);

  describe('GET /api/ucie/analyze/[symbol]', () => {
    test('returns comprehensive analysis for valid symbol', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC',
          timestamp: expect.any(String),
          dataQualityScore: expect.any(Number),
          marketData: expect.any(Object),
          technical: expect.any(Object),
          sentiment: expect.any(Object),
          risk: expect.any(Object),
          consensus: expect.any(Object)
        })
      );
    });

    test('includes all required analysis sections', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Verify all major sections exist
      expect(jsonCall).toHaveProperty('marketData');
      expect(jsonCall).toHaveProperty('research');
      expect(jsonCall).toHaveProperty('onChain');
      expect(jsonCall).toHaveProperty('sentiment');
      expect(jsonCall).toHaveProperty('news');
      expect(jsonCall).toHaveProperty('technical');
      expect(jsonCall).toHaveProperty('predictions');
      expect(jsonCall).toHaveProperty('risk');
      expect(jsonCall).toHaveProperty('consensus');
      expect(jsonCall).toHaveProperty('executiveSummary');
    });

    test('completes within 15 seconds', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await handler(req, res);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(15000);
    });

    test('data quality score is above 80%', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall.dataQualityScore).toBeGreaterThan(80);
    });

    test('generates actionable recommendation', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall.consensus).toHaveProperty('recommendation');
      expect(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'])
        .toContain(jsonCall.consensus.recommendation);
    });

    test('includes confidence scores', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall.consensus).toHaveProperty('confidence');
      expect(jsonCall.consensus.confidence).toBeGreaterThanOrEqual(0);
      expect(jsonCall.consensus.confidence).toBeLessThanOrEqual(100);
    });

    test('handles invalid symbol', async () => {
      const req = createMockRequest('INVALID123') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('validates symbol format', async () => {
      const req = createMockRequest('BTC<script>') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Progressive Loading', () => {
    test('returns phase 1 data quickly', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await handler(req, res);
      const duration = Date.now() - start;
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Phase 1 data should be available
      expect(jsonCall.marketData).toBeDefined();
      expect(jsonCall.marketData.prices).toBeDefined();
    });

    test('includes loading status for each phase', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Should indicate which phases are complete
      expect(jsonCall).toHaveProperty('loadingStatus');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('continues with partial data if some sources fail', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Should have data even if some sources failed
      expect(jsonCall.dataQualityScore).toBeGreaterThan(0);
    });

    test('includes warnings for failed data sources', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      if (jsonCall.dataQualityScore < 100) {
        expect(jsonCall).toHaveProperty('warnings');
        expect(Array.isArray(jsonCall.warnings)).toBe(true);
      }
    });

    test('handles API timeouts gracefully', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      // Should complete even with timeouts
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('Caching Strategy', () => {
    test('caches complete analysis', async () => {
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
      
      // Second request should be significantly faster (cached)
      expect(time2).toBeLessThan(time1 * 0.5);
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

  describe('Data Aggregation', () => {
    test('aggregates data from multiple sources', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Market data should be from multiple exchanges
      expect(jsonCall.marketData.prices.length).toBeGreaterThan(1);
    });

    test('calculates consensus from multiple signals', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      // Consensus should aggregate multiple dimensions
      expect(jsonCall.consensus).toHaveProperty('shortTerm');
      expect(jsonCall.consensus).toHaveProperty('mediumTerm');
      expect(jsonCall.consensus).toHaveProperty('longTerm');
    });
  });

  describe('Executive Summary', () => {
    test('generates executive summary', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall.executiveSummary).toHaveProperty('topFindings');
      expect(jsonCall.executiveSummary).toHaveProperty('opportunities');
      expect(jsonCall.executiveSummary).toHaveProperty('risks');
      expect(jsonCall.executiveSummary).toHaveProperty('actionableInsights');
    });

    test('limits top findings to 5', async () => {
      const req = createMockRequest('BTC') as NextApiRequest;
      const res = createMockResponse() as NextApiResponse;
      
      await handler(req, res);
      
      const jsonCall = res.json.mock.calls[0][0];
      
      expect(jsonCall.executiveSummary.topFindings.length).toBeLessThanOrEqual(5);
    });
  });
});
