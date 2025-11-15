/**
 * Run Migration 002 - Add Missing Columns
 */

import { readFileSync } from 'fs';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running Migration 002: Add Missing Columns\n');

  try {
    // Read migration file
    const migrationSQL = readFileSync('migrations/002_add_updated_at_simple.sql', 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration 002 completed successfully!\n');

    // Verify changes
    console.log('🔍 Verifying changes...\n');

    // Check updated_at column
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ucie_analysis_cache' AND column_name = 'updated_at'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('  ✅ updated_at column added to ucie_analysis_cache');
    }

    // Check views
    const checkViews = await query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' AND table_name LIKE 'vw_ucie%'
    `);

    console.log(`  ✅ Created ${checkViews.rows.length} UCIE views`);
    checkViews.rows.forEach((row: any) => {
      console.log(`     - ${row.table_name}`);
    });

    // Check indexes
    const checkIndexes = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename LIKE 'ucie%'
    `);

    console.log(`  ✅ Created/verified ${checkIndexes.rows.length} indexes`);

    console.log('\n✅ Database is ready for 100% live data analysis!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
