/**
 * Emergency script to create quantum_api_cache table in production
 * Fixes: relation "quantum_api_cache" does not exist error
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runCacheMigration() {
  console.log('🚀 Running quantum_api_cache table migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations/quantum-btc/007_create_api_cache_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📍 Path:', migrationPath);
    console.log('');
    
    // Execute the migration
    console.log('⚙️  Executing migration...');
    await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const verifyResult = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quantum_api_cache'
      ORDER BY ordinal_position;
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Table verified! Columns:');
      verifyResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
      console.log('');
    } else {
      console.error('❌ Table verification failed - no columns found');
      process.exit(1);
    }
    
    // Test insert
    console.log('🧪 Testing table with sample insert...');
    await query(`
      INSERT INTO quantum_api_cache (
        symbol, cache_type, data, data_quality_score, expires_at
      ) VALUES (
        'TEST', 'test', '{"test": true}', 100, NOW() + INTERVAL '1 minute'
      )
      ON CONFLICT (symbol, cache_type) 
      DO UPDATE SET created_at = NOW();
    `);
    console.log('✅ Test insert successful');
    
    // Clean up test data
    await query("DELETE FROM quantum_api_cache WHERE symbol = 'TEST'");
    console.log('✅ Test data cleaned up\n');
    
    console.log('🎉 Migration complete! The quantum_api_cache table is ready.');
    console.log('');
    console.log('📊 Next steps:');
    console.log('   1. The cache system will now work automatically');
    console.log('   2. API responses will be cached for 5 minutes');
    console.log('   3. Trade generation should be much faster (<100ms with cache)');
    console.log('');
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the migration
runCacheMigration();
