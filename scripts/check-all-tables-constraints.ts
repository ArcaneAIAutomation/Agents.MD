import { query } from '../lib/db';

async function check() {
  console.log('Checking for unique_historical_price constraint on all tables...\n');
  
  const result = await query(
    `SELECT
      n.nspname as schema,
      c.relname as table_name,
      con.conname as constraint_name,
      pg_get_constraintdef(con.oid) as constraint_definition
    FROM pg_constraint con
    JOIN pg_class c ON con.conrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE con.conname = 'unique_historical_price'`
  );
  
  console.log('Found constraints:');
  result.rows.forEach(row => {
    console.log(`  Table: ${row.schema}.${row.table_name}`);
    console.log(`  Constraint: ${row.constraint_name}`);
    console.log(`  Definition: ${row.constraint_definition}\n`);
  });
}

check().then(() => process.exit(0));
