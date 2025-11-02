/**
 * Unit Tests: Consensus Algorithm
 * 
 * Tests for multi-dimensional signal aggregation and consensus generation
 */

import {
  calculateConsensusScore,
  aggregateSignals,
  identifyConflicts,
  generateRecommendation
} from '../../../lib/ucie/consensus';

describe('Consensus Algorithm', () => {
  describe('calculateConsensusScore', () => {
    test('calculates weighted average of signals', () => {
      const signals = {
        technical: 75,
        fundamental: 60,
        sentiment: 80,
        onChain: 70
      };
      
      const score = calculateConsensusScore(signals);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeCloseTo(71.25, 1); // Average of signals
    });

    test('handles all bullish signals', () => {
      const signals = {
        technical: 90,
        fundamental: 85,
        sentiment: 95,
        onChain: 88
      };
      
      const score = calculateConsensusScore(signals);
      
      expect(score).toBeGreaterThan(80);
    });

    test('handles all bearish signals', () => {
      const signals = {
        technical: 20,
        fundamental: 15,
        sentiment: 10,
        onChain: 25
      };
      
      const score = calculateConsensusScore(signals);
      
      expect(score).toBeLessThan(30);
    });

    test('handles mixed signals', () => {
      const signals = {
        technical: 80,
        fundamental: 30,
        sentiment: 70,
        onChain: 40
      };
      
      const score = calculateConsensusScore(signals);
      
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(70);
    });
  });

  describe('aggregateSignals', () => {
    test('aggregates signals with custom weights', () => {
      const signals = {
        technical: 80,
        fundamental: 60,
        sentiment: 70,
        onChain: 50
      };
      
      const weights = {
        technical: 0.4,
        fundamental: 0.3,
        sentiment: 0.2,
        onChain: 0.1
      };
      
      const aggregated = aggregateSignals(signals, weights);
      
      // 80*0.4 + 60*0.3 + 70*0.2 + 50*0.1 = 69
      expect(aggregated).toBeCloseTo(69, 1);
    });

    test('handles equal weights', () => {
      const signals = {
        technical: 80,
        fundamental: 60,
        sentiment: 70,
        onChain: 50
      };
      
      const equalWeights = {
        technical: 0.25,
        fundamental: 0.25,
        sentiment: 0.25,
        onChain: 0.25
      };
      
      const aggregated = aggregateSignals(signals, equalWeights);
      
      // Simple average: (80 + 60 + 70 + 50) / 4 = 65
      expect(aggregated).toBeCloseTo(65, 1);
    });

    test('weights sum to 1', () => {
      const signals = {
        technical: 80,
        fundamental: 60,
        sentiment: 70,
        onChain: 50
      };
      
      const weights = {
        technical: 0.5,
        fundamental: 0.3,
        sentiment: 0.15,
        onChain: 0.05
      };
      
      const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(weightSum).toBeCloseTo(1, 5);
      
      const aggregated = aggregateSignals(signals, weights);
      expect(aggregated).toBeGreaterThanOrEqual(0);
      expect(aggregated).toBeLessThanOrEqual(100);
    });
  });

  describe('identifyConflicts', () => {
    test('identifies no conflicts when signals agree', () => {
      const signals = {
        technical: 80,
        fundamental: 85,
        sentiment: 82,
        onChain: 78
      };
      
      const conflicts = identifyConflicts(signals);
      
      expect(conflicts).toHaveLength(0);
    });

    test('identifies conflicts when signals diverge significantly', () => {
      const signals = {
        technical: 90, // Very bullish
        fundamental: 20, // Very bearish
        sentiment: 85,
        onChain: 25
      };
      
      const conflicts = identifyConflicts(signals);
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts).toContain('technical-fundamental');
    });

    test('identifies multiple conflicts', () => {
      const signals = {
        technical: 90,
        fundamental: 10,
        sentiment: 85,
        onChain: 15
      };
      
      const conflicts = identifyConflicts(signals);
      
      expect(conflicts.length).toBeGreaterThanOrEqual(2);
    });

    test('uses threshold for conflict detection', () => {
      const signals = {
        technical: 70,
        fundamental: 40, // 30 point difference
        sentiment: 65,
        onChain: 45
      };
      
      const conflictsStrict = identifyConflicts(signals, 25); // Strict threshold
      const conflictsLoose = identifyConflicts(signals, 35); // Loose threshold
      
      expect(conflictsStrict.length).toBeGreaterThan(conflictsLoose.length);
    });
  });

  describe('generateRecommendation', () => {
    test('generates Strong Buy for high consensus', () => {
      const score = 85;
      const confidence = 0.9;
      
      const recommendation = generateRecommendation(score, confidence);
      
      expect(recommendation).toBe('Strong Buy');
    });

    test('generates Buy for moderately high consensus', () => {
      const score = 70;
      const confidence = 0.8;
      
      const recommendation = generateRecommendation(score, confidence);
      
      expect(recommendation).toBe('Buy');
    });

    test('generates Hold for neutral consensus', () => {
      const score = 50;
      const confidence = 0.7;
      
      const recommendation = generateRecommendation(score, confidence);
      
      expect(recommendation).toBe('Hold');
    });

    test('generates Sell for moderately low consensus', () => {
      const score = 30;
      const confidence = 0.8;
      
      const recommendation = generateRecommendation(score, confidence);
      
      expect(recommendation).toBe('Sell');
    });

    test('generates Strong Sell for low consensus', () => {
      const score = 15;
      const confidence = 0.9;
      
      const recommendation = generateRecommendation(score, confidence);
      
      expect(recommendation).toBe('Strong Sell');
    });

    test('downgrades recommendation with low confidence', () => {
      const score = 85;
      const lowConfidence = 0.5;
      const highConfidence = 0.9;
      
      const recLowConf = generateRecommendation(score, lowConfidence);
      const recHighConf = generateRecommendation(score, highConfidence);
      
      // Low confidence should produce more conservative recommendation
      expect(recLowConf).not.toBe(recHighConf);
    });

    test('handles boundary values', () => {
      expect(generateRecommendation(0, 1)).toBe('Strong Sell');
      expect(generateRecommendation(100, 1)).toBe('Strong Buy');
      expect(generateRecommendation(50, 0.5)).toBe('Hold');
    });
  });
});
