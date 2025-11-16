/**
 * Veritas Protocol - Data Quality Summary and Recommendation System
 * 
 * Generates comprehensive data quality reports with:
 * - Alert aggregation and deduplication
 * - Discrepancy grouping and analysis
 * - Overall data quality scoring
 * - Data type breakdown (market, social, on-chain, news)
 * - Actionable recommendations
 * - Data reliability guidance
 * 
 * Requirements: 5.1, 5.2, 10.2, 10.4
 */

import type {
  ValidationAlert,
  Discrepancy,
  DataQualitySummary,
  VeritasValidationResult
} from '../types/validationTypes';

/**
 * Enhanced data quality summary with recommendations
 */
export interface EnhancedDataQualitySummary extends DataQualitySummary {
  // Alert analysis
  alertsByType: Record<string, ValidationAlert[]>;
  alertsBySeverity: Record<string, ValidationAlert[]>;
  totalAlerts: number;
  criticalAlerts: number;
  
  // Discrepancy analysis
  discrepanciesByMetric: Record<string, Discrepancy[]>;
  totalDiscrepancies: number;
  exceededThresholds: number;
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Reliability guidance
  reliabilityGuidance: ReliabilityGuidance;
  
  // Metadata
  generatedAt: string;
  validationDuration?: number;
}

/**
 * Actionable recommendation
 */
export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'data_quality' | 'source_reliability' | 'validation_config' | 'action_required';
  title: string;
  description: string;
  action: string;
  affectedSources?: string[];
  relatedAlerts?: string[];
}

/**
 * Data reliability guidance
 */
export interface ReliabilityGuidance {
  overallReliability: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  canProceedWithAnalysis: boolean;
  confidenceLevel: 'high' | 'medium' | 'low' | 'very_low';
  warnings: string[];
  strengths: string[];
  weaknesses: string[];
}

/**
 * Validation results collection
 */
export interface ValidationResultsCollection {
  market?: VeritasValidationResult;
  social?: VeritasValidationResult;
  onChain?: VeritasValidationResult;
  news?: VeritasValidationResult;
}

// ============================================================================
// Alert Processing
// ============================================================================

/**
 * Collect all alerts from validators
 * 
 * @param results Validation results from all validators
 * @returns Array of all alerts
 */
function collectAllAlerts(results: ValidationResultsCollection): ValidationAlert[] {
  const allAlerts: ValidationAlert[] = [];
  
  if (results.market) {
    allAlerts.push(...results.market.alerts);
  }
  
  if (results.social) {
    allAlerts.push(...results.social.alerts);
  }
  
  if (results.onChain) {
    allAlerts.push(...results.onChain.alerts);
  }
  
  if (results.news) {
    allAlerts.push(...results.news.alerts);
  }
  
  return allAlerts;
}

/**
 * Sort alerts by severity (fatal > error > warning > info)
 * 
 * @param alerts Array of alerts to sort
 * @returns Sorted array of alerts
 */
