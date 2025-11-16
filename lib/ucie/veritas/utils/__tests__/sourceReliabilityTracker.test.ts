/**
 * Tests for Source Reliability Tracker
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

import { SourceReliabilityTracker } from '../sourceReliabilityTracker';

describe('SourceReliabilityTracker', () => {
  let tracker: SourceReliabilityTracker;
  
  beforeEach(() => {
    tracker = new SourceReliabilityTracker();
  });
  
  describe('updateReliability', () => {
    test('should initialize source with default values', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      
      const score = tracker.getScore('CoinGecko');
      expect(score).not.toBeNull();
      expect(score?.sourceName).toBe('CoinGecko');
      expect(score?.totalValidations).toBe(1);
      expect(score?.successfulValidations).toBe(1);
      expect(score?.reliabilityScore).toBe(100);
      expect(score?.trustWeight).toBe(1.0);
    });
    
    test('should track successful validations', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'pass');
      
      const score = tracker.getScore('CoinGecko');
      expect(score?.totalValidations).toBe(3);
      expect(score?.successfulValidations).toBe(3);
      expect(score?.reliabilityScore).toBe(100);
      expect(score?.trustWeight).toBe(1.0);
    });
    
    test('should track failed validations', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'fail');
      
      const score = tracker.getScore('CoinGecko');
      expect(score?.totalValidations).toBe(2);
      expect(score?.successfulValidations).toBe(1);
      expect(score?.reliabilityScore).toBe(50);
      expect(score?.trustWeight).toBe(0.5);
    });
    
    test('should track deviations', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'deviation', 2.5);
      
      const score = tracker.getScore('CoinGecko');
      expect(score?.totalValidations).toBe(2);
      expect(score?.deviationCount).toBe(1);
      expect(score?.reliabilityScore).toBe(50);
    });
    
    test('should adjust trust weight based on reliability', () => {
      // 90%+ reliability = 1.0 weight
      for (let i = 0; i < 9; i++) {
        tracker.updateReliability('Source90', 'pass');
      }
      tracker.updateReliability('Source90', 'fail');
      expect(tracker.getTrustWeight('Source90')).toBe(1.0);
      
      // 80-89% reliability = 0.9 weight
      for (let i = 0; i < 8; i++) {
        tracker.updateReliability('Source80', 'pass');
      }
      tracker.updateReliability('Source80', 'fail');
      tracker.updateReliability('Source80', 'fail');
      expect(tracker.getTrustWeight('Source80')).toBe(0.9);
      
      // 70-79% reliability = 0.8 weight
      for (let i = 0; i < 7; i++) {
        tracker.updateReliability('Source70', 'pass');
      }
      for (let i = 0; i < 3; i++) {
        tracker.updateReliability('Source70', 'fail');
      }
      expect(tracker.getTrustWeight('Source70')).toBe(0.8);
      
      // <50% reliability = 0.5 weight
      for (let i = 0; i < 4; i++) {
        tracker.updateReliability('Source40', 'pass');
      }
      for (let i = 0; i < 6; i++) {
        tracker.updateReliability('Source40', 'fail');
      }
      expect(tracker.getTrustWeight('Source40')).toBe(0.5);
    });
  });
  
  describe('getTrustWeight', () => {
    test('should return 1.0 for unknown sources', () => {
      expect(tracker.getTrustWeight('UnknownSource')).toBe(1.0);
    });
    
    test('should return correct weight for known sources', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinGecko', 'fail');
      
      const weight = tracker.getTrustWeight('CoinGecko');
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    });
  });
  
  describe('getUnreliableSources', () => {
    test('should return empty array when all sources are reliable', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinMarketCap', 'pass');
      
      const unreliable = tracker.getUnreliableSources();
      expect(unreliable).toHaveLength(0);
    });
    
    test('should identify sources below threshold', () => {
      // Reliable source (100%)
      tracker.updateReliability('CoinGecko', 'pass');
      
      // Unreliable source (50%)
      tracker.updateReliability('BadSource', 'pass');
      tracker.updateReliability('BadSource', 'fail');
      
      const unreliable = tracker.getUnreliableSources(70);
      expect(unreliable).toContain('BadSource');
      expect(unreliable).not.toContain('CoinGecko');
    });
    
    test('should respect custom threshold', () => {
      // 80% reliable
      for (let i = 0; i < 8; i++) {
        tracker.updateReliability('Source80', 'pass');
      }
      tracker.updateReliability('Source80', 'fail');
      tracker.updateReliability('Source80', 'fail');
      
      // Should be unreliable with 90% threshold
      expect(tracker.getUnreliableSources(90)).toContain('Source80');
      
      // Should be reliable with 70% threshold
      expect(tracker.getUnreliableSources(70)).not.toContain('Source80');
    });
  });
  
  describe('getScore', () => {
    test('should return null for unknown sources', () => {
      expect(tracker.getScore('UnknownSource')).toBeNull();
    });
    
    test('should return score for known sources', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      
      const score = tracker.getScore('CoinGecko');
      expect(score).not.toBeNull();
      expect(score?.sourceName).toBe('CoinGecko');
    });
  });
  
  describe('getHistory', () => {
    test('should return empty array for unknown sources', () => {
      expect(tracker.getHistory('UnknownSource')).toHaveLength(0);
    });
    
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
    
    test('should limit history entries', () => {
      for (let i = 0; i < 150; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      
      const history = tracker.getHistory('CoinGecko');
      expect(history.length).toBeLessThanOrEqual(100);
    });
    
    test('should respect limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        tracker.updateReliability('CoinGecko', 'pass');
      }
      
      const history = tracker.getHistory('CoinGecko', 5);
      expect(history).toHaveLength(5);
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
      
      tracker.resetAll();
      
      expect(tracker.getScore('CoinGecko')).toBeNull();
      expect(tracker.getScore('CoinMarketCap')).toBeNull();
    });
  });
  
  describe('getSummary', () => {
    test('should return zero summary for empty tracker', () => {
      const summary = tracker.getSummary();
      
      expect(summary.totalSources).toBe(0);
      expect(summary.averageReliability).toBe(0);
      expect(summary.highReliabilitySources).toBe(0);
      expect(summary.lowReliabilitySources).toBe(0);
      expect(summary.totalValidations).toBe(0);
    });
    
    test('should calculate correct summary statistics', () => {
      // High reliability source (100%)
      tracker.updateReliability('HighSource', 'pass');
      tracker.updateReliability('HighSource', 'pass');
      
      // Medium reliability source (75%)
      tracker.updateReliability('MediumSource', 'pass');
      tracker.updateReliability('MediumSource', 'pass');
      tracker.updateReliability('MediumSource', 'pass');
      tracker.updateReliability('MediumSource', 'fail');
      
      // Low reliability source (50%)
      tracker.updateReliability('LowSource', 'pass');
      tracker.updateReliability('LowSource', 'fail');
      
      const summary = tracker.getSummary();
      
      expect(summary.totalSources).toBe(3);
      expect(summary.averageReliability).toBeCloseTo(75, 0);
      expect(summary.highReliabilitySources).toBe(1); // HighSource
      expect(summary.lowReliabilitySources).toBe(1); // LowSource
      expect(summary.totalValidations).toBe(8);
    });
  });
  
  describe('getAllScores', () => {
    test('should return all reliability scores', () => {
      tracker.updateReliability('CoinGecko', 'pass');
      tracker.updateReliability('CoinMarketCap', 'pass');
      tracker.updateReliability('Kraken', 'pass');
      
      const scores = tracker.getAllScores();
      
      expect(scores.size).toBe(3);
      expect(scores.has('CoinGecko')).toBe(true);
      expect(scores.has('CoinMarketCap')).toBe(true);
      expect(scores.has('Kraken')).toBe(true);
    });
  });
});
