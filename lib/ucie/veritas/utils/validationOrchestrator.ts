/**
 * Veritas Protocol - Validation Orchestrator
 * 
 * Orchestrates sequential validation workflow across all validators:
 * Market → Social → On-Chain → News
 * 
 * Features:
 * - Sequential execution with progress tracking
 * - Fatal error handling with halt capability
 * - Timeout protection (15 seconds)
 * - Partial result handling
 * - Real-time progress updates
 * - Comprehensive result aggregation
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 6.1, 8.1
 */

import type {
  VeritasValidationResult,
  ValidationAlert,
  VeritasValidationState
} from '../types/validationTypes';
import { validateMarketData } from '../validators/marketDataValidator';
import { validateSocialSentiment, fetchRedditPostsForValidation } from '../validators/socialSentimentValidator';
import { validateOnChainData } from '../validators/onChainValidator';
import { calculateVeritasConfidenceScore, type ConfidenceScoreBreakdown } from './confidenceScoreCalculator';
import { generateDataQualitySummary, type EnhancedDataQualitySummary } from './dataQualitySummary';
import { getSourceReliabilityTracker } from './sourceReliabilityTracker';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Validation step identifier
 */
export type ValidationStep = 'market' | 'social' | 'onchain' | 'news';

/**
 * Orchestration result with comprehensive validation data
 */
export interface OrchestrationResult {
  // Validation state
  success: boolean;
  completed: boolean;
  halted: boolean;
  haltReason?: string;
  
  // Progress tracking
  progress: number; // 0-100
  currentStep: ValidationStep | null;
  completedSteps: ValidationStep[];
  
  // Validation results
  results: {
    market?: VeritasValidationResult;
    social?: VeritasValidationResult;
    onChain?: VeritasValidationResult;
    news?: VeritasValidationResult;
  };
  
  // Aggregated analysis
  confidenceScore?: ConfidenceScoreBreakdown;
  dataQualitySummary?: EnhancedDataQualitySummary;
  
  // Metadata
  startTime: string;
  endTime: string;
  duration: number; // milliseconds
  timedOut: boolean;
  
  // Error information
  errors: Array<{
    step: ValidationStep;
    error: string;
    timestamp: string;
  }>;
}

/**
 * Input data for validation
 */
