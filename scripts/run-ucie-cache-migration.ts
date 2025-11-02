/**
 * UCIE Cache Table Migration Script
 * Bitcoin Sovereign Technology - Database Setup
 * 
 * This script creates the ucie_analysis_cache table and indexes.
 * 
 * Usage:
 *   npx tsx scripts/run-ucie-cache-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, testConnection } from '../lib/db';

async function runMigration() {
  console.log('🚀 Starting UCIE cache table migration...\n');

  // Test database connection
  console.log('📡 Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('❌ Database connection failed. Please check your DATABASE_URL.');
    process.exit(1);
  }

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '002_ucie_cache_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Running migration: 002_ucie_cache_table.sql\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const tableCheck = await query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_name = 'ucie_analysis_cache'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table "ucie_analysis_cache" created successfully');
    } else {
      console.error('❌ Table "ucie_analysis_cache" not found');
      process.exit(1);
    }

    // Verify indexes were created
    console.log('🔍 Verifying indexes...');
    const indexCheck = await query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'ucie_analysis_cache'
      ORDER BY indexname
    `);

    console.log(`✅ Created ${indexCheck.rows.length} indexes:`);
    indexCheck.rows.forEach((row: any) => {
      console.log(`   - ${row.indexname}`);
    });

    // Display table info
    console.log('\n📊 Table Information:');
    const tableInfo = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'ucie_analysis_cache'
      ORDER BY ordinal_position
    `);

    console.log('\nColumns:');
    tableInfo.rows.forEach((row: any) => {
      console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n✅ UCIE cache infrastructure is ready!');
    console.log('\n📚 Next steps:');
    console.log('   1. Set up Vercel KV (Redis) for Level 2 cache');
    console.log('   2. Configure KV_REST_API_URL and KV_REST_API_TOKEN');
    console.log('   3. Set up cron job for cache cleanup: /api/cron/cleanup-cache');
    console.log('   4. Monitor cache performance: /api/ucie/cache-stats');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
