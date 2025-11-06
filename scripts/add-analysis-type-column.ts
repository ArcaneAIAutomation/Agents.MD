import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function addAnalysisTypeColumn() {
  console.log('Adding analysis_type column to ucie_analysis_cache...\n');
  
  try {
    // Add the column
    await query(`
      ALTER TABLE ucie_analysis_cache 
      ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(50) NOT NULL DEFAULT 'unknown';
    `);
    
    console.log('✅ Column added\n');
    
    // Drop the old unique constraint if it exists
    await query(`
      ALTER TABLE ucie_analysis_cache 
      DROP CONSTRAINT IF EXISTS ucie_analysis_cache_symbol_key;
    `);
    
    console.log('✅ Old constraint dropped\n');
    
    // Add new unique constraint on (symbol, analysis_type)
    await query(`
      ALTER TABLE ucie_analysis_cache 
      ADD CONSTRAINT ucie_cache_unique UNIQUE(symbol, analysis_type);
    `);
    
    console.log('✅ New unique constraint added\n');
    
    // Create index on analysis_type
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ucie_cache_type ON ucie_analysis_cache(analysis_type);
    `);
    
    console.log('✅ Index created\n');
    
    // Verify
    const check = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ucie_analysis_cache' 
      AND column_name = 'analysis_type'
    `);
    
    if (check.rows.length > 0) {
      console.log('✅ Column verified:', check.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addAnalysisTypeColumn();
