/**
 * Quantum BTC Monitoring API
 * 
 * Provides system health, performance metrics, and alerts
 * Requirements: 14.1-14.10
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { performanceMonitor } from '../../../lib/quantum/performanceMonitor';
import { alertSystem } from '../../../lib/quantum/alertSystem';
import { apiOptimizer } from '../../../lib/quantum/apiOptimizer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query;

    switch (type) {
      case 'health':
        return handleHealthCheck(req, res);
      
      case 'performance':
        return handlePerformanceMetrics(req, res);
      
      case 'alerts':
        return handleAlerts(req, res);
      
      case 'cache':
        return handleCacheStats(req, res);
      
      case 'summary':
      default:
        return handleSummary(req, res);
    }
  } catch (error: any) {
    console.error('Monitoring API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const health = await performanceMonitor.getSystemHealth();

  return res.status(200).json({
    success: true,
    health: {
      status: health.errorRate < 5 ? 'healthy' : health.errorRate < 20 ? 'degraded' : 'unhealthy',
      timestamp: health.timestamp,
      errorRate: health.errorRate,
      avgResponseTime: health.avgResponseTime,
      activeConnections: health.activeConnections,
      cpuUsage: health.cpuUsage,
      memoryUsage: health.memoryUsage
    }
  });
}

/**
 * Performance metrics endpoint
 */
async function handlePerformanceMetrics(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { apiName, hours } = req.query;
  
  const summary = await performanceMonitor.getPerformanceSummary();
  
  // If specific API requested, get detailed stats
  if (apiName && typeof apiName === 'string') {
    const apiStats = await performanceMonitor.getAPIStats(
      apiName,
      hours ? parseInt(hours as string) : 24
    );
    
    return res.status(200).json({
      success: true,
      api: apiName,
      stats: apiStats,
      summary
    });
  }

  return res.status(200).json({
    success: true,
    summary
  });
}

/**
 * Alerts endpoint
 */
async function handleAlerts(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { severity } = req.query;

  const activeAlerts = severity
    ? alertSystem.getAlertsBySeverity(severity as any)
    : alertSystem.getActiveAlerts();

  const stats = alertSystem.getAlertStats();

  return res.status(200).json({
    success: true,
    alerts: activeAlerts,
    stats
  });
}

/**
 * Cache statistics endpoint
 */
async function handleCacheStats(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cacheStats = apiOptimizer.getCacheStats();

  return res.status(200).json({
    success: true,
    cache: cacheStats
  });
}

/**
 * Summary endpoint - all monitoring data
 */
async function handleSummary(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const [performance, alerts, cache, health] = await Promise.all([
    performanceMonitor.getPerformanceSummary(),
    Promise.resolve(alertSystem.getAlertStats()),
    Promise.resolve(apiOptimizer.getCacheStats()),
    performanceMonitor.getSystemHealth()
  ]);

  return res.status(200).json({
    success: true,
    timestamp: new Date(),
    health: {
      status: health.errorRate < 5 ? 'healthy' : health.errorRate < 20 ? 'degraded' : 'unhealthy',
      errorRate: health.errorRate,
      avgResponseTime: health.avgResponseTime
    },
    performance: {
      api: {
        totalCalls: performance.api.totalCalls,
        avgResponseTime: performance.api.avgResponseTime,
        successRate: performance.api.overallSuccessRate
      },
      database: performance.database,
      errors: performance.errors
    },
    alerts: {
      active: alerts.active,
      bySeverity: alerts.bySeverity
    },
    cache: {
      totalEntries: cache.totalEntries,
      byAPI: cache.byAPI
    }
  });
}
