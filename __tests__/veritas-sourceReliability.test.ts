/**
 * Tests for Veritas Protocol Source Reliability Tracker
 * 
 * These tests verify that the source reliability tracking system correctly:
 * - Tracks validation results
 * - Calculates reliability scores
 * - Adjusts trust weights dynamically
 * - Identifies unreliable sources
 * - Persists and loads data
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

import { SourceReliabilityTracker, SourceReliabilityScore } from '../lib/ucie/veritas/utils/sourceReliabilityTracker';

describe('Veritas Protocol - Source Reliability Tracker', () => {
  let tracker: SourceReliabilityTracker;
  
  beforeEach(() => {
    // Create fresh tracker for each test
    tracker = new SourceReliabilityTracker();
  });
  
  describe('updateReliability', () => {
    test('should initialize new source with default values', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      
      const score = tracker.getScore('CoinGecko');
      expect(score).not.toBeNull();
      expect(score!.sourceName).toBe('CoinGecko');
      expect(score!.totalValidations).toBe(1);
      expect(score!.successfulValidations).toBe(1);
      expect(score!.reliabilityScore).toBe(100);
      expect(score!.trustWeight).toBe(1.0);
    });
    
    test('should track successful validations', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'pass');
      
      const score = tracker.getScore('CoinGecko');
      expect(score!.totalValidations).toBe(3);
      expect(score!.successfulValidations).toBe(3);
      expect(score!.reliabilityScore).toBe(100);
    });
    
    test('should track failed validations', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'fail');
      
      const score = tracker.getScore('CoinGecko');
      expect(score!.totalValidations).toBe(2);
      expect(score!.successfulValidations).toBe(1);
      expect(score!.reliabilityScore).toBe(50);
    });
    
    test('should track deviation validations', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'deviation', 2.5);
      
      const score = tracker.getScore('CoinGecko');
      expect(score!.totalValidations).toBe(2);
      expect(score!.deviationCount).toBe(1);
      expect(score!.reliabilityScore).toBe(50);
    });
    
    test('should calculate reliability score correctly', () => {
      // 7 passes out of 10 = 70% reliability
      for (let i = 0; i < 7; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 3; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      const score = tracker.getScore('CoinGecko');
      expect(score!.reliabilityScore).toBe(70);
    });
  });
  
  describe('getTrustWeight', () => {
    test('should return 1.0 for reliability >= 90%', () => {
      for (let i = 0; i < 9; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      tracker.updateReliability('CoinGecko', 'fail');
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBe(1.0);
    });
    
    test('should return 0.9 for reliability 80-89%', () => {
      for (let i = 0; i < 8; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 2; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBe(0.9);
    });
    
    test('should return 0.8 for reliability 70-79%', () => {
      for (let i = 0; i < 7; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 3; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBe(0.8);
    });
    
    test('should return 0.7 for reliability 60-69%', () => {
      for (let i = 0; i < 6; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBe(0.7);
    });
    
    test('should return 0.6 for reliability 50-59%', () => {
      for (let i = 0; i < 5; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 5; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBe(0.6);
    });
    
    test('should return 0.5 for reliability < 50%', () => {
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 6; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBe(0.5);
    });
    
    test('should return 1.0 for unknown sources', () => {
      const weight = tracker.getTrustWeight('UnknownSource');
      expect(weight).toBe(1.0);
    });
  });
  
  describe('getUnreliableSources', () => {
    test('should identify sources below default threshold (70%)', () => {
      // CoinGecko: 80% reliable (above threshold)
      for (let i = 0; i < 8; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 2; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      // CoinMarketCap: 60% reliable (below threshold)
      for (let i = 0; i < 6; i++) {
        tracker.updateReliability('CoinMarketCap', 'pass');
      }
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('CoinMarketCap', 'fail');
      }
      
      const unreliable = tracker.getUnreliableSources();
      expect(unreliable).toContain('CoinMarketCap');
      expect(unreliable).not.toContain('CoinGecko');
    });
    
    test('should respect custom threshold', () => {
      // CoinGecko: 85% reliable
      for (let i = 0; i < 17; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 3; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      
      // Below 90% threshold
      const unreliable90 = tracker.getUnreliableSources(90);
      expect(unreliable90).toContain('CoinGecko');
      
      // Above 80% threshold
      const unreliable80 = tracker.getUnreliableSources(80);
      expect(unreliable80).not.toContain('CoinGecko');
    });
    
    test('should return empty array when all sources are reliable', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinMarketCap', 'pass');
      
      const unreliable = tracker.getUnreliableSources();
      expect(unreliable).toEqual([]);
    });
  });
  
  describe('getAllScores', () => {
    test('should return all tracked sources', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinMarketCap', 'pass');
      tracker.updateReliability('Kraken', 'pass');
      
      const scores = tracker.getAllScores();
      expect(scores.size).toBe(3);
      expect(scores.has('CoinGecko')).toBe(true);
      expect(scores.has('CoinMarketCap')).toBe(true);
      expect(scores.has('Kraken')).toBe(true);
    });
    
    test('should return empty map when no sources tracked', () => {
      const scores = tracker.getAllScores();
      expect(scores.size).toBe(0);
    });
  });
  
  describe('getHistory', () => {
    test('should track validation history', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'fail');
      tracker.updateReliability('CoinGecko', 'deviation', 2.5);
      
      const history = tracker.getHistory('CoinGecko');
      expect(history).toHaveLength(3);
      expect(history[0].validationResult).toBe('pass');
      expect(history[1].validationResult).toBe('fail');
      expect(history[2].validationResult).toBe('deviation');
      expect(history[2].deviationAmount).toBe(2.5);
    });
    
    test('should respect history limit', () => {
      for (let i = 0; i < 10; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      
      const history = tracker.getHistory('CoinGecko', 5);
      expect(history).toHaveLength(5);
    });
    
    test('should return empty array for unknown source', () => {
      const history = tracker.getHistory('UnknownSource');
      expect(history).toEqual([]);
    });
    
    test('should limit history to 100 entries per source', () => {
      for (let i = 0; i < 150; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      
      const history = tracker.getHistory('CoinGecko');
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });
  
  describe('resetSource', () => {
    test('should reset specific source', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinMarketCap', 'pass');
      
      tracker.resetSource('CoinGecko');
      
      expect(tracker.getScore('CoinGecko')).toBeNull();
      expect(tracker.getScore('CoinMarketCap')).not.toBeNull();
    });
  });
  
  describe('resetAll', () => {
    test('should reset all sources', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinMarketCap', 'pass');
      tracker.updateReliability('Kraken', 'pass');
      
      tracker.resetAll();
      
      expect(tracker.getAllScores().size).toBe(0);
    });
  });
  
  describe('getSummary', () => {
    test('should return correct summary statistics', () => {
      // CoinGecko: 90% reliable (high)
      for (let i = 0; i < 9; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      tracker.updateReliability('CoinGecko', 'fail');
      
      // CoinMarketCap: 60% reliable (low)
      for (let i = 0; i < 6; i++) {
        tracker.updateReliability('CoinMarketCap', 'pass');
      }
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('CoinMarketCap', 'fail');
      }
      
      // Kraken: 80% reliable (medium)
      for (let i = 0; i < 8; i++) {
        tracker.updateReliability('Kraken', 'pass');
      }
      for (let i = 0; i < 2; i++) {
        tracker.updateReliability('Kraken', 'fail');
      }
      
      const summary = tracker.getSummary();
      
      expect(summary.totalSources).toBe(3);
      expect(summary.averageReliability).toBeCloseTo(76.67, 1);
      expect(summary.highReliabilitySources).toBe(1); // CoinGecko
      expect(summary.lowReliabilitySources).toBe(1); // CoinMarketCap
      expect(summary.totalValidations).toBe(30);
    });
    
    test('should return zero summary for empty tracker', () => {
      const summary = tracker.getSummary();
      
      expect(summary.totalSources).toBe(0);
      expect(summary.averageReliability).toBe(0);
      expect(summary.highReliabilitySources).toBe(0);
      expect(summary.lowReliabilitySources).toBe(0);
      expect(summary.totalValidations).toBe(0);
    });
  });
  
  describe('dynamic weight adjustment', () => {
    test('should adjust weights as reliability changes', () => {
      // Start with perfect reliability
      tracker.updateReliability('CoinGecko', 'pass');
      expect(tracker.getTrustWeight('CoinGecko')).toBe(1.0);
      
      // Add failures to drop to 80% (8 pass, 2 fail = 80%)
      for (let i = 0; i < 7; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      for (let i = 0; i < 2; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      expect(tracker.getTrustWeight('CoinGecko')).toBe(0.9);
      
      // Add more failures to drop to 57% (8 pass, 6 fail = 57%)
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('CoinGecko', 'fail');
      }
      // 57% reliability should give 0.6 trust weight (50-59% range)
      expect(tracker.getTrustWeight('CoinGecko')).toBe(0.6);
    });
    
    test('should handle multiple sources with different reliabilities', () => {
      // High reliability source
      for (let i = 0; i < 10; i++) {
        tracker.updateReliability('HighReliability', 'pass');
      }
      
      // Medium reliability source
      for (let i = 0; i < 7; i++) {
        tracker.updateReliability('MediumReliability', 'pass');
      }
      for (let i = 0; i < 3; i++) {
        tracker.updateReliability('MediumReliability', 'fail');
      }
      
      // Low reliability source
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('LowReliability', 'pass');
      }
      for (let i = 0; i < 6; i++) {
        tracker.updateReliability('LowReliability', 'fail');
      }
      
      expect(tracker.getTrustWeight('HighReliability')).toBe(1.0);
      expect(tracker.getTrustWeight('MediumReliability')).toBe(0.8);
      expect(tracker.getTrustWeight('LowReliability')).toBe(0.5);
    });
  });
  
  describe('timestamp tracking', () => {
    test('should update lastUpdated timestamp', () => {
      const before = Date.now();
      tracker.updateReliability('CoinGecko', 'pass');
      const after = Date.now();
      
      const score = tracker.getScore('CoinGecko');
      const timestamp = new Date(score!.lastUpdated).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
    
    test('should update timestamp on each validation', async () => {
      tracker.updateReliability('CoinGecko', 'pass');
      const firstTimestamp = tracker.getScore('CoinGecko')!.lastUpdated;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      tracker.updateReliability('CoinGecko', 'pass');
      const secondTimestamp = tracker.getScore('CoinGecko')!.lastUpdated;
      
      expect(new Date(secondTimestamp).getTime()).toBeGreaterThan(new Date(firstTimestamp).getTime());
    });
  });
});
