#!/usr/bin/env tsx
/**
 * Add data_quality_score column to trade_results table
 * Task 5.4 - Quality score stored in trade result
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function addDataQualityScoreColumn() {
  console.log('\n============================================================');
  console.log('🔧 ATGE - Add data_quality_score Column');
  console.log('   Task 5.4 - Quality score stored in trade result');
  console.log('============================================================\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '006_add_data_quality_score_to_trade_results.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Executing migration SQL...\n');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('\n✅ Migration executed successfully!\n');
    
    // Verify column was added
    const columnQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'trade_results'
      AND column_name = 'data_quality_score';
    `;
    
    const columns = await query(columnQuery);
    
    if (columns.rows.length > 0) {
      console.log('✅ Column added successfully:');
      console.log(`   - Name: ${columns.rows[0].column_name}`);
      console.log(`   - Type: ${columns.rows[0].data_type}`);
      console.log(`   - Nullable: ${columns.rows[0].is_nullable}`);
    } else {
      console.log('⚠️  Column was not found after migration');
    }
    
    // Verify index was created
    const indexQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'trade_results'
      AND indexname = 'idx_trade_results_data_quality_score';
    `;
    
    const indexes = await query(indexQuery);
    
    if (indexes.rows.length > 0) {
      console.log('\n✅ Index created successfully:');
      console.log(`   - ${indexes.rows[0].indexname}`);
    }
    
    console.log('\n============================================================');
    console.log('✅ Migration Complete');
    console.log('============================================================\n');
    
    console.log('The data_quality_score column is now available in trade_results table.');
    console.log('Backtesting results will now store the quality score from data validation.\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

addDataQualityScoreColumn();
