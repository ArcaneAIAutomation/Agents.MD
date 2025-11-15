/**
 * Run Migration 003 - Add Gemini Analysis Table
 */

import { readFileSync } from 'fs';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running Migration 003: Add Gemini Analysis Table\n');

  try {
    // Read migration file
    const migrationSQL = readFileSync('migrations/003_add_gemini_analysis_table.sql', 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration 003 completed successfully!\n');

    // Verify changes
    console.log('🔍 Verifying changes...\n');

    // Check table exists
    const checkTable = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'ucie_gemini_analysis'
    `);

    if (checkTable.rows.length > 0) {
      console.log('  ✅ ucie_gemini_analysis table created');
    }

    // Check columns
    const checkColumns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ucie_gemini_analysis'
      ORDER BY ordinal_position
    `);

    console.log(`  ✅ Created ${checkColumns.rows.length} columns:`);
    checkColumns.rows.forEach((row: any) => {
      console.log(`     - ${row.column_name} (${row.data_type})`);
    });

    // Check indexes
    const checkIndexes = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'ucie_gemini_analysis'
    `);

    console.log(`  ✅ Created ${checkIndexes.rows.length} indexes`);

    // Check views
    const checkViews = await query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' AND table_name LIKE 'vw_gemini%'
    `);

    console.log(`  ✅ Created ${checkViews.rows.length} views:`);
    checkViews.rows.forEach((row: any) => {
      console.log(`     - ${row.table_name}`);
    });

    console.log('\n✅ Gemini AI analysis tracking is ready!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
