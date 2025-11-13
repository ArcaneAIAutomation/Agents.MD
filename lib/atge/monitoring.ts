/**
 * ATGE Monitoring Utilities
 * 
 * Provides functions for error logging, performance tracking, and user feedback collection
 */

import { query } from '../db';

// ============================================================================
// Error Logging
// ============================================================================

export interface ErrorLog {
  errorType: 'api' | 'database' | 'generation' | 'backtesting' | 'analysis' | 'frontend';
  errorMessage: string;
  errorStack?: string;
  userId?: string;
  tradeSignalId?: string;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log an error to the database
 */
export async function logError(error: ErrorLog): Promise<void> {
  try {
    await query(
      `INSERT INTO atge_error_logs (
        error_type,
        error_message,
        error_stack,
        user_id,
        trade_signal_id,
        context,
        severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        error.errorType,
        error.errorMessage,
        error.errorStack || null,
        error.userId || null,
        error.tradeSignalId || null,
        error.context ? JSON.stringify(error.context) : null,
        error.severity || 'medium'
      ]
    );
  } catch (err) {
    // Fallback to console if database logging fails
    console.error('Failed to log error to database:', err);
    console.error('Original error:', error);
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrors(limit: number = 20): Promise<any[]> {
  const result = await query(
    `SELECT * FROM atge_error_logs
     ORDER BY timestamp DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get critical errors (last 24 hours)
 */
export async function getCriticalErrors(): Promise<any[]> {
  const result = await query(
    `SELECT * FROM atge_recent_critical_errors`
  );
  return result.rows;
}

/**
 * Get error count by type
 */
export async function getErrorCountByType(hours: number = 24): Promise<any[]> {
  const result = await query(
    `SELECT 
      error_type,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
      COUNT(*) FILTER (WHERE severity = 'high') as high_count
     FROM atge_error_logs
     WHERE timestamp > NOW() - INTERVAL '${hours} hours'
     GROUP BY error_type
     ORDER BY count DESC`
  );
  return result.rows;
}

// ============================================================================
// Performance Tracking
// ============================================================================

export interface PerformanceMetric {
  metricType: 'api_response' | 'database_query' | 'generation_time' | 'backtest_time' | 'analysis_time';
  metricName: string;
  value: number;
  unit: 'ms' | 'seconds' | 'count';
  userId?: string;
  tradeSignalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Track a performance metric
 */
export async function trackMetric(metric: PerformanceMetric): Promise<void> {
  try {
    await query(
      `INSERT INTO atge_performance_metrics (
        metric_type,
        metric_name,
        value,
        unit,
        user_id,
        trade_signal_id,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        metric.metricType,
        metric.metricName,
        metric.value,
        metric.unit,
        metric.userId || null,
        metric.tradeSignalId || null,
        metric.metadata ? JSON.stringify(metric.metadata) : null
      ]
    );
  } catch (err) {
    // Fallback to console if database tracking fails
    console.error('Failed to track metric:', err);
    console.log('Metric:', metric);
  }
}

/**
 * Get performance summary (last 24 hours)
 */
export async function getPerformanceSummary(): Promise<any[]> {
  const result = await query(
    `SELECT * FROM atge_performance_summary_24h`
  );
  return result.rows;
}

/**
 * Get slow operations (> threshold ms)
 */
export async function getSlowOperations(thresholdMs: number = 5000, limit: number = 20): Promise<any[]> {
  const result = await query(
    `SELECT 
      metric_type,
      metric_name,
      value,
      timestamp,
      metadata
     FROM atge_performance_metrics
     WHERE value > $1
       AND timestamp > NOW() - INTERVAL '24 hours'
     ORDER BY value DESC
     LIMIT $2`,
    [thresholdMs, limit]
  );
  return result.rows;
}

/**
 * Get average response times by endpoint
 */
export async function getAverageResponseTimes(hours: number = 24): Promise<any[]> {
  const result = await query(
    `SELECT 
      metric_name,
      COUNT(*) as requests,
      ROUND(AVG(value)::NUMERIC, 2) as avg_ms,
      ROUND(MIN(value)::NUMERIC, 2) as min_ms,
      ROUND(MAX(value)::NUMERIC, 2) as max_ms,
      ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value)::NUMERIC, 2) as p95_ms,
      ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value)::NUMERIC, 2) as p99_ms
     FROM atge_performance_metrics
     WHERE metric_type = 'api_response'
       AND timestamp > NOW() - INTERVAL '${hours} hours'
     GROUP BY metric_name
     ORDER BY avg_ms DESC`
  );
  return result.rows;
}

// ============================================================================
// User Feedback
// ============================================================================

export interface UserFeedback {
  userId: string;
  feedbackType: 'trade_accuracy' | 'ui_experience' | 'performance' | 'feature_request' | 'bug_report';
  rating?: number; // 1-5
  comment?: string;
  tradeSignalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Submit user feedback
 */
export async function submitFeedback(feedback: UserFeedback): Promise<void> {
  try {
    await query(
      `INSERT INTO atge_user_feedback (
        user_id,
        feedback_type,
        rating,
        comment,
        trade_signal_id,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        feedback.userId,
        feedback.feedbackType,
        feedback.rating || null,
        feedback.comment || null,
        feedback.tradeSignalId || null,
        feedback.metadata ? JSON.stringify(feedback.metadata) : null
      ]
    );
  } catch (err) {
    console.error('Failed to submit feedback:', err);
    throw err;
  }
}

/**
 * Get feedback summary
 */
export async function getFeedbackSummary(): Promise<any[]> {
  const result = await query(
    `SELECT * FROM atge_feedback_summary`
  );
  return result.rows;
}

/**
 * Get recent feedback
 */
export async function getRecentFeedback(limit: number = 20): Promise<any[]> {
  const result = await query(
    `SELECT 
      feedback_type,
      rating,
      comment,
      timestamp,
      trade_signal_id
     FROM atge_user_feedback
     ORDER BY timestamp DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get average rating by feedback type
 */
export async function getAverageRatingByType(days: number = 30): Promise<any[]> {
  const result = await query(
    `SELECT 
      feedback_type,
      ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
      COUNT(*) as total_feedback,
      COUNT(*) FILTER (WHERE rating >= 4) as positive_feedback,
      COUNT(*) FILTER (WHERE rating <= 2) as negative_feedback
     FROM atge_user_feedback
     WHERE timestamp > NOW() - INTERVAL '${days} days'
     GROUP BY feedback_type
     ORDER BY avg_rating DESC`
  );
  return result.rows;
}

// ============================================================================
// System Health
// ============================================================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    errorRate: number;
    avgResponseTime: number;
    activeTradesCount: number;
  };
  timestamp: Date;
}

/**
 * Check system health
 */
export async function checkSystemHealth(): Promise<SystemHealth> {
  const checks = {
    database: false,
    errorRate: 0,
    avgResponseTime: 0,
    activeTradesCount: 0
  };

  try {
    // Check database connection
    await query('SELECT 1');
    checks.database = true;

    // Check error rate (last hour)
    const errorResult = await query(`
      WITH total_requests AS (
        SELECT COUNT(*) as count
        FROM atge_performance_metrics
        WHERE timestamp > NOW() - INTERVAL '1 hour'
          AND metric_type = 'api_response'
      ),
      error_requests AS (
        SELECT COUNT(*) as count
        FROM atge_error_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      )
      SELECT 
        CASE 
          WHEN t.count > 0 THEN (e.count::DECIMAL / t.count) * 100
          ELSE 0
        END as error_rate
      FROM error_requests e, total_requests t
    `);
    checks.errorRate = parseFloat(errorResult.rows[0]?.error_rate || '0');

    // Check average response time
    const perfResult = await query(`
      SELECT AVG(value) as avg_time
      FROM atge_performance_metrics
      WHERE timestamp > NOW() - INTERVAL '1 hour'
        AND metric_type = 'api_response'
    `);
    checks.avgResponseTime = parseFloat(perfResult.rows[0]?.avg_time || '0');

    // Check active trades
    const tradesResult = await query(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE status = 'active'
    `);
    checks.activeTradesCount = parseInt(tradesResult.rows[0]?.count || '0');

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!checks.database || checks.errorRate > 10 || checks.avgResponseTime > 10000) {
      status = 'unhealthy';
    } else if (checks.errorRate > 5 || checks.avgResponseTime > 5000) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      timestamp: new Date()
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Measure execution time of an async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  metricName: string,
  metricType: PerformanceMetric['metricType'] = 'api_response',
  userId?: string,
  tradeSignalId?: string
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let error: any = null;

  try {
    const result = await fn();
    return result;
  } catch (err) {
    success = false;
    error = err;
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    
    // Track metric
    await trackMetric({
      metricType,
      metricName,
      value: duration,
      unit: 'ms',
      userId,
      tradeSignalId,
      metadata: { success, error: error?.message }
    });
  }
}

/**
 * Wrap an API handler with error logging and performance tracking
 */
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  handlerName: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let success = true;
    let error: any = null;

    try {
      const result = await handler(...args);
      return result;
    } catch (err) {
      success = false;
      error = err;
      
      // Log error
      await logError({
        errorType: 'api',
        errorMessage: err.message,
        errorStack: err.stack,
        context: { handler: handlerName },
        severity: 'high'
      });
      
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      // Track performance
      await trackMetric({
        metricType: 'api_response',
        metricName: handlerName,
        value: duration,
        unit: 'ms',
        metadata: { success, error: error?.message }
      });
    }
  }) as T;
}
