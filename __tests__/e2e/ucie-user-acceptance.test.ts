/**
 * User Acceptance Tests: UCIE End-to-End User Flows
 * 
 * Tests for complete user journeys and real-world usage scenarios
 */

import { NextApiRequest, NextApiResponse } from 'next';
import searchHandler from '../../pages/api/ucie/search';
import analyzeHandler from '../../pages/api/ucie/analyze/[symbol]';

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

describe('UCIE User Acceptance Tests', () => {
  jest.setTimeout(30000);

  describe('User Journey: First-Time User', () => {
    test('complete flow: search → select → analyze → understand', async () => {
      // Step 1: User searches for a token
      const searchReq = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const searchRes = createMockResponse() as NextApiResponse;
      
      await searchHandler(searchReq, searchRes);
      
      expect(searchRes.status).toHaveBeenCalledWith(200);
      const searchResults = searchRes.json.mock.calls[0][0];
      expect(searchResults.results.length).toBeGreaterThan(0);
      
      // Step 2: User selects first result
      const selectedToken = searchResults.results[0];
      expect(selectedToken).toHaveProperty('symbol');
      
      // Step 3: User requests analysis
      const analyzeReq = createMockRequest('analyze', { symbol: selectedToken.symbol }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      expect(analyzeRes.status).toHaveBeenCalledWith(200);
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Step 4: Verify user can understand key information
      expect(analysis).toHaveProperty('executiveSummary');
      expect(analysis.executiveSummary).toHaveProperty('topFindings');
      expect(analysis.executiveSummary).toHaveProperty('actionableInsights');
      expect(analysis).toHaveProperty('consensus');
      expect(analysis.consensus).toHaveProperty('recommendation');
      
      // Recommendation should be clear
      expect(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'])
        .toContain(analysis.consensus.recommendation);
    });
  });

  describe('User Journey: Professional Trader', () => {
    test('complete flow: quick analysis → technical details → risk assessment', async () => {
      // Step 1: Trader requests quick analysis
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Step 2: Verify technical analysis is comprehensive
      expect(analysis.technical).toHaveProperty('indicators');
      expect(analysis.technical.indicators).toHaveProperty('rsi');
      expect(analysis.technical.indicators).toHaveProperty('macd');
      expect(analysis.technical.indicators).toHaveProperty('bollingerBands');
      
      // Step 3: Verify risk metrics are detailed
      expect(analysis.risk).toHaveProperty('overallScore');
      expect(analysis.risk).toHaveProperty('volatility');
      expect(analysis.risk).toHaveProperty('maxDrawdown');
      
      // Step 4: Verify actionable trading signals
      expect(analysis.technical).toHaveProperty('tradingSignals');
      
      if (analysis.technical.tradingSignals && analysis.technical.tradingSignals.length > 0) {
        const signal = analysis.technical.tradingSignals[0];
        expect(signal).toHaveProperty('type'); // buy/sell
        expect(signal).toHaveProperty('confidence');
      }
    });
  });

  describe('User Journey: Research Analyst', () => {
    test('complete flow: deep research → data verification → report generation', async () => {
      // Step 1: Analyst requests comprehensive analysis
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Step 2: Verify research depth
      expect(analysis).toHaveProperty('research');
      expect(analysis.research).toHaveProperty('technologyOverview');
      expect(analysis.research).toHaveProperty('sources');
      
      // Step 3: Verify data sources are cited
      if (analysis.research.sources) {
        expect(Array.isArray(analysis.research.sources)).toBe(true);
        
        if (analysis.research.sources.length > 0) {
          const source = analysis.research.sources[0];
          expect(source).toHaveProperty('title');
          expect(source).toHaveProperty('url');
        }
      }
      
      // Step 4: Verify data quality indicators
      expect(analysis).toHaveProperty('dataQualityScore');
      expect(analysis.dataQualityScore).toBeGreaterThan(0);
      expect(analysis.dataQualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('User Journey: Mobile User', () => {
    test('mobile-optimized experience with progressive loading', async () => {
      // Simulate mobile request
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      analyzeReq.headers = {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      };
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await analyzeHandler(analyzeReq as NextApiRequest, analyzeRes);
      const duration = Date.now() - start;
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Should complete quickly for mobile
      expect(duration).toBeLessThan(15000);
      
      // Should have loading status
      expect(analysis).toHaveProperty('loadingStatus');
      
      // Critical data should be available
      expect(analysis.marketData).toBeDefined();
      expect(analysis.consensus).toBeDefined();
    });
  });

  describe('Usability: Error Recovery', () => {
    test('user can recover from invalid token search', async () => {
      // Step 1: User enters invalid token
      const searchReq = createMockRequest('search', { q: 'INVALIDTOKEN123' }) as NextApiRequest;
      const searchRes = createMockResponse() as NextApiResponse;
      
      await searchHandler(searchReq, searchRes);
      
      const searchResults = searchRes.json.mock.calls[0][0];
      
      // Step 2: System provides helpful feedback
      expect(searchResults.results).toHaveLength(0);
      
      // Step 3: User tries valid token
      const searchReq2 = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const searchRes2 = createMockResponse() as NextApiResponse;
      
      await searchHandler(searchReq2, searchRes2);
      
      const searchResults2 = searchRes2.json.mock.calls[0][0];
      expect(searchResults2.results.length).toBeGreaterThan(0);
    });

    test('user receives clear error messages', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'INVALID' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      if (analyzeRes.status.mock.calls[0][0] !== 200) {
        const error = analyzeRes.json.mock.calls[0][0];
        
        // Error message should be user-friendly
        expect(error).toHaveProperty('error');
        expect(typeof error.error).toBe('string');
        expect(error.error.length).toBeGreaterThan(0);
        
        // Should not contain technical jargon
        expect(error.error).not.toContain('undefined');
        expect(error.error).not.toContain('null');
      }
    });
  });

  describe('Usability: Data Interpretation', () => {
    test('provides plain-language explanations', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Technical indicators should have interpretations
      if (analysis.technical && analysis.technical.indicators) {
        const rsi = analysis.technical.indicators.rsi;
        
        if (rsi) {
          expect(rsi).toHaveProperty('interpretation');
          expect(typeof rsi.interpretation).toBe('string');
          expect(rsi.interpretation.length).toBeGreaterThan(0);
        }
      }
    });

    test('provides confidence scores for predictions', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Predictions should have confidence scores
      if (analysis.predictions) {
        expect(analysis.predictions.price24h).toHaveProperty('confidence');
        expect(analysis.predictions.price24h.confidence).toBeGreaterThanOrEqual(0);
        expect(analysis.predictions.price24h.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Accessibility: Screen Reader Support', () => {
    test('provides structured data for screen readers', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Data should be well-structured
      expect(analysis).toHaveProperty('symbol');
      expect(analysis).toHaveProperty('timestamp');
      
      // Key findings should be in array format
      expect(analysis.executiveSummary.topFindings).toBeInstanceOf(Array);
    });

    test('includes descriptive labels for all metrics', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // All metrics should have clear labels
      if (analysis.risk) {
        expect(analysis.risk).toHaveProperty('overallScore');
        expect(typeof analysis.risk.overallScore).toBe('number');
      }
    });
  });

  describe('Performance: User Perception', () => {
    test('provides immediate feedback on search', async () => {
      const searchReq = createMockRequest('search', { q: 'BTC' }) as NextApiRequest;
      const searchRes = createMockResponse() as NextApiResponse;
      
      const start = Date.now();
      await searchHandler(searchReq, searchRes);
      const duration = Date.now() - start;
      
      // Should feel instant (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('shows progress for long-running analysis', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Should indicate loading status
      expect(analysis).toHaveProperty('loadingStatus');
    });
  });

  describe('Data Quality: User Trust', () => {
    test('displays data freshness timestamps', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Should have timestamp
      expect(analysis).toHaveProperty('timestamp');
      expect(new Date(analysis.timestamp).getTime()).toBeGreaterThan(0);
    });

    test('indicates data quality score', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Should have quality score
      expect(analysis).toHaveProperty('dataQualityScore');
      expect(analysis.dataQualityScore).toBeGreaterThan(0);
    });

    test('cites data sources', async () => {
      const analyzeReq = createMockRequest('analyze', { symbol: 'BTC' }) as NextApiRequest;
      const analyzeRes = createMockResponse() as NextApiResponse;
      
      await analyzeHandler(analyzeReq, analyzeRes);
      
      const analysis = analyzeRes.json.mock.calls[0][0];
      
      // Should cite sources
      if (analysis.research && analysis.research.sources) {
        expect(analysis.research.sources.length).toBeGreaterThan(0);
      }
    });
  });
});
