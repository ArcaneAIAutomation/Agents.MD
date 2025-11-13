/**
 * Clear ATGE Database - Fresh Testing Script
 * 
 * This script safely clears all ATGE-related data from the database
 * while preserving the table structure and user authentication data.
 * 
 * Usage: npx tsx scripts/clear-atge-database.ts
 */

import { query } from '../lib/db';

async function clearATGEDatabase() {
  console.log('🧹 Starting ATGE Database Cleanup...\n');

  try {
    // 1. Clear trade signals
    console.log('📊 Clearing trade signals...');
    const tradesResult = await query('DELETE FROM atge_trades');
    console.log(`   ✅ Deleted ${tradesResult.rowCount} trade signals\n`);

    // 2. Clear performance metrics
    console.log('📈 Clearing performance metrics...');
    const metricsResult = await query('DELETE FROM atge_performance_metrics');
    console.log(`   ✅ Deleted ${metricsResult.rowCount} performance records\n`);

    // 3. Clear monitoring logs
    console.log('📝 Clearing monitoring logs...');
    const logsResult = await query('DELETE FROM atge_monitoring_logs');
    console.log(`   ✅ Deleted ${logsResult.rowCount} monitoring logs\n`);

    // 4. Clear API health logs
    console.log('🏥 Clearing API health logs...');
    const healthResult = await query('DELETE FROM atge_api_health');
    console.log(`   ✅ Deleted ${healthResult.rowCount} health records\n`);

    // 5. Verify tables are empty
    console.log('🔍 Verifying cleanup...');
    const verification = await query(`
      SELECT 
        (SELECT COUNT(*) FROM atge_trades) as trades_count,
        (SELECT COUNT(*) FROM atge_performance_metrics) as metrics_count,
        (SELECT COUNT(*) FROM atge_monitoring_logs) as logs_count,
        (SELECT COUNT(*) FROM atge_api_health) as health_count
    `);

    const counts = verification.rows[0];
    console.log('   Remaining records:');
    console.log(`   - Trades: ${counts.trades_count}`);
    console.log(`   - Metrics: ${counts.metrics_count}`);
    console.log(`   - Logs: ${counts.logs_count}`);
    console.log(`   - Health: ${counts.health_count}\n`);

    if (
      counts.trades_count === '0' &&
      counts.metrics_count === '0' &&
      counts.logs_count === '0' &&
      counts.health_count === '0'
    ) {
      console.log('✅ SUCCESS! All ATGE data has been cleared!\n');
      console.log('🎯 Database is ready for fresh testing with:');
      console.log('   - Dual AI Analysis (GPT-4o + Gemini)');
      console.log('   - 13 Real-Time Data Sources');
      console.log('   - 4 Timeframe Support (15m/1h/4h/1d)');
      console.log('   - Force Refresh System');
      console.log('   - Complete Data Attribution\n');
      console.log('🚀 You can now generate fresh trades!\n');
    } else {
      console.log('⚠️  WARNING: Some records remain. Please check manually.\n');
    }

    // 6. Show table structure (preserved)
    console.log('📋 Table Structure (Preserved):');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'atge_%'
      ORDER BY table_name
    `);
    
    tables.rows.forEach((row: any) => {
      console.log(`   ✅ ${row.table_name}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ ERROR during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
clearATGEDatabase()
  .then(() => {
    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
