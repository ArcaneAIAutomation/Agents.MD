/**
 * Veritas Protocol - Validation Metrics Logging
 * 
 * Tracks validation attempts, successes, failures, and performance metrics.
 * Provides insights into validation system health and data quality trends.
 * 
 * Requirements: 14.3, 10.1, 14.1
 */

import { query } from '../../../db';
import type { OrchestrationResult } from './validationOrchestrator';
import type { ValidationAlert } from '../types/validationTypes';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Validation metrics for a single validation attempt
 */
export interface ValidationMetrics {
  symbol: string;
  timestamp: string;
  success: boolean;
  completed: boolean;
  halted: boolean;
  timedOut: boolean;
  duration: number; // milliseconds
  confidenceScore?: number;
  dataQualityScore?: number;
  totalAlerts: number;
  criticalAlerts: number;
  errorAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  completedSteps: string[];
  errors: string[];
}

/**
 * Aggregated validation metrics over a time period
 */
export interface AggregatedMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  haltedAttempts: number;
  timedOutAttempts: number;
  averageDuration: number;
  averageConfidenceScore: number;
  averageDataQualityScore: number;
  totalAlerts: number;
  criticalAlerts: number;
  errorAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  mostCommonErrors: Array<{ error: string; count: number }>;
  symbolsValidated: string[];
}

// ============================================================================
// Metrics Logging Functions
// ============================================================================

/**
 * Log validation attempt to database
 * 
 * @param result - Orchestration result
 * @returns Promise<void>
 */
