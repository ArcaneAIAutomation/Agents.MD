/**
 * Unit Tests: Risk Scoring
 * 
 * Tests for risk assessment and scoring algorithms
 */

import {
  calculateRiskScore,
  categorizeRisk,
  aggregateRiskFactors
} from '../../../lib/ucie/riskScoring';

describe('Risk Scoring', () => {
  describe('calculateRiskScore', () => {
    test('returns score between 0 and 100', () => {
      const factors = {
        volatility: 0.5,
        liquidity: 0.3,
        concentration: 0.4,
        regulatory: 0.2
      };
      
      const score = calculateRiskScore(factors);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('higher risk factors produce higher scores', () => {
      const lowRisk = {
        volatility: 0.1,
        liquidity: 0.1,
        concentration: 0.1,
        regulatory: 0.1
      };
      
      const highRisk = {
        volatility: 0.9,
        liquidity: 0.9,
        concentration: 0.9,
        regulatory: 0.9
      };
      
      const lowScore = calculateRiskScore(lowRisk);
      const highScore = calculateRiskScore(highRisk);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });

    test('handles zero risk factors', () => {
      const noRisk = {
        volatility: 0,
        liquidity: 0,
        concentration: 0,
        regulatory: 0
      };
      
      const score = calculateRiskScore(noRisk);
      
      expect(score).toBe(0);
    });

    test('handles maximum risk factors', () => {
      const maxRisk = {
        volatility: 1,
        liquidity: 1,
        concentration: 1,
        regulatory: 1
      };
      
      const score = calculateRiskScore(maxRisk);
      
      expect(score).toBe(100);
    });
  });

  describe('categorizeRisk', () => {
    test('categorizes low risk correctly', () => {
      expect(categorizeRisk(10)).toBe('Low');
      expect(categorizeRisk(20)).toBe('Low');
      expect(categorizeRisk(24)).toBe('Low');
    });

    test('categorizes medium risk correctly', () => {
      expect(categorizeRisk(25)).toBe('Medium');
      expect(categorizeRisk(50)).toBe('Medium');
      expect(categorizeRisk(59)).toBe('Medium');
    });

    test('categorizes high risk correctly', () => {
      expect(categorizeRisk(60)).toBe('High');
      expect(categorizeRisk(75)).toBe('High');
      expect(categorizeRisk(79)).toBe('High');
    });

    test('categorizes critical risk correctly', () => {
      expect(categorizeRisk(80)).toBe('Critical');
      expect(categorizeRisk(90)).toBe('Critical');
      expect(categorizeRisk(100)).toBe('Critical');
    });

    test('handles boundary values', () => {
      expect(categorizeRisk(0)).toBe('Low');
      expect(categorizeRisk(24.9)).toBe('Low');
      expect(categorizeRisk(25)).toBe('Medium');
      expect(categorizeRisk(59.9)).toBe('Medium');
      expect(categorizeRisk(60)).toBe('High');
      expect(categorizeRisk(79.9)).toBe('High');
      expect(categorizeRisk(80)).toBe('Critical');
    });
  });

  describe('aggregateRiskFactors', () => {
    test('weights factors correctly', () => {
      const factors = {
        volatility: 0.8,
        liquidity: 0.2,
        concentration: 0.5,
        regulatory: 0.3
      };
      
      const weights = {
        volatility: 0.4,
        liquidity: 0.3,
        concentration: 0.2,
        regulatory: 0.1
      };
      
      const aggregated = aggregateRiskFactors(factors, weights);
      
      // Weighted average: 0.8*0.4 + 0.2*0.3 + 0.5*0.2 + 0.3*0.1 = 0.51
      expect(aggregated).toBeCloseTo(0.51, 2);
    });

    test('handles equal weights', () => {
      const factors = {
        volatility: 0.4,
        liquidity: 0.6,
        concentration: 0.8,
        regulatory: 0.2
      };
      
      const equalWeights = {
        volatility: 0.25,
        liquidity: 0.25,
        concentration: 0.25,
        regulatory: 0.25
      };
      
      const aggregated = aggregateRiskFactors(factors, equalWeights);
      
      // Simple average: (0.4 + 0.6 + 0.8 + 0.2) / 4 = 0.5
      expect(aggregated).toBeCloseTo(0.5, 2);
    });

    test('returns 0 for zero factors', () => {
      const factors = {
        volatility: 0,
        liquidity: 0,
        concentration: 0,
        regulatory: 0
      };
      
      const weights = {
        volatility: 0.25,
        liquidity: 0.25,
        concentration: 0.25,
        regulatory: 0.25
      };
      
      const aggregated = aggregateRiskFactors(factors, weights);
      
      expect(aggregated).toBe(0);
    });

    test('returns 1 for maximum factors', () => {
      const factors = {
        volatility: 1,
        liquidity: 1,
        concentration: 1,
        regulatory: 1
      };
      
      const weights = {
        volatility: 0.25,
        liquidity: 0.25,
        concentration: 0.25,
        regulatory: 0.25
      };
      
      const aggregated = aggregateRiskFactors(factors, weights);
      
      expect(aggregated).toBe(1);
    });
  });
});
