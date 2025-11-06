import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

query(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'ucie_analysis_cache'
  ORDER BY ordinal_position
`).then(r => {
  console.log('ucie_analysis_cache schema:');
  r.rows.forEach((row: any) => {
    console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
  });
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
