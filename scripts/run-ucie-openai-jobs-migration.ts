/**
 * Run UCIE OpenAI Jobs Table Migration
 * 
 * Creates the ucie_openai_jobs table in Supabase production database
 * 
 * Usage: npx tsx scripts/run-ucie-openai-jobs-migration.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Starting UCIE OpenAI Jobs table migration...\n');

  // Read DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('   Please set it in .env.local or pass it directly');
    process.exit(1);
  }

  console.log('📊 Database URL:', databaseUrl.substring(0, 30) + '...');

  // Create connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('\n🔌 Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected to database at:', testResult.rows[0].now);

    // Read migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', 'create_ucie_openai_jobs_table.sql');
    console.log('\n📄 Reading migration file:', migrationPath);
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration SQL loaded (' + migrationSql.length + ' bytes)');

    // Check if table already exists
    console.log('\n🔍 Checking if table already exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ucie_openai_jobs'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('⚠️  Table ucie_openai_jobs already exists');
      console.log('   Skipping table creation, but will ensure indexes exist...');
      
      // Just run the index creation part
      const indexSql = `
        CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_symbol ON ucie_openai_jobs(symbol);
        CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_user_id ON ucie_openai_jobs(user_id);
        CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_status ON ucie_openai_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_ucie_openai_jobs_created_at ON ucie_openai_jobs(created_at);
      `;
      
      await pool.query(indexSql);
      console.log('✅ Indexes verified/created');
    } else {
      // Run full migration
      console.log('\n🔨 Creating table and indexes...');
      await pool.query(migrationSql);
      console.log('✅ Table and indexes created successfully');
    }

    // Verify table structure
    console.log('\n🔍 Verifying table structure...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'ucie_openai_jobs'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });

    // Verify indexes
    console.log('\n🔍 Verifying indexes...');
    const indexesResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'ucie_openai_jobs'
      AND schemaname = 'public';
    `);

    console.log('\n📋 Table indexes:');
    indexesResult.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });

    // Check for any existing jobs
    console.log('\n🔍 Checking for existing jobs...');
    const jobsResult = await pool.query(`
      SELECT COUNT(*) as count, status, COUNT(*) FILTER (WHERE status = 'processing') as processing_count
      FROM ucie_openai_jobs
      GROUP BY status;
    `);

    if (jobsResult.rows.length > 0) {
      console.log('\n📊 Existing jobs:');
      jobsResult.rows.forEach(row => {
        console.log(`   - ${row.status}: ${row.count} jobs`);
      });
    } else {
      console.log('   No existing jobs found (table is empty)');
    }

    console.log('\n✅ ========================================');
    console.log('✅ Migration completed successfully!');
    console.log('✅ ========================================\n');

    console.log('📋 Next steps:');
    console.log('   1. Deploy the updated code to Vercel');
    console.log('   2. Run cleanup endpoint: curl https://news.arcane.group/api/ucie/openai-summary-cleanup');
    console.log('   3. Test new GPT-5.1 analysis flow');
    console.log('   4. Monitor Vercel logs for success indicators\n');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ Migration failed!');
    console.error('❌ ========================================\n');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migration
runMigration();
