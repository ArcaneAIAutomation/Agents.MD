/**
 * Veritas Protocol - Validation Orchestrator Integration Tests
 * 
 * Tests for the validation orchestration workflow including:
 * - Sequential execution
 * - Halt-on-fatal-error
 * - Timeout protection
 * - Partial result handling
 * - Progress tracking
 * - Result aggregation
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import {
  orchestrateValidation,
  isSufficientForAnalysis,
  getStatusMessage,
  type OrchestrationResult,
  type ValidationInput,
  type ValidationStep
} from '../validationOrchestrator';
import type { VeritasValidationResult } from '../../types/validationTypes';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock validators
jest.mock('../../validators/marketDataValidator', () => ({
  validateMarketData: jest.fn()
}));

jest.mock('../../validators/socialSentimentValidator', () => ({
  validateSocialSentiment: jest.fn(),
  fetchRedditPostsForValidation: jest.fn()
}));

jest.mock('../../validators/onChainValidator', () => ({
  validateOnChainData: jest.fn()
}));

// Mock confidence calculator
jest.mock('../confidenceScoreCalculator', () => ({
  calculateVeritasConfidenceScore: jest.fn()
}));

// Mock data quality summary
jest.mock('../dataQualitySummary', () => ({
  generateDataQualitySummary: jest.fn()
}));

// Mock source reliability tracker
jest.mock('../sourceReliabilityTracker', () => ({
  getSourceReliabilityTracker: jest.fn()
}));

// Import mocked functions
import { validateMarketData } from '../../validators/marketDataValidator';
import { validateSocialSentiment, fetchRedditPostsForValidation } from '../../validators/socialSentimentValidator';
import { validateOnChainData } from '../../validators/onChainValidator';
import { calculateVeritasConfidenceScore } from '../confidenceScoreCalculator';
import { generateDataQualitySummary } from '../dataQualitySummary';
import { getSourceReliabilityTracker } from '../sourceReliabilityTracker';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create mock validation result
 */
function createMockValidationResult(
  confidence: number,
  severity: 'info' | 'warning' | 'error' | 'fatal' = 'info'
): VeritasValidationResult {
  return {
    isValid: severity !== 'fatal',
    confidence,
    alerts: severity === 'fatal' ? [{
      severity: 'fatal',
      message: 'Fatal error detected',
      source: 'test',
      timestamp: new Date().toISOString(),
      requiresHumanReview: true
    }] : [],
    discrepancies: [],
    dataQuality: {
      score: confidence,
      breakdown: {
        market: confidence,
        social: confidence,
        onChain: confidence,
        news: confidence
      },
      passedChecks: ['test'],
      failedChecks: []
    }
  };
}

/**
 * Create mock confidence score breakdown
 */
function createMockConfidenceScore(overallScore: number) {
  return {
    overallScore,
    dataSourceAgreement: overallScore,
    logicalConsistency: overallScore,
    crossValidationSuccess: overallScore,
    completeness: overallScore,
    breakdown: {
      market: overallScore,
      social: overallScore,
      onChain: overallScore,
      news: overallScore
    },
    confidenceLevel: overallScore >= 80 ? 'high' : overallScore >= 60 ? 'medium' : 'low',
    explanation: 'Mock confidence score'
  };
}

/**
 * Create mock data quality summary
 */
function createMockDataQualitySummary(overallScore: number) {
  return {
    overallScore,
    totalAlerts: 0,
    criticalAlerts: 0,
    totalDiscrepancies: 0,
    recommendations: [],
    reliabilityGuidance: {
      canProceedWithAnalysis: overallScore >= 60,
      strengths: ['Mock strength'],
      weaknesses: []
    },
    validationDuration: 100
  };
}

/**
 * Create mock source reliability tracker
 */
function createMockReliabilityTracker() {
  return {
    getTrustWeight: jest.fn().mockReturnValue(1.0),
    updateReliability: jest.fn(),
    getUnreliableSources: jest.fn().mockReturnValue([])
  };
}

/**
 * Create test validation input
 */
