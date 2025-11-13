/**
 * Run Migration 005: Add Technical Indicator Metadata
 * 
 * Adds data source, timeframe, and quality tracking fields
 */

import { query } from '../lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running migration 005: Add Technical Indicator Metadata...\n');
    
    // Read migration SQL
    const migrationPath = join(process.cwd(), 'migrations', '005_add_indicator_metadata.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Execute migration
    await query(sql);
    
    console.log('✅ Migration 005 completed successfully!');
    console.log('\nAdded columns:');
    console.log('  - data_source (VARCHAR(50))');
    console.log('  - timeframe (VARCHAR(10))');
    console.log('  - calculated_at (TIMESTAMP)');
    console.log('  - data_quality (INTEGER)');
    console.log('  - candle_count (INTEGER)');
    console.log('\nIndexes created:');
    console.log('  - idx_trade_technical_indicators_timeframe');
    console.log('  - idx_trade_technical_indicators_source');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
