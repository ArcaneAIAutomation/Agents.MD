/**
 * Run Migration 006: Fix ucie_openai_analysis UNIQUE constraint
 * 
 * This migration recreates the ucie_openai_analysis table with a proper
 * named UNIQUE constraint to fix the ON CONFLICT error.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running Migration 006: Fix ucie_openai_analysis UNIQUE constraint...\n');
  
  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '006_fix_openai_analysis_constraint.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    console.log('⚠️  WARNING: This will drop and recreate the ucie_openai_analysis table');
    console.log('⚠️  All existing OpenAI summaries will be lost (they will be regenerated)\n');
    
    // Execute migration
    console.log('🔧 Executing migration...');
    await query(migrationSQL);
    
    console.log('✅ Migration 006 completed successfully!\n');
    
    // Verify the constraint exists
    console.log('🔍 Verifying UNIQUE constraint...');
    const result = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'ucie_openai_analysis'
        AND constraint_type = 'UNIQUE'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ UNIQUE constraint verified:');
      result.rows.forEach(row => {
        console.log(`   - ${row.constraint_name} (${row.constraint_type})`);
      });
    } else {
      console.log('❌ WARNING: UNIQUE constraint not found!');
    }
    
    console.log('\n🎉 Migration complete! The ucie_openai_analysis table is now ready.');
    console.log('📝 Next: Deploy to Vercel and test data collection');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
