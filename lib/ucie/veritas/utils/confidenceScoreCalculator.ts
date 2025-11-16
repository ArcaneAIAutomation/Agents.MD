/**
 * Veritas Confidence Score Calculator
 * 
 * Calculates overall confidence score based on:
 * - Data source agreement (40%)
 * - Logical consistency (30%)
 * - Cross-validation success (20%)
 * - Completeness (10%)
 * 
 * Includes dynamic trust weighting from source reliability tracker
 */

import { VeritasValidationResult } from '../types/validationTypes';
import { SourceReliabilityTracker } from './sourceReliabilityTracker';

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
  sourceWeights: {
    [sourceName: string]: number; // Dynamic trust weights
  };
  explanation: string;
}

interface ValidationResults {
  market?: VeritasValidationResult;
  social?: VeritasValidationResult;
  onChain?: VeritasValidationResult;
  news?: VeritasValidationResult;
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
}

/**
 * Calculate Veritas Confidence Score with dynamic weighting
 * 
 * @param validationResults - Results from all validators
 * @param reliabilityTracker - Optional source reliability tracker for dynamic weights
 * @returns Detailed confidence score breakdown
 */
export function calculateVeritasConfidenceScore(
  validationResults: ValidationResults,
  reliabilityTracker?: SourceReliabilityTracker
): ConfidenceScoreBreakdown {
  // Extract individual confidence scores from validators
  const scores = {
    marketData: validationResults.market?.confidence || 0,
    socialSentiment: validationResults.social?.confidence || 0,
    onChainData: validationResults.onChain?.confidence || 0,
    newsData: validationResults.news?.confidence || 0
  };
  
  // Get dynamic trust weights from reliability tracker
  const sourceWeights: { [key: string]: number } = {};
  
  if (reliabilityTracker) {
    // Extract all unique source names from validation results
    const allSources = new Set<string>();
    
    Object.values(validationResults).forEach(result => {
      if (result) {
        result.alerts.forEach(alert => {
          alert.affectedSources.forEach(source => allSources.add(source));
        });
        result.discrepancies.forEach(disc => {
          disc.sources.forEach(source => allSources.add(source.name));
        });
      }
    });
    
    // Get trust weight for each source
    allSources.forEach(sourceName => {
      sourceWeights[sourceName] = reliabilityTracker.getTrustWeight(sourceName);
    });
  }
  
  // 1. Calculate Data Source Agreement (40% weight)
  const allScores = Object.values(scores).filter(s => s > 0);
  
  let dataSourceAgreement = 0;
  if (allScores.length > 0) {
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = calculateVariance(allScores);
    
    // High agreement = low variance
    // Convert variance to agreement score (0-100)
    // Variance of 0 = 100% agreement, variance of 2500 (50 point spread) = 0% agreement
    dataSourceAgreement = Math.max(0, 100 - (variance / 25));
  }
  
  // 2. Calculate Logical Consistency (30% weight)
  const fatalErrors = Object.values(validationResults)
    .filter(r => r)
    .flatMap(r => r!.alerts)
    .filter(a => a.severity === 'fatal').length;
  
  // Each fatal error reduces consistency by 50 points
  const logicalConsistency = Math.max(0, 100 - (fatalErrors * 50));
  
  // 3. Calculate Cross-Validation Success (20% weight)
  const totalChecks = Object.values(validationResults)
    .filter(r => r)
    .reduce((sum, r) => {
      return sum + 
        r!.dataQualitySummary.passedChecks.length + 
        r!.dataQualitySummary.failedChecks.length;
    }, 0);
  
  const passedChecks = Object.values(validationResults)
    .filter(r => r)
    .reduce((sum, r) => sum + r!.dataQualitySummary.passedChecks.length, 0);
  
  const crossValidationSuccess = totalChecks > 0 
    ? (passedChecks / totalChecks) * 100 
    : 0;
  
  // 4. Calculate Completeness (10% weight)
  const availableDataSources = Object.values(validationResults).filter(r => r).length;
  const completeness = (availableDataSources / 4) * 100;
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    (dataSourceAgreement * 0.4) +
    (logicalConsistency * 0.3) +
    (crossValidationSuccess * 0.2) +
    (completeness * 0.1)
  );
  
  // Generate explanation
  const explanation = generateExplanation({
    overallScore,
    dataSourceAgreement,
    logicalConsistency,
    crossValidationSuccess,
    completeness,
    fatalErrors,
    totalChecks,
    passedChecks,
    availableDataSources
  });
  
  return {
    overallScore,
    dataSourceAgreement: Math.round(dataSourceAgreement),
    logicalConsistency: Math.round(logicalConsistency),
    crossValidationSuccess: Math.round(crossValidationSuccess),
    completeness: Math.round(completeness),
    breakdown: scores,
    sourceWeights,
    explanation
  };
}

