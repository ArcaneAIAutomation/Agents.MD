/**
 * Add User Email Fields Migration
 * 
 * Adds user_email column to UCIE cache tables for better tracking and analytics.
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

// Load environment variables
config({ path: '.env.local' });

async function runMigration() {
  console.log('📧 Adding user email fields to UCIE tables...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '007_add_user_email_to_cache.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify columns were added
    const tables = ['ucie_analysis_cache', 'ucie_phase_data', 'caesar_research_jobs'];
    
    console.log('📋 Verified columns added:');
    for (const table of tables) {
      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'user_email'
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`   ✓ ${table}.user_email (${result.rows[0].data_type})`);
      }
    }

    // Check indexes
    const indexes = await query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE '%user_email%'
      ORDER BY tablename, indexname
    `);

    console.log('\n📑 Created email indexes:');
    indexes.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.tablename}.${row.indexname}`);
    });

    // Get statistics
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM ucie_analysis_cache WHERE user_email IS NOT NULL) as cache_with_email,
        (SELECT COUNT(*) FROM ucie_analysis_cache) as cache_total
    `);

    console.log('\n📊 Current statistics:');
    const s = stats.rows[0];
    console.log(`   ucie_analysis_cache: ${s.cache_with_email}/${s.cache_total} entries with email`);

    console.log('\n🎉 User Email Fields Added Successfully!');
    console.log('\n📧 Benefits:');
    console.log('   ✅ Better user tracking and analytics');
    console.log('   ✅ Easier debugging and support');
    console.log('   ✅ Usage reports per user email');
    console.log('   ✅ Cost tracking per user');
    
    console.log('\n💡 Usage:');
    console.log('   setCachedAnalysis(symbol, type, data, ttl, quality, userId, userEmail)');
    console.log('   storeCaesarJob(jobId, query, symbol, units, userId, userEmail)');

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
