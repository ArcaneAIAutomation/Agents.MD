/**
 * Disable ATGE System Script
 * 
 * This script disables the old ATGE system and archives its data
 * Requirements: 15.1-15.10
 * 
 * ⚠️ WARNING: This is a destructive operation. Only run after:
 * 1. 100% of users migrated to Quantum BTC
 * 2. Quantum BTC running stable for 7+ days
 * 3. Full backup of ATGE data created
 * 
 * Usage:
 *   # Dry run (preview changes)
 *   npx tsx scripts/disable-atge-system.ts --dry-run
 *   
 *   # Archive ATGE data
 *   npx tsx scripts/disable-atge-system.ts --archive
 *   
 *   # Disable ATGE endpoints (requires confirmation)
 *   npx tsx scripts/disable-atge-system.ts --disable
 */

import { query, queryOne, queryMany } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask user for confirmation
 */
function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (yes/no): `, (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Check if migration is complete
 */
async function checkMigrationComplete(): Promise<boolean> {
  try {
    const result = await queryOne(`
      SELECT quantum_btc_rollout_percentage
      FROM global_feature_flags
      LIMIT 1
    `);
    
    return result?.quantum_btc_rollout_percentage === 100;
  } catch (error) {
    return false;
  }
}

/**
 * Get ATGE data statistics
 */
async function getATGEStats() {
  const stats = {
    totalTrades: 0,
    totalResults: 0,
    totalIndicators: 0,
    totalSnapshots: 0,
    totalHistoricalPrices: 0,
    oldestTrade: null as string | null,
    newestTrade: null as string | null
  };
  
  try {
    const tradesResult = await queryOne(`
      SELECT 
        COUNT(*) as count,
        MIN(generated_at) as oldest,
        MAX(generated_at) as newest
      FROM trade_signals
    `);
    stats.totalTrades = parseInt(tradesResult.count);
    stats.oldestTrade = tradesResult.oldest;
    stats.newestTrade = tradesResult.newest;
    
    const resultsResult = await queryOne(`SELECT COUNT(*) as count FROM trade_results`);
    stats.totalResults = parseInt(resultsResult.count);
    
    const indicatorsResult = await queryOne(`SELECT COUNT(*) as count FROM trade_technical_indicators`);
    stats.totalIndicators = parseInt(indicatorsResult.count);
    
    const snapshotsResult = await queryOne(`SELECT COUNT(*) as count FROM trade_market_snapshot`);
    stats.totalSnapshots = parseInt(snapshotsResult.count);
    
    const pricesResult = await queryOne(`SELECT COUNT(*) as count FROM trade_historical_prices`);
    stats.totalHistoricalPrices = parseInt(pricesResult.count);
  } catch (error: any) {
    console.error('Error getting ATGE stats:', error.message);
  }
  
  return stats;
}

/**
 * Archive ATGE data
 */
async function archiveATGEData(dryRun: boolean = false) {
  console.log('📦 Archiving ATGE Data...\n');
  console.log('=' .repeat(60));
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Get statistics
  const stats = await getATGEStats();
  
  console.log('\n📊 ATGE Data Statistics:');
  console.log(`   Total Trade Signals: ${stats.totalTrades.toLocaleString()}`);
  console.log(`   Total Trade Results: ${stats.totalResults.toLocaleString()}`);
  console.log(`   Total Technical Indicators: ${stats.totalIndicators.toLocaleString()}`);
  console.log(`   Total Market Snapshots: ${stats.totalSnapshots.toLocaleString()}`);
  console.log(`   Total Historical Prices: ${stats.totalHistoricalPrices.toLocaleString()}`);
  
  if (stats.oldestTrade && stats.newestTrade) {
    console.log(`   Date Range: ${new Date(stats.oldestTrade).toLocaleDateString()} to ${new Date(stats.newestTrade).toLocaleDateString()}`);
  }
  
  console.log('');
  
  if (stats.totalTrades === 0) {
    console.log('⚠️ No ATGE data found - nothing to archive');
    return;
  }
  
  if (dryRun) {
    console.log('📋 Archive Plan:');
    console.log('   1. Create atge_archive schema');
    console.log('   2. Move trade_signals → atge_archive.trade_signals');
    console.log('   3. Move trade_results → atge_archive.trade_results');
    console.log('   4. Move trade_technical_indicators → atge_archive.trade_technical_indicators');
    console.log('   5. Move trade_market_snapshot → atge_archive.trade_market_snapshot');
    console.log('   6. Move trade_historical_prices → atge_archive.trade_historical_prices');
    console.log('   7. Create archive metadata table');
    console.log('');
    console.log('✅ Dry run complete - Run without --dry-run to execute');
    return;
  }
  
  // Confirm with user
  console.log('⚠️ WARNING: This will move ATGE tables to archive schema');
  const confirmed = await askConfirmation('Are you sure you want to proceed?');
  
  if (!confirmed) {
    console.log('❌ Archive cancelled by user');
    return;
  }
  
  console.log('\n🚀 Starting archive process...\n');
  
  try {
    // Create archive schema
    console.log('1️⃣ Creating atge_archive schema...');
    await query(`CREATE SCHEMA IF NOT EXISTS atge_archive`);
    console.log('   ✅ Schema created\n');
    
    // Move tables to archive
    const tables = [
      'trade_signals',
      'trade_results',
      'trade_technical_indicators',
      'trade_market_snapshot',
      'trade_historical_prices'
    ];
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      console.log(`${i + 2}️⃣ Moving ${table} to archive...`);
      
      try {
        await query(`ALTER TABLE ${table} SET SCHEMA atge_archive`);
        console.log(`   ✅ ${table} archived\n`);
      } catch (error: any) {
        console.log(`   ⚠️ ${table} already archived or doesn't exist\n`);
      }
    }
    
    // Create archive metadata
    console.log(`${tables.length + 2}️⃣ Creating archive metadata...`);
    await query(`
      CREATE TABLE IF NOT EXISTS atge_archive.archive_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        archive_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        total_trades INTEGER NOT NULL,
        total_results INTEGER NOT NULL,
        total_indicators INTEGER NOT NULL,
        total_snapshots INTEGER NOT NULL,
        total_historical_prices INTEGER NOT NULL,
        oldest_trade TIMESTAMP WITH TIME ZONE,
        newest_trade TIMESTAMP WITH TIME ZONE,
        archived_by VARCHAR(255) NOT NULL DEFAULT 'system',
        notes TEXT
      )
    `);
    
    await query(`
      INSERT INTO atge_archive.archive_metadata (
        total_trades,
        total_results,
        total_indicators,
        total_snapshots,
        total_historical_prices,
        oldest_trade,
        newest_trade,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      stats.totalTrades,
      stats.totalResults,
      stats.totalIndicators,
      stats.totalSnapshots,
      stats.totalHistoricalPrices,
      stats.oldestTrade,
      stats.newestTrade,
      'ATGE system archived after migration to Quantum BTC'
    ]);
    
    console.log('   ✅ Metadata created\n');
    
    console.log('=' .repeat(60));
    console.log('✅ ARCHIVE COMPLETE\n');
    console.log('📋 Archive Location: atge_archive schema');
    console.log('📊 Archived Tables:');
    tables.forEach(table => console.log(`   - atge_archive.${table}`));
    console.log('');
    console.log('💡 To restore from archive:');
    console.log('   ALTER TABLE atge_archive.trade_signals SET SCHEMA public;');
    console.log('');
  } catch (error: any) {
    console.error('❌ Archive failed:', error.message);
    throw error;
  }
}

/**
 * Disable ATGE endpoints
 */
async function disableATGEEndpoints(dryRun: boolean = false) {
  console.log('🚫 Disabling ATGE Endpoints...\n');
  console.log('=' .repeat(60));
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Check if migration is complete
  const migrationComplete = await checkMigrationComplete();
  
  if (!migrationComplete) {
    console.log('❌ ERROR: Migration not complete');
    console.log('   Current rollout: < 100%');
    console.log('   Run: npx tsx scripts/quantum-user-migration.ts --status');
    console.log('');
    console.log('⚠️ Cannot disable ATGE until 100% of users migrated');
    return;
  }
  
  console.log('✅ Migration verified: 100% of users on Quantum BTC\n');
  
  const endpointFiles = [
    'pages/api/atge/generate-trade.ts',
    'pages/api/atge/trade-history.ts',
    'pages/api/atge/performance-dashboard.ts',
    'pages/api/atge/trade-details.ts'
  ];
  
  console.log('📋 ATGE Endpoints to Disable:');
  endpointFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`   ${exists ? '✓' : '✗'} ${file}`);
  });
  console.log('');
  
  if (dryRun) {
    console.log('📋 Disable Plan:');
    console.log('   1. Replace endpoint handlers with deprecation messages');
    console.log('   2. Return HTTP 410 (Gone) status');
    console.log('   3. Provide migration instructions to users');
    console.log('');
    console.log('✅ Dry run complete - Run without --dry-run to execute');
    return;
  }
  
  // Confirm with user
  console.log('⚠️ WARNING: This will disable all ATGE API endpoints');
  console.log('   Users will receive deprecation messages');
  const confirmed = await askConfirmation('Are you sure you want to proceed?');
  
  if (!confirmed) {
    console.log('❌ Disable cancelled by user');
    return;
  }
  
  console.log('\n🚀 Disabling endpoints...\n');
  
  const deprecationHandler = `/**
 * DEPRECATED: ATGE Endpoint
 * 
 * This endpoint has been deprecated and replaced by Quantum BTC.
 * All users have been migrated to the new system.
 * 
 * Migration Date: ${new Date().toISOString().split('T')[0]}
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'This endpoint has been deprecated',
    message: 'The ATGE system has been replaced by Quantum BTC',
    migration_date: '${new Date().toISOString().split('T')[0]}',
    new_endpoint: '/api/quantum/generate-btc-trade',
    documentation: '/docs/quantum-btc-migration',
    support: 'Please contact support if you need assistance with the migration'
  });
}
`;
  
  let disabledCount = 0;
  
  for (const file of endpointFiles) {
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      // Backup original file
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
      
      // Replace with deprecation handler
      fs.writeFileSync(filePath, deprecationHandler);
      
      console.log(`✅ Disabled: ${file}`);
      console.log(`   Backup: ${file}.backup\n`);
      disabledCount++;
    }
  }
  
  console.log('=' .repeat(60));
  console.log(`✅ DISABLED ${disabledCount} ENDPOINTS\n`);
  console.log('📋 Next Steps:');
  console.log('   1. Deploy changes to production');
  console.log('   2. Monitor for 7 days');
  console.log('   3. Remove ATGE code completely');
  console.log('   4. Update documentation');
  console.log('');
  console.log('💡 To restore endpoints:');
  console.log('   Restore from .backup files');
  console.log('');
}

/**
 * Generate migration summary report
 */
async function generateSummaryReport() {
  console.log('📊 ATGE to Quantum BTC Migration Summary\n');
  console.log('=' .repeat(60));
  
  // Get migration status
  const rolloutResult = await queryOne(`
    SELECT quantum_btc_rollout_percentage, quantum_btc_enabled, updated_at
    FROM global_feature_flags
    LIMIT 1
  `);
  
  console.log('\n🎯 Migration Status:');
  console.log(`   Rollout: ${rolloutResult?.quantum_btc_rollout_percentage || 0}%`);
  console.log(`   Enabled: ${rolloutResult?.quantum_btc_enabled ? 'Yes' : 'No'}`);
  console.log(`   Last Updated: ${rolloutResult?.updated_at ? new Date(rolloutResult.updated_at).toLocaleString() : 'N/A'}`);
  
  // Get ATGE stats
  const atgeStats = await getATGEStats();
  
  console.log('\n📦 ATGE Data:');
  console.log(`   Total Trades: ${atgeStats.totalTrades.toLocaleString()}`);
  console.log(`   Archived: ${atgeStats.totalTrades > 0 ? 'Check atge_archive schema' : 'No'}`);
  
  // Get Quantum BTC stats
  const quantumResult = await queryOne(`
    SELECT 
      COUNT(*) as total,
      MIN(generated_at) as oldest,
      MAX(generated_at) as newest
    FROM btc_trades
  `);
  
  console.log('\n🚀 Quantum BTC Data:');
  console.log(`   Total Trades: ${parseInt(quantumResult.total).toLocaleString()}`);
  
  if (quantumResult.oldest && quantumResult.newest) {
    console.log(`   Date Range: ${new Date(quantumResult.oldest).toLocaleDateString()} to ${new Date(quantumResult.newest).toLocaleDateString()}`);
  }
  
  // Check if endpoints are disabled
  const endpointDisabled = fs.existsSync(path.join(process.cwd(), 'pages/api/atge/generate-trade.ts.backup'));
  
  console.log('\n🚫 ATGE Endpoints:');
  console.log(`   Status: ${endpointDisabled ? 'Disabled' : 'Active'}`);
  
  console.log('\n' + '=' .repeat(60));
  
  // Recommendations
  console.log('\n💡 Next Steps:');
  
  if (rolloutResult?.quantum_btc_rollout_percentage < 100) {
    console.log('   ❌ Migration incomplete - continue rollout');
    console.log('   Run: npx tsx scripts/quantum-user-migration.ts --percentage 100');
  } else if (atgeStats.totalTrades > 0 && !endpointDisabled) {
    console.log('   ⚠️ Migration complete but ATGE still active');
    console.log('   1. Archive ATGE data: npx tsx scripts/disable-atge-system.ts --archive');
    console.log('   2. Disable endpoints: npx tsx scripts/disable-atge-system.ts --disable');
  } else if (endpointDisabled) {
    console.log('   ✅ Migration complete and ATGE disabled');
    console.log('   Monitor for 7 days, then remove ATGE code');
  } else {
    console.log('   ✅ Ready to archive and disable ATGE');
    console.log('   Run: npx tsx scripts/disable-atge-system.ts --archive');
  }
  
  console.log('');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--dry-run')) {
      if (args.includes('--archive')) {
        await archiveATGEData(true);
      } else if (args.includes('--disable')) {
        await disableATGEEndpoints(true);
      } else {
        console.log('Specify --archive or --disable with --dry-run');
      }
    } else if (args.includes('--archive')) {
      await archiveATGEData(false);
    } else if (args.includes('--disable')) {
      await disableATGEEndpoints(false);
    } else if (args.includes('--summary')) {
      await generateSummaryReport();
    } else {
      console.log('Disable ATGE System Script\n');
      console.log('⚠️ WARNING: This script performs destructive operations\n');
      console.log('Usage:');
      console.log('  npx tsx scripts/disable-atge-system.ts --dry-run --archive');
      console.log('  npx tsx scripts/disable-atge-system.ts --dry-run --disable');
      console.log('  npx tsx scripts/disable-atge-system.ts --archive');
      console.log('  npx tsx scripts/disable-atge-system.ts --disable');
      console.log('  npx tsx scripts/disable-atge-system.ts --summary');
      console.log('');
      console.log('Steps:');
      console.log('  1. Run --summary to check migration status');
      console.log('  2. Run --dry-run --archive to preview archive');
      console.log('  3. Run --archive to archive ATGE data');
      console.log('  4. Run --dry-run --disable to preview endpoint disable');
      console.log('  5. Run --disable to disable ATGE endpoints');
      console.log('');
    }
    
    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run main function
main();
