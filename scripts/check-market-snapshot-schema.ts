/**
 * Check trade_market_snapshot table schema
 */

import { query } from '../lib/db';

async function checkSchema() {
  console.log('🔍 Checking trade_market_snapshot table schema...\n');
  
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'trade_market_snapshot'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in trade_market_snapshot table:\n');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkSchema();
