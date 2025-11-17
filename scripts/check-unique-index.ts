import { query } from '../lib/db';

async function check() {
  const result = await query(
    `SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'atge_historical_prices' 
    AND indexname LIKE '%unique%'`
  );
  console.log(JSON.stringify(result.rows, null, 2));
}

check().then(() => process.exit(0));
