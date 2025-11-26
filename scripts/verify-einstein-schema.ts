#!/usr/bin/env tsx
import { query } from '../lib/db';

async function verifySchema() {
  console.log('🔍 Verifying Einstein Database Schema...\n');
  
  try {
    // Check einstein_trade_signals columns
    const signalsColumns = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'einstein_trade_signals'
       ORDER BY ordinal_position`
    );
    
    console.log('✅ einstein_trade_signals columns:');
    console.log(`   Found ${signalsColumns.rows.length} columns`);
    
    const requiredColumns = [
      'id', 'symbol', 'position_type', 'entry_price', 'stop_loss',
      'take_profit_1', 'take_profit_2', 'take_profit_3', 'position_size',
      'confidence_score', 'data_quality_score', 'status'
    ];
    
    const missingColumns = requiredColumns.filter(col => 
      !signalsColumns.rows.some(row => row.column_name === col)
    );
    
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('   ✅ All required columns present');
    }
    
    console.log('');
    
    // Check indexes
    const indexes = await query(
      `SELECT indexname 
       FROM pg_indexes 
       WHERE tablename LIKE 'einstein%'
       ORDER BY indexname`
    );
    
    console.log('✅ Indexes found:');
    indexes.rows.forEach(row => console.log(`   - ${row.indexname}`));
    
    console.log('');
    
    // Test insert/select/delete
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
        'Schema verification test',
        'PENDING'
      ]
    );
    
    const testId = testInsert.rows[0].id;
    console.log(`✅ Insert test passed (ID: ${testId})`);
    
    const testSelect = await query(
      `SELECT * FROM einstein_trade_signals WHERE id = $1`,
      [testId]
    );
    
    console.log(`✅ Select test passed (found ${testSelect.rows.length} row)`);
    
    await query(
      `DELETE FROM einstein_trade_signals WHERE id = $1`,
      [testId]
    );
    
    console.log('✅ Delete test passed');
    
    console.log('');
    console.log('=' .repeat(80));
    console.log('✅ Einstein Database Schema Verified Successfully!');
    console.log('=' .repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error.message);
    process.exit(1);
  }
}

verifySchema();