export async function logValidationAttempt(result: OrchestrationResult): Promise<void> {
  try {
    const metrics = extractMetrics(result);
    
    // Store in database
    await query(
      `INSERT INTO veritas_validation_metrics (
        symbol,
        timestamp,
        success,
        completed,
        halted,
        timed_out,
        duration_ms,
        confidence_score,
        data_quality_score,
        total_alerts,
        critical_alerts,
        error_alerts,
        warning_alerts,
        info_alerts,
        completed_steps,
        errors
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        metrics.symbol,
        metrics.timestamp,
        metrics.success,
        metrics.completed,
        metrics.halted,
        metrics.timedOut,
        metrics.duration,
        metrics.confidenceScore,
        metrics.dataQualityScore,
        metrics.totalAlerts,
        metrics.criticalAlerts,
        metrics.errorAlerts,
        metrics.warningAlerts,
        metrics.infoAlerts,
        JSON.stringify(metrics.completedSteps),
        JSON.stringify(metrics.errors)
      ]
    );
    
    console.log(`📊 [Veritas Metrics] Logged validation attempt for ${metrics.symbol}`);
    console.log(`   Success: ${metrics.success}, Duration: ${metrics.duration}ms`);
    console.log(`   Confidence: ${metrics.confidenceScore || 'N/A'}%, Quality: ${metrics.dataQualityScore || 'N/A'}/100`);
    
  } catch (error) {
    // Non-blocking: Don't fail validation if metrics logging fails
    console.error('⚠️ [Veritas Metrics] Failed to log validation attempt:', error);
  }
}

/**
 * Extract metrics from orchestration result
 * 
 * @param result - Orchestration result
 * @returns ValidationMetrics
 */
function extractMetrics(result: OrchestrationResult): ValidationMetrics {
  // Count alerts by severity
  const allAlerts: ValidationAlert[] = [];
  
  Object.values(result.results).forEach(validationResult => {
    if (validationResult?.alerts) {
      allAlerts.push(...validationResult.alerts);
    }
  });
  
  const criticalAlerts = allAlerts.filter(a => a.severity === 'fatal').length;
  const errorAlerts = allAlerts.filter(a => a.severity === 'error').length;
  const warningAlerts = allAlerts.filter(a => a.severity === 'warning').length;
  const infoAlerts = allAlerts.filter(a => a.severity === 'info').length;
  
  return {
    symbol: result.results.market?.dataQuality?.breakdown?.market ? 
      Object.keys(result.results)[0] : 'UNKNOWN',
    timestamp: result.startTime,
    success: result.success,
    completed: result.completed,
    halted: result.halted,
    timedOut: result.timedOut,
    duration: result.duration,
    confidenceScore: result.confidenceScore?.overallScore,
    dataQualityScore: result.dataQualitySummary?.overallScore,
    totalAlerts: allAlerts.length,
    criticalAlerts,
    errorAlerts,
    warningAlerts,
    infoAlerts,
    completedSteps: result.completedSteps,
    errors: result.errors.map(e => e.error)
  };
}

/**
 * Get aggregated metrics for a time period
 * 
 * @param hoursBack - Number of hours to look back (default: 24)
 * @returns Promise<AggregatedMetrics>
 */
export async function getAggregatedMetrics(hoursBack: number = 24): Promise<AggregatedMetrics> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_attempts,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_attempts,
        SUM(CASE WHEN halted THEN 1 ELSE 0 END) as halted_attempts,
        SUM(CASE WHEN timed_out THEN 1 ELSE 0 END) as timed_out_attempts,
        AVG(duration_ms) as avg_duration,
        AVG(confidence_score) as avg_confidence,
        AVG(data_quality_score) as avg_quality,
        SUM(total_alerts) as total_alerts,
        SUM(critical_alerts) as critical_alerts,
        SUM(error_alerts) as error_alerts,
        SUM(warning_alerts) as warning_alerts,
        SUM(info_alerts) as info_alerts,
        ARRAY_AGG(DISTINCT symbol) as symbols
      FROM veritas_validation_metrics
      WHERE timestamp > NOW() - INTERVAL '${hoursBack} hours'`,
      []
    );
    
    const row = result.rows[0];
    
    // Get most common errors
    const errorsResult = await query(
      `SELECT 
        jsonb_array_elements_text(errors) as error,
        COUNT(*) as count
      FROM veritas_validation_metrics
      WHERE timestamp > NOW() - INTERVAL '${hoursBack} hours'
        AND errors IS NOT NULL
        AND jsonb_array_length(errors) > 0
      GROUP BY error
      ORDER BY count DESC
      LIMIT 10`,
      []
    );
    
    return {
      totalAttempts: parseInt(row.total_attempts) || 0,
      successfulAttempts: parseInt(row.successful_attempts) || 0,
      failedAttempts: parseInt(row.failed_attempts) || 0,
      haltedAttempts: parseInt(row.halted_attempts) || 0,
      timedOutAttempts: parseInt(row.timed_out_attempts) || 0,
      averageDuration: Math.round(parseFloat(row.avg_duration) || 0),
      averageConfidenceScore: Math.round(parseFloat(row.avg_confidence) || 0),
      averageDataQualityScore: Math.round(parseFloat(row.avg_quality) || 0),
      totalAlerts: parseInt(row.total_alerts) || 0,
      criticalAlerts: parseInt(row.critical_alerts) || 0,
      errorAlerts: parseInt(row.error_alerts) || 0,
      warningAlerts: parseInt(row.warning_alerts) || 0,
      infoAlerts: parseInt(row.info_alerts) || 0,
      mostCommonErrors: errorsResult.rows.map(r => ({
        error: r.error,
        count: parseInt(r.count)
      })),
      symbolsValidated: row.symbols || []
    };
    
  } catch (error) {
    console.error('⚠️ [Veritas Metrics] Failed to get aggregated metrics:', error);
    
    // Return empty metrics on error
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      haltedAttempts: 0,
      timedOutAttempts: 0,
      averageDuration: 0,
      averageConfidenceScore: 0,
      averageDataQualityScore: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      errorAlerts: 0,
      warningAlerts: 0,
      infoAlerts: 0,
      mostCommonErrors: [],
      symbolsValidated: []
    };
  }
}

/**
 * Get validation metrics for a specific symbol
 * 
 * @param symbol - Token symbol
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise<ValidationMetrics[]>
 */
export async function getSymbolMetrics(
  symbol: string,
  limit: number = 10
): Promise<ValidationMetrics[]> {
  try {
    const result = await query(
      `SELECT *
      FROM veritas_validation_metrics
      WHERE symbol = $1
      ORDER BY timestamp DESC
      LIMIT $2`,
      [symbol.toUpperCase(), limit]
    );
    
    return result.rows.map(row => ({
      symbol: row.symbol,
      timestamp: row.timestamp,
      success: row.success,
      completed: row.completed,
      halted: row.halted,
      timedOut: row.timed_out,
      duration: row.duration_ms,
      confidenceScore: row.confidence_score,
      dataQualityScore: row.data_quality_score,
      totalAlerts: row.total_alerts,
      criticalAlerts: row.critical_alerts,
      errorAlerts: row.error_alerts,
      warningAlerts: row.warning_alerts,
      infoAlerts: row.info_alerts,
      completedSteps: JSON.parse(row.completed_steps || '[]'),
      errors: JSON.parse(row.errors || '[]')
    }));
    
  } catch (error) {
    console.error(`⚠️ [Veritas Metrics] Failed to get metrics for ${symbol}:`, error);
    return [];
  }
}

