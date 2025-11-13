/**
 * Run ATGE Monitoring Database Migration
 * 
 * Creates tables for error tracking, performance monitoring, and user feedback
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running ATGE Monitoring Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '002_create_atge_monitoring_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📊 Creating monitoring tables...\n');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('Created tables:');
    console.log('  - atge_error_logs');
    console.log('  - atge_performance_metrics');
    console.log('  - atge_user_feedback');
    console.log('\nCreated views:');
    console.log('  - atge_recent_critical_errors');
    console.log('  - atge_performance_summary_24h');
    console.log('  - atge_feedback_summary');
    console.log('\n✨ ATGE Monitoring system is ready!');

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
