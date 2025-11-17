/**
 * Check all constraints and indexes on atge_historical_prices table
 */

import { query } from '../lib/db';

async function checkTableConstraints() {
  console.log('🔍 Checking atge_historical_prices table constraints and indexes...\n');

  try {
    // Check all constraints
    console.log('=== CONSTRAINTS ===');
    const constraints = await query(
      `SELECT
        conname as name,
        contype as type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'atge_historical_prices'::regclass
      ORDER BY conname`
    );

    if (constraints.rows.length > 0) {
      constraints.rows.forEach(row => {
        const typeMap: Record<string, string> = {
          'p': 'PRIMARY KEY',
          'u': 'UNIQUE',
          'f': 'FOREIGN KEY',
          'c': 'CHECK'
        };
        console.log(`  ${row.name} (${typeMap[row.type] || row.type})`);
        console.log(`    ${row.definition}`);
      });
    } else {
      console.log('  No constraints found');
    }

    // Check all indexes
    console.log('\n=== INDEXES ===');
    const indexes = await query(
      `SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'atge_historical_prices'
      ORDER BY indexname`
    );

    if (indexes.rows.length > 0) {
      indexes.rows.forEach(row => {
        console.log(`  ${row.indexname}`);
        console.log(`    ${row.indexdef}`);
      });
    } else {
      console.log('  No indexes found');
    }

    // Check table structure
    console.log('\n=== TABLE COLUMNS ===');
    const columns = await query(
      `SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'atge_historical_prices'
      ORDER BY ordinal_position`
    );

    if (columns.rows.length > 0) {
      columns.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run check
checkTableConstraints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
