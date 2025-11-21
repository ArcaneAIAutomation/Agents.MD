/**
 * Run AI Analysis Migration
 * 
 * Adds AI analysis columns to atge_trade_signals table
 * Migration: 010_add_ai_analysis_columns.sql
 */

import { query } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🚀 Running AI Analysis Migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '010_add_ai_analysis_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the columns exist
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trade_signals'
      AND column_name IN ('ai_analysis', 'ai_analysis_confidence', 'ai_analysis_generated_at', 'ai_analysis_version')
      ORDER BY column_name;
    `);
    
    console.log('📋 Verification Results:');
    console.log('Columns added:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Verify indexes
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'trade_signals'
      AND indexname LIKE '%ai_analysis%'
      ORDER BY indexname;
    `);
    
    console.log('\n📊 Indexes created:');
    indexes.rows.forEach((row: any) => {
      console.log(`  - ${row.indexname}`);
    });
    
    console.log('\n🎉 AI Analysis system is ready!');
    console.log('Next step: Implement analysis context builder (Task 1.2.1)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