export interface ValidationInput {
  symbol: string;
  marketData?: any;
  socialData?: {
    lunarCrush?: any;
    reddit?: any;
  };
  onChainData?: any;
  newsData?: any;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (state: VeritasValidationState) => void;

// ============================================================================
// Constants
// ============================================================================

const VALIDATION_TIMEOUT = 15000; // 15 seconds
const STEP_WEIGHTS = {
  market: 0.25,
  social: 0.25,
  onchain: 0.25,
  news: 0.25
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate progress percentage based on completed steps
 */
function calculateProgress(completedSteps: ValidationStep[]): number {
  let progress = 0;
  
  completedSteps.forEach(step => {
    progress += STEP_WEIGHTS[step] * 100;
  });
  
  return Math.round(progress);
}

/**
 * Check if a fatal error should halt validation
 */
function shouldHaltOnFatalError(result: VeritasValidationResult): boolean {
  // Check for fatal alerts
  const fatalAlerts = result.alerts.filter(a => a.severity === 'fatal');
  
  if (fatalAlerts.length === 0) {
    return false;
  }
  
  // Check if fatal error is unrecoverable
  // For now, we halt on any fatal error
  // In the future, we could add logic to determine if error is recoverable
  return true;
}

/**
 * Create partial result when validation is halted or times out
 */
function createPartialResult(
  startTime: Date,
  completedSteps: ValidationStep[],
  results: OrchestrationResult['results'],
  reason: string,
  timedOut: boolean = false
): OrchestrationResult {
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  return {
    success: false,
    completed: false,
    halted: true,
    haltReason: reason,
    progress: calculateProgress(completedSteps),
    currentStep: null,
    completedSteps,
    results,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration,
    timedOut,
    errors: [{
      step: completedSteps[completedSteps.length - 1] || 'market',
      error: reason,
      timestamp: endTime.toISOString()
    }]
  };
}

/**
 * Log timeout event for monitoring
 */
function logTimeoutEvent(
  symbol: string,
  completedSteps: ValidationStep[],
  duration: number
): void {
  console.error(`⏱️ [Veritas Orchestrator] TIMEOUT after ${duration}ms`);
  console.error(`   Symbol: ${symbol}`);
  console.error(`   Completed steps: ${completedSteps.join(', ')}`);
  console.error(`   Progress: ${calculateProgress(completedSteps)}%`);
  
  // In production, send to monitoring service (e.g., Sentry, Vercel Analytics)
  // analytics.track('veritas_timeout', {
  //   symbol,
  //   completedSteps,
  //   duration,
  //   progress: calculateProgress(completedSteps)
  // });
}

// ============================================================================
// Main Orchestration Function
// ============================================================================

/**
 * Orchestrate validation workflow with sequential execution
 * 
 * Executes validators in order: Market → Social → On-Chain → News
 * - Waits for each step to complete before proceeding
 * - Tracks validation progress (0-100%)
 * - Checks for fatal errors after each step
 * - Halts validation if fatal error cannot be resolved
 * - Returns partial results with error explanation
 * - Aggregates all validation results
 * - Calculates overall confidence score
 * - Generates comprehensive data quality summary
 * - Sets 15-second timeout for entire workflow
 * - Returns partial results if timeout exceeded
 * - Logs timeout events for monitoring
 * 
 * @param input - Validation input data
 * @param onProgress - Optional progress callback for real-time updates
 * @returns Orchestration result with all validation data
 */
export async function orchestrateValidation(
  input: ValidationInput,
  onProgress?: ProgressCallback
): Promise<OrchestrationResult> {
  const startTime = new Date();
  const completedSteps: ValidationStep[] = [];
  const results: OrchestrationResult['results'] = {};
  const errors: OrchestrationResult['errors'] = [];
  
  console.log(`🎯 [Veritas Orchestrator] Starting validation for ${input.symbol}...`);
  console.log(`   Timeout: ${VALIDATION_TIMEOUT}ms`);
  
  // Create timeout promise
  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    setTimeout(() => resolve('timeout'), VALIDATION_TIMEOUT);
  });
  
