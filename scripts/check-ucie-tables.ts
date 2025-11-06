import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ucie_%' ORDER BY table_name")
  .then(r => {
    console.log('UCIE Tables:');
    r.rows.forEach((row: any) => console.log('  -', row.table_name));
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