function createTestInput(): ValidationInput {
  return {
    symbol: 'BTC',
    marketData: { price: 95000, volume: 1000000000 },
    socialData: {
      lunarCrush: { sentiment: 75, mentions: 1000 },
      reddit: { sentiment: 70, posts: 10 }
    },
    onChainData: { transactions: 100, volume: 500000000 }
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Validation Orchestrator', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (getSourceReliabilityTracker as jest.Mock).mockResolvedValue(createMockReliabilityTracker());
    (fetchRedditPostsForValidation as jest.Mock).mockResolvedValue({ sentiment: 70, posts: 10 });
    (calculateVeritasConfidenceScore as jest.Mock).mockReturnValue(createMockConfidenceScore(85));
    (generateDataQualitySummary as jest.Mock).mockReturnValue(createMockDataQualitySummary(85));
  });
  
  // ==========================================================================
  // Test 1: Sequential Execution
  // ==========================================================================
  
  describe('Sequential Execution', () => {
    it('should execute validators in correct order: Market → Social → On-Chain → News', async () => {
      // Arrange
      const executionOrder: ValidationStep[] = [];
      
      (validateMarketData as jest.Mock).mockImplementation(async () => {
        executionOrder.push('market');
        return createMockValidationResult(90);
      });
      
      (validateSocialSentiment as jest.Mock).mockImplementation(async () => {
        executionOrder.push('social');
        return createMockValidationResult(85);
      });
      
      (validateOnChainData as jest.Mock).mockImplementation(async () => {
        executionOrder.push('onchain');
        return createMockValidationResult(80);
      });
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(executionOrder).toEqual(['market', 'social', 'onchain']);
      expect(result.completedSteps).toEqual(['market', 'social', 'onchain', 'news']);
      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
    });
    
    it('should wait for each step to complete before proceeding', async () => {
      // Arrange
      const delays: number[] = [];
      const startTime = Date.now();
      
      (validateMarketData as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        delays.push(Date.now() - startTime);
        return createMockValidationResult(90);
      });
      
      (validateSocialSentiment as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        delays.push(Date.now() - startTime);
        return createMockValidationResult(85);
      });
      
      (validateOnChainData as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        delays.push(Date.now() - startTime);
        return createMockValidationResult(80);
      });
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(delays.length).toBe(3);
      // Each step should start after the previous one completes
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
      expect(result.completed).toBe(true);
    });
    
    it('should track progress correctly through all steps', async () => {
      // Arrange
      const progressUpdates: number[] = [];
      
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input, (state) => {
        progressUpdates.push(state.progress);
      });
      
      // Assert
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(result.progress).toBe(100);
      expect(result.completed).toBe(true);
    });
  });
  
  // ==========================================================================
  // Test 2: Halt on Fatal Error
  // ==========================================================================
  
  describe('Halt on Fatal Error', () => {
    it('should halt validation when market validator returns fatal error', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(
        createMockValidationResult(0, 'fatal')
      );
      
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.completed).toBe(false);
      expect(result.halted).toBe(true);
      expect(result.haltReason).toContain('Fatal error in market data validation');
      expect(result.completedSteps).toEqual(['market']);
      
      // Social and on-chain validators should not be called
      expect(validateSocialSentiment).not.toHaveBeenCalled();
      expect(validateOnChainData).not.toHaveBeenCalled();
    });
    
    it('should halt validation when social validator returns fatal error', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(
        createMockValidationResult(0, 'fatal')
      );
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.completed).toBe(false);
      expect(result.halted).toBe(true);
      expect(result.haltReason).toContain('Fatal error in social sentiment validation');
      expect(result.completedSteps).toEqual(['market', 'social']);
      
      // On-chain validator should not be called
      expect(validateOnChainData).not.toHaveBeenCalled();
    });
    
    it('should halt validation when on-chain validator returns fatal error', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(
        createMockValidationResult(0, 'fatal')
      );
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.completed).toBe(false);
      expect(result.halted).toBe(true);
      expect(result.haltReason).toContain('Fatal error in on-chain data validation');
      expect(result.completedSteps).toEqual(['market', 'social', 'onchain']);
    });
    
    it('should return partial results when halted', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(
        createMockValidationResult(0, 'fatal')
      );
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.results.market).toBeDefined();
      expect(result.results.social).toBeDefined();
      expect(result.results.onChain).toBeUndefined();
      expect(result.results.news).toBeUndefined();
      expect(result.progress).toBe(50); // 2 out of 4 steps completed
    });
  });
  
  // ==========================================================================
  // Test 3: Timeout Protection
  // ==========================================================================
  
  describe('Timeout Protection', () => {
    it('should timeout after 15 seconds and return partial results', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 16000)); // Longer than timeout
        return createMockValidationResult(90);
      });
      
      const input = createTestInput();
      
      // Act
      const startTime = Date.now();
      const result = await orchestrateValidation(input);
      const duration = Date.now() - startTime;
      
      // Assert
      expect(duration).toBeLessThan(16000); // Should timeout before 16 seconds
      expect(result.timedOut).toBe(true);
      expect(result.completed).toBe(false);
      expect(result.haltReason).toContain('timed out');
    });
    
    it('should log timeout events for monitoring', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (validateMarketData as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 16000));
        return createMockValidationResult(90);
      });
      
      const input = createTestInput();
      
      // Act
      await orchestrateValidation(input);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('TIMEOUT')
      );
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should include completed steps in timeout result', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 16000));
        return createMockValidationResult(85);
      });
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.timedOut).toBe(true);
      expect(result.completedSteps).toContain('market');
      expect(result.results.market).toBeDefined();
    });
  });
  
  // ==========================================================================
  // Test 4: Partial Result Handling
  // ==========================================================================
  
  describe('Partial Result Handling', () => {
    it('should continue validation even if one validator throws error', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockRejectedValue(new Error('Market API failed'));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.completed).toBe(true);
      expect(result.completedSteps).toEqual(['market', 'social', 'onchain', 'news']);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].step).toBe('market');
      expect(result.errors[0].error).toContain('Market API failed');
    });
    
    it('should track errors for each failed validator', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockRejectedValue(new Error('Market error'));
      (validateSocialSentiment as jest.Mock).mockRejectedValue(new Error('Social error'));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].step).toBe('market');
      expect(result.errors[1].step).toBe('social');
    });
    
    it('should still calculate confidence score with partial results', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockRejectedValue(new Error('Market error'));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.confidenceScore).toBeDefined();
      expect(calculateVeritasConfidenceScore).toHaveBeenCalled();
    });
  });
  
  // ==========================================================================
  // Test 5: Progress Tracking
  // ==========================================================================
  
  describe('Progress Tracking', () => {
    it('should call progress callback with correct state updates', async () => {
      // Arrange
      const progressStates: any[] = [];
      
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      await orchestrateValidation(input, (state) => {
        progressStates.push({ ...state });
      });
      
      // Assert
      expect(progressStates.length).toBeGreaterThan(0);
      
      // First state should be validating
      expect(progressStates[0].isValidating).toBe(true);
      expect(progressStates[0].isComplete).toBe(false);
      
      // Last state should be complete
      const lastState = progressStates[progressStates.length - 1];
      expect(lastState.isValidating).toBe(false);
      expect(lastState.isComplete).toBe(true);
      expect(lastState.progress).toBe(100);
    });
    
    it('should update current step in progress callback', async () => {
      // Arrange
      const steps: (string | null)[] = [];
      
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      await orchestrateValidation(input, (state) => {
        steps.push(state.currentStep);
      });
      
      // Assert
      expect(steps).toContain('market');
      expect(steps).toContain('social');
      expect(steps).toContain('onchain');
    });
  });
  
  // ==========================================================================
  // Test 6: Result Aggregation
  // ==========================================================================
  
  describe('Result Aggregation', () => {
    it('should aggregate all validation results', async () => {
      // Arrange
      const marketResult = createMockValidationResult(90);
      const socialResult = createMockValidationResult(85);
      const onChainResult = createMockValidationResult(80);
      
      (validateMarketData as jest.Mock).mockResolvedValue(marketResult);
      (validateSocialSentiment as jest.Mock).mockResolvedValue(socialResult);
      (validateOnChainData as jest.Mock).mockResolvedValue(onChainResult);
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.results.market).toEqual(marketResult);
      expect(result.results.social).toEqual(socialResult);
      expect(result.results.onChain).toEqual(onChainResult);
    });
    
    it('should calculate overall confidence score', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.confidenceScore).toBeDefined();
      expect(result.confidenceScore?.overallScore).toBe(85);
      expect(calculateVeritasConfidenceScore).toHaveBeenCalledWith(
        result.results,
        expect.anything()
      );
    });
    
    it('should generate comprehensive data quality summary', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.dataQualitySummary).toBeDefined();
      expect(result.dataQualitySummary?.overallScore).toBe(85);
      expect(generateDataQualitySummary).toHaveBeenCalledWith(
        result.results,
        expect.any(Number)
      );
    });
    
    it('should include metadata (timestamps, duration)', async () => {
      // Arrange
      (validateMarketData as jest.Mock).mockResolvedValue(createMockValidationResult(90));
      (validateSocialSentiment as jest.Mock).mockResolvedValue(createMockValidationResult(85));
      (validateOnChainData as jest.Mock).mockResolvedValue(createMockValidationResult(80));
      
      const input = createTestInput();
      
      // Act
      const result = await orchestrateValidation(input);
      
      // Assert
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(new Date(result.startTime).getTime()).toBeLessThanOrEqual(
        new Date(result.endTime).getTime()
      );
    });
  });
  
  // ==========================================================================
  // Test 7: Helper Functions
  // ==========================================================================
  
  describe('Helper Functions', () => {
    describe('isSufficientForAnalysis', () => {
      it('should return true for high confidence completed validation', () => {
        const result: OrchestrationResult = {
          success: true,
          completed: true,
          halted: false,
          progress: 100,
          currentStep: null,
          completedSteps: ['market', 'social', 'onchain', 'news'],
          results: {},
          confidenceScore: createMockConfidenceScore(85),
          dataQualitySummary: createMockDataQualitySummary(85),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
          timedOut: false,
          errors: []
        };
        
        expect(isSufficientForAnalysis(result)).toBe(true);
      });
      
      it('should return false for incomplete validation', () => {
        const result: OrchestrationResult = {
          success: false,
          completed: false,
          halted: true,
          haltReason: 'Fatal error',
          progress: 50,
          currentStep: null,
          completedSteps: ['market'],
          results: {},
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
          timedOut: false,
          errors: []
        };
        
        expect(isSufficientForAnalysis(result)).toBe(false);
      });
      
      it('should return false for low confidence validation', () => {
        const result: OrchestrationResult = {
          success: true,
          completed: true,
          halted: false,
          progress: 100,
          currentStep: null,
          completedSteps: ['market', 'social', 'onchain', 'news'],
          results: {},
          confidenceScore: createMockConfidenceScore(45),
          dataQualitySummary: createMockDataQualitySummary(45),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
          timedOut: false,
          errors: []
        };
        
        expect(isSufficientForAnalysis(result)).toBe(false);
      });
      
      it('should respect custom minimum confidence threshold', () => {
        const result: OrchestrationResult = {
          success: true,
          completed: true,
          halted: false,
          progress: 100,
          currentStep: null,
          completedSteps: ['market', 'social', 'onchain', 'news'],
          results: {},
          confidenceScore: createMockConfidenceScore(70),
          dataQualitySummary: createMockDataQualitySummary(70),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
          timedOut: false,
          errors: []
        };
        
        expect(isSufficientForAnalysis(result, 60)).toBe(true);
        expect(isSufficientForAnalysis(result, 80)).toBe(false);
      });
    });
    
    describe('getStatusMessage', () => {
      it('should return timeout message for timed out validation', () => {
        const result: OrchestrationResult = {
          success: false,
          completed: false,
          halted: false,
          progress: 50,
          currentStep: null,
          completedSteps: ['market'],
          results: {},
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 15000,
          timedOut: true,
          errors: []
        };
        
        const message = getStatusMessage(result);
        expect(message).toContain('timed out');
        expect(message).toContain('50%');
      });
      
      it('should return halt message for halted validation', () => {
        const result: OrchestrationResult = {
          success: false,
          completed: false,
          halted: true,
          haltReason: 'Fatal error in market data',
          progress: 25,
          currentStep: null,
          completedSteps: ['market'],
          results: {},
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
          timedOut: false,
          errors: []
        };
        
        const message = getStatusMessage(result);
        expect(message).toContain('halted');
        expect(message).toContain('Fatal error in market data');
      });
      
      it('should return confidence-based message for completed validation', () => {
        const result: OrchestrationResult = {
          success: true,
          completed: true,
          halted: false,
          progress: 100,
          currentStep: null,
          completedSteps: ['market', 'social', 'onchain', 'news'],
          results: {},
          confidenceScore: createMockConfidenceScore(92),
          dataQualitySummary: createMockDataQualitySummary(92),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 1000,
          timedOut: false,
          errors: []
        };
        
        const message = getStatusMessage(result);
        expect(message).toContain('excellent confidence');
        expect(message).toContain('92%');
      });
    });
  });
});
