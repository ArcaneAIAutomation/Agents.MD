/**
 * Veritas Protocol - API Integration Tests
 * 
 * Tests for Veritas Protocol integration across all UCIE API endpoints.
 * Validates:
 * - Validation enabled/disabled behavior
 * - Backward compatibility
 * - Response format consistency
 * - Graceful degradation
 * 
 * Requirements: 16.2, 16.3
 */

import { createMocks } from 'node-mocks-http';
import analyzeHandler from '../../../pages/api/ucie/analyze/[symbol]';
import marketDataHandler from '../../../pages/api/ucie/market-data/[symbol]';
import sentimentHandler from '../../../pages/api/ucie/sentiment/[symbol]';
import onChainHandler from '../../../pages/api/ucie/on-chain/[symbol]';

// ============================================================================
// Mock Setup
// ============================================================================

// Store original environment
const originalEnv = process.env;

// Mock feature flags
jest.mock('../../../lib/ucie/veritas/utils/featureFlags', () => ({
  isVeritasEnabled: jest.fn(),
  getVeritasConfig: jest.fn(() => ({
    enabled: false,
    timeout: 5000,
    fallbackOnError: true,
    cacheValidation: true,
    cacheTTL: 300000
  }))
}));

// Mock orchestrator
jest.mock('../../../lib/ucie/veritas/utils/validationOrchestrator', () => ({
  orchestrateValidation: jest.fn(),
  isSufficientForAnalysis: jest.fn(() => true),
  getStatusMessage: jest.fn(() => 'Validation complete')
}));

// Mock cache utilities
jest.mock('../../../lib/ucie/cacheUtils', () => ({
  getCachedAnalysis: jest.fn(() => null),
  setCachedAnalysis: jest.fn(),
  invalidateCache: jest.fn()
}));

// Mock metrics
jest.mock('../../../lib/ucie/veritas/utils/validationMetrics', () => ({
  logValidationAttempt: jest.fn(),
  logMetricsToConsole: jest.fn()
}));

// Import mocked functions
import { isVeritasEnabled } from '../../../lib/ucie/veritas/utils/featureFlags';
import { orchestrateValidation } from '../../../lib/ucie/veritas/utils/validationOrchestrator';
import { getCachedAnalysis, setCachedAnalysis } from '../../../lib/ucie/cacheUtils';
import { logValidationAttempt } from '../../../lib/ucie/veritas/utils/validationMetrics';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create mock orchestration result
 */
