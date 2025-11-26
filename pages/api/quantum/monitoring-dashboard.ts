/**
 * Monitoring Dashboard API Endpoint
 * 
 * Provides comprehensive system health and performance metrics
 * Requirements: 14.1-14.10
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { performanceMonitor } from '../../../lib/quantum/performanceMonitor';
import { alertingSystem } from '../../../lib/quantum/alerting';
import { apiOptimizer } from '../../../lib/quantum/apiOptimizer';
import { query } from '../../../lib/db';

interface MonitoringDashboard {
  systemHealth: {
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    uptime: number;
    activeConnections: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  performance: {
    avgAPIResponseTime: number;
    avgDatabaseQueryTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
    recentAlerts: any[];
  };
  trades: {
    active: number;
    generated24h: number;
    accuracy: number;
    avgConfidence: number;
  };
  apiReliability: {
    cmc: number;
    coingecko: number;
    kraken: number;
    blockchain: number;
    lunarcrush: number;
  };
  cache: {
    hitRate: number;
    totalEntries: number;
    avgTTL: number;
  };
  rateLimits: Record<string, {
    current: number;
    max: number;
    utilizationPercent: number;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MonitoringDashboard | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Gather all monitoring data in parallel
    const [
      systemHealth,
      performanceMetrics,
      alertStats,
      tradeStats,
      apiReliability,
      cacheStats,
      rateLimitStats,
    ] = await Promise.all([
      getSystemHealth(),
      getPerformanceMetrics(),
      getAlertStats(),
      getTradeStats(),
      getAPIReliability(),
      getCacheStats(),
      getRateLimitStats(),
    ]);

    const dashboard: MonitoringDashboard = {
      systemHealth,
      performance: performanceMetrics,
      alerts: alertStats,
      trades: tradeStats,
      apiReliability,
      cache: cacheStats,
      rateLimits: rateLimitStats,
    };

    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('Error generating monitoring dashboard:', error);
    return res.status(500).json({ error: 'Failed to generate monitoring dashboard' });
  }
}

/**
 * Get system health metrics
 */
async function getSystemHealth() {
  const healthSummary = await performanceMonitor.getSystemHealthSummary();
  
  // Determine overall status
  let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
  
  if (healthSummary.avgCpuUsage > 90 || healthSummary.avgMemoryUsage > 90) {
    status = 'CRITICAL';
  } else if (healthSummary.avgCpuUsage > 70 || healthSummary.avgMemoryUsage > 70) {
    status = 'DEGRADED';
  }

  return {
    status,
    uptime: healthSummary.uptime,
    activeConnections: healthSummary.activeConnections,
    cpuUsage: healthSummary.avgCpuUsage,
    memoryUsage: healthSummary.avgMemoryUsage,
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics() {
  const [avgAPIResponseTime, avgDatabaseQueryTime, errorRate] = await Promise.all([
    performanceMonitor.getAverageAPIResponseTime('', '1h'),
    performanceMonitor.getAverageDatabaseQueryTime(undefined, '1h'),
    performanceMonitor.getErrorRate('1h'),
  ]);

  // Calculate requests per minute
  const result = await query(
    `SELECT COUNT(*) as count
     FROM performance_metrics
     WHERE metric_type = 'api_response'
     AND timestamp > NOW() - INTERVAL '1 minute'`
  );
  const requestsPerMinute = parseInt(result.rows[0]?.count || '0');

  return {
    avgAPIResponseTime: Math.round(avgAPIResponseTime),
    avgDatabaseQueryTime: Math.round(avgDatabaseQueryTime),
    errorRate: parseFloat(errorRate.toFixed(2)),
    requestsPerMinute,
  };
}

/**
 * Get alert statistics
 */
async function getAlertStats() {
  const [criticalAlerts, warningAlerts, infoAlerts, recentAlerts] = await Promise.all([
    alertingSystem.getActiveAlerts('CRITICAL'),
    alertingSystem.getActiveAlerts('WARNING'),
    alertingSystem.getActiveAlerts('INFO'),
    query(
      `SELECT * FROM system_alerts
       ORDER BY triggered_at DESC
       LIMIT 10`
    ),
  ]);

  return {
    critical: criticalAlerts.length,
    warning: warningAlerts.length,
    info: infoAlerts.length,
    recentAlerts: recentAlerts.rows.map(row => ({
      id: row.id,
      severity: row.severity,
      type: row.type,
      title: row.title,
      message: row.message,
      triggeredAt: row.triggered_at,
      resolved: !!row.resolved_at,
    })),
  };
}

/**
 * Get trade statistics
 */
async function getTradeStats() {
  const result = await query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
       COUNT(*) FILTER (WHERE generated_at > NOW() - INTERVAL '24 hours') as generated_24h,
       ROUND(
         (COUNT(*) FILTER (WHERE status = 'HIT')::DECIMAL / 
          NULLIF(COUNT(*) FILTER (WHERE status IN ('HIT', 'NOT_HIT')), 0)) * 100,
         2
       ) as accuracy,
       ROUND(AVG(confidence_score), 2) as avg_confidence
     FROM btc_trades`
  );

  const row = result.rows[0];
  return {
    active: parseInt(row?.active || '0'),
    generated24h: parseInt(row?.generated_24h || '0'),
    accuracy: parseFloat(row?.accuracy || '0'),
    avgConfidence: parseFloat(row?.avg_confidence || '0'),
  };
}

/**
 * Get API reliability metrics
 */
async function getAPIReliability() {
  const result = await query(
    `SELECT 
       api_reliability_cmc,
       api_reliability_coingecko,
       api_reliability_kraken,
       api_reliability_blockchain,
       api_reliability_lunarcrush
     FROM prediction_accuracy_database
     ORDER BY created_at DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    return {
      cmc: 0,
      coingecko: 0,
      kraken: 0,
      blockchain: 0,
      lunarcrush: 0,
    };
  }

  const row = result.rows[0];
  return {
    cmc: parseFloat(row.api_reliability_cmc || '0'),
    coingecko: parseFloat(row.api_reliability_coingecko || '0'),
    kraken: parseFloat(row.api_reliability_kraken || '0'),
    blockchain: parseFloat(row.api_reliability_blockchain || '0'),
    lunarcrush: parseFloat(row.api_reliability_lunarcrush || '0'),
  };
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const stats = apiOptimizer.getCacheStats();
  return {
    hitRate: stats.hitRate,
    totalEntries: stats.totalEntries,
    avgTTL: Math.round(stats.avgTTL / 1000), // Convert to seconds
  };
}

/**
 * Get rate limit statistics
 */
async function getRateLimitStats() {
  const rateLimitStats = apiOptimizer.getRateLimitStats();
  const stats: Record<string, any> = {};

  for (const [provider, data] of rateLimitStats.entries()) {
    stats[provider] = {
      current: data.current,
      max: data.max,
      utilizationPercent: Math.round((data.current / data.max) * 100),
    };
  }

  return stats;
}
