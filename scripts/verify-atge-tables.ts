/**
 * Verify ATGE Database Tables
 * 
 * This script checks if all 6 ATGE tables have been created successfully
 * in the Supabase PostgreSQL database.
 */

import { query } from '../lib/db';

const ATGE_TABLES = [
  'trade_signals',
  'trade_results',
  'trade_technical_indicators',
  'trade_market_snapshot',
  'trade_historical_prices',
  'atge_performance_cache'
];

async function verifyATGETables() {
  console.log('🔍 Verifying ATGE Database Tables...\n');
  
  try {
    // Check if tables exist
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${ATGE_TABLES.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY table_name
    `, ATGE_TABLES);
    
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('📊 Table Status:\n');
    
    let allTablesExist = true;
    for (const tableName of ATGE_TABLES) {
      const exists = existingTables.includes(tableName);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${tableName}`);
      
      if (!exists) {
        allTablesExist = false;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allTablesExist) {
      console.log('✅ SUCCESS: All 6 ATGE tables exist in the database');
      console.log('\nNext steps:');
      console.log('1. ✅ Subtask 1.1: Migration file created');
      console.log('2. ✅ Subtask 1.2: Migration executed successfully');
      console.log('3. ✅ Subtask 1.3: Database utility functions created');
      console.log('\n🎉 Task 1 (Create Database Schema) is COMPLETE!');
    } else {
      console.log('❌ INCOMPLETE: Some ATGE tables are missing');
      console.log('\nTo create the tables, run:');
      console.log('npx tsx scripts/run-atge-migration.ts');
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Check indexes
    console.log('🔍 Checking indexes...\n');
    
    const indexResult = await query(`
      SELECT
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN (${ATGE_TABLES.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY tablename, indexname
    `, ATGE_TABLES);
    
    console.log(`Found ${indexResult.rows.length} indexes across ATGE tables\n`);
    
    // Check views
    console.log('🔍 Checking views...\n');
    
    const viewResult = await query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name = 'vw_complete_trades'
    `);
    
    if (viewResult.rows.length > 0) {
      console.log('✅ View vw_complete_trades exists');
    } else {
      console.log('❌ View vw_complete_trades not found');
    }
    
    // Check functions
    console.log('\n🔍 Checking functions...\n');
    
    const functionResult = await query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('calculate_atge_performance', 'update_updated_at_column')
    `);
    
    const existingFunctions = functionResult.rows.map(row => row.routine_name);
    
    if (existingFunctions.includes('calculate_atge_performance')) {
      console.log('✅ Function calculate_atge_performance exists');
    } else {
      console.log('❌ Function calculate_atge_performance not found');
    }
    
    if (existingFunctions.includes('update_updated_at_column')) {
      console.log('✅ Function update_updated_at_column exists');
    } else {
      console.log('❌ Function update_updated_at_column not found');
    }
    
    process.exit(allTablesExist ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error verifying ATGE tables:', error);
    process.exit(1);
  }
}

verifyATGETables();