function createMockOrchestrationResult() {
  return {
    success: true,
    completed: true,
    halted: false,
    progress: 100,
    currentStep: null,
    completedSteps: ['market', 'social', 'onchain', 'news'],
    results: {
      market: {
        isValid: true,
        confidence: 90,
        alerts: [],
        discrepancies: [],
        dataQuality: { score: 90, breakdown: {}, passedChecks: [], failedChecks: [] }
      },
      social: {
        isValid: true,
        confidence: 85,
        alerts: [],
        discrepancies: [],
        dataQuality: { score: 85, breakdown: {}, passedChecks: [], failedChecks: [] }
      },
      onChain: {
        isValid: true,
        confidence: 80,
        alerts: [],
        discrepancies: [],
        dataQuality: { score: 80, breakdown: {}, passedChecks: [], failedChecks: [] }
      }
    },
    confidenceScore: {
      overallScore: 85,
      dataSourceAgreement: 90,
      logicalConsistency: 85,
      crossValidationSuccess: 80,
      completeness: 85,
      breakdown: { market: 90, social: 85, onChain: 80, news: 0 },
      confidenceLevel: 'high',
      explanation: 'Mock confidence score'
    },
    dataQualitySummary: {
      overallScore: 87,
      totalAlerts: 0,
      criticalAlerts: 0,
      totalDiscrepancies: 0,
      recommendations: [],
      reliabilityGuidance: {
        canProceedWithAnalysis: true,
        strengths: ['Mock strength'],
        weaknesses: []
      },
      validationDuration: 1000
    },
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 1000,
    timedOut: false,
    errors: []
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Veritas Protocol - API Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Default: Veritas disabled
    (isVeritasEnabled as jest.Mock).mockReturnValue(false);
    (getCachedAnalysis as jest.Mock).mockResolvedValue(null);
    (orchestrateValidation as jest.Mock).mockResolvedValue(createMockOrchestrationResult());
  });
  
  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  // ==========================================================================
  // Test 1: Validation Enabled Behavior
  // ==========================================================================
  
  describe('Validation Enabled (ENABLE_VERITAS_PROTOCOL=true)', () => {
    beforeEach(() => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
    });
    
    it('should include veritasValidation field in analyze endpoint response', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.analysis.veritasValidation).toBeDefined();
      expect(data.metadata.veritasEnabled).toBe(true);
      expect(data.metadata.veritasValidated).toBe(true);
    });
    
    it('should call orchestrateValidation when validation is enabled', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(orchestrateValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BTC'
        })
      );
    });
    
    it('should cache validation results', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(setCachedAnalysis).toHaveBeenCalledWith(
        'BTC',
        'veritas-validation',
        expect.any(Object),
        300, // 5 minutes
        expect.any(Number)
      );
    });
    
    it('should log validation metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(logValidationAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          completed: true
        })
      );
    });
    
    it('should use cached validation if available', async () => {
      const cachedResult = createMockOrchestrationResult();
      (getCachedAnalysis as jest.Mock).mockResolvedValue(cachedResult);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      // Should not call orchestrateValidation if cache hit
      expect(orchestrateValidation).not.toHaveBeenCalled();
      
      // Should still include validation in response
      const data = JSON.parse(res._getData());
      expect(data.analysis.veritasValidation).toBeDefined();
    });
  });
  
  // ==========================================================================
  // Test 2: Validation Disabled Behavior
  // ==========================================================================
  
  describe('Validation Disabled (ENABLE_VERITAS_PROTOCOL=false)', () => {
    beforeEach(() => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(false);
    });
    
    it('should NOT include veritasValidation field when disabled', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.analysis.veritasValidation).toBeUndefined();
      expect(data.metadata.veritasEnabled).toBe(false);
      expect(data.metadata.veritasValidated).toBe(false);
    });
    
    it('should NOT call orchestrateValidation when disabled', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(orchestrateValidation).not.toHaveBeenCalled();
    });
    
    it('should NOT cache validation results when disabled', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      expect(setCachedAnalysis).not.toHaveBeenCalledWith(
        expect.anything(),
        'veritas-validation',
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });
  });
  
  // ==========================================================================
  // Test 3: Backward Compatibility
  // ==========================================================================
  
  describe('Backward Compatibility', () => {
    it('should maintain existing response format with validation disabled', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(false);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      
      // Check all existing fields are present
      expect(data.success).toBeDefined();
      expect(data.analysis).toBeDefined();
      expect(data.analysis.symbol).toBeDefined();
      expect(data.analysis.timestamp).toBeDefined();
      expect(data.analysis.dataQualityScore).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.totalSources).toBeDefined();
      expect(data.metadata.successfulSources).toBeDefined();
      expect(data.metadata.failedSources).toBeDefined();
      expect(data.metadata.dataQuality).toBeDefined();
      expect(data.metadata.processingTime).toBeDefined();
      
      // Verify no veritasValidation field
      expect(data.analysis.veritasValidation).toBeUndefined();
    });
    
    it('should maintain existing response format with validation enabled', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      
      // Check all existing fields are still present
      expect(data.success).toBeDefined();
      expect(data.analysis).toBeDefined();
      expect(data.analysis.symbol).toBeDefined();
      expect(data.analysis.timestamp).toBeDefined();
      expect(data.analysis.dataQualityScore).toBeDefined();
      expect(data.metadata).toBeDefined();
      
      // Verify veritasValidation is ADDED (not replacing anything)
      expect(data.analysis.veritasValidation).toBeDefined();
    });
    
    it('should not break existing clients that ignore veritasValidation', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      
      // Simulate old client that only reads existing fields
      const oldClientData = {
        symbol: data.analysis.symbol,
        timestamp: data.analysis.timestamp,
        dataQualityScore: data.analysis.dataQualityScore,
        marketData: data.analysis.marketData
      };
      
      // Old client should work fine
      expect(oldClientData.symbol).toBeDefined();
      expect(oldClientData.timestamp).toBeDefined();
      expect(oldClientData.dataQualityScore).toBeDefined();
    });
  });
  
  // ==========================================================================
  // Test 4: Response Format Consistency
  // ==========================================================================
  
  describe('Response Format Consistency', () => {
    it('should have consistent veritasValidation structure', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      const validation = data.analysis.veritasValidation;
      
      // Check required fields
      expect(validation.success).toBeDefined();
      expect(validation.completed).toBeDefined();
      expect(validation.halted).toBeDefined();
      expect(validation.progress).toBeDefined();
      expect(validation.completedSteps).toBeDefined();
      expect(validation.results).toBeDefined();
      expect(validation.startTime).toBeDefined();
      expect(validation.endTime).toBeDefined();
      expect(validation.duration).toBeDefined();
      expect(validation.timedOut).toBeDefined();
      expect(validation.errors).toBeDefined();
    });
    
    it('should include confidenceScore when validation completes', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      const validation = data.analysis.veritasValidation;
      
      expect(validation.confidenceScore).toBeDefined();
      expect(validation.confidenceScore.overallScore).toBeDefined();
      expect(validation.confidenceScore.dataSourceAgreement).toBeDefined();
      expect(validation.confidenceScore.logicalConsistency).toBeDefined();
      expect(validation.confidenceScore.crossValidationSuccess).toBeDefined();
      expect(validation.confidenceScore.completeness).toBeDefined();
    });
    
    it('should include dataQualitySummary when validation completes', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      const validation = data.analysis.veritasValidation;
      
      expect(validation.dataQualitySummary).toBeDefined();
      expect(validation.dataQualitySummary.overallScore).toBeDefined();
      expect(validation.dataQualitySummary.totalAlerts).toBeDefined();
      expect(validation.dataQualitySummary.criticalAlerts).toBeDefined();
      expect(validation.dataQualitySummary.recommendations).toBeDefined();
    });
  });
  
  // ==========================================================================
  // Test 5: Graceful Degradation
  // ==========================================================================
  
  describe('Graceful Degradation', () => {
    it('should not fail analysis if validation throws error', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      (orchestrateValidation as jest.Mock).mockRejectedValue(new Error('Validation failed'));
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      // Analysis should still succeed
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      
      // Should include error information in validation
      expect(data.analysis.veritasValidation).toBeDefined();
      expect(data.analysis.veritasValidation.success).toBe(false);
      expect(data.analysis.veritasValidation.halted).toBe(true);
    });
    
    it('should continue with standard data quality score if validation fails', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      (orchestrateValidation as jest.Mock).mockRejectedValue(new Error('Validation failed'));
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      
      // Should have a data quality score (standard calculation)
      expect(data.analysis.dataQualityScore).toBeDefined();
      expect(data.analysis.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(data.analysis.dataQualityScore).toBeLessThanOrEqual(100);
    });
    
    it('should not fail if cache operations fail', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      (getCachedAnalysis as jest.Mock).mockRejectedValue(new Error('Cache read failed'));
      (setCachedAnalysis as jest.Mock).mockRejectedValue(new Error('Cache write failed'));
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      // Should still succeed
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });
    
    it('should not fail if metrics logging fails', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      (logValidationAttempt as jest.Mock).mockRejectedValue(new Error('Metrics logging failed'));
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      // Should still succeed
      expect(res._getStatusCode()).toBe(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.analysis.veritasValidation).toBeDefined();
    });
  });
  
  // ==========================================================================
  // Test 6: Metadata Consistency
  // ==========================================================================
  
  describe('Metadata Consistency', () => {
    it('should include veritasEnabled in metadata', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      expect(data.metadata.veritasEnabled).toBe(true);
    });
    
    it('should include veritasValidated in metadata', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      expect(data.metadata.veritasValidated).toBe(true);
    });
    
    it('should set veritasValidated to false if validation fails', async () => {
      (isVeritasEnabled as jest.Mock).mockReturnValue(true);
      (orchestrateValidation as jest.Mock).mockRejectedValue(new Error('Validation failed'));
      
      const { req, res } = createMocks({
        method: 'GET',
        query: { symbol: 'BTC' }
      });
      
      await analyzeHandler(req, res);
      
      const data = JSON.parse(res._getData());
      expect(data.metadata.veritasEnabled).toBe(true);
      expect(data.metadata.veritasValidated).toBe(false);
    });
  });
});

