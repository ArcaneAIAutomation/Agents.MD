#!/usr/bin/env tsx
import { query } from '../lib/db';

async function checkTables() {
  const result = await query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_name LIKE 'einstein%'
     ORDER BY table_name`
  );
  
  console.log('Einstein tables found:');
  if (result.rows.length === 0) {
    console.log('  (none)');
  } else {
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
  }
  
  process.exit(0);
}

checkTables();
