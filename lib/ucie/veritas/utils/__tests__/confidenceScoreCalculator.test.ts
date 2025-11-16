/**
 * Tests for Veritas Confidence Score Calculator
 */

import {
  calculateVeritasConfidenceScore,
  getConfidenceLevel,
  isSufficientConfidence,
  getConfidenceRecommendation,
  ConfidenceScoreBreakdown
} from '../confidenceScoreCalculator';
import { VeritasValidationResult } from '../../types/validationTypes';

describe('Confidence Score Calculator', () => {
  // Mock validation results
  const createMockValidationResult = (
    confidence: number,
    passedChecks: string[],
    failedChecks: string[],
    fatalAlerts: number = 0
  ): VeritasValidationResult => ({
    isValid: fatalAlerts === 0,
    confidence,
    alerts: Array(fatalAlerts).fill({
      severity: 'fatal',
      type: 'market',
      message: 'Fatal error',
      affectedSources: ['TestSource'],
      recommendation: 'Review data'
    }),
    discrepancies: [],
    dataQualitySummary: {
      overallScore: confidence,
      marketDataQuality: confidence,
      socialDataQuality: 0,
      onChainDataQuality: 0,
      newsDataQuality: 0,
      passedChecks,
      failedChecks
    }
  });

  describe('calculateVeritasConfidenceScore', () => {
    test('calculates score with all data sources available', () => {
      const results = {
        market: createMockValidationResult(95, ['price_check', 'volume_check'], []),
        social: createMockValidationResult(90, ['sentiment_check'], []),
        onChain: createMockValidationResult(85, ['flow_check'], []),
        news: createMockValidationResult(88, ['correlation_check'], [])
      };

      const score = calculateVeritasConfidenceScore(results);

      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.breakdown.marketData).toBe(95);
      expect(score.breakdown.socialSentiment).toBe(90);
      expect(score.breakdown.onChainData).toBe(85);
      expect(score.breakdown.newsData).toBe(88);
      expect(score.completeness).toBe(100); // All 4 sources available
    });

    test('calculates score with partial data sources', () => {
      const results = {
        market: createMockValidationResult(90, ['price_check'], []),
        social: createMockValidationResult(85, ['sentiment_check'], [])
      };

      const score = calculateVeritasConfidenceScore(results);

      expect(score.completeness).toBe(50); // 2/4 sources available
      expect(score.breakdown.marketData).toBe(90);
      expect(score.breakdown.socialSentiment).toBe(85);
      expect(score.breakdown.onChainData).toBe(0);
      expect(score.breakdown.newsData).toBe(0);
    });

    test('penalizes fatal errors in logical consistency', () => {
      const resultsWithFatalError = {
        market: createMockValidationResult(90, ['price_check'], [], 1)
      };

      const resultsWithoutFatalError = {
        market: createMockValidationResult(90, ['price_check'], [], 0)
      };

      const scoreWithError = calculateVeritasConfidenceScore(resultsWithFatalError);
      const scoreWithoutError = calculateVeritasConfidenceScore(resultsWithoutFatalError);

      expect(scoreWithError.logicalConsistency).toBe(50); // 100 - (1 * 50)
      expect(scoreWithoutError.logicalConsistency).toBe(100);
      expect(scoreWithError.overallScore).toBeLessThan(scoreWithoutError.overallScore);
    });

    test('calculates cross-validation success rate', () => {
      const results = {
        market: createMockValidationResult(90, ['check1', 'check2'], ['check3'])
      };

      const score = calculateVeritasConfidenceScore(results);

      // 2 passed, 1 failed = 66.67% success rate
      expect(score.crossValidationSuccess).toBeCloseTo(67, 0);
    });

    test('handles empty validation results', () => {
      const results = {};

      const score = calculateVeritasConfidenceScore(results);

      expect(score.overallScore).toBe(0);
      expect(score.completeness).toBe(0);
      expect(score.dataSourceAgreement).toBe(0);
    });

    test('includes explanation in result', () => {
      const results = {
        market: createMockValidationResult(90, ['check1'], [])
      };

      const score = calculateVeritasConfidenceScore(results);

      expect(score.explanation).toBeDefined();
      expect(typeof score.explanation).toBe('string');
      expect(score.explanation.length).toBeGreaterThan(0);
    });

    test('weights components correctly', () => {
      // Create perfect scores for each component
      const results = {
        market: createMockValidationResult(100, ['check1', 'check2'], []),
        social: createMockValidationResult(100, ['check3'], []),
        onChain: createMockValidationResult(100, ['check4'], []),
        news: createMockValidationResult(100, ['check5'], [])
      };

      const score = calculateVeritasConfidenceScore(results);

      // With perfect scores, overall should be close to 100
      // (allowing for rounding and variance calculation)
      expect(score.overallScore).toBeGreaterThan(95);
      expect(score.dataSourceAgreement).toBeGreaterThan(95);
      expect(score.logicalConsistency).toBe(100);
      expect(score.crossValidationSuccess).toBe(100);
      expect(score.completeness).toBe(100);
    });
  });

  describe('getConfidenceLevel', () => {
    test('returns correct confidence levels', () => {
      expect(getConfidenceLevel(95)).toBe('excellent');
      expect(getConfidenceLevel(85)).toBe('good');
      expect(getConfidenceLevel(75)).toBe('acceptable');
      expect(getConfidenceLevel(65)).toBe('fair');
      expect(getConfidenceLevel(50)).toBe('poor');
    });

    test('handles boundary values', () => {
      expect(getConfidenceLevel(90)).toBe('excellent');
      expect(getConfidenceLevel(80)).toBe('good');
      expect(getConfidenceLevel(70)).toBe('acceptable');
      expect(getConfidenceLevel(60)).toBe('fair');
      expect(getConfidenceLevel(59)).toBe('poor');
    });
  });

  describe('isSufficientConfidence', () => {
    test('returns true for scores above threshold', () => {
      expect(isSufficientConfidence(70, 60)).toBe(true);
      expect(isSufficientConfidence(60, 60)).toBe(true);
    });

    test('returns false for scores below threshold', () => {
      expect(isSufficientConfidence(59, 60)).toBe(false);
      expect(isSufficientConfidence(50, 60)).toBe(false);
    });

    test('uses default threshold of 60', () => {
      expect(isSufficientConfidence(70)).toBe(true);
      expect(isSufficientConfidence(50)).toBe(false);
    });
  });

  describe('getConfidenceRecommendation', () => {
    test('returns appropriate recommendations', () => {
      const excellent = getConfidenceRecommendation(95);
      const good = getConfidenceRecommendation(85);
      const acceptable = getConfidenceRecommendation(75);
      const fair = getConfidenceRecommendation(65);
      const poor = getConfidenceRecommendation(50);

      expect(excellent).toContain('excellent');
      expect(good).toContain('good');
      expect(acceptable).toContain('acceptable');
      expect(fair).toContain('fair');
      expect(poor).toContain('poor');
      expect(poor).toContain('Do not make trading decisions');
    });
  });
});
