/**
 * Run Quantum API Cache Migration
 * 
 * Creates the quantum_api_cache table for API response caching.
 * Task: 12.4 - Optimize API calls
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function runMigration() {
  console.log('🚀 Running Quantum API Cache Migration...\n');
  
  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', 'quantum-btc', '007_create_api_cache_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await query(statement);
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists (skipping)\n`);
        } else {
          throw error;
        }
      }
    }
    
    // Verify table created
    console.log('🔍 Verifying table creation...');
    const result = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quantum_api_cache'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Table quantum_api_cache was not created');
    }
    
    console.log(`✅ Table quantum_api_cache created with ${result.rows.length} columns:\n`);
    for (const row of result.rows) {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    }
    
    // Verify indexes
    console.log('\n🔍 Verifying indexes...');
    const indexResult = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'quantum_api_cache'
    `);
    
    console.log(`✅ Created ${indexResult.rows.length} indexes:\n`);
    for (const row of indexResult.rows) {
      console.log(`   - ${row.indexname}`);
    }
    
    // Test cache operations
    console.log('\n🧪 Testing cache operations...');
    
    // Test insert
    await query(`
      INSERT INTO quantum_api_cache (
        symbol, cache_type, data, data_quality_score, expires_at
      ) VALUES (
        'BTC', 'test', '{"test": true}', 100, NOW() + INTERVAL '60 seconds'
      )
      ON CONFLICT (symbol, cache_type) DO UPDATE SET data = EXCLUDED.data
    `);
    console.log('   ✅ Insert test passed');
    
    // Test select
    const selectResult = await query(`
      SELECT * FROM quantum_api_cache WHERE symbol = 'BTC' AND cache_type = 'test'
    `);
    console.log(`   ✅ Select test passed (found ${selectResult.rows.length} row)`);
    
    // Test delete
    await query(`
      DELETE FROM quantum_api_cache WHERE symbol = 'BTC' AND cache_type = 'test'
    `);
    console.log('   ✅ Delete test passed');
    
    console.log('\n🎉 Migration complete! Cache system is ready.\n');
    
    console.log('📊 Next Steps:');
    console.log('   1. Cache system is now operational');
    console.log('   2. API calls will be automatically cached');
    console.log('   3. Monitor cache hit rates for optimization');
    console.log('   4. Set up daily cleanup: SELECT cleanup_expired_quantum_cache();\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
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
