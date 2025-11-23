/**
 * Run ATGE Verification Columns Migration
 * 
 * Adds verification tracking columns to trade_results and trade_market_snapshot:
 * - last_verified_at (TIMESTAMPTZ) to trade_results
 * - verification_data_source (VARCHAR) to trade_results
 * - sopr_value (DECIMAL) to trade_market_snapshot (Bitcoin only)
 * - mvrv_z_score (DECIMAL) to trade_market_snapshot (Bitcoin only)
 * 
 * Requirements: 4.4
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runVerificationColumnsMigration() {
  console.log('🚀 Running ATGE Verification Columns Migration...\n');

  try {
    // Read migration file
    console.log('📖 Reading migration file: 006_add_verification_columns.sql');
    const migrationPath = join(process.cwd(), 'migrations', '006_add_verification_columns.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute migration
    console.log('⚙️  Executing migration...\n');
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');

    // Verify columns were added
    console.log('🔍 Verifying new columns...\n');
    
    // Check trade_results columns
    console.log('📋 trade_results columns:');
    const tradeResultsColumns = [
      'last_verified_at',
      'verification_data_source'
    ];
    
    for (const column of tradeResultsColumns) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'trade_results' 
          AND column_name = $1
        )`,
        [column]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${column}`);
    }

    // Check trade_market_snapshot columns
    console.log('\n📋 trade_market_snapshot columns:');
    const snapshotColumns = [
      'sopr_value',
      'mvrv_z_score'
    ];
    
    for (const column of snapshotColumns) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'trade_market_snapshot' 
          AND column_name = $1
        )`,
        [column]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${column}`);
    }

    // Verify indexes were created
    console.log('\n📋 Verification indexes:');
    const indexes = [
      'idx_trade_results_last_verified_at',
      'idx_trade_results_verification_source'
    ];
    
    for (const indexName of indexes) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = $1
        )`,
        [indexName]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${indexName}`);
    }

    // Verify views were created
    console.log('\n📋 Verification views:');
    const views = [
      'vw_trade_verification_status',
      'vw_bitcoin_onchain_metrics'
    ];
    
    for (const viewName of views) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [viewName]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${viewName}`);
    }

    // Display column details
    console.log('\n📊 Column Details:\n');
    
    console.log('trade_results verification columns:');
    const trColumns = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'trade_results'
        AND column_name IN ('last_verified_at', 'verification_data_source')
      ORDER BY column_name
    `);
    
    for (const col of trColumns.rows) {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    }

    console.log('\ntrade_market_snapshot Bitcoin metrics:');
    const tmsColumns = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'trade_market_snapshot'
        AND column_name IN ('sopr_value', 'mvrv_z_score')
      ORDER BY column_name
    `);
    
    for (const col of tmsColumns.rows) {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    }

    console.log('\n🎉 Verification columns migration completed successfully!');
    console.log('✅ trade_results now has verification tracking columns');
    console.log('✅ trade_market_snapshot now has Bitcoin on-chain metrics');
    console.log('✅ Indexes created for efficient verification queries');
    console.log('✅ Views created for easy data access');
    console.log('\n📝 Next steps:');
    console.log('   1. Implement /api/atge/verify-trades endpoint');
    console.log('   2. Integrate Glassnode API for SOPR and MVRV data');
    console.log('   3. Update dashboard to display verification status');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

runVerificationColumnsMigration();
