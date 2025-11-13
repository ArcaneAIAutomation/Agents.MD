/**
 * Run ATGE Monitoring Tables Migration
 * 
 * Creates the missing atge_performance_metrics table and related monitoring tables
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running ATGE Monitoring Tables Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '002_create_atge_monitoring_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Creating monitoring tables...\n');

    // Execute the migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Tables created:');
    console.log('   - atge_error_logs');
    console.log('   - atge_performance_metrics ✨ (FIXED)');
    console.log('   - atge_user_feedback');
    console.log('\n📊 Views created:');
    console.log('   - atge_recent_critical_errors');
    console.log('   - atge_performance_summary_24h');
    console.log('   - atge_feedback_summary');

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    
    const tables = ['atge_error_logs', 'atge_performance_metrics', 'atge_user_feedback'];
    
    for (const table of tables) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n🎉 ATGE monitoring system is now fully operational!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
