/**
 * Veritas Protocol - Validation Metrics API
 * 
 * Provides access to validation metrics for monitoring and analysis.
 * 
 * Endpoints:
 * - GET /api/ucie/veritas-metrics - Get aggregated metrics
 * - GET /api/ucie/veritas-metrics?symbol=BTC - Get symbol-specific metrics
 * 
 * Requirements: 14.3, 10.1, 14.1
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAggregatedMetrics, getSymbolMetrics } from '../../../lib/ucie/veritas/utils/validationMetrics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { symbol, hours, limit } = req.query;

    // Symbol-specific metrics
    if (symbol && typeof symbol === 'string') {
      const symbolMetrics = await getSymbolMetrics(
        symbol,
        limit ? parseInt(limit as string) : 10
      );

      return res.status(200).json({
        success: true,
        symbol: symbol.toUpperCase(),
        metrics: symbolMetrics,
        count: symbolMetrics.length
      });
    }

    // Aggregated metrics
    const hoursBack = hours ? parseInt(hours as string) : 24;
    const aggregatedMetrics = await getAggregatedMetrics(hoursBack);

    return res.status(200).json({
      success: true,
      period: `Last ${hoursBack} hours`,
      metrics: aggregatedMetrics
    });

  } catch (error: any) {
    console.error('Veritas metrics API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch metrics'
    });
  }
}

