/**
 * On-Chain Data Validator Tests
 * 
 * Comprehensive unit tests for on-chain data validation against market activity.
 * Tests cover:
 * - Market-to-chain consistency checking
 * - Impossibility detection
 * - Consistency score calculation
 * - Flow sentiment analysis
 * - Error handling
 * 
 * Requirements: 3.3, 12.4
 */

import { validateOnChainData } from '../lib/ucie/veritas/validators/onChainValidator';
import type { VeritasValidationResult } from '../lib/ucie/veritas/types/validationTypes';

// Mock the alert system to prevent actual email sending during tests
jest.mock('../lib/ucie/veritas/utils/alertSystem', () => ({
  veritasAlertSystem: {
    queueAlert: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('On-Chain Data Validator - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Test 1: Market-to-Chain Consistency Checking
  // ============================================================================
  
  describe('Market-to-Chain Consistency Checking', () => {
    test('should detect high consistency when flows match expected ratio', async () => {
      const marketData = {
        volume24h: 10_000_000_000, // $10B volume
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 500, // 500 transactions
            exchangeWithdrawals: 500, // 500 transactions
            coldWalletMovements: 100,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.dataQualitySummary.passedChecks).toContain('market_to_chain_consistency');
      expect(result.dataQualitySummary.failedChecks).not.toContain('market_to_chain_consistency');
      
      console.log('✅ High consistency detected:', {
        confidence: result.confidence,
        passedChecks: result.dataQualitySummary.passedChecks
      });
    });

    test('should detect low consistency when flows are much lower than expected', async () => {
      const marketData = {
        volume24h: 50_000_000_000, // $50B volume
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 10, // Very low flows
            exchangeWithdrawals: 10,
            coldWalletMovements: 5,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(true); // Not fatal, just warning
      expect(result.confidence).toBeLessThan(50);
      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: 'warning',
            type: 'onchain',
            message: expect.stringContaining('Low market-to-chain consistency'),
          }),
        ])
      );
      expect(result.dataQualitySummary.failedChecks).toContain('market_to_chain_consistency');
      
      console.log('✅ Low consistency detected:', {
        confidence: result.confidence,
        alerts: result.alerts.length,
        failedChecks: result.dataQualitySummary.failedChecks
      });
    });

    test('should generate discrepancy report for low consistency', async () => {
      const marketData = {
        volume24h: 30_000_000_000, // $30B volume
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 5,
            exchangeWithdrawals: 5,
            coldWalletMovements: 2,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.discrepancies.length).toBeGreaterThan(0);
      expect(result.discrepancies[0]).toMatchObject({
        metric: 'market_to_chain_consistency',
        sources: expect.arrayContaining([
          expect.objectContaining({ name: 'Market Volume (24h)' }),
          expect.objectContaining({ name: 'Exchange Flows' }),
        ]),
        exceeded: true,
      });
      
      console.log('✅ Discrepancy report generated:', {
        metric: result.discrepancies[0].metric,
        sources: result.discrepancies[0].sources.length,
        variance: result.discrepancies[0].variance
      });
    });

    test('should handle missing market volume gracefully', async () => {
      const marketData = {}; // No volume data

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 100,
            exchangeWithdrawals: 100,
            coldWalletMovements: 50,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(50); // Neutral score
      expect(result.alerts[0].severity).toBe('warning');
      expect(result.alerts[0].message).toContain('Market volume data unavailable');
      
      console.log('✅ Missing market volume handled gracefully:', {
        confidence: result.confidence,
        message: result.alerts[0].message
      });
    });

    test('should handle missing on-chain data gracefully', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {}; // No whale activity data

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      
      console.log('✅ Missing on-chain data handled gracefully:', {
        confidence: result.confidence,
        alerts: result.alerts.length
      });
    });
  });

  // ============================================================================
  // Test 2: Impossibility Detection
  // ============================================================================
  
  describe('Impossibility Detection', () => {
    test('should detect fatal error when high volume exists with zero exchange flows', async () => {
      const marketData = {
        volume24h: 25_000_000_000, // $25B volume (above $20B threshold)
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 0, // Zero flows
            exchangeWithdrawals: 0,
            coldWalletMovements: 0,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: 'fatal',
            type: 'onchain',
            message: expect.stringContaining('Fatal On-Chain Data Error'),
          }),
        ])
      );
      expect(result.dataQualitySummary.failedChecks).toContain('market_to_chain_consistency');
      expect(result.dataQualitySummary.failedChecks).toContain('impossibility_check');
      
      console.log('✅ Fatal impossibility error detected:', {
        isValid: result.isValid,
        confidence: result.confidence,
        fatalAlerts: result.alerts.filter(a => a.severity === 'fatal').length
      });
    });

    test('should not trigger fatal error when volume is below threshold', async () => {
      const marketData = {
        volume24h: 15_000_000_000, // $15B volume (below $20B threshold)
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 0,
            exchangeWithdrawals: 0,
            coldWalletMovements: 0,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(true);
      expect(result.alerts.filter(a => a.severity === 'fatal')).toHaveLength(0);
      
      console.log('✅ No fatal error below threshold:', {
        volume: marketData.volume24h,
        isValid: result.isValid
      });
    });

    test('should not trigger fatal error when flows exist', async () => {
      const marketData = {
        volume24h: 25_000_000_000, // $25B volume (above threshold)
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 100, // Flows exist
            exchangeWithdrawals: 100,
            coldWalletMovements: 50,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(true);
      expect(result.alerts.filter(a => a.severity === 'fatal')).toHaveLength(0);
      
      console.log('✅ No fatal error when flows exist:', {
        volume: marketData.volume24h,
        flows: 200,
        isValid: result.isValid
      });
    });

    test('should queue email alert for fatal impossibility error', async () => {
      const { veritasAlertSystem } = require('../lib/ucie/veritas/utils/alertSystem');
      
      const marketData = {
        volume24h: 30_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 0,
            exchangeWithdrawals: 0,
            coldWalletMovements: 0,
          },
        },
      };

      await validateOnChainData('BTC', marketData, onChainData);

      expect(veritasAlertSystem.queueAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'fatal',
          symbol: 'BTC',
          alertType: 'fatal_error',
          requiresHumanReview: true,
        })
      );
      
      console.log('✅ Email alert queued for fatal error');
    });
  });

  // ============================================================================
  // Test 3: Consistency Score Calculation
  // ============================================================================
  
  describe('Consistency Score Calculation', () => {
    test('should calculate high score (80+) when flows are in optimal range', async () => {
      const marketData = {
        volume24h: 10_000_000_000, // $10B
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 1000, // Optimal flow ratio
            exchangeWithdrawals: 1000,
            coldWalletMovements: 500,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.confidence).toBeGreaterThanOrEqual(80);
      expect(result.dataQualitySummary.onChainDataQuality).toBeGreaterThanOrEqual(80);
      
      console.log('✅ High consistency score calculated:', {
        confidence: result.confidence,
        onChainQuality: result.dataQualitySummary.onChainDataQuality
      });
    });

    test('should calculate lower score when flows are below optimal range', async () => {
      const marketData = {
        volume24h: 20_000_000_000, // $20B
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 50, // Low flows
            exchangeWithdrawals: 50,
            coldWalletMovements: 20,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.confidence).toBeLessThan(80);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      
      console.log('✅ Lower consistency score calculated:', {
        confidence: result.confidence,
        reason: 'flows below optimal range'
      });
    });

    test('should calculate score correctly for various volume levels', async () => {
      const testCases = [
        { volume: 5_000_000_000, deposits: 250, withdrawals: 250 },
        { volume: 15_000_000_000, deposits: 750, withdrawals: 750 },
        { volume: 40_000_000_000, deposits: 2000, withdrawals: 2000 },
      ];

      for (const testCase of testCases) {
        const result = await validateOnChainData(
          'BTC',
          { volume24h: testCase.volume },
          {
            whaleActivity: {
              summary: {
                exchangeDeposits: testCase.deposits,
                exchangeWithdrawals: testCase.withdrawals,
                coldWalletMovements: 100,
              },
            },
          }
        );

        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
        expect(result.dataQualitySummary.onChainDataQuality).toBe(result.confidence);
        
        console.log(`✅ Score calculated for $${testCase.volume / 1e9}B volume:`, {
          confidence: result.confidence,
          flows: testCase.deposits + testCase.withdrawals
        });
      }
    });

    test('should ensure consistency score is always between 0 and 100', async () => {
      const extremeCases = [
        { volume: 1_000_000_000, deposits: 0, withdrawals: 0 }, // Very low
        { volume: 100_000_000_000, deposits: 10000, withdrawals: 10000 }, // Very high
      ];

      for (const testCase of extremeCases) {
        const result = await validateOnChainData(
          'BTC',
          { volume24h: testCase.volume },
          {
            whaleActivity: {
              summary: {
                exchangeDeposits: testCase.deposits,
                exchangeWithdrawals: testCase.withdrawals,
                coldWalletMovements: 50,
              },
            },
          }
        );

        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
        
        console.log(`✅ Score bounded correctly for extreme case:`, {
          volume: testCase.volume,
          confidence: result.confidence
        });
      }
    });
  });

  // ============================================================================
  // Test 4: Flow Sentiment Analysis
  // ============================================================================
  
  describe('Flow Sentiment Analysis', () => {
    test('should detect bullish sentiment when withdrawals exceed deposits', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 100,
            exchangeWithdrawals: 200, // More withdrawals = bullish
            coldWalletMovements: 50,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      const sentimentAlert = result.alerts.find(a => 
        a.message.includes('Exchange flow sentiment')
      );
      
      expect(sentimentAlert).toBeDefined();
      expect(sentimentAlert?.message).toContain('BULLISH');
      expect(sentimentAlert?.recommendation).toContain('accumulation');
      
      console.log('✅ Bullish sentiment detected:', {
        netFlow: 100,
        sentiment: 'BULLISH'
      });
    });

    test('should detect bearish sentiment when deposits exceed withdrawals', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 200, // More deposits = bearish
            exchangeWithdrawals: 100,
            coldWalletMovements: 50,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      const sentimentAlert = result.alerts.find(a => 
        a.message.includes('Exchange flow sentiment')
      );
      
      expect(sentimentAlert).toBeDefined();
      expect(sentimentAlert?.message).toContain('BEARISH');
      expect(sentimentAlert?.recommendation).toContain('distribution');
      
      console.log('✅ Bearish sentiment detected:', {
        netFlow: -100,
        sentiment: 'BEARISH'
      });
    });

    test('should detect neutral sentiment when flows are balanced', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 150,
            exchangeWithdrawals: 152, // Nearly balanced (within threshold)
            coldWalletMovements: 50,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      const sentimentAlert = result.alerts.find(a => 
        a.message.includes('Exchange flow sentiment')
      );
      
      expect(sentimentAlert).toBeDefined();
      expect(sentimentAlert?.message).toContain('NEUTRAL');
      
      console.log('✅ Neutral sentiment detected:', {
        netFlow: 2,
        sentiment: 'NEUTRAL'
      });
    });
  });

  // ============================================================================
  // Test 5: Error Handling
  // ============================================================================
  
  describe('Error Handling', () => {
    test('should handle validation errors gracefully', async () => {
      const marketData = null; // Invalid data that might cause errors
      const onChainData = null;

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.alerts[0].severity).toBe('error');
      expect(result.dataQualitySummary.failedChecks).toContain('validation_error');
      
      console.log('✅ Validation errors handled gracefully:', {
        isValid: result.isValid,
        errorMessage: result.alerts[0].message
      });
    });

    test('should return error result when exception occurs', async () => {
      // Pass malformed data that will cause an error
      const marketData = { volume24h: 'invalid' }; // String instead of number
      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 'invalid',
            exchangeWithdrawals: 'invalid',
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.alerts.length).toBeGreaterThan(0);
      
      console.log('✅ Exception handled correctly:', {
        isValid: result.isValid,
        alerts: result.alerts.length
      });
    });
  });

  // ============================================================================
  // Test 6: Data Quality Summary
  // ============================================================================
  
  describe('Data Quality Summary', () => {
    test('should generate accurate data quality summary for valid data', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 500,
            exchangeWithdrawals: 500,
            coldWalletMovements: 200,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.dataQualitySummary).toMatchObject({
        overallScore: expect.any(Number),
        marketDataQuality: 0, // Not tested in on-chain validator
        socialDataQuality: 0, // Not tested in on-chain validator
        onChainDataQuality: expect.any(Number),
        newsDataQuality: 0, // Not tested in on-chain validator
        passedChecks: expect.any(Array),
        failedChecks: expect.any(Array),
      });

      expect(result.dataQualitySummary.overallScore).toBe(
        result.dataQualitySummary.onChainDataQuality
      );
      
      console.log('✅ Data quality summary generated:', {
        overallScore: result.dataQualitySummary.overallScore,
        onChainQuality: result.dataQualitySummary.onChainDataQuality
      });
    });

    test('should mark checks as passed when consistency is high', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 1000,
            exchangeWithdrawals: 1000,
            coldWalletMovements: 500,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.dataQualitySummary.passedChecks).toContain('market_to_chain_consistency');
      expect(result.dataQualitySummary.failedChecks).not.toContain('market_to_chain_consistency');
      
      console.log('✅ Checks marked as passed:', {
        passedChecks: result.dataQualitySummary.passedChecks
      });
    });

    test('should mark checks as failed when consistency is low', async () => {
      const marketData = {
        volume24h: 50_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 10,
            exchangeWithdrawals: 10,
            coldWalletMovements: 5,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

      expect(result.dataQualitySummary.failedChecks).toContain('market_to_chain_consistency');
      expect(result.dataQualitySummary.passedChecks).not.toContain('market_to_chain_consistency');
      
      console.log('✅ Checks marked as failed:', {
        failedChecks: result.dataQualitySummary.failedChecks
      });
    });
  });

  // ============================================================================
  // Test 7: Validation Result Structure
  // ============================================================================
  
  describe('Validation Result Structure', () => {
    test('should return complete validation result structure', async () => {
      const marketData = {
        volume24h: 10_000_000_000,
      };

      const onChainData = {
        whaleActivity: {
          summary: {
            exchangeDeposits: 500,
            exchangeWithdrawals: 500,
            coldWalletMovements: 200,
          },
        },
      };

      const result = await validateOnChainData('BTC', marketData, onChainData);

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
    });
  });
});
