/**
 * ATGE Database Cleanup Script
 * 
 * Cleans all ATGE-related data from the database
 * Use this to reset the system for production use with real data
 * 
 * Usage: npx tsx scripts/cleanup-atge-database.ts
 */

import { query } from '../lib/db';

async function cleanupDatabase() {
  console.log('🧹 ATGE Database Cleanup');
  console.log('='.repeat(60));
  console.log('This will delete ALL ATGE data from the database.');
  console.log('');

  try {
    // Delete in reverse order of dependencies
    console.log('Deleting trade historical prices...');
    const historicalResult = await query('DELETE FROM trade_historical_prices');
    console.log(`✅ Deleted ${historicalResult.rowCount} historical price records`);

    console.log('Deleting trade technical indicators...');
    const indicatorsResult = await query('DELETE FROM trade_technical_indicators');
    console.log(`✅ Deleted ${indicatorsResult.rowCount} technical indicator records`);

    console.log('Deleting trade market snapshots...');
    const snapshotResult = await query('DELETE FROM trade_market_snapshot');
    console.log(`✅ Deleted ${snapshotResult.rowCount} market snapshot records`);

    console.log('Deleting trade results...');
    const resultsResult = await query('DELETE FROM trade_results');
    console.log(`✅ Deleted ${resultsResult.rowCount} trade result records`);

    console.log('Deleting trade signals...');
    const signalsResult = await query('DELETE FROM trade_signals');
    console.log(`✅ Deleted ${signalsResult.rowCount} trade signal records`);

    console.log('Deleting performance cache...');
    const cacheResult = await query('DELETE FROM atge_performance_cache');
    console.log(`✅ Deleted ${cacheResult.rowCount} performance cache records`);

    // Delete monitoring tables (if they exist)
    try {
      console.log('Deleting error logs...');
      const errorResult = await query('DELETE FROM atge_error_logs');
      console.log(`✅ Deleted ${errorResult.rowCount} error log records`);
    } catch (err: any) {
      if (err.code === '42P01') {
        console.log('⚠️  atge_error_logs table does not exist (skipping)');
      } else {
        throw err;
      }
    }

    try {
      console.log('Deleting performance metrics...');
      const metricsResult = await query('DELETE FROM atge_performance_metrics');
      console.log(`✅ Deleted ${metricsResult.rowCount} performance metric records`);
    } catch (err: any) {
      if (err.code === '42P01') {
        console.log('⚠️  atge_performance_metrics table does not exist (skipping)');
      } else {
        throw err;
      }
    }

    try {
      console.log('Deleting user feedback...');
      const feedbackResult = await query('DELETE FROM atge_user_feedback');
      console.log(`✅ Deleted ${feedbackResult.rowCount} user feedback records`);
    } catch (err: any) {
      if (err.code === '42P01') {
        console.log('⚠️  atge_user_feedback table does not exist (skipping)');
      } else {
        throw err;
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Database cleanup complete!');
    console.log('');
    console.log('The ATGE system is now ready for real user-initiated data.');
    console.log('Users can select Bitcoin and click "Generate Trade Signal" to populate the database.');
    console.log('');

    // Verify cleanup
    console.log('Verification:');
    const verifyResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM trade_signals) as trade_signals,
        (SELECT COUNT(*) FROM trade_results) as trade_results,
        (SELECT COUNT(*) FROM trade_historical_prices) as historical_prices,
        (SELECT COUNT(*) FROM trade_technical_indicators) as technical_indicators,
        (SELECT COUNT(*) FROM trade_market_snapshot) as market_snapshots,
        (SELECT COUNT(*) FROM atge_performance_cache) as performance_cache
    `);

    console.table(verifyResult.rows[0]);

    const allZero = Object.values(verifyResult.rows[0]).every(count => count === '0');
    if (allZero) {
      console.log('');
      console.log('✅ All core tables are empty. Database is clean!');
      console.log('Note: Monitoring tables (error_logs, performance_metrics, user_feedback) will be created when needed.');
    } else {
      console.log('');
      console.log('⚠️ Warning: Some tables still have data. Please review.');
    }

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDatabase();
