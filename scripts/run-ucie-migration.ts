/**
 * Run UCIE Cache Table Migration
 * 
 * Creates the ucie_analysis_cache table in Supabase for storing API responses
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running UCIE cache table migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '003_ucie_cache_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('🔧 Executing SQL...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify table exists
    const result = await query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_analysis_cache'
      ORDER BY ordinal_position
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table structure verified:');
      console.log('┌─────────────────────────┬──────────────┬──────────┐');
      console.log('│ Column                  │ Type         │ Nullable │');
      console.log('├─────────────────────────┼──────────────┼──────────┤');
      result.rows.forEach(row => {
        const col = row.column_name.padEnd(23);
        const type = row.data_type.padEnd(12);
        const nullable = row.is_nullable.padEnd(8);
        console.log(`│ ${col} │ ${type} │ ${nullable} │`);
      });
      console.log('└─────────────────────────┴──────────────┴──────────┘\n');
    }

    // Check indexes
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'ucie_analysis_cache'
    `);

    if (indexes.rows.length > 0) {
      console.log('✅ Indexes created:');
      indexes.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
      console.log('');
    }

    console.log('🎉 UCIE cache table is ready for use!\n');
    console.log('Next steps:');
    console.log('1. Deploy the updated preview endpoint');
    console.log('2. Test data storage with: curl https://news.arcane.group/api/ucie/preview-data/BTC');
    console.log('3. Verify data in Supabase Table Editor\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
