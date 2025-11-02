/**
 * UCIE Metrics Endpoint
 * Provides analytics and usage statistics
 * 
 * Returns:
 * - Analysis statistics
 * - Cache performance
 * - API cost summary
 * - Watchlist and alerts counts
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { getAnalysisStats, getApiCostSummary } from '../../../lib/ucie/database';

interface MetricsResponse {
  timestamp: string;
  analysis: {
    total_analyses: number;
    avg_quality_score: number;
    avg_response_time_ms: number;
    unique_symbols: number;
  };
  cache: {
    total_cached: number;
    active_cached: number;
    avg_quality_score: number;
  };
  watchlist: {
    users_with_watchlist: number;
    total_items: number;
    unique_symbols: number;
  };
  alerts: {
    total_alerts: number;
    active_alerts: number;
    users_with_alerts: number;
  };
  costs: {
    total_cost_30d: number;
    cost_by_api: Record<string, number>;
    total_requests: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get analysis statistics
    const analysisStats = await getAnalysisStats();

    // Get cache statistics
    const cacheStats = await query<{
      total_cached: number;
      active_cached: number;
      avg_quality_score: number;
    }>(
      `SELECT 
         COUNT(*) as total_cached,
         COUNT(*) FILTER (WHERE expires_at > NOW()) as active_cached,
         AVG(data_quality_score) as avg_quality_score
       FROM ucie_analysis_cache`
    );

    // Get watchlist statistics
    const watchlistStats = await query<{
      users_with_watchlist: number;
      total_items: number;
      unique_symbols: number;
    }>(
      `SELECT 
         COUNT(DISTINCT user_id) as users_with_watchlist,
         COUNT(*) as total_items,
         COUNT(DISTINCT symbol) as unique_symbols
       FROM ucie_watchlist`
    );

    // Get alert statistics
    const alertStats = await query<{
      total_alerts: number;
      active_alerts: number;
      users_with_alerts: number;
    }>(
      `SELECT 
         COUNT(*) as total_alerts,
         COUNT(*) FILTER (WHERE enabled = TRUE) as active_alerts,
         COUNT(DISTINCT user_id) as users_with_alerts
       FROM ucie_alerts`
    );

    // Get API cost summary
    const costSummary = await getApiCostSummary(30);

    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      analysis: {
        total_analyses: Number(analysisStats.total_analyses) || 0,
        avg_quality_score: Number(analysisStats.avg_quality_score) || 0,
        avg_response_time_ms: Number(analysisStats.avg_response_time_ms) || 0,
        unique_symbols: Number(analysisStats.unique_symbols) || 0,
      },
      cache: {
        total_cached: Number(cacheStats.rows[0]?.total_cached) || 0,
        active_cached: Number(cacheStats.rows[0]?.active_cached) || 0,
        avg_quality_score: Number(cacheStats.rows[0]?.avg_quality_score) || 0,
      },
      watchlist: {
        users_with_watchlist: Number(watchlistStats.rows[0]?.users_with_watchlist) || 0,
        total_items: Number(watchlistStats.rows[0]?.total_items) || 0,
        unique_symbols: Number(watchlistStats.rows[0]?.unique_symbols) || 0,
      },
      alerts: {
        total_alerts: Number(alertStats.rows[0]?.total_alerts) || 0,
        active_alerts: Number(alertStats.rows[0]?.active_alerts) || 0,
        users_with_alerts: Number(alertStats.rows[0]?.users_with_alerts) || 0,
      },
      costs: {
        total_cost_30d: costSummary.total_cost,
        cost_by_api: costSummary.cost_by_api,
        total_requests: costSummary.total_requests,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('[UCIE Metrics Error]:', error);
    return res.status(500).json({
      error: 'Failed to fetch metrics',
    });
  }
}
