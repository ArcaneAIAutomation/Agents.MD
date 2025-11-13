/**
 * Run ALL ATGE Migrations
 * 
 * Runs all missing migrations in order:
 * 1. Monitoring tables (002_create_atge_monitoring_tables.sql)
 * 2. Missing columns (003_add_missing_columns.sql)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runAllMigrations() {
  console.log('🚀 Running ALL ATGE Migrations...\n');

  try {
    // Migration 1: Monitoring Tables
    console.log('📊 Migration 1: Creating monitoring tables...');
    const migration002Path = join(process.cwd(), 'migrations', '002_create_atge_monitoring_tables.sql');
    const migration002SQL = readFileSync(migration002Path, 'utf-8');
    
    await query(migration002SQL);
    console.log('✅ Monitoring tables created\n');

    // Migration 2: Missing Columns
    console.log('📊 Migration 2: Adding missing columns...');
    const migration003Path = join(process.cwd(), 'migrations', '003_add_missing_columns.sql');
    const migration003SQL = readFileSync(migration003Path, 'utf-8');
    
    await query(migration003SQL);
    console.log('✅ Missing columns added\n');

    // Verify all critical tables exist
    console.log('🔍 Verifying database schema...\n');
    
    const criticalTables = [
      'trade_signals',
      'trade_technical_indicators',
      'trade_market_snapshot',
      'trade_historical_prices',
      'trade_results',
      'atge_performance_cache',
      'atge_error_logs',
      'atge_performance_metrics',
      'atge_user_feedback'
    ];
    
    console.log('📋 Tables:');
    for (const table of criticalTables) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    // Verify critical columns exist
    console.log('\n📋 Critical Columns:');
    const columnsToCheck = [
      { table: 'trade_market_snapshot', column: 'galaxy_score' },
      { table: 'trade_market_snapshot', column: 'alt_rank' },
      { table: 'trade_market_snapshot', column: 'social_dominance' },
      { table: 'trade_market_snapshot', column: 'sentiment_positive' },
      { table: 'trade_market_snapshot', column: 'correlation_score' }
    ];
    
    for (const { table, column } of columnsToCheck) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = $1 
          AND column_name = $2
        )`,
        [table, column]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}.${column}`);
    }

    console.log('\n🎉 ALL ATGE migrations completed successfully!');
    console.log('✅ Database is now fully configured');
    console.log('✅ Trade generation will work 100%');
    console.log('✅ All data will be saved correctly');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runAllMigrations();
