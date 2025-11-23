/**
 * Verify Glassnode columns exist in database
 */

import { query } from '../lib/db';

async function verifyColumns() {
  console.log('🔍 Verifying Glassnode columns in database...\n');
  
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trade_market_snapshot'
        AND column_name IN ('sopr_value', 'mvrv_z_score')
      ORDER BY column_name
    `);
    
    console.log('Columns in trade_market_snapshot:');
    
    if (result.rows.length === 0) {
      console.log('❌ No Glassnode columns found!');
      console.log('   Run migration: migrations/006_add_verification_columns.sql');
      process.exit(1);
    }
    
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    if (result.rows.length === 2) {
      console.log('\n✅ All Glassnode columns exist!');
      console.log('   - sopr_value: Spent Output Profit Ratio');
      console.log('   - mvrv_z_score: Market Value to Realized Value Z-Score');
    } else {
      console.log(`\n⚠️  Expected 2 columns, found ${result.rows.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying columns:', error);
    process.exit(1);
  }
}

verifyColumns();
