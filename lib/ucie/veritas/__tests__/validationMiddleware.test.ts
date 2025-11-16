/**
 * Veritas Protocol - Validation Middleware Tests
 * 
 * Tests for the validation middleware system.
 */

import {
  validateWithVeritas,
  safeValidation,
  createValidatedResponse,
  getCachedValidation,
  setCachedValidation,
  clearValidationCache,
  type VeritasValidationResult
} from '../validationMiddleware';

describe('Veritas Validation Middleware', () => {
  // Store original env
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset env and cache before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    clearValidationCache();
  });
  
  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  describe('validateWithVeritas', () => {
    it('should return data without validation when Veritas is disabled', async () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'false';
      
      const mockData = { price: 100, volume: 1000000 };
      const dataFetcher = jest.fn().mockResolvedValue(mockData);
      const validator = jest.fn();
      
      const result = await validateWithVeritas(dataFetcher, validator);
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toBeUndefined();
      expect(dataFetcher).toHaveBeenCalledTimes(1);
      expect(validator).not.toHaveBeenCalled();
    });
    
    it('should return data with validation when Veritas is enabled', async () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      
      const mockData = { price: 100, volume: 1000000 };
      const mockValidation: VeritasValidationResult = {
        isValid: true,
        confidence: 95,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 95,
          marketDataQuality: 95,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: ['price_consistency'],
          failedChecks: []
        }
      };
      
      const dataFetcher = jest.fn().mockResolvedValue(mockData);
      const validator = jest.fn().mockResolvedValue(mockValidation);
      
      const result = await validateWithVeritas(dataFetcher, validator);
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toEqual(mockValidation);
      expect(dataFetcher).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(mockData);
    });
    
    it('should fallback to data without validation on error', async () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      
      const mockData = { price: 100, volume: 1000000 };
      const dataFetcher = jest.fn().mockResolvedValue(mockData);
      const validator = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      const result = await validateWithVeritas(dataFetcher, validator, {
        fallbackOnError: true
      });
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toBeUndefined();
    });
    
    it('should throw error when fallback is disabled', async () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      
      const mockData = { price: 100, volume: 1000000 };
      const dataFetcher = jest.fn().mockResolvedValue(mockData);
      const validator = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      await expect(
        validateWithVeritas(dataFetcher, validator, {
          fallbackOnError: false
        })
      ).rejects.toThrow('Validation failed');
    });
    
    it('should timeout validation after specified time', async () => {
      process.env.ENABLE_VERITAS_PROTOCOL = 'true';
      
      const mockData = { price: 100, volume: 1000000 };
      const dataFetcher = jest.fn().mockResolvedValue(mockData);
      const validator = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      const result = await validateWithVeritas(dataFetcher, validator, {
        timeout: 100,
        fallbackOnError: true
      });
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toBeUndefined();
    }, 10000);
  });
  
  describe('safeValidation', () => {
    it('should return validation result on success', async () => {
      const mockValidation: VeritasValidationResult = {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 90,
          marketDataQuality: 90,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      const validator = jest.fn().mockResolvedValue(mockValidation);
      const fallback: VeritasValidationResult = {
        isValid: false,
        confidence: 0,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 0,
          marketDataQuality: 0,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      const result = await safeValidation(validator, fallback);
      
      expect(result).toEqual(mockValidation);
    });
    
    it('should return fallback on error', async () => {
      const validator = jest.fn().mockRejectedValue(new Error('Validation failed'));
      const fallback: VeritasValidationResult = {
        isValid: false,
        confidence: 0,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 0,
          marketDataQuality: 0,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      const result = await safeValidation(validator, fallback);
      
      expect(result).toEqual(fallback);
    });
  });
  
  describe('createValidatedResponse', () => {
    it('should return data without validation when validation is undefined', () => {
      const data = { price: 100, volume: 1000000 };
      
      const result = createValidatedResponse(data, undefined);
      
      expect(result).toEqual(data);
      expect(result.veritasValidation).toBeUndefined();
    });
    
    it('should return data with validation when validation is provided', () => {
      const data = { price: 100, volume: 1000000 };
      const validation: VeritasValidationResult = {
        isValid: true,
        confidence: 95,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 95,
          marketDataQuality: 95,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      const result = createValidatedResponse(data, validation);
      
      expect(result.price).toBe(100);
      expect(result.volume).toBe(1000000);
      expect(result.veritasValidation).toEqual(validation);
    });
  });
  
  describe('Validation Cache', () => {
    it('should return null for non-existent cache key', () => {
      const result = getCachedValidation('test-key');
      
      expect(result).toBeNull();
    });
    
    it('should return cached validation result', () => {
      const validation: VeritasValidationResult = {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 90,
          marketDataQuality: 90,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      setCachedValidation('test-key', validation);
      const result = getCachedValidation('test-key');
      
      expect(result).toEqual(validation);
    });
    
    it('should return null for expired cache', () => {
      const validation: VeritasValidationResult = {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 90,
          marketDataQuality: 90,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      setCachedValidation('test-key', validation);
      
      // Try to get with very short TTL
      const result = getCachedValidation('test-key', 0);
      
      expect(result).toBeNull();
    });
    
    it('should clear specific cache key', () => {
      const validation: VeritasValidationResult = {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 90,
          marketDataQuality: 90,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      setCachedValidation('test-key-1', validation);
      setCachedValidation('test-key-2', validation);
      
      clearValidationCache('test-key-1');
      
      expect(getCachedValidation('test-key-1')).toBeNull();
      expect(getCachedValidation('test-key-2')).toEqual(validation);
    });
    
    it('should clear all cache when no key provided', () => {
      const validation: VeritasValidationResult = {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [],
        dataQualitySummary: {
          overallScore: 90,
          marketDataQuality: 90,
          socialDataQuality: 0,
          onChainDataQuality: 0,
          newsDataQuality: 0,
          passedChecks: [],
          failedChecks: []
        }
      };
      
      setCachedValidation('test-key-1', validation);
      setCachedValidation('test-key-2', validation);
      
      clearValidationCache();
      
      expect(getCachedValidation('test-key-1')).toBeNull();
      expect(getCachedValidation('test-key-2')).toBeNull();
    });
  });
});