/**
 * Generate human-readable explanation of confidence score
 */
function generateExplanation(params: {
  overallScore: number;
  dataSourceAgreement: number;
  logicalConsistency: number;
  crossValidationSuccess: number;
  completeness: number;
  fatalErrors: number;
  totalChecks: number;
  passedChecks: number;
  availableDataSources: number;
}): string {
  const {
    overallScore,
    dataSourceAgreement,
    logicalConsistency,
    crossValidationSuccess,
    completeness,
    fatalErrors,
    totalChecks,
    passedChecks,
    availableDataSources
  } = params;
  
  const parts: string[] = [];
  
  // Overall assessment
  if (overallScore >= 90) {
    parts.push('Excellent data quality with high confidence.');
  } else if (overallScore >= 80) {
    parts.push('Good data quality with reliable confidence.');
  } else if (overallScore >= 70) {
    parts.push('Acceptable data quality with moderate confidence.');
  } else if (overallScore >= 60) {
    parts.push('Fair data quality with limited confidence.');
  } else {
    parts.push('Poor data quality with low confidence. Use caution.');
  }
  
  // Data source agreement
  if (dataSourceAgreement >= 90) {
    parts.push('Data sources show strong agreement.');
  } else if (dataSourceAgreement >= 70) {
    parts.push('Data sources show moderate agreement.');
  } else {
    parts.push('Data sources show significant disagreement.');
  }
  
  // Logical consistency
  if (fatalErrors > 0) {
    parts.push(`${fatalErrors} fatal error${fatalErrors > 1 ? 's' : ''} detected - data contains logical impossibilities.`);
  } else {
    parts.push('No logical inconsistencies detected.');
  }
  
  // Cross-validation
  if (totalChecks > 0) {
    parts.push(`${passedChecks}/${totalChecks} validation checks passed (${Math.round(crossValidationSuccess)}%).`);
  }
  
  // Completeness
  parts.push(`${availableDataSources}/4 data sources available.`);
  
  return parts.join(' ');
}

/**
 * Get confidence level category
 */
export function getConfidenceLevel(score: number): 'excellent' | 'good' | 'acceptable' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'acceptable';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Determine if confidence score is sufficient for analysis
 */
export function isSufficientConfidence(score: number, minimumThreshold: number = 60): boolean {
  return score >= minimumThreshold;
}

/**
 * Get recommendation based on confidence score
 */
export function getConfidenceRecommendation(score: number): string {
  if (score >= 90) {
    return 'Data quality is excellent. Proceed with high confidence.';
  } else if (score >= 80) {
    return 'Data quality is good. Proceed with confidence.';
  } else if (score >= 70) {
    return 'Data quality is acceptable. Proceed with normal caution.';
  } else if (score >= 60) {
    return 'Data quality is fair. Review discrepancies before making decisions.';
  } else {
    return 'Data quality is poor. Do not make trading decisions based on this analysis.';
  }
}
