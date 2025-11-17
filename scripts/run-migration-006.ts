/**
 * Run Migration 006: Add Unique Constraint to ATGE Historical Prices
 */

import { query } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration006() {
  console.log('🚀 Running Migration 006: Add Unique Constraint...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '006_add_unique_constraint_historical_prices.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Extract the ALTER TABLE statement (skip comments and BEGIN/COMMIT)
    const alterStatement = `ALTER TABLE atge_historical_prices
ADD CONSTRAINT unique_historical_price 
UNIQUE (symbol, timestamp, timeframe)`;

    console.log('Executing migration...');
    await query(alterStatement);
    console.log('✅ Migration executed successfully!\n');

    // Verify the constraint was added
    console.log('Verifying constraint...');
    const verifyResult = await query(
      `SELECT
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'atge_historical_prices'::regclass
        AND conname = 'unique_historical_price'`
    );

    if (verifyResult.rows.length > 0) {
      console.log('✅ Constraint verified:');
      console.log(`   Name: ${verifyResult.rows[0].constraint_name}`);
      console.log(`   Definition: ${verifyResult.rows[0].constraint_definition}\n`);
    } else {
      console.log('❌ Constraint not found after migration\n');
    }

    console.log('🎉 Migration 006 complete!');

  } catch (error: any) {
    if (error.code === '42P16') {
      console.log('⚠️  Constraint already exists - skipping migration');
      console.log('✅ Migration 006 already applied\n');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }
}

// Run migration
runMigration006()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