function sortAlertsBySeverity(alerts: ValidationAlert[]): ValidationAlert[] {
  const severityOrder = { fatal: 0, error: 1, warning: 2, info: 3 };
  
  return [...alerts].sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Deduplicate similar alerts
 * 
 * @param alerts Array of alerts to deduplicate
 * @returns Deduplicated array of alerts
 */
function deduplicateAlerts(alerts: ValidationAlert[]): ValidationAlert[] {
  const seen = new Set<string>();
  const deduplicated: ValidationAlert[] = [];
  
  for (const alert of alerts) {
    // Create unique key based on type, severity, and message
    const key = `${alert.type}:${alert.severity}:${alert.message}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(alert);
    }
  }
  
  return deduplicated;
}

/**
 * Group alerts by type
 * 
 * @param alerts Array of alerts to group
 * @returns Alerts grouped by type
 */
function groupAlertsByType(alerts: ValidationAlert[]): Record<string, ValidationAlert[]> {
  const grouped: Record<string, ValidationAlert[]> = {
    market: [],
    social: [],
    onchain: [],
    news: []
  };
  
  for (const alert of alerts) {
    grouped[alert.type].push(alert);
  }
  
  return grouped;
}

/**
 * Group alerts by severity
 * 
 * @param alerts Array of alerts to group
 * @returns Alerts grouped by severity
 */
function groupAlertsBySeverity(alerts: ValidationAlert[]): Record<string, ValidationAlert[]> {
  const grouped: Record<string, ValidationAlert[]> = {
    fatal: [],
    error: [],
    warning: [],
    info: []
  };
  
  for (const alert of alerts) {
    grouped[alert.severity].push(alert);
  }
  
  return grouped;
}

// ============================================================================
// Discrepancy Processing
// ============================================================================

/**
 * Collect all discrepancies from validators
 * 
 * @param results Validation results from all validators
 * @returns Array of all discrepancies
 */
function collectAllDiscrepancies(results: ValidationResultsCollection): Discrepancy[] {
  const allDiscrepancies: Discrepancy[] = [];
  
  if (results.market) {
    allDiscrepancies.push(...results.market.discrepancies);
  }
  
  if (results.social) {
    allDiscrepancies.push(...results.social.discrepancies);
  }
  
  if (results.onChain) {
    allDiscrepancies.push(...results.onChain.discrepancies);
  }
  
  if (results.news) {
    allDiscrepancies.push(...results.news.discrepancies);
  }
  
  return allDiscrepancies;
}

/**
 * Group discrepancies by metric type
 * 
 * @param discrepancies Array of discrepancies to group
 * @returns Discrepancies grouped by metric
 */
function groupDiscrepanciesByMetric(discrepancies: Discrepancy[]): Record<string, Discrepancy[]> {
  const grouped: Record<string, Discrepancy[]> = {};
  
  for (const discrepancy of discrepancies) {
    if (!grouped[discrepancy.metric]) {
      grouped[discrepancy.metric] = [];
    }
    grouped[discrepancy.metric].push(discrepancy);
  }
  
  return grouped;
}

/**
 * Calculate total discrepancy count
 * 
 * @param discrepancies Array of discrepancies
 * @returns Total count of discrepancies
 */
function calculateTotalDiscrepancies(discrepancies: Discrepancy[]): number {
  return discrepancies.length;
}

/**
 * Count discrepancies that exceeded thresholds
 * 
 * @param discrepancies Array of discrepancies
 * @returns Count of exceeded thresholds
 */
function countExceededThresholds(discrepancies: Discrepancy[]): number {
  return discrepancies.filter(d => d.exceeded).length;
}

// ============================================================================
// Data Quality Scoring
// ============================================================================

/**
 * Calculate overall data quality score (0-100)
 * 
 * @param results Validation results from all validators
 * @param alerts All alerts
 * @param discrepancies All discrepancies
 * @returns Overall quality score
 */
function calculateOverallDataQuality(
  results: ValidationResultsCollection,
  alerts: ValidationAlert[],
  discrepancies: Discrepancy[]
): number {
  // Start with 100 points
  let score = 100;
  
  // Penalty for fatal errors: -50 points each
  const fatalErrors = alerts.filter(a => a.severity === 'fatal').length;
  score -= fatalErrors * 50;
  
  // Penalty for errors: -20 points each
  const errors = alerts.filter(a => a.severity === 'error').length;
  score -= errors * 20;
  
  // Penalty for warnings: -10 points each
  const warnings = alerts.filter(a => a.severity === 'warning').length;
  score -= warnings * 10;
  
  // Penalty for exceeded thresholds: -5 points each
  const exceededThresholds = countExceededThresholds(discrepancies);
  score -= exceededThresholds * 5;
  
  // Bonus for data completeness
  const availableDataTypes = Object.keys(results).length;
  const completenessBonus = (availableDataTypes / 4) * 10; // Max 10 points
  score += completenessBonus;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Break down data quality by data type
 * 
 * @param results Validation results from all validators
 * @returns Quality scores by data type
 */
function breakdownDataQualityByType(results: ValidationResultsCollection): {
  marketDataQuality: number;
  socialDataQuality: number;
  onChainDataQuality: number;
  newsDataQuality: number;
} {
  return {
    marketDataQuality: results.market?.dataQualitySummary.marketDataQuality || 0,
    socialDataQuality: results.social?.dataQualitySummary.socialDataQuality || 0,
    onChainDataQuality: results.onChain?.dataQualitySummary.onChainDataQuality || 0,
    newsDataQuality: results.news?.dataQualitySummary.newsDataQuality || 0
  };
}

/**
 * List passed and failed checks
 * 
 * @param results Validation results from all validators
 * @returns Passed and failed checks
 */
function listChecks(results: ValidationResultsCollection): {
  passedChecks: string[];
  failedChecks: string[];
} {
  const passedChecks: string[] = [];
  const failedChecks: string[] = [];
  
  // Collect from all validators
  Object.values(results).forEach(result => {
    if (result) {
      passedChecks.push(...result.dataQualitySummary.passedChecks);
      failedChecks.push(...result.dataQualitySummary.failedChecks);
    }
  });
  
  // Deduplicate
  return {
    passedChecks: [...new Set(passedChecks)],
    failedChecks: [...new Set(failedChecks)]
  };
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * Generate recommendations based on alerts
 * 
 * @param alerts All alerts
 * @param discrepancies All discrepancies
 * @param results Validation results
 * @returns Array of recommendations
 */
function generateRecommendations(
  alerts: ValidationAlert[],
  discrepancies: Discrepancy[],
  results: ValidationResultsCollection
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Fatal error recommendations
  const fatalAlerts = alerts.filter(a => a.severity === 'fatal');
  if (fatalAlerts.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'action_required',
      title: 'Critical Data Quality Issues Detected',
      description: `${fatalAlerts.length} fatal error(s) detected that prevent reliable analysis.`,
      action: 'Review fatal errors immediately. Do not proceed with analysis until resolved.',
      affectedSources: [...new Set(fatalAlerts.flatMap(a => a.affectedSources))],
      relatedAlerts: fatalAlerts.map(a => a.message)
    });
  }
  
  // Price discrepancy recommendations
  const priceDiscrepancies = discrepancies.filter(d => d.metric === 'price' && d.exceeded);
  if (priceDiscrepancies.length > 0) {
    const maxVariance = Math.max(...priceDiscrepancies.map(d => d.variance));
    recommendations.push({
      priority: maxVariance > 0.05 ? 'high' : 'medium',
      category: 'data_quality',
      title: 'Price Discrepancy Detected',
      description: `Price variance of ${(maxVariance * 100).toFixed(2)}% detected across data sources.`,
      action: 'Using weighted average with dynamic trust scores. Consider investigating source reliability.',
      affectedSources: [...new Set(priceDiscrepancies.flatMap(d => d.sources.map(s => s.name)))]
    });
  }
  
  // Volume discrepancy recommendations
  const volumeDiscrepancies = discrepancies.filter(d => d.metric === 'volume_24h' && d.exceeded);
  if (volumeDiscrepancies.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      title: 'Volume Discrepancy Detected',
      description: 'Trading volume varies significantly across data sources.',
      action: 'Using weighted average for final volume. Monitor for data source issues.',
      affectedSources: [...new Set(volumeDiscrepancies.flatMap(d => d.sources.map(s => s.name)))]
    });
  }
  
  // Social sentiment recommendations
  const socialAlerts = alerts.filter(a => a.type === 'social');
  if (socialAlerts.length > 0) {
    const hasFatal = socialAlerts.some(a => a.severity === 'fatal');
    recommendations.push({
      priority: hasFatal ? 'high' : 'medium',
      category: 'data_quality',
      title: 'Social Sentiment Data Issues',
      description: `${socialAlerts.length} issue(s) detected in social sentiment data.`,
      action: hasFatal 
        ? 'Social data discarded due to logical impossibility. Do not use for analysis.'
        : 'Review social sentiment data carefully. Cross-validation shows divergence.',
      affectedSources: [...new Set(socialAlerts.flatMap(a => a.affectedSources))]
    });
  }
  
  // On-chain data recommendations
  const onChainAlerts = alerts.filter(a => a.type === 'onchain');
  if (onChainAlerts.length > 0) {
    const hasFatal = onChainAlerts.some(a => a.severity === 'fatal');
    recommendations.push({
      priority: hasFatal ? 'high' : 'medium',
      category: 'data_quality',
      title: 'On-Chain Data Inconsistency',
      description: `${onChainAlerts.length} issue(s) detected in on-chain data.`,
      action: hasFatal
        ? 'On-chain data unreliable. Cannot make whale accumulation/distribution claims.'
        : 'Use on-chain data with caution. Market-to-chain consistency is low.',
      affectedSources: [...new Set(onChainAlerts.flatMap(a => a.affectedSources))]
    });
  }
  
  // Data completeness recommendations
  const availableDataTypes = Object.keys(results).length;
  if (availableDataTypes < 3) {
    recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      title: 'Incomplete Data Coverage',
      description: `Only ${availableDataTypes} out of 4 data types available.`,
      action: 'Analysis may be limited. Consider waiting for more data sources to become available.',
      affectedSources: []
    });
  }
  
  // Source reliability recommendations
  const unreliableSources = [...new Set(alerts.flatMap(a => a.affectedSources))];
  if (unreliableSources.length >= 2) {
    recommendations.push({
      priority: 'low',
      category: 'source_reliability',
      title: 'Multiple Source Reliability Issues',
      description: `${unreliableSources.length} data sources showing reliability issues.`,
      action: 'Monitor source reliability scores. Consider alternative data sources if issues persist.',
      affectedSources: unreliableSources
    });
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Suggest actions for each discrepancy
 * 
 * @param discrepancy Discrepancy to analyze
 * @returns Suggested action
 */
function suggestActionForDiscrepancy(discrepancy: Discrepancy): string {
  if (!discrepancy.exceeded) {
    return 'No action required - within acceptable threshold';
  }
  
  const variancePercent = (discrepancy.variance * 100).toFixed(2);
  const thresholdPercent = (discrepancy.threshold * 100).toFixed(2);
  
  switch (discrepancy.metric) {
    case 'price':
      if (discrepancy.variance > 0.05) {
        return `Critical price discrepancy (${variancePercent}%). Investigate data sources immediately. Using weighted average with dynamic trust scores.`;
      }
      return `Price variance (${variancePercent}%) exceeds threshold (${thresholdPercent}%). Using weighted average for final price.`;
      
    case 'volume_24h':
      return `Volume variance (${variancePercent}%) exceeds threshold (${thresholdPercent}%). Using weighted average. Monitor for data source issues.`;
      
    case 'sentiment_score':
      return `Sentiment divergence (${variancePercent} points) exceeds threshold (${thresholdPercent} points). Review both sources for context.`;
      
    default:
      return `Discrepancy in ${discrepancy.metric} exceeds threshold. Review affected sources: ${discrepancy.sources.map(s => s.name).join(', ')}`;
  }
}

// ============================================================================
// Reliability Guidance
// ============================================================================

/**
 * Provide guidance on data reliability
 * 
 * @param overallScore Overall data quality score
 * @param alerts All alerts
 * @param results Validation results
 * @returns Reliability guidance
 */
function provideReliabilityGuidance(
  overallScore: number,
  alerts: ValidationAlert[],
  results: ValidationResultsCollection
): ReliabilityGuidance {
  const fatalErrors = alerts.filter(a => a.severity === 'fatal').length;
  const errors = alerts.filter(a => a.severity === 'error').length;
  const warnings = alerts.filter(a => a.severity === 'warning').length;
  
  // Determine overall reliability
  let overallReliability: ReliabilityGuidance['overallReliability'];
  if (overallScore >= 90) {
    overallReliability = 'excellent';
  } else if (overallScore >= 75) {
    overallReliability = 'good';
  } else if (overallScore >= 60) {
    overallReliability = 'fair';
  } else if (overallScore >= 40) {
    overallReliability = 'poor';
  } else {
    overallReliability = 'critical';
  }
  
  // Determine if analysis can proceed
  const canProceedWithAnalysis = fatalErrors === 0 && overallScore >= 60;
  
  // Determine confidence level
  let confidenceLevel: ReliabilityGuidance['confidenceLevel'];
  if (overallScore >= 85 && fatalErrors === 0) {
    confidenceLevel = 'high';
  } else if (overallScore >= 70 && fatalErrors === 0) {
    confidenceLevel = 'medium';
  } else if (overallScore >= 50) {
    confidenceLevel = 'low';
  } else {
    confidenceLevel = 'very_low';
  }
  
  // Generate warnings
  const warningsArray: string[] = [];
  if (fatalErrors > 0) {
    warningsArray.push(`${fatalErrors} fatal error(s) detected - analysis reliability severely compromised`);
  }
  if (errors > 0) {
    warningsArray.push(`${errors} error(s) detected - use analysis with caution`);
  }
  if (warnings > 2) {
    warningsArray.push(`${warnings} warning(s) detected - data quality issues present`);
  }
  if (overallScore < 70) {
    warningsArray.push('Overall data quality below recommended threshold (70%)');
  }
  
  // Identify strengths
  const strengths: string[] = [];
  const { passedChecks } = listChecks(results);
  if (passedChecks.includes('price_consistency')) {
    strengths.push('Price data consistent across sources');
  }
  if (passedChecks.includes('volume_consistency')) {
    strengths.push('Volume data consistent across sources');
  }
  if (passedChecks.includes('sentiment_consistency')) {
    strengths.push('Social sentiment validated across multiple sources');
  }
  if (passedChecks.includes('market_to_chain_consistency')) {
    strengths.push('On-chain data aligns with market activity');
  }
  if (Object.keys(results).length === 4) {
    strengths.push('Complete data coverage across all data types');
  }
  
  // Identify weaknesses
  const weaknesses: string[] = [];
  const { failedChecks } = listChecks(results);
  if (failedChecks.includes('price_consistency')) {
    weaknesses.push('Price discrepancies detected across sources');
  }
  if (failedChecks.includes('volume_consistency')) {
    weaknesses.push('Volume discrepancies detected across sources');
  }
  if (failedChecks.includes('sentiment_consistency')) {
    weaknesses.push('Social sentiment divergence detected');
  }
  if (failedChecks.includes('market_to_chain_consistency')) {
    weaknesses.push('On-chain data inconsistent with market activity');
  }
  if (failedChecks.includes('social_impossibility_check')) {
    weaknesses.push('Social data contains logical impossibilities');
  }
  if (Object.keys(results).length < 3) {
    weaknesses.push('Incomplete data coverage - missing data types');
  }
  
  return {
    overallReliability,
    canProceedWithAnalysis,
    confidenceLevel,
    warnings: warningsArray,
    strengths,
    weaknesses
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Generate comprehensive data quality summary with recommendations
 * 
 * This is the main function that orchestrates all data quality analysis:
 * 1. Collects and processes alerts
 * 2. Collects and analyzes discrepancies
 * 3. Calculates overall data quality score
 * 4. Breaks down quality by data type
 * 5. Generates actionable recommendations
 * 6. Provides reliability guidance
 * 
 * @param results Validation results from all validators
 * @param validationDuration Optional validation duration in milliseconds
 * @returns Enhanced data quality summary with recommendations
 */
export function generateDataQualitySummary(
  results: ValidationResultsCollection,
  validationDuration?: number
): EnhancedDataQualitySummary {
  console.log('📊 Generating data quality summary...');
  
  // ============================================================================
  // STEP 1: Collect and Process Alerts
  // ============================================================================
  
  // Collect all alerts from validators
  let allAlerts = collectAllAlerts(results);
  
  // Sort by severity (fatal, error, warning, info)
  allAlerts = sortAlertsBySeverity(allAlerts);
  
  // Deduplicate similar alerts
  allAlerts = deduplicateAlerts(allAlerts);
  
  // Group alerts
  const alertsByType = groupAlertsByType(allAlerts);
  const alertsBySeverity = groupAlertsBySeverity(allAlerts);
  
  // Count alerts
  const totalAlerts = allAlerts.length;
  const criticalAlerts = alertsBySeverity.fatal.length + alertsBySeverity.error.length;
  
  console.log(`   Total alerts: ${totalAlerts} (${criticalAlerts} critical)`);
  
  // ============================================================================
  // STEP 2: Collect and Analyze Discrepancies
  // ============================================================================
  
  // Collect all discrepancies from validators
  const allDiscrepancies = collectAllDiscrepancies(results);
  
  // Group by metric type
  const discrepanciesByMetric = groupDiscrepanciesByMetric(allDiscrepancies);
  
  // Calculate totals
  const totalDiscrepancies = calculateTotalDiscrepancies(allDiscrepancies);
  const exceededThresholds = countExceededThresholds(allDiscrepancies);
  
  console.log(`   Total discrepancies: ${totalDiscrepancies} (${exceededThresholds} exceeded thresholds)`);
  
  // ============================================================================
  // STEP 3: Calculate Overall Data Quality Score
  // ============================================================================
  
  const overallScore = calculateOverallDataQuality(results, allAlerts, allDiscrepancies);
  
  console.log(`   Overall data quality score: ${overallScore}/100`);
  
  // ============================================================================
  // STEP 4: Break Down by Data Type
  // ============================================================================
  
  const qualityByType = breakdownDataQualityByType(results);
  
  console.log(`   Market: ${qualityByType.marketDataQuality}/100`);
  console.log(`   Social: ${qualityByType.socialDataQuality}/100`);
  console.log(`   On-Chain: ${qualityByType.onChainDataQuality}/100`);
  console.log(`   News: ${qualityByType.newsDataQuality}/100`);
  
  // ============================================================================
  // STEP 5: List Passed and Failed Checks
  // ============================================================================
  
  const { passedChecks, failedChecks } = listChecks(results);
  
  console.log(`   Passed checks: ${passedChecks.length}`);
  console.log(`   Failed checks: ${failedChecks.length}`);
  
  // ============================================================================
  // STEP 6: Generate Recommendations
  // ============================================================================
  
  const recommendations = generateRecommendations(allAlerts, allDiscrepancies, results);
  
  console.log(`   Generated ${recommendations.length} recommendation(s)`);
  
  // ============================================================================
  // STEP 7: Provide Reliability Guidance
  // ============================================================================
  
  const reliabilityGuidance = provideReliabilityGuidance(overallScore, allAlerts, results);
  
  console.log(`   Reliability: ${reliabilityGuidance.overallReliability}`);
  console.log(`   Confidence: ${reliabilityGuidance.confidenceLevel}`);
  console.log(`   Can proceed: ${reliabilityGuidance.canProceedWithAnalysis}`);
  
  // ============================================================================
  // STEP 8: Build Enhanced Summary
  // ============================================================================
  
  const summary: EnhancedDataQualitySummary = {
    // Base data quality summary
    overallScore,
    marketDataQuality: qualityByType.marketDataQuality,
    socialDataQuality: qualityByType.socialDataQuality,
    onChainDataQuality: qualityByType.onChainDataQuality,
    newsDataQuality: qualityByType.newsDataQuality,
    passedChecks,
    failedChecks,
    
    // Alert analysis
    alertsByType,
    alertsBySeverity,
    totalAlerts,
    criticalAlerts,
    
    // Discrepancy analysis
    discrepanciesByMetric,
    totalDiscrepancies,
    exceededThresholds,
    
    // Recommendations
    recommendations,
    
    // Reliability guidance
    reliabilityGuidance,
    
    // Metadata
    generatedAt: new Date().toISOString(),
    validationDuration
  };
  
  console.log('✅ Data quality summary generated successfully');
  
  return summary;
}

/**
 * Export helper function for generating action suggestions
 */
export { suggestActionForDiscrepancy };
