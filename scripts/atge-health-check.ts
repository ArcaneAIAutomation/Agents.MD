/**
 * ATGE Health Check Script
 * 
 * Checks the health of the AI Trade Generation Engine system
 * Run this script periodically to monitor system status
 * 
 * Usage: npx tsx scripts/atge-health-check.ts
 */

import { checkSystemHealth } from '../lib/atge/monitoring';

async function runHealthCheck() {
  console.log('🏥 ATGE Health Check');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  try {
    const health = await checkSystemHealth();

    // Display status
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌'
    };

    console.log(`Status: ${statusEmoji[health.status]} ${health.status.toUpperCase()}`);
    console.log('');

    // Display checks
    console.log('System Checks:');
    console.log('  Database Connection:', health.checks.database ? '✅ Connected' : '❌ Disconnected');
    console.log('  Error Rate (1h):', `${health.checks.errorRate.toFixed(2)}%`, health.checks.errorRate > 5 ? '⚠️' : '✅');
    console.log('  Avg Response Time:', `${health.checks.avgResponseTime.toFixed(0)}ms`, health.checks.avgResponseTime > 5000 ? '⚠️' : '✅');
    console.log('  Active Trades:', health.checks.activeTradesCount);
    console.log('');

    // Recommendations
    if (health.status === 'unhealthy') {
      console.log('🚨 CRITICAL: System is unhealthy!');
      console.log('Recommended Actions:');
      if (!health.checks.database) {
        console.log('  - Check database connection');
        console.log('  - Verify DATABASE_URL environment variable');
      }
      if (health.checks.errorRate > 10) {
        console.log('  - Review error logs immediately');
        console.log('  - Check external API status');
      }
      if (health.checks.avgResponseTime > 10000) {
        console.log('  - Optimize slow queries');
        console.log('  - Check API latency');
      }
    } else if (health.status === 'degraded') {
      console.log('⚠️ WARNING: System performance is degraded');
      console.log('Recommended Actions:');
      if (health.checks.errorRate > 5) {
        console.log('  - Monitor error logs');
      }
      if (health.checks.avgResponseTime > 5000) {
        console.log('  - Review slow operations');
      }
    } else {
      console.log('✅ System is healthy');
    }

    console.log('');
    console.log('='.repeat(60));

    // Exit with appropriate code
    process.exit(health.status === 'healthy' ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

runHealthCheck();
