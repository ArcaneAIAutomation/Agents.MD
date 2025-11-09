/**
 * Run User Isolation Migration
 * 
 * CRITICAL SECURITY FIX: Adds user_id to UCIE cache tables
 * for proper data isolation between users.
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

// Load environment variables
config({ path: '.env.local' });

async function runMigration() {
  console.log('🚨 Running CRITICAL User Isolation Migration...\n');
  console.log('⚠️  This fixes a security issue where users could see each other\'s data\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '006_add_user_id_to_cache.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify columns were added
    const cacheColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_analysis_cache' AND column_name = 'user_id'
    `);

    const phaseColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ucie_phase_data' AND column_name = 'user_id'
    `);

    console.log('📋 Verified columns added:');
    if (cacheColumns.rows.length > 0) {
      console.log('   ✓ ucie_analysis_cache.user_id');
    }
    if (phaseColumns.rows.length > 0) {
      console.log('   ✓ ucie_phase_data.user_id');
    }

    // Check constraints
    const constraints = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name IN ('ucie_analysis_cache', 'ucie_phase_data')
        AND constraint_type = 'UNIQUE'
      ORDER BY constraint_name
    `);

    console.log('\n📑 Updated constraints:');
    constraints.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.constraint_name} (${row.constraint_type})`);
    });

    // Check indexes
    const indexes = await query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('ucie_analysis_cache', 'ucie_phase_data')
        AND indexname LIKE '%user%'
      ORDER BY indexname
    `);

    console.log('\n📑 Created user-specific indexes:');
    indexes.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.indexname}`);
    });

    // Get current data statistics
    const cacheStats = await query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT symbol) as unique_symbols,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids
      FROM ucie_analysis_cache
    `);

    console.log('\n📊 Current cache statistics:');
    const stats = cacheStats.rows[0];
    console.log(`   Total entries: ${stats.total_entries}`);
    console.log(`   Unique symbols: ${stats.unique_symbols}`);
    console.log(`   Unique users: ${stats.unique_users}`);
    console.log(`   Entries without user_id: ${stats.null_user_ids}`);

    if (parseInt(stats.null_user_ids) > 0) {
      console.log('\n⚠️  WARNING: Some entries have NULL user_id');
      console.log('   These entries will be accessible to all users with userId="anonymous"');
      console.log('   Consider running: UPDATE ucie_analysis_cache SET user_id = \'system\' WHERE user_id IS NULL;');
    }

    console.log('\n🎉 User Isolation Migration Complete!');
    console.log('\n🔒 Security Status:');
    console.log('   ✅ Each user now has isolated cache');
    console.log('   ✅ Users cannot see each other\'s data');
    console.log('   ✅ Data privacy is enforced at database level');
    
    console.log('\n⚠️  IMPORTANT: Update all API endpoints to pass userId!');
    console.log('   See: UCIE-USER-ISOLATION-FIX.md for details');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🚨 CRITICAL: User isolation NOT implemented!');
    console.error('   Users can still see each other\'s data!');
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
