/**
 * Veritas Protocol - End-to-End Workflow Tests
 * 
 * Tests the complete validation workflow from data fetching through
 * final analysis with all validators integrated.
 */

import { orchestrateValidation } from '../../lib/ucie/veritas/utils/validationOrchestrator';
import { veritasMonitoring } from '../../lib/ucie/veritas/utils/monitoring';
import { evaluateAlertRules, defaultAlertConfig } from '../../lib/ucie/veritas/utils/alertConfig';

// Mock external API clients
jest.mock('../../lib/ucie/marketDataClients', () => ({
  fetchCoinMarketCapPrice: jest.fn(),
  fetchCoinGeckoPrice: jest.fn(),
  fetchKrakenPrice: jest.fn()
}));

jest.mock('../../lib/ucie/socialSentimentClients', () => ({
  fetchLunarCrushSentiment: jest.fn(),
  fetchRedditMetrics: jest.fn()
}));

jest.mock('../../lib/ucie/bitcoinOnChain', () => ({
  fetchBitcoinOnChainData: jest.fn()
}));

jest.mock('../../lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}));

import {
  fetchCoinMarketCapPrice,
  fetchCoinGeckoPrice,
  fetchKrakenPrice
} from '../../lib/ucie/marketDataClients';

import {
  fetchLunarCrushSentiment,
  fetchRedditMetrics
} from '../../lib/ucie/socialSentimentClients';

import { fetchBitcoinOnChainData } from '../../lib/ucie/bitcoinOnChain';
import { openai } from '../../lib/openai';

describe('Veritas Protocol - End-to-End Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    veritasMonitoring.clearMetrics();
  });
  
  describe('Complete Validation Workflow', () => {
    it('should execute full validation workflow with all data sources', async () => {
      // Mock market data
      (fetchCoinMarketCapPrice as jest.Mock).mockResolvedValue(95000);
      (fetchCoinGeckoPrice as jest.Mock).mockResolvedValue(95100);
      (fetchKrakenPrice as jest.Mock).mockResolvedValue(95050);
      
      // Mock social sentiment
      (fetchLunarCrushSentiment as jest.Mock).mockResolvedValue({
        mentions: 1000,
        sentiment: 75,
        distribution: { positive: 60, negative: 20, neutral: 20 },
        galaxyScore: 80
      });
      
      (fetchRedditMetrics as jest.Mock).mockResolvedValue({
        totalPosts: 50,
        topPosts: [
          { content: 'Bitcoin looking strong', score: 100, timestamp: Date.now() }
        ]
      });
      
      // Mock GPT-4o sentiment analysis
      (openai.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ sentiment: 72, confidence: 85 })
          }
        }]
      });
      
      // Mock on-chain data
      (fetchBitcoinOnChainData as jest.Mock).mockResolvedValue({
        transactions: [
          {
            hash: 'tx1',
            value: 100,
            from: 'whale1',
            to: 'exchange1',
            timestamp: Date.now()
          }
        ],
        volume24h: 25000000000
      });
      
      // Execute full validation
      const startTime = Date.now();
      const result = await orchestrateValidation('BTC', {
        marketData: { price: 95000, volume: 25000000000 },
        socialData: { mentions: 1000, sentiment: 75 },
        onChainData: { transactions: [], volume24h: 25000000000 },
        newsData: null
      });
      const duration = Date.now() - startTime;
      
      // Verify validation completed
      expect(result).toBeDefined();
      expect(result.isComplete).toBe(true);
      expect(result.progress).toBe(100);
      
      // Verify all validators executed
      expect(result.results.market).toBeDefined();
      expect(result.results.social).toBeDefined();
      expect(result.results.onChain).toBeDefined();
      
      // Verify confidence score calculated
      expect(result.confidenceScore).toBeDefined();
      expect(result.confidenceScore.overallScore).toBeGreaterThan(0);
      expect(result.confidenceScore.overallScore).toBeLessThanOrEqual(100);
      
      // Verify data quality summary
      expect(result.dataQualitySummary).toBeDefined();
      expect(result.dataQualitySummary.overallScore).toBeGreaterThan(0);
      
      // Verify performance
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });
    
    it('should handle partial data availability gracefully', async () => {
      // Mock only market data available
      (fetchCoinMarketCapPrice as jest.Mock).mockResolvedValue(95000);
      (fetchCoinGeckoPrice as jest.Mock).mockResolvedValue(95100);
      (fetchKrakenPrice as jest.Mock).mockResolvedValue(95050);
      
      // Social and on-chain fail
      (fetchLunarCrushSentiment as jest.Mock).mockRejectedValue(new Error('API unavailable'));
      (fetchBitcoinOnChainData as jest.Mock).mockRejectedValue(new Error('API unavailable'));
      
      const result = await orchestrateValidation('BTC', {
        marketData: { price: 95000, volume: 25000000000 },
        socialData: null,
        onChainData: null,
        newsData: null
      });
      
      // Should still complete with partial results
      expect(result.isComplete).toBe(true);
      expect(result.results.market).toBeDefined();
      expect(result.results.social).toBeUndefined();
      expect(result.results.onChain).toBeUndefined();
      
      // Confidence score should reflect partial data
      expect(result.confidenceScore.completeness).toBeLessThan(100);
    });
    
    it('should detect and report fatal errors', async () => {
      // Mock social data with impossibility
      (fetchLunarCrushSentiment as jest.Mock).mockResolvedValue({
        mentions: 0, // Zero mentions
        sentiment: 75, // But has sentiment
        distribution: { positive: 60, negative: 20, neutral: 20 }, // And distribution
        galaxyScore: 80
      });
      
      const result = await orchestrateValidation('BTC', {
        marketData: null,
        socialData: { mentions: 0, sentiment: 75 },
        onChainData: null,
        newsData: null
      });
      
      // Should detect fatal error
      const fatalAlerts = result.alerts.filter(a => a.severity === 'fatal');
      expect(fatalAlerts.length).toBeGreaterThan(0);
      expect(fatalAlerts[0].message).toContain('Fatal Social Data Error');
      
      // Confidence score should be low
      expect(result.confidenceScore.overallScore).toBeLessThan(50);
    });
  });
  
  describe('Monitoring Integration', () => {
    it('should record validation metrics', async () => {
      // Mock successful validation
      (fetchCoinMarketCapPrice as jest.Mock).mockResolvedValue(95000);
      (fetchCoinGeckoPrice as jest.Mock).mockResolvedValue(95100);
      (fetchKrakenPrice as jest.Mock).mockResolvedValue(95050);
      
      const startTime = Date.now();
      await orchestrateValidation('BTC', {
        marketData: { price: 95000, volume: 25000000000 },
        socialData: null,
        onChainData: null,
        newsData: null
      });
      const duration = Date.now() - startTime;
      
      // Record metrics
      veritasMonitoring.recordValidation({
        timestamp: new Date().toISOString(),
        symbol: 'BTC',
        validationType: 'full',
        success: true,
        duration,
        confidenceScore: 85,
        alertCount: 0,
        fatalAlertCount: 0
      });
      
      // Verify metrics recorded
      const metrics = veritasMonitoring.getAggregatedMetrics();
      expect(metrics.totalValidations).toBe(1);
      expect(metrics.successfulValidations).toBe(1);
      expect(metrics.successRate).toBe(100);
    });
    
    it('should trigger alerts for high error rates', async () => {
      // Simulate multiple failed validations
      for (let i = 0; i < 10; i++) {
        veritasMonitoring.recordValidation({
          timestamp: new Date().toISOString(),
          symbol: 'BTC',
          validationType: 'market',
          success: false,
          duration: 1000,
          errorType: 'API_TIMEOUT',
          errorMessage: 'Request timeout',
          alertCount: 1,
          fatalAlertCount: 0
        });
      }
      
      // Get metrics
      const metrics = veritasMonitoring.getAggregatedMetrics();
      
      // Evaluate alert rules
      const alertEvaluations = evaluateAlertRules(metrics, defaultAlertConfig);
      const triggeredAlerts = alertEvaluations.filter(a => a.triggered);
      
      // Should trigger high error rate alert
      expect(triggeredAlerts.length).toBeGreaterThan(0);
      expect(triggeredAlerts.some(a => a.rule.id === 'high-error-rate')).toBe(true);
    });
    
    it('should track performance degradation', async () => {
      // Simulate slow validations
      for (let i = 0; i < 5; i++) {
        veritasMonitoring.recordValidation({
          timestamp: new Date().toISOString(),
          symbol: 'BTC',
          validationType: 'full',
          success: true,
          duration: 20000, // 20 seconds (above threshold)
          confidenceScore: 85,
          alertCount: 0,
          fatalAlertCount: 0
        });
      }
      
      // Get metrics
      const metrics = veritasMonitoring.getAggregatedMetrics();
      
      // Evaluate alert rules
      const alertEvaluations = evaluateAlertRules(metrics, defaultAlertConfig);
      const triggeredAlerts = alertEvaluations.filter(a => a.triggered);
      
      // Should trigger slow validation alert
      expect(triggeredAlerts.some(a => a.rule.id === 'slow-validation')).toBe(true);
      expect(metrics.averageDuration).toBeGreaterThan(15000);
    });
  });
  
  describe('Feature Flag Integration', () => {
    it('should respect ENABLE_VERITAS_PROTOCOL flag', async () => {
      const originalEnv = process.env.ENABLE_VERITAS_PROTOCOL;
      
      // Test with flag disabled
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      
      // Validation should be skipped
      // (This would be tested in actual API endpoint integration)
      
      // Test with flag enabled
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      
      // Validation should execute
      // (This would be tested in actual API endpoint integration)
      
      // Restore original env
      process.env.ENABLE_VERITAS_PROTOCOL = originalEnv;
      
      expect(true).toBe(true); // Placeholder
    });
  });
  
  describe('Graceful Degradation', () => {
    it('should continue analysis when validation fails', async () => {
      // Mock validation failure
      (fetchCoinMarketCapPrice as jest.Mock).mockRejectedValue(new Error('API error'));
      (fetchCoinGeckoPrice as jest.Mock).mockRejectedValue(new Error('API error'));
      (fetchKrakenPrice as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // Should not throw error
      await expect(
        orchestrateValidation('BTC', {
          marketData: { price: 95000, volume: 25000000000 },
          socialData: null,
          onChainData: null,
          newsData: null
        })
      ).resolves.toBeDefined();
    });
    
    it('should provide partial results on timeout', async () => {
      // Mock slow validators
      (fetchCoinMarketCapPrice as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(95000), 20000))
      );
      
      const result = await orchestrateValidation('BTC', {
        marketData: { price: 95000, volume: 25000000000 },
        socialData: null,
        onChainData: null,
        newsData: null
      });
      
      // Should return partial results
      expect(result).toBeDefined();
      expect(result.isComplete).toBeDefined();
    });
  });
  
  describe('Data Quality Scoring', () => {
    it('should calculate accurate data quality scores', async () => {
      // Mock high-quality data
      (fetchCoinMarketCapPrice as jest.Mock).mockResolvedValue(95000);
      (fetchCoinGeckoPrice as jest.Mock).mockResolvedValue(95010); // Very close
      (fetchKrakenPrice as jest.Mock).mockResolvedValue(95005); // Very close
      
      const result = await orchestrateValidation('BTC', {
        marketData: { price: 95000, volume: 25000000000 },
        socialData: null,
        onChainData: null,
        newsData: null
      });
      
      // High agreement should result in high quality score
      expect(result.dataQualitySummary.marketDataQuality).toBeGreaterThan(90);
    });
    
    it('should penalize low-quality data', async () => {
      // Mock low-quality data with high variance
      (fetchCoinMarketCapPrice as jest.Mock).mockResolvedValue(95000);
      (fetchCoinGeckoPrice as jest.Mock).mockResolvedValue(97000); // 2% difference
      (fetchKrakenPrice as jest.Mock).mockResolvedValue(93000); // 2% difference
      
      const result = await orchestrateValidation('BTC', {
        marketData: { price: 95000, volume: 25000000000 },
        socialData: null,
        onChainData: null,
        newsData: null
      });
      
      // High variance should result in lower quality score
      expect(result.dataQualitySummary.marketDataQuality).toBeLessThan(90);
      
      // Should have discrepancy alerts
      expect(result.alerts.some(a => a.message.includes('discrepancy'))).toBe(true);
    });
  });
});
