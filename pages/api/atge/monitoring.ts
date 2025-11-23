import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface MonitoringData {
  timestamp: string;
  cronJobStatus: {
    lastRun: string | null;
    runsToday: number;
    failuresLast24h: number;
    status: 'healthy' | 'warning' | 'error';
  };
  tradeVerification: {
    totalActiveTrades: number;
    verifiedLast24h: number;
    failedVerifications: number;
    averageVerificationTime: number;
    status: 'healthy' | 'warning' | 'error';
  };
  apiCosts: {
    openaiCalls: number;
    estimatedCost: number;
    monthlyProjection: number;
    status: 'healthy' | 'warning' | 'error';
  };
  marketDataAPI: {
    coinMarketCapCalls: number;
    coinGeckoCalls: number;
    failureRate: number;
    status: 'healthy' | 'warning' | 'error';
  };
  systemHealth: {
    databaseConnected: boolean;
    recentErrors: number;
    performanceIssues: number;
    status: 'healthy' | 'warning' | 'error';
  };
  overallStatus: 'healthy' | 'warning' | 'error';
  alerts: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    action: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MonitoringData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cron job status
    const cronJobResult = await query(`
      SELECT 
        MAX(last_verified_at) as last_run,
        COUNT(DISTINCT DATE(last_verified_at)) as runs_today
      FROM trade_results
      WHERE last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const cronFailures = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source = 'failed'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const lastRun = cronJobResult.rows[0]?.last_run || null;
    const runsToday = parseInt(cronJobResult.rows[0]?.runs_today || '0');
    const failuresLast24h = parseInt(cronFailures.rows[0]?.count || '0');
    
    const cronJobStatus = {
      lastRun,
      runsToday,
      failuresLast24h,
      status: (runsToday >= 12 ? 'healthy' : runsToday >= 6 ? 'warning' : 'error') as 'healthy' | 'warning' | 'error'
    };

    // Check trade verification
    const activeTrades = await query(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE status = 'active'
        AND expires_at > NOW()
    `);

    const verifiedTrades = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const failedVerifications = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source = 'failed'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const totalActiveTrades = parseInt(activeTrades.rows[0]?.count || '0');
    const verifiedLast24h = parseInt(verifiedTrades.rows[0]?.count || '0');
    const failedVerificationsCount = parseInt(failedVerifications.rows[0]?.count || '0');
    const averageVerificationTime = 15; // Placeholder

    const tradeVerification = {
      totalActiveTrades,
      verifiedLast24h,
      failedVerifications: failedVerificationsCount,
      averageVerificationTime,
      status: (averageVerificationTime <= 30 ? 'healthy' : 'warning') as 'healthy' | 'warning' | 'error'
    };

    // Estimate API costs
    const tradeGenerations = await query(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);

    // Count AI analyses from trade_signals table
    const analyses = await query(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE ai_analysis IS NOT NULL
        AND ai_analysis_generated_at >= NOW() - INTERVAL '24 hours'
    `);

    const openaiCalls = parseInt(tradeGenerations.rows[0]?.count || '0') + 
                       parseInt(analyses.rows[0]?.count || '0');
    const estimatedCost = (parseInt(tradeGenerations.rows[0]?.count || '0') * 0.01) +
                         (parseInt(analyses.rows[0]?.count || '0') * 0.02);
    const monthlyProjection = estimatedCost * 30;

    const apiCosts = {
      openaiCalls,
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      monthlyProjection: parseFloat(monthlyProjection.toFixed(2)),
      status: (monthlyProjection <= 100 ? 'healthy' : monthlyProjection <= 150 ? 'warning' : 'error') as 'healthy' | 'warning' | 'error'
    };

    // Check market data API
    const coinMarketCapCalls = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source LIKE '%coinmarketcap%'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const coinGeckoCalls = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source LIKE '%coingecko%'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const failedAPICalls = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source = 'failed'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const cmcCalls = parseInt(coinMarketCapCalls.rows[0]?.count || '0');
    const cgCalls = parseInt(coinGeckoCalls.rows[0]?.count || '0');
    const failedCalls = parseInt(failedAPICalls.rows[0]?.count || '0');
    const totalCalls = cmcCalls + cgCalls + failedCalls;
    const failureRate = totalCalls > 0 ? parseFloat(((failedCalls / totalCalls) * 100).toFixed(2)) : 0;

    const marketDataAPI = {
      coinMarketCapCalls: cmcCalls,
      coinGeckoCalls: cgCalls,
      failureRate,
      status: (failureRate <= 5 ? 'healthy' : failureRate <= 10 ? 'warning' : 'error') as 'healthy' | 'warning' | 'error'
    };

    // Check system health
    const databaseConnected = true; // If we got here, DB is connected
    const recentErrors = 0; // Placeholder
    const performanceIssues = 0; // Placeholder

    const systemHealth = {
      databaseConnected,
      recentErrors,
      performanceIssues,
      status: (databaseConnected && recentErrors === 0 ? 'healthy' : 'error') as 'healthy' | 'warning' | 'error'
    };

    // Generate alerts
    const alerts: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      action: string;
    }> = [];

    if (cronJobStatus.status === 'error') {
      alerts.push({
        severity: 'HIGH',
        message: 'Cron job not running hourly',
        action: 'Check Vercel cron configuration'
      });
    }

    if (tradeVerification.status === 'warning') {
      alerts.push({
        severity: 'MEDIUM',
        message: 'Trade verification exceeds 30s target',
        action: 'Optimize verification logic'
      });
    }

    if (apiCosts.status === 'error') {
      alerts.push({
        severity: 'HIGH',
        message: `Monthly cost projection ($${apiCosts.monthlyProjection}) exceeds $100 budget`,
        action: 'Review API usage and optimize calls'
      });
    } else if (apiCosts.status === 'warning') {
      alerts.push({
        severity: 'MEDIUM',
        message: `Monthly cost projection ($${apiCosts.monthlyProjection}) approaching $100 budget`,
        action: 'Monitor API usage closely'
      });
    }

    if (marketDataAPI.status === 'error') {
      alerts.push({
        severity: 'HIGH',
        message: `Market data API failure rate (${marketDataAPI.failureRate}%) is high`,
        action: 'Check API keys and rate limits'
      });
    }

    if (!systemHealth.databaseConnected) {
      alerts.push({
        severity: 'CRITICAL',
        message: 'Database connection failed',
        action: 'Check database credentials and connectivity'
      });
    }

    // Determine overall status
    const statuses = [
      cronJobStatus.status,
      tradeVerification.status,
      apiCosts.status,
      marketDataAPI.status,
      systemHealth.status
    ];

    const overallStatus = statuses.includes('error') ? 'error' :
                         statuses.includes('warning') ? 'warning' : 'healthy';

    const monitoringData: MonitoringData = {
      timestamp: new Date().toISOString(),
      cronJobStatus,
      tradeVerification,
      apiCosts,
      marketDataAPI,
      systemHealth,
      overallStatus,
      alerts
    };

    res.status(200).json(monitoringData);
  } catch (error) {
    console.error('Monitoring endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
}
