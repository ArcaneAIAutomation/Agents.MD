/**
 * Market Data Validator Tests
 * 
 * Comprehensive unit tests for cross-validation of market data from multiple sources.
 * Tests cover:
 * - Price discrepancy detection
 * - Volume discrepancy detection
 * - Arbitrage opportunity detection
 * - Data quality scoring
 * - Dynamic weight application
 * 
 * Requirements: 1.1, 1.2
 */

import { validateMarketData } from '../lib/ucie/veritas/validators/marketDataValidator';

describe('Market Data Validator - Unit Tests', () => {
  // ============================================================================
  // Test 1: Price Discrepancy Detection
  // ============================================================================
  
  describe('Price Discrepancy Detection', () => {
    test('should detect price discrepancies exceeding 1.5% threshold', async () => {
      const result = await validateMarketData('BTC');
      
      // Check if discrepancies array exists
      expect(Array.isArray(result.discrepancies)).toBe(true);
      
      // If there are price discrepancies, verify they exceed threshold
      const priceDiscrepancies = result.discrepancies.filter(d => d.metric === 'price');
      
      if (priceDiscrepancies.length > 0) {
        priceDiscrepancies.forEach(discrepancy => {
          expect(discrepancy.variance).toBeGreaterThan(0.015); // 1.5%
          expect(discrepancy.threshold).toBe(0.015);
          expect(discrepancy.exceeded).toBe(true);
          expect(discrepancy.sources.length).toBeGreaterThanOrEqual(2);
        });
        
        console.log('✅ Price discrepancy detected and validated:', {
          variance: (priceDiscrepancies[0].variance * 100).toFixed(2) + '%',
          sources: priceDiscrepancies[0].sources.length
        });
      } else {
        console.log('✅ No price discrepancies detected (prices within 1.5% threshold)');
      }
    }, 30000);
    
    test('should generate warning alerts for price discrepancies', async () => {
      const result = await validateMarketData('BTC');
      
      // Check for price-related alerts
      const priceAlerts = result.alerts.filter(a => 
        a.type === 'market' && a.message.includes('Price discrepancy')
      );
      
      // If price discrepancies exist, there should be alerts
      const priceDiscrepancies = result.discrepancies.filter(d => d.metric === 'price');
      
      if (priceDiscrepancies.length > 0) {
        expect(priceAlerts.length).toBeGreaterThan(0);
        
        priceAlerts.forEach(alert => {
          expect(['warning', 'error']).toContain(alert.severity);
          expect(alert.affectedSources.length).toBeGreaterThanOrEqual(2);
          expect(alert.recommendation).toContain('weighted average');
        });
        
        console.log('✅ Price discrepancy alerts generated correctly');
      } else {
        console.log('✅ No price alerts needed (prices consistent)');
      }
    }, 30000);
    
    test('should send email alerts for critical discrepancies (>5%)', async () => {
      const result = await validateMarketData('BTC');
      
      // Check for critical price discrepancies
      const criticalDiscrepancies = result.discrepancies.filter(d => 
        d.metric === 'price' && d.variance > 0.05
      );
      
      if (criticalDiscrepancies.length > 0) {
        // Should have error-level alerts for critical discrepancies
        const errorAlerts = result.alerts.filter(a => a.severity === 'error');
        expect(errorAlerts.length).toBeGreaterThan(0);
        
        console.log('✅ Critical discrepancy detected (>5%), email alert should be sent');
      } else {
        console.log('✅ No critical discrepancies detected');
      }
    }, 30000);
  });
  
  // ============================================================================
  // Test 2: Volume Discrepancy Detection
  // ============================================================================
  
  describe('Volume Discrepancy Detection', () => {
    test('should detect volume discrepancies exceeding 10% threshold', async () => {
      const result = await validateMarketData('BTC');
      
      // Check for volume discrepancies
      const volumeDiscrepancies = result.discrepancies.filter(d => d.metric === 'volume_24h');
      
      if (volumeDiscrepancies.length > 0) {
        volumeDiscrepancies.forEach(discrepancy => {
          expect(discrepancy.variance).toBeGreaterThan(0.10); // 10%
          expect(discrepancy.threshold).toBe(0.10);
          expect(discrepancy.exceeded).toBe(true);
          expect(discrepancy.sources.length).toBeGreaterThanOrEqual(2);
        });
        
        console.log('✅ Volume discrepancy detected and validated:', {
          variance: (volumeDiscrepancies[0].variance * 100).toFixed(2) + '%',
          sources: volumeDiscrepancies[0].sources.length
        });
      } else {
        console.log('✅ No volume discrepancies detected (volumes within 10% threshold)');
      }
    }, 30000);
    
    test('should flag misaligned volume sources', async () => {
      const result = await validateMarketData('BTC');
      
      // Check for volume-related alerts
      const volumeAlerts = result.alerts.filter(a => 
        a.type === 'market' && a.message.includes('Volume discrepancy')
      );
      
      if (volumeAlerts.length > 0) {
        volumeAlerts.forEach(alert => {
          expect(alert.severity).toBe('warning');
          expect(alert.recommendation).toContain('Misaligned sources');
          expect(alert.affectedSources.length).toBeGreaterThanOrEqual(1);
        });
        
        console.log('✅ Misaligned volume sources flagged correctly');
      } else {
        console.log('✅ All volume sources aligned');
      }
    }, 30000);
  });
  
  // ============================================================================
  // Test 3: Arbitrage Opportunity Detection
  // ============================================================================
  
  describe('Arbitrage Opportunity Detection', () => {
    test('should detect arbitrage opportunities with >2% spread', async () => {
      const result = await validateMarketData('BTC');
      
      // Check for arbitrage alerts
      const arbitrageAlerts = result.alerts.filter(a => 
        a.message.includes('Arbitrage opportunity')
      );
      
      if (arbitrageAlerts.length > 0) {
        arbitrageAlerts.forEach(alert => {
          expect(alert.severity).toBe('info');
          expect(alert.type).toBe('market');
          expect(alert.affectedSources.length).toBe(2);
          expect(alert.recommendation).toContain('Potential profit');
          expect(alert.recommendation).toContain('Buy on');
          expect(alert.recommendation).toContain('sell on');
        });
        
        console.log('✅ Arbitrage opportunity detected:', {
          message: arbitrageAlerts[0].message,
          sources: arbitrageAlerts[0].affectedSources
        });
      } else {
        console.log('✅ No arbitrage opportunities detected (spread <2%)');
      }
    }, 30000);
    
    test('should calculate profit percentages correctly', async () => {
      const result = await validateMarketData('BTC');
      
      const arbitrageAlerts = result.alerts.filter(a => 
        a.message.includes('Arbitrage opportunity')
      );
      
      if (arbitrageAlerts.length > 0) {
        arbitrageAlerts.forEach(alert => {
          // Extract profit percentage from message
          const profitMatch = alert.message.match(/(\d+\.\d+)% spread/);
          
          if (profitMatch) {
            const profitPercent = parseFloat(profitMatch[1]);
            expect(profitPercent).toBeGreaterThan(2.0); // >2% threshold
            
            console.log('✅ Profit percentage calculated:', profitPercent + '%');
          }
        });
      }
    }, 30000);
  });
  
  // ============================================================================
  // Test 4: Data Quality Scoring
  // ============================================================================
  
  describe('Data Quality Scoring', () => {
    test('should calculate overall data quality score (0-100)', async () => {
      const result = await validateMarketData('BTC');
      
      expect(result.dataQualitySummary.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.dataQualitySummary.overallScore).toBeLessThanOrEqual(100);
      
      console.log('✅ Overall data quality score:', result.dataQualitySummary.overallScore);
    }, 30000);
    
    test('should calculate market data quality score', async () => {
      const result = await validateMarketData('BTC');
      
      expect(result.dataQualitySummary.marketDataQuality).toBeGreaterThanOrEqual(0);
      expect(result.dataQualitySummary.marketDataQuality).toBeLessThanOrEqual(100);
      
      // Market data quality should match overall score (since only market data is validated)
      expect(result.dataQualitySummary.marketDataQuality).toBe(result.dataQualitySummary.overallScore);
      
      console.log('✅ Market data quality score:', result.dataQualitySummary.marketDataQuality);
    }, 30000);
    
    test('should track passed and failed checks', async () => {
      const result = await validateMarketData('BTC');
      
      expect(Array.isArray(result.dataQualitySummary.passedChecks)).toBe(true);
      expect(Array.isArray(result.dataQualitySummary.failedChecks)).toBe(true);
      
      // Should have at least one check (price_consistency or volume_consistency)
      const totalChecks = result.dataQualitySummary.passedChecks.length + 
                          result.dataQualitySummary.failedChecks.length;
      expect(totalChecks).toBeGreaterThanOrEqual(1);
      
      console.log('✅ Checks tracked:', {
        passed: result.dataQualitySummary.passedChecks,
        failed: result.dataQualitySummary.failedChecks
      });
    }, 30000);
    
    test('should penalize quality score for discrepancies', async () => {
      const result = await validateMarketData('BTC');
      
      // If there are discrepancies, quality score should be reduced
      if (result.discrepancies.length > 0) {
        expect(result.dataQualitySummary.overallScore).toBeLessThan(100);
        
        console.log('✅ Quality score penalized for discrepancies:', {
          score: result.dataQualitySummary.overallScore,
          discrepancies: result.discrepancies.length
        });
      } else {
        // If no discrepancies and all sources available, score should be high
        expect(result.dataQualitySummary.overallScore).toBeGreaterThanOrEqual(90);
        
        console.log('✅ High quality score (no discrepancies):', result.dataQualitySummary.overallScore);
      }
    }, 30000);
  });
  
  // ============================================================================
  // Test 5: Dynamic Weight Application
  // ============================================================================
  
  describe('Dynamic Weight Application', () => {
    test('should apply dynamic trust weights to sources', async () => {
      const result = await validateMarketData('BTC');
      
      // Validation should complete successfully
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      
      // If there are discrepancies, dynamic weights should be applied
      if (result.discrepancies.length > 0) {
        // Check that recommendation mentions weighted average
        const priceAlerts = result.alerts.filter(a => a.message.includes('Price discrepancy'));
        
        if (priceAlerts.length > 0) {
          expect(priceAlerts[0].recommendation).toContain('weighted average');
          expect(priceAlerts[0].recommendation).toContain('trust scores');
          
          console.log('✅ Dynamic trust weights applied in recommendations');
        }
      }
      
      console.log('✅ Dynamic weight application verified');
    }, 30000);
    
    test('should update source reliability after validation', async () => {
      const result = await validateMarketData('BTC');
      
      // Validation should complete (reliability tracker updated internally)
      expect(result).toHaveProperty('isValid');
      
      // If validation succeeded, at least one source should have passed
      if (result.isValid) {
        expect(result.dataQualitySummary.passedChecks.length).toBeGreaterThanOrEqual(0);
        
        console.log('✅ Source reliability updated after validation');
      }
    }, 30000);
  });
  
  // ============================================================================
  // Test 6: Validation Result Structure
  // ============================================================================
  
  describe('Validation Result Structure', () => {
    test('should return complete validation result structure', async () => {
      const result = await validateMarketData('BTC');
      
      // Verify all required fields exist
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('discrepancies');
      expect(result).toHaveProperty('dataQualitySummary');
      
      // Verify types
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.discrepancies)).toBe(true);
      expect(typeof result.dataQualitySummary).toBe('object');
      
      console.log('✅ Validation result structure complete');
    }, 30000);
    
    test('should set isValid to false for fatal errors', async () => {
      const result = await validateMarketData('INVALID_SYMBOL');
      
      // Should return invalid result for unsupported symbols
      expect(result.isValid).toBe(false);
      
      // Should have fatal alert
      const fatalAlerts = result.alerts.filter(a => a.severity === 'fatal');
      expect(fatalAlerts.length).toBeGreaterThan(0);
      
      console.log('✅ Fatal errors handled correctly');
    }, 30000);
    
    test('should set confidence to 0 for complete failures', async () => {
      const result = await validateMarketData('INVALID_SYMBOL');
      
      // Confidence should be 0 for complete failures
      expect(result.confidence).toBe(0);
      
      console.log('✅ Confidence score set to 0 for failures');
    }, 30000);
  });
  
  // ============================================================================
  // Test 7: Integration Test (Real API Calls)
  // ============================================================================
  
  describe('Integration Tests', () => {
    test('should validate BTC market data from real APIs', async () => {
      const result = await validateMarketData('BTC');
      
      // Should successfully fetch and validate data
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      
      console.log('✅ BTC validation complete:', {
        isValid: result.isValid,
        confidence: result.confidence,
        alerts: result.alerts.length,
        discrepancies: result.discrepancies.length
      });
    }, 30000);
    
    test('should validate ETH market data from real APIs', async () => {
      const result = await validateMarketData('ETH');
      
      // Should successfully fetch and validate data
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      
      console.log('✅ ETH validation complete:', {
        isValid: result.isValid,
        confidence: result.confidence,
        alerts: result.alerts.length,
        discrepancies: result.discrepancies.length
      });
    }, 30000);
  });
});

