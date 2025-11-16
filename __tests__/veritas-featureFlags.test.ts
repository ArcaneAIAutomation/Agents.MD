/**
 * Tests for Veritas Protocol Feature Flags
 */

import { isVeritasEnabled, isVeritasFeatureEnabled, getVeritasConfig } from '../lib/ucie/veritas/utils/featureFlags';

describe('Veritas Feature Flags', () => {
  // Store original env
  const originalEnv = process.env.ENABLE_VERITAS_PROTOCOL;
  const originalMarketValidation = process.env.ENABLE_VERITAS_MARKET_VALIDATION;
  const originalTimeout = process.env.VERITAS_TIMEOUT_MS;
  
  afterEach(() => {
    // Restore original env after each test
    if (originalEnv !== undefined) {
      process.env.ENABLE_VERITAS_PROTOCOL = originalEnv;
    } else {
      delete process.env.ENABLE_VERITAS_PROTOCOL;
    }
    
    if (originalMarketValidation !== undefined) {
      process.env.ENABLE_VERITAS_MARKET_VALIDATION = originalMarketValidation;
    } else {
      delete process.env.ENABLE_VERITAS_MARKET_VALIDATION;
    }
    
    if (originalTimeout !== undefined) {
      process.env.VERITAS_TIMEOUT_MS = originalTimeout;
    } else {
      delete process.env.VERITAS_TIMEOUT_MS;
    }
  });
  
  describe('isVeritasEnabled', () => {
    test('returns false when env var is not set', () => {
      delete process.env.ENABLE_VERITAS_PROTOCOL;
      expect(isVeritasEnabled()).toBe(false);
    });
    
    test('returns true when env var is "true"', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      expect(isVeritasEnabled()).toBe(true);
    });
    
    test('returns true when env var is "TRUE" (case insensitive)', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'TRUE';
      expect(isVeritasEnabled()).toBe(true);
    });
    
    test('returns true when env var is "1"', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = '1';
      expect(isVeritasEnabled()).toBe(true);
    });
    
    test('returns true when env var is "yes"', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'yes';
      expect(isVeritasEnabled()).toBe(true);
    });
    
    test('returns false when env var is "false"', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      expect(isVeritasEnabled()).toBe(false);
    });
    
    test('returns false when env var is "0"', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = '0';
      expect(isVeritasEnabled()).toBe(false);
    });
    
    test('returns false when env var is invalid', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'invalid';
      expect(isVeritasEnabled()).toBe(false);
    });
  });
  
  describe('isVeritasFeatureEnabled', () => {
    test('returns false when Veritas is globally disabled', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      expect(isVeritasFeatureEnabled('market-validation')).toBe(false);
    });
    
    test('returns true when Veritas is enabled and no specific flag', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      expect(isVeritasFeatureEnabled('market-validation')).toBe(true);
    });
    
    test('respects feature-specific flags', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      process.env.ENABLE_VERITAS_MARKET_VALIDATION = 'false';
      expect(isVeritasFeatureEnabled('market-validation')).toBe(false);
    });
  });
  
  describe('getVeritasConfig', () => {
    test('returns disabled config when Veritas is off', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      const config = getVeritasConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.features.marketValidation).toBe(false);
      expect(config.features.socialValidation).toBe(false);
      expect(config.features.onChainValidation).toBe(false);
      expect(config.features.newsValidation).toBe(false);
    });
    
    test('returns enabled config when Veritas is on', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      const config = getVeritasConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.features.marketValidation).toBe(true);
      expect(config.features.socialValidation).toBe(true);
      expect(config.features.onChainValidation).toBe(true);
      expect(config.features.newsValidation).toBe(true);
    });
    
    test('uses default timeout when not specified', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      delete process.env.VERITAS_TIMEOUT_MS;
      const config = getVeritasConfig();
      
      expect(config.timeout).toBe(5000);
    });
    
    test('uses custom timeout when specified', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      process.env.VERITAS_TIMEOUT_MS = '10000';
      const config = getVeritasConfig();
      
      expect(config.timeout).toBe(10000);
    });
  });
});
