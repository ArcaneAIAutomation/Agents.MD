import { query } from '../lib/db';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function checkSchema() {
  const result = await query(`
    SELECT column_name, data_type, character_maximum_length, column_default
    FROM information_schema.columns 
    WHERE table_name = 'trade_results' 
    ORDER BY ordinal_position
  `);
  
  console.log('\nTrade Results Table Schema:\n');
  result.rows.forEach((row: any) => {
    const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
    const def = row.column_default ? ` DEFAULT ${row.column_default}` : '';
    console.log(`  ${row.column_name}: ${row.data_type}${length}${def}`);
  });
  
  process.exit(0);
}

checkSchema();
