/**
 * Run Caesar Research Tables Migration
 * 
 * Creates the caesar_research_jobs and caesar_research_sources tables
 * for storing Caesar AI analysis responses.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running Caesar Research Tables Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '005_caesar_responses.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('caesar_research_jobs', 'caesar_research_sources')
      ORDER BY table_name
    `);

    console.log('📋 Created tables:');
    tablesResult.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check indexes
    const indexesResult = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('caesar_research_jobs', 'caesar_research_sources')
      ORDER BY indexname
    `);

    console.log('\n📑 Created indexes:');
    indexesResult.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.indexname}`);
    });

    // Get table statistics
    const statsResult = await query(`
      SELECT 
        'caesar_research_jobs' as table_name,
        COUNT(*) as row_count
      FROM caesar_research_jobs
      UNION ALL
      SELECT 
        'caesar_research_sources' as table_name,
        COUNT(*) as row_count
      FROM caesar_research_sources
    `);

    console.log('\n📊 Table statistics:');
    statsResult.rows.forEach((row: any) => {
      console.log(`   ${row.table_name}: ${row.row_count} rows`);
    });

    console.log('\n🎉 Caesar Research Tables are ready to use!');
    console.log('\n📚 Usage:');
    console.log('   - Store Caesar jobs: storeCaesarJob()');
    console.log('   - Update status: updateCaesarJobStatus()');
    console.log('   - Store results: storeCaesarResults()');
    console.log('   - Get cached research: getCachedCaesarResearch()');
    console.log('   - Get job by ID: getCaesarJobById()');
    console.log('   - Get statistics: getCaesarStats()');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