/**
 * Log validation metrics to console (for monitoring)
 * 
 * @param result - Orchestration result
 */
export function logMetricsToConsole(result: OrchestrationResult): void {
  const metrics = extractMetrics(result);
  
  console.log('\n📊 ========== VERITAS VALIDATION METRICS ==========');
  console.log(`Symbol: ${metrics.symbol}`);
  console.log(`Timestamp: ${metrics.timestamp}`);
  console.log(`Duration: ${metrics.duration}ms`);
  console.log(`Success: ${metrics.success ? '✅' : '❌'}`);
  console.log(`Completed: ${metrics.completed ? '✅' : '❌'}`);
  console.log(`Halted: ${metrics.halted ? '⚠️ Yes' : 'No'}`);
  console.log(`Timed Out: ${metrics.timedOut ? '⏱️ Yes' : 'No'}`);
  console.log(`\nScores:`);
  console.log(`  Confidence: ${metrics.confidenceScore || 'N/A'}%`);
  console.log(`  Data Quality: ${metrics.dataQualityScore || 'N/A'}/100`);
  console.log(`\nAlerts:`);
  console.log(`  Total: ${metrics.totalAlerts}`);
  console.log(`  Critical: ${metrics.criticalAlerts}`);
  console.log(`  Error: ${metrics.errorAlerts}`);
  console.log(`  Warning: ${metrics.warningAlerts}`);
  console.log(`  Info: ${metrics.infoAlerts}`);
  console.log(`\nCompleted Steps: ${metrics.completedSteps.join(', ')}`);
  
  if (metrics.errors.length > 0) {
    console.log(`\nErrors:`);
    metrics.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  console.log('================================================\n');
}

/**
 * Send metrics to external monitoring service (optional)
 * 
 * @param result - Orchestration result
 */
export async function sendMetricsToMonitoring(result: OrchestrationResult): Promise<void> {
  // This is a placeholder for integration with monitoring services
  // Examples: Sentry, Datadog, New Relic, Vercel Analytics, etc.
  
  const metrics = extractMetrics(result);
  
  // Example: Send to Vercel Analytics
  // if (process.env.VERCEL_ANALYTICS_ID) {
  //   await fetch('https://vitals.vercel-analytics.com/v1/vitals', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       dsn: process.env.VERCEL_ANALYTICS_ID,
  //       id: metrics.symbol,
  //       page: '/api/ucie/analyze',
  //       href: `/api/ucie/analyze/${metrics.symbol}`,
  //       event_name: 'veritas-validation',
  //       value: metrics.duration,
  //       speed: 'fast',
  //       rating: metrics.success ? 'good' : 'poor'
  //     })
  //   });
  // }
  
  // Example: Send to Sentry
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureMessage('Veritas Validation Complete', {
  //     level: metrics.success ? 'info' : 'warning',
  //     tags: {
  //       symbol: metrics.symbol,
  //       success: metrics.success,
  //       completed: metrics.completed
  //     },
  //     extra: metrics
  //   });
  // }
  
  console.log(`📡 [Veritas Metrics] Monitoring integration placeholder (implement as needed)`);
}

// ============================================================================
// Database Schema (for reference)
// ============================================================================

/**
 * CREATE TABLE veritas_validation_metrics (
 *   id SERIAL PRIMARY KEY,
 *   symbol VARCHAR(20) NOT NULL,
 *   timestamp TIMESTAMP NOT NULL,
 *   success BOOLEAN NOT NULL,
 *   completed BOOLEAN NOT NULL,
 *   halted BOOLEAN NOT NULL,
 *   timed_out BOOLEAN NOT NULL,
 *   duration_ms INTEGER NOT NULL,
 *   confidence_score INTEGER,
 *   data_quality_score INTEGER,
 *   total_alerts INTEGER NOT NULL DEFAULT 0,
 *   critical_alerts INTEGER NOT NULL DEFAULT 0,
 *   error_alerts INTEGER NOT NULL DEFAULT 0,
 *   warning_alerts INTEGER NOT NULL DEFAULT 0,
 *   info_alerts INTEGER NOT NULL DEFAULT 0,
 *   completed_steps JSONB,
 *   errors JSONB,
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * CREATE INDEX idx_veritas_metrics_symbol ON veritas_validation_metrics(symbol);
 * CREATE INDEX idx_veritas_metrics_timestamp ON veritas_validation_metrics(timestamp);
 * CREATE INDEX idx_veritas_metrics_success ON veritas_validation_metrics(success);
 */

