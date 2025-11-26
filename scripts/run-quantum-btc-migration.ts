#!/usr/bin/env tsx
/**
 * Quantum BTC Super Spec - Database Migration Runner
 * 
 * This script runs the complete database migration for the Quantum Bitcoin
 * Intelligence Engine, creating all 5 required tables.
 * 
 * Usage:
 *   npx tsx scripts/run-quantum-btc-migration.ts [--rollback]
 * 
 * Options:
 *   --rollback    Run the rollback migration (drops all tables)
 *   --test        Test migration on development database
 *   --verify      Verify migration was successful
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

const MIGRATION_DIR = 'migrations/quantum-btc';
const MIGRATION_FILE = '000_quantum_btc_complete_migration.sql';
const ROLLBACK_FILE = '999_quantum_btc_rollback.sql';

interface MigrationResult {
  success: boolean;
  message: string;
  tablesCreated?: string[];
  indexesCreated?: number;
  error?: string;
}

/**
 * Run the complete migration
 */
async function runMigration(): Promise<MigrationResult> {
  try {
    console.log('🚀 Starting Quantum BTC database migration...\n');
    
    // Read migration file
    const migrationPath = join(process.cwd(), MIGRATION_DIR, MIGRATION_FILE);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded:', MIGRATION_FILE);
    console.log('📊 Executing migration SQL...\n');
    
    // Execute migration
    await query(migrationSQL);
    
    console.log('✅ Migration SQL executed successfully!\n');
    
    // Verify tables were created
    const verification = await verifyMigration();
    
    if (verification.success) {
      console.log('✅ Migration completed successfully!\n');
      console.log('📋 Tables created:');
      verification.tablesCreated?.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log(`\n📊 Total indexes created: ${verification.indexesCreated}\n`);
    }
    
    return verification;
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return {
      success: false,
      message: 'Migration failed',
      error: error.message
    };
  }
}

/**
 * Run the rollback migration
 */
async function runRollback(): Promise<MigrationResult> {
  try {
    console.log('⚠️  Starting Quantum BTC database rollback...\n');
    console.log('⚠️  WARNING: This will DROP all Quantum BTC tables!\n');
    
    // Read rollback file
    const rollbackPath = join(process.cwd(), MIGRATION_DIR, ROLLBACK_FILE);
    const rollbackSQL = readFileSync(rollbackPath, 'utf-8');
    
    console.log('📄 Rollback file loaded:', ROLLBACK_FILE);
    console.log('📊 Executing rollback SQL...\n');
    
    // Execute rollback
    await query(rollbackSQL);
    
    console.log('✅ Rollback SQL executed successfully!\n');
    
    // Verify tables were dropped
    const verification = await verifyRollback();
    
    if (verification.success) {
      console.log('✅ Rollback completed successfully!\n');
      console.log('📋 All Quantum BTC tables have been removed.\n');
    }
    
    return verification;
  } catch (error: any) {
    console.error('❌ Rollback failed:', error.message);
    return {
      success: false,
      message: 'Rollback failed',
      error: error.message
    };
  }
}

/**
 * Verify migration was successful
 */
async function verifyMigration(): Promise<MigrationResult> {
  try {
    // Check tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE 'btc_%' 
        OR table_name LIKE 'quantum_%' 
        OR table_name LIKE 'prediction_%' 
        OR table_name LIKE 'api_%'
      )
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map((row: any) => row.table_name);
    
    // Check indexes exist
    const indexesResult = await query(`
      SELECT COUNT(*) as index_count 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND (
        tablename LIKE 'btc_%' 
        OR tablename LIKE 'quantum_%' 
        OR tablename LIKE 'prediction_%' 
        OR tablename LIKE 'api_%'
      );
    `);
    
    const indexCount = parseInt(indexesResult.rows[0].index_count);
    
    // Expected tables
    const expectedTables = [
      'api_latency_reliability_logs',
      'btc_hourly_snapshots',
      'btc_trades',
      'prediction_accuracy_database',
      'quantum_anomaly_logs'
    ];
    
    const allTablesExist = expectedTables.every(table => tables.includes(table));
    
    if (!allTablesExist) {
      const missingTables = expectedTables.filter(table => !tables.includes(table));
      return {
        success: false,
        message: 'Some tables are missing',
        error: `Missing tables: ${missingTables.join(', ')}`
      };
    }
    
    return {
      success: true,
      message: 'Migration verified successfully',
      tablesCreated: tables,
      indexesCreated: indexCount
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Verification failed',
      error: error.message
    };
  }
}

/**
 * Verify rollback was successful
 */
async function verifyRollback(): Promise<MigrationResult> {
  try {
    // Check no Quantum BTC tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE 'btc_%' 
        OR table_name LIKE 'quantum_%' 
        OR table_name LIKE 'prediction_%' 
        OR table_name LIKE 'api_%'
      );
    `);
    
    const remainingTables = tablesResult.rows.map((row: any) => row.table_name);
    
    if (remainingTables.length > 0) {
      return {
        success: false,
        message: 'Some tables still exist',
        error: `Remaining tables: ${remainingTables.join(', ')}`
      };
    }
    
    return {
      success: true,
      message: 'Rollback verified successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Verification failed',
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isRollback = args.includes('--rollback');
  const isVerify = args.includes('--verify');
  
  try {
    if (isVerify) {
      console.log('🔍 Verifying migration status...\n');
      const result = await verifyMigration();
      
      if (result.success) {
        console.log('✅ Verification passed!');
        console.log(`📋 Tables found: ${result.tablesCreated?.length}`);
        console.log(`📊 Indexes found: ${result.indexesCreated}\n`);
      } else {
        console.error('❌ Verification failed:', result.error);
        process.exit(1);
      }
    } else if (isRollback) {
      const result = await runRollback();
      
      if (!result.success) {
        console.error('❌ Rollback failed:', result.error);
        process.exit(1);
      }
    } else {
      const result = await runMigration();
      
      if (!result.success) {
        console.error('❌ Migration failed:', result.error);
        process.exit(1);
      }
    }
    
    console.log('🎉 Operation completed successfully!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runMigration, runRollback, verifyMigration, verifyRollback };
