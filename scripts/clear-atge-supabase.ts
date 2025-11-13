/**
 * Clear ATGE Supabase Database - Fresh Testing Script
 * 
 * This script safely clears all ATGE-related data from Supabase
 * while preserving the table structure and user authentication data.
 * 
 * Usage: npx tsx scripts/clear-atge-supabase.ts
 */

import { query } from '../lib/db';

async function clearATGESupabase() {
  console.log('🧹 Starting ATGE Supabase Database Cleanup...\n');

  try {
    let totalDeleted = 0;

    // 1. Clear trade signals (main trade data)
    console.log('📊 Clearing trade signals...');
    const tradesResult = await query('DELETE FROM trade_signals');
    console.log(`   ✅ Deleted ${tradesResult.rowCount} trade signals`);
    totalDeleted += tradesResult.rowCount || 0;

    // 2. Clear trade results (backtesting results)
    console.log('📈 Clearing trade results...');
    const resultsResult = await query('DELETE FROM trade_results');
    console.log(`   ✅ Deleted ${resultsResult.rowCount} trade results`);
    totalDeleted += resultsResult.rowCount || 0;

    // 3. Clear trade technical indicators
    console.log('📉 Clearing technical indicators...');
    const indicatorsResult = await query('DELETE FROM trade_technical_indicators');
    console.log(`   ✅ Deleted ${indicatorsResult.rowCount} indicator records`);
    totalDeleted += indicatorsResult.rowCount || 0;

    // 4. Clear trade market snapshots
    console.log('📸 Clearing market snapshots...');
    const snapshotsResult = await query('DELETE FROM trade_market_snapshot');
    console.log(`   ✅ Deleted ${snapshotsResult.rowCount} market snapshots`);
    totalDeleted += snapshotsResult.rowCount || 0;

    // 5. Clear trade historical prices
    console.log('💰 Clearing historical prices...');
    const pricesResult = await query('DELETE FROM trade_historical_prices');
    console.log(`   ✅ Deleted ${pricesResult.rowCount} price records`);
    totalDeleted += pricesResult.rowCount || 0;

    // 6. Clear ATGE performance metrics
    console.log('📊 Clearing performance metrics...');
    const metricsResult = await query('DELETE FROM atge_performance_metrics');
    console.log(`   ✅ Deleted ${metricsResult.rowCount} performance records`);
    totalDeleted += metricsResult.rowCount || 0;

    // 7. Clear ATGE performance cache
    console.log('💾 Clearing performance cache...');
    const cacheResult = await query('DELETE FROM atge_performance_cache');
    console.log(`   ✅ Deleted ${cacheResult.rowCount} cache records`);
    totalDeleted += cacheResult.rowCount || 0;

    // 8. Skip ATGE performance summary (it's a view, not a table)
    console.log('📋 Skipping performance summary (view, auto-updates)...');
    console.log(`   ℹ️  View will auto-update when underlying data is cleared`);

    // 9. Clear ATGE error logs
    console.log('🚨 Clearing error logs...');
    const errorsResult = await query('DELETE FROM atge_error_logs');
    console.log(`   ✅ Deleted ${errorsResult.rowCount} error logs`);
    totalDeleted += errorsResult.rowCount || 0;

    // 10. Clear ATGE user feedback
    console.log('💬 Clearing user feedback...');
    const feedbackResult = await query('DELETE FROM atge_user_feedback');
    console.log(`   ✅ Deleted ${feedbackResult.rowCount} feedback records`);
    totalDeleted += feedbackResult.rowCount || 0;

    console.log(`\n📊 Total Records Deleted: ${totalDeleted}\n`);

    // 11. Verify tables are empty
    console.log('🔍 Verifying cleanup...');
    const verification = await query(`
      SELECT 
        (SELECT COUNT(*) FROM trade_signals) as trade_signals,
        (SELECT COUNT(*) FROM trade_results) as trade_results,
        (SELECT COUNT(*) FROM trade_technical_indicators) as indicators,
        (SELECT COUNT(*) FROM trade_market_snapshot) as snapshots,
        (SELECT COUNT(*) FROM trade_historical_prices) as prices,
        (SELECT COUNT(*) FROM atge_performance_metrics) as metrics,
        (SELECT COUNT(*) FROM atge_performance_cache) as cache,
        (SELECT COUNT(*) FROM atge_performance_summary_24h) as summary_view,
        (SELECT COUNT(*) FROM atge_error_logs) as errors,
        (SELECT COUNT(*) FROM atge_user_feedback) as feedback
    `);

    const counts = verification.rows[0];
    console.log('   Remaining records:');
    console.log(`   - Trade Signals: ${counts.trade_signals}`);
    console.log(`   - Trade Results: ${counts.trade_results}`);
    console.log(`   - Technical Indicators: ${counts.indicators}`);
    console.log(`   - Market Snapshots: ${counts.snapshots}`);
    console.log(`   - Historical Prices: ${counts.prices}`);
    console.log(`   - Performance Metrics: ${counts.metrics}`);
    console.log(`   - Performance Cache: ${counts.cache}`);
    console.log(`   - Performance Summary (view): ${counts.summary_view}`);
    console.log(`   - Error Logs: ${counts.errors}`);
    console.log(`   - User Feedback: ${counts.feedback}\n`);

    const allZero = Object.values(counts).every(count => count === '0');

    if (allZero) {
      console.log('✅ SUCCESS! All ATGE data has been cleared from Supabase!\n');
      console.log('🎯 Database is ready for fresh testing with:');
      console.log('   ✨ Dual AI Analysis (GPT-4o + Gemini 2.0 Flash)');
      console.log('   ✨ 13 Real-Time Data Sources');
      console.log('   ✨ 4 Timeframe Support (15m/1h/4h/1d)');
      console.log('   ✨ Force Refresh System (100% real-time data)');
      console.log('   ✨ Complete Data Source Attribution');
      console.log('   ✨ Comprehensive AI Reasoning\n');
      console.log('🚀 You can now generate fresh trades with the ultimate system!\n');
    } else {
      console.log('⚠️  WARNING: Some records remain. Please check manually.\n');
    }

    // 12. Show preserved tables
    console.log('🔒 Preserved Tables (User Data):');
    const preserved = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')
      ORDER BY table_name
    `);
    
    for (const row of preserved.rows) {
      const countResult = await query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
      const count = countResult.rows[0].count;
      console.log(`   ✅ ${row.table_name} (${count} records preserved)`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ ERROR during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
clearATGESupabase()
  .then(() => {
    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
