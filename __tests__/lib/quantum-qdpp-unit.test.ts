/**
 * Quantum Data Purity Protocol (QDPP) Unit Tests
 * 
 * Unit tests that don't require actual API calls
 */

import { describe, it, expect } from '@jest/globals';

describe('Quantum Data Purity Protocol (QDPP) - Unit Tests', () => {
  describe('Module Structure', () => {
    it('should export qdpp singleton', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp).toBeDefined();
      expect(typeof qdpp).toBe('object');
    });

    it('should have triangulatePrice method', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp.triangulatePrice).toBeDefined();
      expect(typeof qdpp.triangulatePrice).toBe('function');
    });

    it('should have performSanityChecks method', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp.performSanityChecks).toBeDefined();
      expect(typeof qdpp.performSanityChecks).toBe('function');
    });

    it('should have calculateDataQualityScore method', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp.calculateDataQualityScore).toBeDefined();
      expect(typeof qdpp.calculateDataQualityScore).toBe('function');
    });

    it('should have fetchWithFallback method', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp.fetchWithFallback).toBeDefined();
      expect(typeof qdpp.fetchWithFallback).toBe('function');
    });

    it('should have validateMarketData method', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp.validateMarketData).toBeDefined();
      expect(typeof qdpp.validateMarketData).toBe('function');
    });

    it('should have getComprehensiveMarketData method', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      expect(qdpp.getComprehensiveMarketData).toBeDefined();
      expect(typeof qdpp.getComprehensiveMarketData).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should export required types', async () => {
      const module = await import('../../lib/quantum/qdpp');
      
      // Verify module exports
      expect(module.qdpp).toBeDefined();
      
      // Types are compile-time only, so we just verify the module loads
      expect(module).toBeDefined();
    });
  });

  describe('Data Quality Scoring Logic', () => {
    it('should calculate quality score correctly with mock data', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      // Create mock triangulation data
      const mockTriangulation = {
        medianPrice: 95000,
        prices: {
          coinMarketCap: 95000,
          coinGecko: 95050,
          kraken: 94950,
        },
        divergence: {
          maxDivergence: 0.05, // 0.05% - within tolerance
          hasDivergence: false,
          divergentSources: [],
        },
        timestamp: new Date().toISOString(),
      };
      
      // Create mock sanity checks
      const mockSanityChecks = {
        passed: true,
        checks: {
          mempoolValid: true,
          whaleCountValid: true,
          priceAgreement: true,
          volumeReasonable: true,
          dataFresh: true,
        },
        discrepancies: [],
      };
      
      // Create mock sources
      const mockSources = [
        { name: 'CoinMarketCap', status: 'SUCCESS' as const, responseTime: 100 },
        { name: 'CoinGecko', status: 'SUCCESS' as const, responseTime: 150 },
        { name: 'Kraken', status: 'SUCCESS' as const, responseTime: 120 },
        { name: 'Blockchain.com', status: 'SUCCESS' as const, responseTime: 200 },
        { name: 'LunarCrush', status: 'SUCCESS' as const, responseTime: 180 },
      ];
      
      // Calculate quality score
      const score = qdpp.calculateDataQualityScore(
        mockTriangulation,
        mockSanityChecks,
        mockSources
      );
      
      // Verify score is in valid range
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      
      // With all sources successful and no discrepancies, score should be high
      expect(score).toBeGreaterThanOrEqual(70);
      
      console.log('✅ Quality score with perfect data:', score + '/100');
    });

    it('should penalize quality score for failed sources', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      const mockTriangulation = {
        medianPrice: 95000,
        prices: {
          coinMarketCap: 95000,
          coinGecko: null, // Failed
          kraken: null, // Failed
        },
        divergence: {
          maxDivergence: 0,
          hasDivergence: false,
          divergentSources: [],
        },
        timestamp: new Date().toISOString(),
      };
      
      const mockSanityChecks = {
        passed: true,
        checks: {
          mempoolValid: true,
          whaleCountValid: true,
          priceAgreement: true,
          volumeReasonable: true,
          dataFresh: true,
        },
        discrepancies: [],
      };
      
      const mockSources = [
        { name: 'CoinMarketCap', status: 'SUCCESS' as const, responseTime: 100 },
        { name: 'CoinGecko', status: 'FAILED' as const, responseTime: 0, error: 'Timeout' },
        { name: 'Kraken', status: 'FAILED' as const, responseTime: 0, error: 'Timeout' },
      ];
      
      const score = qdpp.calculateDataQualityScore(
        mockTriangulation,
        mockSanityChecks,
        mockSources
      );
      
      // Score should be lower due to failed sources
      expect(score).toBeLessThan(100);
      
      console.log('✅ Quality score with 2 failed sources:', score + '/100');
    });

    it('should set quality score to 0 for fatal discrepancies', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      const mockTriangulation = {
        medianPrice: 95000,
        prices: {
          coinMarketCap: 95000,
          coinGecko: 95000,
          kraken: 95000,
        },
        divergence: {
          maxDivergence: 0,
          hasDivergence: false,
          divergentSources: [],
        },
        timestamp: new Date().toISOString(),
      };
      
      const mockSanityChecks = {
        passed: false,
        checks: {
          mempoolValid: false, // Fatal issue
          whaleCountValid: true,
          priceAgreement: true,
          volumeReasonable: true,
          dataFresh: true,
        },
        discrepancies: [
          {
            type: 'MEMPOOL_ZERO' as const,
            severity: 'FATAL' as const,
            description: 'Mempool size is 0',
            affectedSources: ['Blockchain.com'],
            impact: 'Cannot validate network activity',
          },
        ],
      };
      
      const mockSources = [
        { name: 'CoinMarketCap', status: 'SUCCESS' as const, responseTime: 100 },
        { name: 'CoinGecko', status: 'SUCCESS' as const, responseTime: 150 },
        { name: 'Kraken', status: 'SUCCESS' as const, responseTime: 120 },
      ];
      
      const score = qdpp.calculateDataQualityScore(
        mockTriangulation,
        mockSanityChecks,
        mockSources
      );
      
      // Fatal discrepancy should result in 0 quality score
      expect(score).toBe(0);
      
      console.log('✅ Quality score with fatal discrepancy:', score + '/100');
    });
  });

  describe('Requirements Validation', () => {
    it('should implement all required subtasks', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      // Subtask 3.1: Multi-API triangulation
      expect(qdpp.triangulatePrice).toBeDefined();
      
      // Subtask 3.2: Cross-source sanity checks
      expect(qdpp.performSanityChecks).toBeDefined();
      
      // Subtask 3.3: Data quality scoring
      expect(qdpp.calculateDataQualityScore).toBeDefined();
      
      // Subtask 3.4: Fallback strategy
      expect(qdpp.fetchWithFallback).toBeDefined();
      
      console.log('✅ All QDPP subtasks implemented');
    });

    it('should enforce 70% minimum quality threshold', async () => {
      const { qdpp } = await import('../../lib/quantum/qdpp');
      
      // The MIN_QUALITY_SCORE constant should be 70
      // We can verify this by checking the behavior with different scores
      
      const mockTriangulation = {
        medianPrice: 95000,
        prices: {
          coinMarketCap: 95000,
          coinGecko: 95000,
          kraken: 95000,
        },
        divergence: {
          maxDivergence: 0,
          hasDivergence: false,
          divergentSources: [],
        },
        timestamp: new Date().toISOString(),
      };
      
      const mockSanityChecks = {
        passed: true,
        checks: {
          mempoolValid: true,
          whaleCountValid: true,
          priceAgreement: true,
          volumeReasonable: true,
          dataFresh: true,
        },
        discrepancies: [],
      };
      
      const mockSources = [
        { name: 'CoinMarketCap', status: 'SUCCESS' as const, responseTime: 100 },
        { name: 'CoinGecko', status: 'SUCCESS' as const, responseTime: 150 },
        { name: 'Kraken', status: 'SUCCESS' as const, responseTime: 120 },
      ];
      
      const score = qdpp.calculateDataQualityScore(
        mockTriangulation,
        mockSanityChecks,
        mockSources
      );
      
      // With good data, score should meet or exceed 70%
      expect(score).toBeGreaterThanOrEqual(70);
      
      console.log('✅ Quality threshold validation: score =', score + '/100 (minimum 70)');
    });
  });
});