  // Create validation promise
  const validationPromise = (async () => {
    try {
      // Get source reliability tracker for dynamic weighting
      const reliabilityTracker = await getSourceReliabilityTracker();
      
      // ========================================================================
      // STEP 1: Market Data Validation
      // ========================================================================
      
      console.log(`📊 [Step 1/4] Validating market data...`);
      
      // Update progress
      if (onProgress) {
        onProgress({
          isValidating: true,
          isComplete: false,
          currentStep: 'market',
          progress: 0,
          results: {},
          error: undefined
        });
      }
      
      try {
        const marketResult = await validateMarketData(input.symbol, input.marketData);
        results.market = marketResult;
        completedSteps.push('market');
        
        console.log(`✅ [Step 1/4] Market validation complete (confidence: ${marketResult.confidence}%)`);
        
        // Check for fatal errors
        if (shouldHaltOnFatalError(marketResult)) {
          const haltReason = 'Fatal error in market data validation - cannot proceed';
          console.error(`🛑 [Veritas Orchestrator] ${haltReason}`);
          
          return createPartialResult(
            startTime,
            completedSteps,
            results,
            haltReason
          );
        }
        
        // Update progress
        if (onProgress) {
          onProgress({
            isValidating: true,
            isComplete: false,
            currentStep: 'social',
            progress: calculateProgress(completedSteps),
            results,
            error: undefined
          });
        }
      } catch (error) {
        console.error(`❌ [Step 1/4] Market validation error:`, error);
        errors.push({
          step: 'market',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Continue with other validators even if market fails
        completedSteps.push('market');
      }
      
      // ========================================================================
      // STEP 2: Social Sentiment Validation
      // ========================================================================
      
      console.log(`📱 [Step 2/4] Validating social sentiment...`);
      
      try {
        // Fetch Reddit data if not provided
        let redditMetrics = input.socialData?.reddit;
        if (!redditMetrics) {
          redditMetrics = await fetchRedditPostsForValidation(input.symbol);
        }
        
        const socialResult = await validateSocialSentiment(
          input.symbol,
          input.socialData?.lunarCrush || null,
          redditMetrics
        );
        results.social = socialResult;
        completedSteps.push('social');
        
        console.log(`✅ [Step 2/4] Social validation complete (confidence: ${socialResult.confidence}%)`);
        
        // Check for fatal errors
        if (shouldHaltOnFatalError(socialResult)) {
          const haltReason = 'Fatal error in social sentiment validation - cannot proceed';
          console.error(`🛑 [Veritas Orchestrator] ${haltReason}`);
          
          return createPartialResult(
            startTime,
            completedSteps,
            results,
            haltReason
          );
        }
        
        // Update progress
        if (onProgress) {
          onProgress({
            isValidating: true,
            isComplete: false,
            currentStep: 'onchain',
            progress: calculateProgress(completedSteps),
            results,
            error: undefined
          });
        }
      } catch (error) {
        console.error(`❌ [Step 2/4] Social validation error:`, error);
        errors.push({
          step: 'social',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Continue with other validators
        completedSteps.push('social');
      }
      
      // ========================================================================
      // STEP 3: On-Chain Data Validation
      // ========================================================================
      
      console.log(`⛓️ [Step 3/4] Validating on-chain data...`);
      
      try {
        const onChainResult = await validateOnChainData(
          input.symbol,
          input.marketData,
          input.onChainData
        );
        results.onChain = onChainResult;
        completedSteps.push('onchain');
        
        console.log(`✅ [Step 3/4] On-chain validation complete (confidence: ${onChainResult.confidence}%)`);
        
        // Check for fatal errors
        if (shouldHaltOnFatalError(onChainResult)) {
          const haltReason = 'Fatal error in on-chain data validation - cannot proceed';
          console.error(`🛑 [Veritas Orchestrator] ${haltReason}`);
          
          return createPartialResult(
            startTime,
            completedSteps,
            results,
            haltReason
          );
        }
        
        // Update progress
        if (onProgress) {
          onProgress({
            isValidating: true,
            isComplete: false,
            currentStep: 'news',
            progress: calculateProgress(completedSteps),
            results,
            error: undefined
          });
        }
      } catch (error) {
        console.error(`❌ [Step 3/4] On-chain validation error:`, error);
        errors.push({
          step: 'onchain',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Continue with other validators
        completedSteps.push('onchain');
      }
      
      // ========================================================================
      // STEP 4: News Correlation Validation (Placeholder)
      // ========================================================================
      
      console.log(`📰 [Step 4/4] News validation (placeholder - not yet implemented)`);
      
      // Note: News validator will be implemented in Task 24.5
      // For now, we skip this step
      completedSteps.push('news');
      
      // Update progress
      if (onProgress) {
        onProgress({
          isValidating: true,
          isComplete: false,
          currentStep: 'synthesis',
          progress: calculateProgress(completedSteps),
          results,
          error: undefined
        });
      }
      
      // ========================================================================
      // STEP 5: Aggregate Results and Calculate Scores
      // ========================================================================
      
      console.log(`🔄 [Veritas Orchestrator] Aggregating validation results...`);
      
      // Calculate overall confidence score
      const confidenceScore = calculateVeritasConfidenceScore(results, reliabilityTracker);
      
      console.log(`📊 Overall confidence score: ${confidenceScore.overallScore}%`);
      console.log(`   Data source agreement: ${confidenceScore.dataSourceAgreement}%`);
      console.log(`   Logical consistency: ${confidenceScore.logicalConsistency}%`);
      console.log(`   Cross-validation success: ${confidenceScore.crossValidationSuccess}%`);
      console.log(`   Completeness: ${confidenceScore.completeness}%`);
      
      // Generate comprehensive data quality summary
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const dataQualitySummary = generateDataQualitySummary(results, duration);
      
      console.log(`📋 Data quality summary generated`);
      console.log(`   Overall score: ${dataQualitySummary.overallScore}/100`);
      console.log(`   Total alerts: ${dataQualitySummary.totalAlerts} (${dataQualitySummary.criticalAlerts} critical)`);
      console.log(`   Total discrepancies: ${dataQualitySummary.totalDiscrepancies}`);
      console.log(`   Recommendations: ${dataQualitySummary.recommendations.length}`);
      
      // Update final progress
      if (onProgress) {
        onProgress({
          isValidating: false,
          isComplete: true,
          currentStep: null,
          progress: 100,
          results,
          confidenceScore,
          error: undefined
        });
      }
      
      // ========================================================================
      // STEP 6: Return Complete Result
      // ========================================================================
      
      console.log(`✅ [Veritas Orchestrator] Validation complete in ${duration}ms`);
      
      return {
        success: true,
        completed: true,
        halted: false,
        progress: 100,
        currentStep: null,
        completedSteps,
        results,
        confidenceScore,
        dataQualitySummary,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        timedOut: false,
        errors
      };
      
    } catch (error) {
      console.error(`❌ [Veritas Orchestrator] Unexpected error:`, error);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      return {
        success: false,
        completed: false,
        halted: true,
        haltReason: error instanceof Error ? error.message : 'Unknown error',
        progress: calculateProgress(completedSteps),
        currentStep: null,
        completedSteps,
        results,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        timedOut: false,
        errors: [{
          step: completedSteps[completedSteps.length - 1] || 'market',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: endTime.toISOString()
        }]
      };
    }
  })();
  
  // Race between validation and timeout
  const raceResult = await Promise.race([validationPromise, timeoutPromise]);
  
  // Handle timeout
  if (raceResult === 'timeout') {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error(`⏱️ [Veritas Orchestrator] Validation timed out after ${duration}ms`);
    
    // Log timeout event
    logTimeoutEvent(input.symbol, completedSteps, duration);
    
    // Update progress callback
    if (onProgress) {
      onProgress({
        isValidating: false,
        isComplete: false,
        currentStep: null,
        progress: calculateProgress(completedSteps),
        results,
        error: 'Validation timed out'
      });
    }
    
    // Return partial results
    return createPartialResult(
      startTime,
      completedSteps,
      results,
      `Validation timed out after ${VALIDATION_TIMEOUT}ms. Returning partial results.`,
      true
    );
  }
  
  // Return validation result
  return raceResult;
}

/**
 * Validate if orchestration result is sufficient for analysis
 * 
 * @param result - Orchestration result
 * @param minimumConfidence - Minimum confidence threshold (default: 60)
 * @returns True if result is sufficient for analysis
 */
export function isSufficientForAnalysis(
  result: OrchestrationResult,
  minimumConfidence: number = 60
): boolean {
  // Check if validation completed
  if (!result.completed) {
    return false;
  }
  
  // Check if confidence score meets minimum
  if (!result.confidenceScore || result.confidenceScore.overallScore < minimumConfidence) {
    return false;
  }
  
  // Check if data quality summary indicates analysis can proceed
  if (result.dataQualitySummary && !result.dataQualitySummary.reliabilityGuidance.canProceedWithAnalysis) {
    return false;
  }
  
  return true;
}

/**
 * Get human-readable status message for orchestration result
 * 
 * @param result - Orchestration result
 * @returns Status message
 */
export function getStatusMessage(result: OrchestrationResult): string {
  if (result.timedOut) {
    return `Validation timed out after ${result.duration}ms. Partial results available (${result.progress}% complete).`;
  }
  
  if (result.halted) {
    return `Validation halted: ${result.haltReason}`;
  }
  
  if (!result.completed) {
    return `Validation incomplete (${result.progress}% complete)`;
  }
  
  if (result.confidenceScore) {
    const confidence = result.confidenceScore.overallScore;
    if (confidence >= 90) {
      return `Validation complete with excellent confidence (${confidence}%)`;
    } else if (confidence >= 80) {
      return `Validation complete with good confidence (${confidence}%)`;
    } else if (confidence >= 70) {
      return `Validation complete with acceptable confidence (${confidence}%)`;
    } else if (confidence >= 60) {
      return `Validation complete with fair confidence (${confidence}%)`;
    } else {
      return `Validation complete with poor confidence (${confidence}%). Use caution.`;
    }
  }
  
  return 'Validation complete';
}

/**
 * Export validation step type for external use
 */
export type { ValidationStep };
