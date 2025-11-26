/**
 * Quantum BTC Performance Metrics Endpoint
 * GET /api/quantum/performance-metrics
 * 
 * Returns comprehensive performance metrics including:
 * - API response times
 * - Database query performance
 * - Error rates
 * - System health
 * 
 * Requirements: 14.1-14.10
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { performanceMonitor } from '../../../lib/quantum/performanceMonitor';
import { query } from '../../../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PerformanceMetricsResponse {
  success: boolean;
  timestamp: string;
  metrics: {
    api: {
      totalCalls: number;
      avgResponseTime: number;
      successRate: number;
      byAPI: any[];
    };
    database: {
      totalQueries: number;
      avgExecutionTime: number;
      successRate: number;
      byQueryType: any;
    };
    errors: {
      totalErrors: number;
      errorRate: number;
      byType: Record<string, number>;
    };
    health: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      avgResponseTime: number;
      errorRate: number;
      uptime: number;
    };
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get API performance metrics from database
 */
async function getAPIMetrics(hours: number = 24): Promise<any> {
  try {
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
      WHERE requested_at >= NOW() - INTERVAL '${hours} hours'
      GROUP BY api_name
      ORDER BY total_calls DESC`,
      []
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get API metrics:', error);
    return [];
  }
}

/**
 * Get error statistics from database
 */
async function getErrorMetrics(hours: number = 24): Promise<any> {
  try {
    const result = await query(
      `SELECT 
        error_type,
        COUNT(*) as error_count,
        api_name
      FROM api_latency_reliability_logs
      WHERE requested_at >= NOW() - INTERVAL '${hours} hours'
        AND success = false
      GROUP BY error_type, api_name
      ORDER BY error_count DESC`,
      []
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get error metrics:', error);
    return [];
  }
}

/**
 * Calculate system health status
 */
function calculateHealthStatus(avgResponseTime: number, errorRate: number): 'healthy' | 'degraded' | 'unhealthy' {
  // Healthy: < 1000ms response time, < 5% error rate
  if (avgResponseTime < 1000 && errorRate < 5) {
    return 'healthy';
  }
  
  // Degraded: < 3000ms response time, < 15% error rate
  if (avgResponseTime < 3000 && errorRate < 15) {
    return 'degraded';
  }
  
  // Unhealthy: >= 3000ms response time or >= 15% error rate
  return 'unhealthy';
}

/**
 * Calculate system uptime percentage
 */
async function calculateUptime(hours: number = 24): Promise<number> {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_requests
      FROM api_latency_reliability_logs
      WHERE requested_at >= NOW() - INTERVAL '${hours} hours'`,
      []
    );

    if (result.rows.length === 0 || result.rows[0].total_requests === 0) {
      return 100; // No data = assume healthy
    }

    const totalRequests = parseInt(result.rows[0].total_requests);
    const successfulRequests = parseInt(result.rows[0].successful_requests);

    return (successfulRequests / totalRequests) * 100;
  } catch (error) {
    console.error('Failed to calculate uptime:', error);
    return 0;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetricsResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      timestamp: new Date().toISOString(),
      metrics: {
        api: { totalCalls: 0, avgResponseTime: 0, successRate: 0, byAPI: [] },
        database: { totalQueries: 0, avgExecutionTime: 0, successRate: 0, byQueryType: {} },
        errors: { totalErrors: 0, errorRate: 0, byType: {} },
        health: { status: 'unhealthy', avgResponseTime: 0, errorRate: 0, uptime: 0 }
      }
    } as any);
  }

  try {
    // Get time range from query params (default: 24 hours)
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

    // Fetch all metrics in parallel
    const [apiMetrics, errorMetrics, dbStats, uptime] = await Promise.all([
      getAPIMetrics(hours),
      getErrorMetrics(hours),
      Promise.resolve(performanceMonitor.getDatabaseStats()),
      calculateUptime(hours)
    ]);

    // Calculate aggregate API metrics
    const totalAPICalls = apiMetrics.reduce((sum: number, api: any) => sum + parseInt(api.total_calls), 0);
    const avgAPIResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum: number, api: any) => sum + parseFloat(api.avg_response_time), 0) / apiMetrics.length
      : 0;
    const overallSuccessRate = apiMetrics.length > 0
      ? apiMetrics.reduce((sum: number, api: any) => sum + parseFloat(api.success_rate), 0) / apiMetrics.length
      : 100;

    // Calculate aggregate database metrics
    const dbQueryTypes = Object.keys(dbStats);
    const totalDBQueries = dbQueryTypes.reduce((sum, type) => {
      const queries = Object.values(dbStats[type] as any);
      return sum + queries.reduce((s: number, q: any) => s + q.totalQueries, 0);
    }, 0);
    
    const avgDBExecutionTime = dbQueryTypes.length > 0
      ? dbQueryTypes.reduce((sum, type) => {
          const queries = Object.values(dbStats[type] as any);
          const avgTime = queries.reduce((s: number, q: any) => s + q.avgExecutionTime, 0) / queries.length;
          return sum + avgTime;
        }, 0) / dbQueryTypes.length
      : 0;

    // Calculate error metrics
    const totalErrors = errorMetrics.reduce((sum: number, err: any) => sum + parseInt(err.error_count), 0);
    const errorRate = totalAPICalls > 0 ? (totalErrors / totalAPICalls) * 100 : 0;
    
    const errorsByType: Record<string, number> = {};
    errorMetrics.forEach((err: any) => {
      const key = `${err.api_name}:${err.error_type}`;
      errorsByType[key] = parseInt(err.error_count);
    });

    // Calculate health status
    const healthStatus = calculateHealthStatus(avgAPIResponseTime, errorRate);

    // Construct response
    const response: PerformanceMetricsResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        api: {
          totalCalls: totalAPICalls,
          avgResponseTime: Math.round(avgAPIResponseTime),
          successRate: Math.round(overallSuccessRate * 100) / 100,
          byAPI: apiMetrics.map((api: any) => ({
            name: api.api_name,
            totalCalls: parseInt(api.total_calls),
            avgResponseTime: Math.round(parseFloat(api.avg_response_time)),
            minResponseTime: Math.round(parseFloat(api.min_response_time)),
            maxResponseTime: Math.round(parseFloat(api.max_response_time)),
            p95ResponseTime: Math.round(parseFloat(api.p95_response_time)),
            successRate: Math.round(parseFloat(api.success_rate) * 100) / 100,
            successfulCalls: parseInt(api.successful_calls),
            failedCalls: parseInt(api.failed_calls)
          }))
        },
        database: {
          totalQueries: totalDBQueries,
          avgExecutionTime: Math.round(avgDBExecutionTime),
          successRate: 100, // TODO: Calculate from actual data
          byQueryType: dbStats
        },
        errors: {
          totalErrors,
          errorRate: Math.round(errorRate * 100) / 100,
          byType: errorsByType
        },
        health: {
          status: healthStatus,
          avgResponseTime: Math.round(avgAPIResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
          uptime: Math.round(uptime * 100) / 100
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[Error] Failed to fetch performance metrics:', error);

    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      metrics: {
        api: { totalCalls: 0, avgResponseTime: 0, successRate: 0, byAPI: [] },
        database: { totalQueries: 0, avgExecutionTime: 0, successRate: 0, byQueryType: {} },
        errors: { totalErrors: 0, errorRate: 0, byType: {} },
        health: { status: 'unhealthy', avgResponseTime: 0, errorRate: 0, uptime: 0 }
      }
    } as any);
  }
}
