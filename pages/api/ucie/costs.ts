/**
 * UCIE API Cost Tracking Endpoint
 * 
 * Provides cost tracking and analysis for all API services.
 * Includes cost summaries, alerts, and optimization recommendations.
 * 
 * GET /api/ucie/costs?days=30
 * 
 * Response:
 * {
 *   summary: {
 *     totalCost: number,
 *     dailyAverage: number,
 *     projectedMonthly: number
 *   },
 *   breakdown: CostSummary[],
 *   alerts: CostAlert[],
 *   optimizations: CostOptimization[],
 *   timestamp: string
 * }
 * 
 * Requirements: 13.5, 14.2
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCostReport, costTracker } from '../../../lib/ucie/costTracking';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { days = '30', service, format = 'json' } = req.query;
    const daysNum = parseInt(days as string, 10);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 365',
      });
    }

    // Get cost report
    const report = getCostReport(daysNum);

    // Filter by service if specified
    if (service && typeof service === 'string') {
      report.breakdown = report.breakdown.filter(
        (item) => item.serviceName === service
      );
      report.alerts = report.alerts.filter(
        (alert) => alert.serviceName === service
      );
      report.optimizations = report.optimizations.filter(
        (opt) => opt.serviceName === service
      );
    }

    // Handle CSV export
    if (format === 'csv') {
      const csv = costTracker.exportToCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ucie-costs.csv');
      return res.status(200).send(csv);
    }

    // Add timestamp
    const response = {
      ...report,
      period: {
        days: daysNum,
        start: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Set cache headers (cache for 5 minutes)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json(response);
  } catch (error) {
    console.error('Cost tracking error:', error);
    return res.status(500).json({
      error: 'Cost tracking failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
