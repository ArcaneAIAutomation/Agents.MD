import { query } from '../lib/db';

async function checkSchema() {
  const result = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'trade_results' 
    ORDER BY ordinal_position
  `);
  
  console.log('trade_results columns:');
  result.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
}

checkSchema();
