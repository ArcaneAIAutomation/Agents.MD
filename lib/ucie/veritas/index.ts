/**
 * Veritas Protocol - Main Export File
 * 
 * Centralized exports for the Veritas Protocol validation system.
 */

// Feature Flags
export {
  isVeritasEnabled,
  getVeritasConfig,
  isValidationFeatureEnabled,
  logFeatureFlagStatus,
  type VeritasConfig
} from './utils/featureFlags';

// Validation Middleware
export {
  validateWithVeritas,
  safeValidation,
  createValidatedResponse,
  getCachedValidation,
  setCachedValidation,
  clearValidationCache,
  getValidationCacheStats,
  type ValidationOptions
} from './validationMiddleware';

// Validation Orchestrator
export {
  orchestrateValidation,
  isSufficientForAnalysis,
  getStatusMessage,
  type OrchestrationResult,
  type ValidationInput,
  type ValidationStep,
  type ProgressCallback
} from './utils/validationOrchestrator';

// Confidence Score Calculator
export {
  calculateVeritasConfidenceScore,
  getConfidenceLevel,
  isSufficientConfidence,
  getConfidenceRecommendation
} from './utils/confidenceScoreCalculator';

// Data Quality Summary
export {
  generateDataQualitySummary,
  suggestActionForDiscrepancy,
  type EnhancedDataQualitySummary,
  type Recommendation,
  type ReliabilityGuidance
} from './utils/dataQualitySummary';

// Type Definitions
export type {
  VeritasValidationResult,
  ValidationAlert,
  Discrepancy,
  DataQualitySummary,
  ConfidenceScoreBreakdown,
  SourceReliabilityScore,
  MarketDataValidation,
  SocialSentimentValidation,
  OnChainValidation,
  VeritasValidationState,
  ValidatedAPIResponse,
  ValidationError,
  ValidationErrorType,
  AlertNotification
} from './types/validationTypes';
