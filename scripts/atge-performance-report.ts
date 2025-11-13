/**
 * ATGE Performance Report Script
 * 
 * Generates a comprehensive performance report for the AI Trade Generation Engine
 * 
 * Usage: npx tsx scripts/atge-performance-report.ts
 */

import { query } from '../lib/db';

async function generatePerformanceReport() {
  console.log('='.repeat(80));
  console.log('AI TRADE GENERATION ENGINE (ATGE) - PERFORMANCE REPORT');
  console.log('Generated:', new Date().toISOString());
  console.log('='.repeat(80));

  try {
    // System Health
    console.log('\n📊 SYSTEM HEALTH (Last 24 Hours)');
    console.log('-'.repeat(80));
    const health = await query(`
      SELECT 
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
        COUNT(*) FILTER (WHERE severity = 'high') as high_errors,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_errors,
        COUNT(*) FILTER (WHERE severity = 'low') as low_errors
      FROM atge_error_logs
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);
    
    if (health.rows.length > 0) {
      const h = health.rows[0];
      console.log(`Total Errors: ${h.total_errors}`);
      console.log(`  Critical: ${h.critical_errors}`);
      console.log(`  High: ${h.high_errors}`);
      console.log(`  Medium: ${h.medium_errors}`);
      console.log(`  Low: ${h.low_errors}`);
    } else {
      console.log('✅ No errors in the last 24 hours');
    }

    // API Performance
    console.log('\n⚡ API PERFORMANCE (Last 24 Hours)');
    console.log('-'.repeat(80));
    const apiPerf = await query(`
      SELECT 
        metric_name as "Endpoint",
        COUNT(*) as "Requests",
        ROUND(AVG(value)::NUMERIC, 2) as "Avg (ms)",
        ROUND(MIN(value)::NUMERIC, 2) as "Min (ms)",
        ROUND(MAX(value)::NUMERIC, 2) as "Max (ms)",
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value)::NUMERIC, 2) as "P95 (ms)",
        ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value)::NUMERIC, 2) as "P99 (ms)"
      FROM atge_performance_metrics
      WHERE metric_type = 'api_response'
        AND timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY metric_name
      ORDER BY "Avg (ms)" DESC
    `);
    
    if (apiPerf.rows.length > 0) {
      console.table(apiPerf.rows);
    } else {
      console.log('No API performance data available');
    }

    // Trade Statistics
    console.log('\n📈 TRADE STATISTICS (Last 24 Hours)');
    console.log('-'.repeat(80));
    const trades = await query(`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'completed_success') as successful,
        COUNT(*) FILTER (WHERE status = 'completed_failure') as failed,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        ROUND((COUNT(*) FILTER (WHERE status = 'completed_success')::DECIMAL / 
               NULLIF(COUNT(*) FILTER (WHERE status IN ('completed_success', 'completed_failure')), 0)) * 100, 2) as success_rate
      FROM trade_signals
      WHERE generated_at > NOW() - INTERVAL '24 hours'
    `);
    
    if (trades.rows.length > 0) {
      const t = trades.rows[0];
      console.log(`Total Trades: ${t.total_trades}`);
      console.log(`  Active: ${t.active}`);
      console.log(`  Successful: ${t.successful}`);
      console.log(`  Failed: ${t.failed}`);
      console.log(`  Expired: ${t.expired}`);
      console.log(`  Success Rate: ${t.success_rate || 0}%`);
    } else {
      console.log('No trades in the last 24 hours');
    }

    // Profit/Loss Summary
    console.log('\n💰 PROFIT/LOSS SUMMARY (Last 24 Hours)');
    console.log('-'.repeat(80));
    const profitLoss = await query(`
      SELECT 
        COUNT(*) as completed_trades,
        ROUND(SUM(tr.net_profit_loss)::NUMERIC, 2) as total_profit_loss,
        ROUND(AVG(tr.net_profit_loss)::NUMERIC, 2) as avg_profit_loss,
        ROUND(MAX(tr.net_profit_loss)::NUMERIC, 2) as best_trade,
        ROUND(MIN(tr.net_profit_loss)::NUMERIC, 2) as worst_trade
      FROM trade_signals ts
      JOIN trade_results tr ON ts.id = tr.trade_signal_id
      WHERE ts.generated_at > NOW() - INTERVAL '24 hours'
        AND ts.status IN ('completed_success', 'completed_failure')
    `);
    
    if (profitLoss.rows.length > 0 && profitLoss.rows[0].completed_trades > 0) {
      const pl = profitLoss.rows[0];
      console.log(`Completed Trades: ${pl.completed_trades}`);
      console.log(`Total P/L: $${pl.total_profit_loss}`);
      console.log(`Average P/L: $${pl.avg_profit_loss}`);
      console.log(`Best Trade: $${pl.best_trade}`);
      console.log(`Worst Trade: $${pl.worst_trade}`);
    } else {
      console.log('No completed trades in the last 24 hours');
    }

    // User Feedback
    console.log('\n⭐ USER FEEDBACK (Last 7 Days)');
    console.log('-'.repeat(80));
    const feedback = await query(`
      SELECT 
        feedback_type as "Type",
        COUNT(*) as "Total",
        ROUND(AVG(rating)::NUMERIC, 2) as "Avg Rating",
        COUNT(*) FILTER (WHERE rating >= 4) as "Positive",
        COUNT(*) FILTER (WHERE rating <= 2) as "Negative"
      FROM atge_user_feedback
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY feedback_type
      ORDER BY "Avg Rating" DESC
    `);
    
    if (feedback.rows.length > 0) {
      console.table(feedback.rows);
    } else {
      console.log('No user feedback in the last 7 days');
    }

    // Database Statistics
    console.log('\n🗄️ DATABASE STATISTICS');
    console.log('-'.repeat(80));
    const dbStats = await query(`
      SELECT 
        tablename as "Table",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Size"
      FROM pg_tables
      WHERE tablename LIKE 'trade_%' OR tablename LIKE 'atge_%'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    
    if (dbStats.rows.length > 0) {
      console.table(dbStats.rows);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    // Check for high error rate
    if (health.rows[0]?.total_errors > 100) {
      console.log('⚠️  High error rate detected. Review error logs and investigate root causes.');
    }
    
    // Check for slow API responses
    const slowApis = apiPerf.rows.filter(row => row['Avg (ms)'] > 5000);
    if (slowApis.length > 0) {
      console.log('⚠️  Slow API responses detected. Consider optimizing:');
      slowApis.forEach(api => {
        console.log(`    - ${api.Endpoint}: ${api['Avg (ms)']}ms average`);
      });
    }
    
    // Check for low success rate
    if (trades.rows[0]?.success_rate && trades.rows[0].success_rate < 50) {
      console.log('⚠️  Low trade success rate. Review AI model and market conditions.');
    }
    
    // Check for negative P/L
    if (profitLoss.rows[0]?.total_profit_loss && profitLoss.rows[0].total_profit_loss < 0) {
      console.log('⚠️  Negative total P/L. Review trade strategy and risk management.');
    }
    
    // If no issues
    if (
      health.rows[0]?.total_errors <= 100 &&
      slowApis.length === 0 &&
      (!trades.rows[0]?.success_rate || trades.rows[0].success_rate >= 50) &&
      (!profitLoss.rows[0]?.total_profit_loss || profitLoss.rows[0].total_profit_loss >= 0)
    ) {
      console.log('✅ System is performing well. No immediate action required.');
    }

    console.log('\n' + '='.repeat(80));
    console.log('Report generation complete');
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating report:', error);
    process.exit(1);
  }
}

generatePerformanceReport();
