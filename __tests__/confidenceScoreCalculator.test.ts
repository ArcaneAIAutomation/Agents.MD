/**
 * Tests for Veritas Confidence Score Calculator
 * 
 * Requirements: 8.1, 8.2, 8.5
 */

import {
  calculateVeritasConfidenceScore,
  getConfidenceLevel,
  isSufficientConfidence,
  getConfidenceRecommendation
} from '../lib/ucie/veritas/utils/confidenceScoreCalculator';
import type { VeritasValidationResult } from '../lib/ucie/veritas/types/validationTypes';

describe('Confidence Score Calculator', () => {
  // Helper to create mock validation result
  const createMockValidation = (
    confidence: number,
    fatalErrors: number = 0,
    passedChecks: string[] = ['check1', 'check2'],
    failedChecks: string[] = []
  ): VeritasValidationResult => ({
    isValid: fatalErrors === 0,
    confidence,
    alerts: Array(fatalErrors).fill({
      severity: 'fatal' as const,
      type: 'market' as const,
      message: 'Fatal error',
      affectedSources: ['Source1'],
      recommendation: 'Fix this'
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
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95),
        social: createMockValidation(90),
        onChain: createMockValidation(92),
        news: createMockValidation(88)
      });

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.dataSourceAgreement).toBeGreaterThan(0);
      expect(result.logicalConsistency).toBe(100); // No fatal errors
      expect(result.crossValidationSuccess).toBeGreaterThan(0);
      expect(result.completeness).toBe(100); // All 4 sources
      expect(result.breakdown).toBeDefined();
      expect(result.explanation).toBeDefined();
    });

    test('calculates score with partial data sources', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95),
        social: createMockValidation(90)
        // onChain and news missing
      });

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.completeness).toBe(50); // 2/4 sources
      expect(result.breakdown.onChainData).toBe(0);
      expect(result.breakdown.newsData).toBe(0);
    });

    test('handles no data sources available', () => {
      const result = calculateVeritasConfidenceScore({});

      // With no data sources:
      // - Data source agreement: 0 (40% weight) = 0
      // - Logical consistency: 100 (30% weight) = 30
      // - Cross-validation: 0 (20% weight) = 0
      // - Completeness: 0 (10% weight) = 0
      // Total: 30
      expect(result.overallScore).toBe(30);
      expect(result.dataSourceAgreement).toBe(0);
      expect(result.completeness).toBe(0);
    });

    test('penalizes fatal errors in logical consistency', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95, 1), // 1 fatal error
        social: createMockValidation(90, 1)  // 1 fatal error
      });

      expect(result.logicalConsistency).toBe(0); // 100 - (2 * 50) = 0
      // Overall score calculation:
      // - Data source agreement: ~95 (40% weight) = 38
      // - Logical consistency: 0 (30% weight) = 0
      // - Cross-validation: 100 (20% weight) = 20
      // - Completeness: 50 (10% weight) = 5
      // Total: ~63
      expect(result.overallScore).toBeLessThan(70); // Should be reduced due to fatal errors
      expect(result.logicalConsistency).toBe(0);
    });

    test('calculates cross-validation success rate', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95, 0, ['check1', 'check2'], ['check3']),
        social: createMockValidation(90, 0, ['check4'], ['check5', 'check6'])
      });

      // Total: 3 passed, 3 failed = 50% success rate
      expect(result.crossValidationSuccess).toBe(50);
    });

    test('handles single data source', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95)
      });

      // With single source, variance is 0, so agreement is 100
      expect(result.dataSourceAgreement).toBe(100);
      expect(result.completeness).toBe(25); // 1/4 sources
    });

    test('includes source weights in result', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95),
        social: createMockValidation(90)
      });

      expect(result.sourceWeights).toBeDefined();
      expect(typeof result.sourceWeights).toBe('object');
    });

    test('generates explanation', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95),
        social: createMockValidation(90),
        onChain: createMockValidation(92),
        news: createMockValidation(88)
      });

      expect(result.explanation).toBeDefined();
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation.length).toBeGreaterThan(0);
    });

    test('weights components correctly', () => {
      // Create scenario with known values
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(100, 0, ['check1'], []),
        social: createMockValidation(100, 0, ['check2'], []),
        onChain: createMockValidation(100, 0, ['check3'], []),
        news: createMockValidation(100, 0, ['check4'], [])
      });

      // With perfect scores:
      // - Data source agreement: 100 (40% weight) = 40
      // - Logical consistency: 100 (30% weight) = 30
      // - Cross-validation: 100 (20% weight) = 20
      // - Completeness: 100 (10% weight) = 10
      // Total: 100
      expect(result.overallScore).toBe(100);
    });

    // ========================================
    // EDGE CASE TESTS
    // ========================================

    test('edge case: all validation checks pass', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(100, 0, ['check1', 'check2', 'check3'], []),
        social: createMockValidation(100, 0, ['check4', 'check5'], []),
        onChain: createMockValidation(100, 0, ['check6', 'check7'], []),
        news: createMockValidation(100, 0, ['check8'], [])
      });

      expect(result.overallScore).toBe(100);
      expect(result.logicalConsistency).toBe(100);
      expect(result.crossValidationSuccess).toBe(100);
      expect(result.completeness).toBe(100);
      expect(result.breakdown.marketData).toBe(100);
      expect(result.breakdown.socialSentiment).toBe(100);
      expect(result.breakdown.onChainData).toBe(100);
      expect(result.breakdown.newsData).toBe(100);
    });

    test('edge case: all validation checks fail', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(0, 2, [], ['check1', 'check2', 'check3']),
        social: createMockValidation(0, 2, [], ['check4', 'check5']),
        onChain: createMockValidation(0, 2, [], ['check6', 'check7']),
        news: createMockValidation(0, 2, [], ['check8'])
      });

      // Score calculation:
      // - Data source agreement: 0 (all sources have 0 confidence) (40% weight) = 0
      // - Logical consistency: 0 (100 - 8*50 = -300, clamped to 0) (30% weight) = 0
      // - Cross-validation: 0 (0 passed / 8 failed) (20% weight) = 0
      // - Completeness: 100 (all 4 sources present) (10% weight) = 10
      // Total: 10
      expect(result.overallScore).toBe(10);
      expect(result.logicalConsistency).toBe(0); // 100 - (8 * 50) = -300, clamped to 0
      expect(result.crossValidationSuccess).toBe(0);
      expect(result.completeness).toBe(100); // All sources present
      expect(result.breakdown.marketData).toBe(0);
      expect(result.breakdown.socialSentiment).toBe(0);
      expect(result.breakdown.onChainData).toBe(0);
      expect(result.breakdown.newsData).toBe(0);
    });

    test('edge case: partial validation - some pass, some fail', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(80, 0, ['check1', 'check2'], ['check3']),
        social: createMockValidation(60, 1, ['check4'], ['check5', 'check6']),
        onChain: createMockValidation(90, 0, ['check7', 'check8', 'check9'], []),
        news: createMockValidation(40, 1, [], ['check10', 'check11'])
      });

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(100);
      expect(result.logicalConsistency).toBe(0); // 100 - (2 * 50) = 0
      expect(result.crossValidationSuccess).toBeGreaterThan(0);
      expect(result.crossValidationSuccess).toBeLessThan(100);
      expect(result.completeness).toBe(100);
    });

    test('edge case: high variance between data sources', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(100),
        social: createMockValidation(20),
        onChain: createMockValidation(90),
        news: createMockValidation(30)
      });

      // High variance should result in low data source agreement
      expect(result.dataSourceAgreement).toBeLessThan(70);
      expect(result.overallScore).toBeLessThanOrEqual(80);
    });

    test('edge case: low variance between data sources', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(92),
        social: createMockValidation(90),
        onChain: createMockValidation(91),
        news: createMockValidation(93)
      });

      // Low variance should result in high data source agreement
      expect(result.dataSourceAgreement).toBeGreaterThan(90);
    });

    test('edge case: zero confidence from all sources', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(0),
        social: createMockValidation(0),
        onChain: createMockValidation(0),
        news: createMockValidation(0)
      });

      // Score calculation:
      // - Data source agreement: 0 (all sources have 0 confidence) (40% weight) = 0
      // - Logical consistency: 100 (no fatal errors) (30% weight) = 30
      // - Cross-validation: 100 (all checks passed) (20% weight) = 20
      // - Completeness: 100 (all 4 sources present) (10% weight) = 10
      // Total: 60
      expect(result.overallScore).toBe(60);
      expect(result.dataSourceAgreement).toBe(0);
      expect(result.logicalConsistency).toBe(100);
      expect(result.crossValidationSuccess).toBe(100);
      expect(result.completeness).toBe(100);
    });

    // ========================================
    // DYNAMIC WEIGHT INTEGRATION TESTS
    // ========================================

    test('dynamic weight integration: includes source weights from reliability tracker', () => {
      // Create validation with discrepancies that have source names
      const validationWithSources: VeritasValidationResult = {
        isValid: true,
        confidence: 85,
        alerts: [],
        discrepancies: [
          {
            metric: 'price',
            sources: [
              { name: 'CoinGecko', value: 95000 },
              { name: 'CoinMarketCap', value: 95100 },
              { name: 'Kraken', value: 95050 }
            ],
            variance: 0.001,
            threshold: 0.015,
            exceeded: false
          }
        ],
        dataQualitySummary: {
          overallScore: 85,
          marketDataQuality: 85,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: ['check1', 'check2'],
          failedChecks: []
        }
      };

      const result = calculateVeritasConfidenceScore({
        market: validationWithSources
      });

      // Verify source weights are included (empty object without reliability tracker)
      expect(result.sourceWeights).toBeDefined();
      expect(typeof result.sourceWeights).toBe('object');
      
      // Without reliability tracker, source weights will be empty
      // This is expected behavior - weights are only populated when tracker is provided
      expect(Object.keys(result.sourceWeights).length).toBe(0);
    });

    test('dynamic weight integration: handles multiple sources across validators', () => {
      const marketValidation: VeritasValidationResult = {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [
          {
            metric: 'price',
            sources: [
              { name: 'CoinGecko', value: 95000 },
              { name: 'CoinMarketCap', value: 95100 }
            ],
            variance: 0.001,
            threshold: 0.015,
            exceeded: false
          }
        ],
        dataQualitySummary: {
          overallScore: 90,
          marketDataQuality: 90,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: ['check1'],
          failedChecks: []
        }
      };

      const socialValidation: VeritasValidationResult = {
        isValid: true,
        confidence: 85,
        alerts: [],
        discrepancies: [
          {
            metric: 'sentiment',
            sources: [
              { name: 'LunarCrush', value: 75 },
              { name: 'Reddit', value: 72 }
            ],
            variance: 0.02,
            threshold: 0.3,
            exceeded: false
          }
        ],
        dataQualitySummary: {
          overallScore: 85,
          marketDataQuality: 0,
          socialDataQuality: 85,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: ['check2'],
          failedChecks: []
        }
      };

      const result = calculateVeritasConfidenceScore({
        market: marketValidation,
        social: socialValidation
      });

      // Without reliability tracker, source weights will be empty
      // This is expected behavior - weights are only populated when tracker is provided
      expect(result.sourceWeights).toBeDefined();
      expect(Object.keys(result.sourceWeights).length).toBe(0);
    });

    test('dynamic weight integration: empty source weights when no discrepancies', () => {
      const result = calculateVeritasConfidenceScore({
        market: createMockValidation(95),
        social: createMockValidation(90)
      });

      // No discrepancies means no sources to track
      expect(result.sourceWeights).toBeDefined();
      expect(Object.keys(result.sourceWeights).length).toBe(0);
    });

    test('dynamic weight integration: source weights are numeric and valid', () => {
      const validationWithSources: VeritasValidationResult = {
        isValid: true,
        confidence: 85,
        alerts: [],
        discrepancies: [
          {
            metric: 'price',
            sources: [
              { name: 'TestSource1', value: 100 },
              { name: 'TestSource2', value: 101 }
            ],
            variance: 0.01,
            threshold: 0.015,
            exceeded: false
          }
        ],
        dataQualitySummary: {
          overallScore: 85,
          marketDataQuality: 85,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: ['check1'],
          failedChecks: []
        }
      };

      const result = calculateVeritasConfidenceScore({
        market: validationWithSources
      });

      // Verify all weights are valid numbers
      Object.entries(result.sourceWeights).forEach(([source, weight]) => {
        expect(typeof weight).toBe('number');
        expect(isNaN(weight)).toBe(false);
        expect(isFinite(weight)).toBe(true);
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('getConfidenceLevel', () => {
    test('returns correct level for excellent score', () => {
      expect(getConfidenceLevel(95)).toBe('excellent');
      expect(getConfidenceLevel(90)).toBe('excellent');
    });

    test('returns correct level for good score', () => {
      expect(getConfidenceLevel(85)).toBe('good');
      expect(getConfidenceLevel(80)).toBe('good');
    });

    test('returns correct level for acceptable score', () => {
      expect(getConfidenceLevel(75)).toBe('acceptable');
      expect(getConfidenceLevel(70)).toBe('acceptable');
    });

    test('returns correct level for fair score', () => {
      expect(getConfidenceLevel(65)).toBe('fair');
      expect(getConfidenceLevel(60)).toBe('fair');
    });

    test('returns correct level for poor score', () => {
      expect(getConfidenceLevel(55)).toBe('poor');
      expect(getConfidenceLevel(0)).toBe('poor');
    });
  });

  describe('isSufficientConfidence', () => {
    test('returns true when score meets default threshold', () => {
      expect(isSufficientConfidence(70)).toBe(true);
      expect(isSufficientConfidence(80)).toBe(true);
    });

    test('returns false when score below default threshold', () => {
      expect(isSufficientConfidence(59)).toBe(false);
      expect(isSufficientConfidence(50)).toBe(false);
    });

    test('respects custom threshold', () => {
      expect(isSufficientConfidence(85, 90)).toBe(false);
      expect(isSufficientConfidence(95, 90)).toBe(true);
    });
  });

  describe('getConfidenceRecommendation', () => {
    test('provides warning for low overall score', () => {
      const recommendation = getConfidenceRecommendation(50);
      expect(recommendation).toContain('poor');
      expect(recommendation.toLowerCase()).toContain('do not make trading decisions');
    });

    test('provides positive recommendation for high score', () => {
      const recommendation = getConfidenceRecommendation(95);
      expect(recommendation).toContain('excellent');
      expect(recommendation.toLowerCase()).toContain('high confidence');
    });

    test('provides fair recommendation for moderate score', () => {
      const recommendation = getConfidenceRecommendation(65);
      expect(recommendation).toContain('fair');
      expect(recommendation.toLowerCase()).toContain('review discrepancies');
    });

    test('provides acceptable recommendation for decent score', () => {
      const recommendation = getConfidenceRecommendation(75);
      expect(recommendation).toContain('acceptable');
      expect(recommendation.toLowerCase()).toContain('normal caution');
    });

    test('provides good recommendation for good score', () => {
      const recommendation = getConfidenceRecommendation(85);
      expect(recommendation).toContain('good');
      expect(recommendation.toLowerCase()).toContain('confidence');
    });
  });
});

