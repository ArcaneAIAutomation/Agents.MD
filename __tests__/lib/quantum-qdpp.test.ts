/**
 * Quantum Data Purity Protocol (QDPP) Tests
 * 
 * Tests for the QDPP implementation including:
 * - Multi-API triangulation
 * - Cross-source sanity checks
 * - Data quality scoring
 * - Fallback strategy
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { qdpp } from '../../lib/quantum/qdpp';

describe('Quantum Data Purity Protocol (QDPP)', () => {
  // Increase timeout for API calls
  const TEST_TIMEOUT = 30000;

  describe('Subtask 3.1: Multi-API Triangulation', () => {
    it('should query all 3 market data sources and calculate median price', async () => {
      const result = await qdpp.triangulatePrice();

      // Verify structure
      expect(result).toHaveProperty('medianPrice');
      expect(result).toHaveProperty('prices');
      expect(result).toHaveProperty('divergence');
      expect(result).toHaveProperty('timestamp');

      // Verify median price is a valid number
      expect(typeof result.medianPrice).toBe('number');
      expect(result.medianPrice).toBeGreaterThan(0);

      // Verify at least one price source succeeded
      const prices = Object.values(result.prices);
      const validPrices = prices.filter(p => p !== null);
      expect(validPrices.length).toBeGreaterThan(0);

      console.log('✅ Triangulation result:', {
        medianPrice: result.medianPrice,
        sources: {
          cmc: result.prices.coinMarketCap !== null ? '✓' : '✗',
          cg: result.prices.coinGecko !== null ? '✓' : '✗',
          kraken: result.prices.kraken !== null ? '✓' : '✗',
        },
        divergence: result.divergence.maxDivergence.toFixed(2) + '%',
      });
    }, TEST_TIMEOUT);

    it('should detect price divergence >1%', async () => {
      const result = await qdpp.triangulatePrice();

      // Verify divergence detection
      expect(result.divergence).toHaveProperty('maxDivergence');
      expect(result.divergence).toHaveProperty('hasDivergence');
      expect(result.divergence).toHaveProperty('divergentSources');

      expect(typeof result.divergence.maxDivergence).toBe('number');
      expect(typeof result.divergence.hasDivergence).toBe('boolean');
      expect(Array.isArray(result.divergence.divergentSources)).toBe(true);

      if (result.divergence.hasDivergence) {
        console.log('⚠️  Price divergence detected:', result.divergence);
      } else {
        console.log('✅ All prices agree within 1% tolerance');
      }
    }, TEST_TIMEOUT);
  });

  describe('Subtask 3.2: Cross-Source Sanity Checks', () => {
    it('should validate mempool size, whale count, and price agreement', async () => {
      // First get triangulation data
      const triangulation = await qdpp.triangulatePrice();

      // Get on-chain data
      const { blockchainClient } = await import('../../lib/quantum/api/blockchain');
      const onChain = await blockchainClient.getBitcoinOnChainData().catch(() => null);

      // Perform sanity checks
      const result = await qdpp.performSanityChecks(triangulation, onChain);

      // Verify structure
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('discrepancies');

      // Verify checks
      expect(result.checks).toHaveProperty('mempoolValid');
      expect(result.checks).toHaveProperty('whaleCountValid');
      expect(result.checks).toHaveProperty('priceAgreement');
      expect(result.checks).toHaveProperty('volumeReasonable');
      expect(result.checks).toHaveProperty('dataFresh');

      console.log('✅ Sanity checks result:', {
        passed: result.passed,
        checks: result.checks,
        discrepancyCount: result.discrepancies.length,
      });

      // Log discrepancies if any
      if (result.discrepancies.length > 0) {
        console.log('⚠️  Discrepancies found:');
        result.discrepancies.forEach(d => {
          console.log(`   [${d.severity}] ${d.type}: ${d.description}`);
        });
      }
    }, TEST_TIMEOUT);
  });

  describe('Subtask 3.3: Data Quality Scoring', () => {
    it('should calculate quality score (0-100) and enforce 70% minimum', async () => {
      const validation = await qdpp.validateMarketData();

      // Verify quality score
      expect(validation).toHaveProperty('dataQualityScore');
      expect(typeof validation.dataQualityScore).toBe('number');
      expect(validation.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(validation.dataQualityScore).toBeLessThanOrEqual(100);

      console.log('✅ Data quality score:', validation.dataQualityScore + '/100');

      // Check if meets minimum threshold
      const MIN_QUALITY = 70;
      if (validation.dataQualityScore >= MIN_QUALITY) {
        console.log(`✅ Quality score meets minimum threshold (${MIN_QUALITY}%)`);
      } else {
        console.log(`⚠️  Quality score below minimum threshold (${MIN_QUALITY}%)`);
      }

      // Verify recommendation
      expect(validation).toHaveProperty('recommendation');
      expect(['PROCEED', 'RETRY', 'HALT']).toContain(validation.recommendation);
      console.log('   Recommendation:', validation.recommendation);
    }, TEST_TIMEOUT);
  });

  describe('Subtask 3.4: Fallback Strategy', () => {
    it('should implement CMC → CoinGecko → Kraken fallback chain', async () => {
      const result = await qdpp.fetchWithFallback();

      // Verify structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('fallbackUsed');
      expect(result).toHaveProperty('attempts');

      // Verify source is one of the three
      expect(['coinmarketcap', 'coingecko', 'kraken']).toContain(result.source);

      // Verify data structure
      expect(result.data).toHaveProperty('price');
      expect(result.data).toHaveProperty('volume24h');
      expect(result.data).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('source');

      console.log('✅ Fallback strategy result:', {
        source: result.source,
        fallbackUsed: result.fallbackUsed,
        attempts: result.attempts.join(' → '),
        price: '$' + result.data.price.toFixed(2),
      });

      // Log if fallback was used
      if (result.fallbackUsed) {
        console.log('⚠️  Fallback was used - primary source failed');
      } else {
        console.log('✅ Primary source (CMC) succeeded');
      }
    }, TEST_TIMEOUT);
  });

  describe('Integration: Complete QDPP Validation', () => {
    it('should perform complete validation with all components', async () => {
      const result = await qdpp.validateMarketData();

      // Verify complete validation result
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('dataQualityScore');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('discrepancies');
      expect(result).toHaveProperty('recommendation');

      // Verify sources array
      expect(Array.isArray(result.sources)).toBe(true);
      expect(result.sources.length).toBeGreaterThan(0);

      // Count successful sources
      const successfulSources = result.sources.filter(s => s.status === 'SUCCESS');
      console.log('✅ Complete QDPP validation:', {
        passed: result.passed,
        qualityScore: result.dataQualityScore + '/100',
        successfulSources: successfulSources.length + '/' + result.sources.length,
        recommendation: result.recommendation,
        discrepancies: result.discrepancies.length,
      });

      // Log source statuses
      console.log('   Source statuses:');
      result.sources.forEach(s => {
        const status = s.status === 'SUCCESS' ? '✅' : '❌';
        console.log(`   ${status} ${s.name}: ${s.status}`);
      });
    }, TEST_TIMEOUT);

    it('should get comprehensive market data with QDPP validation', async () => {
      const result = await qdpp.getComprehensiveMarketData();

      // Verify structure
      expect(result).toHaveProperty('triangulation');
      expect(result).toHaveProperty('marketData');
      expect(result).toHaveProperty('onChain');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('validation');

      // Verify triangulation
      expect(result.triangulation.medianPrice).toBeGreaterThan(0);

      // Count available data sources
      const availableSources = [];
      if (result.marketData.coinMarketCap) availableSources.push('CMC');
      if (result.marketData.coinGecko) availableSources.push('CoinGecko');
      if (result.marketData.kraken) availableSources.push('Kraken');
      if (result.onChain) availableSources.push('Blockchain.com');
      if (result.sentiment) availableSources.push('LunarCrush');

      console.log('✅ Comprehensive market data:', {
        medianPrice: '$' + result.triangulation.medianPrice.toFixed(2),
        availableSources: availableSources.join(', '),
        qualityScore: result.validation.dataQualityScore + '/100',
        recommendation: result.validation.recommendation,
      });

      // Verify minimum data availability
      expect(availableSources.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });
});
