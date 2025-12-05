/**
 * Create ucie_openai_jobs table
 * Run: npx tsx scripts/create-openai-jobs-table.ts
 */

import { query } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function createOpenAIJobsTable() {
  console.log('🚀 Creating ucie_openai_jobs table...\n');

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'create_ucie_openai_jobs_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration...');
    await query(sql);
    console.log('✅ Migration executed successfully\n');

    // Verify table exists
    console.log('🔍 Verifying table creation...');
    const result = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ucie_openai_jobs'
      ORDER BY ordinal_position
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table created successfully with columns:');
      result.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.error('❌ Table not found after creation');
      process.exit(1);
    }

    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const indexes = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'ucie_openai_jobs'
    `);

    if (indexes.rows.length > 0) {
      console.log('✅ Indexes created:');
      indexes.rows.forEach((row: any) => {
        console.log(`   - ${row.indexname}`);
      });
    }

    console.log('\n🎉 ucie_openai_jobs table ready for use!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

createOpenAIJobsTable();
