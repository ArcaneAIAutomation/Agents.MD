/**
 * Veritas Protocol - Social Sentiment Validator Tests
 * 
 * Tests for social sentiment validation including:
 * - Impossibility detection (zero mentions with non-zero sentiment)
 * - Sentiment consistency checking (LunarCrush vs Reddit)
 * - Fatal error handling
 * 
 * Requirements: 2.3, 12.2
 */

import {
  validateSocialSentiment,
  analyzeRedditSentiment,
  type RedditSentimentAnalysis
} from '../validators/socialSentimentValidator';
import type { LunarCrushData, RedditMetrics } from '../../socialSentimentClients';

// Mock the OpenAI client
jest.mock('../../openaiClient', () => ({
  generateOpenAIAnalysis: jest.fn()
}));

// Mock the social sentiment clients
jest.mock('../../socialSentimentClients', () => ({
  fetchRedditMetrics: jest.fn()
}));

import { generateOpenAIAnalysis } from '../../openaiClient';

describe('Social Sentiment Validator', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Test 1: Impossibility Detection
  // ============================================================================
  
  describe('Impossibility Detection', () => {
    it('should detect fatal error when mentions = 0 but sentiment != 0', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: 50, // Non-zero sentiment with zero mentions = IMPOSSIBLE
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      // Should return invalid with confidence 0
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);

      // Should have fatal alert
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe('fatal');
      expect(result.alerts[0].type).toBe('social');
      expect(result.alerts[0].message).toContain('Fatal Social Data Error');
      expect(result.alerts[0].affectedSources).toContain('LunarCrush');

      // Should fail impossibility check
      expect(result.dataQualitySummary.failedChecks).toContain('social_impossibility_check');
      expect(result.dataQualitySummary.passedChecks).not.toContain('social_impossibility_check');
      expect(result.dataQualitySummary.socialDataQuality).toBe(0);
    });

    it('should pass when mentions = 0 and sentiment = 0', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: 0, // Zero sentiment with zero mentions = OK
        galaxyScore: 0,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      // Should pass impossibility check
      expect(result.dataQualitySummary.passedChecks).toContain('social_impossibility_check');
      expect(result.dataQualitySummary.failedChecks).not.toContain('social_impossibility_check');

      // Should not have fatal alerts
      const fatalAlerts = result.alerts.filter(a => a.severity === 'fatal');
      expect(fatalAlerts).toHaveLength(0);
    });

    it('should pass when mentions > 0 and sentiment != 0', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 50, // Non-zero sentiment with non-zero mentions = OK
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      // Should pass impossibility check
      expect(result.dataQualitySummary.passedChecks).toContain('social_impossibility_check');
      expect(result.dataQualitySummary.failedChecks).not.toContain('social_impossibility_check');

      // Should not have fatal alerts
      const fatalAlerts = result.alerts.filter(a => a.severity === 'fatal');
      expect(fatalAlerts).toHaveLength(0);
    });

    it('should handle negative sentiment scores correctly', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: -30, // Negative sentiment with zero mentions = IMPOSSIBLE
        galaxyScore: 40,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      // Should detect impossibility
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.alerts[0].severity).toBe('fatal');
    });
  });

  // ============================================================================
  // Test 2: Sentiment Consistency Checking
  // ============================================================================
  
  describe('Sentiment Consistency Checking', () => {
    it('should detect mismatch when sentiment difference > 30 points', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 70, // LunarCrush: +70
        galaxyScore: 80,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const redditMetrics: RedditMetrics = {
        topPosts: [
          { content: 'Bitcoin is crashing hard, sell now!', score: 100, timestamp: Date.now() },
          { content: 'Major bearish signals everywhere', score: 90, timestamp: Date.now() },
          { content: 'This is the end of crypto', score: 80, timestamp: Date.now() }
        ],
        totalPosts: 3,
        averageScore: 90,
        sentiment: 'bearish'
      };

      // Mock GPT-4o to return bearish sentiment
      (generateOpenAIAnalysis as jest.Mock).mockResolvedValue({
        content: JSON.stringify({
          overallSentiment: -40, // Reddit: -40 (difference = 110 points)
          confidence: 85,
          postAnalysis: [
            { title: 'Bitcoin is crashing', sentiment: 'bearish', score: -60, reasoning: 'Panic selling' },
            { title: 'Major bearish signals', sentiment: 'bearish', score: -40, reasoning: 'Technical breakdown' },
            { title: 'End of crypto', sentiment: 'bearish', score: -20, reasoning: 'Extreme pessimism' }
          ],
          summary: 'Overwhelmingly bearish sentiment on Reddit'
        })
      });

      const result = await validateSocialSentiment('BTC', lunarCrushData, redditMetrics);

      // Should detect mismatch
      expect(result.alerts.some(a => 
        a.severity === 'warning' && 
        a.message.includes('Social Sentiment Mismatch')
      )).toBe(true);

      // Should have discrepancy
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].metric).toBe('sentiment_score');
      expect(result.discrepancies[0].exceeded).toBe(true);
      expect(result.discrepancies[0].threshold).toBe(30);

      // Should fail consistency check
      expect(result.dataQualitySummary.failedChecks).toContain('sentiment_consistency');
    });

    it('should pass when sentiment difference <= 30 points', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 50, // LunarCrush: +50
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const redditMetrics: RedditMetrics = {
        topPosts: [
          { content: 'Bitcoin looking good today', score: 100, timestamp: Date.now() },
          { content: 'Bullish momentum building', score: 90, timestamp: Date.now() },
          { content: 'Great time to accumulate', score: 80, timestamp: Date.now() }
        ],
        totalPosts: 3,
        averageScore: 90,
        sentiment: 'bullish'
      };

      // Mock GPT-4o to return similar sentiment
      (generateOpenAIAnalysis as jest.Mock).mockResolvedValue({
        content: JSON.stringify({
          overallSentiment: 45, // Reddit: +45 (difference = 5 points)
          confidence: 90,
          postAnalysis: [
            { title: 'Bitcoin looking good', sentiment: 'bullish', score: 50, reasoning: 'Positive price action' },
            { title: 'Bullish momentum', sentiment: 'bullish', score: 45, reasoning: 'Strong technicals' },
            { title: 'Great time to accumulate', sentiment: 'bullish', score: 40, reasoning: 'Long-term bullish' }
          ],
          summary: 'Moderately bullish sentiment on Reddit'
        })
      });

      const result = await validateSocialSentiment('BTC', lunarCrushData, redditMetrics);

      // Should pass consistency check
      expect(result.dataQualitySummary.passedChecks).toContain('sentiment_consistency');
      expect(result.dataQualitySummary.failedChecks).not.toContain('sentiment_consistency');

      // Should have info alert about agreement
      expect(result.alerts.some(a => 
        a.severity === 'info' && 
        a.message.includes('Sentiment sources agree')
      )).toBe(true);
    });

    it('should handle Reddit data unavailable gracefully', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 50,
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      // Should have info alert about Reddit unavailable
      expect(result.alerts.some(a => 
        a.severity === 'info' && 
        a.message.includes('Reddit data unavailable')
      )).toBe(true);

      // Should pass single source check
      expect(result.dataQualitySummary.passedChecks).toContain('sentiment_single_source');
    });

    it('should handle empty Reddit posts gracefully', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 50,
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const redditMetrics: RedditMetrics = {
        topPosts: [], // No posts
        totalPosts: 0,
        averageScore: 0,
        sentiment: 'neutral'
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, redditMetrics);

      // Should have info alert about Reddit unavailable
      expect(result.alerts.some(a => 
        a.severity === 'info' && 
        a.message.includes('Reddit data unavailable')
      )).toBe(true);
    });
  });

  // ============================================================================
  // Test 3: Fatal Error Handling
  // ============================================================================
  
  describe('Fatal Error Handling', () => {
    it('should return confidence 0 on fatal error', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: 75, // Fatal impossibility
        galaxyScore: 80,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      expect(result.confidence).toBe(0);
      expect(result.dataQualitySummary.overallScore).toBe(0);
      expect(result.dataQualitySummary.socialDataQuality).toBe(0);
    });

    it('should mark validation as invalid on fatal error', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: -50, // Fatal impossibility
        galaxyScore: 60,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      expect(result.isValid).toBe(false);
    });

    it('should include fatal alert with proper recommendation', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: 100,
        galaxyScore: 90,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      const fatalAlert = result.alerts.find(a => a.severity === 'fatal');
      expect(fatalAlert).toBeDefined();
      expect(fatalAlert?.recommendation).toContain('Discarding social data');
      expect(fatalAlert?.affectedSources).toContain('LunarCrush');
    });

    it('should not proceed with other checks after fatal error', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: 50, // Fatal error
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const redditMetrics: RedditMetrics = {
        topPosts: [
          { content: 'Test post', score: 100, timestamp: Date.now() }
        ],
        totalPosts: 1,
        averageScore: 100,
        sentiment: 'bullish'
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, redditMetrics);

      // Should not have attempted Reddit cross-validation
      expect(generateOpenAIAnalysis).not.toHaveBeenCalled();
      
      // Should only have failed impossibility check
      expect(result.dataQualitySummary.failedChecks).toEqual(['social_impossibility_check']);
      expect(result.dataQualitySummary.passedChecks).toEqual([]);
    });
  });

  // ============================================================================
  // Test 4: Reddit Sentiment Analysis
  // ============================================================================
  
  describe('Reddit Sentiment Analysis', () => {
    it('should analyze Reddit posts with GPT-4o', async () => {
      const redditMetrics: RedditMetrics = {
        topPosts: [
          { content: 'Bitcoin to the moon!', score: 100, timestamp: Date.now() },
          { content: 'Bullish on BTC', score: 90, timestamp: Date.now() }
        ],
        totalPosts: 2,
        averageScore: 95,
        sentiment: 'bullish'
      };

      const mockAnalysis = {
        overallSentiment: 60,
        confidence: 85,
        postAnalysis: [
          { title: 'Bitcoin to the moon!', sentiment: 'bullish' as const, score: 70, reasoning: 'Very optimistic' },
          { title: 'Bullish on BTC', sentiment: 'bullish' as const, score: 50, reasoning: 'Positive outlook' }
        ],
        summary: 'Strong bullish sentiment'
      };

      (generateOpenAIAnalysis as jest.Mock).mockResolvedValue({
        content: JSON.stringify(mockAnalysis)
      });

      const result = await analyzeRedditSentiment('BTC', redditMetrics);

      expect(result.overallSentiment).toBe(60);
      expect(result.confidence).toBe(85);
      expect(result.postAnalysis).toHaveLength(2);
      expect(generateOpenAIAnalysis).toHaveBeenCalledTimes(1);
    });

    it('should fallback to keyword analysis when GPT-4o fails', async () => {
      const redditMetrics: RedditMetrics = {
        topPosts: [
          { content: 'Bitcoin is bullish and going to moon!', score: 100, timestamp: Date.now() },
          { content: 'Bearish signals everywhere, dump incoming', score: 90, timestamp: Date.now() }
        ],
        totalPosts: 2,
        averageScore: 95,
        sentiment: 'neutral'
      };

      (generateOpenAIAnalysis as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await analyzeRedditSentiment('BTC', redditMetrics);

      // Should use fallback analysis
      expect(result.confidence).toBe(50); // Lower confidence for fallback
      expect(result.summary).toContain('Fallback keyword-based analysis');
      expect(result.postAnalysis).toHaveLength(2);
    });

    it('should return zero sentiment when no posts available', async () => {
      const redditMetrics: RedditMetrics = {
        topPosts: [],
        totalPosts: 0,
        averageScore: 0,
        sentiment: 'neutral'
      };

      const result = await analyzeRedditSentiment('BTC', redditMetrics);

      expect(result.overallSentiment).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.postAnalysis).toHaveLength(0);
      expect(result.summary).toContain('No Reddit posts available');
    });
  });

  // ============================================================================
  // Test 5: Data Quality Scoring
  // ============================================================================
  
  describe('Data Quality Scoring', () => {
    it('should calculate quality score based on passed checks', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 50,
        galaxyScore: 70,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      // Should have high quality score (passed impossibility check)
      expect(result.dataQualitySummary.socialDataQuality).toBeGreaterThan(80);
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should reduce quality score for warnings', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 1000,
        sentimentScore: 80,
        galaxyScore: 90,
        altRank: 1,
        socialVolume: 5000,
        socialDominance: 2.5,
        contributors: 500
      };

      const redditMetrics: RedditMetrics = {
        topPosts: [
          { content: 'Bitcoin crashing hard', score: 100, timestamp: Date.now() }
        ],
        totalPosts: 1,
        averageScore: 100,
        sentiment: 'bearish'
      };

      (generateOpenAIAnalysis as jest.Mock).mockResolvedValue({
        content: JSON.stringify({
          overallSentiment: -50, // Large mismatch
          confidence: 85,
          postAnalysis: [],
          summary: 'Bearish'
        })
      });

      const result = await validateSocialSentiment('BTC', lunarCrushData, redditMetrics);

      // Should have reduced quality score due to warning
      expect(result.dataQualitySummary.socialDataQuality).toBeLessThan(100);
    });

    it('should set quality to 0 for fatal errors', async () => {
      const lunarCrushData: LunarCrushData = {
        mentions: 0,
        sentimentScore: 90,
        galaxyScore: 95,
        altRank: 1,
        socialVolume: 0,
        socialDominance: 0,
        contributors: 0
      };

      const result = await validateSocialSentiment('BTC', lunarCrushData, null);

      expect(result.dataQualitySummary.socialDataQuality).toBe(0);
      expect(result.dataQualitySummary.overallScore).toBe(0);
    });
  });
});
