/**
 * Run Whale Watch Database Migration
 * Creates tables for storing whale transactions and analysis
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🐋 Running Whale Watch database migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '004_whale_watch_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Creating tables...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Created tables:');
    console.log('   - whale_transactions');
    console.log('   - whale_analysis');
    console.log('   - whale_watch_cache');
    console.log('\n📊 Created indexes for performance');
    console.log('🔧 Created triggers for updated_at timestamps');
    console.log('🧹 Created cleanup function for expired cache\n');

    // Verify tables exist
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('whale_transactions', 'whale_analysis', 'whale_watch_cache')
      ORDER BY table_name
    `);

    console.log('✅ Verification:');
    result.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Whale Watch database is ready!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
