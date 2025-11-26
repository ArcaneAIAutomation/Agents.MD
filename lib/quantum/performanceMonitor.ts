/**
 * Quantum BTC Performance Monitor
 * 
 * Tracks API response times, database query performance, and error rates
 * Requirements: 14.1-14.10
 */

import { query } from '../db';

// Performance metric types
export interface APIPerformanceMetric {
  apiName: string;
  endpoint: string;
  httpMethod: string;
  responseTimeMs: number;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  errorType?: string;
  requestId?: string;
  userId?: string;
  tradeId?: string;
  requestPayload?: any;
  responseSizeBytes?: number;
  retryCount?: number;
}

export interface DatabasePerformanceMetric {
  queryType: string;
  queryName: string;
  executionTimeMs: number;
  rowsAffected: number;
  success: boolean;
  errorMessage?: string;
}

export interface SystemHealthMetric {
  timestamp: Date;
  cpuUsage?: number;
  memoryUsage?: number;
  activeConnections?: number;
  errorRate: number;
  avgResponseTime: number;
}

/**
 * Performance Monitor Class
 * Singleton pattern for centralized monitoring
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: {
    api: Map<string, APIPerformanceMetric[]>;
    database: Map<string, DatabasePerformanceMetric[]>;
    errors: Map<string, number>;
  };

  private constructor() {
    this.metrics = {
      api: new Map(),
      database: new Map(),
      errors: new Map()
    };
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track API call performance
   * Logs to api_latency_reliability_logs table
   */
  async trackAPICall(metric: APIPerformanceMetric): Promise<void> {
    try {
      // Store in memory for quick access (always)
      const key = `${metric.apiName}:${metric.endpoint}`;
      if (!this.metrics.api.has(key)) {
        this.metrics.api.set(key, []);
      }
      this.metrics.api.get(key)!.push(metric);

      // Keep only last 100 metrics in memory
      if (this.metrics.api.get(key)!.length > 100) {
        this.metrics.api.get(key)!.shift();
      }

      // Track errors
      if (!metric.success) {
        const errorKey = `${metric.apiName}:${metric.errorType || 'UNKNOWN'}`;
        this.metrics.errors.set(errorKey, (this.metrics.errors.get(errorKey) || 0) + 1);
      }

      // Skip database persistence in test environment
      if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
        return;
      }

      // Validate UUID format before database insert
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const requestId = metric.requestId && uuidRegex.test(metric.requestId) ? metric.requestId : null;
      const userId = metric.userId && uuidRegex.test(metric.userId) ? metric.userId : null;
      const tradeId = metric.tradeId && uuidRegex.test(metric.tradeId) ? metric.tradeId : null;

      // Store in database
      await query(
        `INSERT INTO api_latency_reliability_logs (
          api_name,
          endpoint,
          http_method,
          response_time_ms,
          status_code,
          success,
          error_message,
          error_type,
          request_id,
          user_id,
          trade_id,
          request_payload,
          response_size_bytes,
          retry_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          metric.apiName,
          metric.endpoint,
          metric.httpMethod,
          metric.responseTimeMs,
          metric.statusCode,
          metric.success,
          metric.errorMessage || null,
          metric.errorType || null,
          requestId,
          userId,
          tradeId,
          metric.requestPayload ? JSON.stringify(metric.requestPayload) : null,
          metric.responseSizeBytes || null,
          metric.retryCount || 0
        ]
      );
    } catch (error) {
      console.error('Failed to track API call:', error);
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(metric: DatabasePerformanceMetric): void {
    const key = `${metric.queryType}:${metric.queryName}`;
    if (!this.metrics.database.has(key)) {
      this.metrics.database.set(key, []);
    }
    this.metrics.database.get(key)!.push(metric);

    // Keep only last 100 metrics in memory
    if (this.metrics.database.get(key)!.length > 100) {
      this.metrics.database.get(key)!.shift();
    }

    // Track errors
    if (!metric.success) {
      const errorKey = `DB:${metric.queryType}`;
      this.metrics.errors.set(errorKey, (this.metrics.errors.get(errorKey) || 0) + 1);
    }
  }

  /**
   * Get API performance statistics
   */
  async getAPIStats(apiName?: string, hours: number = 24): Promise<any> {
    try {
      const whereClause = apiName ? 'WHERE api_name = $1' : '';
      const params = apiName ? [apiName] : [];
      
      const result = await query(
        `SELECT 
          api_name,
          COUNT(*) as total_calls,
          AVG(response_time_ms) as avg_response_time,
          MIN(response_time_ms) as min_response_time,
          MAX(response_time_ms) as max_response_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_calls,
          SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_calls,
          (SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::float / COUNT(*)::float * 100) as success_rate
        FROM api_latency_reliability_logs
        ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} requested_at >= NOW() - INTERVAL '${hours} hours'
        GROUP BY api_name
        ORDER BY total_calls DESC`,
        params
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get API stats:', error);
      return [];
    }
  }

  /**
   * Get database performance statistics
   */
  getDatabaseStats(): any {
    const stats: any = {};

    this.metrics.database.forEach((metrics, key) => {
      const [queryType, queryName] = key.split(':');
      
      if (!stats[queryType]) {
        stats[queryType] = {};
      }

      const executionTimes = metrics.map(m => m.executionTimeMs);
      const successCount = metrics.filter(m => m.success).length;

      stats[queryType][queryName] = {
        totalQueries: metrics.length,
        avgExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
        minExecutionTime: Math.min(...executionTimes),
        maxExecutionTime: Math.max(...executionTimes),
        successRate: (successCount / metrics.length) * 100,
        totalRowsAffected: metrics.reduce((sum, m) => sum + m.rowsAffected, 0)
      };
    });

    return stats;
  }

  /**
   * Get error rate statistics
   */
  getErrorStats(): any {
    const totalCalls = Array.from(this.metrics.api.values()).reduce((sum, arr) => sum + arr.length, 0);
    const totalErrors = Array.from(this.metrics.errors.values()).reduce((sum, count) => sum + count, 0);

    return {
      totalCalls,
      totalErrors,
      errorRate: totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0,
      errorsByType: Object.fromEntries(this.metrics.errors)
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetric> {
    const apiStats = await this.getAPIStats(undefined, 1); // Last hour
    const errorStats = this.getErrorStats();

    const avgResponseTime = apiStats.length > 0
      ? apiStats.reduce((sum: number, stat: any) => sum + parseFloat(stat.avg_response_time), 0) / apiStats.length
      : 0;

    return {
      timestamp: new Date(),
      errorRate: errorStats.errorRate,
      avgResponseTime,
      activeConnections: undefined, // Would need database connection pool stats
      cpuUsage: undefined, // Would need system metrics
      memoryUsage: undefined // Would need system metrics
    };
  }

  /**
   * Clear old metrics from memory
   */
  clearOldMetrics(): void {
    this.metrics.api.clear();
    this.metrics.database.clear();
    this.metrics.errors.clear();
  }

  /**
   * Get performance summary for dashboard
   */
  async getPerformanceSummary(): Promise<any> {
    const [apiStats, dbStats, errorStats, health] = await Promise.all([
      this.getAPIStats(undefined, 24),
      Promise.resolve(this.getDatabaseStats()),
      Promise.resolve(this.getErrorStats()),
      this.getSystemHealth()
    ]);

    return {
      timestamp: new Date(),
      api: {
        stats: apiStats,
        totalCalls: apiStats.reduce((sum: number, stat: any) => sum + parseInt(stat.total_calls), 0),
        avgResponseTime: apiStats.length > 0
          ? apiStats.reduce((sum: number, stat: any) => sum + parseFloat(stat.avg_response_time), 0) / apiStats.length
          : 0,
        overallSuccessRate: apiStats.length > 0
          ? apiStats.reduce((sum: number, stat: any) => sum + parseFloat(stat.success_rate), 0) / apiStats.length
          : 0
      },
      database: dbStats,
      errors: errorStats,
      health
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Utility function to wrap API calls with performance tracking
 */
export async function trackAPICall<T>(
  apiName: string,
  endpoint: string,
  httpMethod: string,
  apiCall: () => Promise<T>,
  context?: {
    userId?: string;
    tradeId?: string;
    requestPayload?: any;
  }
): Promise<T> {
  const startTime = Date.now();
  
  // Generate UUID - handle test environment
  let requestId: string;
  try {
    requestId = crypto.randomUUID();
  } catch (error) {
    // Fallback for test environments without crypto.randomUUID
    requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  let success = false;
  let statusCode = 0;
  let errorMessage: string | undefined;
  let errorType: string | undefined;
  let result: T;

  try {
    result = await apiCall();
    success = true;
    statusCode = 200;
    return result;
  } catch (error: any) {
    success = false;
    statusCode = error.statusCode || error.status || 500;
    errorMessage = error.message || 'Unknown error';
    errorType = error.name || 'Error';
    throw error;
  } finally {
    const responseTimeMs = Date.now() - startTime;

    await performanceMonitor.trackAPICall({
      apiName,
      endpoint,
      httpMethod,
      responseTimeMs,
      statusCode,
      success,
      errorMessage,
      errorType,
      requestId,
      userId: context?.userId,
      tradeId: context?.tradeId,
      requestPayload: context?.requestPayload
    });
  }
}

/**
 * Utility function to wrap database queries with performance tracking
 */
export function trackDatabaseQuery<T>(
  queryType: string,
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let rowsAffected = 0;
  let errorMessage: string | undefined;

  return queryFn()
    .then((result: any) => {
      success = true;
      rowsAffected = result?.rowCount || result?.rows?.length || 0;
      return result;
    })
    .catch((error: any) => {
      success = false;
      errorMessage = error.message || 'Unknown error';
      throw error;
    })
    .finally(() => {
      const executionTimeMs = Date.now() - startTime;

      performanceMonitor.trackDatabaseQuery({
        queryType,
        queryName,
        executionTimeMs,
        rowsAffected,
        success,
        errorMessage
      });
    });
}
