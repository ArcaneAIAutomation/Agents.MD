/**
 * Tests for Veritas Protocol Validation Middleware
 */

import {
  validateWithVeritas,
  safeValidation,
  createValidatedResponse,
  VeritasValidationResult,
} from '../lib/ucie/veritas/validationMiddleware';

describe('Veritas Validation Middleware', () => {
  describe('validateWithVeritas', () => {
    test('returns data without validation when Veritas is disabled', async () => {
      const mockData = { price: 100, volume: 1000 };
      const mockFetcher = jest.fn().mockResolvedValue(mockData);
      const mockValidator = jest.fn();
      
      const result = await validateWithVeritas(
        mockFetcher,
        mockValidator,
        { enableVeritas: false }
      );
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toBeUndefined();
      expect(mockFetcher).toHaveBeenCalled();
      expect(mockValidator).not.toHaveBeenCalled();
    });
    
    test('returns data with validation when Veritas is enabled', async () => {
      const mockData = { price: 100, volume: 1000 };
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
          failedChecks: [],
        },
      };
      
      const mockFetcher = jest.fn().mockResolvedValue(mockData);
      const mockValidator = jest.fn().mockResolvedValue(mockValidation);
      
      const result = await validateWithVeritas(
        mockFetcher,
        mockValidator,
        { enableVeritas: true }
      );
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toEqual(mockValidation);
      expect(mockFetcher).toHaveBeenCalled();
      expect(mockValidator).toHaveBeenCalledWith(mockData);
    });
    
    test('falls back to data without validation on validation error', async () => {
      const mockData = { price: 100, volume: 1000 };
      const mockFetcher = jest.fn().mockResolvedValue(mockData);
      const mockValidator = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      const result = await validateWithVeritas(
        mockFetcher,
        mockValidator,
        { enableVeritas: true, fallbackOnError: true }
      );
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toBeUndefined();
      expect(mockFetcher).toHaveBeenCalled();
      expect(mockValidator).toHaveBeenCalled();
    });
    
    test('throws error on data fetching failure', async () => {
      const mockFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));
      const mockValidator = jest.fn();
      
      await expect(
        validateWithVeritas(mockFetcher, mockValidator, { enableVeritas: true })
      ).rejects.toThrow('Fetch failed');
      
      expect(mockFetcher).toHaveBeenCalled();
      expect(mockValidator).not.toHaveBeenCalled();
    });
    
    test('respects timeout protection', async () => {
      const mockData = { price: 100, volume: 1000 };
      const mockFetcher = jest.fn().mockResolvedValue(mockData);
      const mockValidator = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );
      
      const result = await validateWithVeritas(
        mockFetcher,
        mockValidator,
        { enableVeritas: true, fallbackOnError: true, timeout: 100 }
      );
      
      expect(result.data).toEqual(mockData);
      expect(result.validation).toBeUndefined();
    }, 10000);
  });
  
  describe('safeValidation', () => {
    test('returns validation result on success', async () => {
      const mockResult = { isValid: true, confidence: 95 };
      const mockValidator = jest.fn().mockResolvedValue(mockResult);
      
      const result = await safeValidation(mockValidator, null);
      
      expect(result).toEqual(mockResult);
    });
    
    test('returns fallback on validation error', async () => {
      const mockFallback = { isValid: false, confidence: 0 };
      const mockValidator = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      const result = await safeValidation(mockValidator, mockFallback);
      
      expect(result).toEqual(mockFallback);
    });
  });
  
  describe('createValidatedResponse', () => {
    test('returns data unchanged when no validation', () => {
      const mockData = { price: 100, volume: 1000 };
      
      const result = createValidatedResponse(mockData);
      
      expect(result).toEqual(mockData);
      expect(result.veritasValidation).toBeUndefined();
    });
    
    test('adds validation to response when provided', () => {
      const mockData = { price: 100, volume: 1000 };
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
          failedChecks: [],
        },
      };
      
      const result = createValidatedResponse(mockData, mockValidation);
      
      expect(result.price).toBe(100);
      expect(result.volume).toBe(1000);
      expect(result.veritasValidation).toEqual(mockValidation);
    });
  });
});
