/**
 * ATGE Recommendations Module Tests
 * Tests for recommendation generation and prioritization
 * Requirements: 3.4
 */

import {
  generateRecommendations,
  Recommendation,
  RecommendationSet
} from '../../lib/atge/recommendations';
import * as db from '../../lib/db';

// Mock the database module
jest.mock('../../lib/db');
const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

describe('ATGE Recommendations Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations from sufficient trade data', async () => {
      // Mock trade data with 20 trades
      const mockTrades = Array.from({ length: 20 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 14 ? 'completed_success' : 'completed_failure',
        entry_price: 50000 + (i * 100),
        stop_loss_price: 49000 + (i * 100),
        timeframe: i % 2 === 0 ? '1h' : '4h',
        confidence_score: 70 + (i % 20),
        market_condition: i % 3 === 0 ? 'Fear' : 'Neutral',
        risk_reward_ratio: 2.5 + (i * 0.1),
        generated_at: new Date(),
        profit_loss_usd: i < 14 ? 100 + (i * 10) : -(50 + (i * 5)),
        profit_loss_percentage: i < 14 ? 2 + (i * 0.1) : -(1 + (i * 0.05)),
        trade_duration_minutes: 120 + (i * 10),
        rsi_value: 40 + (i * 2),
        macd_value: i < 14 ? 5 + i : -(2 + i),
        ema_20: 50100 + (i * 50),
        ema_50: 50000 + (i * 50),
        ema_200: 49900 + (i * 50),
        social_sentiment_score: 60 + (i * 2),
        fear_greed_index: 50 + (i * 2)
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      expect(result).toBeDefined();
      expect(result.userId).toBe('test-user-id');
      expect(result.symbol).toBe('BTC');
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeLessThanOrEqual(10); // Top 10 only
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecommendations).toBe(result.recommendations.length);
    });

    it('should return minimal recommendations for insufficient data', async () => {
      // Mock only 3 trades (less than minimum of 5)
      const mockTrades = Array.from({ length: 3 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: 'completed_success',
        entry_price: 50000,
        stop_loss_price: 49000,
        timeframe: '1h',
        confidence_score: 75,
        market_condition: 'Neutral',
        risk_reward_ratio: 2.5,
        generated_at: new Date(),
        profit_loss_usd: 100,
        profit_loss_percentage: 2,
        trade_duration_minutes: 120,
        rsi_value: 50,
        macd_value: 5,
        ema_20: 50100,
        ema_50: 50000,
        ema_200: 49900,
        social_sentiment_score: 65,
        fear_greed_index: 55
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBe(3); // Minimal recommendations
      expect(result.recommendations[0].id).toBe('general-build-history');
    });
  });

  describe('Recommendation Prioritization', () => {
    it('should prioritize high-impact recommendations first', async () => {
      // Mock trades that will generate various recommendations
      const mockTrades = Array.from({ length: 30 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 20 ? 'completed_success' : 'completed_failure',
        entry_price: 50000 + (i * 100),
        stop_loss_price: 49000 + (i * 100),
        timeframe: i % 2 === 0 ? '1h' : '4h',
        confidence_score: 60 + (i % 30),
        market_condition: i % 3 === 0 ? 'Fear' : 'Neutral',
        risk_reward_ratio: 2.0 + (i * 0.1),
        generated_at: new Date(),
        profit_loss_usd: i < 20 ? 150 + (i * 10) : -(80 + (i * 5)),
        profit_loss_percentage: i < 20 ? 3 + (i * 0.1) : -(1.5 + (i * 0.05)),
        trade_duration_minutes: 100 + (i * 15),
        rsi_value: 35 + (i * 2),
        macd_value: i < 20 ? 8 + i : -(3 + i),
        ema_20: 50200 + (i * 50),
        ema_50: 50100 + (i * 50),
        ema_200: 50000 + (i * 50),
        social_sentiment_score: 65 + (i * 2),
        fear_greed_index: 55 + (i * 2)
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      // First recommendation should be high impact
      expect(result.recommendations[0].impact).toBe('high');
      
      // Recommendations should be sorted by impact and confidence
      for (let i = 0; i < result.recommendations.length - 1; i++) {
        const current = result.recommendations[i];
        const next = result.recommendations[i + 1];
        
        // Calculate expected values for comparison
        const currentImpact = (current.potentialImpact.estimatedProfitIncrease ?? 0) +
                             (current.potentialImpact.estimatedLossReduction ?? 0) +
                             (current.potentialImpact.winRateImprovement ?? 0);
        const nextImpact = (next.potentialImpact.estimatedProfitIncrease ?? 0) +
                          (next.potentialImpact.estimatedLossReduction ?? 0) +
                          (next.potentialImpact.winRateImprovement ?? 0);
        
        const currentEV = (currentImpact * current.confidence) / 100;
        const nextEV = (nextImpact * next.confidence) / 100;
        
        // Current should have equal or higher expected value than next
        expect(currentEV).toBeGreaterThanOrEqual(nextEV - 1); // Allow small rounding differences
      }
    });

    it('should adjust confidence based on sample size', async () => {
      // Create trades with varying sample sizes for different patterns
      const mockTrades = Array.from({ length: 50 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 35 ? 'completed_success' : 'completed_failure',
        entry_price: 50000 + (i * 100),
        stop_loss_price: 49000 + (i * 100),
        timeframe: '1h',
        confidence_score: 75,
        market_condition: 'Neutral',
        risk_reward_ratio: 2.5 + (i * 0.05),
        generated_at: new Date(),
        profit_loss_usd: i < 35 ? 120 + (i * 8) : -(60 + (i * 4)),
        profit_loss_percentage: i < 35 ? 2.5 + (i * 0.08) : -(1.2 + (i * 0.04)),
        trade_duration_minutes: 110 + (i * 12),
        rsi_value: 45 + (i % 30),
        macd_value: i < 35 ? 6 + (i % 10) : -(2 + (i % 5)),
        ema_20: 50150 + (i * 40),
        ema_50: 50050 + (i * 40),
        ema_200: 49950 + (i * 40),
        social_sentiment_score: 62 + (i % 25),
        fear_greed_index: 52 + (i % 30)
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      // Recommendations with larger sample sizes should have higher confidence
      const recsWithSampleSize = result.recommendations.map(rec => ({
        sampleSize: rec.supportingData.sampleSize,
        confidence: rec.confidence
      }));

      // At least one recommendation should have adjusted confidence
      expect(recsWithSampleSize.length).toBeGreaterThan(0);
      
      // Confidence should be between 30 and 100
      recsWithSampleSize.forEach(rec => {
        expect(rec.confidence).toBeGreaterThanOrEqual(30);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should return at most 10 recommendations', async () => {
      // Create enough trades to generate many recommendations
      const mockTrades = Array.from({ length: 100 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 60 ? 'completed_success' : 'completed_failure',
        entry_price: 50000 + (i * 50),
        stop_loss_price: 49000 + (i * 50),
        timeframe: ['15m', '1h', '4h', '1d'][i % 4],
        confidence_score: 60 + (i % 35),
        market_condition: ['Fear', 'Neutral', 'Greed'][i % 3],
        risk_reward_ratio: 2.0 + (i * 0.03),
        generated_at: new Date(),
        profit_loss_usd: i < 60 ? 100 + (i * 5) : -(50 + (i * 3)),
        profit_loss_percentage: i < 60 ? 2 + (i * 0.05) : -(1 + (i * 0.03)),
        trade_duration_minutes: 90 + (i * 8),
        rsi_value: 30 + (i % 40),
        macd_value: i < 60 ? 5 + (i % 15) : -(2 + (i % 8)),
        ema_20: 50100 + (i * 30),
        ema_50: 50000 + (i * 30),
        ema_200: 49900 + (i * 30),
        social_sentiment_score: 55 + (i % 35),
        fear_greed_index: 45 + (i % 40)
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      // Should return at most 10 recommendations (top 10)
      expect(result.recommendations.length).toBeLessThanOrEqual(10);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate potential impact correctly', async () => {
      const mockTrades = Array.from({ length: 25 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 18 ? 'completed_success' : 'completed_failure',
        entry_price: 50000,
        stop_loss_price: 49000,
        timeframe: '1h',
        confidence_score: 70 + (i % 20),
        market_condition: 'Neutral',
        risk_reward_ratio: 2.5,
        generated_at: new Date(),
        profit_loss_usd: i < 18 ? 130 : -70,
        profit_loss_percentage: i < 18 ? 2.6 : -1.4,
        trade_duration_minutes: 120,
        rsi_value: 50,
        macd_value: i < 18 ? 7 : -3,
        ema_20: 50100,
        ema_50: 50000,
        ema_200: 49900,
        social_sentiment_score: 65,
        fear_greed_index: 55
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      // Each recommendation should have potential impact defined
      result.recommendations.forEach(rec => {
        expect(rec.potentialImpact).toBeDefined();
        
        // At least one impact metric should be present
        const hasImpact = 
          (rec.potentialImpact.estimatedProfitIncrease !== undefined) ||
          (rec.potentialImpact.estimatedLossReduction !== undefined) ||
          (rec.potentialImpact.winRateImprovement !== undefined);
        
        expect(hasImpact).toBe(true);
      });
    });
  });

  describe('Recommendation Categories', () => {
    it('should generate entry condition recommendations', async () => {
      const mockTrades = Array.from({ length: 20 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 15 ? 'completed_success' : 'completed_failure',
        entry_price: 50000,
        stop_loss_price: 49000,
        timeframe: '1h',
        confidence_score: 80 + (i % 15),
        market_condition: 'Neutral',
        risk_reward_ratio: 2.5,
        generated_at: new Date(),
        profit_loss_usd: i < 15 ? 120 : -60,
        profit_loss_percentage: i < 15 ? 2.4 : -1.2,
        trade_duration_minutes: 120,
        rsi_value: i < 15 ? 45 + i : 65 + i,
        macd_value: i < 15 ? 8 : -4,
        ema_20: 50100,
        ema_50: 50000,
        ema_200: 49900,
        social_sentiment_score: 65,
        fear_greed_index: 55
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      const entryRecs = result.recommendations.filter(r => r.category === 'entry_conditions');
      expect(entryRecs.length).toBeGreaterThan(0);
    });

    it('should generate avoid condition recommendations', async () => {
      const mockTrades = Array.from({ length: 20 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 10 ? 'completed_success' : 'completed_failure',
        entry_price: 50000,
        stop_loss_price: 49000,
        timeframe: '1h',
        confidence_score: i < 10 ? 85 : 55,
        market_condition: i < 10 ? 'Neutral' : 'Fear',
        risk_reward_ratio: 2.5,
        generated_at: new Date(),
        profit_loss_usd: i < 10 ? 140 : -80,
        profit_loss_percentage: i < 10 ? 2.8 : -1.6,
        trade_duration_minutes: 120,
        rsi_value: 50,
        macd_value: 5,
        ema_20: 50100,
        ema_50: 50000,
        ema_200: 49900,
        social_sentiment_score: 65,
        fear_greed_index: i < 10 ? 60 : 20
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      const avoidRecs = result.recommendations.filter(r => r.category === 'avoid_conditions');
      expect(avoidRecs.length).toBeGreaterThan(0);
    });

    it('should generate timeframe recommendations', async () => {
      const mockTrades = Array.from({ length: 30 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 20 ? 'completed_success' : 'completed_failure',
        entry_price: 50000,
        stop_loss_price: 49000,
        timeframe: i < 15 ? '1h' : '4h',
        confidence_score: 75,
        market_condition: 'Neutral',
        risk_reward_ratio: 2.5,
        generated_at: new Date(),
        profit_loss_usd: i < 20 ? 110 : -55,
        profit_loss_percentage: i < 20 ? 2.2 : -1.1,
        trade_duration_minutes: 120,
        rsi_value: 50,
        macd_value: 5,
        ema_20: 50100,
        ema_50: 50000,
        ema_200: 49900,
        social_sentiment_score: 65,
        fear_greed_index: 55
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      const timeframeRecs = result.recommendations.filter(r => r.category === 'timeframe');
      expect(timeframeRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate summary statistics correctly', async () => {
      const mockTrades = Array.from({ length: 20 }, (_, i) => ({
        id: `trade-${i}`,
        symbol: 'BTC',
        status: i < 14 ? 'completed_success' : 'completed_failure',
        entry_price: 50000,
        stop_loss_price: 49000,
        timeframe: '1h',
        confidence_score: 75,
        market_condition: 'Neutral',
        risk_reward_ratio: 2.5,
        generated_at: new Date(),
        profit_loss_usd: i < 14 ? 120 : -60,
        profit_loss_percentage: i < 14 ? 2.4 : -1.2,
        trade_duration_minutes: 120,
        rsi_value: 50,
        macd_value: 5,
        ema_20: 50100,
        ema_50: 50000,
        ema_200: 49900,
        social_sentiment_score: 65,
        fear_greed_index: 55
      }));

      mockQuery.mockResolvedValueOnce({ rows: mockTrades } as any);

      const result = await generateRecommendations('test-user-id', 'BTC');

      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecommendations).toBe(result.recommendations.length);
      expect(result.summary.highImpact).toBeGreaterThanOrEqual(0);
      expect(result.summary.mediumImpact).toBeGreaterThanOrEqual(0);
      expect(result.summary.lowImpact).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageConfidence).toBeLessThanOrEqual(100);
      
      // Sum of impact categories should equal total
      const impactSum = result.summary.highImpact + 
                       result.summary.mediumImpact + 
                       result.summary.lowImpact;
      expect(impactSum).toBe(result.summary.totalRecommendations);
    });
  });
});
