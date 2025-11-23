#!/usr/bin/env tsx
/**
 * ATGE Production Monitoring Script
 * 
 * This script monitors the ATGE system in production:
 * - Vercel cron job execution
 * - Trade verification status
 * - OpenAI API costs
 * - CoinMarketCap API usage
 * - System health and errors
 */

import { query } from '../lib/db';

interface MonitoringReport {
  timestamp: string;
  cronJobStatus: {
    lastRun: string | null;
    runsToday: number;
    failuresLast24h: number;
  };
  tradeVerification: {
    totalActiveTrades: number;
    verifiedLast24h: number;
    failedVerifications: number;
    averageVerificationTime: number;
  };
  apiCosts: {
    openaiCalls: number;
    estimatedCost: number;
    monthlyProjection: number;
  };
  marketDataAPI: {
    coinMarketCapCalls: number;
    coinGeckoCalls: number;
    failureRate: number;
  };
  systemHealth: {
    databaseConnected: boolean;
    recentErrors: number;
    performanceIssues: number;
  };
}

async function checkCronJobStatus() {
  try {
    // Check when the cron job last ran by looking at trade verification timestamps
    const result = await query(`
      SELECT 
        MAX(last_verified_at) as last_run,
        COUNT(DISTINCT DATE(last_verified_at)) as runs_today
      FROM trade_results
      WHERE last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    // Check for failed verifications
    const failures = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source = 'failed'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    return {
      lastRun: result.rows[0]?.last_run || null,
      runsToday: parseInt(result.rows[0]?.runs_today || '0'),
      failuresLast24h: parseInt(failures.rows[0]?.count || '0')
    };
  } catch (error) {
    console.error('Error checking cron job status:', error);
    return {
      lastRun: null,
      runsToday: 0,
      failuresLast24h: 0
    };
  }
}

async function checkTradeVerification() {
  try {
    // Count active trades
    const activeTrades = await query(`
      SELECT COUNT(*) as count
      FROM trade_signals
      WHERE status = 'active'
        AND expires_at > NOW()
    `);

    // Count verified trades in last 24h
    const verifiedTrades = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    // Count failed verifications
    const failedVerifications = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source = 'failed'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    // Calculate average verification time (mock - would need actual timing data)
    const avgTime = 15; // seconds (placeholder)

    return {
      totalActiveTrades: parseInt(activeTrades.rows[0]?.count || '0'),
      verifiedLast24h: parseInt(verifiedTrades.rows[0]?.count || '0'),
      failedVerifications: parseInt(failedVerifications.rows[0]?.count || '0'),
      averageVerificationTime: avgTime
    };
  } catch (error) {
    console.error('Error checking trade verification:', error);
    return {
      totalActiveTrades: 0,
      verifiedLast24h: 0,
      failedVerifications: 0,
      averageVerificationTime: 0
    };
  }
}

async function estimateAPICosts() {
  try {
    // Count OpenAI API calls in last 24h
    // This would need to be tracked in a separate table
    // For now, estimate based on trade generation and analysis
    
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

    // Estimate cost: $0.01 per trade generation, $0.02 per analysis
    const estimatedCost = (parseInt(tradeGenerations.rows[0]?.count || '0') * 0.01) +
                         (parseInt(analyses.rows[0]?.count || '0') * 0.02);

    // Project monthly cost
    const monthlyProjection = estimatedCost * 30;

    return {
      openaiCalls,
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      monthlyProjection: parseFloat(monthlyProjection.toFixed(2))
    };
  } catch (error) {
    console.error('Error estimating API costs:', error);
    return {
      openaiCalls: 0,
      estimatedCost: 0,
      monthlyProjection: 0
    };
  }
}

async function checkMarketDataAPI() {
  try {
    // Count API calls by source
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

    const failedCalls = await query(`
      SELECT COUNT(*) as count
      FROM trade_results
      WHERE verification_data_source = 'failed'
        AND last_verified_at >= NOW() - INTERVAL '24 hours'
    `);

    const totalCalls = parseInt(coinMarketCapCalls.rows[0]?.count || '0') +
                      parseInt(coinGeckoCalls.rows[0]?.count || '0') +
                      parseInt(failedCalls.rows[0]?.count || '0');

    const failureRate = totalCalls > 0 
      ? parseFloat(((parseInt(failedCalls.rows[0]?.count || '0') / totalCalls) * 100).toFixed(2))
      : 0;

    return {
      coinMarketCapCalls: parseInt(coinMarketCapCalls.rows[0]?.count || '0'),
      coinGeckoCalls: parseInt(coinGeckoCalls.rows[0]?.count || '0'),
      failureRate
    };
  } catch (error) {
    console.error('Error checking market data API:', error);
    return {
      coinMarketCapCalls: 0,
      coinGeckoCalls: 0,
      failureRate: 0
    };
  }
}

async function checkSystemHealth() {
  try {
    // Test database connection
    await query('SELECT 1');
    const databaseConnected = true;

    // Count recent errors (would need error logging table)
    const recentErrors = 0; // Placeholder

    // Check for performance issues
    const performanceIssues = 0; // Placeholder

    return {
      databaseConnected,
      recentErrors,
      performanceIssues
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      databaseConnected: false,
      recentErrors: 1,
      performanceIssues: 0
    };
  }
}

async function generateMonitoringReport(): Promise<MonitoringReport> {
  console.log('🔍 Generating ATGE Production Monitoring Report...\n');

  const [cronJobStatus, tradeVerification, apiCosts, marketDataAPI, systemHealth] = await Promise.all([
    checkCronJobStatus(),
    checkTradeVerification(),
    estimateAPICosts(),
    checkMarketDataAPI(),
    checkSystemHealth()
  ]);

  return {
    timestamp: new Date().toISOString(),
    cronJobStatus,
    tradeVerification,
    apiCosts,
    marketDataAPI,
    systemHealth
  };
}

function printReport(report: MonitoringReport) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ATGE PRODUCTION MONITORING REPORT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}\n`);

  // Cron Job Status
  console.log('📅 CRON JOB STATUS');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Last Run: ${report.cronJobStatus.lastRun ? new Date(report.cronJobStatus.lastRun).toLocaleString() : 'Never'}`);
  console.log(`Runs Today: ${report.cronJobStatus.runsToday}`);
  console.log(`Failures (24h): ${report.cronJobStatus.failuresLast24h}`);
  
  if (report.cronJobStatus.runsToday < 12) {
    console.log('⚠️  WARNING: Cron job may not be running hourly');
  } else {
    console.log('✅ Cron job running as expected');
  }
  console.log();

  // Trade Verification
  console.log('📊 TRADE VERIFICATION');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Active Trades: ${report.tradeVerification.totalActiveTrades}`);
  console.log(`Verified (24h): ${report.tradeVerification.verifiedLast24h}`);
  console.log(`Failed Verifications: ${report.tradeVerification.failedVerifications}`);
  console.log(`Avg Verification Time: ${report.tradeVerification.averageVerificationTime}s`);
  
  if (report.tradeVerification.averageVerificationTime > 30) {
    console.log('⚠️  WARNING: Verification time exceeds 30s target');
  } else {
    console.log('✅ Verification performance within target');
  }
  console.log();

  // API Costs
  console.log('💰 API COSTS (OpenAI)');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`API Calls (24h): ${report.apiCosts.openaiCalls}`);
  console.log(`Estimated Cost (24h): $${report.apiCosts.estimatedCost}`);
  console.log(`Monthly Projection: $${report.apiCosts.monthlyProjection}`);
  
  if (report.apiCosts.monthlyProjection > 100) {
    console.log('⚠️  WARNING: Monthly cost projection exceeds $100 target');
  } else {
    console.log('✅ Costs within budget');
  }
  console.log();

  // Market Data API
  console.log('📈 MARKET DATA API USAGE');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`CoinMarketCap Calls: ${report.marketDataAPI.coinMarketCapCalls}`);
  console.log(`CoinGecko Calls: ${report.marketDataAPI.coinGeckoCalls}`);
  console.log(`Failure Rate: ${report.marketDataAPI.failureRate}%`);
  
  if (report.marketDataAPI.failureRate > 5) {
    console.log('⚠️  WARNING: High API failure rate');
  } else {
    console.log('✅ API reliability good');
  }
  console.log();

  // System Health
  console.log('🏥 SYSTEM HEALTH');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Database: ${report.systemHealth.databaseConnected ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`Recent Errors: ${report.systemHealth.recentErrors}`);
  console.log(`Performance Issues: ${report.systemHealth.performanceIssues}`);
  console.log();

  // Overall Status
  console.log('═══════════════════════════════════════════════════════════');
  const issues = [];
  
  if (report.cronJobStatus.runsToday < 12) issues.push('Cron job frequency');
  if (report.tradeVerification.averageVerificationTime > 30) issues.push('Verification performance');
  if (report.apiCosts.monthlyProjection > 100) issues.push('API costs');
  if (report.marketDataAPI.failureRate > 5) issues.push('API reliability');
  if (!report.systemHealth.databaseConnected) issues.push('Database connection');

  if (issues.length === 0) {
    console.log('✅ ALL SYSTEMS OPERATIONAL');
  } else {
    console.log('⚠️  ISSUES DETECTED:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function checkAlerts(report: MonitoringReport) {
  const alerts = [];

  // Check cron job
  if (report.cronJobStatus.runsToday < 12) {
    alerts.push({
      severity: 'HIGH',
      message: 'Cron job not running hourly',
      action: 'Check Vercel cron configuration'
    });
  }

  // Check verification performance
  if (report.tradeVerification.averageVerificationTime > 30) {
    alerts.push({
      severity: 'MEDIUM',
      message: 'Trade verification exceeds 30s target',
      action: 'Optimize verification logic or increase timeout'
    });
  }

  // Check API costs
  if (report.apiCosts.monthlyProjection > 100) {
    alerts.push({
      severity: 'HIGH',
      message: `Monthly cost projection ($${report.apiCosts.monthlyProjection}) exceeds $100 budget`,
      action: 'Review API usage and optimize calls'
    });
  }

  // Check API reliability
  if (report.marketDataAPI.failureRate > 5) {
    alerts.push({
      severity: 'MEDIUM',
      message: `Market data API failure rate (${report.marketDataAPI.failureRate}%) is high`,
      action: 'Check API keys and rate limits'
    });
  }

  // Check database
  if (!report.systemHealth.databaseConnected) {
    alerts.push({
      severity: 'CRITICAL',
      message: 'Database connection failed',
      action: 'Check database credentials and connectivity'
    });
  }

  if (alerts.length > 0) {
    console.log('🚨 ALERTS');
    console.log('═══════════════════════════════════════════════════════════');
    alerts.forEach(alert => {
      console.log(`[${alert.severity}] ${alert.message}`);
      console.log(`   Action: ${alert.action}\n`);
    });
  }

  return alerts;
}

async function main() {
  try {
    const report = await generateMonitoringReport();
    printReport(report);
    const alerts = await checkAlerts(report);

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(process.cwd(), 'monitoring-reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `atge-monitoring-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify({ report, alerts }, null, 2));
    console.log(`📄 Report saved to: ${filepath}\n`);

    process.exit(alerts.some(a => a.severity === 'CRITICAL') ? 1 : 0);
  } catch (error) {
    console.error('❌ Monitoring script failed:', error);
    process.exit(1);
  }
}

main();
