/**
 * Veritas Protocol - Feature Flags Tests
 * 
 * Tests for the feature flag system.
 */

import {
  isVeritasEnabled,
  getVeritasConfig,
  isValidationFeatureEnabled
} from '../utils/featureFlags';

describe('Veritas Feature Flags', () => {
  // Store original env
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });
  
  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  describe('isVeritasEnabled', () => {
    it('should return false when ENABLE_VERITAS_PROTOCOL is not set', () => {
      delete process.env.ENABLE_VERITAS_PROTOCOL;
      expect(isVeritasEnabled()).toBe(false);
    });
    
    it('should return false when ENABLE_VERITAS_PROTOCOL is false', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      expect(isVeritasEnabled()).toBe(false);
    });
    
    it('should return true when ENABLE_VERITAS_PROTOCOL is true', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      expect(isVeritasEnabled()).toBe(true);
    });
    
    it('should be case-insensitive', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'TRUE';
      expect(isVeritasEnabled()).toBe(true);
      
      process.env.ENABLE_VERITAS_PROTOCOL = 'False';
      expect(isVeritasEnabled()).toBe(false);
    });
  });
  
  describe('getVeritasConfig', () => {
    it('should return default config when no env vars set', () => {
      delete process.env.ENABLE_VERITAS_PROTOCOL;
      delete process.env.VERITAS_TIMEOUT_MS;
      delete process.env.VERITAS_CACHE_TTL_MS;
      
      const config = getVeritasConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.timeout).toBe(5000);
      expect(config.fallbackOnError).toBe(true);
      expect(config.cacheValidation).toBe(true);
      expect(config.cacheTTL).toBe(300000);
    });
    
    it('should use custom timeout when set', () => {
      process.env.VERITAS_TIMEOUT_MS = '10000';
      
      const config = getVeritasConfig();
      
      expect(config.timeout).toBe(10000);
    });
    
    it('should use custom cache TTL when set', () => {
      process.env.VERITAS_CACHE_TTL_MS = '600000';
      
      const config = getVeritasConfig();
      
      expect(config.cacheTTL).toBe(600000);
    });
  });
  
  describe('isValidationFeatureEnabled', () => {
    it('should return false when Veritas is disabled globally', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      
      expect(isValidationFeatureEnabled('market')).toBe(false);
      expect(isValidationFeatureEnabled('social')).toBe(false);
    });
    
    it('should return true when Veritas is enabled and no feature flag set', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      
      expect(isValidationFeatureEnabled('market')).toBe(true);
      expect(isValidationFeatureEnabled('social')).toBe(true);
    });
    
    it('should respect feature-specific flags', () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      process.env.ENABLE_VERITAS_MARKET = 'false';
      process.env.ENABLE_VERITAS_SOCIAL = 'true';
      
      expect(isValidationFeatureEnabled('market')).toBe(false);
      expect(isValidationFeatureEnabled('social')).toBe(true);
    });
  });
});
