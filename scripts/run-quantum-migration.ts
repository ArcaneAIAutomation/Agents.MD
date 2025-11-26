/**
 * Quantum BTC Migration Runner
 * 
 * This script runs the Quantum BTC SUPER SPEC migration
 * to migrate ATGE trade signals to the new schema.
 * 
 * Usage:
 *   npx tsx scripts/run-quantum-migration.ts [--dry-run] [--rollback]
 * 
 * Options:
 *   --dry-run   : Preview migration without executing
 *   --rollback  : Rollback the migration (drop new tables)
 *   --verify    : Verify migration status only
 */

import { query, queryOne, queryMany } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface MigrationStats {
  atgeCount: number;
  btcCount: number;
  migratedCount: number;
  newTables: string[];
}

async function runMigration(dryRun: boolean = false): Promise<MigrationResult> {
  try {
    console.log('🚀 Starting Quantum BTC Migration...\n');
    
    if (dryRun) {
      console.log('📋 DRY RUN MODE - No changes will be made\n');
    }
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/020_quantum_btc_migration.sql');
    
    if (!fs.existsSync(migrationPath)) {
      return {
        success: false,
        message: 'Migration file not found: 020_quantum_btc_migration.sql'
      };
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    if (dryRun) {
      console.log('📄 Migration SQL Preview:');
      console.log('─'.repeat(80));
      console.log(migrationSQL.substring(0, 500) + '...\n');
      console.log('─'.repeat(80));
      console.log(`\n✅ Migration file validated (${migrationSQL.length} characters)\n`);
      return {
        success: true,
        message: 'Dry run completed successfully'
      };
    }
    
    // Execute migration
    console.log('⚙️  Executing migration...\n');
    
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully\n');
    
    // Verify migration
    const stats = await verifyMigration();
    
    return {
      success: true,
      message: 'Migration completed successfully',
      details: stats
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function verifyMigration(): Promise<MigrationStats> {
  console.log('🔍 Verifying migration...\n');
  
  try {
    // Check if new tables exist
    const tables = await queryMany(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'btc_trades',
          'btc_hourly_snapshots',
          'quantum_anomaly_logs',
          'prediction_accuracy_database',
          'api_latency_reliability_logs',
          'quantum_migration_log'
        )
      ORDER BY table_name
    `);
    
    const newTables = tables.map((t: any) => t.table_name);
    
    console.log('📊 New Tables Created:');
    newTables.forEach(table => console.log(`   ✓ ${table}`));
    console.log('');
    
    // Count ATGE BTC trades
    const atgeResult = await queryOne(`
      SELECT COUNT(*) as count 
      FROM atge_trade_signals 
      WHERE symbol = 'BTC'
    `);
    const atgeCount = parseInt(atgeResult?.count || '0');
    
    // Count new BTC trades
    const btcResult = await queryOne(`
      SELECT COUNT(*) as count 
      FROM btc_trades
    `);
    const btcCount = parseInt(btcResult?.count || '0');
    
    // Count migrated trades
    const migratedResult = await queryOne(`
      SELECT COUNT(*) as count 
      FROM btc_trades 
      WHERE quantum_reasoning LIKE '%Migrated from ATGE%'
    `);
    const migratedCount = parseInt(migratedResult?.count || '0');
    
    console.log('📈 Migration Statistics:');
    console.log(`   Original ATGE BTC Trades: ${atgeCount}`);
    console.log(`   New BTC Trades Total: ${btcCount}`);
    console.log(`   Migrated Trades: ${migratedCount}`);
    console.log('');
    
    if (migratedCount >= atgeCount) {
      console.log('✅ Migration SUCCESSFUL - All trades migrated\n');
    } else {
      console.log('⚠️  Migration INCOMPLETE - Some trades may not have migrated\n');
    }
    
    // Check migration log
    const migrationLog = await queryOne(`
      SELECT * 
      FROM quantum_migration_log 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (migrationLog) {
      console.log('📝 Migration Log:');
      console.log(`   Status: ${migrationLog.migration_status}`);
      console.log(`   Records Migrated: ${migrationLog.records_migrated}`);
      console.log(`   Completed At: ${migrationLog.completed_at}`);
      console.log('');
    }
    
    return {
      atgeCount,
      btcCount,
      migratedCount,
      newTables
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function rollbackMigration(): Promise<MigrationResult> {
  try {
    console.log('🔄 Rolling back Quantum BTC Migration...\n');
    console.log('⚠️  WARNING: This will drop all new tables and data!\n');
    
    // Confirm rollback
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      readline.question('Type "ROLLBACK" to confirm: ', resolve);
    });
    
    readline.close();
    
    if (answer !== 'ROLLBACK') {
      return {
        success: false,
        message: 'Rollback cancelled'
      };
    }
    
    console.log('\n⚙️  Executing rollback...\n');
    
    // Drop tables in reverse order (respecting foreign keys)
    const rollbackSQL = `
      -- Drop views first
      DROP VIEW IF EXISTS atge_trade_signals_compat CASCADE;
      
      -- Drop tables in reverse order
      DROP TABLE IF EXISTS api_latency_reliability_logs CASCADE;
      DROP TABLE IF EXISTS quantum_migration_log CASCADE;
      DROP TABLE IF EXISTS prediction_accuracy_database CASCADE;
      DROP TABLE IF EXISTS quantum_anomaly_logs CASCADE;
      DROP TABLE IF EXISTS btc_hourly_snapshots CASCADE;
      DROP TABLE IF EXISTS btc_trades CASCADE;
      
      -- Drop trigger function
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `;
    
    await query(rollbackSQL);
    
    console.log('✅ Rollback completed successfully\n');
    
    return {
      success: true,
      message: 'Rollback completed - all new tables dropped'
    };
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rollback = args.includes('--rollback');
  const verifyOnly = args.includes('--verify');
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Quantum BTC SUPER SPEC - Migration Tool               ║');
  console.log('║     Version: 1.0.0                                        ║');
  console.log('║     Capability Level: Einstein × 1000000000000000x        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    if (rollback) {
      const result = await rollbackMigration();
      console.log('\n' + '═'.repeat(60));
      console.log(result.success ? '✅ ROLLBACK SUCCESSFUL' : '❌ ROLLBACK FAILED');
      console.log('═'.repeat(60) + '\n');
      process.exit(result.success ? 0 : 1);
    }
    
    if (verifyOnly) {
      const stats = await verifyMigration();
      console.log('\n' + '═'.repeat(60));
      console.log('✅ VERIFICATION COMPLETE');
      console.log('═'.repeat(60) + '\n');
      process.exit(0);
    }
    
    const result = await runMigration(dryRun);
    
    console.log('\n' + '═'.repeat(60));
    console.log(result.success ? '✅ MIGRATION SUCCESSFUL' : '❌ MIGRATION FAILED');
    console.log('═'.repeat(60));
    
    if (result.details) {
      console.log('\n📊 Final Statistics:');
      console.log(`   Tables Created: ${result.details.newTables.length}`);
      console.log(`   Trades Migrated: ${result.details.migratedCount}`);
      console.log(`   Migration Rate: ${((result.details.migratedCount / result.details.atgeCount) * 100).toFixed(1)}%`);
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Review migration results above');
    console.log('   2. Test new Quantum BTC endpoints');
    console.log('   3. Run parallel deployment (Task 11.2)');
    console.log('   4. Monitor performance metrics');
    console.log('');
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runMigration, verifyMigration, rollbackMigration };
