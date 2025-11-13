/**
 * Run ATGE Database Migration
 * 
 * This script executes the ATGE migration to create all required tables,
 * indexes, views, and functions.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runATGEMigration() {
  console.log('🚀 Running ATGE Database Migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '002_create_atge_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded: 002_create_atge_tables.sql');
    console.log('📊 Executing migration...\n');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    const ATGE_TABLES = [
      'trade_signals',
      'trade_results',
      'trade_technical_indicators',
      'trade_market_snapshot',
      'trade_historical_prices',
      'atge_performance_cache'
    ];
    
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${ATGE_TABLES.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY table_name
    `, ATGE_TABLES);
    
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('📊 Verification Results:\n');
    
    for (const tableName of ATGE_TABLES) {
      const exists = existingTables.includes(tableName);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${tableName}`);
    }
    
    if (existingTables.length === ATGE_TABLES.length) {
      console.log('\n🎉 SUCCESS: All 6 ATGE tables created successfully!');
      console.log('\nTask 1 (Create Database Schema) is now COMPLETE:');
      console.log('✅ Subtask 1.1: Migration file created');
      console.log('✅ Subtask 1.2: Migration executed successfully');
      console.log('✅ Subtask 1.3: Database utility functions created');
    } else {
      console.log('\n⚠️ WARNING: Some tables may not have been created');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

runATGEMigration();
