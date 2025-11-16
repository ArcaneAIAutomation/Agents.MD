/**
 * Veritas Protocol Type Definitions
 * 
 * Centralized type definitions for the Veritas Protocol validation system.
 */

/**
 * Main validation result interface
 */
export interface VeritasValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  alerts: ValidationAlert[];
  discrepancies: Discrepancy[];
  dataQualitySummary: DataQualitySummary;
  timestamp?: string;
  validationDuration?: number; // milliseconds
}

/**
 * Validation alert interface
 */
export interface ValidationAlert {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  type: 'market' | 'social' | 'onchain' | 'news';
  message: string;
  affectedSources: string[];
  recommendation: string;
  timestamp?: string;
}

/**
 * Data discrepancy interface
 */
export interface Discrepancy {
  metric: string;
  sources: Array<{ name: string; value: any }>;
  variance: number;
  threshold: number;
  exceeded: boolean;
  explanation?: string;
}

/**
 * Data quality summary interface
 */
export interface DataQualitySummary {
  overallScore: number; // 0-100
  marketDataQuality: number;
  socialDataQuality: number;
  onChainDataQuality: number;
  newsDataQuality: number;
  passedChecks: string[];
  failedChecks: string[];
  totalChecks?: number;
  successRate?: number; // percentage
}

/**
 * Confidence score breakdown interface
 */
export interface ConfidenceScoreBreakdown {
  overallScore: number; // 0-100
  dataSourceAgreement: number; // 40% weight
  logicalConsistency: number; // 30% weight
  crossValidationSuccess: number; // 20% weight
  completeness: number; // 10% weight
  breakdown: {
    marketData: number;
    socialSentiment: number;
    onChainData: number;
    newsData: number;
  };
  sourceWeights?: {
    [sourceName: string]: number; // Dynamic trust weights
  };
}

/**
 * Source reliability score interface
 */
export interface SourceReliabilityScore {
  sourceName: string;
  reliabilityScore: number; // 0-100
  totalValidations: number;
  successfulValidations: number;
  deviationCount: number;
  lastUpdated: string;
  trustWeight: number; // 0-1, dynamically adjusted
}

/**
 * Validation options interface
 */
export interface ValidationOptions {
  enableVeritas?: boolean;
  fallbackOnError?: boolean;
  timeout?: number;
  cacheValidation?: boolean;
  cacheTTL?: number;
}

/**
 * Market data validation result
 */
export interface MarketDataValidation {
  priceConsistency: {
    sources: Array<{ name: string; price: number }>;
    variance: number;
    isConsistent: boolean;
    tieBreaker?: { source: string; price: number };
  };
  volumeConsistency: {
    sources: Array<{ name: string; volume: number }>;
    variance: number;
    isConsistent: boolean;
  };
  arbitrageOpportunities: {
    detected: boolean;
    opportunities: Array<{
      buyExchange: string;
      sellExchange: string;
      profitPercent: number;
    }>;
  };
}

/**
 * Social sentiment validation result
 */
export interface SocialSentimentValidation {
  impossibilityDetected: boolean;
  sentimentConsistency: {
    lunarCrushScore: number;
    redditScore: number;
    difference: number;
    isConsistent: boolean;
  };
  mentionCountValid: boolean;
}

/**
 * On-chain data validation result
 */
export interface OnChainValidation {
  marketToChainConsistency: {
    marketVolume: number;
    exchangeFlows: number;
    consistencyScore: number; // 0-100
    isConsistent: boolean;
  };
  impossibilityDetected: boolean;
  flowAnalysis: {
    deposits: number;
    withdrawals: number;
    netFlow: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  };
}

/**
 * Validation state for UI components
 */
export interface VeritasValidationState {
  isValidating: boolean;
  isComplete: boolean;
  currentStep: 'market' | 'social' | 'onchain' | 'news' | 'synthesis' | null;
  progress: number; // 0-100
  results: {
    market?: VeritasValidationResult;
    social?: VeritasValidationResult;
    onChain?: VeritasValidationResult;
    news?: VeritasValidationResult;
  };
  confidenceScore?: ConfidenceScoreBreakdown;
  error?: string;
}

/**
 * Enhanced API response with validation
 */
export interface ValidatedAPIResponse<T> {
  success: boolean;
  data: T;
  veritasValidation?: VeritasValidationResult;
  timestamp: string;
  source: string;
}

/**
 * Validation error types
 */
export type ValidationErrorType =
  | 'timeout'
  | 'api_failure'
  | 'data_source_failure'
  | 'impossibility_detected'
  | 'fatal_error'
  | 'validation_logic_error';

/**
 * Validation error interface
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  source?: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
}

/**
 * Alert notification interface (for human-in-the-loop)
 */
export interface AlertNotification {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  symbol: string;
  alertType: 'market_discrepancy' | 'social_impossibility' | 'onchain_inconsistency' | 'fatal_error';
  message: string;
  details: {
    affectedSources: string[];
    discrepancyValue?: number;
    threshold?: number;
    recommendation: string;
  };
  timestamp: string;
  requiresHumanReview: boolean;
}

/**
 * Veritas configuration interface
 */
export interface VeritasConfig {
  enabled: boolean;
  timeout: number;
  fallbackOnError: boolean;
  cacheValidation: boolean;
  cacheTTL: number;
  features?: {
    market?: boolean;
    social?: boolean;
    onchain?: boolean;
    news?: boolean;
  };
}
