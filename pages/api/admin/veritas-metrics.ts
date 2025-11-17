/**
 * Veritas Protocol - Metrics API Endpoint
 * 
 * Provides monitoring dashboard data for Veritas validation metrics.
 * 
 * GET /api/admin/veritas-metrics
 * Query params:
 *   - startTime: ISO timestamp (optional, defaults to 24 hours ago)
 *   - endTime: ISO timestamp (optional, defaults to now)
 *   - limit: Number of recent validations to include (optional, defaults to 100)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { veritasMonitoring } from '../../../lib/ucie/veritas/utils/monitoring';
import { evaluateAlertRules, defaultAlertConfig } from '../../../lib/ucie/veritas/utils/alertConfig';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Parse query parameters
    const startTime = req.query.startTime 
      ? new Date(req.query.startTime as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const endTime = req.query.endTime
      ? new Date(req.query.endTime as string)
      : new Date();
    
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;
    
    // Get aggregated metrics
    const aggregatedMetrics = veritasMonitoring.getAggregatedMetrics(startTime, endTime);
    
    // Get recent validations
    const recentValidations = veritasMonitoring.getRecentValidations(limit);
    
    // Evaluate alert rules
    const alertEvaluations = evaluateAlertRules(aggregatedMetrics, defaultAlertConfig);
    const activeAlerts = alertEvaluations.filter(a => a.triggered);
    
    // Calculate health status
    const healthStatus = calculateHealthStatus(aggregatedMetrics, activeAlerts);
    
    // Return metrics dashboard data
    return res.status(200).json({
      success: true,
      data: {
        healthStatus,
        aggregatedMetrics,
        recentValidations,
        activeAlerts: activeAlerts.map(a => ({
          id: a.rule.id,
          name: a.rule.name,
          severity: a.rule.severity,
          message: a.message
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Veritas metrics API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Veritas metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Calculate overall health status based on metrics and alerts
 */
function calculateHealthStatus(
  metrics: any,
  activeAlerts: any[]
): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;
  
  // Check success rate
  if (metrics.successRate < 95) {
    issues.push(`Low success rate: ${metrics.successRate.toFixed(1)}%`);
    score -= 20;
  }
  
  // Check fatal alerts
  const fatalAlertRate = (metrics.totalFatalAlerts / metrics.totalValidations) * 100;
  if (fatalAlertRate > 1) {
    issues.push(`High fatal alert rate: ${fatalAlertRate.toFixed(1)}%`);
    score -= 30;
  }
  
  // Check average duration
  if (metrics.averageDuration > 15000) {
    issues.push(`Slow validation: ${(metrics.averageDuration / 1000).toFixed(1)}s`);
    score -= 10;
  }
  
  // Check confidence score
  if (metrics.averageConfidenceScore < 70) {
    issues.push(`Low confidence: ${metrics.averageConfidenceScore.toFixed(1)}%`);
    score -= 15;
  }
  
  // Check active critical alerts
  const criticalAlerts = activeAlerts.filter(a => a.rule.severity === 'critical');
  if (criticalAlerts.length > 0) {
    issues.push(`${criticalAlerts.length} critical alert(s)`);
    score -= 25;
  }
  
  // Determine status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (score >= 80) {
    status = 'healthy';
  } else if (score >= 50) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  return {
    status,
    score: Math.max(0, score),
    issues
  };
}
