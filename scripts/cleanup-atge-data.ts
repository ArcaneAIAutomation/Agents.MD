/**
 * ATGE Database Cleanup Script
 * 
 * Deletes all ATGE trade data from the database
 * Use this to reset the system for testing
 * 
 * Usage: npx tsx scripts/cleanup-atge-data.ts
 */

import { query } from '../lib/db';

async function cleanupATGEData() {
  console.log('🧹 Starting ATGE database cleanup...\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Get counts before deletion
    console.log('📊 Current data counts:');
    const counts = await Promise.all([
      query('SELECT COUNT(*) FROM trade_signals'),
      query('SELECT COUNT(*) FROM trade_technical_indicators'),
      query('SELECT COUNT(*) FROM trade_market_snapshot'),
      query('SELECT COUNT(*) FROM trade_results'),
      query('SELECT COUNT(*) FROM trade_historical_prices')
    ]);

    console.log(`  - Trade Signals: ${counts[0].rows[0].count}`);
    console.log(`  - Technical Indicators: ${counts[1].rows[0].count}`);
    console.log(`  - Market Snapshots: ${counts[2].rows[0].count}`);
    console.log(`  - Trade Results: ${counts[3].rows[0].count}`);
    console.log(`  - Historical Prices: ${counts[4].rows[0].count}\n`);

    const totalRecords = counts.reduce((sum, result) => sum + parseInt(result.rows[0].count), 0);

    if (totalRecords === 0) {
      console.log('✨ Database is already clean! No records to delete.\n');
      return;
    }

    // Confirm deletion
    console.log(`⚠️  WARNING: This will delete ${totalRecords} total records!\n`);
    console.log('🗑️  Deleting all ATGE data...\n');

    // Delete in correct order (child tables first due to foreign keys)
    console.log('  1. Deleting historical prices...');
    const result1 = await query('DELETE FROM trade_historical_prices');
    console.log(`     ✅ Deleted ${result1.rowCount} historical price records`);

    console.log('  2. Deleting trade results...');
    const result2 = await query('DELETE FROM trade_results');
    console.log(`     ✅ Deleted ${result2.rowCount} trade result records`);

    console.log('  3. Deleting market snapshots...');
    const result3 = await query('DELETE FROM trade_market_snapshot');
    console.log(`     ✅ Deleted ${result3.rowCount} market snapshot records`);

    console.log('  4. Deleting technical indicators...');
    const result4 = await query('DELETE FROM trade_technical_indicators');
    console.log(`     ✅ Deleted ${result4.rowCount} technical indicator records`);

    console.log('  5. Deleting trade signals...');
    const result5 = await query('DELETE FROM trade_signals');
    console.log(`     ✅ Deleted ${result5.rowCount} trade signal records\n`);

    // Verify deletion
    console.log('🔍 Verifying cleanup...');
    const verifyCount = await query(`
      SELECT 
        (SELECT COUNT(*) FROM trade_signals) as signals,
        (SELECT COUNT(*) FROM trade_technical_indicators) as indicators,
        (SELECT COUNT(*) FROM trade_market_snapshot) as snapshots,
        (SELECT COUNT(*) FROM trade_results) as results,
        (SELECT COUNT(*) FROM trade_historical_prices) as prices
    `);

    const verify = verifyCount.rows[0];
    console.log(`  - Trade Signals: ${verify.signals}`);
    console.log(`  - Technical Indicators: ${verify.indicators}`);
    console.log(`  - Market Snapshots: ${verify.snapshots}`);
    console.log(`  - Trade Results: ${verify.results}`);
    console.log(`  - Historical Prices: ${verify.prices}\n`);

    if (verify.signals === '0' && verify.indicators === '0' && verify.snapshots === '0' && 
        verify.results === '0' && verify.prices === '0') {
      console.log('✅ SUCCESS! All ATGE data has been cleaned up.\n');
      console.log('🎯 You can now generate new trades to test with fresh data.\n');
    } else {
      console.log('⚠️  WARNING: Some records may still exist. Please check manually.\n');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('\nDetails:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run cleanup
cleanupATGEData()
  .then(() => {
    console.log('✨ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });

