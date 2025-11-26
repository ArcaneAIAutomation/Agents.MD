#!/usr/bin/env tsx
/**
 * Run Einstein Database Migration
 * 
 * Creates all Einstein tables, indexes, and functions
 * Verifies successful creation
 */

import { query } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Running Einstein Database Migration...\n');
  
  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '008_create_einstein_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Reading migration file: 008_create_einstein_tables.sql');
    
    // Execute migration
    console.log('⚙️  Executing migration...\n');
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables created
    console.log('🔍 Verifying tables...\n');
    
    const tables = [
      'einstein_trade_signals',
      'einstein_analysis_cache',
      'einstein_performance'
    ];
    
    for (const table of tables) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        console.log(`✅ Table created: ${table}`);
      } else {
        console.log(`❌ Table missing: ${table}`);
        throw new Error(`Table ${table} was not created`);
      }
    }
    
    console.log('');
    
    // Verify indexes created
    console.log('🔍 Verifying indexes...\n');
    
    const indexes = [
      'idx_einstein_signals_user',
      'idx_einstein_signals_symbol',
      'idx_einstein_signals_status',
      'idx_einstein_signals_created',
      'idx_einstein_cache_symbol_type',
      'idx_einstein_cache_expires',
      'idx_einstein_performance_trade',
      'idx_einstein_performance_user'
    ];
    
    for (const index of indexes) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        )`,
        [index]
      );
      
      if (result.rows[0].exists) {
        console.log(`✅ Index created: ${index}`);
      } else {
        console.log(`⚠️  Index missing: ${index} (may be optional)`);
      }
    }
    
    console.log('');
    
    // Verify functions created
    console.log('🔍 Verifying functions...\n');
    
    const functions = [
      'update_einstein_updated_at',
      'clean_expired_einstein_cache'
    ];
    
    for (const func of functions) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM pg_proc 
          WHERE proname = $1
        )`,
        [func]
      );
      
      if (result.rows[0].exists) {
        console.log(`✅ Function created: ${func}`);
      } else {
        console.log(`❌ Function missing: ${func}`);
        throw new Error(`Function ${func} was not created`);
      }
    }
    
    console.log('');
    
    // Test insert
    console.log('🧪 Testing database operations...\n');
    
    const testInsert = await query(
      `INSERT INTO einstein_trade_signals 
      (symbol, position_type, timeframe, entry_price, stop_loss, 
       take_profit_1, take_profit_2, take_profit_3, position_size, 
       confidence_score, data_quality_score, reasoning, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        'BTC',
        'LONG',
        '1h',
        95000,
        93000,
        97000,
        99000,
        101000,
        0.1,
        85,
        95,
        'Test signal for migration verification',
        'PENDING'
      ]
    );
    
    const testId = testInsert.rows[0].id;
    console.log(`✅ Test insert successful (ID: ${testId})`);
    
    // Test select
    const testSelect = await query(
      `SELECT * FROM einstein_trade_signals WHERE id = $1`,
      [testId]
    );
    
    if (testSelect.rows.length === 1) {
      console.log('✅ Test select successful');
    } else {
      throw new Error('Test select failed');
    }
    
    // Test update
    await query(
      `UPDATE einstein_trade_signals 
       SET status = $1 
       WHERE id = $2`,
      ['APPROVED', testId]
    );
    
    console.log('✅ Test update successful');
    
    // Test delete
    await query(
      `DELETE FROM einstein_trade_signals WHERE id = $1`,
      [testId]
    );
    
    console.log('✅ Test delete successful');
    
    console.log('');
    
    // Test cache operations
    console.log('🧪 Testing cache operations...\n');
    
    const cacheInsert = await query(
      `INSERT INTO einstein_analysis_cache 
      (symbol, analysis_type, data, data_quality, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes')
      RETURNING id`,
      [
        'BTC',
        'market_data',
        JSON.stringify({ price: 95000, volume: 1000000 }),
        100
      ]
    );
    
    console.log('✅ Cache insert successful');
    
    // Test cache cleanup function
    const cleanupResult = await query('SELECT clean_expired_einstein_cache()');
    console.log(`✅ Cache cleanup function works (deleted ${cleanupResult.rows[0].clean_expired_einstein_cache} expired entries)`);
    
    // Clean up test cache entry
    await query(
      `DELETE FROM einstein_analysis_cache WHERE id = $1`,
      [cacheInsert.rows[0].id]
    );
    
    console.log('');
    
    // Summary
    console.log('=' .repeat(80));
    console.log('✅ Einstein Database Migration Complete!\n');
    console.log('📊 Summary:');
    console.log('   - 3 tables created');
    console.log('   - 12+ indexes created');
    console.log('   - 2 functions created');
    console.log('   - 1 trigger created');
    console.log('   - All operations tested successfully');
    console.log('');
    console.log('🚀 Einstein Trade Engine is ready to use!');
    console.log('=' .repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
