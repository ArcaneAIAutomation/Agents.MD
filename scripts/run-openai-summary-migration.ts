/**
 * Run OpenAI Summary Table Migration
 * 
 * Creates the ucie_openai_summary table in Supabase
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

// Load environment variables
config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Running OpenAI Summary Table Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '004_ucie_openai_summary.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('🔗 Connecting to Supabase...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify table was created
    const result = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ucie_openai_summary'
      ORDER BY ordinal_position
    `);

    if (result.rows.length > 0) {
      console.log('📊 Table structure:');
      result.rows.forEach((row: any) => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
      console.log('');
    }

    // Check indexes
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'ucie_openai_summary'
    `);

    if (indexes.rows.length > 0) {
      console.log('🔍 Indexes created:');
      indexes.rows.forEach((row: any) => {
        console.log(`   ${row.indexname}`);
      });
      console.log('');
    }

    console.log('🎉 OpenAI Summary table is ready for use!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
